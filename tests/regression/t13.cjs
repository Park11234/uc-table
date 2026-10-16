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
fs.writeFileSync(T('t13.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t13.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today()};render()});
const L=(o)=>({day:2,night:0,bloody:0,urg:0,blood:0,well:0,extra:[],pain:0,gas:"없음",fatigue:"없음",temp:"",pulse:"",other:[],memo:"",...o});
// sample plans per stage
const chk=await p.evaluate((logs)=>{const out={};
  const setups={s1:null,s2:{day:4,night:0,bloody:0,urg:1,blood:0,well:1,pain:2},s3:{day:2}};
  for(const [k,o] of Object.entries(setups)){
    S.logs={}; S.plan=null; if(o){for(let i=0;i<3;i++){const d=addDays(today(),-i);S.logs[d]={date:d,...logs,...o}}}
    const c=ctx(); const pl=samplePlan(); const allowed=new Set(menuFoods(c).map(f=>f.id));
    const bad=[];
    for(const d of pl.days) for(const m of d.meals){
      if(m.empty){bad.push('empty '+m.slot);continue}
      if(!m.rec.length&&!(m.cook&&m.cook.length)) bad.push('norec '+m.title); // 레시피 링크가 없으면 '만드는 법'이 있어야 함
      for(const r of m.rec) if(!recipeOK(r,allowed,c)) bad.push('recNotOK '+r);
      for(const r of m.rec) for(const f of RECIPES[r].foods) if(!m.items.some(x=>x[0]===f)) bad.push('recFoodMissing '+r+':'+f);
      if(c.fiberStage===1){const veg=m.items.filter(([id])=>FOOD[id].cat==="채소"); if(veg.length>1) bad.push('2veg '+m.title); for(const [id,g] of veg) if(g>35) bad.push('veg>35 '+id);
        for(const [id,g] of m.items){ if(FRUIT_CAP[id]&&g>FRUIT_CAP[id]) bad.push('fruit '+id+g); if(FOOD[id].fi*g/100>=2) bad.push('fiber '+id+g); if(FOOD[id].tags.includes('gil')) bad.push('gil '+id)}}
    }
    const titles=new Set(pl.days.flatMap(d=>d.meals.map(m=>m.title)));
    out[k]={stage:c.stage,fiber:c.fiberStage,bad,uniq:titles.size};
  }
  return out},L());
console.log('plans',JSON.stringify(chk));
// all recipe urls sane
console.log('recipes',await p.evaluate(()=>Object.values(RECIPES).filter(r=>!/^https:\/\/(www\.10000recipe\.com\/recipe\/\d+|modurecipe\.com\/recipes\/[a-z0-9-]+)$/.test(r.url)||!r.foods.every(f=>FOOD[f])).map(r=>r.name)));
console.log('tplFoods',await p.evaluate(()=>Object.values(TPL).flat().flatMap(m=>[...m.items.map(x=>x[0]).filter(id=>!FOOD[id]),...(m.rec||[]).filter(r=>!RECIPES[r])])));
// meal screen with recipes
await p.evaluate(()=>{S.logs={};S.plan=null;S.profile.meds=["steroid"];render()});
{const k=await p.evaluate(()=>Math.max(0,S.plan.days[0].meals.findIndex(m=>m.rec&&m.rec.length)));  // 날짜에 따라 첫 끼에 레시피가 없을 수 있어(2026-10-15 아침) 레시피가 있는 첫 끼를 연다
 await p.click(`.mrow[data-k="${k}"]`); await p.waitForTimeout(500);}
console.log('links',await p.evaluate(()=>[...document.querySelectorAll('a.rec-link')].map(a=>[a.textContent,a.getAttribute('href'),a.target,a.rel])));
console.log('notes',await p.evaluate(()=>[...document.querySelectorAll('.rnotes li')].map(l=>l.textContent)));
await p.screenshot({path:T('n_meal.png'),fullPage:true});
// bad sheet with allergy
await rateOpen(p); await p.click('[data-act=rateSet][data-j="0"][data-v=bad]'); await p.click('[data-act=rateSet][data-j="1"][data-v=bad]'); await p.click('[data-act=rateSave]'); await p.waitForTimeout(200);
console.log('saveDisabled',await p.evaluate(()=>document.querySelector('[data-act=badSave]').disabled));
await p.click('[data-act=badSym][data-i="0"][data-v=allergy]');
console.log('allergyForces',await p.evaluate(()=>[BAD.list[0].dec,document.querySelector('[data-act=badDec][data-i="0"][data-v=retry]').disabled]));
await p.click('[data-act=badSym][data-i="1"][data-v=taste]');
console.log('tasteDefault',await p.evaluate(()=>BAD.list[1].dec));
await p.click('[data-act=badSym][data-i="1"][data-v=gas]'); await p.click('[data-act=badDec][data-i="1"][data-v=none]');
await p.screenshot({path:T('n_bad.png')});
await p.click('[data-act=badSave]'); await p.waitForTimeout(200);
console.log('trigs',await p.evaluate(()=>JSON.stringify(S.triggers)));
// set-trig picker
await p.evaluate(()=>{SCR=null;S.tab="me";render()});
await p.click('[data-act=openScr][data-v=set-trig]');
await p.click('[data-act=trigPick]'); await p.fill('#tpQ','바나나'); await p.waitForTimeout(100);
await p.click('[data-act=trigChoose][data-v=banana]'); await p.click('[data-act=badSym][data-v=gas]'); await p.click('[data-act=badSave]'); await p.waitForTimeout(200);
await p.locator('input[data-act=trigNever][data-k="1"]').check();
await p.screenshot({path:T('n_trig.png'),fullPage:true});
console.log('trigs2',await p.evaluate(()=>S.triggers.map(t=>[t.name,t.sym,t.never])));
// plan excludes triggers
// v1.7.0: AI 요청문이 없어져 앱 규칙 식단(samplePlan)과 식단 식품(menuFoods)에서 주의 음식이 빠지는지 본다
console.log('excluded',await p.evaluate(()=>{S.plan=null; const pl=samplePlan(); const used=new Set(pl.days.flatMap(d=>d.meals.flatMap(m=>m.items.map(x=>x[0])))); const ids=new Set(menuFoods().map(f=>f.id));return S.triggers.filter(t=>t.foodId&&(ids.has(t.foodId)||used.has(t.foodId))).map(t=>t.name)}));
// reintro lists
await p.evaluate(()=>{S.triggers.push({name:"우유",foodId:"milk",date:today(),source:"직접",sym:["gas"],never:false});for(let i=0;i<7;i++){const d=addDays(today(),-i);S.logs[d]={date:d,day:2,night:0,bloody:0,urg:0,blood:0,well:0,extra:[],pain:0,gas:"없음",fatigue:"없음",temp:"",pulse:"",other:[],memo:""}} SCR=null;S.tab="log";render()});
await p.click('[data-act=openScr][data-v=reintro]');
console.log('reintro',await p.evaluate(()=>({cand:[...document.querySelectorAll('[data-act=riStart]')].map(x=>x.textContent.slice(0,12)),dis:[...document.querySelectorAll('[data-act=riStart]')].map(x=>x.disabled),never:document.querySelector('#main').textContent.includes('다시 시험하지 않는 음식')})));
await p.screenshot({path:T('n_ri.png'),fullPage:true});
// reintro stop on logs during test
console.log('riStop',await p.evaluate(()=>{S.reintro.active={name:"우유",foodId:"milk",start:addDays(today(),-1),days:[{r:"없음"},{},{}]};S.logs[addDays(today(),-1)].bloody=1;return riStop(S.reintro.active)}));
// reintro eligibility with watch signal
console.log('elig',await p.evaluate(()=>{S.reintro.active=null;S.logs[addDays(today(),-1)].bloody=0;const a=reintroEligible().ok;S.logs[today()].other=["오한"];const b=reintroEligible().ok;S.logs[today()].other=[];return [a,b]}));
// danger
console.log('danger',await p.evaluate((L)=>[
  dangerSignals({...L,temp:"37.6"}), dangerSignals({...L,other:["구토"]}), dangerSignals({...L,pain:8}), dangerSignals({...L,other:["소변이 줄고 입이 마름"]}),
  activity({...L,other:["어지러움"]}).stage, activity({...L,temp:"37.8"}).stage, activity({...L}).stage, activity({...L,pain:5}).stage],L()));
// wizard other options
await p.evaluate(()=>{SCR=null;render();openWizard();WZ.step=wzStepOf("other");render()});
console.log('otherOpts',await p.evaluate(()=>[...document.querySelectorAll('#main button')].map(b=>b.textContent.trim()).filter(t=>/오한|구토|소변/.test(t))));
// urgent banner on plan
await p.evaluate(()=>{wizardDirty=()=>false;SCR=null;S.logs[today()]={...S.logs[today()],temp:"37.9",other:["오한"]};S.tab="plan";render()});
console.log('banner',await p.evaluate(()=>[...document.querySelectorAll('.banner')].map(b=>b.textContent.slice(0,40))));
await p.screenshot({path:T('n_plan.png')});
// care
await p.evaluate(()=>{S.tab="log";SCR=null;render()});
await p.click('[data-act=openScr][data-v=care]');
await p.locator('input[data-act=careT][data-v=flu]').check(); await p.waitForTimeout(100);
console.log('care',await p.evaluate(()=>[JSON.stringify(S.care),document.querySelector('#appbar').textContent.trim()]));
await p.screenshot({path:T('n_care.png'),fullPage:true});
// normalize keeps sym/never/care
console.log('norm',await p.evaluate(()=>{const n=normalizeState(JSON.parse(JSON.stringify(S)));return [n.triggers.map(t=>[t.sym,t.never]),n.care]}));
// old triggers without sym
console.log('oldTrig',await p.evaluate(()=>{const o=JSON.parse(JSON.stringify(S));o.triggers=[{name:"x"}];return normalizeState(o).triggers}));
// dark + xl
await p.evaluate(()=>{S.theme="dark";S.fontSize="xl";S.tab="plan";SCR=null;S.logs={};render()});
await p.click('.mrow[data-k="1"]'); await p.waitForTimeout(400);
console.log('overflow',await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]));
await p.screenshot({path:T('n_dark.png'),fullPage:true});
console.log('errors',errs);
{const pl=jsonOf('plans'); expect(pl,'출력 없음'); for(const k of ['s1','s2','s3']) expect(()=>pl[k].bad.length===0,'예시 식단 '+k+' '+(pl&&pl[k]&&pl[k].bad.slice(0,5)));
 expect(()=>pl.s1.stage===1&&pl.s2.stage===2&&pl.s3.stage===3,'단계'); expect(()=>jsonOf('recipes').length===0&&jsonOf('tplFoods').length===0,'레시피·식품 존재');
 expect(()=>jsonOf('links').length>0&&jsonOf('links').every(l=>l[2]==='_blank'&&/noopener/.test(l[3])),'레시피 링크');
 expect(()=>jsonOf('saveDisabled')===true,'증상 선택 전 저장 막기'); expect(()=>jsonOf('allergyForces')[0]==='never','알레르기는 다시 먹지 않기');
 expect(()=>jsonOf('tasteDefault')==='dislike','맛은 싫어하는 음식'); expect(()=>jsonOf('trigs2').length===2&&jsonOf('excluded').length===0,'주의 음식 식단 제외');
 expect(()=>jsonOf('riStop').length===1,'다시 먹어 보기 중단'); expect(()=>{const e=jsonOf('elig'); return e[0]===true&&e[1]===false},'다시 먹어 보기 조건');
 expect(()=>{const d=jsonOf('danger'); return d[0].urgent.length&&d[1].urgent.length&&d[2].urgent.length&&d[3].urgent.length},'위험 신호');
 expect(()=>jsonOf('otherOpts').length===3,'기타 증상 선택지'); expect(()=>jsonOf('banner').some(b=>/진료를 미루지/.test(b)),'진료 안내 배너');
 expect(()=>jsonOf('care')[0].includes('flu'),'건강 관리 점검'); expect(()=>jsonOf('oldTrig')[0].never===false,'예전 주의 음식 정리');
 expect(()=>{const o=jsonOf('overflow'); return o[0]<=o[1]},'어두운 모드 큰 글자 넘침');}
__done(); await b.close();})();
