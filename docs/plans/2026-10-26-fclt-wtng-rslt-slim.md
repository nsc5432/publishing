# `TN_PM_SMLT_FCLT_WTNG_RSLT` 컬럼 축소 · 감사 컬럼 표준화 계획

작성일: 2026-10-26 · 기준 커밋: `811572a`

후속 변경: 시간 합계를 정수 초로 정리하고, 표본 수 `WTNG_NOCS` 는 `NUMBER(2,0)`, 나머지 데이터 수치 11개 컬럼은 `NUMBER(12,0)` 으로 정했다. 아래 자료형은 컬럼 축소 당시 기록이며, 현재 정의는 [DDL](../../java/ddl/cast-ddl.sql)을 따른다.

대상: `TN_PM_SMLT_FCLT_WTNG_RSLT` DDL, 이 테이블을 쓰고 읽는 Java 참조 소스(`java/cast` · `java/castapi` · `java/mapper`), 회귀 하네스(`java/verify`)

이 문서만 읽고 새 세션에서 작업을 시작할 수 있게 썼다. 이전 대화 내용은 필요 없다.

## 0. 새 세션에서 시작하는 법

1. `AGENTS.md` 를 읽는다 (특히 §5 주석 규칙, §9 "`java/` 는 여기서 컴파일할 수 없다", §15).
2. §3 결정 사항을 확인한다 (2026-10-26 사용자 확정).
3. §2.3 의 사전 점검 명령을 돌려 이 문서의 전제가 아직 맞는지 확인한다. 결과가 다르면 멈추고 차이를 보고한다.
4. §5 순서대로 진행한다. 커밋은 사용자가 요청할 때만 한다.

## 1. 배경과 목표

10분 대기 결과 테이블(AGENTS.md §15)이 컬럼 27개(PK 6 + 데이터 19 + 감사 2)로 과하게 설계됐다.
데이터 19개 중 **읽는 곳이 없거나 다른 컬럼에서 정확히 계산되는 6개를 뺀다.**
또 시스템 표준 감사 컬럼 6개 중 4개가 빠져 있어 채운다.

| | 현재 | 변경 후 |
|---|---|---|
| PK | 6 | 6 |
| 데이터 | 19 | **13** |
| 감사 | 2 | **6** |
| 합계 | 27 | **25** |

**원칙: 등급 · 평균 대기시간 · 추천 · 해소 · 화면 지표 값은 바뀌지 않는다.** 바뀌는 것은 산정 불가 사유 문구뿐이다 (§2.1 `OBSRVN_RSN`).

범위 밖:

- 남기는 컬럼의 자료형 · 정밀도 조정 (`NUMBER(28,6)` 등)
- 체크인 μ 산식 변경 (`PRCS_CPCT` · `PRCS_VLD_OPER_CNTOM_SUM` 대체 — §2.2 참조)
- 과거 계획 문서 본문 (`2026-10-24-fclt-wtng-rslt-db-design.md` 등) — 역사 기록이라 고치지 않는다. 포인터 한 줄만 단다 (§5 8단계)
- `request.getRemoteAddr()` 의 IPv6 길이(최대 39자)가 `VARCHAR2(23)` 을 넘을 수 있는 문제 — 다른 테이블과 같은 기존 제약이다

## 2. 결정 근거

### 2.1 빼는 컬럼 6개

| 컬럼 | 근거 | 동작 영향 |
|---|---|---|
| `SEC_END_DT` | 항상 `SEC_BGNG_DT + 10분`. CHECK 가 강제하고 `FcltWtngSec.getSecEndDt()` 도 계산값이다. 저장값을 읽는 곳은 `FcltWtngRsltRows.findInvalidRow` 형식 검사뿐 | 없음 |
| `BGNG_OPER_CNTOM` | 쓰기만 하고 읽는 곳이 없다 (`getBgngOperCntom()` 호출 0건) | 없음 |
| `OBSRVN_MNT_CNT` | 평가 로직은 관측 여부(Y/N)만 읽는다 (`getObsrvnMntCnt()` 호출 0건). CHECK 상 `OBSRVN_YN='Y' ⇔ MNT_CNT=10` 이라 중복 | 없음 |
| `OBSRVN_RSN` | 행마다 `VARCHAR2(1000 CHAR)`. 쓰임은 `FcltWtngDay.historyGapOf` 의 산정 불가 사유 문구 뒤에 붙이는 것 하나 | **사유 문구만 단순해진다** |
| `BGNG_WTNG_PSG_CNT` | 같은 시설 **앞 행의 `END_WTNG_PSG_CNT`** 와 같다 (아래 "BGNG 도출") | 없음 |
| `ARR_PSG_CNT` | `max(0, END − BGNG + PRCS)` 로 계산된다 (아래 "ARR 도출") | 없음 |

**관측 컬럼 정책 (2026-10-26 결정): `OBSRVN_YN` 하나만 남긴다.**
`OBSRVN_MNT_CNT` 가 항상 10 인 것은 아니다 — 미관측 행도 저장하기 때문이다. 체크인은 마지막 CC 결과 뒤
꼬리 구간 · 결과 간격 사이가 0, 계산 시작 분이 10분 경계가 아닌 첫 행이 1~9 다. 출국장은 시작 · 끝 시각이
모두 결과에 있으면 10, 아니면 0 이다. 그래도 평가가 쓰는 것은 Y/N 뿐이고 분 수는 진단 정보라 뺀다.
관측 플래그 자체는 없앨 수 없다 — 체크인 미관측 꼬리 행도 `END_WTNG_PSG_CNT` 값을 가져서 다른 컬럼으로 판별할 수 없다.

**BGNG 도출 — 앞 행 END 와 같은 이유**

- 체크인 (`ChknWtngSecBuilder.toSec`): `BGNG = bgn > origin ? queueAt(bgn−1) : null`, 앞 행 `END = queueAt(bgn−1)`.
  행 범위가 `floorSec(origin)` 부터라 "앞 행 존재 ⇔ `bgn > origin`" 이다. 첫 행의 저장값은 원래 null.
- 출국장 (`DepWtngSecBuilder.toSec`): `BGNG = hasResultAt(bgnDt) ? queueOf(slot[bgnDt]) : null`,
  앞 행 `END = hasResultAt(bgnDt) ? queueOf(slot[bgnDt]) : null` — 같은 식이다.
  범위 첫 행만 저장값이 non-null 일 수 있는데, 첫 행은 첫 결과보다 10분 앞(→ 원래 null)이거나
  `dayStart − 180분` 보다 이른 위치라 평가 창(`evalDt−30` 이후)과 출국장 역추정(`evalDt−180` 이후)이 닿지 않는다.

**ARR 도출 — 보존식이 정확히 성립하는 이유**

- 출국장 빌더가 이미 `max(0, endQueue − bgngQueue + prcs)` 로 저장한다 — 식을 그대로 옮긴다.
- 체크인은 아일랜드마다 `ChknQueueCalculator.calculate` 가 분마다 `queue[t] = queue[t−1] + arrival − served` 로 계산한다
  (137 · 164 · 168행). 대기인원 `wtngPsgCnt` 는 구간을 넘어 이어지고, 구간 길이는 다음 결과 시각까지이며
  (`CastChknQueueServiceImpl.intervalDurationMin`), 마지막 결과 뒤는 24:00 까지 꼬리 구간(`addTailInterval`)이 메워
  빈 분이 없다. 따라서 `END − BGNG + PRCS = 도착 합` (≥ 0) 이 정확히 성립한다.
- 차이: 체크인 `bgn == origin` 행은 저장값이 non-null 이지만 도출값은 null(BGNG 가 null)이다.
  ARR 을 읽는 곳은 `FcltWtngDay.rebuildQueue` 하나이고 이미 BGNG · END 둘 다 non-null 이어야 진행하므로 결과가 같다.

### 2.2 남기는 컬럼 13개

| 컬럼 | 읽는 곳 |
|---|---|
| `END_WTNG_PSG_CNT` | 평가시각 큐, 잔여 대기열 재구성, 이제 다음 행의 BGNG |
| `PRCS_PSG_CNT` · `WTNG_PSEC_SUM` · `PRCS_PSEC_SUM` | 평균 대기 · 처리시간, 1분 처리 이력 근사 |
| `WTNG_VLD_PSG_CNT` | 출국장 대기시간 NULL 여객 → 산정 불가 판정 |
| `PRCS_VLD_PSG_CNT` | 출국장은 `PRCS_PSG_CNT` 와 다르다 (처리시간 평균 분모) |
| `WTNG_PSG_CNT_SUM` · `WTNG_NOCS` | 평균 대기열, 결과 존재 판정(`NOCS > 0`) |
| `MAX_WTNG_PSG_CNT` | 맵 · 체크인 상세 `maxQueuePsgCnt`. 출국장은 SUM 과 같지만 체크인은 다르다 |
| `END_OPER_CNTOM` | 운영 대수 |
| `PRCS_CPCT` · `PRCS_VLD_OPER_CNTOM_SUM` | 체크인 μ, 맵 `prcsRate` |
| `OBSRVN_YN` | 관측 여부 |

`PRCS_CPCT` · `PRCS_VLD_OPER_CNTOM_SUM` 을 출국장처럼 `PRCS_PSEC_SUM / PRCS_VLD_PSG_CNT` 로 바꾸는 안은 택하지 않는다.
직전 30분 처리인원 0 인 아일랜드에서 μ 가 null 이 되어 추천 · 해소가 `UNAVAILABLE` 로 바뀐다 (설계 문서 §5 의 경고와 같다).

### 2.3 사전 점검

```bash
cd java
# 빼는 컬럼의 getter 를 FcltWtngDay 외에서 읽는 곳이 없어야 한다 (FcltWtngRsltRows 의 row 매핑 제외)
grep -rn "getBgngWtngPsgCnt()\|getArrPsgCnt()\|getBgngOperCntom()\|getObsrvnMntCnt()\|getObsrvnRsn()\|getSecEndDt()" --include=*.java . \
  | grep -v FcltWtngRsltRows.java | grep -v "CastDsbdServiceImpl.java:.*raw.getArrPsgCnt"
# 기대: FcltWtngDay.java 의 BGNG · ARR · RSN 사용과 FcltWtngSec.getSecEndDt 정의만 나온다
grep -rn "createInitialResult" --include=*.java .   # 기대: 인터페이스 · 구현 · CastApiServiceImpl:2538 세 곳
grep -rn "FcltWtngSec.builder()" --include=*.java .  # 기대: 두 빌더 · FcltWtngRsltRows · verify/FcltWtngRegression 네 곳
```

같은 이름이 다른 뜻으로 쓰이는 곳이 있다 — 손대지 않는다:
`ARR_PSG_CNT` · `arrPsgCnt` 는 `CastDsbdMapper.xml` · `FltSmryRawDto` · `CastDsbdServiceImpl`(운항 도착 여객수)에도 있다.

## 3. 결정 사항 (2026-10-26 사용자 확정)

| # | 질문 | 결정 |
|---|---|---|
| D1 | 이미 이 테이블이 생성 · 적재된 환경이 있는가 | **없다. 신규 생성이다.** ALTER 스크립트를 만들지 않고 `cast-ddl.sql` 의 정의만 바꾼다 |
| D2 | 기존 행의 `FRST_RGTR_ID` · `FRST_RGTR_IP_ADDR` 를 무엇으로 채우나 | 기존 행이 없어 해당 없음. 신규 저장은 `FRST_RGTR_ID = 'CAST'`, `FRST_RGTR_IP_ADDR` = CAST 요청 IP 다 (§5 5 · 6단계) |
| D3 | ERD 덱(`docs/pmown-table-erd.pptx`)도 갱신하나 | 후속 작업으로 미룬다. 이번 범위 밖 |

## 4. 변경 후 DDL

```sql
CREATE TABLE "PMOWN"."TN_PM_SMLT_FCLT_WTNG_RSLT"
(
  "SMLT_ID" VARCHAR2(8) NOT NULL ENABLE VALIDATE,
  "SMLT_MDL_SN" NUMBER(5,0) NOT NULL ENABLE VALIDATE,
  "TMNL_ID" VARCHAR2(3) NOT NULL ENABLE VALIDATE,
  "FCLT_TYPE_CD" VARCHAR2(4) NOT NULL ENABLE VALIDATE,
  "FCLT_UNIT_CD" VARCHAR2(8) NOT NULL ENABLE VALIDATE,
  "SEC_BGNG_DT" TIMESTAMP(0) NOT NULL ENABLE VALIDATE,
  "END_WTNG_PSG_CNT" NUMBER(12,0),
  "PRCS_PSG_CNT" NUMBER(12,0) NOT NULL ENABLE VALIDATE,
  "WTNG_PSEC_SUM" NUMBER(28,6) NOT NULL ENABLE VALIDATE,
  "WTNG_VLD_PSG_CNT" NUMBER(12,0) NOT NULL ENABLE VALIDATE,
  "PRCS_PSEC_SUM" NUMBER(28,6) NOT NULL ENABLE VALIDATE,
  "PRCS_VLD_PSG_CNT" NUMBER(12,0) NOT NULL ENABLE VALIDATE,
  "WTNG_PSG_CNT_SUM" NUMBER(18,0) NOT NULL ENABLE VALIDATE,
  "WTNG_NOCS" NUMBER(2,0) NOT NULL ENABLE VALIDATE,
  "MAX_WTNG_PSG_CNT" NUMBER(12,0),
  "END_OPER_CNTOM" NUMBER(12,0),
  "PRCS_CPCT" NUMBER(18,0),
  "PRCS_VLD_OPER_CNTOM_SUM" NUMBER(18,0),
  "OBSRVN_YN" VARCHAR2(1) NOT NULL ENABLE VALIDATE,
  "FRST_RGTR_ID" VARCHAR2(40) NOT NULL ENABLE VALIDATE,
  "FRST_RGTR_IP_ADDR" VARCHAR2(23) NOT NULL ENABLE VALIDATE,
  "FRST_REG_DT" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "LAST_MDFR_ID" VARCHAR2(40),
  "LAST_MDFR_IP_ADDR" VARCHAR2(23),
  "LAST_MDFCN_DT" TIMESTAMP(6),
  CONSTRAINT "PK_SMLT_FCLT_WTNG_RSLT" PRIMARY KEY
    ("SMLT_ID", "SMLT_MDL_SN", "TMNL_ID", "FCLT_TYPE_CD", "FCLT_UNIT_CD", "SEC_BGNG_DT"),
  CONSTRAINT "FK_SMLT_FCLT_WTNG_STNG" FOREIGN KEY ("SMLT_ID", "SMLT_MDL_SN")
    REFERENCES "PMOWN"."TN_PM_SMLT_STNG" ("SMLT_ID", "SMLT_MDL_SN"),
  CONSTRAINT "CK_WTNG_RSLT_TMNL" CHECK ("TMNL_ID" IN ('T1', 'T2')),
  CONSTRAINT "CK_WTNG_RSLT_TYPE" CHECK ("FCLT_TYPE_CD" IN ('CHKN', 'DEP')),
  CONSTRAINT "CK_WTNG_RSLT_SEC" CHECK (
    EXTRACT(SECOND FROM "SEC_BGNG_DT") = 0
    AND MOD(EXTRACT(MINUTE FROM "SEC_BGNG_DT"), 10) = 0
  ),
  CONSTRAINT "CK_WTNG_RSLT_CNT" CHECK (
    "END_WTNG_PSG_CNT" >= 0
    AND "PRCS_PSG_CNT" >= 0
    AND "WTNG_PSEC_SUM" >= 0
    AND "WTNG_VLD_PSG_CNT" BETWEEN 0 AND "PRCS_PSG_CNT"
    AND "PRCS_PSEC_SUM" >= 0
    AND "PRCS_VLD_PSG_CNT" BETWEEN 0 AND "PRCS_PSG_CNT"
    AND "WTNG_PSG_CNT_SUM" >= 0
    AND "MAX_WTNG_PSG_CNT" >= 0
    AND "END_OPER_CNTOM" >= 0
    AND "PRCS_CPCT" >= 0
    AND "PRCS_VLD_OPER_CNTOM_SUM" >= 0
  ),
  CONSTRAINT "CK_WTNG_RSLT_VLD_SUM" CHECK (
    ("WTNG_VLD_PSG_CNT" > 0 OR "WTNG_PSEC_SUM" = 0)
    AND ("PRCS_VLD_PSG_CNT" > 0 OR "PRCS_PSEC_SUM" = 0)
  ),
  CONSTRAINT "CK_WTNG_RSLT_NOCS" CHECK (
    (("FCLT_TYPE_CD" = 'CHKN' AND "WTNG_NOCS" BETWEEN 0 AND 10)
      OR ("FCLT_TYPE_CD" = 'DEP' AND "WTNG_NOCS" BETWEEN 0 AND 1))
    AND (("WTNG_NOCS" = 0 AND "WTNG_PSG_CNT_SUM" = 0 AND "MAX_WTNG_PSG_CNT" IS NULL)
      OR ("WTNG_NOCS" > 0 AND "MAX_WTNG_PSG_CNT" IS NOT NULL
        AND "WTNG_PSG_CNT_SUM" >= "MAX_WTNG_PSG_CNT"
        AND "WTNG_PSG_CNT_SUM" <= "MAX_WTNG_PSG_CNT" * "WTNG_NOCS"))
  ),
  CONSTRAINT "CK_WTNG_RSLT_OBSRVN" CHECK ("OBSRVN_YN" IN ('Y', 'N'))
);
```

- `FRST_REG_DT` 는 표준대로 `NOT NULL` 을 뺀다 (기존은 `NOT NULL`). `LAST_MDFCN_DT` 는 `DEFAULT · NOT NULL` 을 뺀다 — insert 전용 테이블이라 `LAST_*` 3개는 비워 둔다.
- COMMENT: 빠지는 6개 컬럼의 `COMMENT ON COLUMN` 줄을 지우고, 감사 컬럼 4개를 `TN_PM_SMLT_DALY_CRTR_YMD` 의 문구
  (`최초등록자아이디` · `최초등록자IP주소` · `최종수정자아이디` · `최종수정자IP주소`)로 더한다.
  `OBSRVN_YN` 문구 `관측여부(Y:10분전체관측,N:부분또는미관측)` 는 그대로 둔다. 기존 `FRST_REG_DT` · `LAST_MDFCN_DT` 문구도 그대로다.
- 남는 컬럼의 COMMENT 중 `END_WTNG_PSG_CNT` 는 "다음 행 시작 대기의 원천" 의미가 생기지만 문구는 그대로 둔다.

신규 생성이라(D1) ALTER 스크립트는 만들지 않는다. 신규 DB 는 최신 `cast-ddl.sql` 로 생성한다.

## 5. 작업 순서

### 1단계 — DDL

- `java/ddl/cast-ddl.sql` 의 테이블 정의 · COMMENT 를 §4 로 바꾼다. 상단의 설계 문서 참조 주석은 보존하고 이 계획 문서 경로를 한 줄 더한다.
- 별도 ALTER 스크립트는 만들지 않는다 (D1).
- `java/ddl/2026-10-24-fclt-wtng-rslt-draft.sql` 은 원본 초안이라 고치지 않는다.

### 2단계 — 저장 형식 `FcltWtngSec` (`cast/domains/wtng`)

- 필드 제거: `bgngWtngPsgCnt` · `arrPsgCnt` · `bgngOperCntom` · `obsrvnMntCnt` · `obsrvnRsn`
- `getSecEndDt()` 제거 (유일한 호출처가 `FcltWtngRsltRows` 의 `SEC_END_DT` 매핑)
- 기존 `/** null 은 미확인, 0 은 확인된 빈 대기열 */` 주석은 `bgngWtngPsgCnt` 위에 붙어 있다. 필드가 사라지므로
  같은 의미인 `endWtngPsgCnt` 위로 옮긴다 (삭제하지 않는다)

### 3단계 — 빌더

- `chkn/ChknWtngSecBuilder.toSec`: `arrivals` 누적 · `.bgngWtngPsgCnt` · `.arrPsgCnt` · `.bgngOperCntom` · `.obsrvnMntCnt` · `.obsrvnRsn` 제거.
  `observedMinute` 는 `.obsrvn(observedMinute == SEC_MIN)` 에 계속 쓴다. `reasonOf` 는 호출처가 없어지므로 제거.
  `// queue[m] 은 m 분 처리 후 Queue 라 ...` 주석은 종료 Queue 설명으로 여전히 맞으므로 보존한다.
- `chkn/ChknQueueSeries.arrivalAt` 은 유일한 호출처가 사라진다. 남겨 둔다 (시리즈 정리는 범위 밖).
- `dsbd/DepWtngSecBuilder.toSec`: `bgngQueue` · `start` 변수(`slotMap.get(bgnDt)`, BGNG 에만 쓰였다) · `.bgngWtngPsgCnt` · `.arrPsgCnt` ·
  `.bgngOperCntom` · `.obsrvnMntCnt` · `.obsrvnRsn` 제거. `startObserved` 는 `observed` 계산에 계속 쓴다. `UNOBSERVED_RSN` 상수 제거.
  `// 결과 시각 e 의 ... 시작 Queue 는 e-10분 결과에 둔다` 주석은 보존한다 (기존 주석 규칙).

### 4단계 — 평가 `FcltWtngDay` (`cast/domains/wtng`)

private 헬퍼 2개를 더하고 BGNG · ARR 을 읽던 4곳을 바꾼다.

```java
// 앞 구간의 종료 Queue 가 이 구간의 시작 Queue 다
private static Integer bgngQueueOf(TreeMap<LocalDateTime, FcltWtngSec> secMap, FcltWtngSec sec) {
	FcltWtngSec prev = secMap.get(sec.getSecBgngDt().minusMinutes(SEC_MIN));
	return prev == null ? null : prev.getEndWtngPsgCnt();
}

private static Integer arrivalOf(TreeMap<LocalDateTime, FcltWtngSec> secMap, FcltWtngSec sec) {
	Integer bgng = bgngQueueOf(secMap, sec);
	Integer end = sec.getEndWtngPsgCnt();
	return bgng == null || end == null ? null : Math.max(0, end - bgng + sec.getPrcsPsgCnt());
}
```

| 위치 (기준 커밋 행) | 변경 |
|---|---|
| `chknSourceOf` 276 `window[0] == null ? null : window[0].getBgngWtngPsgCnt()` | `window[0] == null ? null : bgngQueueOf(secMap, window[0])`. null 가드는 유지 |
| `depSourceOf` 322 `covered ? first.getBgngWtngPsgCnt() : null` | `covered ? bgngQueueOf(secMap, first) : null`. `covered` 면 `first` 는 non-null |
| `historyGapOf` 355-356 사유 문구 | `getObsrvnRsn()` 덧붙임 제거. 앞 문장 "직전 30분 중 시뮬레이션 결과가 없는 구간이 있습니다. unitCd=…, secBgngDt=…" 는 그대로 |
| `rebuildQueue` 392-397 | 조건을 `sec == null \|\| !sec.isObsrvn() \|\| arrival == null` 로, `arrivalPerMin` 을 `arrival` 로. `arrival = arrivalOf(secMap, sec)` 는 BGNG · END 둘 다 non-null 일 때만 값이 있어 기존 조건과 같다. `isObsrvn` 검사는 유지 |

`chknSourceOf` · `depSourceOf` 에는 `secMap` 지역변수가 없다. `windowOf` 와 같이
`secMapByUnit.getOrDefault(unitCd, new TreeMap<>())` 로 꺼낸다 (`depSourceOf` 는 시설 결과가 없어도 호출된다).

저장 경로와 Java 보완 경로 모두 `FcltWtngDay` 를 거치므로 두 경로가 같은 도출 규칙을 쓴다.

### 5단계 — 행 변환 · Mapper

- `cast/dto/FcltWtngRsltDto`: `secEndDt` · `bgngWtngPsgCnt` · `arrPsgCnt` · `bgngOperCntom` · `obsrvnMntCnt` · `obsrvnRsn` 제거.
- `cast/service/impl/FcltWtngRsltRows`:
  - `toRowList` · `toSecMap` 에서 해당 필드 매핑 제거
  - `findInvalidRow` 의 경계 검사를 `secBgngDt == null || !isSecBoundary(secBgngDt)` 로 줄이고 문구에서 `secEndDt` 를 뺀다
- `java/mapper/CastFcltWtngRsltMapper.xml`:
  - insert 컬럼 · VALUES 에서 6개 제거, `LAST_MDFCN_DT` 제거
  - `FRST_RGTR_ID` = `'CAST'` (다른 CAST 결과 insert 와 같다 — `CastApiMapper.xml` 1644 · 1696행), `FRST_RGTR_IP_ADDR` = `#{loginIpAddr}`, `FRST_REG_DT` = `CURRENT_TIMESTAMP`
  - select 에서 6개 제거
- `cast/mapper/CastFcltWtngRsltMapper.java`: `insertFcltWtngRsltList(@Param("list") List<FcltWtngRsltDto> list, @Param("loginIpAddr") String loginIpAddr)`
  — IP 는 행마다 같아 DTO 필드로 두지 않는다.

### 6단계 — 서비스 시그니처 (IP 전달)

- `CastFcltWtngRsltWriter` / `Impl`: `insertScope(List<FcltWtngRsltDto> rowList, String loginIpAddr)`.
  `// 행당 바인드 25개 ...` 주석의 숫자를 새 값 **20개**(키 6 + 데이터 13 + IP 1 — `#{loginIpAddr}` 가 `<foreach>` 안이라 행마다 바인드된다)로 고친다. 청크 500 은 그대로 둔다.
- `CastFcltWtngRsltCreateService` / `Impl`: `createInitialResult(String smltId, int smltMdlSn, String loginIpAddr)`, `createScope` 로 넘긴다.
- `castapi/service/impl/CastApiServiceImpl.java:2538`: `simRslt.getLoginIpAddr()` 를 넘긴다 (2528행에서 `request.getRemoteAddr()` 로 채워진 같은 객체).

### 7단계 — 회귀 하네스 `java/verify/FcltWtngRegression.java` · `README.md`

하네스의 `row(...)` 가 `.bgngWtngPsgCnt` · `.arrPsgCnt` · `.bgngOperCntom` · `.obsrvnMntCnt` 를 직접 넣는다 (122-142행).
필드 제거 후에는 시작 대기 · 도착을 **앞 행의 종료 대기로 표현**해야 같은 시나리오가 된다. 그대로 두면 컴파일이 깨지고,
필드만 지우면 앞 행이 없는 행의 BGNG 가 null 이 되어 아래 검사가 결과를 바꾼다.

- `row(...)`: `beginning` · `arrivals` 파라미터와 위 4개 builder 호출을 지운다.
- 시작 대기를 쓰던 시나리오는 그 행 바로 앞(10분 전)에 `ending = 원래 beginning` 인 행을 하나 더한다.
  - `queueRows(observed, beginning, ending, arrivals)` (`EVAL−40` 행): `beginning` 이 non-null 이면 `EVAL−50` 에 `ending = beginning` 행을 더한다.
    기존 값 `0 · 8 · 10`(처리 2)은 도출식 `8 − 0 + 2 = 10` 과 맞아 시나리오가 그대로 재현된다.
  - `checkBoundary` (`EVAL−30` 부터 3행, 시작 0 · 종료 0 · 도착 1 · 처리 1): `EVAL−40` 에 종료 0 행을 더한다. 도출 도착 `0 − 0 + 1 = 1`.
    더하지 않으면 체크인 `queueAtStart` 가 0 → null 로 바뀐다.
  - `emptyQueue` 와 `queueRows` 의 `EVAL−30 ~ −10` 행은 이미 앞 행 종료 = 이 행 시작이라 그대로다.
- `"unknown arrivals"` 검사(`queueRows(true, 0, 8, null)`)는 지운다. 도착은 이제 시작 · 종료가 모두 있으면 항상 값이 있어 이 상태를 만들 수 없다.
  `"unknown beginning queue"` 는 `EVAL−50` 행을 더하지 않는 것으로, `"unknown ending queue"` 는 그대로 표현된다.
- 더한 행은 시나리오를 바꾸지 않도록 관측 여부 · 처리인원을 정한다: 관측은 대상 행과 같게, 처리 0 · 대기합 0 으로 둔다.
  `hasResult` · `isPresent` 는 `WTNG_NOCS > 0` 을 보지만 평가 창 `[EVAL−30, EVAL)` 밖이라 영향이 없다.
- `README.md` 의 `javac` 대상 목록에 `java/cast/domains/wtng/FcltWtngSec.java` 를 더한다. 빠지면 `PM_VERIFY_CLASSPATH` 의
  옛 `FcltWtngSec`(제거 전 필드)로 컴파일되어 하네스가 새 코드를 검사하지 못한다.
- 실행 결과의 검사 수가 바뀐다 (`"unknown arrivals"` 의 2개 감소). `README.md` 의 "Java 78개 검사" 와
  "미확인 경계 큐 · 도착인원" 문구를 실제 출력에 맞춰 고친다. 이 저장소에서 실행할 수 없으면 README 는 고치지 말고 실행이 필요하다고 보고한다.

### 8단계 — 문서

- `AGENTS.md` §15 에 한 줄: "`TN_PM_SMLT_FCLT_WTNG_RSLT` 는 2026-10-26 컬럼을 줄였다. 시작 대기 · 도착은 앞 행 종료 대기로 도출하고 관측은 `OBSRVN_YN` 만 둔다 ([계획](docs/plans/2026-10-26-fclt-wtng-rslt-slim.md))."
- `docs/plans/2026-10-24-fclt-wtng-rslt-db-design.md` §5 표 위에 이 문서를 가리키는 한 줄만 단다. 본문은 고치지 않는다.

## 6. 검증

이 저장소에서는 Java 컴파일 · DB 적용을 할 수 없다 (AGENTS.md §9). 아래는 정적 확인이고, 실제 빌드 · 적용은 실백엔드 · 검증 DB 에서 한다.

```bash
cd java
# 1) 빼는 이름이 대상 파일에 남아 있지 않다 (기대: 0건)
#    ARR_PSG_CNT · arrPsgCnt 는 운항 도착 여객수로 다른 파일에도 있어 대상 파일만 본다 (§2.3)
grep -n "SEC_END_DT\|BGNG_WTNG_PSG_CNT\|ARR_PSG_CNT\|BGNG_OPER_CNTOM\|OBSRVN_MNT_CNT\|OBSRVN_RSN" \
  mapper/CastFcltWtngRsltMapper.xml
sed -n '/TN_PM_SMLT_FCLT_WTNG_RSLT : /,/^-- =====/p' ddl/cast-ddl.sql \
  | grep -n "SEC_END_DT\|BGNG_WTNG_PSG_CNT\|ARR_PSG_CNT\|BGNG_OPER_CNTOM\|OBSRVN_MNT_CNT\|OBSRVN_RSN"
grep -n "secEndDt\|SecEndDt\|bgngWtngPsgCnt\|BgngWtngPsgCnt\|arrPsgCnt\|ArrPsgCnt\|bgngOperCntom\|BgngOperCntom\|obsrvnMntCnt\|ObsrvnMntCnt\|obsrvnRsn\|ObsrvnRsn\|UNOBSERVED_RSN\|reasonOf" \
  cast/domains/wtng/FcltWtngSec.java cast/domains/wtng/FcltWtngDay.java \
  cast/domains/chkn/ChknWtngSecBuilder.java cast/domains/dsbd/DepWtngSecBuilder.java \
  cast/dto/FcltWtngRsltDto.java cast/service/impl/FcltWtngRsltRows.java verify/FcltWtngRegression.java
# 2) 시그니처 변경이 호출처까지 닿았다 (모든 호출이 IP 인자를 넘긴다)
grep -rn "createInitialResult\|insertScope\|insertFcltWtngRsltList" --include=*.java .
# 3) mapper insert 컬럼 수(키 6 + 데이터 13 + 감사 3 = 22) = VALUES 항목 수
```

회귀 하네스: `java/verify/README.md` 의 명령으로 `FcltWtngRegression` 을 실행해 `PASS` 를 확인한다 (`PM_VERIFY_CLASSPATH` 필요).
실행 환경이 없으면 실행하지 못했다고 보고한다.

동치 확인 (실백엔드 또는 저장소 밖 하네스):

- 같은 `smltId` · 모델로 변경 전 · 후 `FcltWtngDay` 를 만들어, 모든 시설 · 10분 경계 `evalDt` 에서
  `gradeOf` · `avgWtngSecOf` · `sourceOf`(`queueAtStart` 포함) · `recommendOf` · `slotOf(30분)` 이 같아야 한다.
- 저장된 기존 행이 없으므로(D1) 대조는 변경 전 빌더 출력으로 한다. 변경 전 `ChknWtngSecBuilder` · `DepWtngSecBuilder` 가 만든
  `FcltWtngSec` 목록에서 시설별 시각순으로 `bgngWtngPsgCnt = 앞 행 endWtngPsgCnt`, `arrPsgCnt = max(0, end − bgng + prcs)` 를 확인한다.
  불일치가 범위 첫 행 · 체크인 `bgn == origin` 행 외에서 나오면 작업을 멈춘다.
- 다르게 나와도 되는 것은 산정 불가 사유 문구의 `OBSRVN_RSN` 덧붙임뿐이다.
