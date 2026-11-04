/**
 * SHARK EXCH — Firebase Authentication & Realtime Database Service
 *
 * Uses standard Firebase modular v10+ SDK:
 * (`initializeApp`, `getAuth`, `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`,
 *  `signOut`, `onAuthStateChanged`, `getDatabase`, `ref`, `set`, `push`, `update`, `onValue`)
 * PLUS live synchronization with the provisioned AI Studio Firebase database
 * (`firebase-applet-config.json`) so all customer, staff (Mohit A1), and master admin (4455)
 * actions & In-App Live Chat Messenger (/chats/{userId}) sync instantaneously across devices.
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
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import provisionedFirebaseConfig from '../firebase-applet-config.json';
import {
  UserProfile,
  DepositRecord,
  WithdrawalRecord,
  IdRequestRecord,
  PaymentSettings,
  BannerSlide,
  StaffMember,
  ChatMessage,
  ChatThread,
  FirebaseConfigInput,
  calculateWalletAfterDepositApproval,
  calculateWalletAfterWithdrawalRequest,
  calculateWalletAfterWithdrawalRejection,
  calculateAdminBalanceAdjustment,
} from './utils/exchangeLogic';

const STORAGE_CONFIG_KEY = 'shark_exch_firebase_config_v1';
const STORAGE_DB_KEY = 'shark_exch_hybrid_rtdb_v1';
const STORAGE_SESSION_UID_KEY = 'shark_exch_active_uid_v1';
const STORAGE_GUEST_CHAT_KEY = 'shark_exch_guest_chat_id_v1';
const CLOUD_MIRROR_COLLECTION = 'exchangeState';
const CLOUD_MIRROR_DOC_ID = 'live_rtdb_mirror';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

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

export const INITIAL_STAFF: Record<string, StaffMember> = {
  mohita1: {
    staffId: 'Mohit A1',
    name: 'Mohit A1',
    password: '1122',
    status: 'Active',
    createdAt: '2026-11-01T10:00:00.000Z',
  },
  staff2: {
    staffId: 'staff2',
    name: 'Staff 2',
    password: '2233',
    status: 'Active',
    createdAt: '2026-11-01T10:05:00.000Z',
  },
};

export const INITIAL_CHATS: Record<string, ChatThread> = {
  usr_demo_aarav: {
    userId: 'usr_demo_aarav',
    userName: 'Aarav Singhania',
    userEmail: 'aarav.vip@sharkexch.in',
    lastMessage: 'Hello Support, please check my VIP bonus status.',
    lastTimestamp: '2026-11-03T09:10:00.000Z',
    unreadForAdmin: 1,
    unreadForCustomer: 0,
    messages: {
      msg_demo_1: {
        id: 'msg_demo_1',
        sender: 'admin',
        senderName: 'SHARK EXCH Support',
        text: 'Welcome to SHARK EXCH 24/7 In-App Live Support! How can we help you today?',
        timestamp: '2026-11-03T09:05:00.000Z',
      },
      msg_demo_2: {
        id: 'msg_demo_2',
        sender: 'customer',
        senderName: 'Aarav Singhania',
        text: 'Hello Support, please check my VIP bonus status.',
        timestamp: '2026-11-03T09:10:00.000Z',
      },
    },
  },
};

export interface HybridDatabaseSchema {
  users: Record<string, UserProfile>;
  deposits: Record<string, DepositRecord>;
  withdrawals: Record<string, WithdrawalRecord>;
  idRequests: Record<string, IdRequestRecord>;
  paymentSettings: PaymentSettings;
  banners: BannerSlide[];
  staff: Record<string, StaffMember>;
  chats: Record<string, ChatThread>;
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
  staff: INITIAL_STAFF,
  chats: INITIAL_CHATS,
};

function normalizeStaffStore(rawStaff?: Record<string, StaffMember>): Record<string, StaffMember> {
  const next: Record<string, StaffMember> = { ...INITIAL_STAFF };
  if (rawStaff && typeof rawStaff === 'object') {
    for (const [key, val] of Object.entries(rawStaff)) {
      if (!val) continue;
      if (key === 'staff1' || val.staffId?.toLowerCase() === 'staff1') {
        next.mohita1 = {
          ...val,
          staffId: 'Mohit A1',
          name: 'Mohit A1',
          password: val.password || '1122',
        };
      } else {
        next[key] = val;
      }
    }
  }
  return next;
}

// Read saved runtime Firebase config, .env vars, or provisioned firebase-applet-config.json
function getEnvOrSavedFirebaseConfig(): FirebaseConfigInput | null {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore storage errors
  }

  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
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

  if (provisionedFirebaseConfig && provisionedFirebaseConfig.apiKey && provisionedFirebaseConfig.projectId) {
    return {
      apiKey: provisionedFirebaseConfig.apiKey,
      authDomain:
        provisionedFirebaseConfig.authDomain ||
        `${provisionedFirebaseConfig.projectId}.firebaseapp.com`,
      databaseURL: `https://${provisionedFirebaseConfig.projectId}-default-rtdb.firebaseio.com`,
      projectId: provisionedFirebaseConfig.projectId,
      storageBucket: provisionedFirebaseConfig.storageBucket || '',
      messagingSenderId: provisionedFirebaseConfig.messagingSenderId || '',
      appId: provisionedFirebaseConfig.appId || '',
    };
  }

  return null;
}

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Database | null = null;
let firestoreDb: Firestore | null = null;
let isLiveFirebaseConnected = false;
let currentFirebaseConfig: FirebaseConfigInput | null = getEnvOrSavedFirebaseConfig();

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: firebaseAuth?.currentUser?.uid,
      email: firebaseAuth?.currentUser?.email,
      emailVerified: firebaseAuth?.currentUser?.emailVerified,
      isAnonymous: firebaseAuth?.currentUser?.isAnonymous,
      tenantId: firebaseAuth?.currentUser?.tenantId,
      providerInfo:
        firebaseAuth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  if (!firestoreDb) return;
  try {
    await getDocFromServer(doc(firestoreDb, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

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
            databaseURL:
              config.databaseURL || `https://${config.projectId}-default-rtdb.firebaseio.com`,
            projectId: config.projectId,
            storageBucket: config.storageBucket,
            messagingSenderId: config.messagingSenderId,
            appId: config.appId,
          });
    firebaseAuth = getAuth(firebaseApp);

    // Initialize provisioned Cloud Firestore instance
    if (
      provisionedFirebaseConfig?.firestoreDatabaseId &&
      config.projectId === provisionedFirebaseConfig.projectId
    ) {
      firestoreDb = getFirestore(firebaseApp, provisionedFirebaseConfig.firestoreDatabaseId);
      if (typeof window !== 'undefined') {
        testConnection();
      }
    }

    // Initialize Firebase Realtime Database instance if databaseURL is configured via env or Admin Tab 5
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
    const hasExplicitRtdbUrl = Boolean(
      env.VITE_FIREBASE_DATABASE_URL ||
        (typeof window !== 'undefined' && localStorage.getItem(STORAGE_CONFIG_KEY))
    );
    if (hasExplicitRtdbUrl && config.databaseURL) {
      firebaseDb = getDatabase(firebaseApp, config.databaseURL);
    }

    isLiveFirebaseConnected = true;
  } catch (err) {
    console.warn('Firebase initialization fell back to Hybrid Realtime mode:', err);
    isLiveFirebaseConnected = false;
  }
}

initFirebaseInstance(currentFirebaseConfig);

// Hybrid Local + Cloud Realtime Database Store with Instant Cross-Tab & Cloud Sync
function loadHybridStore(): HybridDatabaseSchema {
  try {
    if (typeof window !== 'undefined') {
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
          staff: normalizeStaffStore(parsed.staff),
          chats: parsed.chats || INITIAL_CHATS,
        };
      }
    }
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(INITIAL_SEED_DB));
  }
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

async function syncStateToCloudMirror(nextStore: HybridDatabaseSchema): Promise<void> {
  if (!firestoreDb) return;
  const mirrorPath = `${CLOUD_MIRROR_COLLECTION}/${CLOUD_MIRROR_DOC_ID}`;
  try {
    await setDoc(doc(firestoreDb, CLOUD_MIRROR_COLLECTION, CLOUD_MIRROR_DOC_ID), {
      users: nextStore.users,
      deposits: nextStore.deposits,
      withdrawals: nextStore.withdrawals,
      idRequests: nextStore.idRequests,
      paymentSettings: nextStore.paymentSettings,
      banners: nextStore.banners,
      staff: nextStore.staff,
      chats: nextStore.chats,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.WRITE, mirrorPath);
    }
  }
}

function saveHybridStore(nextStore: HybridDatabaseSchema) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(nextStore));
  }
  broadcastChannel?.postMessage({ type: 'DB_UPDATED', timestamp: Date.now() });
  notifyDbListeners();
  notifyAuthListeners();
  void syncStateToCloudMirror(nextStore);
}

function notifyDbListeners() {
  const snapshot = loadHybridStore();
  dbListeners.forEach((cb) => cb(snapshot));
}

function notifyAuthListeners() {
  if (typeof window === 'undefined') return;
  const activeUid = localStorage.getItem(STORAGE_SESSION_UID_KEY);
  const store = loadHybridStore();
  const user = activeUid && store.users[activeUid] ? store.users[activeUid] : null;
  authListeners.forEach((cb) => cb(user));
}

/**
 * Subscribe to real-time updates across `/users`, `/deposits`, `/withdrawals`, `/paymentSettings`, `/idRequests`, `/staff`, and `/chats`
 */
export function subscribeToRealtimeData(callback: ListenerCallback): () => void {
  dbListeners.add(callback);
  const initialStore = loadHybridStore();
  callback(initialStore);

  let unsubRtdb: (() => void) | null = null;
  let unsubFirestore: (() => void) | null = null;

  // 1. Live Firebase Realtime Database listener (when explicit RTDB URL is active)
  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      const rootRef = ref(firebaseDb, '/');
      unsubRtdb = onValue(
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
              staff: normalizeStaffStore(val.staff || current.staff),
              chats: val.chats || current.chats,
            };
            localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(merged));
            dbListeners.forEach((cb) => cb(merged));
            notifyAuthListeners();
          } else {
            set(rootRef, initialStore).catch(() => {});
          }
        },
        () => {
          // Fallback gracefully
        }
      );
    } catch {
      // ignore
    }
  }

  // 2. Live Provisioned Firebase Cloud Mirror listener (`firebase-applet-config.json`)
  if (isLiveFirebaseConnected && firestoreDb) {
    const mirrorPath = `${CLOUD_MIRROR_COLLECTION}/${CLOUD_MIRROR_DOC_ID}`;
    try {
      unsubFirestore = onSnapshot(
        doc(firestoreDb, CLOUD_MIRROR_COLLECTION, CLOUD_MIRROR_DOC_ID),
        (docSnap) => {
          if (docSnap.exists()) {
            const val = docSnap.data();
            const current = loadHybridStore();
            const merged: HybridDatabaseSchema = {
              users: (val.users as Record<string, UserProfile>) || current.users,
              deposits: (val.deposits as Record<string, DepositRecord>) || current.deposits,
              withdrawals:
                (val.withdrawals as Record<string, WithdrawalRecord>) || current.withdrawals,
              idRequests:
                (val.idRequests as Record<string, IdRequestRecord>) || current.idRequests,
              paymentSettings:
                (val.paymentSettings as PaymentSettings) || current.paymentSettings,
              banners: (val.banners as BannerSlide[]) || current.banners,
              staff: normalizeStaffStore(
                (val.staff as Record<string, StaffMember>) || current.staff
              ),
              chats: (val.chats as Record<string, ChatThread>) || current.chats,
            };
            localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(merged));
            dbListeners.forEach((cb) => cb(merged));
            notifyAuthListeners();
          } else {
            void syncStateToCloudMirror(initialStore);
          }
        },
        (error) => {
          if (
            error instanceof Error &&
            error.message.includes('Missing or insufficient permissions')
          ) {
            handleFirestoreError(error, OperationType.GET, mirrorPath);
          }
        }
      );
    } catch {
      // ignore
    }
  }

  return () => {
    dbListeners.delete(callback);
    if (unsubRtdb) unsubRtdb();
    if (unsubFirestore) unsubFirestore();
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
      // synced via cloud mirror
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
    upiId: params.upiId?.trim() || '',
    bankName: params.bankName?.trim() || '',
    accountHolder: params.accountHolder?.trim() || '',
    accountNumber: params.accountNumber?.trim() || '',
    ifsc: params.ifsc?.trim().toUpperCase() || '',
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
    projectId:
      currentFirebaseConfig?.projectId ||
      provisionedFirebaseConfig?.projectId ||
      'shark-exch-rtdb',
    databaseURL:
      currentFirebaseConfig?.databaseURL ||
      `https://${provisionedFirebaseConfig?.projectId || 'shark-exch'}-default-rtdb.firebaseio.com`,
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
  currentFirebaseConfig = getEnvOrSavedFirebaseConfig();
  initFirebaseInstance(currentFirebaseConfig);
  notifyDbListeners();
}

/**
 * Master Admin Only: Create a new Staff Account (`/staff/{staffId}`)
 */
export async function adminCreateStaffAccount(params: {
  staffId: string;
  name: string;
  password: string;
}): Promise<StaffMember> {
  const rawId = params.staffId.trim();
  const storageKey = rawId.toLowerCase().replace(/\s+/g, '');
  const cleanName = params.name.trim();
  const cleanPass = params.password.trim();

  if (!storageKey || storageKey.length < 3) {
    throw new Error('Staff ID must be at least 3 characters.');
  }
  if (!cleanName) {
    throw new Error('Please enter Staff Name.');
  }
  if (!cleanPass || cleanPass.length < 4) {
    throw new Error('Staff Password must be at least 4 characters.');
  }

  const store = loadHybridStore();
  const member: StaffMember = {
    staffId: rawId,
    name: cleanName,
    password: cleanPass,
    status: 'Active',
    createdAt: new Date().toISOString(),
  };

  store.staff[storageKey] = member;
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await set(ref(firebaseDb, `staff/${storageKey}`), member);
    } catch {
      // ignore
    }
  }
  return member;
}

function findStaffKey(staffMap: Record<string, StaffMember>, staffId: string): string | null {
  const clean = staffId.trim().toLowerCase().replace(/\s+/g, '');
  for (const [k, v] of Object.entries(staffMap)) {
    if (
      k.toLowerCase().replace(/\s+/g, '') === clean ||
      v.staffId.toLowerCase().replace(/\s+/g, '') === clean ||
      v.name.toLowerCase().replace(/\s+/g, '') === clean
    ) {
      return k;
    }
  }
  return null;
}

/**
 * Master Admin Only: Change Staff Password (`/staff/{staffKey}/password`)
 */
export async function adminChangeStaffPassword(
  staffId: string,
  newPassword: string
): Promise<void> {
  const cleanPass = newPassword.trim();
  if (!cleanPass || cleanPass.length < 4) {
    throw new Error('Password must be at least 4 characters.');
  }

  const store = loadHybridStore();
  const key = findStaffKey(store.staff, staffId);
  if (!key || !store.staff[key]) throw new Error('Staff member not found.');

  store.staff[key] = {
    ...store.staff[key],
    password: cleanPass,
  };
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await update(ref(firebaseDb, `staff/${key}`), { password: cleanPass });
    } catch {
      // ignore
    }
  }
}

/**
 * Master Admin Only: Block or Unblock Staff Member (`/staff/{staffKey}/status`)
 */
export async function adminToggleStaffStatus(
  staffId: string
): Promise<'Active' | 'Blocked'> {
  const store = loadHybridStore();
  const key = findStaffKey(store.staff, staffId);
  if (!key || !store.staff[key]) throw new Error('Staff member not found.');

  const target = store.staff[key];
  const nextStatus: 'Active' | 'Blocked' =
    target.status === 'Active' ? 'Blocked' : 'Active';
  store.staff[key] = {
    ...target,
    status: nextStatus,
  };
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await update(ref(firebaseDb, `staff/${key}`), { status: nextStatus });
    } catch {
      // ignore
    }
  }
  return nextStatus;
}

/**
 * Staff & Master Admin Action: Create a New Customer User ID & Gaming Exchange ID directly from the Panel
 * Saves to `/users/{uid}` and `/idRequests/{requestId}` in Firebase Realtime Database.
 */
export async function panelCreateCustomerUserAndExchangeId(params: {
  name: string;
  phone: string;
  email: string;
  password: string;
  initialWalletBalance: number;
  platform: string;
  exchangeUsername: string;
  exchangePassword: string;
}): Promise<{ user: UserProfile; idRecord: IdRequestRecord }> {
  const cleanName = params.name.trim();
  const cleanPhone = params.phone.trim();
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanPass = params.password.trim();
  const cleanExchUser = params.exchangeUsername.trim();
  const cleanExchPass = params.exchangePassword.trim();

  if (!cleanName || !cleanEmail || !cleanPass) {
    throw new Error('Customer Name, Email ID, and Password are required.');
  }

  const store = loadHybridStore();
  const uid = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newUser: UserProfile = {
    uid,
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone || '+91 90000 00000',
    password: cleanPass,
    walletBalance: Math.max(0, Math.round(params.initialWalletBalance || 0)),
    status: 'Active',
    createdAt: new Date().toISOString(),
  };

  const requestId = `idreq_${Date.now()}`;
  const idRecord: IdRequestRecord = {
    id: requestId,
    uid,
    userName: cleanName,
    userEmail: cleanEmail,
    userPhone: newUser.phone,
    platform: params.platform || 'SHARK EXCH VIP PRO',
    preferredUsername: cleanExchUser || cleanName.toLowerCase().replace(/\s+/g, '_'),
    depositAmount: newUser.walletBalance,
    status: 'Created',
    assignedId: cleanExchUser
      ? cleanExchUser.toUpperCase()
      : `SHK_${cleanName.toUpperCase().replace(/\s+/g, '')}`,
    assignedPassword: cleanExchPass || cleanPass,
    createdAt: new Date().toISOString(),
  };

  store.users[uid] = newUser;
  store.idRequests[requestId] = idRecord;
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await set(ref(firebaseDb, `users/${uid}`), newUser);
      await set(ref(firebaseDb, `idRequests/${requestId}`), idRecord);
    } catch {
      // ignore
    }
  }

  return { user: newUser, idRecord };
}

/* ============================================================================
 * IN-APP LIVE CHAT MESSENGER (`/chats/{userId}`)
 * Real-time Customer <-> Admin/Staff (Mohit A1) Support without exposing any phone number
 * ============================================================================ */

export function getOrCreateGuestChatIdentity(): {
  userId: string;
  userName: string;
  userEmail: string;
} {
  if (typeof window === 'undefined') {
    return { userId: 'guest_visitor', userName: 'Guest Player', userEmail: 'guest@sharkexch.in' };
  }
  try {
    const existing = localStorage.getItem(STORAGE_GUEST_CHAT_KEY);
    if (existing) {
      const parsed = JSON.parse(existing);
      if (parsed && parsed.userId) return parsed;
    }
  } catch {
    // ignore
  }
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const identity = {
    userId: `guest_${suffix}`,
    userName: `VIP Guest #${suffix}`,
    userEmail: `guest${suffix}@sharkexch.in`,
  };
  try {
    localStorage.setItem(STORAGE_GUEST_CHAT_KEY, JSON.stringify(identity));
  } catch {
    // ignore
  }
  return identity;
}

export async function sendCustomerChatMessage(params: {
  userId: string;
  userName: string;
  userEmail: string;
  text: string;
}): Promise<ChatMessage> {
  const cleanText = params.text.trim();
  if (!cleanText) {
    throw new Error('Message cannot be empty.');
  }

  const store = loadHybridStore();
  const nowIso = new Date().toISOString();
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const existingThread: ChatThread = store.chats[params.userId] || {
    userId: params.userId,
    userName: params.userName || 'Customer',
    userEmail: params.userEmail || '',
    lastMessage: cleanText,
    lastTimestamp: nowIso,
    unreadForAdmin: 0,
    unreadForCustomer: 0,
    messages: {
      welcome_auto: {
        id: 'welcome_auto',
        sender: 'admin',
        senderName: 'Mohit A1 · Live Support',
        text: 'Welcome to SHARK EXCH Official In-App Support! How can we help you with your ID, Deposit, or Withdrawal?',
        timestamp: new Date(Date.now() - 1000).toISOString(),
      },
    },
  };

  const newMsg: ChatMessage = {
    id: msgId,
    sender: 'customer',
    senderName: params.userName || existingThread.userName,
    text: cleanText,
    timestamp: nowIso,
  };

  const updatedThread: ChatThread = {
    ...existingThread,
    userName: params.userName || existingThread.userName,
    userEmail: params.userEmail || existingThread.userEmail,
    lastMessage: cleanText,
    lastTimestamp: nowIso,
    unreadForAdmin: (existingThread.unreadForAdmin || 0) + 1,
    unreadForCustomer: 0,
    messages: {
      ...(existingThread.messages || {}),
      [msgId]: newMsg,
    },
  };

  store.chats[params.userId] = updatedThread;
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await set(ref(firebaseDb, `chats/${params.userId}`), updatedThread);
    } catch {
      // synced via cloud mirror
    }
  }

  return newMsg;
}

export async function sendAdminChatMessage(params: {
  userId: string;
  userName?: string;
  userEmail?: string;
  senderName: string;
  text: string;
}): Promise<ChatMessage> {
  const cleanText = params.text.trim();
  if (!cleanText) {
    throw new Error('Reply message cannot be empty.');
  }

  const store = loadHybridStore();
  const nowIso = new Date().toISOString();
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const targetUser = store.users[params.userId];
  const existingThread: ChatThread = store.chats[params.userId] || {
    userId: params.userId,
    userName: params.userName || targetUser?.name || 'Customer',
    userEmail: params.userEmail || targetUser?.email || '',
    lastMessage: cleanText,
    lastTimestamp: nowIso,
    unreadForAdmin: 0,
    unreadForCustomer: 0,
    messages: {},
  };

  const newMsg: ChatMessage = {
    id: msgId,
    sender: 'admin',
    senderName: params.senderName || 'SHARK EXCH Support',
    text: cleanText,
    timestamp: nowIso,
  };

  const updatedThread: ChatThread = {
    ...existingThread,
    lastMessage: cleanText,
    lastTimestamp: nowIso,
    unreadForAdmin: 0,
    unreadForCustomer: (existingThread.unreadForCustomer || 0) + 1,
    messages: {
      ...(existingThread.messages || {}),
      [msgId]: newMsg,
    },
  };

  store.chats[params.userId] = updatedThread;
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await set(ref(firebaseDb, `chats/${params.userId}`), updatedThread);
    } catch {
      // synced via cloud mirror
    }
  }

  return newMsg;
}

export async function markChatThreadRead(params: {
  userId: string;
  viewer: 'customer' | 'admin';
}): Promise<void> {
  const store = loadHybridStore();
  const thread = store.chats[params.userId];
  if (!thread) return;

  if (params.viewer === 'customer' && !thread.unreadForCustomer) return;
  if (params.viewer === 'admin' && !thread.unreadForAdmin) return;

  const updatedThread: ChatThread = {
    ...thread,
    unreadForCustomer: params.viewer === 'customer' ? 0 : thread.unreadForCustomer,
    unreadForAdmin: params.viewer === 'admin' ? 0 : thread.unreadForAdmin,
  };

  store.chats[params.userId] = updatedThread;
  saveHybridStore(store);

  if (isLiveFirebaseConnected && firebaseDb) {
    try {
      await set(ref(firebaseDb, `chats/${params.userId}`), updatedThread);
    } catch {
      // ignore
    }
  }
}
