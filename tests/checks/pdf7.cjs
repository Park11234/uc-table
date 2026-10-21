const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}

/* 진료기록 시안 v7(2026-10-20)대로 진료 문서가 나오는지 확인한다: SCCAI 없음, 배변 횟수·혈변 막대 그래프, 기간 요약 8칸, 묻고 싶은 것은 맨 끝.
   시안에 없지만 남기기로 한 것(의료기기 아님 안내)도 함께 지킨다 */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const BODY=fs.readFileSync(APP,'utf8');
const page=T('pdf7.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+BODY+'</body></html>');
const SEED=()=>{ S.consent={date:today()}; S.onb="done"; S.stageMode="auto";
  S.profile.sex="M"; S.profile.height="177"; S.profile.age="24"; S.profile.meds=["asa","steroid","immuno"]; S.profile.allergies=[]; S.profile.lactose=false;
  S.orders.checked=["lowres","nolactose","lowfodmap","nospicy"]; S.orders.other=[];
  const d=today(), d1=addDays(d,-1);
  S.weights=[{date:d,kg:60}];
  S.logs={}; S.logs[d1]={...BLANK_LOG(),date:d1,day:0,night:0,bloody:0,urg:1,blood:1,pain:0,extra:["식욕 저하"]};
  S.logs[d]={...BLANK_LOG(),date:d,day:1,night:0,bloody:1,urg:0,blood:1,pain:3,stool:4,medtaken:1,gas:"약간",fatigue:"약간"};
  S.skips={[d]:["점심"]}; S.ate={[d]:["저녁"]}; S.ateMeals={[d]:{"저녁":{t:"흰쌀밥·소고기 수육·단호박찜"}}};
  S.qs=[{t:"철분제를 먹어도 되나요?",date:d,done:false}];
  S.triggers=[]; S.ratings=[]; S.care={}; S.reportDays=14; save(); };
(async()=>{
  const b=await chromium.launch();
  const open=async()=>{const ctx=await b.newContext({viewport:{width:390,height:844}}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready(); await p.waitForTimeout(150); return p};

  console.log('== 시안 v7 구성(글자 PDF가 쓰는 #printDoc)');
  {const p=await open(); await p.emulateMedia({media:'print'});   // 인쇄 화면의 글자 모양(표지 테두리 등)을 본다
    const r=await p.evaluate(()=>{window.print=()=>{}; printReport(); const box=document.getElementById('printDoc');
      const h2=[...box.querySelectorAll('h2')].map(e=>e.textContent.trim());
      const tbl=t=>[...box.querySelectorAll('h2')].find(e=>e.textContent.trim().startsWith(t));
      const nextTable=h=>{let e=h&&h.parentElement.querySelector('table'); return e};
      const sumT=nextTable(tbl('기간 요약')); const sum=sumT?[...sumT.querySelectorAll('th')].map(e=>e.textContent.trim()):[];
      const sumV=sumT?[...sumT.querySelectorAll('td')].map(e=>e.textContent.trim()):[];
      const sym=nextTable(tbl('증상 기록')); const symHead=sym?[...sym.querySelectorAll('thead th')].map(e=>e.textContent.trim()):[];
      const sub=sym?[...sym.querySelectorAll('tr.sub td')].map(e=>({span:e.colSpan,t:e.textContent.trim()})):[];
      const care=nextTable(tbl('건강 관리 점검')); const careRows=care?[...care.querySelectorAll('tbody tr')].map(tr=>[...tr.children].map(c=>c.textContent.trim()).join(' ')):[];
      const basic=nextTable(tbl('기본 정보')); const basicTh=basic?[...basic.querySelectorAll('th')].map(e=>e.textContent.trim()):[];
      const cover=box.querySelector('.cover'); const cv=box.querySelector('canvas[data-chart]');
      let chart=null; if(cv){const g=cv.getContext('2d'), W=cv.width, H=cv.height, id=g.getImageData(0,0,W,H).data;
        const clusters=(test,y0,y1)=>{let n=0,on=false; for(let x=0;x<W;x++){let hit=false; for(let y=y0;y<y1&&!hit;y++){const i=(y*W+x)*4; if(test(id[i],id[i+1],id[i+2])) hit=true} if(hit&&!on){n++} on=hit} return n};
        const red=(r,gg,bb)=>r>170&&gg<80&&bb<80, blue=(r,gg,bb)=>Math.abs(r-47)<14&&Math.abs(gg-111)<14&&Math.abs(bb-237)<14;
        chart={dc:cv.dataset.chart,w:W,h:H,red:clusters(red,0,Math.floor(H*0.28)),redLow:clusters(red,Math.floor(H*0.28),H),blue:clusters(blue,0,H)}}
      return {h2,sum,sumV,symHead,sub,careRows,basicTh,coverTxt:cover?cover.innerText.replace(/\s+/g,' '):"",coverBorder:cover?getComputedStyle(cover).borderTopColor:"",chart,
        all:box.innerText, notes:[...box.querySelectorAll('.note')].map(e=>e.textContent), cap:[...box.querySelectorAll('div')].filter(e=>!e.querySelector('div')&&/PRO2/.test(e.textContent)).length}});
    const all=r.all;
    need(!/SCCAI|Walmsley/.test(all),'문서 어디에도 SCCAI·Walmsley 글자가 없음');
    need(!/현재 식단 단계/.test(all)&&!/환자가 앱\(UC TABLE\)에 직접 남긴 기록을 정리한 문서입니다/.test(r.coverTxt),`표지·기본 정보에 '현재 식단 단계'와 설명 줄이 없음 (${r.coverTxt})`);
    need(/기간 2\d{3}-\d\d-\d\d ~ 2\d{3}-\d\d-\d\d \(14일\) 작성일 2\d{3}-\d\d-\d\d 기본 정보 남성 · 177cm · 24세 · 60kg/.test(r.coverTxt),'표지: 제목 아래 기간·작성일·기본 정보 한 줄');
    need(r.coverBorder==='rgb(17, 17, 17)',`표지 테두리는 시안처럼 #111 (${r.coverBorder})`);
    need(r.h2[0]==='기간 요약'&&r.h2[1]==='배변 횟수·혈변 추이'&&r.h2[2]==='기본 정보'&&r.h2[3]==='증상 기록 (환자 자가 기록)',`제목 순서: 기간 요약 → 배변 횟수·혈변 추이 → 기본 정보 → 증상 기록 (${r.h2.join(' / ')})`);
    need(JSON.stringify(r.sum)===JSON.stringify(['증상 기록','하루 배변 횟수(평균·최대)','혈변이 있었던 날','약을 거른 날','하루 평균 끼니','체중 변화','단단한 변(1–2형)','무른 변(브리스톨 6–7형)']),`기간 요약 칸 8개와 순서가 시안과 같음 (${r.sum.join(' | ')})`);
    need(JSON.stringify(r.sumV)===JSON.stringify(['2일 / 14일','0.5회 · 1회','2일','0일','1끼 (식사를 기록한 날 기준)','-','0일','0일']),`기간 요약 값: 2일/14일, 0.5회·1회, 혈변 2일, 거른 0일, 1끼, 체중 변화 한 건뿐이면 '-' (${r.sumV.join(' | ')})`);
    need(r.chart&&r.chart.dc==='stool'&&r.chart.red===2&&r.chart.redLow===0&&r.chart.blue===2,`그래프: 막대(파랑) 2개, 혈변 빨간 점 2개가 맨 위 줄에만 (${JSON.stringify(r.chart)})`);
    need(r.cap===1&&/막대는 하루 배변 횟수\(낮\+밤\), 빨간 점은 혈변이 있었던 날입니다\. 기록이 없는 날은 비워 두었습니다\./.test(all),'그래프 설명 줄: 막대·빨간 점·기록 없는 날');
    need(/배변 횟수·혈변은 Mayo 점수의 환자 보고 항목\(PRO2\)입니다\./.test(all),'그래프 아래에 Mayo PRO2 안내 줄');
    need(!r.basicTh.includes('현재 식단 단계')&&r.basicTh.join('|')==='성별 / 키 / 나이|체중|복용 약|알레르기 / 유당불내증|의료진 지시',`기본 정보 행: ${r.basicTh.join(' | ')}`);
    need(JSON.stringify(r.symHead)===JSON.stringify(['날짜','낮/밤 배변','혈변 횟수','급박감','혈변 정도','복통','변 모양','약','가스','피로','체온/맥박']),`증상 기록 열 11개, SCCAI 열 없음 (${r.symHead.join(' | ')})`);
    need(r.sub.length===1&&r.sub[0].span===11&&/기타 증상 식욕 저하/.test(r.sub[0].t),`증상 기록 보조 줄이 11칸을 가로지름 (${JSON.stringify(r.sub)})`);
    need(r.careRows.length===1&&/^예방접종 독감·폐렴구균·대상포진·B형간염 등: 확인 필요$/.test(r.careRows[0]),`건강 관리 점검은 예방접종 한 줄 (${r.careRows.join(' / ')})`);
    const idx=s=>r.h2.findIndex(x=>x.startsWith(s));
    need(idx('이번 진료 때 묻고 싶은 것')===r.h2.length-1&&idx('개인 주의 음식')<idx('이번 진료 때 묻고 싶은 것')&&idx('건강 관리 점검')<idx('개인 주의 음식'),`'이번 진료 때 묻고 싶은 것'이 맨 끝 (${r.h2.join(' / ')})`);
    need(!/기간 내 시험이 없습니다/.test(all)&&!r.notes.some(t=>/메뉴 이름\(또는 '먹음'\)/.test(t)),'시안에 없는 빈 재도입 시험 블록·식사 기록 안내 줄이 없음');
    need(!/진료 때 알릴 사항/.test(all)&&!/우울감이나 죽고 싶다는 생각/.test(all)&&!/직접 확인해 알릴 것/.test(all),"'진료 때 알릴 사항' 블록은 사용자 요청(2026-10-21)으로 뺌");
    need(/STRIDE-II\(Turner 등, Gastroenterology 2021\)는 성인 궤양성 대장염의 임상적 관해를 직장 출혈 0점·배변 횟수 0점으로 정의/.test(all)&&/중간 결과 지표로 소개/.test(all)&&!/증상 평가에 사용합니다/.test(all),'그래프 아래 안내: 원문 확인한 표현(STRIDE-II 관해 정의, ACG 2025는 중간 결과 지표)');
    need(/UC TABLE은 의료기기가 아니며 진단·치료를 하지 않습니다/.test(all)&&/환자가 앱\(UC TABLE\)에 직접 기록한 내용/.test(all),'시안에는 없지만 의료기기 아님·환자 자가 기록 안내 한 줄은 남김');
    await p.context().close()}

  console.log('== 기록이 많을 때·빠른 기록·체중 변화');
  {const p=await open();
    const r=await p.evaluate(()=>{window.print=()=>{};
      const d=today(); S.weights=[{date:addDays(d,-10),kg:60.5},{date:d,kg:59.2}];
      for(let i=0;i<14;i++){const k=addDays(d,-i); S.logs[k]={...BLANK_LOG(),date:k,day:2+(i%5),night:i%2,bloody:i%3,blood:i%4,urg:i%4,pain:i%11,quick:i===3,extra:i%2?["관절통"]:[],memo:i===5?"메모 있음":""}}
      printReport(); const box=document.getElementById('printDoc'); const t=box.innerText;
      const cv=box.querySelector('canvas[data-chart]'); const ok=!!cv&&cv.width===1392;
      return {t,ok,note:/빠른 기록 1일은 배변 횟수\(낮·밤 합계\)·급박감·피만 적어, 밤 배변·몸 상태·장 밖 증상이 빠져 있습니다/.test(t),hollow:/속이 빈 막대는 빠른 기록/.test(t),wt:(()=>{const th=[...box.querySelectorAll('th')].find(e=>e.textContent.trim()==='체중 변화'); return th&&th.nextElementSibling.textContent.trim()})()}});
    need(!/SCCAI/.test(r.t),'기록이 많아도 SCCAI 글자가 없음');
    need(r.ok,'그래프 그림판이 있음');
    need(r.note,'빠른 기록 안내는 SCCAI 말 없이 남음');
    need(r.hollow,'빠른 기록이 있으면 속이 빈 막대 설명이 붙음');
    need(r.wt==='-1.3kg',`체중이 두 번 이상이면 마지막−처음을 보임 (${r.wt})`);
    await p.context().close()}

  console.log('== 그림 PDF(jsPDF) 글자 규칙');
  {// jsPDF 기본 글꼴은 한글을 그리지 못해 글자가 깨진다. pdf.text에는 한글을 쓰지 않고(그림으로 붙임) 바닥글은 날짜·쪽 번호만 글자로 쓴다
    const texts=[...BODY.matchAll(/pdf\.text\(([^\n]*)\)/g)].map(m=>m[1]);
    need(texts.length>0&&texts.every(t=>!/[가-힣]/.test(t)),`pdf.text 호출 ${texts.length}곳에 한글이 없음`);
    need(/g\.fillText\(`\$\{today\(\)\} 작성`/.test(BODY),"바닥글 '날짜 작성'은 그림 위에 그려 붙임");}

  await b.close();
  if(F.length){console.log('\nFAIL '+F.length+'개'); process.exit(1)} console.log('\n검증 통과');
})().catch(e=>{console.error(e); process.exit(1)});
