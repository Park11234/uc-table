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
fs.writeFileSync(T('t23.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t23.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today(),ai:false};
 for(let i=0;i<8;i++){const d=addDays(today(),-i);S.logs[d]={date:d,...BLANK_LOG(),day:i%3+2,bloody:i%3===0?1:0,stool:i%2?6:4,medtaken:i%4===0?2:1,pain:2}}
 S.extras[addDays(today(),-1)]=[{name:"우유",amt:200,unit:"g",kcal:120,p:6,fi:0,ca:200}];
 render()});
// 지난 날 화면
await p.click('[data-act=pastDay]'); await p.waitForTimeout(400);
console.log('past', await p.evaluate(()=>[SCR.name, SCR.date, document.querySelector('#appbar').textContent.trim(), document.querySelector('#main').textContent.includes('이날 먹은 기록')]));
await p.screenshot({path:T('shots/n_past.png'),fullPage:true});
// 끼니 교체 + 안 먹음
await p.evaluate(()=>{closeScr();S.tab="plan";render()});
const t1=await p.evaluate(()=>S.plan.days[S.selDay].meals[0].title);
await p.click('[data-act=swapMeal][data-k="0"]'); await p.waitForTimeout(300);
console.log('swap', t1, await p.evaluate(()=>S.plan.days[S.selDay].meals[0].title));
await p.click('.mrow[data-k="0"]'); await p.waitForTimeout(300);
await p.click('[data-act=skipMeal]'); await p.waitForTimeout(200);
console.log('skip', await p.evaluate(()=>[JSON.stringify(S.skips), document.querySelector('#main').textContent.includes('안 먹음 표시 지우기')]));
await p.evaluate(()=>{closeScr()}); await p.waitForTimeout(300);
console.log('skip row', await p.evaluate(()=>document.querySelector('.mwrap.skipped')!==null));
// 기록 탭: 차트·상관·삭제
await p.evaluate(()=>{S.tab="log";SCR=null;render()}); await p.waitForTimeout(400);
console.log('chart', await p.evaluate(()=>{const c=document.querySelector('#logChart');if(!c)return 'none';const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let nz=0;for(let i=0;i<d.length;i+=400)if(d[i]!==255)nz++;return nz>10?'drawn':'blank'}));
await p.screenshot({path:T('shots/n_log2.png'),fullPage:true});
await p.click('[data-act=delLog]'); await p.waitForTimeout(150);
await p.click('[data-act=delLogGo]'); await p.waitForTimeout(200);
console.log('delLog', await p.evaluate(()=>Object.keys(S.logs).length));
// 먹은 음식 추가: 최근/그릇 단위/직접 기록
await p.evaluate(()=>{S.tab="nutri";render()}); await p.waitForTimeout(200);
await p.click('[data-act=extraOpen]'); await p.waitForTimeout(200);
console.log('recent chips', await p.evaluate(()=>[...document.querySelectorAll('#sheetRoot [data-act=exPick]')].map(e=>e.textContent.trim()).slice(0,5)));
await p.fill('#exQ','계란찜'); await p.waitForTimeout(150);
console.log('search in sheet', await p.evaluate(()=>document.querySelector('#exList').textContent.slice(0,40)));
await p.click('#exList [data-act=exPick]'); await p.waitForTimeout(200);
console.log('serving chips', await p.evaluate(()=>[...document.querySelectorAll('[data-act=exAmt]')].map(e=>e.textContent.trim())));
await p.click('[data-act=exAmt]'); console.log('amt', await p.evaluate(()=>document.querySelector('#exG').value));
await p.click('[data-act=exSave]'); await p.waitForTimeout(200);
console.log('extras', await p.evaluate(()=>JSON.stringify(S.extras[today()])));
await p.click('[data-act=extraOpen]'); await p.fill('#exQ','집밥특제요리');await p.waitForTimeout(150);
console.log('custom btn', await p.evaluate(()=>!!document.querySelector('[data-act=exCustom]')));
await p.click('[data-act=exCustom]'); await p.waitForTimeout(200);
console.log('custom saved', await p.evaluate(()=>S.extras[today()].map(x=>x.name)));
// 물 취소
await p.click('.cup'); await p.waitForTimeout(150); await p.click('[data-act=cupUndo]'); await p.waitForTimeout(150);
console.log('water', await p.evaluate(()=>S.water[today()]));
// 음식 탭 필터
await p.evaluate(()=>{S.tab="food";S.foodSub="search";render()}); await p.waitForTimeout(200);
await p.click('[data-act=lvFilter][data-v=ok]'); await p.waitForTimeout(200);
console.log('filter', await p.evaluate(()=>[S.foodLv, document.querySelectorAll('.fcard').length]));
console.log('errors',errs);await b.close()})();
