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
// 사용자가 적은 글자(<, ", &, 태그)가 어느 화면에서도 코드로 해석되지 않는지
const { chromium } = require('playwright'); const fs=require('fs');

// 검증용: 출력한 줄을 모아 두고 끝에서 기대값과 비교한다(v1.5.0)
const __LOG=[]; {const __o=console.log; console.log=(...a)=>{__LOG.push(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ')); __o(...a)}}
const logOf=k=>{const l=__LOG.find(x=>x===k||x.startsWith(k+' ')); return l==null?null:l.slice(k.length).trim()};
const jsonOf=k=>{const v=logOf(k); if(v==null) return null; try{return JSON.parse(v)}catch(e){return v}};
const lineJSON=pre=>{const l=__LOG.find(x=>x.startsWith(pre)); if(l==null) return null; try{return JSON.parse(l)}catch(e){return null}};
const FAILS=[]; const expect=(c,m)=>{let ok=false; try{ok=typeof c==='function'?!!c():!!c}catch(e){m+=' ('+e.message+')'} if(!ok) FAILS.push(m)};
const __done=()=>{ if(FAILS.length){ console.error('FAIL\n'+FAILS.join('\n')); process.exitCode=1 } else console.log('검증 통과') };
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('inj.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
const PAY='<img src=x onerror="window.__xss=1">"\'&<b class="inj">굵게</b>';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('inj.html'));await p.waitForTimeout(400);
await p.evaluate((P)=>{S.consent={date:today()};
  S.profile.dislikes=P+", 고등어"; S.profile.allergyOther=P; S.profile.medOther=P; S.orders.other=[P]; S.orders.checked=["lowres"];
  S.triggers.push({name:P,foodId:null,date:today(),source:P,sym:["gas"],never:false});
  const d=today(); S.logs[d]={date:d,day:2,night:0,bloody:0,urg:0,blood:0,well:0,extra:[],pain:0,gas:"없음",fatigue:"없음",temp:"",pulse:"",other:[P],memo:P,stool:4,medtaken:1};
  S.ratings.push({date:d,slot:"외식",title:P,foodId:null,name:P,rating:"bad"});
  S.extras[d]=[{name:P,id:null,g:100}]; S.foodQ=P; render()},PAY);
const views=[
 ()=>{SCR=null;S.tab="plan";render()}, ()=>{SCR=null;S.tab="log";render()},
 ()=>{SCR=null;S.tab="food";S.foodSub="search";render()}, ()=>{S.foodSub="menu";MJ.text=PAY_;render()}, ()=>{S.foodSub="label";render()},
 ()=>{S.tab="plan";openScr("nutri")}, ()=>{SCR=null;S.tab="me";render()},
 ...["set-profile","set-diet","set-allergy","set-meds","set-orders","set-trig","set-weight","set-stage","set-data","set-about"].map(n=>new Function(`SCR={name:"${n}"};render()`)),
 ()=>{SCR={name:"past",date:today()};render()}, ()=>{SCR={name:"pdf"};render()}, ()=>{SCR={name:"reintro"};render()},
 ()=>{QAV={q:PAY_,cat:"전체",open:null};SCR={name:"qa"};render()}, ()=>{QAV={q:"",cat:"전체",open:"dairy"};SCR={name:"qa"};render()},
 ()=>{SCR=null;S.tab="plan";render(); const c=document.querySelector('.mrow[data-k="0"]'); if(c) c.click()},
];
const bad=[];
await p.evaluate(P=>{window.PAY_=P},PAY);
for(let i=0;i<views.length;i++){
  const src=views[i].toString().replace(/PAY_/g,'window.PAY_');
  await p.evaluate(src.startsWith('function')?`(${src})()`:`(${src})()`).catch(e=>bad.push('view'+i+' '+e.message.slice(0,80)));
  await p.waitForTimeout(60);
  const r=await p.evaluate(()=>({img:!!document.querySelector('img[src="x"]'),b:!!document.querySelector('b.inj'),xss:!!window.__xss,shown:document.body.innerText.includes('굵게</b>')}));
  if(r.img||r.b||r.xss) bad.push(['view'+i,r]);
}
// 메뉴 판정·라벨 검사에 직접 넣어 보기
await p.evaluate(P=>{SCR=null;S.tab="food";S.foodSub="menu";MJ.text=P;render()},PAY);
await p.click('[data-act=mjText]').catch(e=>bad.push('mjText '+e.message.slice(0,60))); await p.waitForTimeout(200);
let r=await p.evaluate(()=>({img:!!document.querySelector('img[src="x"]'),b:!!document.querySelector('b.inj'),xss:!!window.__xss})); if(r.img||r.b||r.xss) bad.push(['menu',r]);
await p.evaluate(P=>{S.foodSub="label";LB.text=P;LB.name=P;render()},PAY);
const lbBtn=await p.$('[data-act=lbCheck]')||await p.$('[data-act=lbText]'); if(lbBtn){await lbBtn.click().catch(()=>{}); await p.waitForTimeout(200)}
r=await p.evaluate(()=>({img:!!document.querySelector('img[src="x"]'),b:!!document.querySelector('b.inj'),xss:!!window.__xss})); if(r.img||r.b||r.xss) bad.push(['label',r]);
// 음식 정보 시트(사유 문구에 적은 글자가 들어감)
await p.evaluate(()=>{S.foodSub="search";S.foodQ="고등어";render(); showFood("mackerel")}); await p.waitForTimeout(100);
r=await p.evaluate(()=>({img:!!document.querySelector('img[src="x"]'),b:!!document.querySelector('b.inj'),xss:!!window.__xss,sheet:(document.querySelector('#sheetRoot')?.innerText||'').slice(0,90)})); if(r.img||r.b||r.xss) bad.push(['foodSheet',r]);
console.log('sheet',r.sheet);
console.log('bad',JSON.stringify(bad)); console.log('errors',errs); expect(()=>jsonOf('bad').length===0,'주입 문자열이 실행됨'); expect(()=>/고등어/.test(logOf('sheet')),'시트 표시');
__done(); await b.close();})();
