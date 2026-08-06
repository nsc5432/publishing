# 2단계 — 데이터베이스 구조 분석

## 1. 작업 개요

`java/cast-db/` 에 있는 Oracle DDL 과 MyBatis XML 매퍼를 역공학해서, **화면이 요구하는 데이터가 어느 테이블·어느 컬럼에서 나오는지** 매핑한 분석 문서를 만든다.

이 레포에는 DB 접속 정보도, 전체 스키마 덤프도 없다. DDL 은 테이블 **2개분**만 있고, 나머지 수십 개 테이블은 **쿼리문 안에서만** 등장한다. 따라서 이 단계의 본질은 *"SQL 을 읽어서 스키마를 복원하고, 복원 못 한 부분을 명시적으로 남기는 것"* 이다.

**코드는 작성하지 않는다. 산출물은 문서 하나다.**

## 2. 선행 산출물

| 산출물 | 출처 | 용도 |
|---|---|---|
| `react/src/api/pm/API_SPEC-DELTA.md` | 1단계 | 리뉴얼 3탭이 요구하는 데이터 항목 목록 → 5.4 매핑표의 왼쪽 열 |
| 개편된 `react/src/modules/pm/pages/userSmlt/**` | 1단계 | 화면 요소의 실제 형태 확인 |

1단계가 끝나지 않았다면 `react/design-renewal/*.html` 시안을 직접 보고 데이터 항목을 유추해 진행하되, 그 사실을 문서에 적는다.

## 3. 읽어야 할 파일

### 분석 대상 (입력, 수정 금지)

| 파일 | 규모 | 볼 것 |
|---|---|---|
| `java/cast-db/ddl.txt` | 107줄 | **유일한 실제 DDL.** 테이블 2개 + 한국어 컬럼 코멘트 |
| `java/cast-db/CastChknMapper.xml` | 57줄 | select 1개 — 체크인카운터 3-way 조인. **가장 중요한 쿼리** |
| `java/cast-db/CastDepMapper.xml` | 48줄 | select 1개 — 출국장 |
| `java/cast-db/CastSlfchknMapper.xml` | 59줄 | select 1개 — 셀프체크인/백드롭 |
| `java/cast-db/CastSmltMapper.xml` | 110줄 | select 5개 — 시뮬레이션 설정·혼잡등급·xovis |
| `java/cast-db/CastUserConfigMapper.xml` | 30줄 | select 2개 — 사용자 시뮬레이션 조건 |
| `java/cast-db/CastRestMapper.xml` | **2254줄 / 44 statement** | CAST 엔진 연동. 스키마 정보의 최대 광맥 |

> `java/mapper/` 의 5개 XML 은 `java/cast-db/` 와 **바이트 단위로 동일한 사본**이다 (런타임 리소스 경로 미러). 분석 대상에서 제외하되, 문서에 "동일 사본"이라고 한 줄 남긴다. `CastRestMapper.xml` 은 `cast-db` 에만 있다.

### 참조 (읽기 전용)

| 파일 | 볼 것 |
|---|---|
| `java/cast/mapper/*.java` | 매퍼 인터페이스 7개 — 메서드 시그니처로 파라미터/반환 타입 확인 |
| `java/cast/dto/*.java` | 31개 DTO — 컬럼 → 필드 매핑의 반대편. 한국어 줄끝 주석에 단위가 적혀 있음 |
| `java/cast/enums/*.java` | `CongestionStatus` / `CongestionType` / `PrcsGrdType` / `SlfType` — SQL 의 `CASE WHEN` 과 대응 |
| `java/cast/service/impl/CastSmltServiceImpl.java` | 395줄. 시설 코드(`LS/CC/CK/SBD/LGT/SC/SR`)·터미널 코드(`P01/P02/P03`) 의미가 한국어 주석으로 설명됨 |
| `react/src/api/pm/API_SPEC.md` | 화면이 기대하는 필드명·타입 |

## 4. 작업 범위

### 할 것

- XML·DDL 에 등장하는 **모든 테이블** 카탈로그화
- 명명 규칙 사전 작성
- 핵심 조인 패턴·SQL 관용구 정리
- 화면 항목 ↔ 테이블·컬럼 매핑표 작성
- 갭과 모순을 명시적으로 목록화

### 하지 말 것

- **DB 접속 시도 금지.** 접속 정보가 없고, 있어도 이 단계 범위가 아니다
- **DDL 추측해서 생성 금지.** 없는 것은 "DDL 미확보"로 남긴다. 추측한 컬럼은 반드시 "쿼리에서 유추"라고 표기
- SQL 수정 금지 — 발견한 버그도 **기록만** 한다 (수정은 3·4단계 판단)
- Java 코드 작성 금지
- `java/cast-db/` · `java/mapper/` 파일 수정 금지

## 5. 상세 지시

산출 문서 `docs/db/DB-ANALYSIS.md` 는 아래 5개 장으로 구성한다.

### 5.1 테이블 카탈로그

XML·DDL 에 등장하는 모든 테이블을 **스키마 소유자별**로 묶어 정리한다.

| 소유자 | 의미 | 확인된 테이블 예 |
|---|---|---|
| `PMOWN` | 예측관리 (Prediction Mgmt) | `TN_PM_SMLT_RSLT_DTL`, `TN_PM_SMLT_PSG_FCLT`, `TN_PM_SMLT_STNG`, `TN_PM_SMLT_MDL`, `TN_PM_PSG_WTNG_INFO`, `TN_PM_PSG_PRCS_GRD`, `TH_PM_SMLT_EXCN_LOG`, `TH_PM_DW_DEL_KEY_HSTRY` |
| `GOOWN` | 운항·게이트 운영 | `TN_GO_GD_DATA`, `TI_GO_CKNCT_DALY_ALOT` |
| `CAOWN` | 공통·코드·항공사 | `TC_CA_COM_CD`, `TN_CA_ALN`, `TN_CA_CKNCT`, `TN_CA_ACST`, `TN_CA_ALN_PGE` |
| `DROP_AA_*` / `DROP_TMP` | 타 시스템 연계 스테이징 | `DROP_AA_TN_FP_ACT_ARR_DEP`, `DROP_AA_TN_AS_GD_DATA`, `DROP_AA_TN_RS_CIC_DALY_ALLOC`, `DROP_AA_SBD_PLCY`, `DROP_AA_SELF_CHKN_ALN` |

> 위 목록은 **출발점이지 완성본이 아니다.** `CastRestMapper.xml` 2254줄을 훑어 빠진 테이블을 반드시 채운다.

각 테이블마다:

- 테이블명 · 한국어 명칭(코멘트 또는 SQL 주석에서) · 소유자
- 컬럼 목록 — **DDL 이 있으면 타입·NULL 여부·코멘트까지**, 없으면 SELECT 절에 등장한 컬럼만
- 출처 표기: `DDL 확보` / `쿼리에서 유추(파일:줄)`
- PK 추정 근거 (조인 조건, `WHERE` 절)

**DDL 이 확보된 것은 이 2개뿐이다:**

- `PMOWN.TN_PM_SMLT_RSLT_DTL` — PM_시뮬레이션결과상세. 6컬럼 복합 PK `(SMLT_ID, SMLT_EXCN_DT, SMLT_ACTL_DT, SMLT_MDL_SN, SMLT_RSLT_SN, PSG_FCLT_CD)`. 지표는 `AVG_`/`MIN_`/`MAX_` 3종 세트 × (`PRCS_HR`, `WTNG_HR`, `WTNG_LEN`) + `WTNG_PSG_CNT`, `TRNST_PSG_CNT`, `INDV_REQ_AVG_AREA`
- `PMOWN.TN_PM_SMLT_PSG_FCLT` — PM_시뮬레이션여객시설. PK `PSG_FCLT_CD`. `UP_PSG_FCLT_CD` 로 **자기참조 계층** + `TMNL_ID`, `SORT_SEQ`, `USE_YN`, `SMLT_FCLT_NM`

### 5.2 명명 규칙 사전

**테이블 접두**

| 접두 | 의미 | 예 |
|---|---|---|
| `TN_` | 마스터 / 트랜잭션 | `TN_PM_SMLT_STNG` |
| `TI_` | 연계·수집 (Interface) | `TI_GO_CKNCT_DALY_ALOT` |
| `TH_` | 이력 (History) | `TH_PM_SMLT_EXCN_LOG` |
| `TC_` | 코드 | `TC_CA_COM_CD` |
| `DROP_AA_` | 타 시스템 연계 스테이징 | `DROP_AA_SBD_PLCY` |

형식: `<접두>_<서브시스템>_<이름>`. 서브시스템은 소유자와 대응 (`PM` / `GO` / `CA` / `FP` / `AS` / `RS`).

**컬럼 약어** — 한국어 로마자 축약이 고정 어휘로 쓰인다.

`SMLT`(시뮬레이션) `PSG`(여객) `FCLT`(시설) `WTNG`(대기) `PRCS`(처리) `TRNST`(통과) `CKNCT`(체크인카운터) `TMNL`(터미널) `ALN`(항공사) `EXCN`(실행) `STNG`(설정) `MDL`(모델) `RSLT`(결과) `DTL`(상세) `PREDC`(예측) `EST`(예상) `BGNG`(시작) `DALY`(일별) `ALOT`(배정)

**타입 접미**

`_CD`(코드) `_ID` `_NM`(명) `_SN`(일련번호) `_CNT`(수) `_HR`(시간) `_LEN`(길이) `_YMD`(일자) `_DT`(일시) `_HM`(시분) `_YN`(여부) `_EXPLN`(설명) `_SE_CD`(구분코드) `_ADDR`(주소) `_SEQ`(순번)

**전 테이블 공통 감사 컬럼 6종** (가장 중요한 규칙 — 4단계 INSERT 에서 그대로 쓴다)

```
FRST_RGTR_ID       VARCHAR2(40)     최초등록자ID
FRST_RGTR_IP_ADDR  VARCHAR2(23)     최초등록자IP
FRST_REG_DT        TIMESTAMP(6)     DEFAULT CURRENT_TIMESTAMP
LAST_MDFR_ID       VARCHAR2(40)     최종수정자ID
LAST_MDFR_IP_ADDR  VARCHAR2(23)     최종수정자IP
LAST_MDFCN_DT      TIMESTAMP(6)     최종수정일시
```

**기타**

- 타입은 `VARCHAR2(n)` / `NUMBER(p,0)` / `TIMESTAMP(6)` 만 쓴다. `DATE`·`CLOB` 없음
- 제약: `NOT NULL ENABLE VALIDATE`, PK 이름 `<TABLE>_PK`, 인덱스 테이블스페이스 `TSIPM01` / 데이터 `TSDPM01`
- **모든 테이블·모든 컬럼에 한국어 `COMMENT ON` 필수** — 하우스 스타일
- 시퀀스: `SQ1_<TABLE>` (예: `PMOWN.SQ1_TN_PM_SMLT_RSLT.NEXTVAL`)
- 커스텀 함수: `PMOWN.FN_PM_SAFE_TO_NUMBER(...)` — 시설 코드에서 카운터 번호를 안전하게 파싱

### 5.3 핵심 조인 패턴 · SQL 관용구

정리할 것:

**① 체크인카운터 3-way 조인** — `CastChknMapper.xml` `retrieveSmltChknList`. 시뮬레이션 결과 × 시설 마스터 × 일별 카운터 배정. **3·4단계에서 가장 많이 복제될 쿼리이므로 별칭·조인 조건까지 상세히 해부한다.**

**② 시설 코드 파싱 관용구** — 코드 문자열을 자리수로 잘라 아일랜드/카운터번호를 뽑는다.

```sql
SUBSTR(A.PSG_FCLT_CD, 3)    FCLT_CD,
SUBSTR(A.PSG_FCLT_CD, 3, 1) ISLAND,
PMOWN.FN_PM_SAFE_TO_NUMBER(SUBSTR(A.PSG_FCLT_CD, 4, 2)) COUNTER_NUM,
```

→ **`PSG_FCLT_CD` 의 자리수 구성 규칙을 문서에 명시할 것.** 이게 밝혀져야 3단계에서 신규 쿼리를 쓸 수 있다.

**③ 시간 구간 매칭** — `AND A.TIME BETWEEN C.EST_BGNG_HM AND C.EST_END_HM`

**④ 시설 계층** — `UP_PSG_FCLT_CD` 자기참조. 상위 코드 의미:

`LS` 랜드사이드 좌석 / `CC` 체크인카운터 / `CK` 셀프체크인 / `SBD` 셀프백드랍 / `LGT` 출국장 / `SC` 보안검색대 / `SR` 보안검색대RED

**⑤ SQL 에서 enum 을 만드는 방식** — `CastSmltMapper.xml` `retrievePrcsGrd`

```sql
CASE WHEN PSG_PRCS_GRD_CD = '01' THEN 'FREE' ... END CGN_STATUS
```

→ `CongestionStatus` enum 필드로 그대로 바인딩된다. **코드값 ↔ enum 대응표를 문서에 남긴다.**

**⑥ MyBatis 관용구**

- statement 첫 줄에 트레이스 주석 `/* XxxMapper.methodName */` — 예외 없이
- 동적 SQL 은 `WHERE 1 = 1` + `<if test="x != null and x != ''">`. **`<where>` / `<trim>` / `<choose>` 를 안 쓴다**
- `IN` 은 `<foreach collection="..." item="item" separator=",">`
- LIKE 는 `LIKE #{dt} || '%'` (Oracle 연결 연산자)
- **`<resultMap>` 이 한 개도 없다** → `map-underscore-to-camel-case` 전제 + SELECT 별칭으로 매핑
- 항상 `#{}`, `${}` 미사용 → SQL 인젝션 표면 없음

**⑦ Oracle 전용 구문** (`CastRestMapper.xml` 에 집중)

`LISTAGG(...) WITHIN GROUP (ORDER BY ...)` **119회** — 결과셋을 콤마 문자열로 평탄화. 이것이 **CAST 엔진 리소스 파일 포맷**이다. 그 외 `WITH` CTE, `CONNECT BY`, `ROWNUM`, `NVL`, `SYSDATE`, `TO_CHAR/TO_NUMBER`, `FROM DUAL`, `||`, `.NEXTVAL`.

### 5.4 화면 ↔ 테이블 매핑표

1단계 `API_SPEC-DELTA.md` 의 각 데이터 항목이 어느 테이블·컬럼에서 오는지 매핑한다.

| 화면 | 요소 | 필드 | 테이블 | 컬럼 | 상태 |
|---|---|---|---|---|---|
| 체크인 카운터 | 블럭 차트 | 시간대별 운영 부스 수 | ? | ? | 확인 / 유추 / **미확인** |
| … | | | | | |

- **채울 수 없는 항목은 "데이터 소스 미확인"으로 남긴다.** 억지로 매핑하지 말 것 — 그게 3·4단계에서 터진다
- 미확인 항목은 5.5 갭 목록에 리스크로 재수록한다
- 도출 근거(파일:줄)를 함께 적는다

### 5.5 갭 · 모순 목록

**3·4단계가 여기서 걸려 넘어질 것들이다. 빠짐없이 기록한다.**

이미 확인된 것 (검증 후 문서에 반영, 추가로 발견되는 것도 계속 붙인다):

| # | 내용 | 영향 |
|---|---|---|
| G1 | `FcltMapper` / `UserMapper` 는 Java 인터페이스만 있고 **XML 이 없다** | 시설물·사용자 조회 구현 시 SQL 을 새로 써야 함 |
| G2 | 터미널 코드가 **Java `P01`/`P02`/`P03`** vs **React `T1`\|`T2`** | 변환 지점 결정 필요 (3단계). `P01`~`P03` 각각이 어느 터미널인지도 확정 필요 |
| G3 | `CastRestMapper.xml` L1762 `updateSimResultDtl` — L1764 가 `UPDATE INTO PMOWN.TN_PM_SMLT_RSLT_DTL SET`. **Oracle 문법 오류**. 같은 문에 `INT(...)` 사용 (Oracle 함수 아님) | 실행 시 실패 |
| G4 | `CastRestMapper.xml` L1747 `retrieveSimSetByPk` — L1749 가 `SELECT COUNT(SIM_ID) FROM PMOWN.TN_PM_SMLT_STNG`. 해당 테이블 컬럼은 `SMLT_ID` | 실행 시 실패 |
| G5 | `<resultMap>` 전무 → 컬럼-필드 매핑이 전적으로 명명 규칙 + 별칭에 의존 | 별칭 실수 시 조용히 `null` |
| G6 | `CastUserConfigMapper.xml` 의 트레이스 주석이 `CastDepMapper.` 로 잘못 적혀 있음 (복붙). `CastSmltMapper.xml` `retrievePrcsGrd` 주석도 `retrieveXovisRsltDtl` 로 오기 | 로그 추적 혼선 |
| G7 | 리뉴얼 화면이 요구하는 **시간대별 부스 수 / 검색대 대수** 를 담을 테이블이 확인되지 않음 | 3·4단계 최대 리스크 — 신규 테이블 필요 여부 판단 |
| G8 | `aoms.pm.cmmn.dto.*` (CastRest 계열 DTO) 가 레포에 **없다** | 4단계 CAST 연동 범위 제약 |

각 항목에 **영향 범위**와 **누가 결정해야 하는지**(개발 판단 / 현업 확인 / DBA 확인)를 적는다.

## 6. 지켜야 할 규칙

- **모르는 것을 아는 것처럼 쓰지 않는다.** 모든 항목에 `DDL 확보` / `쿼리에서 유추` / `미확인` 중 하나를 표기
- 근거는 **파일:줄** 로 남긴다 (예: `CastChknMapper.xml:23`)
- 한국어로 작성. 테이블·컬럼명은 원문 대문자 그대로
- 발견한 SQL 버그는 **기록만**. 고치지 않는다
- 문서가 길어지면 장 단위로 파일을 쪼개되 `docs/db/DB-ANALYSIS.md` 를 목차 겸 진입점으로 유지

## 7. 산출물

- `docs/db/DB-ANALYSIS.md` — 5.1~5.5 전체 (필요 시 `docs/db/` 아래 분할)

**3단계로 넘기는 것**: 테이블 카탈로그 · 화면↔테이블 매핑표 · 갭 목록(특히 G2 터미널 코드, G7 시간대별 데이터 소스)

## 8. 완료 조건

- [ ] 테이블 카탈로그가 7개 XML + `ddl.txt` 에 등장하는 **모든** 테이블을 덮는다 (`CastRestMapper.xml` 2254줄 포함)
- [ ] 모든 테이블에 `DDL 확보` / `쿼리에서 유추` / `미확인` 출처 표기가 있다
- [ ] `PSG_FCLT_CD` 자리수 구성 규칙이 문서화되었다
- [ ] `PSG_PRCS_GRD_CD` 코드값 ↔ `CongestionStatus` enum 대응표가 있다
- [ ] 화면↔테이블 매핑표가 1단계 `API_SPEC-DELTA.md` 의 모든 항목을 한 줄씩 다룬다 (미확인 포함)
- [ ] 갭 목록에 G1~G8 이 모두 반영되고, 각 항목에 영향 범위와 결정 주체가 적혀 있다
- [ ] 문서 내 모든 주장에 파일:줄 근거가 있다
