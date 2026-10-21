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

/* 수정 요청서 v2 항목 5·10: 앱 전체 줄바꿈 점검.
   화면 글자를 한 글자씩 훑어, 같은 문단 안에서 줄이 바뀌는 자리를 찾는다. 다음은 허용하지 않는다.
   1) 띄어쓰기 없이 '·'로 이은 14자 이하 말이 '·' 뒤에서 갈라짐(주치의·/영양사와)
   2) 줄 끝에 '라벨:'만 남고 값이 다음 줄로 감(묶음 24자 이하)
   3) 문단 마지막 줄에 짧은 한 낱말만 남는 곳이 몇 곳을 넘음(근거 칩은 제외. text-wrap:pretty·balance가 줄이는 범위)
   제목(b·h1~h4)·오픈소스 라이선스 원문(pre)은 대상이 아님. 폭 360·412·700에서 모든 주요 화면을 본다. */
const { chromium } = require('playwright');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const BODY=fs_.readFileSync(APP,'utf8');
const page=T('wrap.html');
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
// 페이지 안에서 실행: 화면 글자를 훑어 어색한 줄 나눔을 모아 돌려준다
function scan(){
  const sels=[document.querySelector('#main'),document.querySelector('.appbar'),document.querySelector('#toasts')].filter(Boolean);
  const blockish=el=>{for(let e=el;e&&e!==document.body;e=e.parentElement){const d=getComputedStyle(e).display; if(!d.startsWith('inline')&&d!=='contents') return e} return document.body};
  const chars=[]; const rg=document.createRange();
  for(const r0 of sels){
    const tw=document.createTreeWalker(r0,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement; if(!p||/^(SCRIPT|STYLE|TEXTAREA|OPTION|NOSCRIPT|TITLE)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT; if(!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const cs=getComputedStyle(p); if(cs.visibility==='hidden'||cs.display==='none') return NodeFilter.FILTER_REJECT;
      if(p.closest('.sr-only,[hidden],[aria-hidden="true"],sup.ref')) return NodeFilter.FILTER_REJECT; return NodeFilter.FILTER_ACCEPT}});
    while(tw.nextNode()){const n=tw.currentNode, t=n.nodeValue, blk=blockish(n.parentElement); const skip=!!n.parentElement.closest('b,strong,h1,h2,h3,h4,pre,.oss-txt');
      for(let i=0;i<t.length;i++){ if(/\s/.test(t[i])) {chars.push({sp:1,blk}); continue}
        rg.setStart(n,i); rg.setEnd(n,i+1); const rc=rg.getClientRects(); if(!rc.length||rc[0].width===0) continue;
        const r=rc[0]; chars.push({c:t[i],top:Math.round(r.top),left:r.left,right:r.right,blk,skip})}}
  }
  const tok=(k,dir)=>{let s=''; for(let j=k;chars[j]&&!chars[j].sp&&chars[j].blk===chars[k].blk;j+=dir){s=dir>0?s+chars[j].c:chars[j].c+s} return s};
  const dots=[],colons=[],orph=[];
  let prev=null,pk=-1;
  for(let k=0;k<chars.length;k++){const x=chars[k]; if(x.sp) continue;
    if(prev&&prev.blk===x.blk&&x.top-prev.top>4&&!prev.skip&&!x.skip){
      const adjacent=(k===pk+1); const before=tok(pk,-1), after=tok(k,1);
      if(prev.c==='·'&&adjacent){ const run=before+after; if(run.length<=14) dots.push(run+' @'+(x.blk.className||x.blk.tagName)) }
      if(prev.c===':'&&!/^https?:/.test(before)){ const pair=before+' '+after; if(pair.length<=24) colons.push(pair+' @'+(x.blk.className||x.blk.tagName)) } }
    prev=x; pk=k}
  const by=new Map(); chars.forEach((x,k)=>{if(x.sp) return; if(!by.has(x.blk)) by.set(x.blk,[]); by.get(x.blk).push(k)});
  for(const [blk,ks] of by){ if(ks.some(k=>chars[k].skip)) continue; const tops=[...new Set(ks.map(k=>chars[k].top))].sort((a,b)=>a-b); if(tops.length<2) continue;
    const last=tops[tops.length-1]; const lk=ks.filter(k=>chars[k].top===last); const lt=lk.map(k=>chars[k].c).join('');
    let hasSpace=false; for(let j=lk[0];j<=lk[lk.length-1];j++){if(chars[j]&&chars[j].sp){hasSpace=true;break}}
    const wa=Math.max(...ks.map(k=>chars[k].right))-Math.min(...ks.map(k=>chars[k].left)); const wl=Math.max(...lk.map(k=>chars[k].right))-Math.min(...lk.map(k=>chars[k].left));
    if(!hasSpace&&wl<wa*0.3&&lt.length<=8) orph.push(lt+' @'+(blk.className||blk.tagName)+' ← '+ks.slice(-24).map(k=>chars[k].c).join('')) }
  return {dots,colons,orph,n:chars.length};
}
(async()=>{
  const b=await chromium.launch(); const tot={dots:[],colons:[],orph:[]}; let screens=0;
  for(const w of [360,412,700]){
    const ctx=await b.newContext({viewport:{width:w,height:844},isMobile:w<700,hasTouch:w<700}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); await p.evaluate(SEED); await p.reload(); await ready(); await p.waitForTimeout(200);
    for(const [name,fn,arg] of SCREENS){
      await p.evaluate(fn,arg); await p.waitForTimeout(100);
      const r=await p.evaluate(scan); screens++;
      need(r.n>20,`폭 ${w}px ${name}: 글자 ${r.n}개를 훑음`);
      for(const k of ['dots','colons','orph']) for(const m of r[k]) tot[k].push(`${w}/${name}: ${m}`);
      await p.evaluate(()=>{S.consent={date:today()}; S.onb="done"; SCR=null});
    }
    await ctx.close();
  }
  await b.close();
  console.log(`\n훑은 화면 ${screens}개`);
  need(tot.dots.length===0,`'·'로 이은 짧은 말이 줄 끝에서 갈라진 곳 ${tot.dots.length}곳 (0이어야 함)`); tot.dots.slice(0,15).forEach(m=>console.log('    '+m));
  need(tot.colons.length===0,`'라벨:' 만 줄 끝에 남은 곳 ${tot.colons.length}곳 (0이어야 함)`); tot.colons.slice(0,15).forEach(m=>console.log('    '+m));
  need(tot.orph.length<=8,`문단 마지막 줄에 짧은 한 낱말만 남은 곳 ${tot.orph.length}곳 (고치기 전 84곳, 지금 3곳. 8곳 이하)`); tot.orph.slice(0,15).forEach(m=>console.log('    '+m));
  if(F.length){console.log('\nFAIL '+F.length+'개'); process.exit(1)} console.log('\n검증 통과');
})().catch(e=>{console.error(e); process.exit(1)});
