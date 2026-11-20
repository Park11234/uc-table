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
// v1.13.0 15차: 열량(7일 평균 90%·하루 최저 70% 이상), 칼슘 7일 평균 93% 이상, 간식 '양 N배'가 실제 배율, 우유 한 컵은 칼슘이 모자란 날만, 하루 2끼의 간식 배율도
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
      for(const [nm,o] of [["1단계",null],["2단계",{day:4,urg:1,well:1,pain:2}],["3단계",{day:1}]])
        for(const [w,sex,age] of [[45,"F",70],[60,"F",35],[80,"M",35]]){
          S.profile={...S.profile,weight:String(w),sex,age:String(age),height:"165",allergies:[],lactose:false}; S.weights=[{date:today(),kg:w}]; S.triggers=[]; S.ratings=[]; S.orders={checked:[],fluidMl:"",other:[]}; setStage(o); S.plan=null; S.swaps={};
          const pl=samplePlan(); const tg=targets(); n++;
          for(const [i,d] of pl.days.entries()){ const t=totals(d.meals.flatMap(m=>m.items)); const tag=`${today()} ${nm} ${w}kg ${i}일`;
            if(d.meals.some(m=>m.empty)) out.push(tag+' 빈 끼니');
            if(t.na>tg.na) out.push(`${tag} 나트륨 ${Math.round(t.na)}>${tg.na}`);
            if(t.ca<tg.ca*0.4) out.push(`${tag} 칼슘 ${Math.round(t.ca)}<${tg.ca}의 40%`);
            const bp=totals(d.meals[0].items).p; if(bp<Math.max(12,Math.round(tg.p*0.2))) out.push(`${tag} 아침 단백질 ${Math.round(bp)}g`) }
          // 7일 평균 칼슘 75% 이상(결정 39: 하루 한 번 간식 + 모자란 날 저녁 우유 한 컵. 우유를 빼면 최저 54%로 떨어져 잡힘)
          {const ca=pl.days.reduce((a,d)=>a+totals(d.meals.flatMap(m=>m.items)).ca,0)/7; if(ca<tg.ca*0.75) out.push(`${today()} ${nm} ${w}kg 7일 평균 칼슘 ${Math.round(ca)}<${tg.ca}의 75%`)}
          // 관해기 7일 평균 식이섬유 17g 이상(v1.5.2에는 곁들임으로 20g, 결정 39로 간식 하나가 되어 최저 18.3g)
          if(nm==="3단계"){ const fi=pl.days.reduce((a,d)=>a+totals(d.meals.flatMap(m=>m.items)).fi,0)/7; if(fi<17) out.push(`${today()} ${nm} ${w}kg 평균 식이섬유 ${fi.toFixed(1)}g`) } }
      // v1.13.0 15차: 예전에는 v1130.cjs가 오늘 날짜 하루로만 보던 열량·칼슘·간식 '양 N배'·우유 한 컵 규칙을 날짜 28개로 본다(오늘만 보면 날에 따라 실패했음)
      const snackX=(d,tag)=>{const m=d.meals[3]; const mm=menuList("S").find(x=>x.key===m.key), base=mm&&SAMPLE_FIT.fit(mm); if(!base) return;
        const a=totals(m.items).k/totals(base.items).k; if(m.mult?Math.abs(m.mult-a)>0.06:a>=1.15) out.push(`${tag} 간식 '양 ${m.mult||"표시 없음"}배'인데 실제 ${a.toFixed(2)}배`)};
      for(const [sex,age,w] of [["M","27","63"],["F","45","50"],["M","60","85"]]) for(const st of [1,2,3]){
        S.profile={...S.profile,height:"174",sex,age:String(age),weight:w,allergies:[],lactose:false,skipMeal:""}; S.weights=[]; S.logs={}; S.stageMode=st; S.swaps={}; S.plan=null;
        const pl=samplePlan(), tg=targets(); n++; const ts=pl.days.map(d=>totals(d.meals.flatMap(m=>m.items))); const tag=`${today()} ${sex}${age}/${st}단계`;
        const k=ts.reduce((a,t)=>a+t.k,0)/7/tg.k, kmin=Math.min(...ts.map(t=>t.k/tg.k)), ca=ts.reduce((a,t)=>a+t.ca,0)/7/tg.ca;
        if(k<0.90||kmin<0.70) out.push(`${tag} 열량 7일 평균 ${Math.round(k*100)}%·하루 최저 ${Math.round(kmin*100)}%`);
        if(ca<0.93) out.push(`${tag} 7일 평균 칼슘 ${Math.round(ca*100)}%`);
        for(const [i,d] of pl.days.entries()){ snackX(d,`${tag} ${i}일`); const D=d.meals[2]; if(D.caAdd){const cup=D.items[D.items.length-1]; if(ts[i].ca-totals([cup]).ca>=tg.ca*0.9) out.push(`${tag} ${i}일 칼슘이 충분한데 우유 한 컵`)} } }
      for(const sk of ["B","L","D"]){ S.profile={...S.profile,height:"",age:"40",sex:"M",weight:"70",skipMeal:sk}; S.stageMode=1; S.swaps={}; S.plan=null; n++;
        for(const [i,d] of samplePlan().days.entries()) snackX(d,`${today()} ${sk} 거름 ${i}일`) }
      S.profile={...S.profile,skipMeal:""};
      return {out,n}});
    fails.push(...r.out); plans+=r.n; await ctx.close();
  }
  await b.close();
  console.log(`식단 ${plans}개(날짜 28 × 조건 21), 위반 ${fails.length}건`); for(const f of fails.slice(0,40)) console.log('  ',f);
  if(fails.length){ console.log('FAIL 날짜에 따라 식단 규칙 위반'); process.exitCode=1 } else console.log('OK 날짜별 식단 규칙 통과');
})();
