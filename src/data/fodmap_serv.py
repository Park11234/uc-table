# -*- coding: utf-8 -*-
"""FODMAP 1회량 기준(v1.8.0): Monash 앱의 신호등처럼 '얼마까지 낮은지'와 '어떤 FODMAP인지'를 음식별로 정리한다.

- 숫자는 근거 자료에 적힌 양만 쓴다. 자료에 없는 단계(중간·높음)는 None으로 두고 앱에는 '확인 안 됨'으로 보인다.
- 성분(grp)은 자료가 그 음식(또는 그 음식이 속한 무리)의 주된 FODMAP을 밝힌 경우에만 적는다.
  Monash 'High and low FODMAP foods'(근거 20): 과일은 솔비톨·과당, 채소는 프럭탄·만니톨,
  곡류는 프럭탄(덜하게 GOS), 콩류는 GOS, 유제품은 유당, 캐슈너트·피스타치오는 GOS·프럭탄.
- src: 'monash'(Monash 대학 자료, 1차) / 'fe'(FODMAP Everyday가 Monash 앱 결과를 옮긴 것, 2차)
- checked: 근거를 마지막으로 확인한 날
각 항목: id: (low, mid, high, grp, refs, src, checked)
  low/mid/high = (그램 또는 None, '가정 단위 설명') 또는 None, 단위가 ml인 음료는 설명에 ml로 적는다.
"""

G = 'fructan'; GOS = 'gos'; LAC = 'lactose'; FRU = 'fructose'; SOR = 'sorbitol'; MAN = 'mannitol'; POL = 'polyol'
D0927 = '2026-09-27'; D1006 = '2026-10-06'

FSERV = {
    # 곡류·면
    'oatmeal': ((52, '마른 귀리 1/2컵'), None, None, [], [20, 55], 'monash', D0927),
    'brown_rice': ((180, '밥 1컵'), None, None, [], [24, 55], 'monash', D0927),
    'sweet_potato': ((75, ''), (100, ''), (112, ''), [MAN], [52], 'monash', D0927),
    'corn': ((38, '반 개(알갱이 1/2컵 75g도 낮음)'), None, (None, '한 개'), [], [55, 58], 'fe', D1006),
    'soba': ((90, '삶은 면 1/3컵'), None, None, [], [55, 58], 'fe', D0927),
    'naengmomil': ((90, '삶은 면 1/3컵'), None, None, [], [55, 58], 'fe', D0927),
    'oat_drink': ((None, '104ml'), None, (None, '250ml'), [], [52], 'monash', D0927),
    'barley_rice': (None, None, None, [G], [52, 20], 'monash', D1006),
    # 콩류·두부
    'lentil': ((23, '빨간 렌틸콩 삶은 것 · 통조림 갈색·녹색은 46g'), None, None, [GOS], [58, 23, 20], 'fe', D1006),
    'hummus': ((None, '통조림 병아리콩 1/4컵'), None, None, [GOS], [23, 20], 'monash', D1006),
    'tofu': ((160, '단단한 두부 2/3컵'), None, None, [], [21, 55], 'monash', D0927),
    # 채소
    'zucchini': ((65, ''), None, None, [], [52], 'monash', D0927),
    'pumpkin': ((75, '껍질째 생것으로 시험'), (162, ''), (206, ''), [], [55, 58], 'fe', D1006),
    'spinach': ((75, ''), None, None, [], [52], 'monash', D0927),
    'eggplant': ((75, ''), None, None, [SOR], [20, 52], 'monash', D0927),
    'broccoli': ((75, '꽃송이 3/4컵'), (208, ''), (279, ''), [G, FRU], [20, 58], 'fe', D1006),
    'cabbage': ((75, '3/4컵'), None, None, [G], [52, 58], 'fe', D1006),
    'kale': ((None, '1컵'), None, None, [], [52], 'monash', D0927),
    'brussels': (None, None, (75, ''), [G], [52], 'monash', D0927),
    'cherry_tomato': ((45, '3개'), None, None, [FRU], [55], 'monash', D0927),
    'celery': ((10, '줄기 1/4대'), None, None, [MAN], [20, 58], 'fe', D1006),
    'oyster_mushroom': ((75, ''), None, None, [MAN], [55, 20], 'monash', D0927),
    'shiitake': ((7, '말린 것 약 2개'), None, None, [MAN], [58, 20], 'fe', D0927),
    'button_mushroom': (None, None, None, [MAN], [20], 'monash', D1006),
    'mushroom': (None, None, None, [MAN], [20], 'monash', D1006),
    'seaweed': ((5, '1작은술'), (10, ''), None, [MAN], [58], 'fe', D0927),
    'laver': ((5, '2장'), None, None, [], [58], 'fe', D0927),
    'kimchi': ((47, '약 1/3컵'), None, None, [], [58], 'fe', D0927),
    'onion': (None, None, None, [G], [20], 'monash', D1006),
    'garlic': (None, None, None, [G], [20], 'monash', D1006),
    # 과일
    'banana': ((37, '잘 익은 것 1/3개 · 단단한 바나나는 95g까지 낮음'), None, None, [G], [52, 58], 'fe', D1006),
    'avocado': ((60, '예전에는 30g으로 안내'), None, None, [POL], [22, 58], 'fe', D1006),
    'blueberry': ((125, ''), None, None, [G], [20, 58], 'fe', D1006),
    'kiwi': ((150, '작은 것 2개'), None, None, [G], [20, 58], 'fe', D1006),
    'orange': ((130, '중간 1개'), None, None, [], [20, 58], 'fe', D0927),
    'mandarin': ((90, '중간 1개'), None, None, [], [20, 58], 'fe', D0927),
    'strawberry': ((65, '중간 5개'), None, None, [], [20, 58], 'fe', D0927),
    'grape': ((None, '2알'), None, (None, '3알부터'), [FRU], [58], 'fe', D0927),
    'shine_muscat': ((None, '2알'), None, (None, '3알부터'), [FRU], [58], 'fe', D0927),
    'stevia_grape': ((None, '2알'), None, (None, '3알부터'), [FRU], [58], 'fe', D0927),
    'lychee': ((30, '생 리치 3개'), None, None, [], [55, 58], 'fe', D0927),
    'pineapple': ((140, '생것 1컵'), None, None, [], [20, 58], 'fe', D0927),
    'grapefruit': ((80, ''), None, None, [], [58], 'fe', D1006),
    'orange_juice': ((None, '125ml'), None, None, [], [58], 'fe', D0927),
    'dragon_fruit': ((330, '중간 1개'), None, None, [], [55, 58], 'fe', D0927),
    'apple': ((20, '핑크레이디 20g·그래니스미스 25g'), None, None, [FRU, SOR], [20, 58], 'fe', D1006),
    'applesauce': ((3, '약 3/4작은술'), None, None, [FRU, SOR], [58, 20], 'fe', D1006),
    'pear': (None, None, None, [FRU, SOR], [20], 'monash', D1006),
    'mango': (None, None, None, [FRU], [20], 'monash', D1006),
    'watermelon': (None, None, None, [FRU], [20], 'monash', D1006),
    'peach': ((30, '황도 웨지 1조각'), None, None, [SOR], [20, 58], 'fe', D1006),
    'canned_peach': (None, None, (80, '국물 뺀 것 1/2컵'), [G, SOR], [58, 20], 'fe', D1006),
    'cherry': (None, None, None, [FRU, SOR], [20], 'monash', D1006),
    'stevia_cherry': (None, None, None, [FRU, SOR], [20], 'monash', D1006),
    'fig': (None, None, None, [FRU], [20], 'monash', D1006),
    'strawberry_jam': ((40, '2큰술'), None, None, [], [58], 'fe', D0927),
    # 유제품
    'milk': (None, None, None, [LAC], [20], 'monash', D1006),
    'yogurt': (None, None, None, [LAC], [20], 'monash', D1006),
    'greek_yogurt': (None, None, None, [LAC], [20], 'monash', D1006),
    'yogurt_plain_unsw': (None, None, None, [LAC], [20], 'monash', D1006),
    'drink_yogurt': (None, None, None, [LAC], [20], 'monash', D1006),
    'cream_cheese': (None, (80, ''), None, [LAC], [52], 'monash', D0927),
    'milk_chocolate': (None, (30, '5조각'), None, [LAC], [52], 'monash', D0927),
    # 견과·씨앗
    'nuts': ((30, '호두 10알'), None, None, [], [20, 55], 'monash', D0927),
    'almond': ((12, '10알'), None, (None, '한 줌'), [], [52, 58], 'monash', D1006),
    'pine_nut': ((8, ''), (9, ''), (30, ''), [G, GOS], [58], 'fe', D1006),
    'sunflower_seed': ((6, '2작은술'), None, None, [], [52], 'monash', D0927),
    'chia': ((24, '2큰술'), None, None, [], [52], 'monash', D0927),
    'tahini': ((30, ''), None, None, [], [52], 'monash', D0927),
    'sesame_seed': ((30, ''), None, None, [], [52], 'monash', D0927),
    # 당류
    'honey': (None, None, None, [FRU], [20], 'monash', D1006),
    # v1.8.0 크롬으로 FODMAP Everyday 재료 페이지 확인(2026-10-06): Monash 앱 결과를 옮긴 2차 자료
    'radish': ((75, '1/2컵(흰 무)'), (279, ''), (350, ''), [], [58, 52], 'fe', D1006),
    'napa': ((75, '1컵'), (500, '프럭탄'), None, [G], [58, 52], 'fe', D1006),
    'bok_choy': ((75, '1컵'), None, None, [], [58, 20], 'fe', D1006),
    'melon': ((120, '3/4컵 · 150g 넘으면 프럭탄에 주의'), None, None, [G], [58, 20], 'fe', D1006),
    'potato': ((75, '1/2컵 · 500g까지 낮게 시험됨'), None, None, [], [58, 20], 'fe', D1006),
    'quinoa': ((None, '익힌 것 1컵(155g)'), None, None, [], [58, 24], 'fe', D1006),
    'peanut_butter': ((None, '2큰술(호주 큰술)'), None, None, [], [58], 'fe', D1006),
    'cauliflower': (None, None, (75, '3/4컵(더 적은 양은 시험 안 됨)'), [MAN], [58, 20], 'fe', D1006),
}


def build(food_ids=None):
    out = {}
    for k, (lo, mid, hi, grp, refs, src, chk) in FSERV.items():
        if food_ids is not None and k not in food_ids:
            continue
        cell = lambda x: None if x is None else [x[0], x[1]]
        out[k] = {'lo': cell(lo), 'mid': cell(mid), 'hi': cell(hi), 'grp': grp, 'refs': refs, 'src': src, 'chk': chk}
    return out


if __name__ == '__main__':
    print(len(FSERV), 'foods')
