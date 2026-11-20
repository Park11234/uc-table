const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}

/* v1.13.0 26차(2026-11-19) 사용자 요청
   1 앱을 처음 켜면 앱을 설명하는 화면(무엇을 하는 앱인지·할 수 있는 일)이 뜨고, 체크 상자로 확인해야 시작한다
   2 화면 글에 시제품 같은 문장(버전 이름·만든 과정)이 없다: 'v1.x', '첫 공개판', '크롬으로' */
const { chromium } = require('playwright');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
fs.mkdirSync(TMP,{recursive:true}); const page=path.join(TMP,'v1130i.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
(async()=>{
  const b=await chromium.launch();
  for(const [w,h] of [[390,844],[320,568]]){
    const ctx=await b.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    await p.goto('file://'+page); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    const r=await p.evaluate(()=>{const m=document.querySelector('#main'); const t=m.innerText.replace(/\s+/g," ");
      const intro=m.querySelector('.intro'); const items=intro?[...intro.querySelectorAll('li')].map(x=>x.innerText.replace(/\s+/g," ")):[];
      const c=document.querySelector('#c_req'); const g=document.querySelector('#consentGo');
      return {first:!S.consent, intro:!!intro, head:intro?intro.querySelector('h2')?.innerText:"", items, notice:/참고용 기록 앱입니다/.test(t)&&/이 기기에만 저장됩니다/.test(t),
        chk:!!c&&c.type==="checkbox", dis:!!g&&g.disabled, order:!!intro&&!!c&&!!(intro.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING)}});
    if(w===390){
      need(r.first&&r.intro&&/UC TABLE/.test(r.head),`1 처음 켜면 앱 설명 화면 ('${r.head}')`);
      need(r.items.length>=4&&["식단","증상 기록","찾아보기","조약돌"].every(k=>r.items.some(x=>x.includes(k))),`1 할 수 있는 일 네 가지(식단·증상 기록·찾아보기·조약돌) (${r.items.length}개)`);
      need(r.notice,'1 참고용 앱·기기에만 저장 안내도 같은 화면에');
      need(r.chk&&r.dis&&r.order,`1 설명 아래 체크 상자, 체크 전에는 시작 단추가 흐림 (${r.chk}, ${r.dis}, ${r.order})`);
    }
    // 체크하면 시작할 수 있고, 다음부터는 설명 화면이 다시 뜨지 않음
    await p.locator('#c_req').check(); const en=await p.evaluate(()=>!document.querySelector('#consentGo').disabled);
    await p.click('#consentGo'); await p.waitForTimeout(150);
    const after=await p.evaluate(()=>({onb:S.onb, consent:!!S.consent, intro:!!document.querySelector('#main .intro')}));
    await p.reload(); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild);
    const again=await p.evaluate(()=>!!document.querySelector('#main .intro'));
    need(en&&after.consent&&after.onb==="0"&&!after.intro&&!again,`1 ${w}px: 체크하면 시작되고 다시 열어도 설명 화면은 안 뜸 (${en}, ${after.onb}, ${again})`);
    if(w===390){
      // 2 시제품 같은 문장
      const txt=await p.evaluate(()=>{S.consent={date:today()}; S.onb="done"; const out=[];
        const grab=()=>out.push((document.querySelector('#main').innerText+" "+(document.querySelector('#sheetRoot')?.innerText||"")).replace(/\s+/g," "));
        for(const n of ["set-refs","set-about","set-data","set-privacy","set-home"]){openScr(n); grab()}
        SCR=null; S.tab="food"; render();
        for(const d of ["2026-09-24","2026-10-13"]){const id=Object.keys(ADDED).find(i=>ADDED[i]===d&&FOOD[i]); if(id){showFood(id); const det=document.querySelector('#sheetRoot details'); if(det) det.open=true; grab(); closeSheet()}}
        for(const k of Object.keys(REFS)){showRefs([+k]); grab(); closeSheet()}
        return out.join(" ")}).catch(e=>"ERR "+e.message);
      const bad=(txt.match(/v\d+\.\d+(\.\d+)?|첫 공개판|크롬으로|버전입니다|사이에 넣은 음식/g)||[]);
      need(!/^ERR/.test(txt)&&bad.length===0,`2 화면 글에 버전 이름·만든 과정 말 없음 (${/^ERR/.test(txt)?txt.slice(0,80):[...new Set(bad)].join(', ')})`);
    }
    await ctx.close();
  }
  await b.close();
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exitCode=1});
