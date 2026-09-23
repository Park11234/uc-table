const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const WRAP=n=>{const p=T(n); if(!fs_.existsSync(p)) fs_.writeFileSync(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
const WZSTEPS_BACK=30;
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('t8.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today(),ai:false};render()});
// sample with allergies
const r1=await p.evaluate(()=>{S.profile.allergies=['egg','fish','shrimp'];S.orders.checked=['nodairy'];render();
  const items=S.plan.days.flatMap(d=>d.meals.flatMap(m=>m.items.map(x=>x[0])));
  const bad=items.filter(id=>{const l=foodStatus(FOOD[id]).level;return l==='avoid'||l==='later'});
  return {bad:[...new Set(bad)],empties:S.plan.days.flatMap(d=>d.meals.filter(m=>m.empty).map(m=>d.date+m.slot)).length,titles:S.plan.days[0].meals.map(m=>m.title+'/'+m.side)}});
console.log('sample allergy',JSON.stringify(r1));
// extreme: everything excluded
const r1b=await p.evaluate(()=>{S.orders.checked=['liquid','nodairy'];S.profile.allergies=['egg','fish','shrimp','soy','wheat','chicken','beef','pork'];render();return S.plan.days[0].meals.map(m=>m.title+(m.empty?'(empty)':''))});
console.log('extreme',JSON.stringify(r1b));
await p.screenshot({path:T('t11_extreme.png')});
// saved plan with now-disallowed foods
const r2=await p.evaluate(()=>{S.orders.checked=[];S.profile.allergies=[];S.plan={sample:false,start:today(),stage:1,days:[0,1,2].map(i=>({date:addDays(today(),i),meals:[{slot:"아침",title:"달걀죽",items:[["rice_porridge",300],["egg_steamed",100]],tip:"x",refs:[1]}]}))};S.profile.allergies=['egg'];render();return document.querySelector('#main').textContent.includes('지금 조건에 맞지 않는 식품이 있어요')});
console.log('issue banner',r2);
await p.screenshot({path:T('t11_issue.png'),fullPage:true});
// expired plan
const r3=await p.evaluate(()=>{S.profile.allergies=[];S.plan={sample:false,start:addDays(today(),-10),stage:1,days:[0,1].map(i=>({date:addDays(today(),-10+i),meals:[]}))};render();return [S.plan.sample,S.plan.start===today(),document.querySelector('#main').textContent.includes('지난 식단 기간이 끝나')]});
console.log('expired',JSON.stringify(r3));
// future meal
await p.evaluate(()=>{S.selDay=2;render()}); await p.click('.mrow[data-k="0"]'); await p.waitForTimeout(150);
console.log('future meal', await p.evaluate(()=>[!!document.querySelector('[data-act=rateSet]'),document.querySelector('#main').textContent.includes('그날이 되면')]));
await p.click('[data-act=back]'); await p.waitForTimeout(150);
// extras sheet
await p.evaluate(()=>{S.selDay=0;render()}); await p.click('.mrow[data-k="0"]'); await p.waitForTimeout(150);
await p.click('[data-act=extraOpen]'); await p.fill('#exQ','누룽'); await p.waitForTimeout(100);
console.log('ex list', await p.evaluate(()=>document.querySelector('#exList').textContent.trim().slice(0,40)));
await p.click('#exList [data-act=exPick]'); await p.fill('#exG','40'); await p.click('[data-act=exSave]'); await p.waitForTimeout(150);
console.log('extras', JSON.stringify(await p.evaluate(()=>S.extras[today()])));
await p.click('[data-act=back]');
// copy yesterday
await p.evaluate(()=>{S.logs[addDays(today(),-1)]={day:2,night:0,bloody:0,urg:0,blood:0,well:0,extra:[],pain:1,gas:"없음",fatigue:"약간",temp:"37",pulse:"70",other:[],memo:"어제"};delete S.logs[today()];S.tab="log";SCR=null;render()});
await p.click('[data-act=copyYesterday]'); await p.waitForTimeout(200);
console.log('copy', await p.evaluate(()=>[WZ.step,draft.memo,draft.temp,draft.fatigue,document.querySelector('#main').textContent.includes('어제 기록을 가져왔어요')]));
// 뒤로 가기: 마법사 단계 수가 늘어도 깨지지 않게 '첫 단계'까지 눌러 확인한다
for(let i=0;i<WZSTEPS_BACK;i++){ const b=await p.$('[data-act=wzPrev]'); if(!b) break; await b.click(); await p.waitForTimeout(60) } await p.waitForTimeout(150);
console.log('back to first', await p.evaluate(()=>WZ.step===0));
const goStep=async k=>{await p.evaluate(k=>{WZ.step=WSTEPS.findIndex(s=>s.k===k);render()},k);await p.waitForTimeout(150)};
await goStep('day');
console.log('at step', await p.evaluate(()=>[WZ.step,WSTEPS[WZ.step].k]));
await p.fill('#stepIn','12'); 
console.log('stepIn', await p.evaluate(()=>draft.day));
await goStep('bloody'); await p.fill('#stepIn','30');
console.log('bloody clamp', await p.evaluate(()=>draft.bloody));
await p.screenshot({path:T('t11_step.png')});
await p.evaluate(()=>{WZ.step=WSTEPS.length-1;render()}); await p.click('[data-act=saveLog]'); await p.waitForTimeout(200);
console.log('saved', JSON.stringify(await p.evaluate(()=>S.logs[today()])));
// term sheet
await p.evaluate(()=>{S.tab="food";render()}); await p.click('.fcard'); await p.waitForTimeout(100); await p.click('.sheet [data-act=term]'); await p.waitForTimeout(100);
console.log('term', (await p.textContent('#sheetRoot')).slice(0,30));
await p.keyboard.press('Escape'); await p.waitForTimeout(100);
// menu judge w/o AI
await p.click('[data-act=foodSub][data-v=menu]'); await p.fill('#mjText','백김치\n김치찌개\n계란말이'); await p.click('[data-act=mjText]'); await p.fill('#mj_g_2','달걀, 소금'); await p.click('[data-act=mjJudge]'); await p.waitForTimeout(200);
console.log('mj noAI', JSON.stringify(await p.evaluate(()=>MJ.results.map(r=>[r.name,r.level,r.rules]))));
await p.click('[data-act=mjOk][data-i="1"]'); await p.click('[data-act=mjOkSet]'); await p.waitForTimeout(200);
console.log('after ok', JSON.stringify(await p.evaluate(()=>[S.okMenus,MJ.results[1].level,MJ.results[1].rules])));
await p.click('[data-act=mjEat][data-i="0"]');
console.log('mjEat', JSON.stringify(await p.evaluate(()=>S.extras[today()].map(e=>e.name))));
await p.screenshot({path:T('t11_mj.png'),fullPage:true});
// backup copy fallback & restore
await p.evaluate(()=>{S.tab="me";SCR={name:"set-data"};render()});
await p.click('[data-act=backupCopy]'); await p.waitForTimeout(200);
const txt=await p.evaluate(()=>document.querySelector('#bkText')?.value||('clip:'+S.lastBackup));
console.log('copy fallback', txt.slice(0,20));
if(txt.startsWith('{')) await p.click('[data-act=bkMark]');
const saved=await p.evaluate(()=>JSON.stringify(S));
await p.click('[data-act=restorePaste]'); await p.fill('#rsText','{"bad":1}'); await p.click('[data-act=restoreText]'); await p.waitForTimeout(100);
console.log('bad restore', await p.evaluate(()=>msgs.slice(-1)[0]));
const mod=JSON.parse(saved); mod.logs["2026-01-01"]={day:"3",night:null,bloody:"x"}; mod.plan={days:"broken"}; mod.profile.allergies="egg"; mod.weights=[{date:"2026-01-01",kg:"55"}];
await p.click('[data-act=restorePaste]'); await p.fill('#rsText',JSON.stringify(mod)); await p.click('[data-act=restoreText]'); await p.waitForTimeout(100);
console.log('confirm', (await p.textContent('#sheetRoot')).slice(0,60));
await p.click('[data-act=restoreApply]'); await p.waitForTimeout(200);
console.log('restored', JSON.stringify(await p.evaluate(()=>[S.logs["2026-01-01"],S.plan.sample,S.profile.allergies,S.weights.length])));
fs.writeFileSync(T('t.json'),JSON.stringify(mod));
await p.evaluate(()=>{S.tab="me";SCR={name:"set-data"};render()});
await p.setInputFiles('#restore',T('t.json')); await p.waitForTimeout(200);
console.log('file restore sheet', (await p.textContent('#sheetRoot')).slice(0,20));
await p.click('[data-act=closeSheet]');
// reset
await p.click('[data-act=reset]'); await p.click('[data-act=resetDo]'); await p.waitForTimeout(200);
console.log('reset', await p.evaluate(()=>[Object.keys(S.logs).length,!!S.consent]));
// welcome for fresh
await p.evaluate(()=>{S.consent=null;render()});
console.log('welcome', await p.evaluate(()=>[document.body.className,document.querySelector('#consentGo').disabled]));
console.log('errors',errs); await b.close()})();
