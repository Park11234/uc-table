# -*- coding: utf-8 -*-
import os, re, json, shutil, zipfile
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'src','app','index.html')     # 아티팩트용 원본(CDN 링크 사용)
OUT=os.path.join(ROOT,'dist')                        # 단일 파일 결과물
PUB=os.path.join(ROOT,'public')                      # GitHub Pages로 배포하는 PWA
LIB_H=os.path.join(ROOT,'vendor','html2canvas.min.js')
LIB_J=os.path.join(ROOT,'vendor','jspdf.umd.min.js')
s=open(SRC,encoding='utf-8').read()
# 외부 자원(구글 폰트·CDN 스크립트) 제거
drop=[
 '<link rel="preconnect" href="https://fonts.googleapis.com">',
 '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
 '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=Noto+Sans+KR:wght@400;500;700;800&display=swap">',
 '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>',
 '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>',
]
for d in drop:
    assert s.count(d)==1, d[:60]
    s=s.replace(d+'\n','',1) if (d+'\n') in s else s.replace(d,'',1)
assert 'cdnjs' not in s and 'fonts.googleapis' not in s
title=re.search(r'<title>(.*?)</title>',s).group(1)
s=s.replace('<title>%s</title>\n'%title,'',1)
h2c=open(LIB_H,encoding='utf-8').read()
jpd=open(LIB_J,encoding='utf-8').read()
def doc(body, pwa=False):
    head=f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#2462E6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#11161D" media="(prefers-color-scheme: dark)">
<meta name="description" content="궤양성 대장염 식단·증상 기록 앱(오프라인)">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="UC TABLE">
<title>{title}</title>
{'<link rel="manifest" href="manifest.webmanifest"><link rel="icon" type="image/png" sizes="192x192" href="icon-192.png"><link rel="apple-touch-icon" href="apple-touch-icon.png">' if pwa else ''}
<script>{h2c}</script>
<script>{jpd}</script>
</head>
<body>
'''
    tail='\n</body>\n</html>\n'
    if pwa:
        tail=('\n<script>if("serviceWorker" in navigator){window.addEventListener("load",function(){'
              'navigator.serviceWorker.register("sw.js").catch(function(){})})}</script>'+tail)
    return head+body+tail
os.makedirs(OUT,exist_ok=True)
single=os.path.join(OUT,'uc-table-offline.html')
open(single,'w',encoding='utf-8').write(doc(s,False))
pwa=PUB; os.makedirs(pwa,exist_ok=True)
open(os.path.join(pwa,'index.html'),'w',encoding='utf-8').write(doc(s,True))
# 홈 화면 아이콘 아래 이름은 길면 잘리므로 짧은 이름을 따로 둔다
man={"name":"UC TABLE","short_name":"UC TABLE","description":"궤양성 대장염 식단·증상 기록(UC 식단 관리 도우미)",
 "start_url":"./index.html","scope":"./","display":"standalone","orientation":"portrait",
 "background_color":"#F2F4F6","theme_color":"#2462E6","lang":"ko",
 "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png","purpose":"any"},
          {"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any"},
          {"src":"icon-512-maskable.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]}
open(os.path.join(pwa,'manifest.webmanifest'),'w',encoding='utf-8').write(json.dumps(man,ensure_ascii=False,indent=1))
# 앱 내용이 바뀌면 캐시 이름도 바뀌도록 index.html 해시를 버전으로 쓴다.
# (버전이 고정이면 sw.js가 그대로라 설치된 앱이 옛 화면에 머문다)
import hashlib
ver=hashlib.sha256(doc(s,True).encode('utf-8')).hexdigest()[:10]
sw='''// 자동 생성 파일 — tools/build_offline.py
const CACHE="uc-table-%s";
const ASSETS=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-512-maskable.png","./apple-touch-icon.png"];
self.addEventListener("install",e=>{
  // HTTP 캐시를 건너뛰고 새로 받아야 옛 index.html이 새 캐시에 들어가지 않는다
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("uc-table-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET") return;
  const url=new URL(req.url); if(url.origin!==location.origin) return;
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(res=>{
    if(res.ok){const cp=res.clone(); caches.open(CACHE).then(c=>c.put(req,cp))} return res;
  }).catch(()=>req.mode==="navigate"?caches.match("./index.html"):Response.error())));
});
'''%ver
open(os.path.join(pwa,'sw.js'),'w',encoding='utf-8').write(sw)
print('single', single, os.path.getsize(single))
print('pwa   ', os.path.join(pwa,'index.html'), os.path.getsize(os.path.join(pwa,'index.html')))
