const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const WRAP=n=>{const p=T(n); if(!fs_.existsSync(p)) fs_.writeFileSync(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('t13.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t13.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today(),ai:false};render()});
const L=(o)=>({day:2,night:0,bloody:0,urg:0,blood:0,well:0,extra:[],pain:0,gas:"없음",fatigue:"없음",temp:"",pulse:"",other:[],memo:"",...o});
// sample plans per stage
const chk=await p.evaluate((logs)=>{const out={};
  const setups={s1:null,s2:{day:4,night:0,bloody:0,urg:1,blood:0,well:1,pain:2},s3:{day:2}};
  for(const [k,o] of Object.entries(setups)){
    S.logs={}; S.plan=null; if(o){for(let i=0;i<3;i++){const d=addDays(today(),-i);S.logs[d]={date:d,...logs,...o}}}
    const c=ctx(); const pl=samplePlan(); const allowed=new Set(planFoods().map(f=>f.id));
    const bad=[];
    for(const d of pl.days) for(const m of d.meals){
      if(m.empty){bad.push('empty '+m.slot);continue}
      if(!m.rec.length) bad.push('norec '+m.title);
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
// prompt & checkDay
console.log('prompt',await p.evaluate(()=>{const t=dayPrompt(today(),[]);return [t.includes('r_juk | 흰죽'),t.includes('"recipes"')]}).catch(e=>'ERR '+e.message));
console.log('checkDay',await p.evaluate(()=>{const r=checkDay({meals:[{items:[{id:"white_rice",g:200},{id:"zucchini",g:60},{id:"spinach",g:30}],recipes:["r_zucchini","r_nope"]},{items:[{id:"white_rice",g:200}]},{items:[{id:"rice_porridge",g:300}],recipes:["r_juk_egg"]}]});return {probs:r.probs,c:r.clean.map(m=>[m.title,m.rec,m.items]),complete:r.complete}}));
// meal screen with recipes
await p.evaluate(()=>{S.logs={};S.plan=null;S.profile.meds=["steroid"];render()});
await p.click('.mrow[data-k="0"]'); await p.waitForTimeout(500);
console.log('links',await p.evaluate(()=>[...document.querySelectorAll('a.rec-link')].map(a=>[a.textContent,a.getAttribute('href'),a.target,a.rel])));
console.log('notes',await p.evaluate(()=>[...document.querySelectorAll('.rnotes li')].map(l=>l.textContent)));
await p.screenshot({path:T('n_meal.png'),fullPage:true});
// bad sheet with allergy
await p.click('[data-act=rateSet][data-j="0"][data-v=bad]'); await p.click('[data-act=rateSet][data-j="1"][data-v=bad]'); await p.click('[data-act=rateSave]'); await p.waitForTimeout(200);
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
console.log('excluded',await p.evaluate(()=>{const ids=new Set(planFoods().map(f=>f.id));return S.triggers.filter(t=>t.foodId&&ids.has(t.foodId)).map(t=>t.name)}));
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
await p.evaluate(()=>{SCR=null;render();openWizard();WZ.step=WSTEPS.findIndex(s=>s.k==="other");render()});
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
await b.close();})();
