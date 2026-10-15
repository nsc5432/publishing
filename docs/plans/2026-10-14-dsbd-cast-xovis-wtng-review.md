# 요약보기 차트 Cast·Xovis 대기인원 산출 검토

작성일: 2026-10-14 · 대상: `java/cast`, `java/mapper` · 상태: **CHKN 반영 (참조 사본 구현, 실제 백엔드·DB 검증 대기)**

요약보기 터미널 패널의 시간대별 차트(`TerminalSummary.tsx` 범례 `Cast 대기인원(예측)` /
`Xovis 대기인원(실적)`)가 두 원천을 어떻게 산출하는지 확인하고, 둘이 같은 의미로 비교되는지 검토한 기록이다.

`java/`는 참조 사본이라 이 저장소에서 컴파일하지 않았다.

---

## 1. 변경 전 산출 경로

API `DSBD_TMNL_RSLT` → `CastSmryController.retrieveDailySmltTmnlRsltByTime`
→ `CastDsbdServiceImpl.retrieveDailySmltTmnlRsltByTime` (206행~)

| 구분 | DTO 필드 | Mapper | 테이블 · 컬럼 |
|---|---|---|---|
| Cast (예측) | `fcstWtngPsgCnt` | `CastDsbdMapper.retrieveRsltByHourList` | `PMOWN.TN_PM_SMLT_RSLT_DTL.WTNG_PSG_CNT` |
| Xovis (실적) | `wtngPsgCnt` | `CastDsbdMapper.retrievePsgWtngByHourList` | `PMOWN.TN_PM_PSG_WTNG_INFO.WTNG_LINE_LEN` |
| 지난주 동요일 | `lastWeekWtngPsgCnt` | 위 Xovis 쿼리를 `excnYmd - 7일`로 재호출 | 〃 |

### 1.1 시설 구분 (`DsbdCategory`)

| 카테고리 | Cast `UP_PSG_FCLT_CD` | Xovis `FCLT_TYPE_CD` |
|---|---|---|
| CHKN 체크인카운터 | `CC`, `CK`, `SBD` | `Queue` |
| DEP 출국장 | `LGT`, `LC`, `SC`, `SR` | `DG`, `SC` |
| PSG / FLT | 전체 8종 (`LS`, `CC`, `CK`, `SBD`, `LGT`, `LC`, `SC`, `SR`) | `Queue`, `DG`, `SC` (2026-10-14 변경, §3) |

보안검색대는 별도 카테고리가 아니라 DEP 에 포함된다.

### 1.2 조회 조건과 집계

**Cast** — `TN_PM_SMLT_RSLT_DTL` ⨝ `TN_PM_SMLT_PSG_FCLT` (`PSG_FCLT_CD`)
- 조건: `SMLT_ID`, `TMNL_ID`, `USE_YN='Y'`, `UP_PSG_FCLT_CD IN (카테고리별)`
- 시간 키: `TO_CHAR(SMLT_ACTL_DT, 'HH24') || '00'`
- 대기인원: `MAX(WTNG_PSG_CNT)` — 안쪽 SELECT 에 GROUP BY 가 없으므로 **개별 `PSG_FCLT_CD` 행(부스·레인 1개) 중 최대값**
- 처리인원: `SUM(TRNST_PSG_CNT) OVER (PARTITION BY 시간, UP_PSG_FCLT_CD)` 의 `MAX`
- 대기·처리시간: `ROUND(AVG(AVG_WTNG_HR / AVG_PRCS_HR))` → 서비스에서 초→분

**Xovis** — `TN_PM_PSG_WTNG_INFO`
- 조건: `PSG_FLOW_DATA_CRT_DT BETWEEN {ymd}0000 AND {ymd}2359`, `TMNL_ID`, `FCLT_TYPE_CD IN (카테고리별)`
- 시간 키: `SUBSTR(PSG_FLOW_DATA_CRT_DT, 9, 2) || '00'`
- 대기인원: `MAX(WTNG_LINE_LEN)` — 한 시간 안 **대기열 스냅샷 중 최대값**
- 테이블 컬럼: `PSG_FLOW_DATA_CRT_DT, TMNL_ID, CHKN_ISL_CD, FCLT_NM, FCLT_TYPE_CD, FCLT_ALOT_YN, WTNG_LINE_LEN`

**공통**
- 24시간 축은 `TimeBucketUtils.hourList()` 로 애플리케이션이 채운다.
- 같은 시간 키 중복은 `toMap(..., (first, ignored) -> first)` 로 첫 값을 쓴다.
- Xovis 측정값이 없는 시간은 `null`(실적선을 끊어 그림), 지난주 값이 없으면 `0`.
- 기준일: Cast 는 `smltId`, Xovis 는 `smltStng.getExcnYmd()`.

---

## 2. 앞선 답변 정정

1. **PSG/FLT 의 Xovis 는 "없음"이 아니었다.** 빈 리스트를 넘기면 mapper 의
   `<if test="fcltTypeCdList != null and fcltTypeCdList.size() > 0">` 가 필터를 건너뛰어
   **모든 `FCLT_TYPE_CD` 행의 MAX** 가 그려지고 있었다.
2. **Cast 의 MAX 는 "시설별 합의 최대"가 아니다.** 개별 부스 행의 최대다. 시설별 합산은 처리인원뿐이다.

---

## 3. 반영한 변경 (2026-10-14)

`java/cast/enums/DsbdCategory.java`
- `ALL_WTNG_TYPE_CD_LIST = List.of("Queue", "DG", "SC")` 추가
- `getPsgWtngFcltTypeCdList()` 가 PSG/FLT 에서 빈 리스트 대신 위 상수를 반환
- 산식은 `MAX` 유지. 호출처는 `retrieveDailySmltTmnlRsltByTime` 의 두 곳(당일·지난주)뿐

검토했으나 채택하지 않은 안: PSG/FLT 를 `Queue`·`DG`·`SC` 의 **평균**으로 처리
- Cast 가 MAX 라 두 선의 의미가 달라져 실적이 늘 낮게 보인다
- 행 단위 `AVG` 는 행이 많은 Queue(아일랜드별)에 끌려간다
- 유형별 최대값의 평균은 물리적 의미가 없다

**반영 전 확인**: 운영 DB 에서 `SELECT DISTINCT FCLT_TYPE_CD FROM PMOWN.TN_PM_PSG_WTNG_INFO`.
다른 유형이 있었다면 PSG/FLT 실적선이 낮아질 수 있다.

---

## 4. 주의사항 검토 목록

| # | 내용 | 상태 |
|---|---|---|
| 1 | Cast·Xovis 의 MAX 가 가리키는 단위가 다르다 | **검토함** (§5) |
| 2 | Xovis `FCLT_ALOT_YN`·`CHKN_ISL_CD` 를 조회에서 쓰지 않는다. 터미널 전체를 MAX 로 뭉친다 | 미검토 |
| 3 | 체크인 카드·터미널맵·상세는 공용 Queue(`CC` 만, 아일랜드 합)를 쓰는데 차트만 다르다 | §5 에 흡수 |
| 4 | Xovis 어댑터는 스켈레톤이다 (`XovisDataDto`, `QueueDataSource.XOVIS`). 혼잡해소 팝업은 CAST 원천만 연결 | 미검토 |
| 5 | `TN_PM_PSG_WTNG_INFO` 적재 경로가 이 저장소에 없다. 읽는 곳은 차트와 `temp-batch/ScMake/ScshOperPlcyMapper`(`FCLT_TYPE_CD='SC'`) | 미검토 |

---

## 5. 주의사항 1 — MAX 단위 불일치

CHKN은 양쪽 모두 같은 시각의 아일랜드 합을 구한 뒤 시간 내 최댓값을 쓰도록 반영했다.
아래는 검토 당시 기록이며, 최종 산식은 [구현 계획](2026-10-15-dsbd-chkn-chart-island-queue.md) §4를 따른다.

### 5.1 행 단위

| | Cast | Xovis |
|---|---|---|
| 한 행 | `SMLT_ACTL_DT` + `PSG_FCLT_CD` (부스·레인 1개) | 생성시각 + `CHKN_ISL_CD` + `FCLT_NM` + `FCLT_TYPE_CD` (대기열 1개) |
| 값 | `QueueLength_Current` — **부스별 독립 값** (`docs/plans/2026-09-04-checkin-common-queue.md:14`) | 그 대기열의 길이 |
| 차트 의미 | 가장 긴 **부스 하나**의 Queue | 가장 긴 **대기열 하나** |

### 5.2 체크인에서의 영향

체크인 아일랜드는 줄 하나를 여러 부스가 받는다. Xovis `Queue` 는 `CHKN_ISL_CD` 를 가지므로
아일랜드 공용 줄로 보인다 (**가정 — §7 쿼리로 확인 필요**).

예: A 아일랜드 120명, 운영 부스 12개 → Xovis **120**, Cast 는 부스별로 나뉘어 **약 10~15**.
예측 오류가 아니라 단위 차이다. §13 공용 Queue 는 이 때문에 `SUM(부스별 WTNG_PSG_CNT)` 로 합친다.

같은 대시보드 안에서도 체크인 카드(아일랜드 합)와 차트 Cast 선(부스 최대)이 어긋난다.

### 5.3 대상 시설 불일치

| 카테고리 | Cast 에만 있는 대상 | 영향 |
|---|---|---|
| CHKN | `CK`, `SBD` | 키오스크 대기가 최대가 되면 다른 줄을 비교. §13 은 `CC` 만 대상 |
| DEP | `LC`(출국심사), `SR` | `LC` 는 Xovis 대응 유형이 없다 |
| PSG/FLT | `LS`(랜드사이드 좌석) 포함 | 좌석은 대기열이 아니다 |

### 5.4 그 밖의 요인

- **샘플링 주기**: MAX 는 표본이 촘촘할수록 높게 나온다. CAST 결과 간격·Xovis 스냅샷 주기는 미확인.
- **시각 귀속**: `SMLT_ACTL_DT` 가 구간 시작/끝 중 무엇인지, Xovis 생성시각의 의미에 따라 정시 경계에서
  한 시간 밀릴 수 있다 (`FacilityQueueMetrics` 주석에도 미결로 남아 있다).

---

## 6. 해결 방향 검토

### 6.1 제안: castrest 수신 시 아일랜드 큐를 계산해 DB 저장 — **비권장**

- §13(2026-09-04)에서 "Queue 는 조회 시 계산, 별도 결과 테이블·DDL 없음"으로 결정했다.
- 아일랜드 큐는 이미 `domains/chkn` 에 있다. `domains/queue` 는 혼잡해소 팝업용 M/M/s 정상상태
  계산이라 시간 궤적을 만들지 않는다.
- 계산 입력에 배정 시간 구간·처리시간 fallback 이 들어가 수신 뒤 정정되면 저장값이 낡는다.
- §11.4 수신 트랜잭션(결과·마스터·이력·요청 완료)이 무거워지고, 산식 변경 때 과거분 재계산이 필요하다.
- DEP/SC 불일치는 해결하지 못한다.

저장이 필요해지는 경우(성능 측정상 문제, 외부 시스템의 SQL 조회)에도 수신 트랜잭션 밖에서
재계산 가능한 **파생 캐시 테이블**(계산 버전 컬럼 포함)로 둔다.

### 6.2 권장: 차트 CHKN Cast 선을 `ChknQueueDay` 에서 산출

**CHKN 반영 완료.** 최종 구현은 `CC` 공용 Queue에 같은 분·아일랜드의 SBD 기기 대기를 더한다.
Xovis도 같은 시각·아일랜드의 모든 `Queue` 줄(`-SBD` 포함)을 합산한다. 아래 제안은 검토 당시 기록이다.

| 재사용 대상 | 역할 |
|---|---|
| `CastChknQueueServiceImpl.retrieveChknQueueDay(smltId, tmnlId, excnYmd)` | 하루치 조립 |
| `ChknQueueDay.slotOf(island, bgnMinute, minutes)` / `tmnlSeries()` | 아일랜드별·터미널 합 시리즈 |
| `ChknQueueSlot` | `maxQueue`, `avgQueue`, `prcsPsgCnt`, `avgWaitSec`, `avgPrcsSec`, `prcsRate`, `oprBoothCnt` |

```
Cast 대기인원[h] = MAX over 아일랜드 ( day.slotOf(island, h*60, 60).getMaxQueue() )
```

- "가장 긴 아일랜드 줄 하나" → Xovis `Queue` 의 MAX 와 단위가 맞는다 (§5.2 가정 전제)
- 체크인 카드와 같은 계산 → 대시보드 내 수치 일치, `CC` 만 대상
- DDL·castrest·수신 트랜잭션 변경 없음

> **2026-10-15: 전제가 깨졌다 (§7.1).** Xovis `Queue` 는 항공사별 줄이라 Cast 만 아일랜드로 올리면 이번엔
> Cast 가 높게 나온다. Xovis 쪽도 **같은 시각·아일랜드의 `Queue` 를 합친 뒤** MAX 를 잡아야 단위가 맞는다.
>
> ```
> Xovis 대기인원[h] = MAX over (10분 스냅샷 t ∈ h, 아일랜드 i) ( SUM over 줄 q ∈ (t, i), q ∉ SBD ( len ) )
> Cast  대기인원[h] = MAX over 아일랜드 ( day.slotOf(island, h*60, 60).getMaxQueue() )
> ```
>
> `ChknQueueSeries` 의 1분 궤적은 표본이 아니라 CAST 결과 시각(`SMLT_ACTL_DT`) 사이를 보간한 값이다. 한 구간 안에서
> 유입·처리용량이 균등이라 궤적이 단조이고, 최대값은 구간 끝점에서 나온다. 그래서 1분 궤적이라고 해서 MAX 가
> 부풀지 않는다. CAST 결과도 10분 간격이라 (§7.5) Xovis 와 표본 주기가 같고, 남는 차이는 시각 귀속(§5.4)이다.

---

## 7. 확인할 것

CHKN 원천·집계 결정 확인은 완료했다 (§7.1~7.5). 실제 백엔드·DB 검증은 구현 계획 §7에 남긴다.
DEP 출국장 번호 정합은 계속 미결이다.

Xovis 한 행이 무엇을 재는지 (`TMNL_ID` 값은 실제 코드로 바꾼다):

```sql
SELECT FCLT_TYPE_CD,
       COUNT(DISTINCT CHKN_ISL_CD) AS ISL_CNT,
       COUNT(DISTINCT FCLT_NM)     AS FCLT_CNT,
       COUNT(*)                    AS ROW_CNT
FROM PMOWN.TN_PM_PSG_WTNG_INFO
WHERE PSG_FLOW_DATA_CRT_DT LIKE '20261013%'
AND TMNL_ID = 'P01'
GROUP BY FCLT_TYPE_CD;
```

- 스냅샷 시각당 `Queue` 행이 아일랜드당 1개인지 → §6.2 전제
- `SC`·`DG` 가 레인 단위인지 출국장 단위인지 → DEP 쪽 Cast 를 `PSG_FCLT_CD` 그대로 둘지, 출국장 번호로 합칠지
- `FCLT_TYPE_CD` 전체 값 목록 → §3 변경 영향

### 7.1 결과 (2026-10-15 확인, T1 · 2026-10-13)

| 유형 | 아일랜드 | 시설명 | 행 | 행/시설 |
|---|---:|---:|---:|---:|
| `DG` | 6 | 18 | 2,592 | 144 |
| `Desk` | 11 | 379 | 54,576 | 144 |
| `Queue` | 11 | 126 | 3,033 | 약 24 |
| `SC` | 6 | 36 | 5,184 | 144 |

해석에 Xovis 명세 `대기행렬/datas/xovis/csv/Spec.csv` 와 표본 `data-all.csv`(2026-09-14 07:10) 를 함께 썼다.

- **유형은 4개이고 `Desk` 가 있다.** 명세상 `QUELENGTH` 는 `Queue` 만 준다 → `Desk` 를 뺀 §3 변경은 맞다.
  `Desk`·`SC` 의 `WTNG_LINE_LEN` 은 NULL 이라 §3 전후 수치는 같다 (§7.3).
- **10분 주기, 하루 144회 스냅샷**이다 (명세 `OCCURTIME`: 10분 주기). §5.4 의 Xovis 샘플링 주기는 해소.
- **`Queue` 는 아일랜드 공용 줄이 아니다.** `FCLT_NM` 은 `항공사코드+클래스`(예: `TW_1`, `VJ_1-PRE`, `7C-SBD`)이고
  배정된 동안만 행이 생긴다 (행/시설 ≈ 24). 표본에서 E·K·M 아일랜드는 같은 시각에 줄이 3개다.
  → **§6.2 전제가 깨졌다.** Xovis `MAX` 는 "가장 긴 항공사 줄 하나"라 Cast 아일랜드 합과도 단위가 다르다.
- **`7C-SBD` 처럼 셀프백드롭 줄도 `Queue` 로 들어온다.** §13 은 `CC` 만 대상이라 맞추려면 걸러야 한다.
- **`DG`·`SC` 의 `CHKN_ISL_CD` 는 출국장 번호(01~06)다.** `DG` 는 출국장당 `DG{n}`·`DG{n}_E`·`DG{n}_W` 3개,
  `SC` 는 레인(`T1_DG{n}_Lane{nn}`)이다. 표본의 `SC` 행은 `QUELENGTH` 가 비어 있다.
  `temp-batch/ScMake` 도 `SC` 에서는 `FCLT_ALOT_YN`(레인 개방)만 읽는다.
- 표본 `DG2`=24, `DG2_E`=5, `DG2_W`=1 이라 `DG{n}` 이 E·W 를 포함한 합인지 별도 구역인지 알 수 없다.

### 7.2 원천 ↔ 테이블 매핑

`data-all.csv` 가 `TN_PM_PSG_WTNG_INFO` 와 같은 자료다 (2026-10-15 확인). `WTNG_LINE_LEN` 은 `NUMBER(5)` 라
`MAX` 는 숫자 비교다. `HISTWAITTIME` 은 대응 컬럼이 없다.

| CSV | 컬럼 | 값이 있는 유형 (표본) |
|---|---|---|
| `OCCURTIME` · `TERMINAL` · `ISLAND` · `DESKNAME` · `DESKTYPE` | `PSG_FLOW_DATA_CRT_DT` · `TMNL_ID` · `CHKN_ISL_CD` · `FCLT_NM` · `FCLT_TYPE_CD` (PK) | 전체 |
| `QUEID` | `WTNG_LINE_ID` | `Queue` |
| `QUELENGTH` | `WTNG_LINE_LEN` | **`Queue`, `DG`** |
| `WAITTIME` · `EXPTWAITTIME` | `WTNG_HR` · `EST_WTNG_HR` | `Queue`, `DG` |
| `OUTRATEQUEUE` · `OUTINPAXCNT` · `OVERPAXREM` | `WTNG_LINE_PSG_DCRS_SPD` · `WTNG_LINE_DCRS_FCLT_INCRS_PSG_CNT` · `OVFW_CRT_RMRK_CN` | `Queue` |
| `ALLOCCNTER` | `FCLT_ALOT_YN` | **`Queue` 만** |
| `ALLOCARLN` | `ALN_ALOT_YN` | `Desk` |
| `DESKOPEN` | `FCLT_USE_YN` | `Desk`, **`SC`** |
| `OUTRATEDESK` · `OPENTIME` · `OUTPAXCNTDESK` · `TOTALPAXCNTDESK` · `PROCTIME` | `FCLT_PSG_DCRS_SPD` · `DALY_ACML_USE_HR` · `FCLT_DCRS_PSG_CNT` · `DALY_ACML_PSG_CNT` · `TASK_PRCS_HR` | `Desk` (`SC` 는 `TOTALPAXCNTDESK` 만) |

### 7.3 표본(07:10 스냅샷)으로 확인한 것

- **`Desk`·`SC` 는 `WTNG_LINE_LEN` 이 NULL 이다.** `MAX` 에 영향이 없으므로 §3 변경 전후 차트 수치는 같다.
  `ALL_WTNG_TYPE_CD_LIST` 의 `SC` 와 DEP 의 `SC` 는 값이 없는 필터다.
- **`DG{n}` ≥ `DG{n}_E + DG{n}_W`** (6개 출국장 모두. `DG3` 는 4 = 2+2). `DG{n}` 이 출국장 전체 줄이고
  E·W 는 그 일부로 보인다. 따라서 현재 `MAX` 는 사실상 "가장 긴 출국장 전체 줄"을 고른다.
- **아일랜드당 동시에 열린 `Queue` 는 1~3개**이고, 합과 최대가 크게 다르다 (C: 합 282 / 최대 146, D: 210 / 149).
- **L 아일랜드의 `7C-SBD` 줄(43명)이 그 아일랜드의 최대 줄**이다. `CC` 만 비교하려면 SBD 줄을 걸러야 한다.
- **`Queue` 이름 형식**(24개): `{항공사}` · `{항공사}_{n}` · `{항공사}-PRE` · `{항공사}_{n}-PRE` · `{항공사}-SBD`.
  `-SBD` 는 `7C-SBD` 1건뿐이고, 명세도 이름 규칙을 "Airline코드 + 알파 (미정)" 으로 둔다.
- **`Desk` 는 유인 카운터뿐이다** (`B01`~`N19`, 아일랜드당 36개, N 만 19개). 키오스크 Desk·키오스크 줄은 없다
  → Xovis 는 키오스크를 재지 않는다.
- **Xovis 아일랜드는 B·C·D·E·F·H·J·K·L·M·N 11개다.** A·G·I 가 없다 (§7.1 의 `ISL_CNT` 11 과 같은 수).
  셀프백드롭 전용 G 아일랜드는 Xovis 가 재지 않는다. Cast 에는 G 가 있다 (`T1CCG13` 등, 아일랜드 = `PSG_FCLT_CD` 끝에서 3번째 글자).

**SBD 는 빼지 않는다 (2026-10-15 결정).** G 아일랜드(셀프백드롭 전용)의 혼잡도 운영상 중요한 대상이다.
Xovis `-SBD` 줄은 아일랜드 합에 그대로 넣고, Cast 도 SBD 를 넣어야 단위가 맞는다. §13 공용 Queue 는 `CC` 만이라
Cast 쪽 SBD 산출 방법은 §8-6 에서 정한다.
- 표본은 스냅샷 1개라 위 관계는 경향이다. 특히 `DG` 의 포함 관계는 하루치로 다시 보면 확정된다.

### 7.4 덧붙여 발견한 것 — `temp-batch/ScMake`

`ScshOperPlcyAggregator` 는 `SC` 행의 `FCLT_ALOT_YN = 'Y'` 로 개방 레인을 센다. 그런데 원천에서 `SC` 의 개방
여부는 `DESKOPEN` → `FCLT_USE_YN` 에 있고 `ALLOCCNTER`(→ `FCLT_ALOT_YN`) 는 비어 있다. 적재가 컬럼 그대로라면
개방 레인이 늘 0개로 집계된다. 원천 값도 `0`/`1` 이라 적재 시 `Y`/`N` 변환 여부도 함께 확인한다 (주의사항 5).

### 7.5 CAST 결과 간격 — 10분

표본 `대기행렬/datas/cast-result/csv/data-all.csv` (`TN_PM_SMLT_RSLT_DTL`, 2026-02-22 07:00:00 한 시각 560행).
시각이 하나라 간격을 직접 잴 수는 없지만, 행이 구간 집계라 처리량으로 역산된다.

- 행마다 `MIN`·`AVG`·`MAX_WTNG_LEN` 이 있다 → 한 행은 시점 값이 아니라 **구간 통계**다.
- 줄이 끝까지 비지 않은 부스(`MIN_WTNG_LEN ≥ 2`, 예: `T1CCN02~05`)는 처리시간 120초 × 처리 5명 = **600초**다.
  처리시간 120초인 CC 부스 중 최대 처리량도 5명(600초)이다 → **구간 = 10분**.
- `SMLT_ACTL_DT` 가 구간 시작인지 끝인지는 한 시각만으로는 알 수 없다 (§5.4 남음).
- `WTNG_PSG_CNT` > `MAX_WTNG_LEN` 인 행이 24건이다 (예: `T1CCN05` 7 vs 6). `WTNG_PSG_CNT` 가 처리 중 인원을
  포함할 수 있어, Xovis `QUELENGTH` 와 1명 안팎의 정의 차이가 있을 수 있다 (미확인).

---

## 8. 미결 결정

> 2026-10-15: CHKN 관련 결정(2·5·6·7, 결과 없는 시간대·기준정보 의존 포함)을 참조 사본에 반영했다.
> 구현 계획은 [CHKN 아일랜드 Queue](2026-10-15-dsbd-chkn-chart-island-queue.md). 남은 것은 3(DEP)·4(주의사항 2·4·5)와 실제 백엔드·DB 검증이다.

1. ~~§7 쿼리 결과 확인~~ (2026-10-15, §7.1~7.3)
2. ~~§6.2 진행 시 범위~~ — 대기인원 선과 표(대기시간·처리시간·비율) 모두 CC·SBD 새 산출로 반영
3. DEP 정합: Xovis DEP 는 사실상 `DG{n}`(출국장 전체 줄)뿐이다. Cast 를 출국장 번호로 합칠지, `LC` 를 뺄지
4. 주의사항 2·4·5 검토. 2는 §7.1 로 일부 답이 나왔다 (`CHKN_ISL_CD` 를 묶음 키로 써야 한다)
5. ~~Xovis 집계 단위~~ — 같은 시각·아일랜드 합 → 시간 내 최댓값으로 반영. `-SBD`·`-PRE` 포함, 배정 여부 필터 없음
6. ~~Cast SBD 산출~~ — A안(CC 공용 Queue + SBD 기기 대기 합) 반영. 카드·맵·상세·추천은 유지하고 차트와 카드의 차이를 허용
7. ~~Xovis 미측정 아일랜드~~ — G 등도 Cast 선에 포함하도록 반영. 해당 아일랜드의 실적 비교에는 관측 범위 한계가 남음
