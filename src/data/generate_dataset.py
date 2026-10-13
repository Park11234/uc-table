import os
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP=os.path.join(ROOT,'src','app','index.html')
GEN=os.path.join(ROOT,'src','data','generated','gen_out.json')
MFDS=os.path.join(ROOT,'data','mfds')
import json, sys, re
import pandas as pd
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from spec1 import G; from spec2 import P; from spec3 import DY,V; from spec4 import FR,FAT,ETC; from spec5 import DS; from spec6 import EX; from spec7 import TR; from spec8 import TR8, LABEL, T8
import snack_check
import ramen_check
from templates import T
T=dict(T); T.update(T8)
import hashlib
# ---- 템플릿 보정 ----
T['fish_white']=("흰살생선은 급성기에도 권장되는 지방이 적은 단백질 반찬입니다. 껍질을 벗기고 굽거나 찝니다.",[39,37])
T['fish_mid']=("흰살생선이지만 지방이 100g당 7g 정도로 많은 편이라, 활동기에는 동태·가자미 같은 담백한 생선이 더 낫습니다.",[27,39])
T['jjajang']=("춘장 소스가 짜고, 볶을 때 기름을 씁니다. 싱겁게 조금만 드십시오.",[39])
T['sour']=("시거나 맵고 짠 음식은 증상 악화를 잘 일으키는 음식으로 안내됩니다. 아주 조금만 씁니다.",[39])
T['grapefruit_drug']=("자몽은 일부 약과 상호작용할 수 있어 복용 중인 약이 있으면 약사에게 확인합니다.",[])
T.pop('chamomile',None)
# 단계 문구가 음식의 시작 단계와 어긋나지 않게 단계 표현을 뺀 문장
T['buckwheat']=("메밀은 알레르기 표시 대상입니다. 메밀면은 저잔사식 허용 목록에 없습니다.",[28,39])
T['jeon']=("부침은 기름을 흡수해 지방이 많아집니다. 기름진 음식은 증상 악화 음식으로 안내돼 소량만 드십시오.",[39])
T['veg_unlisted']=("저잔사식 허용 목록에 없는 채소라 증상이 나아진 뒤 푹 익혀 잘게 썰어 조금씩 드십시오.",[39,2])
T['poultry_lean']=("껍질·기름을 뗀 가금류 살코기는 기름이 적어 저잔사식에서 허용되는 단백질입니다.",[39])
T['soymilk']=("두유는 저잔사식 허용 식품입니다. 통콩으로 만든 두유는 가스 유발 성분(FODMAP)이 많아 불편하면 줄입니다.",[39,20])
T['squash']=("호박류는 푹 익히면 부드러워 악화기에도 권장되는 채소입니다. 껍질·씨를 빼고 한 끼 35g 정도만 드십시오.",[33,39])
T['allium']=("양파·리크 같은 파속 채소는 가스 유발 성분(FODMAP)이 많은 편이라, 파·부추·달래도 가스가 늘면 양을 줄입니다.",[20])
T['bread_fat']=("버터가 많은 빵·과자는 기름진 음식이라 소량만 드십시오. 길병원은 과도한 지방(튀김·빵·라면)을 피할 음식으로 안내합니다.",[39,3])
T['dairy_ok']=("유제품은 저잔사식 허용 식품이고, 질병을 악화시킨다는 근거가 없어 우유를 끊는 식단은 권장되지 않습니다. 불편하면 락토프리 제품을 씁니다.",[39,37,50])
T['veg_raw']=("생채소는 활동기에 피하고, 증상이 나아진 뒤 잘게 썰어 조금씩 늘립니다.",[37,13])
T['nuts']=("견과·씨앗은 저잔사식에서 제한되고, 관해기에도 증상을 일으키기 쉬운 음식으로 안내됩니다. 처음엔 곱게 갈아 소량만 드십시오.",[39,37,43])
T['cheese_processed']=("가공치즈는 유화제 같은 첨가물이 들어간 가공식품이라 자연치즈를 먼저 고릅니다.",[3,2])
T['cracker']=("크래커는 섬유가 적은 정제 밀가루 과자지만, 짜고 기름진 초가공식품이라 소량만 드십시오.",[2])
# 감미료·제로·유행 음식(v1.3.0)
T['stevia_tomato']=("식약처는 스테비아 토마토가 신품종이 아니라, 세척한 방울토마토에 효소처리스테비아나 수크랄로스가 든 액을 넣어 만든 과·채가공품이라고 밝혔습니다. 표시된 보관방법과 소비기한을 지킵니다.",[48])
T['stevia_fruit']=("감미료로 단맛을 낸 가공 과일입니다. 스테비아가 대장염에 미치는 영향은 연구가 부족하지만, 인공감미료가 든 식품은 제한하도록 권고되고 인공 감미료는 증상을 일으키기 쉬운 음식으로 안내됩니다. 라벨에서 감미료를 확인하고 되도록 생과일을 고릅니다.",[3,37])
T['zero_drink']=("설탕 대신 감미료로 단맛을 낸 탄산음료입니다. 탄산음료는 증상을 일으키기 쉬워 피하도록 안내되고, 인공감미료가 든 식품도 제한하도록 권고됩니다.",[39,37,3])
T['sparkling']=("당이 없어도 탄산음료는 증상을 일으키기 쉬운 음식으로 안내되고, 활동기에는 탄산을 피하도록 합니다. 수분은 물이나 보리차로 채웁니다.",[37,39])
T['energy']=("카페인과 당이 많은 탄산음료입니다. 탄산·카페인 음료는 증상을 일으키기 쉬워 피하도록 안내됩니다.",[39,37,43])
T['polyol']=("자일리톨·솔비톨·말티톨 같은 당알코올은 소장에서 천천히 흡수돼 장으로 물을 끌어들이고, 복부팽만·설사를 일으킬 수 있습니다. 과민성장증후군 환자는 솔비톨·만니톨 10g에도 증상이 늘었습니다.",[47])
T['sugarfree_choco']=("무설탕 초콜릿은 설탕 대신 감미료나 당알코올로 단맛을 냅니다. 당알코올은 많이 먹으면 복부팽만·설사를 일으킬 수 있어 원재료명을 확인합니다.",[47])
T['stevia_mix']=("설탕 대신 스테비아로 단맛을 낸 커피믹스입니다. 스테비아가 대장염에 미치는 영향은 연구가 부족하고, 인공감미료가 든 식품은 제한하도록 권고됩니다.",[3])
T['konjac_jelly']=("곤약 가루로 만든 가공 젤리 음료입니다. 초가공식품은 줄이도록 권고되고, 제로·저칼로리 제품은 설탕 대신 감미료를 넣으니 원재료명을 확인합니다.",[2,3])
T['kombucha_powder']=("물에 타 마시는 분말 콤부차는 제품에 따라 에리스리톨·수크랄로스·아세설팜칼륨 같은 감미료, 프락토올리고당, 홍차 추출분말이 들어 있습니다(예: 티젠 콤부차 매실 원재료명). 인공감미료가 든 식품은 제한하도록 권고되고, 프락토올리고당 같은 프럭탄은 관해기 IBD 환자의 복통·팽만·가스를 늘렸습니다.",[49,3,9])
T['kombucha']=("콤부차는 차를 발효한 신 음료이고, 이 제품은 탄산이 들어 있습니다. 탄산음료와 신 음식은 증상을 일으키기 쉬운 음식으로 안내됩니다.",[37,39])
T['protein_drink']=("단백질 음료는 초가공식품이라 식사로 단백질을 먼저 채우고 부족할 때 보조로 씁니다. 제품마다 유당·감미료가 달라 원재료명을 확인합니다.",[2,1])
T['protein_bar']=("프로틴바는 초가공식품입니다. 당이나 감미료로 단맛을 내니 원재료명에서 당알코올(말티톨 등)을 확인합니다. 당알코올은 설사를 늘릴 수 있습니다.",[2,47])
T['chicken_proc']=("닭가슴살로 만든 소시지·스테이크도 식약처 분류상 식육가공품입니다. 양념하지 않은 닭가슴살을 직접 익혀 드십시오.",[3])
T['plant_milk']=("유당이 없는 식물성 음료입니다. 우유보다 단백질이 적은 편이라 단백질은 식사로 채우고, 칼슘 강화 제품을 고릅니다.",[1])
T['padthai']=("쌀국수를 기름에 볶고 땅콩·숙주를 올리는 음식입니다. 땅콩·숙주는 저잔사식에서 제한되고, 기름진 음식은 증상 악화 음식으로 안내돼 관해기에 소량 드십시오.",[39])
T['rose_sauce']=("로제 소스는 매운 양념에 크림이나 우유를 섞어 만들어 유제품이 들어갑니다.",[])
T['cream_sauce']=("크림소스는 생크림·버터·치즈로 만들어 기름지고 유당이 있습니다. 기름진 음식은 증상 악화 음식으로 안내돼 소량만 드십시오.",[39])
L=[list(x) for x in G+P+DY+V+FR+FAT+ETC+DS+EX+TR+TR8]
IDX={x[0]:x for x in L}
# ---- 음식별 보정(근거 검토 결과) ----
def add(i,*tags):
    for t in tags:
        if t not in IDX[i][5]: IDX[i][5].append(t)
def rm(i,*tags): IDX[i][5]=[t for t in IDX[i][5] if t not in tags]
def ms(i,v): IDX[i][4]=v
def tpl(i,*k): IDX[i][9]=list(k)
def src(i,s): IDX[i][3]=s
def prep(i,s): IDX[i][12]=s
def alias(i,a): IDX[i][7]=a
def name(i,n): IDX[i][1]=n
add('gimbap','pickled','upf2'); add('curry_rice','soy','dairy'); add('rabokki','fish'); prep('tteokbokki','어묵은 빼기')
for i in ['red_bean_porridge','kongguksu','red_bean_bread','patbingsu','black_soybean','kidney_bean','green_pea','red_bean','soybean_braised','bean_rice','ogokbap','mungbean_jeon','yanggaeng']: add(i,'legume')
ms('mixed_grain_rice',3); ms('barley_misugaru',2); add('jjamppong','shell')
for i,s in [('castella','D:카스텔라'),('dinner_roll','D:모닝빵'),('bagel','D:베이글'),('croissant','D:크로와상'),('muffin','D:머핀'),('donut','D:도넛_링도넛'),('yakgwa','D:약과'),('popcorn','D:팝콘')]: src(i,s)
src('zucchini_jeon','D:애호박전'); name('dried_banana','말린 바나나'); alias('dried_banana',['말린바나나','건바나나'])
ms('carrot_raw',3)
ms('corn_syrup',1)   # 근거 재검토: 설탕(1단계 주의)과 같은 기준
add('hairtail','fatty'); tpl('hairtail','fish_mid')
for i in ['beef_brisket','rolled_omelet','pan_tofu','bulgogi']: add(i,'fatty')
for i in ['nakji','octopus']: add(i,'squid')
for i in ['almond','peanut','pine_nut','pistachio','sunflower_seed','pumpkin_seed','sesame_seed','flaxseed','chia','ginkgo','popcorn']: add(i,'tough')
prep('ginkgo','한 번에 몇 알만')
rm('chamomile','fodmap'); tpl('chamomile','tea_mild')
for i in ['milk_chocolate','dark_chocolate']: ms(i,9); add(i,'choco')
for i in ['crackers','potato_chips','butter_cookie','popcorn','milk_chocolate','dark_chocolate','sugarfree_choco','dubai_choco']: add(i,'snack')   # '과자'·'스낵' 검색용 묶음(판정에는 쓰지 않음)
for i in ['gummy','sugarfree_candy']: add(i,'candy')   # '사탕'·'캔디'·'젤리' 검색용 묶음(v1.6.1)
alias('crackers',[a for a in IDX['crackers'][7] if a!='참크래커'])   # 참크래커는 제품 항목으로(v1.6.1)
add('margarine','marg')
ms('orange_juice',1); rm('orange_juice','sour'); add('orange_juice','citrus','juice'); add('apple_juice','juice')
for i in ['lemon','grapefruit','yuzu_tea']: rm(i,'sour'); add(i,'citrus')
tpl('grapefruit','citrus','grapefruit_drug'); prep('grapefruit','복용 약이 있으면 약사에게 확인')
tpl('vinegar','sour')
add('zucchini_stirfry','shrimp')
for i in ['kimchi_fried_rice','kimchi_jjigae','kimchi_jeon','tofu_kimchi','chonggak','yeolmu_kimchi','gat_kimchi','pa_kimchi','oi_sobagi','baek_kimchi']: add(i,'shrimp')
for i in ['bulgogi','galbijjim','pork_galbijjim','jangjorim_beef','jangjorim_quail','gamja_jorim','braised_tofu','japchae','jjimdak','lotus_jorim','burdock_jorim','soybean_braised','yubu_chobap','ssamjang']: add(i,'wheat')
add('hamburger','tomato')
prep('miyeok_guk','미역은 잘게 썰어 푹 끓이기'); prep('beansprout_soup','')
# 지방 태그는 식약처 지방 값과 맞춤(100g당 10g 이상은 fatty, 5g 미만은 fatty 빼기)
for i in ['castella','veg_sandwich','scrambled_egg','sliced_cheese']: add(i,'fatty')
for i in ['curry_rice','jjajang_rice','jjajangmyeon','chunjang','pine_porridge','galbitang','japchae','kimchi_jeon','mungbean_jeon']: rm(i,'fatty')
tpl('galbitang','soup_bone'); add('smoked_salmon','oily')
# 채소 반찬은 채소와 같은 한 끼 양(35g) 규칙
for i in ['spinach_namul','beansprout_muchim','mung_namul','radish_saengchae','cucumber_muchim','gosari_namul','eggplant_namul','zucchini_stirfry','mushroom_stirfry','miyeok_stem','lotus_jorim','burdock_jorim']: add(i,'veg')
# 양파·마늘·파 양념(가스가 심할 때 주의)
ALLIUM=['veg_fried_rice','kimchi_fried_rice','bibimbap','omurice','curry_rice','jjajang_rice','jjajangmyeon','jjamppong','spaghetti_tomato','tteokbokki','rabokki',
 'steamed_mandu','fried_mandu','mandu_guk','tteok_mandu_guk','tteokguk','janchi_guksu','kalguksu','udon','kkakdugi','baek_kimchi','dongchimi','nabak_kimchi',
 'yeolmu_kimchi','chonggak','gat_kimchi','pa_kimchi','oi_sobagi','green_onion','scallion','chive','dallae','braised_tofu','rolled_omelet']
ALLIUM+= [x[0] for x in L if x[2]=='요리' and x[0] not in ('egg_soup','bone_broth','sundae','hotdog','grilled_saury','grilled_sp_mackerel')]
for i in ALLIUM:
    add(i,'allium')
# 별명 정리
alias('cherry_tomato',[a for a in IDX['cherry_tomato'][7] if a!='토마토'])
alias('carrot_raw',[a for a in IDX['carrot_raw'][7] if a!='당근'])
alias('smoked_salmon',[a for a in IDX['smoked_salmon'][7] if a!='연어'])
# 다른 음식을 가리키는 별명 빼기(과메기=날것, 쥐포=쥐치, 천엽=양, 밀크티=우유 등)
for i,bad in [('ogokbap','찰밥'),('rice_cereal','콘플레이크'),('bibim_guksu','골뱅이국수'),('saury','과메기'),('paprika','피망'),('beef_liver','천엽'),('black_tea','밀크티'),('solomon_tea','옥수수차'),('solomon_tea','곡물차'),('fish_jeon','전'),('squid_strips','쥐포')]:
    assert bad in IDX[i][7], (i,bad)
    alias(i,[a for a in IDX[i][7] if a!=bad])
add('pudding','lactose')
# 점검 결과 보정: 알레르기 태그 누락·다른 음식을 가리키는 별명
add('gimbap','fish'); add('oyster_sauce','wheat'); add('gochujang','soy'); add('soybean_oil','soy')
add('raisin','sulfite'); add('dried_persimmon','sulfite')
for i,bad in [('donkatsu','치즈돈가스'),('yukgaejang','닭개장'),('squid_stirfry','오삼불고기'),('grape','샤인머스캣')]:
    assert bad in IDX[i][7], (i,bad)
    alias(i,[a for a in IDX[i][7] if a!=bad])
alias('vinegar',IDX['vinegar'][7]+['애사비','애플사이다비니거']); tpl('black_soy_milk','soymilk'); tpl('old_pumpkin','squash'); tpl('crackers','cracker'); tpl('beef_brisket','meat_fat')
ms('duck_lean',1); alias('duck_lean',[a for a in IDX['duck_lean'][7] if a!='훈제오리'])
ms('cream_cheese',1); ms('kongguksu',3); tpl('dotori_muk','spicy'); tpl('apricot','fruit_unlisted')
# 근거 재검토(v1.3.1): 어묵·게맛살 같은 수산 가공품은 '가공육'(IOIBD·대한장연구학회) 근거가 아니라
# 길병원 저잔사식의 '가공품류 제한'과 초가공식품 '줄이기'(AGA·ECCO)에 해당 → 1·2단계 보류, 관해기 주의
for i in ['fish_cake','imitation_crab','fishcake_soup','fishcake_stirfry']:
    rm(i,'processed'); add(i,'upf2','gil','salty'); ms(i,3); tpl(i,'processed_fish')
tpl('rabokki','spicy','rabokki')
T['processed_fish']=("어묵·게맛살 같은 수산 가공품은 길병원 저잔사식에서 제한되고, 짜고 첨가물이 든 초가공식품이라 관해기에도 줄이도록 권고됩니다.",[39,2,50])
T['rabokki']=("라면 사리와 어묵이 들어갑니다. 길병원은 라면처럼 기름진 인스턴트 음식을 피하도록 안내하고, 어묵 같은 가공품류는 저잔사식에서 제한됩니다.",[39])
# ---- v1.5.0 데이터 정확성 보정 ----
# 유당: 우유·크림·생치즈·요거트·아이스크림·커스터드·밀크초콜릿이 주재료인 음식은 lactose(유당불내증이면 피하기).
# 버터·경성 치즈·모짜렐라처럼 유당이 적은 것과 빵·과자에 조금 들어간 우유·버터는 lactose를 붙이지 않는다(Monash[20,52]).
for i in ['fruit_smoothie','milk_chocolate','dubai_choco','tiramisu','cheesecake','egg_tart','cream_bread','rose_tteokbokki',
          'carbonara','cream_pasta','rose_pasta','scone','waffle','stevia_coffeemix','protein_drink','sliced_cheese']: add(i,'lactose')
# 스테비아 과일: 감미료 주입 제품 여러 개의 식약처 값이 똑같이 올라 있어 생과일 값을 쓴다
src('stevia_grape','R:포도_청포도(샤인머스켓)_껍질 포함_생것'); src('stevia_cherry','R:체리_생것')
# 과일 시작 단계(앱 규칙, docs/evidence.md): 길병원 저잔사식 허용 과일·주스는 1단계, 그 밖의 생과일·주스는 2단계
# (신 과일은 '주의'로 따로 표시), 말린 과일·식이섬유 100g당 4g 이상·여러 재료를 섞은 과일 음식은 3단계
for i in ['cherry','fig','dragon_fruit','stevia_cherry','lemon','grapefruit','orange_juice']: ms(i,2)
for x in L: x[5]=[t for t in x[5] if t!='fodmap']   # FODMAP 태그는 FODI에서만 정함
# ---- FODMAP: Monash 식품표(REF 20) 등 확인된 것만 ----
SEA=('low','양념하지 않은 해산물',[20]); MEAT=('low','양념하지 않은 고기',[20]); POUL=('low','양념하지 않은 가금류',[20])
FOD={}
for i in ['glutinous_rice','black_rice','rice_gruel','jeolpyeon']: FOD[i]=('low','쌀 제품군 기준',[20])
FOD['rice_noodle_soup']=('low','쌀국수 면 기준',[20])
for i in ['dinner_roll','baguette','bagel','croissant','veg_sandwich','hamburger','pizza']: FOD[i]=('high','밀 빵',[20])
FOD['castella']=('high','밀가루',[20]); FOD['muffin']=('high','밀가루',[20]); FOD['rye_bread']=('high','호밀·밀 빵',[20]); FOD['red_bean_bread']=('high','밀 빵·팥',[20])
for i in ['crackers','butter_cookie']: FOD[i]=('high','밀 과자류',[20])
for i in ['janchi_guksu','kalguksu','udon','bibim_guksu','jjajangmyeon','jjamppong','spaghetti_tomato']: FOD[i]=('high','밀 면',[24])
FOD['barley_rice']=('unk','보리 빵은 고FODMAP(보리밥 수치는 미확인)',[20]); FOD['barley_misugaru']=('unk','보리 빵은 고FODMAP(미숫가루 수치는 미확인)',[20])
for i in ['lowfat_milk','calcium_milk','strawberry_milk','choco_milk','banana_milk','coffee_milk','cafe_latte']: FOD[i]=('high','우유(유당)',[20])
for i in ['yogurt_plain_unsw','drink_yogurt','strawberry_yogurt']: FOD[i]=('high','요거트(유당)',[20])
FOD['ice_cream']=('high','아이스크림(유당)',[20]); FOD['pudding']=('high','우유 푸딩·커스터드류',[20]); FOD['patbingsu']=('high','연유·팥',[20])
FOD['cheddar']=('low','경성 치즈',[20]); FOD['goat_milk']=('high','우유처럼 유당이 있음',[20])
FOD['black_soy_milk']=('high','통콩으로 만든 두유',[20])
for i in ['black_soybean','kidney_bean','red_bean','soybean_braised','mungbean_jeon','yanggaeng','red_bean_porridge']: FOD[i]=('high','콩류',[20])
FOD['green_pea']=('high','완두콩',[20]); FOD['kongguksu']=('high','콩물·밀 면',[20,24])
for i in ['bean_rice','ogokbap']: FOD[i]=('unk','섞은 콩류는 대부분 고FODMAP',[20])
FOD['bok_choy']=('low','청경채 1컵(75g) 기준 낮음(2차 자료)',[20,58]); FOD['romaine']=('low','상추류',[20]); FOD['red_lettuce']=('low','상추류',[20]); FOD['green_pepper']=('low','초록 피망',[20])
FOD['paprika']=('high','빨강 파프리카',[20]); FOD['carrot_raw']=('low','당근',[20]); FOD['asparagus']=('high','아스파라거스',[20]); FOD['cauliflower']=('high','콜리플라워는 75g에서도 만니톨이 높음(2차 자료)',[20,58])
FOD['potato_jeon']=('low','감자',[20])
for i in ['potato_stirfry','gamja_jorim','potato_soup']: FOD[i]=('unk','감자는 낮지만 양파·마늘을 넣으면 높아질 수 있음',[20])
for i in ['green_onion','scallion','chive','dallae']: FOD[i]=('unk','파속 채소(양파·리크는 고FODMAP)',[20])
for i,n in [('apple','사과'),('pear','배'),('watermelon','수박'),('apple_juice','사과주스'),('nectarine','천도복숭아'),('plum','자두'),('mango','망고'),('cherry','체리'),('canned_peach','복숭아')]: FOD[i]=('high',n,[20])
FOD['canned_peach']=('high','국물 뺀 통조림 복숭아 1/2컵(80g)에서 프럭탄·솔비톨이 높음(2차 자료)',[20,58])
for i in ['raisin','jujube','dried_persimmon','dried_banana']: FOD[i]=('high','말린 과일',[20])
FOD['peanut']=('low','땅콩',[20]); FOD['pistachio']=('high','피스타치오',[20]); FOD['pumpkin_seed']=('low','호박씨',[20])
for i in ['canola_oil','grapeseed_oil','soybean_oil','rice_bran_oil']: FOD[i]=('low','기름은 탄수화물이 없음',[23])
FOD['sugar']=('low','설탕',[20]); FOD['dark_chocolate']=('low','다크초콜릿',[20]); FOD['salt']=('low','탄수화물이 없음',[])
FOD['oligosaccharide']=('unk','프락토올리고당 제품이면 높음',[])
for i in ['pollack','flatfish','halibut','croaker','hairtail','rockfish','spanish_mackerel','saury','tuna_sashimi','canned_tuna','smoked_salmon','eel','squid','nakji','octopus','oyster','clam','mussel','abalone','scallop','blue_crab','snow_crab']: FOD[i]=SEA
for i in ['beef_tenderloin','beef_sirloin','beef_brisket','beef_shank','beef_ribs','chadol','pork_tenderloin','pork_shoulder','pork_neck','pork_belly','beef_liver']: FOD[i]=MEAT
for i in ['chicken_thigh','chicken_wing','duck_lean','duck_skin']: FOD[i]=POUL
FOD['quail_egg']=('low','달걀류',[20]); FOD['rolled_omelet']=('low','달걀 기준(파를 넣으면 달라짐)',[20]); FOD['scrambled_egg']=('unk','달걀은 낮지만 우유를 넣으면 유당이 더해짐',[20])
FOD['pan_tofu']=('low','단단한 두부',[21])
for i in ['bulgogi','galbijjim','pork_galbijjim','jeyuk','dakgalbi','dakbokkeumtang','jjimdak','tteokgalbi','hamburg_steak','jangjorim_beef','squid_stirfry']: FOD[i]=('unk','양념에 양파·마늘이 들어가면 높을 수 있음',[20])
# v1.3.0 추가 음식(Monash 식품표·감미료 안내로 확인되는 것만)
for i in ['salt_bread','croffle','scone','waffle','cream_bread']: FOD[i]=('high','밀 빵',[20])
FOD['bungeoppang']=('high','밀 빵·팥',[20])
for i in ['cream_pasta','rose_pasta','carbonara','tantanmen','ramen_jp']: FOD[i]=('high','밀 면',[24])
FOD['yogurt_icecream']=('high','요거트·아이스크림(유당)',[20]); FOD['gelato']=('high','아이스크림(유당)',[20])
for i in ['matcha_latte','bubble_tea']: FOD[i]=('high','우유(유당)',[20])
FOD['stevia_cherry']=('high','체리',[20]); FOD['dubai_choco']=('high','피스타치오',[20])
# Monash FODMAP 블로그·안내문에서 확인한 것(v1.5.0, REF 52)
M52=[52]
FOD.update({
 'green_onion':('amount','초록 잎 부분만 낮음(흰 줄기는 리크처럼 높을 수 있음)',M52),'scallion':('amount','초록 잎 부분만 낮음',M52),
 'chive':('low','아시아 부추는 낮음',M52),'kale':('low','1컵 기준 낮음',M52),'beet':('amount','신선한 비트는 적은 양만 낮고, 절인 비트는 낮음',M52),
 'brussels':('amount','75g이면 프럭탄이 높음',M52),'ginger':('low','',M52),'mung_sprout':('low','숙주(bean shoots)는 낮음',M52),
 'green_chili':('low','고추는 FODMAP이 낮지만 매운 성분(캡사이신)에 민감할 수 있음',M52),'cheongyang':('low','고추는 FODMAP이 낮지만 매운 성분(캡사이신)에 민감할 수 있음',M52),
 'yam':('low','',M52),'barley_rice':('high','보리는 프럭탄이 많은 곡물',M52),'barley_misugaru':('high','보리는 프럭탄이 많은 곡물',M52),
 'raspberry':('low','',M52),'pomegranate':('amount','석류 씨는 적은 양만 낮음',M52),
 'almond':('amount','10알(12g)까지 낮고 한 줌이면 높음',M52),'sunflower_seed':('amount','2작은술(6g) 기준 낮음',M52),
 'chia':('amount','2큰술(24g)까지 낮음',M52),'sesame_seed':('low','참깨·타히니(30g)는 낮음',M52),'flaxseed':('low','',M52),'chestnut':('low','',M52),
 'green_tea':('low','',M52),'oat_drink':('amount','104ml까지 낮고 250ml면 높음',M52),'almond_drink':('low','',M52),
 'mozzarella':('low','보통 양은 유당이 적음',M52),'cream_cheese':('amount','80g이면 유당이 중간',M52),'mayonnaise':('low','',M52),
 'margarine':('low','기름·지방은 탄수화물이 거의 없어 낮음',M52),'soy_sauce':('low','',M52),'oyster_sauce':('low','',M52),
 'ketchup':('low','',M52),'mustard':('low','',M52),
 'vinegar':('low','',M52),'fish_sauce':('low','피시소스는 낮음',M52),'milk_chocolate':('amount','30g(5조각)이면 유당이 중간',M52),
 'popcorn':('low','',M52),
 'wasabi':('unk','튜브형 와사비(페이스트)는 솔비톨이 많아 높고, 와사비 가루는 낮음',M52),
})
# 영양식: 프락토올리고당·치커리 식이섬유(이눌린 계열)는 적은 양도 FODMAP을 크게 늘림(Monash 성분표 읽기[51])
for i in ['newcare_balanceup','newcare_coffee']: FOD[i]=('high','프락토올리고당 첨가',[51])
for i in ['newcare_hiprotein','newcare_cancer']: FOD[i]=('high','치커리 식이섬유(이눌린 계열) 첨가',[51])
FOD['mediwell_gosu']=('unk','프락토올리고당 0.01%(아주 소량) 첨가',[51])
for i in ['carewell_gosu','mediwell_renal']: FOD[i]=('high','프락토올리고당 첨가',[51])
for i in ['newcare_active','newcare_fiber']: FOD[i]=('high','치커리 식이섬유(이눌린 계열) 첨가',[51])
for i in ['newcare_dangplan_pro','newcare_dangplan_pro_injeolmi']: FOD[i]=('high','돼지감자 추출분말(이눌린 원료) 첨가',[51])
# 1팩 식이섬유 5g 이상인 영양식은 '식이섬유를 늘린 제품'(저잔사식 단계 보류)
for x in L:
    if x[3].startswith('L:') and (LABEL[x[3][2:]].get('fi') or 0)>=5 and 'hifiber' not in x[5]:
        x[5].append('hifiber')
        if 'ons_hifiber' not in x[9]: x[9].append('ons_hifiber')
FOD['sugarfree_candy']=('high','당알코올(폴리올)',[47])
# ---- FODMAP 전수 점검(v1.5.2) ----
# Monash 자료[20,55]와 Monash 저자 논문[56,57]을 먼저 쓰고, Monash 앱 결과를 옮긴 2차 자료(FODMAP Everyday[58])는
# 설명에 '2차 자료'라고 적는다. 어느 쪽에서도 찾지 못한 음식은 비슷한 음식으로 미루어 정하지 않고 '수치 미확인'으로 둔다.
MUSH='(양송이는 높고 느타리는 낮아 버섯마다 다름)'
GRAPE='2알까지만 낮고 3알부터 과당이 많음(2024년 Monash 재분석, 2차 자료)'
SOBA='Monash가 시험한 소바 면(밀·메밀 혼합)은 1/3컵(90g)까지 낮고, 더 많은 양은 확인 안 됨'
PASTE='측정되지 않음. 마늘·양파·콩·밀가루가 들어 고FODMAP일 가능성이 크다고 봄'
FOD.update({
 'oyster_mushroom':('low','75g 기준 낮음',[55]),
 'wood_ear':('low','말린 목이버섯 70g 기준 낮음(2차 자료)',[58]),
 'shiitake':('unk','생표고의 등급은 찾지 못함(말린 표고는 7g·약 2개까지 낮음, 2차 자료). 버섯 대부분은 만니톨이 많음',[20,58]),
 'king_oyster':('unk','새송이는 시험 결과를 찾지 못함'+MUSH,[20,55]),
 'enoki':('unk','팽이버섯은 시험 결과를 찾지 못함'+MUSH,[20,55]),
 'mushroom_stirfry':('unk','버섯 종류와 양념에 따라 다름'+MUSH,[20,55]),
 'celery':('high','만니톨이 많음. 10g 정도의 아주 적은 양만 낮음(2차 자료)',[20,58]),
 'cherry_tomato':('amount','3개(45g)까지 낮고, 더 많으면 과당 등이 늘어남',[55]),
 'stevia_tomato':('unk','방울토마토는 3개(45g)까지 낮지만 스테비아 토마토는 시험되지 않음',[55]),
 'grape':('high',GRAPE,[58]),'shine_muscat':('high',GRAPE,[58]),'stevia_grape':('high','포도: '+GRAPE,[58]),
 'fig':('high','과당이 많은 과일',[20]),
 'dragon_fruit':('low','중간 1개(330g) 기준 낮음(양은 2차 자료)',[55,58]),
 'lychee':('low','생 리치 3개(30g) 기준 낮음(2차 자료), 통조림 리치도 낮음',[55,58]),
 'grapefruit':('low','80g 기준 낮음(2차 자료)',[58]),
 'orange_juice':('low','125ml 기준 낮음(2차 자료)',[58]),
 'strawberry':('low','65g(중간 크기 5개) 기준 낮음(2차 자료)',[20,58]),
 'pineapple':('low','생것 1컵(140g) 기준 낮음(말린 것은 25g이면 중간, 2차 자료)',[20,58]),
 'black_tea':('low','우유를 넣지 않은 홍차는 낮음',[55]),
 'kombucha':('amount','프럭탄이 있어 한 병을 다 마시면 맞지 않을 수 있음',[55]),
 'strawberry_jam':('low','2큰술(40g) 기준 낮음(2차 자료)',[58]),
 'sugarfree_choco':('high','무설탕 과자류는 당알코올 때문에 높음(원재료명 확인)',[20,47]),
 'potato_chips':('low','소금만 넣은 감자칩은 프럭탄이 아주 적음(양파·마늘 맛은 다를 수 있음)',[57]),
 'soba':('amount',SOBA,[55,58]),'naengmomil':('amount',SOBA,[55,58]),
 'pine_nut':('amount','8g까지 낮고 9g이면 중간, 30g이면 높음(2차 자료)',[58]),
 'laver':('low','김 2장(5g) 기준 낮고, 많이 먹어도 낮음(2차 자료)',[58]),
 'seaweed':('amount','미역 5g(1작은술)까지 낮고 10g이면 만니톨이 중간(2차 자료)',[58]),
 'kelp':('unk','다시마는 Monash가 시험하지 않음(2차 자료)',[58]),
 'chard':('low','Monash 시험에서 FODMAP이 아주 적게 나옴(2차 자료)',[58]),
 'old_pumpkin':('unk','늙은호박은 시험되지 않음(단호박은 75g까지 낮음)',[55]),
 'cucumber_pickle':('low','오이피클(gherkin)은 낮음(여러 채소를 섞은 피클은 높음)',[55]),
 'bean_sprout':('unk','콩나물은 시험되지 않음(숙주는 낮음, 2차 자료)',[52,58]),
 'doenjang':('unk','한국 된장은 '+PASTE+'(일본 된장인 미소는 12g까지 낮음, 2차 자료)',[56,58]),
 'gochujang':('unk',PASTE,[56]),'ssamjang':('unk',PASTE,[56]),
 'gochugaru':('unk','고춧가루 자체는 시험되지 않음(말린 고추 플레이크는 2g까지 낮고 13g이면 과당이 중간, 2차 자료). 매운 성분에 민감할 수 있음',[58]),
 'sparkling_water':('low','탄수화물이 없음(탄산 자체는 배에 가스를 채울 수 있음)',[]),
})
for i in ['donut','egg_tart','hotteok','sujebi','churros','yakgwa','hotdog']: FOD[i]=('high','밀가루',[20])
for i in ['rabokki','jjolmyeon']: FOD[i]=('high','밀 면',[24])
# 시판 과자·사탕·젤리·초콜릿(v1.6.1). 원재료에서 확인한 고FODMAP 원료(밀가루가 주원료, 양파, 프락토올리고당, 당알코올)가 있으면 '높음',
# 소금만 넣은 감자칩과 밀크초콜릿은 Monash 값, 나머지(옥수수 과자·사탕·젤리 등)는 시험된 적이 없어 넣지 않는다(판정에 쓰지 않음).
for i in ['gana_mild','gana_milk','abc_choco','crunky']: FOD[i]=('amount','밀크초콜릿은 30g(5조각)이면 유당이 중간',[52])
for i in ['margaret','kancho','montshell','chocopie','orion_custard','saeukkang','jagalchi','ojingeojip','dakdari_snack','goraebap','chocosongi',
          'chokchok_chocochip','chocochip_cookie','bichobi','baebae','butter_waffle','bigpie_berry','jolly_pong','shinjjang','sando_berry','cham_cracker',
          'couque_white','ppotto_cheese','ace_cracker','pepero_almond','ommason_pie','harvest','mitsu_black','wang_goraebap','digestive_ball',
          'peanut_chip_cookie','hot_goraebap','goraebap_cheese','mala_chickenpop','hotbreak_cookiebar','chocochip_matcha','chambungeo_cream',
          'ott_applepie','mitsu_cheese','brownie_matcha','brownie_cheese']: FOD[i]=('high','밀가루',[20])
for i in ['onion_ring_ns','gamjakkang','yangpakkang']: FOD[i]=('high','밀가루·양파',[20])
FOD['kkulkwabaegi']=('high','밀가루(꿀·사과농축액도 조금 들어 있음)',[20])
FOD['gogumakkang']=('high','밀가루·프락토올리고당',[20,51])
FOD['jocheong_yugwa']=('high','프락토올리고당 첨가',[51])
FOD['anytime_candy']=('high','당알코올(말티톨·자일리톨·소비톨)',[47])
FOD['potato_chip_ns']=('low','소금만 넣은 감자칩은 프럭탄이 아주 적음',[57])
# 시판 라면(v1.6.2): 밀 면(진비빔면은 비빔장에 사과과즙도)
for v in ramen_check.X.values(): FOD[v['fid']]=('high','밀 면',[24])
FOD['rm_jinbibim']=('high','밀 면·사과과즙(비빔장)',[24,20])
for i in ['baek_kimchi','nabak_kimchi','yeolmu_kimchi','chonggak','gat_kimchi','pa_kimchi','kkakdugi','dongchimi','oi_sobagi']:
    if i in IDX: FOD[i]=('unk','배추김치는 47g까지 낮다는 Monash 앱 결과가 있으나(2차 자료) 이 김치는 시험되지 않음',[58])
for x in L:
    if x[0] not in FOD and 'allium' in x[5]: FOD[x[0]]=('unk','양파·마늘·파 양념에 따라 높을 수 있음',[20])
# ---- 과일 하루 양(길병원 저잔사식) ----
CAP={'apple':100,'pear':100,'grape':80,'watermelon':150,'canned_peach':100,'hallabong':120}
# ---- 식약처 자료 선택: 음식(D)은 계열 사이 식이섬유 중앙값 행 ----
raw=pd.read_csv(os.path.join(MFDS,'raw.csv'),dtype=str)
dish=pd.read_csv(os.path.join(MFDS,'dish.csv'),dtype=str); dish=dish[~dish['식품코드'].str.startswith('D2')]
prepdb=pd.read_csv(os.path.join(MFDS,'prep.csv'),dtype=str).rename(columns={'가공식품품목명':'식품명','영양성분기준용량':'영양성분함량기준량'})
proc=pd.read_csv(os.path.join(MFDS,'proc.csv'),dtype=str).drop_duplicates('식품코드')
DB={'R':raw,'D':dish,'P':prepdb,'C':proc}
PRI={'D1':0,'D3':1,'D5':2,'D4':3,'D6':4,'D7':5}
def num(v):
    v=str(v).strip()
    if v in ('','-','nan','NaN','None'): return None
    try: return float(v)
    except: return None
COLS=['에너지(kcal)','단백질(g)','지방(g)','탄수화물(g)','식이섬유(g)','칼슘(mg)','철(mg)']
# 분석값(D1>D3) 우선. 재료에 비해 식이섬유 분석값이 지나치게 높은 경우만 다른 계열 사용
EXC={'scrambled_egg':'D309-433000000-0001','beef_suyuk':'D407-335130000-0001','jokbal':'D307-344000000-0001','grilled_sp_mackerel':'D508-383000000-0001','myeolchi_bokkeum':'D510-472000000-0001','bulgogi':'D308-386000000-0001','radish_saengchae':'D514-627000000-0001','mixed_grain_rice':'D401-032000000-0001','pajeon':'D709-441000000-0001','bibim_guksu':'D303-157000000-0002',
     # 시판 제품(C)은 같은 이름의 제품이 여럿이면 열량이 가운데쯤인 제품으로 고정
     'tanghulu':'P116-701070100-1852','croffle':'P101-410000400-0839','scone':'P101-406000400-0478','financier':'P101-405000400-3736',
     'sparkling_water':'P109-402040200-0079','energy_drink':'P109-401040100-2602','zero_soda':'P109-401040100-0787',
     # 육회 D1 행은 식이섬유가 100g당 6.6g으로 재료(소고기·배·참기름)에 비해 지나치게 높아 D4 행을 쓴다
     'yukhoe':'D427-762000000-0001','ion_drink':'P109-801080100-1518','takefit_max':'P109-801080100-3120'}
MF={}; notes=[]; dup=[]; MICRO={}
r2=lambda v: None if v is None else round(v+0.0,2)
# ---- 음식(D) 값 고르기 규칙(v1.8.0, 근거: FAO/INFOODS·Greenfield & Southgate·Gibson, docs/evidence.md) ----
# ① 같은 이름의 분석값(가정식 D1 → 외식 D3)이 있으면 그 값(기준 레시피로 조리해 3회 분석한 평균값)
# ② 분석값이 없거나 재료에 비해 맞지 않으면(EXC의 산출 행) 재료량 산출 계열(외식·급식) 값의 산술평균
# ③ 고른 분석 행에 식이섬유가 비어 있으면 같은 음식 산출 계열의 식이섬유 평균을 빌려 쓰고 표시
# 앱에는 고른 방법과 같은 이름 자료의 열량 범위를 함께 보여 준다(DISHX)
DISHX={}
EXTRA=['칼륨(mg)','나트륨(mg)','비타민 D(μg)']
def _vals(r): return [num(r[c]) for c in COLS+EXTRA]
def mean_rows(rs):
    out=[]
    for col in zip(*[_vals(r) for r in rs]):
        v=[c for c in col if c is not None]
        out.append(round(sum(v)/len(v),2) if v else None)
    return out
def krange(rs,extra=()):
    ks=[num(r['에너지(kcal)']) for r in rs]+list(extra); ks=[k for k in ks if k is not None]
    return (int(round(min(ks))),int(round(max(ks)))) if ks else (None,None)
def lab(key):
    d=LABEL[key]; vol=d['vol']; per=lambda v: None if v is None else r2(v*100/vol)
    kc=d['kcal']; calc=False
    if kc is None and None not in (d['c'],d['p'],d['f']):
        fi=d['fi'] or 0; al=d.get('allulose',0)
        kc=int(round(((d['c']-fi-al)*4+fi*2+d['p']*4+d['f']*9)/5.0)*5); calc=True
    name=d['name']+(' · 열량은 표시된 탄수화물·단백질·지방으로 계산' if calc else '')
    unit=d.get('unit','ml')
    mf=[per(kc),per(d['p']),per(d['f']),per(d['c']),per(d['fi']),per(d['ca']),per(d['fe']),'L',d['src'],name,'100'+unit,per(d['k'])]
    if d.get('ref'): mf.append(d['ref'])   # 출처 근거 번호(없으면 앱에서 53: 영양식 제품 표시)
    return mf,[per(d['na']),per(d['vd'])]
for x in L:
    db,nm=x[3].split(':',1)
    if db=='L':
        MF[x[0]],MICRO[x[0]]=lab(nm); continue
    if db=='N':
        MF[x[0]]=None; MICRO[x[0]]=[None,None]; continue
    df=DB[db]; m=df[df['식품명']==nm]
    assert len(m), x[0]
    rows=[r for _,r in m.iterrows()]
    if db=='D':
        rows.sort(key=lambda r: (PRI.get(r['식품코드'][:2],9),r['식품코드']))
        ser=[r['식품코드'][:2] for r in rows]
        if len(ser)!=len(set(ser)): dup.append((x[0],[(r['식품코드'],r['식이섬유(g)']) for r in rows]))
        an=[q for q in rows if q['식품코드'][:2] in ('D1','D3')]
        calc=[q for q in rows if q['데이터생성방법명']=='산출']
        lo,hi=krange(rows); borrow=0; fib=None
        if an:
            r=an[0]   # 가정식 분석(D1) → 외식 분석(D3)
            if x[0] in EXC:   # 이 분석 행의 식이섬유가 재료에 비해 지나치게 높다(자료 점검)
                rx=[q for q in rows if q['식품코드']==EXC[x[0]]][0]
                if rx['식품코드'][:2] in ('D1','D3'):   # 다른 분석 행이 있으면 그 행 전체
                    notes.append((x[0],r['식품코드'][:2]+':'+str(r['식이섬유(g)']),'->',rx['식품코드'][:2]+':'+str(rx['식이섬유(g)'])))
                    r=rx
                else:   # 분석 행은 그대로 두고 식이섬유만 산출 계열 평균으로
                    fc=[num(q['식이섬유(g)']) for q in calc if num(q['식이섬유(g)']) is not None]
                    fib=round(sum(fc)/len(fc),2); borrow=2
                    notes.append((x[0],r['식품코드'][:2]+':'+str(r['식이섬유(g)']),'-> 섬유만 산출 평균',fib))
        else: r=None
        if r is not None and r['데이터생성방법명']!='산출':
            how='home' if r['식품코드'].startswith('D1') else 'out'
            vals=[num(r[c]) for c in COLS]
            if fib is not None: vals[4]=fib
            if vals[4] is None:
                oth=[num(q['식이섬유(g)']) for q in an if num(q['식이섬유(g)']) is not None]
                fc=oth[:1] or [num(q['식이섬유(g)']) for q in calc if num(q['식이섬유(g)']) is not None]
                if fc: vals[4]=round(sum(fc)/len(fc),2); borrow=1
            vals=[None if v is None else (int(v) if float(v).is_integer() and c=='에너지(kcal)' else round(v,2)) for v,c in zip(vals,COLS)]
            MF[x[0]]=vals+[db,r['식품코드'],r['식품명'],r['영양성분함량기준량'],num(r['칼륨(mg)'])]
            MICRO[x[0]]=[r2(num(r['나트륨(mg)'])),r2(num(r['비타민 D(μg)']))]
        else:
            assert calc, x[0]
            how='mean'; mv=mean_rows(calc)
            mv[0]=None if mv[0] is None else int(round(mv[0]))
            MF[x[0]]=mv[:7]+[db,'산출평균:'+','.join(q['식품코드'] for q in calc),nm,calc[0]['영양성분함량기준량'],mv[7]]
            MICRO[x[0]]=[mv[8],mv[9]]
        DISHX[x[0]]=[how,len(rows),lo,hi,borrow]
        continue
    elif x[0] in EXC: r=[q for q in rows if q['식품코드']==EXC[x[0]]][0]
    else:
        wf=[r for r in rows if num(r['식이섬유(g)']) is not None]; r=(wf or rows)[0]
    vals=[num(r[c]) for c in COLS]
    vals=[None if v is None else (int(v) if float(v).is_integer() and c=='에너지(kcal)' else round(v,2)) for v,c in zip(vals,COLS)]
    MF[x[0]]=vals+[db,r['식품코드'],r['식품명'],r['영양성분함량기준량'],num(r['칼륨(mg)'])]
    MICRO[x[0]]=[r2(num(r['나트륨(mg)'])),r2(num(r['비타민 D(μg)']))]
# 앱에 직접 적힌 기존 음식(const MFDS)의 나트륨·비타민 D: 같은 식품코드 행에서 가져옴
SRC_APP=os.path.join(ROOT,'src','app','app.src.html')
_a=open(SRC_APP,encoding='utf-8').read(); _i=_a.index('const MFDS={')+len('const MFDS='); _j=_a.index('};\n',_i)+1
BASE_MF=json.loads(_a[_i:_j])
for i,m in BASE_MF.items():
    df=DB[m[7]]; row=df[df['식품코드']==m[8]]
    assert len(row), (i,m[8])
    rr=row.iloc[0]; MICRO[i]=[r2(num(rr['나트륨(mg)'])),r2(num(rr['비타민 D(μg)']))]
    if m[7]=='D':   # 같은 이름 자료의 열량 범위와 값의 종류(v1.8.0)
        same=[r for _,r in dish[dish['식품명']==m[9]].iterrows()]
        lo,hi=krange(same,[m[0]]); code=m[8][:2]
        DISHX[i]=['home' if code=='D1' else 'out' if code=='D3' else 'mean',max(len(same),1),lo,hi,0]
# 앱 레시피와 이름이 같은 분석값이 없을 때 설명이 가장 가까운 분석 행(FAO/INFOODS 음식 맞추기: 설명·조리법 일치)
# 달걀찜: 같은 이름 행은 모두 재료량 산출값(100ml당)이고, 달걀만으로 만든 달걀찜 분석값(외식)이 있다
SRC_MATCH={'egg_steamed':'D307-317040000-0001'}
for i,code in SRC_MATCH.items():
    rr=dish[dish['식품코드']==code].iloc[0]
    vals=[num(rr[c]) for c in COLS]
    vals=[None if v is None else (int(v) if float(v).is_integer() and c=='에너지(kcal)' else round(v,2)) for v,c in zip(vals,COLS)]
    MF[i]=vals+['D',code,rr['식품명'],rr['영양성분함량기준량'],num(rr['칼륨(mg)'])]
    MICRO[i]=[r2(num(rr['나트륨(mg)'])),r2(num(rr['비타민 D(μg)']))]
    same=[r for _,r in dish[dish['식품명']==BASE_MF[i][9]].iterrows()]
    lo,hi=krange(same,[vals[0]])
    DISHX[i]=['match',len(same)+1,lo,hi,0]
# ---- 국가표준식품성분표 DB 10.4(농촌진흥청, 2026.5 공개, v1.6.0) ----
# 식약처 원재료성 식품 행과 같은 식품·같은 조리 상태의 DB 10.4 행이
#  ① 국내 분석값(출처 농진청 또는 수산과학원 '수')이고 ② 분석 연도가 식약처 행의 데이터 생성 연도보다 이르지 않으며
#  ③ 두 자료에 모두 적힌 값 가운데 하나라도 다르면 DB 10.4 값을 쓴다(열량·단백질·지방·탄수화물·식이섬유·칼슘·철·칼륨·나트륨·비타민 D 모두).
# 한쪽에만 값이 있는 차이(생선의 칼륨·나트륨 등)만 있는 식품, 외국 자료(JAPAN·USDA) 행, 더 오래된 행은 식약처 값을 그대로 둔다.
# 톳은 DB 10.4 식이섬유가 세부 값 없이 0으로만 적혀 있어 식약처 값(1.0g)을 둔다.
# 밥·죽(v1.8.0): 식약처 음식 DB의 같은 이름 행은 급식 재료량 산출값(100ml당)이나 외식 분석값뿐이라,
# 가정에서 지은 밥·죽을 분석한 DB 10.4 행(같은 식품·같은 조리 상태, 정확히 일치)을 쓴다.
RDA_STAPLE={'white_rice':'멥쌀, 백미, 밥','rice_porridge':'멥쌀, 백미, 죽'}
RDA={'anchovy_broth':'멸치 육수','apple':'사과, 생것','apricot':'살구, 생것','beet':'비트, 뿌리, 데친것',
 'black_soybean':'대두, 검은색, 서리태, 삶은것','blueberry':'블루베리, 생것','broccoli':'브로콜리, 데친것','cabbage':'양배추, 데친것',
 'canned_tuna':'다랑어, 가다랑어, 통조림, 유지','carrot':'당근, 뿌리, 데친것','carrot_raw':'당근, 뿌리, 생것','celery':'셀러리, 생것',
 'cherry':'체리, 생것','cherry_tomato':'토마토, 방울토마토, 생것','clam':'바지락, 생것','croaker':'조기(참조기), 생것',
 'doraji':'도라지, 뿌리, 데친것','dragon_fruit':'용과, 백육종, 생것','duck_skin':'오리고기, 생것, 껍질 포함','fig':'무화과, 봉래시, 생것',
 'glutinous_rice':'찹쌀, 백미, 보람찰, 밥','green_laver':'파래, 생것','green_pea':'완두, 삶은것','halibut':'넙치(광어), 생것',
 'kale':'케일, 생것','kidney_bean':'강낭콩, 삶은것','kiwi':'키위, 그린, 생것','maesaengi':'매생이, 생것','mango':'망고, 생것',
 'melon':'멜론, 머스크, 생것','nakji':'낙지, 생것','nurungji':'누룽지','olive_oil':'올리브유','orange':'오렌지, 생것',
 'paprika':'파프리카, 빨간색, 생것','pasta':'국수, 말린것, 삶은것','perilla_leaf':'들깻잎, 생것','red_bean':'팥, 적색, 삶은것',
 'saury':'꽁치, 생것','seaweed':'미역, 생것','smoked_salmon':'연어, 훈제','somen':'국수, 소면, 말린것, 삶은것',
 'spanish_mackerel':'삼치, 생것','stevia_cherry':'체리, 생것','sugar':'설탕, 백설탕','tomato':'토마토, 데친것',
 'tuna_sashimi':'다랑어, 참다랑어, 생것','watermelon':'수박, 적육질, 생것','white_fish':'대구, 생것'}
RDA_DIR=os.path.join(ROOT,'data','rda')
rda=pd.read_csv(os.path.join(RDA_DIR,'rda104.csv'),header=None,dtype=str,skiprows=3)
rcode=pd.read_csv(os.path.join(RDA_DIR,'rda104_codes.csv'),dtype=str)
RCOL={'kcal':5,'p':7,'f':8,'c':10,'fi':18,'ca':21,'fe':22,'k':25,'na':26,'vd':51}
def rnum(v):
    v=str(v).strip()
    if v in ('','-','nan'): return None
    if v=='Tr': return 0.0          # 미량(정량 한계 이하)
    try: return round(float(v.strip('()')),2)   # 괄호는 인용·산출값
    except: return None
RDA.update(RDA_STAPLE)
for i,nm in RDA.items():
    m=rda[rda[3].str.strip()==nm]; assert len(m)==1,(i,nm)
    r=m.iloc[0]; assert re.match(r"(농진청|수)\('\d\d\)$",str(r[4]).strip()),(i,r[4])
    c=rcode[rcode['색인']==r[0]]; assert len(c)==1 and c['식품명'].iloc[0].strip()==nm,(i,nm)
    v={k:rnum(r[col]) for k,col in RCOL.items()}
    kc=v['kcal']; kc=int(kc) if kc is not None and float(kc).is_integer() else kc
    MF[i]=[kc,v['p'],v['f'],v['c'],v['fi'],v['ca'],v['fe'],'A',c['식품코드'].iloc[0],nm,'100g',v['k']]
    MICRO[i]=[v['na'],v['vd']]
    if i in RDA_STAPLE:
        same=[r for _,r in dish[dish['식품명']==BASE_MF[i][9]].iterrows()]
        lo,hi=krange(same,[kc])
        DISHX[i]=['rda',len(same)+1,lo,hi,0]
# ---- 근거 문장 ----
def why(x):
    sents=[]; refs=[]
    for k in x[9]:
        s,rf=T[k]
        if '{cap}' in s: s=s.replace('{cap}',str(CAP.get(x[0],x[11] or 100)))
        if s not in sents: sents.append(s)
        for r in rf:
            if r not in refs: refs.append(r)
    return ' '.join(sents), refs
FICAT={'곡류':'f_bowl','단백질':'f_meat','유제품':'f_bottle','채소':'f_leaf','과일':'f_fruit','지방':'f_drop','기타':'f_plate','요리':'f_bowl','영양식':'f_bottle'}
js=lambda o: json.dumps(o,ensure_ascii=False,separators=(',',':'))
out={'foods':[],'mfds':{},'emo':{},'ficon':{},'fodi':{},'serv':{},'alias':{},'cap':CAP,'micro':{},'source':{},'ingr':{},'dishx':{}}
# 시판 과자 원재료명(포장 표시): 직접 입력한 알레르기·싫어하는 음식을 원재료와도 대조(v1.6.1)
for i,t in snack_check.ING.items():
    assert i in IDX, i
    out['ingr'][i]=t
for i,t in ramen_check.ING.items():   # 시판 라면(v1.6.2)
    assert i in IDX and i not in out['ingr'], i
    out['ingr'][i]=t
# 식약처 원본 CSV 기록(데이터 기준일자·행 수·SHA-256)
for key,fn in [('raw','raw.csv'),('dish','dish.csv'),('proc','proc.csv'),('prep','prep.csv')]:
    fp=os.path.join(MFDS,fn); d=pd.read_csv(fp,dtype=str)
    col='데이터기준일자' if '데이터기준일자' in d.columns else '데이터생성일자'
    out['source'][key]={'rows':len(d),'dateCol':col,'dates':sorted(d[col].dropna().unique().tolist())[-3:],'sha256':hashlib.sha256(open(fp,'rb').read()).hexdigest()}
for x in L:
    i,nm,cat,_,msv,tags,serv,al,emo,tk,_f,_c,pr,cost=x
    w,refs=why(x)
    out['foods'].append(f'LF({js(i)},{js(nm)},{js(cat)},{msv},{js(tags)},{cost},{js(pr)},{js(w)},{js(refs)})')
    if MF[i] is None:
        out['micro'][i]=[None,None]
        if emo: out['emo'][i]=emo
        else: out['ficon'][i]=FICAT[cat]
        if i in FOD: out['fodi'][i]=list(FOD[i])
        out['serv'][i]=serv; out['alias'][i]=al
        continue
    mf=list(MF[i])
    # 식약처 표의 기준량이 고형 음식에도 '100ml'로 적힌 경우가 있어, 마시는 음식이 아니면 100g으로 표기
    # 그릇에 담는 음식 가운데 국물이 없는 것(볶음밥·짜장밥·비빔냉면·스파게티)도 고형 음식이라 100g으로
    if isinstance(mf[10],str) and 'ml' in mf[10] and (serv[1] not in ('잔','컵','캔','병','팩','그릇') or i in ('kimchi_fried_rice','jjajang_rice','bibim_naengmyeon','spaghetti_tomato')):
        mf[10]=mf[10].replace('ml','g')
    out['mfds'][i]=mf
    out['micro'][i]=MICRO[i]
    if emo: out['emo'][i]=emo
    else: out['ficon'][i]=FICAT[cat]
    if i in FOD: out['fodi'][i]=list(FOD[i])
    out['serv'][i]=serv
    out['alias'][i]=al
# 앱에 직접 적힌 기존 음식(당근·토마토 등) 가운데 DB 10.4 값을 쓰는 것은 생성 데이터로 덮어씀
for i in list(RDA)+list(SRC_MATCH):
    if i not in out['mfds']: out['mfds'][i]=MF[i]
out['dishx']={k:DISHX[k] for k in sorted(DISHX)}
for key,fn in [('rda','rda104.csv'),('rda_codes','rda104_codes.csv')]:
    fp=os.path.join(RDA_DIR,fn)
    out['source'][key]={'rows':len(rda) if key=='rda' else len(rcode),'version':'국가표준식품성분 Database 10.4','sha256':hashlib.sha256(open(fp,'rb').read()).hexdigest()}
for i,v in MICRO.items():
    if i not in out['micro']: out['micro'][i]=v
# ---- 장보기(v1.8.0): 식단의 익힌 무게 → 살 때 무게 (DB 10.4 수분·폐기율, 근거 64·80) ----
# 조리로 바뀐 무게를 모두 수분 변화로 보면(근거 80) 생것 무게 = 익힌 무게 × (100-익힌 것 수분)/(100-생것 수분).
# 두 행이 같은 표본이 아니면 틀릴 수 있어 단백질로 구한 비율과 12% 넘게 다르면 멈춘다.
# 비율이 0.83~1.17이면(익혀도 무게 차이가 작고 표본 차이와 구별되지 않음) 1로 둔다.
# 연어(구운 것 JAPAN 지방 7.9g, 생것 수('09) 1.9g)는 같은 연어로 볼 수 없어 넣지 않는다(식단의 익힌 무게 그대로 표시).
# 폐기율은 생것 행 값이고, 살 때 껍질·씨·껍데기가 붙어 있는 채소·과일·알·밤·꽃게에만 쓴다(게살·알굴·닭가슴살은 0).
SHOP_COOK={  # id: (익힌 것 행, 생것 행, 장보기 이름, 폐기율 씀)
 'white_rice':('멥쌀, 백미, 밥','멥쌀, 백미, 생것','쌀(백미)',0),'rice_porridge':('멥쌀, 백미, 죽','멥쌀, 백미, 생것','쌀(백미)',0),
 'glutinous_rice':('찹쌀, 백미, 보람찰, 밥','찹쌀, 백미, 생것','찹쌀',0),'somen':('국수, 소면, 말린것, 삶은것','국수, 소면, 말린것','소면(마른 것)',0),
 'lentil':('렌즈콩(렌틸콩), 빨간색, 말린것, 삶은것','렌즈콩(렌틸콩), 빨간색, 말린것','렌틸콩(마른 것)',0),
 'hummus':('병아리콩, 말린것, 삶은것','병아리콩, 말린것','병아리콩(마른 것)',0),
 'chicken_breast':('닭고기, 가슴, 삶은것','닭고기, 가슴, 생것','닭가슴살',0),'crab':('게, 대게, 삶은것','게, 대게, 생것','게살',0),
 'oyster':('굴, 참굴, 삶은것','굴, 참굴, 생것','굴(알굴)',0),'blue_crab':('게, 꽃게, 찐것','게, 꽃게, 생것','꽃게',1),
 'egg_boiled':('달걀, 삶은것','달걀, 생것','달걀',1),'quail_egg':('메추리알, 삶은것','메추리알, 생것','메추리알',1),
 'potato':('감자, 수미, 삶은것','감자, 수미, 생것','감자',1),'sweet_potato':('고구마, 분질(밤) 고구마, 찐것','고구마, 분질(밤) 고구마, 생것','고구마(밤고구마)',1),
 'chestnut':('밤, 삶은것','밤, 생것','밤',1),'tomato':('토마토, 데친것','토마토, 생것','토마토',1),'spinach':('시금치, 데친것','시금치, 생것','시금치',1),
 'zucchini':('호박, 애호박, 데친것','호박, 애호박, 생것','애호박',1),'radish':('무, 조선무, 삶은것','무, 조선무, 생것','무',1),
 'eggplant':('가지, 데친것','가지, 생것','가지',1),'pumpkin':('호박, 단호박, 찐것','호박, 단호박, 생것','단호박',1),
 'napa':('배추, 알배기, 삶은것','배추, 알배기, 생것','알배기배추',1),'old_pumpkin':('호박, 늙은호박, 찐것','호박, 늙은호박, 생것','늙은호박',1),
 'carrot':('당근, 뿌리, 데친것','당근, 뿌리, 생것','당근',1),'cabbage':('양배추, 데친것','양배추, 생것','양배추',1),
 'broccoli':('브로콜리, 데친것','브로콜리, 생것','브로콜리',1),'button_mushroom':('양송이버섯, 데친것','양송이버섯, 생것','양송이버섯',1),
 'bok_choy':('청경채, 데친것','청경채, 생것','청경채',1),
}
SHOP_RAWREF={  # 생것으로 적힌 과일·채소: 폐기율만 (id: (생것 행, 장보기 이름))
 'banana':('바나나, 생것','바나나'),'kiwi':('키위, 그린, 생것','키위'),'onion':('양파, 생것','양파'),'apple':('사과, 생것','사과'),
 'applesauce':('사과, 생것','사과'),'peach':('복숭아, 백도, 생것','복숭아'),'pear':('배, 신고, 생것','배'),'grape':('포도, 캠벨얼리, 생것','포도(캠벨)'),
 'watermelon':('수박, 적육질, 생것','수박'),'melon':('멜론, 머스크, 생것','멜론'),'korean_melon':('참외, 생것, 씨 제거','참외'),
 'strawberry':('딸기, 설향, 생것','딸기'),'sweet_persimmon':('감, 단감, 부유, 생것','단감'),'mango':('망고, 생것','망고'),'orange':('오렌지, 생것','오렌지'),
}
def rrow(nm):
    m=rda[rda[3].str.strip()==nm]; assert len(m)==1,nm; return m.iloc[0]
def rref(r):
    v=str(r[136]).strip(); return int(float(v)) if re.match(r'^\d+(\.\d+)?$',v) else 0
out['shop']={}
for i,(cn,rn,lab,useref) in SHOP_COOK.items():
    c,r=rrow(cn),rrow(rn)
    fw=(100-rnum(c[6]))/(100-rnum(r[6])); fp=rnum(c[7])/rnum(r[7])
    if abs(fw-1)<=0.17: fac=1
    else:
        assert abs(fw/fp-1)<=0.12,(i,fw,fp); fac=round(fw,3)
    out['shop'][i]=[lab,fac,rref(r) if useref else 0,rn]
for i,(rn,lab) in SHOP_RAWREF.items():
    out['shop'][i]=[lab,1,rref(rrow(rn)),rn]
json.dump(out,open(GEN,'w'),ensure_ascii=False)
print('foods',len(out['foods']),'fodi',len(out['fodi']),'emo',len(out['emo']),'ficon',len(out['ficon']))
print('exceptions',len(notes)); print('dup series',dup)
for n in notes: print(' ',*n)
