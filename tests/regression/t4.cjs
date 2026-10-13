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
fs.writeFileSync(T('t4.html'),'<!doctype html><html><head><meta charset="utf-8"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t4.html'));await p.waitForTimeout(500);await p.evaluate(()=>{S.consent={date:today()};render()});
console.log(await p.evaluate(()=>{
 S.stageMode=1;
 const viol=[];for(const d of S.plan.days)for(const m of d.meals)for(const [id,g] of m.items){const f=FOOD[id];if(!f)viol.push('missing '+id);else if(f.fi*g/100>=2)viol.push(id+' '+g)}
 const noSrc=FOODS.filter(f=>!f.src).map(f=>f.id);
 const st=['pumpkin','tofu','pasta','corn','white_rice','oatmeal'].map(id=>[id,FOOD[id].fi,foodStatus(FOOD[id]).level,foodStatus(FOOD[id]).reasons.join('/')]);
 S.profile.allergies=['shrimp','pork','clam']; 
 const rc=[ruleCheck({name:'해물 파전',ingr:['새우','오징어','굴'],cook:'부침'}),ruleCheck({name:'김치찌개',ingr:['돼지고기','두부']})];
 const t=totals(dayItems(S.plan.days[0]));
 return JSON.stringify({viol,noSrc,st,rc,t,tg:targets().fiber});
}));
await p.click('.tab[data-tab=food]'); await p.screenshot({path:T('food2.png')});
await p.click('.tab[data-tab=me]'); await p.screenshot({path:T('me2.png'),fullPage:true});
console.log('errors',errs); {const j=lineJSON('{"viol"'); expect(j,'출력 없음');
 expect(()=>j.viol.length===0,'저잔사식 섬유 위반 '+(j&&j.viol));
 const okNo=new Set(["broth","alcohol","fried","tteokkochi"]); expect(()=>j.noSrc.every(id=>okNo.has(id)||/^(newcare|mediwell|greenbia|monowell|elemental|carewell|careme|curewell|procare|takefit)/.test(id)),'영양값 없는 음식 '+(j&&j.noSrc));
 expect(()=>{const st=Object.fromEntries(j.st.map(x=>[x[0],x[2]])); return st.white_rice==='ok'&&st.corn==='later'&&st.oatmeal==='later'&&st.pumpkin==='caution'},'1단계 판정');
 expect(()=>j.rc[0].level==='avoid'&&j.rc[0].reasons.some(r=>/새우/.test(r))&&j.rc[1].level==='avoid','외식 판정 알레르기');
 expect(()=>j.t.k>1000,'하루 열량');}
__done(); await b.close()})();
