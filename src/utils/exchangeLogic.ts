/**
 * Pure business logic for SHARK EXCH:
 * - Wallet balance calculations (deposits, withdrawals, refunds, admin adjustments)
 * - Form & UTR validations
 * - Firebase config JSON/snippet parser
 * - Mini-game payout & multiplier math (Aviatrix & Mines)
 * - Master Admin (4455) & Staff (Mohit A1 / 1122) authentication & Live Chat helpers
 */

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  walletBalance: number;
  status: 'Active' | 'Blocked';
  createdAt: string;
}

export interface DepositRecord {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  amount: number;
  utr: string;
  screenshotUrl: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface WithdrawalRecord {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  amount: number;
  method: 'UPI' | 'BANK';
  upiId?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  ifsc?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface IdRequestRecord {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  platform: string;
  preferredUsername: string;
  depositAmount: number;
  status: 'Pending' | 'Created' | 'Rejected';
  assignedId?: string;
  assignedPassword?: string;
  createdAt: string;
}

export interface PaymentSettings {
  upiId: string;
  merchantName: string;
  qrCodeUrl: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  minDeposit: number;
  minWithdrawal: number;
  updatedAt: string;
}

export interface BannerSlide {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  ctaText: string;
  accentColor: string;
  imageUrl?: string;
}

export interface FirebaseConfigInput {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'admin';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface ChatThread {
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadForAdmin: number;
  unreadForCustomer: number;
  messages: Record<string, ChatMessage>;
}

export function validateUtr(utr: string): { valid: boolean; error?: string } {
  const cleaned = utr.trim();
  if (!/^\d{12}$/.test(cleaned)) {
    return {
      valid: false,
      error: 'UTR / Reference Number must be an exact 12-digit numeric code.',
    };
  }
  return { valid: true };
}

export function validateDepositInput(
  amount: number,
  utr: string,
  minDeposit = 100
): { valid: boolean; error?: string } {
  if (!Number.isFinite(amount) || amount < minDeposit) {
    return {
      valid: false,
      error: `Minimum deposit amount is ₹${minDeposit.toLocaleString('en-IN')}.`,
    };
  }
  return validateUtr(utr);
}

export function validateWithdrawalInput(params: {
  amount: number;
  walletBalance: number;
  method: 'UPI' | 'BANK';
  upiId?: string;
  accountHolder?: string;
  accountNumber?: string;
  ifsc?: string;
  minWithdrawal?: number;
}): { valid: boolean; error?: string } {
  const minW = params.minWithdrawal ?? 500;
  if (!Number.isFinite(params.amount) || params.amount < minW) {
    return {
      valid: false,
      error: `Minimum withdrawal amount is ₹${minW.toLocaleString('en-IN')}.`,
    };
  }
  if (params.amount > params.walletBalance) {
    return {
      valid: false,
      error: `Insufficient wallet balance (Available: ₹${params.walletBalance.toLocaleString('en-IN')}).`,
    };
  }
  if (params.method === 'UPI') {
    const upi = (params.upiId ?? '').trim();
    if (!upi || !upi.includes('@') || upi.length < 5) {
      return {
        valid: false,
        error: 'Please enter a valid UPI ID (e.g. username@okaxis).',
      };
    }
  } else {
    const holder = (params.accountHolder ?? '').trim();
    const acc = (params.accountNumber ?? '').trim();
    const ifsc = (params.ifsc ?? '').trim().toUpperCase();
    if (!holder || holder.length < 2) {
      return { valid: false, error: 'Account Holder Name is required.' };
    }
    if (!/^\d{8,18}$/.test(acc)) {
      return {
        valid: false,
        error: 'Bank Account Number must be 8 to 18 digits.',
      };
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc) && ifsc.length < 8) {
      return {
        valid: false,
        error: 'Please enter a valid 11-character IFSC Code (e.g. HDFC0001234).',
      };
    }
  }
  return { valid: true };
}

export function calculateWalletAfterDepositApproval(
  currentBalance: number,
  depositAmount: number
): number {
  if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
    return Math.max(0, Math.round(currentBalance));
  }
  return Math.max(0, Math.round(currentBalance + depositAmount));
}

export function calculateWalletAfterWithdrawalRequest(
  currentBalance: number,
  withdrawalAmount: number
): number {
  if (!Number.isFinite(withdrawalAmount) || withdrawalAmount <= 0) {
    return Math.max(0, Math.round(currentBalance));
  }
  if (withdrawalAmount > currentBalance) {
    throw new Error('Insufficient wallet balance');
  }
  return Math.max(0, Math.round(currentBalance - withdrawalAmount));
}

export function calculateWalletAfterWithdrawalRejection(
  currentBalance: number,
  refundAmount: number
): number {
  if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
    return Math.max(0, Math.round(currentBalance));
  }
  return Math.max(0, Math.round(currentBalance + refundAmount));
}

export function calculateAdminBalanceAdjustment(
  currentBalance: number,
  delta: number
): number {
  if (!Number.isFinite(delta)) return Math.max(0, Math.round(currentBalance));
  return Math.max(0, Math.round(currentBalance + delta));
}

export function computeAdminSummaryStats(
  users: UserProfile[],
  deposits: DepositRecord[],
  withdrawals: WithdrawalRecord[]
) {
  const totalCustomers = users.length;
  const pendingDeposits = deposits.filter((d) => d.status === 'Pending').length;
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'Pending').length;
  const totalWalletBalance = users.reduce(
    (sum, u) => sum + (Number.isFinite(u.walletBalance) ? u.walletBalance : 0),
    0
  );
  return {
    totalCustomers,
    pendingDeposits,
    pendingWithdrawals,
    totalWalletBalance,
  };
}

/**
 * Parses either a strict JSON object OR a JavaScript `const firebaseConfig = { ... }` snippet
 * pasted directly from the Firebase Console.
 */
export function parseFirebaseConfigSnippet(rawInput: string): {
  valid: boolean;
  config?: FirebaseConfigInput;
  error?: string;
} {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please paste your Firebase configuration JSON.' };
  }

  try {
    // Try direct JSON parse first
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && parsed.apiKey && parsed.projectId) {
      return {
        valid: true,
        config: {
          apiKey: String(parsed.apiKey).trim(),
          authDomain: String(parsed.authDomain || `${parsed.projectId}.firebaseapp.com`).trim(),
          databaseURL: String(
            parsed.databaseURL || `https://${parsed.projectId}-default-rtdb.firebaseio.com`
          ).trim(),
          projectId: String(parsed.projectId).trim(),
          storageBucket: parsed.storageBucket ? String(parsed.storageBucket).trim() : '',
          messagingSenderId: parsed.messagingSenderId ? String(parsed.messagingSenderId).trim() : '',
          appId: parsed.appId ? String(parsed.appId).trim() : '',
        },
      };
    }
  } catch {
    // Fallback to regex extraction from JS snippet
  }

  const extractKey = (key: string): string => {
    const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`);
    const match = trimmed.match(regex);
    return match ? match[1].trim() : '';
  };

  const apiKey = extractKey('apiKey');
  const projectId = extractKey('projectId');
  const authDomain = extractKey('authDomain') || (projectId ? `${projectId}.firebaseapp.com` : '');
  const databaseURL =
    extractKey('databaseURL') ||
    (projectId ? `https://${projectId}-default-rtdb.firebaseio.com` : '');

  if (!apiKey || !projectId) {
    return {
      valid: false,
      error: 'Config must include at least "apiKey" and "projectId".',
    };
  }

  return {
    valid: true,
    config: {
      apiKey,
      authDomain,
      databaseURL,
      projectId,
      storageBucket: extractKey('storageBucket'),
      messagingSenderId: extractKey('messagingSenderId'),
      appId: extractKey('appId'),
    },
  };
}

/**
 * Calculates Mines game multiplier based on grid size (25 tiles), number of bombs, and safe picks uncovered.
 */
export function calculateMinesMultiplier(bombs: number, safePicks: number): number {
  if (safePicks <= 0) return 1.0;
  const totalTiles = 25;
  const safeTiles = totalTiles - bombs;
  if (safePicks > safeTiles) return 1.0;

  let probability = 1;
  for (let i = 0; i < safePicks; i++) {
    probability *= (safeTiles - i) / (totalTiles - i);
  }
  const houseEdge = 0.97;
  const rawMultiplier = houseEdge / probability;
  return Math.max(1.01, Number(rawMultiplier.toFixed(2)));
}

export interface StaffMember {
  staffId: string;
  name: string;
  password: string;
  status: 'Active' | 'Blocked';
  createdAt: string;
}

export const MASTER_ADMIN_PIN = '4455';

export function verifyMasterAdminPin(inputPin: string): boolean {
  return inputPin.trim() === MASTER_ADMIN_PIN;
}

export function verifyStaffCredentials(
  staffList: StaffMember[],
  staffIdInput: string,
  passwordInput: string
): { valid: boolean; staff?: StaffMember; error?: string } {
  const cleanInput = staffIdInput.trim().toLowerCase();
  const compactInput = cleanInput.replace(/\s+/g, '');

  const matched = staffList.find((s) => {
    const idLower = s.staffId.trim().toLowerCase();
    const idCompact = idLower.replace(/\s+/g, '');
    const nameLower = s.name.trim().toLowerCase();
    const nameCompact = nameLower.replace(/\s+/g, '');
    const isPrimaryStaffAlias =
      (idCompact === 'mohita1' || nameCompact === 'mohita1' || idCompact === 'staff1') &&
      (compactInput === 'mohita1' || compactInput === 'staff1');

    return (
      idLower === cleanInput ||
      idCompact === compactInput ||
      nameLower === cleanInput ||
      nameCompact === compactInput ||
      isPrimaryStaffAlias
    );
  });

  if (!matched || matched.password !== passwordInput.trim()) {
    return {
      valid: false,
      error: 'Invalid Staff ID or Password. Default: Mohit A1 (1122).',
    };
  }
  if (matched.status === 'Blocked') {
    return {
      valid: false,
      error: 'This Staff account has been blocked by the Master Admin.',
    };
  }
  return { valid: true, staff: matched };
}

/**
 * Computes total unread customer messages across all chat threads for Admin/Staff badge
 */
export function computeTotalAdminUnreadChats(chats: ChatThread[]): number {
  return chats.reduce((sum, thread) => sum + (thread.unreadForAdmin || 0), 0);
}

/**
 * Determines whether the current URL is the standalone Master Admin or Staff Panel link
 * (`/admin`, `/staff`, `/?admin=true`, `/?staff=true`, `/#admin`, `/#staff`).
 */
export function isStandaloneAdminUrl(
  pathname: string,
  search: string,
  hash = ''
): boolean {
  const cleanPath = (pathname || '').toLowerCase().replace(/\/+$/, '');
  if (
    cleanPath === '/admin' ||
    cleanPath.endsWith('/admin') ||
    cleanPath === '/staff' ||
    cleanPath.endsWith('/staff') ||
    cleanPath === '/master-admin' ||
    cleanPath === '/owner'
  ) {
    return true;
  }
  const params = new URLSearchParams(search || '');
  if (
    params.get('admin') === 'true' ||
    params.get('staff') === 'true' ||
    params.get('panel') === 'admin' ||
    params.get('panel') === 'staff'
  ) {
    return true;
  }
  const cleanHash = (hash || '').toLowerCase();
  if (
    cleanHash === '#admin' ||
    cleanHash === '#/admin' ||
    cleanHash === '#staff' ||
    cleanHash === '#/staff'
  ) {
    return true;
  }
  return false;
}

/**
 * Detects if the URL specifically requested the Staff Login tab (`/staff`, `?staff=true`, `#staff`)
 */
export function isStaffLoginUrl(
  pathname: string,
  search: string,
  hash = ''
): boolean {
  const cleanPath = (pathname || '').toLowerCase().replace(/\/+$/, '');
  if (cleanPath === '/staff' || cleanPath.endsWith('/staff')) {
    return true;
  }
  const params = new URLSearchParams(search || '');
  if (params.get('staff') === 'true' || params.get('panel') === 'staff') {
    return true;
  }
  const cleanHash = (hash || '').toLowerCase();
  return cleanHash === '#staff' || cleanHash === '#/staff';
}
