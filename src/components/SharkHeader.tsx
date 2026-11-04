import React from 'react';
import { UserProfile } from '../utils/exchangeLogic';
import { LogOut, User as UserIcon, PlusCircle } from 'lucide-react';

interface SharkHeaderProps {
  currentUser: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenProfile?: () => void;
  onLogout: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

/**
 * Exact replication of the "SHARK EXCH" Top Header Section:
 * - Top Auth Bar: Logged-in user's Interactive Profile Pill (Name + Email + My Profile modal trigger), Logout button, and EN badge.
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
}) => {
  return (
    <div className="w-full select-none">
      {/* Top Auth & Utility Bar */}
      <header className="bg-[#090d16] border-b border-white/10 px-3 sm:px-6 py-2 flex items-center justify-between gap-2">
        {/* Zone 1: Brand Wordmark + Live Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <a
            href="#top"
            className="font-shark italic font-black text-base sm:text-xl tracking-wider whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <span className="text-white">SHARK</span>
            <span className="text-[#facc15]">EXCH</span>
          </a>
          <span className="hidden md:inline-block text-white/25" aria-hidden="true">
            ·
          </span>
          <span className="hidden md:inline-block text-xs text-slate-400 truncate">
            24/7 Instant UPI Exchange
          </span>
        </div>

        {/* Zone 2: Customer Auth Status & Language Badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-testid="header-user-profile-btn"
                onClick={onOpenProfile}
                className="flex items-center gap-2 bg-[#131c2e] hover:bg-[#1b2740] border border-[#facc15]/50 rounded-xl px-2.5 py-1.5 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-[#facc15] text-black font-black text-xs flex items-center justify-center shrink-0">
                  {(currentUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="text-left max-w-[125px] sm:max-w-[200px]">
                  <p className="text-[11px] sm:text-xs font-extrabold text-white truncate leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-[#facc15] font-bold truncate leading-tight">
                    My Profile · ₹{currentUser.walletBalance.toLocaleString('en-IN')}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={onLogout}
                title="Log Out"
                aria-label="Log Out"
                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs tracking-wide transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-3 sm:px-4 py-1.5 rounded-lg bg-[#facc15] hover:bg-[#eab308] text-black font-extrabold text-xs tracking-wide transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Login
              </button>
            </div>
          )}

          {/* Language Badge (EN) matching reference top-right */}
          <span className="px-2 py-1 rounded border border-white/20 text-[11px] font-bold text-white/90 tracking-wider uppercase whitespace-nowrap">
            EN
          </span>
        </div>
      </header>

      {/* Vibrant Golden-Yellow (#facc15) Hero Wallet Section */}
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
                {/* Back Coin Stack */}
                <ellipse cx="26" cy="9" rx="12" ry="4.2" />
                <path d="M14 12.5c0 2.3 5.4 4.2 12 4.2s12-1.9 12-4.2v3.5c0 2.3-5.4 4.2-12 4.2s-12-1.9-12-4.2v-3.5z" />
                <path d="M14 19c0 2.3 5.4 4.2 12 4.2s12-1.9 12-4.2v3.5c0 2.3-5.4 4.2-12 4.2s-12-1.9-12-4.2V19z" />
                <path d="M14 25.5c0 2.3 5.4 4.2 12 4.2s12-1.9 12-4.2V29c0 2.3-5.4 4.2-12 4.2s-12-1.9-12-4.2v-3.5z" />
                {/* Front Coin Stack */}
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
    </div>
  );
};
