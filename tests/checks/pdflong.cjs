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
// PDF 긴 메모·빈 프로필·주의 음식 표 확인용
const { chromium } = require('playwright'); const fs=require('fs');

// 검증용: 출력한 줄을 모아 두고 끝에서 기대값과 비교한다(v1.5.0)
const __LOG=[]; {const __o=console.log; console.log=(...a)=>{__LOG.push(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ')); __o(...a)}}
const logOf=k=>{const l=__LOG.find(x=>x===k||x.startsWith(k+' ')); return l==null?null:l.slice(k.length).trim()};
const jsonOf=k=>{const v=logOf(k); if(v==null) return null; try{return JSON.parse(v)}catch(e){return v}};
const lineJSON=pre=>{const l=__LOG.find(x=>x.startsWith(pre)); if(l==null) return null; try{return JSON.parse(l)}catch(e){return null}};
const FAILS=[]; const expect=(c,m)=>{let ok=false; try{ok=typeof c==='function'?!!c():!!c}catch(e){m+=' ('+e.message+')'} if(!ok) FAILS.push(m)};
const __done=()=>{ if(FAILS.length){ console.error('FAIL\n'+FAILS.join('\n')); process.exitCode=1 } else console.log('검증 통과') };
const body=fs.readFileSync(APP,'utf8');
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style>
<script>window.claude={use:async n=>{ if(n==="downloads") return {save:async({filename,data})=>{window.__saved={filename,size:data.size}; const buf=await data.arrayBuffer(); window.__pdf=Array.from(new Uint8Array(buf));return {status:"saved"}}}; return null}};</script>
</head><body>${body}</body></html>`;
fs.writeFileSync(T('pdflong.html'),html);
const OUT=process.argv[2]||T('long.pdf');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.route('https://cdnjs.cloudflare.com/**', r=>{const u=r.request().url(); const f=u.includes('html2canvas')?LIB_H2C:LIB_JSPDF; r.fulfill({path:f,contentType:'application/javascript'})});
await p.route(/fonts\.g/, r=>r.fulfill({body:'',contentType:'text/css'}));
await p.goto('file://'+WRAP('pdflong.html'));await p.waitForTimeout(1200);
await p.evaluate(()=>{S.consent={date:today()};
  const long="아침에 배가 살살 아프고 화장실을 여러 번 갔습니다. 점심 이후에는 조금 나아졌지만 저녁에 다시 가스가 차서 불편했습니다. 물은 여섯 컵 정도 마셨고 잠은 잘 못 잤습니다. 내일 병원 가기 전에 체온을 한 번 더 재 볼 예정입니다.";
  for(let i=0;i<14;i++){const d=addDays(today(),-i);S.logs[d]={date:d,day:3+(i%4),night:i%2,bloody:i%3,urg:i%4,blood:i%4,well:i%3,extra:["관절통"],pain:(i*3)%11,gas:"약간",fatigue:"심함",temp:i%2?"37.9":"",pulse:i%2?"104":"",other:["두통","어지러움"],memo:long+(i%2?long:""),stool:(i%7)+1,medtaken:(i%5)}}
  S.triggers=[{name:"흰살생선(대구·가자미 등)",foodId:"white_fish",date:today(),source:"식단 평가",sym:["diarrhea","gas"],never:false},{name:"우유",foodId:"milk",date:addDays(today(),-3),source:"직접",sym:["gas"],never:true}];
  S.reportDays=14; SCR=null; S.tab="log"; render()});
await p.click('[data-act=openScr][data-v=pdf]'); await p.click('[data-act=pdf]');
await p.waitForFunction(()=>window.__pdf,null,{timeout:30000});
const arr=await p.evaluate(()=>window.__pdf); fs.writeFileSync(OUT,Buffer.from(arr));
console.log('saved',await p.evaluate(()=>JSON.stringify(window.__saved)),'errors',errs);
expect(()=>{const s=JSON.parse(__LOG.find(x=>x.startsWith('saved')).match(/\{.*?\}/)[0]); return s.size>100000&&/^진료기록_/.test(s.filename)},'긴 PDF 저장');
__done(); await b.close();})();
