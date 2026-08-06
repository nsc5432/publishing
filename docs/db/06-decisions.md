# 5.6 결정 로그 — 3단계(조회 API) 착수 시 확정한 사항

← [DB-ANALYSIS.md](DB-ANALYSIS.md)

2단계가 [05-gaps.md](05-gaps.md) 로 넘긴 결정 항목 중 **3단계 조회 API 를 구현하려면 지금 답이 있어야 하는 것**들을 여기서 확정했다.
결정 근거와 함께 **틀렸을 때 어디를 고치면 되는지**를 같이 적는다.

- 지시서: [`docs/tasks/03-api-implementation-part1.md`](../tasks/03-api-implementation-part1.md)
- **DB 에 접속하지 않았다.** 실데이터 검증이 필요한 항목은 아래에 그대로 표시했다.

## 요약

| # | 결정 | 상태 | 뒤집을 때 고칠 곳 |
|---|---|---|---|
| D1 (G2) | 터미널 코드 변환은 `TerminalKind` enum **한 곳**에서만 | 확정 | `enums/TerminalKind.java` |
| D2 (G7) | 시간대별 부스 수·검색대 대수는 **운영시간 구간을 시간축으로 펼쳐 계산** (선택지 1) | 확정 (조회 한정) | `CastChknServiceImpl.getOprBoothCntList` · `CastDepServiceImpl.getOprScCntList` |
| D3 (G14) | `_HR` 컬럼은 **초**. 분 환산은 `CastSmltServiceImpl.SEC_PER_MIN` 한 곳 | 확정 (근거 있음) | `CastSmltServiceImpl.SEC_PER_MIN` |
| D4 | 대기 꺾은선·KPI 의 출처는 **직전 시뮬레이션 결과**(`TN_PM_SMLT_RSLT_DTL`) | 확정 | `CastSmltMapper.retrieveWaitPsgList` / `retrieveSmltKpiRaw` |
| D5 | `p95WaitMin` 은 **결과 상세 행 분포의 95백분위**로 근사 | 잠정 — 벤더 확인 필요 | `CastSmltMapper.xml` `retrieveSmltKpiRaw` |
| D6 | `utilRate` = 운영 시설·시간 합 / (전체 시설 수 × 24) | 잠정 — 현업 확인 필요 | 각 `ServiceImpl.getUtilRate` |
| D7 | 원천이 없는 필드(`customYn`·`normalCnt`·`smartPassCnt`·`adjType`·`adjRate`)는 **기본값으로 내려준다** | 확정 | 각 `ServiceImpl` 의 해당 setter |
| D8 | 24시간 버킷 유틸 위치는 `aoms.pm.utils.TimeBucketUtils` (`java/utils/`) | 확정 | — |
| D9 | 리뉴얼 3탭 컨트롤러는 `/cast/user-smlt` 신규, 서비스는 **기존 도메인 확장** | 확정 | — |

---

## D1 (G2) — 터미널 코드 변환 지점

**결정**: `aoms.pm.cast.enums.TerminalKind` 를 신설하고, 변환을 **이 enum 안에서만** 한다.

```java
public enum TerminalKind {
	T1("T1"), T2("T2");

	public String getFcltTmnlId()          // 시설계  : T1 → P01, T2 → P03
	public List<String> getFltTmnlIdList() // 운항편계 : T1 → [P01, P02], T2 → [P03]
}
```

- 모든 `...SearchDto` 의 `tmnlId` 필드 타입이 `TerminalKind` 다. Jackson 이 `@JsonValue` 로 `"T1"`/`"T2"` 를 그대로 역직렬화하고, 응답 시 다시 `"T1"`/`"T2"` 로 직렬화한다 → **역변환이 자동**이다.
- 서비스·매퍼·XML 은 `P0x` 만 다룬다. `P0x` 문자열 리터럴은 이 enum 밖에 없다.

**왜 시설계와 운항편계를 나눴나**

2단계 G2 가 찾은 두 사실이 실제로 다르기 때문이다.

| 계통 | 근거 | 동작 |
|---|---|---|
| 운항편·여객수 | `CastSmltServiceImpl.java:159-176` — `P01 + P02` 를 T1 로 합산 | 탑승동 **포함** |
| 체크인·출국장·검색대 | `CastSmltServiceImpl.java:88-92`, `:106-110` — `P01`·`P03` 만 조회 | 탑승동 **미포함** |

즉 현행 동작을 그대로 보존한다. **"탑승동 체크인카운터가 T1 화면에 나와야 하는가"는 여전히 현업 확인 대상**이며, 답이 "나와야 한다"이면 `getFcltTmnlId()` 를 `getFcltTmnlIdList()` 로 바꾸고 매퍼 파라미터를 `<foreach>` 로 여는 것이 전부다.

**남는 문제** (3단계 범위 밖): `DROP_AA_TN_AS_GD_DATA.TER_ID` 의 네 번째 값 `'P'` 는 여전히 미확인. `insertSimSet` 의 `'P01'` 하드코딩(`CastRestMapper.xml:1610`)은 4단계 대상이다.

---

## D2 (G7) — 시간대별 부스 수 / 검색대 대수의 데이터 소스

**결정**: 지시서 5.5 의 **선택지 1**(기존 배정 테이블의 운영시간 구간을 시간대로 펼쳐 계산). 신규 테이블 없이 3단계 조회를 완결한다.

### 체크인 부스

| 값 | 산출 |
|---|---|
| 아일랜드별 부스 목록·운영시간 | `GOOWN.TI_GO_CKNCT_DALY_ALOT` — 기존 `CastUserConfigMapper.retrieveChknList` **재사용** (`EST_BGNG_HM`/`EST_END_HM` → 시 단위 구간, `SmltUtils.mergeTimeRanges` 로 병합) |
| `islandList[].boothCnt` | 그 아일랜드에 그날 배정된 카운터 수 = 부스 목록 길이 |
| `totCnt` | `CAOWN.TN_CA_CKNCT` 의 터미널 보유 카운터 수 (`CKNCT_USE_CRG_APLCN_TYPE_CD IN ('A','B')`) |
| `peakCounterCnt` | 시간대 h 마다 `Σ (그 시각 운영 중인 아일랜드의 boothCnt)` 의 최댓값 |

`boothCnt`(배정 기준)와 `totCnt`(보유 기준)를 **다른 테이블에서 뽑는다**. DELTA 2.1 이 "현재 화면은 부스 목록 길이를 그대로 쓴다"고 적었으므로 화면 계산식과 일치한다.

### 검색대

| 값 | 산출 |
|---|---|
| `depList[].scCnt` | `..._SCRTY_CNTRL_ATRB.FCLTY_CNT` (`GATE_NO` = 출국장 번호) |
| `depList[].planList[]` | **구간 1개**. 그 출국장의 운영시간 전체를 덮고 `scCnt` 를 그대로 싣는다 (`planSn = 1`) |
| `peakScCnt` | 시간대 h 마다 `Σ (그 시각 운영 중인 출국장의 scCnt)` 의 최댓값 |

**`FCLTY_CNT` 는 시간축이 없는 단일 값이다.** 그래서 조회는 구간 1개만 만들 수 있고, 화면의 다구간 편집(`+ 행 추가`)은 **저장할 곳이 없다**. 4단계에서 선택지 2(신규 테이블)를 반드시 확보해야 한다.

### 4단계로 넘기는 DDL 초안 (선택지 2)

```sql
CREATE TABLE "PMOWN"."TN_PM_SMLT_SC_PLAN"
 (
    "SMLT_ID"           VARCHAR2(8)  NOT NULL,   -- 시뮬레이션아이디
    "TMNL_ID"           VARCHAR2(4)  NOT NULL,   -- 터미널아이디 (P01/P02/P03)
    "DEP_NUM"           VARCHAR2(2)  NOT NULL,   -- 출국장번호
    "PLAN_SN"           NUMBER(3,0)  NOT NULL,   -- 계획일련번호
    "OPER_BGNG_HR"      NUMBER(2,0),             -- 운영시작시 (0~24)
    "OPER_END_HR"       NUMBER(2,0),             -- 운영종료시 (0~24)
    "SCRTY_CNTRL_CNT"   NUMBER(3,0),             -- 보안검색대수
    "NRML_CNT"          NUMBER(3,0),             -- 일반검색대수
    "SMART_PASS_CNT"    NUMBER(3,0),             -- 스마트패스검색대수
    "FRST_RGTR_ID"      VARCHAR2(40),
    "FRST_RGTR_IP_ADDR" VARCHAR2(23),
    "FRST_REG_DT"       TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "LAST_MDFR_ID"      VARCHAR2(40),
    "LAST_MDFR_IP_ADDR" VARCHAR2(23),
    "LAST_MDFCN_DT"     TIMESTAMP(6),
    CONSTRAINT "TN_PM_SMLT_SC_PLAN_PK" PRIMARY KEY ("SMLT_ID", "TMNL_ID", "DEP_NUM", "PLAN_SN")
 );
```

- 감사 컬럼 6종·`SQ1_<TABLE>` 규칙은 [02-naming-convention.md](02-naming-convention.md) 를 따랐다.
- `NRML_CNT` / `SMART_PASS_CNT` 를 여기에 두면 D7 의 `normalCnt`/`smartPassCnt` 도 같이 해소된다.
- **DBA 승인 필요.** 승인 전에는 3단계 조회(구간 1개)까지만 동작한다.

---

## D3 (G14) — `_HR` 컬럼의 단위

**결정**: **초**로 읽고, 화면 표시용 분 환산을 `CastSmltServiceImpl.SEC_PER_MIN` **한 곳**에서 한다.

**근거**: 현행 명세가 이미 초로 적고 있다 — `API_SPEC.md` 5.2 `stat.wtngHr` / `stat.prcsHr` = "대기시간(초) / 처리시간(초)". 2단계가 지적한 `NUMBER(5,0)` 자릿수(최대 99999)와도 모순되지 않는다.

**틀렸을 때**: `SEC_PER_MIN` 상수 하나만 고치면 `avgWaitMin` · `p95WaitMin` 이 함께 따라온다. 실데이터 분포 확인은 여전히 **DBA + CAST 벤더 확인** 대상이다.

---

## D4 — 대기 꺾은선 · KPI 의 출처

**결정**: **직전 시뮬레이션 결과**(`PMOWN.TN_PM_SMLT_RSLT_DTL`). 실시간 재계산 API 는 만들지 않는다.

| 선택지 | 채택 여부 | 사유 |
|---|---|---|
| ① 직전 시뮬레이션 결과 | **채택** | 데이터가 실재하고 `smltId` 로 바로 잡힌다 |
| ② 조건 변경 시 서버 재계산 | 기각 | 재계산 엔진 호출은 4단계 `execute*` 범위다. 조회 API 가 시뮬레이션을 돌릴 수는 없다 |
| ③ 저장 전에는 공란 | 부분 채택 | 미수행 상태에서는 ①이 빈 결과가 되고, 그 경우 **24시간 축이 전부 0** 으로 내려간다 |

- xovis 실측(`WTNG_LINE_LEN`)은 **쓰지 않는다.** G16(b) 대로 그것은 "대기줄 길이"지 "인원수"가 아니다.
- 미수행 상태의 표시값은 `API_SPEC.md` 1장 규약("조회 결과가 없으면 숫자 `0`")을 따라 **0** 이다. 화면에서 `0` 과 "미수행"을 구분해야 하면 별도 플래그가 필요하다 — **현업 확인 대상**.

---

## D5 — `p95WaitMin`

**결정**: `PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY AVG_WTNG_HR)` — **결과 상세 행 분포의 95백분위**로 근사한다.

- 테이블에는 `MIN_`/`AVG_`/`MAX_` 3종뿐이라 진짜 P95(여객 단위)를 담은 컬럼이 없다 (`ddl.txt:15-17`).
- 위 식은 **"시각 × 시설" 행들의 평균대기시간 분포**에 대한 P95 다. 여객 단위 P95 와 값이 다르다.
- **CAST 벤더 확인 대상**: 엔진이 여객 단위 P95 를 산출한다면 `TN_PM_SMLT_RSLT_DTL` 에 컬럼을 추가하고 이 식을 그 컬럼 참조로 바꾼다.

---

## D6 — `utilRate` (가동률)

**결정**: 분모·분자를 아래로 정의한다. 정의 자체가 문서에 없었으므로 여기서 만든다.

| 탭 | 분자 | 분모 |
|---|---|---|
| 체크인 카운터 | Σ(시간대별 운영 부스 수) | 전체 카운터 수 × 24 |
| 출국장 | Σ(시간대별 운영 출국장 수) | 전체 출국장 수 × 24 |

"하루 24시간 동안 보유 설비를 얼마나 열어 두었는가"다. **여객 처리량 기준 가동률이 필요하면 정의가 달라진다 — 현업 확인 대상.**

---

## D7 — 원천이 없는 필드의 기본값

`API_SPEC.md` 1장 규약("조회 결과가 없으면 목록은 `[]`, 단건은 숫자 `0` / 문자 `''`")을 따른다. **필드를 빼지 않는다** — 계약을 유지해야 4단계에서 값만 채우면 된다.

| 필드 | 값 | 없는 이유 | 해소 시점 |
|---|---|---|---|
| `boothList[].customYn` | `'N'` | Custom 배정 플래그 컬럼이 없다 (04-screen-table-mapping 2.4) | 4단계 — 컬럼 신설 |
| `depList[].normalCnt` / `smartPassCnt` | `0` | `..._SCRTY_CNTRL_ATRB` 에 종류 컬럼이 없다 (3.3) | 4단계 — D2 의 DDL 초안 |
| `adjType` / `adjRate` / `hourList[].adjRate` | `RATIO` / `0` | 운항편 조정 비율을 담을 컬럼이 없다 (1장) | 4단계 |
| `depList[].oprYn` | 마스터 `TN_PM_SMLT_PSG_FCLT.USE_YN` | 시뮬레이션 단위 사용여부 테이블이 없다 (3.1) | 4단계 |

> `oprYn` 만 기본값이 아니라 **마스터 값**이다. 의미가 다르다는 것을 알고 쓴다 — `USE_YN` 은 "시설이 존재·사용중인가"고 화면의 `oprYn` 은 "이번 시뮬레이션에서 쓸 것인가"다. **시뮬레이션 조건을 마스터에 쓰면 안 되므로 4단계 저장은 반드시 별도 테이블이어야 한다.**

---

## D8 — 24시간 버킷 공통 유틸의 위치

**결정**: `aoms.pm.utils.TimeBucketUtils` — 레포 경로 **`java/utils/TimeBucketUtils.java`**.

- `SmltUtils` · `DateUtils` · `StringUtils` · `ResponseUtils` 와 같은 패키지다(`aoms.pm.utils`). 실제 프로젝트 경로는 `src/main/java/aoms/pm/utils/`.
- 이 레포에는 `java/utils/` 폴더가 없었다. `java/cast/{...}` 가 `aoms.pm.cast.{...}` 를 미러하는 규칙 그대로 **`java/utils/` = `aoms.pm.utils`** 로 신설했다.
- 기존 `SmltUtils` 에 메서드를 얹지 않은 이유: 그 파일이 레포에 없어서 편집하면 원본을 덮어쓴다.

**제공 메서드**

| 메서드 | 용도 |
|---|---|
| `hourList()` | `"00"`~`"23"` 24개 |
| `bucketList()` | `"0000"`~`"2330"` 48개 |
| `bucketList(String hour)` | 지정한 시의 `HH00` / `HH30` |
| `<T extends AggData> groupByBucket(List<T>)` | 48개 버킷 `TreeMap` — 없는 버킷은 빈 목록 |

**정리한 곳**: `CastChknServiceImpl` · `CastDepServiceImpl` · `CastSlfchknServiceImpl` 은 `groupByBucket` 으로, `CastSmltServiceImpl.retrieveSmltSmryMap` 은 `hourList()` + `bucketList(hour)` 로 바꿨다. 4개 파일에 복붙되어 있던 루프가 사라졌다.

`groupByBucket` 은 `time == null` 인 원소를 버린다. 기존 `filter(x -> x.getTime().equals(tm00))` 과 결과가 같고 NPE 만 없앤다 — `CastSmltServiceImpl.depGrouping()` 의 T2 분기가 `setTime` 을 빠뜨리는 결함(05-gaps 5.6)이 **아직 살아 있기 때문에** 그렇게 했다. 그 결함을 고치면 맵형태보기 화면의 출력이 바뀌므로 3단계 범위(기존 4개 화면 변경 금지) 밖으로 두었다.

---

## D9 — 컨트롤러·서비스 배치

**결정**

| 계층 | 결정 | 사유 |
|---|---|---|
| 컨트롤러 | `CastUserSmltController` **신규** (`/cast/user-smlt`) | `endpoints.ts` 의 경로(`/pm/cast/user-smlt/...`)와 1:1 이어야 한다 |
| 서비스 | **기존 도메인 확장** — `CastChknService` · `CastDepService` 에 메서드 추가, 운항편만 `CastFltPsgService` 신규 | 매퍼·XML 이 이미 도메인별로 갈려 있다. 새 도메인을 파면 같은 테이블을 두 매퍼가 읽게 된다 |
| 셀프체크인 | `CastSlfchknService.retrieveSlfDeviceCntList` 를 `CastChknServiceImpl` 이 **주입해서 호출** | 탭은 흡수됐지만 테이블·SQL 은 그대로다. 구현체가 아니라 인터페이스를 주입한다 (지시서 5.2) |
| 공용 지표 | `CastSmltService.retrieveWaitPsgList` / `retrieveSmltKpi` | 체크인·출국장이 `UP_PSG_FCLT_CD` 만 바꿔 같은 쿼리를 쓴다. 공용 기반 서비스에 둔다 |

**탭당 조회 1회.** 드로어(자원 배정 · 셀프 서비스 · 검색대 구성)의 데이터는 첫 조회 응답에 함께 실린다 — 화면이 드로어를 열 때 재조회하지 않고 이미 받은 아일랜드/출국장 객체를 쓰기 때문이다.

---

## 3단계에서 해소되지 않은 것 (4단계로 이월)

| # | 항목 | 주체 | 막히는 것 |
|---|---|---|---|
| G11 | `PSG_FCLT_CD` 자리수 규칙 실데이터 확인 | DBA | 신규 쿼리는 **기존 canon 쿼리의 `SUBSTR` 관용구를 그대로 복제**해 위험을 늘리지 않았다. 그래도 규칙이 틀리면 기존 쿼리와 함께 틀린다 |
| G7 | 검색대 다구간 저장 구조 (D2 의 DDL) | DBA | 4단계 저장 API |
| G22 | `TN_PM_SMLT_*_ATRB` DDL 확보 | DBA | 4단계 저장 API 전부 |
| G1 | 시설물 좌표 테이블 | DBA | `retrieveFcltMap` (지도 보기) — 3단계 조회 범위에서 제외했다 |
| G17 | 자정 넘김(RON) | 개발 | 신규 조회는 `endHour <= bgnHour` 를 **당일 24시로 자른다.** `RON_YN` 패턴은 저장 구조가 정해지는 4단계에서 적용 |
| G8 | CAST 연동(`aoms.pm.cmmn.dto.*`) | 개발 | 4단계 범위 확정 |
| — | 미수행 상태 표시값(`0` / `-` / 숨김) | 현업 | D4 참고 |
| — | 탑승동(`P02`)을 T1 시설 화면에 포함하는가 | 현업 | D1 참고 |
