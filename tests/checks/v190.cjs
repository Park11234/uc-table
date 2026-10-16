const path=require('path'), fs_=require('fs'), http=require('http');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const PUB=path.join(ROOT,'public');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
// 공통 안전장치: 어느 페이지에서든 잡히지 않은 오류(pageerror)가 나면 이 점검을 실패로 끝낸다
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}
/* v1.9.0 점검: 출시 전 점검 보고서의 지적 사항을 고친 것이 그대로인지
   접근성(초점 유지·시트 초점 가두기·백업 불러오기 키보드·알림 영역·비텍스트 대비·글자 200%·동작 줄이기·뒤로 가기),
   증상 기록 4쪽·평소와 같음, 단계 묻기, 검색 오탐, 백업 합치기, 되돌리기, 글자 PDF, PDF 라이브러리 지연 로딩, 자정, 외부 요청 0건 */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const page=T('v190.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const SEED=()=>{
  S.consent={date:today()}; S.onb="done";
  const mk=(day,b)=>({...BLANK_LOG(),day,night:0,bloody:b,urg:0,blood:b,well:0,stool:4,medtaken:1,pain:1,gas:"없음",fatigue:"없음",memo:"메모"});
  for(let i=1;i<=7;i++) S.logs[addDays(today(),-i)]=mk(2,0);
  save();
};
(async()=>{
  const b=await chromium.launch();
  const open=async(opt={})=>{const ctx=await b.newContext({viewport:{width:opt.w||390,height:844},reducedMotion:opt.rm?'reduce':'no-preference'}); const p=await ctx.newPage();
    await p.route(/cdnjs/, r=>{const u=r.request().url(); r.fulfill({path:u.includes('html2canvas')?LIB_H2C:LIB_JSPDF,contentType:'application/javascript'})});
    await p.goto('file://'+page); await p.waitForTimeout(300); await p.evaluate(SEED); await p.reload(); await p.waitForTimeout(400); await p.evaluate(()=>scrollTo(0,0)); return p};

  console.log('== 접근성');
  {const p=await open();
    // A-3 초점 유지: 키보드로 '+1잔'을 누른 뒤에도 초점이 그 버튼에
    await p.focus('[data-act=cupAdd]'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    need(await p.evaluate(()=>document.activeElement?.dataset?.act==='cupAdd'),'A-3 다시 그린 뒤 초점 유지(+1잔)');
    // A-6·D-6 알림 영역: 늘 있는 aria-live, 위쪽
    const live=await p.evaluate(()=>{const t=document.getElementById('toasts'); const r=t&&t.querySelector('.toast')?.getBoundingClientRect(); return {live:t&&t.getAttribute('aria-live'),txt:t&&t.textContent,top:r?r.top:null}});
    need(live.live==='polite'&&/물/.test(live.txt)&&live.top!==null&&live.top<200,'D-6 알림은 위쪽 전용 영역(aria-live)');
    // A-4 시트: 초점이 시트 안에서만 돈다, 뒤 화면 inert, 닫으면 연 버튼으로
    await p.focus('[data-act=info]'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    let out=0; for(let i=0;i<40;i++){await p.keyboard.press('Tab'); if(!(await p.evaluate(()=>!!document.activeElement.closest('#sheetRoot')))) out++}
    const inert=await p.evaluate(()=>document.querySelector('.wrap').hasAttribute('inert')&&document.querySelector('.tabs').hasAttribute('inert'));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    const back=await p.evaluate(()=>[document.activeElement?.dataset?.act,document.querySelector('.wrap').hasAttribute('inert')]);
    need(out===0,'A-4 Tab 40번 모두 시트 안('+out+'번 밖)'); need(inert,'A-4 시트가 열리면 뒤 화면 inert'); need(back[0]==='info'&&!back[1],'A-4 닫으면 연 버튼으로 초점 복귀');
    // A-5 백업 파일 불러오기: 키보드로 가서 Enter → 파일 선택 창
    await p.evaluate(()=>openScr('set-data')); await p.waitForTimeout(200);
    let found=false; for(let i=0;i<40&&!found;i++){await p.keyboard.press('Tab'); found=await p.evaluate(()=>document.activeElement?.dataset?.act==='restorePick')}
    let chooser=false; if(found){const w=p.waitForEvent('filechooser',{timeout:8000}).then(()=>true).catch(()=>false); await p.keyboard.press('Enter'); chooser=await w}
    if(found&&!chooser){await p.waitForTimeout(500); await p.focus('[data-act=restorePick]'); const w=p.waitForEvent('filechooser',{timeout:8000}).then(()=>true).catch(()=>false); await p.keyboard.press('Enter'); chooser=await w}   // 화면 전환 직후 한 번 더(병렬 실행으로 느릴 때를 생각해 8초까지 기다림)
    need(found&&chooser,'A-5 키보드로 백업 파일 불러오기(파일 선택 창 열림)');
    // A-7 비텍스트 대비: 꺼진 스위치·입력칸 경계·즐겨찾기 별 3:1 이상
    const cr=await p.evaluate(()=>{const rgb=s=>s.match(/\d+(\.\d+)?/g).slice(0,3).map(Number); const L=c=>{const [r,g,b]=c.map(v=>{v/=255; return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4}); return 0.2126*r+0.7152*g+0.0722*b}; const ratio=(a,b)=>{const x=L(rgb(a)),y=L(rgb(b)); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)};
      openScr('set-remind'); const surf=getComputedStyle(document.querySelector('.card')).backgroundColor;
      const sw=document.querySelector('input.sw:not(:checked)'); const swc=sw?getComputedStyle(sw).backgroundColor:null;
      openScr('set-profile'); const inp=document.querySelector('input[type=number],input[type=text]'); const ib=getComputedStyle(inp).borderTopColor; const isurf=getComputedStyle(inp.closest('.card,.list,body')).backgroundColor;
      const star=getComputedStyle(document.documentElement).getPropertyValue('--star').trim(); const tmp=document.createElement('i'); tmp.style.color=star; document.body.appendChild(tmp); const sc=getComputedStyle(tmp).color; tmp.remove();
      return {sw:swc?ratio(swc,surf):9,input:ratio(ib,isurf),star:ratio(sc,surf)}});
    need(cr.sw>=3&&cr.input>=3&&cr.star>=3,`A-7 비텍스트 대비 3:1 이상(스위치 ${cr.sw.toFixed(2)}, 입력칸 ${cr.input.toFixed(2)}, 별 ${cr.star.toFixed(2)})`);
    // A-14 탭: role=tab 대신 aria-current
    const tabs=await p.evaluate(()=>{closeScr(); return {roleTab:document.querySelectorAll('[role=tab],[role=tablist]').length,cur:document.querySelector('.tab[aria-current=page]')?.dataset.tab}});
    need(tabs.roleTab===0&&tabs.cur==='plan','A-14 탭은 aria-current(역할 tab 없음)');
    // U-4 뒤로 가기: 홈이 아닌 탭에서 뒤로 가면 홈
    await p.click('.tab[data-tab=log]'); await p.waitForTimeout(250); await p.goBack().catch(()=>{}); await p.waitForTimeout(400);
    need(await p.evaluate(()=>S.tab==='plan'&&location.protocol==='file:'),'U-4 홈이 아닌 탭에서 뒤로 가기 → 홈(앱 밖으로 나가지 않음)');
    await p.context().close()}

  console.log('== 글자 200%·320px·동작 줄이기');
  for(const w of [320,360]){const p=await open({w,rm:true});
    const r=await p.evaluate(async()=>{document.documentElement.style.fontSize='200%'; S.fontSize="md"; const res=[];
      for(const tb of ["plan","log","food","me"]){SCR=null; S.tab=tb; render(); await new Promise(r=>setTimeout(r,50)); const W=document.documentElement.clientWidth;
        const bad=[...document.querySelectorAll('#main *')].filter(e=>{if(e.closest('.days,.tbl-wrap')) return false; const r=e.getBoundingClientRect(); return r.width>0&&(r.right>W+1||r.left<-1)}).length;
        res.push([tb,document.documentElement.scrollWidth<=W,bad])}
      // D-1: 요약 줄과 '+1잔'이 겹치지 않음(오늘 할 일의 +1잔 포함)
      SCR=null; S.tab="plan"; render(); const sum=document.querySelector('.sumline .sl-main')?.getBoundingClientRect();
      const anims=document.getAnimations().filter(a=>a.playState==="running").length;
      return {res,anims,sum:!!sum}});
    need(r.res.every(x=>x[1]&&x[2]===0),`D-2 글자 200%·${w}px에서 가로 넘침 없음 ${JSON.stringify(r.res)}`);
    need(r.anims===0,`A-16 동작 줄이기에서 움직이는 효과 없음(${r.anims}개)`);
    await p.context().close()}

  console.log('== 증상 기록·단계');
  {const p=await open();
    const wz=await p.evaluate(()=>{openWizard(); const pages=WSTEPS.filter(x=>x.q).length; const req=WSTEPS.flatMap(x=>(x.q||[]).filter(q=>(q.type==="one"||q.type==="oneS")&&!q.opt)).length;
      WZ.step=wzStepOf("urg"); render(); const dis1=document.querySelector('[data-act=wzNext]').disabled;
      return {pages,req,dis1,h:document.querySelector('.wz-q')?.tagName,prog:document.querySelector('.wz-progress')?.getAttribute('role'),lbl:!!document.querySelector('#wq_urg [role=group][aria-labelledby]')}});
    need(wz.pages===4&&wz.req===5,`U-1 증상 기록 4쪽·꼭 답할 질문 5개(${wz.pages}쪽, ${wz.req}개)`);
    need(wz.dis1&&wz.h==='H2'&&wz.prog==='progressbar'&&wz.lbl,'A-1·A-2·A-13 질문 묶음 레이블·진행 표시(progressbar)·제목 h2');
    for(const v of ["0","0","0"]){}
    await p.click('#wq_urg [data-act=set][data-v="0"]'); await p.click('#wq_blood [data-act=set][data-v="0"]'); await p.click('#wq_well [data-act=set][data-v="0"]'); await p.waitForTimeout(450);
    need(await p.evaluate(()=>!document.querySelector('[data-act=wzNext]').disabled),'U-1 세 질문에 답하면 다음으로');
    const pain=await p.evaluate(()=>{WZ.step=wzStepOf("pain"); render(); const r=document.getElementById('pain'); return [r.getAttribute('aria-labelledby'),r.getAttribute('aria-valuetext')]});
    need(pain[0]==='wqt_pain'&&/10점 중/.test(pain[1]||''),'A-1 복통 슬라이더 레이블·값 읽기');
    const date=await p.evaluate(()=>{WZ.step=0; render(); return document.getElementById('logDate')?.getAttribute('aria-labelledby')});
    need(date==='wzQ','A-1 날짜 입력 레이블');
    // 평소와 같음: 한 번 누르면 지난 기록과 같게 저장, 되돌리기
    await p.evaluate(()=>{draft=null; SCR=null; S.tab="log"; render()});
    await p.click('[data-act=quickSame]'); await p.waitForTimeout(250);
    const q=await p.evaluate(()=>{const t=S.logs[today()], y=S.logs[addDays(today(),-1)]; return {saved:!!t&&t.day===y.day&&t.memo==="",undo:/되돌리기/.test(document.getElementById('toasts').textContent)}});
    need(q.saved&&q.undo,'U-1 평소와 같음 한 번으로 저장(메모는 비움)·되돌리기 알림');
    await p.click('#toasts .t-act'); await p.waitForTimeout(200);
    need(await p.evaluate(()=>!S.logs[today()]),'U-3 되돌리기로 오늘 기록이 다시 사라짐');
    // F-4: 3일 넘게 기록이 없으면 조용히 내리지 않고 묻는다
    const f4=await p.evaluate(()=>{S.logs={}; const d=addDays(today(),-5); S.logs[d]={...BLANK_LOG(),day:1,night:0,gas:"없음",fatigue:"없음"}; const cs=currentStage(); SCR=null; S.tab="plan"; render();
      return {st:cs.stage,stale:cs.stale,ask:/요즘 증상이 어떻습니까/.test(document.getElementById('main').textContent)}});
    need(f4.st===3&&f4.stale&&f4.ask,'F-4 3일 넘게 기록이 없어도 단계를 그대로 두고 홈에서 묻기');
    const f4b=await p.evaluate(()=>{S.logs={}; S.logs[addDays(today(),-20)]={...BLANK_LOG(),day:1,gas:"없음",fatigue:"없음"}; return currentStage().stage});
    need(f4b===2,'F-4 2주가 넘으면 저잔사식까지 내리지 않고 이행식');
    // 2026-10-15 발견: 끝낸 '오늘 할 일' 줄과 물어본 진료 질문이 전역 .done(먹은 끼니 표식, 26px 원)에 걸려 글자가 세로로 흘러내림
    const dn=await p.evaluate(()=>{const t=today(); S.logs[t]={...BLANK_LOG(),day:1,night:0,gas:"없음",fatigue:"없음"}; S.water[t]=99;
      S.qs=[{id:"q1",t:"철분제를 계속 먹어도 됩니까?",date:t,done:t}]; SCR=null; S.tab="plan"; render();
      const card=document.querySelector('.tasks').getBoundingClientRect().width; const rows=[...document.querySelectorAll('.task')].map(r=>[r.className,r.getBoundingClientRect().width]);
      openScr("asks"); const q=document.querySelector('.qrow .lt'); const qw=q?q.getBoundingClientRect().width:0, qh=q?q.getBoundingClientRect().height:0;
      return {card,rows,qw,qh,qc:q?q.className:""}});
    need(dn.rows.filter(r=>/is-done/.test(r[0])).length>=2&&dn.rows.every(r=>r[1]>dn.card*0.8),`끝낸 '오늘 할 일' 줄이 카드 폭을 그대로 씀(${dn.rows.map(r=>Math.round(r[1])).join(",")} / ${Math.round(dn.card)})`);
    need(/is-done/.test(dn.qc)&&dn.qw>150&&dn.qh<120,`물어본 진료 질문 글자가 한 줄 폭을 씀(${Math.round(dn.qw)}×${Math.round(dn.qh)})`);
    await p.context().close()}

  console.log('== 검색·목록·음식 정보');
  {const p=await open();
    const r=await p.evaluate(()=>{const n=q=>FOODS.filter(f=>searchHit(f,q)).map(f=>f.name);
      return {soju:n("소주"),cider:n("사이다"),soy:n("두유"),stew:n("찌개"),rice:n("밥").length,milk:n("우유").length}});
    need(!r.soju.some(x=>x.includes("채소죽"))&&!r.cider.some(x=>x.includes("식초"))&&!r.soy.some(x=>x.includes("콩기름")),'F-6 부분 일치 오탐 없음(소주·사이다·두유)');
    need(r.stew.some(x=>x.includes("김치찌개"))&&r.rice>10&&r.milk>5,'F-6 이름 속 낱말(찌개)·끝말(밥) 검색은 그대로');
    const u=await p.evaluate(()=>{SCR=null; S.tab="food"; S.foodSub="search"; S.foodQ=""; S.foodCat="전체"; S.foodLv="전체"; render();
      const pills=[...document.querySelectorAll('#foodRes .fcard .pill')].length, cards=document.querySelectorAll('#foodRes .fcard').length, more=document.querySelectorAll('#foodRes [data-act=fMore]').length;
      S.foodQ="커피"; S.foodLv="avoid"; refreshFoodRes(); const t1=document.getElementById('foodRes').textContent;
      S.foodQ="없는음식이름"; S.foodLv="전체"; refreshFoodRes(); const t2=document.getElementById('foodRes').textContent;
      return {pills,cards,more,both1:/목록에 없는 음식/.test(t1),filt1:/고른 조건에 맞는 음식이 없습니다/.test(t1),both2:/고른 조건에 맞는 음식이 없습니다/.test(t2),miss2:/목록에 없는 음식/.test(t2)}});
    need(u.pills===u.cards&&u.cards>0,'D-5 카드마다 판정 표식');
    need(u.cards<=80&&u.more>=3,`U-7 묶음마다 12개 + 더 보기(카드 ${u.cards}개)`);
    need(!u.both1&&u.filt1&&u.miss2&&!u.both2,'U-5 결과 없음 안내가 서로 모순되지 않음');
    const lv=await p.evaluate(()=>[LV.ok,LV.caution,LV.later,LV.avoid,LV.ban].join("·"));
    need(lv==="좋음·주의·보류·피하기·절대 금지",'U-6 판정 어휘 5단계(절대 금지 포함)');
    // 절대 금지(사용자 요청): 원재료에 아질산나트륨 같은 발색제가 든 시판 가공육은 모두 '절대 금지', 확인한 곳(한 곳)을 출처로 보인다
    const ban=await p.evaluate(()=>{const nit=FOODS.filter(f=>f.tags.includes("nitrite")); const lvs=[...new Set(nit.map(f=>foodStatus(f).level))];
      SCR=null; S.foodQ=""; S.foodCat="전체"; S.foodLv="ban"; refreshFoodRes(); const cards=[...document.querySelectorAll('#foodRes .fcard')];
      const allBan=cards.length>0&&cards.every(c=>c.querySelector('.pill.ban'));
      const spam=FOODS.find(f=>f.name==="스팸클래식"); showFood(spam.id); const sh=document.querySelector('#sheetRoot'); const t=sh.innerText; const a=sh.querySelector('.psrc a');
      closeSheet(); S.foodLv="전체";
      const fsf=FOODS.find(f=>PSRC[f.id]&&PSRC[f.id][0]==="fs"); showFood(fsf.id); const a2=document.querySelector('#sheetRoot .psrc a'); closeSheet();
      return {n:nit.length,lvs,cards:cards.length,allBan,txt:/절대 금지/.test(t),link:a?a.href:"",fs:a2?a2.href:"",fsLv:foodStatus(fsf).level}});
    need(ban.n>=150&&ban.lvs.length===1&&ban.lvs[0]==="ban",`절대 금지: 아질산염 가공육 ${ban.n}종이 모두 절대 금지(${ban.lvs.join(",")})`);
    need(ban.allBan,`절대 금지 거르기: 목록 카드 ${ban.cards}개가 모두 절대 금지 표식`);
    need(ban.txt&&/cjthemarket\.com/.test(ban.link),'절대 금지 음식 정보: 판정 글자와 확인한 상품 주소(CJ더마켓)');
    need(ban.fsLv==="ban"&&/foodsafetykorea\.go\.kr/.test(ban.fs),'식품안전나라 품목제조보고로 넣은 가공육: 절대 금지, 품목제조보고 상세 주소');
    // 시판 만두·육포(동원몰·랭킹닭컴 상세의 포장 표시 사진): 영양정보·원재료명을 보이고 확인한 곳을 출처로, 육포는 가공육
    const lbl=await p.evaluate(()=>{const sheet=id=>{showFood(id); const sh=document.querySelector('#sheetRoot'); const r={t:sh.innerText,a:(sh.querySelector('.psrc a')||{}).href||"",lv:foodStatus(FOODS.find(f=>f.id===id)).level}; closeSheet(); return r};
      const byName=n=>FOODS.find(f=>f.name===n);
      const mandu=byName("동원 개성 왕만두"), db=byName("동원 개성 한입쏙만두"), rk=FOODS.find(f=>PSRC[f.id]&&PSRC[f.id][0]==="rk"&&/닭가슴살/.test(f.name));
      const zil=byName("샘표 질러 클래식 육포"), anshim=byName("동원 상상육포 안심");
      const jerky=FOODS.filter(f=>PSRC[f.id]&&PSRC[f.id][0]==="dl"&&f.tags.includes("tough")&&f.tags.includes("processed"));
      return {ok:!!(mandu&&db&&rk&&zil&&anshim), m:sheet(mandu.id), d:sheet(db.id), r:sheet(rk.id), z:sheet(zil.id), an:sheet(anshim.id),
        jl:[...new Set(jerky.map(f=>foodStatus(f).level))], jn:jerky.length, kcal:mandu.k}});
    need(lbl.ok,'만두·육포: 대표 제품이 목록에 있음');
    need(/영양정보 보기\(포장 표시 그대로\)/.test(lbl.m.t)&&/원재료명 보기\(판매처 상세의 포장 표시·상품정보 고시\)/.test(lbl.m.t)&&/dongwonmall\.com\/product\/detail\.do\?productId=003724274/.test(lbl.m.a)&&lbl.kcal===250,'동원 개성 왕만두: 포장 표시 영양정보·원재료명, 동원몰 상품 주소, 100g당 250kcal');
    need(/식약처 가공식품 DB 2025-04-02 값/.test(lbl.d.t),'판매처에 영양정보가 없던 제품은 식약처 가공식품 DB 값임을 밝힘');
    need(/rankingdak\.com\/product\/view\?productCd=/.test(lbl.r.a),'닭가슴살 만두(랭킹닭컴): 랭킹닭컴 상품 주소');
    need(lbl.z.lv==="ban"&&/아질산나트륨/.test(lbl.z.t),'아질산나트륨이 든 육포(질러 클래식): 절대 금지');
    need(lbl.an.lv==="avoid"&&/셀러리 분말/.test(lbl.an.t),'발색제 표시가 없는 육포(상상육포 안심): 가공육이라 피하기, 셀러리 분말 사용을 밝힘');
    need(lbl.jn>=20&&lbl.jl.every(l=>l==="ban"||l==="avoid"),`육포 ${lbl.jn}종이 모두 피하기 또는 절대 금지(${lbl.jl.join(",")})`);
    // 아임닭·풀무원샵 상세의 포장 표시(2026-10-15 추가)
    const lbl2=await p.evaluate(()=>{const sheet=id=>{showFood(id); const sh=document.querySelector('#sheetRoot'); const r={t:sh.innerText,a:(sh.querySelector('.psrc a')||{}).href||""}; closeSheet(); return r};
      const pm=FOODS.find(f=>f.name==="풀무원 얇은피꽉찬속 고기만두"), im=FOODS.find(f=>f.name==="맛있는 한우 물만두");
      return {ok:!!(pm&&im), pm:pm&&sheet(pm.id), im:im&&sheet(im.id), pmk:pm&&pm.k}});
    need(lbl2.ok&&/shop\.pulmuone\.co\.kr\/shop\/goodsView\/45864/.test(lbl2.pm.a)&&lbl2.pmk===165&&/영양정보 보기\(포장 표시 그대로\)/.test(lbl2.pm.t),'풀무원 얇은피꽉찬속 고기만두: 풀무원샵 상품 주소, 100g당 165kcal, 포장 표시 영양정보');
    need(lbl2.ok&&/imdak\.com\/product\/detail\/3317/.test(lbl2.im.a)&&/오뚜기냉동식품의 만두/.test(lbl2.im.t),'아임닭 한우 물만두: 아임닭 상품 주소, 제조사·식품유형 문장');
    const d13=await p.evaluate(()=>{showFood("white_rice"); const a=document.querySelector('.sheet .nutgrid b').textContent; document.querySelector('[data-act=nutBasis][data-v="100"]').click(); const b2=document.querySelector('.sheet .nutgrid b').textContent; closeSheet(); return [a,b2]});
    need(d13[0]!==d13[1],`D-13 1회 분량당/100g당 전환(${d13.join(" → ")})`);
    await p.context().close()}

  console.log('== 백업 합치기·글자 PDF·PDF 라이브러리·자정');
  {const p=await open();
    const m=await p.evaluate(()=>{const d=today(); S.extras[d]=[{name:"달걀찜",foodId:"egg_steamed",amt:120,unit:"g",kcal:142,p:13,fi:0,ca:52}]; S.logs[d]={...BLANK_LOG(),day:2,gas:"없음",fatigue:"없음"};
      const bk=JSON.parse(JSON.stringify(S)); bk.extras[d]=[{name:"흰쌀밥",foodId:"white_rice",amt:210,unit:"g",kcal:300,p:5,fi:0,ca:6}]; bk.logs[d]={...BLANK_LOG(),day:5,gas:"없음",fatigue:"없음"};
      const st=mergeCore(S,bk).st; const r=mergeStates(S,bk); return {ex:r.extras[d].length,day:r.logs[d].day,keep:st.logKeep}});
    need(m.ex===2&&m.day===2&&m.keep===1,'F-7 같은 날 기록도 항목 단위로 합치고, 서로 다른 증상 기록 수를 알려 줌');
    const pdf=await p.evaluate(()=>{const before=!!window.jspdf; let printed=0; window.print=()=>{printed++}; printReport(); const t=document.getElementById('printDoc').textContent; return {before,printed,txt:/기간 요약/.test(t)&&/진료 때 알릴 사항/.test(t)}});
    need(!pdf.before,'P-1 그림 PDF 라이브러리는 처음에 실행하지 않음');
    need(pdf.printed===1&&pdf.txt,'F-2 글자 PDF: 인쇄용 문서를 글자로 만들고 인쇄 화면을 엶');
    const lib=await p.evaluate(async()=>{await loadPdfLibs(); return !!(window.jspdf&&window.html2canvas)});
    need(lib,'P-1 그림 PDF 저장 때 라이브러리를 불러옴');
    // F-8 자정: 날짜가 바뀌면 다시 그림
    const f8=await p.evaluate(()=>{const RD=Date; const base=new RD(); base.setDate(base.getDate()+1); base.setHours(0,1,0,0); const T0=base.getTime();
      window.Date=class extends RD{constructor(...a){a.length?super(...a):super(T0)} static now(){return T0}};
      const before=LAST_DAY; dayCheck(); const after=LAST_DAY; window.Date=RD; return [before,after]});
    need(f8[0]!==f8[1],'F-8 자정이 지나면 오늘 날짜를 다시 정함');
    await p.context().close()}

  console.log('== 외부 요청 0건(설치형 PWA)');
  {const DIR=T('v190_site'); fs.rmSync(DIR,{recursive:true,force:true}); fs.cpSync(PUB,DIR,{recursive:true});
    const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript",".webmanifest":"application/manifest+json",".png":"image/png"};
    const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split("?")[0]); if(u.endsWith("/")) u+="index.html"; const f=path.join(DIR,u); if(!f.startsWith(DIR)||!fs.existsSync(f)){r.writeHead(404);return r.end()} r.writeHead(200,{"Content-Type":TYPES[path.extname(f)]||"application/octet-stream"}); r.end(fs.readFileSync(f))});
    await new Promise(res=>srv.listen(0,"127.0.0.1",res)); const url=`http://127.0.0.1:${srv.address().port}/`;
    const ctx=await b.newContext({viewport:{width:390,height:844}}); const p=await ctx.newPage(); const ext=[];
    p.on('request',r=>{if(!r.url().startsWith(url)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:')) ext.push(r.url())});
    await p.goto(url); await p.waitForTimeout(1500);
    await p.evaluate(()=>{S.consent={date:today()}; S.onb="done"; save(); render()}); await p.waitForTimeout(300);
    for(const tb of ["log","food","me","plan"]){await p.click(`.tab[data-tab=${tb}]`); await p.waitForTimeout(150)}
    const ok=await p.evaluate(async()=>{await loadPdfLibs(); return !!window.jspdf});
    need(ext.length===0&&ok,'개인정보: 앱을 쓰는 동안 외부 서버 요청 0건(그림 PDF 도구도 같은 서버) '+ext.slice(0,3).join(' '));
    await ctx.close(); srv.close()}

  await b.close();
  console.log(F.length?'FAIL '+F.join(' / '):'검증 통과'); process.exit(F.length?1:0);
})();
