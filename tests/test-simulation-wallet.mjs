import assert from 'node:assert/strict';
import { reconcileDeposits, decideLocalRequest } from '../src/simulationWallet.js';

class MemoryStorage {
  constructor(seed = {}) { this.data = new Map(Object.entries(seed)); this.writes = []; }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { this.writes.push(key); this.data.set(key, String(value)); }
}
const requests = (items) => JSON.stringify(items.map((item, i) => ({ id: i + 1, local: true, fee: 0, ...item })));
const wallet = storage => JSON.parse(storage.getItem('cue-simulation-wallet-v1'));
const fresh = (items = []) => new MemoryStorage({ 'cue-local-requests': requests(items), 'cue-demo-balance': '10000' });

// Pending does not credit.
{ const s = fresh([{ type: 'deposit', amount: 100, bonus: 0, status: 'pending' }]); const r = reconcileDeposits(s); assert.deepEqual(r.wallet, { cashCents: 0, bonusCents: 0, appliedDepositIds: [] }); }
// Approval credits amount once; repeated approval and reload are idempotent.
{ const s = fresh([{ type: 'deposit', amount: 100, bonus: 0, status: 'pending' }]); let r = decideLocalRequest(1, 'approved', s); assert.equal(r.creditedCents, 10000); assert.deepEqual(wallet(s), { cashCents: 10000, bonusCents: 0, appliedDepositIds: [1] }); r = decideLocalRequest(1, 'approved', s); assert.equal(r.changed, false); assert.equal(wallet(s).cashCents, 10000); r = reconcileDeposits(s); assert.equal(r.wallet.cashCents, 10000); }
// Rejection does not credit.
{ const s = fresh([{ type: 'deposit', amount: 100, bonus: 20, status: 'pending' }]); const r = decideLocalRequest(1, 'rejected', s); assert.equal(r.changed, true); assert.equal(r.wallet.cashCents, 0); }
// Cash and bonus are separate, including decimal conversion to cents.
{ const s = fresh([{ type: 'deposit', amount: 100.25, bonus: 20.5, status: 'pending' }]); const r = decideLocalRequest(1, 'approved', s); assert.deepEqual(r.wallet, { cashCents: 10025, bonusCents: 2050, appliedDepositIds: [1] }); assert.equal(r.creditedCents, 12075); }
// Approved legacy request is migrated exactly once.
{ const s = fresh([{ type: 'deposit', amount: 7.5, bonus: 1.25, status: 'approved' }]); let r = reconcileDeposits(s); assert.deepEqual(r.wallet, { cashCents: 750, bonusCents: 125, appliedDepositIds: [1] }); r = reconcileDeposits(s); assert.deepEqual(r.wallet, { cashCents: 750, bonusCents: 125, appliedDepositIds: [1] }); }
// local:false is ignored; omitted local is legacy-compatible.
{ const s = fresh([{ type: 'deposit', amount: 100, bonus: 0, status: 'approved', local: false }, { type: 'deposit', amount: 3, bonus: 0, status: 'approved', local: undefined }]); const r = reconcileDeposits(s); assert.equal(r.wallet.cashCents, 300); }
// Withdraw approval changes only request status and never debits.
{ const s = fresh([{ type: 'withdraw', amount: 100, bonus: 0, status: 'pending' }]); const r = decideLocalRequest(1, 'approved', s); assert.equal(r.changed, true); assert.equal(r.creditedCents, 0); assert.equal(r.wallet.cashCents, 0); }
// Invalid statuses, settled requests, invalid amounts, NaN, and negatives are rejected safely.
{ const s = fresh([{ type: 'deposit', amount: 10, bonus: 0, status: 'pending' }]); assert.equal(decideLocalRequest(1, 'pending', s).changed, false); assert.equal(decideLocalRequest(1, 'rejected', s).changed, true); assert.equal(decideLocalRequest(1, 'approved', s).changed, false); }
for (const bad of [NaN, -1, 50000.01]) { const s = fresh([{ type: 'deposit', amount: bad, bonus: 0, status: 'pending' }]); const r = decideLocalRequest(1, 'approved', s); assert.equal(r.changed, false); assert.equal(r.wallet.cashCents, 0); }
{ const s = fresh([{ type: 'deposit', amount: 1, bonus: NaN, status: 'pending' }]); assert.equal(decideLocalRequest(1, 'approved', s).changed, false); }
// Corrupted storage is non-throwing and does not touch demo balance.
{ const s = new MemoryStorage({ 'cue-local-requests': '{bad', 'cue-simulation-wallet-v1': '{bad', 'cue-demo-balance': '4321' }); const r = reconcileDeposits(s); assert.deepEqual(r.requests, []); assert.deepEqual(r.wallet, { cashCents: 0, bonusCents: 0, appliedDepositIds: [] }); assert.equal(s.getItem('cue-demo-balance'), '4321'); }
console.log('simulation wallet tests: all passed (10 scenarios)');
