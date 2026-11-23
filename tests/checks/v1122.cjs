const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_FILE||path.join(ROOT,'dist','uc-table-offline.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
require('../lib/guard.cjs');

/* 재점검 반영(2026-10-24, 4차): 기존 코드 점검에서 찾은 결함(활동기 까닭 문구·평소 배변 횟수 범위·미래 날짜·안 보이던 오류 안내),
   맥박 입력 제거와 Truelove-Witts 중증의 빨간 경고, 증상 기록 체온 범위, 옛 31만 회 열쇠 안내, 오프라인 단일 파일의 CSP,
   Actions 해시 고정, 내 정보 '경고' 칸 */
const { chromium } = require('playwright'); const fs=require('fs'); const crypto=require('crypto');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const BODY=fs.readFileSync(APP,'utf8');
const page=T('v1122.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+BODY+'</body></html>');
const SEED=()=>{ S.consent={date:today()}; S.onb="done"; S.stageMode="auto"; save(); };
(async()=>{
  const b=await chromium.launch();
  const open=async(opt={})=>{const ctx=await b.newContext({viewport:{width:opt.w||390,height:opt.h||844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    if(opt.init) await p.addInitScript(opt.init);
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); if(!opt.fresh){await p.evaluate(SEED); await p.reload(); await ready()} await p.waitForTimeout(150); return p};

  console.log('== 1 → 22차: 활동기 까닭 문구(actNote)는 뺐다. 그 조건은 식단 단계에만 씀');
  {const p=await open();
    const r=await p.evaluate(()=>{const L=o=>({...BLANK_LOG(),...o}); const st=o=>activity(L(o)).stage;
      return {s:[st({day:8,bloody:6,blood:3}),st({day:2,bloody:1,blood:3}),st({day:15}),st({day:1,temp:"38.0"}),st({day:2,urg:2,well:3})],band:(()=>{const d=today(); S.logs={[d]:L({day:8,bloody:6,blood:3})}; return ridgeText().sub})()}});
    need(r.s.every(x=>x===1),`혈변 6회·변 대부분 피·배변 15회·체온 38℃·보조 기준은 모두 가장 부드러운 단계 (${r.s})`);
    need(!/점수|위험 신호|보조 기준/.test(r.band),`홈 띠에 까닭·점수 없음 (${r.band})`);
    await p.context().close()}

  console.log('== 2 평소 하루 배변 횟수: 0~20 정수만 저장(내 정보·첫 실행 설정)');
  {const p=await open();
    const r=await p.evaluate(()=>{const o={}; const set=v=>{openScr("set-profile"); const el=document.getElementById("p_usualBM"); el.value=v; el.dispatchEvent(new Event("input",{bubbles:true})); peSave()};
      set("50"); o.blocked=SCR?.name==="set-profile"; o.msg=document.querySelector('#main').innerText.includes("0~20 사이의 정수"); o.kept=S.profile.usualBM; closeScr();
      set("2"); o.saved=S.profile.usualBM; o.closed=!SCR;
      S.onb="1"; SCR=null; render(); const u=document.getElementById("o_usualBM"); u.value="25"; u.dispatchEvent(new Event("input",{bubbles:true}));
      document.querySelector('[data-act=onbNext][data-v="2"]').click(); o.onbStay=S.onb; o.onbMsg=document.querySelector('#main').innerText.includes("0~20 사이의 정수");
      u.value=""; const u2=document.getElementById("o_usualBM"); u2.value="1"; u2.dispatchEvent(new Event("input",{bubbles:true})); document.querySelector('[data-act=onbNext][data-v="2"]').click(); o.onbNext=S.onb; S.onb="done"; render(); return o});
    need(r.blocked&&r.msg&&r.kept!=="50","내 정보: 50은 저장하지 않고 화면에 까닭을 보임");
    need(String(r.saved)==="2"&&r.closed,`내 정보: 2는 저장 (${r.saved})`);
    need(r.onbStay==="1"&&r.onbMsg&&r.onbNext==="2",`첫 실행 설정: 25면 다음으로 가지 않고, 1이면 감 (${r.onbStay}/${r.onbNext})`);
    await p.context().close()}

  console.log('== 3 증상 기록 날짜에 미래 날짜를 직접 쳐도 미래 기록이 생기지 않음');
  {const p=await open();
    await p.evaluate(()=>{S.logs={}; openWizard(addDays(today(),-1)); WZ.step=0; render()});
    const fut=await p.evaluate(()=>addDays(today(),5)); await p.fill('#logDate',fut); await p.dispatchEvent('#logDate','input');
    const r=await p.evaluate(()=>({d:draft.date,t:today(),toast:document.querySelector('#toasts').textContent}));
    need(r.d===r.t&&/앞으로 올 날짜/.test(r.toast),`오늘로 되돌리고 알림 (${r.d})`);
    await p.evaluate(()=>{wizardDirty=()=>false; SCR=null; render()}); await p.context().close()}

  console.log('== 4 오류 안내(alertMsg)가 어느 화면에서나 보임');
  {const p=await open();
    const r=await p.evaluate(()=>{const o={}; openScr("set-data"); restoreFromText("이건 백업이 아님"); o.data=document.querySelector('#main').innerText.includes("올바른 백업 내용이 아닙니다");
      SCR={name:"pdf"}; render(); o.pdf=document.querySelector('#main').innerText.includes("올바른 백업 내용이 아닙니다");
      SCR=null; S.tab="plan"; render(); o.homeN=document.querySelectorAll('#main .msg-b').length; S.tab="log"; render(); o.logN=document.querySelectorAll('#main .msg-b').length; return o});
    need(r.data&&r.pdf,'데이터 백업·음식 경험 PDF 화면에서도 보임');
    need(r.homeN===1&&r.logN===1,`홈·기록 탭에서 두 번 나오지 않음 (${r.homeN}/${r.logN})`);
    await p.context().close()}

  console.log('== 5 맥박은 받지 않음(입력칸·저장·CSV), 비운 값은 알림');
  {const p=await open();
    const r=await p.evaluate(()=>{const o={}; o.blank=!("pulse" in BLANK_LOG());
      openWizard(today()); WZ.step=WS().findIndex(s=>(s.q||[]).some(q=>q.k==="vitals")); render(); o.input=!!document.getElementById("pulse"); o.title=document.querySelector('#wq_vitals h3')?.textContent; wizardDirty=()=>false; SCR=null; render();
      o.norm="pulse" in normalizeState({...JSON.parse(backupJSON()),logs:{"2026-10-01":{day:2,pulse:"99"}}}).logs["2026-10-01"];
      o.csv=csvRows("logs")[0].includes("맥박");
      const raw={...JSON.parse(backupJSON()),logs:{"2026-10-01":{...BLANK_LOG(),day:2,temp:"380",pulse:"99"},"2026-10-02":{...BLANK_LOG(),day:1,temp:"37.1",pulse:"80"}}};
      openScr("set-data"); restoreFromText(JSON.stringify(raw)); o.sheet=document.querySelector('#sheetRoot').innerText; closeSheet(); closeScr();
      o.drops=vitalDrops(raw); return o});
    need(r.blank&&!r.input&&r.title==="체온(쟀다면)",`기본 기록·증상 기록에 맥박 칸 없음 (${r.title})`);
    need(!r.norm&&!r.csv,'옛 기록·백업의 맥박은 가져오지 않고 CSV에도 없음');
    need(r.drops.t===1&&r.drops.h===2&&/체온 기록 1개를 비웁니다/.test(r.sheet)&&/맥박 2개를 가져오지 않습니다/.test(r.sheet),`불러오기 화면에 비우는 값 개수 (${JSON.stringify(r.drops)})`);
    await p.context().close()}
  {const p=await open();
    // 옛 기록(체온 380·맥박)을 저장소에 직접 넣고 다시 연다. 넣는 동안 앱이 지금 기록으로 덮어쓰지 않게 저장을 멈춘다(STALE)
    await p.evaluate(()=>{STALE=true; const s=JSON.parse(localStorage.getItem(KEY)); s.logs={"2026-10-01":{day:2,temp:"380",pulse:"99"}}; localStorage.setItem(KEY,JSON.stringify(s))});
    await p.reload(); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000}); await p.waitForTimeout(200);
    const r=await p.evaluate(()=>({txt:document.querySelector('#main').innerText,log:S.logs["2026-10-01"],stored:JSON.parse(localStorage.getItem(KEY)).logs["2026-10-01"]}));
    need(/체온 기록 1개를 비웠습니다/.test(r.txt)&&/맥박 1개를 지웠습니다/.test(r.txt),'앱을 열 때 비운 체온·지운 맥박 개수를 알림');
    need(r.log&&r.log.temp===""&&r.stored&&!("pulse" in r.stored),'저장된 기록에서도 맥박이 빠짐');
    await p.context().close()}

  console.log('== 6 증상 기록 체온 칸: 34~42℃ 밖이면 다음으로 가지 않음');
  {const p=await open();
    const r=await p.evaluate(()=>{const o={}; openWizard(today()); const vs=WS().findIndex(s=>(s.q||[]).some(q=>q.k==="vitals")); WZ.step=vs; render();
      const put=v=>{const t=document.getElementById("temp"); t.value=v; t.dispatchEvent(new Event("input",{bubbles:true})); document.querySelector('[data-act=wzNext]').click()};
      put("380"); o.stay=WZ.step===vs; o.err=document.getElementById("tempErr")?.textContent||""; o.inv=document.getElementById("temp")?.getAttribute("aria-invalid");
      put("37.9"); o.go=WS()[WZ.step].k; wizardDirty=()=>false; SCR=null; render(); return o});
    need(r.stay&&/34~42℃/.test(r.err)&&r.inv==="true",`380이면 머물고 안내 (${r.err})`);
    need(r.go==="result",'37.9면 요약으로');
    await p.context().close()}

  console.log('== 7 → 22차: Truelove-Witts 중증 경고·요약 칸은 뺐다. 조건은 식단 단계에만');
  {const p=await open();
    const r=await p.evaluate(()=>{const d=today(); S.logs={[d]:{...BLANK_LOG(),day:6,bloody:3,blood:3,temp:"37.6"}}; save(); SCR=null; S.tab="plan"; render();
      const home=document.querySelector('#main').innerText; const ban=document.querySelectorAll('#main .banner.crit,#main .banner.urgent').length;
      openWizard(d); WZ.step=WS().length-1; render(); const wz=document.querySelector('#main').innerText; wizardDirty=()=>false; SCR=null; render();
      return {home,ban,wz,st:currentStage().stage,ds:dangerSignals(S.logs[d]),hot38:dangerSignals({...BLANK_LOG(),day:2,temp:"38.4"})}});
    need(r.ds.severe.length===1&&r.st===1,`중증 조건(배변 6회·대부분 뚜렷한 피·37.6℃)은 가장 부드러운 단계 (${r.st})`);
    need(!r.ban&&!/Truelove|중증/.test(r.home)&&!/Truelove|중증/.test(r.wz),'홈·증상 기록 요약에 경고·중증 말 없음');
    need(!r.hot38.severe.length&&r.hot38.urgent.length===1,'배변이 적은 날의 고열은 urgent 조건(맥박을 받지 않음)');
    await p.context().close()}

  console.log('== 8 이전 버전(31만 회)에서 정한 백업 비밀번호: 안내와 횟수');
  {const p=await open();
    const r=await p.evaluate(async()=>{const salt=crypto.getRandomValues(new Uint8Array(16)); const key=await encDerive("password-1234",salt,ENC_ITER_LEGACY);
      await idb("kv","readwrite",st=>st.put({key,salt:b64(salt),at:today()},"bkKey"));   // 횟수가 적히지 않은 옛 열쇠
      Object.assign(ENC,{key:null,ready:false,err:false}); await encLoad(); const it=ENC.iter;
      openScr("set-data"); await new Promise(r=>setTimeout(r,200)); render(); const txt=document.querySelector('#main').innerText;
      const wrapped=JSON.parse(await encWrap("hello")); const back=await encUnwrap(wrapped,"password-1234");
      await encOff(); closeScr(); return {it,txt,wIter:wrapped.iter,back}});
    need(r.it===310000,`횟수가 적히지 않은 열쇠는 31만 회로 봄 (${r.it})`);
    need(/보안이 조금 약합니다/.test(r.txt)&&/비밀번호 바꾸기/.test(r.txt),'백업 화면에 다시 정하라는 안내');
    need(r.wIter===310000&&r.back==="hello",'그 열쇠로 만든 백업에 실제 횟수가 적혀 다시 열림');
    await p.context().close()}

  console.log('== 9 오프라인 단일 파일(안드로이드 앱이 넣는 파일)의 콘텐츠 보안 정책');
  if(!fs.existsSync(OFFLINE)) need(false,'dist/uc-table-offline.html 없음(python3 tools/build_offline.py)');
  else {const html=fs.readFileSync(OFFLINE,'utf8'); const csp=(html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)||[])[1]||"";
    const codes=[...html.matchAll(/<script(?: type="text\/plain" id="[^"]+")?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
    const miss=codes.filter(c=>!csp.includes("'sha256-"+crypto.createHash('sha256').update(c,'utf8').digest('base64')+"'"));
    need(csp&&/default-src 'none'/.test(csp)&&/connect-src 'none'/.test(csp)&&!/unsafe-inline'[^;]*;?\s*$/.test(csp.split('script-src')[1]?.split(';')[0]||""),'CSP 있음: 기본 막음, 연결 막음, 스크립트는 해시만');
    need(codes.length>=8&&miss.length===0,`파일 안 스크립트(${codes.length}개, 쓸 때만 실행하는 라이브러리 포함)의 해시가 모두 CSP에 있음 (빠진 것 ${miss.length})`);
    const ctx=await b.newContext({viewport:{width:390,height:844}}); const p=await ctx.newPage();
    await p.addInitScript(()=>{document.addEventListener('securitypolicyviolation',e=>{(window.__v=window.__v||[]).push(e.violatedDirective)})});
    await p.goto('file://'+OFFLINE); const ok=await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000}).then(()=>true,()=>false);
    const r=ok?await p.evaluate(async()=>{const o={}; try{await loadPdfLibs(); o.pdf=!!(window.jspdf&&window.html2canvas)}catch(e){o.pdf="err"} try{await loadScanLib(); o.scan=!!window.ZXing}catch(e){o.scan="err"}
      o.v=(window.__v||[]).length;   // 끼워 넣기 전까지의 위반 수
      document.body.insertAdjacentHTML('beforeend','<img src=x onerror="window.__h=1">'); const s=document.createElement('script'); s.textContent='window.__s=1'; document.head.appendChild(s);
      await new Promise(r=>setTimeout(r,300)); o.h=!!window.__h; o.s=!!window.__s; return o}):null;
    need(ok&&r&&r.pdf===true&&r.scan===true&&r.v===0,`CSP 아래서 앱·그림 PDF·바코드 라이브러리가 동작 (${JSON.stringify(r)})`);
    need(r&&!r.h&&!r.s,'끼워 넣은 인라인 코드는 막힘');
    await ctx.close()}

  console.log('== 10 GitHub Actions를 커밋 해시로 고정');
  {const WF=path.join(ROOT,'.github','workflows'); const bad=[];
    for(const f of fs.readdirSync(WF).filter(f=>/\.ya?ml$/.test(f))) for(const l of fs.readFileSync(path.join(WF,f),'utf8').split('\n')) {const m=l.match(/uses:\s*(\S+)(.*)$/); if(m&&!(/@[0-9a-f]{40}$/.test(m[1])&&/#\s*v\d+\.\d+\.\d+/.test(m[2]))) bad.push(f+': '+l.trim())}
    need(bad.length===0,`모든 uses가 40자리 해시와 버전 주석 (${bad.join(' | ')||'없음'})`)}

  console.log("== 11 내 정보 '경고' 칸");
  {const p=await open();
    const r=await p.evaluate(()=>{const o={}; const view=prof=>{Object.assign(S.profile,prof); SCR=null; S.tab="me"; render(); const row=document.querySelectorAll('#main [data-act=openScr][data-v=set-warn]'); o.rows=(o.rows||[]).concat([[row.length,[...(row[0]?.querySelectorAll('.wtag')||[])].map(x=>x.textContent).join(' · '),document.querySelectorAll('#main .wrow').length]]); SCR={name:"set-warn"}; render(); return [...document.querySelectorAll('.warn-list .wrow')].map(d=>[d.dataset.w,d.querySelector('.wtag')?.textContent||""])};
      o.adult=view({age:"40",sex:"F",meds:["asa"],medOther:""}); o.adultNoMed=(()=>{const n=o.rows.length; const v=view({age:"40",sex:"F",meds:[],medOther:""}); o.rows.length=n; return v})();   /* 22차: 맨 위가 원래 첫 항목(kid)이 아닌 경우로 올리기를 확인 */ o.teen=view({age:"15",sex:"M",meds:[],medOther:""});
      o.medTxt=document.querySelector('.wrow[data-w=med] .wbody').textContent; o.label=SCR_TITLE[SCR.name];
      const d=document.querySelector('.wrow[data-w=kid]'); d.open=true; d.dispatchEvent(new Event("toggle")); render(); o.kept=document.querySelector('.wrow[data-w=kid]').open;
      o.ref94=!!REFS[94]&&/PUCAI/.test(REFS[94].short); o.kidRef=document.querySelector('.wrow[data-w=kid] .wbody').innerHTML;
      SCR={name:"nutri"}; S.stageMode=3; render(); o.fiber=document.querySelector('#main').innerText.includes("19세 미만은 앱에 기준이 없음"); S.stageMode="auto"; SCR=null; render(); return o});
    need(r.rows.length===2&&r.rows.every(x=>x[0]===1&&x[2]===0)&&r.rows[0][1]===""&&r.rows[1][1]==="15세 · 약 입력 안 함",`내 정보에는 '경고' 한 줄만(펼친 목록 없음), 해당 꼬리표는 그 줄에 (${JSON.stringify(r.rows)})`);
    need(r.label==="경고"&&r.adult.length===6&&r.adult.every(x=>!x[1])&&r.adult[0][0]==="kid",`성인: 6가지(22차: 맥박·혈액 검사 경고 항목은 뺌), 표시 없음 (${r.adult.map(x=>x[0]).join(',')})`);
    need(r.teen[0][0]==="kid"&&r.teen[0][1]==="15세"&&r.teen[1][0]==="med"&&r.teen[1][1]==="약 입력 안 함",`15세·약 없음: 까닭을 붙여 맨 위로 (${JSON.stringify(r.teen.slice(0,3))})`);
    need(r.adultNoMed[0][0]==="med"&&r.adultNoMed[0][1]==="약 입력 안 함"&&r.adultNoMed[1][0]==="kid",`40세·약 없음: 해당하는 경고(약)를 맨 위로 (${JSON.stringify(r.adultNoMed.slice(0,2))})`);
    need(/스테로이드·면역조절제·생물학적 제제·JAK 억제제/.test(r.medTxt),'날음식 판정에 쓰는 약 이름이 앱의 목록과 같음');
    need(r.kept,'펼친 경고는 다시 그려도 열려 있음');
    need(r.ref94&&/data-refs|sup|ref/.test(r.kidRef),'소아 활동도 지수(PUCAI) 근거 94번');
    need(r.fiber,"19세 미만 식이섬유 목표 문구가 '성별·나이 입력 필요'가 아님");
    await p.context().close()}

  console.log("== 12 '기록 저장' 같은 버튼을 두 번 누를 때, 화면이 바뀐 직후 같은 자리에 나타난 아래 메뉴는 눌리지 않음");
  {const p=await open();
    const r=await p.evaluate(()=>{SCR=null; S.tab="plan"; render(); const tab=document.querySelector('.tab[data-tab=food]'); const rc=tab.getBoundingClientRect(); const x=rc.left+rc.width/2, y=rc.top+rc.height/2;
      const tapAt=()=>tab.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1,clientX:x,clientY:y}));
      TAP={t:Date.now(),x,y,act:"saveLog"}; NAVT=Date.now(); tapAt(); const ghost=S.tab;   // 방금 같은 자리의 '기록 저장'을 눌러 화면이 바뀐 상황
      TAP={t:Date.now()-2000,x,y,act:"saveLog"}; NAVT=Date.now()-2000; tapAt(); const later=S.tab; S.tab="plan"; render(); return {ghost,later}});
    need(r.ghost==="plan"&&r.later==="food",`연타의 두 번째 탭은 무시, 시간이 지난 뒤에는 그대로 (${r.ghost} → ${r.later})`);
    await p.context().close()}

  await b.close();
  console.log(F.length?`\n실패 ${F.length}건`:'\n모두 통과'); if(F.length) process.exit(1);
})().catch(e=>{console.error(e); process.exit(1)});
