import React, { useState, useEffect } from 'react';
import { BannerSlide } from '../utils/exchangeLogic';
import { ChevronLeft, ChevronRight, Flame, Trophy, Zap, Play } from 'lucide-react';

export type GameCategoryType =
  | 'aviatrix'
  | 'mines'
  | 'cricket'
  | 'color'
  | 'casino';

interface BannerAndGamesProps {
  banners: BannerSlide[];
  onOpenCreateId: () => void;
  onSelectGame: (game: GameCategoryType) => void;
}

/**
 * Replicates the Middle Promotional Banner Carousel & Action/Game Category Bar below Banner:
 * - Middle Promotional Banner Carousel (#PLAYSAFE / Live Exchange Bonus slider with indicator dots)
 * - Action & Game Category Bar:
 *   * Left bright yellow button: "Create IDs"
 *   * "Aviatrix" (Space Jet crash game card)
 *   * "MINES" (Bomb minesweeper game card)
 *   * "Cricket Live", "Color Prediction", and "Live Casino"
 */
export const BannerAndGames: React.FC<BannerAndGamesProps> = ({
  banners,
  onOpenCreateId,
  onSelectGame,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const currentBanner = banners[activeSlide] || banners[0];

  return (
    <div className="space-y-4">
      {/* Middle Promotional Banner Carousel */}
      <section
        aria-label="Promotional Offers"
        className="relative rounded-2xl overflow-hidden bg-[#0c101d] border border-white/10 shadow-2xl"
      >
        <div className="relative h-[180px] sm:h-[230px] md:h-[250px] w-full overflow-hidden">
          {activeSlide === 0 ? (
            /* Slide 1: High-Impact Neon Casino & #PLAYSAFE Banner matching reference */
            <div className="relative w-full h-full flex items-center justify-between px-12 sm:px-14 bg-gradient-to-r from-[#240515] via-[#4a092a] to-[#1a0526] overflow-hidden">
              {/* Reference Banner Image Cropped strictly to the middle casino strip */}
              <img
                src="/assets/aistudio/IMG-20261103-WA0184_268471ee.jpg"
                alt="Shark Exch Live Casino Promotional Banner"
                referrerPolicy="no-referrer"
                className="absolute left-0 w-full max-w-none opacity-65 pointer-events-none select-none"
                style={{
                  height: '275%',
                  top: '-118%',
                  objectFit: 'cover',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1f0412] via-[#2b061a]/70 to-black/30 pointer-events-none" />

              {/* Left Brand & #PLAYSAFE Callout */}
              <div className="relative z-10 max-w-md space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-shark italic text-xl sm:text-3xl font-extrabold text-pink-300 drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]">
                    Sexy
                  </span>
                  <span className="text-[11px] sm:text-sm font-semibold text-amber-300 tracking-widest uppercase">
                    VIP LIVE LOUNGE
                  </span>
                </div>

                <div className="inline-block border-2 sm:border-[3px] border-white rounded-full px-4 sm:px-6 py-1 sm:py-1.5 bg-black/45 shadow-[0_0_20px_rgba(236,72,153,0.45)]">
                  <span className="font-shark font-black text-xl sm:text-3xl tracking-tight text-white">
                    SHARK<span className="text-[#facc15]">VIP</span>
                  </span>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => onSelectGame('casino')}
                    className="mt-1 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_15px_rgba(244,63,94,0.6)] cursor-pointer transition-transform active:scale-95"
                  >
                    #PLAYSAFE
                  </button>
                </div>
              </div>

              {/* Right Visual Callout Card */}
              <div className="relative z-10 hidden sm:flex items-center gap-3 sm:gap-5">
                <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-pink-500/50 shadow-2xl bg-black/65 flex flex-col items-center justify-center p-3 text-center">
                  <div className="text-3xl font-shark italic font-black text-[#facc15]">
                    200%
                  </div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider mt-1">
                    Welcome Bonus
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-pink-300 font-semibold">
                    <span>♠</span>
                    <span>♥</span>
                    <span>♣</span>
                    <span>♦</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Subsequent Slides (Aviatrix Crash / Zero Margin Cricket Exchange) */
            <div
              className="relative w-full h-full flex items-center justify-between px-12 sm:px-14"
              style={{
                background:
                  activeSlide === 1
                    ? 'linear-gradient(125deg, #060b26 0%, #0f256e 55%, #1e1b4b 100%)'
                    : 'linear-gradient(125deg, #091e14 0%, #064e3b 55%, #090d16 100%)',
              }}
            >
              <div className="relative z-10 max-w-lg space-y-1.5 sm:space-y-3">
                <span className="text-[11px] sm:text-xs font-extrabold tracking-widest uppercase text-[#facc15]">
                  {currentBanner.tag}
                </span>
                <h2 className="font-shark italic font-black text-lg sm:text-3xl md:text-4xl text-white leading-tight">
                  {currentBanner.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 line-clamp-2">
                  {currentBanner.subtitle}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onSelectGame(activeSlide === 1 ? 'aviatrix' : 'cricket')
                  }
                  className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs sm:text-sm tracking-wide transition-transform active:scale-95 cursor-pointer"
                >
                  {currentBanner.ctaText}
                </button>
              </div>

              {/* Right Accent Emblem */}
              <div className="hidden sm:flex items-center justify-center w-36 h-36 rounded-2xl bg-black/30 border border-white/10 p-4">
                <div className="text-center">
                  <div className="font-shark italic font-black text-3xl text-[#facc15]">
                    {activeSlide === 1 ? '10,000X' : '0% COMM'}
                  </div>
                  <div className="text-xs text-slate-300 mt-1 font-semibold">
                    {activeSlide === 1 ? 'INSTANT CASHOUT' : 'LIVE ODDS'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Left / Right Slide Arrows */}
          <button
            type="button"
            onClick={() =>
              setActiveSlide((prev) => (prev - 1 + banners.length) % banners.length)
            }
            aria-label="Previous Slide"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center border border-white/15 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev + 1) % banners.length)}
            aria-label="Next Slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center border border-white/15 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Bottom Pagination Indicator Bars matching reference (— — ▬) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {banners.map((b, idx) => (
              <button
                key={`banner-dot-${b.id || idx}-${idx}`}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === activeSlide
                    ? 'w-8 bg-[#facc15]'
                    : 'w-5 bg-black/70 border border-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Action & Game Category Bar (Exact 3-Card Top Row from Reference + Additional Exchange Games) */}
      <section aria-label="Create IDs and Featured Games" className="space-y-3">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 items-stretch">
          {/* 1. Left Bright Yellow Pill/Card Button: "Create IDs" */}
          <button
            type="button"
            onClick={onOpenCreateId}
            className="h-[74px] sm:h-[96px] rounded-2xl bg-[#facc15] hover:bg-[#eab308] text-[#090d16] font-extrabold text-sm sm:text-xl md:text-2xl tracking-tight shadow-[0_6px_20px_rgba(250,204,21,0.3)] flex items-center justify-center px-2 transition-transform active:scale-95 cursor-pointer border-2 border-yellow-300"
          >
            Create IDs
          </button>

          {/* 2. Middle Feature Game Card: "Aviatrix" (Space Jet Crash Game Card) */}
          <button
            type="button"
            onClick={() => onSelectGame('aviatrix')}
            className="group relative h-[74px] sm:h-[96px] rounded-2xl overflow-hidden border-2 border-indigo-500/40 hover:border-[#facc15] shadow-lg transition-all active:scale-95 cursor-pointer bg-gradient-to-r from-[#12073b] via-[#1d1160] to-[#0a2463] flex items-center justify-between px-3 sm:px-5"
          >
            {/* Cosmic Starfield & Speed Lines */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_80%_30%,#38bdf8_0%,transparent_55%)] pointer-events-none" />
            <span className="relative z-10 font-shark italic font-black text-base sm:text-2xl md:text-3xl text-white tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:text-[#facc15] transition-colors">
              Aviatrix
            </span>

            {/* Custom Futuristic Space Jet SVG */}
            <svg
              viewBox="0 0 80 48"
              className="relative z-10 w-12 h-10 sm:w-20 sm:h-14 transform group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform"
              aria-hidden="true"
            >
              {/* Jet Thruster Flame */}
              <path
                d="M4 32 L22 26 L18 35 Z"
                fill="#facc15"
              />
              {/* Fuselage & Wings */}
              <path
                d="M16 28 L58 14 L76 18 L52 34 L24 34 Z"
                fill="#38bdf8"
                stroke="#e0f2fe"
                strokeWidth="1.5"
              />
              <path
                d="M32 24 L56 16 L64 19 L42 27 Z"
                fill="#0284c7"
              />
              {/* Cockpit Canopy */}
              <ellipse cx="52" cy="20" rx="7" ry="3" fill="#fef08a" />
            </svg>
          </button>

          {/* 3. Right Feature Game Card: "MINES" (Fiery Bomb Minesweeper Card) */}
          <button
            type="button"
            onClick={() => onSelectGame('mines')}
            className="group relative h-[74px] sm:h-[96px] rounded-2xl overflow-hidden border-2 border-red-500/40 hover:border-[#facc15] shadow-lg transition-all active:scale-95 cursor-pointer bg-gradient-to-r from-[#7f1d1d] via-[#dc2626] to-[#991b1b] flex items-center justify-between px-3 sm:px-5"
          >
            {/* Fiery Explosion Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,#facc15_0%,transparent_60%)] opacity-35 pointer-events-none" />
            <span className="relative z-10 font-shark font-black text-base sm:text-2xl md:text-3xl text-[#111827] bg-gradient-to-b from-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wider">
              MINES
            </span>

            {/* Custom Glossy Naval Bombs with Sparking Fuse SVG */}
            <svg
              viewBox="0 0 72 56"
              className="relative z-10 w-11 h-10 sm:w-16 sm:h-14 transform group-hover:scale-105 transition-transform"
              aria-hidden="true"
            >
              {/* Back Bomb */}
              <circle cx="48" cy="32" r="13" fill="#111827" stroke="#374151" strokeWidth="1.5" />
              {/* Main Front Bomb */}
              <circle cx="28" cy="34" r="16" fill="#090d16" stroke="#374151" strokeWidth="2" />
              <circle cx="23" cy="28" r="4" fill="#4b5563" opacity="0.6" />
              {/* Fuse & Spark */}
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
          </button>
        </div>

        {/* Secondary Game Category Row: Cricket Live, Color Prediction, Live Casino */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
          {/* Cricket Live Card */}
          <button
            type="button"
            onClick={() => onSelectGame('cricket')}
            className="group relative h-[76px] sm:h-[88px] rounded-2xl overflow-hidden border border-emerald-500/30 hover:border-[#facc15] bg-gradient-to-r from-[#062e22] via-[#064e3b] to-[#090d16] p-3.5 sm:p-4 flex items-center justify-between transition-all active:scale-98 cursor-pointer text-left"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#facc15]" />
                <span className="font-shark italic font-bold text-base sm:text-xl text-white group-hover:text-[#facc15] transition-colors">
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
          </button>

          {/* Color Prediction Card */}
          <button
            type="button"
            onClick={() => onSelectGame('color')}
            className="group relative h-[76px] sm:h-[88px] rounded-2xl overflow-hidden border border-purple-500/30 hover:border-[#facc15] bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#090d16] p-3.5 sm:p-4 flex items-center justify-between transition-all active:scale-98 cursor-pointer text-left"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#facc15]" />
                <span className="font-shark italic font-bold text-base sm:text-xl text-white group-hover:text-[#facc15] transition-colors">
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
          </button>

          {/* Live Casino Card */}
          <button
            type="button"
            onClick={() => onSelectGame('casino')}
            className="group relative h-[76px] sm:h-[88px] rounded-2xl overflow-hidden border border-pink-500/30 hover:border-[#facc15] bg-gradient-to-r from-[#3b0724] via-[#701a46] to-[#090d16] p-3.5 sm:p-4 flex items-center justify-between transition-all active:scale-98 cursor-pointer text-left"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#facc15]" />
                <span className="font-shark italic font-bold text-base sm:text-xl text-white group-hover:text-[#facc15] transition-colors">
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
          </button>
        </div>
      </section>
    </div>
  );
};
