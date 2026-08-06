# API 명세 델타 — 사용자 시뮬레이션 리뉴얼 (1단계 산출물)

리뉴얼된 사용자 시뮬레이션 3탭 화면이 실제로 필요로 하는 데이터 항목을, 현행 [`API_SPEC.md`](API_SPEC.md) 6장(사용자 시뮬레이션)과 대조해 정리한 문서다.

- **`API_SPEC.md` 본문은 이 단계에서 손대지 않았다.** 여기 적힌 델타는 3·4단계에서 본문으로 병합한다.
- 2단계(DB 구조 분석)의 입력이다. 아래 항목이 **어느 테이블·컬럼에서 오는지**를 2단계에서 매핑한다.
- 화면에서 확정할 수 없는 것은 **결정 필요**로 표시했다. 2단계 리스크로 올린다.
- 화면 구현은 `react/src/modules/pm/pages/userSmlt/` 이며, 현재는 전부 `mock.ts` 로만 동작한다(API 미연동).

---

## 1. 탭 구조 변경 (5탭 → 3탭)

| 현행 명세 | 리뉴얼 후 | 처리 |
| --- | --- | --- |
| `6.2` 운항편/여객수 | 운항편/여객수 | 변경 없음 |
| `6.3` 체크인 카운터 | 체크인 카운터 | **전면 개편** — 아일랜드 단위 → 시간대별 블럭 차트 + 아일랜드 드로어 |
| `6.4` 셀프체크인/백드롭 | (탭 삭제) | **체크인 카운터로 흡수** — 계약을 `6.3` 안으로 재배치 |
| `6.5` 출국장 | 출국장 | **전면 개편** — 목록 → 시간대별 블럭 차트 + 출국장 드로어 |
| `6.6` 보안 검색대 | (탭 삭제) | **출국장으로 흡수** — 계약을 `6.5` 안으로 재배치 |

**조회 단위가 바뀐다.** 현행 `retrieveChknCounterInfo` / `retrieveSlfchknInfo` 는 `island` 를 요청 파라미터로 받아 **아일랜드 1개분**을 내려준다. 리뉴얼 화면은 첫 화면에서 **터미널의 모든 아일랜드를 한 차트에** 그리므로 `island` 없이 **터미널 1개분 전체**가 필요하다.

- 결정 필요: `island` 파라미터를 **선택(optional)** 으로 두고 없으면 전체를 내려줄지, `retrieveChknIslandList` 같은 **별도 조회를 추가**할지.

---

## 2. 체크인 카운터 탭

### 2.1 시간대별 운영 아일랜드 블럭 차트 (신규)

블럭 1개 = 부스 4석 × 1시간. 아일랜드마다 `ceil(부스 수 / 4)` 칸이 시간대별로 쌓인다.

| 필드 | 타입 | 설명 | 현행 명세와의 차이 |
| --- | --- | --- | --- |
| `islandList[].island` | string | 아일랜드 문자 (`A`~`N`, `I` 제외) | `6.3` 은 `islandList: string[]`(선택용 목록)이라 운영 정보가 없다 |
| `islandList[].boothCnt` | number | 그 아일랜드의 **운영 부스 수** — 블럭 수의 근거 | **없음.** 현행은 `counterList` 평면 목록(상/하단 18열)뿐이라 아일랜드별 규모를 셀 수 없다 |
| `islandList[].oprTimeList[].bgnHour` / `endHour` | number | 아일랜드 운영 시간 구간 (0~24) | `6.3` 의 `oprTimeList` 는 **아일랜드 1개분**이었다. 아일랜드마다 따로 필요하다 |
| `totCnt` | number | 요약: 전체 카운터 수 | `6.3` `totCnt` 그대로 |
| `peakCounterCnt` | number | 요약: 피크 카운터 (시간대별 열린 부스 합의 최댓값) | **없음.** 화면에서 계산 중 — 아래 4장 참고 |

- 결정 필요: `boothCnt` 가 **배정정보 기준 고정값**인지, 사용자가 드로어에서 바꿀 수 있는 값인지. (현재 화면은 부스 목록 길이를 그대로 쓰고 늘리는 UI 는 두지 않았다.)

### 2.2 대기인원수 꺾은선 (신규)

블럭 차트 위에 겹쳐 "이만큼 열면 이만큼 밀린다"를 한 차트에서 읽게 하는 값이다.

| 필드 | 타입 | 설명 | 현행 명세와의 차이 |
| --- | --- | --- | --- |
| `waitList[].hour` | number | 0~23 | **없음.** 사용자 시뮬레이션 탭에는 대기 지표 자체가 없다 |
| `waitList[].waitPsgCnt` | number | 그 시간대 대기인원수 (명) | 4.4 `retrieveDailySmltTmnlRsltByTime`(결과 조회)에 비슷한 축이 있다 |
| `waitMaxCnt` | number | 우측 축 최댓값 | 없음 |

- 결정 필요: 이 값의 **출처**. ① 직전 시뮬레이션 결과인지 ② 조건을 바꿀 때마다 서버가 재계산하는 예측치인지 ③ 저장 전에는 비워 두는지. 결과라면 아직 수행하지 않은 시뮬레이션에서는 무엇을 그릴지도 함께 정해야 한다.

### 2.3 패널 헤드 결과 지표 (신규)

요약 바 오른쪽에 구분선을 두고 붙는 4종이다. 체크인 카운터 · 출국장 탭이 같은 형식을 쓴다.

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `avgWaitMin` | number | 평균대기 (분) |
| `p95WaitMin` | number | P95대기 (분) |
| `maxQueuePsgCnt` | number | 최대 큐인원 (명) |
| `utilRate` | number | 가동률 (%) |

- 결정 필요: 2.2 와 같은 문제 — **직전 수행 결과**인지 실시간 예측인지. 미수행 상태의 표시값(`0` / `-` / 숨김)도 정해야 한다.

### 2.4 드로어 — 자원 배정

| 필드 | 타입 | 설명 | 현행 명세와의 차이 |
| --- | --- | --- | --- |
| `boothList[].boothNo` | number | 아일랜드 안의 부스 번호 (1부터) | `counterList[].counterNum` 은 상/하단 18열 기준 번호라 의미가 다르다 |
| `boothList[].alnCd` | string | 배정 항공사 코드 — 미배정이면 `''` | `counterList[].alnCd` 가 **일부 대응**된다 (열 기준 → 아일랜드 기준으로 재편 필요) |
| `boothList[].customYn` | YnFlag | Custom 배정 여부 | `counterList[].customYn` 대응 |
| `alnCdList` | string[] | 드로어 칩에 노출할 **배정 가능 항공사 코드** | **없음.** 현재 화면은 `KE` / `OZ` 로 고정한 목업 |

- 결정 필요: `+ Custom` 칩의 동작. 자유 입력인지 코드 목록 선택인지. (현재는 `console.log` 스텁)

### 2.5 드로어 — 셀프 서비스 (구 `6.4` 흡수)

| 필드 | 타입 | 설명 | 현행 명세와의 차이 |
| --- | --- | --- | --- |
| `islandList[].kioskCnt` | number | 아일랜드별 셀프체크인 키오스크 대수 | `6.4` `deviceList[deviceType='KIOSK'].deviceCnt` 가 **터미널·아일랜드 1개분**이었다 → 아일랜드 목록 안으로 이동 |
| `islandList[].bagDropCnt` | number | 아일랜드별 셀프백드롭 대수 | `6.4` `deviceList[deviceType='SBD'].deviceCnt` 동일 |

- `6.4` 의 `deviceList[].oprYn` / `oprTimeList`(기기별 운영시간)는 **리뉴얼 화면에 대응 요소가 없다.** 아일랜드 운영시간을 따르는 것으로 볼지, 기기별 운영시간을 계속 저장할지 결정 필요.
- 하단 셀프 서비스 바의 터미널 합계는 화면에서 `islandList` 를 더해 만든다. 서버 합계가 따로 필요하면 `totKioskCnt` / `totBagDropCnt` 를 추가한다.

### 2.6 저장

`saveChknCounterInfo` 요청이 **아일랜드 1개분 → 터미널 1개분 전체**로 커진다.

| 필드 | 타입 | 설명 | 현행 명세와의 차이 |
| --- | --- | --- | --- |
| `smltId` / `tmnlId` | string | 대상 | 동일 |
| `islandList[].island` | string | 아일랜드 | `island` 단건이었다 |
| `islandList[].oprTimeList` | OprTimeDto[] | 아일랜드 운영 시간 | `oprTimeList` 단건이었다 |
| `islandList[].boothList` | `{ boothNo, alnCd, customYn }[]` | 부스 배정 | `oprCounterIdList`(운영 카운터 id 목록)를 대체 |
| `islandList[].kioskCnt` / `bagDropCnt` | number | 셀프 서비스 대수 | `saveSlfchknInfo` 를 흡수 |

- 결정 필요: `saveSlfchknInfo` 를 **폐기**할지, 체크인 저장과 별개로 남길지. (화면에서는 `현재상태 저장` 버튼 하나로 함께 저장된다)
- 결정 필요: 드로어에서 **아일랜드를 새로 추가**(`+ 추가`)했을 때의 계약. 신규 아일랜드 식별을 `island` 문자만으로 할지, 별도 일련번호를 둘지.

---

## 3. 출국장 탭

### 3.1 시간대별 운영 출국장 블럭 차트 (주 차트)

블럭 1개 = 출국장 1개 × 1시간.

| 필드 | 타입 | 설명 | 현행 명세와의 차이 |
| --- | --- | --- | --- |
| `depList[].depNum` | string | 출국장 번호 | `6.5` 동일 |
| `depList[].oprYn` | YnFlag | 사용 / 미사용 (`N` 이면 차트에서 빠지고 미운영 칩으로 내려간다) | `6.5` 동일 |
| `depList[].oprTimeList` | OprTimeDto[] | 운영 시간 구간 | `6.5` 동일 |
| `depList[].scCnt` | number | 그 출국장의 **검색대 대수(피크 기준)** — 보조 차트 블럭 수의 근거 | **없음.** `6.6` 은 구간 목록만 있어 대표값을 셀 수 없다 |
| `waitList` / `waitMaxCnt` | — | 대기인원수 꺾은선 | 2.2 와 동일 (**없음**) |
| KPI 4종 | — | 패널 헤드 결과 지표 | 2.3 과 동일 (**없음**) |

### 3.2 시간대별 보안검색대 보조 차트 (구 `6.6` 흡수)

블럭 1개 = 검색대 4대. 주 차트와 시간축을 공유한다.

| 필드 | 타입 | 설명 | 현행 명세와의 차이 |
| --- | --- | --- | --- |
| `depList[].planList[].bgnHour` / `endHour` | string | 구간 시작 / 종료 | `6.6` `planList` 대응 (현행은 `bgnMin` / `endMin` 도 있다) |
| `depList[].planList[].scCnt` | number | 그 구간 검색대 갯수 | `6.6` `scCnt` 대응 |
| `depList[].planList[].planSn` | number | 행 일련번호 (신규 행 `0`) | `6.6` 동일 |

- **분 단위가 화면에서 사라졌다.** 리뉴얼 타임바·블럭 차트는 **1시간 단위**다. `bgnMin` / `endMin` 을 계속 받을지(항상 `00`), 아예 시간(`0`~`24`) 정수로 바꿀지 **결정 필요**.
- 조회 단위도 커진다. `6.6` 은 `depNum` 1곳분을 저장하지만, 리뉴얼 첫 화면은 **터미널의 모든 출국장 운영계획**을 한 번에 그린다.

### 3.3 드로어 — 검색대 구성 (신규)

| 필드 | 타입 | 설명 | 현행 명세와의 차이 |
| --- | --- | --- | --- |
| `depList[].normalCnt` | number | 일반 검색대 대수 | **없음** |
| `depList[].smartPassCnt` | number | 스마트패스 검색대 대수 | **없음** |
| `depList[].scCnt` | number | 보안검색대 대수 (피크 시간대 기준) | **없음** |

- 결정 필요: 세 값의 관계. `scCnt = normalCnt + smartPassCnt` 인지, 서로 독립인지. (현재 화면은 독립 스테퍼 3개다)

### 3.4 저장

`saveDepInfo` 와 `saveScPlanInfo` 가 **한 버튼(`현재상태 저장`)으로 합쳐진다.**

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `smltId` / `tmnlId` | string | 대상 |
| `depList[].depNum` | string | 출국장 |
| `depList[].oprYn` | YnFlag | 사용 / 미사용 |
| `depList[].oprTimeList` | OprTimeDto[] | 운영 시간 |
| `depList[].normalCnt` / `smartPassCnt` / `scCnt` | number | 검색대 구성 |
| `depList[].planList` | `{ planSn, bgnHour, endHour, scCnt }[]` | 보안검색대 운영계획 (터미널 전체분) |

- 결정 필요: `saveScPlanInfo` 를 **폐기**하고 `saveDepInfo` 에 합칠지, 두 API 를 순차 호출할지.

---

## 4. 서버 계산인지 클라이언트 계산인지 — 결정 필요 목록

리뉴얼 화면에는 "지금 값으로 다시 계산"에 해당하는 조작이 늘었다. 계산 주체가 정해지지 않으면 3·4단계에서 API 유무가 갈린다.

| 항목 | 화면 위치 | 현재 구현 | 결정할 것 |
| --- | --- | --- | --- |
| `균등 배치` | 출국장 보조 차트 헤드 · 드로어 운영계획 헤더 | `console.log` 스텁 | **서버 계산(`execute*` 또는 `retrieve*` 신설)인지 클라이언트 계산인지.** 균등의 기준(운영시간 균등 / 여객수 비례)도 정의 필요 |
| 피크 카운터 / 피크 검색대 | 패널 요약 | 화면에서 계산 (시간대별 합의 최댓값) | 서버가 내려줄지. 내려준다면 필드명(`peakCounterCnt` / `peakScCnt`) |
| 대기인원수 꺾은선 · KPI 4종 | 차트 · 패널 헤드 | 목업 고정값 | 2.2 · 2.3 참고 — 결과 조회인지 실시간 예측인지 |
| `세부 운영시간 직접 설정 →` | 차트 푸터 | `console.log` 스텁 | 별도 화면인지 드로어 확장인지. 별도 화면이면 조회/저장 계약이 더 필요하다 |
| `+ 추가` (아일랜드 / 출국장 신규) | 차트 푸터 | 빈 값 드로어 | 신규 항목의 식별자 채번 주체(서버 / 클라이언트) |

---

## 5. 현행 명세에서 정리되어야 할 것

| 대상 | 사유 |
| --- | --- |
| `6.3` `counterList[]` (`counterId` / `counterNum` / `rowType`) | 상/하단 18열 카운터 배치도가 화면에서 사라졌다. 부스 단위(`boothList`)로 대체 |
| `6.3` `saveChknCounterInfo.oprCounterIdList` | 셀 토글 UI 가 없어졌다. 아일랜드 운영시간 + 부스 배정으로 대체 |
| `6.4` 전체 (`retrieveSlfchknInfo` / `saveSlfchknInfo`) | 탭 삭제 — `6.3` 으로 흡수 (2.5 참고) |
| `6.6` 전체 (`retrieveScPlanInfo` / `saveScPlanInfo`) | 탭 삭제 — `6.5` 로 흡수 (3.2 참고) |
| `6.7` `retrieveFcltMap` 의 `fcltType` | `SLFCHKN` / `SC` 를 단독으로 여는 진입점이 화면에서 사라졌다. 코드값을 유지할지 확인 필요 |
| `2. 화면 ↔ API 대응` 표 · `8. 화면 호출 순서` | "탭별 `retrieve*`" 가 3개로 줄어든다 |
