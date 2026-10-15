# 요약보기 차트 CHKN — 아일랜드 단위 Cast·Xovis 대기인원

작성일: 2026-10-15 · 대상: `java/cast`, `java/mapper` · 상태: **반영 (참조 사본 구현, 실제 백엔드·DB 검증 대기)**

요약보기 터미널 패널의 시간대별 차트·표(`DSBD_TMNL_RSLT`)에서 **체크인(CHKN) 카테고리만** 다시 산출한다.
검토 경위는 `docs/plans/2026-10-14-dsbd-cast-xovis-wtng-review.md` 에 있다. 구현은 이 문서만 보고 한다.

`java/` 는 참조 사본이라 이 저장소에서 컴파일되지 않는다. 빌드·실행 검증은 실제 백엔드 레포에서 한다.

---

## 1. 왜 바꾸나

지금 CHKN 의 두 선은 서로 다른 단위의 MAX 를 비교한다.

| | 지금 값 | 실제 의미 |
|---|---|---|
| Cast (예측) | `TN_PM_SMLT_RSLT_DTL.WTNG_PSG_CNT` 행 단위 MAX (`CC`·`CK`·`SBD`) | 가장 긴 **부스 1개**의 줄 |
| Xovis (실적) | `TN_PM_PSG_WTNG_INFO.WTNG_LINE_LEN` 행 단위 MAX (`Queue`) | 가장 긴 **항공사 줄 1개** |

Xovis `Queue` 는 아일랜드 공용 줄이 아니라 **항공사(+클래스)별 줄**이다. 한 아일랜드에 동시에 1~3개가 열린다
(`FCLT_NM`: `TK`, `TW_1`, `SQ-PRE`, `VJ_1-PRE`, `7C-SBD`). Cast 는 부스별 값이다. 그래서 양쪽 모두
**아일랜드 합**으로 올려서 비교한다.

---

## 2. 결정 사항 (2026-10-15)

| # | 항목 | 결정 |
|---|---|---|
| 1 | 비교 단위 | 양쪽 모두 **같은 시각의 아일랜드 합 → 시간 내 최대 아일랜드** |
| 2 | 셀프백드롭(SBD) | **포함한다.** G 아일랜드(SBD 전용)의 혼잡도 운영 대상이다. Xovis `-SBD` 줄도 거르지 않는다 |
| 3 | Cast SBD 산출 | **A안** — §13 공용 Queue(`CC`)는 그대로 두고, 차트에서 아일랜드별 SBD 기기 `WTNG_PSG_CNT` 합을 더한다 |
| 4 | Xovis 가 재지 않는 아일랜드 | **Cast 선에 넣는다.** Xovis 는 B·C·D·E·F·H·J·K·L·M·N 만 잰다 (A·G·I 없음) |
| 5 | 범위 | **대기인원 선 + 표(대기시간·처리시간·비율)** 모두 새 산출로 바꾼다 |
| 6 | Cast 결과가 없는 시간 | **공용 Queue 의 꼬리 구간(유입 0 으로 흘려보낸 값)을 그대로 그린다.** 결과가 없으면 0 |
| 7 | 혼잡등급 기준정보 의존 | **받아들인다.** `TN_PM_PSG_PRCS_GRD` 가 없으면 CHKN 차트 조회도 실패한다 (공용 Queue 가 기준정보를 요구) |
| — | 셀프체크인(CK) | **뺀다.** Xovis 가 키오스크를 재지 않고 (§3.3), §13 도 `CC` 만 대상이다 |
| — | PSG · FLT · DEP | **바꾸지 않는다.** DEP 는 출국장 번호 매핑이 미결이다 (검토 문서 §8-3) |

결정 3 때문에 SBD 가 있는 아일랜드에서는 **차트 값과 체크인 카드 값이 다르다** (카드는 `CC` 만). 의도된 차이다.

---

## 3. 근거 데이터

### 3.1 표본 주기 — 둘 다 10분

- Xovis: 명세 `OCCURTIME` "10분주기", 시설당 하루 144행 (`대기행렬/datas/xovis/csv/Spec.csv`)
- Cast: 연속으로 바빴던 부스(`MIN_WTNG_LEN ≥ 2`)가 처리시간 120초 × 처리 5명 = 600초
  (`대기행렬/datas/cast-result/csv/data-all.csv`)

### 3.2 `TN_PM_PSG_WTNG_INFO` (원천 = `대기행렬/datas/xovis/csv/data-all.csv`)

| CSV | 컬럼 | 비고 |
|---|---|---|
| `OCCURTIME` | `PSG_FLOW_DATA_CRT_DT` VARCHAR(12) | `yyyyMMddHHmm` |
| `ISLAND` | `CHKN_ISL_CD` VARCHAR(2) | `Queue`·`Desk` 는 `A~N`, `DG`·`SC` 는 출국장 번호 `01~06` |
| `DESKNAME` | `FCLT_NM` | `Queue` 는 항공사 줄 이름 |
| `DESKTYPE` | `FCLT_TYPE_CD` | `Queue` · `Desk` · `DG` · `SC` |
| `QUELENGTH` | `WTNG_LINE_LEN` NUMBER(5) | `Queue`·`DG` 만 값이 있다 |
| `ALLOCCNTER` | `FCLT_ALOT_YN` | `Queue` 만 값이 있다 |

### 3.3 Xovis 범위

- `Desk` 는 유인 카운터(`B01`~`N19`)뿐이다. 키오스크 행은 없다.
- 2026-10-13 T1: `Queue` 11개 아일랜드 · 126개 줄 이름 · 3,033행 (배정된 동안만 행이 생긴다).
- T2 는 Xovis 자료가 없다 (명세: "1터미널만 발생(P01)") → T2 CHKN 실적선은 지금처럼 비어 있다.

---

## 4. 산식

시간 `h` 의 구간은 `[h*60, h*60+60)` 분이다. 지금 SQL 의 `TO_CHAR(SMLT_ACTL_DT,'HH24')` · `SUBSTR(…,9,2)`
버킷과 같다.

### 4.1 Cast 대기인원 (`fcstWtngPsgCnt`)

```
island(i) 의 분 m 대기 = queueDay.queueAt(i, m) + sbdDay.queueAt(i, m)
Cast[h] = MAX over i ∈ (CC 아일랜드 ∪ SBD 아일랜드), m ∈ [h*60, h*60+60) ( island(i) 의 분 m 대기 )
```

- `queueDay` = `castChknQueueService.retrieveChknQueueDay(smltId, tmnlId, excnYmd)` (기존, `CC` 공용 Queue)
- `sbdDay` = 새 SBD 분 단위 값 (§5.2)
- 아무 값이 없으면 0. 꼬리 구간 덕에 마지막 결과 뒤에도 `CC` 는 0 까지 줄어든다 (결정 6)

### 4.2 SBD 분 단위 값

- 원천: `castChknMapper.retrieveChknQueueRawList(smltId, fcltTmnlId, "SBD")` — **기존 statement 를 그대로 쓴다**
  (아일랜드 = `SUBSTR(PSG_FCLT_CD, -3, 1)`, 지도·카드와 같은 규칙)
- 아일랜드·`SMLT_ACTL_DT` 별로 묶는다 (`groupByIslandAndMinute` 재사용).
- 한 시각의 값 = 그 시각 SBD 기기 행의 합. 그 값을 **다음 결과 시각 직전까지 유지**한다.
  구간 길이는 `CC` 와 같은 규칙(`toIntervalList`)이다. 다음 시각까지의 차이이고, 마지막은 직전 간격, 하나뿐이면 10분이다.
- 마지막 구간 뒤는 0 이다. SBD 는 흐름 모델이 없어 꼬리 구간을 만들지 않는다.
- 처리·시간 합계는 행의 시작 분에 둔다:
  `processed[m] += TRNST_PSG_CNT`, `waitSecSum[m] += WTNG_HR × TRNST_PSG_CNT`, `prcsSecSum[m] += PRCS_HR × TRNST_PSG_CNT`
  (`ChknQueueRawDto.wtngHr` · `prcsHr` 는 초)

### 4.3 Xovis 대기인원 (`wtngPsgCnt`, `lastWeekWtngPsgCnt`)

```
Xovis[h] = MAX over (스냅샷 t ∈ h, 아일랜드 i) ( SUM over FCLT_TYPE_CD='Queue' 행 (t, i) ( WTNG_LINE_LEN ) )
```

- `-SBD`·`-PRE` 줄을 거르지 않는다 (결정 2).
- `FCLT_ALOT_YN` 으로 거르지 않는다. 배정이 풀린 줄에 서 있는 사람도 대기 인원이다.
- 시간대에 행이 없으면 지금처럼 그 시간이 결과에 없다 → 서비스가 `wtngPsgCnt = null`, 지난주는 `0`.

### 4.4 표 (터미널 전체, 결정 5)

표 한 줄은 그 시간의 **터미널 CHKN 전체**(`CC` 전 아일랜드 + SBD 전 아일랜드)를 설명한다.
대기인원 선(최대 아일랜드)과 단위가 다르다. 여객수(`psgCnt`)도 터미널 전체 값이라 같은 줄에 두는 것이 맞다.

```
cc   = queueDay.tmnlSeries().slotOf(h*60, 60)          // ChknQueueSlot
sbd  = sbdDay 의 [h*60, h*60+60) 합계

prcsPsgCnt = cc.prcsPsgCnt + sbd.processed
waitSec    = (cc.avgWaitSec × cc.prcsPsgCnt + sbd.waitSecSum) / prcsPsgCnt     (prcsPsgCnt = 0 이면 0)
prcsSec    = (cc.avgPrcsSec × cc.prcsPsgCnt + sbd.prcsSecSum) / prcsPsgCnt     (〃)
endQueue   = cc.currentQueue + Σ_i sbdDay.queueAt(i, h*60+59)

wtngHr   = waitSec / 60      (지금과 같은 정수 나눗셈)
prcsHr   = prcsSec / 60
prcsRate = SmltUtils.toPrcsRate(prcsPsgCnt, endQueue)
```

- `prcsRate` 는 체크인 카드 `hrlyPrcsRate` 와 같은 정의다 (처리 / (처리 + 현재 대기)).
  `ChknQueueSlot.prcsRate`(처리용량 사용률)는 의미가 달라 쓰지 않는다.
- `CC` 대기시간은 공용 Queue FIFO 계산값이다. SBD 는 CAST 원천 `AVG_WTNG_HR` 다. SBD 는 흐름 모델이 없어서다.

---

## 5. 변경 작업

### 5.1 `java/mapper/CastDsbdMapper.xml`

새 statement `retrievePsgWtngIslSumByHourList` (resultType `aoms.pm.cast.dto.PsgWtngRawDto`, 파라미터 `ymd`, `tmnlId`):

```sql
/* CastDsbdMapper.retrievePsgWtngIslSumByHourList */
SELECT
    SUBSTR(T.PSG_FLOW_DATA_CRT_DT, 9, 2) || '00' AS TIME,
    NVL(MAX(T.ISL_WTNG_LINE_LEN), 0) AS WTNG_PSG_CNT
FROM (
    SELECT
        A.PSG_FLOW_DATA_CRT_DT,
        A.CHKN_ISL_CD,
        SUM(A.WTNG_LINE_LEN) AS ISL_WTNG_LINE_LEN
    FROM PMOWN.TN_PM_PSG_WTNG_INFO A
    WHERE 1 = 1
    AND A.PSG_FLOW_DATA_CRT_DT BETWEEN #{ymd} || '0000' AND #{ymd} || '2359'
    AND A.TMNL_ID = #{tmnlId}
    AND A.FCLT_TYPE_CD = 'Queue'
    GROUP BY A.PSG_FLOW_DATA_CRT_DT, A.CHKN_ISL_CD
) T
GROUP BY SUBSTR(T.PSG_FLOW_DATA_CRT_DT, 9, 2)
ORDER BY TIME
```

기존 `retrievePsgWtngByHourList` 는 PSG·FLT·DEP 가 계속 쓰므로 **고치지 않는다**.
`CastDsbdMapper.java` 인터페이스에 같은 이름의 메서드를 추가한다 (기존 메서드의 `@Param` 형식을 따른다).

### 5.2 `java/cast/domains/chkn/ChknSbdDay.java` (신규)

SBD 아일랜드별 분 단위 값이다. 상태 없는 값 객체이고 `ChknQueueSeries` 와 같은 `MINUTE_PER_DAY` 배열을 쓴다.

| 메서드 | 반환 |
|---|---|
| `List<String> islandCdList()` | SBD 결과가 있는 아일랜드 |
| `int queueAt(String island, int minute)` | §4.2 유지 값. 없는 아일랜드·범위 밖은 0 |
| `int prcsPsgCnt(int bgnMinute, int minutes)` | 터미널 전체 처리 합 |
| `long waitSecSum(int bgnMinute, int minutes)` | 터미널 전체 `WTNG_HR × TRNST` 합 |
| `long prcsSecSum(int bgnMinute, int minutes)` | 터미널 전체 `PRCS_HR × TRNST` 합 |

생성은 §5.3 서비스가 한다. 파일 머리 주석·접근 제한은 같은 패키지의 `ChknQueueSlot`·`ChknQueueSeries` 를 따른다.

### 5.3 `CastChknQueueService` / `CastChknQueueServiceImpl`

- 인터페이스에 `ChknSbdDay retrieveChknSbdDay(String smltId, TerminalKind tmnlId, String excnYmd);` 추가
- 구현:
  - `castChknMapper.retrieveChknQueueRawList(smltId, fcltTmnlId, "SBD")`
  - 기존 `groupByIslandAndMinute` 로 묶고, 구간 길이는 `toIntervalList` 와 같은 규칙으로 정한다.
    중복을 피하려면 구간 길이 계산만 private 헬퍼로 빼서 둘이 같이 쓴다. `CC` 경로의 동작은 바꾸지 않는다.
  - `"SBD"` 는 상수로 둔다. 기존 `QUEUE_UP_PSG_FCLT_CD`(`CC`)와 그 주석은 그대로 둔다. 공용 Queue 대상은 여전히 `CC` 뿐이다.

### 5.4 `CastDsbdServiceImpl.retrieveDailySmltTmnlRsltByTime` (206행~)

- `category == DsbdCategory.CHKN` 이면 새 경로로 분기한다. 그 외는 지금 코드를 그대로 쓴다.
- CHKN 경로:
  1. `smltStng` · `fltPsgMap` 은 지금처럼 조회한다.
  2. `queueDay = castChknQueueService.retrieveChknQueueDay(smltId, tmnlId, excnYmd)`
  3. `sbdDay = castChknQueueService.retrieveChknSbdDay(smltId, tmnlId, excnYmd)`
  4. Xovis 당일·지난주는 `retrievePsgWtngIslSumByHourList(ymd, tmnlId.getFcltTmnlId())` 로 조회한다. `toMap` 규칙은 지금과 같다.
  5. `TimeBucketUtils.hourList()` 각 시간에 §4.1·§4.4 로 `DsbdRsltDto` 를 채운다.
     `psgCnt` · `wtngPsgCnt` · `lastWeekWtngPsgCnt` 는 기존 `toRsltDto` 와 같은 규칙이다.
  6. `retrieveRsltByHourList` 는 CHKN 에서 부르지 않는다.
- CHKN 행 조립은 별도 private 메서드로 둔다. 기존 `toRsltDto` 는 PSG·FLT·DEP 용으로 남긴다.
- `queueDay` 조회가 기준정보 없음으로 실패하면 그대로 예외를 올린다 (결정 7). 잡아서 0 으로 바꾸지 않는다.

### 5.5 `DsbdCategory`

두 메서드의 호출처는 `CastDsbdServiceImpl` 214·223·228행(이 차트)과 524행(`DsbdCategory.PSG` 고정)뿐이다
(2026-10-15 확인). CHKN 이 새 경로로 빠지면 CHKN 분기를 읽는 곳이 없다.

- `getPsgWtngFcltTypeCdList()` 의 CHKN 분기와 `CHKN_WTNG_TYPE_CD_LIST` 를 지운다.
- `getUpPsgFcltCdList()` 의 CHKN 분기와 `CHKN_FCLT_CD_LIST` 를 지운다.
- 지운 뒤 CHKN 을 넘기면 PSG 값이 반환된다. 서비스가 CHKN 을 먼저 분기하므로 도달하지 않는다.
- `FcltType.getUpPsgFcltCdList()` 는 다른 enum 이다. 건드리지 않는다.

### 5.6 바꾸지 않는 것

- API·DTO: `DsbdRsltDto` 필드와 의미 이름이 그대로다. **프런트(`react/`) 변경 없음**, 목업 변경 없음
- §13 공용 Queue 계산(`ChknQueueCalculator`·`ChknQueueSeries`·`ChknQueueDay`)과 카드·맵·상세·팝업
- `retrieveRsltByHourList` · `retrievePsgWtngByHourList` SQL
- PSG · FLT · DEP 카테고리 산출

### 5.7 문서

- `AGENTS.md` §13 에 한 줄 추가: 요약보기 시간대별 차트 CHKN 은 공용 Queue(`CC`)에 SBD 기기 대기를 아일랜드별로 더해 쓴다.
  SBD 가 있는 아일랜드에서는 카드와 값이 다르며 의도된 차이다. 근거로 이 문서를 링크한다.
- `docs/plans/2026-10-14-dsbd-cast-xovis-wtng-review.md` 상태를 "CHKN 반영"으로 바꾸고 §8-2·5·6·7 을 닫는다.
- 이 문서 상태를 "반영"으로 바꾼다.

---

## 6. 경계 상황

| 상황 | 기대 동작 |
|---|---|
| SBD 결과가 없는 실행 | `sbdDay` 가 비어 Cast 선 = `CC` 공용 Queue 최대 아일랜드. 표도 `CC` 만 |
| `CC` 결과는 없고 SBD 만 있는 아일랜드 (G) | SBD 값만으로 그 아일랜드가 MAX 후보가 된다 |
| 마지막 결과 시각 이후 | `CC` 는 꼬리 구간으로 줄어들고 SBD 는 0. 새벽 시간은 0 |
| 한 시간 처리 0명 | `wtngHr`·`prcsHr` 0, `prcsRate` = `toPrcsRate(0, endQueue)` → 0 |
| T2 | Xovis 행이 없어 `wtngPsgCnt` = null, 지난주 0. Cast 는 정상 산출 |
| 기준정보 없음 | CHKN 차트 조회 실패 (결정 7) |

---

## 7. 검증

이 저장소에서는 `java/` 를 컴파일할 수 없다. 아래는 실제 백엔드·DB 에서 한다.

1. **빌드**: 백엔드 레포에서 컴파일·기동.
2. **Xovis SQL**: 표본 CSV 의 2026-09-14 07:10 스냅샷 아일랜드 합은 B 12 · C 282 · D 210 · E 103 · F 9 · H 9 ·
   J 0 · K 94 · L 78 · M 4 · N 0 이다. 같은 자료가 적재된 DB 라면 07시 Xovis 값은 **282 이상**이다.
3. **SBD 아일랜드 추출**: `TN_PM_SMLT_PSG_FCLT` 에서 `UP_PSG_FCLT_CD = 'SBD'` 인 `PSG_FCLT_CD` 를 보고
   `SUBSTR(…, -3, 1)` 이 아일랜드 문자(G 등)인지 확인한다. 지도·카드도 같은 규칙이라 다르면 그쪽도 이미 어긋난 것이다.
4. **카드 일치**: SBD 가 없는 아일랜드가 최대인 시간대에서, 차트 Cast 값 = 그 시간 체크인 카드 아일랜드 Queue 의
   시간 내 최대여야 한다 (같은 `queueDay`).
5. **화면**: 요약보기 T1 체크인 탭에서 확인한다. 두 선이 같은 크기 범위(수십~수백 명)에 있고, 새벽에 Cast 가 0 까지
   내려가며, 표의 대기시간·처리시간·비율이 0 이 아닌 값으로 채워지는지 본다.
6. **회귀**: PSG · FLT · DEP 탭 값이 변경 전과 같은지 본다.

### 7.1 참조 사본 검증 결과 (2026-10-15)

- 변경한 Java 파일 전체를 JDK 구문 파서로 확인했다. 실제 백엔드 의존성을 포함한 컴파일은 아니다.
- 서비스 메서드와 SBD 값 객체를 임시 Java 하네스에서 검증했다(외부 의존성 대체).
  SBD 기기 합산·구간 유지·마지막 구간 종료·시간/자정 경계·빈 결과·배열 방어 복사,
  같은 분의 CC+SBD 최대값·터미널 가중평균·시간 끝 대기 기준 처리비율·실적 누락 처리가 통과했다.
- 신규 Xovis SQL의 SQLite 등가 실행으로 같은 시각·아일랜드 합산, 날짜·터미널·유형 필터,
  SBD·PRE 줄 포함과 배정 해제 줄 포함을 확인했다. 제공 CSV의 2026-09-14 07시 결과는 **282명**이다.
  Oracle 실행·실DB 데이터 검증을 대신하지 않는다.
- 기존 두 공용 SQL, CHKN 이외 차트 경로·DTO 조립, CC 조회·그룹화·꼬리 구간·가중 처리시간·배정 부스 계산의
  동작 코드가 유지되는 것을 대조했다. CC 구간 길이 계산은 같은 규칙의 헬퍼로 추출했다.
- `react/`의 `npx.cmd tsc -b`와 `git diff --check`가 통과했다.
- §7의 실제 백엔드 빌드·Oracle·화면 통합 검증은 남아 있다.
