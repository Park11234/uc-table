import os
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP=os.path.join(ROOT,'src','app','index.html')
BASE=os.path.join(ROOT,'src','app','app.base.html')
GEN=os.path.join(ROOT,'src','data','generated','gen_out.json')
MFDS=os.path.join(ROOT,'data','mfds')
import re, json
P=APP
s=open(P,encoding='utf-8').read()
def edit(fid, ms=None, add=(), why=None, refs=None):
    global s
    m=re.search(r'^ F\("'+fid+r'",.*$',s,re.M); assert m, fid
    line=m.group(0)
    # F(id,name,cat,[n],"fib",ms,[tags],cost,"prep","why",[refs])
    mm=re.match(r'^( F\("[^"]+","[^"]*","[^"]*",\[[^\]]*\],"\w",)(\d)(,\[)([^\]]*)(\],\d+,"(?:[^"\\]|\\.)*",")((?:[^"\\]|\\.)*)(",\[)([^\]]*)(\]\),?)$',line)
    assert mm, line[:120]
    g=list(mm.groups())
    if ms is not None: g[1]=str(ms)
    tags=[t.strip().strip('"') for t in g[3].split(',') if t.strip()]
    for t in add:
        if t not in tags: tags.append(t)
    g[3]=','.join(json.dumps(t,ensure_ascii=False) for t in tags)
    if why is not None: g[5]=why
    if refs is not None: g[7]=', '.join(map(str,refs))
    new=''.join(g)
    s=s.replace(line,new,1)
edit('spinach',ms=1,why="길병원 저잔사식에서 허용되는 채소예요. 데쳐 잘게 다지면 부드럽고, 철(1.79mg/100g)이 있어 IBD에서 흔한 철 결핍 보충에 보탬이 돼요.",refs=[39,32,13])
edit('eggplant',ms=1,why="길병원 저잔사식에서 허용되는 채소예요. FODMAP이 낮고, 섬유가 100g당 3.4g이라 껍질을 벗겨 푹 익혀 한 끼 35g 정도만 먹어요.",refs=[39,20])
edit('onion',ms=1,why="길병원 저잔사식에서 허용되는 채소지만, 프럭탄이 많아 궤양성 대장염 환자의 복통·팽만·가스·급박감을 악화시킬 수 있어 양념처럼 조금만 써요.",refs=[39,9,20])
edit('garlic',ms=2)
edit('cabbage',ms=2)
edit('peach',ms=1,why="길병원 저잔사식에서 황도·백도 1/2개 정도는 허용돼요. 다만 고FODMAP이라 가스·팽만이 있으면 피해요.",refs=[39,20])
edit('mandarin',ms=1,why="섬유가 100g당 1.6g으로 과일 중 적은 편이고 칼륨을 보충할 수 있어요. 길병원 저잔사식은 귤 소 2개까지 허용해요.",refs=[27,26,39])
edit('button_mushroom',ms=1,why="길병원 저잔사식에서 버섯 중 양송이만 허용돼요. 다만 섬유가 100g당 2.4g이고 FODMAP(만니톨)이 많아 가스를 늘릴 수 있어 얇게 썰어 푹 익혀 조금만 먹어요.",refs=[39,27,20])
edit('parmesan',ms=1,why="치즈는 길병원 저잔사식 허용 식품이에요. 경성 치즈라 FODMAP은 낮지만, 궤양성 대장염에서 줄이도록 권고되는 유지방(미리스트산)과 염분이 많아 조금만 써요.",refs=[39,20,3])
edit('feta',ms=1,why="치즈는 길병원 저잔사식 허용 식품이에요. FODMAP은 낮지만, 궤양성 대장염에서 줄이도록 권고되는 유지방이 많아 조금만 써요.",refs=[39,20,3])
edit('butter',ms=2)
edit('oatmeal',add=['gil'])
edit('orange',add=['citrus'],why="FODMAP이 낮은 과일로 관해 유지기에 과일 섭취를 늘리는 데 써요. 다만 오렌지·레몬은 증상 악화를 잘 일으키는 음식으로 안내돼 조금씩 시작해요.",refs=[20,39])
edit('lentil',add=['legume'])
edit('hummus',add=['legume'])
edit('nuts',add=['tough'],why="통견과는 질감이 거칠어 관해 유지기에 먹고, 호두는 FODMAP이 낮아요. 견과류는 관해기에도 증상을 일으키기 쉬운 음식으로 안내돼 조금씩 시작해요.",refs=[2,20,37])
edit('soda',add=['soda'])
edit('fried',add=['fried'])
edit('kimchi',add=['allium'])

def sub(a,b):
    global s
    assert s.count(a)==1, (s.count(a),a)
    s=s.replace(a,b,1)
# 별명 보완: 술 종류는 '술' 항목으로, '치킨'은 후라이드치킨 항목으로
sub('alcohol:["술","맥주","소주"]','alcohol:["술","맥주","소주","막걸리","와인","위스키","하이볼","칵테일","청주"]')
sub('fried:["튀김","치킨","패스트푸드"]','fried:["튀김","패스트푸드","감자튀김"]')
# 식약처 표의 기준량이 '100ml'로 적힌 고형 음식(흰쌀밥)은 100g으로 표기
sub('"D501-022000000-0001","쌀밥","100ml"','"D501-022000000-0001","쌀밥","100g"')

open(P,'w',encoding='utf-8').write(s)
print('ok')
