# -*- coding: utf-8 -*-
"""앱 글꼴 만들기(v1.11.0 디자인): Pretendard 가변 글꼴(SIL OFL 1.1)을 앱이 쓰는 글자만 남겨 줄이고 이름을 바꾼다.

- 남기는 글자: 앱 원본(src/app/app.src.html)·생성 데이터(src/data/generated/gen_out.json)·데이터 코드(src/data/*.py)에 나오는 모든 글자
  + KS X 1001 한글 2,350자(사용자가 적는 메모·음식 이름) + 기본 라틴·숫자·문장 부호
- OFL의 '예약 글꼴 이름' 조항에 따라, 줄인(바꾼) 글꼴은 'Pretendard' 이름을 쓰지 않고 'UC Table Sans'로 바꾼다.
  원저작권·라이선스 고지는 src/brand/Pretendard-OFL.txt와 앱의 '앱 정보'에 있다.
- 원본 글꼴은 저장소에 넣지 않는다(약 2MB). npm 패키지 pretendard@1.3.9의 dist/web/variable/woff2/PretendardVariable.woff2

  python3 tools/font_subset.py <PretendardVariable.woff2 경로>    # → src/brand/uc-table-sans.woff2
필요: pip install fonttools brotli
"""
import glob, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'brand', 'uc-table-sans.woff2')
NAME = 'UC Table Sans'


def ksx1001_hangul():
    out = []
    for hi in range(0xB0, 0xC9):
        for lo in range(0xA1, 0xFF):
            try:
                out.append(bytes([hi, lo]).decode('euc-kr'))
            except UnicodeDecodeError:
                pass
    return ''.join(ch for ch in out if '가' <= ch <= '힣')


def app_chars():
    files = [os.path.join(ROOT, 'src', 'app', 'app.src.html'), os.path.join(ROOT, 'src', 'data', 'generated', 'gen_out.json')]
    files += sorted(glob.glob(os.path.join(ROOT, 'src', 'data', '*.py')))
    s = set()
    for fn in files:
        with open(fn, encoding='utf-8') as f:
            t = f.read()
        if fn.endswith('.json'):
            t = json.dumps(json.loads(t), ensure_ascii=False)
        s.update(t)
    return s


def chars():
    base = set(chr(c) for c in range(0x20, 0x7F))
    base.update('·…–—‘’“”「」『』〈〉《》※★☆○●◎◇◆□■△▲▽▼→←↑↓↔×÷±≤≥≠°℃㎎㎏㎖㎗ℓμ‰%½¼¾①②③④⑤⑥⑦⑧⑨⑩ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㄲㄸㅃㅆㅉㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣㅐㅒㅔㅖㅘㅙㅚㅝㅞㅟㅢ')
    s = app_chars() | set(ksx1001_hangul()) | base
    return ''.join(sorted(ch for ch in s if ch.isprintable() and ord(ch) >= 0x20 and not (0xD800 <= ord(ch) <= 0xDFFF)))


def rename(font):
    nt = font['name']
    for rec in list(nt.names):
        if rec.nameID in (1, 4, 16, 21):
            rec.string = NAME
        elif rec.nameID in (6, 20):
            rec.string = NAME.replace(' ', '') + '-Variable'
        elif rec.nameID == 3:
            rec.string = NAME + ' (Pretendard 1.3.9 subset)'
        elif rec.nameID == 25:
            rec.string = NAME.replace(' ', '')
    if 'STAT' in font:
        pass   # 굵기 이름(Regular 등)은 그대로


def main(src):
    from fontTools import subset
    from fontTools.ttLib import TTFont
    text = chars()
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    opts.name_languages = ['*']
    opts.notdef_outline = True
    font = TTFont(src)
    sub = subset.Subsetter(options=opts)
    sub.populate(text=text)
    sub.subset(font)
    rename(font)
    font.flavor = 'woff2'
    font.save(OUT)
    print('글자', len(text), '→', OUT, os.path.getsize(OUT), 'bytes')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
