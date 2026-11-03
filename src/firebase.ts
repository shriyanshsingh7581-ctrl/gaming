/**
 * SHARK EXCH — Firebase Authentication & Realtime Database Service
 *
 * Uses standard Firebase modular v10+ SDK:
 * (`initializeApp`, `getAuth`, `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`,
 *  `signOut`, `onAuthStateChanged`, `getDatabase`, `ref`, `set`, `push`, `update`, `onValue`)
 *
 * Includes a seamless "Firebase Config Setup Modal / Hybrid Fallback Mode" so the app never
 * crashes before Firebase keys are entered, and immediately switches to live Firebase
 * Realtime Database as soon as config keys are provided via .env or Admin Panel Tab 5.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  Auth,
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  push,
  update,
  onValue,
  Database,
} from 'firebase/database';
import {
  UserProfile,
  DepositRecord,
  WithdrawalRecord,
  IdRequestRecord,
  PaymentSettings,
  BannerSlide,
  FirebaseConfigInput,
  calculateWalletAfterDepositApproval,
  calculateWalletAfterWithdrawalRequest,
  calculateWalletAfterWithdrawalRejection,
  calculateAdminBalanceAdjustment,
} from './utils/exchangeLogic';

const STORAGE_CONFIG_KEY = 'shark_exch_firebase_config_v1';
const STORAGE_DB_KEY = 'shark_exch_hybrid_rtdb_v1';
const STORAGE_SESSION_UID_KEY = 'shark_exch_active_uid_v1';

// Default UPI QR SVG data URI (Crisp scan-ready QR graphic with SHARK EXCH center emblem)
export const DEFAULT_QR_SVG_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260" width="260" height="260">
  <rect width="260" height="260" rx="16" fill="#ffffff"/>
  <rect x="16" y="16" width="228" height="228" rx="8" fill="#ffffff" stroke="#090d16" stroke-width="4"/>
  <!-- Top-Left Finder Pattern -->
  <rect x="28" y="28" width="56" height="56" fill="#090d16"/>
  <rect x="36" y="36" width="40" height="40" fill="#ffffff"/>
  <rect x="44" y="44" width="24" height="24" fill="#090d16"/>
  <!-- Top-Right Finder Pattern -->
  <rect x="176" y="28" width="56" height="56" fill="#090d16"/>
  <rect x="184" y="36" width="40" height="40" fill="#ffffff"/>
  <rect x="192" y="44" width="24" height="24" fill="#090d16"/>
  <!-- Bottom-Left Finder Pattern -->
  <rect x="28" y="176" width="56" height="56" fill="#090d16"/>
  <rect x="36" y="184" width="40" height="40" fill="#ffffff"/>
  <rect x="44" y="192" width="24" height="24" fill="#090d16"/>
  <!-- Data Matrix Blocks -->
  <g fill="#090d16">
    <rect x="96" y="28" width="12" height="12"/>
    <rect x="120" y="28" width="24" height="12"/>
    <rect x="156" y="28" width="8" height="24"/>
    <rect x="96" y="52" width="24" height="12"/>
    <rect x="132" y="48" width="12" height="24"/>
    <rect x="96" y="72" width="12" height="12"/>
    <rect x="116" y="72" width="12" height="12"/>
    <rect x="148" y="72" width="16" height="12"/>
    <rect x="28" y="96" width="24" height="12"/>
    <rect x="64" y="96" width="20" height="12"/>
    <rect x="28" y="120" width="12" height="24"/>
    <rect x="52" y="116" width="16" height="16"/>
    <rect x="76" y="128" width="12" height="12"/>
    <rect x="28" y="152" width="36" height="12"/>
    <rect x="168" y="96" width="24" height="12"/>
    <rect x="204" y="96" width="28" height="12"/>
    <rect x="176" y="120" width="16" height="16"/>
    <rect x="204" y="116" width="12" height="28"/>
    <rect x="220" y="132" width="12" height="12"/>
    <rect x="168" y="152" width="28" height="12"/>
    <rect x="208" y="152" width="24" height="12"/>
    <rect x="96" y="168" width="16" height="16"/>
    <rect x="124" y="168" width="24" height="12"/>
    <rect x="96" y="196" width="24" height="12"/>
    <rect x="132" y="192" width="16" height="24"/>
    <rect x="96" y="216" width="36" height="16"/>
    <rect x="156" y="180" width="24" height="12"/>
    <rect x="192" y="176" width="16" height="24"/>
    <rect x="216" y="180" width="16" height="16"/>
    <rect x="164" y="208" width="24" height="24"/>
    <rect x="200" y="212" width="32" height="20"/>
  </g>
  <!-- Center Brand Badge -->
  <rect x="92" y="92" width="76" height="76" rx="14" fill="#090d16" stroke="#facc15" stroke-width="4"/>
  <text x="130" y="125" text-anchor="middle" fill="#ffffff" font-family="Arial Black, sans-serif" font-weight="900" font-style="italic" font-size="14">SHARK</text>
  <text x="130" y="145" text-anchor="middle" fill="#facc15" font-family="Arial Black, sans-serif" font-weight="900" font-style="italic" font-size="14">EXCH</text>
</svg>
`)}`;

export interface HybridDatabaseSchema {
  users: Record<string, UserProfile>;
  deposits: Record<string, DepositRecord>;
  withdrawals: Record<string, WithdrawalRecord>;
  idRequests: Record<string, IdRequestRecord>;
  paymentSettings: PaymentSettings;
  banners: BannerSlide[];
}

export const INITIAL_BANNERS: BannerSlide[] = [
  {
    id: 'banner-1',
    tag: '#PLAYSAFE',
    title: 'SEXY LIVE CASINO & VIP TABLES',
    subtitle: '200% Welcome Exchange Bonus · Instant 60-Second UPI Withdrawals · 24/7 VIP Host',
    ctaText: 'Play Live Casino',
    accentColor: '#ec4899',
    imageUrl: '/assets/aistudio/IMG-20261103-WA0184_268471ee.jpg',
  },
  {
    id: 'banner-2',
    tag: 'AVIATRIX CRASH',
    title: 'FLY UP TO 10,000X MULTIPLIER',
    subtitle: 'Provably Fair Space Jet Crash Exchange · Auto Cashout & Live Bet Slip',
    ctaText: 'Launch Aviatrix',
    accentColor: '#3b82f6',
  },
  {
    id: 'banner-3',
    tag: 'CRICKET & MINES',
    title: 'ZERO MARGIN LIVE SPORTS EXCHANGE',
    subtitle: 'Instant Master IDs for Diamond Exch, Lotus365 & SkyExch with 5% Every Deposit Bonus',
    ctaText: 'Create Instant ID',
    accentColor: '#facc15',
  },
];

export const INITIAL_PAYMENT_SETTINGS: PaymentSettings = {
  upiId: 'sharkexch.official@okaxis',
  merchantName: 'SHARK EXCH GAMING PVT LTD',
  qrCodeUrl: DEFAULT_QR_SVG_DATA_URI,
  bankName: 'HDFC Bank Ltd',
  accountHolder: 'SHARK EXCH SETTLEMENT A/C',
  accountNumber: '50200089412763',
  ifsc: 'HDFC0001482',
  minDeposit: 500,
  minWithdrawal: 500,
  updatedAt: new Date().toISOString(),
};

const INITIAL_SEED_DB: HybridDatabaseSchema = {
  users: {
    'usr_demo_aarav': {
      uid: 'usr_demo_aarav',
      name: 'Aarav Singhania',
      email: 'aarav.vip@sharkexch.in',
      phone: '+91 98201 44510',
      password: 'Shark@2026',
      walletBalance: 14500,
      status: 'Active',
      createdAt: '2026-11-01T14:20:00.000Z',
    },
    'usr_demo_kabir': {
      uid: 'usr_demo_kabir',
      name: 'Kabir Malhotra',
      email: 'kabir.m@gmail.com',
      phone: '+91 97112 88390',
      password: 'Kabir#990',
      walletBalance: 4200,
      status: 'Active',
      createdAt: '2026-11-02T09:15:00.000Z',
    },
    'usr_demo_rohan': {
      uid: 'usr_demo_rohan',
      name: 'Rohan Deshmukh',
      email: 'rohan.d@yahoo.com',
      phone: '+91 99304 11208',
      password: 'Rohan$777',
      walletBalance: 850,
      status: 'Blocked',
      createdAt: '2026-11-02T18:40:00.000Z',
    },
  },
  deposits: {
    'dep_demo_101': {
      id: 'dep_demo_101',
      uid: 'usr_demo_kabir',
      userName: 'Kabir Malhotra',
      userEmail: 'kabir.m@gmail.com',
      amount: 5000,
      utr: '430719283746',
      screenshotUrl: DEFAULT_QR_SVG_DATA_URI,
      status: 'Pending',
      createdAt: '2026-11-03T08:45:00.000Z',
    },
    'dep_demo_102': {
      id: 'dep_demo_102',
      uid: 'usr_demo_aarav',
      userName: 'Aarav Singhania',
      userEmail: 'aarav.vip@sharkexch.in',
      amount: 10000,
      utr: '430711998822',
      screenshotUrl: DEFAULT_QR_SVG_DATA_URI,
      status: 'Approved',
      createdAt: '2026-11-03T07:10:00.000Z',
    },
  },
  withdrawals: {
    'wdr_demo_201': {
      id: 'wdr_demo_201',
      uid: 'usr_demo_aarav',
      userName: 'Aarav Singhania',
      userEmail: 'aarav.vip@sharkexch.in',
      userPhone: '+91 98201 44510',
      amount: 2500,
      method: 'UPI',
      upiId: 'aarav.singhania@okicici',
      status: 'Pending',
      createdAt: '2026-11-03T08:55:00.000Z',
    },
    'wdr_demo_202': {
      id: 'wdr_demo_202',
      uid: 'usr_demo_kabir',
      userName: 'Kabir Malhotra',
      userEmail: 'kabir.m@gmail.com',
      userPhone: '+91 97112 88390',
      amount: 1800,
      method: 'BANK',
      bankName: 'ICICI Bank',
      accountHolder: 'Kabir Malhotra',
      accountNumber: '004101552981',
      ifsc: 'ICIC0000041',
      status: 'Approved',
      createdAt: '2026-11-02T21:30:00.000Z',
    },
  },
  idRequests: {
    'idreq_demo_301': {
      id: 'idreq_demo_301',
      uid: 'usr_demo_aarav',
      userName: 'Aarav Singhania',
      userEmail: 'aarav.vip@sharkexch.in',
      userPhone: '+91 98201 44510',
      platform: 'SHARK EXCH VIP PRO',
      preferredUsername: 'aarav_shark99',
      depositAmount: 2000,
      status: 'Created',
      assignedId: 'SHK99_AARAV',
      assignedPassword: 'Vip#8821',
      createdAt: '2026-11-02T16:00:00.000Z',
    },
  },
  paymentSettings: INITIAL_PAYMENT_SETTINGS,
  banners: INITIAL_BANNERS,
};

// Read env vars or saved runtime Firebase config
function getEnvOrSavedFirebaseConfig(): FirebaseConfigInput | null {
  try {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }

  const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env || {};
  if (env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain:
        env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      databaseURL:
        env.VITE_FIREBASE_DATABASE_URL ||
        `https://${env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID || '',
    };
  }
  return null;
}

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Database | null = null;
let isLiveFirebaseConnected = false;
let currentFirebaseConfig: FirebaseConfigInput | null = getEnvOrSavedFirebaseConfig();

function initFirebaseInstance(config: FirebaseConfigInput | null) {
  if (!config || !config.apiKey || !config.projectId) {
    isLiveFirebaseConnected = false;
    return;
  }
  try {
    const existingApps = getApps();
    firebaseApp =
      existingApps.length > 0
        ? existingApps[0]
        : initializeApp({
            apiKey: config.apiKey,
            authDomain: config.authDomain,
            databaseURL: config.databaseURL,
            projectId: config.projectId,
            storageBucket: config.storageBucket,
            messagingSenderId: config.messagingSenderId,
            appId: config.appId,
          });
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getDatabase(firebaseApp);
    isLiveFirebaseConnected = true;
  } catch (err) {
    console.warn('Firebase initialization fell back to Hybrid Realtime mode:', err);
    isLiveFirebaseConnected = false;
  }
}

initFirebaseInstance(currentFirebaseConfig);

// Hybrid Local Realtime Database Store with Instant Cross-Tab Broadcast
function loadHybridStore(): HybridDatabaseSchema {
  try {
    const raw = localStorage.getItem(STORAGE_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        users: parsed.users || INITIAL_SEED_DB.users,
        deposits: parsed.deposits || INITIAL_SEED_DB.deposits,
        withdrawals: parsed.withdrawals || INITIAL_SEED_DB.withdrawals,
        idRequests: parsed.idRequests || INITIAL_SEED_DB.idRequests,
        paymentSettings: parsed.paymentSettings || INITIAL_PAYMENT_SETTINGS,
        banners: parsed.banners || INITIAL_BANNERS,
      };
    }
  } catch {
    // ignore
  }
  localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(INITIAL_SEED_DB));
  return INITIAL_SEED_DB;
}

type ListenerCallback = (snapshot: HybridDatabaseSchema) => void;
type AuthListenerCallback = (user: UserProfile | null) => void;

const dbListeners = new Set<ListenerCallback>();
const authListeners = new Set<AuthListenerCallback>();

const broadcastChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('shark_exch_realtime_sync')
    : null;

if (broadcastChannel) {
  broadcastChannel.onmessage = () => {
    notifyDbListeners();
    notifyAuthListeners();
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_DB_KEY || e.key === STORAGE_SESSION_UID_KEY) {
      notifyDbListeners();
      notifyAuthListeners();
    }
  });
}

function saveHybridStore(nextStore: HybridDatabaseSchema) {
  localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(nextStore));
  broadcastChannel?.postMessage({ type: 'DB_UPDATED', timestamp: Date.now() });
  notifyDbListeners();
  notifyAuthListeners();
}

function notifyDbListeners() {
  const snapshot = loadHybridStore();
  dbListeners.forEach((cb) => cb(snapshot));
}

function notifyAuthListeners() {
  const activeUid = localStorage.getItem(STORAGE_SESSION_UID_KEY);
  const store = loadHybridStore();
  const user = activeUid && store.users[activeUid] ? store.users[activeUid] : null;
  authListeners.forEach((cb) => cb(user));
}

/**
 * Subscribe to real-time updates across `/users`, `/deposits`, `/withdrawals`, `/paymentSettings`, and `/idRequests`
 */
export function subscribeToRealtimeData(callback: ListenerCallback): () => void {
  dbListeners.add(callback);
  const initialStore = loadHybridStore();
  callback(initialStore);

  let unsubFirebase: (() => void) | null = null;
  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      const rootRef = ref(firebaseDb, '/');
      unsubFirebase = onValue(
        rootRef,
        (snap) => {
          const val = snap.val();
          if (val && typeof val === 'object') {
            const current = loadHybridStore();
            const merged: HybridDatabaseSchema = {
              users: val.users || current.users,
              deposits: val.deposits || current.deposits,
              withdrawals: val.withdrawals || current.withdrawals,
              idRequests: val.idRequests || current.idRequests,
              paymentSettings: val.paymentSettings || current.paymentSettings,
              banners: val.banners || current.banners,
            };
            localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(merged));
            dbListeners.forEach((cb) => cb(merged));
            notifyAuthListeners();
          } else {
            // Seed empty live Firebase DB with initial structure
            set(rootRef, initialStore).catch(() => {});
          }
        },
        () => {
          // If Firebase permission or network fails, hybrid store continues seamlessly
        }
      );
    } catch {
      // ignore
    }
  }

  return () => {
    dbListeners.delete(callback);
    if (unsubFirebase) unsubFirebase();
  };
}

/**
 * Subscribe to Firebase Authentication State (`/users/{uid}`)
 */
export function subscribeToAuthState(callback: AuthListenerCallback): () => void {
  authListeners.add(callback);
  notifyAuthListeners();

  let unsubAuth: (() => void) | null = null;
  if (isLiveFirebaseConnected && firebaseAuth) {
    try {
      unsubAuth = onAuthStateChanged(firebaseAuth, (fbUser) => {
        if (fbUser) {
          localStorage.setItem(STORAGE_SESSION_UID_KEY, fbUser.uid);
          notifyAuthListeners();
        }
      });
    } catch {
      // ignore
    }
  }

  return () => {
    authListeners.delete(callback);
    if (unsubAuth) unsubAuth();
  };
}

/**
 * Customer Sign-Up with Full Name, Mobile Number, Email ID, and Password
 * Calls `createUserWithEmailAndPassword` & writes `/users/{uid}` in Firebase Realtime Database
 */
export async function registerCustomerWithEmail(params: {
  name: string;
  phone: string;
  email: string;
  password: string;
}): Promise<UserProfile> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.name.trim();
  const cleanPhone = params.phone.trim();
  const password = params.password;

  if (!cleanName || cleanName.length < 2) {
    throw new Error('Please enter your Full Name.');
  }
  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error('Please enter a valid 10-digit Mobile Number.');
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid Email ID.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const store = loadHybridStore();
  const existingUser = Object.values(store.users).find(
    (u) => u.email.toLowerCase() === cleanEmail
  );
  if (existingUser) {
    throw new Error('An account with this Email ID already exists. Please Log In.');
  }

  let uid = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (isLiveFirebaseConnected && firebaseAuth) {
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
      uid = cred.user.uid;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('email-already-in-use')) {
        throw new Error('This Email ID is already registered in Firebase.');
      }
      // If API key is invalid/unconfigured, proceed with hybrid UID
    }
  }

  const newUser: UserProfile = {
    uid,
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    password,
    walletBalance: 0,
    status: 'Active',
    createdAt: new Date().toISOString(),
  };

  store.users[uid] = newUser;
  localStorage.setItem(STORAGE_SESSION_UID_KEY, uid);
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await set(ref(firebaseDb, `users/${uid}`), newUser);
    } catch {
      // synced locally
    }
  }

  return newUser;
}

/**
 * Customer Log In with Email ID & Password (`signInWithEmailAndPassword`)
 */
export async function loginCustomerWithEmail(
  email: string,
  password: string
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) {
    throw new Error('Please enter both Email ID and Password.');
  }

  const store = loadHybridStore();

  if (isLiveFirebaseConnected && firebaseAuth) {
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
      const fbUid = cred.user.uid;
      if (store.users[fbUid]) {
        if (store.users[fbUid].status === 'Blocked') {
          throw new Error('Your account has been temporarily blocked by Admin.');
        }
        localStorage.setItem(STORAGE_SESSION_UID_KEY, fbUid);
        notifyAuthListeners();
        return store.users[fbUid];
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('blocked by Admin')) throw err;
      // Fallback to checking `/users` table
    }
  }

  const matchedUser = Object.values(store.users).find(
    (u) => u.email.toLowerCase() === cleanEmail && u.password === password
  );

  if (!matchedUser) {
    throw new Error('Invalid Email ID or Password. Please check your credentials or Sign Up.');
  }

  if (matchedUser.status === 'Blocked') {
    throw new Error('Your account has been blocked by the Administrator. Contact support.');
  }

  localStorage.setItem(STORAGE_SESSION_UID_KEY, matchedUser.uid);
  notifyAuthListeners();
  return matchedUser;
}

/**
 * Sign Out Customer (`signOut`)
 */
export async function logoutCustomer(): Promise<void> {
  localStorage.removeItem(STORAGE_SESSION_UID_KEY);
  if (isLiveFirebaseConnected && firebaseAuth) {
    try {
      await signOut(firebaseAuth);
    } catch {
      // ignore
    }
  }
  notifyAuthListeners();
}

/**
 * Submit a Customer Deposit Request to `/deposits/{depositId}`
 */
export async function submitDepositRequest(params: {
  user: UserProfile;
  amount: number;
  utr: string;
  screenshotUrl: string;
}): Promise<DepositRecord> {
  const store = loadHybridStore();
  let depositId = `dep_${Date.now()}`;

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      const pushedRef = push(ref(firebaseDb, 'deposits'));
      if (pushedRef.key) depositId = pushedRef.key;
    } catch {
      // ignore
    }
  }

  const record: DepositRecord = {
    id: depositId,
    uid: params.user.uid,
    userName: params.user.name,
    userEmail: params.user.email,
    amount: Math.round(params.amount),
    utr: params.utr.trim(),
    screenshotUrl: params.screenshotUrl || DEFAULT_QR_SVG_DATA_URI,
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };

  store.deposits[depositId] = record;
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await set(ref(firebaseDb, `deposits/${depositId}`), record);
    } catch {
      // ignore
    }
  }

  return record;
}

/**
 * Submit a Customer Withdrawal Request to `/withdrawals/{withdrawalId}`
 * Deducts amount from user's live wallet balance immediately (refunded if Admin rejects).
 */
export async function submitWithdrawalRequest(params: {
  user: UserProfile;
  amount: number;
  method: 'UPI' | 'BANK';
  upiId?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  ifsc?: string;
}): Promise<WithdrawalRecord> {
  const store = loadHybridStore();
  const liveUser = store.users[params.user.uid];
  if (!liveUser) {
    throw new Error('User session not found.');
  }

  const nextBalance = calculateWalletAfterWithdrawalRequest(
    liveUser.walletBalance,
    params.amount
  );

  let withdrawalId = `wdr_${Date.now()}`;
  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      const pushedRef = push(ref(firebaseDb, 'withdrawals'));
      if (pushedRef.key) withdrawalId = pushedRef.key;
    } catch {
      // ignore
    }
  }

  const record: WithdrawalRecord = {
    id: withdrawalId,
    uid: liveUser.uid,
    userName: liveUser.name,
    userEmail: liveUser.email,
    userPhone: liveUser.phone,
    amount: Math.round(params.amount),
    method: params.method,
    upiId: params.upiId?.trim(),
    bankName: params.bankName?.trim(),
    accountHolder: params.accountHolder?.trim(),
    accountNumber: params.accountNumber?.trim(),
    ifsc: params.ifsc?.trim().toUpperCase(),
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };

  store.users[liveUser.uid] = {
    ...liveUser,
    walletBalance: nextBalance,
  };
  store.withdrawals[withdrawalId] = record;
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await update(ref(firebaseDb, `users/${liveUser.uid}`), { walletBalance: nextBalance });
      await set(ref(firebaseDb, `withdrawals/${withdrawalId}`), record);
    } catch {
      // ignore
    }
  }

  return record;
}

/**
 * Submit a Customer "Create IDs" Request to `/idRequests/{requestId}`
 */
export async function submitCreateIdRequest(params: {
  user: UserProfile;
  platform: string;
  preferredUsername: string;
  depositAmount: number;
}): Promise<IdRequestRecord> {
  const store = loadHybridStore();
  let requestId = `idreq_${Date.now()}`;

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      const pushedRef = push(ref(firebaseDb, 'idRequests'));
      if (pushedRef.key) requestId = pushedRef.key;
    } catch {
      // ignore
    }
  }

  const record: IdRequestRecord = {
    id: requestId,
    uid: params.user.uid,
    userName: params.user.name,
    userEmail: params.user.email,
    userPhone: params.user.phone,
    platform: params.platform,
    preferredUsername: params.preferredUsername.trim(),
    depositAmount: Math.round(params.depositAmount),
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };

  store.idRequests[requestId] = record;
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await set(ref(firebaseDb, `idRequests/${requestId}`), record);
    } catch {
      // ignore
    }
  }

  return record;
}

/**
 * Admin Action: Add or Deduct Customer Wallet Balance (`/users/{uid}/walletBalance`)
 */
export async function adminAdjustUserBalance(uid: string, deltaAmount: number): Promise<number> {
  const store = loadHybridStore();
  const target = store.users[uid];
  if (!target) throw new Error('Customer not found.');

  const updatedBalance = calculateAdminBalanceAdjustment(target.walletBalance, deltaAmount);
  store.users[uid] = {
    ...target,
    walletBalance: updatedBalance,
  };
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await update(ref(firebaseDb, `users/${uid}`), { walletBalance: updatedBalance });
    } catch {
      // ignore
    }
  }
  return updatedBalance;
}

/**
 * Admin Action: Set Exact Customer Wallet Balance (used by games & admin)
 */
export async function updateCustomerWalletBalance(
  uid: string,
  newBalance: number
): Promise<number> {
  const store = loadHybridStore();
  const target = store.users[uid];
  if (!target) throw new Error('Customer not found.');

  const clamped = Math.max(0, Math.round(newBalance));
  store.users[uid] = {
    ...target,
    walletBalance: clamped,
  };
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await update(ref(firebaseDb, `users/${uid}`), { walletBalance: clamped });
    } catch {
      // ignore
    }
  }
  return clamped;
}

/**
 * Admin Action: Block or Unblock User (`/users/{uid}/status`)
 */
export async function adminToggleUserStatus(uid: string): Promise<'Active' | 'Blocked'> {
  const store = loadHybridStore();
  const target = store.users[uid];
  if (!target) throw new Error('Customer not found.');

  const nextStatus: 'Active' | 'Blocked' = target.status === 'Active' ? 'Blocked' : 'Active';
  store.users[uid] = {
    ...target,
    status: nextStatus,
  };
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await update(ref(firebaseDb, `users/${uid}`), { status: nextStatus });
    } catch {
      // ignore
    }
  }
  return nextStatus;
}

/**
 * Admin Action: Approve or Reject Deposit Request (`/deposits/{depositId}`)
 * Approving automatically credits `/users/{uid}/walletBalance` in Firebase Realtime Database.
 */
export async function adminResolveDeposit(
  depositId: string,
  decision: 'Approved' | 'Rejected'
): Promise<void> {
  const store = loadHybridStore();
  const dep = store.deposits[depositId];
  if (!dep || dep.status !== 'Pending') return;

  store.deposits[depositId] = {
    ...dep,
    status: decision,
  };

  let nextBalance: number | null = null;
  if (decision === 'Approved' && store.users[dep.uid]) {
    nextBalance = calculateWalletAfterDepositApproval(
      store.users[dep.uid].walletBalance,
      dep.amount
    );
    store.users[dep.uid] = {
      ...store.users[dep.uid],
      walletBalance: nextBalance,
    };
  }

  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await update(ref(firebaseDb, `deposits/${depositId}`), { status: decision });
      if (decision === 'Approved' && nextBalance !== null) {
        await update(ref(firebaseDb, `users/${dep.uid}`), { walletBalance: nextBalance });
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Admin Action: Approve & Mark Paid OR Reject & Refund Balance to User Wallet (`/withdrawals/{withdrawalId}`)
 */
export async function adminResolveWithdrawal(
  withdrawalId: string,
  decision: 'Approved' | 'Rejected'
): Promise<void> {
  const store = loadHybridStore();
  const wdr = store.withdrawals[withdrawalId];
  if (!wdr || wdr.status !== 'Pending') return;

  store.withdrawals[withdrawalId] = {
    ...wdr,
    status: decision,
  };

  let refundedBalance: number | null = null;
  if (decision === 'Rejected' && store.users[wdr.uid]) {
    refundedBalance = calculateWalletAfterWithdrawalRejection(
      store.users[wdr.uid].walletBalance,
      wdr.amount
    );
    store.users[wdr.uid] = {
      ...store.users[wdr.uid],
      walletBalance: refundedBalance,
    };
  }

  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await update(ref(firebaseDb, `withdrawals/${withdrawalId}`), { status: decision });
      if (decision === 'Rejected' && refundedBalance !== null) {
        await update(ref(firebaseDb, `users/${wdr.uid}`), { walletBalance: refundedBalance });
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Admin Action: Approve / Issue Exchange ID (`/idRequests/{requestId}`)
 */
export async function adminResolveIdRequest(
  requestId: string,
  decision: 'Created' | 'Rejected',
  assignedId?: string,
  assignedPassword?: string
): Promise<void> {
  const store = loadHybridStore();
  const reqItem = store.idRequests[requestId];
  if (!reqItem) return;

  store.idRequests[requestId] = {
    ...reqItem,
    status: decision,
    assignedId: assignedId || `SHK_${reqItem.preferredUsername.toUpperCase()}`,
    assignedPassword: assignedPassword || `Pass#${Math.floor(1000 + Math.random() * 9000)}`,
  };

  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await update(ref(firebaseDb, `idRequests/${requestId}`), store.idRequests[requestId]);
    } catch {
      // ignore
    }
  }
}

/**
 * Admin Action: Update Live UPI QR Code, Merchant UPI ID & Bank Details (`/paymentSettings`)
 */
export async function adminSavePaymentSettings(
  nextSettings: PaymentSettings
): Promise<PaymentSettings> {
  const store = loadHybridStore();
  const updated: PaymentSettings = {
    ...nextSettings,
    updatedAt: new Date().toISOString(),
  };
  store.paymentSettings = updated;
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await set(ref(firebaseDb, 'paymentSettings'), updated);
    } catch {
      // ignore
    }
  }
  return updated;
}

/**
 * Admin Action: Update Promotional Banners (`/banners`)
 */
export async function adminSaveBanners(nextBanners: BannerSlide[]): Promise<void> {
  const store = loadHybridStore();
  store.banners = nextBanners;
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await set(ref(firebaseDb, 'banners'), nextBanners);
    } catch {
      // ignore
    }
  }
}

/**
 * Get & Update Firebase Connection Config at Runtime (Tab 5 Modal)
 */
export function getFirebaseConnectionStatus() {
  return {
    isLiveFirebaseConnected,
    config: currentFirebaseConfig,
    projectId: currentFirebaseConfig?.projectId || 'shark-exch-rtdb (Hybrid Live Sync)',
    databaseURL:
      currentFirebaseConfig?.databaseURL ||
      'https://shark-exch-default-rtdb.firebaseio.com',
  };
}

export function saveRuntimeFirebaseConfig(config: FirebaseConfigInput): void {
  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
  currentFirebaseConfig = config;
  initFirebaseInstance(config);
  notifyDbListeners();
}

export function clearRuntimeFirebaseConfig(): void {
  localStorage.removeItem(STORAGE_CONFIG_KEY);
  currentFirebaseConfig = null;
  isLiveFirebaseConnected = false;
  notifyDbListeners();
}
