import type {
    CongestionLevel,
    DepGateMarker,
    GateMarker,
    HeaderSummary,
    IslandDetail,
    IslandMarker,
    NoticeData,
    OperCard,
    TerminalKind,
    TerminalMapData,
} from './types';

/**
 * 맵 형태 조회 목업 데이터.
 * 실제 API 연동 전, 화면과 인터랙션(터미널 전환/타임라인/팝업)을 확인하기 위한 정적 데이터.
 * 컴포넌트는 이 파일의 데이터를 소비하고 상호작용만 상태로 관리한다.
 */

/* ================= 헤더 / 조회 조건 ================= */

export const HEADER = {
    baseDate: '2024/10/23',
    defaultTerminal: 'T1' as TerminalKind,
};

export const SUMMARY: Record<TerminalKind, HeaderSummary> = {
    T1: { flight: '1,234,567', pax: '1,234,567' },
    T2: { flight: '987,654', pax: '987,654' },
};

/* ================= 좌측 네비게이션(Lnb) ================= */

/* 메뉴 구성은 화면 공용(@/components/lnb)이라 여기서는 활성 항목만 지정한다. */
/** 시안 기준 활성 항목 (상단: 강조 배경 / 하단: 맵 화면이므로 map 강조) */
export const DEFAULT_NAV_TOP = 'chart';
export const DEFAULT_NAV_BOTTOM = 'map';

/* ================= 혼잡 알림 ================= */

export const NOTICES: Record<TerminalKind, NoticeData> = {
    T1: {
        level: 'severe',
        items: [
            { id: 'n1', facility: '체크인카운터', code: 'M11', desc: '3개 부스 OPEN' },
            { id: 'n2', facility: '체크인카운터', code: 'K09', desc: '4개 부스 OPEN' },
            { id: 'n3', facility: '출국장', code: 'DG02', desc: '2개 부스 OPEN' },
            { id: 'n4', facility: '보안검색대', code: 'SG14', desc: '2개 부스 OPEN' },
            { id: 'n5', facility: '체크인카운터', code: 'L10', desc: '2개 부스 OPEN' },
            { id: 'n6', facility: '체크인카운터', code: 'C10', desc: '2개 부스 OPEN' },
        ],
    },
    T2: {
        level: 'busy',
        items: [
            { id: 'n1', facility: '체크인카운터', code: 'D07', desc: '3개 부스 OPEN' },
            { id: 'n2', facility: '체크인카운터', code: 'F02', desc: '2개 부스 OPEN' },
            { id: 'n3', facility: '출국장', code: 'DG01', desc: '2개 부스 OPEN' },
            { id: 'n4', facility: '보안검색대', code: 'SG05', desc: '3개 부스 OPEN' },
        ],
    },
};

/* ================= 운영시간 카드 ================= */

/**
 * 도넛 카드는 출국장 1곳당 1개다 (TERMINAL_MAP 의 depGates 와 같은 개수).
 * T1 은 6곳 + 도면 연결동이 지나가는 가운데 빈 칸 1개, T2 는 2곳뿐이다.
 */
const OPER_BASE = { rate: 75, time: '05:30-23:30', desc: '하루 18시간 운영' };

export const OPER_CARDS: Record<TerminalKind, OperCard[]> = {
    T1: [
        { id: 'o1', ...OPER_BASE },
        { id: 'o2', ...OPER_BASE },
        { id: 'o3', ...OPER_BASE },
        { id: 'o4', ...OPER_BASE, empty: true },
        { id: 'o5', ...OPER_BASE },
        { id: 'o6', ...OPER_BASE, dim: true },
        { id: 'o7', ...OPER_BASE, dim: true },
    ],
    T2: [
        { id: 'o1', ...OPER_BASE },
        { id: 'o2', ...OPER_BASE, dim: true },
    ],
};

/* ================= 도면 마커 ================= */

/**
 * 좌표는 도면 무대(.map__bg) 기준 비율(%)이다.
 * 도면 SVG 가 preserveAspectRatio="none" 이므로 마커 비율과 도면 좌표가
 * 1:1 로 대응한다 → 창 크기가 변해도 어긋나지 않는다.
 */
/** 시안에서 측정한 도면 배치 비율 (T1 기준) */
const STAGE_ASPECT = '1798.6 / 1118.7';

/** 출국장 : 도면 상단 라인 위 (T1 = 6곳) */
const T1_DEP_GATES: DepGateMarker[] = [
    { id: 'dg6', label: '6', x: 16.65, y: 79.59 },
    { id: 'dg5', label: '5', x: 27.16, y: 69.76 },
    { id: 'dg4', label: '4', x: 38.22, y: 63.5 },
    { id: 'dg3', label: '3', x: 61.68, y: 63.5 },
    { id: 'dg2', label: '2', x: 72.69, y: 69.76 },
    { id: 'dg1', label: '1', x: 82.87, y: 79.59 },
];

/** 출국장 : T2 는 2곳만 운영한다 (T1 의 가운데 두 자리) */
const T2_DEP_GATES: DepGateMarker[] = [
    { id: 'dg2', label: '2', x: 38.22, y: 63.5 },
    { id: 'dg1', label: '1', x: 61.68, y: 63.5 },
];

/** 아일랜드 A~N : 두 터미널 공통 구성 */
const ISLANDS: IslandMarker[] = [
    { id: 'N', label: 'N', level: 'crowded', x: 19.21, y: 90.68 },
    { id: 'M', label: 'M', level: 'normal', x: 22.93, y: 87.19 },
    { id: 'L', label: 'L', level: 'normal', x: 27.16, y: 82.46 },
    { id: 'K', label: 'K', level: 'normal', x: 31.94, y: 78.79 },
    { id: 'J', label: 'J', level: 'normal', x: 36.55, y: 76.02 },
    { id: 'H', label: 'H', level: 'crowded', x: 41.94, y: 74.23 },
    { id: 'G', label: 'G', level: 'normal', x: 53.18, y: 73.34 },
    { id: 'F', label: 'F', level: 'normal', x: 58.12, y: 74.23 },
    { id: 'E', label: 'E', level: 'normal', x: 63.07, y: 76.02 },
    { id: 'D', label: 'D', level: 'busy', x: 67.91, y: 78.52 },
    { id: 'C', label: 'C', level: 'crowded', x: 72.8, y: 82.19 },
    { id: 'B', label: 'B', level: 'crowded', x: 77.14, y: 86.3 },
    { id: 'A', label: 'A', level: 'normal', x: 80.75, y: 90.68 },
];

/** 출입구 게이트 1~14 : 탑승동 아치 안쪽 라인 위 (두 터미널 공통 구성) */
const GATES: GateMarker[] = [
    { id: 'g14', label: '14', x: 21.37, y: 97.12 },
    { id: 'g13', label: '13', x: 25.21, y: 92.29 },
    { id: 'g12', label: '12', x: 29.71, y: 88.27 },
    { id: 'g11', label: '11', x: 33.72, y: 84.87 },
    { id: 'g10', label: '10', x: 38.5, y: 82.46 },
    { id: 'g9', label: '9', x: 42.83, y: 80.85 },
    { id: 'g8', label: '8', x: 47.39, y: 79.86 },
    { id: 'g7', label: '7', x: 52.4, y: 79.86 },
    { id: 'g6', label: '6', x: 56.96, y: 80.85 },
    { id: 'g5', label: '5', x: 61.46, y: 82.72 },
    { id: 'g4', label: '4', x: 66.27, y: 85.23 },
    { id: 'g3', label: '3', x: 70.24, y: 88.53 },
    { id: 'g2', label: '2', x: 74.75, y: 92.38 },
    { id: 'g1', label: '1', x: 78.53, y: 97.12 },
];

/**
 * 아일랜드 · 출입구 게이트는 두 터미널이 동일한 구성이고,
 * 출국장 개수만 다르다 (T1: 6곳 / T2: 2곳).
 */
export const TERMINAL_MAP: Record<TerminalKind, TerminalMapData> = {
    T1: { stageAspect: STAGE_ASPECT, depGates: T1_DEP_GATES, islands: ISLANDS, gates: GATES },
    T2: { stageAspect: STAGE_ASPECT, depGates: T2_DEP_GATES, islands: ISLANDS, gates: GATES },
};

/* ================= 아일랜드 상세 팝업 ================= */

/** 혼잡도별 대기 지표 (시안: 혼잡 = 빨간 강조) */
const LEVEL_STAT: Record<CongestionLevel, { wait: string; waitTime: string }> = {
    normal: { wait: '1', waitTime: '4' },
    busy: { wait: '2', waitTime: '9' },
    crowded: { wait: '3', waitTime: '16' },
};

/**
 * 아일랜드 마커 하나의 상세 정보를 만든다.
 * 시안(일일-맵형태 조회T1-팝업.png)의 M아일랜드를 기준으로,
 * 라벨/혼잡도에 따라 값만 달라지는 목업이다.
 */
export function buildIslandDetail(terminal: TerminalKind, island: IslandMarker): IslandDetail {
    const seed = island.label.charCodeAt(0) - 65; // A=0
    const level = LEVEL_STAT[island.level];

    return {
        id: island.id,
        title: `${island.label}아일랜드`,
        code: `${terminal}-3RD-${island.label}01-01`,
        level: island.level,
        facilities: [
            { kind: 'counter', name: '체크인카운터', rate: `처리율 ${90 - (seed % 3) * 5}%` },
            { kind: 'selfcheck', name: '셀프체크인', rate: '처리율 100%' },
            { kind: 'store', name: '상업시설' },
        ],
        stats: [
            { ico: 'wait-people', label: '대기인원', value: level.wait, unit: '명', point: true },
            { ico: 'wait-time', label: '대기시간', value: level.waitTime, unit: '초', point: true },
            { ico: 'done-people', label: '처리인원', value: '20', unit: '명' },
            { ico: 'done-time', label: '처리시간', value: '30', unit: '초' },
        ],
        sales: {
            total: `${(33063915 + seed * 121500).toLocaleString()}원`,
            storeCount: `${9 - (seed % 4)}개`,
            perPax: `${(1742 + seed * 37).toLocaleString()}원`,
            paxDelta: '8명',
            rate: '+15%',
            rateUp: true,
            rateBase: 'vs 2023',
        },
    };
}

/* ================= 타임라인 ================= */

/** 재생 단위(분) */
export const TIMELINE_STEP_MIN = 30;
/** 00:00 ~ 24:00 (24시간 / 30분) */
export const TIMELINE_MAX_STEP = 48;
/** 재생 간격(ms) */
export const TIMELINE_INTERVAL = 600;
