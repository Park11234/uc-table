const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
require('../lib/guard.cjs');

/* v1.13.0(2026-11-01) 사용자 요청 번호별 점검:
   2) 평소 배변 횟수를 안 적으면 1회로 계산·고지, 처음 기록 저장 때 한 번 묻기
   5) 섬유를 줄인 식사는 '증상이 심할 때만 잠깐'이고 치료가 아님(ESPEN·ECCO와 같은 말)
   6) 의심 후보 음식: Benjamini–Hochberg 보정(우연히 걸린 음식은 빠지고 뚜렷한 음식은 남음)
   8) 판매처 표시에 없는 참깨 알레르기도 원재료로 찾아 '절대 금지' */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const page=T('v1130.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const SEED=()=>{ S.consent={date:today()}; S.onb="done"; S.persist="na"; S.stageMode="auto"; S.profile={...S.profile,height:"174",weight:"63",age:"27",sex:"M",usualBM:""}; save(); };
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  /* 2026-11-21: 식단은 날짜로 메뉴를 골라 오늘 날짜로 재면 날에 따라 실패했음(관해기 섬유는 사흘에 하루꼴로 90% 미만, 열량·간식 배율도 가끔). 앱 날짜를 2026-11-02로 고정하고 시간은 흐르게 둔다. 여러 날짜는 plan_dates.cjs와 아래 우유 한 컵 점검이 본다 */
  await ctx.addInitScript(d=>{const _D=Date, OFF=new _D(d+"T12:00:00").getTime()-_D.now(); class D extends _D{constructor(...a){if(!a.length) super(_D.now()+OFF); else super(...a)} static now(){return _D.now()+OFF}} window.Date=D},"2026-11-02");
  const p=await ctx.newPage();
  await p.route(/^https?:/, r=>r.fulfill({body:''}));
  const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
  await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready(); await p.waitForTimeout(150);

  console.log('== 2 평소 배변 횟수: 안 적으면 1회, 고지, 처음 한 번 묻기');
  {const r=await p.evaluate(()=>{const o={}; const L={...BLANK_LOG(),day:2}; o.p=pro2(L); S.profile.usualBM="3"; o.p3=pro2(L); S.profile.usualBM=""; save();
      S.logs={}; S.usualAsk=""; openWizard(today(),true); draft.day=2; S.logs={}; return o});
    need(r.p.base===1&&r.p.assumed&&r.p.sf===1&&r.p3.sf===0,`안 적으면 평소 1회(하루 2회 → 1점), 3회로 적으면 0점 (${JSON.stringify([r.p,r.p3])})`);
    await p.evaluate(()=>{const d=today(); S.logs[d]={...BLANK_LOG(),day:2}; save(); S.tab="plan"; SCR=null; render()});
    const sub=await p.evaluate(()=>ridgeText().sub);
    need(!/점수|계산/.test(sub),`22차: 홈 띠에는 점수 없이 적은 값만 (${sub})`);
    await p.evaluate(()=>{S.logs={}; S.usualAsk=""; save(); openWizard(today(),true); render()});
    await p.click('[data-act=step][data-k=day][data-v="1"]'); await p.click('[data-act=step][data-k=day][data-v="1"]');
    await p.click('[data-act=set][data-k=urg][data-v="0"]'); await p.click('[data-act=set][data-k=blood][data-v="0"]'); await p.click('[data-act=wzNext]');
    const res=await p.evaluate(()=>document.querySelector('#main').innerText);
    need(/평소 하루 배변 횟수를 적지 않아 1회를 평소로 보았습니다/.test(res)&&/식단 단계를 정합니다/.test(res),'기록 요약에 1회를 평소로 보았다는 고지(식단 단계를 정할 때)');
    await p.click('[data-act=saveLog]'); await p.waitForTimeout(100);
    const ask=await p.evaluate(()=>({open:!!document.querySelector('#ua_usual'),asked:S.usualAsk}));
    need(ask.open&&ask.asked,'처음 기록을 저장하면 평소 횟수를 한 번 묻는 창');
    await p.fill('#ua_usual','25'); await p.click('[data-act=usualAskSave]');
    const bad=await p.evaluate(()=>({err:document.querySelector('#ua_err')?.textContent,v:S.profile.usualBM}));
    need(/0~20/.test(bad.err||"")&&bad.v==="",`0~20 밖이면 저장하지 않음 (${JSON.stringify(bad)})`);
    await p.fill('#ua_usual','2'); await p.click('[data-act=usualAskSave]');
    const ok=await p.evaluate(()=>({v:S.profile.usualBM,closed:!document.querySelector('#ua_usual')}));
    need(ok.v==="2"&&ok.closed,`평소 2회로 저장 (${JSON.stringify(ok)})`);
    const again=await p.evaluate(()=>{S.profile.usualBM=""; save(); openWizard(today(),true); draft.day=1; S.logs[today()]={...BLANK_LOG(),day:1}; return S.usualAsk});
    need(!!again,'한 번 물은 뒤에는 다시 묻지 않음(usualAsk 기록)');
    const norm=await p.evaluate(()=>[normalizeState({...JSON.parse(JSON.stringify(S)),usualAsk:"2026-11-01"}).usualAsk, normalizeState({...JSON.parse(JSON.stringify(S)),usualAsk:"<b>"}).usualAsk]);
    need(norm[0]==="2026-11-01"&&norm[1]==="",`불러오기 검사는 날짜만 남김 (${norm})`)}

  console.log('== 5 섬유를 줄인 식사는 증상이 심할 때만, 치료가 아님');
  {const r=await p.evaluate(()=>{SCR={name:"set-stage"}; render(); const t=document.querySelector('#main').innerText; SCR=null; render(); const q=QA.find(x=>x.id==="veg_fiber"); return {t,qa:q?q.a:""}});
    need(/증상이 심할 때만 잠깐/.test(r.t)&&/치료가 아닙니다/.test(r.t)&&/IBD 식단/.test(r.t),'식단 단계 화면에 증상 완화용·치료 아님·ESPEN');
    need(/증상이 심할 때만 쓰고 기록이 좋아지면 다시 늘립니다/.test(r.qa),'궁금한 점(채소·섬유)도 같은 말')}

  console.log('== 6 → 22차: 의심 후보 음식 통계(다중 비교 보정 포함)는 뺐다');
  {const r=await p.evaluate(()=>[typeof foodSuspects,typeof bhCut,typeof suspectsHTML]);
    need(r.every(x=>x==="undefined"),`통계 함수 없음 (${r})`)}

  console.log('== 8 판매처 표시에 없는 참깨도 알레르기로');
  {const r=await p.evaluate(()=>{const f=FOODS.find(x=>/햇반솥반 소고기우엉밥/.test(x.name)); if(!f) return null; const c={...ctx(),allergies:["sesame"]}; return {name:f.name,tags:f.tags.filter(t=>["sesame","soy","wheat","beef"].includes(t)),lv:foodStatus(f,c).level}});
    need(r&&r.tags.includes("sesame")&&r.lv==="ban",`참깨 알레르기면 '절대 금지' (${JSON.stringify(r)})`)}

  console.log('== 19 하루 2끼(거르는 끼니를 직접 고름)');
  {const r=await p.evaluate(()=>{const o={}; S.logs={}; S.swaps={}; openScr("set-diet"); o.ui=!!document.querySelector('[data-act=mealsN][data-v="2"]');
      document.querySelector('[data-act=mealsN][data-v="2"]').click(); o.pick=[...document.querySelectorAll('[data-act=skipPick]')].map(b=>b.textContent+(b.getAttribute('aria-pressed')==="true"?"*":"")).join(",");
      document.querySelector('[data-act=skipPick][data-v="L"]').click(); document.querySelector('[data-act=peSave]').click(); o.saved=S.profile.skipMeal;
      S.plan=null; S.tab="plan"; SCR=null; render(); const P=S.plan, tg=targets();
      o.off=P.days.every(d=>d.meals.length===4&&d.meals[1].off&&!d.meals[0].off&&!d.meals[2].off);
      o.rows=[...document.querySelectorAll('#main .meals .mrow .slot')].map(x=>x.textContent).join(",");
      o.task=[...document.querySelectorAll('#main *')].map(x=>x.textContent.trim()).find(t=>/^'먹음'·'안 먹음'을 표시한 끼니 \d\/\d$/.test(t));
      const ks=P.days.map(d=>totals(d.meals.flatMap(m=>m.items)).k/tg.k); o.kcal=[Math.min(...ks),ks.reduce((a,x)=>a+x,0)/7];
      o.mult=P.days.filter(d=>d.meals[3].mult>1).length; o.multTxt=(document.querySelector('#main .meals')?.innerText||"").match(/양 [\d.]+배/)?.[0]||"";
      o.norm=[normalizeState({...JSON.parse(JSON.stringify(S)),profile:{...S.profile,skipMeal:"X"}}).profile.skipMeal, normalizeState(JSON.parse(JSON.stringify(S))).profile.skipMeal];
      S.profile.skipMeal=""; S.plan=null; save(); render(); o.back=S.plan.days[0].meals.filter(m=>m.off).length; return o});
    need(r.ui&&/아침\*/.test(r.pick)&&r.saved==="L",`식성·예산에서 2끼와 거르는 끼니를 고름 (${r.pick} → ${r.saved})`);
    need(r.off&&r.rows==="아침,저녁,간식",`점심을 거르면 아침·저녁·간식만 보임 (${r.rows})`);
    need(/표시한 끼니 0\/2$/.test(r.task||""),`'끼니 표시'도 두 끼 기준 (${r.task})`);
    need(r.kcal[0]>=0.7&&r.kcal[1]>=0.85,`두 끼여도 하루 열량이 7일 평균 목표의 85%·하루 70% 이상(양을 2배까지, 섬유를 줄인 식사에서는 다 못 채울 수 있음) (최저 ${Math.round(r.kcal[0]*100)}%, 평균 ${Math.round(r.kcal[1]*100)}%)`);
    need(r.mult>0&&!!r.multTxt,`열량이 모자란 날은 간식 양을 늘리고 '양 N배'로 알림 (${r.mult}일, ${r.multTxt})`);
    need(r.norm[0]===""&&r.norm[1]==="L"&&r.back===0,`불러오기 검사·3끼로 되돌리기 (${r.norm}, ${r.back})`)}

  console.log('== 20 간식도 내 메뉴로');
  {const r=await p.evaluate(()=>{const o={}; S.myMenus=[]; S.swaps={}; S.plan=null; S.tab="plan"; SCR=null; render();
      MP={k:3,q:""}; renderMenuPick(); o.btn=!!document.querySelector('#sheetRoot [data-act=myMenuNew]'); document.querySelector('#sheetRoot [data-act=myMenuNew]').click();
      o.slot=MM.slot; o.chips=[...document.querySelectorAll('#sheetRoot [data-act=mmSlot]')].map(b=>b.textContent).join(",");
      MM.items=[["banana",100],["soy_milk",190]]; MM.title="내 바나나 두유"; renderMyMenu(); document.querySelector('#sheetRoot [data-act=mmSave]').click();
      const u=S.myMenus.at(-1); o.u=u&&u.slot; o.snack=S.plan.days[curDayIdx()].meals[3].title; o.kept=normalizeState(JSON.parse(JSON.stringify(S))).myMenus.some(x=>x.slot==="S");
      return o});
    need(r.btn&&r.slot==="S"&&/간식/.test(r.chips),`간식 메뉴 고르기에도 '내 메뉴 만들기', 끼니 칸에 간식 (${r.chips})`);
    need(r.u==="S"&&r.snack==="내 바나나 두유"&&r.kept,`만든 간식이 그날 간식 칸에 들어가고 불러오기 검사에서 남음 (${r.snack})`)}

  console.log('== 11~13 칼슘·섬유·열량(메뉴를 고를 때 우선, 간식 양)');
  {const r=await p.evaluate(()=>{const out={}; S.myMenus=[]; S.swaps={};
      for(const [sex,age,w] of [["M","27","63"],["F","45","50"],["M","60","85"]]) for(const st of [1,2,3]){
        S.profile={...S.profile,sex,age,weight:w,lactose:false,skipMeal:""}; S.stageMode=st; const P=samplePlan(), tg=targets(); const ts=P.days.map(d=>totals(d.meals.flatMap(m=>m.items)));
        const avg=k=>ts.reduce((a,t)=>a+t[k],0)/7;
        out[sex+age+"/"+st]={ca:avg("ca")/tg.ca,k:avg("k")/tg.k,kmin:Math.min(...ts.map(t=>t.k/tg.k)),fi:tg.fiber.goal?avg("fi")/tg.fiber.goal:null,mult:P.days.some(d=>d.meals[3].mult)}}
      S.stageMode="auto"; S.profile={...S.profile,sex:"M",age:"27",weight:"63"}; S.plan=null; return out});
    const v=Object.values(r);
    // 15차: 기준은 날짜 28개로 잰 값(plan_dates.cjs). 예전 기준(칼슘 95%·열량 93%/하루 85%)은 이 점검을 만든 날에만 맞아 날에 따라 실패했음
    need(v.every(x=>x.ca>=0.93),`7일 평균 칼슘이 권장량의 93% 이상 (${Object.entries(r).map(([k,x])=>k+":"+Math.round(x.ca*100)).join(" ")})`);
    need(v.every(x=>x.k>=0.90&&x.kmin>=0.70),`7일 평균 열량 90% 이상·하루 최저 70% 이상 (${Object.entries(r).map(([k,x])=>k+":"+Math.round(x.k*100)+"/"+Math.round(x.kmin*100)).join(" ")})`);
    need(v.filter(x=>x.fi!=null).every(x=>x.fi>=0.9),`관해기 7일 평균 식이섬유가 충분섭취량의 90% 이상 (${Object.entries(r).filter(([,x])=>x.fi!=null).map(([k,x])=>k+":"+Math.round(x.fi*100)).join(" ")})`)}

  console.log("== 28 전문 용어 옆 윗첨자 '?'");
  {const r=await p.evaluate(()=>{const o={}; S.logs[today()]={...BLANK_LOG(),day:3,bloody:1,blood:1}; save(); openWizard(today()); WZ.step=WS().length-1; render();
      const q=document.querySelector('#main .gq-b[data-v=tw]'); o.tw=!!q&&/Truelove-Witts/.test(q.closest('sup').previousSibling?.textContent||""); o.count=document.querySelectorAll('#main .gq-b[data-v=tw]').length;
      q?.click(); o.sheet=document.querySelector('#sheetRoot')?.innerText||""; closeSheet(); SCR=null; render();
      openScr("set-stage"); o.low=!!document.querySelector('#main .gq-b[data-v=lowres]'); o.inBtn=!!document.querySelector('#main button .gq-b');
      openScr("set-about"); o.fod=!!document.querySelector('#main .gq-b[data-v=fodmap]');
      SCR=null; render(); return o});
    need(!r.tw&&r.count===0,`22차: 기록 요약에는 Truelove-Witts 칸·풀이가 없음 (${r.count})`);
    need(!r.low&&!r.inBtn,"30차: 식단 단계 화면 저잔사식 옆에 '?' 없음, 단추 안에도 넣지 않음");
    need(r.fod,"다른 용어(FODMAP) 옆 '?'는 그대로")}

  console.log('== 2026-11-01 외부 검토 반영(저녁 거름 우유·간식 배율·첫 실행 안내·끼니 알림·합치기·나트륨)');
  {const r=await p.evaluate(()=>{const o={}; const keep=JSON.parse(JSON.stringify({profile:S.profile,orders:S.orders,remind:S.remind,stageMode:S.stageMode}));
      S.logs={}; S.swaps={}; S.stageMode="auto";
      // 저녁을 거르면 우유 한 컵이 보이지 않는 칸에 들어가지 않는다
      S.profile={...S.profile,age:"27",sex:"M",height:"174",weight:"63",skipMeal:"D",allergies:[]}; S.orders={checked:[],other:[]}; S.stageMode=1;   /* 11-02: 우유는 모든 조정 뒤에도 모자란 날만이라, 우유가 붙는 날이 있는 조건으로 */
      let P=samplePlan(); S.stageMode="auto"; o.hidden=P.days.filter(d=>d.meals.some(m=>m.off&&m.items.length)).length;
      o.cups=P.days.flatMap(d=>d.meals.filter(m=>m.caAdd).map(m=>m.slot+"|"+(m.tip2||""))); 
      // 간식 '양 N배'는 실제로 늘어난 열량 배율
      S.profile={...S.profile,age:"40",sex:"M",height:"",weight:"70",skipMeal:"L"}; S.stageMode=1; P=samplePlan(); o.mult=[];
      for(const d of P.days){const m=d.meals[3]; if(!m.mult) continue; const mm=menuList("S").find(x=>x.key===m.key), base=mm&&SAMPLE_FIT.fit(mm); if(base) o.mult.push([m.mult,Math.round(totals(m.items).k/totals(base.items).k*100)/100])}
      S.stageMode="auto";
      // 첫 실행 안내의 평소 배변 횟수
      o.onb=["0","1","2","3"].map(st=>{S.onb=st; return viewOnboard()}).join(" "); S.onb="done";
      // 거르는 끼니의 알림은 띄우지 않는다
      S.profile.skipMeal="B"; S.remind={...S.remind,on:["B","log"],t:{...S.remind.t,B:"00:00",log:"00:01"}}; delete S.logs[today()];
      o.due=remindDue()?.k||null; o.ics=/아침 식사 기록/.test(icsText());
      // 합치기는 '하루 3끼'("")를 백업의 '아침 거름'으로 바꾸지 않는다
      const cur=JSON.parse(JSON.stringify(S)); cur.profile.skipMeal=""; const bk=JSON.parse(JSON.stringify(S)); bk.profile.skipMeal="B"; o.merge=mergeStates(cur,bk).profile.skipMeal;
      // 메뉴가 아주 적어 마지막 단계로 고를 때도 나트륨 상한 안, 넘는 날은 홈에 안내
      S.profile={...S.profile,age:"84",sex:"F",height:"155",weight:"48",allergies:["squid","clam"],skipMeal:""}; S.orders={checked:["lowsalt","lowfodmap","liquid"],other:[]};
      P=samplePlan(); o.naLim=naLimit(); o.na=P.days.map(d=>Math.round(totals(d.meals.flatMap(m=>m.items)).na));
      S.plan=P; PLAN_SIG=planInputSig(); S.plan.days[S.selDay||0].meals[0].items.push(["ramen",120]); S.tab="plan"; SCR=null; render();   /* 그날 계획에 라면을 더해 상한을 넘김 */
      o.naNote=[...document.querySelectorAll('#main .note-card b')].some(x=>/나트륨이 하루 상한보다 많습니다/.test(x.textContent));
      Object.assign(S,keep); S.plan=null; S.stageMode="auto"; save(); render(); return o});
    need(r.hidden===0&&r.cups.length>0&&r.cups.every(c=>!/^저녁\|/.test(c)&&/(아침|점심)에 한 컵/.test(c)&&/두 끼와 간식/.test(c)),`저녁을 거르면 우유 한 컵은 보이는 끼니에, 안내도 그 끼니 이름으로 (${r.hidden}, ${r.cups[0]||"없음"})`);
    need(r.mult.length>0&&r.mult.every(([m,a])=>Math.abs(m-a)<=0.06&&m>=1.1),`간식 '양 N배'가 실제 열량 배율과 같음 (${JSON.stringify(r.mult.slice(0,4))})`);
    need(/비우면 하루 1회로 봅니다/.test(r.onb)&&!/비우면 하루 3회로/.test(r.onb),"첫 실행 안내도 '비우면 하루 1회로 봅니다'");
    need(r.due==="log"&&!r.ics,`아침을 거르면 아침 알림 대신 증상 기록 알림, 캘린더 파일에도 없음 (${r.due}, ${r.ics})`);
    need(r.merge==="",`백업 합치기가 '하루 3끼'를 바꾸지 않음 (${r.merge})`);
    need(r.na.every(x=>x<=r.naLim)&&r.naNote,`메뉴가 적어도 나트륨 상한 안(${r.na.join("/")} ≤ ${r.naLim}), 넘는 날은 홈 안내`)}

  console.log('== 2026-11-02 다시 확인한 문제(빈 간식 칸과 열량 안내·거르는 끼니 알림 설정)');
  {const r=await p.evaluate(()=>{const o={}; const keep=JSON.parse(JSON.stringify({profile:S.profile,orders:S.orders,remind:S.remind}));
      S.logs={}; S.swaps={}; S.stageMode="auto";
      // 간식 칸이 비었어도(나트륨 여유가 없어서) 열량이 목표보다 크게 적으면 홈에 알린다
      S.profile={...S.profile,age:"84",sex:"F",height:"155",weight:"48",allergies:["squid","clam"],skipMeal:""}; S.orders={checked:["lowsalt","lowfodmap","liquid"],other:[]};
      S.plan=null; S.tab="plan"; SCR=null; render(); const d=S.plan.days[S.selDay||0];
      o.snackEmpty=!!d.meals[3].empty; o.pct=Math.round(totals(d.meals.flatMap(m=>m.items)).k/targets().k*100);
      o.kNote=[...document.querySelectorAll('#main .note-card b')].some(x=>/계획 열량이 목표보다 적습니다/.test(x.textContent));
      // 아침을 거르면 알림 설정·요약·캘린더 버튼이 아침 알림을 세지 않는다
      S.profile={...keep.profile,skipMeal:"B"}; S.orders=keep.orders; S.remind={...S.remind,on:["B"]};
      openScr("set-remind"); o.bRow=!!document.querySelector('#main [data-rem="B"]'); o.lRow=!!document.querySelector('#main [data-rem="L"]');
      o.icsDisabled=!!document.querySelector('#main [data-act="icsSave"]')?.disabled; o.hint=document.querySelector('#main')?.innerText||"";
      SCR=null; S.tab="me"; render(); o.meRow=[...document.querySelectorAll('#main .lrow')].map(x=>x.innerText).find(t=>/^알림/.test(t.trim()))||"";
      S.remind={...S.remind,on:["B","log"]}; render(); o.meRow2=[...document.querySelectorAll('#main .lrow')].map(x=>x.innerText).find(t=>/^알림/.test(t.trim()))||"";
      Object.assign(S,keep); S.plan=null; SCR=null; S.tab="plan"; save(); render(); return o});
    need(r.snackEmpty&&r.pct<85&&r.kNote,`간식 칸이 비어도 열량이 목표의 ${r.pct}%면 '계획 열량이 목표보다 적습니다' (간식 빔 ${r.snackEmpty})`);
    need(!r.bRow&&r.lRow&&/거르는 아침/.test(r.hint),`아침을 거르면 알림 설정에 아침 줄이 없고 그 까닭을 적음 (아침 줄 ${r.bRow})`);
    need(r.icsDisabled&&!/캘린더 1개/.test(r.meRow)&&/캘린더 1개/.test(r.meRow2),`거르는 끼니 알림만 켜져 있으면 캘린더 파일 단추는 꺼지고 요약도 세지 않음 (${r.icsDisabled} / ${r.meRow.replace(/\s+/g," ")} / ${r.meRow2.replace(/\s+/g," ")})`)}

  console.log('== 2026-11-02 우유 한 컵은 모든 조정이 끝난 뒤에도 칼슘이 모자란 날만(날짜를 고정해 여러 날짜로)');
  {const bad=[], seen={cup:0,days:0};
    for(const day of ["2026-11-02","2026-01-05","2026-06-10"]){
      const c2=await b.newContext({viewport:{width:390,height:844}});
      await c2.addInitScript(d=>{const FIX=new Date(d+"T12:00:00").getTime(); const _D=Date; class D extends _D{constructor(...a){if(!a.length) super(FIX); else super(...a)} static now(){return FIX}} D.UTC=_D.UTC; D.parse=_D.parse; window.Date=D},day);
      const q=await c2.newPage(); await q.goto('file://'+page); await q.waitForFunction(()=>typeof render==="function");
      const r=await q.evaluate(()=>{S.consent={date:today()}; S.onb="done"; const out=[];
        for(const [sex,age,w,h] of [["M","27","63","174"],["F","45","50","160"],["M","60","85",""],["M","60","85","175"]]) for(const st of [1,2,3]) for(const sk of ["","D"]){
          S.profile={...S.profile,sex,age,weight:w,height:h,lactose:false,allergies:[],skipMeal:sk}; S.orders={checked:[],other:[]}; S.stageMode=st; S.swaps={}; const P=samplePlan(), tg=targets();
          for(const d of P.days){const D=d.meals.find(m=>m.caAdd); const all=totals(d.meals.flatMap(m=>m.items)).ca; const cup=D?D.items[D.items.length-1]:null;
            out.push({who:[sex,age,w,h,st,sk||"-",d.date].join("/"),cup:!!D,before:Math.round(cup?all-totals([cup]).ca:all),tg:tg.ca,tip:!!D&&/90%에 못 미치는 날/.test(D.tip2||"")})}}
        return out});
      for(const x of r){seen.days++; if(x.cup){seen.cup++; if(x.before>=x.tg*0.9||!x.tip) bad.push(x.who+" "+x.before+"/"+x.tg)}}
      await c2.close()}
    need(seen.cup>0&&bad.length===0,`우유를 붙인 날은 간식·양 조절까지 끝난 뒤에도 우유 없이 칼슘이 권장량의 90% 미만 (${seen.cup}/${seen.days}일, 잘못 ${bad.length}: ${bad.slice(0,3).join(", ")})`)}

  console.log('== 2026-11-02 리팩토링: 같은 주의 음식은 두 화면에서 같은 줄로');
  {const r=await p.evaluate(()=>{const keep=JSON.stringify({triggers:S.triggers,logs:S.logs,reintro:S.reintro});
      S.triggers=[{name:"날짜없음",source:"직접",date:"",sym:["gas"],never:false},{name:"옛 음식",foodId:"no_such_food",source:"식단 평가",date:"2026-10-01",sym:[],never:false},{name:"설명없음",source:"직접",date:"",sym:[],never:false}];
      S.reintro={active:null,history:[]}; const o={};
      const row=(sel,name)=>[...document.querySelectorAll(sel)].map(b=>({t:b.querySelector('small')?.textContent||"",ban:!!b.querySelector('.lic.t-plain'),n:b.querySelector('b')?.textContent})).find(x=>x.n===name);
      SCR=null; openScr("reintro"); o.ri1=row('#main [data-act=riStart]',"날짜없음"); o.ri2=row('#main [data-act=riStart]',"옛 음식"); o.ri3=row('#main [data-act=riStart]',"설명없음");
      SCR=null; openScr("set-trig"); o.tg1=row('#main .trow',"날짜없음"); o.tg2=row('#main .trow',"옛 음식");
      Object.assign(S,JSON.parse(keep)); SCR=null; render(); return o});
    need(r.ri1&&r.tg1&&r.ri1.t===r.tg1.t&&!/·\s*·/.test(r.ri1.t)&&r.ri3&&r.ri3.t.trim()==="직접",`날짜 없는 주의 음식: 두 화면 같은 설명, '·'가 겹치거나 끝에 남지 않음 ('${r.ri1?.t}' / '${r.tg1?.t}' / '${r.ri3?.t}')`);
    need(r.ri2&&r.tg2&&r.ri2.ban&&r.tg2.ban,`목록에 없는 음식 번호면 두 화면 모두 금지 아이콘 (${r.ri2?.ban}/${r.tg2?.ban})`)}

  console.log('== 2026-11-02 리팩토링: 먹은 음식 규칙(기름 빼기)·백업 암호화 IV');
  {const r=await p.evaluate(async()=>{const keep=JSON.stringify({ateMeals:S.ateMeals,extras:S.extras,ratings:S.ratings}); const o={}; const t=today();
      S.extras={}; S.ratings=[]; S.ateMeals={}; for(let i=0;i<10;i++) S.ateMeals[addDays(t,-i)]={"아침":{t:"x",it:[["olive_oil",5],["white_rice",200]]}};
      o.recent=recentFoods(20); o.slot=slotFoods("B",20);
      Object.assign(S,JSON.parse(keep));
      await encSet("시험비밀번호99"); const w1=JSON.parse(await encWrap("같은 글")), w2=JSON.parse(await encWrap("같은 글")); o.ivDiff=w1.iv!==w2.iv&&w1.ct!==w2.ct; o.back=await encUnwrap(w1,"시험비밀번호99"); await encOff();
      return o});
    need(!r.recent.includes("olive_oil")&&r.recent.includes("white_rice")&&!r.slot.includes("olive_oil")&&r.slot.includes("white_rice"),`'먹음' 끼니의 기름은 자주 먹은 음식에 넣지 않음 (${r.recent.slice(0,3)} / ${r.slot.slice(0,3)})`);
    need(r.ivDiff&&r.back==="같은 글",`같은 백업을 두 번 암호화해도 IV·암호문이 다르고 풀면 원래 글 (${r.ivDiff})`)}

  await ctx.close(); await b.close();
  console.log(F.length?`\n실패 ${F.length}건`:'\n모두 통과'); process.exit(F.length?1:0);
})().catch(e=>{console.error(e); process.exit(1)});
