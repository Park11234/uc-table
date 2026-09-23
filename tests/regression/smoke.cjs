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
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('t8.html'));await p.waitForTimeout(500);
await p.screenshot({path:T('sm_welcome.png')});
await p.click('label.swrow:has(#c_req)'); await p.click('#consentGo'); await p.waitForTimeout(300);
for(const t of ['plan','log','food','nutri','me']){await p.click(`.tab[data-tab=${t}]`);await p.waitForTimeout(350);await p.screenshot({path:T(`sm_${t}.png`),fullPage:true});}
for(const v of ['set-data','set-privacy','set-stage','set-about']){await p.click('.tab[data-tab=me]');await p.click(`[data-act=openScr][data-v=${v}]`);await p.waitForTimeout(350);await p.screenshot({path:T(`sm_${v}.png`),fullPage:true});await p.click('[data-act=back]');await p.waitForTimeout(100)}
console.log(errs);await b.close()})();
