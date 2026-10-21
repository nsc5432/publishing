# CAST REST API 로그 적용·검증

2026-10-21 계획의 D1~D6을 Java 참조 사본과 Oracle 적용 SQL에 구현했다.
이 저장소에는 백엔드 빌드·전역 예외 처리·Spring 트랜잭션/매퍼 스캔 설정과 DB 접속 정보가 없다.
실제 백엔드 컴파일·PMD·Oracle 적용·CAST 왕복 검증·구 테이블 제거는 아직 수행하지 않았다.

## 1. 호출과 저장 경계

`CastRestController`의 세 POST만 `CastRestApiExecutor`를 호출한다.
GET `_Test` 두 경로와 Delete는 기존 서비스를 직접 호출한다.
String/DTO 서비스 오버로드는 유지하며, 세 POST는 요청별 `CastRestApiContext`를 받는 오버로드를 사용한다.
새 모델은 `aoms.pm.castrest.log` 내부에만 두고 외부 XML/DTO 계약에 넣지 않았다.

실행기는 하이픈 없는 UUID `CL_ID`를 만들고 해당 API의 설정 세 행을 한 번 읽는다.
`CastRestLogSettings`는 조회 결과에서 활성 유형을 복사하므로 실행 중 설정이 바뀌어도 영향을 받지 않는다.
다음 요청은 설정을 새로 읽으며, 누락된 행은 N으로 취급한다.
설정 조회에 실패하면 해당 요청의 새 DB 로그 전체를 생략한다.

설정 조회와 개별 로그 INSERT는 별도 Bean인 `CastRestLogService`의 `REQUIRES_NEW` 프록시를 통과한다.
실행기는 업무 `CastRestService` 프록시가 반환한 뒤 result를 저장한다.
업무 트랜잭션 종료 예외가 전파되면 result를 만들지 않고 원래 예외를 다시 전파한다.
로그 조회·INSERT·커밋에서 포착한 예외는 서버 로거에 기록하고 업무 결과를 유지한다.
한 유형의 저장이 실패해도 나머지 활성 유형의 저장을 각각 한 번 시도하며 재시도나 재귀 DB 기록은 없다.
서버 로거의 실제 파일 출력은 배포 환경의 로깅 설정을 따른다.

## 2. 오류와 기존 동작

기존 Information/Resource/SetResource catch는 응답 XML과 단계 로그를 보존하면서 예외를 컨텍스트에 먼저 넣는다.
SetResource catch의 rollback-only 지정도 유지한다.
예외 없이 발생하는 미지원 리소스 유형과 결과 미저장 분기는 실패 사유를 넣는다.
미지원 GenericTable ID의 빈 응답과 비어 있는 WhatIf 상태 목록은 기존 정상 동작을 유지한다.
실패 XML을 문자열 검색하거나 재파싱해서 오류를 추정하지 않는다.

모델 파일 읽기 한 곳과 쓰기 두 곳의 IOException은 원인을 수집한 뒤 기존 처리를 계속한다.
읽기 실패 후 정상 XML 생성, 쓰기 실패 후 모델/첨부 DB 변경도 그대로 진행한다.
이 오류 수집은 rollback-only를 지정하지 않는다.
이후 다른 중단 예외가 발생해도 실행기가 가진 컨텍스트에서 앞선 파일 오류를 함께 기록한다.
기존 `TH_PM_SMLT_EXCN_LOG`와 파일 변경의 원자성은 새 로그 스위치의 제어 대상이 아니다.
SetResource의 `insertResult < 1` 분기는 원래 rollback-only가 없었고 현재 구현에서 항상 1을 반환한다.
이 분기에 새 롤백을 추가하지 않았다.

한 요청의 수집 오류를 API 유형·CL_ID와 함께 errorMsg CLOB 한 행으로 저장한다.
예외는 `printStackTrace`로 원인 체인·suppressed 예외·전체 스택을 보존한다.
업무 실패 사유에는 스택을 만들지 않는다.
요청·응답 본문을 errorMsg에 복사하지 않으며 payload/result는 수신·반환 문자열 그대로 전달한다.

실행기에서 전파 오류를 포착하는 범위는 `DataAccessException`, `TransactionException`,
`PersistenceException`, `IllegalStateException`, `IllegalArgumentException`, `SecurityException`이다.
XML/IO checked 예외는 기존 catch와 원인 포함 예외 변환에서 수집된다.
로그 서비스 장애 격리는 위 목록 중 `SecurityException`을 제외한 예외를 대상으로 한다.
포괄 catch를 추가하지 않았으므로 NPE 등 목록 밖 예외의 DB 기록을 보장하지 않는다.
예를 들어 형식상 유효한 XML에서도 resourceType이 없으면 기존 switch/equals가 NPE를 던질 수 있다.
이 경로의 응답 처리는 바꾸지 않았으며 새 DB errorMsg 포착 범위에 포함되지 않는다.
실제 전역 예외 처리와 연계할 수 있는지는 백엔드 원본에서 확인해야 한다.

## 3. Oracle 적용과 전환

1. PMOWN으로 `java/ddl/2026-10-21-castrest-api-log-preflight.sql`을 실행해 구 테이블 DDL·컬럼·제약·인덱스·권한·동의어·의존성을 확보한다.
   출력 결과는 구버전 앱 롤백 시 빈 테이블을 복구할 수 있도록 보관한다. 구 로그 데이터는 이관/백업하지 않는다.
   `ALL_*` 조회는 현재 계정에 보이는 범위이므로 DBA가 다른 스키마·DB 링크·외부 조회/배치와 구버전 인스턴스도 확인한다.
2. 표준단어에 맞춘 물리명·자료형·공통 감사 컬럼 정책을 실제 스키마와 대조한다.
   신규 DB는 최신 `cast-ddl.sql`, 기존 DB는 `2026-10-21-castrest-api-log.sql` 중 하나만 적용한다.
   마이그레이션은 신규 객체가 있으면 중단하며 DDL 자동 커밋 때문에 실패 시 이미 생성된 객체를 먼저 확인한다.
3. 설정/로그 테이블, 로그 시퀀스, 제약, 등록일시 인덱스와 초기 9행이 생성됐는지 확인한다.
   초기 `USE_YN`은 모두 N이다. 앱이 PMOWN 외 계정이면 실제 앱 계정/롤에 필요한 권한을 부여한다.
   앱에는 설정 SELECT, 로그 INSERT, 시퀀스 SELECT가 필요하며 운영 계정에는 설정 변경 권한을 부여한다.
   계정 이름을 알 수 없어 권한 대상을 SQL에 고정하지 않았다. 새 매퍼도 `PMOWN.`으로 스키마를 지정한다.
4. 실제 백엔드에 새 `CastRestLogMapper.xml` 등록/스캔과 로그 서비스 Bean·트랜잭션 적용을 확인한 뒤 배포한다.
   별도의 전역 트랜잭션/AOP가 실행기 전체를 감싸지 않는지 확인한다.
   이때 구 테이블은 남겨 둔다.
5. `2026-10-21-castrest-api-log-setting.sql`의 `api_type_cd`, `msg_type_cd`, `use_yn`을 수정해 실행한다.
   기본 예시는 `GetResource/errorMsg/N`이다. MERGE는 누락된 설정도 복원하고 수정일시를 함께 기록한다.
   COMMIT 후 다음 요청부터 반영되는지 검증한다.
6. 아래 통합 검증을 마친 뒤 구버전 앱·외부 의존성·구 테이블 관련 권한/동의어를 다시 확인한다.
   구 테이블 제거는 이 저장소의 마이그레이션에 포함하지 않았으며, 사용 종료 확인 후 운영자가 별도로 실행한다.

```sql
DROP TABLE PMOWN.TT_PM_CASTREST_REQ_DEBUG;
```

`PURGE`나 구 데이터의 신규 유형 추정 이관은 하지 않는다.
테이블 제거 전에는 구버전 앱으로 돌아갈 수 있다.
제거 후에는 확보한 실제 DDL·권한·동의어로 빈 구 테이블을 먼저 복구해야 한다.
폐기된 구 로그 데이터의 복원은 대상이 아니다.
새 로그에는 보관기한·자동 삭제 배치를 두지 않으며 운영자가 필요할 때 기간·대상을 정해 삭제한다.

호출별 확인 예시:

```sql
SELECT LOG_SN, CL_ID, API_TYPE_CD, MSG_TYPE_CD,
       DBMS_LOB.GETLENGTH(LOG_CN) LOG_LENGTH, FRST_REG_DT
FROM PMOWN.TH_PM_CASTREST_LOG
WHERE CL_ID = :clId
ORDER BY LOG_SN;
```

## 4. 검증 범위

JDK 17과 Python으로 저장소 루트에서 실행한다.

```text
python java/verification/castrest-api-log/verify.py
```

로컬 검증은 실제 실행기·컨텍스트·설정 모델을 컴파일해 호출한다.
Spring/MyBatis 예외·Component·SLF4J는 임시 대체 클래스이고 로그 서비스도 메모리 대역이다.
임시 파일은 실행 후 지운다. 백엔드 전체 컴파일이나 실제 Spring/Oracle 검증을 대신하지 않는다.

- 세 API × 스위치 8조합 × 정상/파일 오류/실패 XML/복수 오류 조합.
- 설정 누락, 요청 내 스냅샷, 다음 요청의 변경 반영, 빈 응답과 응답 부재 구분.
- 파일 오류 수집 후 최종 DB/트랜잭션 예외 전파와 원래 예외 보존.
- 설정 조회와 각 유형의 INSERT/커밋 실패를 대신하는 예외 주입, 비재귀 처리.
- 한글·개행·XML 특수문자·대형 문자열 보존, 요청 120개의 동시 실행 분리.
- 매퍼 XML 구문, 기준 DDL/마이그레이션 일치, 범위 밖 경로 보존, 포괄 catch 금지.
- `java/castrest` 소스의 JDK 구문 파싱. 의존성/타입/어노테이션 처리 검증은 제외한다.

실제 환경에서는 다음을 별도로 검증한다.

- 백엔드 컴파일·PMD, Bean/매퍼 스캔, 트랜잭션 관리자와 전역 예외 처리 설정.
- 신규 DDL·제약/권한·초기 9행, 대형 CLOB의 실제 DB 왕복 보존.
- 세 API의 정상·잘못된 XML·없는 모델/PropertySet·미지원 리소스·결과 미저장·DB/커밋 실패.
- 파일 읽기/신규 쓰기/덮어쓰기 실패 후 응답·후속 DB 처리·커밋 판단과 errorMsg 스위치 동작.
- SetResource 실패의 업무 롤백 및 새 로그의 독립 커밋. 초기화·단계 로그 실패의 원인 기록.
- 로그용 SELECT/INSERT/커밋 실패에도 업무 성공/실패가 유지되고 서버 파일에 장애가 출력되는지 확인.
- GET 테스트·Delete·기존 단계 로그·외부 응답 형식 유지, 동시 호출 시 연결 풀·지연·저장량.
- 구버전/외부 의존성 종료와 최종 구 테이블 제거 및 빈 테이블 복구 절차.
