# -*- coding: utf-8 -*-
"""v1.11.0 데이터 규칙 단위 점검(v1.10.0 검토 보고서 반영분). 실행: python3 -m unittest discover -s tests/python -v

- M2: 시판 제품 표시는 데이터를 만들 때 정한다(포장 표시에서 옮긴 과자·사탕·젤리, 환자용 영양식 포함, 이름만 있는 일반 메뉴는 제외)
"""
import json, os, re, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()


GEN = json.loads(read('src', 'data', 'generated', 'gen_out.json'))
APP_SRC = read('src', 'app', 'app.src.html')


def foods():
    """gen_out의 LF(...) → {id: (이름, 분류, 태그)}"""
    out = {}
    for s in GEN['foods']:
        m = re.match(r'LF\("([^"]+)","((?:[^"\\]|\\.)*)","([^"]+)",\d+,(\[[^\]]*\]),', s)
        assert m, s[:80]
        out[m.group(1)] = (json.loads('"%s"' % m.group(2)), m.group(3), json.loads(m.group(4)))
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
        ons = [i for i, (_, _, tags) in FOODS.items() if 'ons' in tags]
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


if __name__ == '__main__':
    unittest.main()
