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
const { chromium } = require('playwright');

// 검증용: 출력한 줄을 모아 두고 끝에서 기대값과 비교한다(v1.5.0)
const __LOG=[]; {const __o=console.log; console.log=(...a)=>{__LOG.push(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ')); __o(...a)}}
const logOf=k=>{const l=__LOG.find(x=>x===k||x.startsWith(k+' ')); return l==null?null:l.slice(k.length).trim()};
const jsonOf=k=>{const v=logOf(k); if(v==null) return null; try{return JSON.parse(v)}catch(e){return v}};
const lineJSON=pre=>{const l=__LOG.find(x=>x.startsWith(pre)); if(l==null) return null; try{return JSON.parse(l)}catch(e){return null}};
const FAILS=[]; const expect=(c,m)=>{let ok=false; try{ok=typeof c==='function'?!!c():!!c}catch(e){m+=' ('+e.message+')'} if(!ok) FAILS.push(m)};
const __done=()=>{ if(FAILS.length){ console.error('FAIL\n'+FAILS.join('\n')); process.exitCode=1 } else console.log('검증 통과') };
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
const fs=require('fs'); const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('t5.html'),'<!doctype html><html><head><meta charset="utf-8"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t5.html'));await p.waitForTimeout(600);await p.evaluate(()=>{S.consent={date:today()};render()});
await p.evaluate(()=>{S.profile.allergies=['peach'];render()});
await p.click('.tab[data-tab=food]'); await p.click('[data-act=foodSub][data-v=label]');
// v1.7.0: 사진 판독 대신 포장의 원재료명·알레르기 표시를 옮겨 적는다
await p.fill('#lbName','딸기 요거트 음료');
await p.fill('#lbText','정제수, 백설탕, 딸기과즙, 탈지분유, 카라기난, 수크랄로스(감미료), D-솔비톨액, 메타중아황산나트륨, 이눌린\n우유, 대두, 복숭아 함유');
await p.click('[data-act=lbCheck]'); await p.waitForTimeout(300);
console.log(await p.evaluate(()=>JSON.stringify({o:lbCombine().overall,name:LB.name,rows:LB.res.rows.map(r=>[r.lv,r.title,r.found])})));
await p.click('[data-act=lbReset]');
await p.fill('#lbText','쌀, 정제소금'); await p.click('[data-act=lbCheck]');
console.log(await p.evaluate(()=>JSON.stringify(LB.res)));
await p.click('[data-act=lbReset]');
await p.fill('#lbText','정제수, 카라기난, 복숭아과즙'); await p.click('[data-act=lbCheck]'); await p.waitForTimeout(400);
console.log(await p.evaluate(()=>JSON.stringify(LB.res.rows.map(r=>[r.lv,r.title,r.found]))));
await p.screenshot({path:T('lb.png'),fullPage:true});
console.log('errors',errs); {const a=lineJSON('{"o":'); expect(()=>a.o==='avoid'&&a.name==='딸기 요거트 음료'&&a.rows.some(r=>r[1]==='내 알레르기 원재료'&&r[2].includes('복숭아')),'복숭아 알레르기');
 for(const t of ['인공감미료','당알코올(폴리올)','프럭탄(이눌린·프락토올리고당)','카라기난(증점제)']) expect(()=>a.rows.some(r=>r[1]===t),'원재료 점검 '+t);
 const b2=lineJSON('{"overall"'); expect(()=>b2.overall==='ok','쌀·소금은 문제없음');
 const c3=lineJSON('[["'); expect(()=>c3[0][0]==='avoid'&&c3.some(r=>r[1]==='카라기난(증점제)'),'세 번째 원재료');}
__done(); await b.close()})();
