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
const { chromium } = require('playwright');

// 검증용: 출력한 줄을 모아 두고 끝에서 기대값과 비교한다(v1.5.0)
const __LOG=[]; {const __o=console.log; console.log=(...a)=>{__LOG.push(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ')); __o(...a)}}
const logOf=k=>{const l=__LOG.find(x=>x===k||x.startsWith(k+' ')); return l==null?null:l.slice(k.length).trim()};
const jsonOf=k=>{const v=logOf(k); if(v==null) return null; try{return JSON.parse(v)}catch(e){return v}};
const lineJSON=pre=>{const l=__LOG.find(x=>x.startsWith(pre)); if(l==null) return null; try{return JSON.parse(l)}catch(e){return null}};
const FAILS=[]; const expect=(c,m)=>{let ok=false; try{ok=typeof c==='function'?!!c():!!c}catch(e){m+=' ('+e.message+')'} if(!ok) FAILS.push(m)};
const __done=()=>{ if(FAILS.length){ console.error('FAIL\n'+FAILS.join('\n')); process.exitCode=1 } else console.log('검증 통과') };
const rateOpen=async p=>{const b=await p.$('[data-act=rateOpen]'); if(b){await b.click(); await p.waitForTimeout(80)}}; // v1.8.0 평가 버튼은 '불편했던 음식 고르기'를 눌러야 보임
// v1.9.0 P-3: 느린 기기(목록을 한 번 그리는 데 50ms 넘음)에서는 검색 입력을 0.12초 모아 그린다. 결과 목록이 지금 검색어로 다시 그려질 때까지 기다린다
const foodSettled=pg=>pg.waitForFunction(()=>{const el=document.querySelector('#foodRes'); if(!el) return false; const d=foodSearchData(); return el.__h===foodResHTML(d.c,d.q,d.list,d.rows)},null,{timeout:5000,polling:50}).catch(()=>{});
const fs = require('fs');
const body = fs.readFileSync(APP,'utf8');
const page_html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style>
<script>
// v1.7.0: AI 기능이 없어져 파일 저장(downloads)만 흉내 낸다
window.claude={use:async n=>{
 if(n==="downloads") return {save:async({filename,data})=>{window.__saved={filename,size:data.size||data.length}; const buf=await data.arrayBuffer(); window.__pdf=Array.from(new Uint8Array(buf));return {status:"saved"}}};
 return null}};
</script></head><body>${body}</body></html>`;
fs.writeFileSync(T('uc_test.html'), page_html);
(async()=>{const b = await chromium.launch();
const p = await b.newPage({viewport:{width:390,height:844}});
await p.route('https://cdnjs.cloudflare.com/**', r=>{const u=r.request().url(); const f=u.includes('html2canvas')?LIB_H2C:LIB_JSPDF; r.fulfill({path:f,contentType:'application/javascript'})});
await p.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'',contentType:'text/css'}));
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+WRAP('uc_test.html')); await p.waitForTimeout(1500);
console.log('noAI', await p.evaluate(()=>[!!document.querySelector('#c_ai'),typeof generateWeek,typeof askFood,typeof foodAI]));
await p.click('label.swrow:has(#c_req)'); await p.click('#consentGo'); await p.waitForTimeout(500); await p.click('[data-act=onbSkip]'); await p.waitForTimeout(200);
await p.screenshot({path:T('s1.png'),fullPage:false});
await p.waitForTimeout(300);
const plan = await p.evaluate(()=>({n:S.plan.days.length, sample:!!S.plan.sample, gen:!!document.querySelector('[data-act=gen]'), m0:S.plan.days[0].meals[0].items, rec:S.plan.days[0].meals.map(m=>m.rec), refs:S.plan.days[0].meals[0].refs}));
console.log(JSON.stringify(plan));
await p.click('.mrow[data-k="0"]'); await p.waitForTimeout(100);
console.log('mealScr', await p.evaluate(()=>JSON.stringify({scr:SCR, title:document.querySelector('#appbar').textContent.trim().slice(0,30), tabsHidden:getComputedStyle(document.querySelector('.tabs')).transform})));
await p.waitForTimeout(400); await p.screenshot({path:T('sh_meal.png')});
console.log('ratedId', await p.evaluate(()=>{const it=curDay().meals[0].items[1]; return Array.isArray(it)?it[0]:it.id}));
await rateOpen(p); await p.click('[data-act=rateSet][data-j="1"][data-v=bad]'); await p.click('[data-act=rateSave]'); await p.waitForTimeout(150); console.log('trig sheet', (await p.textContent('#sheetRoot')).slice(0,40)); await p.click('[data-act=badSym][data-v=diarrhea]'); await p.click('[data-act=badSave]'); await p.waitForTimeout(200);
console.log('triggers', await p.evaluate(()=>JSON.stringify(S.triggers)), 'memo?', await p.evaluate(()=>!!document.querySelector('textarea#rateNote, #lbNote')));
// wizard
await p.click('.ridge [data-act=wizard]'); await p.waitForTimeout(100);
await p.waitForTimeout(400); await p.screenshot({path:T('sh_wz1.png')});
// v1.9.0 U-1: 질문을 쪽으로 묶음 — ① 배변(낮·밤·혈변) ② 급박감·피·몸 상태 ③ 복통·가스·피로·변 모양 ④ 약·그 밖의 증상 → 요약
for(let i=0;i<7;i++) await p.click('[data-act=step][data-k=day][data-v="1"]');
for(let i=0;i<3;i++) await p.click('[data-act=step][data-k=bloody][data-v="1"]');   // 같은 쪽(밤은 0회 그대로)
await p.click('[data-act=wzNext]'); // 급박감·피·몸 상태
await p.waitForTimeout(400); await p.screenshot({path:T('sh_wz2.png')});
await p.click('[data-act=set][data-k=urg][data-v="1"]'); await p.waitForTimeout(350);
console.log('noAutoAdv', await p.evaluate(()=>[WZ.step,wzStepOf("urg")]));
await p.click('[data-act=set][data-k=blood][data-v="2"]');
await p.click('[data-act=set][data-k=well][data-v="1"]'); await p.click('[data-act=wzNext]'); // 복통·가스·피로·변 모양
await p.fill('#pain','6');
await p.click('[data-act=setS][data-k=gas][data-v="약간"]');
await p.click('[data-act=setS][data-k=fatigue][data-v="심함"]');
await p.click('[data-act=set][data-k=stool][data-v="6"]'); await p.click('[data-act=wzNext]'); // 약·그 밖의 증상
await p.click('[data-act=set][data-k=medtaken][data-v="2"]');
await p.click('[data-act=tog][data-k=extra]');
await p.fill('#otherAdd','두통'); await p.click('[data-act=otherAdd]'); await p.fill('#memo','테스트 메모');
await p.fill('#temp','38.1'); await p.click('[data-act=wzNext]'); // 요약
await p.waitForTimeout(400); await p.screenshot({path:T('sh_wz3.png')});
await p.click('[data-act=saveLog]'); await p.waitForTimeout(100);
console.log('log', await p.evaluate(()=>JSON.stringify({l:S.logs[today()],tab:S.tab,scr:SCR})));
await p.click('.tab[data-tab=plan]');
console.log('alerts', (await p.textContent('#main')).match(/진료를[^<]{0,40}/)?.[0]);
await p.click('.tab[data-tab=log]'); await p.click('[data-act=openScr][data-v=pdf]');
await p.click('[data-act=pdf]'); await p.waitForFunction(()=>window.__saved,null,{timeout:60000}).catch(()=>{});   // 여러 점검을 동시에 돌리면 PDF 만들기가 6초를 넘을 수 있어 저장될 때까지 기다림
console.log('saved', await p.evaluate(()=>JSON.stringify(window.__saved))); const arr=await p.evaluate(()=>window.__pdf); if(arr) fs.writeFileSync(T('report.pdf'), Buffer.from(arr));
await p.click('[data-act=back]');
await p.click('.tab[data-tab=food]'); await p.click('[data-act=foodSub][data-v=search]').catch(()=>{}); await p.fill('#foodQ','커피'); await p.waitForTimeout(200); await foodSettled(p);
console.log('foodQA', await p.evaluate(()=>JSON.stringify([...document.querySelectorAll('#foodRes [data-act=qaGo]')].map(b=>b.dataset.v))));
if(await p.locator('#foodRes [data-act=qaGo]').count()){ await p.click('#foodRes [data-act=qaGo]'); await p.waitForTimeout(300) }   // 없으면 아래 단언에서 실패
console.log('qaScr', await p.evaluate(()=>JSON.stringify([SCR&&SCR.name,QAV.open,!!document.querySelector('.qa.on .qa-ev')])));
await p.click('[data-act=back]'); await p.fill('#foodQ',''); await p.waitForTimeout(700);
await p.click('.tab[data-tab=me]'); await p.click('[data-act=openScr][data-v=set-refs]'); await p.click('[data-act=ref1]');
console.log('sheet', (await p.textContent('#sheetRoot')).slice(0,60));
await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(700); // 연타 가드(600ms 안 같은 자리 다른 버튼) 회피
// settings inputs only here
await p.click('[data-act=openScr][data-v=set-profile]'); await p.fill('#p_height','170'); await p.fill('#p_age','30'); await p.click('[data-act=sex][data-v=F]').catch(e=>console.log('sex btn?',e.message.slice(0,60)));
await p.click('.bottom-bar [data-act=peSave]'); await p.waitForTimeout(700);   // v1.7.1: 내 정보 편집은 '저장'을 눌러야 반영
await p.click('[data-act=openScr][data-v=set-weight]'); await p.fill('#w_today','58'); await p.click('[data-act=saveW]'); await p.click('[data-act=back]');
await p.click('[data-act=openScr][data-v=set-orders]'); await p.waitForTimeout(400); await p.screenshot({path:T('sh_orders.png'),fullPage:true});
await p.locator('input.sw').first().check(); await p.click('.bottom-bar [data-act=peSave]'); await p.waitForTimeout(700);
await p.click('[data-act=openScr][data-v=set-allergy]'); await p.waitForTimeout(400); await p.screenshot({path:T('sh_allergy.png'),fullPage:true}); await p.click('[data-act=back]');
console.log('profile', await p.evaluate(()=>JSON.stringify({p:S.profile,w:S.weights.slice(-1),o:S.orders})));
const inputsElsewhere = await p.evaluate(async()=>{const out={};for(const t of ['plan','log','food','nutri']){if(t==='nutri'){S.tab='plan';openScr('nutri')} else {if(SCR) closeScr(); document.querySelector(`.tab[data-tab=${t}]`).click()}await new Promise(r=>setTimeout(r,50));out[t]=[...document.querySelectorAll('#main input,#main textarea,#main select')].map(e=>e.id||e.type)}return out});
console.log('inputs on tabs', JSON.stringify(inputsElsewhere));
await p.evaluate(()=>{if(SCR) closeScr()}); await p.click('.tab[data-tab=food]'); await p.click('[data-act=foodSub][data-v=menu]');
await p.fill('#mjText','크림 파스타\n연어 포케'); await p.click('[data-act=mjText]'); await p.waitForTimeout(200);
await p.fill('#mj_g_1','연어, 밥, 고추장');
await p.click('[data-act=mjJudge]'); await p.waitForTimeout(300);
console.log('mj', await p.evaluate(()=>JSON.stringify({res:MJ.results.map(r=>[r.name,r.level,r.rules])})));
await p.waitForTimeout(400); await p.screenshot({path:T('sh_mj.png'),fullPage:true});
// reintro
await p.evaluate(()=>{for(let i=0;i<7;i++){S.logs[addDays(today(),-i)]={date:addDays(today(),-i),day:2,night:0,bloody:0,urg:0,blood:0,well:0,extra:[],pain:0,gas:"없음",fatigue:"없음",temp:"",pulse:"",other:[],memo:""}} S.reintro={active:null,history:[]}; render()});
await p.click('.tab[data-tab=log]'); await p.click('[data-act=openScr][data-v=reintro]');
await p.click('[data-act=riStart][data-i="0"]');
await p.evaluate(()=>{S.reintro.active.start=addDays(today(),-2);render()});
for(const i of [0,1,2]) await p.click(`[data-act=riSet][data-i="${i}"][data-v="없음"]`);
await p.screenshot({path:T('ri.png'),fullPage:true});
await p.click('[data-act=riEnd][data-v=pass]');
console.log('ri', await p.evaluate(()=>JSON.stringify({hist:S.reintro.history.map(h=>[h.name,h.result]),trig:S.triggers.length})));
console.log('errors', errs);
{const pl=lineJSON('{"n":'); expect(()=>pl.n===7,'식단 7일');
 expect(()=>JSON.parse(logOf('mealScr')).scr.name==='meal','끼니 화면'); expect(()=>logOf('ratedId')&&logOf('triggers').includes('"foodId":"'+logOf('ratedId')+'"'),'주의 음식 추가');   // v1.7.0: 앱 규칙 식단의 둘째 음식
 expect(()=>/진료를/.test(logOf('alerts')||''),'진료 안내'); expect(()=>JSON.parse(logOf('saved')).size>100000,'PDF 저장');
 // v1.9.0 U-1: 쪽으로 묶인 마법사 — 답해도 저절로 넘어가지 않고, 쪽마다 적은 값이 모두 저장됨
 expect(()=>{const a=jsonOf('noAutoAdv'); return a[0]===a[1]},'답해도 다음 쪽으로 저절로 넘어가지 않음');
 expect(()=>{const o=JSON.parse(logOf('log')), l=o.l; return o.tab==='plan'&&o.scr===null&&l.day===7&&l.night===0&&l.bloody===3&&l.urg===1&&l.blood===2&&l.well===1&&l.extra.length===1&&l.pain===6&&l.gas==='약간'&&l.fatigue==='심함'&&l.stool===6&&l.medtaken===2&&l.temp==='38.1'&&l.other.includes('두통')&&l.memo==='테스트 메모'},'증상 기록 쪽마다 적은 값 저장');
 expect(()=>/참고문헌|근거 자료/.test(logOf('sheet')||''),'참고문헌 시트');
 expect(()=>{const o=JSON.parse(logOf('profile')); return o.p.height==='170'&&o.p.sex==='F'&&o.o.checked.includes('lowres')},'내 정보 저장 버튼으로 반영(v1.7.1)');
 expect(()=>{const a=jsonOf('noAI'); return a[0]===false&&a.slice(1).every(t=>t==='undefined')},'AI 기능 없음(v1.7.0)');
 expect(()=>pl.sample===true&&pl.gen===false,'앱 규칙 식단이 바로 만들어짐');
 expect(()=>JSON.parse(logOf('foodQA')).includes('coffee'),'음식 검색에 관련 질문'); expect(()=>{const q=JSON.parse(logOf('qaScr')); return q[0]==='qa'&&q[1]==='coffee'&&q[2]},'관련 질문 열기');
 expect(()=>{const m=JSON.parse(logOf('mj')).res; return m.length===2&&m.every(r=>['ok','caution','later','avoid'].includes(r[1]))},'외식 판정(글자 입력)');}
__done(); await b.close();
})();
