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
 'josa.html':      rep('return (m[0].charCodeAt(0)-0xAC00)%28?"은":"는"','return "은"'),  # 조사 틀림
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
 'onb_skip.html':  rep('S.consent={date:today()}; S.onb="0";','S.consent={date:today()}; S.onb="done";'),  # 동의 뒤 첫 실행 설정이 안 나옴
 'ratio_off.html': rep('.map(([id,g])=>[id,r===1?g:Math.round(g*r)])',''),   # '반·더 많이'가 먹은 양에 반영 안 됨
 'suspect_base.html':rep('if(pct>=rest+20) out.push(','if(true) out.push('),   # 평소 나쁜 날 비율과 비교하지 않음
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
 'protein_up.html':rep('t.p>tg.p*1.15?Math.max(0.7,tg.p*1.1/t.p):1','1'),       # 단백질 반찬을 늘리기만 함
 'later_word.html':rep('later:"다음 단계"','later:"보류"'),                        # '다음 단계'가 다시 '보류'
 # v1.11.0 검토 반영분·디자인 뒤 재검토
 'allergy_soft.html':rep('set("ban",`알레르기(${allergyLabel(a)}): 먹지 마십시오`);','set("avoid",`알레르기(${allergyLabel(a)})`);'),  # 알레르기 음식이 다시 '피하기'(R-15)
 'tell_soft.html': rep('const ALERT_TELL="주치의(IBD 진료팀)에 알리십시오.";','const ALERT_TELL="주치의(IBD 진료팀)에 연락하는 것을 고려하십시오.";'),  # 활동기 알림 문장이 다시 약해짐(8번·M4)
 'body_margin.html':rep('body{margin:0;background:var(--bg);','body{background:var(--bg);'),  # 실제 앱에 body 기본 여백이 다시 남음(R-01)
 'enc_plain.html': rep('const backupOut=async()=>encWrap(backupJSON());','const backupOut=async()=>backupJSON();'),  # 암호화를 켜도 백업이 평문(M10)
 # v1.12.0 전체 코드 검토
 'mj_allergy_off.html':rep(r'allergies:c.allergies.filter(a=>!tags.includes(a)),words:[],alWords:(c.alWords||[]).filter(w=>!x.includes(w.replace(/\s/g,""))),trig:[]','allergies:[],words:[],alWords:[],trig:[]'),  # 외식 판정이 목록 음식의 알레르기 표시를 다시 안 봄(C-01)
 'fs_sig_off.html': rep('const sig=JSON.stringify([{...c,trig:c.trig.map(t=>[t.name,t.foodId||""])},','const sig=JSON.stringify([c.stage,c.fiberStage,c.gasHeavy,c.allergies,c.words,c.trig.map(t=>[t.name,t.foodId||""]),'),  # 목록 판정 캐시가 면역 약·직접 적은 알레르기를 다시 모름(C-02)
 'raw_kw_off.html': rep('function rawWords(t){','function rawWords(t){return [];'),  # 목록 밖 외식 메뉴·포장 원재료의 날음식을 다시 못 봄(C-03)
 'reset_keep_off.html':rep('if(!all) keepBeforeReset(); ',''),  # 보관본을 남기고 초기화해도 오늘 보관본이 빈 기록으로 덮임(C-04)
 'own_off.html':   rep('const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k)?o[k]:undefined;','const own=(o,k)=>o[k];'),  # constructor 등으로 검색하면 멈춤(C-05)
 'ridge_score.html':rep('pv==null?(st===3&&(+tl.well||0)<2?"편안한 하루입니다"','pv==null?(v<=2?"편안한 하루입니다"'),  # 홈 띠가 다시 점수만으로 편안한 하루(C-06)
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
 'ridge_stage_only.html':rep('pv==null?(st===3&&(+tl.well||0)<2?"편안한 하루입니다"','pv==null?(st===3?"편안한 하루입니다"'),  # 몸 상태가 최악이어도 편안한 하루(C-06 후속)
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
 'p2_tw_sev.html': rep('if((total>=6&&blood>=3&&sys)||','if((total>=6&&blood>=3)||'),                                      # 열·빈맥 없이도 중증
 'p2_tw_mild.html':rep('if(total<=4&&blood<=1&&!sys) return {g:1','if(total<=5&&blood<=1&&!sys) return {g:1'),             # 경증 범위가 넓어짐
 'p2_csv_old.html':rep('["날짜","배변·혈변 점수(0-6)","배변 횟수 점수(0-3)","혈변 점수(0-3)"','["날짜","SCCAI","배변 횟수 점수(0-3)","혈변 점수(0-3)"'),  # CSV에 SCCAI 열이 돌아옴
 'p2_card_notw.html':rep('<div class="kv"><span>Truelove-Witts 중증도</span><b>${esc(tw.t)}</b></div>',''),              # 기록 결과에서 Truelove-Witts 줄이 빠짐
 # v1.12.0 수정 요청서 v2(2026-10-20): 항목 1~7·10, 진료기록 시안 v7. 새 규칙마다 하나씩
 'v2_toast_pushed.html':rep('body.pushed .toasts:not(.top),body.welcome .toasts:not(.top){','body.pushed .toasts,body.welcome .toasts{'),  # 항목 3: 끼니 상세에서 위쪽 알림이 화면 높이로 늘어남
 'v2_toast_left.html':rep('.toast .t-msg{flex:1;min-width:0;text-align:center;padding:8px 4px}','.toast .t-msg{flex:1;min-width:0;text-align:left;padding:8px 4px}'),  # 항목 4: 알림 글자가 왼쪽
 'v2_toast_asym.html':rep('.toast::before{content:"";flex:none;width:44px}','.toast::before{content:"";flex:none;width:0}'),  # 항목 4: × 자리만큼의 빈칸이 없어 글자가 치우침
 'v2_note_left.html':rep('.plan-note{display:block;text-align:center;margin:0 6px 14px}','.plan-note{display:block;text-align:left;margin:0 6px 14px}'),  # 항목 2: 홈 맨 아래 첫 안내 글이 왼쪽
 'v2_days_below.html':end("""{const __v=viewPlan; viewPlan=function(){const h=__v.apply(this,arguments); const a=h.indexOf('<div class="hero hero-days">'), b=h.indexOf('<div class="sec-title" id="meals">'), c=h.indexOf('<div class="list meals">'); return (a<0||b<a||c<b)?h:h.slice(0,a)+h.slice(b,c)+h.slice(a,b)+h.slice(c)}}"""),  # 항목 1: 날짜 띠가 다시 끼니 제목 아래
 'v2_ph_two.html':rep('placeholder="예시: 연어 포케, 크림 파스타"','placeholder="예: 연어 포케&#10;크림 파스타"'),  # 항목 7: 입력 안내 글자가 두 줄
 'v2_err_old.html':rep('메뉴 이름을 적어 주십시오. 여러 개는 쉼표로 구분합니다.','메뉴 이름을 한 줄에 하나씩 적어 주십시오.'),  # 항목 7: 빈 입력 오류가 쉼표를 설명하지 않음
 'v2_nb_off.html':rep('<span class="nb">지금: ','<span>지금: '),  # 항목 10: '지금: 값'이 줄 끝에서 갈라짐
 'v2_nb_nowrap.html':rep('.nb{display:inline-block;max-width:100%;vertical-align:baseline}','.nb{white-space:nowrap}'),  # 항목 10·5: 묶음이 큰 글자·좁은 화면에서 가로로 넘침
 'v2_bind_off.html':rep('function groupRefs(root){ groupRefs0(root); bindDots(root) }','function groupRefs(root){ groupRefs0(root) }'),  # 항목 5: 가운뎃점·쌍점 묶음 후처리 빠짐
 'v2_pretty_off.html':rep('p,li,dd,small,.hint,.muted,.banner{text-wrap:pretty}',''),  # 항목 5: 문단 끝 한 단어 방지 빠짐
 'v2_why_off.html':rep('function mjLines(it,rc,f,base){','function mjLines(it,rc,f,base){return {lines:[],refs:[]};'),  # 항목 6: 외식 판정 이유 줄이 없음
 'v2_why_invent.html':rep('const WHY_REDMEAT="붉은 고기는 줄이도록 권고(IOIBD·ECCO)"','const WHY_REDMEAT="붉은 고기는 대장암 위험을 높입니다"'),  # 항목 6: 앱에 없는 새 의학 문장
 'v2_pdf_sccai.html':rep('<th>하루 배변 횟수(평균·최대)</th>','<th>평균·최고 SCCAI</th>'),  # 시안 v7: 진료 문서에 SCCAI가 다시 나옴
 'v2_pdf_cover.html':rep('#printDoc .cover{border:1px solid #111;','#printDoc .cover{border:1px solid #D7DEE9;'),  # 시안 v7: 표지 테두리가 옛 연한 색
 'v2_pdf_qs_early.html':rep('if(qs.length) blocks.push(`<h2>이번 진료 때 묻고 싶은 것</h2>','if(qs.length) blocks.splice(3,0,`<h2>이번 진료 때 묻고 싶은 것</h2>'),  # 시안 v7: 묻고 싶은 것이 맨 끝이 아님
 'v2_pdf_nodot.html':rep('if(p.blood){g.fillStyle=C.red;','if(false){g.fillStyle=C.red;'),  # 시안 v7: 혈변 빨간 점이 그려지지 않음
 'v2_pdf_footer_ko.html':rep('pdf.text(`${i}/${tot}`,PW-M,PH-14,{align:"right"});','pdf.text(`${i}쪽`,PW-M,PH-14,{align:"right"});'),  # 그림 PDF 바닥글에 한글을 글자로 씀(깨짐)
 'v2_pdf_weight0.html':rep('const wdTxt=wts.length>=2?','const wdTxt=wts.length>=1?'),  # 체중이 한 번뿐인데 변화 '0kg'
 'v2_pdf_disc_off.html':rep('음식 평가는 환자의 주관적 판단입니다. UC TABLE은 의료기기가 아니며','음식 평가는 환자의 주관적 판단입니다. UC TABLE은'),  # 진료 문서의 '의료기기 아님' 안내가 빠짐
 'v3_pdf_notice_back.html':rep('{// 진료기록 시안 v7: 건강 관리 점검은 예방접종 한 줄','blocks.push(`<h2>진료 때 알릴 사항 (대한장연구학회 환자 안내 기준)</h2><table><tbody><tr><th>직접 확인해 알릴 것</th><td>□ 우울감이나 죽고 싶다는 생각</td></tr></tbody></table>`);{// 진료기록 시안 v7: 건강 관리 점검은 예방접종 한 줄'),  # 사용자 요청: '진료 때 알릴 사항' 블록이 다시 나옴
 'v3_pdf_note_old.html':rep('는 성인 궤양성 대장염의 임상적 관해를 직장 출혈 0점·배변 횟수 0점으로 정의하고','가 증상 평가에 사용합니다. 그리고'),  # 원문 확인 전의 과장 문구('"'"'ACG·STRIDE-II가 PRO2를 증상 평가에 사용'"'"')가 돌아옴
}
for n,t in mut.items():
    assert t!=s, n
    open(os.path.join(M,n),'w',encoding='utf-8').write(t)
print('mutants',len(mut))
PY
[ $? -eq 0 ] || { echo "돌연변이 앱을 만들지 못했습니다(대상 문자열 확인)"; exit 1; }
# 돌연변이 앱 ← 그것을 잡아야 하는 점검
PAIRS="food_rule.html tests/checks/foods.cjs
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
suspect_base.html tests/regression/t29.cjs
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
tell_soft.html tests/checks/v1110.cjs
body_margin.html tests/checks/review2.cjs
enc_plain.html tests/checks/v1110.cjs
mj_allergy_off.html tests/checks/v1120.cjs
fs_sig_off.html tests/checks/v1120.cjs
raw_kw_off.html tests/checks/v1120.cjs
reset_keep_off.html tests/checks/v1120.cjs
own_off.html tests/checks/v1120.cjs
ridge_score.html tests/checks/v1120.cjs
ridge_stage_only.html tests/checks/v1120b.cjs
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
p2_tw_sev.html tests/checks/pro2.cjs
p2_tw_mild.html tests/checks/pro2.cjs
p2_csv_old.html tests/checks/pro2.cjs
p2_card_notw.html tests/checks/pro2.cjs
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
v2_pdf_sccai.html tests/checks/pdf7.cjs
v2_pdf_cover.html tests/checks/pdf7.cjs
v2_pdf_qs_early.html tests/checks/pdf7.cjs
v2_pdf_nodot.html tests/checks/pdf7.cjs
v2_pdf_footer_ko.html tests/checks/pdf7.cjs
v2_pdf_weight0.html tests/checks/pdf7.cjs
v2_pdf_disc_off.html tests/checks/pdf7.cjs
v3_pdf_notice_back.html tests/checks/pdf7.cjs
v3_pdf_note_old.html tests/checks/pdf7.cjs"
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
