// UC TABLE 로고(v1.8.0)와 홈 화면 앱 아이콘(v1.13.0 25차부터 사용자가 고른 수달 그림 E1, 결정 58)
//   node tools/brand.cjs            src/brand/logo*.svg를 만들고, src/brand/app-icon/의 아이콘 PNG(192·512·maskable·apple-touch)를 public/에 넣는다
//   node tools/brand.cjs --preview  위에 더해 .test-out/brand/에 확인용 그림(홈 화면 흉내)을 만든다
// 로고는 글꼴 파일을 쓰지 않고 글자를 선(같은 굵기의 직선·원호)으로 직접 그린다. 그래서 어느 기기에서나 같은 모양이고 저작권이 걸린 글꼴이 없다.
const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..');
const r1=x=>Math.round(x*100)/100;
const P=(cx,cy,r,deg)=>[r1(cx+r*Math.cos(deg*Math.PI/180)), r1(cy+r*Math.sin(deg*Math.PI/180))];

/* ---------- 글자 모양(소문자 로고) ----------
   x높이 100(위 0, 기준선 100), 획 굵기 18, 둥근 글자는 바깥 지름 100 */
const SW=18, R=41;   // 획 굵기, 원 중심선 반지름(바깥 50)
function wordmark(){
  const d=[];
  // u: 왼쪽 기둥 + 아래 반원 + 오른쪽 기둥(기준선까지)
  let cx=50; d.push(`M${cx-R} 0V50A${R} ${R} 0 0 0 ${cx+R} 50`, `M${cx+R} 0V100`);
  // c: 오른쪽이 열린 원(끝은 반지름 방향으로 자름)
  cx=164; { const a=P(cx,50,R,-42), b=P(cx,50,R,42); d.push(`M${a[0]} ${a[1]}A${R} ${R} 0 1 0 ${b[0]} ${b[1]}`); }
  // t: 기둥(아래는 오른쪽으로 둥글게) + 가로획
  const tx=276; d.push(`M${tx} -26V62A29 29 0 0 0 ${tx+29} 91`, `M${tx-22} 9H${tx+30}`);
  // a: 원 + 오른쪽 기둥
  cx=371; d.push(`M${cx+R} 50A${R} ${R} 0 1 1 ${cx+R} 49.99`, `M${cx+R} 0V100`);
  // b: 왼쪽 기둥(어센더) + 원
  cx=485; d.push(`M${cx-R} -42V100`, `M${cx-R} 50A${R} ${R} 0 1 1 ${cx-R} 50.01`);
  // l
  const lx=558; d.push(`M${lx} -42V100`);
  // e: 가운데 가로획 + 오른쪽 아래가 열린 원
  cx=631; { const b=P(cx,50,R,40); d.push(`M${cx-R} 50H${cx+R+SW/2}`, `M${cx+R} 50A${R} ${R} 0 1 0 ${b[0]} ${b[1]}`); }
  return d;
}
const WM_BOX=[-1,-42,683,142];   // x, y, 너비, 높이
function logoSVG(color='currentColor'){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${WM_BOX.join(' ')}" fill="none" stroke="${color}" stroke-width="${SW}" stroke-linecap="butt" stroke-linejoin="miter"><path d="${wordmark().join('')}"/></svg>`;
}

/* ---------- 앱 아이콘(v1.13.0 25차, 결정 58): 사용자가 고른 수달 그림 E1을 그대로 쓴다 ----------
   src/brand/app-icon/에 원본(1024)과 크기별 PNG를 둔다. 192·512는 모서리 밖이 투명, maskable 512·apple-touch 180은 배경까지 채웠고
   수달과 글자는 maskable 안전 영역(가운데 80%) 안에 있다. 예전 3×3 글자 아이콘(v1.8.0~v1.12.0)은 더 그리지 않는다 */
const BLUE='#0B5E96';
const ICONS=['icon-192.png','icon-512.png','icon-512-maskable.png','apple-touch-icon.png'];

module.exports={logoSVG,WM_BOX};

if(require.main===module){(async()=>{
  const B=path.join(ROOT,'src','brand'); fs.mkdirSync(B,{recursive:true});
  fs.writeFileSync(path.join(B,'logo.svg'),logoSVG(BLUE)+'\n');
  fs.writeFileSync(path.join(B,'logo-mono.svg'),logoSVG()+'\n');   // 앱 안에서 쓰는 것(글자색 = 주위 글자색)
  const { chromium } = require('playwright');
  const b=await chromium.launch(); const p=await b.newPage({deviceScaleFactor:1});
  const PUB=path.join(ROOT,'public');
  for(const f of ICONS) fs.copyFileSync(path.join(B,'app-icon',f),path.join(PUB,f));
  // 문서·대표 이미지용 로고 PNG(투명 배경, 너비 1200)
  { const w=1200, h=Math.round(1200*WM_BOX[3]/WM_BOX[2]); await p.setViewportSize({width:w,height:h});
    await p.setContent(`<html><body style="margin:0;background:transparent">${logoSVG(BLUE).replace('<svg ',`<svg width="${w}" height="${h}" `)}</body></html>`);
    await p.screenshot({path:path.join(B,'logo.png'),omitBackground:true,clip:{x:0,y:0,width:w,height:h}}); }
  if(process.argv.includes('--preview')){
    const O=path.join(ROOT,'.test-out','brand'); fs.mkdirSync(O,{recursive:true});
    const m=fs.readFileSync(path.join(PUB,'icon-512-maskable.png')).toString('base64'), a=fs.readFileSync(path.join(PUB,'icon-512.png')).toString('base64');
    await p.setViewportSize({width:900,height:620});
    await p.setContent(`<html><body style="margin:0;background:#1b1f27;font-family:sans-serif;color:#fff">
      <div style="display:flex;gap:28px;padding:28px;align-items:flex-end;flex-wrap:wrap">
       <figure style="margin:0;text-align:center"><img src="data:image/png;base64,${a}" width="180"><figcaption>any(둥근 사각형)</figcaption></figure>
       <figure style="margin:0;text-align:center"><img src="data:image/png;base64,${m}" width="180" style="border-radius:50%"><figcaption>maskable → 원</figcaption></figure>
       <figure style="margin:0;text-align:center"><img src="data:image/png;base64,${m}" width="180" style="border-radius:32%"><figcaption>maskable → 둥근 사각형</figcaption></figure>
       <figure style="margin:0;text-align:center"><img src="data:image/png;base64,${a}" width="64"><figcaption>64px</figcaption></figure>
      </div>
      <div style="background:#053B72;padding:30px 28px;margin:0 28px;border-radius:16px;color:#FFFFFF;width:320px">${logoSVG()}</div>
      <div style="background:#070F36;padding:30px 28px;margin:16px 28px;border-radius:16px;color:#F6E7A8;width:320px">${logoSVG()}</div></body></html>`);
    await p.screenshot({path:path.join(O,'preview.png')});
  }
  await b.close(); console.log('brand ok');
})()}
