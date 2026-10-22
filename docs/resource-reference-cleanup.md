# 리소스 참조 방식 정리 — 2026-10-16

## 최종 테이블 목록

이번 변경에서 런타임과 신규 설치 DDL에서 제거한 테이블은 다음 9개다.
실제 운영 DB의 DROP은 수행하지 않았으며 별도 전환 SQL을 제공한다.

| 제거 테이블 | 대체 방식 |
|---|---|
| PMOWN.TN_PM_SMLT_COND_SNAPSHOT | STNG 우선, 결과 없는 실행은 USER_MSTR의 리소스 ID로 원천 조회 |
| PMOWN.TN_PM_SMLT_INPUT_SNAPSHOT | CAST 요청 시 지정된 원천 리소스로 XML 생성 |
| PMOWN.TN_PM_SMLT_RSRC_LEASE | 번호를 재사용하지 않는 신규 할당. USER_MSTR가 사용자 PS와 시설 리소스의 관계를 관리 |
| PMOWN.TN_PM_SMLT_CURRENT_SAVE | 현재상태 부모 행이 없으면 운영자료 사용. 저장시각은 남아 있는 부모 행에서 계산 |
| PMOWN.TN_PM_SMLT_RESULT_IDENTITY | CAST는 결과를 재전송하지 않는다. 동일 실행·모델의 중복 결과는 기존 STNG 검사로 거부 |
| PMOWN.TN_PM_SMLT_ID_LOCK | 직렬화 잠금 없음. 리소스 번호는 USER_MSTR·STNG에 쓰인 최대 번호에서 계산 |
| PMOWN.TN_PM_SMLT_RESULT_GROUP | 일일(Auto)은 Run 하나에 모델 1개. 결과마다 새 공통 ID |
| PMOWN.TN_PM_SMLT_CAST_CONTRACT | 결과 묶음이 없어져 활성화 검사도 제거 |
| PMOWN.TN_PM_SMLT_INPUT_BASE | 사용자 실행의 고정 리소스는 일일과 같은 001 원천. 코드 상수로 두고 USER_MSTR에 실행별로 기록 |

PMOWN.TN_PM_SMLT_MSTR는 앞선 공통 마스터 제거 작업에서 제거한 테이블이다.
이번 9개와 합치면 최초 검토한 10개가 모두 제거된 구조다.

## 리소스 정책

FS001은 매일 갱신할 수 있는 일일 시뮬레이션 세트다. 그 외 지정된 리소스 ID는
새 실행을 위해 자동으로 덮어쓰거나 재사용하지 않는다. 의도된 원천 변경은 조건 조회와 CAST 응답에 반영한다.
일일 세트에 속한 기존 CA001·SBD001·시설 운영자료의 날짜별 렌더 경로는 유지한다.

FS002~999와 PS500~998의 기존 CAST ID 계약은 유지한다. USER_MSTR·STNG에 쓰인 최대 번호 다음의
미사용 번호를 선택하고, 그 위가 차면 가장 작은 미사용 번호로 돌아간다. 요청·결과·원천 테이블에 이미 존재하는 번호는 제외한다.
실행 상태가 Finished/Failed여도 행이 남아 있는 번호는 재사용하지 않는다. 롤백되어 발행되지 않은 번호는 재사용 가능하다.
FS는 998개, PS는 499개로 한정되므로 빈 번호가 없으면 실행 등록이 실패한다. 운영자가 오래된 실행을 정리하면
비운 번호가 다른 내용으로 다시 CAST에 전달된다. 번호 확대는 CAST 계약과 별도 변경 대상이다.

## 실행·조건 조회

현재상태 자동 저장과 양 터미널 조건 확정은 기존처럼 한 트랜잭션으로 처리한다.
메모리에서 확정한 DTO로 신규 리소스를 발행하고 이력과 요청을 등록한다. JSON이나 XML 사본을 저장하지 않는다.
발행 실패 시 현재상태 자동 저장과 리소스·이력·요청도 롤백된다.

모니터링의 조건 보기와 공개 조건 API는 유지한다. STNG의 모델·터미널별 참조를 우선 읽고,
결과가 없는 실행은 USER_MSTR를 읽는다. 전달된 ymd 대신 실행의 EXCN_YMD를 사용한다.
현재 편집 테이블을 과거 조건 대신 읽지 않는다.

현재상태의 체크인·출국장은 부모 행이 없으면 운영자료를 사용한다. 빈 배열 저장과 미저장을 구분하지 않는다.
빈 배열을 저장하면 해당 영역의 부모·자식 행을 삭제하고, 다음 조회와 실행에서는 운영자료를 사용한다.
부모 행을 남기고 전체 미운영으로 설정한 조건은 그대로 사용한다. 공개 실행 조건에는 이 대체 규칙을 적용하지 않는다.
`saveDt`는 남아 있는 운항·체크인·출국장 부모 행의 `NVL(LAST_MDFCN_DT, FRST_REG_DT)` 최댓값이다.
남은 행이 없으면 빈 문자열이며 빈 저장 시각을 별도로 기록하지 않는다.

- 운항: 지정 FS의 국제선 출발 운항과 조정이 반영된 여객수를 조회한다. 조정률을 다시 적용하지 않으며 조회 화면에서 원래 조정률은 표시하지 않는다.
- 체크인: 지정 CA·SBD의 부스·항공사·기기·운영구간을 조회한다. 발행되지 않은 미배정 부스는 조회에 포함하지 않는다.
- 출국장: 지정 DepartureGate·SecurityControl의 수량과 운영구간을 조회한다. 미운영 출국장은 발행 입력에 포함하지 않는다.
- 일반·스마트패스 수량: 신규 발행 시 기존 DPTGT_ATRB의 GNRL_SRCH_CNTOM·SMART_PASS_SRCH_CNTOM에 함께 저장한다. CAST의 FCLTY_CNT 합계는 유지한다. 기존 행의 분리 수량은 복원할 근거가 없으므로 조회 시 합계를 일반 칸에 표시하고 스마트패스는 0으로 표시한다.

## PropertySet 제공

원천 PS는 CastApiServiceImpl.DAILY_PRPT_SET_RSRC_ID의 PS001로 고정하며 USER_MSTR에 원천 PS ID를 저장하지 않는다.
CAST가 사용자 PS를 요청하면 PS001을 렌더하고 PS ID와 SBD·DepartureGate·SecurityControl·Immigration·TransferSecurityControl
참조를 해당 요청의 리소스 ID로 바꿔 반환한다. 모델·서비스시간·체크인유형·출국심사·리포팅은 기존 원본 ID를 사용한다.
PS001 내용의 의도된 변경은 기존 실행의 PS 재조회에도 반영된다.
2026-10-17 SRC_PRPT_SET_RSRC_ID를 제거했다. 기존 실행도 PS001을 사용하므로 다른 원천을 사용하던 실행은 전환 전에 확인한다.

## DB 적용

신규 DB는 최신 java/ddl/cast-ddl.sql을 사용한다. 기존 DB는 공통 마스터 제거를 완료한 상태에서
java/ddl/2026-10-16-remove-smlt-snapshots.sql과 java/ddl/2026-10-17-remove-user-source-property-set.sql을 순서대로 적용한다.
이미 스냅샷 제거를 완료한 DB는 2026-10-17 스크립트만 적용한다. 구 stage·executions·verify·cutover는 역사적 기록이다.

1. 검증 DB에서 실제 백엔드를 빌드하고 SQL과 CAST 왕복을 검증한다. 이 저장소의 Java는 참조 사본이며 여기서 컴파일할 수 없다.
2. 화면 저장·실행과 CAST polling·상태·결과 수신을 정지한다. 활성 요청과 Finished 후 결과 미도착 요청을 완료한다.
3. 전체 스키마·권한·트리거를 독립 백업한다. 스크립트의 CTAS는 데이터 보존용이며 전체 백업을 대신하지 않는다.
4. 기존 PS ID가 여러 사용자 요청에 재사용됐다면 먼저 ID를 분리하고 USER_MSTR·STNG·관련 참조를 대조한다. 전환 스크립트는 이 경우 임의로 요청을 선택하지 않고 중단한다.
5. 기존 실행에 사용할 원천 PS는 이전 INPUT_SNAPSHOT의 SOURCE_ID를 우선 이관한다. 사본이 없으면 기존 일반 PS 참조, 마지막으로 INPUT_BASE의 날짜 유효 설정을 사용한다. 원래 XML과 대조해 승인한 현재 참조인지 확인한다. 스크립트는 원천 PS 형식과 등록 여부를 검사하고 기간별 설정이 여러 건이면 실패한다. 과거에 덮어쓴 원천이 자동 복원된다고 간주하지 않는다.
6. PMOWN 스키마에서 전환 SQL을 실행한다. 알려지지 않은 DB 객체·외래키 의존성을 검사하고 다음 백업을 생성·대조한 뒤 컬럼을 추가하고 참조를 채운다.

| 원본 | 전환 시 데이터 백업 |
|---|---|
| COND_SNAPSHOT | TN_PM_SMLT_COND_BAK_1016 |
| INPUT_SNAPSHOT | TN_PM_SMLT_INPUT_BAK_1016 |
| RSRC_LEASE | TN_PM_SMLT_LEASE_BAK_1016 |

7. SQL은 기존 요청·결과·lease의 최댓값을 커서에 반영한다. 할당 시 원천에 이미 있는 번호도 검사한다. 기존 SQ1_TN_PM_SMLT_USER_RSRC가 있으면 NOCYCLE로 바꾸지만 새 런타임은 이 시퀀스를 사용하지 않는다.
8. java/ddl/2026-10-17-remove-user-source-property-set.sql을 실행한다. 이 스크립트는 이관된 원천이 모두 PS001이고 사용 가능한 PS001 그룹이 있을 때만 원천 PS 컬럼을 삭제한다. 다른 원천이나 NULL이 있으면 중단하므로 해당 실행의 PS001 전환 여부를 먼저 확인한다. 컬럼이 이미 없으면 건너뛴다.
9. 세 원본 테이블과 원천 PS 컬럼을 제거한 뒤 새 백엔드를 배포한다. 현재상태 저장·실행·실패 롤백·조건 보기·의도된 PS001 변경 반영·CAST 리소스 목록과 PS 응답·결과 수신·동일 실행·모델 중복 결과 거부를 확인한다.

Oracle DDL은 전체 트랜잭션 롤백 대상이 아니다. 중단되면 서비스를 정지한 채 이미 적용된 컬럼·백업·DROP 상태를 확인한다.
복구는 독립 전체 백업을 우선 사용한다. 데이터 백업으로 복구할 경우 원본 PK와 USER_MSTR의 지연 검사 FK도 복원해야 한다.
구 백엔드를 배포하기 전에 세 원본과 참조 정합성을 확인하며 실행 ID 시퀀스를 뒤로 되돌리지 않는다.
원천 PS 컬럼을 사용하던 백엔드로 복구할 때는 서비스 정지 상태에서 SRC_PRPT_SET_RSRC_ID VARCHAR2(100)을 다시 추가하고 PS001로 채운 뒤 배포한다. 다른 원천에서 PS001로 전환한 이력이 있다면 해당 실행은 독립 백업의 원래 값으로 복구한다.

### CURRENT_SAVE 제거 적용

기존 DB는 화면 저장·실행을 정지하고 전체 스키마를 백업한 뒤
`java/ddl/2026-10-16-remove-current-save.sql`을 PMOWN 스키마에서 실행한다.
앞선 공통 마스터·리소스 참조 전환이 필요한 DB는 해당 전환을 먼저 마친다.
스크립트는 외래키·DB 객체 의존성을 검사하고 `TN_PM_SMLT_SAVE_BAK_1016`에 데이터 백업을 만든다.
건수와 모든 컬럼의 양방향 차이가 없는지 확인한 뒤 원본 테이블을 제거한다. 조건 테이블의 행은 변경하지 않는다.
SQL은 여기서 실제 실행하지 않았다. 새 백엔드 배포 후 빈 저장·미저장 대체, 전체 미운영 조건,
사용자·일자·터미널 격리, 영역별 독립 저장과 실행 실패 롤백을 확인한다.

복구 시 전체 스키마 백업을 우선 사용한다. 데이터 백업만 사용하는 경우 서비스 정지 상태에서
`CREATE TABLE PMOWN.TN_PM_SMLT_CURRENT_SAVE AS SELECT * FROM PMOWN.TN_PM_SMLT_SAVE_BAK_1016`으로 복원하고,
`PRIMARY KEY (OWNER_USER_ID, EXCN_YMD, TMNL_ID, AREA_CD)`와 기존 권한·객체를 복구한 뒤 구 백엔드를 배포한다.
새 구조 운영 중의 빈 저장 여부·시각은 기록하지 않으므로, 과거 백업만으로 전환 이후의 저장 표시를 복원할 수 없다.

### RESULT_IDENTITY 제거 적용

CAST는 결과를 재전송하지 않으므로 원천 식별키·XML 원문 해시 저장과 재수신 성공 처리를 제거했다.
사용자 요청과 결과의 날짜·모델·입력 리소스 대조, 동일 실행·모델의 STNG 존재 검사,
일일·Manual 결과의 RESULT_GROUP 연결과 결과·이력·요청 완료의 단일 트랜잭션은 유지한다.
중복 결과는 내용 비교나 덮어쓰기 없이 실패 응답한다.

신규 DB는 최신 cast-ddl.sql을 사용한다. 기존 DB는 앞선 전환이 필요한 경우 먼저 완료하고,
CAST 결과 수신을 정지한 상태에서 전체 스키마·권한·객체를 백업한 뒤
`java/ddl/2026-10-16-remove-result-identity.sql`을 PMOWN 스키마에서 실행한다.
스크립트는 DB 객체·외래키 의존성을 검사하고 `TN_PM_SMLT_RSID_BAK_1016`에 데이터를 보존한다.
건수와 세 컬럼의 양방향 차이가 없는지 확인한 뒤 원본만 제거한다. STNG·결과·이력은 변경하지 않는다.
새 백엔드 배포 후 사용자·일일 결과 저장, 동일 실행·모델 중복 거부와 요청 불일치 거부를 확인한다.
이 저장소에서 실제 Oracle 실행과 백엔드 빌드를 완료한 것으로 간주하지 않는다.

복구 시 전체 스키마 백업을 우선 사용한다. 데이터 백업만 사용하는 경우 결과 수신을 정지한 상태에서
`CREATE TABLE PMOWN.TN_PM_SMLT_RESULT_IDENTITY AS SELECT * FROM PMOWN.TN_PM_SMLT_RSID_BAK_1016`으로 복원하고,
`PRIMARY KEY (SOURCE_KEY)`·`PAYLOAD_HASH NOT NULL`과 기존 권한·객체를 복구한 뒤 구 백엔드를 배포한다.
전환 이후 결과의 원천키·해시는 기록하지 않으므로 과거 백업만으로 해당 기록을 복원할 수 없다.

### ID_LOCK 제거 적용

EXECUTION 행 잠금과 RSRC_FS·RSRC_PS의 LAST_NO를 제거했다. 다음을 감수하는 결정이다.

| 포기한 보호 | 제거 후 동작 |
|---|---|
| 동시 실행의 번호 할당 | 두 실행이 같은 FS·PS 번호를 고르면 늦은 쪽이 원천 ATRB PK 위반으로 롤백된다. PS 번호도 같은 트랜잭션이라 함께 롤백된다 |
| 일일·Manual 결과 동시 도착 | 같은 묶음의 결과가 동시에 오면 한쪽이 RESULT_GROUP PK 위반으로 롤백된다. 재전송이 없으므로 수신함 원문으로 수동 처리한다 |
| 같은 사용자의 저장·실행 동시 수행 | 실행이 저장 도중의 현재상태를 읽을 수 있다 |
| 삭제된 번호의 재사용 금지 | 오래된 실행을 정리해 비운 번호는 빈 번호가 없을 때 다시 할당된다 |

결과 수신과 WhatIf 상태 통보는 같은 USER_MSTR 행을 갱신하므로 행 잠금으로 순서가 정해진다.
동일 실행·모델의 중복 결과는 STNG PK가 거부한다.

신규 DB는 최신 cast-ddl.sql을 사용한다. 기존 DB는 앞선 전환을 먼저 완료하고, 화면 저장·실행과 CAST 결과 수신을 정지한 상태에서
전체 스키마·권한·객체를 백업한 뒤 `java/ddl/2026-10-16-remove-id-lock.sql`을 PMOWN 스키마에서 실행한다.
스크립트는 DB 객체·외래키 의존성을 검사하고, LAST_NO가 USER_MSTR·STNG에 쓰인 최대 번호보다 크면 중단한다.
그 사이 번호는 제거 후 다시 할당되므로 CAST에 보낸 적이 있는지 확인한 뒤 진행한다.
`TN_PM_SMLT_LOCK_BAK_1016`에 데이터를 보존하고 건수와 두 컬럼의 양방향 차이를 확인한 뒤 원본만 제거한다.
새 백엔드 배포 후 사용자 실행의 번호 할당·저장·결과 수신·상태 통보를 확인한다.
이 저장소에서 실제 Oracle 실행과 백엔드 빌드를 완료한 것으로 간주하지 않는다.

복구 시 전체 스키마 백업을 우선 사용한다. 데이터 백업만 사용하는 경우 서비스 정지 상태에서
`CREATE TABLE PMOWN.TN_PM_SMLT_ID_LOCK AS SELECT * FROM PMOWN.TN_PM_SMLT_LOCK_BAK_1016`으로 복원하고
`PRIMARY KEY (LOCK_ID)`를 복구한다. 전환 이후 할당한 번호가 있으면 RSRC_FS·RSRC_PS의 LAST_NO를
USER_MSTR의 최대 번호로 맞춘 뒤 구 백엔드를 배포한다.

### RESULT_GROUP·CAST_CONTRACT 제거 적용

일일(Auto) 실행은 Run 하나에 모델 결과 1건을 보낸다(2026-10-12 확인).
그래서 결과 묶음과 그 활성화 스위치를 함께 제거하고, 결과마다 `SQ1_TN_PM_SMLT_RSLT`로 새 ID를 받는다.
RunID 빈값 검사도 묶음 키에만 쓰였으므로 제거했다. 다음을 감수하는 결정이다.

| 포기한 기능 | 제거 후 동작 |
|---|---|
| 다중 모델 결과의 한 실행 묶음 | 모델 결과마다 별도 실행이 된다. 요약보기 기준 ID는 일자의 `MAX(SMLT_ID)` 하나다 |
| 같은 Run 결과의 중복 수신 거부 | 같은 결과가 두 번 오면 실행 2건으로 저장된다. CAST는 재전송하지 않는다 |
| 검증 전 일일(Auto) 결과 저장 차단 | 차단 없이 저장한다. 신규 DB에서 계약 행이 없어 결과가 전부 실패하던 문제도 함께 사라진다 |

다중 모델을 도입하게 되면 새 테이블 없이 STNG의 `SMLT_TYPE`·`EXCN_ID`(RunID)·`PLAN_BGNG_DT`·`PLAN_END_DT`·
`SMLT_BGNG_DT`·`SMLT_END_DT`·`FLT_SCHDL_RSRC_ID` 조회로 기존 ID를 찾을 수 있다. 시각은 초 단위로 잘려 저장된다.

신규 DB는 최신 cast-ddl.sql을 사용한다. 기존 DB는 앞선 전환을 먼저 완료하고, CAST 결과 수신을 정지한 상태에서
전체 스키마·권한·객체를 백업한 뒤 `java/ddl/2026-10-16-remove-result-group.sql`을 PMOWN 스키마에서 실행한다.
스크립트는 두 테이블의 DB 객체·외래키 의존성과, RESULT_GROUP으로 묶인 실행에 STNG 모델 행이 둘 이상인지 검사한다.
다중 모델 실행이 있으면 단일 모델 전제가 깨진 것이므로 중단한다. `TN_PM_SMLT_RGRP_BAK_1016`·`TN_PM_SMLT_CNTR_BAK_1016`에
데이터를 보존하고 건수와 모든 컬럼의 양방향 차이를 확인한 뒤 원본만 제거한다.
새 백엔드 배포 후 일일(Auto) 결과 저장과 사용자(WhatIf) 결과 연결을 확인한다.
이 저장소에서 실제 Oracle 실행과 백엔드 빌드를 완료한 것으로 간주하지 않는다.

복구 시 전체 스키마 백업을 우선 사용한다. 데이터 백업만 사용하는 경우 결과 수신을 정지한 상태에서
두 백업을 CTAS로 원본 이름에 복원하고 `PRIMARY KEY (GROUP_KEY)`·`PRIMARY KEY (CONTRACT_ID)`와
`VERIFIED_YN`의 기본값·CHECK를 복구한 뒤 구 백엔드를 배포한다. 전환 이후 결과의 묶음 키는 기록하지 않는다.

### INPUT_BASE 제거 적용

일일 시뮬레이션은 001 원천 고정이고, 사용자 실행은 KPI 비교를 위해 같은 원천을 쓴다. 그래서 사용자가 편집하지 않는
리소스를 소스 상수로 고정하고 날짜 유효 설정 테이블을 제거했다.
원천 PS 상수는 현재 `CastApiServiceImpl`, 나머지는 `CastUserSnapshotServiceImpl`에 있다.
실행별로 쓴 조합은 USER_MSTR의 리소스 컬럼에 남으며, 원천 PS ID는 2026-10-17에 제거했다.

| 항목 | 고정값 |
|---|---|
| 모델 | `ICN001` |
| 원천 PropertySet | `PS001` |
| 서비스시간 · 체크인유형 | `CheckinCounterServiceTime001` · `CheckinType001` |
| 출국심사 | `FacilityOpeningTable_Emigration001` |
| 입국심사 · 환승보안 번호 복사 원천 | `FacilityOpeningTable_Immigration001` · `FacilityOpeningTable_TransferSecurityControl001` |
| 리포팅 | `ReportingProfilesTimeGroups001` |

리포팅 ID는 PS에 참조가 없고 CAST 결과에도 실리지 않아 WhatIfDefinitionTable 칸으로만 전달된다.
다음을 감수하는 결정이다.

| 포기한 기능 | 제거 후 동작 |
|---|---|
| 날짜 구간별 기본 조합 전환 | 바꾸려면 상수를 고쳐 배포한다. 일일도 001 고정이라 실제 전환 수요가 없다 |
| 운영 중 DB 행으로 조합 변경 | 코드 배포가 필요하다 |
| 기본 조합의 필수값·PS 범위 검사 | 상수라 항상 성립해 제거했다 |
| 실행 등록 시 리소스 렌더 검사 (capture) | 발행한 번호 리소스와 001 원천 13개를 미리 렌더해 비었거나 깨졌으면 실행을 거부하던 검사를 제거했다. 운항 자료 누락·001 원천 삭제 같은 문제는 요청이 New로 등록된 뒤 CAST 단계에서 드러나며, 그 사이 FS·PS 번호를 쓴다. CAST가 빈 입력으로 완료하면 결과가 DONE으로 남을 수 있다 |

`captureResource`는 사용자 PS 응답 렌더에만 쓰이므로 `CastApiService` 인터페이스에서 내리고 비공개로 바꿨다.

신규 DB는 최신 cast-ddl.sql을 사용한다. 기존 DB는 앞선 전환(특히 INPUT_BASE를 읽는 `remove-smlt-snapshots.sql`)을
먼저 완료하고, 화면 실행을 정지한 상태에서 전체 스키마·권한·객체를 백업한 뒤
`java/ddl/2026-10-16-remove-input-base.sql`을 PMOWN 스키마에서 실행한다.
스크립트는 DB 객체·외래키 의존성과, 활성 행이 위 상수와 다른지 검사한다. 다르면 제거 후 실행 입력이 바뀌므로 중단한다.
`TN_PM_SMLT_IBASE_BAK_1016`에 데이터를 보존하고 건수와 모든 컬럼의 양방향 차이를 확인한 뒤 원본만 제거한다.
새 백엔드 배포 후 사용자 실행 등록·USER_MSTR 리소스 컬럼·CAST의 PS·입국심사·환승보안 응답을 확인한다.
이 저장소에서 실제 Oracle 실행과 백엔드 빌드를 완료한 것으로 간주하지 않는다.

복구 시 전체 스키마 백업을 우선 사용한다. 데이터 백업만 사용하는 경우 실행을 정지한 상태에서
`CREATE TABLE PMOWN.TN_PM_SMLT_INPUT_BASE AS SELECT * FROM PMOWN.TN_PM_SMLT_IBASE_BAK_1016`으로 복원하고
`PRIMARY KEY (BASE_ID)`, 필수 컬럼 NOT NULL, `USE_YN` 기본값·CHECK, `VALID_BGN_YMD <= VALID_END_YMD` CHECK를 복구한 뒤
구 백엔드를 배포한다.

## 검증 범위

- React 타입 검사, 전체 lint, Vite dev 빌드 통과.
- 사용자 시뮬레이션 시나리오 36개 통과. 양 터미널 자동 저장·실패 원복·공개 리소스 조회·의도된 원천 변경 반영,
  체크인·출국장 빈 저장과 빈 자동 저장의 운영자료 대체, 전체 미운영 조건 유지, 남은 조건 기반 저장시각 포함.
- 전체 mapper XML 파싱, 변경 mapper 인터페이스와 SQL ID 대응, 신규 조회의 테이블 정의 존재 여부 확인.
- Java 런타임과 신규 설치 DDL에 제거한 네 테이블 참조가 남지 않았음을 확인.
- 연결 가능한 브라우저가 없어 육안 확인은 완료하지 못했다.

실 Oracle SQL 실행·백엔드 빌드·CAST 왕복은 별도 환경의 필수 확인 사항이며 이 저장소에서 완료한 것으로 간주하지 않는다.

CURRENT_SAVE 제거 검증에서는 mapper XML 16개 파싱과 CastExecutionMapper의 인터페이스·SQL 18개 대응을 확인했다.
타입·lint·목업 검증은 Node의 preserve-symlinks 플래그로 실행했다. 일반 Vite 설정 로딩은 상위 사용자 경로
접근 제한으로 실패하여 저장소 설정을 수정하지 않고 동등한 인메모리 설정으로 dev 번들을 검증했다.
이 검증 설정은 symlink 정규화와 SVGR의 외부 설정 탐색을 끈다. 기존 500kB 이상 청크 경고가 남는다.

RESULT_IDENTITY 제거 검증에서는 mapper XML 16개 파싱과 CastExecutionMapper의 인터페이스·SQL 15개 대응을 확인했다.
런타임·신규 설치 DDL의 RESULT_IDENTITY 참조 제거와 기존 중복 검사·요청 검증·그룹 연결 유지,
React 타입 검사와 변경 diff의 공백 검사를 확인했다. 기존 DB 제거 SQL은 실제 Oracle에서 실행하지 않았다.

ID_LOCK 제거 검증에서는 mapper XML 16개 파싱과 CastExecutionMapper의 인터페이스·SQL 13개 대응,
Java·mapper·신규 설치 DDL의 ID_LOCK·LAST_NO·잠금 호출 제거, 변경 diff의 공백 검사를 확인했다.
번호 할당 SQL과 기존 DB 제거 SQL은 실제 Oracle에서 실행하지 않았다. React는 변경하지 않았다.

INPUT_BASE 제거 검증에서는 Java·mapper·신규 설치 DDL의 INPUT_BASE·retrieveInputBase 참조 제거와
`captureResource` 외부 호출이 남지 않았음을 확인했다. 기존 DB 제거 SQL은 실제 Oracle에서 실행하지 않았다. React는 변경하지 않았다.
