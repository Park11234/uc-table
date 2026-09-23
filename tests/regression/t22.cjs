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
fs.writeFileSync(T('t22.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t22.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today(),ai:false};render()});
console.log('serv', await p.evaluate(()=>[["white_rice",210],["white_rice",105],["rice_porridge",300],["banana",50],["egg_boiled",50],["zucchini",35],["olive_oil",5],["milk",200],["nuts",12],["white_rice",7]].map(([id,g])=>[id,g,servLabel(id,g)])));
console.log('search', await p.evaluate(()=>["계란","흰죽","계란찜","ㄴㄹㅈ","ㄱㄹㅉ","우유","밥","고기","떡"].map(q=>[q,FOODS.filter(f=>nameHit(f,q)).map(f=>f.id).slice(0,4)])));
console.log('guess', await p.evaluate(()=>[guessFoodId("우유"),guessFoodId("바나나맛 우유"),guessFoodId("계란찜"),guessFoodId("떡볶이")]));
console.log('swap', await p.evaluate(()=>{const before=S.plan.days[0].meals[1].title; const ok=swapMeal(0,1); return [before,ok,S.plan.days[0].meals[1].title,S.plan.days[0].meals[1].rec]}));
console.log('skip', await p.evaluate(()=>{toggleSkip(today(),"아침");const a=isSkipped(today(),"아침");toggleSkip(today(),"아침");return [a,isSkipped(today(),"아침")]}));
console.log('stool steps', await p.evaluate(()=>WSTEPS.map(s=>s.k)));
console.log('suspects', await p.evaluate(()=>{
  for(let i=0;i<6;i++){const d=addDays(today(),-i);S.logs[d]={date:d,...BLANK_LOG(),day:i%2?6:2,bloody:i%2?2:0};
    S.extras[d]=[{name:"우유",amt:200,unit:"g",kcal:120,p:6,fi:0,ca:200}]; if(i%2) S.extras[d].push({name:"라면",amt:100,kcal:400,p:8,fi:2,ca:10})}
  return foodSuspects()}));
console.log('recent', await p.evaluate(()=>recentFoods()));
console.log('errors',errs);await b.close()})();
