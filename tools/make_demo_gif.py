# 프레임(.test-out/gif/*.png)을 README용 GIF로 합친다. 파일 이름 끝 숫자 = 머무는 길이(×0.9초)
import glob, os
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fr=sorted(glob.glob(os.path.join(ROOT,'.test-out','gif','*.png')))
W=300
ims=[]; durs=[]
for f in fr:
    im=Image.open(f).convert('RGB'); h=round(im.height*W/im.width); im=im.resize((W,h),Image.LANCZOS)
    ims.append(im.quantize(colors=128,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE))
    durs.append(900*int(os.path.basename(f).split('_')[1].split('.')[0]))
out=os.path.join(ROOT,'docs','demo.gif')
ims[0].save(out,save_all=True,append_images=ims[1:],duration=durs,loop=0,optimize=True,disposal=1)
print(out, len(ims),'frames', os.path.getsize(out)//1024,'KB')
