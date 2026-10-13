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
// 입력만 하고(확정 전) 같은 화면에서 다른 조작으로 화면이 다시 그려질 때 입력값이 남는지
const { chromium } = require('playwright'); const fs=require('fs');

// 검증용: 출력한 줄을 모아 두고 끝에서 기대값과 비교한다(v1.5.0)
const __LOG=[]; {const __o=console.log; console.log=(...a)=>{__LOG.push(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ')); __o(...a)}}
const logOf=k=>{const l=__LOG.find(x=>x===k||x.startsWith(k+' ')); return l==null?null:l.slice(k.length).trim()};
const jsonOf=k=>{const v=logOf(k); if(v==null) return null; try{return JSON.parse(v)}catch(e){return v}};
const lineJSON=pre=>{const l=__LOG.find(x=>x.startsWith(pre)); if(l==null) return null; try{return JSON.parse(l)}catch(e){return null}};
const FAILS=[]; const expect=(c,m)=>{let ok=false; try{ok=typeof c==='function'?!!c():!!c}catch(e){m+=' ('+e.message+')'} if(!ok) FAILS.push(m)};
const __done=()=>{ if(FAILS.length){ console.error('FAIL\n'+FAILS.join('\n')); process.exitCode=1 } else console.log('검증 통과') };
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('ret.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('ret.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today()};render()});
const screens=[
 ['food-search',()=>{SCR=null;S.tab="food";S.foodSub="search";render()}],
 ['food-menu',()=>{SCR=null;S.tab="food";S.foodSub="menu";render()}],
 ['food-label',()=>{SCR=null;S.tab="food";S.foodSub="label";render()}],
 ['set-profile',()=>{S.tab="me";SCR=null;openScr("set-profile")}],   // 편집 초안(PE)으로 열기(v1.7.1)
 ['set-diet',()=>{S.tab="me";SCR=null;openScr("set-diet")}],   // 편집 초안(PE)으로 열기(v1.7.1)
 ['qa',()=>{SCR=null;qaGo("")}],
 ['set-allergy',()=>{S.tab="me";SCR=null;openScr("set-allergy")}],   // 편집 초안(PE)으로 열기(v1.7.1)
 ['set-meds',()=>{S.tab="me";SCR=null;openScr("set-meds")}],   // 편집 초안(PE)으로 열기(v1.7.1)
 ['set-orders',()=>{S.tab="me";S.orders.checked=["fluid"];SCR=null;openScr("set-orders")}],
 ['set-weight',()=>{S.tab="me";SCR={name:"set-weight"};render()}],
 ['wizard-other',()=>{SCR=null;S.tab="log";render();openWizard();WZ.step=WSTEPS.findIndex(s=>s.k==="other");render()}],
 ['wizard-temp',()=>{WZ.step=WSTEPS.findIndex(s=>s.k==="vitals");render()}],
 ['asks',()=>{SCR=null;S.tab="log";openScr("asks")}],   // v1.8.0 진료 때 물어볼 것
 ['set-goals',()=>{S.tab="me";SCR=null;openScr("set-goals")}],   // v1.8.0 목표 직접 정하기
 ['onboard-step',()=>{SCR=null;S.onb="1";render()}],   // v1.8.0 첫 실행 설정 1단계
];
const out={};
for(const [nm,fn] of screens){
  await p.evaluate(fn); await p.waitForTimeout(80);
  await p.evaluate(()=>document.querySelectorAll('#main details').forEach(d=>d.open=true));   // 접힌 칸(제품 영양정보 표 등)도 확인(v1.7.0)
  const ids=await p.evaluate(()=>[...document.querySelectorAll('#main input:not([type=file]):not([type=checkbox]):not([type=range]):not([type=date]),#main textarea')].filter(e=>e.id&&!e.readOnly).map(e=>[e.id,e.type]));
  for(const [id,ty] of ids){ await p.fill('#'+id, ty==='number'?'77':'마커'); }
  // 같은 화면을 다시 그림(다른 버튼·스위치를 눌렀을 때와 같은 효과)
  await p.evaluate(()=>render()); await p.waitForTimeout(60);
  out[nm]=await p.evaluate(ids=>ids.map(([id,ty])=>{const e=document.getElementById(id); return [id, e?e.value:'(없음)']}),ids);
}
for(const [k,v] of Object.entries(out)) console.log(k.padEnd(13), JSON.stringify(v));
console.log('errors',errs); {const ls=__LOG.filter(x=>/^[a-z-]+ +\[\[/.test(x)); expect(ls.length===15,'화면 수 '+ls.length);
 for(const l of ls){const nm=l.split(' ')[0]; const v=JSON.parse(l.slice(l.indexOf('[['))); for(const [id,val] of v) expect(()=>val==='마커'||val==='77','다시 그려도 입력 유지 '+nm+':'+id+'='+val)}}
__done(); await b.close();})();
