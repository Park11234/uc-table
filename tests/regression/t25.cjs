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
fs.writeFileSync(T('t25.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t25.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today(),ai:false};render()});
// 홈에서 바로 체크
await p.click('[data-act=ateToggle][data-k="0"]'); await p.waitForTimeout(250);
console.log('ate', await p.evaluate(()=>[JSON.stringify(S.ate), isAte(today(),"아침"), document.querySelector('[data-act=ateToggle][data-k="0"]').getAttribute('aria-pressed')]));
console.log('kcal counted', await p.evaluate(()=>{S.tab="nutri";render();const t=document.querySelector('#main').textContent;return [/0\/\d+kcal/.test(t), t.match(/열량[^가-힣]*\d+\/\d+kcal/)?.[0]||'']}));
// 토글 해제
await p.evaluate(()=>{S.tab="plan";render()}); await p.waitForTimeout(200);
await p.click('[data-act=ateToggle][data-k="0"]'); await p.waitForTimeout(250);
console.log('untoggle', await p.evaluate(()=>[JSON.stringify(S.ate), isAte(today(),"아침")]));
// 상세에서 평가 없이 저장
await p.click('.mrow[data-k="1"]'); await p.waitForTimeout(300);
console.log('detail btns', await p.evaluate(()=>[...document.querySelectorAll('.bottom-bar button')].map(b=>b.textContent.trim())));
await p.click('[data-act=rateSave]'); await p.waitForTimeout(300);
console.log('saved w/o rating', await p.evaluate(()=>[JSON.stringify(S.ate), S.ratings.length, SCR]));
// 평가까지 한 경우
await p.click('.mrow[data-k="2"]'); await p.waitForTimeout(300);
await p.click('[data-act=rateSet][data-j="0"][data-v=good]'); await p.click('[data-act=rateSave]'); await p.waitForTimeout(300);
console.log('with rating', await p.evaluate(()=>[S.ratings.map(r=>[r.slot,r.rating]), isAte(today(),"저녁")]));
// 안 먹었어요 → 먹음 해제
await p.click('.mrow[data-k="1"]'); await p.waitForTimeout(300);
await p.click('[data-act=skipMeal]'); await p.waitForTimeout(300);
console.log('skip clears ate', await p.evaluate(()=>[JSON.stringify(S.skips), isAte(today(),"점심"), SCR]));
await p.screenshot({path:T('shots/n_home_ate.png'),fullPage:true});
console.log('errors',errs);await b.close()})();
