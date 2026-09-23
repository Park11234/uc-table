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
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:360,height:740}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('t17.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t17.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today(),ai:false};render()});
// A: nutriCheck 방어
console.log('A', await p.evaluate(()=>{
  const mk=b=>({basis:"1회",basisAmt:b,basisUnit:"g",kcal:100,protein:5,fiber:3,sodium:200,sugar:2,calcium:10});
  return [0,-100,"100g","abc",0.0001,1e9,100].map(b=>{try{const x=nutriCheck(mk(b),20);return [String(b),x.eat&&x.eat.kcal,(x.rows[0]||{}).title]}catch(e){return [String(b),'THROW']}})
   .concat([(()=>{const x=nutriCheck(mk(100),1e9);return ['eat1e9',x.eat.kcal]})(),(()=>{const x=nutriCheck(mk(100),NaN);return ['eatNaN',x.eat.kcal]})()])}));
// H: 짠 식품 상한
console.log('H', await p.evaluate(()=>{
  const r=checkDay({meals:[{recipes:["r_juk"],items:[{id:"rice_porridge",g:300},{id:"kimchi",g:400}]},{recipes:["r_juk"],items:[{id:"rice_porridge",g:300}]},{recipes:["r_juk"],items:[{id:"rice_porridge",g:300}]}]});
  return [r.probs.filter(x=>/짠 식품/.test(x)),r.clean[0].items]}));
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
// F: 문장 단위 필터 확인
console.log('F', await p.evaluate(()=>{S.profile.allergies=["dairy"];const r=[safeAIText("우유는 빼고 만들었어요. 두부로 단백질을 채웠어요."),safeAIText("두부로 단백질을 채웠어요. 우유 한 컵을 곁들이세요.")];S.profile.allergies=[];return r}));
console.log('errors',errs); await b.close()})();
