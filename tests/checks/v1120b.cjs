const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
// 공통 안전장치: 어느 페이지에서든 잡히지 않은 오류(pageerror)가 나면 이 점검을 실패로 끝낸다
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}

/* v1.12.0 검토 후속 수정: 검토 보고서 항목을 고친 뒤 그대로 유지되는지 확인한다. 항목 번호는 보고서의 번호. */
const { chromium } = require('playwright'); const fs=require('fs');
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const page=T('v1120b.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
(async()=>{
  const b=await chromium.launch();
  const open=async()=>{const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
    await p.route(/^https?:/, r=>r.fulfill({body:''}));
    await p.goto('file://'+page); await p.waitForFunction(()=>typeof render==="function"&&!!document.querySelector('#main').firstChild,null,{timeout:20000});
    await p.evaluate(()=>{S.consent={date:today()}; S.onb="done"; S.stageMode="3"; save(); render()}); return p};

  console.log('== 술: 모든 단계에서 절대 금지');
  {const p=await open();
    const r=await p.evaluate(()=>{const o={};
      for(const st of ["1","2","3"]){ S.stageMode=st; save(); o["s"+st]=foodStatus(FOOD.alcohol).level }
      const f=foodStatus(FOOD.alcohol); o.why=f.reasons.join(" / ");
      o.beer=exactFood("맥주")?.id; MJ.items=[{name:"맥주",ingr:[],conf:1}]; mjJudge(); o.mj=MJ.results[0].level;
      o.plain=foodStatus(FOOD.rice_porridge||FOOD.white_rice).level;
      o.taggedOthers=Object.values(FOOD).filter(x=>x.tags.includes("alcohol")).map(x=>x.id);
      return o});
    need(["s1","s2","s3"].every(k=>r[k]==="ban"),`술 = 1·2·3단계 모두 절대 금지 (${r.s1}/${r.s2}/${r.s3})`);
    need(/절대 금지/.test(r.why)&&!/조금만|소량만/.test(r.why),`술 이유 문장 (${r.why.slice(0,60)})`);
    need(r.beer==="alcohol"&&r.mj==="ban",`외식 판정에 '맥주'를 넣으면 절대 금지 (${r.beer}, ${r.mj})`);
    need(r.plain!=="ban",`술이 아닌 음식은 절대 금지가 아님 (${r.plain})`);
    need(r.taggedOthers.join()==="alcohol",`술 표시가 달린 음식은 술 하나뿐 (${r.taggedOthers.join()})`);
    await p.context().close()}

  console.log('== 보고서 2번: 갑각류 낱말(대하·게맛살·랍스터·가재·크릴)과 교차 반응 표시');
  {const p=await open();
    const r=await p.evaluate(()=>{const o={}; const has=(t,k)=>tagsOfText(t,[]).includes(k);
      o.tags=[has("대하구이","shrimp"),has("게맛살 김밥","crab"),has("랍스터 구이","crust"),has("바닷가재찜","crust"),has("크릴오일","crust"),has("가재미조림","crust"),has("새우볶음밥","crust")];
      const lv=(n)=>ruleCheck({name:n,ingr:[]});
      S.profile.allergies=[]; save(); o.none=["대하구이","게맛살 김밥","랍스터 구이"].map(n=>lv(n).level);
      S.profile.allergies=["shrimp"]; save(); o.shr={dh:lv("대하구이").level,lob:lv("랍스터 구이"),jim:lv("가재미조림").level};
      S.profile.allergies=["crab"]; save(); o.crb={gm:lv("게맛살 김밥").level,dh:lv("대하구이"),krill:labelCheck("정제소금, 크릴오일","오메가3")};
      o.crbKrill=[o.crb.krill.overall,o.crb.krill.rows.filter(x=>/교차/.test(x.title+x.why)).length];
      S.profile.allergies=[]; save(); return o});
    need(r.tags.slice(0,5).every(Boolean)&&!r.tags[5]&&!r.tags[6],`낱말: 대하→새우, 게맛살→게, 랍스터·바닷가재·크릴→갑각류, 가재미(생선)는 아님 (${r.tags.join(",")})`);
    need(r.none.every(l=>l!=="ban"),`알레르기가 없으면 절대 금지가 아님 (${r.none.join(",")})`);
    need(r.shr.dh==="ban"&&r.shr.lob.level==="avoid"&&/교차/.test(r.shr.lob.reasons.join(" "))&&r.shr.jim!=="avoid"&&r.shr.jim!=="ban",`새우 알레르기: 대하구이 절대 금지, 랍스터는 교차 반응 피하기, 가재미는 영향 없음 (${r.shr.dh}/${r.shr.lob.level}/${r.shr.jim})`);
    need(r.crb.gm==="ban"&&r.crb.dh.level==="avoid"&&/교차/.test(r.crb.dh.reasons.join(" ")),`게 알레르기: 게맛살 절대 금지, 대하구이는 교차 반응 피하기 (${r.crb.gm}/${r.crb.dh.level})`);
    need(r.crbKrill[0]==="avoid"&&r.crbKrill[1]===1,`게 알레르기: 포장 원재료의 크릴도 교차 반응 (${r.crbKrill.join(",")})`);
    await p.context().close()}

  console.log('== 보고서 1번: 레시피에도 갑각류 교차 반응 경고');
  {const p=await open();
    const r=await p.evaluate(()=>{const byName=n=>Object.values(RECIPES).find(x=>x.name===n);
      const names=["푸딩 계란찜","감자국","물로 볶는 애호박볶음","메밀온면","순두부 계란찜","새우볶음","뒷다리살 수육"];
      const cross=(n,c)=>recipeNotes(byName(n),c).filter(x=>/교차/.test(x.t));
      const o={};
      S.profile.allergies=[]; save(); o.none=names.map(n=>cross(n).length);
      S.profile.allergies=["crab"]; save(); o.crab=names.map(n=>cross(n).map(x=>[x.hard||false,x.found]));
      o.crabOk=names.map(n=>recipeNotes(byName(n)).some(x=>x.hard));
      S.profile.allergies=["shrimp"]; save(); o.shrimp=names.map(n=>cross(n).length);
      o.shrimpHard=recipeNotes(byName("푸딩 계란찜")).some(x=>x.hard);
      o.sundubu=recipeNotes(byName("순두부 계란찜")).filter(x=>/교차/.test(x.t)).length;
      S.profile.allergies=[]; save(); return o});
    need(r.none.every(n=>n===0),`알레르기가 없으면 교차 반응 경고 없음 (${r.none.join(",")})`);
    need([0,1,2,3,5,6].every(i=>r.crab[i].length===1&&r.crab[i][0][0]===false&&/새우/.test(r.crab[i][0][1])),`게 알레르기: 새우젓·새우가 든 레시피에 '다른 갑각류' 경고 한 번(레시피를 빼지는 않음) (${JSON.stringify(r.crab).slice(0,110)})`);
    need(r.crab[4].length===0&&r.crabOk[4],`게 알레르기: 게맛살이 든 레시피는 직접 알레르기 경고(막힘)이고 교차 경고는 겹쳐 붙지 않음 (${JSON.stringify(r.crab[4])}, 막힘 ${r.crabOk[4]})`);
    need(r.crabOk.slice(0,4).every(h=>!h),`교차 반응 경고만으로는 '꼭 확인' 막힘이 되지 않음 (${r.crabOk.join(",")})`);
    need(r.shrimp.join()==="0,0,0,0,1,0,0"&&r.shrimpHard,`새우 알레르기: 새우 든 레시피는 직접 알레르기 경고(막힘)만, 게맛살 레시피(순두부 계란찜)만 교차 경고 (${r.shrimp.join(",")})`);
    await p.context().close()}

  console.log('== 보고서 3번: 면역 약 날음식 낱말(양·크기 말, 새 낱말, 잘못 걸리는 말)');
  {const p=await open();
    const r=await p.evaluate(()=>{const hit=n=>rawWords(n).length>0;
      const yes=["광어회 2인분","모둠회 대","모둠회(대)","광어회 소 2인","해삼","개불","생간","굴무침","연어 사시미","육회 1접시","생굴"];
      const no=["장어초밥","계란초밥","달걀초밥","석회","초밥식초","생간장","유부초밥","문어숙회","명란젓","회오리감자","해삼탕","볶음밥 2인분"];
      const o={yes:yes.filter(n=>!hit(n)),no:no.filter(hit)};
      S.profile.meds=["steroid"]; save(); const lv=n=>ruleCheck({name:n,ingr:[]}).level;
      o.on=[lv("광어회 2인분"),lv("장어초밥"),lv("모둠회 대")];
      o.label=[labelCheck("쌀, 식초, 석회, 소금","초밥 소스").overall,labelCheck("쌀, 해삼, 소금","해삼 무침").overall];
      S.profile.meds=[]; save(); o.off=lv("광어회 2인분"); return o});
    need(r.yes.length===0,`날음식으로 잡아야 하는 말을 모두 잡음 (놓친 것: ${r.yes.join(", ")||"없음"})`);
    need(r.no.length===0,`익힌 음식·재료는 잡지 않음 (잘못 잡힌 것: ${r.no.join(", ")||"없음"})`);
    need(r.on[0]==="avoid"&&r.on[2]==="avoid"&&r.on[1]!=="avoid",`면역 약을 쓰면 광어회 2인분·모둠회 대는 피하기, 장어초밥은 날음식 이유 없음 (${r.on.join(",")})`);
    need(r.label[0]!=="avoid"&&r.label[1]==="avoid",`포장 원재료: 식초·석회는 날음식이 아니고 해삼은 날음식 (${r.label.join(",")})`);
    need(r.off!=="avoid",`약이 없으면 날음식 이유가 붙지 않음 (${r.off})`);
    await p.context().close()}

  console.log('== 보고서 4번: 같은 날 두 번째 초기화가 첫 "초기화 전 보관본"을 덮지 않음');
  {const p=await open();
    const r=await p.evaluate(async()=>{
      S.logs[today()]={...BLANK_LOG(),day:3,night:0,memo:"첫번째 기록 메모"}; save();
      const reset=async()=>{const bt=document.createElement('button'); bt.dataset.act='reset'; document.body.appendChild(bt); bt.click();
        document.getElementById('rstAll').checked=false; document.querySelector('#sheetRoot [data-act=resetDo]').click(); await new Promise(r=>setTimeout(r,50))};
      await reset();                                   // 1차: 기록이 있는 채로 초기화
      await new Promise(r=>setTimeout(r,1100));        // 두 초기화의 시각이 달라지게
      await reset();                                   // 2차: 이미 빈 기록으로 초기화
      const all=await idb("snaps","readonly",st=>st.getAll()); const mine=all.filter(x=>x.date.endsWith("~before-reset"));
      AUTO.snaps=null; await snapList(); SCR={name:"set-data"}; render();
      return {n:mine.length, withMemo:mine.filter(x=>x.json.includes("첫번째 기록 메모")).length, label:document.querySelector('#main').innerText.split("초기화 전 보관본").length-1}});
    need(r.n===2&&r.withMemo===1,`두 번 초기화하면 보관본이 둘이고 첫 기록이 남음 (보관본 ${r.n}개, 첫 기록 든 것 ${r.withMemo}개)`);
    need(r.label===2,`백업 화면에 "초기화 전 보관본"이 둘 보임 (${r.label})`);
    await p.context().close()}

  console.log('== 보고서 6번: 백업 합치기에서 알레르기는 한쪽만 남기지 않고 합침');
  {const p=await open();
    const r=await p.evaluate(()=>{
      const cur=normalizeState({...S,profile:{...S.profile,allergies:["egg"],allergyOther:"사과, 키위"}});
      const bk =normalizeState({...S,profile:{...S.profile,allergies:["crab","shrimp","egg"],allergyOther:"키위 , 망고"}});
      const {m,st}=mergeCore(cur,bk), out=mergeStates(cur,bk);
      const empty=mergeStates(normalizeState({...S,profile:{...S.profile,allergies:[],allergyOther:""}}),bk);
      const same=mergeCore(cur,cur).st.alAdd;
      return {al:out.profile.allergies,other:out.profile.allergyOther,alAdd:st.alAdd,emptyAl:empty.profile.allergies,emptyOther:empty.profile.allergyOther,same,
        st2:mergeCore(normalizeState({...S,profile:{...S.profile,allergies:[],allergyOther:""}}),bk).st.alAdd}});
    need(r.al.join()==="egg,crab,shrimp",`지금 '알류' + 백업 '게·새우' = 셋 다 (${r.al.join()})`);
    need(r.other==="사과, 키위, 망고",`직접 적은 알레르기도 합침, 같은 말은 한 번만 (${r.other})`);
    need(r.alAdd===3,`합쳐서 더해진 알레르기 수 = 게·새우·망고 (${r.alAdd})`);
    need(r.emptyAl.join()==="crab,shrimp,egg"&&r.emptyOther==="키위, 망고"&&r.st2===5,`지금 알레르기가 비어 있으면 백업 것을 그대로 (${r.emptyAl.join()} / ${r.emptyOther} / ${r.st2})`);
    need(r.same===0,`똑같은 기록끼리는 더해진 것이 없음 (${r.same})`);
    // 불러오기 창의 합치기 설명에 알레르기가 보임
    const t=await p.evaluate(()=>{S.profile.allergies=["egg"]; S.logs[today()]={...BLANK_LOG(),day:2}; save();
      const bk=JSON.parse(backupJSON()); bk.profile.allergies=["egg","crab"]; restoreFromText(JSON.stringify(bk));
      return document.querySelector('#sheetRoot').innerText});
    need(/알레르기 1개/.test(t),`불러오기 창: 합치면 "알레르기 1개"가 더해진다고 보임 (${(t.match(/합치면[^.]*\./)||[""])[0]})`);
    await p.context().close()}

  console.log('== 보고서 7번: 검사 수치·바코드 연결·처음 고른 상태도 "백업 뒤 바뀐 날"에 잡힘');
  {const p=await open();
    const r=await p.evaluate(()=>{const o={};
      const touch=(name,fn)=>{S.chgDays=[]; save(); fn(); save(); o[name]=S.chgDays.length};
      touch("labs",()=>{S.labs.push({date:today(),k:S.labs.length?S.labs[0].k:LAB_KINDS[0][0],v:"5",note:""})});
      touch("barcodes",()=>{S.barcodes["8801234567890"]={id:Object.keys(FOOD)[0],date:today()}});
      touch("stageInit",()=>{S.stageInit={s:2,date:today(),pick:2}});
      touch("profile",()=>{S.profile.age="41"});
      touch("tab",()=>{S.tab="log"; S.foodQ="x"});   // 화면 상태는 데이터가 아님
      return o});
    need(r.labs===1&&r.barcodes===1&&r.stageInit===1,`검사 수치·바코드 연결·처음 고른 상태를 바꾸면 오늘이 '바뀐 날'에 들어감 (${JSON.stringify(r)})`);
    need(r.profile===1&&r.tab===0,`기존 항목은 그대로 잡히고 화면 상태(탭·검색어)는 안 잡힘 (${r.profile}/${r.tab})`);
    await p.context().close()}

  console.log('== 보고서 9번: 열쇠를 못 지우면 이번 실행도 평문 백업을 내보내지 않음(저장소가 아예 없으면 그대로 꺼짐)');
  {const p=await open();
    const r=await p.evaluate(async()=>{const o={};
      await encSet("pw-test-1234");
      // 열쇠 지우기만 실패
      const orig=idb; idb=async(st,mode,fn)=>{ if(st==="kv"&&mode==="readwrite") throw new Error("x"); return orig(st,mode,fn)};
      o.okFail=await wipeLocalCopies(); idb=orig;
      o.readyFail=ENC.ready; o.keyFail=!!ENC.key;
      const out=await backupOut(); o.encrypted=isEncBackup(JSON.parse(out));   // 남은 열쇠를 다시 읽어 암호화한 백업이 나옴
      // 정상: 열쇠가 지워지고 꺼짐
      await encSet("pw-test-1234"); o.okNormal=await wipeLocalCopies(); o.readyNormal=ENC.ready; o.keyNormal=!!ENC.key;
      o.plainAfter=!isEncBackup(JSON.parse(await backupOut()));
      return o});
    need(r.okFail===false&&r.readyFail===false&&r.keyFail===false,`열쇠 지우기 실패: 실패를 알리고 '꺼짐'(ready)으로 두지 않음 (ok ${r.okFail}, ready ${r.readyFail})`);
    need(r.encrypted,`열쇠가 남아 있으면 그 뒤 백업은 암호화되어 나옴 (${r.encrypted})`);
    need(r.okNormal===true&&r.readyNormal===true&&r.keyNormal===false&&r.plainAfter,`정상 초기화: 열쇠가 지워지고 꺼짐, 백업은 평문 (ok ${r.okNormal}, ready ${r.readyNormal}, 평문 ${r.plainAfter})`);
    await p.context().close()}
  {const p=await open();
    const r=await p.evaluate(async()=>{ Object.defineProperty(window,"indexedDB",{get:()=>undefined,configurable:true});   // 저장소(IndexedDB)가 없는 환경
      const ok=await wipeLocalCopies(); return {ok,ready:ENC.ready}});
    need(r.ready===true,`저장소가 없으면 초기화 뒤에도 그대로 꺼짐(백업이 막히지 않음) (ready ${r.ready}, 결과 ${r.ok})`);
    await p.context().close()}

  console.log('== 보고서 10번: 손으로 고친 백업의 나트륨·비타민 D 값을 숫자로 정리');
  {const p=await open();
    const r=await p.evaluate(()=>{const d=today();
      const mk=ex=>normalizeState({...JSON.parse(JSON.stringify(S)),extras:{[d]:ex}});
      const a=mk([{name:"테스트 A",kcal:100,na:"1800",vd:"5"},{name:"테스트 B",kcal:50,na:"600",vd:"2.5"},{name:"테스트 C",kcal:10,na:"abc",vd:-3},{name:"테스트 D",kcal:10},{name:"테스트 E",kcal:10,na:{},vd:null}]);
      const keep=S; S=a; const t=eatenTotals(d); S=keep;
      return {types:a.extras[d].map(x=>[typeof x.na,typeof x.vd]).flat().every(x=>x==="number"),na:t.na,vd:t.vd,vals:a.extras[d].map(x=>[x.na,x.vd])}});
    need(r.types,`na·vd가 모두 숫자 (${JSON.stringify(r.vals)})`);
    need(r.na===2400&&r.vd===7.5,`합계: 나트륨 ${r.na}mg(1800+600), 비타민 D ${r.vd}μg(5+2.5), 문자·음수·빈 값은 0`);
    await p.context().close()}

  console.log('== C-06 후속: 몸 상태가 나쁘면 배변 기준을 채워도 "편안한 하루"라고 하지 않음');
  {const p=await open();
    const r=await p.evaluate(()=>{S.stageMode="auto"; const t=today(); const one=well=>{S.logs={}; S.logs[t]={...BLANK_LOG(),day:2,night:0,well}; save(); S.tab="plan"; SCR=null; render(); const x=ridgeText(); return {head:x.head,sub:x.sub,stage:currentStage().stage}};
      return {good:one(0),worst:one(4),poor:one(2)}});
    need(r.good.head==="편안한 하루입니다"&&r.good.stage===3,`몸 상태 아주 좋음: 편안한 하루 (${r.good.head})`);
    need(r.worst.head!=="편안한 하루입니다"&&r.poor.head!=="편안한 하루입니다",`몸 상태 최악·나쁨: 편안한 하루라고 하지 않음 (${r.worst.head} / ${r.poor.head})`);
    need(r.worst.stage===3&&/관해 기준/.test(r.worst.sub),`식단 단계 기준 문장은 그대로(단계 판정은 바꾸지 않음) (${r.worst.stage}, ${r.worst.sub})`);
    await p.context().close()}

  console.log('== 알코올(주정·에탄올·술)은 절대 금지, 요리에 넣는 맛술·미림·청주는 막지 않음');
  {const p=await open();
    const r=await p.evaluate(()=>{const o={}; const lv=n=>ruleCheck({name:n,ingr:[]}).level;
      const prod=Object.values(FOOD).filter(f=>INGR[f.id]&&alcWords(INGR[f.id],true).length);
      o.prodN=prod.length; o.prodBan=prod.filter(f=>foodStatus(f).level==="ban").length;
      o.prodWords=[...new Set(prod.flatMap(f=>alcWords(INGR[f.id],true)))].sort().join(",");
      const one=n=>Object.values(FOOD).find(f=>f.name===n);
      o.named=["목캔디 허브","비비고 소고기장조림","몽쉘 오리지널"].map(n=>{const f=one(n); return f?foodStatus(f).level:null});
      o.reason=foodStatus(prod[0]).reasons.join(" / ");
      const cookOnly=Object.values(FOOD).filter(f=>INGR[f.id]&&/미림|맛술|청주/.test(INGR[f.id])&&!/주정|에탄올|증류주|맥주|막걸리|위스키|알코올|알콜/.test(INGR[f.id]));   // alcWords를 쓰지 않는 따로 만든 기준
      o.cookN=cookOnly.length; o.cookBan=cookOnly.filter(f=>foodStatus(f).reasons.some(x=>/원재료에 알코올\(/.test(x))).length;
      const clean=Object.values(FOOD).filter(f=>INGR[f.id]&&!/주정|에탄올|증류주|맥주|막걸리|위스키|알코올|알콜|술|와인|청주|소주|과실주|미림/.test(INGR[f.id]));
      o.cleanAlcReason=clean.filter(f=>foodStatus(f).reasons.some(x=>/원재료에 알코올\(/.test(x))).length;
      const all=new Set(Object.keys(FOOD)), ids=Object.keys(RECIPES);
      o.recipeWine=ids.filter(id=>/맛술|미림|청주|소주/.test(RECIPES[id].ingr)).length;
      o.recipeBlocked=ids.filter(id=>/맛술|미림|청주|소주/.test(RECIPES[id].ingr)&&recipeOK(id,all)===false).length;
      o.ban=Object.fromEntries(["청주 한 잔","와인","소주","막걸리","맥주","무알코올 맥주","주정","에탄올","위스키 한잔"].map(n=>[n,lv(n)]));
      o.cook=Object.fromEntries(["맛술 두부조림","생강술 구이","미림 불고기"].map(n=>[n,lv(n)]));
      o.safe=Object.fromEntries(["간장 큰술","영양주먹밥","맥주효모","와인식초 드레싱","무알코올 음료","기술 센터","흰쌀죽"].map(n=>[n,lv(n)]));
      const lab=t=>labelCheck(t,""); const hasAlc=t=>lab(t).rows.filter(x=>x.title==="알코올").length;
      o.labBan=["정제수,주정,향료","정제수,맥주","정제수,에탄올"].map(t=>[lab(t).overall,hasAlc(t)]);
      o.labCook=["간장,청주,미림","맛술(주정,물엿),설탕","과실주(화이트와인),소금","정제수,소주"].map(hasAlc);
      o.labFound=(lab("정제수,주정,맥주").rows.find(x=>x.title==="알코올")||{found:[]}).found.join("·");
      return o});
    need(r.prodN>=40&&r.prodBan===r.prodN,`원재료에 주정·에탄올·증류주가 든 포장 식품 ${r.prodN}개 모두 절대 금지 (${r.prodBan})`);
    need(!/청주|미림|맛술|와인|소주|과실주/.test(r.prodWords),`금지로 잡힌 낱말에 요리용 술이 없음 (${r.prodWords})`);
    need(r.named.every(l=>l==="ban"),`대표 제품(목캔디·장조림·몽쉘) 절대 금지 (${r.named.join(",")})`);
    need(/알코올/.test(r.reason)&&/절대 금지/.test(r.reason),`이유 문장에 알코올과 절대 금지 (${r.reason.slice(0,70)})`);
    need(r.cookN>=10&&r.cookBan===0,`미림·맛술·청주만 든 포장 식품 ${r.cookN}개는 알코올 이유가 붙지 않음 (${r.cookBan})`);
    need(r.cleanAlcReason===0,`알코올이 없는 제품에는 알코올 이유가 붙지 않음 (${r.cleanAlcReason})`);
    need(r.recipeWine>=15&&r.recipeBlocked===0,`맛술·미림·청주·소주가 든 레시피 ${r.recipeWine}개는 그대로 쓸 수 있음 (막힌 것 ${r.recipeBlocked})`);
    need(Object.values(r.ban).every(l=>l==="ban"),`외식·메뉴 글의 술 낱말은 절대 금지 (${JSON.stringify(r.ban)})`);
    need(Object.values(r.cook).every(l=>l!=="ban"),`요리용 맛술·생강술·미림은 금지 아님 (${JSON.stringify(r.cook)})`);
    need(Object.values(r.safe).every(l=>l!=="ban"),`큰술·영양주먹밥·맥주효모·와인식초·무알코올 표시·기술은 금지 아님 (${JSON.stringify(r.safe)})`);
    need(r.labBan.every(([o,n])=>o==="ban"&&n===1),`원재료명에 주정·맥주·에탄올이 있으면 절대 금지 (${JSON.stringify(r.labBan)})`);
    need(r.labCook.every(n=>n===0),`원재료명의 청주·미림·맛술(주정 표기 포함)·과실주·소주는 금지 아님 (${r.labCook})`);
    need(/주정/.test(r.labFound)&&/맥주/.test(r.labFound),`찾은 알코올 낱말을 보여 줌 (${r.labFound})`);
    await p.context().close()}

  console.log('== 당알코올(말티톨 등)은 알코올과 달리 피하기');
  {const p=await open();
    const r=await p.evaluate(()=>{const o={};
      const prod=Object.values(FOOD).filter(f=>INGR[f.id]&&polyWords(INGR[f.id]).length&&!alcWords(INGR[f.id],true).length);
      const bad=prod.filter(f=>!["avoid","ban","later"].includes(foodStatus(f).level)); o.prodN=prod.length; o.prodBad=bad.length;
      o.reason=foodStatus(prod.find(f=>foodStatus(f).level==="avoid")).reasons.join(" / ");
      o.notBan=prod.filter(f=>foodStatus(f).level==="ban"&&!foodStatus(f).reasons.some(x=>/아질산|알레르기|술|알코올/.test(x))).length;
      o.tagged=Object.values(FOOD).filter(f=>f.tags.includes("polyol")&&!["avoid","ban"].includes(foodStatus(f).level)).map(f=>f.id).join(",");
      const clean=Object.values(FOOD).filter(f=>INGR[f.id]&&!polyWords(INGR[f.id]).length&&!f.tags.includes("polyol"));
      o.cleanPoly=clean.filter(f=>foodStatus(f).reasons.some(x=>/당알코올/.test(x))).length;
      const lab=t=>labelCheck(t,""); const row=t=>lab(t).rows.filter(x=>/당알코올/.test(x.title)).map(x=>x.lv);
      o.lab=Object.fromEntries(["설탕,말티톨,정제수","정제수,에리스리톨","정제수,폴리글리시톨","정제수,D-소비톨","정제수,당알코올(말티톨액)"].map(t=>[t,row(t).join()]));
      S.orders.checked=[]; o.labPlain=lab("정제수,알룰로스,스테비아").rows.filter(x=>/당알코올/.test(x.title)).length;
      const m=n=>ruleCheck({name:n,ingr:[]}).level;
      o.menu=Object.fromEntries(["말티톨 초콜릿","에리스리톨 라떼","당알코올 젤리","소르비톨 시럽"].map(n=>[n,m(n)]));
      o.menuPlain=["스테비아 음료","알룰로스 케이크"].map(m);
      const N0={basis:"",basisUnit:"g",basisAmt:100,totalAmt:null,carb:null,sugar:null,polyol:null,fiber:null,protein:null,fat:null,sat:null,trans:null,sodium:null,calcium:null,kcal:100};
      const pr=v=>nutriCheck({...N0,polyol:v},100).rows.filter(x=>x.title==="당알코올").map(x=>x.lv).join();
      o.nutri=[pr(5),pr(0.5),pr(null)];   // 표시된 당알코올 g이 0보다 크면 피하기(주문 없이도), 없거나 0이면 없음
      o.nutri0=pr(0);
      o.alcNotPoly=Object.fromEntries(["당알코올 젤리"].map(n=>[n,ruleCheck({name:n,ingr:[]}).reasons.some(x=>/^알코올 포함 가능성/.test(x))]));
      return o});
    need(r.prodN>=60&&r.prodBad===0,`원재료에 당알코올이 든 포장 식품 ${r.prodN}개 모두 피하기 이상 (벗어난 것 ${r.prodBad})`);
    need(/당알코올/.test(r.reason)&&/피하기/.test(r.reason),`이유 문장에 당알코올과 피하기 (${r.reason.slice(0,60)})`);
    need(r.notBan===0,`당알코올만으로는 절대 금지가 되지 않음 (${r.notBan})`);
    need(r.tagged==="",`당알코올 표시가 있는 음식은 모두 피하기 이상 (${r.tagged})`);
    need(r.cleanPoly===0,`당알코올이 없는 제품에는 당알코올 이유가 붙지 않음 (${r.cleanPoly})`);
    need(Object.values(r.lab).every(v=>v==="avoid"),`원재료명의 말티톨·에리스리톨·폴리글리시톨·소비톨은 항상 피하기 (${JSON.stringify(r.lab)})`);
    need(r.labPlain===0,`알룰로스·스테비아는 당알코올이 아님 (${r.labPlain})`);
    need(Object.values(r.menu).every(l=>l==="avoid")&&r.menuPlain.every(l=>l!=="avoid"),`메뉴 글의 당알코올 낱말은 피하기, 알룰로스·스테비아는 아님 (${JSON.stringify(r.menu)} / ${r.menuPlain})`);
    need(r.nutri[0]==="avoid"&&r.nutri[1]==="avoid"&&r.nutri[2]===""&&r.nutri0==="",`영양성분표의 당알코올 g이 있으면 지시 없이도 피하기, 없거나 0이면 없음 (${r.nutri}, 0g=${r.nutri0})`);
    need(r.alcNotPoly["당알코올 젤리"]===false,`당알코올은 알코올 이유(절대 금지)로 세지 않음`);
    await p.context().close()}

  console.log('== 검토 후속: 제품 이름·괄호·재료 칸·목록 음식·술 이름 빈틈');
  {const p=await open();
    const r=await p.evaluate(()=>{const o={}; const lab=(t,n="")=>labelCheck(t,n); const alcRow=(t,n="")=>lab(t,n).rows.filter(x=>x.title==="알코올").length;
      o.nameBan=[["포도(칠레산) 100%, 아황산염","레드와인"],["정제수, 쌀, 국, 효모","백화수복 청주"],["정제수","소주 360ml"],["정제수","화이트 포도주"]].map(([t,n])=>lab(t,n).overall);
      o.cookName=[alcRow("정제수, 주정, 물엿","롯데 맛술"),alcRow("정제수, 주정","미림")];
      o.cooked=["술빵","막걸리 술빵","바지락 술찜","와인삼겹살","레드와인 스테이크","와인소스 스테이크","막걸리 수육","맥주 반죽 튀김"].map(n=>ruleCheck({name:n,ingr:[]}).level);
      o.drink=["와인 젤리","맥주 안주 세트","소주 칵테일","와인+스테이크 세트","치킨 맥주 세트","맥주 치킨 세트","레드와인 한 잔"].map(n=>ruleCheck({name:n,ingr:[]}).level); o.cookedTag=tagsOfText("술빵",["술빵"]).includes("alcohol");
      o.noAlc=["돼지 술국","선지술국","술안주 세트","풀무원 두부곤약주먹밥 톳두부"].map(n=>ruleCheck({name:n,ingr:[]}).level); o.stillAlc=["해장술","소주 안주 세트","약주"].map(n=>ruleCheck({name:n,ingr:[]}).level);
      o.cookTag=["맛술","미림","요리술","생강술"].map(t=>tagsOfText(t,[t]).includes("alcohol")); o.drinkTag=["소주","맥주"].map(t=>tagsOfText(t,[t]).includes("alcohol"));
      o.brackets=["간장, 맛술3%(주정, 물엿, 정제수)","맛술(물엿(옥수수),주정)","청주[쌀{국산},주정]","소주2%(주정,정제수)","맛술（주정,물엿）","간장,과실주(화이트와인),소금"].map(t=>alcRow(t));
      o.unbalanced=alcRow("맛술(물엿, 주정");   // 닫는 괄호가 없으면 낱말만 지우고 주정은 그대로 금지
      const m=(n,ingr=[],cook="")=>ruleCheck({name:n,ingr,cook}).level;
      o.drinks=Object.fromEntries(["정종","동동주","보드카","럼주","브랜디","샴페인","리큐르","하이볼","증류주","과실주","매실주","알콜","에틸알코올","포도주","복분자주","약주","탁주","과일주","인삼주","고량주","데킬라","사케","양주","칵테일","위스키","청주","막걸리"].map(w=>[w,m(w+" 한잔")]));
      o.notDrinks=Object.fromEntries(["포도주스","매실주스","과일주스","영양주먹밥","양주시 불고기","칵테일새우","후르츠칵테일 통조림","사케동","알코올프리 음료","다가알코올 껌"].map(w=>[w,m(w)]));
      o.typed=[m("볶음",["주정"]),m("볶음",["맥주"]),m("볶음",["쌀"],"에탄올 소스")];
      o.typedCook=[m("볶음",["맛술","간장"]),m("볶음",["청주","미림"]),m("볶음",["소주"])];
      const pr=(n,ingr=[],cook="")=>ruleCheck({name:n,ingr,cook}).reasons.some(x=>/^당알코올 포함 가능성/.test(x));
      o.f0=[exactFood("흰죽")?1:0, pr("흰죽",["쌀","자일리톨"]), pr("계란찜",["계란","에리스리톨"]), pr("흰죽",["쌀"],"말티톨 시럽"), pr("흰죽",["쌀"])];
      o.syn=[lab("솔비톨(다가알코올), 정제수").overall, m("슈가알코올 젤리"), m("폴리알코올 사탕")];
      const ap=Object.values(FOOD).filter(f=>alcIngr(f.id)&&/소량|조금만|자주 먹지/.test(f.why));
      o.advN=ap.length; o.advLeak=0;
      for(const f of ap.slice(0,6)){ showFood(f.id); const t=document.querySelector("#sheetRoot").textContent; if(/소량|조금만|자주 먹지/.test(t)||!/절대 금지/.test(t)) o.advLeak++; $("#sheetRoot").innerHTML="" }
      return o});
    need(r.nameBan.every(l=>l==="ban"),`제품 이름에 와인·청주·소주·포도주가 있으면 원재료에 안 적어도 절대 금지 (${r.nameBan})`);
    need(r.cooked.every(l=>l!=="ban")&&!r.cookedTag,`술을 넣어 익히는 요리 이름(술빵·와인삼겹살·와인 소스·맥주 반죽 등)은 막지 않음 (${r.cooked}, 태그 ${r.cookedTag})`);
    need(r.drink.every(l=>l==="ban"),`익히지 않거나 술과 함께 파는 묶음은 그대로 절대 금지 (${r.drink})`);
    need(r.noAlc.every(l=>l!=="ban")&&r.stillAlc.every(l=>l==="ban"),`술이 안 든 음식(술국·술안주·곤약주먹밥)은 술로 보지 않고, 술·소주·약주는 그대로 금지 (${r.noAlc} / ${r.stillAlc})`);
    need(r.cookTag.every(x=>!x)&&r.drinkTag.every(Boolean),`재료 표시(태그)도 맛술·미림은 술이 아니고 소주·맥주는 술 (${r.cookTag},${r.drinkTag})`);
    need(r.cookName.every(n=>n===0),`맛술·미림 제품 자체의 주정은 요리용이라 막지 않음 (${r.cookName})`);
    need(r.brackets.every(n=>n===0),`요리용 술 뒤의 %·겹괄호·대괄호·전각 괄호 속 주정은 막지 않음 (${r.brackets})`);
    need(r.unbalanced===1,`닫는 괄호가 없으면 주정은 그대로 절대 금지 (${r.unbalanced})`);
    need(Object.values(r.drinks).every(l=>l==="ban"),`술 이름 27가지가 모두 절대 금지 (${JSON.stringify(Object.entries(r.drinks).filter(([,l])=>l!=="ban"))})`);
    need(Object.values(r.notDrinks).every(l=>l!=="ban"),`주스·영양주먹밥·양주시·칵테일새우·사케동·알코올프리·다가알코올은 금지 아님 (${JSON.stringify(Object.entries(r.notDrinks).filter(([,l])=>l==="ban"))})`);
    need(r.typed.every(l=>l==="ban"),`적은 재료·조리 글의 주정·맥주·에탄올은 절대 금지 (${r.typed})`);
    need(r.typedCook.every(l=>l!=="ban"),`적은 재료의 맛술·청주·미림·소주는 금지 아님 (${r.typedCook})`);
    need(r.f0[0]===1&&r.f0[1]&&r.f0[2]&&r.f0[3]&&!r.f0[4],`목록에 있는 음식 이름이어도 적은 재료·조리의 당알코올은 피하기 (${r.f0})`);
    need(r.syn[0]==="avoid"&&r.syn[1]==="avoid"&&r.syn[2]==="avoid",`다가알코올·슈가알코올·폴리알코올은 알코올이 아니라 당알코올(피하기) (${r.syn})`);
    need(r.advN>=10&&r.advLeak===0,`알코올로 절대 금지인 제품의 상세 화면에 먹는 방법 문장이 없음 (먹는 방법 문장이 있던 제품 ${r.advN}개, 새는 것 ${r.advLeak})`);
    await p.context().close()}

  await b.close();
  if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
})();
