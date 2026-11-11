import React, { useState } from 'react';
import {
  BannerSlide,
  UserProfile,
  OFFICIAL_POSTER_ASSETS,
  DEFAULT_CLOUDINARY_PROMO_VIDEO_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  PROMO_GREEN_STRIP_TEXT,
} from '../utils/exchangeLogic';
import {
  registerCustomerWithEmail,
  loginCustomerWithEmail,
} from '../firebase';
import { SharkXLogo } from './SharkHeader';
import {
  UserPlus,
  LogIn,
  Mail,
  Lock,
  Phone,
} from 'lucide-react';

export type GameCategoryType =
  | 'aviatrix'
  | 'mines'
  | 'cricket'
  | 'color'
  | 'casino';

/**
 * Reusable Cloudinary Single Video Player + Bold Green Strip Component:
 * - Replaces top banner sliders with a single video player hosted/streamed via Cloudinary
 *   (Cloud Name: `dxeuzdwkz`, Upload Preset: `Sharkexchange`).
 * - Under the video, displays a single-line, bold green strip (zoomed/prominent, no line-break)
 *   with the exact text: "Pay 500 and get 1000 instant bonus"
 */
export const CloudinaryPromoVideoSection: React.FC<{
  videoUrl?: string;
}> = ({ videoUrl }) => {
  const activeVideoUrl = videoUrl || DEFAULT_CLOUDINARY_PROMO_VIDEO_URL;

  return (
    <section
      aria-label="Promotional Video and Instant Bonus"
      data-testid="cloudinary-video-section"
      data-cloudinary-cloud-name={CLOUDINARY_CLOUD_NAME}
      data-cloudinary-upload-preset={CLOUDINARY_UPLOAD_PRESET}
      className="rounded-2xl overflow-hidden border-2 border-[#facc15]/70 bg-[#050811] shadow-[0_10px_30px_rgba(0,0,0,0.65)]"
    >
      <div className="relative w-full bg-black">
        <video
          key={activeVideoUrl}
          data-testid="cloudinary-promo-video"
          src={activeVideoUrl}
          poster={OFFICIAL_POSTER_ASSETS.megaOffer500Poster}
          className="w-full max-h-[260px] sm:max-h-[340px] object-cover block"
          controls
          autoPlay
          muted
          loop
          playsInline
        />
      </div>

      {/* Single-line, bold green strip (zoomed/prominent, no line-break) */}
      <div
        data-testid="promo-green-strip"
        className="w-full bg-gradient-to-r from-[#059669] via-[#10b981] to-[#059669] border-t-2 border-emerald-300 px-3 py-2.5 sm:py-3 text-center overflow-hidden"
      >
        <p className="font-black text-white text-sm sm:text-xl md:text-2xl tracking-wide whitespace-nowrap truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] scale-[1.03]">
          {PROMO_GREEN_STRIP_TEXT}
        </p>
      </div>
    </section>
  );
};

interface PreLoginLandingPageProps {
  banners: BannerSlide[];
  promoVideoUrl?: string;
  onOpenSignUpModal: () => void;
  onOpenLoginModal: () => void;
  onOpenPromoAd?: () => void;
  onAuthSuccess: (user: UserProfile, message: string) => void;
}

/**
 * PRE-LOGIN LANDING & AUTH PAGE:
 * - Minimalist Top Header with SharkX branding ("Shark" large prominent, "X" smaller royal/classic)
 *   and Login / Signup buttons.
 * - Single Cloudinary Video Player (`dxeuzdwkz` / `Sharkexchange`) + single-line bold green strip:
 *   "Pay 500 and get 1000 instant bonus"
 * - Clean Authentication Card:
 *   - No "Continue with Google" or "Demo Account" options.
 *   - Signup Form: strictly 3 fields (Mobile Number, Email, Password).
 *   - Login Form: strictly 2 fields (Email, Password).
 */
export const PreLoginLandingPage: React.FC<PreLoginLandingPageProps> = ({
  promoVideoUrl,
  onOpenSignUpModal,
  onOpenLoginModal,
  onAuthSuccess,
}) => {
  const [authTab, setAuthTab] = useState<'signup' | 'login'>('signup');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (authTab === 'signup') {
        const cleanDigits = phone.replace(/\D/g, '').slice(-10);
        if (cleanDigits.length < 10) {
          throw new Error('Please enter a valid 10-digit Mobile Number.');
        }
        if (!email.trim() || !email.includes('@')) {
          throw new Error('Please enter a valid Email address.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        const profile = await registerCustomerWithEmail({
          phone: `+91 ${cleanDigits}`,
          email: email.trim(),
          password,
        });
        onAuthSuccess(
          profile,
          `🎉 Welcome ${profile.name}! ₹500 Welcome Bonus credited to your wallet!`
        );
      } else {
        if (!email.trim()) {
          throw new Error('Please enter your Email.');
        }
        const profile = await loginCustomerWithEmail(email.trim(), password);
        onAuthSuccess(profile, `Welcome back, ${profile.name}!`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="page-1-prelogin-landing"
      className="min-h-screen bg-[#070a10] text-white flex flex-col pb-12"
    >
      {/* Minimalist Top Header Bar (SharkX + Login / Signup buttons) */}
      <header className="bg-[#070a10] border-b border-white/10 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        <SharkXLogo size="sm" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="prelogin-header-login-btn"
            onClick={() => {
              setAuthTab('login');
              onOpenLoginModal();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#facc15] hover:bg-[#eab308] text-black font-extrabold text-xs sm:text-sm tracking-wide cursor-pointer"
          >
            Login
          </button>
          <button
            type="button"
            data-testid="prelogin-header-signup-btn"
            onClick={() => {
              setAuthTab('signup');
              onOpenSignUpModal();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-white font-extrabold text-xs sm:text-sm tracking-wide cursor-pointer"
          >
            Signup
          </button>
        </div>
      </header>

      {/* Main Pre-Login Front Page Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 pt-4 space-y-5">
        {/* 1. CLOUDINARY VIDEO PLAYER + SINGLE-LINE BOLD GREEN STRIP */}
        <CloudinaryPromoVideoSection videoUrl={promoVideoUrl} />

        {/* 2. SIGNUP / LOGIN TAB BUTTONS */}
        <div
          aria-label="Primary Hero Actions"
          data-testid="hero-below-cta-bar"
          className="grid grid-cols-2 gap-3"
        >
          <button
            type="button"
            data-testid="hero-cta-signup"
            onClick={() => setAuthTab('signup')}
            className={`py-3 px-4 rounded-2xl font-extrabold text-sm sm:text-base tracking-wide uppercase flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 border-2 ${
              authTab === 'signup'
                ? 'bg-[#10b981] text-white border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                : 'bg-[#0c111d] text-emerald-400 border-emerald-500/40'
            }`}
          >
            <UserPlus className="w-5 h-5 stroke-[2.5]" />
            <span>Sign Up</span>
          </button>

          <button
            type="button"
            data-testid="hero-cta-login"
            onClick={() => setAuthTab('login')}
            className={`py-3 px-4 rounded-2xl font-extrabold text-sm sm:text-base tracking-wide uppercase flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 border-2 ${
              authTab === 'login'
                ? 'bg-[#facc15] text-[#090d16] border-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.35)]'
                : 'bg-[#0c111d] text-[#facc15] border-[#facc15]/50'
            }`}
          >
            <LogIn className="w-5 h-5 stroke-[2.5]" />
            <span>Login</span>
          </button>
        </div>

        {/* 3. AUTHENTICATION FORM CARD (Signup: 3 fields | Login: 2 fields) */}
        <section
          aria-label="Customer Sign Up and Login Form"
          data-testid="page-1-auth-card"
          className="rounded-3xl bg-[#0c111d] border-2 border-[#facc15]/50 shadow-[0_18px_48px_rgba(0,0,0,0.75)] overflow-hidden"
        >
          <div className="bg-[#facc15] text-[#090d16] px-5 py-3.5 flex items-center justify-between gap-2">
            <h3 className="font-shark italic font-black text-base sm:text-xl tracking-wide uppercase">
              {authTab === 'signup' ? 'SIGN UP ACCOUNT' : 'MEMBER LOGIN'}
            </h3>
            <SharkXLogo size="sm" darkText />
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-400/40 text-red-200 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authTab === 'signup' && (
                <div>
                  <label
                    htmlFor="landing-signup-phone"
                    className="block text-xs font-bold text-slate-300 mb-1"
                  >
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="landing-signup-phone"
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#070a10] border border-white/15 text-white text-sm font-mono-tabular focus:outline-none focus:border-[#facc15]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="landing-auth-email"
                  className="block text-xs font-bold text-slate-300 mb-1"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="landing-auth-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#070a10] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="landing-auth-password"
                  className="block text-xs font-bold text-slate-300 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="landing-auth-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#070a10] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-[#090d16] font-extrabold text-sm tracking-wide shadow-lg transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {loading
                  ? 'Please wait...'
                  : authTab === 'signup'
                  ? 'Sign Up'
                  : 'Login'}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

interface BannerAndGamesProps {
  banners: BannerSlide[];
  promoVideoUrl?: string;
  currentUser?: UserProfile | null;
  activeIdCount?: number;
  onOpenCreateId: () => void;
  onOpenSignUp?: () => void;
  onOpenLogin?: () => void;
  onOpenProfile?: () => void;
  onOpenDeposit?: () => void;
  onOpenPromoAd?: () => void;
  onSelectGame?: (game: GameCategoryType) => void;
}

/**
 * POST-LOGIN HOMEPAGE TOP SECTION:
 * - Single Cloudinary Video Player (`dxeuzdwkz` / `Sharkexchange`) + single-line bold green strip:
 *   "Pay 500 and get 1000 instant bonus"
 * - Single Fixed Large Banner matching the provided reference image (`fixedCricketBanner`)
 * - 3-Card Action Row (`Create IDs`, `Aviatrix`, `MINES`) — Spin the Wheel and the 3 secondary
 *   green-marked cards (`Cricket Live`, `Color Prediction`, `Live Casino`) are removed.
 */
export const BannerAndGames: React.FC<BannerAndGamesProps> = ({
  promoVideoUrl,
  onOpenCreateId,
  onSelectGame,
}) => {
  return (
    <div className="space-y-3.5">
      {/* 1. CLOUDINARY VIDEO PLAYER + BOLD GREEN STRIP */}
      <CloudinaryPromoVideoSection videoUrl={promoVideoUrl} />

      {/* 2. SINGLE FIXED LARGE BANNER MATCHING REFERENCE IMAGE */}
      <section
        aria-label="Featured Cricket Banner"
        data-testid="postlogin-fixed-large-banner"
        className="relative rounded-3xl overflow-hidden border-2 border-[#facc15]/60 bg-black shadow-[0_12px_34px_rgba(0,0,0,0.7)] select-none"
      >
        <img
          src={OFFICIAL_POSTER_ASSETS.fixedCricketBanner}
          alt="SharkX Featured Cricket Banner"
          data-testid="fixed-reference-banner-img"
          referrerPolicy="no-referrer"
          onClick={onOpenCreateId}
          className="w-full max-h-[340px] object-contain mx-auto block cursor-pointer"
        />
      </section>

      {/* 3. PRIMARY ACTION & GAMES ROW: [Create IDs | Aviatrix | MINES] */}
      <section aria-label="Create IDs and Featured Games">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 items-stretch">
          {/* 1. Left Bright Yellow Pill/Card Button: "Create IDs" */}
          <button
            type="button"
            data-testid="row-create-ids-active-btn"
            onClick={onOpenCreateId}
            className="h-[74px] sm:h-[96px] rounded-2xl bg-[#facc15] hover:bg-[#eab308] text-[#090d16] font-extrabold text-sm sm:text-xl md:text-2xl tracking-tight shadow-[0_6px_20px_rgba(250,204,21,0.3)] flex items-center justify-center px-2 transition-transform active:scale-95 cursor-pointer border-2 border-yellow-300"
          >
            Create IDs
          </button>

          {/* 2. Middle Feature Game Card: "Aviatrix" */}
          <div
            data-testid="dummy-card-aviatrix"
            role="button"
            tabIndex={0}
            onClick={() => onSelectGame?.('aviatrix')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectGame?.('aviatrix');
            }}
            className="relative h-[74px] sm:h-[96px] rounded-2xl overflow-hidden border-2 border-indigo-500/40 hover:border-[#facc15] shadow-lg bg-gradient-to-r from-[#12073b] via-[#1d1160] to-[#0a2463] flex items-center justify-between px-3 sm:px-5 select-none cursor-pointer transition-transform active:scale-98"
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

          {/* 3. Right Feature Game Card: "MINES" */}
          <div
            data-testid="dummy-card-mines"
            role="button"
            tabIndex={0}
            onClick={() => onSelectGame?.('mines')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectGame?.('mines');
            }}
            className="relative h-[74px] sm:h-[96px] rounded-2xl overflow-hidden border-2 border-red-500/40 hover:border-[#facc15] shadow-lg bg-gradient-to-r from-[#7f1d1d] via-[#dc2626] to-[#991b1b] flex items-center justify-between px-3 sm:px-5 select-none cursor-pointer transition-transform active:scale-98"
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
      </section>
    </div>
  );
};

