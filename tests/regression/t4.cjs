const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const WRAP=n=>{const p=T(n); if(!fs_.existsSync(p)) fs_.writeFileSync(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
const fs=require('fs'); const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('t4.html'),'<!doctype html><html><head><meta charset="utf-8"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t4.html'));await p.waitForTimeout(500);await p.evaluate(()=>{S.consent={date:today(),ai:true};render()});
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
console.log('errors',errs); await b.close()})();
