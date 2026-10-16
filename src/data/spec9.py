# -*- coding: utf-8 -*-
# 마트·편의점 시판 식품 17종(즉석밥·죽·국·두부·락토프리 우유·두유·이온음료, 2026-10-14 확인)
# 형식은 spec8.py와 같다: (id, 이름, 분류, 출처, 시작 단계, 태그, [1회 분량, 단위], 별명, 아이콘, 설명 템플릿, 미사용, 과일 상한, 조리·섭취 팁, 가격대)
# 영양값은 포장 표시 그대로(LABEL9, 표시 기준량당)이고, 대조 기록은 mart_check.py(제조사 공식 자료·이마트몰 포장 사진·식약처 가공식품 DB·열량 계산).
# 태그 기준
#   알레르기: 포장의 '함유' 표시만(혼입 가능 표시는 넣지 않음)
#   upf2: 향미증진제·향료·유화제·조미 베이스·분리대두단백 같은 가공 원료가 원재료명에 있는 제품(초가공식품 줄이기 권고, AGA)
#   allium: 원재료명에 양파·마늘·파(엑기스·착즙 포함)가 있는 제품
#   redmeat: 쇠고기 살코기가 건더기로 든 제품(국물 원료로만 든 사골곰탕은 넣지 않음)
from mart_check import X as _X

_DB = {v['fid']: v['db'][0]['code'] for v in _X.values()}


def _L(fid, vol, unit, kcal, c, p, f, na, src, fi=None, ca=None, fe=None, vd=None, allulose=None):
    v = next(v for v in _X.values() if v['fid'] == fid)
    d = dict(vol=vol, unit=unit, kcal=kcal, c=c, fi=fi, p=p, f=f, ca=ca, fe=fe, k=None, na=na, vd=vd,
             name=f"{v['name']}(식약처 가공식품 DB {_DB[fid]} 대조)", src=src, ref=[81, 27], xm=fid)
    if allulose is not None:
        d['allulose'] = allulose
    return d


_CJ = 'CJ더마켓 상품정보 제공고시·이마트몰 포장 표시'
_MA = '매일유업 제품 안내·이마트몰 포장 표시'
LABEL9 = {
 'mk_hetbahn210': _L('mk_hetbahn210', 210, 'g', 315, 70, 5, 1.5, 15, _CJ),
 'mk_hetbahn130': _L('mk_hetbahn130', 130, 'g', 190, 43, 3, 0.9, 10, _CJ),
 'mk_juk_beef': _L('mk_juk_beef', 420, 'g', 215, 39, 9, 2.7, 790, _CJ),
 'mk_juk_chicken': _L('mk_juk_chicken', 420, 'g', 210, 35, 12, 2.3, 1010, _CJ),
 'mk_juk_mushveg': _L('mk_juk_mushveg', 420, 'g', 200, 43, 4, 1.2, 890, _CJ),
 'mk_sagol_bibigo': _L('mk_sagol_bibigo', 500, 'g', 30, 0, 3, 2.1, 1180, _CJ),
 'mk_seolleong_bibigo': _L('mk_seolleong_bibigo', 500, 'g', 110, 2, 16, 4.1, 1070, _CJ),
 'mk_tofu_morning': _L('mk_tofu_morning', 140, 'g', 85, 4, 7, 4.5, 10, _CJ),
 'mk_silken_tofu140': _L('mk_silken_tofu140', 140, 'g', 70, 2, 6, 4.4, 10, _CJ),
 'mk_lf_milk_orig': _L('mk_lf_milk_orig', 100, 'ml', 55, 3, 3, 3.4, 40, _MA, ca=190),
 'mk_lf_milk_low': _L('mk_lf_milk_low', 100, 'ml', 40, 3, 3, 2, 40, _MA, ca=190),
 'mk_soymilk999': _L('mk_soymilk999', 190, 'ml', 95, 4, 9, 5, 130, _MA, fi=1.6),
 'mk_soymilk_hp': _L('mk_soymilk_hp', 190, 'ml', 90, 6.5, 12, 4.1, 200, _MA, fi=1.3, allulose=4),
 'mk_vegemil_a': _L('mk_vegemil_a', 190, 'ml', 110, 8, 6, 6, 160, '정식품 제품 소개·이마트몰 포장 표시', fi=1.3, ca=140, fe=1, vd=3),
 'mk_pocari500': _L('mk_pocari500', 500, 'ml', 120, 30, 0, 0, 250, '이마트몰 포장 표시(500ml·900ml)'),
 'mk_ottogi_rice': _L('mk_ottogi_rice', 210, 'g', 305, 66, 6, 2, 15, '오뚜기몰 포장 표시면·이마트몰 포장 표시'),
 'mk_ottogi_sagol': _L('mk_ottogi_sagol', 500, 'g', 60, 1, 7, 3, 1150, '오뚜기몰 포장 표시면·이마트몰 포장 표시'),
}

TR9 = [
 ("mk_hetbahn210","햇반 210g","곡류","L:mk_hetbahn210",1,[],[210,"개"],["햇반","햇반 흰쌀밥","CJ 햇반 210g"],"🍚",["mk_rice","p_mk_hetbahn210","mk_xchk"],None,None,"전자레인지에 데워 부드럽게",1),
 ("mk_hetbahn130","햇반 작은공기 130g","곡류","L:mk_hetbahn130",1,[],[130,"개"],["햇반 작은공기","작은 햇반","햇반 130g"],"🍚",["mk_rice","p_mk_hetbahn130","mk_xchk"],None,None,"전자레인지에 데워 부드럽게",1),
 ("mk_juk_beef","CJ 듬뿍 소고기죽 420g","곡류","L:mk_juk_beef",1,["liq","beef","redmeat","dairy","soy","wheat","allium","upf2"],[420,"봉"],["듬뿍 소고기죽","소고기죽","쇠고기죽","CJ 소고기죽"],"🥣",["mk_porridge","p_mk_juk_beef","upf_reduce","mk_xchk"],None,None,"건더기가 크면 잘게 으깨기",2),
 ("mk_juk_chicken","CJ 듬뿍 누룽지닭백숙죽 420g","곡류","L:mk_juk_chicken",1,["liq","chicken","beef","dairy","soy","wheat","allium","upf2"],[420,"봉"],["듬뿍 누룽지닭백숙죽","누룽지닭백숙죽","닭백숙죽"],"🥣",["mk_porridge","p_mk_juk_chicken","upf_reduce","mk_xchk"],None,None,"건더기가 크면 잘게 으깨기",2),
 ("mk_juk_mushveg","CJ 듬뿍 버섯야채죽 420g","곡류","L:mk_juk_mushveg",1,["liq","chicken","beef","dairy","soy","wheat","allium","upf2"],[420,"봉"],["듬뿍 버섯야채죽","버섯야채죽","버섯 야채죽"],"🥣",["mk_porridge","p_mk_juk_mushveg","upf_reduce","mk_xchk"],None,None,"버섯 건더기는 잘게 으깨기",2),
 ("mk_sagol_bibigo","비비고 사골곰탕 500g","요리","L:mk_sagol_bibigo",1,["liq","beef","soy","wheat","allium","upf2"],[500,"봉"],["비비고 사골곰탕","비비고 사골국","CJ 사골곰탕"],"🍲",["soup_bone","p_mk_sagol_bibigo","upf_reduce","mk_xchk"],None,None,"1봉이 1~2인분이라 나눠 먹기",1),
 ("mk_seolleong_bibigo","비비고 설렁탕 500g","요리","L:mk_seolleong_bibigo",1,["liq","beef","redmeat","soy","wheat","upf2"],[500,"봉"],["비비고 설렁탕","CJ 설렁탕"],"🍲",["soup_bone","p_mk_seolleong_bibigo","upf_reduce","mk_xchk"],None,None,"기름을 걷고 싱겁게",2),
 ("mk_tofu_morning","행복한콩 모닝두부 140g","단백질","L:mk_tofu_morning",1,["soy"],[140,"모"],["모닝두부","행복한콩 모닝두부","CJ 모닝두부"],"🥢",["tofu_ok","p_mk_tofu_morning","mk_xchk"],None,None,"물기를 빼고 데워 먹기",1),
 ("mk_silken_tofu140","CJ 국산콩 연두부 140g","단백질","L:mk_silken_tofu140",1,["soy","liq"],[140,"개"],["국산콩 연두부","행복한콩 연두부","CJ 연두부"],"🥢",["tofu_ok","p_mk_silken_tofu140","mk_xchk"],None,None,"데워서 간장은 조금만",1),
 ("mk_lf_milk_orig","소화가잘되는우유 오리지널 930ml","유제품","L:mk_lf_milk_orig",1,["dairy","liq"],[200,"컵"],["소화가 잘되는 우유","소화가 잘되는 우유 오리지널","매일 소화가 잘되는 우유","매일 락토프리 우유"],"🥛",["dairy_ok","p_mk_lf_milk_orig","mk_xchk"],None,None,"",1),
 ("mk_lf_milk_low","소화가잘되는우유 저지방 930ml","유제품","L:mk_lf_milk_low",1,["dairy","liq"],[200,"컵"],["소화가 잘되는 우유 저지방","매일 소화가 잘되는 우유 저지방","락토프리 저지방 우유"],"🥛",["dairy_ok","p_mk_lf_milk_low","mk_xchk"],None,None,"",1),
 ("mk_soymilk999","매일두유 99.9 190ml","유제품","L:mk_soymilk999",1,["soy","liq"],[190,"팩"],["매일두유 99.9","매일두유","무가당 두유"],"🥛",["soymilk","p_mk_soymilk999","mk_xchk"],None,None,"",1),
 ("mk_soymilk_hp","매일두유 고단백 190ml","유제품","L:mk_soymilk_hp",1,["soy","liq","upf2"],[190,"팩"],["매일두유 고단백","고단백 두유"],"🥛",["soymilk","p_mk_soymilk_hp","upf_reduce","mk_xchk"],None,None,"",1),
 ("mk_vegemil_a","담백한 베지밀 에이 190ml","유제품","L:mk_vegemil_a",1,["soy","liq","upf2"],[190,"팩"],["베지밀 에이","베지밀A","베지밀 A","담백한 베지밀"],"🥛",["soymilk","p_mk_vegemil_a","upf_reduce","mk_xchk"],None,None,"",1),
 ("mk_pocari500","포카리스웨트 500ml","기타","L:mk_pocari500",1,["liq","sugar","upf2"],[500,"병"],["포카리스웨트 500","포카리 500ml","동아오츠카 포카리스웨트"],"🥤",["ion_drink","p_mk_pocari500","sugar_drink","upf_reduce","mk_xchk_pocari"],None,None,"차갑게 벌컥 마시지 말고 조금씩",1),
 ("mk_ottogi_rice","맛있는 오뚜기밥 210g","곡류","L:mk_ottogi_rice",1,[],[210,"개"],["오뚜기밥","맛있는 오뚜기밥","오뚜기 흰밥"],"🍚",["mk_rice","p_mk_ottogi_rice","mk_xchk"],None,None,"전자레인지에 데워 부드럽게",1),
 ("mk_ottogi_sagol","오뚜기 옛날 사골곰탕 500g","요리","L:mk_ottogi_sagol",1,["liq","beef","soy","clam","allium","upf2"],[500,"봉"],["옛날 사골곰탕","오뚜기 사골곰탕"],"🍲",["soup_bone","p_mk_ottogi_sagol","upf_reduce","mk_xchk"],None,None,"1봉이 1~2인분이라 나눠 먹기",1),
]

T9 = {
 'mk_xchk': ("영양값과 원재료명은 포장 표시이고, 제조사 공식 자료와 식약처 가공식품 DB의 같은 제품 값이 맞는 것을 확인했습니다.", [81, 27]),
 'mk_xchk_pocari': ("영양값과 원재료명은 포장 표시이고, 식약처 가공식품 DB의 같은 제품 값과 맞는 것을 확인했습니다. 제조사 사이트에는 영양정보가 없어 900ml 포장 표시로 원재료명을 한 번 더 대조했습니다.", [81, 27]),
 'mk_rice': ("흰쌀밥은 섬유가 적어 설사가 잦은 활동기의 주식으로 알맞습니다.", [26]),
 'mk_porridge': ("부드러운 죽은 급성기 권장 식사입니다. 시판 죽은 건더기가 크면 잘게 으깨 드십시오.", [39, 37]),
 'p_mk_hetbahn210': ("멥쌀 99.9%로 지은 즉석밥입니다. 1개(210g)에 315kcal, 나트륨 15mg입니다(포장 표시).", [81]),
 'p_mk_hetbahn130': ("멥쌀 99.9%로 지은 작은 즉석밥입니다. 1개(130g)에 190kcal입니다(포장 표시).", [81]),
 'p_mk_juk_beef': ("쇠고기·표고버섯·당근·양파를 넣은 레토르트 죽입니다. 우유·대두·밀·쇠고기 함유. 1봉(420g)에 나트륨 790mg입니다(포장 표시).", [81]),
 'p_mk_juk_chicken': ("닭고기와 누룽지를 넣은 레토르트 죽입니다. 우유·대두·밀·닭고기·쇠고기 함유. 1봉(420g)에 단백질 12g, 나트륨 1,010mg입니다(포장 표시).", [81]),
 'p_mk_juk_mushveg': ("표고·새송이버섯과 채소를 넣은 레토르트 죽입니다. 고기 건더기는 없지만 조미 원료 때문에 우유·대두·밀·닭고기·쇠고기 함유로 표시됩니다. 1봉(420g)에 나트륨 890mg입니다(포장 표시).", [81]),
 'p_mk_sagol_bibigo': ("사골농축액으로 만든 국물입니다. 쇠고기·대두·밀 함유. 1봉(500g)에 단백질 3g, 나트륨 1,180mg으로 국물만으로는 단백질이 적습니다(포장 표시).", [81]),
 'p_mk_seolleong_bibigo': ("쇠고기 양지가 든 뼈 국물입니다. 쇠고기·대두·밀 함유. 1봉(500g)에 단백질 16g, 나트륨 1,070mg입니다(포장 표시).", [81]),
 'p_mk_tofu_morning': ("수입 대두로 만든 작은 포장 두부입니다. 대두 함유. 1개(140g)에 단백질 7g입니다(포장 표시).", [81]),
 'p_mk_silken_tofu140': ("국산 대두로 만든 연두부입니다. 대두 함유. 1개(140g)에 단백질 6g입니다(포장 표시).", [81]),
 'p_mk_lf_milk_orig': ("유당을 걸러 낸 유당분해우유(유당 0g)입니다. 우유 함유. 100ml에 칼슘 190mg입니다(포장 표시).", [81]),
 'p_mk_lf_milk_low': ("유당 0g의 저지방(지방 2%) 유당분해우유입니다. 우유 함유. 100ml에 지방 2g, 칼슘 190mg입니다(포장 표시).", [81]),
 'p_mk_soymilk999': ("원액두유 99.9%와 식염만 넣은 설탕 무첨가 두유입니다. 대두 함유. 1팩(190ml)에 당류 1.8g, 단백질 9g입니다(포장 표시).", [81]),
 'p_mk_soymilk_hp': ("분리대두단백을 더해 1팩(190ml)에 단백질 12g인 두유입니다. 단맛은 알룰로오스로 내고, 대두 함유입니다(포장 표시).", [81]),
 'p_mk_vegemil_a': ("설탕이 든 가공두유입니다(1팩 190ml에 당류 6g). 대두 함유. 비타민 D 3μg·칼슘 140mg이 들어 있습니다(포장 표시).", [81]),
 'p_mk_pocari500': ("1병(500ml)에 당류 29g, 나트륨 250mg인 이온음료입니다(포장 표시).", [81]),
 'p_mk_ottogi_rice': ("쌀 99.6%로 지은 즉석밥입니다. 1개(210g)에 305kcal입니다(포장 표시).", [81]),
 'p_mk_ottogi_sagol': ("사골엑기스로 만든 국물입니다. 쇠고기·대두·조개류(굴) 함유. 1봉(500g)에 나트륨 1,150mg입니다(포장 표시).", [81]),
}

# 가스 유발 성분(FODMAP): Monash 자료[20·21·51]
FOD9 = {
 'mk_hetbahn210': ('low', '쌀밥(쌀 제품은 저FODMAP)', [20]),
 'mk_hetbahn130': ('low', '쌀밥(쌀 제품은 저FODMAP)', [20]),
 'mk_ottogi_rice': ('low', '쌀밥(쌀 제품은 저FODMAP)', [20]),
 'mk_juk_beef': ('unk', '양파·마늘·파엑기스·표고버섯이 들어 있어 높을 수 있음', [20, 51]),
 'mk_juk_chicken': ('unk', '양파·마늘조미액·파엑기스·표고버섯이 들어 있어 높을 수 있음', [20, 51]),
 'mk_juk_mushveg': ('unk', '양파·파엑기스·버섯(표고·새송이)이 들어 있어 높을 수 있음', [20, 51]),
 'mk_sagol_bibigo': ('unk', '마늘착즙 원료가 들어 있어 높을 수 있음', [20, 51]),
 'mk_ottogi_sagol': ('unk', '마늘엑기스가 들어 있어 높을 수 있음', [20, 51]),
 'mk_seolleong_bibigo': ('unk', '야채우린액·소스의 원료를 확인하지 못함', [51]),
 'mk_tofu_morning': ('unk', '물기를 뺀 단단한 두부는 낮고 물기 많은 연두부는 높음. 이 두부는 그 중간이라 수치 미확인', [21]),
 'mk_silken_tofu140': ('high', '물기가 많은 연두부(올리고당)', [21]),
 'mk_lf_milk_orig': ('low', '락토프리 우유', [20]),
 'mk_lf_milk_low': ('low', '락토프리 우유', [20]),
 'mk_soymilk999': ('high', '통콩으로 만든 두유', [20]),
 'mk_soymilk_hp': ('high', '통콩으로 만든 두유(원액두유 93.5%)', [20]),
 'mk_vegemil_a': ('high', '통콩으로 만든 두유(원액두유 95%)', [20]),
 'mk_pocari500': ('unk', '기타과당(과당 시럽)이 들어 있음. 고과당 옥수수시럽은 고FODMAP', [20]),
}
