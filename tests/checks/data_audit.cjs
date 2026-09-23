const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const WRAP=n=>{const p=T(n); if(!fs_.existsSync(p)) fs_.writeFileSync(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
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
  return R;
});
for(const [k,v] of Object.entries(out)){ console.log("== "+k+" ("+v.length+")"); for(const x of v.slice(0,60)) console.log("   ",Array.isArray(x)?x.join(" | "):x) }
console.log('errors',errs); await b.close();})();
