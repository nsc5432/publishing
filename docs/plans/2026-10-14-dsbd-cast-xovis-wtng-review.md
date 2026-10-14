# 요약보기 차트 Cast·Xovis 대기인원 산출 검토

작성일: 2026-10-14 · 대상: `java/cast`, `java/mapper` · 상태: **검토 중 (주의사항 1번까지 검토)**

요약보기 터미널 패널의 시간대별 차트(`TerminalSummary.tsx` 범례 `Cast 대기인원(예측)` /
`Xovis 대기인원(실적)`)가 두 원천을 어떻게 산출하는지 확인하고, 둘이 같은 의미로 비교되는지 검토한 기록이다.

`java/`는 참조 사본이라 이 저장소에서 컴파일하지 않았다.

---

## 1. 현재 산출 경로

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

---

## 7. 확인할 것

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

---

## 8. 미결 결정

1. §7 쿼리 결과 확인
2. §6.2 진행 시 범위: 대기인원 선만 바꿀지, 표 보기의 대기시간·처리시간·비율(%)도 `ChknQueueSlot` 값으로 바꿀지
3. DEP 정합: `LC` 제외 여부, `SC`·`SR` 합산 단위
4. 주의사항 2·4·5 검토
