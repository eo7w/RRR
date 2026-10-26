import React from 'react';

export default function Chart() {
  // بيانات الشموع اليابانية المتطابقة مع حركة السعر البصرية
  const candles = [
    { open: 80, high: 65, low: 110, close: 70, isUp: true },
    { open: 95, high: 75, low: 135, close: 130, isUp: false },
    { open: 130, high: 60, low: 140, close: 70, isUp: true },
    { open: 85, high: 75, low: 105, close: 100, isUp: true },
    { open: 102, high: 95, low: 115, close: 110, isUp: true },
    { open: 110, high: 105, low: 125, close: 120, isUp: false },
    { open: 118, high: 110, low: 130, close: 125, isUp: true },
    { open: 125, high: 115, low: 135, close: 130, isUp: false },
    { open: 130, high: 120, low: 145, close: 140, isUp: true },
    { open: 140, high: 130, low: 155, close: 150, isUp: false },
    { open: 148, high: 140, low: 165, close: 160, isUp: true },
    { open: 160, high: 150, low: 175, close: 170, isUp: true },
    { open: 170, high: 155, low: 185, close: 180, isUp: false },
    { open: 178, high: 165, low: 195, close: 190, isUp: true },
    { open: 190, high: 180, low: 205, close: 200, isUp: true },
    { open: 200, high: 190, low: 220, close: 215, isUp: false },
    { open: 215, high: 200, low: 235, close: 230, isUp: true },
    { open: 230, high: 220, low: 250, close: 245, isUp: true },
    { open: 245, high: 235, low: 260, close: 255, isUp: false },
    { open: 255, high: 240, low: 275, close: 270, isUp: true },
    { open: 270, high: 250, low: 290, close: 280, isUp: true },
    { open: 280, high: 265, low: 300, close: 290, isUp: false },
    { open: 290, high: 270, low: 305, close: 280, isUp: false },
    { open: 280, high: 260, low: 295, close: 285, isUp: false },
    { open: 285, high: 270, low: 290, close: 275, isUp: true }
  ];

  return (
    <div className="chart-inner">
      {/* 1. علامات الأسعار الفلوت */}
      <div className="price-tag price-tag-top-left">158.0461</div>
      <div className="price-tag price-tag-top-right">158.0484</div>
      <div className="price-tag price-tag-bottom-left">158.0303</div>

      {/* خط السعر الافقي التنفيذي */}
      <div className="execution-line"></div>

      {/* 2. منطقة الرسم البياني المتجه SVG */}
      <div className="chart-svg-area">
        <svg className="chart-svg" viewBox="0 0 500 300" preserveAspectRatio="none">
          {/* خطوط الشبكة الخلفية */}
          <line x1="0" y1="75" x2="500" y2="75" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="0" y1="150" x2="500" y2="150" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="0" y1="225" x2="500" y2="225" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="125" y1="0" x2="125" y2="300" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="250" y1="0" x2="250" y2="300" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="375" y1="0" x2="375" y2="300" stroke="#F1F5F9" strokeWidth="1" />

          {/* حلقة رسم الشموع اليابانية */}
          {candles.map((candle, idx) => {
            const x = idx * 19.5 + 6;
            const candleWidth = 8.5;
            const yTop = 300 - candle.low;
            const yBottom = 300 - candle.high;
            const bodyTop = 300 - Math.max(candle.open, candle.close);
            const bodyHeight = Math.max(4, Math.abs(candle.open - candle.close));
            const color = candle.isUp ? '#10B981' : '#EF4444';
            return (
              <g key={idx}>
                {/* فتيل الشمعة (Wick) */}
                <line
                  x1={x + candleWidth / 2}
                  y1={yTop}
                  x2={x + candleWidth / 2}
                  y2={yBottom}
                  stroke={color}
                  strokeWidth="1.2"
                />
                {/* جسم الشمعة (Body) */}
                <rect
                  x={x}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={color}
                  rx="1.2"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* 3. شريط العلامات الزمنية */}
      <div className="time-axis">
        <span>Oct 20:00</span>
        <span className="time-active">18 Oct 21:00</span>
        <span>21:15</span>
        <span>21:30</span>
      </div>
    </div>
  );
}
