const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
require('../lib/guard.cjs');

/* v1.13.0 37차(2026-11-23) 사용자 요청: 조약돌 강의 칸 글씨('오늘 0/3끼'·'30 · 2단계'·'오늘')가 칸 둘레 점선과 겹쳐 보였다.
   둘레는 화면 너비를 따라 커지는데 글씨는 칸 아래 6px에 고정돼, 넓은 화면일수록 점선이 글씨 윗부분을 지났다.
   글씨(실제 잉크)는 제 둘레 아래로 떨어지고, 아래 줄 칸·다음 단계 칸 둘레와 굽은 강 가운데 점선에도 닿지 않아야 한다 */
const { chromium } = require('playwright');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
fs.mkdirSync(TMP,{recursive:true}); const page=path.join(TMP,'v1130p.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
// 오늘 칸(t)·오늘 놓은 조약돌(m)의 자리. 2: 줄 가운데, 5·11·17·23: 강이 굽는 줄 끝, 18: 바로 아래가 '30 · 2단계' 칸
const CASES=[["t",2],["t",5],["t",11],["t",18],["t",23],["m",17],["m",18]];
(async()=>{
  const b=await chromium.launch();
  try{
  for(const w of [320,360,390,430,600]){
    console.log(`== 화면 너비 ${w}px`);
    const ctx=await b.newContext({viewport:{width:w,height:900},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    await p.goto('file://'+page); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    for(const [kind,i] of CASES){
      const r=await p.evaluate(async ({kind,i})=>{
        const sl=mealSlots(); S.consent={date:addDays(today(),-60)}; S.onb="done"; S.persist="na"; S.peb={intro:1,seen:0};
        S.ate={}; for(let k=1;k<=i;k++) S.ate[addDays(today(),-k)]=[...sl]; if(kind==="m") S.ate[today()]=[...sl]; S.skips={}; S.ratings=[];
        closeSheet(); SCR=null; S.tab="peb"; save(); render(); closeSheet(); await document.fonts.ready;
        const river=document.querySelector('.peb-river'), slots=[...river.querySelectorAll('.peb-slot')];
        // 칸 둘레(::before). 둘레가 없는 칸(놓인 조약돌)은 칸 상자 자체
        const ring=s=>{const q=s.getBoundingClientRect(), cs=getComputedStyle(s,'::before');
          return cs.content==='none'?{left:q.left,top:q.top,right:q.right,bottom:q.bottom}:{left:q.left+parseFloat(cs.left),top:q.top+parseFloat(cs.top),right:q.right-parseFloat(cs.right),bottom:q.bottom-parseFloat(cs.bottom)}};
        // 글씨의 실제 잉크 상자(글꼴 지표로 계산)
        const ink=lb=>{const L=lb.getBoundingClientRect(), cs=getComputedStyle(lb), c=document.createElement('canvas').getContext('2d'); c.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          const t=c.measureText(lb.textContent), fa=t.fontBoundingBoxAscent, fd=t.fontBoundingBoxDescent, lh=cs.lineHeight==='normal'?fa+fd:parseFloat(cs.lineHeight), base=L.top+(lh-(fa+fd))/2+fa;
          return {left:L.left-t.actualBoundingBoxLeft,right:L.left+t.actualBoundingBoxRight,top:base-t.actualBoundingBoxAscent,bottom:base+t.actualBoundingBoxDescent}};
        // 강 가운데 점선의 칠해진 점(둥근 끝 포함)
        const dot=river.querySelector('.pt-dot'), M=dot.getScreenCTM(), ds=getComputedStyle(dot), da=ds.strokeDasharray.split(/[ ,]+/).map(parseFloat), rad=parseFloat(ds.strokeWidth)/2*M.a, len=dot.getTotalLength(), pts=[];
        for(let s0=0;s0<len;s0+=da[0]+da[1]) for(let s=s0;s<=Math.min(s0+da[0],len)+1e-6;s+=0.25){const P=dot.getPointAtLength(Math.min(s,len)); pts.push([M.a*P.x+M.c*P.y+M.e,M.b*P.x+M.d*P.y+M.f])}
        const out=[];
        for(const s of slots){const lb=s.querySelector('.peb-lb'); if(!lb) continue;
          const k=ink(lb), own=ring(s); let below=Infinity, hit="";
          for(const o of slots){if(o===s) continue; const R=ring(o); if(k.left>=R.right||k.right<=R.left) continue;
            const gap=Math.max(R.top-k.bottom,k.top-R.bottom); if(R.top>=k.top) below=Math.min(below,R.top-k.bottom); if(gap<0.5) hit=o.querySelector('.peb-no')?.textContent||o.className}
          let dash=Infinity; for(const [x,y] of pts){const dx=Math.max(k.left-x,0,x-k.right), dy=Math.max(k.top-y,0,y-k.bottom); dash=Math.min(dash,Math.hypot(dx,dy)-rad)}
          out.push({txt:lb.textContent, cls:s.className.replace('peb-slot ',''), top:+(k.top-own.bottom).toFixed(2), below:below===Infinity?null:+below.toFixed(2), hit, dash:+dash.toFixed(2),
            mid:(k.left+k.right)/2>own.left&&(k.left+k.right)/2<own.right, inView:k.left>=0&&k.right<=innerWidth})}
        return out},{kind,i});
      const tag=`${w}px ${kind==="t"?"오늘 칸":"오늘 놓은 조약돌"} ${i+1}번째 자리`;
      if(!r.length) need(false,`${tag}: 칸 글씨가 없음`);
      for(const x of r){
        need(x.top>=1.5,`${tag} '${x.txt}': 글씨가 제 칸 둘레 점선 아래로 떨어져 있음 (틈 ${x.top}px)`);
        need(!x.hit&&(x.below===null||x.below>=0.5),`${tag} '${x.txt}': 아래 줄 칸·다음 단계 칸 둘레에 닿지 않음 (${x.below===null?"아래 칸 없음":`틈 ${x.below}px`}${x.hit?`, 닿는 칸 ${x.hit}`:""})`);
        need(x.dash>=0.5,`${tag} '${x.txt}': 굽은 강 가운데 점선에 닿지 않음 (틈 ${x.dash}px)`);
        need(x.mid&&x.inView,`${tag} '${x.txt}': 글씨가 제 칸 밑에 있고 화면 밖으로 나가지 않음`);
      }
    }
    await ctx.close();
  }
  } finally { await b.close() }
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exitCode=1});
