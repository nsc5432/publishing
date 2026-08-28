# 대시보드 요약정보·시설 추천 구현계획

작성일 2026-08-27 · 대상 `react/src/modules/pm/pages/dashboard`, `react/src/api/pm`,
`java/cast`, `java/mapper`

---

## 0. 문서 목적과 전제

이 문서는 대시보드 `TerminalSummary`의 summary view 중 다음 기능의 확정된 구현 방안을 정리한다.

- 조회 시각 기준 rolling 60분 시설 집계
- 체크인카운터·보안검색대 처리량의 `Pax/Min` 변환
- `TN_PM_PSG_PRCS_GRD` 기반 시설별 혼잡등급 판정
- 60분 안에 `NORMAL` 이하로 진입시키는 총 소요 시설 수 추천
- 기준정보 누락과 처리능력 산정 실패의 명시적 예외 처리

`java/`는 빌드 파일과 실제 패키지 경로가 없는 참조 사본이다. Java·MyBatis 변경은 실제 백엔드
레포에 반영한 뒤 빌드·DB 통합검증을 해야 한다. 이 레포에서는 React 타입체크·lint와 SQL/DTO의
정적 대조만 가능하다.

API DTO 필드명, enum 문자열, `className`, DOM id, CSS 커스텀 프로퍼티는 변경하지 않는다.
특히 `FcltRecommendDto.addCnt`라는 필드명은 유지하되 의미를 "추가 수량"이 아닌
"SLA 충족에 필요한 총 소요 수량"으로 확정한다.

---

## 1. 확정된 업무 규칙

### 1.1 추천·집계 기준

| 항목 | 확정 내용 |
|---|---|
| 추천 수량 | 현재 운영 수와 무관한 **총 소요 수량** |
| 처리량 표시 | `Pax/Min` |
| 시설 집계 구간 | 조회 시각 이상, 조회 시각 + 60분 미만 |
| 추천 정책 | CAST 결과를 이용한 SLA 큐 예측 |
| 혼잡해소 완료 | 시설별 `NORMAL` 상한 이하 진입 |
| 목표 시간 | 최대 60분, 단 자정에서는 당일 결과 종료 시각까지 |
| 시설당 처리능력 | 현재 조회 구간 실적, 0이면 직전 유효 구간 실적 |
| 체크인 추천 범위 | 유인 체크인카운터 `CC`만 |
| 체크인 추천 대상 | 조회 기준 시각에 해당 아일랜드에 가장 많이 배정된 항공사 |
| 보안검색 범위 | `SC`와 `SR`을 하나의 보안검색 그룹으로 합산 |
| 물리적 수량 초과 | 제한하지 않고 계산된 이론적 총 소요 수량 표시 |
| 기준정보 누락 | 추천값 0으로 대체하지 않고 서버 예외 발생 |

### 1.2 시설 그룹 매핑

| 시설 | 상위 시설코드 `UP_PSG_FCLT_CD` | `FCLT_GROUP_CD` |
|---|---|---|
| 셀프체크인 | `CK` | `01` |
| 체크인카운터 | `CC` | `02` |
| 출국장 | `LGT` | `03` |
| 보안검색대 | `SC`, `SR` | `04` |

이번 추천 계산에서 직접 사용하는 매핑은 `CC → 02`, `SC/SR → 04`다. `CK → 01`,
`LGT → 03`은 시설 카드의 다른 지표와 후속 확장을 위해 같은 매핑 정의에 보존한다.

### 1.3 혼잡등급 매핑

| `PSG_PRCS_GRD_CD` | 업무 등급 | 화면 enum |
|---|---|---|
| `01` | 여유 | `FREE` |
| `02` | 원활 | `NORMAL` |
| `03` | 혼잡 | `BUSY` |
| `04` | 매우혼잡 | `VERY_BUSY` |

혼잡해소 목표값은 해당 `FCLT_GROUP_CD`에서 `PSG_PRCS_GRD_CD='02'`인 행의 `MAX_VL`이다.

```text
targetQueue = NORMAL.MAX_VL
혼잡해소 완료 = predictedQueue <= targetQueue
```

경계값 포함 여부는 `NORMAL`의 `MAX_VL`까지 `NORMAL`로 판정한다. 전체 혼잡등급 색상도 동일한
기준정보의 `MIN_VL`·`MAX_VL` 구간으로 결정한다.

---

## 2. 현재 구현과 변경 필요점

### 2.1 현재 시설 카드 집계

`CastDsbdMapper.retrieveRsltByUnitList`는 다음 조건으로 조회한다.

```sql
TO_CHAR(A.SMLT_ACTL_DT, 'HH24') = SUBSTR(#{hhmm}, 1, 2)
```

따라서 10:00, 10:10, 10:30 조회가 모두 `[10:00, 11:00)` 결과를 사용한다. 체크인 카드는
`CC + CK + SBD`, 출국장 카드는 `LGT + SC + SR`을 묶고, 서비스에서 동일 아일랜드·출국장 결과를
다시 합친다.

현재 처리인원은 한 시간 `SUM(TRNST_PSG_CNT)`인데 화면은 이미 `Pax/Min`으로 표시하므로 단위가
일치하지 않는다. 처리율 게이지는 `처리인원 / (처리인원 + 대기인원)`이고 시설당 처리능력과는
별개다.

### 2.2 현재 추천·혼잡해소

실통신 서비스는 추천을 계산하지 않고 다음 빈 값을 반환한다.

```text
targetNm = ''
addCnt = 0
needAssignYn = 'N'
```

혼잡해소 시각은 조회 `hhmm`, 게이지 값은 0으로 내려간다. 화면에 보이는 항공사 5개,
보안검색대 6개 등의 값은 `dashboard.mock.ts` 고정 데이터다.

`CongestionStatus.ofWtngPsgCnt()`는 공통 80/220/420명 경계를 사용한다. 이 메서드는 다른 PM
화면에서도 사용하므로 이번 작업에서 제거하지 않는다. 대시보드 시설 카드만 DB 등급표를 사용하는
새 경로로 전환하고, 다른 화면의 전환은 별도 범위로 둔다.

### 2.3 현재 요약정보

좌측 운항편·여객 요약은 이미 `[hhmm, hhmm+itvlMin)` 방식이며 `itvlMin=60`이다. 이 로직은
유지한다. 이번 rolling 60분 변경 대상은 시설 카드 조회와 추천 계산이다.

상단 피크와 우측 요약정보의 대기인원·최대 대기시간 집계 정의 변경은 이번 확정사항에 포함되지
않는다. 현재 피크 계산의 `MAX(WTNG_PSG_CNT)`와 `AVG(AVG_WTNG_HR)` 의미 정합화는 별도 과제로 둔다.

---

## 3. 시간 범위 모델

### 3.1 rolling 구간 생성

서비스가 `TN_PM_SMLT_STNG.EXCN_YMD`와 요청 `hhmm`으로 timestamp를 만든다.

```text
dayStart = EXCN_YMD 00:00
bgnDt = EXCN_YMD + hhmm
naturalEndDt = bgnDt + 60분
endDt = min(naturalEndDt, dayStart + 1일)
actualMinutes = endDt - bgnDt
```

| 조회 | `bgnDt` | `endDt` | `actualMinutes` |
|---|---|---|---:|
| 10:00 | 당일 10:00 | 당일 11:00 | 60 |
| 10:10 | 당일 10:10 | 당일 11:10 | 60 |
| 10:30 | 당일 10:30 | 당일 11:30 | 60 |
| 23:10 | 당일 23:10 | 다음 날 00:00 | 50 |
| 23:30 | 당일 23:30 | 다음 날 00:00 | 30 |

`hhmm` 형식 오류, `2400`, `actualMinutes <= 0`은 요청 오류다. 자정을 넘겨 다음 날 결과를 읽지
않는다.

### 3.2 SQL 범위

`retrieveRsltByUnitList`의 `hhmm` 파라미터를 `bgnDt`, `endDt`로 교체한다.

```sql
AND A.SMLT_ACTL_DT >= #{bgnDt}
AND A.SMLT_ACTL_DT <  #{endDt}
```

모든 범위는 `[start, end)`로 통일한다. 인접 조회·슬롯의 종료값을 포함하지 않아 중복 집계를
방지한다.

표시용 처리량:

```text
displayPaxPerMin = ROUND(SUM(TRNST_PSG_CNT) / actualMinutes)
```

추천 계산은 반올림 전 값을 사용한다.

```text
rawPaxPerMin = SUM(TRNST_PSG_CNT) / actualMinutes
```

---

## 4. 등급 기준 조회와 검증

### 4.1 조회 DTO·mapper

대시보드 mapper에 시설 그룹별 등급 목록 조회를 추가한다.

```text
PsgPrcsGradeRawDto
  fcltGroupCd
  psgPrcsGrdCd
  minVl
  maxVl
```

```sql
SELECT FCLT_GROUP_CD,
       PSG_PRCS_GRD_CD,
       MIN_VL,
       MAX_VL
  FROM PMOWN.TN_PM_PSG_PRCS_GRD
 WHERE FCLT_GROUP_CD = #{fcltGroupCd}
 ORDER BY PSG_PRCS_GRD_CD
```

체크인 카드 요청에서는 그룹 `02`, 출국장 카드의 보안검색 추천에서는 그룹 `04`를 조회한다.
같은 요청 안에서는 그룹별 결과를 한 번만 읽고 모든 카드가 공유한다.

### 4.2 필수 검증

다음 경우 추천을 중단하고 예외를 발생시킨다.

1. 시설코드에 대응하는 `FCLT_GROUP_CD`가 없음
2. 요청 그룹의 등급 행이 없음
3. 동일 그룹·동일 `PSG_PRCS_GRD_CD` 행이 중복됨
4. `PSG_PRCS_GRD_CD='02'`가 없음
5. `MIN_VL` 또는 `MAX_VL`이 null·음수
6. `MIN_VL > MAX_VL`
7. 등급 구간이 겹치거나 대기인원이 어느 구간에도 포함되지 않음

서비스에서 이 예외를 잡아 `addCnt=0`으로 바꾸지 않는다. 프로젝트의 전역 예외 처리 경로로
전파하여 조회 실패와 서버 로그가 같은 원인을 가리키게 한다.

로그에는 최소한 다음 진단값을 구조화해 남긴다.

```text
smltId, tmnlId, hhmm, fcltType, upPsgFcltCd,
fcltGroupCd, psgPrcsGrdCd, rowCount, minVl, maxVl
```

예외 메시지는 원인과 조회 키를 포함하되 SQL 전체나 불필요한 응답 데이터는 남기지 않는다.

```text
혼잡등급 기준정보를 찾을 수 없습니다.
fcltGroupCd=02, psgPrcsGrdCd=02, smltId=..., tmnlId=T1, hhmm=1030
```

---

## 5. 시설 카드 집계 분리

### 5.1 표시 집계와 추천 집계

카드 표시와 추천의 시설 범위를 구분한다.

| 카드 | 기존 표시 범위 | 추천 범위 |
|---|---|---|
| 체크인카운터 | `CC + CK + SBD` | `CC` |
| 출국장 | `LGT + SC + SR` | `SC + SR` |

기존 카드 제목·메타·하단 칩을 유지하려면 표시 집계는 기존 범위를 보존한다. 추천 계산용으로
`CC` 및 `SC/SR` 결과를 별도 조회하거나, 한 번 조회한 원시 결과를 상위 시설코드별로 분리한 뒤
각 계산기에 전달한다. SQL 왕복을 줄일 수 있는 후자를 우선한다.

동일 시설 단위의 rolling 구간 집계 규칙:

```text
대기인원 = 구간 내 WTNG_PSG_CNT 최댓값
처리인원 = 구간 내 TRNST_PSG_CNT 합계
대기시간 = 구간 내 AVG_WTNG_HR 최댓값
처리시간 = 구간 내 AVG_PRCS_HR 최댓값
```

대기인원을 구간 전체에서 합산하지 않는다. 대기인원은 순간 재고이므로 구간 합계가 아닌 피크를
사용한다.

### 5.2 현재 운영 시설 수

추천 계산의 `currentOpenCount`는 정적 `TN_PM_SMLT_PSG_FCLT.USE_YN` 개수가 아니라 실행 조건과
조회 기준 시각에 실제 배정·개방된 수를 사용한다.

- 체크인 `CC`: 조회 `bgnDt`에 유효한 카운터 배정 수
- 보안검색 `SC/SR`: 실행 설정이 참조하는 보안검색 시설 개방 리소스의 해당 출국장 검색대 수

실행 결과 재현성을 위해 `TN_PM_SMLT_STNG`의 리소스 ID를 기준으로 원천을 선택한다.

- `CKNCT_ALCTN_RSRC_ID='CA001'`: 일일 체크인 배정 원천
- 비 `CA001`: 해당 CAST 체크인 배정 snapshot
- 보안검색: `FCLTY_OPNG_SCRTY_CNTRL_RSRC_ID`가 가리키는 시설 개방 snapshot

실제 백엔드 스키마에서 리소스 ID와 속성 테이블 키가 일치하는지 먼저 확인한다. 참조 DDL과
CastRest mapper의 컬럼 불일치는 AGENTS.md에 이미 기록되어 있으므로 DDL만으로 조인 조건을
확정하지 않는다.

---

## 6. 처리능력과 유입량

### 6.1 시설당 처리능력

추천 단위별 현재 처리능력은 반올림하지 않은 값으로 계산한다.

```text
serviceRatePerFacilityPerMin
    = processedPsgCnt / currentOpenCount / actualMinutes
```

다음 중 하나면 현재 구간 처리능력을 사용할 수 없다.

```text
currentOpenCount <= 0
processedPsgCnt <= 0
serviceRatePerFacilityPerMin <= 0
```

이 경우 같은 `smltId + tmnlId + unitCd + 추천 시설범위`에서 `bgnDt` 이전의 결과를 최신순으로
탐색하여, 운영 수와 처리인원이 모두 양수인 가장 가까운 구간의 처리능력을 사용한다. 탐색 범위는
같은 실행일자 안으로 제한한다.

직전 유효 처리능력도 없으면 추천 계산에 필요한 근거가 없는 것이므로 명시적 예외를 발생시킨다.
다른 터미널이나 다른 시설의 평균으로 대체하지 않는다.

### 6.2 예상 유입량

> ⚠ **§14 로 대체됨 (2026-08-28).** 유입량 역산을 쓰지 않는다. 아래는 이력으로 남긴다.

CAST 결과의 원래 10분 슬롯을 유지한 채 인접 슬롯의 큐 변화로 유입량을 역산한다.

```text
arrival(i) = max(0, queue(i+1) - queue(i) + processed(i))
forecastArrivals = SUM(arrival(i))
```

`processed(i)`가 `i → i+1` 구간의 처리량이라는 전제가 필요하다. 실제 CAST 결과의
`SMLT_ACTL_DT`가 구간 시작인지 종료인지 실제 연계 명세와 샘플 데이터로 확인한다. 의미가 반대면
인접 행 선택을 조정하되 큐 보존식 자체는 유지한다.

자정으로 잘린 구간은 존재하는 슬롯까지만 합산한다. 마지막 슬롯에 다음 큐 스냅샷이 없어 유입량을
역산할 수 없으면 해당 슬롯을 임의로 0 처리하지 말고, 직전 슬롯 유입률 사용 여부를 실제 데이터
검증 후 결정한다. 이 항목은 구현 전 샘플 데이터로 확정해야 하는 유일한 계산 입력 세부사항이다.

---

## 7. SLA 추천 계산

> ⚠ **7.1 · 7.2 는 §14 로 대체됨 (2026-08-28).** 7.3 응답 의미는 필드명만
> `addCnt` → `reqCnt` 로 바뀌고 나머지는 유효하다.

### 7.1 입력과 공식

```text
Q0 = 조회 구간 시작/초기 대기인원
A = forecastArrivals
H = actualMinutes
mu = serviceRatePerFacilityPerMin
target = NORMAL.MAX_VL
```

후보 총 시설 수 `n`을 적용한 구간 종료 큐:

```text
predictedQueue(n) = max(0, Q0 + A - n * mu * H)
```

추천 총 소요 수량:

```text
requiredTotal
    = max(0, ceil((Q0 + A - target) / (mu * H)))
```

부동소수점 경계 오류를 피하려면 Java 계산은 `BigDecimal`로 구현하고 최종 수량에서만
`RoundingMode.CEILING`을 사용한다. `requiredTotal`을 다시 `predictedQueue()`에 넣어
`predictedQueue <= target`인지 검증한다.

물리적 시설 수를 초과해도 clamp하지 않는다. `addCnt`는 실행 가능 수량이 아니라 현재 수요와
처리능력으로 산출한 이론적 총 소요 수량이다.

### 7.2 혼잡해소 예상 시각

```text
arrivalRatePerMin = A / H
netDrainPerMin = requiredTotal * mu - arrivalRatePerMin
clearMinutes
    = ceil(max(0, Q0 - target) / netDrainPerMin)
cgnClearTime = bgnDt + min(clearMinutes, H)
```

`Q0 <= target`이면 `clearMinutes=0`이다. `netDrainPerMin <= 0`이거나 계산 결과가 `H`를 넘으면
해당 수량으로 구간 내 혼잡해소를 보장할 수 없으므로 계산 오류로 다룬다. 추천 수량 공식과
해소시각 공식의 결과가 어긋나면 입력 집계 또는 반올림 오류이므로 로그와 함께 실패시킨다.

`cgnClearRate` 게이지의 업무 의미는 이번 결정에 포함되지 않았다. 추천 수량·해소시각 구현과
분리하고, 의미가 확정되기 전까지 임의 백분율을 새로 만들지 않는다.

### 7.3 응답 의미

체크인카운터:

```text
recommend.targetNm = 조회 기준 시각의 아일랜드 최다 배정 항공사명
recommend.addCnt = requiredTotal
recommend.needAssignYn = 'Y'
```

보안검색대:

```text
recommend.targetNm = '보안검색대'
recommend.addCnt = requiredTotal
recommend.needAssignYn = 'N'
```

`needAssignYn`은 산식 분기가 아니라 기존 화면 문구인 `배정 필요`/`소요` 선택에만 사용한다.

---

## 8. 체크인 추천 항공사 선정

조회 기준은 rolling 구간 전체가 아니라 `bgnDt` 한 시점의 유효 배정이다.

```text
1. 실행 설정의 CKNCT_ALCTN_RSRC_ID 확인
2. bgnDt에 유효한 CC 배정만 조회
3. island + ALN_CD별 배정 카운터 수 COUNT
4. COUNT 내림차순
5. 동률이면 ALN_CD 오름차순
6. 1위 ALN_CD를 항공사명으로 변환
```

일일 `CA001`과 사용자/비일일 snapshot의 조회 원천은 다르지만 결과 DTO는 동일하게 만든다.

```text
ChknAlnAssignmentRawDto
  unitCd
  alnCd
  assignedCnt
```

아일랜드에 유효 배정이 한 건도 없거나 항공사명을 찾지 못하면 추천 대상을 신뢰할 수 없으므로
빈 문자열로 대체하지 않고 예외를 발생시킨다.

---

## 9. 구현 단계와 수정 대상

### 9.1 백엔드 DTO·매핑

대상:

- `java/cast/dto/PsgPrcsGradeRawDto.java` 신규
- `java/cast/dto/ChknAlnAssignmentRawDto.java` 신규
- 필요하면 rolling 원시 슬롯을 보존할 추천 계산 입력 DTO 신규
- `java/cast/mapper/CastDsbdMapper.java`
- `java/mapper/CastDsbdMapper.xml`

작업:

1. 시설 그룹별 등급 목록 조회 추가
2. 시설 결과 조회 파라미터를 `hhmm`에서 `bgnDt/endDt`로 변경
3. 추천 계산에 필요한 10분 슬롯의 시각·상위시설코드를 보존
4. 실행 리소스 기준 체크인 항공사 배정 집계 추가
5. 현재·직전 유효 운영 시설 수 조회 추가
6. `SC/SR`을 그룹 `04`로 묶되 시설코드 자체는 응답 계약상 유지

### 9.2 백엔드 서비스

대상:

- `java/cast/service/impl/CastDsbdServiceImpl.java`
- 필요하면 대시보드 전용 순수 계산 클래스 신규
- `java/cast/enums/CongestionStatus.java`

작업:

1. 실행일자와 `hhmm`으로 rolling 범위 생성
2. 시설 그룹 매핑을 한 곳에 정의
3. 등급 목록 검증과 등급→화면 enum 변환 구현
4. 표시 집계와 추천 집계를 분리
5. 처리능력과 직전 유효 실적 fallback 구현
6. 유입량 역산과 SLA 계산을 부작용 없는 순수 함수로 구현
7. 체크인 최다 배정 항공사 선정
8. `getEmptyRecommend()` 제거 후 실제 추천 결과 설정
9. `cgnClearTime` 실제 계산값 설정
10. 계산 근거가 없을 때 진단정보를 포함한 예외 발생

`CongestionStatus`의 문자열 값은 그대로 유지한다. 기존 `ofWtngPsgCnt()`는 다른 화면 호환을 위해
당장 삭제하지 않고, 대시보드에서는 DB 등급코드 기반 변환을 사용한다.

### 9.3 React 서비스·목업·뷰모델

대상:

- `react/src/api/pm/services/dashboard.service.ts`
- `react/src/api/pm/mock/dashboard.mock.ts`
- `react/src/modules/pm/pages/dashboard/view.ts`
- `react/src/types/api.types.ts`의 설명 주석

작업:

1. 목업 `getFcltCardList`에도 `hhmm`을 전달
2. 고정 카드값 대신 rolling 범위와 동일한 계산 규칙으로 목업 생성
3. `hrlyPrcsPsgCnt`를 `Pax/Min` 값으로 해석하도록 주석 정정
4. `recommend.addCnt`를 총 소요 수량으로 해석하도록 주석 정정
5. 기존 `className`, DTO 필드명, `needAssignYn` 표시 분기는 유지

`TerminalSummary.tsx`는 이미 `Pax/Min`, `배정 필요`, `소요`를 표시하므로 DOM 변경은 원칙적으로
필요 없다. 실제 변경이 필요하지 않으면 파일을 건드리지 않는다.

---

## 10. 예외·로그 정책

권장 예외 분류:

| 분류 | 예시 | 처리 |
|---|---|---|
| 요청 오류 | 잘못된 `hhmm`, 존재하지 않는 터미널 | 요청 검증 오류 |
| 기준정보 오류 | 등급 누락·중복·잘못된 범위 | 서버 설정 오류 + ERROR 로그 |
| 계산 입력 오류 | 현재·직전 처리능력 없음 | 추천 계산 오류 + ERROR 로그 |
| 배정정보 오류 | 체크인 항공사 배정 없음 | 추천 계산 오류 + ERROR 로그 |
| 데이터 정합성 오류 | SLA 수량과 해소시각 불일치 | 계산 오류 + 입력 요약 로그 |

로그는 같은 오류를 서비스와 전역 핸들러에서 중복 출력하지 않는다. 스택 트레이스는 최종 처리
지점에서 한 번 남기고, 서비스 예외 메시지에는 조회 키와 실패한 불변조건을 포함한다.

화면은 기존 `useFetched` 오류 경로를 통해 시설 카드 조회 실패를 알린다. 실패를 정상적인 빈 카드나
0개 추천으로 보이게 하지 않는다.

---

## 11. 검증 계획

### 11.1 계산 단위 검증

순수 계산기에 최소 다음 사례를 검증한다.

1. 정확히 `NORMAL.MAX_VL`이면 `NORMAL`, 해소시간 0분
2. `NORMAL.MAX_VL + 1`이면 추가 처리능력이 필요한 수량 계산
3. 계산 결과가 정수 경계일 때 불필요하게 1개 증가하지 않음
4. 이론적 총 소요 수량이 물리적 수보다 커도 clamp되지 않음
5. 현재 처리 0이면 가장 가까운 직전 유효 처리능력을 사용
6. 같은 날 직전 유효 처리능력이 없으면 예외
7. SC와 SR 결과가 그룹 04 하나로 합산됨
8. 항공사 배정 동률이면 `ALN_CD` 오름차순으로 결정

### 11.2 시간·SQL 통합 검증

| 조회 시각 | 기대 범위 | 확인 사항 |
|---|---|---|
| 10:00 | `[10:00, 11:00)` | 기존 정시 결과와 기준값 비교 |
| 10:10 | `[10:10, 11:10)` | 10:00 결과와 달라지는지 |
| 10:30 | `[10:30, 11:30)` | 종료 11:30 미포함 |
| 23:10 | `[23:10, 24:00)` | 분모 50분 |
| 23:30 | `[23:30, 24:00)` | 분모 30분, 다음 날 미조회 |

추가 확인:

- 그룹 02·등급 02의 `MAX_VL`이 체크인 목표값으로 사용됨
- 그룹 04·등급 02의 `MAX_VL`이 SC/SR 공통 목표값으로 사용됨
- 기준 행 삭제·중복 시 서버 로그만으로 그룹, 등급, 조회조건을 식별할 수 있음
- 카드 표시용 `CC+CK+SBD` 집계와 추천용 `CC` 집계가 섞이지 않음
- 출국장 표시용 `LGT+SC+SR` 집계와 추천용 `SC+SR` 집계가 섞이지 않음

### 11.3 프런트 검증

`react/`에서 다음을 실행한다.

```bash
npx tsc -b
npx eslint .
npm run build
```

화면에서 확인한다.

- 10:00, 10:10, 10:30 조회 시 카드 수치가 rolling 범위에 따라 변경됨
- 23시대 조회에서 `Pax/Min` 분모가 실제 잔여 분으로 적용됨
- 추천 수량이 추가 수량이 아니라 총 소요 수량으로 표시됨
- 체크인은 최다 배정 항공사와 `배정 필요`, 출국장은 `보안검색대`와 `소요`로 표시됨
- 백엔드 기준정보 오류가 빈 카드·0개가 아니라 조회 실패 알림으로 노출됨

Java는 이 레포에서 빌드할 수 없으므로 실제 백엔드 레포에서 mapper statement 로딩, 서비스 단위
테스트, Oracle 통합 조회, API 응답 검증을 추가로 수행한다.

---

## 12. 완료 조건

- 시설 카드가 조회 시각 기준 `[hhmm, hhmm+60분)`을 사용하고 자정에서 정확히 잘린다.
- `hrlyPrcsPsgCnt`가 실제 집계분으로 나눈 `Pax/Min`이다.
- 체크인 `CC`는 그룹 02, `SC/SR`은 그룹 04의 등급표로 혼잡도를 판정한다.
- 추천 수량은 60분 또는 자정까지의 실제 가용 시간 안에 `NORMAL.MAX_VL` 이하를 만드는 이론적
  총 소요 수량이다.
- 현재 처리능력을 구할 수 없으면 같은 날 직전 유효 실적을 사용하고, 그것도 없으면 명시적으로
  실패한다.
- 체크인 추천 대상은 조회 기준 시각의 아일랜드 최다 배정 항공사다.
- 등급·배정·처리능력 데이터 오류는 조용히 0으로 대체되지 않으며 서버 로그로 원인을 재현할 수 있다.
- 물리적 시설 수를 초과하는 이론적 소요 수량도 응답과 화면에 그대로 표시된다.
- 목업과 실통신이 동일한 필드 의미와 시간 범위를 사용한다.
- React 타입체크·lint·build가 통과하고, 실제 백엔드 레포에서 Java·mapper·Oracle 통합검증이
  완료된다.

---

## 13. 별도 결정·후속 범위

다음 항목은 현재 확정사항에 포함되지 않아 이번 구현에서 임의로 정하지 않는다.

1. `cgnClearRate` 게이지의 정확한 업무 의미와 산식
2. 터미널 피크의 대기인원을 시설 합계로 바꿀지 여부
3. 화면의 "최대 대기시간"을 `AVG_WTNG_HR` 대신 `MAX_WTNG_HR`로 바꿀지 여부
4. 다른 PM 화면의 공통 80/220/420 혼잡 경계를 `TN_PM_PSG_PRCS_GRD`로 전환하는 작업
5. 자정 직전 마지막 슬롯의 다음 큐가 없을 때 유입량을 보정하는 구체적인 fallback

이 다섯 항목은 실제 CAST 슬롯 의미와 업무 표시 정의를 확인한 뒤 별도 결정한다.

---

## 14. 2026-08-28 결정 변경 — 유입량 역산에서 피크 기준으로

**§6.2 의 유입량 역산과 §7.1 의 총량 기반 수량 산출은 아래로 대체한다.** §7.2 의 혼잡해소
시각 산식도 함께 바뀐다. 나머지 절(rolling 구간, 등급 기준, 집계 분리, 처리능력과 fallback,
항공사 선정, 예외 정책)은 그대로 유효하다.

### 14.1 바뀐 이유

`A` 는 CAST 결과의 큐 곡선에서 뽑아낸 파생값인데, 그것을 다시 큐 곡선을 재구성하는 데 썼다.
곡선을 직접 읽으면 그 우회가 없어진다. 큐가 단조 증가해 피크가 구간 끝에 오는 경우
두 방식은 **대수적으로 동일**하다.

```text
peak = q(H) = Q0 + A − open·μ·H
open + ceil((peak − target)/(μH)) = ceil((Q0 + A − target)/(μH))   // 기존 식과 같다
```

부수 효과로 다음이 해소된다.

- `SMLT_ACTL_DT` 가 구간 시작인지 종료인지 확정하지 않아도 된다 (`processed` 를 안 쓴다)
- 자정 절단 구간에서 종료 스냅샷을 **요구**하지 않아 23시대 조회가 실패하지 않는다
- 10분 간격 단정이 없어져 슬롯 결측에 견딘다
- `max(0, …)` 의 상향 편향이 사라진다

### 14.2 확정 산식

```text
peakQueue    = MAX(queue(t))        t ∈ [bgnDt+10분, bgnDt+H]   // 있는 슬롯만
peakAt       = 그 최댓값이 나온 시각 (동률이면 이른 쪽)
excess       = max(0, peakQueue − NORMAL.MAX_VL)
leadMinutes  = peakAt − bgnDt
extraCnt     = ceil(excess / (μ · leadMinutes))
reqCnt       = currentOpenCount + extraCnt

cgnClearTime = bgnDt + min{ t | queue(t) − extraCnt · μ · t ≤ target }
```

- **분모는 `leadMinutes`** 다. 구간 전체가 아니라 피크 시각까지 — 피크 순간에 이미 NORMAL
  이어야 한다는 뜻이다.
- **윈도우는 `bgnDt+10분` 부터** 다. 지금 배정해도 효과는 한 슬롯 뒤부터 나타난다.
  조회 시각 칸은 추천 근거로 보지 않는다. 다만 카드의 혼잡도 표시(`cgnStatus`)는 종전대로
  조회 시각을 포함한 집계를 쓴다.
- **혼잡해소 시각은 곡선을 직접 보정해 읽는다.** 균등 유입 가정으로 직선을 그리지 않는다.
  보정에 쓰는 값은 `reqCnt` 가 아니라 `extraCnt` 다 — 곡선에 이미 현재 운영 수의 처리가
  반영돼 있다.

### 14.3 `addCnt` → `reqCnt`

값의 의미가 "총 소요 수량" 으로 확정되어 `addCnt` 는 반대 의미의 이름이 됐다. 같은 카드의
`totCnt`(보유 대수) 와 헷갈리지 않도록 `reqCnt` 로 바꾼다. §0 의 "필드명은 유지" 는 이
결정으로 대체된다 (AGENTS.md §3-1 에 예외로 기록).

### 14.4 새로 생긴 전제와 경계

1. **`currentOpenCount` 가 수량에 직접 들어간다.** 종전에는 `μ` 계산에만 쓰여 나눗셈에서
   상쇄됐다. `retrieveScrtyOpenCountList` 의 행 수 단정 문제를 먼저 해결해야 한다.
2. **짧은 스파이크에 민감하다.** 한 슬롯만 튀어도 그 값이 기준이 된다. 총량 기반이던
   종전 식은 스파이크를 평균화했다. 실 데이터로 피크의 뾰족함을 먼저 확인한다.
3. **당일 마지막 슬롯(23:50) 조회는 예외로 실패한다.** 윈도우 `[bgnDt+10분, …]` 에 결과가
   한 칸도 없기 때문이다. 효과가 10분 뒤부터 나타나는 조치를 10분 남은 시점에 추천할 수
   없으므로 조용히 0 을 내리지 않고 실패시킨다.
4. **§13-5(자정 직전 마지막 슬롯의 유입량 보정)은 소멸한다.** 유입량을 쓰지 않는다.
5. **§13-1(`cgnClearRate` 산식)은 여전히 미결이다.** 계속 0 으로 둔다.
