# -*- coding: utf-8 -*-
"""음식마다 '확인 날짜'(그 음식을 앱에 넣은 날) 기록 — src/data/added.json (v1.10.0)

앱의 음식 정보 화면은 이 날짜를 '확인 날짜'로 보여 준다(사용자 요청: 확인 날짜 = 그 음식을 추가한 날).
1년 지난 것을 다시 확인하라는 점검은 하지 않는다(사용자 요청).

처음 만든 방법(--from-git, 2026-10-16 한 번):
  1) 저장소 기록(git)에서 커밋마다 빌드된 앱(src/app/index.html)의 음식 id를 모아, 처음 나온 커밋의 날짜
     - v1.0.0(2026-09-24 첫 업로드) 음식 439종은 2026-09-24. 그 전 날짜는 기록이 없다
     - v1.1.0~v1.8.0 사이 음식은 다음 업로드인 2026-10-13
  2) 넣은 날이 따로 적힌 음식은 그 날짜가 더 이르면 그 날짜
     - 시판 과자·사탕(snack_check, v1.6.1): 2026-09-30, 시판 라면(ramen_check, v1.6.2): 2026-10-01
     - 마트·편의점 17종(mart_check): 2026-10-14
     - 시판 제품 1,059종(spec10): 판매처에서 확인하고 넣은 날(PSRC의 확인 날짜, 2026-10-14·15)
  3) v1.10.0 외식 메뉴 41종(spec11): 2026-10-16(--add)

새 음식을 넣을 때(--add): 아직 날짜가 없는 음식에 오늘(또는 준 날짜)을 넣는다.
  python3 tools/added_dates.py                    # 날짜가 없는 음식 확인
  python3 tools/added_dates.py --add              # 오늘 날짜
  python3 tools/added_dates.py --add 2026-11-02   # 날짜를 정해서
generate_dataset.py는 날짜가 없는 음식이 있으면 멈추고 이 명령을 알려 준다.
"""
import argparse, datetime as dt, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'data', 'added.json')
ID_RE = re.compile(r'\b(?:L?F)\("([a-z0-9_]+)"')


def ids_in(text):
    return set(ID_RE.findall(text))


def current_ids():
    """지금 앱의 음식 id: 앱 소스에 직접 적힌 음식(F) + 음식 사전(spec1~spec11, generate_dataset.py가 쓰는 목록)"""
    src = open(os.path.join(ROOT, 'src', 'app', 'app.src.html'), encoding='utf-8').read()
    sys.path.insert(0, os.path.join(ROOT, 'src', 'data'))
    from spec1 import G; from spec2 import P; from spec3 import DY, V; from spec4 import FR, FAT, ETC
    from spec5 import DS; from spec6 import EX; from spec7 import TR; from spec8 import TR8; from spec9 import TR9
    from spec10 import TR10; from spec11 import EO
    return ids_in(src) | {x[0] for x in G + P + DY + V + FR + FAT + ETC + DS + EX + TR + TR8 + TR9 + TR10 + EO}


def git(*a):
    return subprocess.run(['git', '-C', ROOT] + list(a), capture_output=True, text=True, check=True).stdout


def from_git():
    first = {}
    for line in git('log', '--reverse', '--format=%h %ad', '--date=short').split('\n'):
        if not line.strip():
            continue
        c, d = line.split()
        try:
            text = git('show', c + ':src/app/index.html')
        except subprocess.CalledProcessError:
            continue
        for i in ids_in(text):
            first.setdefault(i, d)
    sys.path.insert(0, os.path.join(ROOT, 'src', 'data'))
    import snack_check, ramen_check, mart_check
    from spec10 import PSRC10
    known = {}
    for i in snack_check.ING:
        known[i] = '2026-09-30'
    for i in ramen_check.ING:
        known[i] = '2026-10-01'
    for i in mart_check.ING:
        known[i] = '2026-10-14'
    for i, v in PSRC10.items():
        known[i] = v[2]
    out = {}
    for i in current_ids():
        ds = [x for x in (first.get(i), known.get(i)) if x]
        if ds:
            out[i] = min(ds)
    return out


def save(d):
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(dict(sorted(d.items())), f, ensure_ascii=False, indent=0)
        f.write('\n')


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--from-git', action='store_true', help='저장소 기록으로 처음부터 다시 만들기')
    ap.add_argument('--add', nargs='?', const='today', help='날짜가 없는 음식에 날짜 넣기(기본 오늘)')
    a = ap.parse_args(argv)
    if a.from_git:
        d = from_git()
        save(d)
        print('added.json', len(d), '종')
        return 0
    d = json.load(open(OUT, encoding='utf-8')) if os.path.exists(OUT) else {}
    miss = sorted(current_ids() - set(d))
    if a.add:
        day = dt.date.today().isoformat() if a.add == 'today' else a.add
        assert re.match(r'^\d{4}-\d\d-\d\d$', day), day
        for i in miss:
            d[i] = day
        save(d)
        print('날짜를 넣은 음식', len(miss), '종 →', day)
        return 0
    print('날짜가 없는 음식', len(miss), '종', miss[:10])
    return 1 if miss else 0


if __name__ == '__main__':
    sys.exit(main())
