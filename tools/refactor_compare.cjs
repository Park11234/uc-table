// 리팩토링 전후 동작 비교(v1.12.0 7차): 같은 시각(2026-10-27 12:00, 서울)·같은 기록으로 두 빌드를 열어
// 순수 함수 결과(조사·검색·판정·외식·원재료·점수·체중·CSV·진료 문서·장보기·캘린더·저장값 확인·합치기·그래프)와
// 화면 76개(탭·화면·시트)의 HTML을 모아 비교한다. 다른 곳이 있으면 처음 다른 자리를 보여 주고 실패(종료 코드 1).
// 사용: node tools/refactor_compare.cjs 옛.html 새.html [결과 폴더]
//   예) 고치기 전 src/app/index.html을 복사해 두고, 고친 뒤 빌드한 것과 비교한다. 동작을 일부러 바꾼 경우에는 그 자리만 다르게 나와야 한다
const path=require('path'), fs=require('fs');
const {chromium}=require('playwright');
const [,,OLD,NEW,OUT0]=process.argv; if(!OLD||!NEW){console.error('사용: node tools/refactor_compare.cjs 옛.html 새.html [결과 폴더]'); process.exit(2)} const OUT=path.resolve(OUT0||path.join(__dirname,'..','.test-out','refactor-compare')); fs.mkdirSync(OUT,{recursive:true});
const wrap=(src,name)=>{const f=path.join(OUT,name); fs.writeFileSync(f,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(src,'utf8')+'</body></html>'); return f};

const FIXCLOCK=()=>{const FIX=new Date(2026,9,27,12,0,0).getTime(); const _D=Date;
  class D extends _D{constructor(...a){if(!a.length) super(FIX); else super(...a)} static now(){return FIX}}
  D.UTC=_D.UTC; D.parse=_D.parse; window.Date=D; Math.random=(()=>{let s=7; return ()=>{s=(s*16807)%2147483647; return s/2147483647}})()};

// 기록이 많은 사용자(알레르기·약·지시·주의 음식·40일 증상·체중 2년·평가·직접 기록·검사·질문·재도입·내 메뉴·바코드)
const SEED=()=>{
  const t=today(); const L=(o)=>({...BLANK_LOG(),...o});
  S.consent={date:addDays(t,-200)}; S.onb="done"; S.persist="na"; S.stageMode="auto";
  S.profile={...S.profile,height:"171",weight:"61",age:"34",sex:"F",allergies:["shrimp","peach"],allergyOther:"땅콩버터, 키위",dislikes:"고등어, 가지 볶음",meds:["steroid","ssz"],medOther:"유산균",lactose:true,usualBM:"2",budgetMonth:20,budget:"보통"};
  S.orders={checked:["lowfat","fluid"],fluidMl:"1800",other:["우유는 하루 1컵까지"]};
  S.triggers=[{name:"짜장면",date:addDays(t,-30),source:"식단 평가",sym:["diarrhea","pain"],never:false},{name:"양배추",foodId:"cabbage",date:addDays(t,-20),source:"직접",sym:["gas"],never:true},{name:"카레(시판)",date:addDays(t,-10),source:"외식 판정",sym:["allergy"],never:true}];
  const logs={};
  for(let i=0;i<40;i++){const d=addDays(t,-i); if(i%7===5) continue;
    logs[d]=L({day:1+(i*7)%6,night:i%3,bloody:i%5===0?Math.min(2,(1+(i*7)%6)):0,urg:i%4,blood:i%5===0?(i%10===0?2:1):0,well:i%5,pain:(i*3)%10,stool:i%8,medtaken:i%5,extra:i%9===0?["관절통"]:[],other:i%11===0?["구토"]:[],gas:["","없음","약간","많음"][i%4],fatigue:["","약간"][i%2],temp:i%13===0?"37.9":i%6===0?"36.6":"",memo:i%8===0?"메모 "+i:"",...(i%9===4?{quick:true}:{})})}
  S.logs=logs;
  S.weights=[[-400,70],[-300,68.5],[-190,66],[-160,64],[-60,63],[-30,62],[-7,61.5],[-1,61]].map(([o,kg])=>({date:addDays(t,o),kg}));
  S.ratings=[{date:addDays(t,-1),slot:"아침",title:"흰죽",foodId:"rice_porridge",rating:"good"},{date:addDays(t,-2),slot:"점심",title:"x",foodId:"white_fish",rating:"bad",sym:["pain"]},{date:addDays(t,-3),slot:"제품",title:"딸기 우유",foodId:null,name:"딸기 우유",rating:"ok"},{date:addDays(t,-4),slot:"외식",title:"짬뽕",foodId:null,name:"짬뽕",rating:"bad"}];
  S.extras={[t]:[{name:"바나나",foodId:"banana",amt:100,unit:"g",slot:"S",kcal:89,p:1.1,fi:2.6,ca:5,na:1,vd:0},{name:"과자",amt:null,unit:"",kcal:0,p:0,fi:0,ca:0,noNutri:true}],[addDays(t,-2)]:[{name:"두유",foodId:"soy_milk",amt:190,unit:"ml",slot:"B",kcal:90,p:4,fi:1.7,ca:200,na:50,vd:1}]};
  S.ate={[addDays(t,-1)]:["아침","점심"],[addDays(t,-2)]:["저녁"]}; S.skips={[addDays(t,-1)]:["저녁"]};
  S.ateMeals={[addDays(t,-1)]:{"아침":{t:"흰죽과 급식 계란찜",it:[["rice_porridge",300],["egg_steamed",120]]},"점심":{t:"닭죽",it:[["chicken_porridge",400]],r:0.5}},[addDays(t,-2)]:{"저녁":{t:"소고기무국과 흰밥",it:[["white_rice",180],["beef",50]],r:1.5}}};
  S.water={[t]:3,[addDays(t,-1)]:6,[addDays(t,-3)]:8};
  S.labs=[{date:addDays(t,-15),k:"crp",v:"3.2",note:"진료"},{date:addDays(t,-15),k:"med",v:"",note:"메살라진 4g"}];
  S.qs=[{id:"a1",t:"철분제를 계속 먹어도 됩니까?",date:addDays(t,-3),done:""},{id:"a2",t:"백신은?",date:addDays(t,-20),done:addDays(t,-10)}];
  S.care={flu:addDays(t,-400),vaccine:addDays(t,-30),mood:addDays(t,-20)};
  S.reintro={active:null,history:[{name:"우유",foodId:"milk",start:addDays(t,-40),end:addDays(t,-37),days:[{r:"없음"},{r:"약간"},{r:"없음"}],result:"pass"}]};
  S.myMenus=[{id:"m1",slot:"L",title:"내 점심",items:[["white_rice",200],["tofu",80]]}];
  S.barcodes={"8801234567893":{id:"rice_porridge",date:addDays(t,-5)}}; S.okMenus=["짬뽕"]; S.favs=["banana","rice_porridge"]; S.seen=["tofu","milk"];
  S.goals={p:70}; S.remind={on:["B","log"],t:{B:"08:00",L:"12:30",D:"18:30",log:"11:00",water:"10:30"}}; S.remindLog=false; S.lastBackup=addDays(t,-9); S.chgDays=[addDays(t,-3),addDays(t,-1)];
  save();
};

const BATTERY=()=>{
  const out={}; const J=x=>JSON.parse(JSON.stringify(x,(k,v)=>v instanceof Set?[...v]:v));
  const W=["사과","귤","밥","쌀","라면","김치찌개","우유(락토프리)","치즈 ","STRIDE","","돼지 갈비(양념)","물","닭","곰탕","콩","칼","길","빵 ","볶음밥(새우)"];
  out.josa=W.map(w=>[w,eunNeun(w),euRo(w),iGa(w),euroReul(w)]);
  const Q=["우유","웅","ㅇㅇ","ㄴㄹㅈ","김","밥","죽","찌개","해물","해무","소주","사이다","두유","banana","Milk","ice cream","coffee","라떼","ㅎㅐㅁ","닭가슴","치킨","스파게티","constructor","toString","  흰  죽 ","ㄳ","라","면","국","떡","Truelove","핫도그","새우","게","호두","잣","콩나물","김밥","주먹밥","만두","ㅁㄷ"];
  out.search=Q.map(q=>[q,FOODS.filter(f=>searchHit(f,q)).map(f=>f.id).join(","),FOODS.filter(f=>searchHit(f,q,false)).length,(bestFood(q)||{}).id||"",(exactFood(q)||{}).id||"",FOODS.slice(0,400).map(f=>searchRank(f,q)).join(""),suggestFoods(q).map(f=>f.id).join(","),engQuery(q),qaFind(q).map(x=>x.id).join(",")]);
  out.namehit=["김","배","닭","고등어","땅콩","새우","우유","가지 볶음","가지"].map(w=>[w,FOODS.filter(f=>nameHit(f,w)).map(f=>f.id).join(","),FOODS.filter(f=>ingrHit(f,w)).map(f=>f.id).join(",")]);
  const states=[{},{stageMode:3},{stageMode:1},{stageMode:2,meds:[]},{allergies:[],allergyOther:"",dislikes:"",triggers:[]}];
  out.status=states.map(st=>{const keep=JSON.stringify(S); if(st.stageMode!=null) S.stageMode=st.stageMode; if(st.meds) S.profile.meds=st.meds; if(st.allergies) S.profile.allergies=st.allergies; if(st.allergyOther!=null) S.profile.allergyOther=st.allergyOther; if(st.dislikes!=null) S.profile.dislikes=st.dislikes; if(st.triggers) S.triggers=st.triggers;
    const c=ctx(); const r=FOODS.map(f=>{const s=foodStatus(f,c); return f.id+"="+s.level+"|"+s.reasons.join("/")+"|"+s.refs.join(",")+"|"+s.note}).join("\n"); const alts=["ham","fried_chicken","ramen","milk","kimchi","pizza","sundae_gukbap","coffee"].filter(i=>FOOD[i]).map(i=>i+":"+altFoods(FOOD[i],c).map(g=>g.id).join(",")).join(";");
    const plan=JSON.stringify(samplePlan()); const tg=JSON.stringify(targets()); S=JSON.parse(keep); return {r,alts,plan,tg}});
  const items=[{name:"짜장면",ingr:[],cook:""},{name:"연어 포케",ingr:["연어","현미","간장"],cook:""},{name:"크림 파스타",ingr:[],cook:""},{name:"샐러드",ingr:[],cook:""},{name:"막걸리 수육",ingr:[],cook:""},{name:"카레",ingr:["카레가루","감자"],cook:"끓이기"},{name:"땅콩버터 토스트",ingr:["땅콩버터","식빵"],cook:""},{name:"육회 비빔밥",ingr:[],cook:""},{name:"제로 콜라",ingr:["에리스리톨","아스파탐"],cook:""},{name:"양배추쌈",ingr:[],cook:""},{name:"새우볶음밥",ingr:[],cook:""},{name:"고등어구이",ingr:[],cook:""}];
  out.rules=items.map(it=>J(ruleCheck(it)));
  MJ={step:"confirm",items:JSON.parse(JSON.stringify(items)),results:[],err:"",text:""}; mjJudge(); out.mj=J(MJ.results); MJ={step:"idle",items:[],results:[],err:"",text:""};
  const labels=["원재료명: 소맥분(밀:미국산), 설탕, 탈지분유(우유), 새우분말(새우), 정제카라기난, 말티톨, 정제소금 이 제품은 메밀, 대두, 땅콩, 게를 사용한 제품과 같은 제조시설에서 제조하고 있습니다","정제수, 백설탕, 카라기난, 수크랄로스(감미료), 우유 함유","돼지고기, 아질산나트륨, 정제소금, 맛술3%(주정), 청주","팜유, 이눌린, 액상과당, 양파, 마늘, 생연어","", "고추장, 키위, 땅콩버터, 짜장"];
  out.labels=labels.map(t=>J(labelCheck(t,"테스트")));
  out.nutri=[{basisAmt:100,basisUnit:"g",fiber:3,fat:5,sodium:300,sugar:8,polyol:1,trans:0.2,kcal:200,protein:5,calcium:100},{basisAmt:200,basisUnit:"ml",fiber:null,fat:2,sodium:100,sugar:6,kcal:120,protein:6}].map(n=>J(nutriCheck(n,150)));
  out.recipes=Object.entries(RECIPES).map(([id,r])=>id+":"+JSON.stringify(recipeNotes(r)));
  const logs=[]; for(let a=0;a<6;a++) for(let n=0;n<4;n++) for(let b=0;b<4;b++) for(let bl of [0,1,3,7]) logs.push({...BLANK_LOG(),day:a*2,night:n,blood:b,bloody:bl,urg:(a+b)%4,well:(a+n)%5,pain:(a*3+b)%11,temp:["","37.6","36.5","38"][(a+b+n)%4],other:(a+n)%3===0?["오한","어지러움"]:(a%2?["구토"]:[]),extra:b>2?["관절통"]:[]});
  out.scores=logs.map(l=>JSON.stringify([pro2(l),twGrade(l),dangerSignals(l),activity(l),actNote(activity(l)),actText(l,activity(l)),symSum(l),bloodMismatch(l)])).join("\n");
  out.weights=J({wc:weightChange(),wl:weightLoss(),bw:bodyWeight(),glim:glimHTML(),bmi:bmiInfo()});
  out.csv=J([csvRows("logs"),csvRows("food")]); out.csvText=csvText(csvRows("logs")).slice(0,3000);
  out.report=reportBlocks().blocks.join("\n");
  out.shop=shopText(); out.ics=icsText(new Date(2026,9,27,12,0,0));
  out.misc=J({remindDue:remindDue(),cs:currentStage(),trend:trend3(),sus:foodSuspects(),ri:reintroEligible(),unbacked:unbackedDays(),kdri:kdri(),warn:warnItems().map(w=>w.id+w.tag),fmeta:FOODS.slice(0,200).map(fMeta),serv:FOODS.slice(0,300).map(f=>servLabel(f.id,(SERV[f.id]||[100])[0]*0.5)),wb:FOODS.map(f=>wBasis(f).k).join(""),miss:missNote(totals([["garlic",10],["rice_porridge",100]]),"na"),rsum:recSummary(S),ridge:ridgeText(),scaled:scaledTxt({fk:1.2,fp:0.8}),plabel:Object.keys(PLABEL).slice(0,40).map(plabelText),prevLabel:prevLabel("2026-10-01T03:04:05Z"),dayNo:dayNo("2026-10-27"),riDay:riDay(),gt:["8801234567893","12345670","0"].map(gtinOK)});
  const raws=[{},{logs:{"2026-10-01":{day:"3",temp:"380",pulse:"90"}},profile:{allergies:["shellfish","nut"],budgetMonth:"5"}},{logs:{"x":1},profile:{},weights:[{date:"2026-01-01",kg:"60"}],plan:{days:[{date:"2026-10-27",meals:[{title:"a",items:[["rice_porridge",100]]}]}]}}];
  out.norm=raws.map(r=>{try{return JSON.stringify(normalizeState({...r,profile:r.profile||{},logs:r.logs||{}}))}catch(e){return "ERR "+e.message}});
  const bk=JSON.parse(backupJSON()); bk.logs={"2026-09-01":{...BLANK_LOG(),day:4}}; bk.profile.allergyOther="잣, 키위"; out.merge=J(mergeCore(S,bk).st);
  out.charts=[[640,220,14,""],[640,220,14,"print"],[640,220,1,""],[1392,460,14,"stool"],[1392,460,30,"stool"],[1392,460,1,"stool"]].map(([w,h,n,th])=>{const cv=document.createElement('canvas'); cv.width=w; cv.height=h; const from=addDays(today(),-(n-1)); if(th==="stool") drawStoolChart(cv,from,n); else drawSymChart(cv,from,n,th||undefined); return cv.toDataURL()});
  return out;
};

const SCREENS=async(p)=>{
  const shots={};
  const cap=async(name,fn,again)=>{await p.evaluate(fn); await p.waitForTimeout(again?500:30); if(again) await p.evaluate(()=>render()); shots[name]=await p.evaluate(()=>{const n=h=>h.replace(/ a-(fade|push|fwd|bwd)/g,""); return {app:document.querySelector('#appbar').innerHTML,main:n(document.querySelector('#main').innerHTML),sheet:document.querySelector('#sheetRoot').innerHTML}})};
  for(const tab of ["plan","log","food","me"]) await cap("tab_"+tab,`closeSheet(); SCR=null; S.tab="${tab}"; S.foodSub="search"; render()`);
  for(const sub of ["menu","label"]) await cap("food_"+sub,`closeSheet(); SCR=null; S.tab="food"; S.foodSub="${sub}"; render()`);
  await cap("food_q","closeSheet(); SCR=null; S.tab='food'; S.foodSub='search'; S.foodQ='김치'; render()");
  await cap("food_q2","S.foodQ='banana'; render()"); await cap("food_q3","S.foodQ='없는음식ㅋ'; render()"); await cap("food_q4","S.foodQ='찌게'; render()"); await cap("food_q0","S.foodQ=''; S.foodLv='now'; S.foodCat='곡류'; render()");
  await cap("food_reset","S.foodLv='전체'; S.foodCat='전체'; render()");
  const SCRS=["reintro","pdf","set-profile","set-weight","set-orders","set-allergy","set-meds","set-diet","set-labs","set-trig","set-stage","set-data","set-refs","set-remind","set-about","care","qa","set-privacy","nutri","report","set-goals","set-home","asks"];
  for(const s of SCRS) await cap("scr_"+s,`closeSheet(); openScr("${s}")`,s==="set-data");
  await cap("scr_past",`closeSheet(); openScr("past",{date:addDays(today(),-1)})`);
  for(const k of [0,1,2]) await cap("scr_meal"+k,`closeSheet(); SCR=null; S.tab="plan"; rateDraft=null; openScr("meal",{k:${k}})`);
  for(let st=0;st<6;st++) await cap("wz"+st,`closeSheet(); openWizard(addDays(today(),-1)); WZ.step=${st}; render()`);
  await cap("wzq0","closeSheet(); openWizard(today(),true); render()"); await cap("wzq1","WZ.step=1; render()");
  await cap("scr_reintro_active",`closeSheet(); S.reintro.active={name:"우유",foodId:"milk",start:addDays(today(),-1),days:[{r:"없음"},{},{}]}; openScr("reintro")`);
  await cap("sh_food",`S.reintro.active=null; closeScr(); showFood("kimchi")`); await cap("sh_food2",`showFood("ham")`); await cap("sh_food3",`showFood(Object.keys(PSRC)[0])`); await cap("sh_food4",`NUT_BASIS="100"; showFood("white_rice")`);
  await cap("sh_extra",`NUT_BASIS="serv"; closeSheet(); openExtraSheet(today())`); await cap("sh_extra2",`EX.id="banana"; renderExtraSheet()`); await cap("sh_extra3",`EX.id=null; EX.q="김"; renderExtraSheet()`);
  await cap("sh_filter",`closeSheet(); openSheet(filterSheetHTML())`);
  await cap("sh_bad",`closeSheet(); openBadSheet([{key:"x",name:"짜장면"},{key:"y",name:"새우튀김",foodId:FOOD.shrimp?"shrimp":null}],"meal")`);
  await cap("sh_bad2",`BAD.list[0].sym=["allergy","blood"]; renderBadSheet(); BAD.list[1].sym=["taste"]; renderBadSheet()`);
  await cap("sh_trig",`closeSheet(); openTrigPicker()`);
  await cap("sh_mp",`closeSheet(); SCR=null; S.tab="plan"; render(); MP={k:1,q:""}; renderMenuPick()`); await cap("sh_mp2",`MP.q="두부"; renderMenuPick()`);
  await cap("sh_mm",`closeSheet(); MM={slot:"L",title:"",items:[["white_rice",200],["kimchi",40]],q:"두부",fromK:1}; renderMyMenu()`);
  await cap("sh_shop",`closeSheet(); renderShop()`);
  await cap("sh_bc",`closeSheet(); BC={code:"8801234567890",q:"햇반",scan:false,err:"",stop:null}; openSheet(bcSheet())`);
  await cap("sh_refs",`closeSheet(); showRefs([1,2,90,91,40])`);
  await cap("sh_info",`closeSheet(); openSheet(infoBody("log"))`);
  await cap("mj_done",`closeSheet(); SCR=null; S.tab="food"; S.foodSub="menu"; MJ={step:"confirm",items:[{name:"짜장면",ingr:[],cook:""},{name:"샐러드",ingr:[],cook:""},{name:"연어 포케",ingr:["연어"],cook:""}],results:[],err:"",text:""}; mjJudge()`);
  await cap("lb_done",`MJ={step:"idle",items:[],results:[],err:"",text:""}; S.foodSub="label"; LB={...LB,step:"done",text:"정제수, 설탕, 카라기난, 우유",name:"딸기 우유",nutri:{basis:"",basisAmt:200,basisUnit:"ml",kcal:150,protein:6,fat:4,trans:0,sugar:20,polyol:null,fiber:0,sodium:120,calcium:200},eat:"",err:""}; lbRun(); render()`);
  await cap("restore_sheet",`closeSheet(); SCR=null; const bk=JSON.parse(backupJSON()); bk.logs={"2026-09-01":{...BLANK_LOG(),day:4}}; restoreFromText(JSON.stringify(bk))`);
  await cap("welcome",`closeSheet(); S.consent=null; render()`); await cap("onb0",`S.consent={date:today()}; S.onb="0"; render()`,true);
  for(const o of ["1","2","3"]) await cap("onb"+o,`S.onb="${o}"; render()`);
  await cap("print",`S.onb="done"; render(); printReport=printReport; {let box=document.getElementById("printDoc"); const {blocks}=reportBlocks(); window.__rep=blocks.join("")}`);
  shots.reportHTML=await p.evaluate(()=>window.__rep);
  return shots;
};

(async()=>{
  const b=await chromium.launch();
  const run=async(src,tag)=>{
    const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:"Asia/Seoul",locale:"ko-KR"});
    await ctx.addInitScript(FIXCLOCK);
    const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.route(/^https?:/,r=>r.fulfill({body:''}));
    const f=wrap(src,tag+'.html');
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:30000});
    await p.goto('file://'+f); await ready(); await p.evaluate(SEED); await p.reload(); await ready(); await p.waitForTimeout(200);
    const bat=await p.evaluate(BATTERY);
    const scr=await SCREENS(p);
    await ctx.close();
    return {bat,scr,errs};
  };
  const A=await run(OLD,'old'), B=await run(NEW,'new');
  await b.close();
  fs.writeFileSync(path.join(OUT,'old.json'),JSON.stringify(A,null,1)); fs.writeFileSync(path.join(OUT,'new.json'),JSON.stringify(B,null,1));
  let diff=0;
  const cmp=(a,b,pre)=>{const ka=new Set([...Object.keys(a||{}),...Object.keys(b||{})]); for(const k of ka){const x=JSON.stringify(a?.[k]), y=JSON.stringify(b?.[k]); if(x!==y){diff++; let i=0; while(i<x?.length&&x[i]===y?.[i]) i++; console.log(`DIFF ${pre}${k} @${i}\n  old: ${(x||"").slice(Math.max(0,i-120),i+200)}\n  new: ${(y||"").slice(Math.max(0,i-120),i+200)}`)}}};
  cmp(A.bat,B.bat,'bat.'); cmp(A.scr,B.scr,'scr.');
  console.log('errors old:',A.errs.length,A.errs.slice(0,3),'new:',B.errs.length,B.errs.slice(0,3));
  console.log('keys bat',Object.keys(A.bat).length,'screens',Object.keys(A.scr).length,'diffs',diff);
  process.exitCode=diff?1:0;
})().catch(e=>{console.error(e); process.exit(2)});
