# 사용자 시뮬레이션 출국장 레인·체크인 유형 발행 보정 계획

작성일: 2026-10-20
대상: 사용자 시뮬레이션 실행 시 발행하는 `FacilityOpeningTable_DepartureGate{rsrcNo}` · `CA{rsrcNo}`

## 1. 배경 — 결과 payload 로 확인한 사실

사용자 결과 `WI00008080`(FS012·PS501, 2026-10-19)을 일일 결과(`ICN001 … Auto`)와 2026-02-12 기준으로 대조했다.

| 시설 | 일일 처리 인원 | 사용자 처리 인원 |
|---|---:|---:|
| 유인 체크인 `CKIN*` | 약 59,000 | 0 |
| 출국장 `DG*` | 약 104,000 | 0 |
| 보안검색 `SC*`·`SCRed*` | 134,361 | 0 |
| 출국심사 `PC*` | 93,863 | 0 |
| 입국·세관·수하물 | 동일 | 동일 |

출국 흐름만 막혔다. 원인은 둘이다.

### 1-1. 출국장 — 레인 0 · SD/FR 공백 · East/West 누락

모델의 출국장 레인 블록은 `P01DG2_SDN_FRY_1` 처럼 **사이드도어(SD) × 안면인식(FR)** 조합으로 나뉜다.
CAST 는 DepartureGate 행의 `sideDoor`·`facialRecognition` 값으로 열 레인을 고른다.
일일 결과에는 SD/FR 조건이 붙은 레인 배정이 274건 있고, 사용자 결과에는 0건이다.

| 항목 | 일일 `001` 행 | 사용자 발행 행 (`insertDptgtAtrb`) |
|---|---|---|
| 행 단위 | 출국장 × (East/West) × SD × FR | 출국장 × 운영구간 |
| `SD_DR` · `FCLT_RCG` | Y/N | NULL → 조회 `NVL(' ')` 로 **공백** |
| `FCLTY_TYPE_ID` | T2 는 `E`/`W` (`DG1-East`) | NULL (`DG1` 만) |
| `FCLTY_CNT` | 조합별 레인 수 (대부분 8) | 일반 + 스마트 합계 1개 |

출국장 탭을 편집하지 않으면 운영자료 기본값이 `gnrlSrchCntom = 0`, `smartPassSrchCntom = 0` 으로 하드코딩돼
(`CastDepServiceImpl.toGateList`) `FCLTY_CNT = 0` 으로도 나간다. 탭을 열어도 스테퍼 초깃값이 0 이다.

`001` 행 구조 (DB 조회, 2026-10-20):

- T1(`P01`) 출국장 1~6, T2(`P03`) 출국장 1·2 × `E`/`W`
- 각 단위마다 SD N/Y × FR N/Y 4행, `FCLTY_CNT` 8 (T1 DG4 SD Y·FR Y 만 10)
- `OPER_BGNG_HM` 은 비어 있다. 일일 운영시간은 운영계 시간표를 조인한다

### 1-2. 체크인 — `CHKN_TYPE_CD = 'M'`

사용자 CA 카운터는 CAST 에 도착했다 (`P01CKINInt_A02` 2/12 04:00–21:00, TW).
그러나 배정 정의가 일일의 `Airline_Code___TW__…` 가 아니라 `Flight_Number_____…`(편명 공란)로 해석돼
`CompletedShare` 합계가 0 이다. 일일 CA001 은 항공사 기준 배정에 `'C'` + `"항공사목록"` 을 쓴다.
사용자 발행은 `'M'` + `"항공사"` 다 (`CastUserSnapshotMapper.insertCknctAtrb`, 2026-08-27 최초 구현부터).

## 2. 확정한 결정 (2026-10-20)

| 항목 | 결정 |
|---|---|
| 보완 시점 | **사용자 시뮬레이션 실행 시 발행 단계**에서 완전한 행을 만들어 저장한다. CAST 조회 SQL 은 `001` 로 fallback 하지 않는다 (지금도 사용자 행은 자기 행만 읽는다) |
| `001` 의 역할 | 실행 시점에 한 번 읽는 **행 구조 틀**(출국장·East/West·SD·FR 조합과 레인 비율). 발행 후 `001` 이 바뀌어도 과거 실행은 영향 없음 |
| 레인 매핑 | 스마트패스 = FR `Y`, 일반 = FR `N` |
| SD(사이드도어) | 화면 입력 없음. FR 그룹 안에서 `001` 레인 비율대로 나눈다 |
| 운영자료 기본 레인 | 출국장별 `001` 합계. 일반 = FR `N` 의 `FCLTY_CNT` 합, 스마트 = FR `Y` 합 |
| 체크인 유형 | `'M'` → `'C'`. 상세정보(`"항공사"`) 형식은 이미 일일과 같다 |
| 기존 0/0 저장 조건 | 정리 SQL 로 `001` 합계를 채운다 (§5) |
| 조회 SQL `NVL(' ')` | 유지. LISTAGG 의 NULL 누락으로 배열이 어긋나는 것을 막는 처리이고, 발행 행에 항상 Y/N 이 들어가면 공백이 나갈 일이 없다 |

근거 검증 (2026-10-20):

- 코드 정의 `DPTGT_ETRY_CD` `RC01` 일반 / `RC02` 안면인식 (전처리 `step3`·`step4` 주석과 일치)
- PS001 `20010000 FacialRecognition` 50/50, 일일 결과 FR=Y 레인 처리 비중 53.2% — FR 이 안면인식 축임을 확인
- PS001 `19010000 SideDoor_CAT` 100/0, `19020000 SideDoor_NoCAT` 1/99 — SD 는 도심공항 이용 축이라 화면 입력과 무관

## 3. 변경 내용

### 3-1. 운영자료 기본 레인 수 (`CastDepServiceImpl`, `CastDepMapper.xml`)

- `CastDepMapper.retrieveBaseLaneCntList(fcltTmnlId)` 추가

  ```sql
  SELECT GATE_NO AS DPTGT_NO,
         SUM(CASE WHEN FCLT_RCG = 'N' THEN FCLTY_CNT ELSE 0 END) AS GNRL_SRCH_CNTOM,
         SUM(CASE WHEN FCLT_RCG = 'Y' THEN FCLTY_CNT ELSE 0 END) AS SMART_PASS_SRCH_CNTOM
  FROM PMOWN.TN_PM_SMLT_FCLTY_OPNG_DPTGT_ATRB
  WHERE DPTGT_ATRB_ID = '001' AND OPER_BGNG_HM IS NULL AND TMNL_ID = #{fcltTmnlId}
  GROUP BY GATE_NO
  ```

- `getBaseGateList` 가 SC 수량(`retrieveScCntList`)과 같은 방식으로 읽어 `toGateList` 에 넘긴다.
  `setGnrlSrchCntom(0)` · `setSmartPassSrchCntom(0)` 하드코딩을 이 값으로 바꾼다.
- 운영시간이 있는 출국장인데 레인 기준정보가 없으면 SC 와 같이 예외로 막는다
  (`"출국장 n 기본 레인 운영자료가 없습니다."`).
- 화면 변경 없음. 스테퍼가 실제 값(예: T1 DG4 일반 16 / 스마트 18)으로 열린다.

### 3-2. DepartureGate 발행 (`CastUserSnapshotMapper.insertDptgtAtrb`)

운영 Y 출국장 × 운영구간 × `001` 조합 행마다 1행을 넣는다.

```
TPL   = 001 행 (TMNL_ID, GATE_NO, FCLTY_TYPE_ID, SD_DR, FCLT_RCG, FCLTY_CNT), OPER_BGNG_HM IS NULL
LANE  = DPTGT(운영 Y) ⋈ TPL ON (TMNL_ID, DPTGT_NO = GATE_NO)
        목표 X = FCLT_RCG 'N' 이면 GNRL_SRCH_CNTOM, 'Y' 이면 SMART_PASS_SRCH_CNTOM
        그룹 G = (TMNL_ID, GATE_NO, FCLT_RCG)
        RAW   = X × TPL.FCLTY_CNT / SUM(TPL.FCLTY_CNT) OVER G
        BASE  = FLOOR(RAW)
        REM   = X − SUM(BASE) OVER G
        CNT   = BASE + (ROW_NUMBER() OVER (G ORDER BY RAW − BASE DESC, FCLTY_TYPE_ID, SD_DR) ≤ REM ? 1 : 0)
OUT   = LANE ⋈ OPER_HR ON (TMNL_ID, DPTGT_NO)
```

| 컬럼 | 값 |
|---|---|
| `FCLTY_OPNG_SN` | `ROW_NUMBER() OVER (ORDER BY TMNL_ID, GATE_NO, FCLTY_TYPE_ID, SD_DR, FCLT_RCG, OPER_HR_SN)` |
| `FCLTY_TYPE_ID` · `SD_DR` · `FCLT_RCG` | `001` 값 그대로 |
| `FCLTY_CNT` | 위 `CNT` (0 이어도 행을 남긴다) |
| `OPER_BGNG_HM` · `OPER_END_HM` | 사용자 운영구간 (24시 → `2359`, 기존 규칙) |
| `GNRL_SRCH_CNTOM` · `SMART_PASS_SRCH_CNTOM` | 출국장 합계를 행마다 그대로 (확정 조건 조회 `retrieveGates` 가 `MAX` 로 읽는다) |

- 수량을 바꾸지 않으면 `001` 과 같은 레인 수가 나간다. 운항 Rate 만 바꾼 실행은 출국장이 일일과 같다.
- 일반·스마트를 `001` 합계보다 크게 주면 같은 비율로 늘어난다. 모델의 조합별 레인 블록은 20개까지라
  그 이상은 CAST 가 받는지 미검증이다 (화면 상한은 이번 범위 밖).
- 한 FR 그룹을 0 으로 두면 그 출국장의 해당 승객(안면인식 50%)이 갈 레인이 없다. 의도된 입력으로 보고 막지 않는다.
- 운영 Y 출국장에 `001` 행이 없으면 발행 전에 막는다. `CastUserSnapshotServiceImpl` 에서 `001` 조합 존재를 확인하고
  `"출국장 n 레인 기준정보(DepartureGate001)가 없습니다."` 로 실패시킨다. 실행 트랜잭션 전체가 롤백된다.

### 3-3. 체크인 유형 (`CastUserSnapshotMapper.insertCknctAtrb`)

- `CHKN_TYPE_CD` 를 `'M'` → `'C'` 로 바꾼다. 그 외 컬럼은 그대로.

### 3-4. 바꾸지 않는 것

- CAST 조회 SQL (`retrieveFcltyOpngTblDptg`, `retrieveCounterAllocation`)
- SecurityControl 발행 — East/West·SD·FR 구분 없이 출국장당 수량 하나라 그대로 맞다
- 화면·API DTO
- 이미 발행된 사용자 리소스(FS002~·PS5xx). 수정 후 새 실행부터 적용된다

### 3-5. 문서

- `AGENTS.md` §11.3 의 DepartureGate 설명("운영 Y 출국장의 운영구간마다 1행")을
  "운영 Y 출국장 × 운영구간 × `001` 조합(East/West·SD·FR)마다 1행, 레인은 FR 그룹별 비율 배분"으로 고친다.
- 같은 절에 체크인 유형 `'C'` 를 적는다.

## 4. 검증

`java/` 는 이 레포에서 컴파일되지 않는다. 실백엔드에서 빌드 후 아래를 확인한다.

1. 출국장 탭(미저장 상태) 조회 시 일반·스마트가 `001` 합계로 나온다 (T1 DG1 16/16, DG4 16/18, T2 DG1 32/32).
2. 운항 Rate 만 바꿔 실행한 뒤 `REQ_GetResource_Test.do` 로 비교한다.
   - `FacilityOpeningTable_DepartureGate001` 과 새 번호: `location`·`sideDoor`·`facialRecognition`·`currentNumberofLanes`
     배열이 같아야 한다 (`startDate`·시각은 사용자 운영구간이라 다르다)
   - `CA{새 번호}`: `checkinAllocType` 이 전부 `C`
3. CAST 결과 payload 에서
   - `CKINInt_*` 배정 `Definition` 이 `Airline_Code___…` 로 나오고 `CompletedShare` 합이 0 이 아니다
   - `DG*_SD?_FR?_*` 배정이 생기고 `DG*`·`SC*`·`PC*` 처리 인원이 0 이 아니다
4. 일반·스마트를 바꾼 실행에서 FR 그룹별 `FCLTY_CNT` 합이 입력값과 같다.

## 5. 기존 0/0 저장 조건 정리 SQL

출국장 탭을 저장한 사용자는 초깃값 0/0 이 그대로 저장돼 있을 수 있다. 의도한 0 과 구분할 수 없으므로
**일반·스마트가 둘 다 0 인 행**만 `001` 합계로 채운다. 운영 여부와 무관하게 채운다(나중에 운영 Y 로 바꿔도 0 레인이 되지 않게).

```sql
-- 1) 대상 확인
SELECT U.OWNER_USER_ID, U.EXCN_YMD, U.TMNL_ID, U.DPTGT_NO, U.OPER_YN,
       B.GNRL_CNT, B.SMART_CNT
FROM PMOWN.TN_PM_SMLT_USER_DPTGT U
JOIN (
    SELECT TMNL_ID, GATE_NO,
           SUM(CASE WHEN FCLT_RCG = 'N' THEN FCLTY_CNT ELSE 0 END) AS GNRL_CNT,
           SUM(CASE WHEN FCLT_RCG = 'Y' THEN FCLTY_CNT ELSE 0 END) AS SMART_CNT
    FROM PMOWN.TN_PM_SMLT_FCLTY_OPNG_DPTGT_ATRB
    WHERE DPTGT_ATRB_ID = '001' AND OPER_BGNG_HM IS NULL
    GROUP BY TMNL_ID, GATE_NO
) B ON B.TMNL_ID = U.TMNL_ID AND B.GATE_NO = U.DPTGT_NO
WHERE NVL(U.GNRL_SRCH_CNTOM, 0) = 0
  AND NVL(U.SMART_PASS_SRCH_CNTOM, 0) = 0
ORDER BY U.OWNER_USER_ID, U.EXCN_YMD, U.TMNL_ID, U.DPTGT_NO;

-- 2) 갱신
MERGE INTO PMOWN.TN_PM_SMLT_USER_DPTGT U
USING (
    SELECT TMNL_ID, GATE_NO,
           SUM(CASE WHEN FCLT_RCG = 'N' THEN FCLTY_CNT ELSE 0 END) AS GNRL_CNT,
           SUM(CASE WHEN FCLT_RCG = 'Y' THEN FCLTY_CNT ELSE 0 END) AS SMART_CNT
    FROM PMOWN.TN_PM_SMLT_FCLTY_OPNG_DPTGT_ATRB
    WHERE DPTGT_ATRB_ID = '001' AND OPER_BGNG_HM IS NULL
    GROUP BY TMNL_ID, GATE_NO
) B
ON (U.TMNL_ID = B.TMNL_ID AND U.DPTGT_NO = B.GATE_NO)
WHEN MATCHED THEN UPDATE SET
    U.GNRL_SRCH_CNTOM       = B.GNRL_CNT,
    U.SMART_PASS_SRCH_CNTOM = B.SMART_CNT,
    U.LAST_MDFR_ID          = 'SYSTEM',
    U.LAST_MDFCN_DT         = CURRENT_TIMESTAMP
WHERE NVL(U.GNRL_SRCH_CNTOM, 0) = 0
  AND NVL(U.SMART_PASS_SRCH_CNTOM, 0) = 0;

-- 3) 1) 의 건수와 갱신 건수가 같으면 COMMIT
```

`TN_PM_SMLT_USER_DPTGT.TMNL_ID` 는 `P01`/`P03`, `DPTGT_NO` 는 `'1'`~`'6'` 이라 `001` 의 `TMNL_ID`·`GATE_NO` 와 바로 맞물린다.

## 6. 범위 밖 (별건)

- `saveResult` 실패 사유 로깅 — 보류 (catch 의 `saveSimLog("16","9")` 가 같은 트랜잭션이라 롤백되는 문제 포함)
- PS001 `FacialRecognition` 50/50 vs 실적 안면인식 85% — 일일 시뮬레이션 입력 정확도 문제. 전처리에 계산 태스크가 없다
- `USER_MSTR` 에 남은 구 형식 요청(`WHATIF801` 등)과 `retrieveWhatIfCntrl` 의 상태 필터 부재 (`WHERE 1 = 1`)
- 확정 조건 조회 `retrieveGates` 가 일일(`001`) 리소스에서 일반 레인을 `MAX(FCLTY_CNT)` 로 읽는 점

## 7. 진행 상황

- [x] 원인 분석 · 결정 (2026-10-20)
- [x] 3-1 운영자료 기본 레인 (2026-10-20)
- [x] 3-2 DepartureGate 발행 (2026-10-20, FR 그룹 합이 0 인 `001` 틀은 행 수로 균등 배분)
- [x] 3-3 체크인 유형 (2026-10-20)
- [x] 3-5 AGENTS.md (2026-10-20)
- [ ] §5 정리 SQL 운영 DB 적용 (`java/ddl/2026-10-20-user-dptgt-lane-fill.sql`)
- [ ] §4 실백엔드 검증
