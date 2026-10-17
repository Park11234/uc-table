const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
// 공통 안전장치: 어느 페이지에서든 잡히지 않은 오류(pageerror)가 나면 이 점검을 실패로 끝낸다
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}
/* v1.12.0 점검: v1.11.0 전체 코드 검토(C-01~C-19)에서 고친 것이 그대로인지 확인한다. */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const page=T('v1120.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
(async()=>{
  const b=await chromium.launch();
  const open=async()=>{const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    await p.goto('file://'+page); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.evaluate(()=>{S.consent={date:today()}; S.onb="done"; S.stageMode="3"; save(); render()}); return p};

  console.log('== C-01 외식 판정: 목록에 있는 음식의 알레르기 표시도 절대 금지');
  {const p=await open();
    const r=await p.evaluate(()=>{const mj=(name,al)=>{S.profile.allergies=al; save(); MJ.items=[{name,ingr:[],conf:1}]; mjJudge(); const x=MJ.results[0]; return {lv:x.level,why:x.rules.join(" / ")}};
      const o={kimchi:mj("배추김치",["shrimp"]),gimbap:mj("김밥",["egg"]),curry:mj("카레라이스",["wheat"]),none:mj("배추김치",[])};
      S.profile.allergies=[]; S.profile.allergyOther="새우"; save(); o.typed=ruleCheck({name:"새우볶음밥",ingr:[]}).level; S.profile.allergyOther=""; save(); return o});
    need(r.kimchi.lv==="ban"&&/알레르기/.test(r.kimchi.why),`C-01 새우 알레르기 · 배추김치 외식 판정 = 절대 금지 (${r.kimchi.lv}: ${r.kimchi.why.slice(0,60)})`);
    need(r.gimbap.lv==="ban",`C-01 달걀 알레르기 · 김밥 = 절대 금지 (${r.gimbap.lv})`);
    need(r.curry.lv==="ban",`C-01 밀 알레르기 · 카레라이스 = 절대 금지 (${r.curry.lv})`);
    need(r.none.lv!=="ban"&&!/알레르기/.test(r.none.why),`C-01 알레르기가 없으면 배추김치는 원래 판정 (${r.none.lv})`);
    need(r.typed==="ban",`C-01 직접 적은 알레르기(새우)도 그대로 절대 금지 (${r.typed})`);
    await p.context().close()}

  console.log('== C-02 음식 목록 판정이 면역 약·직접 적은 알레르기를 바꾸면 바로 바뀜');
  {const p=await open();
    const r=await p.evaluate(()=>{S.foodQ="회"; S.profile.meds=[]; save(); render();
      const lv=()=>Object.fromEntries(foodSearchData().rows.filter(x=>x.f.tags.includes("raw")).map(x=>[x.f.name,[x.s.level,foodStatus(x.f).level]]));
      const before=lv(); S.profile.meds=["steroid"]; save(); render(); const after=lv();
      S.profile.meds=[]; S.profile.dislikes="새우"; save(); S.foodQ="새우"; render(); foodSearchData();
      S.profile.allergyOther="새우"; save(); render(); const row=foodSearchData().rows.find(x=>x.f.name==="새우");
      const shrimp=row?[row.s.level,foodStatus(row.f).level]:null;
      S.profile.dislikes=""; S.profile.allergyOther=""; S.foodQ=""; save();
      return {before,after,shrimp}});
    const pairs=Object.entries(r.after);
    need(pairs.length>=4&&Object.values(r.before).every(([l])=>l!=="avoid"),`C-02 약이 없을 때 날음식 목록은 피하기 아님 (${pairs.length}종)`);
    need(pairs.every(([,[l,d]])=>l==="avoid"&&d==="avoid"),`C-02 스테로이드를 켜면 목록도 바로 피하기 (${JSON.stringify(r.after).slice(0,120)})`);
    need(r.shrimp&&r.shrimp[0]==="ban"&&r.shrimp[1]==="ban",`C-02 싫어하는 음식을 알레르기 칸에도 적으면 목록도 절대 금지 (${JSON.stringify(r.shrimp)})`);
    await p.context().close()}

  console.log('== C-03 면역 약: 목록 밖 외식 메뉴·포장 원재료의 날음식도 피하기(젓갈 제외)');
  {const p=await open();
    const r=await p.evaluate(()=>{const mj=n=>{MJ.items=[{name:n,ingr:[],conf:1}]; mjJudge(); const x=MJ.results[0]; return [x.level,x.rules.join(" / ")]};
      const RAW=["연어 사시미","생굴","간장게장","양념게장","연어장","날치알밥","반숙 달걀","육사시미"], JEOT=["명란젓","오징어젓"], COOKED=["유부초밥","문어숙회","날치알 볶음밥","회오리감자"];
      const run=()=>({raw:Object.fromEntries(RAW.map(n=>[n,mj(n)])),jeot:Object.fromEntries(JEOT.map(n=>[n,mj(n)])),cooked:Object.fromEntries(COOKED.map(n=>[n,mj(n)])),
        label:labelCheck("쌀, 훈제연어(연어, 정제소금), 크림치즈, 김","연어 롤"),lab2:labelCheck("밥, 명란젓, 마요네즈","명란 주먹밥")});
      S.profile.meds=[]; save(); const off=run(); S.profile.meds=["bio"]; save(); const on=run(); S.profile.meds=[]; save(); return {off,on}});
    const imm=t=>/면역/.test(t);
    need(Object.values(r.on.raw).every(([l,w])=>l==="avoid"&&imm(w)),`C-03 생물학적 제제 · 날음식 외식 메뉴 모두 피하기 (${Object.entries(r.on.raw).filter(([,[l]])=>l!=="avoid").map(([n,[l]])=>n+":"+l).join(", ")||"모두"})`);
    need(Object.values(r.off.raw).every(([,w])=>!imm(w)),'C-03 약이 없으면 면역 약 이유가 붙지 않음');
    need(Object.values(r.on.jeot).every(([,w])=>!imm(w)),`C-03 젓갈은 면역 약 이유로 피하기에 넣지 않음(D-1) (${JSON.stringify(r.on.jeot)})`);
    need(Object.values(r.on.cooked).every(([,w])=>!imm(w)),`C-03 익힌 것(유부초밥·숙회·볶음밥)과 회오리감자는 날음식 아님 (${Object.entries(r.on.cooked).filter(([,[,w]])=>imm(w)).map(([n])=>n).join(", ")||"모두 맞음"})`);
    const lr=l=>l.rows.find(x=>/면역|날것/.test(x.title+x.why));
    need(r.on.label.overall==="avoid"&&!!lr(r.on.label),`C-03 포장 원재료의 훈제연어 = 피하기 (${r.on.label.overall})`);
    need(!lr(r.off.label)&&!lr(r.on.lab2),'C-03 약이 없거나 젓갈(명란젓)뿐이면 날음식 줄 없음');
    await p.context().close()}

  console.log('== C-04 전체 초기화에서 보관본을 남기면 초기화 직전 기록을 되살릴 수 있음');
  {const p=await open();
    await p.evaluate(async()=>{S.logs[today()]={...BLANK_LOG(),day:3,night:0,memo:"초기화 전 메모"}; save(); await autoRun();
      const bt=document.createElement('button'); bt.dataset.act='reset'; document.body.appendChild(bt); bt.click()});
    await p.evaluate(()=>{document.getElementById('rstAll').checked=false; document.querySelector('#sheetRoot [data-act=resetDo]').click()});
    await p.waitForTimeout(6500);   // 초기화 뒤 자동 보관(5초)이 돈 뒤
    const r=await p.evaluate(async()=>{const all=await idb("snaps","readonly",st=>st.getAll()); AUTO.snaps=null; await snapList(); SCR={name:"set-data"}; render();
      return {logs:Object.keys(S.logs).length, keep:all.filter(x=>x.json.includes("초기화 전 메모")).map(x=>x.date), list:document.querySelector('#main').innerText.includes("초기화 전")}});
    need(r.logs===0&&r.keep.length>=1,`C-04 초기화 6.5초 뒤에도 초기화 직전 기록이 보관본에 남음 (${JSON.stringify(r.keep)})`);
    need(r.list,'C-04 백업 화면에 "초기화 전" 보관본이 보임');
    await p.context().close()}

  console.log('== C-05 영어 낱말(constructor·toString 등)로 검색·외식 판정이 멈추지 않음');
  {const p=await open();
    const r=await p.evaluate(()=>{const bad=[]; for(const q of ["constructor","toString","valueOf","hasOwnProperty","__proto__"]){
        try{S.foodQ=q; foodSearchData()}catch(e){bad.push("검색 "+q+": "+e.message)}
        try{MJ.items=[{name:q,ingr:[],conf:1}]; mjJudge()}catch(e){bad.push("외식 "+q+": "+e.message)}}
      S.foodQ="constructor"; S.tab="food"; save(); const bt=document.createElement('button'); bt.dataset.act='recoverHome'; document.body.appendChild(bt); bt.click();
      return {bad,q:S.foodQ,eng:engQuery("banana")}});
    need(!r.bad.length,`C-05 오류 없음 (${r.bad.join(" / ")||"모두 통과"})`);
    need(r.q==="",`C-05 오류 화면의 '처음 화면으로'가 검색어도 비움 (${JSON.stringify(r.q)})`);
    need(r.eng==="바나나",'C-05 영어 검색은 그대로(banana → 바나나)');
    await p.context().close()}

  console.log('== C-06 홈 상태 띠는 식단 단계와 같은 관해 기준');
  {const p=await open();
    const r=await p.evaluate(()=>{S.stageMode="auto"; const t=today(); const one=day=>{S.logs={}; S.logs[t]={...BLANK_LOG(),day,night:0,urg:0,blood:0,bloody:0,well:0,pain:0}; save(); S.tab="plan"; SCR=null; render();
        const x=ridgeText(); return {head:x.head,sub:x.sub,stage:currentStage().stage,bl:document.querySelector('.ridge svg text.bl')?.textContent||""}};
      return {six:one(6),three:one(3)}});
    need(r.six.stage===2&&r.six.head!=="편안한 하루입니다"&&!/관해 범위 안|관해 기준에 맞/.test(r.six.sub),`C-06 하루 6회: 편안한 하루·관해라고 하지 않음 (${r.six.head} · ${r.six.sub})`);
    need(r.three.stage===3&&/관해/.test(r.three.sub),`C-06 하루 3회·증상 없음: 관해 기준이라고 함 (${r.three.head} · ${r.three.sub})`);
    need(!/관해/.test(r.six.bl),`C-06 그래프 띠 이름은 점수로(관해라고 쓰지 않음) (${r.six.bl})`);
    await p.context().close()}

  console.log('== C-07 암호화 열쇠를 읽지 못하면 평문으로 내보내지 않음');
  {const p=await open();
    const r=await p.evaluate(async()=>{const orig=idb; ENC.ready=false; ENC.key=null; idb=async()=>{throw new Error("blocked")};
      let a; try{const t=await backupOut(); a={plain:typeof t==="string"&&t.includes('"logs"')}}catch(e){a={err:String(e&&e.message)}}
      idb=orig; let b2; try{const t=await backupOut(); b2=typeof t==="string"&&t.includes('"logs"')}catch(e){b2="err:"+e.message}
      return {a,b2}});
    need(!r.a.plain&&!!r.a.err,`C-07 열쇠를 읽지 못하면 백업을 멈춤 (${JSON.stringify(r.a)})`);
    need(r.b2===true,`C-07 다시 읽을 수 있게 되면 그대로 백업(암호화 꺼짐이면 평문) (${r.b2})`);
    await p.context().close()}

  console.log('== C-10 암호화를 켜도 복사·보내기를 누른 그 순간에 처리(아이폰 사파리 조건)');
  {const p=await open();
    await p.evaluate(async()=>{await encSet("test-pass-1234");
      // 크롬은 작은 AES-GCM 암호화를 같은 작업 안에서 끝내지만, WebKit(사파리)은 다음 작업에서 끝낸다. 사파리와 같게 한 틱 늦춘다
      const enc0=crypto.subtle.encrypt.bind(crypto.subtle); crypto.subtle.encrypt=(...a)=>new Promise((ok,no)=>setTimeout(()=>enc0(...a).then(ok,no),0));
      // 누른 그 순간 = 클릭 처리 중(window 캡처 단계부터 window 버블 단계까지, 그 사이 마이크로태스크 포함). 암호화처럼 진짜 비동기를 기다린 뒤면 false
      window.__task=false; window.addEventListener('click',()=>{window.__task=true},true); window.addEventListener('click',()=>{window.__task=false},false);
      const cb={write:async items=>{window.__cw={task:window.__task}; try{const bl=await items[0].getType("text/plain"); window.__cwText=await bl.text()}catch(e){window.__cwText="ERR "+e.message}},
        writeText:async t=>{window.__wt={task:window.__task,enc:/"enc":"AES-GCM-256"/.test(t)}}};
      Object.defineProperty(navigator,'clipboard',{value:cb,configurable:true});
      navigator.canShare=()=>true; navigator.share=async d=>{window.__sh={task:window.__task,name:d.files[0].name}};
      for(const [id,act] of [["tbkc","backupCopy"],["tbks","backupShare"]]){const bt=document.createElement('button'); bt.id=id; bt.dataset.act=act; bt.textContent=act; bt.style.cssText="position:fixed;left:10px;top:"+(id==="tbkc"?10:70)+"px;width:120px;height:44px;z-index:99"; document.body.appendChild(bt)}});
    await p.click('#tbkc'); await p.waitForTimeout(1200);
    const c=await p.evaluate(()=>({cw:window.__cw||null,cwEnc:/"enc":"AES-GCM-256"/.test(window.__cwText||""),wt:window.__wt||null}));
    need((c.cw&&c.cw.task&&c.cwEnc)||(c.wt&&c.wt.task&&c.wt.enc),`C-10 백업 내용 복사: 누른 순간 클립보드에 암호문 (${JSON.stringify(c)})`);
    await p.evaluate(()=>{closeSheet()}); await p.click('#tbks'); await p.waitForTimeout(1200);
    let s=await p.evaluate(()=>({sh:window.__sh||null,ready:!!document.querySelector('#sheetRoot [data-act=readyShare]')}));
    if(!s.sh&&s.ready){await p.click('#sheetRoot [data-act=readyShare]'); await p.waitForTimeout(800); s=await p.evaluate(()=>({sh:window.__sh||null,ready:true}))}
    need(s.sh&&s.sh.task&&/uc-table-backup/.test(s.sh.name),`C-10 백업 파일 보내기: 누른 순간 공유 창(준비된 뒤 한 번 더 누르기 포함) (${JSON.stringify(s)})`);
    await p.context().close()}

  await b.close();
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})();
