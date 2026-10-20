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
// v1.8.0 첫 실행 설정·홈 개편·먹은 양·즐겨찾기·질문·목표·보고서·근거 표시·저장 안전장치·정확도 기능
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}}); const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('t29.html'));await p.waitForTimeout(400);
// 1. 동의 → 첫 실행 설정(안내 → 키·몸무게 → 알레르기 → 오늘 증상)
// v1.9.0: 저장 위치 안내는 동의 화면('기록은 이 기기에만 저장됩니다')으로 모으고 첫 실행 안내에서는 뺐다.
//  백업 파일 불러오기는 label[for=restore] 대신 키보드로도 누르는 버튼(data-act=restorePick, A-5)
const where=await p.evaluate(()=>/기록은 이 기기에만 저장됩니다/.test(document.querySelector('#main').textContent));
await p.click('label.swrow:has(#c_req)'); await p.click('#consentGo'); await p.waitForTimeout(250);
const intro=await p.evaluate(()=>({onb:S.onb,tabsHidden:document.body.classList.contains('welcome'),restore:!!document.querySelector('button[data-act=restorePick]')&&!!document.querySelector('input#restore[type=file]'),paste:!!document.querySelector('[data-act=restorePaste]'),skip:!!document.querySelector('[data-act=onbSkip]')}));
console.log('intro',JSON.stringify(intro),where);
expect(intro.onb==="0"&&intro.tabsHidden&&intro.restore&&intro.paste&&intro.skip&&where,'첫 실행 안내: 백업 불러오기·그냥 시작하기·저장 위치(동의 화면)');
{const fc=p.waitForEvent('filechooser',{timeout:3000}).then(()=>true).catch(()=>false); await p.click('[data-act=restorePick]'); expect(await fc,'백업 파일 불러오기 버튼이 파일 선택 창을 엶')}
expect(await p.evaluate(()=>{const b=[...document.querySelectorAll('.bottom-bar .btn,.bottom-bar label')].map(x=>x.textContent.trim()); return b.indexOf('그냥 시작하기')>b.indexOf('백업 파일 불러오기')}),'그냥 시작하기는 백업 불러오기 아래');
await p.click('[data-act=onbGo]'); await p.waitForTimeout(200);
await p.fill('#o_height','170'); await p.fill('#o_weight','90'); await p.fill('#o_age','40'); await p.click('[data-act=onbSex][data-v=F]'); await p.waitForTimeout(150);
await p.click('[data-act=onbNext]'); await p.waitForTimeout(200);
// v1.9.0 D-9: 알레르기는 자주 고르는 8가지 칩(ONB_COMMON) + '더 보기'로 나머지를 펼친다(스위치 목록 대신)
const alv=await p.evaluate(()=>({chips:[...document.querySelectorAll('[data-act=onbAlT]')].map(b=>b.dataset.v),more:!!document.querySelector('[data-act=onbAlMore]'),common:ONB_COMMON.slice(),all:[...ALLERGY_OPTS,...ALLERGY_EXTRA].map(([v])=>v)}));
await p.click('[data-act=onbAlT][data-v=peanut]'); await p.click('label.swrow:has([data-act=onbLac])'); await p.waitForTimeout(150);
await p.click('[data-act=onbAlMore]'); await p.waitForTimeout(150);
const alx=await p.evaluate(()=>({n:document.querySelectorAll('[data-act=onbAlT]').length,more:!!document.querySelector('[data-act=onbAlMore]'),extra:[...document.querySelectorAll('[aria-label="그 밖의 알레르기"] [data-act=onbAlT]')].map(b=>b.dataset.v)}));
await p.click('[aria-label="그 밖의 알레르기"] [data-act=onbAlT][data-v=pine]'); await p.waitForTimeout(150);   // 펼친 목록에서 하나(잣)
console.log('onb allergy',JSON.stringify({alv,alx}));
expect(JSON.stringify(alv.chips)===JSON.stringify(alv.common)&&alv.more&&alx.n===alv.all.length&&!alx.more&&alx.extra.length===alv.all.length-alv.common.length,'알레르기: 자주 고르는 칩 + 더 보기로 나머지 전부');
await p.click('[data-act=onbNext]'); await p.waitForTimeout(200);
await p.click('[data-act=onbDone][data-v=""]'); await p.waitForTimeout(400);
const ob=await p.evaluate(()=>({onb:S.onb,h:S.profile.height,age:S.profile.age,sex:S.profile.sex,w:bodyWeight(),al:S.profile.allergies,lac:S.profile.lactose,persist:S.persist,tabs:document.querySelectorAll('.tab').length,nutriTab:!!document.querySelector('.tab[data-tab=nutri]')}));
console.log('onboard',JSON.stringify(ob));
expect(ob.onb==="done"&&ob.h==="170"&&ob.age==="40"&&ob.sex==="F"&&ob.w===90&&ob.al.includes("peanut")&&ob.al.includes("pine")&&ob.lac,'첫 실행 설정 값 저장');
expect(["yes","no","na"].includes(ob.persist),'기록 보존 요청');
expect(ob.tabs===4&&!ob.nutriTab,'하단 탭 4개(오늘 영양 탭 없음)');
// 2. BMI에 따른 열량 목표(대한비만학회 표: 과체중·비만 25kcal/kg)
const tg=await p.evaluate(()=>{const t=targets(); return {bmi:t.bmi.bmi,cat:t.bmi.cat,kpk:t.kpk,k:t.k}});
console.log('bmi',JSON.stringify(tg)); expect(tg.cat==="비만"&&tg.kpk===25&&tg.k===2250,'비만이면 25kcal/kg');
await p.evaluate(()=>{S.weights=[{date:today(),kg:50}];S.profile.weight="50";render()});
expect(await p.evaluate(()=>{const t=targets(); return t.bmi.low&&t.kpk===35&&t.k===1750}),'저체중이면 35kcal/kg');
// 3. 홈: 첫 화면 안에 끼니, 한 줄 요약
await p.evaluate(()=>{S.weights=[{date:today(),kg:63}];S.profile.weight="63";SCR=null;S.tab="plan";render();window.scrollTo(0,0)}); await p.waitForTimeout(300);
// v1.9.0: 홈 맨 위는 '오늘 할 일'(증상 기록·끼니 표시·물). v1.12.0 후속 디자인(사용자 결정): 그래프 바로 아래 오늘 끼니, 할 일은 그 아래(할 일의 '끼니 표시'는 그대로 끼니로 데려감)
const home=await p.evaluate(()=>{const t=document.querySelector('.tasks'); const m=document.querySelector('.list.meals .mrow'); const g=document.querySelector('[data-act=goMeals]'); return {taskTop:t?t.getBoundingClientRect().top:9999,mealTop:m?m.getBoundingClientRect().top:9999,vh:innerHeight,goMeals:!!g,meals:!!document.querySelector('.mrow'),sum:!!document.querySelector('.sumline .sl-main'),card:!!document.querySelector('#dayNutri'),ring:!!document.querySelector('.ring')}});
console.log('home',JSON.stringify(home)); expect(home.mealTop<home.vh-200&&home.taskTop<9999&&home.goMeals&&home.meals&&home.sum&&!home.card&&!home.ring,'홈 첫 화면 안에 오늘 끼니, 그 아래 오늘 할 일·요약·끼니 바로 가기(v1.10.0: 겹치던 영양 막대 카드는 요약 줄→오늘 영양 화면으로)');
// 4. 먹은 양 선택(반·전부·더 많이)
await p.click('.mwrap:nth-child(1) [data-act=ateToggle]'); await p.waitForTimeout(200);
const k1=await p.evaluate(()=>Math.round(eatenTotals(today()).k));
await p.click('.mwrap:nth-child(1) [data-act=ateRatio][data-v="0.5"]'); await p.waitForTimeout(200);
const k2=await p.evaluate(()=>Math.round(eatenTotals(today()).k));
await p.click('.mwrap:nth-child(1) [data-act=ateRatio][data-v="1.5"]'); await p.waitForTimeout(200);
const k3=await p.evaluate(()=>Math.round(eatenTotals(today()).k));
console.log('ratio',k1,k2,k3); expect(k1>0&&Math.abs(k2-k1/2)<=k1*0.05&&Math.abs(k3-k1*1.5)<=k1*0.05,'반·더 많이가 먹은 양 합계에 반영');
// 5. 저녁 7시 전에는 모자람을 강조하지 않음
const sh=await p.evaluate(()=>{const D=Date; const at=h=>{window.Date=class extends D{constructor(...a){if(a.length) super(...a); else {super(); this.setHours(h,0,0,0)}} static now(){const d=new D(); d.setHours(h,0,0,0); return d.getTime()}}; SCR=null; openScr("nutri"); return !!document.querySelector('.meter .bar i.low')};
  const before=at(9), after=at(20); window.Date=D; SCR=null; S.tab="plan"; render(); return {before,after}});
console.log('short',JSON.stringify(sh)); expect(!sh.before&&sh.after,'저녁 7시가 지나야 주황색');
// 6. 즐겨찾기·끼니별 기록·다른 날 기록 가져오기
await p.evaluate(()=>{showFood("banana")}); await p.waitForTimeout(150); await p.click('#sheetRoot [data-act=favToggle]'); await p.waitForTimeout(150);
await p.evaluate(()=>{closeSheet(); openExtraSheet(today())}); await p.waitForTimeout(150);
const ex=await p.evaluate(()=>({fav:S.favs.includes("banana"),chip:/★ 즐겨찾기/.test(document.querySelector('#sheetRoot').textContent)}));
await p.click('#sheetRoot [data-act=exSlot][data-v=S]'); await p.click('#sheetRoot .chip[data-act=exPick][data-v=banana]'); await p.waitForTimeout(150);
const basis=await p.evaluate(()=>document.querySelector('#sheetRoot .wbasis')?.textContent);
await p.click('#sheetRoot [data-act=exSave]'); await p.waitForTimeout(150);
const sv=await p.evaluate(()=>{const x=S.extras[today()].slice(-1)[0]; return {slot:x.slot,id:x.foodId,freq:slotFoods("S").includes("banana")}});
console.log('fav',JSON.stringify({ex,basis,sv})); expect(ex.fav&&ex.chip&&sv.slot==="S"&&sv.id==="banana"&&sv.freq&&basis==="생것 무게",'즐겨찾기·끼니·무게 기준');
await p.evaluate(()=>{const y=addDays(today(),-1); S.extras[y]=[{name:"흰쌀죽",foodId:"rice_porridge",amt:250,unit:"g",slot:"B",kcal:132,p:2.5,fi:0,ca:0}]; const n0=(S.extras[today()]||[]).length; window.__n0=n0}); 
await p.evaluate(()=>{const a=document.createElement('button'); a.dataset.act='copyDay'; a.dataset.v=addDays(today(),-1); a.dataset.to=today(); document.body.appendChild(a); a.click(); a.remove()}); await p.waitForTimeout(200);
expect(await p.evaluate(()=>(S.extras[today()]||[]).length===window.__n0+1&&S.extras[today()].some(x=>x.foodId==="rice_porridge")),'다른 날 기록 가져오기');
// 7. 진료 때 물어볼 것 → PDF 앞쪽
await p.evaluate(()=>{SCR=null;S.tab="log";openScr("asks")}); await p.waitForTimeout(150);
await p.fill('#qAdd','철분제를 계속 먹어도 됩니까?'); await p.click('[data-act=qAdd]'); await p.waitForTimeout(150);
const qs=await p.evaluate(()=>({n:S.qs.length,t:S.qs[0].t,shown:/철분제/.test(document.querySelector('#main').textContent)}));
await p.click('.qrow input[data-act=qDone]'); await p.waitForTimeout(150);
const qd=await p.evaluate(()=>!!S.qs[0].done);
console.log('qs',JSON.stringify(qs),qd); expect(qs.n===1&&qs.shown&&qd,'질문 적기·물어봄 표시');
// 8. 목표 직접 정하기
await p.evaluate(()=>{S.tab="plan";openScr("set-goals")}); await p.waitForTimeout(150);
await p.fill('#g_k','2000'); await p.fill('#g_p','90'); await p.click('[data-act=goalSave]'); await p.waitForTimeout(150);
const gk=await p.evaluate(()=>{const t=targets(); return [t.k,t.p,t.custom.join(",")]});
await p.evaluate(()=>{openScr("set-goals")}); await p.fill('#g_k','99999'); await p.click('[data-act=goalSave]'); await p.waitForTimeout(150);
const gbad=await p.evaluate(()=>S.goals.k===2000&&SCR&&SCR.name==="set-goals");
await p.click('[data-act=goalReset]'); await p.waitForTimeout(100);
console.log('goals',JSON.stringify(gk),gbad); expect(gk[0]===2000&&gk[1]===90&&gbad&&await p.evaluate(()=>!Object.keys(S.goals).length),'목표 저장·범위 확인·되돌리기');
// 9. 주간·월간 보고서(오늘 빼고)
await p.evaluate(()=>{const y=addDays(today(),-2); S.ate[y]=["아침"]; S.ateMeals[y]={"아침":{t:"흰죽",it:[["rice_porridge",300]]}}; openScr("report")}); await p.waitForTimeout(150);
const rep=await p.evaluate(()=>({t:document.querySelector('#main').textContent.replace(/\s+/g,' ').match(/어제까지 7일 가운데 먹은 기록이 있는 (\d+)일/)?.[1]}));
console.log('report',JSON.stringify(rep)); expect(rep.t==="2",'보고서는 어제까지 기록한 날의 평균');
// 10. 근거 표시: 모아서 / 번호 / 숨기기
await p.evaluate(()=>{SCR=null;S.tab="plan";S.refMode="group";openScr("nutri")});
const g1=await p.evaluate(()=>({grp:document.querySelectorAll('#main sup.ref.grp').length,num:document.querySelectorAll('#main sup.ref:not(.grp)').length,label:document.querySelector('#main sup.ref.grp')?.textContent}));
await p.evaluate(()=>{S.refMode="num";render()}); const g2=await p.evaluate(()=>document.querySelectorAll('#main sup.ref.grp').length);
await p.evaluate(()=>{S.refMode="hide";render()}); const g3=await p.evaluate(()=>{const e=document.querySelector('#main sup.ref'); return [document.documentElement.dataset.ref,e?getComputedStyle(e).display:"none(없음)",document.querySelectorAll('#main sup').length]});
await p.evaluate(()=>{S.refMode="group";SCR=null;S.tab="plan";render()});
console.log('refs',JSON.stringify({g1,g2,g3})); expect(g1.grp>0&&g1.num===0&&/^근거·/.test(g1.label)&&g2===0&&g3[0]==="hide"&&/^none/.test(g3[1]),'근거 표시 세 방식');
// 11. 안내 접기(처음 한 번만)
await p.evaluate(()=>{openScr("nutri")}); await p.waitForTimeout(200); await p.click('.tipbox[data-tip=nutriAte] .tip-x'); await p.waitForTimeout(150);
const tp=await p.evaluate(()=>({tips:S.tips,btn:!!document.querySelector('[data-act=tipShow][data-v=nutriAte]')}));
console.log('tips',JSON.stringify(tp)); expect(tp.tips.includes("nutriAte")&&tp.btn,'안내를 닫으면 ⓘ로 남음'); await p.evaluate(()=>{SCR=null;S.tab="plan";render()});
// 12. 증상 기록 아래 버튼이 화면 전환 중에도 맨 아래
await p.evaluate(()=>{openWizard(today())}); await p.waitForTimeout(400);
// v1.9.0 U-1: 한 쪽에 꼭 답할 질문이 여럿이면 질문마다 첫 보기를 눌러야 '다음'이 열린다
const wz=[]; for(let i=0;i<3;i++){const d=await p.$('[data-act=wzNext][disabled]'); if(d){ await p.evaluate(()=>{ for(let k=0;k<12;k++){ const q=[...document.querySelectorAll('.wq')].find(q=>q.querySelector('.opts button,.seg3 button')&&!q.querySelector('.opts button[aria-pressed="true"],.seg3 button[aria-pressed="true"]')); if(!q) break; q.querySelector('.opts button,.seg3 button').click() } }); await p.waitForTimeout(150) } await p.click('[data-act=wzNext]'); wz.push(await p.evaluate(()=>Math.round(document.querySelector('.bottom-bar').getBoundingClientRect().bottom)))}
console.log('wzbar',JSON.stringify(wz)); expect(wz.every(x=>Math.abs(x-844)<=2),'기록 버튼이 넘어가는 동안에도 맨 아래');
await p.evaluate(()=>{wizardDirty=()=>false; SCR=null; render()}); await p.waitForTimeout(400);
// 12-1. 화면을 연 직후(아래 탭이 내려가는 0.25초 동안)에도 아래 버튼을 누르면 탭이 아니라 그 버튼이 눌림
const hit=await p.evaluate(()=>{openWizard(today()); const b=document.querySelector('.bottom-bar .btn'); const r=b.getBoundingClientRect(); const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2); return {tab:!!e?.closest('.tabs'),bar:!!e?.closest('.bottom-bar')}});
console.log('bar hit',JSON.stringify(hit)); expect(!hit.tab&&hit.bar,'화면 전환 중 아래 버튼 자리를 누르면 탭이 아니라 버튼');
await p.evaluate(()=>{wizardDirty=()=>false; SCR=null; render()});
// 13. 끼니 상세: 평가 버튼은 '불편했던 음식 고르기'를 눌러야
await p.evaluate(()=>{SCR=null;S.tab="plan";render();openScr("meal",{k:1})}); await p.waitForTimeout(200);
const r0=await p.evaluate(()=>document.querySelectorAll('[data-act=rateSet]').length);
await p.click('[data-act=rateOpen]'); await p.waitForTimeout(150);
const r1=await p.evaluate(()=>document.querySelectorAll('[data-act=rateSet]').length);
console.log('rate',r0,r1); expect(r0===0&&r1>=3,'평가 버튼 접기');
// 14. 음식 정보: FODMAP 1회량·무게 기준·값 종류
await p.evaluate(()=>{SCR=null;S.tab="food";render();showFood("broccoli")}); await p.waitForTimeout(150);
const fb=await p.evaluate(()=>document.querySelector('#sheetRoot').textContent.replace(/\s+/g,' '));
const fbx=await p.evaluate(()=>document.querySelector('#sheetRoot .fsv')?.getAttribute('aria-label')||'');
await p.evaluate(()=>{closeSheet();showFood("egg_soup")}); await p.waitForTimeout(150);
const fe=await p.evaluate(()=>document.querySelector('#sheetRoot').textContent.replace(/\s+/g,' '));
await p.evaluate(()=>{closeSheet();showFood("white_rice")}); await p.waitForTimeout(150);
await p.click('#sheetRoot [data-act=nutBasis][data-v="100"]'); await p.waitForTimeout(150);   // v1.9.0 D-13: 기본은 1회 분량 → 100g당으로 바꿔 실측값 확인
const fr=await p.evaluate(()=>document.querySelector('#sheetRoot').textContent.replace(/\s+/g,' ')); await p.evaluate(()=>closeSheet());
console.log('food',fb.slice(0,40));
expect(/75g까지/.test(fb)&&/208g부터/.test(fb)&&/279g부터/.test(fb)&&/프럭탄/.test(fb)&&/2차 자료/.test(fb),'브로콜리 FODMAP 1회량');
expect(fbx==='FODMAP 낮음 75, 중간 208, 높음 279','브로콜리 신호등 칸(낮음·중간·높음)');
expect(/가정식 실측값/.test(fe)&&/13~39kcal/.test(fe)&&/완성된 음식 무게/.test(fe),'계란국 값 종류·범위');
expect(/익힌 뒤 무게/.test(fr)&&/국가표준식품성분표 실측값/.test(fr)&&/152/.test(fr),'흰쌀밥 값(실측)·무게 기준');
// 15. 음식·증상 분석: 평소 나쁜 날 비율과 비교, 전날 포함, 거의 매일 먹는 음식 제외
const sus=await p.evaluate(()=>{S.logs={}; S.extras={}; S.ratings=[]; S.ateMeals={}; S.ate={};
  const bad={day:6,night:2,bloody:3,urg:2,blood:2,well:2,extra:[],pain:5,gas:"많이",fatigue:"심함",temp:"",pulse:"",other:[],memo:"",stool:0,medtaken:1};
  const good={day:1,night:0,bloody:0,urg:0,blood:0,well:0,extra:[],pain:0,gas:"없음",fatigue:"없음",temp:"",pulse:"",other:[],memo:"",stool:0,medtaken:1};
  for(let i=0;i<14;i++){const d=addDays(today(),-i); S.logs[d]=i%4===0?bad:good; S.extras[d]=[{name:"흰쌀밥",foodId:"white_rice",amt:200,unit:"g",kcal:300,p:5,fi:0,ca:0}]; if(i%4===1) S.extras[d].push({name:"우유",foodId:"milk",amt:200,unit:"g",kcal:130,p:6,fi:0,ca:200}); if(i%3===2) S.extras[d].push({name:"사과",foodId:"apple",amt:100,unit:"g",kcal:50,p:0,fi:2,ca:5})}
  const r=foodSuspects(); return {base:r.base,n:r.n,names:r.map(x=>x.name),milk:r.find(x=>x.name==="우유")}});
console.log('suspects',JSON.stringify(sus)); expect(sus.n===14&&sus.names.includes("우유")&&!sus.names.includes("흰쌀밥")&&sus.milk.pct>sus.milk.rest,'음식·증상 분석 보정');
expect(!sus.names.includes("사과"),'나쁜 날 비율이 평소와 비슷한 음식은 의심하지 않음');
// 16. 체중 감소 경고(GLIM)
const gl=await p.evaluate(()=>{S.weights=[{date:addDays(today(),-100),kg:70},{date:today(),kg:62}]; const r=weightLoss(); return {lv:r.level,p6:r.p6,html:/6개월 안에 11.4% 줄었습니다/.test(glimHTML())}});
console.log('glim',JSON.stringify(gl)); expect(gl.lv===2&&gl.html,'6개월 안 10% 넘게 줄면 2단계 경고');
// 17. 다른 창에서 저장하면 이 창은 저장을 멈추고 알린다
const st=await p.evaluate(()=>{save(); const before=localStorage.getItem(KEY); localStorage.setItem(KEY+".rev",String(MY_REV+5)); window.dispatchEvent(new StorageEvent("storage",{key:KEY+".rev",newValue:String(MY_REV+5)})); S.profile.dislikes="다른창"; save(); return {stale:STALE,unchanged:localStorage.getItem(KEY)===before,banner:/다른 창에서 기록이 바뀌었습니다/.test(document.querySelector('#main').textContent)}});
await p.evaluate(()=>reloadState()); const st2=await p.evaluate(()=>({stale:STALE,d:S.profile.dislikes}));
console.log('stale',JSON.stringify(st),JSON.stringify(st2)); expect(st.stale&&st.unchanged&&st.banner&&!st2.stale&&st2.d!=="다른창",'여러 창 충돌 방지');
const st3=await p.evaluate(()=>{const before=localStorage.getItem(KEY); localStorage.setItem(KEY+".rev",String(MY_REV+3)); S.profile.dislikes="이벤트전"; save(); const r={stale:STALE,unchanged:localStorage.getItem(KEY)===before}; reloadState(); return r});   // 알림(storage 이벤트)이 오기 전에 저장해도 막음
console.log('stale-noevent',JSON.stringify(st3)); expect(st3.stale&&st3.unchanged,'다른 창 저장을 저장 직전에 확인');
// 18. 백업 불러오기: 비교 → 합치기 → 되돌리기
const rs=await p.evaluate(()=>{S.logs={[today()]:{day:1,night:0,bloody:0,urg:0,blood:0,well:0,extra:[],pain:0,gas:"없음",fatigue:"없음",temp:"",pulse:"",other:[],memo:"오늘",stool:0,medtaken:1}}; save();
  const bk={...JSON.parse(JSON.stringify(S)),extras:{},weights:[],ateMeals:{},ate:{},water:{},logs:{[addDays(today(),-40)]:{day:2,night:0,bloody:0,urg:0,blood:0,well:0,extra:[],pain:0,gas:"없음",fatigue:"없음",temp:"",pulse:"",other:[],memo:"옛날",stool:0,medtaken:1}},app:"uc-table",v:1};
  restoreFromText(JSON.stringify(bk)); const sheet=document.querySelector('#sheetRoot').textContent; return {cmp:/지금 이 기기/.test(sheet)&&/합치기/.test(sheet)&&/오래됐습니다/.test(sheet)}});
await p.click('#sheetRoot [data-act=restoreApply][data-v=merge]'); await p.waitForTimeout(200);
const mg=await p.evaluate(()=>Object.keys(S.logs).length);
await p.evaluate(()=>{openScr("set-data")}); await p.waitForTimeout(150); await p.click('[data-act=restoreUndo]'); await p.click('#sheetRoot [data-act=restoreUndoGo]'); await p.waitForTimeout(200);
const ud=await p.evaluate(()=>Object.keys(S.logs).length);
console.log('restore',JSON.stringify(rs),mg,ud); expect(rs.cmp&&mg===2&&ud===1,'불러오기 비교·합치기·되돌리기');
// 19. 백업 안내: 백업 뒤 바뀐 날 수
const bn=await p.evaluate(()=>{S.lastBackup=addDays(today(),-5); S.chgDays=[addDays(today(),-4),addDays(today(),-2),addDays(today(),-1),today()]; S.nudgeHide=""; SCR=null; S.tab="plan"; render(); return /마지막 백업\(.+\) 뒤 4일치 기록이 백업되지 않았습니다/.test(document.querySelector('#main').textContent)});
expect(bn,'백업 뒤 n일치 안내');
// 20. 예기치 못한 오류는 위쪽 안내로
await p.evaluate(()=>{window.dispatchEvent(new ErrorEvent("error",{message:"시험용 오류"}))}); await p.waitForTimeout(200);
const eb=await p.evaluate(()=>!!document.querySelector('#errbar .banner.crit'));
expect(eb,'오류 안내 띄우기'); errs.splice(0,errs.length,...errs.filter(e=>!/시험용 오류/.test(e)));
// 21. 홈 화면 바로가기 안내·저장 위치
await p.evaluate(()=>{$("#errbar")?.remove(); S.tab="me"; openScr("set-home")}); await p.waitForTimeout(150);
const hs=await p.evaluate(()=>({t:/앱 설치/.test(document.querySelector('#main').textContent),where:storeWhere().k}));   // v1.9.0 W-7: 크롬 메뉴 이름 '앱 설치'(파일로 열면 주소를 열어 설치하라고 안내)
console.log('home-shortcut',JSON.stringify(hs)); expect(hs.t&&hs.where==="file",'홈 화면 바로가기 안내·저장 위치');
// 21-1. 홈 제목 자리에는 앱 이름 대신 UC TABLE 로고(그림), 화면 읽기에는 글자로
const lg=await p.evaluate(()=>{closeScr(); S.tab="plan"; render(); const h=document.querySelector('#appbar h1'); const svg=h.querySelector('.logo svg'); const r=svg?.getBoundingClientRect();
  return {svg:!!svg,hidden:svg?.getAttribute('aria-hidden'),sr:h.querySelector('.sr-only')?.textContent,old:/UC 식단 관리 도우미/.test(document.querySelector('#appbar').textContent),h:r?Math.round(r.height):0,col:getComputedStyle(h.querySelector('.logo')).color}});
console.log('logo',JSON.stringify(lg)); expect(lg.svg&&lg.hidden==="true"&&lg.sr==="UC TABLE"&&!lg.old&&lg.h>=20&&lg.h<=28,'홈 제목 자리에 UC TABLE 로고');
// 22. 뒤로 가기 기록 수가 어긋나도(화면을 빠르게 여닫을 때) 앱이 쌓은 기록보다 더 뒤로 가 앱 밖으로 나가지 않음
const url0=p.url();
await p.evaluate(()=>{closeSheet(); closeScr()}); await p.waitForTimeout(400);   // 앱 첫 기록으로 돌아온 뒤
await p.evaluate(()=>{NAV.depth=1; NAV.skip=0; navSync()}); await p.waitForTimeout(600);   // 쌓은 기록이 없는데 1개 있다고 잘못 알고 있을 때
const nv=await p.evaluate(()=>({alive:typeof S==="object",depth:NAV.depth})).catch(()=>({alive:false}));
console.log('nav guard',JSON.stringify(nv),p.url()===url0); expect(nv.alive&&p.url()===url0,'앱이 쌓은 기록보다 더 뒤로 가지 않음');
console.log('errors',errs); expect(errs.length===0,'페이지 오류 없음');
__done(); await b.close();})();
