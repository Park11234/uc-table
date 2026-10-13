# -*- coding: utf-8 -*-
"""궁금한 점(Q&A) 자료 — v1.7.0

AI 기능을 빼면서, 사용자가 자주 묻는 질문의 답을 앱 안에 넣었다.
답은 모두 학회·병원·국제 지침 원문에 근거하고, 근거 문장을 원문 그대로(따옴표 안 글자 그대로) 함께 싣는다.

원문 대조(더블체크)
  - 각 근거(ev)의 src는 data/sources/<src>.txt 파일 이름이다. 파일 첫 줄에 출처 주소·확인 날짜를 적었다.
  - tests/python/test_data.py의 QaTest가 인용문이 그 파일에 글자 그대로 있는지 검사한다(공백·줄바꿈만 무시).
  - PDF 두 단 편집 때문에 한 문장이 다른 단 글과 섞여 뽑힌 경우만 parts로 나눠, 순서대로·가까이(300자 안) 있는지 본다.
  - data/sources는 저작권 때문에 저장소·배포 파일에 넣지 않는다. 출처 주소와 위치(loc)로 누구나 원문을 찾아 대조할 수 있다.
  - 해외 지침 4편(ECCO·ESPEN·AGA·IOIBD)은 2026-10-04 브라우저에서 원문 페이지를 열고 발췌한 문장이 페이지 본문에 그대로 있는지 다시 확인했다.

답 문장은 근거에 없는 내용을 더하지 않는다. 앱 기능 안내(어느 화면에서 확인하는지)만 앱 쪽 설명이다.
"""

import unicodedata

# 근거 파일 → (참고문헌 번호, 화면에 보일 자료 이름)
SRC = {
    'r1_espen_2023': (1, 'ESPEN 임상영양 가이드라인(2023)'),
    'r2_aga_2024': (2, 'AGA 식이·영양치료 임상 업데이트(2024)'),
    'r3_ioibd_2020': (3, 'IOIBD 식이 권고(2020)'),
    'r36_amc': (36, '서울아산병원 궤양성대장염식'),
    'r37_kasid_nutrition': (37, '대한장연구학회 브로셔 No.6 영양과 식이요법'),
    'r39_gil_life01_01': (39, '가천대 길병원 염증성장질환센터 식이'),
    'r39_gil_life01_02': (39, '가천대 길병원 염증성장질환센터 식이표'),
    'r39_gil_life01_04': (39, '가천대 길병원 염증성장질환센터 저잔사 식이'),
    'r39_gil_life01_05': (39, '가천대 길병원 염증성장질환센터 프로바이오틱스'),
    'r40_kasid_uc_2017': (40, '대한장연구학회 궤양성 대장염 치료 가이드라인 개정판(2017)'),
    'r41_kasid_brochures': (41, '대한장연구학회 환자용 브로셔'),
    'r42_acg_preventive': (42, 'ACG IBD 예방 관리 가이드라인(2025)'),
    'r46_severance': (46, '세브란스병원 영양팀 염증성장질환의 식사요법'),
    'r50_ecco_2025': (50, 'ECCO 식이 관리 합의문(2025)'),
    'snuh': (71, '서울대학교병원 N의학정보 궤양성 대장염'),
}

CATS = ['기본', '음료', '음식', '영양·보충', '약·건강', '생활']


def E(src, loc, q, parts=None):
    d = {'src': src, 'loc': loc, 'q': q}
    if parts:
        d['parts'] = parts
    return d


QA = [
    # ───────────── 기본 ─────────────
    dict(id='no_magic', cat='기본', q='궤양성 대장염에 좋은 특별한 음식이 있습니까?',
         kw=['좋은 음식', '특별한 음식', '기적', '낫는 음식', '치료 식단', '식이요법'],
         a='병을 낫게 하는 특별한 음식은 확인되지 않았습니다. 국내 병원과 국제 지침 모두 골고루 충분히 먹어 영양 상태를 지키는 것을 기본으로 듭니다. '
           '좋다는 음식 하나만 고집하다 영양이 치우치거나 치료 시기를 놓치지 않도록 주의하라고 안내합니다.',
         foods=[],
         ev=[E('snuh', '식이요법/생활가이드', '도움이 되는 특별한 음식은 없으며, 충분한 영양 공급과 균형 잡힌 식사가 중요하다.'),
             E('r39_gil_life01_01', '기본 정보', '염증성 장질환 환자에게 좋은 기적적인 식품은 없습니다. 이런 기적적인 음식을 찾아 헤매다가 치료 시기를 놓치는 우를 범해서는 안됩니다.'),
             E('r1_espen_2023', 'Recommendation 15', 'There is no “IBD diet” that can be generally recommended to promote remission in patients with IBD with active disease.')]),
    dict(id='remission_free', cat='기본', q='증상이 없을 때(관해기)도 음식을 가려야 합니까?',
         kw=['관해기', '증상 없을 때', '좋아졌을 때', '가려 먹기', '식사 제한', '안정기'],
         a='관해기에는 엄격한 식사 제한이 필요하지 않다는 것이 대한장연구학회와 세브란스병원의 안내입니다. '
           '다시 나빠질까 걱정해 너무 많이 가리면 오히려 먹는 양이 줄어 영양이 부족해지기 쉽습니다. 먹고 나서 설사·복통·팽만감이 자주 생겼던 음식만 개인적으로 피하십시오.',
         foods=[],
         ev=[E('r37_kasid_nutrition', '질병 관해기 때의 영양 섭취', '관해기에는 엄격한 식사 제한은 필요없고 활동기에 저하된 영양 상태의 회복 및 적절한 체중을 유지하기 위해 노력해야 합니다.'),
             E('r46_severance', '활동기를 잘 견디고, 관해기를 오래 유지하라', '증상이 없는 관해기에는 증상이 다시 생길까 두려워서 너무 많은 음식을 제한하다가 식사량이 부족해지고 영양불량이 되기 쉽습니다.'),
             E('r46_severance', '활동기를 잘 견디고, 관해기를 오래 유지하라', '관해기에는 비교적 제한 없이 섭취가 가능합니다.'),
             E('r37_kasid_nutrition', '해로운 음식', '염증성 장질환의 관해기에 특별히 피해야 할 음식은 없지만, 사람에 따라 섭취 후 설사, 복통, 팽만감 등을 자주 일으키는 음식은 피하는 것이 좋습니다.')]),
    dict(id='flare_diet', cat='기본', q='증상이 심할 때(활동기)는 어떻게 먹어야 합니까?',
         kw=['활동기', '악화기', '증상 심할 때', '설사 심할 때', '혈변', '저잔사', '부드러운 음식'],
         a='장의 부담을 줄이도록 먹는 양을 줄여 소량씩 자주 먹고, 죽처럼 부드럽고 연한 음식에 살코기·연두부·달걀 같은 단백질을 더합니다. '
           '자극적인 음식과 탄산은 피하고, 채소는 푹 익힌 것도 줄입니다. 앱의 1단계(저잔사식) 식단이 이 안내를 따른 것입니다.',
         foods=['rice_porridge', 'rice_gruel', 'egg_steamed', 'silken_tofu', 'white_fish'],
         ev=[E('r37_kasid_nutrition', '질병 활동기 때의 영양 섭취', '일반적으로 활동기에는 장의 부담을 줄이기 위해 섭취량을 줄이고, 소량씩 자주 먹도록 합니다. 부드럽고 연한 음식을 선택하여 죽을 먹되 살코기, 연두부, 달걀, 굴 등을 추가하여 단백질과 무기질 등 영양 밀도를 높일 수 있습니다.'),
             E('r37_kasid_nutrition', '질병 활동기 때의 영양 섭취', '자극성 음식이나 탄산 등 장 증상을 악화시키는 음식들을 피하는 것은 물론이고, 채소는 푹 익힌 것이라도 피하는 것이 좋습니다.'),
             E('r39_gil_life01_02', '1. 급성기', '1. 급성기(설사, 혈변, 복통 심할 시)\n부드러운 죽, 미음\n저섬유소식\n저잔사식\n지방 함량이 적은 단백질 반찬 (흰살 생선, 계란 찜, 연두부, 두부)')]),
    dict(id='fasting', cat='기본', q='증상이 심하면 굶는 게 낫습니까?',
         kw=['금식', '굶기', '안 먹기', '장 쉬기', '단식'],
         a='스스로 굶는 것은 권하지 않습니다. 대한장연구학회 치료 지침은 중등도 이상이어도 가능하면 입으로 먹거나 경장 영양(영양액)을 쓰도록 권하고, 금식이 경과를 좋게 한다는 근거는 없다고 합니다. '
           '염증이 아주 심해 금식이 필요한 경우는 의료진이 정합니다. 먹기 어려울 만큼 증상이 심하면 바로 진료를 받으십시오.',
         foods=[],
         ev=[E('r40_kasid_uc_2017', '권고 14', '14. 중등도-중증 궤양성 대장염에서 영양공급은 가능하다면 경구 식이 혹은 경장 영양을 권장한다.'),
             E('r40_kasid_uc_2017', '권고 14~16 해설', '금식이 중증 궤양성 대장염의 경과를 호전시킨다는 증거는 없다.',
               parts=['금식이 중증 궤양성 대장염의 경과를 호전시킨다는 증거는', '없다.']),
             E('r37_kasid_nutrition', '질병 활동기 때의 영양 섭취', '활동기에는 장의 심한 염증으로 금식이 필요하기도 하므로 의료진과의 상의가 필요합니다.')]),
    dict(id='meals', cat='기본', q='하루 몇 번, 얼마나 먹어야 합니까?',
         kw=['끼니', '몇 끼', '식사 횟수', '소량', '자주', '열량', '칼로리', '얼마나'],
         a='한 번에 많이 먹기보다 소량씩 자주 먹도록 안내합니다. 서울아산병원은 하루 6회 이상, 길병원 저잔사식은 하루 4~6회로 나눠 먹기를 듭니다. '
           '열량은 건강한 사람과 비슷하게 체중 1kg당 30~35kcal가 기준입니다(ESPEN). 앱 식단은 세 끼에 간식을 더한 구성이라, 한 끼가 부담되면 둘로 나눠 드십시오.',
         foods=[],
         ev=[E('r36_amc', '식사요법의 실제 1', '1. 소량씩 잦은(하루 6회 이상)식사로 자극을 줄이면서 영양소의 흡수를 높이도록 합니다.'),
             E('r39_gil_life01_04', '허용 식품과 제한식품 · 곡류군', '퇴원 후 1~2주까지 죽(영양죽) → 진밥(쌀밥)으로 진행하며 하루에 4~6회로 소량씩 나누어 먹는다.'),
             E('r1_espen_2023', 'Recommendation 6', 'In general, energy delivery should be 30–35 kcal/kg/day, since the energy requirements of patients with IBD are similar to those of the healthy population.')]),
    dict(id='protein', cat='기본', q='단백질은 얼마나, 무엇으로 먹습니까?',
         kw=['단백질', '고기', '생선', '두부', '계란', '달걀', '반찬'],
         a='ESPEN은 활동기에 단백질을 체중 1kg당 1.2~1.5g으로 늘리고, 관해기에는 일반인과 비슷한 약 1g을 권합니다. '
           '길병원은 관해기에 두부·생선·살코기·계란 같은 단백질 반찬을 끼니마다 먹도록 안내하고, 세브란스병원은 달걀찜·연두부·흰살생선 조림처럼 부드러운 것이 먹기 좋다고 합니다.',
         foods=['egg_steamed', 'silken_tofu', 'white_fish', 'chicken_breast', 'beef'],
         ev=[E('r1_espen_2023', 'Recommendation 7', 'Protein requirements are increased in active IBD, and intake should be increased (to 1.2–1.5 g/kg/d in adults) relative to that recommended in the general population.'),
             E('r1_espen_2023', 'Recommendation 8', 'The protein requirements in remission are generally not elevated and provision should be similar (about 1 g/kg/d in adults) to that recommended for the general population.'),
             E('r39_gil_life01_02', '2. 관해기, 안정기', '매 식사에 두부나 생선, 살코기, 계란 등 단백칠 반찬 섭취'),
             E('r46_severance', '염증이 심하거나 장의 일부가 좁아져 있다?', '계란찜, 연두부, 흰살생선 조림은 부드러워서 먹기 좋고 단백질이 풍부해 염증 회복에도 도움이 됩니다.')]),
    dict(id='diary', cat='기본', q='나한테 맞지 않는 음식은 어떻게 알아냅니까?',
         kw=['식사 일지', '일지', '기록', '맞지 않는 음식', '트리거', '나쁜 음식 찾기'],
         a='증상을 악화시키는 음식은 사람마다 달라서, 식사 일지를 써서 음식과 증상의 관계를 직접 확인하라는 것이 대한장연구학회·서울대병원·길병원의 공통 안내입니다. '
           '앱의 먹은 기록·증상 기록·음식 평가가 이 일지 역할을 합니다.',
         foods=[],
         ev=[E('r41_kasid_brochures', '브로셔 No.9 FAQⅠ', '사람에 따라 복통이나 설사를 악화시키는 음식은 차이가 있습니다. 그래서 일지를 써서 어떠한 음식이 나의 증상을 악화시키는지 알아채는 것이 큰 도움이 됩니다.'),
             E('snuh', '식이요법/생활가이드', '이러한 음식들이 항상 증상을 악화시키는 것은 아니므로 무조건 피하는 것보다 식사 일지를 기록하는 습관을 길러서 식사와 증상 사이의 관계를 알아보는 것이 좋다.'),
             E('r39_gil_life01_01', '기본 정보', '결론적으로 염증성 장질환에서 가장 중요한 것은 식이 일지를 사용하여 먹을 수 있는 음식은 모두 먹는 것입니다.')]),
    dict(id='worse_foods', cat='기본', q='증상을 잘 악화시키는 음식은 무엇입니까?',
         kw=['악화', '나쁜 음식', '피해야 할 음식', '주의 음식', '설사 유발', '가스'],
         a='국내 자료에 자주 나오는 것은 기름진 음식, 맵거나 시거나 짠 음식, 탄산·카페인 음료, 당분이 많은 음식, 조개류·고기 힘줄 같은 질긴 음식, 질긴 나물·해초·견과류·팝콘 같은 고섬유 음식, 인공감미료입니다. '
           '다만 이런 음식이 모든 사람에게 항상 증상을 일으키는 것은 아닙니다.',
         foods=[],
         ev=[E('r37_kasid_nutrition', '해로운 음식', '일반적으로 장 증상을 유발할 수 있는 종류로는 기름진 음식, 어패류 (조개, 소라)와 고기 힘줄 등의 질긴 음식, 탄산음료, 자극성 향신료와 인공 감미료, 고섬유질(질긴 산나물, 해초, 견과류, 팝콘 등) 등이 있습니다.'),
             E('snuh', '식이요법/생활가이드', '증상을 악화시키는 음식으로는 콩, 야채, 절인 채소, 오렌지, 레몬, 과일 주스, 시거나 맵고 짠 음식, 기름진 음식, 마가린, 설탕, 카페인이 함유된 음료, 우유 등을 들 수 있지만, 이러한 음식들이 항상 증상을 악화시키는 것은 아니므로'),
             E('r39_gil_life01_02', '4. IBD 증상 악화를 잘 일으키는 음식', '콩, 야채, 절인 채소, 오렌지 및 레몬, 과일 주스, 시거나 맵고 짠 음식, 기름진 음식, 마가린, 설탕, 카페인이 함유된 음료, 과도한 술')]),

    # ───────────── 음료 ─────────────
    dict(id='coffee', cat='음료', q='커피(카페인)는 마셔도 됩니까?',
         kw=['커피', '카페인', '아메리카노', '라떼', '녹차', '홍차', '에너지 음료', '커피믹스'],
         a='카페인은 설사를 악화시킬 수 있어 대한장연구학회는 가급적 줄이도록 안내합니다. 길병원도 과도한 카페인 음료를 피할 음식으로 듭니다. '
           '빈혈이 있다면 커피·차는 철 흡수를 방해할 수 있어 식사 중이나 직후에는 피하십시오.',
         foods=['coffee', 'green_tea', 'black_tea', 'barley_tea'],
         ev=[E('r41_kasid_brochures', '브로셔 No.9 FAQⅠ 식이조절 Tip', '카페인\n설사를 악화시킬 수 있습니다.'),
             E('r37_kasid_nutrition', '해로운 음식', '음주와 폭식을 피해야 하고, 카페인 섭취도 가급적 줄이도록 합니다.'),
             E('r39_gil_life01_02', '3. 피해야 할 음식들', '과도한 카페인, 탄산 음료'),
             E('r46_severance', '혈변을 자주 본다?', '커피나 차, 탄산음료에 들어 있는 탄닌이나 인은 철의 흡수를 방해할 수 있으므로 식사 도중이나 직후에는 마시지 않습니다.')]),
    dict(id='alcohol', cat='음료', q='술은 마셔도 됩니까?',
         kw=['술', '음주', '맥주', '소주', '와인', '막걸리', '알코올', '회식'],
         a='대한장연구학회 환자용 안내는 금주를 권하고, 음주와 폭식을 피하라고 합니다. 길병원도 과도한 술을 증상 악화 음식으로 듭니다. '
           '국제 IOIBD 권고는 궤양성 대장염에서 적은 양의 음주를 바꾸라고 권할 근거는 부족하다고 해 근거 수준은 높지 않지만, 앱은 국내 학회 안내를 따라 술을 모든 단계에서 피하기로 판정합니다. 마실지는 주치의와 상의하십시오.',
         foods=['alcohol'],
         ev=[E('r41_kasid_brochures', '브로셔 No.5 일상생활을 잘 하기 위한 10가지 Tip', '금주 및 금연은 필수입니다!'),
             E('r37_kasid_nutrition', '해로운 음식', '음주와 폭식을 피해야 하고, 카페인 섭취도 가급적 줄이도록 합니다.'),
             E('r39_gil_life01_02', '4. IBD 증상 악화를 잘 일으키는 음식', '카페인이 함유된 음료, 과도한 술'),
             E('r3_ioibd_2020', 'UC 권고', 'In UC, there is insufficient evidence to recommend changes in low-level alcohol consumption (EL low).')]),
    dict(id='soda', cat='음료', q='탄산음료·탄산수·단 음료는 어떻습니까?',
         kw=['탄산', '콜라', '사이다', '탄산수', '제로', '음료수', '단 음료', '주스'],
         a='대한장연구학회는 탄산음료를 장 증상을 일으킬 수 있는 음식으로 들고, 활동기에는 탄산을 피하도록 안내합니다. 당분이 많은 음료는 가스 차는 것을 악화시킬 수 있습니다. '
           '길병원은 콜라·사이다 같은 단당류 음료를 피할 음식으로 듭니다.',
         foods=['soda', 'zero_soda', 'sparkling_water'],
         ev=[E('r37_kasid_nutrition', '해로운 음식', '일반적으로 장 증상을 유발할 수 있는 종류로는 기름진 음식, 어패류 (조개, 소라)와 고기 힘줄 등의 질긴 음식, 탄산음료'),
             E('r41_kasid_brochures', '브로셔 No.9 FAQⅠ 식이조절 Tip', '음료수\n당분이 많은 음료수는 가스 차는 것을 악화시킬 수 있습니다.'),
             E('r39_gil_life01_02', '3. 피해야 할 음식들', '단당류 (콜라, 사이다, 아이스크림, 쵸콜렛)')]),
    dict(id='water', cat='음료', q='물은 얼마나 마셔야 합니까?',
         kw=['물', '수분', '탈수', '보리차', '몇 잔', '하루 물'],
         a='설사로 인한 탈수를 막도록 충분히 마시라고 안내합니다. 서울아산병원은 체중 1kg당 30cc, 길병원은 하루 8컵 이상을 기준으로 듭니다. '
           '앱의 영양 탭 수분 목표도 몸무게를 넣으면 1kg당 30ml로 계산합니다. 의료진의 수분 제한 지시가 있으면 그 지시를 따르십시오.',
         foods=['barley_tea', 'ion_drink'],
         ev=[E('r36_amc', '식사요법의 실제 3', '3. 설사로 인한 탈수를 방지하기 위해 충분한 수분섭취를 병행합니다.(kg당 30cc)'),
             E('r39_gil_life01_01', '기본적인 식생활 실천 사항', '수분을 충분히 섭취하여 설사로 인한 탈수를 예방합니다. (1일 8컵 이상)')]),
    dict(id='juice', cat='음료', q='과일 주스·채소 주스는 괜찮습니까?',
         kw=['주스', '과일 주스', '채소 주스', '녹즙', '착즙', '스무디'],
         a='길병원은 과일·채소 주스가 장운동을 자극할 수 있어 증상을 일으키면 제한하라고 합니다. 서울대병원도 과일 주스를 증상을 악화시킬 수 있는 음식으로 듭니다. '
           '마신 뒤 설사가 늘면 줄이십시오.',
         foods=['apple_juice', 'orange_juice'],
         ev=[E('r39_gil_life01_01', '기본적인 식생활 실천 사항', '과일과 채소 주스는 장운동을 자극할 수 있으므로 증상을 유발할 경우 제한 하는 것이 좋습니다.'),
             E('snuh', '식이요법/생활가이드', '증상을 악화시키는 음식으로는 콩, 야채, 절인 채소, 오렌지, 레몬, 과일 주스')]),

    # ───────────── 음식 ─────────────
    dict(id='dairy', cat='음식', q='우유·유제품을 먹어도 됩니까?',
         kw=['우유', '유제품', '유당', '락토프리', '요거트', '요구르트', '치즈', '유당불내증'],
         a='우유와 유제품은 좋은 칼슘 공급원이고 병을 악화시킨다는 근거는 없습니다(대한장연구학회). 다만 먹고 나서 설사·가스가 생기면 유당 때문일 수 있으니 우유를 줄이고, 유당을 뺀 우유나 떠먹는 요구르트·치즈 같은 발효 제품을 시도해 보십시오. '
           'ECCO는 우유 단백을 빼는 식단을 치료로 권하지 않습니다. 살균하지 않은 우유는 감염 위험이 있어 피해야 합니다(IOIBD).',
         foods=['milk', 'lf_milk', 'yogurt_plain_unsw', 'greek_yogurt'],
         ev=[E('r37_kasid_nutrition', '질병 관해기 때의 영양 섭취', '우유와 유제품은 좋은 칼슘 공급원이고, 질병을 악화시킨다는 근거가 없습니다. 우유로 인한 장 증상이 있다면, 유당 분해 우유를 활용하도록 합니다.'),
             E('r46_severance', '우유를 마시고 설사를 한다?', '이때 우유는 피해야 하지만, 떠먹는 요구르트와 치즈처럼 발효된 제품이나 유당을 제거한 우유는 괜찮은 경우도 있습니다.'),
             E('r50_ecco_2025', 'Statement 10', 'Cow’s milk protein elimination is not recommended as an adjunct induction therapy for ulcerative colitis.'),
             E('r3_ioibd_2020', '유제품', 'Unpasteurized milk should be avoided by all patients with IBD given the potential risk of infections.')]),
    dict(id='veg_fiber', cat='음식', q='채소·섬유질은 피해야 합니까?',
         kw=['채소', '야채', '섬유', '식이섬유', '나물', '샐러드', '생채소', '저섬유'],
         a='채소는 비타민·무기질 때문에 꼭 먹어야 하는 식품입니다. 활동기에는 불용성 섬유 때문에 팽만감·설사가 생길 수 있어 줄이고, 관해기에는 익혀도 질긴 채소만 피하고 대부분 푹 익히거나 잘게·갈아서 먹도록 안내합니다(대한장연구학회). '
           '길병원 저잔사식은 한 끼에 채소 1가지 35g을 껍질·줄기를 빼고 무르게 조리하도록 합니다. ECCO는 저섬유·고섬유 식단 어느 쪽도 관해 유지 치료로 권하지 않습니다.',
         foods=['zucchini', 'spinach', 'carrot', 'broccoli'],
         ev=[E('r37_kasid_nutrition', '유용한 조리 팁 1. 채소 고르기', '채소는 비타민, 무기질이 풍부하고, 장내 환경을 좋게 한다는 점을 생각하면 반드시 먹어야 하는 식품입니다.'),
             E('r37_kasid_nutrition', '유용한 조리 팁 1. 채소 고르기', '따라서 활동기에는 가급적 섭취를 줄이도록 하며, 관해기에는 익혀도 질긴 채소는 피하고, 대부분의 채소는 푹 익혀 무르게 하거나, 잘게 혹은 갈아서 요리하는 것이 좋습니다.'),
             E('r39_gil_life01_04', '허용 식품과 제한식품 · 채소군', '껍질이나 줄기 부위를 최대로 제거하고 무르게 조리, 1끼니에 1가지 종류 1/2분량(35g)으로 꼭꼭 씹어서 먹는다.'),
             E('r50_ecco_2025', 'Statement 11.2', 'Neither low- nor high-fiber diets are recommended for maintenance therapy for Crohn’s disease or ulcerative colitis.')]),
    dict(id='fruit', cat='음식', q='과일은 얼마나 먹어도 됩니까?',
         kw=['과일', '사과', '바나나', '배', '복숭아', '귤', '키위', '딸기', '하루 과일'],
         a='길병원 저잔사식표의 하루 분량은 사과 중 1/2개, 배 1/4개, 복숭아 1/2개, 귤 소 2개, 잘 익은 바나나 소 1/2개 등입니다. '
           '감류·설익은 과일·파인애플·말린 과일·키위·토마토·딸기처럼 씨와 껍질째 먹는 과일은 제한 식품입니다. IOIBD는 궤양성 대장염에서 과일·채소 섭취를 특별히 바꾸거나 제한하라고 권할 근거는 부족하다고 합니다.',
         foods=['banana', 'applesauce', 'kiwi', 'strawberry'],
         ev=[E('r39_gil_life01_04', '허용 식품과 제한식품 · 과일군', '하루 섭취분량 : 사과 중 1/2개, 배 1/4개, 황도·백도 복숭아 1/2개, 포도 19알, 수박 중 1쪽, 멜론 1조각, 귤 소 2개, 과일주스(맑은 주스), 바나나(잘익은 것) 소 1/2개'),
             E('r39_gil_life01_04', '허용 식품과 제한식품 · 과일군(제한)', '감류(단감, 홍시, 곶감), 설익은 과일, 파인애플, 말린과일(건포도, 대추 등), 키위, 토마토, 딸기와 같이 씨와 껍질째 먹는 종류'),
             E('r3_ioibd_2020', 'UC 권고', 'In UC, there is insufficient evidence to recommend any specific change or restriction in intake of fruit and vegetables. (EL very low).')]),
    dict(id='fatty', cat='음식', q='기름진 음식·튀김은 어떻습니까?',
         kw=['기름', '튀김', '치킨', '지방', '삼겹살', '패스트푸드', '부침', '볶음'],
         a='기름지거나 튀긴 음식은 설사나 가스를 악화시킬 수 있습니다(대한장연구학회). 고기는 기름기 적은 부위를 고르고, 눈에 보이는 지방을 떼고 데치기·굽기·끓이기로 조리하도록 안내합니다. '
           '길병원은 튀김·빵·라면 같은 과도한 지방을 피할 음식으로 듭니다.',
         foods=['fried', 'fried_chicken', 'pork_belly', 'ramen'],
         ev=[E('r41_kasid_brochures', '브로셔 No.9 FAQⅠ 식이조절 Tip', '기름지거나 튀긴 음식\n설사나 가스 차는 것을 악화시킬 수도 있습니다.'),
             E('r37_kasid_nutrition', '유용한 조리 팁 2. 고기 기름 줄이기', '고기를 선택할 때는 기름기 적은 부위를 선택하고, 육류 가공품은 되도록 먹지 않도록 합니다.'),
             E('r41_kasid_brochures', '브로셔 No.6 유용한 조리 팁 · 고기 기름 줄이기', '고기 섭취 시 껍질이나 내장 등에 있는 눈에 보이는 지방은 떼어내고 먹습니다'),
             E('r37_kasid_nutrition', '유용한 조리 팁 2. 고기 기름 줄이기', '데치고, 굽고, 끓이는 등의 조리법으로 기름을 제거한 후 조리하기도 합니다.'),
             E('r39_gil_life01_02', '3. 피해야 할 음식들', '과도한 지방 (튀김, 빵, 라면 등)')]),
    dict(id='red_meat', cat='음식', q='붉은 고기·가공육(햄·소시지·베이컨)은 어떻습니까?',
         kw=['붉은 고기', '소고기', '돼지고기', '가공육', '햄', '소시지', '베이컨', '육류'],
         a='궤양성 대장염에서는 붉은 고기와 가공육을 줄이는 것이 국제 지침의 공통 권고입니다. AGA는 이런 식단이 궤양성 대장염 악화를 줄일 수 있다고 하고, ECCO는 관해 유지를 위해 줄이는 것을 고려할 수 있다고 합니다. '
           '대한장연구학회는 육류 가공품을 되도록 먹지 않도록 안내합니다. 살코기는 좋은 단백질 공급원이니 기름기 적은 부위로 적당히 드십시오.',
         foods=['ham', 'beef', 'pork_belly'],
         ev=[E('r2_aga_2024', 'Best Practice Advice 1', 'A diet low in red and processed meat may reduce ulcerative colitis flares, but has not been found to reduce relapse in Crohn’s disease.'),
             E('r50_ecco_2025', 'Statement 9', 'A reduction in the intake of red and processed meat could be considered for maintenance of remission in ulcerative colitis.'),
             E('r3_ioibd_2020', 'UC 권고', 'In UC, it is prudent to reduce intake of red and processed meat (EL low).'),
             E('r37_kasid_nutrition', '유용한 조리 팁 2. 고기 기름 줄이기', '고기를 선택할 때는 기름기 적은 부위를 선택하고, 육류 가공품은 되도록 먹지 않도록 합니다.')]),
    dict(id='fish_omega3', cat='음식', q='생선(오메가3)은 도움이 됩니까? 오메가3 영양제는 어떻습니까?',
         kw=['생선', '오메가3', '등푸른 생선', '고등어', '연어', '삼치', '흰살생선', '어유', '오메가3 영양제'],
         a='대한장연구학회는 관해기에 고등어·삼치·꽁치 같은 등푸른 생선을 주 3회 이상 먹도록 권하고, IOIBD도 오메가3를 보충제가 아닌 바다 생선으로 늘리라고 합니다. '
           '다만 활동기에는 등푸른 생선 기름도 소화가 어려울 수 있어 담백한 흰살생선이 나을 수 있습니다. ECCO는 오메가3 보충제를 관해 유지 치료로 권하지 않습니다.',
         foods=['mackerel', 'spanish_mackerel', 'salmon', 'white_fish'],
         ev=[E('r37_kasid_nutrition', '질병 관해기 때의 영양 섭취', '지방은 가급적 줄이되 오메가3의 섭취를 늘리기 위해 고등어, 삼치, 꽁치 등의 등푸른 생선을 주 3회 이상 먹도록 노력하고, 볶음이나 무침 시 신선한 들기름을 사용하도록 합니다.'),
             E('r37_kasid_nutrition', '질병 활동기 때의 영양 섭취', '기름의 섭취량은 줄이는 것이 좋고 등푸른 생선의 기름 조차 소화가 어려울 수 있으므로, 때로는 담백한 흰살 생선이 더 도움이 될 수 있습니다.'),
             E('r3_ioibd_2020', 'UC 권고', 'It is prudent to increase dietary consumption of omega-3 fatty acids (DHA and EPA) from marine fish (EL low), but not from supplements (EL high).'),
             E('r50_ecco_2025', 'Statement 19.3', 'Omega-3 fatty acid and vitamin D supplementation are not recommended for maintenance of remission in Crohn’s disease or ulcerative colitis.')]),
    dict(id='spicy', cat='음식', q='매운 음식·김치는 어떻습니까?',
         kw=['매운', '매운 음식', '김치', '고추', '청양고추', '양념', '자극적', '떡볶이', '마라'],
         a='양념이 많이 된 음식보다 담백하고 부드러운 음식이 좋다고 대한장연구학회는 안내합니다. 길병원 저잔사식표는 배추김치·깍두기·물김치는 허용하지만 열무김치·갓김치·파김치와 지나치게 매운 음식(청양고추·겨자 등)은 제한합니다. '
           '앱은 두 안내 중 더 엄격한 쪽을 따라 배추김치·깍두기를 저잔사식·이행식 단계에서는 피하고, 지중해식 단계에서는 주의하도록 판정합니다.',
         foods=['kimchi', 'kkakdugi', 'baek_kimchi', 'cheongyang'],
         ev=[E('r41_kasid_brochures', '브로셔 No.9 FAQⅠ', '양념이 많이된 음식보다는 담백하고 부드러운 음식이 좋습니다.'),
             E('r39_gil_life01_04', '허용 식품과 제한식품 · 채소군(제한)', '김치류(열무김치, 갓김치, 파김치)'),
             E('r39_gil_life01_04', '허용 식품과 제한식품 · 기타(제한)', '김밥, 민간요법, 탄산음료, 카페인 음료, 지나치게 매운 음식(청량고추, 겨자 등)')]),
    dict(id='sweets', cat='음식', q='단 음식·인공감미료(제로 제품)는 어떻습니까?',
         kw=['설탕', '단 음식', '과자', '초콜릿', '아이스크림', '감미료', '제로', '무설탕', '스테비아'],
         a='당분이 많은 음식은 설사·팽만감 같은 불편감을 일으킬 수 있고(대한장연구학회), 길병원은 콜라·사이다·아이스크림·초콜릿 같은 단당류를 피할 음식으로 듭니다. '
           '인공감미료도 장 증상을 일으킬 수 있는 음식으로 안내되고, IOIBD는 말토덱스트린·인공감미료가 든 식품을 제한하는 것이 신중하다고 합니다.',
         foods=['sugar', 'ice_cream', 'milk_chocolate', 'sugarfree_choco'],
         ev=[E('r37_kasid_nutrition', '해로운 음식', '당분이 과다한 음식들 역시 설사, 팽만감 등 불편감을 유발할 수 있습니다.'),
             E('r37_kasid_nutrition', '해로운 음식', '탄산음료, 자극성 향신료와 인공 감미료'),
             E('r39_gil_life01_02', '3. 피해야 할 음식들', '단당류 (콜라, 사이다, 아이스크림, 쵸콜렛)'),
             E('r3_ioibd_2020', 'UC 권고', 'In UC, it may be prudent to limit intake of maltodextrin-containing foods and artificial sweeteners (EL very low).')]),
    dict(id='processed', cat='음식', q='가공식품·초가공식품은 피해야 합니까?',
         kw=['가공식품', '초가공', '인스턴트', '첨가물', '유화제', '편의점', '즉석식품'],
         a='초가공식품을 많이 먹을수록 크론병이 더 많이 생겼지만 궤양성 대장염과의 관련은 확인되지 않았습니다(ECCO 2025). 그래도 ECCO는 건강한 식사의 하나로 초가공식품을 줄이도록 하고, ESPEN도 초가공식품·유화제를 피하는 것을 권할 수 있다고 합니다. '
           'IOIBD는 카라기난·카복시메틸셀룰로오스·폴리소르베이트80 같은 유화제가 든 가공식품을 줄이는 것이 신중하다고 합니다. 제품의 원재료명은 \'편의점 제품\'에서 검사할 수 있습니다.',
         foods=['ramen', 'ham'],
         ev=[E('r50_ecco_2025', 'Statement 47', 'Ultra-processed food (UPF) intake is associated with the development of Crohn’s disease but not ulcerative colitis. Intake of UPF should be limited consistent with healthy eating patterns.'),
             E('r1_espen_2023', 'Recommendation 2', 'Ultra-processed food and dietary emulsifiers such as carboxymethylcellulose could be associated with an increased risk of IBD and, therefore, generally, such exclusions can be recommended.'),
             E('r3_ioibd_2020', 'UC 권고', 'In UC, it may be prudent to reduce intake of processed foods that contain carrageenan, carboxymethylcellulose, and polysorbate-80 (EL very low).')]),
    dict(id='mediterranean', cat='음식', q='지중해식 식단이 좋다던데 맞습니까?',
         kw=['지중해식', '지중해', '올리브유', '식단 종류', '식사법'],
         a='AGA는 금기가 없다면 모든 IBD 환자에게 지중해식(신선한 채소·과일, 단일불포화지방, 복합 탄수화물, 기름기 적은 단백질을 많이, 초가공식품·첨가당·소금은 적게)을 권합니다. '
           'ECCO는 궤양성 대장염의 관해 유지에 약물과 함께 고려할 수 있지만, 악화를 가라앉히는 치료로는 근거가 부족하다고 합니다. 앱의 3단계(관해기) 식단이 이 원칙을 따릅니다.',
         foods=['olive_oil', 'perilla_oil'],
         ev=[E('r2_aga_2024', 'Best Practice Advice 1', 'Unless there is a contraindication, all patients with IBD should be advised to follow a Mediterranean diet rich in a variety of fresh fruits and vegetables, monounsaturated fats, complex carbohydrates, and lean proteins and low in ultraprocessed foods, added sugar, and salt for their overall health and general well-being.'),
             E('r50_ecco_2025', 'Statement 7.2', 'The MD could be considered for maintenance of remission in UC as an adjunct to medical therapy.'),
             E('r50_ecco_2025', 'Statement 7.1', 'There is insufficient evidence to recommend the Mediterranean diet (MD) as induction therapy for Crohn’s disease (CD) or ulcerative colitis (UC).')]),
    dict(id='fodmap', cat='음식', q='저FODMAP 식단을 해야 합니까?',
         kw=['FODMAP', '포드맵', '저포드맵', '과민성', '가스', '복부팽만', '팽만감'],
         a='염증이 가라앉았는데도 과민성장증후군 같은 증상(가스·팽만·설사)이 계속될 때 저FODMAP 식단이 권장됩니다(ECCO). 관해 유지 치료로 쓸 근거는 없습니다. '
           '제한이 큰 식단이라, ECCO는 IBD 경험이 있는 영양사의 도움을 받을 수 있어야 한다고 합니다.',
         foods=[],
         ev=[E('r50_ecco_2025', 'Statement 20.1', 'In adults with quiescent IBD and IBS-like symptoms, a low FODMAP diet is recommended to treat persistent gastrointestinal symptoms.'),
             E('r50_ecco_2025', 'Statement 12', 'there is no evidence to support its use for maintenance of remission in ulcerative colitis.'),
             E('r50_ecco_2025', 'Statement 2', 'All people with IBD should have access to a dietitian with experience in IBD.')]),
    dict(id='gluten', cat='음식', q='밀가루(글루텐)를 끊어야 합니까?',
         kw=['밀가루', '글루텐', '빵', '면', '국수', '글루텐프리'],
         a='궤양성 대장염에서 밀·글루텐을 제한하라고 권할 근거는 부족합니다(IOIBD). ECCO도 글루텐을 뺀 식단이 염증을 가라앉히는 데 도움이 된다고 권고할 근거는 없다고 합니다. '
           '활동기 저잔사식에서는 통밀빵·잡곡 같은 고섬유 곡류를 제한하고 흰밥·소면·식빵 같은 부드러운 곡류를 허용합니다.',
         foods=['white_bread', 'somen', 'white_rice', 'mixed_grain_rice'],
         ev=[E('r3_ioibd_2020', 'UC 권고', 'In UC, there is insufficient evidence to recommend restriction of wheat and gluten (EL Low).'),
             E('r50_ecco_2025', 'Statement 15.3', 'There is no evidence to make recommendations on the benefit of a gluten-free diet for induction of remission in IBD.'),
             E('r39_gil_life01_04', '허용 식품과 제한식품 · 곡류군', '흰밥, 찹쌀밥, 면류(소면, 마카로니 등), 부드러운 빵류(식빵, 카스테라, 모닝빵 등), 쌀미숫가루, 백설기, 감자')]),
    dict(id='raw_shellfish', cat='음식', q='회·조개·젓갈 같은 날것은 어떻습니까?',
         kw=['회', '생선회', '육회', '조개', '굴', '젓갈', '날것', '초밥', '생굴'],
         a='길병원 저잔사식은 조개류와 익히지 않은 동물성 식품(육회·생선회·젓갈 등)을 제한합니다. 대한장연구학회도 조개·소라 같은 어패류를 증상을 일으킬 수 있는 질긴 음식으로 듭니다. '
           '다만 대한장연구학회는 활동기 죽에 굴을 넣어 영양을 보충하는 방법도 안내해 출처마다 차이가 있습니다. 앱은 더 엄격한 쪽을 따라 익힌 굴을 저잔사식 단계에서는 보류하고 이행식부터 허용합니다.',
         foods=['tuna_sashimi', 'yukhoe', 'clam', 'oyster'],
         ev=[E('r39_gil_life01_04', '허용 식품과 제한식품 · 어육류군(제한)', '기름지고 질긴 육류, 가공품류, 조개류, 익히지 않은 동물성 식품(육회, 생선회, 젓갈 등)'),
             E('r37_kasid_nutrition', '해로운 음식', '일반적으로 장 증상을 유발할 수 있는 종류로는 기름진 음식, 어패류 (조개, 소라)와 고기 힘줄 등의 질긴 음식'),
             E('r37_kasid_nutrition', '질병 활동기 때의 영양 섭취', '부드럽고 연한 음식을 선택하여 죽을 먹되 살코기, 연두부, 달걀, 굴 등을 추가하여')]),
    dict(id='cooking', cat='음식', q='장에 부담을 덜 주는 조리법이 있습니까?',
         kw=['조리법', '요리', '익히기', '갈기', '죽 끓이기', '부드럽게', '조리'],
         a='채소는 푹 익혀 무르게 하거나 잘게 혹은 갈아서 요리하고, 그래도 불편하면 채소 끓인 물을 마셔 무기질을 보충하도록 안내합니다. 고기·생선은 작게 자르거나 갈아서 부드럽게 익히고, 데치기·굽기·끓이기로 기름을 줄입니다. '
           '죽은 쌀이나 찹쌀을 1시간 이상 불려 참기름에 볶은 뒤 5~7배의 물로 끓입니다(대한장연구학회).',
         foods=['rice_porridge'],
         ev=[E('r37_kasid_nutrition', '유용한 조리 팁 1. 채소 고르기', '대부분의 채소는 푹 익혀 무르게 하거나, 잘게 혹은 갈아서 요리하는 것이 좋습니다. 여전히 설사 혹은 장 불편감이 있다면 끓인 물을 마셔 무기질 섭취를 돕도록 합니다.'),
             E('r39_gil_life01_04', '허용 식품과 제한식품 · 어육류군', '작은 조각으로 자르거나 갈아서 부드럽게 익혀서 먹는다.'),
             E('r37_kasid_nutrition', '죽 끓이기 기본', '쌀, 혹은 찹쌀을 1시간 이상 충분히 불리고 체에 밭쳐 물기를 뺀 후, 중불로 가열된 냄비에 참기름을 두르고 넣어 볶다가 5-7배 정도의 물을 붓고 끓입니다.')]),

    # ───────────── 영양·보충 ─────────────
    dict(id='ons', cat='영양·보충', q='잘 못 먹을 때 영양음료(뉴케어 등)를 마셔도 됩니까?',
         kw=['영양음료', '영양식', '뉴케어', '그린비아', '메디웰', '균형영양식', '못 먹을 때', '식욕'],
         a='영양 보충이 필요할 때 영양음료(경구 영양 보충)는 평소 식사에 더하는 첫 단계입니다(ESPEN). 서울아산병원은 영양음료로 부족한 칼로리를 보충하도록 안내하고, 대한장연구학회도 영양액을 조금씩 나누어 마시는 방법을 듭니다. '
           '길병원 저잔사식표에는 저잔사 영양보충음료가 허용 식품으로 있습니다.',
         foods=['newcare_gosu', 'greenbia_care'],
         ev=[E('r1_espen_2023', 'Recommendation 22', 'ONS is the first step when medical nutrition is indicated in IBD, as supportive therapy in addition to normal food.'),
             E('r36_amc', '식사요법의 실제 5', '5. 중쇄중성지방(MCT oil)과 영양음료를 사용하여 부족되는 칼로리를 보충합니다.'),
             E('r37_kasid_nutrition', '질병 활동기 때의 영양 섭취', '부족한 열량을 보충하기 위하여 영양액을 처방받아 조금씩 나누어 마시거나'),
             E('r39_gil_life01_04', '허용 식품과 제한식품 · 기타', '저잔사 영양보충음료(그린비아, 뉴케어, 미니웰, 메디웰)')]),
    dict(id='weight_loss', cat='영양·보충', q='살이 빠지고 있습니다. 어떻게 해야 합니까?',
         kw=['체중 감소', '살 빠짐', '저체중', '영양불량', '체중', '몸무게', '고칼로리'],
         a='염증성 장질환은 영양불량이 생기기 쉽습니다. 규칙적으로 먹고, 식사량이 부족하면 영양죽·으깬 감자·삶은 계란 같은 간식을 더합니다(세브란스병원). 대한장연구학회는 체중이 많이 빠지면 고칼로리 식사를 권합니다. '
           'AGA는 의도하지 않은 체중 감소를 영양불량의 신호로 보고 영양사의 평가를 받도록 권하니, 체중이 계속 줄면 진료 때 알리십시오.',
         foods=['potato', 'egg_boiled', 'rice_porridge'],
         ev=[E('r46_severance', '활동기를 잘 견디고, 관해기를 오래 유지하라', '보고에 따라서는 약 60-70%의 환자가 저체중 또는 영양불량이라고 합니다.'),
             E('r46_severance', '활동기를 잘 견디고, 관해기를 오래 유지하라', '규칙적으로 식사하고, 식사량이 부족하다면 영양죽, 으깬 감자나 삶은 계란 등 다양한 간식을 활용합니다.'),
             E('r41_kasid_brochures', '브로셔 No.9 FAQⅠ 식이조절 Tip', '고칼로리 식사\n체중이 많이 빠지거나 성장이 늦은 환자분들에게는 추천합니다.'),
             E('r2_aga_2024', 'Best Practice Advice 9', 'All patients with IBD warrant regular screening for malnutrition by their provider by means of assessing signs and symptoms, including unintended weight loss, edema and fluid retention, and fat and muscle mass loss. When observed, more complete evaluation for malnutrition by a registered dietitian is indicated.')]),
    dict(id='multivitamin', cat='영양·보충', q='종합비타민·영양제를 먹어야 합니까?',
         kw=['종합비타민', '비타민', '영양제', '미네랄', '무기질', '보충제'],
         a='길병원은 종합비타민을 정기적으로 먹도록 권장된다고 안내합니다. 대한장연구학회는 음식으로 비타민·무기질이 충분하지 않으면 주치의와 상의해 영양제로 보충해도 좋다고 합니다. '
           'ESPEN은 관해기에도 미량영양소 결핍을 정기적으로 확인하고 부족한 것을 바로잡도록 권합니다.',
         foods=[],
         ev=[E('r39_gil_life01_01', '기본적인 식생활 실천 사항', '염증성 장질환 환자는 종합 비타민을 정기적으로 복용하도록 권장되고 있습니다.'),
             E('r37_kasid_nutrition', '도움이 되는 음식', '식품으로 비타민, 무기질 섭취가 충분치 않다면 주치의와 상의하여 영양제로 보충해도 좋습니다.'),
             E('r1_espen_2023', 'Recommendation 9', 'Patients with IBD should be checked for micronutrient deficiencies regularly, including in the remission phase, and specific deficits should be appropriately corrected.')]),
    dict(id='folate', cat='영양·보충', q='설파살라진을 먹는데 엽산이 필요합니까?',
         kw=['엽산', '설파살라진', '사라조피린', '메토트렉세이트', '임신 엽산'],
         a='설파살라진은 엽산 흡수를 방해합니다(서울아산병원). 길병원은 설파살라진이나 메토트렉세이트를 오래 먹으면 엽산을 하루 1mg 보충하는 것이 좋다고 하고, 설파살라진을 먹는 임신부는 하루 2mg까지 충분히 먹도록 대한장연구학회가 안내합니다. '
           'ECCO는 혈중 엽산을 확인하도록 권합니다. 용량은 주치의와 정하십시오.',
         foods=[],
         ev=[E('r36_amc', '그 외 주의사항', '2. 설파살라진(Sulfasalazine) : 엽산 흡수저해'),
             E('r39_gil_life01_01', '기본적인 식생활 실천 사항', '설파살라진이나 메토트렉세이트를 장기간 복용하는 경우에는 엽산이 부족하기 쉬우므로 하루 1mg 보충하는 것이 좋습니다.'),
             E('r41_kasid_brochures', '브로셔 No.7 임신과 수유 · 아미노살리실산', '설파살라진(사라조피린, 조피린, 살루딘 등)을 복용하는 임산부의 경우 엽산의 흡수와 대사가 감소될 수 있으므로 엽산을 하루 2mg까지 충분히 복용하도록 합니다.'),
             E('r50_ecco_2025', 'Statement 31', 'Serum folate should be monitored in people with IBD, as they are at risk of deficiency.')]),
    dict(id='iron', cat='영양·보충', q='혈변이 잦아 빈혈이 걱정됩니다. 무엇을 먹습니까?',
         kw=['빈혈', '철분', '철', '혈변', '어지러움', '철분제'],
         a='붉은 살코기·생선·간·굴·달걀노른자 같은 동물성 식품은 철이 많고 흡수도 잘 됩니다. 커피·차·탄산음료는 철 흡수를 방해할 수 있어 식사 중이나 직후에는 마시지 않습니다(세브란스병원). '
           '지침은 모든 환자의 빈혈·철 상태를 확인하고(ECCO), 철결핍성 빈혈이 있으면 철분을 보충하도록 권합니다(ESPEN). 붉은 고기는 줄이라는 권고도 있으니 살코기를 적당량 드십시오.',
         foods=['beef', 'oyster', 'egg_boiled'],
         ev=[E('r46_severance', '혈변을 자주 본다?', '붉은색 육류, 생선, 간, 굴, 달걀노른자 등의 동물성 식품은 철이 많으면서 흡수율도 좋습니다.'),
             E('r46_severance', '혈변을 자주 본다?', '커피나 차, 탄산음료에 들어 있는 탄닌이나 인은 철의 흡수를 방해할 수 있으므로 식사 도중이나 직후에는 마시지 않습니다.'),
             E('r50_ecco_2025', 'Statement 30', 'Hemoglobin and iron status should be monitored in all people with IBD.'),
             E('r1_espen_2023', 'Recommendation 10', 'Iron supplementation should be recommended in all patients with IBD when iron deficiency anemia is present.')]),
    dict(id='calcium_vitd', cat='영양·보충', q='칼슘·비타민 D는 따로 챙겨야 합니까?',
         kw=['칼슘', '비타민 D', '비타민D', '뼈', '골다공증', '골밀도'],
         a='IBD 환자는 칼슘 섭취가 권장량보다 적은 경우가 많고 비타민 D 부족도 흔합니다(ECCO). 우유·유제품은 칼슘·비타민 D의 주요 공급원이라, 오래 못 먹는다면 보충제를 고려합니다(세브란스병원). '
           '활동기이거나 스테로이드를 먹는다면 비타민 D를 확인하고 필요하면 칼슘·비타민 D를 보충하도록 ESPEN이 권합니다. 뼈 건강 위험 요인이 있으면 골밀도 검사를 받도록 ACG가 권합니다.',
         foods=['milk', 'lf_milk', 'yogurt_plain_unsw'],
         ev=[E('r50_ecco_2025', 'Statement 37', 'Dietary calcium intake is often below recommendations for optimal bone health in people with IBD.'),
             E('r50_ecco_2025', 'Statement 33', 'Vitamin D insufficiency is common in people with IBD and may be associated with adverse disease outcomes.'),
             E('r46_severance', '우유를 마시고 설사를 한다?', '우유나 유제품은 칼슘과 비타민D의 주요 급원이다. 장기간 섭취가 어렵다면 보충제 이용을 고려합니다.'),
             E('r1_espen_2023', 'Recommendation 20', 'Patients with IBD (adults and children) with active disease, under treatment with corticosteroids, or with suspected hypovitaminosis D, should be monitored for serum 25(OH) vitamin D status, and if required calcium/vitamin D supplementation should be prescribed for prevention of low bone mineral density.'),
             E('r42_acg_preventive', 'Recommendation 11', 'In adults with IBD and conventional risk factors for abnormal bone mineral density, we suggest screening for osteoporosis with bone mineral density testing at the time of diagnosis and periodically after diagnosis')]),
    dict(id='probiotics', cat='영양·보충', q='유산균(프로바이오틱스)을 먹으면 도움이 됩니까?',
         kw=['유산균', '프로바이오틱스', '프로바이오틱', '장 건강', '요구르트 효과'],
         a='길병원은 증상 완화를 위해 먹으면서 문제가 없다면 괜찮지만, 약을 대신할 근거는 없으니 약 대신 유산균만 먹는 것은 주의하라고 합니다. '
           'ESPEN은 5-ASA(메살라진 등)를 견디지 못하는 경증·중등도 궤양성 대장염에서 일부 선택된 프로바이오틱스를 대안으로 쓸 수 있다고 합니다. 어떤 제품이든 주치의와 상의하십시오.',
         foods=[],
         ev=[E('r39_gil_life01_05', '프로바이오틱스', '증상 완화나 개별적으로 드시면서 문제가 없다면 드시는 것이 문제가 없으나 약물 요법에 대체적으로 프로 바이오틱스만 복용하는 것은 주의가 필요합니다.'),
             E('r1_espen_2023', 'Recommendation 53', 'In patients with UC, selected probiotics or probiotics-containing preparations can be used as an alternative to 5-aminosalicylic acid (5-ASA) standard therapy if 5-ASA is not tolerated for the treatment of mild or moderate active disease.')]),
    dict(id='herbal', cat='영양·보충', q='건강기능식품·한약·민간요법은 어떻습니까?',
         kw=['건강기능식품', '건강보조식품', '한약', '민간요법', '대체요법', '홍삼', '보약', '즙'],
         a='현재까지 기존 치료에 버금가는 대체요법은 없고, 대체요법을 원하면 반드시 담당 의사와 상의하라고 대한장연구학회는 안내합니다. 길병원 저잔사식표는 민간요법을 제한 식품에 넣습니다. '
           '기적의 음식을 찾다가 치료 시기를 놓치지 않도록 하고, 먹기 시작한 것이 있으면 진료 때 알리십시오.',
         foods=[],
         ev=[E('r41_kasid_brochures', '브로셔 No.10 FAQⅡ 대체요법', '현재까지 염증성 장질환의\n기존 치료법에 버금가는 대체요법은 없습니다.'),
             E('r41_kasid_brochures', '브로셔 No.10 FAQⅡ 대체요법', '대체요법을 희망하는 경우\n반드시 담당 의사와 상의하시고 도움을 청하시기 바랍니다.'),
             E('r39_gil_life01_04', '허용 식품과 제한식품 · 기타(제한)', '김밥, 민간요법, 탄산음료, 카페인 음료'),
             E('r39_gil_life01_01', '기본 정보', '이런 기적적인 음식을 찾아 헤매다가 치료 시기를 놓치는 우를 범해서는 안됩니다.')]),

    # ───────────── 약·건강 ─────────────
    dict(id='steroid', cat='약·건강', q='스테로이드를 먹는 동안 식사에서 무엇을 주의해야 합니까?',
         kw=['스테로이드', '프레드니솔론', '소론도', '저염식', '부종', '붓기', '짠 음식'],
         a='스테로이드 치료 중에는 싱겁게 먹는 것(저염식)이 몸이 붓는 것을 막아 줍니다(대한장연구학회). 스테로이드는 칼슘·단백질 흡수를 방해하므로(서울아산병원) 칼슘과 단백질을 충분히 챙기고, '
           'ESPEN은 스테로이드 치료 중 비타민 D를 확인하고 필요하면 칼슘·비타민 D를 보충하도록 권합니다.',
         foods=[],
         ev=[E('r41_kasid_brochures', '브로셔 No.9 FAQⅠ 식이조절 Tip', '저염식\n스테로이드 치료를 받을 때는 저염식을 하는 것이 몸이 붓는 것을 막아줍니다.'),
             E('r36_amc', '그 외 주의사항', '1. 코티코스테로이드(Corticosteroids) : 칼슘, 단백질 흡수저해'),
             E('r1_espen_2023', 'Recommendation 20', 'Patients with IBD (adults and children) with active disease, under treatment with corticosteroids, or with suspected hypovitaminosis D, should be monitored for serum 25(OH) vitamin D status')]),
    dict(id='painkiller', cat='약·건강', q='감기약·진통제는 아무거나 먹어도 됩니까?',
         kw=['감기약', '진통제', '해열제', '타이레놀', '소염진통제', '항생제', '이부프로펜', '약국'],
         a='감기 증상을 덜어 주는 아세트아미노펜(타이레놀)·항히스타민제는 가까운 의원·약국에서 받아도 괜찮습니다. 하지만 비스테로이드성 소염진통제는 증상을 악화시킬 수 있고, 불필요한 항생제도 장염을 일으켜 증상을 악화시킬 수 있어 피하는 것이 좋습니다(대한장연구학회). '
           '약국·의원에서는 병명과 먹는 약을 꼭 알리십시오.',
         foods=[],
         ev=[E('r41_kasid_brochures', '브로셔 No.9 FAQⅠ 감기에 걸리면', '아세트아미노펜(타이레놀)이나 항히스타민제와 같이 감기의 증상을 완화하기 위한 약은 가까운 의원이나 약국에서 투약 받아도 무방합니다. 그러나 비스테로이드성항염증제 등의 소염진통제 복용은 염증성 장질환 증상을 악화시킬 수 있고, 불필요한 항생제 사용시 이와 관련된 장염이 발생할 수 있으며 이 역시 염증성 장질환 증상을 악화 시킬 수 있어 피하는 것이 좋습니다.'),
             E('r41_kasid_brochures', '브로셔 No.9 FAQⅠ 감기에 걸리면', '또한 가까운 의원이나 약국에 방문하는 경우 자신의 병명과 현재 복용하고 있는 약제에 대하여 꼭 미리 알리도록 합니다.')]),
    dict(id='vaccine', cat='약·건강', q='예방접종은 어떻게 해야 합니까?',
         kw=['예방접종', '백신', '독감', '대상포진', '폐렴구균', '생백신'],
         a='면역억제 치료 등으로 감염에 걸리기 쉬워, 진단 때부터 주치의와 예방접종 계획을 세우라고 대한장연구학회는 안내합니다. 생백신(MMR·수두·대상포진 생백신 등)은 면역억제 치료 기간에는 금기입니다. '
           'ACG는 50세 이상 IBD 환자에게 2회 접종하는 재조합(사백신) 대상포진 백신을 권합니다.',
         foods=[],
         ev=[E('r41_kasid_brochures', '브로셔 No.5 예방접종', '염증성 장질환 환자는 진단 시부터 반드시 주치의와 상의하여 예방접종 계획을 세워야 합니다.'),
             E('r41_kasid_brochures', '브로셔 No.5 예방접종', '생백신: 면역억제 치료 기간에는 금기.'),
             E('r42_acg_preventive', 'Recommendation 4', 'In all adults 50 and older with IBD, we suggest vaccination against herpes zoster with the 2-dose inactive recombinant herpes zoster vaccine')]),
    dict(id='smoking', cat='약·건강', q='담배는 어떻습니까?',
         kw=['담배', '흡연', '금연', '전자담배'],
         a='대한장연구학회는 금주와 함께 금연을 필수로 안내합니다. ACG도 담배를 피우는 IBD 환자에게 금연 상담을 강하게 권합니다.',
         foods=[],
         ev=[E('r41_kasid_brochures', '브로셔 No.5 일상생활을 잘 하기 위한 10가지 Tip', '금주 및 금연은 필수입니다!'),
             E('r42_acg_preventive', 'Recommendation 12', '12. In adults with IBD who smoke, we suggest that they should be counseled to quit (Strong recommendation, low certainty of evidence)')]),
    dict(id='pregnancy', cat='약·건강', q='임신 중에도 약을 계속 먹어야 합니까?',
         kw=['임신', '임산부', '수유', '임신 약', '출산'],
         a='메토트렉세이트와 소분자 약제를 빼면 대부분의 약은 임신 중에도 안전한 것으로 여겨집니다. 약을 끊어 병이 나빠지면 태아에게 나쁜 영향을 줄 수 있어, 주치의와 상의해 계속 먹어야 합니다(대한장연구학회). '
           '설파살라진을 먹는다면 엽산을 하루 2mg까지 충분히 먹도록 안내합니다.',
         foods=[],
         ev=[E('r41_kasid_brochures', '브로셔 No.7 임신과 수유', '임신 중 메토트렉세이트와 소분자 약제를 제외한 대부분의 염증성 장질환 약제의 사용은 안전한 것으로 여겨지고 있습니다. 따라서, 약제 복용 중단으로 인한 질병의 악화가 태아에게 나쁜 영향을 줄 수 있으므로 임신 기간 동안 주치의와 상의해 복용을 지속해야 합니다.')]),
    dict(id='dietitian', cat='약·건강', q='영양 상담을 받아야 합니까?',
         kw=['영양사', '영양 상담', '식사 상담', '상담'],
         a='ECCO는 의료진에게 특별한 식이요법을 권유받지 않았다면 일반인과 같은 건강한 식생활 지침을 따르고, 모든 IBD 환자가 IBD 경험이 있는 영양사의 도움을 받을 수 있어야 한다고 합니다. '
           '식사 제한이 흔해 열량·영양소가 부족해지기 쉬우니, 먹는 양을 점검받는 것이 좋습니다.',
         foods=[],
         ev=[E('r50_ecco_2025', 'Statement 1', 'In the absence of a specific dietary intervention that is recommended by an IBD healthcare professional, healthy eating guidelines should be followed by people with IBD, as recommended for the general population.'),
             E('r50_ecco_2025', 'Statement 2', 'All people with IBD should have access to a dietitian with experience in IBD.'),
             E('r50_ecco_2025', 'Statement 35', 'Assessment of dietary intake in people with IBD is recommended, as dietary restriction is common, often resulting in inadequate energy and nutrient intake.')]),

    # ───────────── 생활 ─────────────
    dict(id='cause', cat='생활', q='음식이나 스트레스 때문에 생긴 병입니까?',
         kw=['원인', '스트레스', '왜 생겼', '유전', '음식 때문'],
         a='정확한 원인은 아직 밝혀지지 않았습니다. 대한장연구학회는 이 병이 음식이나 스트레스 때문에 생긴 것이 아니고, 환자 탓으로 생기는 병이 아니라고 안내합니다. '
           '스트레스 뒤에 재발하기도 하지만 스트레스가 원인인지는 분명하지 않습니다.',
         foods=[],
         ev=[E('r41_kasid_brochures', '브로셔 No.9 FAQⅠ 염증성 장질환에 왜 걸리나요?', '아직 정확한 발병 원인이 알려져 있지 않습니다.'),
             E('r41_kasid_brochures', '브로셔 No.9 FAQⅠ', '전염 되지도 않고, 성관계로 옮기지도 않고, 음식 때문에 발생한 것도 아니고, 스트레스에 의해서 발생하지도 않습니다. 분명한 것은 염증성 장질환은 환자분의 탓으로 발생하는 병이 아니라는 것입니다.'),
             E('r41_kasid_brochures', '브로셔 No.5 스트레스', '정신적 스트레스를 받은 후에 염증성 장질환이 재발하기도 하지만, 아직 스트레스가 원인이 되는지는 분명하지 않습니다.')]),
    dict(id='stress', cat='생활', q='스트레스·우울감은 어떻게 다룹니까?',
         kw=['스트레스', '우울', '불안', '명상', '마음', '상담'],
         a='독서·일기·명상·상담이 도움이 되고, 이런 증상이 거의 2주 이상 일상생활을 방해하면 정신건강의학과 전문의 상담을 받아 보라고 대한장연구학회는 안내합니다. '
           '주치의·가족·친구에게 상황을 이야기하는 것만으로도 도움이 될 수 있습니다.',
         foods=[],
         ev=[E('r41_kasid_brochures', '브로셔 No.5 스트레스', '스트레스, 불안감, 우울감, 초조함 등의 문제가 있다면, 독서, 일기, 명상, 상담 등이 도움이 되며, 만약 이런 증상으로 거의 2주 이상 일상생활에 방해가 된다면 정신건강의학 전문의의 상담을 받아보는 것이 좋습니다.'),
             E('r41_kasid_brochures', '브로셔 No.9 FAQⅠ 우울한 생각이 들거나 마음이 힘들 때', '많은 경우 담당주치의나 염증성 장질환의 증상을 알고 있는 주변 사람들에게 당신의 상황을 이야기하는 것 만으로도 도움이 될 수 있습니다.')]),
    dict(id='eating_out', cat='생활', q='회식·외식 자리에서는 어떻게 해야 합니까?',
         kw=['회식', '외식', '모임', '식당', '도시락', '배달'],
         a='회식에서 술이나 특정 음식은 먹지 않더라도 모임에는 참여하고, 가능하면 대신 먹을 도시락이나 음료를 미리 준비하라고 대한장연구학회는 안내합니다. 양념이 많은 음식보다 담백하고 부드러운 음식을 고르십시오. '
           '메뉴가 괜찮은지는 \'외식 판정\'에서 재료와 함께 확인할 수 있습니다.',
         foods=[],
         ev=[E('r41_kasid_brochures', '브로셔 No.5 일상생활을 잘 하기 위한 10가지 Tip', '회식에서 술이나 특정 음식은 먹지 못하지만 모임에는 열심히 참여하는 이미지를 심어 줍니다. (가능하면 대신할 수 있는 도시락이나 음료를 미리 준비합니다)'),
             E('r41_kasid_brochures', '브로셔 No.9 FAQⅠ', '양념이 많이된 음식보다는 담백하고 부드러운 음식이 좋습니다.')]),
    dict(id='travel', cat='생활', q='여행 갈 때 음식은 어떻게 해야 합니까?',
         kw=['여행', '해외여행', '비행기', '기내식', '길거리 음식', '생수'],
         a='여행 전에 주치의와 상의해 약을 넉넉히 처방받고(필요하면 영문 소견서), 기내에서는 미리 신청한 특별식을 먹고 탄산음료는 피합니다. '
           '여행지에서는 생수나 끓인 물을 마시고 길거리 음식은 피합니다. 37.5℃ 이상의 고열, 많은 혈변, 계속되는 심한 복통이 있으면 현지 의료기관에 바로 가십시오(대한장연구학회).',
         foods=[],
         ev=[E('r41_kasid_brochures', '브로셔 No.5 행복한 여행을 위한 10가지 TIP 1', '여행 전 주치의 진료를 통하여 여행지에 따른 예방접종, 비상약을 포함한 충분한 약제처방을 받고 소견서도 준비합니다(필요 시 영문 소견서도 준비).'),
             E('r41_kasid_brochures', '브로셔 No.5 행복한 여행을 위한 10가지 TIP 4', '기내에서 음식은 되도록 미리 신청한 특별식을 먹고 가스 생성이 많은 탄산음료는 피합니다.'),
             E('r41_kasid_brochures', '브로셔 No.5 행복한 여행을 위한 10가지 TIP 6', '여행지에서 물은 생수를 마시고 생수가 없다면 끓인 물을 이용하고 길거리 음식은 피합니다.'),
             E('r41_kasid_brochures', '브로셔 No.5 행복한 여행을 위한 10가지 TIP 7', '고열(37.5℃ 이상), 오한, 다량의 혈성(혈액이 섞인) 설사, 지속적인 심한 복통 등이 있는 경우 치료를 미루지 않습니다(현지 의료기관에 방문하도록 합니다).')]),
]


def norm(s):
    """공백·줄바꿈과 제어 문자(PDF에서 뽑을 때 섞이는 \x07 등)를 모두 지운 비교용 문자열."""
    return ''.join(ch for ch in str(s) if not ch.isspace() and unicodedata.category(ch) != 'Cc')


def find_quote(text, ev, gap=300):
    """인용문이 원문에 있으면 True. parts가 있으면 각 조각이 순서대로, 조각 사이가 gap자 안에 있어야 한다."""
    t = norm(text)
    if 'parts' not in ev:
        return norm(ev['q']) in t
    parts = [norm(p) for p in ev['parts']]
    if ''.join(parts) != norm(ev['q']):
        return False
    i = t.find(parts[0])
    while i >= 0:
        pos, ok = i + len(parts[0]), True
        for k in parts[1:]:
            j = t.find(k, pos, pos + gap + len(k))
            if j < 0:
                ok = False
                break
            pos = j + len(k)
        if ok:
            return True
        i = t.find(parts[0], i + 1)
    return False


def build():
    """앱에 넣을 Q&A 목록(JSON으로 바꿀 수 있는 값). 참고문헌 번호는 근거 파일에서 뽑는다."""
    out = []
    for x in QA:
        refs = []
        ev = []
        for e in x['ev']:
            n, name = SRC[e['src']]
            if n not in refs:
                refs.append(n)
            ev.append({'s': name, 'loc': e['loc'], 'q': e['q'], 'r': n})
        out.append({'id': x['id'], 'cat': x['cat'], 'q': x['q'], 'kw': x['kw'], 'a': x['a'],
                    'refs': refs, 'foods': x['foods'], 'ev': ev})
    return out


if __name__ == '__main__':
    import os
    import sys
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sd = os.path.join(root, 'data', 'sources')
    bad = 0
    for x in QA:
        for e in x['ev']:
            p = os.path.join(sd, e['src'] + '.txt')
            if not os.path.exists(p):
                print('원문 없음(건너뜀):', e['src'])
                continue
            with open(p, encoding='utf-8') as f:
                if not find_quote(f.read(), e):
                    bad += 1
                    print('불일치:', x['id'], e['src'], e['q'][:40])
    print('Q&A', len(QA), '개 · 근거', sum(len(x['ev']) for x in QA), '건 · 불일치', bad)
    sys.exit(1 if bad else 0)
