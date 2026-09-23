import os
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP=os.path.join(ROOT,'src','app','index.html')
BASE=os.path.join(ROOT,'src','app','app.base.html')
GEN=os.path.join(ROOT,'src','data','generated','gen_out.json')
MFDS=os.path.join(ROOT,'data','mfds')
import json, re, shutil, sys
P=APP
import os
if not os.path.exists(BASE): shutil.copy(P,BASE)
shutil.copy(BASE,P)
s=open(P,encoding='utf-8').read()
o=json.load(open(GEN,encoding='utf-8'))
js=lambda x: json.dumps(x,ensure_ascii=False,separators=(',',':'))
def once(old,new,cnt=1):
    global s
    n=s.count(old)
    assert n==cnt, (n,old[:80])
    s=s.replace(old,new)
# 1) 새 음식(검색용 목록) — 식단 생성 목록(planFoods)에서는 제외
lib='\n/* 검색·기록용 추가 음식(식약처 표준데이터 매칭). 식단 AI 목록에는 넣지 않음(lib) */\nconst LF=(id,name,cat,ms,tags,cost,prep,why,refs)=>Object.assign(F(id,name,cat,[0,0,0,0,0,0,0],"L",ms,tags,cost,prep,why,refs),{lib:true});\nFOODS.push(\n '+',\n '.join(o['foods'])+'\n);'
once('\n];\nconst MFDS={','\n];'+lib+'\nconst MFDS={')
# 2) MFDS
i=s.index('const MFDS={'); j=s.index('\n',i)
s=s[:j+1]+'Object.assign(MFDS,'+js(o['mfds'])+');\n'+s[j+1:]
# 3) EMO / FICON / FODI / SERV / ALIAS
once('for(const f of FOODS) f.emo=EMO[f.id]||','Object.assign(EMO,'+js(o['emo'])+');\nfor(const f of FOODS) f.emo=EMO[f.id]||')
once('const FODL=','Object.assign(FODI,'+js(o['fodi'])+');\nconst FODL=')
once('const FRACS=','Object.assign(SERV,'+js(o['serv'])+');\nconst FRACS=')
alias_fix='''// 새 음식이 생긴 별명은 원래 음식에서 뺌
ALIAS.rice_porridge=ALIAS.rice_porridge.filter(a=>a!=="미음"); ALIAS.brown_rice=["현미"]; ALIAS.somen=ALIAS.somen.filter(a=>a!=="잔치국수");
ALIAS.crab=ALIAS.crab.filter(a=>a!=="맛살"); ALIAS.coffee=ALIAS.coffee.filter(a=>a!=="라떼"); ALIAS.herbs=["허브","파슬리","레몬즙"];
ALIAS.white_fish=ALIAS.white_fish.filter(a=>!["가자미","동태"].includes(a)); ALIAS.pork=["돼지고기","돼지","돼지등심","수육"]; ALIAS.mushroom=["버섯"];
ALIAS.pasta=[...ALIAS.pasta,"마카로니"];
Object.assign(ALIAS,'''+js(o['alias'])+''');
'''
once('const CHO_L=',alias_fix+'const CHO_L=')
once('const TINT={','Object.assign(FICON,'+js(o['ficon'])+');\nconst TINT={')
once('"기타":"t-food"};','"기타":"t-food","요리":"t-food"};')
# 4) 음식 종류 칩
once('${["전체","곡류","단백질","유제품","채소","과일","지방","기타"].map(x=>`<button class="chip" data-act="cat"','${["전체","곡류","단백질","유제품","채소","과일","지방","요리","기타"].map(x=>`<button class="chip" data-act="cat"')
# 5) 과일 하루 양
cap=o['cap']
once('const FRUIT_CAP={banana:50,applesauce:100,peach:100,melon:100,mandarin:120};','const FRUIT_CAP={banana:50,applesauce:100,peach:100,melon:100,mandarin:120,'+','.join(f'{k}:{v}' for k,v in cap.items())+'};')
open(P,'w',encoding='utf-8').write(s)
print('ok',len(s))
