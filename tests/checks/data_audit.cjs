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
// 데이터 전수 점검: 알레르기 태그 누락/과잉, 분량·영양 이상치, 별명 충돌
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
fs.writeFileSync(T('da.html'),'<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
await p.goto('file://'+WRAP('da.html'));await p.waitForTimeout(400);
const out=await p.evaluate(()=>{
  const R={allergyMissing:[],allergyExtra:[],serv:[],kcal:[],fiber:[],aliasDup:[],nameLong:[],noEmo:[],prep:[],why:[]};
  const ALL=[...ALLERGY_OPTS,...ALLERGY_EXTRA].map(x=>x[0]);
  for(const f of FOODS){
    const text=[f.name,...(ALIAS[f.id]||[])].join(" ");
    const tags=tagsOfText(text,[f.name,...(ALIAS[f.id]||[])]);
    const want=tags.filter(t=>ALL.includes(t));
    const have=f.tags.filter(t=>ALL.includes(t));
    const miss=want.filter(t=>!have.includes(t));
    if(miss.length) R.allergyMissing.push([f.id,f.name,miss.join(","),have.join(",")]);
    // 분량·영양 이상치
    const sv=SERV[f.id];
    if(sv){ const kcal=f.k*sv[0]/100; const fi=f.fi*sv[0]/100;
      if(sv[0]<1||sv[0]>800) R.serv.push([f.id,f.name,sv.join("/")]);
      if(kcal>900||(kcal<5&&f.k>0)) R.kcal.push([f.id,f.name,Math.round(kcal),sv[0]]);
      if(fi>12) R.fiber.push([f.id,f.name,Math.round(fi*10)/10,sv[0]]);
    } else R.serv.push([f.id,f.name,"분량없음"]);
    if(f.name.length>16) R.nameLong.push([f.id,f.name,f.name.length]);
    if(!EMO[f.id]&&!FICON[f.id]) R.noEmo.push(f.id);
    if(typeof f.why!=="string"||f.why.length<15) R.why.push([f.id,f.name]);
  }
  // 같은 별명이 3개 이상 음식에 걸리는 경우(검색 혼란)
  const map={};
  for(const f of FOODS) for(const k of foodKeys(f)) (map[k]||(map[k]=[])).push(f.id);
  for(const [k,v] of Object.entries(map)) if(v.length>=4) R.aliasDup.push([k,v.length,v.slice(0,6).join(",")]);
  // v1.5.0: 유당 규칙(우유·요거트·크림 등이 이름에 든 유제품은 lactose, 락토프리 제품만 예외)
  R.lactose=[]; const LAC_RE=/우유|요거트|요구르트|아이스크림|라떼|커스터드|밀크|연유|분유|크림/; const LAC_FREE=new Set(["lf_milk","mk_lf_milk_orig","mk_lf_milk_low"]);  // 락토프리(포장에 유당 0g 표시)
  for(const f of FOODS){const txt=[f.name,...(ALIAS[f.id]||[])].join(" "); if(f.tags.includes("dairy")&&!f.tags.includes("lactose")&&LAC_RE.test(txt)&&!LAC_FREE.has(f.id)) R.lactose.push([f.id,f.name])}
  // 지방 규칙(앱 기준: 100g당 10g 이상이거나 1회 20g 이상이면 fatty, 예외는 FAT_EXEMPT·지방 분류·질긴 음식·등푸른 생선)과 반대 방향(지방이 적은데 fatty)
  R.fat=[]; for(const f of FOODS){ if(!hasNut(f,"f")) continue; const sg=(SERV[f.id]||[100])[0]; const big=f.f>=10||f.f*sg/100>=20;
    const ex=f.cat==="지방"||f.tags.includes("tough")||f.tags.includes("oily")||FAT_EXEMPT.has(f.id);
    if(big&&!ex&&!f.tags.includes("fatty")) R.fat.push([f.id,f.name,"fatty 빠짐",f.f]);
    if(f.tags.includes("fatty")&&f.f<5&&f.f*sg/100<10) R.fat.push([f.id,f.name,"지방이 적은데 fatty",f.f]) }
  return R;
});
for(const [k,v] of Object.entries(out)){ console.log("== "+k+" ("+v.length+")"); for(const x of v.slice(0,60)) console.log("   ",Array.isArray(x)?x.join(" | "):x) }
console.log('errors',errs);
// 분량·아이콘·설명이 빠진 음식, 알레르기 태그 과잉은 실패. 나머지 목록(저열량 등)은 검토용 보고
// v1.5.0: 알레르기 태그 누락(대두가 아닌 콩류는 예외)·새 별명 겹침·너무 긴 이름·유당·지방 규칙 위반도 실패
const ALLERGY_FP={lentil:["soy"],hummus:["soy"]}; // 이름에 '콩'이 있지만 대두가 아닌 콩류(렌틸콩·병아리콩)
const aMiss=out.allergyMissing.filter(([id,,miss])=>miss.split(",").some(t=>!(ALLERGY_FP[id]||[]).includes(t)));
const GENERIC=new Set(["죽","떡","빵","우유","요거트","요구르트","치즈","사과","두유"]); // 여러 음식을 묶어 찾는 일반 이름
const aDup=out.aliasDup.filter(([k])=>!GENERIC.has(k)); const longN=out.nameLong.filter(x=>x[2]>20);
const F2=[]; if(aMiss.length) F2.push('알레르기 태그 누락 '+aMiss.map(x=>x[0]).join(',')); if(aDup.length) F2.push('별명 겹침 '+aDup.map(x=>x[0]).join(','));
if(longN.length) F2.push('이름 20자 초과 '+longN.map(x=>x[0]).join(',')); if(out.lactose.length) F2.push('유당 태그 누락 '+out.lactose.map(x=>x[0]).join(','));
if(out.fat.length) F2.push('지방 규칙 '+out.fat.map(x=>x[0]+':'+x[2]).join(','));
if(out.serv.length||out.noEmo.length||out.why.length||out.allergyExtra.length||errs.length||F2.length){ console.log('FAIL 데이터 누락 '+F2.join(' / ')); process.exitCode=1 }
await b.close();})();
