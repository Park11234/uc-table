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
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:360,height:780}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('t8.html')); await p.evaluate(()=>{S.consent={date:today()};render()});
await p.waitForTimeout(400);
for(const f of ['md','xl']){
 await p.evaluate(f=>{S.fontSize=f;render()},f);
 for(const t of ['plan','log','food','nutri','me']){if(t==='nutri') await p.evaluate(()=>{S.tab='plan';openScr('nutri')}); else {await p.evaluate(()=>{if(SCR) closeScr()}); await p.click(`.tab[data-tab=${t}]`)};await p.waitForTimeout(80);
   await p.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))));   // 넘어가는 효과(옆으로 미끄러짐)가 끝난 뒤 잰다
   const w=await p.evaluate(()=>{const W=document.documentElement.clientWidth;const bad=[...document.querySelectorAll('#main *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>W+1&&!e.closest('.days,.cats,.tbl-wrap')}).slice(0,3).map(e=>e.className+':'+Math.round(e.getBoundingClientRect().right));return [document.documentElement.scrollWidth,W,bad]});
   console.log(f,t,JSON.stringify(w));}
}
await p.screenshot({path:T('t8_me_xl.png'),fullPage:true});
console.log(errs);{const ls=__LOG.filter(x=>/^(md|xl) (plan|log|food|nutri|me) /.test(x)); expect(ls.length===10,'화면 수 '+ls.length);
 for(const l of ls) expect(()=>JSON.parse(l.split(' ').slice(2).join(' '))[2].length===0,'가로 넘침 '+l);}
__done(); await b.close()})();
