import type {
    CongestionStatus,
    DepHallDto,
    DepHallGateDto,
    DepHallSlotDto,
    MapCgnStatDto,
    MapMarkerDto,
    MapNoticeDto,
    MapUnitRsltDto,
    TmnlId,
} from '@/types/api.types';

/**
 * 출국장 목업 응답 (VITE_ENABLE_MOCK=true 일 때 사용).
 *
 * 서버 DTO 와 같은 모양으로 둔다. 화면은 목업이든 실통신이든 같은 DTO 를 받으므로
 * 연동 시 화면 코드를 고칠 일이 없다.
 *
 * 하루치를 한 번에 내려준다 — 맵·표·차트 세 보기가 이 한 건을 나눠 쓴다.
 *
 * ⚠ 도면 좌표는 서버(DepHallLayout.java)가 같은 값을 내려준다. 한쪽만 고치면 어긋난다.
 */

const SMLT_ID = 'SMLT-20260710-0001';

/* ================= 타임라인 눈금 ================= */

/** 출국장 화면은 04:00 부터 그린다 (그 앞은 출국장이 열리지 않는다) */
const BGN_MIN = 4 * 60;
const STEP_MIN = 30;
/** 04:00 ~ 24:00 (20시간 / 30분) */
const MAX_STEP = 40;

function toHhmm(minutes: number): string {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');

    return hh + mm;
}

const TIME_LIST: string[] = Array.from({ length: MAX_STEP + 1 }, (_, step) =>
    toHhmm(BGN_MIN + step * STEP_MIN),
);

/* ================= 출국장 ================= */

interface GateSeed {
    depNum: string;
    /** 도면 마커 자리 (무대 기준 비율 %) */
    marker: [number, number];
    /** 카드 자리 (무대 기준 비율 %) */
    card: [number, number];
    boothCnt: number;
    /** 하루 추이의 피크 자리 / 최대 대기인원 */
    peakStep: number;
    peakWtng: number;
}

/**
 * 출국장 : T1 은 6곳.
 * 카드는 무대를 6등분한 자리에 아치를 따라 높낮이를 준다(가장자리가 낮다).
 */
const T1_GATES: GateSeed[] = [
    { depNum: '6', marker: [16.65, 79.59], card: [8.33, 67.5], boothCnt: 2, peakStep: 10, peakWtng: 320 },
    { depNum: '5', marker: [27.16, 69.76], card: [25.0, 51.3], boothCnt: 2, peakStep: 11, peakWtng: 320 },
    { depNum: '4', marker: [38.22, 63.5], card: [41.67, 45.0], boothCnt: 4, peakStep: 12, peakWtng: 140 },
    { depNum: '3', marker: [61.68, 63.5], card: [58.33, 45.0], boothCnt: 4, peakStep: 13, peakWtng: 140 },
    { depNum: '2', marker: [72.69, 69.76], card: [75.0, 51.3], boothCnt: 2, peakStep: 14, peakWtng: 320 },
    { depNum: '1', marker: [82.87, 79.59], card: [91.67, 67.5], boothCnt: 2, peakStep: 15, peakWtng: 320 },
];

/** 출국장 : T2 는 2곳뿐이라 카드를 마커 바로 위에 세운다 */
const T2_GATES: GateSeed[] = [
    { depNum: '2', marker: [36.95, 68.62], card: [36.95, 45.0], boothCnt: 4, peakStep: 12, peakWtng: 120 },
    { depNum: '1', marker: [63.05, 68.62], card: [63.05, 45.0], boothCnt: 2, peakStep: 14, peakWtng: 280 },
];

const GATE_SEEDS: Record<TmnlId, GateSeed[]> = { T1: T1_GATES, T2: T2_GATES };

/**
 * 시간대별 대기인원.
 * 04:00 부터 완만하게 오르다 피크를 찍고 내려가는 곡선을 만든다.
 */
function wtngAt(peakStep: number, peakWtng: number, step: number): number {
    const gap = Math.abs(step - peakStep);

    return Math.max(0, Math.round(peakWtng * Math.exp(-((gap / 9) ** 2)) - gap * 0.4));
}

/** 혼잡 현황 지표 4종 — 대기인원 하나에서 나머지를 끌어낸다 (값끼리 어긋나지 않도록) */
function toStat(wtngPsgCnt: number): MapCgnStatDto {
    return {
        wtngPsgCnt,
        wtngHr: Math.round(wtngPsgCnt / 8) + 2,
        prcsPsgCnt: 20 + Math.round(wtngPsgCnt / 10),
        prcsHr: 30,
    };
}

/** 대기인원 → 혼잡도 (마커 색과 카드 뱃지가 같은 근거를 쓴다) */
function toStatus(wtngPsgCnt: number): CongestionStatus {
    if (wtngPsgCnt >= 240) return 'VERY_BUSY';
    if (wtngPsgCnt >= 140) return 'BUSY';
    if (wtngPsgCnt >= 50) return 'NORMAL';

    return 'FREE';
}

/** 출국장 카드 — 자리·운영시간처럼 하루 내내 그대로인 부분만 담는다 */
function toGate(seed: GateSeed): DepHallGateDto {
    return {
        depNum: seed.depNum,
        depNm: `출국장 ${seed.depNum}`,
        cdntX: seed.card[0],
        cdntY: seed.card[1],
        boothCnt: seed.boothCnt,
        oprBgnTime: '0530',
        oprEndTime: '2330',
        useYn: 'Y',
    };
}

/* ================= 마커 ================= */

/** 아일랜드 : [라벨, x, y, 피크 자리, 피크 대기인원] */
type IslandSeed = [string, number, number, number, number];

const T1_ISLANDS: IslandSeed[] = [
    ['N', 19.21, 90.68, 10, 300],
    ['M', 22.93, 87.19, 11, 120],
    ['L', 27.16, 82.46, 12, 120],
    ['K', 31.94, 78.79, 13, 120],
    ['J', 36.55, 76.02, 14, 120],
    ['H', 41.94, 74.23, 10, 300],
    ['G', 53.18, 73.34, 11, 120],
    ['F', 58.12, 74.23, 12, 120],
    ['E', 63.07, 76.02, 13, 120],
    ['D', 67.91, 78.52, 14, 190],
    ['C', 72.8, 82.19, 10, 300],
    ['B', 77.14, 86.3, 11, 300],
    ['A', 80.75, 90.68, 12, 120],
];

const T2_ISLANDS: IslandSeed[] = [
    ['N', 17.81, 89.63, 10, 300],
    ['M', 22.26, 86.83, 11, 120],
    ['L', 27.55, 84.94, 12, 120],
    ['K', 32.78, 83.05, 13, 120],
    ['J', 38.01, 81.7, 14, 120],
    ['H', 43.18, 80.34, 10, 300],
    ['G', 48.41, 79.8, 11, 120],
    ['F', 56.15, 79.8, 12, 120],
    ['E', 61.49, 80.34, 13, 120],
    ['D', 66.83, 81.24, 14, 190],
    ['C', 72.18, 82.96, 10, 300],
    ['B', 77.57, 84.76, 11, 300],
    ['A', 82.08, 86.83, 12, 120],
];

/** 출입구 게이트 : [번호, x, y] */
type GateMarkerSeed = [string, number, number];

/** T1 은 14곳 */
const T1_GATE_MARKERS: GateMarkerSeed[] = [
    ['14', 21.37, 97.12],
    ['13', 25.21, 92.29],
    ['12', 29.71, 88.27],
    ['11', 33.72, 84.87],
    ['10', 38.5, 82.46],
    ['9', 42.83, 80.85],
    ['8', 47.39, 79.86],
    ['7', 52.4, 79.86],
    ['6', 56.96, 80.85],
    ['5', 61.46, 82.72],
    ['4', 66.27, 85.23],
    ['3', 70.24, 88.53],
    ['2', 74.75, 92.38],
    ['1', 78.53, 97.12],
];

/** T2 는 12곳 */
const T2_GATE_MARKERS: GateMarkerSeed[] = [
    ['12', 23.1, 96.39],
    ['11', 27.97, 94.23],
    ['10', 32.86, 92.88],
    ['9', 37.75, 91.34],
    ['8', 42.65, 90.31],
    ['7', 47.55, 90.26],
    ['6', 52.45, 90.26],
    ['5', 57.35, 90.31],
    ['4', 62.25, 91.34],
    ['3', 67.14, 92.88],
    ['2', 72.03, 94.23],
    ['1', 76.9, 96.39],
];

const ISLAND_SEEDS: Record<TmnlId, IslandSeed[]> = { T1: T1_ISLANDS, T2: T2_ISLANDS };
const GATE_MARKER_SEEDS: Record<TmnlId, GateMarkerSeed[]> = {
    T1: T1_GATE_MARKERS,
    T2: T2_GATE_MARKERS,
};

/** 마커는 자리와 라벨만 갖는다 (혼잡도는 슬롯이 채운다) */
function toIslandMarkers(tmnlId: TmnlId): MapMarkerDto[] {
    return ISLAND_SEEDS[tmnlId].map(([label, cdntX, cdntY]) => ({
        markerId: label,
        label,
        cdntX,
        cdntY,
    }));
}

function toGateMarkers(tmnlId: TmnlId): MapMarkerDto[] {
    return GATE_MARKER_SEEDS[tmnlId].map(([label, cdntX, cdntY]) => ({
        markerId: `g${label}`,
        label,
        cdntX,
        cdntY,
    }));
}

function toDepMarkers(seeds: GateSeed[]): MapMarkerDto[] {
    return seeds.map((seed) => ({
        markerId: `dg${seed.depNum}`,
        label: seed.depNum,
        cdntX: seed.marker[0],
        cdntY: seed.marker[1],
    }));
}

/* ================= 슬롯 ================= */

function toUnitRslt(unitCd: string, wtngPsgCnt: number): MapUnitRsltDto {
    return { unitCd, cgnStatus: toStatus(wtngPsgCnt), stat: toStat(wtngPsgCnt) };
}

/** 알림은 매우혼잡한 출국장만 모은다 (카드와 같은 근거) */
function toNotice(depRsltList: MapUnitRsltDto[], seeds: GateSeed[]): MapNoticeDto {
    const boothCntMap = new Map(seeds.map((seed) => [seed.depNum, seed.boothCnt]));
    const busy = depRsltList.filter((rslt) => rslt.cgnStatus === 'VERY_BUSY');

    return {
        cgnStatus: busy.length > 0 ? 'BUSY' : 'NORMAL',
        itemList: [...busy]
            .sort((a, b) => Number(a.unitCd) - Number(b.unitCd))
            .map((rslt) => ({
                fcltNm: `출국장 ${rslt.unitCd}`,
                fcltCd: `DG${rslt.unitCd.padStart(2, '0')}`,
                boothCnt: boothCntMap.get(rslt.unitCd) ?? 0,
            })),
    };
}

function toSlot(tmnlId: TmnlId, hhmm: string, step: number): DepHallSlotDto {
    const seeds = GATE_SEEDS[tmnlId];
    const depRsltList = seeds.map((seed) =>
        toUnitRslt(seed.depNum, wtngAt(seed.peakStep, seed.peakWtng, step)),
    );

    return {
        hhmm,
        notice: toNotice(depRsltList, seeds),
        depRsltList,
        chknRsltList: ISLAND_SEEDS[tmnlId].map(([label, , , peakStep, peakWtng]) =>
            toUnitRslt(label, wtngAt(peakStep, peakWtng, step)),
        ),
    };
}

export const depHallMock = {
    /** 화면 하루치 — 타임라인은 slotList 에서 자리만 바꿔 읽는다 */
    getDepHall: (tmnlId: TmnlId): DepHallDto => ({
        error: false,
        errorMessage: '',
        smltId: SMLT_ID,
        tmnlId,
        gateList: GATE_SEEDS[tmnlId].map(toGate),
        depMarkerList: toDepMarkers(GATE_SEEDS[tmnlId]),
        chknMarkerList: toIslandMarkers(tmnlId),
        gateMarkerList: toGateMarkers(tmnlId),
        slotList: TIME_LIST.map((hhmm, step) => toSlot(tmnlId, hhmm, step)),
    }),
};
