# -*- coding: utf-8 -*-
"""시판 만두·육포·냉동 볶음밥·국·탕·찌개(포장 표시 사진에서 읽은 값) → src/data/label10.py (v1.9.0, 2026-10-15)

사용자 요청: 육포 같은 것도 넣고, 만두(닭가슴살 만두와 일반 만두, 종류 가리지 않음)는
영양정보와 원재료명을 다 확인해서 넣는다. 냉동 볶음밥 같은 종류와 김치찌개·된장찌개 같은 국·탕·찌개도
브랜드를 가리지 않고 넣는다(밀키트·도시락 제외). 제품마다 한 곳에서 확인하고 출처를 붙인다.
kind: mandu(기본)·jerky·friedrice(볶음밥·비빔밥·주먹밥·솥밥·필라프)·stew(국·탕·찌개·곰탕·삼계탕)

자료(제품마다 한 곳)
  dl  동원몰(dongwonmall.com) 상품 상세에 실린 포장 표시 사진(영양정보·원재료명·알레르기 표시)
      사진이 없고 상품정보 제공고시 글만 있는 제품은 그 글(원재료명). 같은 상품 번호의 판매처는
      동원F&B뿐 아니라 사조대림·사조오양·하림·청아냉동식품·샘표 등 입점 업체도 있다.
  rk  랭킹닭컴(rankingdak.com) 상품 상세에 실린 포장 표시 사진(닭가슴살 만두)
  im  아임닭(imdak.com) 상품 상세에 실린 포장 표시·상품정보 고시 이미지
  pm  풀무원샵(shop.pulmuone.co.kr) 상품 상세에 실린 포장 표시 이미지(풀무원·올가·풀스키친 만두, 올가 육포, 볶음밥·주먹밥, 반듯한식·올가 국·탕·찌개)
  판매처에 영양정보가 없는 몇 제품은 같은 품목보고번호(없으면 같은 제조사·제품명·중량)의
  식약처 가공식품 DB(2026-08-28) 값을 쓰고 nsrc='mfds'로 표시한다(원재료명은 판매처).
  영양정보를 끝내 찾지 못한 제품은 영양값 없이 원재료로만 판정한다.

입력 JSON: 사진을 읽어 적은 기록 목록(키: site, id, names, maker, ty, rpt, ing, al, tot, tu, b, bu,
  kcal, na, c, s, f, tf, sf, ch, p, fi, nut_text, nsrc, nsrc_date, note, kind, also, pid, checked, serv)
쓰는 법: python3 tools/label_import.py [JSON 경로]
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'data', 'label10.py')
NITRITE = re.compile(r'아질산나트륨|아질산칼륨|질산나트륨|질산칼륨')
KEEP = ['site', 'id', 'pid', 'also', 'kind', 'names', 'maker', 'ty', 'rpt', 'ing', 'al', 'nit', 'tot', 'tu', 'b', 'bu', 'serv',
        'kcal', 'na', 'c', 's', 'f', 'tf', 'sf', 'ch', 'p', 'fi', 'nut_text', 'nsrc', 'nsrc_date', 'note', 'doc', 'checked']
NUT = ['kcal', 'na', 'c', 's', 'f', 'tf', 'sf', 'ch', 'p', 'fi']


def norm(r):
    q = dict(r)
    raw = str(q['id'])
    pid = str(q.get('pid') or raw.split('_')[0])
    vid = ''
    if '_' in raw:                       # 한 상품 번호에 맛이 여럿(질러·맛있닭 등): 끝에 a, b, c…
        vid = 'abcdefghijklmnopqrstuvwxyz'[int(raw.split('_')[1]) - 1]
    q['id'] = re.sub(r'\W', '', pid).lower() + vid      # 앱 음식 id는 소문자·숫자만
    q['pid'] = pid
    q['kind'] = q.get('kind') or 'mandu'
    q['names'] = list(dict.fromkeys(re.sub(r'\s+', ' ', n).strip() for n in q['names'] if n and n.strip()))
    q['nit'] = bool(NITRITE.search(q['ing']))
    q['also'] = [a for a in (q.get('also') or []) if a != pid]
    q.setdefault('checked', '2026-10-15')
    for k in NUT:
        v = q.get(k)
        if isinstance(v, float) and v.is_integer():
            q[k] = int(v)
    return {k: q.get(k) for k in KEEP if q.get(k) not in (None, '', [])} | {k: q.get(k) for k in NUT + ['b', 'tot']}


def check(q):
    msg = []
    if q['kcal'] is not None:
        atw = q['c'] * 4 + q['p'] * 4 + q['f'] * 9
        if abs(atw - q['kcal']) > max(15, 0.15 * q['kcal']):
            msg.append('열량 %s ≠ 계산 %.0f' % (q['kcal'], atw))
        if q['s'] is not None and q['s'] > q['c'] + 0.5:
            msg.append('당류 > 탄수화물')
        if q['sf'] is not None and q['sf'] > q['f'] + 0.5:
            msg.append('포화지방 > 지방')
    return msg


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/dl/labels.json'
    db = json.load(open(src, encoding='utf-8'))
    recs = sorted((norm(r) for r in db.values()), key=lambda q: (q['site'], q['kind'], q['names'][0]))
    ids = [q['site'] + q['id'] for q in recs]
    assert len(ids) == len(set(ids)), '같은 id'
    bad = 0
    for q in recs:
        m = check(q)
        if m:
            bad += 1
            print('점검', q['site'] + q['id'], q['names'][0], m)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('# -*- coding: utf-8 -*-\n')
        f.write('# 자동 생성 파일 — tools/label_import.py (손으로 고치지 않음)\n')
        f.write('# 시판 만두·육포·볶음밥·주먹밥·국·탕·찌개: dl 동원몰 상품 상세의 포장 표시 사진(일부는 상품정보 제공고시 글), rk 랭킹닭컴, im 아임닭, pm 풀무원샵 상품 상세의 포장 표시 사진.\n')
        f.write("# nsrc='mfds'인 제품의 영양값은 식약처 가공식품 DB(2026-08-28). 2026-10-15 확인\n")
        f.write("CHECKED = '2026-10-15'\nP = [\n")
        for q in recs:
            f.write(' ' + repr(q) + ',\n')
        f.write(']\n')
    kinds = {}
    for q in recs:
        kinds[q['kind']] = kinds.get(q['kind'], 0) + 1
    print('records', len(recs), kinds, 'nitrite', sum(q['nit'] for q in recs), 'no nutrition', sum(q['kcal'] is None for q in recs), 'check', bad)


if __name__ == '__main__':
    main()
