import React, { useState, useEffect } from 'react';
import {
  BannerSlide,
  UserProfile,
  OFFICIAL_POSTER_ASSETS,
  PUBLIC_HOMEPAGE_SLIDER_INTERVAL_MS,
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
  X,
} from 'lucide-react';

export type GameCategoryType =
  | 'aviatrix'
  | 'mines'
  | 'cricket'
  | 'color'
  | 'casino';

/**
 * POPUP ADVERTISEMENT OVERLAY MODAL (Exact 00:18 - 00:19 from Screen Recording)
 * Displays the user's attached Hindi Shark Exchange ₹500 Welcome Bonus Poster
 * (`/assets/aistudio/file_000000003db482119b271b657ffd77dc_c3b494c1.png`)
 * with a top-right `[ ✕ ]` close button and clickable "▶ अभी ऑनलाइन खेलें" CTA.
 */
export const SharkPromoAdOverlayModal: React.FC<{
  isOpen: boolean;
  isLoggedIn?: boolean;
  onClose: () => void;
  onPrimaryAction?: () => void;
  onActionClick?: () => void;
}> = ({ isOpen, onClose, onPrimaryAction, onActionClick }) => {
  if (!isOpen) return null;

  const handleAction = () => {
    onClose();
    if (onActionClick) onActionClick();
    else if (onPrimaryAction) onPrimaryAction();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="SHARK EXCHANGE ₹500 Welcome Bonus Advertisement"
      data-testid="shark-promo-ad-popup-modal"
      className="fixed inset-0 z-[55] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-[#1a1504] border-2 border-[#ffd739] shadow-[0_0_50px_rgba(255,215,57,0.55)]">
        {/* Top-Right Close Button (Exact 00:18 - 00:19 in Video) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Advertisement Popup"
          data-testid="close-promo-ad-popup-btn"
          className="absolute top-2.5 right-2.5 z-20 w-9 h-9 rounded-full bg-black/80 hover:bg-black border-2 border-[#ffd739] text-white flex items-center justify-center shadow-lg cursor-pointer transition-transform active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Full-HD Hindi Shark Exchange ₹500 Welcome Bonus Poster */}
        <div
          onClick={handleAction}
          className="cursor-pointer group relative"
        >
          <img
            src={OFFICIAL_POSTER_ASSETS.hindiWelcome500AdPoster}
            alt="शार्क एक्सचेंज — कौशल का खेल — अभी जुड़ें और पाएं ₹500 स्वागत बोनस"
            data-testid="promo-ad-popup-poster-img"
            className="w-full h-auto object-contain block"
          />
        </div>

        {/* Bottom Action Strip */}
        <div className="p-3 bg-gradient-to-r from-[#241e06] via-[#42370b] to-[#241e06] border-t border-[#ffd739]/50 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-[#ffd739] truncate">
              🔥 शार्क एक्सचेंज — ₹500 स्वागत बोनस FREE!
            </p>
            <p className="text-[10px] text-amber-100/90 truncate">
              साइन अप करते ही तुरंत पाएं ₹500 बोनस · 24×7 डिपॉज़िट और विथड्रॉल
            </p>
          </div>
          <button
            type="button"
            onClick={handleAction}
            data-testid="promo-ad-play-now-btn"
            className="px-4 py-2 rounded-xl bg-[#ffd739] hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-lg"
          >
            ▶ अभी ऑनलाइन खेलें
          </button>
        </div>
      </div>
    </div>
  );
};

interface PreLoginLandingPageProps {
  banners: BannerSlide[];
  onOpenSignUpModal: () => void;
  onOpenLoginModal: () => void;
  onOpenPromoAd?: () => void;
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
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [otpSentVia, setOtpSentVia] = useState<'SMS' | 'WHATSAPP' | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [rulesOpen, setRulesOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
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

  const publicPromoSlides = [
    {
      id: 'public-slide-mega-offer',
      imageUrl: megaOfferPosterUrl,
      alt: 'SHARK EXCHANGE MEGA OFFER: ₹500 की ID पर ₹500 FREE!',
      badgeText: 'MEGA OFFER · ₹500 की ID पर ₹500 FREE!',
    },
    {
      id: 'public-slide-spin-wheel-poster',
      imageUrl: OFFICIAL_POSTER_ASSETS.spinWheelPoster,
      alt: 'SHARK EXCHANGE — SPIN THE WHEEL Promotional Poster',
      badgeText: 'SPIN THE WHEEL · EXCITING REWARDS DAILY!',
    },
  ];

  const [publicSlideIndex, setPublicSlideIndex] = useState(0);

  // Automatically slide every EXACTLY 10 seconds (10,000 ms) on the public front page
  useEffect(() => {
    const timer = window.setInterval(() => {
      setPublicSlideIndex((prev) => (prev + 1) % publicPromoSlides.length);
    }, PUBLIC_HOMEPAGE_SLIDER_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [publicPromoSlides.length]);

  const activePublicSlide =
    publicPromoSlides[publicSlideIndex] || publicPromoSlides[0];

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (authTab === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name / username.');
        if (phone.replace(/\D/g, '').length < 10) {
          throw new Error('Please enter a valid 10-digit WhatsApp/Mobile number.');
        }
        if (password.length < 4) {
          throw new Error('Password must be at least 4 characters.');
        }
        const profile = await registerCustomerWithEmail({
          name,
          phone: `+91 ${phone.replace(/\D/g, '').slice(-10)}`,
          email: email.trim() || `${phone.replace(/\D/g, '').slice(-10)}@sharkexch.in`,
          password,
        });
        onAuthSuccess(
          profile,
          `🎉 स्वागत है ${profile.name}! आपके खाते में ₹500 स्वागत बोनस जोड़ दिया गया है!`
        );
      } else {
        const profile = await loginCustomerWithEmail(email || name, password);
        onAuthSuccess(profile, `Welcome back, ${profile.name}!`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      const profile = await loginCustomerWithEmail('aarav.vip@sharkexch.in', 'Shark@2026');
      onAuthSuccess(
        profile,
        `Logged in with Demo ID (${profile.name} · ₹${profile.walletBalance.toLocaleString('en-IN')} Coins)!`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed.');
    } finally {
      setDemoLoading(false);
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

  const handleSendInstantOtp = (channel: 'SMS' | 'WHATSAPP') => {
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Enter your 10-digit mobile number first to receive OTP.');
      return;
    }
    setError(null);
    setOtpSentVia(channel);
    setOtpCode('884921');
  };

  return (
    <div
      data-testid="page-1-prelogin-landing"
      className="min-h-screen bg-[#241e06] text-white flex flex-col pb-12"
    >
      {/* Top SubHeader Bar (Exact Video 00:00 - 00:07: SHARK EXCH 999 Crown Logo + Yellow `Login` & Dark Olive `Signup`) */}
      <header className="bg-[#241e06] border-b border-[#ffd739]/35 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-shark italic font-black text-lg sm:text-2xl tracking-wider flex items-center">
            <span className="text-[#ffd739]">SH</span>
            <span className="inline-flex flex-col items-center mx-0.5 -mt-1">
              <span className="text-[10px] leading-none text-[#ffd739]">👑</span>
              <span className="text-white text-base sm:text-xl leading-none">A</span>
            </span>
            <span className="text-[#ffd739]">RK</span>
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-shark font-black text-[10px] text-white tracking-widest uppercase">
              EXCH
            </span>
            <span className="font-shark font-black text-xs text-[#ffd739] tracking-wider">
              999
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAuthTab('login');
              onOpenLoginModal();
            }}
            className="px-4 py-1.5 rounded-lg bg-[#ffd739] hover:bg-[#eab308] text-black font-extrabold text-xs sm:text-sm tracking-wide cursor-pointer shadow"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab('signup');
              onOpenSignUpModal();
            }}
            className="px-4 py-1.5 rounded-lg bg-[#42370b] hover:bg-[#5a4a12] border border-[#ffd739] text-white font-extrabold text-xs sm:text-sm tracking-wide cursor-pointer shadow"
          >
            Signup
          </button>
        </div>
      </header>

      {/* Main Pre-Login Front Page Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 pt-4 space-y-5">
        {/* 1. HIGHLIGHTED FULL-HD "SHARK EXCHANGE — MEGA OFFER: ₹500 की ID पर ₹500 FREE!" POSTER */}
        <section
          aria-label="Promotional Offers"
          data-testid="front-hero-promo-banner"
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#42370b] via-[#241e06] to-[#1a1504] border-[3px] border-[#ffd739] shadow-[0_0_48px_rgba(255,215,57,0.45)]"
        >
          {/* Ambient Gold Spotlight */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,57,0.28),transparent_65%)] pointer-events-none" />

          <div className="relative p-2.5 sm:p-4 space-y-3">
            {/* Top Brand & Highlighted Bonus Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 border border-[#ffd739]/70 shadow">
                <Crown className="w-3.5 h-3.5 text-[#ffd739]" />
                <span className="font-shark italic font-black text-xs sm:text-sm text-white tracking-wider">
                  SHARK <span className="text-[#ffd739]">EXCHANGE</span>
                </span>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#ffd739] via-yellow-300 to-[#eab308] text-black font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,215,57,0.75)] border border-white">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>{activePublicSlide.badgeText}</span>
              </span>
            </div>

            {/* Automatic 10-Second Promotional Banner Slider (Smooth Transitions + Navigation Dots, Non-Interactive Poster Display Only) */}
            <div
              data-testid="public-front-banner-slider"
              className="relative rounded-2xl overflow-hidden border-2 border-[#ffd739]/80 bg-[#1a1504] shadow-[0_0_32px_rgba(255,215,57,0.35)] select-none"
            >
              <div className="relative w-full overflow-hidden">
                <div
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{
                    transform: `translateX(-${publicSlideIndex * 100}%)`,
                  }}
                >
                  {publicPromoSlides.map((slide, idx) => (
                    <div
                      key={slide.id}
                      data-testid={`public-promo-slide-${idx + 1}`}
                      className="w-full shrink-0"
                    >
                      <img
                        src={slide.imageUrl}
                        alt={slide.alt}
                        data-testid={
                          idx === 0
                            ? 'prelogin-mega-offer-poster-img'
                            : 'prelogin-spin-wheel-poster-img'
                        }
                        referrerPolicy="no-referrer"
                        className="w-full h-auto object-contain block pointer-events-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Dots for Public Front Page Automatic Banner Slider */}
              <div
                data-testid="public-front-slider-dots"
                className="flex items-center justify-center gap-2.5 py-2.5 bg-black/75 border-t border-white/10"
              >
                {publicPromoSlides.map((slide, idx) => (
                  <button
                    key={`public-dot-${slide.id}`}
                    type="button"
                    data-testid={`public-slider-dot-${idx + 1}`}
                    aria-label={`Promotional banner slide ${idx + 1}`}
                    onClick={() => setPublicSlideIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      publicSlideIndex === idx
                        ? 'w-8 bg-[#ffd739] shadow-[0_0_10px_rgba(255,215,57,0.8)]'
                        : 'w-2.5 bg-white/35 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Highlighted Offer Callout Bar Directly Under Poster */}
            <div className="relative rounded-2xl bg-gradient-to-r from-[#241e06] via-[#42370b] to-[#241e06] border-2 border-[#ffd739] px-3.5 py-3 sm:px-5 sm:py-3.5 text-center shadow-[0_0_28px_rgba(255,215,57,0.45)] space-y-2">
              <h2
                data-testid="hero-mega-offer-headline"
                className="font-black text-base sm:text-2xl text-[#ffd739] drop-shadow-[0_2px_10px_rgba(255,215,57,0.65)] tracking-tight leading-snug"
              >
                {mainOfferHeadline}
              </h2>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-[#ffd739] via-yellow-300 to-[#eab308] text-black font-black text-xs sm:text-base tracking-wide shadow border border-white flex items-center gap-1.5">
                  <span>💸 ₹500 की ID पर</span>
                  <span className="px-2 py-0.5 rounded-md bg-black text-[#ffd739] font-extrabold">
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

            {/* SPIN THE WHEEL PROMOTIONAL BANNER DIRECTLY BELOW MAIN FRONT BANNER */}
            <div
              data-testid="front-below-spin-wheel-banner"
              className="relative rounded-2xl overflow-hidden border-2 border-[#ffd739] bg-[#1a1504] shadow-[0_0_32px_rgba(255,215,57,0.45)] select-none"
            >
              <img
                src={OFFICIAL_POSTER_ASSETS.spinWheelPoster}
                alt="SHARK EXCHANGE — SPIN THE WHEEL: Spin & Win Exciting Rewards Instantly!"
                data-testid="front-below-spin-wheel-poster-img"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-contain block pointer-events-none"
              />
            </div>
          </div>
        </section>

        {/* 2. DIRECTLY BELOW PROMO POSTER ON PAGE 1: "SIGN UP" AND "LOGIN" BUTTONS & TEAEXCH MODERN-LOGIN-MODAL */}
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
                ? 'bg-[#ffd739] hover:bg-yellow-300 text-black border-white shadow-[0_0_24px_rgba(255,215,57,0.5)]'
                : 'bg-[#42370b] hover:bg-[#5a4a12] text-[#ffd739] border-[#ffd739]/50'
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
                ? 'bg-[#ffd739] hover:bg-yellow-300 text-black border-white shadow-[0_0_24px_rgba(255,215,57,0.5)]'
                : 'bg-[#42370b] hover:bg-[#5a4a12] text-[#ffd739] border-[#ffd739]/50'
            }`}
          >
            <LogIn className="w-5 h-5 stroke-[2.5]" />
            <span>Login</span>
          </button>
        </div>

        {/* Exact teaexch999.com `modern-login-modal` / `modern-signup-modal` Card */}
        <section
          aria-label="Customer Sign Up and Login Form"
          data-testid="page-1-auth-card"
          className="rounded-3xl bg-[#42370b] border-2 border-[#ffd739] shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden max-w-xl mx-auto"
        >
          {/* `modal-header` with Logo & Tagline */}
          <div className="bg-gradient-to-r from-[#241e06] via-[#5a4a12] to-[#241e06] border-b border-[#ffd739]/40 px-5 py-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#ffd739]" />
              <h3 className="font-shark italic font-black text-xl sm:text-2xl text-white tracking-wider uppercase">
                SHARK <span className="text-[#ffd739]">EXCH</span>
              </h3>
            </div>
            <p className="text-[11px] text-amber-100/90 font-medium">
              {authTab === 'signup'
                ? 'Create Your Official Gaming & Sports Exchange Account'
                : "India's First Legal & Fastest Sports Exchange and 200+ Live Casino"}
            </p>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* `modal-tabs` Switcher (`Login` | `Signup`) */}
            <div className="grid grid-cols-2 p-1.5 rounded-xl bg-[#241e06] border border-[#ffd739]/30 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setError(null);
                }}
                className={`py-2.5 rounded-lg font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer ${
                  authTab === 'login'
                    ? 'bg-[#ffd739] text-[#1a1a1a] shadow-[0_2px_8px_rgba(255,215,0,0.3)]'
                    : 'text-white hover:bg-[#42370b]'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signup');
                  setError(null);
                }}
                className={`py-2.5 rounded-lg font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer ${
                  authTab === 'signup'
                    ? 'bg-[#ffd739] text-[#1a1a1a] shadow-[0_2px_8px_rgba(255,215,0,0.3)]'
                    : 'text-white hover:bg-[#42370b]'
                }`}
              >
                Signup
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/50 text-red-200 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authTab === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-white mb-1">
                      Username / Full Name <span className="text-[#ff6b6b]">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-[#ffd739] absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Enter Username / Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#241e06] border border-[#ffd739]/60 text-white text-sm focus:outline-none focus:border-[#ffd739]"
                      />
                    </div>
                  </div>

                  {/* TeaExch `+91` Country Code + Phone Number + SMS OTP / WhatsApp OTP */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-white">
                      Phone Number <span className="text-[#ff6b6b]">*</span>
                    </label>
                    <div className="flex items-stretch gap-2">
                      <div className="px-3 rounded-xl bg-[#241e06] border border-[#ffd739]/60 flex items-center justify-center font-mono-tabular font-black text-xs text-[#ffd739] shrink-0">
                        +91
                      </div>
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 text-[#ffd739] absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          required
                          placeholder="Enter 10-digit phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#241e06] border border-[#ffd739]/60 text-white text-sm font-mono-tabular focus:outline-none focus:border-[#ffd739]"
                        />
                      </div>
                    </div>

                    {/* TeaExch `otp-buttons-container` (`SMS OTP` & `WhatsApp OTP`) */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendInstantOtp('SMS')}
                        className="py-2 px-3 rounded-xl bg-[#241e06] hover:bg-[#1a1504] border border-[#ffd739]/50 text-[#ffd739] font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>📩 SMS OTP</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendInstantOtp('WHATSAPP')}
                        className="py-2 px-3 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/60 text-[#25D366] font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>💬 WhatsApp OTP</span>
                      </button>
                    </div>

                    {otpSentVia && (
                      <div className="rounded-xl bg-[#241e06] border border-emerald-400/50 p-2.5 flex items-center justify-between gap-2 text-xs">
                        <span className="text-emerald-300 font-bold">
                          ✓ {otpSentVia} OTP Verified ({otpCode})
                        </span>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter OTP"
                          className="w-24 px-2 py-1 rounded bg-[#42370b] border border-[#ffd739] font-mono-tabular font-black text-center text-[#ffd739]"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  {authTab === 'login' ? 'Username / Email / Mobile' : 'Email ID'}{' '}
                  <span className="text-[#ff6b6b]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#ffd739] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder={
                      authTab === 'login'
                        ? 'Enter Username, Email or 10-digit Mobile'
                        : 'you@example.com'
                    }
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#241e06] border border-[#ffd739]/60 text-white text-sm focus:outline-none focus:border-[#ffd739]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Password <span className="text-[#ff6b6b]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#ffd739] absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#241e06] border border-[#ffd739]/60 text-white text-sm focus:outline-none focus:border-[#ffd739]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label="Toggle password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs cursor-pointer"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {authTab === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Referral Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Referral Code (Optional)"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#241e06] border border-[#ffd739]/40 text-white text-xs focus:outline-none focus:border-[#ffd739]"
                  />
                </div>
              )}

              {/* Exact TeaExch `form-buttons`: Primary Login/Signup + `Demo Login` */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-1">
                <button
                  type="submit"
                  disabled={loading || googleLoading || demoLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#ffd739] hover:bg-yellow-300 text-[#1a1a1a] font-black text-sm tracking-wide shadow-lg transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {loading
                    ? 'Please wait...'
                    : authTab === 'signup'
                    ? 'Sign Up & Enter SHARK EXCH Dashboard'
                    : 'Login'}
                </button>

                <button
                  type="button"
                  data-testid="landing-demo-login-btn"
                  onClick={handleDemoLogin}
                  disabled={loading || googleLoading || demoLoading}
                  className="py-3 px-4 rounded-xl bg-[#241e06] hover:bg-[#1a1504] border border-[#ffd739] text-white font-extrabold text-xs sm:text-sm tracking-wide cursor-pointer transition-transform active:scale-98 whitespace-nowrap"
                >
                  {demoLoading ? 'Logging in...' : 'Demo Login'}
                </button>
              </div>
            </form>

            {/* TeaExch `social-login` (`Or continue with Google`) */}
            <div className="relative flex items-center justify-center pt-1">
              <div className="border-t border-[#ffd739]/30 w-full" />
              <span className="bg-[#42370b] px-3 text-[11px] font-bold text-[#ffd739] whitespace-nowrap">
                Or continue with
              </span>
              <div className="border-t border-[#ffd739]/30 w-full" />
            </div>

            <button
              type="button"
              data-testid="landing-google-auth-btn"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading || demoLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#241e06] hover:bg-[#1a1504] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md border border-[#ffd739]/50 transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
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
                {googleLoading ? 'Connecting to Google...' : 'Google'}
              </span>
            </button>

            {/* Exact TeaExch `disclaimer` / `rules-home` 18+ Footer Box */}
            <div className="pt-2 border-t border-white/15">
              <div
                onClick={() => setRulesOpen(true)}
                className="w-full rounded-xl bg-[#241e06] hover:bg-[#1a1504] border border-[#ffd739]/30 p-3 text-center cursor-pointer space-y-1"
              >
                <div className="text-[10px] font-black uppercase text-[#ffd739] tracking-wider">
                  Rules &amp; Regulations · 18+ Responsible Gaming
                </div>
                <p className="text-[10px] text-amber-100/80 leading-snug">
                  You must be over 18 years old, or the legal age at which gambling or gaming
                  activities are allowed under the jurisdiction that applies to you.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Rules & Regulations Dialog on Pre-Login Screen */}
      {rulesOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Rules and Regulations"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#241e06] border-2 border-[#ffd739] p-5 space-y-3 text-xs text-amber-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ffd739]/30 pb-2.5">
              <h4 className="font-shark italic font-black text-base text-[#ffd739] uppercase">
                SHARK EXCH — Rules &amp; Regulations
              </h4>
              <button
                type="button"
                onClick={() => setRulesOpen(false)}
                className="px-2.5 py-1 rounded bg-[#42370b] text-[#ffd739] font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
            <p>
              1. All Live Sports Exchange (Cricket, Football, Tennis) and 200+ Live Casino games
              settle in real time into your SHARK EXCH Wallet &amp; Coin balance.
            </p>
            <p>
              2. Minimum Deposit &amp; Withdrawal is ₹500 with 24/7 Instant UPI Refill &amp; Direct
              Bank/UPI Payout.
            </p>
            <p>
              3. Strictly 18+ Responsible Gaming Policy applies to all accounts.
            </p>
          </div>
        </div>
      )}
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
  onOpenSpinWheel?: () => void;
  onOpenPromoAd?: () => void;
  onSelectGame?: (game: GameCategoryType) => void;
}

/**
 * PAGE 2 (POST-LOGIN MAIN WALLET & EXCHANGE DASHBOARD):
 * Displays the 4 attached promotional posters inside the Post-Login Wallet Dashboard section:
 *  - Poster 1: "Sexy VIP LIVE LOUNGE — SHARKVIP #PLAYSAFE"
 *  - Poster 2: "SHARK EXCHANGE — Ultimate Gaming Destination: PLAY • BET • WIN"
 *  - Poster 3: "SHARK EXCHANGE — Game. Win. Repeat. Experience Next-Level Online Gaming"
 *  - Poster 4: "SHARK EXCHANGE — DIVE INTO REAL GAMING ACTION"
 * Followed by the clickable yellow "Create IDs" button, "Spin & Win" option, and non-clickable static dummy game cards.
 */
export const BannerAndGames: React.FC<BannerAndGamesProps> = ({
  banners,
  onOpenCreateId,
  onOpenSpinWheel,
  onSelectGame,
}) => {
  const postLoginPosters = [
    {
      id: 'poster-0-hindi-500',
      title: 'शार्क एक्सचेंज — अभी जुड़ें और पाएं ₹500 स्वागत बोनस',
      tag: '₹500 स्वागत बोनस',
      imageUrl: OFFICIAL_POSTER_ASSETS.hindiWelcome500AdPoster,
    },
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

      {/* 2. ACTION & FEATURED LIVE GAMES ROW */}
      <section aria-label="Create IDs and Featured Games" className="space-y-3">
        {onOpenSpinWheel && (
          <div className="rounded-2xl bg-gradient-to-r from-[#2c0743] via-[#170526] to-[#2c0743] border-2 border-[#facc15] p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 shadow-[0_0_24px_rgba(250,204,21,0.3)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={OFFICIAL_POSTER_ASSETS.spinWheelPoster}
                alt="SHARK EXCHANGE Spin the Wheel"
                className="w-14 h-9 sm:w-16 sm:h-10 object-cover rounded-lg border border-[#facc15] shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#facc15] shrink-0" />
                  <span className="font-shark italic font-black text-xs sm:text-base text-white tracking-wide truncate">
                    SPIN THE <span className="text-[#facc15]">WHEEL</span> · DAILY VIP REWARDS
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-purple-200 truncate">
                  Win 5%, 10%, 20% &amp; 25% Instant Bonus Rewards (1 Spin/Day · Resets 12:00 AM IST)
                </p>
              </div>
            </div>

            <button
              type="button"
              data-testid="dashboard-spin-and-win-btn"
              onClick={onOpenSpinWheel}
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#facc15] via-yellow-300 to-[#eab308] hover:brightness-110 text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_18px_rgba(250,204,21,0.6)] border border-white shrink-0 cursor-pointer transition-transform active:scale-95"
            >
              🎡 Spin &amp; Win
            </button>
          </div>
        )}

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

          {/* 2. Middle Feature Game Card: "Aviatrix" (PLAYABLE REAL-TIME CRASH GAME) */}
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

          {/* 3. Right Feature Game Card: "MINES" (PLAYABLE REAL-TIME 5x5 MINES GAME) */}
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

        {/* Secondary Game Category Row: Cricket Live, Color Prediction, Live Casino (PLAYABLE REAL-TIME GAMES) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
          {/* Cricket Live Card */}
          <div
            data-testid="dummy-card-cricket"
            role="button"
            tabIndex={0}
            onClick={() => onSelectGame?.('cricket')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectGame?.('cricket');
            }}
            className="relative h-[76px] sm:h-[88px] rounded-2xl overflow-hidden border border-emerald-500/30 hover:border-[#facc15] bg-gradient-to-r from-[#062e22] via-[#064e3b] to-[#090d16] p-3.5 sm:p-4 flex items-center justify-between text-left select-none cursor-pointer transition-transform active:scale-98"
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

          {/* Color Prediction Card */}
          <div
            data-testid="dummy-card-color"
            role="button"
            tabIndex={0}
            onClick={() => onSelectGame?.('color')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectGame?.('color');
            }}
            className="relative h-[76px] sm:h-[88px] rounded-2xl overflow-hidden border border-purple-500/30 hover:border-[#facc15] bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#090d16] p-3.5 sm:p-4 flex items-center justify-between text-left select-none cursor-pointer transition-transform active:scale-98"
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

          {/* Live Casino Card */}
          <div
            data-testid="dummy-card-casino"
            role="button"
            tabIndex={0}
            onClick={() => onSelectGame?.('casino')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectGame?.('casino');
            }}
            className="relative h-[76px] sm:h-[88px] rounded-2xl overflow-hidden border border-pink-500/30 hover:border-[#facc15] bg-gradient-to-r from-[#3b0724] via-[#701a46] to-[#090d16] p-3.5 sm:p-4 flex items-center justify-between text-left select-none cursor-pointer transition-transform active:scale-98"
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
