# -*- coding: utf-8 -*-
# 요즘 자주 찾는 음식(v1.3.0 추가): 감미료로 단맛을 낸 가공 과일·제로·무설탕 제품, 유행 디저트·음식, 건강 트렌드 식품
# 형식: (id, 이름, 분류, 식약처 출처, 시작 단계, 태그, [1회 분량, 단위], 별명, 아이콘, 설명 템플릿, 미사용, 과일 상한, 조리·섭취 팁, 가격대)
# 출처 접두어: R 원재료성 식품, D 음식, P 가공식품 품목 대표값, C 가공식품 시판 제품 1종(대표값이 없어 제품 하나의 값)
# FODMAP은 generate_dataset.py의 FOD에서만 정한다(Monash 확인 항목만).
TR = [
 # --- 감미료로 단맛을 낸 가공 과일(스테비아 과일) ---
 ("stevia_tomato","스테비아 토마토","채소","C:팜모닝 스테비아 대추방울토마토",3,["tomato","gil","sweetener"],[60,"접시"],["스테비아토마토","스테비아 방울토마토","스테비아 대추방울토마토","단마토"],"🍅",["stevia_tomato","stevia_fruit","fruit_gil"],None,None,"표시된 보관방법·소비기한 지키기",2),
 ("stevia_grape","스테비아 포도","과일","C:포도쉐킷 스테비아",2,["gil","sweetener"],[80,"송이"],["스테비아포도","스테비아 샤인머스캣","스테비아샤인머스캣","스테비아 망고머스캣"],"🍇",["stevia_fruit","fruit_gil"],None,None,"표시된 보관방법·소비기한 지키기",2),
 ("stevia_cherry","스테비아 체리","과일","C:푸딘코 고당도 스테비아 생체리",3,["gil","sweetener"],[80,"컵"],["스테비아체리"],"🍒",["stevia_fruit","fruit_gil","fruit_fodmap_high"],None,None,"표시된 보관방법·소비기한 지키기",2),
 # --- 제로·무설탕 제품 ---
 ("zero_soda","제로 탄산음료","기타","C:펩시제로슈거파인애플향",9,["soda","sweetener","caffeine"],[250,"캔"],["제로콜라","제로 콜라","제로사이다","제로 사이다","제로음료","제로 음료","다이어트콜라","펩시제로","콜라제로","제로슈거"],"🥤",["zero_drink"],None,None,"",1),
 ("sugarfree_candy","무설탕 자일리톨 사탕","기타","C:프로넛 무설탕 자일리톨 캔디 오리지널",2,["polyol"],[3,"개"],["무설탕사탕","무설탕 사탕","무설탕캔디","자일리톨","자일리톨캔디","자일리톨 캔디","슈가프리캔디","슈가프리 캔디"],"🍬",["polyol"],None,None,"원재료명에서 당알코올 확인",1),
 ("sugarfree_choco","무설탕 초콜릿","기타","C:키토랩 스테비아 초콜릿",9,["choco","sweetener","fatty"],[30,"조각"],["무설탕초콜릿","스테비아 초콜릿","스테비아초콜릿","제로 초콜릿","제로초콜릿","키토 초콜릿"],"🍫",["choco","sugarfree_choco"],None,None,"",2),
 ("stevia_coffeemix","스테비아 커피믹스","기타","C:프렌치카페 카페믹스 스테비아",3,["caffeine","sweetener","dairy","fatty"],[10,"봉"],["스테비아커피믹스","스테비아 커피","스테비아커피"],"☕",["stevia_mix","caffeine"],None,None,"",1),
 ("konjac_jelly","곤약젤리","기타","C:타라미 곤약젤리 사과맛",2,["upf2"],[150,"개"],["곤약 젤리","마시는 곤약젤리","제로 곤약젤리"],"🧃",["konjac_jelly"],None,None,"원재료명에서 감미료 확인",1),
 ("kombucha_powder","콤부차(분말 스틱)","기타","C:티젠 콤부차 피치",2,["sweetener","caffeine"],[5,"스틱"],["콤부차","콤부차 분말","콤부차분말","분말 콤부차","티젠 콤부차","티젠콤부차","콤부차 스틱"],"🍹",["kombucha_powder"],None,None,"원재료명에서 감미료·당알코올 확인",1),
 ("kombucha","콤부차(탄산 병음료)","기타","C:콤부차스파클링 레몬진저",9,["soda","sour","caffeine"],[250,"병"],["스파클링콤부차","콤부차 스파클링","탄산 콤부차","병 콤부차"],"🍹",["kombucha"],None,None,"",2),
 # --- 단백질 가공식품 ---
 ("protein_drink","단백질 음료","기타","C:프로틴드링크 밀크바닐라",1,["dairy","upf2","liq"],[250,"병"],["단백질음료","프로틴음료","프로틴 음료","프로틴드링크","프로틴 드링크","단백질 쉐이크","프로틴쉐이크","프로틴 쉐이크"],"🥛",["protein_drink"],None,None,"원재료명에서 유당·감미료 확인",2),
 ("protein_bar","프로틴바","기타","C:크런치 단백질바",3,["upf2","sugar","fatty"],[40,"개"],["단백질바","단백질 바","프로틴 바"],"🍫",["protein_bar"],None,None,"원재료명에서 당알코올 확인",2),
 ("chicken_sausage","닭가슴살 소시지","단백질","C:탄단지닭가슴살소시지훈제맛",9,["processed","chicken","pork","salty","fatty"],[70,"개"],["닭가슴살소시지","닭가슴살볼","닭가슴살 가공품","닭가슴살 햄"],"🌭",["processed","chicken_proc"],None,None,"",2),
 # --- 유행 디저트 ---
 ("tanghulu","탕후루","과일","C:탕후루",2,["sugar","gil"],[60,"꼬치"],["딸기탕후루","과일탕후루","샤인머스캣탕후루"],"🍡",["sweet","fruit_gil"],None,None,"",1),
 ("yogurt_icecream","요거트 아이스크림","유제품","C:탐앤탐스티요요거트아이스크림",1,["dairy","lactose","sugar","fatty"],[150,"컵"],["요아정","요거트아이스크림","요구르트아이스크림","프로즌요거트","프로즌 요거트"],"🍦",["icecream"],None,None,"견과·그래놀라 토핑은 빼기",2),
 ("gelato","젤라또","유제품","C:크레마젤라또",1,["dairy","lactose","sugar","fatty"],[100,"컵"],["젤라토"],"🍨",["icecream"],None,None,"견과 토핑은 빼기",2),
 ("dubai_choco","두바이 초콜릿","기타","C:파네 두바이 초콜릿",9,["choco","nut","wheat","dairy","sugar","fatty"],[30,"조각"],["두바이초콜릿","두바이초코","두바이 초코","두쫀쿠","두바이쫀득쿠키","두바이 쫀득쿠키","카다이프","피스타치오 초콜릿"],"🍫",["choco"],None,None,"",3),
 ("tiramisu","티라미수","기타","P:티라미수케이크",3,["dairy","egg","wheat","sugar","fatty","caffeine"],[100,"조각"],["티라미수케이크","밤티라미수","밤 티라미수"],"🍰",["bread_fat","sweet"],None,None,"",2),
 ("cheesecake","치즈케이크","기타","P:치즈케이크",3,["dairy","egg","wheat","sugar","fatty"],[100,"조각"],["바스크치즈케이크","바스크 치즈케이크","뉴욕치즈케이크"],"🍰",["bread_fat","sweet"],None,None,"",2),
 ("gummy","구미 젤리","기타","C:하리보룰렛",1,["sugar","upf2"],[30,"줌"],["구미","젤리","구미젤리","곰젤리","하리보","스웨디시젤리","스웨디시 젤리","젤리사탕"],"🍬",["sweet"],None,None,"",1),
 ("macaron","마카롱","기타","D:마카롱",3,["nut","egg","sugar","dairy","fatty"],[20,"개"],["뚱카롱"],"🍬",["sweet","nuts"],None,None,"",2),
 ("salt_bread","소금빵","곡류","C:크랙 소금빵(완제)",3,["wheat","dairy","fatty","salty"],[70,"개"],["시오빵","소금버터빵"],"🥐",["bread_fat"],None,None,"",2),
 ("croffle","크로플","곡류","C:크로플",3,["wheat","dairy","egg","fatty","sugar"],[80,"개"],["크루아상와플"],"🧇",["bread_fat","sweet"],None,None,"",2),
 ("egg_tart","에그타르트","곡류","C:파스텔 드 나타 에그타르트 오리지널",3,["wheat","egg","dairy","fatty","sugar"],[60,"개"],["에그 타르트","파스텔드나타","나타"],"🥧",["bread_fat","sweet"],None,None,"",2),
 ("financier","휘낭시에","곡류","C:클래식 휘낭시에",3,["wheat","egg","dairy","nut","fatty","sugar"],[40,"개"],["피낭시에"],"🧁",["bread_fat","sweet"],None,None,"",2),
 ("scone","스콘","곡류","C:플레인 스콘",3,["wheat","dairy","egg","fatty","sugar"],[90,"개"],["플레인스콘"],"🥐",["bread_fat"],None,None,"",2),
 ("waffle","와플","곡류","P:와플",3,["wheat","egg","dairy","sugar","fatty"],[100,"개"],["벨기에와플","크림와플"],"🧇",["bread_fat","sweet"],None,None,"",2),
 ("cream_bread","슈크림빵·크림빵","곡류","P:슈크림빵",1,["wheat","egg","dairy","sugar","fatty"],[90,"개"],["슈크림빵","크림빵","생크림빵","우유크림빵"],"🍞",["bread_fat","sweet"],None,None,"",1),
 ("bungeoppang","붕어빵","곡류","P:단팥붕어빵",3,["wheat","gil","sugar","egg","legume"],[50,"개"],["잉어빵","국화빵","팥붕","슈붕"],"🐟",["porridge_bean","sweet"],None,None,"",1),
 ("churros","츄러스","기타","D:츄러스",9,["fried","sugar","wheat","fatty"],[60,"개"],["추로스"],"🥖",["fried","sweet"],None,None,"",1),
 # --- 유행 음료 ---
 ("bubble_tea","버블티(흑당 밀크티)","기타","D:밀크티_흑당",2,["dairy","lactose","sugar","caffeine"],[500,"잔"],["버블티","흑당버블티","흑당 버블티","흑당밀크티","흑당 밀크티","밀크티","타피오카펄"],"🧋",["sugar_drink","caffeine"],None,None,"당도는 가장 낮게",2),
 ("matcha_latte","말차 라떼","유제품","D:라떼_그린티",3,["dairy","lactose","caffeine","sugar","liq"],[350,"잔"],["말차라떼","녹차라떼","녹차 라떼","그린티라떼","그린티 라떼"],"🍵",["caffeine","dairy_sweet"],None,None,"",2),
 ("iced_tea","아이스티","기타","C:탐앤탐스복숭아아이스티",2,["sugar","caffeine","liq","peach"],[300,"잔"],["복숭아아이스티","복숭아 아이스티","레몬아이스티"],"🧃",["sugar_drink","caffeine"],None,None,"",1),
 ("energy_drink","에너지 드링크","기타","C:타이거스 파워 에너지 드링크",9,["soda","caffeine","sugar"],[250,"캔"],["에너지드링크","레드불","핫식스","몬스터"],"🥤",["energy"],None,None,"",1),
 ("sparkling_water","탄산수","기타","C:탄산수",9,["soda"],[250,"병"],["스파클링워터","플레인탄산수","트레비","씨그램"],"🥤",["sparkling"],None,None,"",1),
 ("oat_drink","오트 음료","기타","C:테라에판 유기농 오트 드링크",2,["liq"],[200,"컵"],["오트밀크","오트 밀크","귀리음료","귀리 음료","오트드링크","오틀리"],"🥛",["plant_milk"],None,None,"칼슘 강화 제품 고르기",2),
 ("almond_drink","아몬드 음료","기타","C:플레니쉬 아몬드음료",2,["nut","liq"],[200,"컵"],["아몬드밀크","아몬드 밀크","아몬드브리즈"],"🥛",["plant_milk"],None,None,"칼슘 강화 제품 고르기",2),
 # --- 유행 음식 ---
 ("malatang","마라탕","요리","D:마라탕",3,["spicy","salty","wheat"],[500,"그릇"],["마라","마라샹궈","마라 샹궈"],"🌶️",["spicy","stew_salty"],None,None,"",2),
 ("rose_tteokbokki","로제 떡볶이","요리","C:크림로제 떡볶이",3,["spicy","gil","dairy"],[300,"인분"],["로제떡볶이","크림떡볶이","로제떡"],"🌶️",["spicy","rose_sauce","ricecake_gil"],None,None,"",2),
 ("carbonara","까르보나라","요리","D:스파게티_까르보나라소스",3,["wheat","egg","dairy","fatty","processed","pork"],[350,"그릇"],["카르보나라","까르보나라파스타"],"🍝",["processed","cream_sauce"],None,None,"",2),
 ("cream_pasta","크림 파스타","요리","D:스파게티_크림소스",3,["wheat","dairy","fatty"],[350,"그릇"],["크림파스타","크림스파게티","크림 스파게티","알프레도"],"🍝",["cream_sauce"],None,None,"",2),
 ("rose_pasta","로제 파스타","요리","D:스파게티_로제소스",3,["wheat","dairy","tomato","fatty"],[350,"그릇"],["로제파스타","로제스파게티","로제 스파게티"],"🍝",["cream_sauce"],None,None,"",2),
 ("poke","포케","요리","C:클래식튜나포케",3,["fish","raw","gil","soy","sesame"],[300,"그릇"],["포케볼","포케 샐러드"],"🥗",["fish_raw"],None,None,"",3),
 ("padthai","팟타이","요리","D:팟타이",3,["peanut","egg","shrimp","fish","fatty"],[300,"접시"],["팟 타이","볶음쌀국수"],"🍜",["padthai"],None,None,"땅콩·숙주는 빼기",2),
 ("hotpot","훠궈","요리","D:훠궈_소고기",3,["spicy","fatty","redmeat","salty","beef"],[400,"인분"],["마라훠궈"],"🍲",["spicy","meat_fat"],None,None,"맵지 않은 맑은 탕(백탕)을 고르기",3),
 ("tantanmen","탄탄면","요리","D:탄탄면_간편조리세트_마라 탄탄면",3,["spicy","sesame","wheat","fatty","salty"],[450,"그릇"],["딴딴면","마라탄탄면"],"🍜",["spicy","stew_salty"],None,None,"",2),
 ("ramen_jp","라멘","요리","D:라멘_돈코츠라멘",3,["wheat","fatty","salty","pork"],[600,"그릇"],["돈코츠라멘","돈코츠","일본라멘","일본 라멘"],"🍜",["soup_bone","stew_salty"],None,None,"국물은 적게",2),
 ("acai_bowl","아사이볼","과일","C:텐퍼센트커피 아사이볼",3,["sugar","gil"],[200,"그릇"],["아사이 볼","아사이베리","아사이"],"🫐",["sweet","fruit_gil"],None,None,"그래놀라·견과 토핑은 빼기",3),
 # --- 새로 찾는 과일·면 ---
 ("dragon_fruit","용과","과일","R:용과_백육종_생것",3,["gil"],[100,"컵"],["드래곤프루트"],"🍈",["fruit_gil"],None,None,"",2),
 ("mangosteen","망고스틴","과일","R:망고스틴_생것",2,[],[60,"개"],[],"🍇",["fruit_unlisted"],None,None,"속살만",3),
 ("shine_muscat","샤인머스캣","과일","R:포도_청포도(샤인머스켓)_껍질 포함_생것",2,["gil"],[80,"송이"],["샤인머스켓","청포도"],"🍇",["fruit_gil"],None,None,"",3),
 ("konjac_noodle","곤약면","곡류","R:곤약(구약나물)_국수형_생것",2,["tough"],[150,"인분"],["곤약국수","실곤약","곤약누들"],"🍜",["tuber_unlisted"],None,None,"잘게 잘라 꼭꼭 씹기",1),
]
