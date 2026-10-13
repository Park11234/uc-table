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
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('t17.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t17.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today()};render()});
// A: nutriCheck 방어
console.log('A', await p.evaluate(()=>{
  const mk=b=>({basis:"1회",basisAmt:b,basisUnit:"g",kcal:100,protein:5,fiber:3,sodium:200,sugar:2,calcium:10});
  return [0,-100,"100g","abc",0.0001,1e9,100].map(b=>{try{const x=nutriCheck(mk(b),20);return [String(b),x.eat&&x.eat.kcal,(x.rows[0]||{}).title]}catch(e){return [String(b),'THROW']}})
   .concat([(()=>{const x=nutriCheck(mk(100),1e9);return ['eat1e9',x.eat.kcal]})(),(()=>{const x=nutriCheck(mk(100),NaN);return ['eatNaN',x.eat.kcal]})()])}));
// H: 짠 식품 상한
// v1.7.0: AI 식단 검사(checkDay)가 없어져, 앱 규칙 식단의 모든 단계에서 짠 식품이 한 끼 상한을 넘지 않는지 본다
console.log('H', await p.evaluate(()=>{const bad=[]; for(const st of [null,{day:4,urg:1,well:1,pain:2},{day:2}]){S.logs={}; S.plan=null;
  if(st){for(let i=0;i<3;i++){const d=addDays(today(),-i);S.logs[d]={...BLANK_LOG(),date:d,...st}}}
  const pl=samplePlan(); for(const d of pl.days) for(const m of d.meals) for(const [id,g] of m.items) if(FOOD[id].tags.includes("salty")&&g>SALTY_CAP) bad.push(id+g)}
  S.logs={}; S.plan=null; return [bad,SALTY_CAP]}));
// D: 알레르기 등록 + 표시 못 찾음
console.log('D', await p.evaluate(()=>{S.profile.allergies=["peach"];const r=labelCheck("정제수, 설탕, 구연산","음료");const r2=(S.profile.allergies=[],labelCheck("정제수, 설탕","음료"));return [r.rows[0].lv,r.rows[0].title,r2.rows[0].lv]}));
// B: 연타 가드
await p.evaluate(()=>{S.profile.allergies=[];SCR=null;S.tab="plan";render();openWizard();WZ.step=WSTEPS.length-1;draft.day=3;render()});
const btn=await p.locator('[data-act=saveLog]').boundingBox();
await p.mouse.click(btn.x+btn.width/2, btn.y+btn.height/2);
await p.mouse.click(btn.x+btn.width/2, btn.y+btn.height/2); // 같은 자리 두 번째 탭
await p.waitForTimeout(200);
console.log('B guard', await p.evaluate(()=>[Object.keys(S.logs).length, SCR, S.tab]));
// 같은 버튼 연속 탭(다음→다음)은 막지 않아야 함
await p.evaluate(()=>{S.logs={};SCR=null;openWizard();WZ.step=6;render()});
const nb=await p.locator('[data-act=wzNext]').boundingBox();
await p.mouse.click(nb.x+nb.width/2, nb.y+nb.height/2);
await p.mouse.click(nb.x+nb.width/2, nb.y+nb.height/2);
console.log('B same-button', await p.evaluate(()=>WZ.step));
console.log('errors',errs); expect(()=>{const a=jsonOf('A'); return a.slice(0,6).every(x=>x[1]===null)&&a[6][1]===20&&a[7][1]===5000&&a[8][1]===100},'영양 기준량 방어');
expect(()=>{const h=jsonOf('H'); return h[0].length===0},'짠 음식 양'); expect(()=>jsonOf('D')[0]==='caution','알레르기 직접 확인');
expect(()=>jsonOf('B guard')[0]===1,'연타 한 번만 저장');
__done(); await b.close()})();
