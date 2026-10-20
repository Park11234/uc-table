// UC TABLE 로고·앱 아이콘(v1.8.0, v1.12.0 후속 새 색 '바다': 바다 파랑 타일·흰 글자)
//   node tools/brand.cjs            src/brand/*.svg를 만들고 public/의 아이콘 PNG(192·512·maskable·apple-touch)를 그린다
//   node tools/brand.cjs --preview  위에 더해 .test-out/brand/에 확인용 그림(홈 화면 흉내)을 만든다
// 글꼴 파일을 쓰지 않고 글자를 선(같은 굵기의 직선·원호)으로 직접 그린다. 그래서 어느 기기에서나 같은 모양이고 저작권이 걸린 글꼴이 없다.
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

/* ---------- 앱 아이콘: 3×3 칸에 잎 · U C / T A B / L E · 물방울 ----------
   v1.12.0 후속: 앱의 새 색(바다 파랑 #0B5E96, 짙은 바다 #053B72)으로. 파랑 타일 위 흰 글자, 잎은 초록, 물방울은 흰색에 가까운 하늘색 */
const BLUE='#0B5E96', BLUE_DEEP='#053B72', BLUE_TOP='#1A7BB8';
const THEMES={
 blue:{tile:[BLUE_TOP,BLUE_DEEP], ink:['#FFFFFF','#EAF6FB'], leaf:['#7BE3A6','#2EAF68'], vein:'#F2FFF7', drop:['#FFFFFF','#BFE3F2'], dropHi:BLUE, shadow:'#022347', shadowOp:.30, edge:null},
 white:{tile:['#FFFFFF','#EAF4F8'], ink:[BLUE_TOP,BLUE_DEEP], leaf:['#5FD08E','#1F8A52'], vein:'#E9FFF2', drop:['#7DB4FF',BLUE], dropHi:'#fff', shadow:'#0E1A2E', shadowOp:.18, edge:'#000'}};
const H=92, W2=21;           // 대문자 높이, 획 굵기
function capital(ch,cx,cy){
  const t=cy-H/2, b=cy+H/2, h=W2/2;
  switch(ch){
    case 'U': { const w=74, xl=cx-w/2+h, xr=cx+w/2-h, r=(xr-xl)/2, y=b-h-r; return `<path d="M${xl} ${t}V${y}A${r} ${r} 0 0 0 ${xr} ${y}V${t}"/>`; }
    case 'C': { const r=H/2-h, a=P(cx+3,cy,r,-44), c=P(cx+3,cy,r,44); return `<path d="M${a[0]} ${a[1]}A${r} ${r} 0 1 0 ${c[0]} ${c[1]}"/>`; }
    case 'T': return `<path d="M${cx-36} ${t+h}H${cx+36}M${cx} ${t+h}V${b}"/>`;
    case 'A': { const id=`a${Math.round(cx)}${Math.round(cy)}`, s=0.42; // 다리 기울기(가로/세로)
      const L1=[cx-s*(H+30)+W2*0.1, b+15], L2=[cx+W2*0.1, t-15]; // 왼쪽 다리(위아래로 길게 그린 뒤 칸 높이로 자름)
      return `<clipPath id="${id}"><rect x="${cx-50}" y="${t}" width="100" height="${H}"/></clipPath><g clip-path="url(#${id})"><path d="M${r1(cx-s*(H+30)/2-1)} ${b+15}L${r1(cx-1)} ${t-15}M${r1(cx+s*(H+30)/2+1)} ${b+15}L${r1(cx+1)} ${t-15}M${cx-24} ${cy+17}H${cx+24}"/></g>`; }
    case 'B': { const xl=cx-32+h, top=t+h, mid=cy, bot=b-h, r1u=(mid-top)/2, r1d=(bot-mid)/2, xu=cx+8, xd=cx+13;
      return `<path d="M${xl} ${t}V${b}M${xl} ${top}H${xu}A${r1u} ${r1u} 0 0 1 ${xu} ${mid}H${xl}M${xl} ${mid}H${xd}A${r1d} ${r1d} 0 0 1 ${xd} ${bot}H${xl}"/>`; }
    case 'L': return `<path d="M${cx-28+h} ${t}V${b-h}H${cx+32}"/>`;
    case 'E': return `<path d="M${cx+32} ${t+h}H${cx-28+h}V${b-h}H${cx+32}M${cx-28+h} ${cy}H${cx+24}"/>`;
  }
}
function leaf(cx,cy,T){   // 잎(식단): 비스듬한 아몬드 모양 + 잎맥
  return `<g transform="translate(${cx} ${cy}) rotate(-38) scale(1.1)"><path d="M0 -50C30 -30 30 30 0 50C-30 30 -30 -30 0 -50Z" fill="url(#gLeaf)"/><path d="M0 -36V40" stroke="${T.vein}" stroke-opacity=".75" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M0 -50C30 -30 30 30 0 50" stroke="#fff" stroke-opacity=".28" stroke-width="3" fill="none"/></g>`;
}
function drop(cx,cy,T){   // 물방울(수분)
  return `<g transform="translate(${cx} ${cy+4}) scale(1.1)"><path d="M0 -50C14 -30 34 -8 34 14A34 34 0 0 1 -34 14C-34 -8 -14 -30 0 -50Z" fill="url(#gDrop)"/><path d="M-17 6C-19 18 -13 28 -4 31" stroke="${T.dropHi}" stroke-opacity=".8" stroke-width="6" stroke-linecap="round" fill="none"/></g>`;
}
function iconSVG({maskable=false, opaque=false, theme='blue'}={}){ const T=THEMES[theme];
  const S=512, cell=118, scale=maskable?0.8:1;    // maskable: 기기마다 원·둥근 사각형으로 잘려도 안전 영역(가운데 80%) 안에 들어오게
  const g0=S/2-cell*1.5;
  const C=(i)=>g0+cell*(i+0.5);
  const cells=[['leaf'],['U'],['C'],['T'],['A'],['B'],['L'],['E'],['drop']];
  let letters='', shapes='';   // 글자(같은 선 굵기·색)와 그림(잎·물방울)을 따로 모은다
  cells.forEach(([k],n)=>{ const cx=C(n%3), cy=C(Math.floor(n/3));
    if(k==='leaf') shapes+=leaf(cx,cy,T); else if(k==='drop') shapes+=drop(cx,cy,T); else letters+=capital(k,cx,cy); });
  const tile = maskable||opaque ? `<rect width="512" height="512" fill="url(#gTile)"/>`
    : `<rect x="0" y="0" width="512" height="512" rx="114" fill="url(#gTile)"/>${T.edge?`<rect x="1.5" y="1.5" width="509" height="509" rx="112.5" fill="none" stroke="${T.edge}" stroke-opacity=".07" stroke-width="3"/>`:""}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs>
 <linearGradient id="gTile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.tile[0]}"/><stop offset="1" stop-color="${T.tile[1]}"/></linearGradient>
 <linearGradient id="gInk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.ink[0]}"/><stop offset="1" stop-color="${T.ink[1]}"/></linearGradient>
 <linearGradient id="gLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.leaf[0]}"/><stop offset="1" stop-color="${T.leaf[1]}"/></linearGradient>
 <linearGradient id="gDrop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.drop[0]}"/><stop offset="1" stop-color="${T.drop[1]}"/></linearGradient>
 <filter id="soft" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="4.5" flood-color="${T.shadow}" flood-opacity="${T.shadowOp}"/></filter>
</defs>
${tile}
<g transform="translate(256 256) scale(${scale}) translate(-256 -256)" filter="url(#soft)">
 <g fill="none" stroke="url(#gInk)" stroke-width="${W2}" stroke-linecap="butt" stroke-linejoin="miter">${letters}</g>
 ${shapes}
</g>
</svg>`;
}

module.exports={logoSVG,iconSVG,WM_BOX};

if(require.main===module){(async()=>{
  const B=path.join(ROOT,'src','brand'); fs.mkdirSync(B,{recursive:true});
  fs.writeFileSync(path.join(B,'logo.svg'),logoSVG(BLUE)+'\n');
  fs.writeFileSync(path.join(B,'logo-mono.svg'),logoSVG()+'\n');   // 앱 안에서 쓰는 것(글자색 = 주위 글자색)
  fs.writeFileSync(path.join(B,'icon.svg'),iconSVG()+'\n');
  fs.writeFileSync(path.join(B,'icon-maskable.svg'),iconSVG({maskable:true})+'\n');
  const { chromium } = require('playwright');
  const b=await chromium.launch(); const p=await b.newPage({deviceScaleFactor:1});
  const shot=async(svg,size,file,transparent=true)=>{
    await p.setViewportSize({width:size,height:size});
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('width="512" height="512"',`width="${size}" height="${size}"`)}</body></html>`);
    await p.screenshot({path:file,omitBackground:transparent,clip:{x:0,y:0,width:size,height:size}});
  };
  const PUB=path.join(ROOT,'public');
  await shot(iconSVG(),192,path.join(PUB,'icon-192.png'));
  await shot(iconSVG(),512,path.join(PUB,'icon-512.png'));
  await shot(iconSVG({maskable:true}),512,path.join(PUB,'icon-512-maskable.png'),false);
  await shot(iconSVG({opaque:true}),180,path.join(PUB,'apple-touch-icon.png'),false);
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
