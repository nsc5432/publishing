# 시설 대기 결과 회귀 검사

저장소 루트에서 실행한다. Java 검사는 이미 컴파일한 PM 도메인 · DTO · enum 클래스가 필요하다.
실제 백엔드 빌드 산출물 또는 별도로 컴파일한 참조 클래스 경로를 `PM_VERIFY_CLASSPATH`에 지정한다.
Lombok JAR 경로는 `PM_VERIFY_LOMBOK_JAR`에 지정한다. `FcltWtngSec`의 getter · builder 생성에 필요하다.
이 저장소에는 백엔드 빌드 설정이 없으므로 아래 명령은 변경 도메인과 검증 하네스만 컴파일한다.

```powershell
$verifyOut = Join-Path $env:TEMP 'pm-wtng-verify'
New-Item -ItemType Directory -Force -Path $verifyOut | Out-Null
javac -encoding UTF-8 -classpath "$env:PM_VERIFY_CLASSPATH;$env:PM_VERIFY_LOMBOK_JAR" `
    -processorpath $env:PM_VERIFY_LOMBOK_JAR -d $verifyOut `
    java/cast/domains/chkn/ChknWtngSecBuilder.java `
    java/cast/domains/dsbd/DepWtngSecBuilder.java `
    java/cast/domains/queue/QueueWaitWindow.java `
    java/cast/domains/queue/WaitAvgForecast.java `
    java/cast/domains/wtng/FcltWtngDay.java `
    java/cast/domains/wtng/FcltWtngSec.java `
    java/cast/domains/wtng/FcltWtngSecs.java `
    java/cast/dto/FcltWtngRsltDto.java `
    java/cast/service/impl/FcltWtngRsltRows.java `
    java/verify/FcltWtngRegression.java `
    java/verify/FcltWtngRsltRowsRegression.java
if ($LASTEXITCODE -ne 0) { throw 'Java 회귀 검사 컴파일 실패' }
java -cp "$verifyOut;$env:PM_VERIFY_CLASSPATH" aoms.pm.cast.verify.FcltWtngRegression
java -cp "$verifyOut;$env:PM_VERIFY_CLASSPATH" aoms.pm.cast.service.impl.FcltWtngRsltRowsRegression
python java/verify/verify_chkn_booth_overnight.py
```

- Java 시설 대기 검사: 등급 경계와 전후 값, 카드 · 팝업 · 예측 시작시각 평균 일치, 미관측 과거 이력,
  미확인 경계 큐, 관측된 이력 복원, 확인된 빈 큐, 기존 생성자 호환.
  `SEC_END_DT` 기준 10:10 · 당일 자정 · 익일 자정 경계, 직전 10분과 향후 30분 · 1시간 집계,
  체크인 · 출국장 원천 변환, 저장 범위 완전성과 잔여 대기열 복원을 포함한다.
- Java 정수 시간 합계 검사: 종료시각과 수치의 저장 · 조회 변환, 소수 · 비유한 합계 거부, 기존 소수 평균 보존,
  12자리 최댓값 허용 및 시간 · 큐 · 용량 · 운영대수 합계의 범위 초과 거부.
- Python 26개 검사: 공용 조각(`cknctDailyAlotWindowRows` · `cknctDailyAlotActualRows`)의 시각 선택 · 분 · 일시 식을 추출해 계산하고,
  CAST 발행 · 체크인 운영 부스 · 대시보드 항공사 배정이 그 일시(`ALOT_BGN_DT` · `ALOT_END_DT`)를 읽는지 확인한다.
  자정 통과, 종료 `2400`, 원천 RON 플래그 무시, 예정/최종 한 벌 선택과 일부만 있는 예정 시각, 시작 = 종료 · 형식 오류 제외를 검사하고,
  사용자 체크인 기본 운영시간(`retrieveChknList`)이 같은 시각 선택 식을 쓰는지,
  `CHKN_ALOT` 을 읽는 statement 가 WITH 에 `gdDataChknAlotWith` 를 두는지 확인한다.
  `cknctDailyAlotActualRows` 는 SQLite 에서 실제로 실행해 무작위 배정 500벌의 남는 행을 원래 규칙(나중 행과 겹치면 버림)의 전수 계산과 대조한다.
  Python 표준 라이브러리 SQLite와 날짜 함수 대역을 사용하며 Oracle SQL 전체 실행 검증은 아니다.

Oracle DDL · 삽입, 실제 Spring 트랜잭션 연결, CAST 연계는 실제 환경에서 별도로 확인해야 한다.
