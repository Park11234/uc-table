# 식약처 영양성분 원본 CSV를 두는 곳

용량과 이용 조건 때문에 저장소에는 원본을 넣지 않았습니다.
공공데이터포털 또는 식품안전나라에서 통합식품영양성분DB를 내려받아
이 폴더에 아래 이름으로 저장하면 `python3 src/data/generate_dataset.py`가 동작합니다.

| 파일 | 내용 |
|---|---|
| `raw.csv` | 원재료성 식품 |
| `dish.csv` | 음식 |
| `proc.csv` | 가공식품 |
| `prep.csv` | 품목제조보고 |

CSV가 없어도 앱은 그대로 빌드됩니다(`src/data/generated/gen_out.json`에 결과가 들어 있습니다).
