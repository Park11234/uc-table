const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
require('../lib/guard.cjs');

/* v1.13.0 15차(2026-11-09) 사용자 요청:
   - 응급 안내(119·응급실·오늘 주치의 연락·바로 진료)는 지우고 '병원에 내원하십시오'로만 말한다(조건은 그대로)
     → 22차(2026-11-16): 내원 안내도 모두 뺐다. 조건은 식단 단계를 고르는 데만 쓴다
   - 9번: 음식 판정의 글자 분석을 음식마다 한 번만 해도 판정 결과는 그대로 */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const page=T('v1130b.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const SEED=()=>{ S.consent={date:today()}; S.onb="done"; S.persist="na"; S.stageMode="auto"; S.profile={...S.profile,height:"174",weight:"63",age:"27",sex:"M",usualBM:"1"}; save(); };
const OLD=/119|응급실|오늘 주치의|주치의(\([^)]*\))?(에게|에) 연락|바로 진료|진료를 (먼저 )?받|진료를 미루지/;
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
  await p.route(/^https?:/, r=>r.fulfill({body:''}));
  const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
  await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready();

  console.log('== 22차: 경고 조건에 걸리는 기록도 경고·내원 안내 없이 식단 단계에만 씀(결정 52)');
  {const r=await p.evaluate(()=>{
      const cases={severe:{day:8,bloody:7},urgent:{day:2,bloody:1,blood:3},watch:{day:1,other:["오한"]}};
      const out={};
      for(const [k,v] of Object.entries(cases)){
        const d=today(); S.logs={[d]:{...BLANK_LOG(),...v}}; save(); SCR=null; S.tab="plan"; render(); const home=document.querySelector('#main').innerText;
        const ds=dangerSignals(S.logs[d]);
        openWizard(d); Object.assign(draft,v); WZ.step=WS().length-1; render(); const wz=document.querySelector('#main').innerText;
        closeSheet&&closeSheet(); SCR=null; draft=null;
        out[k]={n:ds[k].length,stage:currentStage().stage,home,wz};
      }
      S.logs={}; save(); render(); return out});
    for(const k of ["severe","urgent","watch"]){const x=r[k];
      need(x.n>0,`${k} 기록이 식단 단계 조건에 걸림`);
      need(!/내원|주치의|경고/.test(x.home)&&!OLD.test(x.home)&&!/내원|주치의/.test(x.wz)&&!OLD.test(x.wz),`${k}: 홈·기록 요약에 경고·내원 안내 없음 (${(x.home.match(/.{0,30}(내원|주치의|경고).{0,30}/)||x.wz.match(/.{0,30}(내원|주치의).{0,30}/)||[""])[0]})`);
    }
    for(const k of ["severe","urgent"]) need(r[k].stage===1,`${k}: 식단 단계는 가장 부드러운 단계 (${r[k].stage})`);
  }
  {const foot=await p.evaluate(()=>/병원에 내원/.test([...document.scripts].map(x=>x.textContent).join('\n')));
    need(!foot,'고정 안내 문장에도 내원 권고 없음');
  }

  console.log('== 9 같은 조건이면 음식 판정을 다시 하지 않는다(식단 바꾸기·음식 탭), 조건이 바뀌면 새로 판정');
  {const r=await p.evaluate(()=>{const orig=window.foodStatus; let n=0; window.foodStatus=function(...a){n++; return orig.apply(this,a)};
      try{ for(let i=0;i<5;i++){const d=addDays(today(),-i); S.logs[d]={...BLANK_LOG(),day:1}} S.plan=null; save(); refreshPlan(); const boot=n;
        n=0; swapMeal(0,1); refreshPlan(); render(); const swap=n;
        n=0; S.tab="food"; SCR=null; render(); const tab=n; S.tab="plan"; render();
        const direct=c=>FOODS.filter(f=>{const s=orig(f,c); return s.level==="ok"||(s.level==="caution"&&!(S.profile.budget==="알뜰"&&f.cost===3))}).map(f=>f.id).join();
        const same=[]; const steps=[()=>{}, ()=>{S.profile.allergies=["shrimp","dairy"]}, ()=>{S.orders.checked=["lowsalt"]}, ()=>{S.profile.age="80"}, ()=>{S.profile.lactose=true},
          ()=>{S.triggers=[{name:"우유",foodId:"milk",date:today()}]}, ()=>{S.profile.allergies=[]; S.orders.checked=[]; S.profile.lactose=false; S.triggers=[]; S.profile.age="27"}];
        for(const st of steps){st(); const c=ctx(); same.push(menuFoods(c).map(f=>f.id).join()===direct(c))}
        return {boot,swap,tab,N:FOODS.length,same} } finally { window.foodStatus=orig; S.logs={}; save() }});
    need(r.boot>=r.N&&r.boot<=r.N+50,`처음 식단: 음식마다 한 번 판정 (${r.boot}/${r.N})`);
    need(r.swap<50,`식단 바꾸기: 판정을 다시 하지 않음 (${r.swap}회)`);
    need(r.tab<50,`음식 탭: 식단에서 낸 판정을 다시 씀 (${r.tab}회)`);
    need(r.same.every(Boolean),`조건을 바꿀 때마다 판정 결과가 새로 계산한 것과 같음 (${r.same})`);
  }

  await b.close();
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exitCode=1});
