# -*- coding: utf-8 -*-
"""v1.13.0 단위 점검. 실행: python3 -m unittest discover -s tests/python -v

- 8번(2026-11-01): 판매처 알레르기 표시가 있어도 원재료명 검사를 함께 한다. 예전에는 표시가 있으면 원재료를 보지 않아
  표시 의무가 없는 참깨·생선·견과나 표시에서 빠진 대두·밀 등을 놓쳤다(CJ 제품 615개 중 179개). '이산화황' 표시는 아황산류
"""
import os, sys, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, 'src', 'data'))
import spec10  # noqa: E402


def prod(al, ing, name='시험 제품'):
    return {'al': al, 'ing': ing, 'names': [name], 'ty': '즉석조리식품', 'cat': '', 'mat': '0'}


class AllergenUnionTest(unittest.TestCase):
    def tags(self, p):
        return spec10.tags_of(p, 'meal', '곡류', [100, 'g'])[0]

    def test_ingredient_allergen_not_on_label_is_kept(self):
        t = self.tags(prod('대두, 밀, 쇠고기 함유', '쌀, 쇠고기, 간장(대두, 밀), 참기름, 참깨'))
        self.assertIn('sesame', t)
        self.assertTrue({'soy', 'wheat', 'beef'} <= set(t))

    def test_label_says_none_but_ingredients_have_milk(self):
        self.assertIn('dairy', self.tags(prod('없음', '설탕, 탈지분유, 유청분말')))

    def test_sulfur_dioxide_label_is_sulfite(self):
        self.assertIn('sulfite', self.tags(prod('계란, 대두, 밀, 이산화황 함유', '쌀, 계란')))

    def test_refined_oil_is_still_not_soy(self):
        self.assertNotIn('soy', self.tags(prod('', '쌀, 대두유')))

    def test_built_products_cover_ingredient_allergens(self):
        missed = []
        for p in spec10.P:
            ing = set(spec10.allergens_from_ing(p['ing']))
            t = set(self.tags(p))
            if not ing <= t:
                missed.append((p['names'][0], sorted(ing - t)))
        self.assertEqual(missed, [], missed[:5])


class LookAlikeWordTest(unittest.TestCase):
    """2026-11-01 외부 검토: 다른 낱말 속의 '콩'·'버터'·'밀'·'케찹'·'사과'를 알레르기·FODMAP으로 읽지 않는다"""
    def ing(self, text):
        return set(spec10.allergens_from_ing(text))

    def test_not_soy(self):
        for w in ['로커스트콩검', '땅콩', '강낭콩', '렌틸콩', '병아리콩(이집트콩)', '완두콩', '루핀콩', '홍콩산 굴소스', '콩기름']:
            self.assertNotIn('soy', self.ing(w), w)
        for w in ['검은콩', '콩나물', '생콩가루', '대두', '두부']:
            self.assertIn('soy', self.ing(w), w)
        self.assertEqual(spec10.allergens_from_label('땅콩 함유'), ['peanut'])
        self.assertIn('soy', spec10.allergens_from_label('대두, 밀 함유'))

    def test_not_dairy_wheat_tomato(self):
        for w in ['코코아버터', '카카오버터', '땅콩버터', '피넛버터']:
            self.assertNotIn('dairy', self.ing(w), w)
        self.assertIn('dairy', self.ing('버터(우유)'))
        for w in ['오트밀', 'α-아밀라아제']:
            self.assertNotIn('wheat', self.ing(w), w)
        self.assertIn('wheat', self.ing('통밀가루'))
        self.assertNotIn('tomato', self.ing('케찹마니스'))
        self.assertIn('tomato', self.ing('토마토케첩'))

    def test_products_from_review(self):
        def tags(name):
            p = next(x for x in spec10.P if x['names'][0] == name)
            return spec10.tags_of(p, 'meal', '곡류', [100, 'g'])[0]
        self.assertNotIn('soy', tags('쁘띠첼 과일젤리 복숭아'))
        self.assertNotIn('soy', tags('상하목장 그릭요거트 플레인 파르페'))
        t = tags('피넛버터앤코 땅콩버터 스무스 오퍼레이터')
        self.assertIn('peanut', t)
        self.assertFalse({'soy', 'dairy'} & set(t), t)
        self.assertNotIn('dairy', tags('브로드카세 72시간 진한 초코 사워도우 깜빠뉴 하프'))

    def test_fodmap_malic_acid_and_found_words(self):
        p = dict(names=['시험 단무지'], ty='절임식품', ing='무, 정제수, 구연산, 사과산, 효소처리스테비아', al='', mat='0')
        lv, txt, _ = spec10.fodmap(p, 'pickle', [])
        self.assertNotIn('사과', txt)
        p['ing'] = '쌀, 올리고당, 양파'
        lv, txt, _ = spec10.fodmap(p, 'other', [])
        self.assertIn('올리고당', txt)
        self.assertNotIn('꿀', txt)


if __name__ == '__main__':
    unittest.main()
