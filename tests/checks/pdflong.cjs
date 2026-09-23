const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const WRAP=n=>{const p=T(n); if(!fs_.existsSync(p)) fs_.writeFileSync(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
// PDF 긴 메모·빈 프로필·주의 음식 표 확인용
const { chromium } = require('playwright'); const fs=require('fs');
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
await p.evaluate(()=>{S.consent={date:today(),ai:false};
  const long="아침에 배가 살살 아프고 화장실을 여러 번 갔어요. 점심 이후에는 조금 나아졌지만 저녁에 다시 가스가 차서 불편했어요. 물은 여섯 컵 정도 마셨고 잠은 잘 못 잤어요. 내일 병원 가기 전에 체온을 한 번 더 재 볼 예정이에요.";
  for(let i=0;i<14;i++){const d=addDays(today(),-i);S.logs[d]={date:d,day:3+(i%4),night:i%2,bloody:i%3,urg:i%4,blood:i%4,well:i%3,extra:["관절통"],pain:(i*3)%11,gas:"약간",fatigue:"심함",temp:i%2?"37.9":"",pulse:i%2?"104":"",other:["두통","어지러움"],memo:long+(i%2?long:""),stool:(i%7)+1,medtaken:(i%5)}}
  S.triggers=[{name:"흰살생선(대구·가자미 등)",foodId:"white_fish",date:today(),source:"식단 평가",sym:["diarrhea","gas"],never:false},{name:"우유",foodId:"milk",date:addDays(today(),-3),source:"직접",sym:["gas"],never:true}];
  S.reportDays=14; SCR=null; S.tab="log"; render()});
await p.click('[data-act=openScr][data-v=pdf]'); await p.click('[data-act=pdf]');
await p.waitForFunction(()=>window.__pdf,null,{timeout:30000});
const arr=await p.evaluate(()=>window.__pdf); fs.writeFileSync(OUT,Buffer.from(arr));
console.log('saved',await p.evaluate(()=>JSON.stringify(window.__saved)),'errors',errs);
await b.close();})();
