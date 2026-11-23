const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
require('../lib/guard.cjs');

/* v1.13.0 33차(2026-11-22) 사용자 요청
   1 하루 4끼: 끼니 수를 직접 고르지 않았고 하루 목표 열량이 2,000kcal 이상이면 점심과 저녁 사이에 '오후' 끼니(점심 메뉴)를 더한다.
     '식성·예산'의 하루 끼니 수에 2끼·3끼 옆 4끼. 오후 끼니의 바꾼 메뉴(swaps 'date|4')는 다시 열어도 남는다
   2 숫자 칸에 쉼표(,)를 쓰면 쓰지 말라는 경고 창
   3 캘린더 알림 파일(.ics)의 한 줄은 75바이트 이하(RFC 5545 접기)
   4 사용자에게 영향이 있는 실패(백업 암호화 끄기·자동 백업 폴더 끊기)는 그냥 넘기지 않고 알림 */
const { chromium } = require('playwright');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
fs.mkdirSync(TMP,{recursive:true}); const page=path.join(TMP,'v1130l.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const BIG={height:"174",weight:"85",sex:"M",age:"60"}, SMALL={height:"165",weight:"60",sex:"F",age:"35"};
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844}}); const p=await ctx.newPage(); p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await p.goto('file://'+page); await p.waitForFunction(()=>typeof render==="function");
  const r=await p.evaluate(([BIG,SMALL])=>{ const o={}; S.consent={date:today()}; S.onb="done"; S.logs={};
    const plan=prof=>{Object.assign(S.profile,prof); S.plan=null; S.swaps={}; return samplePlan()};
    // 1 자동 4끼
    Object.assign(S.profile,BIG,{mealsN:"",skipMeal:""}); o.k=targets().k; const p4=plan({});
    o.n4=p4.days.map(d=>d.meals.length); const m4=p4.days[0].meals[4]; o.aft=m4?{slot:m4.slot,fromL:TPL.L.some(m=>m.title===m4.title.replace("현미밥","흰쌀밥")),title:m4.title}:null;
    S.plan=p4; SCR=null; S.tab="plan"; render(); o.order=[...document.querySelectorAll('#main .list.meals .mrow .slot')].map(e=>e.textContent.trim());
    o.cards=[...document.querySelectorAll('#main .list.meals')].map(e=>e.innerText.replace(/\s+/g," ")).join(" ");
    // 2 직접 3끼를 고르면 그대로
    S.profile.mealsN="3"; o.n3=plan({}).days[0].meals.length;
    // 3 목표가 2,000kcal 밑이면 자동 3끼
    Object.assign(S.profile,SMALL,{mealsN:""}); o.kSmall=targets().k; o.nSmall=plan({}).days[0].meals.length;
    // 5 오후 끼니 바꾼 메뉴가 다시 열어도 남음
    Object.assign(S.profile,BIG,{mealsN:"4"}); S.plan=plan({}); const ok=swapMeal(0,4); save(); const n=normalizeState(JSON.parse(JSON.stringify(S)));
    o.swap={ok, kept:Object.keys(n.swaps).some(k=>k.endsWith("|4")), mealsN:n.profile.mealsN};
    // 3 캘린더 줄
    S.remind.on=["B","L","D","log","water"]; const ics=icsText(); const enc=new TextEncoder(); o.icsMax=Math.max(...ics.split("\r\n").map(l=>enc.encode(l).length));
    o.icsUnfold=ics.replace(/\r\n /g,"").includes("DESCRIPTION:물이나 보리차를 한 컵 마십니다. 설사가 잦으면 더 자주 마십니다.");
    return o},[BIG,SMALL]);
  need(r.k>=2000&&r.n4.every(n=>n===5)&&r.aft&&r.aft.slot==="오후"&&r.aft.fromL,`1 목표 ${r.k}kcal(2,000 이상)·끼니 수 안 고름 → 날마다 다섯 칸, 다섯째는 점심 메뉴의 '오후' (${JSON.stringify(r.aft)})`);
  need(r.order.join("|")==="아침|점심|오후|저녁|간식",`1 홈 끼니 순서 아침·점심·오후·저녁·간식 (${r.order.join("|")})`);
  need(r.n3===4,`1 직접 3끼를 고르면 오후 끼니 없음 (${r.n3}칸)`);
  need(r.kSmall<2000&&r.nSmall===4,`1 목표 ${r.kSmall}kcal(2,000 미만)이면 자동 3끼 (${r.nSmall}칸)`);
  need(r.swap.ok&&r.swap.kept&&r.swap.mealsN==="4",`1 오후 끼니 '다른 메뉴'가 되고, 다시 열어도 남음 (${JSON.stringify(r.swap)})`);
  need(r.icsMax<=75&&r.icsUnfold,`3 캘린더 파일 한 줄 75바이트 이하, 펴면 원래 문장 (${r.icsMax}B)`);
  // 1 식성·예산 화면: 2끼·3끼·4끼
  await p.evaluate(BIG=>{Object.assign(S.profile,BIG,{mealsN:"",skipMeal:""}); save(); openScr("set-diet")},BIG); await p.waitForTimeout(100);
  const seg=await p.evaluate(()=>({b:[...document.querySelectorAll('#main [data-act="mealsN"]')].map(e=>e.textContent.trim()+(e.getAttribute("aria-pressed")==="true"?"*":"")), t:document.querySelector('#main').innerText.replace(/\s+/g," ")}));
  need(seg.b.join(",")==="2끼,3끼,4끼*"&&/2,000kcal/.test(seg.t)&&/오후/.test(seg.t),`1 하루 끼니 수: 2끼·3끼·4끼, 자동 4끼 안내 (${seg.b.join(",")})`);
  await p.click('#main [data-act="mealsN"][data-v="3"]'); await p.waitForTimeout(80);
  const seg3=await p.evaluate(()=>[...document.querySelectorAll('#main [data-act="mealsN"]')].map(e=>e.getAttribute("aria-pressed")==="true"?e.textContent.trim():"").join(""));
  need(seg3==="3끼",`1 3끼를 누르면 3끼가 눌림 (${seg3})`);
  // 2 쉼표 경고 창
  await p.evaluate(()=>{closeScr&&closeScr(); openScr("set-profile")}); await p.waitForTimeout(100);
  const sel=await p.evaluate(()=>{const el=[...document.querySelectorAll('#main input[id]')].find(e=>e.type==="number"||/^(decimal|numeric)$/.test(e.getAttribute("inputmode")||"")); if(!el) return null; el.value=""; return "#"+el.id});
  if(sel){ await p.focus(sel); await p.keyboard.type('63,5'); await p.waitForTimeout(100);
    const w=await p.evaluate(s=>{const d=document.getElementById("warnPop"); return {open:!!d, txt:d?d.innerText.replace(/\s+/g," "):"", role:d?.querySelector('[role="alertdialog"]')?1:0, focus:document.activeElement?.id, val:document.querySelector(s).value}},sel);
    await p.keyboard.press('Escape'); await p.waitForTimeout(60);
    const w2=await p.evaluate(s=>({open:!!document.getElementById("warnPop"), back:document.activeElement===document.querySelector(s)}),sel);
    need(w.open&&w.role&&/쉼표/.test(w.txt)&&!w.val.includes(",")&&w.focus==="warnPopOk",`2 숫자 칸에 쉼표를 치면 경고 창, 쉼표는 들어가지 않음 (${JSON.stringify(w)})`);
    need(!w2.open&&w2.back,`2 Esc로 닫으면 그 칸으로 돌아감 (${JSON.stringify(w2)})`);
  } else need(false,'2 숫자 칸을 찾지 못함');
  // 4 실패 알림
  const f4=await p.evaluate(async()=>{const real=idb; const got=[]; const t0=window.toast; window.toast=(m)=>{got.push(m); return t0(m)};
    try{ idb=async()=>{throw new Error("x")}; await encOff(); await folderOff() } finally { idb=real; window.toast=t0 } return got});
  need(f4.some(m=>/암호화/.test(m))&&f4.some(m=>/폴더/.test(m)),`4 암호화 끄기·자동 백업 폴더 끊기가 실패하면 알림 (${f4.join(" / ")})`);
  await ctx.close();
  // 1 조약돌: 고른 끼니 수(2·3·4끼)를 다 먹어야 그날 조약돌. 끼니 수를 바꿔도 지난날은 그날 기준 그대로
  { const c=await b.newContext(); const q=await c.newPage(); await q.goto('file://'+page); await q.waitForTimeout(150);
    const pb=await q.evaluate(BIG=>{const t=today(), y=addDays(t,-1); S.consent={date:t}; S.onb="done"; S.ratings=[]; S.ate={}; S.daySlots={};
      const eat=(d,sls)=>{S.ate[d]=[...sls]}; const o={};
      Object.assign(S.profile,BIG,{mealsN:"",skipMeal:""}); eat(t,["아침","점심","저녁"]); o.four3=dayDone(t); eat(t,["아침","점심","저녁","오후"]); o.four4=dayDone(t);
      S.profile.mealsN="3"; eat(t,["아침","점심","저녁"]); o.three=dayDone(t);
      S.profile.mealsN="2"; S.profile.skipMeal="B"; eat(t,["점심","저녁"]); o.two=dayDone(t);
      // 어제는 3끼로 다 먹은 날(기준 기록이 남음) → 오늘 4끼로 바꿔도 어제 조약돌은 그대로
      S.profile.mealsN="3"; S.profile.skipMeal=""; eat(y,["아침","점심","저녁"]); S.daySlots[y]=["아침","점심","저녁"]; save(); o.rec=JSON.stringify(S.daySlots[t]);
      S.profile.mealsN="4"; o.yKept=dayDone(y); o.n=pebInfo().n; o.kn=howtoHTML().includes("네 끼"); return o},BIG);
    need(!pb.four3&&pb.four4,`1 4끼: 오후까지 네 끼를 먹어야 조약돌 (세 끼 ${pb.four3}, 네 끼 ${pb.four4})`);
    need(pb.three&&pb.two,`1 3끼는 세 끼, 2끼는 두 끼를 먹으면 조약돌 (${pb.three}, ${pb.two})`);
    need(pb.yKept&&pb.rec==='["아침","점심","저녁"]',`1 끼니 수를 4끼로 바꿔도 지난날 조약돌은 그날 기준 그대로, 오늘 기준은 날짜별로 남김 (${pb.yKept}, ${pb.rec})`);
    need(pb.kn,'1 사용 방법 창에 4끼면 "네 끼"'); await c.close() }
  // 1 열량 목표가 큰 사람의 날짜별 하루 열량(31차에 70% 밑으로 떨어진 날)
  for(const date of ['2026-12-09','2026-12-22']){
    const c=await b.newContext(); const q=await c.newPage(); await q.clock.install({time:new Date(date+'T09:00:00+09:00')}); await q.goto('file://'+page); await q.waitForTimeout(150);
    const k=await q.evaluate(BIG=>{S.consent={date:today()}; S.profile={...S.profile,...BIG,allergies:[],lactose:false,skipMeal:"",mealsN:""}; S.weights=[]; S.logs={}; S.stageMode=1; S.swaps={}; S.plan=null;
      const pl=samplePlan(), tg=targets(); return Math.min(...pl.days.map(d=>totals(d.meals.flatMap(m=>m.items)).k/tg.k))},BIG);
    need(k>=0.7,`1 ${date} 남성 60세 85kg 저잔사식: 하루 최저 열량 ${Math.round(k*100)}%(70% 이상)`); await c.close() }
  await b.close();
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exit(1)});   // 중간에 오류가 나면 브라우저를 기다리지 않고 바로 실패
