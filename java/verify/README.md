# 시설 대기 결과 회귀 검사

저장소 루트에서 실행한다. Java 검사는 이미 컴파일한 PM 도메인 · DTO · enum 클래스가 필요하다.
실제 백엔드 빌드 산출물 또는 별도로 컴파일한 참조 클래스 경로를 `PM_VERIFY_CLASSPATH`에 지정한다.
이 저장소에는 백엔드 빌드 설정이 없으므로 아래 명령은 변경 도메인과 검증 하네스만 컴파일한다.

```powershell
$verifyOut = Join-Path $env:TEMP 'pm-wtng-verify'
New-Item -ItemType Directory -Force -Path $verifyOut | Out-Null
javac -proc:none -encoding UTF-8 -classpath $env:PM_VERIFY_CLASSPATH -d $verifyOut `
    java/cast/domains/queue/QueueWaitWindow.java `
    java/cast/domains/queue/WaitAvgForecast.java `
    java/cast/domains/wtng/FcltWtngDay.java `
    java/verify/FcltWtngRegression.java
if ($LASTEXITCODE -ne 0) { throw 'Java 회귀 검사 컴파일 실패' }
java -cp "$verifyOut;$env:PM_VERIFY_CLASSPATH" aoms.pm.cast.verify.FcltWtngRegression
python java/verify/verify_chkn_booth_overnight.py
```

- Java 78개 검사: 등급 경계와 전후 값, 카드 · 팝업 · 예측 시작시각 평균 일치, 미관측 과거 이력,
  미확인 경계 큐 · 도착인원, 관측된 이력 복원, 확인된 빈 큐, 기존 생성자 호환.
- Python 28개 검사: 실제 Mapper의 CASE 식을 추출해 CAST 발행 SQL과 대조한다.
  익일 플래그, 자정 통과, LAST/EST 우선순위와 NULL 플래그를 검사한다.
  Python 표준 라이브러리 SQLite와 날짜 함수 대역을 사용하며 Oracle SQL 전체 실행 검증은 아니다.

Oracle DDL · 삽입, 실제 Spring 트랜잭션 연결, CAST 연계는 실제 환경에서 별도로 확인해야 한다.
