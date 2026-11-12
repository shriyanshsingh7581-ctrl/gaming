import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  DepositRecord,
  WithdrawalRecord,
  IdRequestRecord,
  PaymentSettings,
  OFFICIAL_EXCHANGE_PLATFORMS,
  validateDepositInput,
  validateWithdrawalInput,
  validateCreateIdInput,
} from '../utils/exchangeLogic';
import {
  registerCustomerWithEmail,
  loginCustomerWithEmail,
  updateCustomerProfile,
  submitDepositRequest,
  submitWithdrawalRequest,
  submitCreateIdRequest,
  DEFAULT_QR_SVG_DATA_URI,
} from '../firebase';
import { SharkXLogo } from './SharkHeader';
import {
  X,
  Copy,
  Check,
  Upload,
  Building2,
  QrCode,
  ArrowUpCircle,
  ArrowDownCircle,
  ShieldCheck,
  UserPlus,
  LogIn,
  KeyRound,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  LogOut,
  ExternalLink,
  Save,
} from 'lucide-react';

/* ============================================================================
 * 1. AUTHENTICATION MODAL (Signup: 3 fields | Login: 2 fields)
 * ============================================================================ */
interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: UserProfile, message: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const cleanPhoneDigits = phone.replace(/\D/g, '').slice(-10);
        if (cleanPhoneDigits.length < 10) {
          throw new Error('Please enter a valid 10-digit Mobile Number.');
        }
        if (!email.trim() || !email.includes('@')) {
          throw new Error('Please enter a valid Email.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const user = await registerCustomerWithEmail({
          phone: `+91 ${cleanPhoneDigits}`,
          email: email.trim(),
          password,
        });
        onSuccess(
          user,
          `🎉 Welcome ${user.name}! Your account has been registered successfully.`
        );
        onClose();
      } else {
        const loginIdentifier = email.trim();
        if (!loginIdentifier) {
          throw new Error('Please enter your Email.');
        }
        const user = await loginCustomerWithEmail(loginIdentifier, password);
        onSuccess(user, `Welcome back, ${user.name}!`);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#0c111d] border border-[#facc15]/40 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden text-white">
        {/* Top Yellow Header Bar with SharkX Branding */}
        <div className="bg-[#facc15] px-6 py-4 flex items-center justify-between text-[#090d16]">
          <div id="auth-modal-title">
            <SharkXLogo size="md" darkText />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Auth Modal"
            className="w-8 h-8 rounded-full bg-[#090d16]/10 hover:bg-[#090d16]/20 text-[#090d16] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 2-Column Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#090d16] border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#facc15] text-[#090d16] shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#facc15] text-[#090d16] shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>Sign Up</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-200">
              {mode === 'signup'
                ? 'Create Account (Mobile Number, Email, Password)'
                : 'Login with Email & Password'}
            </h3>
            <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] px-2.5 py-1 rounded-lg font-bold shrink-0">
              <ShieldCheck className="w-3 h-3" />
              <span>Secured</span>
            </span>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-950/80 border border-red-400/50 text-red-200 text-xs font-semibold"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="signup-phone"
                  className="block text-xs font-bold text-slate-300 mb-1"
                >
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="signup-phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070a10] border border-white/15 text-white text-sm font-mono-tabular focus:outline-none focus:border-[#facc15]"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-bold text-slate-300 mb-1"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070a10] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-bold text-slate-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#070a10] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-[#090d16] font-extrabold text-sm tracking-wide shadow-lg cursor-pointer disabled:opacity-60"
            >
              {loading
                ? 'Please wait...'
                : mode === 'signup'
                ? 'Sign Up'
                : 'Login'}
            </button>
          </form>

          <div className="pt-1 text-center text-xs">
            {mode === 'signup' ? (
              <p className="text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="font-extrabold text-[#facc15] hover:underline cursor-pointer"
                >
                  Login →
                </button>
              </p>
            ) : (
              <p className="text-slate-400">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className="font-extrabold text-[#facc15] hover:underline cursor-pointer"
                >
                  Sign Up →
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. CUSTOMER DEPOSIT FLOW MODAL (`Deposit ⏫`)
 * ============================================================================ */
interface DepositModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  paymentSettings: PaymentSettings;
  onClose: () => void;
  onRequireAuth: () => void;
  onSuccess: (message: string) => void;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  currentUser,
  paymentSettings,
  onClose,
  onRequireAuth,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('1000');
  const [utr, setUtr] = useState<string>('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setScreenshotUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      onRequireAuth();
      return;
    }

    const numAmount = Number(amount);
    const check = validateDepositInput(
      numAmount,
      utr,
      paymentSettings.minDeposit || 100
    );
    if (!check.valid) {
      setError(check.error || 'Invalid deposit details.');
      return;
    }

    setSubmitting(true);
    try {
      await submitDepositRequest({
        user: currentUser,
        amount: numAmount,
        utr,
        screenshotUrl: screenshotUrl || DEFAULT_QR_SVG_DATA_URI,
      });
      setUtr('');
      setScreenshotUrl('');
      setScreenshotName('');
      onSuccess(
        `Deposit request of ₹${numAmount.toLocaleString('en-IN')} (UTR: ${utr}) submitted to Firebase! Status: Pending Verification.`
      );
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit deposit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deposit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-[#0c111d] border border-[#facc15]/40 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#facc15] px-5 sm:px-6 py-4 flex items-center justify-between text-[#090d16] shrink-0">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="w-6 h-6 stroke-[2.5]" />
            <h2 id="deposit-modal-title" className="font-shark italic font-black text-xl sm:text-2xl">
              DEPOSIT FUNDS (INSTANT UPI / IMPS)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Deposit Modal"
            className="p-1.5 rounded-full hover:bg-black/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body (Only QR Code & Bank Account Details + Submission Form) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Live Firebase Payment Settings: QR Code + Bank Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Live UPI QR Code & UPI ID */}
            <div className="rounded-2xl bg-[#090d16] border border-white/10 p-4 flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#facc15] uppercase tracking-wider mb-2">
                <QrCode className="w-4 h-4" />
                <span>Scan Official UPI QR Code</span>
              </div>

              <div className="w-40 h-40 rounded-2xl bg-white p-2 shadow-inner flex items-center justify-center overflow-hidden">
                <img
                  src={paymentSettings.qrCodeUrl || DEFAULT_QR_SVG_DATA_URI}
                  alt="Official Merchant UPI QR Code"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>

              <p className="text-xs font-semibold text-slate-300 mt-2.5">
                {paymentSettings.merchantName}
              </p>

              {/* UPI ID with 1-Click Copy Button */}
              <div className="mt-2 w-full flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <div className="text-left min-w-0">
                  <span className="block text-[10px] text-slate-400 uppercase">
                    Official UPI ID
                  </span>
                  <span
                    data-testid="live-merchant-upi"
                    className="font-mono-tabular text-xs font-bold text-[#facc15] truncate block"
                  >
                    {paymentSettings.upiId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(paymentSettings.upiId, 'upi')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#facc15] hover:bg-yellow-300 text-black font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedField === 'upi' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Live Bank Transfer Details */}
            <div className="rounded-2xl bg-[#090d16] border border-white/10 p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                  <Building2 className="w-4 h-4" />
                  <span>IMPS / NEFT Bank Details</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                    <span className="text-slate-400">Bank Name</span>
                    <span className="font-bold text-white">
                      {paymentSettings.bankName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                    <span className="text-slate-400">Account Holder</span>
                    <span className="font-bold text-white">
                      {paymentSettings.accountHolder}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                    <span className="text-slate-400">Account Number</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-tabular font-bold text-[#facc15]">
                        {paymentSettings.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(paymentSettings.accountNumber, 'acc')
                        }
                        aria-label="Copy Account Number"
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        {copiedField === 'acc' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">IFSC Code</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-tabular font-bold text-white">
                        {paymentSettings.ifsc}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText(paymentSettings.ifsc, 'ifsc')}
                        aria-label="Copy IFSC Code"
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        {copiedField === 'ifsc' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 leading-relaxed">
                After payment, enter the <strong>12-Digit UTR / Reference No.</strong> below for instant wallet credit.
              </div>
            </div>
          </div>

          {/* Deposit Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-medium"
              >
                {error}
              </div>
            )}

            {/* Quick Amount Buttons */}
            <div>
              <label
                htmlFor="deposit-amount-input"
                className="block text-xs font-semibold text-slate-300 mb-2"
              >
                Select or Enter Deposit Amount (₹)
              </label>
              <div className="grid grid-cols-5 gap-2 mb-2.5">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(String(amt))}
                    className={`py-2 rounded-xl font-mono-tabular font-bold text-xs transition-all cursor-pointer border ${
                      Number(amount) === amt
                        ? 'bg-[#facc15] text-black border-[#facc15] shadow'
                        : 'bg-[#090d16] text-white border-white/15 hover:border-[#facc15]/50'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
              <input
                id="deposit-amount-input"
                type="number"
                min={100}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular font-bold text-base focus:outline-none focus:border-[#facc15]"
              />
            </div>

            {/* 12-Digit UTR & Payment Screenshot Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="deposit-utr-input"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  12-Digit UTR / Reference Number *
                </label>
                <input
                  id="deposit-utr-input"
                  type="text"
                  maxLength={12}
                  required
                  placeholder="e.g. 430719283746"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular text-sm focus:outline-none focus:border-[#facc15]"
                />
              </div>

              <div>
                <label
                  htmlFor="deposit-screenshot-input"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Upload Payment Screenshot
                </label>
                <label
                  htmlFor="deposit-screenshot-input"
                  className="flex items-center justify-center gap-2 w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-dashed border-white/25 hover:border-[#facc15] text-xs text-slate-300 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-[#facc15]" />
                  <span className="truncate">
                    {screenshotName || 'Choose Receipt Image'}
                  </span>
                </label>
                <input
                  id="deposit-screenshot-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-sm tracking-wide shadow-lg transition-transform active:scale-98 cursor-pointer"
            >
              {submitting
                ? 'Submitting Deposit to Firebase...'
                : `Submit Deposit Request (₹${Number(amount || 0).toLocaleString('en-IN')})`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. CUSTOMER WITHDRAWAL FLOW MODAL (`Withdraw ⏬`)
 * ============================================================================ */
interface WithdrawModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
  onRequireAuth: () => void;
  onSuccess: (message: string) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onRequireAuth,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('1000');
  const [accountHolder, setAccountHolder] = useState<string>(
    currentUser?.name || ''
  );
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [ifsc, setIfsc] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && currentUser && !accountHolder) {
      setAccountHolder(currentUser.name || '');
    }
  }, [isOpen, currentUser, accountHolder]);

  if (!isOpen) return null;

  const walletBalance = currentUser?.walletBalance ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      onRequireAuth();
      return;
    }

    const numAmount = Number(amount);
    const check = validateWithdrawalInput({
      amount: numAmount,
      walletBalance,
      method: 'BANK',
      accountHolder,
      accountNumber,
      ifsc,
      minWithdrawal: 500,
    });

    if (!check.valid) {
      setError(check.error || 'Invalid withdrawal request.');
      return;
    }

    setSubmitting(true);
    try {
      await submitWithdrawalRequest({
        user: currentUser,
        amount: numAmount,
        method: 'BANK',
        accountHolder,
        accountNumber,
        ifsc,
      });
      onSuccess(
        `Withdrawal of ₹${numAmount.toLocaleString('en-IN')} via Bank Transfer sent to Admin Queue!`
      );
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Withdrawal request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-3xl bg-[#0c111d] border border-[#facc15]/40 shadow-2xl overflow-hidden my-auto">
        <div className="bg-[#facc15] px-6 py-4 flex items-center justify-between text-[#090d16]">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="w-6 h-6 stroke-[2.5]" />
            <h2 id="withdraw-modal-title" className="font-shark italic font-black text-xl sm:text-2xl">
              WITHDRAWAL (BANK TRANSFER)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Withdraw Modal"
            className="p-1.5 rounded-full hover:bg-black/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Live Balance Banner */}
          <div className="rounded-2xl bg-[#090d16] border border-white/10 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">
                Withdrawable Wallet Balance
              </span>
              <span className="font-mono-tabular font-bold text-2xl text-[#facc15]">
                ₹{walletBalance.toLocaleString('en-IN')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAmount(String(walletBalance))}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer"
            >
              Max Amount
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-medium"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="withdraw-amount-input"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              Withdrawal Amount (₹) — Min ₹500
            </label>
            <input
              id="withdraw-amount-input"
              type="number"
              min={500}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular font-bold text-base focus:outline-none focus:border-[#facc15]"
            />
          </div>

          {/* Strictly Bank Details (Account Number, IFSC, Account Holder Name) */}
          <div className="space-y-3">
            <div>
              <label
                htmlFor="withdraw-acc-input"
                className="block text-xs font-semibold text-slate-300 mb-1"
              >
                Account Number *
              </label>
              <input
                id="withdraw-acc-input"
                type="text"
                required
                placeholder="8 to 18 digits"
                value={accountNumber}
                onChange={(e) =>
                  setAccountNumber(e.target.value.replace(/\D/g, ''))
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular text-sm focus:outline-none focus:border-[#facc15]"
              />
            </div>

            <div>
              <label
                htmlFor="withdraw-ifsc-input"
                className="block text-xs font-semibold text-slate-300 mb-1"
              >
                IFSC *
              </label>
              <input
                id="withdraw-ifsc-input"
                type="text"
                required
                placeholder="e.g. HDFC0001234"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white font-mono-tabular text-sm uppercase focus:outline-none focus:border-[#facc15]"
              />
            </div>

            <div>
              <label
                htmlFor="withdraw-holder-input"
                className="block text-xs font-semibold text-slate-300 mb-1"
              >
                Account Holder Name *
              </label>
              <input
                id="withdraw-holder-input"
                type="text"
                required
                placeholder="As per bank passbook"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-sm tracking-wide shadow-lg transition-transform active:scale-98 cursor-pointer"
          >
            {submitting
              ? 'Processing Withdrawal...'
              : `Submit Bank Withdrawal (₹${Number(amount || 0).toLocaleString('en-IN')})`}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. CUSTOMER "CREATE ID" 2-FIELD FORM MODAL (`/idRequests`)
 * Strictly 2 fields:
 *   Field 1: Username
 *   Field 2: Amount
 * Enforces wallet balance validation: "Insufficient wallet balance to create ID"
 * ============================================================================ */
interface CreateIdModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  selectedExchange?: string;
  paymentSettings: PaymentSettings;
  onClose: () => void;
  onRequireAuth: () => void;
  onSuccess: (message: string) => void;
}

export const CreateIdModal: React.FC<CreateIdModalProps> = ({
  isOpen,
  currentUser,
  selectedExchange,
  onClose,
  onRequireAuth,
  onSuccess,
}) => {
  const [platform, setPlatform] = useState<string>(
    selectedExchange || OFFICIAL_EXCHANGE_PLATFORMS[0].name
  );
  const [preferredUsername, setPreferredUsername] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('500');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (selectedExchange) {
      setPlatform(selectedExchange);
    }
    if (isOpen) {
      setError('');
    }
  }, [selectedExchange, isOpen]);

  if (!isOpen) return null;

  const walletBalance = currentUser?.walletBalance ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    const numAmount = Number(depositAmount);
    const validation = validateCreateIdInput({
      username: preferredUsername,
      amount: numAmount,
      walletBalance,
    });
    if (!validation.valid) {
      setError(validation.error || 'Insufficient wallet balance to create ID');
      return;
    }

    setSubmitting(true);
    try {
      await submitCreateIdRequest({
        user: currentUser,
        platform,
        preferredUsername,
        depositAmount: numAmount,
      });
      setPreferredUsername('');
      onSuccess(
        `Your "${platform}" ID request (Username: ${preferredUsername.trim()}, Amount: ₹${numAmount.toLocaleString('en-IN')}) has been submitted!`
      );
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Insufficient wallet balance to create ID');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-id-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 overflow-y-auto"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#0c111d] border border-[#facc15]/40 shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header (No "500 ID" promo header) */}
        <div className="bg-[#facc15] px-5 sm:px-6 py-4 flex items-center justify-between text-[#090d16] shrink-0">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 stroke-[2.5]" />
            <h2 id="create-id-modal-title" className="font-shark italic font-black text-xl">
              CREATE ID — {platform.toUpperCase()}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Create ID Modal"
            className="p-1.5 rounded-full hover:bg-black/15 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Wallet Balance Indicator */}
          <div className="rounded-2xl bg-[#090d16] border border-white/10 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Available Wallet Balance
            </span>
            <span
              data-testid="create-id-modal-wallet-balance"
              className="font-mono-tabular font-extrabold text-base text-[#facc15]"
            >
              ₹{walletBalance.toLocaleString('en-IN')}
            </span>
          </div>

          {error && (
            <div
              role="alert"
              data-testid="create-id-error-alert"
              className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold"
            >
              {error}
            </div>
          )}

          {/* Selected Exchange Platform Switcher */}
          <div className="rounded-2xl bg-[#090d16] border border-[#facc15]/30 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Exchange Platform
              </span>
              <span className="text-xs font-mono-tabular font-extrabold text-[#facc15]">
                {platform}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {OFFICIAL_EXCHANGE_PLATFORMS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setPlatform(item.name)}
                  className={`py-1.5 px-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer truncate ${
                    platform === item.name
                      ? 'bg-[#facc15] text-black border-[#facc15] shadow'
                      : 'bg-[#0c111d] border-white/10 text-slate-300 hover:border-[#facc15]/40'
                  }`}
                >
                  {item.index}. {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* FIELD 1: Username */}
          <div>
            <label
              htmlFor="preferred-username"
              className="block text-xs font-bold text-[#facc15] uppercase tracking-wider mb-1.5"
            >
              Username *
            </label>
            <input
              id="preferred-username"
              type="text"
              required
              placeholder="Enter desired username"
              value={preferredUsername}
              onChange={(e) => setPreferredUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
            />
          </div>

          {/* FIELD 2: Amount */}
          <div>
            <label
              htmlFor="id-deposit-amount"
              className="block text-xs font-bold text-[#facc15] uppercase tracking-wider mb-1.5"
            >
              Amount *
            </label>
            <input
              id="id-deposit-amount"
              type="number"
              min={1}
              required
              placeholder="Enter amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-[#facc15] font-mono-tabular font-bold text-base focus:outline-none focus:border-[#facc15]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-sm tracking-wide shadow-lg cursor-pointer"
          >
            {submitting ? 'Creating ID...' : 'Create ID'}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
 * 5. CUSTOMER VIP PROFILE, EXCHANGE IDs & WALLET DASHBOARD MODAL
 * ============================================================================ */
interface UserProfileModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  myDeposits: DepositRecord[];
  myWithdrawals: WithdrawalRecord[];
  myIdRequests: IdRequestRecord[];
  onClose: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenCreateId: () => void;
  onLogout: () => void;
  onSuccess: (message: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  currentUser,
  myDeposits,
  myWithdrawals,
  myIdRequests,
  onClose,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenCreateId,
  onLogout,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'ids' | 'profile'>('transactions');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && isOpen) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setNewPassword('');
      setError('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateCustomerProfile(currentUser.uid, {
        name,
        phone,
        ...(newPassword.trim() ? { password: newPassword.trim() } : {}),
      });
      setNewPassword('');
      onSuccess('Your VIP Profile has been updated!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const totalApprovedDeposits = myDeposits
    .filter((d) => d.status === 'Approved')
    .reduce((sum, d) => sum + d.amount, 0);
  const totalApprovedWithdrawals = myWithdrawals
    .filter((w) => w.status === 'Approved')
    .reduce((sum, w) => sum + w.amount, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-profile-modal-title"
      data-testid="user-profile-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85"
    >
      <div className="w-full max-w-lg rounded-3xl bg-[#0c111d] border-2 border-[#facc15]/50 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Luxury Gold Header */}
        <div className="bg-gradient-to-r from-[#facc15] via-yellow-300 to-[#eab308] px-5 py-4 flex items-center justify-between text-[#090d16] shrink-0">
          <div className="flex items-center gap-2.5">
            <UserIcon className="w-6 h-6 stroke-[2.5]" />
            <div>
              <h2
                id="user-profile-modal-title"
                className="font-shark italic font-black text-xl tracking-wide leading-none"
              >
                ACCOUNT STATEMENT
              </h2>
              <p className="text-[11px] font-bold opacity-85 mt-0.5">
                Shark Exchange · Transactions, Exchange IDs &amp; Profile
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Profile Modal"
            className="p-1.5 rounded-full hover:bg-black/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top User Summary Banner */}
        <div className="p-4 bg-[#090d16] border-b border-white/10 space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#facc15] to-amber-500 text-black font-black text-xl flex items-center justify-center shadow-lg shrink-0">
                {(currentUser.name || 'V').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-white truncate">
                    {currentUser.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase">
                    <ShieldCheck className="w-3 h-3" />
                    {currentUser.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate">{currentUser.email}</p>
                <p className="text-[11px] font-mono-tabular text-[#facc15]">
                  {currentUser.phone} · ID: {currentUser.uid.slice(0, 12)}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="block text-[10px] font-bold uppercase text-slate-400">
                Wallet Balance
              </span>
              <span className="font-mono-tabular font-black text-xl text-[#facc15]">
                ₹{currentUser.walletBalance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Quick Wallet Action Strip */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDeposit();
              }}
              className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>Deposit</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWithdraw();
              }}
              className="py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Withdrawal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateId();
              }}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-[#facc15] border border-[#facc15]/40 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Create ID</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 p-2 gap-1.5 bg-[#090d16] border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-2 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
              activeTab === 'transactions'
                ? 'bg-[#facc15] text-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Account Statement ({myDeposits.length + myWithdrawals.length + myIdRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ids')}
            className={`py-2 px-2 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
              activeTab === 'ids'
                ? 'bg-[#facc15] text-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My IDs ({myIdRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-2 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
              activeTab === 'profile'
                ? 'bg-[#facc15] text-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Profile Details
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Account Stats Summary */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[#090d16] border border-white/10">
                  <span className="block text-[10px] text-slate-400 uppercase">Total Deposits</span>
                  <span className="font-mono-tabular font-bold text-xs text-emerald-400">
                    ₹{totalApprovedDeposits.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090d16] border border-white/10">
                  <span className="block text-[10px] text-slate-400 uppercase">Withdrawals</span>
                  <span className="font-mono-tabular font-bold text-xs text-amber-300">
                    ₹{totalApprovedWithdrawals.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090d16] border border-white/10">
                  <span className="block text-[10px] text-slate-400 uppercase">Active IDs</span>
                  <span className="font-mono-tabular font-bold text-xs text-[#facc15]">
                    {myIdRequests.filter((r) => r.status === 'Created').length}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Registered Email ID (Firebase Auth)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d16]/60 border border-white/10 text-slate-400 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-edit-name"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="profile-edit-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-edit-phone"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="profile-edit-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-edit-password"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Change Password (Optional)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="profile-edit-password"
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="py-3 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'ids' && (
            <div className="space-y-3">
              {myIdRequests.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <KeyRound className="w-8 h-8 text-[#facc15] mx-auto opacity-80" />
                  <p className="text-xs text-slate-300">
                    You have not requested any Exchange IDs yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCreateId();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#facc15] text-black font-extrabold text-xs cursor-pointer"
                  >
                    Create Your First Exchange ID
                  </button>
                </div>
              ) : (
                myIdRequests.map((req, idx) => {
                  const matchedExch = OFFICIAL_EXCHANGE_PLATFORMS.find(
                    (e) => e.name.toLowerCase() === (req.platform || '').toLowerCase()
                  );
                  const exchUrl = matchedExch
                    ? matchedExch.url
                    : `https://${(req.platform || 'dexch99.now').toLowerCase().replace(/\s+/g, '')}`;

                  return (
                    <div
                      key={`profile-id-${req.id || idx}-${idx}`}
                      className="p-3.5 rounded-2xl bg-[#090d16] border border-[#facc15]/40 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <a
                          href={exchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-extrabold text-sm text-[#facc15] hover:underline inline-flex items-center gap-1"
                        >
                          <span>{req.platform}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
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

                      <div className="flex items-center justify-between text-slate-300">
                        <span>
                          Preferred Username:{' '}
                          <strong className="text-white font-mono-tabular">
                            {req.preferredUsername}
                          </strong>
                        </span>
                        <span className="font-mono-tabular text-emerald-400 font-bold">
                          ₹{req.depositAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {req.assignedId ? (
                        <div className="p-2.5 rounded-xl bg-[#0c111d] border border-emerald-500/40 space-y-2">
                          <div className="flex items-center justify-between font-mono-tabular">
                            <span className="text-slate-400">User ID:</span>
                            <strong className="text-[#facc15]">{req.assignedId}</strong>
                          </div>
                          <div className="flex items-center justify-between font-mono-tabular">
                            <span className="text-slate-400">Password:</span>
                            <strong className="text-emerald-300">{req.assignedPassword}</strong>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(
                                `Exchange: ${req.platform} | User ID: ${req.assignedId} | Password: ${req.assignedPassword}`,
                                `prof-id-${req.id}`
                              )
                            }
                            className="w-full py-1.5 rounded-lg bg-[#facc15] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {copiedKey === `prof-id-${req.id}` ? (
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
                        <p className="text-[11px] text-amber-300">
                          ⏳ Admin/Staff is verifying your payment and generating your ID...
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-2.5">
              {myDeposits.length === 0 &&
              myWithdrawals.length === 0 &&
              myIdRequests.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No transactions recorded in your Account Statement yet.
                </p>
              ) : (
                <>
                  {myIdRequests.map((req, idx) => (
                    <div
                      key={`stmt-id-${req.id || idx}-${idx}`}
                      className="p-3 rounded-xl bg-[#090d16] border border-[#facc15]/30 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#facc15]">
                          Create ID ({req.platform}) -₹{req.depositAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono-tabular">
                          Username: {req.preferredUsername}
                        </span>
                      </div>
                      <span
                        className={`font-bold ${
                          req.status === 'Created'
                            ? 'text-emerald-400'
                            : req.status === 'Pending'
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  ))}
                  {myDeposits.map((dep, idx) => (
                    <div
                      key={`prof-dep-${dep.id || idx}-${idx}`}
                      className="p-3 rounded-xl bg-[#090d16] border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-emerald-400">
                          Deposit +₹{dep.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono-tabular">
                          UTR: {dep.utr}
                        </span>
                      </div>
                      <span
                        className={`font-bold ${
                          dep.status === 'Approved'
                            ? 'text-emerald-400'
                            : dep.status === 'Pending'
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {dep.status}
                      </span>
                    </div>
                  ))}
                  {myWithdrawals.map((wdr, idx) => (
                    <div
                      key={`prof-wdr-${wdr.id || idx}-${idx}`}
                      className="p-3 rounded-xl bg-[#090d16] border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-amber-300">
                          Withdrawal -₹{wdr.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono-tabular">
                          {wdr.accountNumber ? `A/C: ${wdr.accountNumber} (${wdr.ifsc || ''})` : wdr.upiId}
                        </span>
                      </div>
                      <span
                        className={`font-bold ${
                          wdr.status === 'Approved'
                            ? 'text-emerald-400'
                            : wdr.status === 'Pending'
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {wdr.status}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
