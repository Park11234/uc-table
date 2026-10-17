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

  await b.close();
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})();
