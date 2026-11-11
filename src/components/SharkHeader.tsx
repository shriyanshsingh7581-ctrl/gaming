import React from 'react';
import { UserProfile } from '../utils/exchangeLogic';
import { LogOut, User } from 'lucide-react';

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
 * Official Stacked White & Yellow "SHARK / - EXCHANGE -" Logo
 * Matches the user's attached reference image (`Screenshot_20261111_203249_Chrome_b91a2995.png`)
 * for both the top header bar and the center wallet card.
 */
export const SharkXLogo: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  darkText?: boolean;
}> = ({ size = 'sm', darkText = false }) => {
  const sharkTextClass =
    size === 'lg'
      ? 'text-2xl sm:text-3xl tracking-[0.14em]'
      : size === 'sm'
      ? 'text-sm sm:text-base tracking-[0.14em]'
      : 'text-lg sm:text-xl tracking-[0.14em]';

  const barClass =
    size === 'lg'
      ? 'mt-1.5 min-w-[136px] sm:min-w-[156px] py-0.5 px-2.5 text-[8.5px] sm:text-[10px] tracking-[0.18em]'
      : size === 'sm'
      ? 'mt-0.5 min-w-[88px] sm:min-w-[102px] py-[1px] px-1.5 text-[6.5px] sm:text-[7.5px] tracking-[0.16em]'
      : 'mt-1 min-w-[110px] sm:min-w-[126px] py-0.5 px-2 text-[7.5px] sm:text-[9px] tracking-[0.17em]';

  return (
    <span
      data-testid="sharkx-branding"
      className="inline-flex flex-col items-center select-none leading-none"
    >
      <span
        className={`font-extrabold uppercase leading-none ${sharkTextClass} ${
          darkText ? 'text-[#141414]' : 'text-white'
        }`}
      >
        SHARK
      </span>
      <span
        className={`block font-extrabold uppercase leading-tight whitespace-nowrap text-center ${barClass} ${
          darkText
            ? 'bg-[#141414] text-[#f6bd20]'
            : 'bg-[#f6bd20] text-[#181818]'
        }`}
      >
        - EXCHANGE -
      </span>
    </span>
  );
};

/**
 * Full-Height Golden-Yellow (`#f6bd20`) Header & Wallet Showcase Section:
 * - Stretches the golden-yellow background continuously from the very top edge of the page
 *   (covering the top Logo, Username/Profile badge, and Log Out button) all the way down
 *   behind the 3 interlocking Wallet cards.
 * - Wallet Balance is displayed in ONLY one place (the center elevated dark wallet card).
 */
export const SharkHeader: React.FC<SharkHeaderProps> = ({
  currentUser,
  onOpenProfile,
  onLogout,
  onOpenDeposit,
  onOpenWithdraw,
}) => {
  return (
    <div
      data-testid="shark-yellow-top-wrapper"
      className="w-full select-none relative overflow-hidden bg-[#f6bd20] shadow-md"
    >
      {/* Subtle decorative background card watermarks across the full yellow backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-8 bottom-2 w-28 h-20 rounded-2xl border-2 border-black/[0.06] bg-black/[0.03] rotate-12"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/4 top-2 w-24 h-24 rounded-2xl border-2 border-black/[0.05] bg-black/[0.02] -rotate-12"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 bottom-4 w-28 h-20 rounded-2xl border-2 border-black/[0.06] bg-black/[0.03] -rotate-12"
      />

      {/* 1. TOP HEADER BAR INSIDE THE GOLDEN-YELLOW BACKGROUND (Logo on left, Profile/Username + Log Out on right) */}
      <header
        data-testid="shark-yellow-header-bar"
        className="relative z-20 px-3 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-2"
      >
        <a
          href="#top"
          className="inline-flex items-center px-2.5 py-1.5 rounded-xl bg-[#1b1b1b] shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
        >
          <SharkXLogo size="sm" />
        </a>

        {currentUser && (
          <div className="flex items-center gap-2">
            {/* Profile / Username pill (No wallet balance here — balance is only in the center wallet card) */}
            <button
              type="button"
              data-testid="header-profile-btn"
              onClick={onOpenProfile}
              title="Profile & Account Statement"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b1b1b] hover:bg-[#262626] text-white text-xs font-bold shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#f6bd20] shrink-0" />
              <span className="max-w-[110px] sm:max-w-[160px] truncate">
                {currentUser.name}
              </span>
            </button>

            {/* Log Out Button */}
            <button
              type="button"
              data-testid="header-logout-btn"
              onClick={onLogout}
              title="Log Out"
              aria-label="Log Out"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b1b1b] hover:bg-[#2b1616] text-white hover:text-red-300 text-xs font-bold shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#f6bd20]" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </header>

      {/* 2. REFERENCE-MATCHED GOLDEN-YELLOW WALLET BANNER */}
      <section
        aria-label="Shark Exchange Wallet and Quick Actions"
        className="relative z-10 px-3 sm:px-6 pt-3 pb-6 sm:pb-8"
      >
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

          {/* CENTER ELEVATED WALLET CARD (Single Place for Wallet Balance) */}
          <div className="relative z-20 w-[46%] sm:w-[236px] min-h-[188px] sm:min-h-[220px] bg-[#212121] text-white rounded-[24px] sm:rounded-[30px] py-5 sm:py-6 px-3 sm:px-5 flex flex-col items-center justify-between shadow-[0_14px_34px_rgba(0,0,0,0.58)]">
            {/* Official Stacked White & Yellow Emblem: SHARK / - EXCHANGE - */}
            <SharkXLogo size="lg" />

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

