const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
require('../lib/guard.cjs');

/* v1.13.0 34차(2026-11-23) 사용자 요청
   첫 화면('UC TABLE은 이런 앱입니다')에서 시작하기를 누르면 휴대폰에 앱으로 설치하는 방법이 나오고, 거기서 실제로 설치할 수 있다(B안: 누를 곳을 그림으로)
   - 안드로이드 크롬: 설치 창(beforeinstallprompt)이 준비되면 아래 '앱 설치하기'로 바로 설치. 준비 전에는 더보기(⋮) → 앱 설치 그림
   - 아이폰: 공유 버튼 → 홈 화면에 추가 그림, 추가한 뒤에는 홈 화면 아이콘으로 열어 시작(사파리와 기록이 따로 저장)
   - 카카오톡 같은 앱 안 화면: 크롬(안드로이드)·사파리(아이폰 카카오톡)로 여는 단추, 그 밖의 앱은 주소 복사
   - '나중에 설치하기'로 넘어갈 수 있고 나중에 다시 알리지 않음. 설치한 앱·안드로이드 앱·내려받은 파일·컴퓨터에서는 건너뜀
   앱을 실제 주소(SITE)에서 연 것처럼 띄워 본다(파일로 열면 설치 단계를 건너뛰므로) */
const { chromium } = require('playwright');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const SITE='https://park11234.github.io/uc-table/', URL0=SITE+'index.html';
const HTML='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>';
fs.mkdirSync(TMP,{recursive:true}); const FILE=path.join(TMP,'v1130m.html'); fs.writeFileSync(FILE,HTML);
const UA={
  android:'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  ios:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  kakaoA:'Mozilla/5.0 (Linux; Android 14; SM-S921N Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.0.0 Mobile Safari/537.36 KAKAOTALK/10.9.5',
  kakaoI:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.9.5',
  instaI:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0',
  desktop:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
};
const STANDALONE=()=>{const m=window.matchMedia.bind(window); window.matchMedia=q=>/standalone/.test(q)?{matches:true,media:q,addEventListener(){},removeEventListener(){}}:m(q)};
const FAKE_BIP=()=>{const e=new Event('beforeinstallprompt'); e.prompt=()=>{window.__prompted=(window.__prompted||0)+1}; e.userChoice=Promise.resolve({outcome:'accepted'}); window.dispatchEvent(e)};
const look=()=>{const m=document.querySelector('#main'); const on=s=>[...m.querySelectorAll(s)].map(x=>x.textContent.replace(/\s+/g," ").trim());
  return {onb:S.onb, h2:on('h2'), bar:on('.bottom-bar .btn'), cardBtn:on('.card button'), links:[...m.querySelectorAll('a.btn')].map(a=>({t:a.textContent.trim(),href:a.getAttribute('href'),target:a.getAttribute('target')||""})),
    menu:on('.ins-menu .ins-on'), dots:!!m.querySelector('.ins-top .ins-on'), dlg:on('.ins-dlg .ins-on'), share:!!m.querySelector('.ins-bar .ins-on svg'), add:on('.ins-list:not(.ins-menu) .ins-on'),
    note:on('.ins-note').join(" "), hidden:[...m.querySelectorAll('.ins-shot')].every(x=>x.getAttribute('aria-hidden')==="true"), shots:m.querySelectorAll('.ins-shot').length,
    over:document.documentElement.scrollWidth>innerWidth+1, small:[...document.querySelectorAll('#main .btn, .bottom-bar .btn')].filter(x=>x.getBoundingClientRect().height>0&&x.getBoundingClientRect().height<44).map(x=>x.textContent.trim())}};
(async()=>{
  const b=await chromium.launch();
  const open=async(ua,{url=URL0,w=390,init=[]}={})=>{const ctx=await b.newContext({viewport:{width:w,height:844},isMobile:true,hasTouch:true,userAgent:ua});
    for(const f of init) await ctx.addInitScript(f);
    const p=await ctx.newPage();
    if(!url.startsWith('file:')) await p.route('**/*',r=>r.request().url()===url?r.fulfill({contentType:'text/html',body:HTML}):r.fulfill({body:''}));
    await p.goto(url); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000}); return {ctx,p}};
  const start=async p=>{await p.click('label:has(#c_req)'); await p.click('#consentGo'); await p.waitForTimeout(150)};
  const settle=p=>p.waitForFunction(()=>!document.querySelector('.bottom-bar .btn[disabled]'),null,{timeout:5000});   // 바로 앞 단추 자리를 잘못 누르지 않게 잠깐 막는 시간
  try{
    console.log('== 1 안드로이드 크롬: 시작하기 다음 설치 화면, 나중에 설치하기');
    {const {ctx,p}=await open(UA.android); await start(p); const a=await p.evaluate(look);
      need(a.onb==="i"&&a.h2[0]==="휴대폰에 앱으로 설치하기",`1 시작하기를 누르면 설치 화면 (${a.onb}, ${a.h2})`);
      need(a.dots&&a.menu[0]==="앱 설치"&&a.hidden&&a.shots===2,`1 설치 창이 준비되기 전에는 더보기(⋮) → '앱 설치' 그림, 그림은 화면 읽기에서 숨김 (${JSON.stringify(a)})`);
      need(JSON.stringify(a.bar)==='["나중에 설치하기"]'&&!a.over&&!a.small.length,`1 아래에는 '나중에 설치하기'만, 가로 넘침·44px보다 작은 단추 없음 (${a.bar}, ${a.over}, ${a.small})`);
      await p.reload(); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild);
      const re=await p.evaluate(look); need(re.onb==="i"&&re.h2[0]==="휴대폰에 앱으로 설치하기",`1 다시 열어도 설치 화면 (${re.onb}, ${re.h2})`);
      await settle(p); await p.click('.bottom-bar [data-act=onbGo]'); await p.waitForTimeout(150); const s=await p.evaluate(look);
      need(s.onb==="0"&&s.h2[0]==="내 정보를 넣고 시작하시겠습니까?",`1 '나중에 설치하기'를 누르면 시작 설정 (${s.onb}, ${s.h2})`);
      await ctx.close()}

    console.log('== 2 설치 창이 준비되면 아래 앱 설치하기로 바로 설치');
    {const {ctx,p}=await open(UA.android); await start(p); await p.evaluate(FAKE_BIP); await p.waitForTimeout(100); const a=await p.evaluate(look);
      need(JSON.stringify(a.bar)==='["앱 설치하기","나중에 설치하기"]'&&a.dlg[0]==="설치",`2 '앱 설치하기' 단추와 설치 창 그림('설치'를 표시) (${a.bar}, ${a.dlg})`);
      await settle(p); await p.click('.bottom-bar [data-act=installApp]'); await p.waitForTimeout(100); const n=await p.evaluate(()=>window.__prompted||0);
      await p.evaluate(()=>window.dispatchEvent(new Event('appinstalled'))); await p.waitForTimeout(150); const d=await p.evaluate(look);
      need(n===1&&d.h2[0]==="앱을 설치했습니다"&&JSON.stringify(d.bar)==='["다음"]',`2 누르면 설치 창이 한 번 뜨고, 설치하면 '앱을 설치했습니다'·'다음' (${n}, ${d.h2}, ${d.bar})`);
      await settle(p); await p.click('.bottom-bar [data-act=onbGo]'); await p.waitForTimeout(150);
      need(await p.evaluate(()=>S.onb==="0"),'2 다음을 누르면 시작 설정');
      await p.evaluate(()=>{S.onb="done"; INSTALLED=false});
      await p.evaluate(FAKE_BIP); await p.evaluate(()=>{S.tab="me"; openScr("set-home")}); await p.waitForTimeout(100); const h=await p.evaluate(look);
      need(h.cardBtn.includes("앱 설치하기")&&!h.bar.length&&h.dlg[0]==="설치",`2 '내 정보 > 홈 화면에 설치'도 같은 그림, 설치 단추는 카드 안 (${JSON.stringify(h.cardBtn)})`);
      await ctx.close()}

    console.log('== 3 아이폰: 공유 → 홈 화면에 추가 그림, 설치한 앱으로 열어 시작');
    {const {ctx,p}=await open(UA.ios); await start(p); const a=await p.evaluate(look);
      need(a.onb==="i"&&a.share&&a.add[0]==="홈 화면에 추가"&&a.hidden,`3 공유 버튼·'홈 화면에 추가'를 표시한 그림 (${JSON.stringify(a)})`);
      need(/홈 화면의 UC TABLE 아이콘/.test(a.note)&&/기록이 따로 저장/.test(a.note)&&JSON.stringify(a.bar)==='["나중에 설치하기"]',`3 추가한 뒤 홈 화면 아이콘으로 열어 시작, 사파리와 기록이 따로 (${a.note})`);
      await p.evaluate(()=>{S.onb="done"; S.tab="me"; openScr("set-home")}); await p.waitForTimeout(100); const h=await p.evaluate(look);
      need(h.share&&!h.note,`3 '홈 화면에 설치'에는 같은 그림, 첫 실행용 안내는 없음 (${h.note})`);
      await ctx.close()}

    console.log('== 4 카카오톡 같은 앱 안 화면');
    {const {ctx,p}=await open(UA.kakaoA); await start(p); const a=await p.evaluate(look);
      const want=`intent://park11234.github.io/uc-table/#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(SITE)};end`;
      need(a.h2[0]==="다른 앱 안에서 열려 있습니다"&&a.links.some(l=>l.t==="크롬으로 열기"&&l.href===want),`4 안드로이드 카카오톡: '크롬으로 열기'가 크롬에서 앱 주소를 연다 (${JSON.stringify(a.links)})`);
      need(a.h2[1]==="크롬에서 이렇게 설치합니다"&&a.dlg[0]==="설치",`4 크롬에서 할 일(설치 창) 그림 (${a.h2})`);
      await ctx.close()}
    {const {ctx,p}=await open(UA.kakaoI); await start(p); const a=await p.evaluate(look);
      need(a.links.some(l=>l.t==="사파리로 열기"&&l.href===`kakaotalk://web/openExternal?url=${encodeURIComponent(SITE)}`)&&a.h2[1]==="사파리에서 이렇게 설치합니다"&&a.share,`4 아이폰 카카오톡: '사파리로 열기'와 사파리 그림 (${JSON.stringify(a.links)})`);
      await ctx.close()}
    {const {ctx,p}=await open(UA.instaI,{init:[()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:t=>{window.__copied=t; return Promise.resolve()}}})}]}); await start(p);
      const a=await p.evaluate(look); await p.click('#main [data-act=copySite]'); await p.waitForTimeout(100); const c=await p.evaluate(()=>window.__copied||"");
      need(a.cardBtn.includes("앱 주소 복사")&&c===SITE,`4 그 밖의 앱(인스타그램): '앱 주소 복사'로 앱 주소를 복사 (${a.cardBtn}, ${c})`);
      await ctx.close()}

    console.log('== 5 앱 주소가 아닌 곳(미리보기 등)에서는 앱 주소로 안내');
    {const {ctx,p}=await open(UA.android,{url:'https://preview.example/app.html'}); await start(p); const a=await p.evaluate(look);
      need(a.onb==="i"&&a.links.some(l=>l.t==="앱 주소 열기"&&l.href===SITE&&l.target==="_blank")&&a.shots===2,`5 그림과 함께 '앱 주소 열기' (${JSON.stringify(a.links)})`);
      await ctx.close()}

    console.log('== 6 설치 화면을 건너뛰는 경우');
    for(const [nm,ua,o] of [["컴퓨터",UA.desktop,{}],["설치한 앱으로 열었을 때",UA.android,{init:[STANDALONE]}],["안드로이드 앱",UA.android,{init:[()=>{window.UCTableAndroid={}}]}],["내려받은 파일",UA.android,{url:'file://'+FILE}]]){
      const {ctx,p}=await open(ua,o); await start(p); const a=await p.evaluate(look);
      need(a.onb==="0"&&a.h2[0]==="내 정보를 넣고 시작하시겠습니까?",`6 ${nm}: 바로 시작 설정 (${a.onb}, ${a.h2[0]})`); await ctx.close()}
    {const {ctx,p}=await open(UA.android); await start(p); await ctx.addInitScript(STANDALONE); await p.reload(); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild);
      const a=await p.evaluate(look); need(a.h2[0]==="내 정보를 넣고 시작하시겠습니까?"&&!a.shots,`6 설치 화면에서 멈췄다가 설치한 앱으로 열면 시작 설정부터 (${a.onb}, ${a.h2[0]})`); await ctx.close()}

    console.log('== 7 좁은 화면(320px)');
    for(const [nm,ua] of [["안드로이드",UA.android],["아이폰",UA.ios],["카카오톡",UA.kakaoA]]){
      const {ctx,p}=await open(ua,{w:320}); await start(p); await p.evaluate(FAKE_BIP); await p.waitForTimeout(100); const a=await p.evaluate(look);
      need(a.onb==="i"&&!a.over&&!a.small.length,`7 ${nm} 320px: 가로 넘침·44px보다 작은 단추 없음 (${a.over}, ${a.small})`); await ctx.close()}
  } finally { await b.close() }
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exitCode=1});
