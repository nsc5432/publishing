# 출국장 기준을 LGT 로 전환 · 보안검색대 추천은 SC+SR 유지

작성일: 2026-11-01 · 대상: `java/cast`, `java/mapper`, `java/ddl`, `react/src/modules/pm/pages/castSmry` · 상태: **구현 (참조 사본, 실제 백엔드 빌드 · DB 적용 대기)**

`java/`는 참조 사본이라 이 저장소에서 컴파일하지 않는다. 실제 백엔드 빌드 · DB 적용은 별도로 한다.

---

## 1. 배경

지금 출국장(DEP)의 대기 · 혼잡등급 · 요약정보는 보안검색대 `SC`+`SR` 결과로 계산한다. 출국장 시설인 `LGT` 는
카드 하단 칩의 시설 목록과 시간대별 차트 합계에만 섞여 있다.

- 10-13 · 10-17 설계에서 보안검색대 수 추천을 위해 큐를 `SC`+`SR` 로 만들었고, 등급 · 요약 · 칩 색이 그 계산을 따라갔다.
- 10-24 문서의 "LGT 를 임의 포함하지 않음"은 LGT 가 틀렸다는 판단이 아니라 LGT 와 SC 가 직렬인지 병렬인지 확인하지 못했기 때문이었다.
- Xovis 실적도 출국장 대기열(`QUELENGTH` · `WAITTIME`)은 `DG*` 행(= CAST `LGT`)에만 있고, 보안검색 레인(`SC`) 행에는 운영 여부 · 처리인원만 있다.

## 2. 확정한 결정 (2026-11-01)

| 항목 | 결정 |
|---|---|
| LGT 원천 | CAST `LGT` 결과에 대기인원 · 대기시간 · 처리인원이 들어 있다 (사용자 확인) |
| 출국장 대기시간 정의 | **LGT 만** 쓴다. SC/SR 대기를 더하지 않는다 |
| 출국장 대기 · 등급 · 요약 | LGT |
| 보안검색대 추천 · 혼잡해소 · 처리율 · 부하율 | 현행 `SC`+`SR` 유지 |
| API 계약 | 바꾸지 않는다. 카드 · 팝업의 `fcltType` 은 계속 `'DEP'` 다 |

## 3. 바뀌는 화면 값

| 화면 요소 | 현재 | 전환 후 |
|---|---|---|
| 요약정보 출국장 탭 (대기인원 · 평균 대기시간 · 유입 · 처리) | SC+SR | LGT |
| 요약정보 랜드사이드 탭의 출국장 몫 (평균 대기시간 합 · 처리) | SC+SR | LGT |
| 터미널 대표 혼잡등급의 출국장 몫 | SC+SR | LGT |
| 출국장 카드 대기열 · `cgnStatus` · `cgnWtngSec` · 정렬 | SC+SR | LGT |
| 출국장 카드 처리율 · 부하율 링 · 혼잡해소 시각 · 게이지 · 추천 수량 | SC+SR | SC+SR (유지) |
| 출국장 카드 보유 · 운영 수량 (`totCnt` · `oprCnt`) | 시설 마스터 LGT+SC+SR 행 수 | 팝업과 같은 보안검색대 수 (§4.4) |
| 하단 칩 색 | SC+SR 등급 | LGT 등급 |
| 시간대별 차트 DEP Cast 선 | 출국장별 LGT+LC+SC+SR 합의 시간 최대 | LGT 합의 시간 최대 |
| 시간대별 차트 DEP Xovis 선 | DG*+SC | DG* (SC 행은 대기열이 비어 값 변화 없음) |
| 출국장 탭 PRIME TIME | 위 차트 값의 피크 | LGT 피크 (차트를 따라 바뀜) |
| 맵형태보기 · 출국장 상세 출국장 등급 · `cgnWtngSec` | SC+SR | LGT |
| 맵형태보기 · 출국장 상세 지표 4종 (`stat`) | LGT+SC+SR 합 | LGT (§6 확인 1) |
| 맵 혼잡 알림의 출국장 조치 부스 수 | 지표 대기인원 ÷ 단계 | LGT 대기인원 ÷ 단계 (산식은 기존대로 현업 확인 대상) |
| 혼잡해소 팝업 | SC+SR | SC+SR (유지, §6 확인 2) |

## 4. 설계

### 4.1 시설 유형 나누기

이미 고정 enum 에 있는 값을 그대로 쓴다. 새 enum 값은 만들지 않는다.

| `FcltType` | `getUpPsgFcltCdList()` | 10분 대기 결과의 의미 |
|---|---|---|
| `DEP` | `LGT` (기존과 같음) | 출국장 대기 · 등급 |
| `SC` | `SC`, `SR` (기존과 같음) | 보안검색대 큐 · 추천 · 해소 |

두 유형 모두 CAST 10분 결과(결과 시각 = 구간 끝)라서 `DepQueueDay` · `DepWtngSecBuilder` 의 해석 규칙을 같이 쓴다.

### 4.2 Java 도메인 · 서비스

- `FcltWtngDay`
  - 생성자 검사를 `CHKN` / `DEP` / `SC` 로 넓힌다.
  - `fcltType == FcltType.DEP` 로 갈리는 출국장 규칙(관측 판정, 180분 역추정, `depSourceOf`)을 `fcltType != FcltType.CHKN` 으로 바꾼다.
- `CastDepQueueService.calculateDepQueueDay(smltStng, tmnlId)` → `calculateDepQueueDay(smltStng, tmnlId, fcltType)`
  - 조회 시설코드는 `fcltType.getUpPsgFcltCdList()` 로 정한다 (`DEP_QUEUE_FCLT_CD_LIST` 제거).
  - 운영 수량 맵은 `SC` 일 때만 `retrieveScrtyOpenCntMap`, `DEP`(LGT) 는 빈 맵이다. `END_OPER_CNTOM` 이 NULL 허용이라 저장에 문제가 없다.
- `CastFcltWtngServiceImpl`
  - `DEP_SRC_FCLT_CD_LIST` 대신 `fcltType.getUpPsgFcltCdList()` 를 쓴다.
  - `requireDep` 는 `DEP` / `SC` 를 받는다.
  - `expectedScopeOf` 의 운영 출국장 합집합은 `SC` 일 때만 보안검색대 운영표를 더한다. `calculateScope` 와 범위 규칙이 같아야 한다.
- `CastFcltWtngRsltCreateServiceImpl.FCLT_TYPE_LIST` 에 `SC` 를 더한다.
- `CastCgnGradeServiceImpl`: `SC` 도 출국장 기준표 `04` 를 쓴다. 해소 목표(NORMAL 상한 40분 미만)가 지금과 같게 유지된다.

### 4.3 요약보기 (`CastDsbdServiceImpl`)

- 요약정보 · 대표 등급: 코드는 그대로 `FcltType.DEP` 를 읽는다. 원천만 LGT 로 바뀐다.
- 카드 (`retrieveDailySmltFcltCard`)
  - `depDay = DEP`(LGT), `scDay = SC`(SC+SR) 둘을 읽는다.
  - 카드 목록은 두 날짜 중 어느 쪽이든 평가시각에 결과가 있는 출국장이다. 정렬은 LGT 평균 대기시간 내림차순(산정 불가는 뒤, 같으면 LGT 대기인원 → 코드)이다.
  - `wtngPsgCnt` · `cgnStatus` · `cgnWtngSec` 는 `depDay` 에서 꺼낸다.
  - `applyClearance` · 추천은 `scDay.clearanceOf` 결과를 그대로 쓴다.
- 칩 (`getDepUnitList`): 시설 마스터는 `LGT` 만 조회하고, 색은 `depDay.gradeOf` 다.
- 시간대별 차트
  - `DsbdCategory.DPTGT_FCLT_CD_LIST` → `List.of("LGT")`, `DEP_WTNG_TYPE_CD_LIST` → `List.of("DG")`.
  - `CastDsbdMapper.retrieveDepFcstWtngByHourList` 의 `IN ('LGT', 'LC', 'SC', 'SR')` 와 출국장 번호 `CASE` 를 LGT 하나로 줄인다.
  - `retrievePsgWtngDptgtSumByHourList` 의 `OR A.FCLT_TYPE_CD = 'SC'` 를 뺀다.
  - PSG / FLT 의 전체 8종 목록은 그대로다.

### 4.4 카드 보유 · 운영 수량

지금 `retrieveFcltUnitList(tmnl, ["LGT","SC","SR"])` 이 세 종류 행을 출국장별로 함께 세서, "현재 운영 보안검색대" 라벨과
추천 수량의 단위가 다르다. 팝업과 같은 출처로 맞춘다.

- `totCnt`: 시설 마스터 `SC` 행 수 (팝업 `DEP_MAX_FCLT_CD_LIST` 와 같음)
- `oprCnt`: 실행 리소스 보안검색대 운영표 (`retrieveScrtyOpenCntMap`, 팝업 · 추천의 `s` 와 같음)

이 항목은 LGT 전환과 무관하게 틀린 값이라 먼저 단독으로 반영할 수 있다.

### 4.5 맵형태보기 · 출국장 상세

- `CastMapServiceImpl` · `CastDepHallServiceImpl` 의 `DPTGT_FCLT_CD_LIST` 를 `List.of("LGT")` 로 바꾼다.
  공용 `CastMapMapper#retrieveMapRsltDayList` SQL 은 고치지 않는다 (§13 규칙). 넘기는 목록만 바뀐다.
- 등급은 계속 `FcltType.DEP` 를 읽으므로 코드 변경 없이 LGT 가 된다. 맵 113행 · 출국장 상세 101행의 "SC / SR" 주석은 사실과 달라지므로 사용자 확인 후 고친다 (기존 주석 임의 수정 금지 규칙).
- 출국장 상세 카드의 `boothCnt`(보안검색대 대수)는 그대로다.

### 4.6 혼잡해소 팝업 (`CastFcltQueueScenarioServiceImpl`)

요청 `fcltType = 'DEP'` 을 받으면 내부에서 `FcltType.SC` 의 10분 대기 결과를 읽는다. 응답 계약은 그대로다.
카드와 팝업이 같아야 하는 값이 §14 에서 바뀐다.

| 같아야 하는 값 | 현재 | 전환 후 |
|---|---|---|
| 카드 `reqCnt` = 팝업 `recommend.reqCnt` | 유지 | 유지 |
| 카드 해소 시각 = 팝업 `scenario.cgnClearDt` | 유지 | 유지 |
| 카드 `cgnStatus` · `cgnWtngSec` = 팝업 `cgnStatus` · `wtngAvgSec` | 유지 | **해제** — 카드는 LGT, 팝업은 보안검색대 |
| 카드 대기열 = 팝업 `wtngPsgCnt` | 유지 | **해제** — 카드는 LGT, 팝업은 보안검색대 |

### 4.7 DB (`TN_PM_SMLT_FCLT_WTNG_RSLT`)

새 스크립트 `java/ddl/2026-11-01-fclt-wtng-rslt-dep-lgt.sql`:

1. 체크 제약 `FCLT_TYPE_CD = 'DEP' AND WTNG_NOCS BETWEEN 0 AND 1` → `FCLT_TYPE_CD IN ('DEP', 'SC') AND …`
2. 기존 `FCLT_TYPE_CD = 'DEP'` 행(SC+SR 통계)을 `'SC'` 로 한 번 이관한다. PK 에 `FCLT_TYPE_CD` 가 있으면 UPDATE 로 충분한지 실스키마로 확인한다.
3. 컬럼 주석 `시설유형코드(CHKN:CC공용큐,DEP:LGT,SC:SC및SR합산)`. `cast-ddl.sql` 도 같이 고친다.

이관 뒤의 과거 결과에는 `DEP`(LGT) 행이 없다. 조회 때 기존 보완 경로(저장 결과가 없으면 응답에서 Java 계산)가 LGT 를 채우고 `info` 로그를 남긴다.
새 결과부터는 수신 시 `CHKN` · `DEP` · `SC` 세 유형을 저장한다.

### 4.8 화면 (`react/`)

API 계약이 같아 데이터 경로는 바뀌지 않는다. 라벨만 손본다.

- 카드 상단(대기열 · 등급)은 출국장, 하단(처리율 · 해소 · 추천)은 보안검색대라는 구분이 보이게 한다. 문구는 디자인 확인 대상이다.
  - 구현: 출국장 카드 중앙 `예상인원` → `출국장 대기`, 게이지 `시간당 처리인원` → `보안검색 처리인원`,
    `혼잡해소 예상` / `혼잡요소 없음` → `보안검색 해소` / `보안검색 원활` (`view.ts` 의 `FCLT_CARD_GAUGE_LABEL`).
- 팝업 제목 `FCLT_QUEUE_LABEL.DEP.title` 을 `출국장` → `보안검색대` 로 바꿔 등급 · 평균 대기 · 대기인원이 보안검색대 값임을 드러낸다.
  헤더는 `T1 보안검색대 3번 출국장` 이 된다. 서버 적용 가정에도 같은 설명 한 줄을 더했다.
- 목업 `dashboard.mock.ts` 는 적용 가정 한 줄만 서버와 맞췄다.

### 4.9 문서

`AGENTS.md` §3(필요 시) · §13.1 · §14 · §15 의 "출국장 = SC+SR" 설명을 위 표대로 고친다. 이 계획 링크를 남긴다.

## 5. 구현 순서

1. §4.4 카드 보유 · 운영 수량 (단독 반영 가능)
2. §4.1 · §4.2 도메인 · 서비스 (`SC` 유형 추가, `DEP` 를 LGT 로)
3. §4.7 DDL · 이관 스크립트
4. §4.3 · §4.5 · §4.6 화면별 서비스
5. §4.8 화면 라벨, §4.9 문서
6. 검증: `npx tsc -b` · `npx eslint .` · `npm run verify:user-smlt`, Java 는 실제 백엔드에서 빌드하고 `java/verify/FcltWtngRegression.java` 를 LGT · SC 두 유형으로 돌린다

## 6. 확인할 사항

1~4 는 2026-11-01 사용자 결정으로 닫았다.

1. 맵 · 출국장 상세의 지표 4종도 LGT 만 보여준다.
2. 팝업의 등급 · 평균 대기는 보안검색대 기준으로 두고 라벨로 구분한다.
3. 혼잡등급 기준표 `04`(20/40/60분)를 LGT 대기에 그대로 쓴다.
4. LGT 가 막혀 카드 상단은 매우혼잡인데 추천은 추가 0대인 조합은 일단 그대로 둔다.

남은 확인:

5. **LGT 결과 시각 규칙.** LGT 도 SC 와 같이 10분 경계 · 구간 끝 시각인지 실데이터로 확인한다. 어긋나면 `DepWtngSecBuilder.build` 가 예외로 막는다.
6. **과거 결과의 LGT.** 조회마다 보완 계산을 할지, 일회성 적재를 둘지 정한다. 현재 규칙은 "같은 ID 를 다시 산출하는 경로를 두지 않는다" 이므로 기본은 보완 계산이다.
