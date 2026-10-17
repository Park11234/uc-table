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
const WZSTEPS_BACK=30;
const { chromium } = require('playwright'); const fs=require('fs');

// 검증용: 출력한 줄을 모아 두고 끝에서 기대값과 비교한다(v1.5.0)
const __LOG=[]; {const __o=console.log; console.log=(...a)=>{__LOG.push(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ')); __o(...a)}}
const logOf=k=>{const l=__LOG.find(x=>x===k||x.startsWith(k+' ')); return l==null?null:l.slice(k.length).trim()};
const jsonOf=k=>{const v=logOf(k); if(v==null) return null; try{return JSON.parse(v)}catch(e){return v}};
const lineJSON=pre=>{const l=__LOG.find(x=>x.startsWith(pre)); if(l==null) return null; try{return JSON.parse(l)}catch(e){return null}};
const FAILS=[]; const expect=(c,m)=>{let ok=false; try{ok=typeof c==='function'?!!c():!!c}catch(e){m+=' ('+e.message+')'} if(!ok) FAILS.push(m)};
const __done=()=>{ if(FAILS.length){ console.error('FAIL\n'+FAILS.join('\n')); process.exitCode=1 } else console.log('검증 통과') };
const rateOpen=async p=>{const b=await p.$('[data-act=rateOpen]'); if(b){await b.click(); await p.waitForTimeout(80)}}; // v1.8.0 평가 버튼은 '불편했던 음식 고르기'를 눌러야 보임
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('t11.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today()};render()});
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
const r2=await p.evaluate(()=>{S.orders.checked=[];S.profile.allergies=[];S.plan={sample:false,start:today(),stage:1,days:[0,1,2].map(i=>({date:addDays(today(),i),meals:[{slot:"아침",title:"달걀죽",items:[["rice_porridge",300],["egg_steamed",100]],tip:"x",refs:[1]}]}))};S.profile.allergies=['egg'];render();return document.querySelector('#main').textContent.includes('지금 조건에 맞지 않는 식품이 있습니다')});
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
// copy yesterday → v1.9.0 U-1 '평소와 같음': 최근 7일 안 마지막 기록과 같게 바로 저장(체온·맥박·메모는 비움)하고 되돌리기 알림
await p.evaluate(()=>{S.logs[addDays(today(),-1)]={day:2,night:0,bloody:0,urg:0,blood:0,well:0,extra:[],pain:1,gas:"없음",fatigue:"약간",temp:"37",pulse:"70",other:[],memo:"어제"};delete S.logs[today()];S.tab="log";SCR=null;render()});
await p.click('.today-card [data-act=quickSame]'); await p.waitForTimeout(200);
console.log('copy', await p.evaluate(()=>{const l=S.logs[today()]||{}; return [SCR&&SCR.name,l.memo,l.temp,l.fatigue,/되돌리기/.test(document.querySelector('#toasts').textContent),l.pulse,l.pain,l.day]}));
await p.click('#toasts .t-act'); await p.waitForTimeout(200);
console.log('copy undo', await p.evaluate(()=>[!!S.logs[today()],!!S.logs[addDays(today(),-1)]]));
await p.click('.today-card [data-act=quickSame]'); await p.waitForTimeout(200);
// 저장한 오늘 기록 고치기: 요약 쪽까지 '다음'으로 간 뒤
await p.click('.today-card [data-act=wizardDate]'); await p.waitForTimeout(200);
for(let i=0;i<WZSTEPS_BACK;i++){ const b=await p.$('[data-act=wzNext]'); if(!b) break; await b.click(); await p.waitForTimeout(60) } await p.waitForTimeout(150);
console.log('to result', await p.evaluate(()=>[WZ.step===WSTEPS.length-1,draft.fatigue,draft.memo]));
// 뒤로 가기: 마법사 단계 수가 늘어도 깨지지 않게 '첫 단계'까지 눌러 확인한다
for(let i=0;i<WZSTEPS_BACK;i++){ const b=await p.$('[data-act=wzPrev]'); if(!b) break; await b.click(); await p.waitForTimeout(60) } await p.waitForTimeout(150);
console.log('back to first', await p.evaluate(()=>WZ.step===0));
const goStep=async k=>{await p.evaluate(k=>{WZ.step=wzStepOf(k);render()},k);await p.waitForTimeout(150)};
await goStep('day');
console.log('at step', await p.evaluate(()=>[WZ.step,WSTEPS[WZ.step].k]));
// v1.9.0: 한 쪽에 숫자 칸이 여러 개라 칸마다 id(step_day·step_night·step_bloody)
await p.fill('#step_day','12');
console.log('stepIn', await p.evaluate(()=>draft.day));
await goStep('bloody'); await p.fill('#step_bloody','30');
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
await p.click('[data-act=restoreApply][data-v=replace]'); await p.waitForTimeout(200);
console.log('restored', JSON.stringify(await p.evaluate(()=>[S.logs["2026-01-01"],S.plan.sample,S.profile.allergies,S.weights.length])));
fs.writeFileSync(T('t.json'),JSON.stringify(mod));
await p.evaluate(()=>{S.tab="me";SCR={name:"set-data"};render()});
await p.setInputFiles('#restore',T('t.json')); await p.waitForTimeout(200);
console.log('file restore sheet', (await p.textContent('#sheetRoot')).slice(0,20));
await p.click('#sheetRoot .stack [data-act=closeSheet]');   // v1.8.0 비교 시트가 길어 배경 가운데를 누르면 시트에 닿음 → '취소' 버튼
// reset
await p.click('[data-act=reset]'); await p.click('[data-act=resetDo]'); await p.waitForTimeout(200);
console.log('reset', await p.evaluate(()=>[Object.keys(S.logs).length,!!S.consent]));
// welcome for fresh
await p.evaluate(()=>{S.consent=null;render()});
console.log('welcome', await p.evaluate(()=>[document.body.className,document.querySelector('#consentGo').disabled]));
console.log('errors',errs); {const a=jsonOf('sample allergy'); expect(()=>a.bad.length===0&&a.empties===0,'알레르기 예시 식단');
 expect(()=>jsonOf('extreme').every(t=>/\(empty\)$/.test(t)),'모두 제외면 빈 끼니'); expect(()=>jsonOf('issue banner')===true,'조건 바뀜 안내');
 expect(()=>jsonOf('expired').every(Boolean),'지난 식단 새로'); expect(()=>{const f=jsonOf('future meal'); return f[0]===false&&f[1]===true},'앞날 끼니');
 expect(()=>jsonOf('extras').some(x=>x.foodId==='nurungji'&&x.amt===40),'먹은 음식 기록');
 // v1.9.0 U-1·U-3: 마법사를 열지 않고 바로 저장(증상은 그대로, 체온·맥박·메모는 비움) + 되돌리기
 expect(()=>{const c=jsonOf('copy'); return c[0]===null&&c[1]===''&&c[2]===''&&c[3]==='약간'&&c[4]===true&&c[5]===''&&c[6]===1&&c[7]===2},'평소와 같음(어제 기록 가져오기)');
 expect(()=>{const c=jsonOf('copy undo'); return c[0]===false&&c[1]===true},'평소와 같음 되돌리기');
 expect(()=>{const c=jsonOf('to result'); return c[0]===true&&c[1]==='약간'&&c[2]===''},'저장한 기록 고치기: 요약까지');
 expect(()=>jsonOf('back to first')===true,'첫 단계로'); expect(()=>jsonOf('stepIn')===12,'숫자 입력'); expect(()=>jsonOf('bloody clamp')<=12,'혈변 수 제한');
 expect(()=>jsonOf('saved').day===12,'기록 저장'); expect(()=>/FODMAP/.test(logOf('term')),'용어 설명');
 expect(()=>jsonOf('mjEat').includes('백김치'),'외식 먹음 기록'); expect(()=>/^\{"profile"/.test(logOf('copy fallback')),'백업 복사 대체');
 expect(()=>/올바른 백업/.test(logOf('bad restore')),'잘못된 백업 거부'); expect(()=>/백업 불러오기/.test(logOf('confirm')),'복원 확인');
 expect(()=>{const r=jsonOf('restored'); return r[0].day===3&&r[1]===true&&Array.isArray(r[2])&&r[3]===1},'복원 정리');
 expect(()=>{const r=jsonOf('reset'); return r[0]===0},'초기화'); expect(()=>jsonOf('welcome')[0]==='welcome','처음 화면');}
__done(); await b.close()})();
