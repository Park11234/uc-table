import os
from PIL import Image, ImageDraw
OUT=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'public')+os.sep
BG=(36,98,230); W=(255,255,255)
def icon(size, maskable=False):
    S=size*4
    im=Image.new("RGBA",(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    if maskable:
        d.rectangle([0,0,S,S],fill=BG); pad=S*0.24
    else:
        d.rounded_rectangle([0,0,S-1,S-1],radius=int(S*0.22),fill=BG); pad=S*0.17
    w=S-2*pad; cx=S/2
    bw=w*0.92                      # 그릇 너비
    rimh=w*0.11                    # 테두리 두께
    rimy=pad+w*0.46                # 테두리 윗선
    # 그릇 몸통(반원) + 테두리(둥근 막대) — 겹쳐서 하나로 보이게
    d.pieslice([cx-bw*0.42,rimy+rimh-bw*0.33,cx+bw*0.42,rimy+rimh+bw*0.51],0,180,fill=W)
    d.rounded_rectangle([cx-bw/2,rimy,cx+bw/2,rimy+rimh],radius=rimh/2,fill=W)
    # 김(수증기): 물결 두 줄
    sw=max(3,int(w*0.075)); amp=w*0.075; h=w*0.30
    for dx in (-w*0.18, w*0.18):
        x=cx+dx; y0=rimy-w*0.10
        pts=[]
        n=24
        for i in range(n+1):
            t=i/n; y=y0-h*t
            import math
            pts.append((x+amp*math.sin(t*3.0+ (0 if dx<0 else 1.2)) - amp*math.sin(0 if dx<0 else 1.2), y))
        d.line(pts,fill=W,width=sw,joint="curve")
    return im.resize((size,size),Image.LANCZOS)
icon(192).save(OUT+'icon-192.png')
icon(512).save(OUT+'icon-512.png')
icon(512,True).save(OUT+'icon-512-maskable.png')
print("icons ok")
