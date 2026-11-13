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
KZ.lang=()=>S.get("kanzel-lang")==="ar"?"ar":"en";
KZ.setLang=l=>S.set("kanzel-lang",l);
KZ.clock=(ts,l)=>new Date(ts).toLocaleTimeString(l==="ar"?"ar-EG":"en-GB",{hour:"2-digit",minute:"2-digit"});
KZ.ago=(ts,l)=>{const m=Math.floor((Date.now()-ts)/6e4),a=l==="ar";if(m<1)return a?"دلوقتي":"just now";if(m<60)return a?"من "+m+" دقيقة":m+" min ago";const h=Math.floor(m/60);return a?"من "+h+" ساعة و"+(m%60)+" دقيقة":h+" h "+(m%60)+" min ago"};
/* navigation: real pages in the zip, hash views when embedded in the single-file preview */
/* ---------- UI: transitions, toast, busy buttons, offline banner, error net ---------- */
const reduce=()=>matchMedia("(prefers-reduced-motion:reduce)").matches;
function fade(fn){if(reduce()){fn();return}document.body.classList.add("kz-out");setTimeout(fn,230)}
KZ.fade=fade;
KZ.go=p=>fade(()=>{if(KZ.embed)parent.location.hash=(p==="index"?"":p);else location.href=(p==="index"?"/":"/"+p)});
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
 const h=a.getAttribute("href");if(!/^\/[\w-]*(\?.*)?$/.test(h))return;e.preventDefault();fade(()=>{location.href=h})});
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
const DEF={staffPin:"7777",adminPin:"1234",siteUrl:"https://kanzel-eg.vercel.app",mapsUrl:"https://www.google.com/maps/search/?api=1&query=Kanzel+Restaurant+%26+Lounge"};
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
KZ.list=n=>{const a=KZ.read(KZ.KEYS[n],[]);return Array.isArray(a)?a:[]};
KZ.saveList=(n,a)=>KZ.write(KZ.KEYS[n],a);
KZ.push=(n,o)=>{const a=KZ.list(n);a.push(o);return KZ.saveList(n,a)};
KZ.update=(n,id,fn)=>{const a=KZ.list(n),o=a.find(x=>x.id===id);if(!o)return false;fn(o);return KZ.saveList(n,a)};

/* ---------- PIN gate (front-end only; real protection comes with the backend) ---------- */
KZ.logout=role=>{try{sessionStorage.removeItem("kz-auth-"+role)}catch(e){}};
KZ.gate=role=>new Promise(res=>{
 const key="kz-auth-"+role;try{if(sessionStorage.getItem(key)==="1"){res();return}}catch(e){}
 const ar=KZ.lang()==="ar",st=document.createElement("style");
 st.textContent=".kzg{position:fixed;inset:0;z-index:9999;background:#10211a;color:#f4efdd;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;font-family:'Readex Pro',system-ui,sans-serif;font-weight:300}"+
 ".kzg h1{font:500 34px/1.1 'Cormorant Garamond','Readex Pro',Georgia,serif}.kzg p{font-size:13px;color:rgba(244,239,221,.75);min-height:20px}"+
 ".kzg .dots{display:flex;gap:14px;direction:ltr}.kzg .dots i{width:14px;height:14px;border-radius:50%;border:1.5px solid #d3c994;transition:background .15s}.kzg .dots i.on{background:#d3c994}"+
 ".kzg .pad{display:grid;grid-template-columns:repeat(3,72px);gap:12px;direction:ltr}.kzg .pad button{height:64px;border-radius:50%;border:1px solid rgba(211,201,148,.45);background:#ffffff0a;color:#f4efdd;font:500 24px 'Cormorant Garamond',Georgia,serif;cursor:pointer;transition:background .15s,transform .15s}"+
 ".kzg .pad button:active{background:rgba(211,201,148,.25);transform:scale(.94)}.kzg .pad button:focus-visible{outline:2px solid #d3c994;outline-offset:3px}.kzg .pad .x{border:0;background:none;font:300 14px 'Readex Pro',sans-serif;color:#d3c994}"+
 ".kzg a{font-size:13px;color:#d3c994;border-bottom:1px solid rgba(211,201,148,.5);cursor:pointer;margin-top:6px}@keyframes kzs{20%,60%{transform:translateX(-9px)}40%,80%{transform:translateX(9px)}}.kzg .dots.bad{animation:kzs .4s}";
 document.head.appendChild(st);
 const T={title:role==="admin"?(ar?"دخول المالك":"Owner access"):(ar?"دخول الموظفين":"Staff access"),hint:ar?"اكتب الرقم السري":"Enter your PIN",bad:ar?"الرقم غلط":"Wrong PIN",lock:ar?"استنى شوية وجرّب تاني":"Too many tries, wait a moment",home:ar?"الرئيسية":"Home",del:ar?"مسح":"Del"};
 const o=document.createElement("div");o.className="kzg";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");o.dir=ar?"rtl":"ltr";
 o.innerHTML="<h1>"+T.title+"</h1><div class='dots'><i></i><i></i><i></i><i></i></div><p aria-live='polite'>"+T.hint+"</p><div class='pad'>"+
  [1,2,3,4,5,6,7,8,9].map(n=>"<button data-k='"+n+"'>"+n+"</button>").join("")+"<span></span><button data-k='0'>0</button><button class='x' data-k='del'>"+T.del+"</button></div><a id='kzhome' href='"+(KZ.embed?"#":"/")+"'>"+T.home+"</a>";
 document.body.appendChild(o);
 let v="",fails=0,until=0;const dots=[...o.querySelectorAll(".dots i")],msg=o.querySelector("p"),dw=o.querySelector(".dots");
 const paint=()=>dots.forEach((d,i)=>d.classList.toggle("on",i<v.length));
 function press(k){if(Date.now()<until){msg.textContent=T.lock;return}
  if(k==="del"){v=v.slice(0,-1);paint();return}
  if(v.length>=4)return;v+=k;paint();msg.textContent=T.hint;
  if(v.length===4){const pin=KZ.settings()[role==="admin"?"adminPin":"staffPin"];
   if(v===String(pin)){try{sessionStorage.setItem(key,"1")}catch(e){}document.removeEventListener("keydown",kd);o.remove();st.remove();res()}
   else{fails++;msg.textContent=T.bad;dw.classList.remove("bad");void dw.offsetWidth;dw.classList.add("bad");setTimeout(()=>{v="";paint()},350);if(fails>=5){until=Date.now()+30000;fails=0;msg.textContent=T.lock}}}}
 o.addEventListener("click",e=>{const b=e.target.closest("button[data-k]");if(b)press(b.dataset.k)});
 o.querySelector("#kzhome").onclick=e=>{e.preventDefault();KZ.go("index")};
 function kd(e){if(/^\d$/.test(e.key))press(e.key);else if(e.key==="Backspace")press("del")}
 document.addEventListener("keydown",kd);
 const f=o.querySelector("button[data-k='1']");f&&f.focus({preventScroll:true});
});

/* ---------- PWA ---------- */
if(!KZ.embed&&!window.__NOSW&&"serviceWorker" in navigator&&/^https?:$/.test(location.protocol)){
 addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
})();
