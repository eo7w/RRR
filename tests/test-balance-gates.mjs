import assert from 'node:assert/strict';
import { reconcileDeposits, spendableBalance, debitSimulation, creditSimulation } from '../src/simulationWallet.js';
class MemoryStorage { constructor(seed = {}) { this.data = new Map(Object.entries(seed)); } getItem(k) { return this.data.get(k) ?? null; } setItem(k, v) { this.data.set(k, String(v)); } }
const wallet = s => JSON.parse(s.getItem('cue-simulation-wallet-v1'));
const seeded = (cashCents, bonusCents) => new MemoryStorage({ 'cue-simulation-wallet-v1': JSON.stringify({ cashCents, bonusCents, appliedDepositIds: [] }) });

assert.equal(spendableBalance('live', 999, { cashCents: 50000, bonusCents: 1250 }), 512.5);
assert.equal(spendableBalance('demo', 42.5, { cashCents: 50000, bonusCents: 1250 }), 42.5);
assert.equal(spendableBalance('demo', NaN, null), 0);
let s = seeded(50000, 1250);
let r = debitSimulation(10, 'trade-1', s);
assert.deepEqual({ ok: r.ok, cashCents: r.cashCents, bonusCents: r.bonusCents }, { ok: true, cashCents: 1000, bonusCents: 0 });
assert.equal(spendableBalance('live', 0, r.wallet), 502.5);

s = seeded(500, 0);
r = debitSimulation(10, 'too-large', s);
assert.equal(r.ok, false); assert.equal(r.error, 'الرصيد غير كافٍ'); assert.deepEqual(wallet(s), { cashCents: 500, bonusCents: 0, appliedDepositIds: [] });
s = seeded(1000, 250);
r = debitSimulation(12.5, 'exact', s);
assert.equal(r.ok, true); assert.deepEqual([r.cashCents, r.bonusCents], [1000, 250]);
s = seeded(100, 250); r = debitSimulation(2, 'split', s);
assert.deepEqual([r.cashCents, r.bonusCents], [100, 100]);

s = seeded(5000, 0); r = debitSimulation(10.25, 'cents', s); assert.deepEqual([r.cashCents, r.bonusCents], [1025, 0]);
s = seeded(10000, 0); r = debitSimulation(10, 'once', s); const again = debitSimulation(10, 'once', s);
assert.equal(again.alreadyApplied, true); assert.equal(wallet(s).cashCents, 9000);

s = new MemoryStorage({ 'cue-local-requests': JSON.stringify([{ id: 1, type: 'deposit', amount: 100, bonus: 0, status: 'approved', local: true }]), 'cue-simulation-wallet-v1': JSON.stringify({ cashCents: 0, bonusCents: 0, appliedDepositIds: [] }) });
r = reconcileDeposits(s); assert.equal(r.wallet.cashCents, 10000); debitSimulation(10, 'after-deposit', s); assert.equal(reconcileDeposits(s).wallet.cashCents, 9000);

s = seeded(0, 0); r = creditSimulation({ cash: 12.5, bonus: 1.25 }, 'win', s); assert.equal(r.ok, true); assert.deepEqual([r.wallet.cashCents, r.wallet.bonusCents], [1250, 125]); assert.equal(creditSimulation({ cash: 99 }, 'win', s).alreadyApplied, true);
s = seeded(100, 20); r = creditSimulation({ cash: 0, bonus: 0 }, 'draw', s); assert.equal(r.ok, true); assert.deepEqual([r.wallet.cashCents, r.wallet.bonusCents], [100, 20]);
s = seeded(100, 20); r = creditSimulation({ cash: 10, bonus: 4 }, 'cancel', s); assert.deepEqual([r.wallet.cashCents, r.wallet.bonusCents], [1100, 420]);
s = seeded(0, 0); assert.equal(creditSimulation({ cash: 50001, bonus: 0 }, 'large', s).ok, true);
for (const bad of [NaN, -1, Infinity]) assert.equal(debitSimulation(bad, `bad-${String(bad)}`, seeded(10000, 0)).ok, false);
assert.equal(creditSimulation({ cash: NaN }, 'bad-credit', seeded(0, 0)).ok, false);
console.log('balance gates tests: all passed (13 scenarios)');
