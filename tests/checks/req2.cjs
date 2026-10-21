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

/* 수정 요청서 v2(2026-10-20)의 항목을 고친 뒤 그대로 유지되는지 확인한다. 항목 번호는 요청서의 번호.
   실제 앱처럼 body 여백을 지우지 않은 페이지(raw)에서 본다. */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const BODY=fs.readFileSync(APP,'utf8');
const page=T('req2.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+BODY+'</body></html>');
const SEED=()=>{ S.consent={date:today()}; S.onb="done"; S.stageMode="3"; save(); };
(async()=>{
  const b=await chromium.launch();
  const open=async(opt={})=>{const ctx=await b.newContext({viewport:{width:opt.w||390,height:opt.h||844},isMobile:!opt.pc,hasTouch:!opt.pc}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready(); await p.waitForTimeout(150); return p};

  console.log('== 항목 7 외식 판정 입력: 예시 한 줄·쉼표 안내');
  {const p=await open();
    const r=await p.evaluate(()=>{S.tab="food"; S.foodSub="menu"; MJ={step:"idle",items:[],results:[],err:"",text:""}; SCR=null; render();
      const ta=document.querySelector('#mjText'); const lab=ta.closest('label').textContent;
      const ph=ta.getAttribute('placeholder')||"";
      // 쉼표 예시를 그대로 넣으면 메뉴 2개
      ta.value="연어 포케, 크림 파스타"; ta.dispatchEvent(new Event('input',{bubbles:true})); mjFromText();
      const two=MJ.items.map(i=>i.name);
      // 빈 입력 오류 문구
      MJ={step:"idle",items:[],results:[],err:"",text:""}; render(); document.querySelector('#mjText').value=""; mjFromText();
      return {lab,ph,two,err:MJ.err}});
    need(r.ph==="예시: 연어 포케, 크림 파스타",`입력 안내 글자는 한 줄 '예시: 연어 포케, 크림 파스타' (${JSON.stringify(r.ph)})`);
    need(!/\n/.test(r.ph),'입력 안내 글자에 줄바꿈이 없음');
    need(!/한 줄에 하나/.test(r.lab)&&/쉼표/.test(r.lab),`라벨이 쉼표 입력을 설명 (${r.lab.trim()})`);
    need(!/한 줄에 하나/.test(r.err)&&/쉼표/.test(r.err),`빈 입력 오류 문구도 쉼표 입력을 설명 (${r.err})`);
    need(r.two.join('|')==="연어 포케|크림 파스타",`'연어 포케, 크림 파스타' → 메뉴 2개 (${r.two.join('|')})`);
    await p.context().close()}

  console.log('== 항목 10 라벨: 값이 줄 끝에서 갈라지지 않음(식성·예산)');
  {for(const w of [320,360,412,700]){
    const p=await open({w, pc:w>=700});
    const r=await p.evaluate(()=>{SCR=null; S.profile.budgetMonth=""; openScr("set-diet");
      const b=document.getElementById("p_budgetTier"); const wrap=b.parentElement;
      // 라벨('지금:')의 마지막 글자와 값의 첫 글자가 같은 줄(top이 같음)인지
      const tn=[...wrap.parentElement.childNodes].filter(n=>n.nodeType===3||n===wrap).map(n=>n===wrap?n:n);
      const rg=document.createRange(); rg.selectNodeContents(wrap); const rs=[...rg.getClientRects()];
      const lines=new Set(rs.map(x=>Math.round(x.top)));
      return {ws:getComputedStyle(wrap).display, tag:wrap.tagName, lines:lines.size, txt:wrap.textContent}});
    need(r.ws==="inline-block"&&/^지금:/.test(r.txt),`폭 ${w}px '지금: 값'이 한 덩어리(inline-block) (${r.tag} ${r.ws} "${r.txt}")`);
    need(r.lines===1,`폭 ${w}px '지금: 값'이 한 줄 안에 있음 (줄 ${r.lines})`);
    await p.context().close()}}

  console.log('== 항목 10·5 묶음(.nb)이 큰 글자·좁은 화면에서도 가로로 넘치지 않음');
  {const p=await open({w:320});
    const r=await p.evaluate(async()=>{document.documentElement.style.fontSize='200%'; const out=[];
      for(const [n,fn] of [["set-diet",()=>{S.profile.budgetMonth=""; openScr("set-diet")}],["set-stage",()=>{S.stageMode="auto"; openScr("set-stage")}],["home",()=>{SCR=null; S.tab="plan"; render()}],["meal",()=>{SCR=null; S.tab="plan"; render(); openScr("meal",{k:0})}]]){
        SCR=null; fn(); await new Promise(r=>setTimeout(r,60)); const W=document.documentElement.clientWidth; const nb=[...document.querySelectorAll('.nb')];
        out.push([n,nb.length,nb.filter(e=>{const r=e.getBoundingClientRect(); return r.right>W+1||r.left<-1}).length,document.documentElement.scrollWidth<=W])}
      return out});
    for(const [n,cnt,bad,ok] of r) need(bad===0&&ok,`글자 200%·320px ${n}: 묶음 ${cnt}개 중 화면 밖으로 나간 것 ${bad}개, 가로 스크롤 ${ok?'없음':'있음'}`);
    await p.context().close()}

  console.log('== 항목 3 끼니 상세에서 위쪽 알림이 화면을 덮지 않음');
  {const p=await open();
    const r=await p.evaluate(()=>{SCR=null; S.tab="plan"; render(); openScr("meal",{k:1});
      const pushed=document.body.classList.contains('pushed');
      toast("점심을 먹었다고 기록했습니다",{top:true,ms:60000});
      const t=document.querySelector('#toasts .toast'); const box=document.getElementById('toasts'); const cs=getComputedStyle(box);
      const h=t.getBoundingClientRect().height, bh=box.getBoundingClientRect().height;
      return {pushed,h:Math.round(h),bh:Math.round(bh),top:cs.top,bottom:cs.bottom}});
    need(r.pushed,'끼니 상세 화면(body.pushed)에서 시험함');
    need(r.h<=80,`위쪽 알림 높이 ${r.h}px ≤ 80px(정상 약 52px)`);
    need(r.bh<=100,`알림 상자(.toasts) 높이 ${r.bh}px ≤ 100px (위/아래가 동시에 걸려 늘어나지 않음: top ${r.top}, bottom ${r.bottom})`);
    // 아래 알림은 그대로 메뉴·버튼 위
    const r2=await p.evaluate(()=>{toast("저장했습니다",{ms:60000}); const box=document.getElementById('toasts'); const cs=getComputedStyle(box); const t=box.querySelector('.toast').getBoundingClientRect();
      return {top:cs.top, h:Math.round(t.height), bottomGap:Math.round(innerHeight-t.bottom)}});
    need(r2.h<=80&&r2.bottomGap>=90,`아래 알림은 그대로 아래쪽에 정상 크기 (높이 ${r2.h}, 아래 간격 ${r2.bottomGap})`);
    await p.context().close()}

  console.log('== 항목 4 알림 글자가 알약 가운데에 오고 좌우 여백이 같음');
  {for(const w of [320,360,700]){
    const p=await open({w, pc:w>=700});
    const r=await p.evaluate(()=>{
      const one=(msg,opt)=>{toast(msg,Object.assign({ms:60000},opt||{})); const t=document.querySelector('#toasts .toast'); const m=t.querySelector('.t-msg');
        const rg=document.createRange(); rg.selectNodeContents(m); const a=rg.getBoundingClientRect(), tr=t.getBoundingClientRect(), g=t.querySelector('.t-btns').getBoundingClientRect();
        const mid=(a.left+a.right)/2;
        // 동작 버튼이 없으면 알약 전체의 가운데, 있으면 글자 칸(버튼 묶음 왼쪽)의 가운데
        const mb=m.getBoundingClientRect(); const ref=t.classList.contains('has-act')?(mb.left+mb.right)/2:(tr.left+tr.right)/2;
        const bs=[...t.querySelectorAll('button')].map(b=>[Math.round(b.getBoundingClientRect().width),Math.round(b.getBoundingClientRect().height)]);
        return {d:Math.round(Math.abs(mid-ref)*10)/10, bs, h:Math.round(tr.height), over:tr.right>innerWidth+0.5||tr.left<-0.5}};
      return {ate:one("점심을 먹었다고 기록했습니다",{top:true}), skip:one("안 먹은 끼니로 표시했습니다",{top:true}),
        undo:one("먹은 기록을 지웠습니다",{act:{label:"되돌리기",fn(){}}}),
        long:one("안 먹은 끼니로 표시하고 먹은 기록과 평가를 지웠습니다",{act:{label:"되돌리기",fn(){}}})}});
    for(const k of ["ate","skip","undo","long"]){const v=r[k];
      need(v.d<=1.5,`폭 ${w}px ${k}: 글자 가운데가 기준 가운데와 ${v.d}px 차이 (≤1.5px)`);
      need(v.bs.every(x=>x[0]>=44&&x[1]>=44),`폭 ${w}px ${k}: 버튼 터치 영역 44×44px 이상 유지 (${JSON.stringify(v.bs)})`);
      need(!v.over,`폭 ${w}px ${k}: 알림이 화면 밖으로 나가지 않음`)}
    need(r.ate.h<=60&&r.skip.h<=60,`폭 ${w}px 한 줄 알림은 한 줄 높이 (${r.ate.h}, ${r.skip.h}px ≤ 60)`);
    need(r.undo.h<=100,`폭 ${w}px 되돌리기 알림이 짧은 문장을 3줄로 꺾지 않음 (높이 ${r.undo.h}px ≤ 100)`);
    await p.context().close()}}

  console.log('== 항목 2 홈 맨 아래 안내 글이 모두 가운데 정렬');
  {for(const w of [360,700]){
    const p=await open({w, pc:w>=700});
    const r=await p.evaluate(()=>{SCR=null; S.tab="plan"; render();
      const v=document.querySelector('#main .view'); const notes=[...v.querySelectorAll(':scope > .plan-note, :scope > .foot-note')];
      const vr=v.getBoundingClientRect();
      return notes.map(e=>{const rg=document.createRange(); rg.selectNodeContents(e); const rc=[...rg.getClientRects()].filter(x=>x.width>2);
        const L=Math.min(...rc.map(x=>x.left)), R=Math.max(...rc.map(x=>x.right)); const cs=getComputedStyle(e);
        // 줄마다 가운데가 같은 곳(글 덩어리의 가운데가 칸의 가운데)
        return {cls:e.className, ta:cs.textAlign, fs:cs.fontSize, lh:cs.lineHeight, ml:Math.round(e.getBoundingClientRect().left-vr.left), mr:Math.round(vr.right-e.getBoundingClientRect().right), off:Math.round(Math.abs((L+R)/2-(vr.left+vr.right)/2)*10)/10}})});
    need(r.length===2,`폭 ${w}px 맨 아래 안내 글 2개(plan-note·foot-note)가 있음 (${r.map(x=>x.cls).join(' | ')})`);
    for(const n of r){need(n.ta==='center',`폭 ${w}px ${n.cls}: 가운데 정렬 (${n.ta})`); need(n.off<=3,`폭 ${w}px ${n.cls}: 글 덩어리 가운데가 화면 가운데에서 ${n.off}px (≤3)`)}
    if(r.length===2){need(r[0].fs===r[1].fs&&r[0].lh===r[1].lh,`폭 ${w}px 두 안내 글의 글자 크기·줄 간격이 같음 (${r[0].fs}/${r[0].lh}, ${r[1].fs}/${r[1].lh})`);
      need(r[0].ml===r[1].ml&&r[0].mr===r[1].mr,`폭 ${w}px 두 안내 글의 좌우 여백이 같음 (${r[0].ml}/${r[0].mr}, ${r[1].ml}/${r[1].mr})`)}
    await p.context().close()}}

  console.log('== 항목 1 홈 순서: 머리 띠 → 날짜 띠 → 끼니 → 나머지');
  {for(const [w,h] of [[360,740],[412,844],[700,900]]){
    const p=await open({w,h, pc:w>=700});
    const r=await p.evaluate(()=>{SCR=null; S.tab="plan";
      const order=()=>{const top=s=>{const e=document.querySelector(s); return e?Math.round(e.getBoundingClientRect().top+scrollY):-1};
        return {hero:top('#main .view > .hero:not(.hero-days), #main .view > .ridge, #main .view > :first-child'), days:top('.hero-days'), meals:top('#meals'), list:top('.list.meals'), tasks:top('.tasks'), tiles:top('.tiles'), sum:top('.sumline'), vh:innerHeight}};
      S.selDay=0; render(); const today=order(); const ids=[...document.querySelectorAll('.hero-days .day')].length;
      S.selDay=2; render(); const other=order(); S.selDay=0; render();
      return {today,other,ids}});
    for(const [k,o] of [["오늘",r.today],["다른 날",r.other]]){
      need(o.hero>=0&&o.days>o.hero&&o.meals>o.days&&o.list>o.meals,`폭 ${w}px ${k}: 머리 띠(${o.hero}) < 날짜 띠(${o.days}) < 끼니 제목(${o.meals}) < 끼니 목록(${o.list})`);
      need(o.tiles>o.list&&o.sum>o.tiles&&(o.tasks<0||o.tasks>o.list),`폭 ${w}px ${k}: 끼니 아래 순서는 그대로(바로 가기 ${o.tiles}, 영양 요약 ${o.sum})`)}
    need(r.ids>=7,`폭 ${w}px 날짜 띠에 날짜 ${r.ids}개`);
    need(r.today.list<r.today.vh-120,`폭 ${w}x${h} 첫 화면 안에 첫 끼니 카드가 보임 (끼니 목록 위치 ${r.today.list} < ${r.today.vh-120})`);
    await p.context().close()}}

  console.log('== 항목 6 외식 판정 결과: 걸린 말별 이유 줄(앱에 이미 있는 문장만)');
  {const p=await open();
    const r=await p.evaluate(()=>{
      const judge=names=>{S.tab="food"; S.foodSub="menu"; MJ={step:"confirm",err:"",kind:"text",items:names.map(n=>({name:n,ingr:[],cook:"",conf:"user"})),results:[],text:""}; render(); mjJudge();
        return MJ.results.map(x=>({name:x.name,level:x.level,lines:x.lines||[],refs:x.refs,food:x.food}))};
      const R=judge(["새우 샐러드","삼겹살 구이","튀김 우동","소시지 야채볶음","크림 파스타","흰쌀밥","라면"]);
      const dom=[...document.querySelectorAll('#main .jrow')].map(row=>({name:row.querySelector('b').textContent,ps:[...row.querySelectorAll('.why-lines p')].map(e=>({t:e.textContent,c:e.className}))}));
      // 모든 줄은 앱에 이미 있는 문장이어야 한다: ruleCheck의 이유, 아래 이유 문장 상수, 음식 목록 설명, 사실 그대로 적은 '걸린 말 없음'뿐
      const allowed=new Set(["붉은 고기는 줄이도록 권고(IOIBD·ECCO)","기름진 음식이라 소량만(길병원: 기름진 음식은 증상 악화 음식)","가스 유발 성분(FODMAP)이 많아 가스·복부팽만을 늘릴 수 있음",GLOSS.lactose[1],...AVOID_TAG.map(x=>x[1])]);   // 앞의 세 문장은 foodStatus가 이미 쓰던 문장 그대로
      const FS=new Set(); for(const f of Object.values(FOOD)) for(const x of foodStatus(f).reasons) FS.add(`${f.name}: ${x}`);   // 종류가 많은 메뉴는 가장 엄격한 후보 음식의 판정 이유를 쓴다
      const known=(it,l)=>{const rc=ruleCheck(it).reasons; if(rc.includes(l)||FS.has(l)) return true; if(/^걸린 말 없음: /.test(l)) return true;
        const i=l.indexOf(": "); if(i<0) return false; const rest=l.slice(i+2); if(allowed.has(rest)) return true;
        return Object.values(FOOD).some(f=>f.why&&l===`${f.name}: ${f.why}`)};
      const names=Object.values(FOOD).slice(0,120).map(f=>f.name).concat(["새우 샐러드","삼겹살 구이","튀김 우동","소시지 야채볶음","연어 포케","라면","아무말대잔치"]);
      const bad=[]; const res=judge(names); for(const x of res) for(const l of (x.lines||[])) if(!known({name:x.name,ingr:[],cook:""},l)) bad.push(x.name+" → "+l);
      const empty=res.filter(x=>!x.lines.length).map(x=>x.name);
      // 다시 판정(mjRecheck): 알레르기를 등록하면 이유 줄에도 알레르기가 나온다
      judge(["새우 샐러드"]); S.profile.allergies=["shrimp"]; save(); mjRecheck();
      const al=MJ.results[0]; const alLines=(al.lines||[]).join("|"), alLv=al.level; S.profile.allergies=[]; save();
      return {R,dom,bad,empty,n:res.length,alLines,alLv,broad:res.find(x=>x.name==='칼국수')}});
    const by=n=>r.R.find(x=>x.name===n), dm=n=>r.dom.find(x=>x.name===n);
    const L=n=>(by(n)?by(n).lines.join(" | "):"");
    need(by("새우 샐러드").lines.length===1&&/^걸린 말 없음: /.test(by("새우 샐러드").lines[0])&&by("새우 샐러드").level==="caution",`목록에 없고 걸린 낱말도 없으면 지어내지 않고 사실대로 적음, 판정은 주의 그대로 (${L("새우 샐러드")} / ${by("새우 샐러드").level})`);
    need(/^삼겹: 붉은 고기는 줄이도록 권고\(IOIBD·ECCO\)$/.test(by("삼겹살 구이").lines[0])&&by("삼겹살 구이").refs.includes(3),`삼겹살 구이 → '삼겹: 이유' + 근거 번호 3 (${L("삼겹살 구이")} / ${by("삼겹살 구이").refs})`);
    need(/^튀김: 기름진 음식이라 소량만\(길병원/.test(by("튀김 우동").lines[0])&&by("튀김 우동").refs.includes(39),`튀김 우동 → '튀김: 이유' + 근거 번호 39 (${L("튀김 우동")})`);
    need(/^소시지: .*가공육/.test(by("소시지 야채볶음").lines[0]),`소시지 야채볶음 → '소시지: 이유' (${L("소시지 야채볶음")})`);
    need(by("크림 파스타").lines.length===2&&/단계부터 권장/.test(by("크림 파스타").lines[0])&&/크림소스는 생크림/.test(by("크림 파스타").lines[1]),`목록 음식이 '단계부터 권장'뿐이면 음식 목록의 설명을 덧붙임 (${L("크림 파스타")})`);
    need(by("흰쌀밥").level==="ok"&&by("흰쌀밥").lines.length===1&&/흰쌀밥: /.test(by("흰쌀밥").lines[0]),`'좋음'에도 짧은 이유 한 줄 (${L("흰쌀밥")})`);
    need(by("삼겹살 구이").level==="caution"&&by("소시지 야채볶음").level==="avoid"&&by("라면").level==="avoid"&&by("크림 파스타").level==="later"&&by("흰쌀밥").level==="ok",`판정 단계는 그대로 (삼겹살 ${by("삼겹살 구이").level}, 소시지 ${by("소시지 야채볶음").level}, 라면 ${by("라면").level}, 크림 파스타 ${by("크림 파스타").level}, 흰쌀밥 ${by("흰쌀밥").level})`);
    need(dm("삼겹살 구이")&&dm("삼겹살 구이").ps.length===1&&dm("삼겹살 구이").ps[0].c==="warn-t",`카드에 이유 줄이 나옴(.why-lines p, 주의 색) (${JSON.stringify(dm("삼겹살 구이"))})`);
    need(dm("흰쌀밥")&&dm("흰쌀밥").ps.length===1&&dm("흰쌀밥").ps[0].c==="hint",`'좋음' 이유 줄은 중립 글씨(hint) (${JSON.stringify(dm("흰쌀밥"))})`);
    need(r.bad.length===0,`모든 이유 줄이 앱에 이미 있는 문장에서 나옴, ${r.n}개 메뉴 검사${r.bad.length?" 어긋남: "+r.bad.slice(0,3).join(" ; "):""}`);
    need(r.broad&&r.broad.lines.length>=1&&/^바지락칼국수: /.test(r.broad.lines[0])&&r.broad.level==='later',`종류가 많은 메뉴(칼국수)는 가장 엄격한 후보의 이유를 보임 (${r.broad&&r.broad.lines.join(' | ')})`);
    need(r.empty.length===0,`이유 줄이 비는 메뉴가 없음${r.empty.length?" ("+r.empty.slice(0,5).join(", ")+")":""}`);
    need(r.alLv==="ban"&&/알레르기/.test(r.alLines),`다시 판정 때 알레르기 등록이 이유 줄에 나오고 절대 금지로 바뀜 (${r.alLv}: ${r.alLines})`);
    await p.context().close()}

  await b.close();
  if(F.length){console.log('\nFAIL '+F.length+'개'); process.exit(1)} console.log('\n검증 통과');
})().catch(e=>{console.error(e); process.exit(1)});
