import React, { useState } from 'react';
import {
  UserProfile,
  DepositRecord,
  WithdrawalRecord,
  IdRequestRecord,
  PaymentSettings,
  BannerSlide,
  computeAdminSummaryStats,
  parseFirebaseConfigSnippet,
} from '../utils/exchangeLogic';
import {
  adminAdjustUserBalance,
  adminToggleUserStatus,
  adminResolveDeposit,
  adminResolveWithdrawal,
  adminResolveIdRequest,
  adminSavePaymentSettings,
  getFirebaseConnectionStatus,
  saveRuntimeFirebaseConfig,
  clearRuntimeFirebaseConfig,
  DEFAULT_QR_SVG_DATA_URI,
} from '../firebase';
import {
  ShieldCheck,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  QrCode,
  Database,
  Search,
  Lock,
  ArrowLeft,
  Eye,
  Upload,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Ban,
  KeyRound,
  X,
} from 'lucide-react';

interface AdminPanelProps {
  users: UserProfile[];
  deposits: DepositRecord[];
  withdrawals: WithdrawalRecord[];
  idRequests: IdRequestRecord[];
  paymentSettings: PaymentSettings;
  banners: BannerSlide[];
  onBackToLobby: () => void;
  onNotify: (msg: string) => void;
}

type AdminTab = 'customers' | 'withdrawals' | 'deposits' | 'payment' | 'firebase';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  deposits,
  withdrawals,
  idRequests,
  paymentSettings,
  onBackToLobby,
  onNotify,
}) => {
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<AdminTab>('customers');

  // Tab 1: Search & Balance Adjust State
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [adjustingUser, setAdjustingUser] = useState<UserProfile | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('1000');

  // Tab 3: Screenshot Preview Modal
  const [previewDeposit, setPreviewDeposit] = useState<DepositRecord | null>(null);

  // Tab 4: Payment & QR Form State
  const [upiId, setUpiId] = useState<string>(paymentSettings.upiId);
  const [merchantName, setMerchantName] = useState<string>(paymentSettings.merchantName);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>(paymentSettings.qrCodeUrl);
  const [bankName, setBankName] = useState<string>(paymentSettings.bankName);
  const [accountHolder, setAccountHolder] = useState<string>(paymentSettings.accountHolder);
  const [accountNumber, setAccountNumber] = useState<string>(paymentSettings.accountNumber);
  const [ifsc, setIfsc] = useState<string>(paymentSettings.ifsc);

  // Tab 5: Firebase Config Setup Modal / Editor State
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);
  const [firebaseRawJson, setFirebaseRawJson] = useState<string>('');
  const [firebaseConfigError, setFirebaseConfigError] = useState<string>('');

  const summary = computeAdminSummaryStats(users, deposits, withdrawals);
  const fbStatus = getFirebaseConnectionStatus();

  const handlePinUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === '7777') {
      setUnlocked(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN. Use Demo Admin PIN: 7777');
    }
  };

  /* ---------------- PIN GATE SCREEN ---------------- */
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-[#0c111d] border border-[#facc15]/40 shadow-2xl overflow-hidden">
          <div className="bg-[#facc15] px-6 py-4 flex items-center justify-between text-[#090d16]">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 stroke-[2.5]" />
              <span className="font-shark italic font-black text-xl">
                MASTER OWNER ADMIN GATE
              </span>
            </div>
            <button
              type="button"
              onClick={onBackToLobby}
              className="text-xs font-bold underline cursor-pointer"
            >
              Exit to Lobby
            </button>
          </div>

          <form onSubmit={handlePinUnlock} className="p-6 space-y-4">
            <div className="p-3 rounded-xl bg-[#facc15]/10 border border-[#facc15]/30 text-center">
              <p className="text-xs font-bold text-[#facc15]">
                Demo Admin PIN: 7777
              </p>
            </div>

            {pinError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs text-center font-semibold"
              >
                {pinError}
              </div>
            )}

            <div>
              <label
                htmlFor="admin-pin-input"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Enter 4-Digit Master Owner PIN
              </label>
              <input
                id="admin-pin-input"
                type="password"
                maxLength={8}
                autoFocus
                required
                placeholder="7777"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#090d16] border border-white/15 text-center font-mono-tabular font-black text-2xl tracking-[0.35em] text-[#facc15] focus:outline-none focus:border-[#facc15]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setPinInput('7777');
                  setUnlocked(true);
                }}
                className="py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer"
              >
                Auto-Fill PIN (7777)
              </button>
              <button
                type="submit"
                className="py-3 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-sm cursor-pointer"
              >
                Unlock Admin Panel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ---------------- FILTERED CUSTOMERS ---------------- */
  const filteredCustomers = users.filter((u) => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q)
    );
  });

  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setQrCodeUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminSavePaymentSettings({
      upiId: upiId.trim(),
      merchantName: merchantName.trim(),
      qrCodeUrl: qrCodeUrl.trim() || DEFAULT_QR_SVG_DATA_URI,
      bankName: bankName.trim(),
      accountHolder: accountHolder.trim(),
      accountNumber: accountNumber.trim(),
      ifsc: ifsc.trim().toUpperCase(),
      minDeposit: paymentSettings.minDeposit || 500,
      minWithdrawal: paymentSettings.minWithdrawal || 500,
      updatedAt: new Date().toISOString(),
    });
    onNotify('Saved to Firebase! Live QR Code, UPI ID & Bank Details updated across all customer devices.');
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setFirebaseConfigError('');
    const parsed = parseFirebaseConfigSnippet(firebaseRawJson);
    if (!parsed.valid || !parsed.config) {
      setFirebaseConfigError(parsed.error || 'Invalid Firebase config JSON.');
      return;
    }
    saveRuntimeFirebaseConfig(parsed.config);
    setIsFirebaseModalOpen(false);
    setFirebaseRawJson('');
    onNotify(`Connected to Firebase project "${parsed.config.projectId}" in real time!`);
  };

  return (
    <div className="min-h-screen bg-[#070a10] text-white pb-16">
      {/* Admin Top Header */}
      <header className="bg-[#090d16] border-b border-white/10 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#facc15] text-black flex items-center justify-center font-shark italic font-black text-lg">
            SX
          </div>
          <div>
            <h1 className="font-shark italic font-black text-xl sm:text-2xl tracking-wide text-white">
              SHARK <span className="text-[#facc15]">EXCH</span> · STANDALONE MASTER ADMIN
            </h1>
            <p className="text-xs text-slate-400">
              🟢 Connected to Firebase Realtime DB ({fbStatus.projectId}) · Separate Admin Link: <span className="font-mono-tabular text-[#facc15]">/admin</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              const adminUrl = `${window.location.origin}/admin`;
              navigator.clipboard?.writeText(adminUrl).catch(() => {});
              onNotify(`Copied Separate Admin Link: ${adminUrl}`);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-xs font-bold text-emerald-300 cursor-pointer"
          >
            🔗 Copy Admin Link (/admin)
          </button>

          <button
            type="button"
            onClick={() => setIsFirebaseModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-[#facc15]" />
            <span>Firebase Config Setup</span>
          </button>

          <button
            type="button"
            onClick={onBackToLobby}
            className="px-4 py-2 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Open Customer Website</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Top Live Firebase Summary Cards */}
        <section
          aria-label="Live Firebase Summary Metrics"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="rounded-2xl bg-[#0c111d] border border-white/10 p-5">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">
              Total Signed-Up Customers
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span
                data-testid="admin-total-customers"
                className="font-mono-tabular font-black text-3xl text-white"
              >
                {summary.totalCustomers}
              </span>
              <span className="text-xs text-emerald-400 font-semibold">
                /users live
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-[#0c111d] border border-white/10 p-5">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">
              Pending Withdrawal Requests
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span
                data-testid="admin-pending-withdrawals"
                className="font-mono-tabular font-black text-3xl text-amber-400"
              >
                {summary.pendingWithdrawals}
              </span>
              <span className="text-xs text-amber-300 font-semibold">
                /withdrawals queue
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-[#0c111d] border border-white/10 p-5">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">
              Pending Deposit Requests
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span
                data-testid="admin-pending-deposits"
                className="font-mono-tabular font-black text-3xl text-sky-400"
              >
                {summary.pendingDeposits}
              </span>
              <span className="text-xs text-sky-300 font-semibold">
                /deposits queue
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-[#0c111d] border border-[#facc15]/30 p-5">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">
              Total Platform Wallet Balance (₹)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span
                data-testid="admin-total-balance"
                className="font-mono-tabular font-black text-3xl text-[#facc15]"
              >
                ₹{summary.totalWalletBalance.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-[#facc15] font-semibold">
                🪙 Live Sync
              </span>
            </div>
          </div>
        </section>

        {/* 5 Admin Navigation Tabs */}
        <nav
          aria-label="Admin Sections"
          className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#090d16] border border-white/10"
        >
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'customers'
                ? 'bg-[#facc15] text-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. Registered Customers ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'withdrawals'
                ? 'bg-[#facc15] text-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>2. Withdrawal Queue ({summary.pendingWithdrawals})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deposits')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'deposits'
                ? 'bg-[#facc15] text-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>3. Deposit Verification ({summary.pendingDeposits})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'payment'
                ? 'bg-[#facc15] text-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>4. Change QR Code & Bank Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('firebase')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'firebase'
                ? 'bg-[#facc15] text-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>5. Firebase Connection & IDs</span>
          </button>
        </nav>

        {/* ====================================================================
         * TAB 1: REGISTERED CUSTOMERS DATA (`/users`)
         * ==================================================================== */}
        {activeTab === 'customers' && (
          <section className="rounded-2xl bg-[#0c111d] border border-white/10 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Registered Customers Data (`/users`)
                </h2>
                <p className="text-xs text-slate-400">
                  Live searchable directory of all Email & Password registered accounts with instant wallet balance and status controls.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  placeholder="Search name, email, phone, UID..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#090d16] border border-white/15 text-xs text-white focus:outline-none focus:border-[#facc15]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase">
                    <th className="py-3 px-3">Customer UID</th>
                    <th className="py-3 px-3">Full Name</th>
                    <th className="py-3 px-3">Email ID</th>
                    <th className="py-3 px-3">Mobile Number</th>
                    <th className="py-3 px-3">Password</th>
                    <th className="py-3 px-3">Signup Date</th>
                    <th className="py-3 px-3">Live Wallet (🪙)</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCustomers.map((u) => (
                    <tr key={u.uid} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-mono-tabular text-slate-400">
                        {u.uid}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        {u.name}
                      </td>
                      <td className="py-3 px-3 text-sky-300">{u.email}</td>
                      <td className="py-3 px-3 font-mono-tabular text-slate-300">
                        {u.phone}
                      </td>
                      <td className="py-3 px-3 font-mono-tabular text-amber-300">
                        {u.password || '••••••••'}
                      </td>
                      <td className="py-3 px-3 font-mono-tabular text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-mono-tabular font-bold text-sm text-[#facc15]">
                        🪙 ₹{u.walletBalance.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={
                            u.status === 'Active'
                              ? 'text-emerald-400 font-bold'
                              : 'text-red-400 font-bold'
                          }
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingUser(u);
                              setAdjustAmount('1000');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#facc15]/15 hover:bg-[#facc15]/25 border border-[#facc15]/40 text-[#facc15] font-bold text-xs cursor-pointer whitespace-nowrap"
                          >
                            ➕ Add / Deduct Balance
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const next = await adminToggleUserStatus(u.uid);
                              onNotify(`User ${u.name} is now ${next}.`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 font-semibold text-xs cursor-pointer whitespace-nowrap"
                          >
                            🚫 {u.status === 'Active' ? 'Block User' : 'Unblock User'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ====================================================================
         * TAB 2: WITHDRAWAL REQUESTS QUEUE (`/withdrawals`)
         * ==================================================================== */}
        {activeTab === 'withdrawals' && (
          <section className="rounded-2xl bg-[#0c111d] border border-white/10 p-5 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                Withdrawal Requests Queue (`/withdrawals`)
              </h2>
              <p className="text-xs text-slate-400">
                Approve & Mark Paid after transferring payout, or Reject to automatically refund the amount back to the customer's Firebase wallet.
              </p>
            </div>

            <div className="space-y-3">
              {withdrawals.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">
                  No withdrawal requests found.
                </p>
              ) : (
                withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-2xl bg-[#090d16] border border-white/10 p-4 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {w.userName}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-xs text-sky-300">{w.userEmail}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-xs text-slate-400 font-mono-tabular">
                          {w.userPhone}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        {w.method === 'UPI' ? (
                          <span>
                            Payout via <strong>UPI ID:</strong>{' '}
                            <span className="font-mono-tabular text-[#facc15] font-bold">
                              {w.upiId}
                            </span>
                          </span>
                        ) : (
                          <span>
                            Payout via <strong>Bank IMPS:</strong>{' '}
                            {w.accountHolder} · A/C:{' '}
                            <span className="font-mono-tabular text-[#facc15] font-bold">
                              {w.accountNumber}
                            </span>{' '}
                            · IFSC:{' '}
                            <span className="font-mono-tabular text-white font-bold">
                              {w.ifsc}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono-tabular">
                        Requested: {new Date(w.createdAt).toLocaleString('en-IN')} · ID: {w.id}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block font-mono-tabular font-black text-xl text-[#facc15]">
                          ₹{w.amount.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            w.status === 'Pending'
                              ? 'text-amber-400'
                              : w.status === 'Approved'
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {w.status}
                        </span>
                      </div>

                      {w.status === 'Pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              await adminResolveWithdrawal(w.id, 'Approved');
                              onNotify(
                                `Withdrawal of ₹${w.amount.toLocaleString('en-IN')} for ${w.userName} marked as Paid!`
                              );
                            }}
                            className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs cursor-pointer"
                          >
                            ✅ Approve & Mark Paid
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await adminResolveWithdrawal(w.id, 'Rejected');
                              onNotify(
                                `Withdrawal rejected & ₹${w.amount.toLocaleString('en-IN')} refunded to ${w.userName}'s wallet.`
                              );
                            }}
                            className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs cursor-pointer"
                          >
                            ❌ Reject & Refund Balance
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ====================================================================
         * TAB 3: DEPOSIT VERIFICATION QUEUE (`/deposits`)
         * ==================================================================== */}
        {activeTab === 'deposits' && (
          <section className="rounded-2xl bg-[#0c111d] border border-white/10 p-5 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                Deposit Verification Queue (`/deposits`)
              </h2>
              <p className="text-xs text-slate-400">
                Verify customer 12-digit UTR numbers and screenshots. Clicking Approve & Credit Wallet automatically adds the deposit amount to `/users/&#123;uid&#125;/walletBalance`.
              </p>
            </div>

            <div className="space-y-3">
              {deposits.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">
                  No deposit submissions yet.
                </p>
              ) : (
                deposits.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-2xl bg-[#090d16] border border-white/10 p-4 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {/* Screenshot Thumbnail */}
                      <button
                        type="button"
                        onClick={() => setPreviewDeposit(d)}
                        className="relative w-14 h-14 rounded-xl overflow-hidden bg-white p-1 border border-white/20 shrink-0 group cursor-pointer"
                        title="View Payment Screenshot"
                      >
                        <img
                          src={d.screenshotUrl || DEFAULT_QR_SVG_DATA_URI}
                          alt={`UTR ${d.utr} Screenshot`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                        <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-4 h-4 text-white" />
                        </span>
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">
                            {d.userName}
                          </span>
                          <span className="text-slate-500">·</span>
                          <span className="text-xs text-sky-300">{d.userEmail}</span>
                        </div>
                        <div className="text-xs text-slate-300">
                          12-Digit UTR:{' '}
                          <span className="font-mono-tabular font-bold text-[#facc15]">
                            {d.utr}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono-tabular">
                          Submitted: {new Date(d.createdAt).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block font-mono-tabular font-black text-xl text-emerald-400">
                          +₹{d.amount.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            d.status === 'Pending'
                              ? 'text-amber-400'
                              : d.status === 'Approved'
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>

                      {d.status === 'Pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              await adminResolveDeposit(d.id, 'Approved');
                              onNotify(
                                `Approved! ₹${d.amount.toLocaleString('en-IN')} credited to ${d.userName}'s Firebase Wallet.`
                              );
                            }}
                            className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs cursor-pointer"
                          >
                            ✅ Approve & Credit Wallet
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await adminResolveDeposit(d.id, 'Rejected');
                              onNotify(`Rejected deposit UTR ${d.utr}.`);
                            }}
                            className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs cursor-pointer"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ====================================================================
         * TAB 4: CHANGE QR CODE & BANK DETAILS (`/paymentSettings`)
         * ==================================================================== */}
        {activeTab === 'payment' && (
          <section className="rounded-2xl bg-[#0c111d] border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white">
              Change Live UPI QR Code & Bank Account Details (`/paymentSettings`)
            </h2>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Any changes saved here synchronize instantaneously via Firebase Realtime Database to all customer Deposit screens.
            </p>

            <form
              onSubmit={handleSavePaymentSettings}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left Column: Live QR Preview & Upload */}
              <div className="rounded-2xl bg-[#090d16] border border-white/10 p-5 flex flex-col items-center text-center space-y-3">
                <span className="text-xs font-bold text-[#facc15] uppercase">
                  Live Customer QR Preview
                </span>
                <div className="w-44 h-44 rounded-2xl bg-white p-2 flex items-center justify-center overflow-hidden">
                  <img
                    src={qrCodeUrl || DEFAULT_QR_SVG_DATA_URI}
                    alt="Merchant QR Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>

                <label
                  htmlFor="admin-qr-upload"
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#facc15]" />
                  <span>Upload New QR Code Image</span>
                </label>
                <input
                  id="admin-qr-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleQrFileUpload}
                  className="hidden"
                />

                <div className="w-full text-left">
                  <label
                    htmlFor="admin-qr-url-input"
                    className="block text-[11px] text-slate-400 mb-1"
                  >
                    Or Paste QR Code Image URL / Base64
                  </label>
                  <input
                    id="admin-qr-url-input"
                    type="text"
                    value={qrCodeUrl}
                    onChange={(e) => setQrCodeUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0c111d] border border-white/15 text-xs text-white"
                  />
                </div>
              </div>

              {/* Right 2 Columns: UPI & Bank Details Form */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="admin-upi-input"
                      className="block text-xs font-semibold text-slate-300 mb-1"
                    >
                      Merchant UPI ID *
                    </label>
                    <input
                      id="admin-upi-input"
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular text-sm focus:outline-none focus:border-[#facc15]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-merchant-input"
                      className="block text-xs font-semibold text-slate-300 mb-1"
                    >
                      Merchant Display Name *
                    </label>
                    <input
                      id="admin-merchant-input"
                      type="text"
                      required
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="admin-bank-name"
                      className="block text-xs font-semibold text-slate-300 mb-1"
                    >
                      Bank Name *
                    </label>
                    <input
                      id="admin-bank-name"
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-holder-name"
                      className="block text-xs font-semibold text-slate-300 mb-1"
                    >
                      Account Holder Name *
                    </label>
                    <input
                      id="admin-holder-name"
                      type="text"
                      required
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="admin-acc-number"
                      className="block text-xs font-semibold text-slate-300 mb-1"
                    >
                      Bank Account Number *
                    </label>
                    <input
                      id="admin-acc-number"
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular text-sm focus:outline-none focus:border-[#facc15]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-ifsc-code"
                      className="block text-xs font-semibold text-slate-300 mb-1"
                    >
                      IFSC Code *
                    </label>
                    <input
                      id="admin-ifsc-code"
                      type="text"
                      required
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular text-sm uppercase focus:outline-none focus:border-[#facc15]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-sm tracking-wide shadow-lg cursor-pointer"
                >
                  💾 Save to Firebase (`/paymentSettings`)
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ====================================================================
         * TAB 5: FIREBASE CONNECTION & ID REQUESTS
         * ==================================================================== */}
        {activeTab === 'firebase' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Firebase Connection Status & Config Setup */}
            <section className="rounded-2xl bg-[#0c111d] border border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  Firebase Realtime Database Connection
                </h2>
                <span className="text-xs font-bold text-emerald-400">
                  🟢 Connected to Firebase Realtime DB
                </span>
              </div>

              <div className="rounded-xl bg-[#090d16] border border-white/10 p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Project ID:</span>
                  <span className="font-mono-tabular font-bold text-[#facc15]">
                    {fbStatus.projectId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Database Endpoint:</span>
                  <span className="font-mono-tabular text-slate-200 truncate max-w-[240px]">
                    {fbStatus.databaseURL}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Synced Nodes:</span>
                  <span className="font-mono-tabular text-emerald-400">
                    /users · /deposits · /withdrawals · /paymentSettings · /idRequests
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFirebaseModalOpen(true)}
                  className="flex-1 py-3 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs cursor-pointer"
                >
                  Paste / Update Firebase Project Config JSON
                </button>
                {fbStatus.config && (
                  <button
                    type="button"
                    onClick={() => {
                      clearRuntimeFirebaseConfig();
                      onNotify('Switched back to built-in Hybrid Realtime Database mode.');
                    }}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-slate-300 cursor-pointer"
                  >
                    Reset to Default
                  </button>
                )}
              </div>
            </section>

            {/* Right: Customer Exchange ID Requests (`/idRequests`) */}
            <section className="rounded-2xl bg-[#0c111d] border border-white/10 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#facc15]" />
                <h2 className="text-lg font-bold text-white">
                  "Create IDs" Customer Requests (`/idRequests`)
                </h2>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {idRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-[#090d16] border border-white/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">
                        {req.platform} — <span className="text-[#facc15]">{req.preferredUsername}</span>
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        {req.userName} ({req.userEmail}) · Refill: ₹{req.depositAmount.toLocaleString('en-IN')}
                      </div>
                      {req.assignedId && (
                        <div className="text-emerald-400 font-mono-tabular mt-1">
                          Issued ID: {req.assignedId} / Pass: {req.assignedPassword}
                        </div>
                      )}
                    </div>

                    {req.status === 'Pending' ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await adminResolveIdRequest(req.id, 'Created');
                          onNotify(`Issued ${req.platform} ID for ${req.userName}!`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold cursor-pointer shrink-0"
                      >
                        Approve & Issue ID
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-bold">{req.status}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* ====================================================================
       * MODAL: ADD / DEDUCT CUSTOMER WALLET BALANCE
       * ==================================================================== */}
      {adjustingUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#0c111d] border border-[#facc15]/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                Adjust Wallet Balance — {adjustingUser.name}
              </h3>
              <button
                type="button"
                onClick={() => setAdjustingUser(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#090d16] border border-white/10 text-xs flex justify-between">
              <span className="text-slate-400">Current Balance:</span>
              <span className="font-mono-tabular font-bold text-[#facc15]">
                ₹{adjustingUser.walletBalance.toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <label
                htmlFor="admin-adjust-amount"
                className="block text-xs text-slate-300 mb-1"
              >
                Enter Amount (₹)
              </label>
              <input
                id="admin-adjust-amount"
                type="number"
                min={1}
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 font-mono-tabular font-bold text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={async () => {
                  const amt = Math.abs(Number(adjustAmount) || 0);
                  const next = await adminAdjustUserBalance(adjustingUser.uid, amt);
                  onNotify(
                    `Added ₹${amt.toLocaleString('en-IN')} to ${adjustingUser.name}'s wallet (New Balance: ₹${next.toLocaleString('en-IN')}).`
                  );
                  setAdjustingUser(null);
                }}
                className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Balance (+₹{adjustAmount})</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const amt = Math.abs(Number(adjustAmount) || 0);
                  const next = await adminAdjustUserBalance(adjustingUser.uid, -amt);
                  onNotify(
                    `Deducted ₹${amt.toLocaleString('en-IN')} from ${adjustingUser.name}'s wallet (New Balance: ₹${next.toLocaleString('en-IN')}).`
                  );
                  setAdjustingUser(null);
                }}
                className="py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
                <span>Deduct (-₹{adjustAmount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
       * MODAL: DEPOSIT SCREENSHOT PREVIEW
       * ==================================================================== */}
      {previewDeposit && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#0c111d] border border-white/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                UTR: {previewDeposit.utr} · ₹{previewDeposit.amount.toLocaleString('en-IN')}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewDeposit(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl bg-white p-3 flex items-center justify-center max-h-80 overflow-hidden">
              <img
                src={previewDeposit.screenshotUrl || DEFAULT_QR_SVG_DATA_URI}
                alt="Payment Proof"
                referrerPolicy="no-referrer"
                className="max-h-72 object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
       * MODAL: FIREBASE CONFIG SETUP / HYBRID SWITCHER
       * ==================================================================== */}
      {isFirebaseModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="fb-config-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85"
        >
          <div className="w-full max-w-lg rounded-3xl bg-[#0c111d] border border-[#facc15]/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="fb-config-modal-title" className="font-shark italic font-black text-xl text-white">
                FIREBASE REALTIME DB CONFIG SETUP
              </h3>
              <button
                type="button"
                onClick={() => setIsFirebaseModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Paste your Firebase Web App config object (`apiKey`, `authDomain`, `databaseURL`, `projectId`) below to switch live to your own Firebase Realtime Database project.
            </p>

            {firebaseConfigError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs">
                {firebaseConfigError}
              </div>
            )}

            <form onSubmit={handleSaveFirebaseConfig} className="space-y-4">
              <textarea
                rows={7}
                placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-app.firebaseapp.com",\n  "databaseURL": "https://your-app-default-rtdb.firebaseio.com",\n  "projectId": "your-app"\n}`}
                value={firebaseRawJson}
                onChange={(e) => setFirebaseRawJson(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-[#090d16] border border-white/15 font-mono-tabular text-xs text-white focus:outline-none focus:border-[#facc15]"
              />

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFirebaseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs cursor-pointer"
                >
                  Connect & Sync Firebase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
