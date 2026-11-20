# -*- coding: utf-8 -*-
"""오프라인 단일 파일(dist/)과 GitHub Pages용 PWA(public/)를 만든다.

v1.9.0
  - 웹 글꼴(구글 폰트)을 쓰지 않는다: 기기 글꼴로 디자인을 정해 웹·PWA·오프라인 파일이 같은 모양(D-12)
  - 그림 PDF 라이브러리(html2canvas·jsPDF, 약 563KB)는 처음에 실행하지 않는다(P-1)
      · 오프라인 단일 파일: 문서 끝에 <script type="text/plain" id="lib-…">로 넣어 두고 '그림 PDF 저장' 때 실행
      · PWA: public/vendor/에 따로 두고 그때 불러온다(서비스 워커가 미리 보관)
v1.11.0
  - 앱 글꼴 'UC Table Sans'(Pretendard를 줄여 이름을 바꾼 것, OFL-1.1): 오프라인 단일 파일은 data URL 그대로,
    PWA는 public/fonts/uc-table-sans.woff2로 따로 두어 첫 화면(index.html)을 가볍게 하고 서비스 워커가 보관
v1.10.0
  - 바코드 읽기 라이브러리(@zxing/library 0.21.3 UMD, 약 336KB)도 같은 방식(쓸 때만 실행)
  - PWA는 화면 뼈대(index.html: 글꼴·색·첫 화면 문구)와 앱 코드(app.js)를 나눈다(P-2).
    뼈대가 먼저 그려지고, 앱 코드는 따로 캐시되어 다음 방문에 다시 받지 않는다.
  - 시작 화면 바탕색은 어두운 중립색(W-8): 어두운 모드에서 흰 화면이 번쩍이지 않게
"""
import os, re, json, shutil, hashlib, base64

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'app', 'index.html')     # 앱 원본(데이터를 넣은 것)
OUT = os.path.join(ROOT, 'dist')                        # 단일 파일 결과물
PUB = os.path.join(ROOT, 'public')                      # GitHub Pages로 배포하는 PWA
VENDOR = os.path.join(ROOT, 'vendor')
LIBS = [('lib-html2canvas', 'html2canvas.min.js'), ('lib-jspdf', 'jspdf.umd.min.js'),
        ('lib-zxing', 'zxing.min.js')]   # v1.10.0 바코드 읽기(@zxing/library 0.21.3, Apache-2.0): BarcodeDetector가 없는 아이폰 등에서만 그때 불러온다

s = open(SRC, encoding='utf-8').read()
assert 'fonts.googleapis' not in s and 'fonts.gstatic' not in s, '웹 글꼴 링크가 남아 있음'
assert '<script src=' not in s, '처음부터 실행하는 외부 스크립트가 남아 있음'
title = re.search(r'<title>(.*?)</title>', s).group(1)
s = s.replace('<title>%s</title>\n' % title, '', 1)

# 앱 원본 = <style>…</style> + 화면 뼈대 마크업 + <script>…</script> 여러 개
css_end = s.index('</style>') + len('</style>')
style = s[:css_end]
FONT_RE = re.compile(r'url\("data:font/woff2;base64,[A-Za-z0-9+/=]+"\)')
assert len(FONT_RE.findall(style)) == 1, '앱 글꼴(data URL)이 하나여야 함'
FONT_FILE = os.path.join(ROOT, 'src', 'brand', 'uc-table-sans.woff2')
rest = s[css_end:]
first_script = rest.index('<script>')
markup = rest[:first_script]
scripts = rest[first_script:]
assert scripts.strip().endswith('</script>')
js_parts = re.findall(r'<script>(.*?)</script>', scripts, flags=re.S)
# 스크립트 사이에 다른 마크업이 없어야 app.js로 옮겨도 화면이 같다
assert re.sub(r'<script>.*?</script>', '', scripts, flags=re.S).strip() == '', '스크립트 사이에 마크업이 있음'
app_js = '\n;\n'.join(js_parts)

libs = []
for lid, fn in LIBS:
    code = open(os.path.join(VENDOR, fn), encoding='utf-8').read()
    assert '</script' not in code.lower(), fn
    libs.append((lid, fn, code))

HEAD = '''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#053B72" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#070F36" media="(prefers-color-scheme: dark)">
<meta name="description" content="궤양성 대장염 식단·증상 기록 앱(오프라인). 의료기기가 아니며 진단·치료를 하지 않습니다.">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="UC TABLE">
<title>%s</title>
''' % title


def sha(code):
    return "'sha256-%s'" % base64.b64encode(hashlib.sha256(code.encode('utf-8')).digest()).decode()


def offline_csp():
    """오프라인 단일 파일(안드로이드 앱이 APK 안에 넣어 여는 파일이기도 하다)의 콘텐츠 보안 정책(2026-10-24).
    코드가 통째로 인라인이라 스크립트는 이 파일에 든 스크립트(앱 코드 + 쓸 때만 실행하는 라이브러리)의 해시만 허용하고,
    네트워크 연결은 막는다(이 파일은 서버와 통신하지 않는다). 해시는 빌드가 그때그때 계산하므로 코드를 바꿔도 손으로 고칠 것이 없다.
    HTML은 읽을 때 줄바꿈(CRLF)을 LF로 바꾸므로 윈도에서 줄바꿈이 바뀐 파일도 같은 해시가 된다."""
    hs = ' '.join([sha(c) for c in js_parts] + [sha(code) for lid, fn, code in libs])
    return ("default-src 'none'; script-src %s; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; "
            "connect-src 'none'; media-src blob:; worker-src 'none'; base-uri 'none'; form-action 'none'" % hs)


def single():
    """오프라인 단일 파일: 모든 것을 한 파일에. 그림 PDF 라이브러리는 실행하지 않는 형태로 끝에 둔다."""
    lib_tags = ''.join('<script type="text/plain" id="%s">%s</script>\n' % (lid, code) for lid, fn, code in libs)
    head = HEAD + '<meta http-equiv="Content-Security-Policy" content="%s">\n' % offline_csp()
    return (head + '</head>\n<body>\n' + style + markup + scripts + '\n' + lib_tags + '</body>\n</html>\n')


# 서비스 워커 등록 한 줄. 인라인이라 CSP에는 이 글자 그대로의 해시를 적는다(바꾸면 해시가 자동으로 같이 바뀐다)
SW_REG_JS = 'if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})})}'


def pwa_csp():
    """PWA(웹으로 여는 주소)의 콘텐츠 보안 정책. 스크립트는 같은 출처의 파일과 위 한 줄만 허용하고, 네트워크 연결(fetch·XHR·sendBeacon·WebSocket·EventSource)은
    같은 주소(GitHub 서버)까지 모두 막는다(2026-11-16 21차: 기록은 휴대폰에만. 앱 화면은 연결을 쓰지 않고, 앱 파일은 서비스 워커가 받는다).
    스타일은 화면 곳곳의 style 속성 때문에 인라인을 허용한다. 오프라인 단일 파일은 offline_csp()(스크립트 해시)를 쓴다."""
    h = base64.b64encode(hashlib.sha256(SW_REG_JS.encode('utf-8')).digest()).decode()
    return ("default-src 'none'; script-src 'self' 'sha256-%s'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
            "font-src 'self'; connect-src 'none'; manifest-src 'self'; worker-src 'self'; media-src 'self' blob:; "
            "base-uri 'none'; form-action 'none'" % h)


def pwa(app_name):
    """PWA 뼈대: 글꼴·색·첫 화면 문구를 먼저 그리고, 앱 코드(app.js)는 defer로 받는다."""
    head = HEAD + ('<meta http-equiv="Content-Security-Policy" content="%s">\n' % pwa_csp()) + ('<link rel="manifest" href="manifest.webmanifest"><link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">'
                   '<link rel="apple-touch-icon" href="apple-touch-icon.png">\n'
                   '<link rel="preload" href="fonts/uc-table-sans.woff2" as="font" type="font/woff2" crossorigin>\n'
                   '<script defer src="%s"></script>\n' % app_name)
    sw = '<script>' + SW_REG_JS + '</script>\n'
    return head + '</head>\n<body>\n' + FONT_RE.sub('url("fonts/uc-table-sans.woff2")', style) + markup + sw + '</body>\n</html>\n'


os.makedirs(OUT, exist_ok=True)
single_path = os.path.join(OUT, 'uc-table-offline.html')
open(single_path, 'w', encoding='utf-8').write(single())

os.makedirs(PUB, exist_ok=True)
# 앱 코드: 내용 해시를 주소에 붙여(app.js?v=…) 새 버전이면 HTTP 캐시를 거치지 않는다
app_hash = hashlib.sha256(app_js.encode('utf-8')).hexdigest()[:10]
open(os.path.join(PUB, 'app.js'), 'w', encoding='utf-8').write(app_js)
index_html = pwa('app.js?v=' + app_hash)
open(os.path.join(PUB, 'index.html'), 'w', encoding='utf-8').write(index_html)
fd = os.path.join(PUB, 'fonts'); os.makedirs(fd, exist_ok=True)
shutil.copyfile(FONT_FILE, os.path.join(fd, 'uc-table-sans.woff2'))
shutil.copyfile(os.path.join(ROOT, 'src', 'brand', 'Pretendard-OFL.txt'), os.path.join(fd, 'Pretendard-OFL.txt'))
vd = os.path.join(PUB, 'vendor'); os.makedirs(vd, exist_ok=True)
for lid, fn, code in libs:
    open(os.path.join(vd, fn), 'w', encoding='utf-8').write(code)
    lic = os.path.join(VENDOR, fn.split('.')[0] + '.LICENSE')
    if os.path.exists(lic):
        shutil.copyfile(lic, os.path.join(vd, os.path.basename(lic)))

# 홈 화면 아이콘 아래 이름은 길면 잘리므로 짧은 이름을 따로 둔다
# v1.11.0 A-12: 화면 방향을 고정하지 않는다(WCAG 1.3.4). W-1: id·분류·바로가기(증상 기록·음식 찾기)
# v1.12.0 검토 C-17: id는 표준대로 시작 주소의 출처를 기준으로 풀리므로 "./"는 사이트 맨 위(https://park11234.github.io/)가 된다.
#   id가 없던 예전 설치본의 정체(시작 주소 …/uc-table/index.html)와 같게 경로를 적는다
man = {"id": "/uc-table/index.html", "name": "UC TABLE", "short_name": "UC TABLE", "description": "궤양성 대장염 식단·증상 기록(UC 식단 관리 도우미). 의료기기가 아닙니다.",
       "start_url": "./index.html", "scope": "./", "display": "standalone", "categories": ["health", "medical", "food"],
       "shortcuts": [{"name": "오늘 증상 기록", "short_name": "증상 기록", "url": "./index.html?go=log"},
                     {"name": "음식 찾기", "short_name": "음식 찾기", "url": "./index.html?go=food"}],
       "background_color": "#070F36", "theme_color": "#053B72", "lang": "ko",
       "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
                 {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
                 {"src": "icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
open(os.path.join(PUB, 'manifest.webmanifest'), 'w', encoding='utf-8').write(json.dumps(man, ensure_ascii=False, indent=1))

# 캐시 이름: 미리 보관하는 파일 전체의 해시(어느 하나라도 바뀌면 새 캐시)
ASSETS = ["./", "./index.html", "./app.js?v=" + app_hash, "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
          "./icon-512-maskable.png", "./apple-touch-icon.png", "./privacy.html", "./accessibility.html", "./fonts/uc-table-sans.woff2"] + \
         ["./vendor/" + fn for lid, fn, code in libs if fn != 'zxing.min.js']   # v1.11.0 L8: 바코드 라이브러리(336KB)는 처음 쓸 때 받아 보관
hv = hashlib.sha256()
for a in ASSETS:
    f = a[2:].split('?')[0] or 'index.html'
    fp = os.path.join(PUB, f)
    hv.update(a.encode('utf-8'))
    if os.path.exists(fp):
        hv.update(open(fp, 'rb').read())
ver = hv.hexdigest()[:10]
sw = '''// 자동 생성 파일 — tools/build_offline.py
const CACHE="uc-table-%s";
const ASSETS=%s;
self.addEventListener("install",e=>{
  // HTTP 캐시를 건너뛰고 새로 받아야 옛 파일이 새 캐시에 들어가지 않는다
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("uc-table-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET") return;
  const url=new URL(req.url); if(url.origin!==location.origin) return;
  e.respondWith(caches.match(req).then(hit=>hit||caches.match(req,{ignoreSearch:true})).then(hit=>hit||fetch(req).then(res=>{
    if(res.ok){const cp=res.clone(); caches.open(CACHE).then(c=>c.put(req,cp))} return res;
  }).catch(()=>req.mode==="navigate"?caches.match("./index.html"):Response.error())));
});
/* v1.9.0 U-8: 기록 알림(사용자가 켠 경우만). 크롬에 설치한 앱에서 주기적 백그라운드 동기화가 허용되면
   하루에 한 번쯤 깨어나, 앱이 남겨 둔 마지막 증상 기록 날짜(Cache Storage의 ./__uc_status)가 3일 넘게 지났는지 본다.
   서버로 보내는 것은 없다(알림은 이 기기 안에서만 만든다). 보관 이름이 uc-table-로 시작하지 않아 앱을 갱신해도 지워지지 않는다. */
async function ucCheck(){
  try{
    const c=await caches.open("uc-remind-status"); const r=await c.match("./__uc_status"); if(!r) return;
    const st=await r.json(); if(!st||!st.on) return;
    const now=new Date(); const pad=n=>String(n).padStart(2,"0"); const today=now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(now.getDate());
    const last=st.last||""; const days=last?Math.floor((Date.parse(today)-Date.parse(last))/864e5):99;
    if(days<3||st.notified===today) return;
    st.notified=today; await c.put("./__uc_status",new Response(JSON.stringify(st),{headers:{"Content-Type":"application/json"}}));
    if(self.registration.showNotification) await self.registration.showNotification("UC TABLE",{body:last?days+"일째 증상 기록이 없습니다. 오늘 상태를 기록할 차례입니다.":"아직 증상 기록이 없습니다. 오늘 상태부터 기록할 수 있습니다.",icon:"icon-192.png",badge:"icon-192.png",tag:"uc-log",lang:"ko"});
    if(self.navigator&&self.navigator.setAppBadge) try{await self.navigator.setAppBadge(1)}catch(e){}
  }catch(e){}
}
self.addEventListener("periodicsync",e=>{if(e.tag==="uc-log-check") e.waitUntil(ucCheck())});
self.addEventListener("notificationclick",e=>{e.notification.close(); e.waitUntil(self.clients.matchAll({type:"window"}).then(cs=>cs.length?cs[0].focus():self.clients.openWindow("./index.html")))});
''' % (ver, json.dumps(ASSETS))
open(os.path.join(PUB, 'sw.js'), 'w', encoding='utf-8').write(sw)
print('single', single_path, os.path.getsize(single_path))
print('pwa   ', os.path.join(PUB, 'index.html'), os.path.getsize(os.path.join(PUB, 'index.html')),
      'app.js', os.path.getsize(os.path.join(PUB, 'app.js')))
