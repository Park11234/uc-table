const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
require('../lib/guard.cjs');

/* 7차(2026-10-27) 리팩토링 중 다시 찾은 결함:
   (22차: 1·2는 체중 경고와 진료용 PDF를 빼면서 '경고 없음' 점검으로 바꿈)
   1) 진료용 PDF의 체중 감소 줄이 단계(1·2단계)를 정한 값과 다른 기간의 %를 적음(홈 경고와 다름)
   2) 70세가 넘은 사람의 낮은 체질량지수(20 미만)를 홈은 알리는데 진료용 PDF에는 빠짐
   3) 'PDF 공유'를 한 번 누르고 나면 단추의 공유 아이콘이 사라짐
   4) 준비한 파일 '공유하기'에서 저장이 거절되면 처리하지 않은 오류로 '앱에 문제가 생겼습니다'가 뜸
   5) 물 '+1잔'이 하루 상한(40잔)에 닿아도 알림은 한 잔 더한 양을 말함 */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const BODY=fs.readFileSync(APP,'utf8');
const page=T('v1125.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+BODY+'</body></html>');
const SEED=()=>{ S.consent={date:today()}; S.onb="done"; S.persist="na"; S.stageMode="auto"; S.profile={...S.profile,height:"174",weight:"63",age:"27",sex:"M"}; save(); };
(async()=>{
  const b=await chromium.launch();
  const open=async(opt={})=>{const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    if(opt.share) await p.addInitScript(()=>{navigator.share=async()=>{}; navigator.canShare=()=>true});
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready(); await p.waitForTimeout(150); return p};

  console.log('== 1·2 → 22차: 체중 감소·낮은 체질량지수 경고(GLIM)는 뺐다. 홈·몸무게 화면·PDF 어디에도 영양불량 판정 없음');
  {const p=await open();
    const r=await p.evaluate(()=>{const t=today(), w=(o,kg)=>({date:addDays(t,o),kg}); const out=[];
      const view=()=>{SCR=null; S.tab="plan"; render(); const home=document.querySelector('#main').innerText; SCR={name:"set-weight"}; render(); const ws=document.querySelector('#main').innerText; SCR=null; render();
        return {home,ws,pdf:reportBlocks().blocks.join(""),ban:document.querySelectorAll('#main .banner.warn,#main .banner.urgent,#main .banner.crit').length}};
      S.weights=[w(-400,100),w(-100,83),w(0,78)]; save(); out.push(view());   // 예전 2단계(6개월 넘게 22%)
      S.weights=[w(-100,100),w(0,88)]; save(); out.push(view());              // 예전 2단계(6개월 안 12%)
      S.profile.age="75"; S.profile.height="160"; S.weights=[{date:t,kg:50}]; save(); out.push(view());   // 예전 BMI 19.5 경고(70세 넘음)
      return {out,fn:[typeof glimHTML,typeof glimFacts,typeof weightLoss]}});
    const bad=/영양불량|GLIM|줄었습니다|낮습니다|주치의|영양사와 상의/;
    need(r.fn.every(x=>x==="undefined"),`판정 함수 없음 (${r.fn})`);
    need(r.out.every(o=>!o.ban&&!bad.test(o.home)&&!bad.test(o.ws)&&!/체중|체질량/.test(o.pdf)),`홈·몸무게 화면·PDF에 경고 없음 (${r.out.map(o=>[o.ban,(o.home.match(bad)||o.ws.match(bad)||[""])[0]].join(':')).join(' / ')})`);
    await p.context().close()}

  console.log("== 3 'PDF 공유'를 누른 뒤에도 단추 아이콘이 남음");
  {const p=await open({share:true});
    const r=await p.evaluate(async()=>{SCR={name:"pdf"}; render(); const before=document.querySelector('#pdfShareBtn')?.innerHTML||"";
      await exportPDF("share"); await new Promise(z=>setTimeout(z,100)); const btn=document.querySelector('#pdfShareBtn');
      return {before:/<svg/.test(before),after:!!btn&&/<svg/.test(btn.innerHTML),text:btn?.textContent.trim(),dis:btn?.disabled}});
    need(r.before,'처음에는 공유 아이콘이 있음');
    need(r.after&&r.text==="PDF 공유"&&r.dis===false,`만들기를 마친 뒤에도 아이콘과 글자가 그대로, 다시 누를 수 있음 (${JSON.stringify(r)})`);
    await p.context().close()}

  console.log("== 4 준비한 파일 '공유하기'에서 저장을 거절해도 오류 안내가 뜨지 않음");
  {const p=await open();
    const r=await p.evaluate(async()=>{navigator.canShare=()=>false; DL={save:()=>Promise.reject({code:"declined"})};
      READY={filename:"t.pdf",blob:new Blob(["x"]),type:"application/pdf",title:"t"}; openSheet(`<h2>준비</h2><button class="btn primary" data-act="readyShare">공유하기</button>`);
      document.querySelector('[data-act=readyShare]').click(); await new Promise(z=>setTimeout(z,300));
      return {err:!!document.getElementById('errbar'),errText:document.getElementById('errbar')?.textContent.slice(0,80)||""}});
    need(!r.err,`처리하지 않은 오류 안내(앱에 문제가 생겼습니다)가 없음 (${r.errText})`);
    await p.context().close()}

  console.log("== 5 물 '+1잔'이 하루 상한(40잔)에 닿으면 알림도 실제로 적힌 양");
  {const p=await open();
    const r=await p.evaluate(async()=>{S.cupMl=200; S.water[today()]=40; save(); SCR=null; S.tab="plan"; render();
      document.querySelector('[data-act=cupAdd]').click(); await new Promise(z=>setTimeout(z,50));
      const a={n:S.water[today()],toast:document.querySelector('#toasts .t-msg')?.textContent};
      S.water[today()]=3; save(); render(); document.querySelector('[data-act=cupAdd]').click(); await new Promise(z=>setTimeout(z,50));
      return {a,b:{n:S.water[today()],toast:document.querySelector('#toasts .t-msg')?.textContent}}});
    need(r.a.n===40&&r.a.toast==="물 8000ml",`40잔에서 더 눌러도 40잔, 알림 '물 8000ml' (${JSON.stringify(r.a)})`);
    need(r.b.n===4&&r.b.toast==="물 800ml",`평소에는 한 잔 늘고 알림도 그 양 (${JSON.stringify(r.b)})`);
    await p.context().close()}

  await b.close();
  console.log(F.length?`\n실패 ${F.length}건`:'\n모두 통과'); process.exit(F.length?1:0);
})().catch(e=>{console.error(e); process.exit(1)});
