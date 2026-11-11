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
  getEligibleBonusSegments,
  getWheelLandingAngleForSegment,
  sanitizeSpinRecordToEligibleBonus,
} from './exchangeLogic';
import {
  ALL_200_EXCHANGE_GAMES,
  INITIAL_LIVE_SPORTS_MATCHES,
  INITIAL_RECENT_BIG_WINS,
  calculateExchangeBetMath,
  tickLiveSportsMatches,
} from './teaExchCatalog';

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
      '25% Bonus',
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
    segmentIndex: 4,
    prizeId: 'bonus_5',
    prizeLabel: '5% Bonus',
    category: 'bonus' as const,
    cashAmount: 0,
    bonusPercent: 5,
    rewardCode: 'SHARK-BONUS_5',
    rewardCredited: false,
    requiresAdminVerification: false,
    claimStatus: 'Active Bonus' as const,
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

  // Verify ONLY the 4 bonus segments (5% Bonus, 10% Bonus, 20% Bonus, 25% Bonus) can ever be selected
  const eligible = getEligibleBonusSegments();
  assert.deepEqual(
    eligible.map((s) => s.label),
    ['5% Bonus', '10% Bonus', '25% Bonus', '20% Bonus']
  );

  assert.equal(selectWeightedSpinSegment(INITIAL_PRIZE_INVENTORY, 0.1).label, '5% Bonus');
  assert.equal(selectWeightedSpinSegment(INITIAL_PRIZE_INVENTORY, 0.35).label, '10% Bonus');
  assert.equal(selectWeightedSpinSegment(INITIAL_PRIZE_INVENTORY, 0.6).label, '25% Bonus');
  assert.equal(selectWeightedSpinSegment(INITIAL_PRIZE_INVENTORY, 0.85).label, '20% Bonus');

  // Verify across 100 samples that physical gifts are NEVER selected
  for (let i = 0; i < 100; i++) {
    const picked = selectWeightedSpinSegment(INITIAL_PRIZE_INVENTORY, i / 100);
    assert.ok(
      ['5% Bonus', '10% Bonus', '20% Bonus', '25% Bonus'].includes(picked.label)
    );
    assert.equal(picked.category, 'bonus');
  }

  // Verify landing angle places the winning bonus segment dead-center under 12 o'clock (0 deg)
  for (const bonusSeg of eligible) {
    const rot = getWheelLandingAngleForSegment(bonusSeg.index, 0, 6);
    const segmentCenter = bonusSeg.index * 36 + 18;
    assert.equal((segmentCenter + rot) % 360, 0);
  }

  // Verify sanitizeSpinRecordToEligibleBonus converts any non-bonus record into an eligible bonus
  const sanitized = sanitizeSpinRecordToEligibleBonus({
    ...dummySpinRecord,
    segmentIndex: 0,
    prizeId: 'iphone',
    prizeLabel: 'iPhone',
    category: 'physical',
  });
  assert.ok(
    ['5% Bonus', '10% Bonus', '20% Bonus', '25% Bonus'].includes(sanitized.prizeLabel)
  );
});

test('ALL_200_EXCHANGE_GAMES contains exactly 200 playable games with valid engines and categories', () => {
  assert.equal(ALL_200_EXCHANGE_GAMES.length, 200);
  const uniqueIds = new Set(ALL_200_EXCHANGE_GAMES.map((g) => g.id));
  assert.equal(uniqueIds.size, 200);

  for (const game of ALL_200_EXCHANGE_GAMES) {
    assert.ok(game.name.length > 0);
    assert.ok(
      ['crash', 'mines', 'cards', 'roulette_wheel', 'slots', 'color_plinko_dice'].includes(
        game.engine
      )
    );
    assert.ok(game.minBet >= 10);
    assert.ok(game.maxBet > game.minBet);
  }
});

test('calculateExchangeBetMath computes accurate BACK, LAY, YES, and NO exchange liability and returns', () => {
  // BACK bet at 1.90 odds with ₹1000 stake -> ₹1900 return, ₹900 profit, ₹1000 liability
  const backMath = calculateExchangeBetMath({ betType: 'BACK', stake: 1000, odds: 1.9 });
  assert.equal(backMath.liability, 1000);
  assert.equal(backMath.potentialProfit, 900);
  assert.equal(backMath.totalReturn, 1900);

  // LAY bet at 1.92 odds with ₹1000 backer stake -> ₹920 liability, ₹1000 profit
  const layMath = calculateExchangeBetMath({ betType: 'LAY', stake: 1000, odds: 1.92 });
  assert.equal(layMath.liability, 920);
  assert.equal(layMath.potentialProfit, 1000);
  assert.equal(layMath.totalReturn, 1920);

  // Fancy YES/NO at 100 rate with ₹500 stake -> ₹500 profit, ₹1000 return
  const yesMath = calculateExchangeBetMath({ betType: 'YES', stake: 500, odds: 100 });
  assert.equal(yesMath.liability, 500);
  assert.equal(yesMath.potentialProfit, 500);
  assert.equal(yesMath.totalReturn, 1000);
});

test('tickLiveSportsMatches updates live sports odds while keeping Lay > Back', () => {
  assert.ok(INITIAL_LIVE_SPORTS_MATCHES.length >= 10);
  assert.ok(INITIAL_RECENT_BIG_WINS.length >= 10);

  const ticked = tickLiveSportsMatches(INITIAL_LIVE_SPORTS_MATCHES);
  assert.equal(ticked.length, INITIAL_LIVE_SPORTS_MATCHES.length);
  for (const m of ticked) {
    assert.ok(m.runners.home.lay > m.runners.home.back);
    assert.ok(m.runners.away.lay > m.runners.away.back);
  }
});

test('SIGNUP_WELCOME_BONUS_AMOUNT is ₹500 and applySignupWelcomeBonus credits ₹500 on new sign-ups', async () => {
  const { SIGNUP_WELCOME_BONUS_AMOUNT, applySignupWelcomeBonus } = await import(
    './exchangeLogic'
  );
  assert.equal(SIGNUP_WELCOME_BONUS_AMOUNT, 500);
  assert.equal(
    OFFICIAL_POSTER_ASSETS.megaOffer500Poster,
    '/assets/aistudio/file_00000000032c821198d87fd2de4ca7de_303c7645.png'
  );

  const credited = applySignupWelcomeBonus({
    uid: 'usr_test_500',
    name: 'Test Player',
    email: 'test@sharkexch.in',
    phone: '9876543210',
    walletBalance: 0,
    status: 'Active',
    createdAt: '2026-11-10T00:00:00.000Z',
  });
  assert.equal(credited.walletBalance, 500);
  assert.equal(credited.signupBonus, 500);
});



