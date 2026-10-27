# CAST 시설 대기 결과와 추천 계산 도식

2026-10-28 작업 디렉터리의 Java 참조 소스와 React 화면을 기준으로 작성했다. 운영 배포 상태나 실제 DB 값의 검증 결과는 아니다. 수치 예시는 설명용이다.

## 이미지

- [전체 연결 PNG — 2800 × 8060](./cast-wait-flow-all.png)
- [1. 전체 흐름](./01-overview.png) · [SVG](./01-overview.svg)
- [2. 10분 통계 저장](./02-storage.png) · [SVG](./02-storage.svg)
- [3. 추천·팝업 계산](./03-calculation.png) · [SVG](./03-calculation.svg)

`python docs/diagrams/cast-wait-flow/render_diagrams.py`로 다시 생성한다. Pillow와 Windows 맑은 고딕을 사용하며, SVG와 PNG를 같은 레이아웃에서 생성한다.

## 그림을 읽을 때 필요한 구분

**저장 10분 / 관측 직전 30분 / 미래 예측 1분**은 각각 다른 역할이다. 카드의 **목표 해소시간 30분**도 별개의 설정이다. 예를 들어 등급표의 NORMAL 상한이 40분이면, 카드 추천은 '지금부터 30분 안에, 그 시점 직전 30분에 처리된 여객의 평균 대기시간을 40분 미만으로 낮출 최소 총수량'을 뜻한다.

추천 `reqCnt`는 현재 운영 수량을 포함한다. 추가 필요 수량은 `max(reqCnt - 현재 운영 수, 0)`이다. 보유 수량을 초과해도 추천 총수량을 잘라내지 않는다. 팝업은 보유 수량 전부 배정 시 결과도 별도로 계산할 수 있다. COUNT 입력은 확인된 보유 수량 이내로 제한한다.

현재 혼잡과 해소 판정은 '지금 줄에 서 있는 사람의 평균 대기'가 아니라 **직전 30분에 처리된 여객의 평균 대기시간**을 사용한다. 현재 줄이 0명이 되어도 이미 처리된 여객의 긴 대기시간이 이동 창에 남을 수 있다. Erlang C 대기확률·이론 대기는 정상상태 참고지표이고, 추천과 해소시간은 `WaitAvgForecast`의 FIFO 예측으로 결정한다.

## 저장 상세와 예외

체크인은 `CC` 부스별 원천 대기·구간 처리인원에서 유입을 역산하고, 실행에 연결된 배정표로 아일랜드 공용 Queue를 1분씩 다시 계산한다. 음수 유입은 0으로 보정하고 로그를 남긴다. 실제 분당 처리용량 계산에는 배정 부스 수와 결과상 활동 부스 수의 최댓값을 사용한다. 소수 처리용량은 다음 분으로 이월한다. 처리시간이 없으면 원천 → 아일랜드 최근 60분 가중평균 → 터미널 CC 평균 → 관측 처리량 기반 용량 → 용량 0 순으로 처리한다. 마지막 원천 결과 뒤에는 유입 0으로 잔여 대기열을 처리하는 꼬리가 있고, 관측 여부는 N이다.

출국장은 `SC + SR`를 한 큐로 합산한다. 원천 평균 대기초에 처리인원을 곱해 합계를 보존하고, NULL 대기시간의 처리인원은 유효인원에서 제외한다. 결과시각을 구간 끝으로 해석해 직전 10분에 배치한다. 실행 리소스 운영표에서 보안검색 운영 수량을 읽으며 하루 동안 같은 값이다. SC·SR의 직렬·병렬 관계와 구간 시각 해석은 현재 코드의 가정이다.

10분 테이블에는 시작 대기·유입을 저장하지 않는다. 이전 10분 행의 종료 대기로 도출한다. 관측 여부는 `OBSRVN_YN`으로 보존하며, 시간 합계는 정수 초다. 혼잡등급·추천·해소시간은 저장하지 않고 조회 시점 기준표로 계산한다.

## 조회·예측 상세와 산정 불가

조회 서비스는 저장 행의 값·기대 시설·전체 범위를 검증한다. 없거나 불완전하면 해당 실행·모델·터미널·시설유형 범위 전체를 원천으로 다시 계산한다. 저장행과 보완행을 섞지 않으며 보완 결과를 DB에 쓰지 않는다.

평가시각 `t`는 10분 경계다. `[t-30분, t)`의 10분 행 3개와 그 이전 종료 대기 스냅샷을 사용한다. 그림의 λ·μ는 이해를 위해 명/분으로 표시했으며 실제 서버 계산은 명/시간이다.

- λ = `(종료 대기 - 시작 대기 + 30분 처리인원) × 2` 명/시간. 이 단계에서 음수 유입은 산정 불가다.
- 체크인 μ = `60 × 처리용량 합 ÷ 유효 운영부스·분 합` 명/시간.
- 출국장 μ = `3600 ÷ 유효 처리여객 가중평균 처리초` 명/시간.

과거 처리 이력은 10분 처리인원·대기초 합을 10등분해 분마다 배분한다. 잔여 Q0명의 도착시각은 가장 최근 10분부터 유입을 역산해 분 단위로 재구성한다. 체크인은 저장된 계산 시작점까지, 출국장은 최대 180분까지 되짚는다. 따라서 저장 전 체크인 1분 FIFO를 그대로 재사용하는 구조는 아니며, 저장된 10분 통계에서 공통 예측용 분 단위 근사를 만든다.

추천은 수량을 작은 값부터 순차 탐색한다. 평균 대기시간이 시설 수에 단조롭게 감소한다고 가정하지 않는다. 후보마다 같은 초기 상태에서 예측해 아래를 확인한다.

1. 목표시간 H 안에 평균이 NORMAL 상한 미만 도달.
2. H 시각에도 목표 충족. 처리 여객이 없어 평균이 없으면 잔여 대기 0명이 필요하다.
3. `s × μ > λ`. 안정 최소 수량은 `floor(λ / μ) + 1`이다.

탐색은 매분 유입과 잔여 줄이 즉시 처리되는 포화 수량까지 진행하며 최대 100,000개다. 해소시간 탐색 범위는 24시간이다. 이미 현재 평균이 목표 미만이면 해소시간은 0분이다.

직전 30분이 불완전하거나 처리여객 대기시간이 누락되면 현재 평균·등급이 null이 된다. 잔여 대기자의 도착시각을 복원하지 못하면 현재 평균은 있어도 예측·추천은 산정 불가일 수 있다. 미래 유입률·처리율 일정, 즉시 시설 변경이라는 가정을 사용하므로 이후 실제 피크를 미리 반영하지 않는다.

팝업 첫 화면은 현재 코드의 `COUNT` 모드다. 수량/시간 입력 변경 후 250ms 지연하여 API를 다시 호출한다. 서버 계산 결과를 `view.ts`에서 표시 형식으로 변환하며 CAST 실행을 다시 요청하지 않는다.

## 코드 근거

| 내용 | 파일·위치 |
|---|---|
| 수신 엔드포인트 | [CastApiController.java:83](../../../java/castapi/controller/CastApiController.java#L83) |
| 원천 저장 후 통계 생성 · rollbackOnly | [CastApiServiceImpl.java:2531](../../../java/castapi/service/impl/CastApiServiceImpl.java#L2531) |
| XML 필드 매핑 | [CastApiServiceImpl.java:2656](../../../java/castapi/service/impl/CastApiServiceImpl.java#L2656) |
| T1/T2 × CHKN/DEP 초기 생성 | [CastFcltWtngRsltCreateServiceImpl.java:49](../../../java/cast/service/impl/CastFcltWtngRsltCreateServiceImpl.java#L49) |
| 체크인 유입·FIFO | [ChknQueueCalculator.java:84](../../../java/cast/domains/chkn/ChknQueueCalculator.java#L84) |
| 체크인 10분 집계 | [ChknWtngSecBuilder.java:74](../../../java/cast/domains/chkn/ChknWtngSecBuilder.java#L74) |
| 출국장 10분 집계 | [DepWtngSecBuilder.java:93](../../../java/cast/domains/dsbd/DepWtngSecBuilder.java#L93) |
| 통계 INSERT | [CastFcltWtngRsltMapper.xml:5](../../../java/mapper/CastFcltWtngRsltMapper.xml#L5) |
| 저장 결과 조회·보완 | [CastFcltWtngServiceImpl.java:71](../../../java/cast/service/impl/CastFcltWtngServiceImpl.java#L71) |
| 관측 이력과 공통 원천 | [FcltWtngDay.java:165](../../../java/cast/domains/wtng/FcltWtngDay.java#L165) |
| 유형별 처리율 | [FcltWtngDay.java:250](../../../java/cast/domains/wtng/FcltWtngDay.java#L250) |
| 잔여 대기 도착시각 재구성 | [FcltWtngDay.java:373](../../../java/cast/domains/wtng/FcltWtngDay.java#L373) |
| 공통 평가기 | [FcltQueueClearance.java:29](../../../java/cast/domains/wtng/FcltQueueClearance.java#L29) |
| 추천 탐색 | [WaitAvgForecast.java:59](../../../java/cast/domains/queue/WaitAvgForecast.java#L59) |
| 1분 FIFO 예측 | [WaitAvgForecast.java:147](../../../java/cast/domains/queue/WaitAvgForecast.java#L147) |
| 카드 | [CastDsbdServiceImpl.java:424](../../../java/cast/service/impl/CastDsbdServiceImpl.java#L424) |
| 팝업 모드 분기 | [CastFcltQueueScenarioServiceImpl.java:126](../../../java/cast/service/impl/CastFcltQueueScenarioServiceImpl.java#L126) |
| React 조회·입력 | [useFcltQueueScenario.ts](../../../react/src/modules/pm/pages/castSmry/dashboard/hooks/useFcltQueueScenario.ts) |
| 팝업 표시 | [FcltQueueScenarioModal.tsx](../../../react/src/modules/pm/pages/castSmry/dashboard/components/FcltQueueScenarioModal.tsx) |

### 문서와 현재 코드가 다른 부분

AGENTS §15의 '결과 수신 커밋 후'와 달리, 실제 구현은 클래스 수준 트랜잭션 안에서 원천 저장 직후 `createInitialResult`를 동기 호출한다. 별도 `REQUIRES_NEW`나 `afterCommit`이 없고 실패 시 rollbackOnly를 설정하므로 그림은 **원천 + 10분 통계 함께 커밋**으로 표현했다.

AGENTS §14의 '팝업 첫 화면 TIME'과 달리, 현재 React 훅의 초기 모드는 COUNT다. **카드 계산은 TIME 목표 30분과 같고 팝업 첫 화면은 COUNT**로 구분했다.
