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
(async()=>{const b=await chromium.launch();const p=await b.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('t9.html'),'<!doctype html><html><head><meta charset="utf-8"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t9.html'));await p.waitForTimeout(400);await p.evaluate(()=>{S.consent={date:today(),ai:true};render()});
const r=await p.evaluate(()=>{
 S.profile.allergies=['shrimp','buckwheat']; S.stageMode=1; S.weights=[{date:today(),kg:58}];
 const N=(o)=>({basis:"",basisUnit:"g",totalAmt:null,carb:null,sugar:null,polyol:null,fiber:null,protein:null,fat:null,sat:null,trans:null,sodium:null,calcium:null,kcal:null,...o});
 const cases=[
  ["치즈닭갈비볶음밥 삼각김밥","밥, 닭고기, 모짜렐라치즈, 고추장, 간장(대두, 밀)", N({basisAmt:163,kcal:281,trans:0}),163],
  ["닭강정 반반","닭고기, 밀가루, 대두유, 물엿, 고추장", N({basisAmt:431,kcal:1412}),150],
  ["도시락(돼지불고기)","쌀, 돼지고기, 간장, 설탕. 이 제품은 메밀, 대두, 복숭아, 호두, 오징어, 조개류(굴,전복,홍합 포함), 새우, 잣을 사용한 제품과 같은 제조시설에서 제조하고 있습니다.", N({basisAmt:400,kcal:680,fat:19,sat:2.4,trans:0,sodium:1171,protein:14}),400],
  ["로스트 햄 슬라이스","돼지고기, 정제소금, 아질산나트륨, 대두단백", N({basisAmt:80,kcal:180,sodium:650,sugar:3.5,fat:12,sat:4.2,trans:0.1,protein:14}),80],
  ["저당 아이스바","정제수, 에리스리톨, 알룰로스, 야자유, 유청분말", N({basisAmt:90,basisUnit:"ml",kcal:150,sodium:16,sugar:2,polyol:16.1,fat:12,sat:10,trans:0.1,protein:2.7}),90],
  ["스크램블&소시지 샌드위치","밀가루, 스크램블드에그(전란액), 소시지(돼지고기)", N({basisAmt:170,kcal:518,sodium:990,sugar:11,fat:34,sat:7,trans:0.2,protein:18}),170],
  ["떡볶이 밀키트","쌀떡, 고추장, 어묵. 우유, 대두, 돼지고기, 밀, 쇠고기, 오징어, 게, 새우, 조개류(홍합, 바지락, 굴) 함유", N({basisAmt:100}),100],
 ];
 return cases.map(([nm,txt,n,eat])=>{const L=labelCheck(txt,nm);const NN=nutriCheck(n,eat);return {nm,overall:L.overall,rows:L.rows.map(x=>`${x.lv}:${x.title}=${x.found.join("/")}`),nut:NN.rows.map(x=>`${x.lv}:${x.title}=${x.found.join("/")}`)}});
});
for(const c of r) console.log(JSON.stringify(c));
console.log(errs); await b.close()})();
