// 판정 결과 뽑기(v1.13.0 24차): 글·화면을 고친 앞뒤로 판정이 그대로인지 비교할 때 쓴다.
//   node tools/judgment_dump.cjs [앱 HTML] > before.json   (기본: src/app/index.html)
//   node tools/judgment_dump.cjs --diff before.json after.json   (다르면 종료 코드 1)
// 담는 것: 음식 1,771개의 판정(단계 1·2·3 × 조건 3가지), 증상 기록 조합별 식단 단계, 단계별 예시 식단, 편의점 원재료 검사, 외식 메뉴 판정.
// 판정 이유의 글은 담지 않는다(문구를 고쳐도 판정은 같아야 하므로 등급과 이유 개수만 본다).
const path=require('path'), fs=require('fs');
if(process.argv[2]==='--diff'){
  const a=JSON.parse(fs.readFileSync(process.argv[3],'utf8')), b=JSON.parse(fs.readFileSync(process.argv[4],'utf8')); let n=0;
  const walk=(p,x,y)=>{ if(JSON.stringify(x)===JSON.stringify(y)) return; if(x&&y&&typeof x==='object'&&typeof y==='object'){for(const k of new Set([...Object.keys(x),...Object.keys(y)])) walk(p+'/'+k,x[k],y[k])} else {n++; if(n<=20) console.log('다름',p,JSON.stringify(x)?.slice(0,80),'→',JSON.stringify(y)?.slice(0,80))} };
  for(const k of Object.keys(a)) walk(k,a[k],b[k]);
  console.log(n?`판정이 다른 곳 ${n}곳`:`판정 같음(항목 ${Object.keys(a).map(k=>k+' '+(Array.isArray(a[k])?a[k].length:Object.keys(a[k]).length)).join(', ')})`); process.exit(n?1:0);
}
const ROOT=path.join(__dirname,'..');
const APP=process.argv[2]||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out'); fs.mkdirSync(TMP,{recursive:true});
const page=path.join(TMP,'judgment_dump.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const { chromium } = require('playwright');
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},locale:'ko-KR',timezoneId:'Asia/Seoul'});
  await ctx.addInitScript(()=>{const FIX=new Date(2026,9,5,9,0,0).getTime(); const D=Date; class F extends D{constructor(...a){if(a.length===0) super(FIX); else super(...a)} static now(){return FIX}} window.Date=F;
    Math.random=(()=>{let x=42;return()=>{x=(x*16807)%2147483647;return x/2147483647}})()});
  const p=await ctx.newPage(); p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await p.goto('file://'+page); await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{
    const R={foods:{},stages:{},plans:{},labels:{},menus:{}};
    S.consent={date:today()}; S.onb="done";
    const immuno=(typeof IMMUNO_MEDS!=='undefined'&&IMMUNO_MEDS[0])||null;
    const orderIds=(()=>{try{return (typeof ORDER_OPTS!=='undefined'?ORDER_OPTS.map(o=>o[0]||o.id):Object.keys(S.orders.checked||{})).slice(0,3)}catch(e){return []}})();
    const PROF={
      base:()=>{S.profile={...S.profile,height:"170",weight:"60",age:"30",sex:"F",allergies:[],allergyOther:"",lactose:false,meds:[],dislikes:"",budget:"보통"}; S.orders.checked=[]; S.triggers=[]},
      cond:()=>{S.profile={...S.profile,height:"174",weight:"63",age:"67",sex:"M",allergies:["shrimp","egg","wheat"],allergyOther:"땅콩버터",lactose:true,meds:immuno?[immuno]:[],dislikes:"가지",budget:"알뜰"}; S.orders.checked=orderIds; S.triggers=[{name:"우유",foodId:"milk"}]},
      young:()=>{S.profile={...S.profile,height:"160",weight:"48",age:"22",sex:"F",allergies:["dairy"],allergyOther:"",lactose:false,meds:[],dislikes:"",budget:"여유"}; S.orders.checked=[]; S.triggers=[]},
    };
    const ids=Object.keys(FOOD).sort();
    for(const [pn,set] of Object.entries(PROF)) for(const st of ["1","2","3"]){
      set(); S.stageMode=st; S.logs={}; try{FS_CACHE={sig:null,m:new Map()}}catch(e){}
      const c=ctx(); R.foods[pn+'-'+st]=ids.map(id=>{const r=foodStatus(FOOD[id],c); return id+':'+r.level+':'+((r.reasons||r.why||[]).length||0)}).join('|');
      if(pn!=='young'){ S.plan=null; const pl=samplePlan(); R.plans[pn+'-'+st]=(pl.days||[]).map(d=>d.date+'='+(d.meals||[]).map(m=>m.slot+':'+(m.items||[]).map(it=>Array.isArray(it)?it.join('*'):(it.id||it.f||'')+'*'+(it.g||it.amt||'')).join('+')).join(';')).join('/') }
    }
    PROF.base(); S.stageMode="auto";
    const mk=(o)=>Object.assign(typeof BLANK_LOG==='function'?BLANK_LOG():{},{date:today(),stool:0,medtaken:1,extra:[],other:[],memo:"",temp:"",pulse:"",gas:"없음",fatigue:"없음"},o);
    for(const day of [0,1,2,3,4,5,6,7,8,10]) for(const night of [0,2]) for(const bloody of [0,1,4]) for(const urg of [0,1,2,3]) for(const pain of [0,4,8]) for(const well of [0,2,4]) for(const temp of ["","38.0"]){
      const l=mk({day,night,bloody,blood:bloody?2:0,urg,pain,well,temp}); try{R.stages[[day,night,bloody,urg,pain,well,temp].join(',')]=activity(l).stage}catch(e){R.stages[[day,night,bloody,urg,pain,well,temp].join(',')]='ERR'}
    }
    for(const t of ["밀가루, 설탕, 대두유, 정제소금","우유, 계란, 새우, 아질산나트륨","말티톨, 카라기난, 수크랄로스","쌀, 정제수","돼지고기, 아질산나트륨, 향미증진제","땅콩, 호두, 아몬드","주정, 정제수, 과당","현미, 귀리, 치커리뿌리추출물(이눌린)"]){
      for(const [pn,set] of [["base",PROF.base],["cond",PROF.cond]]){ set(); S.stageMode="1"; try{const r=labelCheck(t,"검사"); R.labels[pn+'|'+t]=(r.overall||r.lv||'')+':'+(r.rows||[]).map(x=>x.lv).join(',')}catch(e){R.labels[pn+'|'+t]='ERR '+e.message} } }
    for(const t of ["연어 포케","크림 파스타","김치찌개","흰쌀죽","치킨","짜장면","새우볶음밥","된장국","떡볶이","우동"]){
      for(const [pn,set] of [["base",PROF.base],["cond",PROF.cond]]) for(const st of ["1","3"]){ set(); S.stageMode=st; try{MJ.text=t; mjFromText(); mjJudge(); R.menus[pn+'-'+st+'|'+t]=(MJ.results||[]).map(r=>(r.name||'')+':'+(r.lv||r.level||(r.st&&r.st.level)||'')).join(',')}catch(e){R.menus[pn+'-'+st+'|'+t]='ERR '+e.message} try{mjReset()}catch(e){} } }
    return R;
  });
  process.stdout.write(JSON.stringify(out)); await b.close();
})();
