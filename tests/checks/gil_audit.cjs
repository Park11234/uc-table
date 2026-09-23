const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const WRAP=n=>{const p=T(n); if(!fs_.existsSync(p)) fs_.writeFileSync(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
// 길병원 저잔사식 허용·제한 목록[39]과 앱 단계·태그 대조
const { chromium } = require('playwright'); const fs=require('fs');
const ALLOW=["white_rice","glutinous_rice","somen","pasta","white_bread","castella","dinner_roll","rice_cake","potato","barley_misugaru",
 "white_fish","pollack","flatfish","halibut","croaker","rockfish","egg_steamed","egg_boiled","quail_egg","rolled_omelet","scrambled_egg",
 "tofu","silken_tofu","pan_tofu","shrimp","crab","blue_crab","snow_crab","beef","pork","beef_tenderloin","pork_tenderloin","pork_shoulder","beef_suyuk",
 "zucchini","cucumber","radish","eggplant","napa","onion","spinach","button_mushroom","salad","old_pumpkin","pumpkin",
 "baek_kimchi","dongchimi","nabak_kimchi","milk","lf_milk","lowfat_milk","calcium_milk","yogurt","greek_yogurt","yogurt_plain_unsw","drink_yogurt",
 "soy_milk","black_soy_milk","pudding","parmesan","feta","cheddar","sliced_cheese","mozzarella","cream_cheese","ice_cream",
 "olive_oil","sesame_oil","perilla_oil","canola_oil","soybean_oil","grapeseed_oil","rice_bran_oil",
 "apple","pear","peach","grape","watermelon","melon","mandarin","hallabong","banana","canned_peach","apple_juice"];
const LIMIT=["barley_rice","brown_rice","red_bean","red_bean_porridge","mixed_grain_rice","bean_rice","ogokbap","sweet_potato","corn","rye_bread","donut","injeolmi","popcorn","tteokguk","jeolpyeon","goguma_matang",
 "pork_belly","beef_ribs","chadol","beef_shank","jokbal","pork_neck","beef_sirloin","chicken_wing","duck_skin","ham","fish_cake","imitation_crab","sundae","nuggets",
 "clam","mussel","abalone","scallop","oyster","tuna_sashimi","smoked_salmon","hoedeopbap",
 "minari","doraji","gosari","bean_sprout","burdock","mung_sprout","carrot","celery","oyster_mushroom","shiitake","king_oyster","enoki","wood_ear","mushroom",
 "dried_radish","siraegi","seaweed","kelp","laver","green_laver","maesaengi","hijiki","miyeok_stem","yeolmu_kimchi","gat_kimchi","pa_kimchi",
 "sweet_persimmon","soft_persimmon","dried_persimmon","pineapple","raisin","jujube","dried_banana","kiwi","tomato","cherry_tomato","strawberry","strawberry_yogurt",
 "peanut","pine_nut","almond","nuts","sunflower_seed","peanut_butter","tahini","gimbap","soda","coffee","cheongyang","mustard","gochugaru"];
(async()=>{const b=await chromium.launch();const p=await b.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
fs.writeFileSync(T('g.html'),'<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
await p.goto('file://'+WRAP('g.html'));await p.waitForTimeout(400);
const r=await p.evaluate(({ALLOW,LIMIT})=>{
  S.consent={date:today(),ai:false}; S.profile.allergies=[]; S.profile.lactose=false; S.triggers=[]; S.orders.checked=[]; S.logs={}; S.stageMode="1";
  const out={missing:[],allowBad:[],limitBad:[]};
  const st=id=>{const f=FOOD[id]; if(!f) return null; return foodStatus(f,ctx())};
  for(const id of [...ALLOW,...LIMIT]) if(!FOOD[id]) out.missing.push(id);
  for(const id of ALLOW){const f=FOOD[id]; if(!f) continue; const s=st(id);
    if(f.ms!==1||s.level==="later"||s.level==="avoid") out.allowBad.push([id,f.name,"ms"+f.ms,s.level,s.reasons.join(" / ")]);}
  for(const id of LIMIT){const f=FOOD[id]; if(!f) continue; const s=st(id);
    if(s.level==="ok"||s.level==="caution") out.limitBad.push([id,f.name,"ms"+f.ms,s.level,(f.tags||[]).join(","),s.reasons.join(" / ")]);}
  return out;
},{ALLOW,LIMIT});
console.log("== 목록에 없는 id",r.missing.join(", ")||"없음");
console.log("== 허용인데 1단계에서 보류·제외 ("+r.allowBad.length+")"); r.allowBad.forEach(x=>console.log("   ",x.join(" | ")));
console.log("== 제한인데 1단계에서 허용·주의 ("+r.limitBad.length+")"); r.limitBad.forEach(x=>console.log("   ",x.join(" | ")));
console.log('errors',errs); await b.close();})();
