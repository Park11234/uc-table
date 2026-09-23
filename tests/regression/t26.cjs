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
fs.writeFileSync(T('t26.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t26.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today(),ai:false};render()});
// 1. 먹었어요 → 메뉴 스냅샷 저장
await p.click('[data-act=ateToggle][data-k="0"]'); await p.waitForTimeout(250);
console.log('1 snapshot', await p.evaluate(()=>JSON.stringify(S.ateMeals).slice(0,120)));
// 2. 계획이 바뀌어도 먹은 기록은 스냅샷으로 남는가
console.log('2 after replan', await p.evaluate(()=>{S.plan=null;render();const m=ateMenu(today(),"아침");return [m?.t, ateItems(today(),"아침").length]}));
// 3. 스왑하면 먹은 기록·평가 정리
console.log('3 swap clears', await p.evaluate(()=>{S.ratings=[{date:today(),slot:"점심",title:"x",foodId:"white_rice",rating:"good"}];setAte(today(),"점심",true);
  const ok=swapMeal(0,1); return [ok, isAte(today(),"점심"), S.ratings.length, SWAP_CLEARED]}));
// 4. 저장 실패 배너
console.log('4 storage banner', await p.evaluate(()=>{const o=localStorage.setItem.bind(localStorage);localStorage.setItem=()=>{throw new Error('q')};save();
  const out={};for(const t of ["plan","log"]){S.tab=t;SCR=null;render();out[t]=document.querySelector('#main').textContent.includes('저장되지 않고')}
  localStorage.setItem=o;save();render();return out}));
// 5. 부분 식단 배너 + 이어 만들기
console.log('5 partial', await p.evaluate(async()=>{let n=0;
  SAMPLE={json:async()=>{n++; if(n>6) throw {code:"rate_limited",message:"x"}; return {meals:["아침","점심","저녁"].map(sl=>({slot:sl,recipes:["r_juk"],items:[{id:"rice_porridge",g:300},{id:"egg_steamed",g:120}],tip:"t",refs:[1]}))}}};
  aiReady=true;S.consent.ai=true;S.tab="plan";SCR=null; await generateWeek();
  return [S.plan.days.length, S.plan.partial, document.querySelector('#main').textContent.includes('이어 만들기')]}));
console.log('5b continue', await p.evaluate(async()=>{let n=0;SAMPLE={json:async()=>({meals:["아침","점심","저녁"].map(sl=>({slot:sl,recipes:["r_juk"],items:[{id:"rice_porridge",g:300},{id:"egg_steamed",g:120}],tip:"t",refs:[1]}))})};
  await continueWeek(); return [S.plan.days.length, S.plan.partial]}));
// 6. 백업 버전
console.log('6 backup ver', await p.evaluate(()=>{const j=JSON.parse(backupJSON());return [j.app,j.v,!!j.exportedAt]}));
console.log('6b newer rejected', await p.evaluate(()=>{try{normalizeState({...JSON.parse(backupJSON()),v:99});return 'accepted'}catch(e){return e.message}}));
// 7. 지난 날 화면 끼니 토글
await p.evaluate(()=>{S.tab="log";SCR=null;S.logs[addDays(today(),-1)]={date:addDays(today(),-1),...BLANK_LOG(),day:3};render()});
await p.click('[data-act=pastDay]'); await p.waitForTimeout(300);
console.log('7 past screen', await p.evaluate(()=>[SCR.name,SCR.date,[...document.querySelectorAll('[data-act=ateToggleDate]')].length,[...document.querySelectorAll('[data-act=skipToggleDate]')].length]));
await p.click('[data-act=ateToggleDate]'); await p.waitForTimeout(200);
console.log('7b past ate', await p.evaluate(()=>[JSON.stringify(S.ate),JSON.stringify(S.ateMeals).slice(0,80)]));
// 8. 기록 목록 → 지난 날
console.log('8 hist route', await p.evaluate(()=>{closeScr();S.tab="log";render();return [...document.querySelectorAll('.hrow')].map(e=>e.dataset.act).slice(0,2)}));
// 9. 컵 용량
await p.evaluate(()=>{S.tab="nutri";SCR=null;render()});
await p.selectOption('#cupMl','500'); await p.waitForTimeout(200);
console.log('9 cup', await p.evaluate(()=>[S.cupMl, document.querySelector('.cups').children.length, document.querySelector('#main').textContent.includes('500ml')]));
// 10. 평가 있는 끼니 해제 시 확인
await p.evaluate(()=>{S.tab="plan";SCR=null;S.ratings=[{date:today(),slot:"저녁",title:"x",foodId:"white_rice",rating:"good"}];render()});
await p.click('[data-act=ateToggle][data-k="2"]'); await p.waitForTimeout(200);
console.log('10 confirm', await p.evaluate(()=>[document.querySelector('#sheetRoot').textContent.includes('평가도 함께'), S.ratings.length]));
await p.click('[data-act=ateClearGo]'); await p.waitForTimeout(200);
console.log('10b cleared', await p.evaluate(()=>[S.ratings.length, isAte(today(),"저녁")]));
// 11. 검사 설명 시트
console.log('11 checkInfo', await p.evaluate(()=>{const el=document.querySelector('[data-act=checkInfo]');return !!el}));
// 12. 상태 알약 아이콘
console.log('12 pill shape', await p.evaluate(()=>{S.tab="food";S.foodSub="search";render();const e=document.querySelector('.pill.ok');return getComputedStyle(e,'::before').width}));
console.log('errors',errs);await b.close()})();
