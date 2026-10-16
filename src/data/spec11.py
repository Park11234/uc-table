# -*- coding: utf-8 -*-
"""외식에서 흔한 메뉴(v1.10.0, 2026-10-16 추가) — 점검 보고서 개발자 5·사용자 3

외식 판정에서 '순두부찌개·제육덮밥·돼지국밥·연어덮밥'처럼 흔한 메뉴가 앱 음식 목록에 없어
이름의 단어로만 검사되거나(주의), 비슷한 다른 음식으로 잘못 이어지던 것을 고친다.

값: 식약처 음식(D) 자료에서 같은 이름의 행을 쓴다(값 고르는 규칙은 generate_dataset.py와 같음).
식약처 자료에 행이 없는 메뉴(연어덮밥·규동·가츠동·텐동·시저샐러드·햄 토스트)는 영양값 없이(N:-) 판정만 한다.
판정(시작 단계·태그·근거 문장)은 앱에 이미 있는 비슷한 음식과 같은 기준으로 정했다.
  맵고 자극적(spicy) → 3(관해기), 튀김(fried) → 9(피하기), 가공육(processed) → 9, 발색제 가공육(nitrite) → 절대 금지
  날것(raw: 회·육회) → 3, 생채소 → 3, 조개류·질긴 해산물 → 2 이상, 기름진 고기 → 2 이상
알레르기 태그는 식당마다 재료가 달라, 그 메뉴에 흔히 들어가는 재료를 넉넉히 붙였다(알레르기가 있으면 피하기 쪽으로).

튜플: (id, 이름, 분류, 자료, 시작 단계, 태그, 1회량, 별명, 그림, 근거 문장 열쇠, FODMAP, 과일 상한, 먹는 방법, 가격)
"""
import re

EO = [
 # ---- 찌개·국밥·해장국 ----
 ("sundubu_jjigae", "순두부찌개", "요리", "D:순두부찌개_김치", 3, ["spicy", "soy", "wheat", "salty", "egg", "clam", "shrimp", "pork"], [400, "그릇"],
  ["순두부찌개", "해물순두부찌개", "짬뽕순두부", "김치순두부찌개", "얼큰순두부"], "🍲", ["spicy", "tofu_ok", "stew_salty"], None, None, "맵지 않은 하얀 순두부가 되는지 물어보기", 1),
 ("dwaeji_gukbap", "돼지국밥", "요리", "D:국밥_돼지고기", 2, ["pork", "redmeat", "fatty", "salty", "liq"], [600, "그릇"],
  ["돼지국밥", "부산돼지국밥", "수육국밥"], "🥣", ["soup_bone", "meat_fat", "stew_salty"], None, None, "기름 걷고, 다대기·부추무침 빼기", 1),
 ("sogogi_gukbap", "소고기국밥", "요리", "D:국밥_소고기", 3, ["spicy", "beef", "redmeat", "salty", "liq"], [600, "그릇"],
  ["소고기국밥", "쇠고기국밥", "장터국밥"], "🍲", ["spicy", "stew_salty"], None, None, "고춧가루 없는 맑은 국밥이면 설렁탕·곰탕과 비슷", 1),
 ("sundae_gukbap", "순대국밥", "요리", "D:국밥_순대국밥", 9, ["processed", "pork", "redmeat", "salty", "liq"], [600, "그릇"],
  ["순대국밥", "순댓국밥", "순대국", "순댓국"], "🍲", ["processed", "stew_salty"], None, None, "", 1),
 ("gul_gukbap", "굴국밥", "요리", "D:국밥_굴", 2, ["clam", "gil", "salty", "liq"], [600, "그릇"],
  ["굴국밥", "굴밥국"], "🦪", ["oyster", "soup_clear"], None, None, "굴은 완전히 익히기", 1),
 ("seonji_haejangguk", "선지해장국", "요리", "D:해장국_선지", 3, ["spicy", "beef", "redmeat", "gil", "salty", "liq"], [600, "그릇"],
  ["선지해장국", "선짓국", "소피해장국"], "🍲", ["spicy", "dried_veg", "stew_salty"], None, None, "", 1),
 ("ugeoji_haejangguk", "우거지해장국", "요리", "D:해장국_우거지", 3, ["spicy", "soy", "gil", "salty", "liq"], [600, "그릇"],
  ["우거지해장국", "우거지국", "우거지탕"], "🍲", ["spicy", "dried_veg", "stew_salty"], None, None, "", 1),
 ("haemultang", "해물탕", "요리", "D:해물탕", 3, ["spicy", "shrimp", "crab", "clam", "squid", "tough", "liq"], [500, "그릇"],
  ["해물탕", "해물전골", "해신탕"], "🍲", ["spicy", "shell", "tough_sea"], None, None, "", 3),
 ("maeuntang", "매운탕", "요리", "D:매운탕_우럭", 3, ["spicy", "fish", "liq"], [500, "그릇"],
  ["매운탕", "우럭매운탕", "광어매운탕", "서더리탕", "서더리매운탕", "대구매운탕", "메기매운탕", "아귀매운탕"], "🍲", ["spicy"], None, None, "", 2),
 ("mulhoe", "물회", "요리", "D:물회", 3, ["raw", "fish", "squid", "spicy", "sour", "gil"], [500, "그릇"],
  ["물회", "오징어물회", "한치물회", "자리물회"], "🐟", ["fish_raw", "spicy", "veg_raw"], None, None, "", 2),
 # ---- 덮밥·밥 ----
 ("jeyuk_deopbap", "제육덮밥", "곡류", "D:덮밥_돼지고기(제육)", 3, ["spicy", "pork", "redmeat", "allium"], [400, "그릇"],
  ["제육덮밥", "제육밥", "돼지불고기덮밥", "제육볶음덮밥"], "🌶️", ["spicy"], None, None, "", 1),
 ("ojingeo_deopbap", "오징어덮밥", "곡류", "D:덮밥_오징어", 3, ["spicy", "squid", "tough", "allium"], [400, "그릇"],
  ["오징어덮밥", "오징어볶음덮밥", "오삼덮밥"], "🦑", ["spicy", "tough_sea"], None, None, "", 1),
 ("nakji_deopbap", "낙지덮밥", "곡류", "D:덮밥_낙지", 3, ["spicy", "squid", "tough", "allium"], [400, "그릇"],
  ["낙지덮밥", "낙지볶음덮밥", "쭈꾸미덮밥", "주꾸미덮밥"], "🐙", ["spicy", "tough_sea"], None, None, "", 2),
 ("jangeo_deopbap", "장어덮밥", "곡류", "D:덮밥_장어", 3, ["fish", "fatty", "soy", "sugar", "wheat"], [350, "그릇"],
  ["장어덮밥", "장어구이덮밥", "히츠마부시", "우나동"], "🍱", ["eel"], None, None, "", 3),
 ("salmon_don", "연어덮밥", "곡류", "N:-", 3, ["raw", "fish", "oily", "soy", "wheat"], [350, "그릇"],
  ["연어덮밥", "사케동", "연어동", "생연어덮밥"], "🍣", ["fish_raw", "fish_oily"], None, None, "", 2),
 ("gyudon", "규동(소고기덮밥)", "곡류", "N:-", 2, ["beef", "redmeat", "fatty", "soy", "sugar", "wheat", "allium"], [400, "그릇"],
  ["규동", "소고기덮밥", "쇠고기덮밥"], "🍚", ["meat_fat"], None, None, "기름이 적은 부위면 더 낫다", 1),
 ("katsudon", "가츠동(돈가스덮밥)", "곡류", "N:-", 9, ["fried", "pork", "wheat", "egg", "soy", "sugar", "allium"], [400, "그릇"],
  ["가츠동", "돈가스덮밥", "돈까스덮밥", "카츠동"], "🍱", ["fried"], None, None, "", 1),
 ("tendon", "텐동(튀김덮밥)", "곡류", "N:-", 9, ["fried", "shrimp", "wheat", "egg", "soy", "sugar"], [400, "그릇"],
  ["텐동", "튀김덮밥", "새우튀김덮밥"], "🍤", ["fried"], None, None, "", 2),
 ("jjamppong_bap", "짬뽕밥", "곡류", "D:짬뽕밥", 3, ["spicy", "wheat", "squid", "clam", "shrimp", "pork", "liq"], [600, "그릇"],
  ["짬뽕밥"], "🍜", ["spicy", "shell"], None, None, "", 1),
 ("japchae_rice", "잡채밥", "곡류", "D:잡채밥", 2, ["soy", "sesame", "pork", "wheat", "allium"], [450, "그릇"],
  ["잡채밥"], "🍛", ["dish_mixed"], None, None, "기름 적게", 1),
 ("yukhoe_bibimbap", "육회비빔밥", "곡류", "D:비빔밥_육회", 3, ["raw", "beef", "redmeat", "spicy", "gil", "egg", "sesame", "soy"], [450, "그릇"],
  ["육회비빔밥"], "🥩", ["fish_raw", "spicy", "veg_gil"], None, None, "", 3),
 ("shrimp_fried_rice", "새우볶음밥", "곡류", "D:볶음밥_새우", 2, ["shrimp", "egg", "allium"], [300, "그릇"],
  ["새우볶음밥"], "🍛", ["dish_mixed"], None, None, "기름 적게", 2),
 ("hayashi_rice", "하이라이스", "곡류", "D:하이라이스", 2, ["wheat", "beef", "redmeat", "tomato", "allium"], [400, "그릇"],
  ["하이라이스", "하야시라이스"], "🍛", ["dish_mixed", "meat_lean"], None, None, "", 1),
 # ---- 볶음·중식 ----
 ("nakji_bokkeum", "낙지볶음", "요리", "D:낙지볶음", 3, ["spicy", "squid", "tough"], [150, "인분"],
  ["낙지볶음", "세발낙지볶음", "낙지철판볶음"], "🐙", ["spicy", "tough_sea"], None, None, "", 2),
 ("jukkumi_bokkeum", "주꾸미볶음", "요리", "D:주꾸미볶음", 3, ["spicy", "squid", "tough"], [150, "인분"],
  ["주꾸미볶음", "쭈꾸미볶음", "쭈꾸미", "주꾸미", "쭈삼"], "🐙", ["spicy", "tough_sea"], None, None, "", 2),
 ("duck_bulgogi", "오리불고기", "요리", "D:오리불고기", 3, ["spicy", "fatty", "soy"], [150, "인분"],
  ["오리불고기", "오리주물럭", "오리양념구이"], "🍗", ["spicy", "poultry_fat"], None, None, "", 2),
 ("smoked_duck", "훈제오리", "단백질", "D:훈제오리", 9, ["processed", "fatty", "salty"], [100, "인분"],
  ["훈제오리", "오리훈제", "훈제오리고기"], "🍗", ["processed", "smoked_duck"], None, None, "", 2),
 ("mapa_tofu", "마파두부", "요리", "D:마파두부", 3, ["spicy", "soy", "pork", "fatty"], [200, "인분"],
  ["마파두부", "마파두부덮밥", "마파덮밥"], "🌶️", ["spicy", "tofu_ok"], None, None, "", 1),
 ("yusanseul", "유산슬", "요리", "D:유산슬", 2, ["shrimp", "squid", "pork", "tough", "gil"], [200, "인분"],
  ["유산슬", "유산슬밥", "유산슬덮밥"], "🥘", ["dish_mixed", "tough_sea"], None, None, "", 2),
 ("yangjangpi", "양장피", "요리", "D:양장피", 3, ["spicy", "shrimp", "squid", "pork", "egg", "veg"], [200, "인분"],
  ["양장피", "양장피잡채"], "🥗", ["condiment_spicy", "veg_raw", "dish_mixed"], None, None, "", 3),
 ("kkanpunggi", "깐풍기", "요리", "D:깐풍기", 9, ["fried", "chicken", "spicy", "wheat", "sugar", "fatty"], [150, "인분"],
  ["깐풍기", "깐풍육"], "🍗", ["fried", "spicy"], None, None, "", 2),
 ("kkanso_shrimp", "깐쇼새우", "요리", "D:깐쇼새우", 9, ["fried", "shrimp", "spicy", "wheat", "sugar"], [150, "인분"],
  ["깐쇼새우", "칠리새우", "깐소새우"], "🍤", ["fried", "spicy"], None, None, "", 3),
 # ---- 면 ----
 ("bajirak_kalguksu", "바지락칼국수", "곡류", "D:칼국수_바지락", 2, ["wheat", "fodmap", "liq", "clam", "allium"], [600, "그릇"],
  ["바지락칼국수", "해물칼국수", "조개칼국수"], "🍜", ["noodle_ok", "shell"], ("high", "밀국수"), None, "", 1),
 ("memil_soba", "메밀소바(냉모밀)", "곡류", "D:메밀소바", 2, ["buckwheat", "wheat", "soy"], [450, "그릇"],
  ["메밀소바", "냉모밀", "판모밀", "냉메밀", "자루소바", "냉소바"], "🍜", ["buckwheat"], None, None, "와사비·파는 빼기", 1),
 # ---- 회·초밥 ----
 ("sushi", "초밥(모둠)", "곡류", "D:초밥_모듬", 3, ["raw", "fish", "shrimp", "squid", "egg", "soy"], [250, "접시"],
  ["모둠초밥", "모듬초밥", "스시", "회초밥", "연어초밥", "광어초밥"], "🍣", ["fish_raw"], None, None, "", 3),
 ("moduhoe", "모둠회", "단백질", "D:모듬회", 3, ["raw", "fish", "squid", "gil"], [150, "접시"],
  ["모둠회", "모듬회", "생선회", "활어회", "광어회", "우럭회", "회"], "🐟", ["fish_raw"], None, None, "", 3),
 # ---- 샐러드·쌈 ----
 ("chicken_salad", "닭가슴살 샐러드", "요리", "D:샐러드_닭가슴살", 3, ["veg", "chicken", "egg"], [250, "접시"],
  ["닭가슴살샐러드", "치킨샐러드", "닭가슴살 샐러드"], "🥗", ["veg_raw", "poultry_lean"], None, None, "드레싱은 따로 조금만", 2),
 ("caesar_salad", "시저샐러드", "요리", "N:-", 3, ["veg", "dairy", "egg", "wheat", "fish", "fatty"], [200, "접시"],
  ["시저샐러드", "시져샐러드", "케이준샐러드"], "🥗", ["veg_raw", "mayo"], None, None, "", 2),
 ("wolnamssam", "월남쌈", "요리", "D:월남쌈", 3, ["veg", "shrimp", "fodmap"], [200, "인분"],
  ["월남쌈", "라이스페이퍼쌈", "스프링롤"], "🥬", ["veg_raw", "dish_mixed"], None, None, "", 2),
 # ---- 빵·간식 ----
 ("ham_toast", "햄 토스트", "곡류", "N:-", 9, ["nitrite", "processed", "pork", "wheat", "egg", "dairy", "fatty", "sugar"], [200, "개"],
  ["햄토스트", "길거리토스트", "햄치즈토스트", "햄에그토스트"], "🍞", ["nitrite_generic", "fastfood"], None, None, "", 1),
 ("hotcake", "핫케이크(팬케이크)", "곡류", "D:핫케이크", 2, ["wheat", "egg", "dairy", "sugar"], [150, "장"],
  ["핫케이크", "팬케이크", "팬케익"], "🥞", ["bread_soft", "sweet"], ("high", "밀가루"), None, "시럽·버터는 조금만", 1),
]

# 이름과 같은 별명(띄어쓰기만 다른 것 포함)은 빼 둔다(검색 열쇠가 겹치지 않게)
EO = [x[:7] + ([a for a in dict.fromkeys(x[7]) if re.sub(r'\s', '', a) != re.sub(r'\s', '', x[1].split('(')[0])],) + x[8:] for x in EO]

# 이 메뉴들에만 쓰는 근거 문장
T11 = {
    'smoked_duck': ("훈제오리는 소금에 절여 훈연한 식육가공품이고, 제품에 따라 아질산나트륨(발색제)을 넣기도 합니다. 시판 제품은 원재료명을 확인하십시오.", [37, 3]),
}

# 원래 다른 음식에 붙어 있던 별명 가운데 이 메뉴가 더 맞는 것(옛 음식에서 뺀다)
MOVE_ALIAS = [('sundae', '순대국'), ('tuna_sashimi', '회'), ('duck_lean', '훈제오리')]
