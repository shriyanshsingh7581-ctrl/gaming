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
  parseFirebaseConfigSnippet,
  calculateMinesMultiplier,
} from './exchangeLogic';

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
  // Valid UPI withdrawal
  assert.equal(
    validateWithdrawalInput({
      amount: 1000,
      walletBalance: 2500,
      method: 'UPI',
      upiId: 'player@okaxis',
    }).valid,
    true
  );

  // Exceeds wallet balance
  assert.equal(
    validateWithdrawalInput({
      amount: 3000,
      walletBalance: 2500,
      method: 'UPI',
      upiId: 'player@okaxis',
    }).valid,
    false
  );

  // Invalid Bank details
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

  // Valid Bank withdrawal
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
      apiKey: 'AIzaSyTestKey123',
      projectId: 'shark-exch-live',
      databaseURL: 'https://shark-exch-live-default-rtdb.firebaseio.com',
    })
  );
  assert.equal(jsonResult.valid, true);
  assert.equal(jsonResult.config?.projectId, 'shark-exch-live');

  const jsSnippet = `
    const firebaseConfig = {
      apiKey: "AIzaSyJSKey999",
      authDomain: "shark-exch.firebaseapp.com",
      databaseURL: "https://shark-exch-default-rtdb.firebaseio.com",
      projectId: "shark-exch"
    };
  `;
  const snippetResult = parseFirebaseConfigSnippet(jsSnippet);
  assert.equal(snippetResult.valid, true);
  assert.equal(snippetResult.config?.apiKey, 'AIzaSyJSKey999');
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
