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
const out=(k,v)=>console.log(k, typeof v==='string'?v:JSON.stringify(v));
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844}});
const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text())});
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('app.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('app.html')); await p.waitForTimeout(500);
// S1 신규 사용자: 동의 화면 → 시작
out('S1 welcome', await p.evaluate(()=>[!!document.querySelector('#consentGo'), document.querySelector('#consentGo').disabled]));
await p.click('label.swrow:has(#c_req)'); await p.click('#consentGo'); await p.waitForTimeout(300);
out('S1 home', await p.evaluate(()=>[S.tab, !!document.querySelector('.mrow'), document.querySelectorAll('.mrow').length]));
// 마법사 전체(실제 클릭)
await p.click('.tile[data-act=wizard]'); await p.waitForTimeout(300);
let guard=0;
while(guard++<30){
  const st=await p.evaluate(()=>SCR?.name==="wizard"?WSTEPS[WZ.step]:null); if(!st) break;
  if(st.type==="step"){await p.click(`[data-act=step][data-k=${st.k}][data-v="1"]`); await p.click(`[data-act=step][data-k=${st.k}][data-v="1"]`)}
  else if(st.type==="one"){await p.locator(`[data-act=set][data-k=${st.k}]`).nth(1).click()}
  else if(st.type==="oneS"){await p.locator(`[data-act=setS][data-k=${st.k}]`).nth(1).click()}
  else if(st.type==="range"){await p.fill('#pain','3')}
  else if(st.type==="vitals"){await p.fill('#temp','36.9'); await p.fill('#pulse','78')}
  if(st.type==="result"){await p.waitForTimeout(500); await p.screenshot({path:T('s1_result.png')}); await p.click('[data-act=saveLog]'); break}
  const dis=await p.evaluate(()=>document.querySelector('[data-act=wzNext]')?.disabled);
  if(dis){out('S1 stuck at',st.k); break}
  await p.click('[data-act=wzNext]'); await p.waitForTimeout(450);
}
out('S1 saved log', await p.evaluate(()=>{const l=S.logs[today()];return l?[l.day,l.night,l.bloody,l.urg,l.blood,l.well,l.pain,l.gas,l.fatigue,l.stool,l.medtaken,l.temp,l.pulse]:null}));
// S2 일주일 사용
await p.click('.tab[data-tab=plan]'); await p.waitForTimeout(200);
await p.click('[data-act=ateToggle][data-k="0"]'); await p.waitForTimeout(450);
await p.click('[data-act=skipToggleDate][data-slot="점심"]'); await p.waitForTimeout(150);
await p.click('.mrow[data-k="2"]'); await p.waitForTimeout(300);
await p.click('[data-act=rateSet][data-j="0"][data-v=bad]'); await p.click('[data-act=rateSave]'); await p.waitForTimeout(200);
await p.click('[data-act=badSym][data-v=gas]'); await p.click('[data-act=badSave]'); await p.waitForTimeout(250);
out('S2 meals', await p.evaluate(()=>[JSON.stringify(S.ate),JSON.stringify(S.skips),S.ratings.map(r=>[r.slot,r.rating]),S.triggers.map(t=>t.name)]));
await p.click('.tab[data-tab=nutri]'); await p.waitForTimeout(200);
await p.click('.cup'); await p.click('.cup:nth-child(2)'); await p.waitForTimeout(100);
await p.click('[data-act=extraOpen]'); await p.fill('#exQ','바나나'); await p.waitForTimeout(100); await p.click('#exList [data-act=exPick]'); await p.click('[data-act=exSave]'); await p.waitForTimeout(200);
const nut=await p.evaluate(()=>{const tg=targets();const eaten=SLOTS.filter(sl=>isAte(today(),sl));const e=totals(eaten.flatMap(sl=>ateItems(today(),sl)));for(const x of (S.extras[today()]||[])){e.k+=x.kcal||0}
  const shown=(document.querySelector('#main').textContent.match(/(\d+)\/(\d+)kcal/)||[]); return [Math.round(e.k), shown[1], shown[2], tg.k, S.water[today()]]});
out('S2 nutri consistency', nut);
await p.screenshot({path:T('s2_nutri.png'),fullPage:true});
// S3 지난 날
await p.click('.tab[data-tab=plan]'); await p.waitForTimeout(150);
await p.click('.day.past'); await p.waitForTimeout(300);
await p.click('[data-act=ateToggleDate][data-slot="아침"]'); await p.waitForTimeout(150);
await p.click('[data-act=wizardDate]'); await p.waitForTimeout(300);
out('S3 past wizard', await p.evaluate(()=>[SCR.name, draft.date, WZ.step]));
await p.evaluate(()=>{wizardDirty=()=>false}); await p.goBack(); await p.waitForTimeout(300);
out('S3 after back', await p.evaluate(()=>[SCR&&SCR.name, S.tab]));
// S4 음식 탭
await p.evaluate(()=>{SCR=null;S.tab="food";S.foodSub="search";render()}); await p.waitForTimeout(200);
for(const q of ["계란","흰죽","ㄴㄹㅈ","ㅋㅋㅋㅎ"]){await p.fill('#foodQ',q); await p.waitForTimeout(120); out('S4 search '+q, await p.evaluate(()=>document.querySelectorAll('.fcard').length))}
await p.fill('#foodQ',''); await p.waitForTimeout(100);
await p.click('.fcard'); await p.waitForTimeout(200); out('S4 detail sheet', await p.evaluate(()=>!!document.querySelector('#sheetRoot .sheet')));
await p.keyboard.press('Escape'); await p.evaluate(()=>closeSheet());
await p.click('[data-act=foodSub][data-v=menu]'); await p.waitForTimeout(200);
out('S4 menu tab', await p.evaluate(()=>document.querySelector('#main').textContent.slice(0,80)));
await p.click('[data-act=foodSub][data-v=label]'); await p.waitForTimeout(200);
out('S4 label tab', await p.evaluate(()=>document.querySelector('#main').textContent.slice(0,80)));
// S5 설정: 백업→복원 왕복
await p.evaluate(()=>{S.tab="me";SCR=null;render()});
const backup=await p.evaluate(()=>backupJSON());
await p.evaluate((b)=>{restoreFromText(b)},backup); await p.waitForTimeout(200);
out('S5 restore sheet', await p.evaluate(()=>document.querySelector('#sheetRoot').textContent.slice(0,40)));
await p.click('[data-act=restoreApply]'); await p.waitForTimeout(300);
out('S5 after restore', await p.evaluate(()=>[Object.keys(S.logs).length, JSON.stringify(S.ate).length>2, 'app' in S, 'v' in S]));
// S6 스트레스: 시트 여닫기, 뒤로가기
out('S6 url before', await p.evaluate(()=>[location.href.slice(-12), history.length, typeof openSheet]));
for(let i=0;i<5;i++){await p.evaluate(()=>openSheet('<h2>t</h2>')); await p.waitForTimeout(80); await p.goBack(); await p.waitForTimeout(150)}
out('S6 sheets', await p.evaluate(()=>[!!document.querySelector('#sheetRoot').firstChild, !!document.querySelector('#main').textContent.trim()]));
console.log('errors',errs);await b.close()})();
