const path=require('path'), fs_=require('fs');
const ROOT=path.join(__dirname,'..','..');
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const OFFLINE=process.env.OFFLINE_HTML||path.join(ROOT,'public','index.html');
const LIB_H2C=path.join(ROOT,'vendor','html2canvas.min.js');
const LIB_JSPDF=path.join(ROOT,'vendor','jspdf.umd.min.js');
const TMP=process.env.TEST_TMP||path.join(ROOT,'.test-out');
const T=n=>{fs_.mkdirSync(path.dirname(path.join(TMP,n)),{recursive:true});return path.join(TMP,n)};
const WRAP=n=>{const p=T(n); if(!fs_.existsSync(p)) fs_.writeFileSync(p,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs_.readFileSync(APP,'utf8')+'</body></html>'); return p};
const { chromium } = require('playwright');
const fs = require('fs');
const body = fs.readFileSync(APP,'utf8');
const page_html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style>
<script>
let calls=0;
const day=()=>({meals:[
 {slot:"아침",title:"흰살생선 쌀죽",recipes:["r_juk","r_fish_steam","r_bogus"],items:[{id:"rice_porridge",g:300},{id:"white_fish",g:80},{id:"olive_oil",g:5},{id:"banana",g:100},{id:"ham",g:30}],tip:"테스트 팁",refs:[1,2,99]},
 {slot:"점심",title:"연어 정식",recipes:["r_salmon_braise","r_zucchini"],items:[{id:"white_rice",g:250},{id:"salmon",g:120},{id:"zucchini",g:80},{id:"olive_oil",g:20},{id:"ons",g:200}],tip:"t",refs:[3]},
 {slot:"저녁",title:"닭 감자",recipes:["r_chicken_potato","r_nurungji"],items:[{id:"chicken_breast",g:150},{id:"potato",g:200},{id:"white_rice",g:200},{id:"olive_oil",g:8},{id:"soy_milk",g:190},{id:"nurungji",g:60}],tip:"t",refs:[2]}]});
window.__prompts=[];
window.claude={use:async n=>{
 if(n==="sample"){const f=async()=>({text:""}); f.limits=async()=>({maxPromptBytes:65536,images:{maxCount:5,maxInputBytes:2e7,mediaTypes:['image/jpeg','image/png']}}); f.json=async(p,o)=>{window.__prompts.push(p);calls++;await new Promise(r=>setTimeout(r,20));if(p.includes("지금 먹어도"))return {level:"caution",why:"테스트",how:"익혀서",refs:[2]};
 if(p.includes("첨부한 사진")){window.__img=!!o.images;return {kind:"menu",items:[{name:"크림 파스타",ingredients:["밀가루 면","생크림","베이컨"],cooking:"볶음",confidence:"high"},{name:"연어 포케",ingredients:["연어","밥"],cooking:"생",confidence:"mid"}]}}
 if(p.includes("외식·편의점에서")) return {results:[{name:"크림 파스타",level:"caution",why:"기름짐",tip:"소스 적게",refs:[2]},{name:"연어 포케",level:"ok",why:"생선",tip:"생채소 빼기",refs:[3]}]};return day()}; return f}
 if(n==="downloads") return {save:async({filename,data})=>{window.__saved={filename,size:data.size||data.length}; const buf=await data.arrayBuffer(); window.__pdf=Array.from(new Uint8Array(buf));return {status:"saved"}}};
 return null}};
</script></head><body>${body}</body></html>`;
fs.writeFileSync(T('uc_test.html'), page_html);
(async()=>{const b = await chromium.launch();
const p = await b.newPage({viewport:{width:390,height:844}});
await p.route('https://cdnjs.cloudflare.com/**', r=>{const u=r.request().url(); const f=u.includes('html2canvas')?LIB_H2C:LIB_JSPDF; r.fulfill({path:f,contentType:'application/javascript'})});
await p.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'',contentType:'text/css'}));
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+WRAP('uc_test.html')); await p.waitForTimeout(1500);
await p.click('label.swrow:has(#c_req)'); await p.click('label.swrow:has(#c_ai)'); await p.click('#consentGo'); await p.waitForTimeout(200);
await p.screenshot({path:T('s1.png'),fullPage:false});
await p.click('[data-act=gen]'); await p.waitForTimeout(4000);
const plan = await p.evaluate(()=>({n:S.plan.days.length, checked:S.plan.days[0].checked, m0:S.plan.days[0].meals[0].items, m2:S.plan.days[0].meals[2].items, rec:S.plan.days[0].meals.map(m=>m.rec), m1:S.plan.days[0].meals[1].items, refs:S.plan.days[0].meals[0].refs, calls}));
console.log(JSON.stringify(plan));
await p.click('.mrow[data-k="0"]'); await p.waitForTimeout(100);
console.log('mealScr', await p.evaluate(()=>JSON.stringify({scr:SCR, title:document.querySelector('#appbar').textContent.trim().slice(0,30), tabsHidden:getComputedStyle(document.querySelector('.tabs')).transform})));
await p.waitForTimeout(400); await p.screenshot({path:T('sh_meal.png')});
await p.click('[data-act=rateSet][data-j="1"][data-v=bad]'); await p.click('[data-act=rateSave]'); await p.waitForTimeout(150); console.log('trig sheet', (await p.textContent('#sheetRoot')).slice(0,40)); await p.click('[data-act=badSym][data-v=diarrhea]'); await p.click('[data-act=badSave]'); await p.waitForTimeout(200);
console.log('triggers', await p.evaluate(()=>JSON.stringify(S.triggers)), 'memo?', await p.evaluate(()=>!!document.querySelector('textarea#rateNote, #lbNote')));
// wizard
await p.click('.tile[data-act=wizard]'); await p.waitForTimeout(100);
await p.waitForTimeout(400); await p.screenshot({path:T('sh_wz1.png')});
for(let i=0;i<7;i++) await p.click('[data-act=step][data-k=day][data-v="1"]');
await p.click('[data-act=wzNext]'); // night
await p.click('[data-act=wzNext]'); // bloody
for(let i=0;i<3;i++) await p.click('[data-act=step][data-k=bloody][data-v="1"]');
await p.click('[data-act=wzNext]'); // urg
await p.waitForTimeout(400); await p.screenshot({path:T('sh_wz2.png')});
await p.click('[data-act=set][data-k=urg][data-v="1"]'); await p.waitForTimeout(350);
console.log('noAutoAdv', await p.evaluate(()=>WZ.step));
await p.click('[data-act=wzNext]');
await p.click('[data-act=set][data-k=blood][data-v="2"]'); await p.click('[data-act=wzNext]');
await p.click('[data-act=set][data-k=well][data-v="1"]'); await p.click('[data-act=wzNext]');
await p.click('[data-act=tog][data-k=extra]'); await p.click('[data-act=wzNext]');
await p.fill('#pain','6'); await p.click('[data-act=wzNext]');
await p.click('[data-act=setS][data-k=gas][data-v="약간"]'); await p.click('[data-act=wzNext]');
await p.click('[data-act=setS][data-k=fatigue][data-v="심함"]'); await p.click('[data-act=wzNext]');
await p.click('[data-act=set][data-k=stool][data-v="6"]'); await p.click('[data-act=wzNext]');
await p.click('[data-act=set][data-k=medtaken][data-v="2"]'); await p.click('[data-act=wzNext]');
await p.fill('#temp','38.1'); await p.click('[data-act=wzNext]');
await p.fill('#otherAdd','두통'); await p.click('[data-act=otherAdd]'); await p.fill('#memo','테스트 메모'); await p.click('[data-act=wzNext]');
await p.waitForTimeout(400); await p.screenshot({path:T('sh_wz3.png')});
await p.click('[data-act=saveLog]'); await p.waitForTimeout(100);
console.log('log', await p.evaluate(()=>JSON.stringify({l:S.logs[today()],tab:S.tab,scr:SCR})));
await p.click('.tab[data-tab=plan]');
console.log('alerts', (await p.textContent('#main')).match(/진료를[^<]{0,40}/)?.[0]);
await p.click('.tab[data-tab=log]'); await p.click('[data-act=openScr][data-v=pdf]');
await p.click('[data-act=pdf]'); await p.waitForTimeout(6000);
console.log('saved', await p.evaluate(()=>JSON.stringify(window.__saved))); const arr=await p.evaluate(()=>window.__pdf); if(arr) fs.writeFileSync(T('report.pdf'), Buffer.from(arr));
await p.click('[data-act=back]');
await p.click('.tab[data-tab=food]'); await p.click('[data-act=foodSub][data-v=search]').catch(()=>{}); await p.fill('#foodQ','커피우유'); await p.click('[data-act=askFood]'); await p.waitForTimeout(500);
console.log('foodAI', await p.evaluate(()=>JSON.stringify(foodAI)));
await p.click('.tab[data-tab=me]'); await p.click('[data-act=openScr][data-v=set-refs]'); await p.click('[data-act=ref1]');
console.log('sheet', (await p.textContent('#sheetRoot')).slice(0,60));
await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(700); // 연타 가드(600ms 안 같은 자리 다른 버튼) 회피
// settings inputs only here
await p.click('[data-act=openScr][data-v=set-profile]'); await p.fill('#p_height','170'); await p.fill('#p_age','30'); await p.click('[data-act=sex][data-v=F]').catch(e=>console.log('sex btn?',e.message.slice(0,60)));
await p.click('[data-act=back]');
await p.click('[data-act=openScr][data-v=set-weight]'); await p.fill('#w_today','58'); await p.click('[data-act=saveW]'); await p.click('[data-act=back]');
await p.click('[data-act=openScr][data-v=set-orders]'); await p.waitForTimeout(400); await p.screenshot({path:T('sh_orders.png'),fullPage:true});
await p.locator('input.sw').first().check(); await p.click('[data-act=back]');
await p.click('[data-act=openScr][data-v=set-allergy]'); await p.waitForTimeout(400); await p.screenshot({path:T('sh_allergy.png'),fullPage:true}); await p.click('[data-act=back]');
console.log('profile', await p.evaluate(()=>JSON.stringify({p:S.profile,w:S.weights.slice(-1),o:S.orders})));
const inputsElsewhere = await p.evaluate(async()=>{const out={};for(const t of ['plan','log','food','nutri']){document.querySelector(`.tab[data-tab=${t}]`).click();await new Promise(r=>setTimeout(r,50));out[t]=[...document.querySelectorAll('#main input,#main textarea,#main select')].map(e=>e.id||e.type)}return out});
console.log('inputs on tabs', JSON.stringify(inputsElsewhere));
await p.click('.tab[data-tab=food]'); await p.click('[data-act=foodSub][data-v=menu]');
fs.writeFileSync(T('t.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64'));
await p.setInputFiles('#mjPick',T('t.png'));
await p.click('[data-act=mjRead]'); await p.waitForTimeout(300);
await p.fill('#mj_g_1','연어, 밥, 고추장');
await p.click('[data-act=mjJudge]'); await p.waitForTimeout(300);
console.log('mj', await p.evaluate(()=>JSON.stringify({img:window.__img,res:MJ.results.map(r=>[r.name,r.level,r.rules])})));
await p.waitForTimeout(400); await p.screenshot({path:T('sh_mj.png'),fullPage:true});
// reintro
await p.evaluate(()=>{for(let i=0;i<7;i++){S.logs[addDays(today(),-i)]={date:addDays(today(),-i),day:2,night:0,bloody:0,urg:0,blood:0,well:0,extra:[],pain:0,gas:"없음",fatigue:"없음",temp:"",pulse:"",other:[],memo:""}} S.reintro={active:null,history:[]}; render()});
await p.click('.tab[data-tab=log]'); await p.click('[data-act=openScr][data-v=reintro]');
await p.click('[data-act=riStart][data-i="0"]');
await p.evaluate(()=>{S.reintro.active.start=addDays(today(),-2);render()});
for(const i of [0,1,2]) await p.click(`[data-act=riSet][data-i="${i}"][data-v="없음"]`);
await p.screenshot({path:T('ri.png'),fullPage:true});
await p.click('[data-act=riEnd][data-v=pass]');
console.log('ri', await p.evaluate(()=>JSON.stringify({hist:S.reintro.history.map(h=>[h.name,h.result]),trig:S.triggers.length})));
console.log('errors', errs);
await b.close();
})();
