# -*- coding: utf-8 -*-
"""CJ더마켓 시판 식품(v1.9.0, 2026-10-14 확인) → 앱 음식 목록

자료는 제품마다 한 곳에서만 확인했다(사용자 요청: 두 곳 대조 없이 출처를 밝혀 넣기).
  CJ제일제당 제품: CJ더마켓 상품정보 제공고시·영양정보(cj10.py, 근거 82)
  다른 회사 가공육: 동원몰 상품정보 제공고시(근거 83), 식품안전나라 품목제조보고 '성분 및 원료'(근거 84) — brand10.py
  다른 회사 만두·육포·냉동 볶음밥·주먹밥·국·탕·찌개: 동원몰(근거 85)·랭킹닭컴(근거 86)·아임닭(근거 87)·풀무원샵(근거 88)
    상품 상세의 포장 표시 사진(일부는 상품정보 제공고시 글) — label10.py(2026-10-15)
    판매처에 영양정보가 없던 제품은 같은 품목보고번호(없으면 같은 제조사·이름·중량)의 식약처 가공식품 DB(근거 27) 값.
    끝내 없으면 육포는 영양값 없이 원재료로 판정하고, 만두·볶음밥·국은 넣지 않는다(LABEL_NONUT)
제품마다 확인한 상품 번호(품목보고번호)와 주소를 PSRC10으로 앱에 넣어 근거로 보여 준다.

판정에 쓰는 태그는 원재료명·식품의 유형·영양값으로 정한다(규칙은 아래 함수, 점검은 tests/python/test_data.py).
  아질산염 가공육: 원재료명에 아질산나트륨(또는 아질산칼륨·질산나트륨·질산칼륨, 발색제)이 있으면
    nitrite + processed 태그와 시작 단계 9 → 앱 판정 '절대 금지'(피하기보다 강한 단계)로 고정(사용자 요청, 근거 37·3·50·7)
  햄·소시지·베이컨·건조저장육류(육포)·분쇄가공육제품(육포 바)은 발색제가 없어도 가공육(processed, 피하기)
    셀러리 분말처럼 원재료명에 아질산염이 적히지 않은 원료는 원재료명 기준이라 '절대 금지'로 보지 않는다
  알레르기: 고시의 '함유' 표시(없으면 원재료명에서 찾음). 이름에 걸리는 알레르기 낱말(앱 KW)과도 맞춘다
  upf2(주의): 향미증진제·향료·유화제·카라기난·변성전분·인산염 같은 첨가물이 원재료명에 있는 제품(AGA 초가공식품 줄이기)
  fried(피하기): 식품의 유형에 유탕·유처리, 또는 튀김류 이름 / soda(피하기): 탄산음료 / choco(피하기): 초콜릿류
  fatty: 앱 규칙(100g당 지방 10g 이상이거나 1회 20g 이상) / salty: 100g당 나트륨 600mg 이상이거나 1회 800mg 이상
  sugar: 1회 당류 15g 이상, 또는 100g당 22.5g(음료 100ml당 5g) 이상
"""
import os, re, json
from cj10 import P, CHECKED
try:
    from brand10 import P as BRAND      # 다른 회사 가공육(tools/brand_import.py)
except ImportError:
    BRAND = []
try:
    from label10 import P as LABELS     # 시판 만두·육포, 포장 표시 사진(tools/label_import.py)
except ImportError:
    LABELS = []
BRAND_REF = {'dw': 83, 'fs': 84}      # 근거 번호: 동원몰 상품정보 제공고시, 식품안전나라 품목제조보고
LABEL_REF = {'dl': 85, 'rk': 86, 'im': 87, 'pm': 88}   # 근거 번호: 동원몰·랭킹닭컴·아임닭·풀무원샵 상품 상세의 포장 표시 사진
MFDS_REF = 27                         # 식약처 가공식품 DB(판매처에 영양정보가 없던 몇 제품의 영양값)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC_REF = 82   # 근거 번호: CJ더마켓 상품정보 제공고시


# ---- 앱의 알레르기 낱말표(KW)를 그대로 읽어 이름·별명 검사에 쓴다(tests/checks/data_audit.cjs와 같은 기준) ----
def _app_kw():
    s = open(os.path.join(ROOT, 'src', 'app', 'app.src.html'), encoding='utf-8').read()

    def lit(name):
        i = s.index('const %s=' % name) + len('const %s=' % name)
        return s[i:s.index(';\n', i)]
    kw = json.loads(re.sub(r'([{,])(\w+):', r'\1"\2":', lit('KW')))
    ex = {}
    for k, v in re.findall(r'(\w+):/(.*?)/g', lit('KW_EXCL')):
        ex[k] = v
    return kw, ex


KW, KW_EXCL = _app_kw()
ALLERGEN_KEYS = ['egg', 'dairy', 'buckwheat', 'peanut', 'soy', 'wheat', 'mackerel', 'crab', 'shrimp', 'pork', 'peach', 'tomato',
                 'sulfite', 'walnut', 'chicken', 'beef', 'squid', 'clam', 'pine', 'fish', 'sesame', 'nut']


def name_tags(texts):
    x = re.sub(r'\s', '', ' '.join(texts))
    out = []
    for k, ws in KW.items():
        y = re.sub(KW_EXCL[k], '', x) if k in KW_EXCL else x
        if any(w in y for w in ws):
            out.append(k)
    return out


# ---- 알레르기: 고시의 '함유' 표시 → 앱 태그 ----
AL_TOKEN = [('egg', r'알류|난류|계란|달걀|가금류의\s*알'), ('dairy', r'우유|우류|유제품'), ('buckwheat', r'메밀'), ('peanut', r'땅콩'),
            ('soy', r'대두|콩'), ('wheat', r'^밀$|^밀\b|밀가루|소맥'), ('mackerel', r'고등어'), ('crab', r'^게$|^게\b|꽃게|대게|게살'),
            ('shrimp', r'새우'), ('pork', r'돼지'), ('peach', r'복숭아'), ('tomato', r'토마토'), ('sulfite', r'아황산'), ('walnut', r'호두'),
            ('chicken', r'닭'), ('beef', r'쇠고기|소고기'), ('squid', r'오징어'), ('clam', r'조개|굴|전복|홍합|바지락|모시조개|가리비|키조개'),
            ('pine', r'^잣$|^잣\b')]


def allergens_from_label(al):
    toks = [t.strip() for t in re.split(r'[,·/()\[\]{}\s]+', re.sub(r'함유|포함|등', ' ', al)) if t.strip()]
    out = []
    for k, pat in AL_TOKEN:
        if any(re.search(pat, t) for t in toks):
            out.append(k)
    return out


# 원재료명에서 찾기(고시에 알레르기 표시가 비어 있을 때만). 대두유·옥배유 같은 정제유는 넣지 않는다
AL_ING = [('egg', r'계란|달걀|전란|난백|난황|알가공품|마요네즈'), ('dairy', r'우유|유청|유당|버터|치즈|크림|분유|연유|카제인|유크림|발효유|탈지분유'),
          ('buckwheat', r'메밀'), ('peanut', r'땅콩'), ('soy', r'대두(?!유)|두부|간장|된장|고추장|두유|분리대두단백|콩(?!기름)'),
          ('wheat', r'밀가루|소맥|밀(?!감)|빵가루|글루텐|맥아(?!당)|간장|부침가루|튀김가루'), ('mackerel', r'고등어'),
          ('crab', r'게살|꽃게|대게|홍게'), ('shrimp', r'새우'), ('pork', r'돼지|돈육|돈지|라드|돈피'), ('peach', r'복숭아'),
          ('tomato', r'토마토|케첩|케찹'), ('walnut', r'호두'), ('chicken', r'닭|계육|치킨'), ('beef', r'쇠고기|소고기|우육|사골|우지|양지|사태'),
          ('squid', r'오징어'), ('clam', r'조개|굴(?!비)|전복|홍합|바지락|모시조개|가리비'), ('pine', r'잣(?!대)'),
          ('fish', r'멸치|가다랑어|가쓰오|참치|연어|명태|대구|어육|어묵|액젓|까나리|고등어|꽁치|삼치|가자미|임연수|갈치|조기|굴비|명란|황태|북어|코다리'),
          ('sesame', r'참깨|참기름|통깨|깨소금|볶음참깨'), ('nut', r'아몬드|캐슈|피스타치오|마카다미아|헤이즐넛|견과')]


def allergens_from_ing(ing):
    return [k for k, pat in AL_ING if re.search(pat, ing)]


# ---- 첨가물·성분 ----
NITRITE = re.compile(r'아질산나트륨|아질산칼륨|질산나트륨|질산칼륨')
SPAM_ING = re.compile(r'스팸\s*[Ⓡ®]?\s*(클래식|(25\s*%?\s*)?라이트)')
# 재료로 든 햄·소시지·베이컨(리챔·런천미트 포함). '햄맛분말'·'햄맛엑기스'처럼 맛을 내는 원료는 가공육이 아니다(2026-10-15, 볶음밥·찌개 추가 때)
PROC_ING = re.compile(r'(?<![함김])햄(?!버|맛|향)|리챔|런천|(?:소시지|후랑크|비엔나|베이컨|스팸|살라미|페퍼로니|잠봉|프로슈토)(?!맛|향)')
UPF2 = [('향미증진제', r'향미증진제|L-글루탐산나트륨|글루타민산나트륨|5\'-리보뉴클레오티드|이노신산|구아닐산'),
        ('향료', r'향료'), ('유화제', r'유화제|글리세린지방산에스테르|자당지방산에스테르|폴리소르베이트|레시틴(?!.*대두레시틴)'),
        ('카라기난', r'카라기난'), ('변성전분', r'변성전분|가공전분|아세틸아디픽|인산이전분|하이드록시프로필'),
        ('인산염', r'폴리인산나트륨|피로인산나트륨|메타인산나트륨|제이인산|제삼인산'), ('색소', r'색소|착색료|캐러멜|카라멜'),
        ('보존료', r'소브산|안식향산|프로피온산'), ('감미료', r'수크랄로스|아세설팜칼륨|아스파탐|사카린|네오탐|스테비|효소처리스테비아'),
        ('증점제', r'잔탄검|구아검|카복시메틸셀룰로스|셀룰로스검|젤란검|증점'), ('분리대두단백', r'분리대두단백|농축대두단백|분리유청단백'),
        ('조미 원료', r'복합조미식품|조미베이스|조미액|시즈닝|맛베이스|효모추출물|효모엑기스|가수분해')]
FRIED_NAME = re.compile(r'튀김|후라이드|프라이드|까스|가스(?!오)|텐더|너겟|가라아게|강정|핫도그|츄러스|고로케|크로켓|치킨(?!.*(구이|훈제|오븐|스테이크|가슴살))')
FRIED_NAME_DISH = re.compile(r'튀김|후라이드|프라이드|까스|가스(?!오)|텐더|너겟|가라아게|강정|핫도그|츄러스|고로케|크로켓')
SWEETENER = re.compile(r'수크랄로스|아세설팜칼륨|아스파탐|사카린|네오탐')
POLYOL = re.compile(r'말티톨|솔비톨|소르비톨|자일리톨|에리스리톨|락티톨|이소말트|만니톨')
SPICY_ING = re.compile(r'고춧가루|고추장|청양고추|고추분|고추양념|고추씨|캡사이신|할라피뇨|베트남고추|하바네로|고추기름|고추맛기름|마라|고추\s*\d|^고추|,\s*고추\s*[,(]')
SPICY_NAME = re.compile(r'매운|매콤|불닭|김치|짬뽕|떡볶이|마라|청양|고추|육개장|얼큰|부대|짜글이|낙지|쭈꾸미|주꾸미|닭갈비|제육|비빔|양념치킨|핫(?!도그|바|케이크|초코)')
NOT_SPICY = re.compile(r'백김치|물김치|나박|동치미|안매운|순한|아이|키즈')
ALLIUM = re.compile(r'양파|마늘|대파|쪽파|(?<![가-힣])파(?![인슬프])|부추|샬롯|리크|파엑기스|양파엑기스|마늘엑기스')
FOD_HIGH_ING = [('양파·마늘', r'양파|마늘'), ('밀', r'밀가루|소맥분'), ('우유(유당)', r'우유|유당|분유|연유|유크림'), ('콩', r'대두(?!유)|콩(?!기름)|팥|병아리콩'),
                ('과당·꿀', r'과당|꿀|액상과당|올리고당'), ('버섯', r'버섯'), ('사과·배', r'사과|배농축|배과즙'),
                ('당알코올', r'말티톨|솔비톨|소르비톨|자일리톨|에리스리톨|이소말트')]
CAFFEINE = re.compile(r'커피|카페인|녹차|홍차|말차|보이차|과라나|에너지')


def ty_norm(p):
    return re.sub(r'\s|식품의유형:?', '', p['ty'])


def cat_of(p):
    c = p['cats'][0]
    n = p['names'][0]
    ty = ty_norm(p)
    if c.startswith('0036'):
        if c in ('003603', '003605'):
            return '요리'
        return '곡류'
    if c.startswith('0057'):
        return '채소'
    if c.startswith('0038'):
        return '요리'
    if c in ('004002', '004003', '004005', '004016', '004201', '004202', '004203', '004204', '004206', '004505', '004801', '004802', '004803'):
        return '단백질'
    if c == '004004':
        return '채소'
    if c == '004011':
        return '채소'
    if c.startswith('0040') or c.startswith('0041'):
        return '기타' if c == '004102' else '요리'
    if c.startswith('0043'):
        return '곡류' if c == '004304' else '요리'
    if c.startswith('0049'):
        return '과일' if re.search(r'과일|사과|배|딸기|블루베리|망고|파인|복숭아|귤|오렌지|포도|바나나|키위|체리|베리|황도|백도', n) else '채소'
    if c in ('004504', '004508'):
        return '곡류'
    if c == '004507':
        return '유제품'
    if c in ('004702', '004704'):
        return '유제품'
    if c == '004706':
        return '영양식' if re.search(r'단백|프로틴|쉐이크|셰이크', n + ty) else '기타'
    return '기타'


def kind_of(p):
    """음식 성격(분량·아이콘·설명에 씀)"""
    c, n, ty = p['cats'][0], p['names'][0], ty_norm(p)
    meat_cat = c in ('004201', '004203', '004204', '004505') or c.startswith('0042')
    meat_ty = re.search(r'^(햄|프레스햄|혼합프레스햄|소시지|혼합소시지|발효소시지|베이컨|건조저장육|어육소시지)', ty)
    if (meat_cat or meat_ty) and (NITRITE.search(p['ing']) or meat_ty or re.search(r'스팸|햄(?!버)|소시지|후랑크|비엔나|베이컨|잠봉|살라미|페퍼로니|핫바|맥스봉|꼬치바|습바', n)):
        if re.search(r'베이컨', n + ty):
            return 'bacon'
        if re.search(r'후랑크|비엔나|소시지|핫바|맥스봉|꼬치바|습바|후랑크', n + ty):
            return 'sausage'
        return 'ham'
    if c == '004202':
        return 'chicken'
    if c == '004206':
        return 'can'
    if c in ('003601', '003609', '003602'):
        return 'rice'
    if c == '003603':
        return 'cupban'
    if c == '003605':
        return 'friedrice'
    if c == '003604':
        return 'nurungji' if re.search(r'누룽지', n) else 'soup' if re.search(r'수프|스프', n) else 'porridge'
    if c == '004012':
        return 'stew'
    if c.startswith('0057'):
        return 'kimchi'
    if c.startswith('0038'):
        return 'mandu'
    if c == '004002':
        return 'fish'
    if c == '004003':
        return 'fishcake'
    if c == '004004':
        return 'laver'
    if c == '004005':
        return 'tofu'
    if c == '004016':
        return 'natto'
    if c == '004011':
        return 'pickle'
    if c in ('004006', '004013'):
        return 'side'
    if c in ('004007', '004014'):
        return 'meatdish'
    if c == '004101':
        return 'chickendish'
    if c == '004111':
        return 'pizza'
    if c == '004102':
        return 'streetsnack'
    if c == '004110':
        return 'tteokbokki'
    if c.startswith('0043'):
        return 'noodle'
    if c == '004501':
        return 'snack'
    if c == '004502':
        return 'jelly' if not re.search(r'초콜릿|초코', n + ty) else 'choco'
    if c == '004504':
        return 'tteok' if re.search(r'떡', n + ty) else 'bread'
    if c == '004505':
        return 'sausage'
    if c == '004506':
        return 'jam'
    if c == '004507':
        return 'icecream'
    if c == '004508':
        return 'bar'
    if c in ('004701', '004705'):
        return 'tea' if re.search(r'차$|티백|침출차|액상차', n + ty) else 'drink'
    if c == '004703':
        return 'coffee'
    if c == '004706':
        return 'protein'
    if c == '004702':
        return 'milk'
    if c == '004704':
        return 'cheese' if re.search(r'치즈', n + ty) else 'yogurt'
    if c == '004801':
        return 'egg'
    if c == '004802':
        return 'meat'
    if c == '004803':
        return 'seafood'
    if c.startswith('0049'):
        return 'produce'
    return 'other'


def is_liquid(p):
    return p.get('bu') == 'ml' or p.get('tu') == 'ml'


# 1회 분량[g 또는 ml, 단위]. 한 번에 먹는 작은 포장은 총 내용량, 여러 번 먹는 포장은 흔한 1회량
SERV_FIX = {'ham': (50, '인분'), 'bacon': (30, '줄'), 'kimchi': (40, '접시'), 'laver': (5, '봉'), 'pickle': (30, '접시'), 'natto': (45, '팩'),
            'snack': (30, '회'), 'jelly': (30, '회'), 'choco': (30, '회'), 'jam': (20, '큰술'), 'side': (50, '접시'), 'cheese': (20, '장'),
            'seafood': (40, '접시'), 'tofu': (100, '인분'), 'mandu': (150, '인분'), 'chickendish': (150, '인분'), 'pizza': (150, '조각'),
            'meatdish': (100, '인분'), 'fishcake': (50, '인분'), 'meat': (100, '인분'), 'produce': (100, '인분'), 'tea': (200, '잔')}
UNIT = {'rice': '개', 'porridge': '봉', 'soup': '봉', 'stew': '봉', 'cupban': '개', 'friedrice': '봉', 'nurungji': '봉', 'sausage': '개',
        'chicken': '팩', 'can': '캔', 'fish': '팩', 'noodle': '인분', 'bread': '개', 'tteok': '인분', 'icecream': '개', 'bar': '개',
        'drink': '병', 'coffee': '병', 'protein': '팩', 'milk': '팩', 'yogurt': '개', 'egg': '개', 'tteokbokki': '인분', 'streetsnack': '개'}


def serving(p, kind):
    tot = p['tot'] or 0
    liq = is_liquid(p)
    n = p['names'][0]
    ty = ty_norm(p)
    m = re.search(r'(\d)\s*인(?:분)?(?![가-힣])', n)
    if m and tot and int(m.group(1)) > 1:            # '2인' 포장은 1인분으로 나눈다
        return [int(round(tot / int(m.group(1)))), '인분']
    if kind == 'noodle' and re.search(r'건면|^국수|당면', ty + ' ' + n) or re.search(r'소면|당면|칼국수면|파스타면|메밀국수', n) and kind in ('noodle', 'other'):
        return [40, '인분'] if '당면' in n else [100, '인분']      # 마른 면(삶기 전 무게)
    if kind in ('drink', 'tea') and re.search(r'청$', n.strip()):
        return [20, '큰술']                                 # 물에 타 먹는 과일청
    if kind == 'protein' and not liq and (per100(p, 'kcal') or 0) >= 300:
        return [int(round(p['b'])) if p['b'] < tot else 40, '회']   # 타 먹는 분말
    # 고시 영양값이 '1개(45g)당'처럼 한 개 기준이면 그 양이 1회 분량
    if p['b'] and p['b'] != 100 and 10 <= p['b'] < (tot or 0) and kind not in ('kimchi', 'laver', 'pickle', 'jam', 'snack', 'jelly', 'choco', 'cheese'):
        u = UNIT.get(kind, SERV_FIX.get(kind, (0, '개'))[1])
        return [int(round(p['b'])), u if u not in ('인분', '접시', '줄') else '개']
    if kind in SERV_FIX:
        g, u = SERV_FIX[kind]
        if kind in ('tofu', 'mandu', 'chickendish', 'pizza', 'meatdish', 'fishcake', 'meat', 'seafood', 'side') and 0 < tot <= g * 1.3:
            g = tot
        return [int(round(g)), u]
    u = UNIT.get(kind, '컵' if liq else '인분')
    if kind == 'egg':
        return [50, '개']
    if kind == 'sausage':
        b = p['b']
        if tot and tot <= 160:
            return [int(round(tot)), '개']
        return [50, '인분']
    if kind in ('drink', 'coffee', 'protein', 'milk'):
        if tot and tot <= 500:
            return [int(round(tot)), u if kind != 'milk' else ('팩' if tot <= 300 else '병')]
        return [200, '컵']
    if kind == 'yogurt':
        if tot and tot <= 250:
            return [int(round(tot)), '개']
        return [100, '컵' if liq else '인분']
    limit = {'rice': 330, 'porridge': 500, 'soup': 500, 'stew': 600, 'cupban': 400, 'friedrice': 300, 'chicken': 200, 'can': 200, 'fish': 200,
             'noodle': 400, 'bread': 150, 'tteok': 200, 'icecream': 200, 'bar': 80, 'nurungji': 80, 'tteokbokki': 400, 'streetsnack': 120}.get(kind, 300)
    if tot and tot <= limit:
        return [int(round(tot)), u]
    dflt = {'stew': 300, 'porridge': 300, 'soup': 250, 'noodle': 200, 'bread': 80, 'tteok': 100, 'icecream': 100, 'bar': 40, 'nurungji': 40,
            'tteokbokki': 250, 'friedrice': 250, 'cupban': 300, 'rice': 210, 'chicken': 100, 'can': 100, 'fish': 100, 'streetsnack': 80}.get(kind, 100)
    return [dflt, u]


def per100(p, k):
    v = p.get(k)
    return None if v is None or not p.get('b') else v * 100.0 / p['b']


ICON = {'ham': '🥫', 'bacon': '🥓', 'sausage': '🌭', 'chicken': '🍗', 'can': '🥫', 'rice': '🍚', 'cupban': '🍛', 'friedrice': '🍛', 'porridge': '🥣',
        'nurungji': '🍘', 'soup': '🥣', 'stew': '🍲', 'kimchi': '🥬', 'mandu': '🥟', 'fish': '🐟', 'fishcake': '🍢', 'laver': '🍙', 'tofu': '🥢',
        'natto': '🫘', 'pickle': '🥒', 'side': '🍱', 'meatdish': '🍖', 'chickendish': '🍗', 'pizza': '🍕', 'streetsnack': '🍡', 'tteokbokki': '🍢',
        'noodle': '🍜', 'snack': '🍘', 'jelly': '🍬', 'choco': '🍫', 'tteok': '🍡', 'bread': '🍞', 'jam': '🍯', 'icecream': '🍦', 'bar': '🥜',
        'drink': '🧃', 'tea': '🍵', 'coffee': '☕', 'protein': '🥤', 'milk': '🥛', 'yogurt': '🥛', 'cheese': '🧀', 'egg': '🥚', 'meat': '🥩',
        'seafood': '🦐', 'produce': '🥕', 'jerky': '🥩', 'other': '🍽️'}


def tags_of(p, kind, cat, serv):
    ing, n, ty = p['ing'], ' '.join(p['names']), ty_norm(p)
    t = []
    al = allergens_from_label(p['al']) if p['al'] and not re.fullmatch(r'\s*(없음|해당\s*(사항)?\s*없음)\s*', p['al']) else []
    if not p['al']:
        al = allergens_from_ing(ing)
    t += al
    # 이름·별명에 걸리는 알레르기 낱말(앱이 이름으로도 검사하므로 맞춘다. 예: 이름에 '햄'이 있으면 돼지고기)
    nt = name_tags(p['names'])
    for k in nt:
        if k in ALLERGEN_KEYS and k not in t:
            t.append(k)
    # 아질산염 가공육·가공육
    nitrite = bool(NITRITE.search(ing))
    # 원재료에 스팸 클래식·라이트가 든 음식: 그 스팸의 고시(같은 CJ더마켓)에 아질산나트륨이 있다.
    # 복합원재료는 주요 원재료만 적어도 되어 이 음식의 원재료명에는 빠져 있다(스팸맛 시즈닝은 해당 없음)
    spam = bool(SPAM_ING.search(ing)) and not nitrite
    if nitrite or spam:
        t += ['nitrite', 'processed']
    elif kind in ('ham', 'bacon', 'sausage') and re.search(r'햄|소시지|베이컨|건조저장육', ty + n):
        t += ['processed']
    elif kind not in ('ham', 'bacon', 'sausage') and PROC_ING.search(ing):
        t += ['processed']   # 햄·소시지·베이컨이 재료로 든 음식(앱의 부대찌개·핫도그와 같은 기준)
    if kind in ('ham', 'bacon', 'sausage') or re.search(r'^(햄|프레스햄|혼합프레스햄|소시지|혼합소시지|베이컨류|분쇄가공육)', ty):
        if re.search(r'돼지|쇠고기|소고기|돈육|우육', ing.split(',')[0] + ing[:60]):
            t.append('redmeat')
    # 튀김·탄산·초콜릿·라면
    # 볶음밥·주먹밥·국처럼 닭고기가 재료인 음식의 '치킨'(치킨카레볶음밥, 양념치킨 주먹밥)은 튀긴 음식이 아니다(2026-10-15)
    fried_name = FRIED_NAME_DISH if kind in ('friedrice', 'stew') else FRIED_NAME
    if re.search(r'유탕|유처리', ty) or fried_name.search(n):
        if kind not in ('drink', 'coffee', 'milk', 'yogurt', 'protein', 'fishcake'):
            t.append('fried')
    if kind == 'fishcake':
        t.append('gil')      # 어묵은 앱의 어묵과 같은 기준(길병원 저잔사식 제한·초가공식품 줄이기, 주의)
    if kind == 'pizza':
        t.append('upf')      # 앱의 피자와 같은 기준(패스트푸드·초가공식품: 피하기)
    if re.search(r'탄산', ty) or (re.search(r'사이다|콜라|탄산|스파클링', n) and not re.search(r'비니거|식초|무탄산', n)):
        t.append('soda')
    if kind == 'choco' or re.search(r'초콜릿|초코', ty) or re.search(r'초콜릿(?!향)|초코(?!향)', n) and cat == '기타':
        t.append('choco')
    if re.search(r'유탕면', ty) and kind == 'noodle':
        t += ['upf', 'instant']
    # 첨가물
    hits = [lab for lab, pat in UPF2 if re.search(pat, ing)]
    if hits and not any(x in t for x in ('upf',)):
        t.append('upf2')
    if SWEETENER.search(ing):
        t.append('sweetener')
    if POLYOL.search(ing):
        t.append('polyol')
    # 맛·성분
    sp = [m.start() for m in SPICY_ING.finditer(ing)]
    # 만두 원재료 끝자리(글의 뒤 1/4)에만 있는 고춧가루·고추기름은 아주 적은 양이라 맵다고 보지 않는다
    # (원재료명은 많이 넣은 순서, 2026-10-15 점검: 하림 육즙 왕교자·동원 딤섬 광동새우완탕이 '맵고 자극적'으로 나오던 것)
    minor = kind == 'mandu' and sp and min(sp) >= 0.75 * len(ing)
    if (SPICY_NAME.search(n) or (sp and not minor)) and not NOT_SPICY.search(n):
        t.append('spicy')
    if ALLIUM.search(ing):
        t.append('allium')
    if CAFFEINE.search(n + ing) and kind in ('coffee', 'drink', 'tea', 'protein', 'milk'):
        if not re.search(r'디카페인|보리|옥수수|현미|우엉|둥굴레|루이보스|캐모마일|페퍼민트|헛개|결명자|메밀', n):
            t.append('caffeine')
    if kind == 'pickle' or re.search(r'절임', ty):
        t.append('pickled')
    if kind == 'laver' or re.search(r'견과|땅콩또는견과류|건조저장육|육포|조미건어포|오징어채|쥐포', ty + n):
        t.append('tough')
    if kind in ('snack', 'jelly', 'choco') or re.search(r'^과자|스낵|캔디', ty):
        t.append('snack')
    if re.search(r'저단백밥|저단백\s*밥|신장질환', n):
        t.append('renal')    # 신장질환자용 저단백 제품(앱 판정: 의료진 지시가 없으면 피하기)
    fi100 = per100(p, 'fi')
    drink = is_liquid(p) and kind in ('drink', 'tea', 'coffee', 'milk', 'protein', 'yogurt')    # 보리차·두유처럼 우려내거나 간 음료는 이름으로 정하지 않는다
    if (not drink and re.search(r'현미|잡곡|귀리|보리(?!차|추출)|흑미|오곡|퀴노아|곤약|렌틸|병아리콩|통밀|통곡|식이섬유|파로|서리태|흑태|약콩', n)) or (fi100 or 0) >= 3:
        t.append('hifiber')     # 이름의 잡곡·곤약 등, 또는 고시의 식이섬유가 100g(ml)당 3g 이상(식약처 '식이섬유 함유' 기준, 근거 29)
    if re.search(r'명란|젓갈|젓(?!가락)|날치알|회$|육회|게장', n + ty) and not re.search(r'구이|볶음|찜|조림|탕|찌개|국', n):
        t.append('raw')
    if kind in ('drink', 'coffee', 'protein', 'milk', 'yogurt', 'porridge', 'soup', 'stew', 'tea') and (is_liquid(p) or kind in ('porridge', 'soup', 'stew')):
        t.append('liq')
    if kind in ('drink', 'coffee') and re.search(r'과채|주스|쥬스|착즙', ty + n):
        t.append('juice')
    if re.search(r'식초|미초|발효초', n + ty) and kind in ('drink', 'tea'):
        t.append('sour')
    # 유당: 우유가 주원료인 제품(이름 규칙도 data_audit.cjs와 맞춤)
    if 'dairy' in t:
        lac_name = re.search(r'우유|요거트|요구르트|아이스크림|라떼|커스터드|밀크|연유|분유|크림', n)
        lac_free = re.search(r'유당분해|락토프리|무유당|유당제거|소화가\s*잘되는', n)   # 이름에 밝힌 제품만 유당 없음으로 봄
        if (lac_name or kind in ('milk', 'yogurt', 'icecream') or re.match(r'\s*(원유|우유|유크림|백설탕\s*,\s*우유)', ing)) and not lac_free:
            t.append('lactose')
    # 영양값으로 정하는 태그
    g = serv[0]
    f100, na100, s100 = per100(p, 'f'), per100(p, 'na'), per100(p, 's')
    if f100 is not None and (f100 >= 10 or f100 * g / 100 >= 20) and cat != '지방' and 'tough' not in t:
        t.append('fatty')
    if na100 is not None and (na100 >= 600 or na100 * g / 100 >= 800):
        t.append('salty')
    if s100 is not None and (s100 * g / 100 >= 15 or (s100 >= 5 if is_liquid(p) else s100 >= 22.5)):
        t.append('sugar')
    out = []
    for x in t:
        if x not in out:
            out.append(x)
    return out, hits


AVOID = ('nitrite', 'processed', 'fried', 'soda', 'choco', 'upf', 'alcohol', 'renal')


def stage_of(kind, tags):
    if any(x in tags for x in AVOID):
        return 9
    if any(x in tags for x in ('spicy', 'hifiber', 'raw', 'tough', 'pickled', 'caffeine', 'snack', 'sour', 'juice', 'polyol')):
        return 3
    if 'fatty' in tags or 'sugar' in tags and kind not in ('milk', 'yogurt', 'icecream', 'drink'):
        return 3
    if kind in ('rice', 'porridge', 'soup', 'tofu', 'egg', 'milk', 'yogurt', 'chicken', 'fish', 'drink', 'protein', 'icecream', 'bread', 'nurungji') \
            and 'redmeat' not in tags:
        return 1
    return 2


def stage_fix(p, kind, tags, ms):
    if kind == 'fishcake' and ms != 9:
        return 3
    if kind == 'stew' and ms == 2 and re.search(r'곰탕|설렁탕|사골|삼계탕|미역국|북엇국|황태|계란국|맑은', p['names'][0]):
        return 1      # 맵지 않은 맑은 국물(앱의 비비고 사골곰탕·설렁탕과 같은 기준)
    return ms


def fodmap(p, kind, tags):
    ing = p['ing']
    if 'lactose' not in tags and re.search(r'유당분해|락토프리|무유당|유당\s*0', ' '.join(p['names']) + ing) and kind in ('milk', 'yogurt'):
        return ('low', '유당을 걸러 낸 우유', [20])
    found = [lab for lab, pat in FOD_HIGH_ING if re.search(pat, ing)]
    first = re.split(r'[,(]', ing)[0]
    if kind in ('rice', 'nurungji') and not found:
        return ('low', '쌀 제품(쌀 제품은 저FODMAP)', [20])
    if re.search(r'밀가루|소맥분|^밀\b', first) or kind in ('mandu', 'noodle', 'bread', 'pizza') and re.search(r'밀가루|소맥분', ing):
        return ('high', '밀가루가 주원료' + ('' if '양파·마늘' not in found else '·양파·마늘'), [24, 20])
    if kind in ('milk', 'yogurt', 'icecream') and 'lactose' in tags:
        return ('high', '우유(유당)', [20])
    if kind == 'tofu':
        if re.search(r'연두부|순두부', ' '.join(p['names'])):
            return ('high', '물기가 많은 연두부·순두부(올리고당)', [21])
        return ('unk', '물기를 뺀 단단한 두부는 낮고 연두부는 높음. 이 두부는 수치 미확인', [21])
    if kind == 'natto' or re.search(r'^대두|^콩', first):
        return ('high', '콩류', [20])
    if found:
        return ('unk', '·'.join(found) + '이(가) 들어 있어 높을 수 있음(이 제품은 시험되지 않음)', [20, 51])
    return ('unk', '이 제품의 FODMAP 수치는 확인되지 않음', [20])


def won(v, u):
    return ('%g' % round(v, 1)) + u


def tidy(n):
    s = re.sub(r'\((?:[^)]*\d[^)]*|컵|[^)]*포|냉동|냉장|상온|용기|총\s*)\)', ' ', n)      # (12)·(컵)·(12ml 포)·(총 ) 같은 괄호
    s = re.sub(r'^\s*(CJ\s*제일제당|씨제이|CJ)\s*', 'CJ ', s)
    s = re.sub(r'\s+', ' ', s).strip(' -,')
    return s


def fit(s, n=20):
    """20자 안으로: 넘으면 낱말 단위로 자르고, 괄호가 열린 채 끝나지 않게"""
    if len(s) <= n:
        return s
    words, out = s.split(' '), ''
    for w in words:
        if len((out + ' ' + w).strip()) > n:
            break
        out = (out + ' ' + w).strip()
    out = out or s[:n]
    if out.count('(') > out.count(')'):
        out = out[:out.rfind('(')].strip()
    return out


def short_name(p, used):
    base = tidy(p['names'][0])
    base = re.sub(r'\s*\(([^()]*)\)\s*', r' \1 ', base).strip()     # 괄호는 풀어 쓴다(앱은 '(' 앞까지도 이름으로 찾는다)
    base = re.sub(r'\s+', ' ', base)
    nm = fit(base)
    key = lambda x: re.sub(r'\s', '', x)
    if key(nm) in {key(u) for u in used}:
        tot = p['tot']
        sz = ('%g%s' % (tot, p['tu'])) if tot else p['mat']
        nm = fit(re.sub(r'\s*\d+(\.\d+)?\s*(g|ml|kg)$', '', base), 19 - len(sz)) + ' ' + sz
    k = 2
    while key(nm) in {key(u) for u in used}:
        nm = nm[:18] + ' ' + str(k); k += 1
    used.add(nm)
    return nm


def label_names(names):
    """포장 표시 제품 이름: 20자를 넘는 첫 이름을 낱말에서 자르면 맛 이름(김치·오리지널)이 잘려 나가므로(2026-10-15 점검에서 발견),
    같은 브랜드로 시작하면서 20자 안에 드는 다른 이름이 있으면 그 이름을 앞에 둔다"""
    def flat(n):
        n = re.sub(r'\s*\(([^()]*)\)\s*', r' \1 ', tidy(n)).strip()
        return re.sub(r'\s+', ' ', n)
    f0 = flat(names[0])
    if len(f0) <= 20:
        return names
    dropped = f0.split(' ')[len(fit(f0).split(' ')):]
    if all(re.match(r'^[\d.,]+\s*(g|kg|ml|개입|봉|입)?$|^\d+(g|kg|ml)[x×*]\d+|^(오리지널|오리지날|기본맛|플레인)$', w) for w in dropped):
        return names            # 잘려 나가는 것이 중량이나 기본 맛(오리지널)뿐이면 그대로
    brand = names[0].split()[0]
    for n in names[1:]:
        if len(flat(n)) <= 20 and n.split()[0] == brand:
            return [n] + [x for x in names if x != n]
    return names


def label_text(p):
    """고시 영양정보를 표시 그대로(기준량·값·단위). 열량이 비어 있으면 그렇게 적는다"""
    parts = []
    parts.append(('%skcal' % ('%g' % p['kcal'])) if p['kcal'] is not None else '열량 표시 없음')
    for k, nm, u in [('na', '나트륨', 'mg'), ('c', '탄수화물', 'g'), ('s', '당류', 'g'), ('f', '지방', 'g'), ('tf', '트랜스지방', 'g'),
                     ('sf', '포화지방', 'g'), ('ch', '콜레스테롤', 'mg'), ('p', '단백질', 'g'), ('fi', '식이섬유', 'g')]:
        if p.get(k) is not None:
            parts.append(nm + ' ' + ('%g' % p[k]) + u)
    tot = (' (총 내용량 %g%s)' % (p['tot'], p['tu'])) if p['tot'] and p['tot'] != p['b'] else ''
    return '%g%s당%s: %s' % (p['b'], p['bu'], tot, ' · '.join(parts))


AL_KO = {'egg': '알류', 'dairy': '우유', 'buckwheat': '메밀', 'peanut': '땅콩', 'soy': '대두', 'wheat': '밀', 'mackerel': '고등어', 'crab': '게',
         'shrimp': '새우', 'pork': '돼지고기', 'peach': '복숭아', 'tomato': '토마토', 'sulfite': '아황산류', 'walnut': '호두', 'chicken': '닭고기',
         'beef': '쇠고기', 'squid': '오징어', 'clam': '조개류', 'pine': '잣', 'fish': '생선', 'sesame': '참깨', 'nut': '견과류'}


def describe(p, kind, tags, serv, hits):
    """제품 설명 한두 문장(포장 정보 요약). 판정 근거 문장은 템플릿(T10)이 붙는다"""
    ty = re.sub(r'^식품의\s*유형\s*:?\s*', '', p['ty']).strip()
    g, u = serv
    unit = 'ml' if is_liquid(p) else 'g'
    bits = []
    k100 = per100(p, 'kcal') if p['kcal'] is not None else None
    if k100 is not None:
        bits.append('%dkcal' % round(k100 * g / 100))
    for k, nm, uu in [('na', '나트륨', 'mg'), ('p', '단백질', 'g'), ('f', '지방', 'g'), ('s', '당류', 'g')]:
        v = per100(p, k)
        if v is not None:
            vv = v * g / 100
            bits.append('%s %s' % (nm, ('{:,}'.format(int(round(vv))) if uu == 'mg' else ('%g' % round(vv, 1))) + uu))
    alg = [AL_KO[x] for x in tags if x in AL_KO and x not in ('fish', 'sesame', 'nut')]
    s = '%s입니다.' % (ty if ty and not re.search(r'참조|상세', ty) else 'CJ제일제당 시판 제품')
    if 'nitrite' in tags and NITRITE.search(p['ing']):
        s += ' 원재료명에 아질산나트륨(발색제)이 있습니다.'
    elif 'nitrite' in tags:
        s += ' 원재료의 스팸 클래식에 아질산나트륨(발색제)이 들어 있습니다(CJ더마켓 스팸 클래식 상품정보 고시, 상품 40134669). 이 제품 원재료명에는 복합원재료의 주요 원료만 적혀 있습니다.'
    if alg:
        s += ' %s 함유.' % '·'.join(alg)
    if p.get('nut_ok') is False:
        s += ' 고시의 영양 표기가 서로 맞지 않아 영양값은 넣지 않았습니다.'
    else:
        s += ' 1회 %d%s(%s)에 %s입니다(고시 값으로 계산).' % (g, unit, u, ', '.join(bits))
    return s


LABEL_SRC = {'dl': '동원몰 상품 상세(포장 표시)', 'rk': '랭킹닭컴 상품 상세(포장 표시)',
             'im': '아임닭 상품 상세(포장 표시)', 'pm': '풀무원샵 상품 상세(포장 표시)'}


MEAT_KINDS = ('ham', 'bacon', 'sausage', 'jerky')      # 제품 자체가 가공육인 종류(설명 문장이 '가공육입니다')
LABEL_CAT = {'jerky': '단백질', 'mandu': '요리', 'friedrice': '요리', 'stew': '요리'}
LABEL_CATS = {'jerky': '0042', 'mandu': '0038', 'friedrice': '003605', 'stew': '004012'}   # CJ 분류 번호와 같은 뜻
LABEL_TY = {'jerky': '육포', 'mandu': '만두', 'friedrice': '볶음밥', 'stew': '국·탕·찌개'}
NEED_NUT = ('mandu', 'friedrice', 'stew')    # 영양정보까지 확인한 것만 넣는 종류(사용자 요청). 육포는 가공육이라 원재료로 판정


def label_serving(r, q=None):
    """만두는 한 봉(200g 이하)이면 한 봉, 큰 봉지는 150g / 육포는 45g 이하 한 봉, 큰 봉지는 30g
    볶음밥·국·탕·찌개는 CJ 제품과 같은 규칙(serving: '2인분'은 나누고, 한 봉 기준 표시면 그 양, 큰 포장은 흔한 1회량).
    한 개가 6~8 g인 동결건조 국 블록처럼 표시만으로 정할 수 없으면 기록의 serv(포장 표시의 1회 분량)를 쓴다"""
    tot = r['tot'] or 0
    if r.get('serv'):
        return [int(round(r['serv'][0])), r['serv'][1]]
    if r['kind'] == 'jerky':
        return [int(round(tot)), '봉'] if 0 < tot <= 45 else [30, '회']
    if r['kind'] in ('friedrice', 'stew'):
        g, u = serving(q, r['kind'])
        if g < tot and g != r['b']:
            u = '인분'      # 큰 포장(삼계탕 900 g 등)의 일부를 1회로 볼 때 '봉'이라 쓰지 않는다
        return [g, u]
    return [int(round(tot)), '봉'] if 0 < tot <= 200 else [150, '인분']


def dry_soup(kind, serv):
    """마른 상태로 파는 국: 'block'(블록 한 개가 1회) · 'mix'(물에 끓이는 건조 국, 포장의 1인분) · None(바로 먹는 국)
    바로 데워 먹는 국·탕·찌개는 1회가 300 g 안팎이라 1회 40 g 이하이면 마른 국으로 본다"""
    if kind != 'stew' or serv[0] > 40:
        return None
    return 'block' if serv[1] == '개' else 'mix'


def describe_label(r, q, kind, tags, serv):
    """포장 표시 사진에서 읽은 제품 설명(식품유형·제조사, 발색제, 알레르기, 1회 분량 영양값)"""
    ty = re.sub(r'^식품의\s*유형\s*:?\s*', '', r.get('ty') or '').strip()
    g, u = serv
    ty = ty or LABEL_TY.get(kind, '만두')
    s = ('%s의 %s입니다.' % (r['maker'], ty)) if r.get('maker') else '%s입니다.' % ty   # 괄호가 겹치지 않게(2026-10-15)
    if 'nitrite' in tags:
        s += ' 원재료명에 아질산나트륨(발색제)이 있습니다.'
    elif kind == 'jerky' and re.search(r'셀러리|샐러리', r['ing']):
        s += ' 원재료명에 아질산나트륨 표시는 없습니다(셀러리 분말 사용).'
    alg = [AL_KO[x] for x in tags if x in AL_KO and x not in ('fish', 'sesame', 'nut')]
    if alg:
        s += ' %s 함유.' % '·'.join(alg)
    if r['kcal'] is None:
        return s + ' 확인한 자료에 영양정보가 없어 영양값은 넣지 않았습니다.'
    dry = dry_soup(kind, serv)
    if dry == 'block':
        s += ' 물을 부어 먹는 건조 국 블록이라 1회는 블록 하나입니다.'
    elif dry == 'mix':
        s += ' 물에 끓여 먹는 건조 국이라 1회는 포장에 적힌 1인분입니다.'
    bits = ['%dkcal' % round(per100(q, 'kcal') * g / 100)]
    for k, nm, uu in [('na', '나트륨', 'mg'), ('p', '단백질', 'g'), ('f', '지방', 'g'), ('s', '당류', 'g')]:
        v = per100(q, k)
        if v is not None:
            vv = v * g / 100
            bits.append('%s %s' % (nm, ('{:,}'.format(int(round(vv))) if uu == 'mg' else ('%g' % round(vv, 1))) + uu))
    how = '식약처 가공식품 DB 값으로 계산, 판매처 상세에는 영양정보가 없음' if r.get('nsrc') == 'mfds' else \
        '상품정보 제공고시 값으로 계산' if r.get('doc') == 'text' else '포장 표시 값으로 계산'
    return s + ' 1회 %d%s(%s)에 %s입니다(%s).' % (g, 'ml' if is_liquid(r) else 'g', u, ', '.join(bits), how)


T10 = {
    'cj_src': ('영양값·원재료명·알레르기는 CJ더마켓 상품정보 제공고시 한 곳에서 옮겼습니다(두 번째 자료와 대조하지 않음).', [SRC_REF]),
    'nitrite_meat': ('아질산나트륨(발색제)을 넣은 가공육이라 앱 기준 \'절대 금지\'입니다. 대한장연구학회는 육가공품을 되도록 먹지 않도록 안내하고, 가공육은 궤양성 대장염 재발 위험과 연관돼 줄이도록 권고됩니다.', [37, 3, 50, 7]),
    'processed_meat': ('햄·소시지·베이컨 같은 가공육입니다. 대한장연구학회는 육가공품을 되도록 먹지 않도록 안내하고, 붉은 고기·가공육은 줄이도록 권고됩니다.', [37, 3, 50]),
    # 볶음밥·찌개처럼 가공육이 재료로 든 음식(제품 자체가 가공육은 아님)
    'nitrite_dish': ('아질산나트륨(발색제)을 넣은 가공육이 들어 있어 앱 기준 \'절대 금지\'입니다. 대한장연구학회는 육가공품을 되도록 먹지 않도록 안내하고, 가공육은 궤양성 대장염 재발 위험과 연관돼 줄이도록 권고됩니다.', [37, 3, 50, 7]),
    'processed_dish': ('햄·소시지·베이컨 같은 가공육이 들어 있습니다. 대한장연구학회는 육가공품을 되도록 먹지 않도록 안내하고, 붉은 고기·가공육은 줄이도록 권고됩니다.', [37, 3, 50]),
    # 시판 제품용 초가공식품 문장. templates.py의 'upf_reduce'(기존 과자·라면 등의 긴 설명)를 덮어쓰지 않게 이름을 따로 둔다(2026-10-16)
    'upf_cj': ('향미증진제·향료·유화제 같은 첨가물이 든 가공식품이라 초가공식품을 줄이라는 권고(AGA)에 따라 자주 먹지 않습니다.', [2]),
    'fried_cj': ('튀기거나 기름에 익힌 제품이라 과도한 지방으로 피하도록 안내됩니다.', [39, 37]),
    'soda_cj': ('탄산·가당 음료는 피하도록 안내됩니다.', [39, 37]),
    'choco_cj': ('초콜릿 같은 단당류 간식은 피하도록 안내됩니다.', [39]),
    'spicy_cj': ('맵고 자극적인 음식은 피하도록 안내되고, 관해기에도 조금만 드십시오.', [37, 39]),
    'salty_cj': ('나트륨이 많아 국물·양념은 남기고 소량만 드십시오.', [39]),
    'fatty_cj': ('지방이 많아 활동기에는 피하고 관해기에 소량만 드십시오.', [39]),
    'sugar_cj': ('당분이 많은 음식은 증상을 일으키기 쉬워 줄이도록 안내됩니다.', [37, 39]),
    'rice_cj': ('흰쌀밥은 섬유가 적어 설사가 잦은 활동기의 주식으로 알맞습니다.', [26]),
    'grain_cj': ('잡곡·현미가 든 밥은 섬유가 많아 저잔사식에서 제한됩니다. 증상이 나아진 뒤 조금씩 늘립니다.', [39, 2]),
    'porridge_cj': ('부드러운 죽은 급성기 권장 식사입니다. 건더기가 크면 잘게 으깨 드십시오.', [39, 37]),
    'raw_cj': ('익히지 않은 수산물·젓갈은 저잔사식에서 제한되고 짜서 소량만 드십시오.', [39]),
    'tough_cj': ('김·해초·견과·육포처럼 질긴 음식은 증상을 일으키기 쉬운 음식으로 안내됩니다.', [37, 39]),
    'pickle_cj': ('절인 채소는 증상 악화를 잘 일으키는 음식으로 안내됩니다.', [39]),
    'caffeine_cj': ('카페인 음료는 배변량을 늘려 설사를 악화시킬 수 있어, 설사가 있을 때 피하도록 안내됩니다.', [3, 39]),
    'fiber_cj': ('잡곡·곤약·식이섬유 원료가 들었거나 식이섬유가 100g당 3g 이상(식약처 \'식이섬유 함유\' 표시 기준)인 제품이라 저잔사식 단계에서는 보류하고, 증상이 나아진 뒤 조금씩 늘립니다.', [29, 39]),
    'mild_cj': ('맵거나 기름지지 않은 제품이라 이행식 단계부터 양을 보며 드십시오.', [39]),
}


def _existing():
    """앱에 이미 있는 음식 이름·별명(같은 제품을 두 번 넣지 않게). 처음 만들 때 tools/dump로 저장한 목록"""
    fp = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cj10_existing.json')
    if not os.path.exists(fp):
        return set(), set()
    ex = json.load(open(fp, encoding='utf-8'))
    keys = set()
    for i, nm, al in ex:
        for k in [nm, nm.split('(')[0]] + list(al):
            keys.add(re.sub(r'\s', '', k))
    return keys, {i for i, _, _ in ex}


def build():
    used = set()
    EXIST, EXIST_IDS = _existing()
    SKIP_DUP.clear()
    LABEL_NONUT.clear()
    TR, LABEL, T, FOD, ING, PLABEL, PSRC = [], {}, dict(T10), {}, {}, {}, {}
    for p in P:
        fid = 'cj' + p['mat']
        base = re.sub(r'\s', '', tidy(p['names'][0]))
        if base in EXIST:
            SKIP_DUP.append((fid, p['names'][0])); continue
        kind = kind_of(p)
        cat = cat_of(p)
        serv = serving(p, kind)
        tags, hits = tags_of(p, kind, cat, serv)
        ms = stage_fix(p, kind, tags, stage_of(kind, tags))
        name = short_name(p, used)
        aliases = []
        for a in p['names']:
            a2 = re.sub(r'\s+', ' ', a).strip()
            if a2 and a2 != name and a2 not in aliases and len(a2) <= 30:
                aliases.append(a2)
        aliases = aliases[:4]
        unit = 'ml' if is_liquid(p) else 'g'
        if p.get('nut_ok') is False:      # 영양값을 맞출 수 없는 아질산염 가공육: 영양값 없이(판정은 원재료명으로)
            src_key = 'N:-'
        else:
            src_key = 'L:' + fid
        if src_key.startswith('L:'):
          LABEL[fid] = dict(vol=p['b'], unit=unit, kcal=p['kcal'], c=p['c'], fi=p.get('fi'), p=p['p'], f=p['f'], ca=None, fe=None, k=None,
                            na=p['na'], vd=None, name=p['names'][0], src='CJ더마켓 상품정보 고시', ref=[SRC_REF])
        pk = 'p_' + fid
        T[pk] = (describe(p, kind, tags, serv, hits), [SRC_REF])
        tk = []
        meat = kind in MEAT_KINDS
        if 'nitrite' in tags:
            tk.append('nitrite_meat' if meat else 'nitrite_dish')
        elif 'processed' in tags:
            tk.append('processed_meat' if meat else 'processed_dish')
        if 'fried' in tags:
            tk.append('fried_cj')
        if 'soda' in tags:
            tk.append('soda_cj')
        if 'choco' in tags:
            tk.append('choco_cj')
        if kind == 'rice':
            tk.append('grain_cj' if 'hifiber' in tags else 'rice_cj')
        elif 'hifiber' in tags:
            tk.append('fiber_cj')
        if kind == 'porridge':
            tk.append('porridge_cj')
        if kind == 'fishcake':
            tk.append('processed_fish')
        if 'spicy' in tags:
            tk.append('spicy_cj')
        if 'raw' in tags:
            tk.append('raw_cj')
        if 'tough' in tags:
            tk.append('tough_cj')
        if 'pickled' in tags:
            tk.append('pickle_cj')
        if 'caffeine' in tags:
            tk.append('caffeine_cj')
        if 'fatty' in tags and ms != 9:
            tk.append('fatty_cj')
        if 'salty' in tags:
            tk.append('salty_cj')
        if 'sugar' in tags and ms != 9:
            tk.append('sugar_cj')
        if 'upf2' in tags or 'upf' in tags:
            tk.append('upf_cj')
        if ms == 2 and len(tk) == 0:
            tk.append('mild_cj')
        tk += [pk]   # 출처(CJ더마켓 상품 번호·확인일)는 앱이 PSRC10으로 따로 보여 준다
        TR.append((fid, name, cat, src_key, ms, tags, serv, aliases, ICON.get(kind, '🍽️'), tk, None, None, '', 1))
        fd = fodmap(p, kind, tags)
        if fd[1] != '이 제품의 FODMAP 수치는 확인되지 않음':    # 앱 기본값('수치 미확인')과 같은 것은 넣지 않는다
            FOD[fid] = fd
        al = p['al'] if p['al'] else ''
        ING[fid] = p['ing'] + ('. ' + al if al and not re.search(r'함유|없음', p['ing'][-30:]) else '')
        # 고시 영양정보(표시 그대로): [기준량, 단위, 총 내용량, 총 단위, 열량, 나트륨, 탄수화물, 당류, 지방, 트랜스지방, 포화지방, 콜레스테롤, 단백질, 식이섬유]
        # 글로 만들면 제품마다 같은 낱말이 되풀이돼 앱이 커지므로 숫자만 두고 앱(plabelText)이 글로 바꾼다
        if src_key.startswith('L:'):
            PLABEL[fid] = [p['b'], p['bu'], p['tot'], p['tu'], p['kcal'], p['na'], p['c'], p['s'], p['f'], p['tf'], p['sf'], p['ch'], p['p'], p.get('fi')]
        PSRC[fid] = ['cj', p['prd'], CHECKED]
    # ---- 다른 회사 가공육(brand10: 동원몰 고시·식품안전나라 품목제조보고). 영양값 없이 원재료로 판정 ----
    for b in BRAND:
        fid = b['site'] + re.sub(r'\D', '', str(b['id']))
        if fid in PSRC:
            continue
        base = re.sub(r'\s', '', b['name'])
        if base in EXIST:
            SKIP_DUP.append((fid, b['name'])); continue
        q = dict(names=b['names'], ty=b['ty'], ing=b['ing'], al=b['al'], tot=None, tu=None, b=None, bu=None, cats=['004203'], mat=fid,
                 kcal=None, na=None, c=None, s=None, f=None, p=None, nut_ok=False)
        kind = 'bacon' if re.search(r'베이컨', b['name'] + b['ty']) else 'sausage' if re.search(r'소시지|후랑크|프랑크|비엔나|부어스트|핫바|소세지', b['name'] + b['ty']) else 'ham'
        serv = list(SERV_FIX.get(kind, (50, '인분'))) if kind != 'sausage' else [50, '인분']
        tags, hits = tags_of(q, kind, '단백질', serv)
        if b['nit'] and 'nitrite' not in tags:
            tags = tags + ['nitrite']
        if 'processed' not in tags:
            tags.append('processed')    # 햄·소시지·베이컨(가공육)
        ms = 9
        name = short_name(q, used)
        aliases = [a for a in dict.fromkeys(b['names']) if a != name and len(a) >= 2][:4]
        pk = 'p_' + fid
        ty = re.sub(r'^\s*-\s*', '', b['ty'])
        alg = [AL_KO[x] for x in tags if x in AL_KO and x not in ('fish', 'sesame', 'nut')]
        what = ('%s의 %s입니다.' % (b['maker'], ty or '가공육')) if b.get('maker') else '%s입니다.' % (ty or '가공육')
        if b['site'] == 'fs':
            desc = what + ' 품목제조보고 때 신고한 원료에 아질산나트륨(발색제)이 있습니다.'
        else:
            desc = what
            if b['nit']:
                desc += ' 원재료명에 아질산나트륨(발색제)이 있습니다(동원몰 상품정보 제공고시).'
            if alg:
                desc += ' %s 함유.' % '·'.join(alg)
            desc += ' 영양정보는 이 자료에 글로 없어 넣지 않았습니다.'
        T[pk] = (desc, [BRAND_REF[b['site']]])
        tk = (['nitrite_meat'] if b['nit'] else ['processed_meat']) + (['upf_cj'] if 'upf2' in tags else []) + [pk]
        TR.append((fid, name, '단백질', 'N:-', ms, tags, serv, aliases, ICON[kind], tk, None, None, '', 1))
        ING[fid] = b['ing'] + ('. ' + b['al'] if b['al'] else '')
        PSRC[fid] = [b['site'], str(b['id']), b['checked']] + ([b['ledg'], b.get('date') or ''] if b.get('ledg') else [])
    # ---- 다른 회사 만두·육포·볶음밥·국(label10: 동원몰·랭킹닭컴·아임닭·풀무원샵 상품 상세의 포장 표시 사진·고시) ----
    for r in LABELS:
        fid = r['site'] + r['id']
        if fid in PSRC:
            continue
        if r['kind'] in NEED_NUT and r['kcal'] is None:
            LABEL_NONUT.append((fid, r['names'][0])); continue   # 만두·볶음밥·국은 영양정보까지 확인한 것만 넣는다(사용자 요청). 육포는 가공육이라 원재료로 판정
        base = re.sub(r'\s', '', tidy(r['names'][0]))
        if base in EXIST:
            SKIP_DUP.append((fid, r['names'][0])); continue
        kind = r['kind']
        cat = LABEL_CAT[kind]
        q = dict(names=r['names'], ty=r.get('ty') or '', ing=r['ing'], al=r.get('al') or '', tot=r['tot'], tu=r.get('tu') or 'g', b=r['b'],
                 bu=r.get('bu') or 'g', cats=[LABEL_CATS[kind]], mat=fid,
                 **{k: r.get(k) for k in ('kcal', 'na', 'c', 's', 'f', 'tf', 'sf', 'ch', 'p', 'fi')})
        serv = label_serving(r, q)
        tags, hits = tags_of(q, kind, cat, serv)
        if kind == 'jerky':
            if 'processed' not in tags:
                tags.append('processed')     # 건조저장육류·분쇄가공육제품: 발색제가 없어도 가공육(피하기)
            if 'tough' not in tags:
                tags.append('tough')
            if 'redmeat' not in tags and re.search(r'쇠고기|소고기|돼지고기|돈육', r['ing'][:40]):
                tags.append('redmeat')
        if dry_soup(kind, serv):
            # 물을 부어 먹는 동결건조 국 블록(한 개 6~19 g)·물에 끓이는 건조 국(1인분 17~18 g): 100 g당 값은 마른 상태의 값이라
            # 지방·당류·식이섬유 기준을 쓰지 않고, 나트륨은 1회(물에 풀거나 끓인 한 그릇) 값으로 본다
            tags = [t for t in tags if t not in ('fatty', 'sugar', 'hifiber', 'salty')]
            if r['na'] is not None and r['na'] * serv[0] / r['b'] >= 800:
                tags.append('salty')
        ms = stage_fix(q, kind, tags, stage_of(kind, tags))
        name = short_name(dict(q, names=label_names(r['names'])), used)
        aliases = [a for a in r['names'] if a != name and len(a) <= 30][:4]
        has_nut = r['kcal'] is not None
        mfds = r.get('nsrc') == 'mfds'
        ref = LABEL_REF[r['site']]
        if has_nut:
            src_key = 'L:' + fid
            LABEL[fid] = dict(vol=r['b'], unit=r.get('bu') or 'g', kcal=r['kcal'], c=r['c'], fi=r.get('fi'), p=r['p'], f=r['f'], ca=None, fe=None, k=None,
                              na=r['na'], vd=None, name=r['names'][0],
                              src=('식약처 가공식품 DB(2026-08-28)' if mfds else LABEL_SRC[r['site']].replace('상품 상세(포장 표시)', '상품정보 제공고시') if r.get('doc') == 'text' else LABEL_SRC[r['site']]),
                              ref=[MFDS_REF if mfds else ref])
            PLABEL[fid] = [r['b'], r.get('bu') or 'g', r['tot'], r.get('tu') or 'g', r['kcal'], r['na'], r['c'], r['s'], r['f'], r['tf'], r['sf'],
                           r['ch'], r['p'], r.get('fi')] + (['식약처 가공식품 DB ' + r['nsrc_date']] if mfds else [])
        else:
            src_key = 'N:-'
        pk = 'p_' + fid
        T[pk] = (describe_label(r, q, kind, tags, serv), [ref] + ([MFDS_REF] if mfds else []))
        tk = []
        meat = kind in MEAT_KINDS
        if 'nitrite' in tags:
            tk.append('nitrite_meat' if meat else 'nitrite_dish')
        elif 'processed' in tags:
            tk.append('processed_meat' if meat else 'processed_dish')
        for tag, key in (('fried', 'fried_cj'), ('spicy', 'spicy_cj'), ('tough', 'tough_cj')):
            if tag in tags:
                tk.append(key)
        if 'hifiber' in tags:
            tk.append('fiber_cj')
        if 'fatty' in tags and ms != 9:
            tk.append('fatty_cj')
        if 'salty' in tags:
            tk.append('salty_cj')
        if 'sugar' in tags and ms != 9:
            tk.append('sugar_cj')
        if 'upf2' in tags or 'upf' in tags:
            tk.append('upf_cj')
        if ms == 2 and len(tk) == 0:
            tk.append('mild_cj')
        tk.append(pk)
        TR.append((fid, name, cat, src_key, ms, tags, serv, aliases, ICON[kind], tk, None, None, '', 1))
        fd = fodmap(q, kind, tags)
        if fd[1] != '이 제품의 FODMAP 수치는 확인되지 않음':
            FOD[fid] = fd
        al = r.get('al') or ''
        ING[fid] = r['ing'] + ('. ' + al if al else '')
        PSRC[fid] = [r['site'], r['pid'], r['checked']]
    # 같은 별명이 두 음식 이상에 붙으면(용량만 다른 제품 등) 검색이 헷갈리므로 그 별명은 뺀다(이름은 그대로 검색됨)
    cnt = {}
    for x in TR:
        for a in set(re.sub(r'\s', '', a) for a in x[7]):
            cnt[a] = cnt.get(a, 0) + 1
    names = {re.sub(r'\s', '', x[1]) for x in TR}
    TR = [x[:7] + ([a for a in x[7] if cnt[re.sub(r'\s', '', a)] == 1 and re.sub(r'\s', '', a) not in names - {re.sub(r'\s', '', x[1])}],) + x[8:] for x in TR]
    return TR, LABEL, T, FOD, ING, PLABEL, PSRC


SKIP_DUP = []   # 앱에 이미 있는 같은 제품이라 넣지 않은 것
LABEL_NONUT = []   # 영양정보를 찾지 못해 넣지 않은 만두·볶음밥·국
TR10, LABEL10, T10, FOD10, ING10, PLABEL10, PSRC10 = build()

if __name__ == '__main__':
    import collections
    print('foods', len(TR10))
    print('stage', collections.Counter(x[4] for x in TR10))
    print('cat', collections.Counter(x[2] for x in TR10))
    print('nitrite', sum(1 for x in TR10 if 'nitrite' in x[5]), 'processed', sum(1 for x in TR10 if 'processed' in x[5]))
