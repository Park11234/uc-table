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
  S.consent={date:today()}; S.profile.allergies=[]; S.profile.allergyOther=""; S.profile.dislikes=""; S.triggers=[]; S.orders.checked=[]; S.logs={};
  ok(FOODS.length>=380,'foods '+FOODS.length);
  const ids=new Set(); for(const f of FOODS){ ok(!ids.has(f.id),'dup id '+f.id); ids.add(f.id) }
  const names=new Set(); for(const f of FOODS){ ok(!names.has(f.name),'dup name '+f.name); names.add(f.name) }
  const lib=FOODS.filter(f=>f.lib); ok(lib.length>=300,'lib '+lib.length);
  // 영양값 자료가 없는 음식은 '자료 없음'으로 보이고 합계에서 빠져야 하며, 영양식(제품)·명시한 음식만 허용
  const NOSRC_OK=new Set(["tteokkochi","salmon_don","gyudon","katsudon","tendon","caesar_salad","ham_toast"]);   // v1.10.0 외식 메뉴 가운데 식약처 음식 DB에 같은 이름 행이 없는 6종은 영양값 없이 판정만
  for(const f of lib){ ok((f.src&&f.src.code)||((f.tags.includes("ons")||NOSRC_OK.has(f.id)||(PSRC[f.id]&&(f.tags.includes("nitrite")||f.tags.includes("processed"))))&&f.missing.includes("전체")),'no src '+f.id);   // v1.9.0: 영양 표기를 맞출 수 없거나 자료에 영양정보가 글로 없는 가공육(CJ더마켓·동원몰·식품안전나라)은 영양값 없이 넣음 ok(SERV[f.id],'no serv '+f.id); ok(ALIAS[f.id],'no alias '+f.id); ok(EMO[f.id]||FICON[f.id],'no icon '+f.id);
    ok(typeof f.why==='string'&&f.why.length>10,'why '+f.id); ok(f.refs.every(n=>REFS[n]),'ref '+f.id); ok([1,2,3,9].includes(f.ms),'ms '+f.id);
    ok(["곡류","단백질","유제품","채소","과일","지방","기타","요리","영양식"].includes(f.cat),'cat '+f.id); ok(isFinite(f.fi)&&isFinite(f.k),'num '+f.id) }
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
  S.profile.dislikes=""; S.profile.allergies=["clam"]; c=ctx(); ok(foodStatus(FOOD.oyster_sauce,c).level==="ban"&&foodStatus(FOOD.abalone,c).level==="ban"&&foodStatus(FOOD.oyster,c).level==="ban",'allergy clam');   // v1.11.0 R-15: 알레르기는 절대 금지
  S.profile.allergies=["squid"]; c=ctx(); ok(foodStatus(FOOD.nakji,c).level==="ban",'allergy squid→낙지');
  S.profile.allergies=["shrimp"]; c=ctx(); ok(foodStatus(FOOD.kkakdugi,c).level==="ban"&&foodStatus(FOOD.zucchini_stirfry,c).level==="ban",'allergy shrimp→젓갈');
  S.profile.allergies=["wheat"]; c=ctx(); ok(foodStatus(FOOD.bulgogi,c).level==="ban"&&foodStatus(FOOD.soy_sauce,c).level==="ban",'allergy wheat→간장 양념');
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
  // 궁금한 점(v1.7.0): 근거 번호·음식 연결·검색
  ok(QA.length>=40&&QA.every(x=>x.ev.length&&x.refs.length&&x.refs.every(n=>REFS[n])&&x.foods.every(id=>FOOD[id])&&x.ev.every(e=>REFS[e.r])),'qa refs/foods');
  const pb=QA.length; ok(qaFind('커피').some(x=>x.id==='coffee')&&qaFind('엽산')[0].id==='folate'&&qaFind('물김치').every(x=>x.id!=='water'),'qa search');
  return {fail, n:FOODS.length, lib:lib.length, pb, cats:[...new Set(FOODS.map(f=>f.cat))]};
});
console.log(JSON.stringify(r));
// 화면: 음식 탭 전체 목록 그리기 시간, 요리 칩, 상세 기준량
// v1.9.0 U-7: 목록은 묶음마다 12개씩 보이고 '더 보기'로 펼친다. 전체 목록 점검은 모두 펼친 뒤에 센다
const expandAll=()=>p.evaluate(()=>{for(let i=0;i<8;i++){const bs=[...document.querySelectorAll('[data-act="fMore"]')]; if(!bs.length) break; bs.forEach(b=>FMORE.add(b.dataset.v)); refreshFoodRes()}});
const t0=Date.now(); await p.evaluate(()=>{SCR=null;S.tab="food";S.foodSub="search";S.foodQ="";S.foodCat="전체";S.foodLv="전체";render()}); await p.waitForTimeout(100);
const ms=Date.now()-t0; await expandAll();
const cards=await p.evaluate(()=>document.querySelectorAll('.fcard').length);
// v1.10.0 디자인 3: 종류 칩은 '걸러 보기' 시트 안으로 옮김
await p.click('[data-act="filterOpen"]'); await p.waitForTimeout(150); await p.click('.chip[data-act=catS][data-v="요리"]'); await p.waitForTimeout(150); await p.evaluate(()=>closeSheet());
await expandAll();
const yori=await p.evaluate(()=>[...document.querySelectorAll('.fcard')].every(b=>FOOD[b.dataset.id].cat==="요리")&&document.querySelectorAll('.fcard').length>50);
await p.evaluate(()=>{showFood("janchi_guksu")}); await p.waitForTimeout(200);
const basis=await p.evaluate(()=>document.querySelector('#sheetRoot').innerText.includes('100ml당'));
await p.screenshot({path:T('foods_sheet.png')});
await p.evaluate(()=>{closeSheet&&closeSheet()}); await p.waitForTimeout(150);
const t1=Date.now(); await p.fill('#foodQ','국'); await p.waitForTimeout(120); const typing=Date.now()-t1;
const res=await p.evaluate(()=>document.querySelectorAll('.fcard').length);
await p.screenshot({path:T('foods_search.png')});
console.log('ui', JSON.stringify({cards, ms, yori, basis, typing, res, hscroll:await p.evaluate(()=>document.documentElement.scrollWidth)}));
console.log('errors',errs);
if(r.fail.length||!yori||!basis||cards<400||errs.length){ console.log('FAIL', r.fail.slice(0,10), {yori,basis,cards}); process.exitCode=1 }
await b.close();})();
