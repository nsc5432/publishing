# AGENTS.md — PM 예측관리 프로젝트 가이드

인천국제공항 통합정보시스템 **PM(예측관리)** 화면. 여객 혼잡도를 시뮬레이션하고 그 결과를 보여준다.

- `react/` — 화면 (Vite + React 19 + TypeScript). **이 레포에서 실제로 빌드하는 대상**
- `java/` — 백엔드 **참조 사본**. 빌드 파일(pom/gradle)이 없고 디렉터리(`java/cast/…`)가
  패키지(`aoms.pm.cast…`)와 맞지 않는다. **여기서 컴파일할 수 없다** — 읽기·대조용
- `svgFromDesigner/` — 디자이너 원본 SVG

## Git 커밋·푸시 승인 범위

- 사용자가 이 프로젝트의 커밋·푸시를 요청하면, 요청 범위의 변경사항을
  `https://github.com/nsc5432/publishing.git`의 `main` 브랜치에 일반 푸시하는 것을 승인한 것으로 본다.
- 푸시 전에 `origin`이 위 URL인지 확인하고, 같으면 목적지 승인을 다시 묻지 않는다.
- 이 승인은 강제 푸시·브랜치 삭제·다른 원격으로의 전송을 포함하지 않으며, 앱의 승인 정책을 대체하지 않는다.

---

## 1. 화면과 라우트

| 화면 | 라우트 | 폴더 |
|---|---|---|
| 요약보기(대시보드) | `/rui/pm`, `/rui/pm/daily-smlt/dashboard` | `modules/pm/pages/castSmry/dashboard` |
| 맵형태보기 | `/rui/pm/daily-smlt/terminalMap` | `modules/pm/pages/castSmry/terminalMap` |
| 체크인카운터 | `/rui/pm/daily-smlt/checkinCounter` | `modules/pm/pages/castSmry/checkinCounter` |
| 출국장 | `/rui/pm/daily-smlt/departureHall` | `modules/pm/pages/castSmry/departureHall` |
| 사용자 시뮬레이션 조건설정 | `/rui/pm/user-smlt/config` | `modules/pm/pages/userSmlt` |
| 시뮬레이션 모니터링 | `/rui/pm/smlt-monitoring` | `modules/pm/pages/monitoring` |
| 시설물 매핑 | `/rui/pm/fclt-map` | `modules/pm/pages/facilityMap` |
| Cast 설정 | `/rui/pm/cast-config` | `modules/pm/pages/castConfig` |

앱 base 는 `/rui/`. 라우팅·프리로드는 `src/App.tsx`.
화면 접근은 롤로 갈린다 — §12.

---

## 2. 도메인 약어 사전

DTO·필드·폴더 이름에 그대로 쓰인다. **이 약어들은 표준이라 바꾸지 않는다.**

| 약어 | 뜻 | 약어 | 뜻 |
|---|---|---|---|
| `psg` | 여객 | `cgn` | 혼잡 |
| `flt` | 운항(편) | `wtng` | 대기 |
| `fclt` | 시설 | `prcs` | 처리 |
| `smlt` | 시뮬레이션 | `opr` | 운영 |
| `chkn` | 체크인카운터 | `bgn` | 시작 |
| `slfchkn` | 셀프체크인/백드롭 | `dow` | 요일 |
| `dep` | 출국장 | `aln` | 항공사(정렬) |
| `sc` | 보안검색대 | `cdnt` | 좌표 |
| `cmrc` | 상업시설 | `hrly` | 시간당 |
| `tmnl` | 터미널 | `fcst` | 예측 |
| `dsbd` | 대시보드(요약보기) | `brdg` | 탑승 |
| `mntr` | 모니터링 | `spcl` | 특이(사항) |
| `smry` | 요약 | `adj` | 조정 |
| `rslt` | 결과 | `cmpr` | 비교 |
| `stng` | 설정 | `excn` | 실행 |
| `Yn` | Y/N 플래그 | `Sn` | 일련번호 |
| `Cd` | 코드 | `Nm` | 명칭 |
| `Dt` | 일시 | `Ymd` | 일자(yyyyMMdd) |

시각 표기: `ymd` = `yyyyMMdd`, `hhmm` = `HHmm`, `*Dt` = `yyyyMMddHHmmss`.

---

## 3. ⚠ 절대 바꾸면 안 되는 것

리네임·리팩토링할 때 아래는 **값·이름 모두 그대로 둔다.**

1. **API DTO 필드명** — `src/types/api.types.ts` 에 정의된 모든 인터페이스 필드
   (`psgCnt`, `smltId`, `wtngPsgCnt`, `fcltTmnlId`, `oprBgnTime`, `planSn` …)
   - 예외 1건: `FcltRecommendDto.addCnt` → `reqCnt` (2026-08-28 결정). 값이 "추가 수량" 이
     아니라 "총 소요 수량" 이라 이름이 반대 의미였고, 같은 카드의 `totCnt`(보유 대수) 와
     헷갈리지 않는 이름을 골랐다. **`reqCnt` 는 이제 다시 고정이다.**
     2026-10-17 에 타입만 `number` → `number | null`(Java `int` → `Integer`)로 바꿨다. 카드가 혼잡해소 팝업과
     같은 계산(§14)을 쓰면서 산정 불가를 `null` 로 내려 화면이 `-` 로 그린다. 이름은 그대로다.
   - `CastConfigPreProcessDiffDto` · `CastConfigPreProcessRowDto` 는 2026-09-04 에 삭제됐다.
     전처리 비교·반영 화면이 운영 반영으로 흡수되면서 조회 API 자체가 없어졌다.
   - `CastConfigAplySetDetailDto.groupId` 와 그 원천 컬럼 `TH_PM_SMLT_ATRB_APLY_HSTRY.GROUP_ID`
     는 2026-09-09 에 삭제됐다. 세트 이력 상세를 화면이 그리지 않아 읽는 곳이 없었다.
   - `MapChknRsltDto` 에 `avgQueuePsgCnt` · `maxQueuePsgCnt` · `oprBoothCnt` · `reqCnt` ·
     `cgnClearMin`, `MapNoticeItemDto` 에 `reqCnt` · `cgnClearMin` 이 2026-09-04 에 늘었다
     (체크인 공용 Queue — §13). **새 이름도 이제 고정이다.**
   - 2026-10-11 사용자 현재상태 요청은 `ymd + tmnlId`로 변경하고 편집용 `smltId`를 제거했다.
     실행 요청에 `fltPsgList`·`chknList`·`depList`를 추가하고 `smltFlfmtSn`은 제거했다.
     실행·공개 조건·결과의 `smltId`는 유지한다. 새 계약도 고정이며 상세는 §11과 API 문서를 따른다.
   - 2026-10-24 혼잡등급 대기시간 전환(§13·§14)으로 `cgnStatus` 를 `CongestionStatus | null` 로 넓혔다
     (`TmnlSmryDto` · `FcltUnitDto` · `DsbdFcltCardDto` · `MapUnitRsltDto` · `MapNoticeDto` · `FcltQueueScenarioDto`).
     null 은 산정 불가다. 새 필드 `cgnWtngSec`(카드 · 맵 결과 · 알림 항목), `FcltQueueScenarioDto` 의
     `normalUpperExclusiveSec` · `wtngAvgSec` · `wtngAvgPrcsPsgCnt` · `wtngAvgMetric`, `FcltQueueClearDto` 의
     `fcstWtngSec` · `fcstDt` · `fcstWtngMetric` 을 더했다. `targetQueueCnt` 는 명 단위 계약 그대로 두고 `null` 로 내린다.
     `PsgPrcsGradeRawDto.minVl` · `maxVl` 은 `BigDecimal` → `int`(분). **새 이름도 이제 고정이다.**
   - `UserSmltDepItemDto.planList` 와 `ScPlanDto`, 그 원천 `TN_PM_SMLT_SCSH_OPER_PLAN` 은 2026-10-12 에
     삭제됐다. CAST SC 리소스에 시각이 없어 시간별 계획이 도달하지 않았다. 보안검색대는 출국장별
     `scshCntom` 하나가 최종 수량이다 (`docs/plans/2026-10-11-user-smlt-cast-insert-review.md` §3-2).
2. **enum 문자열 값**
   `'T1'|'T2'` · `'Y'|'N'` · `'FREE'|'NORMAL'|'BUSY'|'VERY_BUSY'` ·
   `'CHKN'|'SLFCHKN'|'DEP'|'SC'|'CMRC'` · `'PSG'|'FLT'` · `'DAILY'|'USER'` ·
   `'RATIO'` · `'DONE'|'RUNNING'` · `'WEEKDAY'|'PRE_WEEKEND'|'WEEKEND'|'HOLIDAY'`
3. **모든 `className` 문자열** — CSS 와 1:1로 묶여 있다
4. **CSS 커스텀 프로퍼티** — `--i1`~`--i6`, `--gut`, `--col`, `--rgt`, `--x`, `--y`,
   `--stage-ar`, `--oper-cols`, `--pm-header-h`, `--line-wait`, `--val`, `--slots`
5. **DOM id** — `term-T1`, `term-T2`, `timeRange`, `baseDate`, `popupIslandTitle` …
6. **뷰모델의 CSS 결합 값** — `StatIcon`(`wait-people`…), `NoticeLevel`(`easy|normal|busy|severe`),
   `CongestionLevel`(`normal|busy|crowded`), `BlockColor`(`i1`~`i6`), `IconName`(`data-ic` 속성으로 나간다)
7. **ECharts / Recharts 옵션 키** — `renderItem`, `splitLine`, `markPoint`, `dataKey` …
8. **서버 값과 문자열 비교하는 한글 리터럴**
   - `HeaderSummary.tsx` 의 `SPECIAL_NOTES` (`spclNote` 와 `===` 비교)
   - `TerminalChart.tsx` 의 시리즈명 `'예측'` / `'실적'` (툴팁 필터가 이름으로 거른다)

> 반대로 **자체 뷰모델 필드 · 지역변수 · 헬퍼 함수명은 자유롭게 고쳐도 된다.**
> 판단 기준: `api.types.ts` 에 있으면 DTO(고정), `pages/*/types.ts` 에 있으면 뷰모델(변경 가능).

---

## 4. 폴더 구조

```
react/src/
  api/pm/
    client.ts        axios 인스턴스 + 인터셉터(로딩바 · 에러 정규화)
    endpoints.ts     API_ENDPOINTS (38개)
    result.ts        unwrap() — 본문 error 플래그를 catch 경로로 던진다
    services/*.service.ts   도메인별 서비스 객체 (목업/실통신 분기도 여기서)
    mock/            USE_MOCK 토글 + 화면별 목업 데이터
  components/
    charts/EChart.tsx        ECharts 래퍼
    icons/index.tsx          SVGR 배럴 (<SearchIcon /> 형태, 55개)
    icons/InlineIcon.tsx     인라인 SVG 레지스트리 (<Icon name="search" /> 형태)
    lnb/                     좌측 네비게이션 (배럴 있음)
    ui/                      kebab-case: alert-dialog, dialog, dialog-provider,
                             loading-bar, pill-select, time-range-selector
  config/env.ts      ENV (import.meta.env 래핑)
  hooks/             usePageScope, useUserInfo, useBaseInfo, useErrorAlert, useFetched
  lib/               chart, dialog, echarts, format, loading-bar, time-range
  modules/pm/
    hooks/useTimeline.ts     타임라인 (맵형태보기 · 출국장 공용)
    types/map.types.ts       도면 공용 타입 (마커 · 혼잡 알림 · 터미널)
    pages/castSmry/<요약화면>/
      types.ts       뷰모델 타입 + 라벨 맵
      view.ts        DTO → 뷰모델 매퍼 + EMPTY_* 기본값
      hooks/         화면 전용 조회 훅
      <Page>.tsx     화면 루트
      components/    화면 전용 컴포넌트
      <화면>.css
    pages/<기타화면>/
      types.ts       뷰모델 타입 + 라벨 맵
      view.ts        DTO → 뷰모델 매퍼 + EMPTY_* 기본값
      hooks/         화면 전용 조회 훅
      <Page>.tsx     화면 루트
      components/    화면 전용 컴포넌트
      <화면>.css
  types/api.types.ts  서버 DTO 전체 (여기가 유일한 원본)
```

**페이지 아키텍처**: `types.ts → view.ts → hooks/use*Data.ts → <Page>.tsx → components/*`
DTO→화면 변환은 전부 `view.ts` 에 모은다. 컴포넌트가 직접 `toLocaleString` 을 부르기 시작하면
같은 값이 화면마다 다르게 보인다.

---

## 5. 네이밍 / 스타일 규칙

- 컴포넌트 파일·함수: PascalCase. **단 `components/ui` 만 kebab-case 파일명**
- 훅: `useX.ts` · 서비스: `*.service.ts` · 목업: `*.mock.ts` · 타입: `*.types.ts`
- **named export 기본** (default export 는 페이지 루트와 `api/pm/client.ts` 뿐)
- 배럴(`index.ts`)은 `components/lnb`, `api/pm/mock` 만
- import 경로: **레이어를 넘으면 `@/`, 같은 기능 안이면 상대경로**
- Prettier: 4칸 들여쓰기 · 작은따옴표 · 100칸 · trailing comma · 세미콜론
- 타입 전용 import 는 `import type` (verbatimModuleSyntax 가 켜져 있어 필수)
- Java 문자열의 빈 값 검사는 `isEmpty()`를 사용한다. `trim().isEmpty()`처럼 두 메서드를 함께 사용하지 않는다.
- Java 예외 처리는 PMD `AvoidCatchingGenericException`을 따른다. 발생 가능한 구체적인 예외 타입만 `catch`하고,
  `Exception`·`RuntimeException`·`Throwable`·`NullPointerException`을 포괄 처리용으로 잡지 않는다.
  null은 사전에 검사하고 예상하지 못한 예외는 상위로 전파한다.
- **새로 작성하는 주석은 필요한 경우에만 단다.** 코드가 무엇을 하는지 설명하는 주석(변수·함수명으로 이미 드러나는 내용),
  작업 이력·호출자 설명("~때문에 추가", "~에서 사용")은 달지 않는다. 없어도 읽는 사람이 헷갈리지
  않으면 주석을 달지 않는다. 예외적으로 남길 만한 것은 코드만 봐서는 알 수 없는 이유
  (숨은 제약, 특정 버그의 우회, 서버 쪽 비정상 동작에 대한 대응)뿐이고 그마저도 한 줄로 짧게.
  함수 위 요약 doc 주석(`/** ... */`)도 같은 기준 — 코드를 읽으면 알 수 있는 동작 설명은 쓰지 않는다.
- **기존 주석은 임의로 삭제하거나 정리하지 않는다.** 주석의 필요 여부는 사용자가 검토하고 결정한다.
  파일을 수정하더라도 기존 주석은 보존하며, 사용자가 명시적으로 요청한 경우에만 삭제하거나 정리한다.
  위 주석 작성 기준은 새로 추가하는 주석에만 적용하며, 기존 주석을 삭제하는 근거로 삼지 않는다.

### 파일 내 배치 순서

```
imports
→ 모듈 doc 주석
→ 타입 / 인터페이스 (props 포함)
→ 모듈 상수
→ 순수 헬퍼 함수
→ 메인 export
→ 서브 컴포넌트
→ default export
```

- 컴포넌트 안: `state → 파생값(useMemo) → callback → effect → handler → JSX`
- `view.ts`: `타입 → 상수 맵 → to*() 매퍼(호출 순서대로) → EMPTY_* (맨 아래)`
- 기준 파일: `pages/castSmry/departureHall/components/Header.tsx`

---

## 6. 공용 유틸 — 새로 만들기 전에 여기부터 확인

| 필요한 것 | 쓸 것 |
|---|---|
| 서버 조회 + 늦은 응답 버리기 | `@/hooks/useFetched` (`useFetched`, `Fetched<T>`, `EMPTY_FETCHED`) |
| 조회 실패 알럿 | `@/hooks/useErrorAlert` |
| 기준정보(smltId·계산시각) 조회 | `@/hooks/useBaseInfo` |
| 날짜·숫자 표기 | `@/lib/format` (`formatYmd`, `formatHhmm`, `formatMinutes`, `formatCount`, `formatDiff`, `pad2`, `dowLabel`, `todayYmd`) |
| 운영시간 구간 | `@/lib/time-range` (`TimeRange`, `formatHour`, `toHourList`, `isHourInRanges`, `totalHours`, `formatRanges`) |
| 차트 공통 | `@/lib/chart` (`AXIS_LABEL`, `TOOLTIP_TEXT_STYLE`, `toTooltipItems`, `toStagePosition`, `CHART_FONT_FAMILY`) |
| 타임라인 | `@/modules/pm/hooks/useTimeline` (화면은 `TIMELINE_RANGE` 만 정의) |
| 도면 마커·혼잡알림 타입 | `@/modules/pm/types/map.types` |
| 확인/알림 다이얼로그 | `@/lib/dialog` (`dialog.alert`, `dialog.confirm`) |

---

## 7. 빌드 · 실행 · 검증

```bash
cd react
npm run dev        # 개발 서버
npx tsc -b         # 타입체크 (빌드 산출물 없이)
npx eslint .       # lint
npm run verify:user-smlt # 목업 저장 분리·자동 저장·불변 실행 시나리오
npm run build      # tsc -b + vite build (dev 모드)
npm run build:prd  # 운영 빌드
```

- **테스트 러너 없음.** 검증은 `tsc -b` + `eslint` + 화면 육안 확인
- `tsc` 설정이 `strict` + `noUnusedLocals` + `noUnusedParameters` + `verbatimModuleSyntax` 라
  **리네임 실수는 대부분 `npx tsc -b` 가 잡아 준다.** 리팩토링 후 반드시 돌릴 것
- 목업 토글: `.env` 의 `VITE_ENABLE_MOCK` (`true` = 목업, `false` = 실통신)
- dev 프록시: `/pm` → `http://localhost:8080` (`vite.config.ts`)
- 경로 별칭: `@/` → `react/src/` (vite.config.ts + tsconfig.app.json 양쪽에 선언)

---

## 8. API 엔드포인트

전부 `POST`. prefix `/pm/cast`. 원본은 `src/api/pm/endpoints.ts`.

| 화면 | 상수 | 경로 |
|---|---|---|
| 공통 | `USER_INFO_BY_SESSION` | `/user/retrieveUserInfoBySession` |
| 요약보기 | `DSBD_BASE_INFO` | `/smry/retrieveDailySmltBaseInfo` |
| 〃 | `DSBD_HEADER` | `/smry/retrieveDailySmltHeader` |
| 〃 | `DSBD_TMNL_SMRY` | `/smry/retrieveDailySmltTmnlSmry` |
| 〃 | `DSBD_TMNL_RSLT` | `/smry/retrieveDailySmltTmnlRsltByTime` |
| 〃 | `DSBD_FCLT_CARD` | `/smry/retrieveDailySmltFcltCard` |
| 〃 | `DSBD_FCLT_QUEUE_SCENARIO` | `/smry/retrieveFcltQueueScenario` |
| 맵형태보기 | `MAP_INFO` | `/map/retrieveSmltMap` |
| 체크인카운터 | `CHKN_COUNTER_INFO` | `/chkn-counter/retrieveChknCounter` |
| 출국장 | `DEP_HALL_INFO` | `/dep-hall/retrieveDepHall` |
| 사용자 시뮬레이션 | `USER_SMLT_INFO` | `/user-smlt/retrieveUserSmltInfo` |
| 〃 | `USER_SMLT_FLT_PSG` / `_SAVE` | `/user-smlt/retrieveFltPsgInfo` · `saveFltPsgInfo` |
| 〃 | `USER_SMLT_CHKN` / `_SAVE` | `/user-smlt/retrieveChknCounterInfo` · `saveChknCounterInfo` |
| 〃 | `USER_SMLT_DEP` / `_SAVE` | `/user-smlt/retrieveDepInfo` · `saveDepInfo` |
| 〃 | `USER_SMLT_FCLT_MAP` | `/user-smlt/retrieveFcltMap` |
| 〃 | `USER_SMLT_EXECUTE` | `/user-smlt/executeUserSmlt` |
| 모니터링 | `MNTR_EXEC_SMRY` | `/mntr/retrieveSmltExecSmry` |
| 〃 | `MNTR_EXEC_LIST` | `/mntr/retrieveSmltExecList` |
| 〃 | `MNTR_EXEC_DETAIL` | `/mntr/retrieveSmltExecDetail` |
| 시설물 매핑 | `FCLT_MAP_LIST` / `_SAVE` | `/fclt/retrieveFcltMapList` · `saveFcltMapList` |
| Cast 설정 | `CAST_CONFIG_GROUP_LIST` | `/cast-config/retrieveGroupList` |
| 〃 | `CAST_CONFIG_DATASET` | `/cast-config/retrieveDataset` |
| 〃 | `CAST_CONFIG_SAVE` | `/cast-config/saveDataset` |
| 〃 | `CAST_CONFIG_CATEGORY_LIST` | `/cast-config/retrieveCategoryList` |
| 〃 | `CAST_CONFIG_CATEGORY_SAVE` | `/cast-config/saveCategory` |
| 〃 | `CAST_CONFIG_OPER_APPLY` | `/cast-config/applyOperation` |
| 〃 | `CAST_CONFIG_PRE_PRCS_HSTRY` | `/cast-config/retrievePreProcessHistory` |
| 〃 | `CAST_CONFIG_PRE_PRCS_REVERT` | `/cast-config/revertPreProcess` |

Cast 설정 백엔드는 `CastConfigController` · `CastConfigServiceImpl` · `CastConfigMapper.xml` 에 있다.
데이터 모델은 `java/ddl/cast-ddl.sql` 의 `TN_PM_SMLT_FIX_ATRB_GROUP`(속성그룹=화면의 '카테고리')과
`TN_PM_SMLT_{PSG,SHOW_UP,SRVC}_ATRB` 를 따른다 — 이 세 테이블은 `FIX_ATRB_GROUP_ID` 가 PK 선두라
**카테고리가 데이터의 1차 축**이고, '기준정보'와 '테스트정보'는 서로 다른 그룹 ID 일 뿐이다.

**속성그룹 ID 중 두 개와 한 구간은 예약값이다.**

| ID | 뜻 | 누가 쓰나 |
|---|---|---|
| `001` | 기준정보. CAST 가 `PS001` 로 읽어 가는 **일일 시뮬레이션의 실제 입력** | 화면에서 셀 직접 편집 불가. 운영 반영으로만 바뀐다 |
| `999` | 전처리 결과. `data-processing/run_pipeline.py` 가 주단위로 전량 교체 | 읽기전용. 화면은 비교·반영에만 쓴다 |
| `500~998` | 사용자 실행 전용 PropertySet `PS5xx` (§11.3). 그룹 행 없이 PS001과 USER_MSTR의 시설 리소스 참조로 렌더 | 카테고리 채번(`retrieveAvailableCategoryId`)은 `002~499` 만 쓴다 |

- 체크인유형도 `TN_PM_SMLT_CKNCT_TYPE_ATRB` 하나에서 관리한다. `CKNCT_TYPE_ATRB_ID` 가 카테고리
  축이며 전처리 결과는 `999`, 운영 기준정보는 `001` 이다. `_PRC` 별도 테이블은 사용하지 않는다.
- `TN_PM_SMLT_STNG.PRPT_SET_RSRC_ID` 는 CAST 가 결과에 실어 보내는 값을 서버가 **기록만** 하는 칸이다
  (`CastApiMapper.xml#insertSimSet`). 앱에서 일일 시뮬레이션이 쓸 PropertySet 을 바꿔 지정할 수 없고,
  **`001` 의 내용을 바꾸는 길뿐이다.**
- 반영 대상 행은 카탈로그 `TN_PM_SMLT_PSG_FIX_PARA_CD.PRE_PRCS_YN = 'Y'` 로 가른다.
  파이프라인에 태스크를 더하면 `java/ddl/2026-09-02-atrb-pre-process.sql` (2) 의 코드 목록도 함께 늘린다.
- 반영은 `TH_PM_SMLT_ATRB_APLY_HSTRY(_DTL)` 에 **적용 직전 값을 먼저 스냅샷**한 뒤 복사한다.
  되돌리기는 그 스냅샷을 `updateAtrbValue` 로 되쓴다. 스냅샷을 복사 뒤에 찍으면 되돌릴 값이 이미 덮인다.
- **운영 반영(카테고리→001)이 001 을 갱신하는 유일한 화면 경로다.** 카테고리 바 오른쪽 버튼 하나가
  그룹의 **전 시트를 한 번에** 밀고, 시트마다 이력 1건을 남긴다. `999` 를 고르면 구 '전처리 반영'과
  같은 동작이라 그 버튼은 없애고 이쪽으로 흡수했다 (2026-09-04 결정).
  **소스가 `999` 일 때만 값 컬럼을 전처리 산출 컬럼으로 좁힌다** — 사용자 카테고리는 편집 가능한 전
  컬럼을 밀지만, `999` 는 파이프라인이 산출 컬럼만 채워 NULL 이 기준정보를 비운다.
- 디폴트속성적용(001→카테고리) · 운영 반영(카테고리→001)은 **같은 SQL `copyFromGroup`** 을 방향만
  바꿔 쓴다. `copyFromGroup` 은 UPDATE 만 하므로 001 에 없는 행은 반영되지 않고 조용히 빠진다 —
  반영 전에 행 키를 대조해 걸러 낸다.
- 엑셀업로드·디폴트속성적용·전처리 반영은 **화면과 서버 양쪽에서 걷어냈다.** 그리드의 행 선택
  체크박스도 같이 사라졌다 — 선택값을 쓰던 곳이 디폴트속성적용 하나뿐이었다.
  `CastConfigMapper` 는 그대로다. `copyFromGroup` 을 비롯한 모든 statement 를 남은 경로가 쓴다.
- **터미널은 그룹이 아니라 속성코드가 가른다.** 전처리 결과가 `999` 하나에 모이므로 T1/T2 가 같은
  `PSG_ATRB_CD` 를 쓰면 뒤엣것이 앞엣것을 지운다. `step5_save.assert_unique_keys` 가 이걸 막는다.

**서버는 처리 실패도 HTTP 200 으로 내려보내고 본문의 `error` 플래그로 알린다.**
그래서 모든 조회는 `unwrap(dto, fallback)` 을 거쳐 통신 실패와 같은 catch 경로로 흘려보낸다.

**맵형태보기 · 출국장 · 체크인카운터는 하루치를 한 번에 받는다.** 세 응답 모두 30분 슬롯
배열(`slotList`)을 갖고, 화면은 타임라인 시각(`hhmm`)으로 슬롯을 찾아 읽는다. 그래서 조회 조건은
`smltId` + `tmnlId` 뿐이고 **눈금 이동·재생·마커 팝업은 서버를 부르지 않는다**.

체크인카운터는 **차트 보기와 표 보기가 모두 30분 슬롯을 읽는다** — 차트는 하루치 슬롯을 훑고
표는 타임라인이 가리키는 한 칸을 읽는다. 시간대별 자원 배열(`rsrcList`, 24칸)은 시간 단위 자원
요약을 쓰는 호환 경로로 남아 있고, 그 `wtngPsgCnt` 는 두 슬롯의 합이 아니라 **매시 마지막 Queue** 다.
구 메뉴의 `셀프체크인/백드롭` 은 별도 화면·API 가 아니라 이 응답의 아일랜드 자원(`kioskCnt`,
`bagDropCnt`)으로 흡수됐다 (사용자 시뮬레이션 탭이 합쳐진 것과 같은 이유다).

**CAST 가 가져가는 일일 자료(`001`)의 기준일자는 서버가 정해 `#{baseYmd}` 로 바인딩한다.**
CAST 는 `REQ_GetResource` 요청에 날짜를 싣지 않는다 — 본문이 `@RequestBody String` 으로 들어와
`resourceType` · `resourceID` 두 개만 파싱되므로 서버가 채우는 수밖에 없다. 결정 지점은
`CastApiServiceImpl.resolveBaseYmd()` 하나뿐이고, **mapper 에 `SYSDATE` 를 기준일자로 다시 쓰지
않는다** (`LastModified` 표기·ID 채번용은 예외). `TN_PM_SMLT_DALY_CRTR_YMD`(2026-10-26 `DROP_TMP`
대체) 의 사용(`USE_YN='Y'`) 행 중 최대 `CRTR_YMD` 를 쓰고, 행이 없으면 당일로 떨어진다.
고정을 풀려면 행을 `USE_YN='N'` 으로 바꾼다 (`FIXED_BASE_YMD` 상수는 2026-10-26 제거).
일일 결과의 `STNG.EXCN_YMD` 도 결과 수신 시 같은 함수로 정한다 — CAST 실행 중에 기준일자를 바꾸면
결과가 바뀐 일자로 저장된다. 사용자 자료(`002~999`)는 발행 시점에 `#{excnYmd}` 로 행에 굳으므로
이 값과 무관하다 (§11.2).

시설 운영시간 3종(`retrieveFcltyOpngTblDptg` · `..Immig` · `..TrnstScrtyCntrl`)은 날짜를
`TN_PM_SMLT_SCHDL_ATRB` 의 그룹 행에서 꺼내는데, **일일(`001`) 그룹을 채우는 주체가 없어**
`NVL(…, #{baseYmd})` 로 받는다. NVL 을 걷어내면 서브쿼리가 NULL → `BETWEEN` 이 false 라
운영시간표가 **에러 없이 빈 채로** 발행된다.

---

## 9. 알아 두면 좋은 것

- **화면은 한 화면에 꽉 차게 짜여 있다.** `.wrap` / `.body` 가 `flex:1` 로 남은 높이를 먹는다.
  flex 사슬이 한 번이라도 끊기면 안쪽 높이가 auto 로 풀려 하단 버튼이 화면 밖으로 밀려난다.
- 대시보드는 축소(transform scale) 대신 **반응형**이다. 기본 배치인 **T1/T2 가로 2단은 절대
  세로 스크롤하지 않는다** — 한눈에 보는 화면이라는 성격이 그렇다. `.app` 의 `overflow:hidden`
  이 이를 구조적으로 보장하고, 모자란 세로는 `--lost`(디자인 1080 대비 부족분) 예산을 여백
  다섯 곳(`--main-gap`·`--top-row-h`·`--title-gap`·`--view-gap`·`--sum-top-h`)에 계수로 나눠
  물려 걷어 온다. 나머지는 `.gates`(flex:1)가 흡수한다.
  `.p-top`(199px)과 제목줄(40px)은 글자 크기가 정한 고정값이라 압축 대상이 아니다.
- **2단을 포기하는 조건은 폭 하나뿐이다.** `1600px` 미만이면 세로 1단 + 스크롤로 내려가고,
  세로가 아무리 낮아도 `1600px` 이상이면 2단을 유지한다. 스크롤 구간에서는 `--lost: 0` 으로
  여백을 원래 값에 되돌리고 `.body`·`.row--panels` 의 `min-height` 를 `auto` 로 푼다 —
  `0` 이면 내용의 min-content 높이가 위로 전달되지 않아 스크롤 대신 눌린다.
- 여백 예산은 뷰포트 `1002px` 에서 바닥난다. 그 아래(`min-width:1600px and max-height:1001px`)는
  **촘촘 모드** — 게이트 카드의 글자와 게이지(`--donut-size`)를 한 단계 낮춰 약 40px 을 더 번다.
  **게이지 크기는 CSS 가 정한다**(`GaugeDonut` 은 인라인 크기를 넘기지 않는다). 이 토큰을
  다시 인라인 style 로 돌리면 촘촘 모드가 먹지 않는다.
- 촘촘 모드로도 안 되는 `930px` 미만은 `.main` 에 **`zoom`** 을 5단계로 건다
  (929→0.95 · 868→0.88 · 811→0.82 · 761→0.76 · 712→0.68, 뷰포트 646px 까지).
  `transform: scale` 이 아니라 `zoom` 인 이유는 축소된 크기로 레이아웃이 다시 계산되기
  때문이다 — 예전 `useFitToScreen` 처럼 여백을 `--scale` 로 되나누는 보정이 필요 없다.
  단계 값은 `.main` 이 930px 화면에서 쓰는 824px 대비 실제로 쥐어지는 높이
  `(뷰포트 − 헤더 − 본문 여백)` 의 비율이다. 헤더·여백이 줄어드는 900px 경계가 가장 불리한 지점.
- **줌 구간에서는 `--lost` 를 `120px` 로 못박는다.** 그 값이 `100vh` 로 정의돼 있어 zoom 안에서
  다시 계산되면 `100vh` 가 `1/zoom` 배로 커져 여백 압축이 도로 풀리고, zoom 으로 번 높이를
  그만큼 까먹는다. 못박아야 `.main` 이 쓰는 높이가 824px 로 고정돼 단계 계산이 성립한다.
- 미디어쿼리는 `zoom` 의 영향을 받지 않으므로 촘촘 모드는 그대로 걸린 채다.
- **폭 쪽 임계값은 전부 브라우저에서 잰 값이다.** 출발/도착 여객수가 겹치기 시작하는 폭이
  `1700px`(한 줄 4장) · `1350px`(전체폭 4장) · `830px`(2열 그리드)라 각각 접는 지점이 됐다.
  `1350px` 아래는 `flex-wrap` 이 아니라 **2열 그리드**다 — wrap 은 폭에 따라 한 줄에 서는
  카드 수가 4→3→2 로 요동쳐 특정 폭에서만 다시 겹친다.
- `.row--top` 은 고정 높이가 아니라 `min-height` 다. 카드 폭이 줄면 기상정보의 풍속/기압이
  두 줄이 돼 내용이 197px 을 넘긴다.
- 더 좁아지면 폭 기준으로 1400 → 상단 카드·PRIME TIME 두 줄, 1100 → 정보카드 2×2,
  860 → 패널 내부(차트·게이트)까지 세로로 푼다. 전부 `dashboard.css` 맨 아래 '반응형' 절.
- 조회 버튼은 **조건이 그대로여도 다시 조회**해야 한다. 그래서 `useFetched` 는
  조건을 값이 아니라 **참조**로 비교한다 (새 객체를 만들면 다시 조회된다).
- 아이콘 체계가 두 가지다 — 파일 기반 `@/components/icons` 와
  인라인 레지스트리 `@/components/icons/InlineIcon`. 둘은 배럴을 공유하지 않는다.
- `java/` 를 고쳤다면 실제 백엔드 레포에서 빌드해야 한다. 여기서는 컴파일 검증이 안 된다.

---

## 10. Read 토큰 절약 가이드

큰 파일(특히 `api.types.ts`, `mock/*.mock.ts`, 화면별 대형 컴포넌트)을 다룰 때는 아래 순서를 지킨다.

- **전체 파일 read 를 기본값으로 삼지 않는다.** 위치를 모르는 상태에서 파일 전체를 읽지 말고,
  먼저 Grep/Glob 으로 찾는 대상(필드명·함수명·className 등)의 위치를 좁힌 다음, 그 주변만 읽는다.
- **큰 파일은 나눠서 읽고, 답을 찾으면 그 자리에서 멈춘다.** `offset`/`limit` 로 필요한 범위만
  읽고, 다음 구간을 이어서 읽기 전에 "지금까지 읽은 부분으로 충분한가"를 먼저 판단한다.
  확인이 끝났으면 나머지 구간은 읽지 않는다 — 끝까지 다 읽는 것을 기본 동작으로 삼지 않는다.
- **여러 파일에 걸친 탐색은 Explore 서브에이전트에 맡긴다.** "이 필드를 쓰는 곳 전부",
  "이 패턴이 어디에 있는지" 같은 질문은 메인 컨텍스트에서 하나씩 Read 하지 말고 위임해서
  요약만 받는다.
- **이미 읽은 파일은 검증 목적으로 다시 읽지 않는다.** Edit/Write 가 에러 없이 끝났다면 반영된
  것으로 간주한다.
- **목업·상수처럼 반복 구조인 파일은 앞부분 일부만으로 패턴을 파악한다.** 항목이 수십~수백 개
  반복되는 파일(`*.mock.ts`, 슬롯 배열 목업 등)은 처음 몇 항목만 읽고 구조를 확인한 뒤, 나머지는
  Grep 으로 예외 여부만 확인한다 — 전체를 순차로 다 읽지 않는다.

---

## 11. 사용자 현재상태·공통 실행 ID와 CAST 연계

2026-10-11 재설계 후 2026-10-16 공통 마스터를 제거했다. 최초 계획은
docs/plans/2026-10-11-user-smlt-master-redesign.md이며 현재 API·적용·복구 절차는
docs/user-smlt-master-redesign.md를 따른다.
이 저장소의 Java는 참조 사본이며 실DB 적용·실백엔드 빌드가 완료된 것으로 간주하지 않는다.

### 11.1 현재상태와 실행

- 편집용 7개 테이블의 키는 (OWNER_USER_ID, EXCN_YMD, TMNL_ID, 기존 시설·시간·부스 키)다.
  OWNER_USER_ID는 세션 사용자로 강제하며 요청의 사용자 필드를 신뢰하지 않는다.
- 현재상태 조회·저장은 ymd + tmnlId를 사용한다. 과거 결과 ID가 없어도 조회·저장한다.
  비교 KPI만 별도 일일 결과 ID를 쓴다. 없는 영역은 해당 일자 운영자료, 운항 조정률은 0%다.
- TN_PM_SMLT_CURRENT_SAVE는 제거했다. 체크인·출국장은 현재상태 부모 행이 없으면 운영자료를 사용하며,
  빈 배열 저장과 미저장을 구분하지 않는다. 부모 행이 남아 있는 전체 미운영 조건은 그대로 사용한다.
  saveDt는 남아 있는 운항·체크인·출국장 부모 행의 등록·수정시각 중 최댓값이며 행이 없으면 빈 문자열이다.
- 체크인·출국장은 세션 사용자·일자·터미널 범위의 자식부터 삭제하고 부모부터 다시 넣는다.
  수동 저장은 탭별 독립 트랜잭션이다.
- 실행 API는 변경한 영역만 자동 저장하고, 나머지는 저장 조건→운영자료 순으로 채운다.
  두 터미널 확정·공통 ID·리소스 발행·이력·요청을 한 트랜잭션으로 처리한다.
  실패하면 자동 저장까지 롤백한다. 프런트는 방문 탭과 양 터미널의 미확정 편집을 유지한다.
- 확정 조건 DTO를 발행 SQL에 직접 넘긴다. SQL은 `<foreach>` 인라인 행으로 받아 원천 리소스 테이블에 넣는다.
  중간 정규화 테이블·GTT·조건 JSON·입력 XML 사본을 두지 않는다. 실행 중 USER_*를 다시 읽지 않는다.
- 공개 조건 조회는 STNG의 리소스 ID를 우선 사용하고 결과가 없으면 USER_MSTR를 참조한다.
  지정된 리소스 원천의 의도된 변경은 조회에 반영한다. 현재 편집 상태를 과거 실행 조건으로 대신 읽지 않는다.
- 화면의 터미널 선택은 편집 선택이다. 실행은 항상 T1·T2 전체다. 저장·실행·결과 수신·상태 통보를
  직렬화하는 잠금은 없고(2026-10-16 ID_LOCK 제거), 다른 실행의 RUNNING 상태로 추가 실행을 막지 않는다.
  동시 실행이 같은 리소스 번호를 고르면 원천 ATRB PK 위반으로 늦은 쪽이 실패한다.

### 11.2 ID와 테이블

| 이름 / 테이블 | 의미 |
|---|---|
| SQ1_TN_PM_SMLT_RSLT | 사용자 등록·일일 결과 최초 수신 양쪽에서 공통 SMLT_ID 채번 |
| TN_PM_SMLT_USER_MSTR | 사용자 실행의 원천이자 CAST WhatIf 요청. 신규 요청 ID는 WI + 공통 ID를 8자리로 0 채움(WI00008061). 정상 비어 있지 않은 CAST 상태 목록에 없는 요청은 DB 상태와 관계없이 삭제한다 |
| TN_PM_SMLT_STNG | 같은 실행 ID 아래의 모델별 설정. PK는 (SMLT_ID, SMLT_MDL_SN). SMLT_TYPE은 Auto·WhatIf만 사용한다. USER_MSTR에 없는 Auto만 모니터링에 표시하고, 삭제된 WhatIf 결과는 보존하되 표시하지 않는다 |
| TN_PM_SMLT_RSLT_DTL(_REG_EXCL) | 같은 실행 ID의 상세·미매핑 결과 |

공통 ID는 SQ1_TN_PM_SMLT_RSLT.NEXTVAL을 0 채움 없이 그대로 쓰며(8061) 99999999를 넘기면 실패한다
(2026-10-19 변경, 이전 신규 ID는 00008061처럼 8자리). 자리수가 섞이므로 SMLT_ID의 최대·정렬은
TO_NUMBER로 비교한다. 결과 수신은 WI 뒤 8자리로 요청을 찾으므로 요청 ID만 8자리를 유지한다.
이관된 기존 1~8자리 숫자 ID는 보존한다. 시퀀스는 NOCYCLE이며 USER_MSTR·STNG의 기존 최대 ID보다
높게 맞춘다. 롤백에 따른 결번은 허용하며 회차는 사용하지 않는다. 별도 TN_PM_SMLT_MSTR는 사용하지 않는다.
USER_MSTR의 RSLT_SMLT_ID·SMLT_RSLT_SFX는 2026-10-26 제거했다. 결과는 같은 SMLT_ID로 STNG와 잇고,
CAST의 simulationResultSuffix는 SMLT_REQ_ID를 그대로 내보낸다(`java/ddl/2026-10-26-user-mstr-drop-rslt-cols.sql`).
구 회차·요청·결과 ID는 이관 대응표와 원본 LGC에서만 보존한다.

### 11.3 CAST 리소스 참조

이 저장소의 CAST 연계 구현은 `java/castapi/` (`aoms.pm.castapi`)에 둔다. 클래스명은 `CastApi`로
시작하며 외부 API URL은 기존 `/castrest/rest/json`을 유지한다. 실제 백엔드에서 동료의 `castrest`와
함께 둘 경우 두 컨트롤러의 `@RestController`를 주석 전환해 하나만 등록한다.

CAST는 /castrest/rest/json/REQ_GetResourceInformation.do, REQ_GetResource.do,
REQ_SetResource.do를 호출한다. 서버가 CAST를 호출하거나 선점하는 스케줄러를 두지 않는다.
CAST가 New 요청을 polling하고 Executing / Finished / Failed를 통보한다.

- FS001 / CA001 / SBD001은 일일 운영자료다. 사용자 자료는 002~999 번호를 FS·CA·SBD·DepartureGate·
  SecurityControl·Immigration·TransferSecurityControl 7종이 공유한다. 출국장·입국심사·환승보안 렌더 SQL이
  번호로 FS 그룹 일자를 찾으므로 타입별 번호를 분리하지 않는다. 입국심사·환승보안은 001 원천을 번호로 복사한다.
- FS001은 매일 변경 가능한 일일 세트다. 그 외 지정 리소스는 자동으로 덮어쓰거나 재사용하지 않는다.
  원천에 대한 의도된 변경은 그대로 참조한다. 기존 001계열의 일일 운영자료 조회 경로는 유지한다.
- 사용자 FS002~999·PS500~998은 USER_MSTR·STNG에 쓰인 최대 번호 다음의 미사용 번호를 할당하고, 그 위가 차면
  가장 작은 미사용 번호로 돌아간다. 요청·결과·원천에 남아 있는 번호는 상태와 관계없이 제외하고, 빈 번호가 없으면
  명확히 실패한다. 다시 쓰이는 번호는 운영자가 오래된 실행을 정리해 비운 번호뿐이다. 리소스 DELETE 후 INSERT·lease를 두지 않는다.
- PropertySet은 `CastApiServiceImpl.DAILY_PRPT_SET_RSRC_ID`로 고정한 PS001을 읽고 해당 요청의 시설 리소스 ID로 참조를 바꿔 렌더한다.
  원천 PS ID는 USER_MSTR에 저장하지 않는다(2026-10-17 SRC_PRPT_SET_RSRC_ID 제거).
  XML 사본을 저장하지 않는다. 모델·서비스시간·체크인유형·출국심사·리포팅은 지정된 원본 ID로 조회한다.
- COND_SNAPSHOT·INPUT_SNAPSHOT·RSRC_LEASE를 제거했다. 적용·복구 절차와 최종 목록은
  docs/resource-reference-cleanup.md를 따른다. 최초 설계·구 이관 스크립트는 역사 기록이며 현재 계약의 근거로 쓰지 않는다.
- CA 블록은 P01CKINInt / P01CKINDom / P03CKIN, SBD는 P01SBD / P03SBD,
  키오스크는 P01Self / P03Self다. 발행과 조회의 값이 같아야 한다.
  SBD AirlineCode는 ALN_CD가 아니라 CHKN_TYPE_DTL_INFO다.
  키오스크 기기 ID는 ICN1SB01 형식이라 아일랜드는 SUBSTR(ID, -3, 1)이다. 첫 글자로 자르면 전부 I가 되어 키오스크가 0대로 발행된다.
  사용자 SBD·키오스크 T2는 OPER_END_DT의 HHMI 4자리로 렌더한다(2026-10-27). 시만 자르면 24시(2359)가 23:00이 되어
  23–24 구간이 0분이 되고, CAST는 SBD를 읽은 직후 결과 없이 Finished로 끝낸다.
  같은 이유로 체크인 기본 운영시간(`CastChknMapper.retrieveChknList`)은 일일 CA001처럼 NVL(EST, LAST)를 쓰고
  NULL·시작=종료 행을 빼며, 종료 시가 시작 시 이하면 24로 올린다.
- 사용자 FS(일일 운영자료 기반)는 FS001과 같은 SQL 조각 `CastApiMapper.dailyFlightScheduleRows`의 행을 저장한다
  (2026-10-19). 게이트·주기장 3자리 패딩·fallback, OperatorCat·ContactRemote·CheckinRange·SBDAvailable 등을
  따로 만들지 않는다 — GO 원값을 그대로 쓰면 출발편이 게이트에 배정되지 않고 CAST가 계산 없이 끝난다.
  PK 때문에 같은 편 중복은 ROW_NUMBER로 1행만 남긴다.
- 운항 조정은 국제선 출발 GREATEST(예약-환승,0) 몫만 늘린다. 조회와 발행의 필터·ROW_NUMBER를 맞춘다.
  기준 여객수는 FS001 값이고, 늘리는 몫만 조회 화면과 같은 예약 기준이다.
- 사용자 DepartureGate는 운영 Y 출국장 × 운영구간 × `001` 조합(East/West·SD·FR)마다 1행이다 (2026-10-20,
  [계획](docs/plans/2026-10-20-user-smlt-dptgt-lane-chkn-type.md)). 레인은 스마트패스 = FR `Y`, 일반 = FR `N` 그룹 안에서
  `001` 레인 비율로 나눈다(내림 후 잔여는 소수부 큰 순). `001` 조합이 없는 운영 Y 출국장은 발행 전에 실패한다.
  운영자료 기본 레인 수도 출국장별 `001` FR 그룹 합계다. 시각은 ATRB의 OPER_BGNG_HM·OPER_END_HM
  (HHMM, 24시는 2359)에 싣는다. 이 칸이 빈 행(일일 001)만 운영계 출국장 운영시간을 조인한다.
  sideDoor·facialRecognition은 NVL(' ')로 감싸 배열 길이를 맞춘다.
- 사용자 CA의 `CHKN_TYPE_CD`는 일일 CA001과 같은 `'C'`(항공사 기준)다. `'M'`이면 CAST가 편명 기준 배정으로 읽어
  처리 인원이 0이 된다.
- SecurityControl은 일일·사용자 모두 시각 없이 수량만 보낸다. 사용자는 운영 Y·scshCntom > 0 출국장마다 1행.
- 사용자가 편집하지 않는 모델(ICN001)·원천 PS·서비스시간·체크인유형·출국심사·입국/환승보안 원천·리포팅은
  일일과 같은 001 원천이다. 원천 PS는 `CastApiServiceImpl`, 나머지는 `CastUserSnapshotServiceImpl` 상수다(2026-10-16 INPUT_BASE 제거). 실행 등록 시
  리소스를 미리 렌더해 검사하지 않으므로 원천 누락은 CAST 단계에서 드러난다.
  운영자료가 없는 것과 사용자가 저장한 미운영 조건을 구분한다.

### 11.4 결과·상태·공개 조회

- 현재상태는 사용자별 비공개, 권한 있는 실행이력·결과·확정 조건 조회는 공개다.
  mode=view&smltId=...는 현재상태가 아닌 실행 당시 JSON을 읽는다.
- 사용자 결과는 FS 번호 후보가 유일해야 하며, 확인 가능한 WI 식별자와 모델·입력 리소스를 대조한다.
  모호하거나 다른 입력이면 최신 요청에 임의 연결하지 않는다. 사용자 결과에 새 ID를 발급하지 않는다.
  일자는 대조하지 않는다 — `StartTime` 은 CAST 실행 시각이고, FS 가 요청 일자로 발행돼 리소스 대조로 충분하다.
  STNG.EXCN_YMD 는 요청의 EXCN_YMD 를 쓴다. CAST 가 CA 를 `""` 로 보내므로 CA 는 값이 올 때만 대조하고
  STNG 에는 요청의 CA 를 기록한다. 리소스 ID 는 대소문자를 구분하지 않는다 (`CheckInCounterServiceTime001`, 2026-10-19).
- STNG 의 `PLAN_BGNG_DT`·`PLAN_END_DT` 는 CAST `StartTime`·`StopTime`(실제 수행 시각), `SMLT_BGNG_DT`·`SMLT_END_DT` 는
  시뮬레이션 속 시각(대상일 전날 12시~)이다. 모니터링의 시작·종료·소요시간과 일일 기간 필터는 `PLAN_*` 를 읽는다 (2026-10-19).
- 일일(Auto)은 Run 하나에 모델 결과 1건이라 결과마다 새 공통 ID를 받는다(2026-10-16 RESULT_GROUP·
  CAST_CONTRACT 제거). 다중 모델을 도입하면 STNG의 SMLT_TYPE·EXCN_ID(RunID)·계획/실제 시각·FS로 묶는다.
- 원문은 REQUIRES_NEW 수신함에 먼저 보존한다. 파싱·매칭·저장 실패 이유도 남긴다.
  CAST는 결과를 재전송하지 않는다. RESULT_IDENTITY와 원천 식별키·payload hash 비교를 제거했다.
  동일 실행·모델의 결과가 STNG에 있으면 내용 비교 없이 실패 처리한다.
- 결과 저장·이력·요청 완료는 같은 트랜잭션이다. 사용자 실행은 Failed이면 FAILED, STNG 결과가
  있으면 DONE, 나머지는 RUNNING이다. Finished 통보만으로 결과 없는 실행을 완료시키지 않는다.
- 상태는 이전 상태 조건의 CAS UPDATE다. CAST는 결과 저장 성공 응답 후 Finished를 통보한다.
  정상 비어 있지 않은 상태 목록을 기준으로 목록에 없는 요청은 DB 상태와 관계없이 삭제한다.
  빈 목록·잘못된 형식·파싱 실패 시에는 삭제하지 않는다.
  삭제된 요청은 모니터링 목록·집계·상세에서 제외하고 해당 사용자 PS의 목록 제공·재조회를 종료한다.
  STNG·결과 상세·발행 원천은 보존하며, 요청 삭제만으로 리소스 번호를 회수하지 않는다.
  활성 요청 부분 유니크 제약과 추가 실행 차단을 사용하지 않는다.
- LISTAGG의 NULL 누락을 막는 NVL(' ')과 모든 컬럼의 동일 정렬 순서를 유지한다.

### 11.5 적용 전 확인할 사항

참조 DDL은 사진 판독본이다. java/ddl/2026-10-11-user-smlt-preflight.sql로 실스키마·인덱스·코드·ID를 대조한다.
이전 2026-08-27-user-smlt-alter.sql을 새 환경에 순서대로 적용하지 않는다.
기존 stage→executions→input-base-seed→verify→cutover는 과거 절차다. 현재 executions 파일은 손상되어
그대로 실행할 수 없다. 이미 cutover가 완료된 DB는 2026-10-16-remove-smlt-master.sql로 전환한다.
신규 DB는 최신 cast-ddl.sql을 기준으로 생성하며 적용·복구 상세는 docs/user-smlt-master-redesign.md를 따른다.
stage는 전송 7쌍의 002~999 행을 *_LGC로 백업하고 RSRC_FS 시작점을 기존 요청의 최대 FS 번호로 둔다.
원본·대응표·미확정 사유를 보존하고, 모든 미확정 건과 별도 환경 검증을 해결하기 전 cutover하지 않는다.

실연계 검증 대상: 키오스크 기기 ID 4자리 제약 (GO FS 부속 NULL 컬럼·아일랜드 추출은 2026-10-19 결과 대조로 확인·수정),
EMI/IMMI 컬럼 의미, PS5xx·번호 입국심사/환승보안 리소스 왕복과 리소스 목록 대조 여부,
결과 묶음 키·전체 완료 단위, 실제 시각/대상일자 의미다.
Java 실제 빌드·Oracle 이관·CAST 통합 검증은 실제 백엔드/검증 DB에서 수행한다.

---

## 12. 화면 접근 권한

권한은 `CAOWN.TN_CA_ROLE` · `CAOWN.TN_CA_USER_ROLE` 의 PM 롤 6종(`PMR0001`~`PMR0006`)으로
가른다. **롤 ID 값은 운영 계정 체계가 정한 것이라 바꾸지 않는다.**

| 화면 / 정보 | `PMR0001`<br>기본 | `PMR0002`<br>통합운영센터 | `PMR0003`<br>운영기획 | `PMR0004`<br>매출조회 | `PMR0005`<br>예측관련 | `PMR0006`<br>시스템 관리 |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| 일일 시뮬레이션 4화면 | – | ✓ | ✓ | ✓ | ✓ | ✓ |
| 사용자 시뮬레이션 | – | ✓ | ✓ | ✓ | ✓ | ✓ |
| 시뮬레이션 모니터링 | – | ✓ | ✓ | ✓ | ✓ | ✓ |
| 시설물 매핑 | – | ✓ | ✓ | – | – | ✓ |
| Cast 설정 | – | – | – | – | – | ✓ |
| 아일랜드 매출 정보 | – | – | – | ✓ | – | – |

- **롤은 합집합**이다. 한 사용자가 여러 롤을 갖는다(운영의 `PM001` = `PMR0001`+`PMR0005`+`PMR0006`).
  `PMR0001` 은 아무 화면도 더하지 않아 단독으로는 접근 가능한 화면이 0개다.
- 접근 가능한 화면 안에서는 **저장·실행을 포함한 모든 기능을 쓴다.** 읽기전용 롤은 없다.
- 매출은 `PMR0006` 도 못 본다 — `PMR0004` 단독 조건이다.

**정책의 단일 원본은 `react/src/modules/pm/auth/access.ts`** 다. 경로 → 허용 롤 맵(`PATH_ROLES`)
하나를 LNB 필터(`filterNavItems`)와 라우트 가드(`AccessGuard`)가 같이 읽는다. `PATH_ROLES` 에
없는 경로는 **기본 거부**이므로 라우트를 추가하면 여기에도 넣어야 한다.

- 서버는 `UserDto.roleIdList` 로 **롤 ID 원본만** 내려준다. 메뉴·경로는 화면 개념이라 서버가 모른다.
- 롤이 하나도 없는 사용자는 오류가 아니다. `roleIdList: []` 를 정상 응답으로 받고 화면이
  `NoAccess` 를 그린다.
- **매출은 화면에서 감추는 게 아니라 서버가 응답에서 뺀다.** `CastMapServiceImpl.getChknInfoList()`
  가 `PmRole.SALES` 를 확인해 `MapChknInfoDto.sales` 를 null 로 내리고, 화면은 `sales == null`
  만 본다 — 같은 규칙이 두 곳에 중복되지 않는다.
- 매출 외 다른 API 에는 서버 권한 검사가 없다. 프론트 차단은 URL 직접 입력으로 우회된다.
  전 컨트롤러 강제가 필요해지면 `PmRole` + `UserService.retrieveRoleIdList` 를 재사용한다.
- 목업에서 롤별 화면을 보려면 `api/pm/mock/common.mock.ts` 의 `MOCK_ROLE_ID_LIST` 를 바꾼다.
  `map.mock.ts` 도 같은 상수를 읽어 매출을 비운다.

---

## 13. 체크인 아일랜드 공용 Queue

**부스별 결과는 계산 원천으로만 쓰고, 업무 API·화면에는 아일랜드 단위 공용 `Queue` 하나만 내보낸다**
(2026-09-04, `docs/plans/2026-09-04-checkin-common-queue.md`). 대시보드 체크인 카드 · 터미널맵
체크인 마커/팝업 · 체크인 상세가 **같은 계산 결과를 나눠 쓴다** — 같은 `smltId` · 터미널 · `hhmm`
에서 세 화면의 혼잡등급 · 평균 대기시간(`cgnWtngSec`) · 추천이 어긋나면 그건 버그다.

| 무엇 | 어디 |
|---|---|
| 원천 조회 (30분으로 자르지 않은 부스별 결과) | `CastChknMapper#retrieveChknQueueRawList` |
| 구간 조립 · 배정 부스 · 로그 | `CastChknQueueServiceImpl` |
| 상태 없는 계산기 (FIFO 코호트) | `domains/chkn/ChknQueueCalculator` |
| 분 단위 궤적 · 30분/1시간 롤업 | `domains/chkn/ChknQueueSeries` |
| 슬롯 조회 · 1분 경로 지표(차트 · KPI) | `domains/chkn/ChknQueueDay` |
| 혼잡등급 기준정보 (대시보드 공용) | `domains/CgnGradeScale` + `CastCgnGradeService` |

- **Queue 대상은 유인 카운터 `CC` 뿐이다.** `CK`(셀프체크인) · `SBD`(셀프백드롭)는 자원 정보로만
  남고 Queue·혼잡·추천 계산에서 빠진다.
- 요약보기 시간대별 CHKN 차트는 `CC` 공용 Queue에 아일랜드별 SBD 기기 대기를 더한다. SBD가 있는
  아일랜드에서는 체크인 카드와 값이 다른 것이 의도된 동작이다
  ([구현 계획](docs/plans/2026-10-15-dsbd-chkn-chart-island-queue.md)).
- 산식은 `wtngEndPsgCnt[t] - wtngEndPsgCnt[t-1] + intvPrcsPsgCnt[t]` 로 유입을 역산해 1분 단위
  FIFO 로 흘린다. **`QueueLength_Current` 는 부스별 독립 값이고 `FinishedClients_Abs` 는 누적이
  아니라 구간 처리인원**이라는 두 전제가 깨지면 산식 전체가 무너진다.
- 처리시간 fallback 순서는 **원천 → 같은 아일랜드 최근 60분 가중평균 → 터미널 CC 가중평균 →
  관측 처리량**이고, 모두 없으면 처리용량 0 + 로그다. 소수 처리용량은 버리지 않고 다음 분으로
  이월해 **반복 실행이 같은 결과**를 낸다.
- **혼잡등급 220 명 같은 하드코딩 fallback 을 두지 않는다.** 기준정보(`TN_PM_PSG_PRCS_GRD`)가
  없거나 겹치면 조회 실패로 떨어뜨린다. 인원 기준 판정(`CongestionStatus.ofWtngPsgCnt`)은 2026-10-24 에 없앴다.
- 추천 `reqCnt` 는 추가 수량이 아니라 **현재 운영분을 포함한 총 소요 부스 수**다. 2026-10-17 부터
  `FcltWtngDay.recommendOf` 는 혼잡해소 팝업 기본값과 같은 공용 평가기 `domains/wtng/FcltQueueClearance`
  (목표 30분, §14)를 쓴다 ([계획](docs/plans/2026-10-17-fclt-card-domain-queue.md)). 2026-10-24 부터 λ·μ·Q0·s 는
  평가시각 직전 30분 `[hhmm−30, hhmm)` 에서 뽑고 **그 유입이 그대로 이어진다고 가정**한다 — 곧 몰려올 피크를
  미리 반영하지 못한다. `cgnClearMin` 은 추천 수량을 적용했을 때 평가시각부터 처리 여객 평균 대기시간이
  NORMAL 상한 미만이 되는 분(1분 해상도)이다.
- **요약보기 카드 · 맵형태보기 · 체크인 상세의 `reqCnt` · `cgnClearMin` 도 같은 조건에서 같아야 한다.**
  카드는 `clearanceOf` 를, 맵 · 상세는 `recommendOf` 를 부르지만 내부 계산은 하나다.
- 처리시간이 없어(`UNAVAILABLE`) 산정할 수 없으면 `reqCnt` · `cgnClearMin` 을 **`null` 로 내려** 화면이
  `-` 로 그린다. 해소가 불가능(`UNREACHABLE`)하거나 하루를 넘는 해소도 `cgnClearMin = null` 이다.
  보유 부스보다 큰 소요량이 나와도 **자르거나 숨기지 않는다.**
- 마지막 결과 시각 뒤에는 **유입 0 인 꼬리 구간**을 붙여 남은 Queue 를 배정 부스로 흘려보낸다.
  이 구간을 빼면 마지막 Queue 가 24:00 까지 그대로 남아 미운영 시각에 대기인원이 서 있게 된다.
- 공용 `CastMapMapper#retrieveMapRsltDayList` 는 **고치지 않는다** — 출국장 등 다른 화면이 같이 쓴다.

### 13.1 혼잡등급 = 직전 30분 처리 여객 평균 대기시간 (2026-10-24)

[계획](docs/plans/2026-10-24-cgn-grade-wait-time-impact.md). 체크인(CC 공용 Queue)·출국장(SC+SR) 모두 같은 규칙이다.
아래가 이 절의 옛 '대기인원 상한 · 다음 30분 슬롯' 설명을 대체한다.

- **평가시각 t = 화면의 `hhmm`**, 판정값 W(t) = `[t−30분, t)` 처리 여객의 처리인원 가중평균 대기시간(초, 소수 원값).
  10:10 이면 09:40~10:10 이다. 표시용으로 반올림한 값을 판정·정렬에 쓰지 않는다.
- 기준표 `TN_PM_PSG_PRCS_GRD`(체크인 `02` · 출국장 `04`)는 **정수 분**이다. `CgnGradeScale` 이 한 곳에서
  `[MIN×60, (MAX+1)×60)` 초 구간으로 바꾼다 — 19분 59.5초는 FREE, 20분은 NORMAL. 4등급 · 연속 · 0 시작을 검증하고
  어긋나면 조회 실패다. 20/40/60 같은 경계를 코드에 다시 쓰지 않는다. 적용 SQL: `java/ddl/2026-10-24-psg-prcs-grd-wait-minute.sql`.
- **산정 불가 = `cgnStatus: null`** (중립 회색). 처리 여객 0명, 30분 중 결과가 빈 분, 하루 첫 30분에 전날 결과가 없음,
  출국장 원천 대기시간 NULL, 기준 범위(9999분) 초과. FREE/NORMAL 로 메우지 않고 enum 에 값을 더하지 않는다.
  화면은 `toLevelKey`/`toLevelLabel`(`modules/pm/types/map.types.ts`)로 `*--unknown` 중립 클래스를 그린다.
- 대표 등급(알림 단계 · 터미널 패널 색)은 산정 가능한 시설 중 최고 심각도, 전부 불가면 null 이다.
  카드 · 알림 순서는 W 내림차순(불가는 뒤로, 같으면 대기인원 내림차순 → 코드). PRIME TIME 은 기존 대기인원 피크 그대로다.
- **지표 4종(`stat`)과 차트는 여전히 슬롯 `[hhmm, hhmm+30)` 값이다.** 등급 · `cgnWtngSec` · 추천만 평가시각 기준이라
  맵/상세 팝업의 대기인원(슬롯 끝)과 요약보기 카드의 대기열(평가시각 t)은 30분 차이가 난다.
- 체크인 FIFO 는 전날 결과가 있으면 그 시각부터 계산한다(`ChknQueueSeries.originMinute` ≤ 0). 그래서 자정의 대기열을
  이어 받는다. 관측 여부는 터미널 CC 결과 시각과 최소 결과 간격으로 정한다 — 마지막 결과 뒤 꼬리 구간은 미관측이다.
- 출국장은 `DepQueueDay`(SC/SR 하루치)를 `DepWtngSecBuilder` 가 10분 통계로 바꾸고 `FcltWtngDay` 가 평가한다. 결과 시각은
  구간 끝으로 보고 10분 구간 양 끝 시각이 터미널에 있어야 관측이라 `t−30, t−20, t−10, t` 네 시각이 모두 있어야 한다. 대기시간은 `SUM(AVG_WTNG_HR × TRNST_PSG_CNT)` 로 받는다
  (`retrieveRsltByUnitList.WTNG_SEC_SUM`). 체크인(결과 시각 = 구간 시작)과 시각 규칙이 다른 것은 기존 그대로이며 CAST 확인 대상이다.

---

## 14. 시설 카드 혼잡해소 시나리오 팝업

요약보기 체크인카운터·출국장 카드의 `+` 는 상세 화면 이동이 아니라 **중앙 팝업**을 연다
(2026-10-13, `docs/plans/2026-10-13-fclt-card-queue-popup.md`). 운영 검토용이며 저장·CAST 실행은 없다.

| 무엇 | 어디 |
|---|---|
| 정책 · 응답 조립 | `CastFcltQueueScenarioServiceImpl` |
| 공용 평가기 (카드 · 팝업 · 체크인 추천) | `domains/wtng/FcltQueueClearance` (계산은 `domains/queue` 클래스만 호출) |
| 원천 어댑터 | `FcltWtngDay.sourceOf` (체크인 · 출국장 공통, 10분 통계 기준) |
| 팝업 · 요청 경쟁 처리 | `dashboard/components/FcltQueueScenarioModal.tsx` · `hooks/useFcltQueueScenario.ts` |
| 일반 Dialog (포커스 트랩 · 복귀) | `components/ui/dialog.tsx` (`@radix-ui/react-dialog`) |

- **혼잡해소 시간은 처리 여객 평균 대기시간 예측(`WaitAvgForecast`), 대기확률·이론 대기시간은 M/M/s 정상상태값**이다.
  둘을 같은 라벨로 보여주지 않는다. 2026-10-24 전의 '대기인원 Q* 까지 유입/처리 차이 계산'은 대체됐다.
- 예측: 수량 s 를 평가시각 t 부터 적용하고 미래 시각 u 의 `[u−30, u)` 처리 여객 평균을 낸다. 창의 t 이전은 실제 처리 이력,
  이후는 1분 유체 FIFO 예측이다. 남은 대기자의 대기시간은 t 에서 0 으로 되돌리지 않는다(체크인은 FIFO 재구성,
  출국장은 10분 보존식 유입을 분 단위로 나눈 근사로 도착 시각을 얻는다). 해소 = W(u) < `normalUpperExclusiveSec` 인 첫 u.
  관측 W(t) 가 이미 미만이면 0분, 24시간 안에 못 닿으면 처리능력 ≤ 유입은 `UNREACHABLE`, 아니면 `UNAVAILABLE` 이다.
- '새로 줄 서면 대기'(`FcltQueueClearDto.nextWtngSec`, 2026-10-14)는 `(Q0+1)/(s·μ)` 다. Q0 를 반영하고 λ 와 무관해
  ρ ≥ 1 에서도 나온다. 정상상태 이론 대기와 다른 값이며, Q0 = 0 이면 0, 운영 0개면 `UNREACHABLE` 이다.
- λ·μ·Q0·s 는 **카드와 같은 관측구간 `[hhmm−30, hhmm)`** 에서 뽑고, 계산 기준시각(`baseDt`)은 평가시각 `hhmm`(Q0 스냅샷)이다
  (2026-10-24, 이전에는 `[hhmm, hhmm+30)` · 슬롯 끝). 화면은 기준시각에 30분을 더하지 않는다.
- 해소 기준은 혼잡등급 **NORMAL 상한의 배타적 초**(`normalUpperExclusiveSec`, 현재 2400초 = 40분 미만)다. 명 단위
  `targetQueueCnt` 는 환산 인원이 없어 `null` 이다. 기준정보가 없으면 실패로 내린다.
- 출국장은 카드와 같이 **SC+SR 합산을 한 큐**로 본다 (LGT 제외). 직렬·병렬 관계는 미검증이라 응답의 적용 가정에 싣는다.
- 추천 총수량은 목표 시간 H 안에 W < 목표가 되고(목표 시각 W 도 재확인) **s·μ > λ** 인 최소 s 다. 안정 하한은
  `floor(λ/μ)+1` 이라 λ=0 이어도 1 이상이다. 후보마다 같은 시작 상태에서 따로 예측하고(단조성 가정 없음) 0 부터
  포화 수량(대기열 + 분당 유입을 그 분에 다 처리하는 수량, 상한 100000)까지 훑는다. 포화 수량에서도 못 닿으면 `UNREACHABLE` 이다.
  `flowBasedReqCnt` 는 목표 인원이 없어 `null`, `stableAplyYn` 은 안정 하한 때문에 목표 시간만 맞는 최소 수량보다 커졌을 때 Y 다.
  기존 `FacilityQueueCalculator.estimateClearTimeSec` · `estimateRequiredServerCnt`(인원 목표)는 의미를 바꾸지 않고 남겨 두었다.
- **카드는 팝업 첫 화면(TIME 모드 · 목표 30분)과 같은 계산이다** (2026-10-17,
  [계획](docs/plans/2026-10-17-fclt-card-domain-queue.md)). 같은 `smltId` · 터미널 · `hhmm` · 시설에서 카드의
  대기열/예상인원 = 팝업 `wtngPsgCnt`, 카드 `reqCnt` = 팝업 `recommend.reqCnt`, 카드 해소 시각 = 팝업
  `scenario.cgnClearDt` 의 시각이어야 한다. 카드는 **평가시각 직전 30분 기준**이며 CAST 의 앞으로 올 피크를 보지 않는다.
  카드 `cgnStatus` · `cgnWtngSec` 는 팝업 `cgnStatus` · `wtngAvgSec` 와 같다.
  - 카드 처리율 중앙 숫자는 관측구간 처리인원의 시간당 환산, 링은 부하율 ρ = λ/(s·μ) 다. ρ ≥ 1 이면 링이 꽉 찬다
  - 추천이 보유 수량을 넘으면 카드는 자르지 않고 **추천 수량 가정** 해소값을 그린다. 최대수 전량 배정 결과(`totScenario`)는 팝업에만 있다
  - 혼잡해소 게이지는 `max(30 − 해소분, 0) / 30`. 산정 불가 값은 그 칸만 `-`
- 원천 변경 감지용 버전(`contextVersion` · `ctxChgYn`)은 두지 않는다 (2026-10-17 제거). 매 요청이 원천을 다시 읽어 계산한다.

---

## 15. 체크인 · 출국장 10분 대기 결과

CAST 결과 수신 커밋 후 실행 · 모델마다 `TN_PM_SMLT_FCLT_WTNG_RSLT`에 10분 기본 통계를 한 번 저장하고,
카드 · 맵 · 체크인 상세 · 혼잡해소 팝업 · 출국장 화면의 등급 · 추천 · 해소는 이 통계를 읽는 공통 평가
`domains/wtng/FcltWtngDay` 하나로 계산한다 ([설계 · 구현](docs/plans/2026-10-24-fclt-wtng-rslt-db-design.md) §12 · §14).

`TN_PM_SMLT_FCLT_WTNG_RSLT` 는 2026-10-26 컬럼을 줄였다. 시작 대기 · 도착은 앞 행 종료 대기로 도출하고 관측은 `OBSRVN_YN` 만 둔다 ([계획](docs/plans/2026-10-26-fclt-wtng-rslt-slim.md)).

이 테이블의 데이터 수치 컬럼은 표본 수 `WTNG_NOCS` 만 `NUMBER(2,0)`, 나머지 11개는 `NUMBER(12,0)` 을 쓴다. `WTNG_PSEC_SUM` · `PRCS_PSEC_SUM` 은 정수 초 합계다. 저장 · 조회 경계에서 소수 합계와 12자리 범위 초과를 거부하며, 평균 · 1분 분배의 소수 계산은 유지한다.

- 저장 결과가 없거나 기대 시설 · 범위를 채우지 못하면 응답에서만 Java로 계산해 같은 10분 구조로 평가한다. 보완 결과는 저장하지 않는다.
- 등급 문자열 · 추천 · 해소는 저장하지 않는다. 혼잡등급 기준표는 조회 시점 값이다.
- 같은 ID를 다시 산출하거나 저장 행을 지우는 경로, 계산 상태 테이블은 두지 않는다. 중복 삽입은 PK로 거부한다.
- 체크인 배정 부스는 운영표 직접 조회가 아니라 STNG CA 리소스(`retrieveChknBoothOperList`)를 분 단위로 읽는다.
- 요약보기 시간대별 차트 · PRIME TIME과 체크인 상세의 일일 KPI · 슬롯 지표는 기존 1분 경로를 유지한다.
- 공통 평가는 10분 경계 시각만 받는다. 조회 API는 경계가 아닌 `hhmm`을 조건 오류로 거절한다.
- 패키지 방향: `chkn` · `dsbd` → `wtng` → (루트) → `queue`. `wtng` 는 원천 계산 패키지를 참조하지 않는다
  ([계획](docs/plans/2026-10-25-domains-package-dependency.md)).
