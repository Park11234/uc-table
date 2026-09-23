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
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:360,height:740}});
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('app.html')); await p.waitForTimeout(300);
for(const [th,fs_] of [["light","md"],["light","xl"],["dark","xl"]]){
const r=await p.evaluate(([th,fs_])=>{S.consent={date:today(),ai:false};S.theme=th;S.fontSize=fs_;SCR={name:"care"};render();
  const W=innerWidth; const bad=[];
  document.querySelectorAll('body *').forEach(el=>{const r=el.getBoundingClientRect(); if(r.width>0&&r.right>W+0.5) bad.push([el.tagName+'.'+(el.className||'').toString().slice(0,20), Math.round(r.left), Math.round(r.right)])});
  return [document.documentElement.scrollWidth-W, bad.slice(0,6)]},[th,fs_]);
console.log(th,fs_,JSON.stringify(r));
}
await b.close()})();
