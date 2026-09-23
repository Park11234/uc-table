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
fs.writeFileSync(T('t21.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t21.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today(),ai:false};render()});
// 키보드 조작은 가드에 걸리지 않아야 함
await p.evaluate(()=>{S.tab="me";SCR=null;render()});
await p.focus('[data-act=openScr][data-v=set-profile]'); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
await p.focus('[data-act=back]'); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
console.log('keyboard', await p.evaluate(()=>[SCR, S.tab]));
// 마우스: 화면 바뀐 뒤 같은 자리 다른 버튼 = 무시
await p.evaluate(()=>{S.tab="plan";SCR=null;S.logs={};render();openWizard();WZ.step=WSTEPS.length-1;draft.day=2;render()});
const bb=await p.locator('[data-act=saveLog]').boundingBox();
await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);
await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);
console.log('mouse guard', await p.evaluate(()=>[Object.keys(S.logs).length, SCR, S.tab]));
console.log('errors',errs);await b.close()})();
