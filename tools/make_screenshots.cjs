// README용 화면 이미지 촬영: 데모 기록을 심고 주요 화면을 밝은/어두운 모드로 찍는다
const { chromium } = require('playwright');
const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..');
const APP=path.join(ROOT,'src','app','index.html');
const OUT=path.join(ROOT,'docs','screenshots');
const TMP=path.join(ROOT,'.test-out'); fs.mkdirSync(TMP,{recursive:true}); fs.mkdirSync(OUT,{recursive:true});
const page=path.join(TMP,'shots.html');
fs.writeFileSync(page,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');

const SEED=()=>{
  const d=(n)=>addDays(today(),-n);
  S.consent={date:today(),ai:false};
  S.profile={height:"174",weight:"63",age:"27",sex:"M",allergies:["shrimp"],allergyOther:"",lactose:false,meds:["asa"],medOther:"",dislikes:"",budget:"보통"};
  S.stageMode="auto";
  const mk=(day,bloody,pain,well,memo)=>({day,night:0,bloody,urg:bloody?1:0,blood:bloody?1:0,well,extra:[],stool:0,medtaken:1,pain,gas:"조금",fatigue:"약간",temp:"",pulse:"",other:[],memo});
  S.logs[d(6)]=mk(6,2,2,1,"저녁에 매운 음식");
  S.logs[d(5)]=mk(5,1,2,1,"");
  S.logs[d(4)]=mk(4,1,1,1,"");
  S.logs[d(3)]=mk(3,0,1,0,"컨디션 좋아짐");
  S.logs[d(2)]=mk(3,0,1,0,"");
  S.logs[d(1)]=mk(2,0,0,0,"");
  S.logs[today()]=mk(2,0,0,0,"아침 죽, 점심 흰살생선");
  S.water[today()]=5;
  S.weights=[{date:d(6),kg:62.4},{date:d(3),kg:62.8},{date:today(),kg:63.1}];
  S.extras[today()]=[{name:"달걀찜",foodId:"egg_steamed",amt:120,unit:"g",kcal:142,p:13.4,fi:0.4,ca:52}];
  save();
};
(async()=>{
  const b=await chromium.launch();
  const shots=[
    ["plan","home"],["log","log"],["food","food"],["nutri","nutri"],["me","me"]
  ];
  for(const dark of [false,true]){
    const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,colorScheme:dark?'dark':'light'});
    const p=await ctx.newPage();
    await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
    await p.goto('file://'+page); await p.waitForTimeout(500);
    await p.evaluate(SEED); await p.reload(); await p.waitForTimeout(600);
    for(const [tab,name] of shots){
      await p.evaluate(t=>{SCR=null;S.tab=t;if(t==="food"){S.foodSub="search";S.foodQ="";S.foodCat="전체";S.foodLv="전체"}render()},tab);
      await p.waitForTimeout(400);
      await p.screenshot({path:path.join(OUT,`${name}${dark?'-dark':''}.png`)});
    }
    // 음식 상세 시트
    await p.evaluate(()=>{S.tab="food";render();showFood("white_fish")}); await p.waitForTimeout(500);
    await p.screenshot({path:path.join(OUT,`detail${dark?'-dark':''}.png`)});
    await ctx.close();
  }
  await b.close();
  console.log('saved to docs/screenshots');
})();
