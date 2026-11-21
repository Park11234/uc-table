# -*- coding: utf-8 -*-
"""식약처 원본 CSV 없이 생성 데이터(generated/gen_out.json)의 '글' 부분을 다시 만든다(2026-10-26 6차).

generate_dataset.py는 원본 CSV(data/mfds, 저장소에 없음)가 있어야 처음부터 돈다. 그런데 음식 설명 글(LF·CW), CJ 시판 식품의
되풀이 문장(cjt), 1회 분량·별명, FODMAP 안내(fodi, 2026-11-01부터), 제품 포장 표시(출처 'L:')에서 옮긴 영양값은 CSV가 필요 없다. 이 파일은 generate_dataset.py의
앞부분(CSV를 읽기 전, 음식 목록 L과 근거 문장 T를 다듬는 부분)을 그대로 실행해 그 부분만 다시 만든다. 그래서 templates.py·spec*.py·
generate_dataset.py의 문장이나 CJ 제품 자료를 고친 뒤 이 파일을 돌리면 gen_out.json이 원본과 같은 결과가 된다.
식약처·농진청 값(출처 A·D·P·C 등)은 건드리지 않는다.

  python3 src/data/regen_text.py          gen_out.json을 다시 쓴다
  python3 src/data/regen_text.py --check  다시 만든 결과가 지금 gen_out.json과 같은지만 본다(다르면 종료 코드 1)
"""
import json, os, sys

D = os.path.dirname(os.path.abspath(__file__))
GEN = os.path.join(D, 'generated', 'gen_out.json')
js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
r2 = lambda v: None if v is None else round(v + 0.0, 2)


def prefix():
    """generate_dataset.py를 원본 CSV를 읽는 줄 바로 앞까지 실행한다. pandas는 그 앞에서 쓰지 않으므로 없으면 빈 이름으로 둔다"""
    src = open(os.path.join(D, 'generate_dataset.py'), encoding='utf-8').read().split('\n')
    cut = next(n for n, l in enumerate(src) if l.startswith('raw=pd.read_csv('))
    code = '\n'.join('pd=None' if l == 'import pandas as pd' else l for l in src[:cut])
    g = {'__file__': os.path.join(D, 'generate_dataset.py'), '__name__': 'generate_dataset_prefix'}
    if D not in sys.path:
        sys.path.insert(0, D)
    exec(compile(code, 'generate_dataset.py(앞부분)', 'exec'), g)
    return g


def lab(d):
    """generate_dataset.py의 lab()과 같다: 포장 표시 값을 100g(ml)당 값으로"""
    vol = d['vol']; per = lambda v: None if v is None else r2(v * 100 / vol)
    kc = d['kcal']; calc = False
    if kc is None and None not in (d['c'], d['p'], d['f']):
        fi = d['fi'] or 0; al = d.get('allulose', 0)
        kc = int(round(((d['c'] - fi - al) * 4 + fi * 2 + d['p'] * 4 + d['f'] * 9) / 5.0) * 5); calc = True
    name = d['name'] + (' · 열량은 표시된 탄수화물·단백질·지방으로 계산' if calc else '')
    unit = d.get('unit', 'ml')
    mf = [per(kc), per(d['p']), per(d['f']), per(d['c']), per(d['fi']), per(d['ca']), per(d['fe']), 'L', d['src'], name, '100' + unit, per(d['k'])]
    if d.get('ref'):
        mf.append(d['ref'])
    return mf, [per(d['na']), per(d['vd'])]


def regen(o):
    g = prefix(); L, T, CAP, LABEL, PLABEL10, FOD = g['L'], g['T'], g['CAP'], g['LABEL'], g['PLABEL10'], g['FOD']

    def why(x):     # generate_dataset.py의 why()와 같다
        sents = []; refs = []
        for k in x[9]:
            s, rf = T[k]
            if '{cap}' in s:
                s = s.replace('{cap}', str(CAP.get(x[0], x[11] or 100)))
            if s not in sents:
                sents.append(s)
            for r in rf:
                if r not in refs:
                    refs.append(r)
        return ' '.join(sents), refs

    out = dict(o); foods = []; CJT = []
    serv = dict(o['serv']); alias = dict(o['alias']); mfds = dict(o['mfds']); micro = dict(o['micro']); plabel = dict(o['plabel'])
    for x in L:
        i, nm, cat, src, msv, tags, sv, al, emo, tk, _f, _c, pr, cost = x
        w, refs = why(x)
        cj = i.startswith('cj') and i[2:].isdigit()
        if cj:
            ks = []; last = None
            for k in tk:
                sent = T[k][0]
                if k.startswith('p_'):
                    last = sent; continue
                if sent not in CJT:
                    CJT.append(sent)
                ks.append(CJT.index(sent))
            assert ' '.join([CJT[j] for j in ks] + ([last] if last else [])) == w, i
            foods.append(f'LF({js(i)},{js(nm)},{js(cat)},{msv},{js(tags)},{cost},{js(pr)},CW({js(ks)},{js(last or "")}),{js(refs)})')
            # CJ 시판 식품의 영양값은 상품정보 고시(spec10)에서만 온다: 고시 값을 고치면 여기서 함께 바뀐다
            if src.startswith('L:'):
                mf, mi = lab(LABEL[src[2:]])
                if isinstance(mf[10], str) and 'ml' in mf[10] and sv[1] not in ('잔', '컵', '캔', '병', '팩', '그릇'):
                    mf[10] = mf[10].replace('ml', 'g')
                mfds[i] = mf; micro[i] = mi
            elif src.startswith('N:'):
                mfds.pop(i, None); micro[i] = [None, None]
            if i in PLABEL10:
                plabel[i] = PLABEL10[i]
            else:
                plabel.pop(i, None)
        else:
            foods.append(f'LF({js(i)},{js(nm)},{js(cat)},{msv},{js(tags)},{cost},{js(pr)},{js(w)},{js(refs)})')
        serv[i] = sv; alias[i] = al
    # 2026-11-01: FODMAP 안내(fodi)도 CSV를 읽기 전에 정해지므로 함께 다시 만든다(spec10의 원재료명 규칙을 고치면 바뀜).
    # generate_dataset.py와 같은 순서·같은 값인지는 v1.12.0 기준본(HEAD) gen_out.json과 1,347개 모두 같음으로 확인
    fodi = {x[0]: list(FOD[x[0]]) for x in L if x[0] in FOD}
    out.update(foods=foods, cjt=CJT, serv=serv, alias=alias, mfds=mfds, micro=micro, plabel=plabel, fodi=fodi)
    return out


def main():
    s = open(GEN, encoding='utf-8').read(); o = json.loads(s)
    t = json.dumps(regen(o), ensure_ascii=False)
    if '--check' in sys.argv:
        print('같음' if t == s else '다름: python3 src/data/regen_text.py로 gen_out.json을 다시 만드십시오')
        sys.exit(0 if t == s else 1)
    if t != s:
        open(GEN, 'w', encoding='utf-8').write(t)
    print('gen_out.json', '바뀜' if t != s else '그대로')


if __name__ == '__main__':
    main()
