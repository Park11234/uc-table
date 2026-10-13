# 깃허브 저장소 대표 이미지(1280×640): Settings → General → Social preview에 올린다
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F='/usr/share/fonts/opentype/noto/NotoSansCJK-%s.ttc'
def font(w,s): return ImageFont.truetype(F%w,s,index=1)   # index 1 = KR
W,H=1280,640
im=Image.new('RGB',(W,H),(242,244,246)); d=ImageDraw.Draw(im)
# 왼쪽 글
icon=Image.open(os.path.join(ROOT,'public','icon-192.png')).convert('RGBA').resize((104,104),Image.LANCZOS)
im.paste(icon,(72,92),icon)
# 앱 이름 로고(UC TABLE, tools/brand.cjs가 만든 src/brand/logo.png)
logo=Image.open(os.path.join(ROOT,'src','brand','logo.png')).convert('RGBA'); lw=420; logo=logo.resize((lw,int(logo.height*lw/logo.width)),Image.LANCZOS)
im.paste(logo,(74,288-logo.height),logo)
d.text((74,330),'UC 식단 관리 도우미 · 궤양성 대장염 환자를 위한',font=font('Medium',30),fill=(91,101,115))
d.text((74,372),'"오늘 이거 먹어도 되나?" 근거와 함께',font=font('Bold',30),fill=(25,31,40))
chips=['음식 674종','근거 79건','점검 52개','오프라인']
x=74
for c in chips:
    f=font('Bold',22); tw=d.textlength(c,font=f)
    d.rounded_rectangle([x,452,x+tw+36,500],radius=24,fill=(233,240,254)); d.text((x+18,461),c,font=f,fill=(26,77,186)); x+=tw+50
d.text((74,548),'단일 HTML · 서버 없음 · Playwright · axe-core · Built with Claude',font=font('Regular',20),fill=(122,133,148))
# 오른쪽 휴대폰 화면 2장
def phone(path,w):
    s=Image.open(path).convert('RGB'); h=int(s.height*w/s.width); s=s.resize((w,h),Image.LANCZOS).crop((0,0,w,min(h,int(w*2.0))))
    m=Image.new('L',s.size,0); ImageDraw.Draw(m).rounded_rectangle([0,0,s.width-1,s.height-1],radius=28,fill=255)
    return s,m
for (p,x0,y0,w) in [('docs/screenshots/home.png',760,58,250),('docs/screenshots/detail.png',990,96,230)]:
    s,m=phone(os.path.join(ROOT,p),w)
    sh=Image.new('RGBA',(s.width+40,s.height+40),(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle([20,24,s.width+20,s.height+24],radius=30,fill=(20,28,40,70))
    sh=sh.filter(ImageFilter.GaussianBlur(10)); im.paste(sh,(x0-20,y0-20),sh)
    im.paste(s,(x0,y0),m)
out=os.path.join(ROOT,'docs','social-preview.png'); im.save(out,optimize=True); print(out, os.path.getsize(out)//1024,'KB')
