/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  DepositRecord,
  WithdrawalRecord,
  IdRequestRecord,
  PaymentSettings,
  BannerSlide,
  StaffMember,
  ChatThread,
  isStandaloneAdminUrl,
  isStaffLoginUrl,
  OFFICIAL_EXCHANGE_PLATFORMS,
} from './utils/exchangeLogic';
import {
  subscribeToRealtimeData,
  subscribeToAuthState,
  logoutCustomer,
  INITIAL_PAYMENT_SETTINGS,
  INITIAL_BANNERS,
  INITIAL_STAFF,
  INITIAL_CHATS,
} from './firebase';
import { SharkHeader } from './components/SharkHeader';
import {
  BannerAndGames,
  PreLoginLandingPage,
  GameCategoryType,
} from './components/BannerAndGames';
import {
  AuthModal,
  DepositModal,
  WithdrawModal,
  CreateIdModal,
  UserProfileModal,
} from './components/CustomerModals';
import { MiniGameModal } from './components/MiniGameModal';
import { AdminPanel } from './components/AdminPanel';
import { LiveChatWidget, OfficialWhatsAppLogoSvg } from './components/LiveChatWidget';
import {
  Home,
  KeyRound,
  ArrowUpCircle,
  ArrowDownCircle,
  User as UserIcon,
  Rocket,
  Bomb,
  Trophy,
  Zap,
  Flame,
  Wallet,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  // Standalone Admin or Staff Route Detection (`/admin`, `/staff`, `/?admin=true`, `/?staff=true`)
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return isStandaloneAdminUrl(
        window.location.pathname,
        window.location.search,
        window.location.hash
      );
    }
    return false;
  });

  const [initialAdminLoginMode, setInitialAdminLoginMode] = useState<'master' | 'staff'>(() => {
    if (typeof window !== 'undefined') {
      return isStaffLoginUrl(
        window.location.pathname,
        window.location.search,
        window.location.hash
      )
        ? 'staff'
        : 'master';
    }
    return 'master';
  });

  useEffect(() => {
    const syncRoute = () => {
      setIsAdminRoute(
        isStandaloneAdminUrl(
          window.location.pathname,
          window.location.search,
          window.location.hash
        )
      );
      setInitialAdminLoginMode(
        isStaffLoginUrl(
          window.location.pathname,
          window.location.search,
          window.location.hash
        )
          ? 'staff'
          : 'master'
      );
    };
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  // Real-time Firebase state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [idRequests, setIdRequests] = useState<IdRequestRecord[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(
    INITIAL_PAYMENT_SETTINGS
  );
  const [banners, setBanners] = useState<BannerSlide[]>(INITIAL_BANNERS);
  const [staffList, setStaffList] = useState<StaffMember[]>(
    Object.values(INITIAL_STAFF)
  );
  const [chatsMap, setChatsMap] = useState<Record<string, ChatThread>>(
    INITIAL_CHATS
  );

  // Modals & Interactive States
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [depositModalOpen, setDepositModalOpen] = useState<boolean>(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState<boolean>(false);
  const [createIdModalOpen, setCreateIdModalOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [selectedExchangeForModal, setSelectedExchangeForModal] = useState<string>(
    OFFICIAL_EXCHANGE_PLATFORMS[0].name
  );
  const [copiedIdKey, setCopiedIdKey] = useState<string | null>(null);
  const [liveChatOpen, setLiveChatOpen] = useState<boolean>(false);
  const [activeGame, setActiveGame] = useState<GameCategoryType | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'my-wallet' | 'live-feed'>('my-wallet');

  useEffect(() => {
    const unsubDb = subscribeToRealtimeData((snapshot) => {
      const userList = Object.entries(snapshot.users || {})
        .filter(([, u]) => Boolean(u))
        .map(([key, u]) => ({ ...u, uid: u.uid || key }))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      const depList = Object.entries(snapshot.deposits || {})
        .filter(([, d]) => Boolean(d))
        .map(([key, d]) => ({ ...d, id: d.id || key }))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      const wdrList = Object.entries(snapshot.withdrawals || {})
        .filter(([, w]) => Boolean(w))
        .map(([key, w]) => ({ ...w, id: w.id || key }))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      const idReqList = Object.entries(snapshot.idRequests || {})
        .filter(([, r]) => Boolean(r))
        .map(([key, r]) => ({ ...r, id: r.id || key }))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      const staffArr = Object.entries(snapshot.staff || INITIAL_STAFF)
        .filter(([, s]) => Boolean(s))
        .map(([key, s]) => ({ ...s, staffId: s.staffId || key }));

      setUsers(userList);
      setDeposits(depList);
      setWithdrawals(wdrList);
      setIdRequests(idReqList);
      setStaffList(staffArr);
      setChatsMap(snapshot.chats || INITIAL_CHATS);
      if (snapshot.paymentSettings) setPaymentSettings(snapshot.paymentSettings);
      if (snapshot.banners && snapshot.banners.length > 0) setBanners(snapshot.banners);
    });

    const unsubAuth = subscribeToAuthState((user) => {
      setCurrentUser(user);
    });

    return () => {
      unsubDb();
      unsubAuth();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenCreateIdForExchange = (exchangeName?: string) => {
    if (exchangeName) {
      setSelectedExchangeForModal(exchangeName);
    }
    setCreateIdModalOpen(true);
  };

  const handleCopyCredential = (value: string, key: string, label: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedIdKey(key);
    showToast(`Copied ${label}: ${value}`);
    setTimeout(() => {
      setCopiedIdKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const handleBackToLobby = () => {
    setIsAdminRoute(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
  };

  // Filter current user's personal history
  const myDeposits = currentUser
    ? deposits.filter((d) => d.uid === currentUser.uid)
    : [];
  const myWithdrawals = currentUser
    ? withdrawals.filter((w) => w.uid === currentUser.uid)
    : [];
  const myIdRequests = currentUser
    ? idRequests.filter((r) => r.uid === currentUser.uid)
    : [];

  /* ---------------- RENDER STANDALONE MASTER ADMIN OR STAFF PANEL (`/admin` or `/staff`) ---------------- */
  if (isAdminRoute) {
    return (
      <>
        {toastMessage && (
          <div
            role="status"
            className="fixed top-4 right-4 z-[60] max-w-md px-4 py-3 rounded-2xl bg-[#facc15] text-black font-bold text-xs shadow-2xl border-2 border-black"
          >
            {toastMessage}
          </div>
        )}
        <AdminPanel
          users={users}
          deposits={deposits}
          withdrawals={withdrawals}
          idRequests={idRequests}
          paymentSettings={paymentSettings}
          banners={banners}
          staffList={staffList}
          chatsMap={chatsMap}
          initialLoginMode={initialAdminLoginMode}
          onBackToLobby={handleBackToLobby}
          onNotify={showToast}
        />
      </>
    );
  }

  /* ---------------- PAGE 1: PRE-LOGIN PROMOTIONAL LANDING & AUTH PAGE (WHEN USER IS LOGGED OUT) ---------------- */
  if (!currentUser) {
    return (
      <>
        {toastMessage && (
          <div
            role="status"
            className="fixed top-14 right-4 z-[60] max-w-md px-4 py-3 rounded-2xl bg-[#facc15] text-black font-bold text-xs shadow-2xl border-2 border-black"
          >
            {toastMessage}
          </div>
        )}

        <PreLoginLandingPage
          banners={banners}
          onOpenSignUpModal={() => handleOpenAuth('signup')}
          onOpenLoginModal={() => handleOpenAuth('login')}
          onAuthSuccess={(_user, msg) => showToast(msg)}
        />

        {/* Built-in In-App Live Chat Messenger with Official WhatsApp Logo Trigger */}
        <LiveChatWidget
          currentUser={currentUser}
          chatsMap={chatsMap}
          isOpen={liveChatOpen}
          onOpenChange={setLiveChatOpen}
        />

        <AuthModal
          isOpen={authModalOpen}
          initialMode={authInitialMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(_user, msg) => showToast(msg)}
        />
      </>
    );
  }

  /* ---------------- PAGE 2: RESTORED ORIGINAL MAIN CUSTOMER DASHBOARD (IMMEDIATELY AFTER SIGN-UP / LOGIN) ---------------- */
  return (
    <div
      id="top"
      data-testid="page-2-postlogin-dashboard"
      className="min-h-screen bg-[#070a10] text-white flex flex-col pb-20 md:pb-8"
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-14 right-4 z-[60] max-w-md px-4 py-3 rounded-2xl bg-[#facc15] text-black font-bold text-xs shadow-2xl border-2 border-black"
        >
          {toastMessage}
        </div>
      )}

      {/* 1. EXACT "SHARK EXCH" TOP AUTH BAR & GOLDEN-YELLOW WALLET HEADER (Deposit ⏫ | SHARK EXCH WALLET BALANCE | Withdraw ⏬) */}
      <SharkHeader
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onOpenProfile={() => setProfileModalOpen(true)}
        onLogout={async () => {
          await logoutCustomer();
          showToast('You have been logged out.');
        }}
        onOpenDeposit={() => setDepositModalOpen(true)}
        onOpenWithdraw={() => setWithdrawModalOpen(true)}
      />

      {/* 2. ADAPTIVE DESKTOP 3-COLUMN / MOBILE FULL-WIDTH EXCHANGE LOBBY */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 pt-4 grid grid-cols-1 lg:grid-cols-[230px_1fr_320px] gap-5 items-start">
        {/* LEFT NAVIGATION SIDEBAR (Desktop >= 1024px) */}
        <aside
          aria-label="Exchange Categories Sidebar"
          className="hidden lg:flex flex-col gap-4 rounded-2xl bg-[#090d16] border border-white/10 p-4 sticky top-4"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Quick Wallet &amp; IDs
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleOpenCreateIdForExchange(OFFICIAL_EXCHANGE_PLATFORMS[0].name)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs flex items-center gap-2.5 cursor-pointer transition-transform active:scale-98"
              >
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Create Exchange IDs</span>
              </button>
              <button
                type="button"
                onClick={() => setDepositModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 font-bold text-xs flex items-center gap-2.5 cursor-pointer"
              >
                <ArrowUpCircle className="w-4 h-4 shrink-0" />
                <span>Deposit Funds (UPI)</span>
              </button>
              <button
                type="button"
                onClick={() => setWithdrawModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 font-bold text-xs flex items-center gap-2.5 cursor-pointer"
              >
                <ArrowDownCircle className="w-4 h-4 shrink-0" />
                <span>Withdraw Winnings</span>
              </button>
              <button
                type="button"
                onClick={() => setLiveChatOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] font-extrabold text-xs flex items-center gap-2.5 cursor-pointer"
              >
                <OfficialWhatsAppLogoSvg className="w-4 h-4 shrink-0 text-[#25D366]" />
                <span>24/7 Live Chat Support</span>
              </button>
            </div>
          </div>

          <div className="border-t border-white/10 pt-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Featured Exchange Games
            </p>
            <div className="space-y-1 select-none">
              <div className="w-full py-2 px-3 rounded-xl text-slate-200 font-semibold text-xs flex items-center justify-between cursor-default">
                <span className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-sky-400" />
                  <span>Aviatrix Crash</span>
                </span>
                <span className="font-mono-tabular text-[10px] text-sky-400">10,000x</span>
              </div>

              <div className="w-full py-2 px-3 rounded-xl text-slate-200 font-semibold text-xs flex items-center justify-between cursor-default">
                <span className="flex items-center gap-2">
                  <Bomb className="w-4 h-4 text-red-400" />
                  <span>MINES Turbo</span>
                </span>
                <span className="font-mono-tabular text-[10px] text-red-400">97% RTP</span>
              </div>

              <div className="w-full py-2 px-3 rounded-xl text-slate-200 font-semibold text-xs flex items-center justify-between cursor-default">
                <span className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span>Cricket Live</span>
                </span>
                <span className="font-mono-tabular text-[10px] text-emerald-400">In-Play</span>
              </div>

              <div className="w-full py-2 px-3 rounded-xl text-slate-200 font-semibold text-xs flex items-center justify-between cursor-default">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>Color Prediction</span>
                </span>
                <span className="font-mono-tabular text-[10px] text-purple-400">WinGo</span>
              </div>

              <div className="w-full py-2 px-3 rounded-xl text-slate-200 font-semibold text-xs flex items-center justify-between cursor-default">
                <span className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-pink-400" />
                  <span>Sexy Live Casino</span>
                </span>
                <span className="font-mono-tabular text-[10px] text-pink-400">VIP</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: PROMOTIONAL BANNER CAROUSEL, CREATE IDs, GAME CARDS & 6 EXCHANGE PLATFORMS */}
        <div className="space-y-5 min-w-0">
          <BannerAndGames
            banners={banners}
            currentUser={currentUser}
            activeIdCount={myIdRequests.filter((r) => r.status === 'Created').length}
            onOpenCreateId={() => handleOpenCreateIdForExchange(OFFICIAL_EXCHANGE_PLATFORMS[0].name)}
            onOpenSignUp={() => handleOpenAuth('signup')}
            onOpenLogin={() => handleOpenAuth('login')}
            onOpenProfile={() => setProfileModalOpen(true)}
            onOpenDeposit={() => setDepositModalOpen(true)}
          />

          {/* 6 Official Exchange Links Section (Replaced Old Live Exchange Markets) */}
          <section
            aria-label="Official Gaming Exchanges"
            data-testid="official-exchanges-section"
            className="rounded-2xl bg-[#090d16] border border-[#facc15]/30 overflow-hidden shadow-xl"
          >
            <div className="px-4 py-3.5 bg-gradient-to-r from-[#0c1220] via-[#131b2e] to-[#0c1220] border-b border-[#facc15]/25 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#facc15]" />
                <h2 className="font-shark italic font-black text-base sm:text-lg text-[#facc15] tracking-wide uppercase">
                  OFFICIAL EXCHANGE IDs &amp; INSTANT WITHDRAW
                </h2>
              </div>
              <span className="text-[11px] text-slate-300 font-mono-tabular">
                Instant ID Approval · 24/7 Direct Withdraw
              </span>
            </div>

            <div className="divide-y divide-white/10">
              {OFFICIAL_EXCHANGE_PLATFORMS.map((exch, exchIdx) => {
                // Find any ID requests by the logged-in customer for this exchange
                const customerExchReqs = myIdRequests.filter(
                  (r) => (r.platform || '').toLowerCase() === exch.name.toLowerCase()
                );

                return (
                  <div
                    key={`official-exch-${exch.id || exchIdx}-${exch.name}`}
                    data-testid={`exchange-row-${exch.id}`}
                    className="p-3.5 sm:px-4 hover:bg-white/[0.02] transition-colors space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-[#facc15]/15 border border-[#facc15]/40 text-[#facc15] font-mono-tabular font-black text-xs flex items-center justify-center shrink-0">
                          {exch.id}.
                        </span>
                        <div className="min-w-0">
                          <a
                            href={exch.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm sm:text-base font-extrabold text-white hover:text-[#facc15] inline-flex items-center gap-1.5 transition-colors"
                          >
                            <span>{exch.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-[#facc15]/80 shrink-0" />
                          </a>
                          <p className="text-[11px] text-slate-400">
                            Official Exchange · Instant Refill &amp; Withdrawal
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          data-testid={`exch-create-id-btn-${exch.id}`}
                          onClick={() => handleOpenCreateIdForExchange(exch.name)}
                          className="px-3.5 py-2 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-transform active:scale-95"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Create ID</span>
                        </button>

                        <button
                          type="button"
                          data-testid={`exch-withdraw-btn-${exch.id}`}
                          onClick={() => setWithdrawModalOpen(true)}
                          className="px-3.5 py-2 rounded-xl bg-[#131c2e] hover:bg-[#1b2740] border border-[#facc15]/40 text-[#facc15] font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                        >
                          <ArrowDownCircle className="w-3.5 h-3.5" />
                          <span>Withdraw</span>
                        </button>
                      </div>
                    </div>

                    {/* Display Assigned User ID & Password or Pending Status directly under the respective exchange */}
                    {customerExchReqs.length > 0 && (
                      <div className="pl-10 space-y-2">
                        {customerExchReqs.map((req, reqIdx) => (
                          <div
                            key={`exch-req-${exch.id}-${req.id || reqIdx}-${reqIdx}`}
                            data-testid={`customer-exchange-status-${req.id}`}
                            className={`p-3 rounded-xl border text-xs ${
                              req.status === 'Created' && req.assignedId
                                ? 'bg-emerald-950/30 border-emerald-500/40'
                                : 'bg-[#0c1220] border-amber-400/30'
                            }`}
                          >
                            {req.status === 'Created' && req.assignedId ? (
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase">
                                      ✅ Active Exchange ID
                                    </span>
                                    <a
                                      href={exch.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#facc15] underline font-bold inline-flex items-center gap-1"
                                    >
                                      <span>Login to {exch.name}</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 font-mono-tabular text-white pt-0.5">
                                    <span>
                                      User ID:{' '}
                                      <strong className="text-[#facc15]">
                                        {req.assignedId}
                                      </strong>
                                    </span>
                                    <span>
                                      Password:{' '}
                                      <strong className="text-emerald-300">
                                        {req.assignedPassword}
                                      </strong>
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  data-testid={`copy-id-pass-btn-${req.id}`}
                                  onClick={() =>
                                    handleCopyCredential(
                                      `Exchange: ${exch.name} | User ID: ${req.assignedId} | Password: ${req.assignedPassword}`,
                                      `exch-${req.id}`,
                                      `${exch.name} User ID & Password`
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-[11px] inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                                >
                                  {copiedIdKey === `exch-${req.id}` ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy ID &amp; Password</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center justify-between gap-2 text-amber-300">
                                <span>
                                  ⏳ ID Request Pending Approval — Username:{' '}
                                  <strong className="font-mono-tabular text-white">
                                    {req.preferredUsername}
                                  </strong>{' '}
                                  (Refill: ₹{req.depositAmount.toLocaleString('en-IN')})
                                </span>
                                <span className="text-[11px] font-bold uppercase">
                                  Verifying Payment
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT PANEL: USER WALLET HISTORY & LIVE TRANSACTIONS */}
        <aside
          id="wallet-history-section"
          aria-label="Wallet Activity and Live Transactions"
          className="rounded-2xl bg-[#090d16] border border-white/10 p-4 space-y-4 sticky top-4"
        >
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0c1220] border border-white/10">
            <button
              type="button"
              onClick={() => setRightPanelTab('my-wallet')}
              className={`py-2 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                rightPanelTab === 'my-wallet'
                  ? 'bg-[#facc15] text-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              My Wallet History
            </button>
            <button
              type="button"
              onClick={() => setRightPanelTab('live-feed')}
              className={`py-2 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                rightPanelTab === 'live-feed'
                  ? 'bg-[#facc15] text-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Platform Feed
            </button>
          </div>

          {rightPanelTab === 'my-wallet' ? (
            <div className="space-y-3">
              {!currentUser ? (
                <div className="text-center py-6 space-y-3">
                  <Wallet className="w-8 h-8 text-[#facc15] mx-auto opacity-80" />
                  <p className="text-xs text-slate-300">
                    Log in or create an account to track your live deposits, withdrawals, and Exchange IDs.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenAuth('login')}
                    className="px-4 py-2 rounded-xl bg-[#facc15] text-black font-extrabold text-xs cursor-pointer"
                  >
                    Login / Sign Up Now
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {/* Customer Profile Summary Card in Right Panel */}
                  <div
                    data-testid="right-panel-user-profile-card"
                    className="p-3.5 rounded-2xl bg-gradient-to-br from-[#11192e] to-[#0c1220] border border-[#facc15]/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#facc15] text-black font-black text-sm flex items-center justify-center shrink-0">
                          {(currentUser.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-white truncate">
                            {currentUser.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {currentUser.email}
                          </p>
                          <p className="text-[10px] font-mono-tabular text-[#facc15]">
                            {currentUser.phone}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProfileModalOpen(true)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-[11px] shrink-0 cursor-pointer"
                      >
                        My Profile
                      </button>
                    </div>
                  </div>

                  {/* Active Issued Exchange IDs (`My IDs`) */}
                  {myIdRequests.map((req, reqIdx) => {
                    const matchedExch = OFFICIAL_EXCHANGE_PLATFORMS.find(
                      (e) => e.name.toLowerCase() === (req.platform || '').toLowerCase()
                    );
                    const exchUrl = matchedExch
                      ? matchedExch.url
                      : `https://${(req.platform || 'dexch99.now').toLowerCase().replace(/\s+/g, '')}`;

                    return (
                      <div
                        key={`my-idreq-${req.id || reqIdx}-${reqIdx}`}
                        data-testid={`my-wallet-id-card-${req.id}`}
                        className="p-3.5 rounded-xl bg-[#0c1220] border border-[#facc15]/40 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={exchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-extrabold text-[#facc15] hover:underline inline-flex items-center gap-1"
                          >
                            <span>{req.platform}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              req.status === 'Created'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {req.status === 'Created' ? 'Active ID' : 'Pending Approval'}
                          </span>
                        </div>

                        <div className="text-slate-300 flex items-center justify-between">
                          <span>
                            Requested: <span className="font-mono-tabular text-white">{req.preferredUsername}</span>
                          </span>
                          <span className="font-mono-tabular text-emerald-400">
                            ₹{req.depositAmount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {req.assignedId ? (
                          <div className="pt-2 border-t border-white/10 space-y-2">
                            <div className="p-2 rounded-lg bg-[#090d16] border border-emerald-500/30 font-mono-tabular text-[11px] space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">User ID:</span>
                                <span className="font-bold text-[#facc15]">{req.assignedId}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Password:</span>
                                <span className="font-bold text-emerald-300">
                                  {req.assignedPassword}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyCredential(
                                    `Exchange: ${req.platform} | User ID: ${req.assignedId} | Password: ${req.assignedPassword}`,
                                    `wallet-${req.id}`,
                                    `${req.platform} ID & Password`
                                  )
                                }
                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-[11px] inline-flex items-center justify-center gap-1 cursor-pointer"
                              >
                                {copiedIdKey === `wallet-${req.id}` ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy ID &amp; Pass</span>
                                  </>
                                )}
                              </button>
                              <a
                                href={exchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] inline-flex items-center gap-1"
                              >
                                <span>Open Link</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-300">
                            ⏳ Waiting for Admin/Staff to assign User ID &amp; Password...
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Customer Deposits */}
                  {myDeposits.map((dep, depIdx) => (
                    <div
                      key={`my-dep-${dep.id || depIdx}-${depIdx}`}
                      className="p-3 rounded-xl bg-[#0c1220] border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-emerald-400">
                          Deposit +₹{dep.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono-tabular">
                          UTR: {dep.utr}
                        </div>
                      </div>
                      <span
                        className={`font-bold ${
                          dep.status === 'Pending'
                            ? 'text-amber-400'
                            : dep.status === 'Approved'
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {dep.status}
                      </span>
                    </div>
                  ))}

                  {/* Customer Withdrawals */}
                  {myWithdrawals.map((wdr, wdrIdx) => (
                    <div
                      key={`my-wdr-${wdr.id || wdrIdx}-${wdrIdx}`}
                      className="p-3 rounded-xl bg-[#0c1220] border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-amber-300">
                          Withdraw -₹{wdr.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono-tabular">
                          {wdr.method === 'UPI' ? wdr.upiId : wdr.accountNumber}
                        </div>
                      </div>
                      <span
                        className={`font-bold ${
                          wdr.status === 'Pending'
                            ? 'text-amber-400'
                            : wdr.status === 'Approved'
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {wdr.status}
                      </span>
                    </div>
                  ))}

                  {myDeposits.length === 0 &&
                    myWithdrawals.length === 0 &&
                    myIdRequests.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6">
                        No transactions yet. Click Deposit ⏫ to add funds via UPI.
                      </p>
                    )}
                </div>
              )}
            </div>
          ) : (
            /* Live Platform Settlements Feed */
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 text-xs">
              {deposits.slice(0, 4).map((d, depIdx) => (
                <div
                  key={`feed-dep-${d.id || depIdx}-${depIdx}`}
                  className="p-2.5 rounded-xl bg-[#0c1220] border border-white/5 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white">{d.userName}</span>
                    <span className="block text-[10px] text-slate-400">
                      UPI Deposit · UTR #{(d.utr || '0000').slice(-4)}
                    </span>
                  </div>
                  <span className="font-mono-tabular font-bold text-emerald-400">
                    +₹{d.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              {withdrawals.slice(0, 4).map((w, wdrIdx) => (
                <div
                  key={`feed-wdr-${w.id || wdrIdx}-${wdrIdx}`}
                  className="p-2.5 rounded-xl bg-[#0c1220] border border-white/5 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white">{w.userName}</span>
                    <span className="block text-[10px] text-slate-400">
                      {w.method} Payout ({w.status})
                    </span>
                  </div>
                  <span className="font-mono-tabular font-bold text-[#facc15]">
                    ₹{w.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </main>

      {/* 3. MOBILE STICKY BOTTOM NAVIGATION BAR (`< 768px`) — Customer-Only */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#090d16]/95 border-t border-white/15 grid grid-cols-5 items-center px-1"
      >
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center justify-center py-1 text-[#facc15] cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px] font-bold mt-0.5">Home</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenCreateIdForExchange(OFFICIAL_EXCHANGE_PLATFORMS[0].name)}
          className="flex flex-col items-center justify-center py-1 text-slate-300 hover:text-[#facc15] cursor-pointer"
        >
          <KeyRound className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Create IDs</span>
        </button>

        <button
          type="button"
          onClick={() => setDepositModalOpen(true)}
          className="flex flex-col items-center justify-center py-1 text-emerald-400 cursor-pointer"
        >
          <ArrowUpCircle className="w-4 h-4" />
          <span className="text-[10px] font-bold mt-0.5">Deposit</span>
        </button>

        <button
          type="button"
          onClick={() => setWithdrawModalOpen(true)}
          className="flex flex-col items-center justify-center py-1 text-amber-400 cursor-pointer"
        >
          <ArrowDownCircle className="w-4 h-4" />
          <span className="text-[10px] font-bold mt-0.5">Withdraw</span>
        </button>

        <button
          type="button"
          onClick={() => setProfileModalOpen(true)}
          className="flex flex-col items-center justify-center py-1 text-slate-300 hover:text-[#facc15] cursor-pointer"
        >
          <UserIcon className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">My Wallet</span>
        </button>
      </nav>

      {/* 4. BUILT-IN IN-APP LIVE CHAT MESSENGER WITH OFFICIAL WHATSAPP LOGO TRIGGER */}
      <LiveChatWidget
        currentUser={currentUser}
        chatsMap={chatsMap}
        isOpen={liveChatOpen}
        onOpenChange={setLiveChatOpen}
      />

      {/* 5. CUSTOMER & GAME MODALS */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authInitialMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(_user, msg) => showToast(msg)}
      />

      <DepositModal
        isOpen={depositModalOpen}
        currentUser={currentUser}
        paymentSettings={paymentSettings}
        onClose={() => setDepositModalOpen(false)}
        onRequireAuth={() => {
          setDepositModalOpen(false);
          handleOpenAuth('login');
        }}
        onSuccess={(msg) => showToast(msg)}
      />

      <WithdrawModal
        isOpen={withdrawModalOpen}
        currentUser={currentUser}
        onClose={() => setWithdrawModalOpen(false)}
        onRequireAuth={() => {
          setWithdrawModalOpen(false);
          handleOpenAuth('login');
        }}
        onSuccess={(msg) => showToast(msg)}
      />

      <CreateIdModal
        isOpen={createIdModalOpen}
        currentUser={currentUser}
        paymentSettings={paymentSettings}
        selectedExchange={selectedExchangeForModal}
        onClose={() => setCreateIdModalOpen(false)}
        onRequireAuth={() => {
          setCreateIdModalOpen(false);
          handleOpenAuth('login');
        }}
        onSuccess={(msg) => showToast(msg)}
      />

      <MiniGameModal
        activeGame={activeGame}
        currentUser={currentUser}
        onClose={() => setActiveGame(null)}
        onRequireAuth={() => {
          setActiveGame(null);
          handleOpenAuth('login');
        }}
        onNotify={(msg) => showToast(msg)}
      />

      <UserProfileModal
        isOpen={profileModalOpen}
        currentUser={currentUser}
        myDeposits={myDeposits}
        myWithdrawals={myWithdrawals}
        myIdRequests={myIdRequests}
        onClose={() => setProfileModalOpen(false)}
        onOpenDeposit={() => setDepositModalOpen(true)}
        onOpenWithdraw={() => setWithdrawModalOpen(true)}
        onOpenCreateId={() => handleOpenCreateIdForExchange(OFFICIAL_EXCHANGE_PLATFORMS[0].name)}
        onLogout={async () => {
          await logoutCustomer();
          showToast('You have been logged out.');
        }}
        onSuccess={(msg) => showToast(msg)}
      />
    </div>
  );
}
