# -*- coding: utf-8 -*-
"""데이터 생성 코드(파이썬) 단위 점검. 실행: python3 -m unittest discover -s tests/python -v

- 영양식 제품 표시값(LABEL) → 100ml당 값 변환과 열량 계산식
- 오프라인 예시 식단 메뉴(menus.build())의 형식·분량·레시피·근거 번호
- 음식 목록(spec*.py)의 id·출처 형식
- 앱 빌드(build_app.render())의 표시자 치환
식약처 원본 CSV(data/mfds, 저장소에 없음)가 없어도 돌아가게, 생성된 gen_out.json과 소스 파일만 읽는다.
"""
import json, os, re, sys, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D = os.path.join(ROOT, 'src', 'data')
sys.path.insert(0, D)

import menus  # noqa: E402
import spec8  # noqa: E402
import snack_check  # noqa: E402
import ramen_check  # noqa: E402
from build_app import render  # noqa: E402



def read(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()


GEN = json.loads(read('src', 'data', 'generated', 'gen_out.json'))
APP_SRC = read('src', 'app', 'app.src.html')


def block(start):
    i = APP_SRC.index(start)
    return APP_SRC[i:APP_SRC.index('\n};', i)]


RECIPE_IDS = set(re.findall(r'\b(r_[a-z0-9_]+):\{name:"', APP_SRC))
REF_NOS = {int(n) for n in re.findall(r'^\s*(\d+):\{', block('const REFS = {'), re.M)}
FOOD_IDS = set(re.findall(r'\bF\("([a-z0-9_]+)"', APP_SRC)) | {re.match(r'LF\("([a-z0-9_]+)"', x).group(1) for x in GEN['foods']}


def label_kcal(d):
    """표시값으로 계산한 열량: (탄수화물-식이섬유-알룰로오스)x4 + 식이섬유x2 + 단백질x4 + 지방x9"""
    fi = d['fi'] or 0
    return (d['c'] - fi - d.get('allulose', 0)) * 4 + fi * 2 + d['p'] * 4 + d['f'] * 9


class LabelTest(unittest.TestCase):
    def test_formula_matches_printed_kcal(self):
        """열량 표시가 있는 제품에서 계산식이 표시값과 3kcal 안에서 맞아야 계산값을 믿을 수 있다"""
        n = 0
        for k, d in spec8.LABEL.items():
            if d.get('x') or d.get('xr'):
                continue  # 시판 과자·라면은 SnackCheckTest·RamenCheckTest에서(반올림 오차 기준)
            if d['kcal'] is not None and None not in (d['c'], d['p'], d['f']) and not d.get('kcal_note'):
                self.assertLessEqual(abs(label_kcal(d) - d['kcal']), 3, k)
                n += 1
        self.assertGreaterEqual(n, 10)

    def test_generated_values_per_100(self):
        """gen_out.json의 영양식 값 = 1팩 표시값 x 100 / 용량(열량 표시가 없으면 계산값을 5kcal 단위로)"""
        srcs = {x[0]: x[3] for x in spec8.TR8}
        checked = 0
        for fid, src in srcs.items():
            if not src.startswith('L:'):
                continue
            d = spec8.LABEL[src[2:]]
            mf, mi = GEN['mfds'][fid], GEN['micro'][fid]
            per = lambda v: None if v is None else round(v * 100 / d['vol'], 2)  # noqa: E731
            kc = d['kcal']
            if kc is None and None not in (d['c'], d['p'], d['f']):
                kc = int(round(label_kcal(d) / 5.0) * 5)
            self.assertEqual(mf[0], per(kc), fid)
            for idx, key in ((1, 'p'), (2, 'f'), (3, 'c'), (4, 'fi'), (5, 'ca'), (6, 'fe'), (11, 'k')):
                self.assertEqual(mf[idx], per(d[key]), f'{fid} {key}')
            self.assertEqual(mi, [per(d['na']), per(d['vd'])], fid)
            self.assertEqual(mf[7], 'L', fid)
            checked += 1
        self.assertGreaterEqual(checked, 10)


class FoodSpecTest(unittest.TestCase):
    def test_ids_unique_and_sources(self):
        seen = set()
        for x in spec8.TR8:
            self.assertNotIn(x[0], seen, x[0])
            seen.add(x[0])
            self.assertRegex(x[3], r'^(R|D|P|C|L|N):', x[0])
            if x[3].startswith('L:'):
                self.assertIn(x[3][2:], spec8.LABEL)
        self.assertGreaterEqual(sum(1 for x in spec8.TR8 if 'ons' in x[5]), 30)

    def test_all_generated_foods_have_values_or_marked(self):
        for fid in (re.match(r'LF\("([a-z0-9_]+)"', x).group(1) for x in GEN['foods']):
            self.assertIn(fid, GEN['micro'], fid)
            self.assertIn(fid, GEN['serv'], fid)


class SnackCheckTest(unittest.TestCase):
    """시판 과자·사탕·젤리·초콜릿 3중 대조(src/data/snack_check.py)를 다시 계산한다"""

    def test_every_snack_label_has_crosscheck(self):
        rows = {x[0]: x for x in spec8.TR8}
        xs = {v['fid']: v for v in snack_check.X.values()}
        self.assertEqual(len(xs), 83)
        for k, d in spec8.LABEL.items():
            if not d.get('x'):
                continue
            v = xs[d['x']]
            self.assertEqual(v['lk'], k)
            self.assertEqual(rows[v['fid']][3], 'L:' + k)
            self.assertIn(27, d['ref'])
        self.assertEqual(sum(1 for d in spec8.LABEL.values() if d.get('x')), 83)

    def test_label_matches_newest_db_rows(self):
        """② 포장(또는 제조사 사이트) 값과 식약처 DB 같은 제품의 가장 최근 행이 허용 범위 안에서 맞아야 한다"""
        for key, v in snack_check.X.items():
            w = v['w']
            show = dict(v['show'])
            if 'kpp' in v:
                show['kcal'] = v['kpp'][0] * w / v['kpp'][1]
            self.assertTrue(v['db'], key)
            dates = {r['date'] for r in v['db']}
            self.assertEqual(len(dates), 1, key)  # 가장 최근 날짜의 행만
            for r in v['db']:
                for n, lv in show.items():
                    if n in ('fi', 'polyol') or r.get(n) is None:
                        continue
                    diff = abs(r[n] * w / 100 - lv)
                    self.assertLessEqual(diff, snack_check.tol(n, lv, w), f'{key} {r["code"]} {n}')

    def test_printed_kcal_matches_macros(self):
        """③ 포장 표시 열량과 탄수화물·단백질·지방 계산이 반올림 오차 안에서 맞아야 한다"""
        n = 0
        for key, v in snack_check.X.items():
            sh = dict(v['show'])
            if v['kind'] == 'site' or 'f' not in sh:
                continue
            kc = sh['kcal'] if 'kcal' in sh else v['kpp'][0] * v['w'] / v['kpp'][1]
            self.assertLessEqual(abs(snack_check.calc_kcal(sh) - kc), snack_check.CALC_TOL, key)
            n += 1
        self.assertGreaterEqual(n, 30)

    def test_app_values_come_from_checked_source(self):
        """앱 값: 포장 표시를 읽은 제품은 표시값 그대로, 사이트 열량만 있는 제품은 대조한 식약처 행 값 그대로"""
        for v in snack_check.X.values():
            d = spec8.LABEL[v['lk']]
            if v['kind'] == 'label':
                sh = v['show']
                self.assertEqual(d['vol'], v['w'], v['fid'])
                if 'kpp' in v:
                    self.assertAlmostEqual(d['kcal'], v['kpp'][0] * v['w'] / v['kpp'][1], places=6)
                else:
                    self.assertEqual(d['kcal'], sh['kcal'], v['fid'])
                for n in ('c', 'p', 'f', 'na'):
                    self.assertEqual(d[n], sh.get(n), f"{v['fid']} {n}")
            else:
                u = snack_check.USE[v['use']]
                self.assertIn(v['use'], [r['code'] for r in v['db']])
                self.assertEqual(d['vol'], 100)
                for n in ('kcal', 'c', 'p', 'f', 'na'):
                    self.assertEqual(d[n], u[n], f"{v['fid']} {n}")
                self.assertTrue(all(d[n] is None for n in ('fi', 'ca', 'fe', 'k')), v['fid'])

    def test_excluded_products_not_in_app(self):
        keys = set()
        for x in spec8.TR8:
            for n in [x[1]] + list(x[7]):
                keys.add(re.sub(r'\s', '', n))
        for name, _, why in snack_check.EXCLUDED:
            if '외 제품' in name:
                continue
            for part in re.sub(r'\(.*?\)', '', name).split('·'):
                part = re.sub(r'\s', '', part)
                if len(part) >= 3 and not re.fullmatch(r'[\d%]+', part):
                    self.assertNotIn(part, keys, name)
        for fid in ('dreamcacao56', 'dreamcacao72', 'dreamcacao82', 'chicchoc', 'zec', 'butter_coconut', 'kkokkalcorn'):
            self.assertNotIn(fid, FOOD_IDS)

    def test_ingredients_attached(self):
        self.assertEqual(GEN['ingr'], {**snack_check.ING, **ramen_check.ING})
        for fid in snack_check.ING:
            self.assertIn(fid, FOOD_IDS)


class MenuTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.M = menus.build()

    def test_counts(self):
        self.assertGreaterEqual(sum(len(v) for v in self.M.values()), 300)
        for k in 'BLDS':
            self.assertIn(k, self.M)

    def test_menu_fields(self):
        for slot, arr in self.M.items():
            titles = [m['title'] for m in arr]
            self.assertEqual(len(titles), len(set(titles)), f'{slot} 이름 중복')
            for m in arr:
                self.assertTrue(m['tip'] and m['refs'], m['title'])
                self.assertNotRegex(m['title'], r'(?<!사)[과와] \S', m['title'])  # '○○과 ○○' 대신 '·'
                ids = [i for i, _ in m['items']]
                self.assertEqual(len(ids), len(set(ids)), m['title'])
                for i, g in m['items']:
                    self.assertIn(i, FOOD_IDS, f"{m['title']}: {i}")
                    self.assertTrue(0 < g <= 600, f"{m['title']}: {i} {g}")
                for n in m['refs']:
                    self.assertIn(n, REF_NOS, f"{m['title']}: 근거 {n}")
                for r in m.get('rec', []):
                    self.assertIn(r, RECIPE_IDS, f"{m['title']}: 레시피 {r}")
                if slot != 'S':
                    self.assertTrue(m.get('rec') or m.get('cook'), f"{m['title']}: 조리법 없음")

    def test_mediterranean_menus(self):
        med = {k: sum(1 for m in v if m.get('med')) for k, v in self.M.items()}
        self.assertGreaterEqual(med['L'], 15)
        self.assertGreaterEqual(med['D'], 15)
        self.assertGreaterEqual(med['B'], 5)

    def test_rec_map_targets_exist(self):
        for name, ids in menus.REC.items():
            for r in ids:
                self.assertIn(r, RECIPE_IDS, f'{name}: {r}')

    def test_deterministic(self):
        self.assertEqual(json.dumps(menus.build(), ensure_ascii=False), json.dumps(self.M, ensure_ascii=False))


class BuildTest(unittest.TestCase):
    def test_render_replaces_all_markers(self):
        out = render()
        self.assertNotIn('/*@GEN:', out)
        self.assertRegex(out, r'const MICRO=\{"')
        self.assertRegex(out, r'const MENU_GEN=\{"B":\[')

    def test_committed_build_is_fresh(self):
        """커밋된 src/app/index.html이 지금 소스로 다시 만든 결과와 같아야 한다"""
        cur = read('src', 'app', 'index.html')
        self.assertEqual(cur, render())



class DocsTest(unittest.TestCase):
    def test_evidence_table_matches_app_refs(self):
        """docs/evidence.md의 근거 표가 앱 참고문헌(REFS)과 같아야 한다(tools/sync_evidence.py로 만듦)"""
        sys.path.insert(0, os.path.join(ROOT, 'tools'))
        import sync_evidence
        doc = read('docs', 'evidence.md')
        self.assertEqual(doc, sync_evidence.render(doc))
        self.assertEqual(len(sync_evidence.refs()), len(REF_NOS))


if __name__ == '__main__':
    unittest.main()


class RamenCheckTest(unittest.TestCase):
    """시판 라면 3중 대조(src/data/ramen_check.py)를 다시 계산한다(v1.6.2)"""

    def test_every_ramen_label_has_crosscheck(self):
        rows = {x[0]: x for x in spec8.TR8}
        self.assertEqual(len(ramen_check.X), 55)
        for key, v in ramen_check.X.items():
            d = spec8.LABEL[v['lk']]
            self.assertEqual(d.get('xr'), key)
            self.assertEqual(rows[v['fid']][3], 'L:' + v['lk'])
            self.assertIn(27, d['ref'])
            self.assertIn('instant', rows[v['fid']][5])
        self.assertEqual(sum(1 for d in spec8.LABEL.values() if d.get('xr')), 55)

    def test_label_matches_newest_db_rows(self):
        """② 포장 표시와 식약처 DB 같은 제품의 가장 최근 행이 허용 범위 안에서 맞아야 한다"""
        for key, v in ramen_check.X.items():
            w = v['w']
            self.assertTrue(v['db'], key)
            self.assertEqual(len({r['date'] for r in v['db']}), 1, key)
            for r in v['db']:
                for n, lv in v['show'].items():
                    if n == 'fi' or r.get(n) is None:
                        continue
                    self.assertLessEqual(abs(r[n] * w / 100 - lv), ramen_check.tol(n, lv, w), f'{key} {r["code"]} {n}')

    def test_printed_kcal_matches_macros(self):
        """③ 포장 표시 열량과 탄수화물·단백질·지방 계산이 반올림 오차 안에서 맞아야 한다"""
        for key, v in ramen_check.X.items():
            self.assertLessEqual(abs(ramen_check.calc_kcal(v['show']) - v['show']['kcal']), ramen_check.CALC_TOL, key)

    def test_app_values_are_printed_values(self):
        rows = {x[0]: x for x in spec8.TR8}
        for v in ramen_check.X.values():
            d = spec8.LABEL[v['lk']]
            self.assertEqual(d['vol'], v['w'], v['fid'])
            for n in ('kcal', 'c', 'p', 'f', 'na'):
                self.assertEqual(d[n], v['show'][n], f"{v['fid']} {n}")
            tags = rows[v['fid']][5]
            # 유탕면은 튀김 규칙(피하기), 건면은 아님
            self.assertEqual('fried' in tags, rows[v['fid']][4] == 9, v['fid'])

    def test_excluded_products_not_in_app(self):
        keys = set()
        for x in spec8.TR8:
            for n in [x[1]] + list(x[7]):
                keys.add(re.sub(r'\s', '', n))
        for name, _, why in ramen_check.EXCLUDED:
            if '그 밖의' in name or '팔도' in name:
                continue
            self.assertNotIn(re.sub(r'\s', '', re.sub(r'\(.*?\)', '', name)), keys, name)



import qa  # noqa: E402

SOURCES = os.path.join(ROOT, 'data', 'sources')


class QaTest(unittest.TestCase):
    """궁금한 점(Q&A, v1.7.0): 형식·근거 번호·음식 연결, 그리고 인용문이 원문에 글자 그대로 있는지"""

    def test_fields(self):
        ids = [x['id'] for x in qa.QA]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertGreaterEqual(len(ids), 40)
        for x in qa.QA:
            self.assertIn(x['cat'], qa.CATS, x['id'])
            self.assertTrue(x['q'].endswith('까?'), x['id'])   # 질문도 합쇼체(v1.8.0)
            self.assertGreaterEqual(len(x['kw']), 1, x['id'])
            self.assertEqual(len(x['kw']), len(set(x['kw'])), x['id'])
            self.assertTrue(x['ev'], x['id'])
            # 답은 합쇼체(v1.8.0): 문장이 모두 '~다.'·'~십시오.'·'~까?'로 끝난다(괄호 속 출처 표시는 허용)
            for sent in re.split(r'(?<=[.?!])\s+', x['a'].strip()):
                self.assertRegex(sent, r'(다|까|오)(\([^)]*\))?[.?!]$', (x['id'], sent))
            for f in x['foods']:
                self.assertIn(f, FOOD_IDS, (x['id'], f))

    def test_sources_and_refs(self):
        for x in qa.QA:
            for e in x['ev']:
                self.assertIn(e['src'], qa.SRC, (x['id'], e['src']))
                self.assertTrue(e['loc'].strip(), x['id'])
                self.assertGreaterEqual(len(qa.norm(e['q'])), 6, (x['id'], e['q']))
        for n, _name in qa.SRC.values():
            self.assertIn(n, REF_NOS, n)
        built = qa.build()
        for b in built:
            self.assertEqual(b['refs'], list(dict.fromkeys(e['r'] for e in b['ev'])), b['id'])

    def test_quotes_match_original_text(self):
        """data/sources/<src>.txt(저작권 때문에 저장소에 없음)가 있으면 인용문이 그 파일에 그대로 있어야 한다"""
        if not os.path.isdir(SOURCES):
            self.skipTest('data/sources 없음(원문 파일은 배포하지 않음)')
        n = 0
        for x in qa.QA:
            for e in x['ev']:
                p = os.path.join(SOURCES, e['src'] + '.txt')
                if not os.path.exists(p):
                    continue
                with open(p, encoding='utf-8') as f:
                    self.assertTrue(qa.find_quote(f.read(), e), (x['id'], e['src'], e['q'][:50]))
                n += 1
        self.assertGreater(n, 0)

    def test_find_quote_rejects_changes(self):
        """대조 함수가 글자 하나만 달라도 잡아내는지(공백·줄바꿈·제어 문자만 무시)"""
        text = '카페인\n설사를 악화시킬 수\x07 있습니다.\n\n다른 단 글\n\n없다.'
        self.assertTrue(qa.find_quote(text, {'q': '카페인 설사를 악화시킬 수 있습니다.'}))
        self.assertFalse(qa.find_quote(text, {'q': '카페인 설사를 악화시킬 수 없습니다.'}))
        self.assertTrue(qa.find_quote(text, {'q': '악화시킬 수 있습니다. 없다.', 'parts': ['악화시킬 수 있습니다.', '없다.']}))
        self.assertFalse(qa.find_quote(text, {'q': '악화시킬 수 있습니다. 있다.', 'parts': ['악화시킬 수 있습니다.', '없다.']}))
        self.assertFalse(qa.find_quote(text + 'x' * 400 + '끝.', {'q': '카페인 끝.', 'parts': ['카페인', '끝.']}))


class FodmapServTest(unittest.TestCase):
    """v1.8.0 FODMAP 1회량(Monash 신호등 방식): 자료에 적힌 양만, 순서가 맞게, 출처·확인일이 있게"""
    import fodmap_serv as FS  # noqa: E402

    def test_ids_exist_and_fields(self):
        FS = self.FS
        self.assertGreaterEqual(len(FS.FSERV), 70)
        allowed = {FS.G, FS.GOS, FS.LAC, FS.FRU, FS.SOR, FS.MAN, FS.POL}
        for k, (lo, mid, hi, grp, refs, src, chk) in FS.FSERV.items():
            self.assertIn(k, FOOD_IDS, k)
            self.assertIn(src, ('monash', 'fe'), k)
            self.assertRegex(chk, r'^\d{4}-\d{2}-\d{2}$', k)
            self.assertTrue(refs and all(r in REF_NOS for r in refs), k)
            self.assertTrue(set(grp) <= allowed, k)
            if src == 'fe':
                self.assertIn(58, refs, f'{k}: 2차 자료는 FODMAP Everyday(58)를 근거로 밝힌다')

    def test_thresholds_increase(self):
        """낮음 상한 < 중간 시작 < 높음 시작(그램이 적힌 경우)"""
        for k, (lo, mid, hi, *_r) in self.FS.FSERV.items():
            g = [x[0] for x in (lo, mid, hi) if x and x[0] is not None]
            self.assertEqual(g, sorted(g), k)
            self.assertEqual(len(g), len(set(g)), k)

    def test_checked_values(self):
        """크롬으로 다시 확인한 값(2026-10-06)이 그대로인지"""
        F = self.FS.FSERV
        self.assertEqual((F['broccoli'][0][0], F['broccoli'][1][0], F['broccoli'][2][0]), (75, 208, 279))
        self.assertEqual((F['radish'][0][0], F['radish'][1][0], F['radish'][2][0]), (75, 279, 350))
        self.assertEqual((F['pumpkin'][0][0], F['pumpkin'][1][0], F['pumpkin'][2][0]), (75, 162, 206))
        self.assertEqual(F['banana'][0][0], 37)
        self.assertEqual((F['pine_nut'][0][0], F['pine_nut'][1][0], F['pine_nut'][2][0]), (8, 9, 30))

    def test_built_into_app(self):
        self.assertIn('/*@GEN:fserv@*/', APP_SRC)
        self.assertIn('/*@GEN:dishx@*/', APP_SRC)


class DishValueTest(unittest.TestCase):
    """v1.8.0 음식 값 고르기: 실측값 우선, 실측값이 없으면 계산값 평균, 범위·방법 기록"""
    def test_dishx_fields(self):
        dx = GEN['dishx']
        self.assertGreaterEqual(len(dx), 170)
        for k, (how, n, lo, hi, borrow) in dx.items():
            self.assertIn(how, ('home', 'out', 'mean', 'rda', 'match'), k)
            self.assertGreaterEqual(n, 1, k)
            if lo is not None:
                self.assertLessEqual(lo, hi, k)
                kc = GEN['mfds'][k][0] if k in GEN['mfds'] else None
                if kc is not None and how != 'mean':
                    self.assertTrue(lo <= kc <= hi, f'{k}: 고른 값 {kc}가 범위 {lo}~{hi} 밖')
            self.assertIn(borrow, (0, 1, 2), k)

    def test_mean_rows_are_documented(self):
        for k, v in GEN['dishx'].items():
            if v[0] == 'mean':
                code = GEN['mfds'][k][8]
                self.assertTrue(code.startswith('산출평균:'), k)
                self.assertGreaterEqual(len(code.split(',')), 1, k)

    def test_staples_use_analysed_values(self):
        """밥·죽은 집에서 지은 것과 같은 조리 상태의 국가표준식품성분표 실측값"""
        m = GEN['mfds']
        self.assertEqual(m['white_rice'][7:10], ['A', 'A013000A039a', '멥쌀, 백미, 밥'])
        self.assertEqual(m['white_rice'][0], 152)
        self.assertEqual(m['rice_porridge'][9], '멥쌀, 백미, 죽')
        self.assertEqual(GEN['dishx']['egg_steamed'][0], 'match')


class ToolsTest(unittest.TestCase):
    """v1.8.0 근거 확인일 점검·링크 점검 도구"""
    def test_stale_check(self):
        sys.path.insert(0, os.path.join(ROOT, 'tools'))
        import datetime as dt
        import stale_check
        n, text = stale_check.check(dt.date(2026, 10, 6), 365)
        self.assertEqual(n, 0, text)
        n2, text2 = stale_check.check(dt.date(2027, 12, 31), 365)
        self.assertGreater(n2, 70)
        self.assertIn('참고문헌', text2)

    def test_link_check_offline(self):
        sys.path.insert(0, os.path.join(ROOT, 'tools'))
        import link_check
        items = link_check.collect()
        by, bad, hosts = link_check.offline_report(items)
        self.assertEqual(bad, [], bad)
        self.assertGreaterEqual(len(by), 90)
        self.assertTrue(any('support.google.com/chrome/answer/15085120' in u for u in by))

    def test_link_check_online_local(self):
        """--online 동작을 이 컴퓨터 안의 임시 서버로 확인(외부 사이트에는 요청하지 않음)"""
        sys.path.insert(0, os.path.join(ROOT, 'tools'))
        import http.server, threading, link_check

        class H(http.server.BaseHTTPRequestHandler):
            def do_HEAD(self):
                self.send_response(200 if self.path == '/ok' else 404); self.end_headers()
            do_GET = do_HEAD
            def log_message(self, *a): pass
        srv = http.server.HTTPServer(('127.0.0.1', 0), H)
        t = threading.Thread(target=srv.serve_forever, daemon=True); t.start()
        base = f'http://127.0.0.1:{srv.server_address[1]}'
        try:
            self.assertEqual(link_check.fetch(base + '/ok', timeout=5)[0], 200)
            self.assertEqual(link_check.fetch(base + '/gone', timeout=5)[0], 404)
        finally:
            srv.shutdown()


class RefInfoTest(unittest.TestCase):
    """v1.8.0 근거 종류·확인일 표가 참고문헌 전체를 덮는지"""
    def test_ref_info_covers_refs(self):
        m = re.search(r'const REF_INFO=\{(.*?)\};', APP_SRC)
        info = dict((int(n), (t, d)) for n, t, d in re.findall(r'(\d+):\["(\w)","(\d{4}-\d{2}-\d{2})"\]', m.group(1)))
        self.assertEqual(set(info), REF_NOS)
        self.assertTrue(all(t in 'gsho2' for t, _ in info.values()))


class ToneTest(unittest.TestCase):
    """v1.8.0 앱 문구는 합쇼체(~입니다·~합니다). 원문 인용·자료 제목은 그대로"""
    def test_no_haeyo_left(self):
        sys.path.insert(0, os.path.join(ROOT, 'tools'))
        import tone_check
        found = tone_check.find()
        self.assertEqual(found, [], found[:5])

    def test_checker_catches_haeyo(self):
        sys.path.insert(0, os.path.join(ROOT, 'tools'))
        import tempfile, tone_check
        with tempfile.NamedTemporaryFile('w', suffix='.py', delete=False, encoding='utf-8') as f:
            f.write('T = "섬유가 적어 먹기 쉬워요. 필요하면 드세요."\nU = "필요 없음"\n')
        try:
            words = [w for _, _, w, _ in tone_check.find([f.name])]
            self.assertEqual(words, ['쉬워요', '드세요'])
        finally:
            os.unlink(f.name)


class BrandTest(unittest.TestCase):
    """v1.8.0 앱 이름 로고(UC TABLE)와 홈 화면 아이콘"""
    def test_manifest_and_icons(self):
        import struct
        m = json.load(open(os.path.join(ROOT, 'public', 'manifest.webmanifest'), encoding='utf-8'))
        self.assertEqual((m['name'], m['short_name']), ('UC TABLE', 'UC TABLE'))
        purposes = {i['purpose'] for i in m['icons']}
        self.assertEqual(purposes, {'any', 'maskable'})
        for i in m['icons'] + [{'src': 'apple-touch-icon.png', 'sizes': '180x180'}]:
            with open(os.path.join(ROOT, 'public', i['src']), 'rb') as f:
                head = f.read(24)
            self.assertEqual(head[:8], b'\x89PNG\r\n\x1a\n', i['src'])
            w, h = struct.unpack('>II', head[16:24])
            self.assertEqual(f'{w}x{h}', i['sizes'], i['src'])

    def test_logo_built_into_app(self):
        logo = open(os.path.join(ROOT, 'src', 'brand', 'logo-mono.svg'), encoding='utf-8').read().strip()
        app = open(os.path.join(ROOT, 'src', 'app', 'index.html'), encoding='utf-8').read()
        self.assertIn(json.dumps(logo, ensure_ascii=False), app)
        self.assertIn('<title>UC TABLE</title>', app)
        self.assertNotIn('UC 식단 관리 도우미</h1>', app)
