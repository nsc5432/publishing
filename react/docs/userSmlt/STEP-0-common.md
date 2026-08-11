# STEP-0 · 공통 컴포넌트 확정

> 사용자 시뮬레이션 리뉴얼 — 체크인 카운터 / 출국장 두 탭이 **함께 쓰는 컴포넌트**의 최종 Props·타입·좌표 토큰을 여기서 못 박는다.
> [STEP-1 (체크인 카운터)](./STEP-1-checkin-counter.md) 과 [STEP-2 (출국장)](./STEP-2-departure.md) 은 이 문서를 **참조만** 하고 공통 변경을 다시 적지 않는다.

## 왜 이 문서가 먼저인가

두 설계서가 **같은 `BlockChart` 를 서로 다른 방향으로** 고친다.

| | 체크인 카운터 설계서 | 출국장 설계서 |
|---|---|---|
| 블럭 단위 | 4석 → **아일랜드 1개(36석)** | 그대로 (출국장 1개) |
| `levels` | 10 → **13** | 6(T1) / 2(T2) |
| `rowH` | 22 → **18** | 22 → **18** |
| 선택 | 단일 → **다중(`Ctrl`+클릭)** + 시간 범위 | 단일 유지 |
| 블럭 내부 | **L/R 면 분할 렌더** | 그대로 |
| 좌측 축 | 그대로(30px) | **44px** (아래 격자와 정렬) |
| 쌓기 순서 | 그대로(열린 것부터) | **항목 순서 고정** |

한쪽을 먼저 구현하면 다른 쪽이 그 위에 덧칠하게 된다. 통합 Props 를 먼저 확정하고, **호출부 마이그레이션까지 이 스텝에서 한 번에** 끝낸다.

---

## 1. 공유 현황 — 무엇이 공통인가

| 컴포넌트 | 체크인 | 출국장 | 이번 변경 |
|---|---|---|---|
| `components/BlockChart.tsx` | 주 차트 | 주 차트 | **양쪽이 고침 → 통합 Props (§2)** |
| `components/CountStepper.tsx` | 도크 셀프서비스 | 격자 팝오버 | `variant` 추가 (§5) |
| `components/TimeBar.tsx` | 도크 운영시간 열 | 드로어 운영시간 | 그대로 재사용 |
| `components/DetailDrawer.tsx` | **호출부 제거** | **존치** (속성 전용) | ⚠️ §6 |
| `components/TerminalPanel.tsx` | 그대로 | 그대로 | 없음 |
| `types.ts` | `BlockItem.sides` | — | 공통 타입 (§3) |
| `userSmlt.css` | `.dock` 신규 | `.scgrid` 신규 | 좌표 토큰 공유 (§4) |

**신규 컴포넌트는 공용 폴더에 두지 않는다.** 각 탭 전용이다.

- `tabs/checkinCounter/components/EditDock.tsx` — 체크인 전용
- `tabs/departure/components/ScGrid.tsx` — 출국장 전용

---

## 2. BlockChart — 통합 Props

두 설계서의 요구를 합친 최종형. 이 STEP 에서 이 형태로 만들어 두면 STEP-1·STEP-2 는 값만 넘긴다.

```ts
interface BlockChartProps {
    /* ── 기존 유지 ─────────────────────────────────────────── */
    items: BlockItem[];
    title: string;
    unit?: string;
    unitNote?: string;
    levels?: number;
    rowH?: number;
    unitSize?: number;
    blockFontSize?: number;
    compact?: boolean;
    legend?: BlockLegend[];
    line?: WaitLineData;
    showScale?: boolean;
    footText?: string;
    actions?: ReactNode;
    headExtra?: ReactNode;
    headActions?: ReactNode;
    formatTip?: (item: BlockItem, hour: number) => string;
    disabled?: boolean;

    /* ── 변경: selectedLabel(string | null) 을 대체 ──────────── */
    /** 선택된 블럭 라벨. 하나라도 있으면 나머지가 흐려진다(기존 picking 분기 그대로) */
    selected?: string[];
    /** meta.additive = Ctrl/Cmd 를 누른 채 클릭했는가 */
    onBlockSelect?: (label: string, meta: { additive: boolean }) => void;

    /* ── 신규 · 출국장 ──────────────────────────────────────── */
    /** 'packed' 열린 것부터 아래에서 쌓음(기본, 기존 동작) · 'fixed' items 순서로 층 고정 */
    stackMode?: 'packed' | 'fixed';
    /** 좌측 축 자리(px). 아래 격자와 좌표를 맞출 때 GUTTER(44) 를 넘긴다. 기본 Y_LEFT(30) */
    gridLeft?: number;

    /* ── 신규 · 체크인 (선택 단계) ──────────────────────────── */
    /** 가로 드래그로 좁힌 시간 범위. null 이면 선택 블럭의 운영 구간 전체 */
    selectedRange?: TimeRange | null;
    onRangeSelect?: (label: string, range: TimeRange) => void;
}
```

### 2-1. `selectedLabel` → `selected` 마이그레이션

**이 STEP 에서 두 탭 호출부를 함께 고친다.** 내부 `picking` 분기는 `Boolean(selectedLabel)` → `selected.length > 0`, 셀 비교는 `selectedLabel === cell.label` → `selected.includes(cell.label)` 로 바꾸면 끝이다. CSS 의 `.is-picking` 토글 조건도 같다.

| 호출부 | 지금 | 바꾼 뒤 |
|---|---|---|
| `CheckinCounterTab.tsx` | `selectedLabel={active ? (drawer?.target ?? null) : null}` | `selected={active && drawer?.target ? [drawer.target] : []}` |
| `DepartureTab.tsx` | `selectedLabel={active && drawer?.target != null ? String(drawer.target) : null}` | `selected={active && drawer?.target != null ? [String(drawer.target)] : []}` |

이 시점에는 **동작이 달라지지 않는다.** 다중선택은 STEP-1 의 선택 단계에서 켠다.

### 2-2. `stackMode`

지금 `cells` 계산은 시간별 `stack[hour]` 을 세어 열린 것부터 아래에서부터 채운다(`packed`). 출국장 격자는 줄 순서가 고정인데 위 차트가 시간마다 흔들리면 눈이 두 표면을 잇지 못한다.

- `packed` — 기존 그대로. 체크인 카운터가 쓴다.
- `fixed` — `level = items` 배열의 인덱스. 그 시간에 닫힌 항목의 자리는 **비워 둔다**. 출국장이 쓴다.

`levels` 를 넘는 층은 지금처럼 그리지 않는다(`if (level >= levels) continue`).

### 2-3. `gridLeft`

`grid.left` 에 그대로 들어간다. `showScale` 의 X축 눈금줄(`.bchart__scale`)도 같은 값만큼 왼쪽을 비워야 하므로 `marginLeft` 를 함께 적용한다 — 지금은 우측(`Y_RIGHT`)만 보정하고 있다.

---

## 3. types.ts — `BlockItem` 확장

```ts
/** 블럭 차트 항목 1개 = 시설 1개(아일랜드 / 출국장) */
export interface BlockItem {
    label: string;
    color: BlockColor;
    ranges: TimeRange[];
    size: number;
    /**
     * 운영 중인 면. 'L' 또는 'R' 한쪽만 있으면 블럭을 위/아래로 갈라 그린다.
     * 없거나 둘 다 있으면 통 블럭 — 출국장은 넘기지 않는다.
     */
    sides?: readonly ('L' | 'R')[];
}
```

`BlockColor` · `BLOCK_COLORS`(i1~i6) 는 그대로 둔다. 아일랜드가 13개여도 색은 순환한다(현재 동작).

> ### ⚠️ 확인 필요 ①  —  시간대별 면(side) 정보가 API 에 없다
>
> 체크인 설계서 §3 목업은 **시간대마다** 면이 바뀐다(첫 시간 L 만, 마지막 시간 R 만). 그런데
> `ChknIslandDto` 에는 면 구분 필드가 없고(`boothList[].boothNo` 뿐), `oprTimeList` 도 아일랜드 단위다.
> **현재 API 로는 시간대별 면 운영을 표현할 수 없다.**
>
> - **1차 구현** — `sides` 를 아일랜드 단위 **정적** 값으로 둔다. 그 아일랜드에 L 부스가 있으면 `'L'`, R 부스가 있으면 `'R'`. 운영시간 내내 같은 모양으로 그려진다.
> - **시간대별 변화가 필요하면** — `OprTimeDto` 에 면 구분을 더하는 **API 변경**이 선행돼야 한다. 그때 `sides` 를 `Record<hour, ('L'|'R')[]>` 로 넓힌다.

---

## 4. 좌표 토큰 — 차트와 격자를 픽셀로 맞춘다

`BlockChart` 는 ECharts(px 상수), `ScGrid` 는 DOM 격자다. 08시 블럭 바로 아래에 08시 셀이 오려면 **같은 세 값**을 봐야 한다.

| 값 | 뜻 | 크기 |
|---|---|---|
| `--gut` / `GUTTER` | 좌측 Y축·행 라벨 자리 | `44px` |
| `--col` | 시간 칸 1개 폭 | `(100% - gut - rgt) / 24` |
| `--rgt` / `Y_RIGHT` | 우측 대기 축·행 피크 자리 | `40px` |

`BlockChart.tsx` 에서 `Y_LEFT`(30) · `GUTTER`(44) · `Y_RIGHT`(40) 를 **export** 하고, `userSmlt.css` 의 패널 스코프에 같은 값을 CSS 변수로 둔다.

```css
/* 차트와 검색대 격자가 공유하는 시간 좌표 */
/* TerminalPanel 은 children 을 .panel 바로 아래에 둔다 — 별도 body 래퍼가 없다 */
.panel {
    --gut: 44px;
    --rgt: 40px;
    --col: calc((100% - var(--gut) - var(--rgt)) / 24);
}
```

**두 컴포넌트는 서로를 import 하지 않는다.** 정렬은 이 세 값을 공유하는 것으로 끝난다.

---

## 5. CountStepper — 인라인 변형

지금은 `.drow`(라벨 + 스테퍼) 한 줄로 고정돼 있다. 출국장 격자 팝오버의 `검색대 5 − +` 는 라벨 없는 인라인이 필요하다.

```ts
interface CountStepperProps {
    label: string;
    sub?: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    disabled?: boolean;
    /** 'row' 라벨 + 우측 스테퍼 (기본, 드로어/도크) · 'inline' 스테퍼만 (격자 팝오버) */
    variant?: 'row' | 'inline';
}
```

`inline` 은 `.drow` 껍데기 없이 `.stepper` 만 렌더한다. `label` 은 `aria-label` / `.blind` 로만 쓰인다. 내부 버튼 마크업(`.stepper__btn` · `.stepper__value`)은 두 변형이 공유한다.

---

## 6. ⚠️ DetailDrawer 를 지우지 말 것

체크인 설계서 §7 은 `EditDock` 을 `DetailDrawer` **대체**라고 적었다. 이 말은 **체크인 탭에서 호출을 걷어낸다**는 뜻이지 컴포넌트 파일을 지운다는 뜻이 아니다.

**출국장은 STEP-2 이후에도 `DetailDrawer` 를 쓴다** — 줄 라벨을 클릭하면 열리는 출국장 속성 편집(운영 여부 · 일반/스마트패스 구성)이 그대로 남는다.

- STEP-1 에서 지우는 것: `CheckinCounterTab.tsx` 의 `DetailDrawer` / `DrawerSection` **import 와 JSX**
- 남기는 것: `components/DetailDrawer.tsx` 파일, `.drawer` · `.dsec` · `.drow` CSS

---

## 7. 삭제 대상 — 어느 스텝에서 지우는가

두 탭에 흩어져 있어 한 곳에 모아 둔다. **각 항목은 표기된 스텝에서만 지운다.**

| 대상 | 위치 | 지우는 스텝 |
|---|---|---|
| `BOOTH_PER_BLOCK = 4` | `tabs/checkinCounter/constants.ts` | STEP-1 · 1 |
| `.selfbar` JSX | `CheckinCounterTab.tsx` | STEP-1 · 3 |
| `.selfbar` CSS | `userSmlt.css` (1058~1122행 부근) | STEP-1 · 3 |
| `DetailDrawer` 호출부 | `CheckinCounterTab.tsx` | STEP-1 · 3 |
| `toScItems()` | `DepartureTab.tsx` | STEP-2 · 2 |
| 보조 `BlockChart` JSX | `DepartureTab.tsx` | STEP-2 · 2 |
| `SC_PER_BLOCK = 4` | `tabs/departure/constants.ts` | STEP-2 · 2 |
| `.offchips` CSS | `userSmlt.css` (1123~1146행 부근) | STEP-2 · 2 |
| `ScRangeTable.tsx` | `tabs/departure/components/` | STEP-2 · 4 |
| `.plan` CSS | `userSmlt.css` (1492~1557행 부근) | STEP-2 · 4 |
| `.bchart__act--even` / `.btn--even` 중 한쪽 | `userSmlt.css` | STEP-2 · 5 (버튼 통합) |

`components/DetailDrawer.tsx` · `components/TimeBar.tsx` · `components/CountStepper.tsx` 는 **어느 스텝에서도 지우지 않는다.**

---

## 8. 이 스텝의 완료 조건

- [ ] `BlockChartProps` 가 §2 형태로 바뀌었고 두 탭 호출부가 컴파일된다
- [ ] `selected` 전환 후 **화면 동작이 이전과 같다** (단일 선택 시 나머지 흐려짐)
- [ ] `stackMode="fixed"` 를 넘기면 항목 순서대로 층이 고정되고 닫힌 항목 자리가 비어 있다
- [ ] `gridLeft={44}` 를 넘기면 플롯과 X축 눈금줄이 함께 44px 밀린다
- [ ] `BlockItem.sides` 타입이 추가돼 있다 (아직 쓰는 곳은 없다)
- [ ] `CountStepper variant="inline"` 이 라벨 없이 렌더된다
- [ ] `userSmlt.css` 에 `--gut / --col / --rgt` 가 있고 `GUTTER` / `Y_RIGHT` 와 값이 같다

**화면 변화 없음.** 이 스텝만으로 단독 배포 가능하다.
