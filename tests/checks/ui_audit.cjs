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
// 화면 점검: 모든 음식 상세, 작은 화면·큰 글자·다크에서 겹침·넘침, 검색 동작
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();
fs.writeFileSync(T('u.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const errs=[];
const open=async(w,h,dark,font)=>{const p=await b.newPage({viewport:{width:w,height:h},colorScheme:dark?'dark':'light'});
  p.on('pageerror',e=>errs.push(w+"px "+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(w+"px "+m.text())});
  await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
  await p.goto('file://'+WRAP('u.html')); await p.waitForTimeout(350);
  await p.evaluate(f=>{S.consent={date:today()};S.fontSize=f;S.tab="food";S.foodSub="search";S.foodQ="";S.foodCat="전체";S.foodLv="전체";SCR=null;render()},font);
  await p.waitForTimeout(200); return p};

// 1) 모든 음식 상세 시트 렌더 + 넘침 검사
let p=await open(360,760,false,"md");
const sheetBad=await p.evaluate(()=>{
  const bad=[];
  for(const f of FOODS){
    try{ showFood(f.id) }catch(e){ bad.push([f.id,"오류: "+e.message]); continue }
    const sh=document.querySelector('#sheetRoot .sheet'); if(!sh){bad.push([f.id,"시트 없음"]);continue}
    if(sh.scrollWidth>sh.clientWidth+1) bad.push([f.id,"가로 넘침 "+sh.scrollWidth+">"+sh.clientWidth]);
    const t=sh.innerText;
    if(!t.includes(f.name.split("(")[0])) bad.push([f.id,"이름 없음"]);
    if(/undefined|NaN|\[object/.test(t)) bad.push([f.id,"값 오류: "+t.slice(0,80).replace(/\n/g," ")]);
    closeSheet();
  }
  return bad});
const F=[]; if(sheetBad.length) F.push("음식 상세 "+sheetBad.length+"건"); console.log("상세 시트 문제("+sheetBad.length+")"); sheetBad.slice(0,20).forEach(x=>console.log("   ",x.join(" | ")));

// 2) 검색 결과 타당성
const q=await p.evaluate(()=>{
  const hits=q=>FOODS.filter(f=>searchHit(f,q)).map(f=>f.id);
  const t={};
  for(const s of ["우유","치즈","밥","라면","커피","사과","김치","국수","계란","두부","고기","생선","빵","죽","면","과일","ㅅㄱ","ㅋㅍ","바나나","오이","삼겹","된장","김밥","냉면","라뗴","abc","123","  ","🍎","고등어조림","무생채","아이스크림","요거트"])
    t[s]=hits(s).slice(0,12);
  return t});
for(const [k,v] of Object.entries(q)) console.log("검색 "+JSON.stringify(k)+" ("+v.length+"):", v.join(", "));

// 3) 작은 화면·큰 글자·다크에서 가로 스크롤/겹침
for(const [w,h,dark,font] of [[320,640,false,"md"],[360,760,true,"xl"],[430,930,false,"lg"]]){
  const q2=await open(w,h,dark,font);
  await q2.evaluate(()=>{S.foodQ="";render()}); await q2.waitForTimeout(250);
  const m=await q2.evaluate(()=>{
    const over=[...document.querySelectorAll('#main *')].filter(el=>el.scrollWidth>el.clientWidth+2&&!el.className.toString().includes("cats")&&!el.className.toString().includes("days")).slice(0,5).map(el=>el.className+" "+el.scrollWidth+">"+el.clientWidth);
    const cards=[...document.querySelectorAll('.fcard')];
    const clipped=cards.filter(c=>{const b=c.querySelector('b'); return b&&b.scrollHeight>b.clientHeight+2}).length;
    return {doc:document.documentElement.scrollWidth, over, cards:cards.length, clipped}});
  console.log(`화면 ${w}px dark=${dark} font=${font}:`, JSON.stringify(m)); if(m.doc>w||m.over.length||m.clipped||m.cards<400) F.push(`${w}px 화면 넘침·잘림`);
  await q2.screenshot({path:T(`ui_${w}_${font}${dark?'_d':''}.png`)});
  await q2.close();
}
console.log('errors',[...new Set(errs)].slice(0,10)); if(errs.length) F.push('페이지 오류');
if(F.length){ console.log('FAIL '+F.join(' / ')); process.exitCode=1 }
await b.close();})();
