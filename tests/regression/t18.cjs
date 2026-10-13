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
const { chromium } = require('playwright'); const fs=require('fs');

// 검증용: 출력한 줄을 모아 두고 끝에서 기대값과 비교한다(v1.5.0)
const __LOG=[]; {const __o=console.log; console.log=(...a)=>{__LOG.push(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ')); __o(...a)}}
const logOf=k=>{const l=__LOG.find(x=>x===k||x.startsWith(k+' ')); return l==null?null:l.slice(k.length).trim()};
const jsonOf=k=>{const v=logOf(k); if(v==null) return null; try{return JSON.parse(v)}catch(e){return v}};
const lineJSON=pre=>{const l=__LOG.find(x=>x.startsWith(pre)); if(l==null) return null; try{return JSON.parse(l)}catch(e){return null}};
const FAILS=[]; const expect=(c,m)=>{let ok=false; try{ok=typeof c==='function'?!!c():!!c}catch(e){m+=' ('+e.message+')'} if(!ok) FAILS.push(m)};
const __done=()=>{ if(FAILS.length){ console.error('FAIL\n'+FAILS.join('\n')); process.exitCode=1 } else console.log('검증 통과') };
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:360,height:740}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('t17.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today()};for(let i=0;i<3;i++){const d=addDays(today(),-i);S.logs[d]={date:d,day:1,night:0,bloody:0,urg:0,blood:0,well:0,extra:[],pain:0,gas:"없음",fatigue:"없음",temp:"",pulse:"",other:[],memo:""}}render()});
console.log('stage', await p.evaluate(()=>currentStage().stage));
// 예시 식단의 짠 식품은 한 끼 상한(SALTY_CAP, 40g) 안에서만(날짜마다 고르는 메뉴가 달라 짠 식품 자체는 나올 수 있음)
console.log('H sample', await p.evaluate(()=>samplePlan().days.flatMap(d=>d.meals.flatMap(m=>m.items.filter(([id,g])=>FOOD[id].tags.includes("salty")&&id!=="ons"&&g>SALTY_CAP))).slice(0,5)));
// same-button repeat (answered step: extra=multi, always enabled)
await p.evaluate(()=>{SCR=null;openWizard();WZ.step=WSTEPS.findIndex(s=>s.k==="extra");render()});
const nb=await p.locator('[data-act=wzNext]').boundingBox();
await p.mouse.click(nb.x+nb.width/2, nb.y+nb.height/2);
const s1=await p.evaluate(()=>WZ.step);
await p.mouse.click(nb.x+nb.width/2, nb.y+nb.height/2);
console.log('B same-button', s1, await p.evaluate(()=>[WZ.step, WSTEPS[WZ.step].k]));
// tab bar double tap still fine
await p.evaluate(()=>{wizardDirty=()=>false;SCR=null;draft=null;S.tab="plan";render()});
const tb=await p.locator('.tab[data-tab=log]').boundingBox();
await p.mouse.click(tb.x+tb.width/2, tb.y+tb.height/2); await p.mouse.click(tb.x+tb.width/2, tb.y+tb.height/2);
console.log('tab dbl', await p.evaluate(()=>[S.tab, !!document.querySelector('#main').textContent.trim()]));
console.log('errors',errs); expect(()=>+logOf('stage')===3,'단계'); expect(()=>jsonOf('H sample').length===0,'예시 식단 짠 식품이 한 끼 상한을 넘음');
expect(()=>{const t=jsonOf('tab dbl'); return t[1]===true},'탭 연타');
__done(); await b.close()})();
