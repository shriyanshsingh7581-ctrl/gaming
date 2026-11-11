import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../utils/exchangeLogic';
import {
  ALL_200_EXCHANGE_GAMES,
  CASINO_PROVIDERS_LIST,
  EXCHANGE_GAME_CATEGORIES,
  SPORTS_CATEGORIES_LIST,
  INITIAL_LIVE_SPORTS_MATCHES,
  INITIAL_RECENT_BIG_WINS,
  TEAEXCH_SPORTS_TILES,
  TEAEXCH_CATEGORY_TILES_PRIMARY,
  TEAEXCH_CATEGORY_TILES_SECONDARY,
  TEAEXCH_CASINO_PROVIDERS,
  formatTeaExchCdnImage,
  PlayableExchangeGame,
  LiveSportsMatch,
  RecentBigWinItem,
  ExchangeBetTicket,
  SportCategoryKey,
  ExchangeGameCategory,
  CasinoProviderName,
  TeaExchHomeSectionCode,
  calculateExchangeBetMath,
  tickLiveSportsMatches,
} from '../utils/teaExchCatalog';
import { updateCustomerWalletBalance } from '../firebase';
import {
  Crown,
  Flame,
  Search,
  Ticket,
  Play,
  Coins,
  X,
  SlidersHorizontal,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap,
  Trophy,
} from 'lucide-react';

export type TeaExchBottomHubTab = 'home' | 'inplay' | 'casino' | 'sports';

interface TeaExchHomeHubProps {
  currentUser: UserProfile | null;
  onOpenGame: (game: PlayableExchangeGame) => void;
  onRequireAuth: () => void;
  onNotify: (msg: string) => void;
  externalTicketTrigger?: ExchangeBetTicket | null;
  activeHubTab?: TeaExchBottomHubTab;
  onHubTabChange?: (tab: TeaExchBottomHubTab) => void;
}

interface PendingSportsSlip {
  matchId: string;
  eventName: string;
  competitionName: string;
  marketName: string;
  selection: string;
  betType: 'BACK' | 'LAY' | 'YES' | 'NO';
  odds: number;
}

/**
 * Exact Gold Coin SVG icon used in teaexch999.com/home `RecentBigWins` and Coin displays
 */
const TeaExchGoldCoinSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" fill="url(#goldCoinGrad)" stroke="#FEF08A" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="7" stroke="#92400E" strokeWidth="1" strokeDasharray="2 2" />
    <path
      d="M9.5 8.5H14.5M9.5 11H14.5M11.5 8.5C12.8 8.5 13.8 9.2 13.8 10.3C13.8 11.4 12.8 12.2 11.2 12.2H10L13.8 16"
      stroke="#422006"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="goldCoinGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFFbeb" />
        <stop offset="0.35" stopColor="#FFD739" />
        <stop offset="1" stopColor="#B45309" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Reusable Horizontal Game Carousel matching teaexch999.com/home `game-carousel-ctn` / `games-row`
 * Uses exact 336/440 portrait aspect ratio and real CDN game thumbnails (`imgUrl`).
 */
const TeaExchHorizontalGameSection: React.FC<{
  title: string;
  subtitle?: string;
  sectionTestId: string;
  games: PlayableExchangeGame[];
  onOpenGame: (game: PlayableExchangeGame) => void;
  onViewAllClick?: () => void;
}> = ({ title, subtitle, sectionTestId, games, onOpenGame, onViewAllClick }) => {
  const rowRef = useRef<HTMLDivElement | null>(null);

  const scrollRow = (dir: 'left' | 'right') => {
    if (!rowRef.current) return;
    const distance = dir === 'left' ? -460 : 460;
    rowRef.current.scrollBy({ left: distance, behavior: 'smooth' });
  };

  if (games.length === 0) return null;

  return (
    <section
      aria-label={title}
      data-testid={sectionTestId}
      className="rounded-2xl bg-[#241e06] border border-[#ffd739]/30 p-3 sm:p-4 shadow-xl space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-5 rounded-full bg-[#ffd739] shrink-0" />
          <div className="min-w-0">
            <h3 className="font-shark italic font-black text-sm sm:text-lg text-[#ffd739] uppercase tracking-wide truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] sm:text-[11px] text-amber-200/75 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onViewAllClick && (
            <button
              type="button"
              onClick={onViewAllClick}
              className="px-2.5 py-1 rounded-lg bg-[#42370b] hover:bg-[#5a4a12] border border-[#ffd739]/40 text-[#ffd739] font-extrabold text-[11px] uppercase cursor-pointer"
            >
              See All ({games.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => scrollRow('left')}
            aria-label={`Scroll ${title} Left`}
            className="p-1.5 rounded-lg bg-[#42370b] hover:bg-[#5a4a12] border border-[#ffd739]/30 text-[#ffd739] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollRow('right')}
            aria-label={`Scroll ${title} Right`}
            className="p-1.5 rounded-lg bg-[#42370b] hover:bg-[#5a4a12] border border-[#ffd739]/30 text-[#ffd739] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal `games-row` with exact teaexch999 336/440 portrait cards */}
      <div
        ref={rowRef}
        className="flex items-stretch gap-2.5 sm:gap-3 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth"
      >
        {games.map((game) => (
          <button
            key={`${sectionTestId}-${game.id}`}
            type="button"
            onClick={() => onOpenGame(game)}
            className="group relative w-[112px] sm:w-[138px] md:w-[150px] shrink-0 rounded-xl overflow-hidden bg-[#42370b] border border-[#ffd739]/30 hover:border-[#ffd739] transition-all duration-200 hover:-translate-y-1 shadow-lg text-left cursor-pointer flex flex-col"
          >
            <div className="relative w-full aspect-[336/440] bg-[#1a1504] overflow-hidden">
              <img
                src={formatTeaExchCdnImage(game.imgUrl, 336, 80)}
                alt={game.name}
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== game.imgUrl) {
                    target.src = game.imgUrl;
                  }
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-x-0 top-0 p-1.5 flex items-center justify-between bg-gradient-to-b from-black/75 via-black/25 to-transparent">
                <span className="px-1.5 py-0.5 rounded bg-black/75 border border-[#ffd739]/40 font-mono-tabular font-black text-[9px] text-[#ffd739]">
                  #{game.gameNumber}
                </span>
                {game.isHot && (
                  <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[8px] uppercase">
                    HOT
                  </span>
                )}
              </div>

              {/* Hover Play Overlay */}
              <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                <div className="w-10 h-10 rounded-full bg-[#ffd739] text-black flex items-center justify-center shadow-lg mb-1">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
                <span className="text-[10px] font-black uppercase text-[#ffd739] tracking-wider">
                  Play Now
                </span>
              </div>
            </div>

            <div className="p-2 bg-gradient-to-b from-[#42370b] to-[#241e06] flex-1 flex flex-col justify-between">
              <p className="text-[11px] font-extrabold text-white truncate leading-tight">
                {game.name}
              </p>
              <div className="flex items-center justify-between mt-1 text-[9px] text-amber-200/80 font-mono-tabular">
                <span className="truncate max-w-[75px]">{game.rawProvider || game.provider}</span>
                <span className="text-[#ffd739] font-bold">{game.maxMultiplier}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export const TeaExchHomeHub: React.FC<TeaExchHomeHubProps> = ({
  currentUser,
  onOpenGame,
  onRequireAuth,
  onNotify,
  externalTicketTrigger,
  activeHubTab = 'home',
  onHubTabChange,
}) => {
  const [internalHubTab, setInternalHubTab] = useState<TeaExchBottomHubTab>(activeHubTab);

  useEffect(() => {
    setInternalHubTab(activeHubTab);
  }, [activeHubTab]);

  useEffect(() => {
    const handleSwitchTab = (evt: Event) => {
      const custom = evt as CustomEvent<TeaExchBottomHubTab>;
      if (custom.detail) {
        setInternalHubTab(custom.detail);
        onHubTabChange?.(custom.detail);
      }
    };
    window.addEventListener('shark-switch-hub-tab', handleSwitchTab);
    return () => window.removeEventListener('shark-switch-hub-tab', handleSwitchTab);
  }, [onHubTabChange]);

  const setHubTab = (tab: TeaExchBottomHubTab) => {
    setInternalHubTab(tab);
    onHubTabChange?.(tab);
  };

  // Real-time feed states synced with `/api/exchange/realtime-feed`
  const [matches, setMatches] = useState<LiveSportsMatch[]>(INITIAL_LIVE_SPORTS_MATCHES);
  const [recentBigWins, setRecentBigWins] = useState<RecentBigWinItem[]>(
    INITIAL_RECENT_BIG_WINS
  );
  const [myTickets, setMyTickets] = useState<ExchangeBetTicket[]>([]);

  // Sports Exchange Filter & Slip State
  const [selectedSport, setSelectedSport] = useState<'ALL' | SportCategoryKey>('ALL');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>('match-crc-1');
  const [activeSlip, setActiveSlip] = useState<PendingSportsSlip | null>(null);
  const [slipStake, setSlipStake] = useState<number>(500);
  const [placingBet, setPlacingBet] = useState<boolean>(false);
  const [settlingTicketId, setSettlingTicketId] = useState<string | null>(null);

  // In-Play Accordion State (`00:21 - 00:23`, `01:30 - 01:36`)
  const [collapsedSports, setCollapsedSports] = useState<Record<string, boolean>>({});

  // Casino Tab Filter State (`00:25 - 01:29`)
  const [casinoTopProvider, setCasinoTopProvider] = useState<string>('ALL');
  const [casinoSubCategory, setCasinoSubCategory] = useState<string>('ALL');
  const [casinoSearch, setCasinoSearch] = useState<string>('');

  // Sportsbook 1x2 View State (`01:44 - 02:04`)
  const [sportsbookActiveFilter, setSportsbookActiveFilter] = useState<string>('Cricket');
  const [sportsbookQuickMenuOpen, setSportsbookQuickMenuOpen] = useState<boolean>(false);

  // 200 Games Catalog Filter State
  const [selectedGameCategory, setSelectedGameCategory] = useState<
    'ALL' | ExchangeGameCategory
  >('ALL');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<
    'ALL' | TeaExchHomeSectionCode
  >('ALL');
  const [selectedProvider, setSelectedProvider] = useState<'ALL' | CasinoProviderName>(
    'ALL'
  );
  const [gameSearchQuery, setGameSearchQuery] = useState<string>('');
  const [showAll200AtOnce, setShowAll200AtOnce] = useState<boolean>(true);

  const sportsSectionRef = useRef<HTMLElement | null>(null);
  const catalogSectionRef = useRef<HTMLElement | null>(null);

  // Fetch initial & periodic real-time feed from server
  const fetchRealtimeFeed = async () => {
    try {
      const uidParam = currentUser?.uid ? `?uid=${encodeURIComponent(currentUser.uid)}` : '';
      const res = await fetch(`/api/exchange/realtime-feed${uidParam}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.matches) && data.matches.length > 0) {
        setMatches(data.matches);
      }
      if (Array.isArray(data.recentBigWins) && data.recentBigWins.length > 0) {
        setRecentBigWins(data.recentBigWins);
      }
      if (Array.isArray(data.userTickets)) {
        setMyTickets(data.userTickets);
      }
    } catch {
      // Fallback to local real-time ticker if offline
      setMatches((prev) => tickLiveSportsMatches(prev));
    }
  };

  useEffect(() => {
    void fetchRealtimeFeed();
    const timer = window.setInterval(() => {
      void fetchRealtimeFeed();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [currentUser?.uid]);

  useEffect(() => {
    if (externalTicketTrigger) {
      setMyTickets((prev) => {
        const exists = prev.some((t) => t.ticketId === externalTicketTrigger.ticketId);
        if (exists) {
          return prev.map((t) =>
            t.ticketId === externalTicketTrigger.ticketId ? externalTicketTrigger : t
          );
        }
        return [externalTicketTrigger, ...prev];
      });
    }
  }, [externalTicketTrigger]);

  const balance = currentUser?.walletBalance ?? 0;

  // Exact home sections from teaexch999.com/home
  const hotGamesSection = ALL_200_EXCHANGE_GAMES.filter((g) => g.sectionCode === 'hot_games');
  const popularNowSection = ALL_200_EXCHANGE_GAMES.filter((g) => g.sectionCode === 'new_launch');
  const mustPlaySection = ALL_200_EXCHANGE_GAMES.filter(
    (g) => g.sectionCode === 'recommended_games'
  );
  const liveCasinoSection = ALL_200_EXCHANGE_GAMES.filter(
    (g) => g.sectionCode === 'live_casino_games'
  );
  const slotsSection = ALL_200_EXCHANGE_GAMES.filter((g) => g.sectionCode === 'slot');

  // Filter live sports matches
  const filteredMatches =
    selectedSport === 'ALL'
      ? matches
      : matches.filter((m) => m.sport === selectedSport);

  // Filter 200 playable games
  const filteredGames = ALL_200_EXCHANGE_GAMES.filter((g) => {
    if (selectedSectionFilter !== 'ALL' && g.sectionCode !== selectedSectionFilter) {
      return false;
    }
    if (selectedGameCategory !== 'ALL' && g.category !== selectedGameCategory) {
      return false;
    }
    if (selectedProvider !== 'ALL' && g.provider !== selectedProvider) {
      return false;
    }
    if (gameSearchQuery.trim()) {
      const q = gameSearchQuery.trim().toLowerCase();
      return (
        g.name.toLowerCase().includes(q) ||
        g.provider.toLowerCase().includes(q) ||
        (g.rawProvider || '').toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        `#${g.gameNumber}` === q ||
        String(g.gameNumber) === q
      );
    }
    return true;
  });

  const displayedGames = showAll200AtOnce ? filteredGames : filteredGames.slice(0, 40);

  // Exact Casino Tab Filtering (`00:25 - 01:29` of video)
  const CASINO_VIDEO_PROVIDER_TABS = [
    { key: 'ALL', label: 'ALL', isNew: false },
    { key: 'RECENT', label: 'RECENT', isNew: false },
    { key: 'FANTASY11', label: 'FANTASY11', isNew: true },
    { key: 'RANDORA', label: 'RANDORA', isNew: true },
    { key: 'Royal Gaming', label: 'ROYAL GAMING', isNew: false },
    { key: 'Mac88', label: 'MAC88', isNew: false },
    { key: 'Spribe', label: 'SPRIBE', isNew: false },
    { key: 'JILI', label: 'JILI', isNew: false },
    { key: 'Evolution', label: 'EVOLUTION', isNew: false },
    { key: 'Ezugi', label: 'EZUGI', isNew: false },
    { key: 'Turbogames', label: 'TURBOGAMES', isNew: false },
    { key: 'Gamzix', label: 'GAMZIX', isNew: false },
    { key: 'Smartsoft', label: 'SMARTSOFT', isNew: false },
    { key: 'Fun Games', label: 'FUN GAMES', isNew: false },
  ] as const;

  const CASINO_VIDEO_CATEGORY_ICONS = [
    { key: 'ALL', label: 'ALL', icon: '🎰', kw: '' },
    { key: 'Dragon Tiger', label: 'Dragon Tiger', icon: '🐉', kw: 'dragon' },
    { key: 'Aviator', label: 'Aviator', icon: '✈️', kw: 'aviator' },
    { key: 'Mines', label: 'Mines', icon: '💣', kw: 'mines' },
    { key: 'Color Prediction', label: 'Color Prediction', icon: '🎨', kw: 'color' },
    { key: 'Andar Bahar', label: 'Andar Bahar', icon: '🃏', kw: 'andar' },
    { key: 'Teenpatti', label: 'Teenpatti', icon: '👑', kw: 'teen' },
    { key: 'Live Lobby', label: 'Live Lobby', icon: '🎥', kw: 'live' },
    { key: 'Crash Games', label: 'Crash Games', icon: '🚀', kw: 'crash' },
    { key: 'Casual Games', label: 'Casual Games', icon: '🎲', kw: 'plinko' },
    { key: 'Scratch Cards', label: 'Scratch Cards', icon: '🎫', kw: 'scratch' },
    { key: 'Live Blackjack', label: 'Live Blackjack', icon: '♠️', kw: 'blackjack' },
    { key: 'Live Baccarat', label: 'Live Baccarat', icon: '💎', kw: 'baccarat' },
    { key: 'Live Sic Bo', label: 'Live Sic Bo', icon: '🎲', kw: 'sic' },
    { key: 'Live Roulette', label: 'Live Roulette', icon: '🎡', kw: 'roulette' },
    { key: 'Virtual Casino', label: 'Virtual Casino', icon: '🕹️', kw: 'virtual' },
    { key: 'Tv Games', label: 'Tv Games', icon: '📺', kw: 'wheel' },
  ] as const;

  const casinoTabFilteredGames = ALL_200_EXCHANGE_GAMES.filter((g) => {
    if (casinoTopProvider !== 'ALL' && casinoTopProvider !== 'RECENT') {
      const pLower = casinoTopProvider.toLowerCase();
      const matchProv =
        g.provider.toLowerCase().includes(pLower) ||
        (g.rawProvider || '').toLowerCase().includes(pLower) ||
        (casinoTopProvider === 'FANTASY11' && g.gameNumber <= 25) ||
        (casinoTopProvider === 'RANDORA' && g.gameNumber > 25 && g.gameNumber <= 55);
      if (!matchProv) return false;
    }
    if (casinoSubCategory !== 'ALL') {
      const selectedCatObj = CASINO_VIDEO_CATEGORY_ICONS.find(
        (c) => c.key === casinoSubCategory
      );
      const kw = (selectedCatObj?.kw || casinoSubCategory).toLowerCase();
      const matchesCat =
        g.name.toLowerCase().includes(kw) ||
        g.category.toLowerCase().includes(kw) ||
        g.engine.toLowerCase().includes(kw);
      if (!matchesCat) return false;
    }
    if (casinoSearch.trim()) {
      const q = casinoSearch.trim().toLowerCase();
      return (
        g.name.toLowerCase().includes(q) ||
        g.provider.toLowerCase().includes(q) ||
        (g.rawProvider || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const slipMath = activeSlip
    ? calculateExchangeBetMath({
        betType: activeSlip.betType,
        odds: activeSlip.odds,
        stake: slipStake,
      })
    : null;

  const scrollToCatalogWithFilter = (opts: {
    category?: 'ALL' | ExchangeGameCategory;
    section?: 'ALL' | TeaExchHomeSectionCode;
    provider?: 'ALL' | CasinoProviderName;
    search?: string;
  }) => {
    if (opts.category !== undefined) setSelectedGameCategory(opts.category);
    if (opts.section !== undefined) setSelectedSectionFilter(opts.section);
    if (opts.provider !== undefined) setSelectedProvider(opts.provider);
    if (opts.search !== undefined) setGameSearchQuery(opts.search);
    catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /**
   * Places a Real-Time Sports Back/Lay/Fancy Bet Ticket & Deducts Coins Immediately
   */
  const handlePlaceSportsBetTicket = async () => {
    if (!activeSlip || !slipMath) return;
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (slipStake < 10) {
      onNotify('Minimum bet stake is ₹10.');
      return;
    }
    if (slipMath.liability > balance) {
      onNotify(
        `Insufficient Wallet Coins for Liability ₹${slipMath.liability.toLocaleString(
          'en-IN'
        )} (Available: ₹${balance.toLocaleString('en-IN')}). Please Deposit first.`
      );
      return;
    }

    setPlacingBet(true);
    try {
      const nextBalance = Math.max(0, Math.round(balance - slipMath.liability));
      await updateCustomerWalletBalance(currentUser.uid, nextBalance);

      let createdTicket: ExchangeBetTicket = {
        ticketId: `TKT-${Date.now().toString().slice(-6)}`,
        uid: currentUser.uid,
        userName: currentUser.name,
        userEmail: currentUser.email,
        category: 'SPORTS_EXCHANGE',
        eventOrGameId: activeSlip.matchId,
        eventOrGameName: activeSlip.eventName,
        marketName: activeSlip.marketName,
        selection: activeSlip.selection,
        betType: activeSlip.betType,
        odds: activeSlip.odds,
        stake: slipStake,
        liability: slipMath.liability,
        potentialReturn: slipMath.totalReturn,
        payoutAmount: 0,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      };

      const res = await fetch('/api/exchange/tickets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUser.uid,
          userName: currentUser.name,
          userEmail: currentUser.email,
          category: 'SPORTS_EXCHANGE',
          eventOrGameId: activeSlip.matchId,
          eventOrGameName: activeSlip.eventName,
          marketName: activeSlip.marketName,
          selection: activeSlip.selection,
          betType: activeSlip.betType,
          odds: activeSlip.odds,
          stake: slipStake,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ticket) {
          createdTicket = data.ticket;
        }
      }

      setMyTickets((prev) => [createdTicket, ...prev]);
      setActiveSlip(null);
      onNotify(
        `Real-Time Ticket ${createdTicket.ticketId} Placed! ₹${slipMath.liability.toLocaleString(
          'en-IN'
        )} coins deducted from Wallet.`
      );
    } catch {
      onNotify('Could not place ticket. Please try again.');
    } finally {
      setPlacingBet(false);
    }
  };

  /**
   * Instant Cashout or Real-Time Settlement of an Open Sports Ticket
   */
  const handleInstantSettleOrCashout = async (
    ticket: ExchangeBetTicket,
    mode: 'CASHED_OUT' | 'SETTLE_RESULT'
  ) => {
    if (!currentUser || ticket.status !== 'OPEN') return;
    setSettlingTicketId(ticket.ticketId);
    try {
      let finalStatus: 'WON' | 'LOST' | 'CASHED_OUT' = 'CASHED_OUT';
      let payout = 0;
      let note = '';

      if (mode === 'CASHED_OUT') {
        finalStatus = 'CASHED_OUT';
        payout = Math.round(ticket.liability * 1.22);
        note = `Instant Live Cashout (+₹${(payout - ticket.liability).toLocaleString('en-IN')} profit)`;
      } else {
        const won = Math.random() < 0.62;
        finalStatus = won ? 'WON' : 'LOST';
        payout = won ? ticket.potentialReturn : 0;
        note = won
          ? `Match Market Won @ ${ticket.odds}x`
          : `Market Settled Against Selection`;
      }

      if (payout > 0) {
        await updateCustomerWalletBalance(
          currentUser.uid,
          Math.round(balance + payout)
        );
      }

      const res = await fetch('/api/exchange/tickets/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.ticketId,
          status: finalStatus,
          payoutAmount: payout,
          resultNote: note,
        }),
      });

      let updated: ExchangeBetTicket = {
        ...ticket,
        status: finalStatus,
        payoutAmount: payout,
        resultNote: note,
        settledAt: new Date().toISOString(),
      };
      if (res.ok) {
        const data = await res.json();
        if (data.ticket) updated = data.ticket;
      }

      setMyTickets((prev) =>
        prev.map((t) => (t.ticketId === ticket.ticketId ? updated : t))
      );

      if (payout > 0) {
        onNotify(
          `Ticket ${ticket.ticketId} ${finalStatus}! +₹${payout.toLocaleString(
            'en-IN'
          )} Coins credited to your Wallet in real time!`
        );
      } else {
        onNotify(`Ticket ${ticket.ticketId} settled as LOST.`);
      }
    } finally {
      setSettlingTicketId(null);
    }
  };

  return (
    <div data-testid="teaexch-home-hub" className="space-y-5">
      {/* ========================================================================
       * DEDICATED VIEW A: CASINO TAB (`00:25 - 01:29` & `01:37 - 01:43` of video)
       * `[🟡 CASINO]` + `[Search games (X)]` + Provider Tabs + Category Icon Cards + Grid
       * ======================================================================== */}
      {internalHubTab === 'casino' && (
        <section
          aria-label="Casino Full View"
          data-testid="video-casino-tab-view"
          className="rounded-2xl bg-[#241e06] border border-[#ffd739]/45 overflow-hidden shadow-2xl space-y-3 pb-4"
        >
          {/* Top Bar: `[🟡 CASINO]` + `[Search games (X)]` */}
          <div className="bg-[#332b09] px-3.5 py-2.5 border-b border-[#ffd739]/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-5 h-5 rounded-full bg-[#ffd739] text-black flex items-center justify-center font-black text-xs">
                🎰
              </span>
              <span className="font-shark italic font-black text-sm sm:text-base text-[#ffd739] uppercase tracking-wider">
                CASINO
              </span>
            </div>

            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={casinoSearch}
                onChange={(e) => setCasinoSearch(e.target.value)}
                placeholder="Search games"
                className="w-full pl-3 pr-8 py-1.5 rounded-lg bg-[#241e06] border border-[#ffd739]/35 text-xs text-white placeholder:text-amber-200/60 focus:outline-none focus:border-[#ffd739]"
              />
              {casinoSearch ? (
                <button
                  type="button"
                  onClick={() => setCasinoSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-200 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Search className="w-3.5 h-3.5 text-amber-200/70 absolute right-2.5 top-1/2 -translate-y-1/2" />
              )}
            </div>
          </div>

          {/* Row 1: Horizontal Provider Tabs (`ALL`, `RECENT`, `FANTASY11 [NEW]`, `RANDORA [NEW]`, `ROYAL GAMING`, `MAC88`, `SPRIBE`, `JILI`, `EVOLUTION`, etc.) */}
          <div className="px-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-[#ffd739]/20 pb-2">
            {CASINO_VIDEO_PROVIDER_TABS.map((prov) => {
              const isAct = casinoTopProvider === prov.key;
              return (
                <button
                  key={prov.key}
                  type="button"
                  onClick={() => setCasinoTopProvider(prov.key)}
                  className={`relative px-3 py-1.5 rounded-lg font-extrabold text-[11px] uppercase whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                    isAct
                      ? 'bg-[#ffd739] text-black shadow'
                      : 'bg-[#42370b] text-white hover:bg-[#5a4a12] border border-[#ffd739]/25'
                  }`}
                >
                  <span>{prov.label}</span>
                  {prov.isNew && (
                    <span className="ml-1 px-1 py-0.2 rounded bg-red-600 text-white text-[8px] font-black animate-pulse">
                      NEW
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Row 2: Horizontal Category Icon Cards (`ALL`, `Dragon Tiger`, `Aviator`, `Mines`, `Color Prediction`, `Andar Bahar`, `Teenpatti`, etc.) */}
          <div className="px-3 flex items-stretch gap-2 overflow-x-auto no-scrollbar pb-1">
            {CASINO_VIDEO_CATEGORY_ICONS.map((cat) => {
              const isAct = casinoSubCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCasinoSubCategory(cat.key)}
                  className={`px-3 py-2 rounded-xl border flex flex-col items-center justify-center gap-1 min-w-[76px] shrink-0 cursor-pointer transition-all ${
                    isAct
                      ? 'bg-[#ffd739] text-black border-[#ffd739] shadow-md'
                      : 'bg-[#332b09] text-amber-100 border-[#ffd739]/30 hover:border-[#ffd739]'
                  }`}
                >
                  <span className="text-base leading-none">{cat.icon}</span>
                  <span className="text-[10px] font-extrabold whitespace-nowrap">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 3-Column Mobile / 5-Column Desktop Casino Game Thumbnail Grid */}
          <div className="px-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {casinoTabFilteredGames.map((game) => (
              <button
                key={`casino-tab-${game.id}`}
                type="button"
                onClick={() => onOpenGame(game)}
                className="group relative rounded-xl overflow-hidden bg-[#42370b] border border-[#ffd739]/35 hover:border-[#ffd739] transition-all text-left cursor-pointer flex flex-col shadow-md"
              >
                <div className="relative w-full aspect-[336/440] bg-[#1a1504] overflow-hidden">
                  <img
                    src={formatTeaExchCdnImage(game.imgUrl, 336, 80)}
                    alt={game.name}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== game.imgUrl) {
                        target.src = game.imgUrl;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                    <p className="text-[10px] sm:text-[11px] font-extrabold text-white truncate">
                      {game.name}
                    </p>
                    <p className="text-[9px] text-[#ffd739] font-mono-tabular truncate">
                      {game.rawProvider || game.provider}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================
       * DEDICATED VIEW B: IN-PLAY EXCHANGE TAB (`00:21 - 00:23`, `01:30 - 01:36`)
       * Golden Marquee + `[LIVE]` Sport Icons Strip + `EXCHANGE (21)` + Collapsible
       * `CRICKET`, `TENNIS`, `BINARY`, `BASKETBALL`, `TABLE TENNIS`, `ICE HOCKEY`
       * ======================================================================== */}
      {internalHubTab === 'inplay' && (
        <section
          aria-label="In-Play Exchange Full View"
          data-testid="video-inplay-tab-view"
          className="rounded-2xl bg-[#241e06] border border-[#ffd739]/45 overflow-hidden shadow-2xl space-y-3 pb-4"
        >
          {/* Golden Marquee Ticker (`00:21` of video) */}
          <div className="bg-[#332b09] px-3 py-1.5 border-b border-[#ffd739]/35 flex items-center gap-2 text-xs text-[#ffd739] font-bold overflow-hidden">
            <span className="shrink-0">🔔</span>
            <div className="truncate font-mono-tabular">
              • 1500 GAMES IN CASINO • Group betting is not allowed in our exchange • Sign Up &amp; Get ₹500 Instant Welcome Bonus!
            </div>
          </div>

          {/* Horizontal `[LIVE]` Sport Icons Strip (`All`, `Cricket [LIVE]`, `Football [LIVE]`, `Tennis [LIVE]`, `Binary [LIVE]`, `Basketball [LIVE]`, `Table Tennis [LIVE]`, `Ice Hockey [LIVE]`) */}
          <div className="px-3 flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {[
              { key: 'ALL', label: 'All', liveCount: matches.length, icon: '🌐' },
              { key: 'Cricket', label: 'Cricket', liveCount: 4, icon: '🏏' },
              { key: 'Football', label: 'Football', liveCount: 2, icon: '⚽' },
              { key: 'Tennis', label: 'Tennis', liveCount: 2, icon: '🎾' },
              { key: 'Binary', label: 'Binary', liveCount: 1, icon: '📈' },
            ].map((sp) => {
              const active = selectedSport === sp.key;
              return (
                <button
                  key={sp.key}
                  type="button"
                  onClick={() => setSelectedSport(sp.key as 'ALL' | SportCategoryKey)}
                  className={`relative px-3 py-2 rounded-xl border flex flex-col items-center justify-center min-w-[74px] shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#ffd739] text-black border-[#ffd739] font-black'
                      : 'bg-[#42370b] text-white border-[#ffd739]/30'
                  }`}
                >
                  <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-black text-[8px] uppercase mb-0.5">
                    LIVE
                  </span>
                  <span className="text-sm">{sp.icon}</span>
                  <span className="text-[10px] font-extrabold mt-0.5">{sp.label}</span>
                </button>
              );
            })}
          </div>

          {/* `EXCHANGE (21)` Header Pill Bar (`00:22` of video) */}
          <div className="px-3 flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#ffd739] text-black font-black text-xs uppercase tracking-wider shadow">
              <span>EXCHANGE ({matches.length + 10})</span>
            </div>
            <span className="text-[11px] font-mono-tabular text-amber-200">
              1 (Back/Lay) · X · 2 (Back/Lay)
            </span>
          </div>

          {/* Collapsible Sport Accordions (`CRICKET`, `TENNIS`, `BINARY`, `FOOTBALL`) */}
          <div className="px-3 space-y-3">
            {(['Cricket', 'Tennis', 'Binary', 'Football'] as const)
              .filter((sp) => selectedSport === 'ALL' || selectedSport === sp)
              .map((sportKey) => {
                const sportMatches = matches.filter((m) => m.sport === sportKey);
                if (sportMatches.length === 0) return null;
                const isCollapsed = Boolean(collapsedSports[sportKey]);

                return (
                  <div
                    key={`inplay-acc-${sportKey}`}
                    className="rounded-xl overflow-hidden border border-[#ffd739]/35 bg-[#332b09]"
                  >
                    {/* Golden-Olive Sport Header Bar (`CRICKET`, `TENNIS`, `BINARY`) */}
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedSports((prev) => ({
                          ...prev,
                          [sportKey]: !prev[sportKey],
                        }))
                      }
                      className="w-full px-3.5 py-2 bg-gradient-to-r from-[#846f1e] to-[#5a4a12] flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="font-shark italic font-black text-sm text-[#ffd739] uppercase tracking-wider">
                        {sportKey} ({sportMatches.length})
                      </span>
                      <div className="flex items-center gap-4 text-[10px] font-mono-tabular font-black text-white">
                        <span>1</span>
                        <span>X</span>
                        <span>2</span>
                        <span>{isCollapsed ? '➕' : '➖'}</span>
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="divide-y divide-[#ffd739]/20">
                        {sportMatches.map((match) => (
                          <div
                            key={`inplay-row-${match.id}`}
                            className="p-2.5 sm:p-3 bg-[#42370b] flex flex-col lg:flex-row lg:items-center justify-between gap-2.5"
                          >
                            {/* Left Match Title + `LIVE` badge + `P | MO | BM | F` Yellow Circular Badges */}
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-black font-black text-[9px] uppercase">
                                  LIVE
                                </span>
                                <span className="text-[10px] text-amber-200 font-semibold truncate">
                                  {match.competitionName}
                                </span>
                                {/* Exact `P | MO | BM | F` yellow circular badges from video `00:22` */}
                                <div className="flex items-center gap-1 ml-auto sm:ml-2">
                                  {['P', 'MO', 'BM', 'F'].map((b) => (
                                    <span
                                      key={b}
                                      className="w-4 h-4 rounded-full bg-[#ffd739] text-black font-black text-[8px] flex items-center justify-center shadow"
                                    >
                                      {b}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <p className="font-extrabold text-xs sm:text-sm text-white truncate">
                                {match.eventName}
                              </p>
                              <p className="text-[10px] font-mono-tabular text-[#ffd739]">
                                {match.scoreSummary}
                              </p>
                            </div>

                            {/* 6-Column Blue (`#72bbef`) Back & Pink (`#faa9ba`) Lay Odds Strip */}
                            <div className="grid grid-cols-6 gap-1 shrink-0">
                              {/* 1 Back / Lay */}
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveSlip({
                                    matchId: match.id,
                                    eventName: match.eventName,
                                    competitionName: match.competitionName,
                                    marketName: 'Match Odds',
                                    selection: match.runners.home.label,
                                    betType: 'BACK',
                                    odds: match.runners.home.back,
                                  })
                                }
                                className="py-1.5 px-2 rounded bg-[#72bbef] text-slate-950 font-mono-tabular text-center cursor-pointer"
                              >
                                <div className="text-[11px] font-black leading-none">
                                  {match.runners.home.back.toFixed(2)}
                                </div>
                                <div className="text-[8px] font-bold opacity-75">
                                  {match.runners.home.backSize}
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveSlip({
                                    matchId: match.id,
                                    eventName: match.eventName,
                                    competitionName: match.competitionName,
                                    marketName: 'Match Odds',
                                    selection: match.runners.home.label,
                                    betType: 'LAY',
                                    odds: match.runners.home.lay,
                                  })
                                }
                                className="py-1.5 px-2 rounded bg-[#faa9ba] text-slate-950 font-mono-tabular text-center cursor-pointer"
                              >
                                <div className="text-[11px] font-black leading-none">
                                  {match.runners.home.lay.toFixed(2)}
                                </div>
                                <div className="text-[8px] font-bold opacity-75">
                                  {match.runners.home.laySize}
                                </div>
                              </button>

                              {/* X Back / Lay */}
                              <div className="py-1.5 px-2 rounded bg-[#72bbef]/40 text-white font-mono-tabular text-center flex flex-col items-center justify-center text-[10px] font-bold">
                                {match.runners.draw
                                  ? match.runners.draw.back.toFixed(2)
                                  : '—'}
                              </div>
                              <div className="py-1.5 px-2 rounded bg-[#faa9ba]/40 text-white font-mono-tabular text-center flex flex-col items-center justify-center text-[10px] font-bold">
                                {match.runners.draw
                                  ? match.runners.draw.lay.toFixed(2)
                                  : '—'}
                              </div>

                              {/* 2 Back / Lay */}
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveSlip({
                                    matchId: match.id,
                                    eventName: match.eventName,
                                    competitionName: match.competitionName,
                                    marketName: 'Match Odds',
                                    selection: match.runners.away.label,
                                    betType: 'BACK',
                                    odds: match.runners.away.back,
                                  })
                                }
                                className="py-1.5 px-2 rounded bg-[#72bbef] text-slate-950 font-mono-tabular text-center cursor-pointer"
                              >
                                <div className="text-[11px] font-black leading-none">
                                  {match.runners.away.back.toFixed(2)}
                                </div>
                                <div className="text-[8px] font-bold opacity-75">
                                  {match.runners.away.backSize}
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveSlip({
                                    matchId: match.id,
                                    eventName: match.eventName,
                                    competitionName: match.competitionName,
                                    marketName: 'Match Odds',
                                    selection: match.runners.away.label,
                                    betType: 'LAY',
                                    odds: match.runners.away.lay,
                                  })
                                }
                                className="py-1.5 px-2 rounded bg-[#faa9ba] text-slate-950 font-mono-tabular text-center cursor-pointer"
                              >
                                <div className="text-[11px] font-black leading-none">
                                  {match.runners.away.lay.toFixed(2)}
                                </div>
                                <div className="text-[8px] font-bold opacity-75">
                                  {match.runners.away.laySize}
                                </div>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* ========================================================================
       * DEDICATED VIEW C: SPORTSBOOK `1x2` VIEW (`01:44 - 02:04` of video)
       * `[ ★ ]`, `[ ((•)) ]`, `Cricket (24)`, `Soccer (181)`, `Tennis (70)`, `SRL`
       * + `LIVE EVENTS` & `UPCOMING EVENTS` with `Score [ 0:0 ]` & `1x2` buttons
       * + Floating Right-Edge Purple Quick Menu (`Home`, `Inplay`, `My Bets`, `Results`, `Favourites`, `Search`)
       * ======================================================================== */}
      {internalHubTab === 'sports' && (
        <section
          aria-label="Sportsbook 1x2 View"
          data-testid="video-sportsbook-tab-view"
          className="relative rounded-2xl bg-[#191528] border border-[#ffd739]/45 overflow-hidden shadow-2xl space-y-4 p-3.5 sm:p-5"
        >
          {/* Top Horizontal Sport Counter Strip (`01:44` of video) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { key: 'Fav', label: '★', count: 0 },
              { key: 'Live', label: '((•)) LIVE', count: 21 },
              { key: 'Cricket', label: '🏏 Cricket', count: 24 },
              { key: 'Football', label: '⚽ Soccer', count: 181 },
              { key: 'Tennis', label: '🎾 Tennis', count: 70 },
              { key: 'SRL', label: '🎮 SRL', count: 16 },
            ].map((item) => {
              const isAct = sportsbookActiveFilter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSportsbookActiveFilter(item.key)}
                  className={`px-3 py-2 rounded-xl font-extrabold text-xs whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                    isAct
                      ? 'bg-[#ffd739] text-black shadow'
                      : 'bg-[#28223d] text-white border border-white/10 hover:border-[#ffd739]/50'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono-tabular ${
                        isAct ? 'bg-black/20 text-black' : 'bg-white/10 text-[#ffd739]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* LIVE EVENTS Header (`01:45` of video) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-shark italic font-black text-base text-[#ffd739] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE EVENTS</span>
              </h3>
              <span className="text-[11px] font-mono-tabular text-amber-200">
                Market: 1x2
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matches.map((m) => (
                <div
                  key={`sb-card-${m.id}`}
                  className="rounded-xl bg-[#251f3a] border border-[#ffd739]/30 p-3 space-y-2.5 shadow-lg"
                >
                  <div className="flex items-center justify-between text-[11px] text-amber-200/90 border-b border-white/10 pb-1.5">
                    <span className="truncate font-bold">
                      {m.sport} · {m.competitionName}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono-tabular font-bold text-[10px]">
                      1st innings · LIVE
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-extrabold text-xs sm:text-sm text-white truncate">
                        {m.teamA}
                      </p>
                      <p className="font-extrabold text-xs sm:text-sm text-white truncate">
                        {m.teamB}
                      </p>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-black/50 border border-[#ffd739]/40 text-center shrink-0">
                      <span className="block text-[9px] text-amber-200/80 uppercase">
                        Score
                      </span>
                      <span className="font-mono-tabular font-black text-xs text-[#ffd739]">
                        {m.scoreSummary.slice(0, 18)}
                      </span>
                    </div>
                  </div>

                  {/* 1 | X | 2 Odds Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSlip({
                          matchId: m.id,
                          eventName: m.eventName,
                          competitionName: m.competitionName,
                          marketName: '1x2 Sportsbook',
                          selection: m.teamA,
                          betType: 'BACK',
                          odds: m.runners.home.back,
                        })
                      }
                      className="py-2 px-2.5 rounded-lg bg-[#382f56] hover:bg-[#ffd739] hover:text-black text-white font-mono-tabular flex items-center justify-between text-xs font-bold transition-colors cursor-pointer"
                    >
                      <span className="opacity-75">1</span>
                      <span className="font-black text-[#ffd739] group-hover:text-black">
                        {m.runners.home.back.toFixed(2)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveSlip({
                          matchId: m.id,
                          eventName: m.eventName,
                          competitionName: m.competitionName,
                          marketName: '1x2 Sportsbook',
                          selection: 'Draw (X)',
                          betType: 'BACK',
                          odds: m.runners.draw?.back || 3.45,
                        })
                      }
                      className="py-2 px-2.5 rounded-lg bg-[#382f56] hover:bg-[#ffd739] hover:text-black text-white font-mono-tabular flex items-center justify-between text-xs font-bold transition-colors cursor-pointer"
                    >
                      <span className="opacity-75">X</span>
                      <span className="font-black text-[#ffd739]">
                        {(m.runners.draw?.back || 3.45).toFixed(2)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveSlip({
                          matchId: m.id,
                          eventName: m.eventName,
                          competitionName: m.competitionName,
                          marketName: '1x2 Sportsbook',
                          selection: m.teamB,
                          betType: 'BACK',
                          odds: m.runners.away.back,
                        })
                      }
                      className="py-2 px-2.5 rounded-lg bg-[#382f56] hover:bg-[#ffd739] hover:text-black text-white font-mono-tabular flex items-center justify-between text-xs font-bold transition-colors cursor-pointer"
                    >
                      <span className="opacity-75">2</span>
                      <span className="font-black text-[#ffd739]">
                        {m.runners.away.back.toFixed(2)}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right-Edge Floating Purple Quick Menu (`01:46 - 02:04` of video) */}
          <div className="fixed right-3 bottom-20 z-30 flex flex-col items-end gap-1.5">
            {sportsbookQuickMenuOpen && (
              <div className="rounded-2xl bg-[#3b1d5e]/95 border border-[#ffd739]/50 p-2 shadow-2xl flex flex-col gap-1.5 min-w-[130px] backdrop-blur-md">
                {[
                  { label: '🏠 Home', act: () => setHubTab('home') },
                  { label: '⚡ Inplay', act: () => setHubTab('inplay') },
                  {
                    label: '🎫 My Bets',
                    act: () =>
                      sportsSectionRef.current?.scrollIntoView({ behavior: 'smooth' }),
                  },
                  { label: '🏆 Results', act: () => onNotify('All Live Match Results synced!') },
                  { label: '⭐ Favourites', act: () => setSportsbookActiveFilter('Fav') },
                  { label: '🔍 Search', act: () => setHubTab('casino') },
                ].map((mItem) => (
                  <button
                    key={mItem.label}
                    type="button"
                    onClick={() => {
                      mItem.act();
                      setSportsbookQuickMenuOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#ffd739] hover:text-black text-white font-extrabold text-xs text-left transition-colors cursor-pointer"
                  >
                    {mItem.label}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setSportsbookQuickMenuOpen((p) => !p)}
              className="px-3.5 py-2 rounded-full bg-gradient-to-r from-[#581c87] to-[#7e22ce] border-2 border-[#ffd739] text-[#ffd739] font-black text-xs shadow-xl cursor-pointer flex items-center gap-1.5"
            >
              <span>{sportsbookQuickMenuOpen ? '✕ Close Menu' : '☰ Sports Menu'}</span>
            </button>
          </div>
        </section>
      )}

      {/* ========================================================================
       * 1. RECENT BIG WINS LIVE TICKER (Exact teaexch999.com/home `recent-big-wins`)
       *    Shows real game thumbnails (`imgUrl`), Crown icon, player name & Gold Coin amount
       * ======================================================================== */}
      <section
        aria-label="Recent Big Wins"
        data-testid="recent-big-wins-section"
        className="rounded-2xl bg-[#241e06] border border-[#ffd739]/40 p-3 sm:p-3.5 shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <Crown className="w-4 h-4 text-[#ffd739]" />
            <h3 className="font-shark italic font-black text-sm sm:text-base text-[#ffd739] uppercase tracking-wide">
              Recent Big Wins
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono-tabular text-amber-200 font-bold">
            <TeaExchGoldCoinSvg className="w-3.5 h-3.5" />
            <span>Live Coin Payouts</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {recentBigWins.slice(0, 14).map((win) => {
            const matchedGame =
              ALL_200_EXCHANGE_GAMES.find(
                (g) => g.name.toLowerCase() === win.gameName.toLowerCase()
              ) || ALL_200_EXCHANGE_GAMES[0];
            const thumbUrl = win.imgUrl || matchedGame.imgUrl;
            const winCoins = win.amount ?? win.winAmount ?? 12500;

            return (
              <button
                key={win.id}
                type="button"
                onClick={() => onOpenGame(matchedGame)}
                className="shrink-0 rounded-xl bg-[#42370b] hover:bg-[#5a4a12] border border-[#ffd739]/35 px-2.5 py-2 flex items-center gap-2.5 min-w-[215px] text-left transition-all cursor-pointer group"
              >
                <div className="w-11 h-14 rounded-lg overflow-hidden bg-[#1a1504] border border-[#ffd739]/40 shrink-0">
                  <img
                    src={formatTeaExchCdnImage(thumbUrl, 120, 75)}
                    alt={win.gameName}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-white truncate">
                    <Crown className="w-3 h-3 text-[#ffd739] shrink-0" />
                    <span className="truncate">{win.playerName}</span>
                  </div>
                  <p className="text-[10px] text-amber-200/80 truncate">{win.gameName}</p>
                  <div className="flex items-center gap-1 mt-1 font-mono-tabular font-black text-xs text-[#ffd739]">
                    <TeaExchGoldCoinSvg className="w-3.5 h-3.5 shrink-0" />
                    <span>+₹{winCoins.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================
       * 2. SPORTS EXCHANGE ARTWORK TILES (Exact teaexch999.com/home `sports-tiles`:
       *    CRICKET, FOOTBALL, TENNIS with real `prod-cdn.king18.co/indigo` images)
       * ======================================================================== */}
      <section
        aria-label="Sports Exchange Tiles"
        data-testid="teaexch-sports-tiles"
        className="rounded-2xl bg-[#241e06] border border-[#ffd739]/35 p-3 sm:p-4 shadow-xl space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-[#ffd739]" />
            <h3 className="font-shark italic font-black text-sm sm:text-lg text-[#ffd739] uppercase tracking-wide">
              Sports Exchange
            </h3>
          </div>
          <span className="text-[11px] font-mono-tabular text-amber-200/80">
            Click to Filter Live Odds
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
          {TEAEXCH_SPORTS_TILES.map((tile) => {
            const isSelected = selectedSport === tile.sport;
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => {
                  setSelectedSport(tile.sport);
                  sportsSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
                className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#ffd739] shadow-[0_0_20px_rgba(255,215,57,0.35)]'
                    : 'border-[#ffd739]/30 hover:border-[#ffd739]'
                }`}
              >
                <picture>
                  <source
                    media="(max-width: 640px)"
                    srcSet={formatTeaExchCdnImage(tile.mobileImage, 360, 80)}
                  />
                  <img
                    src={formatTeaExchCdnImage(tile.desktopImage, 680, 80)}
                    alt={tile.title}
                    loading="lazy"
                    className="w-full h-20 sm:h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-2 sm:p-3">
                  <span className="font-shark italic font-black text-xs sm:text-base text-[#ffd739] uppercase tracking-wider drop-shadow">
                    {tile.title}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#ffd739] text-black font-mono-tabular font-black text-[9px] sm:text-[10px]">
                    LIVE
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================
       * 3. TRENDING MATCHES (`top-matches-ctn`) & IN-PLAY LIVE SPORTS EXCHANGE
       * ======================================================================== */}
      <section
        ref={sportsSectionRef}
        aria-label="Live In-Play Sports Exchange"
        data-testid="live-sports-exchange-section"
        className="rounded-2xl bg-[#241e06] border border-[#ffd739]/45 p-3.5 sm:p-5 space-y-4 shadow-xl"
      >
        {/* Top Trending Matches Horizontal Cards (`top-matches-ctn` style from teaexch999.com/home) */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#ffd739]" />
              <div>
                <h3 className="font-shark italic font-black text-base sm:text-xl text-[#ffd739] uppercase tracking-wide">
                  Trending Matches · Live In-Play Exchange (Back &amp; Lay)
                </h3>
                <p className="text-[11px] text-amber-100/80">
                  Click any Blue (Back) or Pink (Lay) odd to place a Real-Time Bet Ticket with instant Wallet &amp; Coin sync
                </p>
              </div>
            </div>

            {/* Live Wallet + Coin Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-[#42370b] border border-[#ffd739]/50 flex items-center gap-2">
              <TeaExchGoldCoinSvg className="w-4 h-4" />
              <span className="text-xs font-mono-tabular font-black text-[#ffd739]">
                Coins: ₹{balance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Horizontal Trending Match Cards (`top-match-card` with `#42370b` / `#846f1e` golden-sunbet styling) */}
          <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
            {matches.slice(0, 6).map((tm) => (
              <div
                key={`trending-card-${tm.id}`}
                onClick={() => {
                  setSelectedSport(tm.sport);
                  setExpandedMatchId(tm.id);
                }}
                className="shrink-0 w-[265px] sm:w-[290px] rounded-xl bg-[#42370b] border border-[#ffd739]/40 overflow-hidden cursor-pointer hover:border-[#ffd739] transition-all"
              >
                <div className="px-3 py-1.5 bg-[#846f1e] flex items-center justify-between text-[10px] font-bold text-white">
                  <span className="truncate uppercase">{tm.competitionName}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-black font-black text-[9px]">
                    LIVE
                  </span>
                </div>
                <div className="p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-white">
                    <span className="truncate">{tm.teamA}</span>
                    <span className="text-[#ffd739] font-mono-tabular text-[10px]">VS</span>
                    <span className="truncate text-right">{tm.teamB}</span>
                  </div>
                  <p className="text-[10px] font-mono-tabular text-amber-200 truncate">
                    {tm.scoreSummary}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div className="py-1 px-2 rounded bg-[#72bbef] text-slate-950 font-mono-tabular text-center">
                      <span className="text-[10px] font-black">
                        {tm.runners.home.label.slice(0, 10)}: {tm.runners.home.back.toFixed(2)}
                      </span>
                    </div>
                    <div className="py-1 px-2 rounded bg-[#faa9ba] text-slate-950 font-mono-tabular text-center">
                      <span className="text-[10px] font-black">
                        {tm.runners.away.label.slice(0, 10)}: {tm.runners.away.back.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sports Filter Bar (`ALL`, `Cricket`, `Football`, `Tennis`, `Horse Racing`, `Greyhound`, `Kabaddi`, `Politics`, `Binary`) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-[#ffd739]/20 pt-3">
          <button
            type="button"
            onClick={() => setSelectedSport('ALL')}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              selectedSport === 'ALL'
                ? 'bg-[#ffd739] text-black shadow'
                : 'bg-[#42370b] text-amber-100 hover:text-white border border-[#ffd739]/30'
            }`}
          >
            All Sports ({matches.length})
          </button>
          {SPORTS_CATEGORIES_LIST.map((sp) => (
            <button
              key={sp.key}
              type="button"
              onClick={() => setSelectedSport(sp.key)}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                selectedSport === sp.key
                  ? 'bg-[#ffd739] text-black shadow'
                  : 'bg-[#42370b] text-amber-100 hover:text-white border border-[#ffd739]/30'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>

        {/* Match Odds Table List (`--table-bg: #42370b`) */}
        <div className="space-y-2.5">
          {filteredMatches.map((match) => {
            const isExpanded = expandedMatchId === match.id;
            return (
              <div
                key={match.id}
                data-testid={`live-match-card-${match.id}`}
                className="rounded-2xl bg-[#42370b] border border-[#ffd739]/30 overflow-hidden shadow-md"
              >
                {/* Match Row Header + 1 / X / 2 Back & Lay Buttons */}
                <div className="p-3 sm:p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] text-amber-200/90">
                      <span className="px-2 py-0.5 rounded bg-[#846f1e] font-extrabold text-[#ffd739] uppercase text-[10px]">
                        {match.sport}
                      </span>
                      <span className="truncate font-semibold">{match.competitionName}</span>
                      <span>·</span>
                      <span className="text-emerald-300 font-bold">
                        {match.startTimeLabel}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMatchId(isExpanded ? null : match.id)
                      }
                      className="text-left mt-1 group cursor-pointer"
                    >
                      <h4 className="font-extrabold text-sm sm:text-base text-white group-hover:text-[#ffd739] transition-colors">
                        {match.eventName}
                      </h4>
                      <p className="font-mono-tabular text-xs text-[#ffd739] mt-0.5">
                        {match.scoreSummary}
                      </p>
                    </button>
                  </div>

                  {/* Back (Blue `#72bbef`) & Lay (Pink `#faa9ba`) Odds Columns */}
                  {match.suspended ? (
                    <div className="px-6 py-2.5 rounded-xl bg-red-950/80 border border-red-400/50 text-red-200 font-black text-xs uppercase tracking-widest text-center">
                      SUSPENDED
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 shrink-0">
                      {/* Runner 1: Home */}
                      <div className="rounded-xl bg-[#241e06] p-1.5 border border-[#ffd739]/20">
                        <p className="text-[10px] font-bold text-amber-100 truncate mb-1 text-center">
                          1 · {match.runners.home.label}
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveSlip({
                                matchId: match.id,
                                eventName: match.eventName,
                                competitionName: match.competitionName,
                                marketName: 'Match Odds',
                                selection: match.runners.home.label,
                                betType: 'BACK',
                                odds: match.runners.home.back,
                              })
                            }
                            className="py-1.5 px-2 rounded-lg bg-[#72bbef] hover:brightness-105 text-slate-950 font-mono-tabular flex flex-col items-center justify-center cursor-pointer"
                          >
                            <span className="text-xs font-black leading-none">
                              {match.runners.home.back.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-bold opacity-80">
                              {match.runners.home.backSize}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveSlip({
                                matchId: match.id,
                                eventName: match.eventName,
                                competitionName: match.competitionName,
                                marketName: 'Match Odds',
                                selection: match.runners.home.label,
                                betType: 'LAY',
                                odds: match.runners.home.lay,
                              })
                            }
                            className="py-1.5 px-2 rounded-lg bg-[#faa9ba] hover:brightness-105 text-slate-950 font-mono-tabular flex flex-col items-center justify-center cursor-pointer"
                          >
                            <span className="text-xs font-black leading-none">
                              {match.runners.home.lay.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-bold opacity-80">
                              {match.runners.home.laySize}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Runner X: Draw (if applicable) */}
                      {match.runners.draw ? (
                        <div className="rounded-xl bg-[#241e06] p-1.5 border border-[#ffd739]/20">
                          <p className="text-[10px] font-bold text-amber-100 truncate mb-1 text-center">
                            X · Draw
                          </p>
                          <div className="grid grid-cols-2 gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveSlip({
                                  matchId: match.id,
                                  eventName: match.eventName,
                                  competitionName: match.competitionName,
                                  marketName: 'Match Odds',
                                  selection: 'The Draw',
                                  betType: 'BACK',
                                  odds: match.runners.draw!.back,
                                })
                              }
                              className="py-1.5 px-2 rounded-lg bg-[#72bbef] hover:brightness-105 text-slate-950 font-mono-tabular flex flex-col items-center justify-center cursor-pointer"
                            >
                              <span className="text-xs font-black leading-none">
                                {match.runners.draw.back.toFixed(2)}
                              </span>
                              <span className="text-[9px] font-bold opacity-80">
                                {match.runners.draw.backSize}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveSlip({
                                  matchId: match.id,
                                  eventName: match.eventName,
                                  competitionName: match.competitionName,
                                  marketName: 'Match Odds',
                                  selection: 'The Draw',
                                  betType: 'LAY',
                                  odds: match.runners.draw!.lay,
                                })
                              }
                              className="py-1.5 px-2 rounded-lg bg-[#faa9ba] hover:brightness-105 text-slate-950 font-mono-tabular flex flex-col items-center justify-center cursor-pointer"
                            >
                              <span className="text-xs font-black leading-none">
                                {match.runners.draw.lay.toFixed(2)}
                              </span>
                              <span className="text-[9px] font-bold opacity-80">
                                {match.runners.draw.laySize}
                              </span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="hidden sm:flex rounded-xl bg-[#241e06]/60 p-1.5 border border-[#ffd739]/15 items-center justify-center text-[10px] text-amber-200/60 font-mono-tabular">
                          2-Way Market
                        </div>
                      )}

                      {/* Runner 2: Away */}
                      <div className="rounded-xl bg-[#241e06] p-1.5 border border-[#ffd739]/20">
                        <p className="text-[10px] font-bold text-amber-100 truncate mb-1 text-center">
                          2 · {match.runners.away.label}
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveSlip({
                                matchId: match.id,
                                eventName: match.eventName,
                                competitionName: match.competitionName,
                                marketName: 'Match Odds',
                                selection: match.runners.away.label,
                                betType: 'BACK',
                                odds: match.runners.away.back,
                              })
                            }
                            className="py-1.5 px-2 rounded-lg bg-[#72bbef] hover:brightness-105 text-slate-950 font-mono-tabular flex flex-col items-center justify-center cursor-pointer"
                          >
                            <span className="text-xs font-black leading-none">
                              {match.runners.away.back.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-bold opacity-80">
                              {match.runners.away.backSize}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveSlip({
                                matchId: match.id,
                                eventName: match.eventName,
                                competitionName: match.competitionName,
                                marketName: 'Match Odds',
                                selection: match.runners.away.label,
                                betType: 'LAY',
                                odds: match.runners.away.lay,
                              })
                            }
                            className="py-1.5 px-2 rounded-lg bg-[#faa9ba] hover:brightness-105 text-slate-950 font-mono-tabular flex flex-col items-center justify-center cursor-pointer"
                          >
                            <span className="text-xs font-black leading-none">
                              {match.runners.away.lay.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-bold opacity-80">
                              {match.runners.away.laySize}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expandable Session / Fancy Markets (`NO` Pink / `YES` Blue) */}
                {isExpanded && match.fancyMarkets.length > 0 && (
                  <div className="bg-[#241e06] border-t border-[#ffd739]/25 px-3.5 py-2.5 space-y-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#ffd739]">
                      Session &amp; Fancy Markets (NO / YES)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {match.fancyMarkets.map((fancy) => (
                        <div
                          key={fancy.id}
                          className="rounded-xl bg-[#42370b] border border-[#ffd739]/25 p-2.5 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {fancy.title}
                            </p>
                            <p className="text-[10px] text-amber-200/80 font-mono-tabular">
                              Max ₹{fancy.maxStake.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveSlip({
                                  matchId: match.id,
                                  eventName: match.eventName,
                                  competitionName: match.competitionName,
                                  marketName: fancy.title,
                                  selection: `NO ${fancy.noRun}`,
                                  betType: 'NO',
                                  odds: 1.95,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-[#faa9ba] text-slate-950 font-mono-tabular text-center cursor-pointer"
                            >
                              <div className="text-xs font-black leading-none">
                                {fancy.noRun}
                              </div>
                              <div className="text-[9px] font-bold">NO ({fancy.noOdds})</div>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveSlip({
                                  matchId: match.id,
                                  eventName: match.eventName,
                                  competitionName: match.competitionName,
                                  marketName: fancy.title,
                                  selection: `YES ${fancy.yesRun}`,
                                  betType: 'YES',
                                  odds: 1.95,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-[#72bbef] text-slate-950 font-mono-tabular text-center cursor-pointer"
                            >
                              <div className="text-xs font-black leading-none">
                                {fancy.yesRun}
                              </div>
                              <div className="text-[9px] font-bold">YES ({fancy.yesOdds})</div>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* INLINE REAL-TIME EXCHANGE BET SLIP (OPENS WHEN ANY ODD IS CLICKED) */}
        {activeSlip && slipMath && (
          <div
            data-testid="exchange-live-bet-slip"
            className={`rounded-2xl p-4 border-2 shadow-2xl space-y-3 ${
              activeSlip.betType === 'LAY' || activeSlip.betType === 'NO'
                ? 'bg-[#3d1320] border-[#faa9ba]'
                : 'bg-[#102840] border-[#72bbef]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded font-black text-xs uppercase ${
                    activeSlip.betType === 'LAY' || activeSlip.betType === 'NO'
                      ? 'bg-[#faa9ba] text-black'
                      : 'bg-[#72bbef] text-black'
                  }`}
                >
                  {activeSlip.betType}
                </span>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {activeSlip.selection} · {activeSlip.eventName}
                  </h4>
                  <p className="text-[11px] text-slate-200">
                    Market: {activeSlip.marketName} · Live Odds:{' '}
                    <strong className="font-mono-tabular text-[#ffd739]">
                      {activeSlip.odds.toFixed(2)}
                    </strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSlip(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[100, 500, 1000, 2000, 5000, 10000].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSlipStake(chip)}
                  className={`px-3 py-1.5 rounded-xl font-mono-tabular font-extrabold text-xs cursor-pointer ${
                    slipStake === chip
                      ? 'bg-[#ffd739] text-black shadow'
                      : 'bg-black/40 text-white hover:bg-black/60 border border-white/15'
                  }`}
                >
                  +₹{chip.toLocaleString('en-IN')}
                </button>
              ))}
              <input
                type="number"
                min={10}
                value={slipStake}
                onChange={(e) => setSlipStake(Math.max(10, Number(e.target.value)))}
                className="w-32 px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 font-mono-tabular font-bold text-white text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/15">
              <div className="flex items-center gap-4 text-xs font-mono-tabular">
                <span className="text-slate-200">
                  Liability (Coins Deducted):{' '}
                  <strong className="text-rose-300">
                    ₹{slipMath.liability.toLocaleString('en-IN')}
                  </strong>
                </span>
                <span className="text-slate-200">
                  Potential Return:{' '}
                  <strong className="text-emerald-300">
                    ₹{slipMath.totalReturn.toLocaleString('en-IN')}
                  </strong>
                </span>
              </div>

              <button
                type="button"
                data-testid="confirm-place-sports-ticket-btn"
                disabled={placingBet}
                onClick={handlePlaceSportsBetTicket}
                className="px-5 py-2.5 rounded-xl bg-[#ffd739] hover:bg-yellow-300 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg cursor-pointer disabled:opacity-50"
              >
                {placingBet
                  ? 'Placing Real-Time Ticket...'
                  : `Place Real-Time Bet Ticket (₹${slipMath.liability.toLocaleString('en-IN')})`}
              </button>
            </div>
          </div>
        )}

        {/* MY REAL-TIME BET TICKETS & INSTANT CASHOUT PANEL */}
        {myTickets.length > 0 && (
          <div
            data-testid="my-realtime-bet-tickets-panel"
            className="rounded-2xl bg-[#42370b] border border-[#ffd739]/40 p-3.5 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#ffd739]" />
                <h4 className="font-shark italic font-black text-sm text-[#ffd739] uppercase">
                  My Real-Time Bet Tickets ({myTickets.length})
                </h4>
              </div>
              <span className="text-[11px] text-emerald-300 font-semibold">
                Synced with Wallet &amp; Coins
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {myTickets.slice(0, 15).map((tkt) => (
                <div
                  key={tkt.ticketId}
                  className="rounded-xl bg-[#241e06] border border-[#ffd739]/25 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular font-bold text-[#ffd739]">
                        {tkt.ticketId}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#42370b] text-[10px] font-bold text-white uppercase">
                        {tkt.betType}
                      </span>
                      <span className="font-bold text-white">{tkt.selection}</span>
                      <span className="font-mono-tabular text-sky-300">
                        @{tkt.odds.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-200/80">
                      {tkt.eventOrGameName} · {tkt.marketName} · Stake:{' '}
                      <strong className="font-mono-tabular text-white">
                        ₹{tkt.liability.toLocaleString('en-IN')}
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {tkt.status === 'OPEN' ? (
                      <>
                        <button
                          type="button"
                          disabled={settlingTicketId === tkt.ticketId}
                          onClick={() => handleInstantSettleOrCashout(tkt, 'CASHED_OUT')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] cursor-pointer"
                        >
                          Cashout ₹{Math.round(tkt.liability * 1.22).toLocaleString('en-IN')}
                        </button>
                        <button
                          type="button"
                          disabled={settlingTicketId === tkt.ticketId}
                          onClick={() => handleInstantSettleOrCashout(tkt, 'SETTLE_RESULT')}
                          className="px-2.5 py-1.5 rounded-lg bg-[#ffd739] hover:bg-yellow-300 text-black font-extrabold text-[11px] cursor-pointer"
                        >
                          Settle Now
                        </button>
                      </>
                    ) : (
                      <div className="text-right font-mono-tabular">
                        <span
                          className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                            tkt.status === 'WON' || tkt.status === 'CASHED_OUT'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : tkt.status === 'VOID'
                              ? 'bg-slate-500/20 text-slate-300'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {tkt.status}{' '}
                          {tkt.payoutAmount > 0
                            ? `+₹${tkt.payoutAmount.toLocaleString('en-IN')}`
                            : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================
       * 4. HOT GAMES ROW (Exact teaexch999.com/home `hot_games` section:
       *    Ravan Dahan, Aviator, Chicken Games, Color Prediction, Mines, Live Prediction, Rock Paper Scissors)
       * ======================================================================== */}
      <TeaExchHorizontalGameSection
        title="Hot Games"
        subtitle="Trending Crash & Instant Multiplier Originals"
        sectionTestId="teaexch-hot-games-row"
        games={hotGamesSection}
        onOpenGame={onOpenGame}
        onViewAllClick={() =>
          scrollToCatalogWithFilter({
            section: 'hot_games',
            category: 'ALL',
            provider: 'ALL',
            search: '',
          })
        }
      />

      {/* ========================================================================
       * 5. POPULAR NOW ROW (Exact teaexch999.com/home `new_launch` section:
       *    Trick or Treat, Drone Rush, Lagori, VR Lightning Roulette, Dragon Tower, Packs, Naughty Button, Race Track, Jhandi Munda, TwistX, etc.)
       * ======================================================================== */}
      <TeaExchHorizontalGameSection
        title="Popular Now"
        subtitle="16 Most Played Mac88 & Evolution Hits"
        sectionTestId="teaexch-popular-now-row"
        games={popularNowSection}
        onOpenGame={onOpenGame}
        onViewAllClick={() =>
          scrollToCatalogWithFilter({
            section: 'new_launch',
            category: 'ALL',
            provider: 'ALL',
            search: '',
          })
        }
      />

      {/* ========================================================================
       * 6. CATEGORY TILES (Exact teaexch999.com/home `category-tiles`:
       *    Primary 2-column Casino & Sportsbook + Secondary 7 tiles with real artwork)
       * ======================================================================== */}
      <section
        aria-label="Game Categories Artwork Grid"
        data-testid="teaexch-category-tiles-section"
        className="rounded-2xl bg-[#241e06] border border-[#ffd739]/35 p-3 sm:p-4 shadow-xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-[#ffd739]" />
            <h3 className="font-shark italic font-black text-sm sm:text-lg text-[#ffd739] uppercase tracking-wide">
              Featured Categories
            </h3>
          </div>
          <span className="text-[11px] text-amber-200/80 font-mono-tabular">
            Instant Launch
          </span>
        </div>

        {/* Primary 2-Column Row: Casino & Sportsbook */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
          {TEAEXCH_CATEGORY_TILES_PRIMARY.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => {
                if (tile.filterCategory === 'SPORTS') {
                  sportsSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                } else {
                  scrollToCatalogWithFilter({
                    section: 'ALL',
                    category: 'ALL',
                    provider: 'ALL',
                    search: '',
                  });
                }
              }}
              className="group relative rounded-xl overflow-hidden border border-[#ffd739]/40 hover:border-[#ffd739] transition-all cursor-pointer"
            >
              <picture>
                <source
                  media="(max-width: 640px)"
                  srcSet={formatTeaExchCdnImage(tile.mobileUrl, 360, 80)}
                />
                <img
                  src={formatTeaExchCdnImage(tile.desktopUrl, 680, 80)}
                  alt={tile.title}
                  loading="lazy"
                  className="w-full h-24 sm:h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </picture>
            </button>
          ))}
        </div>

        {/* Secondary Category Tiles Row: Horse Racing, Bingo, Teen Patti, Andar Bahar, Dragon Tiger, Crash Games, Roulette */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {TEAEXCH_CATEGORY_TILES_SECONDARY.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() =>
                scrollToCatalogWithFilter({
                  section: 'ALL',
                  category: 'ALL',
                  provider: 'ALL',
                  search: tile.searchKeyword,
                })
              }
              className="group relative rounded-xl overflow-hidden border border-[#ffd739]/30 hover:border-[#ffd739] transition-all cursor-pointer bg-[#42370b]"
            >
              <picture>
                <source
                  media="(max-width: 640px)"
                  srcSet={formatTeaExchCdnImage(tile.mobileUrl, 336, 80)}
                />
                <img
                  src={formatTeaExchCdnImage(tile.desktopUrl, 336, 80)}
                  alt={tile.title}
                  loading="lazy"
                  className="w-full h-20 sm:h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </picture>
            </button>
          ))}
        </div>
      </section>

      {/* ========================================================================
       * 7. MUST PLAY ROW (Exact teaexch999.com/home `recommended_games` section:
       *    20 Royal Gaming Fusion games: Dragon Tiger Fusion, Teen Patti Fusion, Andhar Bahar Fusion, etc.)
       * ======================================================================== */}
      <TeaExchHorizontalGameSection
        title="Must Play"
        subtitle="20 Royal Gaming Fusion & Indian Table Originals"
        sectionTestId="teaexch-must-play-row"
        games={mustPlaySection}
        onOpenGame={onOpenGame}
        onViewAllClick={() =>
          scrollToCatalogWithFilter({
            section: 'recommended_games',
            category: 'ALL',
            provider: 'ALL',
            search: '',
          })
        }
      />

      {/* ========================================================================
       * 8. LIVE CASINO ROW (Exact teaexch999.com/home `live_casino_games` section:
       *    13 Evolution Live Dealer Tables: Crazy Time, XXXTreme Lightning Roulette, Bac Bo, Speed Baccarat A, etc.)
       * ======================================================================== */}
      <TeaExchHorizontalGameSection
        title="Live Casino"
        subtitle="Evolution Live Dealer Tables & Game Shows"
        sectionTestId="teaexch-live-casino-row"
        games={liveCasinoSection}
        onOpenGame={onOpenGame}
        onViewAllClick={() =>
          scrollToCatalogWithFilter({
            section: 'live_casino_games',
            category: 'ALL',
            provider: 'ALL',
            search: '',
          })
        }
      />

      {/* ========================================================================
       * 9. SLOTS ROW (Exact teaexch999.com/home `slot` section:
       *    23 JiLi, Gamzix & Turbogames Slots: Fortune Gems 2 & 3, Crazy777, Money Coming, Boxing King, Ali Baba, etc.)
       * ======================================================================== */}
      <TeaExchHorizontalGameSection
        title="Slots"
        subtitle="23 High-Volatility JiLi, Gamzix & Turbo Jackpots"
        sectionTestId="teaexch-slots-row"
        games={slotsSection}
        onOpenGame={onOpenGame}
        onViewAllClick={() =>
          scrollToCatalogWithFilter({
            section: 'slot',
            category: 'ALL',
            provider: 'ALL',
            search: '',
          })
        }
      />

      {/* ========================================================================
       * 10. CASINO PROVIDERS SVG LOGO GRID (Exact teaexch999.com/home `casino-provider-tiles`:
       *     15 Official Providers with real SVG logos from `prod-cdn.king18.co`)
       * ======================================================================== */}
      <section
        aria-label="Official Casino Providers"
        data-testid="teaexch-casino-providers-grid"
        className="rounded-2xl bg-[#241e06] border border-[#ffd739]/35 p-3.5 sm:p-4 shadow-xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-[#ffd739]" />
            <h3 className="font-shark italic font-black text-sm sm:text-lg text-[#ffd739] uppercase tracking-wide">
              Casino Providers
            </h3>
          </div>
          <span className="text-[11px] text-amber-200/80 font-mono-tabular">
            15 Official Studios
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-2.5">
          {TEAEXCH_CASINO_PROVIDERS.map((prov) => (
            <button
              key={prov.id}
              type="button"
              onClick={() =>
                scrollToCatalogWithFilter({
                  section: 'ALL',
                  category: 'ALL',
                  provider: prov.filterProvider,
                  search: '',
                })
              }
              className="h-14 sm:h-16 rounded-xl bg-[#42370b] hover:bg-[#5a4a12] border border-[#ffd739]/30 hover:border-[#ffd739] p-2 flex items-center justify-center transition-all cursor-pointer group"
            >
              <img
                src={prov.logoUrl}
                alt={prov.providerName}
                loading="lazy"
                className="max-h-9 sm:max-h-10 max-w-full object-contain group-hover:scale-105 transition-transform"
              />
            </button>
          ))}
        </div>
      </section>

      {/* ========================================================================
       * 11. ALL 200 PLAYABLE CASINO, CRASH, SLOTS, TABLE & VIRTUAL GAMES CATALOG
       *     With Real CDN Thumbnails (`imgUrl`) & Real Game Names
       * ======================================================================== */}
      <section
        ref={catalogSectionRef}
        aria-label="All 200 Playable Casino and Exchange Games"
        data-testid="all-200-playable-games-section"
        className="rounded-2xl bg-[#241e06] border border-[#ffd739]/45 p-3.5 sm:p-5 space-y-4 shadow-xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ffd739]/20 pb-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#ffd739]" />
            <div>
              <h3 className="font-shark italic font-black text-base sm:text-xl text-[#ffd739] uppercase tracking-wide">
                All 200 Live Playable Games · Real-Time Wallet &amp; Coin Sync
              </h3>
              <p className="text-[11px] text-amber-200/80">
                Showing {displayedGames.length} of {filteredGames.length} playable games (Total 200 Real Games with Official Thumbnails)
              </p>
            </div>
          </div>

          {/* Search input across all 200 games */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-amber-200/70 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              data-testid="search-200-games-input"
              placeholder="Search any of 200 games (#1 - #200)..."
              value={gameSearchQuery}
              onChange={(e) => setGameSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#42370b] border border-[#ffd739]/35 text-xs text-white placeholder:text-amber-200/50 focus:outline-none focus:border-[#ffd739]"
            />
          </div>
        </div>

        {/* Home Section Filter Pills (`All 200`, `Hot Games`, `Popular Now`, `Must Play`, `Live Casino`, `Slots`) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              { code: 'ALL', label: 'All 200 Games (200)' },
              { code: 'hot_games', label: `Hot Games (${hotGamesSection.length})` },
              { code: 'new_launch', label: `Popular Now (${popularNowSection.length})` },
              { code: 'recommended_games', label: `Must Play (${mustPlaySection.length})` },
              { code: 'live_casino_games', label: `Live Casino (${liveCasinoSection.length})` },
              { code: 'slot', label: `Slots (${slotsSection.length})` },
            ] as const
          ).map((sec) => (
            <button
              key={sec.code}
              type="button"
              onClick={() => {
                setSelectedSectionFilter(sec.code);
                setSelectedGameCategory('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs whitespace-nowrap shrink-0 cursor-pointer ${
                selectedSectionFilter === sec.code && selectedGameCategory === 'ALL'
                  ? 'bg-[#ffd739] text-black shadow'
                  : 'bg-[#42370b] text-amber-100 hover:text-white border border-[#ffd739]/30'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              setSelectedGameCategory('ALL');
              setSelectedSectionFilter('ALL');
            }}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs whitespace-nowrap shrink-0 cursor-pointer ${
              selectedGameCategory === 'ALL' && selectedSectionFilter === 'ALL'
                ? 'bg-[#ffd739] text-black shadow'
                : 'bg-[#42370b] text-amber-100 hover:text-white border border-[#ffd739]/25'
            }`}
          >
            All Categories (200)
          </button>
          {EXCHANGE_GAME_CATEGORIES.map((cat) => {
            const count = ALL_200_EXCHANGE_GAMES.filter((g) => g.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedSectionFilter('ALL');
                  setSelectedGameCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedGameCategory === cat
                    ? 'bg-[#ffd739] text-black shadow'
                    : 'bg-[#42370b] text-amber-100 hover:text-white border border-[#ffd739]/25'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Casino Provider Filter Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-amber-200 flex items-center gap-1 pr-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#ffd739]" />
            Providers:
          </span>
          <button
            type="button"
            onClick={() => setSelectedProvider('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap shrink-0 cursor-pointer ${
              selectedProvider === 'ALL'
                ? 'bg-[#ffd739] text-black'
                : 'bg-[#42370b] text-amber-100 hover:bg-[#5a4a12]'
            }`}
          >
            All Providers
          </button>
          {CASINO_PROVIDERS_LIST.map((prov) => (
            <button
              key={prov}
              type="button"
              onClick={() => setSelectedProvider(prov)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap shrink-0 cursor-pointer ${
                selectedProvider === prov
                  ? 'bg-[#ffd739] text-black'
                  : 'bg-[#42370b] text-amber-100 hover:bg-[#5a4a12]'
              }`}
            >
              {prov}
            </button>
          ))}
        </div>

        {/* 200 Playable Games Grid with Real `imgUrl` Thumbnails (336/440 aspect ratio) */}
        <div
          data-testid="playable-200-games-grid"
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3"
        >
          {displayedGames.map((game) => (
            <button
              key={game.id}
              type="button"
              data-testid={`playable-game-card-${game.gameNumber}`}
              onClick={() => onOpenGame(game)}
              className="group relative rounded-xl overflow-hidden bg-[#42370b] border border-[#ffd739]/35 hover:border-[#ffd739] transition-all duration-200 hover:-translate-y-1 shadow-lg text-left cursor-pointer flex flex-col"
            >
              {/* Real CDN Thumbnail Image (`aspect-[336/440]`) */}
              <div className="relative w-full aspect-[336/440] bg-[#1a1504] overflow-hidden">
                <img
                  src={formatTeaExchCdnImage(game.imgUrl, 336, 80)}
                  alt={game.name}
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== game.imgUrl) {
                      target.src = game.imgUrl;
                    }
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Top Game Number & Hot/New Badge */}
                <div className="absolute inset-x-0 top-0 p-1.5 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/30 to-transparent">
                  <span className="px-1.5 py-0.5 rounded bg-black/80 border border-[#ffd739]/40 font-mono-tabular font-black text-[9px] text-[#ffd739]">
                    #{game.gameNumber}
                  </span>
                  {game.isHot ? (
                    <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[8px] uppercase">
                      HOT
                    </span>
                  ) : game.isNew ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-black font-black text-[8px] uppercase">
                      NEW
                    </span>
                  ) : null}
                </div>

                {/* Hover Play Now Overlay */}
                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#ffd739] text-black flex items-center justify-center shadow-lg mb-1">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-[#ffd739] tracking-wider">
                    Play Now
                  </span>
                </div>
              </div>

              {/* Card Footer with Exact Game Name, Provider & Max Multiplier */}
              <div className="p-2 bg-gradient-to-b from-[#42370b] to-[#241e06] flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-[11px] sm:text-xs text-white truncate leading-tight">
                    {game.name}
                  </h4>
                  <p className="text-[9px] text-amber-200/75 truncate mt-0.5">
                    {game.rawProvider || game.provider}
                  </p>
                </div>

                <div className="mt-1.5 pt-1 border-t border-[#ffd739]/15 flex items-center justify-between text-[9px] font-mono-tabular">
                  <span className="text-emerald-300 font-bold">RTP {game.rtp}</span>
                  <span className="text-[#ffd739] font-black">{game.maxMultiplier}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Toggle Full 200 View */}
        {filteredGames.length > 40 && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowAll200AtOnce((prev) => !prev)}
              className="px-5 py-2.5 rounded-xl bg-[#ffd739] hover:bg-yellow-300 text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-lg"
            >
              {showAll200AtOnce
                ? 'Compact View (Show Top 40)'
                : `Show All ${filteredGames.length} Playable Games`}
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================
       * 12. APP DOWNLOAD BANNER (Exact teaexch999.com/home `app-download-banner`:
       *     "Enhance Your Betting Journey — Download our App for the Ultimate Experience")
       * ======================================================================== */}
      <section
        aria-label="App Download Banner"
        data-testid="teaexch-app-download-banner"
        className="rounded-2xl bg-gradient-to-r from-[#241e06] via-[#42370b] to-[#846f1e] border-2 border-[#ffd739]/60 p-4 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffd739]/20 border border-[#ffd739]/40 text-[10px] font-black uppercase tracking-wider text-[#ffd739]">
            SHARK EXCH MOBILE APK
          </div>
          <h3 className="font-shark italic font-black text-lg sm:text-2xl text-white uppercase tracking-wide">
            Enhance Your Betting Journey
          </h3>
          <p className="text-xs sm:text-sm text-amber-100/90">
            Download our App for the Ultimate Experience · Instant 1-Click Login, Live Sports Odds &amp; All 200 Casino Games
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onNotify(
              'SHARK EXCH Official Android App (v4.8 APK) ready! Use Add to Home Screen or contact WhatsApp Support for direct APK link.'
            )
          }
          className="px-6 py-3 rounded-xl bg-[#ffd739] hover:bg-yellow-300 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl cursor-pointer shrink-0 flex items-center gap-2"
        >
          <span>📲 Download App</span>
        </button>
      </section>

      {/* ========================================================================
       * 13. OFFICIAL 4-COLUMN FOOTER (`FooterView-B22YVgsr.js`:
       *     `Explore`, `Support`, `About`, `Legal` + 18+ Responsible Gaming)
       * ======================================================================== */}
      <footer
        aria-label="Exchange Footer"
        data-testid="teaexch-home-footer"
        className="rounded-2xl bg-[#1a1504] border border-[#ffd739]/30 p-4 sm:p-6 space-y-5 text-xs text-amber-100/80"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <h4 className="font-black text-[#ffd739] uppercase tracking-wider text-xs">
              Explore
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSport('Cricket');
                    sportsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-[#ffd739] cursor-pointer"
                >
                  Cricket Exchange
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSport('Football');
                    sportsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-[#ffd739] cursor-pointer"
                >
                  Football &amp; Tennis In-Play
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    scrollToCatalogWithFilter({
                      section: 'live_casino_games',
                      category: 'ALL',
                      provider: 'ALL',
                      search: '',
                    })
                  }
                  className="hover:text-[#ffd739] cursor-pointer"
                >
                  Live Casino Studios
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    scrollToCatalogWithFilter({
                      section: 'hot_games',
                      category: 'ALL',
                      provider: 'ALL',
                      search: '',
                    })
                  }
                  className="hover:text-[#ffd739] cursor-pointer"
                >
                  Aviator &amp; Crash Originals
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-black text-[#ffd739] uppercase tracking-wider text-xs">
              Support
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>24/7 Live WhatsApp Support</li>
              <li>Instant Deposit &amp; UTR Verification</li>
              <li>Fast Bank &amp; UPI Withdrawals</li>
              <li>VIP Account Manager</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-black text-[#ffd739] uppercase tracking-wider text-xs">
              About
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>SHARK EXCH Official Platform</li>
              <li>15 Certified Casino Providers</li>
              <li>200 Real-Time Playable Games</li>
              <li>Real-Time Back &amp; Lay Match Odds</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-black text-[#ffd739] uppercase tracking-wider text-xs">
              Legal
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>Rules &amp; Regulations</li>
              <li>Responsible Gaming (18+ Only)</li>
              <li>Terms &amp; Conditions</li>
              <li>Privacy &amp; Fair Play Policy</li>
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-[#ffd739]/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-amber-200/70">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[10px]">
              18+
            </span>
            <span>
              Players must be 18 years or older. Play responsibly within your limits.
            </span>
          </div>
          <span className="font-mono-tabular text-[#ffd739]">
            © {new Date().getFullYear()} SHARK EXCH · Golden Sunbet Edition
          </span>
        </div>
      </footer>
    </div>
  );
};
