// 공통 안전장치: 어느 페이지에서든 잡히지 않은 오류(pageerror)가 나면 이 점검을 실패로 끝낸다
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}
// 저장 데이터 손상 퍼징: 실제에 가까운 기록을 만든 뒤 항목 하나씩 잘못된 값으로 바꿔
// normalizeState → 모든 탭·화면·PDF 생성까지 그려 보고, 오류나 NaN·undefined 노출을 찾는다.
const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out'); fs.mkdirSync(TMP,{recursive:true});
const { chromium } = require('playwright');
const page=path.join(TMP,'fuzz.html');
fs.writeFileSync(page,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const WORKERS=+process.env.FUZZ_WORKERS||2;

const SEED=()=>{
  const d=n=>addDays(today(),-n);
  S.consent={date:today()};
  S.profile={height:"170",weight:"60",age:"30",sex:"F",allergies:["shrimp","peanut"],allergyOther:"키위",lactose:true,meds:["asa","iron"],medOther:"유산균",dislikes:"가지",budget:"보통",budgetMonth:20};
  S.orders={checked:["fluid","lowres"],fluidMl:"1500",other:["우유 금지"]};
  const mk=(day,b,memo)=>({day,night:1,bloody:b,urg:1,blood:b?1:0,well:1,stool:2,medtaken:1,extra:["관절통"],pain:1,gas:"조금",fatigue:"약간",temp:"36.8",pulse:"78",other:["어지러움"],memo});
  for(let i=0;i<10;i++) S.logs[d(i)]=mk(3+i%3,i%2,"메모 "+i);
  S.weights=[{date:d(9),kg:60.2},{date:d(2),kg:59.8}];
  S.water[today()]=4; S.water[d(1)]=6;
  S.extras[today()]=[{name:"달걀찜",foodId:"egg_steamed",amt:120,unit:"g",kcal:142,p:13.4,fi:0.4,ca:52},{name:"직접 기록",foodId:null,amt:null,unit:"",kcal:null}];
  S.ratings=[{date:d(1),slot:"점심",title:"점심",foodId:"white_fish",rating:"good"},{date:d(2),slot:"제품",title:"두유",foodId:null,name:"두유",rating:"bad",note:"가스"}];
  S.triggers=[{name:"우유",foodId:"milk",date:d(3),source:"직접",sym:["설사"],never:false}];
  S.reintro={active:{name:"두부",foodId:"tofu",start:d(1),days:[{ok:true},{},{}]},history:[{name:"바나나",foodId:"banana",start:d(12),end:d(9),days:[{},{},{}],result:"ok"}]};
  S.okMenus=["김치찌개"]; S.care={flu:d(30)}; S.lastBackup=d(5); S.stageMode="auto"; S.reportDays=14;
  S.foodQ="죽"; S.foodCat="전체"; S.foodLv="전체"; S.foodSub="search";
  try{S.plan=samplePlan()}catch(e){}
  if(S.plan&&S.plan.days[0]){const m=S.plan.days[0].meals[0]; if(m){S.ate[today()]=[m.slot]; S.ateMeals[today()]={[m.slot]:{t:m.title,it:m.items.slice(0,2)}}}}
  S.skips[today()]=[]; S.swaps[today()+"|0"]=1;
  // v1.8.0 새 기록
  S.onb="done"; S.persist="na"; S.refMode="group"; S.favs=["banana"]; S.qs=[{id:"q1",t:"철분제를 계속 먹어도 됩니까?",date:d(2),done:""}];
  S.goals={k:1800,water:6}; S.chgDays=[today()]; S.tips=["mealRate"];
  if(S.plan&&S.plan.days[0]){const m=S.plan.days[0].meals[0]; if(m&&S.ateMeals[today()][m.slot]) S.ateMeals[today()][m.slot].r=0.5}
  S.extras[today()][0].slot="B";
  save();
};

(async()=>{
  const b=await chromium.launch();
  const boot=async()=>{
    const p=await b.newPage({viewport:{width:390,height:844}});
    await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
    await p.goto('file://'+page); await p.waitForTimeout(300);
    await p.evaluate(SEED); await p.waitForTimeout(100);
    return p;
  };
  const p0=await boot();
  const base=await p0.evaluate(()=>JSON.stringify(S));
  // 바꿀 경로 목록(깊이 3, 배열은 첫 원소만)
  const paths=await p0.evaluate(b=>{
    const out=[]; const walk=(o,pre,dep)=>{ if(dep>3||o===null||typeof o!=="object") return;
      const ks=Array.isArray(o)?(o.length?[0]:[]):Object.keys(o);
      for(const k of ks){ const q=[...pre,k]; out.push(q); walk(o[k],q,dep+1) } };
    walk(JSON.parse(b),[],0);
    // 같은 모양의 경로(날짜만 다른 기록 등)는 하나만 남긴다
    const seen=new Set(); return out.filter(q=>!(q[0]==="plan"&&q.length>3)).filter(q=>{
      const sig=q.map(k=>/^\d{4}-\d{2}-\d{2}(\|\d)?$/.test(String(k))?"<d>":String(k)).join("."); if(seen.has(sig)) return false; seen.add(sig); return true });
  },base);
  await p0.close();
  const BASEOBJ=JSON.parse(base);
  const get=(o,q)=>q.reduce((x,k)=>x==null?x:x[k],o);
  const BAD=[null,-1,"abc",true,[],{},"__DEL__"];
  const ONLY=process.env.FUZZ_ONLY?new RegExp(process.env.FUZZ_ONLY):null;   // 점검용: 이 경로만
  const cases=[]; for(const q of paths){ if(ONLY&&!ONLY.test(q.join("."))) continue; const cur=get(BASEOBJ,q);
    const extra=typeof cur==="number"?[1e12,"12"]:typeof cur==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(cur)?["2026-99-99",""]:typeof cur==="string"?["",12]:[];
    for(const v of [...BAD,...extra]) cases.push([q,v]); }
  if(process.env.FUZZ_COUNT){ console.log('paths',paths.length,'cases',cases.length); await b.close(); return }
  // 한 사례씩 실행해 멈춤(무한 반복)도 잡아낸다
  const RUN=async({base,q,v})=>{
    const fails=[], shows=[];
    const alerts=[]; window.alertMsg=m=>alerts.push(String(m));
    const TABS=["plan","log","food","me"];
    const SCRS=[["past",{date:addDays(today(),-1)}],["care",{}],["meal",{k:0}],["nutri",{}],["report",{}],["asks",{}],["set-goals",{}],["set-home",{}],["wizard",{}],["reintro",{}],["pdf",{}],
      ...["set-about","set-allergy","set-data","set-diet","set-meds","set-orders","set-privacy","set-profile","set-refs","set-stage","set-trig","set-weight"].map(n=>[n,{}])];
    const BADTXT=/\bNaN\b|undefined|\[object Object\]|Invalid Date/;
    const set=(o,q,v)=>{let x=o; for(let i=0;i<q.length-1;i++){ if(x==null||typeof x!=="object") return false; x=x[q[i]] } if(x==null||typeof x!=="object") return false; if(v==="__DEL__") delete x[q[q.length-1]]; else x[q[q.length-1]]=v; return true};
    window.html2canvas=async()=>{const c=document.createElement("canvas");c.width=10;c.height=10;return c};
    window.jspdf={jsPDF:function(){return {internal:{pageSize:{getWidth:()=>595,getHeight:()=>842},getNumberOfPages:()=>1},addImage(){},addPage(){},setPage(){},output(){return new Blob(["x"])},save(){},setFontSize(){},text(){},setTextColor(){}}}};
    DL={save:async()=>({status:"saved"})};
    const o=JSON.parse(base); if(!set(o,q,v)) return {skip:true};
    let s; try{ s=normalizeState(o) }catch(e){ if(/bad backup|newer backup/.test(e.message)) return {rejected:true}; return {fails:[[q.join("."),JSON.stringify(v),"normalize",e.message]],shows} }
    const tryRender=(where)=>{ try{ renderInner() }catch(e){ fails.push([q.join("."),JSON.stringify(v),where,e.message]); return }
      const t=document.querySelector("#main").innerText; const m=t.match(BADTXT); if(m) shows.push([q.join("."),JSON.stringify(v),where,m[0],t.slice(Math.max(0,m.index-30),m.index+20).replace(/\s+/g," ")]) };
    S=s; SCR=null; WZ.step=0;
    const heavy=/^(profile|orders|triggers|okMenus|foodQ|foodCat|foodLv|foodSub|stageMode|logs|reintro)/.test(q[0]);
    for(const t of TABS){ if(t==="food"&&!heavy) continue; S.tab=t; SCR=null; tryRender("tab:"+t) }
    for(const [n,pr] of SCRS){ S.tab="me"; if(n==="wizard"){ try{ openWizard(today()) }catch(e){ fails.push([q.join("."),JSON.stringify(v),"scr:wizard-open",e.message]); continue } } else SCR={name:n,...pr}; tryRender("scr:"+n) }
    SCR=null;
    try{ showFood("white_fish"); const sh=document.querySelector("#sheetRoot").innerText; const m=sh.match(BADTXT); if(m) shows.push([q.join("."),JSON.stringify(v),"sheet:food",m[0],""]) }catch(e){ fails.push([q.join("."),JSON.stringify(v),"sheet:food",e.message]) }
    try{ document.querySelector("#sheetRoot").innerHTML="" }catch(e){}
    if(/^(profile|orders|triggers|logs|ratings|weights|reportDays|reintro|extras|water)/.test(q[0])){
      try{ SCR={name:"pdf"}; renderInner(); await exportPDF(); if(alerts.some(a=>/못|오류|실패/.test(a))) fails.push([q.join("."),JSON.stringify(v),"pdf",alerts.join(" / ")]) }catch(e){ fails.push([q.join("."),JSON.stringify(v),"pdf",e.message]) }
      const rep=document.querySelector("#report"); if(rep){const m=rep.innerText.match(BADTXT); if(m) shows.push([q.join("."),JSON.stringify(v),"pdf-body",m[0],rep.innerText.slice(Math.max(0,m.index-30),m.index+20).replace(/\s+/g," ")])}
    }
    SCR=null;
    return {fails,shows};
  };
  const fails=[], shows=[]; let rejected=0, done=0; const t0=Date.now();
  // 사례를 WORKERS개로 나눠 동시에 돌린다(탭마다 따로 된 브라우저 컨텍스트 → 저장 공간이 섞이지 않음)
  const runChunk=async list=>{
  let p=await boot();
  for(const [q,v] of list){
    let r; const to=new Promise(res=>setTimeout(()=>res({hang:true}),15000));
    try{ r=await Promise.race([p.evaluate(RUN,{base,q,v}),to]) }catch(e){
      // 브라우저 탭이 닫히거나 죽으면(여러 점검을 동시에 돌릴 때 메모리 부족 등) 새 탭에서 같은 사례를 한 번 더 돌린다.
      // 다시 돌려도 실패하면 앱 문제로 본다.
      if(/closed|crash/i.test(e.message)){ try{await p.close()}catch(_){} p=await boot();
        try{ r=await Promise.race([p.evaluate(RUN,{base,q,v}),new Promise(res=>setTimeout(()=>res({hang:true}),15000))]) }catch(e2){ r={fails:[[q.join("."),JSON.stringify(v),"evaluate",e2.message.slice(0,120)]]} } }
      else r={fails:[[q.join("."),JSON.stringify(v),"evaluate",e.message.slice(0,120)]]} }
    if(r.hang){ fails.push([q.join("."),JSON.stringify(v),"hang","15초 넘게 응답 없음(멈춤)"]); try{await p.close()}catch(e){} p=await boot() }
    else { if(r.rejected) rejected++; if(r.fails) fails.push(...r.fails); if(r.shows) shows.push(...r.shows) }
    if(++done%100===0) console.log(`진행 ${done}/${cases.length} (${Math.round((Date.now()-t0)/1000)}초, 오류 ${fails.length}, 노출 ${shows.length})`);
  }
  try{await p.close()}catch(e){}
  };
  await Promise.all(Array.from({length:WORKERS},(_,w)=>runChunk(cases.filter((_,k)=>k%WORKERS===w))));
  const n=cases.length;
  await b.close();
  const uniq=(arr,key)=>{const m=new Map(); for(const x of arr){const k=key(x); if(!m.has(k)) m.set(k,{x,c:0}); m.get(k).c++} return [...m.values()]};
  console.log(`cases ${n}, paths ${paths.length}, rejected-as-bad-backup ${rejected}`);
  console.log(`== 오류 ${fails.length}`);
  for(const {x,c} of uniq(fails,f=>f[2]+"|"+f[3]).slice(0,60)) console.log(`  [${c}] ${x[2]} :: ${x[3]}  (예: ${x[0]} = ${x[1]})`);
  console.log(`== 화면 노출 ${shows.length}`);
  for(const {x,c} of uniq(shows,f=>f[0]+"|"+f[2]).slice(0,80)) console.log(`  [${c}] ${x[2]} '${x[3]}' ← ${x[0]} = ${x[1]} :: ${x[4]}`);
  fs.writeFileSync(path.join(TMP,'fuzz.json'),JSON.stringify({fails,shows},null,1));
  process.exit(fails.length||shows.length?1:0);
})();
