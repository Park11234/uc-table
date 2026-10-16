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

  await b.close();
  console.log(F.length?'FAIL '+F.join(' / '):'검증 통과'); process.exit(F.length?1:0);
})();
