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
fs.writeFileSync(T('t15.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t15.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today(),ai:false};render()});
// wizard: urg step next disabled until answered
await p.evaluate(()=>{openWizard();WZ.step=WSTEPS.findIndex(s=>s.k==="urg");render()});
console.log('nextDisabled',await p.evaluate(()=>[document.querySelector('[data-act=wzNext]').disabled,[...document.querySelectorAll('[data-act=set]')].map(b=>b.getAttribute('aria-pressed'))]));
await p.click('[data-act=set][data-k=urg][data-v="0"]');
console.log('afterPick',await p.evaluate(()=>[document.querySelector('[data-act=wzNext]').disabled,WZ.step]));
// result banner order
await p.evaluate(()=>{draft.temp="37.8";WZ.step=WSTEPS.length-1;render()});
console.log('order',await p.evaluate(()=>{const m=document.querySelector('#main');const b=m.querySelector('.banner.crit'),c=m.querySelector('.card.result');return b&&c&&(b.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING)}));
await p.screenshot({path:T('w_res.png')});
// existing log: all answered
await p.evaluate(()=>{S.logs[today()]={...BLANK_LOG(),day:2};openWizard();WZ.step=WSTEPS.findIndex(s=>s.k==="urg");render()});
console.log('existing',await p.evaluate(()=>document.querySelector('[data-act=wzNext]').disabled));
// taste only -> dislikes
await p.evaluate(()=>{wizardDirty=()=>false;SCR=null;S.logs={};S.plan=null;S.tab="plan";render()});
await p.click('.mrow[data-k="0"]'); await p.waitForTimeout(300);
await p.click('[data-act=rateSet][data-j="0"][data-v=bad]'); await p.click('[data-act=rateSave]'); await p.waitForTimeout(200);
await p.click('[data-act=badSym][data-v=taste]');
console.log('tasteUI',await p.evaluate(()=>[BAD.list[0].dec,!!document.querySelector('[data-act=badDec]'),document.querySelector('#sheetRoot').textContent.includes('싫어하는 음식')]));
await p.screenshot({path:T('w_taste.png')});
await p.click('[data-act=badSave]'); await p.waitForTimeout(200);
console.log('result',await p.evaluate(()=>[S.profile.dislikes,S.triggers.length,planFoods().some(f=>f.id==="rice_porridge")]));
console.log(errs);await b.close()})();
