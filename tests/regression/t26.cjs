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
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('t26.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t26.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today()};render()});
// 1. 먹었습니다 → 메뉴 스냅샷 저장
await p.click('[data-act=ateToggle][data-k="0"]'); await p.waitForTimeout(250);
console.log('1 snapshot', await p.evaluate(()=>JSON.stringify(S.ateMeals).slice(0,120)));
// 2. 계획이 바뀌어도 먹은 기록은 스냅샷으로 남는가
console.log('2 after replan', await p.evaluate(()=>{S.plan=null;render();const m=ateMenu(today(),"아침");return [m?.t, ateItems(today(),"아침").length]}));
// 3. 스왑하면 먹은 기록·평가 정리
// v1.9.0 U-3: 따로 남기던 안내 표시(SWAP_CLEARED)가 없어지고, '다른 메뉴' 버튼의 알림이 지운 사실과 '되돌리기'를 함께 보인다
await p.evaluate(()=>{S.tab="plan";SCR=null;S.selDay=0;S.ratings=[{date:today(),slot:"점심",title:"x",foodId:"white_rice",rating:"good"}];setAte(today(),"점심",true);render()});
const t3=await p.evaluate(()=>curDay().meals[1].title);
await p.click('[data-act=mealMore][data-k="1"]'); await p.click('#sheetRoot [data-act=swapMeal][data-k="1"]'); await p.waitForTimeout(250);
console.log('3 swap clears', await p.evaluate(t3=>[curDay().meals[1].title!==t3, isAte(today(),"점심"), S.ratings.length, document.querySelector('#toasts .t-msg')?.textContent||'', document.querySelector('#toasts .t-act')?.textContent||''],t3));
await p.click('#toasts .t-act'); await p.waitForTimeout(250);
console.log('3b swap undo', await p.evaluate(t3=>[curDay().meals[1].title===t3, isAte(today(),"점심"), S.ratings.length],t3));
console.log('3c swap direct', await p.evaluate(()=>{const ok=swapMeal(0,1); return [ok, isAte(today(),"점심"), S.ratings.length]}));
// 4. 저장 실패 배너
console.log('4 storage banner', await p.evaluate(()=>{const o=localStorage.setItem.bind(localStorage);localStorage.setItem=()=>{throw new Error('q')};S.nudgeHide='x'+Date.now();save();
  const out={};for(const t of ["plan","log"]){S.tab=t;SCR=null;render();out[t]=document.querySelector('#main').textContent.includes('저장되지 않고')}
  localStorage.setItem=o;save();render();return out}));
// 5. 예전에 AI로 만든 부분 식단(v1.7.0): 그대로 두고 안내만 하며, 버튼으로 앱 규칙 식단으로 바꿈
console.log('5 old partial', await p.evaluate(()=>{const st=today(); const meal=sl=>({slot:sl,title:"흰죽",rec:["r_juk"],items:[["rice_porridge",300],["egg_steamed",120]],tip:"t",refs:[1]});
  S.plan={start:st,stage:1,sample:false,partial:true,days:[0,1,2].map(i=>({date:addDays(st,i),meals:["아침","점심","저녁"].map(meal)}))}; S.tab="plan";SCR=null;render();
  const t=document.querySelector('#main').textContent; return [S.plan.sample, S.plan.days.length, t.includes('3일까지만'), !!document.querySelector('[data-act=toSample]'), t.includes('이어 만들기')]}));
await p.click('[data-act=toSample]'); await p.waitForTimeout(200);
console.log('5b toSample', await p.evaluate(()=>[S.plan.sample, S.plan.days.length, !!S.plan.partial]));
// 6. 백업 버전
console.log('6 backup ver', await p.evaluate(()=>{const j=JSON.parse(backupJSON());return [j.app,j.v,!!j.exportedAt]}));
console.log('6b newer rejected', await p.evaluate(()=>{try{normalizeState({...JSON.parse(backupJSON()),v:99});return 'accepted'}catch(e){return e.message}}));
// 7. 지난 날 화면 끼니 토글
await p.evaluate(()=>{S.tab="log";SCR=null;S.logs[addDays(today(),-1)]={date:addDays(today(),-1),...BLANK_LOG(),day:3};render()});
await p.click('[data-act=pastDay]'); await p.waitForTimeout(300);
console.log('7 past screen', await p.evaluate(()=>[SCR.name,SCR.date,[...document.querySelectorAll('[data-act=ateToggleDate]')].length,[...document.querySelectorAll('[data-act=skipToggleDate]')].length]));
await p.click('[data-act=ateToggleDate]'); await p.waitForTimeout(200);
console.log('7b past ate', await p.evaluate(()=>[JSON.stringify(S.ate),JSON.stringify(S.ateMeals).slice(0,80)]));
// 8. 기록 목록 → 지난 날
console.log('8 hist route', await p.evaluate(()=>{closeScr();S.tab="log";render();return [...document.querySelectorAll('.hrow')].map(e=>e.dataset.act).slice(0,2)}));
// 9. 컵 용량
await p.evaluate(()=>{S.tab="plan";SCR=null;openScr("nutri")});
await p.selectOption('#cupMl','500'); await p.waitForTimeout(200);
console.log('9 cup', await p.evaluate(()=>[S.cupMl, document.querySelector('.cups').children.length, document.querySelector('#main').textContent.includes('500ml')]));
// 10. 평가 있는 끼니 해제 시 확인
// v1.9.0 U-3: 확인 창(ateClearGo) 대신 바로 지우고, 알림에 평가도 지웠다는 것과 '되돌리기'를 보인다
await p.evaluate(()=>{S.tab="plan";SCR=null;S.ratings=[{date:today(),slot:"저녁",title:"x",foodId:"white_rice",rating:"good"}];render()});
await p.click('[data-act=ateToggle][data-k="2"]'); await p.waitForTimeout(200);
console.log('10 confirm', await p.evaluate(()=>[!document.querySelector('#sheetRoot').firstChild, S.ratings.length, isAte(today(),"저녁"), document.querySelector('#toasts .t-msg')?.textContent||'', document.querySelector('#toasts .t-act')?.textContent||'']));
await p.click('#toasts .t-act'); await p.waitForTimeout(200);
console.log('10a undone', await p.evaluate(()=>[S.ratings.length, isAte(today(),"저녁")]));
await p.click('[data-act=ateToggle][data-k="2"]'); await p.waitForTimeout(200);
console.log('10b cleared', await p.evaluate(()=>[S.ratings.length, isAte(today(),"저녁")]));
// 11. 검사 설명 시트
console.log('11 checkInfo', await p.evaluate(()=>{const el=document.querySelector('[data-act=checkInfo]');return !!el}));
// 12. 상태 알약 아이콘
console.log('12 pill shape', await p.evaluate(()=>{S.tab="food";S.foodSub="search";render();const e=document.querySelector('.pill.ok');return getComputedStyle(e,'::before').width}));
console.log('errors',errs);expect(()=>/"아침"/.test(logOf('1 snapshot')),'먹은 끼니 저장'); expect(()=>jsonOf('2 after replan')[1]>0,'식단이 바뀌어도 먹은 기록 유지');
expect(()=>{const b=jsonOf('4 storage banner'); return b.plan&&b.log},'저장 실패 안내'); expect(()=>jsonOf('6 backup ver')[0]==='uc-table','백업 형식');
expect(()=>logOf('6b newer rejected')==='newer backup','새 버전 백업 거부');
// v1.9.0 U-3: 메뉴를 바꾸거나 먹음을 지우면 바로 반영(평가도 지움)하고, 알림의 '되돌리기'로 그대로 돌아온다
expect(()=>{const a=jsonOf('3 swap clears'); return a[0]===true&&a[1]===false&&a[2]===0&&/평가는 지웠습니다/.test(a[3])&&a[4]==='되돌리기'},'다른 메뉴로 바꾸면 먹은 기록·평가 정리 + 되돌리기 알림');
expect(()=>{const a=jsonOf('3b swap undo'); return a[0]===true&&a[1]===true&&a[2]===1},'다른 메뉴 되돌리기로 메뉴·먹음·평가 복원');
expect(()=>{const a=jsonOf('3c swap direct'); return a[0]===true&&a[1]===false&&a[2]===0},'메뉴 교체 함수도 먹은 기록·평가 정리');
expect(()=>{const a=jsonOf('10 confirm'); return a[0]===true&&a[1]===0&&a[2]===false&&/평가를 지웠습니다/.test(a[3])&&a[4]==='되돌리기'},'평가 있는 끼니 먹음 해제: 확인 창 없이 지우고 되돌리기 알림');
expect(()=>{const a=jsonOf('10a undone'); return a[0]===1&&a[1]===true},'먹음 해제 되돌리기로 평가 복원');
expect(()=>{const a=jsonOf('10b cleared'); return a[0]===0&&a[1]===false},'먹음 해제');
expect(()=>{const a=jsonOf('5 old partial'); return a[0]===false&&a[1]===3&&a[2]&&a[3]&&!a[4]},'예전 AI 부분 식단 안내'); expect(()=>{const a=jsonOf('5b toSample'); return a[0]===true&&a[1]===7&&!a[2]},'앱 규칙 식단으로 바꾸기'); expect(()=>jsonOf('7 past screen')[0]==='past','지난 날');
__done(); await b.close()})();
