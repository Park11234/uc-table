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
// 날짜를 바꿔 가며 예시 식단 규칙 확인(v1.5.1): 식단은 날짜로 메뉴를 고르므로, 오늘만 보면 특정 날에만 생기는 위반을 놓친다.
// 1년 동안 13일 간격 28개 날짜 × 단계·체중·나이 조합에서 7일 식단의 하루 나트륨 상한, 칼슘(권장의 85%), 아침 단백질, 빈 끼니를 확인
const { chromium } = require('playwright');
const page=T('plan_dates.html');
fs_.writeFileSync(page,'<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>');
(async()=>{
  const b=await chromium.launch(); const fails=[]; let plans=0;
  const start=new Date('2026-01-05T09:00:00+09:00').getTime();
  for(let k=0;k<28;k++){
    const ctx=await b.newContext(); const p=await ctx.newPage();
    await p.clock.install({time:new Date(start+k*13*864e5)});
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    await p.goto('file://'+page); await p.waitForTimeout(150);
    const r=await p.evaluate(()=>{const out=[]; let n=0;
      S.consent={date:today()};
      const setStage=o=>{S.logs={}; if(o){for(let i=0;i<3;i++){const d=addDays(today(),-i);S.logs[d]={...BLANK_LOG(),date:d,...o}}} S.stageMode="auto"};
      for(const [nm,o] of [["1단계",null],["2단계",{day:4,urg:1,well:1,pain:2}],["3단계",{day:2}]])
        for(const [w,sex,age] of [[45,"F",70],[60,"F",35],[80,"M",35]]){
          S.profile={...S.profile,weight:String(w),sex,age:String(age),height:"165",allergies:[],lactose:false}; S.weights=[{date:today(),kg:w}]; S.triggers=[]; S.ratings=[]; S.orders={checked:[],fluidMl:"",other:[]}; setStage(o); S.plan=null; S.swaps={};
          const pl=samplePlan(); const tg=targets(); n++;
          for(const [i,d] of pl.days.entries()){ const t=totals(d.meals.flatMap(m=>m.items)); const tag=`${today()} ${nm} ${w}kg ${i}일`;
            if(d.meals.some(m=>m.empty)) out.push(tag+' 빈 끼니');
            if(t.na>tg.na) out.push(`${tag} 나트륨 ${Math.round(t.na)}>${tg.na}`);
            if(t.ca<tg.ca*0.85) out.push(`${tag} 칼슘 ${Math.round(t.ca)}<${tg.ca}`);
            const bp=totals(d.meals[0].items).p; if(bp<Math.max(12,Math.round(tg.p*0.2))) out.push(`${tag} 아침 단백질 ${Math.round(bp)}g`) }
          // 관해기 7일 평균 식이섬유 20g 이상(v1.5.2: 곁들임으로 충분섭취량을 채움)
          if(nm==="3단계"){ const fi=pl.days.reduce((a,d)=>a+totals(d.meals.flatMap(m=>m.items)).fi,0)/7; if(fi<20) out.push(`${today()} ${nm} ${w}kg 평균 식이섬유 ${fi.toFixed(1)}g`) } }
      return {out,n}});
    fails.push(...r.out); plans+=r.n; await ctx.close();
  }
  await b.close();
  console.log(`식단 ${plans}개(날짜 28 × 조건 9), 위반 ${fails.length}건`); for(const f of fails.slice(0,40)) console.log('  ',f);
  if(fails.length){ console.log('FAIL 날짜에 따라 식단 규칙 위반'); process.exitCode=1 } else console.log('OK 날짜별 식단 규칙 통과');
})();
