/* tqr.js: table QR cards, shared by /admin (and the same data as /reception > Tables & QR).
   Needs qr.js (window.QRCodeLib) and kz.js. Tables are stored under "kanzel-tables" as [{id,label}].
   Each code opens  <site>/table?t=<label>  so the guest lands on the ordering page for that table. */
(function(){
const KQ=window.KZQR={COUNT:20};
KQ.defaults=()=>Array.from({length:KQ.COUNT},(_,i)=>({id:"t"+(i+1),label:String(i+1)}));
KQ.tables=()=>{const a=KZ.read("kanzel-tables",null);return Array.isArray(a)&&a.length?a:KQ.defaults()};
KQ.save=a=>KZ.write("kanzel-tables",a);
/* the address printed in the codes: what the owner saved, else the site this page is running on (so the codes always open THIS site), else the default */
KQ.base=()=>{const saved=(KZ.read("kanzel-settings",{})||{}).siteUrl;let u=saved;
 if(!u&&/^https:$/.test(location.protocol)&&!/^(localhost|127\.)/.test(location.hostname))u=location.origin;
 return String(u||KZ.settings().siteUrl||"https://kanzel-eg.vercel.app").replace(/\/+$/,"")};
KQ.url=l=>KQ.base()+"/table?t="+encodeURIComponent(l);
/* card fonts: El Messiri (elegant Arabic + clean numbers) from Google Fonts, with the site font as fallback */
(function(){if(document.getElementById("kqFont"))return;const l=document.createElement("link");l.id="kqFont";l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@500;600;700&display=swap";document.head.appendChild(l)})();
let logo=null;KQ.ready=Promise.race([Promise.all([new Promise(r=>{const i=new Image();i.onload=()=>{logo=i;r()};i.onerror=r;i.src="logo.png"}),document.fonts?Promise.all([document.fonts.load('600 60px "El Messiri"',"ترابيزة امسح 1234"),document.fonts.load('500 60px "Readex Pro"',"ترابيزة 1"),document.fonts.load('300 30px "Readex Pro"',"Scan")]).then(()=>document.fonts.ready):0]),new Promise(r=>setTimeout(r,1500))]);
function qrOf(text){const L=window.QRCodeLib;for(let v=2;v<=20;v++){try{const q=new L.QRCode(v,L.ECC.M);q.addData(text);q.make();return q}catch(e){}}return null}
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
/* one printable card: logo, "scan to order", QR, table number. sc = scale (1 = 1000x1400 px).
   Arabic is drawn on its own, without letter-spacing, so the letters stay joined. */
/* Table card. One idea per zone: brand, call to action, the code, the table. Plenty of air, one hairline frame, no decoration.
   Two looks: "dark" (forest, for stands / print shops) and "light" (cream, saves ink on office printers). */
KQ.theme=()=>KZ.S.get("kanzel-qr-theme")==="light"?"light":"dark";
KQ.setTheme=t=>KZ.S.set("kanzel-qr-theme",t==="light"?"light":"dark");
const PAL={dark:{bg:"#10211a",vig:"#0b1611",line:"rgba(211,201,148,.55)",head:"#f4efdd",gold:"#d3c994",tile:"#f4efdd",num:"#d3c994",txt:"rgba(244,239,221,.82)",logo:null},
 light:{bg:"#f7f2e3",vig:"#efe8d2",line:"rgba(120,104,48,.6)",head:"#10211a",gold:"#7a6a2f",tile:"#ffffff",num:"#10211a",txt:"rgba(16,33,26,.78)",logo:"#10211a"}};
KQ.draw=(label,sc,theme)=>{const C=PAL[theme||KQ.theme()],url=KQ.url(label),W=1000,H=1400,c=document.createElement("canvas");c.width=Math.round(W*sc);c.height=Math.round(H*sc);const x=c.getContext("2d");x.scale(sc,sc);
 const AR='"El Messiri","Readex Pro",system-ui,sans-serif',SANS='"Readex Pro",system-ui,sans-serif';
 const sp=v=>{try{x.letterSpacing=v+"px"}catch(e){}};
 const g=x.createRadialGradient(W/2,H*.45,200,W/2,H*.5,H*.8);g.addColorStop(0,C.bg);g.addColorStop(1,C.vig);x.fillStyle=g;x.fillRect(0,0,W,H);
 /* one hairline frame; the logo sits on its top edge */
 const fx=64,fy=118,fw=W-128,fh=H-fy-64;x.strokeStyle=C.line;x.lineWidth=2;const gap=(250+70)/2;x.beginPath();x.moveTo(W/2-gap,fy);x.lineTo(fx,fy);x.lineTo(fx,fy+fh);x.lineTo(fx+fw,fy+fh);x.lineTo(fx+fw,fy);x.lineTo(W/2+gap,fy);x.stroke();
 if(logo){const lw=250,lh=logo.height*lw/logo.width,ly0=fy-lh/2;let img=logo;
  if(C.logo){const o=document.createElement("canvas");o.width=logo.width;o.height=logo.height;const t=o.getContext("2d");t.drawImage(logo,0,0);t.globalCompositeOperation="source-in";t.fillStyle=C.logo;t.fillRect(0,0,o.width,o.height);img=o}
  x.drawImage(img,(W-lw)/2,ly0,lw,lh)}
 x.textAlign="center";x.textBaseline="alphabetic";
 /* call to action */
 x.fillStyle=C.head;x.font='700 88px '+AR;sp(0);x.fillText("امسح واطلب",W/2,352);
 x.fillStyle=C.gold;x.font='400 24px '+SANS;sp(9);x.fillText("SCAN TO ORDER",W/2+4,402);sp(0);
 /* the code on a clean tile (always dark modules on a light tile, so every phone reads it) */
 const T=580,tx=(W-T)/2,ty=448,A=432,qx=(W-A)/2,qy=ty+(T-A)/2;
 x.fillStyle=C.tile;rr(x,tx,ty,T,T,34);x.fill();
 if(theme==="light"||KQ.theme()==="light"){x.strokeStyle=C.line;x.lineWidth=2;rr(x,tx,ty,T,T,34);x.stroke()}
 const q=qrOf(url);if(q){const n=q.getModuleCount(),m=A/n;x.fillStyle="#10211a";
  for(let r=0;r<n;r++)for(let k=0;k<n;k++)if(q.isDark(r,k)){const l=Math.round(qx+k*m),t=Math.round(qy+r*m);x.fillRect(l,t,Math.round(qx+(k+1)*m)-l,Math.round(qy+(r+1)*m)-t)}}
 /* the table: small label, big number */
 const ly=1094;x.fillStyle=C.gold;x.font='400 25px '+SANS;
 x.textAlign="right";sp(8);x.fillText("TABLE",W/2-30,ly);sp(0);x.textAlign="center";x.fillText("·",W/2,ly);x.textAlign="left";x.font='600 34px '+AR;x.fillText("ترابيزة",W/2+30,ly);
 let fs=128;const f=n=>'300 '+n+'px '+SANS;x.font=f(fs);while(x.measureText(label).width>700&&fs>40){fs-=8;x.font=f(fs)}
 x.fillStyle=C.num;x.textAlign="center";x.fillText(label,W/2,ly+22+fs*.74);
 /* help line */
 x.fillStyle=C.txt;x.font='400 26px '+AR;x.fillText("نادي الويتر أو اطلب الحساب من نفس الصفحة",W/2,1292);
 x.font='300 19px '+SANS;sp(1);x.fillText("Call your waiter or ask for the bill on the same page",W/2,1322);sp(0);
 return c};
KQ.download=tb=>{KQ.draw(tb.label,1).toBlob(b=>{if(!b)return;const u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="kanzel-table-"+tb.label.replace(/[^\w؀-ۿ-]+/g,"_")+".png";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000)},"image/png")};
/* A4, 4 cards per page. Optional list = only those tables. */
KQ.print=list=>{let pa=document.getElementById("printArea");if(!pa){pa=document.createElement("div");pa.id="printArea";pa.setAttribute("aria-hidden","true");document.body.appendChild(pa)}
 if(!document.getElementById("kqPrintCss")){const s=document.createElement("style");s.id="kqPrintCss";s.textContent="#printArea{display:none}@media print{@page{size:A4;margin:0}html,body{background:#fff!important}body>*:not(#printArea){display:none!important}#printArea{display:grid!important;grid-template-columns:1fr 1fr;gap:8mm;padding:8mm}#printArea img{width:100%;display:block;break-inside:avoid}}";document.head.appendChild(s)}
 pa.innerHTML="";(list||KQ.tables()).filter(t=>t.label.trim()).forEach(tb=>{const im=new Image();im.src=KQ.draw(tb.label,.6).toDataURL("image/png");im.alt="";pa.appendChild(im)});setTimeout(()=>window.print(),250)};
/* paint small previews into <canvas data-prev="id"> elements */
KQ.paint=(root,tbs)=>KQ.ready.then(()=>{(root||document).querySelectorAll("canvas[data-prev]").forEach(cv=>{const tb=tbs.find(x=>x.id===cv.dataset.prev);if(!tb)return;const n=KQ.draw(tb.label||"?",.22),c2=cv.getContext("2d");c2.clearRect(0,0,cv.width,cv.height);c2.drawImage(n,0,0,cv.width,cv.height)})});
})();
