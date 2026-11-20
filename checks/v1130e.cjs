const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}

/* v1.13.0 22차(2026-11-16) 사용자 요청: 기록값은 식단 관리에만 쓴다
   - 기록값에 따른 위험 경고·내원 권고, 고정된 내원 안내를 모두 뺌(아주 나쁜 기록·체중이 크게 준 기록을 넣어도 경고가 없음)
   - 병의 상태(관해·활동기·중증도·점수)를 화면에 말하지 않음. 기록값은 식단 단계를 고르는 데만 쓰고, 그래프는 적은 값(하루 배변 횟수) 그대로
   - 진료용 PDF 대신 음식별 경험 PDF: 평가한 음식마다 먹은 날·내 평가·불편했던 점과 그날 적은 증상을 그대로(분석·의심 후보 없음) */
const { chromium } = require('playwright');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
fs.mkdirSync(TMP,{recursive:true}); const page=path.join(TMP,'v1130e.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const BAN=/병원에 내원|내원하십시오|활동기|관해|중증|중등도|경증|Truelove|위험 신호|점수|영양불량|주치의에게 알려|주치의\(IBD 진료팀\)|진료용|의심 후보/;
const SEED=()=>{ const t=today(); S.consent={date:addDays(t,-60)}; S.onb="done"; S.persist="na"; S.stageMode="auto";
  S.profile={...S.profile,height:"174",weight:"70",age:"30",sex:"M",usualBM:"1"};
  const bad={...BLANK_LOG(),day:8,night:3,bloody:8,blood:3,urg:3,well:4,pain:9,temp:"38.5",other:["구토","어지러움"],memo:"힘든 날"};
  for(let i=0;i<4;i++) S.logs[addDays(t,-i)]={...bad};
  S.logs[addDays(t,-5)]={...BLANK_LOG(),day:2,night:1,bloody:3,blood:1,pain:2,memo:"점심 뒤 배가 불편"};
  S.weights=[{date:addDays(t,-100),kg:80},{date:t,kg:66}];
  S.ratings=[{date:t,slot:"아침",title:"흰죽 정식",foodId:"rice_porridge",rating:"bad",sym:["blood","pain"]},
    {date:addDays(t,-5),slot:"점심",title:"흰죽 정식",foodId:"rice_porridge",rating:"good"},
    {date:addDays(t,-3),slot:"제품",title:"바나나우유",foodId:null,name:"바나나우유",rating:"ok"}];
  const d2=addDays(t,-2); S.ate={...(S.ate||{}),[d2]:["아침","점심"]};
  S.ateMeals={...(S.ateMeals||{}),[d2]:{"아침":{t:"흰죽 아침",it:[["rice_porridge",200]]},"점심":{t:"쌀밥 점심",it:[["white_rice",210]]}}};
  S.reportDays=30; save(); };
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
  await p.route(/^https?:/, r=>r.fulfill({body:''}));
  const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
  await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready();
  const ban=await p.evaluate(src=>{const BAN=new RegExp(src); const T=()=>document.querySelector('#main').innerText+" "+[...document.querySelectorAll('#main [aria-label]')].map(e=>e.getAttribute('aria-label')).join(" ");
    const hit=s=>{const m=s.match(BAN); return m?s.slice(Math.max(0,m.index-20),m.index+30).replace(/\s+/g," "):""}; const out={};
    const show=(k,fn)=>{SCR=null; fn(); out[k]=hit(T())};
    show("홈",()=>{S.tab="plan"; S.selDay=0; render()});
    out.alerts=document.querySelectorAll('#main .banner.crit,#main .banner.urgent,#main .banner.warn[role=alert]').length;
    show("기록 탭",()=>{S.tab="log"; render()});
    show("내 정보",()=>{S.tab="me"; render()});
    for(const n of ["set-stage","set-weight","set-warn","reintro","pdf","asks","care","report"]) show(n,()=>openScr(n));
    show("지난 날",()=>openScr("past",{date:addDays(today(),-1)}));
    // 음식 다시 먹어 보기 중에 나쁜 기록이 있으면: 시험을 멈추라는 식단 안내만(빨간 경고·주치의 안내 없음)
    S.reintro.active={name:"우유",foodId:"milk",start:addDays(today(),-1),days:[{r:"심함"},{},{}]};
    show("다시 먹어 보기 중단",()=>openScr("reintro")); out.riStop=/시험을 멈/.test(document.querySelector('#main').innerText); out.riCrit=document.querySelectorAll('#main .banner.crit,#main .banner.urgent').length; S.reintro.active=null;
    show("기록 요약",()=>{openWizard(today()); WZ.step=WS().length-1; render()});
    out.wzBanners=document.querySelectorAll('#main .banner.crit,#main .banner.urgent').length;
    out.wzScore=!!document.querySelector('#main .score');
    SCR=null; S.tab="plan"; render();
    out.welcome=hit(viewWelcome());
    openBadSheet([{key:"rice_porridge",name:"흰죽",foodId:"rice_porridge"}],"meal"); BAD.list[0].sym=["allergy","blood"]; out.badSheet=hit(badSheetHTML()); BAD=null; closeSheet();
    out.stageSrc=hit(currentStage().src); out.csv=hit(csvRows("logs")[0].join(","));
    return out},BAN.source);
  console.log('== 경고·내원 안내·병의 상태 말이 화면에 없음 (아주 나쁜 기록 4일·체중 17% 감소를 넣고)');
  need(ban.alerts===0&&ban.wzBanners===0,`기록값에 따른 경고 띠가 없음 (홈 ${ban.alerts}개, 기록 요약 ${ban.wzBanners}개)`);
  for(const k of Object.keys(ban).filter(k=>typeof ban[k]==="string")) need(!ban[k],`${k}: 경고·내원·상태 판정 말 없음${ban[k]?` ('…${ban[k]}…')`:""}`);
  need(!ban.wzScore,'기록 요약에 점수 동그라미가 없음');
  need(ban.riStop&&ban.riCrit===0,`다시 먹어 보기 중단 안내는 빨간 경고 없이 (${ban.riStop}, ${ban.riCrit})`);

  console.log('== 기록값은 식단 단계와 적은 값 그대로');
  {const r=await p.evaluate(()=>{SCR=null; S.tab="plan"; S.selDay=0; render(); const t=today(), l=S.logs[t];
      const svg=document.querySelector('.ridge .r-chart'); const head=document.querySelector('.ridge .r-head')?.textContent||"";
      const st=currentStage().stage; const tile=[...document.querySelectorAll('[data-act="openScr"][data-v="pdf"]')].map(e=>e.textContent.trim()); S.tab="log"; render(); const tc=document.querySelector('.today-card');
      return {stage:st, total:bmTotal(l), bloody:l.bloody, head, aria:svg?.getAttribute('aria-label')||"", band:!!svg?.querySelector('.band'), bdots:svg?svg.querySelectorAll('.bdot').length:0,
        today:tc?.querySelector('h2')?.textContent||"", score:!!tc?.querySelector('.score'), chip:document.querySelectorAll('#main .chip-sc').length,
        chartHint:document.querySelector('#logChart')?.closest('.card')?.innerText||"", suspects:/먹은 뒤 증상이 나빴던/.test(document.querySelector('#main').innerText),
        tile:[...tile,...[...document.querySelectorAll('[data-act="openScr"][data-v="pdf"]')].map(e=>e.querySelector('b')?.textContent.trim()||e.textContent.trim())]}});
    need(r.stage===1,`아주 나쁜 기록이면 식단 단계는 가장 부드러운 단계 (${r.stage})`);
    need(r.head.includes(`배변 ${r.total}회`)&&r.head.includes(`혈변 ${r.bloody}회`),`홈 상태 띠는 적은 값 그대로 ('${r.head}')`);
    need(/하루 배변 횟수/.test(r.aria)&&r.aria.includes(`${r.total}회`)&&!r.band,`2주 그래프는 하루 배변 횟수, 기준 띠 없음 ('${r.aria.slice(0,80)}')`);
    need(r.bdots>=4,`혈변이 있던 날은 그래프에 점으로 (${r.bdots}개)`);
    need(r.today.includes(`배변 ${r.total}회`)&&!r.score&&!r.chip,`기록 탭 오늘 카드·목록에 점수 없음 ('${r.today}', 점수 ${r.score}, 목록 숫자 ${r.chip})`);
    need(/하루 배변 횟수/.test(r.chartHint),`기록 탭 그래프 설명은 하루 배변 횟수 ('${r.chartHint.slice(0,60)}')`);
    need(!r.suspects,'의심 후보 음식 카드 없음');
    need(r.tile.length>=2&&r.tile.every(x=>x==="음식 경험 PDF"),`PDF 입구 이름은 '음식 경험 PDF' (${r.tile.join(' / ')})`)}

  console.log('== 음식별 경험 PDF');
  {const r=await p.evaluate(()=>{const {blocks}=reportBlocks(); const d=document.createElement('div'); d.innerHTML=blocks.join(""); const tx=d.innerText||d.textContent;
      const t=today(); return {tx, porridge:FOOD.rice_porridge.name, rice:FOOD.white_rice.name, d0:t.slice(5), d2:addDays(t,-2).slice(5), d5:addDays(t,-5).slice(5), d3:addDays(t,-3).slice(5)}});
    const tx=r.tx.replace(/\s+/g," ");
    need(/음식별 경험/.test(tx),'제목은 음식별 경험');
    need(tx.includes(r.porridge)&&tx.includes('바나나우유 (제품)'),'평가한 음식(끼니 음식·제품)이 들어감');
    need(!tx.includes(r.rice),'평가하지 않은 음식은 넣지 않음');
    need(/나쁨[^]*변에 피가 보였습니다/.test(tx)&&tx.includes('좋음')&&tx.includes('보통'),'내 평가와 불편했던 점');
    need(tx.includes(r.d2)&&/평가 안 함/.test(tx),`평가한 음식을 평가 없이 먹은 날(${r.d2})도 '평가 안 함'으로`);
    need(tx.includes('배변 낮 8회·밤 3회')&&tx.includes('피 섞인 변 8회')&&tx.includes('체온 38.5℃')&&tx.includes('힘든 날'),'그날 적은 증상·메모를 그대로');
    need(tx.includes('배변 낮 2회·밤 1회')&&tx.includes('점심 뒤 배가 불편'),`좋음으로 평가한 날(${r.d5})의 증상도 그대로`);
    const no=['기본 정보','기간 요약','GLIM','체중','복용 약','의료진 지시','건강 관리','묻고 싶은','검사 수치','식사 기록','증상이 나빴던 날이 더 많은','피셔','추이'].filter(w=>tx.includes(w));
    need(!no.length,`음식 경험만 담음 (들어간 것: ${no.join(', ')})`);
    need(!BAN.test(tx.replace(/의료기기가 아니며/,"")),`분석·판정 말 없음 ('${(tx.match(BAN)||[""])[0]}')`)}
  await ctx.close(); await b.close();
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exitCode=1});
