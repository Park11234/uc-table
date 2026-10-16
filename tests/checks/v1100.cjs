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
/* v1.10.0 점검: 점검 보고서(디자인 1~11, 개발자 1~10·12·13, 사용자 1~6·8·10·12·13)를 고친 것이 그대로인지 화면에서 확인한다.
   홈 입구 하나·끼니 '바꾸기'·걸러 보기 시트·한 줄 목록·시판 제품 접기·음식 정보 요약·대신 이것·확인 날짜·'다음 단계'·
   기록 쪽수(요약 포함)·빠른 기록·피 대조·첫 단계 질문·3일 연속 알림·외식 메뉴 묶음 질문·옛 id 잇기·CSV·바코드 연결·
   PC에서 가운데 휴대폰 화면·알림 위치·안드로이드 앱 기록 옮기기 */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const page=T('v1100.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const SEED=()=>{
  S.consent={date:today()}; S.onb="done";
  const mk=(day,b)=>({...BLANK_LOG(),day,night:0,bloody:b,urg:0,blood:b?1:0,well:0,stool:4,medtaken:1,pain:1,memo:""});
  for(let i=1;i<=5;i++) S.logs[addDays(today(),-i)]=mk(2,0);
  save();
};
(async()=>{
  const b=await chromium.launch();
  const open=async(opt={})=>{const ctx=await b.newContext({viewport:{width:opt.w||390,height:opt.h||844},isMobile:!opt.pc,hasTouch:!opt.pc}); if(opt.init) await ctx.addInitScript(opt.init); const p=await ctx.newPage();
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&typeof csvRows==="function"&&typeof bcSheet==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); await p.waitForTimeout(150); if(!opt.noSeed){await p.evaluate(SEED); await p.waitForTimeout(700); await p.reload(); await ready(); await p.waitForTimeout(200)} p.ready=ready; return p};

  console.log('== 홈(디자인 1·2·10)');
  {const p=await open();
    const h=await p.evaluate(()=>{SCR=null; S.tab="plan"; render(); return {wiz:document.querySelectorAll('#main [data-act=wizard]').length, inTasks:!!document.querySelector('.tasks [data-act=wizard]'),
      quick:!!document.querySelector('.tasks [data-act=wizardQuick]'), tile:!!document.querySelector('.tile[data-act=wizard]'), cupAdd:document.querySelectorAll('#main [data-act=cupAdd]').length,
      mact:[...document.querySelector('.mwrap .mact').querySelectorAll('button')].map(x=>x.dataset.act), H:document.documentElement.scrollHeight}});
    need(h.wiz===1&&h.inTasks&&h.quick&&!h.tile,`디자인 1 홈의 증상 기록 입구는 '오늘 할 일' 한 곳(+빠른 기록) (${h.wiz}개)`);
    need(h.cupAdd===1,`디자인 1 '+1잔'은 한 곳 (${h.cupAdd}개)`);
    need(JSON.stringify(h.mact)===JSON.stringify(["ateToggle","mealMore"]),`디자인 2 끼니 줄 버튼은 '먹음'과 '바꾸기' 둘 (${h.mact})`);
    need(h.H<2100,`디자인 1 홈 길이 줄임(${h.H}px)`);
    await p.click('.mwrap [data-act=mealMore]'); await p.waitForTimeout(150);
    const sh=await p.evaluate(()=>[...document.querySelectorAll('#sheetRoot button[data-act]')].map(x=>x.dataset.act));
    need(sh.includes("skipToggleDate")&&sh.includes("menuPick")&&sh.includes("swapMeal"),`디자인 2 '바꾸기'에 안 먹음·메뉴 고르기·다른 메뉴 (${sh})`);
    await p.click('#sheetRoot [data-act=skipToggleDate]'); await p.waitForTimeout(200);
    const sk=await p.evaluate(()=>({sk:isSkipped(today(),SLOTS[0]),sheet:!!document.querySelector('#sheetRoot').firstChild,tr:document.querySelector('#toasts .toast')?.getBoundingClientRect().top,h:innerHeight}));
    need(sk.sk&&!sk.sheet,"디자인 2 '바꾸기 → 이 끼니는 안 먹었습니다'가 시트를 닫고 표시");
    need(sk.tr>sk.h/2,`디자인 10 알림은 아래쪽(제목을 가리지 않음, top ${Math.round(sk.tr)})`);
    await p.context().close()}

  console.log('== 찾아보기(디자인 3·4·5·6·7·8·11, 개발자 6, 사용자 1)');
  {const p=await open();
    const r=await p.evaluate(()=>{S.stageMode="2"; S.tab="food"; S.foodSub="search"; S.foodQ=""; S.foodCat="전체"; S.foodLv="전체"; SCR=null; render();
      const chipsOut=document.querySelectorAll('#foodRes .cats .chip').length;
      const firstGroup=document.querySelector('#foodRes .fgroup:not(:has(.qa-entry)) .fg-h')?.textContent||"";
      const rem=/관해기\(지중해식 단계\)가 되면 좋음 [\d,]+개·주의 [\d,]+개/.test(document.querySelector('#foodRes').innerText);
      const emoji=document.querySelectorAll('#foodRes .fic .emo').length, svg=document.querySelectorAll('#foodRes .fcard .fic svg').length;
      return {chipsOut,firstGroup,rem,emoji,svg,later:LV.later}});
    need(r.chipsOut===0,`디자인 3 결과 위 칩 없음(걸러 보기 시트로) (${r.chipsOut})`);
    need(/지금 먹을 수 있는 음식/.test(r.firstGroup),`사용자 1 첫 묶음은 '지금 먹을 수 있는 음식' (${r.firstGroup.slice(0,30)})`);
    need(r.rem,'사용자 1 관해기가 되면 늘어나는 수를 안내');
    need(r.emoji===0&&r.svg>0,`디자인 11 그림 문자 대신 아이콘 (그림 문자 ${r.emoji}, 아이콘 ${r.svg})`);
    need(r.later==="다음 단계",`디자인 8 '보류' → '다음 단계' (${r.later})`);
    await p.click('[data-act=filterOpen]'); await p.waitForTimeout(150);
    await p.click('#sheetRoot [data-act=lvS][data-v=now]'); await p.waitForTimeout(150);
    const f=await p.evaluate(()=>{closeSheet(); return {lv:S.foodLv,ok:[...document.querySelectorAll('#foodRes .fcard')].every(b=>["ok","caution"].includes(foodStatus(FOOD[b.dataset.id]).level)),n:document.querySelectorAll('#foodRes .fcard').length,clear:!!document.querySelector('.ftools [data-act=lvFilter][data-v="전체"]')}});
    need(f.lv==="now"&&f.ok&&f.n>0&&f.clear,`디자인 3 걸러 보기 '지금 먹을 수 있음'과 지우기 칩 (${f.n}개)`);
    await p.evaluate(()=>{S.foodLv="전체"; render()});
    await p.fill('#foodQ','만두'); await p.waitForTimeout(500);
    const m=await p.evaluate(()=>{const cards=[...document.querySelectorAll('#foodRes .fcard')]; const fold=[...document.querySelectorAll('#foodRes [data-act=fMore]')].filter(x=>/:p$/.test(x.dataset.v));
      const firstProd=cards.findIndex(c=>isProd(FOOD[c.dataset.id])), lastGen=cards.map(c=>!isProd(FOOD[c.dataset.id])).lastIndexOf(true);
      const grpOK=[...document.querySelectorAll('#foodRes .fgroup')].every(g=>{const f=[...g.querySelectorAll('.fcard')].map(c=>isProd(FOOD[c.dataset.id])); return f.indexOf(true)<0||f.lastIndexOf(false)<f.indexOf(true)});
      return {fold:fold.length, meta:cards[0]?.querySelector('small')?.textContent||"", genFirst:grpOK&&firstProd!==0&&lastGen>=0}});
    need(m.fold>0&&m.genFirst,`개발자 6 일반 음식 먼저, 시판 제품은 접기 (접은 묶음 ${m.fold})`);
    need(/1회 \d+g/.test(m.meta),`디자인 4 한 줄에 종류·1회 양·열량 (${m.meta})`);
    const d=await p.evaluate(()=>{const fam=Object.keys(PFAM)[0]; showFood("ham"); const sh=document.querySelector('#sheetRoot'); const o={sum:sh.querySelector('.why-sum')?.textContent||"", more:!!sh.querySelector('details.why-more'), alt:sh.querySelectorAll('.alt-chip').length, dash:[...sh.querySelectorAll('.nutgrid b')].filter(x=>x.textContent.trim()==="–").length, date:sh.querySelector('.chk-date b')?.textContent||""};
      closeSheet(); const nm=FOODS.find(f=>f.name==="비비고 생야채물만두"); showFood(nm.id); o.size=document.querySelector('#sheetRoot .fsize')?.textContent||""; closeSheet();
      showFood(fam); o.fam=/같은 제품 다른 용량/.test(document.querySelector('#sheetRoot').innerText); closeSheet(); o.lv=foodStatus(FOOD.ham).level; return o});
    need(d.lv==="ban",'개발자 3 일반 햄·소시지·베이컨은 절대 금지');
    need(d.sum&&d.more,'디자인 7 판정 이유 한 줄 + 자세히');
    need(d.alt>=1,`사용자 1 피하는 음식에 '대신 이것' (${d.alt}개)`);
    need(d.dash===0,'디자인 6 영양 칸에 – 없음(자료 없음은 한 줄로)');
    need(/^2026-\d\d-\d\d( 이전\(.+\))?$/.test(d.date),`개발자 4 확인 날짜(넣은 날) 표시, v1.11.0 M8: 추정 날짜는 '이전(첫 공개판)' (${d.date})`);
    need(/278g/.test(d.size),`디자인 5 용량은 이름과 따로 (${d.size})`);
    need(d.fam,'개발자 2 묶은 제품에 다른 용량 표시');
    await p.context().close()}

  console.log('== 증상 기록(디자인 9, 개발자 8, 사용자 5·6·10)');
  {const p=await open();
    const w=await p.evaluate(()=>{openWizard(today()); WZ.step=1; render(); const h1=document.querySelector('.wz .hint').textContent; WZ.step=WSTEPS.length-2; render(); const nx=document.querySelector('[data-act=wzNext]').textContent.trim(); WZ.step=WSTEPS.length-1; render(); const h2=document.querySelector('.wz .hint').textContent;
      const opt=WSTEPS.find(s=>s.k==="body").q.filter(q=>q.k==="gas"||q.k==="fatigue").every(q=>q.opt); wizardDirty=()=>false; SCR=null; render(); return {h1,h2,nx,opt}});
    need(/1\/5쪽/.test(w.h1)&&/5\/5쪽/.test(w.h2)&&w.nx==="요약 보기",`디자인 9 쪽수에 요약을 넣어 셈(${w.h1.trim()} … ${w.h2.trim()}, '${w.nx}')`);
    need(w.opt,'사용자 6 가스·피로는 선택');
    const mm=await p.evaluate(()=>[bloodMismatch({day:3,night:0,bloody:2,blood:0}),bloodMismatch({day:3,night:0,bloody:0,blood:2}),bloodMismatch({day:3,night:0,bloody:1,blood:1})]);
    need(mm[0]&&mm[1]&&!mm[2],'개발자 8 피 섞인 변 횟수와 피의 정도가 맞지 않으면 알림');
    await p.evaluate(()=>{delete S.logs[today()]; SCR=null; S.tab="plan"; render()}); await p.click('.tasks [data-act=wizardQuick]'); await p.waitForTimeout(200);
    await p.click('[data-act=step][data-k=day][data-v="1"]'); await p.click('[data-act=set][data-k=urg][data-v="1"]'); await p.click('[data-act=set][data-k=blood][data-v="0"]'); await p.waitForTimeout(100);
    const q1=await p.evaluate(()=>document.querySelectorAll('.wq').length);
    await p.click('[data-act=wzNext]'); await p.waitForTimeout(150); await p.click('[data-act=saveLog]'); await p.waitForTimeout(200);
    const q=await p.evaluate(()=>S.logs[today()]);
    need(q1===3&&q&&q.quick===true&&q.day===1&&q.urg===1,`사용자 6 빠른 기록 세 문항 저장(quick 표시) (${q1}문항)`);
    // 3일 연속 5점 이상
    const t=await p.evaluate(()=>{const hi={...BLANK_LOG(),day:8,night:2,bloody:3,urg:2,blood:2,well:2}; for(let i=0;i<3;i++) S.logs[addDays(today(),-i)]=hi; SCR=null; S.tab="plan"; render(); return {tr:trend3(),txt:document.querySelector('#main').innerText}});
    need(t.tr&&/3일 연속 활동기 기준입니다/.test(t.txt)&&/주치의\(IBD 진료팀\)에 알리십시오/.test(t.txt)&&/예측하지 않습니다/.test(t.txt),'사용자 5·8번 3일 연속 5점 이상이면 주치의에 알리라는 고정 문장(예측 아님)');
    await p.context().close()}
  {const p=await open({noSeed:true});
    const s=await p.evaluate(()=>{S.consent={date:today()}; S.onb="3"; S.logs={}; S.stageInit=null; render(); const has=!!document.querySelector('[data-act=onbInit][data-v="3"]'); document.querySelector('[data-act=onbInit][data-v="3"]').click(); return {has,st:currentStage().stage,src:currentStage().src}});
    need(s.has&&s.st===3&&/처음에 고른 요즘 상태/.test(s.src),`사용자 10 기록이 없을 때 첫 질문으로 시작 단계 (${s.st})`);
    await p.context().close()}

  console.log('== 식단 양 조절(개발자 7)');
  {const p=await open();
    const r=await p.evaluate(()=>{S.profile.height="162"; S.profile.age="24"; S.profile.sex="F"; S.weights=[{date:today(),kg:49.5}]; S.profile.weight="49.5"; S.stageMode="2"; S.plan=null; render();
      const tg=targets(); const ps=S.plan.days.map(d=>totals(dayItems(d)).p); const down=S.plan.days.filter(d=>d.scaled&&d.scaled.fp<1).length;
      SCR=null; S.tab="plan"; S.selDay=S.plan.days.findIndex(d=>d.scaled&&d.scaled.fp<1); render();
      return {tp:tg.p,avg:ps.reduce((a,b)=>a+b,0)/ps.length,down,txt:document.querySelector('.plan-note')?.textContent||""}});
    need(r.down>0&&r.avg<=r.tp*1.3,`체중 49.5kg: 단백질 반찬도 줄여 목표(${r.tp}g)에 가깝게 (7일 평균 ${Math.round(r.avg)}g, 줄인 날 ${r.down})`);
    need(/단백질 반찬 양을 줄였습니다/.test(r.txt),`줄였을 때 '줄였습니다'로 안내 (${r.txt.trim().slice(-60)})`);
    await p.context().close()}

  console.log('== 외식·검색 데이터(개발자 1·5)');
  {const p=await open();
    const r=await p.evaluate(()=>{S.stageMode="2"; MJ={step:"done",items:["샐러드","순두부찌개","돼지국밥","연어덮밥","제육덮밥","참치비빔밥"].map(n=>({name:n,ingr:[],cook:"",conf:"user"})),results:[],err:"",text:""}; mjJudge();
      const by=Object.fromEntries(MJ.results.map(x=>[x.name,x])); const ban=FOODS.filter(f=>f.tags.includes("nitrite")).filter(f=>/소량|조금만|자주 먹지 않/.test(f.why)).length;
      return {salad:by["샐러드"].broad?.length||0, saladLv:by["샐러드"].level, sundubu:by["순두부찌개"].food, gukbap:by["돼지국밥"].food, salmon:by["연어덮밥"].food, jeyuk:by["제육덮밥"].level, tuna:by["참치비빔밥"].level, ban}});
    need(r.salad>=3&&r.saladLv!=="ok",`개발자 5 '샐러드'처럼 종류가 많은 이름은 어떤 메뉴인지 묻고 가장 엄격한 판정 (${r.salad}가지, ${r.saladLv})`);
    need(r.sundubu==="sundubu_jjigae"&&r.gukbap==="dwaeji_gukbap"&&r.salmon==="salmon_don",'개발자 5 흔한 외식 메뉴가 앱 음식으로 판정');
    need(r.jeyuk==="avoid"&&r.tuna==="avoid",`개발자 5 맵고 자극적인 메뉴 이름(제육·비빔) (${r.jeyuk}, ${r.tuna})`);
    need(r.ban===0,`개발자 1 절대 금지 설명에 '조금만·소량만·자주 먹지 않습니다' 없음 (${r.ban})`);
    await p.context().close()}

  console.log('== 옛 id 잇기·CSV·바코드(개발자 2, 사용자 4·13)');
  {const old=Object.keys(require(path.join(ROOT,'src','data','generated','gen_out.json')).idmap)[0];
    const p=await open();
    await p.evaluate(o=>{S.favs=[o]; save()},old);   // 묶이기 전 id로 저장된 즐겨찾기
    await p.waitForTimeout(700); await p.reload(); await p.ready(); await p.waitForTimeout(200);
    const r=await p.evaluate(o=>({fav:S.favs, map:IDMAP[o], logs:Object.keys(S.logs).length, consent:!!S.consent, fail:LOAD_FAIL, stale:STALE}),old);
    need(r.fav.length===1&&r.fav[0]===r.map,`개발자 2 묶여 빠진 옛 제품 id(즐겨찾기)를 대표 id로 잇기 (${old} → ${r.fav})`);
    const c=await p.evaluate(()=>{const t=csvText([["a","=1+1"],["b,c",'"q"']]); return {bom:t.charCodeAt(0)===0xFEFF, inj:t.includes("'=1+1"), q:t.includes('"b,c"')&&t.includes('"""q"""'), logs:csvRows("logs").length}});
    need(c.bom&&c.inj&&c.q&&c.logs>=2,`사용자 4 CSV: BOM·수식 막기·따옴표 처리, 증상 기록 행 ${JSON.stringify(c)}`);
    const code="8801000001231";
    const bc=await p.evaluate(c=>{S.barcodes={}; return gtinOK(c)&&!gtinOK("8801000001232")},code);
    await p.evaluate(()=>{S.tab="food"; S.foodSub="label"; SCR=null; render()}); await p.click('[data-act=bcOpen]'); await p.fill('#bcCode',code); await p.click('[data-act=bcFind]'); await p.waitForTimeout(150);
    await p.fill('#bcQ','햇반'); await p.waitForTimeout(200); await p.click('#bcList [data-act=bcLink] >> nth=0'); await p.waitForTimeout(200);
    const linked=await p.evaluate(c=>({m:S.barcodes[c], title:document.querySelector('#sheetRoot h2')?.textContent}),code);
    await p.evaluate(()=>closeSheet()); await p.click('[data-act=bcOpen]'); await p.fill('#bcCode',code); await p.press('#bcCode','Enter'); await p.waitForTimeout(200);
    const again=await p.evaluate(()=>document.querySelector('#sheetRoot h2')?.textContent);
    need(bc&&linked.m&&again===linked.title,`사용자 13 바코드: 검사 숫자 확인, 처음 한 번 음식과 연결하면 다음부터 바로 (${again})`);
    await p.context().close()}

  console.log('== PC·아이폰(휴대폰과 같은 화면)');
  {const p=await open({w:1913,h:940,pc:true});
    const r=await p.evaluate(()=>{SCR=null; S.tab="plan"; render(); const g=s=>{const e=document.querySelector(s); const b=e&&e.getBoundingClientRect(); return b?[Math.round(b.left),Math.round(b.width)]:null}; return {body:g('body'),tabs:g('.tabs'),vw:innerWidth}});
    need(r.body[1]===640&&Math.abs(r.body[0]-(r.vw-640)/2)<=1&&r.tabs[1]===640&&r.tabs[0]===r.body[0],`PC: 가운데 640px 휴대폰 화면, 아래 메뉴도 같은 너비 (${JSON.stringify(r)})`);
    await p.evaluate(()=>openWizard(today())); await p.waitForTimeout(200);
    const bb=await p.evaluate(()=>{const b=document.querySelector('.bottom-bar').getBoundingClientRect(); return [Math.round(b.left),Math.round(b.width)]});
    need(bb[1]===640,`PC: 기록 화면 아래 버튼도 같은 너비 (${bb})`);
    await p.context().close()}
  {const p=await open();
    const small=await p.evaluate(async()=>{const out=[]; const chk=t=>document.querySelectorAll('input,select,textarea').forEach(e=>{if(e.offsetParent&&!["checkbox","range","file","radio"].includes(e.type)&&parseFloat(getComputedStyle(e).fontSize)<16) out.push(t+':'+(e.id||e.className))});
      for(const n of ["set-remind","nutri","set-profile","set-data","asks"]){SCR={name:n}; render(); await new Promise(r=>setTimeout(r,30)); chk(n)} SCR=null; S.tab="food"; render(); chk("food"); return out});
    need(small.length===0,`아이폰: 입력칸 글자 16px 이상(누르면 확대되지 않게) ${small.slice(0,4)}`);
    await p.context().close()}

  console.log('== 안드로이드 앱: 예전 주소의 기록 옮기기');
  {const p=await open({noSeed:true,init:`window.UCTableAndroid={takeMigrated:()=>{window.__took=(window.__took||0)+1; return JSON.stringify({app:"uc-table",v:1,profile:{height:"170"},logs:{"2026-10-01":{day:2}},consent:{date:"2026-10-01"},onb:"done"})}}`});
    const r=await p.evaluate(()=>({h:S.profile.height,logs:Object.keys(S.logs),took:window.__took}));
    need(r.h==="170"&&r.logs.includes("2026-10-01")&&r.took===1,`비어 있는 새 주소에서 한 번만 가져옴 (${JSON.stringify(r)})`);
    await p.reload(); await p.ready(); await p.waitForTimeout(200);
    const r2=await p.evaluate(()=>({took:window.__took||0,h:S.profile.height}));
    need(r2.took===0&&r2.h==="170",'기록이 있으면 다시 가져오지 않음');
    await p.context().close()}

  await b.close();
  console.log(F.length?'FAIL '+F.join(' / '):'검증 통과'); process.exit(F.length?1:0);
})();
