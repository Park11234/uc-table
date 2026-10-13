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
// 키보드가 올라와 화면이 낮아졌을 때(390x440) 입력칸에 초점을 주면, 입력칸이 하단 고정 버튼·탭에 가려지지 않는지
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
await p.goto('file://'+WRAP('fin.html'));await p.waitForTimeout(400);
const cases=[
 ['wizard memo','#memo',()=>{S.consent={date:today()};SCR=null;S.tab="log";render();openWizard();WZ.step=WSTEPS.findIndex(s=>s.k==="other");render()}],
 ['wizard otherAdd','#otherAdd',null],
 ['wizard temp','#temp',()=>{WZ.step=WSTEPS.findIndex(s=>s.k==="vitals");render()}],
 ['orders add','#orderAdd',()=>{wizardDirty=()=>false;draft=null;SCR=null;S.tab="me";render();openScr("set-orders")}],
 ['diet dislikes','#p_dislikes',()=>{openScr("set-diet")}],
 ['allergy other','#p_allergyOther',()=>{openScr("set-allergy")}],
 ['menu text','#mjText',()=>{SCR=null;S.tab="food";S.foodSub="menu";render()}],
 ['label text','#lbText',()=>{S.foodSub="label";render()}],
 ['food search','#foodQ',()=>{S.foodSub="search";render()}],
];
const out=[];
for(const [nm,sel,fn] of cases){
  await p.setViewportSize({width:390,height:844});
  if(fn){await p.evaluate(fn); await p.waitForTimeout(350)}
  await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); // 입력칸이 아래쪽에 있는 경우를 만들기 위해 맨 아래·맨 위 모두 시험
  for(const start of ['top','bottom']){
    await p.setViewportSize({width:390,height:844});
    await p.evaluate(s=>window.scrollTo(0,s==='top'?0:document.body.scrollHeight),start);
    await p.setViewportSize({width:390,height:440}); await p.waitForTimeout(80);
    await p.focus(sel); await p.evaluate(s=>document.querySelector(s).scrollIntoView({block:"nearest"}),sel).catch(()=>{}); await p.waitForTimeout(480);
    const r=await p.evaluate(s=>{const el=document.querySelector(s); const a=el.getBoundingClientRect(); const H=innerHeight;
      const covers=[...document.querySelectorAll('.bottom-bar,.tabs')].filter(x=>{const st=getComputedStyle(x); return st.position==='fixed'&&st.visibility!=='hidden'&&st.display!=='none'}).map(x=>x.getBoundingClientRect()).filter(c=>c.height>0&&c.top<H);
      const hid=covers.filter(c=>a.bottom>c.top+2&&a.top<c.bottom).map(c=>Math.round(a.bottom-c.top));
      const ab=document.getElementById("appbar").getBoundingClientRect(); return {top:Math.round(a.top),bottom:Math.round(a.bottom),H,coveredBy:hid,underAppbar:Math.max(0,Math.round(ab.bottom-a.top))}},sel);
    out.push([nm,start,JSON.stringify(r)]);
  }
}
for(const o of out) console.log(o.join(' | '));
console.log('errors',errs); {const ls=__LOG.filter(x=>/ \| (top|bottom) \| /.test(x)); expect(ls.length>=10,'점검 수 '+ls.length);
 for(const l of ls){const j=JSON.parse(l.split(' | ')[2]); expect(()=>j.coveredBy.length===0&&j.underAppbar===0&&j.bottom<=j.H,'입력창이 가려짐 '+l)}}
__done(); await b.close();})();
