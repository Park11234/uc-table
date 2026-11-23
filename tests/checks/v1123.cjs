const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
require('../lib/guard.cjs');

/* 검토 13건 반영(2026-10-25, 5차): 직접 고른 단계와 활동기 기록, 점수 0점인데 관해가 아닌 까닭, TW 칸 이름표, 몸무게 확인·범위, 키·나이 범위,
   지난 기록 화면 이스케이프, 백업 비밀번호 확인, 불러오기 전 기록(IndexedDB), 경고 다시 읽힘, 의심 후보 통계 검정, 3일 연속 알림 기준, 먹은 기록 CSV 속도,
   그리고 같은 날 요청한 글자 묶기·자간·작은 글씨 크기 */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const BODY=fs.readFileSync(APP,'utf8');
const page=T('v1123.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+BODY+'</body></html>');
const SEED=()=>{ S.consent={date:today()}; S.onb="done"; S.stageMode="auto"; save(); };
(async()=>{
  const b=await chromium.launch();
  const open=async(opt={})=>{const ctx=await b.newContext({viewport:{width:opt.w||390,height:opt.h||844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); if(!opt.fresh){await p.evaluate(SEED); await p.reload(); await ready()} await p.waitForTimeout(150); return p};
  const L="x=>({...BLANK_LOG(),...x})";

  console.log('== 1 직접 고른 단계(골고루)인데 기록이 가장 부드러운 단계에 맞으면 자동으로 바꿀지 묻는다');
  {const p=await open();
    const r=await p.evaluate(()=>{const t=today(); S.stageMode=3; S.logs={[t]:{...BLANK_LOG(),day:4,bloody:4,blood:2}}; save(); SCR=null; S.tab="plan"; render();
      const txt=[...document.querySelectorAll('#main .banner')].map(x=>x.innerText).join('|'); const alert=document.querySelectorAll('#main .banner.warn[role=alert],#main .banner.crit,#main .banner.urgent').length; const btn=document.querySelector('#main [data-act=stageAutoNow]'); btn?.click();
      const after={mode:S.stageMode,st:currentStage().stage}; S.stageMode="auto"; S.logs={[t]:{...BLANK_LOG(),day:4,bloody:4,blood:2}}; render(); const autoBtn=!!document.querySelector('#main [data-act=stageAutoNow]');
      return {txt,alert,btn:!!btn,after,autoBtn}});
    need(r.btn&&/직접 고른/.test(r.txt)&&/자동으로 바꾸시겠습니까/.test(r.txt)&&!r.alert&&!/활동기|주치의/.test(r.txt),'22차: 경고 없이 식단 안내만 — 직접 고른 단계라 끼니가 그대로라는 말과 묻는 버튼');
    need(r.after.mode==="auto"&&r.after.st===1,`누르면 자동 단계로 바뀌어 저잔사식 (${JSON.stringify(r.after)})`);
    need(!r.autoBtn,'자동 단계일 때는 묻지 않음');
    await p.context().close()}

  console.log('== 2 점수 0점인데 관해가 아닌 날의 까닭');
  {const p=await open();
    const r=await p.evaluate(()=>{const o={}; S.profile.usualBM=5; const a=activity({...BLANK_LOG(),day:5}); o.label=a.label; S.logs={[today()]:{...BLANK_LOG(),day:5}}; o.band=ridgeText().sub;
      o.urg=activity({...BLANK_LOG(),day:2,urg:1}).label; S.profile.usualBM=""; o.plain=activity({...BLANK_LOG(),day:4,bloody:1,blood:1}).label; return o});
    need(/점수는 0점이지만 관해 기준에 맞지 않음/.test(r.label)&&/하루 3회 이하/.test(r.label),`평소 5회·5회 기록: 단계 판정 안의 까닭(하루 3회 기준) (${r.label})`);
    need(!/점수|관해/.test(r.band),`22차: 홈 띠에는 까닭·점수를 말하지 않음 (${r.band})`);
    need(/급박감/.test(r.urg)&&r.plain==="활동기 기준에는 해당하지 않음",'급박감만 있는 날은 급박감, 점수가 있는 날은 원래 문구');
    await p.context().close()}

  console.log('== 3 → 22차: Truelove-Witts 칸은 뺐다. 그 조건은 식단 단계에만');
  {const p=await open();
    const r=await p.evaluate(()=>{const st=o=>activity({...BLANK_LOG(),...o}).stage; return {red:dangerSignals({...BLANK_LOG(),day:15}).severe.length,s:[st({day:15}),st({day:8,bloody:6,blood:3}),st({day:6,blood:3,bloody:3,temp:"37.6"})]}});
    need(r.red===1&&r.s.every(x=>x===1),`22차: TW 칸은 뺐고, 피 없는 15회·혈변 6회·TW 조건은 가장 부드러운 단계 (${r.red}/${r.s})`);
    await p.context().close()}

  console.log('== 4 몸무게: 직전보다 5% 넘게 바뀌면 묻고, 범위 밖이면 알림');
  {const p=await open();
    const r=await p.evaluate(()=>{const o={}, t=today(); S.weights=[{date:addDays(t,-1),kg:54}]; openScr("set-weight");
      const put=v=>{const w=document.getElementById("w_today"); w.value=v; w.dispatchEvent(new Event("input",{bubbles:true})); document.querySelector('[data-act=saveW]').click()};
      put("45"); o.ask=/몸무게가 맞습니까/.test(document.querySelector('#sheetRoot')?.innerText||""); o.n1=S.weights.length; closeSheet(); o.kept=document.getElementById("w_today").value;
      put("53"); o.n2=S.weights.length; o.small=!document.querySelector('#sheetRoot .sheet');
      put("45"); document.querySelector('#sheetRoot [data-act=saveWok]').click(); o.n3=S.weights.find(w=>w.date===t)?.kg;
      put("600"); o.range=document.querySelector('#main').innerText.includes("20~300kg"); o.n4=S.weights.find(w=>w.date===t)?.kg; closeScr(); return o});
    need(r.ask&&r.n1===1&&r.kept==="45",'54 → 45kg: 저장 전에 묻고, 입력은 남김');
    need(r.n2===2&&r.small,'5% 안쪽(53kg)은 묻지 않고 저장');
    need(r.n3===45,"'맞습니다'를 누르면 저장");
    need(r.range&&r.n4===45,'600kg은 안내하고 저장하지 않음');
    await p.context().close()}

  console.log('== 5 키·나이 범위(내 정보·첫 실행 설정)');
  {const p=await open();
    const r=await p.evaluate(()=>{const o={}; const set=(id,v)=>{const el=document.getElementById(id); el.value=v; el.dispatchEvent(new Event("input",{bubbles:true}))};
      openScr("set-profile"); set("p_height","1700"); peSave(); o.h=[SCR?.name,document.querySelector('#main').innerText.includes("키는 100~250cm"),S.profile.height]; closeScr();
      openScr("set-profile"); set("p_age","200"); peSave(); o.a=[SCR?.name,document.querySelector('#main').innerText.includes("나이는 1~120세")]; closeScr();
      openScr("set-profile"); set("p_height","170"); set("p_age","40"); peSave(); o.ok=[!SCR,S.profile.height,S.profile.age];
      S.onb="1"; SCR=null; render(); set("o_weight","700"); document.querySelector('[data-act=onbNext][data-v="2"]').click(); o.onb=[S.onb,document.querySelector('#main').innerText.includes("몸무게는 20~300kg")]; S.onb="done"; render(); return o});
    need(r.h[0]==="set-profile"&&r.h[1]&&r.h[2]!=="1700",'키 1700은 저장하지 않고 안내');
    need(r.a[0]==="set-profile"&&r.a[1],'나이 200은 저장하지 않고 안내');
    need(r.ok[0]&&r.ok[1]==="170"&&r.ok[2]==="40",'범위 안이면 저장');
    need(r.onb[0]==="1"&&r.onb[1],'첫 실행 설정: 몸무게 700이면 다음으로 가지 않음');
    await p.context().close()}

  console.log('== 6 지난 기록 화면의 음식 평가 이름을 글자로');
  {const p=await open();
    const r=await p.evaluate(()=>{const d=addDays(today(),-1); S.ratings=[{date:d,slot:"점심",title:"x",name:'<i id="inj">주입</i>',foodId:null,rating:"bad"}]; S.ate[d]=["L"]; SCR={name:"past",date:d}; render();
      const ok=!document.getElementById("inj")&&document.querySelector('#main').innerText.includes('<i id="inj">'); SCR=null; render(); return ok});
    need(r,'태그가 만들어지지 않고 글자로 보임');
    await p.context().close()}

  console.log('== 7 백업 비밀번호 확인');
  {const p=await open();
    const r=await p.evaluate(async()=>{const o={}; await encSet("네 단어 긴 문장 비밀번호"); o.ok=await encCheck("네 단어 긴 문장 비밀번호"); o.bad=await encCheck("틀린 비밀번호");
      openScr("set-data"); await new Promise(r=>setTimeout(r,150)); render(); o.btn=!!document.querySelector('[data-act=encChk]'); o.when=/마지막 확인/.test(document.querySelector('#main').innerText);
      // 확인용 암호문이 없는 옛 열쇠: 처음 읽을 때 만든다
      const x=await idb("kv","readonly",st=>st.get("bkKey")); const {chk,...old}=x; await idb("kv","readwrite",st=>st.put(old,"bkKey")); Object.assign(ENC,{key:null,ready:false,chk:null}); await encLoad();
      o.legacy=await encCheck("네 단어 긴 문장 비밀번호"); encSheet(); o.hint=/띄어쓰기를 넣은 긴 문장/.test(document.querySelector('#sheetRoot').innerText); closeSheet(); await encOff(); closeScr(); return o});
    need(r.ok===true&&r.bad===false,'맞는 비밀번호는 맞다, 틀리면 아니다');
    need(r.btn&&r.when,"백업 화면에 '비밀번호 확인'과 마지막 확인 날");
    need(r.legacy===true,'확인용 암호문이 없던 옛 열쇠도 확인할 수 있게 됨');
    need(r.hint,'비밀번호를 정할 때 긴 문장을 권함');
    await p.context().close()}

  console.log('== 8 불러오기 전 기록은 IndexedDB에, 보관하지 못하면 알리고 묻는다');
  {const p=await open();
    const r=await p.evaluate(async()=>{const o={}, t=today(); o.t=t; S.logs={[t]:{...BLANK_LOG(),day:1}}; save();
      const raw=JSON.stringify({...JSON.parse(backupJSON()),logs:{"2026-01-01":{...BLANK_LOG(),day:2}}});
      openScr("set-data"); restoreFromText(raw); await restoreApply("replace");
      o.ls=localStorage.getItem(PREV_KEY)===null; o.idb=!!(await idb("kv","readonly",st=>st.get("prev"))); o.logs=Object.keys(S.logs).join(",");
      openScr("set-data"); await new Promise(r=>setTimeout(r,100)); o.btn=!!document.querySelector('[data-act=restoreUndo]'); await restoreUndoGo(); o.undo=Object.keys(S.logs).join(",");
      // 옛 판이 localStorage에 남긴 것은 옮긴다
      await idb("kv","readwrite",st=>st.delete("prev")); localStorage.setItem(PREV_KEY,JSON.stringify({at:new Date().toISOString(),s:{...JSON.parse(backupJSON()),logs:{"2025-05-05":{...BLANK_LOG(),day:1}}}})); PREV.ready=false; await prevLoad();
      o.migr=[localStorage.getItem(PREV_KEY)===null, PREV.meta?.n];
      // 보관하지 못하면(저장 공간 부족) 바로 바꾸지 않고 묻는다
      const oi=window.idb; window.idb=async()=>{throw new Error("quota")}; idb=window.idb; const os=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){if(k===PREV_KEY) throw new Error("quota"); return os.call(this,k,v)};
      restoreFromText(raw); await restoreApply("replace"); o.warn=/보관하지 못했습니다/.test(document.querySelector('#sheetRoot')?.innerText||""); o.unchanged=Object.keys(S.logs).join(",");
      Storage.prototype.setItem=os; idb=oi; window.idb=oi; closeSheet(); closeScr();
      // 초기화하면 지워짐
      await keepPrev(); await wipeLocalCopies(); o.wiped=!(await idb("kv","readonly",st=>st.get("prev"))); return o});
    need(r.ls&&r.idb&&r.logs==="2026-01-01",'불러오기 전 기록을 IndexedDB에 두고 localStorage에는 복사하지 않음');
    need(r.btn&&r.undo===r.t,'되돌리기 버튼이 보이고 되돌림');
    need(r.migr[0]&&r.migr[1]===1,'옛 판의 localStorage 사본을 옮기고 지움');
    need(r.warn&&r.unchanged===r.t,'보관하지 못하면 바꾸지 않고 묻는 창');
    need(r.wiped,'전체 초기화 때 IndexedDB 사본도 지움');
    await p.context().close()}

  console.log('== 9 다시 그려도 같은 안내는 화면 읽기 프로그램이 다시 읽지 않게(22차: 기록값 경고는 없어 범위 오류·백업 안내로 확인)');
  {const p=await open();
    const r=await p.evaluate(()=>{SCR=null; S.tab="plan"; msgs=["몸무게는 20~300kg 사이로 적어야 합니다"]; render();
      const a=document.querySelectorAll('#main [role=alert]').length; render(); const b2=document.querySelectorAll('#main [role=alert]').length;
      msgs=["백업 파일을 만들지 못했습니다"]; render(); const c=document.querySelectorAll('#main [role=alert]').length; const vis=document.querySelectorAll('#main .banner').length; msgs=[]; render(); return {a,b:b2,c,vis}});
    need(r.a>=1&&r.b===0,`처음엔 읽히고 같은 안내를 다시 그리면 role을 뗌 (${r.a} → ${r.b})`);
    need(r.c>=1&&r.vis>=1,'안내가 바뀌면 다시 읽히고, 화면에는 그대로 보임');
    await p.context().close()}

  console.log('== 10 → 22차: 의심 후보 음식 통계는 뺐다(앱이 기록을 분석하지 않음)');
  {const p=await open();
    const r=await p.evaluate(()=>{S.logs={}; for(let i=0;i<15;i++){const d=addDays(today(),-i); S.logs[d]={...BLANK_LOG(),day:i%3?1:7,bloody:i%3?0:2,blood:i%3?0:2}; S.extras[d]=[{name:"후보",amt:100,kcal:1}]} save(); SCR=null; S.tab="log"; render();
      return {fn:typeof foodSuspects, txt:document.querySelector('#main').innerText}});
    need(r.fn==="undefined"&&!/의심|후보/.test(r.txt),`의심 후보 계산·카드 없음 (${r.fn})`);
    await p.context().close()}

  console.log('== 11 → 22차: 3일 연속 알림은 뺐다. 그 기록은 식단 단계에만 씀');
  {const p=await open();
    const r=await p.evaluate(()=>{const t=today(); S.logs={}; for(let i=0;i<3;i++) S.logs[addDays(t,-i)]={...BLANK_LOG(),day:4,bloody:4,blood:2}; SCR=null; S.tab="plan"; render();
      const txt=document.querySelector('#main').innerText; return {fn:typeof trend3,txt:/3일 연속|활동기|주치의/.test(txt),st:currentStage().stage}});
    need(r.fn==="undefined"&&!r.txt&&r.st===1,`3일 연속 알림 없음, 단계는 가장 부드러운 단계 (${r.fn}, ${r.st})`);
    await p.context().close()}

  console.log('== 12 먹은 기록 CSV는 판정 조건을 한 번만 계산');
  {const p=await open();
    const r=await p.evaluate(()=>{const t=today(); const ids=FOODS.filter(f=>!f.prod).slice(0,50).map(f=>f.id); for(let i=0;i<200;i++){const d=addDays(t,-i); S.ate[d]=[...SLOTS]; S.ateMeals[d]=Object.fromEntries(SLOTS.map((sl,k)=>[sl,{t:sl,it:[[ids[(i+k)%50],100]]}])); S.logs[d]={...BLANK_LOG(),day:1}}
      let n=0; const o=window.ctx; ctx=function(){n++; return o.apply(this,arguments)}; const rows=csvRows("meals").length; ctx=o; return {n,rows}});
    need(r.rows>=600&&r.n<=2,`판정 조건 계산 ${r.n}번(줄 ${r.rows}개)`);
    await p.context().close()}

  console.log('== 13 글자 묶기: flex 단추 안 글자 벌어짐, 괄호 뒤 조사, 작은 글씨 크기, 제목 안 작은 글씨 자간');
  {const p=await open({w:360});
    const r=await p.evaluate(()=>{const o={}; S.profile={...S.profile,height:"174",weight:"63",age:"27",sex:"M"}; S.plan=samplePlan(); save(); SCR=null; S.tab="plan"; render();
      const flexKids=()=>[...document.querySelectorAll('.nb,.nw')].filter(e=>/flex|grid/.test(getComputedStyle(e.parentElement).display)).map(e=>e.textContent);
      const sw=document.querySelector('#main .mswap'); o.swap=sw?sw.textContent.trim():""; o.swapW=sw?[...sw.children].filter(e=>e.tagName==="SPAN").length:-1; o.flexHome=flexKids();
      openWizard(addDays(today(),-1)); WZ.step=4; render(); o.flexWz=flexKids();
      const btn=[...document.querySelectorAll('#main .opts button')].find(x=>x.textContent.includes("않는 중")); o.tail=btn?.querySelector('span > .nb')?.textContent||"";
      SCR=null; S.tab="plan"; render(); const m=document.createElement('p'); m.textContent="이 메뉴에는 장에서 가스를 만드는 성분(과당)이 많은 편입니다"; document.querySelector('#main').append(m); groupRefs(m);
      o.paren=[...m.querySelectorAll('.nw')].map(e=>e.textContent);   /* 22차: 용어('?' 단추)가 붙는 FODMAP은 낱말째 묶으므로 다른 괄호로 */
      const g=document.createElement('p'); g.textContent="장에서 가스를 만드는 성분(FODMAP)이 많은 편입니다"; document.querySelector('#main').append(g); groupRefs(g); o.glossWord=g.querySelector('.nw .gq')?.closest('.nw')?.textContent||""; g.remove(); m.remove();
      SCR=null; S.tab="food"; render(); const fg=document.querySelector('#main .fg-h .fg-n'); if(fg){const cs=getComputedStyle(fg); o.track=(parseFloat(cs.letterSpacing)||0)/parseFloat(cs.fontSize)}   // 17차: 자간 0은 'normal'로 읽힘
      showFood("broccoli"); o.small=Math.min(...[...document.querySelectorAll('#sheetRoot small, #main small')].map(e=>parseFloat(getComputedStyle(e).fontSize)));
      try{closeSheet()}catch(e){} return o});
    need(r.swap==="안 먹음·바꾸기"&&r.swapW<=1,`'안 먹음·바꾸기' 단추 글자가 한 덩어리(글자 묶음 ${r.swapW}개)`);
    need(!r.flexHome.length&&!r.flexWz.length,`flex·grid 바로 안에 떨어진 글자 묶음 없음 (${[...r.flexHome,...r.flexWz].join(',')})`);
    need(r.tail==="않는 중",`보기 단추 마지막 두 낱말을 함께 묶음 ('${r.tail}')`);
    need(r.paren.includes(")이"),`닫는 괄호와 조사를 함께 묶음 (${r.paren})`);
    need(r.glossWord==="성분(FODMAP)이",`용어 '?'가 붙은 낱말은 한 덩어리(28차부터 '?' 글자는 화면에만 그려 글에는 없음) ('${r.glossWord}')`);
    need(r.track>=-0.01,`제목 안 작은 글씨 자간 ${r.track?.toFixed(3)}em (제목 자간을 물려받지 않음)`);
    need(r.small>=12,`따로 크기를 안 정한 작은 글씨도 12px 이상 (${r.small})`);
    await p.context().close()}

  await b.close();
  console.log(F.length?`\n실패 ${F.length}건`:'\n모두 통과'); if(F.length) process.exit(1);
})().catch(e=>{console.error(e); process.exit(1)});
