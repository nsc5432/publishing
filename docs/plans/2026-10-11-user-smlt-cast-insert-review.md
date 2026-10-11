# 사용자 시뮬레이션 실행 → CastRest 리소스 정합성 점검

작성일: 2026-10-11
기준: `main` HEAD `5430af9` + 미커밋 작업 트리 (`CastExecution*`, `CastResultInbox*`, `java/ddl/2026-10-11-*.sql` 이 untracked 인 상태)
관련 문서: `docs/plans/2026-10-11-user-smlt-master-redesign.md`
문서 성격: 코드 대조 결과 기록. 이 문서로 코드·DB를 바꾸지 않았다. `java/` 는 이 레포에서 컴파일되지 않으므로 전부 코드 판독 결과다.

## 1. 점검 질문

`UserSmltConfig.tsx` 에서 조건을 입력하고 실행했을 때, 외부 CAST 가 호출하는 castrest API
(`REQ_GetResource.do` 등)가 읽는 테이블에 맞는 경로로 데이터가 insert 되는가.

**결론: insert 경로는 존재하고 대부분 맞물린다. 단, 화면 입력 중 CAST 에 도달하지 않는 항목 2건과
리소스 형식·운영상 문제 4건이 있다 (§3).**

## 2. 실행 흐름과 테이블 대조

진입점: `UserSmltConfig.tsx#handleRun` → `userSmltService.execute` → `/user-smlt/executeUserSmlt`
→ `CastUserSmltServiceImpl.executeUserSmlt()` (한 트랜잭션)

| # | 단계 | 쓰는 테이블 | 코드 | CastRest 가 읽는 곳 | 판정 |
|---|---|---|---|---|---|
| 1 | 탭 편집분 저장 | `TN_PM_SMLT_USER_*` | `CastUserSmltServiceImpl.java:63-65` | – | ✓ |
| 2 | 실행 마스터 | `TN_PM_SMLT_MSTR` (`New`) | `CastExecutionMapper.xml#insertMaster` | – | ✓ |
| 3 | T1·T2 조건 동결 | `TN_PM_SMLT_EX_*`, `TN_PM_SMLT_COND_SNAPSHOT` | `freezeTerminal()` → `Cast{FltPsg,Chkn,Dep}Mapper.xml` 의 `snapshotSmltId != null` 분기 | – | ✓ |
| 4 | 리소스 번호 예약 | `TN_PM_SMLT_RSRC_LEASE` | `CastExecutionMapper.xml#reserveRsrcNo` · `assignRsrcNo` | – | ⚠ §3-4 |
| 5 | FS | `TN_PM_SMLT_SCHDL_MSTR/ATRB` (그룹 = `rsrcNo`) | `CastUserSnapshotMapper.xml#insertSchdlAtrbFromDaily` | `CastRestMapper.xml#retrieveFlightSchedule` 비 `FS001` 분기 (`:786`, `:862`) | ✓ |
| 6 | CA | `TN_PM_SMLT_CKNCT_MSTR/ATRB` | `#insertCknctAtrb` | `#retrieveCounterAllocation` 비 `CA001` 분기 (`:1022-1080`) | ✓ |
| 7 | SBD (백드롭 + 키오스크) | `TN_PM_SMLT_SBD_MSTR/ATRB` | `#insertSbdAtrb` · `#insertSbdAtrbKiosk` | `#retrieveSelfCheckInCountAndBagDrop` 비 `SBD001` 분기 (`:1191-1230`) | ✓ |
| 8 | 출국장 | `TN_PM_SMLT_FCLTY_OPNG_DPTGT_MSTR/ATRB` | `#insertDptgtAtrb` | `#retrieveFcltyOpngTblDptg` (`:1917`) | ⚠ §3-1, §3-3 |
| 9 | 보안검색 | `TN_PM_SMLT_FCLTY_OPNG_SCRTY_CNTRL_MSTR/ATRB` | `#insertScrtyCntrlAtrb` | `#retrieveFcltyOpngTblScrtyCntrl` (`:2070`) | ⚠ §3-2 |
| 10 | 리소스 XML 보관 | `TN_PM_SMLT_INPUT_SNAPSHOT` | `CastUserSnapshotServiceImpl.archive()` | `CastRestServiceImpl.retrieveResource()` 가 먼저 조회 (`:893`) | ✓ (§3-6 확인 필요) |
| 11 | 수행이력 | `TH_PM_SMLT_FLFMT_HSTRY` (`RUNNING`) | `CastSmltMapper#insertSmltFlfmtHstry` | – | ✓ |
| 12 | 실행 요청 | `TN_PM_SMLT_USER_MSTR` (`New`) | `CastUserReqMapper.xml#insertUserReq` | `CastRestMapper.xml#retrieveWhatIfCntrl` (`WHERE SMLT_STTS = 'New'`) | ✓ 컬럼 15종 일치 |

맞물리는 근거:

- FS·CA·SBD·출국장·보안검색이 같은 `rsrcNo` 를 쓴다 → 출국장 SQL 이 `SCHDL_ATRB_GROUP_ID` 로 일자를 찾는 구조(§11.3)가 성립한다.
- 10번 XML 은 5~9번이 같은 트랜잭션에서 넣은 행을 `captureResource()` → `processResourceData()`
  (CastRest 가 실제로 쓰는 렌더러)로 그린 결과다. CAST 가 받는 내용과 원천 행이 같다.
- CA 의 `CHKN_OPEN/CLOSE_PRNMNT_DT` 는 `yyyyMMddHHmm` 으로 넣고 조회 SQL 도 `'YYYYMMDDHH24MI'` 로 파싱한다. 24시는 `2359` 로 접는다.
- `SMLT_REQ_ID` 는 현재 `'WI' + SMLT_ID` 다 (`CastUserSmltServiceImpl.java:83`).

## 3. 발견 사항

### 3-1. 출국장 운영시간 편집이 CAST 에 반영되지 않음 — 입력 누락

- `TN_PM_SMLT_EX_DPTGT_OPER_HR` 에 동결은 되지만 발행 SQL(`CastUserSnapshotMapper.xml:274` `insertDptgtAtrb`)이 읽지 않는다.
- DepartureGate 리소스의 `StartTime` · `EndTime` 은 운영계 `TN_PM_ENTGT_DPTGT_OPER_HR_{INFO,ELMNT,MNG}` 에서 온다 (`CastRestMapper.xml:1952-1987`).
- 사용자 입력 중 반영되는 것은 운영 여부(`OPER_YN = 'Y'` 행만 insert)와 레인 수(`GNRL + SMART_PASS`)뿐이다.

### 3-2. 시간대별 보안검색대 계획이 시각 없이 나감 — 입력 누락

- `insertScrtyCntrlAtrb` 는 (게이트, `OPER_BGNG_HOUR`) 마다 1행을 만든다 (`CastUserSnapshotMapper.xml:293-323`).
- SC 리소스 필드는 `Terminal` · `Location` · `CurrentNumberofLanes` 세 개뿐이다 (`CastRestServiceImpl.java:540-542`, `CastRestMapper.xml:2072-2074`).
- 결과: 같은 `DG1` 이 레인 수만 다른 채 여러 번 나가고, CAST 는 시간대를 구분할 수 없다.
- 고치려면 SC GenericTable 에 시각 컬럼을 추가해야 하는데, **CAST 쪽 GenericTable 계약 확인이 먼저**다.

### 3-3. DepartureGate `sideDoor` · `facialRecognition` 배열 길이 불일치

- 발행 SQL 이 `SD_DR` · `FCLT_RCG` 를 채우지 않아 NULL 이다.
- 조회 SQL 은 두 컬럼을 `NVL` 없이 `LISTAGG` 한다 (`CastRestMapper.xml:1947-1948`).
- `LISTAGG` 는 NULL 을 건너뛰므로 두 컬럼만 빈 문자열이 되고 나머지 컬럼은 N개다 (AGENTS.md §11.6 LISTAGG 규칙 위반).
- 수정 후보: 조회 SQL 에 `NVL(…, ' ')`, 또는 발행 SQL 에서 기본값을 채운다. 일일 DepartureGate 행의 실제 값을 보고 정한다.

### 3-4. 리소스 번호가 998회 실행 후 고갈

- `TN_PM_SMLT_RSRC_LEASE` 를 지우는 코드가 없다.
- `reserveRsrcNo` 는 `TN_PM_SMLT_USER_MSTR.FLT_SCHDL_RSRC_ID` 에 한 번 쓰인 번호도 영구 제외한다 (`CastExecutionMapper.xml:44-49`).
- `TN_PM_SMLT_INPUT_SNAPSHOT` PK `(RESOURCE_TYPE, RESOURCE_ID)` 도 같은 번호의 재보관을 막는다.
- → 998번째 이후 "가용 CAST 리소스 번호가 없습니다" 로 실패. `publishRsrc` 의 `DELETE → INSERT` 는 사실상 실행될 일이 없다.
- AGENTS.md §11.3 "번호가 한 바퀴 돌아 겹치면 `DELETE → INSERT` 로 갈아 끼운다" 와 다르다. 재사용 정책(보존 기간 후 lease·snapshot 정리 등)을 정해야 한다.

### 3-5. `TN_PM_SMLT_INPUT_BASE` 를 채우는 경로가 없음

- DDL(`cast-ddl.sql:1984`, `2026-10-11-user-smlt-master-stage.sql:47`)이 빈 테이블만 만든다. cutover 스크립트는 행 존재를 검사만 한다 (`2026-10-11-user-smlt-master-cutover.sql:13`).
- 비어 있으면 `publish()` 가 "해당 일자의 CAST 기본 입력 리소스 설정이 없습니다" 로 실행 전체를 막는다.
- `retrieveInputBase` 는 단건 조회라 유효기간이 겹치는 행이 2건 이상이면 다건 예외가 난다.

### 3-6. (확인 필요) 가상 리소스 ID 가 리소스 목록에 없음

- 모델·PropertySet·서비스시간·체크인유형·출입국·환승보안·리포팅은 `<원본ID>_U<SMLT_ID>` 가상 ID 로 `INPUT_SNAPSHOT` 에만 보관된다 (`CastUserSnapshotServiceImpl.java:52-68`).
- `retrieveResourceInformation` (`REQ_GetResourceInformation.do`) 는 `INPUT_SNAPSHOT` 을 보지 않는다.
- CAST 가 WhatIf 행의 ID 를 이 목록과 대조한다면 실행이 실패한다. CAST 동작 확인 필요.

## 4. 검증하지 못한 것

- [ ] 실 스키마: `2026-10-11-*` DDL 적용 여부, `TN_PM_SMLT_EX_*` · `MSTR` · `INPUT_SNAPSHOT` 등 신규 테이블 존재
- [ ] `CAOWN.TN_CA_CKNCT.TMNL_ID` 가 `P01` / `P03` 형식인지 (CA·SBD 발행 SQL 의 조인 조건)
- [ ] DepartureGate 조인 `A.GATE_NO = B.FCLTY_TYPE_ID` 가 실제 데이터에서 맞물리는지 (`CastRestMapper.xml:1987`)
- [ ] 운항편 `TMNL_ID = 'P'` 행은 `DECODE` 결과가 NULL 이라 조정률이 적용되지 않는다 (`CastUserSnapshotMapper.xml:67`). 화면 집계(`CastFltPsgMapper#retrieveFltPsgHourList`)가 `'P'` 를 세는지 대조
- [ ] CAST 가 `TN_PM_SMLT_INPUT_SNAPSHOT` 에서 꺼낸 보관 XML 을 실제로 받아 실행하는지 (테스트 환경 1회 실행)

## 5. 다시 볼 때 체크리스트

- [ ] 3-1 출국장 운영시간을 DepartureGate 리소스에 반영할지 결정 (반영한다면 `EX_DPTGT_OPER_HR` → 리소스 컬럼 매핑)
- [ ] 3-2 CAST SC GenericTable 의 시간대 컬럼 계약 확인
- [ ] 3-3 `sideDoor` · `facialRecognition` NULL 처리
- [ ] 3-4 리소스 번호 재사용 정책 결정 → 코드 · AGENTS.md §11.3 정리
- [ ] 3-5 `TN_PM_SMLT_INPUT_BASE` 초기 데이터 적재 주체 결정
- [ ] 3-6 CAST 의 리소스 목록 대조 여부 확인
- [ ] AGENTS.md §11 을 현행 구조(`TN_PM_SMLT_MSTR` · `EX_*` · `INPUT_SNAPSHOT` · `SMLT_REQ_ID = 'WI' + SMLT_ID`)로 갱신
