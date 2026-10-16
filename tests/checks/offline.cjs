const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
// v1.9.0: 오프라인 단일 파일은 dist/에 있다(public/은 앱 코드를 app.js로 나눈 PWA)
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'dist','uc-table-offline.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const __written=new Set(); const __wfs=fs_.writeFileSync.bind(fs_);
fs_.writeFileSync=(p,...a)=>{ try{__written.add(path.resolve(String(p)))}catch(e){} return __wfs(p,...a) };
// 이 점검이 직접 만든 파일이 아니면 매번 현재 앱으로 새로 만든다(옛 빌드를 검사하는 일 방지)
const WRAP=n=>{const p=T(n); if(!__written.has(path.resolve(p))) __wfs(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
// 공통 안전장치: 어느 페이지에서든 잡히지 않은 오류(pageerror)가 나면 이 점검을 실패로 끝낸다
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[],net=[];
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
p.on('request',r=>{const u=r.url(); if(!u.startsWith('file:')&&!u.startsWith('data:')&&!u.startsWith('blob:')) net.push(u)});
await p.route(/^https?:/, r=>r.abort());   // 모든 네트워크 차단
const f=process.argv[2]||OFFLINE;
await p.goto('file://'+f); await p.waitForTimeout(800);
// v1.9.0 P-1: 그림 PDF 라이브러리는 처음에 실행하지 않고 '그림 PDF 저장' 때 불러온다 → 불러온 뒤 확인
await p.evaluate(()=>typeof loadPdfLibs==='function'?loadPdfLibs().catch(()=>{}):null);
const r=await p.evaluate(()=>({
  foods:typeof FOODS!=='undefined'?FOODS.length:-1,
  ai:(typeof aiReady==='undefined'&&typeof generateWeek==='undefined'&&typeof askFood==='undefined'&&typeof foodAI==='undefined')?'none':'present',
  qa:typeof QA!=='undefined'?QA.length:-1,
  pdf:!!window.html2canvas&&!!window.jspdf,
  title:document.title,
  font:getComputedStyle(document.body).fontFamily.slice(0,40),
  tabs:document.querySelectorAll('.tabbtn,[data-act=tab]').length,
  h:document.body.scrollHeight, w:document.documentElement.scrollWidth
}));
console.log(JSON.stringify(r)); const F=[]; if(r.foods<400||r.ai!=='none'||r.qa<40||!r.pdf) F.push('오프라인 실행 상태');
// 저장 → 새로고침 후 유지
await p.evaluate(()=>{S.consent={date:today()}; S.onboard=true; S.water[today()]=3; save(); });
await p.reload(); await p.waitForTimeout(600);
const ps=await p.evaluate(()=>S.water[today()]); console.log('persist', ps); if(ps!==3) F.push('새로고침 뒤 기록 유지');
// 주요 화면 렌더
for(const t of ['plan','log','food','nutri','me']){
  try{ await p.evaluate(x=>{if(x==='nutri'){S.tab='plan';openScr('nutri');return} S.tab=x;SCR=null;render()},t); await p.waitForTimeout(250);}catch(e){errs.push(t+':'+e.message)}
}
await p.evaluate(()=>{S.tab='food';S.foodSub='search';render()}); await p.waitForTimeout(300);
await p.evaluate(()=>{for(let i=0;i<8;i++){const bs=[...document.querySelectorAll('[data-act="fMore"]')]; if(!bs.length) break; bs.forEach(b=>FMORE.add(b.dataset.v)); refreshFoodRes()}});   // 묶음별 '더 보기'를 모두 펼침(U-7)
const cs=await p.evaluate(()=>document.querySelectorAll('.fcard').length); console.log('cards', cs); if(cs<400) F.push('음식 목록');
await p.screenshot({path:T('offline_home.png')});
console.log('net', net.slice(0,5), 'errors', errs); if(net.length||errs.length) F.push('외부 요청 또는 오류'); if(F.length){ console.log('FAIL '+F.join(' / ')); process.exitCode=1 }
await b.close();})();
