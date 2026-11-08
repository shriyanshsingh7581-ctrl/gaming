import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  calculateMinesMultiplier,
} from '../utils/exchangeLogic';
import {
  PlayableExchangeGame,
  ALL_200_EXCHANGE_GAMES,
  ExchangeBetTicket,
  formatTeaExchCdnImage,
} from '../utils/teaExchCatalog';
import { updateCustomerWalletBalance } from '../firebase';
import {
  X,
  Rocket,
  Bomb,
  Flame,
  Coins,
  Sparkles,
  CheckCircle2,
  Ticket,
  Play,
  RotateCcw,
} from 'lucide-react';

interface UniversalGameArenaModalProps {
  game: PlayableExchangeGame | null;
  currentUser: UserProfile | null;
  onClose: () => void;
  onSelectGame: (game: PlayableExchangeGame) => void;
  onRequireAuth: () => void;
  onNotify: (msg: string) => void;
  onTicketUpdated: (ticket: ExchangeBetTicket) => void;
}

const SLOT_SYMBOLS = ['👑', '💎', '⚡', '🦁', '7️⃣', '🍒', '🍀', '🔥'];
const CARD_RANKS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5'];
const CARD_SUITS = ['♠', '♥', '♦', '♣'];

export const UniversalGameArenaModal: React.FC<UniversalGameArenaModalProps> = ({
  game,
  currentUser,
  onClose,
  onSelectGame,
  onRequireAuth,
  onNotify,
  onTicketUpdated,
}) => {
  const [stake, setStake] = useState<number>(200);
  const [activeTicket, setActiveTicket] = useState<ExchangeBetTicket | null>(null);
  const [recentRoundTickets, setRecentRoundTickets] = useState<ExchangeBetTicket[]>([]);
  const [roundResultBanner, setRoundResultBanner] = useState<{
    won: boolean;
    title: string;
    detail: string;
  } | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  // 1. Crash Engine State
  const [crashState, setCrashState] = useState<'idle' | 'flying' | 'crashed' | 'cashed'>('idle');
  const [crashMultiplier, setCrashMultiplier] = useState<number>(1.0);
  const [autoCashoutTarget, setAutoCashoutTarget] = useState<number>(2.5);
  const crashPointRef = useRef<number>(2.4);
  const crashTimerRef = useRef<number | null>(null);
  const activeCrashTicketRef = useRef<ExchangeBetTicket | null>(null);
  const stakeRef = useRef<number>(200);

  // 2. Mines Engine State
  const [minesCount, setMinesCount] = useState<number>(3);
  const [minesActive, setMinesActive] = useState<boolean>(false);
  const [bombPositions, setBombPositions] = useState<Set<number>>(new Set());
  const [revealedTiles, setRevealedTiles] = useState<Set<number>>(new Set());
  const [minesGameOver, setMinesGameOver] = useState<'none' | 'exploded' | 'cashed'>('none');

  // 3. Cards Engine State
  const [dealtCards, setDealtCards] = useState<{
    sideA: string[];
    sideB: string[];
    joker: string;
    winnerLabel: string;
  }>({
    sideA: ['A♠', 'K♠', 'Q♠'],
    sideB: ['J♥', '10♦', '9♣'],
    joker: '7♦',
    winnerLabel: 'Ready to Deal',
  });

  // 4. Roulette / Wheel Engine State
  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [wheelLandingNumber, setWheelLandingNumber] = useState<number | null>(null);
  const [lightningNumber, setLightningNumber] = useState<number>(17);

  // 5. Slots 5x3 Engine State
  const [slotGrid, setSlotGrid] = useState<string[][]>([
    ['👑', '💎', '⚡', '🦁', '7️⃣'],
    ['💎', '👑', '👑', '👑', '⚡'],
    ['🍒', '🍀', '🔥', '💎', '🦁'],
  ]);
  const [slotSpinning, setSlotSpinning] = useState<boolean>(false);

  // 6. Color / Plinko / Dice / Matka State
  const [diceOrColorOutput, setDiceOrColorOutput] = useState<{
    number: number;
    color: 'GREEN' | 'RED' | 'VIOLET';
    multiplier: number;
  }>({
    number: 7,
    color: 'GREEN',
    multiplier: 2.0,
  });

  useEffect(() => {
    stakeRef.current = stake;
  }, [stake]);

  useEffect(() => {
    // Reset transient game states when switching between the 200 games
    if (crashTimerRef.current) window.clearInterval(crashTimerRef.current);
    setCrashState('idle');
    setCrashMultiplier(1.0);
    setMinesActive(false);
    setMinesGameOver('none');
    setRevealedTiles(new Set());
    setRoundResultBanner(null);
    setActiveTicket(null);
  }, [game?.id]);

  useEffect(() => {
    return () => {
      if (crashTimerRef.current) window.clearInterval(crashTimerRef.current);
    };
  }, []);

  if (!game) return null;

  const balance = currentUser?.walletBalance ?? 0;

  /**
   * Places a real-time bet ticket on the server & immediately deducts coins from the user's wallet
   */
  const createRealtimeBetTicketAndDeductCoins = async (
    marketName: string,
    selection: string,
    odds: number,
    betStake: number
  ): Promise<{ ticket: ExchangeBetTicket; balanceAfterBet: number } | null> => {
    if (!currentUser) {
      onRequireAuth();
      return null;
    }
    if (!Number.isFinite(betStake) || betStake < 10) {
      onNotify('Minimum bet stake is ₹10.');
      return null;
    }
    if (betStake > balance) {
      onNotify(
        `Insufficient Wallet Coins (Available: ₹${balance.toLocaleString('en-IN')}). Please Deposit first.`
      );
      return null;
    }

    const nextBalance = Math.max(0, Math.round(balance - betStake));
    await updateCustomerWalletBalance(currentUser.uid, nextBalance);

    let createdTicket: ExchangeBetTicket = {
      ticketId: `TKT-${Date.now().toString().slice(-6)}`,
      uid: currentUser.uid,
      userName: currentUser.name,
      userEmail: currentUser.email,
      category: 'CASINO_GAME',
      eventOrGameId: game.id,
      eventOrGameName: `#${game.gameNumber} ${game.name}`,
      marketName,
      selection,
      betType: 'GAME_BET',
      odds,
      stake: betStake,
      liability: betStake,
      potentialReturn: Math.round(betStake * odds),
      payoutAmount: 0,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/exchange/tickets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUser.uid,
          userName: currentUser.name,
          userEmail: currentUser.email,
          category: 'CASINO_GAME',
          eventOrGameId: game.id,
          eventOrGameName: `#${game.gameNumber} ${game.name}`,
          marketName,
          selection,
          betType: 'GAME_BET',
          odds,
          stake: betStake,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ticket) {
          createdTicket = data.ticket;
        }
      }
    } catch {
      // Fallback to client ticket if offline
    }

    setActiveTicket(createdTicket);
    onTicketUpdated(createdTicket);
    return { ticket: createdTicket, balanceAfterBet: nextBalance };
  };

  /**
   * Settles the real-time bet ticket and credits wallet coins immediately if WON / CASHED_OUT
   */
  const settleRealtimeBetTicket = async (
    ticket: ExchangeBetTicket,
    status: 'WON' | 'LOST' | 'CASHED_OUT',
    payoutAmount: number,
    baseBalanceAfterBet: number,
    resultNote: string
  ) => {
    if (!currentUser) return;

    const finalPayout = status === 'LOST' ? 0 : Math.max(0, Math.round(payoutAmount));
    if (finalPayout > 0) {
      await updateCustomerWalletBalance(
        currentUser.uid,
        Math.round(baseBalanceAfterBet + finalPayout)
      );
    }

    let updatedTicket: ExchangeBetTicket = {
      ...ticket,
      status,
      payoutAmount: finalPayout,
      resultNote,
      settledAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/exchange/tickets/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.ticketId,
          status,
          payoutAmount: finalPayout,
          resultNote,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ticket) {
          updatedTicket = data.ticket;
        }
      }
    } catch {
      // ignore
    }

    setActiveTicket(updatedTicket);
    setRecentRoundTickets((prev) => [updatedTicket, ...prev.slice(0, 7)]);
    onTicketUpdated(updatedTicket);
  };

  /* ==================== 1. CRASH ENGINE (AVIATOR / JETX / SPACEMAN / BALLOON) ==================== */
  const handleStartCrashFlight = async () => {
    if (crashState === 'flying' || busy) return;
    setRoundResultBanner(null);
    setBusy(true);
    const placed = await createRealtimeBetTicketAndDeductCoins(
      `${game.name} Multiplier`,
      `Crash Flight (Auto ${autoCashoutTarget.toFixed(2)}x)`,
      autoCashoutTarget,
      stake
    );
    setBusy(false);
    if (!placed) return;

    activeCrashTicketRef.current = placed.ticket;
    const balanceAfterBet = placed.balanceAfterBet;
    // Generate realistic crash multiplier
    const roll = Math.random();
    const crashTarget =
      roll < 0.35
        ? Number((1.12 + Math.random() * 0.75).toFixed(2))
        : roll < 0.8
        ? Number((1.95 + Math.random() * 3.8).toFixed(2))
        : Number((5.5 + Math.random() * 14.5).toFixed(2));

    crashPointRef.current = crashTarget;
    setCrashMultiplier(1.0);
    setCrashState('flying');

    if (crashTimerRef.current) window.clearInterval(crashTimerRef.current);
    crashTimerRef.current = window.setInterval(() => {
      setCrashMultiplier((prev) => {
        const step = prev < 2 ? 0.05 : prev < 5 ? 0.11 : 0.24;
        const next = Number((prev + step).toFixed(2));

        // Check Auto-Cashout
        if (
          autoCashoutTarget >= 1.2 &&
          next >= autoCashoutTarget &&
          autoCashoutTarget <= crashPointRef.current
        ) {
          if (crashTimerRef.current) window.clearInterval(crashTimerRef.current);
          setCrashState('cashed');
          const winCoins = Math.round(stakeRef.current * autoCashoutTarget);
          if (activeCrashTicketRef.current) {
            void settleRealtimeBetTicket(
              activeCrashTicketRef.current,
              'CASHED_OUT',
              winCoins,
              balanceAfterBet,
              `Auto Cashout at ${autoCashoutTarget.toFixed(2)}x`
            );
            activeCrashTicketRef.current = null;
          }
          setRoundResultBanner({
            won: true,
            title: `AUTO CASHED OUT AT ${autoCashoutTarget.toFixed(2)}X!`,
            detail: `+₹${winCoins.toLocaleString('en-IN')} credited to your Wallet in real time!`,
          });
          onNotify(
            `${game.name}: Cashed out at ${autoCashoutTarget.toFixed(2)}x! Won ₹${winCoins.toLocaleString('en-IN')}`
          );
          return autoCashoutTarget;
        }

        // Check Crash
        if (next >= crashPointRef.current) {
          if (crashTimerRef.current) window.clearInterval(crashTimerRef.current);
          setCrashState('crashed');
          if (activeCrashTicketRef.current) {
            void settleRealtimeBetTicket(
              activeCrashTicketRef.current,
              'LOST',
              0,
              balanceAfterBet,
              `Flew away at ${crashPointRef.current.toFixed(2)}x`
            );
            activeCrashTicketRef.current = null;
          }
          setRoundResultBanner({
            won: false,
            title: `FLEW AWAY AT ${crashPointRef.current.toFixed(2)}X`,
            detail: `Ticket settled. Try the next flight!`,
          });
          return crashPointRef.current;
        }
        return next;
      });
    }, 85);
  };

  const handleManualCrashCashout = async () => {
    if (!currentUser || crashState !== 'flying' || !activeCrashTicketRef.current) return;
    if (crashTimerRef.current) window.clearInterval(crashTimerRef.current);
    const lockedMult = crashMultiplier;
    setCrashState('cashed');
    const winCoins = Math.round(stake * lockedMult);
    const tkt = activeCrashTicketRef.current;
    activeCrashTicketRef.current = null;

    await settleRealtimeBetTicket(
      tkt,
      'CASHED_OUT',
      winCoins,
      balance,
      `Manual Cashout at ${lockedMult.toFixed(2)}x`
    );
    setRoundResultBanner({
      won: true,
      title: `CASHED OUT AT ${lockedMult.toFixed(2)}X!`,
      detail: `+₹${winCoins.toLocaleString('en-IN')} added to your Wallet Balance!`,
    });
    onNotify(
      `${game.name}: Cashed out at ${lockedMult.toFixed(2)}x! Won ₹${winCoins.toLocaleString('en-IN')}`
    );
  };

  /* ==================== 2. MINES / 5x5 GRID ENGINE ==================== */
  const handleStartMinesRound = async () => {
    if (minesActive || busy) return;
    setRoundResultBanner(null);
    setBusy(true);
    const placed = await createRealtimeBetTicketAndDeductCoins(
      `${game.name} (${minesCount} Mines)`,
      '5x5 Grid Bet',
      1.5,
      stake
    );
    setBusy(false);
    if (!placed) return;

    const bombs = new Set<number>();
    while (bombs.size < minesCount) {
      bombs.add(Math.floor(Math.random() * 25));
    }
    setBombPositions(bombs);
    setRevealedTiles(new Set());
    setMinesGameOver('none');
    setMinesActive(true);
  };

  const handleClickMineTile = async (idx: number) => {
    if (!minesActive || revealedTiles.has(idx) || !activeTicket) return;
    const nextRevealed = new Set(revealedTiles);
    nextRevealed.add(idx);
    setRevealedTiles(nextRevealed);

    if (bombPositions.has(idx)) {
      setMinesActive(false);
      setMinesGameOver('exploded');
      await settleRealtimeBetTicket(
        activeTicket,
        'LOST',
        0,
        balance,
        `Hit Mine on Tile #${idx + 1}`
      );
      setRoundResultBanner({
        won: false,
        title: `BOOM! MINE HIT ON TILE #${idx + 1}`,
        detail: `Stake ₹${stake.toLocaleString('en-IN')} settled on Ticket ${activeTicket.ticketId}.`,
      });
    }
  };

  const handleCashoutMinesRound = async () => {
    if (!currentUser || !minesActive || revealedTiles.size === 0 || !activeTicket) return;
    const mult = calculateMinesMultiplier(minesCount, revealedTiles.size);
    const winCoins = Math.round(stake * mult);
    setMinesActive(false);
    setMinesGameOver('cashed');

    await settleRealtimeBetTicket(
      { ...activeTicket, odds: mult },
      'CASHED_OUT',
      winCoins,
      balance,
      `Cleared ${revealedTiles.size} safe tiles (${mult}x)`
    );
    setRoundResultBanner({
      won: true,
      title: `MINES CASHOUT AT ${mult}X!`,
      detail: `+₹${winCoins.toLocaleString('en-IN')} credited to Wallet on Ticket ${activeTicket.ticketId}!`,
    });
    onNotify(`MINES CASHOUT (${mult}x): Won ₹${winCoins.toLocaleString('en-IN')}!`);
  };

  /* ==================== 3, 4, 5, 6. INSTANT REAL-TIME TABLE / ROULETTE / SLOTS / COLOR / PLINKO ==================== */
  const handlePlayInstantSelection = async (option: {
    label: string;
    odds: number;
    color: string;
  }) => {
    if (busy) return;
    setRoundResultBanner(null);
    setBusy(true);

    const placed = await createRealtimeBetTicketAndDeductCoins(
      game.category,
      option.label,
      option.odds,
      stake
    );
    if (!placed) {
      setBusy(false);
      return;
    }

    const { ticket, balanceAfterBet } = placed;

    // Trigger engine-specific visual animation
    if (game.engine === 'slots') {
      setSlotSpinning(true);
    } else if (game.engine === 'roulette_wheel') {
      const targetNum = Math.floor(Math.random() * 37);
      setWheelLandingNumber(targetNum);
      setLightningNumber(Math.floor(Math.random() * 37));
      setWheelAngle((prev) => prev + 1080 + targetNum * 15);
    }

    setTimeout(async () => {
      // Determine fair outcome based on odds
      const winChance = option.odds <= 2.2 ? 0.56 : option.odds <= 5 ? 0.38 : 0.22;
      const won = Math.random() < winChance;

      if (game.engine === 'cards') {
        const randCard = () =>
          `${CARD_RANKS[Math.floor(Math.random() * CARD_RANKS.length)]}${
            CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)]
          }`;
        setDealtCards({
          sideA: [randCard(), randCard(), randCard()],
          sideB: [randCard(), randCard(), randCard()],
          joker: randCard(),
          winnerLabel: won ? `WINNER: ${option.label}` : 'Dealer / Counter Hand Won',
        });
      } else if (game.engine === 'slots') {
        const winSym = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
        const randSym = () => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
        setSlotGrid([
          [randSym(), won ? winSym : randSym(), randSym(), randSym(), winSym],
          won
            ? [winSym, winSym, winSym, winSym, winSym]
            : [randSym(), randSym(), winSym, randSym(), randSym()],
          [randSym(), winSym, randSym(), randSym(), randSym()],
        ]);
        setSlotSpinning(false);
      } else if (game.engine === 'color_plinko_dice') {
        const drawnNum = Math.floor(Math.random() * 10);
        const drawnColor: 'GREEN' | 'RED' | 'VIOLET' =
          drawnNum === 0 || drawnNum === 5
            ? 'VIOLET'
            : drawnNum % 2 === 1
            ? 'GREEN'
            : 'RED';
        setDiceOrColorOutput({
          number: drawnNum,
          color: drawnColor,
          multiplier: option.odds,
        });
      }

      if (won) {
        const payout = Math.round(stake * option.odds);
        await settleRealtimeBetTicket(
          ticket,
          'WON',
          payout,
          balanceAfterBet,
          `Won on ${option.label} (${option.odds}x)`
        );
        setRoundResultBanner({
          won: true,
          title: `YOU WON ₹${payout.toLocaleString('en-IN')} (${option.odds}X)!`,
          detail: `Ticket ${ticket.ticketId} settled as WON · Coins credited to Wallet in real time!`,
        });
        onNotify(
          `${game.name}: WON ₹${payout.toLocaleString('en-IN')} on ${option.label}!`
        );
      } else {
        await settleRealtimeBetTicket(
          ticket,
          'LOST',
          0,
          balanceAfterBet,
          `Settled against ${option.label}`
        );
        setRoundResultBanner({
          won: false,
          title: `ROUND SETTLED · TRY AGAIN`,
          detail: `Ticket ${ticket.ticketId} settled (${option.label}). Stake ₹${stake.toLocaleString('en-IN')} deducted.`,
        });
      }
      setBusy(false);
    }, 550);
  };

  const currentMinesMult = calculateMinesMultiplier(minesCount, revealedTiles.size);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Play ${game.name}`}
      data-testid="universal-game-arena-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 overflow-y-auto"
    >
      <div className="w-full max-w-3xl rounded-3xl bg-[#241e06] border-2 border-[#ffd739] shadow-[0_24px_70px_rgba(0,0,0,0.92)] overflow-hidden my-auto">
        {/* Top Game Arena Header with Real Game Thumbnail (`imgUrl`) & Live Coin Balance */}
        <div className="bg-gradient-to-r from-[#241e06] via-[#42370b] to-[#241e06] border-b border-[#ffd739]/30 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-14 rounded-xl overflow-hidden bg-[#1a1504] border border-[#ffd739]/50 shrink-0 shadow">
              <img
                src={formatTeaExchCdnImage(game.imgUrl, 160, 80)}
                alt={game.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#ffd739] text-black font-mono-tabular font-black text-[11px] shrink-0">
                  #{game.gameNumber}/200
                </span>
                <h2 className="font-shark italic font-black text-base sm:text-xl text-[#ffd739] uppercase truncate">
                  {game.name}
                </h2>
              </div>
              <p className="text-[11px] text-amber-100/80 truncate mt-0.5">
                {game.rawProvider || game.provider} · {game.category} · RTP {game.rtp} · Max {game.maxMultiplier}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Switcher across all 200 Games */}
            <select
              aria-label="Switch Playable Game"
              value={game.id}
              onChange={(e) => {
                const found = ALL_200_EXCHANGE_GAMES.find((g) => g.id === e.target.value);
                if (found) onSelectGame(found);
              }}
              className="hidden sm:block max-w-[185px] px-2.5 py-1.5 rounded-xl bg-[#42370b] border border-[#ffd739]/40 text-xs font-bold text-white focus:outline-none focus:border-[#ffd739]"
            >
              {ALL_200_EXCHANGE_GAMES.map((g) => (
                <option key={g.id} value={g.id}>
                  #{g.gameNumber} {g.name}
                </option>
              ))}
            </select>

            {/* Live Wallet & Coin Balance Display */}
            <div
              data-testid="arena-live-wallet-balance"
              className="px-3 py-1.5 rounded-xl bg-[#42370b] border border-[#ffd739]/60 flex items-center gap-1.5 text-xs"
            >
              <Coins className="w-3.5 h-3.5 text-[#ffd739]" />
              <span className="font-mono-tabular font-black text-[#ffd739]">
                Coins: ₹{balance.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Game Arena"
              className="p-1.5 rounded-xl bg-[#42370b] hover:bg-[#5a4a12] border border-[#ffd739]/30 text-[#ffd739] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Game Canvas & Controls */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Active Real-Time Bet Ticket Strip */}
          {activeTicket && (
            <div
              data-testid="arena-active-bet-ticket"
              className="rounded-xl bg-[#11192c] border border-[#facc15]/40 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#facc15]" />
                <span className="font-mono-tabular font-bold text-white">
                  {activeTicket.ticketId}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-200 font-semibold">
                  {activeTicket.selection} @ {activeTicket.odds}x
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono-tabular text-slate-300">
                  Stake: <strong>₹{activeTicket.stake.toLocaleString('en-IN')}</strong>
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                    activeTicket.status === 'WON' || activeTicket.status === 'CASHED_OUT'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : activeTicket.status === 'LOST'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {activeTicket.status}
                </span>
              </div>
            </div>
          )}

          {/* ==================== ENGINE 1: CRASH / AVIATOR / JETX ==================== */}
          {game.engine === 'crash' && (
            <div className="space-y-4">
              <div
                className="relative h-56 rounded-2xl border border-white/15 flex flex-col items-center justify-center overflow-hidden p-4"
                style={{
                  background: `radial-gradient(circle at 50% 25%, ${game.accentTo}44, ${game.accentFrom}88, #070a10)`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Rocket
                    className={`w-7 h-7 text-[#facc15] ${
                      crashState === 'flying' ? 'animate-bounce' : ''
                    }`}
                  />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-white/80">
                    {game.provider} Live Multiplier Feed
                  </span>
                </div>
                <div className="font-mono-tabular font-black text-5xl sm:text-6xl text-white drop-shadow-[0_0_24px_rgba(250,204,21,0.5)]">
                  {crashMultiplier.toFixed(2)}x
                </div>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[#facc15]">
                  {crashState === 'idle' && 'Place Real-Time Bet to Launch Multiplier'}
                  {crashState === 'flying' && 'LIVE IN FLIGHT — CLICK CASHOUT ANYTIME!'}
                  {crashState === 'crashed' && `FLEW AWAY AT ${crashMultiplier.toFixed(2)}X`}
                  {crashState === 'cashed' && `WINNINGS CREDITED AT ${crashMultiplier.toFixed(2)}X!`}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bet Stake (Coins ₹)
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={stake}
                    onChange={(e) => setStake(Math.max(10, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 font-mono-tabular font-bold text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Auto-Cashout Target (x)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={1.2}
                    value={autoCashoutTarget}
                    onChange={(e) =>
                      setAutoCashoutTarget(Math.max(1.2, Number(e.target.value)))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 font-mono-tabular font-bold text-[#facc15] text-sm"
                  />
                </div>
                <div>
                  {crashState === 'flying' ? (
                    <button
                      type="button"
                      onClick={handleManualCrashCashout}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm uppercase tracking-wide cursor-pointer shadow-lg"
                    >
                      Cashout ₹{Math.round(stake * crashMultiplier).toLocaleString('en-IN')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleStartCrashFlight}
                      className="w-full py-3 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-black text-sm uppercase tracking-wide cursor-pointer shadow-lg disabled:opacity-50"
                    >
                      Place Bet (₹{stake.toLocaleString('en-IN')})
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== ENGINE 2: MINES / 5x5 GRID ==================== */}
          {game.engine === 'mines' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#090d16] p-3 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <Bomb className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-semibold text-slate-300">Mines Risk:</span>
                  {[2, 3, 5, 8].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      disabled={minesActive}
                      onClick={() => setMinesCount(cnt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        minesCount === cnt
                          ? 'bg-[#facc15] text-black'
                          : 'bg-white/5 text-slate-300'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
                <div className="text-xs font-mono-tabular text-emerald-400 font-bold">
                  Current Multiplier: {currentMinesMult}x (Win ₹
                  {Math.round(stake * currentMinesMult).toLocaleString('en-IN')})
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto">
                {Array.from({ length: 25 }).map((_, idx) => {
                  const isRevealed = revealedTiles.has(idx);
                  const isBomb = bombPositions.has(idx);
                  const showBomb =
                    (isRevealed && isBomb) || (minesGameOver !== 'none' && isBomb);

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!minesActive || isRevealed}
                      onClick={() => handleClickMineTile(idx)}
                      className={`h-12 sm:h-14 rounded-xl font-bold text-sm flex items-center justify-center border transition-all cursor-pointer ${
                        showBomb
                          ? 'bg-red-600/90 border-red-400 text-white'
                          : isRevealed
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                          : 'bg-[#131c2e] hover:bg-[#1c2942] border-white/10 text-slate-400'
                      }`}
                    >
                      {showBomb ? '💣' : isRevealed ? '💎' : idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">
                    Bet Stake (Coins ₹)
                  </label>
                  <input
                    type="number"
                    min={10}
                    disabled={minesActive}
                    value={stake}
                    onChange={(e) => setStake(Math.max(10, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 font-mono-tabular font-bold text-white text-sm"
                  />
                </div>
                {minesActive ? (
                  <button
                    type="button"
                    disabled={revealedTiles.size === 0}
                    onClick={handleCashoutMinesRound}
                    className="mt-5 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-sm cursor-pointer"
                  >
                    Cashout ₹{Math.round(stake * currentMinesMult).toLocaleString('en-IN')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartMinesRound}
                    className="mt-5 px-6 py-3 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-black text-sm cursor-pointer"
                  >
                    Start Round (₹{stake.toLocaleString('en-IN')})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ==================== ENGINE 3: INDIAN CASINO & LIVE CARDS ==================== */}
          {game.engine === 'cards' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-b from-[#0a3622] via-[#062819] to-[#090d16] border-2 border-[#facc15]/40 p-4 space-y-4">
                <div className="flex items-center justify-between text-xs text-emerald-200">
                  <span className="font-bold uppercase tracking-wider">
                    Live Dealer Table · {game.name}
                  </span>
                  <span className="font-mono-tabular font-bold text-[#facc15]">
                    {dealtCards.winnerLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-black/45 border border-sky-400/30 p-3 text-center space-y-2">
                    <p className="text-xs font-extrabold text-sky-300 uppercase">
                      Side A (Player / Andar / Dragon)
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {dealtCards.sideA.map((c, i) => (
                        <span
                          key={i}
                          className="w-11 h-14 rounded-lg bg-white text-slate-900 font-mono-tabular font-black text-sm flex items-center justify-center shadow"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/45 border border-rose-400/30 p-3 text-center space-y-2">
                    <p className="text-xs font-extrabold text-rose-300 uppercase">
                      Side B (Banker / Bahar / Tiger)
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {dealtCards.sideB.map((c, i) => (
                        <span
                          key={i}
                          className="w-11 h-14 rounded-lg bg-white text-slate-900 font-mono-tabular font-black text-sm flex items-center justify-center shadow"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== ENGINE 4: ROULETTE & WHEEL SHOWS ==================== */}
          {game.engine === 'roulette_wheel' && (
            <div className="rounded-2xl bg-gradient-to-r from-[#26082c] via-[#130924] to-[#090d16] border border-[#facc15]/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-full border-4 border-[#facc15] bg-gradient-to-tr from-red-600 via-black to-emerald-600 flex items-center justify-center shadow-lg transition-transform duration-500"
                  style={{ transform: `rotate(${wheelAngle}deg)` }}
                >
                  <div className="w-10 h-10 rounded-full bg-[#090d16] border border-[#facc15] flex items-center justify-center font-mono-tabular font-black text-sm text-[#facc15]">
                    {wheelLandingNumber ?? '0'}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase text-[#facc15]">
                    {game.name} Live Wheel
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {wheelLandingNumber !== null
                      ? `Last Winning Pocket: #${wheelLandingNumber}`
                      : 'Select a market below to spin in real time'}
                  </p>
                  <p className="text-xs text-amber-300 mt-0.5">
                    ⚡ Lightning Bonus Number: <strong>#{lightningNumber} (500x)</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==================== ENGINE 5: 5x3 SLOTS & JACKPOTS ==================== */}
          {game.engine === 'slots' && (
            <div className="rounded-2xl bg-gradient-to-b from-[#1e1136] via-[#0e091c] to-[#090d16] border-2 border-[#facc15]/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#facc15] uppercase tracking-wider">
                  🎰 5-Reel Megaways Matrix · {game.name}
                </span>
                <span className="text-purple-200 font-mono-tabular">
                  Max Win {game.maxMultiplier}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {slotGrid.flat().map((sym, idx) => (
                  <div
                    key={idx}
                    className={`h-14 sm:h-16 rounded-xl bg-[#161f35] border border-white/15 flex items-center justify-center text-2xl sm:text-3xl shadow-inner ${
                      slotSpinning ? 'animate-pulse' : ''
                    }`}
                  >
                    {sym}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== ENGINE 6: COLOR / PLINKO / DICE / MATKA ==================== */}
          {game.engine === 'color_plinko_dice' && (
            <div className="rounded-2xl bg-gradient-to-r from-[#1e1038] via-[#11192c] to-[#090d16] border border-white/15 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-[#facc15]">
                  Live Instant Draw · {game.name}
                </p>
                <p className="text-sm text-slate-300 mt-1">
                  Select any Color, Multiplier, or Number below. Coins deduct &amp; settle in real time.
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <div
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono-tabular font-black text-white border-2 border-white/40 ${
                    diceOrColorOutput.color === 'GREEN'
                      ? 'bg-emerald-600'
                      : diceOrColorOutput.color === 'VIOLET'
                      ? 'bg-violet-600'
                      : 'bg-rose-600'
                  }`}
                >
                  <span className="text-lg leading-none">{diceOrColorOutput.number}</span>
                  <span className="text-[9px]">{diceOrColorOutput.color}</span>
                </div>
              </div>
            </div>
          )}

          {/* SHARED STAKE SELECTOR & BET OPTIONS FOR ENGINES 3, 4, 5, 6 */}
          {game.engine !== 'crash' && game.engine !== 'mines' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#090d16] p-3 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Stake (₹):</span>
                  {[100, 200, 500, 1000, 5000].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setStake(chip)}
                      className={`px-2.5 py-1 rounded-lg font-mono-tabular font-extrabold text-xs cursor-pointer ${
                        stake === chip
                          ? 'bg-[#facc15] text-black'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      ₹{chip}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={10}
                  value={stake}
                  onChange={(e) => setStake(Math.max(10, Number(e.target.value)))}
                  className="w-28 px-3 py-1.5 rounded-lg bg-[#131c2e] border border-white/15 font-mono-tabular font-bold text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {game.betOptions.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={busy}
                    onClick={() => handlePlayInstantSelection(opt)}
                    className="p-3.5 rounded-xl border border-white/15 hover:border-[#facc15] bg-[#131c2e] hover:bg-[#19253d] flex items-center justify-between transition-all cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <Play className="w-4 h-4 text-[#facc15] shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm font-extrabold text-white">
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Win ₹{Math.round(stake * opt.odds).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#facc15] text-black font-mono-tabular font-black text-xs">
                      {opt.odds.toFixed(2)}x
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Round Result Feedback Banner */}
          {roundResultBanner && (
            <div
              data-testid="arena-round-result-banner"
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                roundResultBanner.won
                  ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-200'
                  : 'bg-amber-500/15 border-amber-400/40 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {roundResultBanner.won ? (
                  <Sparkles className="w-5 h-5 text-[#facc15] shrink-0" />
                ) : (
                  <RotateCcw className="w-5 h-5 text-amber-300 shrink-0" />
                )}
                <div>
                  <p className="text-xs sm:text-sm font-black uppercase">
                    {roundResultBanner.title}
                  </p>
                  <p className="text-xs opacity-90">{roundResultBanner.detail}</p>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 shrink-0 opacity-80" />
            </div>
          )}

          {/* Recent Session Tickets Mini-History */}
          {recentRoundTickets.length > 0 && (
            <div className="border-t border-white/10 pt-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Recent Real-Time Game Tickets (Synced with API &amp; Wallet)
              </p>
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {recentRoundTickets.map((t) => (
                  <div
                    key={t.ticketId}
                    className="px-3 py-1.5 rounded-lg bg-[#090d16] border border-white/10 flex items-center justify-between text-[11px]"
                  >
                    <span className="font-mono-tabular text-slate-300">
                      {t.ticketId} · {t.selection}
                    </span>
                    <span
                      className={`font-mono-tabular font-bold ${
                        t.status === 'WON' || t.status === 'CASHED_OUT'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {t.status === 'WON' || t.status === 'CASHED_OUT'
                        ? `+₹${t.payoutAmount.toLocaleString('en-IN')}`
                        : `-₹${t.stake.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
