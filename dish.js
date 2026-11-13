/* Kanzel menu helpers (shared by / and /table): live search + dish detail window.
   KZX.init({list, nav})   once, after the page exists
   KZX.hay(...)            searchable text for one dish (put it in data-s on the card)
   KZX.setLang(l)          "ar" | "en", call on every render
   KZX.reapply()           re-run the current search after the list was re-rendered
   KZX.open({img,title,desc,price,foot})  show the detail window; foot() returns html, KZX.refresh() redraws it
   KZX.reset()             clear search and close the window */
(function(){
const TXT={
 en:{ph:"Search the menu",clear:"Clear search",none:"No dish matches your search. Try another word.",close:"Close",tax:"Plus 12% service and 14% tax"},
 ar:{ph:"ابحث في المنيو",clear:"مسح البحث",none:"مفيش صنف بالاسم ده. جرّب كلمة تانية.",close:"إغلاق",tax:"الأسعار + 12% خدمة و14% ضريبة"}
};
let lang="en",input,clr,empty,listEl,navEl,dz,last=null,opener=null,cfg=null;

/* Arabic-friendly normalising: no diacritics, alef/ya/ta-marbuta variants unified, digits unified */
function norm(s){
 return String(s==null?"":s).toLowerCase()
  .replace(/[\u064B-\u065F\u0670\u0640]/g,"")
  .replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/ؤ/g,"و").replace(/ئ/g,"ي")
  .replace(/[\u0660-\u0669]/g,d=>d.charCodeAt(0)-0x660)
  .replace(/[\u06F0-\u06F9]/g,d=>d.charCodeAt(0)-0x6F0)
  .replace(/[^\p{L}\p{N}]+/gu," ").trim();
}
function hay(){return norm([].slice.call(arguments).join(" "))}

const CSS=`
.stk{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:#10211af5;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.stk nav{position:static!important;background:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.sx{position:relative;margin:10px 16px 0!important;padding:0!important}
.sx svg.mg{position:absolute;inset-inline-start:14px;top:50%;width:18px;height:18px;transform:translateY(-50%);color:#d3c994;pointer-events:none}
.sx input{display:block;width:100%;height:46px;padding:0 44px!important;margin:0!important;box-sizing:border-box;border-radius:99px;border:1px solid rgba(211,201,148,.5);background:#ffffff0f;color:#f4efdd;font:400 15px var(--sans,system-ui);-webkit-appearance:none;appearance:none;transition:height .3s,border-color .2s}
.sx input::placeholder{color:rgba(244,239,221,.65)}
.sx input:focus{outline:0;border-color:#d3c994;background:#ffffff16}
.sx input::-webkit-search-cancel-button{display:none}
.sx .xc{position:absolute;inset-inline-end:6px;top:50%;width:34px;height:34px;transform:translateY(-50%);border-radius:50%;display:none;place-items:center;color:#d3c994;background:none;border:0;cursor:pointer;padding:0}
.sx .xc.on{display:grid}
.sx .xc svg{width:16px;height:16px}
.min .sx input{height:38px}
.sx+nav{padding-top:10px!important}
body.searching .stk nav{display:none!important}
.stk .sx{padding-bottom:0!important}
.stk>nav{margin-top:0!important}
body.searching section .items,body.searching section .items-g{display:block!important}
body.searching section .chev{opacity:.0}
.sx-hide{display:none!important}
section{scroll-margin-top:124px!important}
.sx-none{padding:34px 24px;text-align:center;font-size:14px;color:rgba(244,239,221,.85)}
.card[data-s]{cursor:pointer}
#menuView .card p,.items-g .card p{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dz{position:fixed;inset:0;z-index:60;display:none}
.dz.on{display:block}
.dz .bk{position:absolute;inset:0;background:rgba(5,12,9,.74);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);animation:dzf .25s both}
.dz .pn{position:absolute;left:0;right:0;bottom:0;max-width:600px;margin:0 auto;max-height:92vh;max-height:92dvh;overflow:auto;overscroll-behavior:contain;background:#162b21;color:#f4efdd;border:1px solid rgba(211,201,148,.28);border-bottom:0;border-radius:28px 28px 0 0;animation:dzu .38s cubic-bezier(.2,.8,.2,1) both;padding-bottom:env(safe-area-inset-bottom,0px)}
.dz .im{aspect-ratio:4/3;background-size:cover;background-position:center;background-color:#2a4a2f}
.dz .im.no{aspect-ratio:auto;height:96px;display:grid;place-items:center;background:linear-gradient(135deg,#3b6340,#2a4a2f);font:600 44px var(--serif,Georgia,serif);color:#d3c99499}
.dz .cl{position:absolute;top:12px;inset-inline-end:12px;width:42px;height:42px;border-radius:50%;border:1px solid rgba(211,201,148,.6);background:rgba(16,33,26,.7);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#d3c994;display:grid;place-items:center;cursor:pointer;padding:0}
.dz .cl svg{width:18px;height:18px}
.dz .bd{padding:20px 22px 22px}
.dz h3{font:600 30px/1.15 var(--serif,Georgia,serif);margin:0}
.dz .ds{font:400 15.5px/1.75 var(--sans,system-ui);color:#e6e0cb;margin:12px 0 0;white-space:pre-line}
.dz .ft{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:22px;padding-top:18px;border-top:1px solid rgba(211,201,148,.28)}
.dz .pp{display:inline-block;padding:6px 18px;border-radius:99px;background:rgba(211,201,148,.24);border:1.5px solid #d3c994;font:700 24px/1.2 var(--sans,system-ui);color:#fff3b8;white-space:nowrap}
.dz .pp small{font:500 14px var(--sans,system-ui);margin-inline-start:4px}
.dz .tx{flex:1 1 100%;font-size:12.5px;color:rgba(244,239,221,.75);margin:0}
.dz .ctl .q{width:44px;height:44px}
html.kzx-lock,html.kzx-lock body{overflow:hidden}
@keyframes dzf{from{opacity:0}to{opacity:1}}
@keyframes dzu{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
@media(prefers-reduced-motion:reduce){.dz .bk,.dz .pn{animation:none}}
`;

function css(){const s=document.createElement("style");s.textContent=CSS;document.head.appendChild(s)}

function init(o){
 if(input)return;
 listEl=typeof o.list==="string"?document.querySelector(o.list):o.list;
 navEl=typeof o.nav==="string"?document.querySelector(o.nav):o.nav;
 css();
 const stk=document.createElement("div");stk.className="stk";
 navEl.parentNode.insertBefore(stk,navEl);
 const sx=document.createElement("div");sx.className="sx";
 sx.innerHTML='<svg class="mg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>'+
  '<input type="search" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false">'+
  '<button type="button" class="xc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
 stk.appendChild(sx);stk.appendChild(navEl);
 input=sx.querySelector("input");clr=sx.querySelector(".xc");
 empty=document.createElement("p");empty.className="sx-none sx-hide";empty.setAttribute("role","status");
 listEl.parentNode.insertBefore(empty,listEl.nextSibling);
 input.addEventListener("input",()=>apply(true));
 input.addEventListener("keydown",e=>{if(e.key==="Enter")input.blur()});
 clr.onclick=()=>{input.value="";apply(true);input.focus()};
 /* detail window */
 dz=document.createElement("div");dz.className="dz";dz.setAttribute("role","dialog");dz.setAttribute("aria-modal","true");
 dz.innerHTML='<div class="bk"></div><div class="pn"><div class="im"></div><button type="button" class="cl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="bd"><h3></h3><p class="ds"></p><div class="ft"><b class="pp"></b><div class="fx"></div><p class="tx"></p></div></div></div>';
 document.body.appendChild(dz);
 dz.querySelector(".bk").onclick=close;dz.querySelector(".cl").onclick=close;
 addEventListener("keydown",e=>{if(e.key==="Escape"&&dz.classList.contains("on"))close()});
 setLang(lang);
}

function setLang(l){
 lang=l==="ar"?"ar":"en";if(!input)return;const t=TXT[lang];
 input.placeholder=t.ph;input.setAttribute("aria-label",t.ph);clr.setAttribute("aria-label",t.clear);
 empty.textContent=t.none;
 dz.querySelector(".cl").setAttribute("aria-label",t.close);dz.querySelector(".tx").textContent=t.tax;
}

function apply(jump){
 if(!input)return;
 const toks=norm(input.value).split(" ").filter(Boolean);
 document.body.classList.toggle("searching",toks.length>0);
 clr.classList.toggle("on",input.value.length>0);
 let total=0,first=null;
 listEl.querySelectorAll("section").forEach(sec=>{
  let n=0;
  sec.querySelectorAll(".card").forEach(c=>{
   const ok=!toks.length||toks.every(t=>(c.dataset.s||"").indexOf(t)>-1);
   c.classList.toggle("sx-hide",!ok);if(ok)n++;
  });
  sec.classList.toggle("sx-hide",toks.length>0&&!n);
  const sm=sec.querySelector(".acch small");if(sm){if(sm.dataset.n==null)sm.dataset.n=sm.textContent;sm.textContent=toks.length?n:sm.dataset.n}
  total+=n;if(n&&!first)first=sec;
 });
 empty.classList.toggle("sx-hide",!(toks.length&&!total));
 if(jump&&toks.length&&first)first.scrollIntoView({block:"start"});
}

function open(o){
 if(!dz)return;cfg=o;opener=document.activeElement;
 const im=dz.querySelector(".im");
 if(o.img){im.className="im";im.style.backgroundImage="url('"+o.img+"')";im.textContent=""}
 else{im.className="im no";im.style.backgroundImage="";im.textContent="K"}
 dz.querySelector("h3").textContent=o.title||"";
 const ds=dz.querySelector(".ds");ds.textContent=o.desc||"";ds.style.display=o.desc?"":"none";
 dz.querySelector(".pp").innerHTML=o.price||"";
 refresh();
 dz.classList.add("on");dz.querySelector(".pn").scrollTop=0;
 document.documentElement.classList.add("kzx-lock");
 dz.querySelector(".cl").focus({preventScroll:true});
}
function refresh(){
 if(!dz||!cfg)return;const fx=dz.querySelector(".fx");
 const had=dz.classList.contains("on")&&fx.contains(document.activeElement);
 fx.innerHTML=cfg.foot?cfg.foot():"";
 if(had){const b=fx.querySelector('[data-a="inc"]');if(b)b.focus({preventScroll:true})}
}
function close(){
 if(!dz||!dz.classList.contains("on"))return;
 dz.classList.remove("on");document.documentElement.classList.remove("kzx-lock");cfg=null;
 if(opener&&opener.focus&&document.contains(opener))opener.focus({preventScroll:true});opener=null;
}
function reset(){if(input){input.value="";apply(false)}close()}

window.KZX={init,hay,setLang,reapply:()=>apply(false),open,refresh,close,reset,norm,isOpen:()=>!!(dz&&dz.classList.contains("on"))};
})();
