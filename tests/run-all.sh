#!/usr/bin/env bash
# 모든 점검을 실행한다. 종료 코드가 0이 아닌 파일이 하나라도 있으면 실패로 끝난다.
set -uo pipefail
cd "$(dirname "$0")/.."
export TEST_TMP="${TEST_TMP:-$PWD/.test-out}"
mkdir -p "$TEST_TMP"
rm -f "$TEST_TMP"/*.html   # 지난 실행의 페이지 파일이 남아 옛 빌드를 검사하지 않게
JOBS="${JOBS:-4}"
run(){ n="${1#tests/}"; out="$TEST_TMP/$(echo "$n" | tr '/' '_').log"
  if timeout 1500 node "$1" >"$out" 2>&1; then echo "PASS $n"; else echo "FAIL $n (로그: $out)"; fi }
export -f run; export TEST_TMP
FILES=$(ls tests/regression/*.cjs tests/checks/*.cjs)
echo "$FILES" | xargs -P "$JOBS" -I{} bash -c 'run {}' | sort -k2 | tee "$TEST_TMP/summary.txt"
FAILED=$(grep -c '^FAIL' "$TEST_TMP/summary.txt" || true)
TOTAL=$(grep -c . "$TEST_TMP/summary.txt" || true)
echo "----"; echo "$((TOTAL-FAILED))/$TOTAL 통과"
[ "$FAILED" -eq 0 ]
