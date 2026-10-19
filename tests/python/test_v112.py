# -*- coding: utf-8 -*-
"""v1.12.0 단위 점검(v1.11.0 전체 코드 검토 반영분). 실행: python3 -m unittest discover -s tests/python -v

- C-17: 매니페스트 id는 시작 주소의 출처를 기준으로 풀린다(표준). 예전 설치본의 정체(id가 없을 때 = 시작 주소)와 같아야 한다
- C-18: :has()가 든 선택자를 다른 선택자와 한 규칙에 묶지 않는다(옛 사파리·WebView는 :has()를 몰라 규칙 전체를 버림)
- 점검 임시 파일: tests/run-all.sh는 점검 4개를 동시에 돌리고 임시 폴더(TEST_TMP)를 함께 쓴다. 두 점검이 같은 이름의 페이지를 쓰면
  한쪽이 파일을 비우고 다시 쓰는 사이 다른 쪽 브라우저가 빈 페이지를 읽는다(v1.12.0 최종 점검에서 t23이 't23.html'을 함께 쓰는 t24 때문에 실패)
"""
import glob, json, os, re, unittest
from urllib.parse import urljoin, urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PAGES = 'https://park11234.github.io/uc-table/manifest.webmanifest'   # GitHub Pages에 올린 매니페스트 주소


def read(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()


class ManifestIdTest(unittest.TestCase):
    def test_manifest_id_keeps_identity_of_earlier_installs(self):
        man = json.loads(read('public', 'manifest.webmanifest'))
        start = urljoin(PAGES, man['start_url'])                 # https://park11234.github.io/uc-table/index.html
        sp = urlsplit(start)
        origin = '%s://%s/' % (sp.scheme, sp.netloc)
        ident = urljoin(origin, man['id']) if man.get('id') else start   # 표준: id는 시작 주소의 출처를 기준으로 푼다
        self.assertEqual(ident, 'https://park11234.github.io/uc-table/index.html')


class HasSelectorTest(unittest.TestCase):
    def test_has_selectors_are_not_mixed_with_plain_selectors(self):
        css = read('src', 'app', 'app.src.html').split('</style>')[0]
        css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
        bad = []
        for sel in re.findall(r'([^{}]+)\{', css):
            parts = [x.strip() for x in sel.split(',') if x.strip()]
            if any(':has(' in x for x in parts) and not all(':has(' in x for x in parts):
                bad.append(sel.strip()[:120])
        self.assertEqual(bad, [])


def _lin(c):
    c = c / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _rgb(h):
    h = h.lstrip('#')
    return [_lin(int(h[i:i + 2], 16)) for i in (0, 2, 4)]


def _contrast(a, b):
    la, lb = (0.2126 * r + 0.7152 * g + 0.0722 * bb for r, g, bb in (_rgb(a), _rgb(b)))
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# Machado 2009(강도 1.0) 색각이상 모의 행렬: 선형 RGB에 곱한다
_DEUTAN = [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]]
_PROTAN = [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]]


def _lab_sim(h, m):
    v = _rgb(h)
    o = [min(1, max(0, sum(m[i][j] * v[j] for j in range(3)))) for i in range(3)]
    x = 0.4124 * o[0] + 0.3576 * o[1] + 0.1805 * o[2]
    y = 0.2126 * o[0] + 0.7152 * o[1] + 0.0722 * o[2]
    z = 0.0193 * o[0] + 0.1192 * o[1] + 0.9505 * o[2]
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = f(x / 0.9505), f(y), f(z / 1.089)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def _tokens(block):
    return dict(re.findall(r'--([a-z-]+):\s*(#[0-9A-Fa-f]{6})', block))


class VerdictColorTest(unittest.TestCase):
    """v1.12.0 C-22: 판정 색(좋음·주의·다음 단계·피하기·절대 금지)은 글자 대비 4.5:1, 절대 금지 바탕은 페이지·카드와 3:1,
    적록 색약(제1·2색각이상) 모의에서도 판정 글자색끼리 CIELAB ΔE 12 이상 떨어진다. 모양·낱말과 함께 쓰되 색만으로도 덜 헷갈리게"""
    LEVELS = ('ok', 'warn', 'later', 'avoid')

    def modes(self):
        src = read('src', 'app', 'app.src.html')
        light = _tokens(src.split(':root{', 1)[1].split('}', 1)[0])
        media = _tokens(src.split('@media (prefers-color-scheme: dark){', 1)[1].split('}', 2)[0])
        dark = _tokens(src.split(':root[data-theme="dark"]', 1)[1].split('}', 1)[0])
        return {'밝은 화면': light, '어두운 화면(시스템)': media, '어두운 화면(앱 설정)': dark}

    def test_verdict_text_contrast(self):
        bad = []
        for name, t in self.modes().items():
            for k in self.LEVELS:
                for bg in ('surface', k + '-soft'):
                    r = _contrast(t[k], t[bg])
                    if r < 4.5:
                        bad.append('%s %s/%s %.2f' % (name, k, bg, r))
            if _contrast(t['ban-ink'], t['ban-bg']) < 4.5:
                bad.append('%s 절대 금지 글자 %.2f' % (name, _contrast(t['ban-ink'], t['ban-bg'])))
        self.assertEqual(bad, [])

    def test_ban_badge_stands_out_from_page(self):
        bad = ['%s 절대 금지 바탕/%s %.2f' % (name, bg, _contrast(t['ban-bg'], t[bg]))
               for name, t in self.modes().items() for bg in ('bg', 'surface') if _contrast(t['ban-bg'], t[bg]) < 3]
        self.assertEqual(bad, [])

    def test_verdicts_distinct_for_color_blind(self):
        bad = []
        for name, t in self.modes().items():
            for mname, m in (('제2색각이상', _DEUTAN), ('제1색각이상', _PROTAN)):
                for i, a in enumerate(self.LEVELS):
                    for b in self.LEVELS[i + 1:]:
                        d = sum((p - q) ** 2 for p, q in zip(_lab_sim(t[a], m), _lab_sim(t[b], m))) ** 0.5
                        if d < 12:
                            bad.append('%s %s %s-%s ΔE %.1f' % (name, mname, a, b, d))
        self.assertEqual(bad, [])

    def test_dark_blocks_use_same_verdict_colors(self):
        md = self.modes()
        keys = [k for k in md['어두운 화면(앱 설정)'] if k.split('-')[0] in ('ok', 'warn', 'later', 'avoid', 'ban')]
        self.assertEqual({k: md['어두운 화면(시스템)'][k] for k in keys}, {k: md['어두운 화면(앱 설정)'][k] for k in keys})


class TempNameTest(unittest.TestCase):
    def test_parallel_checks_do_not_share_temp_files(self):
        # T('…')·WRAP('…')·path.join(TMP,'…')로 임시 폴더에 쓰는 이름을 모아, 두 파일 이상이 쓰는 이름을 찾는다
        pat = re.compile(r"""\b(?:WRAP|T)\(\s*(['"`])([^'"`]+?)\1|path\.join\(\s*TMP\s*,\s*(['"`])([^'"`]+?)\3""")
        use = {}
        for f in sorted(glob.glob(os.path.join(ROOT, 'tests', 'regression', '*.cjs')) + glob.glob(os.path.join(ROOT, 'tests', 'checks', '*.cjs'))):
            for m in pat.finditer(read(f)):
                use.setdefault(m.group(2) or m.group(4), set()).add(os.path.basename(f))
        shared = {k: sorted(v) for k, v in use.items() if len(v) > 1}
        self.assertEqual(shared, {})


if __name__ == '__main__':
    unittest.main()
