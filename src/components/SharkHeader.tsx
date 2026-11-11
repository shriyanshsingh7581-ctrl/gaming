import React from 'react';
import { UserProfile } from '../utils/exchangeLogic';
import { LogOut, PlusCircle } from 'lucide-react';

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

export const SharkXLogo: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  darkText?: boolean;
}> = ({ size = 'md', darkText = false }) => {
  const sharkSize =
    size === 'lg'
      ? 'text-3xl sm:text-5xl md:text-6xl'
      : size === 'sm'
      ? 'text-xl sm:text-2xl'
      : 'text-2xl sm:text-3xl';
  const xSize =
    size === 'lg'
      ? 'text-lg sm:text-2xl md:text-3xl'
      : size === 'sm'
      ? 'text-xs sm:text-sm'
      : 'text-sm sm:text-base';

  return (
    <span
      data-testid="sharkx-branding"
      className="inline-flex items-baseline gap-0.5 select-none leading-none"
    >
      <span
        className={`font-shark font-black tracking-tight ${sharkSize} ${
          darkText ? 'text-[#090d16]' : 'text-white'
        }`}
      >
        Shark
      </span>
      <span
        className={`font-serif italic font-bold tracking-widest uppercase px-1 py-0.5 rounded border ${xSize} ${
          darkText
            ? 'text-[#090d16] border-[#090d16]/50 bg-black/10'
            : 'text-[#facc15] border-[#facc15]/60 bg-[#facc15]/10 shadow-[0_0_10px_rgba(250,204,21,0.25)]'
        }`}
      >
        X
      </span>
    </span>
  );
};

/**
 * Minimalist SharkX Header & Golden-Yellow Wallet Section:
 * - Minimalist top bar (`#070a10`) with "SharkX" branding ("Shark" large prominent, "X" smaller royal/classic),
 *   compact username + wallet balance, and Login / Signup buttons.
 * - Golden-Yellow (#facc15) Header Banner with 3 rounded Black (#090d16) cards:
 *   1. Left Vertical Black Card: "Deposit" + bold double upward white chevrons (⏫)
 *   2. Center Large Black Card: "SharkX" branding + "WALLET BALANCE" + stacked coins + live balance
 *   3. Right Vertical Black Card: "Withdraw" + bold double downward white chevrons (⏬)
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
      <header className="bg-[#070a10] border-b border-white/10 px-3 sm:px-6 py-2 flex items-center justify-between gap-2">
        <a href="#top" className="inline-flex items-center">
          <SharkXLogo size="sm" />
        </a>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {currentUser && (
            <button
              type="button"
              data-testid="header-user-profile-btn"
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 bg-[#111726] hover:bg-[#192238] border border-[#facc15]/40 rounded-lg px-2.5 py-1 transition-colors cursor-pointer"
            >
              <span className="text-xs font-bold text-white truncate max-w-[90px] sm:max-w-[140px]">
                {currentUser.name}
              </span>
              <span className="text-white/30">·</span>
              <span className="font-mono-tabular text-xs font-extrabold text-[#facc15]">
                ₹{currentUser.walletBalance.toLocaleString('en-IN')}
              </span>
            </button>
          )}

          <button
            type="button"
            data-testid="header-login-btn"
            onClick={() => onOpenAuth('login')}
            className="px-2.5 sm:px-3.5 py-1 rounded-lg bg-[#facc15] hover:bg-[#eab308] text-black font-extrabold text-xs tracking-wide transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Login
          </button>

          <button
            type="button"
            data-testid="header-signup-btn"
            onClick={() => onOpenAuth('signup')}
            className="px-2.5 sm:px-3.5 py-1 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-white font-extrabold text-xs tracking-wide transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Signup
          </button>

          {currentUser && (
            <button
              type="button"
              onClick={onLogout}
              title="Log Out"
              aria-label="Log Out"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 text-slate-300 hover:text-red-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* 2. VIBRANT GOLDEN-YELLOW (#facc15) HERO WALLET SECTION */}
      <section
        aria-label="SharkX Wallet and Quick Actions"
        className="shark-gold-header relative px-3 sm:px-6 py-4 sm:py-5 border-b-4 border-[#090d16] shadow-lg"
      >
        <div className="max-w-4xl mx-auto grid grid-cols-[92px_1fr_92px] sm:grid-cols-[140px_1fr_140px] gap-2.5 sm:gap-5 items-center">
          {/* LEFT VERTICAL BLACK CARD BUTTON: Deposit ⏫ */}
          <button
            type="button"
            onClick={onOpenDeposit}
            aria-label="Deposit Funds"
            className="group bg-[#090d16] hover:bg-[#111726] text-white rounded-[20px] sm:rounded-[26px] py-3.5 sm:py-4 px-2 flex flex-col items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.45)] border border-white/10 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <span className="text-xs sm:text-lg font-semibold tracking-wide text-white group-hover:text-[#facc15] transition-colors">
              Deposit
            </span>

            <div className="mt-1.5 sm:mt-2 transform group-hover:-translate-y-1 transition-transform duration-150">
              <svg
                viewBox="0 0 64 64"
                className="w-10 h-10 sm:w-14 sm:h-14 text-white"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M32 8L8 26v13l24-18 24 18V26L32 8z" />
                <path d="M32 31L8 49v13l24-18 24 18V49L32 31z" />
              </svg>
            </div>
          </button>

          {/* CENTER LARGE BLACK CARD: SharkX + WALLET BALANCE */}
          <div className="bg-[#090d16] text-white rounded-[24px] sm:rounded-[32px] py-4 sm:py-5 px-3 sm:px-6 flex flex-col items-center justify-center shadow-[0_14px_32px_rgba(0,0,0,0.55)] border border-white/10 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            {/* SharkX Wordmark: "Shark" large prominent, "X" smaller royal/classic */}
            <SharkXLogo size="lg" />

            {/* Subtitle: WALLET BALANCE */}
            <p className="mt-2.5 sm:mt-3 text-[10px] sm:text-xs font-semibold tracking-[0.16em] text-white/90 uppercase">
              WALLET BALANCE
            </p>

            {/* Stacked Coin Icon + Compact Clean Balance Counter */}
            <div className="mt-1 sm:mt-1.5 flex items-center justify-center gap-2">
              <svg
                viewBox="0 0 44 40"
                className="w-6 h-6 sm:w-8 sm:h-8 text-white shrink-0"
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
                className="font-mono-tabular font-bold text-xl sm:text-3xl text-white tracking-tight"
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
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* RIGHT VERTICAL BLACK CARD BUTTON: Withdraw ⏬ */}
          <button
            type="button"
            onClick={onOpenWithdraw}
            aria-label="Withdraw Funds"
            className="group bg-[#090d16] hover:bg-[#111726] text-white rounded-[20px] sm:rounded-[26px] py-3.5 sm:py-4 px-2 flex flex-col items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.45)] border border-white/10 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <span className="text-xs sm:text-lg font-semibold tracking-wide text-white group-hover:text-[#facc15] transition-colors">
              Withdraw
            </span>

            <div className="mt-1.5 sm:mt-2 transform group-hover:translate-y-1 transition-transform duration-150">
              <svg
                viewBox="0 0 64 64"
                className="w-10 h-10 sm:w-14 sm:h-14 text-white"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 10v13l24 18 24-18V10L32 28 8 10z" />
                <path d="M8 33v13l24 18 24-18V33L32 51 8 33z" />
              </svg>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};

