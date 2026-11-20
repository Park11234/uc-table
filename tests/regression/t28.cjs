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
const { chromium } = require('playwright'); const fs=require('fs');

// 검증용: 출력한 줄을 모아 두고 끝에서 기대값과 비교한다(v1.5.0)
const __LOG=[]; {const __o=console.log; console.log=(...a)=>{__LOG.push(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ')); __o(...a)}}
const logOf=k=>{const l=__LOG.find(x=>x===k||x.startsWith(k+' ')); return l==null?null:l.slice(k.length).trim()};
const jsonOf=k=>{const v=logOf(k); if(v==null) return null; try{return JSON.parse(v)}catch(e){return v}};
const lineJSON=pre=>{const l=__LOG.find(x=>x.startsWith(pre)); if(l==null) return null; try{return JSON.parse(l)}catch(e){return null}};
const FAILS=[]; const expect=(c,m)=>{let ok=false; try{ok=typeof c==='function'?!!c():!!c}catch(e){m+=' ('+e.message+')'} if(!ok) FAILS.push(m)};
const __done=()=>{ if(FAILS.length){ console.error('FAIL\n'+FAILS.join('\n')); process.exitCode=1 } else console.log('검증 통과') };
// v1.7.1 내 정보 편집 화면: '저장'을 눌러야 반영되고, 저장하지 않고 나가려 하면 확인을 받는다
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
await p.goto('file://'+WRAP('t28.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.consent={date:today()};S.profile.allergies=[];S.profile.allergyOther="";S.profile.height="";S.orders={checked:[],fluidMl:"",other:[]};S.tab="me";SCR=null;render()});
const stored=()=>p.evaluate(()=>JSON.parse(localStorage.getItem(KEY)));
// 1) 알레르기: 바꾸고 뒤로 → 확인 시트, 기록은 그대로
await p.click('[data-act=openScr][data-v=set-allergy]'); await p.waitForTimeout(200);
console.log('bar', await p.evaluate(()=>[!!document.querySelector('.bottom-bar [data-act=peSave]'), !!document.querySelector('.bottom-bar [data-act=back]'), document.querySelector('#main').textContent.includes("'저장'을 눌러야")]));
await p.locator('input[data-act=allergyT][data-v=peanut]').check({force:true}); await p.fill('#p_allergyOther','망고'); await p.waitForTimeout(100);
await p.click('[data-act=back]'); await p.waitForTimeout(200);
console.log('askBack', await p.evaluate(()=>[!!document.querySelector('#sheetRoot [data-act=peSave]'), SCR&&SCR.name, S.profile.allergies.includes('peanut'), S.profile.allergyOther]));
console.log('storedUnchanged', JSON.stringify(await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem(KEY)); return [o.profile.allergies, o.profile.allergyOther]})));
// 계속 고치기 → 입력이 그대로
await p.click('#sheetRoot [data-act=closeSheet]'); await p.waitForTimeout(150);
console.log('keep', await p.evaluate(()=>[SCR&&SCR.name, document.querySelector('#p_allergyOther').value, document.querySelector('input[data-act=allergyT][data-v=peanut]').checked]));
// 저장하지 않고 나가기 → 버려짐
await p.click('[data-act=back]'); await p.waitForTimeout(150); await p.click('#sheetRoot [data-act=peDiscard]'); await p.waitForTimeout(200);
console.log('discard', await p.evaluate(()=>[SCR, S.profile.allergies.includes('peanut'), S.profile.allergyOther, PE]));
// 다시 열어 바꾸고 '저장' → 반영·기기에 저장·안내
await p.click('[data-act=openScr][data-v=set-allergy]'); await p.waitForTimeout(200);
console.log('reopenClean', await p.evaluate(()=>[document.querySelector('#p_allergyOther').value, document.querySelector('input[data-act=allergyT][data-v=peanut]').checked]));
await p.locator('input[data-act=allergyT][data-v=peanut]').check({force:true}); await p.fill('#p_allergyOther','망고');
await p.click('.bottom-bar [data-act=peSave]'); await p.waitForTimeout(200);
console.log('saved', await p.evaluate(()=>[SCR, S.profile.allergies.includes('peanut'), S.profile.allergyOther, document.body.textContent.includes('저장했습니다')]));
const st=await stored(); console.log('storedSaved', JSON.stringify([st.profile.allergies, st.profile.allergyOther]));
// 저장한 뒤 음식 판정에 반영(땅콩 → 피하기)
console.log('judge', await p.evaluate(()=>foodStatus(FOOD.peanut).level));
// 2) 바꾸지 않았으면 확인 없이 나감
await p.click('[data-act=openScr][data-v=set-profile]'); await p.waitForTimeout(200); await p.click('[data-act=back]'); await p.waitForTimeout(150);
console.log('cleanBack', await p.evaluate(()=>[SCR, !!document.querySelector('#sheetRoot').firstChild]));
// 3) 기본 정보: 성별 버튼·숫자 → 시트에서 '저장하고 나가기'
await p.click('[data-act=openScr][data-v=set-profile]'); await p.waitForTimeout(200);
await p.fill('#p_height','172'); await p.click('[data-act=sex][data-v=M]'); await p.waitForTimeout(100);
console.log('liveDraft', await p.evaluate(()=>[document.querySelector('#p_height').value, S.profile.height, PE&&PE.profile.sex]));
await p.click('[data-act=back]'); await p.waitForTimeout(150); await p.click('#sheetRoot [data-act=peSave]'); await p.waitForTimeout(200);
console.log('saveFromSheet', await p.evaluate(()=>[SCR, S.profile.height, S.profile.sex, !!document.querySelector('#sheetRoot').firstChild]));
// 4) 의료진 지시: 추가 버튼을 안 눌렀어도 적어 둔 기타 지시는 저장에 포함, 스위치도
await p.click('[data-act=openScr][data-v=set-orders]'); await p.waitForTimeout(200);
await p.locator('input[data-act=order][data-v=lowfat]').check({force:true}); await p.fill('#orderAdd','우유는 하루 1컵까지');
await p.click('.bottom-bar [data-act=peSave]'); await p.waitForTimeout(200);
console.log('orders', JSON.stringify(await p.evaluate(()=>[S.orders.checked, S.orders.other, JSON.parse(localStorage.getItem(KEY)).orders.other])));
// 5) 식성: 싫어하는 음식
await p.click('[data-act=openScr][data-v=set-diet]'); await p.waitForTimeout(200);
await p.fill('#p_dislikes','고등어'); await p.fill('#p_budgetMonth','15'); const tierLive=await p.textContent('#p_budgetTier'); await p.click('.bottom-bar [data-act=peSave]'); await p.waitForTimeout(200);
console.log('diet', JSON.stringify(await p.evaluate(()=>[S.profile.dislikes, S.profile.budget, S.profile.budgetMonth])), tierLive);
console.log('errors', errs);
expect(()=>jsonOf('bar').every(Boolean),'저장·취소 버튼과 안내');
expect(()=>{const a=jsonOf('askBack'); return a[0]===true&&a[1]==='set-allergy'&&a[2]===false&&a[3]===''},'저장 안 하고 뒤로 → 확인, 기록은 그대로');
expect(()=>{const a=JSON.parse(logOf('storedUnchanged')); return a[0].length===0&&a[1]===''},'기기에도 저장되지 않음');
expect(()=>{const a=jsonOf('keep'); return a[0]==='set-allergy'&&a[1]==='망고'&&a[2]===true},'계속 고치기는 입력 유지');
expect(()=>{const a=jsonOf('discard'); return a[0]===null&&a[1]===false&&a[2]===''&&a[3]===null},'저장하지 않고 나가기는 버림');
expect(()=>{const a=jsonOf('reopenClean'); return a[0]===''&&a[1]===false},'다시 열면 저장된 값부터');
expect(()=>{const a=jsonOf('saved'); return a[0]===null&&a[1]===true&&a[2]==='망고'&&a[3]===true},'저장 버튼으로 반영·안내');
expect(()=>{const a=JSON.parse(logOf('storedSaved')); return a[0].includes('peanut')&&a[1]==='망고'},'기기에 저장');
expect(()=>logOf('judge')==='ban','저장한 알레르기가 판정에 반영(v1.11.0 R-15: 절대 금지)');
expect(()=>{const a=jsonOf('cleanBack'); return a[0]===null&&a[1]===false},'바꾸지 않았으면 바로 나감');
expect(()=>{const a=jsonOf('liveDraft'); return a[0]==='172'&&a[1]===''&&a[2]==='M'},'저장 전에는 초안에만');
expect(()=>{const a=jsonOf('saveFromSheet'); return a[0]===null&&a[1]==='172'&&a[2]==='M'&&a[3]===false},'확인 시트에서 저장하고 나가기');
expect(()=>{const a=JSON.parse(logOf('orders')); return a[0].includes('lowfat')&&a[1].includes('우유는 하루 1컵까지')&&a[2].includes('우유는 하루 1컵까지')},'지시 스위치·적어 둔 기타 지시 저장');
expect(()=>{const a=JSON.parse(logOf('diet').split(' ')[0]); return a[0]==='고등어'&&a[1]==='알뜰'&&a[2]===15&&/알뜰/.test(logOf('diet'))},'식성·한 달 식비(15만원 → 알뜰) 저장');
expect(()=>JSON.parse(logOf('errors')||'[]').length===0||logOf('errors')==='[]','오류 없음');
__done(); await b.close()})();
