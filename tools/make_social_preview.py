# 깃허브 저장소 대표 이미지(1280×640): Settings → General → Social preview에 올린다
# v1.12.0: 디자인 A '잔잔한 능선'·맑은 파랑으로 다시 그림. 글꼴은 앱 글꼴(src/brand/uc-table-sans.woff2, 가변 굵기)을 그대로 쓰고,
# 숫자는 문서 숫자 점검과 같은 곳(node tools/doc_numbers.cjs --list)에서 읽어 오래된 숫자가 남지 않게 한다.
#   python3 tools/make_social_preview.py        (먼저 node tools/make_screenshots.cjs로 화면 사진을 새로 찍어 둔다)
import os, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, 'src', 'brand', 'uc-table-sans.woff2')
BG, FIELD, INK, MUTED, SOFT, DEEP, BLUE = (234, 244, 248), (5, 59, 114), (11, 37, 64), (70, 96, 122), (220, 238, 247), (5, 59, 114), (11, 94, 150)   # v1.12.0 후속 디자인 '바다'


def font(weight, size):
    f = ImageFont.truetype(FONT, size)
    names = f.get_variation_names()
    f.set_variation_by_name(weight.encode() if names and isinstance(names[0], bytes) else weight)
    return f


def numbers():
    out = subprocess.run(['node', os.path.join(ROOT, 'tools', 'doc_numbers.cjs'), '--list'], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return dict(l.split(None, 1) for l in out.splitlines() if l.strip())


N = numbers()
W, H = 1280, 640
im = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(im)
# 오른쪽: 머리 띠와 같은 짙은 바다 파랑 판 위에 휴대폰 화면 2장
d.rounded_rectangle([700, 40, 1240, 600], radius=44, fill=FIELD)


def phone(path, w, h_max):
    s = Image.open(path).convert('RGB')
    h = int(s.height * w / s.width)
    s = s.resize((w, h), Image.LANCZOS).crop((0, 0, w, min(h, h_max)))
    m = Image.new('L', s.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, s.width - 1, s.height - 1], radius=26, fill=255)
    return s, m


for (p, x0, y0, w) in [('docs/screenshots/home.png', 736, 76, 236), ('docs/screenshots/detail.png', 978, 116, 226)]:
    s, m = phone(os.path.join(ROOT, p), w, 600 - y0 - 18)
    sh = Image.new('RGBA', (s.width + 40, s.height + 40), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([20, 24, s.width + 20, s.height + 24], radius=28, fill=(14, 44, 110, 60))
    sh = sh.filter(ImageFilter.GaussianBlur(10))
    im.paste(sh, (x0 - 20, y0 - 20), sh)
    im.paste(s, (x0, y0), m)
# 왼쪽: 아이콘·로고·한 줄 소개·숫자
icon = Image.open(os.path.join(ROOT, 'public', 'icon-192.png')).convert('RGBA').resize((104, 104), Image.LANCZOS)
im.paste(icon, (72, 76), icon)
logo = Image.open(os.path.join(ROOT, 'src', 'brand', 'logo.png')).convert('RGBA')
lw = 420
logo = logo.resize((lw, int(logo.height * lw / logo.width)), Image.LANCZOS)
im.paste(logo, (74, 278 - logo.height), logo)
d.text((74, 318), 'UC 식단 관리 도우미 · 궤양성 대장염 환자를 위한', font=font('Medium', 29), fill=MUTED)
d.text((74, 360), '"오늘 이거 먹어도 되나?" 근거와 함께', font=font('Bold', 32), fill=INK)
chips = ['음식 %s종' % N['foods'], '궁금한 점 %s문항' % N['qa'], '참고문헌 %s건' % N['refs']]
x, y = 74, 438
for c in chips:
    f = font('Bold', 22)
    tw = d.textlength(c, font=f)
    if x + tw + 36 > 680:
        x, y = 74, y + 60
    d.rounded_rectangle([x, y, x + tw + 36, y + 48], radius=24, fill=SOFT)
    d.text((x + 18, y + 9), c, font=f, fill=DEEP)
    x += tw + 50
foot, fs = '오프라인 · 단일 HTML · 서버 없음 · Playwright 점검 %s개 · Built with Claude' % N['pw'], 20
while d.textlength(foot, font=font('Regular', fs)) > 600:   # 오른쪽 판(x 700)과 겹치지 않게
    fs -= 1
d.text((74, 530), foot, font=font('Regular', fs), fill=MUTED)
out = os.path.join(ROOT, 'docs', 'social-preview.png')
im.save(out, optimize=True)
print(out, os.path.getsize(out) // 1024, 'KB')
