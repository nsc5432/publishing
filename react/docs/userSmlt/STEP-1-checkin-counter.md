# STEP-1 · 체크인 카운터 (CheckinCounterTab)

> 설계서: [체크인 카운터 — 차트 + 도크](https://claude.ai/code/artifact/8e1f4e5a-4b01-40db-9bef-28024524a5a3)
> 선행: **[STEP-0 (공통)](./STEP-0-common.md) 이 끝나 있어야 한다.** `BlockChartProps` · `BlockItem.sides` · `CountStepper variant` 는 여기서 다시 정의하지 않는다.
> 대상: `react/src/modules/pm/pages/userSmlt/tabs/checkinCounter/`

## 한 줄 요약

차트는 그대로 두고 **블럭의 단위**(4석 → 아일랜드 1개 36석)와 **편집 표면**(우측 드로어 → 하단 도크)만 바꾼다. 고르는 일은 차트 위에서 끝내고, 화면에 없는 미운영 아일랜드는 도크의 칩 줄이 붙잡는다.

## 규모 — 이 숫자가 설계를 결정한다

| | 값 |
|---|---|
| 아일랜드 | 13개 (A·B·C·D·E·F·G·H·J·K·L·M·N — I 제외) |
| 면당 부스 | 18석 |
| 아일랜드당 부스 | 36석 (좌 18 + 우 18) |
| 레인(면) | 26 = 13 × 좌우 |
| 최대 부스 | 468석 |

26개 레인을 세로로 펴면 블럭 높이가 8px 이라 `A-L` 이 들어갈 자리가 없다. 그래서 **시간축 위에 올리는 대상은 13개**로 두고, 좌우 면은 블럭을 늘리는 대신 **블럭 안에서** 가른다.

---

## 스텝 1 · 면(side) 데이터 모델

**화면 변화 없음.** 타입과 매핑만 바꾼다.

### 1-1. `tabs/checkinCounter/constants.ts`

```ts
// 삭제: export const BOOTH_PER_BLOCK = 4;

/** 아일랜드 한 면(L 또는 R)의 부스 수 */
export const SIDE_BOOTHS = 18;
/** 아일랜드 1개의 부스 수 — 블럭 1개가 담당하는 규모 */
export const ISLAND_BOOTHS = SIDE_BOOTHS * 2;   // 36
```

### 1-2. `tabs/checkinCounter/types.ts`

```ts
/** 아일랜드의 좌/우 면 */
export type BoothSide = 'L' | 'R';

export interface Booth {
    no: number;
    /** 소속 면 — 도크의 좌우 스트립을 가르는 기준 */
    side: BoothSide;
    airline: string;
}
```

`CheckinIsland` 는 그대로다 (`booths: Booth[]` 가 면 정보를 품게 된다).

### 1-3. `tabs/checkinCounter/view.ts`

> ### ⚠️ 확인 필요 ② — DTO 에 면 구분이 없다
>
> `ChknBoothDto` 는 `boothNo` · `alnCd` · `customYn` 뿐이고 **면 필드가 없다.**
> 아래 파생 규칙은 **가정**이다. 실제 부스 번호 체계를 확인해 맞으면 그대로, 다르면 이 함수 한 곳만 고친다.
>
> **가정 — `boothNo <= 18` 이면 L, 그 위면 R** (1~18 좌측 / 19~36 우측)
> 대안으로 홀짝 교차(`boothNo % 2`) 체계일 수 있으므로 확정 전까지 규칙을 함수로 분리해 둔다.

`newIsland()`(탭 파일)도 같은 규칙을 쓰므로 **export 한다.**

```ts
/** 부스 번호 → 소속 면. DTO 에 면 필드가 없어 번호로 파생한다 (확인 필요 ②) */
export function toSide(boothNo: number): BoothSide {
    return boothNo <= SIDE_BOOTHS ? 'L' : 'R';
}

// toIslands() 안
booths: island.boothList.map((booth) => ({
    no: booth.boothNo,
    side: toSide(booth.boothNo),
    airline: booth.alnCd,
})),
```

`toSaveReq()` 는 **그대로 둔다** — `side` 는 화면 파생값이라 서버로 돌려보내지 않는다.

### 1-4. 파급

`newIsland()` 가 `BOOTH_PER_BLOCK` 으로 4석을 만들고 있다. 신규 아일랜드는 36석 골격으로 연다.

```ts
booths: Array.from({ length: ISLAND_BOOTHS }, (_, i) => ({
    no: i + 1,
    side: toSide(i + 1),
    airline: '',
})),
```

### 완료 조건

- [ ] `BOOTH_PER_BLOCK` 참조가 코드 전체에서 사라졌다
- [ ] `Booth.side` 가 조회 결과에 채워진다
- [ ] **화면이 이전과 똑같이 보인다** (차트 블럭 수는 아직 `ceil(booths/4)`)

---

## 스텝 2 · 차트 단위 전환

**단독 배포 가능.** 편집은 아직 기존 드로어를 쓴다.

### 2-1. `CheckinCounterTab.tsx` — 차트 값

```tsx
<BlockChart
    items={toBlockItems(panelIslands)}
    title="시간대별 운영 아일랜드"
    unit="(단위: 아일랜드 수)"
    unitNote={`1블럭 = 아일랜드 1개(${ISLAND_BOOTHS}석)`}
    levels={13}              // 10 → 13
    rowH={18}                // 22 → 18
    unitSize={ISLAND_BOOTHS} // 4 → 36
    blockFontSize={12}       // 13행이므로 줄일 이유가 없다
    stackMode="packed"       // 기본값 그대로 (출국장만 fixed)
    ...
/>
```

`levels 13 × rowH 18 + 여백 25 = 259px`, X축 20px 을 더해 **279px**. 지금(245px)보다 34px 크고 가용 380~420px 안에 넉넉히 들어간다.

### 2-2. `toBlockItems()` — `sides` 를 채운다

```ts
function toBlockItems(islands: CheckinIsland[]): BlockItem[] {
    return islands.map((island) => ({
        label: island.label,
        color: island.color,
        ranges: island.ranges,
        size: island.booths.length,
        // 부스가 있는 면만 — 한쪽만 있으면 BlockChart 가 블럭을 위/아래로 가른다
        sides: (['L', 'R'] as const).filter((side) =>
            island.booths.some((booth) => booth.side === side),
        ),
    }));
}
```

### 2-3. `BlockChart.tsx` — L/R 분할 렌더

`renderItem` 의 반환을 `rect` 1개에서 `group`(본체 + 면 표시)으로 바꾼다.

| `sides` | 그리기 |
|---|---|
| `['L','R']` 또는 미지정 | 지금과 같은 통 블럭 |
| `['L']` 만 | 위 절반 진하게, 아래 절반 26% 투명 + 안쪽 1px 테두리 |
| `['R']` 만 | 아래 절반 진하게, 위 절반 26% 투명 + 안쪽 1px 테두리 |

꺾은선 · 우측 축 · 툴팁 · `markPoint` · `emphasis` 는 **손대지 않는다.**

### 2-4. 툴팁

```ts
formatTip={(item, hour) => {
    const both = item.sides?.length !== 1;
    const detail = both
        ? `L ${SIDE_BOOTHS}석 · R ${SIDE_BOOTHS}석`
        : `${item.sides[0]} ${SIDE_BOOTHS}석 · ${item.sides[0] === 'L' ? 'R' : 'L'} 미운영`;

    return `아일랜드 ${item.label} · ${detail} · ${formatHour(hour)} ~ ${formatHour(hour + 1)}`;
}}
```

### 완료 조건

- [ ] 13개 아일랜드가 다 열린 시간의 기둥 높이가 13이다
- [ ] 한쪽 면만 운영하는 아일랜드가 반쪽 블럭으로 그려진다
- [ ] 블럭 안 문자가 12px 로 읽힌다
- [ ] 대기인원 꺾은선 · 우측 축 · 최댓값 말풍선이 그대로다

---

## 스텝 3 · EditDock 신설 — 이 설계의 본체

**신규 컴포넌트는 이것 하나뿐이다.** `tabs/checkinCounter/components/EditDock.tsx`

### 3-1. 왜 도크인가

18석짜리 좌우 스트립은 380px 폭 드로어에 들어가지 않는다. 선택한 아일랜드의 편집을 차트 아래에서 **가로로** 편다. 드로어와 같은 오버레이 방식이고 방향만 아래로 바뀐다 — 상시 세로 예산을 쓰지 않는다.

### 3-2. 도크 맨 윗줄이 핵심 — 아일랜드 칩 13개

블럭은 운영 구간에만 그려지므로 **하루 종일 닫힌 아일랜드는 화면에 존재하지 않는다.** 칩 줄이 그 자리를 대신한다.

- A~N 13개 칩이 **언제나 같은 자리**에 있다
- 운영 중 = 제 색 / 하루 종일 닫힘 = **점선 회색**
- 선택된 칩은 2px 강조 링
- **회색 칩을 누르면 그 아일랜드가 편집 대상이 되어 운영시간부터 지정한다** → 지금의 `+ 추가` 버튼을 대신하는 자리다

26레인이면 칩이 성립하지 않지만 13개는 한 줄에 들어간다.

### 3-3. Props

```ts
interface EditDockProps {
    /** 칩 줄에 깔 전체 아일랜드 문자 (TerminalCheckinCounter.islandCodes) */
    codes: string[];
    /** 편집 상태의 아일랜드 목록 — 여기 없는 code 는 미운영(점선 회색) */
    islands: CheckinIsland[];
    /** 선택된 아일랜드 문자 — BlockChart 의 selected 와 같은 배열을 쓴다 */
    selected: string[];
    /** 칩 클릭 · 미운영 칩이면 신규로 연다. additive = Ctrl/Cmd */
    onSelect: (label: string, additive: boolean) => void;

    /** 단일 선택일 때의 편집 대상. 다중 선택이면 null (칩 줄만 활성) */
    draft: CheckinIsland | null;
    onPatch: (next: Partial<CheckinIsland>) => void;

    /** 부스에 배정할 수 있는 항공사 코드 (TerminalCheckinCounter.airlines) */
    airlines: string[];
    /** 선택된 부스 번호 — 항공사 칩을 누르면 이 부스에 배정된다 */
    selectedBooth: number | null;
    onSelectBooth: (no: number | null) => void;

    onConfirm: () => void;
    onClose: () => void;
}
```

### 3-4. 3열 레이아웃

가로 비율 `56fr : 23fr : 21fr`.

| 열 | 내용 | 재사용 |
|---|---|---|
| **부스 배정** (56) | 좌 18 / 우 18 스트립 2줄 + 가운데 스파인. 셀 클릭 → 항공사 칩으로 배정 | `BoothGrid` 를 면 단위 2줄로 확장 |
| **운영시간** (23) | 24슬롯 바 | `TimeBar` 그대로 |
| **셀프 서비스** (21) | 셀프체크인 키오스크 / 셀프백드롭 스테퍼 | `CountStepper variant="row"` |

`BoothGrid` 는 지금 3열 그리드로 `booths` 를 통째로 편다. `side` 로 갈라 두 줄(각 18칸)로 그리도록 확장한다 — Props 에 `side?: BoothSide` 를 더해 두 번 호출하거나, 내부에서 `side` 기준으로 나눈다.

### 3-5. 걷어내는 것

| 대상 | 이유 |
|---|---|
| `DetailDrawer` / `DrawerSection` **import 와 JSX** | 도크가 대신한다 |
| `.selfbar` JSX | 셀프 서비스가 도크 3열로 들어간다 |
| `.selfbar` CSS (`userSmlt.css` 1058행 부근) | 위와 같음 |
| `+ 추가` 버튼 (`bchart__act--add`) | 도크의 회색 칩이 대신한다 |

> ### ⚠️ `components/DetailDrawer.tsx` 파일은 **지우지 않는다**
> 출국장 탭이 STEP-2 이후에도 속성 편집에 쓴다. 지우는 것은 이 탭의 **호출부**뿐이다.
> `.drawer` · `.dsec` · `.drow` CSS 도 남긴다.

### 3-6. CSS 신규 (`userSmlt.css`)

```
.dock            도크 껍데기 — 상단 2px accent 보더, 아래에서 올라오는 오버레이
.isles / .isle   아일랜드 칩 줄 (.on = 운영 · 기본 = 점선 회색 · .sel = 강조 링)
.dock__cols      3열 그리드 56fr / 23fr / 21fr
.dock__col       열 하나 (우측 1px 구분선, 마지막 열 제외)
.booths          좌우 스트립 2줄 + 가운데 스파인
```

`@media (max-width: 900px)` 에서 `.dock__cols` 는 1열로 접는다.

### 완료 조건

- [ ] 블럭을 클릭하면 도크가 아래에서 올라온다
- [ ] 칩 13개가 항상 보이고, 미운영 칩이 점선 회색이다
- [ ] 회색 칩을 누르면 그 아일랜드가 신규 편집 대상이 된다 (`+ 추가` 대체)
- [ ] 좌/우 18석 스트립이 한 화면에 가로로 펴진다
- [ ] 셀프 서비스 스테퍼가 도크 안에서 동작하고 `.selfbar` 가 사라졌다
- [ ] **출국장 탭의 드로어가 여전히 정상 동작한다**

---

## 스텝 4 · 선택 확장 — 선택사항

**없어도 스텝 3 까지로 편집이 완결된다.** 실사용을 보고 넣는다.

### 4-1. `Ctrl` + 클릭 누적

STEP-0 에서 `onBlockSelect(label, { additive })` 로 이미 시그니처가 열려 있다. 탭에서 `additive` 면 `selected` 배열에 더하고, 아니면 교체한다. 다중 선택 시 도크는 `draft = null` 로 두고 **칩 줄만** 활성 — 여러 아일랜드에 같은 조작을 걸 UI 가 정해지면 그때 채운다.

### 4-2. 가로 드래그(시간 범위)

ECharts `brush` · `lineX` 로 그 아일랜드의 시간 범위만 좁힌다. `onRangeSelect(label, range)` → 탭이 `selectedRange` 를 들고 도크의 운영시간 열에 반영한다.

### 4-3. 못 하는 것 — 문서로 남길 한계

**여러 아일랜드의 같은 시간대를 사각형 드래그로 한 번에 잡는 조작은 안 된다.** 스택이 계단 모양이라 사각형이 아니다. `Ctrl`+클릭 누적으로 대신한다. 이 조작이 일상 업무라면 그때 선택 전용 격자를 다시 검토한다. (출국장은 줄이 고정이라 사각형 드래그가 성립한다 — [STEP-2](./STEP-2-departure.md) 참고)

---

## 스텝 5 · 결과 조회 화면 재사용 — 선택사항

일일 시뮬레이션 결과 조회는 **차트만** 렌더하면 된다. `BlockChart` 호출부를 그대로 옮기고 `disabled` 로 편집을 끈다. **개발량 0.**

---

## 세로 예산

패널 하나에 쓸 수 있는 세로는 셸(`100vh`)에서 gnb · 탭 · 패널헤드 · 요약 · 푸터를 뺀 **380~420px**.

| 구성 | 계산 | px |
|---|---|---|
| 차트 플롯 | `levels 13 × rowH 18 + PAD_TOP 18 + PAD_BOTTOM 7` | 259 |
| X축 (`.bchart__scale`) | `00 02 … 22` | 20 |
| **합계** | | **279** |
| 지금 화면 | `10 × 22 + 18 + 7 + 20` | 265 |
| 남는 여유 | 가용 380~420px 대비 | **101~141px** |

지금보다 **14px** 커지는 것이 전부다. 도크는 오버레이라 상시 세로에 들어가지 않고, `.selfbar`(약 70px)까지 도크로 옮기므로 여유는 오히려 늘어난다.

> 설계서 §6 은 272px / 245px 로 적었다. 위 표는 `BlockChart.tsx` 의 실제 상수(`PAD_TOP = 18` · `PAD_BOTTOM = 7`)로 다시 계산한 값이라 조금 다르다 — **구현 시에는 위 표를 따른다.** 결론(예산이 남는다)은 같다.

> **1차 구현 이후 정할 것** — 도크를 오버레이가 아니라 패널 안 고정 영역(약 165px)으로 둘 수도 있다. 선택할 때마다 차트를 가리지 않는 대신 상시 세로를 쓰는 맞바꿈이다. 실제 사용을 보고 정한다.

---

## 파일별 변경 요약

| 파일 | 변경 | 스텝 |
|---|---|---|
| `tabs/checkinCounter/constants.ts` | `BOOTH_PER_BLOCK` 삭제 → `SIDE_BOOTHS` · `ISLAND_BOOTHS` | 1 |
| `tabs/checkinCounter/types.ts` | `BoothSide` · `Booth.side` 추가 | 1 |
| `tabs/checkinCounter/view.ts` | `toSide()` 파생, `toIslands()` 반영 | 1 |
| `components/BlockChart.tsx` | `renderItem` `rect` → `group`(L/R 분할) | 2 |
| `tabs/checkinCounter/CheckinCounterTab.tsx` | 차트 값 · `toBlockItems` sides · 도크 전환 | 2·3 |
| `tabs/checkinCounter/components/EditDock.tsx` | **신규** | 3 |
| `tabs/checkinCounter/components/BoothGrid.tsx` | 면 단위 2줄로 확장 | 3 |
| `userSmlt.css` | `.dock` 계열 추가 · `.selfbar` 삭제 | 3 |
