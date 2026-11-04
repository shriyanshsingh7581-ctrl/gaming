import React, { useState, useEffect } from 'react';
import {
  BannerSlide,
  UserProfile,
  OFFICIAL_POSTER_ASSETS,
} from '../utils/exchangeLogic';
import {
  registerCustomerWithEmail,
  loginCustomerWithEmail,
  loginWithGoogleFirebase,
} from '../firebase';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  Zap,
  Play,
  UserPlus,
  LogIn,
  Crown,
  Sparkles,
  Mail,
  Lock,
  Phone,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';

export type GameCategoryType =
  | 'aviatrix'
  | 'mines'
  | 'cricket'
  | 'color'
  | 'casino';

interface PreLoginLandingPageProps {
  banners: BannerSlide[];
  onOpenSignUpModal: () => void;
  onOpenLoginModal: () => void;
  onAuthSuccess: (user: UserProfile, message: string) => void;
}

/**
 * PAGE 1: PRE-LOGIN PROMOTIONAL LANDING & AUTH PAGE (WHEN USER IS LOGGED OUT):
 * - Completely removes the old hero/heroine celebrity photos ("GOLDEN CASINO DIVA", "EMPRESS CLUB", etc.).
 * - At the very top of the Pre-Login Front Page, prominently displays and highlights the attached
 *   "SHARK EXCHANGE — MEGA OFFER: ₹500 की ID पर ₹500 FREE! (Deposit ₹500 & Get ₹500 Instant Welcome Bonus Free)"
 *   poster in full HD, mobile-responsive layout.
 * - Directly below this highlighted Mega Offer poster on the front page, shows ONLY the "Sign Up" and "Login" buttons & form.
 */
export const PreLoginLandingPage: React.FC<PreLoginLandingPageProps> = ({
  banners,
  onOpenSignUpModal,
  onOpenLoginModal,
  onAuthSuccess,
}) => {
  const [authTab, setAuthTab] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const frontMegaOfferBanner = banners[0];
  const megaOfferPosterUrl =
    frontMegaOfferBanner?.imageUrl || OFFICIAL_POSTER_ASSETS.megaOffer500Poster;

  const mainOfferHeadline =
    frontMegaOfferBanner?.title ||
    '🔥 SHARK EXCHANGE — MEGA OFFER: ₹500 की ID पर ₹500 FREE! 🔥';
  const subOfferHeadline =
    frontMegaOfferBanner?.subtitle ||
    'Deposit ₹500 & Get ₹500 Instant Welcome Bonus Free | 24/7 Instant Refill & Withdrawal';

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (authTab === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (phone.replace(/\D/g, '').length < 10) {
          throw new Error('Please enter a valid 10-digit WhatsApp/Mobile number.');
        }
        if (password.length < 4) {
          throw new Error('Password must be at least 4 characters.');
        }
        const profile = await registerCustomerWithEmail(name, phone, email, password);
        onAuthSuccess(profile, `Welcome to SHARK EXCH, ${profile.name}!`);
      } else {
        const profile = await loginCustomerWithEmail(email, password);
        onAuthSuccess(profile, `Welcome back, ${profile.name}!`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const profile = await loginWithGoogleFirebase(phone);
      onAuthSuccess(profile, `Signed in with Google as ${profile.name}!`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      data-testid="page-1-prelogin-landing"
      className="min-h-screen bg-[#070a10] text-white flex flex-col pb-12"
    >
      {/* Minimal Brand Top Bar (No Wallet Balance Header, No Deposit/Withdraw Buttons) */}
      <header className="bg-[#090d16] border-b border-white/10 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-shark italic font-black text-lg sm:text-2xl tracking-wider flex items-center gap-1">
            <span className="text-white">SHARK</span>
            <span className="text-[#facc15]">EXCH</span>
          </span>
          <span className="hidden sm:inline-block text-xs text-slate-400">
            · Official VIP Gaming Exchange
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAuthTab('signup');
              onOpenSignUpModal();
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs tracking-wide cursor-pointer"
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab('login');
              onOpenLoginModal();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#facc15] hover:bg-[#eab308] text-black font-extrabold text-xs tracking-wide cursor-pointer"
          >
            Login
          </button>
          <span className="px-2 py-1 rounded border border-white/20 text-[11px] font-bold text-white/90 tracking-wider uppercase">
            EN
          </span>
        </div>
      </header>

      {/* Main Pre-Login Front Page Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 pt-4 space-y-5">
        {/* 1. HIGHLIGHTED FULL-HD "SHARK EXCHANGE — MEGA OFFER: ₹500 की ID पर ₹500 FREE!" POSTER */}
        <section
          aria-label="Promotional Offers"
          data-testid="front-hero-promo-banner"
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#20031e] via-[#0c071b] to-[#26051c] border-[3px] border-[#facc15] shadow-[0_0_48px_rgba(250,204,21,0.5)]"
        >
          {/* Ambient Gold & Neon Magenta Spotlight */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,0.28),transparent_65%),radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.25),transparent_60%)] pointer-events-none" />

          <div className="relative p-2.5 sm:p-4 space-y-3">
            {/* Top Brand & Highlighted Bonus Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 border border-[#facc15]/70 shadow">
                <Crown className="w-3.5 h-3.5 text-[#facc15]" />
                <span className="font-shark italic font-black text-xs sm:text-sm text-white tracking-wider">
                  SHARK <span className="text-[#facc15]">EXCHANGE</span>
                </span>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#facc15] via-yellow-300 to-[#eab308] text-black font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(250,204,21,0.75)] border border-white">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>MEGA OFFER · ₹500 की ID पर ₹500 FREE!</span>
              </span>
            </div>

            {/* Full-HD Uncropped Responsive Poster Image */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#facc15]/80 bg-[#090514] shadow-[0_0_32px_rgba(236,72,153,0.4)] select-none">
              <img
                src={megaOfferPosterUrl}
                alt="SHARK EXCHANGE MEGA OFFER: ₹500 की ID पर ₹500 FREE!"
                data-testid="prelogin-mega-offer-poster-img"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-contain block"
              />
            </div>

            {/* Highlighted Offer Callout Bar Directly Under Poster */}
            <div className="relative rounded-2xl bg-gradient-to-r from-[#1c0414] via-[#2b0822] to-[#1c0414] border-2 border-[#facc15] px-3.5 py-3 sm:px-5 sm:py-3.5 text-center shadow-[0_0_28px_rgba(250,204,21,0.45)] space-y-2">
              <h2
                data-testid="hero-mega-offer-headline"
                className="font-black text-base sm:text-2xl text-[#facc15] drop-shadow-[0_2px_10px_rgba(250,204,21,0.65)] tracking-tight leading-snug"
              >
                {mainOfferHeadline}
              </h2>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-[#facc15] via-yellow-300 to-[#eab308] text-black font-black text-xs sm:text-base tracking-wide shadow border border-white flex items-center gap-1.5">
                  <span>💸 ₹500 की ID पर</span>
                  <span className="px-2 py-0.5 rounded-md bg-black text-[#facc15] font-extrabold">
                    ₹500 FREE!
                  </span>
                </div>

                <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-extrabold text-xs sm:text-sm tracking-wide">
                  Pay ₹500 ➔ Get ₹1,000 Instant ID
                </div>
              </div>

              <p
                data-testid="hero-mega-offer-subheadline"
                className="text-xs sm:text-sm font-bold text-white/95"
              >
                {subOfferHeadline}
              </p>
            </div>
          </div>
        </section>

        {/* 2. DIRECTLY BELOW PROMO POSTER ON PAGE 1: ONLY "SIGN UP" AND "LOGIN" BUTTONS & FORM */}
        <div
          aria-label="Primary Hero Actions"
          data-testid="hero-below-cta-bar"
          className="grid grid-cols-2 gap-3"
        >
          <button
            type="button"
            data-testid="hero-cta-signup"
            onClick={() => setAuthTab('signup')}
            className={`py-3.5 px-4 rounded-2xl font-extrabold text-sm sm:text-base tracking-wide uppercase shadow-lg border-2 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 ${
              authTab === 'signup'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-200 shadow-[0_0_24px_rgba(16,185,129,0.45)]'
                : 'bg-[#11192c] hover:bg-[#192540] text-emerald-400 border-emerald-500/40'
            }`}
          >
            <UserPlus className="w-5 h-5 stroke-[2.5]" />
            <span>Sign Up</span>
          </button>

          <button
            type="button"
            data-testid="hero-cta-login"
            onClick={() => setAuthTab('login')}
            className={`py-3.5 px-4 rounded-2xl font-extrabold text-sm sm:text-base tracking-wide uppercase shadow-lg border-2 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 ${
              authTab === 'login'
                ? 'bg-[#facc15] hover:bg-[#eab308] text-black border-yellow-200 shadow-[0_0_24px_rgba(250,204,21,0.45)]'
                : 'bg-[#131c2e] hover:bg-[#1b2740] text-[#facc15] border-[#facc15]/60'
            }`}
          >
            <LogIn className="w-5 h-5 stroke-[2.5]" />
            <span>Login</span>
          </button>
        </div>

        {/* Embedded Sign Up & Login Card right below the buttons so Customer immediately enters Page 2 upon completion */}
        <section
          aria-label="Customer Sign Up and Login Form"
          data-testid="page-1-auth-card"
          className="rounded-3xl bg-[#090d16] border-2 border-[#facc15]/50 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden max-w-xl mx-auto"
        >
          <div className="bg-gradient-to-r from-[#facc15] via-amber-400 to-[#eab308] px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-black" />
              <h3 className="font-shark italic font-black text-base sm:text-lg text-black tracking-wide uppercase">
                {authTab === 'signup'
                  ? 'CREATE YOUR VIP ACCOUNT (SIGN UP)'
                  : 'LOGIN TO SHARK EXCH DASHBOARD'}
              </h3>
            </div>
            <span className="text-[11px] font-extrabold text-black/80 uppercase">
              Instant Access
            </span>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* 1-Click Google Firebase Authentication */}
            <button
              type="button"
              data-testid="landing-google-auth-btn"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md border border-slate-200 transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.9 7.4 24 12 24z"
                />
              </svg>
              <span>
                {googleLoading
                  ? 'Connecting to Google...'
                  : 'Continue with Google (Instant Login)'}
              </span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#090d16] px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                Or with Email &amp; Password
              </span>
              <div className="border-t border-white/10 w-full" />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authTab === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#131c2e] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      WhatsApp / Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#131c2e] border border-white/15 text-white text-sm font-mono-tabular focus:outline-none focus:border-[#facc15]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#131c2e] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#131c2e] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-black font-extrabold text-sm tracking-wide shadow-lg transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {loading
                  ? 'Please wait...'
                  : authTab === 'signup'
                  ? 'Sign Up & Enter SHARK EXCH Dashboard'
                  : 'Login & Enter SHARK EXCH Dashboard'}
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
 * PAGE 2 (POST-LOGIN MAIN WALLET & EXCHANGE DASHBOARD):
 * Displays the 4 attached promotional posters inside the Post-Login Wallet Dashboard section:
 *  - Poster 1: "Sexy VIP LIVE LOUNGE — SHARKVIP #PLAYSAFE"
 *  - Poster 2: "SHARK EXCHANGE — Ultimate Gaming Destination: PLAY • BET • WIN"
 *  - Poster 3: "SHARK EXCHANGE — Game. Win. Repeat. Experience Next-Level Online Gaming"
 *  - Poster 4: "SHARK EXCHANGE — DIVE INTO REAL GAMING ACTION"
 * Followed by the clickable yellow "Create IDs" button and non-clickable static dummy game cards.
 */
export const BannerAndGames: React.FC<BannerAndGamesProps> = ({
  banners,
  onOpenCreateId,
}) => {
  const postLoginPosters = [
    {
      id: 'poster-1',
      title: banners[1]?.title || 'Sexy VIP LIVE LOUNGE — SHARKVIP #PLAYSAFE',
      tag: banners[1]?.tag || 'SHARKVIP #PLAYSAFE',
      imageUrl:
        banners[1]?.imageUrl || OFFICIAL_POSTER_ASSETS.sexyVipLoungePoster,
    },
    {
      id: 'poster-2',
      title:
        banners[2]?.title ||
        'SHARK EXCHANGE — Ultimate Gaming Destination: PLAY • BET • WIN',
      tag: banners[2]?.tag || 'PLAY • BET • WIN',
      imageUrl: banners[2]?.imageUrl || OFFICIAL_POSTER_ASSETS.playBetWinPoster,
    },
    {
      id: 'poster-3',
      title:
        banners[3]?.title ||
        'SHARK EXCHANGE — Game. Win. Repeat. Experience Next-Level Online Gaming',
      tag: banners[3]?.tag || 'GAME • WIN • REPEAT',
      imageUrl:
        banners[3]?.imageUrl || OFFICIAL_POSTER_ASSETS.gameWinRepeatPoster,
    },
    {
      id: 'poster-4',
      title:
        banners[4]?.title || 'SHARK EXCHANGE — DIVE INTO REAL GAMING ACTION',
      tag: banners[4]?.tag || 'REAL GAMING ACTION',
      imageUrl:
        banners[4]?.imageUrl || OFFICIAL_POSTER_ASSETS.diveIntoActionPoster,
    },
  ];

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % postLoginPosters.length);
    }, 4800);
    return () => clearInterval(timer);
  }, [postLoginPosters.length]);

  const currentPoster = postLoginPosters[activeSlide] || postLoginPosters[0];

  return (
    <div className="space-y-3.5">
      {/* 1. POST-LOGIN INTERACTIVE AUTO-SLIDING 4-POSTER BANNER CAROUSEL & SHOWCASE */}
      <section
        aria-label="Sexy VIP Live Lounge and SHARK EXCHANGE Promotional Posters"
        data-testid="postlogin-sexy-vip-banner"
        className="relative rounded-3xl overflow-hidden border-2 border-[#facc15]/60 bg-[#090d16] shadow-[0_12px_34px_rgba(0,0,0,0.7)] select-none"
      >
        {/* Main Active Poster Display */}
        <div className="relative">
          <img
            src={currentPoster.imageUrl}
            alt={currentPoster.title}
            data-testid={`postlogin-active-poster-${activeSlide + 1}`}
            referrerPolicy="no-referrer"
            onClick={onOpenCreateId}
            className="w-full h-auto object-contain block cursor-pointer"
          />

          {/* Left Carousel Arrow */}
          <button
            type="button"
            onClick={() =>
              setActiveSlide(
                (prev) =>
                  (prev - 1 + postLoginPosters.length) % postLoginPosters.length
              )
            }
            aria-label="Previous Banner Slide"
            className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border border-[#facc15]/50 shadow-lg cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#facc15]" />
          </button>

          {/* Right Carousel Arrow */}
          <button
            type="button"
            onClick={() =>
              setActiveSlide((prev) => (prev + 1) % postLoginPosters.length)
            }
            aria-label="Next Banner Slide"
            className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border border-[#facc15]/50 shadow-lg cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#facc15]" />
          </button>

          {/* Static SHARKVIP #PLAYSAFE Badge Reference for Tests & Visual Identity */}
          <div
            data-testid="sharkvip-static-badge"
            className="hidden sm:inline-flex items-center gap-1.5 absolute top-3 right-3 border border-white/70 rounded-full px-3 py-1 bg-black/75 shadow select-none cursor-default"
          >
            <span className="font-shark font-black text-xs text-white">
              SHARK<span className="text-[#facc15]">VIP</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-500 text-white font-extrabold text-[9px] uppercase">
              {currentPoster.tag}
            </span>
          </div>
        </div>

        {/* Bottom 4-Poster Interactive Thumbnail Showcase & Slide Indicators */}
        <div className="p-2.5 sm:p-3 bg-gradient-to-r from-[#090d16] via-[#121a2d] to-[#090d16] border-t border-white/10 space-y-2">
          <div
            data-testid="postlogin-4-posters-grid"
            className="grid grid-cols-4 gap-2"
          >
            {postLoginPosters.map((poster, idx) => {
              const isSelected = idx === activeSlide;
              return (
                <button
                  key={poster.id}
                  type="button"
                  data-testid={`postlogin-poster-thumb-${idx + 1}`}
                  onClick={() => setActiveSlide(idx)}
                  className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#facc15] shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-[1.02]'
                      : 'border-white/15 opacity-75 hover:opacity-100 hover:border-white/40'
                  }`}
                >
                  <img
                    src={poster.imageUrl}
                    alt={poster.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-12 sm:h-16 object-cover object-center block"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/80 px-1 py-0.5 text-[8px] sm:text-[9px] font-extrabold text-[#facc15] truncate text-center uppercase">
                    {poster.tag}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2">
            {postLoginPosters.map((poster, idx) => (
              <button
                key={`vip-slider-dot-${poster.id}`}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={`Banner slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  activeSlide === idx
                    ? 'w-8 bg-[#facc15]'
                    : 'w-4 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. ACTION & GAME CARDS ROW:
          ONLY "Create IDs" IS CLICKABLE; ALL GAME CARDS ("Aviatrix", "MINES", "Cricket Live", "Color Prediction", "Live Casino") ARE STATIC NON-CLICKABLE DUMMY CARDS */}
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
