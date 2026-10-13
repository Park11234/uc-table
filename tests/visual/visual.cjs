// 화면 비교 점검(v1.8.0): 주요 화면을 같은 날짜·같은 기록으로 찍어 기준 화면(tests/visual/baseline)과 픽셀로 비교한다.
//   node tests/visual/visual.cjs            비교(다르면 .test-out/visual/에 차이 그림을 남기고 실패)
//   node tests/visual/visual.cjs --update   지금 화면으로 기준 화면을 다시 만든다(의도한 디자인 변경 뒤에만)
// 글꼴이 다른 환경(다른 OS·CI)에서는 같은 앱도 픽셀이 달라진다. 그래서 기준 화면을 만든 환경의 글꼴 지문(fp)을
// 함께 저장하고, 지문이 다르면 비교를 건너뛴다(그 환경에서 --update로 기준을 따로 만들면 비교한다).
const path=require('path'), fs=require('fs');
const { chromium } = require('playwright');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const BASE=path.join(__dirname,'baseline');
const OUT=path.join(process.env.TEST_TMP||path.join(ROOT,'.test-out'),'visual');
const UPDATE=process.argv.includes('--update');
fs.mkdirSync(BASE,{recursive:true}); fs.mkdirSync(OUT,{recursive:true});
const page=path.join(OUT,'visual.html');
fs.writeFileSync(page,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
// 날짜·시각 고정(2026-10-05 월요일 오전 9시): 달력·'오늘'·저녁 강조 여부가 늘 같게
const FIXED_DATE=()=>{const FIX=new Date(2026,9,5,9,0,0).getTime(); const D=Date;
  class F extends D{constructor(...a){if(a.length===0) super(FIX); else super(...a)} static now(){return FIX}}
  window.Date=F; Math.random=(()=>{let x=42;return()=>{x=(x*16807)%2147483647;return x/2147483647}})()};
const SEED=()=>{const d=n=>addDays(today(),-n); S.consent={date:today()}; S.onb="done"; S.persist="na";
  S.profile={height:"174",weight:"63",age:"27",sex:"M",allergies:["shrimp"],allergyOther:"",lactose:false,meds:["asa"],medOther:"",dislikes:"",budget:"보통"};
  const mk=(bloody,pain,well)=>({day:3,night:0,bloody,urg:bloody?1:0,blood:bloody?1:0,well,extra:[],stool:0,medtaken:1,pain,gas:"조금",fatigue:"약간",temp:"",pulse:"",other:[],memo:""});
  for(let i=0;i<8;i++) S.logs[d(i)]=mk(i===5?1:0,i%2,i===5?1:0);
  S.water[today()]=4; S.weights=[{date:d(40),kg:63.6},{date:today(),kg:63.1}];
  S.extras[today()]=[{name:"달걀찜",foodId:"egg_steamed",amt:120,unit:"g",slot:"B",kcal:130,p:10.8,fi:0,ca:70}];
  S.qs=[{id:"q1",t:"철분제를 계속 먹어도 됩니까?",date:d(2),done:""}]; S.favs=["banana"]; S.lastBackup=d(1); S.chgDays=[today()];
  S.plan=null; S.plan=samplePlan(); save()};
const SCREENS=[
  ["home",async p=>{await p.evaluate(()=>{SCR=null;S.tab="plan";render()})}],
  ["home-dark",async p=>{await p.evaluate(()=>{S.theme="dark";SCR=null;S.tab="plan";render()})}],
  ["log",async p=>{await p.evaluate(()=>{S.theme="light";SCR=null;S.tab="log";render()})}],
  ["food",async p=>{await p.evaluate(()=>{SCR=null;S.tab="food";S.foodSub="search";S.foodQ="";S.foodCat="전체";S.foodLv="전체";render()})}],
  ["me",async p=>{await p.evaluate(()=>{SCR=null;S.tab="me";render()})}],
  ["nutri",async p=>{await p.evaluate(()=>{S.tab="plan";openScr("nutri")})}],
  ["meal",async p=>{await p.evaluate(()=>{S.tab="plan";SCR=null;render();openScr("meal",{k:0})})}],
  ["food-detail",async p=>{await p.evaluate(()=>{SCR=null;S.tab="food";render();showFood("broccoli")})}],
  ["set-data",async p=>{await p.evaluate(()=>{closeSheet();S.tab="me";openScr("set-data")})}],
  ["onboard",async p=>{await p.evaluate(()=>{SCR=null;S.onb="0";render()})}],
];
// 브라우저 안에서 두 PNG를 캔버스로 그려 픽셀 비교(별도 라이브러리 없이)
async function diff(p,a,b,outPath){
  return p.evaluate(async([A,B])=>{
    const load=src=>new Promise((res,rej)=>{const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src});
    const [ia,ib]=await Promise.all([load(A),load(B)]);
    if(ia.width!==ib.width||ia.height!==ib.height) return {size:true,w:[ia.width,ib.width],h:[ia.height,ib.height]};
    const c=document.createElement("canvas"); c.width=ia.width; c.height=ia.height; const x=c.getContext("2d");
    x.drawImage(ia,0,0); const da=x.getImageData(0,0,c.width,c.height).data;
    x.clearRect(0,0,c.width,c.height); x.drawImage(ib,0,0); const img=x.getImageData(0,0,c.width,c.height); const db=img.data;
    let n=0; for(let k=0;k<da.length;k+=4){const d=Math.max(Math.abs(da[k]-db[k]),Math.abs(da[k+1]-db[k+1]),Math.abs(da[k+2]-db[k+2]));
      if(d>32){n++; db[k]=255; db[k+1]=0; db[k+2]=0; db[k+3]=255} else {db[k+3]=60}}
    x.putImageData(img,0,0); return {ratio:n/(c.width*c.height),n,png:c.toDataURL("image/png")}},
    [`data:image/png;base64,${fs.readFileSync(a).toString('base64')}`,`data:image/png;base64,${fs.readFileSync(b).toString('base64')}`])
    .then(r=>{if(r.png){fs.writeFileSync(outPath,Buffer.from(r.png.split(',')[1],'base64')); delete r.png} return r});
}
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,colorScheme:'light',reducedMotion:'reduce'});
  await ctx.addInitScript(FIXED_DATE);
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
  await p.goto('file://'+page); await p.waitForTimeout(300); await p.evaluate(SEED); await p.reload(); await p.waitForTimeout(400);
  // 글꼴 지문: 기본 글꼴로 그린 한글·숫자 문장의 폭
  const fp=await p.evaluate(()=>{const c=document.createElement("canvas").getContext("2d"); const f=getComputedStyle(document.body).fontFamily; c.font=`16px ${f}`; return Math.round(c.measureText("궤양성 대장염 식단 0123456789 kcal").width*100)/100+"|"+f.slice(0,40)});
  const fpFile=path.join(BASE,'fingerprint.txt'); const baseFp=fs.existsSync(fpFile)?fs.readFileSync(fpFile,'utf8').trim():"";
  if(!UPDATE&&baseFp&&baseFp!==fp){console.log(`기준 화면을 만든 환경과 글꼴이 달라 비교를 건너뜀(기준 ${baseFp} / 지금 ${fp}). 이 환경에서 비교하려면 --update로 기준을 만드십시오.`); await b.close(); return}
  const fails=[];
  for(const [name,go] of SCREENS){
    await go(p); await p.waitForTimeout(250);
    const cur=path.join(OUT,`${name}.png`); await p.screenshot({path:cur});
    const base=path.join(BASE,`${name}.png`);
    if(UPDATE||!fs.existsSync(base)){fs.copyFileSync(cur,base); console.log(`기준 저장 ${name}`); continue}
    const r=await diff(p,base,cur,path.join(OUT,`${name}.diff.png`));
    if(r.size) fails.push(`${name}: 크기가 달라짐 ${JSON.stringify(r)}`);
    else if(r.ratio>0.002) fails.push(`${name}: 픽셀 ${(r.ratio*100).toFixed(2)}% 다름(차이 그림 ${name}.diff.png)`);
    else console.log(`같음 ${name} (${(r.ratio*100).toFixed(3)}%)`);
  }
  if(UPDATE) fs.writeFileSync(fpFile,fp+"\n");
  if(errs.length) fails.push('페이지 오류: '+errs.join(' | '));
  if(fails.length){console.error('FAIL\n'+fails.join('\n')); process.exitCode=1} else console.log('검증 통과');
  await b.close();
})();
