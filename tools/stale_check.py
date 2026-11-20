# -*- coding: utf-8 -*-
"""근거 확인일 점검(v1.8.0): 마지막으로 확인한 지 오래된 근거·자료를 점검 목록으로 보여 준다.

확인일이 있는 곳
  - 참고문헌: src/app/app.src.html 의 REF_INFO {번호: [종류, 확인일]}
  - FODMAP 1회량: src/data/fodmap_serv.py 의 FSERV(항목마다 checked)
  - 궁금한 점(Q&A): src/data/qa.py — 답이 인용한 근거 번호의 확인일 가운데 가장 오래된 날

사용법
  python3 tools/stale_check.py                 # 오늘 기준 365일 넘은 것
  python3 tools/stale_check.py --days 180      # 기준 바꾸기
  python3 tools/stale_check.py --today 2027-11-01 --warn   # 날짜를 정해 미리 보기, 찾아도 종료 코드 0
종료 코드: 오래된 항목이 있으면 1(--warn이면 0)
v1.11.0 L9: 기한(365일)이 90일 안으로 다가온 항목은 실패가 아니라 '미리 알림'으로 보여 준다(--soon 날수).
  GitHub Actions에서는 노란 경고(::warning::)로도 남겨, CI가 실패하기 전에 다시 확인할 수 있게 한다.
"""
import argparse, datetime as dt, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'app', 'app.src.html')
sys.path.insert(0, os.path.join(ROOT, 'src', 'data'))


def ref_info(src_text):
    m = re.search(r'const REF_INFO=\{(.*?)\};', src_text)
    if not m:
        raise SystemExit('REF_INFO를 찾지 못했어요')
    out = {}
    for n, t, d in re.findall(r'(\d+):\["(\w)","(\d{4}-\d{2}-\d{2})"\]', m.group(1)):
        out[int(n)] = (t, d)
    return out


def ref_short(src_text):
    i = src_text.index('const REFS = {')
    j = src_text.index('\n};', i)
    return {int(n): s for n, s in re.findall(r'\n (\d+):\{short:"([^"]*)"', src_text[i:j])}


def check(today, days):
    with open(SRC, encoding='utf-8') as f:
        s = f.read()
    info, short = ref_info(s), ref_short(s)
    limit = today - dt.timedelta(days=days)
    age = lambda d: (today - dt.date.fromisoformat(d)).days
    old_refs = {n: d for n, (t, d) in info.items() if dt.date.fromisoformat(d) < limit}
    missing = sorted(set(short) - set(info))

    import fodmap_serv
    old_fs = [(k, v[6]) for k, v in fodmap_serv.FSERV.items() if dt.date.fromisoformat(v[6]) < limit]

    import qa
    old_qa = []
    for item in qa.QA:
        refs = sorted({qa.SRC[e['src']][0] for e in item['ev']})
        ds = [info[r][1] for r in refs if r in info]
        if ds and dt.date.fromisoformat(min(ds)) < limit:
            old_qa.append((item['id'], min(ds), refs))

    lines = [f'근거 확인일 점검 · 기준일 {today} · {days}일 넘으면 다시 확인', '']
    lines.append(f'참고문헌 {len(info)}건 중 오래된 것 {len(old_refs)}건')
    for n, d in sorted(old_refs.items(), key=lambda x: x[1]):
        lines.append(f'  [{n}] {short.get(n, "?")} · 확인 {d} ({age(d)}일 전)')
    if missing:
        lines.append(f'  확인일이 없는 참고문헌: {missing}')
    lines.append(f'FODMAP 1회량 {len(fodmap_serv.FSERV)}건 중 오래된 것 {len(old_fs)}건')
    for k, d in sorted(old_fs, key=lambda x: x[1]):
        lines.append(f'  {k} · 확인 {d} ({age(d)}일 전)')
    lines.append(f'궁금한 점 {len(qa.QA)}건 중 오래된 근거를 인용한 것 {len(old_qa)}건')
    for i, d, refs in old_qa:
        lines.append(f'  {i} · 가장 오래된 근거 확인 {d} · 근거 {refs}')
    n_old = len(old_refs) + len(old_fs) + len(old_qa) + len(missing)
    return n_old, '\n'.join(lines)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--today', help='기준일(YYYY-MM-DD), 기본은 오늘')
    ap.add_argument('--days', type=int, default=365)
    ap.add_argument('--warn', action='store_true', help='찾아도 종료 코드 0')
    ap.add_argument('--soon', type=int, default=90, help='이 날수 안에 기한이 오는 것을 미리 알림(실패로 치지 않음, 0이면 끔)')
    a = ap.parse_args(argv)
    today = dt.date.fromisoformat(a.today) if a.today else dt.date.today()
    n, text = check(today, a.days)
    print(text)
    k = soon(today, a.days, a.soon)
    if k:
        until = today + dt.timedelta(days=a.soon)
        print(f'\n미리 알림: {a.soon}일 안({until}까지)에 확인 기한이 오는 항목 {k}건. '
              f'목록: python3 tools/stale_check.py --today {until} --warn')
        if os.environ.get('GITHUB_ACTIONS'):
            print(f'::warning title=근거 확인일::{a.soon}일 안에 다시 확인할 근거·자료 {k}건(python3 tools/stale_check.py --today {until} --warn)')
    return 0 if (a.warn or n == 0) else 1


def soon(today, days=365, ahead=90):
    """ahead일 뒤에 오래된 것으로 잡히는 항목 수 - 지금 오래된 항목 수(곧 기한이 오는 것)"""
    if not ahead:
        return 0
    return max(0, check(today + dt.timedelta(days=ahead), days)[0] - check(today, days)[0])


if __name__ == '__main__':
    sys.exit(main())
