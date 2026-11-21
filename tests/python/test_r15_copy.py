# -*- coding: utf-8 -*-
"""v1.13.0 15차(2026-11-09) 문구 점검. 실행: python3 -m unittest discover -s tests/python -v

- 응급 안내(119·응급실·오늘 주치의 연락·바로 진료)는 지운다(사용자 결정). 22차(2026-11-16)부터 '병원에 내원하십시오'도 모두 뺐다(결정 52)
- 1번: '~십시오'는 알레르기 금지(먹지 마십시오)에만 쓴다. 나머지는 합니다체 서술
- 2번: 시판 제품 설명에서 영양 칸과 같은 숫자를 되풀이하던 '1회 …kcal…입니다' 문장을 뺀다
- 3·5번: '(2차 자료)'와 개발 메모 같은 괄호를 문장에서 뺀다(2차 자료라는 표시는 근거 [58] 이름에 남는다)
- 4번: 조건·긴 구를 가운뎃점으로 몰아넣은 문장을 풀어 쓴다
검사 범위: 앱 소스(주석·참고문헌 서지·레시피 원문 제목과 재료 제외), 생성 음식 설명(gen_out.json), 궁금한 점 답(근거 원문 E(...) 제외),
개인정보 처리방침·접근성 페이지, 서비스 워커 알림 문구
"""
import json, os, re, sys, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import tone_check  # noqa: E402

def rd(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()


def blank(s, spans):
    s = list(s)
    for a, b in spans:
        s[a:b] = ' ' * (b - a)
    return ''.join(s)


def app_text():
    s = rd('src', 'app', 'app.src.html')
    s = blank(s, tone_check.spans_app(s))
    s = re.sub(r'/\*.*?\*/', ' ', s, flags=re.S)
    s = re.sub(r'<!--.*?-->', ' ', s, flags=re.S)
    return '\n'.join(re.sub(r'(^|\s)//\s.*$', '', l) for l in s.split('\n'))


def qa_text():
    s = rd('src', 'data', 'qa.py')
    s = blank(s, tone_check.spans_qa(s))
    return '\n'.join(l for l in s.split('\n') if not l.strip().startswith('#'))


def gen_text():
    g = json.loads(rd('src', 'data', 'generated', 'gen_out.json'))
    return '\n'.join(g['foods'] + g['cjt'] + [str(v) for v in g['fodi'].values()])


def page_text(n):
    return re.sub(r'<!--.*?-->', ' ', rd('public', n), flags=re.S)


SCOPES = {'앱': app_text, '음식 설명': gen_text, '궁금한 점': qa_text,
          '개인정보 처리방침': lambda: page_text('privacy.html'), '접근성': lambda: page_text('accessibility.html'),
          '서비스 워커': lambda: rd('public', 'sw.js')}
ALLOW = re.compile(r'먹지 마십시오')


class EmergencyTest(unittest.TestCase):
    OLD = re.compile(r'119에|응급실|오늘 주치의|주치의(\([^)]*\))?(에게|에) 연락|바로 진료|진료를 (먼저 )?받|진료를 미루지')

    def test_no_old_emergency_wording(self):
        for k, f in SCOPES.items():
            t = f()
            hits = [t[max(0, m.start() - 30):m.end() + 10] for m in self.OLD.finditer(t)]
            self.assertEqual(hits, [], k)

    def test_no_hospital_visit_wording(self):   # 22차: 기록값에 따른 내원 권고·고정 내원 안내를 모두 뺐다
        t = app_text()
        self.assertEqual([t[max(0, m.start() - 30):m.end() + 10] for m in re.finditer(r'내원', t)], [])


class ImperativeTest(unittest.TestCase):
    def test_sipsio_only_for_emergency_and_allergy(self):
        for k, f in SCOPES.items():
            t = ALLOW.sub('', f())
            hits = [t[max(0, m.start() - 25):m.end()] for m in re.finditer(r'십시오', t)]
            self.assertEqual(hits, [], f'{k}: {len(hits)}곳')


class DuplicateNumberTest(unittest.TestCase):
    def test_no_serving_nutrient_sentence(self):
        t = gen_text()
        hits = re.findall(r'[^.]*에 [\d,.]+ ?kcal[^.]*\.', t) + re.findall(r'1회 [\d.]+(?:g|ml)\([^)]*\)에 [^.]*\.', t) + re.findall(r'[^.]*값으로 계산\)', t)
        self.assertEqual(hits[:5], [], f'{len(hits)}곳')


class MemoTest(unittest.TestCase):
    MEMO = ['2차 자료)', '평문으로 나가지 않게', '(판정은 원재료로 정함)', '(원재료명·알레르기는 확인)', '(인터넷 연결 확인)',
            '한 곳 확인)', '한 곳에서만 확인)', '(두 번째 자료와 대조하지 않음)']

    def test_no_memo_parentheses(self):
        for k, f in SCOPES.items():
            t = re.sub(r'(?m)^\s*\d+:\{short:.*$', '', f())   # 참고문헌 목록의 자료 이름('…정리(2차 자료)')은 자료 종류라 둔다
            self.assertEqual([m for m in self.MEMO if m in t], [], k)

    def test_secondary_source_kept_in_reference_58(self):
        s = rd('src', 'app', 'app.src.html')
        self.assertRegex(s, r'\n\s*58:\{short:"[^"]*2차 자료')


class CrammedDotTest(unittest.TestCase):
    OLD = ['열·심한 복통', '배변·변 대부분 뚜렷한 피·체온', '없음 0·1~2회 1', '없음 0·줄무늬 정도 1',
           '백업 파일·복사한 내용·공유한 파일', '자동 보관본·불러오기 전 기록·암호화 열쇠', '내려받은 백업·PC 자동 백업 폴더의 파일·PDF',
           '보관본·폴더 연결·암호화 열쇠', '백업 파일·백업 내용 복사·공유·자동 백업', '백업 파일 저장·보내기·백업 내용 복사',
           '백업 파일·보내기·복사·자동 백업', '럼·레드와인 250ml 초과·스위트 와인', '날것·덜 익힌 생선·조개·고기·달걀']

    def test_crammed_lists_unpacked(self):
        t = app_text()
        self.assertEqual([o for o in self.OLD if o in t], [])


if __name__ == '__main__':
    unittest.main()
