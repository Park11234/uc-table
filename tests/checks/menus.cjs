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
// 오프라인 예시 식단 메뉴(300개 이상) 점검: 식품 존재, 단계·조건별 적합성, 저잔사식 규칙, 영양 범위, 다른 메뉴 바꾸기
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
fs.writeFileSync(T('menus.html'),'<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
await p.goto('file://'+WRAP('menus.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{
  S.consent={date:today()};
  const fail=[]; const info={};
  const all=Object.entries(TPL).flatMap(([k,a])=>a.map(m=>[k,m]));
  info.count=Object.fromEntries(Object.entries(TPL).map(([k,a])=>[k,a.length])); info.total=all.length;
  if(all.length<300) fail.push('메뉴 수 '+all.length);
  for(const [k,m] of all){
    for(const [id,g] of m.items){ if(!FOOD[id]) fail.push('없는 식품 '+m.title+':'+id); if(!(g>0&&g<=600)) fail.push('분량 '+m.title+':'+id+g) }
    if(!m.title||!m.tip||!Array.isArray(m.refs)||!m.refs.length) fail.push('설명·근거 없음 '+m.title);
    if(!(m.rec&&m.rec.length)&&k!=="S"&&!(m.cook&&m.cook.length)) fail.push('조리법 없음 '+m.title);
    for(const n of m.refs) if(!REFS[n]) fail.push('없는 근거 '+m.title+':'+n);
    const ids=m.items.map(x=>x[0]); if(new Set(ids).size!==ids.length) fail.push('중복 식품 '+m.title);
  }
  for(const k of Object.keys(TPL)){const t=TPL[k].map(m=>m.title); const d=t.filter((x,i)=>t.indexOf(x)!==i); if(d.length) fail.push('중복 이름 '+k+':'+d.slice(0,3))}
  // 메뉴 키(교체 기억용)는 목록 안에서 겹치지 않고, 레시피 링크는 실제 레시피를 가리킴(v1.5.0)
  for(const k of Object.keys(TPL)){const ks=TPL[k].map(m=>m.key); if(ks.some(x=>!/^[gt]:/.test(x))) fail.push('키 없음 '+k); if(new Set(ks).size!==ks.length) fail.push('중복 키 '+k)}
  for(const [k,m] of all) for(const r of (m.rec||[])) if(!RECIPES[r]) fail.push('없는 레시피 '+m.title+':'+r);
  // 레시피가 가리키는 주재료는 그 메뉴의 식품에 들어 있어야 함(알레르기·단계 판정이 메뉴와 레시피에서 같게)
  for(const [k,m] of all) for(const r of (m.rec||[])) if(RECIPES[r]) for(const f of RECIPES[r].foods) if(!m.items.some(x=>x[0]===f)) fail.push('레시피 재료가 메뉴에 없음 '+m.title+':'+r+':'+f);
  const recN=all.filter(([k,m])=>m.gen&&(m.rec||[]).length).length; info.genWithRecipe=recN; if(recN<200) fail.push('레시피 링크가 있는 생성 메뉴가 적음 '+recN);
  const medN=Object.fromEntries(Object.entries(TPL).map(([k,a])=>[k,a.filter(m=>m.med).length])); info.med=medN;
  if(medN.L<15||medN.D<15||medN.B<5||medN.S<5) fail.push('지중해식 메뉴 수 '+JSON.stringify(medN));
  for(const [k,m] of all) if(m.gen&&/(?<!사)[과와] \S/.test(m.title)) fail.push('이름 형식(○○과 ○○) '+m.title);
  // 영양(단계 제한 없이): 아침 200~800, 점심·저녁 300~950, 곁들임 20~350 kcal
  const rng={B:[200,800],L:[300,950],D:[300,950],S:[20,350]};
  const JUK=new Set(["rice_porridge","chicken_porridge","pumpkin_porridge","veg_porridge","tuna_porridge","abalone_porridge","nurungji","rice_gruel"]);
  for(const [k,m] of all){const t=totals(m.items); if(m.items.some(([id])=>FOOD[id]&&!FOOD[id].k)) continue;
    const lo=(k==="L"||k==="D")&&m.items.some(([id])=>JUK.has(id))?250:rng[k][0];
    if(t.k<lo||t.k>rng[k][1]) fail.push(`열량 ${k} ${m.title} ${Math.round(t.k)}`);
    if(k!=="S"&&t.p<8) fail.push(`단백질 ${m.title} ${Math.round(t.p)}g`)}
  const L0=o=>({day:2,night:0,bloody:0,urg:0,blood:0,well:0,extra:[],pain:0,gas:"없음",fatigue:"없음",temp:"",pulse:"",other:[],memo:"",...o});
  const setStage=o=>{S.logs={}; if(o){for(let i=0;i<3;i++){const d=addDays(today(),-i);S.logs[d]={date:d,...L0(o)}}}};
  const base=JSON.parse(JSON.stringify({profile:S.profile,orders:S.orders,triggers:S.triggers}));
  const scen=[
    ["1단계",null,{}],["2단계",{day:4,urg:1,well:1,pain:2},{}],["3단계",{day:2},{}],
    ["1단계·유당불내증",null,{lactose:true}],["1단계·달걀 알레르기",null,{allergies:["egg"]}],["3단계·생선 알레르기",{day:2},{allergies:["fish"]}],
    ["2단계·알뜰",{day:4,urg:1,well:1,pain:2},{budget:"알뜰"}],["1단계·저지방 지시",null,{},["lowfat"]],["1단계·유동식 지시",null,{},["liquid"]],
  ];
  info.plans={};
  for(const [name,o,prof,orders] of scen){
    S.profile={...JSON.parse(JSON.stringify(base.profile)),...prof}; S.orders={...JSON.parse(JSON.stringify(base.orders)),checked:orders||[]}; S.triggers=[];
    setStage(o); S.plan=null; S.swaps={};
    const c=ctx(); const pl=samplePlan(); const F=SAMPLE_FIT;
    const fitN=Object.fromEntries(["B","L","D","S"].map(k=>[k,TPL[k].filter(m=>F.fit(m)).length]));
    const titles=[]; let empty=0; const kcal=[]; const prot=[];
    for(const d of pl.days){ const t=totals(d.meals.flatMap(m=>m.items)); kcal.push(Math.round(t.k)); prot.push(Math.round(t.p));
      for(const m of d.meals){ if(m.empty){empty++;continue} titles.push(m.title);
        for(const [id,g] of m.items){const s=foodStatus(FOOD[id],c); if(s.level==="later"||s.level==="avoid") fail.push(`${name}: 판정 ${s.level} ${m.title}:${id}`);
          if(c.fiberStage===1){ if(FOOD[id].fi*g/100>=2) fail.push(`${name}: 섬유 ${m.title}:${id}${g}`); if(FOOD[id].cat==="채소"&&g>VEG_CAP) fail.push(`${name}: 채소량 ${id}${g}`); if(FRUIT_CAP[id]&&g>FRUIT_CAP[id]) fail.push(`${name}: 과일량 ${id}${g}`)}
          if(FOOD[id].tags.includes("salty")&&g>SALTY_CAP) fail.push(`${name}: 짠 음식량 ${id}${g}`)}
        if(c.fiberStage===1&&m.items.filter(([id])=>isVegItem(id)).length>1) fail.push(`${name}: 채소 2가지 ${m.title}`);
      }
      const mains=d.meals.map(m=>m.empty?"":mainFood(m)); if(mains[1]&&mains[1]===mains[2]&&!orders) fail.push(`${name}: 점심·저녁 주재료 같음 ${d.date}`);
    }
    const uniq=new Set(titles).size;
    info.plans[name]={stage:c.stage,fitN,empty,uniq,kcal:kcal.join("/"),prot:prot.join("/")};
    if(!orders&&(empty||uniq<18)) fail.push(`${name}: 빈 끼니 ${empty}, 서로 다른 메뉴 ${uniq}/21`);
    if(!orders&&Math.min(fitN.B,fitN.L,fitN.D)<15) fail.push(`${name}: 고를 수 있는 메뉴가 적음 ${JSON.stringify(fitN)}`);
  }
  // v1.5.0 식단 규칙: 체중에 따른 양 조절, 아침 단백질, 나트륨, 관해기 지중해식·섬유, 칼슘
  const planOf=(o,w,sex,age)=>{S.profile={...JSON.parse(JSON.stringify(base.profile)),weight:String(w),sex,age:String(age),height:"165"}; S.weights=[{date:today(),kg:w}]; S.orders=JSON.parse(JSON.stringify(base.orders)); S.triggers=[]; S.ratings=[]; setStage(o); S.plan=null; S.swaps={}; const pl=samplePlan(); return {pl,tg:targets(),c:ctx()}};
  const dayT=d=>totals(d.meals.flatMap(m=>m.items));
  const avgK={}; info.v150={};
  for(const [nm,o] of [["1단계",null],["2단계",{day:4,urg:1,well:1,pain:2}],["3단계",{day:2}]]){
    for(const w of [45,60,80]){ const {pl,tg,c}=planOf(o,w,w===80?"M":"F",w===45?70:35); const ts=pl.days.map(dayT);
      avgK[nm+w]=ts.reduce((a,t)=>a+t.k,0)/7;
      for(const [i,t] of ts.entries()){ if(t.na>tg.na) fail.push(`${nm} ${w}kg 나트륨 ${Math.round(t.na)}>${tg.na} (${i}일)`);
        const bp=totals(pl.days[i].meals[0].items).p; if(bp<Math.max(12,Math.round(tg.p*0.2))) fail.push(`${nm} ${w}kg 아침 단백질 ${Math.round(bp)}g`);
        if(t.ca<tg.ca*0.85) fail.push(`${nm} ${w}kg 칼슘 ${Math.round(t.ca)}<${tg.ca}`) }
      if(w===60&&avgK[nm+w]<tg.k*0.85) fail.push(`${nm} 60kg 평균 열량 ${Math.round(avgK[nm+w])}/${tg.k}`);
      if(c.stage===3){ const medMeals=pl.days.reduce((a,d)=>a+d.meals.filter(m=>m.med).length,0); const fi=ts.map(t=>t.fi); const avgFi=fi.reduce((a,x)=>a+x,0)/7;
        info.v150[nm+w]={medMeals,avgFi:Math.round(avgFi*10)/10,minFi:Math.round(Math.min(...fi)*10)/10};
        if(medMeals<12) fail.push(`관해기 지중해식 끼니 ${medMeals}/21`); if(avgFi<20) fail.push(`관해기 평균 식이섬유 ${Math.round(avgFi)}g`) }
    }
    if(!(avgK[nm+80]>avgK[nm+60]&&avgK[nm+60]>avgK[nm+45])) fail.push(`${nm}: 체중에 따라 열량이 늘지 않음 ${[45,60,80].map(w=>Math.round(avgK[nm+w])).join('/')}`);
  }
  info.avgK=Object.fromEntries(Object.entries(avgK).map(([k,v])=>[k,Math.round(v)]));
  // 좋았던 식품(끼니 평가 '좋음')이 든 메뉴를 먼저 고름
  { planOf({day:2},60,"F",35); S.ratings=[{date:addDays(today(),-1),slot:"점심",title:"x",foodId:"salmon",rating:"good"}]; const pl=samplePlan();
    const n=pl.days.filter(d=>d.meals.some(m=>m.items.some(([id])=>id==="salmon"))).length; info.likedSalmonDays=n; if(n<5) fail.push('좋았던 식품 반영 '+n+'일');
    S.ratings=[{date:addDays(today(),-1),slot:"점심",title:"x",foodId:"salmon",rating:"bad"}]; const pl2=samplePlan();
    const n2=pl2.days.filter(d=>d.meals.some(m=>m.items.some(([id])=>id==="salmon"))).length; if(n2>0) fail.push('나빴던 식품이 들어감 '+n2+'일'); S.ratings=[] }
  // 교체 기억: 키로 저장되고 다시 불러와도 유지, 예전 번호 값은 버림
  { planOf(null,60,"F",35); const d0=S.plan=samplePlan(); const key=TPL.L.find(m=>SAMPLE_FIT.fit(m)&&m.title!==d0.days[0].meals[1].title).key; setSwap(d0.days[0].date,1,key);
    if(S.plan.days[0].meals[1].key!==key) fail.push('교체한 메뉴가 식단에 없음');
    const re=normalizeState(JSON.parse(JSON.stringify({...S,swaps:{...S.swaps,[addDays(today(),1)+"|0"]:5}})));
    if(re.swaps[`${d0.days[0].date}|1`]!==key) fail.push('교체 키가 저장되지 않음'); if(Object.values(re.swaps).some(v=>typeof v!=="string")) fail.push('예전 번호 교체가 남음');
    S.swaps={} }
  // 다른 메뉴: 5번 연속 바꿔도 조건에 맞고 서로 다름
  S.profile=JSON.parse(JSON.stringify(base.profile)); S.orders=JSON.parse(JSON.stringify(base.orders)); setStage(null); S.plan=samplePlan(); S.swaps={};
  const seen=[S.plan.days[0].meals[1].title];
  for(let i=0;i<5;i++){ if(!swapMeal(0,1)) {fail.push('바꾸기 실패'); break} seen.push(S.plan.days[0].meals[1].title) }
  if(new Set(seen).size!==seen.length) fail.push('바꾼 메뉴가 겹침 '+seen.join(' / '));
  info.swap=seen;
  // 다음 주에도 같은 날짜면 같은 메뉴(재현), 다른 주에는 다른 메뉴
  return {fail,info};
});
console.log(JSON.stringify(r.info,null,1));
// 만드는 법 화면
await p.evaluate(()=>{S.logs={};S.swaps={};S.plan=null;S.tab="plan";SCR=null;render();
  const d=S.plan.days[0]; const k=d.meals.findIndex(m=>m.cook&&m.cook.length&&!(m.rec||[]).length); window.__k=k});
const k=await p.evaluate(()=>window.__k);
let cookOK=true;
if(k>=0){ await p.click(`.mrow[data-k="${k}"]`); await p.waitForTimeout(300);
  const li=await p.evaluate(()=>[...document.querySelectorAll('ul.cook li')].map(x=>x.textContent));
  console.log('만드는 법', li); cookOK=li.length>0; }
console.log('errors',errs);
if(r.fail.length||!cookOK||errs.length){ console.log('FAIL', r.fail.slice(0,40).join('\n')); process.exitCode=1 }
await b.close();})();
