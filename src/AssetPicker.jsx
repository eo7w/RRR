import React, { useMemo, useState } from 'react';
import { Search, Star } from 'lucide-react';
import './assetpicker.css';
import {formatAssetPrice,quoteStatusText} from './assetQuotes';

const TRADING_REFERENCE = [
  { symbol: 'EURUSD', label: 'EUR / USD', payout: 85, icon: '/assets/picker/eurusd.png' },
  { symbol: 'CORN', label: 'Corn (OTC)', payout: 82, icon: '/assets/picker/corn.png', unavailable: true },
  { symbol: 'SUGAR', label: 'Sugar (OTC)', payout: 82, icon: '/assets/picker/sugar.png', unavailable: true },
  { symbol: 'WHEAT', label: 'Wheat (OTC)', payout: 82, icon: '/assets/picker/wheat.png', unavailable: true },
  { symbol: 'USDNGN', label: 'USD / NGN (OTC)', payout: 82, icon: '/assets/picker/usdngn.png', unavailable: true },
];
export const REFERENCE_ASSETS = TRADING_REFERENCE.filter((asset) => asset.symbol !== 'EURUSD');

const fallbackIcon = (asset) => asset.flag || asset.symbol?.slice(0, 2) || '•';
const matches = (asset, query) => !query.trim() || `${asset.label} ${asset.symbol}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());

function AssetIcon({ asset }) {
  return asset.icon ? <img className="asset-picker__icon" src={asset.icon} alt="" /> : <span className="asset-picker__icon asset-picker__icon--fallback">{fallbackIcon(asset)}</span>;
}

// Sparkline contains received provider quotes only, never a reference picture or generated prices.
function QuoteSparkline({series = [], negative = false}) {
  if (series.length < 2) return null;
  const low = Math.min(...series), range = Math.max(...series) - low;
  const points = series.map((price, index) => `${1 + index * 48 / (series.length - 1)},${range ? 16 - (price - low) * 14 / range : 8}`).join(' ');
  return <svg width="50" height="17" viewBox="0 0 50 17" aria-hidden="true"><polyline points={points} fill="none" stroke={negative ? '#ef7979' : '#7ed9b0'} strokeWidth="1.3" /></svg>;
}

function FavoriteButton({ asset, favorite, onToggle }) {
  return <button type="button" className={`asset-picker__favorite ${favorite ? 'is-favorite' : ''}`} onClick={(event) => { event.stopPropagation(); onToggle(asset.symbol); }} aria-label={`تفضيل ${asset.label}`} aria-pressed={favorite}><Star size={17} strokeWidth={2.1} fill={favorite ? 'currentColor' : 'none'} /></button>;
}

export default function AssetPicker({ assets = [], quotes = {}, query = '', setQuery = () => {}, favorites = [], setFavorites = () => {}, onlyFavorites = false, setOnlyFavorites = () => {}, onSelect = () => {} }) {
  const [tab, setTab] = useState('trading');
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const toggleFavorite = (symbol) => setFavorites(favoriteSet.has(symbol) ? favorites.filter((item) => item !== symbol) : [...favorites, symbol]);
  const visible = (items) => items.filter((asset) => matches(asset, query) && (!onlyFavorites || favoriteSet.has(asset.symbol)));
  const existingTrading = assets.filter((asset) => asset.assetClass !== 'stock' && !TRADING_REFERENCE.some((item) => item.symbol === asset.symbol));
  const existingStocks = assets.filter((asset) => asset.assetClass === 'stock');
  const tradingRows = visible([...TRADING_REFERENCE, ...existingTrading]);
  const stockRows = visible(existingStocks);

  return <section className="sheet--assets__content" dir="rtl">
    <div className="asset-picker__search-wrap">
      <Search className="asset-picker__search-icon" size={19} aria-hidden="true" />
      <input value={query} onChange={(event) => setQuery(event.target.value)} className="asset-picker__search" type="search" placeholder="بحث في الأسهم..." aria-label="البحث في الأصول" />
      <button type="button" className={`asset-picker__search-favorite ${onlyFavorites ? 'is-active' : ''}`} onClick={() => setOnlyFavorites(!onlyFavorites)} aria-label="الأصول المفضلة" aria-pressed={onlyFavorites}><Star size={19} fill={onlyFavorites ? 'currentColor' : 'none'} /></button>
    </div>
    <div className="asset-picker__tabs" role="tablist" aria-label="نوع الأصل">
      <button type="button" role="tab" aria-selected={tab === 'trading'} className={tab === 'trading' ? 'is-selected' : ''} onClick={() => setTab('trading')}>التداول</button>
      <button type="button" role="tab" aria-selected={tab === 'stocks'} className={tab === 'stocks' ? 'is-selected' : ''} onClick={() => setTab('stocks')}>الأسهم</button>
    </div>
    {tab === 'trading' ? <div className="asset-picker__list" role="tabpanel" aria-label="أصول التداول">
      {tradingRows.map((asset) => { const quote = quotes[asset.symbol] || {}; return <div className="asset-picker__row asset-picker__row--trading" key={asset.symbol} data-asset-symbol={asset.symbol}><button type="button" className="asset-picker__choose" aria-label={`اختيار ${asset.label}`} onClick={() => onSelect({...assets.find(a=>a.symbol===asset.symbol),...asset})}>
        <AssetIcon asset={asset} /><span className="asset-picker__label">{asset.label}</span><span className="asset-picker__payout">{asset.payout ?? quote.payout ?? 80}%</span></button><FavoriteButton asset={asset} favorite={favoriteSet.has(asset.symbol)} onToggle={toggleFavorite} />
      </div>; })}
      {!tradingRows.length && <p className="asset-picker__empty">لا توجد أصول مطابقة</p>}
    </div> : <>
      <div className="asset-picker__stock-heading"><span>سهم</span><span>السعر <b>1 يوم</b></span></div><div className="asset-picker__list" role="tabpanel" aria-label="الأسهم">
      {stockRows.map((asset) => {
        const quote = quotes[asset.symbol] || {}, percent = quote.dayPercent;
        const hasPercent = typeof percent === 'number' && Number.isFinite(percent);
        const status = quote.status || 'loading';
        return <div className="asset-picker__row asset-picker__row--stock" key={asset.symbol} data-asset-symbol={asset.symbol} data-quote-status={status} data-quote-price={quote.price ?? ''} data-quote-timestamp={quote.timestamp || ''} title={`${quote.source || 'BiQuote'} · ${quoteStatusText(status)}${quote.timestamp ? ' · ' + quote.timestamp : ''}`}><button type="button" className="asset-picker__choose" aria-label={`اختيار ${asset.label}`} onClick={() => onSelect(asset)}>
          <AssetIcon asset={asset} /><span className="asset-picker__label">{asset.label}{status === 'live' && <small className="asset-picker__live"><i />LIVE</small>}</span><span className="asset-picker__stock-change">
            <QuoteSparkline series={quote.series} negative={hasPercent && percent < 0} />
            <b>{quote.price ? '$' + formatAssetPrice(quote.price, asset.digits ?? 2) : '—'}</b>
            <em style={hasPercent && percent < 0 ? {color:'#ef7979'} : undefined}>{status === 'live' ? (hasPercent ? `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%` : 'حي') : quoteStatusText(status)}</em>
          </span></button><FavoriteButton asset={asset} favorite={favoriteSet.has(asset.symbol)} onToggle={toggleFavorite} />
        </div>;
      })}
      {!stockRows.length && <p className="asset-picker__empty">لا توجد أسهم مطابقة</p>}
    </div></>}
  </section>;
}
