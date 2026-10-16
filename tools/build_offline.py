# -*- coding: utf-8 -*-
"""오프라인 단일 파일(dist/)과 GitHub Pages용 PWA(public/)를 만든다.

v1.9.0
  - 웹 글꼴(구글 폰트)을 쓰지 않는다: 기기 글꼴로 디자인을 정해 웹·PWA·오프라인 파일이 같은 모양(D-12)
  - 그림 PDF 라이브러리(html2canvas·jsPDF, 약 563KB)는 처음에 실행하지 않는다(P-1)
      · 오프라인 단일 파일: 문서 끝에 <script type="text/plain" id="lib-…">로 넣어 두고 '그림 PDF 저장' 때 실행
      · PWA: public/vendor/에 따로 두고 그때 불러온다(서비스 워커가 미리 보관)
v1.10.0
  - 바코드 읽기 라이브러리(@zxing/library 0.21.3 UMD, 약 336KB)도 같은 방식(쓸 때만 실행)
  - PWA는 화면 뼈대(index.html: 글꼴·색·첫 화면 문구)와 앱 코드(app.js)를 나눈다(P-2).
    뼈대가 먼저 그려지고, 앱 코드는 따로 캐시되어 다음 방문에 다시 받지 않는다.
  - 시작 화면 바탕색은 어두운 중립색(W-8): 어두운 모드에서 흰 화면이 번쩍이지 않게
"""
import os, re, json, shutil, hashlib

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
<meta name="theme-color" content="#2462E6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#11161D" media="(prefers-color-scheme: dark)">
<meta name="description" content="궤양성 대장염 식단·증상 기록 앱(오프라인). 의료기기가 아니며 진단·치료를 하지 않습니다.">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="UC TABLE">
<title>%s</title>
''' % title


def single():
    """오프라인 단일 파일: 모든 것을 한 파일에. 그림 PDF 라이브러리는 실행하지 않는 형태로 끝에 둔다."""
    lib_tags = ''.join('<script type="text/plain" id="%s">%s</script>\n' % (lid, code) for lid, fn, code in libs)
    return (HEAD + '</head>\n<body>\n' + style + markup + scripts + '\n' + lib_tags + '</body>\n</html>\n')


def pwa(app_name):
    """PWA 뼈대: 글꼴·색·첫 화면 문구를 먼저 그리고, 앱 코드(app.js)는 defer로 받는다."""
    head = HEAD + ('<link rel="manifest" href="manifest.webmanifest"><link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">'
                   '<link rel="apple-touch-icon" href="apple-touch-icon.png">\n'
                   '<script>window.UC_VENDOR=1</script>\n'
                   '<script defer src="%s"></script>\n' % app_name)
    sw = ('<script>if("serviceWorker" in navigator){window.addEventListener("load",function(){'
          'navigator.serviceWorker.register("sw.js").catch(function(){})})}</script>\n')
    return head + '</head>\n<body>\n' + style + markup + sw + '</body>\n</html>\n'


os.makedirs(OUT, exist_ok=True)
single_path = os.path.join(OUT, 'uc-table-offline.html')
open(single_path, 'w', encoding='utf-8').write(single())

os.makedirs(PUB, exist_ok=True)
# 앱 코드: 내용 해시를 주소에 붙여(app.js?v=…) 새 버전이면 HTTP 캐시를 거치지 않는다
app_hash = hashlib.sha256(app_js.encode('utf-8')).hexdigest()[:10]
open(os.path.join(PUB, 'app.js'), 'w', encoding='utf-8').write(app_js)
index_html = pwa('app.js?v=' + app_hash)
open(os.path.join(PUB, 'index.html'), 'w', encoding='utf-8').write(index_html)
vd = os.path.join(PUB, 'vendor'); os.makedirs(vd, exist_ok=True)
for lid, fn, code in libs:
    open(os.path.join(vd, fn), 'w', encoding='utf-8').write(code)
    lic = os.path.join(VENDOR, fn.split('.')[0] + '.LICENSE')
    if os.path.exists(lic):
        shutil.copyfile(lic, os.path.join(vd, os.path.basename(lic)))

# 홈 화면 아이콘 아래 이름은 길면 잘리므로 짧은 이름을 따로 둔다
man = {"name": "UC TABLE", "short_name": "UC TABLE", "description": "궤양성 대장염 식단·증상 기록(UC 식단 관리 도우미). 의료기기가 아닙니다.",
       "start_url": "./index.html", "scope": "./", "display": "standalone", "orientation": "portrait",
       "background_color": "#1F242B", "theme_color": "#2462E6", "lang": "ko",
       "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
                 {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
                 {"src": "icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
open(os.path.join(PUB, 'manifest.webmanifest'), 'w', encoding='utf-8').write(json.dumps(man, ensure_ascii=False, indent=1))

# 캐시 이름: 미리 보관하는 파일 전체의 해시(어느 하나라도 바뀌면 새 캐시)
ASSETS = ["./", "./index.html", "./app.js?v=" + app_hash, "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
          "./icon-512-maskable.png", "./apple-touch-icon.png", "./privacy.html", "./accessibility.html"] + \
         ["./vendor/" + fn for lid, fn, code in libs]
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
    if(self.registration.showNotification) await self.registration.showNotification("UC TABLE",{body:last?days+"일째 증상 기록이 없습니다. 오늘 상태를 기록해 주십시오.":"증상 기록을 시작해 주십시오.",icon:"icon-192.png",badge:"icon-192.png",tag:"uc-log",lang:"ko"});
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
