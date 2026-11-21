// 앱(src/app/index.html) 안의 <script> 블록을 순서대로 이어 붙여 .lint/app.js로 내보낸다(ESLint 검사용)
const fs=require('fs'), path=require('path');
const ROOT=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'src','app','index.html'),'utf8');
const parts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
fs.mkdirSync(path.join(ROOT,'.lint'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'.lint','app.js'),parts.map((p,i)=>`/* ==== script ${i} ==== */\n${p}`).join('\n'));
console.log(`scripts ${parts.length}, lines ${parts.join('\n').split('\n').length}`);
