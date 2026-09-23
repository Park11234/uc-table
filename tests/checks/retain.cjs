const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const WRAP=n=>{const p=T(n); if(!fs_.existsSync(p)) fs_.writeFileSync(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
// 입력만 하고(확정 전) 같은 화면에서 다른 조작으로 화면이 다시 그려질 때 입력값이 남는지
const { chromium } = require('playwright'); const fs=require('fs');
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('ret.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('ret.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today(),ai:false};render()});
const screens=[
 ['food-search',()=>{SCR=null;S.tab="food";S.foodSub="search";render()}],
 ['food-menu',()=>{SCR=null;S.tab="food";S.foodSub="menu";render()}],
 ['food-label',()=>{SCR=null;S.tab="food";S.foodSub="label";render()}],
 ['set-profile',()=>{S.tab="me";SCR={name:"set-profile"};render()}],
 ['set-diet',()=>{S.tab="me";SCR={name:"set-diet"};render()}],
 ['set-allergy',()=>{S.tab="me";SCR={name:"set-allergy"};render()}],
 ['set-meds',()=>{S.tab="me";SCR={name:"set-meds"};render()}],
 ['set-orders',()=>{S.tab="me";S.orders.checked=["fluid"];SCR={name:"set-orders"};render()}],
 ['set-weight',()=>{S.tab="me";SCR={name:"set-weight"};render()}],
 ['wizard-other',()=>{SCR=null;S.tab="log";render();openWizard();WZ.step=WSTEPS.findIndex(s=>s.k==="other");render()}],
 ['wizard-temp',()=>{WZ.step=WSTEPS.findIndex(s=>s.k==="vitals");render()}],
];
const out={};
for(const [nm,fn] of screens){
  await p.evaluate(fn); await p.waitForTimeout(80);
  const ids=await p.evaluate(()=>[...document.querySelectorAll('#main input:not([type=file]):not([type=checkbox]):not([type=range]):not([type=date]),#main textarea')].filter(e=>e.id&&!e.readOnly).map(e=>[e.id,e.type]));
  for(const [id,ty] of ids){ await p.fill('#'+id, ty==='number'?'77':'마커'); }
  // 같은 화면을 다시 그림(다른 버튼·스위치를 눌렀을 때와 같은 효과)
  await p.evaluate(()=>render()); await p.waitForTimeout(60);
  out[nm]=await p.evaluate(ids=>ids.map(([id,ty])=>{const e=document.getElementById(id); return [id, e?e.value:'(없음)']}),ids);
}
for(const [k,v] of Object.entries(out)) console.log(k.padEnd(13), JSON.stringify(v));
console.log('errors',errs); await b.close();})();
