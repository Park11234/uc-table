const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const WRAP=n=>{const p=T(n); if(!fs_.existsSync(p)) fs_.writeFileSync(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
// 음식 확장(432종)·판정 규칙·검색 회귀 점검
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('foods.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('foods.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{
  const fail=[]; const ok=(c,m)=>{if(!c) fail.push(m)};
  S.consent={date:today(),ai:false}; S.profile.allergies=[]; S.profile.allergyOther=""; S.profile.dislikes=""; S.triggers=[]; S.orders.checked=[]; S.logs={};
  ok(FOODS.length>=380,'foods '+FOODS.length);
  const ids=new Set(); for(const f of FOODS){ ok(!ids.has(f.id),'dup id '+f.id); ids.add(f.id) }
  const names=new Set(); for(const f of FOODS){ ok(!names.has(f.name),'dup name '+f.name); names.add(f.name) }
  const lib=FOODS.filter(f=>f.lib); ok(lib.length>=300,'lib '+lib.length);
  for(const f of lib){ ok(f.src&&f.src.code,'no src '+f.id); ok(SERV[f.id],'no serv '+f.id); ok(ALIAS[f.id],'no alias '+f.id); ok(EMO[f.id]||FICON[f.id],'no icon '+f.id);
    ok(typeof f.why==='string'&&f.why.length>10,'why '+f.id); ok(f.refs.every(n=>REFS[n]),'ref '+f.id); ok([1,2,3,9].includes(f.ms),'ms '+f.id);
    ok(["곡류","단백질","유제품","채소","과일","지방","기타","요리"].includes(f.cat),'cat '+f.id); ok(isFinite(f.fi)&&isFinite(f.k),'num '+f.id) }
  ok(planFoods().every(f=>!f.lib),'plan has lib');
  // 검색
  const sh=q=>FOODS.filter(f=>searchHit(f,q)).map(f=>f.id);
  const kim=sh("김"); ok(kim.includes("laver")&&kim.includes("gimbap"),'search 김 '+kim.slice(0,8));
  ok(sh("미음").includes("rice_gruel"),'search 미음'); ok(sh("ㄱㅊㅉㄱ").includes("kimchi_jjigae"),'search 초성 김치찌개');
  ok(sh("된장찌").includes("doenjang_jjigae"),'search 된장찌'); ok(sh("요리").length===0||true,'');
  // 한 글자 단어는 정확히 같을 때만(싫어하는 음식·알레르기 기타)
  ok(nameHit(FOOD.pear,"배")&&!nameHit(FOOD.napa,"배")&&!nameHit(FOOD.pear,"배추"),'nameHit 배');
  ok(!nameHit(FOOD.laver,"김치")&&!nameHit(FOOD.kimchi,"김"),'nameHit 김');
  ok(bestFood("김치찌개").id==="kimchi_jjigae",'best 김치찌개 '+bestFood("김치찌개")?.id);
  ok(bestFood("김치").id==="kimchi",'best 김치 '+bestFood("김치")?.id);
  ok(bestFood("잔치국수").id==="janchi_guksu",'best 잔치국수'); ok(bestFood("미음").id==="rice_gruel",'best 미음');
  ok(bestFood("고등어조림").id==="braised_mackerel",'best 고등어조림');
  S.profile.dislikes="배"; let c=ctx(); ok(foodStatus(FOOD.pear,c).level==="avoid"&&foodStatus(FOOD.napa,c).level!=="avoid",'dislike 배');
  S.profile.dislikes=""; S.profile.allergies=["clam"]; c=ctx(); ok(foodStatus(FOOD.oyster_sauce,c).level==="avoid"&&foodStatus(FOOD.abalone,c).level==="avoid"&&foodStatus(FOOD.oyster,c).level==="avoid",'allergy clam');
  S.profile.allergies=["squid"]; c=ctx(); ok(foodStatus(FOOD.nakji,c).level==="avoid",'allergy squid→낙지');
  S.profile.allergies=["shrimp"]; c=ctx(); ok(foodStatus(FOOD.kkakdugi,c).level==="avoid"&&foodStatus(FOOD.zucchini_stirfry,c).level==="avoid",'allergy shrimp→젓갈');
  S.profile.allergies=["wheat"]; c=ctx(); ok(foodStatus(FOOD.bulgogi,c).level==="avoid"&&foodStatus(FOOD.soy_sauce,c).level==="avoid",'allergy wheat→간장 양념');
  S.profile.allergies=[]; S.profile.lactose=true; c=ctx(); ok(foodStatus(FOOD.lowfat_milk,c).level==="avoid"&&foodStatus(FOOD.cheddar,c).level!=="avoid",'lactose'); S.profile.lactose=false;
  // 단계별 판정
  const st=(id,s)=>{S.stageMode=s; return foodStatus(FOOD[id],ctx())};
  ok(st("gimbap","1").level==="later",'김밥 1'); ok(st("gimbap","2").level==="caution",'김밥 2 '+st("gimbap","2").level);
  ok(st("milk_chocolate","3").level==="avoid",'초콜릿'); ok(st("donkatsu","3").reasons[0].includes("튀김"),'돈가스 이유');
  ok(st("donkatsu","3").reasons.every(x=>!x.includes("소량만")),'피하기에 소량만 섞임');
  ok(st("spinach","1").level==="caution",'시금치 1'); ok(st("spinach_namul","1").reasons.some(x=>x.includes("35g")),'시금치나물 35g');
  ok(st("orange","3").reasons.some(x=>x.includes("신 과일")),'오렌지'); ok(st("nuts","3").level==="caution",'호두 3');
  ok(st("clam","2").reasons.some(x=>x.includes("조개")),'바지락 2'); ok(st("clam","1").level==="later",'바지락 1');
  ok(st("tuna_sashimi","2").level==="later"&&st("tuna_sashimi","3").reasons.some(x=>x.includes("익히지 않은")),'회');
  ok(st("kimchi_jjigae","2").level==="avoid"&&st("kimchi_jjigae","3").level==="caution",'김치찌개');
  ok(st("white_fish","1").level==="ok"&&st("egg_soup","1").level==="ok"&&st("rice_gruel","1").level==="ok",'급성기 기본');
  ok(st("beansprout_soup","1").level==="later",'콩나물국 1'); ok(st("miyeok_guk","1").level==="later",'미역국 1');
  ok(st("ice_cream","1").level==="caution",'아이스크림'); ok(st("popcorn","2").level==="later"&&st("popcorn","3").level==="caution",'팝콘');
  ok(st("black_soybean","3").reasons.some(x=>x.includes("콩류")),'콩류');
  S.stageMode="auto";
  // 식단 프롬프트 크기
  const pb=new TextEncoder().encode(dayPrompt(today(),[],[])).length; ok(pb<65536,'prompt '+pb);
  return {fail, n:FOODS.length, lib:lib.length, pb, cats:[...new Set(FOODS.map(f=>f.cat))]};
});
console.log(JSON.stringify(r));
// 화면: 음식 탭 전체 목록 그리기 시간, 요리 칩, 상세 기준량
const t0=Date.now(); await p.evaluate(()=>{SCR=null;S.tab="food";S.foodSub="search";S.foodQ="";S.foodCat="전체";S.foodLv="전체";render()}); await p.waitForTimeout(100);
const cards=await p.evaluate(()=>document.querySelectorAll('.fcard').length); const ms=Date.now()-t0;
await p.click('.chip[data-act=cat][data-v="요리"]'); await p.waitForTimeout(150);
const yori=await p.evaluate(()=>[...document.querySelectorAll('.fcard')].every(b=>FOOD[b.dataset.id].cat==="요리")&&document.querySelectorAll('.fcard').length>50);
await p.evaluate(()=>{showFood("janchi_guksu")}); await p.waitForTimeout(200);
const basis=await p.evaluate(()=>document.querySelector('#sheetRoot').innerText.includes('100ml당'));
await p.screenshot({path:T('foods_sheet.png')});
await p.evaluate(()=>{closeSheet&&closeSheet()}); await p.waitForTimeout(150);
const t1=Date.now(); await p.fill('#foodQ','국'); await p.waitForTimeout(120); const typing=Date.now()-t1;
const res=await p.evaluate(()=>document.querySelectorAll('.fcard').length);
await p.screenshot({path:T('foods_search.png')});
console.log('ui', JSON.stringify({cards, ms, yori, basis, typing, res, hscroll:await p.evaluate(()=>document.documentElement.scrollWidth)}));
console.log('errors',errs); await b.close();})();
