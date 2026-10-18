# 시설 카드·체크인 추천 `domains/queue` 통합 계획

작성일: 2026-10-17
대상: 요약보기 시설 카드(체크인카운터·출국장), 맵형태보기 체크인 마커/팝업, 체크인 상세의 추천·혼잡해소 값

## 1. 목표와 범위

요약보기 카드의 대기열/예상인원 · 시간당 처리율 · 추천 개수 · 혼잡해소 예상을 혼잡해소 시나리오 팝업(§14)과
같은 `domains/queue` 계산으로 바꾼다. 카드를 열었을 때 보이는 숫자와 `+` 팝업의 첫 화면 숫자가 같아야 한다.

체크인 추천(`ChknQueueDay.recommendOf`)은 맵형태보기·체크인 상세와 공유하므로 **세 화면을 함께 교체**한다.
교체 후에는 `FcltRecommendationCalculator`(피크·리드타임 방식)를 쓰는 곳이 없어지므로 삭제한다.

범위 밖:

- 공용 Queue 자체(`ChknQueueCalculator` · `ChknQueueSeries`의 FIFO 코호트 계산)와 대기인원·혼잡등급 산식
- 팝업 API 계약(`FcltQueueScenarioDto`)과 팝업 화면
- 요약보기 시간대별 차트, 피크 영역, 출국장 상세 화면

## 2. 확정한 결정 (2026-10-17 인터뷰)

| 항목 | 결정 |
|---|---|
| 교체 범위 | 카드 + 맵형태보기 + 체크인 상세. `ChknQueueDay.recommendOf`를 교체해 세 화면이 같은 값을 쓴다 |
| 관측 구간 | 팝업과 같은 30분 슬롯 `[hhmm, hhmm+30)`. λ·μ·Q0·s를 여기서 뽑고 계산 기준시각은 슬롯 끝 |
| 추천 개수 | 팝업 기본값과 같다. 목표 해소시간 30분(`DFLT_TARGET_MIN`) + 안정 하한 `floor(λ/μ)+1` (`STABLE_MMS_FLUID_TARGET`) |
| 혼잡해소 예상 | **추천 수량을 적용했을 때**의 해소값. 팝업 TIME 모드 기본 시나리오와 같다 |
| 보유 수량 초과 | 추천 수량을 자르지 않고, 해소값도 추천 수량을 가정해 계산한다. 팝업의 `totScenario`는 팝업에서만 보여준다 |
| 시간당 처리율 | 중앙 숫자는 슬롯 처리인원의 시간당 환산(`getObservedThroughputPerHour`), 링은 부하율 ρ = λ/(s·μ) (`estimateLoadRatio`) |
| 출국장 예상인원·등급 | SC+SR 슬롯 끝 Q0. 카드 혼잡등급과 칩 색도 같은 값으로 낸다. LGT는 빠진다 |
| 산정 불가 | 그 값만 `-`로 표시한다. `FcltRecommendDto.reqCnt`는 nullable이 되고, 다른 카드와 다른 값은 그대로 그린다 |
| 혼잡해소 게이지 | `max(30 − 해소분, 0) / 30`. 해소분이 0이면 100%, 산정 불가면 0 |
| `domains/queue` 정리 | 구현을 마친 뒤 쓰지 않는 메서드·필드·클래스를 지운다. `FacilityQueueExample`도 지운다. **Little's Law 관련은 Xovis 실적에서 쓸 예정이라 남긴다** (4.7) |

## 3. 현재 구조와 바뀌는 점

| 항목 | 현재 카드 | 교체 후 (팝업과 동일) |
|---|---|---|
| 구간 | `hhmm`부터 앞으로 60분 (`RollingRange`) | `[hhmm, hhmm+30)`, 기준시각은 슬롯 끝 |
| 입력 | CAST 예측 궤적(앞으로 60분) | 슬롯 관측값. λ는 인원 보존식, μ는 평균 처리시간에서 구함 |
| 추천 | 리드타임 10분 뒤의 피크를 목표 이하로 낮추는 추가 수량 | 30분 안에 Q*까지 해소되는 수량, 안정 하한 적용 |
| 해소 | 추천 수량으로 궤적을 깎아 목표 이하가 되는 분 | 추천 수량에서 일정률 fluid로 Q*까지 걸리는 시간 |
| 체크인 카드 처리율 | 60분 처리인원 ÷ 60 (실제로는 분당 값) / `toPrcsRate(처리, 대기)` | 시간당 처리량 / ρ |
| 출국장 예상인원 | LGT+SC+SR, 60분 중 최댓값 | SC+SR, 슬롯 끝 Q0 |
| 출국장 실패 처리 | 추천 계산 예외가 요청 전체를 실패시킴 | 해당 값만 `-` |

## 4. 설계

### 4.1 공용 평가기

`CastFcltQueueScenarioServiceImpl`의 계산 부분(`toCalculator` · `toClear` · `applyRecommend` · `toStableMinCnt`)을
`domains/dsbd`의 상태 없는 클래스(가칭 `FcltQueueClearance`)로 옮긴다. 이 클래스가 받는 값과 돌려주는 값은 아래와 같다.

- 입력: `FcltQueueSource`, 목표 인원 `Q*`(NORMAL 상한의 정수 내림), 목표 해소시간(분)
- 출력:
  - λ, μ, ρ(현재 수량 기준), 시간당 처리량, 각 값의 `Computed`
  - 현재 수량 기준 해소값과 추천 정보(fluid, 안정 하한, 최종 `reqCnt`, 증감)
  - 추천 수량 기준 해소값과 목표 달성 여부

팝업 서비스와 카드·`ChknQueueDay`가 모두 이 클래스를 호출한다. 팝업의 COUNT 모드(사용자가 지정한 수량)는
평가기의 시나리오 계산 메서드를 수량만 바꿔 다시 부른다. 팝업 응답 값은 바뀌지 않아야 한다(회귀 기준).

`FcltQueueSource`에 처리완료 인원(`prcsPsgCnt`)을 추가하고 `toScenarioInput`에 실어 보낸다.
`getObservedThroughputPerHour`가 이 값을 쓴다.

### 4.2 원천 어댑터

**체크인**: 팝업의 `getChknSource`에서 DB 조회가 없는 부분을 `ChknQueueDay.sourceOf(island, bgnMinute, slotMin)`로
옮긴다. 배정 가능 최대 수량(시설 마스터 CC 수)은 팝업만 쓰므로, 팝업 서비스가 결과에 따로 붙인다.
추천 수량은 자르지 않으므로 카드·맵·상세에는 최대 수량이 필요 없다.

**출국장**: 팝업의 `getDepSource`는 출국장 하나마다 DB를 조회한다. 카드는 터미널 전체를 한 번에 그리므로
같은 로직을 **터미널 단위로 한 번 조회**하는 어댑터로 바꾼다.

- `retrieveRsltByUnitList`는 `[hhmm−10, hhmm+30)`, `SC`·`SR`, unitCd 전체로 한 번 조회한다
- `retrieveScrtyOpenCountList`와 시설 마스터도 각각 한 번씩만 조회한다

팝업은 같은 어댑터에서 출국장 하나만 꺼내 쓴다. 두 경로가 원천 해석(연속성 판정, 가중평균)을 따로 가지지 않게 한다.

### 4.3 체크인 추천 교체 (`ChknQueueDay.recommendOf`)

시그니처와 `ChknQueueRecommend(reqCnt, cgnClearMin)`은 그대로 둔다. 맵(`CastMapServiceImpl:299`)과
체크인 상세(`CastChknCounterServiceImpl:279`) 호출부는 고치지 않는다.

- 내부 계산은 `sourceOf` → 공용 평가기(목표 30분)로 바꾼다. `Q*`는 이미 갖고 있는 `gradeScale`의 NORMAL 상한을 쓴다
- `cgnClearMin` = 추천 수량 기준 해소 초를 분으로 **올림**한 값이다. 팝업 화면의 `ceilMinutes`와 같은 규칙이고,
  기준은 슬롯 끝이다
- `UNAVAILABLE` · `UNREACHABLE`이거나 하루를 넘으면 `null`을 낸다. 해소분이 이미 Q* 이하라 0분인 경우는 `0`이다
- `ChknQueueSeries.trajectoryOf`, `peakOf`, `RECOMMEND_SPAN_MIN`, `RECOMMEND_LEAD_MIN`은 사용처가 없어지면 삭제한다

### 4.4 카드 필드 매핑 (`DsbdFcltCardDto`)

| 필드 | 체크인 | 출국장 |
|---|---|---|
| `wtngPsgCnt` | 슬롯 끝 Queue (기존과 같음) | SC+SR 슬롯 끝 Q0 |
| `hrlyPrcsPsgCnt` | 슬롯 처리인원 × 60/30 (시간당, 반올림) | 같음 |
| `hrlyPrcsRate` | `round(ρ × 100)`. 100을 넘을 수 있고 화면 링은 1에서 꽉 찬다. 산정 불가면 0 | 같음 |
| `recommend.reqCnt` | 최종 총 소요 수량. 산정 불가면 `null` | 같음 |
| `recommend.needAssignYn` | 기존 규칙 유지: `reqCnt > 운영 부스 && targetNm 있음` | 기존대로 `'N'` |
| `cgnClearTime` | 슬롯 끝 + 추천 수량 해소 초(올림)의 `HHmm`. 산정 불가면 `''` | 같음 |
| `cgnClearRate` | `max(30 − 해소분, 0) / 30 × 100`. 산정 불가면 0 | 같음 |
| `cgnStatus`, 칩 색 | 슬롯 끝 Queue의 등급 (기존과 같음) | SC+SR 슬롯 끝 Q0의 등급 |
| 정렬 | 슬롯 끝 Queue 내림차순 (기존과 같음) | Q0 내림차순 |

카드 HHmm은 팝업의 `cgnClearDt`(yyyyMMddHHmmss)와 같은 계산을 거친 뒤 시각만 잘라 쓴다.
같은 입력에서 카드와 팝업의 시각이 1분이라도 어긋나지 않게 하려는 것이다.

### 4.5 공통 실패 처리

- 혼잡등급 기준정보가 없거나 겹치면 지금처럼 요청 전체를 실패시킨다(§13·§14와 같음)
- 그 밖에 출국장 하나의 원천이 부족해 생기는 계산 불가는 그 카드의 값만 비운다

### 4.6 기존 로직 정리

**바로 삭제** — 교체가 끝나면 쓰는 곳이 없어진다

- `service/FcltRecommendationCalculator.java` 전체. 지금은 출국장 카드와 `ChknQueueDay.recommendOf`만 쓴다
- `ChknQueueDay`의 `peakOf`, `RECOMMEND_SPAN_MIN`, `RECOMMEND_LEAD_MIN`
- `ChknQueueSeries.trajectoryOf` (`FcltRecommendationCalculator.QueuePoint`를 쓴다)
- `CastDsbdServiceImpl`의 출국장 추천 경로: `getPeakUnitTime`, `getTrajectory`, `getServiceRate`,
  `getAverageServiceRate`, `calculateRecommendation`, `toClearRate`, `getPriorSlotMap`, `PeakUnitTime`
- `CastDsbdServiceImpl.toChknClearRate`. 게이지 규칙이 4.4로 바뀐다

**사용처를 확인하고 삭제** — 카드 밖에서 쓰고 있으면 남긴다

- `domains/dsbd/RecommendationContext`, `RollingRange`. 지금은 `CastDsbdServiceImpl`만 쓴다
- 출국장 카드의 LGT 합산 경로(`displayUnitTimeMap` 등 표시용 집계). 출국장 카드가 LGT를 쓰지 않게 되면 삭제한다

**삭제가 아니라 이동**

- `CastFcltQueueScenarioServiceImpl`의 계산 메서드(`toCalculator`, `toClear`, `applyRecommend`, `toStableMinCnt`)를
  공용 평가기(4.1)로 옮긴다
- 원천 메서드(`getChknSource`, `getDepSource` 및 보조 메서드)를 원천 어댑터(4.2)로 옮긴다

**남김**: 공용 Queue 계산(`ChknQueueCalculator`, `ChknQueueSeries`의 FIFO 계산), `CgnGradeScale`,
`CastMapMapper#retrieveMapRsltDayList`

### 4.7 `domains/queue` 미사용 코드 정리 (구현 완료 후)

`domains/queue`에는 미리 만들어 두고 쓰지 않는 기능이 많다. **4.1~4.6을 모두 마친 뒤** 남은 호출 관계를
grep으로 다시 확인하고, 이 패키지에서 어디서도 쓰지 않는 메서드·필드·클래스를 지운다.
아래 목록은 2026-10-17 grep 기준의 후보이며, 최종 판단은 정리할 때의 사용처로 한다.

**구현 후에도 쓰는 것** (공용 평가기가 직접 부르거나, 그 메서드가 내부에서 부른다)

- `estimateArrivalRateByConservation` → `estimateArrivalPsgCnt`
- `estimateServiceRatePerHour`
- `estimateClearTimeSec` → `estimateNetDrainRatePerHour` → `estimateCapacityPerHour`, `estimateArrivalRatePerHour`
- `estimateNextArrivalWaitSec`, `analyzeErlangC`, `estimateRequiredServerCnt`
- 새로 쓰는 것: `estimateLoadRatio`, `getObservedThroughputPerHour`
- `getIntervalSeconds`

**삭제 후보 — 메서드**

- `FacilityQueueCalculator`
  - `getAvgSojournTimeSec`, `getWaitingTimeShare`, `getWaitingToServiceRatio`, `getQueuePersonSeconds`
  - `estimateAdditionalServerCnt`, `assessCapacityFeasibility`
  - `getObservedUtilization`, `getQueueGrowthRatePerHour`
- `ErlangCResult.estimateServiceLevel`

**삭제 후보 — 위 메서드를 지우면 따라서 쓸모없어지는 것**

- `FacilityQueueInput`의 필드
  - `busyServerTimeSec`, `availableServerTimeSec`: `getObservedUtilization` 전용
  - `totServerCnt`: `assessCapacityFeasibility`와 생성자 검증에서만 쓴다
- `CalculationMethod`에서 더는 생성되지 않는 값(`CAPACITY_COMPARISON` 등. **`LITTLE_LAW`는 제외**)
  - 이 enum은 `QueueMetricDto.method`로 화면에 나가고 `api.types.ts`의 `QueueCalcMethod` 유니온과 짝이다
  - 따라서 유니온에서도 같이 지우고, 팝업 화면에 그 값을 분기하는 코드가 없는지 확인한다

**보류 — Little's Law (2026-10-17 결정)**

Xovis 실적 기반 계산에서 쓸 가능성이 매우 높다. 실적은 유입 인원을 직접 세지 않을 수 있어서,
λ = Lq / Wq가 실적 유입률을 구하는 사실상 유일한 방법이다. 그래서 지금 쓰는 곳이 없어도 **지우지 않는다.**

- `estimateArrivalRatePerHour`의 Little's Law 분기
- `FacilityQueueInput.littleLawApplicable`
- `FacilityQueueCalculator` 빌더·필드 `avgQueuePsgCnt`, `avgWtngTimeSec`
  - Little's Law가 쓰므로 둔다
  - `FcltQueueSource`의 `avgQueuePsgCnt`, `avgWtngSec`와 어댑터에서 이 값을 만드는 집계도 같이 둔다
- `CalculationMethod.LITTLE_LAW`와 `QueueCalcMethod`의 `'LITTLE_LAW'`

Xovis 적용 전에 확인할 것:

- 현재 실적 조회 `retrievePsgWtngByHourList`는 `WTNG_LINE_LEN`의 시간별 최댓값만 읽는다.
  Little's Law에는 **시간평균** 대기인원과 **여객평균 대기시간**이 같은 구간에서 필요하다
- `TN_PM_PSG_WTNG_INFO`에 대기시간 컬럼이 있는지 확인한다. 이 레포에는 DDL이 없다

**삭제 — 클래스**

- `FacilityQueueExample.java`
  - 실행 진입점용 예제라 운영 코드가 쓰지 않는다
  - 지우기 전에 10장에서 쓸 검증 입력·기대값을 이 문서(10장)로 옮겨 적는다
- `QueueInputValidation`, `Computed`, `CalcOutcome`, `QueueDataSource`는 남은 코드가 쓰는 범위만 남긴다.
  위 정리 후 쓰지 않게 된 메서드가 있으면 같이 지운다

## 5. 계약 변경

| 대상 | 변경 |
|---|---|
| `FcltRecommendDto.reqCnt` / `api.types.ts` | `int` → `Integer`, `number` → `number \| null`. **이름은 유지한다(§3의 고정 필드)** |
| `DsbdFcltCardDto` | 필드 구성은 그대로다. `wtngPsgCnt`(출국장), `hrlyPrcsPsgCnt`, `hrlyPrcsRate`, `cgnClearTime`, `cgnClearRate`의 **의미**가 4.4대로 바뀐다 |
| `MapChknRsltDto` · `MapNoticeItemDto` · 체크인 상세의 `reqCnt` / `cgnClearMin` | 타입은 그대로다. 산식이 4.3으로 바뀐다 |

## 6. 화면 변경

- `dashboard/view.ts` `toFcltCardVariant`
  - `reqCnt === null`이면 `count: '-'`로 그린다
  - 처리율 캡션 `Pax/Hour`는 이제 실제 값과 맞는다
- `dashboard/types.ts`는 뷰모델 `count`가 문자열이라 바꿀 것이 없다
- 작업 트리에 있는 미커밋 변경(`FcltCard.tsx`에 `GaugeDonut` 내장, `view.ts` 캡션)을 **그대로 두고 그 위에 쌓는다**
- 목업
  - `dashboard` 카드 목업에 `reqCnt: null`인 카드를 하나 넣는다
  - 처리율 값을 시간당 규모로 맞춘다
  - 맵·체크인 상세 목업은 타입이 그대로라 고치지 않는다

## 7. 문서 갱신

- `AGENTS.md`
  - **§13**: 추천 `reqCnt` 산식 문단(리드타임 10분, 궤적, 피크)을 4.3의 공용 평가기 설명으로 바꾼다.
    "세 화면 일치" 규칙에 카드도 포함된다고 적는다
  - **§14**: "카드 추천과 팝업이 다를 수 있다"는 전제를 지우고, 카드가 팝업 기본값(30분 목표)과 같은 계산이라고 적는다
  - **§3**: `FcltRecommendDto.reqCnt`를 nullable로 바꾼 결정을 날짜와 함께 남긴다
- `docs/plans/2026-10-13-fclt-card-queue-popup.md` §1의 "기존 카드 … 함께 교체하지 않는다"에 이 문서로 대체됐다고 표시한다

## 8. 위험과 의미 변화

- **예측에서 현재 상태로 바뀐다.** 지금 카드는 CAST가 예측한 앞으로 60분의 궤적과 피크를 보고 추천한다.
  교체 후에는 현재 30분 슬롯이 그대로 이어진다고 가정한다. 그래서 곧 몰려올 피크를 미리 반영하지 못하고,
  Queue가 작다가 급증하는 구간에서는 추천이 지금보다 늦게 오른다. 결정된 사항이므로 화면이나 문서에서
  "현재 슬롯 기준"이라는 점이 드러나게 한다(카드 툴팁은 범위 밖. §13·§14 문서에는 반드시 적는다).
- 출국장 예상인원은 LGT가 빠지고 60분 최댓값이 슬롯 끝 스냅샷으로 바뀐다. 숫자가 눈에 띄게 줄 수 있다.
- ρ ≥ 1이면 처리율 링이 항상 꽉 찬다. 중앙 숫자(처리량)와 링(부하)이 서로 다른 지표라는 점을 확인한다.
- 해소 시각이 자정을 넘으면 `HHmm`만으로는 다음날임을 알 수 없다. 하루(86400초)를 넘으면 빈 값을 낸다(팝업과 같음).
- 맵·체크인 상세는 응답 하나에서 아일랜드 × 슬롯마다 `recommendOf`를 부른다. 평가기는 닫힌 식이라 비용은 작다.
  다만 `sourceOf`가 슬롯마다 시리즈를 다시 훑지 않는지 구현할 때 확인한다.

## 9. 구현 순서

1. **평가기 추출**: `FcltQueueClearance`를 만들고 팝업 서비스가 이를 쓰게 바꾼다. 팝업 응답은 바뀌지 않아야 한다.
2. **원천 어댑터**: `ChknQueueDay.sourceOf`와 출국장 터미널 단위 어댑터를 만든다. 팝업이 이를 쓰게 바꾼다.
3. **체크인 추천 교체**: `recommendOf`를 평가기로 바꾼다. 맵·체크인 상세는 자동으로 따라온다.
4. **카드 교체**: 체크인·출국장 카드가 4.4 매핑을 따르게 한다. `FcltRecommendDto.reqCnt`를 nullable로 바꾼다.
5. **기존 로직 정리**: 4.6의 대상을 grep으로 확인하고 삭제한다.
6. **화면·목업**: `api.types.ts`, `view.ts`, 목업을 고친다. `npx tsc -b`와 `npx eslint .`를 돌린다.
7. **문서**: 7장대로 갱신한다.
8. **`domains/queue` 정리**: 1~7과 Java 검증을 마친 뒤 4.7을 진행한다.
   - `FacilityQueueExample`의 검증 벡터는 이 단계에서 문서로 옮긴 뒤 클래스를 지운다
   - `CalculationMethod`를 줄였다면 `QueueCalcMethod` 유니온도 고치고 `npx tsc -b`를 다시 돌린다

## 10. 검증

- 이 저장소에서는 Java를 컴파일할 수 없다. Java 변경은 실제 백엔드 레포에서 빌드하고 단위 검증한다.
- **계산 벡터**: `FacilityQueueExample`과 2026-10-13 계획 §9.1 벡터로 평가기 출력이 팝업 기존 출력과 같은지 확인한다.
  `FacilityQueueExample`은 9장 8단계에서 지우므로, 그 전에 입력값과 기대값을 이 절에 표로 옮겨 둔다.

  **`FacilityQueueExample` 벡터** (2026-10-17 JDK 17 실행값과 대조. 클래스는 8단계에서 삭제, 남은 메서드 값은 정리 후 다시 대조)

  계산기 입력: 구간 10분(06:20~06:30), S=120초, Wq=600초, Lq=30명, Q0=40명.
  기본 조건 `current`: s=8, 최대수 10, Q 시작=35, 서비스 시작=25, 완료=30, 처리 중 3600초 / 운영 가능 4800초,
  Little's Law · 동일 공용 시설 · 일정 유입 · 이탈 없음 확인.

  | 계산 | 입력 | 기대값 |
  |---|---|---|
  | 평균 체류시간 | `getAvgSojournTimeSec` | 720초 (2026-10-17 삭제) |
  | 누적 대기부담 | `getQueuePersonSeconds` | 18000명·초 (2026-10-17 삭제) |
  | μ | `estimateServiceRatePerHour` | 30명/시간/시설 |
  | λ (Little's Law) | `current` | 180명/시간 (`LITTLE_LAW`) |
  | 총 처리능력 | `current` | 240명/시간 |
  | ρ | `estimateLoadRatio(current)` | 0.75 |
  | 실제 가동률 | `getObservedUtilization` | 0.75 (2026-10-17 삭제) |
  | 구간 유입인원 | `estimateArrivalPsgCnt(current)` | 30명 |
  | 해소 40→10 | `estimateClearTimeSec(current, 10)` | 1800초 |
  | 새로 줄 서면 대기 | `estimateNextArrivalWaitSec(current)` | 615초 |
  | 10분 목표 필요 총 수 | `estimateRequiredServerCnt(current, 10, 600)` | 12 |
  | 10분 목표 추가 수 | `estimateAdditionalServerCnt` | 4 (2026-10-17 삭제) |
  | 보유로 달성 가능 | `assessCapacityFeasibility` | false (2026-10-17 삭제) |
  | 과부하 해소 | s=6, λ=180 외부 입력 | `UNREACHABLE` |
  | 과부하 새로 줄 서면 대기 | s=6, λ=180 | 820초 |
  | 가정 미확인 유입 | 빈 입력 | `UNAVAILABLE` (`LITTLE_LAW`) |
  | M/M/s | s=8, λ=180 외부 입력, M/M/s 확인 | 대기확률 0.35698108587868027, Wq 21.41886515272082초 |
  | 5분 이내 서비스 시작 | `ErlangCResult.estimateServiceLevel(300)` | 0.9975946803636735 (2026-10-17 삭제) |
- **`domains/queue` 정리 후**
  - 같은 벡터로 결과가 바뀌지 않았는지 다시 확인한다
  - 실백엔드 빌드에서 삭제한 메서드를 참조하는 곳이 없는지 확인한다
- **카드와 팝업 일치**(핵심 완료 조건): 같은 `smltId`·터미널·`hhmm`·시설에서 아래 값이 같아야 한다.
  - 카드 `wtngPsgCnt` = 팝업 `wtngPsgCnt`
  - 카드 ρ = 팝업 `current.loadRatio`
  - 카드 `reqCnt` = 팝업 TIME 모드 기본(30분) `recommend.reqCnt`
  - 카드 해소 시각 = 팝업 `scenario.cgnClearDt`의 시각. 보유 수량을 넘을 때는 추천 수량 가정값이다
- **세 화면 일치**: 같은 조건에서 카드·맵 팝업·체크인 상세의 체크인 `reqCnt`·`cgnClearMin`이 같아야 한다.
- **경계값**
  - Q0 ≤ Q*: 해소 0분, 게이지 100%
  - λ = 0: 안정 하한 0
  - 운영 0개: `UNREACHABLE`이라 `-`
  - 처리시간 없음: `UNAVAILABLE`이라 `-`
  - ρ = 1 근처: `RHO_EPSILON`
  - 보유 수량 초과: 추천 수량 그대로, 추천 수량 가정 해소값
- **화면**: `npx tsc -b`, `npx eslint .`, 목업 화면 육안 확인. `-` 카드와 ρ > 1 링을 확인한다.

## 11. 구현 중 확인할 것

- 출국장 Q0 연속성 판정이 실패할 때(`queueAtStart` 없음) λ는 `UNAVAILABLE`이 된다. 이런 카드가 실데이터에서
  얼마나 자주 생기는지 확인한다. 자주 생기면 별도로 결정한다.
- 체크인 카드의 `oprCnt`(시설 마스터)와 계산에 쓰는 운영 부스(`slot.getOprBoothCnt()`)는 다른 값이다.
  카드 메타의 '운영' 표기는 이번 범위에서 바꾸지 않는다.
- `RollingRange` · `RecommendationContext`가 카드 밖에서 쓰이는지 확인한 뒤 삭제한다.

## 12. 구현 결과 (2026-10-17)

9장 1~8단계를 마쳤다. 8단계는 실백엔드 검증 전에 진행하기로 결정했다(2026-10-17). 결과는 12.4.

### 12.1 구조

| 무엇 | 어디 |
|---|---|
| 공용 평가기 | `domains/dsbd/FcltQueueClearance` — `clearOf(s)`, `recommendOf(목표분)`, `getLoadRatio`, `getThroughputPerHour`, `toTargetQueueCnt` |
| 원천 | `FcltQueueSource`에 `tmnlId` · `fcltType` · `unitCd` · `prcsPsgCnt` 추가, `toBuilder` 사용. `toScenarioInput`은 `totServerCnt`를 싣지 않는다 (추천 수량이 보유 수량을 넘어도 계산해야 해서) |
| 체크인 어댑터 | `ChknQueueDay.sourceOf` / `clearanceOf` / `recommendOf`. 생성자에 터미널 · 기준일자 추가 |
| 출국장 어댑터 | `domains/dsbd/DepQueueWindow` + `CastDepQueueService`. 결과 · 보안검색 운영표를 터미널 단위로 한 번씩 조회 |
| 팝업 | 배정 가능 최대 수량 · 적용 가정만 어댑터 결과에 덧붙이고 계산은 평가기에 맡긴다 |

삭제: `FcltRecommendationCalculator`, `RollingRange`, `RecommendationContext`, `ChknQueueSeries.trajectoryOf` · `boothCntAt`,
`ChknQueueDay.serviceRateOf` · `peakOf` · `RECOMMEND_*`, `CastDsbdServiceImpl`의 출국장 추천 · LGT 합산 경로 일체.
`RecommendationResources`는 체크인 추천 대상명에만 남아 운영 수량 · 고정 대상명을 걷어냈다.

### 12.2 구현 중 정한 것

- 출국장 카드 목록은 관측구간 `[hhmm, hhmm+30)`에 결과가 있는 출국장이다. 카드 메타(전체/운영)와 칩 목록은 기존대로
  LGT · SC · SR 시설 마스터를 쓰고, 칩 색만 SC+SR Q0로 바꿨다.
- 보안검색 운영표에 같은 게이트 행이 둘 이상이면 터미널 전체 조회 단계에서 실패한다. 예전 팝업은 선택한 게이트만
  검사했으므로 **다른 게이트의 중복도 팝업을 실패시킨다.**
- 혼잡해소 시각이 비면 카드 중앙 숫자도 `-`로 그린다(`view.ts`).
- 해소 분 올림은 화면 `ceilMinutes`와 같은 1e-9 보정을 쓴다.
- 운영 부스가 0이어도 처리시간이 있으면 `reqCnt`가 나온다(유입/처리 차이 계산은 현재 수량과 무관). 유휴 아일랜드는 `reqCnt = 0`, `cgnClearMin = 0`이다.
- 목업: 카드도 팝업 목업 프로필로 만든다. `T2-DEP-1`이 `reqCnt: null` 카드, `T1-CHKN-D`는 ρ > 1이 되도록 유입을 840→900으로 올렸다.
- 6장의 "미커밋 변경"은 이미 `76a1c97`로 커밋돼 있었다.

### 12.3 검증한 것 / 남은 것

검증 (이 저장소, 실백엔드 아님):

- 프레임워크 클래스를 스텁으로 둔 임시 트리에서 JDK 17 + Lombok으로 `java/` 전체를 컴파일했다
  (컨트롤러 · HWPX · 운영시간 서비스 등 외부 라이브러리가 없어 컴파일할 수 없는 14개 파일 제외. 이번 변경과 무관).
- 회귀: 리팩터링 전 팝업 코드와 평가기를 무작위 원천 2만 개로 대조 — λ · μ · 현재/조정/추천 해소값 · Erlang C ·
  fluid · 안정 하한 · 최종 수량 · 목표 달성 여부가 모두 같다.
- 10장 경계값과 2026-10-13 계획 §9.1 벡터, `ChknQueueDay.recommendOf` = `clearanceOf` 일치, 출국장 연속성 판정.
- `npx tsc -b`, `npx eslint .` 통과. 목업 화면에서 `-` 카드, ρ > 1 링, 카드 = 팝업 값 확인.

남은 것:

- 실백엔드 빌드 · 단위 검증, 실데이터에서 카드와 팝업 · 세 화면 일치 확인
- 11장의 출국장 연속성 실패 빈도
- 실백엔드 빌드에서 12.4 삭제 대상을 참조하는 곳이 없는지

### 12.4 `domains/queue` 정리 (9장 8단계)

결정 (2026-10-17):

- 실백엔드 검증 전에 진행한다. 1~8단계를 실백엔드에서 한 번에 검증한다
- 후보 목록 밖의 미사용 getter도 지운다. 단 `FacilityQueueCalculator`의 식별 필드(`tmnlId` · `fcltType` · `fcltId` · `queueId`)는
  큐마다 객체를 따로 만든다는 설계 의도와 Xovis 연계 때의 구분을 위해 남긴다
- `QueueDataSource.MANUAL`을 지운다 (예제 전용이었다). 화면 `QueueDataSrc` 유니온과 라벨도 같이 지웠다

삭제:

| 대상 | 삭제한 것 |
|---|---|
| `FacilityQueueCalculator` | 4.7 후보 메서드 8개, `missingTimesIssue`, getter 11개 (`getIntervalSeconds`는 사용 중이라 유지) |
| `ErlangCResult` | `estimateServiceLevel`, `getArrivalRatePerHour` · `getServiceRatePerHour` · `getServerCnt`와 그 필드, `spareCapacityPerHour` |
| `FacilityQueueInput` | `totServerCnt` · `busyServerTimeSec` · `availableServerTimeSec`과 관련 검증 |
| `CalculationMethod` / `QueueCalcMethod` | `CAPACITY_COMPARISON` (화면 라벨 '보유량 비교' 포함) |
| `QueueDataSource` / `QueueDataSrc` | `MANUAL` (화면 라벨 '수동 입력' 포함) |
| 클래스 | `FacilityQueueExample` |

남긴 것: Little's Law 일체(4.7 보류 목록), `XOVIS`, `QueueInputValidation` · `Computed` · `CalcOutcome` 전부 (모두 사용 중).
`estimateRequiredServerCnt` 주석이 삭제된 메서드를 가리켜 "실현 가능성은 호출자가 보유 수와 비교해 판단한다"로 고쳤다.

검증: 임시 트리 전체 컴파일 통과, 12.3 회귀 하네스 151,129건 일치(정리 전과 같음), 10장 벡터 중 남은 메서드 값 일치,
`npx tsc -b` · `npx eslint .` 통과.
