import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ShieldCheck,
  Volume2,
  VolumeX,
  Zap,
  Trophy,
  Users,
  Crown,
  Lock,
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

type StudioSubArchetype =
  | 'aviator_crash'
  | 'tower_road'
  | 'mines_grid'
  | 'dragon_tiger'
  | 'teen_patti'
  | 'andar_bahar'
  | 'amar_akbar_anthony'
  | 'cards_32'
  | 'lucky_7_hilo'
  | 'baccarat_table'
  | 'cricket_super_over'
  | 'roulette_table'
  | 'crazy_time_wheel'
  | 'jili_slots'
  | 'fishing_boss'
  | 'color_wingo'
  | 'sicbo_dice'
  | 'jhandi_munda'
  | 'plinko_drop'
  | 'keno_board'
  | 'rps_cointoss';

/**
 * Maps each of the 200 games to its exact studio UI archetype so every game looks and plays
 * identically to its real provider screen on teaexch999.com.
 */
function detectStudioSubArchetype(game: PlayableExchangeGame): StudioSubArchetype {
  const n = game.name.toLowerCase();
  const c = (game.gameCode || '').toLowerCase();

  // 1. Tower / Chicken / Road / Stairs / Snakes / Lagori
  if (
    n.includes('chicken') ||
    n.includes('tower') ||
    n.includes('stairs') ||
    n.includes('snakes') ||
    n.includes('lagori') ||
    n.includes('trick or treat') ||
    n.includes('hamsta')
  ) {
    return 'tower_road';
  }

  // 2. Keno
  if (n.includes('keno') || c.includes('keno')) {
    return 'keno_board';
  }

  // 3. Mines
  if (n.includes('mine') || c.includes('mine') || n.includes('goal')) {
    return 'mines_grid';
  }

  // 4. Plinko / Marble Race / Ball & Ball
  if (
    n.includes('plinko') ||
    n.includes('marble race') ||
    n.includes('ball & ball') ||
    n.includes('bubbles')
  ) {
    return 'plinko_drop';
  }

  // 5. Jhandi Munda
  if (n.includes('jhandi') || c.includes('jm101')) {
    return 'jhandi_munda';
  }

  // 6. Rock Paper Scissors / Coin Toss / Coin Flip / Naughty Button / Packs / Deal or No Deal
  if (
    n.includes('rock paper') ||
    n.includes('coin toss') ||
    n.includes('coin flip') ||
    n.includes('naughty button') ||
    n.includes('packs') ||
    n.includes('deal or no deal') ||
    c.includes('rps')
  ) {
    return 'rps_cointoss';
  }

  // 7. Color Prediction / 5D Lottery / Live Prediction
  if (
    n.includes('color') ||
    n.includes('5d lottery') ||
    n.includes('live prediction')
  ) {
    return 'color_wingo';
  }

  // 8. Sic Bo / Bac Bo / Dice
  if (
    n.includes('sic bo') ||
    n.includes('sicbo') ||
    n.includes('bac bo') ||
    n.includes('bacbo') ||
    n.includes('dice') ||
    n.includes('double roll') ||
    n.includes('roll x')
  ) {
    return 'sicbo_dice';
  }

  // 9. Fishing / Dino / Boom Legend / Pirate Queen
  if (
    n.includes('fishing') ||
    n.includes('dinosaur') ||
    n.includes('boom legend') ||
    n.includes('pirate queen')
  ) {
    return 'fishing_boss';
  }

  // 10. Cricket / Super Over / Hand Cricket / Fast Fielder
  if (
    n.includes('super over') ||
    n.includes('cricket') ||
    n.includes('fast fielder')
  ) {
    if (n.includes('cricketx') || n.includes('infinity war')) {
      return 'aviator_crash';
    }
    return 'cricket_super_over';
  }

  // 11. Dragon Tiger
  if (n.includes('dragon tiger')) {
    return 'dragon_tiger';
  }

  // 12. Andar Bahar
  if (n.includes('andar bahar') || n.includes('andhar bahar')) {
    return 'andar_bahar';
  }

  // 13. Amar Akbar Anthony / Akbar Romeo Walter / Bollywood
  if (
    n.includes('amar akbar') ||
    n.includes('akbar romeo') ||
    n.includes('bollywood')
  ) {
    return 'amar_akbar_anthony';
  }

  // 14. 32 Cards
  if (n.includes('32 cards')) {
    return 'cards_32';
  }

  // 15. 7 Up Down / High Low / HiLo / Center Card / 3 Cards Judgement
  if (
    n.includes('7 up') ||
    n.includes('high low') ||
    n.includes('highlow') ||
    n.includes('hi lo') ||
    n.includes('hilo') ||
    n.includes('center card') ||
    n.includes('judgement')
  ) {
    return 'lucky_7_hilo';
  }

  // 16. Teen Patti / Poker / Pusoy
  if (
    n.includes('teenpatti') ||
    n.includes('teen patti') ||
    n.includes('poker') ||
    n.includes('hold') ||
    n.includes('pusoy')
  ) {
    return 'teen_patti';
  }

  // 17. Baccarat / Blackjack / Casino War
  if (
    n.includes('baccarat') ||
    n.includes('bacarrat') ||
    n.includes('blackjack') ||
    n.includes('casino war')
  ) {
    return 'baccarat_table';
  }

  // 18. Crazy Time / Fortune Wheel / The Voice / Race Track
  if (
    n.includes('crazy time') ||
    n.includes('fortune wheel') ||
    n.includes('fortune spin') ||
    n.includes('the voice') ||
    n.includes('race track') ||
    n.includes('twistx')
  ) {
    return 'crazy_time_wheel';
  }

  // 19. Roulette
  if (n.includes('roulette')) {
    return 'roulette_table';
  }

  // 20. Crash / Aviator / Ravan Dahan / JetX / Balloon / Aero / Drone Rush / Limbo
  if (
    game.engine === 'crash' ||
    n.includes('aviator') ||
    n.includes('ravan') ||
    n.includes('jetx') ||
    n.includes('baloon') ||
    n.includes('balloon') ||
    n.includes('aero') ||
    n.includes('crash') ||
    n.includes('helicopter') ||
    n.includes('pilot') ||
    n.includes('limbo') ||
    n.includes('drone') ||
    n.includes('slicer')
  ) {
    return 'aviator_crash';
  }

  // Default to JiLi / Megaways Golden Slot Studio
  return 'jili_slots';
}

const ROULETTE_RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const CARD_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARD_SUITS: { sym: string; color: 'red' | 'black'; name: string }[] = [
  { sym: '♠', color: 'black', name: 'Spade' },
  { sym: '♥', color: 'red', name: 'Heart' },
  { sym: '♣', color: 'black', name: 'Club' },
  { sym: '♦', color: 'red', name: 'Diamond' },
];

function drawRandomCard() {
  const rankIdx = Math.floor(Math.random() * CARD_RANKS.length);
  const suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
  return {
    rank: CARD_RANKS[rankIdx],
    value: rankIdx + 1,
    suit: suit.sym,
    color: suit.color,
  };
}

/**
 * Realistic Playing Card Component used in Dragon Tiger, Teen Patti, Andar Bahar, 32 Cards, Lucky 7, Baccarat
 */
const PlayingCardView: React.FC<{
  rank: string;
  suit: string;
  color: 'red' | 'black';
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
}> = ({ rank, suit, color, size = 'md', highlight = false }) => {
  const dims =
    size === 'lg'
      ? 'w-14 h-20 sm:w-16 sm:h-24 text-base sm:text-lg'
      : size === 'sm'
      ? 'w-9 h-13 text-xs'
      : 'w-11 h-16 sm:w-13 sm:h-19 text-sm';

  return (
    <div
      className={`${dims} rounded-xl bg-gradient-to-br from-white via-slate-50 to-slate-200 border-2 ${
        highlight
          ? 'border-[#ffd739] shadow-[0_0_16px_rgba(255,215,57,0.75)] scale-105'
          : 'border-slate-300 shadow-md'
      } flex flex-col justify-between p-1.5 select-none transition-transform`}
    >
      <div
        className={`font-mono-tabular font-black leading-none text-left ${
          color === 'red' ? 'text-red-600' : 'text-slate-900'
        }`}
      >
        <div>{rank}</div>
        <div className="text-[10px]">{suit}</div>
      </div>
      <div
        className={`text-center text-xl sm:text-2xl leading-none ${
          color === 'red' ? 'text-red-600' : 'text-slate-900'
        }`}
      >
        {suit}
      </div>
      <div
        className={`font-mono-tabular font-black leading-none text-right rotate-180 ${
          color === 'red' ? 'text-red-600' : 'text-slate-900'
        }`}
      >
        <div>{rank}</div>
      </div>
    </div>
  );
};

/**
 * 3D Casino Chip Selector Bar (100, 500, 1K, 2K, 5K, 10K) matching Royal Gaming / Mac88 / Evolution tables
 */
const CasinoChipSelectorBar: React.FC<{
  stake: number;
  onSelectStake: (val: number) => void;
  disabled?: boolean;
}> = ({ stake, onSelectStake, disabled }) => {
  const chips = [
    { value: 100, label: '100', bg: 'from-sky-500 to-blue-700', border: 'border-sky-200' },
    { value: 500, label: '500', bg: 'from-emerald-500 to-green-700', border: 'border-emerald-200' },
    { value: 1000, label: '1K', bg: 'from-amber-400 to-yellow-600', border: 'border-yellow-100' },
    { value: 2000, label: '2K', bg: 'from-purple-500 to-indigo-700', border: 'border-purple-200' },
    { value: 5000, label: '5K', bg: 'from-rose-500 to-red-700', border: 'border-rose-200' },
    { value: 10000, label: '10K', bg: 'from-yellow-300 to-amber-500', border: 'border-white' },
  ];

  return (
    <div className="rounded-2xl bg-[#1a1504] border border-[#ffd739]/35 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[11px] font-extrabold text-[#ffd739] uppercase tracking-wider mr-1 shrink-0">
          Select Chip:
        </span>
        {chips.map((c) => {
          const active = stake === c.value;
          return (
            <button
              key={c.value}
              type="button"
              disabled={disabled}
              onClick={() => onSelectStake(c.value)}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b ${c.bg} border-2 border-dashed ${
                c.border
              } font-mono-tabular font-black text-[11px] text-white flex items-center justify-center shadow-lg transition-all cursor-pointer shrink-0 ${
                active
                  ? 'ring-2 ring-[#ffd739] -translate-y-1 scale-110 shadow-[0_0_16px_rgba(255,215,57,0.65)]'
                  : 'opacity-85 hover:opacity-100'
              }`}
            >
              <span className="drop-shadow">{c.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-[11px] text-amber-200/80 font-bold">Stake (₹):</span>
        <input
          type="number"
          min={10}
          disabled={disabled}
          value={stake}
          onChange={(e) => onSelectStake(Math.max(10, Number(e.target.value)))}
          className="w-24 px-2.5 py-1.5 rounded-xl bg-[#42370b] border border-[#ffd739]/50 font-mono-tabular font-black text-[#ffd739] text-xs text-center focus:outline-none"
        />
      </div>
    </div>
  );
};

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
  const [stakePanel2, setStakePanel2] = useState<number>(500);
  const [activeTicket, setActiveTicket] = useState<ExchangeBetTicket | null>(null);
  const [recentRoundTickets, setRecentRoundTickets] = useState<ExchangeBetTicket[]>([]);
  const [roundResultBanner, setRoundResultBanner] = useState<{
    won: boolean;
    title: string;
    detail: string;
  } | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [roundIdCounter, setRoundIdCounter] = useState<number>(8849210);
  const [roundTimer, setRoundTimer] = useState<number>(14);

  // 1. Spribe Aviator / Crash Studio State
  const [crashState, setCrashState] = useState<'idle' | 'flying' | 'crashed' | 'cashed'>('idle');
  const [crashMultiplier, setCrashMultiplier] = useState<number>(1.0);
  const [autoCashoutTarget, setAutoCashoutTarget] = useState<number>(2.0);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState<boolean>(true);
  const [crashHistory, setCrashHistory] = useState<number[]>([
    1.84, 3.42, 1.12, 14.6, 2.08, 1.45, 6.9, 1.04, 24.5, 1.92, 4.15, 2.35,
  ]);
  const crashPointRef = useRef<number>(2.4);
  const crashMultValueRef = useRef<number>(1.0);
  const crashTimerRef = useRef<number | null>(null);
  const activeCrashTicketRef = useRef<ExchangeBetTicket | null>(null);
  const stakeRef = useRef<number>(200);
  const roundTimerRef = useRef<number>(14);

  // 2. Tower / Chicken Road State
  const [towerActive, setTowerActive] = useState<boolean>(false);
  const [towerLevel, setTowerLevel] = useState<number>(0);
  const [towerCols, setTowerCols] = useState<number>(3);
  const [towerTraps, setTowerTraps] = useState<number[]>([]);
  const [towerPicks, setTowerPicks] = useState<Record<number, number>>({});
  const [towerStatus, setTowerStatus] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');

  // 3. Mines 5x5 State
  const [minesCount, setMinesCount] = useState<number>(3);
  const [minesActive, setMinesActive] = useState<boolean>(false);
  const [bombPositions, setBombPositions] = useState<Set<number>>(new Set());
  const [revealedTiles, setRevealedTiles] = useState<Set<number>>(new Set());
  const [minesGameOver, setMinesGameOver] = useState<'none' | 'exploded' | 'cashed'>('none');

  // 4. Live Indian Card Studio State (Dragon Tiger, Teen Patti, Andar Bahar, 32 Cards, AAA, Lucky 7, Baccarat)
  const [cardTableState, setCardTableState] = useState<{
    cardA: { rank: string; value: number; suit: string; color: 'red' | 'black' };
    cardB: { rank: string; value: number; suit: string; color: 'red' | 'black' };
    cardC: { rank: string; value: number; suit: string; color: 'red' | 'black' };
    handA: { rank: string; value: number; suit: string; color: 'red' | 'black' }[];
    handB: { rank: string; value: number; suit: string; color: 'red' | 'black' }[];
    andarCards: { rank: string; value: number; suit: string; color: 'red' | 'black' }[];
    baharCards: { rank: string; value: number; suit: string; color: 'red' | 'black' }[];
    totals32: { p8: number; p9: number; p10: number; p11: number };
    cricketBalls: string[];
    winnerBadge: string;
    roadmap: string[];
  }>({
    cardA: { rank: 'K', value: 13, suit: '♠', color: 'black' },
    cardB: { rank: '9', value: 9, suit: '♥', color: 'red' },
    cardC: { rank: '7', value: 7, suit: '♦', color: 'red' },
    handA: [
      { rank: 'A', value: 1, suit: '♠', color: 'black' },
      { rank: 'K', value: 13, suit: '♠', color: 'black' },
      { rank: 'Q', value: 12, suit: '♠', color: 'black' },
    ],
    handB: [
      { rank: 'J', value: 11, suit: '♥', color: 'red' },
      { rank: '10', value: 10, suit: '♦', color: 'red' },
      { rank: '9', value: 9, suit: '♣', color: 'black' },
    ],
    andarCards: [
      { rank: '4', value: 4, suit: '♣', color: 'black' },
      { rank: 'Q', value: 12, suit: '♥', color: 'red' },
      { rank: '7', value: 7, suit: '♠', color: 'black' },
    ],
    baharCards: [
      { rank: '10', value: 10, suit: '♦', color: 'red' },
      { rank: '2', value: 2, suit: '♠', color: 'black' },
    ],
    totals32: { p8: 18, p9: 16, p10: 19, p11: 22 },
    cricketBalls: ['4', '1', '6', 'W', '2', '6'],
    winnerBadge: 'BETTING OPEN',
    roadmap: ['D', 'T', 'D', 'D', 'T', 'A', 'B', 'D', 'T', 'D'],
  });

  // 5. Roulette & Crazy Time Wheel State
  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [wheelLandingNumber, setWheelLandingNumber] = useState<number>(17);
  const [lightningNumbers, setLightningNumbers] = useState<
    { num: number; mult: string }[]
  >([
    { num: 7, mult: '100x' },
    { num: 17, mult: '500x' },
    { num: 29, mult: '200x' },
  ]);
  const [rouletteHistory, setRouletteHistory] = useState<number[]>([
    17, 32, 0, 8, 23, 14, 36, 5, 19, 11,
  ]);
  const [crazyTopSlot, setCrazyTopSlot] = useState<{ seg: string; mult: string }>({
    seg: 'CRAZY TIME',
    mult: '25x',
  });

  // 6. JiLi Slots & Multiplier Reel State
  const [slotGrid, setSlotGrid] = useState<string[][]>([
    ['👑', '💎', '🦁'],
    ['👑', '👑', '👑'],
    ['🔥', '💎', '7️⃣'],
  ]);
  const [slotMultiplierReel, setSlotMultiplierReel] = useState<string[]>(['3x', '10x', '5x']);
  const [slotSpinning, setSlotSpinning] = useState<boolean>(false);

  // 7. Color WinGo / Sic Bo / Jhandi Munda / Plinko / Keno / RPS State
  const [wingoHistory, setWingoHistory] = useState<
    { period: string; num: number; size: 'BIG' | 'SMALL'; color: 'GREEN' | 'RED' | 'VIOLET' }[]
  >([
    { period: '20261108141', num: 7, size: 'BIG', color: 'GREEN' },
    { period: '20261108140', num: 2, size: 'SMALL', color: 'RED' },
    { period: '20261108139', num: 5, size: 'BIG', color: 'VIOLET' },
    { period: '20261108138', num: 8, size: 'BIG', color: 'RED' },
    { period: '20261108137', num: 1, size: 'SMALL', color: 'GREEN' },
  ]);
  const [sicBoDice, setSicBoDice] = useState<[number, number, number]>([4, 5, 6]);
  const [jhandiSymbolsResult, setJhandiSymbolsResult] = useState<string[]>([
    '👑',
    '🚩',
    '👑',
    '♠',
    '♥',
    '👑',
  ]);
  const [plinkoLastBucket, setPlinkoLastBucket] = useState<string>('5.6x');
  const [kenoSelectedNums, setKenoSelectedNums] = useState<number[]>([3, 7, 12, 19, 25, 33]);
  const [kenoDrawnNums, setKenoDrawnNums] = useState<number[]>([3, 7, 11, 18, 19, 22, 25, 30, 33, 39]);
  const [rpsState, setRpsState] = useState<{ player: string; dealer: string }>({
    player: '✊ ROCK',
    dealer: '✌️ SCISSORS',
  });

  useEffect(() => {
    stakeRef.current = stake;
  }, [stake]);

  // Live 15-second studio countdown timer for live dealer / WinGo tables
  useEffect(() => {
    const t = window.setInterval(() => {
      if (roundTimerRef.current <= 1) {
        roundTimerRef.current = 15;
        setRoundTimer(15);
        setRoundIdCounter((r) => r + 1);
      } else {
        roundTimerRef.current -= 1;
        setRoundTimer(roundTimerRef.current);
      }
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (crashTimerRef.current) window.clearInterval(crashTimerRef.current);
    crashMultValueRef.current = 1.0;
    setCrashState('idle');
    setCrashMultiplier(1.0);
    setMinesActive(false);
    setMinesGameOver('none');
    setRevealedTiles(new Set());
    setTowerActive(false);
    setTowerStatus('idle');
    setTowerLevel(0);
    setTowerPicks({});
    setRoundResultBanner(null);
    setActiveTicket(null);
  }, [game?.id]);

  useEffect(() => {
    return () => {
      if (crashTimerRef.current) window.clearInterval(crashTimerRef.current);
    };
  }, []);

  const archetype = useMemo(
    () => (game ? detectStudioSubArchetype(game) : 'aviator_crash'),
    [game]
  );

  // Simulated Live Players Feed for Aviator / Crash Studio
  const liveCrashPlayers = useMemo(
    () => [
      { name: 'rah***92', stake: 2000, cashoutAt: 1.45 },
      { name: 'vik***11', stake: 5000, cashoutAt: 1.85 },
      { name: 'king***07', stake: 1500, cashoutAt: 2.1 },
      { name: 'sha***88', stake: 10000, cashoutAt: 2.5 },
      { name: 'anu***24', stake: 500, cashoutAt: 3.2 },
      { name: 'dev***99', stake: 3000, cashoutAt: 4.5 },
      { name: 'mon***45', stake: 1000, cashoutAt: 1.3 },
      { name: 'raj***18', stake: 4000, cashoutAt: 2.8 },
    ],
    [game?.id]
  );

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

  /* ============================================================================
   * 1. SPRIBE AVIATOR / RAVAN DAHAN / JETX / BALLOON CRASH ENGINE
   * ============================================================================ */
  const handleStartCrashFlight = async (customStake?: number) => {
    if (crashState === 'flying' || busy) return;
    const useStake = customStake ?? stake;
    setStake(useStake);
    stakeRef.current = useStake;
    setRoundResultBanner(null);
    setBusy(true);

    const placed = await createRealtimeBetTicketAndDeductCoins(
      `${game.name} Multiplier`,
      autoCashoutEnabled
        ? `Crash Flight (Auto ${autoCashoutTarget.toFixed(2)}x)`
        : 'Crash Flight (Manual Cashout)',
      autoCashoutEnabled ? autoCashoutTarget : 2.0,
      useStake
    );
    setBusy(false);
    if (!placed) return;

    activeCrashTicketRef.current = placed.ticket;
    const balanceAfterBet = placed.balanceAfterBet;
    const roll = Math.random();
    const crashTarget =
      roll < 0.32
        ? Number((1.14 + Math.random() * 0.75).toFixed(2))
        : roll < 0.78
        ? Number((1.95 + Math.random() * 4.2).toFixed(2))
        : Number((6.0 + Math.random() * 18.5).toFixed(2));

    crashPointRef.current = crashTarget;
    crashMultValueRef.current = 1.0;
    setCrashMultiplier(1.0);
    setCrashState('flying');

    if (crashTimerRef.current) window.clearInterval(crashTimerRef.current);
    crashTimerRef.current = window.setInterval(() => {
      const prev = crashMultValueRef.current;
      const step = prev < 2 ? 0.04 : prev < 5 ? 0.09 : 0.22;
      const next = Number((prev + step).toFixed(2));

      if (
        autoCashoutEnabled &&
        autoCashoutTarget >= 1.2 &&
        next >= autoCashoutTarget &&
        autoCashoutTarget <= crashPointRef.current
      ) {
        if (crashTimerRef.current) window.clearInterval(crashTimerRef.current);
        crashMultValueRef.current = autoCashoutTarget;
        setCrashMultiplier(autoCashoutTarget);
        setCrashState('cashed');
        setCrashHistory((h) => [crashPointRef.current, ...h.slice(0, 14)]);
        const winCoins = Math.round(stakeRef.current * autoCashoutTarget);
        if (activeCrashTicketRef.current) {
          const tktToSettle = activeCrashTicketRef.current;
          activeCrashTicketRef.current = null;
          void settleRealtimeBetTicket(
            tktToSettle,
            'CASHED_OUT',
            winCoins,
            balanceAfterBet,
            `Auto Cashout at ${autoCashoutTarget.toFixed(2)}x`
          );
        }
        setRoundResultBanner({
          won: true,
          title: `YOU CASHED OUT AT ${autoCashoutTarget.toFixed(2)}X!`,
          detail: `+₹${winCoins.toLocaleString('en-IN')} Coins credited to your Wallet!`,
        });
        onNotify(
          `${game.name}: Cashed out at ${autoCashoutTarget.toFixed(2)}x! Won ₹${winCoins.toLocaleString('en-IN')}`
        );
        return;
      }

      if (next >= crashPointRef.current) {
        if (crashTimerRef.current) window.clearInterval(crashTimerRef.current);
        crashMultValueRef.current = crashPointRef.current;
        setCrashMultiplier(crashPointRef.current);
        setCrashState('crashed');
        setCrashHistory((h) => [crashPointRef.current, ...h.slice(0, 14)]);
        if (activeCrashTicketRef.current) {
          const tktToSettle = activeCrashTicketRef.current;
          activeCrashTicketRef.current = null;
          void settleRealtimeBetTicket(
            tktToSettle,
            'LOST',
            0,
            balanceAfterBet,
            `Flew away at ${crashPointRef.current.toFixed(2)}x`
          );
        }
        setRoundResultBanner({
          won: false,
          title: `FLEW AWAY AT ${crashPointRef.current.toFixed(2)}X`,
          detail: `Round #${roundIdCounter} settled. Place bet for next flight!`,
        });
        return;
      }

      crashMultValueRef.current = next;
      setCrashMultiplier(next);
    }, 80);
  };

  const handleManualCrashCashout = async () => {
    if (!currentUser || crashState !== 'flying' || !activeCrashTicketRef.current) return;
    if (crashTimerRef.current) window.clearInterval(crashTimerRef.current);
    const lockedMult = crashMultiplier;
    setCrashState('cashed');
    setCrashHistory((h) => [lockedMult, ...h.slice(0, 14)]);
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
      detail: `+₹${winCoins.toLocaleString('en-IN')} Coins added to your Wallet Balance!`,
    });
    onNotify(
      `${game.name}: Cashed out at ${lockedMult.toFixed(2)}x! Won ₹${winCoins.toLocaleString('en-IN')}`
    );
  };

  /* ============================================================================
   * 2. TOWER / CHICKEN GAMES / DRAGON TOWER ENGINE
   * ============================================================================ */
  const TOWER_MULTIPLIERS = [1.31, 1.74, 2.32, 3.1, 4.13, 5.51, 7.35, 10.5];

  const handleStartTowerGame = async () => {
    if (towerActive || busy) return;
    setRoundResultBanner(null);
    setBusy(true);
    const placed = await createRealtimeBetTicketAndDeductCoins(
      `${game.name} Tower`,
      `Level Climb (${towerCols} Cols)`,
      TOWER_MULTIPLIERS[0],
      stake
    );
    setBusy(false);
    if (!placed) return;

    const traps: number[] = [];
    for (let lvl = 0; lvl < 8; lvl++) {
      traps.push(Math.floor(Math.random() * towerCols));
    }
    setTowerTraps(traps);
    setTowerPicks({});
    setTowerLevel(0);
    setTowerStatus('playing');
    setTowerActive(true);
  };

  const handlePickTowerStep = async (lvl: number, col: number) => {
    if (!towerActive || lvl !== towerLevel || !activeTicket) return;
    const nextPicks = { ...towerPicks, [lvl]: col };
    setTowerPicks(nextPicks);

    if (towerTraps[lvl] === col) {
      setTowerActive(false);
      setTowerStatus('lost');
      await settleRealtimeBetTicket(
        activeTicket,
        'LOST',
        0,
        balance,
        `Hit Trap at Level ${lvl + 1}`
      );
      setRoundResultBanner({
        won: false,
        title: `TRAP HIT AT LEVEL ${lvl + 1}!`,
        detail: `Stake ₹${stake.toLocaleString('en-IN')} settled. Start a new climb!`,
      });
    } else if (lvl === 7) {
      const topMult = TOWER_MULTIPLIERS[7];
      const winCoins = Math.round(stake * topMult);
      setTowerActive(false);
      setTowerStatus('won');
      await settleRealtimeBetTicket(
        { ...activeTicket, odds: topMult },
        'WON',
        winCoins,
        balance,
        `Cleared Top Level 8 (${topMult}x)`
      );
      setRoundResultBanner({
        won: true,
        title: `TOP TOWER CLEARED (${topMult}X)! +₹${winCoins.toLocaleString('en-IN')}`,
        detail: `Coins credited immediately to your Wallet!`,
      });
    } else {
      setTowerLevel(lvl + 1);
    }
  };

  const handleCashoutTower = async () => {
    if (!towerActive || towerLevel === 0 || !activeTicket) return;
    const mult = TOWER_MULTIPLIERS[towerLevel - 1];
    const winCoins = Math.round(stake * mult);
    setTowerActive(false);
    setTowerStatus('won');
    await settleRealtimeBetTicket(
      { ...activeTicket, odds: mult },
      'CASHED_OUT',
      winCoins,
      balance,
      `Cashed out at Level ${towerLevel} (${mult}x)`
    );
    setRoundResultBanner({
      won: true,
      title: `CASHED OUT AT LEVEL ${towerLevel} (${mult}X)!`,
      detail: `+₹${winCoins.toLocaleString('en-IN')} Coins added to your Wallet!`,
    });
    onNotify(`${game.name}: Won ₹${winCoins.toLocaleString('en-IN')} (${mult}x)!`);
  };

  /* ============================================================================
   * 3. SPRIBE MINES / TURBO MINES 5x5 ENGINE
   * ============================================================================ */
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

  const handleRandomPickMineTile = () => {
    if (!minesActive) return;
    const unrevealed: number[] = [];
    for (let i = 0; i < 25; i++) {
      if (!revealedTiles.has(i)) unrevealed.push(i);
    }
    if (unrevealed.length > 0) {
      const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      void handleClickMineTile(pick);
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
      detail: `+₹${winCoins.toLocaleString('en-IN')} Coins credited to Wallet on Ticket ${activeTicket.ticketId}!`,
    });
    onNotify(`MINES CASHOUT (${mult}x): Won ₹${winCoins.toLocaleString('en-IN')}!`);
  };

  /* ============================================================================
   * 4–7. UNIVERSAL STUDIO TABLE / ROULETTE / SLOTS / WINGO / SICBO BET HANDLER
   * ============================================================================ */
  const handlePlaceStudioMarketBet = async (option: {
    label: string;
    odds: number;
    marketGroup?: string;
  }) => {
    if (busy) return;
    setRoundResultBanner(null);
    setBusy(true);

    const placed = await createRealtimeBetTicketAndDeductCoins(
      option.marketGroup || game.name,
      option.label,
      option.odds,
      stake
    );
    if (!placed) {
      setBusy(false);
      return;
    }

    const { ticket, balanceAfterBet } = placed;

    // Trigger visual animations
    if (archetype === 'jili_slots') {
      setSlotSpinning(true);
    } else if (archetype === 'roulette_table' || archetype === 'crazy_time_wheel') {
      const targetNum = Math.floor(Math.random() * 37);
      setWheelLandingNumber(targetNum);
      setWheelAngle((prev) => prev + 1440 + targetNum * 19);
      setLightningNumbers([
        { num: Math.floor(Math.random() * 37), mult: '100x' },
        { num: targetNum, mult: '500x' },
        { num: Math.floor(Math.random() * 37), mult: '250x' },
      ]);
      setCrazyTopSlot({
        seg: option.label.split(' ')[0] || 'CRAZY TIME',
        mult: ['2x', '5x', '10x', '25x', '50x'][Math.floor(Math.random() * 5)],
      });
    }

    setTimeout(async () => {
      const winChance =
        option.odds <= 2.2
          ? 0.56
          : option.odds <= 4.5
          ? 0.4
          : option.odds <= 12
          ? 0.28
          : 0.18;
      const won = Math.random() < winChance;

      // Update game-specific table state so the visual cards/dice/wheel match the outcome!
      const cA = drawRandomCard();
      const cB = drawRandomCard();
      const cC = drawRandomCard();

      if (
        archetype === 'dragon_tiger' ||
        archetype === 'teen_patti' ||
        archetype === 'andar_bahar' ||
        archetype === 'amar_akbar_anthony' ||
        archetype === 'cards_32' ||
        archetype === 'lucky_7_hilo' ||
        archetype === 'baccarat_table' ||
        archetype === 'cricket_super_over'
      ) {
        const badgeCode = won
          ? option.label.slice(0, 1).toUpperCase()
          : ['D', 'T', 'A', 'B', '7'][Math.floor(Math.random() * 5)];
        setCardTableState((prev) => ({
          cardA: cA,
          cardB: cB,
          cardC: cC,
          handA: [drawRandomCard(), drawRandomCard(), drawRandomCard()],
          handB: [drawRandomCard(), drawRandomCard(), drawRandomCard()],
          andarCards: [drawRandomCard(), drawRandomCard(), cA],
          baharCards: [drawRandomCard(), cB],
          totals32: {
            p8: 8 + cA.value,
            p9: 9 + cB.value,
            p10: 10 + cC.value,
            p11: 11 + drawRandomCard().value,
          },
          cricketBalls: ['4', '6', won ? '6' : 'W', '2', '4', won ? '6' : '1'],
          winnerBadge: won ? `WINNER: ${option.label}` : `RESULT: ${cA.rank}${cA.suit} vs ${cB.rank}${cB.suit}`,
          roadmap: [badgeCode, ...prev.roadmap.slice(0, 9)],
        }));
      } else if (archetype === 'roulette_table') {
        setRouletteHistory((prev) => [wheelLandingNumber, ...prev.slice(0, 9)]);
      } else if (archetype === 'jili_slots') {
        const syms = ['👑', '💎', '🦁', '7️⃣', '🔥', '🍀', '🏺'];
        const winSym = syms[Math.floor(Math.random() * syms.length)];
        const randSym = () => syms[Math.floor(Math.random() * syms.length)];
        setSlotGrid([
          [randSym(), won ? winSym : randSym(), randSym()],
          won ? [winSym, winSym, winSym] : [randSym(), winSym, randSym()],
          [randSym(), randSym(), winSym],
        ]);
        setSlotMultiplierReel([
          ['1x', '2x', '3x'][Math.floor(Math.random() * 3)],
          won ? `${option.odds}x` : '2x',
          ['5x', '10x', '15x'][Math.floor(Math.random() * 3)],
        ]);
        setSlotSpinning(false);
      } else if (archetype === 'color_wingo') {
        const drawnNum = Math.floor(Math.random() * 10);
        const drawnColor: 'GREEN' | 'RED' | 'VIOLET' =
          drawnNum === 0 || drawnNum === 5
            ? 'VIOLET'
            : drawnNum % 2 === 1
            ? 'GREEN'
            : 'RED';
        const drawnSize: 'BIG' | 'SMALL' = drawnNum >= 5 ? 'BIG' : 'SMALL';
        setWingoHistory((prev) => [
          {
            period: `20261108${String(roundIdCounter).slice(-3)}`,
            num: drawnNum,
            size: drawnSize,
            color: drawnColor,
          },
          ...prev.slice(0, 6),
        ]);
      } else if (archetype === 'sicbo_dice') {
        setSicBoDice([
          1 + Math.floor(Math.random() * 6),
          1 + Math.floor(Math.random() * 6),
          1 + Math.floor(Math.random() * 6),
        ]);
      } else if (archetype === 'jhandi_munda') {
        const jSyms = ['♠', '♣', '♦', '♥', '👑', '🚩'];
        setJhandiSymbolsResult(
          Array.from({ length: 6 }, () => jSyms[Math.floor(Math.random() * jSyms.length)])
        );
      } else if (archetype === 'plinko_drop') {
        setPlinkoLastBucket(`${option.odds}x`);
      } else if (archetype === 'keno_board') {
        const pool = Array.from({ length: 40 }, (_, i) => i + 1);
        const drawn: number[] = [];
        while (drawn.length < 10) {
          const idx = Math.floor(Math.random() * pool.length);
          drawn.push(pool.splice(idx, 1)[0]);
        }
        setKenoDrawnNums(drawn.sort((a, b) => a - b));
      } else if (archetype === 'rps_cointoss') {
        const moves = ['✊ ROCK', '✋ PAPER', '✌️ SCISSORS'];
        setRpsState({
          player: option.label,
          dealer: moves[Math.floor(Math.random() * moves.length)],
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
          title: `WINNER! +₹${payout.toLocaleString('en-IN')} COINS (${option.odds}X)`,
          detail: `Ticket ${ticket.ticketId} (${option.label}) settled as WON · Credited to Wallet!`,
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
          title: `ROUND #${roundIdCounter} SETTLED · TRY NEXT ROUND`,
          detail: `Ticket ${ticket.ticketId} (${option.label}) settled. Stake ₹${stake.toLocaleString('en-IN')} deducted.`,
        });
      }
      setRoundIdCounter((r) => r + 1);
      setBusy(false);
    }, 520);
  };

  const currentMinesMult = calculateMinesMultiplier(minesCount, revealedTiles.size);
  const nextMinesMult = calculateMinesMultiplier(minesCount, revealedTiles.size + 1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Play ${game.name}`}
      data-testid="universal-game-arena-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-3 bg-black/90 overflow-y-auto"
    >
      <div className="w-full max-w-5xl rounded-3xl bg-[#1a1504] border-2 border-[#ffd739] shadow-[0_24px_80px_rgba(0,0,0,0.95)] overflow-hidden my-auto">
        {/* ====================================================================
         * TOP STUDIO BAR (Exact teaexch999.com `/dc/gamev1.1` Studio Header)
         * ==================================================================== */}
        <div className="bg-gradient-to-r from-[#241e06] via-[#42370b] to-[#241e06] border-b border-[#ffd739]/35 px-3.5 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-12 rounded-xl overflow-hidden bg-[#1a1504] border border-[#ffd739]/60 shrink-0 shadow">
              <img
                src={formatTeaExchCdnImage(game.imgUrl, 160, 80)}
                alt={game.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-[#ffd739] text-black font-mono-tabular font-black text-[10px] shrink-0">
                  #{game.gameNumber}/200
                </span>
                <h2 className="font-shark italic font-black text-sm sm:text-lg text-[#ffd739] uppercase truncate">
                  {game.name}
                </h2>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono-tabular text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3" /> Provably Fair
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-amber-100/80 truncate">
                Studio: {game.rawProvider || game.provider} · Round #{roundIdCounter} · Limits ₹{game.minBet} – ₹{game.maxBet.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Switch between all 200 Games */}
            <select
              aria-label="Switch Playable Game"
              value={game.id}
              onChange={(e) => {
                const found = ALL_200_EXCHANGE_GAMES.find((g) => g.id === e.target.value);
                if (found) onSelectGame(found);
              }}
              className="hidden sm:block max-w-[195px] px-2.5 py-1.5 rounded-xl bg-[#241e06] border border-[#ffd739]/40 text-xs font-bold text-white focus:outline-none focus:border-[#ffd739]"
            >
              {ALL_200_EXCHANGE_GAMES.map((g) => (
                <option key={g.id} value={g.id}>
                  #{g.gameNumber} {g.name} ({g.rawProvider || g.provider})
                </option>
              ))}
            </select>

            {/* Live Wallet & Coin Balance */}
            <div
              data-testid="arena-live-wallet-balance"
              className="px-3 py-1.5 rounded-xl bg-[#241e06] border border-[#ffd739]/60 flex items-center gap-1.5 text-xs"
            >
              <Coins className="w-3.5 h-3.5 text-[#ffd739]" />
              <span className="font-mono-tabular font-black text-[#ffd739]">
                Coins: ₹{balance.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              aria-label="Toggle Game Audio"
              className="p-1.5 rounded-xl bg-[#241e06] hover:bg-[#5a4a12] border border-[#ffd739]/30 text-[#ffd739] cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Game Arena"
              className="p-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-400/40 text-red-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ====================================================================
         * MAIN STUDIO GAME STAGE (TAILORED TO EACH OF THE 200 GAMES)
         * ==================================================================== */}
        <div className="p-3 sm:p-5 space-y-3.5 bg-gradient-to-b from-[#241e06] via-[#1a1504] to-[#120e02]">
          {/* Active Real-Time Bet Ticket Strip */}
          {activeTicket && (
            <div
              data-testid="arena-active-bet-ticket"
              className="rounded-xl bg-[#42370b] border border-[#ffd739]/50 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#ffd739]" />
                <span className="font-mono-tabular font-bold text-[#ffd739]">
                  {activeTicket.ticketId}
                </span>
                <span className="text-amber-200/60">·</span>
                <span className="text-white font-bold">
                  {activeTicket.selection} @ {activeTicket.odds}x
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono-tabular text-amber-100">
                  Stake: <strong>₹{activeTicket.stake.toLocaleString('en-IN')}</strong>
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                    activeTicket.status === 'WON' || activeTicket.status === 'CASHED_OUT'
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50'
                      : activeTicket.status === 'LOST'
                      ? 'bg-red-500/25 text-red-300 border border-red-400/50'
                      : 'bg-amber-500/25 text-amber-200 border border-amber-400/50'
                  }`}
                >
                  {activeTicket.status}
                </span>
              </div>
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 1: SPRIBE AVIATOR / RAVAN DAHAN / JETX / BALLOON STUDIO
           * ================================================================== */}
          {archetype === 'aviator_crash' && (
            <div className="space-y-3">
              {/* Top Multiplier History Strip (Exact Spribe Aviator pill bar) */}
              <div className="rounded-xl bg-[#0e0e14] border border-white/10 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-bold uppercase text-slate-400 mr-1 shrink-0">
                  History:
                </span>
                {crashHistory.map((m, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded-full font-mono-tabular font-extrabold text-[11px] shrink-0 ${
                      m >= 10
                        ? 'bg-pink-600/30 border border-pink-400/60 text-pink-300'
                        : m >= 2
                        ? 'bg-purple-600/30 border border-purple-400/60 text-purple-300'
                        : 'bg-sky-600/30 border border-sky-400/60 text-sky-300'
                    }`}
                  >
                    {m.toFixed(2)}x
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-3">
                {/* Left Sidebar: Live Players Cashout Feed */}
                <div className="hidden lg:flex flex-col rounded-2xl bg-[#14151f] border border-white/10 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      All Bets ({game.activePlayers})
                    </span>
                    <span className="font-mono-tabular text-[10px] text-emerald-400">
                      LIVE FEED
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {liveCrashPlayers.map((p, idx) => {
                      const cashed =
                        crashState === 'flying' && crashMultiplier >= p.cashoutAt;
                      return (
                        <div
                          key={idx}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] flex items-center justify-between font-mono-tabular ${
                            cashed
                              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                              : 'bg-black/40 text-slate-300'
                          }`}
                        >
                          <span>{p.name}</span>
                          <span>₹{p.stake}</span>
                          <span className="font-bold">
                            {cashed ? `${p.cashoutAt.toFixed(2)}x` : '...'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Aviator / Ravan Dahan Trajectory Canvas + Dual Bet Panels */}
                <div className="space-y-3">
                  <div className="relative h-64 sm:h-72 rounded-2xl bg-[#090a10] border-2 border-[#e11d48]/50 overflow-hidden flex flex-col items-center justify-center p-4">
                    {/* Radial Sunburst & Grid Lines */}
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 0% 100%, rgba(225,29,72,0.45) 0%, transparent 65%), linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to top, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '100% 100%, 36px 36px, 36px 36px',
                      }}
                    />

                    {/* Dynamic SVG Curved Flight Trajectory */}
                    <svg
                      viewBox="0 0 500 220"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="aviatorFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e11d48" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#e11d48" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {crashState !== 'idle' && (
                        <>
                          <path
                            d={`M 20 200 Q ${Math.min(
                              240,
                              60 + (crashMultiplier - 1) * 55
                            )} 195 ${Math.min(
                              460,
                              90 + (crashMultiplier - 1) * 95
                            )} ${Math.max(28, 190 - (crashMultiplier - 1) * 42)} L ${Math.min(
                              460,
                              90 + (crashMultiplier - 1) * 95
                            )} 200 Z`}
                            fill="url(#aviatorFill)"
                          />
                          <path
                            d={`M 20 200 Q ${Math.min(
                              240,
                              60 + (crashMultiplier - 1) * 55
                            )} 195 ${Math.min(
                              460,
                              90 + (crashMultiplier - 1) * 95
                            )} ${Math.max(28, 190 - (crashMultiplier - 1) * 42)}`}
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                        </>
                      )}
                    </svg>

                    {/* Center Multiplier Display */}
                    <div className="relative z-10 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        {game.name.toLowerCase().includes('ravan') ? (
                          <span className="text-2xl">🏹🔥👹</span>
                        ) : game.name.toLowerCase().includes('balloon') ||
                          game.name.toLowerCase().includes('baloon') ? (
                          <span className="text-2xl">🎈✨</span>
                        ) : (
                          <Rocket
                            className={`w-7 h-7 text-[#f43f5e] ${
                              crashState === 'flying' ? 'animate-bounce' : ''
                            }`}
                          />
                        )}
                        <span className="text-xs font-extrabold uppercase tracking-widest text-rose-300">
                          {game.name} Live Multiplier
                        </span>
                      </div>

                      <div
                        className={`font-mono-tabular font-black text-5xl sm:text-7xl tracking-tight drop-shadow-[0_0_30px_rgba(244,63,94,0.65)] ${
                          crashState === 'crashed'
                            ? 'text-red-500'
                            : crashState === 'cashed'
                            ? 'text-emerald-400'
                            : 'text-white'
                        }`}
                      >
                        {crashMultiplier.toFixed(2)}x
                      </div>

                      <p className="mt-2 text-xs font-extrabold uppercase tracking-wider text-[#ffd739]">
                        {crashState === 'idle' && 'READY FOR TAKEOFF — PLACE BET BELOW'}
                        {crashState === 'flying' && 'FLIGHT IN PROGRESS — CLICK CASH OUT!'}
                        {crashState === 'crashed' && `FLEW AWAY AT ${crashMultiplier.toFixed(2)}X`}
                        {crashState === 'cashed' && `CASHED OUT WINNER AT ${crashMultiplier.toFixed(2)}X!`}
                      </p>
                    </div>
                  </div>

                  {/* Dual Spribe Aviator Bet Panels (Panel 1 & Panel 2) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Bet Panel 1 (Main Interactive + Auto Cashout) */}
                    <div className="rounded-2xl bg-[#181924] border border-white/15 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white uppercase">Bet Panel 1</span>
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoCashoutEnabled}
                            onChange={(e) => setAutoCashoutEnabled(e.target.checked)}
                            className="accent-[#22c55e]"
                          />
                          <span>Auto Cash Out:</span>
                          <input
                            type="number"
                            step="0.1"
                            min={1.2}
                            value={autoCashoutTarget}
                            onChange={(e) =>
                              setAutoCashoutTarget(Math.max(1.2, Number(e.target.value)))
                            }
                            className="w-16 px-2 py-0.5 rounded bg-black/60 border border-white/20 font-mono-tabular font-bold text-[#ffd739] text-xs text-center"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-[1fr_140px] gap-2.5 items-stretch">
                        <div className="space-y-1.5">
                          <div className="flex items-center bg-black/50 rounded-xl border border-white/15 px-2 py-1">
                            <button
                              type="button"
                              onClick={() => setStake((s) => Math.max(10, s - 100))}
                              className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={10}
                              value={stake}
                              onChange={(e) => setStake(Math.max(10, Number(e.target.value)))}
                              className="w-full bg-transparent text-center font-mono-tabular font-black text-white text-sm focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setStake((s) => s + 100)}
                              className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {[100, 200, 500, 1000].map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setStake(v)}
                                className="py-1 rounded-lg bg-white/10 hover:bg-white/20 font-mono-tabular font-bold text-[10px] text-slate-200 cursor-pointer"
                              >
                                ₹{v}
                              </button>
                            ))}
                          </div>
                        </div>

                        {crashState === 'flying' ? (
                          <button
                            type="button"
                            onClick={handleManualCrashCashout}
                            className="rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 hover:brightness-110 text-black font-black text-xs sm:text-sm uppercase flex flex-col items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.6)] cursor-pointer"
                          >
                            <span>CASH OUT</span>
                            <span className="font-mono-tabular text-sm">
                              ₹{Math.round(stake * crashMultiplier).toLocaleString('en-IN')}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleStartCrashFlight(stake)}
                            className="rounded-2xl bg-gradient-to-b from-[#22c55e] to-[#16a34a] hover:brightness-110 text-black font-black text-sm uppercase flex flex-col items-center justify-center shadow-[0_0_25px_rgba(34,197,94,0.45)] cursor-pointer disabled:opacity-50"
                          >
                            <span>BET</span>
                            <span className="font-mono-tabular text-xs">
                              ₹{stake.toLocaleString('en-IN')}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bet Panel 2 (Second Parallel Stake Control) */}
                    <div className="rounded-2xl bg-[#181924] border border-white/15 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white uppercase">Bet Panel 2</span>
                        <span className="text-[11px] text-emerald-400 font-mono-tabular">
                          Instant 2x Bet
                        </span>
                      </div>

                      <div className="grid grid-cols-[1fr_140px] gap-2.5 items-stretch">
                        <div className="space-y-1.5">
                          <div className="flex items-center bg-black/50 rounded-xl border border-white/15 px-2 py-1">
                            <button
                              type="button"
                              onClick={() => setStakePanel2((s) => Math.max(10, s - 100))}
                              className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={10}
                              value={stakePanel2}
                              onChange={(e) =>
                                setStakePanel2(Math.max(10, Number(e.target.value)))
                              }
                              className="w-full bg-transparent text-center font-mono-tabular font-black text-white text-sm focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setStakePanel2((s) => s + 100)}
                              className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {[200, 500, 2000, 5000].map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setStakePanel2(v)}
                                className="py-1 rounded-lg bg-white/10 hover:bg-white/20 font-mono-tabular font-bold text-[10px] text-slate-200 cursor-pointer"
                              >
                                ₹{v}
                              </button>
                            ))}
                          </div>
                        </div>

                        {crashState === 'flying' ? (
                          <button
                            type="button"
                            onClick={handleManualCrashCashout}
                            className="rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 hover:brightness-110 text-black font-black text-xs sm:text-sm uppercase flex flex-col items-center justify-center shadow-lg cursor-pointer"
                          >
                            <span>CASH OUT</span>
                            <span className="font-mono-tabular text-sm">
                              ₹{Math.round(stakePanel2 * crashMultiplier).toLocaleString('en-IN')}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleStartCrashFlight(stakePanel2)}
                            className="rounded-2xl bg-gradient-to-b from-[#22c55e] to-[#16a34a] hover:brightness-110 text-black font-black text-sm uppercase flex flex-col items-center justify-center shadow-lg cursor-pointer disabled:opacity-50"
                          >
                            <span>BET</span>
                            <span className="font-mono-tabular text-xs">
                              ₹{stakePanel2.toLocaleString('en-IN')}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 2: CHICKEN GAMES / DRAGON TOWER / STAIRS / SNAKES STUDIO
           * ================================================================== */}
          {archetype === 'tower_road' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-[#241e06] border border-[#ffd739]/40 p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[#ffd739] uppercase">
                    Difficulty Columns:
                  </span>
                  {[2, 3, 4].map((cols) => (
                    <button
                      key={cols}
                      type="button"
                      disabled={towerActive}
                      onClick={() => setTowerCols(cols)}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${
                        towerCols === cols
                          ? 'bg-[#ffd739] text-black'
                          : 'bg-[#42370b] text-amber-100'
                      }`}
                    >
                      {cols === 2 ? 'Hard (2 Cols)' : cols === 3 ? 'Medium (3 Cols)' : 'Easy (4 Cols)'}
                    </button>
                  ))}
                </div>
                <span className="font-mono-tabular text-xs font-bold text-emerald-300">
                  {towerActive && towerLevel > 0
                    ? `Current Level ${towerLevel}: ${TOWER_MULTIPLIERS[towerLevel - 1]}x (₹${Math.round(
                        stake * TOWER_MULTIPLIERS[towerLevel - 1]
                      ).toLocaleString('en-IN')})`
                    : 'Climb levels & Cash Out anytime!'}
                </span>
              </div>

              <div className="rounded-2xl bg-[#141104] border-2 border-[#ffd739]/40 p-3.5 max-w-xl mx-auto space-y-2">
                {[...TOWER_MULTIPLIERS].reverse().map((mult, revIdx) => {
                  const lvl = 7 - revIdx;
                  const isCurrent = towerActive && towerLevel === lvl;
                  const isCleared = towerLevel > lvl;
                  const pickedCol = towerPicks[lvl];
                  const trapCol = towerTraps[lvl];

                  return (
                    <div
                      key={lvl}
                      className={`grid grid-cols-[85px_1fr] gap-2.5 items-center p-1.5 rounded-xl border ${
                        isCurrent
                          ? 'bg-[#42370b] border-[#ffd739] shadow-[0_0_15px_rgba(255,215,57,0.35)]'
                          : isCleared
                          ? 'bg-emerald-950/30 border-emerald-500/30'
                          : 'bg-black/40 border-white/10'
                      }`}
                    >
                      <div className="px-2 py-1.5 rounded-lg bg-[#241e06] text-center font-mono-tabular font-black text-xs text-[#ffd739]">
                        L{lvl + 1} · {mult.toFixed(2)}x
                      </div>
                      <div
                        className="grid gap-2"
                        style={{ gridTemplateColumns: `repeat(${towerCols}, minmax(0, 1fr))` }}
                      >
                        {Array.from({ length: towerCols }).map((_, col) => {
                          const wasPicked = pickedCol === col;
                          const isTrap =
                            (towerStatus === 'lost' || towerStatus === 'won') &&
                            trapCol === col;

                          return (
                            <button
                              key={col}
                              type="button"
                              disabled={!isCurrent}
                              onClick={() => void handlePickTowerStep(lvl, col)}
                              className={`h-10 rounded-xl font-bold text-sm flex items-center justify-center border transition-all cursor-pointer ${
                                wasPicked && trapCol === col
                                  ? 'bg-red-600 border-red-300 text-white'
                                  : wasPicked
                                  ? 'bg-emerald-500 border-emerald-200 text-black'
                                  : isTrap
                                  ? 'bg-red-950/70 border-red-500/40 text-red-300'
                                  : isCurrent
                                  ? 'bg-[#ffd739]/20 hover:bg-[#ffd739]/40 border-[#ffd739] text-white'
                                  : 'bg-white/5 border-white/10 text-slate-500'
                              }`}
                            >
                              {wasPicked && trapCol === col
                                ? '💥'
                                : wasPicked
                                ? game.name.toLowerCase().includes('chicken')
                                  ? '🐔'
                                  : '🥚'
                                : isTrap
                                ? '🔥'
                                : isCurrent
                                ? 'STEP'
                                : '•'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <CasinoChipSelectorBar
                  stake={stake}
                  onSelectStake={setStake}
                  disabled={towerActive}
                />
                {towerActive ? (
                  <button
                    type="button"
                    disabled={towerLevel === 0}
                    onClick={handleCashoutTower}
                    className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-sm uppercase cursor-pointer shadow-lg"
                  >
                    Cash Out ₹
                    {towerLevel > 0
                      ? Math.round(stake * TOWER_MULTIPLIERS[towerLevel - 1]).toLocaleString('en-IN')
                      : stake}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartTowerGame}
                    className="px-6 py-3.5 rounded-2xl bg-[#ffd739] hover:bg-yellow-300 text-black font-black text-sm uppercase cursor-pointer shadow-lg"
                  >
                    Start Climb (₹{stake.toLocaleString('en-IN')})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 3: SPRIBE MINES / TURBO MINES 5x5 STUDIO
           * ================================================================== */}
          {archetype === 'mines_grid' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#0c243c] border border-sky-400/40 p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bomb className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-extrabold text-white">Mines:</span>
                  {[1, 2, 3, 5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      disabled={minesActive}
                      onClick={() => setMinesCount(cnt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer ${
                        minesCount === cnt
                          ? 'bg-[#ffd739] text-black'
                          : 'bg-black/40 text-sky-200 hover:bg-black/60'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs font-mono-tabular">
                  <span className="px-2.5 py-1 rounded-lg bg-black/50 text-sky-300 font-bold">
                    Current: {currentMinesMult}x
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#ffd739]/20 border border-[#ffd739]/50 text-[#ffd739] font-black">
                    Next Tile: {nextMinesMult}x
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2.5 max-w-md mx-auto p-4 rounded-2xl bg-[#071829] border-2 border-sky-500/30 shadow-inner">
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
                      onClick={() => void handleClickMineTile(idx)}
                      className={`h-14 sm:h-16 rounded-xl font-bold text-lg flex items-center justify-center border-2 transition-all cursor-pointer shadow ${
                        showBomb
                          ? 'bg-red-600 border-red-300 text-white scale-95'
                          : isRevealed
                          ? 'bg-amber-400/25 border-[#ffd739] text-[#ffd739]'
                          : 'bg-[#103454] hover:bg-[#164670] border-sky-400/30 text-sky-200/50'
                      }`}
                    >
                      {showBomb ? '💣' : isRevealed ? '⭐' : ''}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <CasinoChipSelectorBar
                  stake={stake}
                  onSelectStake={setStake}
                  disabled={minesActive}
                />
                <div className="flex items-center gap-2">
                  {minesActive && (
                    <button
                      type="button"
                      onClick={handleRandomPickMineTile}
                      className="px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-black text-xs uppercase cursor-pointer"
                    >
                      Random Tile
                    </button>
                  )}
                  {minesActive ? (
                    <button
                      type="button"
                      disabled={revealedTiles.size === 0}
                      onClick={handleCashoutMinesRound}
                      className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-sm uppercase cursor-pointer shadow-lg"
                    >
                      Cash Out ₹{Math.round(stake * currentMinesMult).toLocaleString('en-IN')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartMinesRound}
                      className="px-6 py-3 rounded-xl bg-[#22c55e] hover:bg-emerald-400 text-black font-black text-sm uppercase cursor-pointer shadow-lg"
                    >
                      BET (₹{stake.toLocaleString('en-IN')})
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 4A: DRAGON TIGER / DRAGON TIGER LION LIVE STUDIO
           * ================================================================== */}
          {archetype === 'dragon_tiger' && (
            <div className="space-y-3.5">
              {/* Studio Felt Video Stage */}
              <div className="rounded-2xl bg-gradient-to-b from-[#3b0a0a] via-[#1f0707] to-[#120404] border-2 border-[#ffd739]/60 p-4 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 rounded bg-black/60 border border-[#ffd739]/40 font-extrabold text-[#ffd739] uppercase">
                    🐉 {game.name} Live Table
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 font-mono-tabular font-black text-emerald-300">
                    ⏱ {roundTimer}s · {cardTableState.winnerBadge}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 max-w-lg mx-auto">
                  <div className="rounded-2xl bg-red-950/60 border-2 border-red-500/60 p-3 flex flex-col items-center gap-2">
                    <span className="font-shark italic font-black text-sm sm:text-base text-red-300 uppercase tracking-wider">
                      🐉 DRAGON
                    </span>
                    <PlayingCardView
                      rank={cardTableState.cardA.rank}
                      suit={cardTableState.cardA.suit}
                      color={cardTableState.cardA.color}
                      size="lg"
                      highlight={cardTableState.cardA.value > cardTableState.cardB.value}
                    />
                  </div>

                  <div className="rounded-2xl bg-amber-950/60 border-2 border-[#ffd739]/60 p-3 flex flex-col items-center gap-2">
                    <span className="font-shark italic font-black text-sm sm:text-base text-[#ffd739] uppercase tracking-wider">
                      🐅 TIGER
                    </span>
                    <PlayingCardView
                      rank={cardTableState.cardB.rank}
                      suit={cardTableState.cardB.suit}
                      color={cardTableState.cardB.color}
                      size="lg"
                      highlight={cardTableState.cardB.value > cardTableState.cardA.value}
                    />
                  </div>
                </div>

                {/* Last 10 Results Road Map Circles */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-[10px] font-bold uppercase text-amber-200/75">
                    Last 10 Results:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {cardTableState.roadmap.map((r, i) => (
                      <span
                        key={i}
                        className={`w-6 h-6 rounded-full font-mono-tabular font-black text-[10px] flex items-center justify-center border ${
                          r === 'D'
                            ? 'bg-red-600 border-red-300 text-white'
                            : r === 'T'
                            ? 'bg-[#ffd739] border-yellow-100 text-black'
                            : 'bg-emerald-600 border-emerald-300 text-white'
                        }`}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mac88 / Royal Gaming Dragon Tiger Main & Fancy Betting Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Dragon', odds: 1.98, bg: 'bg-[#72bbef] text-slate-950' },
                  { label: 'Tie (Suited 50x)', odds: 11.0, bg: 'bg-emerald-400 text-slate-950' },
                  { label: 'Tiger', odds: 1.98, bg: 'bg-[#72bbef] text-slate-950' },
                  { label: 'Pair', odds: 11.0, bg: 'bg-[#faa9ba] text-slate-950' },
                ].map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({
                        label: m.label,
                        odds: m.odds,
                        marketGroup: 'Main Winner',
                      })
                    }
                    className={`p-3 rounded-xl ${m.bg} hover:brightness-105 font-mono-tabular flex flex-col items-center justify-center shadow cursor-pointer`}
                  >
                    <span className="text-xs font-black uppercase">{m.label}</span>
                    <span className="text-sm font-black mt-0.5">{m.odds.toFixed(2)}</span>
                  </button>
                ))}
              </div>

              {/* Dragon & Tiger Odd/Even & Red/Black Fancy Side Bets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Dragon Even', odds: 2.1 },
                  { label: 'Dragon Odd', odds: 1.82 },
                  { label: 'Dragon Red ♥♦', odds: 1.96 },
                  { label: 'Dragon Black ♠♣', odds: 1.96 },
                  { label: 'Tiger Even', odds: 2.1 },
                  { label: 'Tiger Odd', odds: 1.82 },
                  { label: 'Tiger Red ♥♦', odds: 1.96 },
                  { label: 'Tiger Black ♠♣', odds: 1.96 },
                ].map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({
                        label: f.label,
                        odds: f.odds,
                        marketGroup: 'Fancy Side Bet',
                      })
                    }
                    className="p-2.5 rounded-xl bg-[#42370b] hover:bg-[#5a4a12] border border-[#ffd739]/35 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span className="font-bold text-white">{f.label}</span>
                    <span className="px-2 py-0.5 rounded bg-[#72bbef] text-black font-mono-tabular font-black">
                      {f.odds.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>

              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 4B: TEEN PATTI / MUFLIS / AK47 / POKER LIVE STUDIO
           * ================================================================== */}
          {archetype === 'teen_patti' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-gradient-to-b from-[#0b3b24] via-[#072617] to-[#04140c] border-2 border-[#ffd739]/60 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#ffd739] uppercase">
                    🃏 {game.name} · 3-Card Live Studio
                  </span>
                  <span className="font-mono-tabular font-bold text-emerald-300">
                    ⏱ {roundTimer}s · {cardTableState.winnerBadge}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-black/45 border border-sky-400/40 p-3 text-center space-y-2">
                    <p className="text-xs font-black text-sky-300 uppercase">PLAYER A</p>
                    <div className="flex items-center justify-center gap-2">
                      {cardTableState.handA.map((c, i) => (
                        <PlayingCardView
                          key={i}
                          rank={c.rank}
                          suit={c.suit}
                          color={c.color}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/45 border border-rose-400/40 p-3 text-center space-y-2">
                    <p className="text-xs font-black text-rose-300 uppercase">PLAYER B</p>
                    <div className="flex items-center justify-center gap-2">
                      {cardTableState.handB.map((c, i) => (
                        <PlayingCardView
                          key={i}
                          rank={c.rank}
                          suit={c.suit}
                          color={c.color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mac88 Teen Patti Back & Lay Odds Table */}
              <div className="rounded-2xl bg-[#42370b] border border-[#ffd739]/35 overflow-hidden">
                <div className="grid grid-cols-[1fr_110px_110px] bg-[#846f1e] px-3.5 py-2 text-xs font-black text-white uppercase">
                  <span>Runner Selection</span>
                  <span className="text-center">BACK</span>
                  <span className="text-center">LAY</span>
                </div>
                {[
                  { name: 'Player A Main', back: 1.98, lay: 2.02 },
                  { name: 'Player B Main', back: 1.98, lay: 2.02 },
                  { name: 'Player A Pair Plus Bonus', back: 3.2, lay: 3.4 },
                  { name: 'Player B Pair Plus Bonus', back: 3.2, lay: 3.4 },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-[1fr_110px_110px] items-center px-3.5 py-2 border-t border-[#ffd739]/20 gap-2"
                  >
                    <span className="text-xs font-extrabold text-white">{row.name}</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void handlePlaceStudioMarketBet({
                          label: `${row.name} (BACK)`,
                          odds: row.back,
                        })
                      }
                      className="py-2 rounded-lg bg-[#72bbef] hover:brightness-105 text-slate-950 font-mono-tabular font-black text-xs cursor-pointer"
                    >
                      {row.back.toFixed(2)}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void handlePlaceStudioMarketBet({
                          label: `${row.name} (LAY)`,
                          odds: row.lay,
                        })
                      }
                      className="py-2 rounded-lg bg-[#faa9ba] hover:brightness-105 text-slate-950 font-mono-tabular font-black text-xs cursor-pointer"
                    >
                      {row.lay.toFixed(2)}
                    </button>
                  </div>
                ))}
              </div>

              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 4C: ANDAR BAHAR LIVE DEALER STUDIO
           * ================================================================== */}
          {archetype === 'andar_bahar' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-gradient-to-b from-[#3d1a04] via-[#241002] to-[#120801] border-2 border-[#ffd739]/60 p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-[130px_1fr] gap-4 items-center">
                  <div className="rounded-xl bg-black/50 border-2 border-[#ffd739] p-2.5 flex flex-col items-center">
                    <span className="text-[10px] font-black text-[#ffd739] uppercase mb-1">
                      JOKER CARD
                    </span>
                    <PlayingCardView
                      rank={cardTableState.cardC.rank}
                      suit={cardTableState.cardC.suit}
                      color={cardTableState.cardC.color}
                      highlight
                    />
                  </div>

                  <div className="space-y-2.5">
                    <div className="rounded-xl bg-sky-950/40 border border-sky-400/40 p-2.5 flex items-center justify-between gap-2">
                      <span className="font-shark italic font-black text-sm text-sky-300 uppercase">
                        ANDAR
                      </span>
                      <div className="flex items-center gap-1.5">
                        {cardTableState.andarCards.map((c, i) => (
                          <PlayingCardView
                            key={i}
                            rank={c.rank}
                            suit={c.suit}
                            color={c.color}
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-rose-950/40 border border-rose-400/40 p-2.5 flex items-center justify-between gap-2">
                      <span className="font-shark italic font-black text-sm text-rose-300 uppercase">
                        BAHAR
                      </span>
                      <div className="flex items-center gap-1.5">
                        {cardTableState.baharCards.map((c, i) => (
                          <PlayingCardView
                            key={i}
                            rank={c.rank}
                            suit={c.suit}
                            color={c.color}
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Andar 1st Bet', odds: 1.98, bg: 'bg-[#72bbef] text-black' },
                  { label: 'Bahar 1st Bet', odds: 1.98, bg: 'bg-[#faa9ba] text-black' },
                  { label: 'Joker Odd', odds: 1.85, bg: 'bg-[#ffd739] text-black' },
                  { label: 'Joker Even', odds: 2.08, bg: 'bg-[#ffd739] text-black' },
                  { label: 'Joker Spade ♠', odds: 3.75, bg: 'bg-[#42370b] text-white' },
                  { label: 'Joker Heart ♥', odds: 3.75, bg: 'bg-[#42370b] text-red-300' },
                  { label: 'Joker Club ♣', odds: 3.75, bg: 'bg-[#42370b] text-white' },
                  { label: 'Joker Diamond ♦', odds: 3.75, bg: 'bg-[#42370b] text-red-300' },
                ].map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({ label: b.label, odds: b.odds })
                    }
                    className={`p-3 rounded-xl border border-[#ffd739]/35 ${b.bg} font-mono-tabular font-black text-xs flex items-center justify-between cursor-pointer`}
                  >
                    <span>{b.label}</span>
                    <span>{b.odds.toFixed(2)}x</span>
                  </button>
                ))}
              </div>

              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 4D: AMAR AKBAR ANTHONY / AKBAR ROMEO WALTER / BOLLYWOOD
           * ================================================================== */}
          {archetype === 'amar_akbar_anthony' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-gradient-to-r from-[#2e0938] via-[#1c0624] to-[#2e0938] border-2 border-[#ffd739]/60 p-4 flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="text-center space-y-1">
                  <span className="text-xs font-black text-[#ffd739] uppercase">
                    🎬 {game.name} Live Table
                  </span>
                  <p className="text-xs text-amber-100">
                     Amar (A–6) · Akbar (7–10) · Anthony (J–K)
                  </p>
                  <p className="font-mono-tabular text-xs text-emerald-300 font-bold">
                    {cardTableState.winnerBadge}
                  </p>
                </div>
                <PlayingCardView
                  rank={cardTableState.cardA.rank}
                  suit={cardTableState.cardA.suit}
                  color={cardTableState.cardA.color}
                  size="lg"
                  highlight
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { title: '1. AMAR (A, 2, 3, 4, 5, 6)', back: 2.12, lay: 2.22 },
                  { title: '2. AKBAR (7, 8, 9, 10)', back: 3.15, lay: 3.3 },
                  { title: '3. ANTHONY (J, Q, K)', back: 4.15, lay: 4.35 },
                ].map((m) => (
                  <div
                    key={m.title}
                    className="rounded-xl bg-[#42370b] border border-[#ffd739]/40 p-3 space-y-2"
                  >
                    <p className="text-xs font-black text-[#ffd739] text-center">{m.title}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void handlePlaceStudioMarketBet({
                            label: `${m.title} BACK`,
                            odds: m.back,
                          })
                        }
                        className="py-2 rounded-lg bg-[#72bbef] text-black font-mono-tabular font-black text-xs cursor-pointer"
                      >
                        BACK {m.back.toFixed(2)}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void handlePlaceStudioMarketBet({
                            label: `${m.title} LAY`,
                            odds: m.lay,
                          })
                        }
                        className="py-2 rounded-lg bg-[#faa9ba] text-black font-mono-tabular font-black text-xs cursor-pointer"
                      >
                        LAY {m.lay.toFixed(2)}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Even (2.10x)', odds: 2.1 },
                  { label: 'Odd (1.82x)', odds: 1.82 },
                  { label: 'Red ♥♦ (1.96x)', odds: 1.96 },
                  { label: 'Black ♠♣ (1.96x)', odds: 1.96 },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({ label: s.label, odds: s.odds })
                    }
                    className="py-2.5 px-3 rounded-xl bg-[#241e06] hover:bg-[#5a4a12] border border-[#ffd739]/35 font-bold text-xs text-white cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 4E: 32 CARDS / 32 CARDS FUSION STUDIO
           * ================================================================== */}
          {archetype === 'cards_32' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { player: 'Player 8', base: 8, total: cardTableState.totals32.p8, back: 12.5, lay: 13.5 },
                  { player: 'Player 9', base: 9, total: cardTableState.totals32.p9, back: 5.8, lay: 6.2 },
                  { player: 'Player 10', base: 10, total: cardTableState.totals32.p10, back: 3.2, lay: 3.4 },
                  { player: 'Player 11', base: 11, total: cardTableState.totals32.p11, back: 2.04, lay: 2.12 },
                ].map((p) => (
                  <div
                    key={p.player}
                    className="rounded-2xl bg-[#42370b] border border-[#ffd739]/40 p-3 text-center space-y-2"
                  >
                    <p className="text-xs font-black text-[#ffd739] uppercase">{p.player}</p>
                    <div className="py-2 rounded-xl bg-[#241e06] font-mono-tabular font-black text-xl text-white">
                      Total: {p.total}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void handlePlaceStudioMarketBet({
                            label: `${p.player} BACK`,
                            odds: p.back,
                          })
                        }
                        className="py-2 rounded-lg bg-[#72bbef] text-black font-mono-tabular font-black text-xs cursor-pointer"
                      >
                        {p.back.toFixed(2)}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void handlePlaceStudioMarketBet({
                            label: `${p.player} LAY`,
                            odds: p.lay,
                          })
                        }
                        className="py-2 rounded-lg bg-[#faa9ba] text-black font-mono-tabular font-black text-xs cursor-pointer"
                      >
                        {p.lay.toFixed(2)}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 4F: 7 UP & DOWN / HIGH LOW / HILO / CENTER CARD STUDIO
           * ================================================================== */}
          {archetype === 'lucky_7_hilo' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-gradient-to-b from-[#112e21] to-[#081710] border-2 border-[#ffd739]/60 p-4 flex flex-col items-center gap-3">
                <span className="text-xs font-black text-[#ffd739] uppercase">
                  🍀 {game.name} Live Card Draw
                </span>
                <PlayingCardView
                  rank={cardTableState.cardA.rank}
                  suit={cardTableState.cardA.suit}
                  color={cardTableState.cardA.color}
                  size="lg"
                  highlight
                />
                <div className="grid grid-cols-3 gap-3 w-full max-w-xl">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({ label: '7 DOWN / LOW (A-6)', odds: 2.0 })
                    }
                    className="p-3.5 rounded-2xl bg-gradient-to-b from-rose-500 to-red-700 text-white font-black text-xs sm:text-sm uppercase cursor-pointer shadow-lg"
                  >
                    <div>7 DOWN (LOW)</div>
                    <div className="font-mono-tabular text-base mt-0.5">2.00x</div>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({ label: 'LUCKY 7 EXACT', odds: 11.5 })
                    }
                    className="p-3.5 rounded-2xl bg-gradient-to-b from-[#ffd739] to-amber-500 text-black font-black text-xs sm:text-sm uppercase cursor-pointer shadow-lg"
                  >
                    <div>LUCKY 7</div>
                    <div className="font-mono-tabular text-base mt-0.5">11.50x</div>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({ label: '7 UP / HIGH (8-K)', odds: 2.0 })
                    }
                    className="p-3.5 rounded-2xl bg-gradient-to-b from-emerald-500 to-green-700 text-white font-black text-xs sm:text-sm uppercase cursor-pointer shadow-lg"
                  >
                    <div>7 UP (HIGH)</div>
                    <div className="font-mono-tabular text-base mt-0.5">2.00x</div>
                  </button>
                </div>
              </div>
              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 4G: BACCARAT / BLACKJACK / CASINO WAR LIVE STUDIO
           * ================================================================== */}
          {archetype === 'baccarat_table' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-gradient-to-b from-[#0a3622] to-[#051b11] border-2 border-[#ffd739]/60 p-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-black/45 border border-sky-400/40 p-3 text-center space-y-2">
                  <span className="text-xs font-black text-sky-300 uppercase">PLAYER HAND</span>
                  <div className="flex justify-center gap-2">
                    <PlayingCardView
                      rank={cardTableState.cardA.rank}
                      suit={cardTableState.cardA.suit}
                      color={cardTableState.cardA.color}
                    />
                    <PlayingCardView
                      rank={cardTableState.cardC.rank}
                      suit={cardTableState.cardC.suit}
                      color={cardTableState.cardC.color}
                    />
                  </div>
                </div>
                <div className="rounded-xl bg-black/45 border border-rose-400/40 p-3 text-center space-y-2">
                  <span className="text-xs font-black text-rose-300 uppercase">BANKER HAND</span>
                  <div className="flex justify-center gap-2">
                    <PlayingCardView
                      rank={cardTableState.cardB.rank}
                      suit={cardTableState.cardB.suit}
                      color={cardTableState.cardB.color}
                    />
                    <PlayingCardView
                      rank={cardTableState.handB[0].rank}
                      suit={cardTableState.handB[0].suit}
                      color={cardTableState.handB[0].color}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: 'Player Pair', odds: 11.0, bg: 'bg-[#42370b] text-sky-300' },
                  { label: 'PLAYER', odds: 2.0, bg: 'bg-[#72bbef] text-black' },
                  { label: 'TIE 8:1', odds: 9.0, bg: 'bg-emerald-500 text-black' },
                  { label: 'BANKER', odds: 1.95, bg: 'bg-[#faa9ba] text-black' },
                  { label: 'Banker Pair', odds: 11.0, bg: 'bg-[#42370b] text-rose-300' },
                ].map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({ label: b.label, odds: b.odds })
                    }
                    className={`p-3 rounded-xl border border-[#ffd739]/35 ${b.bg} font-mono-tabular font-black text-xs flex flex-col items-center cursor-pointer`}
                  >
                    <span>{b.label}</span>
                    <span className="text-sm mt-0.5">{b.odds.toFixed(2)}x</span>
                  </button>
                ))}
              </div>
              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 4H: SUPER OVER FUSION / CRICKET 20-20 / HAND CRICKET
           * ================================================================== */}
          {archetype === 'cricket_super_over' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-gradient-to-r from-[#0b2e13] via-[#134e21] to-[#0b2e13] border-2 border-[#ffd739]/60 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-[#ffd739] uppercase">
                    🏏 {game.name} · Live Over Scorecard
                  </span>
                  <span className="font-mono-tabular font-bold text-emerald-300">
                    IND 22/1 (0.6 ov) vs AUS
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {cardTableState.cricketBalls.map((b, i) => (
                    <span
                      key={i}
                      className={`w-10 h-10 rounded-full font-mono-tabular font-black text-sm flex items-center justify-center border-2 ${
                        b === '6'
                          ? 'bg-[#ffd739] border-white text-black'
                          : b === '4'
                          ? 'bg-emerald-500 border-emerald-200 text-black'
                          : b === 'W'
                          ? 'bg-red-600 border-red-200 text-white'
                          : 'bg-black/60 border-white/30 text-white'
                      }`}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { label: 'India Super Over Win (BACK)', odds: 1.9 },
                  { label: 'Opponent Super Over Win (BACK)', odds: 2.05 },
                  { label: 'Next Ball Boundary 4s (YES)', odds: 3.2 },
                  { label: 'Next Ball Sixer 6s (YES)', odds: 6.5 },
                  { label: 'Next Ball Wicket (YES)', odds: 8.0 },
                  { label: 'Over Total 15+ Runs (YES)', odds: 1.95 },
                ].map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({ label: m.label, odds: m.odds })
                    }
                    className="p-3 rounded-xl bg-[#42370b] hover:bg-[#5a4a12] border border-[#ffd739]/40 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span className="font-bold text-white text-left">{m.label}</span>
                    <span className="px-2 py-1 rounded bg-[#72bbef] text-black font-mono-tabular font-black shrink-0">
                      {m.odds.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 5A: EVOLUTION LIGHTNING ROULETTE & EUROPEAN ROULETTE TABLE
           * ================================================================== */}
          {archetype === 'roulette_table' && (
            <div className="space-y-3.5">
              {/* Top Wheel + Lightning Multipliers Strip */}
              <div className="rounded-2xl bg-gradient-to-r from-[#240a15] via-[#170926] to-[#241e06] border-2 border-[#ffd739]/60 p-3.5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-20 h-20 rounded-full border-4 border-[#ffd739] bg-gradient-to-tr from-red-700 via-black to-emerald-700 flex items-center justify-center shadow-xl transition-transform duration-500 shrink-0"
                    style={{ transform: `rotate(${wheelAngle}deg)` }}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1a1504] border border-[#ffd739] flex items-center justify-center font-mono-tabular font-black text-sm text-[#ffd739]">
                      {wheelLandingNumber}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-[#ffd739]">
                      ⚡ {game.name} · European 0–36 Table
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {lightningNumbers.map((ln, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-amber-400/20 border border-[#ffd739] font-mono-tabular font-black text-xs text-[#ffd739]"
                        >
                          ⚡ #{ln.num} ({ln.mult})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Numbers */}
                <div className="flex items-center gap-1">
                  {rouletteHistory.map((n, i) => (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded-full font-mono-tabular font-black text-[10px] flex items-center justify-center ${
                        n === 0
                          ? 'bg-emerald-600 text-white'
                          : ROULETTE_RED_NUMBERS.has(n)
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-900 border border-white/30 text-white'
                      }`}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              {/* Full Interactive 0–36 European Roulette Mat */}
              <div className="rounded-2xl bg-[#0a3622] border-2 border-[#ffd739]/50 p-3 space-y-2 overflow-x-auto">
                <div className="grid grid-cols-[44px_repeat(12,minmax(34px,1fr))] gap-1 min-w-[520px]">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({ label: 'Zero (0)', odds: 36.0 })
                    }
                    className="row-span-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-white/40 font-mono-tabular font-black text-sm text-white flex items-center justify-center cursor-pointer"
                  >
                    0
                  </button>
                  {Array.from({ length: 36 }, (_, i) => i + 1).map((num) => {
                    const isRed = ROULETTE_RED_NUMBERS.has(num);
                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void handlePlaceStudioMarketBet({
                            label: `Straight #${num}`,
                            odds: 36.0,
                          })
                        }
                        className={`py-2 rounded font-mono-tabular font-black text-xs text-white border border-white/25 hover:border-[#ffd739] cursor-pointer ${
                          isRed ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                {/* Dozens & Outside Bets */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                  {[
                    { label: '1st 12 (1-12)', odds: 3.0, cls: 'bg-black/40 text-white' },
                    { label: '2nd 12 (13-24)', odds: 3.0, cls: 'bg-black/40 text-white' },
                    { label: '3rd 12 (25-36)', odds: 3.0, cls: 'bg-black/40 text-white' },
                    { label: 'RED ♦', odds: 2.0, cls: 'bg-red-600 text-white' },
                    { label: 'BLACK ♠', odds: 2.0, cls: 'bg-slate-900 text-white' },
                    { label: 'EVEN / ODD', odds: 2.0, cls: 'bg-[#42370b] text-[#ffd739]' },
                  ].map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void handlePlaceStudioMarketBet({ label: o.label, odds: o.odds })
                      }
                      className={`py-2 px-2 rounded-lg border border-white/30 font-mono-tabular font-black text-xs cursor-pointer ${o.cls}`}
                    >
                      {o.label} ({o.odds}x)
                    </button>
                  ))}
                </div>
              </div>

              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 5B: EVOLUTION CRAZY TIME & MONEY WHEEL GAME SHOW STUDIO
           * ================================================================== */}
          {archetype === 'crazy_time_wheel' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-gradient-to-r from-[#3b0764] via-[#4c0519] to-[#42370b] border-2 border-[#ffd739] p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-24 h-24 rounded-full border-4 border-[#ffd739] bg-conic from-pink-500 via-amber-400 to-sky-500 flex items-center justify-center shadow-2xl transition-transform duration-500"
                    style={{ transform: `rotate(${wheelAngle}deg)` }}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#241e06] border-2 border-[#ffd739] flex items-center justify-center font-shark font-black text-xs text-[#ffd739]">
                      SPIN
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-[#ffd739]">
                      🎡 {game.name} · Top Slot Multiplier
                    </span>
                    <div className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-[#ffd739]">
                      <span className="font-black text-sm text-white">{crazyTopSlot.seg}</span>
                      <span className="font-mono-tabular font-black text-base text-[#ffd739]">
                        × {crazyTopSlot.mult}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: 'Number 1', odds: 2.0, bg: 'from-sky-500 to-blue-700' },
                  { label: 'Number 2', odds: 3.0, bg: 'from-amber-400 to-yellow-600' },
                  { label: 'Number 5', odds: 6.0, bg: 'from-pink-500 to-rose-700' },
                  { label: 'Number 10', odds: 11.0, bg: 'from-purple-500 to-indigo-700' },
                  { label: '🪙 COIN FLIP', odds: 15.0, bg: 'from-blue-600 to-indigo-900' },
                  { label: '🎯 CASH HUNT', odds: 25.0, bg: 'from-emerald-500 to-green-800' },
                  { label: '🟣 PACHINKO', odds: 20.0, bg: 'from-fuchsia-500 to-purple-900' },
                  { label: '🎪 CRAZY TIME', odds: 50.0, bg: 'from-red-600 to-rose-900' },
                ].map((seg) => (
                  <button
                    key={seg.label}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({ label: seg.label, odds: seg.odds })
                    }
                    className={`p-3 rounded-2xl bg-gradient-to-b ${seg.bg} border-2 border-[#ffd739]/60 hover:scale-102 text-white font-black text-xs flex flex-col items-center justify-center shadow-lg cursor-pointer`}
                  >
                    <span>{seg.label}</span>
                    <span className="font-mono-tabular text-sm text-[#ffd739] mt-0.5">
                      {seg.odds.toFixed(0)}x
                    </span>
                  </button>
                ))}
              </div>

              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 6A: JILI GOLDEN SLOTS & 4TH MULTIPLIER REEL STUDIO
           * ================================================================== */}
          {archetype === 'jili_slots' && (
            <div className="space-y-3.5">
              {/* JiLi Grand / Major / Minor / Mini Jackpot Header */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { tier: 'GRAND', val: '₹5,48,290', cls: 'from-red-700 to-rose-950 border-red-400' },
                  { tier: 'MAJOR', val: '₹84,500', cls: 'from-purple-700 to-indigo-950 border-purple-400' },
                  { tier: 'MINOR', val: '₹12,400', cls: 'from-sky-700 to-blue-950 border-sky-400' },
                  { tier: 'MINI', val: '₹2,500', cls: 'from-emerald-700 to-green-950 border-emerald-400' },
                ].map((j) => (
                  <div
                    key={j.tier}
                    className={`rounded-xl bg-gradient-to-b ${j.cls} border p-2 text-center`}
                  >
                    <div className="text-[9px] font-black text-[#ffd739] uppercase">{j.tier}</div>
                    <div className="font-mono-tabular font-black text-xs sm:text-sm text-white">
                      {j.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* 3x3 Main Golden Reels + 4th Special Multiplier Reel (Exact Fortune Gems 2/3 & Money Coming layout!) */}
              <div className="rounded-2xl bg-gradient-to-b from-[#5a4a12] via-[#332907] to-[#1a1504] border-4 border-[#ffd739] p-3.5 shadow-2xl">
                <div className="grid grid-cols-[1fr_1fr_1fr_95px] gap-2.5 items-center">
                  {slotGrid.map((row, rIdx) => (
                    <React.Fragment key={rIdx}>
                      {row.map((sym, cIdx) => (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className={`h-16 sm:h-20 rounded-xl bg-gradient-to-b from-[#fffbeb] to-[#fde68a] border-2 border-[#b45309] flex items-center justify-center text-3xl sm:text-4xl shadow-inner ${
                            slotSpinning ? 'animate-pulse' : ''
                          } ${rIdx === 1 ? 'ring-2 ring-[#ffd739]' : ''}`}
                        >
                          {sym}
                        </div>
                      ))}
                      <div
                        className={`h-16 sm:h-20 rounded-xl bg-gradient-to-b from-[#7c2d12] to-[#451a03] border-2 border-[#ffd739] flex flex-col items-center justify-center font-mono-tabular font-black ${
                          rIdx === 1 ? 'text-[#ffd739] text-lg ring-2 ring-[#ffd739]' : 'text-amber-200/70 text-xs'
                        }`}
                      >
                        <span className="text-[8px] uppercase">MULT</span>
                        <span>{slotMultiplierReel[rIdx]}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* JiLi Spin & Turbo Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: 'SPIN REELS (2.2x)', odds: 2.2 },
                  { label: 'EXTRA BET SPIN (4.5x)', odds: 4.5 },
                  { label: 'SUPER SCATTER (12x)', odds: 12.0 },
                  { label: 'MEGA GEM JACKPOT (50x)', odds: 50.0 },
                ].map((btn, idx) => (
                  <button
                    key={btn.label}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({ label: btn.label, odds: btn.odds })
                    }
                    className={`p-3 rounded-2xl font-black text-xs uppercase cursor-pointer shadow-lg ${
                      idx === 0
                        ? 'bg-gradient-to-b from-[#ffd739] to-amber-500 text-black'
                        : 'bg-[#42370b] hover:bg-[#5a4a12] border border-[#ffd739]/50 text-[#ffd739]'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 6B: JILI FISHING & DINO CANNON BOSS ARCADE
           * ================================================================== */}
          {archetype === 'fishing_boss' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-gradient-to-b from-[#062c43] via-[#054569] to-[#021926] border-2 border-[#ffd739]/60 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-[#ffd739] uppercase">
                    🎯 {game.name} · Click Any Boss Target to Fire Turret Cannon!
                  </span>
                  <span className="font-mono-tabular text-sky-200 font-bold">
                    Cannon Power: ₹{stake}/shot
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { icon: '🐉', name: 'Golden Dragon King', odds: 50.0 },
                    { icon: '🦈', name: 'Mega Shark Boss', odds: 25.0 },
                    { icon: '🦖', name: 'Golden T-Rex Boss', odds: 15.0 },
                    { icon: '🦀', name: 'Treasure Torpedo Crab', odds: 8.0 },
                    { icon: '🐸', name: 'Fortune Golden Toad', odds: 4.5 },
                    { icon: '🐠', name: 'Tropical School', odds: 2.0 },
                  ].map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void handlePlaceStudioMarketBet({ label: t.name, odds: t.odds })
                      }
                      className="p-3 rounded-2xl bg-black/45 hover:bg-sky-900/60 border border-[#ffd739]/40 hover:border-[#ffd739] flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 text-left">
                        <span className="text-3xl group-hover:scale-110 transition-transform">
                          {t.icon}
                        </span>
                        <div>
                          <div className="text-xs font-extrabold text-white">{t.name}</div>
                          <div className="text-[10px] text-sky-300">
                            Win ₹{Math.round(stake * t.odds).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded bg-[#ffd739] text-black font-mono-tabular font-black text-xs">
                        {t.odds}x
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 7A: COLOR PREDICTION / WINGO / 5D LOTTERY STUDIO
           * ================================================================== */}
          {archetype === 'color_wingo' && (
            <div className="space-y-3.5">
              {/* WinGo Period & Countdown Header */}
              <div className="rounded-2xl bg-gradient-to-r from-[#42370b] via-[#5a4a12] to-[#42370b] border border-[#ffd739]/50 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-200">
                    WinGo 30s Period ID
                  </span>
                  <div className="font-mono-tabular font-black text-base sm:text-lg text-white">
                    20261108{String(roundIdCounter).slice(-3)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-amber-200">
                    Time Remaining
                  </span>
                  <div className="font-mono-tabular font-black text-lg text-[#ffd739]">
                    00:{String(roundTimer).padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* 3 Big Color Buttons: Join Green, Join Violet, Join Red */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void handlePlaceStudioMarketBet({ label: 'Join Green', odds: 2.0 })
                  }
                  className="py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase shadow-lg cursor-pointer"
                >
                  Join Green (2x)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void handlePlaceStudioMarketBet({ label: 'Join Violet', odds: 4.5 })
                  }
                  className="py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs sm:text-sm uppercase shadow-lg cursor-pointer"
                >
                  Join Violet (4.5x)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void handlePlaceStudioMarketBet({ label: 'Join Red', odds: 2.0 })
                  }
                  className="py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm uppercase shadow-lg cursor-pointer"
                >
                  Join Red (2x)
                </button>
              </div>

              {/* 0 to 9 Number Spheres (9x) */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-3 rounded-2xl bg-[#241e06] border border-[#ffd739]/35">
                {Array.from({ length: 10 }, (_, n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({ label: `Number #${n}`, odds: 9.0 })
                    }
                    className={`h-11 rounded-full font-mono-tabular font-black text-sm text-white border-2 border-white/40 shadow cursor-pointer ${
                      n === 0 || n === 5
                        ? 'bg-gradient-to-br from-violet-600 to-rose-600'
                        : n % 2 === 1
                        ? 'bg-emerald-600'
                        : 'bg-rose-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Big / Small Bar */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void handlePlaceStudioMarketBet({ label: 'BIG (5-9)', odds: 2.0 })
                  }
                  className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase cursor-pointer"
                >
                  BIG (5–9) · 2.00x
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void handlePlaceStudioMarketBet({ label: 'SMALL (0-4)', odds: 2.0 })
                  }
                  className="py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-black font-black text-xs uppercase cursor-pointer"
                >
                  SMALL (0–4) · 2.00x
                </button>
              </div>

              {/* WinGo Period History Table */}
              <div className="rounded-xl bg-[#241e06] border border-[#ffd739]/25 overflow-hidden text-xs">
                <div className="grid grid-cols-4 bg-[#42370b] px-3 py-1.5 font-black text-[#ffd739]">
                  <span>Period</span>
                  <span className="text-center">Number</span>
                  <span className="text-center">Big/Small</span>
                  <span className="text-right">Color</span>
                </div>
                {wingoHistory.map((h) => (
                  <div
                    key={h.period}
                    className="grid grid-cols-4 px-3 py-1.5 border-t border-white/10 font-mono-tabular"
                  >
                    <span className="text-amber-100">{h.period}</span>
                    <span className="text-center font-black text-white">{h.num}</span>
                    <span className="text-center font-bold text-amber-200">{h.size}</span>
                    <span className="text-right font-black text-[#ffd739]">{h.color}</span>
                  </div>
                ))}
              </div>

              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 7B: SUPER SIC BO / LIGHTNING SIC BO / BAC BO / DICE
           * ================================================================== */}
          {archetype === 'sicbo_dice' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-gradient-to-r from-[#3b0a0a] via-[#4a1212] to-[#3b0a0a] border-2 border-[#ffd739] p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-[#ffd739]">
                    🎲 {game.name} · Glass Shaker Dome
                  </span>
                  <p className="text-xs text-amber-100 mt-0.5">
                    Total Sum: <strong>{sicBoDice[0] + sicBoDice[1] + sicBoDice[2]}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {sicBoDice.map((d, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-xl bg-white text-red-700 font-mono-tabular font-black text-xl flex items-center justify-center border-2 border-[#ffd739] shadow-lg"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: 'SMALL (4-10)', odds: 2.0 },
                  { label: 'ODD', odds: 2.0 },
                  { label: 'ANY TRIPLE', odds: 30.0 },
                  { label: 'EVEN', odds: 2.0 },
                  { label: 'BIG (11-17)', odds: 2.0 },
                ].map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({ label: b.label, odds: b.odds })
                    }
                    className="p-3 rounded-xl bg-[#42370b] hover:bg-[#5a4a12] border border-[#ffd739]/40 font-mono-tabular font-black text-xs text-white flex flex-col items-center cursor-pointer"
                  >
                    <span>{b.label}</span>
                    <span className="text-[#ffd739] mt-0.5">{b.odds}x</span>
                  </button>
                ))}
              </div>
              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 7C: JHANDI MUNDA 6-SYMBOL BOARD
           * ================================================================== */}
          {archetype === 'jhandi_munda' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-[#241e06] border-2 border-[#ffd739] p-3.5 flex items-center justify-between">
                <span className="text-xs font-black text-[#ffd739] uppercase">
                  🚩 Jhandi Munda 6-Dice Roll:
                </span>
                <div className="flex items-center gap-2">
                  {jhandiSymbolsResult.map((s, i) => (
                    <span
                      key={i}
                      className="w-10 h-10 rounded-xl bg-[#42370b] border border-[#ffd739] flex items-center justify-center text-lg"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { sym: '👑', name: 'Taj (Crown)', odds: 3.5 },
                  { sym: '🚩', name: 'Jhandi (Flag)', odds: 3.5 },
                  { sym: '♥', name: 'Paan (Heart)', odds: 3.5 },
                  { sym: '♠', name: 'Hukum (Spade)', odds: 3.5 },
                  { sym: '♦', name: 'Eent (Diamond)', odds: 3.5 },
                  { sym: '♣', name: 'Chidi (Club)', odds: 3.5 },
                ].map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({ label: s.name, odds: s.odds })
                    }
                    className="p-4 rounded-2xl bg-[#42370b] hover:bg-[#5a4a12] border-2 border-[#ffd739]/50 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{s.sym}</span>
                      <span className="font-extrabold text-xs text-white">{s.name}</span>
                    </div>
                    <span className="px-2 py-1 rounded bg-[#ffd739] text-black font-mono-tabular font-black text-xs">
                      {s.odds}x
                    </span>
                  </button>
                ))}
              </div>
              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* ==================================================================
           * ARCHETYPE 7D: PLINKO PYRAMID DROP / KENO / RPS / COIN TOSS
           * ================================================================== */}
          {(archetype === 'plinko_drop' ||
            archetype === 'keno_board' ||
            archetype === 'rps_cointoss') && (
            <div className="space-y-3.5">
              {archetype === 'plinko_drop' && (
                <div className="rounded-2xl bg-[#141829] border-2 border-[#ffd739]/50 p-4 text-center space-y-3">
                  <p className="text-xs font-black text-[#ffd739] uppercase">
                    🟡 {game.name} Pyramid Pegs · Last Hit Bucket: {plinkoLastBucket}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { label: 'Low Risk (1.5x)', odds: 1.5 },
                      { label: 'Medium (2.4x)', odds: 2.4 },
                      { label: 'High (5.6x)', odds: 5.6 },
                      { label: 'Turbo (12.0x)', odds: 12.0 },
                      { label: 'Extreme (29.0x)', odds: 29.0 },
                      { label: 'Max Edge (110x)', odds: 110.0 },
                    ].map((b) => (
                      <button
                        key={b.label}
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void handlePlaceStudioMarketBet({ label: b.label, odds: b.odds })
                        }
                        className="p-3 rounded-xl bg-gradient-to-b from-[#ffd739] to-amber-600 text-black font-mono-tabular font-black text-xs cursor-pointer shadow"
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {archetype === 'keno_board' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 p-3 rounded-2xl bg-[#102538] border border-sky-400/40">
                    {Array.from({ length: 40 }, (_, i) => i + 1).map((num) => {
                      const picked = kenoSelectedNums.includes(num);
                      const drawn = kenoDrawnNums.includes(num);
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() =>
                            setKenoSelectedNums((prev) =>
                              prev.includes(num)
                                ? prev.filter((x) => x !== num)
                                : prev.length < 10
                                ? [...prev, num]
                                : prev
                            )
                          }
                          className={`py-2 rounded-lg font-mono-tabular font-black text-xs cursor-pointer ${
                            picked && drawn
                              ? 'bg-emerald-500 text-black ring-2 ring-[#ffd739]'
                              : picked
                              ? 'bg-[#ffd739] text-black'
                              : drawn
                              ? 'bg-sky-600 text-white'
                              : 'bg-black/40 text-slate-300'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePlaceStudioMarketBet({
                        label: `Keno Draw (${kenoSelectedNums.length} Picks)`,
                        odds: 3.5,
                      })
                    }
                    className="w-full py-3 rounded-xl bg-[#ffd739] text-black font-black text-xs uppercase cursor-pointer"
                  >
                    Draw 10 Keno Balls (3.50x) · Stake ₹{stake.toLocaleString('en-IN')}
                  </button>
                </div>
              )}

              {archetype === 'rps_cointoss' && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-[#241e06] border-2 border-[#ffd739] p-4 flex items-center justify-around text-center">
                    <div>
                      <span className="text-[10px] font-bold text-amber-200 uppercase">
                        YOUR PICK
                      </span>
                      <div className="text-lg font-black text-[#ffd739] mt-1">
                        {rpsState.player}
                      </div>
                    </div>
                    <span className="font-shark italic font-black text-xl text-white">VS</span>
                    <div>
                      <span className="text-[10px] font-bold text-amber-200 uppercase">
                        DEALER
                      </span>
                      <div className="text-lg font-black text-emerald-300 mt-1">
                        {rpsState.dealer}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(game.name.toLowerCase().includes('coin')
                      ? [
                          { label: '🪙 HEADS (GOLD)', odds: 1.98 },
                          { label: '🪙 TAILS (SILVER)', odds: 1.98 },
                          { label: '⚡ EDGE BONUS', odds: 15.0 },
                        ]
                      : [
                          { label: '✊ ROCK', odds: 2.9 },
                          { label: '✋ PAPER', odds: 2.9 },
                          { label: '✌️ SCISSORS', odds: 2.9 },
                        ]
                    ).map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void handlePlaceStudioMarketBet({ label: m.label, odds: m.odds })
                        }
                        className="p-3.5 rounded-2xl bg-[#42370b] hover:bg-[#5a4a12] border-2 border-[#ffd739] text-white font-black text-xs sm:text-sm cursor-pointer"
                      >
                        <div>{m.label}</div>
                        <div className="font-mono-tabular text-[#ffd739] mt-0.5">
                          {m.odds.toFixed(2)}x
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <CasinoChipSelectorBar stake={stake} onSelectStake={setStake} disabled={busy} />
            </div>
          )}

          {/* Round Result Feedback Banner */}
          {roundResultBanner && (
            <div
              data-testid="arena-round-result-banner"
              className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 ${
                roundResultBanner.won
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100'
                  : 'bg-amber-500/20 border-[#ffd739] text-amber-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {roundResultBanner.won ? (
                  <Sparkles className="w-5 h-5 text-[#ffd739] shrink-0" />
                ) : (
                  <RotateCcw className="w-5 h-5 text-[#ffd739] shrink-0" />
                )}
                <div>
                  <p className="text-xs sm:text-sm font-black uppercase">
                    {roundResultBanner.title}
                  </p>
                  <p className="text-xs opacity-90">{roundResultBanner.detail}</p>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#ffd739]" />
            </div>
          )}

          {/* Recent Session Tickets Mini-History */}
          {recentRoundTickets.length > 0 && (
            <div className="border-t border-[#ffd739]/25 pt-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#ffd739] mb-2">
                Recent Real-Time Game Tickets (Synced with Wallet &amp; Coins)
              </p>
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {recentRoundTickets.map((t) => (
                  <div
                    key={t.ticketId}
                    className="px-3 py-1.5 rounded-lg bg-[#241e06] border border-[#ffd739]/25 flex items-center justify-between text-[11px]"
                  >
                    <span className="font-mono-tabular text-amber-100">
                      {t.ticketId} · {t.selection}
                    </span>
                    <span
                      className={`font-mono-tabular font-bold ${
                        t.status === 'WON' || t.status === 'CASHED_OUT'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {t.status}{' '}
                      {t.payoutAmount > 0
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
