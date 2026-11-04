import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  SPIN_WHEEL_SEGMENTS,
  INITIAL_PRIZE_INVENTORY,
  PrizeInventory,
  SpinRecord,
  DAILY_SPIN_USED_MESSAGE,
  getCurrentIstDateKey,
  getNextIstMidnightMs,
  selectWeightedSpinSegment,
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
      return {
        spinsByUser: parsed.spinsByUser || {},
        spinHistory: parsed.spinHistory || {},
        prizeInventory: {
          ...INITIAL_PRIZE_INVENTORY,
          ...(parsed.prizeInventory || {}),
        },
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
    const todayRecord = userSpins[istDateKey] || null;
    const userHistory = Object.values(userSpins).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );

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
   * - Cryptographic weighted random selection with prize inventory check.
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
        res.status(429).json({
          error: DAILY_SPIN_USED_MESSAGE,
          alreadyUsed: true,
          istDateKey,
          record: existingToday,
          nextResetAtMs,
        });
        return;
      }

      // Cryptographically secure random fraction [0, 1)
      const randomFraction = crypto.randomInt(0, 1_000_000) / 1_000_000;
      const winningSegment = selectWeightedSpinSegment(
        serverSpinDb.prizeInventory,
        randomFraction
      );

      // Decrement prize inventory on server
      const currentStock = serverSpinDb.prizeInventory[winningSegment.id] ?? 0;
      if (currentStock > 0) {
        serverSpinDb.prizeInventory[winningSegment.id] = currentStock - 1;
      }

      const spinId = `spin_${istDateKey.replace(/-/g, '')}_${uid.slice(-6)}_${crypto
        .randomBytes(3)
        .toString('hex')}`;
      const rewardCode =
        winningSegment.category === 'try_again'
          ? 'TRY-TOMORROW'
          : `SHARK-${winningSegment.id.toUpperCase()}-${crypto
              .randomBytes(2)
              .toString('hex')
              .toUpperCase()}`;

      let claimStatus: SpinRecord['claimStatus'] = 'No Prize';
      if (winningSegment.category === 'cash_reward') {
        claimStatus = 'Credited';
      } else if (winningSegment.category === 'bonus') {
        claimStatus = 'Active Bonus';
      } else if (winningSegment.category === 'physical') {
        claimStatus = 'Pending Admin Verification';
      }

      const record: SpinRecord = {
        spinId,
        uid,
        userName,
        userEmail,
        userPhone,
        istDateKey,
        segmentIndex: winningSegment.index,
        prizeId: winningSegment.id,
        prizeLabel: winningSegment.label,
        category: winningSegment.category,
        cashAmount: winningSegment.cashAmount,
        bonusPercent: winningSegment.bonusPercent,
        rewardCode,
        rewardCredited: winningSegment.category === 'cash_reward',
        requiresAdminVerification: winningSegment.requiresAdminVerification,
        claimStatus,
        createdAt: new Date(nowMs).toISOString(),
      };

      serverSpinDb.spinsByUser[uid][istDateKey] = record;
      serverSpinDb.spinHistory[spinId] = record;
      saveServerSpinDb(serverSpinDb);

      res.json({
        success: true,
        istDateKey,
        record,
        segment: winningSegment,
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
