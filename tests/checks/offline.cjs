const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const WRAP=n=>{const p=T(n); if(!fs_.existsSync(p)) fs_.writeFileSync(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[],net=[];
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
p.on('request',r=>{const u=r.url(); if(!u.startsWith('file:')&&!u.startsWith('data:')&&!u.startsWith('blob:')) net.push(u)});
await p.route(/^https?:/, r=>r.abort());   // 모든 네트워크 차단
const f=process.argv[2]||OFFLINE;
await p.goto('file://'+f); await p.waitForTimeout(800);
const r=await p.evaluate(()=>({
  foods:typeof FOODS!=='undefined'?FOODS.length:-1,
  ai:typeof aiReady!=='undefined'?String(aiReady):'?',
  pdf:!!window.html2canvas&&!!window.jspdf,
  title:document.title,
  font:getComputedStyle(document.body).fontFamily.slice(0,40),
  tabs:document.querySelectorAll('.tabbtn,[data-act=tab]').length,
  h:document.body.scrollHeight, w:document.documentElement.scrollWidth
}));
console.log(JSON.stringify(r));
// 저장 → 새로고침 후 유지
await p.evaluate(()=>{S.consent={date:today(),ai:false}; S.onboard=true; S.water[today()]=3; save(); });
await p.reload(); await p.waitForTimeout(600);
console.log('persist', await p.evaluate(()=>S.water[today()]));
// 주요 화면 렌더
for(const t of ['plan','log','food','nutri','me']){
  try{ await p.evaluate(x=>{S.tab=x;SCR=null;render()},t); await p.waitForTimeout(250);}catch(e){errs.push(t+':'+e.message)}
}
await p.evaluate(()=>{S.tab='food';S.foodSub='search';render()}); await p.waitForTimeout(300);
console.log('cards', await p.evaluate(()=>document.querySelectorAll('.fcard').length));
await p.screenshot({path:T('offline_home.png')});
console.log('net', net.slice(0,5), 'errors', errs);
await b.close();})();
