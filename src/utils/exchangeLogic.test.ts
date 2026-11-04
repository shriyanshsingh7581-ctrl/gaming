import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUtr,
  validateDepositInput,
  validateWithdrawalInput,
  calculateWalletAfterDepositApproval,
  calculateWalletAfterWithdrawalRequest,
  calculateWalletAfterWithdrawalRejection,
  calculateAdminBalanceAdjustment,
  computeAdminSummaryStats,
  computeTotalAdminUnreadChats,
  parseFirebaseConfigSnippet,
  calculateMinesMultiplier,
  isStandaloneAdminUrl,
  isStaffLoginUrl,
  verifyMasterAdminPin,
  verifyStaffCredentials,
  OFFICIAL_EXCHANGE_PLATFORMS,
  OFFICIAL_POSTER_ASSETS,
  PUBLIC_HOMEPAGE_SLIDER_INTERVAL_MS,
  DAILY_SPIN_USED_MESSAGE,
  SPIN_WHEEL_SEGMENTS,
  INITIAL_PRIZE_INVENTORY,
  getCurrentIstDateKey,
  getNextIstMidnightMs,
  formatCountdownToNextIstMidnight,
  canUserSpinToday,
  selectWeightedSpinSegment,
} from './exchangeLogic';

test('OFFICIAL_EXCHANGE_PLATFORMS lists the 6 official exchange platforms in order', () => {
  assert.equal(OFFICIAL_EXCHANGE_PLATFORMS.length, 6);
  assert.deepEqual(
    OFFICIAL_EXCHANGE_PLATFORMS.map((e) => e.name),
    [
      'Dexch99.now',
      'lexch247.com',
      'bet11play.co',
      'kingreddy99.com',
      'loto365.co',
      'wexch777.com',
    ]
  );
});

test('validateUtr accepts exact 12-digit numeric strings and rejects invalid ones', () => {
  assert.equal(validateUtr('412389012345').valid, true);
  assert.equal(validateUtr(' 998877665544 ').valid, true);
  assert.equal(validateUtr('12345').valid, false);
  assert.equal(validateUtr('12345678901A').valid, false);
});

test('validateDepositInput enforces minimum deposit and 12-digit UTR', () => {
  assert.equal(validateDepositInput(500, '123456789012', 100).valid, true);
  assert.equal(validateDepositInput(50, '123456789012', 100).valid, false);
  assert.equal(validateDepositInput(1000, '999', 100).valid, false);
});

test('validateWithdrawalInput checks wallet balance, minimum withdrawal, and UPI/Bank details', () => {
  assert.equal(
    validateWithdrawalInput({
      amount: 1000,
      walletBalance: 2500,
      method: 'UPI',
      upiId: 'player@okaxis',
    }).valid,
    true
  );

  assert.equal(
    validateWithdrawalInput({
      amount: 3000,
      walletBalance: 2500,
      method: 'UPI',
      upiId: 'player@okaxis',
    }).valid,
    false
  );

  assert.equal(
    validateWithdrawalInput({
      amount: 1000,
      walletBalance: 2500,
      method: 'BANK',
      accountHolder: 'Rahul Sharma',
      accountNumber: '123',
      ifsc: 'HDFC0001234',
    }).valid,
    false
  );

  assert.equal(
    validateWithdrawalInput({
      amount: 1000,
      walletBalance: 2500,
      method: 'BANK',
      accountHolder: 'Rahul Sharma',
      accountNumber: '50100234987612',
      ifsc: 'HDFC0001234',
    }).valid,
    true
  );
});

test('wallet balance transitions for deposit approval, withdrawal deduct, refund, and admin adjust', () => {
  assert.equal(calculateWalletAfterDepositApproval(500, 2000), 2500);
  assert.equal(calculateWalletAfterWithdrawalRequest(2500, 1000), 1500);
  assert.equal(calculateWalletAfterWithdrawalRejection(1500, 1000), 2500);
  assert.equal(calculateAdminBalanceAdjustment(2500, -500), 2000);
  assert.equal(calculateAdminBalanceAdjustment(200, -900), 0);
});

test('computeAdminSummaryStats aggregates live counts and platform balance accurately', () => {
  const stats = computeAdminSummaryStats(
    [
      {
        uid: 'u1',
        name: 'Aarav',
        email: 'aarav@example.com',
        phone: '9876543210',
        walletBalance: 1500,
        status: 'Active',
        createdAt: '2026-11-01',
      },
      {
        uid: 'u2',
        name: 'Vikram',
        email: 'vikram@example.com',
        phone: '9876543211',
        walletBalance: 3500,
        status: 'Active',
        createdAt: '2026-11-02',
      },
    ],
    [
      {
        id: 'd1',
        uid: 'u1',
        userName: 'Aarav',
        userEmail: 'aarav@example.com',
        amount: 1000,
        utr: '123456789012',
        screenshotUrl: '',
        status: 'Pending',
        createdAt: '2026-11-03',
      },
    ],
    [
      {
        id: 'w1',
        uid: 'u2',
        userName: 'Vikram',
        userEmail: 'vikram@example.com',
        userPhone: '9876543211',
        amount: 500,
        method: 'UPI',
        upiId: 'vikram@ybl',
        status: 'Pending',
        createdAt: '2026-11-03',
      },
    ]
  );

  assert.equal(stats.totalCustomers, 2);
  assert.equal(stats.pendingDeposits, 1);
  assert.equal(stats.pendingWithdrawals, 1);
  assert.equal(stats.totalWalletBalance, 5000);
});

test('parseFirebaseConfigSnippet parses both JSON and JS Firebase Console snippets', () => {
  const jsonResult = parseFirebaseConfigSnippet(
    JSON.stringify({
      apiKey: 'TEST_FIREBASE_KEY_123',
      projectId: 'shark-exch-live',
      databaseURL: 'https://shark-exch-live-default-rtdb.firebaseio.com',
    })
  );
  assert.equal(jsonResult.valid, true);
  assert.equal(jsonResult.config?.projectId, 'shark-exch-live');

  const jsSnippet = `
    const firebaseConfig = {
      apiKey: "TEST_JS_KEY_999",
      authDomain: "shark-exch.firebaseapp.com",
      databaseURL: "https://shark-exch-default-rtdb.firebaseio.com",
      projectId: "shark-exch"
    };
  `;
  const snippetResult = parseFirebaseConfigSnippet(jsSnippet);
  assert.equal(snippetResult.valid, true);
  assert.equal(snippetResult.config?.apiKey, 'TEST_JS_KEY_999');
  assert.equal(snippetResult.config?.projectId, 'shark-exch');
});

test('calculateMinesMultiplier increases with safe picks and more bombs', () => {
  const m1 = calculateMinesMultiplier(3, 1);
  const m2 = calculateMinesMultiplier(3, 4);
  const mHighBomb = calculateMinesMultiplier(10, 4);
  assert.equal(m1 > 1.0, true);
  assert.equal(m2 > m1, true);
  assert.equal(mHighBomb > m2, true);
});

test('isStandaloneAdminUrl and isStaffLoginUrl strictly separate /staff (?staff=true) from /admin (?admin=true)', () => {
  assert.equal(isStandaloneAdminUrl('/', '', ''), false);
  assert.equal(isStandaloneAdminUrl('/index.html', '', '#top'), false);
  assert.equal(isStandaloneAdminUrl('/staff', '', ''), true);
  assert.equal(isStandaloneAdminUrl('/', '?staff=true', ''), true);
  assert.equal(isStandaloneAdminUrl('/admin', '', ''), true);
  assert.equal(isStandaloneAdminUrl('/', '?admin=true', ''), true);
  assert.equal(isStaffLoginUrl('/staff', '', ''), true);
  assert.equal(isStaffLoginUrl('/', '?staff=true', ''), true);
  assert.equal(isStaffLoginUrl('/admin', '', ''), false);
  assert.equal(isStaffLoginUrl('/', '?admin=true', ''), false);
});

test('verifyMasterAdminPin (4455), verifyStaffCredentials (Mohit A1 / 1122), and computeTotalAdminUnreadChats', () => {
  assert.equal(verifyMasterAdminPin('4455'), true);
  assert.equal(verifyMasterAdminPin('7777'), false);

  const defaultStaff = [
    {
      staffId: 'Mohit A1',
      name: 'Mohit A1',
      password: '1122',
      status: 'Active' as const,
      createdAt: '2026-11-03',
    },
    {
      staffId: 'staff2',
      name: 'Staff 2',
      password: '2233',
      status: 'Active' as const,
      createdAt: '2026-11-03',
    },
    {
      staffId: 'staff_blocked',
      name: 'Blocked Staff',
      password: '9999',
      status: 'Blocked' as const,
      createdAt: '2026-11-03',
    },
  ];

  assert.equal(verifyStaffCredentials(defaultStaff, 'Mohit A1', '1122').valid, true);
  assert.equal(verifyStaffCredentials(defaultStaff, 'mohita1', '1122').valid, true);
  assert.equal(verifyStaffCredentials(defaultStaff, 'staff1', '1122').valid, true);
  assert.equal(verifyStaffCredentials(defaultStaff, 'staff2', '2233').valid, true);
  assert.equal(verifyStaffCredentials(defaultStaff, 'Mohit A1', 'wrong').valid, false);
  assert.equal(verifyStaffCredentials(defaultStaff, 'staff_blocked', '9999').valid, false);

  assert.equal(
    computeTotalAdminUnreadChats([
      {
        userId: 'u1',
        userName: 'Aarav',
        userEmail: 'a@b.c',
        lastMessage: 'Hi',
        lastTimestamp: '2026-11-03',
        unreadForAdmin: 2,
        unreadForCustomer: 0,
        messages: {},
      },
      {
        userId: 'u2',
        userName: 'Kabir',
        userEmail: 'k@b.c',
        lastMessage: 'UTR check',
        lastTimestamp: '2026-11-03',
        unreadForAdmin: 3,
        unreadForCustomer: 1,
        messages: {},
      },
    ]),
    5
  );
});

test('Spin the Wheel 10 segments, 10s public slider interval, and IST midnight reset logic', () => {
  assert.equal(PUBLIC_HOMEPAGE_SLIDER_INTERVAL_MS, 10000);
  assert.equal(
    DAILY_SPIN_USED_MESSAGE,
    'You have already used your daily spin. Come back tomorrow!'
  );
  assert.ok(OFFICIAL_POSTER_ASSETS.megaOffer500Poster.length > 0);
  assert.ok(OFFICIAL_POSTER_ASSETS.spinWheelPoster.length > 0);

  assert.equal(SPIN_WHEEL_SEGMENTS.length, 10);
  assert.deepEqual(
    SPIN_WHEEL_SEGMENTS.map((s) => s.label),
    [
      'iPhone',
      'Laptop',
      'Smart TV',
      'Refrigerator',
      '5% Bonus',
      '10% Bonus',
      '15% Bonus',
      '20% Bonus',
      '₹500 Reward',
      'Try Again',
    ]
  );

  // Verify IST date boundary at 12:00 AM IST (18:30 UTC of previous day)
  // 2026-11-04 18:29:59 UTC = 2026-11-04 23:59:59 IST
  const beforeMidnightIst = Date.UTC(2026, 10, 4, 18, 29, 59);
  // 2026-11-04 18:30:00 UTC = 2026-11-05 00:00:00 IST
  const atMidnightIst = Date.UTC(2026, 10, 4, 18, 30, 0);

  assert.equal(getCurrentIstDateKey(beforeMidnightIst), '2026-11-04');
  assert.equal(getCurrentIstDateKey(atMidnightIst), '2026-11-05');
  assert.equal(getNextIstMidnightMs(beforeMidnightIst), atMidnightIst);
  assert.equal(formatCountdownToNextIstMidnight(beforeMidnightIst), '00h 00m 01s');

  // Verify 1 spin per user per calendar day eligibility
  const dummySpinRecord = {
    spinId: 'spin_1',
    uid: 'usr_1',
    userName: 'Aarav',
    userEmail: 'a@b.c',
    userPhone: '9800000000',
    istDateKey: '2026-11-04',
    segmentIndex: 8,
    prizeId: 'reward_500',
    prizeLabel: '₹500 Reward',
    category: 'cash_reward' as const,
    cashAmount: 500,
    bonusPercent: 0,
    rewardCode: 'SHARK-500',
    rewardCredited: true,
    requiresAdminVerification: false,
    claimStatus: 'Credited' as const,
    createdAt: '2026-11-04T12:00:00.000Z',
  };

  const statusSameDay = canUserSpinToday(
    { '2026-11-04': dummySpinRecord },
    beforeMidnightIst
  );
  assert.equal(statusSameDay.eligible, false);

  const statusNextDayAfterMidnightIst = canUserSpinToday(
    { '2026-11-04': dummySpinRecord },
    atMidnightIst
  );
  assert.equal(statusNextDayAfterMidnightIst.eligible, true);

  // Verify weighted selection respects inventory
  const seg0 = selectWeightedSpinSegment(INITIAL_PRIZE_INVENTORY, 0);
  assert.equal(seg0.label, 'iPhone');

  const noIphoneInv = { ...INITIAL_PRIZE_INVENTORY, iphone: 0 };
  const segNext = selectWeightedSpinSegment(noIphoneInv, 0);
  assert.equal(segNext.label, 'Laptop');
});

