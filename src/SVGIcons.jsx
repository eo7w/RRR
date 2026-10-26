import React from 'react';

const baseProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: '#64748B',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

export const DepositIcon = () => (
  <svg {...baseProps} width={18} height={18} stroke="#1E293B">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

export const SoundMuteIcon = () => (
  <svg {...baseProps} width={18} height={18}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#64748B" stroke="none" />
    <line x1="22" y1="9" x2="16" y2="15" />
    <line x1="16" y1="9" x2="22" y2="15" />
  </svg>
);

export const SoundOnIcon = () => (
  <svg {...baseProps} width={18} height={18}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#64748B" stroke="none" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

export const SettingsSlidersIcon = () => (
  <svg {...baseProps} width={18} height={18}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

export const ClockIcon = () => (
  <svg {...baseProps} width={16} height={16}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const ArrowUpRightIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

export const ArrowDownRightIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="7" x2="17" y2="17" />
    <polyline points="17 7 17 17 7 17" />
  </svg>
);

export const MenuNavIcon = () => (
  <svg {...baseProps}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const AchievementsNavIcon = () => (
  <svg {...baseProps}>
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

export const BattlesNavIcon = () => (
  <svg {...baseProps}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

export const InventoryNavIcon = () => (
  <svg {...baseProps}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

export const ChevronDownIcon = () => (
  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const PairFlagsUSDJPY = () => (
  <div className="relative w-7 h-7 flex items-center justify-center" style={{ minWidth: 28 }}>
    {/* علم الولايات المتحدة الأمريكية (الخلفي) */}
    <svg className="w-5 h-5 rounded-full absolute -right-0.5 top-0 border border-white shadow-sm z-0" viewBox="0 0 32 32" style={{ position: 'absolute', right: -2, top: 0, zIndex: 0 }}>
      <defs>
        <clipPath id="circle-us-flag"><circle cx="16" cy="16" r="16" /></clipPath>
      </defs>
      <g clipPath="url(#circle-us-flag)">
        <rect width="32" height="32" fill="#B22234" />
        <path d="M0 4.92h32M0 9.85h32M0 14.77h32M0 19.69h32M0 24.62h32" stroke="#FFFFFF" strokeWidth="2.46" />
        <rect width="12.8" height="17.23" fill="#3C3B6E" />
      </g>
    </svg>
    {/* علم اليابان (الأمامي) */}
    <svg className="w-5 h-5 rounded-full absolute -left-0.5 bottom-0 border border-white shadow-sm z-10" viewBox="0 0 32 32" style={{ position: 'absolute', left: -2, bottom: 0, zIndex: 10 }}>
      <defs>
        <clipPath id="circle-jp-flag"><circle cx="16" cy="16" r="16" /></clipPath>
      </defs>
      <g clipPath="url(#circle-jp-flag)">
        <rect width="32" height="32" fill="#FFFFFF" />
        <circle cx="16" cy="16" r="9" fill="#BC002D" />
      </g>
    </svg>
  </div>
);
