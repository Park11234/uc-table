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
/* v1.11.0 점검: v1.10.0 검토 보고서(높음 H1~H5, 중간 M1~M11, 낮음 L1~L12)를 고친 것이 그대로인지 화면에서 확인한다. */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const page=T('v1110.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const SEED=()=>{
  S.consent={date:today()}; S.onb="done";
  const mk=(day,b)=>({...BLANK_LOG(),day,night:0,bloody:b,urg:0,blood:b?1:0,well:0,stool:4,medtaken:1,pain:1,memo:""});
  for(let i=2;i<=6;i++) S.logs[addDays(today(),-i)]=mk(2,0);
  save();
};
(async()=>{
  const b=await chromium.launch();
  const open=async(opt={})=>{const ctx=await b.newContext({viewport:{width:opt.w||390,height:opt.h||844},isMobile:!opt.pc,hasTouch:!opt.pc}); if(opt.init) await ctx.addInitScript(opt.init); const p=await ctx.newPage();
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&typeof csvRows==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); await p.waitForTimeout(150); if(!opt.noSeed){await p.evaluate(SEED); await p.waitForTimeout(700); await p.reload(); await ready(); await p.waitForTimeout(200)} p.ready=ready; return p};
  const QUICK=()=>{const d=addDays(today(),-1); S.logs[d]={...BLANK_LOG(),day:6,night:0,urg:1,blood:2,bloody:2,well:0,pain:0,stool:0,medtaken:0,quick:true}; save(); return d};

  console.log('== H2 빠른 기록 표시(목록·PDF·CSV·그래프)');
  {const p=await open();
    const r=await p.evaluate((qs)=>{const d=(new Function('return ('+qs+')()'))(); S.tab="log"; SCR=null; render();
      const row=[...document.querySelectorAll('.hrow')].find(b=>b.dataset.v===d); const rowTxt=row?row.innerText.replace(/\s+/g,' '):"";
      const bl=reportBlocks(); const div=document.createElement('div'); div.innerHTML=bl.blocks.join("");
      const tr=[...div.querySelectorAll('tr')].find(t=>t.innerText.includes(d.slice(5))); const all=div.innerText;
      const csv=csvRows("logs"); const hdr=csv[0]; const rowC=csv.find(x=>x[0]===d);
      const pts=typeof sccaiPts==="function"?sccaiPts(addDays(today(),-13),14):[]; const qp=pts.find(x=>x.d===d);
      return {d,rowTxt,trTxt:tr?tr.innerText.replace(/\s+/g,' '):"",note:/빠른 기록 1일/.test(all),hdr,rowC,qp}},QUICK.toString());
    need(/빠른 기록/.test(r.rowTxt)&&/하루 6회/.test(r.rowTxt)&&!/밤 0회/.test(r.rowTxt)&&!/복통 0/.test(r.rowTxt),`H2 기록 목록: '빠른 기록·하루 6회', 밤·복통 없음 (${r.rowTxt})`);
    need(/빠른/.test(r.trTxt)&&!/6\/0/.test(r.trTxt)&&!/0\/10/.test(r.trTxt),`H2 PDF 표: 빠른 표시, 밤 배변·복통 칸 비움 (${r.trTxt})`);
    need(r.note,'H2 PDF에 빠른 기록 날 수와 점수가 낮을 수 있다는 안내');
    const iT=r.hdr.indexOf("하루 배변 합계"), iD=r.hdr.indexOf("낮 배변"), iN=r.hdr.indexOf("밤 배변");
    need(iT>0&&r.rowC&&r.rowC[iT]===6&&r.rowC[iD]===""&&r.rowC[iN]==="",`H2 CSV: '하루 배변 합계' 6, 낮·밤 칸 비움 (${JSON.stringify(r.rowC&&[r.rowC[iD],r.rowC[iN],r.rowC[iT]])})`);
    need(r.qp&&r.qp.quick===true,'H2 그래프 점에 빠른 기록 표시');
    await p.context().close()}

  console.log('== L6 점수 원 안 글자');
  {const p=await open();
    const r=await p.evaluate(()=>{S.logs[today()]={...BLANK_LOG(),day:3,urg:0,blood:0,quick:true}; save(); S.tab="log"; SCR=null; render();
      return {inCircle:document.querySelector('.today-card .score small')?.textContent||"",tag:!!document.querySelector('.today-card .qtag')}});
    need(r.inCircle==="증상 점수"&&r.tag,`L6 '빠른 기록'은 점수 원 밖 표시 (${r.inCircle}, 표시 ${r.tag})`);
    await p.context().close()}

  console.log('== H1 전체 초기화 범위');
  const H1SEED=async(p)=>{await p.evaluate(async()=>{S.logs[addDays(today(),-1)]={...BLANK_LOG(),day:3,memo:"비밀메모"}; save(); await autoRun();
      const old=JSON.parse(backupJSON()); await idb("snaps","readwrite",st=>st.put({date:addDays(today(),-3),at:new Date().toISOString(),n:9,json:JSON.stringify(old)}));
      localStorage.setItem(PREV_KEY,JSON.stringify({at:new Date().toISOString(),s:S})); localStorage.setItem(KEY+".broken.123","비밀메모"); AUTO.snaps=null});};
  const RESET=async(p,keepSnaps)=>{await p.evaluate(()=>{const b=document.createElement('button'); b.dataset.act='reset'; document.body.appendChild(b); b.click()}); await p.waitForTimeout(200);
      const ck=await p.evaluate(()=>{const c=document.querySelector('#sheetRoot #rstAll'); return c?c.checked:null});
      if(keepSnaps) await p.evaluate(()=>{const c=document.querySelector('#sheetRoot #rstAll'); if(c) c.checked=false});
      await p.click('#sheetRoot [data-act=resetDo]'); await p.waitForTimeout(1500); return ck};
  const H1STATE=p=>p.evaluate(async()=>{const all=(await idb("snaps","readonly",st=>st.getAll()))||[];
      return {memo:all.some(x=>/비밀메모/.test(x.json)), withLogs:all.filter(x=>x.n>0).length, prev:localStorage.getItem(PREV_KEY)!==null, broken:Object.keys(localStorage).filter(k=>k.startsWith(KEY+".broken.")).length,
        logs:Object.keys(S.logs).length, wiped:window.__wiped||0}});
  {const p=await open({init:`window.UCTableAndroid={wipeOld:()=>{window.__wiped=(window.__wiped||0)+1; return true}}`});
    await H1SEED(p); const ck=await RESET(p,false); const r=await H1STATE(p);
    need(ck===true,`H1 확인 창에 '자동 보관본까지 모두 지우기' 선택(기본 켬) (${ck})`);
    need(!r.memo&&r.withLogs===0&&!r.prev&&r.broken===0&&r.logs===0,`H1 초기화 뒤 보관본·불러오기 전 기록·손상 사본 없음 (${JSON.stringify(r)})`);
    need(r.wiped===1,`H1 안드로이드 앱이면 예전 저장소 지우기 호출 (${r.wiped})`);
    await p.reload(); await p.ready(); await p.waitForTimeout(300);
    const r2=await H1STATE(p); need(!r2.memo&&r2.logs===0,`H1 새로고침 뒤에도 되살아나지 않음 (${JSON.stringify(r2)})`);
    await p.context().close()}
  {const p=await open(); await H1SEED(p); await RESET(p,true); const r=await H1STATE(p);
    need(r.memo&&r.withLogs>0&&r.logs===0,`H1 선택을 끄면 자동 보관본은 남겨 되살릴 수 있음 (${JSON.stringify(r)})`);
    await p.context().close()}

  console.log('== L7·H3 안드로이드 앱 안내와 예전 기록 다시 가져오기');
  {const p=await open(); const r=await p.evaluate(()=>{SCR=null; openScr("set-about"); return document.querySelector('#main').innerText});
    need(!/덮어 설치/.test(r),'L7 웹·아이폰에서는 안드로이드 덮어 설치 안내를 보이지 않음');
    await p.context().close()}
  {const old=JSON.stringify({app:"uc-table",v:1,profile:{height:"181"},logs:{"2026-09-30":{day:4}},consent:{date:"2026-09-30"},onb:"done"});
   const p=await open({init:`window.UCTableAndroid={hasMigrated:()=>true,peekMigrated:()=>${JSON.stringify(old)},takeMigrated:()=>""}`});
    const r=await p.evaluate(()=>{SCR=null; openScr("set-about"); const txt=document.querySelector('#main').innerText; SCR=null; openScr("set-data"); return {txt,btn:!!document.querySelector('#main [data-act=androidRetake]')}});
    need(/덮어 설치/.test(r.txt),'L7 안드로이드 앱에서는 덮어 설치 안내를 보임');
    need(r.btn,'H3 안드로이드 앱 설정에 예전 기록 다시 가져오기');
    if(r.btn){await p.click('#main [data-act=androidRetake]'); await p.waitForTimeout(300);
      const s=await p.evaluate(()=>({pend:!!PENDING_RESTORE,sheet:document.querySelector('#sheetRoot')?.innerText||""}));
      need(s.pend&&/불러/.test(s.sheet),`H3 다시 가져오기는 지금 기록과 비교하는 불러오기 화면으로 (${s.sheet.slice(0,40)})`)}
    await p.context().close()}

  console.log('== H5 면역을 누르는 약과 날음식');
  {const p=await open();
    const r=await p.evaluate(()=>{S.stageMode="3"; const raw=FOODS.filter(f=>f.tags.includes("raw")); const lv=meds=>{S.profile.meds=meds; const c=ctx(); return raw.map(f=>foodStatus(f,c).level)};
      const none=lv([]), asa=lv(["asa"]), bio=lv(["bio"]), ster=lv(["steroid"]), jak=lv(["jak"]), imm=lv(["immuno"]);
      S.profile.meds=["bio"]; const f0=raw.find(f=>/회/.test(f.name))||raw[0]; const st=foodStatus(f0,ctx());
      SCR=null; S.tab="food"; render(); showFood(f0.id); const sheet=document.querySelector('#sheetRoot')?.innerHTML||"";
      S.profile.meds=[]; const back=foodStatus(f0,ctx()).level;
      return {n:raw.length,none,asa,bio,ster,jak,imm,reason:st.reasons.join("|"),ref89:/data-refs="[^"]*\b89\b/.test(sheet),back}});
    const allAvoid=a=>a.every(l=>l==="avoid"||l==="ban"); const noneAvoid=a=>!a.some(l=>l==="avoid"||l==="ban");
    need(r.n>=10&&noneAvoid(r.none)&&noneAvoid(r.asa),`H5 약이 없거나 메살라진만이면 날음식은 피하기 아님 (${r.n}종)`);
    need(allAvoid(r.bio)&&allAvoid(r.ster)&&allAvoid(r.jak)&&allAvoid(r.imm),`H5 스테로이드·면역조절제·생물학적 제제·JAK 억제제면 날음식 모두 피하기`);
    need(/면역/.test(r.reason)&&/CDC|질병통제/.test(r.reason),`H5 이유에 면역·근거 기관 (${r.reason.slice(0,80)})`);
    need(r.ref89,'H5 음식 정보 근거에 새 근거 번호(89)');
    need(r.back!=="avoid",'H5 약을 지우면 바로 원래 판정');
    await p.context().close()}

  console.log('== M4(8번) 활동기 알림 문장 하나로 고정');
  {const p=await open();
    const r=await p.evaluate(()=>{const hi={...BLANK_LOG(),day:7,night:2,urg:2,blood:1,bloody:2,well:1,stool:6,medtaken:1,pain:3};
      for(const i of [0,1,2]) S.logs[addDays(today(),-i)]={...hi}; save(); SCR=null; S.tab="log"; render();
      const b3=[...document.querySelectorAll('.banner')].map(x=>x.innerText).join("|");
      for(const i of [1,2]) delete S.logs[addDays(today(),-i)]; save(); render();
      const b1=[...document.querySelectorAll('.banner')].map(x=>x.innerText).join("|");
      return {b3,b1,tell:ALERT_TELL}});
    need(r.tell==="주치의(IBD 진료팀)에 알리십시오.",`8번 고정 문장 (${r.tell})`);
    need(r.b3.includes(r.tell)&&!/고려하십시오/.test(r.b3),`8번 3일 연속 알림은 고정 문장 (${r.b3.slice(0,90)})`);
    need(r.b1.includes(r.tell),`8번 하루 알림도 같은 문장 (${r.b1.slice(0,90)})`);
    await p.context().close()}

  console.log('== M2 시판 제품 표시');
  {const p=await open();
    const r=await p.evaluate(()=>{const brand=f=>f.src&&f.src.kind==="L";
      const snk=FOODS.filter(f=>brand(f)&&f.cat!=="영양식"&&f.tags.some(t=>["snack","candy","choco"].includes(t)));
      const ons=FOODS.filter(f=>f.tags.includes("ons"));
      const gen=["crackers","potato_chips","milk_chocolate","gummy","tteokkochi","castella"].map(i=>FOOD[i]).filter(Boolean);
      return {nSnk:snk.length,snkProd:snk.filter(isProd).length,nOns:ons.length,onsProd:ons.filter(isProd).length,
        genProd:gen.filter(isProd).map(f=>f.name),nGen:gen.length,meta:fMeta(FOOD.goraebap),nProd:FOODS.filter(isProd).length}});
    need(r.nSnk>=52&&r.snkProd===r.nSnk,`M2 시판 과자·사탕·젤리 ${r.nSnk}종이 모두 시판 (${r.snkProd})`);
    need(r.nOns>=26&&r.onsProd===r.nOns,`M2 환자용 영양식 ${r.nOns}종이 모두 시판 (${r.onsProd})`);
    need(r.nGen===6&&!r.genProd.length,`M2 일반 음식(크래커·감자칩·밀크초콜릿·구미 젤리·떡꼬치·카스텔라)은 시판 아님 (${r.genProd.join(",")})`);
    need(/^시판/.test(r.meta),`M2 목록 한 줄에 '시판' (고래밥: ${r.meta})`);
    await p.context().close()}

  console.log('== M1 대신 이것');
  {const p=await open();
    const r=await p.evaluate(()=>{const BADT=["snack","candy","choco"];
      const bad=g=>isProd(g)||g.tags.some(t=>BADT.includes(t))||["sauce","ons"].includes(altRole(g));
      const pick=(id,st)=>{const c={...ctx(),stage:st,fiberStage:st}; const f=FOOD[id]; return {lv:foodStatus(f,c).level,a:altFoods(f,c).map(g=>g.id)}};
      const sushi=pick("sushi",1), choco=pick("milk_chocolate",1), walnut=pick("nuts",1), honey=pick("honey",1);
      const wrong=[]; let n=0;
      for(const st of [1,2,3]){const c={...ctx(),stage:st,fiberStage:st};
        for(const f of FOODS){const s=foodStatus(f,c); if(!badLv(s.level)) continue; n++;
          for(const g of altFoods(f,c)){const role=altRole(g); if(bad(g)||(role==="drink"&&altRole(f)!=="drink")) wrong.push(`${st}:${f.name}→${g.name}`)}}}
      S.stageMode="1"; SCR=null; S.tab="food"; render(); showFood("honey"); const hb=!!document.querySelector('#sheetRoot .alt-box');
      const jeyuk=pick("jeyuk",1).a.map(i=>[...altProt(FOOD[i])]), mandu=pick("fried_mandu",3).a, rm=pick("rm_jjajjaroni",1).a, kimchi=pick("yeolmu_kimchi",1).a.map(i=>FOOD[i]);
      return {sushi,choco,walnut,honey,wrong:wrong.slice(0,12),nWrong:wrong.length,n,hb,jeyuk,mandu,rm,kimchi:kimchi.map(g=>[g.cat,altForm(g),g.name])}});
    need(r.sushi.a.length&&!r.sushi.a.some(i=>/goraebap/.test(i)),`M1 초밥 대안에 고래밥 없음 (${r.sushi.lv}: ${r.sushi.a.join(",")})`);
    need(!r.choco.a.some(i=>["gummy","mygummy","vitamin_mygummy","aishe_plum"].includes(i)),`M1 초콜릿 대안에 젤리 없음 (${r.choco.a.join(",")})`);
    need(!r.walnut.a.some(i=>/kkumteuri/.test(i)),`M1 호두 대안에 왕꿈틀이 없음 (${r.walnut.a.join(",")})`);
    need(!r.honey.a.length&&!r.hb,`M1 꿀(양념)은 대안 칸을 숨김 (${r.honey.a.join(",")})`);
    need(r.jeyuk.length&&r.jeyuk.every(k=>k.includes("pork")),`M1 제육볶음 대안은 돼지고기 (${JSON.stringify(r.jeyuk)})`);
    need(r.mandu.length&&!r.mandu.includes("gimbap"),`M1 군만두 대안에 김밥 없음 (${r.mandu.join(",")})`);
    need(r.rm.length&&r.rm.every(i=>["udon","kalguksu","rice_noodle_soup"].includes(i)),`M1 시판 라면은 순한 국수로 (${r.rm.join(",")})`);
    need(r.kimchi.length&&r.kimchi.every(([c,fm])=>c==="채소"&&fm==="김치"),`M1 열무김치 대안은 맵지 않은 김치 (${r.kimchi.map(x=>x[2]).join(",")})`);
    need(r.nWrong===0,`M1 나쁜 판정 음식 ${r.n}건(1~3단계)의 대안에 과자·사탕·초콜릿·양념·영양식·시판·엉뚱한 음료 없음 (${r.nWrong}: ${r.wrong.join(" / ")})`);
    await p.context().close()}

  console.log('== M3 햄이 들어갈 수 있는 음식·훈제오리');
  {const p=await open();
    const r=await p.evaluate(()=>{S.stageMode="3"; const out={};
      for(const id of ["gimbap","omurice","veg_fried_rice","kimchi_fried_rice"]){SCR=null; S.tab="food"; render(); showFood(id); const sh=document.querySelector('#sheetRoot')?.innerText||"";
        out[id]={note:sh.includes(HAM_NOTE),lv:foodStatus(FOOD[id]).level}; closeSheet()}
      SCR=null; S.tab="food"; render(); showFood("udon"); const plain=(document.querySelector('#sheetRoot')?.innerText||"").includes(HAM_NOTE); closeSheet();
      MJ={step:"edit",items:[{name:"김밥",ingr:[],cook:""}],results:[],err:"",text:""}; mjJudge(); S.tab="food"; S.foodMode="eatout"; SCR=null; render();
      const mj=document.querySelector('#main')?.innerText||""; const duck=FOOD.smoked_duck;
      return {out,plain,mjNote:MJ.results[0]&&MJ.results[0].ham===true,mjTxt:mj.includes(HAM_NOTE),note:HAM_NOTE,duckLv:foodStatus(duck).level,duckWhy:duck.why}});
    need(r.note==="햄·소시지는 빼고 드십시오. 발색제(아질산나트륨)가 든 햄·소시지는 절대 금지, 없는 제품도 피하기입니다.",`M3 안내 문장(검토 R-12: 기준을 밝힘) (${r.note})`);
    need(Object.values(r.out).every(x=>x.note&&x.lv!=="ban"),`M3 김밥·오므라이스·볶음밥 정보에 안내, 판정은 그대로 (${JSON.stringify(r.out)})`);
    need(!r.plain,'M3 햄과 관계없는 음식(우동)에는 안내 없음');
    need(r.mjNote,'M3 외식 판정 김밥에도 같은 안내');
    need(r.duckLv==="ban"&&/시판 훈제오리 \d+종 가운데 \d+종/.test(r.duckWhy),`M3 훈제오리는 앱의 시판 제품 발색제 비율로 절대 금지 (${r.duckLv}: ${r.duckWhy.slice(0,90)})`);
    await p.context().close()}

  console.log('== M5 검색 자모 일치');
  {const p=await open();
    const r=await p.evaluate(()=>{const ids=q=>FOODS.filter(f=>searchHit(f,q)).map(f=>f.id);
      const ham=ids("햄"), typing=ids("ㅎㅐ"), mid=ids("해무"), haemul=ids("해물");
      return {ham:ham.length,hamBad:["pajeon","bajirak_kalguksu","haemultang","sundubu_jjigae"].filter(i=>ham.includes(i)),hamHas:ham.includes("ham"),
        typing:typing.includes("haemultang"),mid:mid.includes("haemultang"),haemul:haemul.includes("haemultang")}});
    need(r.hamHas&&!r.hamBad.length,`M5 '햄' 검색에 파전·바지락칼국수·해물탕·순두부찌개 없음 (${r.ham}개, ${r.hamBad.join(",")})`);
    need(r.typing&&r.mid,`M5 입력 중('ㅎㅐ'·'해무')에는 해물탕을 찾음 (${r.typing}/${r.mid})`);
    need(r.haemul,"M5 '해물'은 해물탕을 찾음");
    await p.context().close()}

  console.log('== M8 확인 날짜 문구·M9 안 먹음');
  {const p=await open();
    const r=await p.evaluate(()=>{const pick=d=>Object.keys(ADDED).find(i=>ADDED[i]===d&&FOOD[i]);
      const sheet=id=>{SCR=null; S.tab="food"; render(); showFood(id); const t=document.querySelector('#sheetRoot')?.innerText||""; closeSheet(); return t.replace(/\s+/g," ")};
      const a=sheet(pick("2026-09-24")), b=sheet(pick("2026-10-13")), c=sheet(pick("2026-10-14"));
      SCR=null; openScr("set-about"); const ab=(document.querySelector('#main')?.innerText||"").replace(/\s+/g," "); SCR=null;
      S.tab="home"; SCR=null; render(); const sw=[...document.querySelectorAll('.mswap')].map(x=>x.innerText.trim());
      return {a,b,c,ab,sw}});
    need(/2026-09-24 이전\(첫 공개판\)/.test(r.a)&&!/2026-09-24 이전\(첫 공개판\)[^.]*넣으며 자료를 확인한 날/.test(r.a),`M8 첫 공개판 음식은 '2026-09-24 이전(첫 공개판)' (${(r.a.match(/확인 날짜.{0,60}/)||[""])[0]})`);
    need(/2026-10-13 이전/.test(r.b),`M8 v1.1~v1.8 음식도 추정 날짜로 (${(r.b.match(/확인 날짜.{0,60}/)||[""])[0]})`);
    need(/2026-10-14/.test(r.c)&&/넣으며 자료를 확인한 날/.test(r.c)&&!/이전/.test((r.c.match(/확인 날짜.{0,30}/)||[""])[0]),`M8 기록이 있는 날짜는 그대로 (${(r.c.match(/확인 날짜.{0,60}/)||[""])[0]})`);
    need(/마지막으로 음식을 넣은 날/.test(r.ab)&&!/음식 자료 마지막 확인 날짜/.test(r.ab),"M8 설정 항목 이름 '마지막으로 음식을 넣은 날'");
    need(r.sw.length&&r.sw.every(t=>/안 먹음·바꾸기/.test(t)),`M9 끼니 줄 버튼 '안 먹음·바꾸기' (${r.sw.join(",")})`);
    await p.context().close()}

  console.log('== M10 백업 암호화·동기화 폴더 안내');
  {const p=await open();
    const r=await p.evaluate(async()=>{const d=addDays(today(),-2); S.logs[d].memo="비밀메모-처방약"; save();
      SCR=null; openScr("set-data"); await new Promise(z=>setTimeout(z,300)); render(); const before=document.querySelector('#main').innerText;
      await encSet("correct-horse-1"); SCR=null; openScr("set-data"); const after=document.querySelector('#main').innerText;
      const plain=backupJSON(); const out=await encWrap(plain); const obj=JSON.parse(out);
      restoreFromText(out); await new Promise(z=>setTimeout(z,100)); const ask=!!document.querySelector('#sheetRoot input[type=password]');
      document.querySelector('#encPw').value="wrong-pass-0"; document.querySelector('[data-act=encRestore]').click(); await new Promise(z=>setTimeout(z,2500));
      const wrongMsg=document.querySelector('#sheetRoot')?.innerText||""; const stillAsk=!!document.querySelector('#encPw');
      document.querySelector('#encPw').value="correct-horse-1"; document.querySelector('[data-act=encRestore]').click(); await new Promise(z=>setTimeout(z,2500));
      const okSheet=document.querySelector('#sheetRoot')?.innerText||""; const pend=PENDING_RESTORE&&PENDING_RESTORE.logs[d]&&PENDING_RESTORE.logs[d].memo;
      closeSheet(); await encOff(); const offOut=await encWrap(plain);
      return {before:/암호화/.test(before)&&/꺼짐/.test(before),after:/켜짐/.test(after),hasMemo:out.includes("비밀메모"),obj:{enc:obj.enc,kdf:obj.kdf,iter:obj.iter,salt:!!obj.salt,iv:!!obj.iv},ask,
        wrong:/비밀번호가 맞지 않/.test(wrongMsg)&&stillAsk,ok:/백업 불러오기/.test(okSheet),pend,off:offOut===plain,sync:/동기화/.test(before)}});
    need(r.before&&r.after,`M10 백업 화면에 암호화 켜기·켜짐 표시 (${r.before}/${r.after})`);
    need(!r.hasMemo&&r.obj.enc==="AES-GCM-256"&&r.obj.kdf==="PBKDF2-SHA256"&&r.obj.iter===310000&&r.obj.salt&&r.obj.iv,`M10 암호화 백업에 메모 평문 없음, AES-GCM·PBKDF2 31만 회 (${JSON.stringify(r.obj)})`);
    need(r.ask&&r.wrong,`M10 불러올 때 비밀번호를 묻고, 틀리면 거절 (${r.ask}/${r.wrong})`);
    need(r.ok&&r.pend==="비밀메모-처방약",`M10 맞는 비밀번호면 비교 화면으로 (${r.ok}/${r.pend})`);
    need(r.off,'M10 암호화를 끄면 원래대로');
    need(r.sync,'M10 자동 백업 폴더에 클라우드 동기화 폴더 안내');
    await p.context().close()}

  console.log('== 낮음 항목(L1~L5·L8·L11·A-12·A-15·W-1·W-2·F-1)');
  {const PUB=path.join(ROOT,'public'); const man=JSON.parse(fs.readFileSync(path.join(PUB,'manifest.webmanifest'),'utf8')); const sw=fs.readFileSync(path.join(PUB,'sw.js'),'utf8');
    need(!("orientation" in man),'A-12 매니페스트에 화면 방향 고정 없음');
    need(man.id==="./"&&Array.isArray(man.shortcuts)&&man.shortcuts.length>=2&&(man.categories||[]).includes("health"),'W-1 매니페스트 id·바로가기·분류');
    need(!/zxing/.test(sw.match(/const ASSETS=(\[.*?\]);/)[1])&&/html2canvas/.test(sw),'L8 바코드 라이브러리는 미리 보관하지 않음(그림 PDF 라이브러리는 보관)');
    const p=await open({init:`window.claude={use:async n=>n==="downloads"?{save:async({filename})=>{(window.__fn=window.__fn||[]).push(filename);return {status:"saved"}}}:null}`});
    const r=await p.evaluate(async()=>{const o={};
      o.cdn=JSON.stringify(PDF_LIBS)+JSON.stringify(BC_LIB); 
      o.sc=scaledTxt({fk:1.2,fp:0.8});
      S.foodQ=""; S.tab="food"; SCR=null; render(); o.hdr=[...document.querySelectorAll('.fg-h .fg-n')].map(x=>x.textContent);
      o.aria=document.querySelector('#foodRes .fcard')?.getAttribute('aria-label')||"";
      S.tab="plan"; SCR=null; render(); const b=document.querySelector('[data-act=ateToggle]'); if(b) b.click(); await new Promise(z=>setTimeout(z,150));
      const t=document.querySelector('#toasts .toast'); o.toastTop=t?t.getBoundingClientRect().top:-1; o.h=innerHeight;
      UPD=true; render(); o.upd=!!document.querySelector('.upd-banner [data-act=updReload]'); UPD=false;
      await backup(); await csvExport("logs","save"); o.fn=window.__fn||[];
      const q=QA.find(x=>x.id==="school_meal"); o.qa=q?q.q:"";
      return o});
    need(!/https?:/.test(r.cdn),`L1 라이브러리 경로에 CDN 없음 (${r.cdn.slice(0,120)})`);
    need(/늘리고 .*줄였습니다\.$/.test(r.sc.trim()),`L3 '…늘리고 …줄였습니다' (${r.sc.trim()})`);
    need(r.hdr.length&&r.hdr.some(t=>/\d,\d{3}개/.test(t)),`L2 묶음 개수에 천 단위 쉼표 (${r.hdr.join(" / ")})`);
    need(/, (좋음|주의|다음 단계|피하기|절대 금지), .+/.test(r.aria),`L5 결과 줄 읽기에 종류·양·열량 (${r.aria})`);
    need(r.toastTop>=0&&r.toastTop<r.h/3,`L4 끼니 '먹음' 알림은 위쪽 (top ${Math.round(r.toastTop)})`);
    need(r.upd,'W-2 새 버전 안내와 다시 열기 버튼');
    need(r.fn.length>=2&&r.fn.every(n=>/^uc-table-[a-z]+-\d{4}-\d\d-\d\d\.(json|csv)$/.test(n)),`F-1 파일 이름은 영문 (${r.fn.join(", ")})`);
    need(/^대학·회사 급식/.test(r.qa),`L11 '대학·회사 급식' (${r.qa})`);
    const r2=await p.evaluate(()=>{S.tab="me"; SCR=null; openScr("nutri"); const low=document.querySelector('.low-t'); return {low:!!low||!document.querySelector('.bar i.low'), aria:[...document.querySelectorAll('.bar')].map(x=>x.getAttribute('aria-label')).join("|")}});
    need(r2.low,`A-15 모자람은 글자로도 (${r2.aria.slice(0,80)})`);
    await p.context().close()}

  console.log('== F-5 오타·영어 검색');
  {const p=await open();
    const r=await p.evaluate(()=>{const run=q=>{S.foodQ=q; const d=foodSearchData(); return {n:d.list.length,ids:d.list.map(f=>f.id),eng:FS_ENG}};
      const ban=run("banana"), milk=run("Milk"), cof=run("coffee");
      const sg=q=>suggestFoods(q).map(f=>f.name);
      S.foodQ="바나니"; S.tab="food"; SCR=null; render(); const btn=document.querySelector('#foodRes [data-act=foodQSet]'); const txt=document.querySelector('#foodRes')?.innerText||"";
      if(btn) btn.click(); const after=S.foodQ;
      return {ban,milk,cof,s1:sg("바나니"),s2:sg("떡뽁이"),s3:sg("쵸콜릿"),s4:sg("바니나"),txt:/혹시/.test(txt),after}});
    need(r.ban.ids.includes("banana")&&r.ban.eng==="바나나",`F-5 'banana' → 바나나 (${r.ban.n}개)`);
    need(r.milk.ids.includes("milk")&&r.cof.ids.includes("coffee"),`F-5 'Milk'·'coffee' (${r.milk.n}/${r.cof.n})`);
    need(r.s1.includes("바나나")&&r.s4.includes("바나나")&&r.s2.includes("떡볶이")&&r.s3.some(n=>/초콜릿/.test(n)),`F-5 오타 '혹시' (${r.s1}|${r.s2}|${r.s3}|${r.s4})`);
    need(r.txt&&r.after==="바나나",`F-5 '혹시 바나나'를 누르면 그 이름으로 다시 찾음 (${r.after})`);
    await p.context().close()}

  console.log('== U-2 쉬운 말 먼저·용어 풀이');
  {const p=await open();
    const r=await p.evaluate(()=>{S.stageMode="1"; S.tab="plan"; SCR=null; render(); const chip=document.querySelector('.ridge .r-stage')?.innerText||"";
      SCR=null; openScr("set-stage"); const st=document.querySelector('#main').innerText; SCR=null; openScr("set-about"); const ab=document.querySelector('#main').innerText;
      const f=FOODS.find(x=>FSERV[x.id]&&FSERV[x.id].grp.includes("fructan")); SCR=null; S.tab="food"; render(); showFood(f.id); const fb=!!document.querySelector('#sheetRoot .term[data-v=fructan]'); closeSheet();
      return {n:Object.keys(GLOSS).length,chip,st:/섬유를 줄인 식사\(저잔사식\)/.test(st)&&/골고루 먹는 식사\(지중해식\)/.test(st),ab:/앱에 나오는 용어 \d+개/.test(ab),fb,
        later:foodStatus(FOOD.brown_rice,{...ctx(),stage:1,fiberStage:1}).reasons.join("|")}});
    need(r.n>=30,`U-2 용어 풀이 30개 이상 (${r.n})`);
    need(/섬유를 줄인 식사/.test(r.chip),`U-2 홈 단계 표시는 쉬운 말 (${r.chip.trim()})`);
    need(r.st,'U-2 식단 단계 설정은 쉬운 말(용어)');
    need(r.ab,'U-2 앱 정보에 용어 풀이 모음');
    need(r.fb,'U-2 음식 정보의 FODMAP 성분(프럭탄)은 풀이 단추');
    await p.context().close()}

  console.log('== F-13 검사 수치·약 메모');
  {const p=await open();
    const r=await p.evaluate(async()=>{SCR=null; openScr("set-labs"); document.querySelector('[data-act=labAdd]').click();
      document.querySelector('#labKind').value="crp"; document.querySelector('#labVal').value="abc"; document.querySelector('[data-act=labSave]').click();
      const err=document.querySelector('#labErr')?.textContent||"";
      document.querySelector('#labVal').value="3,2"; document.querySelector('[data-act=labSave]').click();
      document.querySelector('[data-act=labAdd]').click(); document.querySelector('#labKind').value="med"; document.querySelector('#labNote').value="메살라진 하루 4g"; document.querySelector('[data-act=labSave]').click();
      const list=document.querySelector('#main').innerText; const n=S.labs.length;
      const bl=reportBlocks(); const div=document.createElement('div'); div.innerHTML=bl.blocks.join(""); const rep=div.innerText;
      const bk=JSON.parse(backupJSON()); const back=normalizeState(bk).labs.length;
      S.labs=[]; const mg=mergeStates(S,bk).labs.length;
      return {err,n,list:/CRP 3\.2 mg\/L/.test(list)&&/메살라진 하루 4g/.test(list),rep:/검사 수치·약 메모/.test(rep)&&/3\.2 mg\/L/.test(rep),back,mg}});
    need(/숫자/.test(r.err),`F-13 수치가 숫자가 아니면 안내 (${r.err})`);
    need(r.n===2&&r.list,`F-13 검사 수치·약 메모 저장·목록 (${r.n})`);
    need(r.rep,'F-13 진료용 PDF에 검사 수치·약 메모');
    need(r.back===2&&r.mg===2,`F-13 백업·합치기에도 들어감 (${r.back}/${r.mg})`);
    await p.context().close()}

  await b.close();
  console.log(F.length?'FAIL '+F.join(' / '):'검증 통과'); process.exit(F.length?1:0);
})();
