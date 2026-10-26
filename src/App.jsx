import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Chart from './Chart';
import {
  DepositIcon,
  SoundMuteIcon,
  SettingsSlidersIcon,
  ClockIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  MenuNavIcon,
  AchievementsNavIcon,
  BattlesNavIcon,
  InventoryNavIcon,
  ChevronDownIcon,
  PairFlagsUSDJPY
} from './SVGIcons';
import './style.css';

export default function App() {
  const [accountType, setAccountType] = useState('Real');
  const [amount, setAmount] = useState(1000);
  const [duration, setDuration] = useState('00:05');
  const [activeNav, setActiveNav] = useState(null);
  const [muted, setMuted] = useState(true);

  const navItems = [
    { key: 'menu', label: 'القائمة', Icon: MenuNavIcon },
    { key: 'achievements', label: 'الإنجازات', Icon: AchievementsNavIcon },
    { key: 'battles', label: 'المعارك', Icon: BattlesNavIcon },
    { key: 'inventory', label: 'المخزون', Icon: InventoryNavIcon }
  ];

  return (
    <div className="trading-shell" dir="rtl">
      {/* 1. الشريط العلوي - الرصيد والحساب */}
      <header className="top-header">
        <button className="deposit-btn">
          <DepositIcon />
          <span>إيداع</span>
        </button>
        <div className="balance-center">
          <div className="balance-label">الرصيد</div>
          <div className="balance-value">$0.00</div>
        </div>
        <div className="account-toggle">
          <button
            onClick={() => setAccountType('Real')}
            className={accountType === 'Real' ? 'active-real' : ''}
          >
            Real
          </button>
          <button
            onClick={() => setAccountType('Demo')}
            className={accountType === 'Demo' ? 'active-demo' : ''}
          >
            Demo
          </button>
        </div>
      </header>

      {/* 2. شريط أدوات الزوج والأيقونات */}
      <div className="toolbar-row">
        <button
          className="icon-circle"
          onClick={() => setMuted(v => !v)}
          aria-label="الصوت"
        >
          <SoundMuteIcon />
        </button>
        <button className="pair-pill">
          <ChevronDownIcon />
          <span className="pair-label">USD / JPY (OTC)</span>
          <span className="pair-change">
            0.0004 <span className="pair-arrow">▼</span>
          </span>
          <PairFlagsUSDJPY />
        </button>
        <div className="toolbar-icons">
          <button className="icon-circle" aria-label="الإعدادات">
            <SettingsSlidersIcon />
          </button>
          <button className="icon-circle" aria-label="الساعة">
            <ClockIcon />
          </button>
        </div>
      </div>

      {/* 3. حاوية الرسم البياني المتقدم */}
      <main className="chart-container">
        <div className="trading-card chart-card">
          <Chart />
        </div>
      </main>

      {/* 4. لوحة الإدخال وأزرار التنفيذ */}
      <div className="trading-card controls-card">
        <div className="inputs-grid">
          {/* صندوق تحديد المبلغ */}
          <div className="input-box">
            <div className="amount-row">
              <button
                onClick={() => setAmount(prev => prev + 100)}
                className="step-btn"
                aria-label="زيادة"
              >
                +
              </button>
              <span className="amount-value">${amount.toLocaleString('en-US')}</span>
              <button
                onClick={() => setAmount(prev => Math.max(10, prev - 100))}
                className="step-btn"
                aria-label="إنقاص"
              >
                −
              </button>
            </div>
            <div className="input-caption">المبلغ</div>
          </div>
          {/* صندوق وقت الإغلاق */}
          <div className="input-box">
            <div className="duration-row">
              <ClockIcon />
              <span className="duration-value">{duration}</span>
            </div>
            <div className="input-caption">إغلاق تلقائي</div>
          </div>
        </div>

        {/* أزرار أعلى وأسفل */}
        <div className="direction-grid">
          <button className="action-btn-up">
            <ArrowUpRightIcon />
            <span>أعلى</span>
          </button>
          <button className="action-btn-down">
            <ArrowDownRightIcon />
            <span>أسفل</span>
          </button>
        </div>

        {/* نسبة وتفاصيل الأرباح */}
        <div className="payout-note">
          اربح الصفقة واحصل على <span className="payout-pct">%80</span> ~ <span className="payout-amount">$1,800</span>
        </div>
      </div>

      {/* 5. شريط التنقل السفلي */}
      <nav className="trading-card bottom-nav-card">
        {navItems.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`nav-item ${activeNav === key ? 'nav-active' : ''}`}
            onClick={() => setActiveNav(activeNav === key ? null : key)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
