const path=require('path'), fs_=require('fs'), http=require('http');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}

/* 개선점 10개 반영(2026-10-24): 점수 밖 기준으로 활동기일 때 홈 문구(1), 온보딩의 평소 배변 횟수(2)·면역 약(3),
   식단 단계 화면의 ECCO 섬유 단서(5), PBKDF2 60만 회·상한(6), PWA의 CSP(7), 가져오기 값 범위(10) */
const { chromium } = require('playwright'); const fs=require('fs'); const crypto=require('crypto');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const BODY=fs.readFileSync(APP,'utf8');
const page=T('v1121.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+BODY+'</body></html>');
const SEED=()=>{ S.consent={date:today()}; S.onb="done"; S.stageMode="auto"; save(); };
(async()=>{
  const b=await chromium.launch();
  const open=async(opt={})=>{const ctx=await b.newContext({viewport:{width:opt.w||390,height:opt.h||844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    const ready=()=>p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.goto('file://'+page); await ready(); if(!opt.fresh){await p.evaluate(SEED); await p.reload(); await ready()} await p.waitForTimeout(150); return p};

  console.log('== 1 → 22차: 점수 밖 기준(보조 합산·위험 신호)도 식단 단계에는 그대로 쓰고, 화면에는 까닭·활동기라는 말을 하지 않음');
  {const p=await open();
    const r=await p.evaluate(()=>{const d=today(); const out={}; const T=()=>document.querySelector('#main').innerText;
      S.logs[d]={...BLANK_LOG(),day:1,night:0,urg:2,well:3,blood:0}; save(); const a=activity(S.logs[d]);   /* v1.13.0 2번: 평소 1회 기준이라 점수 0점은 하루 1회 */ out.a={stage:a.stage,sc:a.sc};
      SCR=null; S.tab="plan"; render(); out.home=T();
      S.logs[d]={...BLANK_LOG(),day:1,night:0,temp:"37.6"}; save(); const c2=activity(S.logs[d]); out.c={stage:c2.stage};
      SCR=null; render(); out.homeC=T();
      S.logs[d]={...BLANK_LOG(),day:1,night:0,urg:2,well:3}; save(); SCR={name:"past",date:d}; render(); out.past=T();
      return out});
    need(r.a.stage===1&&r.a.sc===0,`점수 0점·보조 점수 5점 → 가장 부드러운 단계 (${JSON.stringify(r.a)})`);
    need(r.c.stage===1,`체온 37.6℃ → 가장 부드러운 단계 (${JSON.stringify(r.c)})`);
    for(const [k,t] of [["홈(보조 기준)",r.home],["홈(체온)",r.homeC],["지난 기록",r.past]]) need(!/보조 기준|위험 신호|활동기|점수/.test(t),`${k}: 까닭·활동기·점수를 말하지 않음 (${(t.match(/.{0,20}(보조 기준|위험 신호|활동기|점수).{0,20}/)||[""])[0]})`);
    await p.context().close()}

  console.log('== 2·3 첫 실행 설정: 평소 배변 횟수와 면역 약');
  {const p=await open({fresh:true});
    await p.click('#c_req'); await p.click('#consentGo'); await p.click('[data-act="onbGo"][data-v="1"]');
    const s1=await p.evaluate(()=>document.querySelector('#main').innerText);
    need(/평소 하루 배변 횟수/.test(s1)&&!!(await p.$('#o_usualBM')),'1단계에 평소 하루 배변 횟수 입력칸');
    await p.fill('#o_usualBM','1'); await p.click('[data-act="onbNext"][data-v="2"]');
    const u=await p.evaluate(()=>({raw:S.profile.usualBM,fn:usualBM()}));
    need(u.raw==="1"&&u.fn===1,`입력한 평소 횟수가 저장·판정에 쓰임 (${JSON.stringify(u)})`);
    const s2=await p.evaluate(()=>document.querySelector('#main').innerText);
    need(/알레르기·유당·약/.test(s2)&&/면역을 누르는 약/.test(s2),'2단계에 면역을 누르는 약 칩');
    const chips=await p.evaluate(()=>[...document.querySelectorAll('[data-act="onbMedT"]')].map(e=>e.dataset.v));
    need(JSON.stringify(chips)==='["steroid","immuno","bio","jak"]',`칩은 면역 약 4가지 (${chips})`);
    await p.click('[data-act="onbMedT"][data-v="steroid"]');
    const m1=await p.evaluate(()=>({meds:S.profile.meds.slice(),pressed:document.querySelector('[data-act="onbMedT"][data-v="steroid"]').getAttribute('aria-pressed')}));
    need(m1.meds.join()==="steroid"&&m1.pressed==="true",`칩을 누르면 복용 약에 들어가고 눌린 표시 (${JSON.stringify(m1)})`);
    await p.click('[data-act="onbMedT"][data-v="steroid"]');
    need((await p.evaluate(()=>S.profile.meds.length))===0,'한 번 더 누르면 빠짐');
    await p.click('[data-act="onbMedT"][data-v="jak"]'); await p.click('[data-act="onbNext"][data-v="3"]'); await p.click('[data-act="onbInit"][data-v="3"]'); await p.click('[data-act="onbDone"][data-v=""]'); await p.waitForTimeout(300);
    const f=await p.evaluate(()=>{const q=n=>ruleCheck({name:n,ingr:[],cook:""}).level; const imm=ctx().immunoMeds; S.profile.meds=[]; const none=["생굴","연어 사시미"].map(q); S.profile.meds=["jak"]; const on=["생굴","연어 사시미"].map(q); return {imm,none,on,onb:S.onb}});
    need(f.onb==="done"&&/JAK/.test(f.imm),`설정을 마치면 면역 약이 판정 맥락에 들어감 (${f.imm})`);
    need(f.none.every(x=>x!=="avoid")&&f.on.every(x=>x==="avoid"),`면역 약을 켜면 생굴·연어 사시미가 '피하기'로 (끔 ${f.none} → 켬 ${f.on})`);
    await p.context().close()}

  console.log('== 5 식단 단계 화면의 ECCO 섬유 단서');
  {const p=await open();
    const t=await p.evaluate(()=>{SCR=null; openScr("set-stage"); render(); return document.querySelector('#main').innerText});
    need(/ECCO 합의문\(2025\)은 저섬유·고섬유 식단 가운데 어느 쪽도 병을 가라앉힌다는 일관된 근거가 없다/.test(t),'ECCO 2025: 저섬유·고섬유 식단 모두 일관된 근거 없음');
    need(/'피하기'가 아니라 '다음 단계'/.test(t)&&/단계에서는 섬유를 제한하지 않습니다/.test(t),'그래서 섬유 많은 음식은 보류, 관해기에는 제한하지 않음');
    await p.context().close()}

  console.log('== 6 백업 암호화: PBKDF2 60만 회, 옛 백업은 계속 열림, 터무니없는 횟수는 거절');
  {const p=await open();
    const r=await p.evaluate(async()=>{const o={};
      await encSet("correct-horse-1"); o.newIter=JSON.parse(await encWrap(backupJSON())).iter;
      const salt=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12));
      const mk=async(iter,omit)=>{const key=await encDerive("old-pass-123",salt,iter); const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(backupJSON())));
        const e={app:"uc-table",enc:"AES-GCM-256",kdf:"PBKDF2-SHA256",iter,salt:b64(salt),iv:b64(iv),ct:b64(ct)}; if(omit) delete e.iter; return e};
      const e31=await mk(310000); o.legacy=JSON.parse(await encUnwrap(e31,"old-pass-123")).app==="uc-table";
      o.noIter=JSON.parse(await encUnwrap(await mk(310000,true),"old-pass-123")).app==="uc-table";
      o.of=[20000000,"abc",-5,1.5,ENC_ITER*4+1].map(x=>encIterOf({iter:x}));
      let thrown=""; try{await encUnwrap({...e31,iter:20000000},"old-pass-123")}catch(e){thrown=e.message} o.thrown=thrown;
      const t0=performance.now(); restoreFromText(JSON.stringify({...e31,iter:20000000})); await new Promise(z=>setTimeout(z,150)); o.ms=Math.round(performance.now()-t0);
      o.msg=msgs.some(m=>/설정값이 올바르지 않아 열지 않았습니다/.test(m)); o.pw=!!document.querySelector('#encPw');
      restoreFromText(JSON.stringify(e31)); await new Promise(z=>setTimeout(z,150)); o.asks=!!document.querySelector('#encPw');
      return o});
    need(r.newIter===600000,`새 암호화 백업은 60만 회 (${r.newIter})`);
    need(r.legacy&&r.noIter,'31만 회로 만든 백업(횟수가 적힌 것·안 적힌 것) 모두 열림');
    need(r.of.every(x=>x===0)&&r.thrown==="bad-iter",`비정상 횟수(2천만·글자·음수·소수·상한 초과)는 0으로 거절 (${r.of})`);
    need(r.msg&&!r.pw&&r.ms<1500,`가져오기에서 거절 안내만 보이고 비밀번호 창은 열리지 않음, 앱이 멈추지 않음 (${r.ms}ms)`);
    need(r.asks,'정상 횟수의 옛 백업은 비밀번호를 물음');
    await p.context().close()}

  console.log('== 7 PWA 콘텐츠 보안 정책(CSP): 웹으로 여는 public/ 빌드(오프라인 단일 파일은 v1122)');
  {const PUB=path.join(ROOT,'public'); const idx=fs.readFileSync(path.join(PUB,'index.html'),'utf8');
    const meta=idx.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/); const pol=meta&&meta[1];
    need(!!pol,'public/index.html에 CSP 메타'); 
    const inl=[...idx.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
    need(inl.length===1,`인라인 스크립트는 서비스 워커 등록 한 줄뿐 (${inl.length}개)`);
    const hash=inl.length?'sha256-'+crypto.createHash('sha256').update(inl[0],'utf8').digest('base64'):'';
    need(!!pol&&pol.includes(`'${hash}'`),'CSP의 해시가 그 한 줄과 같다');
    need(!!pol&&/default-src 'none'/.test(pol)&&/script-src 'self' 'sha256-[^']+'(;|$)/.test(pol)&&!/unsafe-eval|script-src[^;]*unsafe-inline/.test(pol),'스크립트는 같은 출처+해시만, eval·인라인 허용 없음');
    need(!/\son(click|load|error|input|change|submit)=/i.test(idx),'인라인 이벤트 속성 없음');
    const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.woff2':'font/woff2'};
    const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]); if(u.endsWith('/')) u+='index.html'; const f=path.join(PUB,u); if(!f.startsWith(PUB)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404); s.end(); return}
      s.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(s)});
    await new Promise(r=>srv.listen(0,'127.0.0.1',r)); const port=srv.address().port;
    const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'allow'}); const p=await ctx.newPage();
    const viol=[]; p.on('console',m=>{const t=m.text(); if(/Content Security Policy|Refused to/i.test(t)) viol.push(t.slice(0,200))});
    await p.addInitScript(()=>{window.__saved=[]}); 
    await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main')?.firstChild,null,{timeout:20000});
    await p.evaluate(()=>{S.consent={date:today()};S.onb="done";S.stageMode="auto";for(let i=0;i<5;i++){S.logs[addDays(today(),-i)]={...BLANK_LOG(),day:2+i,night:i%2,blood:i?1:0,bloody:i?1:0,pain:i}} save()}); await p.reload();
    await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main')?.firstChild,null,{timeout:20000}); await p.waitForTimeout(1200);
    const r=await p.evaluate(async()=>{const o={}; o.sw=(await navigator.serviceWorker.getRegistrations()).length;
      for(const t of ["plan","log","food","me"]){ S.tab=t; SCR=null; render(); }
      try{await loadScanLib(); o.zx=typeof window.ZXing}catch(e){o.zxErr=String(e)}
      DL={save:async({filename,data})=>{window.__saved.push([filename,data.size])}};
      try{SCR={name:"pdf"}; render(); await exportPDF(); o.pdf=window.__saved[0]||null}catch(e){o.pdfErr=String(e)}
      o.alerts=msgs.slice(); return o});
    need(r.sw>=1,`서비스 워커가 CSP 아래서도 등록됨 (${r.sw})`);
    need(r.zx==="object"||r.zx==="function",`바코드 라이브러리(vendor)를 불러옴 (${r.zx||r.zxErr})`);
    need(r.pdf&&r.pdf[1]>5000,`그림 PDF 저장이 CSP 아래서 끝까지 됨 (${JSON.stringify(r.pdf||r.pdfErr)} · 안내 ${JSON.stringify(r.alerts)})`);
    const [dl]=await Promise.all([p.waitForEvent('download',{timeout:8000}).catch(()=>null),p.evaluate(()=>DL_FALLBACK.save({filename:"t.txt",data:new Blob(["x"])}))]);
    need(!!dl&&dl.suggestedFilename()==="t.txt",'파일 저장(blob 내려받기)도 CSP 아래서 됨');
    need(viol.length===0,`CSP 위반 로그 없음 (${viol.slice(0,3).join(' | ')})`);
    await ctx.close(); srv.close()}

  console.log('== 8 jsPDF 4.2.1(보안 공지 GHSA-wfv2-pwc8-crg5 등의 패치 버전), 9 CI 권한');
  {const v=fs.readFileSync(path.join(ROOT,'vendor','jspdf.umd.min.js'),'utf8'); const pv=fs.readFileSync(path.join(ROOT,'public','vendor','jspdf.umd.min.js'),'utf8');
    need(/jsPDF[\s\S]{0,80}Version 4\.2\.1 /.test(v.slice(0,400)),'vendor/jspdf.umd.min.js는 4.2.1');
    need(v===pv,'public/vendor의 사본이 같다');
    need(/jsPDF \| 4\.2\.1 \|/.test(fs.readFileSync(path.join(ROOT,'docs','data-sources.md'),'utf8'))&&/jsPDF 4\.2\.1 · MIT/.test(fs.readFileSync(path.join(ROOT,'src','data','build_app.py'),'utf8')),'문서·앱 정보의 버전 표기도 4.2.1');
    const WF=path.join(ROOT,'.github','workflows'); const miss=fs.readdirSync(WF).filter(f=>/\.ya?ml$/.test(f)).filter(f=>!/^permissions:/m.test(fs.readFileSync(path.join(WF,f),'utf8')));
    need(miss.length===0,`모든 워크플로에 permissions (${miss.join(',')||'없음 빠짐'})`);
    need(/package-ecosystem: github-actions/.test(fs.readFileSync(path.join(ROOT,'.github','dependabot.yml'),'utf8')),'dependabot 설정');
  }

  console.log('== 10 가져온 값의 범위: 체온·주의 음식 개수(맥박은 받지 않음)');
  {const p=await open();
    const r=await p.evaluate(()=>{const base=JSON.parse(backupJSON()); const mk=l=>normalizeState({...base,logs:{"2026-10-01":{...BLANK_LOG(),day:3,...l}}}).logs["2026-10-01"];
      const t=x=>mk({temp:x}).temp, h=x=>("pulse" in mk({pulse:x}))?"남음":"";
      const o={temp:[t("37.5"),t(37.5),t("99999"),t("abc"),t("33.9"),t("34"),t("42"),t("42.1"),t("")], pulse:[h("95"),h(95),h(1e9),h("x"),h("29"),h("30"),h("200"),h("201"),h("")]};
      const tr=n=>Array.from({length:n},(_,i)=>({name:"음식"+i,sym:Array.from({length:50},(_,k)=>"증상"+k),never:false,date:"",source:"직접"}));
      const s=normalizeState({...base,triggers:tr(600)}); o.trig=s.triggers.length; o.sym=s.triggers[0].sym.length;
      o.few=normalizeState({...base,triggers:tr(3)}).triggers.length; return o});
    need(JSON.stringify(r.temp)==='["37.5","37.5","","","","34","42","",""]',`체온: 범위 안은 그대로, 밖·글자는 비움 (${JSON.stringify(r.temp)})`);
    need(r.pulse.every(x=>x===""),`맥박: 옛 기록·백업에 있어도 가져오지 않음 (${JSON.stringify(r.pulse)})`);
    need(r.trig===500&&r.sym===20&&r.few===3,`주의 음식 500개·증상 20개까지, 적으면 그대로 (${r.trig}/${r.sym}/${r.few})`);
    await p.context().close()}

  await b.close();
  console.log(F.length?`\n실패 ${F.length}건`:'\n모두 통과'); if(F.length) process.exit(1);
})().catch(e=>{console.error(e); process.exit(1)});
