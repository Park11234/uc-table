const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const WRAP=n=>{const p=T(n); if(!fs_.existsSync(p)) fs_.writeFileSync(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
// 입력 흐름 점검: 직접 추가 자동 확정, Enter 추가, 지시 글 유지·중복 방지, 알레르기 단어 나누기, 조합 중 비동기 그리기 미루기
const { chromium } = require('playwright'); const fs=require('fs');
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('fin.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('fin.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today(),ai:false};SCR=null;S.tab="log";render();openWizard();WZ.step=WSTEPS.findIndex(s=>s.k==="other");render()});
await p.fill('#otherAdd','두통'); await p.waitForTimeout(700); await p.click('[data-act=wzNext]'); await p.waitForTimeout(150);
const r1=await p.evaluate(()=>draft.other);
await p.evaluate(()=>{WZ.step=WSTEPS.findIndex(s=>s.k==="other");render()});
await p.fill('#otherAdd','어깨 통증'); await p.waitForTimeout(700); await p.click('#main [data-act=tog][data-k=other] >> nth=0'); await p.waitForTimeout(150);
const r2=await p.evaluate(()=>draft.other);
await p.fill('#otherAdd','눈 충혈'); await p.press('#otherAdd','Enter'); await p.waitForTimeout(150);
const r3=await p.evaluate(()=>[draft.other, document.activeElement.id, document.getElementById('otherAdd').value]);
console.log('otherAdd', JSON.stringify({next:r1, chip:r2, enter:r3}));
// 의료진 지시
await p.evaluate(()=>{wizardDirty=()=>false;draft=null;SCR=null;S.tab="me";render();openScr("set-orders")}); await p.waitForTimeout(700);
await p.fill('#orderAdd','우유는 하루 1컵'); await p.locator('input[data-act=order]').first().check(); await p.waitForTimeout(150);
const o1=await p.inputValue('#orderAdd');
await p.press('#orderAdd','Enter'); await p.waitForTimeout(150);
await p.fill('#orderAdd','우유는 하루 1컵'); await p.press('#orderAdd','Enter'); await p.waitForTimeout(150);
console.log('orders', JSON.stringify({kept:o1, other:await p.evaluate(()=>S.orders.other), box:await p.inputValue('#orderAdd')}));
await p.evaluate(()=>closeScr()); await p.evaluate(()=>openScr("set-orders")); console.log('clearedOnLeave', JSON.stringify(await p.inputValue('#orderAdd')));
// 알레르기·싫어하는 음식 나누기
const w=await p.evaluate(()=>{S.profile.allergyOther="키위/망고; 새우 게"; S.profile.dislikes="고등어 가지"; const c=ctx();
  return {words:c.words, kiwi:foodStatus(FOOD.kiwi).level, mackerel:foodStatus(FOOD.mackerel).level, eggplant:foodStatus(FOOD.eggplant).level, menu:ruleCheck({name:"새우볶음밥",ingr:[]}).rules||ruleCheck({name:"새우볶음밥",ingr:[]})}});
console.log('words', JSON.stringify(w).slice(0,400));
// 조합 중에 비동기로 render()가 불려도 입력칸이 교체되지 않고, 조합이 끝나면 그려지는지
await p.evaluate(()=>{S.profile.allergyOther="";S.profile.dislikes="";SCR=null;S.tab="food";S.foodSub="search";S.foodQ="";render()});
const cdp=await p.context().newCDPSession(p); await p.focus('#foodQ'); await p.evaluate(()=>{document.getElementById('foodQ').__m=1});
await cdp.send('Input.imeSetComposition',{text:'바',selectionStart:1,selectionEnd:1}); await p.waitForTimeout(50);
await p.evaluate(()=>{window.__before=document.querySelector('#main section').__r=1; render()}); await p.waitForTimeout(50);
const mid=await p.evaluate(()=>({same:!!document.getElementById('foodQ').__m, wait:IME.wait}));
await cdp.send('Input.imeSetComposition',{text:'바나',selectionStart:2,selectionEnd:2}); await p.waitForTimeout(40);
await cdp.send('Input.insertText',{text:'바나'}); await p.waitForTimeout(120);
const after=await p.evaluate(()=>({value:document.getElementById('foodQ').value, rendered:!document.querySelector('#main section').__r, wait:IME.wait, focus:document.activeElement.id}));
console.log('imeGuard', JSON.stringify({mid,after}));
console.log('errors',errs); await b.close();})();
