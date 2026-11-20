const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}

/* v1.13.0 23차(2026-11-16) 사용자 요청: 식단 단계를 저잔사식·지중해식·정상식으로
   - 단계 이름은 저잔사식·지중해식·정상식, 이름 옆 윗첨자로 먹는 내용(섬유를 줄인 식사·생선·채소·올리브유 위주 식사·골고루 먹는 식사).
     병의 상태(관해·활동기)는 말하지 않음(사용자 선택 '먹는 내용만')
   - 2단계(지중해식): 먹을 수 있는 음식 범위는 그대로, 식단을 짤 때 생선·올리브유가 든 메뉴를 먼저 고르고 붉은 고기 메뉴는 주 2회까지
   - 3단계(정상식): 통곡물·콩류·생채소까지 허용, 하루 식이섬유를 채우려 통곡물·콩류 메뉴를 먼저 고름(예전 3단계와 같음)
   - 옛 이름(이행식·조금씩 늘리는 식사)과 '관해기라' 같은 식단 안내가 화면에 남지 않음 */
const { chromium } = require('playwright');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
fs.mkdirSync(TMP,{recursive:true}); const page=path.join(TMP,'v1130f.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const WANT={1:["저잔사식","섬유를 줄인 식사"],2:["지중해식","생선·채소·올리브유 위주 식사"],3:["정상식","골고루 먹는 식사"]};
const OLD=/이행식|조금씩 늘리는 식사|관해기라|관해기에는|활동기에는|3단계\(관해기\)/;
const SEED=()=>{ const t=today(); S.consent={date:addDays(t,-30)}; S.onb="done"; S.persist="na"; S.stageMode="auto";
  S.profile={...S.profile,height:"170",weight:"60",age:"30",sex:"M",usualBM:"1"}; save(); };
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
  await p.route(/^https?:/, r=>r.fulfill({body:''}));
  const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
  await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready();

  console.log('== 단계 이름과 윗첨자');
  const names=await p.evaluate(()=>[1,2,3].map(n=>[STAGES[n].name,STAGES[n].plain]));
  need(JSON.stringify(names)===JSON.stringify([WANT[1],WANT[2],WANT[3]]),`세 단계 이름 (${JSON.stringify(names)})`);
  for(const st of [1,2,3]){
    const r=await p.evaluate(st=>{S.stageMode=String(st); save(); const out={};
      const lab=el=>{if(!el) return null; const sx=el.querySelector('sup.sx'); const c=el.cloneNode(true); c.querySelectorAll('.sr-only,sup,.sdots,svg').forEach(x=>x.remove());
        const fs=sx?parseFloat(getComputedStyle(sx).fontSize):0, pfs=parseFloat(getComputedStyle(el).fontSize);
        return {main:c.textContent.replace(/\s+/g," ").trim(), sx:sx?sx.textContent.replace(/[()]/g,"").trim():"", sr:sx?[...sx.querySelectorAll('.sr-only')].map(x=>x.textContent).join(""):"", small:sx?fs<pfs:false,
          up:sx?sx.getBoundingClientRect().top<(el.querySelector('.stn')||el).getBoundingClientRect().top+2:false, gq:!!el.querySelector('.gq'), aria:el.getAttribute('aria-label')||""}};
      SCR=null; S.tab="plan"; S.selDay=0; render(); out.home=lab(document.querySelector('.ridge .r-stage'));
      S.logs[today()]={...BLANK_LOG(),day:1}; S.tab="log"; render(); out.log=lab([...document.querySelectorAll('#main .today-card .kv')].find(k=>k.querySelector('span')?.textContent==="식단 단계")?.querySelector('b'));
      S.tab="me"; render(); out.me=lab(document.querySelector('#main .profile small'));
      openScr("set-stage"); out.set=[...document.querySelectorAll('#main [data-act=stageMode]')].filter(x=>x.dataset.v!=="auto").map(x=>lab(x.querySelector('b')));
      delete S.logs[today()]; save(); SCR=null; return out},st);
    const [nm,pl]=WANT[st];
    for(const [k,v] of [["홈 띠",r.home],["기록 탭",r.log],["내 정보",r.me]])
      need(v&&v.main.startsWith(nm)&&v.sx===pl&&v.sr==="()"&&v.small&&v.up&&!v.gq,`${st}단계 ${k}: '${nm}' + 윗첨자 '${pl}' (${JSON.stringify(v)})`);
    need(/식단 단계/.test(r.home?.aria||"")&&(r.home?.aria||"").includes(`${nm}(${pl})`),`${st}단계 홈 띠 단추를 읽으면 '${nm}(${pl})' (${r.home?.aria})`);
    if(st===1) need(r.set.length===3&&r.set.every((v,i)=>v.main.startsWith(WANT[i+1][0])&&v.sx===WANT[i+1][1]),`식단 단계 화면 세 줄 (${JSON.stringify(r.set.map(v=>[v.main,v.sx]))})`);
  }

  console.log('== 음식 판정 이유의 단계 이름');
  const why=await p.evaluate(()=>{const R=(st,id)=>{S.stageMode=String(st); save(); return foodStatus(FOOD[id],ctx()).reasons.join(" / ")};
    return {ms2at1:R(1,"black_rice"), ms3at2:R(2,"bean_rice"), ms3at1:R(1,"bean_rice")}});
  need(/지중해식 단계부터 먹을 수 있습니다/.test(why.ms2at1),`2단계 음식을 1단계에서: '${why.ms2at1}'`);
  need(/정상식 단계부터 먹을 수 있습니다/.test(why.ms3at2)&&/정상식 단계부터/.test(why.ms3at1),`3단계 음식을 2·1단계에서: '${why.ms3at2}' · '${why.ms3at1}'`);

  console.log('== 2단계(지중해식) 식단: 생선·올리브유 메뉴 먼저, 붉은 고기는 주 2회까지');
  const plan=await p.evaluate(()=>{const out={};
    const red=id=>FOOD[id]?.tags.includes("redmeat"), fishOil=id=>FOOD[id]?.tags.includes("fish")||id==="olive_oil";
    for(const [k,prof,good] of [["기본",{}],["60kg 여성",{sex:"F",weight:"52"}],["생선 알레르기",{allergies:["fish"]}],["소고기를 '좋음'으로 평가",{},["beef","pork"]]]){
      S.profile={...S.profile,height:"170",weight:"60",age:"30",sex:"M",allergies:[],...prof}; S.swaps={}; S.stageMode="2";
      S.ratings=(good||[]).map(id=>({date:addDays(today(),-1),slot:"점심",title:"x",foodId:id,rating:"good"})); save();
      const P=samplePlan(); const ms=P.days.flatMap(d=>d.meals.filter(m=>!m.snack&&!m.off&&!m.empty)), ld=P.days.flatMap(d=>d.meals.filter((m,n)=>n>0&&n<3&&!m.off&&!m.empty));
      out[k]={n:ms.length,ld:ld.length,fo:ld.filter(m=>m.med||m.items.some(([i])=>fishOil(i))).length,red:ms.filter(m=>m.items.some(([i])=>red(i))).length,empty:P.days.flatMap(d=>d.meals).filter(m=>m.empty).length}}
    S.profile={...S.profile,allergies:[]}; S.ratings=[]; save(); return out});
  for(const [k,v] of Object.entries(plan)){
    if(k==="기본"||k==="60kg 여성") need(v.fo>=Math.ceil(v.ld*0.8),`${k}: 점심·저녁 ${v.ld}끼 중 생선·올리브유가 든 메뉴 ${v.fo}끼(80% 이상)`);
    need(v.red<=2&&!v.empty,`${k}: 붉은 고기 메뉴 ${v.red}끼(주 2회 이하), 빈 끼니 ${v.empty}`);
  }

  console.log('== 3단계(정상식): 통곡물·콩류 메뉴로 섬유 목표, 식단 안내에 관해 말 없음');
  const s3=await p.evaluate(()=>{S.stageMode="3"; S.swaps={}; save(); const P=samplePlan(); const ms=P.days.flatMap(d=>d.meals.filter(m=>!m.snack&&!m.off&&!m.empty));
    const tips=P.days.flatMap(d=>d.meals.map(m=>[m.tip,m.tip2].join(" "))).join(" ");
    S.stageMode="2"; save(); const P2=samplePlan(); const tips2=P2.days.flatMap(d=>d.meals.map(m=>[m.tip,m.tip2].join(" "))).join(" ");
    return {n:ms.length,med:ms.filter(m=>m.med).length,old:(tips.match(/.{0,15}(관해기라|관해기에는|활동기에는|이행식).{0,15}/)||[""])[0],old2:(tips2.match(/.{0,15}(관해기라|관해기에는|활동기에는|이행식).{0,15}/)||[""])[0]}});
  need(s3.med>=12,`정상식 세 끼 ${s3.n}끼 중 통곡물·콩류 메뉴(지중해식 표시) ${s3.med}끼(12끼 이상, 섬유 목표)`);
  need(!s3.old&&!s3.old2,`식단 안내에 관해·활동기·이행식 말 없음 ('${s3.old||s3.old2}')`);

  console.log('== 옛 이름이 화면에 남지 않음');
  const left=await p.evaluate(src=>{const RX=new RegExp(src); const hit=s=>{const m=String(s).match(RX); return m?String(s).slice(Math.max(0,m.index-15),m.index+20).replace(/\s+/g," "):""};
    const T=()=>document.querySelector('#main').innerText+" "+[...document.querySelectorAll('#main [aria-label]')].map(e=>e.getAttribute('aria-label')).join(" "); const out={};
    for(const st of ["1","2","3"]){S.stageMode=st; save();
      for(const [k,fn] of [["홈",()=>{S.tab="plan"; render()}],["기록",()=>{S.tab="log"; render()}],["내 정보",()=>{S.tab="me"; render()}],["찾아보기",()=>{S.tab="food"; render()}],["식단 단계",()=>openScr("set-stage")],["영양",()=>openScr("nutri")],["궁금한 점",()=>openScr("qa")]]){SCR=null; fn(); out[st+" "+k]=hit(T())}
      SCR=null; S.tab="plan"; render();
      for(const k of ["plan","log","me"]) out[st+" 안내 "+k]=hit(infoBody(k));
      out[st+" 음식 이유"]=hit(FOODS.map(f=>foodStatus(f,ctx()).reasons.join(" ")).join(" "));}
    {const m=QA.map(q=>q.a).join(" ").match(/이행식|조금씩 늘리는 식사|\d단계\(관해기\)/); out["궁금한 점 답"]=m?m[0]:""}   // 궁금한 점의 '관해기에는'(지침 내용)은 그대로 둠
    S.onb="3"; render(); out["첫 실행 3"]=hit(T()); S.onb="done"; render();
    return out},OLD.source);
  for(const [k,v] of Object.entries(left)) need(!v,`${k}: 옛 단계 이름·관해 식단 안내 없음${v?` ('…${v}…')`:""}`);

  await b.close();
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exitCode=1});
