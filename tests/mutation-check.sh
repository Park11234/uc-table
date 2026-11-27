#!/usr/bin/env bash
# 점검의 점검: 일부러 망가뜨린 앱(돌연변이)을 만들어, 해당 점검이 실제로 실패하는지 확인한다.
# 점검이 아무것도 확인하지 않고 늘 통과하는 상태가 되면 여기서 걸린다.
set -uo pipefail
cd "$(dirname "$0")/.."
export TEST_TMP="${TEST_TMP:-$PWD/.test-out}"; mkdir -p "$TEST_TMP"; M="$TEST_TMP/mutants"; mkdir -p "$M"
python3 - "$M" <<'PY'
import sys,os
M=sys.argv[1]; s=open('src/app/index.html',encoding='utf-8').read(); i=s.rindex('</script>')
end=lambda js: s[:i]+';'+js+'\n'+s[i:]        # 앱 코드가 다 실행된 뒤 덧붙이는 코드
def rep(a,b):
    assert s.count(a)==1, ('돌연변이 대상이 없거나 여러 곳', a[:60])
    return s.replace(a,b,1)
mut={
 # 기존
 'food_rule.html': end('FOOD.white_fish.ms=9;'),                                 # 급성기 기본 음식을 '피하기'로
 'wide.html':      s.replace('<style>','<style>body{min-width:520px}',1),        # 작은 화면에서 가로 넘침
 'page_error.html':end('setTimeout(()=>{throw new Error("mutant")},50);'),       # 잡히지 않은 오류
 'load_crash.html':rep('function normalizeState(o){','function normalizeState(o){if(o&&o.logs&&Object.keys(o.logs).length>3) throw new Error("x");'),  # 기록이 많으면 못 읽음
 'search_ime.html':rep('const jk=jamoOf(k); if(jk.length<2) return false;','return false;'),  # 조합 중 검색 끊김
 # v1.5.0 규칙
 'sodium.html':    rep('const naLimit=()=>{const a=+S.profile.age; return a>=75?1800:a>=65?1900:2300};','const naLimit=()=>99999;'),  # 나트륨 상한 없음
 'fatty.html':     rep('if((f.f>=10||f.f*sg/100>=20)&&!f.tags.includes("fatty")) f.tags.push("fatty");',''),  # 지방 규칙 빠짐
 'medical.html':   rep('if(f.tags.includes("medical")&&!orderOn("ons")) set("caution",','if(false) set("caution",'),  # 특수의료용도식품 주의 빠짐
 'renal.html':     rep('["renal","신장질환자용','["renal_x","신장질환자용'),     # 신장질환자용 '피하기' 빠짐
 'nofiber.html':   rep('if(c.fiberStage===1&&!hasNut(f,"fi")&&','if(false&&'),  # 섬유 자료 없음 주의 빠짐
 'totals.html':    rep('for(const k in NUT_L){ if(hasNut(f,k)) t[k]+=f[k]*g/100; else {','for(const k in NUT_L){ if(true) t[k]+=(f[k]||0)*g/100; else {'),  # 자료 없는 값을 0으로 더함
 'swapkey.html':   rep('S.swaps[`${date}|${n}`]=key;','S.swaps[`${date}|${n}`]=String(key).replace(/^[gtu]:/,"");'),  # 교체 키 대신 이름 저장
 'noscale.html':   rep('const scaled=scaleDay(meals);','const scaled=null;'),     # 체중에 따른 양 조절 빠짐
 'lactose.html':   end('FOOD.cream_pasta.tags=FOOD.cream_pasta.tags.filter(t=>t!=="lactose");'),  # 유당 태그 빠짐
 'allergy.html':   end('FOOD.egg_steamed.tags=FOOD.egg_steamed.tags.filter(t=>t!=="egg");'),     # 알레르기 태그 빠짐
 'recipe.html':    end('RECIPES.r_eggguk.foods=["egg_boiled"];'),                # 레시피 재료와 메뉴 식품이 어긋남
 'touch.html':     s.replace('<style>','<style>.cup{width:30px!important}',1),  # 44px 미만 터치 영역
 'retain.html':    rep('if(t.id==="otherAdd") OTH_TXT=t.value;',''),            # 다시 그리면 입력이 사라짐
 'danger.html':    rep('if(hot) urgent.push(','if(false) urgent.push('),        # 발열 경고 빠짐
 'josa.html':      rep('return j<0?"은(는)":j?"은":"는"','return "은"'),  # 조사 틀림
 'click_throw.html':rep('case "shopOpen": renderShop(); break;','case "shopOpen": renderShop(); undefinedFn(); break;'),  # 버튼을 누르면 오류
 'shop_nan.html':  rep('<h2>일주일 장보기 목록</h2>','<h2>일주일 장보기 목록 ${0/0}</h2>'),  # 화면에 NaN 노출
 # v1.6.2
 'relist.html':   rep('const setListHTML=(el,h)=>{if(h===el.__h&&el.innerHTML) return; el.innerHTML=h; el.__h=h; groupRefs(el)};','const setListHTML=(el,h)=>{el.innerHTML=h; groupRefs(el)};'),  # 같은 검색 결과로 목록을 갈아 끼움
 'ramen_fried.html':end('FOOD.rm_shin.tags=FOOD.rm_shin.tags.filter(t=>t!=="fried");'),  # 유탕면 튀김 규칙 빠짐
 # v1.7.0 궁금한 점
 'qa_food.html':  end('QA_BY.coffee.foods.push("no_such_food");'),             # 없는 음식으로 연결
 'qa_onechar.html':rep('if(kw.some(n=>n.includes(k)||(n.length>=2&&k.includes(n)))) return 2;','if(kw.some(n=>n.includes(k)||k.includes(n))) return 2;'),  # 한 글자 핵심어('물')가 '물김치'에 걸림
 'qa_related.html':rep('const qas=q?qaFind(q,"전체",1).slice(0,3):[];','const qas=[];'),  # 음식 검색에 관련 질문이 안 나옴
 # v1.7.1 내 정보 저장
 'pe_noask.html': rep('function peDirty(){if(!PE) return false;','function peDirty(){return false;'),  # 저장하지 않고 나가도 묻지 않음
 'pe_nodraft.html':rep('const PP=()=>PE?PE.profile:S.profile','const PP=()=>S.profile'),  # 저장 전에 기록이 바로 바뀜
 # v1.8.0
 'onb_skip.html':  rep('S.consent={date:today()}; S.onb=installStep()?"i":"0";','S.consent={date:today()}; S.onb="done";'),  # 동의 뒤 첫 실행 설정이 안 나옴
 'ratio_off.html': rep('.map(([id,g])=>[id,r===1?g:Math.round(g*r)])',''),   # '반·더 많이'가 먹은 양에 반영 안 됨
 'stale_off.html': rep('if(cur!==MY_REV){STALE=true; setTimeout(render,0); return}',''),  # 다른 창이 저장해도 덮어씀
 'merge_off.html': rep('S=mode==="merge"?mergeStates(prev,PENDING_RESTORE):PENDING_RESTORE;','S=PENDING_RESTORE;'),  # 합치기를 골라도 바꿔 버림
 'bmi_off.html':   rep('const k=bmi<18.5?[35,40]:bmi<23?[30,35]:[25,30];','const k=[30,35];'),  # BMI에 따른 열량 목표 빠짐
 'fserv_off.html': end('FSERV.broccoli.hi=null;'),                            # FODMAP 1회량이 자료와 다름
 'shortok_off.html':rep('const shortOK=date=>date<today()||(date===today()&&new Date().getHours()>=19);','const shortOK=()=>true;'),  # 낮에도 모자람을 경고색으로
 'wzbar_anim.html':rep('.a-push>:not(.bottom-bar),.a-fwd>:not(.bottom-bar){animation:push','.a-push,.a-fwd{animation:push'),  # 넘어가는 동안 아래 버튼이 튐
 'visual_css.html':s.replace('<style>','<style>.ridge{background:#f4d03f!important}',1),  # 화면 디자인이 몰래 바뀜(v1.11.0: 첫 화면에 보이는 홈 상태 띠 바탕색. 요약 줄은 새 디자인에서 첫 화면 아래로 내려감)
 'tabs_hit.html':  rep('body.pushed .tabs{transform:translateY(140%);visibility:hidden;pointer-events:none}','body.pushed .tabs{transform:translateY(140%);visibility:hidden}'),  # 화면을 연 직후 아래 버튼 자리를 누르면 탭이 눌림
 'logo_gone.html': rep('const TAB_TITLE={plan:LOGO_H,','const TAB_TITLE={plan:"UC 식단 관리 도우미",'),  # 홈 제목 자리에 로고 대신 옛 이름
 'nav_over.html':  rep('const n=Math.min(NAV.depth-want,+(history.state?.ucnav)||0);','const n=NAV.depth-want;'),  # 뒤로 가기가 앱 밖까지 넘어감
 # v1.8.0 장보기를 살 때 재료로
 'shop_cook.html': rep('const eat=s?g*s[1]:g, ref=s?s[2]:0;','const eat=g, ref=s?s[2]:0;'),  # 밥·죽을 익힌 무게 그대로 쌀로 적음
 'shop_dish.html': rep('if(wBasis(f).k==="dish"){','if(false){'),  # 완성 음식을 재료로 적고 레시피 재료를 안 보여 줌
 # v1.9.0(2026-10-15 발견): 끝낸 '오늘 할 일' 줄이 전역 .done(26px 원) 규칙에 걸려 글자가 세로로 흘러내림
 'done_clash.html':rep('`<div class="task${ok?" is-done":""}">','`<div class="task${ok?" is-done done":""}">'),
 # v1.10.0 점검 보고서 반영분
 'ham_soft.html':  end('FOOD.ham.tags=FOOD.ham.tags.filter(t=>t!=="nitrite");'),   # 일반 햄이 다시 '피하기'(시판 발색제 가공육과 어긋남)
 'idmap_off.html': rep('  o=remapIds(o);\n',''),                               # 묶여 빠진 옛 제품 id를 잇지 않음(즐겨찾기·기록이 사라짐)
 'broad_off.html': rep('const broadOf=name=>{','const broadOf=()=>null; const _broadOf=name=>{'),  # '샐러드'를 한 음식으로 판정
 'pc_full.html':   rep(':root{--phone:640px}',':root{--phone:100vw}'),            # PC에서 휴대폰 화면이 아니라 전체 너비
 'toast_top.html': s.replace('</style>','.toasts{top:64px!important;bottom:auto!important}</style>',1),  # 알림이 다시 제목을 가림
 'csv_inj.html':   rep("if(/^[=+\\-@\\t\\r]/.test(t)) t=\"'\"+t;",''),          # CSV 수식 막기 빠짐
 'migrate_twice.html':rep('typeof window.UCTableAndroid.takeMigrated==="function"&&!localStorage.getItem(KEY)','typeof window.UCTableAndroid.takeMigrated==="function"'),  # 안드로이드 앱이 기록을 매번 덮어씀
 'protein_up.html':rep('t.p>tg.p*1.15?Math.max(0.7,(tg.p*1.1-po)/Math.max(1,pp)):1','1'),       # 단백질 반찬을 늘리기만 함
 'later_word.html':rep('later:"다음 단계"','later:"보류"'),                        # '다음 단계'가 다시 '보류'
 # v1.11.0 검토 반영분·디자인 뒤 재검토
 'allergy_soft.html':rep('set("ban",`알레르기(${allergyLabel(a)}): 먹지 마십시오`);','set("avoid",`알레르기(${allergyLabel(a)})`);'),  # 알레르기 음식이 다시 '피하기'(R-15)
 'body_margin.html':rep('body{margin:0;background:var(--bg);','body{background:var(--bg);'),  # 실제 앱에 body 기본 여백이 다시 남음(R-01)
 'enc_plain.html': rep('const backupOut=async()=>encWrap(backupJSON());','const backupOut=async()=>backupJSON();'),  # 암호화를 켜도 백업이 평문(M10)
 # v1.12.0 전체 코드 검토
 'mj_allergy_off.html':rep(r'allergies:c.allergies.filter(a=>!tags.includes(a)),words:[],alWords:(c.alWords||[]).filter(w=>!x.includes(w.replace(/\s/g,""))),trig:[]','allergies:[],words:[],alWords:[],trig:[]'),  # 외식 판정이 목록 음식의 알레르기 표시를 다시 안 봄(C-01)
 'fs_sig_off.html': rep('const sig=JSON.stringify([{...c,trig:c.trig.map(t=>[t.name,t.foodId||""])},','const sig=JSON.stringify([c.stage,c.fiberStage,c.gasHeavy,c.allergies,c.words,c.trig.map(t=>[t.name,t.foodId||""]),'),  # 목록 판정 캐시가 면역 약·직접 적은 알레르기를 다시 모름(C-02)
 'raw_kw_off.html': rep('function rawWords(t){','function rawWords(t){return [];'),  # 목록 밖 외식 메뉴·포장 원재료의 날음식을 다시 못 봄(C-03)
 'reset_keep_off.html':rep('if(!all) keepBeforeReset(); ',''),  # 보관본을 남기고 초기화해도 오늘 보관본이 빈 기록으로 덮임(C-04)
 'own_off.html':   rep('const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k)?o[k]:undefined;','const own=(o,k)=>o[k];'),  # constructor 등으로 검색하면 멈춤(C-05)
 'alc_ingr_off.html':rep('if(alcIngr(f.id)) set("ban"','if(false) set("ban"'),  # 원재료에 알코올이 든 포장 식품이 금지가 아님
 'alc_menu_off.html':rep('if(aw.length) up("ban",`알코올 포함 가능성','if(false) up("ban",`알코올 포함 가능성'),  # 외식 글의 알코올이 금지가 아님
 'alc_label_off.html':rep('if(al.length) add("ban","알코올"','if(false) add("ban","알코올"'),  # 붙여넣은 원재료명의 알코올이 금지가 아님
 'alc_sugar.html':rep('|당알코올|당알콜|슈가알코올|다가알코올|폴리알코올|(무|논)','|(무|논)'),  # 당알코올(말티톨)을 술로 오해해 절대 금지
 'alc_spoon.html':rep('|큰술|작은술|한술','|한술'),  # 큰술·작은술을 술로 오해
 'alc_juj.html':rep('"알콜","주정"]','"알콜"]'),  # 원재료 주정을 못 찾음
 'alc_cook_off.html':rep('const COOK_ALWAYS=/맛술|미림|맛링|','const COOK_ALWAYS=/맛링|').replace('alcohol:/맛술|미림|맛링|','alcohol:/맛링|',1),  # 요리용 맛술을 술로 오해해 막음
 'alc_cook_ing_off.html':rep('if(ing) x=dropWords(x,COOK_ALC);',''),
 'alc_cookdish_off.html':rep('|(?:술|막걸리|맥주|와인|포도주|소주|청주|정종)+(?=','|(?:술|막걸리|맥주|와인|포도주|소주|청주|정종)+(?=@@'),  # 술빵·와인 소스 같은 익힌 요리를 다시 막음  # 재료 칸의 청주·과실주·와인·소주를 막음
 'poly_ingr_off.html':rep('if(polyIngr(f.id)||f.tags.includes("polyol")){ set("avoid"','if(false){ set("avoid"'),  # 원재료 당알코올 제품이 피하기가 아님
 'poly_tag_off.html':rep('if(polyIngr(f.id)||f.tags.includes("polyol")){','if(polyIngr(f.id)){'),  # 원재료 자료 없는 당알코올 표시 음식이 피하기가 아님
 'poly_label_caution.html':rep('if(g.id==="polyol") lv="avoid";','if(false) lv="avoid";'),  # 원재료명 당알코올이 주의에 머묾
 'poly_label_extra_off.html':rep('if(pw.length&&!rows.some(r=>r.title==="당알코올(폴리올)")) add("avoid"','if(false) add("avoid"'),  # 에리스리톨·폴리글리시톨을 못 찾음
 'poly_menu_off.html':rep('if(pw.length){ up("avoid",`당알코올 포함 가능성','if(false){ up("avoid",`당알코올 포함 가능성'),  # 메뉴 글의 당알코올을 못 찾음
 'poly_nutri_caution.html':rep('out.push({lv:"avoid",title:"당알코올"','out.push({lv:"caution",title:"당알코올"'),  # 영양성분표 당알코올이 주의에 머묾
 'alc_ruleingr_off.html':rep('alcWords((item.ingr||[]).join(" ")+" "+(item.cook||""),true)','[]'),  # 적은 재료·조리 글의 주정을 못 봄
 'alc_label_name_cook.html':rep('...alcWords(nm),','...alcWords(nm,true),'),  # 제품 이름의 와인·청주를 요리용으로 봐 통과
 'alc_cookname_off.html':rep('COOK_NAME.test(nm.replace(/\\s/g,""))?[]:','false?[]:'),  # 맛술 제품 자체의 주정을 막음
 'alc_bracket_off.html':rep('if(OPEN_BR.includes(x.charAt(i)||"\\0"))','if(false)'),  # 요리용 술 뒤 괄호 속 주정을 막음
 'alc_pct_off.html':rep('if(pc) i+=pc[0].length;',''),  # 맛술3%(주정) 형식을 막음
 'alc_juice_off.html':rep('|포도주스|과일주스|매실주스|복분자주스|인삼주스',''),  # 주스를 술로 오해
 'alc_kw_podoju.html':rep('"포도주","복분자주"','"복분자주"'),  # 포도주를 못 찾음
 'alc_kw_alkol.html':rep('"알코올","알콜"','"알코올"'),  # 알콜 표기를 못 찾음
 'alc_detail_why.html':rep('alcIngr(id)&&s.level==="ban"?','false?'),  # 상세 화면에 먹는 방법 문장이 새어 나옴
 'poly_f0_off.html':rep('polyWords(f0?[...(item.ingr||[]),item.cook||""].join(" "):text)','polyWords(f0?"":text)'),  # 목록 음식 이름이면 적은 재료의 당알코올을 못 봄
 'enc_failopen.html':rep('if(ENC_OK()&&!ENC.ready) throw new Error("enc-unknown"); ',''),  # 열쇠를 못 읽으면 평문 백업(C-07)
 'copy_await.html':rep('else if(window.ClipboardItem&&navigator.clipboard&&navigator.clipboard.write) await','else if(false) await'),  # 암호화를 켜면 복사가 기다린 뒤에(C-10)
 'share_await.html':rep('now=backupNow();\n  if(now==null){let out;','now=await backupOut();\n  if(now==null){let out;'),  # 암호화를 켜면 공유가 기다린 뒤에(C-10)
 'wipe_skip.html': rep('await tryDo(()=>idb("kv","readwrite",st=>st.delete("bkKey")));',''),  # 초기화가 암호화 열쇠를 남김(C-13)
 'sync_name_only.html':rep(':`고른 폴더가 OneDrive',':""&&`고른 폴더가 OneDrive'),  # 이름에 OneDrive가 없으면 동기화 폴더 권유를 안 함(C-14)
 'font_gap.html':  end('/* 똠방각하 */'),                                    # 앱 글꼴에 없는 글자가 앱에 들어옴(글꼴 글자 빠짐 점검)
 'font_textsym.html':end('/* ♩ */'),                                     # 글꼴에 없는 기호(이모지 아님)가 들어옴. 유니코드 판(Node 판)에 따라 놓치지 않음
 'crust_off.html':rep('const crustCross=(c,tags)=>{','const crustCross=(c,tags)=>{return [];'),   # 갑각류 교차 반응 규칙이 통째로 빠짐(C-21)
 'crust_food_off.html':rep('  if(!c.crustDone) for(const [o,a] of crustCross(c,f.tags)) set("avoid",crustWhy(o,a));   // v1.12.0 C-21\n',''),   # 음식 판정에서만 빠져 '대신 이것'에 게가 다시 나옴(C-21)
 # v1.12.0 검토 후속(보고서 5번): 단계 판정 기준을 한 칸씩 어긋나게
 'sc_gt5.html':    rep('if(comp>=5) return {stage:1','if(comp>5) return {stage:1'),            # 보조 합산 5점이 활동기가 아님
 'sc_ge6.html':    rep('if(comp>=5) return {stage:1','if(comp>=6) return {stage:1'),           # 보조 합산 6점부터 활동기
 'bloody_gt4.html':rep('if(bloody>=4) return {stage:1','if(bloody>4) return {stage:1'),    # 혈변 4회가 활동기가 아님
 'remit_le4.html': rep('if(p.sf===0&&total<=3&&p.br===0','if(p.sf===0&&total<=5&&p.br===0'),  # 하루 4~5회 배변도 관해(평소 횟수가 많을 때)
 # v1.12.0 지표 교체(SCCAI → PRO2·Truelove-Witts, 2026-10-21)
 'p2_sf_a.html':   rep('const sf=more<=0?0:more<=2?1:more<=4?2:3;','const sf=more<=0?0:more<=3?1:more<=4?2:3;'),   # 배변 횟수 1점 구간이 넓어짐(ACG 2025 표 5: 1~2회 더)
 'p2_sf_b.html':   rep('const sf=more<=0?0:more<=2?1:more<=4?2:3;','const sf=more<=0?0:more<=2?1:more<=3?2:3;'),   # 배변 횟수 2점 구간이 좁아짐(3~4회 더)
 'p2_usual_off.html':rep('base=usual??USUAL_BM_ASSUMED','base=USUAL_BM_ASSUMED'),                                          # 평소 배변 횟수를 무시
 'p2_blood_a.html':rep('(blood>=3||(blood===2&&bl*2>total))?2:1','blood>=3?2:1'),                                          # 가끔 뚜렷한 피 + 절반 넘는 횟수 → 2점이 빠짐
 'p2_blood_b.html':rep('const br=(blood===0&&bl===0)?0:','const br=(blood===0)?0:'),                                       # 피 섞인 횟수만 적은 기록이 0점
 'p2_rule7_off.html':rep('if(total>=7) return {stage:1','if(false) return {stage:1'),                                      # 하루 7회 이상 규칙 빠짐
 'p2_aux_off.html':rep('if(comp>=5) return {stage:1','if(false) return {stage:1'),                                         # 옛 보조 합산 규칙을 없애 민감도가 떨어짐
 'p2_remit_nosf.html':rep('if(p.sf===0&&total<=3&&p.br===0','if(total<=3&&p.br===0'),                                       # 관해가 평소 횟수 기준이 아님
 'p2_csv_old.html':rep('["날짜","빠른 기록","낮 배변"','["날짜","배변·혈변 점수(0-6)","낮 배변"'),  # 22차: CSV에 계산한 점수 열이 돌아옴
 # v1.12.0 수정 요청서 v2(2026-10-20): 항목 1~7·10, 진료기록 시안 v7. 새 규칙마다 하나씩
 'v2_toast_pushed.html':rep('body.pushed .toasts:not(.top),body.welcome .toasts:not(.top){','body.pushed .toasts,body.welcome .toasts{'),  # 항목 3: 끼니 상세에서 위쪽 알림이 화면 높이로 늘어남
 'v2_toast_left.html':rep('.toast .t-msg{flex:1;min-width:0;text-align:center;padding:8px 4px}','.toast .t-msg{flex:1;min-width:0;text-align:left;padding:8px 4px}'),  # 항목 4: 알림 글자가 왼쪽
 'v2_toast_asym.html':rep('.toast::before{content:"";flex:none;width:44px}','.toast::before{content:"";flex:none;width:0}'),  # 항목 4: × 자리만큼의 빈칸이 없어 글자가 치우침
 'v2_note_left.html':rep('.plan-note{display:block;text-align:center;margin:0 8px 16px}','.plan-note{display:block;text-align:left;margin:0 8px 16px}'),  # 항목 2: 홈 맨 아래 첫 안내 글이 왼쪽
 'v2_days_below.html':end("""{const __v=viewPlan; viewPlan=function(){const h=__v.apply(this,arguments); const a=h.indexOf('<div class="hero hero-days">'), b=h.indexOf('<div class="sec-title" id="meals">'), c=h.indexOf('<div class="list meals">'); return (a<0||b<a||c<b)?h:h.slice(0,a)+h.slice(b,c)+h.slice(a,b)+h.slice(c)}}"""),  # 항목 1: 날짜 띠가 다시 끼니 제목 아래
 'v2_ph_two.html':rep('placeholder="예시: 연어 포케, 크림 파스타"','placeholder="예: 연어 포케&#10;크림 파스타"'),  # 항목 7: 입력 안내 글자가 두 줄
 'v2_err_old.html':rep('메뉴 이름을 적어야 합니다. 여러 개는 쉼표로 구분합니다.','메뉴 이름을 한 줄에 하나씩 적어야 합니다.'),  # 항목 7: 빈 입력 오류가 쉼표를 설명하지 않음
 'v2_nb_off.html':rep('<span class="nb">지금: ','<span>지금: ').replace('function bindPhrases(root){\n  if(!root||!root.querySelectorAll) return;','function bindPhrases(root){\n  return;'),  # 항목 10: '지금: 값'이 줄 끝에서 갈라짐(20차부터 말 덩어리 묶기도 같은 곳을 묶어 함께 끔)
 'v2_nb_nowrap.html':rep('.nb{display:inline-block;max-width:100%;vertical-align:baseline}','.nb{white-space:nowrap}'),  # 항목 10·5: 묶음이 큰 글자·좁은 화면에서 가로로 넘침
 'v2_bind_off.html':rep('function groupRefs(root){ groupRefs0(root); bindGloss(root); bindDots(root); bindTail(root); bindMidDot(root); bindHyph(root); bindPhrases(root) }','function groupRefs(root){ groupRefs0(root); bindGloss(root) }'),  # 항목 5: 가운뎃점·쌍점 묶음 후처리 빠짐
 'v2_pretty_off.html':rep('p,li,dd,small,.hint,.muted,.banner,.wbody{text-wrap:pretty}','').replace('bindTail(root); bindMidDot(root);','bindMidDot(root);',1),  # 항목 5: 문단 끝 한 단어 방지(CSS와 5차 끝 두 낱말 묶기) 둘 다 빠짐. 하나만 빼면 다른 하나가 막아 줌
 'v2_why_off.html':rep('function mjLines(it,rc,f,base){','function mjLines(it,rc,f,base){return {lines:[],refs:[]};'),  # 항목 6: 외식 판정 이유 줄이 없음
 'v2_why_invent.html':rep('const WHY_REDMEAT="붉은 고기는 줄이도록 권합니다(IOIBD·ECCO)"','const WHY_REDMEAT="붉은 고기는 대장암 위험을 높입니다"'),  # 항목 6: 앱에 없는 새 의학 문장
 'v2_pdf_cover.html':rep('#printDoc .cover{border:1px solid #111;','#printDoc .cover{border:1px solid #D7DEE9;'),  # 시안 v7: 표지 테두리가 옛 연한 색
 'v2_pdf_footer_ko.html':rep('pdf.text(`${i}/${tot}`,PW-M,PH-14,{align:"right"});','pdf.text(`${i}쪽`,PW-M,PH-14,{align:"right"});'),  # 그림 PDF 바닥글에 한글을 글자로 씀(깨짐)
 'v2_pdf_disc_off.html':rep('앱은 기록을 분석하거나 판정하지 않습니다. UC TABLE은 의료기기가 아니며','앱은 기록을 분석하거나 판정하지 않습니다. UC TABLE은'),  # 22차: 음식 경험 문서의 '의료기기 아님' 안내가 빠짐

 # v4(개선점 10개)
 'v4_usual_onb_off.html':rep('if(u!=null) p.usualBM=String(u).trim();',''),  # 첫 실행 설정의 평소 배변 횟수가 저장되지 않음
 'v4_med_chip_off.html':rep('case "onbMedT": {onbSync(); const ml=S.profile.meds;','case "onbMedT": {onbSync(); const ml=[];'),  # 첫 실행 설정의 면역 약 칩이 복용 약에 안 들어감
 'v4_ecco_off.html':rep('저섬유·고섬유 식단 가운데 어느 쪽도 병을 가라앉힌다는 일관된 근거가 없다고 봅니다','식단이 병을 가라앉힌다고 봅니다'),  # 식단 단계 화면의 ECCO 섬유 단서가 사라지거나 뒤집힘
 'v4_iter_old.html':rep('const ENC_ITER=600000;','const ENC_ITER=310000;'),  # PBKDF2가 31만 회로 되돌아감
 'v4_iter_nocap.html':rep('return Number.isInteger(n)&&n>=1&&n<=ENC_ITER_MAX?n:0};','return Number.isInteger(n)&&n>=1?n:0};'),  # 가져온 백업의 반복 횟수 상한 없음
 'v4_vital_off.html':rep('x.temp=vital(x.temp,TEMP_MIN,TEMP_MAX); delete x.pulse;','delete x.pulse;'),  # 가져온 체온 범위 확인 없음
 'v4_trig_cap_off.html':rep('t.name.trim()).slice(0,500).map(t=>({...t,sym:','t.name.trim()).map(t=>({...t,sym:'),  # 주의 음식 개수 상한 없음
 # 재점검 반영(2026-10-24, 4차): tests/checks/v1122.cjs · t17
 'v5_usual_guard_off.html':rep('if(usualBad(p.usualBM)) e.push("평소 하루 배변 횟수는 0~20 사이의 정수");',''),  # 평소 배변 횟수 50도 저장
 'v5_future_off.html':rep('const fut=!!t.value&&t.value>today()','const fut=false'),  # 미래 날짜 기록
 'v5_msg_off.html':rep('v=storageHTML()+msgHTML()+v;','v=storageHTML()+v;'),  # 백업·PDF 화면에서 오류 안내가 안 보임
 'v5_pulse_keep.html':rep('x.temp=vital(x.temp,TEMP_MIN,TEMP_MAX); delete x.pulse;','x.temp=vital(x.temp,TEMP_MIN,TEMP_MAX);'),  # 옛 맥박을 그대로 가져옴
 'v5_drop_msg_off.html':rep('if(S.consent&&!LOAD_FAIL&&LOAD_DROPS&&(LOAD_DROPS.t||LOAD_DROPS.h)) alertMsg(dropMsg(LOAD_DROPS,true));',''),  # 비운 체온·맥박을 알리지 않음
 'v5_temp_guard_off.html':rep('if(d>0&&tempBad(draft.temp)&&','if(false&&'),  # 체온 380으로 넘어감
 'v5_tw_red_off.html':rep('else if(total>=6&&(+l.blood||0)>=3&&hot) severe.push(','else if(false) severe.push('),  # TW 중증인데 주황 경고
 'v5_legacy_off.html':rep('ENC.iter=+x.iter||ENC_ITER_LEGACY;','ENC.iter=+x.iter||ENC_ITER;'),  # 횟수 없는 옛 열쇠를 60만 회로 봄
 'v5_warn_order_off.html':rep('return [...L.filter(x=>x.tag),...L.filter(x=>!x.tag)];','return L;'),  # 해당하는 경고를 위로 올리지 않음
 'v5_tab_guard_off.html':rep('if(tab){if(tapGuard(e,"tab")) return;','if(tab){'),  # 저장 연타의 두 번째 탭이 아래 메뉴를 누름
 # 검토 13건 반영(2026-10-25, 5차): tests/checks/v1123.cjs
 'v6_manual_hint_off.html':rep('if(S.stageMode==="auto"||+S.stageMode<2||currentStage().stage===1) return "";','return "";'),  # 22차: 직접 고른 단계인데 기록이 가장 부드러운 단계에 맞아도 묻지 않음
 'v6_why2_off.html':rep('if(w.length) return {stage:2,label:`배변·혈변 점수는 0점이지만','if(false) return {stage:2,label:`배변·혈변 점수는 0점이지만'),  # 점수 0점인데 관해가 아닌 까닭이 없음
 'v6_weight_ask_off.html':rep('if(pv&&Math.abs(kg-pv.kg)/pv.kg>0.05){','if(false){'),  # 몸무게가 크게 바뀌어도 묻지 않음
 'v6_height_off.html':rep('if(h!==""&&!(+h>=100&&+h<=250)) e.push("키는 100~250cm");',''),  # 키 1700 저장
 'v6_past_esc_off.html':rep('rated.map(r=>`${esc(FOOD[r.foodId]?.name||r.name||"")}','rated.map(r=>`${FOOD[r.foodId]?.name||r.name||""}'),  # 지난 기록 화면 이스케이프 빠짐
 'v6_enc_chk_off.html':rep('if(t!==ENC_CHK) return false;','return false;'),  # 비밀번호 확인이 늘 틀렸다고 함
 'v6_prev_ls.html':rep('try{await idb("kv","readwrite",st=>st.put(rec,"prev")); try{localStorage.removeItem(PREV_KEY)}catch(e){} prevSet(rec); return true}','try{throw 0}'),  # 불러오기 전 기록을 다시 localStorage에 복사
 'v6_alert_dedupe_off.html':rep('if(ALERT_SEEN.has(k)) el.removeAttribute("role")',''),  # 다시 그릴 때마다 경고를 다시 읽힘
 'v6_csv_ctx_off.html':rep('LV[fs(f).level]])}','LV[foodStatus(f).level]])}'),  # CSV가 줄마다 판정 조건을 다시 계산
 'v6_flex_wrap_off.html':rep('const putFrag=(n,frag)=>{ if(inFlex(n.parentElement))','const putFrag=(n,frag)=>{ if(false)'),  # flex 단추 안 글자 묶음이 따로 떨어져 벌어짐
 'v6_paren_off.html':rep('const RE=/\\S ?·|[)\\]][가-힣]/g;','const RE=/\\S ?·/g;'),  # 닫는 괄호 뒤 조사만 다음 줄로
 'v6_small_floor_off.html':rep('small{font-size:max(.8333em,.75rem)}',''),  # 작은 글씨가 12px보다 작아짐
 'v6_track_off.html':rep(':is(h1,h2,h3,h4) :is(.pill,.hint,small){letter-spacing:0}',''),  # 제목 안 작은 글씨가 제목 자간을 물려받음
 # 6차 검토 반영(2026-10-26~27): tests/checks/v1124.cjs
 'v7_cross_lead_off.html':rep('CROSS_LEAD=/(?:이|본|해당)\\s*제품/g','CROSS_LEAD=/(?!)/g'),  # '이 제품은 …' 앞 알레르기 나열이 같은 시설 문장에서 빠짐
 'v7_restore_busy_off.html':rep('if(!PENDING_RESTORE||RESTORE_BUSY) return;','if(!PENDING_RESTORE) return;'),  # 합치기 연타가 두 번 실행
 'v7_msg_alert_off.html':rep('<div class="banner warn msg-b" role="alert">','<div class="banner warn msg-b">'),  # 오류 안내를 화면 읽기 프로그램이 바로 읽지 않음
 'v7_passive_back.html':rep('길병원 저잔사식은 팝콘을 제한하고 대한장연구학회는 팝콘을 증상을 일으키기 쉬운 음식으로 꼽습니다.','팝콘은 저잔사식 제한 식품이고, 관해기에도 증상을 일으키기 쉬운 음식으로 안내됩니다.'),  # 주어 없는 피동 문장이 다시 들어옴
 'v7_chip_bind_off.html':rep('g.parentNode.normalize(); const pv=g.previousSibling;','const pv=null;'),  # 근거 칩만 다음 줄로 넘어감
 'v7_hyph_off.html':rep('bindMidDot(root); bindHyph(root); bindPhrases(root) }','bindMidDot(root); bindPhrases(root) }'),  # 제목의 STRIDE-II가 붙임표 뒤에서 갈라짐
 'v7_bottom_cols.html':rep('.bottom-bar.two{grid-template-columns:auto minmax(50%,1fr)}','.bottom-bar.two{grid-template-columns:1fr 2fr}'),  # 아래 두 단추의 보조 단추 글자가 두 줄로
 # 7차 리팩토링 중 다시 찾은 결함(2026-10-27): tests/checks/v1125.cjs
 'v8_share_icon.html':rep('b2.innerHTML=`${ic("share")} PDF 공유`','b2.textContent="PDF 공유"'),  # PDF 공유 뒤 단추 아이콘이 사라짐
 'v8_ready_catch.html':rep('"공유했습니다")},()=>{}); break}','"공유했습니다")}); break}'),  # 공유 준비 파일 저장 거절이 처리하지 않은 오류로
 'v8_cup_toast.html':rep('toast(`물 ${n*S.cupMl}ml`)','toast(`물 ${(n+1)*S.cupMl}ml`)'),  # 물 알림이 적힌 양과 다름
 # 8차 외부 검토 반영(2026-10-29): tests/checks/v1126.cjs
 'v9_fulminant15.html':rep('if(total>10) severe.push(','if(total>=15) severe.push('),  # 하루 11~14회에 빨간 경고 없음
 'v9_aux_label.html':rep('몸 상태, 장 밖 증상을 합친 보조 점수','몸 상태를 합친 보조 점수'),  # 보조 점수 설명에 장 밖 증상 빠짐
 # 9·10차(2026-10-29): 변 모양 한 줄 tests/checks/v1126.cjs, 경고 한 줄·하루 한 번 간식 tests/checks/v1129.cjs
 'v10_stool_grid.html':rep('.wq .opts.compact[aria-labelledby="wqt_stool"]{','.wq .opts.compact[aria-labelledby="wqt_none"]{'),  # 변 모양 '2 울퉁불퉁한 소시지'가 다시 두 줄
 'v10_warn_inline.html':rep('${warnRow()}','${warnHTML()}'),  # 내 정보에 경고 목록이 다시 펼쳐짐
 'v10_no_cup.html':rep('if(D&&dayTot().ca<tg.ca*0.9){','if(false){'),  # 칼슘이 모자란 날에도 저녁 우유 한 컵이 없음
 'v10_meal_count.html':rep('const MS=mealSlots(), mealN=','const MS=SLOTS, mealN='),  # 간식 표시가 '끼니 표시'에 섞임(v1.13.0: 두 끼를 고르면 그 끼니만)
 'v10_swap3.html':rep('\\|[0-4]$/.test(k)&&typeof v==="string"','\\|[0-2]$/.test(k)&&typeof v==="string"'),  # 바꾼 간식이 불러오기 검사에서 지워짐
 # v1.13.0(2026-11-01 사용자 요청 2·5·6·11~13·19·20·28번)
 'v13_usual3.html':rep('const USUAL_BM_ASSUMED=1;','const USUAL_BM_ASSUMED=3;'),  # 평소 횟수를 비우면 다시 3회로 계산
 'v13_no_notice.html':rep('${p2.assumed?` 평소 하루 배변 횟수를 적지 않아 ${p2.base}회를 평소로 보았습니다','${false?` 평소 하루 배변 횟수를 적지 않아 ${p2.base}회를 평소로 보았습니다'),  # 22차: 기록 요약에 1회를 평소로 보았다는 고지 없음
 'v13_no_ask.html':rep('if(usualBM()===null&&!S.usualAsk){S.usualAsk=today(); save(); askUsual()}',''),  # 첫 기록 저장 뒤 평소 횟수를 묻지 않음
 'v13_stage1_desc.html':rep('desc:"증상이 심할 때만 잠깐, 섬유가 적은 음식을','desc:"섬유가 적은 음식을'),  # 섬유를 줄인 식사가 '증상이 심할 때만'이라는 말 빠짐
 'v13_skip_ignored.html':rep('if(skipsMeal(k)) return {slot:SLOTS[n],title:"거르는 끼니"','if(false) return {slot:SLOTS[n],title:"거르는 끼니"'),  # 두 끼를 골라도 세 끼가 나옴
 'v13_mm_no_snack.html':rep('["B","L","D","S"].includes(u.slot)&&typeof u.title==="string"','["B","L","D"].includes(u.slot)&&typeof u.title==="string"'),  # 간식 내 메뉴가 불러오기 검사에서 지워짐
 'v13_pick_first.html':rep('const PICK_W=8,','const PICK_W=1,'),  # 메뉴를 고를 때 칼슘·섬유를 보지 않음
 'v13_no_snack_x.html':rep('for(const f of [1.25,1.5,1.75,2]){','for(const f of []){'),  # 열량이 모자라도 간식 양을 늘리지 않음
 'v13_no_gloss.html':rep('groupRefs0(root); bindGloss(root);','groupRefs0(root);'),  # 용어 뒤 '?' 풀이 단추 없음
 # v1.13.0 외부 검토 반영(2026-11-01)
 'v13r_cup_hidden.html':rep('const D=[meals[2],meals[1],meals[0]].find(served);','const D=meals[2];'),  # 저녁을 거르면 보이지 않는 칸에 우유가 들어감
 'v13r_mult_label.html':rep('if(r>=1.1) S3.mult=r','if(r>=1.1) S3.mult=2'),  # 간식이 실제보다 큰 배율로 적힘
 'v13r_onb3.html':rep('(비우면 하루 ${USUAL_BM_ASSUMED}회로 봅니다)','(비우면 하루 3회로 봅니다)'),  # 첫 실행 안내가 다시 3회
 'v13r_remind_skip.html':rep('const remOn=()=>S.remind.on.filter(k=>!skipsMeal(k));','const remOn=()=>S.remind.on;'),  # 거르는 끼니 알림이 증상 기록 알림을 가림
 'v13r_merge_skip.html':rep('{if(k==="skipMeal") continue; const c=m.profile[k];','{const c=m.profile[k];'),  # 합치기가 3끼 설정을 바꿈
 'v13r_na_last.html':rep('const val=last?(','const val=false?('),  # 마지막 단계에서 나트륨을 보지 않음
 'v13r_na_note.html':rep('return P.sample&&t.na>lim?','return false&&t.na>lim?'),  # 나트륨 상한 초과 안내 없음
 # v1.13.0 다시 확인(2026-11-02)·리팩토링: 한 곳에 모은 판단이 틀리면 점검이 잡는지
 'v13s_kcal_note.html':rep('!d.meals.some(m=>m.empty&&!m.snack)','!d.meals.some(m=>m.empty)'),  # 빈 간식 칸이 열량 부족 안내를 막음
 'v13s_rem_row.html':rep('${REM_ITEMS.filter(([k])=>!skipsMeal(k)).map(([k,l])=>','${REM_ITEMS.map(([k,l])=>'),  # 알림 설정에 거르는 끼니 줄이 남음
 'v13s_skips_never.html':rep('const skipsMeal=k=>k===S.profile.skipMeal;','const skipsMeal=k=>false;'),  # 거르는 끼니를 어디서도 모름
 'v13s_served_off.html':rep('const served=m=>!!m&&!m.empty&&!m.off;','const served=m=>!!m&&!m.empty;'),  # 거르는 칸도 차려지는 끼니로 봄
 'v13s_cup_final.html':rep('if(dayTot().ca-totals([cup]).ca>=tg.ca*0.9){ cupAt.items.pop(); growSnack() }','if(false){ cupAt.items.pop(); growSnack() }'),  # 간식·양 조절로 칼슘이 채워져도 우유 한 컵이 남음
 # 2026-11-02 전체 리팩토링: 한 곳에 모은 계산이 틀리면 점검이 잡는지
 'rf_bmtotal.html':rep('const bmTotal=l=>(+l.day||0)+(+l.night||0);','const bmTotal=l=>(+l.day||0);'),  # 밤 배변을 빼고 셈(점수·단계·경고·그래프가 함께 틀림)
 'rf_tempbad.html':rep('const TEMP_MIN=34, TEMP_MAX=42,','const TEMP_MIN=34, TEMP_MAX=420,'),  # 체온 380℃를 받아들임
 'rf_atefood.html':rep('const ateFoodIds=m=>(m?.it||[]).map(([id])=>id).filter(id=>FOOD[id]&&!FOOD[id].tags.includes("oil"));','const ateFoodIds=m=>(m?.it||[]).map(([id])=>id).filter(id=>FOOD[id]);'),  # 기름도 먹은 음식으로 셈
 'rf_swapmenu.html':rep('const swapMenu=(key,date,n)=>{const ov=S.swaps?.[`${date}|${n}`];','const swapMenu=(key,date,n)=>{const ov=S.swaps?.[`${date}|${n+1}`];'),  # 직접 바꾼 메뉴를 다른 칸에서 찾음
 'rf_trighead.html':rep('<small>${esc(t.source||"직접")}${t.date?` · ${md(t.date)}`:""}','<small>${esc(t.source||"직접")} · ${t.date?md(t.date):""}'),  # 날짜 없는 주의 음식 줄에 '·'가 겹침
 'rf_aesiv.html':rep('async function aesEnc(key,text){const iv=crypto.getRandomValues(new Uint8Array(12));','const AES_IV=new Uint8Array(12); async function aesEnc(key,text){const iv=AES_IV;'),  # 암호화 IV를 매번 같은 값으로
 # 15차(2026-11-10)
 'r15_snack_ref.html':rep('totals(S3.items).k/Math.max(1,totals(snack0).k)','totals(S3.items).k/Math.max(1,totals(base).k)'),  # 간식 '양 N배'를 양 조절 뒤 양 기준으로(1.2배라 적고 실제 1.83배)
 'r15_menufoods.html':rep('const st=statusOf(c);   // 15차 9번','const st=f=>foodStatus(f,c);   // '),  # 식단 바꾸기·음식 탭마다 음식 1,771개를 다시 판정
 # 20차 말 덩어리 줄바꿈
 'r20_phrase_off.html': rep('function bindPhrases(root){\n  if(!root||!root.querySelectorAll) return;','function bindPhrases(root){\n  return;'),   # 말 덩어리 묶기 빠짐
 'r20_ragged.html': rep('  return !!last&&last.top<r.top-g.lh/2&&(last.right-g.L)/g.W<0.55}','  return false}'),   # 앞 줄이 짧아져도 묶음(들쭉날쭉한 줄)
 # 22차(2026-11-16): 기록값은 식단 단계에만. 경고·상태 판정·점수가 돌아오거나 음식 경험 문서가 비면 잡아야 함
 'r22_alert_back.html':end('const _sh=stageHintHTML; stageHintHTML=()=>{const l=latestLog(1); const d=dangerSignals(l); return (d.severe.length||d.urgent.length?`<div class="banner crit" role="alert"><strong>병원에 내원하십시오</strong></div>`:"")+_sh()};'),  # 기록값 경고 띠가 돌아옴
 'r28_ridge_counts.html':rep('<span class="r-name">${nm}</span>','<span class="r-name">${tl?`배변 ${bmTotal(tl)}회 · 혈변 ${+tl.bloody||0}회`:nm}</span>'),  # 홈 맨 위에 다시 배변·혈변 횟수(28차)
 'r22_graph_score.html':rep('return {d,v:l?bmTotal(l):null,','return {d,v:l?pro2(l).sum:null,'),  # 그래프가 다시 점수를 그림
 'r22_pdf_unrated.html':rep('for(const sl of SLOTS) if(isAte(d,sl)) for(const [id] of ateItems(d,sl)) if(ids.has(id)','for(const sl of SLOTS) if(false) for(const [id] of ateItems(d,sl)) if(ids.has(id)'),  # 평가 없이 먹은 날이 문서에서 빠짐
 'r22_pdf_nosym.html':rep('if(!l) return "기록 없음";','return "기록 없음";'),  # 그날 적은 증상이 문서에서 빠짐
 # 23차(2026-11-16): 식단 단계 이름(저잔사식·지중해식·정상식)과 지중해식 단계 식단
 'r23_medstage_off.html':rep('const medStage=c.stage===2, RED_MAX=2','const medStage=false, RED_MAX=2'),  # 지중해식 단계가 생선·올리브유 메뉴를 먼저 고르지 않음
 'r23_redcap_off.html':rep('      if(medStage&&wk.red>=RED_MAX&&hasRed(a)) return false;','      if(false) return false;'),  # 붉은 고기 주 2번 제한 빠짐
 'r23_sup_off.html':rep('<span class="sr-only">(${STAGES[n].plain})</span>',''),  # 식사 이름 옆 먹는 내용(화면 읽기용 괄호)이 빠짐
 'r23_old_name.html':rep('2:{name:"지중해식",plain:"생선·채소·올리브유 위주 식사"','2:{name:"이행식",plain:"조금씩 늘리는 식사"'),  # 옛 단계 이름이 돌아옴
 # v1.13.0 25차 조약돌 탭(결정 57)
 'r25_any_meal.html':rep('return req.every(s=>a.includes(s)||(rated?rated.has(d+"|"+s):isRated(d,s)))','return SLOTS.some(s=>a.includes(s)||(rated?rated.has(d+"|"+s):isRated(d,s)))'),  # 한 끼만 먹어도(간식 포함) 조약돌
 'r25_happy_always.html':rep('<div class="peb-dock"><span class="dari dari-n${sad?','<div class="peb-dock"><span class="dari dari-h${sad?'),  # 평소에도 기뻐하는 달이
 # v1.13.0 27차 첫 화면 달이·홈 단계 단추
 'r27_intro_nodari.html':rep('<div class="intro-dock"><span class="dari dari-n" role="img" aria-label="내다보는 수달 달이"></span>','<div class="intro-dock">'),  # 첫 화면 맨 아래 달이가 빠짐
 'r30_stage_gq_back.html':rep('<span class="sr-only">(${STAGES[n].plain})</span></span>`:"";','<span class="sr-only">(${STAGES[n].plain})</span>${dots?gqBtn(["","lowres","med","normal"][n],STAGES[n].name):""}</span>`:"";'),  # 식단 단계 이름 옆에 다시 '?'(30차)
 'r30_lowres_gq_back.html':rep('[/FODMAP/,"fodmap"]]),','[/FODMAP/,"fodmap"],[/저잔사식/,"lowres"]]),'),  # 저잔사식 옆에 다시 '?'(30차)
 'r28_gq_circle.html':rep('.gq-b::before{content:"?"}','.gq-b::before{content:"?"}.gq-b{border:1px solid currentColor;border-radius:50%;width:1.5em;height:1.5em}'),  # 용어 '?'가 다시 큰 동그라미(28차)
 'r28_day_label.html':rep('{k:"day",t:"낮중 배변",type:"step"}','{k:"day",t:"낮 동안 배변",type:"step"}'),  # 증상 기록 말이 다시 '낮 동안 배변'(28차)
 # v1.13.0 29차 사용 방법
 'r29_howto_once_off.html':rep('if(HOWTO_NEXT&&S.consent&&!onbActive()&&!SCR&&S.tab==="plan"){HOWTO_NEXT=false; openSheet(howtoHTML())}',''),  # 처음 설정 뒤 사용 방법 창이 안 뜸
 'r29_howto_btn_off.html':rep('${S.tab==="plan"?\'<button class="bar-btn" data-act="howto">사용 방법</button>\':""}',''),  # 홈 오른쪽 위 '사용 방법' 단추가 빠짐
 # v1.13.0 33차: 하루 4끼(오후 끼니)·숫자 칸 쉼표 경고·캘린더 줄 접기·실패 알림
 'r33_four_off.html':rep('const fourMeals=(p=S.profile)=>!p.skipMeal&&(p.mealsN==="4"||(!p.mealsN&&targets().k>=FOUR_KCAL));','const fourMeals=(p=S.profile)=>false;'),  # 목표 2,000kcal 이상이어도 4끼가 안 됨
 'r33_aft_view.html':rep('MEAL_VIEW=[0,1,4,2,3]','MEAL_VIEW=[0,1,2,3,4]'),  # 오후 끼니가 간식 뒤에 보임
 'r33_swap4_off.html':rep('\\|[0-4]$/.test(k)&&typeof v==="string"','\\|[0-3]$/.test(k)&&typeof v==="string"'),  # 오후 끼니에서 바꾼 메뉴가 다시 열면 사라짐
 'r33_comma_off.html':rep('if(numIn(el)&&txt.includes(",")){e.preventDefault(); commaWarn(el)}','if(false){e.preventDefault(); commaWarn(el)}'),  # 숫자 칸 쉼표 경고 창이 안 뜸
 'r33_fold_off.html':rep('out.push(cur); return out.join("\\r\\n ")};','out.push(cur); return l};'),  # 캘린더 파일의 긴 줄을 접지 않음
 'r33_encoff_silent.html':rep('catch(e){ok=false; toast("백업 암호화 설정을 지우지 못했습니다. 한 번 더 끄면 됩니다")}','catch(e){ok=false}'),  # 암호화 끄기가 실패해도 알리지 않음
 'r33_peb_three.html':rep('const mealSlots=()=>[...oldSlots(),...(fourMeals()?["오후"]:[])];','const mealSlots=()=>oldSlots();'),  # 4끼를 골라도 세 끼만 먹으면 조약돌
 'r34_step_off.html':rep('S.onb=installStep()?"i":"0";','S.onb="0";'),  # 시작하기 다음 설치 화면이 안 나옴
 'r34_bip_btn_off.html':rep('${BIP?`<button class="btn primary full" data-act="installApp">${ic("inst")} 앱 설치하기</button>`:""}',''),  # 설치 창이 준비돼도 '앱 설치하기' 단추가 없음
 'r34_installed_off.html':rep('BIP=null; INSTALLED=true;','BIP=null;'),  # 설치한 뒤에도 설치 방법을 계속 보임
 'r34_standalone_off.html':rep('&&!isStandalone()&&!window.UCTableAndroid&&location.protocol!=="file:"','&&!window.UCTableAndroid&&location.protocol!=="file:"'),  # 설치한 앱으로 열어도 설치 화면
 'r34_resume_off.html':rep('const st=S.onb==="i"&&!installStep()?"0":S.onb||"";','const st=S.onb||"";'),  # 설치 화면에서 멈췄다가 설치한 앱으로 열면 또 설치 화면
 'r34_norm_off.html':rep('s.onb=["done","i","0","1","2","3"].includes','s.onb=["done","0","1","2","3"].includes'),  # 설치 화면에서 다시 열면 첫 실행 설정을 건너뜀
 'r34_inapp_off.html':rep('const inApp=()=>/','const inApp=()=>false&&/'),  # 카카오톡 안에서 설치 방법만 보이고 크롬으로 열기가 없음
 'r34_intent_off.html':rep('#Intent;scheme=https;package=com.android.chrome;','#Intent;scheme=https;'),  # '크롬으로 열기'가 크롬을 지정하지 않음
 'r34_kakao_ios_off.html':rep('href="kakaotalk://web/openExternal?url=${encodeURIComponent(SITE)}"','href="${SITE}"'),  # 아이폰 카카오톡에서 사파리로 열지 못함
 'r34_ios_note_off.html':rep('${ios&&onb?`<p class="ins-note">','${false?`<p class="ins-note">'),  # 아이폰에 설치한 앱으로 열어 시작하라는 안내가 없음
 'r35_override_off.html':rep('return mine?{...out,level:mine,','return false?{...out,level:mine,'),  # 직접 옮긴 분류를 무시함
 'r35_ctx_off.html':rep('trig:S.triggers, myLv:S.myLv||{},','trig:S.triggers,'),  # 판정 조건에 직접 옮긴 분류가 빠짐
 'r35_plansig_off.html':rep('S.stageMode,S.myLv])}','S.stageMode])}'),  # 분류를 옮겨도 7일 식단을 다시 짜지 않음
 'r35_tag_off.html':rep("${s.mine?'<span class=\"mine-tag\">직접 옮김</span>':\"\"}",''),  # 음식 정보에 '직접 옮김'이 없음
 'r35_appline_off.html':rep('${s.mine?`<p class="app-line">','${false?`<p class="app-line">'),  # 옮긴 음식에 앱 판정이 안 보임
 'r35_reset_off.html':rep('if(!v||v===app.level) delete S.myLv[id]; else S.myLv[id]=v;','if(!v||v===app.level){} else S.myLv[id]=v;'),  # 앱 판정대로 되돌리지 못함
 'r35_ask_off.html':rep('&&allergyBan(app)&&!a.dataset.ok){MV_ASK={id,v};','&&false&&!a.dataset.ok){MV_ASK={id,v};'),  # 알레르기 음식을 묻지 않고 옮김
 'r35_filter_off.html':rep('(lvf==="mine"?!!s.mine:','(lvf==="mine"?true:'),  # '직접 옮긴 음식' 걸러 보기가 모든 음식을 보임
 'r35_norm_off.html':rep('s.myLv={}; for(const [k,v] of Object.entries(obj(o.myLv)||{}))','s.myLv={}; for(const [k,v] of Object.entries({}))'),  # 다시 열면 옮긴 분류가 사라짐
 'r35_merge_off.html':rep('for(const [k,v] of Object.entries(B.myLv||{})) if(!(k in m.myLv)) m.myLv[k]=v;',''),  # 백업을 합칠 때 옮긴 분류를 버림
 'r35_list_tag_off.html':rep("${s.mine?'<b class=\"mine-m\">직접 옮김</b> · ':\"\"}",''),  # 목록 줄에 '직접 옮김'이 없음
 'r36_days4.html':rep('const PEB_SAD_DAYS=3;','const PEB_SAD_DAYS=4;'),  # 사흘째에 슬퍼하지 않음
 'r36_skip_off.html':rep('for(const m of [S.ate||{},S.skips||{}])','for(const m of [S.ate||{}])'),  # '안 먹음'을 눌러도 슬퍼함
 'r36_rate_off.html':rep('for(const r of S.ratings) if(r.date<=t&&r.date>last) last=r.date;',''),  # 끼니를 평가해도 슬퍼함
 'r36_start_off.html':rep('mealCheckLast()||S.consent?.date||today()','mealCheckLast()||today()'),  # 한 번도 안 누르면 슬퍼하지 않음
 'r36_dock_off.html':rep('dari-n${sad?" dari-c":""}','dari-n'),  # 조약돌 탭 달이가 울지 않음
 'r36_tap_off.html':rep('PEB_TAP=S.tab==="peb";',''),  # 조약돌 탭을 눌러도 창이 안 뜸
 'r36_loop.html':rep('if(PEB_TAP){PEB_TAP=false; const n=pebSadDays();','if(true){PEB_TAP=false; const n=pebSadDays();'),  # 창을 닫아도 다시 그릴 때마다 또 뜸
 'r36_img_off.html':rep('.dari-c{background-image:url(${DARI.c})}',''),  # 우는 달이 그림이 빠짐
 'r36_go_off.html':rep('case "pebSadGo": closeSheet(); SCR=null; S.tab="plan";','case "pebSadGo": closeSheet(); SCR=null;'),  # '오늘 끼니 표시하기'가 홈으로 가지 않음
 'r37_lb_fixed.html':rep('.peb-lb{position:absolute;top:calc(122% + 2px);','.peb-lb{position:absolute;top:calc(100% + 6px);'),  # 칸 글씨가 둘레를 따라가지 않아 넓은 화면에서 점선과 겹침
 'r37_rows.html':rep('PEB_Y=[30,94,158,222,286]','PEB_Y=[30,84,138,192,246]'),  # 줄 사이가 좁아 19번째 칸 글씨가 '30 · k단계' 둘레에 닿음
 'r37_end_off.html':rep('end=c===5&&r<4?(r%2?" pt-el":" pt-er"):""','end=""'),  # 줄 끝 칸 글씨가 굽은 강 점선에 닿음
 'r37_lh.html':rep('line-height:1;font-weight:600;color:var(--on-soft)}','line-height:1.2;font-weight:600;color:var(--on-soft)}'),  # 좁은 화면에서 칸 글씨가 아래 칸 둘레에 닿음
 'r33_peb_retro.html':rep('const req=d===today()?mealSlots():(S.daySlots?.[d]||oldSlots());','const req=mealSlots();'),  # 끼니 수를 바꾸면 지난 조약돌 수가 달라짐
 'r25_recelebrate.html':rep('if(done>S.peb.seen){S.peb.seen=done; save(); openSheet(pebUpHTML(done,P)); return}','if(done>S.peb.seen){openSheet(pebUpHTML(done,P)); return}'),  # 같은 바퀴를 들어올 때마다 축하
}
for n,t in mut.items():
    assert t!=s, n
    open(os.path.join(M,n),'w',encoding='utf-8').write(t)
print('mutants',len(mut))
PY
[ $? -eq 0 ] || { echo "돌연변이 앱을 만들지 못했습니다(대상 문자열 확인)"; exit 1; }
# 돌연변이 앱 ← 그것을 잡아야 하는 점검
PAIRS="r23_medstage_off.html tests/checks/v1130f.cjs
r23_medstage_off.html tests/checks/menus.cjs
r23_redcap_off.html tests/checks/v1130f.cjs
r23_sup_off.html tests/checks/v1130f.cjs
r23_old_name.html tests/checks/v1130f.cjs
r25_any_meal.html tests/checks/v1130h.cjs
r25_happy_always.html tests/checks/v1130h.cjs
r25_recelebrate.html tests/checks/v1130h.cjs
food_rule.html tests/checks/foods.cjs
food_rule.html tests/checks/gil_audit.cjs
wide.html tests/checks/ui_audit.cjs
page_error.html tests/regression/t4.cjs
load_crash.html tests/checks/load_state.cjs
search_ime.html tests/checks/search.cjs
sodium.html tests/checks/v150.cjs
fatty.html tests/checks/data_audit.cjs
fatty.html tests/checks/v150.cjs
medical.html tests/checks/v150.cjs
renal.html tests/checks/v150.cjs
nofiber.html tests/checks/v150.cjs
totals.html tests/checks/v150.cjs
swapkey.html tests/regression/t24b.cjs
noscale.html tests/checks/menus.cjs
lactose.html tests/checks/data_audit.cjs
allergy.html tests/checks/data_audit.cjs
recipe.html tests/checks/menus.cjs
touch.html tests/checks/a11y.cjs
retain.html tests/checks/retain.cjs
danger.html tests/regression/t13.cjs
josa.html tests/checks/v150.cjs
click_throw.html tests/checks/click_fuzz.cjs
shop_nan.html tests/checks/click_fuzz.cjs
relist.html tests/checks/tap_search.cjs
ramen_fried.html tests/checks/v150.cjs
qa_food.html tests/checks/foods.cjs
qa_onechar.html tests/checks/foods.cjs
qa_related.html tests/regression/core.cjs
pe_noask.html tests/regression/t28.cjs
pe_nodraft.html tests/regression/t28.cjs
onb_skip.html tests/regression/t29.cjs
ratio_off.html tests/regression/t29.cjs
stale_off.html tests/regression/t29.cjs
merge_off.html tests/regression/t29.cjs
bmi_off.html tests/regression/t29.cjs
fserv_off.html tests/regression/t29.cjs
shortok_off.html tests/regression/t29.cjs
wzbar_anim.html tests/regression/t29.cjs
visual_css.html tests/visual/visual.cjs
nav_over.html tests/regression/t29.cjs
tabs_hit.html tests/regression/t29.cjs
logo_gone.html tests/regression/t29.cjs
shop_cook.html tests/checks/v150.cjs
shop_dish.html tests/checks/v150.cjs
done_clash.html tests/checks/v190.cjs
ham_soft.html tests/checks/v1100.cjs
idmap_off.html tests/checks/v1100.cjs
broad_off.html tests/checks/v1100.cjs
pc_full.html tests/checks/v1100.cjs
toast_top.html tests/checks/v1100.cjs
csv_inj.html tests/checks/v1100.cjs
migrate_twice.html tests/checks/v1100.cjs
protein_up.html tests/checks/v1100.cjs
later_word.html tests/checks/v1100.cjs
allergy_soft.html tests/checks/review2.cjs
body_margin.html tests/checks/review2.cjs
enc_plain.html tests/checks/v1110.cjs
mj_allergy_off.html tests/checks/v1120.cjs
fs_sig_off.html tests/checks/v1120.cjs
raw_kw_off.html tests/checks/v1120.cjs
reset_keep_off.html tests/checks/v1120.cjs
own_off.html tests/checks/v1120.cjs
alc_ingr_off.html tests/checks/v1120b.cjs
alc_menu_off.html tests/checks/v1120b.cjs
alc_label_off.html tests/checks/v1120b.cjs
alc_sugar.html tests/checks/v1120b.cjs
alc_spoon.html tests/checks/v1120b.cjs
alc_juj.html tests/checks/v1120b.cjs
alc_cook_off.html tests/checks/v1120b.cjs
alc_cook_ing_off.html tests/checks/v1120b.cjs
alc_cookdish_off.html tests/checks/v1120b.cjs
poly_ingr_off.html tests/checks/v1120b.cjs
poly_tag_off.html tests/checks/v1120b.cjs
poly_label_caution.html tests/checks/v1120b.cjs
poly_label_extra_off.html tests/checks/v1120b.cjs
poly_menu_off.html tests/checks/v1120b.cjs
poly_nutri_caution.html tests/checks/v1120b.cjs
alc_ruleingr_off.html tests/checks/v1120b.cjs
alc_label_name_cook.html tests/checks/v1120b.cjs
alc_cookname_off.html tests/checks/v1120b.cjs
alc_bracket_off.html tests/checks/v1120b.cjs
alc_pct_off.html tests/checks/v1120b.cjs
alc_juice_off.html tests/checks/v1120b.cjs
alc_kw_podoju.html tests/checks/v1120b.cjs
alc_kw_alkol.html tests/checks/v1120b.cjs
alc_detail_why.html tests/checks/v1120b.cjs
poly_f0_off.html tests/checks/v1120b.cjs
enc_failopen.html tests/checks/v1120.cjs
copy_await.html tests/checks/v1120.cjs
share_await.html tests/checks/v1120.cjs
wipe_skip.html tests/checks/v1120.cjs
sync_name_only.html tests/checks/v1120.cjs
font_gap.html tests/checks/font_cover.cjs
font_textsym.html tests/checks/font_cover.cjs
crust_off.html tests/checks/v1120.cjs
crust_food_off.html tests/checks/v1120.cjs
sc_gt5.html tests/regression/t7.cjs
sc_ge6.html tests/regression/t7.cjs
bloody_gt4.html tests/regression/t7.cjs
remit_le4.html tests/checks/pro2.cjs
p2_sf_a.html tests/checks/pro2.cjs
p2_sf_b.html tests/checks/pro2.cjs
p2_usual_off.html tests/checks/pro2.cjs
p2_blood_a.html tests/checks/pro2.cjs
p2_blood_b.html tests/checks/pro2.cjs
p2_rule7_off.html tests/checks/pro2.cjs
p2_aux_off.html tests/checks/pro2.cjs
p2_remit_nosf.html tests/checks/pro2.cjs
p2_csv_old.html tests/checks/pro2.cjs
v2_toast_pushed.html tests/checks/req2.cjs
v2_toast_left.html tests/checks/req2.cjs
v2_toast_asym.html tests/checks/req2.cjs
v2_note_left.html tests/checks/req2.cjs
v2_days_below.html tests/checks/req2.cjs
v2_ph_two.html tests/checks/req2.cjs
v2_err_old.html tests/checks/req2.cjs
v2_nb_off.html tests/checks/req2.cjs
v2_nb_nowrap.html tests/checks/req2.cjs
v2_bind_off.html tests/checks/wrap.cjs
v2_pretty_off.html tests/checks/wrap.cjs
v2_why_off.html tests/checks/req2.cjs
v2_why_invent.html tests/checks/req2.cjs
v2_pdf_cover.html tests/checks/pdf7.cjs
v2_pdf_footer_ko.html tests/checks/pdf7.cjs
v2_pdf_disc_off.html tests/checks/pdf7.cjs
v4_usual_onb_off.html tests/checks/v1121.cjs
v4_med_chip_off.html tests/checks/v1121.cjs
v4_ecco_off.html tests/checks/v1121.cjs
v4_iter_old.html tests/checks/v1121.cjs
v4_iter_nocap.html tests/checks/v1121.cjs
v4_vital_off.html tests/checks/v1121.cjs
v4_trig_cap_off.html tests/checks/v1121.cjs
v5_usual_guard_off.html tests/checks/v1122.cjs
v5_future_off.html tests/checks/v1122.cjs
v5_msg_off.html tests/checks/v1122.cjs
v5_pulse_keep.html tests/checks/v1122.cjs
v5_drop_msg_off.html tests/checks/v1122.cjs
v5_temp_guard_off.html tests/checks/v1122.cjs
v5_tw_red_off.html tests/checks/v1122.cjs
v5_legacy_off.html tests/checks/v1122.cjs
v5_warn_order_off.html tests/checks/v1122.cjs
v5_tab_guard_off.html tests/checks/v1122.cjs
v6_manual_hint_off.html tests/checks/v1123.cjs
v6_why2_off.html tests/checks/v1123.cjs
v6_weight_ask_off.html tests/checks/v1123.cjs
v6_height_off.html tests/checks/v1123.cjs
v6_past_esc_off.html tests/checks/v1123.cjs
v6_enc_chk_off.html tests/checks/v1123.cjs
v6_prev_ls.html tests/checks/v1123.cjs
v6_alert_dedupe_off.html tests/checks/v1123.cjs
v6_csv_ctx_off.html tests/checks/v1123.cjs
v6_flex_wrap_off.html tests/checks/v1123.cjs
v6_paren_off.html tests/checks/v1123.cjs
v6_small_floor_off.html tests/checks/v1123.cjs
v6_track_off.html tests/checks/v1123.cjs
v7_cross_lead_off.html tests/checks/v1124.cjs
v7_restore_busy_off.html tests/checks/v1124.cjs
v7_msg_alert_off.html tests/checks/v1124.cjs
v7_passive_back.html tests/checks/v1124.cjs
v7_chip_bind_off.html tests/checks/v1124.cjs
v7_hyph_off.html tests/checks/v1124.cjs
v7_bottom_cols.html tests/checks/v1124.cjs
v8_share_icon.html tests/checks/v1125.cjs
v8_ready_catch.html tests/checks/v1125.cjs
v8_cup_toast.html tests/checks/v1125.cjs
v9_fulminant15.html tests/checks/v1126.cjs
v9_aux_label.html tests/checks/v1126.cjs
v10_stool_grid.html tests/checks/v1126.cjs
v10_warn_inline.html tests/checks/v1129.cjs
v10_no_cup.html tests/checks/v1129.cjs
v10_meal_count.html tests/checks/v1129.cjs
v10_swap3.html tests/checks/v1129.cjs
v13_usual3.html tests/checks/v1130.cjs
v13_usual3.html tests/checks/pro2.cjs
v13_no_notice.html tests/checks/v1130.cjs
v13_no_ask.html tests/checks/v1130.cjs
v13_stage1_desc.html tests/checks/v1130.cjs
v13_skip_ignored.html tests/checks/v1130.cjs
v13_mm_no_snack.html tests/checks/v1130.cjs
v13_pick_first.html tests/checks/v1130.cjs
v13_no_snack_x.html tests/checks/v1130.cjs
v13_no_gloss.html tests/checks/v1130.cjs
v13r_cup_hidden.html tests/checks/v1130.cjs
v13r_mult_label.html tests/checks/v1130.cjs
v13r_onb3.html tests/checks/v1130.cjs
v13r_remind_skip.html tests/checks/v1130.cjs
v13r_merge_skip.html tests/checks/v1130.cjs
v13r_na_last.html tests/checks/v1130.cjs
v13r_na_note.html tests/checks/v1130.cjs
v13s_kcal_note.html tests/checks/v1130.cjs
v13s_rem_row.html tests/checks/v1130.cjs
v13s_skips_never.html tests/checks/v1130.cjs
v13s_served_off.html tests/checks/v1130.cjs
v13s_cup_final.html tests/checks/v1130.cjs
rf_bmtotal.html tests/checks/pro2.cjs
rf_tempbad.html tests/checks/v1121.cjs
rf_atefood.html tests/checks/v1130.cjs
rf_swapmenu.html tests/checks/v1130.cjs
rf_trighead.html tests/checks/v1130.cjs
rf_aesiv.html tests/checks/v1130.cjs
r15_snack_ref.html tests/checks/plan_dates.cjs
r15_menufoods.html tests/checks/v1130b.cjs
r20_phrase_off.html tests/checks/phrase.cjs
r20_ragged.html tests/checks/phrase.cjs
r22_alert_back.html tests/checks/v1130e.cjs
r28_ridge_counts.html tests/checks/v1130e.cjs
r22_graph_score.html tests/checks/v1130e.cjs
r22_pdf_unrated.html tests/checks/v1130e.cjs
r22_pdf_nosym.html tests/checks/pdf7.cjs
r22_pdf_nosym.html tests/checks/v1130e.cjs
r27_intro_nodari.html tests/checks/v1130i.cjs
r30_stage_gq_back.html tests/checks/v1130f.cjs
r30_lowres_gq_back.html tests/checks/v1130j.cjs
r28_gq_circle.html tests/checks/v1130j.cjs
r28_day_label.html tests/checks/v1130j.cjs
r29_howto_once_off.html tests/checks/v1130k.cjs
r29_howto_btn_off.html tests/checks/v1130k.cjs
r33_four_off.html tests/checks/v1130l.cjs
r33_aft_view.html tests/checks/v1130l.cjs
r33_swap4_off.html tests/checks/v1130l.cjs
r33_comma_off.html tests/checks/v1130l.cjs
r33_fold_off.html tests/checks/v1130l.cjs
r33_encoff_silent.html tests/checks/v1130l.cjs
r33_peb_three.html tests/checks/v1130l.cjs
r33_peb_retro.html tests/checks/v1130l.cjs
r34_step_off.html tests/checks/v1130m.cjs
r34_bip_btn_off.html tests/checks/v1130m.cjs
r34_installed_off.html tests/checks/v1130m.cjs
r34_standalone_off.html tests/checks/v1130m.cjs
r34_resume_off.html tests/checks/v1130m.cjs
r34_norm_off.html tests/checks/v1130m.cjs
r34_inapp_off.html tests/checks/v1130m.cjs
r34_intent_off.html tests/checks/v1130m.cjs
r34_kakao_ios_off.html tests/checks/v1130m.cjs
r34_ios_note_off.html tests/checks/v1130m.cjs
r35_override_off.html tests/checks/v1130n.cjs
r35_ctx_off.html tests/checks/v1130n.cjs
r35_plansig_off.html tests/checks/v1130n.cjs
r35_tag_off.html tests/checks/v1130n.cjs
r35_appline_off.html tests/checks/v1130n.cjs
r35_reset_off.html tests/checks/v1130n.cjs
r35_ask_off.html tests/checks/v1130n.cjs
r35_filter_off.html tests/checks/v1130n.cjs
r35_norm_off.html tests/checks/v1130n.cjs
r35_merge_off.html tests/checks/v1130n.cjs
r35_list_tag_off.html tests/checks/v1130n.cjs
r36_days4.html tests/checks/v1130o.cjs
r36_skip_off.html tests/checks/v1130o.cjs
r36_rate_off.html tests/checks/v1130o.cjs
r36_start_off.html tests/checks/v1130o.cjs
r36_dock_off.html tests/checks/v1130o.cjs
r36_tap_off.html tests/checks/v1130o.cjs
r36_loop.html tests/checks/v1130o.cjs
r36_img_off.html tests/checks/v1130o.cjs
r36_go_off.html tests/checks/v1130o.cjs
r37_lb_fixed.html tests/checks/v1130p.cjs
r37_rows.html tests/checks/v1130p.cjs
r37_end_off.html tests/checks/v1130p.cjs
r37_lh.html tests/checks/v1130p.cjs"
# 화면 비교는 기준 화면을 만든 환경과 글꼴이 같을 때만 비교하므로(다르면 건너뜀), 글꼴이 다른 환경(CI 등)에서는 화면 비교 돌연변이 쌍을 뺀다
if ! node tests/visual/visual.cjs --fp-check >/dev/null 2>&1; then PAIRS=$(echo "$PAIRS" | grep -v ' tests/visual/visual.cjs$'); echo "화면 비교 기준과 글꼴이 다른 환경이라 화면 비교 돌연변이 쌍은 건너뜁니다"; fi
# 동시에 돌 때 페이지 파일이 섞이지 않게 쌍마다 따로 쓰는 폴더(TEST_TMP)를 준다
expect_fail(){ local app="$1" test="$2"; local tmp="$M/tmp_${app%.html}_$(basename "$test" .cjs)"; mkdir -p "$tmp"
  if TEST_TMP="$tmp" APP_HTML="$M/$app" timeout 600 node "$test" >"$M/$(basename "$test").$app.log" 2>&1; then echo "놓침  $test ← $app"; else echo "잡음  $test ← $app"; fi; }
export -f expect_fail; export M
export FUZZ_QUICK=1   # 누름 퍼징은 홈 화면에서만(돌연변이 확인용으로 빠르게)
echo "$PAIRS" | xargs -P "${JOBS:-4}" -L1 bash -c 'expect_fail "$0" "$1"' | sort -k2 | tee "$M/summary.txt"
if grep -q '^놓침' "$M/summary.txt"; then echo "점검이 놓친 돌연변이가 있습니다"; exit 1; fi
echo "모든 돌연변이($(grep -c . "$M/summary.txt")쌍)를 점검이 잡았습니다"
