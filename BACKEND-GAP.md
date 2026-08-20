# 프론트 사용 / 백엔드 미구현 데이터 컬럼 대조표

`react/src/types/api.types.ts` 의 전 인터페이스를 `java/cast/dto/*.java` ·
`java/cast/service/impl/*.java` · `java/mapper/*.xml` 과 대조한 결과다.
**화면은 값을 읽는데 서버는 그 값을 내려주지 않는 지점**을 5개 유형으로 나눠 적었다.

대부분은 백엔드가 `(D7)` `(G1)` `(G7)` `(G8)` `(D19)` 결정 로그 주석으로 사유를 남겨 둔
**원천 미확보에 따른 의도적 보류**다. 유형 ① 만 성격이 다르다 — 응답에 키 자체가 없다.

> `java/` 는 참조 사본이라 실제 백엔드 레포와 줄 번호가 다를 수 있다.
> 그래서 모든 참조에 **메서드명을 병기**했다. 줄 번호가 안 맞으면 메서드명으로 찾을 것.

---

## 유형 ① DTO 필드 자체가 없음 — 응답에 키가 안 실린다

전수 diff 결과 **이 유형은 1건뿐**이다. 나머지 인터페이스는 필드 구성이 일치한다.

### `TmnlSmryDto.cgnStatus`

| | |
|---|---|
| **프론트 정의** | `react/src/types/api.types.ts:130` |
| **프론트 사용** | `dashboard/view.ts:139` (`toTerminalView`) → `dashboard/types.ts:115` → `dashboard/components/TerminalSummary.tsx:66` |
| **백엔드** | `java/cast/dto/TmnlSmryDto.java` — **필드가 없다** |
| **증상** | 응답에 키가 없어 `undefined` → `CONGESTION_THEMES[undefined]` 가 `undefined` → 다음 줄 `theme.panelClass` 에서 **TypeError. 요약보기 터미널 패널이 통째로 렌더링 실패** |

다른 화면의 `cgnStatus` 는 전부 `CongestionStatus.ofWtngPsgCnt(대기인원)` 으로 계산해 채운다.

- `CastMapServiceImpl.java:328` `getChknRsltList` / `:346` `getDepRsltList` / `:404` `getNotice`
- `CastChknCounterServiceImpl.java:365` `getChknRsltList` / `:429` `getNotice`
- `CastDepHallServiceImpl.java:292` `toUnitRslt` / `:345` `getNotice`
- `CastDsbdServiceImpl.java:455` `getUnitList` / `:488` `getFcltCard`

**터미널 요약(`retrieveDailySmltTmnlSmry`)만 빠졌다.** 헬퍼가 이미 있으므로 난이도는 낮다.

---

## 유형 ② 필드는 있으나 항상 기본값 — 원천 미확보 / 로직 미정의

값이 `0` · `''` · `null` 로 고정돼 내려온다. 크래시는 안 나지만 화면이 계속 빈 값을 그린다.

| 필드 | 백엔드 현재 상태 | 프론트 사용 지점 · 증상 |
|---|---|---|
| `TmnlSmryDto.brdgRate` | 항상 `0` — 탑승률 원천 컬럼 미확인 (`CastDsbdServiceImpl.java:169` `retrieveDailySmltTmnlSmry`, D7) | `dashboard/view.ts:143` — 탑승률이 항상 "0" |
| `DowAttrDto.spclNote` | 항상 `''` — 공휴일 달력 테이블 미확인 (`CastDsbdServiceImpl.java:297-298` `getDowAttr`) | `HeaderInfoCards.tsx:156`. CLAUDE.md §3-8 의 `SPECIAL_NOTES` 한글 리터럴 `===` 비교가 **영원히 매칭 실패** |
| `DsbdRsltDto.lastWeekWtngPsgCnt` | 항상 `0` — 지난주 비교선 원천 미확인 (`CastDsbdServiceImpl.java:387` `toRsltDto`) | 프론트도 아직 미사용. 차트 비교선 자체가 미구현 |
| `DsbdFcltCardDto.fcltDesc` | 항상 `''` — 카드 부제(예: 좌측 B4~B8)를 만들 배치 정보 없음 (`CastDsbdServiceImpl.java:478-479` `getFcltCard`, D7) | `dashboard/view.ts:72` — `numSmall` 이 항상 숨겨짐 |
| `DsbdFcltCardDto.cgnClearRate` · `cgnClearTime` | `cgnClearRate` 는 항상 `0`, `cgnClearTime` 은 **조회 기준시각을 그대로 되돌려준다** — 혼잡해소 예측 API 없음 (`CastDsbdServiceImpl.java:485-487` `getFcltCard`, D7) | `dashboard/view.ts:85-89` — 혼잡해소 게이지 항상 0%, "이후" 시각이 현재 시각 |
| `FcltRecommendDto.targetNm` · `addCnt` · `needAssignYn` | `''` / `0` / `'N'` 고정 — 추천 로직(어디에 몇 개를 더 열 것인가) 미정의 (`CastDsbdServiceImpl.java:496` `getEmptyRecommend`, D7) | `dashboard/view.ts:90-96` — 추천 칩 이름이 비고, `countNote` 가 항상 '소요' |
| `MapSalesDto` **6필드 전부**<br>`totAmt` `storeCnt` `amtPerPsg` `psgDiffCnt` `diffRate` `cmprYear` | `new MapSalesDto()` **빈 객체를 그대로 내려준다** — 상업시설 매출 원천 미확인 (`CastMapServiceImpl.java:260-261` `getChknInfoList`, D7) | `terminalMap/view.ts:183-189` — 아일랜드 상세 팝업 매출 전부 0.<br>**`cmprYear` 는 `null` 인데 TS 타입은 `string`** |
| `ChknBoothDto.customYn` | 항상 `'N'` (`CastChknServiceImpl.java:202` `normalizeBoothList`, `:323` `toBoothList`) | `userSmlt/tabs/checkinCounter/view.ts:78` — Custom 배정 표기가 나올 수 없음 |
| `DepGateDto.normalCnt` · `smartPassCnt` | 항상 `0` — 일반/스마트패스 검색대 구분 원천 미확보 (`CastDepServiceImpl.java`) | `userSmlt/tabs/departure/view.ts:46-47,120-121`, `DepartureTab.tsx:436-442` — 두 칸 모두 0 |
| `UserSmltFltPsgDto.adjType` · `adjRate`,<br>`FltPsgHourDto.adjRate` | `adjType` 항상 `RATIO`, `adjRate` 항상 `0` — 저장 구조 미확보 (`CastFltPsgServiceImpl.java:82` `retrieveFltPsgInfo`) | `flightPax/view.ts:14,19,53-63,89` — **HOURLY 로 저장해도 재조회하면 RATIO/0 으로 되돌아온다** |
| `SmltCastExecDto.deptNm` · `userNm`,<br>`SmltExecDetailDto.deptNm` · `userNm` | 항상 `''` — 사용자 테이블 미확인 (`CastMntrServiceImpl.java:39` 클래스 주석, `:105` `retrieveSmltExecDetail`, `:122` `toExecDto`, G1) | `monitoring/view.ts:65-66` — 부서·성명 열이 계속 공백 |
| `DsbdBaseInfoDto.nextCalcDt` | 실제 재계산 주기가 아니라 **마지막 계산시각의 다음 정시** 추정값 (`CastDsbdServiceImpl.java:508-516` `getNextCalcDt`) | `Dashboard.tsx:151` — 값은 나오지만 신뢰할 수 없음 |

---

## 유형 ③ DB가 아니라 Java 상수에서 나오는 값

응답에 값은 실린다. 다만 출처가 DB가 아니라 코드라 **기준정보를 고쳐도 반영되지 않는다.**

| 대상 | 현재 출처 | 영향 |
|---|---|---|
| `MapMarkerDto.cdntX` · `cdntY` (전 화면) | `cast/domains/MapLayout.java` · `DepHallLayout.java` · `FcltMapLayout.java` 하드코딩 — 좌표 테이블 미확인 (G1) | 맵형태보기 · 출국장 · 시설물매핑 · 사용자시뮬 지도보기 **4화면**. 프론트 배치 상수와 값이 어긋나면 마커가 도면 위에서 밀린다 |
| `MapChknInfoDto.fcltCd` | `tmnlId + "-3RD-" + island + "01-01"` **문자열 조립** (`CastMapServiceImpl.java:258` `getChknInfoList`) | 아일랜드 상세 팝업. 실제 시설코드와 일치한다는 보장이 없음 |
| `MapChknInfoDto.fcltList` | 체크인카운터 / 셀프체크인 / 상업시설 **3개 고정** (`CastMapServiceImpl.java:270-279` `getIslandFcltList`) | 아일랜드 상세 팝업. 시설물 매핑 결과와 무관하게 항상 같은 3줄 |
| `CongestionStatus` 임계값 | `80 / 220 / 420` 하드코딩 (`cast/enums/CongestionStatus.java:16-18`). 정식 기준표 `PMOWN.TN_PM_PSG_PRCS_GRD` (`FCLT_GROUP_CD` 별 `MIN_VL`/`MAX_VL`) 미연결 — 대응 DTO `cast/dto/PsgPrcsGrd.java` 는 **정의만 되고 참조 0회 (dead code)** | 혼잡도를 쓰는 전 화면. 시설 종류와 무관하게 같은 경계값을 쓴다 |
| `DowAttrDto.dowType = 'HOLIDAY'` | 공휴일 달력 테이블 미확인이라 **절대 반환되지 않는다** (`cast/enums/DowType.java:10`) | 요일 속성 카드. 프론트 유니온에는 `'HOLIDAY'` 가 살아 있음 |
| `ScPlanDto` / `planList` | 저장 이력이 없으면 운영시간 전체를 덮는 **구간 1개**만 만들고 `planSn` 은 상수 `FIRST_PLAN_SN` (`CastDepServiceImpl.java:288-301` `toPlanList`, G7) | 사용자시뮬 출국장 탭. 시간대별 분할은 사용자가 격자에서 저장한 뒤부터 생긴다 |

---

## 유형 ④ API 자체가 스텁

| 엔드포인트 | 상태 |
|---|---|
| `USER_SMLT_EXECUTE`<br>`/pm/cast/user-smlt/executeUserSmlt` | 수행 이력 행만 INSERT 하고 **CAST 엔진 리소스 발행 · 수행 시작 트리거는 걸지 않는다** (`CastUserSmltServiceImpl.java:133` `executeUserSmlt` — "3~4. … 연동 DTO 부재로 보류 (G8 / D19)"). 응답 `execStatus` 는 항상 `RUNNING` 이고 실제로 도는 시뮬레이션은 없다 → **모니터링 화면에서 영원히 진행중** |
| 사용자 시뮬레이션 신규 채번 | `TN_PM_SMLT_STNG` 신규 채번 보류 (`CastUserSmltServiceImpl.java:73` `retrieveUserSmltInfo`, D19). 그날 사용자 시뮬이 없으면 **일일 시뮬레이션 ID를 편집 대상으로 잡는다**(`:69-75`) — 사용자가 일일 시뮬 조건을 덮어쓸 위험 |

---

## 유형 ⑤ 요청 필드명 불일치 / 한쪽만 쓰는 필드

| 항목 | 내용 |
|---|---|
| `UserSmltFltPsgSaveDto.adjTypeCd` | `adjType` 의 문자열 값을 서비스가 채우는 파생 필드인데 **getter 호출처가 어디에도 없다** (매퍼 XML 포함). `adjType` 이 실제 저장에 반영되는지 확인 필요 — 유형 ② 의 `adjType` 항상 RATIO 와 같은 뿌리일 가능성 |
| 저장 DTO 3종의 `fcltTmnlId` | `UserSmltFltPsgSaveDto` · `UserSmltChknSaveDto` · `UserSmltDepSaveDto` 가 갖는 DB 터미널 코드(P01/P03). **서비스가 채우는 내부 필드**라 프론트가 보내면 안 된다 — 현재 TS 타입에 없으므로 정상. 그대로 유지할 것 |
| `SmltCastExecDto.rgtrId` | Java 에만 있고 TS 타입에 없다. 부서·성명(유형 ②)을 살릴 때 **사용자 테이블 조인 키**가 되므로 그때 함께 추가해야 한다 |
| `FcltMapItemDto.sortSeq` | 백엔드는 정상 조회하는데(`java/mapper/CastFcltMapper.xml:35`) 프론트가 안 쓴다 — 반대 방향의 미사용 |

---

## 우선순위

1. **즉시** — `TmnlSmryDto.cgnStatus` (유형 ①). 유일한 크래시 유발 건이고, 계산 헬퍼
   `CongestionStatus.ofWtngPsgCnt()` 가 이미 있어 필드 추가 + 세터 한 줄이면 된다
2. **높음** — `MapSalesDto.cmprYear` 가 `null` 인데 TS 는 `string` (타입이 거짓말을 하고 있다),
   `USER_SMLT_EXECUTE` 스텁 (사용자 시뮬레이션 기능 자체가 동작하지 않는다)
3. **중간** — 원천만 확보되면 채울 수 있는 유형 ② 항목들
   (탑승률 · 공휴일 · 부서/성명 · 추천 조치 · 혼잡해소 예측)
4. **낮음** — 좌표·기준표의 DB 이관 (유형 ③).
   지금 값이 프론트 배치 상수와 일치하는 한 화면은 정상 동작한다
