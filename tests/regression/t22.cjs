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
fs.writeFileSync(T('t22.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t22.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today()};render()});
console.log('serv', await p.evaluate(()=>[["white_rice",210],["white_rice",105],["rice_porridge",300],["banana",50],["egg_boiled",50],["zucchini",35],["olive_oil",5],["milk",200],["nuts",12],["white_rice",7]].map(([id,g])=>[id,g,servLabel(id,g)])));
console.log('search', await p.evaluate(()=>["계란","흰죽","계란찜","ㄴㄹㅈ","ㄱㄹㅉ","우유","밥","고기","떡"].map(q=>[q,FOODS.filter(f=>nameHit(f,q)).map(f=>f.id).slice(0,4)])));
console.log('guess', await p.evaluate(()=>[guessFoodId("우유"),guessFoodId("바나나맛 우유"),guessFoodId("계란찜"),guessFoodId("떡볶이")]));
console.log('swap', await p.evaluate(()=>{const before=S.plan.days[0].meals[1].title; const ok=swapMeal(0,1); return [before,ok,S.plan.days[0].meals[1].title,S.plan.days[0].meals[1].rec]}));
console.log('skip', await p.evaluate(()=>{toggleSkip(today(),"아침");const a=isSkipped(today(),"아침");toggleSkip(today(),"아침");return [a,isSkipped(today(),"아침")]}));
console.log('stool steps', await p.evaluate(()=>WSTEPS.map(s=>s.k)));
console.log('suspects', await p.evaluate(()=>{
  for(let i=0;i<6;i++){const d=addDays(today(),-i);S.logs[d]={date:d,...BLANK_LOG(),day:i%2?6:2,bloody:i%2?2:0};
    S.extras[d]=[{name:"우유",amt:200,unit:"g",kcal:120,p:6,fi:0,ca:200}]; if(i%2) S.extras[d].push({name:"라면",amt:100,kcal:400,p:8,fi:2,ca:10})}
  return foodSuspects()}));
console.log('recent', await p.evaluate(()=>recentFoods()));
console.log('errors',errs);expect(()=>{const s=jsonOf('serv'); return s[0][2]==='1공기'&&s[1][2]==='반 공기'&&s[3][2]==='반 개'},'1회 분량 말');
expect(()=>{const s=Object.fromEntries(jsonOf('search')); return s['계란'].length&&s['흰죽'].length&&s['ㄴㄹㅈ'].length},'검색');
expect(()=>{const g=jsonOf('guess'); return g[0]&&g[2]},'이름으로 음식 찾기'); expect(()=>{const w=jsonOf('swap'); return w[1]===true&&w[0]!==w[2]},'다른 메뉴');
expect(()=>{const k=jsonOf('skip'); return k[0]===true&&k[1]===false},'안 먹음 표시');
__done(); await b.close()})();
