/* tqr.js: table QR cards, shared by /admin (and the same data as /reception > Tables & QR).
   Needs qr.js (window.QRCodeLib) and kz.js. Tables are stored under "kanzel-tables" as [{id,label}].
   Each code opens  <site>/table?t=<label>  so the guest lands on the ordering page for that table. */
(function(){
const KQ=window.KZQR={COUNT:20};
KQ.defaults=()=>Array.from({length:KQ.COUNT},(_,i)=>({id:"t"+(i+1),label:String(i+1)}));
KQ.tables=()=>{const a=KZ.read("kanzel-tables",null);return Array.isArray(a)&&a.length?a:KQ.defaults()};
KQ.save=a=>KZ.write("kanzel-tables",a);
KQ.base=()=>String(KZ.settings().siteUrl||"https://kanzel-eg.vercel.app").replace(/\/+$/,"");
KQ.url=l=>KQ.base()+"/table?t="+encodeURIComponent(l);
let logo=null;KQ.ready=Promise.race([Promise.all([new Promise(r=>{const i=new Image();i.onload=()=>{logo=i;r()};i.onerror=r;i.src="logo.png"}),document.fonts?document.fonts.ready:0]),new Promise(r=>setTimeout(r,1500))]);
function qrOf(text){const L=window.QRCodeLib;for(let v=2;v<=20;v++){try{const q=new L.QRCode(v,L.ECC.M);q.addData(text);q.make();return q}catch(e){}}return null}
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
/* one printable card: logo, QR, big table number. sc = scale (1 = 1000x1400 px) */
KQ.draw=(label,sc)=>{const url=KQ.url(label),W=1000,H=1400,c=document.createElement("canvas");c.width=Math.round(W*sc);c.height=Math.round(H*sc);const x=c.getContext("2d");x.scale(sc,sc);
 x.fillStyle="#10211a";x.fillRect(0,0,W,H);x.strokeStyle="rgba(211,201,148,.6)";x.lineWidth=4;x.strokeRect(36,36,W-72,H-72);
 if(logo){const lw=420,lh=logo.height*lw/logo.width;x.drawImage(logo,(W-lw)/2,84,lw,lh)}
 const P=660,px=(W-P)/2,py=354;x.fillStyle="#f4efdd";rr(x,px,py,P,P,36);x.fill();
 const q=qrOf(url);if(q){const n=q.getModuleCount(),A=P-140,m=A/n,ox=px+70,oy=py+70;x.fillStyle="#10211a";
  for(let r=0;r<n;r++)for(let k=0;k<n;k++)if(q.isDark(r,k)){const l=Math.round(ox+k*m),t=Math.round(oy+r*m);x.fillRect(l,t,Math.round(ox+(k+1)*m)-l,Math.round(oy+(r+1)*m)-t)}}
 x.textAlign="center";x.fillStyle="#d3c994";x.font='500 32px "Readex Pro",system-ui,sans-serif';try{x.letterSpacing="8px"}catch(e){}x.fillText("TABLE · ترابيزة",W/2,1084);try{x.letterSpacing="0px"}catch(e){}
 let fs=150;const f=n=>'600 '+n+'px "Cormorant Garamond",Georgia,serif';x.font=f(fs);while(x.measureText(label).width>780&&fs>40){fs-=6;x.font=f(fs)}
 x.fillStyle="#f4efdd";x.fillText(label,W/2,1084+Math.round(fs*.9)+14);
 x.fillStyle="rgba(244,239,221,.88)";x.font='300 30px "Readex Pro",system-ui,sans-serif';x.fillText("Scan to order · امسح واطلب",W/2,H-86);return c};
KQ.download=tb=>{KQ.draw(tb.label,1).toBlob(b=>{if(!b)return;const u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="kanzel-table-"+tb.label.replace(/[^\w؀-ۿ-]+/g,"_")+".png";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000)},"image/png")};
/* A4, 4 cards per page. Optional list = only those tables. */
KQ.print=list=>{let pa=document.getElementById("printArea");if(!pa){pa=document.createElement("div");pa.id="printArea";pa.setAttribute("aria-hidden","true");document.body.appendChild(pa)}
 if(!document.getElementById("kqPrintCss")){const s=document.createElement("style");s.id="kqPrintCss";s.textContent="#printArea{display:none}@media print{@page{size:A4;margin:0}html,body{background:#fff!important}body>*:not(#printArea){display:none!important}#printArea{display:grid!important;grid-template-columns:1fr 1fr;gap:8mm;padding:8mm}#printArea img{width:100%;display:block;break-inside:avoid}}";document.head.appendChild(s)}
 pa.innerHTML="";(list||KQ.tables()).filter(t=>t.label.trim()).forEach(tb=>{const im=new Image();im.src=KQ.draw(tb.label,.6).toDataURL("image/png");im.alt="";pa.appendChild(im)});setTimeout(()=>window.print(),250)};
/* paint small previews into <canvas data-prev="id"> elements */
KQ.paint=(root,tbs)=>KQ.ready.then(()=>{(root||document).querySelectorAll("canvas[data-prev]").forEach(cv=>{const tb=tbs.find(x=>x.id===cv.dataset.prev);if(!tb)return;const n=KQ.draw(tb.label||"?",.22),c2=cv.getContext("2d");c2.clearRect(0,0,cv.width,cv.height);c2.drawImage(n,0,0,cv.width,cv.height)})});
})();
