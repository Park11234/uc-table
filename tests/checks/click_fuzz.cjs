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
// 누름 퍼징(v1.5.1): 모든 화면에서 눌리는 요소를 하나씩 누르고(2단계까지 따라 들어감), 검색칸마다 여러 검색어를 넣어
// 잡히지 않은 오류·console.error·'화면을 그리는 중 문제' 화면·undefined/NaN/[object Object] 노출·가로 넘침을 찾는다
const { chromium } = require('playwright');
const page=T('click_fuzz.html');
fs_.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>');
const SEED=()=>{
  const d=n=>addDays(today(),-n);
  S.consent={date:today()};
  S.profile={height:"170",weight:"60",age:"30",sex:"F",allergies:["shrimp"],allergyOther:"키위",lactose:false,meds:["asa","steroid"],medOther:"유산균",dislikes:"가지",budget:"보통"};
  for(let i=0;i<10;i++) S.logs[d(i)]={...BLANK_LOG(),date:d(i),day:2+i%3,bloody:i%2,urg:i%2,blood:i%2,pain:i%4,gas:i%3?"없음":"약간",stool:4,medtaken:1,memo:i===0?"메모":""};
  S.water[today()]=3; S.weights=[{date:d(3),kg:60.4},{date:today(),kg:60.1}];
  S.extras[today()]=[{name:"달걀찜",foodId:"egg_steamed",amt:120,unit:"g",kcal:142,p:13.4,fi:0.4,ca:52},{name:"뉴케어 구수한맛 순",foodId:"newcare_gosu",amt:200,unit:"ml"}];
  S.triggers=[{name:"우유",foodId:"milk",date:d(2),source:"직접",sym:["gas"],never:false}];
  S.ratings=[{date:d(1),slot:"점심",title:"x",foodId:"salmon",name:"연어",rating:"good"}];
  S.myMenus=[{id:"m1",slot:"L",title:"내 대구 정식",items:[["white_rice",200],["white_fish",100]]}];
  S.orders={checked:["lowres"],fluidMl:"",other:["우유는 하루 1컵"]};
  S.remind={on:["B","log"],t:{B:"07:30",L:"12:30",D:"18:30",log:"21:00",water:"10:30"}};
  S=normalizeState(JSON.parse(JSON.stringify(S))); save();
};
const STATES=["S","SCR","WZ","draft","BAD","rateDraft","TP","EX","MP","MM","MJ","LB","QAV","ORD_TXT","OTH_TXT","W_TXT","Q_TXT","GOAL_TXT","REP_N","FDET","PENDING_RESTORE","PE"];
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:false});
  ctx.on('page',p=>{ if(p.url()!=='about:blank'&&!p.url().startsWith('file:')) p.close().catch(()=>{}) });
  const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push('pageerror '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text())) errs.push('console '+m.text().slice(0,200)) });
  p.on('dialog',d=>d.dismiss().catch(()=>{}));
  p.on('filechooser',()=>{});
  await p.route(/^https?:/, r=>r.fulfill({body:''}));
  await p.goto('file://'+page); await p.waitForTimeout(300);
  await p.evaluate(SEED); await p.reload(); await p.waitForTimeout(400);
  // 페이지 안 도구: 상태 저장·복원, 눌리는 요소 목록, 이상 표시 검사
  const TOOLS=(STATES)=>{
    window.__snapAll=()=>{const o={}; for(const k of STATES){ try{o[k]=JSON.stringify(eval(k))}catch(e){} } o.__sheet=document.querySelector('#sheetRoot').innerHTML; o.__y=window.scrollY; return o};
    window.__restoreAll=o=>{ for(const k of STATES){ if(k in o){ try{ const v=o[k]===undefined?undefined:JSON.parse(o[k]); if(k==="S") S=v; else eval(k+"=v") }catch(e){} } }
      TAP={t:0,x:-99,y:-99,act:""}; NAVT=0; const eb=document.querySelector('#errbar'); if(eb) eb.remove(); ERR_SEEN=""; render(); document.querySelector('#sheetRoot').innerHTML=o.__sheet; };
    const SEL='button,[data-act],a[href],[role=button],[role=tab],input[type=checkbox],input[type=radio],summary,select,.tab';
    window.__clickables=()=>[...document.querySelectorAll(SEL)].filter(e=>{const r=e.getBoundingClientRect(); if(!(r.width>0&&r.height>0)) return false;
      if(e.disabled||e.closest('[hidden]')) return false; if(e.matches('input[type=file]')) return false; if(e.dataset.act==="pdf") return false; if(e.dataset.act==="reloadPage") return false; /* 오류 안내의 '새로고침'은 일부러 다시 읽는 버튼 */ return true});
    window.__key=e=>[e.tagName,e.className&&String(e.className).slice(0,30),e.dataset.act||'',e.dataset.v||'',e.dataset.k||'',e.dataset.i||'',e.dataset.j||'',e.dataset.id||'',e.dataset.tab||'',e.dataset.go||'',e.dataset.sub||'',e.dataset.key||'',e.id||'',(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,24)].join('|');
    window.__sig=()=>{const sh=document.querySelector('#sheetRoot .sheet h2, #sheetRoot h2'); return [S.tab,SCR?SCR.name:'',SCR&&SCR.name==='wizard'?WZ.step:'',sh?sh.textContent.slice(0,20):''].join('/')};
    window.__bad=()=>{const out=[]; let txt=['#main','#appbar','#sheetRoot'].map(s=>document.querySelector(s)?.innerText||'').join('\n');
      for(const e of document.querySelectorAll('.oss-txt')) txt=txt.split(e.innerText).join('');   // v1.11.0: 라이선스 전문의 영어 낱말(null and void 등)은 앱 표시가 아님
      if(/화면을 그리는 중 문제가 생겼습니다/.test(txt)) out.push('렌더 오류 화면');
      const m=txt.match(/.{0,20}(\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b).{0,20}/); if(m) out.push('이상 표시: '+m[0]);
      if(document.documentElement.scrollWidth>innerWidth+1) out.push('가로 넘침 '+document.documentElement.scrollWidth);
      return out};
    window.__click=e=>{ if(e.tagName==="SELECT"){ const o=[...e.options].find(x=>x.value!==e.value); if(o){e.value=o.value; e.dispatchEvent(new Event('change',{bubbles:true}))} return }
      if(e.tagName==="A"&&/^https?:/.test(e.getAttribute('href')||'')){ e.addEventListener('click',ev=>ev.preventDefault(),{once:true}) }
      e.click() };
  };
  const inject=()=>p.evaluate(TOOLS,STATES); await inject();
  // 누른 뒤 페이지가 다른 주소로 바뀌거나 새로 읽히면(폼 제출·새로고침 등) 도구가 사라짐 → 문제로 적고 다시 연다
  let lastWhere='';
  const ensure=async()=>{ if(await p.evaluate(()=>typeof __restoreAll==='function').catch(()=>false)) return;
    note(lastWhere||'(시작 전)',['누른 뒤 페이지가 새로 읽힘: '+p.url().split('/').pop()]); await p.goto('file://'+page); await p.waitForTimeout(300); await inject() };
  const restore=async o=>{ await ensure(); await p.evaluate(o=>__restoreAll(o),o) };
  // 시작 화면들
  const starts=[["tab","plan"],["tab","log"],["tab","food"],["tab","me"],["onb","0"],["onb","1"],["onb","2"],["onb","3"],
    ...["set-goals","set-home","set-profile","set-diet","set-allergy","set-meds","set-orders","set-weight","set-data","set-about","set-refs","set-trig","set-remind","set-stage","set-privacy"].map(x=>["scr",x]),
    ["scr2","nutri"],["scr2","report"],["scr2","asks"],["scr2","meal"],["scr2","meal0"],["scr2","meal2"],["scr2","past"],["scr2","care"],["scr2","reintro"],["scr2","pdf"],["wizard",""],...Array.from({length:12},(_,i)=>["wz",String(i)]),["mj","김치찌개, 백김치, 뉴케어"],["lb","done"],["food","newcare_gosu"],["food","white_fish"],["food","yukhoe"],["sub","menu"],["sub","label"]];
  let seed0=null;
  const openStart=async([k,v])=>(await ensure(), p.evaluate(([k,v,seed])=>{ if(seed) __restoreAll(seed); document.querySelector('#sheetRoot').innerHTML=""; SCR=null;
    if(k==="tab"){S.tab=v;render()} else if(k==="onb"){S.tab="plan";S.onb=v;render()} else if(k==="scr"){S.tab="me";render();openScr(v)} else if(k==="scr2"){ if(v.startsWith("meal")) openScr("meal",{k:v==="meal"?1:+v.slice(4)}); else if(v==="past") openScr("past",{date:addDays(today(),-1)}); else openScr(v) }
    else if(k==="wz"){openWizard(); WZ.step=Math.min(+v,WSTEPS.length-1); render()}
    else if(k==="mj"){S.tab="food";S.foodSub="menu";render(); const t=document.querySelector('#mjText'); if(t){t.value=v; t.dispatchEvent(new Event('input',{bubbles:true}))} const j=document.querySelector('[data-act="mjJudge"]'); j&&j.click()}
    else if(k==="lb"){S.tab="food";S.foodSub="label";LB={...LB,step:"done",name:"도시락(돼지불고기)",text:"쌀, 돼지고기, 간장, 설탕, 수크랄로스, 말티톨. 이 제품은 메밀, 대두, 새우를 사용한 제품과 같은 제조시설에서 제조하고 있습니다.",nutri:{basis:"총 내용량 400g",basisAmt:400,basisUnit:"g",kcal:680,fat:19,sodium:1171,protein:14,fiber:null,sugar:null,polyol:5,trans:0,calcium:null}}; try{LB.res=labelCheck?.(LB.text,LB.name)}catch(e){} render()}
    else if(k==="wizard"){openWizard()} else if(k==="food"){S.tab="food";render();showFood(v)} else if(k==="sub"){S.tab="food";S.foodSub=v;render()} },[k,v,seed0]));
  const problems=new Map(); let clicks=0; const seenSig=new Set();
  const note=(where,list)=>{ for(const x of list){ const key=x.replace(/\d+/g,'#')+' @ '+where.split(' > ')[0]; if(!problems.has(key)){ problems.set(key,where+' :: '+x); if(process.env.FUZZ_LOG) console.log('  문제',where+' :: '+x) } } };
  const MAXD=2;
  if(process.env.FUZZ_QUICK) starts.splice(1);   // 빠른 모드: 홈 화면만
  const t0=Date.now(); await openStart(["tab","plan"]); seed0=await p.evaluate(()=>__snapAll());
  for(const st of starts){
    if(process.env.FUZZ_LOG) console.log('시작',st.join(':'),clicks,Math.round((Date.now()-t0)/1000)+'초');
    // 넓이 우선 탐색: 경로 = 요소 키 목록
    const queue=[[]];
    await openStart(st); const base=await p.evaluate(()=>__snapAll());
    const baseSig=await p.evaluate(()=>__sig()); seenSig.add(baseSig);
    while(queue.length){
      const pathK=queue.shift();
      // 경로 재현
      await restore(base);
      let ok=true;
      for(const key of pathK){ const r=await p.evaluate(key=>{const e=__clickables().find(x=>__key(x)===key); if(!e) return false; __click(e); return true},key); if(!r){ok=false;break} await p.waitForTimeout(30) }
      if(!ok) continue;
      const snap=await p.evaluate(()=>__snapAll());
      const keys=await p.evaluate(()=>{const seen={}, grp={}; return __clickables().map(e=>{const k=__key(e); seen[k]=(seen[k]||0)+1; if(seen[k]>1) return null;
        // 같은 종류(같은 data-act·태그)가 많은 목록(음식 카드 등)은 앞의 3개만 누름
        const g=(e.dataset.act||e.tagName)+'|'+(e.dataset.act?'':String(e.className).slice(0,20)); grp[g]=(grp[g]||0)+1; return grp[g]>3?null:k}).filter(Boolean)});
      for(const key of keys){
        await restore(snap); errs.length=0;
        const found=await p.evaluate(key=>{const e=__clickables().find(x=>__key(x)===key); if(!e) return false; try{__click(e)}catch(err){console.error('click '+err.message)} return true},key);
        if(!found) continue; clicks++;
        await p.waitForTimeout(40);
        const bad=await p.evaluate(()=>__bad()).catch(e=>['평가 실패 '+e.message]);
        const where=`${st.join(':')} > ${[...pathK,key].map(k=>k.split('|').slice(2,4).concat(k.split('|').pop()).filter(Boolean).join(' ')).join(' > ')}`;
        lastWhere=where; if(errs.length||bad.length) note(where,[...errs,...bad]);
        if(pathK.length+1<MAXD){ await ensure(); const sig=await p.evaluate(()=>__sig()); if(!seenSig.has(sig)){ seenSig.add(sig); queue.push([...pathK,key]) } }
      }
    }
  }
  // 검색칸: 여러 검색어
  if(!process.env.FUZZ_QUICK){
  const QUERIES=["뉴케어","뉴케어 구수","ㄴㅋㅇ","뉴","ㄴ","케어미","그린비아","엘리멘탈","IBD","ibd","올프로틴","당플랜","혈압","큐어웰","테이크핏","모노웰","메디웰","계란","흰죽","ㅋㅋㅋ","(","[","*","\\","<b>x</b>","\"'","12345","🥛","가나다라마바사아자차카타파하가나다라마바사","  ","연어","샤브","이온음료","밀크티","소금빵"];
  const fields=[["sub","search","#foodQ"],["sub","menu","#mjText"],["sub","label","#lbText"]];
  for(const [k,v,sel] of fields){
    for(const q of QUERIES){ await openStart([k,v]); errs.length=0; const el=await p.$(sel); if(!el){note(`${k}:${v}`,['검색칸 없음 '+sel]);break}
      await el.fill(q); await p.waitForTimeout(60); await el.press('Enter').catch(()=>{}); await p.waitForTimeout(80);
      const bad=await p.evaluate(()=>__bad()); if(errs.length||bad.length) note(`검색 ${sel} "${q}"`,[...errs,...bad]); clicks++ }
  }
  // 메뉴 고르기·내 메뉴·주의 음식 고르기 검색칸
  for(const q of QUERIES){ await openStart(["tab","plan"]); errs.length=0;
    await p.evaluate(()=>{const m=document.querySelector('[data-act="mealMore"]'); m&&m.click(); const b=document.querySelector('#sheetRoot [data-act="menuPick"]'); b&&b.click()}); await p.waitForTimeout(80);
    const el=await p.$('#mpQ'); if(el){ await el.fill(q); await p.waitForTimeout(60) }
    await p.evaluate(()=>{const b=document.querySelector('[data-act="myMenuNew"]'); b&&b.click()}); await p.waitForTimeout(60);
    const el2=await p.$('#mmQ'); if(el2){ await el2.fill(q); await p.waitForTimeout(60) }
    const bad=await p.evaluate(()=>__bad()); if(errs.length||bad.length) note(`메뉴 검색 "${q}"`,[...errs,...bad]); }
  for(const q of QUERIES){ await openStart(["scr","set-trig"]); errs.length=0;
    await p.evaluate(()=>{const b=document.querySelector('[data-act="trigPick"]'); b&&b.click()}); await p.waitForTimeout(60);
    const el=await p.$('#tpQ'); if(el){ await el.fill(q); await p.waitForTimeout(60) }
    const bad=await p.evaluate(()=>__bad()); if(errs.length||bad.length) note(`주의 음식 검색 "${q}"`,[...errs,...bad]); }
  }
  console.log(`누름 ${clicks}회, 화면 상태 ${seenSig.size}가지`);
  console.log(`문제 ${problems.size}종`); for(const v of problems.values()) console.log('  ',v);
  await b.close();
  if(problems.size){ console.log('FAIL 누름·검색 중 문제'); process.exitCode=1 } else console.log('OK 누름·검색 퍼징 통과');
})();
