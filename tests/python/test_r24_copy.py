# -*- coding: utf-8 -*-
"""v1.13.0 24차(2026-11-17) 문장 점검: 궁금한 점 답이 묻는 말에 먼저 답하는지.
실행: python3 -m unittest discover -s tests/python -v

- 답의 첫 문장이 기관 이름으로 시작하지 않는다(묻는 말의 답이 먼저, 출처는 그 뒤).
- "○○는 ~안내합니다/권합니다"처럼 출처로 끝나는 문장은 한 답에 1개까지(나머지 출처는 문장 끝 괄호로).
- '~십시오'는 쓰지 않는다(알레르기 '먹지 마십시오'만 앱 화면에 둔다).
근거 원문 인용(ev)과 참고문헌 번호(refs)는 이 점검과 상관없이 test_data.py가 본다.
"""
import os, re, sys, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, 'src', 'data'))
import qa  # noqa: E402

INST = re.compile(r'^(대한장연구학회|길병원|가천대 길병원|세브란스병원|서울아산병원|서울대(학교)?병원|ECCO|ESPEN|AGA|IOIBD|ACG|국내 병원|병원들|지침은)')
ATTR = re.compile(r'(안내합니다|권합니다|듭니다|봅니다|꼽습니다|정리했습니다|합니다)\.?$')


def sentences(t):
    return [x.strip() for x in re.split(r'(?<=다\.)\s+', t) if x.strip()]


class QaAnswerFirstTest(unittest.TestCase):
    def test_first_sentence_answers(self):
        bad = [q['id'] for q in qa.QA if INST.match(sentences(q['a'])[0])]
        self.assertEqual(bad, [], '첫 문장이 기관 이름으로 시작하는 답')

    def test_no_attribution_chain(self):
        bad = []
        for q in qa.QA:
            n = sum(1 for s in sentences(q['a']) if re.search(r'(는|은|도) .*(안내합니다|권합니다|꼽습니다|봅니다)\.?$', s) and re.search(r'학회|병원|ECCO|ESPEN|AGA|IOIBD|ACG|지침', s))
            if n >= 2:
                bad.append((q['id'], n))
        self.assertEqual(bad, [], '출처로 끝나는 문장을 2개 이상 이은 답')

    def test_no_imperative(self):
        self.assertEqual([q['id'] for q in qa.QA if '십시오' in q['a']], [])


if __name__ == '__main__':
    unittest.main()
