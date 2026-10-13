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
const { chromium } = require('playwright');

// 검증용: 출력한 줄을 모아 두고 끝에서 기대값과 비교한다(v1.5.0)
const __LOG=[]; {const __o=console.log; console.log=(...a)=>{__LOG.push(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ')); __o(...a)}}
const logOf=k=>{const l=__LOG.find(x=>x===k||x.startsWith(k+' ')); return l==null?null:l.slice(k.length).trim()};
const jsonOf=k=>{const v=logOf(k); if(v==null) return null; try{return JSON.parse(v)}catch(e){return v}};
const lineJSON=pre=>{const l=__LOG.find(x=>x.startsWith(pre)); if(l==null) return null; try{return JSON.parse(l)}catch(e){return null}};
const FAILS=[]; const expect=(c,m)=>{let ok=false; try{ok=typeof c==='function'?!!c():!!c}catch(e){m+=' ('+e.message+')'} if(!ok) FAILS.push(m)};
const __done=()=>{ if(FAILS.length){ console.error('FAIL\n'+FAILS.join('\n')); process.exitCode=1 } else console.log('검증 통과') };
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
const fs=require('fs'); const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('t6.html'),'<!doctype html><html><head><meta charset="utf-8"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t6.html'));await p.waitForTimeout(600);await p.evaluate(()=>{S.consent={date:today()};render()});
await p.evaluate(()=>{S.orders.checked=['lowfat'];S.profile.sex='F';S.profile.age='30';render()});
await p.click('.tab[data-tab=food]'); await p.click('[data-act=foodSub][data-v=label]');
// v1.7.0: 사진 판독 대신 원재료명과 영양정보 표를 옮겨 적는다
await p.click('[data-act=lbCheck]'); await p.waitForTimeout(150);
console.log('empty', await p.evaluate(()=>[LB.step, LB.err]));
// 기준량 없이 값만 적으면 말없이 버리지 않고 안내(v1.7.0)
await p.evaluate(()=>{document.querySelector('#labelCard details').open=true}); await p.fill('#lbn_kcal','170'); await p.click('[data-act=lbCheck]'); await p.waitForTimeout(150);
console.log('half', await p.evaluate(()=>[LB.step, LB.err===LB_HALF, document.querySelector('#lbn_kcal')?.value, document.querySelector('#labelCard details').open]));
await p.fill('#lbName','초코 단백질 바');
await p.fill('#lbText','귀리, 치커리뿌리섬유(이눌린), 말티톨, 팜유, 대두단백\n대두, 우유 함유');
await p.evaluate(()=>{document.querySelector('#labelCard details').open=true});
for(const [k,v] of [['basisAmt','40'],['kcal','170'],['protein','10'],['fat','7'],['trans','0'],['sugar','3'],['fiber','5'],['sodium','95']]) await p.fill('#lbn_'+k,v);
await p.click('[data-act=lbCheck]'); await p.waitForTimeout(300);
console.log(await p.evaluate(()=>JSON.stringify({n:LB.nutri&&LB.nutri.basisAmt,eat:LB.eat,c:lbCombine()})));
await p.fill('#lbEat','20'); await p.click('[data-act=lbRecheck]');
console.log(await p.evaluate(()=>JSON.stringify(LB.nres.rows.filter(r=>r.title==='식이섬유'))));
await p.click('[data-act=lbRate][data-v=bad]'); await p.waitForTimeout(400); await p.screenshot({path:T('lb6a.png'),fullPage:true}); await p.click('[data-act=lbEaten]'); await p.waitForTimeout(150); await p.click('[data-act=badSym][data-v=pain]'); await p.click('[data-act=badSave]');
console.log(await p.evaluate(()=>JSON.stringify({x:S.extras[today()],t:S.triggers,r:S.ratings.slice(-1)})));
await p.click('.tab[data-tab=food]'); await p.waitForTimeout(400); await p.screenshot({path:T('lb6.png'),fullPage:true}); await p.evaluate(()=>openScr('nutri')); await p.waitForTimeout(400); await p.screenshot({path:T('n6.png')});
console.log('errors',errs); {const em=jsonOf('empty'); expect(()=>em[0]==='idle'&&/옮겨 적거나/.test(em[1]),'빈 입력 안내'); expect(()=>{const h=jsonOf('half'); return h[0]==='idle'&&h[1]===true&&h[2]==='170'&&h[3]===true},'기준량 없는 영양정보 안내·입력 유지');
 const r=lineJSON('{"n":'); expect(()=>r.n===40&&r.c.overall==='caution','옮겨 적은 표 판정');
 expect(()=>r.c.rows.some(x=>x.title==='당알코올(폴리올)')&&r.c.rows.some(x=>x.title.startsWith('프럭탄')),'원재료 점검');
 const fib=lineJSON('[{"lv":"caution","title":"식이섬유"'); expect(()=>fib[0].found[0]==='먹을 양 기준 2.5g','섬유 계산');
 const s=lineJSON('{"x":'); expect(()=>s.x[0].amt===20&&s.t.some(t=>t.name==='초코 단백질 바'&&t.sym.includes('pain'))&&s.r[0].rating==='bad','평가 저장');}
__done(); await b.close()})();
