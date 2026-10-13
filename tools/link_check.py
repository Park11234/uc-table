# -*- coding: utf-8 -*-
"""참고문헌·레시피 링크 점검(v1.8.0)

앱 소스(src/app/app.src.html)의 참고문헌 출처(REFS cite)와 레시피 주소(url:"…"),
문서(README.md, docs/*.md)의 링크를 모아 점검한다.

  python3 tools/link_check.py                  # 내려받지 않고 형식만 점검(https·중복·주소 모양)
  python3 tools/link_check.py --online         # 실제로 주소를 열어 응답 코드 확인(정기 점검용, GitHub Actions에서 매달)
  python3 tools/link_check.py --online --report link-report.md

--online은 사이트에 요청을 보낸다. 사이트가 자동 접속을 막아 403·429가 나오면 '확인 필요'로 따로 보여 주고,
404·410·연결 실패만 '깨짐'으로 센다. 깨진 링크가 있으면 종료 코드 1.
"""
import argparse, concurrent.futures as cf, os, re, sys, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'app', 'app.src.html')
DOCS = [os.path.join(ROOT, 'README.md')] + [os.path.join(ROOT, 'docs', f) for f in sorted(os.listdir(os.path.join(ROOT, 'docs'))) if f.endswith('.md')]
HOST = r'(?:[a-z0-9-]+\.)+[a-z]{2,}'
BARE = re.compile(r'(?<![\w/@.])((?:www\.)?' + r'(?:[a-z0-9-]+\.)+(?:com|org|net|gov|edu|kr|int|io|au|uk|nz)' + r'/[^\s"<>,;)\]]+)', re.I)
FULL = re.compile(r'https?://' + HOST + r'(?::\d+)?(?:/[^\s"<>)\]`]*)?', re.I)


def clean(u):
    return u.rstrip('.,;:)]}\'"')


def collect():
    """[(url, 출처)] 목록. 출처 예: 'ref 58', 'recipe r_juk', 'docs/evidence.md'"""
    out = []
    with open(SRC, encoding='utf-8') as f:
        s = f.read()
    i = s.index('const REFS = {'); j = s.index('\n};', i)
    for n, cite in re.findall(r'\n (\d+):\{short:"[^"]*",cite:"([^"]*)"', s[i:j]):
        for u in FULL.findall(cite):
            out.append((clean(u), f'ref {n}'))
        rest = FULL.sub(' ', cite)
        for u in BARE.findall(rest):
            out.append(('https://' + clean(u), f'ref {n}'))
    for k, u in re.findall(r'\b(r_[a-z0-9_]+):\{[^{}]*?url:"([^"]+)"', s):
        out.append((u, f'recipe {k}'))
    seen_rec = {u for u, w in out if w.startswith('recipe')}
    for u in re.findall(r'url:"(https?://[^"]+)"', s):
        if u not in seen_rec:
            out.append((u, 'recipe'))
            seen_rec.add(u)
    for p in DOCS:
        with open(p, encoding='utf-8') as f:
            t = f.read()
        for u in FULL.findall(t):
            out.append((clean(u), os.path.relpath(p, ROOT)))
    return out


def offline_report(items):
    by = {}
    for u, w in items:
        by.setdefault(u, []).append(w)
    bad = [(u, ws) for u, ws in by.items() if not re.match(r'^https://' + HOST + r'(?::\d+)?(/|$)', u, re.I)]
    hosts = {}
    for u in by:
        h = re.sub(r'^https?://', '', u).split('/')[0].lower()
        hosts[h] = hosts.get(h, 0) + 1
    return by, bad, hosts


def fetch(u, timeout=15):
    req = urllib.request.Request(u, method='HEAD', headers={'User-Agent': 'Mozilla/5.0 (uc-table link check)'})
    for method in ('HEAD', 'GET'):
        req.method = method
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.status, r.geturl()
        except urllib.error.HTTPError as e:
            if method == 'HEAD' and e.code in (403, 405, 501):
                continue
            return e.code, u
        except Exception as e:  # 연결 실패·시간 초과
            if method == 'HEAD':
                continue
            return f'error: {type(e).__name__}', u
    return 'error', u


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--online', action='store_true', help='실제로 주소를 열어 확인')
    ap.add_argument('--report', help='결과를 마크다운 파일로 저장')
    ap.add_argument('--only', help='이 문자열이 들어간 주소만(점검용)')
    a = ap.parse_args(argv)
    items = collect()
    if a.only:
        items = [x for x in items if a.only in x[0]]
    by, bad, hosts = offline_report(items)
    lines = [f'링크 {len(by)}개(출처 {len(items)}곳) · 사이트 {len(hosts)}곳']
    for h, n in sorted(hosts.items(), key=lambda x: -x[1])[:12]:
        lines.append(f'  {h}: {n}')
    if bad:
        lines.append(f'형식 문제 {len(bad)}개(https가 아니거나 주소 모양이 이상함)')
        for u, ws in bad:
            lines.append(f'  {u} ← {", ".join(sorted(set(ws)))}')
    broken, blocked = [], []
    if a.online:
        with cf.ThreadPoolExecutor(max_workers=4) as ex:
            res = dict(zip(by, ex.map(fetch, by)))
        for u, (code, final) in res.items():
            if isinstance(code, int) and code < 400:
                continue
            (blocked if code in (401, 403, 429) else broken).append((u, code, by[u]))
        lines.append(f'온라인 확인: 정상 {len(by) - len(broken) - len(blocked)} · 확인 필요(자동 접속 차단) {len(blocked)} · 깨짐 {len(broken)}')
        for title, rows in (('깨짐', broken), ('확인 필요', blocked)):
            for u, code, ws in rows:
                lines.append(f'  [{title}] {code} {u} ← {", ".join(sorted(set(ws)))}')
    text = '\n'.join(lines)
    print(text)
    if a.report:
        with open(a.report, 'w', encoding='utf-8') as f:
            f.write('# 링크 점검 결과\n\n```\n' + text + '\n```\n')
    return 1 if (bad or broken) else 0


if __name__ == '__main__':
    sys.exit(main())
