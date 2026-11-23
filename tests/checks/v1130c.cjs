const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
require('../lib/guard.cjs');

/* v1.13.0 18차(2026-11-14) 사용자 요청: 읽기 불편하게 몰아 쓴 문장을 다시 배치
   - 기록 탭 오늘 카드: '식단 단계: … · (판정 까닭)'을 한 줄에 잇지 않고, 식단 단계는 이름표 줄로(22차: 까닭·점수 동그라미는 뺌)
   - 영양 화면 '오늘 먹은 양': 안내 다섯 문장을 한 덩어리로 잇지 않고, 오늘 계획·열량 목표·단백질 목표는 이름표 줄(숫자 오른쪽 맞춤),
     닫을 수 있는 안내는 두 문장을 줄을 나눠서 */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const page=T('v1130c.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const SEED=()=>{ const t=today(); S.consent={date:addDays(t,-30)}; S.onb="done"; S.persist="na"; S.stageMode="auto";
  S.profile={...S.profile,height:"174",weight:"63.1",age:"27",sex:"M",usualBM:"1"};
  for(let i=0;i<10;i++) S.logs[addDays(t,-i)]={...BLANK_LOG(),day:1}; save(); };
(async()=>{
  const b=await chromium.launch();
  for(const w of [320,390]){
    const ctx=await b.newContext({viewport:{width:w,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready();

    console.log(`== 폭 ${w}px 기록 탭 오늘 카드 (22차: 판정 까닭·점수 동그라미는 빼고 적은 값만)`);
    {const r=await p.evaluate(()=>{SCR=null; S.tab="log"; render(); const c=document.querySelector('.today-card'); const st=currentStage().stage;
        const kv=[...c.querySelectorAll('.kv')].find(k=>k.querySelector('span')?.textContent==="식단 단계");
        return {joined:/식단 단계:/.test(c.innerText), h2:c.querySelector('h2')?.textContent||"", want:logVal(S.logs[today()]), why:!!c.querySelector('.act-why'), score:!!c.querySelector('.score'),
          stage:kv?.querySelector('b')?.textContent||"", stg:stg(st), dots:!!kv?.querySelector('.sdots'), words:/관해|활동기|점수/.test(c.innerText),
          over:document.documentElement.scrollWidth>document.documentElement.clientWidth}});
      need(!r.joined,'식단 단계를 한 줄에 잇지 않음');
      need(r.h2===r.want&&r.h2==="배변 1회 · 혈변 0회",`제목은 적은 값 그대로 ('${r.h2}')`);
      need(!r.why&&!r.score&&!r.words,'판정 까닭·점수 동그라미·관해/활동기라는 말 없음');
      need(r.stage===r.stg&&r.dots,`식단 단계는 이름표 줄 + 단계 눈금 ('${r.stage}')`);
      need(!r.over,'가로 넘침 없음')}

    console.log(`== 폭 ${w}px 영양 화면 '오늘 먹은 양'`);
    {const r=await p.evaluate(()=>{S.tips=[]; openScr("nutri"); const card=[...document.querySelectorAll('#main .card')].find(c=>/오늘 먹은 양/.test(c.querySelector('h2')?.textContent||""));
        const tipb=card.querySelector('.tipbox[data-tip=nutriAte]'); const kv={}; for(const k of card.querySelectorAll('.kv')) kv[k.querySelector('span').textContent]=k.querySelector('b');
        const d=S.plan.days.find(x=>x.date===today()), plan=d?totals(dayItems(d)):null, tg=targets();
        const rights=["오늘 계획","열량 목표","단백질 목표"].filter(k=>kv[k]).map(k=>Math.round(kv[k].getBoundingClientRect().right));
        return {tipP:tipb?tipb.querySelectorAll('p').length:-1, tipPlan:/오늘 계획/.test(tipb?.textContent||""), tipText:tipb?.textContent||"",
          plan:kv["오늘 계획"]?.textContent||"", planWant:plan?`${Math.round(plan.k).toLocaleString()}kcal · 단백질 ${Math.round(plan.p)}g`:"",
          kcal:kv["열량 목표"]?.textContent||"", prot:kv["단백질 목표"]?.textContent||"", kpk:tg.kpk, pk:tg.pk, bmi:/체질량지수\(BMI\) 20\.8\(정상\)/.test(card.innerText),
          rights, over:document.documentElement.scrollWidth>document.documentElement.clientWidth,
          // 19차: 줄은 말 덩어리 사이에서만 바뀜(덩어리 안에서 꺾이지 않음), 넓은 폭에서는 둘째 문단이 쉼표 뒤에서 한 번만
          chunks:[...card.querySelectorAll('.tipbox p .nb, .kv-list+p .nb, .empty .hint .nb')].map(c=>({t:c.textContent,h:c.getBoundingClientRect().height,lh:parseFloat(getComputedStyle(c.parentElement).lineHeight)})),
          p2:(()=>{const q=tipb?.querySelectorAll('p')[1]; const cs=q?[...q.querySelectorAll('.nb')]:[]; return {n:q?Math.round(q.getBoundingClientRect().height/parseFloat(getComputedStyle(q).lineHeight)):0, first:cs[1]?.textContent||"", left:cs[1]?Math.round(cs[1].getBoundingClientRect().left-q.getBoundingClientRect().left):-1}})()}});
      need(r.tipP===2&&!r.tipPlan,`닫을 수 있는 안내는 두 문장을 줄을 나눠서, 계획 숫자는 빼고 (${r.tipP}문단)`);
      need(/'먹음'으로 표시한 끼니\(반·전부·더 많이 반영\)와 직접 기록한 음식의 합계입니다\./.test(r.tipText)&&/저녁 7시부터 주황색으로 표시합니다\./.test(r.tipText),'안내 문장은 그대로');
      need(r.planWant&&r.plan===r.planWant,`오늘 계획은 이름표 줄, 천 단위 쉼표 ('${r.plan}')`);
      need(/^체중 1kg당 \d+kcal/.test(r.kcal)&&r.kcal.includes(`${r.kpk}kcal`),`열량 목표 줄 ('${r.kcal}')`);
      need(/^체중 1kg당 [\d.]+g/.test(r.prot)&&r.prot.includes(`${r.pk}g`),`단백질 목표 줄 ('${r.prot}')`);
      need(r.bmi,'BMI 구분은 목표 줄 아래 안내로');
      need(r.rights.length===3&&Math.max(...r.rights)-Math.min(...r.rights)<=1,`숫자 오른쪽 끝이 한 줄 (${r.rights})`);
      need(!r.over,'가로 넘침 없음');
      const bent=r.chunks.filter(c=>c.h>c.lh*1.5).map(c=>c.t);
      need(r.chunks.some(c=>c.t==="하루가 끝나기 전에는 합계가 적게 나오므로,")&&r.chunks.some(c=>c.t==="홈 화면 끼니의 '먹음'을 누르거나,")&&r.chunks.some(c=>/^열량은 체질량지수/.test(c.t)),`안내·목표 설명·빈 기록 안내를 말 덩어리로 (${r.chunks.length}개)`);
      need(!bent.length,`말 덩어리 안에서 줄이 꺾이지 않음 (${bent.join(' / ')})`);
      if(w>=390) need(r.p2.n===2&&r.p2.first.startsWith("모자란 영양소는")&&r.p2.left===0,`둘째 문단은 쉼표 뒤에서 한 번 바뀌어 '모자란 영양소는 …'으로 시작 (${r.p2.n}줄, '${r.p2.first}' 왼쪽 ${r.p2.left})`)}
    if(w===390){   // 320px에서는 한 줄에 다 안 들어가 일부러 묶지 않음
      console.log('== 이름표 \'X:\'가 뒤 낱말과 떨어져 줄 끝에 남지 않음(근거 번호와 묶인 끝 두 낱말 앞)');
      const r=await p.evaluate(()=>{const ul=document.createElement('ul'); ul.innerHTML=`<li>기름 (식용유·참기름): 기름을 줄입니다${sup([20,37,39])}</li>`; document.querySelector('#main').append(ul); groupRefs(ul);
        const lab=[...ul.querySelectorAll('.nb')].find(x=>/^(기름 )?\(식용유·참기름\):/.test(x.textContent));   /* 23차: 근거 칩 글자를 길이에서 빼서 짧은 이름표 '기름 (식용유·참기름):'가 통째로 묶일 수 있음 */ const t=lab?lab.textContent:""; ul.remove(); return t});
      need(/^(기름 )?\(식용유·참기름\): 기름을/.test(r),`'(식용유·참기름):'와 뒤 낱말이 한 덩어리 ('${r}')`)}
    await ctx.close();
  }
  await b.close();
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exitCode=1});
