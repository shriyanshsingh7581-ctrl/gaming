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
  Rocket,
  Bomb,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
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

  /* ---------------- PAGE 1: PRE-LOGIN LANDING & AUTH PAGE (WHEN USER IS LOGGED OUT) ---------------- */
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
          promoVideoUrl={paymentSettings.promoVideoUrl}
          promoVideoOrientation={paymentSettings.promoVideoOrientation || 'landscape'}
          authPosterUrl={paymentSettings.authPosterUrl}
          onOpenSignUpModal={() => handleOpenAuth('signup')}
          onOpenLoginModal={() => handleOpenAuth('login')}
          onAuthSuccess={(user, msg) => {
            setCurrentUser(user);
            showToast(msg);
          }}
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
          onSuccess={(user, msg) => {
            setCurrentUser(user);
            showToast(msg);
          }}
        />
      </>
    );
  }

  /* ---------------- PAGE 2: MAIN CUSTOMER DASHBOARD (AFTER SIGN-UP / LOGIN) ---------------- */
  return (
    <div
      id="top"
      data-testid="page-2-postlogin-dashboard"
      className="min-h-screen bg-[#070a10] text-white flex flex-col pb-24"
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

      {/* 1. MINIMALIST SHARKX HEADER & GOLDEN-YELLOW WALLET SECTION */}
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

      {/* 2. ADAPTIVE EXCHANGE LOBBY (No "My Wallet History" on homepage; transactions live in Account Statement) */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 pt-4 grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-5 items-start">
        {/* LEFT NAVIGATION SIDEBAR (Desktop >= 1024px) */}
        <aside
          aria-label="Exchange Categories Sidebar"
          className="hidden lg:flex flex-col gap-4 rounded-2xl bg-[#0c111d] border border-white/10 p-4 sticky top-4"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Quick Actions
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleOpenCreateIdForExchange(OFFICIAL_EXCHANGE_PLATFORMS[0].name)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs flex items-center gap-2.5 cursor-pointer transition-transform active:scale-98"
              >
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Create ID</span>
              </button>
              <button
                type="button"
                onClick={() => setDepositModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 font-bold text-xs flex items-center gap-2.5 cursor-pointer"
              >
                <ArrowUpCircle className="w-4 h-4 shrink-0" />
                <span>Deposit</span>
              </button>
              <button
                type="button"
                onClick={() => setWithdrawModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 font-bold text-xs flex items-center gap-2.5 cursor-pointer"
              >
                <ArrowDownCircle className="w-4 h-4 shrink-0" />
                <span>Withdrawal</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#facc15] font-bold text-xs flex items-center gap-2.5 cursor-pointer"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Account Statement</span>
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
              Featured Games
            </p>
            <div className="space-y-1 select-none">
              <div
                className="w-full py-2 px-3 rounded-xl text-slate-200 font-semibold text-xs flex items-center justify-between cursor-default"
              >
                <span className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-sky-400" />
                  <span>Aviatrix</span>
                </span>
                <span className="font-mono-tabular text-[10px] text-sky-400">10,000x</span>
              </div>

              <div
                className="w-full py-2 px-3 rounded-xl text-slate-200 font-semibold text-xs flex items-center justify-between cursor-default"
              >
                <span className="flex items-center gap-2">
                  <Bomb className="w-4 h-4 text-red-400" />
                  <span>MINES</span>
                </span>
                <span className="font-mono-tabular text-[10px] text-red-400">97% RTP</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: FIXED LARGE BANNER, [Create IDs | Aviatrix | MINES], & NUMBERED EXCHANGE LIST */}
        <div className="space-y-5 min-w-0">
          <BannerAndGames
            banners={banners}
            homePosterUrl={paymentSettings.homePosterUrl}
            currentUser={currentUser}
            activeIdCount={myIdRequests.filter((r) => r.status === 'Created').length}
            onOpenCreateId={() => handleOpenCreateIdForExchange(OFFICIAL_EXCHANGE_PLATFORMS[0].name)}
            onOpenSignUp={() => handleOpenAuth('signup')}
            onOpenLogin={() => handleOpenAuth('login')}
            onOpenProfile={() => setProfileModalOpen(true)}
            onOpenDeposit={() => setDepositModalOpen(true)}
            onSelectGame={(cat) => setActiveGame(cat)}
          />

          {/* Official Exchange Platforms Section:
              - Large white text banner "Official Exchange ID & Instant Withdrawal" removed
              - Smaller badge "Instant ID Approval 24*7 Direct Withdrawal" kept
              - Clean numbered list of exchange platforms with "Create ID" and "Withdrawal" actions */}
          <section
            aria-label="Official Gaming Exchanges"
            data-testid="official-exchanges-section"
            className="rounded-2xl bg-[#0c111d] border border-white/10 overflow-hidden shadow-xl"
          >
            <div className="px-4 py-3 bg-gradient-to-r from-[#11192c] to-[#0c111d] border-b border-white/10 flex items-center justify-between gap-2">
              <span
                data-testid="instant-approval-badge"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-extrabold tracking-wide"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Instant ID Approval 24*7 Direct Withdrawal</span>
              </span>
            </div>

            <div className="divide-y divide-white/10">
              {OFFICIAL_EXCHANGE_PLATFORMS.map((exch, exchIdx) => {
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
                          <span>Withdrawal</span>
                        </button>
                      </div>
                    </div>

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
                                  (Amount: ₹{req.depositAmount.toLocaleString('en-IN')})
                                </span>
                                <span className="text-[11px] font-bold uppercase">
                                  Pending Approval
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
      </main>

      {/* 3. STICKY BOTTOM NAVIGATION BAR (Strictly Fixed Order: 1. Create ID | 2. Deposit | 3. Home (Center) | 4. Withdrawal | 5. Account Statement) */}
      <nav
        aria-label="Bottom Navigation"
        data-testid="bottom-navigation-bar"
        className="fixed bottom-0 left-0 right-0 z-[60] h-16 bg-[#090d16]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-3 sm:px-8 max-w-5xl mx-auto"
      >
        {/* 1. Create ID */}
        <button
          type="button"
          data-testid="bottom-nav-create-id"
          onClick={() => {
            setDepositModalOpen(false);
            setWithdrawModalOpen(false);
            setProfileModalOpen(false);
            handleOpenCreateIdForExchange(OFFICIAL_EXCHANGE_PLATFORMS[0].name);
          }}
          className="flex flex-col items-center justify-center py-1 text-slate-300 hover:text-[#facc15] cursor-pointer"
        >
          <KeyRound className="w-4 h-4 text-[#facc15]" />
          <span className="text-[10px] sm:text-xs font-bold mt-0.5 whitespace-nowrap">
            Create ID
          </span>
        </button>

        {/* 2. Deposit */}
        <button
          type="button"
          data-testid="bottom-nav-deposit"
          onClick={() => {
            setCreateIdModalOpen(false);
            setWithdrawModalOpen(false);
            setProfileModalOpen(false);
            setDepositModalOpen(true);
          }}
          className="flex flex-col items-center justify-center py-1 text-emerald-400 cursor-pointer"
        >
          <ArrowUpCircle className="w-4 h-4" />
          <span className="text-[10px] sm:text-xs font-bold mt-0.5 whitespace-nowrap">
            Deposit
          </span>
        </button>

        {/* 3. Home (Center) */}
        <button
          type="button"
          data-testid="bottom-nav-home"
          onClick={() => {
            setCreateIdModalOpen(false);
            setDepositModalOpen(false);
            setWithdrawModalOpen(false);
            setProfileModalOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center py-1 text-[#facc15] cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#facc15] text-[#090d16] flex items-center justify-center shadow-[0_0_12px_rgba(250,204,21,0.5)]">
            <Home className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-[10px] sm:text-xs font-extrabold mt-0.5 whitespace-nowrap">
            Home
          </span>
        </button>

        {/* 4. Withdrawal */}
        <button
          type="button"
          data-testid="bottom-nav-withdrawal"
          onClick={() => {
            setCreateIdModalOpen(false);
            setDepositModalOpen(false);
            setProfileModalOpen(false);
            setWithdrawModalOpen(true);
          }}
          className="flex flex-col items-center justify-center py-1 text-amber-400 cursor-pointer"
        >
          <ArrowDownCircle className="w-4 h-4" />
          <span className="text-[10px] sm:text-xs font-bold mt-0.5 whitespace-nowrap">
            Withdrawal
          </span>
        </button>

        {/* 5. Account Statement (Renamed from "My Wallet") */}
        <button
          type="button"
          data-testid="bottom-nav-account-statement"
          onClick={() => {
            setCreateIdModalOpen(false);
            setDepositModalOpen(false);
            setWithdrawModalOpen(false);
            setProfileModalOpen(true);
          }}
          className="flex flex-col items-center justify-center py-1 text-slate-300 hover:text-white cursor-pointer"
        >
          <FileText className="w-4 h-4 text-[#facc15]" />
          <span className="text-[9.5px] sm:text-xs font-bold mt-0.5 whitespace-nowrap tracking-tight">
            Account Statement
          </span>
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

