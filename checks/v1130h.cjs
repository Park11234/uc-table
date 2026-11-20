const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}

/* v1.13.0 25차(2026-11-19) 사용자 결정: 조약돌 탭과 수달 '달이'(결정 57)
   1 아래 메뉴는 홈·기록·조약돌·찾아보기·내 정보 다섯 칸
   2 조약돌은 그날 먹기로 한 끼니(세 끼, 하루 2끼면 두 끼)를 모두 '먹음'으로 표시한 날마다 1개. 평가만 한 끼니도 먹은 것, 증상 기록·간식·내일 날짜는 세지 않음
   3 30개가 한 바퀴, 바퀴마다 색이 한 단계(회색·모래빛·옥빛·보랏빛·무지갯빛), 5단계부터는 그대로
   4 처음 들어오면 손 흔드는 달이 안내가 한 번 뜨고, 물음표 단추로 다시 볼 수 있음
   5 평소에는 상반신 달이, 30개를 채운 바퀴가 생긴 뒤 처음 들어올 때만 기뻐하는 달이(한 번만, 예전 기록으로 채운 바퀴는 축하하지 않음)
   6 오늘 칸에 먹은 끼니 수(n/3끼), 세 번째 끼니를 먹음으로 표시하면 알림에 조약돌 소식과 '조약돌 보기'
   7 그림은 앱 안에 들어 있어(서버 연결 없음) 바로 보이고, 좁은 화면·어두운 화면에서도 넘치거나 겹치지 않음 */
const { chromium } = require('playwright');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
fs.mkdirSync(TMP,{recursive:true}); const page=path.join(TMP,'v1130h.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const SEED=()=>{S.consent={date:addDays(today(),-60)}; S.onb="done"; S.persist="na"; S.stageMode="auto";
  S.profile={...S.profile,height:"174",weight:"63",age:"27",sex:"M",usualBM:"3"}; save()};
let b;
(async()=>{
  b=await chromium.launch();
  const mk=async(w,h,scheme)=>{const ctx=await b.newContext({viewport:{width:w,height:h},colorScheme:scheme,isMobile:true,hasTouch:true}); const p=await ctx.newPage(); p.setDefaultTimeout(8000);
    const nets=[]; await p.route(/^https?:/, r=>{nets.push(r.request().url()); r.fulfill({body:''})});
    await p.goto('file://'+page); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.evaluate(SEED); await p.reload(); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild);
    await p.evaluate(t=>{S.theme=t; render()},scheme); return {ctx,p,nets}};
  // n일 전부터 하루씩 세 끼를 먹음으로 채운다(오늘 제외)
  const fill=(p,n)=>p.evaluate(n=>{S.ate={}; S.ratings=[]; for(let i=1;i<=n;i++) S.ate[addDays(today(),-i)]=["아침","점심","저녁"]; save()},n);
  // 같은 자리를 0.6초 안에 다시 누르면 앱이 두 번 누름으로 보고 막으므로(tapGuard) 화면을 바꾼 뒤에는 잠깐 기다린다
  const goTab=async(p,t)=>{await p.click(`.tab[data-tab="${t}"]`); await p.waitForTimeout(650)};

  {
    const {ctx,p,nets}=await mk(390,844,'light');
    // 1 아래 메뉴
    const tabs=await p.$$eval('.tabs .tab',bs=>bs.map(b=>[b.dataset.tab,b.textContent.trim()]));
    need(JSON.stringify(tabs)===JSON.stringify([["plan","홈"],["log","기록"],["peb","조약돌"],["food","찾아보기"],["me","내 정보"]]),`1 아래 메뉴 다섯 칸 (${tabs.map(t=>t[1]).join('·')})`);
    // 2 규칙
    const r2=await p.evaluate(()=>{const d=n=>addDays(today(),-n); S.ate={}; S.ratings=[]; S.skips={}; S.logs={};
      S.ate[d(1)]=["아침","점심","저녁"];                         // 1개
      S.ate[d(2)]=["아침","점심","간식"];                         // 저녁을 안 먹음: 0
      S.ate[d(3)]=["아침","점심"]; S.ratings.push({date:d(3),slot:"저녁",title:"t",foodId:"x",rating:"good"});   // 평가한 저녁도 먹은 것: 1개
      S.ate[addDays(today(),1)]=["아침","점심","저녁"];             // 내일: 0
      for(let i=4;i<9;i++) S.logs[d(i)]={...BLANK_LOG(),date:d(i),day:2};   // 증상 기록만: 0
      const a=pebInfo().n;
      S.profile.skipMeal="B"; S.ate[d(9)]=["점심","저녁"];              // 하루 2끼(아침 거름): 점심·저녁이면 1개, d(2)는 아침·점심뿐이라 0
      const b2=pebInfo().n; S.profile.skipMeal=""; return {a,b2}});
    need(r2.a===2,`2 세 끼를 다 먹은 날만 1개(평가한 끼니 포함, 간식·증상 기록·내일 제외) (${r2.a}개, 기대 2)`);
    need(r2.b2===3,`2 하루 2끼면 그 두 끼를 다 먹은 날 1개 (${r2.b2}개, 기대 3)`);
    // 3 바퀴와 색
    const st=[]; for(const n of [0,29,30,59,60,149,150,200]){await fill(p,n); st.push(await p.evaluate(()=>{const x=pebInfo(); return [x.n,x.lap,x.inLap,x.stage]}))}
    need(JSON.stringify(st)===JSON.stringify([[0,1,0,1],[29,1,29,1],[30,2,0,2],[59,2,29,2],[60,3,0,3],[149,5,29,5],[150,6,0,5],[200,7,20,5]]),`3 30개마다 한 바퀴, 색은 5단계까지 (${JSON.stringify(st)})`);
    const names=await p.evaluate(()=>[1,2,3,4,5].map(i=>PEB_ST[i]).join('·'));
    need(names==="회색·모래빛·옥빛·보랏빛·무지갯빛",`3 단계 이름 (${names})`);

    // 4 첫 안내: 기록 45개인 사용자가 처음 들어옴(예전 기록으로 채운 1바퀴는 축하하지 않음)
    await fill(p,45); await p.evaluate(()=>{S.peb={intro:0,seen:-1}; save(); render()});
    await goTab(p,'peb');
    const s4=await p.evaluate(()=>{const sh=document.querySelector('#sheetRoot .sheet'); return {open:!!sh, hello:!!sh&&!!sh.querySelector('.dari-w'), happy:!!document.querySelector('.dari-h'),
      h:sh?.querySelector('h2')?.textContent||'', btn:[...(sh?.querySelectorAll('button')||[])].map(x=>x.textContent.trim()), peb:{...S.peb}}});
    need(s4.open&&s4.hello&&/조약돌/.test(s4.h),`4 처음 들어오면 손 흔드는 달이 안내 ('${s4.h}')`);
    need(!s4.happy,`5 예전 기록으로 채운 바퀴에는 기뻐하는 달이가 뜨지 않음`);
    need(s4.peb.intro===1&&s4.peb.seen===1,`4·5 안내를 본 것과 축하할 바퀴 수를 저장 (${JSON.stringify(s4.peb)})`);
    await p.click('#sheetRoot .sheet button.primary'); await p.waitForTimeout(60);
    await goTab(p,'plan'); await goTab(p,'peb');
    need(!(await p.$('#sheetRoot .sheet')),`4 두 번째부터는 안내가 저절로 뜨지 않음`);
    await p.click('#appbar [data-act="info"]'); await p.waitForTimeout(60);
    need(!!(await p.$('#sheetRoot .sheet .dari-w')),`4 물음표 단추로 안내를 다시 봄`);
    await p.evaluate(()=>closeSheet());

    // 5 평소 화면: 상반신 달이, 지금 바퀴(2바퀴째 15/30)
    const s5=await p.evaluate(()=>{const m=document.querySelector('#main'); const r=m.querySelector('.peb-river');
      return {normal:!!m.querySelector('.dari-n'), happy:!!m.querySelector('.dari-h'), placed:m.querySelectorAll('.peb-river .peb-on').length, lap:m.querySelector('.peb-lap')?.textContent.replace(/\s+/g,' ').trim(),
        label:r?.getAttribute('aria-label')||'', role:r?.getAttribute('role'), sum:m.querySelector('.peb-sum')?.textContent.replace(/\s+/g,' ').trim()}});
    need(s5.normal&&!s5.happy,`5 평소에는 상반신 달이 (일반 ${s5.normal}, 기뻐하는 ${s5.happy})`);
    need(s5.placed===15&&/2바퀴째/.test(s5.lap)&&/15\/30/.test(s5.lap),`3 지금 바퀴에 놓인 조약돌 15개, 2바퀴째 15/30 (${s5.placed}, '${s5.lap}')`);
    need(s5.role==='img'&&/15/.test(s5.label),`7 강 그림을 화면 읽기 프로그램이 읽음 ('${s5.label}')`);
    need(/2단계 모래빛/.test(s5.sum)&&/45개/.test(s5.sum),`3 위 칸: 2단계 모래빛, 모은 조약돌 45개 ('${s5.sum}')`);
    // 지난 바퀴 보기
    await p.click('.peb-lap button[data-act="pebLap"][data-v="-1"]'); await p.waitForTimeout(50);
    const prev=await p.evaluate(()=>({lap:document.querySelector('.peb-lap')?.textContent.replace(/\s+/g,' ').trim(), on:document.querySelectorAll('.peb-river .peb-on').length, gray:document.querySelectorAll('.peb-river .peb-s1').length}));
    need(/1바퀴째/.test(prev.lap)&&prev.on===30&&prev.gray>=30,`3 지난 바퀴(1바퀴째)는 회색 30개 ('${prev.lap}', ${prev.on}개)`);
    await p.click('.peb-lap button[data-act="pebLap"][data-v="1"]'); await p.waitForTimeout(50);

    // 6 오늘 칸과 세 번째 끼니 알림(홈 끼니 카드에서)
    await p.evaluate(()=>{S.ate[today()]=["아침","점심"]; save(); render()});
    const s6=await p.evaluate(()=>document.querySelector('.peb-river .peb-today')?.textContent.replace(/\s+/g,' ').trim()||'');
    need(/오늘\s*2\/3끼/.test(s6),`6 오늘 칸에 먹은 끼니 수 ('${s6}')`);
    await goTab(p,'plan');
    const k=await p.evaluate(()=>{const d=curDay(); return d.meals.findIndex(m=>m.slot==="저녁")});
    await p.evaluate(k=>{const bt=document.querySelector(`[data-act="ateToggle"][data-k="${k}"]`); bt.click()},k); await p.waitForTimeout(80);
    const t6=await p.evaluate(()=>({msg:document.querySelector('#toasts .t-msg')?.textContent||'', act:document.querySelector('#toasts .t-act')?.textContent||'', n:pebInfo().n}));
    need(/조약돌/.test(t6.msg)&&t6.act==='조약돌 보기'&&t6.n===46,`6 세 번째 끼니를 먹음으로 표시하면 알림에 조약돌 소식 ('${t6.msg}' / '${t6.act}', ${t6.n}개)`);
    await p.click('#toasts .t-act'); await p.waitForTimeout(80);
    const s6b=await p.evaluate(()=>({tab:S.tab, today:!!document.querySelector('.peb-river .peb-on.peb-mark')}));
    need(s6b.tab==='peb'&&s6b.today,`6 '조약돌 보기'로 조약돌 탭, 오늘 놓은 조약돌에 표시 (${JSON.stringify(s6b)})`);

    // 5 30개를 채운 순간: 기뻐하는 달이, 한 번만
    await goTab(p,'plan'); await fill(p,59); await p.evaluate(()=>{S.ate[today()]=["아침","점심","저녁"]; save(); render()});
    await goTab(p,'peb');
    const s5b=await p.evaluate(()=>{const sh=document.querySelector('#sheetRoot .sheet'); return {open:!!sh, happy:!!sh&&!!sh.querySelector('.dari-h'), normalInSheet:!!sh&&!!sh.querySelector('.dari-n'), h:sh?.querySelector('h2')?.textContent||'', txt:sh?.textContent.replace(/\s+/g,' ')||''}});
    need(s5b.open&&s5b.happy&&!s5b.normalInSheet&&/2바퀴째를 마쳤습니다/.test(s5b.h),`5 30개를 채우면 기뻐하는 달이 ('${s5b.h}')`);
    need(/옥빛/.test(s5b.txt)&&/60개/.test(s5b.txt),`5 다음 바퀴 색(옥빛)과 모은 개수 60개 안내`);
    await p.click('#sheetRoot .sheet button.primary'); await p.waitForTimeout(50);
    await goTab(p,'plan'); await goTab(p,'peb');
    need(!(await p.$('#sheetRoot .sheet .dari-h')),`5 같은 바퀴는 한 번만 축하`);
    // 단계 보기
    await p.click('[data-act="pebStages"]'); await p.waitForTimeout(50);
    const st6=await p.evaluate(()=>{const sh=document.querySelector('#sheetRoot .sheet'); return {rows:sh?sh.querySelectorAll('.peb-stage').length:0, cur:sh?.querySelector('.peb-stage[aria-current="step"]')?.textContent.replace(/\s+/g,' ').trim()||''}});
    need(st6.rows===5&&/3단계 옥빛/.test(st6.cur),`3 1~5단계 보기: 다섯 단계, 지금은 3단계 옥빛 ('${st6.cur}')`);
    await p.evaluate(()=>closeSheet());

    // 7 그림: 앱 안의 그림이고 실제로 그려짐, 서버 요청 없음
    const img=await p.evaluate(async()=>{const urls=Object.values(DARI); const ok=await Promise.all(urls.map(u=>new Promise(r=>{const i=new Image(); i.onload=()=>r(i.naturalWidth>0); i.onerror=()=>r(false); i.src=u})));
      const bg=getComputedStyle(document.querySelector('.dari-n')).backgroundImage; return {n:urls.length, data:urls.every(u=>u.startsWith('data:image/webp;base64,')), ok:ok.every(Boolean), bg:/^url\("?data:image\/webp/.test(bg)}});
    need(img.n===8&&img.data&&img.ok&&img.bg,`7 달이 3장·조약돌 5색이 앱 안에 있고 그려짐 (${JSON.stringify(img)})`);
    need(nets.length===0,`7 서버 요청 없음 (${nets.length}건)`);
    await ctx.close();
  }

  // 5 조약돌 탭에 들어가 본 적 없이 홈에서 30번째 조약돌을 놓은 사용자: 안내를 닫으면 그 바퀴를 축하한다
  {
    const {ctx,p}=await mk(390,844,'light');
    await fill(p,29); await p.evaluate(()=>{S.peb={intro:0,seen:-1}; S.ate[today()]=["아침","점심"]; S.tab="plan"; save(); render()});
    const k=await p.evaluate(()=>curDay().meals.findIndex(m=>m.slot==="저녁"));
    await p.evaluate(k=>document.querySelector(`[data-act="ateToggle"][data-k="${k}"]`).click(),k); await p.waitForTimeout(80);
    const t=await p.evaluate(()=>document.querySelector('#toasts .t-msg')?.textContent||'');
    need(/1바퀴째 조약돌 30개를 다 채웠습니다/.test(t),`5 30번째 조약돌 알림 ('${t}')`);
    await p.click('#toasts .t-act'); await p.waitForTimeout(80);
    need(!!(await p.$('#sheetRoot .sheet .dari-w')),`5 처음 들어오면 안내가 먼저`);
    await p.click('#sheetRoot .sheet button.primary'); await p.waitForTimeout(80);
    const h=await p.evaluate(()=>{const sh=document.querySelector('#sheetRoot .sheet'); return {happy:!!sh&&!!sh.querySelector('.dari-h'), h:sh?.querySelector('h2')?.textContent||''}});
    need(h.happy&&/1바퀴째를 마쳤습니다/.test(h.h),`5 안내를 닫으면 방금 채운 바퀴를 기뻐하는 달이로 축하 ('${h.h}')`);
    await ctx.close();
  }

  // 7 좁은 화면·어두운 화면
  for(const [w,h,scheme] of [[320,568,'light'],[390,844,'dark'],[768,1024,'light']]){
    const {ctx,p}=await mk(w,h,scheme);
    await fill(p,16); await p.evaluate(()=>{S.peb={intro:1,seen:0}; S.ate[today()]=["아침"]; save(); render()});
    await goTab(p,'peb');
    const g=await p.evaluate(()=>{const de=document.documentElement; const q=s=>document.querySelector(s)?.getBoundingClientRect();
      const river=q('.peb-river'), panel=q('.peb-cap'), dari=q('.dari-n'), sum=q('.peb-sum');
      const slots=[...document.querySelectorAll('.peb-river .peb-slot')].map(e=>e.getBoundingClientRect());
      const inRiver=slots.every(r=>r.left>=river.left-1&&r.right<=river.right+1);
      const txt=document.querySelector('.peb-panel b'); const c1=getComputedStyle(txt).color, c2=getComputedStyle(document.querySelector('.peb-panel')).backgroundColor;
      return {ovf:de.scrollWidth-de.clientWidth, inRiver, slots:slots.length, riverBottom:Math.round(river.bottom+scrollY), dariTop:Math.round(dari.top+scrollY), dariBottom:Math.round(dari.bottom+scrollY), panelTop:Math.round(panel.top+scrollY), sumTop:Math.round(sum.top+scrollY), c1, c2}});
    need(g.ovf<=0&&g.inRiver&&g.slots===30,`7 ${w}×${h} ${scheme}: 가로로 넘치지 않고 30칸이 강 안에 (${g.ovf}px, ${g.slots}칸)`);
    need(g.dariTop>=g.riverBottom-2&&g.dariBottom>g.panelTop,`7 ${w}×${h}: 달이는 강 아래에서 판 위로 내다봄 (강 끝 ${g.riverBottom}, 달이 ${g.dariTop}~${g.dariBottom}, 판 언덕 ${g.panelTop})`);
    const lum=c=>{const m=c.match(/[\d.]+/g).map(Number); const f=v=>{v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}; return 0.2126*f(m[0])+0.7152*f(m[1])+0.0722*f(m[2])};
    const cr=(Math.max(lum(g.c1),lum(g.c2))+0.05)/(Math.min(lum(g.c1),lum(g.c2))+0.05);
    need(cr>=4.5,`7 ${scheme}: 판의 글자 대비 4.5:1 이상 (${cr.toFixed(1)})`);
    await ctx.close();
  }
  await b.close();
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exitCode=1}).finally(()=>b&&b.close().catch(()=>{}));
