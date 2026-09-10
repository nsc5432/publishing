# 대기행렬 이론 기반 시설 추천 표준 설계

작성일: 2026-09-10 · 대상: `java/`(신규 `aoms.pm.queue` 모듈), `react/src`
상태: **설계 단계 — 소스 변경 없음**

---

## 0. 목표

CAST(시뮬레이션 결과)와 Xovis(현장 흐름 관측)는 원천이 다르지만, 내려주는 데이터의 형태는 결국
**"시각별로 나열된 대기인원과 처리시간"** 하나로 같다. 이 형태에 대기행렬 이론(M/M/s)을 적용해
아래 두 가지를 산출하는 기능을 만든다.

1. **가공 데이터 산출** — 원천에 없는 유입량 λ, 처리량 μ, 운영 시설수 s, 부하 a·ρ, 배수율을 역산한다.
2. **추천 시설수 산출** — 현재 대기인원을 목표 시간(기본 30분) 안에 목표 인원 이하로 낮추는 데
   필요한 **총 시설수**와 그때의 **혼잡 해소시간**을 구한다.

핵심 요구는 "CAST 전용 기능"이 아니라 **원천 중립 표준**을 잡는 것이다. 대기행렬 이론에 태울 수 있는
형태(대기열 관측 + 서버 관측)면 어떤 소스든 어댑터 하나로 붙는다. 그래서 **인터페이스 스펙을 먼저
확정하고**, 계산 규칙은 그 스펙 위에서 정의한다.

### 0.1 확정 전제

- 계산 코어는 **원천을 모른다.** `aoms.pm.cast.*` 를 import 하지 않는다. CAST 와 Xovis 는 각각 어댑터다.
- 계산 코어는 **상태가 없다.** 같은 입력이면 항상 같은 출력이다 (기존 `ChknQueueCalculator` 와 동일한 원칙).
- 결과 테이블·DDL 을 추가하지 않는다. 조회 시 계산한다.
- **산정할 수 없으면 값을 지어내지 않고 `null` 로 내려보낸다.** 화면은 `-` 로 그린다 (AGENTS.md §13 규칙).
- **하드코딩 임계값을 두지 않는다.** 목표 인원은 혼잡등급 기준정보(`TN_PM_PSG_PRCS_GRD`)에서 온다.

### 0.2 이 문서에서 결정하지 않는 것

- Xovis 원천 테이블·수신 경로의 물리 스키마 (§9 미결)
- 신규 REST prefix 채택 여부 (§7.1 확인 필요)
- 기존 대시보드 추천값이 바뀌는 것에 대한 승인 (§8.3 확인 필요)

---

## 1. 기호와 용어

슬라이드의 기호를 코드·DTO 이름과 1:1로 못박는다. **이 표가 이후 모든 절의 기준이다.**

| 기호 | 뜻 | 단위 | 코어 필드 | DTO 필드 |
|---|---|---|---|---|
| `λ` | 유입량 (도착률) | 명/분 | `arrivalRate` | `arvlRate` |
| `μ` | 시설 **1대**의 처리량 | 명/분 | `serviceRate` | `srvcRate` |
| `s` | 운영 중인 시설수 | 대 | `openCount` | `oprFcltCnt` |
| `L_q` | 대기인원 | 명 | `queueLength` | `wtngPsgCnt` |
| `W_q` | 평균 대기시간 | 초 | `avgWaitSec` | `avgWtngSec` |
| `a` | 에를랑 (`λ/μ`) | erlang | `offeredLoad` | `offeredLoad` |
| `ρ` | 부하 (`a/s`) | 0~100 | `loadRate` | `loadRate` |
| `s·μ − λ` | 배수율 | 명/분 | `drainRate` | `drainRate` |
| `s_req` | 추천 시설수 (**총 소요**) | 대 | `reqCnt` | `reqCnt` |
| `t` | 혼잡 해소시간 | 분 | `clearMinutes` | `cgnClearMin` |
| `C(s,a)` | 대기확률 (Erlang C) | 0~100 | `waitProbRate` | `wtngProbRate` |
| — | 구간 처리인원 | 명 | `processedCount` | `prcsPsgCnt` |

- `reqCnt` · `cgnClearMin` · `wtngPsgCnt` · `prcsPsgCnt` 는 **이미 고정된 이름**이다 (AGENTS.md §3).
  같은 뜻에 새 이름을 만들지 않는다.
- 신규 필드 `arvlRate` · `srvcRate` · `oprFcltCnt` · `offeredLoad` · `loadRate` · `drainRate` ·
  `wtngProbRate` · `avgWtngSec` 는 **이 문서로 확정되며 이후 고정이다.**
- `loadRate`(ρ = 제공부하)와 기존 `ChknQueueSlot.prcsRate`(실현 사용률 = 처리인원/처리용량)는
  다른 값이다. 둘을 합치지 않는다.

---

## 2. 표준화의 전제 — 재고(stock)와 유량(flow)

이 설계 전체가 슬라이드 2의 한 문장 위에 서 있다.

> 대기인원 L_q 은 유입인원과 유출인원이 관측된 시간에서 유동적이다.

6:10 에 10명, 6:20 에 10명이어도 그 사이에 5명이 들어오고 5명이 나갔다면 λ 는 0이 아니다.
따라서 **관측값마다 시간축에 붙는 방식이 다르다**는 것을 입력 표준이 명시해야 한다.

| 측정 종류 | 뜻 | 시간 귀속 | 합산 규칙 | 예 |
|---|---|---|---|---|
| `STOCK` | 그 순간의 재고량 | **시점** | 시각 내 노드 합산만. **시간축으로 SUM 금지** | 대기열 길이 `L_q` |
| `FLOW` | 구간 동안의 누계 | **구간** | 시간축 SUM 가능 | Desk 떠난여객, `FinishedClients_Abs` |
| `RATE` | 순간 속도 | **시점** | 가중평균만 | Desk 유출속도 (PAX/hour) |

AGENTS.md 가 기록한 기존 버그(`retrieveWaitPsgList` 가 순간 재고인 대기인원을 한 시간 안에서 SUM)가
정확히 이 구분이 없어서 났다. **어댑터는 모든 필드에 `MeasureKind` 를 선언해야 하고, 코어는 종류를
보고만 집계한다.**

또 하나, 관측 시각이 구간의 어느 쪽인지도 원천마다 다르다.

- CAST `FinishedClients_Abs` 는 **구간 처리인원**이다 → 그 시각으로 **끝나는** 구간에 귀속(`END`).
- Xovis `생성시간` 은 스냅샷 시각이다 → `STOCK`/`RATE` 는 시점, 함께 실린 `Desk 떠난여객` 은
  직전 스냅샷 이후의 누계이므로 역시 `END`.

어댑터는 `IntervalAnchor`(`END` | `START`)를 반드시 선언한다. 이 값을 틀리면 λ 가 한 칸씩 밀린다.

---

## 3. 인터페이스 스펙

패키지는 CAST 와 분리한다.

```
aoms/pm/queue/
  model/      QueueObservation · QueueNodeKey · ObservationRole · MeasureKind
              QueueInterval · QueueIntervalMetrics · QueueSeries
              FacilityRecommendation · QualityFlag · QueueAnalysis
  spi/        QueueObservationSource · ServiceRateResolver
              QueueTargetPolicy · ObservationCorrector
  engine/     QueueAnalysisEngine · QueueNormalizer
              FluidQueueEngine · ErlangCEngine
  adapter/
    cast/     CastQueueObservationSource
    xovis/    XovisQueueObservationSource
```

의존 방향은 `adapter → spi → model ← engine` 한 방향뿐이다. `engine` 은 어떤 어댑터도 모른다.

### 3.1 입력 표준 — 정규 관측 모델

원천 1행을 이 형태로 옮긴다. Xovis 표의 `Desk/Queue` 컬럼이 그대로 `ObservationRole` 이 된다.

```java
public enum ObservationRole {
    /** 대기열 관측 — 대기인원·대기시간을 싣는다 */
    QUEUE,
    /** 서버(Desk·부스·게이트) 관측 — 개방여부·유출속도·처리인원을 싣는다 */
    SERVER
}

public enum MeasureKind { STOCK, FLOW, RATE }

public enum IntervalAnchor { END, START }
```

```java
/** 노드 = 대기행렬 1줄. 같은 줄에 서는 여객이 같은 노드다 */
public final class QueueNodeKey {
    private final String tmnlId;      // 'T1' | 'T2'
    private final FcltGroup fcltGroup;// CHKN | DEP | SC | CMRC
    private final String areaCd;      // 아일랜드 · 출국장 등 구역
    private final String queueId;     // 대기열ID. 구역에 줄이 하나면 areaCd 와 같다
}
```

```java
public final class QueueObservation {
    private final QueueNodeKey node;
    private final LocalDateTime obsvDt;
    private final ObservationRole role;
    private final String serverId;          // SERVER 일 때만. QUEUE 는 null

    // QUEUE (role == QUEUE)
    private final Integer queueLength;      // STOCK · L_q
    private final Integer avgWaitSec;       // STOCK · W_q, 없으면 null

    // SERVER (role == SERVER)
    private final Boolean open;             // Desk 사용여부
    private final BigDecimal outRatePerHour;// RATE · Desk 유출속도 (PAX/hour)
    private final Integer departedCount;    // FLOW · Desk 떠난여객
    private final BigDecimal avgServiceSec; // RATE · 평균 처리시간, 없으면 null
}
```

**설계 의도** — 모든 측정 필드가 `null` 을 허용한다. 슬라이드가 말한
"없는 요소는 갖고 있는 정보로 나머지를 도출해야 함"이 여기서 성립한다. 어떤 원천도 4요소를 다 주지
않는다는 것이 전제다. 무엇이 비었는지는 다음 클래스가 선언한다.

```java
public final class QueueObservationBatch {
    private final String sourceId;              // "CAST" | "XOVIS"
    private final IntervalAnchor anchor;
    private final Set<Capability> capabilities; // 원천이 실제로 채우는 필드
    private final List<QueueObservation> observationList;
}

public enum Capability {
    QUEUE_LENGTH, AVG_WAIT, SERVER_OPEN, OUT_RATE, DEPARTED, AVG_SERVICE
}
```

`capabilities` 는 문서용이 아니라 **검증용**이다. 코어는 선언에 없는 필드를 읽지 않고, 선언했는데
비어 있으면 `QualityFlag` 를 남긴다. 어댑터가 조용히 반쪽만 채우는 사고를 여기서 잡는다.

### 3.2 원천 SPI

```java
public interface QueueObservationSource {
    String sourceId();
    Set<Capability> capabilities();
    IntervalAnchor anchor();

    QueueObservationBatch fetch(QueueQuery query);
}

public final class QueueQuery {
    private final String tmnlId;
    private final FcltGroup fcltGroup;
    private final String baseYmd;
    private final String scenarioId;   // CAST 는 smltId, Xovis 는 null
}
```

`scenarioId` 하나로 CAST 의 `smltId` 와 Xovis 의 "시나리오 없음"을 함께 받는다. 코어는 이 값을
로그·캐시 키로만 쓰고 해석하지 않는다.

### 3.3 정책 SPI

계산 규칙 중 **현장 사정에 따라 달라지는 것**만 밖으로 뺀다. 나머지는 코어에 고정한다.

```java
/** μ 를 찾지 못했을 때의 대체 순서. 원천마다 다르다 */
public interface ServiceRateResolver {
    BigDecimal resolve(QueueInterval interval, QueueSeriesContext context);
}

/** 목표 대기인원과 목표 시간 */
public interface QueueTargetPolicy {
    BigDecimal targetQueue(QueueNodeKey node);  // 기본: 혼잡등급 NORMAL 상한
    int targetClearMin(QueueNodeKey node);      // 기본: 30
    int leadMin(QueueNodeKey node);             // 기본: 10 (시설 개방 소요)
}

/** 이상값 보정 — 슬라이드 3의 붉은 주의사항 */
public interface ObservationCorrector {
    CorrectionResult correct(QueueInterval interval, QueueSeriesContext context);
}
```

`QueueTargetPolicy` 의 기본 구현은 `CgnGradeScale.getNormalMax()` 를 읽는다. **220 같은 상수를 코드에
쓰지 않는다** — 기준정보가 없으면 조회 실패로 떨어뜨린다 (AGENTS.md §13).

### 3.4 산출 표준

```java
/** 구간 1칸의 가공 데이터 — "없던 정보를 도출한" 결과가 여기 모인다 */
public final class QueueIntervalMetrics {
    private final QueueNodeKey node;
    private final LocalDateTime bgnDt;
    private final int itvlMin;

    private final int queueLength;          // L_q  (관측 또는 보정)
    private final int processedCount;       // 구간 처리인원
    private final int openCount;            // s
    private final BigDecimal arrivalRate;   // λ
    private final BigDecimal serviceRate;   // μ
    private final BigDecimal offeredLoad;   // a = λ/μ
    private final BigDecimal loadRate;      // ρ = a/s
    private final BigDecimal drainRate;     // s·μ − λ
    private final Integer avgWaitSec;       // W_q, 없으면 null

    private final Confidence confidence;    // HIGH | MEDIUM | LOW
    private final List<QualityFlag> flagList;
}

public final class FacilityRecommendation {
    public static final FacilityRecommendation NONE = ...;

    private final Integer reqCnt;         // 총 소요 시설수. 산정 불가면 null
    private final Integer cgnClearMin;    // 해소 경과 분. 산정 불가면 null
    private final BigDecimal drainRate;   // 추천 적용 후 배수율
    private final ReasonCode reasonCode;  // null 인 이유
}

public enum ReasonCode {
    OK,
    NO_OPEN_FACILITY,      // s = 0
    NO_SERVICE_RATE,       // μ 를 어떤 경로로도 못 구함
    ALREADY_UNDER_TARGET,  // 이미 목표 이하 (reqCnt = 현재 s)
    LEAD_EXCEEDS_TARGET    // leadMin ≥ targetClearMin
}
```

```java
public final class QualityFlag {
    private final QualityCode code;
    private final Severity severity;   // INFO | WARN
    private final String detail;       // 노드·시각·원천값
}
```

**`reqCnt` 는 추가 수량이 아니라 현재 운영분을 포함한 총 소요 수량이다** (AGENTS.md §3 예외 1건에서
확정된 의미). 보유 시설수보다 커도 자르거나 숨기지 않는다.

### 3.5 엔진 인터페이스

슬라이드 1이 짚은 문제 —
"이 모형은 비정상 상황(유입량 > 처리량) 경우 대기시간이 발산함. 계산 대안 필요" —
때문에 **엔진을 두 개로 나누고 역할을 못박는다.**

```java
public interface QueueAnalysisEngine {
    QueueAnalysis analyze(QueueSeries series, QueueTargetPolicy policy);
}
```

| 엔진 | 모형 | 유효 조건 | 쓰는 곳 |
|---|---|---|---|
| `FluidQueueEngine` | 결정론적 유체근사 (배수율) | 항상 | **추천 시설수 · 해소시간의 근거** |
| `ErlangCEngine` | M/M/s 정상상태 | `ρ < 1` 일 때만 | 대기확률 `C(s,a)` · 정상상태 `W_q` 참고지표 |

**추천은 반드시 `FluidQueueEngine` 이 낸다.** Erlang C 는 ρ ≥ 1 에서 발산하고, 발산하지 않을 때조차
"이미 쌓인 138명"을 모른다 — 정상상태 평균이라 백로그 개념이 없다. §6.3 의 실제 수치가 이 차이를
보여준다. Erlang C 값은 `stable = false` 면 응답에서 `null` 로 비운다.

---

## 4. 가공 데이터 산출 규칙

원천 → 구간 정규화(`QueueNormalizer`) → 지표 산출 순서다.

### 4.1 구간 정규화

1. 관측을 `(node, obsvDt)` 로 묶는다.
2. 인접한 관측 시각의 간격을 그 구간의 `itvlMin` 으로 삼는다. 마지막 구간은 직전 간격을 물려받는다.
3. `anchor` 가 `END` 면 구간은 `[이전 시각, 이 시각]`, `START` 면 `[이 시각, 다음 시각]` 이다.
4. **꼬리 구간을 붙인다.** 마지막 결과 시각 이후 자정까지 유입 0 인 구간을 만들어 남은 Queue 를
   흘려보낸다. 빼면 마지막 대기인원이 24:00 까지 서 있게 된다 (기존 `addTailInterval` 과 동일).

### 4.2 운영 시설수 `s`

슬라이드 2의 정의를 그대로 옮긴다.

> 같은 시간대 같은 island 에 같은 큐id 로 Desk 에서 유출속도가 0보다 크고 DeskOpen 이 사용(1)인 경우 카운트

```
s[t] = COUNT( SERVER 관측 WHERE node 동일 AND open = true AND outRatePerHour > 0 )
```

- `outRatePerHour` 가 없는 원천(CAST)은 `departedCount > 0 OR queueLength > 0` 으로 대체한다.
  이 대체는 어댑터가 아니라 코어가 `capabilities` 를 보고 고른다.
- **배정 시간표가 있으면 그것과 `MAX` 를 취한다.** 배정 밖인데 결과가 있으면 운영으로 보고
  `QualityFlag(BOOTH_OUT_OF_SCHEDULE, WARN)` 을 남긴다 (기존 계산기 동작 유지).
- `open = true` 인데 `outRatePerHour = 0` 인 상태가 연속 `N` 구간(기본 3) 지속되면 유휴로 보고
  `s` 에서 빼되 `IDLE_SERVER` 플래그를 남긴다. 열려만 있고 일하지 않는 데스크를 처리능력으로
  세면 μ 가 낮게, s 가 높게 잡혀 추천이 과소산정된다.

### 4.3 처리량 `μ`

슬라이드 3의 정의가 1순위다.

> 평균 처리량 = … 데스크의 시간당 여객 유출 속도(outPaxRateDesk)를 합산하여 활성된 운영시설수로 나눔

```
μ[t] = ( Σ outRatePerHour(활성 Desk) / 60 ) / s[t]      (명/분/대)
```

원천에 유출속도가 없으면 아래 순서로 내려간다. **순서를 바꾸지 않는다.**

| 순위 | 경로 | 식 |
|---|---|---|
| 1 | 원천 유출속도 | `Σ outRatePerHour / 60 / s` |
| 2 | 원천 평균 처리시간 | `60 / avgServiceSec` |
| 3 | 같은 노드 최근 60분 처리인원 가중평균 처리시간 | `60 / weightedAvgServiceSec` |
| 4 | 같은 터미널·시설군 당일 가중평균 처리시간 | `60 / tmnlAvgServiceSec` |
| 5 | 관측 처리량 역산 | `processedCount / itvlMin / s` |
| — | 모두 실패 | `μ = null` → 추천 `NONE(NO_SERVICE_RATE)` + `WARN` |

3·4순위는 기존 `ChknQueueCalculator.resolvePrcsSec` 의 fallback 사슬 그대로다. 1·2순위가 Xovis 를
위해 앞에 붙었을 뿐이다.

### 4.4 유입량 `λ`

원천이 유입을 주지 않으므로 역산한다. 슬라이드 2의 식이다.

```
ΔL[t] = L_q[t] − L_q[t−1]
outflow[t] = Σ departedCount(같은 노드의 모든 Desk)
λ[t] = MAX(0, ΔL[t] + outflow[t]) / itvlMin        (명/분)
```

- 첫 구간의 `L_q[t−1]` 은 0으로 본다.
- 음수 유입은 0으로 보정하고 원천값과 함께 로그를 남긴다 (`NEGATIVE_ARRIVAL`).
  대기열 이탈·관측 누락·구역 재배치가 실제로 일어나므로 음수는 드물지 않다.
- `outflow` 가 없는 원천은 `processedCount` 로 대체한다.

**Little's Law 로 교차검증한다.**

```
λ̂[t] = L_q[t] / (W_q[t] / 60)              (W_q 초 → 분)
residual = |λ[t] − λ̂[t]| / MAX(λ[t], λ̂[t])
```

`W_q` 가 있는 구간에서만 계산하고, `residual` 이 임계(기본 0.30)를 넘으면 값을 바꾸지 않고
`Confidence` 만 `LOW` 로 낮춘다. **검증은 신뢰도 표시용이지 보정용이 아니다** — 어느 쪽이 맞는지
판단할 근거가 없는데 덮어쓰면 원인이 사라진다.

### 4.5 파생 지표

```
a[t] = λ[t] / μ[t]                    (에를랑, 시설수와 무관한 일의 양)
ρ[t] = a[t] / s[t]                    (부하)
drainRate[t] = s[t]·μ[t] − λ[t]       (배수율, 명/분)
```

- `drainRate ≤ 0` → 현재 시설로는 대기열을 해소할 수 없다. 슬라이드 2가 명시한 조건이다.
- `ρ ≥ 1` → `ErlangCEngine` 결과를 비운다 (`stable = false`).

---

## 5. 추천 시설수와 해소시간

### 5.1 표준 식

슬라이드 3의 식은 리드타임을 0으로 본 형태다.

```
s ≥ { (L_q / T) + λ } / μ
```

실제로는 시설을 여는 데 시간이 걸린다. 기존 대시보드가 `RECOMMEND_LEAD_MIN = 10` 으로 쓰던 값이
그것이다. 두 가지를 하나로 합친 **표준 식**을 쓴다.

```
D = leadMin,  T = targetClearMin,  L* = targetQueue

# 1. 리드타임 동안은 현재 시설수 s₀ 로만 버틴다
L_D = MAX(0, L_q + (λ − s₀·μ)·D)

# 2. 남은 (T − D) 분 안에 L_D 를 L* 이하로 낮춘다
s_req = CEIL( { (L_D − L*) / (T − D) + λ } / μ )

# 3. 추천을 적용했을 때의 실제 해소시간
cgnClearMin = CEIL( D + (L_D − L*) / (s_req·μ − λ) )
```

- `D = 0` 이면 슬라이드 3의 식과 정확히 같아진다. **슬라이드 식은 이 표준의 특수해다.**
- `L_D ≤ L*` 이면 `reqCnt = s₀`, `cgnClearMin = 0`, `ReasonCode.ALREADY_UNDER_TARGET`.
- `T ≤ D` 이면 산정 불가 (`LEAD_EXCEEDS_TARGET`). 목표 시간이 개방 소요보다 짧으면 어떤 수량으로도
  못 맞춘다.
- `μ = null` 또는 `s₀ = 0` 이면 `NONE`. **화면은 `-` 로 그린다.**
- `s_req` 를 보유 시설수로 **자르지 않는다.** "13대가 필요한데 10대뿐"이라는 사실 자체가 정보다.

### 5.2 λ 를 어느 시점 값으로 쓰나

`λ` 는 시간에 따라 변한다. 표준 식은 향후 `T` 분 동안의 λ 를 필요로 하므로, **선택 시각 기준
향후 `T` 분 구간의 λ 중 최댓값**을 쓴다.

- 예측 원천(CAST)은 미래 구간이 있으므로 실제 값을 쓴다.
- 관측 원천(Xovis)은 미래가 없으므로 **직전 구간 λ 를 유지(persistence)** 한다.
  가정을 바꿀 수 있게 `ArrivalForecast` 를 정책으로 두되, 기본 구현은 persistence 하나다.
  이동평균·요일 프로파일은 근거가 확보된 뒤에 더한다.

λ 를 최댓값으로 잡는 이유는 안전측이기 때문이다. 평균으로 잡으면 피크 구간에서 추천이 모자란다.

### 5.3 기존 궤적 방식과의 관계

기존 `FcltRecommendationCalculator` 는 분 단위 Queue 궤적을 훑어 피크를 찾고
`extraCnt = CEIL((peak − target) / (μ·D))` 로 계산한다. 표준 식과 다른 점은 **λ 가 식에 없다**는 것이다.
리드타임 동안 쌓이는 양은 궤적이 이미 반영하지만, 추천 이후 계속 들어오는 유입은 반영하지 않는다.

→ 표준 식으로 통일한다. 궤적은 버리지 않고 **검증에 쓴다**: 산출한 `s_req` 로 궤적을 다시 흘려
`cgnClearMin` 안에 실제로 `L*` 이하가 되는지 확인하고, 어긋나면 `RECOMMEND_TRAJECTORY_MISMATCH`
플래그를 남긴다. 식과 시뮬레이션이 갈리는 지점을 놓치지 않기 위해서다.

**이 변경은 기존 대시보드·터미널맵 추천값을 바꾼다.** §8.3 참고.

### 5.4 Erlang C (참고지표)

`ρ < 1` 일 때만 계산한다. Erlang B 재귀로 안정적으로 구한다.

```
B(0, a) = 1
B(n, a) = a·B(n−1, a) / (n + a·B(n−1, a))

C(s, a) = B(s, a) / (1 − ρ·(1 − B(s, a)))
W_q     = C(s, a) / (s·μ − λ)
```

계승을 직접 쓰지 않는다 — `s` 가 20을 넘는 순간 `double` 이 넘친다. 재귀형은 넘치지 않는다.

---

## 6. 어댑터 매핑

### 6.1 Xovis

슬라이드 1의 수신 데이터 표가 그대로 대응된다.

| Xovis 컬럼 | 정규 필드 | Role | Kind |
|---|---|---|---|
| 생성시간 | `obsvDt` | — | — |
| 아일랜드 | `node.areaCd` | — | — |
| Desk/Queue | `role` | — | — |
| 대기열ID | `node.queueId` | — | — |
| 대기열 길이 | `queueLength` | QUEUE | STOCK |
| 대기시간(Sec) | `avgWaitSec` | QUEUE | STOCK |
| Desk 사용여부 | `open` | SERVER | — |
| Desk 유출속도(PAX/hour) | `outRatePerHour` | SERVER | RATE |
| Desk 떠난여객 | `departedCount` | SERVER | FLOW |

```
capabilities = { QUEUE_LENGTH, AVG_WAIT, SERVER_OPEN, OUT_RATE, DEPARTED }
anchor = END
```

`avgServiceSec` 이 없으므로 μ 는 §4.3 의 1순위(유출속도)로 곧장 구해진다.
`serverId` 는 Desk 식별자를 쓴다. 표에 별도 컬럼이 없으면 `아일랜드+대기열ID+행순번`으로 만들되,
**같은 스냅샷 안에서 안정적이어야** `s` 카운트가 흔들리지 않는다 (§9 미결).

### 6.2 CAST

기존 `ChknQueueRawDto` 를 그대로 옮긴다.

| CAST 필드 | 정규 필드 | Role | Kind |
|---|---|---|---|
| `smltActlDt` | `obsvDt` | — | — |
| `island` | `node.areaCd` | — | — |
| `psgFcltCd` | `serverId` | SERVER | — |
| `wtngPsgCnt` (`QueueLength_Current`) | `queueLength` | QUEUE | STOCK |
| `trnstPsgCnt` (`FinishedClients_Abs`) | `departedCount` | SERVER | FLOW |
| `prcsHr` | `avgServiceSec` | SERVER | RATE |
| `wtngHr` | `avgWaitSec` | QUEUE | STOCK |
| 배정 시간표 (`UserConfigChknDto`) | `open` | SERVER | — |

```
capabilities = { QUEUE_LENGTH, AVG_WAIT, DEPARTED, AVG_SERVICE, SERVER_OPEN }
anchor = END
```

CAST 는 부스별 행 하나가 QUEUE 와 SERVER 를 겸한다. 어댑터가 **1행을 관측 2건으로 쪼갠다.**
`QueueLength_Current` 가 부스별 독립 값이고 `FinishedClients_Abs` 가 누계가 아닌 구간 처리인원이라는
두 전제는 그대로 유지된다 (AGENTS.md §13).

Queue 대상은 유인 카운터 `CC` 뿐이라는 규칙도 어댑터의 조회 조건으로 남는다 — `CK`·`SBD` 는
자원 정보로만 쓰고 관측으로 만들지 않는다.

### 6.3 적합성 검증 벡터 (conformance vector)

**어댑터를 새로 붙일 때 이 수치가 재현되어야 한다.** 아일랜드 C, 대기열 3, 10분 구간 기준.

입력
```
L_q(직전) = 0,  L_q(현재) = 138,  Σ departedCount = 30,  itvlMin = 10
활성 Desk = 3대,  각 outRatePerHour = 240
L* = 10 (목표 대기인원),  T = 30분
```

산출
```
λ = (138 − 0 + 30) / 10          = 16.8 명/분
μ = (3 × 240 / 60) / 3           =  4.0 명/분/대
s = 3
a = 16.8 / 4.0                   =  4.2 erlang
ρ = 4.2 / 3                      =  1.4   → 발산. Erlang C 계산 안 함
배수율 = 3 × 4.0 − 16.8          = −4.8 명/분  → 현재 시설로 해소 불가
```

추천 (`D = 0`, 슬라이드 식과 동일)
```
s_req = CEIL( ((138 − 10)/30 + 16.8) / 4.0 ) = CEIL(5.27) = 6대
배수율(6대) = 24 − 16.8 = 7.2
cgnClearMin = CEIL((138 − 10) / 7.2) = 18분
```

추천 (`D = 10`, 기존 대시보드와 같은 리드타임)
```
L_D   = 138 + (16.8 − 12)×10 = 186명
s_req = CEIL( ((186 − 10)/20 + 16.8) / 4.0 ) = CEIL(6.4) = 7대
배수율(7대) = 28 − 16.8 = 11.2
cgnClearMin = CEIL(10 + (186 − 10)/11.2) = CEIL(25.71) = 26분
```

참고지표 (6대 기준, `ρ = 16.8/24 = 0.7 < 1` 이라 계산 가능)
```
B(6, 4.2) = 0.1318
C(6, 4.2) = 0.1318 / (1 − 0.7×(1 − 0.1318)) = 0.3360   → 대기확률 33.6%
W_q       = 0.3360 / 7.2 = 0.047분 ≈ 2.8초
```

**여기서 Erlang C 의 `W_q` 2.8초와 유체근사의 해소시간 18분이 동시에 나온다.** 둘 다 맞다 —
Erlang C 는 "백로그가 없는 정상상태의 평균 대기", 유체근사는 "지금 서 있는 138명을 빼는 데 걸리는
시간"이다. **추천과 해소시간에 Erlang C 를 쓰면 안 되는 이유**가 이 두 숫자다.

---

## 7. API·화면 인터페이스

### 7.1 엔드포인트

전부 `POST`. 원천 중립이므로 prefix 를 `/pm/queue` 로 새로 둔다.

| 상수 | 경로 | 용도 |
|---|---|---|
| `QUEUE_METRICS` | `/pm/queue/retrieveQueueMetrics` | 노드별 구간 지표 (하루치) |
| `QUEUE_RECOMMEND` | `/pm/queue/retrieveFcltRecommend` | 선택 시각의 추천 시설수 |

> **확인 필요** — 기존 31개 엔드포인트는 전부 `/pm/cast` prefix 다. 원천 중립성을 이름에 드러낼지
> (`/pm/queue`), 배포·프록시 설정 일관성을 택할지(`/pm/cast/queue`) 결정이 필요하다.
> `vite.config.ts` 의 dev 프록시는 `/pm` 전체를 넘기므로 프론트 설정 변경은 어느 쪽도 없다.

요청
```jsonc
{
  "sourceId": "CAST",        // "CAST" | "XOVIS"
  "scenarioId": "20260910",  // CAST 는 smltId, Xovis 는 생략
  "tmnlId": "T1",
  "fcltGroup": "CHKN",
  "baseYmd": "20260910",
  "hhmm": "0620",            // 추천 조회에만
  "areaCd": "C"              // 추천 조회에만
}
```

`sourceId` · `fcltGroup` 문자열은 기존 enum 규약(`'T1'|'T2'`, `'CHKN'|'DEP'|'SC'|'CMRC'`)을 따른다.

### 7.2 응답 DTO

```ts
export interface QueueMetricsDto {
    areaCd: string;
    queueId: string;
    slotList: QueueSlotDto[];
}

export interface QueueSlotDto {
    hhmm: string;
    itvlMin: number;
    wtngPsgCnt: number;      // L_q
    prcsPsgCnt: number;
    oprFcltCnt: number;      // s
    arvlRate: number;        // λ 명/분, 소수 2자리
    srvcRate: number;        // μ 명/분/대, 소수 2자리
    offeredLoad: number;     // a
    loadRate: number;        // ρ, 0~100
    drainRate: number;       // 배수율 명/분
    avgWtngSec: number | null;
    wtngProbRate: number | null;  // C(s,a) 0~100. ρ ≥ 1 이면 null
    cgnGradeCd: string;      // 기존 혼잡등급 코드
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface FcltRecommendDto {
    reqCnt: number | null;       // 총 소요 시설수
    cgnClearMin: number | null;
    drainRate: number | null;
    reasonCd: string;            // ReasonCode
}
```

- 화면은 `reqCnt == null` 이면 `-` 로 그린다. `reasonCd` 는 툴팁·로그용이다.
- `confidence` 는 CSS 결합값이 아니라 데이터다. 배지 표기는 뷰모델에서 정한다.
- **`FcltRecommendDto.reqCnt` 는 이미 존재하는 이름·의미를 그대로 재사용한다** (AGENTS.md §3).

### 7.3 화면 배치

기존 아키텍처(`types.ts → view.ts → hooks/use*Data.ts → <Page>.tsx → components/*`)를 그대로 따른다.
DTO → 뷰모델 변환은 전부 `view.ts` 에 모은다.

- **체크인카운터 상세** — 표에 λ·μ·배수율 컬럼을 더하고, 추천 카드에 `reqCnt`/`cgnClearMin` 을 그린다.
- **터미널맵 마커 팝업** — 이미 `reqCnt`·`cgnClearMin` 을 그린다. 값의 출처만 바뀐다.
- **대시보드 체크인 카드** — 동일.

**같은 `scenarioId` · 터미널 · `hhmm` 에서 세 화면의 값이 어긋나면 버그다.** 세 화면이 같은
서비스 결과를 나눠 읽는다는 §13 규칙은 유지된다.

---

## 8. 보정·검증 규칙

슬라이드 3의 붉은 주의사항이 요구하는 기능이다.

> Xovis 같은 시간대별 관측값은 스냅샷 같은 것으로 … 100% 정확한 값이 나올 수 없으니,
> 검증하면서 특이값을 어떻게 처리할 지 보정하는 기능을 추가하여야 함

### 8.1 규칙표

| 코드 | 조건 | 조치 | 심각도 | 신뢰도 |
|---|---|---|---|---|
| `NEGATIVE_ARRIVAL` | `ΔL + outflow < 0` | λ = 0 | WARN | LOW |
| `QUEUE_JUMP` | `\|ΔL\|` 가 직전 5구간 표준편차의 4배 초과 | 값 유지 + 표시 | WARN | LOW |
| `LITTLE_MISMATCH` | Little's Law residual > 0.30 | 값 유지 | INFO | MEDIUM |
| `IDLE_SERVER` | `open = true` 이고 `outRate = 0` 연속 3구간 | `s` 에서 제외 | INFO | — |
| `BOOTH_OUT_OF_SCHEDULE` | 배정 시간 밖인데 결과 존재 | 운영으로 포함 | WARN | — |
| `NO_SERVICE_RATE` | μ fallback 전부 실패 | 처리용량 0, 추천 `NONE` | WARN | LOW |
| `MISSING_INTERVAL` | 관측 간격이 표준의 2배 초과 | 구간 유지, 보간 안 함 | INFO | MEDIUM |
| `DUPLICATE_OBSERVATION` | 같은 `(node, obsvDt, serverId)` 중복 | 마지막 행 채택 | WARN | — |
| `CAPABILITY_GAP` | 선언한 capability 가 비어 있음 | 해당 필드 무시 | WARN | MEDIUM |

### 8.2 원칙

- **보정은 값을 바꾸는 것과 신뢰도를 낮추는 것을 구분한다.** λ 음수 클램프처럼 물리적으로 불가능한
  값만 바꾸고, 판단 근거가 없는 것(Little's Law 불일치)은 신뢰도만 낮춘다.
- **보간하지 않는다.** 결측 구간을 채우면 없던 여객이 생긴다. 구간을 그대로 두고 표시한다.
- 모든 플래그는 서버 로그와 응답 `flagList` 양쪽에 남긴다. 로그에만 남기면 화면에서 왜 `-` 인지
  알 수 없다.
- 스무딩·이동평균을 **기본값으로 켜지 않는다.** 켜면 피크가 깎여 추천이 과소산정된다. 필요하면
  `ObservationCorrector` 구현체로 명시적으로 붙인다.

### 8.3 기존 값 변화 — 확인 필요

§5.3 대로 표준 식을 채택하면 **현재 화면에 나오는 `reqCnt` · `cgnClearMin` 이 바뀐다.**
λ 항이 새로 들어가므로 유입이 많은 피크 시간대에는 추천 수량이 **늘어난다** (§6.3 예시에서
기존 방식 대비 리드타임 동일 조건에서 7대). 운영에 그대로 반영할지, 신·구 값을 한동안 병기해
비교할지 결정이 필요하다.

---

## 9. 미결 사항

1. **Xovis 원천의 물리 스키마·수신 경로가 확정되지 않았다.** 테이블인지 API 인지, 스냅샷 주기가
   고정인지(표는 10분 간격으로 보인다), Desk 식별자 컬럼이 있는지 확인이 필요하다.
   §6.1 의 `serverId` 생성 규칙은 그 전까지 잠정이다.
2. **Xovis 의 `Desk 떠난여객` 이 누계인지 구간값인지 확정되지 않았다.** 표의 6:50→7:00 이 `1 → 4`
   인데, 누계면 구간 처리인원은 3명이고 구간값이면 4명이다. **λ 가 통째로 달라지는 값**이므로
   원천 확인이 최우선이다. 확인 전까지 어댑터에 `cumulative` 플래그를 두고 양쪽을 지원한다.
3. **대기열ID 와 아일랜드의 관계** — 한 아일랜드에 여러 줄이 서면 노드를 줄 단위로 잡아야 하는데,
   CAST 는 아일랜드 단위로만 결과를 낸다. 두 원천의 노드 입도가 다르면 비교가 성립하지 않는다.
4. **`fcltGroup` 확장** — 현재 공용 Queue 는 체크인만 계산한다. 출국장·보안검색대는 원천 구조가
   달라(`retrieveMapRsltDayList` 공용 경로) 어댑터를 따로 검토해야 한다. 이 문서의 표준은
   시설군에 중립이지만, 어댑터는 시설군마다 필요하다.
5. **`ArrivalForecast` 의 기본 가정** — Xovis 관측 원천에서 향후 30분 λ 를 persistence 로 두는 것이
   충분한지 실측 검증이 필요하다.

---

## 10. 단계 계획

소스 변경은 아직 하지 않는다. 착수 시 순서만 정해 둔다.

| 단계 | 내용 | 검증 |
|---|---|---|
| 1 | `aoms.pm.queue.model` · `spi` 인터페이스 정의 | 컴파일 (실 백엔드 레포) |
| 2 | `QueueNormalizer` + `FluidQueueEngine` + `ErlangCEngine` | §6.3 검증 벡터 재현 |
| 3 | `CastQueueObservationSource` 어댑터 | 기존 `ChknQueueDay` 결과와 대조 |
| 4 | `ChknQueue*` 를 신규 코어 위임으로 교체 | 대시보드·맵·상세 값 일치 확인 |
| 5 | API·DTO·화면 필드 추가 | `npx tsc -b` · `npx eslint .` |
| 6 | `XovisQueueObservationSource` 어댑터 | §9 확정 후 |

3단계에서 **기존 결과와 대조**하는 것이 핵심이다. 값이 달라지는 지점이 §5.3 의 λ 항 하나뿐임을
확인해야 이관이 안전하다.

`java/` 는 참조 사본이라 이 레포에서 컴파일할 수 없다. Java 변경은 실제 백엔드 레포로 옮겨
컴파일·테스트해야 한다.
