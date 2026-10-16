# -*- coding: utf-8 -*-
"""다른 회사의 가공육(햄·소시지·베이컨 등) → src/data/brand10.py (v1.9.0, 2026-10-14)

사용자 요청: 시중 가공육 가운데 아질산염이 든 것을 최대한 찾아 '절대 금지'로 넣고, 한 곳에서 확인한 출처를 붙인다.
CJ제일제당 제품은 CJ더마켓(tools/cj_import.py)에서 넣었고, 여기서는 다른 회사 제품을 넣는다.

자료(제품마다 한 곳)
  dw  동원몰(dongwonmall.com, 동원F&B 공식몰) 상품 상세의 상품정보 제공고시 '원재료 및 함량' 글
  fs  식품안전나라(식품의약품안전처) 국내식품 검색 → 품목제조보고 상세의 '성분 및 원료' 목록
      (회사가 품목제조보고 때 신고한 원료. 보고 일자가 2004~2026년이라 지금은 팔지 않는 제품도 남아 있을 수 있다)
넣는 제품: 원재료(원료)에 아질산나트륨·아질산칼륨·질산나트륨·질산칼륨이 있는 제품(절대 금지),
  그리고 동원몰 고시 글로 확인한 햄·소시지·베이컨 가운데 발색제가 없는 제품(가공육: 피하기).
영양값은 두 곳 모두 글로 된 것이 없어(그림) 넣지 않는다. 판정은 원재료로 정한다.

쓰는 법: python3 tools/brand_import.py [동원 JSON] [식품안전나라 JSON]
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'data', 'brand10.py')
CHECKED = '2026-10-14'
NITRITE = re.compile(r'아질산나트륨|아질산칼륨|질산나트륨|질산칼륨')
MEAT_TY = re.compile(r'햄|소시지|베이컨|건조저장육|프레스햄')


def clean(s):
    s = re.sub(r'할인쿠폰|무료배송|적립금|품절|\[[^\]]*\]|\([^)]*박스[^)]*\)', ' ', s or '')
    s = re.sub(r'\s*/\s*닭가슴살햄', ' ', s)
    s = re.sub(r'\s*[xX×\*]\s*\d+\s*(봉|개|캔|팩|입)?', ' ', s)
    s = re.sub(r'\d+\s*(개|캔|봉)\b', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def slim(t):
    s = re.sub(r'^\s*-\s*', '', t or '')
    s = re.sub(r'\*\s*유통기한[^*]*?이전 제품 기준.*$', '', s)      # 옛 판 원재료 안내가 이어 붙은 경우 앞 판만
    s = re.sub(r'\*\*', '', s)
    for _ in range(3):
        s = re.sub(r'[\(\[]\s*(?:지방\s*일부\s*사용\s*/?\s*)?(?:국산|국내산|외국산|수입산|[가-힣]{1,6}산)(?:\s*[:：]\s*[가-힣, ]+?(?:\s*등)?)?(?:\s*[,·/]\s*(?:국산|국내산|외국산|[가-힣]{1,6}산))*\s*[\)\]]', '', s)
    s = re.sub(r'\s*//\s*', '. ', s)
    return re.sub(r'\s{2,}', ' ', s).strip(' ,')


AL_WORD = r'(?:돼지고기|쇠고기|소고기|닭고기|대두|밀|우유|계란|알류|난류|달걀|게|새우|토마토|복숭아|아황산류|호두|오징어|조개류(?:\([^)]*\))?|메밀|땅콩|고등어|잣)'


def split_allergen(ing):
    """원재료명 끝의 '돼지고기, 대두 함유' 같은 알레르기 표시를 떼어 낸다(알레르기 낱말만 이어진 부분)"""
    m = re.search(r'((?:' + AL_WORD + r'\s*[,·]?\s*)+)함유\s*\.?\s*$', ing)
    if not m:
        return ing, ''
    al = re.sub(r'\s*[,·]\s*', ', ', m.group(1)).strip(' ,')
    return ing[:m.start()].rstrip(' ,.'), al + ' 함유'


def from_dongwon(fp):
    o = json.load(open(fp, encoding='utf-8'))
    groups = {}
    for it in o['items']:
        ing = it['ing'] or ''
        ty = re.sub(r'^\s*-\s*', '', it['ty'] or '')
        if not ing or ing.strip() in ('-',) or re.search(r'참조|상세', ing):
            continue
        if not (MEAT_TY.search(ty) or NITRITE.search(ing)):
            continue
        if re.search(r'생산자|소재지|광혜원', ty):     # 고시 칸이 한 칸씩 밀린 상품: 식품 유형은 원재료로 판단
            ty = '프레스햄'
        name = clean(it['nm']) or clean(it['list'])
        name = re.sub(r'\s*\d+(\.\d+)?\s*(g|kg|ml)\b', '', name).strip()
        name = re.sub(r'^동원\s*', '', name).strip()
        if name in ('리챔',):
            name = '리챔 오리지널'          # 리챔(통조림 햄)의 기본 제품 이름
        if not name.startswith(('리챔',)):
            name = '동원 ' + name
        key = re.sub(r'\s', '', name)
        g = groups.setdefault(key, dict(site='dw', ids=[], names=[], ty=ty, ing=ing, nit=bool(NITRITE.search(ing))))
        g['ids'].append(it['id'])
        for n in (name, clean(it['list'])):
            if n and n not in g['names']:
                g['names'].append(n)
        if NITRITE.search(ing) and not g['nit']:     # 같은 이름의 판 가운데 발색제가 든 판이 있으면 그 판으로
            g.update(ing=ing, ty=ty, nit=True)
    out = []
    for g in groups.values():
        ing, al = split_allergen(slim(g['ing']))
        out.append(dict(site='dw', id=g['ids'][0], ids=g['ids'][:6], name=g['names'][0], names=g['names'][:5], maker='동원F&B',
                        ty=g['ty'].strip(), ing=ing, al=al, nit=g['nit'], checked=CHECKED))
    return out


BRAND = [('롯데웰푸드', '롯데'), ('농협목우촌', '목우촌'), ('오뗄', '오뗄'), ('에쓰푸드', '존쿡'), ('하림', '하림'), ('진주햄', '진주햄'),
         ('사조', '사조'), ('대상', '청정원'), ('동원', '동원'), ('소금집', '소금집'), ('한성기업', '한성'), ('선진햄', '선진'), ('대경햄', '대경햄'),
         ('참프레', '참프레')]


def brand_of(bsn):
    for k, b in BRAND:
        if k in bsn:
            return b
    return re.sub(r'\(주\)|주식회사|\s.*$', '', bsn).strip()


def from_fs(fp):
    """식품안전나라 국내식품 검색 결과(품목유형 햄·소시지·베이컨·건조저장육) 가운데 주요 회사 제품의 품목제조보고 상세.
    같은 회사·같은 제품 이름의 보고가 여럿이면(공장·판) 가장 최근 원장 번호 하나만 받았다."""
    if not fp or not os.path.exists(fp):
        return []
    o = json.load(open(fp, encoding='utf-8'))
    out = []
    for it in o['items']:
        raws = it.get('raws') or []
        ing = ', '.join(raws)
        if not raws or not NITRITE.search(ing):
            continue
        nm = re.sub(r'\s+', ' ', it['nm']).strip()
        b = brand_of(it['bsn'])
        name = nm if b in nm or (b == '존쿡' and '존쿡' in nm) else b + ' ' + nm
        out.append(dict(site='fs', id=it['no'], ledg=it['ledg'], name=name, names=[name, nm], maker=it['bsn'], ty=it['ty'],
                        ing=ing, al='', nit=True, date=(it.get('date') or '').replace('.', '-'), checked=CHECKED))
    return out


def main(dw_fp, fs_fp):
    P = from_dongwon(dw_fp) + from_fs(fs_fp)
    P.sort(key=lambda r: (r['site'], r['maker'], r['name']))
    with open(OUT, 'w', encoding='utf-8') as fp:
        fp.write('# -*- coding: utf-8 -*-\n# 자동 생성 파일 — tools/brand_import.py (손으로 고치지 않음)\n')
        fp.write('# 다른 회사 가공육: dw 동원몰 상품정보 제공고시, fs 식품안전나라 품목제조보고(성분 및 원료). %s 확인\n' % CHECKED)
        fp.write('CHECKED = %r\nP = [\n' % CHECKED)
        for r in P:
            fp.write(' ' + repr(r) + ',\n')
        fp.write(']\n')
    print('products', len(P), 'nitrite', sum(1 for r in P if r['nit']), 'by site', {s: sum(1 for r in P if r['site'] == s) for s in ('dw', 'fs')})


if __name__ == '__main__':
    a = sys.argv[1:] + [None, None]
    main(a[0] or '/tmp/claude-0/cj/dongwon_raw.json', a[1] or '/tmp/claude-0/cj/fs_raw.json')
