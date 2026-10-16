// 공통 안전장치: 어느 페이지에서든 잡히지 않은 오류(pageerror)가 나면 이 점검을 실패로 끝낸다
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}
// 접근성 점검(axe-core, WCAG 2.2 AA): 모든 탭·주요 화면을 밝은/어두운 모드로 검사하고,
// 심각(serious)·치명(critical) 위반이 하나라도 있으면 실패한다. 44px 미만 터치 영역도 함께 보고한다.
const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out'); fs.mkdirSync(TMP,{recursive:true});
const AXE=process.env.AXE_JS||require.resolve('axe-core/axe.min.js');
const { chromium } = require('playwright');
const page=path.join(TMP,'a11y.html');
fs.writeFileSync(page,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UC 식단 관리 도우미</title><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync(APP,'utf8')+'</body></html>');
const SEED=()=>{
  const d=n=>addDays(today(),-n);
  S.consent={date:today()};
  S.profile={height:"170",weight:"60",age:"30",sex:"F",allergies:["shrimp"],allergyOther:"",lactose:false,meds:["asa"],medOther:"",dislikes:"",budget:"보통"};
  const mk=(day,b)=>({day,night:0,bloody:b,urg:b,blood:b,well:0,stool:0,medtaken:1,extra:[],pain:1,gas:"없음",fatigue:"약간",temp:"",pulse:"",other:[],memo:""});
  for(let i=0;i<7;i++) S.logs[d(i)]=mk(2+i%3,i%2);
  S.water[today()]=3; S.weights=[{date:d(3),kg:60.4},{date:today(),kg:60.1}];
  S.extras[today()]=[{name:"달걀찜",foodId:"egg_steamed",amt:120,unit:"g",kcal:142,p:13.4,fi:0.4,ca:52}];
  save();
};
(async()=>{
  const b=await chromium.launch(); const all=[]; const small=new Map();
  for(const dark of [false,true]){
    const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:dark?'dark':'light'});
    const p=await ctx.newPage(); await p.route(/cdnjs|fonts/, r=>r.fulfill({body:''}));
    await p.goto('file://'+page); await p.waitForTimeout(300);
    await p.evaluate(SEED); await p.reload(); await p.waitForTimeout(400);
    await p.addScriptTag({path:AXE});
    // v1.9.0 A-17: 증상 기록은 마법사를 제대로 연 상태(날짜·4쪽·요약 모두)로 검사한다(예전에는 draft 없이 열어 오류 화면을 검사했다)
    const views=[["tab","plan"],["tab","log"],["tab","food"],["scr","nutri"],["tab","me"],["scr","report"],["scr","asks"],["scr","set-goals"],["scr","set-home"],["scr","set-remind"],["scr","set-privacy"],["onb","0"],["onb","2"],
      ["wz","0"],["wz","1"],["wz","2"],["wz","3"],["wz","4"],["wz","5"],["scr","pdf"],["scr","set-profile"],["scr","set-allergy"],["scr","set-data"],["scr","set-about"],["sheet","white_fish"],["qa","dairy"]];
    for(const [k,v] of views){
      await p.evaluate(([k,v])=>{document.querySelector("#sheetRoot").innerHTML=""; if(k!=="onb") S.onb="done";
        if(k==="tab"){SCR=null;S.onb="done";S.tab=v;render()} else if(k==="onb"){SCR=null;S.tab="plan";S.onb=v;render()} else if(k==="scr"){openScr(v)} else if(k==="wz"){SCR=null; openWizard(addDays(today(),-1)); WZ.step=+v; render(); if(document.querySelector(".error,#main h2")&&!document.querySelector(".wz-q")) throw new Error("wizard not rendered")} else if(k==="qa"){SCR=null;qaGo(v);const d=document.querySelector(".qa.on .qa-ev"); if(d) d.open=true} else {SCR=null;S.tab="food";render();showFood(v)}},[k,v]);
      if(k==="wz"&&!(await p.evaluate(()=>!!document.querySelector(".wz-q")))){all.push({view:"wizard "+v,id:"wizard-error",impact:"critical",help:"증상 기록 화면이 그려지지 않음",n:1,ex:[]})}   // qa: 궁금한 점 펼친 답과 근거 원문(v1.7.0)
      await p.waitForTimeout(350);
      // 넘어가는 효과(반투명) 중에는 대비가 낮게 재지므로 효과가 끝난 뒤 잰다
      await p.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))));
      const res=await p.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]},resultTypes:["violations"]});
        return r.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,n:v.nodes.length,ex:v.nodes.slice(0,3).map(x=>({t:x.target.join(" "),h:x.html.slice(0,140),s:(x.failureSummary||"").slice(0,200)}))}))});
      for(const r of res) all.push({view:`${dark?"dark":"light"} ${k}:${v}`,...r});
      const sm=await p.evaluate(()=>[...document.querySelectorAll('button,a[href],input,select,textarea,[role=button],[tabindex="0"]')].filter(e=>{const r=e.getBoundingClientRect(); const cs=getComputedStyle(e); return r.width>0&&r.height>0&&cs.visibility!=="hidden"&&(r.width<44||r.height<44)&&!(e.tagName==="INPUT"&&["checkbox","radio"].includes(e.type)&&e.closest("label"))}).filter(e=>!e.matches('sup.ref,.term,p a,li a,small a')).map(e=>{const r=e.getBoundingClientRect(); return (e.className||e.tagName)+" "+Math.round(r.width)+"x"+Math.round(r.height)+" "+(e.getAttribute("aria-label")||e.textContent||"").trim().slice(0,16)}));
      for(const s of sm) small.set(s.replace(/ \d+x\d+ /," * "),s);
    }
    await ctx.close();
  }
  await b.close();
  const bad=all.filter(v=>["serious","critical"].includes(v.impact));
  const key=v=>v.id+"|"+v.impact;
  const grouped={}; for(const v of all){(grouped[key(v)]||(grouped[key(v)]={v,views:[],n:0})).views.push(v.view); grouped[key(v)].n+=v.n}
  console.log(`== axe 위반 ${Object.keys(grouped).length}종 (심각 이상 ${bad.length}건)`);
  for(const g of Object.values(grouped)){ console.log(`  [${g.v.impact}] ${g.v.id} — ${g.v.help} (요소 ${g.n}개, 화면 ${g.views.length}개: ${[...new Set(g.views)].slice(0,4).join(", ")})`);
    for(const e of g.v.ex) console.log(`      · ${e.t} :: ${e.h}\n        ${e.s.replace(/\n/g," ")}`) }
  console.log(`== 44px 미만 터치 영역 ${small.size}종`); for(const s of [...small.values()].slice(0,40)) console.log("  ",s);
  fs.writeFileSync(path.join(TMP,'a11y.json'),JSON.stringify({all,small:[...small.values()]},null,1));
  // 터치 영역: 44×44px 미만이면 실패(문장 속 참고문헌 번호·용어 버튼·문장 속 링크는 WCAG 2.5.8 '문장 안' 예외이고, ::after로 누르는 범위를 넓혀 둠)
  if(small.size) console.log('FAIL 44px 미만 터치 영역 '+small.size+'종');
  process.exit(bad.length||small.size?1:0);
})();
