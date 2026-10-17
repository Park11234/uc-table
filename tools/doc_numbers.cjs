/* 문서 숫자 점검(v1.11.0 M7): README·docs·공개 페이지에 적은 '지금의 숫자'(음식 수·궁금한 점·참고문헌·점검 수 등)가
   빌드 결과와 같은지 확인한다. 숫자는 문서에 <!--n:이름-->값<!--/n--> 표시로 감싸 두고, 값은 한곳(앱 빌드·저장소 파일)에서 읽는다.
     node tools/doc_numbers.cjs          다르면 목록을 보이고 실패(종료 코드 1)
     node tools/doc_numbers.cjs --fix    표시 안의 값을 지금 값으로 바꾼다
     node tools/doc_numbers.cjs --list   지금 값만 보인다
   지난 버전의 기록(CHANGELOG, '…에서 더한 1,059종' 같은 역사)은 표시하지 않는다. 표시한 곳만 '지금 값'이다. */
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
const APP = process.env.APP_HTML || path.join(ROOT, 'src', 'app', 'index.html');
const DOCS = ['README.md', 'docs/architecture.md', 'docs/ai-workflow.md', 'docs/testing.md', 'docs/release.md', 'docs/data-sources.md',
  'docs/evidence.md', 'public/privacy.html', 'public/accessibility.html'];
const MODE = process.argv.includes('--fix') ? 'fix' : process.argv.includes('--list') ? 'list' : 'check';
const fmt = n => typeof n === 'number' ? n.toLocaleString('en-US') : String(n);

function repoNumbers() {
  const ls = d => fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith('.cjs'));
  const py = fs.readdirSync(path.join(ROOT, 'tests', 'python')).filter(f => /^test_.*\.py$/.test(f))
    .reduce((n, f) => n + (fs.readFileSync(path.join(ROOT, 'tests', 'python', f), 'utf8').match(/^\s+def test_/gm) || []).length, 0);
  const mut = fs.readFileSync(path.join(ROOT, 'tests', 'mutation-check.sh'), 'utf8');
  const mutants = (mut.match(/^ +'[a-z0-9_]+\.html':/gm) || []).length;
  const pairs = ((mut.match(/PAIRS="([\s\S]*?)"/) || [, ''])[1].split('\n').filter(l => l.trim())).length;
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  return { reg: ls('tests/regression').length, chk: ls('tests/checks').length, pw: ls('tests/regression').length + ls('tests/checks').length,
    pytests: py, mutants, pairs, pkgver: pkg.version };
}

async function appNumbers() {
  const { chromium } = require('playwright');
  const tmp = path.join(process.env.TEST_TMP || path.join(ROOT, '.test-out'), 'doc_numbers.html');
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, '<!doctype html><html lang="ko"><head><meta charset="utf-8"></head><body>' + fs.readFileSync(APP, 'utf8') + '</body></html>');
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + tmp); await p.waitForFunction(() => typeof FOODS === 'object' && typeof QA === 'object');
  const r = await p.evaluate(() => ({
    ver: APP_VER, foods: FOODS.length, prod: FOODS.filter(isProd).length, general: FOODS.filter(f => !isProd(f)).length,
    ons: FOODS.filter(f => f.tags.includes('ons')).length, qa: QA.length, qaev: QA.reduce((a, q) => a + (q.ev || []).length, 0),
    refs: Object.keys(REFS).length, menus: MENU_COUNT, menusB: TPL.B.length, menusL: TPL.L.length, menusD: TPL.D.length, menusS: TPL.S.length,
    gloss: Object.keys(GLOSS).length, nitrite: FOODS.filter(f => f.tags.includes('nitrite')).length,
    fserv: Object.keys(FSERV).length }));
  await b.close(); return r;
}

(async () => {
  const N = { ...(await appNumbers()), ...repoNumbers() };
  if (MODE === 'list') { for (const [k, v] of Object.entries(N)) console.log(k.padEnd(9), fmt(v)); return }
  const bad = []; let fixed = 0;
  if (N.ver !== N.pkgver) bad.push(`앱 버전 ${N.ver}과 package.json ${N.pkgver}이 다름`);
  for (const rel of DOCS) {
    const file = path.join(ROOT, rel); if (!fs.existsSync(file)) continue;
    const s = fs.readFileSync(file, 'utf8');
    const out = s.replace(/<!--n:(\w+)-->([^<]*)<!--\/n-->/g, (m, k, v) => {
      if (!(k in N)) { bad.push(`${rel}: 모르는 이름 '${k}'`); return m }
      const want = fmt(N[k]);
      if (v !== want) { if (MODE === 'fix') { fixed++; return `<!--n:${k}-->${want}<!--/n-->` } bad.push(`${rel}: ${k} ${v} → 지금 ${want}`) }
      return m });
    if (MODE === 'fix' && out !== s) fs.writeFileSync(file, out);
  }
  if (MODE === 'fix') { console.log(`고친 곳 ${fixed}`); if (bad.length) { console.error(bad.join('\n')); process.exit(1) } return }
  if (bad.length) { console.error('FAIL 문서 숫자가 지금과 다릅니다(node tools/doc_numbers.cjs --fix)\n' + bad.join('\n')); process.exit(1) }
  console.log('문서 숫자 점검 통과');
})();
