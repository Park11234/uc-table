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
(async()=>{const b=await chromium.launch();const p=await b.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
const body=fs.readFileSync(APP,'utf8');
fs.writeFileSync(T('t9.html'),'<!doctype html><html><head><meta charset="utf-8"></head><body>'+body+'</body></html>');
await p.goto('file://'+WRAP('t9.html'));await p.waitForTimeout(400);await p.evaluate(()=>{S.consent={date:today()};render()});
const r=await p.evaluate(()=>{
 S.profile.allergies=['shrimp','buckwheat']; S.stageMode=1; S.weights=[{date:today(),kg:58}];
 const N=(o)=>({basis:"",basisUnit:"g",totalAmt:null,carb:null,sugar:null,polyol:null,fiber:null,protein:null,fat:null,sat:null,trans:null,sodium:null,calcium:null,kcal:null,...o});
 const cases=[
  ["치즈닭갈비볶음밥 삼각김밥","밥, 닭고기, 모짜렐라치즈, 고추장, 간장(대두, 밀)", N({basisAmt:163,kcal:281,trans:0}),163],
  ["닭강정 반반","닭고기, 밀가루, 대두유, 물엿, 고추장", N({basisAmt:431,kcal:1412}),150],
  ["도시락(돼지불고기)","쌀, 돼지고기, 간장, 설탕. 이 제품은 메밀, 대두, 복숭아, 호두, 오징어, 조개류(굴,전복,홍합 포함), 새우, 잣을 사용한 제품과 같은 제조시설에서 제조하고 있습니다.", N({basisAmt:400,kcal:680,fat:19,sat:2.4,trans:0,sodium:1171,protein:14}),400],
  ["로스트 햄 슬라이스","돼지고기, 정제소금, 아질산나트륨, 대두단백", N({basisAmt:80,kcal:180,sodium:650,sugar:3.5,fat:12,sat:4.2,trans:0.1,protein:14}),80],
  ["저당 아이스바","정제수, 에리스리톨, 알룰로스, 야자유, 유청분말", N({basisAmt:90,basisUnit:"ml",kcal:150,sodium:16,sugar:2,polyol:16.1,fat:12,sat:10,trans:0.1,protein:2.7}),90],
  ["스크램블&소시지 샌드위치","밀가루, 스크램블드에그(전란액), 소시지(돼지고기)", N({basisAmt:170,kcal:518,sodium:990,sugar:11,fat:34,sat:7,trans:0.2,protein:18}),170],
  ["떡볶이 밀키트","쌀떡, 고추장, 어묵. 우유, 대두, 돼지고기, 밀, 쇠고기, 오징어, 게, 새우, 조개류(홍합, 바지락, 굴) 함유", N({basisAmt:100}),100],
 ];
 return cases.map(([nm,txt,n,eat])=>{const L=labelCheck(txt,nm);const NN=nutriCheck(n,eat);return {nm,overall:L.overall,rows:L.rows.map(x=>`${x.lv}:${x.title}=${x.found.join("/")}`),nut:NN.rows.map(x=>`${x.lv}:${x.title}=${x.found.join("/")}`)}});
});
for(const c of r) console.log(JSON.stringify(c));
console.log(errs); {const R=__LOG.filter(x=>x.startsWith('{"nm"')).map(x=>JSON.parse(x)); const o=Object.fromEntries(R.map(r=>[r.nm,r.overall]));
 // v1.9.0: 원재료명에 아질산나트륨이 있는 제품은 '절대 금지'(ban)
expect(o['치즈닭갈비볶음밥 삼각김밥']==='avoid'&&o['닭강정 반반']==='avoid'&&o['도시락(돼지불고기)']==='caution'&&o['로스트 햄 슬라이스']==='ban'&&o['저당 아이스바']==='caution'&&o['떡볶이 밀키트']==='avoid','제품 판정 '+JSON.stringify(o));
 expect(()=>R.find(r=>r.nm==='도시락(돼지불고기)').rows.some(x=>/같은 제조시설/.test(x)),'혼입 안내');
 expect(()=>R.find(r=>r.nm==='저당 아이스바').nut.some(x=>/당알코올/.test(x)),'당알코올 표시');
 expect(()=>R.find(r=>r.nm==='떡볶이 밀키트').rows.some(x=>/내 알레르기 원재료=새우/.test(x)),'새우 알레르기');}
__done(); await b.close()})();
