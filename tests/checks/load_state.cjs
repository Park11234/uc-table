// 공통 안전장치: 어느 페이지에서든 잡히지 않은 오류(pageerror)가 나면 이 점검을 실패로 끝낸다
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}
// 저장·불러오기 안정성: (1) 풍부한 기록을 저장하고 새로고침해도 '기록을 읽지 못했습니다'가 뜨지 않고 그대로 남는지
// (2) 올바른 기록은 정리(normalizeState)를 거쳐도 한 글자도 바뀌지 않는지 (3) 백업 파일로 되살려도 같은지
const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out'); fs.mkdirSync(TMP,{recursive:true});
const { chromium } = require('playwright');
const page=path.join(TMP,'load_state.html');
fs.writeFileSync(page,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const SEED=()=>{
  const d=n=>addDays(today(),-n);
  S.consent={date:today()};
  S.profile={...S.profile,height:"170",weight:"60",age:"30",sex:"F",allergies:["shrimp","peanut"],allergyOther:"키위",lactose:true,meds:["asa","iron"],medOther:"유산균",dislikes:"가지",budget:"알뜰"};
  S.orders={checked:["fluid"],fluidMl:"1500",other:["우유 금지"]};
  const mk=(day,b,memo)=>({day,night:1,bloody:b,urg:1,blood:b?1:0,well:1,stool:2,medtaken:1,extra:["관절통"],pain:3,gas:"약간",fatigue:"약간",temp:"36.8",pulse:"78",other:["어지러움"],memo});
  for(let i=0;i<30;i++) S.logs[d(i)]=mk(3+i%5,i%3,i%4?"":"메모 "+i);
  S.weights=[{date:d(20),kg:60.2},{date:d(2),kg:59.8}];
  S.water[today()]=4; S.water[d(1)]=9;
  S.extras[today()]=[{name:"달걀찜",foodId:"egg_steamed",amt:120,unit:"g",kcal:142,p:13.4,fi:0.4,ca:52}];
  S.ratings=[{date:d(1),slot:"점심",title:"점심",foodId:"white_fish",rating:"good"},{date:d(2),slot:"제품",title:"두유",foodId:null,name:"두유",rating:"bad"}];
  S.triggers=[{name:"우유",foodId:"milk",date:d(3),source:"직접",sym:["설사"],never:false}];
  S.reintro={active:{name:"두부",foodId:"tofu",start:d(1),days:[{r:"ok"},{},{}]},history:[{name:"바나나",foodId:"banana",start:d(12),end:d(9),days:[{},{},{}],result:"ok"}]};
  S.okMenus=["김치찌개"]; S.care={flu:d(30)}; S.lastBackup=d(5); S.cupMl=250; S.theme="dark"; S.fontSize="lg"; S.reportDays=30;
  try{S.plan=samplePlan()}catch(e){}
  save();
};
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
  await p.goto('file://'+page); await p.waitForTimeout(300);
  await p.evaluate(SEED); const before=await p.evaluate(()=>JSON.stringify(S));
  await p.reload(); await p.waitForTimeout(500);
  const r1=await p.evaluate(()=>({fail:LOAD_FAIL, same:null, logs:Object.keys(S.logs).length, ra:!!S.reintro.active, rt:S.ratings.length, tr:S.triggers.length, w:S.water[today()]}));
  const after=await p.evaluate(()=>JSON.stringify(S));
  // 저장했던 값이 하나도 빠지거나 바뀌지 않았는지(정리 과정에서 기본값 키가 더해지는 것은 허용)
  const lost=[]; const sub=(x,y,pre)=>{ if(x&&typeof x==="object"){ if(!y||typeof y!=="object"){lost.push(pre);return} for(const k of Object.keys(x)) sub(x[k],y[k],pre+"."+k) } else if(x!==y) lost.push(pre+": "+JSON.stringify(x)+" → "+JSON.stringify(y)) };
  const B=JSON.parse(before), A=JSON.parse(after);
  for(const k of ["profile","orders","triggers","logs","weights","water","ratings","reintro","extras","okMenus","care","lastBackup","cupMl","theme","fontSize","reportDays"]) sub(B[k],A[k],k);
  const sameAfterReload=lost.length===0; if(lost.length) console.log('바뀐 값', lost.slice(0,10));
  // 이미 정리된 기록은 다시 정리해도 그대로(멱등)
  // (plan은 앱이 다시 만드는 파생 데이터라 비교에서 뺀다)
  const idem=await p.evaluate(()=>{const strip=o=>{const c={...o}; delete c.plan; return JSON.stringify(c)}; const a=JSON.parse(JSON.stringify(S)); return strip(a)===strip(normalizeState(JSON.parse(JSON.stringify(S))))});
  // 백업 형식으로 되살리기
  const rest=await p.evaluate(()=>{const txt=backupJSON(); const cand=normalizeState(JSON.parse(txt)); return JSON.stringify(cand.logs)===JSON.stringify(S.logs)&&JSON.stringify(cand.reintro)===JSON.stringify(S.reintro)&&cand.ratings.length===S.ratings.length});
  const fails=[];
  if(r1.fail) fails.push('새로고침 뒤 LOAD_FAIL');
  if(!sameAfterReload) fails.push('새로고침 뒤 기록이 달라짐');
  if(!idem) fails.push('올바른 기록이 정리 과정에서 바뀜');
  if(!rest) fails.push('백업→복원 결과가 다름');
  if(r1.logs!==30||!r1.ra||r1.rt!==2||r1.tr!==1||r1.w!==4) fails.push('항목 수 불일치 '+JSON.stringify(r1));
  if(errs.length) fails.push('페이지 오류 '+errs.join(' | '));
  console.log(JSON.stringify({r1,sameAfterReload,idem,rest}));
  console.log(fails.length?'FAIL '+fails.join(' / '):'OK');
  await b.close(); process.exit(fails.length?1:0);
})();
