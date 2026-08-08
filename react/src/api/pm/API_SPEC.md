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

두 갈래다.

- **업무 실패**(검증 불통과 · 저장 대상 없음 등)는 예외를 던지지 않고 **payload 안에서** 알린다. `error = true` + `errorMessage` 다. HTTP 는 200 이다.
- **기술 실패**(장애 · 타임아웃 · 네트워크)는 HTTP 상태 코드로 알리고, 클라이언트는 `client.ts` 인터셉터에서 `ApiError { status, message, code }` 로 정규화한다.
  (400 / 404 / 500 / 503 · 타임아웃 `ECONNABORTED` · 네트워크 `ERR_NETWORK`)

`save*` 처럼 내려줄 페이로드가 없는 호출은 **`JsonResponse`(= `error` / `errorMessage` 두 필드)만** 응답한다. ([결정 로그 D13](../../../../docs/db/07-save-decisions.md))

---

## 2. 화면 ↔ API 대응

| 화면 | 경로 | API |
| --- | --- | --- |
| 공통(LNB 사용자) | 전 화면 | `retrieveUserInfoBySession` |
| 요약보기(대시보드) | `/rui/pm/daily-smlt/dashboard` | `retrieveDailySmltBaseInfo` · `retrieveDailySmltHeader` · `retrieveDailySmltTmnlSmry` · `retrieveDailySmltTmnlRsltByTime` · `retrieveDailySmltFcltCard` |
| 맵형태보기 | `/rui/pm/daily-smlt/terminalMap` | `retrieveSmltMap` · `retrieveSmltMapChknDetail` · `retrieveSmltMapDepDetail` |
| 사용자 시뮬레이션 | `/rui/pm/user-smlt/config` | `retrieveUserSmltInfo` · 탭별 `retrieve*` **3개**(`retrieveFltPsgInfo` · `retrieveChknCounterInfo` · `retrieveDepInfo`) · 탭별 `save*` **3개**(`saveFltPsgInfo` · `saveChknCounterInfo` · `saveDepInfo`) · `retrieveFcltMap` · `executeUserSmlt` |
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

**탭이 5개에서 3개로 줄었다.** 셀프체크인/백드롭(구 `6.4`)은 체크인 카운터(`6.3`)로, 보안 검색대(구 `6.6`)는 출국장(`6.5`)으로 흡수됐다.
없어진 절은 **번호를 비우지 않고** 흡수처를 가리키는 안내만 남긴다 (다른 문서의 참조를 깨지 않기 위해서다).

탭 3개가 같은 `smltId` 를 공유하며, **터미널(T1/T2) 단위로 조회·저장**한다.
저장은 각 패널의 `현재상태 저장`, 실행은 GNB 의 `시뮬레이션 실행` 버튼과 1:1 이다.

- **조회 API 는 3단계, `save*` / `executeUserSmlt` 는 4단계에서 구현했다.**
- **탭당 조회는 1회다.** 드로어(자원 배정 · 셀프 서비스 · 검색대 구성)가 쓰는 값은 탭 조회 응답에 함께 실린다.
- 저장은 **묶음 교체**다. 탭 1개의 요청이 그 터미널 조건 전체를 담고, 서버는 `smltId` + `tmnlId` 범위를 지우고 다시 넣는다. ([결정 로그 D11](../../../../docs/db/07-save-decisions.md))
- 저장 대상은 `smltId` + `tmnlId` 로 격리된 **신규 테이블**이다. CAST 리소스(`TN_PM_SMLT_*_ATRB`)에 직접 쓰지 않는다 — 다른 시뮬레이션과 공유되는 행이기 때문이다. ([결정 로그 D10](../../../../docs/db/07-save-decisions.md))
- **저장한 값은 아직 재조회에 반영되지 않는다.** 조회 쿼리가 신규 테이블을 읽도록 바꾸는 것은 다음 단계다. 저장 자체는 완결되어 있다.
- `tmnlId` 는 `T1` / `T2` 로 주고받는다. 서버 내부의 `P01`(제1여객터미널) / `P02`(탑승동) / `P03`(제2여객터미널) 변환은 **서버가 한 곳에서** 처리한다 — 운항편·여객수는 `T1 = P01 + P02`, 시설(체크인·출국장·검색대)은 `T1 = P01`. ([결정 로그 D1](../../../../docs/db/06-decisions.md))
- 원천 데이터가 아직 없는 필드는 **필드를 빼지 않고 기본값**(숫자 `0` / 문자 `''` / `N`)으로 내려준다. 어느 필드가 여기 해당하는지는 각 절의 표에 표시했다. ([결정 로그 D7](../../../../docs/db/06-decisions.md))

### 6.1 진입 정보 조회

`POST /pm/cast/user-smlt/retrieveUserSmltInfo` — `userSmltService.getInfo(ymd, tmnlId)`

도입 화면에서 터미널을 고른 뒤 호출한다. 저장된 조건이 없으면 기준일자의 표준값으로 새 `smltId` 를 만들어 내려준다.

**Request** `ymd`, `tmnlId`

**Response** `UserSmltInfoDto` — `smltId`, `ymd`, `saveDt`(마지막 저장 `yyyyMMddHHmmss`, 없으면 `''`), `execStatus`(직전 수행 상태, 미수행이면 `''`)

### 6.2 운항편/여객수 탭

**조회** `POST /pm/cast/user-smlt/retrieveFltPsgInfo` — `userSmltService.getFltPsgInfo(smltId, tmnlId)`

**Request** `smltId`, `tmnlId` (`ymd` 생략 시 `smltId` 의 실행일자를 쓴다)

**Response** `UserSmltFltPsgDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `tmnlId` | TmnlId | 조회 조건 반향 |
| `fltCnt` / `psgCnt` | number | 요약: 운항편 / 여객. **여객 = 예약탑승객 − 예약환승객** |
| `peakTime` | string | 요약: 피크 `HHmm` — 여객수가 가장 많은 시간대 |
| `adjType` | `RATIO`\|`HOURLY` | 수정 방식 (전체 비율 / 시간대별). **저장 구조 미확보 — 항상 `RATIO`** |
| `adjRate` | number | 전체 비율 % (`-100`~`100`, 5 단위). **저장 구조 미확보 — 항상 `0`** |
| `fltChart` / `psgChart` | FltPsgChartDto | 운항편 수 / 여객 수 막대 차트 |
| `hourList[].bgnTime` / `endTime` | string | 구간 `HHmm` — **1시간 단위 24행** (`0000`~`2400`) |
| `hourList[].adjRate` | number | 구간 수정 비율 %. **저장 구조 미확보 — 항상 `0`** |
| `hourList[].psgCnt` | number | 구간 승객 수 (명) |

`FltPsgChartDto` — `totCnt`(누적), `maxCnt`(Y축 최댓값), `itemList[].time`(`HH`, 2시간 단위 12개, **`04`시 시작**), `itemList[].cnt`

원천은 `GOOWN.TN_GO_GD_DATA` 이며 유효 운항편 필터 8종(출발편 · 취소/지연사유 제외 · 여객편 · 페리 제외 · 국내선 제외)이 붙는다.

**저장** `POST /pm/cast/user-smlt/saveFltPsgInfo` — `userSmltService.saveFltPsgInfo(request)`

**Request** `UserSmltFltPsgSaveReq`

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `smltId` / `tmnlId` | string | Y | 대상 |
| `adjType` | `RATIO`\|`HOURLY` | Y | 수정 방식. 생략하면 `RATIO` |
| `adjRate` | number | Y | 전체 비율 % (`adjType=RATIO` 일 때 적용). `-100`~`100` 밖이면 실패 |
| `hourList` | `{ bgnTime, endTime, adjRate }[]` | Y | 시간대별 수정값 (`adjType=HOURLY` 일 때 적용). 각 `adjRate` 도 `-100`~`100` |

**Response** `JsonResponse` — 성공이면 `error = false`

저장하는 것은 **조정 비율뿐**이다. 곱해진 편별 여객수를 물리 저장하지 않는다(원본 복원이 불가능해진다). 비율은 CAST 리소스 발행 시점에 운항 스케줄에 곱한다. ([결정 로그 D16](../../../../docs/db/07-save-decisions.md))

- 저장 대상: `TN_PM_SMLT_USER_FLT_PSG`(헤더 1행, **병합**) · `TN_PM_SMLT_USER_FLT_PSG_HR`(24행, **전체 교체**)

### 6.3 체크인 카운터 탭

셀프체크인/백드롭(구 `6.4`)을 흡수했다. **아일랜드 1개분이 아니라 터미널 1개분 전체**를 내려준다 — 첫 화면이 터미널의 모든 아일랜드를 한 블럭 차트에 그리기 때문이다.

**조회** `POST /pm/cast/user-smlt/retrieveChknCounterInfo` — `userSmltService.getChknCounterInfo(smltId, tmnlId, island)`

**Request** `smltId`, `tmnlId` (`island` 은 무시된다 — 항상 터미널 전체를 내려준다. `ymd` 생략 시 `smltId` 의 실행일자를 쓴다)

**Response** `UserSmltChknDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `tmnlId` | TmnlId | 조회 조건 반향 |
| `totCnt` | number | 요약: 전체 카운터 수 (터미널 보유 대수) |
| `peakCounterCnt` | number | 요약: 피크 카운터 — 시간대별 운영 부스 합의 최댓값 |
| `totKioskCnt` / `totBagDropCnt` | number | 하단 셀프 서비스 바의 터미널 합계 |
| `waitMaxCnt` | number | 대기인원 꺾은선 우측 축 최댓값 |
| `islandCdList` | string[] | `+ 추가` 에서 고를 수 있는 아일랜드 문자 (`A`~`N`, `I` 제외) |
| `alnCdList` | string[] | 드로어 칩에 노출할 배정 가능 항공사 코드 |
| `islandList[]` | ChknIslandDto[] | 블럭 차트 항목 — **배정이 있는 아일랜드만** |
| `waitList[]` | WaitPsgDto[] | 시간대별 대기인원 **24개 고정** (`hour` 0~23, `waitPsgCnt` 명) |
| `kpi` | SmltKpiDto | 패널 헤드 결과 지표 4종 |

`ChknIslandDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `island` | string | 아일랜드 문자 |
| `boothCnt` | number | 운영 부스 수 — 블럭 수 = `ceil(boothCnt / 4)` |
| `kioskCnt` / `bagDropCnt` | number | 셀프체크인 키오스크 / 셀프백드롭 대수 (구 `6.4` `deviceCnt`) |
| `oprTimeList[].bgnHour` / `endHour` | number | 아일랜드 운영 시간 구간 (0~24, 복수 가능) |
| `boothList[].boothNo` | number | 아일랜드 안의 부스 번호 |
| `boothList[].alnCd` | string | 배정 항공사 코드 — 미배정이면 `''` |
| `boothList[].customYn` | YnFlag | Custom 배정 여부. **원천 미확보 — 항상 `N`** |

`SmltKpiDto` (체크인 카운터 · 출국장 공용)

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `avgWaitMin` | number | 평균대기 (분) |
| `p95WaitMin` | number | P95대기 (분). **결과 상세 행 분포의 95백분위 근사** |
| `maxQueuePsgCnt` | number | 최대 큐인원 (명) |
| `utilRate` | number | 가동률 % = 운영 시설·시간 합 / (전체 시설 수 × 24) |

> 대기 꺾은선·KPI 는 **직전 시뮬레이션 결과**(`TN_PM_SMLT_RSLT_DTL`)다. 미수행 상태면 `waitList` 24개가 전부 `0`, `kpi` 도 `0` 이다. ([결정 로그 D4·D5·D6](../../../../docs/db/06-decisions.md))

**저장** `POST /pm/cast/user-smlt/saveChknCounterInfo` — `userSmltService.saveChknCounterInfo(request)`

**Request** `UserSmltChknSaveReq`

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `smltId` / `tmnlId` | string | Y | 대상 |
| `islandList[].island` | string | Y | 아일랜드 문자. 비어 있는 행은 버려진다 |
| `islandList[].oprTimeList` | OprTimeDto[] | Y | 아일랜드 운영 시간 구간 (복수 가능) |
| `islandList[].boothList` | `{ boothNo, alnCd, customYn }[]` | Y | 부스 배정. `alnCd` 생략 시 `''`, `customYn` 생략 시 `N` |
| `islandList[].kioskCnt` / `bagDropCnt` | number | Y | 셀프 서비스 대수 (구 `saveSlfchknInfo` 흡수) |

**Response** `JsonResponse`

- 구 `oprCounterIdList`(셀 토글 좌표)는 부스 단위 `boothList` 로 대체됐다.
- `boothCnt` 는 요청에 없다. 서버가 `boothList` 길이로 정한다 — 화면 계산식과 같다.
- **전체 교체**. 저장 대상: `TN_PM_SMLT_USER_CHKN_ISL` · `..._CHKN_OPER_HR` · `..._CHKN_BOOTH`. `DELETE` 범위는 `smltId` + `tmnlId` 이며 다른 터미널을 건드리지 않는다.
- `customYn` 이 실제 저장처를 갖게 됐다 (3단계에서는 항상 `N` 이었다).

### 6.4 셀프체크인/백드롭 탭 — **삭제**

`6.3` 으로 흡수됐다. 아일랜드별 대수는 `6.3` `islandList[].kioskCnt` / `bagDropCnt`, 터미널 합계는 `totKioskCnt` / `totBagDropCnt` 다.
`retrieveSlfchknInfo` / `saveSlfchknInfo` 는 **폐기했다.** 엔드포인트 상수(`endpoints.ts`)와 타입(`api.types.ts`)에서도 제거했다. ([결정 로그 D20](../../../../docs/db/07-save-decisions.md))

> 구 `deviceList[].oprYn` / `deviceList[].oprTimeList`(기기별 운영시간)는 리뉴얼 화면에 대응 요소가 없어 **저장하지 않는다.** 기존 `TN_PM_SMLT_SBD_ATRB` 데이터는 지우지 않고 그대로 둔다 — 아일랜드 운영시간을 따를지 기기별로 유지할지는 현업 확인 대상이다.

### 6.5 출국장 탭

보안 검색대(구 `6.6`)를 흡수했다. **터미널의 모든 출국장 운영계획**을 한 번에 내려준다.

**조회** `POST /pm/cast/user-smlt/retrieveDepInfo` — `userSmltService.getDepInfo(smltId, tmnlId)`

**Request** `smltId`, `tmnlId`

**Response** `UserSmltDepDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `tmnlId` | TmnlId | 조회 조건 반향 |
| `peakScCnt` | number | 요약: 피크 검색대 — 시간대별 검색대 합의 최댓값 |
| `waitMaxCnt` | number | 대기인원 꺾은선 우측 축 최댓값 |
| `depList[]` | DepGateDto[] | 출국장 (T1 6곳 / T2 2곳) |
| `waitList[]` | WaitPsgDto[] | 시간대별 대기인원 24개 — `6.3` 과 동일 |
| `kpi` | SmltKpiDto | 패널 헤드 결과 지표 4종 — `6.3` 과 동일 |

`DepGateDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `depNum` / `depNm` | string | 출국장 번호 / 표시명 |
| `oprYn` | YnFlag | `N` 이면 차트에서 빠지고 미운영 칩으로 내려간다. **현재는 시설 마스터 `USE_YN` 값이다** |
| `scCnt` | number | 검색대 대수 (피크 기준) — 보조 차트 블럭 수 = `ceil(scCnt / 4)` |
| `normalCnt` / `smartPassCnt` | number | 일반 / 스마트패스 검색대 대수. **원천 미확보 — 항상 `0`** |
| `oprTimeList[].bgnHour` / `endHour` | number | 출국장 운영 시간 구간 (0~24) |
| `planList[].planSn` | number | 행 일련번호 (신규 행 `0`) |
| `planList[].bgnHour` / `endHour` | number | 구간 시작 / 종료 — **분 단위가 사라졌다. 시(0~24) 정수다** |
| `planList[].scCnt` | number | 그 구간 검색대 갯수 |

> **`planList` 는 현재 구간 1개만 내려온다.** 검색대 대수를 담은 `..._SCRTY_CNTRL_ATRB.FCLTY_CNT` 에 시간축이 없어, 출국장 운영시간 전체를 덮는 구간 하나로 만든다. 다구간 편집·저장은 신규 테이블이 필요하다 — DDL 초안은 [결정 로그 D2](../../../../docs/db/06-decisions.md).

**저장** `POST /pm/cast/user-smlt/saveDepInfo` — `userSmltService.saveDepInfo(request)`

**Request** `UserSmltDepSaveReq`

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `smltId` / `tmnlId` | string | Y | 대상 |
| `depList[].depNum` | string | Y | 출국장 번호. 비어 있는 행은 버려진다 |
| `depList[].oprYn` | YnFlag | Y | 사용 / 미사용. `Y` 가 아니면 전부 `N` 으로 정규화된다 |
| `depList[].oprTimeList` | OprTimeDto[] | Y | 출국장 운영 시간 구간 (복수 가능) |
| `depList[].scCnt` / `normalCnt` / `smartPassCnt` | number | Y | 보안 / 일반 / 스마트패스 검색대 대수 |
| `depList[].planList` | `{ planSn, bgnHour, endHour, scCnt }[]` | Y | 보안검색대 운영계획. **다구간 저장이 가능해졌다** |

**Response** `JsonResponse`

- 구 `saveScPlanInfo` 를 흡수한다. 저장 대상 테이블이 3개라 **한 트랜잭션**으로 묶는다.
- **전체 교체**. 저장 대상: `TN_PM_SMLT_USER_DEP` · `..._DEP_OPER_HR` · `TN_PM_SMLT_SC_PLAN`. `DELETE` 범위는 `smltId` + `tmnlId`.
- `planSn` 은 요청값을 쓰지 않는다. 전체 교체이므로 서버가 목록 순서대로 1부터 다시 부여한다 (신규 행 `0` 을 그대로 쓸 수 없기 때문이다).
- `oprYn` 은 마스터 `TN_PM_SMLT_PSG_FCLT.USE_YN` 이 아니라 **시뮬레이션 단위 값**으로 따로 저장된다. 조회는 아직 마스터 값을 내려준다 (6.5 조회 표 참고).
- `normalCnt` / `smartPassCnt` / `planList` 다구간이 실제 저장처를 갖게 됐다 (3단계에서는 각각 `0` / 구간 1개였다).

### 6.6 보안 검색대 탭 — **삭제**

`6.5` 로 흡수됐다. 구간표는 `6.5` `depList[].planList`, 대수는 `depList[].scCnt` 다.
`retrieveScPlanInfo` / `saveScPlanInfo` 는 **폐기했다.** 엔드포인트 상수(`endpoints.ts`)와 타입(`api.types.ts`)에서도 제거했다. ([결정 로그 D20](../../../../docs/db/07-save-decisions.md))

### 6.7 지도 보기

`POST /pm/cast/user-smlt/retrieveFcltMap` — `userSmltService.getFcltMap(smltId, tmnlId, fcltType, island?)`

요약 바 우측 지도 보기 버튼 (체크인 카운터 / 셀프체크인·백드롭 / 출국장 탭 공용).

**Request** `smltId`, `tmnlId`, `fcltType`, `island`(아일랜드 단위 시설이 아니면 생략)

**Response** `UserSmltFcltMapDto` — `tmnlId`, `fcltType`, `island`, `markerList`(`MapMarkerDto[]`, 5.1 과 동일)

### 6.8 시뮬레이션 실행

`POST /pm/cast/user-smlt/executeUserSmlt` — `userSmltService.execute(smltId, tmnlId)`

저장된 조건으로 수행을 건다. 비동기로 시작만 하고 진행 상황은 모니터링 화면에서 확인한다.

**Request** `smltId`, `tmnlId`

**Response** `UserSmltExecDto`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `smltId` | string | 수행 대상 |
| `execSn` | number | 수행 일련번호 (`smltId` 안에서 1부터) |
| `execStatus` | SmltExecStatus | 시작 직후이므로 항상 `RUNNING` |
| `bgnDt` | string | 수행 시작일시 `yyyyMMddHHmmss` |

**동작 순서**

1. `smltId` + `tmnlId` 로 저장된 조건 존재 확인 — 없으면 `error = true`, `errorMessage = "저장된 조건이 없습니다. 조건을 먼저 저장해주세요."`
2. 수행 이력 행 생성 (`TH_PM_SMLT_EXCN_HSTRY`, 상태 `RUNNING`)
3. CAST 리소스 발행
4. 수행 시작 트리거
5. `execSn` / `execStatus` / `bgnDt` 반환

**동기적으로 완료를 기다리지 않는다.** 진행 상황은 `7.1` / `7.2` 가 폴링한다. 이력 행은 `TH_PM_SMLT_EXCN_HSTRY` 에 남고, 모니터링 화면(`retrieveSmltExecList`)이 읽어야 할 곳도 여기다. ([결정 로그 D17](../../../../docs/db/07-save-decisions.md))

> **3·4 단계는 아직 비어 있다.** CAST 연동에 필요한 `aoms.pm.cmmn.dto.*` 소스가 없어(2단계 G8) 호출 지점과 순서만 확보한 상태다. 따라서 지금은 **이력만 남고 실제 수행은 걸리지 않으며 상태가 `RUNNING` 에서 넘어가지 않는다.** 미확인 지점 목록은 [결정 로그 D19](../../../../docs/db/07-save-decisions.md).

---

## 7. 시뮬레이션 모니터링

조회 기간은 화면의 시작/종료 일시를 합쳐 `yyyyMMddHHmm` 으로 넘긴다.

> **원천은 `PMOWN.TH_PM_SMLT_EXCN_HSTRY` 다.** `executeUserSmlt` 가 쓰는 이력 테이블과 같은 곳이다.
> 매퍼 statement(`CastSmltMapper.retrieveSmltExcnList`)는 4단계에서 만들어 두었으나 **컨트롤러·서비스는 아직 없다** — 이 장의 3개 API 는 미구현이다.
> `deptNm` / `userNm` 은 사용자 테이블이 확인되지 않아(2단계 G1) 현재 `''` 로 내려간다. 조인 키가 될 등록자 ID 는 함께 실린다.

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
2. 활성 탭의 `retrieve*` 호출 (탭 전환 시 그 탭만, **탭당 1회**)
   - 운항편/여객수 → `retrieveFltPsgInfo`
   - 체크인 카운터 → `retrieveChknCounterInfo` (셀프 서비스 값 포함)
   - 출국장 → `retrieveDepInfo` (보안검색대 값 포함)
   - 드로어를 열 때는 **재조회하지 않는다.** 2에서 받은 아일랜드/출국장 객체를 그대로 쓴다
3. `현재상태 저장` → 해당 탭 `save*`
4. `시뮬레이션 실행` → `executeUserSmlt`

**시뮬레이션 모니터링**

1. `retrieveSmltExecSmry(bgnDt, endDt)` + `retrieveSmltExecList(bgnDt, endDt)`
2. `결과 보기` → `retrieveSmltExecDetail(smltId)`
