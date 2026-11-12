import React, { useState, useEffect, useRef } from 'react';
import {
  BannerSlide,
  UserProfile,
  OFFICIAL_POSTER_ASSETS,
  DEFAULT_CLOUDINARY_PROMO_VIDEO_URL,
  LOCAL_OFFICIAL_PROMO_VIDEO_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  PROMO_GREEN_STRIP_TEXT,
  toPlayableCloudinaryVideoUrl,
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
 * Reusable Cloudinary Single Video Player + Bold Green Strip Component (Used on Login & Signup Screen):
 * - Streams video via Cloudinary (Cloud Name: `dxeuzdwkz`, Upload Preset: `Sharkexchange`).
 * - NO poster attribute (`poster` is permanently removed so no poster flashes before or during video playback).
 * - Automatically normalizes any uploaded video URL (`.mov`, `.mkv`, HEVC, etc.) to playable H.264/AAC MP4.
 * - Plays continuously in a loop (`loop`) with Audio Automatically ON (`muted = false`, `volume = 1.0`).
 * - Under the video, displays a single-line, bold green strip (zoomed/prominent, no line-break)
 *   with the exact text: "Pay 500 and get 1000 instant bonus"
 */
export const CloudinaryPromoVideoSection: React.FC<{
  videoUrl?: string;
  orientation?: 'landscape' | 'portrait';
}> = ({ videoUrl, orientation = 'landscape' }) => {
  const isPortrait = orientation === 'portrait';
  const normalizedUrl = toPlayableCloudinaryVideoUrl(
    videoUrl || DEFAULT_CLOUDINARY_PROMO_VIDEO_URL
  );
  const [resolvedSrc, setResolvedSrc] = useState<string>(normalizedUrl);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setResolvedSrc(
      toPlayableCloudinaryVideoUrl(videoUrl || DEFAULT_CLOUDINARY_PROMO_VIDEO_URL)
    );
  }, [videoUrl]);

  // Permanently play unmuted with full 100% audio on loop
  const startPlaybackWithAudio = async (v: HTMLVideoElement | null) => {
    if (!v) return;
    v.loop = true;
    v.defaultMuted = false;
    v.muted = false;
    v.volume = 1.0;

    try {
      await v.play();
    } catch {
      // If browser cold start temporarily blocks unmuted audio before user interaction,
      // start muted so video is playing smoothly, and unlock sound permanently on ANY gesture.
      try {
        v.muted = true;
        await v.play();
      } catch {
        // Retry on canplay / loadeddata
      }
    }
  };

  const forceUnmutePermanently = () => {
    const v = videoRef.current;
    if (!v) return;
    v.defaultMuted = false;
    v.muted = false;
    v.volume = 1.0;
    v.loop = true;
    if (v.paused) {
      void v.play().catch(() => {});
    }
  };

  useEffect(() => {
    const vid = videoRef.current;
    if (vid) {
      void startPlaybackWithAudio(vid);
    }

    // Universal gesture unlock: listening on window & document across all modern pointer/touch/scroll events
    // Any gesture anywhere immediately guarantees sound is ON and unmuted permanently.
    const triggerAudioUnlock = () => {
      forceUnmutePermanently();
    };

    const gestureEvents = [
      'pointerdown',
      'touchstart',
      'touchend',
      'click',
      'mousedown',
      'keydown',
      'scroll',
      'wheel',
    ] as const;

    gestureEvents.forEach((evt) => {
      window.addEventListener(evt, triggerAudioUnlock, { capture: true, passive: true });
      document.addEventListener(evt, triggerAudioUnlock, { capture: true, passive: true });
    });

    return () => {
      gestureEvents.forEach((evt) => {
        window.removeEventListener(evt, triggerAudioUnlock, { capture: true });
        document.removeEventListener(evt, triggerAudioUnlock, { capture: true });
      });
    };
  }, [resolvedSrc]);

  return (
    <div className="w-full space-y-3.5 pt-1.5 sm:pt-2">
      {/* 1. Video Container (Landscape 16:9 banner or Portrait full-page view) - Clean without mute/unmute buttons */}
      <section
        aria-label="Promotional Video"
        data-testid="cloudinary-video-section"
        data-cloudinary-cloud-name={CLOUDINARY_CLOUD_NAME}
        data-cloudinary-upload-preset={CLOUDINARY_UPLOAD_PRESET}
        className={`w-full rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#facc15]/80 bg-[#050811] shadow-[0_10px_32px_rgba(0,0,0,0.7)] transition-all ${
          isPortrait
            ? 'min-h-[500px] sm:min-h-[640px] max-h-[82vh]'
            : 'min-h-[210px] sm:min-h-[290px]'
        }`}
      >
        <div
          className={`relative w-full bg-black flex items-center justify-center cursor-pointer ${
            isPortrait
              ? 'h-[72vh] min-h-[500px] sm:min-h-[640px]'
              : 'min-h-[210px] sm:min-h-[290px]'
          }`}
          onClick={forceUnmutePermanently}
        >
          <video
            ref={videoRef}
            key={`${resolvedSrc}_${orientation}`}
            data-testid="cloudinary-promo-video"
            src={resolvedSrc}
            preload="auto"
            className={`w-full bg-black block ${
              isPortrait
                ? 'h-full object-cover sm:object-contain'
                : 'min-h-[210px] sm:min-h-[290px] max-h-[300px] sm:max-h-[380px] object-contain'
            }`}
            autoPlay
            loop
            playsInline
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              v.defaultMuted = false;
              v.muted = false;
              v.volume = 1.0;
              v.loop = true;
            }}
            onCanPlay={(e) => {
              const v = e.currentTarget;
              if (v.paused || v.muted) {
                void startPlaybackWithAudio(v);
              }
            }}
            onVolumeChange={(e) => {
              const v = e.currentTarget;
              if (v.muted || v.volume < 1) {
                v.defaultMuted = false;
                v.muted = false;
                v.volume = 1.0;
              }
            }}
            onError={() => {
              // 1. If an uploaded mobile video needs transcoding on Cloudinary, apply H.264 + AAC
              if (
                resolvedSrc.includes('res.cloudinary.com') &&
                resolvedSrc.includes('/video/upload/') &&
                !resolvedSrc.includes('vc_h264')
              ) {
                setResolvedSrc(
                  resolvedSrc.replace(
                    '/video/upload/',
                    '/video/upload/f_mp4,vc_h264,ac_aac/'
                  )
                );
                return;
              }
              // 2. Try the primary high-speed Cloudinary CDN URL of the user's video
              if ((resolvedSrc as string) !== DEFAULT_CLOUDINARY_PROMO_VIDEO_URL) {
                setResolvedSrc(DEFAULT_CLOUDINARY_PROMO_VIDEO_URL);
                return;
              }
              // 3. Fall back to local server file path if external network is slow/offline
              if ((resolvedSrc as string) !== LOCAL_OFFICIAL_PROMO_VIDEO_URL) {
                setResolvedSrc(LOCAL_OFFICIAL_PROMO_VIDEO_URL);
              }
            }}
          />
        </div>
      </section>

      {/* 2. Separate Rounded Green Strip with gap below video */}
      <div
        data-testid="promo-green-strip"
        className="w-full rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#059669] via-[#10b981] to-[#059669] border-2 border-emerald-300 shadow-[0_6px_20px_rgba(16,185,129,0.35)] px-3 py-3 sm:py-3.5 text-center overflow-hidden"
      >
        <p className="font-black text-white text-sm sm:text-xl md:text-2xl tracking-wide whitespace-nowrap truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] scale-[1.03]">
          {PROMO_GREEN_STRIP_TEXT}
        </p>
      </div>
    </div>
  );
};

interface PreLoginLandingPageProps {
  banners: BannerSlide[];
  promoVideoUrl?: string;
  promoVideoOrientation?: 'landscape' | 'portrait';
  authPosterUrl?: string;
  onOpenSignUpModal: () => void;
  onOpenLoginModal: () => void;
  onOpenPromoAd?: () => void;
  onAuthSuccess: (user: UserProfile, message: string) => void;
}

/**
 * PRE-LOGIN LANDING & AUTH PAGE (Login & Signup Screen):
 * - Top Header includes White & Yellow SHARK / - EXCHANGE - Logo on left
 *   AND Login & Sign Up buttons on the right (marked in red circle).
 *   These buttons disappear immediately upon login.
 * - Single Cloudinary Video Player (`dxeuzdwkz` / `Sharkexchange`) looping with Audio Permanently ON.
 *   Orientation switchable between Landscape (default banner) and Portrait (full-page view) via Admin Panel.
 * - Distinct, standalone rounded green strip separated by a gap below the video.
 * - Clean Authentication Card:
 *   - Signup Form: strictly 3 fields (Mobile Number, Email, Password).
 *   - Login Form: strictly 2 fields (Email, Password).
 */
export const PreLoginLandingPage: React.FC<PreLoginLandingPageProps> = ({
  promoVideoUrl,
  promoVideoOrientation = 'landscape',
  onAuthSuccess,
}) => {
  const [authTab, setAuthTab] = useState<'signup' | 'login'>('signup');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authCardRef = useRef<HTMLDivElement | null>(null);

  const scrollToAuthCard = (tab: 'signup' | 'login') => {
    setAuthTab(tab);
    authCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
          `🎉 Welcome ${profile.name}! Your account has been registered successfully.`
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
      {/* Top Black Header Bar: Logo on left + Sign Up and Login buttons on right (Disappear once logged in) */}
      <header
        data-testid="prelogin-header"
        className="bg-[#070a10] border-b border-white/10 px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-2 sticky top-0 z-30"
      >
        <SharkXLogo size="sm" />

        {/* User-requested Header Auth Buttons in red-circled area */}
        <div
          data-testid="header-auth-buttons"
          className="flex items-center gap-2"
        >
          <button
            type="button"
            data-testid="header-btn-signup"
            onClick={() => scrollToAuthCard('signup')}
            className="px-3 sm:px-4 py-1.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs tracking-wide flex items-center gap-1.5 cursor-pointer shadow transition-transform active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
          <button
            type="button"
            data-testid="header-btn-login"
            onClick={() => scrollToAuthCard('login')}
            className="px-3 sm:px-4 py-1.5 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs tracking-wide flex items-center gap-1.5 cursor-pointer shadow transition-transform active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
        </div>
      </header>

      {/* Main Pre-Login Front Page Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-4 space-y-6">
        {/* 1. CLOUDINARY LOOP VIDEO ONLY (NO POSTER, AUDIO ON, PORTRAIT/LANDSCAPE OPTIMIZED) + ROUNDED GREEN STRIP WITH GAP */}
        <CloudinaryPromoVideoSection
          videoUrl={promoVideoUrl}
          orientation={promoVideoOrientation}
        />

        {/* 2. SIGNUP / LOGIN TAB BUTTONS */}
        <div
          aria-label="Primary Hero Actions"
          data-testid="hero-below-cta-bar"
          className="grid grid-cols-2 gap-3 pt-1"
        >
          <button
            type="button"
            data-testid="hero-cta-signup"
            onClick={() => scrollToAuthCard('signup')}
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
            onClick={() => scrollToAuthCard('login')}
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
        <div ref={authCardRef}>
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
        </div>
      </main>
    </div>
  );
};

interface BannerAndGamesProps {
  banners: BannerSlide[];
  homePosterUrl?: string;
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
 * POST-LOGIN HOMEPAGE TOP SECTION (Home Screen):
 * - NO video on Home Screen.
 * - Single Permanent Full-View Home Screen Poster (`homePosterUrl || permanentThreeGirlsPoster`) right in 1st position
 *   (full poster visible on mobile screens without any cropping, changeable via Admin Panel Cloudinary upload).
 * - 3-Card Action Row (`Create IDs`, `Aviatrix`, `MINES`).
 */
export const BannerAndGames: React.FC<BannerAndGamesProps> = ({
  homePosterUrl,
}) => {
  const activeHomePoster =
    homePosterUrl || OFFICIAL_POSTER_ASSETS.permanentThreeGirlsPoster;

  return (
    <div className="space-y-3.5">
      {/* 1. SINGLE PERMANENT FULL-VIEW HOME SCREEN POSTER (First & Only Poster — No Video on Home Screen) */}
      <section
        aria-label="Featured VIP Lounge Poster"
        data-testid="postlogin-fixed-large-banner"
        className="relative w-full rounded-xl overflow-hidden border border-[#f6bd20]/60 bg-[#090d16] shadow-[0_10px_28px_rgba(0,0,0,0.75)] select-none"
      >
        <img
          src={activeHomePoster}
          alt="Shark Exchange VIP Live Lounge"
          data-testid="fixed-reference-banner-img"
          referrerPolicy="no-referrer"
          className="w-full h-auto object-contain block"
        />
      </section>

      {/* 2. DUMMY BUTTON GROUP: [Create IDs | Aviatrix | MINES] (Non-interactive display group — opens nothing on click) */}
      <section
        aria-label="Create IDs and Featured Games Dummy Group"
        data-testid="dummy-action-games-group"
      >
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 items-stretch select-none">
          {/* 1. Left Bright Yellow Dummy Button: "Create IDs" */}
          <button
            type="button"
            data-testid="row-create-ids-dummy-btn"
            onClick={(e) => e.preventDefault()}
            className="h-[74px] sm:h-[96px] rounded-2xl bg-[#facc15] text-[#090d16] font-extrabold text-sm sm:text-xl md:text-2xl tracking-tight shadow-[0_6px_20px_rgba(250,204,21,0.3)] flex items-center justify-center px-2 border-2 border-yellow-300 cursor-default"
          >
            Create IDs
          </button>

          {/* 2. Middle Dummy Card: "Aviatrix" */}
          <button
            type="button"
            data-testid="dummy-card-aviatrix"
            onClick={(e) => e.preventDefault()}
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
          </button>

          {/* 3. Right Dummy Card: "MINES" */}
          <button
            type="button"
            data-testid="dummy-card-mines"
            onClick={(e) => e.preventDefault()}
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
          </button>
        </div>
      </section>
    </div>
  );
};


