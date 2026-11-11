import React from 'react';
import { UserProfile } from '../utils/exchangeLogic';
import { LogOut } from 'lucide-react';

export interface SharkHeaderProps {
  currentUser: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenProfile?: () => void;
  onLogout: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenCreateId?: () => void;
  onOpenLiveChat?: () => void;
  onOpenPromoAd?: () => void;
  onQuickNavigate?: (section: string) => void;
}

/**
 * Simple, Clean & Premium Full-Name "Shark Exchange" Brand Wordmark
 */
export const SharkXLogo: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  darkText?: boolean;
}> = ({ size = 'md', darkText = false }) => {
  const sharkSize =
    size === 'lg'
      ? 'text-2xl sm:text-4xl'
      : size === 'sm'
      ? 'text-base sm:text-xl'
      : 'text-xl sm:text-2xl';
  const exchangeSize =
    size === 'lg'
      ? 'text-lg sm:text-2xl'
      : size === 'sm'
      ? 'text-sm sm:text-base'
      : 'text-base sm:text-xl';

  return (
    <span
      data-testid="sharkx-branding"
      className="inline-flex items-baseline gap-1.5 select-none leading-none"
    >
      <span
        className={`font-extrabold tracking-wider uppercase ${sharkSize} ${
          darkText ? 'text-[#141414]' : 'text-white'
        }`}
      >
        Shark
      </span>
      <span
        className={`font-bold tracking-wider uppercase ${exchangeSize} ${
          darkText ? 'text-[#141414]/85' : 'text-[#f6bd20]'
        }`}
      >
        Exchange
      </span>
    </span>
  );
};

/**
 * Minimalist Shark Exchange Header & Reference-Matched Golden-Yellow Wallet Section:
 * - Minimalist top bar (`#070a10`) with clean, simple, premium "Shark Exchange" full name.
 * - Immediately hides Login and Signup buttons once `currentUser` is logged in.
 * - Golden-Yellow (`#f6bd20`) Wallet Section matching the exact overlapping 3-card layout:
 *   1. Left Dark Wing Card (`#1b1b1b`, tucked behind center card): "Deposit" + bold white double-up chevrons
 *   2. Center Elevated Dark Card (`#212121`, taller with deep shadow): Simple & premium full-name "SHARK / - EXCHANGE -" badge + "WALLET BALANCE" + stacked white coins + clean balance
 *   3. Right Dark Wing Card (`#1b1b1b`, tucked behind center card): "Withdraw" + bold white double-down chevrons
 */
export const SharkHeader: React.FC<SharkHeaderProps> = ({
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onLogout,
  onOpenDeposit,
  onOpenWithdraw,
}) => {
  return (
    <div className="w-full select-none">
      {/* 1. MINIMALIST TOP HEADER BAR */}
      <header className="bg-[#070a10] border-b border-white/10 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        <a href="#top" className="inline-flex items-center">
          <SharkXLogo size="sm" />
        </a>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {currentUser ? (
            <>
              <button
                type="button"
                data-testid="header-user-profile-btn"
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 bg-[#111726] hover:bg-[#192238] border border-[#f6bd20]/40 rounded-lg px-2.5 py-1 transition-colors cursor-pointer"
              >
                <span className="text-xs font-semibold text-white truncate max-w-[110px] sm:max-w-[160px]">
                  {currentUser.name}
                </span>
                <span className="text-white/30">·</span>
                <span className="font-mono-tabular text-xs font-bold text-[#f6bd20]">
                  ₹{currentUser.walletBalance.toLocaleString('en-IN')}
                </span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                title="Log Out"
                aria-label="Log Out"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 text-slate-300 hover:text-red-300 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                data-testid="header-login-btn"
                onClick={() => onOpenAuth('login')}
                className="px-3 sm:px-3.5 py-1 rounded-lg bg-[#f6bd20] hover:bg-[#eab308] text-black font-bold text-xs tracking-wide transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Login
              </button>

              <button
                type="button"
                data-testid="header-signup-btn"
                onClick={() => onOpenAuth('signup')}
                className="px-3 sm:px-3.5 py-1 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-white font-bold text-xs tracking-wide transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Signup
              </button>
            </>
          )}
        </div>
      </header>

      {/* 2. REFERENCE-MATCHED GOLDEN-YELLOW WALLET BANNER */}
      <section
        aria-label="Shark Exchange Wallet and Quick Actions"
        className="relative overflow-hidden bg-[#f6bd20] px-3 sm:px-6 py-5 sm:py-7 shadow-md"
      >
        {/* Subtle decorative background card watermarks matching reference */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-8 bottom-2 w-28 h-20 rounded-2xl border-2 border-black/[0.05] bg-black/[0.03] rotate-12"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/4 -top-6 w-24 h-24 rounded-2xl border-2 border-black/[0.04] bg-black/[0.02] -rotate-12"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 bottom-4 w-28 h-20 rounded-2xl border-2 border-black/[0.05] bg-black/[0.03] -rotate-12"
        />

        {/* Interlocking 3-Card Wallet Container */}
        <div className="relative z-10 max-w-md sm:max-w-lg mx-auto flex items-center justify-center">
          {/* LEFT WING CARD: Deposit */}
          <button
            type="button"
            onClick={onOpenDeposit}
            aria-label="Deposit Funds"
            className="group relative z-10 w-[29%] sm:w-[140px] h-[134px] sm:h-[162px] -mr-2.5 bg-[#1b1b1b] hover:bg-[#242424] text-white rounded-l-[22px] sm:rounded-l-[26px] rounded-r-none pr-2 pl-2 flex flex-col items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <span className="text-[13px] sm:text-base font-normal tracking-wide text-white/95 group-hover:text-[#f6bd20] transition-colors">
              Deposit
            </span>

            <div className="mt-2.5 sm:mt-3 transform group-hover:-translate-y-0.5 transition-transform duration-150">
              <svg
                viewBox="0 0 64 64"
                className="w-11 h-11 sm:w-14 sm:h-14 text-white"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M32 10L10 27v12l22-17 22 17V27L32 10z" />
                <path d="M32 31L10 48v12l22-17 22 17V48L32 31z" />
              </svg>
            </div>
          </button>

          {/* CENTER ELEVATED WALLET CARD */}
          <div className="relative z-20 w-[46%] sm:w-[236px] min-h-[188px] sm:min-h-[220px] bg-[#212121] text-white rounded-[24px] sm:rounded-[30px] py-5 sm:py-6 px-3 sm:px-5 flex flex-col items-center justify-between shadow-[0_14px_34px_rgba(0,0,0,0.58)]">
            {/* Simple & Premium Full Exchange Brand Emblem: SHARK / - EXCHANGE - */}
            <div className="flex flex-col items-center w-full">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-[0.14em] uppercase leading-none">
                SHARK
              </span>
              <div className="mt-1.5 w-full max-w-[136px] sm:max-w-[156px] bg-[#f6bd20] text-[#181818] py-0.5 px-2 text-center">
                <span className="block text-[8.5px] sm:text-[10px] font-extrabold tracking-[0.18em] uppercase leading-tight whitespace-nowrap">
                  - EXCHANGE -
                </span>
              </div>
            </div>

            {/* Wallet Balance Label + Stacked Coins & Amount */}
            <div className="mt-4 sm:mt-5 flex flex-col items-center">
              <p className="text-[11px] sm:text-[13px] font-normal tracking-[0.06em] text-white/95 uppercase">
                WALLET BALANCE
              </p>

              <div className="mt-2 flex items-center justify-center gap-2">
                <svg
                  viewBox="0 0 44 40"
                  className="w-6 h-6 sm:w-8 sm:h-8 text-white shrink-0"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <ellipse cx="26" cy="9" rx="11" ry="4" />
                  <path d="M15 12.5c0 2.2 4.9 4 11 4s11-1.8 11-4v3.3c0 2.2-4.9 4-11 4s-11-1.8-11-4v-3.3z" />
                  <path d="M15 18.8c0 2.2 4.9 4 11 4s11-1.8 11-4v3.3c0 2.2-4.9 4-11 4s-11-1.8-11-4v-3.3z" />
                  <path d="M15 25c0 2.2 4.9 4 11 4s11-1.8 11-4v3.3c0 2.2-4.9 4-11 4s-11-1.8-11-4V25z" />
                  <ellipse cx="14" cy="19" rx="9" ry="3.3" stroke="#212121" strokeWidth="1.4" />
                  <path
                    d="M5 22c0 1.8 4 3.3 9 3.3s9-1.5 9-3.3v2.8c0 1.8-4 3.3-9 3.3s-9-1.5-9-3.3V22z"
                    stroke="#212121"
                    strokeWidth="1"
                  />
                  <path
                    d="M5 27.2c0 1.8 4 3.3 9 3.3s9-1.5 9-3.3V30c0 1.8-4 3.3-9 3.3s-9-1.5-9-3.3v-2.8z"
                    stroke="#212121"
                    strokeWidth="1"
                  />
                </svg>

                <span
                  data-testid="wallet-balance-value"
                  className="font-mono-tabular font-normal text-2xl sm:text-3xl text-white tracking-wide"
                >
                  {currentUser
                    ? currentUser.walletBalance.toLocaleString('en-IN')
                    : '0'}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT WING CARD: Withdraw */}
          <button
            type="button"
            onClick={onOpenWithdraw}
            aria-label="Withdraw Funds"
            className="group relative z-10 w-[29%] sm:w-[140px] h-[134px] sm:h-[162px] -ml-2.5 bg-[#1b1b1b] hover:bg-[#242424] text-white rounded-r-[22px] sm:rounded-r-[26px] rounded-l-none pl-2 pr-2 flex flex-col items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <span className="text-[13px] sm:text-base font-normal tracking-wide text-white/95 group-hover:text-[#f6bd20] transition-colors">
              Withdraw
            </span>

            <div className="mt-2.5 sm:mt-3 transform group-hover:translate-y-0.5 transition-transform duration-150">
              <svg
                viewBox="0 0 64 64"
                className="w-11 h-11 sm:w-14 sm:h-14 text-white"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10 12v12l22 17 22-17V12L32 29 10 12z" />
                <path d="M10 33v12l22 17 22-17V33L32 50 10 33z" />
              </svg>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};
