# 5.3 핵심 조인 패턴 · SQL 관용구

← [DB-ANALYSIS.md](DB-ANALYSIS.md)

3·4단계에서 신규 쿼리를 쓸 때 그대로 복제할 패턴들이다. **① 3-way 조인**과 **② `PSG_FCLT_CD` 자리수 규칙**이 가장 중요하다.

---

## ① 체크인카운터 3-way 조인 — `CastChknMapper.retrieveSmltChknList`

`CastChknMapper.xml:5-57`. **3·4단계에서 가장 많이 복제될 쿼리다.**

시뮬레이션 결과(A) × 시설 마스터(B) × 일별 카운터 배정(C) 을 붙여, "이 시간에 이 아일랜드 이 카운터에서 이 항공사가 얼마나 밀렸는가"를 만든다.

```
A  PMOWN.TN_PM_SMLT_RSLT_DTL          시뮬레이션 결과 (시간 × 시설)
       │ A.PSG_FCLT_CD = B.PSG_FCLT_CD
B  PMOWN.TN_PM_SMLT_PSG_FCLT          시설 마스터 (터미널 · 상위코드 · 사용여부)
       │ B.TMNL_ID = C.TMNL_ID
       │ A.FCLT_CD = C.CKNCT_ID           ← SUBSTR(PSG_FCLT_CD, 3)
       │ A.YMD     = C.OPER_YMD
       │ A.TIME BETWEEN C.EST_BGNG_HM AND C.EST_END_HM
C  GOOWN.TI_GO_CKNCT_DALY_ALOT        일별 카운터 배정 (항공사 · 운영구간)
```

### 인라인 뷰 A — 결과에서 시간·시설코드를 파싱 (`:19-33`)

```sql
SELECT
    A.SMLT_ID,
    REPLACE(SUBSTR(A.SMLT_ACTL_DT, 0, 10), '/', '') YMD,     -- 'YYYY/MM/DD' → 'YYYYMMDD'
    REPLACE(SUBSTR(A.SMLT_ACTL_DT, 12, 5), ':', '') TIME,    -- 'HH:MI'      → 'HHMI'
    PSG_FCLT_CD,
    SUBSTR(A.PSG_FCLT_CD, 3)                                   FCLT_CD,
    SUBSTR(A.PSG_FCLT_CD, 3, 1)                                ISLAND,
    PMOWN.FN_PM_SAFE_TO_NUMBER(SUBSTR(A.PSG_FCLT_CD, 4, 2))    COUNTER_NUM,
    A.WTNG_PSG_CNT,
    A.AVG_PRCS_HR as PRCS_HR,
    A.AVG_WTNG_HR as WTNG_HR
FROM PMOWN.TN_PM_SMLT_RSLT_DTL A
WHERE A.SMLT_ID = #{smltId}
  AND A.WTNG_PSG_CNT > 0
```

> **`SMLT_ACTL_DT` 는 `TIMESTAMP(6)` 인데 `SUBSTR` 을 건다.** 암시적 `TO_CHAR` 가 걸리므로 세션 `NLS_TIMESTAMP_FORMAT` 에 결과가 달라진다. `SUBSTR(...,0,10)` 이 `2026/03/20`, `SUBSTR(...,12,5)` 가 `HH:MI` 여야 정상 동작한다. **3단계에서 신규 쿼리를 쓸 때는 `TO_CHAR(A.SMLT_ACTL_DT,'YYYYMMDD')` 로 명시하는 편이 낫다** — 다만 기존 쿼리는 수정 대상이 아니다 (2단계 범위 밖).

### 인라인 뷰 B — 시설 마스터 필터 (`:34-42`)

```sql
SELECT * FROM PMOWN.TN_PM_SMLT_PSG_FCLT B
WHERE 1 = 1
  AND B.TMNL_ID        = #{tmnlId}
  AND B.UP_PSG_FCLT_CD = 'CC'      -- 체크인카운터
  AND B.USE_YN         = 'Y'
```

이 세 줄이 **모든 시설 조회의 공통 골격**이다. `UP_PSG_FCLT_CD` 만 갈아끼우면 다른 시설군이 된다 (`CastDepMapper.xml:40` → `IN ('LGT')`, `CastSlfchknMapper.xml:51` → `IN ('CK','SBD')`).

### 인라인 뷰 C — 일별 카운터 배정 (`:43-48`)

```sql
SELECT C.TMNL_ID, C.ALN_CD, C.CKNCT_ID, C.OPER_YMD, C.EST_BGNG_HM, C.EST_END_HM
FROM GOOWN.TI_GO_CKNCT_DALY_ALOT C
WHERE C.OPER_YMD = #{ymd}
  AND C.USE_YN   = 'Y'
```

### 조인 조건 (`:49-53`) — 4개가 모두 필요하다

| 조건 | 이유 |
|---|---|
| `B.TMNL_ID = C.TMNL_ID` | 카운터 번호가 터미널별로 중복될 수 있다 |
| `A.FCLT_CD = C.CKNCT_ID` | `SUBSTR(PSG_FCLT_CD, 3)` 이 곧 `CKNCT_ID` — **② 참고** |
| `A.YMD = C.OPER_YMD` | 결과 일자와 배정 일자 일치 |
| `A.TIME BETWEEN C.EST_BGNG_HM AND C.EST_END_HM` | 그 시각에 실제로 열려 있던 배정만 |

### 이 쿼리의 한계 — 3단계에서 리뉴얼 화면에 쓰기 전에 결정해야 할 것

1. **`AND A.ISLAND = #{island}` (`:55`) 로 아일랜드 1개분만 내려준다.** 리뉴얼 화면은 터미널 전체가 필요하다 (`API_SPEC-DELTA.md` 1장). 이 조건을 `<if>` 로 감싸는 것이 최소 변경이다.
2. **`INNER JOIN` 이므로 배정이 없는 카운터는 사라진다.** 리뉴얼 블럭 차트는 "운영 부스 수"를 세야 하므로, 배정 없는 부스도 표시할지 결정해야 한다 (`LEFT JOIN` 여부).
3. **`WTNG_PSG_CNT > 0` 이므로 한산한 시간대는 행이 없다.** 24시간 축을 채우는 건 애플리케이션 책임이다.
4. **자정 넘김(RON)을 처리하지 않는다.** `A.TIME BETWEEN C.EST_BGNG_HM AND C.EST_END_HM` 는 `HHmm` 문자열 비교라 `2200~0200` 같은 구간에서 **아무 행도 안 나온다**. `CastRestMapper.xml` 은 같은 문제를 `RON_YN` 플래그로 푼다 (`:948`, `:1070`, `:1226`) — 이 쿼리에는 그 처리가 없다. ([G17](05-gaps.md))

---

## ② 시설 코드 파싱 관용구 — `PSG_FCLT_CD` 자리수 구성 규칙

**3단계에서 신규 쿼리를 쓰려면 이 절이 근거다.** 다만 아래는 전부 **SQL·Java 에서 역산한 유추**이고, `TN_PM_SMLT_PSG_FCLT` 의 실데이터로 검증해야 한다 (G11).

### 확정된 사실

| 사실 | 근거 |
|---|---|
| `PSG_FCLT_CD` 는 `VARCHAR2(8)` | `ddl.txt:8` |
| `CKNCT_ID` = [아일랜드 문자 1자] + [카운터번호 2자] = **3자** | `CastUserConfigMapper.xml:20-21`, `CastRestMapper.xml:1158` |
| 체크인카운터(`CC`)의 `SUBSTR(PSG_FCLT_CD, 3)` 이 곧 `CKNCT_ID` | `CastChknMapper.xml:24` + 조인 `:51` |
| 출국장(`LGT`)의 출국장 번호는 **4번째 자리** | `CastDepMapper.xml:36` |
| 셀프백드랍(`SBD`)의 아일랜드는 **뒤에서 3번째 자리** | `CastSlfchknMapper.xml:28` |
| 셀프체크인(`CK`)의 아일랜드는 **코드가 아니라 `SMLT_FCLT_NM` 의 뒤에서 3번째 자리** | `CastSlfchknMapper.xml:26` |
| 출국장 코드는 `T1`/`T2` 로 시작한다 | `CastSmltServiceImpl.java:287`, `:304` |

### 위 사실에서 도출한 자리수 구성 (**유추**)

| 시설군 (`UP_PSG_FCLT_CD`) | 자리 1-2 | 자리 3 | 자리 4 | 자리 5 | 예 (추정) |
|---|---|---|---|---|---|
| `CC` 체크인카운터 | 터미널 (`T1`/`T2`) | 아일랜드 문자 | 카운터번호 십의자리 | 카운터번호 일의자리 | `T1A01` |
| `LGT` 출국장 | 터미널 (`T1`/`T2`) | 구분자 1자 | 출국장 번호 | — | `T1_1` |
| `SC`/`SR` 보안검색대 | 터미널 (`T1`/`T2`) | 구분자 1자 | 검색대 종류 1자 | 검색대 번호 | `T1_S1` / `T1_R1` |
| `CK` 셀프체크인 | 미확인 | 미확인 | 미확인 | 미확인 | — (아일랜드는 `SMLT_FCLT_NM` 에서 뽑는다) |
| `SBD` 셀프백드랍 | 미확인 | 미확인 | 아일랜드는 **뒤에서 3번째** | | — |
| `LS` 랜드사이드 좌석 | 미확인 | | | | — |

**도출 근거 (`CastSmltServiceImpl.java`)** — 서비스 계층이 `PSG_FCLT_CD` 를 SQL LIKE 패턴으로 거른다.

| 위치 | 패턴 | 대상 | 읽는 법 |
|---|---|---|---|
| `:255` | `psgFcltCd.contains(island)` | `CC` | 아일랜드 문자가 코드 어딘가에 있으면 통과 (느슨함) |
| `:287` | `"T1_" + depNum + "%"` | `LGT` T1 | `T1` + 임의 1자 + 출국장번호 → **번호가 4번째 자리**. `CastDepMapper.xml:36` 과 일치 ✓ |
| `:304` | `"T2_" + depNum + "%"` | `LGT` T2 | 위와 동일 |
| `:333` | `"T1__" + scNum + "%"` | `SC`+`SR` T1 | `T1` + 임의 **2자** + 검색대번호 → **번호가 5번째 자리** |
| `:348` | `"T2__" + scNum + "%"` | `SC`+`SR` T2 | 위와 동일 |

`SC` 와 `SR` 을 **같은 패턴 하나로 함께 거른다** (`getScDatas` 는 `upPsgFcltCdList = List.of("SC","SR")` — `:324`). 그래서 4번째 자리는 두 시설군을 가르는 문자여야 하고, 그 자리를 `_` 로 비워 둔 것으로 읽힌다.

> **결정적 미확인 사항**: `StringUtils.isMatchPatternLike` 의 구현이 **레포에 없다** (`java/utils/` 자체가 없다). `_` 가 SQL LIKE 의 단일문자 와일드카드인지, 리터럴 언더스코어인지 확정할 수 없다. 위 표는 **와일드카드로 읽었을 때**의 해석이다. 리터럴이라면 `LGT` 는 `T1_1`(3번째 자리가 실제 `_`)이 되고 `SC` 는 `T1__1`(연속 언더스코어 2개)이 되는데 후자가 부자연스러워 와일드카드 해석을 택했다. **3단계 착수 전 실데이터 `SELECT DISTINCT PSG_FCLT_CD, UP_PSG_FCLT_CD FROM PMOWN.TN_PM_SMLT_PSG_FCLT` 로 확정할 것.** (G11)

### 파싱 SQL 원문

```sql
-- 체크인카운터 (CastChknMapper.xml:24-26)
SUBSTR(A.PSG_FCLT_CD, 3)                                 FCLT_CD,      -- = CKNCT_ID
SUBSTR(A.PSG_FCLT_CD, 3, 1)                              ISLAND,       -- 아일랜드 문자
PMOWN.FN_PM_SAFE_TO_NUMBER(SUBSTR(A.PSG_FCLT_CD, 4, 2))  COUNTER_NUM,  -- 카운터 번호

-- 출국장 (CastDepMapper.xml:36)
SUBSTR(PSG_FCLT_CD, 4, 1) AS DEP_NUM,

-- 셀프백드랍 (CastSlfchknMapper.xml:28)
SUBSTR(B.PSG_FCLT_CD, -3, 1) AS ISLAND,

-- 셀프체크인 — 코드가 아니라 시설명에서 (CastSlfchknMapper.xml:26)
SUBSTR(B.SMLT_FCLT_NM, -3, 1) AS ISLAND,

-- 체크인카운터 ID (CastUserConfigMapper.xml:20-21)
SUBSTR(CKNCT_ID, 0, 1)                                   AS ISLAND,      -- Oracle: 0 은 1 과 같다
PMOWN.FN_PM_SAFE_TO_NUMBER(SUBSTR(A.CKNCT_ID, 2, 2))     AS COUNTER_NUM
```

### 관련 상수 — 화면이 도는 축

`CastSmltServiceImpl.java:58-62` 에 하드코딩되어 있다. **테이블에서 오지 않는다.**

| 상수 | 값 | 개수 |
|---|---|---|
| `islandList` | `A B C D E F G H J K L M N` (**`I` 제외**) | 13 |
| `depT1List` | `1`~`6` | 6 |
| `depT2List` | `1`~`2` | 2 |
| `scT1List` | `1`~`6` | 6 |
| `scT2List` | `1`~`2` | 2 |

리뉴얼 `API_SPEC-DELTA.md` 2.1 의 `islandList[].island` (`A`~`N`, `I` 제외)와 정확히 일치한다. 다만 **아일랜드가 T1/T2 공통 13개로 하드코딩**되어 있어, 실제로 터미널별 아일랜드 집합이 다르면 어긋난다. `TN_CA_CKNCT` 나 `TN_PM_SMLT_PSG_FCLT` 에서 유도하는 편이 옳다.

---

## ③ 시간 구간 매칭

```sql
AND A.TIME BETWEEN C.EST_BGNG_HM AND C.EST_END_HM     -- CastChknMapper.xml:53
```

- 양쪽 다 **`HHmm` 4자리 문자열**이다. 문자열 비교라 `'0900' <= '1200'` 은 맞게 동작한다.
- **자정 넘김이 깨진다.** `EST_BGNG_HM='2200'`, `EST_END_HM='0200'` 이면 `BETWEEN` 이 항상 거짓이다.
- `CastRestMapper.xml` 계열은 같은 문제를 명시적으로 처리한다:

```sql
-- CastRestMapper.xml:948
CASE WHEN TO_NUMBER(Y.STA_HM) <= TO_NUMBER(Y.END_HM) THEN 'N' ELSE 'Y' END AS RON_YN
-- 그 다음 RON_YN='Y' 면 종료일자를 +1 한다 (:936-938)
CASE WHEN Y.RON_YN = 'N' THEN Y.OPR_DT
     ELSE TO_CHAR(TO_DATE(Y.OPR_DT, 'YYYYMMDD') + 1, 'YYYYMMDD')
END || Y.END_HM
```

**3단계 신규 쿼리는 `RON_YN` 패턴을 따라야 한다.** 리뉴얼 화면의 `oprTimeList` 도 `endHour`가 `bgnHour`보다 작은 구간을 허용하는지 결정해야 한다.

---

## ④ 시설 계층 — `UP_PSG_FCLT_CD` 자기참조

`TN_PM_SMLT_PSG_FCLT.UP_PSG_FCLT_CD` 가 상위 시설을 가리킨다. 상위 코드값과 의미:

| 코드 | 의미 | 사용처 |
|---|---|---|
| `LS` | 랜드사이드 좌석 | `PEAK_PSG` 집계 |
| `CC` | 체크인카운터 | **체크인 카운터 탭** (`CastChknMapper.xml:39`) |
| `CK` | 셀프체크인 (키오스크) | **체크인 카운터 탭** 드로어 (`CastSlfchknMapper.xml:51`) |
| `SBD` | 셀프백드랍 | **체크인 카운터 탭** 드로어 (`CastSlfchknMapper.xml:51`) |
| `LGT` | 출국장 | **출국장 탭** (`CastDepMapper.xml:40`) |
| `LC` | 출국심사 | 코드 목록에만 등장. 조회 코드에서는 안 쓴다 |
| `SC` | 보안검색대 | **출국장 탭** 보조 차트 |
| `SR` | 보안검색대 RED | **출국장 탭** 보조 차트 (`SC` 와 함께) |

- 근거: `CastSmltMapper.xml:58` 주석 (8개 전부 — `LC` 포함), `CastSmltServiceImpl.java:206` 주석 (7개 — **`LC` 누락**). 두 주석이 어긋난다.
- `CastSlfchknMapper.xml:20-23` 은 `CK` 를 `'KIOSK'` 로 리라벨한다 → `SlfType` enum 값 `KIOSK` / `SBD` 와 대응.
- **혼잡도 타입별 시설군 묶음** (`CastSmltServiceImpl.java:207-225`):

| `CongestionType` | `UP_PSG_FCLT_CD` 목록 |
|---|---|
| `PEAK_PSG` | `LS`, `CC`, `CK`, `SBD`, `LGT`, `SC`, `SR` (전체) |
| `PEAK_CHKN` | `LS`, `CC`, `CK`, `SBD` |
| `PEAK_DEP` | `LGT` |
| `PEAK_SC` | `SC`, `SR` |

- xovis 센서 쪽은 다른 코드 체계다 (`TN_PM_PSG_WTNG_INFO.FCLT_TYPE_CD`, `CastSmltServiceImpl.java:185-196`):

| `FCLT_TYPE_CD` | 의미 | 대응 `UP_PSG_FCLT_CD` |
|---|---|---|
| `Queue` | 체크인카운터 줄 | `CC` |
| `DG` | 출국장 | `LGT` |
| `SC` | 보안검색대 | `SC`/`SR` |

---

## ⑤ SQL 에서 enum 을 만드는 방식 — 코드값 ↔ enum 대응표

`CastSmltMapper.retrievePrcsGrd` (`CastSmltMapper.xml:93-110`) 가 `CASE WHEN` 으로 코드값을 enum 이름 문자열로 바꿔 내려주고, MyBatis 가 그대로 `CongestionStatus` 에 바인딩한다.

```sql
SELECT
    CASE
        WHEN PSG_PRCS_GRD_CD = '01' THEN 'FREE'
        WHEN PSG_PRCS_GRD_CD = '02' THEN 'NORMAL'
        WHEN PSG_PRCS_GRD_CD = '03' THEN 'BUSY'
        WHEN PSG_PRCS_GRD_CD = '04' THEN 'VERY_BUSY'
    END CGN_STATUS,
    MIN_VL, MAX_VL
FROM PMOWN.TN_PM_PSG_PRCS_GRD
WHERE FCLT_GROUP_CD = #{psgPrcsGrdCd}
ORDER BY PSG_PRCS_GRD_CD
```

### `PSG_PRCS_GRD_CD` ↔ `CongestionStatus` (혼잡등급)

| `PSG_PRCS_GRD_CD` | enum 상수 | 근거 |
|---|---|---|
| `'01'` | `CongestionStatus.FREE` | `CastSmltMapper.xml:97-98`, `CongestionStatus.java:8` |
| `'02'` | `CongestionStatus.NORMAL` | `:99-100`, `CongestionStatus.java:9` |
| `'03'` | `CongestionStatus.BUSY` | `:101-102`, `CongestionStatus.java:10` |
| `'04'` | `CongestionStatus.VERY_BUSY` | `:103-104`, `CongestionStatus.java:11` |

- `CASE` 에 `ELSE` 가 없다. `PSG_PRCS_GRD_CD` 가 `'05'` 이상이면 `CGN_STATUS` 가 `NULL` 이 되고, `CastSmltServiceImpl.java:388` 의 `Collectors.toMap(PsgPrcsGrd::getCgnStatus, ...)` 에서 **`NullPointerException`** 이 난다.
- `MIN_VL` / `MAX_VL` 은 대기인원 임계값이다 (`PsgPrcsGrd.java` — `int minVl`, `int maxVl`).

### `FCLT_GROUP_CD` ↔ `PrcsGrdType` (시설군)

`WHERE FCLT_GROUP_CD = #{psgPrcsGrdCd}` 의 값은 `CastSmltServiceImpl.retrievePrcsGrdMap` 이 만든다 (`:377-385`).

| `FCLT_GROUP_CD` | `PrcsGrdType` | 실제 의미 | `PrcsGrdType.java` 주석 |
|---|---|---|---|
| `'01'` | `SLFCHKN` | 셀프체크인 | `// 체크인` ← **주석이 틀렸다** |
| `'02'` | `CHKN` | 체크인 | `// 셀프체크인` ← **주석이 틀렸다** |
| `'03'` | `DEP` | 출국장 | `// 출국장` ✓ |
| `'04'` | `SC` | 보안검색대 | `// 보안검색대` ✓ |

`PrcsGrdType.java:6-7` 의 두 주석이 서로 뒤바뀌어 있다. enum 상수명 자체는 옳다 (G6 확장).

### `SlfType` (셀프서비스 종류)

| SQL 산출값 | enum | 근거 |
|---|---|---|
| `'KIOSK'` (`UP_PSG_FCLT_CD = 'CK'` 일 때) | `SlfType.KIOSK` | `CastSlfchknMapper.xml:20-22` |
| `'SBD'` (그 외, 즉 `UP_PSG_FCLT_CD` 원값) | `SlfType.SBD` | `CastSlfchknMapper.xml:22` |

`ELSE B.UP_PSG_FCLT_CD` 이므로 `IN ('CK','SBD')` 필터(`:51`)가 없으면 enum 에 없는 값이 흘러들어온다.

### 기타 코드값 ↔ 문자열 변환 (CAST 연동)

| 컬럼 | 코드 | 변환 결과 | 근거 (`CastRestMapper.xml`) |
|---|---|---|---|
| `SMLT_MDL_TYPE_CD` | `'1'` / `'2'` | `CASTModel` / `CASTExpressModel` | `:36`, `:49` |
| `GD_IRR_YN` | `'0','N'` / `'1','Y'` | `Schedule` / `Charter` | `:323-324` |
| `DOM_INT_SE_CD` | `'I'` / `'D'` | `Int` / `Dom` | `:266-268` |
| `LCC_YN` | `'Y'` / 그 외 | `LCC` / `FSC` | `:673-674` |
| `CHKIN_TY_CD` | `'C'` / `'D'` | 공용(항공사 목록) / 전용(대표편명) | `:908-923` |
| `EMIG_TYPE_CD` / `IMMIG_TYPE_CD` | `'1'` / `'2'` | `Normal` / `Automatic` | `:2016`, `:2048` |
| `FCLTY_TYPE_ID` | `'W'` / `'E'` | `West` / `East` | `:1942-1946`, `:2104` |
| `PSG_FIX_PARA_CND_TYPE_CD` | `'01'`~`'04'` | `Simple Shares` / `Reporting Profile` / `Case of (multiple)` / `Shares` | `:1295` |
| `CKNCT_USE_CRG_APLCN_TYPE_CD` | `'A'`,`'B'` / `'H'` | 유인 카운터 / 셀프백드랍 | `:999`, `:1184` |
| `OPER_HR_STTS_CD` | `'DPL'` | 배포됨 (이 값만 사용) | `:1985` |

---

## ⑥ MyBatis 관용구

7개 XML 전체에서 지켜지는 규칙이다. **3·4단계 신규 XML 도 이대로 쓴다.**

1. **statement 첫 줄에 트레이스 주석** `/* XxxMapper.methodName */` — 예외 없이 전부 있다. 다만 3곳이 잘못 적혀 있다 (G6).
2. **동적 SQL 은 `WHERE 1 = 1` + `<if test="x != null and x != ''">`**
   ```xml
   WHERE 1 = 1
   <if test="smltId != null and smltId != ''">
       AND SMLT_ID = #{smltId}
   </if>
   ```
   (`CastSmltMapper.xml:14-23`)
3. **`<where>` / `<trim>` / `<choose>` 를 쓰지 않는다.** — **예외 1건**: `CastRestMapper.xml:1826-1836` `retrieveAtchFileList` 만 `<where>` 를 쓴다. 하우스 스타일에서 벗어난 유일한 지점이다 (G10).
4. **`IN` 은 `<foreach>`**
   ```xml
   AND B.UP_PSG_FCLT_CD IN (<foreach collection="upPsgFcltCdList" item="item" separator=",">#{item}</foreach>)
   ```
   (`CastSmltMapper.xml:59`, `:84`). **빈 리스트면 `IN ()` 이 되어 `ORA-00936`** — 호출 전 비어 있지 않음을 보장해야 한다.
5. **벌크 INSERT 도 `<foreach>`** — `INSERT ALL` 이 아니라 `VALUES (...),(...)` 다중행 형태 (`CastRestMapper.xml:1663-1688`). Oracle 은 이 문법을 **지원하지 않는다** — `INSERT ALL ... SELECT * FROM DUAL` 이 필요하다. **실행 시 실패 후보** ([G18](05-gaps.md)).
6. **LIKE 는 `LIKE #{dt} || '%'`** (Oracle 연결 연산자, `CastSmltMapper.xml:62`, `:66`, `:81`). 이스케이프 처리가 없으므로 파라미터에 `%`/`_` 가 들어가면 의도치 않게 넓게 잡힌다.
7. **`<resultMap>` 이 한 개도 없다.** 컬럼→필드 매핑은 전적으로 `map-underscore-to-camel-case` + SELECT 별칭에 의존한다. 별칭 실수는 예외가 아니라 **조용한 `null`** 이다 (G5).
8. **항상 `#{}`, `${}` 미사용** — 7개 XML 전체에서 `${` 가 0건이다. SQL 인젝션 표면이 없다.
9. **`parameterType` 생략 빈번** — `@Param` 여러 개를 받는 statement 는 `parameterType` 을 안 쓴다 (`CastChknMapper.xml:5`).
10. **`resultType` 은 항상 DTO FQCN 또는 `String`.** `Map` 반환 없음.

---

## ⑦ Oracle 전용 구문

`CastRestMapper.xml` 에 집중되어 있다.

### `LISTAGG` — **119회**

```sql
LISTAGG(NVL(X.domStatus, ' '), ',') WITHIN GROUP (ORDER BY X.DomStatus, X.FlightDirection, ...) AS domStatus
```

- 결과셋을 **콤마 문자열 한 줄로 평탄화**한다. 이것이 **CAST 엔진 리소스 파일 포맷**이다 — CAST 는 컬럼별로 값이 콤마로 이어진 텍스트를 받는다.
- 그래서 `retrieveFlightSchedule` 같은 statement 는 **행 1개**를 반환한다. DTO 필드도 전부 `String` 이다.
- `NVL(..., ' ')` 로 NULL 을 공백 1자로 채워 **컬럼 간 원소 개수를 맞춘다.** 이게 깨지면 CAST 쪽에서 열이 어긋난다.
- 값 자체에 콤마가 들어가면 `"` 로 감싼다 (`:911`, `:1077`, `:1201`, `:2047`).
- **`LISTAGG` 는 결과가 4000바이트(VARCHAR2 한계)를 넘으면 `ORA-01489` 로 죽는다.** 운항편이 많은 날 `retrieveFlightSchedule` 이 터질 수 있다 — `ON OVERFLOW TRUNCATE` 절이 119회 중 **0회**다. ([G19](05-gaps.md))

### 그 외

| 구문 | 용례 | 근거 |
|---|---|---|
| `WITH` CTE | `retrieveFlightSchedule` 에 16개 CTE 체인 | `:260-730` |
| `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)` | 대표값 1건 뽑기 (`RN = 1`) | `:434-437`, `:473-476`, `:557-560`, `:569-572` |
| `CONNECT BY` + `REGEXP_SUBSTR(..., '[^,]+', 1, LEVEL)` | 콤마 문자열 → 행 분해 | `:1131`, `:1140` |
| `ROWNUM = 1` | 1건 제한 | `:61`, `:85`, `:109` |
| `NVL` / `COALESCE` / `NULLIF` / `DECODE` | 기본값·분기 | 전역 |
| `SYSDATE`, `ADD_MONTHS`, `TO_CHAR`, `TO_DATE`, `TO_NUMBER` | 날짜 산술 | 전역 |
| `FROM DUAL` | 상수행 | `:221`, `:1551`, `:1707` |
| `\|\|` | 문자열 연결 | 전역 |
| `<시퀀스>.NEXTVAL` | 채번 | `:1550`, `:1795` |
| `DBMS_RANDOM.VALUE` | tie-break 랜덤 정렬 | `:436`, `:475`, `:559` |
| `REGEXP_REPLACE(#{resourceID},'A\|B','')` | 리소스 ID 접두 제거 | `:1921`, `:1935`, `:1971` |
| `LPAD` + `REGEXP_SUBSTR` | 스탠드/게이트 번호 3자리 정규화 | `:682-685` |
| 다중 컬럼 `IN` 서브쿼리 `(A,B,C) IN (SELECT ...)` | 최신 운영시간 세트 선택 | `:1988-2004` |

> `DBMS_RANDOM.VALUE` 로 tie-break 를 하면 **같은 입력에 대해 결과가 매번 달라진다.** 시뮬레이션 재현성이 필요하면 문제가 된다 ([G20](05-gaps.md)).

---

## ⑧ 유효 운항편 필터 — 항상 함께 붙는 8개 조건

운항 데이터를 읽을 때는 예외 없이 이 세트가 붙는다. 신규 쿼리에서 빠뜨리면 화물기·회항편·취소편이 섞인다.

**`PMOWN.DROP_AA_TN_AS_GD_DATA` 판** (`CastRestMapper.xml:330-337`)

```sql
AND A.CSHR_STAT_CD  != 'SL'              -- 취소(Slot cancel) 제외
AND A.DLY_RSN_CD  NOT IN ('2', '3')      -- 특정 지연사유 제외
AND A.TER_ID      IN ('P','P01','P02','P03')
AND A.AC_USE_SE_CD  = '0'                -- 항공기 사용구분
AND A.GD_FLT_PPS_CD IN ('00', '05')      -- 운항목적: 정기/부정기 여객
AND A.PAX_CGO_SE_CD = 'Y'                -- 여객편만 (화물 제외)
AND A.FRY_YN        = 'N'                -- 페리편 제외
AND A.LCRFT_YN      = 'N'                -- 경항공기 제외
```

**`GOOWN.TN_GO_GD_DATA` 판** (`CastSmltMapper.xml:32-39`) — 같은 의미, 다른 컬럼명

```sql
AND ARR_DEP_SE_CD    = 'D'               -- 출발편만
AND CSHR_STTS_CD    != 'SL'
AND PSG_CGO_SE_CD    = 'Y'
AND ARCFT_USE_SE_CD IN ('0', '1')        -- ← DROP 판은 '0' 만. 어긋난다
AND GD_FLT_PRPS_CD  IN ('00', '05')
AND FRY_YN       NOT IN ('Y')
AND DOM_INTL_SE_CD NOT IN ('D')          -- 국내선 제외
AND DLY_RSN_CD   NOT IN ('2', '3')
```

두 판의 `항공기사용구분` 조건이 다르다(`'0'` vs `'0','1'`). 같은 날 같은 터미널을 두 테이블로 세면 **운항편 수가 다르게 나온다** (G16).

---

## ⑨ 여객수 산출 규칙

리뉴얼 `운항편/여객수` 탭이 그대로 쓴다.

**요약 (터미널 합계)** — `CastSmltMapper.xml:28`

```sql
SELECT COUNT(*) as FLT_CNT,
       SUM(RSVT_BDPSG_CNT - RSVT_TRNS_BDPSG_CNT) as PSG_CNT
FROM GOOWN.TN_GO_GD_DATA
```

**여객수 = 예약탑승객 − 예약환승객** (순수 출발 여객).

**편별 (CAST 리소스용 fallback 체인)** — `CastRestMapper.xml:604-615`

```
1) INPUT_YN='Y' 이고 (유상+무상+환승) 이 1~1000  →  TOT_CRG_PAX_CNT + TOT_FREE_PAX_CNT + TOT_TRPAX_CNT
2) INPUT_YN='N' 이고 RSRV_PAX_CNT != 0          →  RSRV_PAX_CNT
3) 그 외 → COALESCE(
       최근 3개월 같은 편명 평균 (PAST_PAX_AVG.AVG_PAX_BY_FLT),
       최근 3개월 같은 항공사 평균 (AVG_PAX_BY_ALN),
       ROUND(NVL(AC_SEAT_CNT, 200) * 0.75)     -- 좌석수의 75%, 좌석수도 없으면 200석 가정
   )
```

환승객은 전체 승객보다 클 수 없게 잘라 준다 (`:689-692`).

> `AVG_PAX_BY_FLT` 와 `AVG_PAX_BY_ALN` 이 **완전히 같은 식**이다 (`:509-522`). 편명별/항공사별로 다른 값을 의도했으나 둘 다 `GROUP BY CLOSING_FLT_NM, ALN_CD` 결과라 항상 같다. fallback 2단계가 사실상 1단계다. ([G21](05-gaps.md))
