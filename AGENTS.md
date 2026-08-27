# AGENTS.md — PM 예측관리 프로젝트 가이드

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
  함수 위 요약 doc 주석(`/** ... */`)도 같은 기준 — 코드를 읽으면 알 수 있는 동작 설명은 쓰지 않는다.
- **건드리는 파일은 지나가는 김에 정리한다.** 어떤 이유로든 파일을 열어 수정하게 되면, 그 파일 안에서
  위 기준에 걸리는 기존 주석(동작을 그대로 풀어 쓴 줄 주석, 요약 doc 주석 등)도 함께 지운다.
  요청과 무관해 보여도 같은 파일을 만졌다면 정리 대상이다. 다만 **이 규칙 때문에 지금 당장 전체
  파일을 훑어 지울 필요는 없다** — 다음에 그 파일을 다룰 일이 생겼을 때 정리하면 된다.

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
| 시설물 매핑 | `FCLT_MAP_LIST` / `_SAVE` | `/fclt/retrieveFcltMapList` · `saveFcltMapList` |
| Cast 설정 | `CAST_CONFIG_GROUP_LIST` | `/cast-config/retrieveGroupList` |
| 〃 | `CAST_CONFIG_DATASET` | `/cast-config/retrieveDataset` |
| 〃 | `CAST_CONFIG_SAVE` | `/cast-config/saveDataset` |
| 〃 | `CAST_CONFIG_CATEGORY_LIST` | `/cast-config/retrieveCategoryList` |
| 〃 | `CAST_CONFIG_CATEGORY_SAVE` | `/cast-config/saveCategory` |
| 〃 | `CAST_CONFIG_DEFAULT_APPLY` | `/cast-config/applyDefaultAttribute` |
| 〃 | `CAST_CONFIG_EXCEL_UPLOAD` | `/cast-config/uploadExcel` (multipart) |

**Cast 설정은 아직 백엔드가 없다** (`java/` 에 `cast-config` 컨트롤러 없음). 목업으로만 돈다.
데이터 모델은 `java/ddl/cast-ddl.sql` 의 `TN_PM_SMLT_FIX_ATRB_GROUP`(속성그룹=화면의 '카테고리')과
`TN_PM_SMLT_{PSG,SHOW_UP,SRVC}_ATRB` 를 따른다 — 이 세 테이블은 `FIX_ATRB_GROUP_ID` 가 PK 선두라
**카테고리가 데이터의 1차 축**이고, '기준정보'와 '테스트정보'는 서로 다른 그룹 ID 일 뿐이다.

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

## 11. 사용자 시뮬레이션 저장·실행과 CastRest 연계

### 11.1 전체 흐름

사용자 시뮬레이션은 **편집 중인 현재상태**, **실행 요청**, **CAST 입력 리소스**, **수행이력·결과**를
구분해야 한다.

```text
사용자 조건 저장
  → TN_PM_SMLT_USER_* 편집 데이터
  → 실행 시점의 불변 CAST 리소스 발행
  → TN_PM_SMLT_USER_MSTR 실행 요청 등록
  → 외부 CAST가 WhatIfDefinitionTable 조회
  → FS/CA/SBD/PropertySet/시설운영 리소스 조회
  → CAST 실행
  → REQ_SetResource 결과·상태 수신
  → TN_PM_SMLT_STNG / TN_PM_SMLT_RSLT_DTL 저장
  → TH_PM_SMLT_FLFMT_HSTRY 완료 처리
```

`java/castrest` 는 CAST를 호출하는 클라이언트가 아니라 **외부 CAST가 호출하는 서버 도메인**이다.
이 참조 사본에는 30분·1분 스케줄러가 없다. 운영상 다음 두 주기는 외부 CAST 또는 별도 스케줄러와의
계약으로 본다.

- 일일 시뮬레이션: 약 30분 주기
- 사용자 시뮬레이션: 약 1분 주기로 `TN_PM_SMLT_USER_MSTR` 기반 WhatIf 실행 요청 확인

### 11.2 사용자 현재상태 저장 테이블

| 영역 | 테이블 | 저장 방식 |
|---|---|---|
| 운항·여객 | `TN_PM_SMLT_USER_FLT_PSG_AJMT` | `(SMLT_ID, TMNL_ID)` 헤더 upsert |
| 〃 | `TN_PM_SMLT_USER_FLT_PSG_TMZN_AJMT` | 시간대별 조정률 전체 교체 |
| 체크인 | `TN_PM_SMLT_USER_CHKN_ISL` | 아일랜드 기본값 전체 교체 |
| 〃 | `TN_PM_SMLT_USER_CHKN_OPER_HR` | 운영시간 전체 교체 |
| 〃 | `TN_PM_SMLT_USER_CHKN_BOOTH` | 부스별 항공사 배정 전체 교체 |
| 출국장 | `TN_PM_SMLT_USER_DPTGT` | 출국장 운영·검색대 수 전체 교체 |
| 〃 | `TN_PM_SMLT_USER_DPTGT_OPER_HR` | 출국장 운영시간 전체 교체 |
| 〃 | `TN_PM_SMLT_SCSH_OPER_PLAN` | 시간대별 보안검색대 운영계획 전체 교체 |

- 운항·여객 저장은 개별 운항편을 직접 수정하지 않고 전체·시간대별 **조정률**만 저장한다.
- 체크인과 출국장은 `(SMLT_ID, TMNL_ID)` 범위의 자식 테이블을 먼저 삭제하고 부모를 삭제한 뒤,
  부모부터 자식을 다시 넣는 전체 교체 방식이다.
- 세 탭 저장은 서로 다른 API·트랜잭션이다. 세 영역 전체를 한 번에 원자적으로 저장하지 않는다.
- 위 테이블은 편집용 draft다. 실행 요청 후 수정 가능성을 고려해 CAST 실행에는 클릭 시점 snapshot을
  발행하는 구조가 필요하다.

### 11.3 CastRest 리소스 계약

CAST 진입점 prefix 는 `/castrest/rest/json` 이다.

| API | 역할 |
|---|---|
| `REQ_GetResourceInformation.do` | CAST에 제공 가능한 리소스 목록 반환 |
| `REQ_GetResource.do` | 선택한 ResourceType/ResourceID의 실제 데이터 반환 |
| `REQ_SetResource.do` | CAST 모델·WhatIf 상태·시뮬레이션 결과 수신 |

`001` suffix 가 일일 운영자료를 뜻하는 exact 분기는 현재 `FS001`, `CA001`, `SBD001` 세 개다.
비 `001` 리소스는 각각 다음 사용자/설정 리소스 테이블을 읽는다.

| 리소스 | `001` 소스 | 비 `001` 소스 |
|---|---|---|
| `FS` | GO/CA 운영계 운항자료 | `TN_PM_SMLT_SCHDL_MSTR/ATRB` |
| `CA` | GO 일일 체크인 배정 | `TN_PM_SMLT_CKNCT_MSTR/ATRB` |
| `SBD` | 셀프체크인·백드롭 운영자료 | `TN_PM_SMLT_SBD_MSTR/ATRB` |

PropertySet은 `TN_PM_SMLT_FIX_ATRB_GROUP`과 `TN_PM_SMLT_{PSG,SHOW_UP,SRVC}_ATRB`를 사용하고,
시설운영 GenericTable은 각 시설운영 `MSTR/ATRB`를 사용한다. 결과의 일일/사용자 구분은 `001`이
아니라 CAST 결과 ResourceID의 `Auto` / `WhatIf` 문자열로 판단하는 기존 코드가 있으므로 두 규칙을
혼동하지 않는다.

### 11.4 실행·결과 테이블의 역할

| 테이블 | 역할 |
|---|---|
| `TN_PM_SMLT_STNG` | 날짜·터미널·모델·입력 리소스 ID를 가진 실행 세트 |
| `TN_PM_SMLT_USER_MSTR` | CAST가 읽는 사용자 WhatIf 실행 요청·상태 |
| `TH_PM_SMLT_FLFMT_HSTRY` | 화면 모니터링용 수행이력과 시작·종료 상태 |
| `TN_PM_SMLT_RSLT_DTL` | 시설·시각별 대기·처리 결과 |
| `TN_PM_SMLT_RSLT_DTL_REG_EXCL` | 시설코드 매핑 제외 결과 |

사용자 실행은 편집용 `SMLT_ID`와 별도로 고유한 실행 요청 ID를 가져야 한다. 동일 조건의 재실행을
구분할 수 있도록 최소한 `REQUEST_ID`, 원본 `SMLT_ID`, `TMNL_ID`, `SMLT_FLFMT_SN`의 관계가 필요하다.
`TN_PM_SMLT_USER_MSTR`의 리소스 ID는 실행 시점에 발행한 불변 FS/CA/SBD/시설운영 snapshot을 가리켜야
한다.

### 11.5 현재 구현에서 연결되지 않은 부분

아래 항목은 **설계상 필요한 흐름이지 현재 완료된 기능이 아니다.** 관련 코드를 수정할 때 구현된
것으로 가정하지 말고 반드시 다시 확인한다.

1. `executeUserSmlt()`는 현재 `TH_PM_SMLT_FLFMT_HSTRY`에 `RUNNING` 이력만 넣는다.
   `TN_PM_SMLT_USER_MSTR`에 대한 INSERT/MERGE는 없다.
2. `TN_PM_SMLT_USER_*` 편집 데이터를 `TN_PM_SMLT_SCHDL_*`, `TN_PM_SMLT_CKNCT_*`,
   `TN_PM_SMLT_SBD_*`, 시설운영 리소스로 snapshot 발행하는 mapper/service가 없다.
3. `TH_PM_SMLT_FLFMT_HSTRY`를 `DONE`으로 바꾸거나 종료일시를 기록하는 경로가 없다.
4. 조건 존재 검사는 운항·체크인·출국장 부모 테이블 count의 합만 확인한다. 세 영역 중 하나만
   저장돼도 실행할 수 있고 자식 데이터 완결성·동일 snapshot 여부는 검증하지 않는다.
5. WhatIf 설정이 없으면 사용자 화면이 Auto/일일 `SMLT_ID`를 fallback으로 사용한다. 사용자 실행용
   신규 ID가 확정되기 전에는 일일 ID와 사용자 draft·이력이 섞일 수 있다.
6. CastRest 결과는 별도 sequence로 새 `TN_PM_SMLT_STNG.SMLT_ID`를 만든다. 사용자 요청 ID 및
   `SMLT_FLFMT_SN`과 결과 ID를 잇는 명시적 연결이 없다.

### 11.6 Polling·상태 처리 시 지켜야 할 것

- 실행 등록은 고유 요청 ID 채번, CAST 리소스 snapshot 발행, `TN_PM_SMLT_USER_MSTR`의 `QUEUED`
  등록, 수행이력 연결을 한 트랜잭션으로 처리한다.
- Poller는 대기 상태만 원자적으로 claim해야 한다. 상태 필터 없는 전체 조회나 lock 없는 선점은
  중복 실행을 만든다.
- `SMLT_STTS`는 NULL이 아니어야 하며 `QUEUED → EXECUTING → DONE/FAILED` 같은 허용 상태와 전이를
  명확히 정의한다. CAST의 상태 문자열과 화면의 `RUNNING`/`DONE`은 별도 매핑한다.
- 상태 응답에 포함되지 않은 master 행을 곧바로 삭제하지 않는다. 현재 CastRest에는 미포함 행을
  삭제하는 동기화 코드가 있으므로 full snapshot 계약이 확실하지 않으면 제거하거나 범위를 제한한다.
- 결과 수신은 idempotent해야 한다. 결과 저장과 master·수행이력 완료 갱신을 같은 트랜잭션으로 묶는다.
- 실행된 조건을 재현해야 하므로 완료 master와 리소스 snapshot은 보존 기간 전에는 삭제하지 않는다.
- `LISTAGG`로 여러 nullable 컬럼을 각각 배열화하면 NULL 누락과 정렬 차이로 행 대응이 깨질 수 있다.
  동일 정렬·NULL 표현을 강제하거나 행 단위 표현으로 바꾼다.

### 11.7 DDL과 Mapper 정합성 주의

현재 `java/ddl/cast-ddl.sql`과 mapper에는 확인된 불일치가 있다. Java는 참조 사본이라 실제 백엔드
스키마를 함께 확인해야 하며, 현재 DDL만 믿고 구현하지 않는다.

- `TN_PM_SMLT_USER_MSTR` DDL에는 mapper가 조회하는
  `FCLTY_OPNG_SCRTY_CNTRL_RSRC_ID`, `FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID`가 없다.
- 반대로 DDL의 `CKNCT_TYPE_CNTRL_RSRC_ID`는 WhatIf 조회 결과에 포함되지 않는다.
- `TN_PM_SMLT_STNG`의 DDL과 mapper는 일부 리소스 컬럼의 존재 여부와 `EML/IMM` 대 `EMI/IMMI`
  이름이 다르다.
- 사용자 master의 `SMLT_ID`는 `VARCHAR2(100)`인데 사용자 상세·설정·이력·결과의 `SMLT_ID`는
  주로 `VARCHAR2(8)`이다.
- DDL에 사용자 상세/실행이력 관계를 강제하는 FK가 없다. 논리 관계만 믿지 말고 실행 요청 ID와
  참조 무결성을 스키마로 명시한다.

사용자 시뮬레이션 실행 관련 작업의 우선순위는 **DDL·mapper 정합화 → 실행 ID·상태 모델 확정 →
사용자 draft의 CAST snapshot 발행 → USER_MSTR 등록 → 상태·결과·수행이력 연결** 순서다.
