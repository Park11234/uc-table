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
import mart_check  # noqa: E402
import spec9  # noqa: E402
import spec10  # noqa: E402
import cj10  # noqa: E402
import brand10  # noqa: E402
import label10  # noqa: E402
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import cj_import  # noqa: E402
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

    def test_template_keys_do_not_override(self):
        """판정 문장 묶음(templates·spec8·spec9·spec10)을 합칠 때 같은 이름으로 앞 문장을 덮어쓰지 않아야 한다.
        v1.9.0 작업 중 spec10의 'upf_reduce'가 기존 과자·라면 71종의 초가공식품 설명과 근거 번호를 바꾼 일이 있어 둔 점검(2026-10-16)"""
        import templates
        seen = {}
        for name, d in [('templates', dict(templates.T)), ('spec8', spec8.T8), ('spec9', spec9.T9), ('spec10', spec10.T10)]:
            for k, v in d.items():
                if k in seen:
                    self.assertEqual(seen[k][1], v, '%s의 %s가 %s 문장을 덮어씀' % (name, k, seen[k][0]))
                seen[k] = (name, v)

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
        self.assertEqual(GEN['ingr'], {**snack_check.ING, **ramen_check.ING, **mart_check.ING, **spec10.ING10})
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


class MartCheckTest(unittest.TestCase):
    """마트·편의점 시판 식품 대조(src/data/mart_check.py)를 다시 계산한다(2026-10-14)"""

    def test_every_mart_label_has_crosscheck(self):
        rows = {x[0]: x for x in spec9.TR9}
        self.assertEqual(len(mart_check.X), 17)
        self.assertEqual(len(rows), 17)
        for key, v in mart_check.X.items():
            d = spec9.LABEL9[v['lk']]
            self.assertEqual(d['xm'], v['fid'])
            self.assertEqual(rows[v['fid']][3], 'L:' + v['lk'])
            self.assertIn(27, d['ref'])
            self.assertIn(81, d['ref'])
            self.assertIn(v['fid'], FOOD_IDS)

    def test_label_matches_db_rows(self):
        """C 포장 표시와 식약처 DB 같은 제품 행(가장 최근 날짜)이 허용 범위 안에서 맞아야 한다"""
        for key, v in mart_check.X.items():
            w = v['w']
            self.assertTrue(v['db'], key)
            self.assertEqual(len({r['date'] for r in v['db']}), 1, key)
            for r in v['db']:
                for n in ('kcal', 'c', 's', 'p', 'f', 'na'):
                    lv = v['show'].get(n)
                    if isinstance(lv, str) or lv is None or r.get(n) is None:
                        continue
                    self.assertLessEqual(abs(r[n] * w / 100 - lv), mart_check.tol(n, lv, w), f'{key} {r["code"]} {n}')

    def test_printed_kcal_matches_macros(self):
        """D 포장 표시 열량과 탄수화물·단백질·지방 계산이 반올림 오차 안에서 맞아야 한다"""
        for key, v in mart_check.X.items():
            self.assertLessEqual(abs(mart_check.calc_kcal(v['show']) - v['show']['kcal']), mart_check.CALC_TOL, key)

    def test_app_values_are_printed_values(self):
        for v in mart_check.X.values():
            d = spec9.LABEL9[v['lk']]
            self.assertEqual(d['vol'], v['w'], v['fid'])
            self.assertEqual(d['unit'], v['u'], v['fid'])
            for n in ('kcal', 'c', 'p', 'f', 'na'):
                self.assertEqual(d[n], v['show'][n], f"{v['fid']} {n}")
            for n in ('fi', 'ca', 'fe', 'vd'):
                self.assertEqual(d[n], v['show'].get(n), f"{v['fid']} {n}")

    def test_allergy_tags_follow_label(self):
        """포장의 '함유' 표시마다 알레르기 태그가 있어야 하고, 표시에 없는 알레르기 태그는 없어야 한다"""
        names = {'우유': 'dairy', '대두': 'soy', '밀': 'wheat', '쇠고기': 'beef', '닭고기': 'chicken', '조개류': 'clam',
                 '달걀': 'egg', '돼지고기': 'pork', '새우': 'shrimp', '땅콩': 'peanut'}
        rows = {x[0]: x for x in spec9.TR9}
        for fid, t in mart_check.ING.items():
            m = re.search(r'([가-힣, ()]+) 함유', t)
            want = set()
            if m:
                for part in re.split(r',\s*', m.group(1).strip('. ')):
                    part = re.sub(r'\(.*?\)', '', part).strip()
                    want.add(names[part])
            have = {g for g in rows[fid][5] if g in names.values()}
            self.assertEqual(have, want, fid)

    def test_ingredients_and_label_text_attached(self):
        self.assertEqual(GEN['plabel'], {**mart_check.PLABEL, **spec10.PLABEL10})
        for fid in mart_check.ING:
            self.assertEqual(GEN['ingr'][fid], mart_check.ING[fid])
            self.assertIn(str(mart_check.X[next(k for k, v in mart_check.X.items() if v['fid'] == fid)]['show']['kcal']) + 'kcal', GEN['plabel'][fid])

    def test_excluded_and_held_products_not_in_app(self):
        keys = set()
        for x in spec9.TR9:
            for n in [x[1]] + list(x[7]):
                keys.add(re.sub(r'\s', '', n))
        for name, *_ in mart_check.EXCLUDED + mart_check.HOLD:
            for part in re.sub(r'\(.*?\)', '', name).split('·'):
                part = re.sub(r'\s', '', part)
                self.assertNotIn(part, keys, name)


class Spec10Test(unittest.TestCase):
    """v1.9.0 시판 식품(CJ더마켓·동원몰·식품안전나라, 제품마다 한 곳 확인)과 '절대 금지'(아질산염 가공육) 규칙"""
    NIT = re.compile(r'아질산나트륨|아질산칼륨|질산나트륨|질산칼륨')

    def test_nitrite_foods_are_banned(self):
        """원재료에 발색제가 있으면 nitrite·processed 태그, 시작 단계 9, 첫 설명이 '절대 금지'여야 한다"""
        n = 0
        for x in spec10.TR10:
            ing = spec10.ING10[x[0]]
            direct = bool(self.NIT.search(ing))
            if 'nitrite' in x[5]:
                n += 1
                # 원재료명에 발색제가 없으면 스팸 클래식(고시에 아질산나트륨)이 원재료인 CJ 제품뿐
                self.assertTrue(direct or (x[0].startswith('cj') and re.search(r'스팸\s*[Ⓡ®]?\s*클래식', ing)), x[0])
                self.assertIn('processed', x[5], x[0])
                self.assertEqual(x[4], 9, x[0])
                self.assertIn(x[9][0], ('nitrite_meat', 'nitrite_dish'), x[0])    # 가공육 자체 / 가공육이 든 음식(볶음밥·찌개 등)
            else:
                self.assertFalse(direct, x[0])
        self.assertGreaterEqual(n, 150)
        self.assertIn("'절대 금지'", spec10.T10['nitrite_meat'][0])
        self.assertIn("'절대 금지'", spec10.T10['nitrite_dish'][0])
        self.assertIn('가공육이 들어 있', spec10.T10['nitrite_dish'][0])
        self.assertIn('가공육이 들어 있', spec10.T10['processed_dish'][0])
        spam = next(p for p in cj10.P if p['prd'] == '40134669')    # 설명이 인용하는 스팸 클래식 고시
        self.assertRegex(spam['ing'], self.NIT)

    def test_app_ban_level(self):
        """앱: 판정 단계 '절대 금지'(ban)가 피하기보다 위이고, 아질산염 태그는 절대 금지에만 있다"""
        self.assertIn('const BAN_TAG=[["nitrite",', APP_SRC)
        self.assertIn('const LV_RANK={ok:0,caution:1,later:2,avoid:3,ban:4}', APP_SRC)
        self.assertIn('ban:"절대 금지"', APP_SRC)
        av = APP_SRC[APP_SRC.index('const AVOID_TAG='):APP_SRC.index('];', APP_SRC.index('const AVOID_TAG='))]
        self.assertNotIn('"nitrite"', av)

    def test_every_food_has_one_source(self):
        ids = {x[0] for x in spec10.TR10}
        self.assertEqual(set(spec10.PSRC10), ids)
        self.assertEqual(GEN['psrc'], spec10.PSRC10)
        site_ref = {'cj': 82, 'dw': 83, 'fs': 84, 'dl': 85, 'rk': 86, 'im': 87, 'pm': 88}
        for x in spec10.TR10:
            p = spec10.PSRC10[x[0]]
            self.assertEqual(p[0], x[0][:2], x[0])
            self.assertIn(p[0], site_ref)
            self.assertRegex(p[1], r'^\d+$' if p[0] != 'rk' else r'^[A-Z]?\d+$', x[0])
            self.assertRegex(p[2], r'^2026-\d\d-\d\d$', x[0])
            refs = spec10.T10['p_' + x[0]][1]
            if p[0] in ('dl', 'rk', 'im', 'pm') and len(refs) == 2:    # 판매처에 영양정보가 없어 식약처 가공식품 DB 값을 쓴 제품
                self.assertEqual(refs, [site_ref[p[0]], 27], x[0])
                self.assertEqual(spec10.PLABEL10[x[0]][14][:11], '식약처 가공식품 DB', x[0])
            else:
                self.assertEqual(refs, [site_ref[p[0]]], x[0])
            if p[0] == 'fs':     # 품목제조보고: 원장 번호·보고 일자
                self.assertEqual(len(p), 5, x[0])
                self.assertRegex(p[3], r'^\d+$', x[0])
                self.assertRegex(p[4], r'^(\d{4}-\d\d-\d\d)?$', x[0])
            else:
                self.assertEqual(len(p), 3, x[0])
        for n in site_ref.values():
            self.assertIn(n, REF_NOS)
        # 앱의 자료별 이름·링크·근거 번호가 테스트와 같다
        for site, n in site_ref.items():
            self.assertRegex(APP_SRC, site + r':\{nm:"[^"]+",doc:"[^"]+",ref:' + str(n) + ',')

    def test_names_and_exclusions(self):
        """이름 20자 이내, 밀키트·도시락은 넣지 않음, 이름·id가 겹치지 않음"""
        seen = set()
        for x in spec10.TR10:
            self.assertLessEqual(len(x[1]), 20, x[1])
            for nm in [x[1]] + list(x[7]):
                self.assertNotRegex(nm, r'밀키트|도시락|쿡킷|키트', x[0])
            k = re.sub(r'\s', '', x[1])
            self.assertNotIn(k, seen, x[1])
            seen.add(k)
        self.assertEqual(len({x[0] for x in spec10.TR10}), len(spec10.TR10))
        for p in cj10.P:
            self.assertNotRegex(p['ty'], r'먹는샘물|탄산수', p['prd'])

    def test_brand_products_have_no_nutrition(self):
        """동원몰·식품안전나라 제품은 영양값 없이(N:-) 원재료로 판정, 식품안전나라는 발색제가 든 제품만"""
        for x in spec10.TR10:
            if x[0][:2] in ('dw', 'fs'):
                self.assertEqual(x[3], 'N:-', x[0])
                self.assertNotIn(x[0], spec10.LABEL10)
                self.assertNotIn(x[0], spec10.PLABEL10)
                self.assertIn('processed', x[5], x[0])
            elif x[3] == 'N:-' and x[0][:2] == 'cj':      # CJ에서 영양값을 맞출 수 없어 뺀 것은 아질산염 가공육뿐
                self.assertIn('nitrite', x[5], x[0])
        for r in brand10.P:
            if r['site'] == 'fs':
                self.assertTrue(r['nit'], r['id'])
                self.assertRegex(r['ing'], self.NIT, r['id'])
                self.assertTrue(r['ledg'], r['id'])

    def test_label_values_are_notice_values(self):
        """CJ 영양값(LABEL10)은 고시 값 그대로이고, 열량은 탄수화물·단백질·지방 계산과 맞는다(가져올 때 규칙과 같음)"""
        by = {'cj' + p['mat']: p for p in cj10.P}
        for k, d in spec10.LABEL10.items():
            if k[:2] in ('dl', 'rk', 'im', 'pm'):     # 만두·육포·볶음밥·국은 아래 test_label_photo_products에서 점검
                continue
            p = by[k]
            for n in ('c', 'p', 'f', 'na'):
                self.assertEqual(d[n], p[n], f'{k} {n}')
            self.assertEqual(spec10.PLABEL10[k][4], p['kcal'], k)
            if d['kcal'] is None:
                continue
            # 식이섬유 2·당알코올 2.4·알룰로오스 0kcal/g로 셈한 계산과 15kcal 또는 15% 안(식이섬유·당알코올 원료가 있으면 30%)
            tv = cj_import.text_vals(p['nut_text'])
            if tv.get('_multi'):
                tv = {'_lt': tv['_lt']}
            rng = cj_import.energy(p, tv)
            dd, rel = cj_import.kcal_err(d['kcal'], rng)
            lim = 0.30 if (cj_import.LOW_E.search(p['ing']) and d['kcal'] < rng[0]) else 0.15
            self.assertTrue(dd <= 15 or rel <= lim, f'{k} {d["kcal"]} {rng}')
            self.assertFalse(p['s'] is not None and p['s'] > p['c'] + 0.5, k)    # 당류가 탄수화물보다 많으면 안 됨

    def test_label_photo_products(self):
        """만두·육포·볶음밥·국(동원몰·랭킹닭컴·아임닭·풀무원샵 포장 표시, label10): 표시 값 그대로, 육포는 가공육, 아질산염이면 절대 금지"""
        tr = {x[0]: x for x in spec10.TR10}
        nut = ('kcal', 'na', 'c', 's', 'f', 'tf', 'sf', 'ch', 'p', 'fi')
        n_mandu = n_jerky = n_chicken = n_rice = n_stew = 0
        skipped = {f for f, _ in spec10.LABEL_NONUT}
        for r in label10.P:
            fid = r['site'] + r['id']
            if r['kind'] in ('mandu', 'friedrice', 'stew') and r['kcal'] is None:    # 만두·볶음밥·국은 영양정보까지 확인한 것만 넣는다
                self.assertIn(fid, skipped)
                self.assertNotIn(fid, tr)
                continue
            x = tr[fid]
            self.assertTrue(spec10.ING10[fid].startswith(r['ing']), fid)
            self.assertEqual(r['nit'], bool(self.NIT.search(r['ing'])), fid)
            if r['kind'] == 'jerky':
                n_jerky += 1
                self.assertEqual(x[2], '단백질', fid)
                self.assertIn('processed', x[5], fid)
                self.assertIn('tough', x[5], fid)
                self.assertEqual(x[4], 9, fid)
                self.assertEqual(x[9][0], 'nitrite_meat' if r['nit'] else 'processed_meat', fid)
            elif r['kind'] in ('friedrice', 'stew'):
                # 볶음밥·주먹밥·국·탕·찌개: CJ 같은 종류와 같은 규칙. 햄·소시지·베이컨이 재료면 가공육이 든 음식(피하기)
                n_rice += r['kind'] == 'friedrice'
                n_stew += r['kind'] == 'stew'
                self.assertEqual(x[2], '요리', fid)
                proc = bool(spec10.PROC_ING.search(r['ing']))
                self.assertEqual('processed' in x[5], proc or r['nit'], fid)
                if proc and not r['nit']:
                    self.assertEqual(x[9][0], 'processed_dish', fid)
                self.assertNotIn('fried', x[5], fid)                     # 튀긴 볶음밥·국은 없다('치킨' 이름은 튀김이 아님)
                self.assertEqual(x[4] == 9, 'processed' in x[5], fid)
                if r['kind'] == 'stew':
                    self.assertIn('liq', x[5], fid)
                g, u = x[6]
                self.assertTrue(0 < g <= max(r['tot'], 600), fid)
                if r.get('serv'):
                    self.assertEqual([g, u], list(r['serv']), fid)
            else:
                n_mandu += 1
                n_chicken += '닭가슴살' in r['names'][0]
                self.assertNotIn('processed', x[5], fid)
                self.assertFalse(r['nit'], fid)
                self.assertEqual(x[4] == 9, 'fried' in x[5], fid)       # 만두는 튀긴 제품만 피하기
            self.assertEqual('nitrite' in x[5], r['nit'], fid)
            if r['kcal'] is None:            # 영양정보를 찾지 못한 육포: 가공육이라 원재료로 판정
                self.assertEqual(r['kind'], 'jerky', fid)
                self.assertEqual(x[3], 'N:-', fid)
                self.assertNotIn(fid, spec10.LABEL10)
                self.assertNotIn(fid, spec10.PLABEL10)
                continue
            self.assertEqual(x[3], 'L:' + fid)
            pl = spec10.PLABEL10[fid]
            self.assertEqual(pl[:4], [r['b'], r['bu'], r['tot'], r['tu']], fid)
            self.assertEqual(pl[4:14], [r.get(k) for k in nut], fid)
            d = spec10.LABEL10[fid]
            for k in ('kcal', 'c', 'p', 'f', 'na'):
                self.assertEqual(d[k], r[k], fid)
            self.assertEqual(d['vol'], r['b'], fid)
            atw = 4 * r['c'] + 4 * r['p'] + 9 * r['f']
            self.assertLessEqual(abs(atw - r['kcal']), max(15, 0.15 * r['kcal']), fid)
            self.assertLessEqual(r['s'], r['c'] + 0.5, fid)
            if r['sf'] is not None:      # 표시가 서로 바뀐 것으로 보여 비운 칸(올반 김치볶음밥의 트랜스·포화지방)은 건너뜀
                self.assertLessEqual(r['sf'], r['f'] + 0.5, fid)
            if r.get('nsrc') == 'mfds':      # 판매처에 영양정보가 없어 식약처 가공식품 DB 값
                self.assertEqual(d['ref'], [27], fid)
                self.assertRegex(pl[14], r'^식약처 가공식품 DB \d{4}-\d\d-\d\d$', fid)
            else:
                self.assertEqual(d['ref'], [{'dl': 85, 'rk': 86, 'im': 87, 'pm': 88}[r['site']]], fid)
                self.assertEqual(len(pl), 14, fid)
        self.assertGreaterEqual(n_mandu, 60)
        self.assertGreaterEqual(n_jerky, 20)
        self.assertGreaterEqual(n_chicken, 9)
        self.assertGreaterEqual(n_rice, 80)
        self.assertGreaterEqual(n_stew, 50)
