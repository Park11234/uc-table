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

/* v1.13.0 20차(2026-11-15) 사용자 요청: 화면 문장의 줄이 말 덩어리 사이에서 바뀌는지(모든 주요 화면, 320·360·390px)
   근거: 줄을 구·절 경계에서 나누면 읽는 부담이 줄고(Gerber-Morón 등 2018, J Eye Mov Res; Walker 등 2007 VSTF),
   덩어리 때문에 줄 길이가 들쭉날쭉하면 오히려 느려진다(Keenan 1984, Visible Language).
   - 쉼표(,)나 문장 끝(다. 요. .)으로 나뉜 말 덩어리가 한 줄에 들어갈 만큼 짧은데도 두 줄에 걸치면 '피할 수 있던 꺾임'(덩어리 앞이 폭의 55%도 안 찬 줄에서 시작하면 넘기지 않는 편이 나아 제외)
   - 문단 중간 줄이 폭의 45%도 못 채우고 끝나는 '짧은 줄'이 고치기 전보다 크게 늘지 않아야 함
   제목(h1~h4·b·strong 덩어리)·오픈소스 원문(pre)은 대상이 아님 */
const { chromium } = require('playwright');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const BODY=fs_.readFileSync(APP,'utf8');
const page=T('phrase.html');
fs_.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+BODY+'</body></html>');
const SEED=()=>{const d=n=>addDays(today(),-n); S.consent={date:today()}; S.onb="done"; S.persist="na"; S.stageMode="3";
  S.profile={height:"174",weight:"63",age:"27",sex:"M",allergies:["shrimp"],allergyOther:"",lactose:false,meds:["asa"],medOther:"",dislikes:"",budget:"보통"};
  const mk=(bloody,pain,well)=>({day:3,night:0,bloody,urg:bloody?1:0,blood:bloody?1:0,well,extra:[],stool:0,medtaken:1,pain,gas:"조금",fatigue:"약간",temp:"",pulse:"",other:[],memo:""});
  for(let i=0;i<8;i++) S.logs[d(i)]=mk(i===5?1:0,i%2,i===5?1:0);
  S.water[today()]=4; S.weights=[{date:d(40),kg:63.6},{date:today(),kg:63.1}];
  S.qs=[{id:"q1",t:"철분제를 계속 먹어도 됩니까?",date:d(2),done:""}]; S.favs=["banana"]; S.lastBackup=d(1);
  S.plan=null; S.plan=samplePlan(); save()};
const SCREENS=[
 ['home',()=>{SCR=null;S.tab="plan";S.selDay=0;render()}],
 ['home-day2',()=>{SCR=null;S.tab="plan";S.selDay=2;render();S.selDay=0}],
 ['log',()=>{SCR=null;S.tab="log";render()}],
 ['food-search',()=>{SCR=null;S.tab="food";S.foodSub="search";S.foodQ="";S.foodCat="전체";S.foodLv="전체";render()}],
 ['food-menu',()=>{SCR=null;S.tab="food";S.foodSub="menu";MJ={step:"idle",items:[],results:[],err:"",text:""};render()}],
 ['menu-confirm',()=>{SCR=null;S.tab="food";S.foodSub="menu";MJ={step:"idle",items:[],results:[],err:"",text:"새우 샐러드, 크림 파스타"};render();mjFromText()}],
 ['menu-result',()=>{SCR=null;S.tab="food";S.foodSub="menu";MJ={step:"idle",items:[],results:[],err:"",text:"새우 샐러드, 크림 파스타, 생굴, 삼겹살"};render();mjFromText();mjJudge()}],
 ['food-label',()=>{SCR=null;S.tab="food";S.foodSub="label";render()}],
 ['me',()=>{SCR=null;S.tab="me";render()}],
 ['nutri',()=>{S.tab="plan";openScr("nutri")}],
 ['meal0',()=>{S.tab="plan";SCR=null;render();openScr("meal",{k:0})}],
 ['meal1',()=>{S.tab="plan";SCR=null;render();openScr("meal",{k:1})}],
 ['meal2',()=>{S.tab="plan";SCR=null;render();openScr("meal",{k:2})}],
 ['food-detail',()=>{SCR=null;S.tab="food";render();showFood("broccoli")}],
 ['food-detail2',()=>{SCR=null;S.tab="food";render();showFood("chicken_breast")}],
 ...['set-about','set-allergy','set-data','set-diet','set-goals','set-home','set-labs','set-meds','set-orders','set-privacy','set-profile','set-refs','set-remind','set-stage','set-trig','set-weight','pdf','asks','report','reintro','qa','care','past'].map(n=>[n,(n)=>{S.tab="me";SCR=null;render();openScr(n,n==="past"?{date:addDays(today(),-1)}:{})},n]),
 ['onb0',()=>{SCR=null;S.onb="0";render()}],['onb1',()=>{SCR=null;S.onb="1";render()}],['onb2',()=>{SCR=null;S.onb="2";render()}],['onb3',()=>{SCR=null;S.onb="3";render()}],
 ['welcome',()=>{SCR=null;S.consent=null;S.onb=undefined;render()}],
];
// 페이지 안에서 실행: 문단마다 글자 위치를 모아, 말 덩어리가 피할 수 있게 두 줄에 걸친 곳과 짧은 줄을 센다
function scan(){
  const roots=[document.querySelector('#main'),document.querySelector('#sheetRoot')].filter(Boolean);
  const blockish=el=>{for(let e=el;e&&e!==document.body;e=e.parentElement){const d=getComputedStyle(e).display; if(!d.startsWith('inline')&&d!=='contents') return e} return document.body};
  const by=new Map(); const rg=document.createRange();
  for(const r0 of roots){
    const tw=document.createTreeWalker(r0,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement; if(!p||/^(SCRIPT|STYLE|TEXTAREA|OPTION|NOSCRIPT|TITLE)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT;
      const cs=getComputedStyle(p); if(cs.visibility==='hidden'||cs.display==='none') return NodeFilter.FILTER_REJECT;
      if(p.closest('.sr-only,[hidden],[aria-hidden="true"],pre,.oss-txt,#report,#printDoc,svg')) return NodeFilter.FILTER_REJECT; return NodeFilter.FILTER_ACCEPT}});
    while(tw.nextNode()){const n=tw.currentNode, t=n.nodeValue, blk=blockish(n.parentElement);
      if(/^(H1|H2|H3|H4|B|STRONG|BUTTON|LABEL|SUMMARY|TH)$/.test(blk.tagName)) continue;
      if(!by.has(blk)) by.set(blk,[]); const arr=by.get(blk);
      for(let i=0;i<t.length;i++){ if(/\s/.test(t[i])){ if(arr.length&&!arr[arr.length-1].sp) arr.push({c:' ',sp:1}); continue}
        rg.setStart(n,i); rg.setEnd(n,i+1); const rc=rg.getClientRects(); if(!rc.length||rc[0].width===0) continue;
        arr.push({c:n.parentElement.closest('sup')?'\u0001':t[i],sup:!!n.parentElement.closest('sup'),top:rc[0].top,left:rc[0].left,right:rc[0].right})}}   // 근거 칩·'?' 단추 글자는 자리만(경계 찾기는 앱과 같게)
  }
  const splits=[], shorts=[]; let units=0;
  for(const [blk,arr] of by){
    const cs=getComputedStyle(blk), lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.5;
    const W=blk.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight); if(W<=0) continue;
    const L0=blk.getBoundingClientRect().left+parseFloat(cs.paddingLeft)+parseFloat(cs.borderLeftWidth);
    const lineOf=x=>Math.round(x.top/(lh/2));
    const chars=arr.filter(x=>!x.sp); if(!chars.length) continue;
    const lines=[...new Set(chars.filter(x=>!x.sup).map(lineOf))].sort((a,b)=>a-b); if(lines.length<2) continue;
    // 짧은 줄: 마지막 줄을 뺀 줄이 폭의 45%도 못 채우고 끝남
    lines.slice(0,-1).forEach(l=>{const cs2=chars.filter(x=>lineOf(x)===l); const fill=(Math.max(...cs2.map(x=>x.right))-L0)/W; if(fill<0.45) shorts.push(cs2.map(x=>x.c).join('').slice(0,30))});
    // 말 덩어리: 쉼표·문장 끝 뒤 빈칸에서 나눔
    const text=arr.map(x=>x.c).join(''); const cuts=[0]; const re=/[,.?]\u0001*(?= )/g; let m; while((m=re.exec(text))) cuts.push(m.index+m[0].length+1); cuts.push(text.length);
    if(cuts.length<3) continue;
    for(let k=0;k<cuts.length-1;k++){const seg=arr.slice(cuts[k],cuts[k+1]).filter(x=>!x.sp&&!x.sup); /* 위첨자(근거 칩)는 줄 높이가 달라 줄 세기에서 뺌 */ const words=text.slice(cuts[k],cuts[k+1]).trim().split(' ').length; if(words<2||!seg.length) continue; units++;
      const ls=[...new Set(seg.map(lineOf))]; if(ls.length<2) continue;
      const wsum=ls.reduce((s,l)=>{const q=seg.filter(x=>lineOf(x)===l); return s+Math.max(...q.map(x=>x.right))-Math.min(...q.map(x=>x.left))},0)+(ls.length-1)*4+arr.slice(cuts[k],cuts[k+1]).filter(x=>x.sup).reduce((s,x)=>s+x.right-x.left,0)+(arr.slice(cuts[k],cuts[k+1]).some(x=>x.sup)?12:0);   // 근거 칩 폭(글자+안쪽 여백)도 더함
      const pv=arr.slice(0,cuts[k]).filter(x=>!x.sp&&!x.sup).pop(); const f0=pv&&lineOf(pv)===lineOf(seg[0])?(pv.right-L0)/W:0;   // 덩어리 바로 앞 글자까지 찬 비율. 55%도 안 되면 덩어리를 다음 줄로 넘기는 편이 앞 줄을 너무 짧게 만들므로 꺾여도 받아들임(앱과 같은 기준)
      if(wsum<=W*0.93&&(f0<0.02||f0>=0.55)) splits.push(text.slice(cuts[k],cuts[k+1]).trim()+' @'+(blk.className||blk.tagName))}
  }
  return {splits,shorts,units,blocks:by.size};
}
(async()=>{
  const b=await chromium.launch(); const tot={}; let screens=0;
  const W=(process.env.PHRASE_W||'320,360,390').split(',').map(Number);
  for(const w of W){ tot[w]={splits:[],shorts:[],units:0};
    const ctx=await b.newContext({viewport:{width:w,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready(); await p.waitForTimeout(200);
    for(const [name,fn,arg] of SCREENS){
      await p.evaluate(fn,arg); await p.waitForTimeout(120);
      const r=await p.evaluate(scan); screens++;
      for(const s of r.splits) tot[w].splits.push(`${name}: ${s}`); for(const s of r.shorts) tot[w].shorts.push(`${name}: ${s}`); tot[w].units+=r.units;
      await p.evaluate(()=>{try{closeSheet()}catch(e){} S.consent={date:today()}; S.onb="done"; SCR=null});
    }
    await ctx.close();
  }
  // WCAG 1.4.12 글자 간격: 사용자가 줄 간격·자간·낱말 간격을 넓혀도(그 상태로 다시 그림) 덩어리가 화면 밖으로 넘치거나 잘리지 않음
  {const ctx=await b.newContext({viewport:{width:320,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage(); await p.route(/^https?:/, r=>r.fulfill({body:''}));
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready();
    await p.addStyleTag({content:'*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}'});
    const bad=[];
    for(const [name,fn,arg] of SCREENS.filter(x=>['home','log','nutri','meal0','food-detail','set-about','set-data','qa'].includes(x[0]))){
      await p.evaluate(fn,arg); await p.waitForTimeout(120);
      const r=await p.evaluate(()=>{const W=document.documentElement.clientWidth; const over=document.documentElement.scrollWidth>W; const wide=[...document.querySelectorAll('.ph')].filter(e=>{const q=e.getBoundingClientRect(); return q.right>W+1||q.left<-1}).map(e=>e.textContent.slice(0,20)); return {over,wide,n:document.querySelectorAll('.ph').length}});
      if(r.over||r.wide.length) bad.push(`${name}: 넘침 ${r.over} ${r.wide.join('/')}`);
      await p.evaluate(()=>{try{closeSheet()}catch(e){} SCR=null})}
    need(!bad.length,`글자 간격을 넓혀도(WCAG 1.4.12) 320px에서 넘침 없음 ${bad.join(' | ')}`); await ctx.close()}
  // 접힌 내용은 펼칠 때 묶고, 폭이 바뀌면(돌림) 다시 잼
  {const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage(); await p.route(/^https?:/, r=>r.fulfill({body:''}));
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready();
    const r1=await p.evaluate(async()=>{SCR=null; S.tab="food"; render(); showFood("ramen"); const d=document.querySelector('#sheetRoot details.why-more'); if(!d) return -1; const before=d.querySelectorAll('.ph').length; d.open=true; await new Promise(r=>setTimeout(r,150)); return [before,d.querySelectorAll('.ph').length]});
    need(Array.isArray(r1)&&r1[1]>0,`판정 이유(접힌 내용)도 펼쳤을 때 말 덩어리로 묶여 있음 (${r1[1]}개. 크롬은 접힌 채로도 재고, 접힌 내용을 재지 못하는 브라우저는 펼칠 때 묶음)`);
    await p.evaluate(()=>{try{closeSheet()}catch(e){} SCR=null; S.tab="plan"; openScr("meal",{k:0})});
    await p.setViewportSize({width:320,height:844}); await p.waitForTimeout(500);
    const r2=await p.evaluate(()=>{const ph=[...document.querySelectorAll('#main .ph')]; return {n:ph.length,bad:ph.filter(e=>{const lh=parseFloat(getComputedStyle(e.parentElement).lineHeight); return e.getBoundingClientRect().height>lh*1.5}).map(e=>e.textContent.slice(0,20))}});
    need(r2.n>0&&!r2.bad.length,`390→320px로 폭이 바뀌면 다시 재어 두 줄로 꺾인 덩어리가 없음 (덩어리 ${r2.n}개, 꺾임 ${r2.bad.join(' / ')})`); await ctx.close()}
  await b.close();
  console.log(`\n훑은 화면 ${screens}개`);
  const LIM=JSON.parse(process.env.PHRASE_LIMIT||'{"split":4,"short":{"320":32,"360":10,"390":8}}');
  for(const w of W){const t=tot[w];
    need(t.splits.length<=LIM.split,`폭 ${w}px: 한 줄에 들어가는데 두 줄에 걸친 말 덩어리 ${t.splits.length}곳 (덩어리 ${t.units}개 중, ${LIM.split} 이하)`); t.splits.slice(0,process.env.PHRASE_ALL?999:12).forEach(m=>console.log('    '+m));
    need(t.shorts.length<=(LIM.short[w]??40),`폭 ${w}px: 폭의 45%도 못 채운 중간 줄 ${t.shorts.length}곳 (${LIM.short[w]??40} 이하)`); t.shorts.slice(0,process.env.PHRASE_ALL?999:6).forEach(m=>console.log('    '+m));}
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exitCode=1});
