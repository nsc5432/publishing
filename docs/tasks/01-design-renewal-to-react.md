# 1단계 — 디자인 리뉴얼 React 반영

## 1. 작업 개요

`react/design-renewal/` 에 정지 화면(HTML/CSS/PNG)으로만 존재하는 리뉴얼 시안 5장을 `react/src/modules/pm/pages/userSmlt/` 의 실제 React 코드로 옮긴다. 핵심은 **사용자 시뮬레이션 탭을 5개에서 3개로 통합**하고, 첫 화면의 운영시간 편집기를 **블럭 차트**로 교체하며, 세부 편집은 **우측 드로어**로 내리는 것이다.

시안은 `react/src/` 를 전혀 건드리지 않은 순수 목업이므로, 이번 단계에서 처음으로 실제 코드에 반영된다.

## 2. 선행 산출물

없음. 이 문서가 체인의 시작이다.

## 3. 읽어야 할 파일

### 시안 (입력, 수정 금지)

| 파일 | 볼 것 |
|---|---|
| `react/design-renewal/01-flight-pax.html` | 운항편/여객수 탭 — 리뉴얼 대상 아님. 탭이 3개로 줄었다는 것만 보여주는 참고용 |
| `react/design-renewal/02-checkin-counter.html` | **체크인 카운터 첫 화면** — 블럭 차트 + 대기인원 꺾은선 + 하단 셀프서비스 바 |
| `react/design-renewal/03-checkin-counter-detail.html` | **체크인 카운터 드로어** — 운영시간 타임바 / 부스 그리드 / 셀프서비스 스테퍼 |
| `react/design-renewal/04-departure.html` | **출국장 첫 화면** — 출국장 블럭 차트 + 보안검색대 보조 블럭 차트 |
| `react/design-renewal/05-departure-detail.html` | **출국장 드로어** — 사용/미사용 · 타임바 · 검색대 구성 · 구간표 |
| `react/design-renewal/mock.js` | 마크업 생성 함수 (`blockChart` L147, `timebar` L263, `boothGrid` L289, `waitLine` L114, `panelHead` L82) |
| `react/design-renewal/mock.css` | 시안 전용 스타일 1409줄. 기준 뷰포트 **1900×910** |
| `react/design-renewal/png/01~05-*.png` | 최종 육안 기준. 구현 결과를 이것과 비교한다 |
| `react/design-renewal/추가참고자료/*.jpg` | 원본 시스템 화면 참고 자료 (셀프체크인 / 보안검색대) |

### 기존 코드 (수정 대상)

| 파일 | 볼 것 |
|---|---|
| `react/src/modules/pm/pages/userSmlt/UserSmltConfig.tsx` | 페이지 컨테이너. 탭/터미널 상태를 소유하고 탭에 props 로 내림 |
| `react/src/modules/pm/pages/userSmlt/types.ts` | `SMLT_TABS`, `SMLT_TAB_LABEL`, `SmltTabKey` — **탭 5→3 통합의 진원지** |
| `react/src/modules/pm/pages/userSmlt/components/SmltTabs.tsx` | 알약 탭 렌더링. 주석도 "탭 5개"로 되어 있어 함께 고쳐야 함 |
| `react/src/modules/pm/pages/userSmlt/components/TerminalPanel.tsx` | T1/T2 좌우 2분할 패널 골격 |
| `react/src/modules/pm/pages/userSmlt/tabs/checkinCounter/**` | 흡수 대상 ①의 목적지 |
| `react/src/modules/pm/pages/userSmlt/tabs/departure/**` | 흡수 대상 ②의 목적지 |
| `react/src/modules/pm/pages/userSmlt/tabs/selfCheckin/**` | **흡수 후 삭제** (`SelfCheckinTab.tsx`, `components/DeviceRow.tsx`, `mock.ts`, `types.ts`) |
| `react/src/modules/pm/pages/userSmlt/tabs/security/**` | **흡수 후 삭제** (`SecurityTab.tsx`, `components/SecurityTable.tsx`, `mock.ts`, `types.ts`) |
| `react/src/modules/pm/pages/userSmlt/userSmlt.css` | 화면 전용 스타일. 시안 CSS 를 여기로 병합 |

### 기준 문서 (읽기 전용)

| 파일 | 볼 것 |
|---|---|
| `react/DESIGN-ANALYSIS.md` | 2~4장 — 셸 토큰, 컬러 시스템, 그라디언트/그림자/라운드 체계. **깨뜨리면 안 되는 기준선** |
| `react/src/common.css` | `:root` 의 `--pm-*` 토큰. 화면별 색은 여기 두지 않는다 |
| `react/src/hooks/usePageScope.ts` | `html[data-page='userSmlt']` 스코프 메커니즘 |
| `react/src/api/pm/API_SPEC.md` | 6장(사용자 시뮬레이션) — **현행 5탭 기준**이라 리뉴얼 후와 어긋남. 8절에서 델타를 뽑는다 |

## 4. 작업 범위

### 할 것

- 탭 5개 → 3개 통합 (`운항편/여객수` · `체크인 카운터` · `출국장`)
- 체크인 카운터 탭: 블럭 차트 + 대기인원 꺾은선 + 셀프서비스 바 + 우측 드로어
- 출국장 탭: 출국장 블럭 차트 + 보안검색대 보조 블럭 차트 + 우측 드로어
- 시안 CSS 를 `userSmlt.css` 로 병합 (토큰 포함)
- `selfCheckin/` · `security/` 폴더 제거 및 모든 참조 정리
- 리뉴얼 화면이 필요로 하는 데이터 항목을 델타 문서로 정리 (→ 2단계 입력)

### 하지 말 것

- **API 연동 금지.** 현재처럼 `mock.ts` 로 화면을 채운다. 이벤트 핸들러는 `console.log` 스텁 유지
- **`API_SPEC.md` 본문 직접 수정 금지.** 델타는 별도 파일로 낸다 (3·4단계에서 병합)
- 다른 3개 화면(`dashboard` / `terminalMap` / `monitoring`) 변경 금지
- `common.css` 의 `--pm-*` 셸 토큰 변경 금지 — 4개 화면 공용이다
- 상태관리 라이브러리 도입 금지, CSS Modules / Tailwind / styled-components 도입 금지
- 시안 폴더(`react/design-renewal/`) 및 `DESIGN-ANALYSIS.md` 수정 금지 — 입력으로만 쓴다

## 5. 상세 지시

### 5.1 시안 해석

**① 체크인 카운터 첫 화면 — `02-checkin-counter.html`**

- 기존의 운영시간 편집기를 걷어내고, 그 자리에 **0~24시 스택 블럭 차트**를 놓는다.
- **블럭 1개 = 부스 4석 × 1시간.** 세로로 쌓인 높이가 그 시간대에 열린 카운터 규모다.
- 블럭 위에 **대기인원수 꺾은선**을 오버레이한다 (색 `--line-wait: #f2762e`).
- 기존 셀프체크인/백드롭 탭 내용은 패널 하단 `selfbar` 로 흡수한다.
- 블럭 색은 보라 명도 5단(`--i1`~`--i5`).

**② 체크인 카운터 드로어 — `03-checkin-counter-detail.html`**

블럭(예: 아일랜드 D)을 클릭하면 우측에 **380px 드로어**가 열린다. 구성:

1. **운영시간 타임바** — 시간 구간 선택
2. **자원 배정** — 부스 3열 그리드 + 항공사 칩 (`KE` · `OZ` · `+Custom`)
3. **셀프서비스 스테퍼** — 키오스크 / 백드롭 대수 증감

`+ 추가` 버튼은 **같은 드로어를 빈 값으로** 연다 (별도 화면 아님).

**③ 출국장 첫 화면 — `04-departure.html`**

- 체크인 카운터와 **같은 블럭 문법**을 쓴다. **블럭 1개 = 출국장 1개.**
- 구 보안검색대 탭이 **보조 블럭 차트로 흡수**된다. **보조 차트의 블럭 1개 = 검색대 4대.**
- 보조 차트는 틸 계열(`--i6: #12b09a`)로 주 차트와 구분한다.
- 헤드에 **미운영 칩** + **`균등 배치` 버튼**이 붙는다.

**④ 출국장 드로어 — `05-departure-detail.html`**

출국장(예: 4번) 클릭 시 드로어. 구성:

1. **사용 / 미사용 세그먼트**
2. **운영시간 타임바** — 슬롯 안 숫자 = 그 시간대 검색대 대수
3. **검색대 구성 스테퍼** — 일반 / 스마트패스 / 보안검색대
4. **구간표** — 시작 / 종료 / 검색대 갯수 + 행 삭제

### 5.2 탭 통합 매핑

`react/src/modules/pm/pages/userSmlt/types.ts` 의 탭 상수를 3개로 줄인다.

```
['운항편/여객수', '체크인 카운터', '출국장']
```

| 기존 탭 | 처리 |
|---|---|
| 운항편/여객수 | 그대로 유지 (`tabs/flightPax/`) |
| 체크인 카운터 | 블럭 차트 + 드로어로 전면 개편 |
| 셀프체크인/백드롭 | **체크인 카운터로 흡수** — 첫 화면 하단 `selfbar` + 드로어 셀프서비스 스테퍼 |
| 출국장 | 블럭 차트 + 드로어로 전면 개편 |
| 보안 검색대 | **출국장으로 흡수** — 보조 블럭 차트 + 드로어 구간표 |

흡수 후 `tabs/selfCheckin/` · `tabs/security/` 폴더를 통째로 삭제하고, `SmltTabs.tsx` 의 "탭 5개" 주석, `UserSmltConfig.tsx` 의 탭 분기, 각종 `import` 를 전부 정리한다. 흡수되는 탭의 `mock.ts` / `types.ts` 내용 중 필요한 것은 목적지 탭의 `mock.ts` / `types.ts` 로 옮긴다.

### 5.3 시안 함수 → React 컴포넌트 대응

`mock.js` 의 마크업 생성 함수를 아래대로 컴포넌트화한다. 두 탭이 함께 쓰는 것은 `userSmlt/components/` 에, 한 탭만 쓰는 것은 해당 탭의 `components/` 에 둔다.

| `mock.js` 함수 | 줄 | → React 컴포넌트 | 위치 |
|---|---|---|---|
| `blockChart(items, opts)` | L147 | `BlockChart.tsx` | `userSmlt/components/` (공용) |
| `waitLine(line)` | L114 | `WaitLine.tsx` | `userSmlt/components/` (공용) |
| `timebar(label, value, ranges, opts)` | L263 | `TimeBar.tsx` | `userSmlt/components/` (공용, 드로어에서 사용) |
| `boothGrid(cells)` | L289 | `BoothGrid.tsx` | `tabs/checkinCounter/components/` |
| `panelHead(kind, groups, withMap, kpis)` | L82 | 기존 `TerminalPanel.tsx` 에 흡수 | `userSmlt/components/` |
| (드로어 셸) | — | `DetailDrawer.tsx` | `userSmlt/components/` (공용 껍데기) |
| (구간표) | — | `ScRangeTable.tsx` | `tabs/departure/components/` |
| (스테퍼) | — | `CountStepper.tsx` | `userSmlt/components/` (공용) |

- `gnbHTML` / `sidebarHTML` / `tabsHTML` / `renderShell` 은 **이식 대상이 아니다.** 이미 `SmltGnb.tsx` / `Lnb.tsx` / `SmltTabs.tsx` / `PmLayout` 이 실제 구현을 갖고 있다.
- `blockChart` 는 체크인(부스 4석 단위)과 출국장(출국장 1개 단위) + 보안검색대(검색대 4대 단위)를 모두 그려야 하므로, **단위·색상·라벨을 props 로 받는 하나의 컴포넌트**로 만든다. 탭마다 복제하지 말 것.

### 5.4 스타일 이식

- `mock.css` 의 신규 토큰을 `userSmlt.css` 로 병합한다:
  - 블럭 명도 5단 `--i1` ~ `--i5` (보라 계열)
  - 보조 틸 `--i6: #12b09a` (보안검색대 보조 차트)
  - 대기 꺾은선 `--line-wait: #f2762e`
- `mock.css` 는 `src/common.css` / `userSmlt.css` 의 토큰(`--pm-primary: #4441cc` 등)을 **복사해 둔 것**이다. 병합 시 중복 정의를 남기지 말고 기존 토큰을 그대로 참조한다.
- 스타일은 반드시 `html[data-page='userSmlt']` 스코프 안에 둔다. `usePageScope('userSmlt')` 가 lazy 라우트 간 스타일 누수를 막는 장치이므로 우회하지 말 것.
- 클래스 명명은 기존 BEM 유사 규칙 유지: `panel__head`, `summary__value--accent`, `btn btn--save`, `is-active`.

### 5.5 레이아웃 제약

- `.pm-shell { height: 100vh; overflow: hidden }` — **세로 스크롤 없음.** 블럭 차트도 남은 높이 안에 들어와야 한다.
- 기준 뷰포트 **1900×910** (시안 기준). 최소 너비 1440px.
- 반응형은 `@media (max-height: 900px)` 로 토큰 한 단계 축소만. 새 브레이크포인트를 만들지 말 것.
- 드로어는 본문 위 **오버레이 380px**. 본문 레이아웃을 밀어내지 않는다.
- 내부 스크롤이 필요하면 기존 `.scroll-area` 유틸(`common.css`)을 쓴다.

### 5.6 2단계로 넘길 산출물 — 데이터 항목 정리 (중요)

리뉴얼된 3탭이 실제로 필요로 하는 데이터 항목을 `react/src/api/pm/API_SPEC-DELTA.md` 로 정리한다. **이것이 2·3·4단계의 입력이다.**

현행 `API_SPEC.md` 6장에 **없는** 신규 계약이 최소 아래만큼 생긴다:

| 화면 요소 | 필요한 데이터 | 현행 명세 |
|---|---|---|
| 체크인 블럭 차트 | 시간대(0~24시)별 · 아일랜드별 **운영 부스 수** | 없음 (현행은 `counterList` 평면 목록) |
| 대기인원 꺾은선 | 시간대별 대기인원수 | 없음 (사용자 시뮬레이션 탭에는 없음) |
| 체크인 드로어 자원 배정 | 부스별 **항공사 코드 + Custom 여부** | `counterList[].alnCd` 일부 대응 |
| 체크인 드로어 셀프서비스 | 아일랜드별 키오스크/백드롭 **대수** | `6.4` 셀프체크인 탭이 흡수됨 → 계약 재배치 필요 |
| 출국장 블럭 차트 | 시간대별 출국장 운영 상태 | `6.5` 는 `oprTimeList` 만 |
| 보안검색대 보조 차트 | 시간대별 **검색대 대수** | `6.6` 은 구간 목록만 |
| 출국장 드로어 검색대 구성 | 일반 / 스마트패스 / 보안검색대 **대수** | 없음 |
| `균등 배치` 버튼 | 서버 계산인지 클라이언트 계산인지 | 없음 |

각 항목에 대해 **필드명 / 타입 / 설명 / 현행 명세와의 차이**를 표로 적는다. 화면에서 확정할 수 없는 것(예: `균등 배치` 의 계산 주체)은 **"결정 필요"로 명시**해 2단계 리스크로 올린다.

## 6. 지켜야 할 규칙

### 코드 컨벤션 (기존 코드에서 추출)

- 들여쓰기 **4 스페이스**, 싱글쿼트, 세미콜론, `printWidth` 100 (`react/prettier.config.cjs`)
- **페이지 컴포넌트만 `export default`** (lazy 라우트용). 나머지는 named export
- 임포트: 페이지 밖은 `@/...` alias, 같은 모듈 내부는 상대 경로
- 주요 파일 상단에 **한국어 JSDoc 블록 주석**으로 "왜 이렇게 했는지"를 남긴다 (기존 관행)
- TypeScript `strict` + `noUnusedLocals` / `noUnusedParameters` — 안 쓰는 변수 남기면 빌드 실패

### 아키텍처 제약

- 상태관리는 **로컬 `useState` + props 드릴링**. 화면 컨테이너가 셸 상태를 소유하고 탭에 내린다
- 탭 내부 편집값은 `Record<TerminalKind, EditState>` 형태로 **T1/T2 각각 보존** (`CheckinCounterTab.tsx` 패턴). 터미널을 전환해도 편집 중이던 값이 날아가지 않아야 한다. 드로어 편집값도 같은 규칙을 따른다
- 페이지마다 `mock.ts`(데이터) + `types.ts`(타입) 분리 유지. API 연동 시 `mock.ts` 만 교체되도록
- 전역 오버레이(다이얼로그·로딩바)는 `src/lib/dialog.ts` / `src/lib/loading-bar.ts` 싱글턴을 쓴다. 드로어는 이 경로가 아니라 탭 로컬 상태로 제어한다

## 7. 산출물

**수정**

- `react/src/modules/pm/pages/userSmlt/types.ts` — 탭 상수 3개로
- `react/src/modules/pm/pages/userSmlt/UserSmltConfig.tsx` — 탭 분기 정리
- `react/src/modules/pm/pages/userSmlt/components/SmltTabs.tsx` — 주석 포함
- `react/src/modules/pm/pages/userSmlt/components/TerminalPanel.tsx`
- `react/src/modules/pm/pages/userSmlt/userSmlt.css` — 토큰 + 블럭/드로어 스타일 병합
- `react/src/modules/pm/pages/userSmlt/tabs/checkinCounter/**`
- `react/src/modules/pm/pages/userSmlt/tabs/departure/**`

**신규**

- `userSmlt/components/` — `BlockChart.tsx` · `WaitLine.tsx` · `TimeBar.tsx` · `DetailDrawer.tsx` · `CountStepper.tsx`
- `tabs/checkinCounter/components/BoothGrid.tsx`
- `tabs/departure/components/ScRangeTable.tsx`
- `react/src/api/pm/API_SPEC-DELTA.md` — **2단계 입력**

**삭제**

- `react/src/modules/pm/pages/userSmlt/tabs/selfCheckin/` (전체)
- `react/src/modules/pm/pages/userSmlt/tabs/security/` (전체)

## 8. 완료 조건

- [ ] `npm run build` 통과 (`noUnusedLocals` 걸리는 잔여 import 없음)
- [ ] `npm run lint` 통과
- [ ] 탭이 3개로 표시되고 전환이 동작
- [ ] 체크인 카운터: 블럭 차트 렌더 + 대기인원 꺾은선 오버레이 + 블럭 클릭 시 드로어 열림/닫힘
- [ ] 출국장: 주 블럭 차트 + 보안검색대 보조 블럭 차트 + 드로어 구간표 행 추가/삭제
- [ ] T1↔T2 전환 후 되돌아왔을 때 편집값이 보존됨
- [ ] `png/02~05-*.png` 대비 육안 일치 (1900×910 기준)
- [ ] 세로 스크롤이 생기지 않음
- [ ] `selfCheckin` / `security` 문자열이 `react/src/` 어디에도 남아 있지 않음 (`grep` 확인)
- [ ] `react/src/api/pm/API_SPEC-DELTA.md` 작성 완료 — "결정 필요" 항목이 명시되어 있음
