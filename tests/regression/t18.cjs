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
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('t17.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today(),ai:false};for(let i=0;i<3;i++){const d=addDays(today(),-i);S.logs[d]={date:d,day:1,night:0,bloody:0,urg:0,blood:0,well:0,extra:[],pain:0,gas:"없음",fatigue:"없음",temp:"",pulse:"",other:[],memo:""}}render()});
console.log('stage', await p.evaluate(()=>currentStage().stage));
console.log('H stage3', await p.evaluate(()=>{
  const r=checkDay({meals:[{recipes:["r_juk"],items:[{id:"rice_porridge",g:300},{id:"kimchi",g:400}]},{recipes:["r_juk"],items:[{id:"rice_porridge",g:300}]},{recipes:["r_juk"],items:[{id:"rice_porridge",g:300}]}]});
  return [r.probs.filter(x=>/짠|kimchi|김치/.test(x)), r.clean[0].items]}));
console.log('H sample', await p.evaluate(()=>samplePlan().days.flatMap(d=>d.meals.flatMap(m=>m.items.filter(([id])=>FOOD[id].tags.includes("salty")&&id!=="ons"))).slice(0,5)));
// same-button repeat (answered step: extra=multi, always enabled)
await p.evaluate(()=>{SCR=null;openWizard();WZ.step=WSTEPS.findIndex(s=>s.k==="extra");render()});
const nb=await p.locator('[data-act=wzNext]').boundingBox();
await p.mouse.click(nb.x+nb.width/2, nb.y+nb.height/2);
const s1=await p.evaluate(()=>WZ.step);
await p.mouse.click(nb.x+nb.width/2, nb.y+nb.height/2);
console.log('B same-button', s1, await p.evaluate(()=>[WZ.step, WSTEPS[WZ.step].k]));
// tab bar double tap still fine
await p.evaluate(()=>{wizardDirty=()=>false;SCR=null;draft=null;S.tab="plan";render()});
const tb=await p.locator('.tab[data-tab=log]').boundingBox();
await p.mouse.click(tb.x+tb.width/2, tb.y+tb.height/2); await p.mouse.click(tb.x+tb.width/2, tb.y+tb.height/2);
console.log('tab dbl', await p.evaluate(()=>[S.tab, !!document.querySelector('#main').textContent.trim()]));
console.log('errors',errs); await b.close()})();
