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
const rateOpen=async p=>{const b=await p.$('[data-act=rateOpen]'); if(b){await b.click(); await p.waitForTimeout(80)}}; // v1.8.0 평가 버튼은 '불편했던 음식 고르기'를 눌러야 보임
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('t15.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t15.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today()};render()});
// wizard: urg step next disabled until answered
await p.evaluate(()=>{openWizard();WZ.step=WSTEPS.findIndex(s=>s.k==="urg");render()});
console.log('nextDisabled',await p.evaluate(()=>[document.querySelector('[data-act=wzNext]').disabled,[...document.querySelectorAll('[data-act=set]')].map(b=>b.getAttribute('aria-pressed'))]));
await p.click('[data-act=set][data-k=urg][data-v="0"]');
console.log('afterPick',await p.evaluate(()=>[document.querySelector('[data-act=wzNext]').disabled,WZ.step]));
// result banner order
await p.evaluate(()=>{draft.temp="37.8";WZ.step=WSTEPS.length-1;render()});
console.log('order',await p.evaluate(()=>{const m=document.querySelector('#main');const b=m.querySelector('.banner.crit'),c=m.querySelector('.card.result');return b&&c&&(b.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING)}));
await p.screenshot({path:T('w_res.png')});
// existing log: all answered
await p.evaluate(()=>{S.logs[today()]={...BLANK_LOG(),day:2};openWizard();WZ.step=WSTEPS.findIndex(s=>s.k==="urg");render()});
console.log('existing',await p.evaluate(()=>document.querySelector('[data-act=wzNext]').disabled));
// taste only -> dislikes
await p.evaluate(()=>{wizardDirty=()=>false;SCR=null;S.logs={};S.plan=null;S.tab="plan";render()});
await p.click('.mrow[data-k="0"]'); await p.waitForTimeout(300);
await rateOpen(p); const rated=await p.evaluate(()=>{const g=document.querySelector('[data-act=rateSet][data-j="0"]').closest('[role=group]'); return g.getAttribute('aria-label').replace(/ 평가$/,'')}); console.log('rated',JSON.stringify(rated));
await rateOpen(p); await p.click('[data-act=rateSet][data-j="0"][data-v=bad]'); await p.click('[data-act=rateSave]'); await p.waitForTimeout(200);
await p.click('[data-act=badSym][data-v=taste]');
console.log('tasteUI',await p.evaluate(()=>[BAD.list[0].dec,!!document.querySelector('[data-act=badDec]'),document.querySelector('#sheetRoot').textContent.includes('싫어하는 음식')]));
await p.screenshot({path:T('w_taste.png')});
await p.click('[data-act=badSave]'); await p.waitForTimeout(200);
console.log('result',await p.evaluate(()=>[S.profile.dislikes,S.triggers.length,menuFoods().some(f=>f.id==="rice_porridge")]));
console.log(errs);expect(()=>jsonOf('nextDisabled')[0]===true,'답하기 전 다음 막기'); expect(()=>jsonOf('afterPick')[0]===false,'답한 뒤 다음');
expect(()=>jsonOf('existing')===false,'저장된 기록은 답한 것으로'); expect(()=>{const t=jsonOf('tasteUI'); return t[0]==='dislike'&&t[2]===true},'맛만 나쁨');
expect(()=>{const r=jsonOf('result'); return r[0].includes(String(jsonOf('rated')).split('(')[0].trim())&&r[1]===0},'싫어하는 음식에 추가');   // 앱은 괄호 앞 이름만 넣음(예: '누룽지(마른 무게, 끓여서)' → '누룽지')   // 날짜마다 첫 메뉴가 달라 평가한 음식 이름으로 확인(v1.6.2)
__done(); await b.close()})();
