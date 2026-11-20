const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}

/* 22차(2026-11-16) 사용자 요청: 진료 문서(시안 v7) 대신 음식별 경험 문서. 글자 PDF(#printDoc)가 이렇게 나오는지 본다
   - 표지: 제목 '음식별 경험 기록' 아래 기간·작성일만(테두리 #111)
   - 평가한 음식마다 제목(좋음·보통·나쁨 수)과 표(날짜·끼니·내 평가·그날 적은 증상), 나쁨이 많은 음식부터, 날짜는 오래된 날부터
   - 개인 주의 음식·음식 다시 먹어 보기는 그 뒤. 기본 정보·기간 요약·그래프·증상 기록 표·건강 관리·묻고 싶은 것은 넣지 않음
   - 의료기기 아님 안내 한 줄은 남김 */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const BODY=fs.readFileSync(APP,'utf8');
const page=T('pdf7.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+BODY+'</body></html>');
const SEED=()=>{ S.consent={date:today()}; S.onb="done"; S.stageMode="auto";
  S.profile.sex="M"; S.profile.height="177"; S.profile.age="24"; S.profile.meds=["asa","steroid"]; S.orders.checked=["lowres"];
  const d=today(), d1=addDays(d,-1), d2=addDays(d,-2);
  S.weights=[{date:d,kg:60}];
  S.logs={}; S.logs[d1]={...BLANK_LOG(),date:d1,day:3,night:1,bloody:2,urg:1,blood:2,pain:4,extra:["식욕 저하"],memo:"저녁에 배가 아픔"};
  S.logs[d]={...BLANK_LOG(),date:d,day:1,night:0,bloody:0,pain:0,stool:4,gas:"약간"};
  S.ratings=[{date:d2,slot:"점심",title:"두부 정식",foodId:"tofu",rating:"good"},{date:d1,slot:"저녁",title:"두부 정식",foodId:"tofu",rating:"bad",sym:["pain"]},
    {date:d,slot:"아침",title:"흰쌀죽 아침",foodId:"rice_porridge",rating:"good"},{date:d,slot:"외식",title:"칼국수",foodId:null,name:"칼국수",rating:"ok"}];
  S.triggers=[{name:"두부",foodId:"tofu",date:d1,source:"식단 평가",sym:["pain"],never:false}];
  S.reintro.history=[{name:"우유",foodId:"milk",start:addDays(d,-3),end:d,days:[{r:"없음"},{r:"없음"},{r:"약간"}],result:"pass"}];
  S.qs=[{t:"철분제를 먹어도 되나요?",date:d,done:false}]; S.care={}; S.labs=[{date:d,k:"crp",v:"3",note:""}]; S.reportDays=14; save(); };
(async()=>{
  const b=await chromium.launch();
  const open=async()=>{const ctx=await b.newContext({viewport:{width:390,height:844}}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready(); await p.waitForTimeout(150); return p};

  console.log('== 음식별 경험 문서 구성(글자 PDF가 쓰는 #printDoc)');
  {const p=await open(); await p.emulateMedia({media:'print'});
    const r=await p.evaluate(()=>{let title=""; window.print=()=>{title=document.title}; printReport(); const box=document.getElementById('printDoc');
      const h2=[...box.querySelectorAll('h2')].map(e=>e.textContent.trim()), h3=[...box.querySelectorAll('h3')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
      const t1=box.querySelector('h3')?.closest('.blk')?.querySelector('table');
      const cover=box.querySelector('.cover');
      return {h2,h3,title,head:t1?[...t1.querySelectorAll('thead th')].map(e=>e.textContent.trim()):[],rows:t1?[...t1.querySelectorAll('tbody tr')].map(tr=>[...tr.children].map(c=>c.innerText.replace(/\s+/g,' ').trim())):[],
        coverTxt:cover?cover.innerText.replace(/\s+/g,' ').trim():"",coverBorder:cover?getComputedStyle(cover).borderTopColor:"",canvas:box.querySelectorAll('canvas').length,all:box.innerText,
        d1:addDays(today(),-1).slice(5), d2:addDays(today(),-2).slice(5), tofu:FOOD.tofu.name}});
    const all=r.all;
    need(/^음식별 경험 기록 기간 2\d{3}-\d\d-\d\d ~ 2\d{3}-\d\d-\d\d \(14일\) 작성일 2\d{3}-\d\d-\d\d$/.test(r.coverTxt),`표지: 제목 아래 기간·작성일만 (${r.coverTxt})`);
    need(r.coverBorder==='rgb(17, 17, 17)',`표지 테두리 #111 (${r.coverBorder})`);
    need(JSON.stringify(r.h2)===JSON.stringify(['음식별 경험','개인 주의 음식','음식 다시 먹어 보기']),`제목 순서: 음식별 경험 → 개인 주의 음식 → 음식 다시 먹어 보기 (${r.h2.join(' → ')})`);
    need(r.h3.length===3&&r.h3[0]===`${r.tofu} 좋음 1 · 보통 0 · 나쁨 1`&&r.h3.includes('칼국수 (외식) 좋음 0 · 보통 1 · 나쁨 0'),`음식마다 제목과 평가 수, 나쁨이 있는 음식이 먼저 (${r.h3.join(' / ')})`);
    need(JSON.stringify(r.head)===JSON.stringify(['날짜','끼니','내 평가','그날 적은 증상']),`표 열 4개 (${r.head.join(' | ')})`);
    need(r.rows.length===2&&r.rows[0][0]===r.d2&&r.rows[1][0]===r.d1&&r.rows[1][2]==='나쁨 배가 아팠습니다',`날짜는 오래된 날부터, 나쁨에는 불편했던 점 (${JSON.stringify(r.rows)})`);
    need(r.rows[0][3]==='기록 없음'&&/^배변 낮 3회·밤 1회 · 피 섞인 변 2회 · 피 가끔 뚜렷 · 급박감 서둘러야 함 · 복통 4\/10 · 식욕 저하 · 메모: 저녁에 배가 아픔$/.test(r.rows[1][3]),`그날 적은 증상은 적은 그대로, 없으면 '기록 없음' (${r.rows[1][3]})`);
    need(!r.canvas&&!/기본 정보|기간 요약|추이|증상 기록 \(|건강 관리|묻고 싶은 것|철분제|검사 수치|177|점수|활동기|관해|의심/.test(all),'문서에 음식 경험 말고는 없음(기본 정보·그래프·증상 표·건강 관리·질문·검사 수치·점수)');
    need(/UC TABLE은 의료기기가 아니며 진단·치료를 하지 않습니다/.test(all)&&/분석하거나 판정하지 않습니다/.test(all),'의료기기 아님·분석하지 않음 안내 한 줄');
    need(r.title===`음식경험_${await p.evaluate(()=>today())}`,`인쇄 문서 이름 (${r.title})`);
    await p.context().close()}

  console.log('== 평가한 음식이 없을 때');
  {const p=await open();
    const t=await p.evaluate(()=>{window.print=()=>{}; S.ratings=[]; S.triggers=[]; S.reintro.history=[]; printReport(); return document.getElementById('printDoc').innerText});
    need(/기간 안에 평가한 음식이 없습니다/.test(t)&&!/개인 주의 음식/.test(t),`빈 문서 안내 (${t.replace(/\s+/g,' ').slice(0,120)})`);
    await p.context().close()}

  console.log('== 그림 PDF(jsPDF) 글자 규칙');
  {// jsPDF 기본 글꼴은 한글을 그리지 못해 글자가 깨진다. pdf.text에는 한글을 쓰지 않고(그림으로 붙임) 바닥글은 날짜·쪽 번호만 글자로 쓴다
    const texts=[...BODY.matchAll(/pdf\.text\(([^\n]*)\)/g)].map(m=>m[1]);
    need(texts.length>0&&texts.every(t=>!/[가-힣]/.test(t)),`pdf.text 호출 ${texts.length}곳에 한글이 없음`);
    need(/g\.fillText\(`\$\{today\(\)\} 작성`/.test(BODY),"바닥글 '날짜 작성'은 그림 위에 그려 붙임");}

  await b.close();
  if(F.length){console.log('\nFAIL '+F.length+'개'); process.exit(1)} console.log('\n검증 통과');
})().catch(e=>{console.error(e); process.exit(1)});
