const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
require('../lib/guard.cjs');

/* 8차(2026-10-29) 외부 검토에서 옳다고 확인해 고친 것:
   1) 전격성 배변 횟수: 하루 10회 초과(ACG 2025[91])면 빨간 경고(예전 15회 이상이라 11~14회에 경고 없음)
   2) 보조 점수 설명에 장 밖 증상, 기록 목록에도 활동기 까닭
   3) 단계 문구에 지침 이름을 넣지 않음, 같은 말 반복 없음
   4) 다시 먹어 보기 중단 이유를 한 문장으로
   5) 참고문헌 꼬리표(제품 표시·앱 사용 안내)·배경 자료·DOI 링크
   6) 끼니 이름을 '·' 뒤에서만 나누는 덩어리, 영양 목표 근거의 열량 출처
   7) 변 모양 보기 8개가 모두 한 줄(예전엔 '2 울퉁불퉁한 소시지'가 두 줄로 꺾여 그 줄 칸이 모두 높아짐) */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const BODY=fs.readFileSync(APP,'utf8');
const page=T('v1126.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+BODY+'</body></html>');
const SEED=()=>{ S.consent={date:today()}; S.onb="done"; S.persist="na"; S.stageMode="auto"; S.profile={...S.profile,height:"174",weight:"63",age:"27",sex:"M"}; save(); };
(async()=>{
  const b=await chromium.launch();
  const open=async()=>{const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready(); await p.waitForTimeout(150); return p};
  const p=await open();

  console.log('== 1 전격성 배변 횟수(하루 10회 초과)');
  {const r=await p.evaluate(()=>{const L=o=>({...BLANK_LOG(),...o}); return {d10:dangerSignals(L({day:10})).severe, d11:dangerSignals(L({day:9,night:2})).severe, d15:dangerSignals(L({day:15})).severe, hot:dangerSignals(L({day:12,temp:"38.5",other:["구토"]}))}});
    need(!r.d10.length,`하루 10회는 빨간 경고 아님 (${JSON.stringify(r.d10)})`);
    need(r.d11.some(x=>/하루 배변 11회/.test(x)),`하루 11회(낮 9·밤 2)는 빨간 경고 (${JSON.stringify(r.d11)})`);
    need(r.d15.some(x=>/하루 배변 15회/.test(x)),'하루 15회도 그대로 빨간 경고');
    need(r.hot.severe.some(x=>/하루 배변 12회/.test(x))&&r.hot.urgent.some(x=>/체온 38\.5/.test(x))&&r.hot.urgent.includes('구토'),`12회 빨간 경고가 열·구토 주황 경고를 가리지 않음 (${JSON.stringify(r.hot)})`)}

  console.log('== 2 보조 점수 설명·기록 목록의 까닭');
  {const r=await p.evaluate(()=>{const d=today(); S.logs={}; S.logs[d]={...BLANK_LOG(),day:2,night:1,urg:1,well:2,extra:["관절통"]}; save(); const a=activity(S.logs[d]);
      S.tab="log"; SCR=null; render(); const row=document.querySelector('.hrow .lt small')?.textContent||"";
      return {stage:a.stage,sc:a.sc,label:a.label,row,stageTxt:(SCR={name:"set-stage"},render(),document.querySelector('#main').innerText)}});
    need(r.stage===1&&/장 밖 증상/.test(r.label),`관절통이 더해져 보조 점수 5점 → 활동기, 문구에 장 밖 증상 (${r.label})`);
    need(!/보조|활동기|점수/.test(r.row),`22차: 기록 목록 세부 줄에는 적은 값만(까닭·점수 없음) (${r.row})`);
    need(/몸 상태, 장 밖 증상\s*을 정해진 기준으로 더한 값이 5 이상/.test(r.stageTxt)&&!/활동기|관해/.test(r.stageTxt),'식단 단계 화면의 자동 조건에 장 밖 증상(활동기·관해라는 말 없이)')}

  console.log('== 3 단계 문구: 지침 이름 없음, 같은 말 반복 없음');
  {const r=await p.evaluate(()=>{const L=o=>({...BLANK_LOG(),...o}); return {rem:activity(L({day:1})).label, many:activity(L({day:7})).label, mid:activity(L({day:4,night:0,blood:1,bloody:1})).label}});
    need(!/STRIDE|ACG/.test(r.rem+r.many),`관해·7회 문구에 지침 이름 없음 (${r.rem} / ${r.many})`);
    need(!/증상이 남아 있/.test(r.mid),`'증상이 남아 있음' 제목 아래 같은 말을 되풀이하지 않음 (${r.mid})`)}

  console.log('== 4 다시 먹어 보기 중단 이유');
  {const r=await p.evaluate(()=>{const s=addDays(today(),-1); S.logs={}; S.logs[s]={...BLANK_LOG(),day:2,bloody:1,blood:1}; S.logs[today()]={...BLANK_LOG(),day:2,bloody:1,blood:1}; save();
      S.reintro.active={name:"우유",foodId:"milk",start:s,days:[{r:"심함"},{},{}]}; const out=riStop(S.reintro.active); S.reintro.active=null; save(); return out});
    need(r.length===2&&r[0]==="시험 중 심한 증상이 있었습니다"&&/^[^,]+, [^,]+ 기록이 정상식 단계 조건에 맞지 않았습니다$/.test(r[1]),`날짜를 모아 한 문장으로 (${JSON.stringify(r)})`)}

  console.log('== 5 참고문헌 꼬리표·배경 자료·DOI');
  {const r=await p.evaluate(()=>{SCR={name:"set-refs"}; render(); const list=document.querySelector('#main').innerText;
      showRefs([90]); const sh=document.querySelector('#sheetRoot').innerHTML; closeSheet();
      return {t53:REF_META[53].t,t78:REF_META[78].t,t80:REF_META[80].t,t16:REF_META[16].t,list,doi:/<a href="https:\/\/doi\.org\/10\.1053\/j\.gastro\.2020\.12\.031"/.test(sh),dup:(sh.match(/10\.1053\/j\.gastro\.2020\.12\.031/g)||[]).length,h2:/<h2[^>]*>참고문헌<\/h2>/.test(sh)}});
    need(r.t53==="p"&&r.t78==="a"&&r.t80==="s"&&r.t16==="o",`판매처·앱 안내·EuroFIR·정부 자료 꼬리표 (${[r.t53,r.t78,r.t80,r.t16]})`);
    need(/19번은 쓰지 않는 번호입니다/.test(r.list)&&/제품 표시/.test(r.list)&&/배경 자료/.test(r.list),'목록에 19번 안내·꼬리표·배경 자료');
    need(r.doi&&r.dup===2&&r.h2,`상세 시트 제목 '참고문헌', DOI는 한 번 적고 누르는 링크 (링크+글자 ${r.dup})`)}

  console.log('== 6 끼니 이름 덩어리·영양 목표 근거');
  {const r=await p.evaluate(()=>{S.logs={}; save(); SCR=null; S.tab="plan"; render(); const b=[...document.querySelectorAll('#main .mrow b')].find(x=>/·/.test(x.textContent));
      SCR={name:"nutri"}; render(); const t=document.querySelector('#main').innerText; SCR=null; render();
      return {parts:b?b.querySelectorAll('.nb').length:-1,dots:b?(b.textContent.match(/·/g)||[]).length:-1,text:b?.textContent||"",nutri:/열량은 대한비만학회의 BMI별 체중 1kg당 열량/.test(t), sp:(()=>{const d=document.createElement('div'); d.innerHTML=nbDots('김밥 · 라면<b>'); return d.textContent})()}});
    need(r.parts>=2&&r.parts===r.dots+1,`'·'로 나눈 항목마다 덩어리 (${r.parts}개, '${r.text}')`);
    need(r.nutri,'목표값 근거: 열량은 대한비만학회');
    need(r.sp==='김밥 · 라면<b>',`직접 적은 이름의 빈칸·꺾쇠를 그대로 (${r.sp})`)}

  console.log('== 7 변 모양 보기: 어느 폭에서도 모두 한 줄(높이 같음)');
  for(const w of [360,390,430,600,768]){
    const ctx=await b.newContext({viewport:{width:w,height:844}}); const q=await ctx.newPage(); await q.route(/^https?:/, r=>r.fulfill({body:''}));
    await q.goto('file://'+page); await q.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild); await q.evaluate(SEED); await q.reload(); await q.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild);
    const hs=await q.evaluate(()=>{openWizard(today(),false); WZ.step=wzStepOf("stool"); render(); return [...document.querySelectorAll('[data-k=stool]')].map(e=>Math.round(e.getBoundingClientRect().height))});
    need(hs.length===8&&new Set(hs).size===1,`${w}px: 8개 보기 높이가 같음 (${[...new Set(hs)]})`); await ctx.close();
  }

  await p.context().close();
  await b.close();
  console.log(F.length?`\n실패 ${F.length}건`:'\n모두 통과'); process.exit(F.length?1:0);
})().catch(e=>{console.error(e); process.exit(1)});
