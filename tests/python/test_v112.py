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
