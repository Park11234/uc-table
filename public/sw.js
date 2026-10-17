// 자동 생성 파일 — tools/build_offline.py
const CACHE="uc-table-af1b8d72ab";
const ASSETS=["./", "./index.html", "./app.js?v=856af5fc2a", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png", "./apple-touch-icon.png", "./privacy.html", "./accessibility.html", "./fonts/uc-table-sans.woff2", "./vendor/html2canvas.min.js", "./vendor/jspdf.umd.min.js"];
self.addEventListener("install",e=>{
  // HTTP 캐시를 건너뛰고 새로 받아야 옛 파일이 새 캐시에 들어가지 않는다
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("uc-table-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET") return;
  const url=new URL(req.url); if(url.origin!==location.origin) return;
  e.respondWith(caches.match(req).then(hit=>hit||caches.match(req,{ignoreSearch:true})).then(hit=>hit||fetch(req).then(res=>{
    if(res.ok){const cp=res.clone(); caches.open(CACHE).then(c=>c.put(req,cp))} return res;
  }).catch(()=>req.mode==="navigate"?caches.match("./index.html"):Response.error())));
});
/* v1.9.0 U-8: 기록 알림(사용자가 켠 경우만). 크롬에 설치한 앱에서 주기적 백그라운드 동기화가 허용되면
   하루에 한 번쯤 깨어나, 앱이 남겨 둔 마지막 증상 기록 날짜(Cache Storage의 ./__uc_status)가 3일 넘게 지났는지 본다.
   서버로 보내는 것은 없다(알림은 이 기기 안에서만 만든다). 보관 이름이 uc-table-로 시작하지 않아 앱을 갱신해도 지워지지 않는다. */
async function ucCheck(){
  try{
    const c=await caches.open("uc-remind-status"); const r=await c.match("./__uc_status"); if(!r) return;
    const st=await r.json(); if(!st||!st.on) return;
    const now=new Date(); const pad=n=>String(n).padStart(2,"0"); const today=now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(now.getDate());
    const last=st.last||""; const days=last?Math.floor((Date.parse(today)-Date.parse(last))/864e5):99;
    if(days<3||st.notified===today) return;
    st.notified=today; await c.put("./__uc_status",new Response(JSON.stringify(st),{headers:{"Content-Type":"application/json"}}));
    if(self.registration.showNotification) await self.registration.showNotification("UC TABLE",{body:last?days+"일째 증상 기록이 없습니다. 오늘 상태를 기록해 주십시오.":"증상 기록을 시작해 주십시오.",icon:"icon-192.png",badge:"icon-192.png",tag:"uc-log",lang:"ko"});
    if(self.navigator&&self.navigator.setAppBadge) try{await self.navigator.setAppBadge(1)}catch(e){}
  }catch(e){}
}
self.addEventListener("periodicsync",e=>{if(e.tag==="uc-log-check") e.waitUntil(ucCheck())});
self.addEventListener("notificationclick",e=>{e.notification.close(); e.waitUntil(self.clients.matchAll({type:"window"}).then(cs=>cs.length?cs[0].focus():self.clients.openWindow("./index.html")))});
