# CLAUDE.md — PM 예측관리 프로젝트 가이드

인천국제공항 통합정보시스템 **PM(예측관리)** 화면. 여객 혼잡도를 시뮬레이션하고 그 결과를 보여준다.

- `react/` — 화면 (Vite + React 19 + TypeScript). **이 레포에서 실제로 빌드하는 대상**
- `java/` — 백엔드 **참조 사본**. 빌드 파일(pom/gradle)이 없고 디렉터리(`java/cast/…`)가
  패키지(`aoms.pm.cast…`)와 맞지 않는다. **여기서 컴파일할 수 없다** — 읽기·대조용
- `svgFromDesigner/` — 디자이너 원본 SVG

---

## 1. 화면과 라우트

| 화면 | 라우트 | 폴더 |
|---|---|---|
| 요약보기(대시보드) | `/rui/pm`, `/rui/pm/daily-smlt/dashboard` | `modules/pm/pages/dashboard` |
| 맵형태보기 | `/rui/pm/daily-smlt/terminalMap` | `modules/pm/pages/terminalMap` |
| 체크인카운터 | `/rui/pm/daily-smlt/checkinCounter` | `modules/pm/pages/checkinCounter` |
| 출국장 | `/rui/pm/daily-smlt/departureHall` | `modules/pm/pages/departureHall` |
| 사용자 시뮬레이션 조건설정 | `/rui/pm/user-smlt/config` | `modules/pm/pages/userSmlt` |
| 시뮬레이션 모니터링 | `/rui/pm/smlt-monitoring` | `modules/pm/pages/monitoring` |

앱 base 는 `/rui/`. 라우팅·프리로드는 `src/App.tsx`.

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
2. **enum 문자열 값**
   `'T1'|'T2'` · `'Y'|'N'` · `'FREE'|'NORMAL'|'BUSY'|'VERY_BUSY'` ·
   `'CHKN'|'SLFCHKN'|'DEP'|'SC'|'CMRC'` · `'PSG'|'FLT'` · `'DAILY'|'USER'` ·
   `'RATIO'|'HOURLY'` · `'DONE'|'RUNNING'` · `'WEEKDAY'|'PRE_WEEKEND'|'WEEKEND'|'HOLIDAY'`
3. **모든 `className` 문자열** — CSS 와 1:1로 묶여 있다
4. **CSS 커스텀 프로퍼티** — `--i1`~`--i6`, `--gut`, `--col`, `--rgt`, `--x`, `--y`,
   `--stage-ar`, `--oper-cols`, `--scale`, `--app-w/h/x/y`, `--pm-header-h`, `--line-wait`, `--val`, `--slots`
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
    endpoints.ts     API_ENDPOINTS (22개)
    result.ts        unwrap() — 본문 error 플래그를 catch 경로로 던진다
    services/*.service.ts   도메인별 서비스 객체 (목업/실통신 분기도 여기서)
    mock/            USE_MOCK 토글 + 화면별 목업 데이터
  components/
    charts/EChart.tsx        ECharts 래퍼
    icons/index.tsx          SVGR 배럴 (<SearchIcon /> 형태, 55개)
    icons/InlineIcon.tsx     인라인 SVG 레지스트리 (<Icon name="search" /> 형태)
    lnb/                     좌측 네비게이션 (배럴 있음)
    ui/                      kebab-case: alert-dialog, dialog-provider,
                             loading-bar, pill-select, time-range-selector
  config/env.ts      ENV (import.meta.env 래핑)
  hooks/             usePageScope, useUserInfo, useBaseInfo, useErrorAlert, useFetched
  lib/               chart, dialog, echarts, format, loading-bar, time-range
  modules/pm/
    hooks/useTimeline.ts     타임라인 (맵형태보기 · 출국장 공용)
    types/map.types.ts       도면 공용 타입 (마커 · 혼잡 알림 · 터미널)
    pages/<화면>/
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
- **불필요한 주석 금지.** 코드가 무엇을 하는지 설명하는 주석(변수·함수명으로 이미 드러나는 내용),
  작업 이력·호출자 설명("~때문에 추가", "~에서 사용")은 달지 않는다. 없어도 읽는 사람이 헷갈리지
  않으면 주석을 달지 않는다. 예외적으로 남길 만한 것은 코드만 봐서는 알 수 없는 이유
  (숨은 제약, 특정 버그의 우회, 서버 쪽 비정상 동작에 대한 대응)뿐이고 그마저도 한 줄로 짧게.

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
- 기준 파일: `pages/departureHall/components/Header.tsx`

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

**서버는 처리 실패도 HTTP 200 으로 내려보내고 본문의 `error` 플래그로 알린다.**
그래서 모든 조회는 `unwrap(dto, fallback)` 을 거쳐 통신 실패와 같은 catch 경로로 흘려보낸다.

**맵형태보기 · 출국장 · 체크인카운터는 하루치를 한 번에 받는다.** 세 응답 모두 30분 슬롯
배열(`slotList`)을 갖고, 화면은 타임라인 시각(`hhmm`)으로 슬롯을 찾아 읽는다. 그래서 조회 조건은
`smltId` + `tmnlId` 뿐이고 **눈금 이동·재생·마커 팝업은 서버를 부르지 않는다**.

체크인카운터는 슬롯과 별개로 시간대별 자원 배열(`rsrcList`, 24칸)을 함께 내려준다 —
차트 보기가 하루 흐름(자원 운영량 + 대기인원)을 그리고, 표 보기가 슬롯 한 칸을 읽는다.
구 메뉴의 `셀프체크인/백드롭` 은 별도 화면·API 가 아니라 이 응답의 아일랜드 자원(`kioskCnt`,
`bagDropCnt`)으로 흡수됐다 (사용자 시뮬레이션 탭이 합쳐진 것과 같은 이유다).

---

## 9. 알아 두면 좋은 것

- **화면은 한 화면에 꽉 차게 짜여 있다.** `.wrap` / `.body` 가 `flex:1` 로 남은 높이를 먹는다.
  flex 사슬이 한 번이라도 끊기면 안쪽 높이가 auto 로 풀려 하단 버튼이 화면 밖으로 밀려난다.
- 대시보드만 `useFitToScreen` 으로 1920×1010 디자인을 뷰포트에 맞춰 축소한다(`--scale`).
- 조회 버튼은 **조건이 그대로여도 다시 조회**해야 한다. 그래서 `useFetched` 는
  조건을 값이 아니라 **참조**로 비교한다 (새 객체를 만들면 다시 조회된다).
- 아이콘 체계가 두 가지다 — 파일 기반 `@/components/icons` 와
  인라인 레지스트리 `@/components/icons/InlineIcon`. 둘은 배럴을 공유하지 않는다.
- `java/` 를 고쳤다면 실제 백엔드 레포에서 빌드해야 한다. 여기서는 컴파일 검증이 안 된다.
