'use strict';
const $=s=>document.querySelector(s),KEY='novaDemo1',H=36e5;
const el=(t,c,x,k)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;(k||[]).forEach(n=>e.append(n));return e};
const fmt=ts=>{const d=new Date(ts);return d.toLocaleDateString([],{month:'short',day:'numeric'})+', '+d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const SERVICES=['General check-up','Teeth cleaning','Whitening','Braces / Invisalign','Implants','Emergency care'];
const SUGG=['What services do you offer?','How much does a consultation cost?','What are your opening hours?','Where are you located?','Can I book an appointment?','Do you accept emergencies?'];

/* ---- Knowledge base: edit this to customise the business ---- */
const KB=[
{id:'services',label:'Services',k:['service','treatment','offer','procedure','whitening','implant','braces','invisalign','filling','cleaning','root canal','check-up','checkup'],a:'We offer general check-ups, cleanings, whitening, fillings, root canals, Invisalign & braces, implants and emergency care.'},
{id:'price',label:'Pricing',k:['price','cost','consultation','fee','how much','charge','afford','insurance','payment'],a:'A first consultation is $49 (demo pricing) and is credited toward treatment. We work with most major insurers and offer monthly payment plans.'},
{id:'hours',label:'Opening hours',k:['hours','open','opening','close','closing','what time','when are','saturday','sunday','weekend'],a:t=>/sun/.test(t)?'We are closed on Sundays, but our emergency line stays on. Regular hours: Mon–Fri 8am–6pm, Sat 9am–2pm.':/sat/.test(t)?'Yes, we are open on Saturdays from 9am to 2pm.':/clos/.test(t)?'We close at 6pm Monday–Friday and 2pm on Saturdays.':'We are open Mon–Fri 8am–6pm and Sat 9am–2pm, and closed on Sundays.'},
{id:'location',label:'Location',k:['where','location','located','address','directions','parking','find you','phone','contact'],a:'Nova Dental Clinic is at 120 Harbor Street, Springfield (fictional address). Free parking is behind the building. Phone: 555-0142.'},
{id:'emergency',label:'Emergencies',k:['emergency','emergencies','urgent','toothache','pain','swelling','bleeding','broken','knocked','abscess'],a:'Yes, we see dental emergencies the same day. For severe swelling, trouble breathing or heavy bleeding, call your local emergency number first. Would you like me to request an urgent visit?'},
{id:'booking',label:'Booking',k:['book','appointment','schedule','reserve','see a dentist','sign up'],a:''},
{id:'hello',label:'Greeting',k:['hello','hi there','hey','good morning','good evening'],a:'Hello! I can help with services, pricing, opening hours, location, emergencies or booking.'},
{id:'thanks',label:'Thanks',k:['thanks','thank you','cheers'],a:"You're welcome! Anything else I can help with?"}];
const LABEL=Object.fromEntries(KB.map(i=>[i.id,i.label]));

function lev(a,b){const m=[...Array(a.length+1)].map((_,i)=>[i]);for(let j=1;j<=b.length;j++)m[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]==b[j-1]?0:1));return m[a.length][b.length]}

/* Local "AI": phrase + fuzzy keyword scoring. */
function localReply(text){const t=text.toLowerCase(),w=t.split(/\W+/).filter(Boolean);let best=null,bs=0;
 for(const i of KB){let s=0;for(const k of i.k){if(t.includes(k))s+=2*k.split(' ').length;else if(!k.includes(' ')&&k.length>4&&w.some(x=>x.length>4&&lev(x,k)<=1))s+=2}if(s>bs){bs=s;best=i}}
 if(!best||bs<2)return{id:null,text:"I'm not sure I understood that. I can help with services, pricing, opening hours, location, emergencies and booking. Pick a question below, or ask to book and the team can follow up."};
 return{id:best.id,text:typeof best.a=='function'?best.a(t):best.a}}
/* PRODUCTION: replace localReply with a call to your LLM endpoint (send KB + history, return {id,text}). */
async function getReply(text,history){return localReply(text)}

/* ---- Booking + lead-qualification flow ---- */
const STEPS=[['name','Happy to help you request a (demo) appointment. What is your name?'],
['contact','Thanks{n}! What is the best phone number or email?'],
['service','Which service are you interested in?',SERVICES],
['date','What date would you prefer? (e.g. "next Tuesday" or 2026-10-05)'],
['time','And a preferred time?',['Morning','Afternoon','Evening']],
['newp','A few quick questions so the team can prepare. Are you a new patient?',['Yes, new patient','No, existing patient']],
['urgency','How urgent is this?',['Urgent (pain)','Within a week','Flexible']],
['method','Last one: preferred contact method?',['Phone call','Email','Text message']]];

let db={convs:[]},cur=null,flow=null,busy=0,welcome;
try{db=JSON.parse(localStorage.getItem(KEY))||db}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){}};
function status(c){let s=0;const L=c.lead;if(L){s+=2;if(/^yes/i.test(L.newp))s++;if(/^urgent/i.test(L.urgency))s+=3;else if(/week/i.test(L.urgency))s++}if(c.em)s+=4;s+=['services','price'].filter(i=>c.intents.includes(i)).length;return s>=4?'Hot':s>=2?'Warm':'General inquiry'}

/* ---- Chat UI ---- */
const sc=()=>{$('#msgs').scrollTop=1e9};
function bubble(m){$('#msgs').append(el('div','msg '+m.r,null,[el('p',null,m.t),el('time',null,new Date(m.ts).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}))]));sc()}
function push(r,t){const m={r,t,ts:Date.now()};cur.msgs.push(m);bubble(m)}
function chips(list){$('#chips').replaceChildren(...list.map(x=>{const b=el('button','chip',x);b.type='button';b.onclick=()=>send(x);return b}))}
async function say(t,c){const mine=cur,ty=el('div','typing',null,[el('i'),el('i'),el('i')]);$('#msgs').append(ty);sc();await wait(500+Math.min(t.length*6,600));ty.remove();if(cur!==mine)return;push('b',t);chips(c||[])}
const ask=()=>{const[k,q,c]=STEPS[flow.i];return say(q.replace('{n}',flow.d.name?' '+flow.d.name.split(' ')[0]:''),c)};
function ensure(){if(!cur){cur={id:Date.now(),ts:Date.now(),intents:[],msgs:[welcome]};db.convs.push(cur)}}
async function finish(){const d=flow.d;cur.lead=d;flow=null;
 await say(`Demo booking request recorded\n\nName: ${d.name}\nService: ${d.service}\nWhen: ${d.date}, ${d.time}\nContact: ${d.contact} (${d.method})\nNew patient: ${/^yes/i.test(d.newp)?'Yes':'No'} · Urgency: ${d.urgency}\n\nThis is a portfolio demo. No real appointment was made and no clinic has been notified.`+(/^urgent/i.test(d.urgency)?'\n\nIf this were a real clinic, your request would be flagged as a priority. For real dental emergencies, call your local clinic or emergency number.':''),SUGG)}
const P2E=s=>s.replace(/[۰-۹]/g,d=>d.charCodeAt(0)-1776).replace(/[٠-٩]/g,d=>d.charCodeAt(0)-1632);
function validContact(t){t=P2E(t);return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(t)||(/^[+\d\s().\-–]+$/.test(t)&&t.replace(/\D/g,'').length>=7)}
async function step(text){const k=STEPS[flow.i][0];
 if(/^(cancel|stop|never ?mind)\b/i.test(text)){flow=null;return say('No problem, I have cancelled the booking request. Anything else?',SUGG)}
 if(k=='name'&&text.length<2)return say('Could you tell me your name?');
 if(k=='contact'&&!validContact(text))return say('I could not read that as a phone number or email. Please try something like name@email.com or +1 555 123 4567.');
 flow.d[k]=text;flow.i++;flow.i<STEPS.length?await ask():await finish()}
async function send(text){text=text.trim();if(!text||busy)return;busy=1;
 try{ensure();push('u',text);chips([]);
  if(flow)await step(text);
  else{const r=await getReply(text,cur.msgs);cur.intents.push(r.id||'unknown');
   if(r.id=='booking'){flow={i:0,d:{}};await ask()}
   else{if(r.id=='emergency')cur.em=1;await say(r.text,SUGG)}}
 }finally{busy=0;save();render()}}
function greet(){welcome={r:'b',t:"Hi! I'm Nova's virtual assistant. How can I help you today?",ts:Date.now()};bubble(welcome);chips(SUGG)}
function newConv(){cur=null;flow=null;busy=0;$('#msgs').replaceChildren();greet()}
const openChat=v=>{$('#chat').hidden=!v;$('#fab').hidden=false;$('#fab').setAttribute('aria-expanded',!!v);if(v)$('#in').focus()};

/* ---- Dashboard (sample data + live data) ---- */
const L=(name,service,newp,urgency,date,time)=>({name,service,newp,urgency,date,time,method:'Phone call',contact:'demo@example.com'});
const mk=(n,msg,intents,lead,em)=>{const ts=Date.now()-n*H*5;return{id:'s'+n,ts,sample:1,em,intents,lead,msgs:[{r:'u',t:msg,ts},{r:'b',t:'(sample conversation)',ts:ts+6e4}]}};
const SEED=[mk(1,'I have a toothache, can I come in today?',['emergency','booking'],L('Amira K.','Emergency care','Yes','Urgent (pain)','Today','Afternoon'),1),
mk(3,'How much is Invisalign and can I book?',['price','booking'],L('Daniel R.','Braces / Invisalign','Yes','Within a week','Next Tuesday','Morning')),
mk(6,'Do you do teeth whitening?',['services','booking'],L('Sofia M.','Whitening','No','Flexible','Oct 12','Evening')),
mk(9,'Looking for a cleaning next month',['price','booking'],L('Liam P.','Teeth cleaning','No','Flexible','Oct 20','Morning')),
mk(14,'Interested in implants for my mother',['services','booking'],L('Noor A.','Implants','Yes','Flexible','Nov 2','Afternoon')),
mk(20,'Are you open Saturday?',['hours']),mk(26,'Where are you located?',['location']),mk(31,'What time do you close?',['hours'])];
const SEEDQ={hours:38,services:31,price:27,booking:24,location:19,emergency:9};
const badge=s=>el('span','badge '+s.split(' ')[0].toLowerCase(),s);
const table=(head,rows)=>el('div','scroll',null,[el('table','tbl',null,[el('thead',null,null,[el('tr',null,null,head.map(h=>el('th',null,h)))]),el('tbody',null,null,rows.map(r=>el('tr',null,null,r.map(c=>el('td',null,null,[c instanceof Node?c:document.createTextNode(c)])))))])]);
function render(){
 const cs=[...SEED,...db.convs.filter(c=>c.msgs.some(m=>m.r=='u'))].sort((a,b)=>b.ts-a.ts).map(c=>({...c,st:status(c)}));
 const leads=cs.filter(c=>c.st!='General inquiry'),bk=cs.filter(c=>c.lead),cnt=s=>cs.filter(c=>c.st==s).length;
 $('#stats').replaceChildren(...[['Conversations',cs.length],['Qualified leads',leads.length],['Appointment requests',bk.length],['Hot leads',cnt('Hot')]].map(([l,v])=>el('div','card stat',null,[el('b',null,v),el('span',null,l)])));
 const q={...SEEDQ};cs.forEach(c=>c.intents.forEach(i=>{if(i in q)q[i]++}));const mx=Math.max(...Object.values(q));
 $('#bars').replaceChildren(...Object.entries(q).sort((a,b)=>b[1]-a[1]).map(([k,v])=>{const f=el('i');f.style.width=v/mx*100+'%';return el('div','bar',null,[el('span',null,LABEL[k]),el('div','track',null,[f]),el('em',null,v)])}));
 $('#split').replaceChildren(...['Hot','Warm','General inquiry'].map(s=>el('div','pill',null,[badge(s),el('b',null,cnt(s))])));
 $('#leads').replaceChildren(table(['Lead','Interest','Status','When'],leads.map(c=>[c.lead?c.lead.name:'Anonymous visitor',c.lead?c.lead.service:(LABEL[c.intents.find(i=>LABEL[i]&&!['hello','thanks'].includes(i))]||'-'),badge(c.st),fmt(c.ts)])));
 $('#books').replaceChildren(table(['Name','Service','Preferred slot','Contact','Source'],bk.map(c=>[c.lead.name,c.lead.service,`${c.lead.date}, ${c.lead.time}`,c.lead.contact,c.sample?'Sample':'Your demo'])));
 $('#convs').replaceChildren(...cs.slice(0,10).map(c=>{const u=c.msgs.find(m=>m.r=='u');return el('details','conv',null,[el('summary',null,null,[badge(c.st),el('span',null,u?u.t.slice(0,60):'-'),el('small',null,fmt(c.ts)+(c.sample?' · sample':''))]),...c.msgs.map(m=>el('p','tr '+m.r,(m.r=='u'?'Visitor: ':'Nova: ')+m.t))])}))}

/* ---- Wiring ---- */
const root=document.documentElement;
root.dataset.theme=localStorage.getItem('novaTheme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
$('#theme').onclick=()=>{const n=root.dataset.theme=='dark'?'light':'dark';root.dataset.theme=n;try{localStorage.setItem('novaTheme',n)}catch(e){}};
function go(v){['home','dash'].forEach(id=>$('#'+id).hidden=id!=v);document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t.dataset.view==v));scrollTo(0,0)}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>go(b.dataset.view));
document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openChat(1));
$('#fab').onclick=()=>openChat($('#chat').hidden);$('#close').onclick=()=>openChat(0);$('#newc').onclick=newConv;
$('#f').onsubmit=e=>{e.preventDefault();const v=$('#in').value;$('#in').value='';send(v)};
$('#reset').onclick=()=>{db={convs:[]};try{localStorage.removeItem(KEY)}catch(e){}render()};
greet();render();
