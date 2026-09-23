# 점검

```bash
npm install          # playwright
npx playwright install --with-deps chromium
npm test             # tests/run-all.sh — 40개 파일 전부 실행
```

각 파일은 `src/app/index.html`을 그대로 감싼 페이지를 새로 만들어 검사하므로,
앱을 고치면 다음 실행에 바로 반영됩니다. 실패한 파일의 로그는 `.test-out/`에 남습니다.

## 구성

| 폴더 | 파일 수 | 내용 |
|---|---|---|
| `tests/regression` | 25 | 화면 흐름 전체 회귀 — 첫 실행·동의, 증상 기록 마법사, 식단 제안, 먹은 음식 추가, 백업·복원, PDF 리포트, 글자 크기·다크 모드 |
| `tests/checks` | 15 | 주제별 점검 — 아래 표 |

| 파일 | 확인하는 것 |
|---|---|
| `checks/foods.cjs` | 음식 439종의 id·이름 중복, 출처·분량·아이콘·근거 번호 유무, 단계별 판정 결과 |
| `checks/data_audit.cjs` | 알레르기 태그 누락·과잉, 분량과 영양값 이상치, 별명 충돌 |
| `checks/gil_audit.cjs` | 병원 저잔사식 허용·제한 목록과 앱 단계 대조 |
| `checks/ui_audit.cjs` | 음식 상세 전수 렌더, 320·360·430 px에서 가로 넘침, 다크·큰 글자 |
| `checks/search.cjs` | 검색 일치 규칙(한 글자 검색, 초성, 자모 조합 중간 단계) |
| `checks/ime.cjs` | 한글 조합 입력 중 글자가 사라지거나 중복되지 않는지 |
| `checks/kbd.cjs` | 키보드가 올라와 화면이 좁아졌을 때 입력칸이 가려지지 않는지 |
| `checks/inject.cjs` | 사용자가 적은 `<`, `"`, 태그가 코드로 해석되지 않는지 |
| `checks/retain.cjs`, `checks/flow_in.cjs` | 확정 전 입력이 다시 그릴 때 사라지지 않는지 |
| `checks/ovf.cjs` | 긴 글자·큰 숫자에서 레이아웃이 깨지지 않는지 |
| `checks/pdflong.cjs` | 긴 메모·빈 프로필로 PDF를 만들 때 표가 잘리지 않는지 |
| `checks/offline.cjs` | 오프라인 빌드가 네트워크 차단 상태에서 동작하고 기록이 유지되는지 |
| `checks/pass2.cjs`, `checks/pass3.cjs` | 사용 흐름 전반 재점검 |

## 알려진 점

- 테스트는 Chromium에서만 돌립니다(대상 사용 환경이 안드로이드 크롬입니다).
- 실제 기기 검증은 하지 않았고, 화면 크기·글자 크기·다크 모드는 에뮬레이션으로만 확인했습니다.
