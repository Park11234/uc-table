// 자동 생성 파일 — tools/build_offline.py
const CACHE="uc-table-938aee0429";
const ASSETS=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-512-maskable.png","./apple-touch-icon.png"];
self.addEventListener("install",e=>{
  // HTTP 캐시를 건너뛰고 새로 받아야 옛 index.html이 새 캐시에 들어가지 않는다
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("uc-table-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET") return;
  const url=new URL(req.url); if(url.origin!==location.origin) return;
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(res=>{
    if(res.ok){const cp=res.clone(); caches.open(CACHE).then(c=>c.put(req,cp))} return res;
  }).catch(()=>req.mode==="navigate"?caches.match("./index.html"):Response.error())));
});
