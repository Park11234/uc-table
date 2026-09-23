const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const WRAP=n=>{const p=T(n); if(!fs_.existsSync(p)) fs_.writeFileSync(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:360,height:780}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('t8.html')); await p.evaluate(()=>{S.consent={date:today(),ai:false};render()});
await p.waitForTimeout(400);
for(const f of ['md','xl']){
 await p.evaluate(f=>{S.fontSize=f;render()},f);
 for(const t of ['plan','log','food','nutri','me']){await p.click(`.tab[data-tab=${t}]`);await p.waitForTimeout(80);
   const w=await p.evaluate(()=>{const W=document.documentElement.clientWidth;const bad=[...document.querySelectorAll('#main *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>W+1&&!e.closest('.days,.cats,.tbl-wrap')}).slice(0,3).map(e=>e.className+':'+Math.round(e.getBoundingClientRect().right));return [document.documentElement.scrollWidth,W,bad]});
   console.log(f,t,JSON.stringify(w));}
}
await p.screenshot({path:T('t8_me_xl.png'),fullPage:true});
console.log(errs);await b.close()})();
