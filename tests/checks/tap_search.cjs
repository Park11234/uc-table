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
// 휴대폰에서 검색 결과를 누를 때(v1.6.2): 키보드가 닫히며 화면이 밀리거나 한글 조합 확정으로 목록이 다시 그려져도
// 처음 누른 음식의 정보가 열려야 하고, 같은 검색어로는 목록을 갈아 끼우지 않아야 한다
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();
const ctxp=await b.newContext({viewport:{width:360,height:740},hasTouch:true,isMobile:true,deviceScaleFactor:2});
const p=await ctxp.newPage(); const fail=[];
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('tap_search.html')); await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today()}; S.tab="food"; S.foodSub="search"; S.foodQ=""; render()});
await p.waitForTimeout(150);
async function tapCase(q,shift,rebuild,label){
  await p.evaluate(()=>{closeSheet(); S.foodQ=""; render()}); await p.waitForTimeout(100);
  await p.tap('#foodQ'); await p.fill('#foodQ',q); await p.waitForTimeout(150);
  const target=await p.evaluate(()=>{const c=document.querySelector('#foodRes .fcard'); return c?{id:c.dataset.id}:null});
  if(!target){fail.push(label+': 결과 없음');return}
  // 손가락을 뗀 뒤 click 전에: 키보드가 닫혀 화면이 밀리고(shift) 목록이 새로 그려지는(rebuild) 상황을 흉내
  await p.evaluate(([shift,rebuild])=>{
    const h=()=>{window.removeEventListener('touchend',h,true);
      if(rebuild){const el=$("#foodRes"); el.innerHTML=el.innerHTML}
      if(shift){const d=document.createElement('div'); d.id='__shift'; d.style.height='150px'; $("#foodRes").prepend(d)} };
    window.addEventListener('touchend',h,true)},[shift,rebuild]);
  const box=await p.locator(`#foodRes .fcard[data-id="${target.id}"]`).first().boundingBox();
  await p.touchscreen.tap(box.x+box.width/2,box.y+box.height/2); await p.waitForTimeout(250);
  const got=await p.evaluate(()=>{const s=document.querySelector('#sheetRoot .sheet h2'); return s?s.textContent:null});
  const want=await p.evaluate(id=>FOOD[id].name,target.id);
  if(got!==want) fail.push(`${label}: '${want}'을 눌렀는데 ${got?`'${got}'`:'정보가 열리지 않음'}`);
  await p.evaluate(()=>document.getElementById('__shift')?.remove());
}
await tapCase('우유',false,false,'그대로 누름');
await tapCase('우유',true,true,'화면이 밀리고 목록이 다시 그려짐');
await tapCase('새우깡',false,true,'목록만 다시 그려짐');
await tapCase('김치',true,false,'화면만 밀림');
// 같은 검색어 입력 이벤트(한글 조합 확정)에는 목록을 갈아 끼우지 않음
await p.evaluate(()=>{closeSheet(); S.foodQ=""; render()}); await p.fill('#foodQ','두부'); await p.waitForTimeout(100);
const same=await p.evaluate(()=>{const a=document.querySelector('#foodRes .fcard'); const i=$("#foodQ"); i.dispatchEvent(new Event('input',{bubbles:true})); return a===document.querySelector('#foodRes .fcard')});
if(!same) fail.push('같은 검색어인데 목록을 다시 그림');
// 스크롤하려고 끌면(손가락이 움직이면) 열리지 않음
await p.evaluate(()=>{closeSheet()});
const box=await p.locator('#foodRes .fcard').first().boundingBox();
const c=await p.context().newCDPSession(p);
await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+20,y:box.y+20}]});
await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+20,y:box.y+80}]});
await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(250);
if(await p.evaluate(()=>!!document.querySelector('#sheetRoot .sheet'))) fail.push('끌어서 스크롤했는데 음식 정보가 열림');
if(fail.length){console.error('FAIL\n'+fail.join('\n')); process.exitCode=1} else console.log('OK 검색 결과 누름');
await b.close()})();
