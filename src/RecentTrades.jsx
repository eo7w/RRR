import React,{useEffect,useState} from 'react';
import {ArrowUp,ArrowDown} from 'lucide-react';
import './recenttrades.css';

// Presentation-only reference examples: never persisted or passed to wallet/settlement code.
const exampleOpen={id:'reference-open',label:'Gold',direction:'down',amount:1000,status:'open',time:'08:17:54',remaining:6};
const exampleGroups=[
 {date:'19 أكتوبر، 2026',count:1,total:0,rows:[{id:'ref-19',label:'USD / JPY',direction:'down',amount:1,time:'05:49:13',result:0}]},
 {date:'12 أكتوبر، 2026',count:1,total:0,rows:[{id:'ref-12',label:'Gold',direction:'up',amount:10000,time:'01:55:28',result:0}]},
 {date:'09 أكتوبر، 2026',count:21,total:39.5,rows:Array.from({length:21},(_,i)=>({id:'ref-09-'+i,label:'Gold',direction:'down',amount:50,time:['01:33:11','01:33:10','01:33:10','01:33:09'][i]||'01:33:'+String(Math.max(0,9-i)).padStart(2,'0'),result:i<5?0:i===20?2:2.5}))}
];
const dollars=n=>'$'+Number(n||0).toFixed(2);
const result=n=>(n>0?'+$':n<0?'−$':'$')+Math.abs(n||0).toFixed(2);
const clock=t=>t.time||new Date(t.start||Date.now()).toLocaleTimeString('en-GB',{hour12:false,timeZone:'Asia/Riyadh'});
function TradeRow({trade,now}){
 const open=trade.status==='open';
 const seconds=trade.remaining??Math.max(0,Math.ceil((trade.end-now)/1000));
 const countdown=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
 const Arrow=trade.direction==='up'?ArrowUp:ArrowDown;
 return <div className="recent-trade-row">
  <div className="recent-direction" aria-label={trade.direction==='up'?'أعلى':'أسفل'}><Arrow size={21} strokeWidth={1.8}/></div>
  <div className="recent-asset"><strong dir="ltr">{trade.label}</strong><div className="recent-detail"><span dir="ltr">{dollars(trade.amount)}</span>{open&&<><span> · تُغلق خلال </span><span className="recent-countdown" dir="ltr">{countdown}</span></>}</div></div>
  <div className="recent-outcome"><strong className={open?'recent-open':trade.result>0?'recent-profit':''} dir={open?'rtl':'ltr'}>{open?'مفتوحة':result(trade.result)}</strong><span className="recent-time"><span dir="ltr">{clock(trade)}</span><span>م</span></span></div>
 </div>;
}
export default function RecentTrades({trades}){
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[]);
 const local=trades.filter(t=>t.local!==false);
 const opened=local.filter(t=>t.status==='open');
 const groups=new Map();
 for(const t of local.filter(t=>t.status!=='open').sort((a,b)=>(b.start||0)-(a.start||0))){
  const date=new Date(t.start||Date.now()).toLocaleDateString('en-CA',{timeZone:'Asia/Riyadh'});
  if(!groups.has(date))groups.set(date,{date:new Date(t.start||Date.now()).toLocaleDateString('ar-SA',{calendar:'gregory',numberingSystem:'latn',day:'2-digit',month:'long',year:'numeric',timeZone:'Asia/Riyadh'}),count:0,total:0,rows:[]});
  const group=groups.get(date);group.rows.push(t);group.count++;group.total+=Number(t.result||0);
 }
 const openRows=opened.length?opened:local.length?[]:[exampleOpen];
 const closedGroups=local.length?[...groups.values()]:exampleGroups;
 return <div className="recent-trades-content" aria-description="سجل محاكاة محلية فقط؛ الأمثلة المعروضة لا تنفذ صفقات ولا تغير الرصيد">
  <h2 id="recent-trades-title">الصفقات الأخيرة</h2>
  {openRows.length>0&&<section className="recent-group recent-open-group"><div className="recent-group-heading"><div><strong>مفتوحة</strong><span> · {openRows.length} {openRows.length===1?'صفقة':'صفقات'}</span></div></div><div className="recent-trade-card">{openRows.map(t=><TradeRow key={t.id} trade={t} now={now}/>)}</div></section>}
  {closedGroups.map((g,i)=><section className="recent-group" key={i}><div className="recent-group-heading"><div><strong>{g.date}</strong><span> · {g.count} {g.count===1?'صفقة':'صفقات'}</span></div><b className={g.total>0?'recent-profit':''} dir="ltr">{result(g.total)}</b></div><div className="recent-trade-card">{g.rows.map(t=><TradeRow key={t.id} trade={t} now={now}/>)}</div></section>)}
 </div>;
}
