// 공통 안전장치: 어느 페이지에서든 잡히지 않은 오류(pageerror)가 나면 이 점검을 실패로 끝낸다
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}
// 설치형 앱(PWA) 갱신 점검: 서비스 워커로 설치된 뒤 앱이 바뀌면 새 버전이 실제로 전달되는지,
// 그리고 오프라인에서도 새 버전이 열리는지 확인한다. (캐시 이름이 고정되면 옛 화면에 머무는 문제 방지)
const path=require('path'), fs=require('fs'), http=require('http');
const ROOT=path.join(__dirname,'..','..');
const PUB=path.join(ROOT,'public');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const DIR=path.join(TMP,'pwa_site'); fs.rmSync(DIR,{recursive:true,force:true}); fs.mkdirSync(DIR,{recursive:true});
for(const f of fs.readdirSync(PUB)) fs.copyFileSync(path.join(PUB,f),path.join(DIR,f));
const { chromium } = require('playwright');
const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript",".webmanifest":"application/manifest+json",".png":"image/png"};
// GitHub Pages처럼 10분 캐시 헤더를 붙여, HTTP 캐시에 옛 파일이 남는 상황까지 재현
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split("?")[0]); if(u.endsWith("/")) u+="index.html";
  const f=path.join(DIR,u); if(!f.startsWith(DIR)||!fs.existsSync(f)){r.writeHead(404);return r.end()}
  r.writeHead(200,{"Content-Type":TYPES[path.extname(f)]||"application/octet-stream","Cache-Control":"max-age=600"}); r.end(fs.readFileSync(f))});
(async()=>{
  // 빌드 규칙: 캐시 이름은 index.html 내용의 해시여야 한다(앱이 바뀌면 sw.js도 바뀌어 갱신이 일어남)
  const h=require('crypto').createHash('sha256').update(fs.readFileSync(path.join(PUB,'index.html'))).digest('hex').slice(0,10);
  const swSrc=fs.readFileSync(path.join(PUB,'sw.js'),'utf8');
  if(!swSrc.includes(`const CACHE="uc-table-${h}";`)){ console.log('FAIL 캐시 이름이 index.html 해시와 다름'); process.exit(1) }
  if(!swSrc.includes('cache:"reload"')){ console.log('FAIL 설치 때 HTTP 캐시를 건너뛰지 않음'); process.exit(1) }
  await new Promise(res=>srv.listen(0,"127.0.0.1",res)); const url=`http://127.0.0.1:${srv.address().port}/`;
  const b=await chromium.launch(); const ctx=await b.newContext(); const p=await ctx.newPage(); const fails=[];
  const marker=()=>p.evaluate(()=>document.documentElement.innerHTML.includes("<!--build-v2-->"));
  const controlled=()=>p.evaluate(()=>!!navigator.serviceWorker.controller);
  await p.goto(url); await p.waitForTimeout(1500); await p.reload(); await p.waitForTimeout(800);
  if(!await controlled()) fails.push("첫 설치 뒤 서비스 워커가 페이지를 관리하지 않음");
  // 새 빌드 배포: index.html 내용이 바뀌고, 빌드 스크립트처럼 sw.js의 캐시 이름도 바뀐다
  fs.writeFileSync(path.join(DIR,"index.html"),fs.readFileSync(path.join(DIR,"index.html"),"utf8").replace("</body>","<!--build-v2--></body>"));
  const sw=fs.readFileSync(path.join(DIR,"sw.js"),"utf8"); const sw2=sw.replace(/const CACHE="uc-table-[^"]+";/,'const CACHE="uc-table-testv2";');
  if(sw===sw2) fails.push("sw.js에서 캐시 이름을 찾지 못함"); fs.writeFileSync(path.join(DIR,"sw.js"),sw2);
  let got=false; for(let i=0;i<4&&!got;i++){ await p.reload(); await p.waitForTimeout(1200); got=await marker() }
  if(!got) fails.push("새 버전을 배포해도 설치된 앱이 옛 화면에 머묾");
  const caches=await p.evaluate(async()=>(await caches.keys()).filter(k=>k.startsWith("uc-table-")));
  if(caches.length!==1||caches[0]!=="uc-table-testv2") fails.push("옛 캐시가 남음 "+caches.join(","));
  await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(800);
  if(!await marker()) fails.push("오프라인에서 새 버전이 열리지 않음");
  const foods=await p.evaluate(()=>typeof FOODS!=="undefined"?FOODS.length:0); if(foods<400) fails.push("오프라인 실행 실패 foods="+foods);
  console.log(JSON.stringify({got,caches,foods})); console.log(fails.length?"FAIL "+fails.join(" / "):"OK");
  await b.close(); srv.close(); process.exit(fails.length?1:0);
})();
