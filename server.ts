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
import {
  INITIAL_LIVE_SPORTS_MATCHES,
  INITIAL_RECENT_BIG_WINS,
  ALL_200_EXCHANGE_GAMES,
  LiveSportsMatch,
  RecentBigWinItem,
  ExchangeBetTicket,
  calculateExchangeBetMath,
  tickLiveSportsMatches,
} from './src/utils/teaExchCatalog';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_SPIN_STORE_PATH = path.join(__dirname, '.spin-server-store.json');
const SERVER_EXCHANGE_STORE_PATH = path.join(__dirname, '.exchange-realtime-store.json');

interface ServerSpinDatabase {
  spinsByUser: Record<string, Record<string, SpinRecord>>;
  spinHistory: Record<string, SpinRecord>;
  prizeInventory: PrizeInventory;
}

interface ServerExchangeRealtimeDatabase {
  matches: LiveSportsMatch[];
  recentBigWins: RecentBigWinItem[];
  tickets: Record<string, ExchangeBetTicket>;
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

function loadServerExchangeDb(): ServerExchangeRealtimeDatabase {
  try {
    if (fs.existsSync(SERVER_EXCHANGE_STORE_PATH)) {
      const raw = fs.readFileSync(SERVER_EXCHANGE_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        matches:
          Array.isArray(parsed.matches) && parsed.matches.length > 0
            ? parsed.matches
            : INITIAL_LIVE_SPORTS_MATCHES,
        recentBigWins:
          Array.isArray(parsed.recentBigWins) && parsed.recentBigWins.length > 0
            ? parsed.recentBigWins
            : INITIAL_RECENT_BIG_WINS,
        tickets:
          parsed.tickets && typeof parsed.tickets === 'object' ? parsed.tickets : {},
      };
    }
  } catch {
    // ignore
  }
  return {
    matches: [...INITIAL_LIVE_SPORTS_MATCHES],
    recentBigWins: [...INITIAL_RECENT_BIG_WINS],
    tickets: {},
  };
}

function saveServerExchangeDb(db: ServerExchangeRealtimeDatabase): void {
  try {
    fs.writeFileSync(SERVER_EXCHANGE_STORE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

const serverSpinDb: ServerSpinDatabase = loadServerSpinDb();
const serverExchangeDb: ServerExchangeRealtimeDatabase = loadServerExchangeDb();
const inFlightSpinLocks = new Set<string>();

// Continuously tick live sports odds on the server every 3 seconds
setInterval(() => {
  serverExchangeDb.matches = tickLiveSportsMatches(serverExchangeDb.matches);
}, 3000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  /**
   * GET /api/exchange/realtime-feed
   * Returns live ticking sports matches, recent big wins, real-time bet tickets, and 200-game catalog count.
   */
  app.get('/api/exchange/realtime-feed', (req, res) => {
    const uid = String(req.query.uid || '').trim();
    const allTickets = Object.values(serverExchangeDb.tickets).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    const userTickets = uid ? allTickets.filter((t) => t.uid === uid) : [];

    res.json({
      serverTime: new Date().toISOString(),
      totalGamesCount: ALL_200_EXCHANGE_GAMES.length,
      matches: serverExchangeDb.matches,
      recentBigWins: serverExchangeDb.recentBigWins.slice(0, 25),
      userTickets: userTickets.slice(0, 100),
      allTickets: allTickets.slice(0, 200),
    });
  });

  /**
   * POST /api/exchange/tickets/place
   * Places a real-time Sports Back/Lay/Fancy bet or 200-Game Casino bet ticket.
   */
  app.post('/api/exchange/tickets/place', (req, res) => {
    const uid = String(req.body?.uid || '').trim();
    const userName = String(req.body?.userName || 'VIP Player').trim();
    const userEmail = String(req.body?.userEmail || '').trim();
    const category =
      req.body?.category === 'CASINO_GAME' ? 'CASINO_GAME' : 'SPORTS_EXCHANGE';
    const eventOrGameId = String(req.body?.eventOrGameId || 'event_1').trim();
    const eventOrGameName = String(req.body?.eventOrGameName || 'Live Match').trim();
    const marketName = String(req.body?.marketName || 'Match Odds').trim();
    const selection = String(req.body?.selection || 'Home').trim();
    const betTypeRaw = String(req.body?.betType || 'BACK').toUpperCase();
    const betType: ExchangeBetTicket['betType'] =
      betTypeRaw === 'LAY' ||
      betTypeRaw === 'YES' ||
      betTypeRaw === 'NO' ||
      betTypeRaw === 'GAME_BET'
        ? (betTypeRaw as ExchangeBetTicket['betType'])
        : 'BACK';
    const odds = Math.max(1.01, Number(req.body?.odds) || 1.9);
    const stake = Math.round(Number(req.body?.stake) || 0);

    if (!uid) {
      res.status(401).json({ error: 'Please log in to place a real-time bet.' });
      return;
    }
    if (stake < 10) {
      res.status(400).json({ error: 'Minimum bet stake is ₹10.' });
      return;
    }

    const math = calculateExchangeBetMath({ betType, odds, stake });
    const ticketId = `TKT-${Date.now().toString().slice(-6)}-${crypto
      .randomBytes(2)
      .toString('hex')
      .toUpperCase()}`;

    const newTicket: ExchangeBetTicket = {
      ticketId,
      uid,
      userName,
      userEmail,
      category,
      eventOrGameId,
      eventOrGameName,
      marketName,
      selection,
      betType,
      odds,
      stake,
      liability: math.liability,
      potentialReturn: math.totalReturn,
      payoutAmount: 0,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    serverExchangeDb.tickets[ticketId] = newTicket;
    saveServerExchangeDb(serverExchangeDb);

    res.json({
      success: true,
      ticket: newTicket,
    });
  });

  /**
   * POST /api/exchange/tickets/settle
   * Settles an open bet ticket or game round in real time (`WON`, `LOST`, `CASHED_OUT`, `VOID`).
   */
  app.post('/api/exchange/tickets/settle', (req, res) => {
    const ticketId = String(req.body?.ticketId || '').trim();
    const outcomeRaw = String(req.body?.status || 'WON').toUpperCase();
    const status: ExchangeBetTicket['status'] =
      outcomeRaw === 'LOST' ||
      outcomeRaw === 'CASHED_OUT' ||
      outcomeRaw === 'VOID'
        ? (outcomeRaw as ExchangeBetTicket['status'])
        : 'WON';
    const customPayout = Number(req.body?.payoutAmount);
    const resultNote = String(req.body?.resultNote || '').trim();

    const ticket = serverExchangeDb.tickets[ticketId];
    if (!ticket) {
      res.status(404).json({ error: 'Bet ticket not found.' });
      return;
    }
    if (ticket.status !== 'OPEN') {
      res.json({ success: true, ticket, alreadySettled: true });
      return;
    }

    let payoutAmount = 0;
    if (status === 'WON') {
      payoutAmount = Number.isFinite(customPayout) && customPayout > 0
        ? Math.round(customPayout)
        : ticket.potentialReturn;
    } else if (status === 'CASHED_OUT') {
      payoutAmount = Number.isFinite(customPayout) && customPayout >= 0
        ? Math.round(customPayout)
        : Math.round(ticket.liability * 1.15);
    } else if (status === 'VOID') {
      payoutAmount = ticket.liability;
    }

    ticket.status = status;
    ticket.payoutAmount = payoutAmount;
    ticket.resultNote = resultNote || `${status} (${ticket.odds}x)`;
    ticket.settledAt = new Date().toISOString();

    serverExchangeDb.tickets[ticketId] = ticket;

    if ((status === 'WON' || status === 'CASHED_OUT') && payoutAmount >= 1000) {
      const winItem: RecentBigWinItem = {
        id: `win_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        playerName: ticket.userName,
        gameName: ticket.eventOrGameName,
        provider: ticket.category === 'CASINO_GAME' ? 'Live Casino' : 'Sports Exchange',
        amount: payoutAmount,
        multiplier: `${ticket.odds.toFixed(2)}x`,
        timestamp: 'Just now',
      };
      serverExchangeDb.recentBigWins = [
        winItem,
        ...serverExchangeDb.recentBigWins.slice(0, 29),
      ];
    }

    saveServerExchangeDb(serverExchangeDb);

    res.json({
      success: true,
      ticket,
    });
  });

  /**
   * POST /api/exchange/sports/toggle-suspend
   * Allows Master Admin or Staff to suspend/unsuspend a live sports match market.
   */
  app.post('/api/exchange/sports/toggle-suspend', (req, res) => {
    const matchId = String(req.body?.matchId || '').trim();
    const target = serverExchangeDb.matches.find((m) => m.id === matchId);
    if (!target) {
      res.status(404).json({ error: 'Match not found.' });
      return;
    }
    target.suspended = !target.suspended;
    saveServerExchangeDb(serverExchangeDb);
    res.json({
      success: true,
      match: target,
      matches: serverExchangeDb.matches,
    });
  });

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
   * - Cryptographic random selection strictly restricted to the 4 eligible bonus segments:
   *   5% Bonus, 10% Bonus, 20% Bonus, and 25% Bonus.
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
