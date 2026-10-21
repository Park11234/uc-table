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
const { chromium } = require('playwright'); const fs=require('fs');

// 검증용: 출력한 줄을 모아 두고 끝에서 기대값과 비교한다(v1.5.0)
const __LOG=[]; {const __o=console.log; console.log=(...a)=>{__LOG.push(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ')); __o(...a)}}
const logOf=k=>{const l=__LOG.find(x=>x===k||x.startsWith(k+' ')); return l==null?null:l.slice(k.length).trim()};
const jsonOf=k=>{const v=logOf(k); if(v==null) return null; try{return JSON.parse(v)}catch(e){return v}};
const lineJSON=pre=>{const l=__LOG.find(x=>x.startsWith(pre)); if(l==null) return null; try{return JSON.parse(l)}catch(e){return null}};
const FAILS=[]; const expect=(c,m)=>{let ok=false; try{ok=typeof c==='function'?!!c():!!c}catch(e){m+=' ('+e.message+')'} if(!ok) FAILS.push(m)};
const __done=()=>{ if(FAILS.length){ console.error('FAIL\n'+FAILS.join('\n')); process.exitCode=1 } else console.log('검증 통과') };
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('t7.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t7.html'));await p.waitForTimeout(500);await p.evaluate(()=>{S.consent={date:today()};render()});
const r=await p.evaluate(()=>{
  const out={};
  S.profile.allergies=['wheat','egg','dairy']; 
  const lc=labelCheck("소맥분, 난백분, 유청단백분말, 전분, 정제소금");
  out.label=[lc.overall,lc.rows.map(r=>r.title+":"+r.found.join("/"))];
  out.label2=labelCheck("쌀, 정제소금").rows.map(r=>r.title+":"+r.found.join("/"));
  S.profile.allergies=[]; S.profile.lactose=true;
  out.menu=[["전복죽",[]],["백김치",["배추","무"]],["닭갈비",["닭고기","양배추"]],["유당분해우유",[]],["김치전",["밀가루","김치"]]].map(([n,g])=>[n,ruleCheck({name:n,ingr:g,cook:""})]);
  out.act1=activity({day:2,night:5,bloody:0,urg:2,blood:0,well:1,extra:[],pain:9});
  out.act2=activity({day:3,night:0,bloody:0,urg:0,blood:0,well:0,extra:[]});
  out.act3=activity({day:4,night:1,bloody:1,urg:1,blood:1,well:0,extra:[]});
  // 단계 판정의 세 기준을 하나씩만 건드리는 기록과 바로 아래 경계값(검토 보고서 5번)
  out.act4=activity({day:2,night:0,bloody:0,urg:2,blood:0,well:3,extra:[]});   // 보조 합산 5점(다른 기준은 모두 비켜감)
  out.act5=activity({day:2,night:0,bloody:0,urg:2,blood:0,well:2,extra:[]});   // 보조 합산 4점
  out.act6=activity({day:4,night:0,bloody:4,urg:0,blood:0,well:0,extra:[]});   // 혈변 4회(보조 합산 1점, 배변 4회)
  out.act7=activity({day:4,night:0,bloody:3,urg:0,blood:0,well:0,extra:[]});   // 혈변 3회
  out.act8=activity({day:4,night:0,bloody:0,urg:0,blood:0,well:0,extra:[]});   // 배변 4회·피 없음 = 관해 기준(3회 이하) 밖
  out.d1=dangerSignals({day:3,night:0,bloody:2,temp:"39.2",pulse:"118",pain:3});
  out.d2=dangerSignals({day:8,night:2,bloody:7,temp:"37.6",pulse:"",pain:3});
  out.d3=dangerSignals({day:14,night:2,bloody:3,temp:"",pulse:"95",pain:3});
  S.weights=[{date:today(),kg:58}]; out.water=[targets().water,targets().waterSrc];
  S.stageMode=1;
  out.st=["nurungji","radish","salmon","beef","milk","soy_milk","somen","button_mushroom","perilla_oil","crab","pumpkin_porridge","chicken_porridge","mandarin","napa"].map(id=>[id,FOOD[id].fi,foodStatus(FOOD[id]).level,foodStatus(FOOD[id]).reasons.join("|")]);
  out.missing=FOODS.filter(f=>f.missing.length).map(f=>f.id);
  out.noicon=FOODS.filter(f=>!FICON[f.id]).map(f=>f.id);
  out.sample=samplePlan().days[0].meals.map(m=>m.slot+":"+m.title);
  out.viol=samplePlan().days.flatMap(d=>d.meals.flatMap(m=>m.items.filter(([id,g])=>FOOD[id].fi*g/100>=2).map(x=>m.title+x)));
  return out});
console.log(JSON.stringify(r,null,0).replace(/\],\"/g,'],\n"'));
// meds + nutri
await p.evaluate(()=>{S.stageMode="auto";S.profile.meds=["ssz","steroid","chol"];S.tab="plan";openScr("nutri")});
await p.waitForTimeout(300); await p.screenshot({path:T('t7_nutri.png'),fullPage:true});
// back nav
await p.evaluate(()=>{S.tab="plan";SCR=null;render()}); await p.click('.mrow[data-k="0"]'); await p.waitForTimeout(100);
console.log('open meal', await p.evaluate(()=>[SCR&&SCR.name,history.length,NAV.depth]));
await p.goBack(); await p.waitForTimeout(200);
console.log('after back', await p.evaluate(()=>[SCR,NAV.depth]));
await p.click('.ridge [data-act=wizard]'); await p.waitForTimeout(100);
await p.click('[data-act=step][data-k=day][data-v="1"]');
await p.goBack(); await p.waitForTimeout(200);
console.log('wizard dirty back', await p.evaluate(()=>[SCR&&SCR.name,!!document.querySelector('#sheetRoot').firstChild,NAV.depth]));
await p.goBack(); await p.waitForTimeout(200);
console.log('back again', await p.evaluate(()=>[SCR&&SCR.name,!!document.querySelector('#sheetRoot').firstChild,NAV.depth]));
await p.click('[data-act=back]'); await p.waitForTimeout(150); await p.click('[data-act=wzDiscard]'); await p.waitForTimeout(300);
console.log('discard', await p.evaluate(()=>[SCR,!!document.querySelector('#sheetRoot').firstChild,NAV.depth,NAV.skip]));
// double tap
// v1.9.0 U-1: 급박감 질문이 있는 쪽까지 '다음'(배변 쪽 → 급박감·피·몸 상태 쪽). 그 쪽은 답하기 전 '다음'이 막혀 있다
await p.click('.ridge [data-act=wizard]'); await p.waitForTimeout(100);
for(let i=0;i<5&&await p.evaluate(()=>WZ.step<wzStepOf("urg"));i++) await p.click('[data-act=wzNext]');
const stepBefore=await p.evaluate(()=>WZ.step);
await p.dblclick('[data-act=set][data-k=urg][data-v="1"]'); await p.waitForTimeout(500);
console.log('double tap step', stepBefore, await p.evaluate(()=>WZ.step), await p.evaluate(()=>wzStepOf("urg")));
// font size
await p.evaluate(()=>{draft=null;SCR=null;S.fontSize="xl";S.tab="plan";render()}); await p.waitForTimeout(400);
await p.screenshot({path:T('t7_xl_plan.png')});
await p.evaluate(()=>{SCR={name:"set-about"};render()}); await p.waitForTimeout(400);
await p.screenshot({path:T('t7_xl_about.png'),fullPage:true});
await p.evaluate(()=>{SCR=null;S.tab="food";render()}); await p.waitForTimeout(300); await p.click('.fcard'); await p.waitForTimeout(400);
await p.screenshot({path:T('t7_xl_sheet.png')});
console.log('hscroll', await p.evaluate(()=>document.documentElement.scrollWidth));
console.log('errors',errs); {const j=lineJSON('{"label"'); expect(j,'출력 없음');
 expect(()=>j.label[0]==='ban','알레르기 원재료(v1.11.0 R-15: 절대 금지)');
 expect(()=>{const m=Object.fromEntries(j.menu.map(([n,r])=>[n,r.level])); return m['전복죽']==='later'&&m['닭갈비']==='avoid'&&m['유당분해우유']==='ok'&&m['김치전']==='avoid'&&m['백김치']==='caution'},'외식 판정');
 expect(()=>j.act1.stage===1&&j.act2.stage===3&&j.act3.stage===1,'활동도 단계');
 expect(()=>j.act4.stage===1&&/보조 점수/.test(j.act4.label)&&j.act5.stage===2,'활동도: 보조 합산 5점부터 활동기, 4점은 아님');
 expect(()=>j.act6.stage===1&&/혈변/.test(j.act6.label)&&j.act7.stage===2,'활동도: 혈변 하루 4회부터 활동기, 3회는 아님');
 expect(()=>j.act8.stage===2,'활동도: 하루 배변 4회는 관해 기준(3회 이하) 밖');
 expect(()=>j.d1.severe.length&&j.d2.severe.length&&j.d3.severe.length,'위험 신호');
 expect(()=>j.water[0]===1740&&j.water[1]==='kg','수분 목표'); expect(()=>j.viol.length===0,'저잔사식 섬유');
 expect(()=>jsonOf('open meal')[0]==='meal','끼니 화면'); expect(()=>jsonOf('after back')[0]===null,'뒤로 가기');
 expect(()=>jsonOf('wizard dirty back')[1]===true,'작성 중 뒤로 가기 확인'); expect(()=>jsonOf('discard')[0]===null,'버리기');
 expect(()=>{const d=logOf('double tap step').split(' '); return d[0]===d[1]&&d[0]===d[2]},'연타 한 번만'); expect(()=>+logOf('hscroll')<=390,'가로 넘침');}   // v1.9.0: 급박감 쪽에 그대로 있어야 함
__done(); await b.close()})();
