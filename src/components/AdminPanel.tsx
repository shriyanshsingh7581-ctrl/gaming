import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  DepositRecord,
  WithdrawalRecord,
  IdRequestRecord,
  PaymentSettings,
  BannerSlide,
  StaffMember,
  ChatThread,
  ChatMessage,
  computeAdminSummaryStats,
  computeTotalAdminUnreadChats,
  parseFirebaseConfigSnippet,
  verifyMasterAdminPin,
  verifyStaffCredentials,
  MASTER_ADMIN_PIN,
} from '../utils/exchangeLogic';
import {
  adminAdjustUserBalance,
  adminToggleUserStatus,
  adminResolveDeposit,
  adminResolveWithdrawal,
  adminResolveIdRequest,
  adminSavePaymentSettings,
  adminCreateStaffAccount,
  adminChangeStaffPassword,
  adminToggleStaffStatus,
  panelCreateCustomerUserAndExchangeId,
  sendAdminChatMessage,
  markChatThreadRead,
  getFirebaseConnectionStatus,
  saveRuntimeFirebaseConfig,
  clearRuntimeFirebaseConfig,
  DEFAULT_QR_SVG_DATA_URI,
} from '../firebase';
import { OfficialWhatsAppLogoSvg } from './LiveChatWidget';
import {
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
  Plus,
  Minus,
  KeyRound,
  X,
  UserPlus,
  ShieldAlert,
  UserCheck,
  LogOut,
  MessageCircle,
  Send,
} from 'lucide-react';

interface AdminPanelProps {
  users: UserProfile[];
  deposits: DepositRecord[];
  withdrawals: WithdrawalRecord[];
  idRequests: IdRequestRecord[];
  paymentSettings: PaymentSettings;
  banners: BannerSlide[];
  staffList: StaffMember[];
  chatsMap: Record<string, ChatThread>;
  initialLoginMode?: 'master' | 'staff';
  onBackToLobby: () => void;
  onNotify: (msg: string) => void;
}

type AdminTab =
  | 'customers'
  | 'withdrawals'
  | 'deposits'
  | 'payment'
  | 'firebase'
  | 'chat'
  | 'staff';

const ADMIN_QUICK_REPLIES = [
  'Hello! Mohit A1 Support here, how can we help you today?',
  'Your Deposit UTR is verified & Wallet Balance has been credited ✅',
  'Your Gaming Exchange ID & Password has been created! Check My Wallet 🔑',
  'Your Withdrawal request has been approved & transferred via UPI ✅',
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  deposits,
  withdrawals,
  idRequests,
  paymentSettings,
  staffList,
  chatsMap,
  initialLoginMode = 'master',
  onBackToLobby,
  onNotify,
}) => {
  // Login Gate State
  const [loginTab, setLoginTab] = useState<'master' | 'staff'>(initialLoginMode);
  const [activeRole, setActiveRole] = useState<'none' | 'master' | 'staff'>('none');
  const [loggedInStaff, setLoggedInStaff] = useState<StaffMember | null>(null);

  // Master Admin PIN Input (`4455`)
  const [pinInput, setPinInput] = useState<string>('');
  // Staff Login Inputs (`Mohit A1`/`1122`, `staff2`/`2233`)
  const [staffIdInput, setStaffIdInput] = useState<string>('');
  const [staffPassInput, setStaffPassInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<AdminTab>('customers');

  useEffect(() => {
    setLoginTab(initialLoginMode);
  }, [initialLoginMode]);

  // Keep Payment Settings form synced when paymentSettings updates from Firebase
  const [upiId, setUpiId] = useState<string>(paymentSettings.upiId);
  const [merchantName, setMerchantName] = useState<string>(paymentSettings.merchantName);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>(paymentSettings.qrCodeUrl);
  const [bankName, setBankName] = useState<string>(paymentSettings.bankName);
  const [accountHolder, setAccountHolder] = useState<string>(paymentSettings.accountHolder);
  const [accountNumber, setAccountNumber] = useState<string>(paymentSettings.accountNumber);
  const [ifsc, setIfsc] = useState<string>(paymentSettings.ifsc);

  useEffect(() => {
    setUpiId(paymentSettings.upiId);
    setMerchantName(paymentSettings.merchantName);
    setQrCodeUrl(paymentSettings.qrCodeUrl);
    setBankName(paymentSettings.bankName);
    setAccountHolder(paymentSettings.accountHolder);
    setAccountNumber(paymentSettings.accountNumber);
    setIfsc(paymentSettings.ifsc);
  }, [paymentSettings]);

  // Tab 1: Search & Balance Adjust State
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [adjustingUser, setAdjustingUser] = useState<UserProfile | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('1000');

  // Create Customer User ID / Gaming Exchange ID Modal (Available to Staff & Master Admin)
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustEmail, setNewCustEmail] = useState<string>('');
  const [newCustPassword, setNewCustPassword] = useState<string>('');
  const [newCustBalance, setNewCustBalance] = useState<string>('0');
  const [newCustPlatform, setNewCustPlatform] = useState<string>('SHARK EXCH VIP PRO');
  const [newExchUsername, setNewExchUsername] = useState<string>('');
  const [newExchPassword, setNewExchPassword] = useState<string>('');

  // Tab 3: Screenshot Preview Modal
  const [previewDeposit, setPreviewDeposit] = useState<DepositRecord | null>(null);

  // Tab 5: Firebase Config Setup Modal / Editor State
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);
  const [firebaseRawJson, setFirebaseRawJson] = useState<string>('');
  const [firebaseConfigError, setFirebaseConfigError] = useState<string>('');

  // Tab: Live Messenger Chat (`/chats/{userId}`) State
  const [selectedChatUserId, setSelectedChatUserId] = useState<string>('usr_demo_aarav');
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [adminReplyText, setAdminReplyText] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Tab 6 (Master Admin Only): Manage Staff State
  const [newStaffId, setNewStaffId] = useState<string>('');
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffPassword, setNewStaffPassword] = useState<string>('');
  const [editingStaffPassId, setEditingStaffPassId] = useState<string | null>(null);
  const [updatedStaffPass, setUpdatedStaffPass] = useState<string>('');

  const summary = computeAdminSummaryStats(users, deposits, withdrawals);
  const fbStatus = getFirebaseConnectionStatus();
  const isMasterAdmin = activeRole === 'master';
  const isStaff = activeRole === 'staff';

  const chatThreadsList = Object.values(chatsMap || {}).sort(
    (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
  );
  const totalAdminUnread = computeTotalAdminUnreadChats(chatThreadsList);

  const activeChatThread: ChatThread | undefined =
    chatsMap[selectedChatUserId] || chatThreadsList[0];

  useEffect(() => {
    if (!selectedChatUserId && chatThreadsList.length > 0) {
      setSelectedChatUserId(chatThreadsList[0].userId);
    }
  }, [chatThreadsList, selectedChatUserId]);

  useEffect(() => {
    if (activeTab === 'chat' && activeChatThread && activeChatThread.unreadForAdmin > 0) {
      void markChatThreadRead({ userId: activeChatThread.userId, viewer: 'admin' });
    }
  }, [activeTab, activeChatThread]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, activeChatThread?.lastTimestamp]);

  /* ---------------- LOGIN HANDLERS ---------------- */
  const handleMasterUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyMasterAdminPin(pinInput)) {
      setActiveRole('master');
      setLoggedInStaff(null);
      setAuthError('');
    } else {
      setAuthError(`Incorrect PIN. Master Admin PIN is ${MASTER_ADMIN_PIN}`);
    }
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = verifyStaffCredentials(staffList, staffIdInput, staffPassInput);
    if (!res.valid || !res.staff) {
      setAuthError(res.error || 'Invalid Staff credentials.');
      return;
    }
    setActiveRole('staff');
    setLoggedInStaff(res.staff);
    setAuthError('');
    if (activeTab === 'staff') {
      setActiveTab('customers');
    }
  };

  const handlePanelLogout = () => {
    setActiveRole('none');
    setLoggedInStaff(null);
    setPinInput('');
    setStaffIdInput('');
    setStaffPassInput('');
    setAuthError('');
  };

  const handleSendAdminReply = async (textOverride?: string) => {
    const targetThread = activeChatThread;
    const text = (textOverride ?? adminReplyText).trim();
    if (!targetThread || !text) return;

    const senderLabel = isMasterAdmin
      ? 'Master Admin · Support'
      : `${loggedInStaff?.name || 'Mohit A1'} · Live Support`;

    await sendAdminChatMessage({
      userId: targetThread.userId,
      userName: targetThread.userName,
      userEmail: targetThread.userEmail,
      senderName: senderLabel,
      text,
    });
    if (!textOverride) {
      setAdminReplyText('');
    }
  };

  /* ============================================================================
   * MASTER ADMIN (4455) & STAFF (Mohit A1 / 1122) LOGIN GATE SCREEN
   * ============================================================================ */
  if (activeRole === 'none') {
    const primaryStaff =
      staffList.find(
        (s) =>
          s.name.toLowerCase() === 'mohit a1' ||
          s.staffId.toLowerCase() === 'mohit a1' ||
          s.staffId.toLowerCase() === 'mohita1'
      ) || staffList[0];

    return (
      <div className="min-h-screen bg-[#070a10] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-[#0c111d] border border-[#facc15]/40 shadow-2xl overflow-hidden">
          <div className="bg-[#facc15] px-6 py-4 flex items-center justify-between text-[#090d16]">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 stroke-[2.5]" />
              <span className="font-shark italic font-black text-xl">
                {loginTab === 'master'
                  ? 'MASTER OWNER ADMIN GATE'
                  : 'STAFF ADMIN PANEL (MOHIT A1)'}
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

          {/* Role Switcher Tabs: Master Admin vs Staff Login */}
          <div className="grid grid-cols-2 gap-2 p-2 bg-[#090d16] border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                setLoginTab('master');
                setAuthError('');
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                loginTab === 'master'
                  ? 'bg-[#facc15] text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Master Admin (4455)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginTab('staff');
                setAuthError('');
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                loginTab === 'staff'
                  ? 'bg-[#facc15] text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Staff Login (Mohit A1)</span>
            </button>
          </div>

          {loginTab === 'master' ? (
            /* MASTER ADMIN LOGIN FORM (PIN: 4455) */
            <form onSubmit={handleMasterUnlock} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-[#facc15]/10 border border-[#facc15]/30 text-center">
                <p className="text-xs font-bold text-[#facc15]">
                  Master Admin PIN: 4455
                </p>
              </div>

              {authError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs text-center font-semibold"
                >
                  {authError}
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
                  placeholder="4455"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#090d16] border border-white/15 text-center font-mono-tabular font-black text-2xl tracking-[0.35em] text-[#facc15] focus:outline-none focus:border-[#facc15]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPinInput('4455');
                    setActiveRole('master');
                    setAuthError('');
                  }}
                  className="py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer"
                >
                  Auto-Fill PIN (4455)
                </button>
                <button
                  type="submit"
                  className="py-3 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-sm cursor-pointer"
                >
                  Unlock Master Admin
                </button>
              </div>
            </form>
          ) : (
            /* STAFF LOGIN FORM (Default: Mohit A1 / 1122) */
            <form onSubmit={handleStaffLogin} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-center space-y-1">
                <p className="text-xs font-bold text-sky-300">
                  Staff Name / ID: <span className="font-mono-tabular text-[#facc15]">Mohit A1</span> · Password:{' '}
                  <span className="font-mono-tabular text-[#facc15]">
                    {primaryStaff?.password || '1122'}
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">
                  🔒 UPI QR Code &amp; Bank Details are strictly Read-Only for Staff
                </p>
              </div>

              {authError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs text-center font-semibold"
                >
                  {authError}
                </div>
              )}

              <div>
                <label
                  htmlFor="staff-id-input"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Staff Name / ID
                </label>
                <input
                  id="staff-id-input"
                  type="text"
                  required
                  placeholder="Mohit A1"
                  value={staffIdInput}
                  onChange={(e) => setStaffIdInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular text-sm focus:outline-none focus:border-[#facc15]"
                />
              </div>

              <div>
                <label
                  htmlFor="staff-pass-input"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Staff Password
                </label>
                <input
                  id="staff-pass-input"
                  type="password"
                  required
                  placeholder="1122"
                  value={staffPassInput}
                  onChange={(e) => setStaffPassInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular text-sm focus:outline-none focus:border-[#facc15]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-sm cursor-pointer"
              >
                Login as Mohit A1 (Staff Panel)
              </button>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const passToUse = primaryStaff?.password || '1122';
                    const res = verifyStaffCredentials(staffList, 'Mohit A1', passToUse);
                    if (res.valid && res.staff) {
                      setActiveRole('staff');
                      setLoggedInStaff(res.staff);
                    }
                  }}
                  className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-[#facc15] cursor-pointer"
                >
                  ⚡ Quick Login: Mohit A1 (Pass: {primaryStaff?.password || '1122'})
                </button>
              </div>
            </form>
          )}
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
    if (!isMasterAdmin) return;
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
    if (!isMasterAdmin) {
      onNotify('Locked: Only Master Admin can change UPI QR Code & Bank Account Details.');
      return;
    }
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
    onNotify(
      'Saved to Firebase! Live QR Code, UPI ID & Bank Details updated across all customer devices.'
    );
  };

  const handleCreateCustomerAndId = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { user, idRecord } = await panelCreateCustomerUserAndExchangeId({
        name: newCustName,
        phone: newCustPhone,
        email: newCustEmail,
        password: newCustPassword,
        initialWalletBalance: Number(newCustBalance) || 0,
        platform: newCustPlatform,
        exchangeUsername: newExchUsername,
        exchangePassword: newExchPassword,
      });
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
      setNewCustPassword('');
      setNewCustBalance('0');
      setNewExchUsername('');
      setNewExchPassword('');
      setIsCreateUserModalOpen(false);
      onNotify(
        `Created Customer "${user.name}" & Exchange ID "${idRecord.assignedId}" in Firebase!`
      );
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Failed to create user ID.');
    }
  };

  const handleCreateNewStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMasterAdmin) return;
    try {
      const created = await adminCreateStaffAccount({
        staffId: newStaffId,
        name: newStaffName,
        password: newStaffPassword,
      });
      setNewStaffId('');
      setNewStaffName('');
      setNewStaffPassword('');
      onNotify(`Created Staff Account "${created.name}" (ID: ${created.staffId})!`);
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Failed to create staff.');
    }
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
      {/* Top Header */}
      <header className="bg-[#090d16] border-b border-white/10 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#facc15] text-black flex items-center justify-center font-shark italic font-black text-lg">
            SX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-shark italic font-black text-xl sm:text-2xl tracking-wide text-white">
                SHARK <span className="text-[#facc15]">EXCH</span> ·{' '}
                {isMasterAdmin
                  ? 'MASTER OWNER ADMIN PANEL'
                  : `STAFF PANEL (${loggedInStaff?.name || 'Mohit A1'})`}
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              🟢 Connected to Firebase Realtime DB ({fbStatus.projectId}) ·{' '}
              {isMasterAdmin ? (
                <span>
                  Master Admin Full Access (PIN: <span className="font-mono-tabular text-[#facc15]">4455</span>)
                </span>
              ) : (
                <span className="text-sky-300">
                  Logged in as <strong>{loggedInStaff?.name || 'Mohit A1'}</strong> · QR &amp; Bank Settings Locked 🔒
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Jump to In-App Live Messenger Chat */}
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            data-testid="header-live-chat-btn"
            className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow"
          >
            <OfficialWhatsAppLogoSvg className="w-4 h-4 text-black" />
            <span>Live Messenger Chat</span>
            {totalAdminUnread > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white font-mono-tabular font-black text-[10px]">
                {totalAdminUnread}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsCreateUserModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Create Customer / Exchange ID</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const linkPath = isStaff ? '/staff' : '/admin';
              const fullUrl = `${window.location.origin}${linkPath}`;
              navigator.clipboard?.writeText(fullUrl).catch(() => {});
              onNotify(`Copied Link: ${fullUrl}`);
            }}
            className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-xs font-bold text-emerald-300 cursor-pointer"
          >
            🔗 Copy {isStaff ? 'Staff (/staff)' : 'Admin (/admin)'} Link
          </button>

          {isMasterAdmin && (
            <button
              type="button"
              onClick={() => setIsFirebaseModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-[#facc15]" />
              <span>Firebase Config</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePanelLogout}
            className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-bold text-red-300 flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Role / Logout</span>
          </button>

          <button
            type="button"
            onClick={onBackToLobby}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
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

        {/* Admin & Staff Navigation Tabs */}
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
            <span>
              4. Change QR Code &amp; Bank Details {isStaff ? '🔒' : ''}
            </span>
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
            <KeyRound className="w-4 h-4" />
            <span>5. Exchange IDs &amp; Firebase ({idRequests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            data-testid="tab-live-messenger-chat"
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'chat'
                ? 'bg-[#25D366] text-black'
                : 'text-emerald-300 hover:text-white bg-emerald-500/10 border border-emerald-500/30'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Live Messenger Chat ({chatThreadsList.length})</span>
            {totalAdminUnread > 0 && (
              <span
                data-testid="admin-chat-unread-badge"
                className="px-1.5 py-0.5 rounded-full bg-red-600 text-white font-mono-tabular font-black text-[10px]"
              >
                {totalAdminUnread}
              </span>
            )}
          </button>

          {isMasterAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'staff'
                  ? 'bg-[#facc15] text-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>6. Manage Staff ({staffList.length})</span>
            </button>
          )}
        </nav>

        {/* ====================================================================
         * TAB 1: REGISTERED CUSTOMERS DATA (`/users`) + CREATE CUSTOMER ID
         * ==================================================================== */}
        {activeTab === 'customers' && (
          <section className="rounded-2xl bg-[#0c111d] border border-white/10 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Registered Customers Data (`/users`)
                </h2>
                <p className="text-xs text-slate-400">
                  Live searchable directory of all customer accounts. Both Master Admin and Staff ({loggedInStaff?.name || 'Mohit A1'}) can create new Customer User IDs &amp; Gaming Exchange IDs.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Create Customer User ID</span>
                </button>

                <div className="relative w-full sm:w-64">
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
                    <th className="py-3 px-3 text-right">Actions</th>
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
                              setSelectedChatUserId(u.uid);
                              setActiveTab('chat');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-emerald-300 font-bold text-xs cursor-pointer whitespace-nowrap"
                          >
                            💬 Message
                          </button>
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
                Approve &amp; Mark Paid after transferring payout, or Reject to automatically refund the amount back to the customer's Firebase wallet.
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
                            ✅ Approve &amp; Mark Paid
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
                            ❌ Reject &amp; Refund Balance
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
                Verify customer 12-digit UTR numbers and screenshots. Clicking Approve &amp; Credit Wallet automatically adds the deposit amount to `/users/&#123;uid&#125;/walletBalance`.
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
                            ✅ Approve &amp; Credit Wallet
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
         * STRICTLY LOCKED FOR STAFF (Mohit A1) — MASTER ADMIN (4455) ONLY
         * ==================================================================== */}
        {activeTab === 'payment' && (
          <section className="rounded-2xl bg-[#0c111d] border border-white/10 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Admin Payment Settings / Change UPI QR Code &amp; Bank Details (`/paymentSettings`)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Live UPI QR code and bank settlement account displayed on customer Deposit screens.
                </p>
              </div>
            </div>

            {isStaff && (
              <div
                role="alert"
                data-testid="staff-payment-lock-notice"
                className="p-4 rounded-2xl bg-red-500/15 border-2 border-red-500/50 flex items-center gap-3 text-red-200"
              >
                <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-extrabold text-red-300">
                    🔒 Locked: Only Master Admin can change UPI QR Code &amp; Bank Account Details.
                  </p>
                  <p className="text-xs text-red-200/80 mt-0.5">
                    You are logged in as Staff ({loggedInStaff?.name || 'Mohit A1'}). All payment settings below are strictly Read-Only.
                  </p>
                </div>
              </div>
            )}

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

                {isMasterAdmin ? (
                  <>
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
                  </>
                ) : (
                  <div className="w-full py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-400">
                    🔒 QR Image Upload Locked for Staff ({loggedInStaff?.name || 'Mohit A1'})
                  </div>
                )}
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
                      disabled={!isMasterAdmin}
                      readOnly={!isMasterAdmin}
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular text-sm focus:outline-none focus:border-[#facc15] disabled:opacity-60 disabled:cursor-not-allowed"
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
                      disabled={!isMasterAdmin}
                      readOnly={!isMasterAdmin}
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15] disabled:opacity-60 disabled:cursor-not-allowed"
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
                      disabled={!isMasterAdmin}
                      readOnly={!isMasterAdmin}
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15] disabled:opacity-60 disabled:cursor-not-allowed"
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
                      disabled={!isMasterAdmin}
                      readOnly={!isMasterAdmin}
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15] disabled:opacity-60 disabled:cursor-not-allowed"
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
                      disabled={!isMasterAdmin}
                      readOnly={!isMasterAdmin}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular text-sm focus:outline-none focus:border-[#facc15] disabled:opacity-60 disabled:cursor-not-allowed"
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
                      disabled={!isMasterAdmin}
                      readOnly={!isMasterAdmin}
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular text-sm uppercase focus:outline-none focus:border-[#facc15] disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {isMasterAdmin ? (
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-sm tracking-wide shadow-lg cursor-pointer"
                  >
                    💾 Save to Firebase (`/paymentSettings`)
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 rounded-xl bg-white/5 border border-red-500/30 text-red-300 font-bold text-xs cursor-not-allowed"
                  >
                    🔒 Locked: Only Master Admin can change UPI QR Code &amp; Bank Account Details.
                  </button>
                )}
              </div>
            </form>
          </section>
        )}

        {/* ====================================================================
         * TAB 5: EXCHANGE ID REQUESTS & FIREBASE CONNECTION
         * ==================================================================== */}
        {activeTab === 'firebase' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Customer Exchange ID Requests (`/idRequests`) */}
            <section className="rounded-2xl bg-[#0c111d] border border-white/10 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#facc15]" />
                  <h2 className="text-lg font-bold text-white">
                    Customer Exchange IDs (`/idRequests`)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs cursor-pointer"
                >
                  + Create New Exchange ID
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {idRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-[#090d16] border border-white/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">
                        {req.platform} —{' '}
                        <span className="text-[#facc15]">{req.preferredUsername}</span>
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        {req.userName} ({req.userEmail}) · Refill: ₹
                        {req.depositAmount.toLocaleString('en-IN')}
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
                        Approve &amp; Issue ID
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-bold">{req.status}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Right: Firebase Connection Status */}
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
                    /users · /deposits · /withdrawals · /paymentSettings · /idRequests · /staff · /chats
                  </span>
                </div>
              </div>

              {isMasterAdmin && (
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
              )}
            </section>
          </div>
        )}

        {/* ====================================================================
         * TAB: IN-APP LIVE MESSENGER CHAT (`/chats/{userId}`) — ADMIN & STAFF
         * ==================================================================== */}
        {activeTab === 'chat' && (
          <section
            aria-label="In-App Live Messenger Chat"
            className="rounded-2xl bg-[#0c111d] border border-white/10 overflow-hidden grid grid-cols-1 lg:grid-cols-[320px_1fr] min-h-[540px]"
          >
            {/* Left Sidebar: Customer Conversations List */}
            <div className="bg-[#090d16] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col">
              <div className="p-4 border-b border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <OfficialWhatsAppLogoSvg className="w-5 h-5 text-[#25D366]" />
                    <h2 className="font-bold text-sm text-white">
                      In-App Customer Chats (`/chats`)
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono-tabular text-emerald-400">
                    {chatThreadsList.length} Threads
                  </span>
                </div>
                <input
                  type="search"
                  placeholder="Search customer chat..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c111d] border border-white/15 text-xs text-white focus:outline-none focus:border-[#25D366]"
                />
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-white/5 max-h-[460px]">
                {chatThreadsList
                  .filter((t) => {
                    const q = chatSearchQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      t.userName.toLowerCase().includes(q) ||
                      t.userEmail.toLowerCase().includes(q) ||
                      t.lastMessage.toLowerCase().includes(q)
                    );
                  })
                  .map((thread) => {
                    const isSelected = activeChatThread?.userId === thread.userId;
                    return (
                      <button
                        key={thread.userId}
                        type="button"
                        onClick={() => {
                          setSelectedChatUserId(thread.userId);
                          if (thread.unreadForAdmin > 0) {
                            void markChatThreadRead({
                              userId: thread.userId,
                              viewer: 'admin',
                            });
                          }
                        }}
                        className={`w-full p-3.5 text-left flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#25D366]/15 border-l-4 border-[#25D366]'
                            : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white truncate">
                              {thread.userName}
                            </span>
                            {thread.unreadForAdmin > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white font-mono-tabular font-black text-[10px]">
                                {thread.unreadForAdmin} new
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {thread.lastMessage}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono-tabular text-slate-500 shrink-0">
                          {new Date(thread.lastTimestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Right Pane: Active Customer Conversation & Reply Box */}
            {activeChatThread ? (
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                <div className="px-5 py-3.5 bg-[#090d16] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {activeChatThread.userName}
                      </span>
                      <span className="text-xs text-sky-400">
                        ({activeChatThread.userEmail || activeChatThread.userId})
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-400">
                      🟢 In-App Messenger Connected · Admin Phone Number Hidden for Privacy
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreateUserModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs cursor-pointer"
                  >
                    + Issue Exchange ID for Customer
                  </button>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#070a10] max-h-[340px]">
                  {(Object.values(activeChatThread.messages || {}) as ChatMessage[])
                    .sort(
                      (a, b) =>
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    )
                    .map((m) => {
                      const isAdminMsg = m.sender === 'admin';
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${
                            isAdminMsg ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                              isAdminMsg
                                ? 'bg-[#facc15] text-black font-semibold rounded-br-xs'
                                : 'bg-[#141c2e] border border-white/10 text-white rounded-bl-xs'
                            }`}
                          >
                            <span
                              className={`block text-[10px] font-extrabold mb-0.5 ${
                                isAdminMsg ? 'text-black/75' : 'text-[#25D366]'
                              }`}
                            >
                              {m.senderName}
                            </span>
                            <p className="whitespace-pre-wrap break-words">{m.text}</p>
                          </div>
                          <span className="text-[10px] text-slate-500 mt-0.5 px-1 font-mono-tabular">
                            {new Date(m.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      );
                    })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Quick Admin / Staff Reply Chips */}
                <div className="px-4 py-2 bg-[#090d16] border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {ADMIN_QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => void handleSendAdminReply(reply)}
                      className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#facc15]/20 border border-white/15 hover:border-[#facc15] text-[11px] font-semibold text-slate-200 whitespace-nowrap cursor-pointer"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                {/* Reply Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSendAdminReply();
                  }}
                  className="p-3.5 bg-[#0c111d] border-t border-white/10 flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    data-testid="admin-chat-reply-input"
                    placeholder={`Reply as ${
                      isMasterAdmin
                        ? 'Master Admin'
                        : loggedInStaff?.name || 'Mohit A1'
                    }...`}
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-xs text-white focus:outline-none focus:border-[#facc15]"
                  />
                  <button
                    type="submit"
                    data-testid="admin-chat-send-btn"
                    disabled={!adminReplyText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-40 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center justify-center p-12 text-xs text-slate-400">
                Select a customer conversation on the left to start chatting live.
              </div>
            )}
          </section>
        )}

        {/* ====================================================================
         * TAB 6: MANAGE STAFF (`/staff`) — MASTER ADMIN (4455) EXCLUSIVE
         * ==================================================================== */}
        {activeTab === 'staff' && isMasterAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Form: Create New Staff Account */}
            <section className="rounded-2xl bg-[#0c111d] border border-white/10 p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">
                Create New Staff Account
              </h2>
              <p className="text-xs text-slate-400">
                Create additional Staff IDs with custom passwords. Staff can create User IDs, reply to Live Chats, and process requests, while Bank &amp; QR settings remain strictly locked.
              </p>

              <form onSubmit={handleCreateNewStaff} className="space-y-3">
                <div>
                  <label
                    htmlFor="new-staff-id"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Staff Login ID *
                  </label>
                  <input
                    id="new-staff-id"
                    type="text"
                    required
                    placeholder="e.g. staff3"
                    value={newStaffId}
                    onChange={(e) => setNewStaffId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular text-sm focus:outline-none focus:border-[#facc15]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-staff-name"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Staff Display Name *
                  </label>
                  <input
                    id="new-staff-name"
                    type="text"
                    required
                    placeholder="e.g. Rohit B1"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-staff-pass"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Staff Password *
                  </label>
                  <input
                    id="new-staff-pass"
                    type="text"
                    required
                    placeholder="e.g. 3344"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular text-sm focus:outline-none focus:border-[#facc15]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs cursor-pointer"
                >
                  ➕ Create Staff Account
                </button>
              </form>
            </section>

            {/* Right Table: Active & Pre-Configured Staff Accounts (`Mohit A1`, `staff2`, etc.) */}
            <section className="lg:col-span-2 rounded-2xl bg-[#0c111d] border border-white/10 p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Registered Staff Accounts (`/staff`)
                </h2>
                <p className="text-xs text-slate-400">
                  Manage default Staff <strong>Mohit A1</strong> (Pass: 1122) and additional staff members. Change passwords or block/unblock access in real time.
                </p>
              </div>

              <div className="space-y-3">
                {staffList.map((st) => (
                  <div
                    key={st.staffId}
                    className="rounded-2xl bg-[#090d16] border border-white/10 p-4 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {st.name}
                        </span>
                        <span className="text-xs font-mono-tabular px-2 py-0.5 rounded bg-white/5 text-[#facc15]">
                          ID: {st.staffId}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            st.status === 'Active'
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          · {st.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Password:{' '}
                        <span className="font-mono-tabular font-bold text-amber-300">
                          {st.password}
                        </span>{' '}
                        · Bank/QR Access:{' '}
                        <span className="text-red-400 font-semibold">
                          🔒 Strictly Locked
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {editingStaffPassId === st.staffId ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="New pass"
                            value={updatedStaffPass}
                            onChange={(e) => setUpdatedStaffPass(e.target.value)}
                            className="w-28 px-2.5 py-1.5 rounded-lg bg-[#0c111d] border border-[#facc15] text-xs font-mono-tabular text-white"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await adminChangeStaffPassword(
                                  st.staffId,
                                  updatedStaffPass
                                );
                                onNotify(
                                  `Updated password for ${st.name} (${st.staffId}).`
                                );
                                setEditingStaffPassId(null);
                                setUpdatedStaffPass('');
                              } catch (err: unknown) {
                                onNotify(
                                  err instanceof Error
                                    ? err.message
                                    : 'Password update failed.'
                                );
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStaffPassId(null);
                              setUpdatedStaffPass('');
                            }}
                            className="px-2 py-1.5 rounded-lg bg-white/10 text-xs text-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStaffPassId(st.staffId);
                            setUpdatedStaffPass(st.password);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-[#facc15] cursor-pointer"
                        >
                          🔑 Change Password
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          const next = await adminToggleStaffStatus(st.staffId);
                          onNotify(`Staff ${st.name} (${st.staffId}) is now ${next}.`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-300 cursor-pointer"
                      >
                        🚫 {st.status === 'Active' ? 'Block Staff' : 'Unblock Staff'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* ====================================================================
       * MODAL: CREATE NEW CUSTOMER USER ID & GAMING EXCHANGE ID (STAFF + ADMIN)
       * ==================================================================== */}
      {isCreateUserModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-customer-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 overflow-y-auto"
        >
          <div className="w-full max-w-lg rounded-3xl bg-[#0c111d] border border-[#facc15]/40 p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <h3
                id="create-customer-modal-title"
                className="font-shark italic font-black text-xl text-white"
              >
                CREATE CUSTOMER USER ID &amp; EXCHANGE ID
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerAndId} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="panel-cust-name"
                    className="block text-slate-300 font-semibold mb-1"
                  >
                    Customer Full Name *
                  </label>
                  <input
                    id="panel-cust-name"
                    type="text"
                    required
                    placeholder="e.g. Rajesh Verma"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-white/15 text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="panel-cust-phone"
                    className="block text-slate-300 font-semibold mb-1"
                  >
                    Mobile Number *
                  </label>
                  <input
                    id="panel-cust-phone"
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="panel-cust-email"
                    className="block text-slate-300 font-semibold mb-1"
                  >
                    Customer Login Email ID *
                  </label>
                  <input
                    id="panel-cust-email"
                    type="email"
                    required
                    placeholder="customer@sharkexch.in"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-white/15 text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="panel-cust-pass"
                    className="block text-slate-300 font-semibold mb-1"
                  >
                    Customer Login Password *
                  </label>
                  <input
                    id="panel-cust-pass"
                    type="text"
                    required
                    placeholder="e.g. Shark@123"
                    value={newCustPassword}
                    onChange={(e) => setNewCustPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="panel-cust-platform"
                    className="block text-slate-300 font-semibold mb-1"
                  >
                    Gaming Exchange Platform
                  </label>
                  <select
                    id="panel-cust-platform"
                    value={newCustPlatform}
                    onChange={(e) => setNewCustPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-white/15 text-white"
                  >
                    <option value="SHARK EXCH VIP PRO">SHARK EXCH VIP PRO</option>
                    <option value="DIAMOND EXCH 99">DIAMOND EXCH 99</option>
                    <option value="LOTUS 365 EXCHANGE">LOTUS 365 EXCHANGE</option>
                    <option value="SKY EXCH INTERNATIONAL">SKY EXCH INTERNATIONAL</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="panel-cust-balance"
                    className="block text-slate-300 font-semibold mb-1"
                  >
                    Opening Wallet Balance (₹)
                  </label>
                  <input
                    id="panel-cust-balance"
                    type="number"
                    min={0}
                    value={newCustBalance}
                    onChange={(e) => setNewCustBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-white/15 text-[#facc15] font-mono-tabular font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="panel-exch-user"
                    className="block text-slate-300 font-semibold mb-1"
                  >
                    Assigned Exchange ID / Username
                  </label>
                  <input
                    id="panel-exch-user"
                    type="text"
                    placeholder="e.g. SHK99_RAJESH"
                    value={newExchUsername}
                    onChange={(e) => setNewExchUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular"
                  />
                </div>
                <div>
                  <label
                    htmlFor="panel-exch-pass"
                    className="block text-slate-300 font-semibold mb-1"
                  >
                    Assigned Exchange Password
                  </label>
                  <input
                    id="panel-exch-pass"
                    type="text"
                    placeholder="e.g. Vip#9920"
                    value={newExchPassword}
                    onChange={(e) => setNewExchPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold cursor-pointer"
                >
                  Create Customer &amp; Issue ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  Connect &amp; Sync Firebase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
