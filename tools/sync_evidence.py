# -*- coding: utf-8 -*-
"""docs/evidence.md의 근거 표를 앱의 참고문헌(REFS, src/app/app.src.html)에서 다시 만든다.

앱 화면의 번호와 문서의 번호가 어긋나지 않게, 표는 손으로 고치지 않고 이 스크립트로 만든다.
  python3 tools/sync_evidence.py          표를 다시 씀
  python3 tools/sync_evidence.py --check  다르면 종료 코드 1(단위 점검에서 사용)
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'app', 'app.src.html')
DOC = os.path.join(ROOT, 'docs', 'evidence.md')
HEAD = '| 번호 | 자료 | 서지 정보 |\n|---|---|---|\n'


def refs():
    with open(SRC, encoding='utf-8') as f:
        s = f.read()
    i = s.index('const REFS = {')
    blk = s[i:s.index('\n};', i)]
    q = r'"((?:[^"\\]|\\.)*)"'
    out = {}
    for m in re.finditer(r'^\s*(\d+):\{short:' + q + r',cite:' + q, blk, re.M):
        un = lambda t: t.replace('\\"', '"').replace('\\\\', '\\').replace('|', '\\|')  # noqa: E731
        out[int(m.group(1))] = (un(m.group(2)), un(m.group(3)))
    return out


def table():
    return HEAD + ''.join(f'| {n} | {a} | {b} |\n' for n, (a, b) in sorted(refs().items()))


def render(doc):
    i = doc.index(HEAD)
    j = doc.index('\n\n', i)  # 표 다음 빈 줄
    return doc[:i] + table() + doc[j + 1:]


if __name__ == '__main__':
    with open(DOC, encoding='utf-8') as f:
        doc = f.read()
    new = render(doc)
    if '--check' in sys.argv:
        sys.exit(0 if new == doc else 1)
    with open(DOC, 'w', encoding='utf-8') as f:
        f.write(new)
    print('docs/evidence.md 근거', len(refs()), '건')
