const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}

/* v1.13.0 24차(2026-11-17) 사용자 요청: AI 티를 빼고 처음 쓰는 환자가 덜 헤매게(진단 14가지)
   1 시작 설정 3단계: 끝까지 내려도 가려지는 글이 없고, 아래 단추는 한 줄
   2 시작 설정 1단계: 틀린 값은 그 칸에 표시(aria-invalid·설명 연결·포커스), 다음 단계로 따라오지 않음
   3 입력칸 안내 글자 대비 4.5:1 이상(밝은·어두운 화면)
   4 시작 설정 첫 단계: 아래 막대에는 주 단추와 '나중에' 두 개, 백업은 따로 한 줄
   5 빈 화면: 무엇을 하는 곳인지와 시작하는 단추
   8 화면 문구: 만든 사람 쪽 말('앱 규칙으로' 등)과 끊긴 꼬리('~있음', '~권고')가 없음
   9 음식 상세: 판정 이유가 맨 위, 옅은 칸 상자 2개 이하, 같은 이유를 두 번 보이지 않음
  10 음식 목록·끼니 카드·음식 상세에 뜻 없는 아이콘 칸이 없음
  11 모서리는 8·12px·알약·원, 화면 덩어리 사이 간격은 8·16·24px
  12 화면 제목은 본문보다 1.25배 이상(제목 막대 16px, 화면 제목 20px)
  13 '?' 단추는 누르는 범위 44px 이상, 글자 12px 이상
  14 시작 화면 동의는 체크 상자, 흐린 '시작하기'에 이유 연결 */
const { chromium } = require('playwright');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
fs.mkdirSync(TMP,{recursive:true}); const page=path.join(TMP,'v1130g.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const SEED=()=>{const d=n=>addDays(today(),-n); S.consent={date:addDays(today(),-30)}; S.onb="done"; S.persist="na"; S.stageMode="auto";
  S.profile={...S.profile,height:"174",weight:"63",age:"27",sex:"M",usualBM:"3"};
  for(let i=0;i<5;i++) S.logs[d(i)]={...BLANK_LOG(),date:d(i),day:3,night:0,bloody:0,urg:0,blood:0,well:1,pain:1,gas:"없음",fatigue:"약간",stool:4,medtaken:1};
  save()};
const lum=c=>{const m=c.match(/[\d.]+/g).map(Number); const f=v=>{v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}; return 0.2126*f(m[0])+0.7152*f(m[1])+0.0722*f(m[2])};
const ratio=(a,b)=>{const x=lum(a),y=lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)};
(async()=>{
  const b=await chromium.launch();
  const mk=async(w,h,scheme,seed)=>{const ctx=await b.newContext({viewport:{width:w,height:h},colorScheme:scheme,isMobile:true,hasTouch:true}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    await p.goto('file://'+page); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    if(seed){await p.evaluate(SEED); await p.reload(); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild)}
    await p.evaluate(t=>{S.theme=t; render()},scheme); return {ctx,p}};
  // 끝까지 내렸을 때 아래 막대에 가려지는 글(px)
  const HIDDEN=()=>{window.scrollTo(0,1e6); const bar=document.querySelector('#main .bottom-bar'); if(!bar) return {px:0,rows:0};
    const top=bar.getBoundingClientRect().top; let worst=0;
    for(const e of document.querySelectorAll('#main *')){ if(bar.contains(e)) continue; if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&!e.matches('button,input')) continue;
      const r=e.getBoundingClientRect(); if(r.height<=0||r.top>=innerHeight) continue; worst=Math.max(worst,r.bottom-top)}
    const rows=new Set([...bar.querySelectorAll('button')].filter(x=>x.getBoundingClientRect().height>0).map(x=>Math.round(x.getBoundingClientRect().top))).size;
    return {px:Math.round(worst),rows}};

  // ---- 처음 실행(기록 없음) ----
  for(const [w,h] of [[320,568],[390,844]]){
    const {ctx,p}=await mk(w,h,'light',false);
    // 14 동의
    const c=await p.evaluate(()=>{const i=document.querySelector('#c_req'); const g=document.querySelector('#consentGo'); const d=g&&g.getAttribute('aria-describedby'); const hint=d&&document.getElementById(d);
      return {type:i&&i.type, sw:!!i&&i.classList.contains('sw'), dis:g&&g.disabled, hint:hint?hint.textContent.trim():'', hintVis:!!hint&&hint.getBoundingClientRect().height>0}});
    if(w===390){need(c.type==='checkbox'&&!c.sw,`14 동의는 스위치가 아닌 체크 상자 (${c.type}, 스위치 ${c.sw})`);
      need(c.dis&&c.hintVis&&/표시/.test(c.hint),`14 흐린 '시작하기'에 이유가 연결돼 보임 ('${c.hint}')`)}
    // 4 첫 단계
    await p.evaluate(()=>{S.consent={date:today()}; S.onb="0"; SCR=null; render()});
    const o0=await p.evaluate(()=>{const bar=document.querySelector('#main .bottom-bar'); const inBar=[...bar.querySelectorAll('button')].filter(x=>x.getBoundingClientRect().height>0).map(x=>x.textContent.trim());
      const rp=document.querySelector('[data-act="restorePick"]'), rs=document.querySelector('[data-act="restorePaste"]');
      return {inBar, restoreOut:!!rp&&!!rs&&!bar.contains(rp)&&!bar.contains(rs), skipNote:/60\s?kg/.test(document.querySelector('#main').innerText)}});
    if(w===390){need(o0.inBar.length===2,`4 첫 단계 아래 막대는 단추 2개 (${o0.inBar.join(' / ')})`);
      need(o0.restoreOut,'4 백업 불러오기 두 가지는 아래 막대 밖 한 줄에');
      need(o0.skipNote,"4 '나중에 넣기'를 고르면 무엇이 달라지는지(60kg 기준) 알림")}
    // 2 1단계 오류
    await p.evaluate(()=>{S.onb="1"; render()});
    await p.fill('#o_height','17'); await p.click('[data-act="onbNext"]'); await p.waitForTimeout(150);
    const e1=await p.evaluate(()=>{const i=document.querySelector('#o_height'); const d=i.getAttribute('aria-describedby'); const m=d&&d.split(/\s+/).map(x=>document.getElementById(x)).find(x=>x&&/100~250cm/.test(x.textContent));
      const ir=i.getBoundingClientRect(), mr=m&&m.getBoundingClientRect();
      return {inv:i.getAttribute('aria-invalid'), msg:!!m, near:!!mr&&mr.top>=ir.bottom-2&&mr.top-ir.bottom<60, focus:document.activeElement===i, onb:S.onb}});
    if(w===390){need(e1.inv==='true',`2 틀린 키 칸에 aria-invalid (${e1.inv})`);
      need(e1.msg&&e1.near,`2 오류 문구가 그 칸 바로 아래에 연결됨 (연결 ${e1.msg}, 가까움 ${e1.near})`);
      need(e1.focus&&e1.onb==="1",`2 포커스가 틀린 칸으로 가고 단계는 그대로 (${e1.focus}, ${e1.onb})`)}
    await p.fill('#o_height','170'); await p.click('[data-act="onbNext"]'); await p.waitForTimeout(150);
    const e2=await p.evaluate(()=>({onb:S.onb, left:[...document.querySelectorAll('body *')].some(e=>e.getBoundingClientRect().height>0&&[...e.childNodes].some(n=>n.nodeType===3&&/100~250cm/.test(n.textContent)))}));
    if(w===390) need(e2.onb==="2"&&!e2.left,`2 고쳐서 넘어가면 오류가 따라오지 않음 (단계 ${e2.onb}, 남음 ${e2.left})`);
    // 1 3단계
    await p.evaluate(()=>{S.onb="3"; render()});
    const h3=await p.evaluate(HIDDEN);
    need(h3.px<=0&&h3.rows===1,`1 ${w}px 3단계: 끝까지 내려도 가려지는 글 없음·단추 한 줄 (${h3.px}px, ${h3.rows}줄)`);
    // 5 빈 화면
    if(w===390){
      await p.evaluate(()=>{S.onb="done"; openScr('reintro')});
      const r5=await p.evaluate(()=>{const m=document.querySelector('#main'); return {len:m.innerText.replace(/\s+/g,'').length, act:[...m.querySelectorAll('button[data-act],a[href]')].filter(x=>x.dataset.act!=="back"&&x.getBoundingClientRect().height>0).length}});
      need(r5.len>=60&&r5.act>=1,`5 '음식 다시 먹어 보기' 빈 화면에 설명과 단추 (글자 ${r5.len}, 단추 ${r5.act})`);
      await p.evaluate(()=>openScr('report'));
      const r6=await p.evaluate(()=>{const m=document.querySelector('#main'); return {how:/먹음/.test(m.innerText), act:[...m.querySelectorAll('button[data-act]')].filter(x=>!["back","repDays","repTab"].includes(x.dataset.act)&&x.getBoundingClientRect().height>0).length}});
      need(r6.how&&r6.act>=1,`5 보고서 빈 화면에 채우는 법('먹음')과 단추 (${r6.how}, ${r6.act})`);
    }
    await ctx.close();
  }

  // ---- 기록 있음: 밝은·어두운 화면 ----
  for(const scheme of ['light','dark']){
    const {ctx,p}=await mk(390,844,scheme,true);
    // 3 안내 글자 대비
    const ph=await p.evaluate(()=>{const out=[]; const eff=el=>{let q=el; while(q){const b=getComputedStyle(q).backgroundColor; if(b&&b!=='rgba(0, 0, 0, 0)'&&b!=='transparent') return b; q=q.parentElement} return 'rgb(255, 255, 255)'};
      const scan=()=>{for(const i of document.querySelectorAll('#main input[placeholder],#main textarea[placeholder]')){ if(i.getBoundingClientRect().height<=0) continue; out.push([i.id||i.name||i.placeholder, getComputedStyle(i,'::placeholder').color, eff(i)])}};
      S.onb="1"; SCR=null; render(); scan(); S.onb="done"; SCR=null; S.tab="food"; S.foodSub="search"; render(); scan(); openScr('asks'); scan(); openScr('set-goals'); scan(); return out});
    const low=ph.map(([n,c,bg])=>[n,Math.round(ratio(c,bg)*100)/100]).filter(x=>x[1]<4.5);
    need(ph.length>=5&&!low.length,`3 ${scheme} 입력칸 안내 글자 대비 4.5 이상 (검사 ${ph.length}칸, 미달 ${low.slice(0,3).map(x=>x.join(' ')).join(', ')})`);
    if(scheme==='dark'){await ctx.close(); continue}
    // 10 아이콘 칸
    const ic=await p.evaluate(()=>{S.tab="food"; S.foodSub="search"; S.foodQ=""; SCR=null; render(); const a=document.querySelectorAll('#foodRes .fcard .fic').length;
      S.tab="plan"; SCR=null; render(); const m=document.querySelectorAll('#main .mrow .fic, #main [data-act="meal"] .fic').length; showFood('white_bread'); const s=document.querySelectorAll('#sheetRoot .fic').length; closeSheet(); return {a,m,s}});
    need(ic.a===0&&ic.m===0&&ic.s===0,`10 음식 목록·끼니 카드·음식 상세에 아이콘 칸 없음 (목록 ${ic.a}, 끼니 ${ic.m}, 상세 ${ic.s})`);
    // 9 음식 상세
    for(const id of ['white_bread','rm_buldak_cup']){
      const s9=await p.evaluate(id=>{SCR=null; S.tab="food"; render(); showFood(id); const sh=document.querySelector('#sheetRoot .sheet'); const sbg=getComputedStyle(sh).backgroundColor;
        const boxes=[...sh.querySelectorAll('div,details,section')].filter(e=>{const cs=getComputedStyle(e); const r=e.getBoundingClientRect(); return r.height>0&&cs.backgroundColor!=='rgba(0, 0, 0, 0)'&&cs.backgroundColor!==sbg&&parseFloat(cs.borderTopLeftRadius)>=6});
        const sum=sh.querySelector('.why-sum,.why-top'); const facts=sh.querySelector('.facts');
        const reasons=foodStatus(FOOD[id]).reasons; const more=sh.querySelector('details.why-more');
        const dup=more?reasons.filter(r=>more.textContent.includes(r)).length:0;
        return {boxes:boxes.length, first:!!sum&&(!facts||(sum.compareDocumentPosition(facts)&Node.DOCUMENT_POSITION_FOLLOWING)), fs:sum?parseFloat(getComputedStyle(sum).fontSize):0, all:!!sum&&reasons.every(r=>sum.textContent.includes(r)), dup}},id);
      need(s9.boxes<=2,`9 ${id} 음식 상세의 옅은 칸 상자 2개 이하 (${s9.boxes})`);
      need(s9.first&&s9.fs>=15&&s9.all,`9 ${id} 판정 이유가 숫자보다 먼저, 15px 이상, 모두 보임 (${s9.first}, ${s9.fs}px, ${s9.all})`);
      need(s9.dup===0,`9 ${id} 자세히 안에 같은 이유를 다시 쓰지 않음 (${s9.dup})`);
    }
    await p.evaluate(()=>closeSheet());
    // 11 모서리·간격, 12 글자 위계, 13 '?' 단추, 8 화면 문구
    const views=[["tab","plan"],["tab","log"],["tab","food"],["tab","me"],["scr","nutri"],["scr","meal"],["scr","set-data"],["scr","set-about"],["scr","care"],["scr","pdf"],["onb","2"],["onb","3"]];
    const r=await p.evaluate(views=>{const rad=new Set(), gaps=new Set(), h2=new Set(), bad=[]; let h1=0, gq=null;
      const FIX=/앱 규칙으로|앱 규칙이|앱 규칙 식단|앱 판정이|앱이 정한 구간|앱 기준|앱 계산|늘릴 수 있음|권고\(|다름\(/;
      for(const [k,v] of views){ document.querySelector('#sheetRoot').innerHTML=""; if(k==="onb"){SCR=null; S.onb=v; render()} else {S.onb="done"; if(k==="tab"){SCR=null;S.tab=v;render()} else if(v==="meal"){SCR=null;S.tab="plan";render();openScr('meal',{k:0})} else openScr(v)}
        for(const e of document.querySelectorAll('#main *, #appbar *')){ const cs=getComputedStyle(e); const r=e.getBoundingClientRect(); if(r.width<=0||r.height<=0) continue;
          const rr=cs.borderTopLeftRadius; if(rr&&rr!=='0px'){ const n=parseFloat(rr); rad.add(rr.endsWith('%')?'50%':n>=99?'pill':n+'px') }
          if(e.matches('#main h2')) h2.add(cs.fontSize);
          if(e.matches('.gq-b')&&!gq){const a=getComputedStyle(e,'::after'); const t=parseFloat(a.top)||0, l=parseFloat(a.left)||0; gq={w:r.width-2*Math.min(0,l), h:r.height-2*Math.min(0,t), fs:parseFloat(cs.fontSize), content:a.content}}
          for(const n of e.childNodes) if(n.nodeType===3){const t=n.textContent.trim(); if(t&&FIX.test(t)) bad.push(t.slice(0,40))}}
        if(k!=="onb"){const kids=[...document.querySelector('#main .view').children].filter(x=>x.getBoundingClientRect().height>0&&getComputedStyle(x).position!=='fixed'&&getComputedStyle(x).position!=='sticky');
          for(let i=1;i<kids.length;i++){const g=Math.round(kids[i].getBoundingClientRect().top-kids[i-1].getBoundingClientRect().bottom); if(g>0) gaps.add(g)}}
        if(document.body.classList.contains('pushed')) h1=Math.max(h1,parseFloat(getComputedStyle(document.querySelector('#appbar h1')||document.body).fontSize));
      }
      return {rad:[...rad].sort(), gaps:[...gaps].sort((a,b)=>a-b), h2:[...h2], h1, gq, bad:[...new Set(bad)]}},views);
    const radOK=r.rad.every(x=>['8px','12px','pill','50%'].includes(x)||parseFloat(x)<=4);
    need(radOK,`11 모서리는 8·12px·알약·원만 (${r.rad.join(' ')})`);
    need(r.gaps.every(g=>[8,16,24].includes(g)),`11 화면 덩어리 사이 간격은 8·16·24px (${r.gaps.join(' ')})`);
    const h2px=r.h2.map(parseFloat);
    need(h2px.length>0&&Math.min(...h2px)>=20&&r.h1>0&&r.h1<=16,`12 화면 제목 20px 이상·하위 화면 제목 막대 16px 이하 (h2 ${r.h2.join(' ')}, 막대 ${r.h1}px)`);
    need(!!r.gq&&r.gq.w>=44&&r.gq.h>=44&&r.gq.fs>=12,`13 '?' 단추 누르는 범위 44px·글자 12px 이상 (${r.gq?`${Math.round(r.gq.w)}×${Math.round(r.gq.h)}, ${r.gq.fs}px`:'없음'})`);
    need(!r.bad.length,`8 만든 사람 쪽 말·끊긴 꼬리 없음 (${r.bad.slice(0,4).join(' | ')})`);
    const reasons=await p.evaluate(()=>{const out=new Set(); const c=ctx(); for(const st of ["1","2","3"]){S.stageMode=st; try{FS_CACHE={sig:null,m:new Map()}}catch(e){} for(const f of FOODS) for(const x of foodStatus(f,ctx()).reasons) out.add(x)} S.stageMode="auto"; return [...out]});
    const tail=x=>{let t=x.replace(/\s+$/,''); for(let k=0;k<3&&t.endsWith(')');k++){let d=0,i=t.length-1; for(;i>=0;i--){if(t[i]===')')d++; else if(t[i]==='('){d--; if(!d) break}} t=t.slice(0,i).replace(/\s+$/,'')} return t};
    const frag=reasons.filter(x=>!/(니다|십시오)\.?$/.test(tail(x)));
    need(!frag.length,`8 음식 판정 이유는 합니다체 문장 (끊긴 꼬리 ${frag.length}개: ${frag.slice(0,3).join(' | ')})`);
    // 6 음식 설명: 기관 이름으로 시작하는 문장을 잇달아 쌓지 않고(설명마다 1개 이하), 만든 사람 쪽 말('앱 기준')이 없음
    const w6=await p.evaluate(()=>{const INST=/^(대한장연구학회|길병원|세브란스병원|서울아산병원|서울대병원|ECCO|ESPEN|AGA|IOIBD|ACG|UCSF)/; let stack=0, app=0; const ex=[];
      for(const f of FOODS){const ss=String(f.why||'').split(/(?<=다\.)\s+/).filter(Boolean); const n=ss.filter(x=>INST.test(x)).length; if(n>=2){stack++; if(ex.length<2) ex.push(f.name)} if(/앱 기준/.test(f.why||'')) app++}
      return {stack,app,ex}});
    need(w6.stack===0,`6 음식 설명에 기관 이름으로 시작하는 문장이 2개 이상인 것 없음 (${w6.stack}개: ${w6.ex.join(', ')})`);
    need(w6.app===0,`6 음식 설명에 '앱 기준' 없음 (${w6.app}개)`);
    await ctx.close();
  }
  await b.close();
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})().catch(e=>{console.error(e); process.exitCode=1});
