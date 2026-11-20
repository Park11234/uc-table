const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}

/* 10차(2026-10-29) 사용자 요청:
   1) 내 정보의 '경고'는 접근성 안내처럼 한 줄, 누르면 경고 목록 화면(set-warn)
   2) 끼니마다 붙던 곁들임 대신 하루 한 번 간식 칸(아침·점심·저녁·간식), '먹고 싶을 때' 안내
   3) 그래도 칼슘이 권장섭취량의 90%에 못 미치는 날만 저녁에 우유 한 컵(결정 39)
   4) 간식 바꾸기가 저장·불러오기 뒤에도 남음, '오늘 할 일'의 끼니 표시는 세 끼만 셈 */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const page=T('v1129.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const SEED=()=>{ S.consent={date:today()}; S.onb="done"; S.persist="na"; S.stageMode="auto"; S.profile={...S.profile,height:"174",weight:"63",age:"27",sex:"M"}; save(); };
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
  await p.route(/^https?:/, r=>r.fulfill({body:''}));
  const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
  await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready(); await p.waitForTimeout(150);

  console.log("== 1 '경고'는 한 줄, 누르면 목록 화면");
  {const r=await p.evaluate(()=>{S.profile.meds=[]; S.profile.medOther=""; SCR=null; S.tab="me"; render();
      const row=document.querySelector('#main [data-act=openScr][data-v=set-warn]'); const o={rows:document.querySelectorAll('#main [data-v=set-warn]').length, inline:document.querySelectorAll('#main .wrow,#main .warn-list').length, tag:[...(row?.querySelectorAll('.wtag')||[])].map(x=>x.textContent).join('|'), txt:row?.textContent};
      if(row) row.click(); o.scr=SCR?.name; o.items=document.querySelectorAll('#main .warn-list .wrow').length; o.title=document.body.innerText.includes("경고"); return o});
    need(r.rows===1&&r.inline===0&&/경고/.test(r.txt),`내 정보에는 경고 한 줄만, 펼친 목록 없음 (${JSON.stringify(r)})`);
    need(r.tag==="약 입력 안 함",`해당하는 경고 꼬리표가 줄에 남음 (${r.tag})`);
    need(r.scr==="set-warn"&&r.items===6,`누르면 경고 6가지 화면(22차) (${r.scr}, ${r.items})`)}

  console.log('== 2 아침·점심·저녁·간식, 간식은 먹고 싶을 때');
  {const r=await p.evaluate(()=>{S.plan=null; S.swaps={}; SCR=null; S.tab="plan"; render(); const d=S.plan.days[0];
      const rows=[...document.querySelectorAll('#main .meals .mrow')].map(x=>x.querySelector('.slot')?.textContent);
      const snRow=document.querySelector('#main .mrow[data-k="3"] small')?.textContent||"";
      const sideOnMeals=S.plan.days.flatMap(x=>x.meals.slice(0,3)).filter(m=>m.side&&!m.caAdd).length;
      const snackIds=new Set(TPL.S.map(m=>m.key)); const allSnack=S.plan.days.every(x=>x.meals.length===4&&x.meals[3].snack&&snackIds.has(x.meals[3].key));
      SCR={name:"meal",k:3}; render(); const sheet=document.querySelector('#main').innerText; SCR=null; render();
      return {slots:d.meals.map(m=>m.slot),rows,snRow,sideOnMeals,allSnack,sheet:/간식은 시간과 상관없이 먹고 싶을 때 먹습니다/.test(sheet)}});
    need(JSON.stringify(r.slots)==='["아침","점심","저녁","간식"]'&&JSON.stringify(r.rows)===JSON.stringify(r.slots),`네 칸 (${r.rows})`);
    need(r.allSnack,'7일 모두 넷째 칸은 간식 목록에서 고른 간식 하나');
    need(r.sideOnMeals===0,`세 끼에 곁들임이 붙지 않음(칼슘 보충 우유 말고) (${r.sideOnMeals}끼)`);
    need(/^먹고 싶을 때 · /.test(r.snRow),`간식 줄에 '먹고 싶을 때'(25차: '하루 한 번'은 뺌) (${r.snRow})`);
    need(r.sheet,'간식 상세에 시간과 상관없이 먹고 싶을 때 드시라는 안내')}

  console.log('== 3 칼슘이 모자란 날만 저녁에 우유 한 컵');
  {const r=await p.evaluate(()=>{const out=[]; for(const [sex,age,w] of [["M","27","63"],["F","45","50"],["M","60","85"]]) for(const st of [1,2,3]){
        S.profile={...S.profile,sex,age,weight:w,lactose:false}; S.stageMode=st; S.swaps={}; const P=samplePlan(), tg=targets();
        for(const d of P.days){const D=d.meals[2]; const all=totals(d.meals.flatMap(m=>m.items)).ca; const cup=D.caAdd?D.items[D.items.length-1]:null;
          out.push({cup:!!D.caAdd, before:cup?all-totals([cup]).ca:all, tg:tg.ca, name:D.side||"", id:cup?.[0]||""})}}
      S.profile={...S.profile,lactose:true}; S.stageMode=2; S.swaps={}; const L=samplePlan().days.map(d=>d.meals[2]).filter(m=>m.caAdd).map(m=>m.items[m.items.length-1][0]);
      S.profile={...S.profile,lactose:false,sex:"M",age:"27",weight:"63"}; S.stageMode="auto"; S.plan=null; return {out,L}});
    const cups=r.out.filter(x=>x.cup), wrong=cups.filter(x=>x.before>=x.tg), missed=r.out.filter(x=>!x.cup&&x.before<x.tg*0.9);   // 우유는 양 조절 전 칼슘으로 정해, 양 조절로 조금 늘어 90%를 넘는 날은 있음
    need(cups.length>0&&wrong.length===0,`우유를 붙인 날은 모두 우유 없이 칼슘이 권장섭취량 미만 (${cups.length}일 중 잘못 ${wrong.length})`);
    need(missed.length<=r.out.length*0.05,`90% 미만인데 우유가 없는 날(나트륨 상한 때문)은 드묾 (${missed.length}/${r.out.length})`);
    need(cups.every(x=>x.name===`${({milk:"우유",lf_milk:"락토프리 우유",soy_milk:"두유"})[x.id]} 한 컵`),'저녁 줄에 붙인 음료 이름 한 컵');
    need(r.L.length>0&&!r.L.includes("milk"),`유당불내증이면 우유 대신 락토프리 우유·두유 (${[...new Set(r.L)]})`)}

  console.log('== 4 간식 바꾸기 저장, 끼니 표시는 세 끼');
  {const r=await p.evaluate(()=>{S.plan=null; S.swaps={}; render(); const before=S.plan.days[0].meals[3].title; const ok=swapMeal(0,3); const after=S.plan.days[0].meals[3];
      const n=normalizeState(JSON.parse(JSON.stringify(S))); const kept=n.swaps[`${today()}|3`]===S.swaps[`${today()}|3`];
      setAte(today(),"간식",true,{title:after.title,items:after.items}); S.tab="plan"; SCR=null; render(); const task=[...document.querySelectorAll('#main *')].map(x=>x.textContent).find(t=>/^'먹음'·'안 먹음'을 표시한 끼니 \d\/\d$/.test(t.trim()));
      setAte(today(),"간식",false); delete S.swaps[`${today()}|3`]; S.plan=samplePlan(); save();
      return {before,after:after.title,snack:after.snack,ok,kept,task}});
    need(r.ok&&r.after!==r.before&&r.snack,`간식도 다른 간식으로 바꿈 (${r.before} → ${r.after})`);
    need(r.kept,"바꾼 간식('날짜|3')이 불러오기 검사에서 지워지지 않음");
    need(/표시한 끼니 0\/3$/.test(r.task||""),`간식만 먹음으로 표시해도 '끼니 표시'는 세 끼 기준 0/3 (${r.task})`)}

  await ctx.close(); await b.close();
  console.log(F.length?`\n실패 ${F.length}건`:'\n모두 통과'); process.exit(F.length?1:0);
})().catch(e=>{console.error(e); process.exit(1)});
