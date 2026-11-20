# -*- coding: utf-8 -*-
"""v1.13.0 17차(2026-11-14) 화면 다듬기 점검: unslop(Damir Sokolovsky @heydamir, CC BY 4.0) 진단에서 찾은 것.
실행: python3 -m unittest discover -s tests/python -v

화면용 CSS만 본다(진료 PDF·인쇄용 #report·#printDoc 부분은 빼고).
- 글자 굵기는 600까지(굵은 제목 800·700 없음), 굵은 글씨(b·strong)와 제목도 600
- 여백·간격(padding·margin·gap)은 4px 단계(3px 미만 미세 조정만 예외). 화면 마크업의 style="" 도 같다
- 글자 크기 종류를 줄임(큰 숫자 3가지 포함 16가지 이하)
- 16px보다 작은 글자에는 자간을 좁히지 않음
- 목록 줄·안내 카드 아이콘은 색 칸 없이 옅은 글씨 색. 홈 바로 가기 세 개는 한 판에
- 식단 단계 눈금(●●○)을 단계 이름 옆에 같은 모양으로
"""
import os, re, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = open(os.path.join(ROOT, 'src', 'app', 'app.src.html'), encoding='utf-8').read()
_i = SRC.index('<style'); _j = SRC.index('</style>', _i)
CSS = SRC[_i:_j]
UI = CSS[:CSS.index('/* report (pdf) */')] + CSS[CSS.index('/* ===== v1.11.0'):]
JS = SRC[_j:]
JS_UI = JS[:JS.index('function reportBlocks(')] + JS[JS.index('function syncProfileInputs('):]   # 진료 PDF 만드는 부분은 뺌
SP = r'((?:padding|margin|gap|row-gap|column-gap)(?:-[a-z]+)?):\s*([^;}"]+)'


def px(v):
    return float(v[:-3]) * 16 if v.endswith('rem') else float(v[:-2])


class UnslopTest(unittest.TestCase):
    def test_weights(self):
        self.assertEqual(re.findall(r'font-weight:\s*(?:[7-9]00|bold)', UI), [])
        self.assertIn('b,strong{font-weight:600}', UI)
        self.assertIn('h1,h2,h3,h4,th{font-weight:600}', UI)

    def test_spacing_grid(self):
        off = []
        for src, where in ((UI, 'css'), (' '.join(re.findall(r'style="([^"]*)"', JS_UI)), 'style')):
            for prop, val in re.findall(SP, src):
                for v in re.findall(r'(?<![\w.$])(-?\d+(?:\.\d+)?)px', val):
                    x = abs(float(v))
                    if x >= 3 and x % 4:
                        off.append(f'{where} {prop}:{val.strip()}')
        self.assertEqual(off[:8], [], f'{len(off)}곳')
        self.assertEqual([v for v in re.findall(r'closeBtn\((\d+)\)', SRC) if int(v) % 4], [])   # 닫기 단추 위 여백(px)

    def test_font_sizes(self):
        sizes = set(re.findall(r'font-size:\s*([\d.]+(?:rem|px|em))', UI))
        self.assertLessEqual(len(sizes), 16, sorted(sizes))

    def test_small_text_tracking(self):
        bad = []
        for sel, body in re.findall(r'([^{}]+)\{([^{}]*letter-spacing:\s*-[^{}]*)\}', UI):
            fs = re.search(r'font-size:\s*([\d.]+(?:rem|px))', body)
            if (fs and px(fs.group(1)) < 16) or (not fs and sel.strip() != 'h1,h2,h3,h4'):
                bad.append(sel.strip()[-50:])
        self.assertEqual(bad, [])

    def test_quiet_icons(self):
        self.assertRegex(UI, r'\.lic\{[^}]*background:transparent!important;[^}]*color:var\(--muted\)!important')
        self.assertRegex(UI, r'\.tile i\{[^}]*background:none')
        self.assertNotRegex(SRC, r'class="tile"[^>]*><i class="t-')
        self.assertRegex(UI, r'\.tiles\.t3\{[^}]*background:var\(--surface\)')

    def test_stage_dots(self):
        self.assertIn('const stageDots=', SRC)
        self.assertIn('${stageDots(n)}', SRC)   # 23차: 식사 이름 표시(stgH)가 눈금을 함께 그림
        self.assertGreaterEqual(SRC.count(',1)}'), 4)
        self.assertIn('.sdots', UI)


if __name__ == '__main__':
    unittest.main()
