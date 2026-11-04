import React, { useState, useEffect } from 'react';
import {
  BannerSlide,
  UserProfile,
  CELEBRITY_BANNER_ASSETS,
} from '../utils/exchangeLogic';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  Zap,
  Play,
  KeyRound,
  UserPlus,
  LogIn,
  User as UserIcon,
  Crown,
  Sparkles,
  ArrowUpCircle,
  ShieldCheck,
} from 'lucide-react';

export type GameCategoryType =
  | 'aviatrix'
  | 'mines'
  | 'cricket'
  | 'color'
  | 'casino';

interface BannerAndGamesProps {
  banners: BannerSlide[];
  currentUser?: UserProfile | null;
  activeIdCount?: number;
  onOpenCreateId: () => void;
  onOpenSignUp?: () => void;
  onOpenLogin?: () => void;
  onOpenProfile?: () => void;
  onOpenDeposit?: () => void;
  onSelectGame?: (game: GameCategoryType) => void;
}

/**
 * Ultra-Premium Mobile-First Front Page Promotional Hero Banner & Game Category Section:
 * 1. Displays glamorous VIP Hostess & Celebrity Model portraits prominently under the "SHARK EXCH" brand
 *    with 100% mobile-optimized uncropped portrait framing (`object-top`), glowing gold & neon Mega Offer text:
 *    - Main Headline: "🔥 SHARK EXCH MEGA OFFER: ₹500 की ID पर ₹500 FREE! 🔥"
 *    - Sub-headline: "Deposit ₹500 & Get ₹500 Instant Welcome Bonus Free | 24/7 Instant Refill & Withdrawal"
 * 2. Directly below the hero banner:
 *    - If Guest (`!currentUser`): shows "Create ID", "Sign Up", and "Login" buttons.
 *    - If Logged In (`currentUser`): hides "Sign Up" & "Login" and shows the VIP Member Profile Card + "Create ID", "My Profile", and "Deposit" buttons.
 * 3. Game cards (`Aviatrix`, `MINES`, `Cricket Live`, `Color Prediction`, `Live Casino`, and `SHARKVIP`)
 *    are strictly non-clickable visual dummy cards. ONLY "Create IDs" is clickable and active.
 */
export const BannerAndGames: React.FC<BannerAndGamesProps> = ({
  banners,
  currentUser,
  activeIdCount = 0,
  onOpenCreateId,
  onOpenSignUp,
  onOpenLogin,
  onOpenProfile,
  onOpenDeposit,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [showcaseTheme, setShowcaseTheme] = useState<'glamour' | 'stars'>('glamour');

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % banners.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const currentBanner = banners[activeSlide] || banners[0];
  const customAdminHero =
    currentBanner?.imageUrl &&
    currentBanner.imageUrl !== CELEBRITY_BANNER_ASSETS.heroSalman
      ? currentBanner.imageUrl
      : null;

  const glamourModels = [
    {
      src: customAdminHero || CELEBRITY_BANNER_ASSETS.heroinePriyanka,
      title: 'Royal Glamour Queen',
      tag: 'VIP Hostess',
      borderClass: 'border-[#facc15]/80 shadow-[0_0_20px_rgba(250,204,21,0.3)]',
      badgeClass: 'text-[#facc15] border-[#facc15]/50',
    },
    {
      src: CELEBRITY_BANNER_ASSETS.glamourModel2,
      title: 'Monte Carlo VIP',
      tag: '100% Bonus',
      borderClass: 'border-pink-500/80 shadow-[0_0_20px_rgba(236,72,153,0.3)]',
      badgeClass: 'text-pink-300 border-pink-400/50',
    },
    {
      src: CELEBRITY_BANNER_ASSETS.glamourModel3,
      title: 'Golden Casino Diva',
      tag: 'Instant ID',
      borderClass: 'border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.3)]',
      badgeClass: 'text-amber-300 border-amber-400/50',
    },
    {
      src: CELEBRITY_BANNER_ASSETS.heroineSonam,
      title: 'Empress Club',
      tag: '24/7 Payout',
      borderClass: 'border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.3)]',
      badgeClass: 'text-rose-300 border-rose-400/50',
    },
  ];

  const starModels = [
    {
      src: currentBanner?.imageUrl || CELEBRITY_BANNER_ASSETS.heroSalman,
      title: 'Mega Star Club',
      tag: 'VIP Club',
      borderClass: 'border-[#facc15]/80 shadow-[0_0_20px_rgba(250,204,21,0.3)]',
      badgeClass: 'text-[#facc15] border-[#facc15]/50',
    },
    {
      src: currentBanner?.secondaryImageUrl || CELEBRITY_BANNER_ASSETS.heroinePriyanka,
      title: 'Diva Lounge',
      tag: '100% Bonus',
      borderClass: 'border-pink-500/80 shadow-[0_0_20px_rgba(236,72,153,0.3)]',
      badgeClass: 'text-pink-300 border-pink-400/50',
    },
    {
      src: CELEBRITY_BANNER_ASSETS.heroSrk,
      title: 'King Exchange',
      tag: 'Instant ID',
      borderClass: 'border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.3)]',
      badgeClass: 'text-sky-300 border-sky-400/50',
    },
    {
      src: CELEBRITY_BANNER_ASSETS.glamourModel1,
      title: 'Gold Jackpot',
      tag: '24/7 Payout',
      borderClass: 'border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.3)]',
      badgeClass: 'text-amber-300 border-amber-400/50',
    },
  ];

  const activePortraitCards = showcaseTheme === 'glamour' ? glamourModels : starModels;

  const mainOfferHeadline =
    currentBanner?.title ||
    '🔥 SHARK EXCH MEGA OFFER: ₹500 की ID पर ₹500 FREE! 🔥';
  const subOfferHeadline =
    currentBanner?.subtitle ||
    'Deposit ₹500 & Get ₹500 Instant Welcome Bonus Free | 24/7 Instant Refill & Withdrawal';

  return (
    <div className="space-y-3.5">
      {/* 1. ULTRA-PREMIUM FRONT PAGE HERO PROMOTIONAL BANNER WITH GLAMOROUS GIRLS & CELEBRITY SHOWCASE */}
      <section
        aria-label="Promotional Offers"
        data-testid="front-hero-promo-banner"
        className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1d051a] via-[#0b0f1e] to-[#260616] border-2 border-[#facc15]/75 shadow-[0_0_38px_rgba(250,204,21,0.28)]"
      >
        {/* Ambient Luxury Gold & Rose-Magenta Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(236,72,153,0.28),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(250,204,21,0.26),transparent_60%)] pointer-events-none" />

        <div className="relative p-3 sm:p-5 flex flex-col gap-3.5">
          {/* Top Luxury Strip: Brand Tag + Glamorous Girls / Stars Switcher + Static SHARKVIP Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 border border-[#facc15]/60 shadow">
              <Crown className="w-3.5 h-3.5 text-[#facc15]" />
              <span className="font-shark italic font-black text-xs sm:text-sm text-white tracking-wider">
                SHARK <span className="text-[#facc15]">EXCH</span>
              </span>
              <span className="text-[10px] sm:text-xs font-extrabold text-pink-300 uppercase tracking-widest">
                · {currentBanner?.tag || 'LUXURY VIP CLUB'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Interactive Showcase Style Toggle: Glamorous VIP Girls vs Royal Stars */}
              <div className="inline-flex items-center p-0.5 rounded-full bg-black/70 border border-white/15">
                <button
                  type="button"
                  onClick={() => setShowcaseTheme('glamour')}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                    showcaseTheme === 'glamour'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  🔥 VIP Girls
                </button>
                <button
                  type="button"
                  onClick={() => setShowcaseTheme('stars')}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                    showcaseTheme === 'stars'
                      ? 'bg-[#facc15] text-black shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  👑 Stars
                </button>
              </div>

              {/* Static Non-Clickable SHARKVIP Visual Badge */}
              <div
                data-testid="sharkvip-static-badge"
                className="inline-flex items-center gap-1.5 border-2 border-white/80 rounded-full px-3 py-0.5 bg-black/70 shadow-[0_0_15px_rgba(236,72,153,0.45)] select-none cursor-default"
              >
                <span className="font-shark font-black text-xs sm:text-sm tracking-tight text-white">
                  SHARK<span className="text-[#facc15]">VIP</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-500 text-white font-extrabold text-[10px] tracking-wider uppercase">
                  #PLAYSAFE
                </span>
              </div>
            </div>
          </div>

          {/* Glamorous Uncropped Portrait Grid (Mobile 2x2, Desktop 4 Columns) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 items-stretch">
            {activePortraitCards.map((card, idx) => (
              <div
                key={`hero-portrait-${showcaseTheme}-${idx}`}
                className={`group relative h-48 sm:h-60 rounded-2xl overflow-hidden border-2 ${card.borderClass} bg-[#090d16] select-none transition-transform duration-300 hover:scale-[1.01]`}
              >
                <img
                  src={card.src}
                  alt={card.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                {/* Top Shimmer Tag */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs border border-white/20 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#facc15]" />
                  <span className="text-[9px] font-extrabold text-white uppercase tracking-wider">
                    {card.title}
                  </span>
                </div>
                {/* Bottom Gradient & Luxury Badge */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black via-black/75 to-transparent pointer-events-none" />
                <span
                  className={`absolute bottom-2 left-2.5 px-2.5 py-0.5 rounded-md bg-black/85 border ${card.badgeClass} text-[10px] font-extrabold uppercase tracking-wider`}
                >
                  {card.tag}
                </span>
              </div>
            ))}
          </div>

          {/* Glowing Gold & Neon Promotional Headline Overlay Banner */}
          <div className="relative rounded-2xl bg-gradient-to-r from-black/95 via-[#240724]/95 to-black/95 border-2 border-[#facc15] px-3.5 py-3 sm:px-5 sm:py-3.5 text-center shadow-[0_0_28px_rgba(250,204,21,0.35)] space-y-1">
            <h2
              data-testid="hero-mega-offer-headline"
              className="font-extrabold text-base sm:text-2xl md:text-3xl text-[#facc15] drop-shadow-[0_2px_12px_rgba(250,204,21,0.75)] tracking-tight leading-snug"
            >
              {mainOfferHeadline}
            </h2>
            <p
              data-testid="hero-mega-offer-subheadline"
              className="text-xs sm:text-sm font-bold text-white/95 drop-shadow"
            >
              {subOfferHeadline}
            </p>
          </div>

          {/* Slide Navigation Arrows & Dots (if multiple banner slides) */}
          {banners.length > 1 && (
            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={() =>
                  setActiveSlide((prev) => (prev - 1 + banners.length) % banners.length)
                }
                aria-label="Previous Slide"
                className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                {banners.map((b, idx) => (
                  <button
                    key={`banner-dot-${b.id || idx}-${idx}`}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === activeSlide
                        ? 'w-8 bg-[#facc15]'
                        : 'w-5 bg-white/30'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveSlide((prev) => (prev + 1) % banners.length)}
                aria-label="Next Slide"
                className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. DYNAMIC ACTION BAR BELOW HERO BANNER:
          - If Logged In (`currentUser`): Hides Sign Up / Login and displays the Customer's VIP Profile Strip + Create ID + My Profile + Deposit
          - If Guest (`!currentUser`): Displays Create ID, Sign Up, and Login buttons */}
      {currentUser ? (
        <div
          aria-label="Logged In VIP Member Bar"
          data-testid="hero-logged-in-profile-bar"
          className="rounded-2xl bg-gradient-to-r from-[#0e1526] via-[#151e34] to-[#0e1526] border-2 border-[#facc15]/60 p-3 sm:p-4 shadow-[0_0_24px_rgba(250,204,21,0.18)] space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Customer Identity & Live Details */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#facc15] to-amber-500 text-black font-black text-lg flex items-center justify-center shadow shrink-0">
                {(currentUser.name || 'V').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base text-white truncate">
                    {currentUser.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3 h-3" />
                    VIP Verified
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate">
                  {currentUser.email} · <span className="font-mono-tabular text-[#facc15]">{currentUser.phone}</span>
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-right">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">
                  Wallet Balance
                </span>
                <span className="font-mono-tabular font-black text-sm sm:text-base text-[#facc15]">
                  ₹{currentUser.walletBalance.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-right">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">
                  My Exchange IDs
                </span>
                <span className="font-mono-tabular font-black text-sm sm:text-base text-emerald-400">
                  {activeIdCount}
                </span>
              </div>
            </div>
          </div>

          {/* Logged-in Action Buttons (No Sign Up / Login shown!) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
            <button
              type="button"
              data-testid="hero-cta-create-id"
              onClick={onOpenCreateId}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#facc15] via-yellow-300 to-[#eab308] hover:from-yellow-300 hover:to-[#facc15] text-black font-black text-xs sm:text-sm tracking-wide uppercase shadow-lg border border-yellow-200 flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <KeyRound className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span>Create ID</span>
            </button>

            <button
              type="button"
              data-testid="hero-cta-my-profile"
              onClick={onOpenProfile}
              className="py-2.5 px-3 rounded-xl bg-[#1a253d] hover:bg-[#233252] text-[#facc15] font-extrabold text-xs sm:text-sm tracking-wide uppercase border border-[#facc15]/50 flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <span>My Profile</span>
            </button>

            <button
              type="button"
              data-testid="hero-cta-deposit"
              onClick={onOpenDeposit}
              className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm tracking-wide uppercase shadow-lg border border-emerald-300 flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <ArrowUpCircle className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span>Deposit</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          aria-label="Primary Hero Actions"
          data-testid="hero-below-cta-bar"
          className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3"
        >
          <button
            type="button"
            data-testid="hero-cta-create-id"
            onClick={onOpenCreateId}
            className="col-span-2 sm:col-span-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#facc15] via-yellow-300 to-[#eab308] hover:from-yellow-300 hover:to-[#facc15] text-black font-black text-sm sm:text-base tracking-wide uppercase shadow-[0_0_22px_rgba(250,204,21,0.5)] border-2 border-yellow-200 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
          >
            <KeyRound className="w-4 h-4 stroke-[2.5]" />
            <span>Create ID</span>
          </button>

          <button
            type="button"
            data-testid="hero-cta-signup"
            onClick={onOpenSignUp}
            className="py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm tracking-wide uppercase shadow-lg border border-emerald-300 flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Sign Up</span>
          </button>

          <button
            type="button"
            data-testid="hero-cta-login"
            onClick={onOpenLogin}
            className="py-3 px-4 rounded-2xl bg-[#131c2e] hover:bg-[#1b2740] text-[#facc15] font-extrabold text-xs sm:text-sm tracking-wide uppercase shadow-lg border-2 border-[#facc15]/60 flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
          >
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            <span>Login</span>
          </button>
        </div>
      )}

      {/* 3. ACTION & GAME CATEGORY BAR: ONLY "Create IDs" IS CLICKABLE; ALL GAME CARDS ARE NON-CLICKABLE DUMMY IMAGES */}
      <section aria-label="Create IDs and Featured Games" className="space-y-3">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 items-stretch">
          {/* 1. Left Bright Yellow Pill/Card Button: "Create IDs" (ACTIVE & CLICKABLE) */}
          <button
            type="button"
            data-testid="row-create-ids-active-btn"
            onClick={onOpenCreateId}
            className="h-[74px] sm:h-[96px] rounded-2xl bg-[#facc15] hover:bg-[#eab308] text-[#090d16] font-extrabold text-sm sm:text-xl md:text-2xl tracking-tight shadow-[0_6px_20px_rgba(250,204,21,0.3)] flex items-center justify-center px-2 transition-transform active:scale-95 cursor-pointer border-2 border-yellow-300"
          >
            Create IDs
          </button>

          {/* 2. Middle Feature Game Card: "Aviatrix" (STATIC NON-CLICKABLE DUMMY IMAGE) */}
          <div
            data-testid="dummy-card-aviatrix"
            aria-disabled="true"
            className="relative h-[74px] sm:h-[96px] rounded-2xl overflow-hidden border-2 border-indigo-500/40 shadow-lg bg-gradient-to-r from-[#12073b] via-[#1d1160] to-[#0a2463] flex items-center justify-between px-3 sm:px-5 select-none cursor-default"
          >
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_80%_30%,#38bdf8_0%,transparent_55%)] pointer-events-none" />
            <span className="relative z-10 font-shark italic font-black text-base sm:text-2xl md:text-3xl text-white tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Aviatrix
            </span>

            <svg
              viewBox="0 0 80 48"
              className="relative z-10 w-12 h-10 sm:w-20 sm:h-14 pointer-events-none"
              aria-hidden="true"
            >
              <path d="M4 32 L22 26 L18 35 Z" fill="#facc15" />
              <path
                d="M16 28 L58 14 L76 18 L52 34 L24 34 Z"
                fill="#38bdf8"
                stroke="#e0f2fe"
                strokeWidth="1.5"
              />
              <path d="M32 24 L56 16 L64 19 L42 27 Z" fill="#0284c7" />
              <ellipse cx="52" cy="20" rx="7" ry="3" fill="#fef08a" />
            </svg>
          </div>

          {/* 3. Right Feature Game Card: "MINES" (STATIC NON-CLICKABLE DUMMY IMAGE) */}
          <div
            data-testid="dummy-card-mines"
            aria-disabled="true"
            className="relative h-[74px] sm:h-[96px] rounded-2xl overflow-hidden border-2 border-red-500/40 shadow-lg bg-gradient-to-r from-[#7f1d1d] via-[#dc2626] to-[#991b1b] flex items-center justify-between px-3 sm:px-5 select-none cursor-default"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,#facc15_0%,transparent_60%)] opacity-35 pointer-events-none" />
            <span className="relative z-10 font-shark font-black text-base sm:text-2xl md:text-3xl text-[#111827] bg-gradient-to-b from-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wider">
              MINES
            </span>

            <svg
              viewBox="0 0 72 56"
              className="relative z-10 w-11 h-10 sm:w-16 sm:h-14 pointer-events-none"
              aria-hidden="true"
            >
              <circle cx="48" cy="32" r="13" fill="#111827" stroke="#374151" strokeWidth="1.5" />
              <circle cx="28" cy="34" r="16" fill="#090d16" stroke="#374151" strokeWidth="2" />
              <circle cx="23" cy="28" r="4" fill="#4b5563" opacity="0.6" />
              <path
                d="M28 18 Q32 10 40 12"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="42" cy="12" r="4.5" fill="#facc15" />
              <circle cx="42" cy="12" r="2" fill="#ffffff" />
            </svg>
          </div>
        </div>

        {/* Secondary Game Category Row: Cricket Live, Color Prediction, Live Casino (ALL STATIC NON-CLICKABLE DUMMY CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
          {/* Cricket Live Static Dummy Card */}
          <div
            data-testid="dummy-card-cricket"
            aria-disabled="true"
            className="relative h-[76px] sm:h-[88px] rounded-2xl overflow-hidden border border-emerald-500/30 bg-gradient-to-r from-[#062e22] via-[#064e3b] to-[#090d16] p-3.5 sm:p-4 flex items-center justify-between text-left select-none cursor-default"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#facc15]" />
                <span className="font-shark italic font-bold text-base sm:text-xl text-white">
                  Cricket Live
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/90 mt-0.5">
                IND vs AUS · Live Back/Lay Exchange
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono-tabular text-xs font-bold">
              1.92 / 1.94
            </span>
          </div>

          {/* Color Prediction Static Dummy Card */}
          <div
            data-testid="dummy-card-color"
            aria-disabled="true"
            className="relative h-[76px] sm:h-[88px] rounded-2xl overflow-hidden border border-purple-500/30 bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#090d16] p-3.5 sm:p-4 flex items-center justify-between text-left select-none cursor-default"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#facc15]" />
                <span className="font-shark italic font-bold text-base sm:text-xl text-white">
                  Color Prediction
                </span>
              </div>
              <p className="text-[11px] text-purple-200/90 mt-0.5">
                WinGo 30s · Red / Green / Violet 9X
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-emerald-500 border border-white/40" />
              <span className="w-4 h-4 rounded-full bg-violet-500 border border-white/40" />
              <span className="w-4 h-4 rounded-full bg-rose-500 border border-white/40" />
            </div>
          </div>

          {/* Live Casino Static Dummy Card */}
          <div
            data-testid="dummy-card-casino"
            aria-disabled="true"
            className="relative h-[76px] sm:h-[88px] rounded-2xl overflow-hidden border border-pink-500/30 bg-gradient-to-r from-[#3b0724] via-[#701a46] to-[#090d16] p-3.5 sm:p-4 flex items-center justify-between text-left select-none cursor-default"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#facc15]" />
                <span className="font-shark italic font-bold text-base sm:text-xl text-white">
                  Live Casino
                </span>
              </div>
              <p className="text-[11px] text-pink-200/90 mt-0.5">
                Teen Patti · Lightning Roulette · Baccarat
              </p>
            </div>
            <span className="w-8 h-8 rounded-full bg-[#facc15] text-black flex items-center justify-center shadow">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
