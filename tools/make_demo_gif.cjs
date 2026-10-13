// README용 데모 GIF 프레임 촬영(→ tools/make_demo_gif.py가 GIF로 합침)
const { chromium } = require('playwright');
const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..');
const APP=path.join(ROOT,'src','app','index.html');
const TMP=path.join(ROOT,'.test-out'); const OUT=path.join(TMP,'gif'); fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT,{recursive:true});
const page=path.join(TMP,'demo.html');
fs.writeFileSync(page,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const SEED=()=>{const d=n=>addDays(today(),-n); S.consent={date:today()};
  S.profile={...S.profile,height:"170",weight:"60",age:"30",sex:"F",allergies:["shrimp"],meds:["asa"]};
  const mk=(day,b)=>({day,night:b?1:0,bloody:b,urg:b?1:0,blood:b?1:0,well:b?1:0,stool:4,medtaken:1,extra:[],pain:b?3:1,gas:"없음",fatigue:"약간",temp:"",pulse:"",other:[],memo:""});
  const plan=[[6,2],[5,2],[4,1],[3,1],[2,0],[1,0]]; for(const [i,b] of plan) S.logs[d(i)]=mk(b?5:3,b);
  S.water[today()]=3; S.weights=[{date:d(5),kg:60.4},{date:d(1),kg:60.1}]; save()};
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1}); const p=await ctx.newPage();
  await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
  await p.goto('file://'+page); await p.waitForTimeout(300); await p.evaluate(SEED); await p.reload(); await p.waitForTimeout(500);
  let n=0; const shot=async(hold=1)=>{ await p.waitForTimeout(250); const f=path.join(OUT,String(n++).padStart(3,'0')+`_${hold}.png`); await p.screenshot({path:f}) };
  await shot(3);                                                            // 홈: 오늘 식단
  await p.evaluate(()=>window.scrollTo(0,520)); await shot(2);              // 제안된 끼니
  await p.evaluate(()=>window.scrollTo(0,0));
  await p.click('.tab[data-tab=food]'); await shot(2);                      // 찾아보기
  for(const q of ["김","김치","김치찌"]){ await p.fill('#foodQ',q); await shot(q==="김치찌"?2:1) }  // 검색
  await p.evaluate(()=>showFood("kimchi_jjigae")); await shot(3);           // 판정과 이유
  await p.evaluate(()=>{const r=document.querySelector('#sheetRoot sup.ref'); r&&r.click()}); await shot(3);   // 근거 보기
  await p.evaluate(()=>{document.querySelector('#sheetRoot').innerHTML=""});
  await p.evaluate(()=>showFood("white_fish")); await shot(2);             // 먹어도 좋은 음식
  await p.evaluate(()=>{document.querySelector('#sheetRoot').innerHTML=""});
  await p.click('.tab[data-tab=log]'); await shot(3);                       // 기록·추이
  await p.evaluate(()=>openWizard(today())); await p.waitForTimeout(400); await shot(1);   // 기록 마법사(전환 효과가 끝난 뒤)
  for(let i=0;i<3;i++){ await p.click('[data-act=step][data-v="1"]'); } await shot(2);
  await p.evaluate(()=>{SCR=null;S.tab="plan";openScr("nutri")}); await shot(3);  // 오늘 영양
  await b.close(); console.log('frames',n);
})();
