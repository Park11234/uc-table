/* v1.12.0 글꼴 글자 빠짐 점검: 앱 글꼴 'UC Table Sans'(src/brand/uc-table-sans.woff2)는 '지금 앱에 있는 글자 + KS X 1001 한글'만 담는다.
   새 문구나 새 음식 이름에 드문 글자가 들어가면 그 글자만 조용히 기본 글꼴로 보이므로, 빌드한 앱(데이터 포함)과 공개 문서의 글자가
   모두 글꼴에 있는지 본다. 빠지면 원본 글꼴로 다시 만든다: python3 tools/font_subset.py <PretendardVariable.woff2>
   (원본은 npm pretendard@1.3.9의 dist/web/variable/woff2/, 저장소에 넣지 않음)
   빼는 것: 그림 문자(음식 그림 이모지 등, 기기의 이모지 글꼴로 보임)·이모지 모양 선택자·ZWJ, 그리고 원본 Pretendard 1.3.9에 없는 글자(NO_SRC) */
const path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const { woff2Chars }=require(path.join(ROOT,'tools','woff2_cmap.cjs'));
const APP=process.env.APP_HTML||path.join(ROOT,'src','app','index.html');
const FONT=path.join(ROOT,'src','brand','uc-table-sans.woff2');
// 원본 Pretendard 1.3.9에 없는 글자(2026-10-17 확인). 기기 글꼴로 보인다. 원본에 있는 글자는 여기에 넣지 말고 글꼴을 다시 만든다
const NO_SRC=new Set([...'✕∙ⓘ⋮情無安心生眞']);
const F=[]; const need=(c,m)=>{if(!c){F.push(m); console.log('  ✗ '+m)} else console.log('  ✓ '+m)};
const have=woff2Chars(fs.readFileSync(FONT));
console.log(`글꼴 글자 ${have.size.toLocaleString()}개`);
const skip=ch=>{const c=ch.codePointAt(0); return c<0x20||c===0x200D||(c>=0xFE00&&c<=0xFE0F)||/\p{Extended_Pictographic}/u.test(ch)||NO_SRC.has(ch)};
const srcs=[['앱(빌드, 데이터 포함)',APP],['개인정보 처리방침',path.join(ROOT,'public','privacy.html')],['접근성 안내',path.join(ROOT,'public','accessibility.html')]];
for(const [name,file] of srcs){
  const t=fs.readFileSync(file,'utf8'); const miss=new Map();
  for(const ch of t){ if(skip(ch)||have.has(ch.codePointAt(0))) continue; if(!miss.has(ch)){const i=t.indexOf(ch); miss.set(ch,t.slice(Math.max(0,i-20),i+10).replace(/\s+/g,' '))} }
  need(!miss.size,`${name}: 글꼴에 없는 글자 ${miss.size}개${miss.size?' → '+[...miss].slice(0,12).map(([ch,ctx])=>`${ch}(U+${ch.codePointAt(0).toString(16).toUpperCase()}) …${ctx}…`).join(' / '):''}`);
}
// 사용자가 적는 메모·음식 이름을 위해 KS X 1001 한글 2,350자는 모두 넣기로 했다(tools/font_subset.py)
{ const dec=new TextDecoder('euc-kr'); let n=0, gap=[];
  for(let hi=0xB0;hi<=0xC8;hi++) for(let lo=0xA1;lo<=0xFE;lo++){const ch=dec.decode(Uint8Array.of(hi,lo)); if(ch.length!==1||ch<'가'||ch>'힣') continue; n++; if(!have.has(ch.codePointAt(0))) gap.push(ch)}
  need(n===2350&&!gap.length,`KS X 1001 한글 ${n}자 모두 있음${gap.length?` (빠짐 ${gap.length}: ${gap.slice(0,20).join('')})`:''}`); }
// 허용 목록이 낡지 않게: 글꼴에 이미 있는 글자는 NO_SRC에서 지운다
need([...NO_SRC].every(ch=>!have.has(ch.codePointAt(0))),'원본에 없는 글자 목록(NO_SRC)이 글꼴과 맞음');
if(F.length){console.error('FAIL\n'+F.join('\n')); process.exitCode=1} else console.log('검증 통과');
