# 5.4 화면 ↔ 테이블 매핑표

← [DB-ANALYSIS.md](DB-ANALYSIS.md)

1단계 산출물 [`API_SPEC-DELTA.md`](../../react/src/api/pm/API_SPEC-DELTA.md) 의 **모든 데이터 항목을 한 줄씩** 다룬다. 채울 수 없는 것은 억지로 매핑하지 않고 **미확인**으로 남겼다 — 그게 3·4단계에서 터진다.

## 상태 표기

| 상태 | 의미 |
|---|---|
| **확인** | 기존 쿼리가 실제로 그 컬럼에서 이 값을 만들고 있다 |
| **유추** | 컬럼은 있지만 이 화면 항목으로 쓰는 쿼리가 아직 없다. 구조상 맞아 보인다 |
| **미확인** | 담을 테이블·컬럼을 찾지 못했다. 3·4단계에서 신규 설계 또는 현업 확인 필요 |

## 조회 단위 변경 — 매핑 이전에 걸리는 문제

| 항목 | 현행 | 리뉴얼 요구 | 상태 |
|---|---|---|---|
| 체크인 조회 범위 | `AND A.ISLAND = #{island}` — 아일랜드 1개분 (`CastChknMapper.xml:55`) | 터미널 전체 | **확인** — `<if>` 로 감싸면 해결. 쿼리 나머지는 그대로 쓸 수 있다 |
| 출국장 조회 범위 | `GROUP BY TIME, DEP_NUM` — 이미 터미널 전체 (`CastDepMapper.xml:46`) | 터미널 전체 | **확인** — 변경 불필요 |
| 셀프 조회 범위 | `GROUP BY TIME, TYPE, ISLAND` — 이미 터미널 전체 (`CastSlfchknMapper.xml:57`) | 아일랜드별 대수 | **확인** — 집계 축은 맞으나 "대수"가 아니라 "대기지표"다. 대수는 별도 (2.5 참고) |
| 보안검색대 | 전용 쿼리 없음. `CastSmltServiceImpl.getScDatas` 가 `retrieveCastRsltDtl` 을 `UP IN ('SC','SR')` 로 호출 (`:323-326`) | 출국장별 시간대별 대수 | **미확인** — 대기지표만 있고 대수가 없다 |

---

## 1. 운항편/여객수 탭 (`API_SPEC.md` 6.2 — DELTA 상 변경 없음)

| 요소 | 필드 | 테이블 | 컬럼 | 상태 | 근거 |
|---|---|---|---|---|---|
| 요약 | `fltCnt` | `GOOWN.TN_GO_GD_DATA` | `COUNT(*)` | **확인** | `CastSmltMapper.xml:28` |
| 요약 | `psgCnt` | `GOOWN.TN_GO_GD_DATA` | `SUM(RSVT_BDPSG_CNT - RSVT_TRNS_BDPSG_CNT)` | **확인** | `CastSmltMapper.xml:28` |
| 요약 | `peakTime` | `PMOWN.TN_PM_SMLT_RSLT_DTL` | `WTNG_PSG_CNT` 최댓값의 시각 (앱 계산) | **확인** | `CastSmltServiceImpl.java:391-394` |
| 막대 차트 | `fltChart.itemList[].time` / `cnt` | `GOOWN.TN_GO_GD_DATA` | `PREDC_HM` 로 그룹 + `COUNT(*)` | **유추** | `CastUserConfigMapper.xml:10` (편별 목록은 있으나 시간대 집계 쿼리는 없다) |
| 막대 차트 | `psgChart.itemList[].cnt` | `GOOWN.TN_GO_GD_DATA` | `PREDC_HM` 로 그룹 + `SUM(RSVT_BDPSG_CNT)` | **유추** | `CastUserConfigMapper.xml:11` — `RSVT_BDPSG_CNT AS PSG_CNT`. **환승객을 빼지 않는다** — 요약값과 정의가 어긋난다 |
| 수정 조건 | `adjType` (`RATIO`/`HOURLY`) | — | — | **미확인** | 수정 방식을 담을 컬럼이 없다 |
| 수정 조건 | `adjRate` (전체 비율 %) | — | — | **미확인** | |
| 수정 조건 | `hourList[].bgnTime`/`endTime`/`adjRate` | — | — | **미확인** | 시간대별 조정치를 담을 테이블이 없다 |
| 저장 결과 | 편집된 운항편 | `PMOWN.TN_PM_SMLT_SCHDL_ATRB` | `BDPSG_CNT`, `TRNS_BDPSG_CNT`, `DEP_ARR_HM`, `PREDC_HM` | **유추** | `CastRestMapper.xml:836-837`, `:801`, `:808`. **조정 비율이 아니라 조정 결과(편별 여객수)를 저장하는 구조**로 보인다 |

> **결정 필요**: 사용자가 "전체 +10%" 를 눌렀을 때 ① 비율만 저장하고 실행 시점에 곱하는지, ② `TN_PM_SMLT_SCHDL_ATRB` 에 곱해진 편별 여객수를 물리 저장하는지. ②라면 원본 복원이 불가능하므로 원본 스냅샷 보관이 필요하다. — 개발 판단 + 현업 확인

---

## 2. 체크인 카운터 탭

### 2.1 시간대별 운영 아일랜드 블럭 차트

| 요소 | 필드 | 테이블 | 컬럼 | 상태 | 근거 |
|---|---|---|---|---|---|
| 블럭 라벨 | `islandList[].island` | `GOOWN.TI_GO_CKNCT_DALY_ALOT` | `SUBSTR(CKNCT_ID, 1, 1)` | **확인** | `CastUserConfigMapper.xml:20` |
| ″ (대안) | ″ | `PMOWN.TN_PM_SMLT_PSG_FCLT` | `SUBSTR(PSG_FCLT_CD, 3, 1)` (`UP='CC'`) | **유추** | `CastChknMapper.xml:25` — 자리수 규칙 검증 필요 (G11) |
| 블럭 수의 근거 | `islandList[].boothCnt` | `CAOWN.TN_CA_CKNCT` | `COUNT(CKNCT_ID)` GROUP BY `SUBSTR(CKNCT_ID,1,1)`, WHERE `TMNL_ID=?` AND `USE_YN='Y'` AND `CKNCT_USE_CRG_APLCN_TYPE_CD IN ('A','B')` | **유추** | `CastRestMapper.xml:995`, `:999`. **카운터 마스터에서 세는 것이 가장 자연스럽다.** 기존 쿼리 없음 |
| ″ (대안) | ″ | `GOOWN.TI_GO_CKNCT_DALY_ALOT` | `COUNT(DISTINCT CKNCT_ID)` — 그날 실제 배정된 부스만 | **유추** | `CastChknMapper.xml:45`. 아래 결정 필요 참고 |
| 아일랜드 운영시간 | `islandList[].oprTimeList[].bgnHour` / `endHour` | `GOOWN.TI_GO_CKNCT_DALY_ALOT` | `EST_BGNG_HM` / `EST_END_HM` (구간 병합 후 시 단위 절삭) | **확인** | `CastUserConfigMapper.xml:23-24`, `UserConfigChknDto.java` `mergeTimeRanges` |
| ″ (시뮬 조건) | ″ | `PMOWN.TN_PM_SMLT_CKNCT_ATRB` | `CHKN_OPEN_PRNMNT_DT` / `CHKN_CLOSE_PRNMNT_DT` (`YYYYMMDDHH24MI` 문자열) | **유추** | `CastRestMapper.xml:1067-1068` — **사용자가 편집한 값의 저장처는 여기여야 한다** |
| 요약 | `totCnt` (전체 카운터 수) | `CAOWN.TN_CA_CKNCT` | `COUNT(CKNCT_ID)` WHERE `TMNL_ID=?` | **유추** | `boothCnt` 의 터미널 합계 |
| 요약 | `peakCounterCnt` (피크 카운터) | — | 시간대별 열린 부스 합의 최댓값 (계산값) | **미확인** | 저장 컬럼 없음. 서버 계산인지 클라 계산인지 **결정 필요** (DELTA 4장) |

> **결정 필요 (DELTA 2.1)**: `boothCnt` 가 **배정정보 기준 고정값**인가, 사용자가 드로어에서 바꾸는 값인가.
> - 고정값이면 → `CAOWN.TN_CA_CKNCT` 카운트 (설비 보유 대수)
> - 편집 가능하면 → `PMOWN.TN_PM_SMLT_CKNCT_ATRB` 행 수 (시뮬 조건)
> — 현업 확인

### 2.2 대기인원수 꺾은선

| 요소 | 필드 | 테이블 | 컬럼 | 상태 | 근거 |
|---|---|---|---|---|---|
| 꺾은선 X | `waitList[].hour` | `PMOWN.TN_PM_SMLT_RSLT_DTL` | `SMLT_ACTL_DT` 의 `HH` | **유추** | `CastChknMapper.xml:22` — `HHmm` 를 시 단위로 다시 묶어야 한다 |
| 꺾은선 Y (①직전 결과) | `waitList[].waitPsgCnt` | `PMOWN.TN_PM_SMLT_RSLT_DTL` | `SUM(WTNG_PSG_CNT)` (`UP='CC'`, 터미널·시간 그룹) | **유추** | `CastChknMapper.xml:15` — 데이터는 있으나 이 축으로 뽑는 쿼리는 없다 |
| 꺾은선 Y (②실측) | ″ | `PMOWN.TN_PM_PSG_WTNG_INFO` | `WTNG_LINE_LEN` (`FCLT_TYPE_CD='Queue'`) | **유추** | `CastSmltMapper.xml:79` — **대기줄 "길이"지 "인원수"가 아니다** (G16) |
| 꺾은선 Y (③재계산) | ″ | — | — | **미확인** | 실시간 예측 API 가 없다 |
| 우측 축 | `waitMaxCnt` | — | `MAX(waitList[].waitPsgCnt)` (계산값) | **유추** | 저장 컬럼 없음 |

> **결정 필요 (DELTA 2.2)**: 이 값의 출처가 ①직전 시뮬레이션 결과 / ②조건 변경 시 서버 재계산 / ③저장 전에는 공란 중 무엇인가. **①이면 미수행 상태에서 그릴 것이 없다** — 그때의 표시값도 함께 정해야 한다. — 개발 판단 + 현업 확인

### 2.3 패널 헤드 결과 지표 (KPI 4종) — 체크인 · 출국장 공통

| 필드 | 테이블 | 컬럼 | 상태 | 비고 |
|---|---|---|---|---|
| `avgWaitMin` (평균대기 분) | `PMOWN.TN_PM_SMLT_RSLT_DTL` | `AVG(AVG_WTNG_HR)` | **유추** | 컬럼은 있으나 **단위 미확인** — `_HR` 인데 `NUMBER(5,0)` (G14) |
| `p95WaitMin` (P95대기 분) | — | — | **미확인** | 테이블에는 `MIN_`/`AVG_`/`MAX_` **3종만** 있다. P95 를 담을 컬럼이 없다 (`ddl.txt:15-17`) |
| `maxQueuePsgCnt` (최대 큐인원 명) | `PMOWN.TN_PM_SMLT_RSLT_DTL` | `MAX(WTNG_PSG_CNT)` | **유추** | `ddl.txt:10` |
| `utilRate` (가동률 %) | — | — | **미확인** | 분모(가용 부스·시간)를 담은 컬럼이 없다. 계산 정의부터 필요 |

> **P95 는 원천 데이터가 없다.** CAST 엔진이 P95 를 산출하는지, 산출한다면 적재 컬럼을 추가해야 하는지 확인이 필요하다. — DBA + CAST 벤더 확인

### 2.4 드로어 — 자원 배정

| 필드 | 테이블 | 컬럼 | 상태 | 근거 |
|---|---|---|---|---|
| `boothList[].boothNo` | `GOOWN.TI_GO_CKNCT_DALY_ALOT` | `FN_PM_SAFE_TO_NUMBER(SUBSTR(CKNCT_ID, 2, 2))` | **확인** | `CastUserConfigMapper.xml:21` |
| ″ (시뮬 조건) | `PMOWN.TN_PM_SMLT_CKNCT_ATRB` | `SUBSTR(CKNCT_ID, 2, 2)` | **유추** | `CastRestMapper.xml:1063` |
| `boothList[].alnCd` | `GOOWN.TI_GO_CKNCT_DALY_ALOT` | `ALN_CD` | **확인** | `CastUserConfigMapper.xml:22`, `CastChknMapper.xml:11` |
| ″ (시뮬 조건) | `PMOWN.TN_PM_SMLT_CKNCT_ATRB` | `ALN_CD` | **유추** | `CastRestMapper.xml:1064` |
| `boothList[].customYn` | — | — | **미확인** | "Custom 배정" 을 표시할 플래그 컬럼이 없다. `CHKN_TYPE_CD`(`'C'` 공용 / `'D'` 전용)가 가장 가깝지만 의미가 다르다 (`CastRestMapper.xml:908-923`) |
| `alnCdList` (배정 가능 항공사) | `CAOWN.TN_CA_ALN_PGE` | `ALN_CD` WHERE `TMNL_ID=?` AND `PGE_SE_CD='C'` AND `USE_YN='Y'` | **유추** | `CastRestMapper.xml:1007-1011` — 그 터미널에서 체크인 페이지를 가진 항공사 = 배정 가능 항공사 |
| ″ (대안) | `CAOWN.TN_CA_ALN` | `ALN_CD` (전체 항공사) | **유추** | `CastRestMapper.xml:345` — 필터가 없어 목록이 너무 넓어진다 |

> **결정 필요 (DELTA 2.4)**: `+ Custom` 칩이 자유 입력인지 코드 목록 선택인지. `TN_CA_ALN_PGE` 기준이면 목록 선택이 자연스럽다. 자유 입력이면 `customYn` 컬럼을 신설해야 한다. — 현업 확인

### 2.5 드로어 — 셀프 서비스 (구 6.4 흡수)

| 필드 | 테이블 | 컬럼 | 상태 | 근거 |
|---|---|---|---|---|
| `islandList[].kioskCnt` | `PMOWN.TN_PM_SMLT_PSG_FCLT` | `COUNT(PSG_FCLT_CD)` WHERE `UP_PSG_FCLT_CD='CK'` GROUP BY `SUBSTR(SMLT_FCLT_NM, -3, 1)` | **유추** | `CastSlfchknMapper.xml:26`, `:51`. **아일랜드를 시설명에서 뽑는 구조라 불안정하다** |
| `islandList[].bagDropCnt` | `CAOWN.TN_CA_CKNCT` | `COUNT(CKNCT_ID)` WHERE `CKNCT_USE_CRG_APLCN_TYPE_CD='H'` GROUP BY `SUBSTR(CKNCT_ID,1,1)` | **유추** | `CastRestMapper.xml:1184` — `'H'` 가 SBD 다 |
| ″ (대안) | `PMOWN.TN_PM_SMLT_PSG_FCLT` | `COUNT` WHERE `UP_PSG_FCLT_CD='SBD'` GROUP BY `SUBSTR(PSG_FCLT_CD, -3, 1)` | **유추** | `CastSlfchknMapper.xml:28`, `:51` |
| ″ (시뮬 조건) | `PMOWN.TN_PM_SMLT_SBD_ATRB` | `COUNT(CKNCT_ID)` GROUP BY 아일랜드 | **유추** | `CastRestMapper.xml:1219` |
| `deviceList[].oprYn` (구 6.4) | — | — | **미확인** | 기기별 운영 여부 플래그가 없다. 리뉴얼 화면에도 대응 요소가 없다 |
| `deviceList[].oprTimeList` (구 6.4) | `PMOWN.TN_PM_SMLT_SBD_ATRB` | `OPER_BGNG_DT` / `OPER_END_DT` | **유추** | `CastRestMapper.xml:1223-1224` — SBD 는 있고 KIOSK 는 **미확인** |
| `totKioskCnt` / `totBagDropCnt` (선택) | — | 위 값의 터미널 합계 (계산값) | **유추** | 서버 합계가 필요하면 |

> **결정 필요 (DELTA 2.5)**: 기기별 운영시간(`deviceList[].oprTimeList`)을 계속 저장할지, 아일랜드 운영시간을 따를지. `TN_PM_SMLT_SBD_ATRB` 에는 기기별 시각 컬럼이 실제로 있으므로 **버리면 기존 데이터를 못 쓴다.** — 현업 확인
>
> **키오스크(`CK`)에는 운영시간 테이블이 확인되지 않는다.** SBD 만 `TN_PM_SMLT_SBD_ATRB` 가 있고 CK 에 대응하는 `*_ATRB` 가 없다. CAST 리소스 목록에도 키오스크 항목이 없다 (`CastRestMapper.xml:24-224`). — DBA 확인

### 2.6 저장

| 필드 | 저장 대상 테이블 | 컬럼 | 상태 |
|---|---|---|---|
| `smltId` / `tmnlId` | `PMOWN.TN_PM_SMLT_STNG` | `SMLT_ID` / `TMNL_ID` | **확인** (`CastRestMapper.xml:1573`, `:1579`) |
| `islandList[].island` | — | 아일랜드 단독 컬럼 없음. `CKNCT_ID` 1번째 자리에 녹아 있다 | **유추** |
| `islandList[].oprTimeList` | `PMOWN.TN_PM_SMLT_CKNCT_ATRB` | `CHKN_OPEN_PRNMNT_DT` / `CHKN_CLOSE_PRNMNT_DT` | **유추** |
| `islandList[].boothList[]` | `PMOWN.TN_PM_SMLT_CKNCT_ATRB` | `CKNCT_ID`, `ALN_CD` (행 1개 = 부스 1석) | **유추** |
| `islandList[].kioskCnt` | — | — | **미확인** — 대수를 직접 담을 컬럼이 없다. 행 수로 표현하려면 기기 단위 행을 생성해야 한다 |
| `islandList[].bagDropCnt` | `PMOWN.TN_PM_SMLT_SBD_ATRB` | 행 수 (`CKNCT_ID` 단위) | **유추** |
| 신규 아일랜드 식별자 | — | — | **미확인** — DELTA 2.6 결정 필요 항목 |

> **`TN_PM_SMLT_CKNCT_ATRB` 는 INSERT/UPDATE/DELETE statement 가 레포에 하나도 없다.** 조회(`CastRestMapper.xml:1078`)만 있다. **4단계에서 쓰기 SQL 을 전부 새로 써야 한다.**
>
> **결정 필요 (DELTA 2.6)**: `saveSlfchknInfo` 폐기 여부 — 저장 대상 테이블이 `TN_PM_SMLT_CKNCT_ATRB`(부스) 와 `TN_PM_SMLT_SBD_ATRB`(백드롭)로 **물리적으로 나뉘어 있다.** API 를 하나로 합치더라도 트랜잭션 안에서 두 테이블을 쓰게 된다. — 개발 판단

---

## 3. 출국장 탭

### 3.1 시간대별 운영 출국장 블럭 차트 (주 차트)

| 필드 | 테이블 | 컬럼 | 상태 | 근거 |
|---|---|---|---|---|
| `depList[].depNum` | `PMOWN.TN_PM_SMLT_PSG_FCLT` | `SUBSTR(PSG_FCLT_CD, 4, 1)` (`UP='LGT'`) | **확인** | `CastDepMapper.xml:36`, `:40` |
| ″ (대안) | `PMOWN.TN_PM_SMLT_FCLTY_OPNG_TBL_DPTGT_ATRB` | `GATE_NO` | **유추** | `CastRestMapper.xml:1941` — 다만 이건 **탑승게이트**지 출국장이 아닐 수 있다 |
| `depList[].oprYn` | `PMOWN.TN_PM_SMLT_PSG_FCLT` | `USE_YN` | **유추** | `CastDepMapper.xml:41`. **의미가 다르다** — `USE_YN` 은 "시설이 존재·사용중인가"고, 화면의 `oprYn` 은 "이번 시뮬레이션에서 쓸 것인가"다. 시뮬레이션 조건을 마스터에 쓰면 안 된다 |
| `depList[].oprTimeList` | `PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG` | `OPER_BGNG_1_HR` / `OPER_END_1_HR` (+ `_INFO`/`_ELMNT` 조인) | **유추** | `CastRestMapper.xml:1979-1984`. `_1_` 외 구간의 존재는 **미확인** |
| `depList[].scCnt` (검색대 대수, 피크 기준) | `PMOWN.TN_PM_SMLT_FCLTY_OPNG_TBL_SCRTY_CNTRL_ATRB` | `FCLTY_CNT` | **유추** | `CastRestMapper.xml:2095` — CAST 의 `currentNumberofLanes`. **시간축이 없어 "피크 기준"과 개념이 맞지 않는다** |
| `waitList` / `waitMaxCnt` | 2.2 와 동일 (`UP='LGT'`) | `SUM(WTNG_PSG_CNT)` | **유추** | `CastDepMapper.xml:10` — `SUM(WTNG_PSG_CNT)` 을 이미 시간·출국장별로 집계한다 |
| KPI 4종 | 2.3 과 동일 | — | **유추 / 미확인** | `p95WaitMin`·`utilRate` 는 미확인 |

### 3.2 시간대별 보안검색대 보조 차트 (구 6.6 흡수)

| 필드 | 테이블 | 컬럼 | 상태 | 근거 |
|---|---|---|---|---|
| `depList[].planList[].bgnHour` / `endHour` | — | — | **미확인** | 검색대 운영 **구간**을 담은 테이블을 찾지 못했다. `TN_PM_ENTGT_DPTGT_OPER_HR_MNG` 는 출입국장용이고 `FCLT_SE_CD` 로 검색대를 담는지 **미확인** |
| `depList[].planList[].scCnt` | — | — | **미확인** | 구간별 대수를 담을 컬럼이 없다. `..._SCRTY_CNTRL_ATRB.FCLTY_CNT` 는 **구간이 아니라 단일 값**이다 |
| `depList[].planList[].planSn` | — | — | **미확인** | 행 일련번호 컬럼 없음 |

> **G7 의 핵심이 여기다.** 리뉴얼 보조 차트는 "시간 × 검색대 대수" 2차원인데, 확인된 테이블은 `FCLTY_CNT` 라는 **1차원 값**뿐이다. 세 가지 선택지가 있다:
> 1. `TN_PM_ENTGT_DPTGT_OPER_HR_MNG` 의 `PRD_SN`(기간 일련번호) + `OPER_BGNG_n_HR` 구조를 검색대에도 쓴다 — 기존 구조 재활용. `FCLT_SE_CD` 에 검색대 코드가 있는지 확인 필요
> 2. `TN_PM_SMLT_SC_PLAN` 류 **신규 테이블**을 만든다 — `SMLT_ID` + `DEP_NUM` + `PLAN_SN` + `BGNG_HR` + `END_HR` + `SC_CNT`
> 3. `..._SCRTY_CNTRL_ATRB` 에 구간 컬럼을 추가한다 — CAST 리소스 포맷과 충돌 위험
>
> — **DBA + 개발 판단. 3단계 착수 전 결정 필요.**

### 3.3 드로어 — 검색대 구성

| 필드 | 테이블 | 컬럼 | 상태 |
|---|---|---|---|
| `depList[].normalCnt` (일반 검색대) | — | — | **미확인** |
| `depList[].smartPassCnt` (스마트패스 검색대) | — | — | **미확인** |
| `depList[].scCnt` (보안검색대 대수) | `PMOWN.TN_PM_SMLT_FCLTY_OPNG_TBL_SCRTY_CNTRL_ATRB` | `FCLTY_CNT` | **유추** |

> 가장 가까운 선례는 `..._EMIG_ATRB.EMIG_TYPE_CD` / `..._IMMIG_ATRB.IMMIG_TYPE_CD` 의 `'1'` Normal / `'2'` Automatic 구조다 (`CastRestMapper.xml:2016`, `:2048`). **보안검색대에는 그런 종류 컬럼이 없다** (`..._SCRTY_CNTRL_ATRB` 는 `TMNL_ID`, `FCLT_SE_CD`, `GATE_NO`, `FCLTY_CNT` 뿐 — `:2093-2095`).
>
> **결정 필요 (DELTA 3.3)**: `scCnt = normalCnt + smartPassCnt` 인지 독립인지. 합이라면 컬럼 2개를 신설하고 `FCLTY_CNT` 는 파생값으로 두면 된다. 독립이면 3개 다 신설해야 한다. — 현업 확인

### 3.4 저장

| 필드 | 저장 대상 테이블 | 상태 |
|---|---|---|
| `smltId` / `tmnlId` | `PMOWN.TN_PM_SMLT_STNG` | **확인** |
| `depList[].depNum` | `PMOWN.TN_PM_SMLT_PSG_FCLT` (`PSG_FCLT_CD` 4번째 자리) | **유추** — 마스터라 쓰기 대상이 아니다 |
| `depList[].oprYn` | — | **미확인** — 시뮬레이션별 출국장 사용여부를 담을 테이블이 없다 |
| `depList[].oprTimeList` | `PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG` | **유추** — 다만 이 테이블은 시뮬레이션 단위가 아니라 **전사 운영시간 마스터**로 보인다 (`OPER_HR_STTS_CD='DPL'` 배포 상태 개념) |
| `depList[].normalCnt` / `smartPassCnt` / `scCnt` | `..._SCRTY_CNTRL_ATRB` (`FCLTY_CNT` 만) | **부분 유추 / 나머지 미확인** |
| `depList[].planList[]` | — | **미확인** (3.2 참고) |

> **출국장 탭 저장은 체크인 탭보다 근거가 훨씬 약하다.** 체크인은 `TN_PM_SMLT_CKNCT_ATRB` 라는 "시뮬레이션 단위 조건 테이블"이 명확히 있는데, 출국장은 시뮬레이션 단위 조건을 담는 테이블이 확인되지 않는다. `TN_PM_SMLT_FCLTY_OPNG_TBL_*_ATRB` 는 `<자원>_ATRB_ID` 로 묶이고 `TN_PM_SMLT_STNG.FCLTY_OPNG_TBL_*_RSRC_ID` 가 그걸 참조하므로 **구조적으로는 맞다.** 다만 그 ATRB 행을 사용자 저장 시 새로 만드는 코드가 레포에 없다.
>
> **결정 필요 (DELTA 3.4)**: `saveScPlanInfo` 를 `saveDepInfo` 에 합칠지. 저장 대상이 최소 2개 테이블(`..._SCRTY_CNTRL_ATRB`, 신규 구간 테이블)이므로 **한 트랜잭션으로 묶는 것이 안전하다.** — 개발 판단

---

## 4. 서버 계산 / 클라이언트 계산 (DELTA 4장)

| 항목 | 원천 데이터 존재? | 상태 | 판단 |
|---|---|---|---|
| `균등 배치` | 입력값(운영시간·여객수)은 있다. 결과를 담을 컬럼은 배정 테이블 그 자체 | **유추** | 클라이언트 계산으로 충분하다. 결과를 `boothList`/`planList` 에 반영해 기존 저장 API 로 보내면 된다. **서버 API 신설 불필요** — 개발 판단 |
| `균등`의 기준 | — | **미확인** | 운영시간 균등인지 여객수 비례인지. 여객수 비례라면 `GOOWN.TN_GO_GD_DATA.PREDC_HM` 별 여객수가 입력이다 — 현업 확인 |
| 피크 카운터 / 피크 검색대 | 시간대별 부스·검색대 수가 있으면 계산 가능 | **유추** | 부스는 계산 가능(2.1), 검색대는 시간축이 없어 불가(3.2) |
| 대기인원수 꺾은선 · KPI 4종 | 2.2 · 2.3 참고 | **유추 / 미확인** | `p95WaitMin`·`utilRate` 는 원천이 없다 |
| `세부 운영시간 직접 설정 →` | `TN_PM_ENTGT_DPTGT_OPER_HR_MNG.PRD_SN` 구조가 다구간을 지원할 가능성 | **미확인** | `OPER_BGNG_2_HR` 존재 여부 확인이 선행 — DBA 확인 |
| `+ 추가` 신규 항목 식별자 | 아일랜드는 `CKNCT_ID` 문자 1자, 출국장은 `PSG_FCLT_CD` 4번째 자리 | **유추** | 둘 다 **자리수가 고정**이라 자유 채번이 불가능하다. 아일랜드는 `A`~`N`(13개 중 미사용분), 출국장은 1자리 숫자로 제한된다 — 개발 판단 |

---

## 5. 현행 명세에서 정리되는 항목 (DELTA 5장)

| 대상 | DB 관점 영향 | 상태 |
|---|---|---|
| `6.3 counterList[]` (`counterId`/`counterNum`/`rowType`) | `rowType`(상/하단 `U`/`L`)을 담은 컬럼이 **애초에 확인되지 않는다.** 삭제해도 DB 손실 없음 | **미확인 → 정리 무해** |
| `6.3 saveChknCounterInfo.oprCounterIdList` | `counterId`(`U1`~`L18`)는 DB 값이 아니라 화면 좌표다. `CKNCT_ID`(`A01`)로 대체하는 것이 옳다 | **확인 → 정리 권장** |
| `6.4` 전체 (`retrieveSlfchknInfo` / `saveSlfchknInfo`) | 저장 대상 테이블(`TN_PM_SMLT_SBD_ATRB`)은 남는다. **API 만 통합되고 테이블은 그대로다** | **확인** |
| `6.6` 전체 (`retrieveScPlanInfo` / `saveScPlanInfo`) | 저장 대상 테이블이 애초에 **미확인**이다. 통합 전에 3.2 결정이 선행 | **미확인 — 선행 조건 있음** |
| `6.7 retrieveFcltMap` 의 `fcltType` (`SLFCHKN`/`SC`) | 좌표를 담은 테이블 자체가 미확인 (`FcltMapper` XML 없음, G1). `fcltType` 코드값 유지 여부는 **DB 와 무관** | **미확인** |
| `2. 화면↔API 대응` 표 · `8. 화면 호출 순서` | 문서 정리. DB 영향 없음 | — |

---

## 매핑 요약 — 3단계로 넘기는 판단

| 구분 | 항목 수 | 대표 항목 |
|---|---|---|
| **확인** — 기존 쿼리 재활용 가능 | 12 | 아일랜드·부스번호·항공사·운영시간(실적), 출국장 번호, 운항편/여객 요약 |
| **유추** — 컬럼은 있으나 쿼리 신규 작성 | 24 | `boothCnt`, 대기 꺾은선, `avgWaitMin`, `bagDropCnt`, 출국장 운영시간, `scCnt` |
| **미확인** — 테이블·컬럼 신설 또는 확인 필요 | 20 | `p95WaitMin`, `utilRate`, `customYn`, 검색대 `planList` 전체, `normalCnt`/`smartPassCnt`, 운항편 조정 비율, `oprYn`(시뮬 단위) |

**3단계(조회 API)를 막는 것**: 대기 꺾은선·KPI 의 출처 결정(2.2/2.3), `PSG_FCLT_CD` 자리수 규칙 검증(G11).
**4단계(저장 API)를 막는 것**: 검색대 시간대별 대수의 저장 구조(3.2/G7), 출국장 시뮬레이션 조건 테이블 부재(3.4).
