# PM 예측관리 API 명세

현 퍼블리싱 화면(대시보드 / 맵형태보기 / 사용자 시뮬레이션 / 시뮬레이션 모니터링)을 기준으로 정의한 API 목록이다.
코드 위치는 아래와 같다.

| 파일 | 역할 |
| --- | --- |
| `api/pm/client.ts` | axios 인스턴스 · 로딩바 · 공통 에러 처리 |
| `api/pm/endpoints.ts` | 엔드포인트 상수 |
| `api/pm/services/*.service.ts` | 화면 단위 호출 함수 |
| `types/api.types.ts` | 요청/응답 DTO |

---

## 1. 공통 규약

- **RESTful 아님.** 자원(URI) + 메서드가 아니라 **동작 단위**로 호출한다.
  경로는 `/pm/cast/{도메인}/{동사+대상}` 형태이며 동사는 `retrieve` / `save` / `execute` 세 가지만 쓴다.
- **모든 호출은 `POST`.** 조회도 POST 이며, 조회 조건은 쿼리스트링이 아니라 **body(JSON)** 로 넘긴다.
- 응답은 **DTO 를 그대로** 내려준다. (`ApiResponse<T>` 래핑은 래핑이 필요한 API 에서만 사용)
- 조회 결과가 없으면 목록은 `[]`, 단건은 필드 기본값(숫자 `0` / 문자 `''`)으로 내려준다. `null` 은 명시된 필드만 허용한다.
- `params: { loading: true }` 를 붙인 호출은 상단 로딩바를 띄운다. 화면 진입/조회/저장처럼 사용자가 기다리는 호출에만 붙인다.

### 공통 요청 파라미터

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `ymd` | string | 기준일자 `yyyyMMdd` |
| `hhmm` | string | 기준 시각 `HHmm` (맵형태보기는 30분 단위) |
| `smltId` | string | 시뮬레이션 ID |
| `tmnlId` | `'T1' \| 'T2'` | 터미널 구분 |
| `island` | string | 아일랜드 (`A`~`N`, `I` 제외) |
| `depNum` | string | 출국장 번호 |

### 공통 코드

| 코드 | 값 | 비고 |
| --- | --- | --- |
| `CongestionStatus` | `FREE` / `NORMAL` / `BUSY` / `VERY_BUSY` | 여유 / 보통 / 혼잡 / 매우혼잡. 마커는 `NORMAL`·`BUSY`·`VERY_BUSY` 3단계만 사용 |
| `SmltType` | `DAILY` / `USER` | 일일 / 사용자 시뮬레이션 |
| `SmltExecStatus` | `DONE` / `RUNNING` | 완료 / 진행중 |
| `FcltType` | `CHKN` / `SLFCHKN` / `DEP` / `SC` / `CMRC` | 체크인카운터 / 셀프체크인·백드롭 / 출국장 / 보안검색대 / 상업시설 |
| `YnFlag` | `Y` / `N` | 운영 여부 |

### 공통 응답 필드

단건 응답에는 아래 두 필드가 함께 내려온다.

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `error` | boolean | 처리 실패 여부 |
| `errorMessage` | string | 실패 사유 (성공 시 `''`) |

### 에러

HTTP 상태 코드로 실패를 알리고, 클라이언트는 `client.ts` 인터셉터에서 `ApiError { status, message, code }` 로 정규화한다.
(400 / 404 / 500 / 503 · 타임아웃 `ECONNABORTED` · 네트워크 `ERR_NETWORK`)

---

## 2. 화면 ↔ API 대응

| 화면 | 경로 | API |
| --- | --- | --- |
| 공통(LNB 사용자) | 전 화면 | `retrieveUserInfoBySession` |
| 요약보기(대시보드) | `/rui/pm/daily-smlt/dashboard` | `retrieveDailySmltBaseInfo` · `retrieveDailySmltHeader` · `retrieveDailySmltTmnlSmry` · `retrieveDailySmltTmnlRsltByTime` · `retrieveDailySmltFcltCard` |
| 맵형태보기 | `/rui/pm/daily-smlt/terminalMap` | `retrieveSmltMap` · `retrieveSmltMapChknDetail` · `retrieveSmltMapDepDetail` |
| 사용자 시뮬레이션 | `/rui/pm/user-smlt/config` | `retrieveUserSmltInfo` · 탭별 `retrieve*` / `save*` · `retrieveFcltMap` · `executeUserSmlt` |
| 시뮬레이션 모니터링 | `/rui/pm/smlt-monitoring` | `retrieveSmltExecSmry` · `retrieveSmltExecList` · `retrieveSmltExecDetail` |

---

## 3. 공통

### 3.1 사용자 정보 조회

`POST /pm/cast/user/retrieveUserInfoBySession` — `commonService.getUserInfoBySession()`

세션의 로그인 사용자 정보. LNB 하단의 부서/성명에 쓴다.

**Request** 없음

**Response** `UserInfo`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `userId` | string | 사용자 key |
| `userNm` | string | 성명 |
| `deptNm` | string | 부서 |

---

## 4. 일일 시뮬레이션 결과 조회 — 요약보기(대시보드)

### 4.1 조회 조건 기준 정보

`POST /pm/cast/smry/retrieveDailySmltBaseInfo` — `dashboardService.getBaseInfo(ymd)`

기준일자로 조회 대상 시뮬레이션을 잡고, 상단 바의 계산 시각/시각 선택 목록을 채운다. **화면 진입 시 가장 먼저 호출**하며 이후 API 는 여기서 받은 `smltId` 를 쓴다.

**Request**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `ymd` | string | Y | 기준일자 `yyyyMMdd` |

**Response** `DsbdBaseInfoDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `smltId` | string | 조회 기준 시뮬레이션 ID |
| `ymd` | string | 기준일자 |
| `smltType` | SmltType | 우상단 뱃지 (일일/사용자) |
| `lastCalcDt` | string | 마지막 계산 시각 `yyyyMMddHHmmss` |
| `nextCalcDt` | string | 재계산 예정 시각 `yyyyMMddHHmmss` |
| `avlTimes` | string[] | 선택 가능한 기준 시각 `HHmm` — 시/분 선택 박스 |

### 4.2 상단 카드 조회

`POST /pm/cast/smry/retrieveDailySmltHeader` — `dashboardService.getHeader(ymd, hhmm)`

상단 카드 4종(일일 운항계획 · 시간대별 출발여객 · 요일 속성 · 기상정보)을 한 번에 내려준다.

**Request** `ymd`, `hhmm`

**Response** `DsbdHeaderDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `ymd` | string | 기준일자 |
| `fltPlan` | FltPlanDto | 일일 운항계획 |
| `hourlyPsgList` | HourlyPsgDto[] | 시간대별 출발여객 (T1 / T2) |
| `dowAttr` | DowAttrDto | 요일 속성 |
| `weather` | WeatherDto | 기상정보 |

`FltPlanDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `depFltCnt` / `arrFltCnt` / `totFltCnt` | number | 출발 / 도착 / 총 운항편 |
| `depPsgCnt` / `totPsgCnt` | number | 출발 / 총 여객 |

`HourlyPsgDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `tmnlId` | TmnlId | 터미널 |
| `totPsgCnt` | number | 카드 헤더의 터미널 합계 |
| `maxPsgCnt` | number | Y축 최댓값 |
| `itemList[].time` | string | `HH` |
| `itemList[].psgCnt` | number | 출발 여객수 (막대) |
| `itemList[].fcstPsgCnt` | number | 예측 여객수 (라인) |

`DowAttrDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `dowNm` | string | 예: `주말 전일(금)` |
| `dowType` | `WEEKDAY`\|`WEEKEND`\|`PRE_WEEKEND`\|`HOLIDAY` | 요일 구분 |
| `spclNote` | string | 특이점 (예: `공휴일 전일`) |

`WeatherDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `wthrCd` | string | 날씨 코드 (아이콘 매핑) |
| `tmpr` | number | 기온 ℃ |
| `rainAmt` / `snowAmt` | number | 강수량 / 적설 mm |
| `lowVisStep1Time` / `lowVisStep2Time` | string | 저시정 1·2단계 `HHmm` (없으면 `''`) |

### 4.3 터미널 요약 조회

`POST /pm/cast/smry/retrieveDailySmltTmnlSmry` — `dashboardService.getTmnlSmry(smltId, tmnlId, hhmm)`

터미널 패널 상단(운항/여객 증감 · 탑승률 · 피크시간)을 채운다. T1/T2 각각 호출한다.

**Request** `smltId`, `tmnlId`, `hhmm`

**Response** `TmnlSmryDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `tmnlId` | TmnlId | 터미널 |
| `fltCnt` / `psgCnt` | number | 운항편 / 여객 |
| `fltDiffCnt` / `psgDiffCnt` | number | 지난주 同요일 대비 증감 |
| `befFltDiffCnt` / `befPsgDiffCnt` | number | 전일 대비 증감 (요약 뷰 상단 2셀) |
| `brdgRate` | number | 탑승률 % |
| `peak.ampm` | `AM`\|`PM` | 피크 오전/오후 |
| `peak.peakTime` | string | 피크 시각 `HHmm` |
| `peak.wtngPsgCnt` | number | 총 대기인원 (명) |
| `peak.maxWtngHr` | number | 최대 대기시간 (분) |
| `peak.hrlyPrcsPsgCnt` | number | 시간당 처리인원 (명) |

### 4.4 시간대별 결과 조회

`POST /pm/cast/smry/retrieveDailySmltTmnlRsltByTime` — `dashboardService.getTmnlRsltByTime(smltId, tmnlId, category)`

터미널 패널의 **차트 뷰와 테이블 뷰가 함께 쓰는** 시간대별 결과. 상단 퀵 액세스 타일이 `category` 를 정한다.

**Request**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `smltId` | string | Y | 시뮬레이션 ID |
| `tmnlId` | TmnlId | Y | 터미널 |
| `category` | `PSG`\|`FLT`\|`CHKN`\|`DEP` | Y | 터미널 여객수 / 운항편 / 체크인카운터 / 출국장 |

**Response** `DsbdRsltDto[]`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `time` | string | `HHmm` |
| `psgCnt` | number | 여객수 |
| `wtngPsgCnt` / `wtngHr` | number | 대기인원(명) / 대기시간(분) |
| `prcsPsgCnt` / `prcsHr` | number | 처리인원(명) / 처리시간(분) |
| `prcsRate` | number | 처리율 % |
| `fcstWtngPsgCnt` | number | 예측 대기인원 (차트 점선) |
| `lastWeekWtngPsgCnt` | number | 지난주 同요일 대기인원 (차트 비교선) |

### 4.5 게이트 카드 조회

`POST /pm/cast/smry/retrieveDailySmltFcltCard` — `dashboardService.getFcltCardList(smltId, tmnlId, hhmm, fcltType)`

터미널 패널 하단의 체크인카운터 / 출국장 카드. **배열 1건이 캐러셀 1페이지**다.

**Request** `smltId`, `tmnlId`, `hhmm`, `fcltType`(`CHKN` | `DEP`)

**Response** `DsbdFcltCardDto[]`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `cardId` | string | 카드 식별자 |
| `fcltType` | `CHKN`\|`DEP` | 시설 구분 |
| `island` | string | 아일랜드 (출국장이면 `''`) |
| `depNum` | string | 출국장 번호 (체크인카운터면 `''`) |
| `fcltNm` | string | 표시명 (예: `B`, `3번`) |
| `fcltDesc` | string | 부가 표기 (예: `좌측 B4~B8`) |
| `totCnt` / `oprCnt` | number | 전체 / 운영 (개) |
| `wtngPsgCnt` | number | 대기열(체크인) · 예상인원(출국장) (명) |
| `hrlyPrcsPsgCnt` | number | 시간당 처리인원 (Pax/Min) |
| `hrlyPrcsRate` | number | 시간당 처리율 게이지 0~100 |
| `cgnClearTime` | string | 혼잡해소 예상 시각 `HHmm` |
| `cgnClearRate` | number | 혼잡해소 게이지 0~100 |
| `cgnStatus` | CongestionStatus | 카드 혼잡도 |
| `recommend.targetNm` | string | 추천 대상 (예: `대한항공`, `보안검색대`) |
| `recommend.addCnt` | number | 추가 필요 수량 (개) |
| `recommend.needAssignYn` | YnFlag | `Y`=배정 필요 / `N`=소요 |
| `unitList[].unitCd` | string | 하단 칩 라벨 (`A`~`N`, `1`~`6`) |
| `unitList[].cgnStatus` | CongestionStatus | 칩 색상 |
| `unitList[].useYn` | YnFlag | `N` = 미운영(회색) |

---

## 5. 일일 시뮬레이션 결과 조회 — 맵형태보기

### 5.1 도면 조회

`POST /pm/cast/map/retrieveSmltMap` — `mapService.getSmltMap(smltId, tmnlId, hhmm)`

화면 본문 전체(혼잡 알림 · 운영시간 카드 · 도면 마커)를 한 번에 내려준다.
**하단 타임라인을 옮길 때마다** `hhmm` 만 바꿔 재호출한다 (30분 단위, `0000`~`2400`).

**Request** `smltId`, `tmnlId`, `hhmm`

**Response** `SmltMapDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `smltId` / `tmnlId` / `hhmm` | string | 조회 조건 반향 |
| `summary.fltCnt` / `summary.psgCnt` | number | 헤더 우측 운항/여객 |
| `notice.cgnStatus` | CongestionStatus | 상단 알림 단계 (여유/보통/혼잡/매우혼잡) |
| `notice.itemList[].fcltNm` | string | 시설명 (예: `체크인카운터`) |
| `notice.itemList[].fcltCd` | string | 시설 코드 (예: `M11`) |
| `notice.itemList[].boothCnt` | number | 조치 부스 수 (`n개 부스 OPEN`) |
| `operCardList[].depNum` | string | 출국장 번호 (도넛 카드 1장 = 출국장 1곳) |
| `operCardList[].oprRate` | number | 도넛 게이지 0~100 |
| `operCardList[].oprBgnTime` / `oprEndTime` | string | 운영 시작/종료 `HHmm` |
| `operCardList[].oprHr` | number | 하루 운영 시간 |
| `operCardList[].useYn` | YnFlag | `N` = 미운영(흐림) |
| `depMarkerList` | MapMarkerDto[] | 출국장 마커 (T1 6곳 / T2 2곳) |
| `chknMarkerList` | MapMarkerDto[] | 아일랜드 마커 `A`~`N` |
| `gateMarkerList` | MapMarkerDto[] | 출입구 게이트 마커 `1`~`14` |

`MapMarkerDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `markerId` | string | 마커 식별자 (예: `dg3`, `M`, `g14`) |
| `label` | string | 표시 문구 |
| `cdntX` / `cdntY` | number | 도면 무대 기준 **비율(%)** 0~100 |
| `cgnStatus` | CongestionStatus? | 마커 색상. 출입구 게이트는 내려주지 않음 |

### 5.2 아일랜드 상세 조회

`POST /pm/cast/map/retrieveSmltMapChknDetail` — `mapService.getChknDetail(smltId, tmnlId, island, hhmm)`

아일랜드 마커 클릭 시 상세 팝업.

**Request** `smltId`, `tmnlId`, `island`, `hhmm`

**Response** `MapChknDetailDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `island` | string | 아일랜드 (예: `M`) |
| `fcltCd` | string | 시설 코드 (예: `T1-3RD-M01-01`) |
| `cgnStatus` | CongestionStatus | 상태 뱃지 |
| `fcltList[].fcltType` | FcltType | 시설 구분 (아이콘) |
| `fcltList[].fcltNm` | string | 시설명 |
| `fcltList[].prcsRate` | number \| null | 처리율 % — 상업시설은 `null` |
| `stat.wtngPsgCnt` / `stat.wtngHr` | number | 대기인원(명) / 대기시간(초) |
| `stat.prcsPsgCnt` / `stat.prcsHr` | number | 처리인원(명) / 처리시간(초) |
| `sales.totAmt` | number | 총 매출 (원) |
| `sales.storeCnt` | number | 상업시설 수 |
| `sales.amtPerPsg` | number | 인원대비 매출 (원) |
| `sales.psgDiffCnt` | number | 매출 인원 증감 (명) |
| `sales.diffRate` | number | 증감률 % (음수 가능) |
| `sales.cmprYear` | string | 비교 기준 연도 |

### 5.3 출국장 상세 조회

`POST /pm/cast/map/retrieveSmltMapDepDetail` — `mapService.getDepDetail(smltId, tmnlId, depNum, hhmm)`

출국장 마커 클릭 시 미니 팝업.

**Request** `smltId`, `tmnlId`, `depNum`, `hhmm`

**Response** `MapDepDetailDto` — `depNum`, `depNm`(예: `출국장 3`), `cgnStatus`, `stat`(5.2 와 동일한 지표 4종)

---

## 6. 사용자 시뮬레이션 — 조건 설정

탭 5개가 같은 `smltId` 를 공유하며, **터미널(T1/T2) 단위로 조회·저장**한다.
저장은 각 패널의 `현재상태 저장`, 실행은 GNB 의 `시뮬레이션 실행` 버튼과 1:1 이다.

### 6.1 진입 정보 조회

`POST /pm/cast/user-smlt/retrieveUserSmltInfo` — `userSmltService.getInfo(ymd, tmnlId)`

도입 화면에서 터미널을 고른 뒤 호출한다. 저장된 조건이 없으면 기준일자의 표준값으로 새 `smltId` 를 만들어 내려준다.

**Request** `ymd`, `tmnlId`

**Response** `UserSmltInfoDto` — `smltId`, `ymd`, `saveDt`(마지막 저장 `yyyyMMddHHmmss`, 없으면 `''`), `execStatus`(직전 수행 상태, 미수행이면 `''`)

### 6.2 운항편/여객수 탭

**조회** `POST /pm/cast/user-smlt/retrieveFltPsgInfo` — `userSmltService.getFltPsgInfo(smltId, tmnlId)`

**Response** `UserSmltFltPsgDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `fltCnt` / `psgCnt` | number | 요약: 운항편 / 여객 |
| `peakTime` | string | 요약: 피크 `HHmm` |
| `adjType` | `RATIO`\|`HOURLY` | 수정 방식 (전체 비율 / 시간대별) |
| `adjRate` | number | 전체 비율 % (`-100`~`100`, 5 단위) |
| `fltChart` / `psgChart` | FltPsgChartDto | 운항편 수 / 여객 수 막대 차트 |
| `hourList[].bgnTime` / `endTime` | string | 구간 `HHmm` |
| `hourList[].adjRate` | number | 구간 수정 비율 % |
| `hourList[].psgCnt` | number | 구간 승객 수 (명) |

`FltPsgChartDto` — `totCnt`(누적), `maxCnt`(Y축 최댓값), `itemList[].time`(`HH`, 2시간 단위 12개), `itemList[].cnt`

**저장** `POST /pm/cast/user-smlt/saveFltPsgInfo` — `userSmltService.saveFltPsgInfo(request)`

**Request** `UserSmltFltPsgSaveReq`

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `smltId` / `tmnlId` | string | Y | 대상 |
| `adjType` | `RATIO`\|`HOURLY` | Y | 수정 방식 |
| `adjRate` | number | Y | 전체 비율 % (`adjType=RATIO` 일 때 적용) |
| `hourList` | `{ bgnTime, endTime, adjRate }[]` | Y | 시간대별 수정값 (`adjType=HOURLY` 일 때 적용) |

**Response** 없음 (실패 시 HTTP 에러)

### 6.3 체크인 카운터 탭

**조회** `POST /pm/cast/user-smlt/retrieveChknCounterInfo` — `userSmltService.getChknCounterInfo(smltId, tmnlId, island)`

**Response** `UserSmltChknDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `totCnt` | number | 전체 카운터 수 (상단 + 하단) |
| `islandList` | string[] | 아일랜드 목록 (`I` 제외) |
| `island` | string | 선택 아일랜드 |
| `counterList[].counterId` | string | 셀 식별자 (`U1`~`U18` / `L1`~`L18`) |
| `counterList[].counterNum` | number | 카운터 번호 1~18 |
| `counterList[].rowType` | `U`\|`L` | 상단 / 하단 열 |
| `counterList[].alnCd` | string | 배정 항공사 코드 — 미배정이면 `''` (화면 `N/A`) |
| `counterList[].customYn` | YnFlag | Custom 카운터 (점선 테두리) |
| `counterList[].oprYn` | YnFlag | 운영 여부 (초기 선택 상태) |
| `oprTimeList[].bgnHour` / `endHour` | number | 운영 시간 구간 (0~24) |

**저장** `POST /pm/cast/user-smlt/saveChknCounterInfo` — `userSmltService.saveChknCounterInfo(request)`

**Request** `UserSmltChknSaveReq` — `smltId`, `tmnlId`, `island`, `oprCounterIdList`(운영으로 선택한 `counterId` 목록), `oprTimeList`

### 6.4 셀프체크인/백드롭 탭

**조회** `POST /pm/cast/user-smlt/retrieveSlfchknInfo` — `userSmltService.getSlfchknInfo(smltId, tmnlId, island)`

**Response** `UserSmltSlfchknDto` — `totCnt`(전체 보유 대수), `islandList`, `island`, `deviceList`

| `deviceList[]` | 타입 | 설명 |
| --- | --- | --- |
| `deviceType` | `KIOSK`\|`SBD` | 셀프체크인 키오스크 / 셀프백드롭 |
| `deviceNm` | string | 기기명 |
| `deviceCnt` | number | 운영 대수 |
| `oprYn` | YnFlag | `N` = 미운영 |
| `oprTimeList` | OprTimeDto[] | 운영 시간 구간 (복수 가능) |

**저장** `POST /pm/cast/user-smlt/saveSlfchknInfo` — `userSmltService.saveSlfchknInfo(request)`

**Request** `UserSmltSlfchknSaveReq` — `smltId`, `tmnlId`, `island`, `deviceList[{ deviceType, deviceCnt, oprYn, oprTimeList }]`

### 6.5 출국장 탭

**조회** `POST /pm/cast/user-smlt/retrieveDepInfo` — `userSmltService.getDepInfo(smltId, tmnlId)`

**Response** `UserSmltDepDto` — `depList[{ depNum, depNm, oprYn, oprTimeList }]` (T1 6곳 / T2 2곳)

**저장** `POST /pm/cast/user-smlt/saveDepInfo` — `userSmltService.saveDepInfo(request)`

**Request** `UserSmltDepSaveReq` — `smltId`, `tmnlId`, `depList[{ depNum, oprYn, oprTimeList }]`

### 6.6 보안 검색대 탭

**조회** `POST /pm/cast/user-smlt/retrieveScPlanInfo` — `userSmltService.getScPlanInfo(smltId, tmnlId)`

**Response** `UserSmltScDto` — `depList[{ depNum, planList }]`

| `planList[]` | 타입 | 설명 |
| --- | --- | --- |
| `planSn` | number | 행 일련번호 (신규 행은 `0`) |
| `bgnHour` / `bgnMin` | string | 시작 `HH` / `mm` |
| `endHour` / `endMin` | string | 종료 `HH` / `mm` |
| `scCnt` | number | 운영 검색대 갯수 |

**저장** `POST /pm/cast/user-smlt/saveScPlanInfo` — `userSmltService.saveScPlanInfo(request)`

**Request** `UserSmltScSaveReq` — `smltId`, `tmnlId`, `depNum`(선택한 출국장), `planList`
행 추가/삭제 결과를 **선택한 출국장 1곳분 전체**로 보낸다.

### 6.7 지도 보기

`POST /pm/cast/user-smlt/retrieveFcltMap` — `userSmltService.getFcltMap(smltId, tmnlId, fcltType, island?)`

요약 바 우측 지도 보기 버튼 (체크인 카운터 / 셀프체크인·백드롭 / 출국장 탭 공용).

**Request** `smltId`, `tmnlId`, `fcltType`, `island`(아일랜드 단위 시설이 아니면 생략)

**Response** `UserSmltFcltMapDto` — `tmnlId`, `fcltType`, `island`, `markerList`(`MapMarkerDto[]`, 5.1 과 동일)

### 6.8 시뮬레이션 실행

`POST /pm/cast/user-smlt/executeUserSmlt` — `userSmltService.execute(smltId, tmnlId)`

저장된 조건으로 수행을 건다. 비동기로 시작만 하고 진행 상황은 모니터링 화면에서 확인한다.

**Request** `smltId`, `tmnlId`

**Response** `UserSmltExecDto` — `smltId`, `execSn`(수행 일련번호), `execStatus`, `bgnDt`

---

## 7. 시뮬레이션 모니터링

조회 기간은 화면의 시작/종료 일시를 합쳐 `yyyyMMddHHmm` 으로 넘긴다.

### 7.1 수행 현황 조회

`POST /pm/cast/mntr/retrieveSmltExecSmry` — `monitoringService.getExecSmry(bgnDt, endDt)`

상단 KPI 카드 4종.

**Request** `bgnDt`, `endDt` (`yyyyMMddHHmm`)

**Response** `SmltExecSmryDto` — `totCnt`(전체 수행), `doneCnt`(완료), `runningCnt`(진행중), `avgExecMin` / `avgExecSec`(평균 수행시간)

### 7.2 시뮬레이션 이력 조회

`POST /pm/cast/mntr/retrieveSmltExecList` — `monitoringService.getExecList(bgnDt, endDt)`

표준 / 사용자 이력을 좌우로 나란히 보여주므로 **한 번에** 내려준다.

**Request** `bgnDt`, `endDt`

**Response** `SmltExecListDto` — `stdList`(표준) · `userList`(사용자), 둘 다 `SmltExecDto[]`

| `SmltExecDto` | 타입 | 설명 |
| --- | --- | --- |
| `rowNum` | number | No |
| `smltId` | string | 시뮬레이션 ID (결과 보기에 사용) |
| `smltType` | SmltType | 표준 / 사용자 |
| `deptNm` / `userNm` | string | 부서 / 성명 |
| `bgnDt` / `endDt` | string | 시작 / 종료 일시 `yyyyMMddHHmmss` (진행중이면 `endDt`=`''`) |
| `execMin` | number | 소요시간 (분) |
| `execStatus` | SmltExecStatus | 완료 / 진행중 |

### 7.3 이력 결과 보기

`POST /pm/cast/mntr/retrieveSmltExecDetail` — `monitoringService.getExecDetail(smltId)`

이력 행의 `결과 보기` 버튼. 결과 조회 화면으로 넘길 조건을 받는다.

**Request** `smltId`

**Response** `SmltExecDetailDto` — `smltId`, `smltType`, `ymd`, `tmnlId`, `deptNm`, `userNm`, `bgnDt`, `endDt`, `execMin`, `execStatus`

---

## 8. 화면 호출 순서 (참고)

**요약보기(대시보드)**

1. `retrieveDailySmltBaseInfo(ymd)` → `smltId` 확보
2. `retrieveDailySmltHeader(ymd, hhmm)` — 상단 카드
3. 터미널별 `retrieveDailySmltTmnlSmry(smltId, tmnlId, hhmm)`
4. 터미널별 `retrieveDailySmltTmnlRsltByTime(smltId, tmnlId, category)` — 차트/테이블
5. 터미널별 `retrieveDailySmltFcltCard(smltId, tmnlId, hhmm, 'CHKN' | 'DEP')`
   → 조회 버튼/퀵 타일/터미널 전환 시 해당 API 만 재호출한다.

**맵형태보기**

1. `retrieveDailySmltBaseInfo(ymd)` → `smltId`
2. `retrieveSmltMap(smltId, tmnlId, hhmm)` — 터미널 전환·타임라인 이동 때마다 재호출
3. 마커 클릭 시 `retrieveSmltMapChknDetail` / `retrieveSmltMapDepDetail`

**사용자 시뮬레이션**

1. 터미널 선택 → `retrieveUserSmltInfo(ymd, tmnlId)` → `smltId`
2. 활성 탭의 `retrieve*` 호출 (탭 전환 시 그 탭만)
3. `현재상태 저장` → 해당 탭 `save*`
4. `시뮬레이션 실행` → `executeUserSmlt`

**시뮬레이션 모니터링**

1. `retrieveSmltExecSmry(bgnDt, endDt)` + `retrieveSmltExecList(bgnDt, endDt)`
2. `결과 보기` → `retrieveSmltExecDetail(smltId)`
