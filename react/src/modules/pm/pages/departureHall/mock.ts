import type {
    CongestionLevel,
    DepGateCard,
    DepStat,
    DepTrend,
    GateMarker,
    IslandMarker,
    NoticeData,
    TerminalDepMap,
    TerminalKind,
} from './types';

/**
 * 일일 시뮬레이션 결과 조회 — 출국장 목업 데이터.
 * 실제 API 연동 전, 화면과 인터랙션(터미널 전환 / 보기 전환 / 타임라인)을 확인하기 위한 정적 데이터.
 */

/* ================= 헤더 / 조회 조건 ================= */

export const HEADER = {
    baseDate: '2024/10/23',
    defaultTerminal: 'T1' as TerminalKind,
};

/* 메뉴 구성은 화면 공용(@/components/lnb)이라 여기서는 활성 항목만 지정한다. */
export const DEFAULT_NAV_BOTTOM = 'departure';

/* ================= 타임라인 ================= */

/** 재생 단위(분) */
export const TIMELINE_STEP_MIN = 30;
/** 타임라인 시작 시각(분) — 출국장은 04:00 부터 그린다 */
export const TIMELINE_BGN_MIN = 4 * 60;
/** 04:00 ~ 24:00 (20시간 / 30분) */
export const TIMELINE_MAX_STEP = 40;
/** 재생 간격(ms) */
export const TIMELINE_INTERVAL = 600;

/** 타임라인 스텝 → HH:mm */
export function formatStep(step: number) {
    const minutes = TIMELINE_BGN_MIN + step * TIMELINE_STEP_MIN;
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/* ================= 도면 배치 ================= */

/**
 * 좌표는 도면 무대(.dep-stage) 기준 비율(%)이다.
 * 무대는 도면 배경(.dep-view__bg)에 대한 고정 비율 박스라(departureHall.css)
 * 창 크기가 변해도 마커·카드가 배경 위 같은 자리에 얹힌다.
 *
 * ⚠ 서버(DepHallLayout.java)가 같은 좌표를 내려준다. 한쪽만 고치면 어긋난다.
 */

/** 출국장 마커 : T1 = 6곳 */
const T1_DEP_POINTS: Array<[string, number, number]> = [
    ['6', 16.65, 79.59],
    ['5', 27.16, 69.76],
    ['4', 38.22, 63.5],
    ['3', 61.68, 63.5],
    ['2', 72.69, 69.76],
    ['1', 82.87, 79.59],
];

/** 출국장 마커 : T2 = 2곳 */
const T2_DEP_POINTS: Array<[string, number, number]> = [
    ['2', 36.95, 68.62],
    ['1', 63.05, 68.62],
];

/**
 * 출국장 카드 자리.
 * T1 은 무대를 6등분한 자리에 아치를 따라 높낮이를 준다(가장자리가 낮다).
 * T2 는 출국장이 2곳뿐이라 마커 바로 위에 세운다.
 */
const T1_CARD_POINTS: Record<string, [number, number]> = {
    '6': [8.33, 67.5],
    '5': [25.0, 51.3],
    '4': [41.67, 45.0],
    '3': [58.33, 45.0],
    '2': [75.0, 51.3],
    '1': [91.67, 67.5],
};

const T2_CARD_POINTS: Record<string, [number, number]> = {
    '2': [36.95, 45.0],
    '1': [63.05, 45.0],
};

/** 아일랜드 A~N : 터미널마다 배치가 다르다 */
const T1_ISLANDS: IslandMarker[] = [
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

const T2_ISLANDS: IslandMarker[] = [
    { id: 'N', label: 'N', level: 'crowded', x: 17.81, y: 89.63 },
    { id: 'M', label: 'M', level: 'normal', x: 22.26, y: 86.83 },
    { id: 'L', label: 'L', level: 'normal', x: 27.55, y: 84.94 },
    { id: 'K', label: 'K', level: 'normal', x: 32.78, y: 83.05 },
    { id: 'J', label: 'J', level: 'normal', x: 38.01, y: 81.7 },
    { id: 'H', label: 'H', level: 'crowded', x: 43.18, y: 80.34 },
    { id: 'G', label: 'G', level: 'normal', x: 48.41, y: 79.8 },
    { id: 'F', label: 'F', level: 'normal', x: 56.15, y: 79.8 },
    { id: 'E', label: 'E', level: 'normal', x: 61.49, y: 80.34 },
    { id: 'D', label: 'D', level: 'busy', x: 66.83, y: 81.24 },
    { id: 'C', label: 'C', level: 'crowded', x: 72.18, y: 82.96 },
    { id: 'B', label: 'B', level: 'crowded', x: 77.57, y: 84.76 },
    { id: 'A', label: 'A', level: 'normal', x: 82.08, y: 86.83 },
];

/** 출입구 게이트 : T1 은 14곳 */
const T1_GATES: GateMarker[] = [
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

/** 출입구 게이트 : T2 는 12곳 */
const T2_GATES: GateMarker[] = [
    { id: 'g12', label: '12', x: 23.1, y: 96.39 },
    { id: 'g11', label: '11', x: 27.97, y: 94.23 },
    { id: 'g10', label: '10', x: 32.86, y: 92.88 },
    { id: 'g9', label: '9', x: 37.75, y: 91.34 },
    { id: 'g8', label: '8', x: 42.65, y: 90.31 },
    { id: 'g7', label: '7', x: 47.55, y: 90.26 },
    { id: 'g6', label: '6', x: 52.45, y: 90.26 },
    { id: 'g5', label: '5', x: 57.35, y: 90.31 },
    { id: 'g4', label: '4', x: 62.25, y: 91.34 },
    { id: 'g3', label: '3', x: 67.14, y: 92.88 },
    { id: 'g2', label: '2', x: 72.03, y: 94.23 },
    { id: 'g1', label: '1', x: 76.9, y: 96.39 },
];

/* ================= 출국장 카드 ================= */

/** 혼잡도별 대기 지표 — 도면 마커 색과 카드 값이 같은 근거를 쓴다 */
const LEVEL_STAT: Record<CongestionLevel, { wait: string; waitTime: string }> = {
    normal: { wait: '1', waitTime: '4' },
    busy: { wait: '2', waitTime: '9' },
    crowded: { wait: '3', waitTime: '16' },
};

/** 혼잡 현황 지표 4종 */
export function buildStats(level: CongestionLevel): DepStat[] {
    const wait = LEVEL_STAT[level];

    return [
        { ico: 'wait-people', label: '대기인원', value: wait.wait, unit: '명', point: true },
        { ico: 'wait-time', label: '대기시간', value: wait.waitTime, unit: '초', point: true },
        { ico: 'done-people', label: '처리인원', value: '20', unit: '명' },
        { ico: 'done-time', label: '처리시간', value: '30', unit: '초' },
    ];
}

/** [출국장 번호, 혼잡도, 운영 부스 수] */
type CardSeed = [string, CongestionLevel, number];

const T1_CARD_SEEDS: CardSeed[] = [
    ['6', 'crowded', 2],
    ['5', 'crowded', 2],
    ['4', 'normal', 4],
    ['3', 'normal', 4],
    ['2', 'crowded', 2],
    ['1', 'crowded', 2],
];

const T2_CARD_SEEDS: CardSeed[] = [
    ['2', 'normal', 4],
    ['1', 'crowded', 2],
];

function toCards(seeds: CardSeed[], points: Record<string, [number, number]>): DepGateCard[] {
    return seeds.map(([depNum, level, boothCnt]) => {
        const [x, y] = points[depNum];

        return {
            id: `dg${depNum}`,
            depNum,
            title: `출국장 ${depNum}`,
            level,
            stats: buildStats(level),
            boothCnt,
            operTime: '05:30-23:30',
            x,
            y,
        };
    });
}

/** 카드와 마커는 같은 혼잡도를 쓴다 (카드 = 마커의 상세) */
function toDepGates(points: Array<[string, number, number]>, cards: DepGateCard[]) {
    return points.map(([label, x, y]) => ({
        id: `dg${label}`,
        label,
        level: cards.find((card) => card.depNum === label)?.level ?? 'normal',
        x,
        y,
    }));
}

const T1_CARDS = toCards(T1_CARD_SEEDS, T1_CARD_POINTS);
const T2_CARDS = toCards(T2_CARD_SEEDS, T2_CARD_POINTS);

export const TERMINAL_MAP: Record<TerminalKind, TerminalDepMap> = {
    T1: {
        cards: T1_CARDS,
        depGates: toDepGates(T1_DEP_POINTS, T1_CARDS),
        islands: T1_ISLANDS,
        gates: T1_GATES,
    },
    T2: {
        cards: T2_CARDS,
        depGates: toDepGates(T2_DEP_POINTS, T2_CARDS),
        islands: T2_ISLANDS,
        gates: T2_GATES,
    },
};

/* ================= 혼잡 알림 ================= */

/** 알림은 혼잡한 출국장만 모은다 (카드와 같은 근거) */
function toNotice(cards: DepGateCard[]): NoticeData {
    const crowded = cards.filter((card) => card.level === 'crowded');

    return {
        level: crowded.length > 0 ? 'busy' : 'normal',
        items: [...crowded]
            .sort((a, b) => Number(a.depNum) - Number(b.depNum))
            .map((card) => ({
                id: card.id,
                facility: card.title,
                desc: `${card.boothCnt}개 부스 OPEN`,
            })),
    };
}

export const NOTICES: Record<TerminalKind, NoticeData> = {
    T1: toNotice(T1_CARDS),
    T2: toNotice(T2_CARDS),
};

/* ================= 차트 보기 ================= */

/** 출국장별 꺾은선 색 (번호 순) */
const TREND_COLORS = ['#4441cc', '#e12b2b', '#1f9d3a', '#e8a318', '#2f7ff0', '#8b5cf6'];

/**
 * 시간대별 대기인원 추이.
 * 04:00 부터 완만하게 오르다 오전 피크(08~10시)를 찍고 내려가는 곡선을 만든다.
 */
function toTrendValues(peakStep: number, peak: number): number[] {
    return Array.from({ length: TIMELINE_MAX_STEP + 1 }, (_, step) => {
        const gap = Math.abs(step - peakStep);
        const value = peak * Math.exp(-((gap / 9) ** 2)) - gap * 0.4;

        return Math.max(0, Math.round(value));
    });
}

export const TRENDS: Record<TerminalKind, DepTrend> = {
    T1: {
        timeLabels: Array.from({ length: TIMELINE_MAX_STEP + 1 }, (_, step) => formatStep(step)),
        series: T1_CARDS.map((card, i) => ({
            depNum: card.depNum,
            title: card.title,
            color: TREND_COLORS[i % TREND_COLORS.length],
            values: toTrendValues(10 + i, card.level === 'crowded' ? 320 : 140),
        })),
    },
    T2: {
        timeLabels: Array.from({ length: TIMELINE_MAX_STEP + 1 }, (_, step) => formatStep(step)),
        series: T2_CARDS.map((card, i) => ({
            depNum: card.depNum,
            title: card.title,
            color: TREND_COLORS[i % TREND_COLORS.length],
            values: toTrendValues(12 + i * 2, card.level === 'crowded' ? 280 : 120),
        })),
    },
};
