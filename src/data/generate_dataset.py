import os
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP=os.path.join(ROOT,'src','app','index.html')
BASE=os.path.join(ROOT,'src','app','app.base.html')
GEN=os.path.join(ROOT,'src','data','generated','gen_out.json')
MFDS=os.path.join(ROOT,'data','mfds')
import json, sys, re
import pandas as pd
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from spec1 import G; from spec2 import P; from spec3 import DY,V; from spec4 import FR,FAT,ETC; from spec5 import DS; from spec6 import EX
from templates import T
T=dict(T)
# ---- 템플릿 보정 ----
T['fish_white']=("흰살생선은 급성기에도 권장되는 지방이 적은 단백질 반찬이에요. 껍질을 벗기고 굽거나 쪄요.",[39,37])
T['fish_mid']=("흰살생선이지만 지방이 100g당 7g 정도로 많은 편이라, 활동기에는 동태·가자미 같은 담백한 생선이 더 나아요.",[27,39])
T['jjajang']=("춘장 소스가 짜고, 볶을 때 기름을 써요. 싱겁게 조금만 드세요.",[39])
T['sour']=("시거나 맵고 짠 음식은 증상 악화를 잘 일으키는 음식으로 안내돼요. 아주 조금만 써요.",[39])
T['grapefruit_drug']=("자몽은 일부 약과 상호작용할 수 있어 복용 중인 약이 있으면 약사에게 확인해요.",[])
T.pop('chamomile',None)
# 단계 문구가 음식의 시작 단계와 어긋나지 않게 단계 표현을 뺀 문장
T['buckwheat']=("메밀은 알레르기 표시 대상이에요. 메밀면은 저잔사식 허용 목록에 없어요.",[28,39])
T['jeon']=("부침은 기름을 흡수해 지방이 많아져요. 기름진 음식은 증상 악화 음식으로 안내돼 소량만 드세요.",[39])
T['veg_unlisted']=("저잔사식 허용 목록에 없는 채소라 증상이 나아진 뒤 푹 익혀 잘게 썰어 조금씩 드세요.",[39,2])
T['poultry_lean']=("껍질·기름을 뗀 가금류 살코기는 기름이 적어 저잔사식에서 허용되는 단백질이에요.",[39])
T['soymilk']=("두유는 저잔사식 허용 식품이에요. 통콩으로 만든 두유는 가스 유발 성분(FODMAP)이 많아 불편하면 줄여요.",[39,20])
T['squash']=("호박류는 푹 익히면 부드러워 악화기에도 권장되는 채소예요. 껍질·씨를 빼고 한 끼 35g 정도만 드세요.",[33,39])
T['allium']=("양파·리크 같은 파속 채소는 가스 유발 성분(FODMAP)이 많은 편이라, 파·부추·달래도 가스가 늘면 양을 줄여요.",[20])
T['bread_fat']=("버터가 많은 빵·과자는 기름진 음식이라 소량만 드세요. 길병원은 과도한 지방(튀김·빵·라면)을 피할 음식으로 안내해요.",[39,3])
T['dairy_ok']=("유제품은 저잔사식 허용 식품이고, 질병을 악화시킨다는 근거가 없어요. 불편하면 락토프리 제품을 써요.",[39,37])
T['veg_raw']=("생채소는 활동기에 피하고, 증상이 나아진 뒤 잘게 썰어 조금씩 늘려요.",[37,13])
T['nuts']=("견과·씨앗은 저잔사식에서 제한되고, 관해기에도 증상을 일으키기 쉬운 음식으로 안내돼요. 처음엔 곱게 갈아 소량만 드세요.",[39,37,43])
T['cheese_processed']=("가공치즈는 유화제 같은 첨가물이 들어간 가공식품이라 자연치즈를 먼저 골라요.",[3,2])
T['cracker']=("크래커는 섬유가 적은 정제 밀가루 과자지만, 짜고 기름진 초가공식품이라 소량만 드세요.",[2])
L=[list(x) for x in G+P+DY+V+FR+FAT+ETC+DS+EX]
IDX={x[0]:x for x in L}
# ---- 음식별 보정(근거 검토 결과) ----
def add(i,*tags):
    for t in tags:
        if t not in IDX[i][5]: IDX[i][5].append(t)
def rm(i,*tags): IDX[i][5]=[t for t in IDX[i][5] if t not in tags]
def ms(i,v): IDX[i][4]=v
def tpl(i,*k): IDX[i][9]=list(k)
def src(i,s): IDX[i][3]=s
def prep(i,s): IDX[i][12]=s
def alias(i,a): IDX[i][7]=a
def name(i,n): IDX[i][1]=n
add('gimbap','pickled','upf2'); add('curry_rice','soy','dairy'); add('rabokki','fish'); prep('tteokbokki','어묵은 빼기')
for i in ['red_bean_porridge','kongguksu','red_bean_bread','patbingsu','black_soybean','kidney_bean','green_pea','red_bean','soybean_braised','bean_rice','ogokbap','mungbean_jeon','yanggaeng']: add(i,'legume')
ms('mixed_grain_rice',3); ms('barley_misugaru',2); add('jjamppong','shell')
for i,s in [('castella','D:카스텔라'),('dinner_roll','D:모닝빵'),('bagel','D:베이글'),('croissant','D:크로와상'),('muffin','D:머핀'),('donut','D:도넛_링도넛'),('yakgwa','D:약과'),('popcorn','D:팝콘')]: src(i,s)
src('zucchini_jeon','D:애호박전'); name('dried_banana','말린 바나나'); alias('dried_banana',['말린바나나','건바나나'])
ms('carrot_raw',3)
add('hairtail','fatty'); tpl('hairtail','fish_mid')
for i in ['beef_brisket','rolled_omelet','pan_tofu','bulgogi']: add(i,'fatty')
for i in ['nakji','octopus']: add(i,'squid')
for i in ['almond','peanut','pine_nut','pistachio','sunflower_seed','pumpkin_seed','sesame_seed','flaxseed','chia','ginkgo','popcorn']: add(i,'tough')
prep('ginkgo','한 번에 몇 알만')
rm('chamomile','fodmap'); tpl('chamomile','tea_mild')
for i in ['milk_chocolate','dark_chocolate']: ms(i,9); add(i,'choco')
add('margarine','marg')
ms('orange_juice',1); rm('orange_juice','sour'); add('orange_juice','citrus','juice'); add('apple_juice','juice')
for i in ['lemon','grapefruit','yuzu_tea']: rm(i,'sour'); add(i,'citrus')
tpl('grapefruit','citrus','grapefruit_drug'); prep('grapefruit','복용 약이 있으면 약사에게 확인')
tpl('vinegar','sour')
add('zucchini_stirfry','shrimp')
for i in ['kimchi_fried_rice','kimchi_jjigae','kimchi_jeon','tofu_kimchi','chonggak','yeolmu_kimchi','gat_kimchi','pa_kimchi','oi_sobagi','baek_kimchi']: add(i,'shrimp')
for i in ['bulgogi','galbijjim','pork_galbijjim','jangjorim_beef','jangjorim_quail','gamja_jorim','braised_tofu','japchae','jjimdak','lotus_jorim','burdock_jorim','soybean_braised','yubu_chobap','ssamjang']: add(i,'wheat')
add('hamburger','tomato')
prep('miyeok_guk','미역은 잘게 썰어 푹 끓이기'); prep('beansprout_soup','')
# 지방 태그는 식약처 지방 값과 맞춤(100g당 10g 이상은 fatty, 5g 미만은 fatty 빼기)
for i in ['castella','veg_sandwich','scrambled_egg','sliced_cheese']: add(i,'fatty')
for i in ['curry_rice','jjajang_rice','jjajangmyeon','chunjang','pine_porridge','galbitang','japchae','kimchi_jeon','mungbean_jeon']: rm(i,'fatty')
tpl('galbitang','soup_bone'); add('smoked_salmon','oily')
# 채소 반찬은 채소와 같은 한 끼 양(35g) 규칙
for i in ['spinach_namul','beansprout_muchim','mung_namul','radish_saengchae','cucumber_muchim','gosari_namul','eggplant_namul','zucchini_stirfry','mushroom_stirfry','miyeok_stem','lotus_jorim','burdock_jorim']: add(i,'veg')
# 양파·마늘·파 양념(가스가 심할 때 주의)
ALLIUM=['veg_fried_rice','kimchi_fried_rice','bibimbap','omurice','curry_rice','jjajang_rice','jjajangmyeon','jjamppong','spaghetti_tomato','tteokbokki','rabokki',
 'steamed_mandu','fried_mandu','mandu_guk','tteok_mandu_guk','tteokguk','janchi_guksu','kalguksu','udon','kkakdugi','baek_kimchi','dongchimi','nabak_kimchi',
 'yeolmu_kimchi','chonggak','gat_kimchi','pa_kimchi','oi_sobagi','green_onion','scallion','chive','dallae','braised_tofu','rolled_omelet']
ALLIUM+= [x[0] for x in L if x[2]=='요리' and x[0] not in ('egg_soup','bone_broth','sundae','hotdog','grilled_saury','grilled_sp_mackerel')]
for i in ALLIUM:
    add(i,'allium')
# 별명 정리
alias('cherry_tomato',[a for a in IDX['cherry_tomato'][7] if a!='토마토'])
alias('carrot_raw',[a for a in IDX['carrot_raw'][7] if a!='당근'])
alias('smoked_salmon',[a for a in IDX['smoked_salmon'][7] if a!='연어'])
# 다른 음식을 가리키는 별명 빼기(과메기=날것, 쥐포=쥐치, 천엽=양, 밀크티=우유 등)
for i,bad in [('ogokbap','찰밥'),('rice_cereal','콘플레이크'),('bibim_guksu','골뱅이국수'),('saury','과메기'),('paprika','피망'),('beef_liver','천엽'),('black_tea','밀크티'),('solomon_tea','옥수수차'),('solomon_tea','곡물차'),('fish_jeon','전'),('squid_strips','쥐포')]:
    assert bad in IDX[i][7], (i,bad)
    alias(i,[a for a in IDX[i][7] if a!=bad])
add('pudding','lactose')
# 점검 결과 보정: 알레르기 태그 누락·다른 음식을 가리키는 별명
add('gimbap','fish'); add('oyster_sauce','wheat'); add('gochujang','soy'); add('soybean_oil','soy')
add('raisin','sulfite'); add('dried_persimmon','sulfite')
for i,bad in [('donkatsu','치즈돈가스'),('yukgaejang','닭개장'),('squid_stirfry','오삼불고기')]:
    assert bad in IDX[i][7], (i,bad)
    alias(i,[a for a in IDX[i][7] if a!=bad])
tpl('black_soy_milk','soymilk'); tpl('old_pumpkin','squash'); tpl('crackers','cracker'); tpl('beef_brisket','meat_fat')
ms('duck_lean',1); alias('duck_lean',[a for a in IDX['duck_lean'][7] if a!='훈제오리'])
ms('cream_cheese',1); ms('kongguksu',3); tpl('dotori_muk','spicy'); tpl('apricot','fruit_unlisted')
for x in L: x[5]=[t for t in x[5] if t!='fodmap']   # FODMAP 태그는 FODI에서만 정함
# ---- FODMAP: Monash 식품표(REF 20) 등 확인된 것만 ----
SEA=('low','양념하지 않은 해산물',[20]); MEAT=('low','양념하지 않은 고기',[20]); POUL=('low','양념하지 않은 가금류',[20])
FOD={}
for i in ['glutinous_rice','black_rice','rice_gruel','jeolpyeon']: FOD[i]=('low','쌀 제품군 기준',[20])
FOD['rice_noodle_soup']=('low','쌀국수 면 기준',[20])
for i in ['dinner_roll','baguette','bagel','croissant','veg_sandwich','hamburger','pizza']: FOD[i]=('high','밀 빵',[20])
FOD['castella']=('high','밀가루',[20]); FOD['muffin']=('high','밀가루',[20]); FOD['rye_bread']=('high','호밀·밀 빵',[20]); FOD['red_bean_bread']=('high','밀 빵·팥',[20])
for i in ['crackers','butter_cookie']: FOD[i]=('high','밀 과자류',[20])
for i in ['janchi_guksu','kalguksu','udon','bibim_guksu','jjajangmyeon','jjamppong','spaghetti_tomato']: FOD[i]=('high','밀 면',[24])
FOD['barley_rice']=('unk','보리 빵은 고FODMAP(보리밥 수치는 미확인)',[20]); FOD['barley_misugaru']=('unk','보리 빵은 고FODMAP(미숫가루 수치는 미확인)',[20])
for i in ['lowfat_milk','calcium_milk','strawberry_milk','choco_milk','banana_milk','coffee_milk','cafe_latte']: FOD[i]=('high','우유(유당)',[20])
for i in ['yogurt_plain_unsw','drink_yogurt','strawberry_yogurt']: FOD[i]=('high','요거트(유당)',[20])
FOD['ice_cream']=('high','아이스크림(유당)',[20]); FOD['pudding']=('high','우유 푸딩·커스터드류',[20]); FOD['patbingsu']=('high','연유·팥',[20])
FOD['cheddar']=('low','경성 치즈',[20]); FOD['goat_milk']=('high','우유처럼 유당이 있음',[20])
FOD['black_soy_milk']=('high','통콩으로 만든 두유',[20])
for i in ['black_soybean','kidney_bean','red_bean','soybean_braised','mungbean_jeon','yanggaeng','red_bean_porridge']: FOD[i]=('high','콩류',[20])
FOD['green_pea']=('high','완두콩',[20]); FOD['kongguksu']=('high','콩물·밀 면',[20,24])
for i in ['bean_rice','ogokbap']: FOD[i]=('unk','섞은 콩류는 대부분 고FODMAP',[20])
FOD['bok_choy']=('low','청경채',[20]); FOD['romaine']=('low','상추류',[20]); FOD['red_lettuce']=('low','상추류',[20]); FOD['green_pepper']=('low','초록 피망',[20])
FOD['paprika']=('high','빨강 파프리카',[20]); FOD['carrot_raw']=('low','당근',[20]); FOD['asparagus']=('high','아스파라거스',[20]); FOD['cauliflower']=('high','콜리플라워',[20])
for i in ['oyster_mushroom','shiitake','king_oyster','enoki','wood_ear','mushroom_stirfry']: FOD[i]=('high','버섯류',[20])
FOD['potato_jeon']=('low','감자',[20])
for i in ['potato_stirfry','gamja_jorim','potato_soup']: FOD[i]=('unk','감자는 낮지만 양파·마늘을 넣으면 높아질 수 있음',[20])
for i in ['green_onion','scallion','chive','dallae']: FOD[i]=('unk','파속 채소(양파·리크는 고FODMAP)',[20])
for i,n in [('apple','사과'),('pear','배'),('watermelon','수박'),('apple_juice','사과주스'),('nectarine','천도복숭아'),('plum','자두'),('mango','망고'),('cherry','체리'),('canned_peach','복숭아')]: FOD[i]=('high',n,[20])
for i in ['raisin','jujube','dried_persimmon','dried_banana']: FOD[i]=('high','말린 과일',[20])
FOD['pineapple']=('low','파인애플',[20]); FOD['strawberry']=('low','딸기',[20])
FOD['peanut']=('low','땅콩',[20]); FOD['pistachio']=('high','피스타치오',[20]); FOD['pumpkin_seed']=('low','호박씨',[20])
for i in ['canola_oil','grapeseed_oil','soybean_oil','rice_bran_oil']: FOD[i]=('low','기름은 탄수화물이 없음',[23])
FOD['sugar']=('low','설탕',[20]); FOD['dark_chocolate']=('low','다크초콜릿',[20]); FOD['salt']=('low','탄수화물이 없음',[])
FOD['oligosaccharide']=('unk','프락토올리고당 제품이면 높음',[])
for i in ['pollack','flatfish','halibut','croaker','hairtail','rockfish','spanish_mackerel','saury','tuna_sashimi','canned_tuna','smoked_salmon','eel','squid','nakji','octopus','oyster','clam','mussel','abalone','scallop','blue_crab','snow_crab']: FOD[i]=SEA
for i in ['beef_tenderloin','beef_sirloin','beef_brisket','beef_shank','beef_ribs','chadol','pork_tenderloin','pork_shoulder','pork_neck','pork_belly','beef_liver']: FOD[i]=MEAT
for i in ['chicken_thigh','chicken_wing','duck_lean','duck_skin']: FOD[i]=POUL
FOD['quail_egg']=('low','달걀류',[20]); FOD['rolled_omelet']=('low','달걀 기준(파를 넣으면 달라짐)',[20]); FOD['scrambled_egg']=('unk','달걀은 낮지만 우유를 넣으면 유당이 더해짐',[20])
FOD['pan_tofu']=('low','단단한 두부',[21])
for i in ['bulgogi','galbijjim','pork_galbijjim','jeyuk','dakgalbi','dakbokkeumtang','jjimdak','tteokgalbi','hamburg_steak','jangjorim_beef','squid_stirfry']: FOD[i]=('unk','양념에 양파·마늘이 들어가면 높을 수 있음',[20])
for x in L:
    if x[0] not in FOD and 'allium' in x[5]: FOD[x[0]]=('unk','양파·마늘·파 양념에 따라 높을 수 있음',[20])
# ---- 과일 하루 양(길병원 저잔사식) ----
CAP={'apple':100,'pear':100,'grape':80,'watermelon':150,'canned_peach':100,'hallabong':120}
# ---- 식약처 자료 선택: 음식(D)은 계열 사이 식이섬유 중앙값 행 ----
raw=pd.read_csv(os.path.join(MFDS,'raw.csv'),dtype=str)
dish=pd.read_csv(os.path.join(MFDS,'dish.csv'),dtype=str); dish=dish[~dish['식품코드'].str.startswith('D2')]
prepdb=pd.read_csv(os.path.join(MFDS,'prep.csv'),dtype=str).rename(columns={'가공식품품목명':'식품명','영양성분기준용량':'영양성분함량기준량'})
DB={'R':raw,'D':dish,'P':prepdb}
PRI={'D1':0,'D3':1,'D5':2,'D4':3,'D6':4,'D7':5}
def num(v):
    v=str(v).strip()
    if v in ('','-','nan','NaN','None'): return None
    try: return float(v)
    except: return None
COLS=['에너지(kcal)','단백질(g)','지방(g)','탄수화물(g)','식이섬유(g)','칼슘(mg)','철(mg)']
# 분석값(D1>D3) 우선. 재료에 비해 식이섬유 분석값이 지나치게 높은 경우만 다른 계열 사용
EXC={'scrambled_egg':'D309-433000000-0001','beef_suyuk':'D407-335130000-0001','jokbal':'D307-344000000-0001','grilled_sp_mackerel':'D508-383000000-0001','myeolchi_bokkeum':'D510-472000000-0001','bulgogi':'D308-386000000-0001','radish_saengchae':'D514-627000000-0001','mixed_grain_rice':'D401-032000000-0001','pajeon':'D709-441000000-0001','bibim_guksu':'D303-157000000-0002'}
MF={}; notes=[]; dup=[]
for x in L:
    db,nm=x[3].split(':',1); df=DB[db]; m=df[df['식품명']==nm]
    assert len(m), x[0]
    rows=[r for _,r in m.iterrows()]
    if db=='D':
        rows.sort(key=lambda r: (PRI.get(r['식품코드'][:2],9),r['식품코드']))
        wf=[r for r in rows if num(r['식이섬유(g)']) is not None]
        ser=[r['식품코드'][:2] for r in rows]
        if len(ser)!=len(set(ser)): dup.append((x[0],[(r['식품코드'],r['식이섬유(g)']) for r in rows]))
        if x[0] in EXC:
            r=[q for q in rows if q['식품코드']==EXC[x[0]]][0]
            notes.append((x[0],rows[0]['식품코드'][:2]+':'+str(rows[0]['식이섬유(g)']),'->',r['식품코드'][:2]+':'+str(r['식이섬유(g)'])))
        else: r=(wf or rows)[0]
    else:
        wf=[r for r in rows if num(r['식이섬유(g)']) is not None]; r=(wf or rows)[0]
    vals=[num(r[c]) for c in COLS]
    vals=[None if v is None else (int(v) if float(v).is_integer() and c=='에너지(kcal)' else round(v,2)) for v,c in zip(vals,COLS)]
    MF[x[0]]=vals+[db,r['식품코드'],r['식품명'],r['영양성분함량기준량'],num(r['칼륨(mg)'])]
# ---- 근거 문장 ----
def why(x):
    sents=[]; refs=[]
    for k in x[9]:
        s,rf=T[k]
        if '{cap}' in s: s=s.replace('{cap}',str(CAP.get(x[0],x[11] or 100)))
        if s not in sents: sents.append(s)
        for r in rf:
            if r not in refs: refs.append(r)
    return ' '.join(sents), refs
FICAT={'곡류':'f_bowl','단백질':'f_meat','유제품':'f_bottle','채소':'f_leaf','과일':'f_fruit','지방':'f_drop','기타':'f_plate','요리':'f_bowl'}
js=lambda o: json.dumps(o,ensure_ascii=False,separators=(',',':'))
out={'foods':[],'mfds':{},'emo':{},'ficon':{},'fodi':{},'serv':{},'alias':{},'cap':CAP}
for x in L:
    i,nm,cat,_,msv,tags,serv,al,emo,tk,_f,_c,pr,cost=x
    w,refs=why(x)
    out['foods'].append(f'LF({js(i)},{js(nm)},{js(cat)},{msv},{js(tags)},{cost},{js(pr)},{js(w)},{js(refs)})')
    mf=list(MF[i])
    # 식약처 표의 기준량이 고형 음식에도 '100ml'로 적힌 경우가 있어, 마시는 음식이 아니면 100g으로 표기
    if isinstance(mf[10],str) and 'ml' in mf[10] and serv[1] not in ('잔','컵','캔','병','팩','그릇'):
        mf[10]=mf[10].replace('ml','g')
    out['mfds'][i]=mf
    if emo: out['emo'][i]=emo
    else: out['ficon'][i]=FICAT[cat]
    if i in FOD: out['fodi'][i]=list(FOD[i])
    out['serv'][i]=serv
    out['alias'][i]=al
json.dump(out,open(GEN,'w'),ensure_ascii=False)
print('foods',len(out['foods']),'fodi',len(out['fodi']),'emo',len(out['emo']),'ficon',len(out['ficon']))
print('exceptions',len(notes)); print('dup series',dup)
for n in notes: print(' ',*n)
