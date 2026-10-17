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
/* v1.11.0 디자인 적용 뒤 재검토(agent-browser로 처음 쓰는 사람처럼 끝까지 써 봄, R-01~R-24)를 고친 것이 그대로인지 확인한다.
   R-01은 실제 앱처럼 body 여백을 지우지 않은 페이지에서, 나머지는 다른 점검과 같은 페이지에서 본다. */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const BODY=fs.readFileSync(APP,'utf8');
const page=T('review2.html'), raw=T('review2-raw.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+BODY+'</body></html>');
// 실제 앱(PWA·오프라인 파일)과 같게: 감싸는 페이지가 body 여백을 지우지 않는다
fs.writeFileSync(raw,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+BODY+'</body></html>');
const SEED=()=>{
  S.consent={date:today()}; S.onb="done";
  const mk=(day,b)=>({...BLANK_LOG(),day,night:0,bloody:b,urg:0,blood:b?1:0,well:0,stool:4,medtaken:1,pain:1,memo:""});
  for(let i=2;i<=6;i++) S.logs[addDays(today(),-i)]=mk(2,0);
  save();
};
(async()=>{
  const b=await chromium.launch();
  const open=async(opt={})=>{const ctx=await b.newContext({viewport:{width:opt.w||390,height:opt.h||844},isMobile:!opt.pc,hasTouch:!opt.pc}); const p=await ctx.newPage();
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+(opt.raw?raw:page)); await ready(); await p.waitForTimeout(150); if(!opt.noSeed){await p.evaluate(SEED); await p.waitForTimeout(500); await p.reload(); await ready(); await p.waitForTimeout(200)} return p};

  console.log('== R-01 실제 앱의 body 여백');
  {const p=await open({raw:true,noSeed:true});
    const r=await p.evaluate(()=>({m:getComputedStyle(document.body).margin, sh:document.scrollingElement.scrollHeight, ih:innerHeight, consent:!!document.querySelector('#consentGo')}));
    need(r.consent&&r.m==="0px",`R-01 body 기본 여백 없음 (${r.m})`);
    need(r.sh<=r.ih+1,`R-01 첫 화면(동의)이 화면 높이를 넘지 않음 (${r.sh}/${r.ih})`);
    await p.context().close()}

  console.log('== R-02·R-03·R-04·R-05 시작 설정');
  {const p=await open({noSeed:true});
    const r=await p.evaluate(()=>{S.consent={date:today()}; S.onb="1"; render();
      const age=document.querySelector('#o_age')?.getAttribute('placeholder')||""; const sexF=[...document.querySelectorAll('.f')].find(x=>/^성별/.test(x.textContent.trim()));
      const lab=document.querySelector('label.f[for=o_height]'); const fs1=sexF?getComputedStyle(sexF).fontSize:"", fs2=getComputedStyle(lab).fontSize;
      S.onb="3"; render(); const txt=document.querySelector('#main').innerText;
      const bt=document.querySelector('[data-act=onbInit][data-v="2"]'); const sm=bt.querySelector('small');
      const tn=[...bt.querySelectorAll('*'),bt].flatMap(e=>[...e.childNodes]).find(n=>n.nodeType===3&&/좋아지는 중/.test(n.textContent)); const rg=document.createRange(); rg.selectNodeContents(tn);
      const r1=sm.getBoundingClientRect(), r0=rg.getBoundingClientRect();
      return {age,fs1,fs2,jargon:/저잔사식부터|이행식부터|지중해식부터|\(저잔사식·이행식·지중해식\)/.test(txt),plain:/섬유를 줄인 식사부터/.test(txt)&&/조금씩 늘리는 식사부터/.test(txt)&&/골고루 먹는 식사부터/.test(txt),
        below:r1.top>=r0.bottom-2}});
    need(/^예:/.test(r.age),`R-02 나이 칸 예시 글자 (${r.age})`);
    need(r.fs1&&r.fs1===r.fs2,`R-02 '성별' 제목이 다른 칸 제목과 같은 크기 (${r.fs1}/${r.fs2})`);
    need(!r.jargon&&r.plain,'R-03 시작 설정 3단계는 쉬운 말(…식사부터)');
    need(r.below,'R-04 보기 설명은 보기 글자 아래 줄');
    await p.evaluate(()=>{const b=document.querySelector('[data-act=onbInit][data-v="2"]'); b.click()}); await p.waitForTimeout(100);
    await p.click('[data-act=onbDone][data-v=""]'); await p.waitForTimeout(400);
    const t=await p.evaluate(()=>document.querySelector('#main').innerText);
    need(!/조건이 바뀌어/.test(t)&&/내 정보에 맞춰/.test(t),'R-05 처음 설정 직후 안내는 \'내 정보에 맞춰…\'');
    await p.context().close()}

  console.log('== R-03·R-21·R-22 쉬운 말 통일');
  {const p=await open();
    const r=await p.evaluate(()=>{S.logs[today()]={...BLANK_LOG(),day:4,night:0,bloody:1,urg:1,blood:1,well:1,stool:4,medtaken:1,pain:3}; save();
      S.tab="log"; SCR=null; render(); const lg=document.querySelector('#main').innerText;
      S.tab="plan"; SCR=null; render(); const home=document.querySelector('#main').innerText;
      openScr("pdf"); const pdf=document.querySelector('#main').innerText;
      openScr("set-stage"); const st=document.querySelector('#main').innerText;
      const o=["섬유를 줄인 식사 ·","조금씩 늘리는 식사 ·","골고루 먹는 식사 ·"].map(s=>st.indexOf(s));
      return {lg:/참고 식단 단계: (섬유를 줄인|조금씩 늘리는|골고루 먹는) 식사/.test(lg), home:/끼니 메뉴 [\d,]+개 가운데 (섬유를 줄인|조금씩 늘리는|골고루 먹는) 식사 단계/.test(home),
        pdf:/음식 다시 먹어 보기/.test(pdf)&&!/재도입 결과/.test(pdf), auto:/지금: (섬유를 줄인|조금씩 늘리는|골고루 먹는) 식사/.test(st), order:o.every(x=>x>=0)&&o[0]<o[1]&&o[1]<o[2]}});
    need(r.lg,'R-03 기록 탭 \'참고 식단 단계\'는 쉬운 말');
    need(r.home,'R-03 홈 아래 식단 설명은 쉬운 말 단계');
    need(r.pdf,'R-21 진료용 PDF 설명은 \'음식 다시 먹어 보기\'');
    need(r.auto,'R-22 식단 단계 \'자동\'에 지금 단계 표시');
    need(r.order,'R-22 기준 설명은 섬유를 줄인→조금씩 늘리는→골고루 순서, 쉬운 말');
    const w=await p.evaluate(()=>{SCR=null; openWizard(today()); WZ.step=WS().length-1; render(); return document.querySelector('#main').innerText});
    need(/참고 식단 단계\s*(섬유를 줄인|조금씩 늘리는|골고루 먹는) 식사/.test(w),'R-03 기록 요약 \'참고 식단 단계\'는 쉬운 말');
    await p.context().close()}

  console.log('== R-06·R-19·R-20·R-24 홈 능선');
  {const p=await open();
    const r=await p.evaluate(()=>{for(const k of Object.keys(S.logs)) delete S.logs[k]; S.logs[today()]={...BLANK_LOG(),day:5,night:0,bloody:0,urg:1,blood:0,well:1,stool:4,medtaken:1,pain:2}; save(); SCR=null; S.tab="plan"; render();
      const svg=document.querySelector('.ridge svg.r-chart'); return {dot:!!svg.querySelector('circle.dot'), txt:svg.textContent}});
    need(r.dot&&/2일 이상/.test(r.txt),`R-06 첫 기록도 오늘 점을 그리고 '2일 이상이면 선으로' 안내 (${r.txt.slice(0,60)})`);
    const z=await p.evaluate(()=>{const v=[1,0,1,1,1,2,1]; v.forEach((x,i)=>{S.logs[addDays(today(),-i)]={...BLANK_LOG(),day:x?4:2,night:0,bloody:0,urg:x>1?1:0,blood:0,well:0,stool:4,medtaken:1,pain:0}}); save(); SCR=null; render();
      const svg=document.querySelector('.ridge svg.r-chart'); const band=svg.querySelector('rect.band'); const bb=+band.getAttribute('y')+(+band.getAttribute('height'));
      const ys=[...svg.querySelectorAll('path.line')].flatMap(pa=>pa.getAttribute('d').match(/-?\d+(\.\d+)?,-?\d+(\.\d+)?/g).map(s=>+s.split(',')[1]));
      const bl=svg.querySelector('text.bl'); const cs=getComputedStyle(bl);
      return {bb,maxY:Math.max(...ys),po:cs.paintOrder,sw:parseFloat(cs.strokeWidth)||0}});
    need(z.maxY<=z.bb-2,`R-19 0점 선이 관해 범위 띠 안쪽(띠 아래 끝 ${z.bb}, 선 가장 아래 ${z.maxY})`);
    need(/stroke/.test(z.po)&&z.sw>=2,`R-20 '관해 범위' 글자에 바탕색 테두리(${z.po}, ${z.sw})`);
    await p.context().close()}
  {const p=await open({w:320,h:640});
    const r=await p.evaluate(()=>{S.logs[today()]={...BLANK_LOG(),day:4}; save(); SCR=null; S.tab="plan"; render();
      const d=document.querySelector('.ridge .r-date'), c=document.querySelector('.ridge .r-stage'); const lh=x=>parseFloat(getComputedStyle(x).lineHeight)||20;
      return {dh:d.getBoundingClientRect().height, dl:lh(d), ch:c.getBoundingClientRect().height, sw:document.scrollingElement.scrollWidth, cw:document.documentElement.clientWidth}});
    need(r.dh<=r.dl*1.5,`R-24 320px에서 날짜가 한 줄 (${Math.round(r.dh)}px)`);
    need(r.ch<=50,`R-24 320px에서 단계 칩이 한 줄 (${Math.round(r.ch)}px)`);
    need(r.sw<=r.cw,`R-24 320px 가로 넘침 없음 (${r.sw}/${r.cw})`);
    await p.context().close()}

  console.log('== R-07·R-08 홈 기록·끼니');
  {const p=await open();
    await p.evaluate(()=>{delete S.logs[today()]; SCR=null; S.tab="plan"; render()}); await p.click('.ridge [data-act=wizardQuick]'); await p.waitForTimeout(200);
    await p.click('[data-act=step][data-k=day][data-v="1"]'); await p.click('[data-act=set][data-k=urg][data-v="0"]'); await p.click('[data-act=set][data-k=blood][data-v="0"]'); await p.waitForTimeout(100);
    await p.click('[data-act=wzNext]'); await p.waitForTimeout(150); await p.click('[data-act=saveLog]'); await p.waitForTimeout(250);
    const r=await p.evaluate(()=>({tab:S.tab, scr:SCR, saved:!!S.logs[today()], labels:[...document.querySelectorAll('#main [data-act=ateToggle]')].map(b=>b.getAttribute('aria-label')||b.textContent.trim())}));
    need(r.saved&&r.tab==="plan"&&r.scr===null,`R-07 홈에서 시작한 기록은 저장 뒤 홈으로 (${r.tab})`);
    need(r.labels.length>=3&&r.labels.every(l=>/^(아침|점심|저녁|간식)[^ ]* 먹음/.test(l)),`R-08 '먹음' 버튼 이름에 끼니 (${r.labels.join(", ")})`);
    await p.evaluate(()=>{delete S.logs[today()]; SCR=null; S.tab="log"; render()});
    const l=await p.evaluate(()=>{openWizard(today()); return SCR});
    await p.evaluate(()=>{draft.day=3; draft.urg=0; draft.blood=0; draft.well=0; WZ.step=WS().length-1; render()}); await p.waitForTimeout(100);
    await p.click('[data-act=saveLog]'); await p.waitForTimeout(200);
    need(await p.evaluate(()=>S.tab==="log"),'R-07 기록 탭에서 시작한 기록은 저장 뒤 기록 탭 그대로');
    await p.context().close()}

  console.log('== R-09·R-11·R-12·R-14 끼니 시트·음식 정보');
  {const p=await open();
    const r=await p.evaluate(()=>{SCR=null; S.tab="plan"; render(); document.querySelector('#main [data-act=mealMore]').click();
      const bs=[...document.querySelectorAll('#sheetRoot .btn')].filter(x=>x.querySelector('svg')); const off=bs.map(x=>{const s=x.querySelector('svg').getBoundingClientRect(), r=x.getBoundingClientRect(); return Math.abs((s.top+s.height/2)-(r.top+r.height/2))});
      closeSheet(); return {n:bs.length, off:Math.max(...off)}});
    need(r.n>=2&&r.off<=2,`R-09 시트 버튼 아이콘이 버튼 세로 가운데 (${r.off.toFixed(1)}px)`);
    await p.evaluate(()=>{SCR=null; S.tab="food"; render(); showFood("gimbap")}); await p.waitForTimeout(450);   // 시트가 올라오는 움직임(0.28초)이 끝난 뒤
    const s=await p.evaluate(()=>{const sh=document.querySelector('#sheetRoot .sheet');
      const btn=[...sh.querySelectorAll('button')].find(x=>x.dataset.act==="closeSheet"); const rb=btn.getBoundingClientRect(); const st=sh.innerText;
      return {vis:rb.bottom<=innerHeight&&rb.top>=0, scroll:sh.scrollHeight>sh.clientHeight, ham:/발색제/.test(st), paren:/\)\(/.test(st.replace(/\s+/g,""))}});
    need(s.scroll&&s.vis,`R-11 긴 시트도 '닫기·오늘 먹었습니다'가 처음부터 보임 (내용이 넘침 ${s.scroll}, 보임 ${s.vis})`);
    need(s.ham,'R-12 김밥 햄 안내에 기준(발색제)');
    need(!s.paren,'R-14 영양 출처 줄에 괄호가 겹치지 않음');
    await p.context().close()}

  console.log('== R-10·R-13 검색 제안');
  {const p=await open();
    const r=await p.evaluate(async()=>{SCR=null; S.tab="food"; S.foodSub="search"; S.foodQ="바나니"; render(); await new Promise(z=>setTimeout(z,300));
      const card=document.querySelector('#main .note-card'); const t=card?card.innerText:""; const chips=card?card.querySelectorAll('[data-act=foodQSet]').length:0;
      return {t,chips,josa:/\(를\)|\(가\)/.test(t)}});
    need(r.chips>=1&&!r.josa&&/찾으십니까/.test(r.t),`R-10·R-13 '혹시 …찾으십니까?' 문장에 조사 자리표시 없음, 제안 단추 ${r.chips}개`);
    await p.context().close()}

  console.log('== R-15 알레르기는 절대 금지');
  {const p=await open();
    const r=await p.evaluate(()=>{S.profile.allergies=["peanut"]; S.profile.allergyOther="키위"; save(); const c=ctx();
      const a=foodStatus(FOOD.peanut,c), pb=foodStatus(FOOD.peanut_butter,c), kw=foodStatus(FOOD.kiwi,c);
      const m=ruleCheck({name:"땅콩 소스 비빔국수",ingr:[]}); const lb=labelCheck("밀가루, 설탕, 땅콩버터, 정제소금","땅콩 크림빵");
      S.profile.dislikes="당근"; const ca=foodStatus(FOOD.carrot,ctx());
      return {a:a.level, ar:a.reasons.join("|"), pb:pb.level, kw:kw.level, kwr:kw.reasons.join("|"), m:m.level, lb:lb.overall||lb.level, ca:ca.level}});
    need(r.a==="ban"&&r.pb==="ban"&&/알레르기\(땅콩\)/.test(r.ar),`R-15 고른 알레르기 음식은 절대 금지 (${r.a}/${r.pb}: ${r.ar})`);
    need(r.kw==="ban"&&/알레르기/.test(r.kwr),`R-15 직접 적은 알레르기도 절대 금지 (${r.kw}: ${r.kwr})`);
    need(r.m==="ban",`R-15 외식 판정의 알레르기 재료도 절대 금지 (${r.m})`);
    need(r.lb==="ban",`R-15 편의점 제품 원재료의 내 알레르기도 절대 금지 (${r.lb})`);
    need(r.ca==="avoid",`R-15 싫어하는 음식은 그대로 피하기 (${r.ca})`);
    await p.context().close()}

  console.log('== R-16·R-17 버튼 이름·비밀번호 칸');
  {const p=await open();
    const r=await p.evaluate(()=>{SCR=null; S.tab="food"; S.foodSub="menu"; MJ.step="confirm"; MJ.items=[{name:"연어 포케",ingr:[]},{name:"짜장면",ingr:[]}]; render();
      const del=[...document.querySelectorAll('#main [data-act=mjDel]')].map(x=>x.getAttribute('aria-label'));
      const gen=[...document.querySelectorAll('[aria-label="삭제"]')].length;
      SCR=null; S.tab="me"; openScr("set-data"); document.querySelector('[data-act=encOpen]').click();
      const pw=[...document.querySelectorAll('#sheetRoot input[type=password]')].map(i=>{const cs=getComputedStyle(i); return [parseFloat(cs.fontSize), i.getBoundingClientRect().height, cs.backgroundColor]});
      closeSheet(); return {del,gen,pw}});
    need(r.del.length===2&&/연어 포케/.test(r.del[0])&&/짜장면/.test(r.del[1]),`R-16 외식 판정 삭제 버튼에 메뉴 이름 (${r.del.join(", ")})`);
    need(r.gen===0,`R-16 이름이 '삭제'뿐인 버튼 없음 (${r.gen})`);
    need(r.pw.length===2&&r.pw.every(([fs,h])=>fs>=16&&h>=44),`R-17 비밀번호 칸 글자 16px 이상·높이 44px 이상 (${JSON.stringify(r.pw)})`);
    await p.context().close()}

  console.log('== R-18·R-23 앱 정보');
  {const p=await open();
    const r=await p.evaluate(()=>{SCR=null; S.tab="me"; openScr("set-about"); const m=document.querySelector('#main'); const t=m.innerText;
      const lic=[...m.querySelectorAll('details')].find(d=>/SIL OPEN FONT LICENSE/i.test(d.textContent));
      const sums=[...m.querySelectorAll('summary')].map(s=>{const cs=getComputedStyle(s); const af=getComputedStyle(s,'::after'); return cs.display==="list-item"||(af.content&&af.content!=="none")});
      return {lic:!!lic, dev:/저장소의 vendor/.test(t), sums}});
    need(r.lic,'R-18 앱 안에 글꼴 라이선스(OFL) 전문');
    need(!r.dev,'R-18 개발자 경로 안내 없음');
    need(r.sums.length&&r.sums.every(Boolean),`R-23 펼치는 칸마다 펼침 표시 (${r.sums.join(",")})`);
    await p.context().close()}

  await b.close();
  console.log(F.length?'FAIL '+F.join(' / '):'검증 통과'); process.exit(F.length?1:0);
})();
