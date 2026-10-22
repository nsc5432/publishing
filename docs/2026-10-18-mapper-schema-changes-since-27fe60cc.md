# Mapper 쿼리 기준 테이블·컬럼 변경사항

## 비교 기준

- 작성일: 2026-10-18
- 기준 커밋: `27fe60cc76d86095ee90be60412b559175cfd372` (2026-09-10)
- 비교 대상: `1de12e90a6f8c92626dbc5d35eabce66e0857fa8` 및 작성 당시 작업 트리
- 조사 범위: `java/mapper`의 SQL을 기준으로 비교하고, `java/ddl/cast-ddl.sql` 및 이관 SQL로 물리 정의를 대조했다.
- 기준 커밋에 이미 반영된 변경은 제외하고, 기준 시점과 현재 사이의 **순변경**을 정리했다.
- 실제 DB에 접속하거나 이관 SQL을 실행하지 않았다. 이 문서는 **저장소 소스 기준**이며 실제 DB 적용 여부를 의미하지 않는다.

## 요약

| 구분 | 결과 |
|---|---:|
| 추가된 업무 테이블 | 없음 |
| 삭제·사용 종료된 테이블 | 3개 |
| 이름 변경된 업무 테이블 | 없음 |
| 기존 테이블에 추가된 컬럼 | 16개 |
| 유지되는 테이블에서 삭제된 컬럼 | 7개 |
| 기존 컬럼 물리 정의 변경 | 기본값 변경 1개 |
| 기타 변경 | PK·UK·FK·고유 인덱스 및 컬럼 사용 의미 변경 |

삭제된 테이블 전체의 컬럼은 삭제 컬럼 7개에 중복 집계하지 않았다. 계산 결과·SQL 별칭·CTE 컬럼은 물리 컬럼 변경에서 제외했다.

## 1. 추가된 테이블

신규 생성이 확인되는 업무 테이블은 없다.

다만 `PMOWN.DROP_TMP`의 `BASE_DT`를 조회하는 쿼리가 추가됐다. 저장소에서 생성 DDL을 확인할 수 없어 **테이블 신설이 아니라 신규 참조**로 분류한다. `BASE_DT` 역시 새로 생성된 컬럼이라고 단정할 수 없다.

- 근거: [CastApiMapper.xml](../java/mapper/CastApiMapper.xml), `selectBaseYmdForCalibration`

`CastExecutionMapper.xml`, `CastResourceConditionMapper.xml`, `CastDepHallMapper.xml` 파일 신설도 기존 테이블에 대한 쿼리 추가이며 신규 테이블 생성을 의미하지 않는다.

## 2. 삭제된 테이블

| 테이블 | 변경 내용 | 물리 처리 |
|---|---|---|
| `TN_PM_SMLT_USER_FLT_PSG_TMZN_AJMT` | 시간대별 운항·여객 조정 기능 제거 | DROP DDL 존재 |
| `TN_PM_SMLT_SCSH_OPER_PLAN` | 보안검색대 시간별 운영계획 제거 | 이관 시 `_OLD`로 보존하고 업무 사용 종료 |
| `TH_PM_SMLT_FLFMT_HSTRY` | 수행이력 테이블 제거. 모니터링은 `USER_MSTR + STNG`에서 조회 | `_BAK_1018` 백업 후 DROP하는 DDL 존재 |

`TN_PM_SMLT_SCSH_OPER_PLAN`은 업무 스키마·쿼리에서 제거됐지만, 이관 스크립트는 원본을 `_OLD`로 보존한다. 운영 사용 종료와 물리 DROP을 구분해야 한다.

근거:

- [2026-10-11-user-flt-psg-ratio-only.sql](../java/ddl/2026-10-11-user-flt-psg-ratio-only.sql)
- [2026-10-11-user-smlt-master-cutover.sql](../java/ddl/2026-10-11-user-smlt-master-cutover.sql), `retire_table`
- [2026-10-18-remove-flfmt-hstry.sql](../java/ddl/2026-10-18-remove-flfmt-hstry.sql)

## 3. 이름 변경된 테이블

최종 업무 테이블명 기준으로는 없다.

이관 스크립트에는 다음과 같은 백업·교체 절차가 있다.

- 기존 테이블 → `*_OLD`
- `*_V2` → 기존 테이블명

이는 기존 업무 테이블의 이름을 다른 업무 이름으로 변경한 것이 아니라, 새로운 키 구조의 테이블로 교체하는 절차다. 수행이력 조회를 `USER_MSTR + STNG`로 대체한 것도 이름 변경으로 집계하지 않는다.

- 근거: [2026-10-11-user-smlt-master-cutover.sql](../java/ddl/2026-10-11-user-smlt-master-cutover.sql)

## 4. 테이블에 추가된 컬럼

### 4.1 사용자 현재상태 테이블 — 12개

다음 6개 테이블에 각각 동일한 2개 컬럼이 추가됐다.

| 테이블 | 추가 컬럼 |
|---|---|
| `TN_PM_SMLT_USER_FLT_PSG_AJMT` | `OWNER_USER_ID`, `EXCN_YMD` |
| `TN_PM_SMLT_USER_CHKN_ISL` | `OWNER_USER_ID`, `EXCN_YMD` |
| `TN_PM_SMLT_USER_CHKN_OPER_HR` | `OWNER_USER_ID`, `EXCN_YMD` |
| `TN_PM_SMLT_USER_CHKN_BOOTH` | `OWNER_USER_ID`, `EXCN_YMD` |
| `TN_PM_SMLT_USER_DPTGT` | `OWNER_USER_ID`, `EXCN_YMD` |
| `TN_PM_SMLT_USER_DPTGT_OPER_HR` | `OWNER_USER_ID`, `EXCN_YMD` |

| 추가 컬럼 | 타입 | 의미 |
|---|---|---|
| `OWNER_USER_ID` | `VARCHAR2(40) NOT NULL` | 현재 편집 상태의 소유 사용자 |
| `EXCN_YMD` | `VARCHAR2(8) NOT NULL` | 대상일자 `yyyyMMdd` |

실행 ID에 연결해 저장하던 편집 조건을 **사용자·일자·터미널별 현재상태**로 저장하도록 변경했다.

근거:

- [CastFltPsgMapper.xml](../java/mapper/CastFltPsgMapper.xml)
- [CastChknMapper.xml](../java/mapper/CastChknMapper.xml)
- [CastDepMapper.xml](../java/mapper/CastDepMapper.xml)
- [cast-ddl.sql](../java/ddl/cast-ddl.sql), 위 6개 테이블의 CREATE TABLE 정의

### 4.2 출국장 리소스 테이블 — 4개

대상 테이블: `TN_PM_SMLT_FCLTY_OPNG_DPTGT_ATRB`

| 추가 컬럼 | 타입 | NULL 허용 | 기본값 | 의미 |
|---|---|---|---|---|
| `OPER_BGNG_HM` | `VARCHAR2(4)` | 허용 | 없음 | 운영시작시분 |
| `OPER_END_HM` | `VARCHAR2(4)` | 허용 | 없음 | 운영종료시분 |
| `GNRL_SRCH_CNTOM` | `NUMBER(20,0)` | 허용 | 없음 | 일반검색대수 |
| `SMART_PASS_SRCH_CNTOM` | `NUMBER(20,0)` | 허용 | 없음 | 스마트패스검색대수 |

`TN_PM_SMLT_USER_DPTGT`의 동명 검색대수 컬럼 2개는 기준 커밋에도 존재했으므로 추가 대상으로 집계하지 않는다.

근거:

- [CastUserSnapshotMapper.xml](../java/mapper/CastUserSnapshotMapper.xml), 출국장 리소스 발행 SQL
- [CastResourceConditionMapper.xml](../java/mapper/CastResourceConditionMapper.xml), 출국장 조건 조회 SQL
- [cast-ddl.sql](../java/ddl/cast-ddl.sql), `TN_PM_SMLT_FCLTY_OPNG_DPTGT_ATRB`
- [2026-10-11-user-smlt-master-stage.sql](../java/ddl/2026-10-11-user-smlt-master-stage.sql), 운영시작·종료시분 추가
- [2026-10-16-remove-smlt-snapshots.sql](../java/ddl/2026-10-16-remove-smlt-snapshots.sql), 검색대수 컬럼 추가

## 5. 테이블에 삭제된 컬럼

| 테이블 | 삭제 컬럼 | 기존 타입 |
|---|---|---|
| `TN_PM_SMLT_USER_FLT_PSG_AJMT` | `SMLT_ID` | `VARCHAR2(8) NOT NULL` |
| `TN_PM_SMLT_USER_CHKN_ISL` | `SMLT_ID` | `VARCHAR2(8) NOT NULL` |
| `TN_PM_SMLT_USER_CHKN_OPER_HR` | `SMLT_ID` | `VARCHAR2(8) NOT NULL` |
| `TN_PM_SMLT_USER_CHKN_BOOTH` | `SMLT_ID` | `VARCHAR2(8) NOT NULL` |
| `TN_PM_SMLT_USER_DPTGT` | `SMLT_ID` | `VARCHAR2(8) NOT NULL` |
| `TN_PM_SMLT_USER_DPTGT_OPER_HR` | `SMLT_ID` | `VARCHAR2(8) NOT NULL` |
| `TN_PM_SMLT_USER_MSTR` | `SMLT_FLFMT_SN` | `NUMBER(5,0) NOT NULL` |

총 7개다. `SMLT_ID → OWNER_USER_ID`라는 단순 이름 변경이 아니라 **기존 컬럼 삭제 후 사용자·일자 컬럼 추가**다.

`TN_PM_SMLT_USER_MSTR`, `TN_PM_SMLT_STNG`, 결과 상세 테이블의 `SMLT_ID`는 유지된다. `USER_MSTR.RSLT_SMLT_ID`도 삭제되지 않았다.

- 근거: [cast-ddl.sql](../java/ddl/cast-ddl.sql), [CastUserReqMapper.xml](../java/mapper/CastUserReqMapper.xml)

## 6. 테이블에 변경된 컬럼

### 6.1 기존 컬럼 물리 정의 변경

| 테이블 | 컬럼 | 이전 | 현재 |
|---|---|---|---|
| `TN_PM_SMLT_USER_FLT_PSG_AJMT` | `AJMT_TYPE_CD` | 기본값 없음 | `DEFAULT 'RATIO'` 추가 |

타입은 `VARCHAR2(10)`으로 유지된다. 쿼리도 조정방식을 `RATIO`로 고정해 저장한다. SELECT 목록에서 빠졌더라도 INSERT·UPDATE에 남아 있으므로 컬럼 삭제가 아니다.

**유지되는 기존 컬럼의 타입·길이·NULL 허용 여부는 순변경이 없다.**

- 근거: [cast-ddl.sql](../java/ddl/cast-ddl.sql), [2026-10-11-user-flt-psg-ratio-only.sql](../java/ddl/2026-10-11-user-flt-psg-ratio-only.sql), [CastFltPsgMapper.xml](../java/mapper/CastFltPsgMapper.xml)

### 6.2 저장값·사용 의미 변경

아래는 컬럼명·타입 변경과 구분되는 저장값 또는 사용 방식의 변경이다.

| 테이블·컬럼 | 변경 내용 |
|---|---|
| `TN_PM_SMLT_STNG.SMLT_TYPE` | 사용자 유형 `Manual`을 `WhatIf`로 통일. 현재는 일일 `Auto`, 사용자 `WhatIf` 사용 |
| `TN_PM_SMLT_USER_MSTR.SMLT_ID` | 편집 조건 ID·회차 구조에서 공통 실행 ID로 변경 |
| `TN_PM_SMLT_STNG.SMLT_ID` | 사용자 결과도 요청의 공통 실행 ID를 사용 |
| `TN_PM_SMLT_RSLT_DTL.SMLT_ID` | 동일 실행의 공통 ID로 결과 상세 연결 |
| `TN_PM_SMLT_RSLT_DTL_REG_EXCL.SMLT_ID` | 동일 실행의 공통 ID로 미매핑 결과 연결 |
| `TN_PM_SMLT_USER_MSTR.RSLT_SMLT_ID` | 호환 컬럼으로 유지. 결과 연결 후 공통 `SMLT_ID`와 동일한 값 사용 |
| `TN_PM_SMLT_USER_MSTR.SMLT_REQ_ID` | 컬럼 유지. 신규 요청 값 형식은 `WI + 공통 8자리 ID` |
| `TN_PM_SMLT_SCHDL_ATRB.BDPSG_CNT` | 조정값 계산 시 국제선 출발의 비환승 여객 `GREATEST(예약−환승, 0)`에만 조정률 적용 |
| `TN_PM_SMLT_USER_DPTGT.SCSH_CNTOM` | 시간별 계획 제거 후 출국장별 최종 보안검색대 수량으로 사용 |

근거:

- [2026-10-18-smlt-type-whatif.sql](../java/ddl/2026-10-18-smlt-type-whatif.sql)
- [CastUserSnapshotMapper.xml](../java/mapper/CastUserSnapshotMapper.xml), `BDPSG_CNT` 계산식
- [CastApiMapper.xml](../java/mapper/CastApiMapper.xml), 결과 저장 및 요청 연결 SQL
- [사용자 시뮬레이션 재설계 문서](user-smlt-master-redesign.md)

### 6.3 PK·UK·FK·고유 인덱스 변경

사용자 현재상태 6개 테이블은 PK의 선두 `SMLT_ID`를 `OWNER_USER_ID, EXCN_YMD`로 교체했다. 나머지 키는 유지한다.

| 테이블 | 변경 후 PK |
|---|---|
| `TN_PM_SMLT_USER_FLT_PSG_AJMT` | `OWNER_USER_ID, EXCN_YMD, TMNL_ID` |
| `TN_PM_SMLT_USER_CHKN_ISL` | `OWNER_USER_ID, EXCN_YMD, TMNL_ID, CHKN_ISL_CD` |
| `TN_PM_SMLT_USER_CHKN_OPER_HR` | `OWNER_USER_ID, EXCN_YMD, TMNL_ID, CHKN_ISL_CD, OPER_HR_SN` |
| `TN_PM_SMLT_USER_CHKN_BOOTH` | `OWNER_USER_ID, EXCN_YMD, TMNL_ID, CHKN_ISL_CD, BOOTH_NO` |
| `TN_PM_SMLT_USER_DPTGT` | `OWNER_USER_ID, EXCN_YMD, TMNL_ID, DPTGT_NO` |
| `TN_PM_SMLT_USER_DPTGT_OPER_HR` | `OWNER_USER_ID, EXCN_YMD, TMNL_ID, DPTGT_NO, OPER_HR_SN` |

그 밖의 제약조건 변경:

| 대상 | 변경 내용 |
|---|---|
| `TN_PM_SMLT_USER_MSTR` | UNIQUE `(SMLT_ID, SMLT_FLFMT_SN)` → UNIQUE `(SMLT_ID)` |
| `TN_PM_SMLT_USER_MSTR_UX_ACTIVE` | 활성 요청에 대한 고유 인덱스 제거 |
| `FK_CUR_CHKN_HR` | 현재상태 체크인 운영시간 → 체크인 아일랜드 FK 추가 |
| `FK_CUR_CHKN_BOOTH` | 현재상태 체크인 부스 → 체크인 아일랜드 FK 추가 |
| `FK_CUR_DEP_HR` | 현재상태 출국장 운영시간 → 출국장 FK 추가 |

`TN_PM_SMLT_USER_MSTR.SMLT_REQ_ID` PK는 유지된다.

- 근거: [cast-ddl.sql](../java/ddl/cast-ddl.sql)

## 집계에서 제외한 항목

### 중간에 추가됐다가 제거된 구조

다음 테이블은 비교 기간 중 생성 이력이 있어도 현재 최종 구조에 남아 있지 않으므로 신규·삭제 순변경에 집계하지 않는다.

- `TN_PM_SMLT_MSTR`
- `TN_PM_SMLT_ID_LOCK`
- `TN_PM_SMLT_CURRENT_SAVE`
- `TN_PM_SMLT_COND_SNAPSHOT`
- `TN_PM_SMLT_INPUT_SNAPSHOT`
- `TN_PM_SMLT_RSRC_LEASE`
- `TN_PM_SMLT_RESULT_IDENTITY`
- `TN_PM_SMLT_RESULT_GROUP`
- `TN_PM_SMLT_INPUT_BASE`
- `TN_PM_SMLT_CAST_CONTRACT`

`TN_PM_SMLT_USER_MSTR.SRC_PRPT_SET_RSRC_ID`도 기간 중 추가됐다가 제거돼 순변경에 포함하지 않는다.

### 백업·이관 보조 구조

`*_LGC`, `*_OLD`, `*_V2`, `*_BAK_1016`, `*_BAK_1018`, `TN_PM_SMLT_LEGACY_*`, `TN_PM_SMLT_MIGRATION_GATE` 등은 mapper가 사용하는 현재 업무 테이블과 구분한다.

### 계산 결과·별칭 및 기존 객체의 재사용

- `AREA_CD`, `OPEN_TM`, `CLOSE_TM`, `SMLT_REQ_DT`, `BOOTH_ID`, `KIOSK_ID`, `SBD_ID` 등은 SQL 계산 결과 또는 별칭이므로 신규 물리 컬럼이 아니다.
- `CastUserConfigMapper.xml` 삭제는 해당 쿼리가 읽던 `GOOWN.TI_GO_CKNCT_DALY_ALOT`의 삭제가 아니다. 조회가 `CastChknMapper.xml`로 이동했다.
- `TN_PM_SMLT_STNG.EXCN_ID`는 기존 `runID` 매핑을 유지하며 이번 변경의 신규·변경 컬럼으로 집계하지 않는다.
- `TN_PM_SMLT_CKNCT_TYPE_ATRB_PRC` 제거는 기준 커밋에 이미 반영된 내용이므로 비교 기간의 변경으로 집계하지 않는다.

## 참고: 시퀀스 변경

테이블·컬럼 변경 집계에는 포함하지 않지만 관련 ID 발급 방식도 변경됐다.

- `SQ1_TN_PM_SMLT_RSLT`: 최종 DDL에 공통 8자리 ID 시퀀스 정의가 추가됐다. mapper에서는 사용자 실행과 일일 결과 수신에 공통으로 사용한다. 기준 시점에도 결과 채번 참조가 있어 신규 객체 생성이라고 단정하지 않는다.
- `SQ1_TN_PM_SMLT_USER_RSRC`: DDL은 `CYCLE`에서 `NOCYCLE`로 변경됐다. 현재 앱은 이 시퀀스 대신 사용 중인 리소스 번호를 조회해 미사용 번호를 할당한다.

- 근거: [cast-ddl.sql](../java/ddl/cast-ddl.sql), [CastExecutionMapper.xml](../java/mapper/CastExecutionMapper.xml)
