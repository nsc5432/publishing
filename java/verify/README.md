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

- Java 76개 검사: 등급 경계와 전후 값, 카드 · 팝업 · 예측 시작시각 평균 일치, 미관측 과거 이력,
  미확인 경계 큐, 관측된 이력 복원, 확인된 빈 큐, 기존 생성자 호환.
- Java 37개 정수 시간 합계 검사: 저장 · 조회 변환, 소수 · 비유한 합계 거부, 기존 소수 평균 보존,
  12자리 최댓값 허용 및 시간 · 큐 · 용량 · 운영대수 합계의 범위 초과 거부.
- Python 28개 검사: 실제 Mapper의 CASE 식을 추출해 CAST 발행 SQL과 대조한다.
  익일 플래그, 자정 통과, LAST/EST 우선순위와 NULL 플래그를 검사한다.
  Python 표준 라이브러리 SQLite와 날짜 함수 대역을 사용하며 Oracle SQL 전체 실행 검증은 아니다.

Oracle DDL · 삽입, 실제 Spring 트랜잭션 연결, CAST 연계는 실제 환경에서 별도로 확인해야 한다.

대시보드 조회 구간 요약은 `python java/verify/verify_dsbd_interval.py`로 검사한다.
실제 Mapper SQL을 SQLite에서 실행해 동시 대기인원 최대, 처리 가중평균, 공정별 처리합,
조회 구간 경계, 모델·터미널 필터, 미관측·0명·대기시간 누락, 자정 종료를 확인한다.
Oracle 연결과 Java DTO 매핑은 실제 백엔드에서 추가 검증해야 한다.
