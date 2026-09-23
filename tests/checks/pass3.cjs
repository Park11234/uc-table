const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const WRAP=n=>{const p=T(n); if(!fs_.existsSync(p)) fs_.writeFileSync(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
const { chromium } = require('playwright'); const fs=require('fs');
const out=(k,v)=>console.log(k, typeof v==='string'?v:JSON.stringify(v));
(async()=>{const b=await chromium.launch();
const body=fs.readFileSync(APP,'utf8');
const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>';
fs.writeFileSync(T('app.html'),html);
const errs=[];
const mk=async(vp={width:390,height:844})=>{const c=await b.newContext({viewport:vp});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));return p};
// P3-1 손상된 저장 데이터
let p=await mk();
await p.goto('file://'+WRAP('app.html')); await p.evaluate(()=>localStorage.setItem('uc-table.v1','{"profile":')); await p.reload(); await p.waitForTimeout(400);
out('1 load fail', await p.evaluate(()=>[LOAD_FAIL, !!document.body.textContent.match(/읽지 못했어요/), localStorage.getItem('uc-table.v1')]));
// 동의 화면에서도 경고가 보이는가
out('1b banner on welcome', await p.evaluate(()=>document.querySelector('#main').textContent.includes('읽지 못했')));
await p.evaluate(()=>{S.consent={date:today(),ai:false};render()});
out('1c banner home', await p.evaluate(()=>document.querySelector('#main').textContent.includes('읽지 못했')));
out('1d not overwritten', await p.evaluate(()=>{save();return localStorage.getItem('uc-table.v1')}));
await p.click('[data-act=freshStart]'); await p.click('[data-act=freshGo]'); await p.waitForTimeout(200);
out('1e fresh', await p.evaluate(()=>[LOAD_FAIL, localStorage.getItem('uc-table.v1').length>50, Object.keys(localStorage).filter(k=>k.includes('broken')).length]));
// P3-2 옛 버전 백업 복원(새 필드 없음)
out('2 old backup', await p.evaluate(()=>{const old={profile:{height:"170",age:"30",sex:"F",allergies:["shellfish"],meds:["steroid","unknown_med"]},logs:{"2026-09-01":{day:3,night:1}},ratings:[{date:"2026-09-01",slot:"아침",title:"흰죽",foodId:"rice_porridge",rating:"good"}],triggers:[{name:"우유"}],weights:[{date:"2026-09-01",kg:"55"}],water:{"2026-09-01":3},plan:{sample:false,days:[{date:"2026-09-01",meals:[{slot:"아침",title:"x",items:[["rice_porridge",200]]}]}]}};
  const n=normalizeState(old); return [n.profile.allergies, n.profile.meds, n.logs["2026-09-01"].stool, n.triggers[0].sym, JSON.stringify(n.ate), JSON.stringify(n.ateMeals), n.cupMl, n.plan.partial]}));
// P3-3 AI 식단이 어제 시작해 오늘 날짜가 밀린 경우
out('3 rollover ai', await p.evaluate(()=>{const mkDay=d=>({date:d,meals:SLOTS.map(sl=>({slot:sl,title:"t",rec:[],items:[["rice_porridge",200]],tip:"",refs:[]}))});
  S.plan={sample:false,start:addDays(today(),-1),stage:1,days:[...Array(7)].map((_,i)=>mkDay(addDays(today(),i-1)))}; S.selDay=0; S.tab="plan"; SCR=null; render();
  const big=document.querySelector('.big-date')?.textContent.trim().slice(0,8); const todayBtn=[...document.querySelectorAll('.day')].find(x=>x.textContent.includes('오늘'));
  return [big, !!todayBtn, S.selDay]}));
// P3-4 전 화면 다크·아주 크게·360px 가로 넘침
p=await mk({width:360,height:740});
await p.goto('file://'+WRAP('app.html')); await p.waitForTimeout(300);
const ov=await p.evaluate(async()=>{S.consent={date:today(),ai:false};S.theme="dark";S.fontSize="xl";
  for(let i=0;i<5;i++){const d=addDays(today(),-i);S.logs[d]={date:d,...BLANK_LOG(),day:3,bloody:i%2}}
  S.triggers=[{name:"우유",foodId:"milk",sym:["gas"],never:false}];
  const res={}; const chk=k=>{res[k]=document.documentElement.scrollWidth-innerWidth};
  for(const t of ["plan","log","food","nutri","me"]){SCR=null;S.tab=t;render();chk(t)}
  for(const sc of [["meal",{k:0}],["past",{date:addDays(today(),-1)}],["care",{}],["reintro",{}],["pdf",{}],["set-profile",{}],["set-data",{}],["set-trig",{}],["set-about",{}],["set-refs",{}]]){SCR={name:sc[0],...sc[1]};render();chk(sc[0])}
  SCR=null; openWizard(); for(let i=0;i<WSTEPS.length;i++){WZ.step=i;render();chk('wz'+WSTEPS[i].k)}
  return res});
out('4 overflow(px>0 = 넘침)', Object.fromEntries(Object.entries(ov).filter(([,v])=>v>0)));
// P3-5 접근성: 이름 없는 버튼
out('5 unnamed buttons', await p.evaluate(()=>{const bad=[];for(const t of ["plan","log","food","nutri","me"]){wizardDirty=()=>false;SCR=null;S.tab=t;render();
  document.querySelectorAll('button,a').forEach(el=>{const name=(el.getAttribute('aria-label')||el.textContent||'').trim(); if(!name) bad.push(t+':'+(el.className||el.tagName))})} return [...new Set(bad)].slice(0,10)}));
// P3-6 확인 창: 평가가 있는 끼니를 안 먹음/다른 메뉴로
p=await mk();
await p.goto('file://'+WRAP('app.html')); await p.waitForTimeout(300);
await p.evaluate(()=>{S.consent={date:today(),ai:false};S.plan=null;render(); const d=S.plan.days[0]; S.ratings=[{date:d.date,slot:"아침",title:d.meals[0].title,foodId:d.meals[0].items[0][0],rating:"good"}]; render()});
await p.click('[data-act=skipToggleDate][data-slot="아침"]'); await p.waitForTimeout(200);
out('6 skip confirm', await p.evaluate(()=>[document.querySelector('#sheetRoot').textContent.includes('안 먹은 끼니로'), S.ratings.length]));
await p.evaluate(()=>closeSheet());
await p.click('[data-act=swapMeal][data-k="0"]'); await p.waitForTimeout(200);
out('6b swap confirm', await p.evaluate(()=>[document.querySelector('#sheetRoot').textContent.includes('다른 메뉴로'), S.ratings.length]));
await p.click('#sheetRoot [data-act=swapMeal]'); await p.waitForTimeout(300);
out('6c swapped', await p.evaluate(()=>[S.ratings.length, isAte(today(),"아침")]));
// P3-7 컵 용량 환산
await p.evaluate(()=>{S.tab="nutri";S.water[today()]=5;S.cupMl=200;render()});
await p.selectOption('#cupMl','500'); await p.waitForTimeout(200);
out('7 cup convert', await p.evaluate(()=>[S.water[today()], S.water[today()]*S.cupMl]));
// P3-8 1년치 데이터 렌더 성능
out('8 perf', await p.evaluate(()=>{for(let i=0;i<365;i++){const d=addDays(today(),-i);S.logs[d]={date:d,...BLANK_LOG(),day:(i%5)+1};S.ate[d]=["아침","점심"];S.ateMeals[d]={"아침":{t:"흰죽",it:[["rice_porridge",250]]}};S.extras[d]=[{name:"바나나",amt:50,kcal:45,p:.5,fi:1.3,ca:3}]}
  const t=[];for(const tab of ["plan","log","nutri"]){const t0=performance.now();S.tab=tab;SCR=null;render();t.push(Math.round(performance.now()-t0))}
  const t0=performance.now(); foodSuspects(); const t1=performance.now(); return [t, Math.round(t1-t0), JSON.stringify(S).length]}));
console.log('errors',errs);await b.close()})();
