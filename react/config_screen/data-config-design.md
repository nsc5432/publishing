# Cast 설정 (데이터연계항목) 화면 — React 적용 설계

원본 목업: [`data-config.html`](./data-config.html) (+ 참고 스크린샷 `images/`, 원본 엑셀
`데이터연계항목.xlsx`). 이 문서는 그 목업을 `react/` 프로젝트 구조에 맞게 이식하기 위한 설계이며,
**아직 코드는 없다.** 백엔드는 추후 적용 예정이므로 지금은 목업(mock) 데이터로 화면을 완성하는 것까지가
이번 설계의 범위다.

---

## 1. 개요

**Cast 설정** 화면은 CAST 시뮬레이션 엔진에 넣는 입력 데이터(체크인 방식, 서비스타임, 시설코드, 운영시간
등)가 원본 엑셀(`데이터연계항목.xlsx`, 9개 시트)의 어느 행에 대응하는지 시설그룹별로 보여주고, 필요하면
그 값을 검토·수정하는 관리자용 화면이다. 여객이 실제로 지나는 순서(체크인 → 출국장 → 시큐리티 →
출입국심사 → 게이트)를 그대로 화면의 흐름도로 보여줘서, "이 시설그룹에 어떤 원본 데이터가 물려 있는지"를
한눈에 찾게 하는 것이 핵심이다.

- 대상 사용자: CAST 데이터를 관리하는 운영자(일반 PM 화면 사용자와는 다른, 설정/관리 성격)
- 지금 단계 방침: 백엔드 API가 없으므로 **`USE_MOCK` 목업 데이터로 화면 전체를 완성**하고, 서비스 계층의
  분기만 나중에 실통신으로 교체한다(기존 화면들이 이미 이 방식을 쓰고 있다 — §7 참고).

---

## 2. 라우트 · 메뉴

| 항목 | 값 |
|---|---|
| 라우트 | `/rui/pm/cast-config` |
| 폴더 | `modules/pm/pages/castConfig/` |
| 페이지 컴포넌트 | `CastConfig.tsx` (default export) |

`App.tsx`에 다른 화면과 같은 방식으로 지연 로딩 + 프리로드 대상 추가:

```ts
const loadCastConfig = () => import('./modules/pm/pages/castConfig/CastConfig');
const CastConfigPage = lazy(loadCastConfig);
// usePreloadPages() 의 warm() 안에도 void loadCastConfig(); 추가
// <Route path="/rui/pm/cast-config" element={<CastConfigPage />} />
```

`components/lnb/navItems.ts`의 `LNB_TOP`에 `facilityMap`과 같은 자리에 최상위 메뉴 1개 추가:

```ts
{ id: 'castConfig', icon: 'dataLink', label: 'CAST 데이터 설정', path: '/rui/pm/cast-config' },
```

`icon: 'dataLink'`는 `@/components/icons/InlineIcon`의 `IconName`에 아직 없는 이름이다. 구현 단계에서
적당한 아이콘(연결/데이터 시트 느낌)을 하나 추가해야 한다 — 기존 이름 중에서는 `layers` 또는 `grid`가
임시 대안이 될 수 있다.

---

## 3. 화면 구조 (컴포넌트 트리)

```
CastConfig.tsx (페이지 루트)
├─ Header                     기존 radio-group 패턴 재사용 (터미널 전환)
├─ FlowDiagram                터미널별 5노드 흐름도 (체크인→출국장→시큐리티→출입국심사→게이트)
│   └─ FlowNode × 5           클릭 시 onOpenGroup(groupId) 호출
└─ DataConfigModal            groupId 가 선택된 동안만 렌더
    ├─ ModalHeader            그룹 라벨/설명 + 닫기
    ├─ DatasetTabs            이 그룹에 연결된 시트 탭 (여러 개일 수 있음)
    ├─ GridToolbar            검색 입력 + 변경 건수 배지
    ├─ DataGrid               페이지네이션 포함, 수정 가능 셀만 입력형
    └─ ModalFooter            취소 / 변경사항 저장
```

목업과 다르게 가져가는 부분:

- **터미널 선택 UI**: 목업의 pill 스위처(`.terminal-switcher`, 화살표 키 이동)를 포팅하지 않고, 기존
  PM 화면들이 쓰는 `radio-group` + `header__title` Header 패턴을 그대로 재사용한다
  (`facilityMap/components/Header.tsx` 참고, `id="term-T1"`/`id="term-T2"` 그대로).
- **흐름도(FlowDiagram)**: `data-scene`/`flow-node`/`connector` 같은 문자열 기반 DOM 조작 대신, React
  컴포넌트 + `useState`(hover/focus 로 강조된 그룹)로 다시 짠다. 시각적 결과(노드 5개 + 연결선 + 호버 시
  경로 강조)는 유지한다.
- **컬럼 자동폭(`measureColumnWidths`)**: 목업은 숨은 `<span>`으로 텍스트 폭을 실측해 컬럼 너비를 정한다.
  React 그리드는 우선 CSS `minmax(90px, max-content)` 류로 단순화하는 쪽을 권장한다 — 실측 로직은
  값이 큰 시트(예: Check-in Facility Code, 1260행)에서 매 렌더 비용이 들 수 있어서, 정말 필요할 때만
  이식한다(1차 구현에서는 생략 권장).
- **인라인 편집 셀(`<textarea class="cell-input">`)**: 그대로 유지 — 시트 원본이 여러 줄 코멘트를 담는
  칸(`G열` 변경/검토 의견 등)이 있어 textarea 가 맞다.

---

## 4. 타입 설계 (`types.ts`)

```ts
export type { TerminalKind } from '@/modules/pm/types/map.types';
export { TERMINAL_LABEL, TERMINALS } from '@/modules/pm/types/map.types';

/** 시설그룹 — 흐름도 노드 5개 + 원본 전체 대조용 'all' */
export type FacilityGroupId = 'checkin' | 'departure' | 'security' | 'border' | 'gate';

/** 흐름도 노드 1개 (라벨/설명은 백엔드가 내려주거나, 화면 상수로 고정) */
export interface GroupDefinition {
    id: FacilityGroupId;
    label: string;       // 예: '체크인 영역'
    english: string;      // 예: 'Check-in Facility Group'
    description: string;  // 모달 부제
}

/** 모달 안 시트 탭 1개 */
export interface DatasetTab {
    sheetName: string;
    rowCount: number;
}

/** 그리드 컬럼 1개 (엑셀 열 문자 A, B, C... 를 그대로 key 로 쓴다) */
export interface GridColumn {
    key: string;
    label: string;
}

/** 그리드 셀 1개 */
export interface GridCell {
    value: string;
    formula: string;
    editable: boolean;
}

/** 그리드 행 1개 */
export interface GridRow {
    rowNo: number;
    cells: Record<string, GridCell>;
}

/** 시트 1개(모달의 데이터셋 탭 하나가 보여주는 실 데이터) */
export interface Dataset {
    sheetName: string;
    dimension: string;   // 예: 'A2:M338' — 안내 문구에 그대로 노출
    columns: GridColumn[];
    rows: GridRow[];
}

/** 아직 저장하지 않은 편집 값 (rowNo::column → 새 값). FcltMap 의 CastDrafts 와 동일한 형태다. */
export type DraftChanges = Record<string, string>;
```

`GroupDefinition`에는 목업의 `sources: [{ sheet, ranges, terminalColumn }]` 같은 엑셀 range 정보를 넣지
않는다. 그 계산(어느 그룹이 어느 시트의 몇~몇 행을 보는지, 터미널 컬럼값과 어떻게 매칭하는지)은 백엔드가
끝내고 내려주는 것으로 설계한다 — 프런트가 엑셀 구조(수식 여부, 행 범위)를 알아야 할 이유가 없고, 이후
엑셀 원본이 바뀌어도 화면 코드를 건드리지 않아도 된다.

---

## 5. DTO 설계 초안 (`api.types.ts`, 실 구현 시 추가)

`FcltMapListDto` / `FcltMapSaveItemDto`를 본뜬 형태다. **필드명은 백엔드 확정 전 초안**이므로 실제
연동 시 조정한다.

```ts
export interface CastConfigGroupListDto extends JsonResponse {
    tmnlId: TmnlId;
    groupList: CastConfigGroupDto[];
}

export interface CastConfigGroupDto {
    groupId: string;      // FacilityGroupId 값
    groupNm: string;
    groupNmEn: string;
    groupDesc: string;
    datasetList: CastConfigDatasetSummaryDto[]; // 탭 목록(행 수 포함, 실 데이터는 별도 조회)
}

export interface CastConfigDatasetSummaryDto {
    sheetNm: string;
    rowCnt: number;
}

/** 모달에서 탭 하나를 열 때 조회 */
export interface CastConfigDatasetDto extends JsonResponse {
    sheetNm: string;
    dimension: string;
    columnList: string[];
    rowList: CastConfigGridRowDto[];
}

export interface CastConfigGridRowDto {
    rowNo: number;
    cellList: CastConfigGridCellDto[];
}

export interface CastConfigGridCellDto {
    column: string;
    value: string;
    formula: string;
    editableYn: 'Y' | 'N';
}

/** 저장 — 바뀐 셀만 보낸다 (FcltMapSaveItemDto 와 같은 방식) */
export interface CastConfigSaveItemDto {
    sheetNm: string;
    rowNo: number;
    column: string;
    value: string;
}
```

---

## 6. API 엔드포인트 제안 (`endpoints.ts`)

```ts
// Cast 설정 (데이터연계항목)
CAST_CONFIG_GROUP_LIST: prefix + '/cast-config/retrieveGroupList',
CAST_CONFIG_DATASET: prefix + '/cast-config/retrieveDataset',
CAST_CONFIG_SAVE: prefix + '/cast-config/saveDataset',
```

기존 `/pm/cast` prefix를 그대로 쓴다(모든 PM API가 이 prefix를 공유).

---

## 7. 서비스 · 훅 · 목업

```
api/pm/services/castConfig.service.ts   USE_MOCK 분기 (fcltMap.service.ts 패턴 그대로)
api/pm/mock/castConfig.mock.ts          9개 시트 중 화면 확인에 필요한 일부 행만 옮긴 샘플
modules/pm/pages/castConfig/
  types.ts
  view.ts                               DTO → 뷰모델 매퍼 + EMPTY_* 기본값
  hooks/useCastConfigGroups.ts          터미널별 그룹 목록 (페이지 진입 시 1회)
  hooks/useCastConfigDataset.ts         모달에서 탭 하나를 열 때만 조회 (query = null 이면 미조회)
  CastConfig.tsx
  components/
    Header.tsx
    FlowDiagram.tsx
    DataConfigModal.tsx
    DatasetTabs.tsx
    GridToolbar.tsx
    DataGrid.tsx
```

- `castConfig.mock.ts`는 목업 html 의 `workbookData` 21,000행짜리 리터럴을 그대로 옮기지 않는다.
  화면 동작(탭 전환, 검색, 페이지네이션, 편집·저장) 확인에 필요한 시트당 2~30행 샘플이면 충분하다.
  전량 데이터는 실제 백엔드가 붙는 시점에 자연히 대체된다.
- 조회는 `useFetched` + `unwrap` 그대로 사용. 모달의 데이터셋 조회는 `query`를 그룹 미선택 시 `null`로
  둬서 모달이 열릴 때만 요청하게 한다(다른 화면의 "조건이 null이면 조회 안 함" 관례와 동일).
- 저장은 `userSmlt/save.ts`의 `runSave(request, failMessage)`를 그대로 재사용한다 — 성공 시
  `dialog.alert({ title: '저장', description: '현재 상태를 저장했습니다.' })`, 실패 시 에러 메시지 알럿.
  **목업의 `showToast()`는 이식하지 않는다** — 프로젝트에 토스트 컴포넌트가 없고, 저장 결과 알림은
  이미 `dialog.alert`로 통일돼 있다.
- 모달을 닫을 때 `draftChanges`가 남아 있으면 `dialog.confirm`으로 "저장하지 않은 변경사항이 있습니다.
  닫으시겠습니까?"를 물은 뒤 폐기한다(목업은 확인 없이 그냥 버림 — React 버전에서 개선).

---

## 8. 상태 관리

| 상태 | 위치 | 비고 |
|---|---|---|
| 선택된 터미널 | `CastConfig.tsx` (페이지) | 기존 관례대로 `useState<TerminalKind>('T1')` |
| 열린 그룹(`activeGroup`) | `CastConfig.tsx` | `null`이면 모달 닫힘 — `FlowNode` 클릭으로 설정 |
| 활성 데이터셋 탭 인덱스 | `DataConfigModal` 내부 | 그룹 바뀌면 0으로 리셋 |
| 검색어 · 페이지 번호 | `DataConfigModal` 내부 | 탭 전환 시 리셋 (목업과 동일) |
| `draftChanges` | `DataConfigModal` 내부 (`useState<DraftChanges>`) | 모달 닫으면 폐기, 저장 성공 시 초기화 |

전부 모달 로컬 상태로 두는 이유: 목업도 `draftChanges`를 모달 열 때마다 새로 시작하고 저장/취소 시
버리는 세션 한정 상태였다 — 페이지 레벨로 끌어올릴 이유가 없다.

---

## 9. 재사용 vs 신규 판단표

| 항목 | 판단 | 근거 |
|---|---|---|
| 터미널 탭(T1/T2) | **그대로 재사용** | `TerminalKind`/`TERMINALS`/`TERMINAL_LABEL` + `radio-group` Header |
| 조회 훅 패턴 | **그대로 재사용** | `useFetched` + `unwrap` |
| 저장 성공/실패 알림 | **그대로 재사용** | `userSmlt/save.ts`의 `runSave` |
| 미저장 변경 닫기 확인 | **그대로 재사용** | `@/lib/dialog`의 `dialog.confirm` |
| USE_MOCK 토글 구조 | **패턴만 재사용, 값은 신규** | `api/pm/mock/index.ts` + 새 `castConfig.mock.ts` |
| "바뀐 값만 모아 저장" 형태 | **패턴만 재사용, 값은 신규** | `FcltMapSaveItemDto` 형태를 본뜬 `CastConfigSaveItemDto` |
| 흐름도(FlowDiagram) | **신규 작성** | 기존 화면에 없는 컴포넌트, 목업 시각 결과만 유지 |
| 데이터 그리드(DataGrid) | **신규 작성** | 기존 화면에 스프레드시트형 그리드 없음 |
| 컬럼 자동폭 실측 | **생략(1차), 필요 시 신규** | CSS로 단순화 우선 검토 |
| 토스트 알림 | **미이식, 기존 dialog.alert 로 대체** | 프로젝트에 토스트 컴포넌트 없음 |

---

## 10. 단계적 적용 순서 (마이그레이션 노트)

1. **지금 단계**: `USE_MOCK = true` 상태로 위 구조 그대로 화면을 완성한다. 그룹 목록·데이터셋·저장이
   전부 `castConfig.mock.ts` 샘플 데이터로 동작하는지 확인한다.
2. **백엔드 확정 후**: §5의 DTO 초안을 실제 응답 형태에 맞춰 `api.types.ts`에 반영, §6 엔드포인트를
   `endpoints.ts`에 추가한다.
3. **연동 시**: `castConfig.service.ts`의 `USE_MOCK` 분기만 실통신 코드로 바꾼다 — 화면
   컴포넌트·훅·타입은 그대로 둔다(다른 PM 화면들이 이미 이 방식으로 전환된 전례를 따른다).
