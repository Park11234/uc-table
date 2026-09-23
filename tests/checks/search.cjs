const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const WRAP=n=>{const p=T(n); if(!fs_.existsSync(p)) fs_.writeFileSync(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
// 검색 일치 규칙 단위 점검 + 조합 중간 단계마다 결과가 유지되는지
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('ime.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{S.consent={date:today(),ai:false};
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
// 조합 단계별 결과 수
await p.evaluate(()=>{SCR=null;S.tab="food";S.foodSub="search";S.foodQ="";render()});
const cdp=await p.context().newCDPSession(p); await p.focus('#foodQ');
const steps=[];
const st=async t=>{await cdp.send('Input.imeSetComposition',{text:t,selectionStart:t.length,selectionEnd:t.length}); await p.waitForTimeout(60); steps.push([await p.inputValue('#foodQ'), await p.evaluate(()=>[...document.querySelectorAll('#foodRes .fcard b')].map(x=>x.textContent).filter(n=>n.includes('우유')).length)])};
await st('ㅇ'); await st('우'); await st('웅'); await cdp.send('Input.insertText',{text:'우'}); await st('유'); await cdp.send('Input.insertText',{text:'유'}); await p.waitForTimeout(80);
steps.push(['final',await p.inputValue('#foodQ')]);
console.log('steps',JSON.stringify(steps));
// 조합이 깨진 키보드처럼 낱자로 들어오는 경우
await p.fill('#foodQ',''); await p.keyboard.insertText('ㅇ'); await p.keyboard.insertText('ㅜ'); await p.keyboard.insertText('ㅇ'); await p.keyboard.insertText('ㅠ'); await p.waitForTimeout(80);
console.log('jamoTyped',await p.inputValue('#foodQ'),await p.evaluate(()=>[...document.querySelectorAll('#foodRes .fcard b')].map(x=>x.textContent).slice(0,3)));
// Enter: 검색칸은 키보드 닫기(blur)
await p.focus('#foodQ'); await p.keyboard.press('Enter'); console.log('enterBlur',await p.evaluate(()=>document.activeElement.id||document.activeElement.tagName));
console.log('errors',errs); await b.close();})();
