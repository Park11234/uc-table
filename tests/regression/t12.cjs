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
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('t12.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t12.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today()};S.orders.checked=['liquid'];render()});
console.log('liquid', JSON.stringify(await p.evaluate(()=>S.plan.days.slice(0,2).map(d=>d.meals.map(m=>m.title+(m.empty?'(e)':''))))));
await p.evaluate(()=>{S.orders.checked=[];for(let i=0;i<14;i++){if(i%4===3)continue;S.logs[addDays(today(),-i)]={day:2+(i%5),night:i%3?0:1,bloody:i<4?i%2:0,urg:i%3,blood:i<4?1:0,well:1,extra:[],pain:2,gas:"약간",fatigue:"없음",temp:"",pulse:"",other:[],memo:""}};S.weights=[{date:today(),kg:55}];S.water[today()]=4;render()});
await p.waitForTimeout(300); await p.screenshot({path:T('t12_plan.png'),fullPage:true});
await p.click('.mrow[data-k="1"]'); await p.waitForTimeout(350); await p.screenshot({path:T('t12_meal.png'),fullPage:true});
await p.click('[data-act=back]'); await p.click('.tab[data-tab=log]'); await p.waitForTimeout(350); await p.screenshot({path:T('t12_log.png'),fullPage:true});
await p.evaluate(()=>openScr('nutri')); await p.waitForTimeout(350); await p.screenshot({path:T('t12_nutri.png'),fullPage:true});
// chart preview
await p.evaluate(()=>{const d=document.createElement('div');d.id='chartTest';d.style.cssText='position:fixed;left:0;top:0;background:#fff;z-index:99;width:760px';d.innerHTML='<div class="blk" style="padding:14px 32px"><h2>SCCAI 추이</h2><canvas data-chart="sccai" width="1392" height="460" style="width:696px;height:230px;display:block"></canvas></div>';document.body.appendChild(d);drawSccaiChart(d.querySelector('canvas'),addDays(today(),-13),14)});
await p.setViewportSize({width:760,height:320}); await p.screenshot({path:T('t12_chart.png')});
console.log(errs); {const l=jsonOf('liquid'); expect(()=>l.length===2&&l.every(d=>d.length===3&&d.every(t=>!/\(e\)$/.test(t))),'유동식 지시 예시 식단');}
__done(); await b.close()})();
