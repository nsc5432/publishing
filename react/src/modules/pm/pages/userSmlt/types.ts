import type { TimeRange } from '@/components/ui/time-range-selector';

/** 터미널 구분 */
export type TerminalKind = 'T1' | 'T2';

/** 좌/우 패널 렌더 순서 */
export const TERMINALS: readonly TerminalKind[] = ['T1', 'T2'];

/**
 * 시뮬레이션 대상으로 켜 둔 터미널.
 *
 * 도입 화면에서 1개 또는 2개를 고르고, 설정 도중에도 패널 스위치로 켜고 끌 수 있다.
 * 켠 터미널은 계속 켜져 있다 — `한 번에 하나만 활성` 이 아니다.
 * 둘 다 끄면 고를 것이 없어지므로 **최소 1개**는 켜 둔다.
 */
export type TerminalEnabled = Record<TerminalKind, boolean>;

/** 아직 아무 터미널도 고르지 않은 상태 = 도입 화면 */
export const NO_TERMINAL: TerminalEnabled = { T1: false, T2: false };

/** 켜 둔 터미널 목록 (패널 순서대로) */
export function enabledTerminals(enabled: TerminalEnabled): TerminalKind[] {
    return TERMINALS.filter((terminal) => enabled[terminal]);
}

/** 반대편 터미널 — 하나를 끌 때 편집 초점을 넘길 곳 */
export function otherTerminal(terminal: TerminalKind): TerminalKind {
    return terminal === 'T1' ? 'T2' : 'T1';
}

/**
 * 탭 3개가 똑같이 받는 props.
 *
 * `enabled` 는 편집 가능 여부(켜짐/꺼짐)이고, `focusTerminal` 은 화면에 하나뿐인
 * 편집 도크·드로어가 어느 패널을 보고 있는지다. 둘 다 켜져 있어도 도크는 하나라
 * 두 값을 나눠 둔다.
 */
export interface SmltTabProps {
    smltIds: Record<TerminalKind, string>;
    /** 조회 버튼을 누를 때마다 올라간다 — 같은 조건이라도 다시 부르기 위한 값 */
    reloadKey: number;
    enabled: TerminalEnabled;
    /** 패널 스위치 — 마지막 1개는 끌 수 없다 */
    onToggleTerminal: (terminal: TerminalKind) => void;
    focusTerminal: TerminalKind;
    onFocusChange: (terminal: TerminalKind) => void;
    /**
     * 조회 전용 — 대시보드에서 `어떤 설정으로 실행했는지` 보러 들어온 상태.
     *
     * 결과를 확인하러 온 것이라 편집 진입점(저장 · 터미널 스위치 · 편집 도크 · 상세 드로어)을
     * 아예 그리지 않는다. 차트·격자·KPI 는 그대로 보인다.
     */
    readOnly?: boolean;
}

/**
 * 사용자 시뮬레이션 탭.
 * 리뉴얼에서 5개 → 3개로 줄었다.
 *   - 셀프체크인/백드롭 → 체크인 카운터로 흡수 (하단 셀프 서비스 바 + 드로어 스테퍼)
 *   - 보안 검색대       → 출국장으로 흡수 (보조 블럭 차트 + 드로어 구간표)
 */
export type SmltTabKey = 'flightPax' | 'checkinCounter' | 'departure';

/** 탭 노출 순서 */
export const SMLT_TABS: readonly SmltTabKey[] = ['flightPax', 'checkinCounter', 'departure'];

export const SMLT_TAB_LABEL: Record<SmltTabKey, string> = {
    flightPax: '운항편/여객수',
    checkinCounter: '체크인 카운터',
    departure: '출국장',
};

/* =====================================================================
   블럭 차트 공용 타입
   체크인 카운터(아일랜드)와 출국장(출국장·보안검색대)이 같은 차트를 쓰므로
   타입도 화면 단위로 한 곳에 둔다.
   ===================================================================== */

/** 블럭 색 — userSmlt.css 의 --i1 ~ --i6 (브랜드 보라 명도 5단 + 보조 틸) */
export type BlockColor = 'i1' | 'i2' | 'i3' | 'i4' | 'i5' | 'i6';

/** 색을 순서대로 돌려쓴다 (아일랜드 / 출국장이 늘어나도 색이 비지 않도록) */
export const BLOCK_COLORS: readonly BlockColor[] = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6'];

/** 블럭 차트 항목 1개 = 시설 1개(아일랜드 / 출국장) */
export interface BlockItem {
    /** 블럭 안에 찍히는 라벨 (아일랜드 문자 / 출국장 번호) */
    label: string;
    color: BlockColor;
    /** 운영 시간 구간 — 이 구간의 시간마다 블럭이 쌓인다 */
    ranges: TimeRange[];
    /** 시설의 실제 규모(부스 석 수 / 검색대 대수). 블럭 수 = ceil(size / unitSize) */
    size: number;
    /**
     * 운영 중인 면. 'L' 또는 'R' 한쪽만 있으면 블럭을 위/아래로 갈라 그린다.
     * 없거나 둘 다 있으면 통 블럭 — 출국장은 넘기지 않는다.
     */
    sides?: readonly ('L' | 'R')[];
}

/** 블럭 차트 범례 1개 */
export interface BlockLegend {
    label: string;
    color: BlockColor;
    /** 라벨 뒤 보조 문구 (예: `8석`) */
    note?: string;
}

/** 블럭 차트 위에 겹쳐 그리는 대기인원수 꺾은선 */
export interface WaitLineData {
    /** 0~23시 24개 */
    data: number[];
    /** 우측 축 최댓값 */
    max: number;
    label?: string;
    unit?: string;
}

/** 패널 헤드 우측의 시뮬레이션 결과 지표 (평균대기 / P95대기 / 최대 큐인원 / 가동률) */
export interface PanelKpi {
    label: string;
    value: string;
    unit: string;
}
