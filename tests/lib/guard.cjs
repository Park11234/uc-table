// 점검 공통 안전장치: 이 파일을 불러오면 chromium.launch()로 연 모든 페이지에서
// 페이지 오류(pageerror)가 나면 'PAGEERROR …'를 찍고 점검을 실패(종료 코드 1)로 만든다. 여러 번 불러도 한 번만 건다.
{const __pw=require('playwright'); const __ch=__pw.chromium; if(!__ch.__guarded){ const __launch=__ch.launch.bind(__ch); __ch.__guarded=true;
  __ch.launch=async(...a)=>{const b=await __launch(...a); const hook=p=>p.on('pageerror',e=>{console.error('PAGEERROR '+e.message); process.exitCode=1});
    const np=b.newPage.bind(b); b.newPage=async(...x)=>{const p=await np(...x); hook(p); return p};
    const nc=b.newContext.bind(b); b.newContext=async(...x)=>{const c=await nc(...x); c.on('page',hook); return c}; return b} }}
