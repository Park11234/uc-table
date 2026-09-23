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
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('t27.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t27.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today(),ai:false};render()});
await p.click('[data-act=ateToggle][data-k="0"]'); await p.waitForTimeout(120);
await p.click('[data-act=ateToggle][data-k="0"]'); await p.waitForTimeout(150);
console.log('toasts', await p.evaluate(()=>[...document.querySelectorAll('.toast')].map(t=>t.textContent)));
await p.screenshot({path:T('shots/n_toast.png')});
// 연속 3번
for(let i=0;i<3;i++){await p.click('[data-act=ateToggle][data-k="1"]'); await p.waitForTimeout(80)}
console.log('toasts2', await p.evaluate(()=>document.querySelectorAll('.toast').length));
console.log('errors',errs);await b.close()})();
