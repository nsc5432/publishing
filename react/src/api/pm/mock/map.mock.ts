import type {
    CongestionStatus,
    MapCgnStatDto,
    MapChknDetailDto,
    MapDepDetailDto,
    MapMarkerDto,
    MapNoticeDto,
    MapOperCardDto,
    SmltMapDto,
    TmnlId,
} from '@/types/api.types';

/**
 * 맵형태보기 목업 응답 (VITE_ENABLE_MOCK=true 일 때 사용).
 *
 * 서버 DTO 와 같은 모양으로 둔다. 도면 좌표(비율 %)까지 서버가 내려주는 값이라
 * 화면은 마커를 그리기만 하고 자리를 알지 못한다.
 */

const SMLT_ID = 'SMLT-20260710-0001';

/* ================= 시각 ================= */

/** 맵형태보기 타임라인은 00:00 ~ 24:00, 30분 단위 */
const STEP_MIN = 30;
const MAX_STEP = 48;

function toStep(hhmm: string): number {
    const minutes = Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(2, 4));

    return Math.min(MAX_STEP, Math.max(0, Math.round(minutes / STEP_MIN)));
}

/**
 * 시간대별 대기인원 — 오전 피크(08~10시)를 찍고 내려가는 곡선.
 * 마커 색·팝업 지표가 모두 이 값에서 나오므로 타임라인을 옮기면 함께 움직인다.
 */
function wtngAt(peakStep: number, peakWtng: number, step: number): number {
    const gap = Math.abs(step - peakStep);

    return Math.max(0, Math.round(peakWtng * Math.exp(-((gap / 10) ** 2)) - gap * 0.4));
}

/** 혼잡 현황 지표 4종 — 대기인원 하나에서 나머지를 끌어낸다 */
function toStat(wtngPsgCnt: number): MapCgnStatDto {
    return {
        wtngPsgCnt,
        wtngHr: Math.round(wtngPsgCnt / 8) + 2,
        prcsPsgCnt: 20 + Math.round(wtngPsgCnt / 10),
        prcsHr: 30,
    };
}

function toStatus(wtngPsgCnt: number): CongestionStatus {
    if (wtngPsgCnt >= 240) return 'VERY_BUSY';
    if (wtngPsgCnt >= 140) return 'BUSY';
    if (wtngPsgCnt >= 50) return 'NORMAL';

    return 'FREE';
}

/* ================= 도면 마커 =================
 *
 * 좌표는 도면 무대(.map__bg) 기준 비율(%)이다.
 * 도면 SVG 가 preserveAspectRatio="none" 이므로 마커 비율과 도면 좌표가 1:1 로 대응한다.
 */

/** 출국장 : [번호, x, y, 피크 자리, 피크 대기인원] */
type DepSeed = [string, number, number, number, number];

/** 출국장 : T1 = 6곳 */
const T1_DEPS: DepSeed[] = [
    ['6', 16.65, 79.59, 18, 120],
    ['5', 27.16, 69.76, 19, 190],
    ['4', 38.22, 63.5, 20, 120],
    ['3', 61.68, 63.5, 20, 300],
    ['2', 72.69, 69.76, 21, 120],
    ['1', 82.87, 79.59, 22, 190],
];

/** 출국장 : T2 는 2곳만 운영한다 (T1 의 가운데 두 자리) */
const T2_DEPS: DepSeed[] = [
    ['2', 38.22, 63.5, 20, 300],
    ['1', 61.68, 63.5, 21, 120],
];

/**
 * 아일랜드 A~N : [문자, x, y, 피크 자리, 피크 대기인원].
 *
 * 터미널마다 도면의 콘코스 위치가 달라 좌표를 따로 갖는다 — T1 은 아치(가운데 y≒73%),
 * T2 는 그보다 낮고 완만한 띠(가운데 y≒78%)다. 한 벌로 쓰면 T2 마커가 건물 위로 떠오른다.
 * 서버(MapLayout.java)의 값과 같아야 마커가 도면 위 같은 자리에 얹힌다.
 */
const ISLAND_SEEDS: Record<TmnlId, DepSeed[]> = {
    T1: [
        ['N', 19.21, 90.68, 18, 300],
        ['M', 22.93, 87.19, 18, 120],
        ['L', 27.16, 82.46, 19, 120],
        ['K', 31.94, 78.79, 19, 120],
        ['J', 36.55, 76.02, 20, 120],
        ['H', 41.94, 74.23, 20, 300],
        ['G', 53.18, 73.34, 20, 120],
        ['F', 58.12, 74.23, 21, 120],
        ['E', 63.07, 76.02, 21, 120],
        ['D', 67.91, 78.52, 21, 190],
        ['C', 72.8, 82.19, 22, 300],
        ['B', 77.14, 86.3, 22, 300],
        ['A', 80.75, 90.68, 22, 120],
    ],
    T2: [
        ['N', 19.0, 89.8, 18, 300],
        ['M', 24.2, 85.5, 18, 120],
        ['L', 29.3, 82.4, 19, 120],
        ['K', 34.5, 80.1, 19, 120],
        ['J', 39.7, 78.9, 20, 120],
        ['H', 44.8, 78.2, 20, 300],
        ['G', 50.0, 78.0, 20, 120],
        ['F', 55.2, 78.2, 21, 120],
        ['E', 60.3, 78.9, 21, 120],
        ['D', 65.5, 80.2, 21, 190],
        ['C', 70.7, 82.3, 22, 300],
        ['B', 75.8, 85.4, 22, 300],
        ['A', 81.0, 89.5, 22, 120],
    ],
};

/** 출입구 게이트 1~14 : 탑승동 아치 안쪽 라인 (두 터미널 공통 배치) */
const GATES: Array<[string, number, number]> = [
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

const DEP_SEEDS: Record<TmnlId, DepSeed[]> = { T1: T1_DEPS, T2: T2_DEPS };

function toMarkers(seeds: DepSeed[], prefix: string, step: number): MapMarkerDto[] {
    return seeds.map(([label, cdntX, cdntY, peakStep, peakWtng]) => ({
        markerId: prefix + label,
        label,
        cdntX,
        cdntY,
        cgnStatus: toStatus(wtngAt(peakStep, peakWtng, step)),
    }));
}

/* ================= 운영시간 카드 ================= */

/**
 * 운영시간 도넛은 출국장 1곳당 1개다 (마커와 같은 개수·같은 순서).
 * 뒤쪽 두 곳은 미운영으로 두어 흐림 표기를 확인할 수 있게 한다.
 */
function toOperCards(seeds: DepSeed[]): MapOperCardDto[] {
    const offFrom = seeds.length - 2;

    return seeds.map(([depNum], i) => ({
        depNum,
        oprRate: 75,
        oprBgnTime: '0530',
        oprEndTime: '2330',
        oprHr: 18,
        useYn: i >= offFrom ? 'N' : 'Y',
    }));
}

/* ================= 혼잡 알림 ================= */

const NOTICES: Record<TmnlId, MapNoticeDto> = {
    T1: {
        cgnStatus: 'VERY_BUSY',
        itemList: [
            { fcltNm: '체크인카운터', fcltCd: 'M11', boothCnt: 3 },
            { fcltNm: '체크인카운터', fcltCd: 'K09', boothCnt: 4 },
            { fcltNm: '출국장', fcltCd: 'DG02', boothCnt: 2 },
            { fcltNm: '보안검색대', fcltCd: 'SG14', boothCnt: 2 },
            { fcltNm: '체크인카운터', fcltCd: 'L10', boothCnt: 2 },
            { fcltNm: '체크인카운터', fcltCd: 'C10', boothCnt: 2 },
        ],
    },
    T2: {
        cgnStatus: 'BUSY',
        itemList: [
            { fcltNm: '체크인카운터', fcltCd: 'D07', boothCnt: 3 },
            { fcltNm: '체크인카운터', fcltCd: 'F02', boothCnt: 2 },
            { fcltNm: '출국장', fcltCd: 'DG01', boothCnt: 2 },
            { fcltNm: '보안검색대', fcltCd: 'SG05', boothCnt: 3 },
        ],
    },
};

/* ================= 헤더 요약 ================= */

const SUMMARY: Record<TmnlId, { fltCnt: number; psgCnt: number }> = {
    T1: { fltCnt: 1234567, psgCnt: 1234567 },
    T2: { fltCnt: 987654, psgCnt: 987654 },
};

/* ================= 상세 팝업 ================= */

/** 아일랜드 문자 → 값의 씨앗 (A=0) */
function islandSeed(island: string): number {
    return Math.max(0, island.charCodeAt(0) - 65);
}

function findIsland(tmnlId: TmnlId, island: string): DepSeed | undefined {
    return ISLAND_SEEDS[tmnlId].find(([label]) => label === island);
}

function findDep(tmnlId: TmnlId, depNum: string): DepSeed | undefined {
    return DEP_SEEDS[tmnlId].find(([label]) => label === depNum);
}

export const mapMock = {
    /** 도면 본문 — 타임라인 시각 기준 */
    getSmltMap: (tmnlId: TmnlId, hhmm: string): SmltMapDto => {
        const step = toStep(hhmm);

        return {
            error: false,
            errorMessage: '',
            smltId: SMLT_ID,
            tmnlId,
            hhmm,
            summary: SUMMARY[tmnlId],
            notice: NOTICES[tmnlId],
            operCardList: toOperCards(DEP_SEEDS[tmnlId]),
            depMarkerList: toMarkers(DEP_SEEDS[tmnlId], 'dg', step),
            chknMarkerList: toMarkers(ISLAND_SEEDS[tmnlId], '', step),
            gateMarkerList: GATES.map(([label, cdntX, cdntY]) => ({
                markerId: `g${label}`,
                label,
                cdntX,
                cdntY,
            })),
        };
    },

    /** 아일랜드 마커 클릭 — 상세 팝업 */
    getChknDetail: (tmnlId: TmnlId, island: string, hhmm: string): MapChknDetailDto => {
        const seed = islandSeed(island);
        const marker = findIsland(tmnlId, island);
        const wtngPsgCnt = marker ? wtngAt(marker[3], marker[4], toStep(hhmm)) : 0;

        return {
            error: false,
            errorMessage: '',
            island,
            fcltCd: `${tmnlId}-3RD-${island}01-01`,
            cgnStatus: toStatus(wtngPsgCnt),
            fcltList: [
                { fcltType: 'CHKN', fcltNm: '체크인카운터', prcsRate: 90 - (seed % 3) * 5 },
                { fcltType: 'SLFCHKN', fcltNm: '셀프체크인', prcsRate: 100 },
                { fcltType: 'CMRC', fcltNm: '상업시설', prcsRate: null },
            ],
            stat: toStat(wtngPsgCnt),
            sales: {
                totAmt: 33063915 + seed * 121500,
                storeCnt: 9 - (seed % 4),
                amtPerPsg: 1742 + seed * 37,
                psgDiffCnt: 8,
                diffRate: 15,
                cmprYear: '2023',
            },
        };
    },

    /** 출국장 마커 클릭 — 미니 팝업 */
    getDepDetail: (tmnlId: TmnlId, depNum: string, hhmm: string): MapDepDetailDto => {
        const marker = findDep(tmnlId, depNum);
        const wtngPsgCnt = marker ? wtngAt(marker[3], marker[4], toStep(hhmm)) : 0;

        return {
            error: false,
            errorMessage: '',
            depNum,
            depNm: `출국장 ${depNum}`,
            cgnStatus: toStatus(wtngPsgCnt),
            stat: toStat(wtngPsgCnt),
        };
    },
};
