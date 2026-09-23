import os
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP=os.path.join(ROOT,'src','app','index.html')
BASE=os.path.join(ROOT,'src','app','app.base.html')
GEN=os.path.join(ROOT,'src','data','generated','gen_out.json')
MFDS=os.path.join(ROOT,'data','mfds')
import re
P=APP
s=open(P,encoding='utf-8').read()
def once(old,new,cnt=1):
    global s
    n=s.count(old)
    assert n==cnt, (n,old[:100])
    s=s.replace(old,new)
# ---- foodStatus 규칙 ----
once('''  if(f.ms===9||f.tags.some(t=>["upf","processed","alcohol"].includes(t))) set("avoid","근거 자료에서 피하도록 권고");''',
'''  const av=AVOID_TAG.filter(([t])=>f.tags.includes(t)); for(const [,r] of av) set("avoid",r);
  if(f.ms===9&&!av.length) set("avoid","근거 자료에서 피하도록 권고");''')
once('''  if(f.tags.includes("spicy")&&c.stage<3) set("avoid","맵고 자극적인 양념(앱 기본 설정: 활동기 제외)");''',
'''  if(f.tags.includes("spicy")) set(c.stage<3?"avoid":"caution",c.stage<3?"맵고 자극적인 양념(앱 기본 설정: 활동기 제외)":"맵고 자극적인 음식은 증상을 일으키기 쉬움(대한장연구학회·길병원)");''')
once('''  if(["orange","lentil","hummus"].includes(f.id)) set("caution","증상 악화를 잘 일으키는 음식으로 안내됨(길병원)");\n''','')
once('''  if(f.tags.includes("salty")||f.tags.includes("fatty")) set("caution","소량만 사용");''',
'''  if(f.tags.includes("salty")) set("caution","짠 음식이라 소량만(길병원: 짠 음식은 증상 악화 음식)");
  if(f.tags.includes("fatty")) set("caution","기름진 음식이라 소량만(길병원: 기름진 음식은 증상 악화 음식)");
  for(const [t,r] of CAUTION_TAG) if(f.tags.includes(t)&&!(t==="sour"&&f.tags.includes("citrus"))) set("caution",r);
  if(c.gasHeavy&&f.tags.includes("allium")&&f.fod!=="high") set("caution","양파·마늘·파 양념은 가스를 늘릴 수 있음(FODMAP)");''')
once('''function foodStatus(f,c=ctx()){''','''// 근거별 피하기·주의 태그(길병원[39]·대한장연구학회[37]·IOIBD[3]·AGA[2])
const AVOID_TAG=[["fried","튀김은 과도한 지방이라 피하도록 안내(길병원)"],["processed","가공육·가공품은 피하도록 권고(IOIBD·길병원)"],["alcohol","술은 증상을 악화시킬 수 있어 피하도록 안내(길병원·대한장연구학회)"],["soda","탄산·가당 음료는 피하도록 안내(길병원·AGA)"],["choco","초콜릿 같은 단당류 간식은 피하도록 안내(길병원)"],["upf","초가공식품은 피하거나 줄이도록 권고(길병원·AGA)"]];
const CAUTION_TAG=[["legume","콩류는 증상 악화를 잘 일으키는 음식(길병원)"],["citrus","오렌지·레몬 같은 신 과일은 증상 악화를 잘 일으키는 음식(길병원)"],["juice","과일주스는 증상 악화를 잘 일으키는 음식(길병원)"],["pickled","절인 채소는 증상 악화를 잘 일으키는 음식(길병원)"],["sour","신 음식은 증상 악화를 잘 일으키는 음식(길병원)"],["marg","마가린은 증상 악화 음식(길병원), 트랜스지방은 피하기(IOIBD)"],["sugar","당분이 많은 음식은 증상을 일으키기 쉬움(대한장연구학회·길병원)"],["shell","조개·소라는 증상을 일으키기 쉬운 음식(대한장연구학회)"],["tough","질긴 음식·산나물·해초·견과·팝콘은 증상을 일으키기 쉬움(대한장연구학회)"],["raw","익히지 않은 동물성 식품은 저잔사식 제한(길병원), 먹는다면 신선한 것으로"],["upf2","초가공식품은 줄이도록 권고(AGA)"]];
function foodStatus(f,c=ctx()){''')
# ---- 최종 판정 단계의 이유만 보여 주기(피하기인데 '소량만'이 함께 뜨지 않게) ----
once('''  const set=(l,r)=>{const rank={ok:0,caution:1,later:2,avoid:3};if(rank[l]>rank[lv])lv=l;R.push(r)};''',
'''  const set=(l,r)=>{const rank={ok:0,caution:1,later:2,avoid:3};if(rank[l]>rank[lv])lv=l;R.push([l,r])};''')
once('''  if(S.profile.budget==="알뜰"&&f.cost===3) set("caution","가격 부담이 큰 편");
  return {level:lv,reasons:[...new Set(R)]};''','''  if(S.profile.budget==="알뜰"&&f.cost===3) set("caution","가격 부담이 큰 편");
  return {level:lv,reasons:[...new Set(R.filter(x=>x[0]===lv).map(x=>x[1]))]};''')
# ---- 채소 반찬(요리)도 채소 한 끼 양 규칙 ----
once('''    else if(mg<300&&!(f.cat==="채소"&&mg>VEG_CAP)&&''','''    else if(mg<300&&!((f.cat==="채소"||f.tags.includes("veg"))&&mg>VEG_CAP)&&''')
once('''  if(c.fiberStage===1&&f.cat==="채소") set("caution",''','''  if(c.fiberStage===1&&(f.cat==="채소"||f.tags.includes("veg"))) set("caution",''')
# ---- 식단 AI 목록에서 검색 전용 음식 제외 ----
once('''  return FOODS.filter(f=>{const s=foodStatus(f,c);''','''  return FOODS.filter(f=>{if(f.lib) return false; const s=foodStatus(f,c);''')
# ---- 이름 일치: 한 글자는 정확히 같을 때만 ----
once('''  const keys=foodKeys(f).map(n=>n.toLowerCase());
  if(keys.some(n=>n.includes(k)||k.includes(n))) return true;''','''  const keys=foodKeys(f).map(n=>n.toLowerCase());
  if(k.length===1) return keys.includes(k); // '김'이 김치·김밥, '배'가 배추에 걸리지 않게
  if(keys.some(n=>n.includes(k)||(n.length>=2&&k.includes(n)))) return true;''')
once('''for(const k of toks) if(k.length>=2) out.add(k)} return [...out]}''','''for(const k of toks) out.add(k)} return [...out]}''')
once('''function guessFoodId(name){''','''// 검색어에 가장 잘 맞는 음식 하나: 정확히 같은 이름 > 검색어를 품은 이름(짧을수록) > 검색어 속 이름(길수록)
function bestFood(q){
  const k=String(q).normalize("NFC").replace(/\\s/g,"").toLowerCase(); if(!k) return null;
  let best=null,score=-1;
  for(const f of FOODS) for(const n of foodKeys(f).map(x=>x.toLowerCase())){
    const sc=n===k?1000:(k.length>=2&&n.includes(k))?500-(n.length-k.length):(n.length>=2&&k.includes(n))?100+n.length:-1;
    if(sc>score){score=sc;best=f}
  }
  return score>=0?best:null;
}
// 이름·별명이 정확히 같은 음식(외식 메뉴 이름을 음식 목록 판정과 맞출 때만 씀)
function exactFood(q){const k=String(q||"").normalize("NFC").replace(/\\s/g,"").toLowerCase(); if(k.length<2) return null; const f=bestFood(k); return f&&foodKeys(f).some(n=>n.toLowerCase()===k)?f:null}
function guessFoodId(name){''')
once('''    const f=FOODS.find(x=>nameHit(x,q)); const fs=f?foodStatus(f):null;''','''    const f=bestFood(q); const fs=f?foodStatus(f):null;''')
# 외식 판정: 메뉴 이름이 음식 목록과 정확히 같으면 근거 판정은 음식 목록 기준으로(개인 조건은 그대로 검사)
once('''  for(const [t,l] of [["processed","가공육(햄·베이컨 등)"],["upf","초가공식품"],["alcohol","술"]]) if(tags.includes(t)) up("avoid",`${l} 포함 가능성`);
  if(tags.includes("spicy")&&c.stage<3) up(okd?"caution":"avoid",okd?"맵거나 자극적인 양념(내가 괜찮았다고 표시함)":"맵고 자극적인 양념(앱 기본 설정: 증상이 남은 단계에서는 제외)");''',
'''  const f0=exactFood(item.name);
  if(!f0){
    for(const [t,l] of [["processed","가공육(햄·베이컨 등)"],["upf","초가공식품"],["alcohol","술"]]) if(tags.includes(t)) up("avoid",`${l} 포함 가능성`);
    if(tags.includes("spicy")&&c.stage<3) up(okd?"caution":"avoid",okd?"맵거나 자극적인 양념(내가 괜찮았다고 표시함)":"맵고 자극적인 양념(앱 기본 설정: 증상이 남은 단계에서는 제외)");
  }''')
once('''  if(tags.includes("redmeat")) up("caution","붉은 고기");
  if(tags.includes("fatty")) up("caution","기름진 조리");
  if(tags.includes("fodmap")) up("caution","가스를 늘릴 수 있는 재료");
  return {level:lv,reasons:[...new Set(R)]};''','''  if(f0){
    const s=foodStatus(f0,{...c,allergies:[],words:[],trig:[]});
    const soft=okd&&s.level==="avoid"&&f0.tags.includes("spicy")&&f0.ms!==9&&!AVOID_TAG.some(([t])=>f0.tags.includes(t));
    if(s.level!=="ok") for(const r of s.reasons) up(soft?"caution":s.level,`${f0.name}: ${r}${soft?" (내가 괜찮았다고 표시함)":""}`);
  } else {
    if(tags.includes("redmeat")) up("caution","붉은 고기");
    if(tags.includes("fatty")) up("caution","기름진 조리");
    if(tags.includes("fodmap")) up("caution","가스를 늘릴 수 있는 재료");
  }
  return {level:lv,reasons:[...new Set(R)]};''')
once('''const f=FOODS.find(f=>nameHit(f,t));S.triggers.push''','''const f=bestFood(t);S.triggers.push''')
# ---- 식품 상세: 기준량 표시, 자료 없는 값은 '–' ----
once('''   ${f.src?`<div class="nutgrid num"><div><b>${f.k}</b><small>kcal</small></div><div><b>${f.p}g</b><small>단백질</small></div><div><b>${f.fi}g</b><small>섬유</small></div><div><b>${f.ca}mg</b><small>칼슘</small></div><div><b>${f.fe}mg</b><small>철</small></div><div><b>${f.kal}mg</b><small>칼륨</small></div></div>
   <p class="hint">100g당 · 식약처 ${esc(f.src.db)} ‘${esc(f.src.name)}’''','''   ${f.src?`<div class="nutgrid num">${[["k","열량","","kcal"],["p","단백질","g","단백질"],["fi","식이섬유","g","섬유"],["ca","칼슘","mg","칼슘"],["fe","철","mg","철"],["kal","칼륨","mg","칼륨"]].map(([k,l,u,t])=>`<div><b>${f.missing.includes(l)?"–":f[k]+u}</b><small>${t}</small></div>`).join("")}</div>
   <p class="hint">${esc(f.src.basis||"100g")}당 · 식약처 ${esc(f.src.db)} ‘${esc(f.src.name)}’''')
once('''    f.src={db:MFDS_DB[m[7]],code:m[8],name:m[9],basis:m[10],kind:m[7]}; f.kal=m[11];''','''    f.src={db:MFDS_DB[m[7]],code:m[8],name:m[9],basis:m[10],kind:m[7]}; f.kal=m[11]; if(m[11]==null) f.missing.push("칼륨");''')

# ---- 음식 종류 칩이 가로로 넘칠 때 고른 칩이 보이게 ----
once('''    case "cat": S.foodCat=v; render(); break;''','''    case "cat": S.foodCat=v; render(); chipIntoView("cat",v); break;''')
once('''    case "lvFilter": S.foodLv=v; render(); break;''','''    case "lvFilter": S.foodLv=v; render(); chipIntoView("lvFilter",v); break;''')
once('''function refreshFoodRes(){''','''function chipIntoView(act,v){const el=document.querySelector(`.chip[data-act="${act}"][data-v="${CSS.escape(v)}"]`); if(el&&el.scrollIntoView) el.scrollIntoView({block:"nearest",inline:"center"})}
function refreshFoodRes(){''')

# ---- 외식·제품 판정 키워드 보정(들깨는 참깨가 아니고, 햄버거·땅콩버터·감잣국 오인식 제거) ----
once('''sesame:["참깨","타히니","참기름","깨소금","통깨","볶음깨","들깨","깻잎"]''','''sesame:["참깨","타히니","참기름","깨소금","통깨","볶음깨"]''')
once('''beef:/닭갈비|돼지불고기|닭불고기|오리불고기|제육불고기/g};''','''beef:/닭갈비|돼지불고기|닭불고기|오리불고기|제육불고기/g,pork:/햄버거|햄버그/g,dairy:/땅콩버터/g,pine:/감잣국|감자국/g};''')
# ---- 분량이 없던 식품에 1회 분량 ----
once('''const FRACS=''','''Object.assign(SERV,{quinoa:[30,"인분"],onion:[30,"접시"],garlic:[5,"쪽"],herbs:[5,"큰술"],alcohol:[200,"잔"],ramen:[120,"봉지"],fried:[100,"인분"],soda:[250,"캔"]});
const FRACS=''')
# ---- 검색 동의어: 재료 묶음으로도 찾게 ----
once('''  const list=FOODS.filter(f=>!q||searchHit(f,q)||f.cat.includes(q));''','''  const list=FOODS.filter(f=>!q||searchHit(f,q)||f.cat.includes(q)||(QTAG[q]||[]).some(t=>f.tags.includes(t)));''')
once('''function foodSearchData(){''','''// 묶음 검색어: 태그로 찾기
const QTAG={"생선":["fish"],"해산물":["fish","clam","crab","shrimp","squid"],"조개":["clam"],"견과":["nut","peanut","walnut","pine"],"견과류":["nut","peanut","walnut","pine"],"매운음식":["spicy"],"매운":["spicy"],"기름진":["fatty"],"짠":["salty"]};
function foodSearchData(){''')
# ---- 참고문헌 43–46 ----
refs='''
 43:{short:"Cohen 등, IBD 환자의 식이와 증상 자가보고 연구(2013)",cite:"Cohen AB, Lee D, Long MD, Kappelman MD, Martin CF, Sandler RS, Lewis JD. Dietary patterns and self-reported associations of diet with symptoms of inflammatory bowel disease. Dig Dis Sci. 2013;58(5):1322-1328.",key:"IBD 환자 2,329명(궤양성 대장염 597명 포함)의 자유응답 분석. 요구르트·쌀·바나나는 증상을 좋게 한다는 응답이 많았고, 잎채소가 아닌 채소·매운 음식·과일·견과·잎채소·튀김·우유·붉은 고기·탄산음료·팝콘·유제품·술·고섬유 식품·옥수수·기름진 음식·씨앗·커피·콩은 증상을 악화시킨다는 응답이 많았음. 환자 자가보고라 인과관계를 뜻하지는 않음."},
 44:{short:"Chassaing 등, 유화제 CMC 무작위 급식 시험(2022)",cite:"Chassaing B, Compher C, Bonhomme B, et al. Randomized Controlled-Feeding Study of Dietary Emulsifier Carboxymethylcellulose Reveals Detrimental Impacts on the Gut Microbiota and Metabolome. Gastroenterology. 2022;162(3):743-756.",key:"건강한 성인에게 첨가물 없는 식단과 여기에 유화제 카복시메틸셀룰로스(CMC)를 더한 식단을 11일간 제공한 무작위 급식 시험. CMC를 먹은 군에서 장내 미생물 구성이 바뀌고 유익한 대사산물(단쇄지방산 등)이 줄었으며, 일부 참가자에서는 미생물이 장 점막 가까이 침투함."},
 45:{short:"Chen 등, 궤양성 대장염 SCD 대 지중해식 무작위 급식 시험(2026)",cite:"Chen AS-Y, Nguyen LH, Gray B, et al. Specific carbohydrate diet versus Mediterranean diet in adult patients with mild to moderate ulcerative colitis: a randomized controlled-feeding trial. Front Nutr. 2026;13:1838160.",key:"경증~중등도 궤양성 대장염 성인 17명을 특정 탄수화물 식단(SCD)과 지중해식에 무작위 배정해 6주간 식사를 제공. 부분 Mayo 점수 변화는 SCD −0.8, 지중해식 −1.3으로 차이가 없었고(p=0.499), 탈락률이 52.9%로 높아 해석에 한계가 있음."},
 46:{short:"세브란스병원 영양팀, 염증성장질환의 식사요법(2024)",cite:"세브란스병원 영양팀. 염증성장질환의 식사요법 Inflammatory bowel disease (IBD). 세브란스병원 건강정보, 2024-08-04. sev.severance.healthcare.",key:"활동기에는 영양죽·으깬 감자·삶은 계란 같은 음식으로 영양 상태를 개선. 관해기에는 비교적 제한 없이 다양한 식품 섭취. 우유로 설사가 생기면 피하되, 떠먹는 요구르트·치즈 같은 발효 제품이나 유당을 제거한 우유는 괜찮은 경우도 있음. 철은 붉은 육류·생선·간·굴·달걀노른자 같은 동물성 식품에 많고 흡수율이 좋음. 과일·채소의 줄기·껍질·씨앗, 통곡물, 견과류, 육류의 껍질처럼 섬유가 많은 음식은 피하고, 식사 중에는 커피·차·탄산음료를 마시지 않음."}'''
i=s.index(' 38:{short:"대한장연구학회 IBD 연구회, 궤양성 대장염 진단'); j=s.index('\n};',i)
assert s[j-1]=='}'
s=s[:j]+','+refs+s[j:]
once('  const row=KDRI[sx].find(r=>age<=r[0]);','  const row=(KDRI[sx]||[]).find(r=>age<=r[0]); if(!row) return null;')
open(P,'w',encoding='utf-8').write(s)
print('ok')
