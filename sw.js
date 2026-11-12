/* Kanzel service worker: offline shell. Bump V to force an update. */
const V="kanzel-v10";
const CORE=["./","index.html","table.html","booking.html","events.html","waiter.html","reception.html","admin.html","404.html","menu.js","kz.js","staff.css","manifest.json","logo.png","poster.jpg","bg-1.jpg","bg-2.jpg","bg-3.jpg","icon-192.png","icon-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
 const r=e.request;
 if(r.method!=="GET"||r.headers.has("range"))return;
 const u=new URL(r.url);
 if(u.origin===location.origin){
  /* network first so edits show up, cache as fallback for offline */
  e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res})
   .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==="navigate"?caches.match("index.html"):Response.error()))));
 }else if(/fonts\.(googleapis|gstatic)\.com$/.test(u.host)){
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res})));
 }
});
