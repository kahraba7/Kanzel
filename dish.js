/* Kanzel menu helpers (shared by / and /table): live search + dish detail sheet.
   KZX.init({list, nav, resolve})  once, after the page exists.
                                   resolve(cardEl) -> open-config of that card (enables swipe between dishes)
   KZX.hay(...)            searchable text for one dish (put it in data-s on the card)
   KZX.setLang(l)          "ar" | "en", call on every render
   KZX.reapply()           re-run the current search after the list was re-rendered
   KZX.open(cfg, cardEl)   show the detail sheet. cfg={img,title,desc,price,foot}; foot() returns html, KZX.refresh() redraws it.
                           cardEl (optional) = the tapped card: gives the photo fly-in, the category name and the swipe neighbours.
   KZX.reset()             clear search and close the sheet (no animation, no history change)
   v40 sheet: phone Back closes it, drag down to close, title on the photo, photo flies from the card,
              swipe / arrows / keys to the next dish, focus trap + inert background. */
(function(){
const TXT={
 en:{ph:"Search the menu",clear:"Clear search",none:"No dish matches your search. Try another word.",close:"Close",tax:"Plus 12% service and 14% tax",prev:"Previous dish",next:"Next dish"},
 ar:{ph:"ابحث في المنيو",clear:"مسح البحث",none:"مفيش صنف بالاسم ده. جرّب كلمة تانية.",close:"إغلاق",tax:"الأسعار + 12% خدمة و14% ضريبة",prev:"الصنف السابق",next:"الصنف التالي"}
};
let lang="en",input,clr,empty,listEl,navEl,resolve=null;
let dz,pn,bk,cl,sc,sl,im,img,bgb,ov,tt,ey,h3,ds,pp,fx,tx,ct,pv,nx;
let opener=null,cfg=null,card=null,nbrs=[],idx=-1,catName="";
let isOpen=false,closing=false,busy=false,histPushed=false,skipPop=false,inerted=[],fly=null,g=null;
const RM=()=>matchMedia("(prefers-reduced-motion:reduce)").matches;
const rtl=()=>document.documentElement.dir==="rtl";
/* Web Animations helper: returns {a, done} ; with reduced motion (or no WAAPI) done resolves at once */
function anim(el,kf,o){
 if(RM()||!el.animate)return{a:null,done:Promise.resolve()};
 const a=el.animate(kf,o);return{a:a,done:a.finished.catch(function(){})};
}

/* Arabic-friendly normalising: no diacritics, alef/ya/ta-marbuta variants unified, digits unified */
function norm(s){
 return String(s==null?"":s).toLowerCase()
  .replace(/[ً-ٰٟـ]/g,"")
  .replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/ؤ/g,"و").replace(/ئ/g,"ي")
  .replace(/[٠-٩]/g,d=>d.charCodeAt(0)-0x660)
  .replace(/[۰-۹]/g,d=>d.charCodeAt(0)-0x6F0)
  .replace(/[^\p{L}\p{N}]+/gu," ").trim();
}
function hay(){return norm([].slice.call(arguments).join(" "))}

const CSS=`
.stk{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:#10211af5;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.stk nav{position:static!important;background:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.sx{position:relative;margin:10px 16px 0!important;padding:0!important}
.sx svg.mg{position:absolute;inset-inline-start:14px;top:50%;width:18px;height:18px;transform:translateY(-50%);color:#d3c994;pointer-events:none}
.sx input{display:block;width:100%;height:46px;padding:0 44px!important;margin:0!important;box-sizing:border-box;border-radius:99px;border:1px solid rgba(211,201,148,.5);background:#ffffff0f;color:#f4efdd;font:400 16px var(--sans,system-ui);-webkit-appearance:none;appearance:none;transition:height .3s,border-color .2s}
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
.stk .svc{padding:8px 16px 0!important}
.stk .svc button{padding:8px 10px!important;font-size:13px;transition:padding .25s}
.min .stk .svc{padding-top:6px!important}
.min .stk .svc button{padding:6px 10px!important}
.stk .sx{margin-top:8px!important}
.stk>nav{margin-top:0!important}
body.searching section .items,body.searching section .items-g{display:block!important}
body.searching section .chev{opacity:.0}
.sx-hide{display:none!important}
section{scroll-margin-top:124px!important}
.sx-none{padding:34px 24px;text-align:center;font-size:14px;color:rgba(244,239,221,.85)}
.card[data-s]{cursor:pointer;-webkit-tap-highlight-color:transparent}
#menuView .card p,.items-g .card p{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

/* ---- dish sheet ---- */
.dz{position:fixed;inset:0;z-index:60;display:none;-webkit-tap-highlight-color:transparent}
.dz.on{display:block}
.dz button{-webkit-tap-highlight-color:transparent}
.dz :focus-visible{outline:2px solid #d3c994;outline-offset:2px}
.dz .bk{position:absolute;inset:0;background:rgba(5,12,9,.74);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);animation:dzf .25s both}
.dz .pn{--hh:min(100vw,420px,46vh);--hh:min(100vw,420px,46dvh);position:absolute;left:0;right:0;bottom:0;max-width:600px;margin:0 auto;max-height:92vh;max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;background:#162b21;color:#f4efdd;border:1px solid rgba(211,201,148,.28);border-bottom:0;border-radius:28px 28px 0 0}
.dz .pn.np{--hh:84px}
.dz .sc{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y}
.dz .pn.fit .sc{touch-action:none}
.dz .hd{position:absolute;top:0;left:50%;width:84px;height:30px;margin-left:-42px;z-index:4;touch-action:none}
.dz .hd::after{content:"";position:absolute;top:9px;left:50%;width:40px;height:5px;margin-left:-20px;border-radius:3px;background:rgba(244,239,221,.7);box-shadow:0 0 0 .5px rgba(0,0,0,.3),0 1px 6px rgba(0,0,0,.35)}
.dz .im{position:relative;height:var(--hh);overflow:hidden;background:var(--ph,#2a4a2f);touch-action:none}
.dz .bgb{position:absolute;inset:-30px;background-size:cover;background-position:center;filter:blur(26px) saturate(1.15) brightness(.72)}
.dz .im img{position:absolute;top:0;left:50%;height:100%;width:auto;max-width:100%;object-fit:contain;transform:translateX(-50%);opacity:0;transition:opacity .35s}
.dz .im img.ok{opacity:1}
.dz .im img.nt{transition:none}
.dz .im.wide img{-webkit-mask-image:linear-gradient(to right,transparent,#000 14%,#000 86%,transparent);mask-image:linear-gradient(to right,transparent,#000 14%,#000 86%,transparent)}
.dz .im .mono{display:none;position:absolute;inset:0;place-items:center;font:600 44px var(--serif,Georgia,serif);color:#d3c99499}
.dz .im.no{background:linear-gradient(135deg,#3b6340,#2a4a2f)}
.dz .im.no .mono{display:grid}
.dz .im.no img,.dz .im.no .bgb,.dz .im.no .ov{display:none}
.dz .ov{position:absolute;left:0;right:0;bottom:0;padding:72px 22px 16px;background:linear-gradient(to top,#162b21 4%,rgba(22,43,33,.9) 36%,rgba(22,43,33,0))}
.dz .ey{display:block;margin:0 0 6px;font:600 11.5px/1.2 var(--sans,system-ui);letter-spacing:.16em;text-transform:uppercase;color:#d3c994}
.dz .ey:empty{display:none}
html[dir=rtl] .dz .ey{letter-spacing:0;text-transform:none;font-size:13px}
.dz h3{font:600 29px/1.15 var(--serif,Georgia,serif);margin:0;text-wrap:balance;text-shadow:0 1px 12px rgba(0,0,0,.35)}
.dz .bd>.tt{margin-bottom:12px}
.dz .bd>.tt h3{font-size:30px;text-shadow:none}
.dz .cl,.dz .nv{position:absolute;z-index:5;border-radius:50%;border:1px solid rgba(211,201,148,.6);background:rgba(16,33,26,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#d3c994;display:grid;place-items:center;cursor:pointer;padding:0;transition:opacity .2s,transform .15s}
.dz .cl{top:12px;inset-inline-end:12px;width:44px;height:44px}
.dz .cl:active,.dz .nv:active{transform:scale(.92)}
.dz .cl svg{width:18px;height:18px}
.dz .nv{top:calc(var(--hh)/2 - 22px);width:44px;height:44px;border-color:rgba(211,201,148,.45)}
.dz .nv.pv{inset-inline-start:8px}
.dz .nv.nx{inset-inline-end:8px}
.dz .nv svg{width:20px;height:20px}
html[dir=rtl] .dz .nv svg{transform:scaleX(-1)}
/* no-photo header is only 84px tall: arrows sit either side of the K so they never cover the counter or the close button */
.dz .pn.np .nv{top:20px}
.dz .pn.np .nv.pv{inset-inline-start:calc(50% - 94px)}
.dz .pn.np .nv.nx{inset-inline-end:calc(50% - 94px)}
.dz .nv:disabled{opacity:0;pointer-events:none}
.dz .nv[hidden],.dz .ct[hidden]{display:none}
.dz .ct{position:absolute;z-index:5;top:21px;inset-inline-start:14px;padding:6px 11px;border-radius:99px;background:rgba(16,33,26,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border:1px solid rgba(211,201,148,.4);color:#f4efdd;font:600 12.5px/1 var(--sans,system-ui);letter-spacing:.04em;font-variant-numeric:tabular-nums}
.dz .bd{padding:18px 22px calc(24px + env(safe-area-inset-bottom,0px))}
.dz .ds{font:400 15.5px/1.75 var(--sans,system-ui);color:#e6e0cb;margin:0;white-space:pre-line}
.dz .ft{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:22px;padding-top:18px;border-top:1px solid rgba(211,201,148,.28)}
.dz .pp{display:inline-block;padding:6px 18px;border-radius:99px;background:rgba(211,201,148,.24);border:1.5px solid #d3c994;font:700 24px/1.2 var(--sans,system-ui);color:#fff3b8;white-space:nowrap}
.dz .pp small{font:500 14px var(--sans,system-ui);margin-inline-start:4px}
.dz .tx{flex:1 1 100%;font-size:13px;line-height:1.5;color:rgba(244,239,221,.82);margin:0}
.dz .ctl .q{width:44px;height:44px}
.dz.fresh .ov .tt{animation:dzt .45s .2s cubic-bezier(.2,.8,.2,1) both}
.kzx-fl{position:fixed;z-index:62;pointer-events:none;background-size:cover;background-position:center;transform-origin:0 0;will-change:transform;box-shadow:0 12px 34px rgba(0,0,0,.4)}
html.kzx-lock,html.kzx-lock body{overflow:hidden}
@keyframes dzf{from{opacity:0}to{opacity:1}}
@keyframes dzt{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.dz .bk,.dz.fresh .ov .tt{animation:none}.dz .im img,.dz .cl,.dz .nv{transition:none}}
`;

function css(){const s=document.createElement("style");s.textContent=CSS;document.head.appendChild(s)}

const SVG_X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const SVG_P='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const SVG_N='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';

function init(o){
 if(input)return;
 listEl=typeof o.list==="string"?document.querySelector(o.list):o.list;
 navEl=typeof o.nav==="string"?document.querySelector(o.nav):o.nav;
 resolve=typeof o.resolve==="function"?o.resolve:null;
 css();
 const stk=document.createElement("div");stk.className="stk";
 navEl.parentNode.insertBefore(stk,navEl);
 const sx=document.createElement("div");sx.className="sx";
 sx.innerHTML='<svg class="mg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>'+
  '<input type="search" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false">'+
  '<button type="button" class="xc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
 const svc=document.querySelector("#menuView .svc");if(svc)stk.appendChild(svc);
 stk.appendChild(sx);stk.appendChild(navEl);
 input=sx.querySelector("input");clr=sx.querySelector(".xc");
 empty=document.createElement("p");empty.className="sx-none sx-hide";empty.setAttribute("role","status");
 listEl.parentNode.insertBefore(empty,listEl.nextSibling);
 input.addEventListener("input",()=>apply(true));
 input.addEventListener("keydown",e=>{if(e.key==="Enter")input.blur()});
 clr.onclick=()=>{input.value="";apply(true);input.focus()};

 /* detail sheet */
 dz=document.createElement("div");dz.className="dz";dz.setAttribute("role","dialog");dz.setAttribute("aria-modal","true");dz.setAttribute("aria-labelledby","kzx-t");
 dz.innerHTML='<div class="bk"></div>'+
  '<div class="pn">'+
   '<div class="hd" aria-hidden="true"></div>'+
   '<span class="ct" role="status" aria-live="polite" hidden></span>'+
   '<button type="button" class="nv pv" hidden>'+SVG_P+'</button>'+
   '<button type="button" class="nv nx" hidden>'+SVG_N+'</button>'+
   '<button type="button" class="cl">'+SVG_X+'</button>'+
   '<div class="sc"><div class="sl">'+
    '<div class="im"><span class="bgb"></span><img alt="" decoding="async"><span class="mono" aria-hidden="true">K</span><div class="ov"></div></div>'+
    '<div class="bd"><div class="tt"><span class="ey"></span><h3 id="kzx-t"></h3></div><p class="ds"></p><div class="ft"><b class="pp"></b><div class="fx"></div><p class="tx"></p></div></div>'+
   '</div></div>'+
  '</div>';
 document.body.appendChild(dz);
 const q=s=>dz.querySelector(s);
 pn=q(".pn");bk=q(".bk");cl=q(".cl");sc=q(".sc");sl=q(".sl");im=q(".im");img=q(".im img");bgb=q(".bgb");ov=q(".ov");
 tt=q(".tt");ey=q(".ey");h3=q("h3");ds=q(".ds");pp=q(".pp");fx=q(".fx");tx=q(".tx");ct=q(".ct");pv=q(".pv");nx=q(".nx");
 bk.onclick=()=>close();cl.onclick=()=>close();
 pv.onclick=()=>go(-1,0);nx.onclick=()=>go(1,0);
 img.addEventListener("load",()=>img.classList.add("ok"));
 bk.addEventListener("touchmove",e=>{if(e.cancelable)e.preventDefault()},{passive:false});
 pn.addEventListener("touchstart",tStart,{passive:true});
 pn.addEventListener("touchmove",tMove,{passive:false});
 pn.addEventListener("touchend",tEnd);
 pn.addEventListener("touchcancel",tEnd);
 addEventListener("keydown",onKey);
 addEventListener("popstate",()=>{
  if(skipPop){skipPop=false;return}
  if(isOpen&&!closing){histPushed=false;dismiss(0)}
 });
 setLang(lang);
}

function setLang(l){
 lang=l==="ar"?"ar":"en";if(!input)return;const t=TXT[lang];
 input.placeholder=t.ph;input.setAttribute("aria-label",t.ph);clr.setAttribute("aria-label",t.clear);
 empty.textContent=t.none;
 cl.setAttribute("aria-label",t.close);tx.textContent=t.tax;
 pv.setAttribute("aria-label",t.prev);nx.setAttribute("aria-label",t.next);
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

/* ---------- sheet content ---------- */
function fill(c,cardEl){
 cfg=c;card=cardEl||null;
 const photo=!!c.img;
 pn.classList.toggle("np",!photo);im.classList.toggle("no",!photo);
 img.classList.remove("ok","nt");
 if(photo){
  const p=window.PH&&window.PH[c.img];
  im.style.setProperty("--ph",p?"linear-gradient(#"+p.split("-")[0]+",#"+p.split("-")[1]+")":"#2a4a2f");
  bgb.style.backgroundImage="url('"+c.img+"')";
  img.src=c.img;if(img.complete&&img.naturalWidth)img.classList.add("ok");
 }else{
  img.removeAttribute("src");bgb.style.backgroundImage="";im.style.removeProperty("--ph");
 }
 ey.textContent=catName;
 h3.textContent=c.title||"";
 /* title sits on the photo; for dishes without a photo it goes to the body */
 const bd=dz.querySelector(".bd");
 if(photo)ov.appendChild(tt);else bd.insertBefore(tt,bd.firstChild);
 ds.textContent=c.desc||"";ds.style.display=c.desc?"":"none";
 if(!c.desc)tt.style.marginBottom="0";else tt.style.marginBottom="";
 pp.innerHTML=c.price||"";
 refresh();
 const many=nbrs.length>1;
 ct.hidden=!many;pv.hidden=!many;nx.hidden=!many;
 if(many){
  ct.innerHTML='<span dir="ltr">'+(idx+1)+' / '+nbrs.length+'</span>';
  pv.disabled=idx<=0;nx.disabled=idx>=nbrs.length-1;
  if(document.activeElement&&document.activeElement.disabled)cl.focus({preventScroll:true});
 }
}
function measure(){pn.classList.toggle("fit",sc.scrollHeight<=sc.clientHeight+1);im.classList.toggle("wide",im.clientWidth/(im.clientHeight||1)>1.08)}
function preload(){
 if(!resolve)return;
 [idx-1,idx+1].forEach(i=>{const c=nbrs[i];if(!c)return;try{const o=resolve(c);if(o&&o.img){const im2=new Image();im2.src=o.img}}catch(e){}})
}

function refresh(){
 if(!dz||!cfg)return;
 const had=isOpen&&fx.contains(document.activeElement);
 fx.innerHTML=cfg.foot?cfg.foot():"";
 if(had){const b=fx.querySelector('[data-a="inc"]');if(b)b.focus({preventScroll:true})}
}

/* ---------- open / close ---------- */
function lockBg(on){
 if(on){
  inerted=[].slice.call(document.body.children).filter(e=>e!==dz&&!e.inert&&!/^(SCRIPT|STYLE|LINK)$/.test(e.tagName));
  inerted.forEach(e=>{e.inert=true});
 }else{inerted.forEach(e=>{e.inert=false});inerted=[]}
}
function clearFly(){if(fly){try{fly.el.remove()}catch(e){}if(fly.src)fly.src.style.visibility="";fly=null}}

function open(o,cardEl){
 if(!dz||isOpen)return;
 opener=document.activeElement;closing=false;busy=false;
 cardEl=cardEl&&cardEl.nodeType===1?cardEl:null;
 nbrs=[];idx=-1;catName="";
 if(cardEl){
  const sec=cardEl.closest("section")||listEl;
  const n=sec.querySelector(".nm");catName=n?n.textContent.trim():"";
  if(resolve){
   nbrs=[].slice.call(sec.querySelectorAll(".card[data-s]")).filter(c=>!c.classList.contains("sx-hide"));
   idx=nbrs.indexOf(cardEl);if(idx<0){nbrs=[];idx=-1}
  }
 }
 fill(o,cardEl);
 lockBg(true);
 dz.classList.add("on","fresh");
 document.documentElement.classList.add("kzx-lock");
 sc.scrollTop=0;pn.style.transform="";bk.style.opacity="";sl.style.transform="";
 measure();
 /* the photo flies from the card to the sheet */
 const src=cardEl&&cardEl.querySelector(".ph");
 if(src&&o.img&&!RM()&&pn.animate){
  const r=img.getBoundingClientRect(),c0=src.getBoundingClientRect();
  if(r.width&&c0.width&&c0.bottom>0&&c0.top<innerHeight){
   const s=Math.min(r.width,r.height),tx0=r.left+(r.width-s)/2,ty0=r.top+(r.height-s)/2,k=c0.width/s;
   const el=document.createElement("div");el.className="kzx-fl";
   el.style.cssText="left:"+tx0+"px;top:"+ty0+"px;width:"+s+"px;height:"+s+"px;background-image:url('"+o.img+"')";
   document.body.appendChild(el);
   const rad=(parseFloat(getComputedStyle(src).borderTopLeftRadius)||0)/k;
   src.style.visibility="hidden";fly={el:el,src:src};
   const a=el.animate([{transform:"translate("+(c0.left-tx0)+"px,"+(c0.top-ty0)+"px) scale("+k+","+(c0.height/s)+")",borderRadius:rad+"px"},{transform:"none",borderRadius:"0px"}],{duration:440,easing:"cubic-bezier(.2,.8,.2,1)",fill:"both"});
   const mine=fly;
   a.finished.catch(function(){}).then(function(){
    if(fly!==mine)return;
    img.classList.add("ok","nt");src.style.visibility="";
    return el.animate([{opacity:1},{opacity:0}],{duration:170,fill:"forwards"}).finished.catch(function(){});
   }).then(function(){if(fly===mine){clearFly()}img.classList.remove("nt")});
  }
 }
 anim(pn,[{transform:"translateY(100%)"},{transform:"translateY(0)"}],{duration:420,easing:"cubic-bezier(.2,.8,.2,1)"});
 setTimeout(()=>{if(dz)dz.classList.remove("fresh")},900);
 isOpen=true;
 if(!histPushed){try{history.pushState({kzx:1},"");histPushed=true}catch(e){}}
 cl.focus({preventScroll:true});
 preload();
}

function dismiss(fromY){
 if(!isOpen||closing)return;
 closing=true;
 const h=pn.offsetHeight||innerHeight,op=parseFloat(bk.style.opacity||"1");
 pn.style.transform="";bk.style.opacity="";
 const a=anim(pn,[{transform:"translateY("+(fromY||0)+"px)"},{transform:"translateY("+h+"px)"}],{duration:fromY?200:250,easing:"cubic-bezier(.4,0,.8,.4)",fill:"forwards"});
 anim(bk,[{opacity:op},{opacity:0}],{duration:250,fill:"forwards"});
 a.done.then(finishClose);
}
function finishClose(){
 if(!isOpen)return;
 isOpen=false;closing=false;busy=false;g=null;
 dz.classList.remove("on","fresh");
 [pn,bk,sl].forEach(e=>{if(e.getAnimations)e.getAnimations().forEach(a=>a.cancel())});
 pn.style.transform="";bk.style.opacity="";sl.style.transform="";
 clearFly();
 document.documentElement.classList.remove("kzx-lock");
 lockBg(false);
 cfg=null;card=null;nbrs=[];idx=-1;
 if(opener&&opener.focus&&document.contains(opener))opener.focus({preventScroll:true});opener=null;
}
/* normal close (X, backdrop, Esc, drag): also pops the history entry we added */
function close(fromY){
 if(!isOpen||closing)return;
 if(histPushed){histPushed=false;skipPop=true;history.back()}
 dismiss(typeof fromY==="number"?fromY:0);
}
/* hard reset (page routing): no animation, history untouched */
function reset(){
 if(input){input.value="";apply(false)}
 if(isOpen){histPushed=false;finishClose()}
}

/* ---------- go to another dish ---------- */
function go(step,fromDx){
 const ni=idx+step;
 if(!isOpen||closing||busy||!resolve||ni<0||ni>=nbrs.length)return;
 const c=nbrs[ni],nc=resolve(c);if(!nc)return;
 busy=true;
 const W=sl.offsetWidth||innerWidth,exit=step*(rtl()?1:-1)*W;
 sl.style.transform="";
 const out=anim(sl,[{transform:"translateX("+(fromDx||0)+"px)",opacity:1},{transform:"translateX("+exit+"px)",opacity:0}],{duration:fromDx?150:170,easing:"cubic-bezier(.4,0,1,1)",fill:"forwards"});
 out.done.then(()=>{
  if(!isOpen){busy=false;return}
  idx=ni;fill(nc,c);sc.scrollTop=0;measure();
  if(out.a)out.a.cancel();
  anim(sl,[{transform:"translateX("+(-exit*.5)+"px)",opacity:0},{transform:"none",opacity:1}],{duration:300,easing:"cubic-bezier(.2,.8,.2,1)"}).done.then(()=>{busy=false});
  preload();
  try{if(navigator.vibrate)navigator.vibrate(6)}catch(e){}
 });
}
const stepOf=dx=>(dx<0?1:-1)*(rtl()?-1:1);
const has=s=>idx+s>=0&&idx+s<nbrs.length;

/* ---------- touch: drag down to close, swipe sideways for next / previous ---------- */
function tStart(e){
 if(!isOpen||closing||busy||e.touches.length!==1){g=null;return}
 const t=e.touches[0];
 g={x:t.clientX,y:t.clientY,top:sc.scrollTop,axis:"",dx:0,dy:0,d:0,vx:0,vy:0,lx:t.clientX,ly:t.clientY,lt:e.timeStamp,w:sl.offsetWidth||innerWidth};
}
function tMove(e){
 if(!g||e.touches.length!==1)return;
 const t=e.touches[0];
 g.dx=t.clientX-g.x;g.dy=t.clientY-g.y;
 const dt=e.timeStamp-g.lt;
 if(dt>0){g.vx=(t.clientX-g.lx)/dt;g.vy=(t.clientY-g.ly)/dt;g.lx=t.clientX;g.ly=t.clientY;g.lt=e.timeStamp}
 if(!g.axis){
  if(Math.abs(g.dx)<8&&Math.abs(g.dy)<8)return;
  g.axis=Math.abs(g.dx)>Math.abs(g.dy)?"x":(g.dy>0&&g.top<=0?"s":"n");
 }
 if(g.axis==="x"&&resolve){
  const d=has(stepOf(g.dx))?g.dx:g.dx*.28;g.d=d;
  sl.style.transform="translateX("+d+"px)";
  if(e.cancelable)e.preventDefault();
 }else if(g.axis==="s"){
  const d=Math.max(0,g.dy-8);g.d=d;
  pn.style.transform="translateY("+d+"px)";
  bk.style.opacity=String(Math.max(0,1-d/((pn.offsetHeight||600)*1.1)));
  if(e.cancelable)e.preventDefault();
 }
}
function tEnd(){
 if(!g)return;const s=g;g=null;
 if(s.axis==="s"){
  const d=s.d;
  if(d>110||(d>30&&s.vy>.6)){close(d);return}
  const op=parseFloat(bk.style.opacity||"1");
  pn.style.transform="";bk.style.opacity="";
  anim(pn,[{transform:"translateY("+d+"px)"},{transform:"none"}],{duration:280,easing:"cubic-bezier(.2,.8,.2,1)"});
  anim(bk,[{opacity:op},{opacity:1}],{duration:280});
 }else if(s.axis==="x"&&resolve){
  const step=stepOf(s.dx),far=Math.abs(s.dx)>s.w*.22||(Math.abs(s.dx)>36&&Math.abs(s.vx)>.45);
  if(far&&has(step)){go(step,s.d);return}
  sl.style.transform="";
  anim(sl,[{transform:"translateX("+s.d+"px)"},{transform:"none"}],{duration:280,easing:"cubic-bezier(.2,.8,.2,1)"});
 }
}

/* ---------- keyboard: Esc, arrows, Tab trap ---------- */
function onKey(e){
 if(!isOpen)return;
 if(e.key==="Escape"){close();return}
 if(e.key==="ArrowLeft"||e.key==="ArrowRight"){
  if(e.target&&e.target.closest&&e.target.closest("input,textarea,select"))return;
  let s=e.key==="ArrowRight"?1:-1;if(rtl())s=-s;
  go(s,0);e.preventDefault();return;
 }
 if(e.key==="Tab"){
  const f=[].slice.call(pn.querySelectorAll("button,[href],input,textarea,select,[tabindex]")).filter(x=>!x.disabled&&!x.hidden&&x.tabIndex>=0&&x.offsetParent!==null);
  if(!f.length)return;
  const a=document.activeElement,first=f[0],last=f[f.length-1];
  if(!pn.contains(a)){first.focus();e.preventDefault()}
  else if(e.shiftKey&&a===first){last.focus();e.preventDefault()}
  else if(!e.shiftKey&&a===last){first.focus();e.preventDefault()}
 }
}

window.KZX={init,hay,setLang,reapply:()=>apply(false),open,refresh,close:()=>close(),reset,norm,isOpen:()=>isOpen};
})();
