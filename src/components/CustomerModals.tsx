import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  PaymentSettings,
  OFFICIAL_EXCHANGE_PLATFORMS,
  validateDepositInput,
  validateWithdrawalInput,
} from '../utils/exchangeLogic';
import {
  registerCustomerWithEmail,
  loginCustomerWithEmail,
  submitDepositRequest,
  submitWithdrawalRequest,
  submitCreateIdRequest,
  DEFAULT_QR_SVG_DATA_URI,
} from '../firebase';
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
} from 'lucide-react';

/* ============================================================================
 * 1. EMAIL & PASSWORD SIGN-UP / LOGIN MODAL
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
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const user = await registerCustomerWithEmail({
          name,
          phone,
          email,
          password,
        });
        onSuccess(user, `Welcome to SHARK EXCH, ${user.name}! Your account is live.`);
        onClose();
      } else {
        const user = await loginCustomerWithEmail(email, password);
        onSuccess(user, `Welcome back, ${user.name}!`);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await loginCustomerWithEmail('aarav.vip@sharkexch.in', 'Shark@2026');
      onSuccess(user, `Logged in as Demo VIP Customer (${user.name})`);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#0c111d] border border-[#facc15]/30 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#facc15] px-6 py-4 flex items-center justify-between text-[#090d16]">
          <div className="flex items-center gap-2">
            <span className="font-shark italic font-black text-2xl tracking-wide">
              SHARK EXCH
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/15">
              Firebase Auth
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Auth Modal"
            className="p-1.5 rounded-full hover:bg-black/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-2 gap-2 bg-[#090d16] border-b border-white/10">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-[#facc15] text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Login (Email & Password)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'bg-[#facc15] text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account (Sign Up)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 id="auth-modal-title" className="text-lg font-bold text-white">
            {mode === 'login'
              ? 'Customer Sign In'
              : 'Create New Shark Exch Account'}
          </h2>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-medium"
            >
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-phone"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Mobile Number
                </label>
                <input
                  id="signup-phone"
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
                />
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              Email ID
            </label>
            <input
              id="auth-email"
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-sm tracking-wide shadow-lg transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {loading
              ? 'Connecting to Firebase...'
              : mode === 'login'
              ? 'Log In to Wallet'
              : 'Create Account & Sync to Firebase'}
          </button>

          {mode === 'login' && (
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400">
                Want to test with pre-funded VIP balance?
              </span>
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="text-xs font-bold text-[#facc15] hover:underline cursor-pointer"
              >
                1-Click Demo VIP Login
              </button>
            </div>
          )}
        </form>
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

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Live Firebase Payment Settings: QR Code + UPI ID + Bank Details */}
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
  const [method, setMethod] = useState<'UPI' | 'BANK'>('UPI');
  const [upiId, setUpiId] = useState<string>('');
  const [bankName, setBankName] = useState<string>('HDFC Bank');
  const [accountHolder, setAccountHolder] = useState<string>(
    currentUser?.name || ''
  );
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [ifsc, setIfsc] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

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
      method,
      upiId,
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
        method,
        upiId,
        bankName,
        accountHolder,
        accountNumber,
        ifsc,
      });
      onSuccess(
        `Withdrawal of ₹${numAmount.toLocaleString('en-IN')} via ${method} sent to Admin Queue!`
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
              WITHDRAW WINNINGS (24/7 PAYOUT)
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

          {/* Payout Method Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-[#090d16] border border-white/10">
            <button
              type="button"
              onClick={() => setMethod('UPI')}
              className={`py-2 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                method === 'UPI'
                  ? 'bg-[#facc15] text-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Instant UPI ID
            </button>
            <button
              type="button"
              onClick={() => setMethod('BANK')}
              className={`py-2 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                method === 'BANK'
                  ? 'bg-[#facc15] text-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bank Transfer (IMPS)
            </button>
          </div>

          {method === 'UPI' ? (
            <div>
              <label
                htmlFor="withdraw-upi-input"
                className="block text-xs font-semibold text-slate-300 mb-1"
              >
                Your Receiving UPI ID *
              </label>
              <input
                id="withdraw-upi-input"
                type="text"
                required
                placeholder="yourname@okaxis / 9876543210@ybl"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
              />
            </div>
          ) : (
            <div className="space-y-3">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="withdraw-acc-input"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Bank Account Number *
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
                    IFSC Code *
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
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-sm tracking-wide shadow-lg transition-transform active:scale-98 cursor-pointer"
          >
            {submitting
              ? 'Processing Withdrawal...'
              : `Request Instant Withdrawal (₹${Number(amount || 0).toLocaleString('en-IN')})`}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. CUSTOMER "CREATE ID" 2-FIELD FORM MODAL (`/idRequests`)
 * Field 1: Preferred Exchange Username
 * Field 2: Payment / Opening ID Refill Amount (₹) + UTR / Screenshot Upload
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
  paymentSettings,
  onClose,
  onRequireAuth,
  onSuccess,
}) => {
  const [platform, setPlatform] = useState<string>(
    selectedExchange || OFFICIAL_EXCHANGE_PLATFORMS[0].name
  );
  const [preferredUsername, setPreferredUsername] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('500');
  const [utr, setUtr] = useState<string>('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (selectedExchange) {
      setPlatform(selectedExchange);
    }
  }, [selectedExchange, isOpen]);

  if (!isOpen) return null;

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(paymentSettings.upiId).catch(() => {});
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!preferredUsername.trim() || preferredUsername.trim().length < 3) {
      setError('Please enter a Preferred Exchange Username (at least 3 characters).');
      return;
    }
    const numAmount = Number(depositAmount);
    if (!Number.isFinite(numAmount) || numAmount < 100) {
      setError('Minimum Opening ID Payment / Refill Amount is ₹100.');
      return;
    }

    setSubmitting(true);
    try {
      await submitCreateIdRequest({
        user: currentUser,
        platform,
        preferredUsername,
        depositAmount: numAmount,
        utr: utr.trim(),
        screenshotUrl: screenshotUrl || DEFAULT_QR_SVG_DATA_URI,
      });
      setPreferredUsername('');
      setUtr('');
      setScreenshotUrl('');
      setScreenshotName('');
      onSuccess(
        `Your "${platform}" ID request (Username: ${preferredUsername.trim()}) has been sent to Admin/Staff for instant activation!`
      );
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit ID request.');
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
      <div className="w-full max-w-lg rounded-3xl bg-[#0c111d] border border-[#facc15]/40 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-medium"
            >
              {error}
            </div>
          )}

          {/* Selected Exchange Banner / Switcher */}
          <div className="rounded-2xl bg-[#090d16] border border-[#facc15]/30 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Selected Exchange Platform
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

          {/* FIELD 1: Preferred Exchange Username */}
          <div>
            <label
              htmlFor="preferred-username"
              className="block text-xs font-bold text-[#facc15] uppercase tracking-wider mb-1.5"
            >
              1. Preferred Exchange Username *
            </label>
            <input
              id="preferred-username"
              type="text"
              required
              placeholder="Enter desired username (e.g. shark_king99)"
              value={preferredUsername}
              onChange={(e) => setPreferredUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#facc15]"
            />
          </div>

          {/* FIELD 2: Payment / Opening ID Refill Amount (₹) + QR/UPI & UTR/Screenshot */}
          <div className="rounded-2xl bg-[#090d16] border border-white/10 p-4 space-y-3.5">
            <div>
              <label
                htmlFor="id-deposit-amount"
                className="block text-xs font-bold text-[#facc15] uppercase tracking-wider mb-1.5"
              >
                2. Payment / Opening ID Refill Amount (₹) *
              </label>
              <input
                id="id-deposit-amount"
                type="number"
                min={100}
                required
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c111d] border border-white/15 text-[#facc15] font-mono-tabular font-bold text-base focus:outline-none focus:border-[#facc15]"
              />
            </div>

            {/* Compact Live QR & UPI Strip for Payment */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0c111d] border border-white/10">
              <div className="w-16 h-16 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={paymentSettings.qrCodeUrl || DEFAULT_QR_SVG_DATA_URI}
                  alt="UPI QR"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                  Pay via Official UPI ID / QR
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tabular text-xs font-bold text-white truncate">
                    {paymentSettings.upiId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-2.5 py-1 rounded-lg bg-[#facc15] text-black font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy UPI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Payment UTR & Screenshot Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="create-id-utr"
                  className="block text-[11px] font-semibold text-slate-300 mb-1"
                >
                  Payment 12-Digit UTR No.
                </label>
                <input
                  id="create-id-utr"
                  type="text"
                  maxLength={12}
                  placeholder="12-digit UTR number"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c111d] border border-white/15 text-white font-mono-tabular text-xs focus:outline-none focus:border-[#facc15]"
                />
              </div>

              <div>
                <label
                  htmlFor="create-id-screenshot"
                  className="block text-[11px] font-semibold text-slate-300 mb-1"
                >
                  Payment Screenshot
                </label>
                <label
                  htmlFor="create-id-screenshot"
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl bg-[#0c111d] border border-dashed border-white/25 hover:border-[#facc15] text-xs text-slate-300 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#facc15] shrink-0" />
                  <span className="truncate">
                    {screenshotName || 'Upload Receipt'}
                  </span>
                </label>
                <input
                  id="create-id-screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-sm tracking-wide shadow-lg cursor-pointer"
          >
            {submitting
              ? 'Sending ID Request to Admin...'
              : `Submit Create ID Request (${platform})`}
          </button>
        </form>
      </div>
    </div>
  );
};
