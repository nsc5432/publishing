# CAST 체크인·출국장 큐 결과 사전 계산·저장 검토 인수인계

- 작성일: 2026-10-24 (Asia/Seoul)
- 소스 확인 기준: `60fed472dce3b7967d072b6ac5762974404540da`
- 상태: 현행 구조 확인 및 검토사항 정리. 큐 사전 계산·DB 저장 도입은 미구현·미확정.
- 검증 범위: 저장소 Java 참조 소스, SQL, 설계문서, 저장 결과 CSV 표본. 실제 백엔드 실행·Oracle·CAST 연동 검증은 수행하지 않았다.

## 1. 다음 대화에서 이어갈 질문

사용자는 다음 내용을 확인하고, 결과 수신 시점에 계산·저장하는 방안을 검토하고 있다.

> CAST의 CC 결과는 부스별로 생성되고, 우리 시스템은 공항의 아일랜드 공용 큐를 표현하기 위해 ChknQueueCalculator.calculate로 ChknQueueSeries를 생성하는가?
> 그렇다면 CastApi의 REQ_SetResource.do 처리 마지막에 이 계산과 DB 저장을 추가하는 것이 적절한가?
> 출국장에서는 DepQueueWindow가 이에 대응하는가?

현재까지의 결론:

1. 체크인에 대한 이해는 현행 코드와 일치한다. 부스별 CC 결과를 입력으로 아일랜드별 공용 FIFO 큐를 재계산한다.
2. 현재 파생 큐는 조회 시 계산한다. 이 흐름에 파생 결과 DB 저장이나 요청 간 캐시는 없다.
3. 수신 시 사전 계산·저장은 타당한 검토 방향이다. 다만 배정 부스 입력, 저장 데이터 범위, 실패 정책, 기존 조회 전환을 먼저 설계해야 한다. 도입이 승인되거나 구체적인 DDL이 확정된 상태는 아니다.
4. 출국장의 대응 구조는 `DepQueueDay → DepQueueWindow → FcltQueueSource`다. CC처럼 부스 처리용량으로 공용 큐를 새로 계산하는 구조와는 다르다.
5. 최신 출국장 코드에는 잔여 대기열 도착군의 FIFO 역추정이 있다. 따라서 “출국장은 단순 합산뿐이며 FIFO 처리가 전혀 없다”는 설명은 현재 소스 기준으로 부정확하다.

## 2. 확인한 사실과 아직 검증하지 못한 전제

### 2.1 실제 표본과 수신 코드로 확인한 내용

- [실제 저장 결과 CSV](../대기행렬/datas/cast-result/csv/data-all.csv)의 245행 부근에 같은 시각의 `T1CCN02`, `T1CCN03`, `T1CCN04`, `T1CCN05`가 개별 행으로 존재한다. CC가 부스별 시설코드로 저장되는 점을 확인했다.
- 같은 CSV의 469행 부근에는 `T1SC2_01` 등 일반 검색대, 501행 부근에는 `T1SR2_01` 등 RED 검색대 결과가 존재한다.
- [CastApiServiceImpl](../java/castapi/service/impl/CastApiServiceImpl.java)의 `processSingleRun()`은 `BlockResourceID`와 `ParentID`로 시설을 연결하고 다음 값을 원천 상세에 저장한다.

| CAST 필드 | 저장 컬럼 | 현행 해석 |
|---|---|---|
| `QueueLength_Current` | `WTNG_PSG_CNT` | 부스·장비별 대기인원 |
| `FinishedClients_Abs` | `TRNST_PSG_CNT` | 해당 구간 처리인원 |
| `WaitingTime_Avg` | `AVG_WTNG_HR` | 평균 대기시간, 저장 시 초로 변환 |
| `TransactionTime_Avg` | `AVG_PRCS_HR` | 평균 처리시간, 저장 시 초로 변환 |
| `T2` | `SMLT_ACTL_DT` | 결과 시각 |

이 수신 단계에서는 아일랜드 공용 큐를 생성하지 않는다. 원천 상세는 `TN_PM_SMLT_RSLT_DTL`, 설정은 `TN_PM_SMLT_STNG`에 저장한다.

### 2.2 CAST 계약 수준으로 추가 확인할 내용

[기존 공용 큐 설계문서](plans/2026-09-04-checkin-common-queue.md)는 다음을 전제로 한다.

- `QueueLength_Current`는 서로 중복되지 않는 부스별 독립 큐다.
- `FinishedClients_Abs`는 누적값이 아니라 구간 처리인원이다.

저장소 표본은 한 시각의 560행이므로, 이 두 의미를 시계열로 독립 입증하지 못했다. 외부 CAST 명세까지 검증한 것으로 표현하지 않는다.
결과 시각이 구간 시작인지 끝인지, 대기인원에 처리 중 여객이 포함되는지도 원본 계약·연속 결과로 확인할 사항이다.
현재 출국장 코드는 10분 결과 시각을 구간 끝으로 해석한다.

참고: [CAST/Xovis 대기인원 검토](plans/2026-10-14-dsbd-cast-xovis-wtng-review.md)의 269행 부근에 표본의 처리량·처리시간 대조와 미확인 항목이 정리되어 있다.

## 3. 체크인 공용 큐의 현행 경로

```text
REQ_SetResource.do
  → CastApiServiceImpl.saveResult()
  → insertResult()
  → TN_PM_SMLT_STNG / TN_PM_SMLT_RSLT_DTL 저장

화면 조회
  → CastChknQueueServiceImpl.retrieveChknQueueDay()
  → 부스별 CC 원천 결과 + 배정 부스표 조회
  → 아일랜드·결과 시각별 구간 조립
  → 아일랜드마다 ChknQueueCalculator.calculate()
  → ChknQueueSeries → ChknQueueDay
  → 카드 / 맵 / 체크인 상세 / 혼잡해소 팝업
```

주요 처리:

- [CastChknMapper.retrieveChknQueueRawList](../java/mapper/CastChknMapper.xml)는 `CC` 부스별 원천을 읽고 시설코드 끝에서 세 번째 문자로 아일랜드를 구분한다.
- [CastChknQueueServiceImpl](../java/cast/service/impl/CastChknQueueServiceImpl.java)은 아일랜드·시각별 대기인원과 처리인원을 합하고, 처리시간·배정 부스 수·꼬리 구간을 조립한다.
- [ChknQueueCalculator](../java/cast/domains/chkn/ChknQueueCalculator.java)는 `이번 구간 끝 큐 − 직전 구간 끝 큐 + 구간 처리인원`으로 유입을 역산하고, 분 단위 유입·처리용량과 FIFO 도착군으로 큐를 재계산한다. 단순히 부스 큐 합계를 표시하는 것이 아니다.
- [ChknQueueSeries](../java/cast/domains/chkn/ChknQueueSeries.java)는 큐, 유입, 처리인원, 부스 수, 처리용량, 대기시간 합, 처리시간 합, 대기시간 분포 등을 보유한다.
- [ChknQueueDay](../java/cast/domains/chkn/ChknQueueDay.java)는 아일랜드·터미널 집계, 관측구간, 등급·추천·시나리오 원천을 제공한다.
- 최신 소스에는 `originMinute`와 관측 여부 배열이 있어 자정 이전 이력과 미관측 구간을 구분한다. 최초 조사 중 잠시 보였던 계산기 정의·호출 인자 불일치는 문서 기준 커밋에서는 해소되어 있다.

대시보드 구분:

- 체크인 시설 카드·맵·체크인 상세의 공용 큐 대상은 `CC`다.
- 대시보드 시간대별 CHKN 차트는 CC 공용 큐에 해당 아일랜드 SBD 대기를 더한다. 사전 저장 전환에서도 이 조합을 유지해야 한다.
- 근거: [CastDsbdServiceImpl](../java/cast/service/impl/CastDsbdServiceImpl.java), [시간대별 차트 구현 계획](plans/2026-10-15-dsbd-chkn-chart-island-queue.md).

## 4. 출국장의 현행 경로와 체크인과의 차이

```text
SC / SR 장비별 원천 결과 + 실행 리소스의 운영 수량
  → CastDepQueueServiceImpl
  → DepQueueDay: 출국장·결과 시각별 집계
  → windowAt(평가시각)
  → DepQueueWindow: 직전 30분 관측과 잔여 도착군 추정
  → FcltQueueSource / QueueWaitWindow
  → 등급 / 추천 / 혼잡해소 평가
```

| 비교 항목 | 체크인 | 출국장 |
|---|---|---|
| 원천 | CC 부스 결과 | SC+SR 검색대 결과, LGT 제외 |
| 큐 자체 | 배정 부스 처리용량으로 아일랜드 공용 큐 재계산 | CAST 원천 큐를 출국장별 합산하여 사용 |
| 하루 자료 | `ChknQueueDay` / `ChknQueueSeries` | `DepQueueDay` |
| 관측 원천 | `ChknQueueDay.sourceOf()` / `waitWindowOf()` | `DepQueueWindow.sourceOf()` / `waitWindowOf()` |
| FIFO 관련 처리 | 유입과 처리용량으로 분별 큐를 전방 계산 | 원천 큐 보존식으로 남은 대기자의 도착 시각을 역추정 |

최신 코드에서 확인한 출국장 세부사항:

- [CastDepQueueServiceImpl](../java/cast/service/impl/CastDepQueueServiceImpl.java)은 `SC`·`SR` 결과와 STNG에 기록된 보안검색 운영 리소스를 읽는다.
- [DepQueueDay](../java/cast/domains/dsbd/DepQueueDay.java)는 같은 출국장·시각의 결과를 묶고, 평가시각별 `DepQueueWindow`를 만든다.
- [DepQueueWindow](../java/cast/domains/dsbd/DepQueueWindow.java)의 관측은 평가시각 직전 30분이다. 10분 결과를 분별로 균등 분배하고, 최대 180분을 되짚어 현재 잔여 대기자의 도착군을 근사한다. 이력이 부족하면 산정 불가 사유를 남긴다.
- 체크인처럼 원천 큐를 새로운 공용 큐 궤적으로 대체하는 계산은 아니다. 따라서 `DepQueueWindow`를 `ChknQueueCalculator`의 출국장 버전이라고 부르지 않는다.
- 추천·해소는 양쪽 모두 [FcltQueueClearance](../java/cast/domains/dsbd/FcltQueueClearance.java)와 공통 큐 도메인을 사용한다.

## 5. 수신 시 사전 계산·저장 도입 검토

### 5.1 삽입 위치 후보

`REQ_SetResource.do` 전체 마지막이 아니라 `CastApiServiceImpl.insertResult()`의 시뮬레이션 결과 저장 분기가 후보이다.
이 API는 모델 정보와 WhatIf 상태 정보도 받는다.

```text
실행·모델 식별 및 중복 확인
  → 설정 저장
  → 원천 상세 전체 저장
  → [후보] 파생 큐 계산·저장
  → 사용자 실행 완료 처리
  → 성공 응답
```

이는 동기 처리·동일 트랜잭션을 채택할 경우의 후보 순서다. 비동기 파생 생성이나 별도 실패 상태를 확정한 것은 아니다.
`calculate()` 단독 호출만 옮겨서는 충분하지 않다. 구간 조립·배정 부스·처리시간 fallback·꼬리 구간·시간축 연결도 동일하게 적용해야 한다.

### 5.2 우선 해결할 입력 문제

**현재 체크인 계산의 배정 부스표는 실행 당시 사용자 조건을 직접 읽지 않는다.**

```text
CastChknQueueServiceImpl.retrieveChknQueueDay()
  → CastChknServiceImpl.retrieveChknMapGroupByIsland(excnYmd, tmnlId)
  → CastChknMapper.retrieveChknList()
  → GOOWN.TI_GO_CKNCT_DALY_ALOT
```

이 경로에는 실행의 `smltId`나 STNG의 CA 리소스 참조가 전달되지 않는다.
따라서 사용자 WhatIf에서 바꾼 부스·운영 조건과 공용 큐 계산 입력이 일치하는지 점검하고, 실행 리소스 기준으로 입력을 얻는 방안을 먼저 검토해야 한다.
일일 CA001 계열은 원천 운영자료가 바뀔 수 있으므로 “수신 당시 고정”과 “조회 시 최신 원천 반영” 중 어느 동작을 원하는지도 결정해야 한다.

### 5.3 저장할 데이터 후보 — 미확정

- 원천 CAST 상세는 보존하고 파생 결과는 별도로 관리한다.
- 키 후보는 실행 ID·모델 번호·터미널·아일랜드/출국장·기준시각이다. 현행 일부 조회는 모델 번호로 구분하지 않으므로 다중 모델 합산·분리 정책을 먼저 정한다.
- 체크인은 표시용 30분 평균만으로 충분하지 않다. 분별 큐·유입·처리인원·운영 수량·처리용량·대기시간 합·처리시간 합과 관측 여부를 보존하는 안을 검토한다.
- 자정 직후 관측과 잔여 도착군 복원에는 전날 이력 또는 시작 시점의 잔여 도착군 정보가 필요하다.
- 평균은 합·분모를 보존하여 다시 집계한다. 95분위 KPI까지 대체하려면 대기시간 분포를 어떻게 보존할지도 정한다.
- 출국장은 우선 SC+SR의 출국장별 원천 집계를 저장할 수 있다. 모든 평가시각의 관측·예측 결과까지 저장할 필요가 있는지는 별도로 판단한다.
- 계산 버전·입력 참조·생성시각을 추적할 수 있어야 과거 자료의 재계산과 오류 정정이 가능하다.
- DTO·테이블·컬럼 이름과 자료형, 저장 간격·보존기간은 아직 결정하지 않았다.

### 5.4 트랜잭션·조회 전환·검증

- 동일 트랜잭션이면 파생 계산 실패가 원천 결과 저장도 롤백한다. CAST는 결과를 재전송하지 않는다는 프로젝트 제약을 고려해 실패 정책과 보존 원문을 이용한 복구 경로를 정해야 한다.
- 별도 처리라면 원천 저장 성공과 파생 결과 준비 완료를 구분해야 한다. 구체적인 상태 테이블·작업 큐 도입은 아직 제안 검토 단계다.
- 카드·맵·체크인 상세·차트·팝업이 동일한 저장 결과를 읽도록 공통 조회 경로를 전환해야 한다. 저장만 추가하면 기존 조회 재계산 비용은 남는다.
- 기존 결과의 초기 생성, 알고리즘 변경 후 재생성, 중복 수신, 삭제·보존 정책과의 연계를 정해야 한다.
- 검증은 동일 원천에 대한 기존 계산과 저장 후 조회의 값 일치, 일일/사용자·T1/T2 입력 일치, 자정·누락·0명·미운영, 전체 처리시간과 저장량을 포함한다. Java 컴파일·DB 트랜잭션 검증은 실제 백엔드 환경에서 수행한다.

## 6. 관련 정책과 혼동하지 말아야 할 내용

[혼잡등급 대기시간 기준 전환 계획](plans/2026-10-24-cgn-grade-wait-time-impact.md)의 정책과 함께 검토한다.
최신 코드에는 직전 30분 처리 여객의 평균 대기시간 판정과 미래 이동평균 예측을 위한 자료 구조가 반영되어 있다.

- 이전 인원 기준 NORMAL 상한을 최신 해소 목표로 다시 도입하지 않는다.
- 표시값으로 반올림한 평균이나 등급 문자열만 저장해 원천 통계를 대체하지 않는다.
- 과거 결과의 등급은 조회 시점 기준표로 판정하는 정책이므로, 큐 사전 저장을 이유로 실행 당시 등급을 고정하는 변경을 임의로 포함하지 않는다.
- 관련 문서의 “구현 전” 등의 상태 문구보다 실제 코드와 확인 커밋을 함께 대조한다. 이 인수인계 문서는 해당 개편 전체의 완료·검증을 보증하지 않는다.

## 7. 후속 논의 시작용 프롬프트

```text
docs/2026-10-24-cast-queue-result-handoff.md를 읽고 이어서 검토해줘.
CAST 결과 수신 이후 체크인 아일랜드 공용 큐를 사전 계산하여 DB에 저장하고,
카드·맵·상세·팝업에서 공통으로 조회하도록 하는 방안을 구체화하려고 해.
먼저 실행 리소스 기준 배정 부스 입력과 현행 운영표 입력의 차이를 확인하고,
출국장 DepQueueDay/DepQueueWindow의 집계·잔여 도착군 추정과 구분해서
저장 범위, 키, 재계산 정책, 실패 처리 방안을 비교해줘.
이 문서의 후보안을 확정된 정책이나 구현 승인으로 간주하지 말고,
작성 기준 커밋 이후 코드가 바뀌었는지 확인해줘.
```

구현 계획을 별도로 저장하라는 요청을 받으면 프로젝트 규칙에 따라 `docs/plans/YYYY-MM-DD-주제.md`에 작성한다.
