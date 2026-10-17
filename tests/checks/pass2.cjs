const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const __written=new Set(); const __wfs=fs_.writeFileSync.bind(fs_);
fs_.writeFileSync=(p,...a)=>{ try{__written.add(path.resolve(String(p)))}catch(e){} return __wfs(p,...a) };
// 이 점검이 직접 만든 파일이 아니면 매번 현재 앱으로 새로 만든다(옛 빌드를 검사하는 일 방지)
const WRAP=n=>{const p=T(n); if(!__written.has(path.resolve(p))) __wfs(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
// 공통 안전장치: 어느 페이지에서든 잡히지 않은 오류(pageerror)가 나면 이 점검을 실패로 끝낸다
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}
const { chromium } = require('playwright'); const fs=require('fs');

// 검증용: 출력한 줄을 모아 두고 끝에서 기대값과 비교한다(v1.5.0)
const __LOG=[]; {const __o=console.log; console.log=(...a)=>{__LOG.push(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ')); __o(...a)}}
const logOf=k=>{const l=__LOG.find(x=>x===k||x.startsWith(k+' ')); return l==null?null:l.slice(k.length).trim()};
const jsonOf=k=>{const v=logOf(k); if(v==null) return null; try{return JSON.parse(v)}catch(e){return v}};
const lineJSON=pre=>{const l=__LOG.find(x=>x.startsWith(pre)); if(l==null) return null; try{return JSON.parse(l)}catch(e){return null}};
const FAILS=[]; const expect=(c,m)=>{let ok=false; try{ok=typeof c==='function'?!!c():!!c}catch(e){m+=' ('+e.message+')'} if(!ok) FAILS.push(m)};
const __done=()=>{ if(FAILS.length){ console.error('FAIL\n'+FAILS.join('\n')); process.exitCode=1 } else console.log('검증 통과') };
const rateOpen=async p=>{const b=await p.$('[data-act=rateOpen]'); if(b){await b.click(); await p.waitForTimeout(80)}}; // v1.8.0 평가 버튼은 '불편했던 음식 고르기'를 눌러야 보임
const out=(k,v)=>console.log(k, typeof v==='string'?v:JSON.stringify(v));
// v1.9.0 P-3: 느린 기기(목록을 한 번 그리는 데 50ms 넘음)에서는 검색 입력을 0.12초 모아 그린다. 결과 목록이 지금 검색어로 다시 그려질 때까지 기다린다
const foodSettled=pg=>pg.waitForFunction(()=>{const el=document.querySelector('#foodRes'); if(!el) return false; const d=foodSearchData(); return el.__h===foodResHTML(d.c,d.q,d.list,d.rows)},null,{timeout:5000,polling:50}).catch(()=>{});
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844}});
const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text())});
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('pass2.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('pass2.html')); await p.waitForTimeout(500);
// S1 신규 사용자: 동의 화면 → 시작
out('S1 welcome', await p.evaluate(()=>[!!document.querySelector('#consentGo'), document.querySelector('#consentGo').disabled]));
await p.click('label.swrow:has(#c_req)'); await p.click('#consentGo'); await p.waitForTimeout(500); await p.click('[data-act=onbSkip]'); await p.waitForTimeout(300);
out('S1 home', await p.evaluate(()=>[S.tab, !!document.querySelector('.mrow'), document.querySelectorAll('.mrow').length]));
// 마법사 전체(실제 클릭)
await p.click('.ridge [data-act=wizard]'); await p.waitForTimeout(300);
let guard=0;
while(guard++<30){
  const st=await p.evaluate(()=>SCR?.name==="wizard"?WSTEPS[WZ.step]:null); if(!st) break;
  // v1.9.0 U-1: 한 쪽에 질문이 여러 개(st.q)라 쪽 안의 질문마다 답한다
  for(const q of (st.q||[st])){
    if(q.type==="step"){await p.click(`[data-act=step][data-k=${q.k}][data-v="1"]`); await p.click(`[data-act=step][data-k=${q.k}][data-v="1"]`)}
    else if(q.type==="one"){await p.locator(`[data-act=set][data-k=${q.k}]`).nth(1).click()}
    else if(q.type==="oneS"){await p.locator(`[data-act=setS][data-k=${q.k}]`).nth(1).click()}
    else if(q.type==="range"){await p.fill('#pain','3')}
    else if(q.type==="vitals"){await p.fill('#temp','36.9'); await p.fill('#pulse','78')}
  }
  if(st.type==="result"){await p.waitForTimeout(500); await p.screenshot({path:T('s1_result.png')}); await p.click('[data-act=saveLog]'); break}
  const dis=await p.evaluate(()=>document.querySelector('[data-act=wzNext]')?.disabled);
  if(dis){out('S1 stuck at',st.k); break}
  await p.click('[data-act=wzNext]'); await p.waitForTimeout(450);
}
out('S1 saved log', await p.evaluate(()=>{const l=S.logs[today()];return l?[l.day,l.night,l.bloody,l.urg,l.blood,l.well,l.pain,l.gas,l.fatigue,l.stool,l.medtaken,l.temp,l.pulse]:null}));
// S2 일주일 사용
await p.click('.tab[data-tab=plan]'); await p.waitForTimeout(200);
await p.click('[data-act=ateToggle][data-k="0"]'); await p.waitForTimeout(450);
await p.click('[data-act=mealMore][data-k="1"]'); await p.click('#sheetRoot [data-act=skipToggleDate][data-slot="점심"]'); await p.waitForTimeout(150);
await p.click('.mrow[data-k="2"]'); await p.waitForTimeout(300);
await rateOpen(p); await p.click('[data-act=rateSet][data-j="0"][data-v=bad]'); await p.click('[data-act=rateSave]'); await p.waitForTimeout(200);
await p.click('[data-act=badSym][data-v=gas]'); await p.click('[data-act=badSave]'); await p.waitForTimeout(250);
out('S2 meals', await p.evaluate(()=>[JSON.stringify(S.ate),JSON.stringify(S.skips),S.ratings.map(r=>[r.slot,r.rating]),S.triggers.map(t=>t.name)]));
await p.evaluate(()=>openScr("nutri")); await p.waitForTimeout(200);
await p.click('.cup'); await p.click('.cup:nth-child(2)'); await p.waitForTimeout(100);
await p.click('[data-act=extraOpen]'); await p.fill('#exQ','바나나'); await p.waitForTimeout(100); await p.click('#exList [data-act=exPick]'); await p.click('[data-act=exSave]'); await p.waitForTimeout(200);
const nut=await p.evaluate(()=>{const tg=targets();const eaten=SLOTS.filter(sl=>isAte(today(),sl));const e=totals(eaten.flatMap(sl=>ateItems(today(),sl)));for(const x of (S.extras[today()]||[])){e.k+=x.kcal||0}
  const shown=(document.querySelector('#main').textContent.match(/(\d+)\/(\d+)kcal/)||[]); return [Math.round(e.k), shown[1], shown[2], tg.k, S.water[today()]]});
out('S2 nutri consistency', nut);
await p.screenshot({path:T('s2_nutri.png'),fullPage:true});
// S3 지난 날
await p.evaluate(()=>closeScr()); await p.waitForTimeout(100);   // v1.8.0 영양 화면은 홈에서 여는 하위 화면
await p.click('.tab[data-tab=plan]'); await p.waitForTimeout(150);
await p.click('.day.past'); await p.waitForTimeout(300);
await p.click('[data-act=ateToggleDate][data-slot="아침"]'); await p.waitForTimeout(150);
await p.click('[data-act=wizardDate]'); await p.waitForTimeout(300);
out('S3 past wizard', await p.evaluate(()=>[SCR.name, draft.date, WZ.step]));
await p.evaluate(()=>{wizardDirty=()=>false}); await p.goBack(); await p.waitForTimeout(300);
out('S3 after back', await p.evaluate(()=>[SCR&&SCR.name, S.tab]));
// S4 음식 탭
await p.evaluate(()=>{SCR=null;S.tab="food";S.foodSub="search";render()}); await p.waitForTimeout(200);
for(const q of ["계란","흰죽","ㄴㄹㅈ","ㅋㅋㅋㅎ"]){await p.fill('#foodQ',q); await p.waitForTimeout(120); await foodSettled(p); out('S4 search '+q, await p.evaluate(()=>document.querySelectorAll('.fcard').length))}
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
await p.click('[data-act=restoreApply][data-v=replace]'); await p.waitForTimeout(300);
out('S5 after restore', await p.evaluate(()=>[Object.keys(S.logs).length, JSON.stringify(S.ate).length>2, 'app' in S, 'v' in S]));
// S6 스트레스: 시트 여닫기, 뒤로가기
out('S6 url before', await p.evaluate(()=>[location.href.slice(-12), history.length, typeof openSheet]));
for(let i=0;i<5;i++){await p.evaluate(()=>openSheet('<h2>t</h2>')); await p.waitForTimeout(80); await p.goBack(); await p.waitForTimeout(150)}
out('S6 sheets', await p.evaluate(()=>[!!document.querySelector('#sheetRoot').firstChild, !!document.querySelector('#main').textContent.trim()]));
console.log('errors',errs);expect(()=>jsonOf('S1 welcome').every(Boolean),'처음 화면'); expect(()=>jsonOf('S1 home')[0]==='plan','홈');
// v1.9.0 U-1: 쪽으로 묶인 마법사를 끝까지 눌러 저장한 값(낮·밤 +2, 혈변 +2, 보기 두 번째, 복통 3, 체온·맥박)
expect(()=>logOf('S1 stuck at')==null&&JSON.stringify(jsonOf('S1 saved log'))===JSON.stringify([2,2,2,1,1,1,3,"약간","약간",1,1,"36.9","78"]),'마법사 전체를 눌러 기록 저장');
expect(()=>{const n=jsonOf('S2 nutri consistency'); return String(n[1]).endsWith(String(n[0]))&&+n[2]===n[3]},'영양 합계와 화면 일치');
expect(()=>jsonOf('S3 after back')[1]==='plan','뒤로 가기'); expect(()=>+logOf('S4 search 계란')>0&&+logOf('S4 search 흰죽')>0&&+logOf('S4 search ㄴㄹㅈ')>0&&+logOf('S4 search ㅋㅋㅋㅎ')===0,'검색');
expect(()=>logOf('S4 detail sheet')==='true','음식 상세'); expect(()=>/백업 불러오기/.test(logOf('S5 restore sheet')),'복원 확인');
__done(); await b.close()})();
