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
// 검색 일치 규칙 단위 점검 + 조합 중간 단계마다 결과가 유지되는지
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('ime.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{S.consent={date:today()};
  const names=q=>FOODS.filter(f=>searchHit(f,q)).map(f=>f.name);
  const has=(q,nm)=>names(q).some(n=>n.includes(nm));
  return {
    jamo:[jamoOf("우유"),jamoOf("웅"),jamoOf("닭"),jamoOf("과자")],
    broken:has("ㅇㅜㅇㅠ","우유"), partial:has("웅","우유"), mixed:has("우ㅇ","우유"), mixed2:has("우ㅇㅠ","우유"),
    cho:has("ㄴㄹㅈ","누룽지"), choCompound:has("ㄷㄳ","닭가슴살"), nfd:has("우유".normalize("NFD"),"우유"),
    brokenLong:has("ㄴㅜㄹㅜㅇㅈㅣ","누룽지"), brokenCompoundVowel:has("ㅅㅏㄱㅗㅏ","사과"), space:has(" 우 유 ","우유"),
    single:names("ㅇ").length, nothing:names("ㅋㅋㅋ").length, latin:names("zz").length,
    oldAllergy:nameHit(FOOD.milk,"우유".normalize("NFD")), tags:tagsOfText("우유".normalize("NFD")+"함유")
  }});
console.log(JSON.stringify(r));
const F=[]; const need=(c,m)=>{if(!c) F.push(m)};
for(const k of ["broken","partial","mixed","mixed2","cho","choCompound","nfd","brokenLong","brokenCompoundVowel","space","oldAllergy"]) need(r[k]===true,'검색 규칙 '+k);
need(r.single===0&&r.nothing===0&&r.latin===0,'엉뚱한 검색어에 결과가 나옴');
need(r.tags.includes("dairy")&&r.tags.includes("lactose"),'NFD 한글 알레르기 태그');
// 결과 순서: 같은 판정 묶음 안에서 이름이 똑같은 음식이 자모만 겹치는 음식보다 앞
const ord=await p.evaluate(()=>{const keep=S.foodQ; S.foodQ="김"; const rows=foodSearchData().rows; S.foodQ=keep;
  const sorted=rows.every((x,i)=>i===0||rows[i-1].s.level!==x.s.level||rows[i-1].r<=x.r);
  const lv=rows.find(x=>x.f.id==="laver"), mv=rows.find(x=>x.f.id==="steamed_mandu");
  EX={q:"계란찜",date:today()}; const first=(exListHTML().match(/data-v="([a-z_0-9]+)"/)||[])[1];
  return {sorted,laverRank:lv&&lv.r,manduRank:mv&&mv.r,first}});
console.log('order',JSON.stringify(ord));
need(ord.sorted&&ord.laverRank===0&&ord.manduRank===3,'"김" 검색 순서(같은 판정 안에서 이름 일치가 먼저)');
need(ord.first==="egg_steamed",'먹은 음식 추가 창 첫 결과');
// 조합 단계별 결과 수
await p.evaluate(()=>{SCR=null;S.tab="food";S.foodSub="search";S.foodQ="";render()});
const cdp=await p.context().newCDPSession(p); await p.focus('#foodQ');
const steps=[];
const st=async t=>{await cdp.send('Input.imeSetComposition',{text:t,selectionStart:t.length,selectionEnd:t.length}); await p.waitForTimeout(60); steps.push([await p.inputValue('#foodQ'), await p.evaluate(()=>[...document.querySelectorAll('#foodRes .fcard b')].map(x=>x.textContent).filter(n=>n.includes('우유')).length)])};
await st('ㅇ'); await st('우'); await st('웅'); await cdp.send('Input.insertText',{text:'우'}); await st('유'); await cdp.send('Input.insertText',{text:'유'}); await p.waitForTimeout(80);
steps.push(['final',await p.inputValue('#foodQ')]);
console.log('steps',JSON.stringify(steps));
need(steps[1][1]>0&&steps[1][1]===steps[2][1]&&steps[2][1]===steps[3][1]&&steps[4][1]==="우유",'한글 조합 중간에 결과 수가 흔들림');
// 조합이 깨진 키보드처럼 낱자로 들어오는 경우
await p.fill('#foodQ',''); await p.keyboard.insertText('ㅇ'); await p.keyboard.insertText('ㅜ'); await p.keyboard.insertText('ㅇ'); await p.keyboard.insertText('ㅠ'); await p.waitForTimeout(80);
const jt=await p.evaluate(()=>[...document.querySelectorAll('#foodRes .fcard b')].map(x=>x.textContent).slice(0,3));
console.log('jamoTyped',await p.inputValue('#foodQ'),jt); need(jt.includes('우유'),'낱자 입력 검색');
// Enter: 검색칸은 키보드 닫기(blur)
await p.focus('#foodQ'); await p.keyboard.press('Enter'); const eb=await p.evaluate(()=>document.activeElement.id||document.activeElement.tagName);
console.log('enterBlur',eb); need(eb!=='foodQ','Enter로 키보드가 닫히지 않음');
if(F.length){ console.log('FAIL '+F.join(' / ')); process.exitCode=1 }
console.log('errors',errs); await b.close();})();
