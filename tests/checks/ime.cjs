const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const __written=new Set(); const __wfs=fs_.writeFileSync.bind(fs_);
fs_.writeFileSync=(p,...a)=>{ try{__written.add(path.resolve(String(p)))}catch(e){} return __wfs(p,...a) };
// 이 점검이 직접 만든 파일이 아니면 매번 현재 앱으로 새로 만든다(옛 빌드를 검사하는 일 방지)
const WRAP=n=>{const p=T(n); if(!__written.has(path.resolve(p))) __wfs(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
// 공통 안전장치: 어느 페이지에서든 잡히지 않은 오류(pageerror)가 나면 이 점검을 실패로 끝낸다
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}
// 한글 IME 조합(ㅇ→우→웅→우+유)을 CDP로 흉내 내 입력칸마다 '우유'가 되는지, 조합 중 입력칸이 교체되는지 확인
const { chromium } = require('playwright'); const fs=require('fs');

// 검증용: 출력한 줄을 모아 두고 끝에서 기대값과 비교한다(v1.5.0)
const __LOG=[]; {const __o=console.log; console.log=(...a)=>{__LOG.push(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ')); __o(...a)}}
const logOf=k=>{const l=__LOG.find(x=>x===k||x.startsWith(k+' ')); return l==null?null:l.slice(k.length).trim()};
const jsonOf=k=>{const v=logOf(k); if(v==null) return null; try{return JSON.parse(v)}catch(e){return v}};
const lineJSON=pre=>{const l=__LOG.find(x=>x.startsWith(pre)); if(l==null) return null; try{return JSON.parse(l)}catch(e){return null}};
const FAILS=[]; const expect=(c,m)=>{let ok=false; try{ok=typeof c==='function'?!!c():!!c}catch(e){m+=' ('+e.message+')'} if(!ok) FAILS.push(m)};
const __done=()=>{ if(FAILS.length){ console.error('FAIL\n'+FAILS.join('\n')); process.exitCode=1 } else console.log('검증 통과') };
const body=fs.readFileSync(process.argv[2]||APP,'utf8');
fs.writeFileSync(T('ime.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('ime.html'));await p.waitForTimeout(400);
const cdp=await p.context().newCDPSession(p);
async function typeKo(sel){
  await p.focus(sel);
  await p.evaluate(s=>{const el=document.querySelector(s); el.__mark=1},sel);
  const st=async t=>{await cdp.send('Input.imeSetComposition',{text:t,selectionStart:t.length,selectionEnd:t.length}); await p.waitForTimeout(40)};
  await st('ㅇ'); await st('우'); await st('웅');
  await cdp.send('Input.insertText',{text:'우'}); await p.waitForTimeout(40);
  await st('유'); await cdp.send('Input.insertText',{text:'유'}); await p.waitForTimeout(120);
  return p.evaluate(s=>{const el=document.querySelector(s); return {value:el?el.value:null, same:!!(el&&el.__mark)}},sel);
}
const res={};
const go=async(fn)=>{await p.evaluate(fn); await p.waitForTimeout(150)};
await go(()=>{S.consent={date:today()};SCR=null;S.tab="food";S.foodSub="search";S.foodQ="";render()});
res.foodQ=await typeKo('#foodQ');
res.foodResults=await p.evaluate(()=>[...document.querySelectorAll('.fcard b')].map(x=>x.textContent).slice(0,4));
await go(()=>{S.foodQ="";S.tab="me";SCR=null;render();openTrigPicker()});
res.tpQ=await typeKo('#tpQ');
await go(()=>{closeSheet();SCR={name:"set-profile"};render()});
for(const id of ['p_dislikes','p_allergyOther','p_medOther']) if(await p.$('#'+id)) res[id]=await typeKo('#'+id);
await go(()=>{SCR={name:"set-orders"};render()});
if(await p.$('#orderAdd')) res.orderAdd=await typeKo('#orderAdd');
await go(()=>{SCR=null;S.tab="log";render();openWizard();WZ.step=wzStepOf("other");render()});
if(await p.$('#otherAdd')) res.otherAdd=await typeKo('#otherAdd');
if(await p.$('#memo')) res.memo=await typeKo('#memo');
await go(()=>{wizardDirty=()=>false;draft=null;SCR=null;S.tab="food";S.foodSub="menu";render()});
if(await p.$('#mjText')) res.mjText=await typeKo('#mjText');
await go(()=>{S.foodSub="label";render()});
if(await p.$('#lbText')) res.lbText=await typeKo('#lbText');
console.log(JSON.stringify(res,null,0).replace(/},/g,'},\n'));
console.log('errors',errs);
{const j=lineJSON('{"foodQ"'); expect(j,'출력 없음'); for(const [k,v] of Object.entries(j||{})) if(k!=='foodResults') expect(()=>v.same===true,'입력 유지 '+k);
 expect(()=>j.foodResults.includes('우유'),'검색 결과');}
__done(); await b.close();})();
