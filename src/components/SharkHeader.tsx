import React, { useState, useEffect } from 'react';
import { UserProfile } from '../utils/exchangeLogic';
import {
  LogOut,
  PlusCircle,
  Menu,
  X,
  Gift,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Flame,
  Trophy,
  Gamepad2,
  Coins,
  FileText,
  HelpCircle,
  Globe,
  Palette,
} from 'lucide-react';

export interface SharkHeaderProps {
  currentUser: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenProfile?: () => void;
  onLogout: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenCreateId?: () => void;
  onOpenSpinWheel?: () => void;
  onOpenLiveChat?: () => void;
  onOpenPromoAd?: () => void;
  onQuickNavigate?: (section: string) => void;
}

export const TEAEXCH_THEMES: {
  id: string;
  name: string;
  bg: string;
  card: string;
  accent: string;
}[] = [
  { id: 'golden-sunbet', name: 'Golden Sunbet', bg: '#241e06', card: '#42370b', accent: '#ffd739' },
  { id: 'gold-royale', name: 'Gold Royale', bg: '#100b02', card: '#34270b', accent: '#ffecc3' },
  { id: 'midnight-jackpot', name: 'Midnight Jackpot', bg: '#071123', card: '#102342', accent: '#08fafe' },
  { id: 'crimson-fortune', name: 'Crimson Fortune', bg: '#22060b', card: '#3f0d16', accent: '#ff4d6d' },
  { id: 'emerald-luck', name: 'Emerald Luck', bg: '#051f14', card: '#0b3b27', accent: '#10b981' },
  { id: 'royal-nebula', name: 'Royal Nebula', bg: '#00143c', card: '#0a2458', accent: '#ffa724' },
  { id: 'hot-red', name: 'Hot Red', bg: '#1a0505', card: '#34100b', accent: '#f80000' },
];

export const OFFICIAL_TEAEXCH_RULES: { category: string; rules: string[] }[] = [
  {
    category: 'Cricket Exchange & Fancy Rules',
    rules: [
      'Twenty20 / ODI / Limited Overs: All scheduled overs must be played for undecided markets to be settled unless the innings has reached its natural conclusion (80% or more of scheduled overs).',
      'In the case of weather-affected matches, the official competition Duckworth-Lewis result determines Match Odds settlement.',
      'Runs in 1st Over / Session Fancy: The specified over or session must be completed for bets to stand unless settlement has already been determined.',
      'Most Fours / Sixes: Only boundaries scored directly off the bat count toward the total boundary market. Super Over boundaries do not count.',
    ],
  },
  {
    category: 'Football & Tennis Exchange Rules',
    rules: [
      'Football: All markets are settled on the basis of 90 minutes regular time (including injury/stoppage time) unless explicitly stated otherwise.',
      'Tennis: One-set or match-winner markets settle immediately upon official completion of the match.',
      'If a match is postponed and not resumed within 48 hours of initial kick-off, undecided markets are voided and stakes refunded.',
    ],
  },
  {
    category: 'Live Casino, Aviator Crash & Indian Card Games',
    rules: [
      'Baccarat: Goal is to collect a point total as close as possible or equal to 9. Ace = 1, 2–9 = face value, 10/J/Q/K = 0.',
      'Dragon Tiger & Teen Patti: Single card (Dragon vs Tiger) or 3-card hand (Player A vs Player B) highest rank wins immediately at the end of the 15-second betting timer.',
      'Aviator / Crash Games: Cash out before the plane/object flies away. Winnings are Stake × Multiplier at the exact moment of cashout.',
      'Lucky 7 / 7 Up-Down: Cards A–6 win on 7 Down (2.00x), Card 7 wins on Lucky 7 (11.50x), and Cards 8–K win on 7 Up (2.00x).',
    ],
  },
];

/**
 * Exact replication of the "SHARK EXCH" Top Header Section + teaexch999.com `app-sub-header` & `side-header` Drawer:
 * - Top `app-sub-header` bar: Hamburger drawer icon (`#525048` / `#E2D8AF`), scrollable navigation tabs (`Exchange`, `Inplay`, `Multi Markets`, `Live Casino`, `Fantasy11 NEW`, `Sportsbook`, `OMNI NEW`, `Check Bonuses`), User Profile / Balance / Exposure pill, Theme & Language selector.
 * - Golden-Yellow (#facc15) Header Banner with 3 signature rounded Black (#090d16) cards:
 *   1. Left Vertical Black Card: "Deposit" + bold double upward white chevrons (⏫)
 *   2. Center Large Black Card: Bold italic "SHARK" (white) + "EXCH" (yellow), "WALLET BALANCE" + stacked coins + live balance
 *   3. Right Vertical Black Card: "Withdraw" + bold double downward white chevrons (⏬)
 */
export const SharkHeader: React.FC<SharkHeaderProps> = ({
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onLogout,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenCreateId,
  onOpenSpinWheel,
  onOpenLiveChat,
  onOpenPromoAd,
  onQuickNavigate,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inplayExpanded, setInplayExpanded] = useState(true);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('shark_selected_theme') || 'golden-sunbet';
    } catch {
      return 'golden-sunbet';
    }
  });
  const [selectedLang, setSelectedLang] = useState<string>('EN');
  const [activeNavTab, setActiveNavTab] = useState<string>('exchange');
  const [exposureModalOpen, setExposureModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  // Listen for Bottom Navigation `Menu` button click (`shark-open-side-drawer`)
  useEffect(() => {
    const handleOpenDrawerEvent = () => setDrawerOpen(true);
    window.addEventListener('shark-open-side-drawer', handleOpenDrawerEvent);
    return () => window.removeEventListener('shark-open-side-drawer', handleOpenDrawerEvent);
  }, []);

  useEffect(() => {
    const themeObj =
      TEAEXCH_THEMES.find((t) => t.id === selectedTheme) || TEAEXCH_THEMES[0];
    document.documentElement.style.setProperty('--ion-background-color', themeObj.bg);
    document.documentElement.style.setProperty('--table-bg', themeObj.card);
    document.documentElement.style.setProperty('--ion-color-primary', themeObj.accent);
    try {
      localStorage.setItem('shark_selected_theme', selectedTheme);
    } catch {
      // ignore
    }
  }, [selectedTheme]);

  const subHeaderTabs: {
    id: string;
    label: string;
    showNewTag?: boolean;
    isBonusBtn?: boolean;
  }[] = [
    { id: 'exchange', label: 'Exchange' },
    { id: 'inplay', label: 'Inplay' },
    { id: 'multimarkets', label: 'Multi Markets' },
    { id: 'casino', label: 'Live Casino' },
    { id: 'fantasy11', label: 'Fantasy11', showNewTag: true },
    { id: 'sportsbook', label: 'Sportsbook' },
    { id: 'omni', label: 'OMNI', showNewTag: true },
    { id: 'checkbonuses', label: 'Check Bonuses', isBonusBtn: true },
  ];

  const handleNavClick = (id: string) => {
    setActiveNavTab(id);
    if (id === 'checkbonuses' && onOpenSpinWheel) {
      onOpenSpinWheel();
      return;
    }
    if (onQuickNavigate) {
      onQuickNavigate(id);
    }
  };

  const userBonusAmount = currentUser ? currentUser.signupBonus ?? 500 : 0;

  return (
    <div className="w-full select-none">
      {/* 1. EXACT VIDEO SCREEN RECORDING TOP BAR (`#241e06` with Hamburger + SHARK EXCH Crown Logo + Login/Signup or Bal/Bonus/Exp) */}
      <header className="bg-[#241e06] border-b border-[#ffd739]/35 px-2.5 sm:px-5 py-2 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Hamburger Drawer Button (`#42370b` / `#ffd739`) + SHARK EXCH Crown Emblem Logo */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open Navigation Drawer"
              data-testid="teaexch-sidebar-drawer-btn"
              className="w-9 h-9 rounded-lg bg-[#42370b] hover:bg-[#5a4a12] border border-[#ffd739]/45 flex items-center justify-center cursor-pointer shrink-0 shadow"
            >
              <Menu className="w-5 h-5 text-[#ffd739]" />
            </button>

            <a
              href="#top"
              className="flex items-center gap-1.5 whitespace-nowrap shrink-0 group"
            >
              <span className="font-shark italic font-black text-lg sm:text-2xl tracking-wider flex items-center">
                <span className="text-[#ffd739] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  SH
                </span>
                <span className="inline-flex flex-col items-center mx-0.5 -mt-1">
                  <span className="text-[10px] leading-none text-[#ffd739]">👑</span>
                  <span className="text-white text-base sm:text-xl leading-none">A</span>
                </span>
                <span className="text-[#ffd739] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  RK
                </span>
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-shark font-black text-[10px] sm:text-xs text-white tracking-widest uppercase">
                  EXCH
                </span>
                <span className="font-shark font-black text-[11px] sm:text-sm text-[#ffd739] tracking-wider">
                  999
                </span>
              </span>
            </a>
          </div>

          {/* Right: Exact Video `Login` | `Signup` Buttons (When Logged Out) OR `Username | Bal / Bonus | Exp` (When Logged In) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Exact 2-Line `Demo User | Bal: 500.00 / Bonus: 500.00 | Exp: 0.00` Status Block from Video 00:18 */}
                <button
                  type="button"
                  onClick={() => setExposureModalOpen(true)}
                  data-testid="header-bal-bonus-exp-pill"
                  className="flex flex-col items-end px-2.5 py-1 rounded-xl bg-[#332b09] border border-[#ffd739]/40 text-[10px] sm:text-xs leading-tight cursor-pointer hover:border-[#ffd739]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#f3bd42] truncate max-w-[95px] sm:max-w-[140px]">
                      {currentUser.name}
                    </span>
                    <span className="font-mono-tabular font-black text-white">
                      Bal:{currentUser.walletBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono-tabular font-bold text-amber-200">
                      Bonus:{userBonusAmount.toFixed(2)}
                    </span>
                    <span className="font-mono-tabular font-black text-white underline">
                      Exp:0.00
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  data-testid="header-user-profile-btn"
                  onClick={onOpenProfile}
                  className="hidden sm:flex items-center gap-2 bg-[#42370b] hover:bg-[#5a4a12] border border-[#ffd739]/60 rounded-xl px-2.5 py-1.5 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#ffd739] text-black font-black text-xs flex items-center justify-center shrink-0">
                    {(currentUser.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left max-w-[130px]">
                    <p className="text-xs font-extrabold text-white truncate leading-tight">
                      My Profile
                    </p>
                    <p className="text-[10px] text-[#ffd739] font-bold truncate leading-tight">
                      ₹{currentUser.walletBalance.toLocaleString('en-IN')}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  title="Log Out"
                  aria-label="Log Out"
                  className="p-2 rounded-xl bg-[#42370b] hover:bg-red-500/25 border border-[#ffd739]/30 text-amber-200 hover:text-red-300 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Exact Video `00:00 - 00:07`: Yellow `Login` Button on Left, Dark Olive `Signup` Button on Right */
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-4 sm:px-5 py-1.5 rounded-lg bg-[#ffd739] hover:bg-[#eab308] text-black font-extrabold text-xs sm:text-sm tracking-wide transition-transform active:scale-95 cursor-pointer whitespace-nowrap shadow"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="px-4 sm:px-5 py-1.5 rounded-lg bg-[#42370b] hover:bg-[#5a4a12] border border-[#ffd739] text-white font-extrabold text-xs sm:text-sm tracking-wide transition-transform active:scale-95 cursor-pointer whitespace-nowrap shadow"
                >
                  Signup
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Exact Video `00:18`, `00:20`, `00:24`: Green `[ 💵 DEPOSIT ]` and Red `[ 🏧 WITHDRAW ]` 50/50 Action Bar */}
        {currentUser && (
          <div className="grid grid-cols-2 gap-2.5 pt-0.5">
            <button
              type="button"
              onClick={onOpenDeposit}
              data-testid="video-style-deposit-btn"
              className="py-2 px-3 rounded-lg bg-gradient-to-r from-[#0e6b29] via-[#15803d] to-[#0e6b29] hover:brightness-110 border border-emerald-400/70 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span className="px-1.5 py-0.5 rounded bg-emerald-300 text-black font-black text-[10px]">
                ₹
              </span>
              <span>DEPOSIT</span>
            </button>

            <button
              type="button"
              onClick={onOpenWithdraw}
              data-testid="video-style-withdraw-btn"
              className="py-2 px-3 rounded-lg bg-gradient-to-r from-[#991b1b] via-[#b91c1c] to-[#991b1b] hover:brightness-110 border border-red-400/70 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span className="px-1.5 py-0.5 rounded bg-amber-300 text-black font-black text-[10px]">
                🏧
              </span>
              <span>WITHDRAW</span>
            </button>
          </div>
        )}

        {/* Exact teaexch999.com `actions-list` Scrollable Top SubHeader Navigation */}
        <nav
          aria-label="Exchange Primary Navigation"
          data-testid="teaexch-subheader-nav"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-0.5 border-t border-[#ffd739]/15"
        >
          {subHeaderTabs.map((tab) => {
            const isActive = activeNavTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleNavClick(tab.id)}
                className={`relative px-3 py-1.5 rounded-lg font-extrabold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  tab.isBonusBtn
                    ? 'bg-white text-black hover:bg-[#ffd739] shadow'
                    : tab.showNewTag && !isActive
                    ? 'bg-gradient-to-r from-[#f3bd42] to-[#e53935] text-white shadow'
                    : isActive
                    ? 'bg-[#ffd739] text-[#1a1a1a] shadow'
                    : 'bg-[#332b09] hover:bg-[#42370b] text-amber-100 border border-[#ffd739]/25'
                }`}
              >
                {tab.isBonusBtn && <Gift className="w-3.5 h-3.5 text-red-600" />}
                <span>{tab.label}</span>
                {tab.showNewTag && (
                  <span className="px-1 py-0.2 rounded bg-[#e53935] text-white font-black text-[8px] uppercase tracking-wider border border-white/40">
                    NEW
                  </span>
                )}
              </button>
            );
          })}

          {onOpenPromoAd && (
            <button
              type="button"
              onClick={onOpenPromoAd}
              data-testid="open-promo-ad-poster-btn"
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#ffd739] to-amber-400 text-black font-black text-xs whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1 shadow"
            >
              <span>🎁 ₹500 बोनस पोस्टर</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setRulesModalOpen(true)}
            className="ml-auto px-2.5 py-1 rounded-lg bg-[#332b09] hover:bg-[#42370b] border border-[#ffd739]/30 text-[11px] font-bold text-amber-200 whitespace-nowrap cursor-pointer shrink-0"
          >
            Rules &amp; Regulations
          </button>
        </nav>
      </header>

      {/* 2. VIBRANT GOLDEN-YELLOW (#facc15) HERO WALLET SECTION (PRESERVED INTACT) */}
      <section
        aria-label="Shark Exch Wallet and Quick Actions"
        className="shark-gold-header relative px-3 sm:px-6 py-4 sm:py-6 border-b-4 border-[#090d16] shadow-lg"
      >
        <div className="max-w-4xl mx-auto grid grid-cols-[96px_1fr_96px] sm:grid-cols-[148px_1fr_148px] gap-2.5 sm:gap-5 items-center">
          {/* LEFT VERTICAL BLACK CARD BUTTON: Deposit ⏫ */}
          <button
            type="button"
            onClick={onOpenDeposit}
            aria-label="Deposit Funds"
            className="group bg-[#090d16] hover:bg-[#111726] text-white rounded-[22px] sm:rounded-[28px] py-3.5 sm:py-4 px-2 flex flex-col items-center justify-between shadow-[0_10px_25px_rgba(0,0,0,0.45)] border border-white/10 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <span className="text-sm sm:text-xl font-semibold tracking-wide text-white group-hover:text-[#facc15] transition-colors">
              Deposit
            </span>

            {/* Bold Double Upward White Chevrons (⏫) */}
            <div className="my-2 sm:my-3 transform group-hover:-translate-y-1 transition-transform duration-150">
              <svg
                viewBox="0 0 64 64"
                className="w-11 h-11 sm:w-16 sm:h-16 text-white"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M32 8L8 26v13l24-18 24 18V26L32 8z" />
                <path d="M32 31L8 49v13l24-18 24 18V49L32 31z" />
              </svg>
            </div>

            <span className="text-[10px] sm:text-xs font-medium text-emerald-400 tracking-wide">
              Instant UPI
            </span>
          </button>

          {/* CENTER LARGE BLACK CARD: SHARK EXCH + WALLET BALANCE */}
          <div className="bg-[#090d16] text-white rounded-[26px] sm:rounded-[34px] py-4 sm:py-6 px-3 sm:px-8 flex flex-col items-center justify-center shadow-[0_14px_32px_rgba(0,0,0,0.55)] border border-white/10 relative overflow-hidden">
            {/* Subtle top gloss */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            {/* Bold Italic SHARK EXCH Wordmark */}
            <div className="flex flex-col items-center leading-[0.88] tracking-wide">
              <span className="font-shark italic font-black text-3xl sm:text-5xl md:text-6xl text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.12)]">
                SHARK
              </span>
              <span className="font-shark italic font-black text-3xl sm:text-5xl md:text-6xl text-[#facc15] mt-0.5 drop-shadow-[0_2px_10px_rgba(250,204,21,0.25)]">
                EXCH
              </span>
            </div>

            {/* Subtitle: WALLET BALANCE */}
            <p className="mt-3 sm:mt-4 text-[11px] sm:text-sm md:text-base font-medium tracking-[0.14em] text-white/90 uppercase">
              WALLET BALANCE
            </p>

            {/* Stacked Coin Icon + Live Firebase Balance Counter */}
            <div className="mt-1.5 sm:mt-2 flex items-center justify-center gap-2 sm:gap-3">
              {/* Custom Crisp Stacked White Coins SVG matching Reference */}
              <svg
                viewBox="0 0 44 40"
                className="w-7 h-7 sm:w-9 sm:h-9 text-white shrink-0"
                fill="currentColor"
                aria-hidden="true"
              >
                <ellipse cx="26" cy="9" rx="12" ry="4.2" />
                <path d="M14 12.5c0 2.3 5.4 4.2 12 4.2s12-1.9 12-4.2v3.5c0 2.3-5.4 4.2-12 4.2s-12-1.9-12-4.2v-3.5z" />
                <path d="M14 19c0 2.3 5.4 4.2 12 4.2s12-1.9 12-4.2v3.5c0 2.3-5.4 4.2-12 4.2s-12-1.9-12-4.2V19z" />
                <path d="M14 25.5c0 2.3 5.4 4.2 12 4.2s12-1.9 12-4.2V29c0 2.3-5.4 4.2-12 4.2s-12-1.9-12-4.2v-3.5z" />
                <ellipse cx="14" cy="19" rx="9.5" ry="3.5" stroke="#090d16" strokeWidth="1.5" />
                <path
                  d="M4.5 22c0 1.9 4.3 3.5 9.5 3.5s9.5-1.6 9.5-3.5v3c0 1.9-4.3 3.5-9.5 3.5s-9.5-1.6-9.5-3.5v-3z"
                  stroke="#090d16"
                  strokeWidth="1"
                />
                <path
                  d="M4.5 27.5c0 1.9 4.3 3.5 9.5 3.5s9.5-1.6 9.5-3.5v3c0 1.9-4.3 3.5-9.5 3.5s-9.5-1.6-9.5-3.5v-3z"
                  stroke="#090d16"
                  strokeWidth="1"
                />
              </svg>

              <span
                data-testid="wallet-balance-value"
                className="font-mono-tabular font-bold text-2xl sm:text-4xl text-white tracking-tight"
              >
                {currentUser
                  ? currentUser.walletBalance.toLocaleString('en-IN')
                  : '0'}
              </span>

              <button
                type="button"
                onClick={onOpenDeposit}
                title="Add Funds to Wallet"
                aria-label="Quick Add Funds"
                className="ml-0.5 text-[#facc15] hover:text-yellow-300 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* RIGHT VERTICAL BLACK CARD BUTTON: Withdraw ⏬ */}
          <button
            type="button"
            onClick={onOpenWithdraw}
            aria-label="Withdraw Funds"
            className="group bg-[#090d16] hover:bg-[#111726] text-white rounded-[22px] sm:rounded-[28px] py-3.5 sm:py-5 px-2 flex flex-col items-center justify-between shadow-[0_10px_25px_rgba(0,0,0,0.45)] border border-white/10 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <span className="text-sm sm:text-xl font-semibold tracking-wide text-white group-hover:text-[#facc15] transition-colors">
              Withdraw
            </span>

            {/* Bold Double Downward White Chevrons (⏬) */}
            <div className="my-2 sm:my-3 transform group-hover:translate-y-1 transition-transform duration-150">
              <svg
                viewBox="0 0 64 64"
                className="w-11 h-11 sm:w-16 sm:h-16 text-white"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 10v13l24 18 24-18V10L32 28 8 10z" />
                <path d="M8 33v13l24 18 24-18V33L32 51 8 33z" />
              </svg>
            </div>

            <span className="text-[10px] sm:text-xs font-medium text-amber-400 tracking-wide">
              24/7 Payout
            </span>
          </button>
        </div>
      </section>

      {/* ====================================================================
       * 3. EXACT TEAEXCH999.COM `side-header` LEFT NAVIGATION DRAWER
       * ==================================================================== */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="SHARK EXCH Side Menu"
          className="fixed inset-0 z-50 flex bg-black/75 backdrop-blur-sm"
        >
          <div className="w-80 max-w-[86vw] bg-gradient-to-b from-[#241e06] via-[#1a1504] to-[#120e02] border-r-2 border-[#ffd739]/50 h-full overflow-y-auto p-4 flex flex-col justify-between space-y-4 shadow-2xl">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#ffd739]/25 pb-3">
                <span className="font-shark italic font-black text-xl tracking-wider">
                  <span className="text-white">SHARK</span>{' '}
                  <span className="text-[#ffd739]">EXCH</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-[#42370b] text-[#ffd739] hover:bg-[#5a4a12] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Profile Card (`sh-user-profile`) */}
              {currentUser && (
                <div className="rounded-xl bg-[#42370b] border border-[#ffd739]/40 p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#ffd739] text-black font-black text-base flex items-center justify-center shrink-0">
                    {(currentUser.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-white truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] font-mono-tabular text-[#ffd739] font-bold">
                      Coins: ₹{currentUser.walletBalance.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              )}

              {/* Check Bonus Tab (`check-bonus-tab`) */}
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  if (onOpenSpinWheel) onOpenSpinWheel();
                }}
                className="w-full rounded-xl bg-gradient-to-r from-[#ffd739] via-amber-300 to-[#f59e0b] text-black font-black text-xs p-3 flex items-center justify-between shadow-lg cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-red-700" />
                  <span>Check Bonus &amp; Spin Wheel (1/Day)</span>
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Settings Section: Languages & 11 TeaExch Themes */}
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-200/70 px-1">
                  Settings &amp; Personalization
                </p>

                {/* Theme Switcher (`id: 270`) */}
                <button
                  type="button"
                  onClick={() => setThemeMenuOpen((p) => !p)}
                  className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2.5 flex items-center justify-between text-xs font-bold text-white cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#ffd739]" />
                    <span>
                      Theme :{' '}
                      {TEAEXCH_THEMES.find((t) => t.id === selectedTheme)?.name ||
                        'Golden Sunbet'}
                    </span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#ffd739]" />
                </button>

                {themeMenuOpen && (
                  <div className="rounded-xl bg-black/50 border border-[#ffd739]/30 p-2 space-y-1">
                    {TEAEXCH_THEMES.map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => {
                          setSelectedTheme(th.id);
                          setThemeMenuOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2.5 text-xs font-bold cursor-pointer ${
                          selectedTheme === th.id
                            ? 'bg-[#ffd739] text-black'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${th.bg} 50%, ${th.accent} 50%)`,
                          }}
                        />
                        <span>{th.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Language Selector (`id: 260`) */}
                <button
                  type="button"
                  onClick={() => setLangMenuOpen((p) => !p)}
                  className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2.5 flex items-center justify-between text-xs font-bold text-white cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#ffd739]" />
                    <span>Languages : {selectedLang}</span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#ffd739]" />
                </button>

                {langMenuOpen && (
                  <div className="rounded-xl bg-black/50 border border-[#ffd739]/30 p-2 grid grid-cols-2 gap-1.5">
                    {[
                      { code: 'EN', label: 'English (EN)' },
                      { code: 'HI', label: 'हिंदी (Hindi)' },
                      { code: 'TE', label: 'తెలుగు (Telugu)' },
                      { code: 'MR', label: 'मराठी (Marathi)' },
                    ].map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setSelectedLang(l.code);
                          setLangMenuOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          selectedLang === l.code
                            ? 'bg-[#ffd739] text-black'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Main Nav Section (`sh-main-nav`) */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-200/70 px-1">
                  Exchange &amp; Gaming
                </p>

                <button
                  type="button"
                  onClick={() => setInplayExpanded((p) => !p)}
                  className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2.5 flex items-center justify-between text-xs font-bold text-white cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#ffd739]" />
                    <span>In-Play Sports Exchange</span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#ffd739]" />
                </button>

                {inplayExpanded && (
                  <div className="rounded-xl bg-white/5 border border-white/10 p-2 space-y-1 pl-4">
                    {[
                      '🏏 Cricket In-Play',
                      '⚽ Football In-Play',
                      '🎾 Tennis In-Play',
                      '🐎 Horse Racing',
                      '🐕 Greyhound Racing',
                      '🤼 Kabaddi Live',
                    ].map((sp) => (
                      <button
                        key={sp}
                        type="button"
                        onClick={() => {
                          setDrawerOpen(false);
                          if (onQuickNavigate) onQuickNavigate('inplay');
                        }}
                        className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-white/10 text-xs font-bold text-amber-100 cursor-pointer"
                      >
                        {sp}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    if (onQuickNavigate) onQuickNavigate('casino');
                  }}
                  className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2.5 flex items-center justify-between text-xs font-bold text-white cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-[#ffd739]" />
                    <span>All 200 Live Casino &amp; Crash Games</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#e53935] text-white font-black text-[9px]">
                    200
                  </span>
                </button>
              </div>

              {/* Account Section (`sh-account-section`) */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-200/70 px-1">
                  My Wallet &amp; Account
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenDeposit();
                  }}
                  className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2 text-left text-xs font-bold text-emerald-300 flex items-center gap-2 cursor-pointer"
                >
                  <Coins className="w-4 h-4" />
                  <span>Deposit Funds (Instant UPI)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenWithdraw();
                  }}
                  className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2 text-left text-xs font-bold text-amber-300 flex items-center gap-2 cursor-pointer"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Withdraw Winnings (24/7)</span>
                </button>

                {onOpenCreateId && (
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      onOpenCreateId();
                    }}
                    className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2 text-left text-xs font-bold text-[#ffd739] flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Create Official Exchange ID</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setRulesModalOpen(true);
                  }}
                  className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2 text-left text-xs font-bold text-white flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#ffd739]" />
                  <span>Rules &amp; Regulations</span>
                </button>

                {onOpenLiveChat && (
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      onOpenLiveChat();
                    }}
                    className="w-full rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/50 px-3 py-2 text-left text-xs font-bold text-[#25D366] flex items-center gap-2 cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>24/7 Customer Support (Live Chat)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Logout Button (`sh-logout-section`) */}
            {currentUser && (
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onLogout();
                }}
                className="w-full rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-3 py-2.5 text-xs font-extrabold text-red-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            )}
          </div>

          <div className="flex-1" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      {/* ====================================================================
       * 4. EXPOSURE DETAIL DIALOG (`exposure-table` from SubHeader-upXyUHXR.js)
       * ==================================================================== */}
      {exposureModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Exposure Details"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#241e06] border-2 border-[#ffd739] overflow-hidden shadow-2xl">
            <div className="bg-[#42370b] px-4 py-3 flex items-center justify-between border-b border-[#ffd739]/30">
              <h3 className="font-shark italic font-black text-base text-[#ffd739] uppercase">
                Market Exposure &amp; Wallet Summary
              </h3>
              <button
                type="button"
                onClick={() => setExposureModalOpen(false)}
                className="p-1 rounded-lg bg-black/40 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 font-bold text-[#ffd739] border-b border-[#ffd739]/25 pb-2">
                <span>Event Type</span>
                <span>Event / Market Name</span>
                <span className="text-right">Exposure (₹)</span>
              </div>
              <div className="py-4 text-center text-amber-100/80">
                All settled bets are immediately credited to your SHARK EXCH Wallet Balance (₹
                {currentUser?.walletBalance.toLocaleString('en-IN') ?? 0}).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
       * 5. OFFICIAL TEAEXCH999.COM RULES & REGULATIONS MODAL (`rules-dialog`)
       * ==================================================================== */}
      {rulesModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Rules and Regulations"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-[#241e06] border-2 border-[#ffd739] overflow-hidden shadow-2xl max-h-[88vh] flex flex-col">
            <div className="bg-[#42370b] px-5 py-3.5 flex items-center justify-between border-b border-[#ffd739]/40">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#ffd739]" />
                <h3 className="font-shark italic font-black text-base sm:text-lg text-[#ffd739] uppercase">
                  SHARK EXCH — Official Rules &amp; Regulations
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRulesModalOpen(false)}
                className="p-1.5 rounded-lg bg-black/40 text-white hover:text-[#ffd739] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-amber-100">
              {OFFICIAL_TEAEXCH_RULES.map((sec) => (
                <div
                  key={sec.category}
                  className="rounded-xl bg-[#42370b]/70 border border-[#ffd739]/30 p-3.5 space-y-2"
                >
                  <h4 className="font-extrabold text-sm text-[#ffd739] uppercase">
                    {sec.category}
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-white/90 leading-relaxed">
                    {sec.rules.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="rounded-xl bg-black/40 border border-[#ffd739]/30 p-3 text-center text-[11px] text-amber-200">
                <strong>18+ Responsible Gaming Disclaimer:</strong> You must be over 18 years old to
                participate in online sports exchange and casino gaming on SHARK EXCH.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
