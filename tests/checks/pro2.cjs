const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}

/* 수정 요청서 v2 항목 11(2026-10-21 원문 확인): 증상 지표를 SCCAI에서 Mayo 환자 보고 2항목(PRO2)·Truelove-Witts로 바꾼 뒤에도
   (1) 점수 정의가 원문(ACG 2025 표 5, STRIDE-II 권고 4, 국내 지침 표 3)과 같고
   (2) 단계 판정이 옛 규칙보다 덜 조심스러워지지 않고(민감도 유지)
   (3) 화면·CSV 어디에도 SCCAI 글자가 보이지 않는지 확인한다
   22차(2026-11-16): PRO2는 식단 단계 판정 안에서만 쓰고 화면·CSV에는 점수를 보이지 않는다(결정 52) */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const BODY=fs.readFileSync(APP,'utf8');
const page=T('pro2.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+BODY+'</body></html>');
const SEED=()=>{ S.consent={date:today()}; S.onb="done"; S.stageMode="auto"; save(); };
(async()=>{
  const b=await chromium.launch();
  const open=async(opt={})=>{const ctx=await b.newContext({viewport:{width:opt.w||390,height:opt.h||844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready(); await p.waitForTimeout(150); return p};

  console.log('== 배변 횟수 점수·혈변 점수(ACG 2025 표 5의 정의)');
  {const p=await open();
    const r=await p.evaluate(()=>{const L=(o)=>({...BLANK_LOG(),...o}); const sf=(d,n,u)=>{S.profile.usualBM=u??""; return pro2(L({day:d,night:n})).sf};
      const br=(o)=>pro2(L(o)).br; const out={};
      out.sf3=[0,3,4,5,6,7,8,12].map(t=>sf(t,0));            // 평소 비움 → 1회 기준(v1.13.0 2번, 예전 3회)
      out.sf3n=sf(2,2);                                       // 낮+밤 합계로 계산
      out.sf1=[1,2,3,4,5,6].map(t=>sf(t,0,1));                // 평소 1회
      out.brs=[br({}),br({blood:1,bloody:1,day:3}),br({blood:3,bloody:2,day:3}),br({blood:2,bloody:2,day:3}),br({blood:2,bloody:1,day:3}),br({blood:0,bloody:1,day:3}),br({blood:2,bloody:2,day:4})];
      S.profile.usualBM=""; const q=pro2(L({day:5,blood:3,bloody:5,quick:true})); out.sum=q.sum; out.assumed=q.assumed; out.base=q.base;
      S.profile.usualBM="2"; out.base2=pro2(L({day:2})).base; out.assumed2=pro2(L({day:2})).assumed;
      S.profile.usualBM="abc"; out.bad=usualBM(); S.profile.usualBM="25"; out.bad2=usualBM(); S.profile.usualBM="0"; out.zero=usualBM(); S.profile.usualBM="";
      return out});
    need(JSON.stringify(r.sf3)==='[0,1,2,2,3,3,3,3]',`평소 비움(1회로 계산, v1.13.0): 합계 0·3·4·5·6·7·8·12회 → 0·1·2·2·3·3·3·3 (${JSON.stringify(r.sf3)})`);
    need(r.sf3n===2,`낮+밤 합계로 계산: 2+2회 → 2점 (${r.sf3n})`);
    need(JSON.stringify(r.sf1)==='[0,1,1,2,2,3]',`평소 1회: 1~6회 → 0·1·1·2·2·3 (${JSON.stringify(r.sf1)})`);
    need(JSON.stringify(r.brs)==='[0,1,2,2,1,1,1]',`혈변: 없음 0·약간 1·대부분 뚜렷 2·가끔 뚜렷이면서 배변 절반 넘게 피 2·절반 미만 1·정도 없이 횟수만 있으면 1·4회 중 2회는 절반이라 '대부분'이 아님 1 (${JSON.stringify(r.brs)})`);
    need(r.sum===4&&r.assumed===true&&r.base===1,`빠른 기록(하루 5회·대부분 뚜렷, 평소 1회 가정) → 배변 2 + 혈변 2 = 4 (합 ${r.sum}, 평소 가정 ${r.assumed}, 기준 ${r.base})`);
    need(r.base2===2&&r.assumed2===false,'평소 2회를 적으면 그 값을 기준으로 씀');
    need(r.bad===null&&r.bad2===null&&r.zero===0,`평소 횟수 입력 검사: 글자·20 초과는 무시, 0은 허용 (${r.bad}/${r.bad2}/${r.zero})`);
    await p.context().close()}

  // 22차(2026-11-16): Truelove-Witts 중증도 칸은 뺐다(병의 상태를 화면에 말하지 않음, 결정 52). 중증 조건은 dangerSignals로 식단 단계에만 쓴다

  console.log('== 단계 판정: 옛 규칙보다 덜 조심스러워지지 않음(민감도 유지)');
  {const p=await open();
    const r=await p.evaluate(()=>{
      // 옛 규칙(v1.12.0 수정 전)을 그대로 복사해 둔 기준
      const old=(l)=>{const d=+l.day||0,n=+l.night||0; const df=d<=3?0:d<=6?1:d<=9?2:3, nf=n===0?0:n<=3?1:2; const sc=df+nf+(+l.urg||0)+(+l.blood||0)+(+l.well||0)+(l.extra?.length||0);
        const bloody=+l.bloody||0,total=d+n,blood=+l.blood||0,urg=+l.urg||0; const dsg=dangerSignals(l);
        if(dsg.severe.length||dsg.urgent.length) return 1; if(sc>=5) return 1; if(bloody>=4) return 1; if(total>=5&&(bloody>0||blood>0)) return 1;
        if(total<=3&&blood===0&&bloody===0&&urg===0&&!dsg.watch.length&&(+l.pain||0)<4) return 3; return 2};
      const res={n:0,lessCautious:0,moreCautious:0,moreNot7:0,ex:[]};
      for(const usual of ["","1","3","5"]){ S.profile.usualBM=usual;
        for(let day=0;day<=12;day++)for(let night=0;night<=4;night++)for(let urg=0;urg<=3;urg++)for(let blood=0;blood<=3;blood++)for(let well=0;well<=4;well++)for(const pain of [0,5]){
          const tot=day+night; for(const bloody of (blood===0?[0,1]:[1,Math.max(1,Math.ceil(tot/2)),Math.max(1,tot)])){
            const l={...BLANK_LOG(),day,night,urg,blood,bloody,well,pain}; const o=old(l), nw=activity(l).stage; res.n++;
            if(nw>o){res.lessCautious++; if(res.ex.length<5) res.ex.push(JSON.stringify({usual,l,o,nw}))}
            if(nw<o){res.moreCautious++; const byUsual=((usual===""?1:+usual)<3&&o===3&&nw===2); /* v1.13.0 2번: 비우면 1회로 계산 */ if(tot<7&&!byUsual) {res.moreNot7++; if(res.ex.length<5) res.ex.push(JSON.stringify({usual,l,o,nw}))}} }}}
      S.profile.usualBM=""; return res});
    need(r.lessCautious===0,`옛 규칙이 더 조심스러웠던 조합이 0개여야 함 (${r.lessCautious}/${r.n}개 조합, 예: ${r.ex.join(' ; ')})`);
    need(r.moreNot7===0,`새 규칙이 더 조심스러워진 조합은 하루 7회 이상 배변(ACG 2025 표 4)이거나, 평소 횟수가 3회 미만(비우면 1회로 계산)이라 '회복' 기준이 더 엄격해진 경우(3→2단계)뿐 (${r.moreCautious}개 중 7회 미만 ${r.moreNot7}개)`);
    await p.context().close()}

  console.log('== 단계 판정: 관해(평소 횟수 기준)와 하루 7회 규칙을 하나씩 확인');
  {const p=await open();
    const r=await p.evaluate(()=>{const L=o=>({...BLANK_LOG(),...o}); const st=(u,o)=>{S.profile.usualBM=u; const x=activity(L(o)).stage; S.profile.usualBM=""; return x};
      return {seven:st("",{day:7}),six:st("",{day:6}),u3:st("3",{day:3}),u1:st("1",{day:3}),u1b:st("1",{day:1}),u5:st("5",{day:4}),five:st("",{day:5,blood:1,bloody:1}),aux:st("",{day:2,urg:2,well:3})}});
    need(r.seven===1&&r.six===2,`하루 7회 이상은 활동기(ACG 2025 표 4), 6회는 아님 (7회 ${r.seven}단계, 6회 ${r.six}단계)`);
    need(r.u3===3&&r.u1===2&&r.u1b===3,`관해 기준: 평소 3회인 사람의 3회는 관해, 평소 1회인 사람의 3회는 관해 아님, 1회는 관해 (${r.u3}/${r.u1}/${r.u1b})`);
    need(r.u5===2,`평소 5회여도 하루 4회는 관해로 올리지 않음(국내 기준 3회 이하 유지) (${r.u5})`);
    need(r.five===1&&r.aux===1,`하루 5회+혈변, 보조 합산 5점은 활동기로 유지 (${r.five}/${r.aux})`);
    await p.context().close()}

  console.log('== 화면·CSV·안내문에 SCCAI 글자가 없음');
  {const p=await open();
    const r=await p.evaluate(()=>{const d=today(); S.logs[d]={...BLANK_LOG(),day:4,night:1,urg:1,blood:1,bloody:1,well:1,pain:2,temp:"36.8",pulse:"72"}; S.logs[addDays(d,-1)]={...BLANK_LOG(),day:2}; S.logs[addDays(d,-2)]={...BLANK_LOG(),day:6,night:2,blood:2,bloody:3,well:2}; save();
      const txt={}; const grab=k=>{txt[k]=document.body.innerText};
      S.tab="home"; SCR=null; render(); grab("home"); S.tab="log"; render(); grab("log");
      openWizard(d); WZ.step=WSTEPS.length-1; render(); grab("wizard"); const w=document.querySelector('.card.result')?.innerText.replace(/\s+/g,' ')||"";
      SCR=null; WZ=null; render(); openScr("set-stage"); grab("stage"); SCR=null; render(); openScr("set-profile"); grab("profile"); SCR=null; render();
      const csv=csvRows("logs"); const hdr=csv[0]; const row=csv.find(x=>x[0]===d); const guide=infoBody("log");
      return {txt,w,hdr,row,sccaiAny:[...Object.entries(txt).filter(([k,v])=>/SCCAI/.test(v)).map(([k])=>k),...(/SCCAI/.test(guide)?['안내문']:[])],csvHas:JSON.stringify(csv).includes("SCCAI"),
        usual:!!document.getElementById("p_usualBM")||/평소 하루 배변 횟수/.test(txt.profile)}});
    need(r.sccaiAny.length===0,`홈·기록·기록 결과·단계 안내·내 정보 화면에 SCCAI 글자 없음 (있는 곳: ${r.sccaiAny.join(',')||'없음'})`);
    // 22차: CSV는 적은 값만(계산한 점수 칸 없음), 홈·기록 결과에도 점수·중증도를 말하지 않음
    need(!r.csvHas&&!r.hdr.some(h=>/점수/.test(h))&&r.hdr[1]==='빠른 기록'&&r.hdr.includes('하루 배변 합계'),`CSV 열에 점수 없음: ${r.hdr.slice(0,8).join(' | ')}`);
    need(r.row&&r.row[r.hdr.indexOf('하루 배변 합계')]===5&&r.row[r.hdr.indexOf('피 섞인 변')]===1,`CSV 값은 적은 그대로: 하루 4+1=5회, 피 섞인 변 1회 (${JSON.stringify(r.row&&r.row.slice(0,9))})`);
    need(!/점수|Truelove|중증도/.test(r.txt.home)&&/배변 5회/.test(r.txt.home),'홈 문장은 적은 값(배변 5회) 그대로, 점수 없음');
    need(!/점수|Truelove|중증도/.test(r.w)&&/식단 단계/.test(r.w),`기록 결과에 점수·중증도 없이 식단 단계 (${r.w.slice(0,200)})`);
    await p.context().close()}

  console.log('== 내 정보에 평소 배변 횟수 입력칸');
  {const p=await open();
    const r=await p.evaluate(()=>{SCR=null; render(); openScr("set-profile"); const el=document.getElementById("p_usualBM"); const t=document.body.innerText; return {has:!!el,label:/평소 하루 배변 횟수/.test(t)}});
    need(r.has&&r.label,`내 정보에 "평소 하루 배변 횟수" 입력칸 (칸 ${r.has}, 문구 ${r.label})`);
    await p.context().close()}

  console.log('== 옛 저장본(평소 배변 횟수 없음)과 저장·불러오기');
  {const p=await open();
    const r=await p.evaluate(()=>{const o=JSON.parse(backupJSON()); delete o.profile.usualBM; const s1=normalizeState(o); const e1=s1.profile.usualBM;
      const o2=JSON.parse(backupJSON()); o2.profile.usualBM="2.4"; const e2=normalizeState(o2).profile.usualBM; const o3=JSON.parse(backupJSON()); o3.profile.usualBM=99; const e3=normalizeState(o3).profile.usualBM;
      const o4=JSON.parse(backupJSON()); o4.profile.usualBM="x"; const e4=normalizeState(o4).profile.usualBM; return {e1,e2,e3,e4}});
    need(r.e1===""&&r.e2===2&&r.e3===""&&r.e4==="",`불러오기: 없음→"", 2.4→2, 99→"", 글자→"" (${JSON.stringify(r)})`);
    await p.context().close()}

  await b.close();
  if(F.length){console.log('\nFAIL '+F.length+'개'); process.exit(1)} console.log('\n검증 통과');
})().catch(e=>{console.error(e); process.exit(1)});
