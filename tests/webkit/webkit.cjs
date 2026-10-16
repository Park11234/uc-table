/* v1.11.0 M11: 아이폰 사파리와 같은 엔진(WebKit)으로 주요 흐름을 확인한다.
   이 저장소의 개발 환경에는 WebKit이 없어 CI(GitHub Actions의 webkit 작업)에서만 돈다.
   손으로 돌리기: npx playwright install --with-deps webkit && node tests/webkit/webkit.cjs
   엔진을 바꿔 보기: BROWSER=chromium node tests/webkit/webkit.cjs (점검 코드 자체를 확인할 때)
   흐름: 첫 실행 동의 → 홈 → 빠른 증상 기록 → 음식 검색·음식 정보 → 백업 내용 만들기·붙여 넣어 불러오기 → 입력칸 글자 16px(확대 방지) */
const path = require('path'), fs = require('fs');
const pw = require('playwright');
const ROOT = path.join(__dirname, '..', '..');
const APP = process.env.APP_HTML || path.join(ROOT, 'src', 'app', 'index.html');
const TMP = process.env.TEST_TMP || path.join(ROOT, '.test-out');
const NAME = process.env.BROWSER || 'webkit';
fs.mkdirSync(TMP, { recursive: true });
const page = path.join(TMP, 'webkit.html');
fs.writeFileSync(page, '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>' + fs.readFileSync(APP, 'utf8') + '</body></html>');
const F = []; const need = (c, m) => { if (!c) { F.push(m); console.log('  ✗ ' + m) } else console.log('  ✓ ' + m) };
(async () => {
  const b = await pw[NAME].launch();
  const dev = NAME === 'webkit' ? pw.devices['iPhone 13'] : { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
  const ctx = await b.newContext({ ...dev, locale: 'ko-KR' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route(/^https?:/, r => r.fulfill({ body: '' }));   // 오프라인과 같게(외부 주소 없음)
  await p.goto('file://' + page);
  await p.waitForFunction(() => typeof render === 'function' && !!document.querySelector('#main').firstChild, null, { timeout: 30000 });

  console.log(`== ${NAME}: 첫 실행·홈`);
  await p.click('label.swrow:has(#c_req)'); await p.click('#consentGo'); await p.waitForTimeout(400);
  const skip = await p.$('[data-act=onbSkip]'); if (skip) { await skip.click(); await p.waitForTimeout(300) }
  need(await p.evaluate(() => !!S.consent && S.tab === 'plan' && !!document.querySelector('.tab[data-tab=plan][aria-current], .tab[data-tab=plan].on, .tab[data-tab=plan]') && document.querySelector('#main').innerText.length > 50), '동의 뒤 홈(오늘 식단)이 열림');

  console.log('== 빠른 증상 기록');
  const quick = await p.evaluate(() => { const d = today(); S.logs[d] = { ...BLANK_LOG(), day: 3, night: 0, urg: 0, blood: 0, bloody: 0, well: 0, stool: 4, medtaken: 1, pain: 0, quick: true }; save(); S.tab = 'log'; SCR = null; render();
    return { n: Object.keys(S.logs).length, row: !!document.querySelector('.hrow'), score: sccai(S.logs[d]) } });
  need(quick.n === 1 && quick.row, `기록 목록에 오늘 기록 (${JSON.stringify(quick)})`);
  await p.reload(); await p.waitForFunction(() => typeof S === 'object' && !!S.consent, null, { timeout: 30000 });
  need(await p.evaluate(() => Object.keys(S.logs).length === 1), '새로고침 뒤에도 기록이 남음(localStorage)');

  console.log('== 음식 검색·음식 정보');
  await p.click('.tab[data-tab=food]'); await p.waitForTimeout(300);
  const q = await p.$('#foodQ'); need(!!q, '음식 검색칸');
  if (q) { await q.fill('누룽지'); await p.waitForTimeout(500) }
  const cards = await p.$$('#foodRes .fcard'); need(cards.length > 0, `'누룽지' 검색 결과 (${cards.length}개)`);
  if (cards.length) { await cards[0].click(); await p.waitForTimeout(400) }
  need(await p.evaluate(() => !!document.querySelector('#sheetRoot .why-sum') || /판정/.test(document.querySelector('#sheetRoot')?.innerText || '')), '음식 정보 시트가 열림');
  await p.evaluate(() => closeSheet());

  console.log('== 백업 만들기·불러오기');
  const bk = await p.evaluate(async () => { const t = await backupOut(); S.logs = {}; save(); restoreFromText(t); await new Promise(z => setTimeout(z, 200));
    const sheet = document.querySelector('#sheetRoot')?.innerText || ''; const btn = document.querySelector('[data-act=restoreApply]'); if (btn) btn.click(); await new Promise(z => setTimeout(z, 300));
    return { sheet: /백업 불러오기/.test(sheet), n: Object.keys(S.logs).length } });
  need(bk.sheet && bk.n === 1, `백업 내용으로 되살림 (${JSON.stringify(bk)})`);

  console.log('== 입력칸 글자 크기(아이폰 확대 방지)');
  await p.click('.tab[data-tab=food]'); await p.waitForTimeout(200);
  const fs16 = await p.evaluate(() => [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=file]),textarea,select')].filter(x => x.offsetParent).map(x => parseFloat(getComputedStyle(x).fontSize)));
  need(fs16.length > 0 && fs16.every(v => v >= 16), `보이는 입력칸 글자 16px 이상 (${fs16.join(',')})`);

  need(!errs.length, `페이지 오류 없음 (${errs.join(' / ').slice(0, 200)})`);
  await b.close();
  console.log(F.length ? 'FAIL ' + F.join(' / ') : '검증 통과'); process.exit(F.length ? 1 : 0);
})();
