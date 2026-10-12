# 사용자 시뮬레이션 실행 → CastRest 리소스 정합성 점검 및 구현 계획

작성일: 2026-10-11 · 최종 갱신: 2026-10-12
기준: `main` HEAD `d6ebc80`
관련 문서: `docs/plans/2026-10-11-user-smlt-master-redesign.md`, `docs/user-smlt-master-redesign.md`
문서 성격: 코드 대조 결과, 확정 결정, 3단계 구현 계획. `java/` 는 이 레포에서 컴파일되지 않으므로
Java·SQL 은 전부 코드 판독 기준이다.

**상태: 1·2·3번 과정 구현 완료(2026-10-12, Java·SQL 은 코드 판독 기준 — 실백엔드 빌드·DB 검증 전). §5 실 DB·CAST 확인 남음.**
구현은 §4 의 1·2·3번 과정을 순서대로 진행한다.
작업 요청은 "이 md 파일 참고하여 N번 과정에 대해서 작업해줘" 로 한다.

---

## 1. 점검 질문과 결론

`UserSmltConfig.tsx` 에서 조건을 입력하고 실행했을 때, 외부 CAST 가 호출하는 castrest API
(`REQ_GetResource.do` 등)가 읽는 테이블에 맞는 경로로 데이터가 insert 되는가.

**결론: insert 경로는 있고 대부분 맞물린다. 발견 7건(§3-1~§3-7)은 모두 결정을 마쳤다.**
- 화면 입력이 CAST 에 도달하지 않음: 출국장 운영시간(§3-1), 보안검색대 시간별 계획(§3-2)
- 리소스 형식: DepartureGate 배열 길이 불일치(§3-3)
- 번호·ID 운영: 리소스 번호 998회 한도(§3-4), 실행별 PropertySet(§3-5),
  가상 리소스 ID(§3-6), 실행 확정 `EX_*` 중간 테이블(§3-7)

## 2. 실행 흐름과 테이블 대조 (현행)

진입점: `UserSmltConfig.tsx#handleRun` → `userSmltService.execute` → `/user-smlt/executeUserSmlt`
→ `CastUserSmltServiceImpl.executeUserSmlt()` (한 트랜잭션)

| # | 단계 | 쓰는 테이블 | 코드 | CastRest 가 읽는 곳 | 처리 |
|---|---|---|---|---|---|
| 1 | 탭 편집분 저장 | `TN_PM_SMLT_USER_*` | `CastUserSmltServiceImpl.java:63-65` | – | 유지 |
| 2 | 실행 마스터 | `TN_PM_SMLT_MSTR` (`New`) | `CastExecutionMapper.xml#insertMaster` | – | 유지 |
| 3 | T1·T2 조건 확정 | `TN_PM_SMLT_COND_SNAPSHOT`, `TN_PM_SMLT_EX_*` | `freezeTerminal()` (`:92-126`) | – | `EX_*` 제거 → 1번 과정 |
| 4 | 리소스 번호 예약 | `TN_PM_SMLT_RSRC_LEASE` | `CastExecutionMapper.xml#reserveRsrcNo` · `assignRsrcNo` | – | 순환 재사용 → 3번 과정 |
| 5 | FS | `TN_PM_SMLT_SCHDL_MSTR/ATRB` | `CastUserSnapshotMapper.xml#insertSchdlAtrbFromDaily` | `CastRestMapper.xml#retrieveFlightSchedule` 비 `FS001` 분기 | 입력 원천만 교체 → 1번 |
| 6 | CA | `TN_PM_SMLT_CKNCT_MSTR/ATRB` | `#insertCknctAtrb` | `#retrieveCounterAllocation` 비 `CA001` 분기 | 입력 원천만 교체 → 1번 |
| 7 | SBD (백드롭 + 키오스크) | `TN_PM_SMLT_SBD_MSTR/ATRB` | `#insertSbdAtrb` · `#insertSbdAtrbKiosk` | `#retrieveSelfCheckInCountAndBagDrop` 비 `SBD001` 분기 | 입력 원천만 교체 → 1번 |
| 8 | 출국장 | `TN_PM_SMLT_FCLTY_OPNG_DPTGT_MSTR/ATRB` | `#insertDptgtAtrb` | `#retrieveFcltyOpngTblDptg` | 운영시간·NULL → 1번 |
| 9 | 보안검색 | `TN_PM_SMLT_FCLTY_OPNG_SCRTY_CNTRL_MSTR/ATRB` | `#insertScrtyCntrlAtrb` | `#retrieveFcltyOpngTblScrtyCntrl` | 단일 수량 → 1번 |
| 10 | 리소스 XML 보관 | `TN_PM_SMLT_INPUT_SNAPSHOT` | `CastUserSnapshotServiceImpl.archive()` | `CastRestServiceImpl.retrieveResource()` 가 먼저 조회 (`:880-881`) | 키·응답 규칙 변경 → 3번 |
| 11 | 수행이력 | `TH_PM_SMLT_FLFMT_HSTRY` (`RUNNING`) | `CastSmltMapper#insertSmltFlfmtHstry` | – | 유지 |
| 12 | 실행 요청 | `TN_PM_SMLT_USER_MSTR` (`New`) | `CastUserReqMapper.xml#insertUserReq` | `CastRestMapper.xml#retrieveWhatIfCntrl` | 리소스 ID 값 변경 → 3번 |

맞물리는 근거:

- FS·CA·SBD·출국장·보안검색이 같은 `rsrcNo` 를 쓴다. 출국장·입국심사·환승보안 렌더 SQL 은
  리소스 ID 의 번호로 `TN_PM_SMLT_SCHDL_ATRB` 그룹을 찾아 일자를 얻는다
  (`CastRestMapper.xml:1961`, `:2040`, `:2116`). 그룹이 없으면 `resolveBaseYmd()` 로 떨어진다.
- 보관 XML 은 같은 트랜잭션에서 넣은 행을 `captureResource()` → `processResourceData()`
  (CastRest 가 실제로 쓰는 렌더러)로 그린 결과다. CAST 가 받는 내용과 원천 행이 같다.
- CA 의 `CHKN_OPEN/CLOSE_PRNMNT_DT` 는 `yyyyMMddHHmm` 으로 넣고 조회 SQL 도 `'YYYYMMDDHH24MI'` 로
  파싱한다. 24시는 `2359` 로 접는다.
- `SMLT_REQ_ID` 는 `'WI' + SMLT_ID` 다 (`CastUserSmltServiceImpl.java:83`).

---

## 3. 결정 사항

### 3-0. 공통 전제

1. **`2026-10-11-*` DDL 은 어느 실제 DB 에도 적용되지 않았다** (2026-10-12 확인).
   10-11 에 새로 만드는 테이블(`EX_*`, `MSTR`, `INPUT_SNAPSHOT`, `RSRC_LEASE`, `ID_LOCK`,
   `INPUT_BASE` 등)은 DDL·이관 스크립트 파일을 고치는 것으로 끝난다. 이관 대상 행이 없다.
   **이미 실제 DB 에 있는 테이블**(`TN_PM_SMLT_SCSH_OPER_PLAN`, `TN_PM_SMLT_FCLTY_OPNG_*`,
   `TN_PM_SMLT_SCHDL_*`·`CKNCT_*`·`SBD_*` 등)을 바꾸는 것은 이관 스크립트(stage/cutover)에 넣는다.
2. **운영 가정: 실행 등록부터 CAST 가 입력을 가져갈 때까지 원본(`001` 계열 리소스·모델)은 바뀌지 않는다**
   (2026-10-12 결정). 운영 반영·모델 삭제가 그 사이에 일어나는 경우는 고려하지 않는다.
   이 가정으로 공유 리소스의 `_U<SMLT_ID>` 가상 ID 를 폐지한다(§3-6).
3. CAST 의 `REQ_GetResource` 요청에는 날짜가 없다(AGENTS.md §8). 실행일자에 따라 내용이 달라지는
   리소스는 반드시 번호(FS 그룹)로 일자를 찾게 하거나 등록 시점 XML 로 고정한다.
4. 실행 상태 판정 기준: `TN_PM_SMLT_MSTR.SMLT_STTS IN ('Finished','Failed')` 이면 **종료**,
   `New`·`Executing` 이면 **진행 중**. `Finished` 는 결과 저장(`completeMaster`, `CastExecutionMapper.xml:65-70`)
   때만 들어가므로, 결과 없이 Finished 통보만 온 실행은 진행 중으로 남는다.

### 3-1. 출국장 운영시간을 DepartureGate 에 반영

**문제.** 사용자 출국장 운영시간은 `TN_PM_SMLT_EX_DPTGT_OPER_HR` 에 확정되지만 발행 SQL
(`CastUserSnapshotMapper.xml:274-291`)이 읽지 않는다. DepartureGate 의 `StartTime`·`EndTime` 은
운영계 `TN_PM_ENTGT_DPTGT_OPER_HR_{INFO,ELMNT,MNG}` 에서만 온다(`CastRestMapper.xml:1945-1987`).

**결정 (2026-10-12).**

| 구분 | 운영시간 원천 |
|---|---|
| 일일 (`001`) | 운영계 `TN_PM_ENTGT_DPTGT_OPER_HR_*` — 현행 유지 |
| 사용자 (FS 번호) | 실행 시 확정한 DEP 조건의 `oprTimeList` (저장 조건, 미저장 시 해당 일자 운영자료) |

- `OPER_BGNG_HOUR` → `StartTime`, `OPER_END_HOUR` → `EndTime`. 여러 운영구간은 구간마다 행으로 보존하고
  최소 시작·최대 종료로 합치지 않는다.
- `StartDate`·`EndDate` 는 **실행일자**, 종료시각 `24` 는 **`2359`**(23:59)로 표기한다.
- 사용자가 저장한 빈 조건은 운영자료로 되살리지 않는다. 확정값은 조건 JSON 과 DepartureGate 입력 XML 에
  같은 값으로 들어간다. `TN_PM_SMLT_EX_DPTGT_OPER_HR` 는 제거한다(§3-7).
- 기존 사용자 실행의 보관 XML 을 최신 `USER` 값으로 덮어 복원하지 않는다.

### 3-2. 보안검색대는 출국장별 수량만 전달 — 시간별 계획 제거

**문제.** `insertScrtyCntrlAtrb` 는 시간별 계획마다 행을 만들지만 SC 리소스는 `Terminal`·`Location`·
`CurrentNumberofLanes` 만 내보낸다(`CastRestServiceImpl.java:537-542`, `CastRestMapper.xml:2065-2073`).
시각이 빠진 같은 출국장 행이 여러 개 나간다.

**결정 (2026-10-12).**
- 일일·사용자 모두 SC 에 시간정보 없이 수량만 전달한다. SC 리소스에 시각 컬럼을 추가하지 않는다.
- 최종 수량은 출국장 기본조건의 `scshCntom` 하나다. **운영 Y 이고 `scshCntom > 0` 인 출국장만** 1행씩 발행한다.
- 화면의 시간별 계획 그리드(`ScGrid.tsx`)·입력·추가·삭제와 "피크 시간대 기준" 안내·피크 요약을 제거한다.
- **기존 저장된 시간별 계획은 버리고** 기존 `scshCntom` 을 그대로 최종 수량으로 쓴다. 합산·평균 변환은 하지 않는다.
- **`planList`(`ScPlanDto`) 필드와 시간별 계획 테이블을 삭제한다.** `planList` 는 고정 DTO 필드이므로
  AGENTS.md §3 에 예외로 기록한다. `TN_PM_SMLT_SCSH_OPER_PLAN` 은 실제 DB 에 이미 있으므로
  stage 의 `_LGC` 백업은 유지하고 `_V2` 생성·이관·cutover 교체·FK 에서 뺀다. 원본은 다른 원본 테이블처럼
  `_OLD` 로 남기고 즉시 DROP 하지 않는다. `TN_PM_SMLT_EX_SCSH_OPER_PLAN` 은 DDL 에서 지운다.
- 출국장 자체 운영시간(`oprTimeList`)은 DepartureGate 입력이므로 유지한다(§3-1).

### 3-3. DepartureGate `sideDoor`·`facialRecognition` 배열 길이 불일치

**문제.** 발행 SQL 이 `SD_DR`·`FCLT_RCG` 를 채우지 않아 NULL 이고, 조회 SQL 은 두 컬럼을 `NVL` 없이
`LISTAGG` 한다(`CastRestMapper.xml:1947-1948`). NULL 이 건너뛰어져 두 배열만 길이가 짧아진다
(AGENTS.md §11.4 LISTAGG 규칙 위반).

**결정 (2026-10-12).** 조회 SQL 에서 두 컬럼을 `NVL(…, ' ')` 로 감싼다. 이 SQL 은 일일(`001`)과 공용이므로
일일 XML 에서도 NULL 이던 칸이 `' '` 로 채워진다.

### 3-4. 리소스 번호 순환 재사용 — 998회 한도 해소

**문제.** `reserveRsrcNo` 는 lease·기존 요청에 한 번 쓰인 번호를 영구 제외해(`CastExecutionMapper.xml:44-49`)
`002~999` 998회 뒤 등록이 실패한다. `TN_PM_SMLT_INPUT_SNAPSHOT` PK 가 `(RESOURCE_TYPE, RESOURCE_ID)` 라
같은 번호의 재보관도 충돌한다(`cast-ddl.sql:1921-1924`).

**결정 (2026-10-12).**

| 항목 | 결정 |
|---|---|
| 순서 | `002 → … → 999 → 002` 순환. `001` 은 제외. 마지막 할당 번호를 영속 관리 |
| 재사용 판정 | 소유 실행이 종료(§3-0-4)면 재사용, 진행 중이면 건너뛴다. 전 번호가 진행 중일 때만 등록 실패 |
| 반환 대기 | 별도 대기시간·지연 입력 조회 유예기간 없음 |
| 멈춘 실행 | `New`·`Executing` 에 멈춘 실행은 번호를 계속 점유한다. 자동 해제·수동 절차를 두지 않는다 |
| lease 교체 | `TN_PM_SMLT_RSRC_LEASE` 의 소유 실행을 UPDATE |
| 전송 데이터 | 재사용 번호의 전송 테이블 상세 DELETE → 마스터 DELETE → INSERT (`publishRsrc()` 경로) |
| 기존 요청 보호 | lease 가 없는 기존 요청은 `TN_PM_SMLT_USER_MSTR.FLT_SCHDL_RSRC_ID` 로 번호를 찾아 같은 판정을 적용 |
| 트랜잭션 | 자동 저장·번호 예약·lease 교체·전송 데이터 교체·XML 보관·요청 등록을 한 트랜잭션. 실패 시 전부 롤백 |

- 번호를 공유하는 전송 테이블은 **7쌍**이다(§3-6 결정으로 입국심사·환승보안 추가).

| 리소스 | 마스터 | 상세 |
|---|---|---|
| FS | `TN_PM_SMLT_SCHDL_MSTR` | `TN_PM_SMLT_SCHDL_ATRB` |
| CA | `TN_PM_SMLT_CKNCT_MSTR` | `TN_PM_SMLT_CKNCT_ATRB` |
| SBD | `TN_PM_SMLT_SBD_MSTR` | `TN_PM_SMLT_SBD_ATRB` |
| DepartureGate | `TN_PM_SMLT_FCLTY_OPNG_DPTGT_MSTR` | `TN_PM_SMLT_FCLTY_OPNG_DPTGT_ATRB` |
| SecurityControl | `TN_PM_SMLT_FCLTY_OPNG_SCRTY_CNTRL_MSTR` | `TN_PM_SMLT_FCLTY_OPNG_SCRTY_CNTRL_ATRB` |
| Immigration | `TN_PM_SMLT_FCLTY_OPNG_ENTCNY_MSTR` | `TN_PM_SMLT_FCLTY_OPNG_ENTCNY_ATRB` |
| TransferSecurityControl | `TN_PM_SMLT_FCLTY_OPNG_TRNST_SCRTY_CNTRL_MSTR` | `TN_PM_SMLT_FCLTY_OPNG_TRNST_SCRTY_CNTRL_ATRB` |

- **기존 사용자 실행의 전송 데이터 보존.** 10-11 이전 실행은 보관 XML 이 없어 전송 테이블이 입력의 유일한
  사본이다. 순환이 그 번호에 도달하면 지워지므로, stage 에서 전송 7쌍의 사용자 번호(`002~999`) 행을
  `*_LGC` 로 백업하고, FS 마지막 번호의 초기값은 기존 요청이 쓴 최대 번호로 둬 재사용 시점을 늦춘다.
  (2026-10-12 구현 기본안. 다른 방침이 필요하면 3번 과정 전에 바꾼다.)
- 결과 연결은 FS 번호만으로 최신 요청이나 현재 lease 소유 실행을 고르지 않는다. 현행처럼 WI 식별자로 먼저
  좁히고 후보가 1개인지 확인한 뒤 일자·모델·입력 리소스를 대조한다(`CastRestServiceImpl.java:2512-2520`).
  구분 식별자를 얻지 못하면 임의 매칭하지 않고 실패 사유를 남긴다.

### 3-5. `INPUT_BASE` 유지와 실행 전용 PropertySet `PS5xx`

#### INPUT_BASE

`TN_PM_SMLT_INPUT_BASE` 는 유지한다. 실행일자를 포함하는 활성 행 하나를 단건 조회해
(`CastExecutionMapper.xml:78-81`) 모델·원천 PropertySet·설정 ID 를 고른다. 필수 4종 검사
(`CastUserSnapshotServiceImpl.java:38-42`)도 유지한다.

**원천 ID 는 일일 Auto 조합과 같게 둔다.** 사용자 결과는 일일 결과와 KPI 를 비교하므로 편집 영역 밖의
설정이 일일과 같아야 한다. 일일 Auto 는 `SMLT_ID` 하나에 `TN_PM_SMLT_STNG` 1행(모델 1개)이다(2026-10-12 확인).
값은 CAST 리소스 목록(`CastRestMapper.xml:24-224`)의 ResourceID 전체 문자열이다.

| `INPUT_BASE` 컬럼 | 예상 값 (실 DB 확인 후 확정) | 확인 원천 |
|---|---|---|
| `MDL_RSRC_ID` | 일일 모델의 `SMLT_MDL_EXPLN` 문자열 | 일일 STNG `MDL_RSRC_ID` ↔ `TN_PM_SMLT_MDL` (`DEL_YN='N'`) |
| `PRPT_SET_RSRC_ID` | `PS001` | 일일 STNG |
| `CHKN_TYPE_RSRC_ID` | `CheckinType001` | 일일 STNG |
| `CKNCT_SRVC_HR_RSRC_ID` | `CheckinCounterServiceTime001` | 일일 STNG |
| `FCLTY_OPNG_EMI_RSRC_ID` | `FacilityOpeningTable_Emigration001` | 일일 STNG |
| `FCLTY_OPNG_IMMI_RSRC_ID` | `FacilityOpeningTable_Immigration001` | 일일 STNG (번호 리소스 발행의 **복사 원천**) |
| `FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID` | `FacilityOpeningTable_TransferSecurityControl001` | 일일 STNG (번호 리소스 발행의 **복사 원천**) |
| `RPT_STNG_ATRB_ID` | `ReportingProfilesTimeGroups…` | STNG 에 칸 없음. 모델 파일·CAST 설정에서 확인 |

초기 등록은 seed SQL 한 행, 변경은 기존 행의 종료일을 닫고 새 행을 넣는다. 관리 화면은 만들지 않는다.

```sql
-- 초기 등록 (값은 위 표를 실 DB 에서 확인해 채운다)
INSERT INTO PMOWN.TN_PM_SMLT_INPUT_BASE (
    BASE_ID, VALID_BGN_YMD, VALID_END_YMD, USE_YN,
    MDL_RSRC_ID, PRPT_SET_RSRC_ID, CKNCT_SRVC_HR_RSRC_ID, CHKN_TYPE_RSRC_ID,
    FCLTY_OPNG_EMI_RSRC_ID, FCLTY_OPNG_IMMI_RSRC_ID,
    FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID, RPT_STNG_ATRB_ID
) VALUES (
    'BASE_19000101', '19000101', '99991231', 'Y',
    :mdlRsrcId, 'PS001', 'CheckinCounterServiceTime001', 'CheckinType001',
    'FacilityOpeningTable_Emigration001', 'FacilityOpeningTable_Immigration001',
    'FacilityOpeningTable_TransferSecurityControl001', :rptStngAtrbId
);

-- 변경 (예: 2027-03-01 부터 새 모델) — 한 트랜잭션
UPDATE PMOWN.TN_PM_SMLT_INPUT_BASE SET VALID_END_YMD = '20270228' WHERE BASE_ID = 'BASE_19000101';
INSERT INTO PMOWN.TN_PM_SMLT_INPUT_BASE (...) VALUES ('BASE_20270301', '20270301', '99991231', 'Y', ...);
```

- 유효 시작일을 cutover 일자로 두면 그 이전 날짜의 사용자 실행이 실패하므로 `19000101` 로 둔다.
- verify SQL 검사 3종: ① 각 ID 가 원천 테이블에 살아 있는지(`TN_PM_SMLT_MDL` `DEL_YN='N'`,
  `TN_PM_SMLT_FIX_ATRB_GROUP` `DEL_YN='N'`, 나머지 `*_MSTR` `USE_YN='Y'`, 접두어를 뗀 ID 로 대조)
  ② 어느 날짜든 활성 행이 정확히 1건 ③ 최근 일일 Auto STNG(`MAX(SMLT_ID) WHERE SMLT_TYPE='Auto'`)의
  7개 ID 가 현재 유효 행과 같은지(`RPT_STNG_ATRB_ID` 제외).

#### 실행 전용 PropertySet

| 항목 | 결정 |
|---|---|
| 생성 단위 | 사용자 실행 한 건마다 전용 PropertySet 한 세트. WhatIf 요청의 `PRPT_STNG_RSRC_ID` 는 이 ID |
| ID 형식 | `PS` + 세 자리 숫자. 실행 ID 를 붙이거나 `_U` 를 붙인 ID 로 대신하지 않는다 |
| 번호 범위 | `001` 기준정보 · `002~499` Cast 설정 카테고리 · **`500~998` 실행용(499개)** · `999` 전처리 결과 |
| 화면 노출 | Cast 설정 화면에 보이지 않는다. 카테고리 채번(`retrieveAvailableCategoryId`, `CastConfigMapper.xml:71-83`)을 `002~499` 로 좁히고, 범위가 차면 카테고리 생성을 실패시킨다 |
| 저장 방식 | **XML 로만 보관.** `TN_PM_SMLT_FIX_ATRB_GROUP`·`TN_PM_SMLT_{PSG,SHOW_UP,SRVC}_ATRB` 에 행을 만들지 않는다 |
| 번호 할당 | FS 와 **독립된 풀**에서 `500 → … → 998 → 500` 순환. 재사용 판정·멈춘 실행 처리는 §3-4 와 같다 |
| lease | `TN_PM_SMLT_RSRC_LEASE` 에 `RSRC_KIND`(`FS`/`PS`). PK `(RSRC_KIND, RSRC_NO)`, UNIQUE `(RSRC_KIND, SMLT_ID)` |
| 마지막 번호 | `TN_PM_SMLT_ID_LOCK` 에 `LAST_NO` 컬럼, `RSRC_FS`·`RSRC_PS` 행. `EXECUTION` 행 잠금 안에서 갱신 |

**XML 로만 보관하는 이유.** PropertySet 렌더 SQL 은 내부 참조 번호를 PS 번호에서 그대로 뽑는다
(`CastRestMapper.xml:1344-1408`, `REPLACE(#{resourceID},'PS','')`). 행을 복제한 `PS512` 는
`SBD512`·`DepartureGate512`·`Immigration512` 를 가리키게 되어 어차피 XML 치환이 필요하다.

**생성 절차.**
1. `INPUT_BASE` 의 원천 PropertySet(`PS001`)을 `captureResource()` 로 실행일자 기준 렌더한다.
2. 내부 참조를 치환한다. `PS001` 이 가리키는 참조 8종(`CastRestMapper.xml:1344-1408`):

| 참조 | 치환 |
|---|---|
| `SBD001`, `FacilityOpeningTable_DepartureGate001`, `FacilityOpeningTable_SecurityControl001`, `FacilityOpeningTable_Immigration001`, `FacilityOpeningTable_TransferSecurityControl001` | 그 실행의 FS 번호(`rsrcNo`) |
| `FacilityOpeningTable_Emigration001`, `CheckinType001`, `CheckInCounterServiceTime001` | 원본 ID 그대로 |

3. 리소스 ID 를 `PS001` → `PS5xx` 로 바꿔 `INPUT_SNAPSHOT` 에 `(SMLT_ID, 'PropertySet', 'PS5xx', SOURCE_ID='PS001')` 로 넣는다.
4. CAST 가 `PS5xx` 를 요청하면 현재 PS lease 소유 실행의 XML 을 반환한다.

- 동시에 진행할 수 있는 실행은 PS 499개가 상한이다. 받아들인다.
- PS 번호도 재사용되므로 결과를 PS 번호로 실행에 연결하지 않는다.

### 3-6. 공유 리소스 `_U<SMLT_ID>` 가상 ID 폐지

**문제.** 현재 모델·PropertySet·서비스시간·체크인유형·출입국·환승보안·리포팅을 `<원본ID>_U<SMLT_ID>`
가상 ID 로 `INPUT_SNAPSHOT` 에만 보관한다(`CastUserSnapshotServiceImpl.java:51-67`). 리소스 목록
(`retrieveResourceInformation`, `CastRestMapper.xml:24-224`)은 이 ID 를 내보내지 않아, CAST 가 목록을
대조하면 실행이 실패한다.

**결정 (2026-10-12).** §3-0-2 운영 가정으로 입력 불변 목적이 사라지므로 `_U` 를 폐지한다.

| 리소스 | WhatIf 요청에 넣는 ID | 근거 |
|---|---|---|
| 모델, 체크인 서비스시간, 체크인유형, 출국심사, 리포팅 | 원본 ID 그대로 | 실행일자와 무관하고, 원본이 바뀌지 않는다는 가정 |
| 입국심사, 환승보안 | **FS 번호 리소스** (`FacilityOpeningTable_Immigration{rsrcNo}` 등) | 렌더 SQL 이 번호로 FS 그룹 일자를 찾는다(`:2040`, `:2116`). `001` 은 그룹이 없어 `resolveBaseYmd()` 로 떨어져 다른 날짜 실행이 어긋난다 |
| PropertySet | `PS5xx` (§3-5) | |
| FS·CA·SBD·출국장·보안검색 | FS 번호 리소스 (현행) | |

- 입국심사·환승보안은 `INPUT_BASE` 의 원천(`…001`) ATRB 행을 FS 번호로 복사 발행하고 마스터 행도 만든다.
  전송 테이블이 7쌍이 된다(§3-4).
- 리소스 목록: 원본 ID·번호 리소스는 이미 마스터 테이블로 나온다. **추가 노출은 `PS5xx` 뿐**이며,
  현재 PS lease 소유 실행의 행만 `INPUT_SNAPSHOT` UNION 으로 내보낸다. `LastModified` 는
  `TN_PM_SMLT_MSTR.FRST_REG_DT` 를 조인한다. `ResourceType`·`Description`·`tableID` 는 기존 PropertySet 행과
  같은 값(`'PropertySet'`, `'Property Set'`, `'cols_PropertySet'`)이고 `#{handleYn}` 플래그를 따른다.
- `INPUT_SNAPSHOT` 은 유지한다. 실행별 입력 기록으로 원본 ID 리소스까지 모두 보관하되,
  **CAST 응답(`retrieveInput`)에는 현재 lease 소유 실행의 번호 리소스·`PS5xx` 행만** 쓴다.
  원본 ID 로 보관한 기록용 행이 응답에 섞이면 안 된다.
- `retrieveModelInfo`(`CastRestMapper.xml:1534-1541`)의 가상 모델 ID 역매핑 서브쿼리를 걷어낸다. 원본 ID 로
  보관한 기록 행이 실행마다 생겨 서브쿼리가 다건이 된다.

### 3-7. 실행 확정 `EX_*` 7개 제거

**문제.** `freezeTerminal()` 은 조건을 JSON 으로 저장한 뒤 `EX_*` 7개에 다시 정규화하고, 발행 SQL 이 그
테이블을 읽는다(`CastUserSmltServiceImpl.java:92-126`, `CastUserSnapshotMapper.xml`). 실행별 보존은 JSON·XML 이
이미 하므로 중간 복제본이다.

**결정 (2026-10-12).** 7개를 모두 제거하고 **확정 DTO 를 발행 서비스에 직접 전달**한다.

| 제거 대상 | 현재 발행 SELECT (`CastUserSnapshotMapper.xml`) | 대체 입력과 유지할 규칙 |
|---|---|---|
| `TN_PM_SMLT_EX_FLT_PSG_AJMT` | `:63-68`, `:108-113` | 양 터미널 FLT_PSG `ajmtRt`. 미저장 0%, 국제선 출발 `GREATEST(예약-환승,0)` 몫만 조정, 기존 운항 필터·`ROW_NUMBER` 중복 제거·`DECODE` 터미널 매핑 유지 |
| `TN_PM_SMLT_EX_CHKN_ISL` | `:193`, `:251` | CHKN 아일랜드별 `sbdCnt`·`kosCnt`. 장비 마스터·정책 유효일자 조회와 수량만큼 장비 선택 유지 |
| `TN_PM_SMLT_EX_CHKN_OPER_HR` | `:150`, `:194`, `:252` | CHKN `oprTimeList`. 여러 구간, 종료 24시 → 23:59 유지 |
| `TN_PM_SMLT_EX_CHKN_BOOTH` | `:149`, `:219` | CHKN `boothList`. 항공사 없는 부스 제외, `boothNo` 재번호 금지, 아일랜드별 항공사 중복 제거·정렬 집계 유지 |
| `TN_PM_SMLT_EX_DPTGT` | `:288`, `:315` | DEP 출국장별 운영 여부·일반+스마트 레인 합산, SC 는 §3-2 단일 `scshCntom` |
| `TN_PM_SMLT_EX_DPTGT_OPER_HR` | (읽는 곳 없음) | DEP `oprTimeList` → DepartureGate 시각(§3-1) |
| `TN_PM_SMLT_EX_SCSH_OPER_PLAN` | `:309`, `:319` | 없음(§3-2 로 계획 폐지) |

- 흐름: 자동 저장 → 기존 조회 서비스로 T1·T2 의 FLT_PSG·CHKN·DEP 확정 → 조건 JSON 저장 →
  **같은 DTO 객체**를 발행에 전달 → 전송 테이블 INSERT → 같은 렌더러로 XML 보관 → 요청 등록.
  발행 중 `USER_*` 를 다시 읽지 않는다. `EX_*` 를 `USER_*` 로 단순 치환하면 미저장 영역의 운영자료가 빠진다.
- 체크인 부스 필터(항공사 없는 부스 제외, `boothCnt` 재계산, `freezeTerminal():114-117`)는 JSON 저장 뒤
  **발행용 복사본**에서 한다. 공개 조건 JSON 은 원본 그대로 둔다.
- **구현 방식 (2026-10-12):** DTO 는 MyBatis `<foreach>` 로 `WITH` 절 인라인 행(`SELECT … FROM DUAL UNION ALL …`)을
  만들어 기존 조인 SQL 에 넣는다. 임시 테이블(GTT)도 두지 않는다.

---

## 4. 구현 단계

각 과정은 독립 요청 단위다. 앞 과정이 끝난 상태를 전제로 한다.

**공통 규칙**
- `java/` 는 여기서 컴파일되지 않는다. 제거한 테이블·필드·statement 이름을 `grep` 으로 전수 확인해
  참조가 남지 않았음을 보이는 것이 Java·SQL 검증이다. 실제 빌드는 백엔드 레포에서 한다.
- `react/` 를 건드리면 `cd react && npx tsc -b && npx eslint . && npm run verify:user-smlt` 를 통과시킨다.
- DDL 은 `java/ddl/cast-ddl.sql`(참조 스키마)과 `2026-10-11-user-smlt-*.sql`(preflight/stage/executions/
  verify/cutover)을 함께 고친다. 10-11 신규 테이블은 정의를 고치고, 기존 실 테이블 변경은 stage 에 넣는다.
- AGENTS.md 와 `docs/user-smlt-master-redesign.md` 의 해당 설명을 같은 과정에서 갱신한다.
- 과정을 마치면 §6 체크리스트의 해당 항목을 체크하고 이 문서 상단 상태를 갱신한다.
- 커밋은 요청이 있을 때만 한다.

### 1번 과정 — 발행 입력 전환 (`EX_*` 제거 · 출국장 운영시간 · SC 단일 수량 · NVL)

대상 결정: §3-7, §3-1, §3-2(발행 부분), §3-3

**작업**
1. `CastUserSmltServiceImpl`
   - `freezeTerminal()` 에서 `EX_*` INSERT(`:109-125`)와 `snapshotScope()` 를 걷어낸다.
     T1·T2 확정 DTO(FLT_PSG·CHKN·DEP)를 모아 `castUserSnapshotService.publish()` 에 넘긴다.
   - 체크인 부스 필터는 발행용 복사본에서만 한다.
2. `CastUserSnapshotService(Impl)` — `publish()` 시그니처에 확정 DTO 묶음을 받는다.
   `UserSmltRsrcSnapshotDto` 에 발행용 행 목록을 싣는다(운항 조정률, 체크인 부스·운영시간·아일랜드 수량,
   출국장 운영 여부·레인·운영시간·보안검색대 수량).
3. `CastUserSnapshotMapper.xml` — 발행 SQL 6개를 `EX_*` 대신 `<foreach>` 인라인 행으로 바꾼다
   (`insertSchdlAtrbFromDaily`, `insertSchdlAtrbFromSrc`, `insertCknctAtrb`, `insertSbdAtrb`,
   `insertSbdAtrbKiosk`, `insertDptgtAtrb`, `insertScrtyCntrlAtrb`). §3-7 표의 유지 규칙을 그대로 지킨다.
   - `insertScrtyCntrlAtrb`: 운영 Y·`scshCntom > 0` 출국장마다 1행, `FCLTY_CNT = scshCntom`. `planList` 를 읽지 않는다.
   - `insertDptgtAtrb`: 운영 Y 출국장의 운영구간마다 1행. 레인 수는 일반+스마트.
4. DepartureGate 운영시간(§3-1)
   - `TN_PM_SMLT_FCLTY_OPNG_DPTGT_ATRB` 에 사용자 시각 컬럼 2개(예: `OPER_BGNG_HM`, `OPER_END_HM`, `VARCHAR2(4)`,
     NULL 허용)를 추가한다. 기존 실 테이블이므로 stage 에 `ALTER` 를 넣고 `cast-ddl.sql` 정의도 고친다.
   - 발행 시 `HHMM` 으로 넣는다(24 → `2359`).
   - `CastRestMapper.xml#retrieveFcltyOpngTblDptg`(`:1945-1987`): 시각 컬럼이 있는 행은 운영계 조인 대신
     FS 그룹 일자로 `StartDate`·`EndDate` 를, 컬럼 값으로 `StartTime`·`EndTime` 을 만든다. 시각 컬럼이 NULL 인
     행(일일 `001`)은 현행 운영계 조인을 그대로 쓴다(INNER → 분기 처리). 표기 형식은 현행과 같게
     `YYYY-MM-DDT00:00:00.000`, `1899-12-30THH:MI:SS.000`.
5. `retrieveFcltyOpngTblDptg` 의 `sideDoor`·`facialRecognition` `LISTAGG` 에 `NVL(…, ' ')` (§3-3).
6. 실행 확정 INSERT 분기 정리: `CastFltPsgMapper.xml:61~`, `CastChknMapper.xml:127-199`,
   `CastDepMapper.xml:108-183` 의 `snapshotSmltId` 분기를 지우고, 사용처가 없으면
   `UserSmltCurrentDto.snapshotSmltId` 도 지운다.
7. DDL·이관: `EX_*` 7개의 정의·COMMENT·FK(`cast-ddl.sql:1948~2121` 부근), stage 의 `create_once`
   (`:211-351`), cutover 의 `add_fk`(`:68-83`), verify 의 EX 검사를 지운다.
8. 문서: AGENTS.md §11.1·§11.2 의 "`TN_PM_SMLT_EX_*` 발행용 정규화 확정 조건 7종" 행과 설명,
   `docs/user-smlt-master-redesign.md` 의 EX 고정 설명(`:48` 등)을 이 결정에 맞춘다.

**하지 않는 것:** 화면·`planList` 계약 변경(2번), 번호·PS·`_U`·`INPUT_SNAPSHOT`(3번).

**완료 기준**
- `grep -rn "TN_PM_SMLT_EX_\|snapshotSmltId" java docs AGENTS.md` 결과가 결정 기록(이 문서) 외 0건.
- 변경 전후 FS·CA·SBD·키오스크·DepartureGate·SC 발행 SQL 이 같은 규칙을 쓰는지 SQL 대조 표를 작업 보고에 남긴다
  (미저장/빈 저장, T1·T2, 여러 운영구간, 부스번호·장비수량·항공사 목록).

### 2번 과정 — 보안검색대 시간별 계획 제거 (화면 · 계약 · 저장)

대상 결정: §3-2 (화면·계약·저장 부분)

**작업**
1. 화면 (`react/src/modules/pm/pages/userSmlt/tabs/departure/`)
   - `components/ScGrid.tsx` 삭제, `DepartureTab.tsx` 에서 그리드·피크 요약·"피크 시간대 기준" 안내 제거.
     보안검색대 수량 입력은 "출국장별 최종 보안검색대 수량" 의미로 남긴다.
   - `view.ts`·`types.ts` 의 계획 관련 뷰모델·매퍼 제거.
2. 계약: `react/src/types/api.types.ts` 의 `ScPlanDto`, `UserSmltDepItemDto.planList`, 저장 요청의
   `'planList'` Pick 제거. `react/src/api/pm/mock/userSmlt.mock.ts` 의 계획 목업 제거.
   `react/scripts/verify-user-smlt.mjs` 가 계획을 다루면 같이 정리한다.
3. Java: `ScPlanDto`, `UserScPlanRawDto` 삭제, `DepGateDto.planList` 제거, `CastDepMapper(.java/.xml)` 의
   계획 SELECT·INSERT·DELETE 제거, `CastDepServiceImpl` 의 계획 조립·저장 제거.
4. DDL·이관: `TN_PM_SMLT_SCSH_OPER_PLAN` — stage 의 `_LGC` 백업(`:364`)은 유지, `_V2` 생성(`:188-204`)·
   이관 INSERT(`:464-468`) 제거, cutover 의 `unchanged`·`swap_table`·`add_fk`(`:32`, `:52`, `:67`) 에서 제외하고
   원본을 `_OLD` 로 남기는 처리 추가, verify 의 계획 검사(`:22-23`) 제거, `cast-ddl.sql` 정의 제거.
5. 문서: AGENTS.md §3-1 에 `planList`·`ScPlanDto` 삭제 예외(2026-10-12)를 기록.

**하지 않는 것:** SC 발행 SQL(1번에서 완료), 번호·PS(3번).

**완료 기준**
- `cd react && npx tsc -b && npx eslint . && npm run verify:user-smlt` 통과.
- `grep -rn "planList\|ScPlan\|ScGrid\|SCSH_OPER_PLAN" react/src react/scripts java AGENTS.md` 결과가
  `_LGC`/`_OLD` 이관 처리와 AGENTS 예외 기록 외 0건.
- 화면 육안 확인: 출국장 탭에 시간별 계획 UI 가 없고 수량 입력·저장·실행이 동작(목업).

### 3번 과정 — 번호 순환 · 실행용 PS · `_U` 폐지 · 리소스 목록

대상 결정: §3-4, §3-5, §3-6

**작업**
1. DDL·이관
   - `TN_PM_SMLT_RSRC_LEASE`: `RSRC_KIND` 추가, PK `(RSRC_KIND, RSRC_NO)`, UNIQUE `(RSRC_KIND, SMLT_ID)`.
   - `TN_PM_SMLT_ID_LOCK`: `LAST_NO` 추가, `RSRC_FS`(초기값 = 기존 요청이 쓴 최대 FS 번호, 없으면 `001`)·
     `RSRC_PS`(초기값 `499`) 행 추가.
   - `TN_PM_SMLT_INPUT_SNAPSHOT`: PK `(SMLT_ID, RESOURCE_TYPE, RESOURCE_ID)`, `SMLT_ID NOT NULL`.
   - stage: 전송 7쌍의 사용자 번호(`002~999`) 행을 `*_LGC` 로 백업.
   - preflight: `TN_PM_SMLT_FIX_ATRB_GROUP` 에 `500~998` 그룹이 있으면 보고(있으면 cutover 전 처리 방침 결정).
   - `INPUT_BASE` seed SQL(§3-5, 값은 바인드 자리표시)과 verify 검사 3종 추가.
2. 번호 예약 (`CastExecutionMapper.xml`, `CastUserSnapshotServiceImpl.getSnapshot()`)
   - `reserveRsrcNo` 를 "마지막 번호 다음부터 순환하며 소유 실행이 종료(§3-0-4)거나 소유자 없는 첫 번호"로
     바꾼다. lease 가 없는 기존 요청은 `FLT_SCHDL_RSRC_ID` 로 같은 판정. FS(`002~999`)·PS(`500~998`) 두 풀.
   - 재사용이면 lease 소유 실행 UPDATE, 아니면 INSERT. `LAST_NO` 갱신. 모두 `EXECUTION` 잠금 안.
3. 발행 (`CastUserSnapshotServiceImpl`)
   - `RsrcTable` 에 `ENTCNY`·`TRNST_SCRTY_CNTRL` 추가. 원천(`INPUT_BASE` 의 IMMI/TR 리소스, 즉 `001`)
     ATRB 행을 FS 번호로 복사하는 INSERT 추가. 재사용 시 7쌍 모두 DELETE → INSERT.
   - `_U` 치환(`:51-54`)과 가상 ID 보관을 제거한다. 모델·서비스시간·체크인유형·출국심사·리포팅은 원본 ID 로
     요청에 넣고, 기록용으로 `INPUT_SNAPSHOT` 에 `(SMLT_ID, type, 원본ID, SOURCE_ID=원본ID)` 로 보관한다.
   - `PS5xx` 생성: `PS001` 렌더 → §3-5 표대로 5종 참조를 FS 번호로 치환 → ID 를 `PS5xx` 로 바꿔 보관.
     치환은 현행처럼 단어 경계 정규식을 쓴다.
   - `getUserReq()`: 입국심사·환승보안은 FS 번호 리소스, PropertySet 은 `PS5xx`.
4. CAST 응답 (`CastExecutionMapper.xml#retrieveInput`, `CastRestServiceImpl.retrieveResource()`)
   - 현재 lease 소유 실행의 행만 반환한다. 번호 리소스는 `RSRC_KIND='FS'`, PropertySet 은 `'PS'` 로 lease 를
     조인하고 ID 끝 세 자리를 `RSRC_NO` 와 맞춘다. 원본 ID 기록 행은 반환하지 않는다.
5. 리소스 목록 (`CastRestMapper.xml#retrieveResourceInformation`) — `PS5xx` UNION 추가(§3-6).
6. `CastRestMapper.xml#retrieveModelInfo` 의 `INPUT_SNAPSHOT` 서브쿼리 제거, `SMLT_MDL_EXPLN = #{modelResourceID}` 로.
7. 카테고리 채번: `CastConfigMapper.xml#retrieveAvailableCategoryId` 를 `002~499` 로(`CONNECT BY LEVEL <= 498`).
8. 결과 연결: 결과 후보 조회(`CastRestMapper.xml:2242-2245`)·`CastRestServiceImpl.java:2512-2520` 가 FS 번호만으로
   현재 lease 실행을 고르지 않는지 확인하고, 필요하면 WI 우선·후보 1건 규칙을 보강한다.
9. 문서: AGENTS.md §11.3(번호 재사용 금지·`원본ID_U실행ID`·입력 XML 보존 문장), §11.2 표(`ID_LOCK`·`RSRC_LEASE`·
   `INPUT_SNAPSHOT`), §11.5 실연계 검증 대상(가상 ID 왕복 → `PS5xx`·번호 입국심사 왕복), §8 속성그룹 ID 표
   (`500~998` 실행용 예약), `docs/user-smlt-master-redesign.md` 의 해당 줄(`:52-56`, `:75-82`)을 갱신한다.

**하지 않는 것:** 멈춘 실행의 번호 해제.

**완료 기준**
- `grep -rn "_U\"\|\"_U\|_U<" java AGENTS.md docs/user-smlt-master-redesign.md` 결과가 결정 기록 외 0건.
- `reserveRsrcNo` 로 `999 → 002`, `998 → 500` 경계, 진행 중 번호 건너뛰기, 전 번호 진행 중 실패를 SQL 로 설명.
- `retrieveInput`·목록 UNION·`retrieveModelInfo` 가 실행이 여러 건이어도 다건을 내지 않음을 SQL 로 설명.
- 실행 한 건의 WhatIf 요청 리소스 ID 표(FS·CA·SBD·DG·SC·Immigration·TS = FS 번호, PS = `PS5xx`,
  나머지 원본 ID)를 작업 보고에 남긴다.

---

## 5. 실 DB·CAST 에서 확인할 것 (구현과 별개)

- [ ] `INPUT_BASE` 의 `MDL_RSRC_ID`(일일 모델 `SMLT_MDL_EXPLN`), `RPT_STNG_ATRB_ID` 실제 값
- [ ] `TN_PM_SMLT_FIX_ATRB_GROUP` 에 `500~998` 카테고리가 이미 있는지
- [ ] CAST 가 리소스 목록을 대조하는지, `PS5xx`·번호 입국심사/환승보안 리소스를 받아 실행하는지 (테스트 환경 1회)
- [ ] DepartureGate 에 같은 출국장의 운영구간이 여러 행으로 들어가도 CAST 가 받는지
- [ ] `CAOWN.TN_CA_CKNCT.TMNL_ID` 가 `P01`/`P03` 형식인지 (CA·SBD 발행 조인 조건)
- [ ] DepartureGate 조인 `A.GATE_NO = B.FCLTY_TYPE_ID` 가 실제 데이터에서 맞물리는지 (`CastRestMapper.xml:1987`)
- [ ] 운항편 `TMNL_ID = 'P'` 행은 `DECODE` 결과가 NULL 이라 조정률이 적용되지 않는다. 화면 집계
      (`CastFltPsgMapper#retrieveFltPsgHourList`)가 `'P'` 를 세는지 대조
- [ ] CAST 가 `TN_PM_SMLT_INPUT_SNAPSHOT` 에서 꺼낸 보관 XML 을 실제로 받아 실행하는지

## 6. 진행 체크리스트

- [x] 정책 결정 완료 (§3-0~§3-7, 2026-10-12)
- [x] 1번 과정 — 발행 입력 전환 (`EX_*` 제거 · 출국장 운영시간 · SC 단일 수량 · NVL)
- [x] 2번 과정 — 보안검색대 시간별 계획 제거 (화면 · 계약 · 저장)
- [x] 3번 과정 — 번호 순환 · 실행용 PS · `_U` 폐지 · 리소스 목록
- [ ] §5 실 DB·CAST 확인

## 7. 결정 이력

| 일자 | 절 | 결정 |
|---|---|---|
| 2026-10-12 | 3-1 | 사용자 출국장 운영시간을 DepartureGate 에 반영. 일일은 운영계 유지. 날짜 = 실행일자, 24시 = 2359 |
| 2026-10-12 | 3-2 | SC 는 일일·사용자 모두 수량만. 운영 Y·수량>0 출국장만 발행. 기존 계획 폐기, `planList`·계획 테이블 삭제 |
| 2026-10-12 | 3-3 | 조회 SQL 에 `NVL(…, ' ')` |
| 2026-10-12 | 3-4 | `002~999` 순환, 종료 판정 = MSTR `Finished`/`Failed`, 진행 중 건너뛰기, 대기시간 없음, 멈춘 실행 조치 없음, lease UPDATE |
| 2026-10-12 | 3-5 | `INPUT_BASE` 유지·원천 = 일일 Auto 조합·seed SQL. 실행별 `PS5xx`, 범위 `500~998`, Cast 설정 비노출, XML 보관, FS 와 독립 순환 |
| 2026-10-12 | 3-6 | 원본 불변 가정 하에 `_U` 폐지. 입국심사·환승보안은 FS 번호 리소스. 목록 추가 노출은 `PS5xx` 만, `LastModified` = MSTR 등록시각 |
| 2026-10-12 | 3-7 | `EX_*` 7개 제거, 확정 DTO 직접 전달 |
| 2026-10-12 | 3-0 | 10-11 DDL 실 DB 미적용 확인. 등록~CAST 수집 사이 원본 불변을 운영 가정으로 둠 |
| 2026-10-12 | 3-5·3-6 | (3번 과정 구현 중) 입국심사·환승보안이 번호 리소스의 복사 원천이 되므로 `INPUT_BASE` 필수 검사를 4종 → 6종으로 늘림. seed 는 `2026-10-11-user-smlt-input-base-seed.sql` 로 분리 |
