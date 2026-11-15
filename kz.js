/* kz.js: shared helpers for every Kanzel page (storage, settings, menu overrides, PIN gate, navigation).
   Data lives in localStorage for now; when the backend exists only this file's data functions change. */
(function(){
const KZ=window.KZ={embed:!!window.__EMBED};
const S={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
KZ.S=S;
KZ.read=(k,d)=>{try{const v=JSON.parse(S.get(k));return v==null?d:v}catch(e){return d}};
KZ.write=(k,v)=>S.set(k,JSON.stringify(v));
KZ.esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
KZ.fmt=n=>Number(n||0).toLocaleString("en");
KZ.uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
/* language: an explicit choice (the language button) wins; otherwise follow the phone's main language (Arabic phone -> Arabic, anything else -> English) */
KZ.phoneLang=()=>{try{const l=(navigator.languages&&navigator.languages[0])||navigator.language||"en";return/^ar(\b|-|_)/i.test(String(l))?"ar":"en"}catch(e){return"en"}};
KZ.lang=()=>{const v=S.get("kanzel-lang");return v==="ar"||v==="en"?v:KZ.phoneLang()};
KZ.setLang=l=>S.set("kanzel-lang",l);
KZ.clock=(ts,l)=>new Date(ts).toLocaleTimeString(l==="ar"?"ar-EG":"en-GB",{hour:"2-digit",minute:"2-digit"});
KZ.ago=(ts,l)=>{const m=Math.floor((Date.now()-ts)/6e4),a=l==="ar";if(m<1)return a?"دلوقتي":"just now";if(m<60)return a?"من "+m+" دقيقة":m+" min ago";const h=Math.floor(m/60);return a?"من "+h+" ساعة و"+(m%60)+" دقيقة":h+" h "+(m%60)+" min ago"};
/* navigation: real pages in the zip, hash views when embedded in the single-file preview */
/* ---------- UI: transitions, toast, busy buttons, offline banner, error net ---------- */
const reduce=()=>matchMedia("(prefers-reduced-motion:reduce)").matches;
function fade(fn){if(reduce()){fn();return}document.body.classList.add("kz-out");setTimeout(fn,230)}
KZ.fade=fade;
KZ.url=p=>"./"+p+".html";
KZ.go=p=>fade(()=>{if(KZ.embed)parent.location.hash=(p==="index"?"":p);else location.href=KZ.url(p)});
addEventListener("pageshow",e=>{if(e.persisted)document.body.classList.remove("kz-out")});
(function(){const c=document.createElement("style");c.textContent=
"html{overflow-x:hidden}@keyframes kzin{from{opacity:0}to{opacity:1}}body{animation:kzin .35s ease both}body.kz-out{opacity:0;transition:opacity .22s ease}"+
".kz-toast{position:fixed;inset-inline:0;bottom:calc(84px + env(safe-area-inset-bottom,0px));margin:auto;width:max-content;max-width:88%;padding:12px 20px;border-radius:18px;background:#f4efdd;color:#10211a;font:500 13.5px/1.5 'Readex Pro',system-ui,sans-serif;text-align:center;box-shadow:0 8px 30px #0006;z-index:9998;opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .3s,transform .3s}.kz-toast.on{opacity:1;transform:none}.kz-toast.err{background:#f0b3a9}"+
".kz-off{position:fixed;top:0;inset-inline:0;z-index:9997;padding:calc(8px + env(safe-area-inset-top,0px)) 14px 8px;text-align:center;background:#d3c994;color:#10211a;font:500 12.5px/1.4 'Readex Pro',system-ui,sans-serif;transform:translateY(-110%);transition:transform .3s}.kz-off.on{transform:none}"+
".kz-busy{pointer-events:none;opacity:.8}.kz-busy::before{content:'';display:inline-block;width:14px;height:14px;margin-inline-end:8px;vertical-align:-2px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:kzsp .7s linear infinite}@keyframes kzsp{to{transform:rotate(360deg)}}"+
".skl{margin:0 16px 12px;height:120px;border-radius:26px 8px 26px 26px;background:linear-gradient(100deg,#ffffff0a 30%,#ffffff1c 50%,#ffffff0a 70%) 0 0/200% 100%;animation:kzsh 1.2s linear infinite}@keyframes kzsh{to{background-position:-200% 0}}"+
"@media(prefers-reduced-motion:reduce){body{animation:none}body.kz-out{transition:none}.kz-busy::before,.skl{animation:none}}";
document.head.appendChild(c)})();
let tmK=0;
KZ.toast=(m,err)=>{let el=document.querySelector(".kz-toast");if(!el){el=document.createElement("div");el.className="kz-toast";el.setAttribute("role","status");el.setAttribute("aria-live","polite");document.body.appendChild(el)}
 el.textContent=m;el.classList.toggle("err",!!err);void el.offsetWidth;el.classList.add("on");clearTimeout(tmK);tmK=setTimeout(()=>el.classList.remove("on"),err?4200:2400)};
KZ.busy=(b,on)=>{if(b)b.classList.toggle("kz-busy",!!on)};
const L2=(en,ar)=>KZ.lang()==="ar"?ar:en;
/* internal page links fade out before navigating */
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest("a[href]");
 if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||a.target==="_blank"||a.hasAttribute("download"))return;
 const h=a.getAttribute("href"),m=h&&h.match(/^\/([\w-]*)(\?.*)?$/);if(!m)return;e.preventDefault();fade(()=>{location.href=KZ.url(m[1]||"index")+(m[2]||"")})});
/* offline + storage + unexpected errors */
document.addEventListener("DOMContentLoaded",()=>{
 const b=document.createElement("div");b.className="kz-off";b.setAttribute("role","status");document.body.appendChild(b);
 const upd=()=>{b.textContent=L2("You’re offline. The page still works, but data stays on this device.","مفيش إنترنت. الصفحة شغالة، بس البيانات بتفضل على الجهاز ده.");b.classList.toggle("on",!navigator.onLine)};
 addEventListener("online",upd);addEventListener("offline",upd);upd();
 let ok=true;try{localStorage.setItem("kz-t","1");localStorage.removeItem("kz-t")}catch(e){ok=false}
 if(!ok)setTimeout(()=>KZ.toast(L2("Your browser is blocking storage (private mode?). Orders and bookings can’t be saved.","المتصفح مانع التخزين (وضع خاص؟). مش هنقدر نحفظ الطلبات أو الحجوزات."),1),600)});
let lastE=0;const oops=()=>{if(Date.now()-lastE<6000)return;lastE=Date.now();KZ.toast(L2("Something went wrong. Please refresh the page.","حصل خطأ غير متوقع. اعمل تحديث للصفحة."),1)};
addEventListener("error",e=>{if(e.target===window)oops()});addEventListener("unhandledrejection",oops);
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest("a[data-go]");if(!a)return;e.preventDefault();KZ.go(a.dataset.go)});

/* ---------- settings ---------- */
const DEF={waiters:[{id:"w1",en:"Ahmed",ar:"أحمد"},{id:"w2",en:"Nour",ar:"نور"}],staffPin:"7777",adminPin:"1234",siteUrl:"https://kanzel-eg.vercel.app",mapsUrl:"https://www.google.com/maps/search/?api=1&query=Kanzel+Restaurant+%26+Lounge"};
KZ.settings=()=>Object.assign({},DEF,KZ.read("kanzel-settings",{}));
KZ.saveSettings=o=>KZ.write("kanzel-settings",o);

/* ---------- menu (default in menu.js, owner edits override it) ----------
   dish = [en, ar, price, descEn, descAr, image?, hidden?]  */
KZ.menuDefault=typeof MENU!=="undefined"?JSON.parse(JSON.stringify(MENU)):[];
KZ.menuRaw=()=>{const o=KZ.read("kanzel-menu",null);return Array.isArray(o)&&o.length?o:JSON.parse(JSON.stringify(KZ.menuDefault))};
KZ.menuVer=S.get("kanzel-menu-v")||"0";
KZ.saveMenu=raw=>{const ok=KZ.write("kanzel-menu",raw);S.set("kanzel-menu-v",String(Date.now()));return ok};
KZ.resetMenu=()=>{S.del("kanzel-menu");S.set("kanzel-menu-v",String(Date.now()))};
if(typeof MENU!=="undefined"){const o=KZ.read("kanzel-menu",null);
 if(Array.isArray(o)&&o.length){const v=o.map(c=>[c[0],c[1],c[2].filter(x=>!x[6])]).filter(c=>c[2].length);MENU.length=0;v.forEach(c=>MENU.push(c))}}

/* ---------- data lists ---------- */
KZ.KEYS={orders:"kanzel-orders",calls:"kanzel-calls",bookings:"kanzel-bookings",events:"kanzel-events"};
/* ---------- order status helpers ----------
   status: new -> confirmed -> ready -> served. A waiter can also end an order early:
   "rejected" (before confirming) or "cancelled" (after), always with a reason: o.reason, o.reasonBy {id,en,ar}, o.endedAt */
KZ.dead=o=>!!o&&(o.status==="rejected"||o.status==="cancelled");
KZ.REASONS=[
 {id:"stock",en:"Out of stock",ar:"الصنف نفد"},
 {id:"kitchen",en:"Kitchen can’t make it now",ar:"المطبخ مش قادر يجهزه دلوقتي"},
 {id:"guest",en:"Guest asked to cancel",ar:"الضيف طلب الإلغاء"},
 {id:"dup",en:"Duplicate order",ar:"طلب متكرر"},
 {id:"table",en:"Wrong table",ar:"ترابيزة غلط"},
 {id:"closed",en:"Kitchen is closed",ar:"المطبخ قفل"}];
KZ.reasonText=(o,l)=>{if(!o||!o.reason)return"";const r=KZ.REASONS.find(x=>x.id===o.reason.id);const t=o.reason.text||"";
 const base=r?(l==="ar"?r.ar:r.en):"";return[base,t].filter(Boolean).join(" · ")};

/* ---------- sold out ("نفد"): a quick switch for waiters, kept by dish English name so it survives menu edits ---------- */
KZ.soldKey=en=>String(en==null?"":en).trim().toLowerCase();
KZ.sold=()=>{const o=KZ.read("kanzel-soldout",{});return o&&typeof o==="object"&&!Array.isArray(o)?o:{}};
KZ.isSold=en=>!!KZ.sold()[KZ.soldKey(en)];
KZ.setSold=(en,on)=>{const o=KZ.sold(),k=KZ.soldKey(en);if(!k)return false;if(on)o[k]=Date.now();else delete o[k];return KZ.write("kanzel-soldout",o)};
KZ.clearSold=()=>KZ.write("kanzel-soldout",{});
KZ.list=n=>{const a=KZ.read(KZ.KEYS[n],[]);return Array.isArray(a)?a:[]};
KZ.saveList=(n,a)=>KZ.write(KZ.KEYS[n],a);
KZ.push=(n,o)=>{const a=KZ.list(n);a.push(o);return KZ.saveList(n,a)};
KZ.update=(n,id,fn)=>{const a=KZ.list(n),o=a.find(x=>x.id===id);if(!o)return false;fn(o);return KZ.saveList(n,a)};

/* ---------- PIN gate (front-end only; real protection comes with the backend) ---------- */
KZ.logout=role=>{try{sessionStorage.removeItem("kz-auth-"+role);if(role==="staff")sessionStorage.removeItem("kz-waiter")}catch(e){}};
KZ.gate=role=>new Promise(res=>{
 const key="kz-auth-"+role;try{if(sessionStorage.getItem(key)==="1"){res();return}}catch(e){}
 const ar=KZ.lang()==="ar",st=document.createElement("style");
 const F="'Readex Pro',system-ui,-apple-system,sans-serif";
 st.textContent=[
 ".kzg{position:fixed;inset:0;z-index:9999;background:#10211a;color:#f4efdd;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;overflow-y:auto;font-family:"+F+";font-weight:300;touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%}",
 ".kzg *{touch-action:manipulation;-webkit-tap-highlight-color:transparent}",
 ".kzg.t{justify-content:flex-start;padding-top:max(7vh,40px)}",
 ".kzg img{width:120px;height:auto}.kzg.p img{width:104px}",
 ".kzg h1{font:500 32px/1.15 'Cormorant Garamond','Readex Pro',Georgia,serif;margin:0}",
 ".kzg p{font-size:14px;color:rgba(244,239,221,.9);min-height:20px;margin:0;text-align:center}",
 ".kzg .dw{position:relative}",
 ".kzg .dots{display:flex;gap:12px;direction:ltr}",
 ".kzg .dots i{display:grid;place-items:center;width:14px;height:14px;border-radius:50%;border:1.5px solid #d3c994;transition:background .15s,border-color .15s,box-shadow .15s}",
 ".kzg .dots i.on{background:#d3c994}",
 ".kzg.t .dots i{width:56px;height:64px;border-radius:16px;border-color:rgba(211,201,148,.55);background:#ffffff0a}",
 ".kzg.t .dots i.on{background:#ffffff0a}",
 ".kzg.t .dots i.on::after{content:'';width:15px;height:15px;border-radius:50%;background:#d3c994}",
 ".kzg.t .dots i.cur{border-color:#d3c994;box-shadow:0 0 0 3px rgba(211,201,148,.22)}",
 ".kzg .pin{position:absolute;inset:0;width:100%;height:100%;opacity:0;font:400 16px "+F+";border:0;background:none;color:transparent;caret-color:transparent;padding:0;margin:0;-webkit-appearance:none;appearance:none;cursor:pointer}",
 ".kzg.p .pin{display:none}",
 ".kzg .pad{display:none;grid-template-columns:repeat(3,68px);gap:12px;direction:ltr}.kzg.p .pad{display:grid}",
 ".kzg .pad button{width:68px;height:68px;padding:0;border-radius:50%;border:1px solid rgba(211,201,148,.5);background:#ffffff0d;color:#f4efdd;font:500 28px/1 "+F+";font-variant-numeric:lining-nums tabular-nums;font-feature-settings:'lnum' 1,'tnum' 1;cursor:pointer;transition:background .12s,transform .12s;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}",
 ".kzg .pad button:active{background:rgba(211,201,148,.3);transform:scale(.93)}",
 ".kzg .pad button:focus-visible,.kzg .tg:focus-visible,.kzg a:focus-visible{outline:2px solid #d3c994;outline-offset:3px}",
 ".kzg .pad .x{border:0;background:none;color:#d3c994}.kzg .pad .x svg{width:30px;height:30px}",
 ".kzg .tg{background:none;border:0;color:#d3c994;font:400 15px "+F+";text-decoration:underline;text-underline-offset:4px;padding:10px 14px;cursor:pointer}",
 ".kzg a{font-size:14px;color:#d3c994;border:1px solid rgba(211,201,148,.5);border-radius:99px;padding:11px 26px;text-decoration:none;cursor:pointer;margin-top:4px}",
 "@keyframes kzs{20%,60%{transform:translateX(-9px)}40%,80%{transform:translateX(9px)}}.kzg .dw.bad{animation:kzs .4s}.kzg p.err{color:#ffb4a8}"
 ].join("");
 document.head.appendChild(st);
 const T={title:role==="admin"?(ar?"دخول المالك":"Owner access"):(ar?"دخول الموظفين":"Staff access"),
  hintT:ar?"اكتب الرقم السري (4 أرقام)":"Type your 4-digit PIN",hintP:ar?"اختار الرقم السري":"Tap your PIN",
  bad:ar?"الرقم غلط":"Wrong PIN",lock:ar?"استنى شوية وجرّب تاني":"Too many tries, wait a moment",home:ar?"الرئيسية":"Home",del:ar?"مسح":"Delete",
  toPad:ar?"اختار من لوحة الأرقام":"Use the keypad",toType:ar?"اكتب بالكيبورد":"Type instead"};
 let mode="type";try{if(localStorage.getItem("kz-pin-mode")==="pad")mode="pad"}catch(e){}
 const o=document.createElement("div");o.className="kzg "+(mode==="pad"?"p":"t");o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");o.setAttribute("aria-label",T.title);o.dir=ar?"rtl":"ltr";
 const BK="<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M9 5h10a2 2 0 012 2v10a2 2 0 01-2 2H9l-6-7z'/><path d='M13 10l4 4M17 10l-4 4'/></svg>";
 o.innerHTML="<img src='logo.png' alt='Kanzel'><h1>"+T.title+"</h1>"+
  "<div class='dw'><div class='dots'><i></i><i></i><i></i><i></i></div><input class='pin' type='text' inputmode='numeric' pattern='[0-9]*' maxlength='4' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' enterkeyhint='done' aria-label='"+T.hintT+"'></div>"+
  "<p aria-live='polite'></p><div class='pad'>"+
  [1,2,3,4,5,6,7,8,9].map(n=>"<button type='button' data-k='"+n+"'>"+n+"</button>").join("")+
  "<span></span><button type='button' data-k='0'>0</button><button type='button' class='x' data-k='del' aria-label='"+T.del+"'>"+BK+"</button></div>"+
  "<button type='button' class='tg'></button><a id='kzhome' href='"+(KZ.embed?"#":"/")+"'>"+T.home+"</a>";
 document.body.appendChild(o);
 let v="",fails=0,until=0;
 const dots=[...o.querySelectorAll(".dots i")],msg=o.querySelector("p"),dw=o.querySelector(".dw"),inp=o.querySelector(".pin"),tg=o.querySelector(".tg");
 const paint=()=>dots.forEach((d,i)=>{d.classList.toggle("on",i<v.length);d.classList.toggle("cur",mode==="type"&&document.activeElement===inp&&i===Math.min(v.length,3))});
 const setV=n=>{v=n;if(inp.value!==n)inp.value=n;paint()};
 const hint=()=>{msg.classList.remove("err");msg.textContent=mode==="pad"?T.hintP:T.hintT};
 function setMode(m){mode=m;o.className="kzg "+(m==="pad"?"p":"t");try{localStorage.setItem("kz-pin-mode",m)}catch(e){}
  tg.textContent=m==="pad"?T.toType:T.toPad;hint();if(m==="type")inp.focus({preventScroll:true});else inp.blur();paint()}
 function check(){const pin=KZ.settings()[role==="admin"?"adminPin":"staffPin"];
  if(v===String(pin)){try{sessionStorage.setItem(key,"1")}catch(e){}document.removeEventListener("keydown",kd);o.remove();st.remove();res();return}
  fails++;msg.textContent=T.bad;msg.classList.add("err");dw.classList.remove("bad");void dw.offsetWidth;dw.classList.add("bad");
  setTimeout(()=>{setV("");if(fails>0)setTimeout(hint,900)},350);
  if(fails>=5){until=Date.now()+30000;fails=0;msg.textContent=T.lock}}
 function press(k){if(Date.now()<until){msg.classList.add("err");msg.textContent=T.lock;return}
  if(k==="del"){setV(v.slice(0,-1));return}
  if(v.length>=4)return;setV(v+k);hint();if(v.length===4)check()}
 inp.addEventListener("input",()=>{if(Date.now()<until){setV("");msg.classList.add("err");msg.textContent=T.lock;return}
  setV(inp.value.replace(/\D/g,"").slice(0,4));hint();if(v.length===4)check()});
 inp.addEventListener("focus",paint);inp.addEventListener("blur",paint);
 o.addEventListener("click",e=>{const b=e.target.closest("button[data-k]");if(b)press(b.dataset.k)});
 tg.onclick=()=>setMode(mode==="pad"?"type":"pad");
 o.querySelector("#kzhome").onclick=e=>{e.preventDefault();KZ.go("index")};
 function kd(e){if(document.activeElement===inp)return;if(/^\d$/.test(e.key))press(e.key);else if(e.key==="Backspace")press("del")}
 document.addEventListener("keydown",kd);
 tg.textContent=mode==="pad"?T.toType:T.toPad;hint();paint();
 o.tabIndex=-1;o.style.outline="0";
 if(mode==="type")setTimeout(()=>{try{inp.focus({preventScroll:true})}catch(e){}},60);else o.focus({preventScroll:true});
});


/* ---------- waiter accounts: one shared staff PIN, then each waiter picks their own name ---------- */
KZ.waiters=()=>{const a=KZ.settings().waiters;return(Array.isArray(a)?a:[]).filter(w=>w&&w.id&&(w.en||w.ar))};
KZ.wname=(w,l)=>w?(l==="ar"?(w.ar||w.en):(w.en||w.ar))||"":"";
KZ.me=()=>{try{const id=sessionStorage.getItem("kz-waiter");return KZ.waiters().find(x=>x.id===id)||null}catch(e){return null}};
KZ.switchWaiter=()=>{try{sessionStorage.removeItem("kz-waiter")}catch(e){}};
KZ.pickWaiter=()=>new Promise(res=>{
 const cur=KZ.me();if(cur){res(cur);return}
 const ws=KZ.waiters();if(!ws.length){res({id:"staff",en:"Staff",ar:"موظف"});return}
 const l=KZ.lang(),ar=l==="ar",F="'Readex Pro',system-ui,-apple-system,sans-serif";
 const st=document.createElement("style");
 st.textContent=".kzw{position:fixed;inset:0;z-index:9999;background:#10211a;color:#f4efdd;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;overflow-y:auto;font-family:"+F+";font-weight:300}"+
 ".kzw img{width:110px;height:auto}.kzw h1{font:500 30px/1.15 'Cormorant Garamond','Readex Pro',Georgia,serif;margin:0;text-align:center}.kzw p{font-size:14px;color:rgba(244,239,221,.9);margin:0 0 6px;text-align:center}"+
 ".kzw .ls{display:grid;gap:10px;width:min(360px,100%)}.kzw .ls button{padding:18px 20px;border-radius:99px;border:1px solid rgba(211,201,148,.55);background:#ffffff0d;color:#f4efdd;font:500 19px "+F+";cursor:pointer;transition:background .15s,transform .12s}"+
 ".kzw .ls button:active{background:rgba(211,201,148,.3);transform:scale(.97)}.kzw .ls button:focus-visible{outline:2px solid #d3c994;outline-offset:3px}";
 document.head.appendChild(st);
 const o=document.createElement("div");o.className="kzw";o.dir=ar?"rtl":"ltr";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");
 o.innerHTML="<img src='logo.png' alt='Kanzel'><h1>"+(ar?"مين بيشتغل دلوقتي؟":"Who is on shift?")+"</h1><p>"+(ar?"اختار اسمك. الطلبات اللي تأكدها هتكمل عليها انت.":"Pick your name. Orders you confirm stay with you.")+"</p><div class='ls'></div>";
 const box=o.querySelector(".ls");
 ws.forEach(w=>{const b=document.createElement("button");b.type="button";b.textContent=KZ.wname(w,l);b.onclick=()=>{try{sessionStorage.setItem("kz-waiter",w.id)}catch(e){}o.remove();st.remove();res(w)};box.appendChild(b)});
 document.body.appendChild(o)});

/* ---------- PWA ---------- */
if(!KZ.embed&&!window.__NOSW&&"serviceWorker" in navigator&&/^https?:$/.test(location.protocol)){
 addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
})();
/* iOS zooms the page when a focused field is under 16px: keep every field at 16px on touch screens */
(function(){var s=document.createElement("style");s.textContent="@media (hover:none) and (pointer:coarse){input,select,textarea{font-size:16px!important}}html{-webkit-text-size-adjust:100%;touch-action:manipulation}";(document.head||document.documentElement).appendChild(s)})();
