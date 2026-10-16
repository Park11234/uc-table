# -*- coding: utf-8 -*-
"""v1.10.0 데이터 규칙 단위 점검(점검 보고서 반영분). 실행: python3 -m unittest discover -s tests/python -v

- 개발자 1: 절대 금지·늘 피하기 음식의 설명에 '조금만·소량만·자주 먹지 않습니다'처럼 먹어도 된다고 읽히는 말이 없다
- 개발자 2·디자인 5: 용량만 다른 같은 제품 묶음(대표가 가장 엄격, 옛 id는 대표로 이어짐), 이름 끝 용량을 따로
- 개발자 3: 일반 햄·소시지·베이컨(부대찌개·핫도그·햄 토스트 포함)은 절대 금지, 문장의 숫자는 자료에서 다시 센 값과 같다
- 개발자 4: 모든 음식에 확인 날짜(넣은 날)가 있다. 1년 점검 같은 날짜 계산은 하지 않는다
- 개발자 5: 외식 메뉴(spec11)는 식약처 음식 자료의 같은 이름 행을 쓰고(없으면 영양값 없이), 판정 기준이 다른 음식과 같다
- 앱 버전 표시(APP_VER)는 package.json과 같다
"""
import json, os, re, sys, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D = os.path.join(ROOT, 'src', 'data')
sys.path.insert(0, D)

import spec10  # noqa: E402
import spec11  # noqa: E402
from templates import T as TPL  # noqa: E402


def read(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()


GEN = json.loads(read('src', 'data', 'generated', 'gen_out.json'))
APP_SRC = read('src', 'app', 'app.src.html')
EAT_ADVICE = re.compile(r'소량|조금만|자주 먹지 않|양을 보며')


def foods():
    """gen_out의 LF(...) → (id, 이름, 분류, 시작 단계, 태그, 설명). CW(번호, 제품 문장)는 펼친다"""
    out = []
    for s in GEN['foods']:
        m = re.match(r'LF\("([^"]+)","((?:[^"\\]|\\.)*)","([^"]+)",(\d+),(\[[^\]]*\]),\d+,"(?:[^"\\]|\\.)*",(.*),(\[[^\]]*\])\)$', s)
        assert m, s[:80]
        i, nm, cat, ms, tags, w = m.group(1), json.loads('"%s"' % m.group(2)), m.group(3), int(m.group(4)), json.loads(m.group(5)), m.group(6)
        cw = re.match(r'CW\((\[[^\]]*\]),("(?:[^"\\]|\\.)*")\)$', w)
        why = ' '.join([GEN['cjt'][k] for k in json.loads(cw.group(1))] + ([json.loads(cw.group(2))] if json.loads(cw.group(2)) else [])) if cw else json.loads(w)
        out.append((i, nm, cat, ms, tags, why))
    return out


FOODS = foods()
BY = {x[0]: x for x in FOODS}


class BanTextTest(unittest.TestCase):
    def test_no_eating_advice_in_ban_or_ms9(self):
        bad = [(i, EAT_ADVICE.findall(w)) for i, _, _, ms, tags, w in FOODS if ('nitrite' in tags or ms == 9) and EAT_ADVICE.search(w)]
        self.assertEqual(bad, [], bad[:5])

    def test_nitrite_is_always_stage9(self):
        self.assertEqual([i for i, _, _, ms, tags, _ in FOODS if 'nitrite' in tags and ms != 9], [])

    def test_ban_templates_exist_and_clean(self):
        for k, v in spec10.BAN_KEY.items():
            self.assertIn(k, spec10.T10)
            self.assertIn(v, spec10.T10)
            self.assertFalse(EAT_ADVICE.search(spec10.T10[v][0]), v)


class GenericHamTest(unittest.TestCase):
    def ham_counts(self):
        """시판 햄·소시지·베이컨(spec10 그림 기준) 가운데 발색제가 든 것 / 전체"""
        ic = {spec10.ICON['ham'], spec10.ICON['sausage'], spec10.ICON['bacon']}
        xs = [x for x in spec10.TR10 if x[8] in ic and 'processed' in x[5]]
        return sum(1 for x in xs if 'nitrite' in x[5]), len(xs)

    def test_generic_ham_is_ban_and_numbers_match_data(self):
        n, tot = self.ham_counts()
        m = re.search(r'F\("ham","햄·소시지·베이컨"[^\n]*', APP_SRC)
        self.assertTrue(m)
        self.assertIn('"nitrite"', m.group(0))
        self.assertIn('제품 %d종 가운데 %d종' % (tot, n), m.group(0))
        self.assertIn('%d종 가운데 %d종' % (tot, n), TPL['nitrite_generic'][0])

    def test_generic_dishes_with_ham_are_ban(self):
        for i in ('budae_jjigae', 'hotdog', 'ham_toast'):
            self.assertIn('nitrite', BY[i][4], i)
            self.assertEqual(BY[i][3], 9, i)


class FamilyTest(unittest.TestCase):
    def test_families(self):
        ids = {x[0] for x in spec10.TR10}
        self.assertGreaterEqual(len(spec10.FAM10), 10)
        for rep, members in spec10.FAM10.items():
            self.assertIn(rep, ids)
            self.assertEqual(members[0][0], rep)
            for m in members[1:]:
                self.assertNotIn(m[0], ids, m[0])
                self.assertEqual(spec10.IDMAP10[m[0]], rep)
        for old, new in GEN['idmap'].items():
            self.assertNotIn(old, BY)
            self.assertIn(new, BY)

    def test_rep_is_strictest(self):
        # 묶은 제품의 판정 태그(영양값 기준 태그 포함)는 대표가 모두 가진다 → 묶어도 판정이 느슨해지지 않는다
        self.assertIn('cj214027', spec10.FAM10)
        self.assertEqual(spec10.IDMAP10.get('cj207444'), 'cj214027')

    def test_size_split_from_name(self):
        tail = re.compile(r'\d+(?:\.\d+)?\s*(?:g|kg|ml|L)$')
        names = [x[1] for x in spec10.TR10]
        stuck = [n for n in names if re.search(r'[가-힣]\d+(?:g|ml)$', n)]   # '물만두278g'처럼 붙은 용량
        self.assertEqual(stuck, [], stuck[:5])
        self.assertEqual(GEN['psize'].get(next(x[0] for x in spec10.TR10 if x[1] == '비비고 생야채물만두')), '278g')
        self.assertTrue(all(tail.match(v) or re.match(r'^\d', v) for v in GEN['psize'].values()))


class AddedDateTest(unittest.TestCase):
    def test_every_food_has_added_date(self):
        app_ids = set(re.findall(r'\bF\("([a-z0-9_]+)"', APP_SRC))
        allids = set(BY) | app_ids
        self.assertEqual(sorted(allids - set(GEN['added'])), [])
        for i, d in GEN['added'].items():
            self.assertRegex(d, r'^2026-\d\d-\d\d$', i)
            self.assertLessEqual(d, '2026-10-16', i)
        # 1년 점검(사용자 요청으로 넣지 않음): 앱에 확인 날짜로 '지났음'을 계산하는 코드가 없다
        self.assertNotRegex(APP_SRC, r'ADDED\[[^\]]+\]\s*[<>]')

    def test_new_menus_dated_today(self):
        for x in spec11.EO:
            self.assertEqual(GEN['added'][x[0]], '2026-10-16', x[0])


class EatOutMenuTest(unittest.TestCase):
    def test_rules_consistent(self):
        for x in spec11.EO:
            i, nm, cat, src, ms, tags = x[:6]
            self.assertIn(i, BY, i)
            if 'nitrite' in tags or 'fried' in tags or 'processed' in tags:
                self.assertEqual(ms, 9, i)
            if 'spicy' in tags:
                self.assertGreaterEqual(ms, 3, i)
            if 'raw' in tags:
                self.assertGreaterEqual(ms, 3, i)
            for k in x[9]:
                self.assertTrue(k in TPL or k in spec11.T11, (i, k))
            self.assertTrue(src.startswith('D:') or src == 'N:-', i)

    def test_no_value_menus_listed(self):
        nov = sorted(x[0] for x in spec11.EO if x[3] == 'N:-')
        self.assertEqual(nov, sorted(['salmon_don', 'gyudon', 'katsudon', 'tendon', 'caesar_salad', 'ham_toast']))

    def test_moved_aliases(self):
        for old, a in spec11.MOVE_ALIAS:
            self.assertNotIn(a, GEN['alias'].get(old, []), (old, a))

    def test_broad_menu_ids_exist(self):
        m = re.search(r'const BROAD=(\{.*?\});', APP_SRC, re.S)
        self.assertTrue(m)
        ids = set(re.findall(r'"([a-z0-9_]+)"', m.group(1)))
        app_ids = set(re.findall(r'\bF\("([a-z0-9_]+)"', APP_SRC))
        self.assertEqual(sorted(ids - set(BY) - app_ids), [])


class VersionTest(unittest.TestCase):
    def test_app_version_matches_package(self):
        pkg = json.loads(read('package.json'))
        self.assertIn('const APP_VER="%s"' % pkg['version'], APP_SRC)

    def test_package_description_not_single_file(self):
        pkg = json.loads(read('package.json'))
        self.assertNotIn('단일 파일', pkg['description'])


if __name__ == '__main__':
    unittest.main()
