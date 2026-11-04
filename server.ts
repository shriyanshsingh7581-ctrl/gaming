import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_PRIZE_INVENTORY,
  PrizeInventory,
  SpinRecord,
  DAILY_SPIN_USED_MESSAGE,
  getCurrentIstDateKey,
  getNextIstMidnightMs,
  getEligibleBonusSegments,
  selectWeightedSpinSegment,
  sanitizeSpinRecordToEligibleBonus,
} from './src/utils/exchangeLogic';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_SPIN_STORE_PATH = path.join(__dirname, '.spin-server-store.json');

interface ServerSpinDatabase {
  spinsByUser: Record<string, Record<string, SpinRecord>>;
  spinHistory: Record<string, SpinRecord>;
  prizeInventory: PrizeInventory;
}

function loadServerSpinDb(): ServerSpinDatabase {
  try {
    if (fs.existsSync(SERVER_SPIN_STORE_PATH)) {
      const raw = fs.readFileSync(SERVER_SPIN_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      const spinsByUser: Record<string, Record<string, SpinRecord>> = {};
      if (parsed.spinsByUser && typeof parsed.spinsByUser === 'object') {
        for (const [uid, dateMap] of Object.entries(parsed.spinsByUser)) {
          spinsByUser[uid] = {};
          if (dateMap && typeof dateMap === 'object') {
            for (const [dateKey, rec] of Object.entries(dateMap as Record<string, SpinRecord>)) {
              if (rec) {
                spinsByUser[uid][dateKey] = sanitizeSpinRecordToEligibleBonus(rec);
              }
            }
          }
        }
      }
      const spinHistory: Record<string, SpinRecord> = {};
      if (parsed.spinHistory && typeof parsed.spinHistory === 'object') {
        for (const [spinId, rec] of Object.entries(parsed.spinHistory as Record<string, SpinRecord>)) {
          if (rec) {
            spinHistory[spinId] = sanitizeSpinRecordToEligibleBonus(rec);
          }
        }
      }
      return {
        spinsByUser,
        spinHistory,
        prizeInventory: { ...INITIAL_PRIZE_INVENTORY },
      };
    }
  } catch {
    // ignore read errors and initialize fresh store
  }
  return {
    spinsByUser: {},
    spinHistory: {},
    prizeInventory: { ...INITIAL_PRIZE_INVENTORY },
  };
}

function saveServerSpinDb(db: ServerSpinDatabase): void {
  try {
    fs.writeFileSync(SERVER_SPIN_STORE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    // ignore write errors in read-only environments
  }
}

const serverSpinDb: ServerSpinDatabase = loadServerSpinDb();
const inFlightSpinLocks = new Set<string>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  /**
   * GET /api/spin/status?uid=...
   * Returns server-authoritative spin eligibility for the current IST calendar day.
   */
  app.get('/api/spin/status', (req, res) => {
    const uid = String(req.query.uid || '').trim();
    const nowMs = Date.now();
    const istDateKey = getCurrentIstDateKey(nowMs);
    const nextResetAtMs = getNextIstMidnightMs(nowMs);

    if (!uid) {
      res.status(400).json({ error: 'Authentication required to check spin status.' });
      return;
    }

    const userSpins = serverSpinDb.spinsByUser[uid] || {};
    const todayRecord = userSpins[istDateKey]
      ? sanitizeSpinRecordToEligibleBonus(userSpins[istDateKey])
      : null;
    const userHistory = Object.values(userSpins)
      .map((r) => sanitizeSpinRecordToEligibleBonus(r))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json({
      uid,
      istDateKey,
      eligibleToday: !todayRecord,
      todayRecord,
      userHistory,
      prizeInventory: serverSpinDb.prizeInventory,
      nextResetAtMs,
      serverNowMs: nowMs,
    });
  });

  /**
   * POST /api/spin/execute
   * Strict Server-Side Enforcement:
   * - 1 Spin per authenticated user per calendar day (resetting at 12:00 AM IST).
   * - In-flight concurrency lock per user to block simultaneous/duplicate requests.
   * - Cryptographic random selection strictly restricted to the 4 eligible bonus segments:
   *   5% Bonus, 10% Bonus, 20% Bonus, and 25% Bonus.
   *   Physical items or electronic gifts can NEVER be selected.
   */
  app.post('/api/spin/execute', (req, res) => {
    const uid = String(req.body?.uid || '').trim();
    const userName = String(req.body?.userName || 'VIP Player').trim();
    const userEmail = String(req.body?.userEmail || '').trim();
    const userPhone = String(req.body?.userPhone || '').trim();

    if (!uid) {
      res.status(401).json({ error: 'Please log in to spin the wheel.' });
      return;
    }

    if (inFlightSpinLocks.has(uid)) {
      res.status(429).json({
        error: 'Spin request already in progress. Please wait.',
      });
      return;
    }

    inFlightSpinLocks.add(uid);
    try {
      const nowMs = Date.now();
      const istDateKey = getCurrentIstDateKey(nowMs);
      const nextResetAtMs = getNextIstMidnightMs(nowMs);

      if (!serverSpinDb.spinsByUser[uid]) {
        serverSpinDb.spinsByUser[uid] = {};
      }

      const existingToday = serverSpinDb.spinsByUser[uid][istDateKey];
      if (existingToday) {
        const sanitizedExisting = sanitizeSpinRecordToEligibleBonus(existingToday);
        res.status(429).json({
          error: DAILY_SPIN_USED_MESSAGE,
          alreadyUsed: true,
          istDateKey,
          record: sanitizedExisting,
          nextResetAtMs,
        });
        return;
      }

      // Strictly select from the 4 eligible bonus segments (5%, 10%, 20%, 25% Bonus)
      const eligibleBonuses = getEligibleBonusSegments();
      const randomFraction = crypto.randomInt(0, 1_000_000) / 1_000_000;
      const selectedBonus =
        selectWeightedSpinSegment(serverSpinDb.prizeInventory, randomFraction) ||
        eligibleBonuses[crypto.randomInt(0, eligibleBonuses.length)];

      const spinId = `spin_${istDateKey.replace(/-/g, '')}_${uid.slice(-6)}_${crypto
        .randomBytes(3)
        .toString('hex')}`;
      const rewardCode = `SHARK-${selectedBonus.id.toUpperCase()}-${crypto
        .randomBytes(2)
        .toString('hex')
        .toUpperCase()}`;

      const record: SpinRecord = sanitizeSpinRecordToEligibleBonus({
        spinId,
        uid,
        userName,
        userEmail,
        userPhone,
        istDateKey,
        segmentIndex: selectedBonus.index,
        prizeId: selectedBonus.id,
        prizeLabel: selectedBonus.label,
        category: 'bonus',
        cashAmount: 0,
        bonusPercent: selectedBonus.bonusPercent,
        rewardCode,
        rewardCredited: false,
        requiresAdminVerification: false,
        claimStatus: 'Active Bonus',
        createdAt: new Date(nowMs).toISOString(),
      });

      serverSpinDb.spinsByUser[uid][istDateKey] = record;
      serverSpinDb.spinHistory[spinId] = record;
      saveServerSpinDb(serverSpinDb);

      res.json({
        success: true,
        istDateKey,
        record,
        segment: selectedBonus,
        prizeInventory: serverSpinDb.prizeInventory,
        nextResetAtMs,
      });
    } finally {
      inFlightSpinLocks.delete(uid);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SHARK EXCHANGE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
