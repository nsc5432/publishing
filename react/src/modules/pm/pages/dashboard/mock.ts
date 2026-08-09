import type { IconName } from './components/PmIcons';
import type { SimulationType, TerminalKind } from './types';

/**
 * 대시보드 목업 데이터.
 * 실제 API 연동 전, 화면과 버튼 동작을 확인하기 위한 정적 데이터 모음.
 * 컴포넌트는 이 파일의 데이터를 소비하고, 상호작용(선택/토글/캐러셀)만 상태로 관리한다.
 */

/* ================= 헤더 / 조회 조건 ================= */

/** 기준 시 선택 옵션 */
export const HOUR_OPTIONS = ['08', '09', '10', '11', '12', '13', '14', '15'];
/** 기준 분 선택 옵션 */
export const MINUTE_OPTIONS = ['00', '10', '20', '30', '40', '50'];

export const HEADER = {
    baseDate: '2026/07/10',
    planDate: '2026-07-10',
    lastCalc: '2026-10-18 10:47:00',
    nextCalc: '2026-10-18 11:00:00',
    defaultHour: '10',
    defaultMinute: '00',
    /** btn-primary 기본 시뮬레이션 버전 */
    defaultSimulation: 'user' as SimulationType,
};

/** 상단 X축(시간대) 라벨 */
export const HOUR_AXIS = ['1', '3', '6', '9', '12', '15', '18', '21'];

/* ================= 좌측 네비게이션(Lnb) ================= */

/** 최초 활성 네비 (하단 그룹: 아이콘 색 강조. 상단은 경로에서 정해진다) */
export const DEFAULT_NAV_BOTTOM = 'summary';

/* ================= 터미널 요약 패널 ================= */

export interface GaugeData {
    value: number;
    main: string;
    sub: string;
}

export interface GateChip {
    label: string;
    /** dashboard.css 의 .chip.r/.g/.o/.gray/.gray2/.k 등 */
    kind: string;
}

export interface GateMeta {
    k: string;
    v: string;
    acc?: boolean;
}

/** 게이트 캐러셀의 한 페이지(아일랜드/출국장 1개 상태) */
export interface GateVariant {
    isl?: string;
    num: string;
    numSmall?: string;
    meta: GateMeta[];
    processRate: GaugeData;
    clearTime: GaugeData;
    rec: { tag: string; name: string; cnt: string; cap: string; capAccent?: boolean };
    chips: GateChip[];
}

export interface GateData {
    title: string;
    warn: string;
    variants: GateVariant[];
}

export interface SummaryStat {
    icon: IconName;
    iconClass: string;
    value: string;
    unit: string;
    deltaLabel: string;
    delta: string;
}

export interface SummaryInfoCell {
    k: string;
    v: string;
    u: string;
}

export interface TableRow {
    time: string;
    pax: string;
    wait: string;
    process: string;
    ratio: string;
}

export interface TerminalData {
    cls: string;
    gauge: string;
    barText: string;
    /** 헤더 통계(지난주 同요일 대비) */
    stats: { flights: { delta: string; value: string }; pax: { delta: string; value: string }; boardingRate: string };
    peak: { ampm: string; time: string; totalWait: string; maxWait: string; hourlyProcess: string };
    /** 요약 뷰 상단 2셀 */
    summaryStats: SummaryStat[];
    summaryInfo: SummaryInfoCell[];
    gates: GateData[];
    tableRows: TableRow[];
    /** 테이블 뷰에서 최초 선택 행 */
    defaultSelectedRow: number;
}

const CHECKIN_GATE: GateData = {
    title: '체크인카운터',
    warn: '혼잡 4개 or 원할',
    variants: [
        {
            isl: '아일랜드',
            num: 'B',
            numSmall: '(좌측 B4~B8)',
            meta: [
                { k: '전체', v: '14' },
                { k: '운영', v: '14', acc: true },
                { k: '대기열', v: '640' },
            ],
            processRate: { value: 0.78, main: '00', sub: 'Pax/Min' },
            clearTime: { value: 0.62, main: '11:00', sub: '이후' },
            rec: { tag: '추천', name: '대한항공', cnt: '5', cap: '배정 필요' },
            chips: [
                { label: 'N', kind: 'r' },
                { label: 'M', kind: 'g' },
                { label: 'L', kind: 'g' },
                { label: 'K', kind: 'g' },
                { label: 'J', kind: 'g' },
                { label: 'H', kind: 'r' },
                { label: 'G', kind: 'g' },
                { label: 'F', kind: 'g' },
                { label: 'E', kind: 'g' },
                { label: 'D', kind: 'o' },
                { label: 'C', kind: 'r' },
                { label: 'B', kind: 'r' },
                { label: 'A', kind: 'g' },
            ],
        },
        {
            isl: '아일랜드',
            num: 'D',
            numSmall: '(중앙 D1~D6)',
            meta: [
                { k: '전체', v: '12' },
                { k: '운영', v: '10', acc: true },
                { k: '대기열', v: '410' },
            ],
            processRate: { value: 0.66, main: '00', sub: 'Pax/Min' },
            clearTime: { value: 0.5, main: '11:20', sub: '이후' },
            rec: { tag: '추천', name: '아시아나', cnt: '3', cap: '배정 필요' },
            chips: [
                { label: 'N', kind: 'g' },
                { label: 'M', kind: 'g' },
                { label: 'L', kind: 'r' },
                { label: 'K', kind: 'o' },
                { label: 'J', kind: 'g' },
                { label: 'H', kind: 'g' },
                { label: 'G', kind: 'g' },
                { label: 'F', kind: 'r' },
                { label: 'E', kind: 'g' },
                { label: 'D', kind: 'g' },
                { label: 'C', kind: 'g' },
                { label: 'B', kind: 'g' },
                { label: 'A', kind: 'g' },
            ],
        },
    ],
};

const DEPARTURE_GATE_T1: GateData = {
    title: '출국장',
    warn: '혼잡 4개 or 원할',
    variants: [
        {
            num: '3번',
            meta: [{ k: '예상인원', v: '640' }],
            processRate: { value: 0.78, main: '00', sub: 'Pax/Min' },
            clearTime: { value: 0.62, main: '11:00', sub: '이후' },
            rec: { tag: '추천', name: '보안검색대', cnt: '6', cap: '소요', capAccent: true },
            chips: [
                { label: '6', kind: 'gray' },
                { label: '5', kind: 'g' },
                { label: '4', kind: 'r' },
                { label: '3', kind: 'g' },
                { label: '2', kind: 'gray2' },
                { label: '1', kind: 'k' },
            ],
        },
        {
            num: '1번',
            meta: [{ k: '예상인원', v: '430' }],
            processRate: { value: 0.55, main: '00', sub: 'Pax/Min' },
            clearTime: { value: 0.4, main: '11:30', sub: '이후' },
            rec: { tag: '추천', name: '보안검색대', cnt: '4', cap: '소요', capAccent: true },
            chips: [
                { label: '6', kind: 'g' },
                { label: '5', kind: 'g' },
                { label: '4', kind: 'g' },
                { label: '3', kind: 'r' },
                { label: '2', kind: 'gray2' },
                { label: '1', kind: 'k' },
            ],
        },
    ],
};

const DEPARTURE_GATE_T2: GateData = {
    title: '출국장',
    warn: '혼잡 4개 or 원할',
    variants: [
        {
            num: '1번',
            meta: [{ k: '예상인원', v: '640' }],
            processRate: { value: 0.78, main: '00', sub: 'Pax/Min' },
            clearTime: { value: 0.62, main: '11:00', sub: '이후' },
            rec: { tag: '추천', name: '보안검색대', cnt: '6', cap: '소요', capAccent: true },
            chips: [
                { label: '2', kind: 'gray2' },
                { label: '1', kind: 'k' },
            ],
        },
        {
            num: '2번',
            meta: [{ k: '예상인원', v: '430' }],
            processRate: { value: 0.55, main: '00', sub: 'Pax/Min' },
            clearTime: { value: 0.4, main: '11:30', sub: '이후' },
            rec: { tag: '추천', name: '보안검색대', cnt: '4', cap: '소요', capAccent: true },
            chips: [
                { label: '2', kind: 'gray2' },
                { label: '1', kind: 'k' },
            ],
        },
    ],
};

function makeTableRows(): TableRow[] {
    const base = ['00', '01', '02', '03', '04', '05', '06', '07'];
    return base.map((h, i) => ({
        time: `${h}:00`,
        pax: (1000 + i * 137).toLocaleString(),
        wait: '00:10',
        process: '00:10',
        ratio: `${80 + i * 2}`,
    }));
}

export const TERMINALS: Record<TerminalKind, TerminalData> = {
    T1: {
        cls: 'panel-blue',
        gauge: '#2f7ff0',
        barText: '2026- 07-10 FRI 10:00 AM',
        stats: {
            flights: { delta: '+1,234', value: '270' },
            pax: { delta: '+2,688', value: '12,423' },
            boardingRate: '79',
        },
        peak: { ampm: 'AM', time: '10:00', totalWait: '240', maxWait: '40', hourlyProcess: '240' },
        summaryStats: [
            {
                icon: 'plane',
                iconClass: 'i-blue i-32',
                value: '270',
                unit: '편',
                deltaLabel: '전일 대비',
                delta: '+2',
            },
            {
                icon: 'people',
                iconClass: 'i-teal i-32',
                value: '12,423',
                unit: '명',
                deltaLabel: '전일 대비',
                delta: '+1,234',
            },
        ],
        summaryInfo: [
            { k: '대기\n인원수', v: '268', u: '명' },
            { k: '최대\n대기시간', v: '40', u: '분' },
            { k: '시간당\n처리인원', v: '268', u: '명' },
        ],
        gates: [CHECKIN_GATE, DEPARTURE_GATE_T1],
        tableRows: makeTableRows(),
        defaultSelectedRow: 4,
    },
    T2: {
        cls: 'panel-green',
        gauge: '#2f7ff0',
        barText: '2026- 07-10 FRI 10:00 AM',
        stats: {
            flights: { delta: '+980', value: '219' },
            pax: { delta: '+1,942', value: '9,860' },
            boardingRate: '74',
        },
        peak: { ampm: 'AM', time: '09:00', totalWait: '198', maxWait: '35', hourlyProcess: '210' },
        summaryStats: [
            {
                icon: 'plane',
                iconClass: 'i-blue i-32',
                value: '219',
                unit: '편',
                deltaLabel: '전일 대비',
                delta: '+5',
            },
            {
                icon: 'people',
                iconClass: 'i-teal i-32',
                value: '9,860',
                unit: '명',
                deltaLabel: '전일 대비',
                delta: '+842',
            },
        ],
        summaryInfo: [
            { k: '대기\n인원수', v: '212', u: '명' },
            { k: '최대\n대기시간', v: '35', u: '분' },
            { k: '시간당\n처리인원', v: '230', u: '명' },
        ],
        gates: [CHECKIN_GATE, DEPARTURE_GATE_T2],
        tableRows: makeTableRows(),
        defaultSelectedRow: 4,
    },
};

/** 터미널별 최초 뷰 (T1=요약, T2=출국장 테이블) */
export const DEFAULT_TERMINAL_VIEW: Record<TerminalKind, 'summary' | 'table'> = {
    T1: 'summary',
    T2: 'table',
};
