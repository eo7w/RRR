import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings2, Activity, Minus, PenTool, LineChart, AreaChart, BarChart3,
  CandlestickChart, Grid3X3, Crosshair, Timer, ZoomIn, Check, X, ChevronLeft,
  Trash2, TrendingUp, CircleDot, Plus, SlidersHorizontal
} from 'lucide-react';
import './chartsettings.css';

const DEFAULTS = {
  type: 'candles', color: '#f0b04b', upColor: '#00c77b', downColor: '#e7463c',
  background: '#121216', grid: false, crosshair: true, social: false,
  autoZoom: true, timer: true, interval: '1m', alligator: false,
  alligatorValues: { jaw: 13, jawShift: 8, teeth: 8, teethShift: 5, lips: 5, lipsShift: 3, jawColor: '#ff7d8b', teethColor: '#226e98', lipsColor: '#9460ef' }
};
const intervals = ['5s','10s','15s','30s','1m','5m','15m','30m','1h','4h','1d','7d','1mo'];
const palette = ['#366bff','#17bd97','#9460ef','#f0b04b','#f2f2f4'];
const upPalette=['#249d79','#00c77b','#17bd97','#366bff','#f2f2f4','#f0b04b'];
const downPalette = ['#d7464b','#ff5b66','#da32e8','#fa853b','#9460ef','#89939b'];
const backgrounds = ['#121216','#10151e','#081c1b','#101018','#17102a','#090b0e'];
const indicators = [
  ['alligator','التمساح'], ['awesome','المتذبذب الرائع'], ['bollinger','مؤشر بولينجر باند'], ['fractal','كسورية'],
  ['macd','MACD'], ['movingAverage','المتوسط المتحرك'], ['parabolic','مؤشر التوقف والانعكاس'], ['rsi','مؤشر القوة النسبية'],
  ['stochastic','المتذبذب العشوائي'], ['atr','متوسط المدى الحقيقي'], ['stochRsi','مؤشر ستوكاستيك RSI'], ['momentum','الزخم']
];
const iconFor = { alligator: Activity, awesome: Activity, bollinger: SlidersHorizontal, fractal: Plus, macd: LineChart, movingAverage: TrendingUp, parabolic: CircleDot, rsi: Activity, stochastic: Activity, atr: BarChart3, stochRsi: Activity, momentum: TrendingUp };

export default function ChartSettings({ page = 'chart-menu', settings = {}, onChange, onNavigate, onClose, onToast }) {
  const value = useMemo(() => ({ ...DEFAULTS, ...settings, alligatorValues: { ...DEFAULTS.alligatorValues, ...(settings.alligatorValues || {}) } }), [settings]);
  const [indicatorTab, setIndicatorTab] = useState('new');
  const entry=(settings.indicators||[]).find(i=>i.type===page);
  const [draft, setDraft] = useState({ period: entry?.period||14, enabled: entry?.enabled??false });
  const [pen, setPen] = useState({ color: '#f0b04b', width: 2 });
  const set = (patch) => onChange?.(patch);
  const nav = (target) => onNavigate?.(target);
  const title = indicators.find(([key])=>key===page)?.[1] || (page === 'chart-menu' ? 'إعدادات الرسم البياني' : page === 'chart-style' ? 'نمط الرسم البياني' : page === 'indicators' ? 'المؤشرات' : page === 'alligator' ? 'التمساح' : page === 'lines' ? 'الخطوط' : 'القلم');
  const icon = <ChevronLeft size={18} />;
  const selectedIndicator = !['indicators','alligator'].includes(page) && indicators.find(([key]) => key === page);

  const updateIndicator = (key, patch) => {
    const current = Array.isArray(settings.indicators) ? settings.indicators : [];
    const next = current.filter(item => (typeof item === 'string' ? item : item?.type) !== key);
    if (patch.enabled) next.push({ type: key, period: Number(patch.period) || 14, enabled: true });
    set({ indicators: next });
  };

  return <motion.section className="chart-settings" dir="rtl" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
    <header className="chart-settings__header">
      {page!=='chart-menu'&&<button className="chart-settings__icon-button" onClick={() => page === 'chart-menu' ? onClose?.() : nav(page === 'alligator' ? 'indicators' : 'chart-menu')} aria-label="رجوع">{icon}</button>}
      <h2>{title}</h2><span />
    </header>

    <AnimatePresence mode="wait">
      {page === 'chart-menu' && <motion.div key="menu" className="chart-settings__body" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <button className="chart-settings__row" onClick={() => nav('indicators')}><Activity /><span>المؤشرات</span><ChevronLeft /></button>
        <button className="chart-settings__row" onClick={() => nav('lines')}><Minus /><span>الخطوط</span><ChevronLeft /></button>
        <button className="chart-settings__row" onClick={() => nav('pen')}><PenTool /><span>قلم</span><ChevronLeft /></button>
        <button className="chart-settings__row" onClick={() => nav('chart-style')}><CandlestickChart /><span>نمط الرسم البياني</span><ChevronLeft /></button>
      </motion.div>}

      {page === 'chart-style' && <motion.div key="style" className={'chart-settings__body chart-settings__style '+(['line','area'].includes(value.type)?'is-continuous':'is-ohlc')} initial={{opacity:0}} animate={{opacity:1}}>
        <div className="chart-settings__section-title">نوع الرسم البياني</div>
        <div className="chart-settings__types">{[['area','المنطقة',AreaChart],['line','خط',LineChart],['candles','شموع',CandlestickChart],['bar','شريط',BarChart3]].map(([type,label,Icon])=><button key={type} className={`chart-settings__type ${value.type===type?'is-selected':''}`} onClick={()=>set({type})}><Icon size={25}/><span>{label}</span></button>)}</div>
        {['line','area'].includes(value.type)?<>
          <div className="chart-settings__section-title">لون الرسم البياني</div><Swatches colors={palette} selected={value.color} onSelect={color=>set({color})}/>
          <div className="chart-settings__section-title">خلفية الرسم البياني</div><Swatches background colors={backgrounds} selected={value.background} onSelect={background=>set({background})}/>
          <div className="chart-settings__toggle-group"><Toggle label="شبكة" value={value.grid} onChange={grid=>set({grid})}/><Toggle label="علامة التقاطع" value={value.crosshair} onChange={crosshair=>set({crosshair})}/><Toggle label="التداول الاجتماعي" value={value.social} onChange={social=>set({social})} icon={<CircleDot/>}/></div>
        </>:<>
          <div className="chart-settings__section-title">الأطر الزمنية</div><div className="chart-settings__chips">{intervals.map(item=><button key={item} className={value.interval===item?'is-selected':''} onClick={()=>set({interval:item})}>{{'5s':'5ثوان','10s':'10ثوان','15s':'15ثوان','30s':'30ثوان','1m':'1دقائق','5m':'5دقائق','15m':'15دقائق','30m':'30دقائق','1h':'1س','4h':'4س','1d':'1يوم','7d':'7يوم','1mo':'1شهر'}[item]}</button>)}</div>
          <div className="chart-settings__section-title">شمعة صاعدة</div><Swatches colors={upPalette} selected={value.upColor} onSelect={upColor=>set({upColor})}/>
          <div className="chart-settings__section-title">شمعة هابطة</div><Swatches colors={downPalette} selected={value.downColor} onSelect={downColor=>set({downColor})}/>
          <div className="chart-settings__toggle-group"><Toggle label="تفعيل التكبير التلقائي" value={value.autoZoom} onChange={autoZoom=>set({autoZoom})} icon={<CircleDot/>}/><Toggle label="المؤقت" value={value.timer} onChange={timer=>set({timer})} icon={<CircleDot/>}/></div>
          <div className="chart-settings__section-title">خلفية الرسم البياني</div><Swatches background colors={backgrounds} selected={value.background} onSelect={background=>set({background})}/>
        </>}
        <button className="chart-settings__primary" onClick={()=>onClose?.()}>تأكيد</button>
      </motion.div>}

      {page === 'indicators' && <motion.div key="indicators" className="chart-settings__body" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="chart-settings__tabs"><button className={indicatorTab === 'new' ? 'is-active' : ''} onClick={() => setIndicatorTab('new')}>جديد</button><button className={indicatorTab === 'added' ? 'is-active' : ''} onClick={() => setIndicatorTab('added')}>تمت الإضافة</button></div>{indicatorTab === 'new' ? <><div className="chart-settings__section-title">المؤشرات المتاحة</div><div className="chart-settings__indicator-list is-catalog">{indicators.map(([key,label]) => { const I = iconFor[key] || Activity; return <button className="chart-settings__indicator" key={key} onClick={() => key === 'alligator' ? nav('alligator') : nav(key)}><span>{label}</span><ChevronLeft /></button>; })}</div></> : <div className="chart-settings__indicator-list">{value.alligator&&<div className="chart-settings__indicator"><button onClick={()=>nav('alligator')}>التمساح</button><button aria-label="إزالة التمساح" onClick={e=>{e.stopPropagation();set({alligator:false});}}><X size={16}/></button></div>}{(settings.indicators||[]).map(item=><div className="chart-settings__indicator" key={item.type}><button onClick={()=>nav(item.type)}>{indicators.find(([k])=>k===item.type)?.[1]||item.type}</button><button aria-label={'إزالة '+item.type} onClick={()=>set({indicators:(settings.indicators||[]).filter(i=>i.type!==item.type)})}><X size={16}/></button></div>)}{!value.alligator&&!(settings.indicators||[]).length&&<div className="chart-settings__empty">لم تتم إضافة مؤشرات بعد</div>}</div>}</motion.div>}

      {page === 'alligator' && <Alligator value={value} set={set} onClose={onClose} />}
      {selectedIndicator && <motion.div key="indicator-form" className="chart-settings__body" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="chart-settings__form-title">{selectedIndicator[1]}</div><label className="chart-settings__field">الفترة<input type="number" min="1" value={draft.period} onChange={e => setDraft(d => ({ ...d, period: e.target.value }))} /></label><Toggle label="تشغيل المؤشر" value={draft.enabled} onChange={v => { setDraft(d => ({ ...d, enabled: v })); updateIndicator(selectedIndicator[0], { enabled: v, period: draft.period }); }} icon={<Activity />} /><button className="chart-settings__primary" onClick={() => { updateIndicator(selectedIndicator[0], draft); onToast?.('تم تحديث المؤشرات'); onClose?.(); }}>تأكيد</button></motion.div>}
      {page === 'lines' && <Lines set={set} onToast={onToast} onClose={onClose}/>}
      {page === 'pen' && <Pen pen={pen} setPen={setPen} set={set} onClose={onClose}/>}
    </AnimatePresence>
  </motion.section>;
}

function Toggle({ label, value, onChange, icon }) { return <button className="chart-settings__toggle-row" onClick={() => onChange(!value)}><span className="chart-settings__toggle-label">{icon}{label}</span><span className={`chart-settings__toggle ${value ? 'is-on' : ''}`}><i /></span></button>; }
function Alligator({ value, set, onClose }) { const [draft, setDraft] = useState(value.alligatorValues); const rows = [['jaw','jawShift','الفكين'],['teeth','teethShift','الأسنان'],['lips','lipsShift','الشفاه']]; return <motion.div key="alligator" className="chart-settings__body" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><p className="chart-settings__muted">آلة تجانس الاتجاهات</p>{rows.map(([period,shift,label]) => <div className="chart-settings__alligator-row" key={period}><b>{label}</b><label>الفترة<input type="number" min="1" max="200" value={draft[period]} onChange={e => setDraft({ ...draft, [period]: e.target.value })}/></label><label>التحول<input type="number" min="0" max="50" value={draft[shift]} onChange={e => setDraft({ ...draft, [shift]: e.target.value })}/></label><label>اللون<input className="chart-settings__color-input" type="color" value={draft[period + 'Color']} onChange={e => setDraft({ ...draft, [period + 'Color']: e.target.value })}/></label></div>)}<div className="chart-settings__description"><b>ما هو Alligator؟</b><p>يستخدم مؤشر Bill Williams Alligator لتحديد الاتجاه واندفاعه. ويتكون من ثلاثة متوسطات متحركة تساعد في تصفية تقلبات نطاق السوق وتحديد بداية اتجاه جديد.</p></div><div className="chart-settings__actions"><button className="chart-settings__secondary" onClick={onClose}>إلغاء</button><button className="chart-settings__primary" onClick={() => { set({ alligator: true, alligatorValues: draft }); onClose?.(); }}>تأكيد</button></div></motion.div>; }
function Lines({ set, onToast,onClose }) { const tools = [['trend','خط اتجاه',TrendingUp],['horizontal','خط أفقي',Minus],['vertical','خط عمودي',Minus]]; return <motion.div key="lines" className="chart-settings__body" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="chart-settings__indicator-list">{tools.map(([key,label,I]) => <button className="chart-settings__indicator" key={key} onClick={() => { set({ drawingTool: key }); onToast?.('يمكن الرسم بالضغط على المخطط');onClose?.(); }}><I/><span>{label}</span><ChevronLeft/></button>)}<button className="chart-settings__indicator" onClick={() => set({ drawingTool: null,clearDrawings:Date.now() })}><Trash2/><span>مسح الرسومات</span><ChevronLeft/></button></div></motion.div>; }
function Pen({ pen, setPen, set,onClose }) { return <motion.div key="pen" className="chart-settings__body" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="chart-settings__section-title">لون القلم</div><div className="chart-settings__swatches">{['#f0b04b','#f2f2f4','#366bff'].map(color => <button key={color} className={`chart-settings__swatch ${pen.color === color ? 'is-selected' : ''}`} style={{ background: color }} onClick={() => { setPen({ ...pen, color }); set({ drawingTool: 'pen', penColor: color }); }}/>)}</div><label className="chart-settings__field">سمك الخط<input type="range" min="1" max="8" value={pen.width} onChange={e => { const width = Number(e.target.value); setPen({ ...pen, width }); set({ drawingTool: 'pen', penWidth: width }); }}/><strong>{pen.width}</strong></label><button className="chart-settings__primary" onClick={()=>{set({drawingTool:'pen',penColor:pen.color,penWidth:pen.width});onClose?.();}}>تأكيد</button></motion.div>; }

function Swatches({colors,selected,onSelect,background=false}){return <div className={"chart-settings__swatches "+(background?"chart-settings__swatches--background":"")}>{colors.map(color=><button key={color} aria-label={color} className={"chart-settings__swatch "+(selected===color?"is-selected":"")} style={{background:color}} onClick={()=>onSelect(color)}>{selected===color&&<Check size={11}/>}</button>)}</div>;}
