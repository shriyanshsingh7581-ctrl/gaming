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
  OFFICIAL_EXCHANGE_PLATFORMS,
  OFFICIAL_POSTER_ASSETS,
  CELEBRITY_BANNER_ASSETS,
} from '../utils/exchangeLogic';
import {
  ALL_200_EXCHANGE_GAMES,
  INITIAL_LIVE_SPORTS_MATCHES,
  LiveSportsMatch,
  ExchangeBetTicket,
  formatTeaExchCdnImage,
} from '../utils/teaExchCatalog';
import {
  adminAdjustUserBalance,
  adminToggleUserStatus,
  adminResolveDeposit,
  adminResolveWithdrawal,
  adminResolveIdRequest,
  adminSavePaymentSettings,
  adminSaveBanners,
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
  | 'staff'
  | 'bets';

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
  banners,
  staffList,
  chatsMap,
  initialLoginMode = 'master',
  onBackToLobby,
  onNotify,
}) => {
  // Login Gate State — Strictly separated: `/staff` only shows Staff Login; `/admin` shows Master Admin Login
  const isStrictStaffRoute = initialLoginMode === 'staff';
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
  const [liveTickets, setLiveTickets] = useState<ExchangeBetTicket[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveSportsMatch[]>(
    INITIAL_LIVE_SPORTS_MATCHES
  );
  const [adminGameSearch, setAdminGameSearch] = useState<string>('');

  const fetchAdminRealtimeExchangeData = async () => {
    try {
      const res = await fetch('/api/exchange/realtime-feed');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.allTickets)) {
        setLiveTickets(data.allTickets);
      }
      if (Array.isArray(data.matches) && data.matches.length > 0) {
        setLiveMatches(data.matches);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void fetchAdminRealtimeExchangeData();
    const timer = window.setInterval(() => {
      void fetchAdminRealtimeExchangeData();
    }, 3500);
    return () => window.clearInterval(timer);
  }, []);

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

  // 5 Promotional Posters State (Master Admin Editable: 1 Pre-Login Poster + 4 Post-Login Dashboard Posters)
  const [bannerHeroImageUrl, setBannerHeroImageUrl] = useState<string>(
    banners[0]?.imageUrl || OFFICIAL_POSTER_ASSETS.megaOffer500Poster
  );
  const [postLoginPoster1Url, setPostLoginPoster1Url] = useState<string>(
    banners[1]?.imageUrl || OFFICIAL_POSTER_ASSETS.sexyVipLoungePoster
  );
  const [postLoginPoster2Url, setPostLoginPoster2Url] = useState<string>(
    banners[2]?.imageUrl || OFFICIAL_POSTER_ASSETS.playBetWinPoster
  );
  const [postLoginPoster3Url, setPostLoginPoster3Url] = useState<string>(
    banners[3]?.imageUrl || OFFICIAL_POSTER_ASSETS.gameWinRepeatPoster
  );
  const [postLoginPoster4Url, setPostLoginPoster4Url] = useState<string>(
    banners[4]?.imageUrl || OFFICIAL_POSTER_ASSETS.diveIntoActionPoster
  );
  const [bannerHeadline, setBannerHeadline] = useState<string>(
    banners[0]?.title || '🔥 SHARK EXCHANGE — MEGA OFFER: ₹500 की ID पर ₹500 FREE! 🔥'
  );
  const [bannerSubtitle, setBannerSubtitle] = useState<string>(
    banners[0]?.subtitle ||
      'Deposit ₹500 & Get ₹500 Instant Welcome Bonus Free | 24/7 Instant Refill & Withdrawal'
  );

  useEffect(() => {
    if (banners && banners.length > 0) {
      setBannerHeroImageUrl(
        banners[0]?.imageUrl || OFFICIAL_POSTER_ASSETS.megaOffer500Poster
      );
      setPostLoginPoster1Url(
        banners[1]?.imageUrl || OFFICIAL_POSTER_ASSETS.sexyVipLoungePoster
      );
      setPostLoginPoster2Url(
        banners[2]?.imageUrl || OFFICIAL_POSTER_ASSETS.playBetWinPoster
      );
      setPostLoginPoster3Url(
        banners[3]?.imageUrl || OFFICIAL_POSTER_ASSETS.gameWinRepeatPoster
      );
      setPostLoginPoster4Url(
        banners[4]?.imageUrl || OFFICIAL_POSTER_ASSETS.diveIntoActionPoster
      );
      setBannerHeadline(
        banners[0]?.title || '🔥 SHARK EXCHANGE — MEGA OFFER: ₹500 की ID पर ₹500 FREE! 🔥'
      );
      setBannerSubtitle(
        banners[0]?.subtitle ||
          'Deposit ₹500 & Get ₹500 Instant Welcome Bonus Free | 24/7 Instant Refill & Withdrawal'
      );
    }
  }, [banners]);

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
  const [newCustPlatform, setNewCustPlatform] = useState<string>(
    OFFICIAL_EXCHANGE_PLATFORMS[0].name
  );
  const [newExchUsername, setNewExchUsername] = useState<string>('');
  const [newExchPassword, setNewExchPassword] = useState<string>('');

  // Tab 3: Screenshot Preview Modal
  const [previewDeposit, setPreviewDeposit] = useState<DepositRecord | null>(null);

  // Tab 5: Approve & Create ID Custom User ID / Password Inputs + Firebase Config Setup Modal
  const [approvingIdReqId, setApprovingIdReqId] = useState<string | null>(null);
  const [customIssuedUserId, setCustomIssuedUserId] = useState<string>('');
  const [customIssuedPassword, setCustomIssuedPassword] = useState<string>('');
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
   * STRICTLY SEPARATED LOGIN GATE:
   * - Staff Route (`/staff` or `?staff=true`): ONLY shows Staff Login (Mohit A1). Zero Master Admin tab/reference.
   * - Master Admin Route (`/admin` or `?admin=true`): ONLY shows Master Admin Login (PIN: 4455).
   * ============================================================================ */
  if (activeRole === 'none') {
    const primaryStaff =
      staffList.find(
        (s) =>
          s.name.toLowerCase() === 'mohit a1' ||
          s.staffId.toLowerCase() === 'mohit a1' ||
          s.staffId.toLowerCase() === 'mohita1'
      ) || staffList[0];

    const showStaffForm = isStrictStaffRoute || loginTab === 'staff';

    return (
      <div className="min-h-screen bg-[#070a10] text-white flex flex-col items-center justify-center p-4">
        <div
          data-testid={showStaffForm ? 'staff-only-login-card' : 'master-only-login-card'}
          className="w-full max-w-md rounded-3xl bg-[#0c111d] border border-[#facc15]/40 shadow-2xl overflow-hidden"
        >
          <div className="bg-[#facc15] px-6 py-4 flex items-center justify-between text-[#090d16]">
            <div className="flex items-center gap-2">
              {showStaffForm ? (
                <UserCheck className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <Lock className="w-5 h-5 stroke-[2.5]" />
              )}
              <span className="font-shark italic font-black text-xl">
                {showStaffForm
                  ? 'STAFF LOGIN PANEL (MOHIT A1)'
                  : 'MASTER OWNER ADMIN GATE'}
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

          {!showStaffForm ? (
            /* MASTER ADMIN LOGIN FORM (PIN: 4455) — ONLY ON `/admin` OR `?admin=true` */
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
            /* STAFF LOGIN FORM (Default: Mohit A1 / 1122) — STRICTLY NO MASTER ADMIN TABS OR REFERENCES */
            <form onSubmit={handleStaffLogin} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-center space-y-1">
                <p className="text-xs font-bold text-sky-300">
                  Staff Name / ID: <span className="font-mono-tabular text-[#facc15]">Mohit A1</span> · Password:{' '}
                  <span className="font-mono-tabular text-[#facc15]">
                    {primaryStaff?.password || '1122'}
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">
                  🔒 Authorised Staff Portal · QR &amp; Payment Settings are Read-Only
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

  const handlePosterUploadForSlot = (
    slotIndex: 0 | 1 | 2 | 3 | 4,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!isMasterAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (slotIndex === 0) setBannerHeroImageUrl(reader.result);
        if (slotIndex === 1) setPostLoginPoster1Url(reader.result);
        if (slotIndex === 2) setPostLoginPoster2Url(reader.result);
        if (slotIndex === 3) setPostLoginPoster3Url(reader.result);
        if (slotIndex === 4) setPostLoginPoster4Url(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFrontBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMasterAdmin) return;
    const nextBanners: BannerSlide[] = [
      {
        id: 'banner-prelogin-mega-offer',
        tag: 'SHARK EXCHANGE — MEGA OFFER',
        title:
          bannerHeadline.trim() ||
          '🔥 SHARK EXCHANGE — MEGA OFFER: ₹500 की ID पर ₹500 FREE! 🔥',
        subtitle:
          bannerSubtitle.trim() ||
          'Deposit ₹500 & Get ₹500 Instant Welcome Bonus Free | 24/7 Instant Refill & Withdrawal',
        ctaText: 'Sign Up / Login',
        accentColor: '#facc15',
        imageUrl: bannerHeroImageUrl.trim() || OFFICIAL_POSTER_ASSETS.megaOffer500Poster,
        secondaryImageUrl:
          postLoginPoster1Url.trim() || OFFICIAL_POSTER_ASSETS.sexyVipLoungePoster,
      },
      {
        id: 'banner-postlogin-1',
        tag: 'SHARKVIP #PLAYSAFE',
        title: 'Sexy VIP LIVE LOUNGE — SHARKVIP #PLAYSAFE',
        subtitle: 'Exclusive VIP Live Lounge · Instant Exchange IDs & 24/7 Direct Withdrawal',
        ctaText: 'Create ID',
        accentColor: '#ec4899',
        imageUrl: postLoginPoster1Url.trim() || OFFICIAL_POSTER_ASSETS.sexyVipLoungePoster,
      },
      {
        id: 'banner-postlogin-2',
        tag: 'PLAY • BET • WIN',
        title: 'SHARK EXCHANGE — Ultimate Gaming Destination: PLAY • BET • WIN',
        subtitle: 'Sports Betting · Live Casino · Casino Games · Virtual Games',
        ctaText: 'Play Now',
        accentColor: '#facc15',
        imageUrl: postLoginPoster2Url.trim() || OFFICIAL_POSTER_ASSETS.playBetWinPoster,
      },
      {
        id: 'banner-postlogin-3',
        tag: 'NEXT-LEVEL GAMING',
        title: 'SHARK EXCHANGE — Game. Win. Repeat. Experience Next-Level Online Gaming',
        subtitle: 'Fast Play · Safe & Secure · 24/7 Support',
        ctaText: 'Start Playing Now',
        accentColor: '#f43f5e',
        imageUrl: postLoginPoster3Url.trim() || OFFICIAL_POSTER_ASSETS.gameWinRepeatPoster,
      },
      {
        id: 'banner-postlogin-4',
        tag: 'PREMIUM GAMING PLATFORM',
        title: 'SHARK EXCHANGE — DIVE INTO REAL GAMING ACTION',
        subtitle: 'Casino Games · Live Casino · Sports Betting · Virtual Games',
        ctaText: 'Play Now',
        accentColor: '#38bdf8',
        imageUrl: postLoginPoster4Url.trim() || OFFICIAL_POSTER_ASSETS.diveIntoActionPoster,
      },
    ];
    await adminSaveBanners(nextBanners);
    onNotify('Updated all 5 Promotional Posters (Pre-Login & Post-Login) in Firebase!');
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

          {isMasterAdmin ? (
            <button
              type="button"
              onClick={() => {
                const fullUrl = `${window.location.origin}/admin`;
                navigator.clipboard?.writeText(fullUrl).catch(() => {});
                onNotify(`Copied Master Admin Link: ${fullUrl}`);
              }}
              className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-xs font-bold text-emerald-300 cursor-pointer"
            >
              🔗 Copy Master Link (/admin)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const fullUrl = `${window.location.origin}/staff`;
                navigator.clipboard?.writeText(fullUrl).catch(() => {});
                onNotify(`Copied Staff Login Link: ${fullUrl}`);
              }}
              className="px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-xs font-bold text-sky-300 cursor-pointer"
            >
              🔗 Copy Staff Link (/staff)
            </button>
          )}

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
            <span>Logout</span>
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
            data-testid="tab-id-requests"
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'firebase'
                ? 'bg-[#facc15] text-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>5. ID Requests / Create IDs ({idRequests.length})</span>
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

          <button
            type="button"
            data-testid="tab-live-bets-and-games"
            onClick={() => setActiveTab('bets')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'bets'
                ? 'bg-[#facc15] text-black'
                : 'text-amber-300 hover:text-white bg-amber-500/10 border border-amber-500/30'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>
              7. Live Bet Tickets &amp; 200 Games ({liveTickets.length})
            </span>
          </button>
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
                  {filteredCustomers.map((u, idx) => (
                    <tr key={`cust-${u.uid || idx}-${idx}`} className="hover:bg-white/[0.02]">
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
                withdrawals.map((w, idx) => (
                  <div
                    key={`wdr-${w.id || idx}-${idx}`}
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
                deposits.map((d, idx) => (
                  <div
                    key={`dep-${d.id || idx}-${idx}`}
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

            {/* Master Admin 5 Promotional Posters Editor (Pre-Login Mega Offer + 4 Post-Login Dashboard Posters) */}
            {isMasterAdmin && (
              <form
                onSubmit={handleSaveFrontBanner}
                className="pt-6 border-t border-white/10 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#facc15]">
                      🎬 Promotional Posters &amp; Mega Offer Editor (`/banners` — 5 Posters)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Upload or update the Pre-Login Front Page Mega Offer Poster and the 4 Post-Login Dashboard Posters anytime.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pre-Login Poster 0: Mega Offer ₹500 पर ₹500 FREE */}
                  <div className="p-3.5 rounded-2xl bg-[#090d16] border border-[#facc15]/40 space-y-2.5">
                    <label className="block text-xs font-bold text-[#facc15]">
                      1. Front Page (Pre-Login) Poster: &quot;₹500 की ID पर ₹500 FREE!&quot;
                    </label>
                    <img
                      src={bannerHeroImageUrl}
                      alt="Front Page Mega Offer Preview"
                      className="w-full h-28 rounded-xl object-contain bg-black border border-white/15"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="admin-banner-photo-upload"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#facc15]" />
                        <span>Upload Front Poster</span>
                      </label>
                      <input
                        id="admin-banner-photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePosterUploadForSlot(0, e)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setBannerHeroImageUrl(OFFICIAL_POSTER_ASSETS.megaOffer500Poster)
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] text-amber-300 cursor-pointer"
                      >
                        Reset Default ₹500 Offer Poster
                      </button>
                    </div>
                  </div>

                  {/* Offer Headline & Sub-headline */}
                  <div className="p-3.5 rounded-2xl bg-[#090d16] border border-white/10 space-y-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Main Offer Headline
                      </label>
                      <input
                        type="text"
                        value={bannerHeadline}
                        onChange={(e) => setBannerHeadline(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0c111d] border border-white/15 text-xs text-[#facc15] font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Sub-Headline Text
                      </label>
                      <input
                        type="text"
                        value={bannerSubtitle}
                        onChange={(e) => setBannerSubtitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0c111d] border border-white/15 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 4 Post-Login Wallet Dashboard Posters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      slot: 1 as const,
                      label: 'Dashboard Poster 1: Sexy VIP LIVE LOUNGE',
                      url: postLoginPoster1Url,
                      resetUrl: OFFICIAL_POSTER_ASSETS.sexyVipLoungePoster,
                    },
                    {
                      slot: 2 as const,
                      label: 'Dashboard Poster 2: PLAY • BET • WIN',
                      url: postLoginPoster2Url,
                      resetUrl: OFFICIAL_POSTER_ASSETS.playBetWinPoster,
                    },
                    {
                      slot: 3 as const,
                      label: 'Dashboard Poster 3: Game. Win. Repeat.',
                      url: postLoginPoster3Url,
                      resetUrl: OFFICIAL_POSTER_ASSETS.gameWinRepeatPoster,
                    },
                    {
                      slot: 4 as const,
                      label: 'Dashboard Poster 4: DIVE INTO REAL ACTION',
                      url: postLoginPoster4Url,
                      resetUrl: OFFICIAL_POSTER_ASSETS.diveIntoActionPoster,
                    },
                  ].map((item) => (
                    <div
                      key={item.slot}
                      className="p-3 rounded-2xl bg-[#090d16] border border-white/10 space-y-2"
                    >
                      <span className="block text-[11px] font-bold text-slate-200 truncate">
                        {item.label}
                      </span>
                      <img
                        src={item.url}
                        alt={item.label}
                        className="w-full h-24 rounded-lg object-contain bg-black border border-white/10"
                      />
                      <div className="flex items-center justify-between gap-1.5">
                        <label
                          htmlFor={`admin-postlogin-poster-${item.slot}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-bold text-white cursor-pointer"
                        >
                          <Upload className="w-3 h-3 text-[#facc15]" />
                          <span>Upload</span>
                        </label>
                        <input
                          id={`admin-postlogin-poster-${item.slot}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePosterUploadForSlot(item.slot, e)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (item.slot === 1) setPostLoginPoster1Url(item.resetUrl);
                            if (item.slot === 2) setPostLoginPoster2Url(item.resetUrl);
                            if (item.slot === 3) setPostLoginPoster3Url(item.resetUrl);
                            if (item.slot === 4) setPostLoginPoster4Url(item.resetUrl);
                          }}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs cursor-pointer"
                >
                  💾 Save All 5 Promotional Posters (`/banners`)
                </button>
              </form>
            )}
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
                    ID Requests / Create IDs (`/idRequests`)
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

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {idRequests.map((req, idx) => {
                  const isApprovingThis = approvingIdReqId === req.id;
                  return (
                    <div
                      key={`admin-idreq-${req.id || idx}-${idx}`}
                      data-testid={`admin-idreq-card-${req.id}`}
                      className="p-4 rounded-xl bg-[#090d16] border border-white/10 space-y-3 text-xs"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-[#facc15]/15 border border-[#facc15]/40 text-[#facc15] font-extrabold">
                              {req.platform}
                            </span>
                            <span className="font-bold text-white">
                              Requested Username:{' '}
                              <span className="font-mono-tabular text-[#facc15]">
                                {req.preferredUsername}
                              </span>
                            </span>
                          </div>
                          <div className="text-slate-300">
                            Customer: <span className="font-bold text-white">{req.userName}</span> ({req.userEmail})
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-slate-400">
                            <span>
                              Payment / Refill:{' '}
                              <strong className="font-mono-tabular text-emerald-400">
                                ₹{req.depositAmount.toLocaleString('en-IN')}
                              </strong>
                            </span>
                            {req.utr && (
                              <span>
                                UTR:{' '}
                                <strong className="font-mono-tabular text-sky-300">
                                  {req.utr}
                                </strong>
                              </span>
                            )}
                            {req.screenshotUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDeposit({
                                    id: req.id,
                                    uid: req.uid,
                                    userName: req.userName,
                                    userEmail: req.userEmail,
                                    amount: req.depositAmount,
                                    utr: req.utr || 'ID-REF',
                                    screenshotUrl: req.screenshotUrl || '',
                                    status: 'Pending',
                                    createdAt: req.createdAt,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/15 text-[#facc15] font-semibold cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View Payment Proof</span>
                              </button>
                            )}
                          </div>

                          {req.assignedId && (
                            <div className="pt-1 text-emerald-400 font-mono-tabular font-bold">
                              ✅ Assigned User ID: {req.assignedId} · Password: {req.assignedPassword}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {req.status === 'Pending' ? (
                            !isApprovingThis && (
                              <button
                                type="button"
                                data-testid={`approve-id-open-btn-${req.id}`}
                                onClick={() => {
                                  setApprovingIdReqId(req.id);
                                  setCustomIssuedUserId(req.preferredUsername);
                                  setCustomIssuedPassword(
                                    `Shark@${Math.floor(1000 + Math.random() * 9000)}`
                                  );
                                }}
                                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold cursor-pointer"
                              >
                                Approve &amp; Create ID
                              </button>
                            )
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                                {req.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setApprovingIdReqId(req.id);
                                  setCustomIssuedUserId(req.assignedId || req.preferredUsername);
                                  setCustomIssuedPassword(req.assignedPassword || 'Shark@9921');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 font-semibold cursor-pointer"
                              >
                                Edit ID/Pass
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Inline Admin / Staff Form to Enter Final User ID & Password */}
                      {isApprovingThis && (
                        <div className="pt-3 border-t border-white/10 bg-[#0c111d] p-3.5 rounded-xl space-y-3">
                          <p className="text-[11px] font-bold text-[#facc15] uppercase tracking-wider">
                            Enter Final {req.platform} User ID &amp; Password for {req.userName}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor={`final-userid-${req.id}`}
                                className="block text-[11px] text-slate-300 font-semibold mb-1"
                              >
                                Assigned User ID *
                              </label>
                              <input
                                id={`final-userid-${req.id}`}
                                data-testid={`input-assigned-userid-${req.id}`}
                                type="text"
                                required
                                placeholder="e.g. DEX99_RAHUL"
                                value={customIssuedUserId}
                                onChange={(e) => setCustomIssuedUserId(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-[#090d16] border border-[#facc15]/50 text-white font-mono-tabular text-xs focus:outline-none focus:border-[#facc15]"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`final-pass-${req.id}`}
                                className="block text-[11px] text-slate-300 font-semibold mb-1"
                              >
                                Assigned Password *
                              </label>
                              <input
                                id={`final-pass-${req.id}`}
                                data-testid={`input-assigned-password-${req.id}`}
                                type="text"
                                required
                                placeholder="e.g. Pass@4455"
                                value={customIssuedPassword}
                                onChange={(e) => setCustomIssuedPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-[#090d16] border border-[#facc15]/50 text-white font-mono-tabular text-xs focus:outline-none focus:border-[#facc15]"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setApprovingIdReqId(null)}
                              className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              data-testid={`confirm-approve-id-btn-${req.id}`}
                              onClick={async () => {
                                const finalId = customIssuedUserId.trim() || req.preferredUsername;
                                const finalPass = customIssuedPassword.trim() || 'Shark@123';
                                await adminResolveIdRequest(
                                  req.id,
                                  'Created',
                                  finalId,
                                  finalPass
                                );
                                setApprovingIdReqId(null);
                                onNotify(
                                  `Approved & sent ${req.platform} ID (${finalId}) & Password to ${req.userName}!`
                                );
                              }}
                              className="px-4 py-1.5 rounded-lg bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold cursor-pointer"
                            >
                              ✅ Save &amp; Send ID to Customer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Registered Staff Accounts (Dedicated Staff Route `/staff`)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Staff members log in via the separate Staff link (<strong>/staff</strong> or <strong>?staff=true</strong>), which shows only the Staff Login screen and hides all Master Admin options.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const fullUrl = `${window.location.origin}/staff`;
                    navigator.clipboard?.writeText(fullUrl).catch(() => {});
                    onNotify(`Copied Separate Staff Login Link: ${fullUrl}`);
                  }}
                  className="px-3 py-2 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs cursor-pointer"
                >
                  🔗 Copy Staff Login Link (/staff)
                </button>
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
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRole('staff');
                          setLoggedInStaff(st);
                          setActiveTab('customers');
                          onNotify(`Switched to Staff Panel as ${st.name}!`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-xs font-bold text-emerald-300 cursor-pointer"
                      >
                        👤 Open {st.name} Panel
                      </button>

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

        {/* ====================================================================
         * TAB 7: LIVE SPORTS ODDS, REAL-TIME BET TICKETS & 200 GAMES CONTROL
         * ==================================================================== */}
        {activeTab === 'bets' && (
          <div className="space-y-6">
            {/* KPI Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-[#0c111d] border border-white/10 p-4">
                <span className="text-xs text-slate-400 uppercase">Total Playable Games</span>
                <p className="font-mono-tabular font-black text-2xl text-emerald-400 mt-1">
                  {ALL_200_EXCHANGE_GAMES.length} / 200 Live
                </p>
              </div>
              <div className="rounded-2xl bg-[#0c111d] border border-white/10 p-4">
                <span className="text-xs text-slate-400 uppercase">Total Real-Time Tickets</span>
                <p className="font-mono-tabular font-black text-2xl text-white mt-1">
                  {liveTickets.length}
                </p>
              </div>
              <div className="rounded-2xl bg-[#0c111d] border border-white/10 p-4">
                <span className="text-xs text-slate-400 uppercase">Open Active Tickets</span>
                <p className="font-mono-tabular font-black text-2xl text-amber-400 mt-1">
                  {liveTickets.filter((t) => t.status === 'OPEN').length}
                </p>
              </div>
              <div className="rounded-2xl bg-[#0c111d] border border-white/10 p-4">
                <span className="text-xs text-slate-400 uppercase">Total Bet Stake Volume</span>
                <p className="font-mono-tabular font-black text-2xl text-[#facc15] mt-1">
                  ₹
                  {liveTickets
                    .reduce((acc, t) => acc + (t.liability || 0), 0)
                    .toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Section 1: Real-Time Customer Bet Tickets Queue */}
            <section className="rounded-2xl bg-[#0c111d] border border-white/10 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Real-Time Customer Bet Tickets (Sports Back/Lay &amp; 200 Casino Games)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Settle open tickets as WON (auto-credits customer wallet), LOST, or VOID (auto-refunds stake).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void fetchAdminRealtimeExchangeData()}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-[#facc15] cursor-pointer"
                >
                  Refresh Live Feed
                </button>
              </div>

              {liveTickets.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#090d16] border border-white/5 text-center text-xs text-slate-400">
                  No bet tickets placed yet in this session. As soon as any customer places a Sports Back/Lay bet or plays any of the 200 games, their real-time ticket appears here immediately.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 uppercase">
                        <th className="py-2.5 px-3">Ticket ID</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Event / Game (#1-#200)</th>
                        <th className="py-2.5 px-3">Selection &amp; Odds</th>
                        <th className="py-2.5 px-3">Stake / Return</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Admin Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {liveTickets.map((tkt) => (
                        <tr key={tkt.ticketId} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-mono-tabular font-bold text-[#facc15]">
                            {tkt.ticketId}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-white">{tkt.userName}</div>
                            <div className="text-[10px] text-slate-400">{tkt.userEmail}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-white">
                              {tkt.eventOrGameName}
                            </div>
                            <div className="text-[10px] text-slate-400">{tkt.marketName}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono-tabular">
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold mr-1.5">
                              {tkt.betType}
                            </span>
                            <span className="text-sky-300 font-bold">
                              {tkt.selection} @{tkt.odds.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono-tabular">
                            <div className="text-white">
                              Stake: ₹{tkt.liability.toLocaleString('en-IN')}
                            </div>
                            <div className="text-emerald-400 text-[10px]">
                              Return: ₹{tkt.potentialReturn.toLocaleString('en-IN')}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                                tkt.status === 'WON' || tkt.status === 'CASHED_OUT'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : tkt.status === 'LOST'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : tkt.status === 'VOID'
                                  ? 'bg-slate-500/20 text-slate-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {tkt.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {tkt.status === 'OPEN' ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await fetch('/api/exchange/tickets/settle', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        ticketId: tkt.ticketId,
                                        status: 'WON',
                                        payoutAmount: tkt.potentialReturn,
                                        resultNote: 'Approved as WON by Admin',
                                      }),
                                    });
                                    await adminAdjustUserBalance(
                                      tkt.uid,
                                      tkt.potentialReturn
                                    );
                                    await fetchAdminRealtimeExchangeData();
                                    onNotify(
                                      `Ticket ${tkt.ticketId} settled as WON! Credited ₹${tkt.potentialReturn.toLocaleString('en-IN')} to ${tkt.userName}.`
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] cursor-pointer"
                                >
                                  Settle WON
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await fetch('/api/exchange/tickets/settle', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        ticketId: tkt.ticketId,
                                        status: 'LOST',
                                        payoutAmount: 0,
                                        resultNote: 'Settled as LOST by Admin',
                                      }),
                                    });
                                    await fetchAdminRealtimeExchangeData();
                                    onNotify(`Ticket ${tkt.ticketId} settled as LOST.`);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/25 hover:bg-rose-500/40 text-rose-300 font-bold text-[10px] cursor-pointer"
                                >
                                  Settle LOST
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await fetch('/api/exchange/tickets/settle', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        ticketId: tkt.ticketId,
                                        status: 'VOID',
                                        payoutAmount: tkt.liability,
                                        resultNote: 'Voided & Refunded by Admin',
                                      }),
                                    });
                                    await adminAdjustUserBalance(tkt.uid, tkt.liability);
                                    await fetchAdminRealtimeExchangeData();
                                    onNotify(
                                      `Ticket ${tkt.ticketId} VOIDED & ₹${tkt.liability.toLocaleString('en-IN')} refunded to ${tkt.userName}.`
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-[10px] cursor-pointer"
                                >
                                  Void &amp; Refund
                                </button>
                              </div>
                            ) : (
                              <span className="font-mono-tabular text-[11px] text-slate-400">
                                {tkt.payoutAmount > 0
                                  ? `Paid ₹${tkt.payoutAmount.toLocaleString('en-IN')}`
                                  : 'Settled'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Section 2: Live Sports Exchange Market Control */}
            <section className="rounded-2xl bg-[#0c111d] border border-white/10 p-5 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Live Sports Exchange Markets Control (Back &amp; Lay Odds)
                </h2>
                <p className="text-xs text-slate-400">
                  Suspend or resume real-time betting on any live match across Cricket, Football, Tennis, Horse Racing, Greyhound, Kabaddi, Politics &amp; Binary.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {liveMatches.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl bg-[#090d16] border border-white/10 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-[#facc15]">
                        {m.sport} · {m.competitionName}
                      </span>
                      <h4 className="font-bold text-sm text-white mt-0.5">
                        {m.eventName}
                      </h4>
                      <p className="font-mono-tabular text-xs text-slate-400 mt-0.5">
                        {m.runners.home.label}: {m.runners.home.back}/{m.runners.home.lay} vs{' '}
                        {m.runners.away.label}: {m.runners.away.back}/{m.runners.away.lay}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        await fetch('/api/exchange/sports/toggle-suspend', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ matchId: m.id }),
                        });
                        await fetchAdminRealtimeExchangeData();
                        onNotify(
                          `${m.eventName} is now ${
                            m.suspended ? 'ACTIVE (OPEN)' : 'SUSPENDED'
                          }.`
                        );
                      }}
                      className={`px-3 py-2 rounded-xl font-extrabold text-xs cursor-pointer shrink-0 ${
                        m.suspended
                          ? 'bg-emerald-500 text-black'
                          : 'bg-red-500/20 border border-red-500/40 text-red-300'
                      }`}
                    >
                      {m.suspended ? 'Resume Market' : 'Suspend Market'}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: All 200 Playable Games Directory with Real CDN Thumbnails */}
            <section className="rounded-2xl bg-[#0c111d] border border-[#ffd739]/30 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#ffd739]">
                    All 200 Playable Casino, Crash, Slot &amp; Virtual Games Directory (Official Thumbnails &amp; Coin Sync)
                  </h2>
                  <p className="text-xs text-slate-400">
                    All 200 games are active with real thumbnails and synced with Customer Wallet Coins &amp; Real-Time Bet Tickets.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Search 200 games (#1 - #200, name, provider)..."
                  value={adminGameSearch}
                  onChange={(e) => setAdminGameSearch(e.target.value)}
                  className="w-64 px-3 py-2 rounded-xl bg-[#090d16] border border-[#ffd739]/30 text-xs text-white focus:outline-none focus:border-[#ffd739]"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
                {ALL_200_EXCHANGE_GAMES.filter((g) =>
                  !adminGameSearch.trim()
                    ? true
                    : g.name.toLowerCase().includes(adminGameSearch.toLowerCase()) ||
                      g.provider.toLowerCase().includes(adminGameSearch.toLowerCase()) ||
                      (g.rawProvider || '').toLowerCase().includes(adminGameSearch.toLowerCase()) ||
                      String(g.gameNumber) === adminGameSearch.trim()
                ).map((g) => (
                  <div
                    key={g.id}
                    className="rounded-xl bg-[#241e06] border border-[#ffd739]/30 overflow-hidden text-xs flex flex-col justify-between"
                  >
                    <div className="relative w-full aspect-[336/440] bg-[#1a1504] overflow-hidden">
                      <img
                        src={formatTeaExchCdnImage(g.imgUrl, 240, 75)}
                        alt={g.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 top-0 p-1.5 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent text-[10px] font-mono-tabular">
                        <span className="px-1.5 py-0.5 rounded bg-black/80 text-[#ffd739] font-black">
                          #{g.gameNumber}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-black font-black text-[9px]">
                          LIVE
                        </span>
                      </div>
                    </div>
                    <div className="p-2 bg-[#42370b]">
                      <div className="font-bold text-white truncate">{g.name}</div>
                      <div className="text-[10px] text-amber-200/80 truncate">
                        {g.rawProvider || g.provider} · RTP {g.rtp}
                      </div>
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
                    {OFFICIAL_EXCHANGE_PLATFORMS.map((exch) => (
                      <option key={exch.id} value={exch.name}>
                        {exch.id}. {exch.name}
                      </option>
                    ))}
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
                placeholder={`{\n  "apiKey": "YOUR_FIREBASE_API_KEY",\n  "authDomain": "your-app.firebaseapp.com",\n  "databaseURL": "https://your-app-default-rtdb.firebaseio.com",\n  "projectId": "your-app"\n}`}
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
