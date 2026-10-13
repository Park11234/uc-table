# -*- coding: utf-8 -*-
"""앱 문구 말투 점검(v1.8.0)

앱 안 문구는 합쇼체(~입니다·~합니다·~십시오·~습니까)로 통일한다.
앱 소스(src/app/app.src.html)와 화면에 들어가는 데이터(src/data/*.py)에서 해요체 끝말(~요)이 남았는지 찾는다.

그대로 두는 곳(원문이라 바꾸면 안 됨):
  - 참고문헌 서지(REFS의 cite) — 자료 제목 그대로(예: 브로셔 'FAQ 그것이 궁금해요')
  - 레시피 제목·재료(RECIPES의 title·ingr) — 레시피 사이트의 글 제목 그대로
  - 궁금한 점의 근거 원문(qa.py의 E(...) 안) — 원문 글자 그대로 대조하는 인용과 위치
  - '필요·주요·중요·마요(마요네즈 별명)'처럼 '요'로 끝나는 낱말

  python3 tools/tone_check.py      # 남은 해요체가 있으면 위치를 보이고 종료 코드 1
"""
import ast, os, re, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORDS = {'필요', '주요', '중요', '마요', '불필요', '개요'}
TOK = re.compile(r'[가-힣]*요(?![가-힣])')


def spans_app(s):
    out = []
    i = s.index('const REFS = {'); j = s.index('\n};', i)
    out += [(i + m.start(), i + m.end()) for m in re.finditer(r'cite:"[^"]*"', s[i:j])]
    i = s.index('const RECIPES'); j = s.index('\n};', i)
    out += [(i + m.start(), i + m.end()) for m in re.finditer(r'(title|ingr):"[^"]*"', s[i:j])]
    return out


def spans_qa(s):
    lines = s.splitlines(keepends=True); off = [0]
    for ln in lines: off.append(off[-1] + len(ln))
    p = lambda l, c: off[l - 1] + len(lines[l - 1].encode('utf-8')[:c].decode('utf-8'))
    return [(p(n.lineno, n.col_offset), p(n.end_lineno, n.end_col_offset))
            for n in ast.walk(ast.parse(s)) if isinstance(n, ast.Call) and getattr(n.func, 'id', '') == 'E']


def find(files=None):
    files = files or [os.path.join(ROOT, 'src', 'app', 'app.src.html')] + sorted(glob.glob(os.path.join(ROOT, 'src', 'data', '*.py')))
    found = []
    for fn in files:
        s = open(fn, encoding='utf-8').read()
        prot = spans_app(s) if fn.endswith('.html') else spans_qa(s) if fn.endswith('qa.py') else []
        for m in TOK.finditer(s):
            if m.group(0) in WORDS or any(a <= m.start() < b for a, b in prot):
                continue
            ln = s.count('\n', 0, m.start()) + 1
            found.append((os.path.relpath(fn, ROOT), ln, m.group(0), s[max(0, m.start() - 30):m.end() + 3].replace('\n', ' ')))
    return found


if __name__ == '__main__':
    f = find()
    for fn, ln, w, ctx in f[:80]:
        print(f'{fn}:{ln}  {w}  …{ctx}…')
    print(f'해요체 끝말 {len(f)}곳')
    sys.exit(1 if f else 0)
