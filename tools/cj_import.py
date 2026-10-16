# -*- coding: utf-8 -*-
"""CJ더마켓(CJ제일제당 공식몰) 상품정보 제공고시 → src/data/cj10.py (v1.9.0, 2026-10-14)

모은 방법(한 곳 확인)
  CJ더마켓 카테고리 상품 목록(/the/api/category/v1/{분류}/products)에서 식품 분류의 상품을 모두 받고,
  상품마다 '상품정보 제공고시'(/the/api/product/v1/ftcInfo: 식품의 유형·원재료명 및 함량·알레르기 유발물질)와
  영양정보(/the/api/product/v1/nutritions/{자재코드}: 표시 기준량당 열량·나트륨·탄수화물·당류·지방·
  트랜스지방·포화지방·콜레스테롤·단백질)를 앱 안 브라우저로 받아 JSON으로 저장했다(1,980개 자재).
  이 스크립트는 그 JSON(저장소에는 넣지 않음)을 읽어 앱에 넣을 상품만 골라 src/data/cj10.py를 만든다.

넣지 않은 것
  - 밀키트·도시락(사용자 요청), 여러 제품을 묶은 세트(제품마다 고시가 따로 있음)
  - 원재료명이 글자로 없고 '상품상세 참조'(그림)로만 적힌 상품, 영양정보가 없는 상품
  - 조리 재료: 양념·소스·식용유·설탕·소금·밀가루·조미료·육수(분류 0044), 먹는샘물·탄산수, 업소용 대용량
  - 분유·이유식·건강기능식품·선물세트·서비스(처음부터 받지 않음)
같은 원재료명·같은 열량·나트륨인 상품(용량·묶음만 다름)은 한 음식으로 묶고, 나머지 이름은 별명으로 둔다.

쓰는 법: python3 tools/cj_import.py <받은 JSON 경로>
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'data', 'cj10.py')
CHECKED = '2026-10-14'

EXCL_CAT = ('0044',)                    # 양념·소스·오일(조리 재료)
EXCL_NAME = re.compile(r'밀키트|쿡킷|키트|도시락|세트|기획전|골라담기|\+|시럽|레몬즙|라임즙|베이킹|파우더(?!.*(프로틴|단백))|\d+\s*종|혼합\s*set|\bset\b|모음|[가-힣]+\d+\s*,\s*[가-힣]+\d+')
BULK = re.compile(r'대용량|업소용|\d{2,}\s*(kg|KG|Kg)|18\s*L|\d{4,}\s*(ml|mL|ML)')
NITRITE = re.compile(r'아질산나트륨|아질산칼륨|질산나트륨|질산칼륨')
NO_TEXT = re.compile(r'^\s*(-|해당\s*(사항)?\s*없음|상품\s*상세\s*(페이지)?\s*참조|상세\s*(페이지|이미지)\s*참조|이미지\s*참조)\s*$')


def slim_ing(t):
    """원재료명에서 원산지 괄호와 주표시면 함량 안내를 뺀다(앱에는 '원산지 표기 생략'으로 밝힌다)"""
    s = re.sub(r'\r?\n?\*?\s*주표시면[^\n]*$', '', t or '').replace('\r', '')
    s = re.sub(r'\n+', ' ', s)
    pat = r'[\(\[]\s*(?:원산지\s*:?\s*)?(?:국산|국내산|수입산|외국산|[가-힣]{1,6}산)(?:\s*[,·/]\s*(?:국산|국내산|외국산|[가-힣]{1,6}산))*(?:\s*등)?\s*[\)\]]'
    s = re.sub(r'외국산\s*:\s*[가-힣,\s]+등', '외국산', s)      # 먼저 줄여야 아래에서 원산지 괄호로 지워진다
    for _ in range(3):
        s = re.sub(pat, '', s)
    return re.sub(r'\s{2,}', ' ', s).strip(' ,')


def allergy_part(t):
    """알레르기 표시 가운데 '함유' 부분만(같은 제조시설·혼입 안내는 뺀다)"""
    t = (t or '').replace('\r', ' ').replace('\n', ' ').strip()
    if not t or NO_TEXT.match(t):
        return ''
    if re.match(r'^\s*이\s*제품은', t) and re.search(r'사용한\s*제품과|같은\s*제조|동일\s*제조|제조\s*시설', t) and '함유' not in t.split('제품과')[0]:
        return ''
    t = re.split(r'(?:이\s*제품은\s*)?[^.]*?(?:사용한\s*제품과|같은\s*제조|동일\s*제조|제조\s*시설|생산\s*시설|혼입)', t)[0]
    return t.strip(' ,.')


def clean_name(n):
    s = re.sub(r'\[[^\]]*\]|【[^】]*】', ' ', n or '')
    s = re.sub(r'\s*/\s*(상온|냉장|냉동|실온)\s*$', ' ', s)          # '/상온' 같은 보관 표시
    s = s.replace('/', ' ')
    s = re.sub(r'\((?:증정|행사|NEW|신상|한정)[^)]*\)', ' ', s)
    s = re.sub(r'\d+(?:\.\d+)?\s*(?:kg|KG|Kg|g|G|ml|mL|ML|L|l)(?![a-zA-Z])', ' ', s)
    s = re.sub(r'\s*[xX×\*]\s*\d+\s*(?:개입|개|입|봉|팩|캔|병|EA|ea)?', ' ', s)
    s = re.sub(r'\d+\s*(?:개입|개|입|봉|팩|캔|병|번들|매|장|구)\b', ' ', s)
    s = re.sub(r'번들|\(\s*\)|_', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip(' -/,')
    return s


def basis(n):
    """영양정보 기준량(값이 이 양당). per가 0·없음이면 총 내용량 기준"""
    per, pu = n.get('per'), n.get('pu')
    tot, tu = n.get('tot'), n.get('tu')
    if per and per > 0 and pu in ('g', 'ml'):
        return float(per), pu
    if tot and tot > 0 and tu in ('g', 'ml'):
        return float(tot), tu
    return None, None


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


NUMP = r'([\d,]+(?:\.\d+)?|[\dOo]+)'


def fnum(x):
    try:
        return float(x.replace(',', '').replace('O', '0').replace('o', '0'))
    except (ValueError, AttributeError):
        return None


def text_vals(t):
    """고시 '영양성분' 글의 숫자(여러 판이 있으면 [리뉴얼후] 판). 같은 영양소 값이 둘 이상이면 _multi
    _total: '총 내용량 X g (Y kcal)'  _per: 'N g 당 K kcal'(1개(50g)당 등)  _lt: '4 g 미만'처럼 적힌 탄수화물·단백질·지방
    fi·pol·alu·ery: 식이섬유·당알코올·알룰로오스·에리스리톨(열량 계산에서 4kcal/g로 셈하지 않는 탄수화물)"""
    s = (t or '').replace('\r', '\n')
    m = re.search(r'리뉴얼\s*후\]?(.*)$', s, re.S)
    if m:
        s = m.group(1)
    s = re.sub(r'\d[\d,]*\s*kcal\s*기준', '', s)
    out = {'_lt': set()}
    for k, pat in [('na', r'나트륨\s*:?\s*' + NUMP + r'\s*mg'), ('c', r'탄수화물\s*:?\s*' + NUMP + r'\s*g'),
                   ('f', r'(?<![화스])지방\s*:?\s*' + NUMP + r'\s*g'), ('p', r'단백질\s*:?\s*' + NUMP + r'\s*g'),
                   ('fi', r'식이섬유\s*:?\s*' + NUMP + r'\s*g'), ('pol', r'당\s*알코?올\s*:?\s*' + NUMP + r'\s*g'),
                   ('alu', r'알룰로오?스\s*:?\s*' + NUMP + r'\s*g'), ('ery', r'에리스리톨\s*:?\s*' + NUMP + r'\s*g')]:
        ms = re.findall(pat, s)
        if ms:
            out[k] = fnum(ms[0])
            if len({fnum(x) for x in ms}) > 1:
                out['_multi'] = True
        if k in ('c', 'f', 'p') and re.search(pat + r'\s*미만', s):
            out['_lt'].add(k)
    tm = re.search(r'총\s*내용량\s*:?\s*' + NUMP + r'\s*(g|ml|mL|ML|kg)\s*[\(/]\s*' + NUMP + r'\s*kcal', s)
    if tm:
        x = fnum(tm.group(1)) * (1000 if tm.group(2) == 'kg' else 1)
        out['_total'] = (x, fnum(tm.group(3)))
    out['_per'] = [(fnum(a), fnum(k)) for a, k in re.findall(r'(\d+(?:\.\d+)?)\s*(?:g|ml|mL|ML)\s*\)?\s*당\s*:?\s*' + NUMP + r'\s*kcal(?!\s*미만)', s)
                   if fnum(a) and fnum(k) is not None]
    return out


# 4kcal/g보다 열량이 낮은 탄수화물 원료(식이섬유·당알코올 등). 표시 열량이 계산보다 낮아도 이 원료 때문일 수 있다
LOW_E = re.compile(r'난소화성\s*말토덱스트린|폴리덱스트로스|소비톨|솔비톨|소르비톨|말티톨|에리스리톨|알룰로스|자일리톨|이소말트|락티톨|이눌린|치커리|올리고당|식이섬유|대두다당|구아검|곤약')


def energy(rec, tv):
    """탄수화물·단백질·지방으로 계산한 열량의 범위(kcal). 식이섬유 2·당알코올 2.4·알룰로오스·에리스리톨 0kcal/g,
    나머지 탄수화물·단백질 4, 지방 9kcal/g. '미만'으로 적힌 값은 0~그 값 사이로 본다"""
    c, p, f = rec['c'] or 0, rec['p'] or 0, rec['f'] or 0
    fi = rec['fi'] if rec.get('fi') is not None else (tv.get('fi') or 0)
    left, low = c, 0.0
    for v, e in ((fi, 2), (tv.get('pol') or 0, 2.4), (tv.get('alu') or 0, 0), (tv.get('ery') or 0, 0)):
        take = min(left, v)
        left -= take
        low += take * e
    hi = left * 4 + low + p * 4 + f * 9
    lo = hi - sum({'c': left * 4, 'p': p * 4, 'f': f * 9}[k] for k in tv.get('_lt', ()))
    return lo, hi


def kcal_err(k, rng):
    """표시 열량 k와 계산 범위의 차이(kcal, 상대값)"""
    lo, hi = rng
    d = 0 if lo - 0.5 <= k <= hi + 0.5 else min(abs(k - lo), abs(k - hi))
    return d, d / max(k, hi, 1)


def resolve(rec):
    """영양값의 기준량과 열량을 정한다. 같은 고시의 '영양정보 칸'(숫자)과 '영양성분 글'을 맞춰 보고,
    가능한 해석(칸 그대로·글의 총 내용량 열량·글의 'N g당 열량'·총 내용량 기준 등) 가운데
    열량이 탄수화물·단백질·지방 계산과 가장 잘 맞는 것을 고른다. 맞는 해석이 없으면 None(영양값을 넣지 않음)
    허용 범위: 차이가 15kcal 이하이거나 15% 이하. 표시가 계산보다 낮고 원재료에 식이섬유·당알코올류가 있으면 30%까지"""
    b = rec['b']
    tv = text_vals(rec['nut_text'])
    if not tv.get('_multi'):
        for k in ('na', 'c', 'f', 'p'):
            a, v = tv.get(k), rec.get(k)
            if a is not None and v is not None and abs(a - v) > (max(20, 0.1 * max(a, v)) if k == 'na' else max(0.6, 0.06 * max(a, v))):
                return None, '고시의 영양정보 칸과 영양성분 글의 값이 다름'
        if rec.get('fi') is None and tv.get('fi') is not None:
            rec['fi'] = tv['fi']       # 영양정보 칸에 없고 글에만 있는 식이섬유(같은 기준량)
    else:
        tv = {'_lt': tv['_lt'], '_per': [], **({'_total': tv['_total']} if '_total' in tv else {})}
    if rec.get('s') is not None and rec.get('c') is not None and rec['s'] > rec['c'] + 0.5:
        return None, '당류(%gg)가 탄수화물(%gg)보다 많음' % (rec['s'], rec['c'])
    dens = [k / x for x, k in tv.get('_per', []) if x]
    if dens and max(dens) - min(dens) > max(0.02 * max(dens), 0.01):     # 기준량이 달라도 1g(ml)당 열량은 같아야 한다
        return None, '한 상품 글에 영양정보가 둘 이상(맛·제품이 여러 개)'
    rng = energy(rec, tv)
    low_e = bool(LOW_E.search(rec.get('ing') or ''))
    gen = b == 100     # 칸의 기준량 100은 기본값으로 들어간 경우가 있어(실제는 총 내용량·1개 기준) 글의 기준량을 먼저 믿는다
    # 해석 (기준량, 열량, 순위): 값(칸의 숫자)이 그 기준량당이라고 본다. 순위가 낮을수록 먼저(계산과 맞는 정도가 같을 때)
    main, extra = [], []
    for x, k in tv.get('_per', []):                       # 글에 'N g당 K kcal'(1개(50g)당 등)
        if x == b and rec['kcal'] is not None and abs(k - rec['kcal']) <= 1:
            continue                                     # 칸과 같은 내용
        main.append((x, k, 0 if abs(x - b) < 1 else 1 if gen else 3))   # 칸의 기준량은 소수점을 버린 값(4.5g → 4)일 때가 있다
    if tv.get('_total') and tv['_total'][0] and tv['_total'][1]:
        x, t = tv['_total']
        main.append((x, t, 1 if gen else 3))              # 값이 사실은 총 내용량 기준(칸의 기준량 표기가 틀림)
        main.append((b, round(t * b / x, 1), 3 if gen else 2))   # 값은 칸의 기준량당, 글의 열량은 총 내용량 기준
    if rec['kcal'] is not None:
        main.append((b, rec['kcal'], 2 if gen else 1))     # 칸 그대로
        tot = rec['tot'] or 0
        if tot and tot != b and rec['tu'] == rec['bu']:
            extra.append((b, round(rec['kcal'] * b / tot, 1), 4))      # 열량 칸만 총 내용량 기준
            extra.append((tot, round(rec['kcal'] * tot / b, 1), 4))    # 영양소 칸이 총 내용량 기준
    if not main and not extra:
        return (b, None), None          # 열량이 없으면 앱이 탄수화물·단백질·지방으로 계산(표시)
    for cands in (main, extra):          # 칸·글로 읽히는 해석이 맞지 않을 때만 '칸의 기준량이 틀림'을 본다
        ok = []
        for x, k, pr in cands:
            d, rel = kcal_err(k, rng)
            lim = 0.30 if (low_e and k < rng[0]) else 0.15
            if d <= 15 or rel <= lim:
                ok.append((int(rel / 0.05), pr, x, k))   # 계산과 맞는 정도(5% 단위)가 같으면 순위로
        if ok:
            ok.sort()
            _, _, x, k = ok[0]
            return (x, k), None
    k0 = rec['kcal'] if rec['kcal'] is not None else (main or extra)[0][1]
    return None, '열량 %gkcal이 탄수화물·단백질·지방 계산(%gkcal)과 맞지 않음' % (k0, round(rng[1]))


def per100(r, k):
    return (r[k] or 0) * 100 / r['b'] if r.get('b') else 0


def conflict_check(cl, excluded, skipped):
    """원재료명이 같은 상품 묶음끼리 100g(ml)당 나트륨·열량이 1.6배 넘게 다르면 어느 한쪽의 기준량 표기가 틀린 것이다.
    고시 글에 열량의 기준량('100g당 10kcal'·'총 내용량 300g (30kcal)')이 적힌 묶음만 남기고, 글로 뒷받침되지 않는 묶음은 뺀다
    (둘 다 뒷받침되지 않으면 모두 뺀다. 아질산염 가공육은 영양값 없이 남긴다)"""
    def far(k, floor):
        v = [per100(c[0], k) for c in cl if c[0].get('nut_ok') is not False and per100(c[0], k) > floor]
        return len(v) > 1 and max(v) / min(v) >= 1.6
    if not (far('na', 50) or far('kcal', 20)):
        return cl
    def backed(c):
        tv = text_vals(c[0]['nut_text'])
        return bool(tv.get('_per') or tv.get('_total'))
    keep = [c for c in cl if backed(c)]
    out = []
    for c in cl:
        if c in keep or c[0].get('nut_ok') is False:
            out.append(c); continue
        why = '같은 원재료명의 다른 상품과 100g당 값이 크게 다르고 고시 글에 열량 기준량이 없음(기준량 표기 의심)'
        for r in c:
            if NITRITE.search(r['ing']):
                r['nut_ok'] = False
                excluded.append((r['disp'], r['prd'], why + ' → 영양값 없이 넣음(아질산염 가공육)'))
            else:
                skipped['mismatch'] += 1
                excluded.append((r['disp'], r['prd'], why))
        if c[0].get('nut_ok') is False:
            out.append(c)
    return out


def main(src):
    D = json.load(open(src, encoding='utf-8'))
    groups = {}
    skipped = {'cat': 0, 'name': 0, 'multi': 0, 'noing': 0, 'nonut': 0, 'water': 0, 'mismatch': 0}
    excluded, kcal_fix = [], []
    for o in D:
        if all(c.startswith(EXCL_CAT) for c in o['c']):
            skipped['cat'] += 1; continue
        if EXCL_NAME.search((o.get('matNm') or '') + ' ' + (o.get('nm') or '')):
            skipped['name'] += 1; continue
        ms = o.get('ms') or []
        if len(ms) != 1:
            # 여러 제품을 묶은 상품은 넣지 않되, 그 안의 아질산염 가공육은 따로 넣는다(영양값은 묶음 기준이라 쓰지 않음)
            for k, m in enumerate(ms):
                ing = (m.get('ing') or '').strip()
                if NITRITE.search(ing):
                    rec = dict(prd=o['prd'], mat='%s_%d' % (o['mat'], k), disp=(m.get('nm') or '').strip(), sale=(o.get('nm') or '').strip(),
                               cats=o['c'], ty=(m.get('ty') or '').strip(), ing=slim_ing(ing), al=allergy_part(m.get('al')),
                               maker=(m.get('mk') or '').strip(), nut_text='', tot=None, tu=None, b=None, bu=None, kcal=None,
                               na=None, c=None, s=None, f=None, tf=None, sf=None, ch=None, p=None, fi=None, bulk=False, nut_ok=False)
                    vol = re.search(r'([\d.]+)\s*(g|ml)', m.get('vol') or '')
                    if vol:
                        rec['tot'], rec['tu'] = float(vol.group(1)), vol.group(2)
                    groups.setdefault('bundle:' + rec['mat'], []).append(rec)
            skipped['multi'] += 1; continue
        m = ms[0]
        ing = (m.get('ing') or '').strip()
        if not ing or NO_TEXT.match(ing) or len(ing) < 2:
            skipped['noing'] += 1; continue
        ty = re.sub(r'\s+', '', m.get('ty') or '')
        if re.search(r'먹는샘물|탄산수', ty):
            skipped['water'] += 1; continue
        n = o.get('n')
        if not n or not n.get('nut'):
            skipped['nonut'] += 1; continue
        b, bu = basis(n)
        nut = {k: num(v[0]) for k, v in n['nut'].items()}
        if b is None or nut.get('carbohydrates') is None or nut.get('protein') is None or nut.get('fat') is None:
            skipped['nonut'] += 1; continue
        kc = num(n.get('kc'))
        if not kc and (nut.get('carbohydrates') or 0) + (nut.get('protein') or 0) + (nut.get('fat') or 0) > 0:
            kc = None   # 열량 칸이 비어 0으로 온 경우: 앱이 탄수화물·단백질·지방으로 계산(표시)
        key = re.sub(r'[\s.%0-9]+', '', slim_ing(ing))   # 같은 원재료명(함량 숫자는 빼고 비교)
        rec = dict(prd=o['prd'], mat=o['mat'], disp=(o.get('matNm') or '').strip(), sale=(o.get('nm') or '').strip(),
                   cats=o['c'], ty=(m.get('ty') or '').strip(), ing=slim_ing(ing), ing_raw=ing,
                   al=allergy_part(m.get('al')), al_raw=(m.get('al') or '').strip(), maker=(m.get('mk') or '').strip(),
                   nut_text=(m.get('nut') or '').strip(), tot=num(n.get('tot')), tu=n.get('tu'),
                   b=b, bu=bu, kcal=kc, na=nut.get('sodium'), c=nut.get('carbohydrates'), s=nut.get('sugars'),
                   f=nut.get('fat'), tf=nut.get('trans_fat'), sf=nut.get('saturated_fat'), ch=nut.get('cholesterol'),
                   p=nut.get('protein'), fi=nut.get('dietary_fiber'), bulk=bool(BULK.search(o.get('matNm') or '')))
        res, why = resolve(rec)
        if res is None:
            if NITRITE.search(ing):          # 아질산염 가공육은 영양값 없이도 넣는다(판정 '절대 금지'는 원재료명으로 정함)
                rec['nut_ok'] = False
                excluded.append((rec['disp'], rec['prd'], why + ' → 영양값 없이 넣음(아질산염 가공육)'))
            else:
                skipped['mismatch'] += 1
                excluded.append((rec['disp'], rec['prd'], why))
                continue
        else:
            nb, nk = res
            if nb != rec['b'] or nk != rec['kcal']:
                kcal_fix.append((rec['disp'], rec['prd'], [rec['b'], rec['kcal']], [nb, nk]))
                if nb != rec['b']:
                    rec['bu'] = rec['tu'] or rec['bu']
                rec['b'], rec['kcal'] = nb, nk
            rec['nut_ok'] = True
        groups.setdefault(key, []).append(rec)
    # 원재료명이 같은 상품 가운데 100g(ml)당 열량·나트륨이 반올림 오차 안(열량 5%·나트륨 10%)인 것만 한 제품으로 묶는다
    def near(a, b):
        if a.get('nut_ok') is False or b.get('nut_ok') is False:
            return a.get('nut_ok') == b.get('nut_ok') and a.get('b') == b.get('b')
        ka, kb = (a['kcal'] or 0) * 100 / a['b'], (b['kcal'] or 0) * 100 / b['b']
        na, nb = (a['na'] or 0) * 100 / a['b'], (b['na'] or 0) * 100 / b['b']
        return abs(ka - kb) <= max(5, 0.05 * max(ka, kb)) and abs(na - nb) <= max(20, 0.10 * max(na, nb))
    clusters = []
    for g in groups.values():
        cl = []
        for r in g:
            for c in cl:
                if near(c[0], r):
                    c.append(r); break
            else:
                cl.append([r])
        if len(cl) > 1:
            cl = conflict_check(cl, excluded, skipped)
        clusters += cl
    P = []
    for g in clusters:
        retail = [r for r in g if not r['bulk']]
        if not retail:      # 업소용 대용량만 있는 상품은 넣지 않는다
            continue
        g = sorted(retail, key=lambda r: (len(clean_name(r['disp'])), r['tot'] or 0, r['prd']))
        rep = g[0]
        names = []
        for r in g:
            for nm in (clean_name(r['disp']), r['disp']):
                if nm and nm not in names:
                    names.append(nm)
        rep = dict(rep)
        rep['names'] = names[:6]
        rep['members'] = [[r['prd'], r['mat'], r['disp'], r['tot'], r['tu']] for r in g[:6]]
        rep['cats'] = sorted({c for r in g for c in r['cats']})
        for k in ('bulk', 'ing_raw', 'al_raw'):
            rep.pop(k, None)
        P.append(rep)
    P.sort(key=lambda r: (r['cats'][0], r['names'][0]))
    with open(OUT, 'w', encoding='utf-8') as fp:
        fp.write('# -*- coding: utf-8 -*-\n# 자동 생성 파일 — tools/cj_import.py (손으로 고치지 않음)\n')
        fp.write('# CJ더마켓(cjthemarket.com) 상품정보 제공고시·영양정보, %s 확인. 상품 %d개(같은 제품의 용량·묶음은 한 음식으로)\n' % (CHECKED, len(P)))
        fp.write('# 필드: prd 상품번호, mat 자재코드, disp 표시 이름, names 이름·별명 후보, cats CJ더마켓 분류, ty 식품의 유형,\n')
        fp.write('#       ing 원재료명(원산지 괄호 생략), al 알레르기 유발물질(함유 부분), maker 생산자, nut_text 고시의 영양성분 글,\n')
        fp.write('#       tot·tu 총 내용량, b·bu 영양값 기준량, kcal·na·c·s·f·tf·sf·ch·p·fi 기준량당 값, members 묶은 상품[상품번호, 자재코드, 이름, 총량, 단위]\n')
        fp.write('CHECKED = %r\n' % CHECKED)
        fp.write('SKIPPED = %r\n' % skipped)
        fp.write('# 영양값을 맞출 수 없어 넣지 않은 상품(아질산염 가공육은 영양값 없이 넣음)\nEXCLUDED = %r\n' % excluded)
        fp.write('# 같은 고시의 영양성분 글로 기준량·열량을 바로잡은 상품[이름, 상품번호, [칸의 기준량, 열량], [쓴 기준량, 열량]]\nKCAL_FIX = %r\n' % kcal_fix)
        fp.write('P = [\n')
        for r in P:
            fp.write(' ' + repr(r) + ',\n')
        fp.write(']\n')
    print('products', len(P), 'skipped', skipped)
    print('excluded', excluded)
    print('kcal_fix', kcal_fix)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/cj/cj_raw.json')
