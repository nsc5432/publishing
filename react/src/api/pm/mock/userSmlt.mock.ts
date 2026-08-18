import type {
    ChknIslandDto,
    FcltType,
    FltPsgChartDto,
    JsonResponse,
    MapMarkerDto,
    SmltKpiDto,
    TmnlId,
    UserSmltChknDto,
    UserSmltDepDto,
    UserSmltDepItemDto,
    UserSmltExecDto,
    UserSmltFcltMapDto,
    UserSmltFltPsgDto,
    UserSmltInfoDto,
    WaitPsgDto,
} from '@/types/api.types';

/**
 * 사용자 시뮬레이션 - 조건 설정 목업 응답 (VITE_ENABLE_MOCK=true 일 때 사용).
 *
 * 저장/실행은 서버 상태를 바꾸는 호출이라 목업에서는 성공만 돌려준다.
 * (저장한 값이 다음 조회에 반영되는 것처럼 보이면 실제 연동에서 어긋난다)
 */

const YMD = '20260710';
const SAVE_DT = '20260710093000';

/** 편집 대상 시뮬레이션 ID — 터미널마다 따로 잡힌다 */
const SMLT_ID: Record<TmnlId, string> = {
    T1: 'USMLT-20260710-T1-01',
    T2: 'USMLT-20260710-T2-01',
};

const OK: JsonResponse = { error: false, errorMessage: '' };

/* ================= 운항편/여객수 ================= */

/** 하단 시간 스케일 — 04시부터 2시간 단위 12구간 */
const CHART_TIMES = ['04', '06', '08', '10', '12', '14', '16', '18', '20', '22', '00', '02'];

/** 막대 비율(0~100)을 Y축 최댓값에 맞춘 값으로 편다 */
function toChart(totCnt: number, maxCnt: number, ratios: number[]): FltPsgChartDto {
    return {
        totCnt,
        maxCnt,
        itemList: ratios.map((ratio, i) => ({
            time: CHART_TIMES[i],
            cnt: Math.round((maxCnt * ratio) / 100),
        })),
    };
}

/** 시간대별 수정 — [수정 비율(%), 승객 수] 를 04:00 부터 1시간 단위로 편다 */
function toHourList(seed: Array<[number, number]>) {
    const pad = (hour: number) => `${String(hour).padStart(2, '0')}00`;

    return seed.map(([adjRate, psgCnt], i) => ({
        bgnTime: pad(4 + i),
        endTime: pad(5 + i),
        adjRate,
        psgCnt,
    }));
}

const FLT_PSG: Record<TmnlId, UserSmltFltPsgDto> = {
    T1: {
        ...OK,
        tmnlId: 'T1',
        fltCnt: 15,
        psgCnt: 1234567,
        peakTime: '1400',
        adjType: 'RATIO',
        adjRate: 10,
        fltChart: toChart(1234, 300, [5, 8, 6, 33, 40, 67, 68, 67, 33, 33, 16, 6]),
        psgChart: toChart(1234567, 90000, [6, 10, 7, 34, 39, 68, 68, 67, 34, 33, 15, 6]),
        hourList: toHourList([
            [10, 12340],
            [0, 18220],
            [5, 24510],
            [0, 31080],
            [-5, 44760],
            [0, 52300],
            [15, 61940],
            [0, 58120],
            [0, 49870],
            [10, 55430],
            [0, 67210],
            [0, 63050],
        ]),
    },
    T2: {
        ...OK,
        tmnlId: 'T2',
        fltCnt: 9,
        psgCnt: 842310,
        peakTime: '1600',
        adjType: 'RATIO',
        adjRate: 0,
        fltChart: toChart(842, 300, [4, 6, 9, 22, 31, 44, 52, 48, 27, 21, 11, 5]),
        psgChart: toChart(842310, 90000, [5, 7, 10, 23, 30, 45, 53, 47, 26, 20, 12, 4]),
        hourList: toHourList([
            [0, 8120],
            [0, 11460],
            [0, 16900],
            [0, 21340],
            [0, 29770],
            [0, 35010],
            [0, 41220],
            [0, 39880],
            [0, 33150],
            [0, 37600],
            [0, 45730],
            [0, 42090],
        ]),
    },
};

/* ================= 조회 결과 공용 ================= */

/** 시간대별 대기인원 (0~23시) */
function toWaitList(counts: number[]): WaitPsgDto[] {
    return counts.map((waitPsgCnt, hour) => ({ hour, waitPsgCnt }));
}

/* ================= 체크인 카운터 ================= */

/** 아일랜드 문자 — 원본 배정정보와 동일하게 I 를 건너뛴다 */
const ISLAND_CD_LIST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N'];

/** 배정 가능 항공사 */
const ALN_CD_LIST = ['KE', 'OZ'];

/** [문자, 시작시, 종료시, 부스별 항공사(''=미배정), 키오스크, 백드롭] */
type IslandSeed = [string, number, number, string[], number, number];

function toIsland([
    island,
    bgnHour,
    endHour,
    alnCds,
    kioskCnt,
    bagDropCnt,
]: IslandSeed): ChknIslandDto {
    return {
        island,
        boothCnt: alnCds.length,
        kioskCnt,
        bagDropCnt,
        oprTimeList: [{ bgnHour, endHour }],
        boothList: alnCds.map((alnCd, i) => ({ boothNo: i + 1, alnCd, customYn: 'N' })),
    };
}

const NA = '';

const CHKN_ISLANDS: Record<TmnlId, IslandSeed[]> = {
    T1: [
        ['A', 5, 22, ['KE', 'KE', 'KE', 'KE', 'OZ', 'OZ', 'OZ', NA], 2, 2],
        ['B', 6, 20, ['KE', 'KE', 'KE', 'OZ', 'OZ', NA], 2, 1],
        ['C', 7, 19, ['OZ', 'OZ', 'KE', NA], 1, 1],
        ['D', 9, 17, ['OZ', 'OZ', 'OZ', 'KE', 'KE', NA], 2, 1],
        ['E', 11, 15, ['KE', 'KE', NA], 1, 1],
        ['F', 13, 15, ['OZ', NA, NA], 0, 0],
    ],
    T2: [
        ['A', 5, 21, ['KE', 'KE', 'KE', 'KE', 'OZ', NA], 2, 1],
        ['B', 7, 19, ['KE', 'KE', 'OZ', NA], 2, 1],
        ['C', 10, 16, ['KE', 'OZ', NA], 1, 1],
    ],
};

const CHKN_WAIT: Record<TmnlId, number[]> = {
    T1: [
        0, 0, 0, 0, 0, 40, 120, 230, 340, 300, 250, 280, 320, 360, 300, 240, 200, 170, 140, 100, 60,
        20, 0, 0,
    ],
    T2: [
        0, 0, 0, 0, 0, 20, 60, 110, 150, 130, 110, 120, 140, 160, 130, 100, 80, 60, 45, 30, 15, 5,
        0, 0,
    ],
};

const CHKN_KPI: Record<TmnlId, SmltKpiDto> = {
    T1: { avgWaitMin: 15, p95WaitMin: 12, maxQueuePsgCnt: 20, utilRate: 84 },
    T2: { avgWaitMin: 9, p95WaitMin: 7, maxQueuePsgCnt: 11, utilRate: 61 },
};

/** 피크 카운터 = 시간대별 운영 부스 합의 최댓값 */
function peakCounterCnt(islands: ChknIslandDto[]): number {
    const byHour: number[] = Array(24).fill(0);

    islands.forEach((island) => {
        island.oprTimeList.forEach(({ bgnHour, endHour }) => {
            for (let hour = bgnHour; hour < endHour; hour += 1) byHour[hour] += island.boothCnt;
        });
    });

    return Math.max(0, ...byHour);
}

function buildChkn(tmnlId: TmnlId): UserSmltChknDto {
    const islandList = CHKN_ISLANDS[tmnlId].map(toIsland);
    const sum = (pick: (island: ChknIslandDto) => number) =>
        islandList.reduce((total, island) => total + pick(island), 0);

    return {
        ...OK,
        tmnlId,
        totCnt: 36,
        peakCounterCnt: peakCounterCnt(islandList),
        totKioskCnt: sum((island) => island.kioskCnt),
        totBagDropCnt: sum((island) => island.bagDropCnt),
        waitMaxCnt: 400,
        islandCdList: ISLAND_CD_LIST,
        alnCdList: ALN_CD_LIST,
        islandList,
        waitList: toWaitList(CHKN_WAIT[tmnlId]),
        kpi: CHKN_KPI[tmnlId],
    };
}

/* ================= 출국장 ================= */

/** [번호, 시작시, 종료시, 미운영, 검색대, 일반, 스마트패스, 운영계획[시작, 종료, 대수]] */
type DepSeed = [
    string,
    number,
    number,
    boolean,
    number,
    number,
    number,
    Array<[number, number, number]>,
];

function toDep([
    depNum,
    bgnHour,
    endHour,
    off,
    scCnt,
    normalCnt,
    smartPassCnt,
    plans,
]: DepSeed): UserSmltDepItemDto {
    return {
        depNum,
        depNm: `출국장 ${depNum}`,
        oprYn: off ? 'N' : 'Y',
        scCnt,
        normalCnt,
        smartPassCnt,
        oprTimeList: [{ bgnHour, endHour }],
        planList: plans.map(([planBgn, planEnd, cnt], i) => ({
            planSn: i + 1,
            bgnHour: planBgn,
            endHour: planEnd,
            scCnt: cnt,
        })),
    };
}

const DEP_GATES: Record<TmnlId, DepSeed[]> = {
    T1: [
        [
            '1',
            5,
            18,
            false,
            8,
            3,
            2,
            [
                [5, 12, 6],
                [12, 18, 8],
            ],
        ],
        ['2', 6, 21, true, 6, 2, 1, [[6, 21, 6]]],
        [
            '3',
            6,
            21,
            false,
            6,
            2,
            2,
            [
                [6, 14, 4],
                [14, 21, 6],
            ],
        ],
        [
            '4',
            6,
            20,
            false,
            10,
            3,
            2,
            [
                [6, 8, 4],
                [8, 12, 10],
                [12, 16, 8],
                [16, 20, 6],
            ],
        ],
        ['5', 7, 20, true, 4, 2, 1, [[7, 20, 4]]],
        ['6', 7, 19, false, 4, 2, 1, [[7, 19, 4]]],
    ],
    T2: [
        [
            '1',
            7,
            21,
            false,
            5,
            3,
            1,
            [
                [7, 13, 4],
                [13, 21, 5],
            ],
        ],
        ['2', 7, 20, true, 4, 2, 1, [[7, 20, 4]]],
    ],
};

const DEP_WAIT: Record<TmnlId, number[]> = {
    T1: [
        0, 0, 0, 0, 0, 25, 90, 180, 260, 230, 190, 210, 240, 270, 220, 180, 150, 120, 95, 65, 35,
        12, 0, 0,
    ],
    T2: [0, 0, 0, 0, 0, 0, 0, 30, 55, 48, 40, 44, 50, 58, 47, 38, 30, 24, 18, 12, 6, 0, 0, 0],
};

const DEP_KPI: Record<TmnlId, SmltKpiDto> = {
    T1: { avgWaitMin: 15, p95WaitMin: 12, maxQueuePsgCnt: 20, utilRate: 84 },
    T2: { avgWaitMin: 6, p95WaitMin: 5, maxQueuePsgCnt: 8, utilRate: 47 },
};

/** 피크 검색대 = 시간대별 검색대 합의 최댓값 (미운영 출국장은 뺀다) */
function peakScCnt(depList: UserSmltDepItemDto[]): number {
    const byHour: number[] = Array(24).fill(0);

    depList
        .filter((dep) => dep.oprYn === 'Y')
        .forEach((dep) => {
            dep.planList.forEach((plan) => {
                for (let hour = plan.bgnHour; hour < plan.endHour; hour += 1) {
                    byHour[hour] += plan.scCnt;
                }
            });
        });

    return Math.max(0, ...byHour);
}

function buildDep(tmnlId: TmnlId): UserSmltDepDto {
    const depList = DEP_GATES[tmnlId].map(toDep);

    return {
        ...OK,
        tmnlId,
        peakScCnt: peakScCnt(depList),
        waitMaxCnt: 300,
        depList,
        waitList: toWaitList(DEP_WAIT[tmnlId]),
        kpi: DEP_KPI[tmnlId],
    };
}

/* ================= 지도 보기 ================= */

/** 체크인 카운터 — 아일랜드 마커 (도면 무대 기준 비율 %) */
const CHKN_MARKERS: Array<[string, number, number]> = [
    ['N', 19.21, 90.68],
    ['M', 22.93, 87.19],
    ['L', 27.16, 82.46],
    ['K', 31.94, 78.79],
    ['J', 36.55, 76.02],
    ['H', 41.94, 74.23],
    ['G', 53.18, 73.34],
    ['F', 58.12, 74.23],
    ['E', 63.07, 76.02],
    ['D', 67.91, 78.52],
    ['C', 72.8, 82.19],
    ['B', 77.14, 86.3],
    ['A', 80.75, 90.68],
];

/** 출국장 마커 */
const DEP_MARKERS: Record<TmnlId, Array<[string, number, number]>> = {
    T1: [
        ['6', 16.65, 79.59],
        ['5', 27.16, 69.76],
        ['4', 38.22, 63.5],
        ['3', 61.68, 63.5],
        ['2', 72.69, 69.76],
        ['1', 82.87, 79.59],
    ],
    T2: [
        ['2', 36.95, 68.62],
        ['1', 63.05, 68.62],
    ],
};

function toMarkerList(tmnlId: TmnlId, fcltType: FcltType, island: string): MapMarkerDto[] {
    const seeds =
        fcltType === 'CHKN' || fcltType === 'SLFCHKN' ? CHKN_MARKERS : DEP_MARKERS[tmnlId];

    return seeds
        .filter(([label]) => !island || label === island)
        .map(([label, cdntX, cdntY]) => ({
            markerId: fcltType === 'CHKN' || fcltType === 'SLFCHKN' ? label : `dg${label}`,
            label,
            cdntX,
            cdntY,
        }));
}

export const userSmltMock = {
    getInfo: (ymd: string, tmnlId: TmnlId): UserSmltInfoDto => ({
        ...OK,
        smltId: SMLT_ID[tmnlId],
        ymd: ymd || YMD,
        saveDt: SAVE_DT,
        execStatus: 'DONE',
    }),

    getFltPsgInfo: (tmnlId: TmnlId): UserSmltFltPsgDto => FLT_PSG[tmnlId],

    getChknCounterInfo: (tmnlId: TmnlId): UserSmltChknDto => buildChkn(tmnlId),

    getDepInfo: (tmnlId: TmnlId): UserSmltDepDto => buildDep(tmnlId),

    getFcltMap: (tmnlId: TmnlId, fcltType: FcltType, island = ''): UserSmltFcltMapDto => ({
        ...OK,
        tmnlId,
        fcltType,
        island,
        markerList: toMarkerList(tmnlId, fcltType, island),
    }),

    /** 저장 — 목업은 성공만 돌려준다 */
    save: (): JsonResponse => OK,

    /** 실행 — 비동기로 시작만 걸린다 */
    execute: (smltId: string): UserSmltExecDto => ({
        ...OK,
        smltId,
        execSn: 1,
        execStatus: 'RUNNING',
        bgnDt: SAVE_DT,
    }),
};
