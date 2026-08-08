# 5.5 갭 · 모순 목록

← [DB-ANALYSIS.md](DB-ANALYSIS.md)

**3·4단계가 여기서 걸려 넘어질 것들이다.** 지시서에 제시된 G1~G8 을 전부 검증해 반영하고, 분석 중 새로 발견한 G9~G21 을 추가했다.

**발견한 SQL 버그는 기록만 했다. 고치지 않았다** (2단계 범위).

> **4단계 처리 결과**는 [07-save-decisions.md](07-save-decisions.md) 에 있다.
> G3 / G4 는 **호출하지 않으므로 고치지 않았다**(D18, 수정안은 문서에 있다). G7 은 신규 테이블로 해소(D10),
> G8 은 호출 지점만 확보(D19), G18 은 `INSERT ALL` 로 우회(D14), G22 는 D10 의 근거가 됐다.

## 우선순위 요약

| 등급 | 항목 | 뜻 |
|---|---|---|
| 🔴 **차단** | G2, G7, G11 | 결정 전에는 3단계를 시작할 수 없다 |
| 🟠 **실행 실패** | G3, G4, G9, G18, G19 | 코드가 실제로 돌면 예외가 난다 |
| 🟡 **구현 제약** | G1, G8, G17, G22 | 신규 작성 분량이 늘어난다 |
| ⚪ **품질·혼선** | G5, G6, G10, G12~G16, G20, G21 | 당장 안 터지지만 조용히 틀린다 |

---

## G1 🟡 `FcltMapper` / `UserMapper` 에 XML 이 없다

- **내용**: `java/cast/mapper/FcltMapper.java`, `UserMapper.java` 는 인터페이스만 있고 대응 XML 이 `java/cast-db/` · `java/mapper/` 어디에도 없다. 따라서 **테이블명조차 확인되지 않는다.**
- **근거**: `java/cast/mapper/FcltMapper.java:26-30`, `UserMapper.java:26-28` / `ls java/cast-db java/mapper` 결과 6개 XML 뿐
- **영향 범위**: 3단계 — 시설물 지도(`retrieveFcltMap`, `API_SPEC.md` 5.1 · 6.7)와 사용자 정보 조회 SQL 을 **전부 새로 써야 한다**. `FcltDto` 의 `cdntLat`/`cdntLng`(String) 를 담은 좌표 테이블이 `TN_PM_SMLT_PSG_FCLT` 와 별개로 존재하므로 그 테이블부터 찾아야 한다.
- **결정 주체**: **DBA 확인** (좌표 테이블 존재·이름) → 개발 작성

## G2 🔴 터미널 코드가 Java `P01`/`P02`/`P03` vs React `T1`/`T2`

- **내용**: DB·Java 는 터미널을 3개로, 화면은 2개로 센다.
- **근거 (해소된 부분)**: `CastSmltServiceImpl.java:159-176` 이 **`P01` + `P02` 를 더해 T1**, **`P03` 을 T2** 로 만든다.
  ```java
  result.setT1FltCnt(summaryP01.getFltCnt() + summaryP02.getFltCnt());   // :161
  result.setT2FltCnt(summaryP03.getFltCnt());                            // :165
  ```
  인천공항 구조(제1여객터미널 / 탑승동 / 제2여객터미널)와 일치한다. **`P01`=제1여객터미널, `P02`=탑승동, `P03`=제2여객터미널** 로 읽힌다.
- **근거 (남은 문제)**:
  1. **시설 결과 조회는 `P01`·`P03` 만 쓴다** (`CastSmltServiceImpl.java:88-92`, `:106-110`). 탑승동(`P02`)의 체크인·출국장 결과는 조회되지 않는다.
  2. `insertSimSet` 이 `TMNL_ID` 에 **`'P01'` 하드코딩** (`CastRestMapper.xml:1610`)
  3. 출입국장 운영시간은 `P02` 데이터가 없어 **`P01` 행을 복사해 라벨만 `'P02'` 로 바꾼다** (`CastRestMapper.xml:2160-2193`)
  4. `DROP_AA_TN_AS_GD_DATA.TER_ID` 에는 `'P'` 라는 네 번째 값이 있다 (`CastRestMapper.xml:332`) — 터미널 미배정으로 추정, **미확인**
- **영향 범위**: 3단계 — `T1↔P01/P02` 변환 지점을 Controller·Service·Mapper 중 어디에 둘지. 탑승동을 T1 에 포함할지(운항편은 포함, 시설은 미포함이 현재 동작)
- **결정 주체**: **현업 확인** (탑승동 체크인카운터가 T1 화면에 나와야 하는가) + 개발 판단 (변환 지점)

## G3 🟠 `updateSimResultDtl` — Oracle 문법 오류 2건

- **내용**:
  ```sql
  UPDATE INTO PMOWN.TN_PM_SMLT_RSLT_DTL SET          -- ① UPDATE 에 INTO 는 없다
        WTNG_PSG_CNT  = INT(WTNG_PSG_CNT)+TO_NUMBER(#{wtngPsgCnt})   -- ② INT() 는 Oracle 함수가 아니다
      , TRNST_PSG_CNT = INT(TRNST_PSG_CNT)+TO_NUMBER(#{trnstPsgCnt})
  ```
- **근거**: `CastRestMapper.xml:1762-1770` (statement 시작 `:1762`, 오류 라인 `:1764`, `:1765-1766`)
- **영향 범위**: 이 statement 는 **실행되는 순간 `ORA-00905` / `ORA-00904` 로 실패한다.** 4단계 CAST 결과 누적 갱신 경로가 통째로 죽는다. `INT()` 는 `TRUNC()` 또는 `FLOOR()` 로 바꿔야 하고, 애초에 `WTNG_PSG_CNT` 는 `NUMBER(5,0)` 이라 변환 자체가 불필요하다 (`ddl.txt:10`).
- 추가로 `WHERE` 절이 PK 6개 중 3개(`SMLT_ID`, `SMLT_MDL_SN`, `SMLT_RSLT_SN`)만 쓴다 (`:1767-1769`) — **의도한 것보다 많은 행이 갱신된다.**
- **결정 주체**: **개발 판단** (4단계에서 수정)

## G4 🟠 `retrieveSimSetByPk` — 없는 컬럼 참조

- **내용**:
  ```sql
  SELECT COUNT(SIM_ID) rsltCnt FROM PMOWN.TN_PM_SMLT_STNG
  ```
  `TN_PM_SMLT_STNG` 의 컬럼은 `SMLT_ID` 다. `SIM_ID` 는 없다.
- **근거**: `CastRestMapper.xml:1747-1753` (오류 라인 `:1749`). 같은 테이블의 다른 statement 는 모두 `SMLT_ID` 를 쓴다 (`:1573`, `:1751`, `:1744`)
- **영향 범위**: 실행 시 `ORA-00904`. 4단계 CAST 중복 실행 체크 경로가 죽는다.
- **결정 주체**: **개발 판단** (4단계에서 수정)

## G5 ⚪ `<resultMap>` 이 전무하다

- **내용**: 7개 XML 통틀어 `<resultMap>` 이 0건이다. 컬럼→필드 매핑이 전적으로 `map-underscore-to-camel-case` 설정 + SELECT 별칭에 의존한다.
- **근거**: `grep -c resultMap` = 0 (전 XML)
- **영향 범위**: **별칭 실수는 예외가 아니라 조용한 `null` 이다.** 특히 위험한 지점:
  - `CastChknMapper.xml:28-29` — `AVG_PRCS_HR as PRCS_HR` 를 빼먹으면 `AggData.prcsHr` 가 0
  - `CastSmltMapper.xml:79` — `WTNG_LINE_LEN as WTNG_PSG_CNT` (별칭으로 **의미까지 바꾼다**, G16)
  - `resultType` 이 `int` 필드인 DTO(`AggData`)에 `null` 이 오면 MyBatis 가 `0` 을 넣는다 → 데이터 없음과 값 0 이 구분되지 않는다
- **결정 주체**: **개발 판단** — 3단계 신규 쿼리는 별칭을 반드시 검증. `mybatis-config` 의 `mapUnderscoreToCamelCase` 설정 파일이 레포에 없어 **설정 자체는 미확인**이다.

## G6 ⚪ 트레이스 주석이 틀린 곳이 많다

| 위치 | 실제 | 주석 |
|---|---|---|
| `CastUserConfigMapper.xml:6` | `CastUserConfigMapper.retrieveFlightList` | `CastDepMapper.retrieveFlightList` |
| `CastUserConfigMapper.xml:18` | `CastUserConfigMapper.retrieveChknList` | `CastDepMapper.retrieveChknList` |
| `CastSmltMapper.xml:94` | `CastSmltMapper.retrievePrcsGrd` | `CastSmltMapper.retrieveXovisRsltDtl` |
| `CastRestMapper.xml` 45곳 | namespace 는 `...mapper.CastRestMapper` | `CastRestTestMapper.` (49개 중 45개). 나머지 4개만 `CastRestMapper.` |
| `PrcsGrdType.java:6-7` | `SLFCHKN`=셀프체크인, `CHKN`=체크인 | 두 주석이 **서로 뒤바뀌어 있다** (`// 체크인` / `// 셀프체크인`) |
| `CastSmltServiceImpl.java:206` | 상위시설코드 8종 | `LC 출국심사` 가 누락된 7종만 나열. `CastSmltMapper.xml:58` 은 8종 |

- **영향 범위**: 운영 중 SQL 트레이스 로그로 원인 statement 를 못 찾는다. `PrcsGrdType` 주석은 **읽는 사람이 코드값을 반대로 이해하게 만든다** — 실제 매핑은 [03-sql-patterns.md](03-sql-patterns.md) ⑤ 참고.
- **결정 주체**: **개발 판단** (3단계 착수 시 일괄 정정 권장)

## G7 🔴 시간대별 부스 수 / 검색대 대수를 담을 테이블이 확인되지 않는다

**3·4단계 최대 리스크.** 리뉴얼 화면의 핵심 차트가 여기 걸려 있다.

| 화면 요구 | 확인된 것 | 부족한 것 |
|---|---|---|
| 아일랜드별 **시간대별** 운영 부스 수 | `GOOWN.TI_GO_CKNCT_DALY_ALOT` 에 카운터별 `EST_BGNG_HM`/`EST_END_HM` 이 있다 → **유도 가능** | 시뮬레이션 조건으로 편집한 값의 저장처. `TN_PM_SMLT_CKNCT_ATRB` 가 후보지만 **쓰기 SQL 이 하나도 없다** |
| 출국장별 **시간대별** 검색대 대수 | `..._SCRTY_CNTRL_ATRB.FCLTY_CNT` — **시간축 없는 단일 값** | 시간 구간(`planList[].bgnHour`/`endHour`/`scCnt`/`planSn`)을 담을 구조가 **전무하다** |

- **근거**: `CastChknMapper.xml:45-47` / `CastRestMapper.xml:2093-2097` / [04-screen-table-mapping.md](04-screen-table-mapping.md) 3.2
- **선택지** (3.2 참고):
  1. `TN_PM_ENTGT_DPTGT_OPER_HR_MNG` 의 `PRD_SN` + `OPER_BGNG_n_HR` 구조를 검색대에도 적용 — 기존 구조 재활용. `FCLT_SE_CD` 에 검색대 코드가 있는지 확인 선행
  2. `TN_PM_SMLT_SC_PLAN` 류 **신규 테이블 신설** — `SMLT_ID` + `DEP_NUM` + `PLAN_SN` + `BGNG_HR` + `END_HR` + `SC_CNT` + 감사 6종
  3. `..._SCRTY_CNTRL_ATRB` 에 구간 컬럼 추가 — CAST 리소스 포맷(`currentNumberofLanes` 단일값)과 충돌 위험
- **영향 범위**: 3단계 출국장 조회 API, 4단계 저장 API. **선택지 2를 고르면 DDL 신설 → DBA 일정이 크리티컬 패스에 들어온다.**
- **결정 주체**: **DBA 확인** (기존 구조 재활용 가능성) → **개발 판단** (신규 테이블 설계) → **현업 확인** (구간 단위가 1시간인지)

## G8 🟡 `aoms.pm.cmmn.dto.*` 가 레포에 없다

- **내용**: `CastRestMapper.xml` 의 49개 statement 중 **45개**가 `aoms.pm.cmmn.dto.*` 타입을 `parameterType`/`resultType` 으로 쓴다. 그런데 레포에는 `aoms.pm.cast.dto.*` 만 있다.
- **근거**: `CastRestMapper.xml:4`, `:24`, `:226` 등 전역 / `ls java/cast/dto` = 30개 파일, 전부 `aoms.pm.cast.dto`
- **없는 DTO — 고유 26종**: `CastCheckInCounterServiceTimeDto`, `CastCheckinTypeDto`, `CastCounterAllocationDto`, `CastFcltyOpngTblDptgDto`, `CastFcltyOpngTblEmigDto`, `CastFcltyOpngTblImmigDto`, `CastFcltyOpngTblScrtyCntrlDto`, `CastFcltyOpngTblTrnstScrtyCntrlDto`, `CastFlightScheduleDto`, `CastModelDto`, `CastProPertySetDtlDto`, `CastPropertySetDto`, `CastReqGetResourceDto`, `CastResReqDto`, `CastResourceInformationDto`, `CastRptStngHrGroupCntrlDto`, `CastRsltFcltCdDto`, `CastSelfCheckInCountAndBagDropDto`, `CastWhatIfCntrlDto`, `DwDelKeyValHstDto`, `PmAtchFileDto`, `SimRsltDto`, `SimRunStatDto`, `SimSetDto`, `SmltMdlDto`, `SmltRsltDtlDto`
- **영향 범위**: 4단계 CAST 연동 범위 제약. **`CastRestMapper.xml` 을 그대로 가져다 쓸 수 없다** — DTO 를 전부 새로 만들거나, 원본 프로젝트에서 가져와야 한다. 컬럼 정보는 이 문서의 카탈로그로 복원 가능하지만 **필드 타입은 유추뿐이다.**
- **결정 주체**: **개발 판단** (4단계 착수 시 CAST 연동을 범위에 넣을지) — 범위 밖으로 두면 3단계 조회는 영향 없다

---

## 신규 발견 (G9~G21)

## G9 🟠 `updateAtchFile` — WHERE 절 컬럼이 틀렸고 SET 컬럼이 스키마 밖이다

```sql
UPDATE PMOWN.TN_PM_PSG_MNG_ATFL
   SET ...
     , LST_MOD_TSP = CURRENT_TIMESTAMP        -- ① PM 하우스 스타일에 없는 컬럼명
 WHERE LAST_MDFCN_DT = #{atchFileId}          -- ② ATCH_FILE_ID 여야 한다
   AND ATCH_FILE_SN = '1'                     -- ③ 파라미터 무시하고 '1' 하드코딩
```

- **근거**: `CastRestMapper.xml:1873-1888` (오류 라인 `:1885`, `:1886`, `:1887`)
- `LST_MOD_TSP` 는 `DROP_AA_*` 스테이징의 어휘다 ([02-naming-convention.md](02-naming-convention.md) 예외 표). PM 테이블에는 `LAST_MDFCN_DT` 가 맞다. **컬럼이 실재하지 않으면 `ORA-00904`**, 실재하더라도 `WHERE LAST_MDFCN_DT = <문자열 ID>` 는 타입 불일치로 실패한다.
- **영향 범위**: 4단계 첨부파일 수정 경로. 조회·등록·삭제는 정상이다.
- **결정 주체**: **DBA 확인** (`LST_MOD_TSP` 실재 여부) → **개발 판단**

## G10 ⚪ `<where>` 사용 예외 1건

- **내용**: 하우스 스타일은 `WHERE 1 = 1` + `<if>` 인데, `retrieveAtchFileList` 만 `<where>` 를 쓴다.
- **근거**: `CastRestMapper.xml:1826-1836`. 전 XML 통틀어 `<where>` 1건, `<trim>`/`<choose>` 0건
- 같은 statement 안에 `<if test="atchFileIdSrch == ''.toString()">AND 1 = 2</if>` (`:1827-1829`) 라는 방어 코드도 있다 — 검색조건이 빈 문자열이면 전건 조회를 막는 의도.
- **영향 범위**: 없음(동작은 정상). 3단계 신규 XML 은 `WHERE 1 = 1` 스타일을 따를 것.
- **결정 주체**: **개발 판단**

## G11 🔴 `PSG_FCLT_CD` 자리수 규칙이 검증되지 않았다

- **내용**: [03-sql-patterns.md](03-sql-patterns.md) ② 의 자리수 구성표는 SQL 의 `SUBSTR` 위치와 Java 의 LIKE 패턴에서 **역산한 유추**다. 실데이터로 확인하지 않았다.
- **핵심 불확실성**: `StringUtils.isMatchPatternLike(pattern, value)` 의 구현이 **레포에 없다** (`java/` 아래에 `utils` 패키지 자체가 없다). `_` 가 SQL LIKE 의 단일문자 와일드카드인지 리터럴 언더스코어인지 확정 불가.
  - 와일드카드로 읽으면: `LGT` 는 4번째 자리가 번호(`CastDepMapper.xml:36` 과 일치 ✓), `SC`/`SR` 은 5번째 자리가 번호
  - 리터럴로 읽으면: `SC` 코드에 연속 언더스코어 2개(`T1__1`)가 있어야 한다 — 부자연스럽다
- **근거**: `CastSmltServiceImpl.java:287`, `:304`, `:333`, `:348` / `CastChknMapper.xml:24-26` / `CastDepMapper.xml:36` / `CastSlfchknMapper.xml:26`, `:28`
- **영향 범위**: 3단계 — **신규 조회 쿼리를 한 줄도 못 쓴다.** 자리수가 틀리면 `SUBSTR` 결과가 조용히 어긋나 빈 결과나 잘못된 그룹이 나온다.
- **확인 방법** (3단계 착수 첫 작업으로 권장):
  ```sql
  SELECT UP_PSG_FCLT_CD, TMNL_ID, PSG_FCLT_CD, PSG_FCLT_NM, SMLT_FCLT_NM
    FROM PMOWN.TN_PM_SMLT_PSG_FCLT
   WHERE USE_YN = 'Y'
   ORDER BY UP_PSG_FCLT_CD, TMNL_ID, PSG_FCLT_CD;
  ```
- **결정 주체**: **DBA 확인** (실데이터 조회) — 이것 하나로 G11 이 해소된다

## G12 ⚪ 시퀀스 이름이 대상 테이블과 어긋난다

| 시퀀스 | 대상 테이블·컬럼 | 어긋난 지점 |
|---|---|---|
| `PMOWN.SQ1_TN_PM_SMLT_RSLT` | `TN_PM_SMLT_STNG.SMLT_ID` | 이름은 `_RSLT`(결과), 실제는 `_STNG`(설정) PK 채번 |
| `PMOWN.SQ1_TH_PX_DW_DEL_KEY_VAL_HST` | `TH_PM_DW_DEL_KEY_HSTRY.DEL_SN` | `PX` vs `PM`, `KEY_VAL_HST` vs `KEY_HSTRY` |

- **근거**: `CastRestMapper.xml:1550`, `:1795`. 하우스 규칙은 `SQ1_<TABLE>` ([02-naming-convention.md](02-naming-convention.md))
- **영향 범위**: 4단계에서 규칙(`SQ1_<TABLE>`)만 보고 시퀀스명을 유추하면 `ORA-02289`. **반드시 위 실제 이름을 쓸 것.**
- **결정 주체**: **DBA 확인** (실재 시퀀스 목록)

## G13 ⚪ `REL_EVENT_CD` — 접미와 코멘트·타입이 어긋난다

- **내용**: 컬럼명은 `_CD`(코드)인데 코멘트는 "관련이벤트**수**", 타입은 `NUMBER(5,0)` 이다.
- **근거**: `ddl.txt:9` (타입), `ddl.txt:45` (코멘트)
- **추가**: `insertSimResultDtl` 은 이 컬럼에 `#{SmltRsltDtlDto.relEventCd}` 를 넣지만, **`INDV_REQ_AVG_AREA` 에는 `'1'` 을 하드코딩**한다 (`CastRestMapper.xml:1683`). 개인소요평균면적이 항상 1이면 CAST 원본 값이 버려지고 있다는 뜻이다.
- **영향 범위**: 3단계 조회 시 이 컬럼을 코드로 해석하면 안 된다. `INDV_REQ_AVG_AREA` 는 화면에 쓸 수 없다.
- **결정 주체**: **현업 확인** (`INDV_REQ_AVG_AREA` 를 실제로 쓰는가)

## G14 ⚪ `_HR` 컬럼의 단위가 확정되지 않았다

- **내용**: `AVG_PRCS_HR` / `AVG_WTNG_HR` 등 9개 컬럼이 `_HR`(시간) 접미에 `NUMBER(5,0)` 이다. 화면은 이 값을 **분** 으로 표시한다 (`API_SPEC-DELTA.md` 2.3 `avgWaitMin`).
- **근거**: `ddl.txt:12-17` (타입) / `AggData.java` — `int prcsHr; // 처리시간` (단위 미기재) / `API_SPEC-DELTA.md` 2.3
- **정수 5자리**이므로 시간 단위일 리 없고(최대 99999시간), 초 또는 분일 가능성이 높다. **확정 불가.**
- **영향 범위**: 3단계 — KPI `avgWaitMin` 계산에서 60 을 곱할지 나눌지 그대로 쓸지가 갈린다. **틀리면 화면 숫자가 60배 어긋난다.**
- **결정 주체**: **DBA 확인** (실데이터 분포) + **CAST 벤더 확인** (엔진 출력 단위)

## G15 ⚪ `SMLT_MDL_EXPLN`(설명)을 유일 키처럼 쓴다

- **내용**: `TN_PM_SMLT_MDL` 의 조회·수정·삭제가 전부 `WHERE SMLT_MDL_EXPLN = #{resourceID}` 다. PK 는 `SMLT_MDL_SN` 인데.
- **근거**: `CastRestMapper.xml:1459`, `:1476`, `:1487`, `:1526`, `:1536`, `:1545`, `:1752`, `:1759`
- **영향 범위**: `SMLT_MDL_EXPLN` 에 UNIQUE 제약이 없으면 **`updateCASTModel`/`deleteCASTModel` 이 여러 행을 건드린다.** `retrieveModelInfo` 는 `resultType` 이 단건이라 2건 이상이면 MyBatis `TooManyResultsException`.
- **결정 주체**: **DBA 확인** (UNIQUE 제약 존재 여부)

## G16 ⚪ 운항정보 원본이 둘이고 서로 어긋난다 / 대기 지표 의미 왜곡

**(a) 운항정보 이중 원본**

`GOOWN.TN_GO_GD_DATA` 와 `PMOWN.DROP_AA_TN_AS_GD_DATA` 가 같은 운항정보를 다른 컬럼명으로 담는다. 유효 운항편 필터가 어긋난다:

| 조건 | `TN_GO_GD_DATA` | `DROP_AA_TN_AS_GD_DATA` |
|---|---|---|
| 항공기사용구분 | `ARCFT_USE_SE_CD IN ('0','1')` | `AC_USE_SE_CD = '0'` |
| 국내선 | `DOM_INTL_SE_CD NOT IN ('D')` (제외) | 제외 안 함 — `CASE` 로 `Dom`/`Int` 라벨만 붙인다 |
| 출도착 | `ARR_DEP_SE_CD = 'D'` (출발만) | 필터 없음 |

- **근거**: `CastSmltMapper.xml:32-39` vs `CastRestMapper.xml:330-337`
- **영향 범위**: 같은 날 같은 터미널의 운항편 수가 두 경로에서 다르게 나온다. 리뉴얼 `운항편/여객수` 탭 요약과 CAST 에 넘긴 스케줄의 편수가 안 맞을 수 있다.
- **결정 주체**: **현업 확인** (어느 쪽이 정본인가)

**(b) `WTNG_LINE_LEN` → `WTNG_PSG_CNT` 별칭**

```sql
A.WTNG_LINE_LEN as WTNG_PSG_CNT     -- CastSmltMapper.xml:79
```

xovis 센서의 **대기줄 길이**를 **대기 인원수** 필드에 그대로 넣는다. 두 값은 단위가 다르다. `SummaryRsltDto` 를 CAST 결과와 xovis 실측이 공유하므로 (`CastSmltMapper.xml:42`, `:71`) 화면에서 두 값이 같은 축에 그려진다.

- **영향 범위**: 대기인원수 꺾은선(DELTA 2.2)의 출처를 xovis 로 정하면 **단위가 "명"이 아니다.**
- **결정 주체**: **현업 확인**

## G17 🟡 자정 넘김(RON) 처리가 매퍼마다 다르다

- `CastChknMapper.xml:53` — `A.TIME BETWEEN C.EST_BGNG_HM AND C.EST_END_HM`. **자정 넘김 구간에서 0행**
- `CastRestMapper.xml:948`, `:1070`, `:1226` — `RON_YN` 플래그로 종료일자를 +1 해서 처리
- **영향 범위**: 심야 운영 카운터(예: 22:00~02:00)가 체크인 화면에서 통째로 빠진다. 리뉴얼 화면은 24시간 축이라 눈에 띈다.
- **결정 주체**: **개발 판단** — 3단계 신규 쿼리는 `RON_YN` 패턴을 따를 것

## G18 🟠 벌크 INSERT 가 Oracle 문법이 아니다

```xml
INSERT INTO PMOWN.TN_PM_SMLT_RSLT_DTL (...) VALUES
<foreach item="SmltRsltDtlDto" collection="list" separator=",">
    ( #{...}, ... )
</foreach>
```

- **근거**: `CastRestMapper.xml:1637-1689` (`VALUES` `:1662`, `<foreach>` `:1663-1688`). `INSERT ALL` 은 파일 전체에 **0건**.
- Oracle 은 `INSERT ... VALUES (...), (...)` 다중행 문법을 **지원하지 않는다** (`ORA-00933`). `INSERT ALL INTO t (...) VALUES (...) ... SELECT * FROM DUAL` 이 필요하다.
- 단, `list` 원소가 1개면 정상 동작한다 — **테스트에서 안 걸릴 수 있다.**
- **영향 범위**: 4단계 CAST 결과 대량 적재. 이게 실제로 돌아간 적이 있다면 다른 실행 경로(JDBC batch 등)를 쓴다는 뜻이므로 확인 필요.
- **결정 주체**: **개발 판단**

## G19 🟠 `LISTAGG` 오버플로 방어가 없다

- `LISTAGG` **119회** 중 `ON OVERFLOW TRUNCATE` 절 **0회**.
- **근거**: `grep -c "LISTAGG"` = 119, `grep -c "ON OVERFLOW"` = 0
- Oracle 의 `LISTAGG` 결과는 `VARCHAR2` 한계(기본 4000바이트)를 넘으면 **`ORA-01489`** 로 실패한다. `retrieveFlightSchedule` 은 하루치 전 운항편(수백 건)을 한 문자열로 잇는다 — **거의 확실히 넘는다.**
- **영향 범위**: 4단계 CAST 리소스 전송. 운항편이 적은 날만 성공하는 형태의 간헐적 실패.
- **결정 주체**: **개발 판단** (`ON OVERFLOW TRUNCATE` 추가 또는 `XMLAGG` 전환)

## G20 ⚪ `DBMS_RANDOM.VALUE` 로 tie-break — 재현성이 없다

- **근거**: `CastRestMapper.xml:436`, `:475`, `:559` — 과거 대표 게이트/캐로셀/카운터를 뽑을 때 동률이면 랜덤
- **영향 범위**: 같은 입력으로 같은 시뮬레이션을 두 번 돌려도 **입력 리소스가 달라질 수 있다.** 결과 비교(what-if)의 전제가 깨진다.
- **결정 주체**: **현업 확인** (재현성이 요구사항인가) → 개발 판단

## G21 ⚪ 여객수 fallback 2단계가 사실상 1단계다

```sql
ROUND(AVG(...)) AS AVG_PAX_BY_FLT,   -- :509-515
ROUND(AVG(...)) AS AVG_PAX_BY_ALN    -- :516-522   ← 위와 완전히 같은 식
...
GROUP BY A.CLOSING_FLT_NM, A.ALN_CD  -- :549
```

- **근거**: `CastRestMapper.xml:504-549`, 사용처 `:610-613`
- 편명별 평균과 항공사별 평균을 다르게 의도했으나, 같은 식·같은 `GROUP BY` 라 **항상 같은 값**이다. `COALESCE(AVG_PAX_BY_FLT, AVG_PAX_BY_ALN, 좌석수*0.75)` 의 2번째 항이 무의미하다.
- `AVG_TR_PAX_BY_FLT` / `AVG_TR_PAX_BY_ALN` 도 동일 (`:524-537`).
- **영향 범위**: 신규 취항편처럼 편명 이력이 없는 경우 항공사 평균으로 떨어져야 하는데 바로 `좌석수 × 0.75` 로 간다. 여객수 추정이 거칠어진다.
- **결정 주체**: **개발 판단**

## G22 🟡 `TN_PM_SMLT_*_ATRB` 계열에 쓰기 SQL 이 없다

- **내용**: 사용자 시뮬레이션 조건을 담을 후보 테이블들(`TN_PM_SMLT_CKNCT_ATRB`, `TN_PM_SMLT_SBD_ATRB`, `TN_PM_SMLT_SCHDL_ATRB`, `TN_PM_SMLT_FCLTY_OPNG_TBL_*_ATRB`)에 **INSERT/UPDATE/DELETE statement 가 하나도 없다.** 전부 조회만 있다.
- **근거**: `CastRestMapper.xml` 의 쓰기 statement **17개**(insert 7 / update 5 / delete 5) 가 건드리는 테이블은 `TH_PM_SMLT_EXCN_LOG`, `TN_PM_SMLT_MDL`, `TN_PM_SMLT_STNG`, `TN_PM_SMLT_RSLT_DTL`, `TN_PM_SMLT_RSLT_DTL_REG_EXCL`, `TH_PM_DW_DEL_KEY_HSTRY`, `TN_PM_PSG_MNG_ATFL`, `TN_PM_SMLT_WHAT_IF_DEF_TBL` **8개뿐**이다. 나머지 6개 XML 은 select 만 있어 쓰기가 0건이다.
- **해석**: 이 `*_ATRB` 행들은 **다른 시스템(배치 또는 별도 화면)이 만든다.** 사용자 시뮬레이션 화면이 직접 쓰는 구조가 아니었다.
- **영향 범위**: **4단계 저장 API 는 참고할 선례 SQL 이 없다.** 컬럼 구성은 조회 쿼리로 복원했지만, PK·NOT NULL·기본값을 모르는 상태에서 INSERT 를 써야 한다.
- **결정 주체**: **DBA 확인** (해당 테이블 DDL 확보) — **4단계 착수 전 필수**

---

## 3단계로 넘기는 결정 항목 (요약)

| # | 결정할 것 | 주체 | 없으면 막히는 것 |
|---|---|---|---|
| G11 | `PSG_FCLT_CD` 자리수 규칙 실데이터 확인 | DBA | 조회 쿼리 전부 |
| G2 | 탑승동(`P02`)을 T1 화면에 포함하는가 / 변환 지점 | 현업 + 개발 | 모든 터미널 파라미터 |
| G14 | `_HR` 컬럼 단위 (초/분) | DBA + 벤더 | KPI `avgWaitMin` |
| — | 대기 꺾은선·KPI 의 출처 (직전 결과 / 실시간 / 공란) | 현업 + 개발 | 체크인·출국장 조회 API |
| G7 | 시간대별 검색대 대수 저장 구조 | DBA + 개발 | 출국장 조회·저장 API |
| G22 | `*_ATRB` 계열 DDL 확보 | DBA | 4단계 저장 API 전부 |
| G1 | 시설물 좌표 테이블 이름 | DBA | 지도 보기 |
| G8 | CAST 연동(`aoms.pm.cmmn.dto.*`)을 4단계 범위에 넣는가 | 개발 | 4단계 범위 확정 |
