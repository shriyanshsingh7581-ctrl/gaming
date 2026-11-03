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
} from './utils/exchangeLogic';
import {
  subscribeToRealtimeData,
  subscribeToAuthState,
  logoutCustomer,
  INITIAL_PAYMENT_SETTINGS,
  INITIAL_BANNERS,
} from './firebase';
import { SharkHeader } from './components/SharkHeader';
import { BannerAndGames, GameCategoryType } from './components/BannerAndGames';
import {
  AuthModal,
  DepositModal,
  WithdrawModal,
  CreateIdModal,
} from './components/CustomerModals';
import { MiniGameModal } from './components/MiniGameModal';
import { AdminPanel } from './components/AdminPanel';
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
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
} from 'lucide-react';

export default function App() {
  // Check URL query parameter `?admin=true`
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('admin') === 'true';
    }
    return false;
  });

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

  // Modals & Interactive States
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [depositModalOpen, setDepositModalOpen] = useState<boolean>(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState<boolean>(false);
  const [createIdModalOpen, setCreateIdModalOpen] = useState<boolean>(false);
  const [activeGame, setActiveGame] = useState<GameCategoryType | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'my-wallet' | 'live-feed'>('my-wallet');

  useEffect(() => {
    const unsubDb = subscribeToRealtimeData((snapshot) => {
      const userList = Object.values(snapshot.users || {}).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const depList = Object.values(snapshot.deposits || {}).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const wdrList = Object.values(snapshot.withdrawals || {}).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const idReqList = Object.values(snapshot.idRequests || {}).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setUsers(userList);
      setDeposits(depList);
      setWithdrawals(wdrList);
      setIdRequests(idReqList);
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

  const handleSwitchToAdmin = () => {
    setIsAdminView(true);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('admin', 'true');
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleBackToLobby = () => {
    setIsAdminView(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      window.history.pushState({}, '', url.toString());
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

  /* ---------------- RENDER MASTER OWNER ADMIN PANEL ---------------- */
  if (isAdminView) {
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
          onBackToLobby={handleBackToLobby}
          onNotify={showToast}
        />
      </>
    );
  }

  /* ---------------- RENDER SHARK EXCH CUSTOMER APPLICATION ---------------- */
  return (
    <div id="top" className="min-h-screen bg-[#070a10] text-white flex flex-col pb-20 md:pb-8">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-14 right-4 z-[60] max-w-md px-4 py-3 rounded-2xl bg-[#facc15] text-black font-bold text-xs shadow-2xl border-2 border-black"
        >
          {toastMessage}
        </div>
      )}

      {/* 1. EXACT "SHARK EXCH" TOP AUTH BAR & GOLDEN-YELLOW WALLET HEADER */}
      <SharkHeader
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={async () => {
          await logoutCustomer();
          showToast('You have been logged out.');
        }}
        onOpenDeposit={() => setDepositModalOpen(true)}
        onOpenWithdraw={() => setWithdrawModalOpen(true)}
        onSwitchToAdmin={handleSwitchToAdmin}
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
              Quick Wallet & IDs
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setCreateIdModalOpen(true)}
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
            </div>
          </div>

          <div className="border-t border-white/10 pt-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Featured Exchange Games
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveGame('aviatrix')}
                className="w-full py-2 px-3 rounded-xl hover:bg-white/5 text-slate-200 hover:text-[#facc15] font-semibold text-xs flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-sky-400" />
                  <span>Aviatrix Crash</span>
                </span>
                <span className="font-mono-tabular text-[10px] text-sky-400">10,000x</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGame('mines')}
                className="w-full py-2 px-3 rounded-xl hover:bg-white/5 text-slate-200 hover:text-[#facc15] font-semibold text-xs flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Bomb className="w-4 h-4 text-red-400" />
                  <span>MINES Turbo</span>
                </span>
                <span className="font-mono-tabular text-[10px] text-red-400">97% RTP</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGame('cricket')}
                className="w-full py-2 px-3 rounded-xl hover:bg-white/5 text-slate-200 hover:text-[#facc15] font-semibold text-xs flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span>Cricket Live</span>
                </span>
                <span className="font-mono-tabular text-[10px] text-emerald-400">In-Play</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGame('color')}
                className="w-full py-2 px-3 rounded-xl hover:bg-white/5 text-slate-200 hover:text-[#facc15] font-semibold text-xs flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>Color Prediction</span>
                </span>
                <span className="font-mono-tabular text-[10px] text-purple-400">WinGo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGame('casino')}
                className="w-full py-2 px-3 rounded-xl hover:bg-white/5 text-slate-200 hover:text-[#facc15] font-semibold text-xs flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-pink-400" />
                  <span>Sexy Live Casino</span>
                </span>
                <span className="font-mono-tabular text-[10px] text-pink-400">VIP</span>
              </button>
            </div>
          </div>

          <div className="border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={handleSwitchToAdmin}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-[#facc15]/30 text-[#facc15] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Owner Admin (PIN: 7777)</span>
            </button>
          </div>
        </aside>

        {/* CENTER COLUMN: PROMOTIONAL BANNER CAROUSEL, CREATE IDs, GAME CARDS & IN-PLAY EXCHANGE */}
        <div className="space-y-5 min-w-0">
          <BannerAndGames
            banners={banners}
            onOpenCreateId={() => setCreateIdModalOpen(true)}
            onSelectGame={(game) => setActiveGame(game)}
          />

          {/* Live Sports & Casino Exchange Odds Table */}
          <section
            aria-label="Live In-Play Exchange Markets"
            className="rounded-2xl bg-[#090d16] border border-white/10 overflow-hidden"
          >
            <div className="px-4 py-3 bg-[#0c1220] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#facc15]" />
                <h2 className="font-shark italic font-bold text-base sm:text-lg text-white tracking-wide">
                  LIVE EXCHANGE MARKETS (BACK / LAY)
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-mono-tabular">
                0% Commission · Instant Settlement
              </span>
            </div>

            <div className="divide-y divide-white/5">
              {[
                {
                  match: 'India vs Australia · T20 International',
                  status: 'IN-PLAY · Over 14.2',
                  back: 1.92,
                  lay: 1.94,
                  category: 'cricket' as GameCategoryType,
                },
                {
                  match: 'Mumbai Indians vs Chennai Super Kings',
                  status: 'IN-PLAY · Powerplay',
                  back: 1.86,
                  lay: 1.88,
                  category: 'cricket' as GameCategoryType,
                },
                {
                  match: 'Aviatrix Turbo Crash Pool · Round #88412',
                  status: 'LIVE MULTIPLIER',
                  back: 2.5,
                  lay: 5.0,
                  category: 'aviatrix' as GameCategoryType,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:px-4 flex flex-wrap items-center justify-between gap-3 hover:bg-white/[0.02]"
                >
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white">
                      {item.match}
                    </p>
                    <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                      {item.status}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveGame(item.category)}
                      className="px-3.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 font-mono-tabular font-bold text-xs cursor-pointer"
                    >
                      BACK {item.back.toFixed(2)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveGame(item.category)}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 font-mono-tabular font-bold text-xs cursor-pointer"
                    >
                      LAY {item.lay.toFixed(2)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT PANEL: USER WALLET HISTORY & LIVE TRANSACTIONS */}
        <aside
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
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {/* Active Issued Exchange IDs */}
                  {myIdRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl bg-[#0c1220] border border-[#facc15]/30 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#facc15]">
                          {req.platform}
                        </span>
                        <span className="font-semibold text-emerald-400">
                          {req.status}
                        </span>
                      </div>
                      <div className="text-slate-300">
                        Username: <span className="font-mono-tabular">{req.preferredUsername}</span>
                      </div>
                      {req.assignedId && (
                        <div className="text-[11px] font-mono-tabular text-emerald-300">
                          ID: {req.assignedId} · Pass: {req.assignedPassword}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Customer Deposits */}
                  {myDeposits.map((dep) => (
                    <div
                      key={dep.id}
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
                  {myWithdrawals.map((wdr) => (
                    <div
                      key={wdr.id}
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
              {deposits.slice(0, 4).map((d) => (
                <div
                  key={d.id}
                  className="p-2.5 rounded-xl bg-[#0c1220] border border-white/5 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white">{d.userName}</span>
                    <span className="block text-[10px] text-slate-400">
                      UPI Deposit · UTR #{d.utr.slice(-4)}
                    </span>
                  </div>
                  <span className="font-mono-tabular font-bold text-emerald-400">
                    +₹{d.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              {withdrawals.slice(0, 4).map((w) => (
                <div
                  key={w.id}
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

      {/* 3. MOBILE STICKY BOTTOM NAVIGATION BAR (`< 768px`) */}
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
          onClick={() => setCreateIdModalOpen(true)}
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
          onClick={() =>
            currentUser ? handleSwitchToAdmin() : handleOpenAuth('login')
          }
          className="flex flex-col items-center justify-center py-1 text-slate-300 hover:text-[#facc15] cursor-pointer"
        >
          <UserIcon className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">
            {currentUser ? 'Profile' : 'Login'}
          </span>
        </button>
      </nav>

      {/* 4. CUSTOMER & GAME MODALS */}
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
    </div>
  );
}
