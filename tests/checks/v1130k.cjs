const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
require('../lib/guard.cjs');

/* v1.13.0 29차(2026-11-21) 사용자 요청
   1 첫 화면과 시작 설정을 마치고 홈에 처음 오면 앱 사용 방법 창이 한 번 뜬다(그냥 시작하기·설정 마침·마침 뒤 증상 기록 모두)
   2 홈 오른쪽 위 i 왼쪽에 '사용 방법' 단추, 누르면 그 창이 다시 뜬다(다른 탭에는 없음) */
const { chromium } = require('playwright');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
fs.mkdirSync(TMP,{recursive:true}); const page=path.join(TMP,'v1130k.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const sheet=()=>({h2:document.querySelector('#sheetRoot h2')?.textContent||"", steps:document.querySelectorAll('#sheetRoot .howto li').length, dari:!!document.querySelector('#sheetRoot .dari-w[role=img]'), close:!!document.querySelector('#sheetRoot [data-act=closeSheet].btn')});
(async()=>{
  const b=await chromium.launch();
  try{
  const open=async()=>{const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''})); await p.goto('file://'+page);
    await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000}); return p};

  console.log('== 1 처음 설정 뒤 사용 방법 한 번');
  {const p=await open();
    await p.click('label:has(#c_req)'); await p.click('#consentGo'); await p.waitForTimeout(500); await p.click('[data-act=onbSkip]'); await p.waitForTimeout(400);
    const a=await p.evaluate(sheet); const home=await p.evaluate(()=>S.tab==="plan"&&!SCR&&S.onb==="done");
    need(home&&a.h2==="UC TABLE 사용 방법"&&a.steps===5&&a.dari&&a.close,`1 '그냥 시작하기' 뒤 홈에 사용 방법 창(달이·다섯 가지·닫기) (${JSON.stringify(a)})`);
    await p.evaluate(()=>closeSheet()); await p.waitForTimeout(300);
    await p.reload(); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild); await p.waitForTimeout(300);
    const again=await p.evaluate(()=>!!document.querySelector('#sheetRoot .howto'));
    need(!again,`1 다시 열면 저절로 뜨지 않음 (${again})`);
    console.log('== 2 홈 오른쪽 위 사용 방법 단추');
    const bar=await p.evaluate(()=>{const o={}; for(const t of ["plan","log","food","me","peb"]){SCR=null; S.tab=t; render(); o[t]=[...document.querySelectorAll('#appbar button')].map(x=>x.dataset.act).join(",")}
      SCR=null; S.tab="plan"; render(); const btn=document.querySelector('#appbar [data-act=howto]'); o.txt=btn?.textContent||""; return o});
    need(bar.plan==="howto,info"&&bar.txt==="사용 방법",`2 홈 오른쪽 위는 '사용 방법' 다음 i (${bar.plan}, '${bar.txt}')`);
    need(["log","food","me","peb"].every(t=>!bar[t].includes("howto")),`2 다른 탭에는 '사용 방법' 단추 없음 (${["log","food","me","peb"].map(t=>t+":"+bar[t]).join(" ")})`);
    await p.evaluate(()=>document.querySelector('#appbar [data-act=howto]')?.click()); await p.waitForTimeout(300);
    const b2=await p.evaluate(sheet);
    need(b2.h2==="UC TABLE 사용 방법"&&b2.steps===5,`2 '사용 방법'을 누르면 같은 창이 다시 뜸 (${JSON.stringify(b2)})`);
    await p.context().close()}

  console.log('== 3 설정을 마친 경우·마친 뒤 증상 기록으로 간 경우');
  {const p=await open();
    await p.evaluate(()=>{S.consent={date:today()}; S.onb="3"; save(); render()});
    await p.click('[data-act=onbDone][data-v=""]'); await p.waitForTimeout(400);
    const a=await p.evaluate(sheet);
    need(a.h2==="UC TABLE 사용 방법",`3 '설정 마침' 뒤 홈에 사용 방법 창 ('${a.h2}')`);
    await p.context().close()}
  {const p=await open();
    await p.evaluate(()=>{S.consent={date:today()}; S.onb="3"; save(); render()});
    await p.click('[data-act=onbDone][data-v="log"]'); await p.waitForTimeout(400);
    const inWz=await p.evaluate(()=>({scr:SCR?.name||"", sheet:!!document.querySelector('#sheetRoot .howto')}));
    await p.evaluate(()=>closeScr()); await p.waitForTimeout(300);
    const after=await p.evaluate(sheet);
    need(inWz.scr==="wizard"&&!inWz.sheet&&after.h2==="UC TABLE 사용 방법",`3 증상 기록으로 가면 기록 화면에서는 뜨지 않고 홈에 돌아오면 뜸 (${JSON.stringify(inWz)}, '${after.h2}')`);
    await p.context().close()}

  } finally { await b.close() }
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exitCode=1});
