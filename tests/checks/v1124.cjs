const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}

/* 6차 검토 반영(2026-10-26~27): 결함(편의점 같은 시설 문장, 불러오기 연타, 영양성분 숫자 없는 제품, 오류 안내 읽기),
   사실·문장 고침, 주어 없는 피동('~하도록 안내됩니다') 없애기, 글자 배치(근거 칩·붙임표·두 칸 단추·달력 머리·경고 간격) */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const BODY=fs.readFileSync(APP,'utf8');
const page=T('v1124.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+BODY+'</body></html>');
const SEED=()=>{ S.consent={date:today()}; S.onb="done"; S.persist="na"; S.stageMode="auto"; S.profile={...S.profile,height:"174",weight:"63",age:"27",sex:"M"}; save(); };
const PASSIVE=/안내됩니다|권고됩니다|안내돼|권고돼|안내되고|권고되고|안내되며|권고되며|안내됨|권고됨|안내되는|권고되는/;
(async()=>{
  const b=await chromium.launch();
  const open=async(opt={})=>{const ctx=await b.newContext({viewport:{width:opt.w||390,height:opt.h||844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); await p.evaluate(SEED); if(opt.font) await p.evaluate(f=>{S.fontSize=f;save()},opt.font); await p.reload(); await ready(); await p.waitForTimeout(150); return p};

  console.log('== 1a 편의점: 마침표 없이 이어진 "이 제품은 … 같은 제조시설" 문장도 함유와 섞지 않음');
  {const p=await open();
    const r=await p.evaluate(()=>{S.profile.allergies=["shrimp"]; save();
      const T1="원재료명: 소맥분(밀:미국산), 설탕, 탈지분유(우유), 새우분말(새우), 정제카라기난, 말티톨, 정제소금 이 제품은 메밀, 대두, 땅콩, 게를 사용한 제품과 같은 제조시설에서 제조하고 있습니다";
      const f=t=>{const o=labelCheck(t,"테스트 과자"); return {overall:o.overall,rows:o.rows.map(x=>x.lv+":"+x.title+"="+x.found.join("/"))}};
      return {a:f(T1),b:f(T1.replace(" 이 제품은",". 이 제품은")),c:crossSplit("새우, 게 같은 시설에서 제조")}});
    const has=(o,re)=>o.rows.some(x=>re.test(x));
    need(r.a.overall==="ban"&&has(r.a,/새우/)&&!has(r.a,/^caution:같은 제조시설.*=새우$/),`마침표 없음: 새우는 함유로 판정(같은 시설로 바뀌지 않음) (${r.a.rows.join(' | ')})`);
    need(r.a.rows.some(x=>/^info:같은 제조시설/.test(x)&&/메밀/.test(x)&&/땅콩/.test(x)&&/대두/.test(x)&&/게/.test(x))&&!r.a.rows.some(x=>/^info:표시된 알레르기/.test(x)&&/메밀|땅콩|게/.test(x)),'마침표 없음: 메밀·땅콩·대두·게는 같은 시설 항목으로만(함유 알레르기에 섞이지 않음)');
    need(JSON.stringify(r.a.rows)===JSON.stringify(r.b.rows),'마침표가 있을 때와 결과가 같음');
    need(/새우, 게 같은 시설/.test(r.c.cross)&&!r.c.rest.includes("같은 시설"),`알레르기 이름만 나열된 문장 시작도 같은 시설 문장으로 (${JSON.stringify(r.c)})`);
    await p.context().close()}

  console.log('== 1b 불러오기 합치기·되돌리기 연타: 한 번만 실행');
  {const p=await open();
    await p.evaluate(()=>{window.__log=[]; const ot=toast; toast=function(m){__log.push('toast:'+m); return ot.apply(this,arguments)}; const oa=alertMsg; alertMsg=function(m){__log.push('alert:'+m); return oa.apply(this,arguments)};
      const oi=idb; idb=async(st,mode,fn)=>{if(mode==="readwrite") await new Promise(z=>setTimeout(z,300)); return oi(st,mode,fn)};
      const t=today(); S.logs={[addDays(t,-1)]:{...BLANK_LOG(),day:2},[addDays(t,-2)]:{...BLANK_LOG(),day:3}}; save();
      const bk=JSON.parse(backupJSON()); bk.logs={[addDays(t,-5)]:{...BLANK_LOG(),day:4}}; SCR=null; S.tab="me"; openScr("set-data"); restoreFromText(JSON.stringify(bk))});
    await p.waitForTimeout(500);
    const box=await p.locator('[data-act=restoreApply][data-v=merge]').boundingBox();
    await p.touchscreen.tap(box.x+box.width/2,box.y+box.height/2); await p.waitForTimeout(120); await p.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
    await p.waitForTimeout(2000);
    const m=await p.evaluate(()=>({days:Object.keys(S.logs).length,toasts:__log.filter(x=>x.startsWith('toast:')).length,alerts:__log.filter(x=>x.startsWith('alert:')).length}));
    need(m.days===3&&m.toasts===1&&m.alerts===0,`합치기 두 번 눌러도 한 번(기록 3일, 알림 1번, 실패 안내 없음) (${JSON.stringify(m)})`);
    await p.evaluate(()=>{__log=[]; restoreUndo()}); await p.waitForTimeout(500);
    const bx=await p.locator('[data-act=restoreUndoGo]').boundingBox();
    await p.touchscreen.tap(bx.x+bx.width/2,bx.y+bx.height/2); await p.waitForTimeout(120); await p.touchscreen.tap(bx.x+bx.width/2,bx.y+bx.height/2);
    await p.waitForTimeout(2500);
    const u=await p.evaluate(()=>({days:Object.keys(S.logs).length,toasts:__log.filter(x=>x.startsWith('toast:')).length}));
    need(u.days===2&&u.toasts===1,`되돌리기 두 번 눌러도 한 번 (${JSON.stringify(u)})`);
    await p.context().close()}

  console.log('== 1c 상품정보 고시에 영양성분 숫자가 없던 제품은 0kcal이 아니라 자료 없음, 핫도그 기준량');
  {const p=await open();
    const r=await p.evaluate(()=>{const f=FOOD.cj214490; const hot=FOOD.cj205094;
      return {k:f&&f.k, miss:f&&f.missing, src:f&&!!f.src, why:f&&f.why,
        hot:hot&&{name:hot.name,serv:SERV[hot.id],k:hot.k}}});
    need(r.miss&&r.miss.includes("전체")&&!r.src&&/영양성분 숫자가 없어 영양값은 넣지 않았습니다/.test(r.why),`숫자 없는 고시: 영양 자료 없음과 까닭 (${JSON.stringify({miss:r.miss,src:r.src})})`);
    need(r.hot&&r.hot.serv&&r.hot.serv[0]===85,`치즈크리스피핫도그 1회 85g(1개) (${JSON.stringify(r.hot)})`);
    await p.context().close()}

  console.log('== 오류 안내는 화면 읽기 프로그램이 바로 읽음(role=alert), PDF에는 질문을 넣지 않음(22차)');
  {const p=await open();
    const r=await p.evaluate(()=>{SCR=null; S.tab="plan"; render(); alertMsg("시험 오류 안내"); const el=document.querySelector('#main .msg-b'); const h=el?el.outerHTML:""; SCR=null; S.tab="me"; render(); openScr("pdf"); return {h,pdf:document.querySelector('#main').innerText}});
    need(/role="alert"/.test(r.h)&&/시험 <span class="nb">오류 안내<\/span>|시험 오류 안내/.test(r.h),`오류 안내 배너에 role=alert (${r.h.slice(0,90)})`);
    need(!/물어볼 것|PDF 맨/.test(r.pdf)&&/음식 경험 PDF/.test(r.pdf),'22차: 음식 경험 PDF에는 물어볼 것을 넣지 않음(음식별 경험만)');
    await p.context().close()}

  console.log('== 주어 없는 피동 문장(~하도록 안내됩니다·권고됩니다)이 음식 설명·질문 답·식단 팁·화면에 없음');
  {const p=await open();
    const r=await p.evaluate(rx=>{const RE=new RegExp(rx); const o={};
      o.foods=FOODS.filter(f=>RE.test(f.why||"")).map(f=>f.name+": "+f.why.match(new RegExp(".{0,30}("+rx+")"))[0]).slice(0,5);
      o.qa=(typeof QA!=="undefined"?QA:[]).filter(q=>RE.test(q.a||"")).map(q=>q.id).slice(0,5);
      o.frag=FOODS.filter(f=>/[가-힣)] 함유\.(\s|$)/.test(f.why||"")).map(f=>f.name).slice(0,5);
      const scr=[["home",()=>{SCR=null;S.tab="plan";render()}],["log",()=>{SCR=null;S.tab="log";render()}],["me",()=>{SCR=null;S.tab="me";render()}],["nutri",()=>{S.tab="plan";openScr("nutri")}],["care",()=>{S.tab="me";SCR=null;render();openScr("care")}]];
      o.ui=[]; for(const [n,fn] of scr){fn(); const t=document.querySelector('#main').innerText; const m=t.match(new RegExp(".{0,30}("+rx+")")); if(m) o.ui.push(n+": "+m[0])}
      const caf=FOOD.cj197951; o.caf=caf&&caf.refs; o.upf=FOOD.potato_chips?.why; o.kim=FOOD.kkakdugi?.why;
      return o},PASSIVE.source);
    need(!r.foods.length,`음식 설명에 주어 없는 피동 없음 (${r.foods.join(' / ')})`);
    need(!r.qa.length,`궁금한 점 답에 주어 없는 피동 없음 (${r.qa.join(', ')})`);
    need(!r.ui.length,`홈·기록·내 정보·영양·건강 관리 화면에 없음 (${r.ui.join(' / ')})`);
    need(!r.frag.length,`제품 설명에 '…함유.' 조각 문장 없음 (${r.frag.join(', ')})`);
    need(r.caf&&r.caf.includes(35)&&!r.caf.includes(3),`카페인 문장의 근거는 UCSF(35), 카페인 내용이 없는 IOIBD(3) 아님 (${JSON.stringify(r.caf)})`);
    need(/이런 초가공식품은 AGA 권고대로 적게 먹습니다/.test(r.upf||"")&&!/크론병|CMC/.test(r.upf||""),'과자 설명의 초가공식품 문장은 AGA 권고 한 문장(크론병·유화제 연구 나열 없음)');
    need(r.kim&&(r.kim.match(/매/g)||[]).length===1,`김치 설명에 '맵다'가 한 번만 (${r.kim})`);
    await p.context().close()}

  console.log('== 글자 배치(360px): 두 칸 아래 단추 한 줄, 달력 머리 칩, 근거 칩과 앞 낱말, 제목 안 붙임표 낱말, 경고 간격');
  {const p=await open({w:360});
    const r=await p.evaluate(()=>{const o={}; const lines=el=>{const tops=[]; const tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT); let n; while((n=tw.nextNode())){if(n.parentElement.closest('.sr-only')) continue; for(let i=0;i<n.nodeValue.length;i++){if(/\s/.test(n.nodeValue[i])) continue; const rg=document.createRange(); rg.setStart(n,i); rg.setEnd(n,i+1); const q=rg.getClientRects()[0]; if(q&&q.width>0) tops.push(q.top)}}
      tops.sort((a,b)=>a-b); let c=0,s0=-1e9; for(const t of tops) if(t-s0>8){c++; s0=t} return c};   // 23차: 윗첨자(조금 위)는 같은 줄로, 화면 읽기용 괄호는 빼고 셈   // 글자만 센다(아이콘 제외)
      S.tab="me"; SCR=null; render(); openScr("pdf"); const pb=document.getElementById("pdfBtn"); o.pdf=[pb.textContent,lines(pb),getComputedStyle(pb.parentElement).gridTemplateColumns];
      SCR=null; render(); openScr("set-goals"); const gb=document.querySelector('[data-act=goalReset]'); o.goal=[gb.textContent,lines(gb)];
      SCR=null; S.tab="plan"; S.stageMode="3"; S.selDay=2; render(); const ch=document.querySelector('.cal-head .glass'); o.cal=[lines(ch),getComputedStyle(ch.parentElement).flexWrap]; S.stageMode="auto"; S.selDay=0;
      openScr("nutri"); o.nutri=document.querySelector('[data-act=copyPick]')?.parentElement.className;
      SCR=null; S.tab="me"; render(); const t=document.querySelector('#main .sec-label'); o.ls=getComputedStyle(t).letterSpacing;
      openScr("set-warn"); const chip=document.querySelector('#main sup.ref.grp'); o.chip=chip?[chip.parentElement.className,(chip.previousSibling?.nodeValue||"").length]:null;
      openScr("set-refs"); const bs=[...document.querySelectorAll('#main b')].filter(x=>/STRIDE-II/.test(x.textContent)); o.hy=bs.length&&[...bs[0].querySelectorAll('.nb')].some(x=>x.textContent==="STRIDE-II");
      SCR=null; render(); openScr("set-labs"); o.labs=document.querySelector('#main').innerText.match(/[^\n]*혈색소[^\n]*/)?.[0]; const hb=document.querySelector('#main button.term[data-v=hb]'); o.term=hb?[hb.parentElement.className,hb.parentElement.textContent]:null;
      return o});
    need(r.pdf[0]==="그림 PDF"&&r.pdf[1]===1&&r.pdf[2].split(" ").length===2,`'그림 PDF' 단추 한 줄 (${JSON.stringify(r.pdf)})`);
    need(r.goal[1]===1,`'모두 앱 계산으로' 한 줄 (${JSON.stringify(r.goal)})`);
    need(r.cal[0]===1&&r.cal[1]==="wrap",`달력 머리의 단계 칩 글자는 꺾이지 않고 칩째 다음 줄로 (${JSON.stringify(r.cal)})`);
    need(r.nutri==="stack",`영양 화면 '먹은 음식 추가'·'다른 날 기록 가져오기'는 위아래로 (${r.nutri})`);
    need(!(parseFloat(r.ls)>0),`이름표 자간은 본문처럼(+.02em 아님) (${r.ls})`);   // 10차: '경고'는 이름표 없이 한 줄(set-warn 화면)이라 이름표·설명 간격 점검은 뺌
    need(r.chip&&r.chip[0]==="nb"&&r.chip[1]>0,`근거 칩은 앞 낱말과 한 덩어리(줄바꿈 없음) (${JSON.stringify(r.chip)})`);
    need(r.hy,'참고문헌 제목의 STRIDE-II는 붙임표 뒤에서 갈라지지 않게 묶음');
    need(/CRP, 대변 칼프로텍틴, 혈색소는 이름을 누르면 뜻이 나옵니다/.test(r.labs||""),`검사 화면 끝 조각이 문장으로 (${r.labs})`);
    need(r.term&&r.term[0]==="nb"&&r.term[1]==="혈색소는",`용어 단추 뒤 조사('혈색소|는')가 단추와 한 덩어리 (${JSON.stringify(r.term)})`);
    await p.context().close()}

  console.log('== 아주 큰 글씨: 두 칸 단추 묶음(.grid2)은 한 칸');
  {const p=await open({w:360,font:"xl"});
    const r=await p.evaluate(()=>{SCR=null; S.onb="0"; render(); const g=document.querySelector('#main .restore-line'); return g?getComputedStyle(g).flexWrap:"없음"});
    need(r==="wrap",`아주 크게: 24차부터 백업 단추 줄은 줄바꿈으로 두 칸에 끼지 않음 (${r})`);
    await p.context().close()}

  await b.close();
  console.log(F.length?`\nFAIL ${F.length}개`:'\n검증 통과'); if(F.length) process.exit(1);
})().catch(e=>{console.error(e); process.exit(1)});
