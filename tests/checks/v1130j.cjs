const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
require('../lib/guard.cjs');

/* v1.13.0 28차(2026-11-21) 사용자 요청
   1 홈 맨 위에는 배변·혈변 횟수 대신 '현재 식단 단계: 저잔사식'(누르면 식단 단계 화면). 오른쪽 위 단계 단추는 없고 2주 그래프는 그대로
   2 용어 풀이 '?'는 동그라미 없이 숫자 윗첨자만 한 크기로, 누르면 풀이가 뜬다. 식단 단계 옆 먹는 내용은 글자로 띄우지 않는다
     30차(사용자 요청): 저잔사식(식단 단계 이름) 옆에는 '?'도 붙이지 않는다
   3 증상 기록은 '낮중 배변'·'밤중 배변'으로 말을 맞춘다 */
const { chromium } = require('playwright');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
fs.mkdirSync(TMP,{recursive:true}); const page=path.join(TMP,'v1130j.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const SEED=()=>{ S.consent={date:today()}; S.onb="done"; S.persist="na"; S.stageMode="1"; S.profile={...S.profile,height:"170",weight:"60",age:"30",sex:"F"};
  const d=n=>addDays(today(),-n); for(const [i,v] of [[3,4],[2,3],[1,2]]) S.logs[d(i)]={...BLANK_LOG(),day:v,night:0,bloody:i===3?1:0}; save(); };
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
  await p.route(/^https?:/, r=>r.fulfill({body:''}));
  const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
  await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready();

  console.log('== 1 홈 맨 위는 지금 식단 단계');
  {const r=await p.evaluate(()=>{const o={}; S.stageMode="1"; const look=()=>{SCR=null; S.tab="plan"; S.selDay=0; render(); const g=document.querySelector('.ridge');
        return {head:g.querySelector('.r-head')?.textContent.replace(/\s+/g," ").trim()||"", sub:g.querySelector('.r-sub')?.textContent||"", top:g.querySelectorAll('.r-top button').length, chart:!!g.querySelector('.r-chart, svg')}};
      o.before=look(); S.logs[today()]={...BLANK_LOG(),day:5,night:1,bloody:2}; save(); o.after=look();
      document.querySelector('.ridge .r-head button').click(); o.scr=SCR?.name||""; SCR=null; delete S.logs[today()]; save(); return o});
    for(const [k,v] of [["기록 전",r.before],["기록 뒤",r.after]]){
      need(/^현재 식단 단계: 저잔사식/.test(v.head)&&!/배변 \d|혈변 \d/.test(v.head+v.sub),`1 ${k}: 맨 위는 '현재 식단 단계: 저잔사식', 배변·혈변 횟수 글자 없음 ('${v.head}' / '${v.sub}')`);
      need(v.top===0&&v.chart,`1 ${k}: 오른쪽 위 단계 단추 없음, 2주 그래프는 그대로 (${v.top}, ${v.chart})`)}
    need(r.scr==="set-stage",`1 '현재 식단 단계'를 누르면 식단 단계 화면 (${r.scr})`)}

  console.log("== 2 작은 '?' 윗첨자와 풀이(30차: 저잔사식·식단 단계 이름 옆에는 붙이지 않음)");
  {const r=await p.evaluate(()=>{S.stageMode="1"; SCR=null; S.tab="plan"; S.selDay=0; render(); openScr("set-about");
      const q=document.querySelector('#main .gq-b[data-v=fodmap]'); const cs=q&&getComputedStyle(q), bf=q&&getComputedStyle(q,'::before'), rr=q&&q.getBoundingClientRect();
      const o={has:!!q, bw:cs?parseFloat(cs.borderTopWidth)||0:-1, rad:cs?cs.borderTopLeftRadius:"", fs:cs?parseFloat(cs.fontSize):0, h:rr?Math.round(rr.height):0, glyph:bf?bf.content:"", txt:q?q.textContent:"x", va:cs?cs.verticalAlign:""};
      q?.click(); o.sheet=document.querySelector('#sheetRoot h2')?.textContent||""; closeSheet(); SCR=null;
      S.logs[today()]={...BLANK_LOG(),day:1}; save(); o.views=[];
      const look=name=>{const m=document.querySelector('#main'); o.views.push({name, low:(m.innerText.match(/저잔사식/g)||[]).length,
        gq:m.querySelectorAll('.gq-b[data-v=lowres],.gq-b[data-v=med],.gq-b[data-v=normal]').length, row:m.querySelectorAll('.stl .gq-b, .today-card .kv b .gq-b').length})};
      for(const t of ["plan","log","food","me"]){SCR=null; S.tab=t; render(); look(t)}
      SCR=null; S.tab="plan"; render(); openScr("meal",{k:0}); look("meal"); openScr("set-stage"); look("set-stage");
      SCR=null; delete S.logs[today()]; save(); render(); return o});
    need(r.has&&r.bw===0&&r.glyph==='"?"'&&r.txt===""&&r.va==="super",`2 '?'는 동그라미 없는 윗첨자, 글자는 화면에만(복사·글자 비교에 섞이지 않음) (${JSON.stringify({...r,views:undefined})})`);
    need(r.fs<=12&&r.h<=16,`2 '?'는 숫자 윗첨자만 한 크기(글자 ${r.fs}px, 높이 ${r.h}px)`);
    need(r.sheet==="가스 유발 성분(FODMAP)",`2 '?'를 누르면 풀이 ('${r.sheet}')`);
    const shown=r.views.filter(v=>v.low>0).map(v=>v.name);
    need(["plan","log","food","meal","set-stage"].every(n=>shown.includes(n)),`30차 저잔사식이 보이는 화면을 모두 봄 (${shown.join(",")})`);
    need(r.views.every(v=>v.gq===0&&v.row===0),`30차 저잔사식·식단 단계 이름 옆 '?' 없음 (${r.views.map(v=>v.name+":"+v.gq+"/"+v.row).join(" ")})`)}

  console.log("== 3 증상 기록 '낮중 배변'·'밤중 배변'");
  {const r=await p.evaluate(()=>{const q=WSTEPS.find(s=>s.k==="bowel").q; const lab=Object.fromEntries(q.map(x=>[x.k,x.t]));
      SCR=null; openWizard(today()); let txt=""; for(let i=0;i<WS().length&&!/배변 횟수/.test(txt);i++){WZ.step=i; render(); txt=document.querySelector('#main').innerText}
      closeScr(); return {lab, txt:/낮중 배변/.test(txt)&&/밤중 배변/.test(txt)&&!/낮 동안/.test(txt)}});
    need(r.lab.day==="낮중 배변"&&r.lab.night==="밤중 배변"&&r.txt,`3 배변 횟수 쪽 말이 '낮중 배변'·'밤중 배변' (${JSON.stringify(r.lab)}, 화면 ${r.txt})`)}

  await ctx.close(); await b.close();
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exitCode=1});
