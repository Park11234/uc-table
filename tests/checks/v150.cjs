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
// v1.5.0 점검: 영양식 판정, 나트륨·지방·빈 값 규칙, 검색 정확 일치, 메뉴 고르기·내 메뉴, 장보기 목록, 알림(캘린더 파일)
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
fs.writeFileSync(T('v150.html'),'<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
await p.goto('file://'+WRAP('v150.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{
  S.consent={date:today()}; S.profile.allergies=[]; S.profile.lactose=false; S.triggers=[]; S.orders.checked=[]; S.logs={}; S.stageMode=1;
  const fail=[]; const ok=(c,m)=>{if(!c) fail.push(m)};
  const st=(id,x={})=>foodStatus(FOOD[id],{...ctx(),...x});
  const has=(id,re,x)=>st(id,x).reasons.some(r=>re.test(r));
  // 1. 영양식
  ok(st("newcare_kd").level==="avoid"&&has("newcare_kd",/신장질환자용/),"신장질환자용은 피하기"); ok(st("greenbia_gut").level==="avoid"&&has("greenbia_gut",/경관/),"경관급식 전용은 피하기");
  ok(st("newcare_gosu").level==="caution"&&has("newcare_gosu",/특수의료용도식품/),"특수의료용도식품은 주의");
  S.orders.checked=["ons"]; ok(!has("newcare_gosu",/특수의료용도식품/),"영양 보충음료 지시가 있으면 상담 문구 빼기"); S.orders.checked=[];
  ok(FOOD.newcare_balanceup.fod==="high"&&FOOD.newcare_coffee.fod==="high","프락토올리고당 제품은 FODMAP 높음");
  ok(FOOD.newcare_cancer.fod==="high"&&FOOD.newcare_hiprotein.fod==="high","치커리 섬유 제품은 FODMAP 높음");
  ok(st("newcare_fiber",{stage:1,fiberStage:1}).level==="later","식이섬유 강화 제품은 저잔사식 단계 보류");
  const S3={stage:3,fiberStage:3}; ok(has("newcare_dangplan",/감미료/,S3)&&has("newcare_dangplan",/특정 질환용/,S3)&&st("newcare_dangplan",{stage:1,fiberStage:1}).level==="later","당뇨용: 감미료·질환용 주의(섬유 7g이라 저잔사식은 보류)");
  ok(has("elemental028",/성분영양식/),"성분영양식 주의"); ok(has("newcare_highcal",/확인하지 못한 제품/,S3)&&!has("newcare_black_sesame",/확인하지 못한 제품/,S3),"확인 못 한 제품 주의");
  // v1.5.1: 2차로 확인한 제품 표시값(1팩 → 100ml당)과 원재료 판정
  ok(Math.abs(FOOD.newcare_black_sesame.k-100)<0.01&&FOOD.newcare_black_sesame.kal===175&&!FOOD.newcare_black_sesame.tags.includes("dairy")&&FOOD.newcare_black_sesame.tags.includes("sesame"),"검은깨맛 표시값·우유 원료 없음·참깨");
  ok(FOOD.newcare_dangplan.kal===230&&FOOD.newcare_dangplan.fe===1.2,"당플랜 칼륨·철 보강");
  ok(FOOD.newcare_dangplan_pro.fod==="high"&&FOOD.newcare_dangplan_pro.tags.includes("polyol")&&FOOD.newcare_dangplan_pro.tags.includes("hifiber"),"당플랜 프로: 돼지감자 추출분말 FODMAP·당알코올·섬유 강화");
  ok(st("curewell",S3).level==="caution"&&st("curewell",{stage:1,fiberStage:1}).level==="later"&&FOOD.curewell.tags.includes("peanut")&&FOOD.curewell.fi===3.5,"큐어웰: 섬유 7g 제품 저잔사식 보류·땅콩 함유");
  ok(FOOD.newcare_fiber.fod==="high"&&FOOD.newcare_fiber.tags.includes("dairy")&&!FOOD.newcare_fiber.tags.includes("unverified")&&FOOD.newcare_mini_sesame&&!FOOD.newcare_mini_sesame.tags.includes("dairy")&&FOOD.newcare_ibd.tags.includes("sweetener"),"화이바·미니 검은깨·IBD 플러스 원재료");
  S.profile.allergies=["peanut"]; ok(st("curewell",S3).level==="ban",'큐어웰 땅콩 알레르기 절대 금지(v1.11.0 R-15)'); S.profile.allergies=[];
  ok(FOOD.carewell_gosu.fod==="high"&&FOOD.carewell_gosu.ca===72.5,"케어웰 프락토올리고당·칼슘");
  ok(FOOD.mediwell_renal.k===200&&st("mediwell_renal").level==="avoid"&&FOOD.mediwell_renal_hd,"메디웰 신장식 비투석 값·투석 따로");
  ok(FOOD.newcare_gosu.src&&FOOD.newcare_gosu.src.kind==="L"&&Math.abs(FOOD.newcare_gosu.k-100)<1&&FOOD.newcare_gosu.na===85,"뉴케어 구수한맛 순 100ml당 값");
  ok(FOOD.newcare_balanceup.k===100&&FOOD.newcare_balanceup.fi>3,"밸런스업 230ml 표시값 환산");
  ok(!FOOD.ons&&!TPL.S.some(m=>m.items.some(([id])=>FOOD[id]&&FOOD[id].tags.includes("ons"))),"일반 균형영양식 항목 없음·예시 식단에 영양식 없음(v1.5.2)");
  // FODMAP 전수 점검(v1.5.2): 공개 자료와 다르던 등급, 2차 자료 표시, 근거 번호
  ok(FOOD.oyster_mushroom.fod==="low"&&FOOD.button_mushroom.fod==="high"&&FOOD.shiitake.fod==="unk"&&FOOD.wood_ear.fod==="low","버섯은 종류별 등급(느타리 낮음·양송이 높음·표고 미확인)");
  ok(FOOD.corn.fod==="amount"&&FOOD.grape.fod==="high"&&FOOD.fig.fod==="high"&&FOOD.celery.fod==="high"&&FOOD.kimchi.fod==="amount"&&FOOD.cherry_tomato.fod==="amount","옥수수·포도·무화과·셀러리·김치·방울토마토 등급");
  ok(FOOD.donut.fod==="high"&&FOOD.sujebi.fod==="high"&&FOOD.bean_sprout.fod==="unk"&&FOOD.gochujang.fod==="unk"&&FOOD.gochujang.fodRefs.includes(56),"밀 반죽은 높음·자료 없는 음식은 미확인");
  ok(FOODS.every(f=>!/2차 자료/.test(f.fodNote)||f.fodRefs.includes(58))&&FOODS.every(f=>f.fodRefs.every(n=>REFS[n])),"2차 자료 표시에는 근거 58, 모든 FODMAP 근거 번호가 참고문헌에 있음");
  // 시판 과자·사탕·젤리·초콜릿(v1.6.1): 제조사 공식 자료(근거 62·63·65·66·67)와 식약처 가공식품 DB 대조, 원재료에 따른 태그
  const SNK=FOODS.filter(f=>f.src&&f.src.kind==="L"&&[62,63,65,66,67].some(n=>[].concat(f.src.ref).includes(n)));
  ok(SNK.length===83&&SNK.every(f=>[].concat(f.src.ref).includes(27)&&(f.tags.includes("snack")||f.tags.includes("candy"))),"시판 과자·사탕·젤리 83종, 모두 식약처 DB 근거(27)와 검색 묶음 태그");
  ok(Math.round(FOOD.saeukkang.k)===517&&Math.round(FOOD.saeukkang.na)===678&&Math.round(FOOD.ace_cracker.k)===533&&Math.round(FOOD.doritos_nacho.k)===483&&FOOD.ojingeo_ttangkong.k===496&&FOOD.ojingeo_ttangkong.missing.includes("식이섬유"),"포장 표시 환산(1회 열량 환산 포함)·사이트 대조 제품은 DB 값, 확인 못 한 섬유는 자료 없음");
  ok(["onion_ring_ns","kkulkwabaegi","potato_chip_ns","doritos_nacho","shinjjang","jocheong_yugwa"].every(id=>FOOD[id].tags.includes("fried")&&FOOD[id].ms===9)&&["saeukkang","jagalchi","banana_kick","ace_cracker","jolly_pong","cham_cracker"].every(id=>!FOOD[id].tags.includes("fried")),"유탕처리제품만 튀김 규칙(피하기), 유처리제품은 아님");
  ok(["chocosongi","bichobi","hotbreak","bigpie_berry","concho","pepero_almond","abc_choco","crunky","kancho","montshell","gana_milk","chocopie","chokchok_chocochip"].every(id=>FOOD[id].tags.includes("choco")&&FOOD[id].ms===9)&&["margaret","orion_custard","baebae","sando_berry","butter_waffle"].every(id=>!FOOD[id].tags.includes("choco")),"초콜릿이 든 제품만 초콜릿 규칙(피하기)");
  ok(["anytime_candy","maichew_berry","malangcow_milk","jagalchi","ojingeojip","margaret","montshell"].every(id=>FOOD[id].tags.includes("polyol"))&&FOOD.anytime_candy.fod==="high"&&FOOD.gogumakkang.fod==="high"&&FOOD.potato_chip_ns.fod==="low","당알코올·프락토올리고당 원료 표시");
  ok(FOOD.gana_milk.tags.includes("lactose")&&FOOD.malangcow_milk.tags.includes("lactose")&&FOOD.chocopie.tags.includes("unverified")&&[].concat(FOOD.chocopie.src.ref).includes(63)&&FOOD.jagalchi.tags.includes("fish")&&FOOD.harvest.tags.includes("sesame")&&FOOD.almond_candy.tags.includes("nut"),"유당·원재료 미확인·생선·참깨·견과 태그");
  ok(["dreamcacao56","dreamcacao72","dreamcacao82","chicchoc","zec","butter_coconut","kkokkalcorn"].every(id=>!FOOD[id]),"식약처 DB와 맞지 않거나 DB에 없는 제품은 넣지 않음(v1.6.0 제품 7종 뺌)");
  ok(FOODS.filter(f=>(QTAG["사탕"]||[]).some(t=>f.tags.includes(t))).map(f=>f.id).filter(id=>["mygummy","mok_candy","gummy","sugarfree_candy"].includes(id)).length===4,"'사탕' 검색 묶음");
  S.profile.allergyOther="사과"; { const a=foodStatus(FOOD.kkulkwabaegi), b=foodStatus(FOOD.saeukkang);
    ok(a.level==="ban"&&a.reasons.some(r=>r.includes("원재료"))&&!b.reasons.some(r=>r.includes("원재료")),"직접 적은 알레르기(사과)를 원재료(사과농축액)와 대조(v1.11.0 R-15: 알레르기는 절대 금지)"); }
  S.profile.allergyOther="밀"; ok(!foodStatus(FOOD.saeukkang).reasons.some(r=>r.includes("원재료")),"한 글자는 원재료 대조에 쓰지 않음"); S.profile.allergyOther="";
  ok(!FOOD.meiji_kouka86&&!FOOD.lindt_ex85,"한국 포장 표시를 확인하지 못한 수입 초콜릿은 넣지 않음");
  // 시판 라면(v1.6.2): 농심몰(68)·오뚜기몰(69)·삼양식품 홈페이지(70) 포장 표시 + 식약처 가공식품 DB(27) 대조
  const RMN=FOODS.filter(f=>f.src&&f.src.kind==="L"&&[68,69,70].some(n=>[].concat(f.src.ref).includes(n)));
  ok(RMN.length===55&&RMN.every(f=>[].concat(f.src.ref).includes(27)&&f.tags.includes("instant")&&f.tags.includes("salty")&&f.tags.includes("wheat")&&f.fod==="high"),"시판 라면 55종, 모두 식약처 DB 근거·검색 묶음·짠맛·밀·FODMAP 높음");
  ok(RMN.filter(f=>f.id!=="rm_shin_dry_sabal").every(f=>f.tags.includes("fried")&&f.ms===9)&&!FOOD.rm_shin_dry_sabal.tags.includes("fried")&&FOOD.rm_shin_dry_sabal.ms===3,"유탕면은 튀김 규칙(피하기), 건면(신라면 건면 사발)은 아님");
  ok(Math.round(FOOD.rm_shin.k)===417&&Math.round(FOOD.rm_shin.na)===1492&&FOOD.rm_carbo_buldak.tags.includes("lactose")&&FOOD.rm_matitneun.tags.includes("peanut")&&FOOD.rm_matitneun.tags.includes("walnut")&&FOOD.rm_samyang1963.tags.includes("fish")&&FOOD.rm_chamkkae.tags.includes("sesame"),"포장 표시 값(100g 환산)·원재료 태그(유당·땅콩·호두·생선·참깨)");
  ok(["rm_neoguri_hot","rm_twigim_udon_cup","rm_shin_rose","rm_baehongdong","rm_sarigomtang_big","rm_neoguri_cup","rm_jin_mild","rm_odongtong","rm_snack","rm_snack_cup","rm_snack_bowl","rm_samyang_spicy","rm_carbo_buldak_big","rm_nagasaki"].every(id=>!FOOD[id]),"식약처 DB와 맞지 않거나 DB 행이 없는 라면 14종은 넣지 않음");
  { const q=FOODS.filter(f=>(QTAG["라면"]||[]).some(t=>f.tags.includes(t))).map(f=>f.id); ok(q.includes("rm_buldak")&&q.includes("rm_olive_jjapa")&&q.includes("ramen")&&q.length===56,"'라면' 검색 묶음(이름에 라면이 없는 불닭볶음면·짜파게티 포함)"); }
  S.profile.allergies=["soy"]; ok(foodStatus(FOOD.rm_shin).level==="ban",'대두 알레르기면 신라면 절대 금지(v1.11.0 R-15)'); S.profile.allergies=[];
  S.profile.allergyOther="사과"; { const a=foodStatus(FOOD.rm_jinbibim), b=foodStatus(FOOD.rm_shin);
    ok(a.level==="ban"&&a.reasons.some(r=>r.includes("원재료"))&&!b.reasons.some(r=>r.includes("원재료")),"진비빔면 원재료(사과식초·농축사과과즙)와 직접 적은 알레르기 대조(절대 금지)"); } S.profile.allergyOther="";
  ok(/^알레르기 표시/.test(INGR.rm_kimchi_sabal)&&/돼지고기/.test(INGR.rm_kimchi_sabal)&&/소맥분/.test(INGR.rm_shin),"원재료명 전체를 못 읽은 제품은 알레르기 표시만");
  ok(FOOD.newcare_gosu.src.ref===undefined,"영양식 제품 표시 근거는 그대로 53");
  // 국가표준식품성분 DB 10.4(v1.6.0): 식약처 값과 다른 49개 원재료는 DB 10.4 값(근거 64)
  const dbA=FOODS.filter(f=>f.src&&f.src.kind==="A");
  ok(dbA.length===51&&dbA.every(f=>/^[A-Z]\w{11}$/.test(f.src.code)&&f.src.db==="국가표준식품성분 DB 10.4"),"DB 10.4 값을 쓰는 식품 51개(v1.8.0 흰쌀밥·흰죽 추가), 식품코드 형식");
  ok(FOOD.red_bean.fi===6.2&&FOOD.somen.fi===0.6&&FOOD.pasta.fi===0.7&&FOOD.nurungji.fi===2.3&&FOOD.carrot.src.kind==="A"&&FOOD.halibut.k===125,"삶은 팥·국수 섬유, 누룽지, 광어 열량이 DB 10.4 값");
  ok(FOOD.mackerel.src.kind==="R"&&FOOD.flatfish.src.kind==="R"&&FOOD.hijiki.src.kind==="R"&&FOOD.octopus.src.kind==="R","한쪽에만 값이 있거나 DB 10.4 행이 더 오래된·외국 자료인 식품은 식약처 값 유지");
  ok(REFS[64]&&/10\.4/.test(REFS[64].cite)&&!/4\.5g/.test(FOOD.nurungji.why)&&/2\.3g/.test(FOOD.nurungji.why)&&FOOD.nurungji.refs.includes(64),"근거 64와 누룽지 설명 숫자");
  ok(FOOD.grape.tags.includes("fodmap")&&FOOD.corn.tags.includes("fodmap")&&!FOOD.oyster_mushroom.tags.includes("fodmap"),"FODMAP 태그가 새 등급을 따름(가스가 심할 때 제외 판정에 쓰임)");
  ok(FOOD.newcare_ibd.missing.includes("열량")&&FOOD.newcare_ibd.p===4.25,"IBD 플러스는 단백질만");
  ok(FOODS.filter(f=>f.tags.includes("ons")).length>=30,"영양식 30종 이상");
  // 2. 나트륨·지방·빈 값
  S.profile.age="30"; ok(naLimit()===2300,"나트륨 상한 19~64세"); S.profile.age="70"; ok(naLimit()===1900,"65~74세"); S.profile.age="80"; ok(naLimit()===1800,"75세 이상"); S.profile.age="30";
  ok(has("kalguksu",/나트륨 1,100mg/),"1회 나트륨 1/3 이상 주의(칼국수)"); ok(!has("egg_steamed",/나트륨/),"달걀찜은 v1.8.0부터 실측값(100g당 나트륨 375mg)이라 나트륨 주의 아님"); ok(!has("white_rice",/나트륨/),"흰쌀밥은 나트륨 주의 아님");
  ok(FOOD.beef_tenderloin.tags.includes("fatty")&&FOOD.samgyetang.tags.includes("fatty"),"지방 규칙(100g당 10g·1회 20g)");
  ok(!FOOD.olive_oil.tags.includes("fatty")&&!FOOD.salmon.tags.includes("fatty")&&!FOOD.avocado.tags.includes("fatty"),"지방 규칙 예외");
  ok(FOOD.beef.f<10,"소고기(한우 살코기)는 살코기 값");
  const t=totals([["tteokkochi",80],["white_rice",200]]); ok(t.miss.k&&t.miss.k.includes("떡꼬치")&&Math.round(t.k)===Math.round(FOOD.white_rice.k*2),"자료 없는 음식은 합계에서 빼고 기록");
  ok(missNote(t).includes("떡꼬치"),"빠진 음식 안내");
  ok(eunNeun("맑은 육수")==="는"&&eunNeun("흰살생선(대구·가자미 등)")==="은"&&eunNeun("떡꼬치 등 4개")==="는"&&/떡꼬치는 합계/.test(missNote(t)),"빠진 음식 안내 조사");
  {const pv=totals([["white_fish",100],["egg_boiled",50]]); ok(pv.miss.vd&&pv.miss.vd.length===1&&Math.abs(pv.vd-FOOD.egg_boiled.vd*0.5)<1e-9,"비타민 D 자료 없는 음식 표시")}
  ok(has("zero_soda",/식이섬유 자료가 없어/,{stage:1,fiberStage:1})||st("zero_soda",{stage:1,fiberStage:1}).level==="avoid","섬유 자료 없는 음료");
  ok(st("newcare_allprotein",{stage:1,fiberStage:1}).reasons.some(r=>/식이섬유 자료가 없어/.test(r)),"섬유 자료 없음 주의");
  ok(!st("parmesan",{stage:1,fiberStage:1}).reasons.some(r=>/식이섬유 자료가 없어/.test(r)),"동물성 식품은 섬유 자료 없음 주의 안 함");
  ok(!tagsOfText("곤약면").includes("wheat")&&!tagsOfText("당면 잡채").includes("wheat")&&tagsOfText("칼국수 면").includes("wheat"),"곤약면·당면 밀 오판정");
  ok(!tagsOfText("테이크핏 맥스").includes("beef"),"테이크핏 소고기 오판정");
  ok(bestFood("이온음료").id==="ion_drink"&&!(ALIAS.soda||[]).includes("음료"),"이온음료는 탄산음료와 구분");
  for(const id of ["shabu","cheonggukjang","jjolmyeon","tteokkochi","naengmomil","yukhoe"]) ok(FOOD[id],"빠진 음식 "+id);
  ok(st("jjolmyeon",{stage:2,fiberStage:2}).level==="avoid","쫄면은 매워 2단계 피하기"); ok(st("yukhoe",{stage:3,fiberStage:3}).reasons.some(r=>/익히지 않은/.test(r)),"육회는 날것 주의");
  // 3. 검색: 검색어와 같은 음식이 먼저
  S.foodQ="소금빵"; S.foodCat="전체"; S.foodLv="전체"; S.tab="food"; S.foodSub="search"; SCR=null; render();
  const first=document.querySelector("#foodRes .fgroup .fcard, .fgroup .fcard"); ok(first&&first.dataset.id==="salt_bread","소금빵 검색 첫 결과");
  S.foodQ="밀크티"; render(); const f2=document.querySelector(".fgroup .fcard"); ok(f2&&FOOD[f2.dataset.id]&&(ALIAS[f2.dataset.id]||[]).concat(FOOD[f2.dataset.id].name).some(n=>n.replace(/\s/g,"")==="밀크티"),"밀크티 검색 첫 결과");
  S.foodQ="균형 영양식"; render(); {const ids=[...document.querySelectorAll("#foodRes .fcard, .fgroup .fcard, .fcard")].map(e=>e.dataset.id).filter(Boolean); ok(ids.length>=20&&ids.every(id=>FOOD[id].tags.includes("ons")),"균형영양식 검색은 영양식 제품 "+ids.length)}
  S.foodQ=""; S.tab="plan"; render();
  return {fail};
});
const fail=[...r.fail];
// 4. 메뉴 고르기·내 메뉴
await p.evaluate(()=>{S.logs={}; S.swaps={}; S.plan=null; S.myMenus=[]; S.tab="plan"; SCR=null; render()});
await p.click('[data-act="mealMore"][data-k="1"]'); await p.click('#sheetRoot [data-act="menuPick"][data-k="1"]'); await p.waitForTimeout(200);
const n1=await p.$$eval('#mpList [data-act="mpSet"]',e=>e.length); if(n1<15) fail.push('메뉴 고르기 목록 '+n1);
await p.fill('#mpQ','연어'); await p.waitForTimeout(150);
const salmonRows=await p.$$eval('#mpList [data-act="mpSet"]',e=>e.map(x=>x.textContent)); if(!salmonRows.length||!salmonRows.every(t=>/연어/.test(t))) fail.push('메뉴 검색 '+salmonRows.length);
const pickKey=await p.$eval('#mpList [data-act="mpSet"]',e=>e.dataset.key); await p.click('#mpList [data-act="mpSet"]'); await p.waitForTimeout(200);
const got=await p.evaluate(()=>({k:S.plan.days[S.selDay].meals[1].key,sw:Object.values(S.swaps)}));
if(got.k!==pickKey||!got.sw.includes(pickKey)) fail.push('고른 메뉴가 저장되지 않음');
await p.click('[data-act="mealMore"][data-k="1"]'); await p.click('#sheetRoot [data-act="menuPick"][data-k="1"]'); await p.click('[data-act="myMenuNew"]'); await p.waitForTimeout(150);
for(const q of ['흰쌀밥','대구']){ await p.fill('#mmQ',q); await p.waitForTimeout(120); await p.click('#mmRes [data-act="mmAdd"]'); await p.waitForTimeout(120) }
await p.fill('#mmTitle','내 대구 정식'); await p.click('[data-act="mmSave"]'); await p.waitForTimeout(250);
const my=await p.evaluate(()=>({n:S.myMenus.length,t:S.myMenus[0]?.title,cur:S.plan.days[S.selDay].meals[1].title,re:normalizeState(JSON.parse(JSON.stringify(S))).myMenus.length}));
if(my.n!==1||my.t!=='내 대구 정식'||my.cur!=='내 대구 정식'||my.re!==1) fail.push('내 메뉴 저장 '+JSON.stringify(my));
await p.click('[data-act="mealMore"][data-k="1"]'); await p.click('#sheetRoot [data-act="menuPick"][data-k="1"]'); await p.waitForTimeout(150); await p.click('[data-act="myMenuDel"]'); await p.waitForTimeout(200);
const del=await p.evaluate(()=>({n:S.myMenus.length,sw:Object.values(S.swaps).filter(v=>v.startsWith("u:")).length})); if(del.n||del.sw) fail.push('내 메뉴 삭제 '+JSON.stringify(del));
await p.evaluate(()=>closeSheet());
// 5. 장보기 목록
await p.click('[data-act="shopOpen"]'); await p.waitForTimeout(200);
const shop=await p.evaluate(()=>({labels:[...document.querySelectorAll('.sheet .sec-label')].map(x=>x.textContent),n:document.querySelectorAll('.sheet [data-shop]').length,txt:shopText()}));
if(shop.n<10||!shop.labels.includes('재료 · 곡류')||!shop.labels.includes('레시피 재료 · 레시피 1번 분량')||!/\[재료 · 곡류\]/.test(shop.txt)) fail.push('장보기 목록 '+JSON.stringify({n:shop.n,l:shop.labels}));
// v1.8.0 살 때 재료로: 완성 음식은 재료 줄에 없고(레시피 재료나 '레시피 없는 음식'으로), 익힌 무게는 DB 10.4 수분으로 생것 무게가 됨
const sh=await p.evaluate(()=>{const out={};
  out.dishAsIng=[...document.querySelectorAll('.sheet [data-shop^="i:"]')].map(x=>x.dataset.shop.slice(2)).filter(k=>Object.values(FOOD).some(f=>f.name===k&&wBasis(f).k==="dish"));
  out.noRiceAsIng=![...document.querySelectorAll('.sheet [data-shop^="i:"]')].some(x=>x.dataset.shop==="i:흰쌀밥");
  const keep=S.plan, ks=S.skips, ka=S.profile.allergies, kt=S.triggers; S.skips={}; S.profile.allergies=[]; S.triggers=[]; const d=keep.days.find(x=>x.date>=today());
  S.plan={...keep,days:[{...d,meals:[{slot:"L",title:"시험",items:[["white_rice",200],["egg_soup",250],["white_bread",70],["egg_boiled",50],["chicken_breast",100],["salmon",90]],rec:["r_eggguk"]}]}]};
  const sd=shopData(); const ing={}; for(const g of Object.values(sd.groups)) for(const x of g) ing[x.name]=x;
  out.rice=ing["쌀(백미)"]&&Math.round(ing["쌀(백미)"].eat*10)/10; out.riceW=SHOP.white_rice;
  out.egg=ing["달걀"]&&[ing["달걀"].eat,Math.round(ing["달걀"].buy*10)/10];
  out.chick=ing["닭가슴살"]&&Math.round(ing["닭가슴살"].eat*10)/10;
  out.salmon=ing["연어"]&&ing["연어"].eat;
  out.rec=sd.recs.map(x=>[x.id,x.n,x.dishes]); out.dish=sd.dishes; out.txt=shopText();
  S.plan=keep; S.skips=ks; S.profile.allergies=ka; S.triggers=kt; return out});
if(sh.dishAsIng.length||!sh.noRiceAsIng) fail.push('완성 음식이 재료 줄에 남음 '+JSON.stringify(sh.dishAsIng));
// 흰쌀밥 200g × (100-64)/(100-13.2) = 83.0g(DB 10.4 '멥쌀, 백미, 밥'·'멥쌀, 백미, 생것'), 달걀 폐기율 11%, 닭가슴살 1.244, 연어는 표본이 달라 그대로
if(sh.rice!==83||JSON.stringify(sh.riceW)!==JSON.stringify(["쌀(백미)",0.415,0,"멥쌀, 백미, 생것"])) fail.push('밥→쌀 환산 '+JSON.stringify([sh.rice,sh.riceW]));
if(!sh.egg||sh.egg[0]!==50||sh.egg[1]!==56.2) fail.push('달걀 폐기율 '+JSON.stringify(sh.egg));
if(sh.chick!==124.4||sh.salmon!==90) fail.push('닭가슴살·연어 '+JSON.stringify([sh.chick,sh.salmon]));
if(JSON.stringify(sh.rec)!==JSON.stringify([["r_eggguk",1,[["egg_soup",250]]]])||JSON.stringify(sh.dish)!==JSON.stringify([["white_bread",70]])) fail.push('레시피 재료·레시피 없는 음식 '+JSON.stringify([sh.rec,sh.dish]));
if(!/- 쌀\(백미\) 생것 약 83g/.test(sh.txt)||!/계란국 \(이번 주 1끼, 식단 계란국 250g\): 달걀 2개/.test(sh.txt)||!/- 식빵 70g \(완성된 음식 무게\)/.test(sh.txt)||/NaN|undefined/.test(sh.txt)) fail.push('장보기 복사 글 '+sh.txt.slice(0,400));
await p.click('.sheet [data-shop]'); await p.waitForTimeout(100);
const sd=await p.evaluate(()=>S.shop.done.length); if(sd!==1) fail.push('장보기 체크 저장 '+sd);
await p.evaluate(()=>closeSheet());
// 6. 알림(캘린더 파일)
const ics=await p.evaluate(()=>{S.remind.on=["B","log"]; S.remind.t.B="07:45"; return icsText(new Date(2026,8,25,10,0))});
if((ics.match(/BEGIN:VEVENT/g)||[]).length!==2||!/DTSTART:20260926T074500/.test(ics)||!/RRULE:FREQ=DAILY/.test(ics)||!/\r\n/.test(ics)||!/SUMMARY:아침 식사 기록/.test(ics)) fail.push('캘린더 파일 '+ics.slice(0,300));
const due=await p.evaluate(()=>{S.remind.on=["log"]; S.remind.t.log="00:00"; delete S.logs[today()]; return remindDue()});
if(!due||due.k!=="log") fail.push('앱 안 알림 '+JSON.stringify(due));
await p.evaluate(()=>{S.tab="me";SCR=null;render(); openScr("set-remind")}); await p.waitForTimeout(150);
const remUI=await p.evaluate(()=>document.querySelectorAll('[data-rem]').length); if(remUI!==5) fail.push('알림 설정 화면 '+remUI);
console.log('errors',errs);
if(fail.length||errs.length){console.log('FAIL\n'+fail.join('\n')); process.exitCode=1} else console.log('OK v1.5.0 점검 통과');
await b.close();})();
