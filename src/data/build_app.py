# -*- coding: utf-8 -*-
"""음식 데이터·판정 규칙을 앱 소스(src/app/index.html)에 다시 주입한다.

  1) apply_1_dataset  : app.base.html에서 시작해 생성된 음식 데이터(gen_out.json)를 넣는다
  2) apply_2_rules    : 판정 규칙·검색·화면 보정 패치를 넣는다
  3) apply_3_existing : 기존 음식의 단계·태그·설명을 근거 검토 결과로 고친다

식약처 원본 CSV가 있으면 generate_dataset.py로 gen_out.json부터 다시 만들 수 있다.
"""
import subprocess, sys, os
D=os.path.dirname(os.path.abspath(__file__))
for step in ('apply_1_dataset.py','apply_2_rules.py','apply_3_existing.py'):
    print('==',step)
    subprocess.run([sys.executable, os.path.join(D,step)], check=True)
print('완료: src/app/index.html')
