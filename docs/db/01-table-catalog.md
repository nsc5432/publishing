# 5.1 테이블 카탈로그

← [DB-ANALYSIS.md](DB-ANALYSIS.md)

`ddl.txt` 와 7개 MyBatis XML 에 등장하는 **모든 테이블 59개**를 스키마 소유자별로 정리한다.

| 소유자 | 의미 | 테이블 수 |
|---|---|---|
| `PMOWN` (예측관리 본체) | Prediction Mgmt — 시뮬레이션 설정·결과·CAST 자원 | 42 |
| `PMOWN.DROP_*` (연계 스테이징) | 타 시스템(AS/FP/RS/CA) 스냅샷. 소유자는 `PMOWN` 이지만 성격이 달라 분리 | 10 |
| `CAOWN` | 공통·코드·항공사·게이트 | 5 |
| `GOOWN` | 운항·게이트 운영 | 2 |

> **DDL 이 확보된 것은 2개뿐이다.** 나머지 57개는 컬럼 목록조차 SELECT/INSERT 절에 등장한 것만 안다. 여기 없는 컬럼이 "존재하지 않는다"는 뜻이 **아니다**.

---

## A. PMOWN — DDL 확보 (2개)

### A-1. `PMOWN.TN_PM_SMLT_RSLT_DTL` — PM_시뮬레이션결과상세

**출처: DDL 확보** (`ddl.txt:1-63`)

시뮬레이션 결과의 유일한 축. 체크인·셀프·출국장·검색대 화면이 전부 이 테이블에서 나온다.

| 컬럼 | 타입 | NULL | 코멘트 |
|---|---|---|---|
| `SMLT_ID` | VARCHAR2(8) | NOT NULL | 시뮬레이션아이디 |
| `SMLT_EXCN_DT` | TIMESTAMP(6) | NOT NULL | 시뮬레이션실행일시 |
| `SMLT_ACTL_DT` | TIMESTAMP(6) | NOT NULL | 시뮬레이션실제일시 |
| `SMLT_MDL_SN` | NUMBER(5,0) | NOT NULL | 시뮬레이션모델일련번호 |
| `SMLT_RSLT_SN` | NUMBER(8,0) | NOT NULL | 시뮬레이션결과일련번호 |
| `PSG_FCLT_CD` | VARCHAR2(8) | NOT NULL | 여객시설코드 |
| `REL_EVENT_CD` | NUMBER(5,0) | | 관련이벤트**수** (코멘트가 `_CD` 접미와 어긋난다 — G13) |
| `WTNG_PSG_CNT` | NUMBER(5,0) | | 대기여객수 |
| `TRNST_PSG_CNT` | NUMBER(5,0) | | 통과여객수 |
| `AVG_PRCS_HR` / `MIN_PRCS_HR` / `MAX_PRCS_HR` | NUMBER(5,0) | | 평균/최소/최대 처리시간 |
| `AVG_WTNG_HR` / `MIN_WTNG_HR` / `MAX_WTNG_HR` | NUMBER(5,0) | | 평균/최소/최대 대기시간 |
| `AVG_WTNG_LEN` / `MIN_WTNG_LEN` / `MAX_WTNG_LEN` | NUMBER(5,0) | | 평균/최소/최대 대기길이 |
| `INDV_REQ_AVG_AREA` | NUMBER(5,0) | | 개인소요평균면적 |
| 감사 6종 | | | [02-naming-convention.md](02-naming-convention.md) 참고 |

- **PK (확정)**: `TN_PM_SMLT_RSLT_DTL_PK` = (`SMLT_ID`, `SMLT_EXCN_DT`, `SMLT_ACTL_DT`, `SMLT_MDL_SN`, `SMLT_RSLT_SN`, `PSG_FCLT_CD`) — `ddl.txt:28`
- 테이블스페이스: 데이터 `TSDPM01` / 인덱스 `TSIPM01`
- **시간 단위 주의**: `AVG_PRCS_HR` / `AVG_WTNG_HR` 은 이름이 `_HR`(시간)이지만 `NUMBER(5,0)` 이고 화면은 분/초 단위로 쓴다. 실단위는 미확인 (G14).
- 조회 시 항상 `WTNG_PSG_CNT > 0` 필터가 붙는다 (`CastChknMapper.xml:32`, `CastDepMapper.xml:33`, `CastSlfchknMapper.xml:44`, `CastSmltMapper.xml:57`). **대기 0인 시간대는 결과에 없다** — 차트에서 빈 시간대를 0으로 채우는 건 애플리케이션 책임이다.
- 쓰기: `insertSimResultDtl` (`CastRestMapper.xml:1639`, `<foreach>` 벌크), `deleteSimRsltDtl` (`:1737`), `deleteSimResultDtl` (`:1757`), `updateSimResultDtl` (`:1764`, **문법 오류** G3)

### A-2. `PMOWN.TN_PM_SMLT_PSG_FCLT` — PM_시뮬레이션여객시설

**출처: DDL 확보** (`ddl.txt:66-106`)

시설 마스터. 결과 테이블과 조인해 "이 결과가 어느 시설의 것인가"를 정한다.

| 컬럼 | 타입 | NULL | 코멘트 |
|---|---|---|---|
| `PSG_FCLT_CD` | VARCHAR2(8) | NOT NULL | 여객시설코드 |
| `UP_PSG_FCLT_CD` | VARCHAR2(8) | | 상위여객시설코드 — **자기참조 계층** |
| `PSG_FCLT_NM` | VARCHAR2(100) | | 여객시설명 |
| `PSG_FCLT_EXPLN` | VARCHAR2(200) | | 여객시설설명 |
| `TMNL_ID` | VARCHAR2(4) | | 터미널아이디 (`P01`/`P02`/`P03`) |
| `SORT_SEQ` | NUMBER(3,0) | | 정렬순서 |
| `USE_YN` | VARCHAR2(1) | | 사용여부 |
| `SMLT_FCLT_NM` | VARCHAR2(100) | | 시뮬레이션시설명 — CAST 엔진 쪽 이름 |
| 감사 6종 | | | |

- **PK (확정)**: `TN_PM_SMLT_PSG_FCLT_PK` = (`PSG_FCLT_CD`) — `ddl.txt:82`
- `SMLT_FCLT_NM` 은 CAST 엔진이 돌려주는 시설명과의 매칭 키다 (`CastRestMapper.xml:1559` `checkFcltCd ... WHERE SMLT_FCLT_NM = #{paxFcltCd}`). 셀프체크인 아일랜드도 이 컬럼에서 뽑는다 (`CastSlfchknMapper.xml:26`).
- `UP_PSG_FCLT_CD` 상위 코드값은 [03-sql-patterns.md](03-sql-patterns.md) ④ 참고.

---

## B. PMOWN — 시뮬레이션 실행·결과 (8개, 전부 쿼리에서 유추)

### B-1. `PMOWN.TN_PM_SMLT_STNG` — PM_시뮬레이션설정

**출처: 쿼리에서 유추** (`CastSmltMapper.xml:7-13` SELECT / `CastRestMapper.xml:1572-1603` INSERT)

시뮬레이션 1건의 헤더. `SMLT_ID` 로 결과·화면이 전부 묶인다.

관찰된 컬럼 (INSERT 컬럼 목록이 SELECT 와 정확히 일치 → **이 28개가 감사 컬럼 제외 전량일 가능성이 높다**):

`SMLT_ID`, `SMLT_MDL_SN`, `SMLT_NM`, `SMLT_TYPE`, `CRTR_DT`, `EXCN_YMD`, `TMNL_ID`, `SLF_ID`, `PRNT_ID`, `FLT_SCHDL_RSRC_ID`, `BAG_ALCTN_RSRC_ID`, `CKNCT_ALCTN_RSRC_ID`, `PRPT_SET_RSRC_ID`, `MDL_RSRC_ID`, `EXCN_ID`, `CKNCT_SRVC_HR_RSRC_ID`, `CHKN_TYPE_RSRC_ID`, `FCLTY_OPNG_TBL_DG_RSRC_ID`, `FCLTY_OPNG_TBL_EMI_RSRC_ID`, `FCLTY_OPNG_TBL_IMMI_RSRC_ID`, `FCLTY_OPNG_TBL_SCRTY_CNTRL_RSRC_ID`, `FCLTY_OPNG_TBL_TR_SCRTY_CNTRL_RSRC_ID`, `SBD_CNTRL_ALCTN_ID`, `PLAN_BGNG_DT`, `PLAN_END_DT`, `SMLT_BGNG_DT`, `SMLT_END_DT`, `BDPSG_ANCE_YN` + 감사 6종

- **PK 추정**: (`SMLT_ID`) 또는 (`SMLT_ID`, `SMLT_MDL_SN`). 근거 — `deleteSimSetMst` 는 `SMLT_ID` 단독 (`CastRestMapper.xml:1744`), `retrieveSimSetByPk` 는 `SMLT_ID` + `SMLT_MDL_SN` (`:1751-1752`). **DBA 확인 필요.**
- `SMLT_ID` 채번: `PMOWN.SQ1_TN_PM_SMLT_RSLT.NEXTVAL` (`:1550`) — 시퀀스명이 `_RSLT` 인데 `_STNG` 의 PK 를 채번한다.
- `SMLT_TYPE`: `AUTO` = 일일 시뮬레이션 (`CastSmltServiceImpl.java:67`). 사용자 시뮬레이션 쪽 값은 **미확인**.
- `TMNL_ID`: `insertSimSet` 은 `'P01'` **하드코딩** (`CastRestMapper.xml:1610`). CAST 연동 경로에서는 터미널 구분을 안 한다는 뜻 (G2).
- `*_RSRC_ID` 22개는 전부 CAST 리소스 ID(문자열)다. `TN_PM_SMLT_*_MSTR` 계열의 ID 에 `FS`/`CA`/`SBD`/`PS` 등 접두를 붙인 값이다.

### B-2. `PMOWN.TN_PM_SMLT_MDL` — PM_시뮬레이션모델

**출처: 쿼리에서 유추** (`CastRestMapper.xml:1498-1517` INSERT / `:1541-1545` SELECT)

`SMLT_MDL_SN`, `SMLT_MDL_EXPLN`, `SMLT_MDL_FILE_PATH_NM`, `DEL_YN`, `SMLT_MDL_TYPE_CD`, `SMLT_EXCN_SE_CD` + 감사 6종

- **PK 추정**: (`SMLT_MDL_SN`) — 채번이 `NVL(MAX(TO_NUMBER(SMLT_MDL_SN)),0)+1` (`:1492`)
- `SMLT_MDL_TYPE_CD`: `'1'` = CASTModel, `'2'` = CASTExpressModel (`:36`, `:49`, `:1460`, `:1477`)
- `SMLT_MDL_EXPLN` 이 실질적 조회 키다 (`:1487`, `:1526`, `:1536`, `:1545`) — 이름이 `_EXPLN`(설명)인데 **유일 키처럼 쓴다** (G15).
- `SMLT_MDL_FILE_PATH_NM` → `TN_PM_PSG_MNG_ATFL.ATCH_FILE_ID` 로 조인 (`:33-34`)
- 삭제는 `DEL_YN = 'Y'` 소프트 삭제 (`:1531-1536`)

### B-3. `PMOWN.TN_PM_PSG_MNG_ATFL` — PM_여객관리첨부파일

**출처: 쿼리에서 유추** (`CastRestMapper.xml:1815-1824` SELECT / `:1843-1855` INSERT)

`ATCH_FILE_ID`, `ATCH_FILE_SN`, `ATCH_FILE_TASK_SE_CD`, `ATCH_FILE_TYPE_CD`, `ATCH_FILE_NM`, `STRG_FILE_NM`, `ATCH_FILE_PATH_NM`, `ATCH_FILE_SZ`, `ATCH_FILE_EXTN_NM`, `ATCH_FILE_EXPLN` + 감사 6종

- **PK 추정**: (`ATCH_FILE_ID`, `ATCH_FILE_SN`) — `deleteAtchFile` 이 두 컬럼으로 지운다 (`:1894-1895`)
- `ATCH_FILE_ID` 채번 규칙: `YYYYMMDD` + 3자리 순번 (`:1901-1903`)
- `updateAtchFile` (`:1873-1888`) 이 `LST_MOD_TSP` 컬럼을 SET 하고 `WHERE LAST_MDFCN_DT = #{atchFileId}` 를 쓴다 — **버그**. `LST_MOD_TSP` 컬럼의 실재 여부도 **미확인** (G9).

### B-4. `PMOWN.TH_PM_SMLT_EXCN_LOG` — PM_시뮬레이션실행로그 (이력)

**출처: 쿼리에서 유추** (`CastRestMapper.xml:6-14`)

`SMLT_EXCN_DT`, `SMLT_EXCN_STEP_CD`, `SMLT_EXCN_STTS_CD`, `FRST_RGTR_ID`, `FRST_RGTR_IP_ADDR`, `FRST_REG_DT`

- INSERT 전용. 조회 statement 가 없다. `FRST_RGTR_ID` 는 `'CAST'` 하드코딩 (`:20`).
- 코드값(`STEP_CD` / `STTS_CD`) 집합 **미확인** — 4단계 모니터링 화면이 필요로 한다.

### B-5. `PMOWN.TN_PM_SMLT_RSLT_DTL_REG_EXCL` — PM_시뮬레이션결과상세등록제외

**출처: 쿼리에서 유추** (`CastRestMapper.xml:1693-1702`)

`SMLT_ID`, `SMLT_SN`, `PSG_FCLT_DESC` + `FRST_*` 3종

- **PK 추정**: (`SMLT_ID`, `SMLT_SN`) — `SMLT_SN` 은 `SMLT_ID` 별 `MAX+1` 채번 (`:1702`)
- CAST 가 보낸 시설명이 `TN_PM_SMLT_PSG_FCLT.SMLT_FCLT_NM` 에 없을 때 적재 실패분을 남기는 용도로 보인다.

### B-6. `PMOWN.TH_PM_DW_DEL_KEY_HSTRY` — PM_DW삭제키이력

**출처: 쿼리에서 유추** (`CastRestMapper.xml:1774-1791`)

`DEL_YMD`, `TBL_NM`, `DEL_SN`, `KEY_1_VL` ~ `KEY_10_VL` + `FRST_*` 3종

- `DEL_SN` 채번 시퀀스가 `PMOWN.SQ1_TH_PX_DW_DEL_KEY_VAL_HST` (`:1795`) — **테이블명(`TH_PM_DW_DEL_KEY_HSTRY`)과 어긋난다** (`PX` vs `PM`, `KEY_VAL_HST` vs `KEY_HSTRY`). G12.

### B-7. `PMOWN.TN_PM_PSG_WTNG_INFO` — PM_여객대기정보 (xovis 센서 실측)

**출처: 쿼리에서 유추** (`CastSmltMapper.xml:74-88`)

`PSG_FLOW_DATA_CRT_DT`, `TMNL_ID`, `CHKN_ISL_CD`, `FCLT_NM`, `FCLT_TYPE_CD`, `WTNG_LINE_LEN`

- `PSG_FLOW_DATA_CRT_DT` 는 문자열이고 `SUBSTR(...,9,4)` 가 `HHmm` 이다 (`:74`) → 포맷 `YYYYMMDDHHmm...`
- `FCLT_TYPE_CD` 코드값: `Queue`(체크인카운터 줄) / `DG`(출국장) / `SC`(보안검색대) — `CastSmltMapper.xml:83` 주석, `CastSmltServiceImpl.java:185-196`
- `WTNG_LINE_LEN`(대기줄 길이)을 그대로 `WTNG_PSG_CNT`(대기인원) 별칭으로 내려준다 (`:79`) — **의미가 다른 두 값을 같은 필드에 넣는다** (G16).
- 조회 조건 `WTNG_LINE_LEN > 0`, `TMNL_ID`, 선택적 `CHKN_ISL_CD`

### B-8. `PMOWN.TN_PM_PSG_PRCS_GRD` — PM_여객처리등급

**출처: 쿼리에서 유추** (`CastSmltMapper.xml:96-109`)

`PSG_PRCS_GRD_CD`, `MIN_VL`, `MAX_VL`, `FCLT_GROUP_CD`

- **PK 추정**: (`FCLT_GROUP_CD`, `PSG_PRCS_GRD_CD`)
- 혼잡등급 임계값 테이블. 코드 ↔ enum 대응표는 [03-sql-patterns.md](03-sql-patterns.md) ⑤ 참고.
- 조회 파라미터 이름은 `psgPrcsGrdCd` 인데 **필터 컬럼은 `FCLT_GROUP_CD`** (`:108`). 값은 `'01'`~`'04'`(시설군)이고 `PSG_PRCS_GRD_CD` 값(`'01'`~`'04'`, 혼잡등급)과 우연히 같은 형태라 혼동하기 쉽다.

---

## C. PMOWN — CAST 리소스 MSTR/ATRB 계열 (32개, 전부 쿼리에서 유추)

> MSTR/ATRB 쌍 11세트 = 22개, PropertySet 계열 6개, What-If 1개, 출입국장 운영시간 3개.

CAST 엔진에 넘길 자원(운항스케줄·카운터배정·시설운영표 등)을 **마스터 1행 + 속성 N행** 쌍으로 저장한다. 규칙이 일정하다.

- `*_MSTR` : `<자원>_ATRB_ID`(PK 추정), `USE_YN`, 감사 6종. `USE_YN='Y'` 인 것만 리소스 목록에 노출된다.
- `*_ATRB` : 같은 `<자원>_ATRB_ID` 또는 `SCHDL_ATRB_GROUP_ID` 로 묶인 상세 N행.
- 조회 시 `REPLACE(#{resourceID}, '<접두>', '')` 또는 `REGEXP_REPLACE(#{resourceID},'<약칭>|<풀네임>','')` 로 접두를 떼어 ID 를 만든다.

| 자원 | MSTR | ATRB | 그룹 키 | 근거 |
|---|---|---|---|---|
| 운항스케줄 | `TN_PM_SMLT_SCHDL_MSTR` | `TN_PM_SMLT_SCHDL_ATRB` | `SCHDL_ATRB_ID` ↔ `SCHDL_ATRB_GROUP_ID` | `:70-72`, `:860` |
| 체크인카운터배정 | `TN_PM_SMLT_CKNCT_MSTR` | `TN_PM_SMLT_CKNCT_ATRB` | `CKNCT_ATRB_ID` ↔ `SCHDL_ATRB_GROUP_ID` | `:94-96`, `:1078` |
| 셀프백드랍배정 | `TN_PM_SMLT_SBD_MSTR` | `TN_PM_SMLT_SBD_ATRB` | `SBD_ATRB_ID` ↔ `SCHDL_ATRB_GROUP_ID` | `:118-120`, `:1234` |
| 체크인유형 | `TN_PM_SMLT_CKNCT_TYPE_MSTR` | `TN_PM_SMLT_CKNCT_TYPE_ATRB` | `CKNCT_TYPE_ATRB_ID` | `:141`, `:1934` |
| 체크인서비스시간 | `TN_PM_SMLT_CKNCT_SRVC_MSTR` | `TN_PM_SMLT_CKNCT_SRVC_ATRB` | `CKNCT_SRVC_ATRB_ID` | `:151`, `:1920` |
| 출국게이트 운영표 | `TN_PM_SMLT_FCLTY_OPNG_TBL_DPTGT_MSTR` | `..._DPTGT_ATRB` | `DPTGT_ATRB_ID` | `:161`, `:1972` |
| 입국심사 운영표 | `..._IMMIG_MSTR` | `..._IMMIG_ATRB` | `IMMIG_ATRB_ID` | `:171`, `:2051` |
| 출국심사 운영표 | `..._EMIG_MSTR` | `..._EMIG_ATRB` | `EMIG_ATRB_ID` | `:181`, `:2019` |
| **보안검색 운영표** | `..._SCRTY_CNTRL_MSTR` | `..._SCRTY_CNTRL_ATRB` | `SCRTY_CNTRL_ATRB_ID` | `:191`, `:2097` |
| 환승보안검색 운영표 | `..._TRNST_SCRTY_CNTRL_MSTR` | `..._TRNST_SCRTY_CNTRL_ATRB` | `TRNST_SCRTY_CNTRL_ATRB_ID` | `:201`, `:2127` |
| 리포팅 시간그룹 | `TN_PM_SMLT_RPT_STNG_HR_GROUP_MSTR` | `..._GROUP_ATRB` | `RPT_STNG_ATRB_ID` | `:211`, `:2205` |

(위 표의 줄 번호는 모두 `CastRestMapper.xml` 기준)

### C-1. `TN_PM_SMLT_SCHDL_ATRB` — 시뮬레이션 운항스케줄 속성

**출처: 쿼리에서 유추** (`CastRestMapper.xml:786-861`, `:1987`)

`SCHDL_ATRB_GROUP_ID`, `DOM_INTL_SE_CD`, `TDFLT_YN`, `ARR_DEP_SE_CD`, `TMNL_ID`, `ALN_CD`, `ALN_CTGRY`, `FLTNM`, `DALY_FLTSH_ID`, `DEP_ARR_YMD`, `DEP_ARR_HM`, `PREDC_HM`, `ACTL_HM`, `ARR_DEP_ARPT_CD`, `ACST_NO`, `GATE_NO`, `GATE_TYPE`, `ARCFT_STGCP`, `BDPSG_CNT`, `TRNS_BDPSG_CNT`, `CRSL_NO`, `ARCFT_SUBTYPE_CD`, `CKNCT_RANGE_CN`, `SLF_CHKN_PSBLTY_YN`, `IRR_FLT_YN`, `BUS_NEED_YN`, `WAYO_ID`, `FRST_BAG_INPUT_DT`, `LAST_BAG_INPUT_DT`

- 시뮬레이션 조건으로 **편집된** 운항 스케줄이 여기 저장된다. 리뉴얼 `운항편/여객수` 탭의 저장 대상 후보다 ([04-screen-table-mapping.md](04-screen-table-mapping.md) 1장).
- `DEP_ARR_YMD` 는 `/` 를 포함한다 (`REPLACE(..., '/', '')` — `:1987`) → 포맷 `YYYY/MM/DD`
- `TMNL_ID` 가 `P01`/`P02`/`P03` 으로 들어간다 (`:826-831`)

### C-2. `TN_PM_SMLT_CKNCT_ATRB` — 시뮬레이션 체크인카운터 배정 속성

**출처: 쿼리에서 유추** (`CastRestMapper.xml:1061-1079`)

`SCHDL_ATRB_GROUP_ID`, `TMNL_ID`, `CKNCT_ID`, `ALN_CD`, `DOM_INTL_SE_CD`, `CRTR_YMD`, `CHKN_OPEN_PRNMNT_DT`, `CHKN_CLOSE_PRNMNT_DT`, `CHKN_GRD_CD`, `CHKN_GROUP_CD`, `CHKN_KND_CD`, `CHKN_FWK_CD`, `CHKN_TYPE_CD`, `CHKN_TYPE_DTL_INFO`

- **리뉴얼 체크인 카운터 탭의 저장 대상 1순위 후보다.** 카운터(`CKNCT_ID`) × 항공사(`ALN_CD`) × 시간(`CHKN_OPEN_PRNMNT_DT`~`CHKN_CLOSE_PRNMNT_DT`) 가 전부 있다.
- `CHKN_OPEN_PRNMNT_DT` / `CHKN_CLOSE_PRNMNT_DT` 는 TIMESTAMP 가 아니라 **`YYYYMMDDHH24MI` 문자열**이다 (`TO_NUMBER(...)` 비교 `:1070`, `TO_DATE(..., 'YYYYMMDDHH24MI')` `:1039`).
- `CHKN_TYPE_CD`: `'C'` = 공용(항공사 목록), `'D'` = 전용(대표편명) — `:908-923`

### C-3. `TN_PM_SMLT_SBD_ATRB` — 시뮬레이션 셀프백드랍 배정 속성

**출처: 쿼리에서 유추** (`CastRestMapper.xml:1218-1234`)

`SCHDL_ATRB_GROUP_ID`, `TMNL_ID`, `CKNCT_ID`, `ALN_CD`, `DOM_INTL_SE_CD`, `CRTR_YMD`, `OPER_BGNG_DT`, `OPER_END_DT`, `CHKN_GRD_CD`, `CHKN_GROUP_CD`, `CHKN_KND_CD`, `CHKN_FWK_CD`, `CHKN_TYPE_CD`, `CHKN_TYPE_DTL_INFO`

- 구조가 C-2 와 같고 시간 컬럼만 `OPER_BGNG_DT`/`OPER_END_DT` 로 다르다.
- 리뉴얼 드로어의 `bagDropCnt`(아일랜드별 셀프백드롭 대수)는 여기서 `COUNT(CKNCT_ID)` 로 **유도**해야 한다. 대수를 직접 담은 컬럼은 없다.

### C-4. PropertySet 계열 — `TN_PM_SMLT_FIX_ATRB_GROUP` 외 5개

| 테이블 | 컬럼 (관찰) | 근거 |
|---|---|---|
| `TN_PM_SMLT_FIX_ATRB_GROUP` | `FIX_ATRB_GROUP_ID`, `DEL_YN` + 감사 | `:131`, `:1250` |
| `TN_PM_SMLT_SRVC_ATRB` | `FIX_ATRB_GROUP_ID`, `FCLTY_SE_CD`, `FCLTY_DTL_CD`, `MIN_VL`, `MAX_VL`, `DSTB_MAX_VL`, `VL_TYPE`, `SWTC_FNC_ID`, `FRST_REG_DT`, `LAST_MDFCN_DT` | `:1267-1277` |
| `TN_PM_SMLT_PSG_SRVC_PARA_CD` | `PSG_SRVC_PARA_CD`, `PSG_SRVC_PARA_CD_NM`, `PSG_SMLT_APLCN_NM`, `PSG_SMLT_APLCN_EXPLN`, `USE_YN` | `:1280-1286` |
| `TN_PM_SMLT_PSG_ATRB` | `FIX_ATRB_GROUP_ID`, `PSG_ATRB_CD`, `PSG_DTL_SE_CD`, `INPT_VL`, `USER_DEF_1_VL`, `FRST_REG_DT`, `LAST_MDFCN_DT` | `:1299-1305`, `:1424` |
| `TN_PM_SMLT_SHOW_UP_ATRB` | `TN_PM_SMLT_PSG_ATRB` 와 동일 컬럼 구성 (Show-up 분포용) | `:1333`, `:1437` |
| `TN_PM_SMLT_PSG_FIX_PARA_CD` | `PSG_FIX_PARA_CD`, `PSG_FIX_PARA_GROUP_CD`, `PSG_FIX_PARA_CND_TYPE_CD`, `PSG_SMLT_APLCN_NM`, `PSG_FIX_PARA_CND_VL`, `VL_TYPE`, `USE_YN` | `:1308-1315` |

- `PSG_FIX_PARA_CND_TYPE_CD` 코드값: `'01'` Simple Shares / `'02'` Reporting Profile / `'03'` Case of (multiple) / `'04'` Shares (`:1295`)
- `TN_PM_SMLT_SRVC_ATRB.FCLTY_SE_CD` 는 `TN_PM_SMLT_PSG_SRVC_PARA_CD.PSG_SRVC_PARA_CD` 와 조인된다 (`:1286`). 처리시간 분포(min/max)를 시설 종류별로 담는다 → **여기가 "처리시간" 파라미터의 원천**이다.

### C-5. 시설 운영표 ATRB 5종 — 검색대 대수의 유일한 후보

| 테이블 | 컬럼 (관찰) | 근거 |
|---|---|---|
| `..._DPTGT_ATRB` | `DPTGT_ATRB_ID`, `TMNL_ID`, `FCLT_SE_CD`, `GATE_NO`, `FCLTY_TYPE_ID`(`W`/`E`), `SD_DR`, `FCLT_RCG`, `FCLTY_CNT` | `:1940-1972` |
| `..._EMIG_ATRB` | `EMIG_ATRB_ID`, `TMNL_ID`, `FCLT_SE_CD`, `GATE_NO`, `EMIG_TYPE_CD`, `FCLTY_CNT` | `:2014-2019` |
| `..._IMMIG_ATRB` | `IMMIG_ATRB_ID`, `TMNL_ID`, `FCLT_SE_CD`, `FCLTY_TYPE_ID`, `PSPRT`, `IMMIG_TYPE_CD`, `FCLTY_CNT` | `:2025-2051` |
| `..._SCRTY_CNTRL_ATRB` | `SCRTY_CNTRL_ATRB_ID`, `TMNL_ID`, `FCLT_SE_CD`, `GATE_NO`, `FCLTY_CNT` | `:2093-2097` |
| `..._TRNST_SCRTY_CNTRL_ATRB` | `TRNST_SCRTY_CNTRL_ATRB_ID`, `TMNL_ID`, `FCLT_SE_CD`, `FCLTY_TYPE_ID`(`W`/`E`), `FCLTY_CNT` | `:2103-2127` |

- **`FCLTY_CNT` = CAST 의 `currentNumberofLanes`** (`:1970`, `:2017`, `:2049`, `:2095`, `:2125`). 리뉴얼 출국장 탭의 `scCnt`(검색대 대수) 후보는 `..._SCRTY_CNTRL_ATRB.FCLTY_CNT` 다.
- `EMIG_TYPE_CD` / `IMMIG_TYPE_CD`: `'1'` = Normal, `'2'` = Automatic (`:2016`, `:2048`)
- **시간축이 없다.** 운영 시간은 `TN_PM_ENTGT_DPTGT_OPER_HR_*` 3종을 조인해서 온다 (C-6). 즉 `FCLTY_CNT` 는 **시간대와 무관한 단일 값**이고, 리뉴얼이 요구하는 "시간대별 검색대 대수"와 구조가 맞지 않는다 (G7).

### C-6. 출입국장 운영시간 3종

**출처: 쿼리에서 유추** (`CastRestMapper.xml:1980-1984` 외 동일 블록 4회 반복)

| 테이블 | 컬럼 (관찰) | 역할 |
|---|---|---|
| `TN_PM_ENTGT_DPTGT_OPER_HR_INFO` | `OPER_HR_CRLTN_SN`, `OPER_HR_STTS_CD` | 운영시간 세트 헤더. `'DPL'`(배포됨)만 사용 |
| `TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT` | `OPER_HR_CRLTN_SN`, `ELMNT_SN`, `TMNL_ID`, `FCLT_SE_CD`, `SORT_SEQ` | 대상 시설 |
| `TN_PM_ENTGT_DPTGT_OPER_HR_MNG` | `OPER_HR_CRLTN_SN`, `ELMNT_SN`, `PRD_SN`, `FCLTY_TYPE_ID`, `BSC_OPER_HR_YN`, `OPER_BGNG_YMD`, `OPER_END_YMD`, `OPER_BGNG_1_HR`, `OPER_END_1_HR` | 기간·시각 |

- **PK 추정**: `INFO`(`OPER_HR_CRLTN_SN`) / `ELMNT`(`OPER_HR_CRLTN_SN`, `ELMNT_SN`) / `MNG`(`OPER_HR_CRLTN_SN`, `ELMNT_SN`, `PRD_SN`)
- `OPER_BGNG_1_HR` / `OPER_END_1_HR` 의 `_1_` 는 **구간 번호**로 보인다. `_2_`, `_3_` 이 존재하는지는 **미확인** — 쿼리는 1번 구간만 읽는다. 리뉴얼 화면은 아일랜드/출국장마다 **복수 구간**(`oprTimeList`)을 요구하므로 확인이 필요하다.
- `OPER_BGNG_1_HR` 은 `HHMI` 문자열 (`TO_DATE(B.OPER_BGNG_1_HR || '00', 'HH24:MI:SS')` — `:1955`)
- `P02` 는 운영시간 데이터가 없어 **`P01` 행을 복사해 `'P02'` 로 라벨만 바꿔 UNION** 한다 (`:2160-2193`). G2 의 방증.

### C-7. `TN_PM_SMLT_WHAT_IF_DEF_TBL` — What-If 정의표

**출처: 쿼리에서 유추** (`CastRestMapper.xml:2210-2228`)

`WHAT_IF_EXCN_ID`, `MDL_RSRC_ID`, `FLT_SCHDL_RSRC_ID`, `CKNCT_ALCTN_RSRC_ID`, `SBD_CNTRL_ALCTN_ID`, `PRPT_SET_RSRC_ID`, `FCLTY_OPNG_TBL_DG_RSRC_ID`, `FCLTY_OPNG_TBL_EMI_RSRC_ID`, `FCLTY_OPNG_TBL_IMMI_RSRC_ID`, `FCLTY_OPNG_TBL_SCRTY_CNTRL_RSRC_ID`, `FCLTY_OPNG_TBL_TR_SCRTY_CNTRL_RSRC_ID`, `CKNCT_SRVC_HR_RSRC_ID`, `CHKN_TYPE_RSRC_ID`, `RPT_STNG_ATRB_ID`, `SMLT_RSLT_SUFFIX`, `WHAT_IF_STTS`, `EXCT_DT` + 감사 6종

- **PK 추정**: (`WHAT_IF_EXCN_ID`) — `:2241`, `:2253`
- `WHAT_IF_STTS` 관찰된 값: `'Executing'` (`:2235`). 나머지 상태값 **미확인**.
- **이 테이블이 "사용자 시뮬레이션 실행"의 실질적 큐다.** 컬럼 구성이 `TN_PM_SMLT_STNG` 과 거의 같다. 4단계 `execute*` API 설계 시 여기와 `TN_PM_SMLT_STNG` 중 어디에 쓰는지 결정해야 한다.

---

## D. PMOWN.DROP_* — 타 시스템 연계 스테이징 (10개, 전부 쿼리에서 유추)

`DROP_AA_` 접두는 타 시스템 원본 테이블의 **스냅샷 사본**이다. 소유자는 `PMOWN` 이지만 컬럼 명명이 PM 하우스 스타일을 따르지 않는다 (`TER_ID` vs `TMNL_ID`, `SCHD_DT` vs `_YMD`, `LST_MOD_TSP` vs `LAST_MDFCN_DT`).

### D-1. `PMOWN.DROP_TMP` — 기준일자 (1행 테이블)

**출처: 쿼리에서 유추** (`CastRestMapper.xml:338`)

`BASE_DT` (DATE)

- `(SELECT BASE_DT FROM PMOWN.DROP_TMP)` 형태로 **13곳**에서 스칼라 서브쿼리로 쓰인다. 시뮬레이션 기준일을 담는 사실상의 전역 변수다.
- 행이 1건임을 보장하는 제약이 있는지 **미확인**. 2건 이상이면 `ORA-01427` 로 전부 터진다.

### D-2. `PMOWN.DROP_AA_TN_AS_GD_DATA` — AS 운항정보 스냅샷

**출처: 쿼리에서 유추** (`CastRestMapper.xml:328-337`, `:438-454`, `:504-549`, `:1160-1178`)

`GD_SE_DT`, `SCHD_HM`, `ESTM_HM`, `ACTL_HM`, `DOM_INT_SE_CD`, `TRDOMFLT_YN`, `ARR_DEP_SE_CD`, `TER_ID`, `ALN_CD`, `FLT_NM`, `CLOSING_FLT_NM`, `FLT_ID`, `APT_CD`, `STND_NO`, `GATE_NO`, `CRS_NO`, `AC_SEAT_CNT`, `AC_DTL_TY_CD`, `INPUT_YN`, `TOT_CRG_PAX_CNT`, `TOT_FREE_PAX_CNT`, `RSRV_PAX_CNT`, `TOT_TRPAX_CNT`, `RSRV_TRPAX_CNT`, `GD_IRR_YN`, `CSHR_STAT_CD`, `DLY_RSN_CD`, `AC_USE_SE_CD`, `GD_FLT_PPS_CD`, `PAX_CGO_SE_CD`, `FRY_YN`, `LCRFT_YN`

- **유효 운항편 필터 8종**이 항상 함께 붙는다 (`:330-337`) — [03-sql-patterns.md](03-sql-patterns.md) ⑧ 참고
- `TER_ID` 값: `'P'`, `'P01'`, `'P02'`, `'P03'` (`:332`). `'P'` 는 터미널 미배정으로 보인다.
- `GOOWN.TN_GO_GD_DATA` 와 **같은 운항정보의 다른 사본**이다. 컬럼명이 다르다 (아래 F-1 과 비교) — 어느 쪽이 정본인지 **미확인** (G16).

### D-3~D-10. 나머지 스테이징 8개

| 테이블 | 컬럼 (관찰) | 근거 (`CastRestMapper.xml`) |
|---|---|---|
| `DROP_AA_TN_FP_ACT_ARR_DEP` | `SCHD_DT`, `SCHD_HM`, `FLT_NM`, `ACT_FLT_ID`, `FLT_SVC_TY_CD`, `CIC_RANGE_CTT`, `ALN_CD`, `LST_MOD_TSP` | `:58-60`, `:387-393`, `:573-576` |
| `DROP_AA_TN_RS_CIC_DALY_ALLOC` | `OPR_DT`, `TER_ID`, `CIC_ID`, `ALN_CD`, `DOM_INT_SE_CD`, `CHKIN_TY_CD`, `CHKIN_PG_NO`, `MSTR_FLT_NM`, `LST_STA_HM`, `LST_END_HM`, `PRED_STA_HM`, `PRED_END_HM`, `LST_RON_YN`, `PRED_RON_YN`, `USE_YN`, `LST_MOD_TSP` | `:83-84`, `:968-994` |
| `DROP_AA_TN_CA_GATE` | `GATE_NO`, `TER_ID`, `CRS_GRP_CD` | `:350-355` |
| `DROP_AA_SBD_PLCY` | `ALN_IATA_CD`, `USE_YN`, `TMNL_ID`, `ISLAND` | `:368-371`, `:1157-1158` |
| `DROP_AA_TN_RS_CRS_DALY_OPR` | `ARR_ACT_FLT_ID`, `CRS_NO` | `:420-424` |
| `DROP_AA_TN_CA_CRS` | `TER_ID`, `CRS_GRP_CD`, `CRS_NO` | `:553-561` |
| `DROP_AA_TN_RS_FLT_RSC` | `ACT_FLT_ID`, `BUS_NEED_YN`, `EXIT_ID`, `FST_BAG_INPT_DTTM`, `LST_BAG_INPT_DTTM` | `:755-777` |
| `DROP_AA_SELF_CHKN_ALN` | `CHKN_INTR_ID`, `ALN_CD` | `:1113-1125` |

- `DROP_AA_SBD_PLCY.ISLAND` 는 **아일랜드 문자를 직접 담은 몇 안 되는 컬럼**이다. `SUBSTR(CIC.CKNCT_ID, 1, 1) = PLCY.ISLAND` 로 조인한다 (`:1158`) → **`CKNCT_ID` 의 1번째 자리가 아일랜드 문자**임을 확인해 준다.
- `DROP_AA_SELF_CHKN_ALN.CHKN_INTR_ID` 는 `SUBSTR(...,4,1)` 이 `'1'` 이면 T1, 아니면 T2 다 (`:1106-1111`).

---

## E. CAOWN — 공통·코드·항공사 (5개, 전부 쿼리에서 유추)

| 테이블 | 한국어 명칭(추정) | 컬럼 (관찰) | 근거 |
|---|---|---|---|
| `CAOWN.TN_CA_ALN` | CA_항공사 | `ALN_CD`, `LCC_YN` | `CastRestMapper.xml:342-346` |
| `CAOWN.TN_CA_ACST` | CA_항공기주기장 | `GATE_NO`, `ACST_TYPE_CD`, `USE_YN` | `:359-364` |
| `CAOWN.TC_CA_COM_CD` | CA_공통코드 | `COM_CD_SE_CD`, `COM_CD`, `COM_CD_NM` | `:903-906` |
| `CAOWN.TN_CA_ALN_PGE` | CA_항공사페이지(체크인 페이지) | `ALN_CD`, `PGE_NO`, `TMNL_ID`, `PGE_SE_CD`, `UNIT_SYS_ID`, `PGE_EXPLN`, `CHKN_GROUP_CD`, `CHKN_KND_CD`, `CHKN_FWK_CD`, `USE_YN` | `:914-919`, `:985-988` |
| `CAOWN.TN_CA_CKNCT` | CA_체크인카운터 (마스터) | `CKNCT_ID`, `TMNL_ID`, `UNIT_SYS_ID`, `CKNCT_USE_CRG_APLCN_TYPE_CD`, `DOM_INTL_SE_CD`, `USE_YN` | `:995`, `:1156`, `:1183-1186` |

- **`TC_CA_COM_CD` 구분코드 4종** (`:903-906`): `CA263` 체크인등급 / `CA264` 체크인그룹 / `CA265` 체크인종류 / `CA266` 체크인기능
- **`TN_CA_CKNCT.CKNCT_USE_CRG_APLCN_TYPE_CD`** (`:999`, `:1184): `'A'`, `'B'` = 유인 체크인카운터 / `'H'` = 셀프백드랍(SBD). **리뉴얼 체크인 탭의 "부스"와 "셀프백드롭"을 가르는 코드다.**
- `TN_CA_CKNCT` 가 **카운터 마스터**다. 리뉴얼이 필요로 하는 "아일랜드별 총 부스 수"는 여기서 `WHERE TMNL_ID=? AND USE_YN='Y' AND CKNCT_USE_CRG_APLCN_TYPE_CD IN ('A','B') GROUP BY SUBSTR(CKNCT_ID,1,1)` 로 셀 수 있다 — **DDL 미확보 상태의 유추이므로 3단계에서 실데이터 검증 필요.**
- `PGE_SE_CD = 'C'` 는 체크인용 페이지 (`:918`)

---

## F. GOOWN — 운항·게이트 운영 (2개, 전부 쿼리에서 유추)

### F-1. `GOOWN.TN_GO_GD_DATA` — GO_운항데이터

**출처: 쿼리에서 유추** (`CastSmltMapper.xml:28-39`, `CastUserConfigMapper.xml:8-14`)

`GD_SE_YMD`, `TMNL_ID`, `ARR_DEP_SE_CD`, `CSHR_STTS_CD`, `PSG_CGO_SE_CD`, `ARCFT_USE_SE_CD`, `GD_FLT_PRPS_CD`, `FRY_YN`, `DOM_INTL_SE_CD`, `DLY_RSN_CD`, `RSVT_BDPSG_CNT`, `RSVT_TRNS_BDPSG_CNT`, `FLTSH_ID`, `PREDC_HM`

- **리뉴얼 `운항편/여객수` 탭의 원천이다.** 요약값은 `COUNT(*)` / `SUM(RSVT_BDPSG_CNT - RSVT_TRNS_BDPSG_CNT)` (`CastSmltMapper.xml:28`) — 즉 **여객수 = 예약탑승객 − 예약환승객** (순수 출발 여객).
- 시간대별 차트는 `PREDC_HM`(예측시분)을 축으로 쓴다 (`CastUserConfigMapper.xml:10` `PREDC_HM AS etd`).
- 유효 운항편 필터 8종은 `DROP_AA_TN_AS_GD_DATA` 와 **의미는 같고 컬럼명이 다르다**:

| `GOOWN.TN_GO_GD_DATA` | `PMOWN.DROP_AA_TN_AS_GD_DATA` |
|---|---|
| `GD_SE_YMD` | `GD_SE_DT` |
| `TMNL_ID` | `TER_ID` |
| `CSHR_STTS_CD` | `CSHR_STAT_CD` |
| `ARCFT_USE_SE_CD IN ('0','1')` | `AC_USE_SE_CD = '0'` |
| `GD_FLT_PRPS_CD` | `GD_FLT_PPS_CD` |
| `PSG_CGO_SE_CD` | `PAX_CGO_SE_CD` |
| `DOM_INTL_SE_CD` | `DOM_INT_SE_CD` |
| `RSVT_BDPSG_CNT` | `RSRV_PAX_CNT` |
| `RSVT_TRNS_BDPSG_CNT` | `RSRV_TRPAX_CNT` |

### F-2. `GOOWN.TI_GO_CKNCT_DALY_ALOT` — GO_체크인카운터일별배정

**출처: 쿼리에서 유추** (`CastChknMapper.xml:44-47`, `CastUserConfigMapper.xml:20-28`)

`TMNL_ID`, `ALN_CD`, `CKNCT_ID`, `OPER_YMD`, `EST_BGNG_HM`, `EST_END_HM`, `USE_YN`

- **PK 추정**: (`OPER_YMD`, `TMNL_ID`, `CKNCT_ID`, `EST_BGNG_HM`) 근처. 한 카운터가 하루에 여러 구간 배정될 수 있으므로 시각이 키에 들어간다 (`CastUserConfigChknDto` 가 `mergeTimeRanges` 로 구간을 병합하는 것이 근거 — `UserConfigChknDto.java`).
- `CKNCT_ID` 구성: 1번째 자리 = 아일랜드 문자, 2~3번째 자리 = 카운터 번호 (`CastUserConfigMapper.xml:20-21`)
- `EST_BGNG_HM` / `EST_END_HM` 은 **`HHmm` 4자리 문자열**이다 (`CEIL((A.EST_END_HM) / 100)` 로 시간을 뽑는다 — `:24`)
- **리뉴얼 체크인 탭의 `boothCnt`·`oprTimeList` 를 만들 수 있는 유일한 실측 테이블이다.** 다만 이건 "실제 배정" 이고 사용자가 시뮬레이션용으로 편집한 값은 `TN_PM_SMLT_CKNCT_ATRB` 로 가야 한다 ([04-screen-table-mapping.md](04-screen-table-mapping.md) 2장).

---

## G. 시퀀스 · 함수

| 객체 | 종류 | 용도 | 근거 |
|---|---|---|---|
| `PMOWN.SQ1_TN_PM_SMLT_RSLT` | 시퀀스 | `TN_PM_SMLT_STNG.SMLT_ID` 채번 | `CastRestMapper.xml:1550` |
| `PMOWN.SQ1_TH_PX_DW_DEL_KEY_VAL_HST` | 시퀀스 | `TH_PM_DW_DEL_KEY_HSTRY.DEL_SN` 채번 | `CastRestMapper.xml:1795` |
| `PMOWN.FN_PM_SAFE_TO_NUMBER(v)` | 함수 | 문자열→숫자 안전 변환. 시설 코드에서 카운터 번호를 뽑을 때 사용 | `CastChknMapper.xml:26`, `CastUserConfigMapper.xml:21`, `:23` |

- 두 시퀀스 모두 **이름이 대상 테이블과 어긋난다** (G12).
- `FN_PM_SAFE_TO_NUMBER` 의 실패 시 반환값(`NULL`? `0`?)은 **미확인**. 3단계에서 `COUNTER_NUM` 정렬·비교에 영향을 준다.

---

## 미확인 — XML 이 없는 테이블

`FcltMapper` / `UserMapper` 는 Java 인터페이스만 있고 XML 이 없다 (G1). 따라서 아래 두 개는 **테이블명조차 확인되지 않는다.**

| 인터페이스 | 메서드 | 필요한 데이터 | DTO 필드 |
|---|---|---|---|
| `FcltMapper` | `retrieveFcltList(tmnlId)`, `updatePosition(dto)` | 시설물 지도 좌표 | `FcltDto` — `fcltySn`, `fcltNm`, `fcltGroupCd`, `tmnlId`, `cdntLat`, `cdntLng` |
| `UserMapper` | `retrieveUserInfoByKey(userId)` | 사용자 정보 | `UserDto` — `userId`, `deptCd`, `userNm`, `deptNm` |

`FcltDto.cdntLat` / `cdntLng` 는 `String` 이다 — 좌표를 문자열로 저장하는 테이블이 따로 있다는 뜻. `TN_PM_SMLT_PSG_FCLT` 에는 좌표 컬럼이 없으므로 **별도 테이블이다.**
