import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import {
  Menu,
  Trophy,
  Award,
  BriefcaseBusiness,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Clock,
  ChevronDown,
  X,
  Plus,
  Minus,
  Delete,
  Search,
  Star,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { ASSETS, useMarket } from './market';
import { useAssetQuotes, formatAssetPrice, quoteStatusText } from './assetQuotes';
import Chart from './Chart';
import Rewards from './Rewards';
import Account from './Account';
import ChartSettings from './ChartSettings';
import RecentTrades from './RecentTrades';
import AssetPicker, { REFERENCE_ASSETS } from './AssetPicker';
import './assetpicker.css';
import './style.css';
import './glass-universal.css';
import {
  reconcileDeposits,
  decideLocalRequest,
  spendableBalance,
  debitSimulation,
  creditSimulation
} from './simulationWallet';

// إدراج الأصول المرجعية غير الموجودة سابقًا
REFERENCE_ASSETS.forEach(a => {
  if (!ASSETS.some(existing => existing.symbol === a.symbol)) {
    ASSETS.push(a);
  }
});

const initialSettings = {
  type: 'candles',
  color: '#f0b04b',
  upColor: '#00b883',
  downColor: '#df4c42',
  background: '#121216',
  grid: false,
  crosshair: true,
  social: false,
  autoZoom: true,
  timer: true,
  interval: '1m',
  alligator: false,
  alligatorValues: {
    jaw: 13,
    jawShift: 8,
    teeth: 8,
    teethShift: 5,
    lips: 5,
    lipsShift: 3,
    jawColor: '#ff7d8b',
    teethColor: '#226e98',
    lipsColor: '#9460ef'
  },
  indicators: []
};

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function money(v) {
  return '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

const previewParams = new URLSearchParams(window.location.search);
const chartPages = [
  'chart-menu',
  'chart-style',
  'indicators',
  'alligator',
  'lines',
  'pen',
  'awesome',
  'bollinger',
  'fractal',
  'macd',
  'movingAverage',
  'parabolic',
  'rsi',
  'stochastic',
  'atr',
  'stochRsi',
  'momentum'
];

function App() {
  const dragControls = useDragControls();
  const [settings, setSettings] = useState(() => ({
    ...initialSettings,
    ...load('cue-trade-chart', {}),
    ...(['line', 'area', 'bar', 'candles'].includes(previewParams.get('type'))
      ? { type: previewParams.get('type') }
      : {})
  }));

  const [asset, setAsset] = useState(() => 
    ASSETS.find(a => a.symbol === previewParams.get('asset')) || 
    ASSETS.find(a => a.symbol === 'USDCHF') || 
    ASSETS[0]
  );
  
  const market = useMarket(asset.symbol, settings.interval);

  const [page, setPage] = useState(() => {
    const p = previewParams.get('screen');
    return [
      ...chartPages,
      'amount',
      'duration',
      'assets',
      'positions',
      'recent-trades',
      'insufficient',
      'inventory',
      'battles',
      'achievements',
      'account',
      'settings',
      'wallet',
      'deposit',
      'withdraw',
      'history',
      'profile',
      'security',
      'news',
      'vip',
      'approval',
      'verification',
      'logout'
    ].includes(p) ? p : null;
  });

  const [mode, setMode] = useState('real');
  const [balance, setBalance] = useState(() => load('cue-demo-balance', 10000));
  const [simulationWallet, setSimulationWallet] = useState(() => reconcileDeposits().wallet);
  const assetQuotes = useAssetQuotes(page === 'assets');
  const simulationBalance = (simulationWallet.cashCents + simulationWallet.bonusCents) / 100;
  const currentBalance = spendableBalance(mode, balance, simulationWallet);

  const [amount, setAmount] = useState(1000);
  const [duration, setDuration] = useState(5);
  const [draftAmount, setDraftAmount] = useState('1000');
  const [draftDuration, setDraftDuration] = useState(5);
  const [muted, setMuted] = useState(true);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState(() => load('cue-favorites', ['GBPUSD', 'EURUSD', 'XAUUSD', 'USDBRL', 'USDCHF', 'NVDA', 'AUDUSD']));
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [activeBattle, setActiveBattle] = useState(() => load('cue-local-battle', null));
  const [trades, setTrades] = useState(() => load('cue-local-trades', []));
  const [request, setRequest] = useState(null);

  const toastTimer = useRef(null);
  const marketRef = useRef(market);
  marketRef.current = market;

  const tradesRef = useRef(trades);
  const demoBalanceRef = useRef(balance);
  tradesRef.current = trades;
  demoBalanceRef.current = balance;

  useEffect(() => {
    localStorage.setItem('cue-trade-chart', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('cue-demo-balance', JSON.stringify(balance));
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('cue-local-trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('cue-favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const h = e => {
      if (e.key === 'Escape') setPage(null);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    const sync = e => {
      if (!e || e.key === null || ['cue-local-requests', 'cue-simulation-wallet-v1'].includes(e.key)) {
        setSimulationWallet(reconcileDeposits().wallet);
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const onDecision = (id, status) => {
    const result = decideLocalRequest(id, status);
    setSimulationWallet(result.wallet);
    if (result.changed && result.creditedCents > 0) setMode('real');
    return result;
  };

  const notify = text => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(''), 2800);
  };

  const navigate = p => {
    setActiveBattle(load('cue-local-battle', null));
    setPage(p === 'trade' ? null : p);
    setQuery('');
  };

  const sound = () => {
    if (muted) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const c = new AC(),
        o = c.createOscillator(),
        g = c.createGain();
      o.frequency.value = 560;
      g.gain.setValueAtTime(0.025, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
      o.connect(g);
      g.connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.065);
      o.onended = () => c.close();
    } catch {}
  };

  const changeSettings = patch => {
    if (patch.clearDrawings === true) patch.clearDrawings = Date.now();
    setSettings(s => ({
      ...s,
      ...patch,
      alligatorValues: patch.alligatorValues ? { ...s.alligatorValues, ...patch.alligatorValues } : s.alligatorValues
    }));
  };

  const commitTrades = next => {
    tradesRef.current = next;
    localStorage.setItem('cue-local-trades', JSON.stringify(next));
    setTrades(next);
  };

  const changeDemoBalance = delta => {
    const next = Math.round((demoBalanceRef.current + delta) * 100) / 100;
    demoBalanceRef.current = next;
    localStorage.setItem('cue-demo-balance', JSON.stringify(next));
    setBalance(next);
  };

  const checkBalance = (required = amount) => {
    const wallet = reconcileDeposits().wallet;
    const available = spendableBalance(mode, demoBalanceRef.current, wallet);
    if (mode !== 'demo') setSimulationWallet(wallet);
    if (!Number.isFinite(required) || required <= 0) {
      notify('اختر مبلغًا صالحًا للتداول');
      return false;
    }
    if (Math.round(required * 100) > Math.round(available * 100)) {
      setPage('insufficient');
      return false;
    }
    return true;
  };

  const trade = direction => {
    sound();
    if (!checkBalance(amount)) return;
    if (!market.price || !['live', 'otc'].includes(market.status)) {
      notify('انتظر سعرًا متاحًا قبل فتح الصفقة');
      return;
    }
    const id = globalThis.crypto?.randomUUID?.() || String(Date.now()) + '-' + Math.random().toString(36).slice(2);
    let debit = { cashCents: 0, bonusCents: 0 };
    if (mode === 'demo') {
      changeDemoBalance(-amount);
    } else {
      debit = debitSimulation(amount, 'trade-open:' + id);
      setSimulationWallet(debit.wallet);
      if (!debit.ok) {
        if (debit.error?.includes('كاف')) setPage('insufficient');
        else notify(debit.error || 'تعذر تحديث الرصيد الحقيقي');
        return;
      }
      if (debit.alreadyApplied) return;
    }
    const t = {
      id,
      symbol: asset.symbol,
      label: asset.label,
      direction,
      amount,
      entry: market.price,
      end: Date.now() + duration * 1000,
      start: Date.now(),
      payout: asset.payout,
      status: 'open',
      source: market.status,
      accountMode: mode,
      local: true,
      debitCashCents: debit.cashCents,
      debitBonusCents: debit.bonusCents
    };
    commitTrades([t, ...tradesRef.current]);
    notify('فُتحت الصفقة بنجاح');
  };

  useEffect(() => {
    const timer = setInterval(() => {
      let changed = false;
      const next = tradesRef.current.map(t => {
        if (t.status !== 'open' || Date.now() < t.end) return t;
        const m = marketRef.current,
          valid = t.symbol === asset.symbol && m.price && ['live', 'otc'].includes(m.status);
        const diff = valid ? m.price - t.entry : 0,
          tie = valid && Math.abs(diff) < 1e-12,
          win = valid && !tie && (t.direction === 'up' ? diff > 0 : diff < 0);
        const result = !valid || tie ? 0 : win ? Math.round(t.amount * t.payout) / 100 : -t.amount;
        const returned = Math.round((!valid || tie ? t.amount : win ? t.amount + result : 0) * 100) / 100;

        if ((t.accountMode || 'demo') === 'demo') {
          const settled = load('cue-demo-settlement-ids', []);
          if (!settled.includes(String(t.id))) {
            changeDemoBalance(returned);
            localStorage.setItem('cue-demo-settlement-ids', JSON.stringify([...settled, String(t.id)]));
          }
        } else {
          const principal = Math.min(returned, t.amount),
            cashPrincipal = Math.min(principal, t.debitCashCents ?? Math.round(t.amount * 100) / 100),
            bonusPrincipal = Math.max(0, principal - cashPrincipal),
            profit = Math.max(0, returned - t.amount);
          const credited = creditSimulation(
            {
              cash: Math.round((cashPrincipal + profit) * 100) / 100,
              bonus: Math.round(bonusPrincipal * 100) / 100
            },
            'trade-settle:' + t.id
          );
          if (!credited.ok) return t;
          setSimulationWallet(credited.wallet);
        }
        changed = true;
        return { ...t, status: valid ? 'closed' : 'cancelled', result, exit: valid ? m.price : null };
      });
      if (changed) commitTrades(next);
    }, 1000);
    return () => clearInterval(timer);
  }, [asset.symbol]);

  const onRequest = req => {
    const entry = {
      ...req,
      id: globalThis.crypto?.randomUUID?.() || String(Date.now()) + '-' + Math.random().toString(36).slice(2),
      status: 'pending',
      createdAt: new Date().toISOString(),
      local: true
    };
    const old = load('cue-local-requests', []);
    localStorage.setItem('cue-local-requests', JSON.stringify([entry, ...old]));
    setRequest(entry);
    notify('تم إرسال الطلب بنجاح');
  };

  const sheetTitles = {
    amount: '',
    duration: 'إغلاق تلقائي',
    assets: '',
    positions: 'الصفقات',
    'recent-trades': 'الصفقات الأخيرة',
    insufficient: 'غير كافٍ'
  };

  const items = [...ASSETS]
    .sort((a, b) => b.payout - a.payout)
    .filter(
      a =>
        (!onlyFavorites || favorites.includes(a.symbol)) &&
        (!query || (a.label + ' ' + a.symbol).toLowerCase().includes(query.toLowerCase()))
    );

  const keypad = k => {
    sound();
    setDraftAmount(s =>
      k === '⌫'
        ? s.slice(0, -1) || '0'
        : k === '.'
        ? s.includes('.')
          ? s
          : s + '.'
        : (s === '0' ? k : s + k).slice(0, 9)
    );
  };

  const isReward = ['inventory', 'battles', 'achievements'].includes(page);
  const isChart = chartPages.includes(page);
  const isBasic = ['amount', 'duration', 'assets', 'positions', 'recent-trades', 'insufficient'].includes(page);

  return (
    <div
      className={'device-shell ' + (page && !isBasic && !isChart && !isReward ? 'account-open account-page--' + page : '')}
      dir="rtl"
    >
      <main className={'trading-app ' + (page ? 'behind-sheet' : '')}>
        <header className="account-header">
          <button className="deposit-pill transition-transform active:scale-95" onClick={() => navigate('deposit')}>
            إيداع
          </button>
          <button className="balance-display" onClick={() => navigate('wallet')} aria-label="الرصيد">
            <small>{mode === 'demo' ? 'الرصيد التجريبي' : 'الرصيد الحقيقي'}</small>
            <strong>{money(currentBalance)}</strong>
          </button>
          <div className="account-modes flex items-center" dir="ltr">
            <button className={mode === 'real' ? 'selected-real' : ''} onClick={() => setMode('real')} aria-label="الحساب الحقيقي">
              حقيقي
            </button>
            <button className={mode === 'demo' ? 'selected-demo' : ''} onClick={() => setMode('demo')}>
              Demo
            </button>
          </div>
        </header>

        <div className="trade-toolbar" dir="ltr">
          <button
            className="circle sound"
            onClick={() => {
              setMuted(v => !v);
              notify(muted ? 'الصوت مفعّل' : 'الصوت مكتوم');
            }}
            aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button
            className="pair-select"
            aria-label="اختيار الأصل"
            aria-haspopup="dialog"
            aria-expanded={page === 'assets'}
            onClick={() => navigate('assets')}
          >
            <ChevronDown size={13} />
            <div>
              <strong>
                {asset.label}
                {market.status === 'otc' ? ' (OTC)' : ''}
              </strong>
              <small
                data-selected-quote={asset.symbol}
                title="سعر BiQuote"
                className={market.tick?.direction === 'DOWN' ? 'negative' : 'positive'}
              >
                {formatAssetPrice(market.tick?.mid, asset.digits)}
                <span>{market.tick?.direction === 'DOWN' ? '▼' : '▲'}</span>
              </small>
            </div>
            <span className={'pair-flag ' + ((asset.flag || '').length < 4 ? 'text-flag' : '')}>
              {asset.icon ? <img src={asset.icon} alt="" /> : asset.flag}
            </span>
          </button>
          <button className="circle" onClick={() => navigate('chart-menu')} aria-label="إعدادات الرسم البياني">
            <SlidersHorizontal size={18} />
          </button>
          <button className="circle" onClick={() => navigate('recent-trades')} aria-label="الصفقات الأخيرة">
            <Clock size={20} />
          </button>
        </div>

        <Chart
          battle={activeBattle}
          onBattleClick={() => navigate('battles')}
          market={market}
          asset={asset}
          settings={settings}
          trades={trades}
          onTradeClick={() => navigate('positions')}
          onToast={notify}
        />

        <section className="trade-controls">
          <div className="inputs-line" dir="ltr">
            <div className="amount-step">
              <button
                className="step-circle"
                aria-label="زيادة المبلغ"
                onClick={() => {
                  setAmount(v => Math.min(50000, v + 100));
                  sound();
                }}
              >
                <Plus size={23} />
              </button>
              <button
                className="amount-value"
                onClick={() => {
                  setDraftAmount(String(amount));
                  navigate('amount');
                }}
              >
                {'$' + amount}
              </button>
              <button
                className="step-circle"
                aria-label="تقليل المبلغ"
                onClick={() => {
                  setAmount(v => Math.max(1, v - 100));
                  sound();
                }}
              >
                <Minus size={23} />
              </button>
            </div>
            <button
              className="duration-pill"
              onClick={() => {
                setDraftDuration(duration);
                navigate('duration');
              }}
            >
              {String(Math.floor(duration / 60)).padStart(2, '0')}:{String(duration % 60).padStart(2, '0')}
            </button>
          </div>
          <div className="input-captions">
            <span>إغلاق تلقائي</span>
            <span>المبلغ</span>
          </div>
          <div className="direction-buttons" dir="ltr">
            <button className="up" onClick={() => trade('up')}>
              أعلى
            </button>
            <button className="down" onClick={() => trade('down')}>
              أسفل
            </button>
          </div>
          <p className="payout-note">
            اربح الصفقة واحصل على <b>ربح {asset.payout}% · {money(amount * (1 + asset.payout / 100))}</b>
          </p>
        </section>
      </main>

      <AnimatePresence mode="wait">
        {page && (
          <motion.div
            className="modal-layer"
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="backdrop" onClick={() => navigate('trade')} />
            <motion.section
              key={page}
              className={
                'bottom-sheet sheet--' +
                page +
                ' ' +
                (isReward ? 'reward-sheet ' : '') +
                (isChart ? 'chart-sheet ' : '') +
                (page === 'amount' ? 'amount-sheet ' : '') +
                (!isBasic && !isChart && !isReward ? 'account-sheet ' : '')
              }
              role="dialog"
              aria-modal="true"
              aria-label={sheetTitles[page] || page}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 32, stiffness: 350, mass: 0.85 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              dragListener={false}
              dragControls={dragControls}
              onDragEnd={(_, info) => {
                if (info.offset.y > 75 || info.velocity.y > 550) navigate('trade');
              }}
            >
              <SheetHandle
                dragControls={dragControls}
                closeLabel={page === 'assets' ? 'إغلاق اختيار الأصل' : undefined}
                onClose={['recent-trades', 'assets'].includes(page) ? () => navigate('trade') : undefined}
              />

              {isReward ? (
                <Rewards
                  accountMode={mode}
                  balance={currentBalance}
                  requiredAmount={amount}
                  onCheckBalance={checkBalance}
                  page={page}
                  onClose={() => navigate('trade')}
                  onNavigate={navigate}
                  onToast={notify}
                />
              ) : isChart ? (
                <ChartSettings
                  page={page}
                  settings={settings}
                  onChange={changeSettings}
                  onNavigate={navigate}
                  onClose={() => navigate('trade')}
                  onToast={notify}
                />
              ) : !isBasic ? (
                <Account
                  page={page}
                  onNavigate={navigate}
                  onClose={() => navigate('trade')}
                  onToast={notify}
                  balance={simulationWallet.cashCents / 100}
                  bonusBalance={simulationWallet.bonusCents / 100}
                  onRequest={onRequest}
                  onDecision={onDecision}
                />
              ) : null}

              {page === 'amount' && (
                <div className="amount-content">
                  <div className="amount-big" dir="ltr">
                    ${draftAmount}
                  </div>
                  <p className="subtle">أدخل قيمة الصفقة</p>
                  <button
                    className="primary"
                    onClick={() => {
                      const n = Number(draftAmount);
                      if (n < 1 || n > 50000 || !Number.isFinite(n)) {
                        notify('اختر مبلغًا بين $1 و$50,000');
                        return;
                      }
                      setAmount(n);
                      navigate('trade');
                    }}
                  >
                    تأكيد
                  </button>
                  <div className="number-pad">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(k =>
                      k === '' ? (
                        <span key="empty" />
                      ) : (
                        <button key={k} onClick={() => keypad(k)} aria-label={k === '⌫' ? 'حذف رقم' : k}>
                          {k === '⌫' ? <Delete size={22} /> : <span>{k}</span>}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {page === 'duration' && (
                <div className="duration-content">
                  <button className="sheet-close circle" onClick={() => navigate('trade')} aria-label="إغلاق">
                    <X size={18} />
                  </button>
                  <h1>إغلاق تلقائي</h1>
                  <p className="subtle">حدد الوقت الذي تُغلق فيه صفقتك تلقائيًا</p>
                  <div className="time-wheels">
                    <TimeWheel
                      label="س"
                      value={Math.floor(draftDuration / 3600)}
                      max={23}
                      onChange={v => setDraftDuration(d => v * 3600 + (d % 3600))}
                    />
                    <TimeWheel
                      label="د"
                      value={Math.floor(draftDuration / 60) % 60}
                      max={59}
                      onChange={v => setDraftDuration(d => Math.floor(d / 3600) * 3600 + v * 60 + (d % 60))}
                    />
                    <TimeWheel
                      label="ثانية"
                      value={draftDuration % 60}
                      max={59}
                      onChange={v => setDraftDuration(d => Math.floor(d / 60) * 60 + v)}
                    />
                  </div>
                  <div className="duration-presets">
                    {[5, 10, 15, 20, 25].map(n => (
                      <button className={draftDuration === n ? 'active' : ''} key={n} onClick={() => setDraftDuration(n)}>
                        {n} ثانية
                      </button>
                    ))}
                  </div>
                  <button
                    className="primary"
                    onClick={() => {
                      if (draftDuration < 1) {
                        notify('حدد مدة ثانية واحدة على الأقل');
                        return;
                      }
                      setDuration(draftDuration);
                      navigate('trade');
                    }}
                  >
                    حفظ
                  </button>
                </div>
              )}

              {page === 'assets' && (
                <AssetPicker
                  assets={ASSETS}
                  quotes={assetQuotes}
                  query={query}
                  setQuery={setQuery}
                  favorites={favorites}
                  setFavorites={setFavorites}
                  onlyFavorites={onlyFavorites}
                  setOnlyFavorites={setOnlyFavorites}
                  onSelect={a => {
                    setAsset({ flag: '', digits: 2, payout: 80, ...a });
                    navigate('trade');
                  }}
                />
              )}

              {page === 'insufficient' && (
                <div className="insufficient-content">
                  <h2>غير كافٍ</h2>
                  <img className="cash-stack-image" src="/assets/cash-stack.png" alt="" />
                  <p>
                    الرصيد المتاح: <b dir="ltr">{money(currentBalance)}</b>
                    <br />
                    المبلغ المطلوب: <b dir="ltr">{money(amount)}</b>
                    <br />
                    اختر مبلغًا أقل أو قم بإجراء إيداع.
                  </p>
                  <div className="two-buttons">
                    <button className="secondary" onClick={() => { setMode('demo'); navigate('trade'); }}>
                      انتقل إلى الحساب التجريبي
                    </button>
                    <button className="primary" onClick={() => navigate('deposit')}>
                      إيداع
                    </button>
                  </div>
                </div>
              )}

              {page === 'recent-trades' && <RecentTrades trades={trades} />}

              {page === 'positions' && (
                <div className="positions-content">
                  <div className="sheet-title">
                    <button className="circle" onClick={() => navigate('trade')} aria-label="إغلاق">
                      <X size={17} />
                    </button>
                    <h2>الصفقات</h2>
                  </div>
                  {trades.length ? (
                    trades.map(t => (
                      <div className="position-row" key={t.id}>
                        <span className={t.direction === 'up' ? 'positive' : 'negative'}>
                          {t.direction === 'up' ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                        </span>
                        <div>
                          <strong>{t.label}</strong>
                          <small>
                            {t.status === 'open'
                              ? 'مفتوحة'
                              : t.status === 'cancelled'
                              ? 'أُلغيت لعدم توفر سعر التسوية'
                              : 'مغلقة'}
                          </small>
                        </div>
                        <b dir="ltr">{money(t.amount)}</b>
                        <span className={t.result >= 0 ? 'positive' : 'negative'}>
                          {t.status === 'open' ? '…' : money(t.result || 0)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="empty subtle">القائمة فارغة</p>
                  )}
                </div>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="bottom-nav" aria-label="التنقل الرئيسي" dir="ltr">
        {[
          { p: 'account', text: 'القائمة', Icon: Menu },
          { p: 'achievements', text: 'الإنجازات', Icon: Award },
          { p: 'battles', text: 'المعارك', Icon: Trophy },
          { p: 'inventory', text: 'المخزون', Icon: BriefcaseBusiness }
        ].map(({ p, text, Icon }) => (
          <button key={p} className={page === p ? 'active' : ''} onClick={() => navigate(page === p ? 'trade' : p)}>
            <img className="nav-original-icon" src={`/assets/nav-${p === 'account' ? 'menu' : p}.png`} alt="" />
            <span>{text}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            role="status"
            aria-live="polite"
            className="toast"
            initial={{ opacity: 0, y: 8, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 8, x: '-50%' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AssetQuote({ asset, quote }) {
  const status = quote?.status || (asset.unavailable ? 'unavailable' : 'loading');
  return (
    <span
      className={'asset-quote quote--' + status}
      data-price-symbol={asset.symbol}
      data-price-state={status}
      data-price-value={quote?.price || ''}
      title="سعر BiQuote"
    >
      <b dir="ltr">{formatAssetPrice(quote?.price, asset.digits)}</b>
      <small>{quoteStatusText(status)}</small>
    </span>
  );
}

function SheetHandle({ dragControls, onClose, closeLabel }) {
  if (onClose)
    return (
      <button className="sheet-drag-zone" aria-label={closeLabel || 'إغلاق سجل الصفقات'} onClick={onClose} onPointerDown={e => dragControls.start(e)}>
        <span className="sheet-handle" />
      </button>
    );
  return (
    <div className="sheet-drag-zone" aria-label="اسحب لأسفل للإغلاق" onPointerDown={e => dragControls.start(e)}>
      <span className="sheet-handle" />
    </div>
  );
}

function TimeWheel({ label, value, max, onChange }) {
  const start = useRef(null);
  return (
    <div
      className="time-wheel"
      onPointerDown={e => {
        start.current = e.clientY;
      }}
      onPointerUp={e => {
        if (start.current !== null && Math.abs(e.clientY - start.current) > 20)
          onChange(Math.max(0, Math.min(max, value + Math.round((start.current - e.clientY) / 28))));
        start.current = null;
      }}
      onWheel={e => onChange(Math.max(0, Math.min(max, value + Math.sign(e.deltaY))))}
    >
      <div className="wheel-ghost">{value >= 2 ? value - 2 : ''}</div>
      <button className="wheel-ghost" aria-label={'تقليل ' + label} onClick={() => onChange(Math.max(0, value - 1))}>
        {value >= 1 ? value - 1 : ''}
      </button>
      <div className="wheel-current">
        <select value={value} aria-label={label} onChange={e => onChange(+e.target.value)}>
          {Array.from({ length: max + 1 }, (_, n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span>{label}</span>
      </div>
      <button className="wheel-ghost" aria-label={'زيادة ' + label} onClick={() => onChange(Math.min(max, value + 1))}>
        {value < max ? value + 1 : ''}
      </button>
      <div className="wheel-ghost">{value < max - 1 ? value + 2 : ''}</div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
