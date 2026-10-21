const REQUESTS_KEY = 'cue-local-requests';
const WALLET_KEY = 'cue-simulation-wallet-v1';

const emptyWallet = () => ({ cashCents: 0, bonusCents: 0, appliedDepositIds: [] });

function readJson(storage, key, fallback) {
  try {
    const value = storage?.getItem?.(key);
    return value == null ? fallback : JSON.parse(value);
  } catch { return fallback; }
}

function readRequests(storage) {
  const value = readJson(storage, REQUESTS_KEY, []);
  return Array.isArray(value) ? value : [];
}

function readWallet(storage) {
  const value = readJson(storage, WALLET_KEY, null);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyWallet();
  const cashCents = Number.isInteger(value.cashCents) && value.cashCents >= 0 ? value.cashCents : 0;
  const bonusCents = Number.isInteger(value.bonusCents) && value.bonusCents >= 0 ? value.bonusCents : 0;
  const appliedDepositIds = Array.isArray(value.appliedDepositIds) ? [...value.appliedDepositIds] : [];
  const wallet = { cashCents, bonusCents, appliedDepositIds };
  if (Array.isArray(value.operations)) wallet.operations = [...value.operations];
  return wallet;
}

function persist(storage, key, value) {
  try { storage?.setItem?.(key, JSON.stringify(value)); } catch { /* تخزين اختياري */ }
}

function cents(value, { bonus = false, allowZero = false } = {}) {
  if (!Number.isFinite(value) || value < 0 || (!allowZero && !bonus && value === 0)) return null;
  const result = Math.round(value * 100);
  return Number.isSafeInteger(result) ? result : null;
}

function validDeposit(request) {
  if (!request || request.type !== 'deposit') return null;
  const amountCents = cents(request.amount);
  const bonusCents = cents(request.bonus === undefined ? 0 : request.bonus, { bonus: true, allowZero: true });
  return amountCents === null || bonusCents === null || amountCents > 5000000 || bonusCents > 125000 ? null : { amountCents, bonusCents };
}

function getStorage(storage) { return storage === undefined ? globalThis.localStorage : storage; }

function reconcileDeposits(storage = globalThis.localStorage) {
  storage = getStorage(storage);
  const requests = readRequests(storage);
  const before = readWallet(storage);
  const wallet = { ...before, appliedDepositIds: [...before.appliedDepositIds] };
  if (before.operations) wallet.operations = [...before.operations];
  let changed = false;
  for (const request of requests) {
    if (request?.type !== 'deposit' || request.status !== 'approved' || request.local === false) continue;
    if (wallet.appliedDepositIds.includes(request.id)) continue;
    const amounts = validDeposit(request);
    if (!amounts) continue;
    wallet.cashCents += amounts.amountCents;
    wallet.bonusCents += amounts.bonusCents;
    wallet.appliedDepositIds.push(request.id);
    changed = true;
  }
  if (changed) persist(storage, WALLET_KEY, wallet);
  return { requests, wallet };
}

function decideLocalRequest(id, status, storage = globalThis.localStorage) {
  storage = getStorage(storage);
  if (status !== 'approved' && status !== 'rejected') {
    const { requests, wallet } = reconcileDeposits(storage);
    return { requests, wallet, changed: false, creditedCents: 0, error: 'اختر قبول الطلب أو رفضه' };
  }
  const requests = readRequests(storage);
  const index = requests.findIndex(request => request?.id === id);
  if (index < 0) {
    const { wallet } = reconcileDeposits(storage);
    return { requests, wallet, changed: false, creditedCents: 0, error: 'الطلب غير موجود في هذا المتصفح' };
  }
  const request = requests[index];
  if (request.status !== 'pending') {
    const { wallet } = reconcileDeposits(storage);
    return { requests, wallet, changed: false, creditedCents: 0, error: 'هذا الطلب محسوم مسبقًا — لم يتغير الرصيد' };
  }
  if (status === 'approved' && request.type === 'deposit' && request.local !== false && !validDeposit(request)) {
    const { wallet } = reconcileDeposits(storage);
    return { requests, wallet, changed: false, creditedCents: 0, error: 'مبلغ الإيداع أو المكافأة غير صالح' };
  }
  const nextRequests = requests.map((item, itemIndex) => itemIndex === index ? { ...item, status } : item);
  persist(storage, REQUESTS_KEY, nextRequests);
  const result = reconcileDeposits(storage);
  const creditedCents = status === 'approved' && request.type === 'deposit' && request.local !== false
    ? (validDeposit(request).amountCents + validDeposit(request).bonusCents) : 0;
  return { ...result, changed: true, creditedCents };
}

function spendableBalance(mode, demoBalance, wallet) {
  if (mode === 'demo') return Number.isFinite(demoBalance) && demoBalance >= 0 ? demoBalance : 0;
  const cash = Number.isInteger(wallet?.cashCents) && wallet.cashCents >= 0 ? wallet.cashCents : 0;
  const bonus = Number.isInteger(wallet?.bonusCents) && wallet.bonusCents >= 0 ? wallet.bonusCents : 0;
  return (cash + bonus) / 100;
}

function operationWallet(wallet) {
  return { ...wallet, appliedDepositIds: [...wallet.appliedDepositIds], operations: Array.isArray(wallet.operations) ? [...wallet.operations] : [] };
}
function validOperationId(id) { return id !== undefined && id !== null && id !== ''; }

function debitSimulation(amount, operationId, storage = globalThis.localStorage) {
  storage = getStorage(storage);
  const { wallet: reconciled } = reconcileDeposits(storage);
  const wallet = operationWallet(reconciled);
  if (!validOperationId(operationId)) return { ok: false, wallet: reconciled, cashCents: 0, bonusCents: 0, alreadyApplied: false, error: 'معرّف العملية غير صالح' };
  if (wallet.operations.includes(operationId)) return { ok: true, wallet: reconciled, cashCents: 0, bonusCents: 0, alreadyApplied: true };
  const required = Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null;
  if (!Number.isSafeInteger(required) || required <= 0) return { ok: false, wallet: reconciled, cashCents: 0, bonusCents: 0, alreadyApplied: false, error: 'مبلغ الخصم غير صالح' };
  if (required > wallet.cashCents + wallet.bonusCents) return { ok: false, wallet: reconciled, cashCents: 0, bonusCents: 0, alreadyApplied: false, error: 'الرصيد غير كافٍ' };
  const cashCents = Math.min(wallet.cashCents, required);
  const bonusCents = required - cashCents;
  wallet.cashCents -= cashCents; wallet.bonusCents -= bonusCents; wallet.operations.push(operationId);
  persist(storage, WALLET_KEY, wallet);
  return { ok: true, wallet, cashCents, bonusCents, alreadyApplied: false };
}

function creditSimulation({ cash, bonus = 0 } = {}, operationId, storage = globalThis.localStorage) {
  storage = getStorage(storage);
  const { wallet: reconciled } = reconcileDeposits(storage);
  const wallet = operationWallet(reconciled);
  if (!validOperationId(operationId)) return { ok: false, wallet: reconciled, alreadyApplied: false, error: 'معرّف العملية غير صالح' };
  if (wallet.operations.includes(operationId)) return { ok: true, wallet: reconciled, alreadyApplied: true };
  const cashCents = cents(cash, { allowZero: true });
  const bonusCents = cents(bonus, { bonus: true, allowZero: true });
  if (cashCents === null || bonusCents === null) return { ok: false, wallet: reconciled, alreadyApplied: false, error: 'مبلغ الربح أو الإرجاع غير صالح' };
  wallet.cashCents += cashCents; wallet.bonusCents += bonusCents; wallet.operations.push(operationId);
  persist(storage, WALLET_KEY, wallet);
  return { ok: true, wallet, alreadyApplied: false };
}

module.exports = { reconcileDeposits, decideLocalRequest, spendableBalance, debitSimulation, creditSimulation };
