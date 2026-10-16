# -*- coding: utf-8 -*-
"""앱 소스(src/app/app.src.html)에 생성 데이터를 넣어 src/app/index.html을 만든다.

app.src.html에는 화면·판정 규칙·식단 코드가 모두 들어 있고, 생성 데이터 자리에는 표시자만 있다.
  /*@GEN:foods@*/  음식 사전 추가 음식(LF 호출 목록)      ← generated/gen_out.json
  /*@GEN:mfds@*/   식약처 영양값                          ← generated/gen_out.json
  /*@GEN:emo@*/ /*@GEN:fodi@*/ /*@GEN:serv@*/ /*@GEN:alias@*/ /*@GEN:ficon@*/ /*@GEN:cap@*/
  /*@GEN:micro@*/  나트륨·비타민 D(음식별 100g당)            ← generated/gen_out.json
  /*@GEN:ingr@*/   시판 과자·라면·마트 식품 원재료명(포장 표시)  ← generated/gen_out.json
  /*@GEN:plabel@*/ 마트 시판 식품 포장 영양정보(표시 그대로)    ← generated/gen_out.json
  /*@GEN:psrc@*/   CJ더마켓 시판 식품의 확인한 상품 번호·확인일 ← generated/gen_out.json
  /*@GEN:cjt@*/    CJ더마켓 시판 식품에 되풀이되는 설명 문장     ← generated/gen_out.json
  /*@GEN:menus@*/  오프라인 예시 식단 메뉴                 ← menus.py build()
  /*@GEN:qa@*/     궁금한 점(Q&A)과 근거 원문 인용          ← qa.py build()
  /*@GEN:dishx@*/  음식(D) 값의 종류와 같은 이름 자료의 열량 범위 ← generated/gen_out.json
  /*@GEN:fserv@*/  FODMAP 1회량 기준·성분                  ← fodmap_serv.py build()
  /*@GEN:shop@*/   장보기: 익힌 무게→생것 비율·폐기율(DB 10.4)  ← generated/gen_out.json
  /*@GEN:logo@*/   UC TABLE 로고(SVG 글자열)                ← src/brand/logo-mono.svg (tools/brand.cjs)

식약처 원본 CSV가 있으면 generate_dataset.py로 gen_out.json부터 다시 만들 수 있다.
같은 입력이면 늘 같은 결과(바이트 단위)가 나온다(CI에서 확인).
"""
import json, os, re, sys
D = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(D))
sys.path.insert(0, D)
from menus import build as build_menus
from qa import build as build_qa
from fodmap_serv import build as build_fserv

SRC = os.path.join(ROOT, 'src', 'app', 'app.src.html')
OUT = os.path.join(ROOT, 'src', 'app', 'index.html')
GEN = os.path.join(D, 'generated', 'gen_out.json')


def js(x):
    return json.dumps(x, ensure_ascii=False, separators=(',', ':'))


def render():
    with open(SRC, encoding='utf-8') as f:
        s = f.read()
    with open(GEN, encoding='utf-8') as f:
        o = json.load(f)
    blocks = {
        'foods': ' ' + ',\n '.join(o['foods']),
        'mfds': js(o['mfds']),
        'emo': js(o['emo']),
        'fodi': js(o['fodi']),
        'serv': js(o['serv']),
        'alias': js(o['alias']),
        'ficon': js(o['ficon']),
        'cap': ','.join(f'{k}:{v}' for k, v in o['cap'].items()),
        'micro': js(o['micro']),
        'ingr': js(o.get('ingr', {})),
        'plabel': js(o.get('plabel', {})),
        'psrc': js(o.get('psrc', {})),
        'cjt': js(o.get('cjt', [])),
        'menus': js(build_menus()),
        'qa': js(build_qa()),
        'dishx': js(o.get('dishx', {})),
        'fserv': js(build_fserv()),
        'shop': js(o.get('shop', {})),
        'logo': js(open(os.path.join(ROOT, 'src', 'brand', 'logo-mono.svg'), encoding='utf-8').read().strip()),
    }
    found = re.findall(r'/\*@GEN:(\w+)@\*/', s)
    assert sorted(found) == sorted(blocks), ('표시자 불일치', found)
    for k, v in blocks.items():
        s = s.replace(f'/*@GEN:{k}@*/', v, 1)
    return s


if __name__ == '__main__':
    out = render()
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(out)
    print('완료: src/app/index.html', len(out))
