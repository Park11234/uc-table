const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
require('../lib/guard.cjs');

/* v1.13.0 35차(2026-11-23) 사용자 요청
   음식 정보 창 판정 바로 아래 '분류 변경'에서 음식을 좋음·주의·피하기·절대 금지 가운데로 직접 옮긴다(시안 A안)
   - 옮긴 음식은 판정 옆에 '직접 옮김', 앱 판정은 한 줄로 함께. '앱 판정대로'나 앱 판정 칸을 누르면 되돌림
   - 찾아보기 목록도 옮긴 분류로 묶고 줄에 '직접 옮김', 걸러 보기에 '직접 옮긴 음식'
   - 7일 식단에도 반영(피하기·절대 금지는 빼고, 좋음·주의는 넣을 수 있음)
   - 알레르기 음식도 옮길 수 있다(사용자 선택). 좋음·주의로 옮길 때만 한 번 더 묻는다 */
const { chromium } = require('playwright');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
fs.mkdirSync(TMP,{recursive:true}); const page=path.join(TMP,'v1130n.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const SEED=()=>{S.consent={date:today()}; S.onb="done"; S.persist="na"; S.stageMode="1"; S.logs={}; S.myLv={}; S.profile.allergies=[]; save()};
const sheet=()=>{const r=document.querySelector('#sheetRoot'); const box=r.querySelector('.mv-box');
  return {pill:r.querySelector('.pill')?.textContent.trim(), tag:r.querySelector('.mine-tag')?.textContent||"", app:r.querySelector('.app-line')?.textContent.replace(/\s+/g," ").trim()||"",
    head:box?.querySelector('.mv-h')?.firstChild?.textContent.trim()||"", hint:box?.querySelector('.mv-h .hint')?.textContent||"", reset:!!box?.querySelector('.mv-reset'),
    btns:[...(box?.querySelectorAll('.mv-grid button')||[])].map(b=>[b.dataset.v,b.querySelector('.pill').textContent.trim(),b.querySelector('small').textContent,b.getAttribute('aria-pressed')]),
    ask:!!r.querySelector('[data-act=myLvNo]'), my:JSON.parse(JSON.stringify(S.myLv||{}))}};
(async()=>{
  const b=await chromium.launch();
  try{
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
  await p.route(/^https?:/, r=>r.fulfill({body:''}));
  const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
  await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready();
  const tap=async sel=>{await p.evaluate(sel=>{document.querySelector(sel).click()},sel); await p.waitForTimeout(100)};
  const open=id=>p.evaluate(id=>{S.stageMode="1"; S.tab="food"; SCR=null; render(); showFood(id)},id);

  console.log("== 1 판정 바로 아래 '분류 변경'");
  {await open('kimchi_jjigae'); const a=await p.evaluate(sheet);
    need(a.head==="분류 변경"&&a.hint==="식단에도 반영"&&!a.reset,`1 제목 '분류 변경', 식단에도 반영 (${a.head}, ${a.hint})`);
    need(JSON.stringify(a.btns.map(x=>x[1]))==='["좋음","주의","피하기","절대 금지"]',`1 좋음·주의·피하기·절대 금지 순서 (${a.btns.map(x=>x[1])})`);
    need(a.pill==="피하기"&&a.btns.find(x=>x[0]==="avoid")[2]==="앱 판정"&&a.btns.filter(x=>x[3]==="true").map(x=>x[0]).join()==="avoid"&&!a.tag,`1 앱 판정(피하기) 칸에 '앱 판정' 표시와 눌림, '직접 옮김' 없음 (${JSON.stringify(a.btns)})`)}

  console.log("== 2 주의로 옮기기");
  {await tap('#sheetRoot [data-act=myLv][data-v=caution]'); const a=await p.evaluate(sheet);
    need(a.my.kimchi_jjigae==="caution"&&a.pill==="주의"&&a.tag==="직접 옮김",`2 옮기면 판정 '주의'와 '직접 옮김' (${JSON.stringify(a.my)}, ${a.pill}, ${a.tag})`);
    need(/^앱 판정은 피하기입니다: 맵고 자극적인/.test(a.app)&&a.reset&&a.btns.filter(x=>x[3]==="true").map(x=>x[0]).join()==="caution",`2 앱 판정 한 줄과 '앱 판정대로' (${a.app})`);
    const l=await p.evaluate(()=>{closeSheet(); S.foodQ="김치찌개"; render(); const g=[...document.querySelectorAll('#main .fgroup')].map(x=>[x.querySelector('.fg-h')?.textContent.replace(/\s+/g," ").trim(),[...x.querySelectorAll('.fcard')].map(c=>c.getAttribute('aria-label'))]);
      S.foodQ=""; S.foodLv="mine"; render(); const mine=[...new Set([...document.querySelectorAll('#main .fcard')].map(c=>c.dataset.id))]; const meta=document.querySelector('#main .fcard .mine-m')?.textContent||""; S.foodLv="전체"; render(); return {g,mine,meta}});
    const nowG=l.g.find(x=>/지금 먹을 수 있는 음식|검색어와 같은 음식/.test(x[0])&&x[1].some(t=>/^김치찌개, 주의\(직접 옮김\)/.test(t)));
    need(!!nowG&&!l.g.some(x=>/^피하기/.test(x[0])&&x[1].some(t=>/^김치찌개,/.test(t))),`2 목록에서 김치찌개가 '주의'(직접 옮김)로 보이고 피하기 묶음에는 없음 (${JSON.stringify(l.g.map(x=>[x[0],x[1].length]))})`);
    need(JSON.stringify(l.mine)==='["kimchi_jjigae"]'&&l.meta==="직접 옮김",`2 걸러 보기 '직접 옮긴 음식'은 옮긴 음식만, 줄에 '직접 옮김' (${l.mine}, ${l.meta})`)}

  console.log("== 3 되돌리기");
  {await open('kimchi_jjigae'); await tap('#sheetRoot .mv-reset'); const a=await p.evaluate(sheet);
    need(!("kimchi_jjigae" in a.my)&&a.pill==="피하기"&&!a.tag,`3 '앱 판정대로'를 누르면 되돌림 (${JSON.stringify(a.my)}, ${a.pill})`);
    await tap('#sheetRoot [data-act=myLv][data-v=ban]'); await tap('#sheetRoot [data-act=myLv][data-v=avoid]'); const c=await p.evaluate(sheet);
    need(!("kimchi_jjigae" in c.my)&&c.pill==="피하기",`3 앱 판정 칸(피하기)을 눌러도 되돌림 (${JSON.stringify(c.my)})`)}

  console.log("== 4 다음 단계 음식");
  {const id=await p.evaluate(()=>{S.stageMode="1"; return FOODS.find(f=>f.id==="brown_rice"&&foodStatus(f).level==="later")?.id||FOODS.find(f=>foodStatus(f).level==="later"&&f.cat==="곡류").id});
    await open(id); const a=await p.evaluate(sheet);
    need(a.btns.every(x=>x[3]==="false")&&/^앱 판정 다음 단계/.test(a.hint),`4 앱 판정이 '다음 단계'면 눌린 칸 없이 안내 (${a.hint})`);
    const before=await p.evaluate(id=>menuFoods().some(f=>f.id===id),id);
    await tap('#sheetRoot [data-act=myLv][data-v=ok]'); const after=await p.evaluate(id=>menuFoods().some(f=>f.id===id),id); const c=await p.evaluate(sheet);
    need(c.my[id]==="ok"&&c.pill==="좋음"&&!before&&after,`4 좋음으로 옮기면 식단에 쓸 수 있는 음식이 됨 (${id}: ${before} → ${after})`);
    await p.evaluate(id=>{delete S.myLv[id]; save()},id)}

  console.log("== 5 식단에 반영");
  {const r=await p.evaluate(()=>{S.tab="plan"; SCR=null; closeSheet(); render(); const items=()=>S.plan.days.flatMap(d=>d.meals.flatMap(m=>(m.items||[]).map(x=>x[0])));
      const b0=items().filter(x=>x==="white_rice").length; S.myLv.white_rice="ban"; save(); render(); const b1=items().filter(x=>x==="white_rice").length;
      const ok=menuFoods().some(f=>f.id==="white_rice"); delete S.myLv.white_rice; save(); render(); return {b0,b1,ok,after:items().filter(x=>x==="white_rice").length}});
    need(r.b0>0&&r.b1===0&&!r.ok&&r.after>0,`5 흰쌀밥을 절대 금지로 옮기면 7일 식단에서 빠지고, 되돌리면 다시 나옴 (${JSON.stringify(r)})`)}

  console.log("== 6 알레르기 음식은 좋음·주의로 옮길 때 한 번 더 묻기");
  {await p.evaluate(()=>{S.profile.allergies=["egg"]; save()}); await open('egg_steamed'); const a=await p.evaluate(sheet);
    need(a.pill==="절대 금지"&&a.btns.find(x=>x[0]==="ban")[2]==="앱 판정",`6 달걀 알레르기면 달걀찜은 절대 금지 (${a.pill})`);
    await tap('#sheetRoot [data-act=myLv][data-v=ok]'); const q=await p.evaluate(sheet); const txt=await p.evaluate(()=>document.querySelector('#sheetRoot .mv-box .crit-t')?.textContent||"");
    need(q.ask&&!("egg_steamed" in q.my)&&/알레르기/.test(txt)&&/식단에도 나올 수 있습니다/.test(txt),`6 좋음을 누르면 바로 옮기지 않고 묻는다 (${txt})`);
    await tap('#sheetRoot [data-act=myLvNo]'); const n=await p.evaluate(sheet); need(!n.ask&&!("egg_steamed" in n.my),'6 그대로 두기를 누르면 옮기지 않음');
    await tap('#sheetRoot [data-act=myLv][data-v=caution]'); await tap('#sheetRoot [data-act=myLv][data-ok="1"]'); const y=await p.evaluate(sheet);
    need(y.my.egg_steamed==="caution"&&y.pill==="주의"&&!y.ask,`6 '옮기기'를 누르면 옮김 (${JSON.stringify(y.my)})`);
    await p.evaluate(()=>{delete S.myLv.egg_steamed; save()}); await open('egg_steamed'); await tap('#sheetRoot [data-act=myLv][data-v=avoid]'); const v=await p.evaluate(sheet);
    need(v.my.egg_steamed==="avoid"&&!v.ask,`6 피하기로 옮길 때는 묻지 않음 (${JSON.stringify(v.my)})`);
    await p.evaluate(()=>{S.myLv={}; S.profile.allergies=[]; save()})}

  console.log("== 7 저장·불러오기·백업 합치기");
  {await p.evaluate(()=>{S.myLv={kimchi_jjigae:"ok"}; S.foodLv="mine"; save()}); await p.reload(); await ready();
    const r=await p.evaluate(()=>{const o={kept:S.myLv.kimchi_jjigae, lv:S.foodLv};
      o.norm=normalizeState({...JSON.parse(JSON.stringify(S)),myLv:{a:"bad",ramen:"ok",b:7}}).myLv;
      const bk=JSON.parse(backupJSON()); o.bk=bk.myLv?.kimchi_jjigae;
      o.merge=mergeStates({...JSON.parse(JSON.stringify(S)),myLv:{kimchi_jjigae:"ok"}},{...JSON.parse(JSON.stringify(S)),myLv:{kimchi_jjigae:"ban",ramen:"caution"}}).myLv;
      S.foodLv="전체"; S.myLv={}; save(); return o});
    need(r.kept==="ok"&&r.lv==="mine",`7 다시 열어도 남음 (${JSON.stringify(r)})`);
    need(JSON.stringify(r.norm)==='{"ramen":"ok"}'&&r.bk==="ok",`7 잘못된 값은 버리고 백업에 들어감 (${JSON.stringify(r.norm)})`);
    need(JSON.stringify(r.merge)==='{"kimchi_jjigae":"ok","ramen":"caution"}',`7 백업을 합치면 지금 것을 먼저 두고 없는 것만 더함 (${JSON.stringify(r.merge)})`)}
  await ctx.close();

  console.log("== 8 좁은 화면(320px)");
  {const c2=await b.newContext({viewport:{width:320,height:700},isMobile:true,hasTouch:true}); const q=await c2.newPage(); await q.route(/^https?:/,r=>r.fulfill({body:''}));
    await q.goto('file://'+page); await q.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild);
    const r=await q.evaluate(()=>{S.consent={date:today()}; S.onb="done"; S.myLv={kimchi_jjigae:"caution"}; S.tab="food"; render(); showFood('kimchi_jjigae');
      const box=document.querySelector('#sheetRoot .mv-box'); const bb=box.getBoundingClientRect();
      return {over:[...box.querySelectorAll('*')].some(e=>e.getBoundingClientRect().right>bb.right+1), small:[...box.querySelectorAll('button')].filter(x=>x.getBoundingClientRect().height<44).map(x=>x.textContent.trim()), page:document.documentElement.scrollWidth>innerWidth+1}});
    need(!r.over&&!r.page&&!r.small.length,`8 320px에서 넘침 없음, 단추 44px 이상 (${JSON.stringify(r)})`); await c2.close()}
  } finally { await b.close() }
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exitCode=1});
