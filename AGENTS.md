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
   - `CastConfigPreProcessDiffDto` · `CastConfigPreProcessRowDto` 는 2026-09-04 에 삭제됐다.
     전처리 비교·반영 화면이 운영 반영으로 흡수되면서 조회 API 자체가 없어졌다.
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
    endpoints.ts     API_ENDPOINTS (31개)
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
| 〃 | `CAST_CONFIG_OPER_APPLY` | `/cast-config/applyOperation` |
| 〃 | `CAST_CONFIG_PRE_PRCS_HSTRY` | `/cast-config/retrievePreProcessHistory` |
| 〃 | `CAST_CONFIG_PRE_PRCS_REVERT` | `/cast-config/revertPreProcess` |

Cast 설정 백엔드는 `CastConfigController` · `CastConfigServiceImpl` · `CastConfigMapper.xml` 에 있다.
데이터 모델은 `java/ddl/cast-ddl.sql` 의 `TN_PM_SMLT_FIX_ATRB_GROUP`(속성그룹=화면의 '카테고리')과
`TN_PM_SMLT_{PSG,SHOW_UP,SRVC}_ATRB` 를 따른다 — 이 세 테이블은 `FIX_ATRB_GROUP_ID` 가 PK 선두라
**카테고리가 데이터의 1차 축**이고, '기준정보'와 '테스트정보'는 서로 다른 그룹 ID 일 뿐이다.

**속성그룹 ID 중 두 개는 예약값이다.**

| ID | 뜻 | 누가 쓰나 |
|---|---|---|
| `001` | 기준정보. CAST 가 `PS001` 로 읽어 가는 **일일 시뮬레이션의 실제 입력** | 화면에서 셀 직접 편집 불가. 운영 반영으로만 바뀐다 |
| `999` | 전처리 결과. `data-processing/run_pipeline.py` 가 주단위로 전량 교체 | 읽기전용. 화면은 비교·반영에만 쓴다 |

- `TN_PM_SMLT_STNG.PRPT_SET_RSRC_ID` 는 CAST 가 결과에 실어 보내는 값을 서버가 **기록만** 하는 칸이다
  (`CastRestMapper.xml#insertSimSet`). 앱에서 일일 시뮬레이션이 쓸 PropertySet 을 바꿔 지정할 수 없고,
  **`001` 의 내용을 바꾸는 길뿐이다.**
- 반영 대상 행은 카탈로그 `TN_PM_SMLT_PSG_FIX_PARA_CD.PRE_PRCS_YN = 'Y'` 로 가른다.
  파이프라인에 태스크를 더하면 `java/ddl/2026-09-02-atrb-pre-process.sql` (2) 의 코드 목록도 함께 늘린다.
- 반영은 `TN_PM_SMLT_ATRB_APLY_HSTRY(_DTL)` 에 **적용 직전 값을 먼저 스냅샷**한 뒤 복사한다.
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

체크인카운터는 슬롯과 별개로 시간대별 자원 배열(`rsrcList`, 24칸)을 함께 내려준다 —
차트 보기가 하루 흐름(자원 운영량 + 대기인원)을 그리고, 표 보기가 슬롯 한 칸을 읽는다.
구 메뉴의 `셀프체크인/백드롭` 은 별도 화면·API 가 아니라 이 응답의 아일랜드 자원(`kioskCnt`,
`bagDropCnt`)으로 흡수됐다 (사용자 시뮬레이션 탭이 합쳐진 것과 같은 이유다).

**CAST 가 가져가는 일일 자료(`001`)의 기준일자는 서버가 정해 `#{baseYmd}` 로 바인딩한다.**
CAST 는 `REQ_GetResource` 요청에 날짜를 싣지 않는다 — 본문이 `@RequestBody String` 으로 들어와
`resourceType` · `resourceID` 두 개만 파싱되므로 서버가 채우는 수밖에 없다. 결정 지점은
`CastRestServiceImpl.resolveBaseYmd()` 하나뿐이고, **mapper 에 `SYSDATE` 를 기준일자로 다시 쓰지
않는다** (`LastModified` 표기·ID 채번용은 예외). 테스트 중에는 `FIXED_BASE_YMD` 상수로 고정하고,
비우면 당일로 떨어진다. 사용자 자료(`002~999`)는 발행 시점에 `#{excnYmd}` 로 행에 굳으므로
이 값과 무관하다 (§11.2).

시설 운영시간 3종(`retrieveFcltyOpngTblDptg` · `..Immig` · `..TrnstScrtyCntrl`)은 날짜를
`TN_PM_SMLT_SCHDL_ATRB` 의 그룹 행에서 꺼내는데, **일일(`001`) 그룹을 채우는 주체가 없어**
`NVL(…, #{baseYmd})` 로 받는다. NVL 을 걷어내면 서브쿼리가 NULL → `BETWEEN` 이 false 라
운영시간표가 **에러 없이 빈 채로** 발행된다.

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
**주기의 주체는 CAST다. 서버는 요청을 등록해 두고 기다릴 뿐 아무것도 선점하지 않는다.**

- 일일 시뮬레이션: 약 30분 주기
- 사용자 시뮬레이션: CAST가 약 1분 주기로 `REQ_GetResource.do` 를 polling 하고,
  `SMLT_STTS = 'New'` 인 행이 보이면 `REQ_SetResource.do` 로 `Executing` 을 통보한다

이 참조 사본에는 스케줄러가 없고, **앞으로도 두지 않는다** (§11.6 마지막 항목).

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
- 위 테이블은 편집용 draft다. **실행 버튼을 누른 시점에 `CastUserSnapshotService.publish()` 가
  CAST 리소스로 굳힌다.** 이후 draft 를 고쳐도 발행분은 변하지 않는다.

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

**`CA` · `SBD` 는 리소스 안에서 `BLCK_ID` 로 CAST 블록이 갈린다.** `CA` 는
`DOM_INTL_SE_CD` 에 따라 `P01CKINInt` / `P01CKINDom` / `P03CKIN`, `SBD` 는 백드롭이
`P01SBD` / `P03SBD` 이고 키오스크가 `P01Self` / `P03Self` 다. 발행(`CastUserSnapshotMapper.xml`)과
조회(`CastRestMapper.xml`)가 같은 값을 써야 하며, 한쪽만 고치면 블록이 통째로 비거나 뒤바뀐다.
`SBD` 의 `AirlineCode` 는 `ALN_CD` 가 아니라 **`CHKN_TYPE_DTL_INFO`** 에서 나온다.

PropertySet은 `TN_PM_SMLT_FIX_ATRB_GROUP`과 `TN_PM_SMLT_{PSG,SHOW_UP,SRVC}_ATRB`를 사용하고,
시설운영 GenericTable은 각 시설운영 `MSTR/ATRB`를 사용한다. 결과의 일일/사용자 구분은 `001`이
아니라 CAST 결과 ResourceID의 `Auto` / `WhatIf` 문자열로 판단하는 기존 코드가 있으므로 두 규칙을
혼동하지 않는다.

**사용자 리소스 번호는 `002 ~ 999` 를 도는 단순 증가 번호다.** `SQ1_TN_PM_SMLT_USER_RSRC`
(`MINVALUE 2 MAXVALUE 999 CYCLE`) 하나를 **FS · CA · SBD · 시설운영이 공유**한다.
한 요청이 `FS007 · CA007 · SBD007 · …DepartureGate007 · …SecurityControl007` 을 통째로 받는다.

> 타입별로 번호를 따로 돌리면 `CastRestMapper.xml#retrieveFcltyOpngTblDptg` 가 깨진다 —
> 그 SQL 이 **출국장 번호로 `TN_PM_SMLT_SCHDL_ATRB.SCHDL_ATRB_GROUP_ID` 를 뒤져** 대상 일자를
> 찾기 때문이다. FS 번호와 출국장 번호는 반드시 같아야 한다.

번호가 한 바퀴 돌아 겹치면 발행 시 `DELETE → INSERT` 로 갈아 끼운다. 테이블은 타입당 998행으로
유계라 누적되지 않는다.

### 11.4 실행·결과 테이블의 역할

| 테이블 | 역할 |
|---|---|
| `TN_PM_SMLT_STNG` | 날짜·터미널·모델·입력 리소스 ID를 가진 실행 세트 |
| `TN_PM_SMLT_USER_MSTR` | CAST가 읽는 사용자 WhatIf 실행 요청·상태 |
| `TH_PM_SMLT_FLFMT_HSTRY` | 화면 모니터링용 수행이력과 시작·종료 상태 |
| `TN_PM_SMLT_RSLT_DTL` | 시설·시각별 대기·처리 결과 |
| `TN_PM_SMLT_RSLT_DTL_REG_EXCL` | 시설코드 매핑 제외 결과 |

**"SMLT_ID" 라는 이름이 원래 네 가지를 가리켰다.** 지금은 각각 다른 이름을 쓴다.

| 이름 | 무엇 | 타입 | 어디에 |
|---|---|---|---|
| `SMLT_REQ_ID` | 실행 요청 1건. CAST가 `WhatIfRunID` 로 읽어 간다 | `VARCHAR2(100)` | `TN_PM_SMLT_USER_MSTR` PK |
| `SMLT_ID` | 편집 draft 묶음. 재실행해도 안 바뀐다 | `VARCHAR2(8)` | `TN_PM_SMLT_USER_*` |
| `SMLT_FLFMT_SN` | `SMLT_ID` 안의 수행 회차 | `NUMBER(5)` | `TH_PM_SMLT_FLFMT_HSTRY` PK 후미 |
| `RSLT_SMLT_ID` | CAST 결과가 만든 실행 세트 | `VARCHAR2(8)` | `TN_PM_SMLT_STNG` |

```
SMLT_ID (draft)
  └─1:N─ SMLT_FLFMT_SN (수행 회차)
           └─1:1─ SMLT_REQ_ID (실행 요청)
                    └─0:1─ RSLT_SMLT_ID (결과 세트)
```

`SMLT_REQ_ID` 는 `'WI' + SMLT_ID + TMNL_ID + LPAD(SMLT_FLFMT_SN, 4, '0')` 로
`(draft, 터미널, 회차)` 에서 결정론적으로 만든다 — 예: `WI20260827P010001`.
그래서 유니크 제약이 그대로 중복 실행 방어가 된다.

**결과와 요청은 리소스 번호로 잇는다.** CAST는 결과 XML 의 `Run` 섹션에 자기가 쓴 입력 리소스
ID를 그대로 실어 보내고(`RUN_MAP` 이 파싱), 요청마다 새 FS 번호를 발행하므로
`FlightScheduleResourceID` 가 곧 요청 식별자다. `SimulationResultSuffix` 왕복 같은 추가 계약을
CAST에 요구하지 않는다.

### 11.5 구현 현황

연계 코드는 2026-08-27 에 작성했다. 설계 근거와 결정 이력은
`docs/plans/2026-08-27-user-smlt-cast-linkage.md` 에 있다.

**작성된 경로** — 관련 코드를 만질 때 참고할 진입점.

| 흐름 | 어디 |
|---|---|
| 실행 등록 (조건검사 → snapshot → 이력 → 요청) | `CastUserSmltServiceImpl.executeUserSmlt()` |
| snapshot 발행 | `CastUserSnapshotServiceImpl` + `CastUserSnapshotMapper.xml` |
| CAST 조회 (`New` 건만) | `CastRestMapper.xml#retrieveWhatIfCntrl` |
| 상태 전이 | `CastRestServiceImpl.updateWhatIf()` |
| 결과 → 요청·이력 연결 | `CastRestServiceImpl.insertResult()` · `closeUserReq()` |
| 상태 매핑 | `UserSmltReqStatus.toExecStatus()` |

**아직 아닌 것 — 구현된 것으로 가정하지 말 것.**

1. **`ddl/2026-08-27-user-smlt-alter.sql` 은 적용 전이다.** mapper 를 기준으로 썼으므로
   실 스키마를 `ALL_TAB_COLUMNS` 로 조회해 §11.7 의 불일치를 먼저 확정해야 한다.
2. FS snapshot 의 `GOOWN.TN_GO_GD_DATA` 원천에서 **부속 컬럼 9종**(`ALN_CTGRY`, `GATE_TYPE`,
   `SLF_CHKN_PSBLTY_YN` 등)을 확인하지 못해 NULL 로 둔다. `CastUserSnapshotMapper.xml` 상단
   TODO 에 나열돼 있다. 일일 리소스가 `FSxxx` 면 전 컬럼 복사라 해당 없다.
3. SBD snapshot 의 키오스크(`KOS_CNT`)는 `TN_PM_SLF_CHKN_OPER_PLCY` 에서 발행하지만,
   그 테이블에 아일랜드 컬럼이 없어 `SLF_CHKN_ISTR_ID` 앞 한 자를 아일랜드로 가정한다.
   실 기기 ID 체계가 다르면 키오스크가 0건으로 발행된다. `TN_PM_SMLT_SBD_ATRB.CKNCT_ID` 가
   `VARCHAR2(4)` 라 기기 ID 가 4자를 넘어도 깨진다.
4. WhatIf 설정이 없으면 사용자 화면이 일일 `SMLT_ID` 를 fallback 으로 쓴다.
   사용자 실행용 `TN_PM_SMLT_STNG` 신규 채번은 아직 없다.
5. `Executing` 상태로 멈춘 요청을 회수하는 경로가 없다 (§11.6 마지막 항목).

### 11.6 상태 모델과 Polling 규칙

`TN_PM_SMLT_USER_MSTR.SMLT_STTS` 는 **CAST가 보내는 문자열 4개를 그대로** 값으로 쓴다.
자체 코드를 따로 두지 않는다. NOT NULL + CHECK 제약으로 강제한다.

```
New       → Executing | Failed
Executing → Finished | Failed
Finished  → (종착)
Failed    → (종착)
```

세 축을 하나로 합치지 않는다. 접는 지점은 `UserSmltReqStatus.toExecStatus()` 한 곳뿐이다.

| `SMLT_STTS` | `TH_PM_SMLT_FLFMT_HSTRY.SMLT_FLFMT_STTS_CD` | 화면 `SmltExecStatus` |
|---|---|---|
| `New` · `Executing` | `RUNNING` | `RUNNING` |
| `Finished` | `DONE` | `DONE` |
| `Failed` | `FAILED` | `FAILED` |

지켜야 할 것.

- 실행 등록은 요청 ID 채번, snapshot 발행, `New` 등록, 수행이력 연결을 **한 트랜잭션**으로 처리한다.
- **서버는 선점하지 않는다.** CAST가 polling 하고 `Executing` 을 통보한다.
  대신 `retrieveWhatIfCntrl` 에 `WHERE SMLT_STTS = 'New'` 를 반드시 건다 —
  필터가 빠지면 완료 건까지 매번 다시 실행 대상이 된다.
- **모든 전이는 이전 상태를 조건에 건 CAS UPDATE** 로 한다. 영향 0행은 이미 다른 경로가
  전이시킨 것이므로 에러가 아니라 무시한다.
- 중복 실행 방어는 사전 검사가 아니라 `TN_PM_SMLT_USER_MSTR_UX_ACTIVE` (미완료 건에만 걸리는
  부분 유니크 인덱스) 가 한다. 사전 검사는 친절한 메시지용이다.
- **상태 응답에 없는 master 행을 삭제하지 않는다.** full snapshot 계약이 확인되지 않았고,
  방금 등록된 `New` 요청이 다음 응답에 못 들어가면 그대로 사라진다.
- 결과 수신은 idempotent해야 한다. `RSLT_SMLT_ID` 가 이미 있으면 저장을 건너뛴다.
  결과 저장과 요청·수행이력 완료 갱신은 같은 트랜잭션이다.
- 완료 master와 리소스 snapshot은 보존 기간 전에 삭제하지 않는다 — 실행 조건을 재현해야 한다.
- **`LISTAGG` 는 NULL 셀을 배열에서 통째로 빼 뒤 값을 한 칸 당긴다.** `NVL(…, ' ')` 로 자리를
  채우고 정렬 기준을 전 컬럼 동일하게 맞춰야 행 대응이 유지된다.
- **감시 배치를 두지 않는다.** CAST가 `Executing` 으로 바꾼 뒤 죽으면 `UX_ACTIVE` 때문에 그
  (draft, 터미널) 의 재실행이 막힌다. 수동 복구 SQL 은
  `java/ddl/2026-08-27-user-smlt-alter.sql` 말미에 주석으로 있다.

### 11.7 DDL과 Mapper 정합성 주의

`java/ddl/cast-ddl.sql` 은 **원본 스키마가 아니라 사진 판독 + 표준단어 치환본**이다
(`TN_PM_SMLT_USER_MSTR` 블록에는 `source photo … out of focus` 주석까지 있다).
**DDL만 믿고 구현하지 않는다.**

아래 불일치는 **mapper 기준으로 `java/ddl/2026-08-27-user-smlt-alter.sql` 에 반영했지만,
실 스키마 조회로 확정하기 전에는 적용하면 안 된다.**

| 불일치 | 처리 |
|---|---|
| `TN_PM_SMLT_USER_MSTR` 에 `FCLTY_OPNG_{SCRTY,TR_SCRTY}_CNTRL_RSRC_ID` 없음 | ALTER 로 추가 |
| `TN_PM_SMLT_STNG` 에 `PRPT_SET_RSRC_ID`·`MDL_RSRC_ID`·`EXCN_ID`·`CKNCT_SRVC_HR_RSRC_ID`·`CHKN_TYPE_RSRC_ID`·`FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID` 없음 | ALTER 로 추가 |
| `TN_PM_SMLT_RSLT_DTL` 에 `AVG/MIN/MAX_WTNG_LEN` 없음 + PK 에 `PSG_FCLT_CD` 누락 | ALTER 로 추가·재정의 |
| 사용자 master `SMLT_ID` 가 `VARCHAR2(100)` (다른 곳은 `VARCHAR2(8)`) | `SMLT_REQ_ID` 로 개명해 분리 |
| 사용자 상세·실행이력 FK 없음 | `UK1` + FK 추가 |

**여전히 미해결.**

- DDL의 `CKNCT_TYPE_CNTRL_RSRC_ID` 는 아무도 읽지 않는다. 컬럼만 유지하고 WhatIf 조회에는
  넣지 않았다 — CAST가 안 쓰는 칸을 새로 내보내면 파싱이 깨질 수 있다.
- **`EMI`/`IMMI` 의 의미가 두 DDL 주석에서 반대다.** `TN_PM_SMLT_STNG` 은 `EMI` 를 "입국심사"로,
  `TN_PM_SMLT_USER_MSTR` 은 같은 원본명을 "출국(DPTCNY)"으로 적었다. 출국심사·입국심사는
  사용자가 편집하지 않아 **일일 값을 그대로 승계**하므로 지금은 막히지 않지만,
  그 축을 편집 대상으로 만들 때는 반드시 먼저 확정한다.
- `SQ1_TN_PM_SMLT_RSLT` 의 정의를 확인하지 못했다. `TN_PM_SMLT_STNG.SMLT_ID` 가 `VARCHAR2(8)`
  이라 시퀀스가 8자리를 넘기는 순간부터 INSERT 가 깨진다.

**DTO 필드명이 컬럼명과 어긋나면 `mapUnderscoreToCamelCase` 가 못 채워 조용히 null 이 된다.**
`SmltStngDto` 의 `fcltyOpngTbl*` 4종이 그랬고 출국장 검색대 수가 안 나왔다. 새 DTO를 만들 때
컬럼 별칭과 필드명을 반드시 대조한다.

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
