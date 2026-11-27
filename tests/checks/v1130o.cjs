const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
require('../lib/guard.cjs');

/* v1.13.0 36차(2026-11-23) 사용자 요청
   끼니의 '먹음'·'안 먹음'을 3일 넘게 하나도 누르지 않으면 조약돌 탭의 달이가 우는 그림(사용자가 준 그림)으로 바뀌고,
   아래 탭에서 조약돌 탭을 누르면 '달이가 슬퍼해요!' 창이 뜬다. 하나라도 누르면 바로 원래대로, 다시 3일이 지나면 또 뜬다 */
const { chromium } = require('playwright');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
fs.mkdirSync(TMP,{recursive:true}); const page=path.join(TMP,'v1130o.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
(async()=>{
  const b=await chromium.launch();
  try{
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
  await p.route(/^https?:/, r=>r.fulfill({body:''}));
  const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
  await p.goto('file://'+page); await ready();
  // 상태를 심고 홈에서 시작(조약돌 안내 창은 본 것으로)
  const seed=o=>p.evaluate(o=>{const d=n=>addDays(today(),-n); S.consent={date:d(o.consent??10)}; S.onb="done"; S.persist="na"; S.peb.intro=o.intro??1;
    S.ate=Object.fromEntries((o.ate||[]).map(n=>[d(n),[mealSlots()[0]]])); S.skips=Object.fromEntries((o.skip||[]).map(n=>[d(n),[mealSlots()[0]]]));
    S.ratings=(o.rate||[]).map(n=>({date:d(n),slot:mealSlots()[0],title:"x",foodId:"egg_steamed",rating:"good"})); closeSheet(); SCR=null; S.tab="plan"; save(); render()},o);
  const look=()=>p.evaluate(()=>{const dk=document.querySelector('.peb-dock .dari'); return {tab:S.tab, sheet:document.querySelector('#sheetRoot h2')?.textContent||"", sub:document.querySelector('#sheetRoot .hint')?.textContent||"",
    cry:!!dk?.classList.contains('dari-c'), aria:dk?.getAttribute('aria-label')||"", art:!!document.querySelector('#sheetRoot .dari-c')}});
  const tabPeb=async()=>{await p.waitForFunction(()=>!document.querySelector('.tabs [disabled]'),null,{timeout:5000}).catch(()=>{}); await p.evaluate(()=>document.querySelector('.tab[data-tab=peb]').click()); await p.waitForTimeout(250)};

  console.log("== 1 우는 달이 그림");
  {const r=await p.evaluate(()=>{pebCss(); return {c:/^data:image\/webp;base64,/.test(DARI.c||"")&&DARI.c.length>2000, css:document.getElementById('pebCss').textContent.includes(`.dari-c{background-image:url(${DARI.c})}`)}});
    need(r.c&&r.css,`1 앱 안에 우는 달이 그림(WebP)과 스타일 (${JSON.stringify(r)})`)}

  console.log("== 2 3일째부터 슬퍼함");
  {await seed({ate:[2]}); await tabPeb(); const a=await look();
    need(!a.cry&&a.aria==="수달 달이"&&!a.sheet,`2 마지막 '먹음'이 이틀 전이면 그대로 (${JSON.stringify(a)})`);
    await seed({ate:[3]}); await tabPeb(); const c=await look();
    need(c.sheet==="달이가 슬퍼해요!"&&/3일째/.test(c.sub)&&c.art,`2 사흘 전이면 조약돌 탭을 누를 때 '달이가 슬퍼해요!' 창(우는 달이·3일째) (${JSON.stringify(c)})`);
    await p.evaluate(()=>closeSheet()); await p.waitForTimeout(150); await p.evaluate(()=>render()); await p.waitForTimeout(250); const d=await look();
    need(d.cry&&d.aria==="울고 있는 수달 달이"&&!d.sheet,`2 창을 닫으면 조약돌 탭 달이가 우는 그림, 화면을 다시 그려도 창이 다시 뜨지 않음 (${JSON.stringify(d)})`);
    await p.evaluate(()=>{S.tab="plan"; render()}); await tabPeb(); const e=await look();
    need(e.sheet==="달이가 슬퍼해요!",`2 조약돌 탭을 다시 누르면 또 뜸 (${e.sheet})`)}

  console.log("== 3 '안 먹음'·끼니 평가도 누른 것으로 셈, 한 번도 안 눌렀으면 시작한 날부터");
  {await seed({ate:[5],skip:[1]}); await tabPeb(); const a=await look(); need(!a.cry&&!a.sheet,`3 어제 '안 먹음'을 눌렀으면 그대로 (${a.cry})`);
    await seed({ate:[5],rate:[0]}); await tabPeb(); const r=await look(); need(!r.cry&&!r.sheet,`3 오늘 끼니를 평가했으면 그대로 (${r.cry})`);
    await seed({consent:3}); await tabPeb(); const c=await look(); need(c.cry&&c.sheet==="달이가 슬퍼해요!",`3 한 번도 안 누르고 시작한 지 사흘이면 슬퍼함 (${c.cry})`);
    await seed({consent:0}); await tabPeb(); const t=await look(); need(!t.cry&&!t.sheet,`3 오늘 시작했으면 그대로 (${t.cry})`)}

  console.log("== 4 하나라도 누르면 돌아오고, 다시 3일이 지나면 또");
  {await seed({ate:[4]}); await tabPeb(); const a=await look(); need(a.sheet==="달이가 슬퍼해요!",'4 나흘째 슬퍼함');
    await p.evaluate(()=>document.querySelector('#sheetRoot [data-act=pebSadGo]').click()); await p.waitForTimeout(250); const g=await look();
    need(g.tab==="plan"&&!g.sheet,`4 '오늘 끼니 표시하기'를 누르면 홈 (${g.tab})`);
    await p.waitForFunction(()=>!!document.querySelector('#main [data-act=ateToggle]:not([disabled])'),null,{timeout:5000});
    await p.evaluate(()=>document.querySelector('#main [data-act=ateToggle]').click()); await p.waitForTimeout(250);
    const ok=await p.evaluate(()=>(S.ate[today()]||[]).length); await tabPeb(); const c=await look();
    need(ok>=1&&!c.cry&&!c.sheet&&c.aria==="수달 달이",`4 홈에서 '먹음'을 한 번 누르면 원래 달이, 창 없음 (${ok}, ${JSON.stringify(c)})`);
    await p.evaluate(()=>{const v=S.ate[today()]; delete S.ate[today()]; S.ate[addDays(today(),-3)]=v; S.tab="plan"; save(); render()}); await tabPeb(); const d=await look();
    need(d.cry&&d.sheet==="달이가 슬퍼해요!",`4 그 뒤 다시 사흘이 지나면 또 슬퍼함 (${JSON.stringify(d)})`)}

  console.log("== 5 처음 들어올 때는 안내 다음에");
  {await seed({ate:[4],intro:0}); await tabPeb(); const a=await look();
    await p.evaluate(()=>{closeSheet(); render()}); await p.waitForTimeout(250); const c=await look();
    need(a.sheet!=="달이가 슬퍼해요!"&&!!a.sheet&&c.sheet==="달이가 슬퍼해요!",`5 조약돌 안내 창을 닫으면 이어서 슬퍼하는 창 (${a.sheet} → ${c.sheet})`)}
  await ctx.close();
  } finally { await b.close() }
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exitCode=1});
