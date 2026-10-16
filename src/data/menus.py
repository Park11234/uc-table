# -*- coding: utf-8 -*-
"""오프라인 예시 식단용 끼니 메뉴(AI 없이 앱 규칙만으로 7일 식단을 만들 때 쓰는 목록).

설계
  - 메뉴는 앱 음식 DB(식약처 영양값이 붙은 음식)의 식품 id와 g으로만 만든다. 없는 음식은 쓰지 않는다.
  - 단계 판정은 여기서 하지 않는다. 앱이 식단을 만들 때 메뉴의 모든 식품이 그날 단계·알레르기·의료진 지시·
    주의 음식 조건에서 '먹어도 좋음/주의'인지 검사하고(fit), 저잔사식 단계에서는 섬유·채소 35g·과일 양을 줄인다.
  - 조합 규칙: 한 끼 채소 반찬은 1가지(길병원 저잔사식), 같은 단백질군을 두 번 넣지 않음, 짠 반찬은 소량.
  - 설명은 구성 요소마다 미리 검토한 문장(근거 번호 포함)을 이어 붙인다. 구성 요소마다 간단한 조리법을 붙이고,
    확인한 레시피 링크(만개의레시피 등, 앱의 RECIPES)가 있는 구성 요소는 rec에 id를 넣는다.
  - 이름은 식단표처럼 '밥·주찬·부찬' 순서로 짓는다(예: 찹쌀밥·대구살찜·계란국·백김치).
  - hi: 이 메뉴를 우선 고를 가장 높은 단계. 죽 위주 메뉴는 2(관해기에는 다른 메뉴를 먼저 고름).
  - med: 지중해식 메뉴(콩류·통곡물·채소 두 가지·올리브유·생선). 관해기(3단계)에는 먼저 고른다.
"""

# ---------- 구성 요소별 설명(검토한 문장과 근거 번호) ----------
NOTE = {
 'fish':    ("흰살생선은 지방이 적어 활동기에도 소화가 편한 단백질 반찬입니다.", [37, 39]),
 'oily':    ("등푸른 생선은 오메가-3가 많아 관해기에 주 3회 이상 권합니다. 활동기에는 기름이 부담될 수 있어 흰살생선이 낫습니다.", [37, 3]),
 'salmon':  ("연어는 오메가-3가 많은 생선입니다. 활동기에는 튀기듯 굽지 말고 찌거나 조려 기름을 줄입니다.", [3, 37]),
 'chicken': ("껍질 벗긴 닭고기는 지방이 적어 저잔사식에서 허용되는 단백질입니다.", [39]),
 'duck':    ("껍질과 기름을 뗀 오리 살코기는 지방이 적은 단백질입니다.", [39]),
 'redmeat': ("살코기는 저잔사식에서 허용되지만 붉은 고기는 줄이도록 권고돼 조금만 씁니다.", [39, 3, 50]),
 'egg':     ("달걀은 부드러워 활동기에도 권장되는 단백질입니다.", [39, 46]),
 'tofu':    ("두부는 저잔사식에서 허용되는 식물성 단백질입니다.", [39]),
 'shell':   ("새우·게살은 저잔사식에서 허용되는 단백질입니다.", [39]),
 'oyster':  ("굴은 대한장연구학회가 죽·국에 넣는 단백질로 안내하지만, 길병원 저잔사식은 조개류를 제한해 이행식부터 익혀 먹습니다.", [37, 39]),
 'veg':     ("채소는 껍질·씨를 빼고 무르게 익힙니다. 저잔사식 단계에서는 한 끼 한 가지, 35g 정도만 먹습니다.", [39, 2]),
 'veg2':    ("증상이 나아진 뒤에는 익힌 채소를 한 가지씩 늘려 갑니다.", [2, 39]),
 'kimchi':  ("맵지 않은 백김치·물김치는 저잔사식에서 허용되지만 짜서 조금만 먹습니다.", [39]),
 'soup':    ("맑은 국은 설사로 빠진 수분을 보충하는 데 도움이 됩니다.", [34, 37]),
 'grain':   ("증상이 나아지면 잡곡·통곡물로 섬유를 조금씩 늘립니다.", [2, 30]),
 'porridge':("죽은 부드럽고 섬유가 적어 활동기에 먹기 좋습니다. 살코기·달걀·두부를 더해 영양 밀도를 높입니다.", [37, 39]),
 'noodle':  ("면류는 저잔사식에서 허용됩니다. 밀가루 면은 가스가 늘면 양을 줄입니다.", [39, 20]),
 'bread':   ("부드러운 빵은 저잔사식에서 허용됩니다. 밀의 가스 유발 성분이 불편하면 양을 줄입니다.", [39, 20]),
 'dairy':   ("유제품은 질병을 악화시킨다는 근거가 없습니다. 유당이 불편하면 락토프리 우유로 바꿉니다.", [37, 50]),
 'soymilk': ("두유는 저잔사식에서 허용되고 유당이 없습니다.", [39]),
 'potato':  ("껍질 벗긴 감자는 저잔사식에서 허용되고, 설사로 잃기 쉬운 칼륨을 보탭니다.", [39, 34]),
 'tuber':   ("고구마는 섬유가 많아 저잔사식에서는 제한되고 이행식부터 먹습니다.", [39]),
 'oat':     ("귀리의 수용성 섬유는 증상이 나아진 뒤 섬유를 다시 늘리는 첫 단계로 씁니다.", [30, 37]),
 'onebowl': ("여러 재료가 든 한 그릇 음식이라 이행식부터 재료를 확인하며 먹습니다.", [39]),
 'broth':   ("뼈 국물은 기름을 걷어 내고 살코기 위주로 먹습니다.", [39, 3]),
 'ons':     ("식사량이 줄었을 때 부족한 열량을 보충하는 방법으로 안내됩니다.", [36, 37]),
 'fruit':   ("잘 익은 과일은 껍질·씨를 빼고 길병원 저잔사식의 하루 양 안에서 먹습니다.", [39]),
 'fruit2':  ("씨나 껍질째 먹는 과일은 저잔사식에서 제한돼 이행식부터 조금씩 먹습니다.", [39]),
 'ricecake':("백설기처럼 부드러운 떡은 저잔사식에서 허용됩니다.", [39]),
 'ricecake2':("쫄깃한 떡은 저잔사식에서 제한돼 이행식부터 먹습니다.", [39]),
 'sweet':   ("당이 많은 간식은 증상을 일으키기 쉬워 조금만 먹습니다.", [39, 37]),
 'nuts':    ("견과는 저잔사식에서 제한되고 관해기에도 증상을 일으키기 쉬워, 지중해식 단계에서 조금만 먹습니다.", [39, 37, 2]),
 'chestnut':("밤은 섬유가 많아 저잔사식 허용 목록에 없어 이행식부터 먹습니다.", [39]),
 'med':     ("관해기에는 채소·과일·통곡물·콩류·생선·올리브유를 늘린 지중해식을 약물과 함께 고려할 수 있습니다.", [50, 4, 14]),
 'legume':  ("콩류는 섬유와 가스 성분(FODMAP)이 많아 관해기에 조금씩 늘립니다.", [39, 20, 23]),
 'fiber':   ("관해기에는 섬유를 서서히 늘립니다. 가스·설사가 늘면 양을 줄입니다.", [13, 30]),
}

# 같은 재료군(달걀·두부·소고기 등)이 한 끼에 두 번 들어가지 않게
FAM = {
 'egg': {'egg_steamed','egg_boiled','rolled_omelet','scrambled_egg','egg_soup','quail_egg','jangjorim_quail'},
 'tofu': {'tofu','pan_tofu','silken_tofu'},
 'beef': {'beef','beef_tenderloin','beef_suyuk','bulgogi','jangjorim_beef','bone_broth','seolleongtang','gomtang','galbitang'},
 'pork': {'pork','pork_tenderloin','pork_shoulder'},
 'chicken': {'chicken_breast','chicken_thigh','chicken_porridge','samgyetang'},
 'fish': {'white_fish','pollack','flatfish','halibut','croaker','rockfish','hairtail','salmon','mackerel','spanish_mackerel','saury','bugeo_guk','tuna_porridge'},
 'shell': {'shrimp','crab','blue_crab','oyster','abalone_porridge'},
}
def fams(items):
    ids = {i for i, _ in items}
    return {k for k, v in FAM.items() if ids & v}

# ---------- 구성 요소별 확인한 레시피(앱 RECIPES의 id) ----------
# 레시피 재료에 마늘·양파·매운 양념 등이 있으면 앱이 레시피 옆에 '빼거나 줄이기' 안내를 붙이고,
# 알레르기 재료가 있으면 그 레시피 링크만 숨긴다(메뉴는 그대로).
REC = {
 # 주찬
 '대구살찜':['r_fish_steam'],'닭가슴살 데침':['r_chicken_boil'],'달걀찜':['r_egg_steam'],'소고기 안심구이':['r_beef_tender'],
 '가자미구이':['r_gajami_grill'],'두부조림':['r_tofu_braise'],'새우볶음':['r_shrimp'],'연어 간장조림':['r_salmon_braise'],
 '닭안심 간장조림':['r_chicken_soy'],'연두부 달걀찜':['r_tofu_egg'],'돼지 안심 간장구이':['r_pork_tender'],'조기구이':['r_croaker'],
 '오리 살코기 구이':['r_duck'],'게살 달걀찜':['r_crab_egg'],'소고기 수육':['r_beef_suyuk'],'두부부침':['r_pan_tofu'],'계란말이':['r_omelet'],
 '돼지 앞다리 수육':['r_pork_suyuk'],'꽃게찜':['r_bluecrab'],'소불고기':['r_bulgogi'],'고등어구이':['r_mackerel'],'삼치구이':['r_sp_mackerel'],
 '꽁치구이':['r_saury'],'닭다리살 구이':['r_chicken_thigh'],'토마토 달걀볶음':['r_tomato_egg'],'연어구이':['r_salmon_grill'],
 # 부찬
 '애호박나물':['r_zucchini2'],'시금치나물':['r_spinach'],'무나물':['r_radish_namul'],'가지찜':['r_eggplant'],'단호박찜':['r_pumpkin_steam'],
 '배추나물':['r_napa_namul'],'오이볶음':['r_cucumber'],'양송이볶음':['r_button_mush'],'당근볶음':['r_carrot'],'청경채볶음':['r_bokchoy'],
 '양배추찜':['r_cabbage'],'콩나물무침':['r_beansprout'],'숙주나물':['r_mung'],'브로콜리 데침':['r_broccoli'],'버섯볶음':['r_mushroom'],'고사리나물':['r_gosari'],
 # 국·밥
 '계란국':['r_eggguk'],'북엇국':['r_bugeo'],'감자국':['r_potato_soup'],'소고기무국':['r_beef_radish2'],'두부계란국':['r_tofu_egg_soup'],
 '미역국':['r_miyeok'],'콩나물국':['r_beansprout_soup'],'굴국':['r_oyster_soup'],'현미밥':['r_brownrice'],
 # 죽·아침 반찬
 '흰죽':['r_juk'],'호박죽':['r_juk_pumpkin'],'닭죽':['r_juk_chicken'],'누룽지':['r_nurungji'],'소고기 장조림':['r_beef_jorim'],
 '메추리알 장조림':['r_quail_jorim'],'닭가슴살 무침':['r_chicken_boil'],'스크램블드에그':['r_scrambled'],'우유 오트밀죽':['r_oat'],
 # 한 그릇
 '잔치국수':['r_janchi'],'칼국수':['r_kalguksu'],'우동':['r_udon'],'소고기 쌀국수':['r_pho'],'수제비':['r_sujebi'],'떡국':['r_tteokguk'],
 '만둣국':['r_manduguk'],'메밀온면':['r_soba'],'순한 카레라이스':['r_curry'],'오므라이스':['r_omurice'],'채소 볶음밥':['r_veg_fried_rice'],
 '삼계탕':['r_samgyetang'],'굴국밥':['r_gulgukbap'],'고등어 무조림':['r_mackerel_radish'],
}
def recs(*names):
    out = []
    for n in names:
        for r in REC.get(n, []):
            if r not in out: out.append(r)
    return out

# ---------- 구성 요소: (표시 이름, [(식품 id, g)], 조리법, 설명 키, 단백질군) ----------
# 점심·저녁 주요리(단백질 반찬)
PROT = [
 ("대구살찜",        [("white_fish",100)],   "소금을 조금 뿌려 찜기에서 10~12분 찝니다. 껍질과 가시는 빼고 먹습니다.", 'fish', 'fish'),
 ("닭가슴살 데침",    [("chicken_breast",100)],"끓는 물에 10~15분 삶아 결대로 찢습니다.", 'chicken', 'chicken'),
 ("달걀찜",          [("egg_steamed",150)],  "달걀에 물이나 육수를 같은 양 넣어 약불에서 찝니다.", 'egg', 'egg'),
 ("소고기 안심구이",  [("beef_tenderloin",80),("olive_oil",2)],"보이는 기름을 떼고 약불에 구워 작게 썹니다.", 'redmeat', 'beef'),
 ("가자미구이",      [("flatfish",100),("olive_oil",3)],"기름을 조금만 두른 팬에 약불로 앞뒤를 익힙니다. 껍질은 빼고 먹습니다.", 'fish', 'fish'),
 ("두부조림",        [("tofu",120)],         "간장과 물로 맵지 않게 조립니다. 고춧가루는 넣지 않습니다.", 'tofu', 'tofu'),
 ("새우볶음",        [("shrimp",80),("olive_oil",3)],"껍질과 내장을 빼고 기름을 조금만 넣어 볶습니다. 고춧가루는 넣지 않습니다.", 'shell', 'shell'),
 ("연어 간장조림",   [("salmon",90)],        "간장과 물을 조금 넣어 약불에 조립니다. 튀기듯 굽지 않습니다.", 'salmon', 'fish'),
 ("동태살찜",        [("pollack",100)],      "동태살에 소금을 조금 뿌려 찜기에서 찝니다. 가시는 빼고 먹습니다.", 'fish', 'fish'),
 ("닭안심 간장조림",  [("chicken_breast",100)],"간장과 물로 맵지 않게 조립니다.", 'chicken', 'chicken'),
 ("연두부 달걀찜",    [("silken_tofu",100),("egg_steamed",80)],"연두부를 으깨 달걀물과 섞어 찝니다.", 'egg', 'egg'),
 ("돼지 안심 간장구이",[("pork_tenderloin",90),("olive_oil",2)],"간장과 물로 밑간해 기름을 조금만 두르고 굽습니다.", 'redmeat', 'pork'),
 ("조기구이",        [("croaker",90),("olive_oil",3)],"기름을 조금만 두른 팬에 굽습니다. 가시와 껍질은 빼고 먹습니다.", 'fish', 'fish'),
 ("오리 살코기 구이", [("duck_lean",90)],     "껍질과 기름을 떼고 굽습니다.", 'duck', 'poultry'),
 ("게살 달걀찜",     [("crab",40),("egg_steamed",120)],"게살을 잘게 찢어 달걀물에 넣고 찝니다.", 'shell', 'egg'),
 ("광어구이",        [("halibut",90),("olive_oil",3)],"기름을 조금만 두른 팬에 굽습니다. 껍질은 빼고 먹습니다.", 'fish', 'fish'),
 ("소고기 수육",     [("beef_suyuk",80)],    "기름 적은 부위를 푹 삶아 얇게 썹니다.", 'redmeat', 'beef'),
 ("두부부침",        [("pan_tofu",100)],     "기름을 조금만 두르고 앞뒤로 부칩니다.", 'tofu', 'tofu'),
 ("우럭찜",          [("rockfish",100)],     "찜기에서 15분 정도 찝니다. 껍질과 가시는 빼고 먹습니다.", 'fish', 'fish'),
 ("계란말이",        [("rolled_omelet",100)],"기름을 키친타월로 얇게 바르고 맙니다. 파는 빼거나 조금만 넣습니다.", 'egg', 'egg'),
 ("돼지 앞다리 수육", [("pork_shoulder",80)], "보이는 기름을 떼고 푹 삶아 얇게 썹니다.", 'redmeat', 'pork'),
 ("꽃게찜",          [("blue_crab",120)],    "찜기에서 15~20분 쪄서 살만 발라 먹습니다.", 'shell', 'shell'),
 ("갈치구이",        [("hairtail",80)],      "기름 없이 굽고 가시와 껍질은 빼고 먹습니다.", 'fish', 'fish'),
 ("소불고기",        [("bulgogi",120)],      "기름 적은 부위로, 설탕은 줄이고 맵지 않게 볶습니다.", 'redmeat', 'beef'),
 # 이행식·관해기부터(앱이 단계에 맞지 않으면 자동으로 뺌)
 ("고등어구이",      [("mackerel",90)],      "기름 없이 오븐이나 팬에 굽고 껍질·가시는 뺍니다.", 'oily', 'fish'),
 ("삼치구이",        [("spanish_mackerel",90)],"기름 없이 오븐이나 팬에 굽고 껍질·가시는 뺍니다.", 'oily', 'fish'),
 ("꽁치구이",        [("saury",80)],         "기름 없이 굽고 껍질·가시는 뺍니다.", 'oily', 'fish'),
 ("닭다리살 구이",    [("chicken_thigh",100)],"껍질과 기름을 떼고 굽습니다.", 'chicken', 'chicken'),
 ("토마토 달걀볶음",  [("scrambled_egg",80),("tomato",80),("olive_oil",3)],"토마토는 껍질·씨를 빼고 익혀 달걀과 함께 볶습니다.", 'egg', 'egg'),
]

# 채소 반찬(한 끼 1가지)
VEG = [
 ("애호박나물",   [("zucchini",70),("sesame_oil",2)],   "껍질을 벗겨 채 썰고 물을 조금 넣어 무르게 볶습니다.", 'veg'),
 ("시금치나물",   [("spinach",70),("sesame_oil",2)],    "데쳐서 잘게 썰고 참기름을 조금 넣어 무칩니다.", 'veg'),
 ("무나물",       [("radish",70),("perilla_oil",2)],    "채 썬 무를 물을 조금 넣어 무르게 익힙니다.", 'veg'),
 ("가지찜",       [("eggplant",70)],                    "껍질을 벗겨 쪄서 간장을 조금 넣어 무칩니다.", 'veg'),
 ("단호박찜",     [("pumpkin",70)],                     "껍질을 벗겨 찐 뒤 으깹니다.", 'veg'),
 ("배추나물",     [("napa",70),("sesame_oil",2)],       "배추 속잎을 데쳐 잘게 썰어 무칩니다.", 'veg'),
 ("오이볶음",     [("cucumber",70),("perilla_oil",2)],  "껍질·씨를 빼고 얇게 썰어 살짝 볶습니다.", 'veg'),
 ("늙은호박찜",   [("old_pumpkin",70)],                 "껍질·씨를 빼고 찝니다.", 'veg'),
 ("양송이볶음",   [("button_mushroom",50),("olive_oil",2)],"얇게 썰어 기름을 조금만 넣고 볶습니다.", 'veg'),
 ("양상추 샐러드",[("salad",60),("olive_oil",3)],        "잘 씻어 먹기 좋게 썰고 올리브유를 조금 뿌립니다.", 'veg'),
 ("당근볶음",     [("carrot",60),("perilla_oil",2)],    "채 썰어 물을 조금 넣고 무르게 익힙니다.", 'veg2'),
 ("청경채볶음",   [("bok_choy",70),("olive_oil",2)],    "데친 뒤 잘게 썰어 살짝 볶습니다.", 'veg2'),
 ("양배추찜",     [("cabbage",70)],                     "쪄서 부드럽게 합니다.", 'veg2'),
 ("콩나물무침",   [("beansprout_muchim",70)],           "푹 삶아 잘게 썰어 무칩니다. 고춧가루는 넣지 않습니다.", 'veg2'),
 ("숙주나물",     [("mung_namul",70)],                  "데쳐서 잘게 썰어 무칩니다.", 'veg2'),
 ("브로콜리 데침",[("broccoli",60)],                    "꽃송이만 푹 데칩니다.", 'veg2'),
 ("버섯볶음",     [("mushroom_stirfry",60)],            "잘게 썰어 볶습니다.", 'veg2'),
 ("고사리나물",   [("gosari_namul",60)],                "푹 삶아 부드럽게 볶습니다.", 'veg2'),
]

# 국(채소 재료가 든 국은 채소 반찬으로 셈)
SOUP = [
 ("계란국",     [("egg_soup",250)],                          "맑은 육수에 달걀을 풀어 끓입니다.", 'egg', False),
 ("북엇국",     [("bugeo_guk",250)],                         "북어를 불려 맑게 끓입니다.", 'fish', False),
 ("감자국",     [("potato_soup",250)],                       "감자를 얇게 썰어 맑게 끓입니다.", None, False),
 ("사골국",     [("bone_broth",250)],                        "기름을 걷어 내고 데웁니다.", 'beef', False),
 ("소고기무국", [("beef",30),("radish",35),("broth",250)],    "살코기와 무를 맑게 끓이고 기름을 걷습니다.", 'beef', True),
 ("두부계란국", [("tofu",50),("egg_boiled",30),("broth",250)],"두부와 달걀을 넣어 맑게 끓입니다.", 'tofu', False),
 ("미역국",     [("miyeok_guk",250)],                        "미역을 잘게 썰어 푹 끓입니다.", None, False),
 ("콩나물국",   [("beansprout_soup",250)],                   "맑게 끓이고 고춧가루는 넣지 않습니다.", None, False),
 ("굴국",       [("oyster",50),("broth",250)],               "굴을 씻어 맑은 국물에 넣고 완전히 익힙니다.", 'shell', False),
]

# 밥(흰쌀밥 위주, 잡곡은 이행식·관해기부터)
STAPLE = [
 ("흰쌀밥", [("white_rice",200)], ""),
 ("흰쌀밥", [("white_rice",200)], ""),
 ("찹쌀밥", [("glutinous_rice",180)], ""),
 ("흰쌀밥", [("white_rice",200)], ""),
 ("보리밥", [("barley_rice",180)], "불린 보리를 섞어 부드럽게 짓습니다."),
 ("흰쌀밥", [("white_rice",200)], ""),
 ("흑미밥", [("black_rice",200)], "흰쌀에 흑미를 조금 섞어 짓습니다."),
 ("흰쌀밥", [("white_rice",200)], ""),
 ("현미밥", [("brown_rice",180)], "현미를 충분히 불려 부드럽게 짓습니다."),
 ("흰쌀밥", [("white_rice",200)], ""),
 ("잡곡밥", [("mixed_grain_rice",200)], "잡곡을 불려 부드럽게 짓습니다."),
]
GRAIN_NOTE = {'보리밥','흑미밥','현미밥','잡곡밥'}

KIMCHI = [("백김치", [("baek_kimchi",40)]), ("나박김치", [("nabak_kimchi",40)]), ("동치미", [("dongchimi",40)])]

# 한 그릇 음식(점심·저녁): (이름, 식품, 조리법, 설명 키, hi, 레시피 구성 요소)
ONEDISH = [
 ("잔치국수·달걀지단",      [("janchi_guksu",450),("egg_boiled",50)], ["면은 푹 삶고 고명은 달걀지단만 올립니다."], ['noodle','egg'], 3, ['잔치국수']),
 ("칼국수·삶은 달걀",       [("kalguksu",450),("egg_boiled",50)], ["면을 푹 익히고 김가루·고추 양념은 뺍니다."], ['noodle','egg'], 3, ['칼국수']),
 ("우동·삶은 달걀",         [("udon",450),("egg_boiled",50)], ["튀김 고명은 빼고 면을 푹 익힙니다."], ['noodle','egg'], 3, ['우동']),
 ("소고기 쌀국수",          [("rice_noodle_soup",450),("beef",60)], ["생숙주·고수는 빼고 소고기는 기름을 뗍니다."], ['noodle','redmeat'], 3, ['소고기 쌀국수']),
 ("수제비·삶은 달걀",       [("sujebi",400),("egg_boiled",50)], ["반죽을 얇게 떼어 푹 끓이고 감자·애호박만 넣습니다."], ['noodle','egg'], 3, ['수제비']),
 ("닭가슴살 소면",          [("somen",200),("chicken_breast",70),("broth",300)], ["삶은 소면에 맑은 육수를 붓고 찢은 닭가슴살을 올립니다."], ['noodle','chicken'], 3, ['닭가슴살 데침']),
 ("설렁탕·흰쌀밥",          [("seolleongtang",450),("white_rice",200)], ["국물 위 기름을 걷고, 파·후추는 조금만 넣습니다."], ['broth','redmeat'], 3, []),
 ("곰탕·흰쌀밥",            [("gomtang",450),("white_rice",200)], ["국물 위 기름을 걷고 살코기 위주로 먹습니다."], ['broth','redmeat'], 3, []),
 ("흰쌀밥·사골국·두부부침", [("bone_broth",300),("white_rice",180),("pan_tofu",80)], ["사골국은 기름을 걷고, 두부는 기름을 조금만 둘러 부칩니다."], ['broth','tofu'], 3, ['두부부침']),
 ("흰쌀밥·대구살 무국",     [("white_rice",200),("white_fish",90),("radish",35),("broth",250)], ["대구살과 무를 맑게 끓입니다."], ['fish','soup'], 3, []),
 ("닭가슴살 덮밥",          [("white_rice",200),("chicken_breast",90),("onion",30),("olive_oil",3)], ["양파는 푹 익히고 간장 소스로 맵지 않게 조려 밥에 얹습니다."], ['chicken','veg'], 3, ['닭안심 간장조림']),
 ("두부 간장덮밥",          [("white_rice",200),("tofu",100),("zucchini",35),("olive_oil",3)], ["두부와 껍질 벗긴 애호박을 간장·물로 조려 밥에 얹습니다."], ['tofu','veg'], 3, ['두부조림']),
 ("새우 달걀덮밥",          [("white_rice",200),("shrimp",60),("egg_boiled",50),("olive_oil",3)], ["새우를 볶다가 달걀을 풀어 부드럽게 익혀 밥에 얹습니다."], ['shell','egg'], 3, ['새우볶음']),
 ("소불고기 덮밥",          [("white_rice",200),("bulgogi",100)], ["기름 적은 부위로 설탕을 줄여 볶아 밥에 얹습니다."], ['redmeat'], 3, ['소불고기']),
 ("참치죽",                 [("tuna_porridge",400)], ["기름 뺀 참치를 넣어 푹 끓입니다."], ['porridge'], 2, []),
 ("채소죽·달걀찜",          [("veg_porridge",350),("egg_steamed",100)], ["채소는 잘게 다져 푹 끓이고, 달걀찜은 약불에 찝니다."], ['porridge','egg'], 2, ['달걀찜']),
 ("닭죽·연두부",            [("chicken_porridge",450),("silken_tofu",120),("sesame_oil",3)], ["닭은 껍질을 벗기고, 연두부는 데워 곁들입니다."], ['porridge','tofu'], 2, ['닭죽']),
 # 이행식부터
 ("떡국",                   [("tteokguk",450)], ["떡은 푹 익히고 고명은 달걀지단만 올립니다."], ['onebowl','ricecake2'], 3, ['떡국']),
 ("만둣국·흰쌀밥 반 공기",  [("mandu_guk",550),("white_rice",100)], ["만두는 푹 익힙니다. 속의 채소·고기를 확인합니다."], ['onebowl'], 3, ['만둣국']),
 ("찐만두·북엇국",          [("steamed_mandu",250),("bugeo_guk",250)], ["만두는 기름 없이 찌고, 북엇국은 맑게 끓입니다."], ['onebowl','soup'], 3, ['북엇국']),
 ("메밀온면·삶은 달걀",     [("soba",450),("egg_boiled",50)], ["면을 푹 삶아 따뜻한 국물에 맙니다."], ['onebowl','egg'], 3, ['메밀온면']),
 ("토마토 스파게티",        [("spaghetti_tomato",300)], ["소스의 양파·마늘은 조금만 넣고 면을 푹 삶습니다."], ['onebowl'], 3, []),
 ("순한 카레라이스",        [("curry_rice",350)], ["매운맛 없는 카레로 채소는 잘게 썰어 푹 익힙니다."], ['onebowl'], 3, ['순한 카레라이스']),
 ("오므라이스",             [("omurice",350)], ["볶음밥의 채소는 잘게 다지고 기름은 조금만 씁니다.", "햄·소시지는 넣지 않습니다(넣으면 절대 금지)."], ['onebowl','egg'], 3, ['오므라이스']),
 ("채소 볶음밥·계란국",     [("veg_fried_rice",300),("egg_soup",200)], ["채소는 잘게 다지고 기름은 조금만 씁니다.", "햄·소시지는 넣지 않습니다(넣으면 절대 금지)."], ['onebowl','soup'], 3, ['채소 볶음밥','계란국']),
 ("전복죽·달걀찜",          [("abalone_porridge",400),("egg_steamed",100)], ["전복은 잘게 썰어 푹 끓이고, 달걀찜은 약불에 찝니다."], ['porridge','oyster','egg'], 2, ['달걀찜']),
 ("삼계탕",                 [("samgyetang",500)], ["껍질을 벗기고 국물 위 기름을 걷습니다."], ['broth','chicken'], 3, ['삼계탕']),
 ("갈비탕·흰쌀밥",          [("galbitang",400),("white_rice",150)], ["국물 위 기름을 걷고 살코기 위주로 먹습니다."], ['broth','redmeat'], 3, []),
 ("굴국밥",                 [("oyster",60),("broth",300),("white_rice",200),("sesame_oil",3)], ["굴을 씻어 맑은 국물에 넣고 완전히 익힙니다."], ['oyster','soup'], 3, ['굴국밥']),
 ("흰쌀밥·고등어 무조림",   [("white_rice",200),("mackerel",90),("radish",40)], ["고춧가루 없이 간장·물로 조립니다."], ['oily','veg2'], 3, ['고등어 무조림']),
 ("현미밥·연어구이",        [("brown_rice",180),("salmon",90),("olive_oil",3)], ["연어는 기름 없이 굽고 현미는 충분히 불려 짓습니다."], ['salmon','grain'], 3, ['연어구이','현미밥']),
]

# 지중해식(관해기에 먼저 고름): 통곡물 밥 + 생선·콩류·두부·살코기 + 채소 두 가지 + 올리브유
_OV = "올리브유를 조금 둘러 익힙니다."
MED_LD = [
 ("현미밥·고등어구이·시금치나물·토마토 올리브유 볶음", [("brown_rice",180),("mackerel",90),("spinach",70),("tomato",80),("olive_oil",5)],
  ["고등어구이: 기름 없이 오븐이나 팬에 굽고 껍질·가시는 뺍니다.","시금치나물: 데쳐서 잘게 썰어 무칩니다.","토마토 올리브유 볶음: 껍질·씨를 빼고 "+_OV], ['oily','med','fiber'], ['고등어구이','시금치나물','현미밥']),
 ("잡곡밥·연어구이·브로콜리 데침·양배추찜", [("mixed_grain_rice",200),("salmon",90),("broccoli",60),("cabbage",70),("olive_oil",3)],
  ["연어구이: 기름 없이 굽습니다.","브로콜리 데침: 꽃송이만 푹 데칩니다.","양배추찜: 쪄서 부드럽게 합니다."], ['salmon','med','fiber'], ['연어구이','브로콜리 데침','양배추찜']),
 ("보리밥·두부조림·가지찜·당근볶음", [("barley_rice",180),("tofu",120),("eggplant",70),("carrot",60),("perilla_oil",2)],
  ["두부조림: 간장과 물로 맵지 않게 조립니다.","가지찜: 껍질을 벗겨 쪄서 간장을 조금 넣어 무칩니다.","당근볶음: 채 썰어 물을 조금 넣고 무르게 익힙니다."], ['tofu','med','fiber'], ['두부조림','가지찜','당근볶음']),
 ("현미밥·닭가슴살 데침·렌틸콩 토마토 수프·양상추 샐러드", [("brown_rice",150),("chicken_breast",80),("lentil",45),("tomato",80),("salad",60),("olive_oil",5)],
  ["닭가슴살 데침: 끓는 물에 10~15분 삶아 결대로 찢습니다.","렌틸콩 토마토 수프: 불린 렌틸콩을 껍질 벗긴 토마토와 푹 끓여 곱게 갑니다.","양상추 샐러드: 잘 씻어 썰고 올리브유를 조금 뿌립니다."], ['chicken','legume','med','fiber'], ['닭가슴살 데침','현미밥']),
 ("잡곡밥·삼치구이·청경채볶음·단호박찜", [("mixed_grain_rice",200),("spanish_mackerel",90),("bok_choy",70),("pumpkin",70),("olive_oil",3)],
  ["삼치구이: 기름 없이 오븐이나 팬에 굽고 껍질·가시는 뺍니다.","청경채볶음: 데친 뒤 잘게 썰어 살짝 볶습니다.","단호박찜: 껍질을 벗겨 찐 뒤 으깹니다."], ['oily','med','fiber'], ['삼치구이','청경채볶음','단호박찜']),
 ("보리밥·달걀찜·병아리콩 샐러드·애호박나물", [("barley_rice",180),("egg_steamed",100),("hummus",40),("salad",50),("zucchini",70),("olive_oil",5)],
  ["달걀찜: 달걀에 물을 같은 양 넣어 약불에 찝니다.","병아리콩 샐러드: 삶아 곱게 으깬 병아리콩을 양상추에 곁들이고 올리브유를 조금 뿌립니다.","애호박나물: 껍질을 벗겨 무르게 볶습니다."], ['egg','legume','med','fiber'], ['달걀찜','애호박나물']),
 ("현미밥·꽁치구이·무나물·시금치나물", [("brown_rice",180),("saury",80),("radish",70),("spinach",70),("perilla_oil",2)],
  ["꽁치구이: 기름 없이 굽고 껍질·가시는 뺍니다.","무나물: 채 썬 무를 물을 조금 넣어 무르게 익힙니다.","시금치나물: 데쳐서 잘게 썰어 무칩니다."], ['oily','med','fiber'], ['꽁치구이','무나물','시금치나물','현미밥']),
 ("콩밥·소고기무국·브로콜리 데침", [("bean_rice",200),("beef",30),("radish",35),("broth",250),("broccoli",70)],
  ["소고기무국: 살코기와 무를 맑게 끓이고 기름을 걷습니다.","브로콜리 데침: 꽃송이만 푹 데칩니다.","콩밥: 콩을 충분히 불려 부드럽게 짓습니다."], ['legume','redmeat','med','fiber'], ['소고기무국','브로콜리 데침']),
 ("잡곡밥·두부부침·토마토 달걀볶음·양배추찜", [("mixed_grain_rice",200),("pan_tofu",100),("scrambled_egg",60),("tomato",60),("cabbage",70),("olive_oil",3)],
  ["두부부침: 기름을 조금만 두르고 부칩니다.","토마토 달걀볶음: 토마토는 껍질·씨를 빼고 익혀 달걀과 함께 볶습니다.","양배추찜: 쪄서 부드럽게 합니다."], ['tofu','egg','med','fiber'], ['두부부침','토마토 달걀볶음','양배추찜']),
 ("현미밥·닭다리살 구이·당근볶음·양상추 샐러드", [("brown_rice",180),("chicken_thigh",100),("carrot",60),("salad",60),("olive_oil",5)],
  ["닭다리살 구이: 껍질과 기름을 떼고 굽습니다.","당근볶음: 채 썰어 물을 조금 넣고 무르게 익힙니다.","양상추 샐러드: 잘 씻어 썰고 올리브유를 조금 뿌립니다."], ['chicken','med','fiber'], ['닭다리살 구이','당근볶음','현미밥']),
 ("보리밥·고등어 무조림·시금치나물", [("barley_rice",180),("mackerel",90),("radish",40),("spinach",70)],
  ["고등어 무조림: 고춧가루 없이 간장·물로 조립니다.","시금치나물: 데쳐서 잘게 썰어 무칩니다."], ['oily','med','fiber'], ['고등어 무조림','시금치나물']),
 ("현미밥·연어 간장조림·가지찜·오이볶음", [("brown_rice",180),("salmon",90),("eggplant",70),("cucumber",70),("perilla_oil",2)],
  ["연어 간장조림: 간장과 물을 조금 넣어 약불에 조립니다.","가지찜: 껍질을 벗겨 쪄서 무칩니다.","오이볶음: 껍질·씨를 빼고 얇게 썰어 살짝 볶습니다."], ['salmon','med','fiber'], ['연어 간장조림','가지찜','오이볶음','현미밥']),
 ("잡곡밥·새우볶음·브로콜리 데침·애호박나물", [("mixed_grain_rice",200),("shrimp",80),("broccoli",60),("zucchini",70),("olive_oil",5)],
  ["새우볶음: 껍질과 내장을 빼고 기름을 조금만 넣어 볶습니다.","브로콜리 데침: 꽃송이만 푹 데칩니다.","애호박나물: 껍질을 벗겨 무르게 볶습니다."], ['shell','med','fiber'], ['새우볶음','브로콜리 데침','애호박나물']),
 ("보리밥·가자미구이·배추나물·단호박찜", [("barley_rice",180),("flatfish",100),("napa",70),("pumpkin",70),("olive_oil",3)],
  ["가자미구이: 기름을 조금만 두른 팬에 약불로 익힙니다.","배추나물: 배추 속잎을 데쳐 잘게 썰어 무칩니다.","단호박찜: 껍질을 벗겨 찐 뒤 으깹니다."], ['fish','med','fiber'], ['가자미구이','배추나물','단호박찜']),
 ("잡곡밥·닭가슴살 데침·렌틸콩 샐러드·양배추찜", [("mixed_grain_rice",200),("chicken_breast",90),("lentil",45),("salad",50),("cabbage",70),("olive_oil",5)],
  ["닭가슴살 데침: 끓는 물에 삶아 결대로 찢습니다.","렌틸콩 샐러드: 푹 삶은 렌틸콩을 양상추에 곁들이고 올리브유를 조금 뿌립니다.","양배추찜: 쪄서 부드럽게 합니다."], ['chicken','legume','med','fiber'], ['닭가슴살 데침','양배추찜']),
 ("현미밥·삼치구이·가지찜·토마토 올리브유 볶음", [("brown_rice",180),("spanish_mackerel",90),("eggplant",70),("tomato",80),("olive_oil",5)],
  ["삼치구이: 기름 없이 굽고 껍질·가시는 뺍니다.","가지찜: 껍질을 벗겨 쪄서 무칩니다.","토마토 올리브유 볶음: 껍질·씨를 빼고 "+_OV], ['oily','med','fiber'], ['삼치구이','가지찜','현미밥']),
 ("보리밥·오리 살코기 구이·브로콜리 데침·무나물", [("barley_rice",180),("duck_lean",90),("broccoli",60),("radish",70)],
  ["오리 살코기 구이: 껍질과 기름을 떼고 굽습니다.","브로콜리 데침: 꽃송이만 푹 데칩니다.","무나물: 채 썬 무를 무르게 익힙니다."], ['duck','med','fiber'], ['오리 살코기 구이','브로콜리 데침','무나물']),
 ("잡곡밥·조기구이·시금치나물·당근볶음", [("mixed_grain_rice",200),("croaker",90),("spinach",70),("carrot",60),("olive_oil",3)],
  ["조기구이: 기름을 조금만 두른 팬에 구워 가시와 껍질을 뺍니다.","시금치나물: 데쳐서 잘게 썰어 무칩니다.","당근볶음: 채 썰어 무르게 익힙니다."], ['fish','med','fiber'], ['조기구이','시금치나물','당근볶음']),
]
MED_B = [
 ("우유 오트밀죽·블루베리·호두", [("oatmeal",35),("milk",200),("blueberry",50),("nuts",10)],
  ["우유 오트밀죽: 귀리를 우유에 곱게 푹 끓입니다.","블루베리·호두: 블루베리는 씻어 곁들이고 호두는 잘게 부숴 조금만 올립니다."], ['oat','nuts','med'], ['우유 오트밀죽']),
 ("오트밀 두유죽·바나나·아몬드", [("oatmeal",35),("soy_milk",190),("banana",50),("almond",10)],
  ["오트밀 두유죽: 귀리를 두유에 곱게 푹 끓입니다.","바나나·아몬드: 바나나는 반 개, 아몬드는 잘게 부숴 조금만 올립니다."], ['oat','soymilk','nuts','med'], []),
 ("그릭요거트·키위·오트밀", [("greek_yogurt",150),("kiwi",80),("oatmeal",25)],
  ["오트밀: 우유나 물에 불리거나 끓여 부드럽게 합니다.","키위: 껍질을 벗겨 썹니다."], ['dairy','oat','med'], []),
 ("삶은 달걀·찐 고구마·토마토·락토프리 우유", [("egg_boiled",100),("sweet_potato",75),("tomato",100),("lf_milk",200)],
  ["삶은 달걀: 완숙으로 두 개 삶습니다.","찐 고구마: 껍질을 벗겨 찝니다.","토마토: 껍질을 벗겨 먹기 좋게 썹니다."], ['egg','tuber','med'], []),
 ("현미밥·계란국·시금치나물·두부부침", [("brown_rice",150),("egg_soup",200),("spinach",60),("pan_tofu",60)],
  ["계란국: 맑은 육수에 달걀을 풀어 끓입니다.","시금치나물: 데쳐서 잘게 썰어 무칩니다.","두부부침: 기름을 조금만 두르고 부칩니다."], ['egg','tofu','med','fiber'], ['계란국','시금치나물','두부부침','현미밥']),
 ("잡곡밥·연두부·애호박나물·삶은 달걀", [("mixed_grain_rice",150),("silken_tofu",100),("zucchini",60),("egg_boiled",50)],
  ["연두부: 데워 간장을 조금만 곁들입니다.","애호박나물: 껍질을 벗겨 무르게 볶습니다.","삶은 달걀: 완숙으로 삶습니다."], ['tofu','egg','med','fiber'], ['애호박나물']),
]
MED_S = [
 ("사과 반 개·호두 두 알",   [("apple",100),("nuts",8)], 'nuts'),
 ("키위·플레인 요거트",      [("kiwi",80),("yogurt_plain_unsw",100)], 'fruit2'),
 ("블루베리·그릭요거트",     [("blueberry",60),("greek_yogurt",100)], 'fruit2'),
 ("오렌지 반 개",            [("orange",100)], 'fruit2'),
 ("바나나·아몬드 열 알",     [("banana",50),("almond",12)], 'nuts'),
]

# 아침
PORRIDGE = [
 ("흰죽",   [("rice_porridge",400),("sesame_oil",3)], "쌀을 불려 물을 넉넉히 넣고 푹 끓입니다. 참기름은 조금만 넣습니다."),
 ("채소죽", [("veg_porridge",400),("sesame_oil",3)],  "채소는 잘게 다져 푹 끓입니다."),
 ("참치죽", [("tuna_porridge",400)], "기름 뺀 참치를 넣어 푹 끓입니다."),
 ("호박죽", [("pumpkin_porridge",400)], "껍질 벗긴 단호박을 쪄서 곱게 갈아 끓입니다."),
 ("닭죽",   [("chicken_porridge",400),("sesame_oil",3)], "닭은 껍질을 벗기고 살만 찢어 넣습니다."),
 ("누룽지", [("nurungji",50)],       "누룽지에 물을 넉넉히 붓고 푹 퍼지게 끓입니다."),
 ("전복죽", [("abalone_porridge",400)], "전복은 잘게 썰어 푹 끓입니다."),
]
SOFT = [
 ("달걀찜",         [("egg_steamed",120)], "egg", 'egg'),
 ("연두부",         [("silken_tofu",120)], "tofu", 'tofu'),
 ("대구살찜",       [("white_fish",80)], "fish", 'fish'),
 ("소고기 장조림",  [("jangjorim_beef",40)], "beef", 'redmeat'),
 ("메추리알 장조림",[("jangjorim_quail",40)], "egg", 'egg'),
 ("게살",           [("crab",50)], "shell", 'shell'),
 ("두부조림",       [("tofu",80)], "tofu", 'tofu'),
 ("소고기 수육",    [("beef_suyuk",60)], "beef", 'redmeat'),
 ("닭가슴살 무침",  [("chicken_breast",60)], "chicken", 'chicken'),
 ("새우살",         [("shrimp",60)], "shell", 'shell'),
]
SOFT_COOK = {"달걀찜":"달걀에 물을 같은 양 넣어 약불에 찝니다.","연두부":"연두부는 데워 간장을 조금만 곁들입니다.","대구살찜":"대구살은 찜기에서 쪄 가시를 뺍니다.",
 "소고기 장조림":"장조림은 짜니 조금만 먹습니다.","메추리알 장조림":"장조림은 짜니 조금만 먹습니다.","게살":"게살은 잘게 찢어 죽에 얹습니다.","두부조림":"간장과 물로 맵지 않게 조립니다.",
 "소고기 수육":"기름 적은 부위를 푹 삶아 얇게 썹니다.","닭가슴살 무침":"삶은 닭가슴살을 잘게 찢어 참기름을 조금 넣어 무칩니다.","새우살":"새우는 껍질과 내장을 빼고 데칩니다."}

BREAD = [
 ("식빵",   [("white_bread",70)]),
 ("모닝빵", [("dinner_roll",60)]),
 ("카스텔라", [("castella",50)]),
]
BREAD_EGG = [("스크램블드에그",[("scrambled_egg",80)],"기름을 조금만 두르고 약불에 부드럽게 익힙니다."),("삶은 달걀",[("egg_boiled",50)],"완숙으로 삶습니다."),("계란말이",[("rolled_omelet",60)],"기름을 키친타월로 얇게 바르고 맙니다.")]
BREAD_DRINK = [("락토프리 우유",[("lf_milk",200)],'dairy'),("우유",[("milk",200)],'dairy'),("두유",[("soy_milk",190)],'soymilk'),
               ("플레인 요거트",[("yogurt_plain_unsw",100)],'dairy'),("그릭요거트",[("greek_yogurt",100)],'dairy')]
RICE_B_SOUP = ["계란국","북엇국","감자국","사골국","두부계란국","미역국","콩나물국"]
RICE_B_SIDE = [("계란말이",[("rolled_omelet",60)],'egg',"기름을 키친타월로 얇게 바르고 맙니다."),("두부부침",[("pan_tofu",80)],'tofu',"기름을 조금만 두르고 부칩니다."),
               ("조기구이",[("croaker",60)],'fish',"기름을 조금만 두른 팬에 구워 가시를 뺍니다."),("메추리알 장조림",[("jangjorim_quail",40)],'egg',"짜니 조금만 먹습니다."),
               ("소고기 장조림",[("jangjorim_beef",40)],'redmeat',"짜니 조금만 먹습니다."),("대구살찜",[("white_fish",60)],'fish',"찜기에서 쪄 가시를 뺍니다."),
               ("달걀찜",[("egg_steamed",100)],'egg',"달걀에 물을 같은 양 넣어 약불에 찝니다."),("가자미구이",[("flatfish",70)],'fish',"기름을 조금만 두른 팬에 구워 껍질을 뺍니다.")]
OTHER_B = [
 ("삶은 감자·삶은 달걀·락토프리 우유",       [("potato",150),("egg_boiled",50),("lf_milk",200)], ["감자는 껍질을 벗겨 푹 삶습니다."], ['potato','egg'], 3, []),
 ("삶은 감자·메추리알·두유",                 [("potato",150),("soy_milk",190),("quail_egg",40)], ["감자는 껍질을 벗겨 푹 삶습니다."], ['potato','soymilk'], 3, []),
 ("감자볶음·스크램블드에그·락토프리 우유",   [("potato_stirfry",100),("scrambled_egg",80),("lf_milk",200)], ["감자는 채 썰어 물을 조금 넣어 무르게 볶습니다."], ['potato','egg'], 3, ['스크램블드에그']),
 ("백설기·삶은 달걀·두유",                   [("rice_cake",50),("soy_milk",190),("egg_boiled",50)], ["백설기는 데워 부드럽게 먹습니다."], ['ricecake','egg'], 3, []),
 ("쌀국수",                                  [("rice_noodle_soup",400)], ["생숙주·고수는 빼고 먹습니다."], ['noodle'], 3, ['소고기 쌀국수']),
 ("잔치국수",                                [("janchi_guksu",400)], ["면은 푹 삶고 고명은 달걀지단만 올립니다."], ['noodle'], 3, ['잔치국수']),
 ("찐 고구마·삶은 달걀·우유",                [("sweet_potato",130),("egg_boiled",50),("milk",200)], ["고구마는 껍질을 벗겨 찝니다."], ['tuber','egg'], 3, []),
 ("우유 오트밀죽·삶은 달걀",                 [("oatmeal",35),("milk",200),("egg_boiled",50)], ["귀리를 우유에 곱게 푹 끓입니다."], ['oat','egg'], 3, ['우유 오트밀죽']),
 ("오트밀·그릭요거트",                       [("oatmeal",35),("greek_yogurt",100),("lf_milk",150)], ["귀리를 우유에 곱게 푹 끓여 요거트를 곁들입니다."], ['oat','dairy'], 3, ['우유 오트밀죽']),
 ("떡국",                                    [("tteokguk",350)], ["떡은 푹 익히고 고명은 달걀지단만 올립니다."], ['onebowl','ricecake2'], 3, ['떡국']),
 ("찐만두·두유",                             [("steamed_mandu",150),("soy_milk",190)], ["만두는 기름 없이 찝니다."], ['onebowl','soymilk'], 3, []),
 ("주먹밥·계란국·두부부침",                  [("jumeokbap",180),("egg_soup",200),("pan_tofu",80)], ["주먹밥 속은 참치처럼 부드러운 재료로 만들고, 두부는 기름을 조금만 둘러 부칩니다."], ['onebowl','soup','tofu'], 3, ['계란국','두부부침']),
]

# 곁들임(과일·유제품·간식): 끼니마다 한 가지
SNACK = [
 ("잘 익은 바나나 반 개",   [("banana",50)], 'fruit'),
 ("간 사과(껍질 제거)",     [("applesauce",100)], 'fruit'),
 ("복숭아 반 개(껍질 제거)",[("peach",100)], 'fruit'),
 ("사과 반 개(껍질 벗긴)",  [("apple",100)], 'fruit'),
 ("배 1/4개",               [("pear",100)], 'fruit'),
 ("포도 한 줌(껍질·씨 빼기)",[("grape",80)], 'fruit'),
 ("수박 한 쪽",             [("watermelon",150)], 'fruit'),
 ("황도 통조림",            [("canned_peach",100)], 'fruit'),
 ("한라봉 반 개",           [("hallabong",120)], 'fruit'),
 ("락토프리 우유 한 컵",    [("lf_milk",200)], 'dairy'),
 ("우유 한 컵",             [("milk",200)], 'dairy'),
 ("플레인 요거트",          [("yogurt_plain_unsw",100)], 'dairy'),
 ("그릭요거트",             [("greek_yogurt",100)], 'dairy'),
 ("액상 요구르트",          [("drink_yogurt",150)], 'dairy'),
 ("푸딩",                   [("pudding",100)], 'dairy'),
 ("삶은 달걀 한 개",        [("egg_boiled",50)], 'egg'),
 ("메추리알 다섯 개",       [("quail_egg",50)], 'egg'),
 ("삶은 감자",              [("potato",100)], 'potato'),
 ("카스텔라 한 조각",       [("castella",40)], 'bread'),
 ("검은콩두유 한 팩",       [("black_soy_milk",190)], 'soymilk'),
 ("백설기·두유",          [("rice_cake",40),("soy_milk",190)], 'ricecake'),
 ("바나나·플레인 요거트", [("banana",50),("yogurt_plain_unsw",100)], 'fruit'),
 ("멜론·그릭요거트",      [("melon",80),("greek_yogurt",80)], 'fruit'),
 ("식혜 반 컵",             [("sikhye",100)], 'sweet'),
 # 이행식·관해기부터
 ("참외 한 조각(씨 빼기)",  [("korean_melon",100)], 'fruit2'),
 ("딸기 다섯 알",           [("strawberry",80)], 'fruit2'),
 ("단감 반 개",             [("sweet_persimmon",80)], 'fruit2'),
 ("망고 반 컵",             [("mango",80)], 'fruit2'),
 ("키위 한 개",             [("kiwi",80)], 'fruit2'),
 ("블루베리 한 줌",         [("blueberry",70)], 'fruit2'),
 ("찐 고구마 반 개",        [("sweet_potato",80)], 'tuber'),
 ("삶은 밤 다섯 알",        [("chestnut",40)], 'chestnut'),
 ("절편 두 개",             [("jeolpyeon",50)], 'ricecake2'),
 ("호두 두 알",             [("nuts",10)], 'nuts'),
 ("아몬드 열 알",           [("almond",12)], 'nuts'),
]


EXTRA_VEG = 7    # v1.7.0: 단백질 반찬마다 더하는 채소 반찬 조합 수
EXTRA_SOUP = 3   # v1.7.0: 단백질 반찬마다 더하는 국 조합 수
# 과일과 함께 내는 곁들임(과일 조합용)
SNACK_PAIR = [("플레인 요거트", [("yogurt_plain_unsw",100)], 'dairy'), ("그릭요거트", [("greek_yogurt",100)], 'dairy'),
              ("락토프리 우유", [("lf_milk",200)], 'dairy'), ("두유", [("soy_milk",190)], 'soymilk')]


def _gwa(w):
    """받침이 있으면 '과', 없으면 '와'"""
    ch = w.rstrip(')').rstrip()[-1]
    if '가' <= ch <= '힣':
        return w + ('과' if (ord(ch) - 0xAC00) % 28 else '와')
    return w + '과'


def _note(keys):
    sents, refs = [], []
    for k in keys:
        if not k: continue
        s, r = NOTE[k]
        if s not in sents: sents.append(s)
        for x in r:
            if x not in refs: refs.append(x)
    return ' '.join(sents), refs


def _menu(title, items, cook, keys, hi=3, rec=(), med=False):
    tip, refs = _note(keys)
    ids = [i for i, _ in items]
    assert len(ids) == len(set(ids)), (title, ids)
    for r in rec: assert any(r in v for v in REC.values()), (title, r)
    m = {"title": title, "items": [list(x) for x in items], "cook": [c for c in cook if c], "tip": tip, "refs": refs, "hi": hi, "gen": 1}
    if rec: m["rec"] = list(rec)
    if med: m["med"] = 1
    return m


def _t(*parts):
    """식단표처럼 '·'로 잇기(빈 이름은 빼고, 같은 이름은 한 번만)"""
    out = []
    for p in parts:
        if p and p not in out: out.append(p)
    return '·'.join(out)


def build():
    L, D = [], []
    # 점심·저녁: 밥 + 단백질 + (채소 한 가지 | 국 [+ 물김치류])
    for lane, out, vo, so, sto in (('L', L, 0, 0, 0), ('D', D, 7, 4, 5)):
        vi = vo; si = so; sti = sto; ki = 0
        for pi, (pn, pit, pcook, pkey, pgrp) in enumerate(PROT):
            for var in range(3):
                stn, stit, stcook = STAPLE[sti % len(STAPLE)]; sti += 1
                gkey = 'grain' if stn in GRAIN_NOTE else None
                if var < 2:
                    for _ in range(len(VEG)):
                        vn, vit, vcook, vkey = VEG[vi % len(VEG)]; vi += 1
                        if not any(i == x for i, _ in vit for x, _ in pit):
                            break
                    items = pit + stit + vit
                    cook = [f"{pn}: {pcook}", f"{vn}: {vcook}"] + ([f"{stn}: {stcook}"] if stcook else [])
                    out.append(_menu(_t(stn, pn, vn), items, cook, [pkey, vkey, gkey], rec=recs(pn, vn, stn)))
                else:
                    for _ in range(len(SOUP)):
                        sn, sit, scook, sgrp, sveg = SOUP[si % len(SOUP)]; si += 1
                        if fams(sit) & fams(pit) or ({'beef','pork'} & fams(sit) and {'beef','pork'} & fams(pit)):
                            continue
                        break
                    items = pit + stit + sit
                    kn = ''
                    keys = [pkey, 'soup', gkey]
                    cook = [f"{pn}: {pcook}", f"{sn}: {scook}"] + ([f"{stn}: {stcook}"] if stcook else [])
                    if not sveg and pi % 2 == 0:
                        kn, kit = KIMCHI[ki % len(KIMCHI)]; ki += 1
                        items = items + kit; keys.append('kimchi')
                    out.append(_menu(_t(stn, pn, sn, kn), items, cook, keys, rec=recs(pn, sn, stn)))
        for i, (t, it, ck, keys, hi, rn) in enumerate(ONEDISH):
            if (i % 2 == 0) == (lane == 'L') or i >= len(ONEDISH) - 4:
                out.append(_menu(t, it, ck, keys, 2 if 'porridge' in keys else hi, rec=recs(*rn)))
        for t, it, ck, keys, rn in MED_LD:
            out.append(_menu(t, it, ck, keys, 3, rec=recs(*rn), med=True))
        # v1.7.0: AI 식단 만들기를 뺀 대신 같은 구성 요소의 조합을 늘림(위 메뉴는 그대로 두어 저장된 교체 키가 유지됨).
        # 단백질 반찬마다 채소 반찬 조합 EXTRA_VEG개, 국 조합 EXTRA_SOUP개를 더한다. 규칙은 위와 같다.
        seen = {m['title'] for m in out}
        lo = 0 if lane == 'L' else 9
        for pi, (pn, pit, pcook, pkey, pgrp) in enumerate(PROT):
            added = 0
            for k in range(len(VEG)):
                vn, vit, vcook, vkey = VEG[(pi * 5 + k * 7 + lo) % len(VEG)]
                if any(i == x for i, _ in vit for x, _ in pit):
                    continue
                stn, stit, stcook = STAPLE[(pi * 3 + k + lo) % len(STAPLE)]
                t = _t(stn, pn, vn)
                if t in seen:
                    continue
                gkey = 'grain' if stn in GRAIN_NOTE else None
                cook = [f"{pn}: {pcook}", f"{vn}: {vcook}"] + ([f"{stn}: {stcook}"] if stcook else [])
                out.append(_menu(t, pit + stit + vit, cook, [pkey, vkey, gkey], rec=recs(pn, vn, stn))); seen.add(t)
                added += 1
                if added >= EXTRA_VEG: break
            added = 0
            for k in range(len(SOUP)):
                sn, sit, scook, sgrp, sveg = SOUP[(pi * 4 + k * 2 + lo) % len(SOUP)]
                if fams(sit) & fams(pit) or ({'beef', 'pork'} & fams(sit) and {'beef', 'pork'} & fams(pit)):
                    continue
                stn, stit, stcook = STAPLE[(pi + k * 3 + lo) % len(STAPLE)]
                gkey = 'grain' if stn in GRAIN_NOTE else None
                items = pit + stit + sit; keys = [pkey, 'soup', gkey]; kn = ''
                if not sveg and (pi + k) % 2 == 1:
                    kn, kit = KIMCHI[(pi + k) % len(KIMCHI)]
                    items = items + kit; keys.append('kimchi')
                t = _t(stn, pn, sn, kn)
                if t in seen:
                    continue
                cook = [f"{pn}: {pcook}", f"{sn}: {scook}"] + ([f"{stn}: {stcook}"] if stcook else [])
                out.append(_menu(t, items, cook, keys, rec=recs(pn, sn, stn))); seen.add(t)
                added += 1
                if added >= EXTRA_SOUP: break
    # 아침
    B = []
    soups = {s[0]: s for s in SOUP}
    for pi, (pn, pit, pcook) in enumerate(PORRIDGE):
        for k in range(5):
            q = pi * 3 + k
            while fams(SOFT[q % len(SOFT)][1]) & fams(pit): q += 1
            sn, sit, sgrp, skey = SOFT[q % len(SOFT)]
            m = _menu(_t(pn, sn), pit + sit, [f"{pn}: {pcook}", f"{sn}: {SOFT_COOK[sn]}"], ['porridge', skey], 2, rec=recs(pn, sn))
            if all(x['title'] != m['title'] for x in B): B.append(m)
    for bi, (bn, bit) in enumerate(BREAD):
        for k in range(5):
            en, eit, ecook = BREAD_EGG[(bi + k) % len(BREAD_EGG)]
            dn, dit, dkey = BREAD_DRINK[(bi * 2 + k) % len(BREAD_DRINK)]
            B.append(_menu(_t(bn, en, dn), bit + eit + dit, [f"{bn}: 부드러운 것으로 고르고 버터·잼은 조금만 바릅니다.", f"{en}: {ecook}"], ['bread', 'egg', dkey], 3, rec=recs(en)))
    for k in range(24):
        sn = RICE_B_SOUP[k % len(RICE_B_SOUP)]; s = soups[sn]
        q = k * 3
        while fams(RICE_B_SIDE[q % len(RICE_B_SIDE)][1]) & fams(s[1]): q += 1
        dn, dit, dkey, dcook = RICE_B_SIDE[q % len(RICE_B_SIDE)]
        stn, stit = ("흰쌀밥", [("white_rice", 150)]) if k % 4 else ("찹쌀밥", [("glutinous_rice", 150)])
        t = _t(stn, sn, dn)
        if any(x['title'] == t for x in B): continue
        B.append(_menu(t, stit + s[1] + dit, [f"{sn}: {s[2]}", f"{dn}: {dcook}"], [dkey, 'soup'], 3, rec=recs(sn, dn)))
    for t, it, ck, keys, hi, rn in OTHER_B:
        B.append(_menu(t, it, ck, keys, hi, rec=recs(*rn)))
    # v1.7.0: 아침 조합 늘리기(죽+부드러운 반찬, 빵+달걀+음료, 밥+국+반찬의 나머지 조합). 위 메뉴는 그대로 둔다
    seenB = {m['title'] for m in B}
    for pn, pit, pcook in PORRIDGE:
        for sn, sit, sgrp, skey in SOFT:
            if fams(sit) & fams(pit): continue
            t = _t(pn, sn)
            if t in seenB: continue
            B.append(_menu(t, pit + sit, [f"{pn}: {pcook}", f"{sn}: {SOFT_COOK[sn]}"], ['porridge', skey], 2, rec=recs(pn, sn))); seenB.add(t)
    for bn, bit in BREAD:
        for en, eit, ecook in BREAD_EGG:
            for dn, dit, dkey in BREAD_DRINK:
                t = _t(bn, en, dn)
                if t in seenB: continue
                B.append(_menu(t, bit + eit + dit, [f"{bn}: 부드러운 것으로 고르고 버터·잼은 조금만 바릅니다.", f"{en}: {ecook}"], ['bread', 'egg', dkey], 3, rec=recs(en))); seenB.add(t)
    for stn, stit in (("흰쌀밥", [("white_rice", 150)]), ("찹쌀밥", [("glutinous_rice", 150)])):
        for sn in RICE_B_SOUP:
            s0 = soups[sn]
            for dn, dit, dkey, dcook in RICE_B_SIDE:
                if fams(dit) & fams(s0[1]): continue
                t = _t(stn, sn, dn)
                if t in seenB: continue
                B.append(_menu(t, stit + s0[1] + dit, [f"{sn}: {s0[2]}", f"{dn}: {dcook}"], [dkey, 'soup'], 3, rec=recs(sn, dn))); seenB.add(t)
    for t, it, ck, keys, rn in MED_B:
        B.append(_menu(t, it, ck, keys, 3, rec=recs(*rn), med=True))
    S = []
    for t, it, key in SNACK:
        S.append(_menu(t, it, [], [key], 3))
    for t, it, key in MED_S:
        S.append(_menu(t, it, [], [key, 'med'], 3, med=True))
    # v1.7.0: 과일 한 가지 + 요거트·우유·두유 한 가지 조합(같은 식품이 겹치지 않는 것만)
    seenS = {m['title'] for m in S}
    fruits = [x for x in SNACK if x[2] in ('fruit', 'fruit2') and len(x[1]) == 1]
    for dn, dit, dkey in SNACK_PAIR:
        for fn, fit, fkey in fruits:
            if {i for i, _ in fit} & {i for i, _ in dit}: continue
            t = _t(fn, dn)
            if t in seenS: continue
            S.append(_menu(t, fit + dit, [], [fkey, dkey], 3)); seenS.add(t)
    for lst in (L, D, B, S):
        ts = [m['title'] for m in lst]
        assert len(ts) == len(set(ts)), [t for t in ts if ts.count(t) > 1][:5]
    return {"B": B, "L": L, "D": D, "S": S}


if __name__ == '__main__':
    M = build()
    print({k: len(v) for k, v in M.items()}, 'total', sum(len(v) for v in M.values()))
    for k in 'BLDS':
        for m in M[k][:6]: print(k, m['title'], m['items'])
