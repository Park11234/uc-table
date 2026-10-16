# -*- coding: utf-8 -*-
"""v1.11.0 데이터 규칙 단위 점검(v1.10.0 검토 보고서 반영분). 실행: python3 -m unittest discover -s tests/python -v

- M2: 시판 제품 표시는 데이터를 만들 때 정한다(포장 표시에서 옮긴 과자·사탕·젤리, 환자용 영양식 포함, 이름만 있는 일반 메뉴는 제외)
- M3: 훈제오리는 햄과 같은 방식(앱에 넣은 시판 훈제오리 가운데 발색제가 든 비율, 절반 이상이면 절대 금지), 햄이 흔히 들어가는 일반 음식에 표시
"""
import json, os, re, sys, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, 'src', 'data'))

import brand10  # noqa: E402


def read(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()


GEN = json.loads(read('src', 'data', 'generated', 'gen_out.json'))
APP_SRC = read('src', 'app', 'app.src.html')


def foods():
    """gen_out의 LF(...) → {id: (이름, 분류, 태그, 시작 단계, 설명)}"""
    out = {}
    for s in GEN['foods']:
        m = re.match(r'LF\("([^"]+)","((?:[^"\\]|\\.)*)","([^"]+)",(\d+),(\[[^\]]*\]),\d+,"(?:[^"\\]|\\.)*",(.*),(\[[^\]]*\])\)$', s)
        assert m, s[:80]
        w = m.group(6)
        why = json.loads(w) if w.startswith('"') else ''
        out[m.group(1)] = (json.loads('"%s"' % m.group(2)), m.group(3), json.loads(m.group(5)), int(m.group(4)), why)
    return out


FOODS = foods()
PROD = set(GEN['prod'].split())


class ProdFlagTest(unittest.TestCase):
    def test_prod_ids_exist(self):
        self.assertEqual(sorted(PROD - set(FOODS)), [])

    def test_label_and_shop_data_are_prod(self):
        for key in ('ingr', 'plabel', 'psrc'):
            self.assertEqual(sorted(set(GEN[key]) - PROD), [], key)

    def test_ons_all_prod(self):
        ons = [i for i, (_, _, tags, _, _) in FOODS.items() if 'ons' in tags]
        self.assertGreaterEqual(len(ons), 26)
        self.assertEqual([i for i in ons if i not in PROD], [])

    def test_brand_snacks_prod(self):
        for i in ('goraebap', 'chocopie', 'mygummy', 'wangkkumteuri', 'aishe_plum', 'pokachip_cheese'):
            self.assertIn(i, PROD, i)

    def test_generic_foods_not_prod(self):
        for i in ('tteokkochi', 'crackers', 'potato_chips', 'milk_chocolate', 'gummy', 'salmon_don', 'ham_toast'):
            self.assertNotIn(i, PROD, i)

    def test_app_reads_only_prod_list(self):
        self.assertIn('const isProd=f=>PROD.has(f.id);', APP_SRC)
        self.assertIn('/*@GEN:prod@*/', APP_SRC)


class HamRuleTest(unittest.TestCase):
    def test_smoked_duck_follows_market_products(self):
        duck = [p for p in brand10.P if re.search(r'훈제\s*오리|오리\s*훈제', p['name'])]
        n, tot = sum(1 for p in duck if p['nit']), len(duck)
        self.assertGreaterEqual(tot, 1)
        _, _, tags, ms, why = FOODS['smoked_duck']
        self.assertEqual(ms, 9)
        self.assertEqual('nitrite' in tags, n * 2 >= tot)
        self.assertIn('시판 훈제오리 %d종 가운데 %d종' % (tot, n), why)

    def test_ham_optional_dishes_marked(self):
        for i in ('gimbap', 'omurice', 'veg_fried_rice', 'kimchi_fried_rice'):
            self.assertIn('hamopt', FOODS[i][2], i)
            self.assertNotIn('nitrite', FOODS[i][2], i)
        self.assertIn('const HAM_NOTE="햄·소시지가 들어가면 절대 금지입니다. 빼고 드십시오.";', APP_SRC)


if __name__ == '__main__':
    unittest.main()
