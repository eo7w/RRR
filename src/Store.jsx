import React,{useState,useEffect} from 'react';
import {motion,AnimatePresence} from 'framer-motion';
import {Ticket,Check,Gem,Crown,Shield,Star,Sparkles,Flame,Trophy,Lock,X,TrendingUp,Gift,BadgePercent} from 'lucide-react';
import './store.css';
const money=n=>'$'+Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2});
export const STORE_CARDS=[
 {id:'c500',price:500,boost:5,name:'البرونزية',Icon:Shield,a:'#e2a373',b:'#8a512c'},
 {id:'c1000',price:1000,boost:10,name:'الفضية',Icon:Shield,a:'#d7dbea',b:'#7b8199'},
 {id:'c2000',price:2000,boost:15,name:'الذهبية',Icon:Crown,a:'#f3d27a',b:'#a8782c'},
 {id:'c3000',price:3000,boost:20,name:'الزمردية',Icon:Star,a:'#6fe0b0',b:'#17805a'},
 {id:'c4500',price:4500,boost:30,name:'الماسية',Icon:Gem,a:'#8fd0ff',b:'#2f6be0'},
 {id:'c6000',price:6000,boost:40,name:'الملكية',Icon:Sparkles,a:'#c9a2ff',b:'#6a3fd6'},
];
export const TIERS=[
 {key:'bronze',name:'برونزي',price:0,profit:1,discount:3,gift:null,Icon:Shield,a:'#e2a373',b:'#8a512c'},
 {key:'silver',name:'فضي',price:800,profit:2,discount:5,gift:'c500',Icon:Shield,a:'#d7dbea',b:'#7b8199'},
 {key:'gold',name:'ذهبي',price:2000,profit:3,discount:8,gift:'c500',Icon:Crown,a:'#f3d27a',b:'#a8782c'},
 {key:'platinum',name:'بلاتيني',price:4000,profit:4,discount:10,gift:'c1000',Icon:Trophy,a:'#bfe9ee',b:'#4a8f9c'},
 {key:'diamond',name:'ماسي',price:7500,profit:6,discount:15,gift:'c2000',Icon:Gem,a:'#8fd0ff',b:'#2f6be0'},
 {key:'emerald',name:'زمردي',price:12000,profit:8,discount:20,gift:'c3000',Icon:Star,a:'#6fe0b0',b:'#17805a'},
 {key:'opal',name:'أوبال',price:20000,profit:10,discount:25,gift:'c4500',Icon:Sparkles,a:'#f5c6ff',b:'#7a8cf0'},
 {key:'ruby',name:'ياقوتي',price:35000,profit:13,discount:30,gift:'c6000',Icon:Flame,a:'#ff8aa0',b:'#b3122f'},
];
export const card=id=>STORE_CARDS.find(c=>c.id===id);
const js=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}};
export const readActive=()=>js('cue-store-active',null);
export const readOwned=()=>{const v=js('cue-store-cards',[]);return Array.isArray(v)?v:[]};
export const readTierIndex=()=>{const v=Number(js('cue-account-tier',0));return Number.isInteger(v)&&v>=0&&v<TIERS.length?v:0};
const ping=()=>window.dispatchEvent(new Event('cue-store-change'));
const saveOwned=n=>{try{localStorage.setItem('cue-store-cards',JSON.stringify(n))}catch{}ping()};
const uid=()=>String(Date.now())+Math.random().toString(36).slice(2,6);
export const addCard=id=>{const c=card(id);if(c)saveOwned([{uid:uid(),cardId:id,price:c.price,at:new Date().toISOString(),used:false},...readOwned()])};
export function activateCard(u){const o=readOwned().find(x=>x.uid===u&&!x.used);if(!o)return{ok:false,error:'البطاقة غير متاحة'};if(readActive())return{ok:false,error:'لديك بطاقة مفعّلة بالفعل — تُستهلك مع صفقتك التالية'};const c=card(o.cardId);try{localStorage.setItem('cue-store-active',JSON.stringify({uid:u,cardId:o.cardId,boost:c.boost}))}catch{}ping();return{ok:true,card:c}}
export const useStoreSync=()=>{const[n,setN]=useState(0);useEffect(()=>{const f=()=>setN(x=>x+1);window.addEventListener('cue-store-change',f);return()=>window.removeEventListener('cue-store-change',f)},[]);return n};
export default function Store({balance=0,onBuy,onToast}){
 useStoreSync();
 const [tab,setTab]=useState('cards'),[pick,setPick]=useState(null),[sel,setSel]=useState(()=>Math.min(readTierIndex()+1,TIERS.length-1)),[burst,setBurst]=useState(0);
 const owned=readOwned(),mine=owned.filter(o=>!o.used),active=readActive(),ti=readTierIndex(),tier=TIERS[ti],disc=tier.discount;
 const count=id=>mine.filter(o=>o.cardId===id).length,price=c=>Math.round(c.price*(100-disc))/100;
 function buyCard(){const c=pick.card;const p=price(c);const r=onBuy({id:'card-'+c.id,price:p});if(!r.ok){onToast(r.error||'الرصيد غير كافٍ');setPick(null);return}addCard(c.id);setPick(null);setBurst(x=>x+1);onToast('تم شراء البطاقة '+c.name+' — تجدها في المخزون وبطاقاتي')}
 function buyTier(){const t=pick.tier,i=TIERS.indexOf(t);const r=onBuy({id:'tier-'+t.key,price:t.price});if(!r.ok){onToast(r.error||'الرصيد غير كافٍ');setPick(null);return}try{localStorage.setItem('cue-account-tier',String(i))}catch{}if(t.gift)addCard(t.gift);ping();setPick(null);setBurst(x=>x+1);setSel(Math.min(i+1,TIERS.length-1));onToast('تمت الترقية إلى '+t.name+(t.gift?' — وهدية: البطاقة '+card(t.gift).name:''))}
 function act(o){const r=activateCard(o.uid);onToast(r.ok?'تم تفعيل البطاقة: +'+r.card.boost+'% ربح على صفقتك التالية':r.error)}
 const next=TIERS[ti+1],pct=next?Math.min(100,Math.round(balance/next.price*100)):100;
 const st=TIERS[sel],stState=sel<=ti?'owned':sel===ti+1?'next':'locked';
 return <div className="store-ui">
  <section className="store-hero" style={{'--a':tier.a,'--b':tier.b}}><span className="store-ico"><tier.Icon size={26} color="#fff"/></span><div><small>تصنيف حسابك</small><b className="store-tiername">{tier.name}</b><strong dir="ltr">{money(balance)}</strong></div><span className="store-mine"><Ticket size={15}/> بطاقاتي <b>{mine.length}</b></span></section>
  <div className="store-tabs" role="tablist">{[['cards','بطاقات المخزون'],['tiers','تصنيف الحساب']].map(([k,l])=><button key={k} role="tab" aria-selected={tab===k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{tab===k&&<motion.i layoutId="stab" className="store-tab-bg"/>}<span>{l}</span></button>)}</div>
  <AnimatePresence mode="wait"><motion.div key={tab} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:.22}}>
  {tab==='cards'&&<>
   {(mine.length>0||active)&&<><h3 className="store-title">بطاقاتي</h3><p className="store-sub">فعّل بطاقة لزيادة ربح صفقتك التالية (تُستهلك مرة واحدة).</p><div className="store-mine-list">{active&&card(active.cardId)&&<div className="store-row is-active" style={{'--a':card(active.cardId).a,'--b':card(active.cardId).b}}><span className="store-ico sm">{React.createElement(card(active.cardId).Icon,{size:18,color:'#fff'})}</span><div><b>البطاقة {card(active.cardId).name}</b><small>مفعّلة · +{active.boost}% ربح على الصفقة التالية</small></div><i className="store-on">مفعّلة</i></div>}{mine.filter(o=>o.uid!==active?.uid).map(o=>{const c=card(o.cardId);return <div className="store-row" key={o.uid} style={{'--a':c.a,'--b':c.b}}><span className="store-ico sm">{React.createElement(c.Icon,{size:18,color:'#fff'})}</span><div><b>البطاقة {c.name}</b><small>+{c.boost}% ربح على صفقة واحدة</small></div><button onClick={()=>act(o)}>تفعيل</button></div>})}</div></>}
   <h3 className="store-title">بطاقات المخزون</h3><p className="store-sub">من $500 إلى $6,000{disc>0&&<> — خصمك كتصنيف {tier.name}: <b className="store-disc">{disc}%</b></>}</p>
   <div className="store-grid">{STORE_CARDS.map((c,i)=>{const I=c.Icon,p=price(c),can=balance>=p;return <motion.button key={c.id} className={'store-card '+(can?'':'is-low')} style={{'--a':c.a,'--b':c.b}} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*.05,duration:.35}} whileTap={{scale:.97}} whileHover={{y:-3}} onClick={()=>setPick({card:c})}>
    {count(c.id)>0&&<em className="store-own">×{count(c.id)}</em>}
    <span className="store-ico"><I size={26} color="#fff" strokeWidth={2}/></span>
    <b>البطاقة {c.name}</b><small>+{c.boost}% ربح</small>
    <strong dir="ltr">{disc>0&&<s>{money(c.price)}</s>}{money(p)}</strong><i className="store-buy">{can?'شراء':'رصيد غير كافٍ'}</i></motion.button>})}</div></>}
  {tab==='tiers'&&<>
   <p className="store-sub">{next?<>التالي: <b>{next.name}</b> — {money(next.price)}</>:'وصلت إلى أعلى تصنيف'}</p>
   <div className="store-prog"><motion.i initial={{width:0}} animate={{width:pct+'%'}} transition={{duration:.6}}/></div>
   <div className="store-chips">{TIERS.map((t,i)=><button key={t.key} className={(sel===i?'on ':'')+(i<=ti?'owned':'')} style={{'--a':t.a,'--b':t.b}} onClick={()=>setSel(i)}><span className="store-ico xs"><t.Icon size={14} color="#fff"/></span>{t.name}{i<=ti&&<Check size={11}/>}</button>)}</div>
   <AnimatePresence mode="wait"><motion.section key={st.key} className="store-tier" style={{'--a':st.a,'--b':st.b}} initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:.22}}>
    <span className="store-ico big"><st.Icon size={34} color="#fff"/></span><h2>{st.name}</h2>
    <em className={'store-state '+stState}>{stState==='owned'?(sel===ti?'تصنيفك الحالي':'مفتوح'):stState==='next'?'الترقية التالية':'مقفل'}</em>
    <ul className="store-feats"><li><TrendingUp size={16}/><span>ربح إضافي <b>+{st.profit}%</b> على كل صفقة</span></li><li><BadgePercent size={16}/><span>خصم <b>{st.discount}%</b> على بطاقات المتجر</span></li><li><Gift size={16}/><span>{st.gift?<>هدية عند الترقية: البطاقة <b>{card(st.gift).name}</b></>:'تصنيف البداية — بدون هدية'}</span></li></ul>
    {stState==='owned'?<button className="secondary" disabled>{sel===ti?'مفعّل':'تم فتحه'}</button>:stState==='next'?<button className="primary" disabled={balance<st.price} onClick={()=>setPick({tier:st})}>{balance>=st.price?'ترقية بـ '+money(st.price):'رصيد غير كافٍ · '+money(st.price)}</button>:<button className="secondary" disabled><Lock size={14}/> افتح {TIERS[ti+1].name} أولاً</button>}
   </motion.section></AnimatePresence></>}
  </motion.div></AnimatePresence>
  <AnimatePresence>{pick&&(()=>{const t=pick.tier,c=pick.card,x=t||c,pr=t?t.price:price(c);return <motion.div className="store-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setPick(null)}><motion.section className="store-modal" style={{'--a':x.a,'--b':x.b}} initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:32,stiffness:350}} onClick={e=>e.stopPropagation()}>
   <button className="store-x" onClick={()=>setPick(null)} aria-label="إغلاق"><X size={16}/></button>
   <span className="store-ico big"><x.Icon size={34} color="#fff"/></span><h2>{t?'ترقية إلى '+t.name:'البطاقة '+c.name}</h2><p>سيتم خصم <b dir="ltr">{money(pr)}</b> من رصيدك.</p>
   <div className="store-after">{t?'ربح +'+t.profit+'% دائم + خصم '+t.discount+'% في المتجر':'المفعول: +'+c.boost+'% ربح على صفقتك التالية'}</div>
   <div className="store-after">الرصيد بعد الشراء <b dir="ltr">{money(balance-pr)}</b></div>
   <button className="primary" disabled={balance<pr} onClick={t?buyTier:buyCard}><Check size={16}/> تأكيد</button></motion.section></motion.div>})()}</AnimatePresence>
  {burst>0&&<div key={burst} className="store-burst" aria-hidden="true">{Array.from({length:14}).map((_,i)=><i key={i} style={{'--r':i*25.7+'deg','--d':(i%3)*.05+'s'}}/>)}</div>}
 </div>}
