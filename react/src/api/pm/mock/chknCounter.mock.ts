import type {
    ChknCounterDto,
    ChknCounterIslandDto,
    ChknCounterRsrcDto,
    ChknCounterSlotDto,
    CongestionStatus,
    MapCgnStatDto,
    MapChknRsltDto,
    MapNoticeDto,
    TmnlId,
} from '@/types/api.types';

/**
 * 체크인카운터 목업 응답 (VITE_ENABLE_MOCK=true 일 때 사용).
 *
 * 서버 DTO 와 같은 모양으로 둔다. 화면은 목업이든 실통신이든 같은 DTO 를 받으므로
 * 연동 시 화면 코드를 고칠 일이 없다.
 *
 * 하루치를 한 번에 내려준다 — 차트와 표가 모두 30분 슬롯을 읽는다. 값의 근거는
 * 아일랜드 Queue 하나에 모아 두고 나머지를 끌어내 차트와 표가 서로 다른 이야기를 하지 않게 한다.
 */

const SMLT_ID = 'SMLT-20260710-0001';

/* ================= 타임라인 눈금 ================= */

const STEP_MIN = 30;
/** 00:00 ~ 24:00 (24시간 / 30분) */
const MAX_STEP = 48;
const HOUR_PER_DAY = 24;

function toHhmm(minutes: number): string {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');

    return hh + mm;
}

const TIME_LIST: string[] = Array.from({ length: MAX_STEP + 1 }, (_, step) =>
    toHhmm(step * STEP_MIN),
);

/* ================= 아일랜드 ================= */

interface IslandSeed {
    island: string;
    /** 보유 카운터 수 (아일랜드 골격) */
    totCnt: number;
    /** 유인 카운터 배정 대수 */
    counterCnt: number;
    kioskCnt: number;
    bagDropCnt: number;
    /** 운영 시간 (시) */
    operBgngHour: number;
    operEndHour: number;
    alnCdList: string[];
    /** 하루 추이의 피크 자리(슬롯 번호) / 최대 Queue 인원 */
    peakStep: number;
    peakWtng: number;
}

/** 아일랜드는 A~N (I 제외) 13곳이다. 배정이 없는 아일랜드는 counterCnt 가 0 이다 */
const T1_ISLANDS: IslandSeed[] = [
    { island: 'A', totCnt: 36, counterCnt: 28, kioskCnt: 8, bagDropCnt: 4, operBgngHour: 5, operEndHour: 22, alnCdList: ['KE'], peakStep: 14, peakWtng: 260 },
    { island: 'B', totCnt: 36, counterCnt: 24, kioskCnt: 6, bagDropCnt: 4, operBgngHour: 5, operEndHour: 21, alnCdList: ['KE', 'OZ'], peakStep: 15, peakWtng: 320 },
    { island: 'C', totCnt: 36, counterCnt: 18, kioskCnt: 6, bagDropCnt: 2, operBgngHour: 6, operEndHour: 21, alnCdList: ['OZ'], peakStep: 16, peakWtng: 180 },
    { island: 'D', totCnt: 36, counterCnt: 20, kioskCnt: 4, bagDropCnt: 2, operBgngHour: 6, operEndHour: 22, alnCdList: ['OZ', '7C'], peakStep: 18, peakWtng: 140 },
    { island: 'E', totCnt: 36, counterCnt: 16, kioskCnt: 4, bagDropCnt: 2, operBgngHour: 6, operEndHour: 20, alnCdList: ['7C', 'LJ'], peakStep: 20, peakWtng: 120 },
    { island: 'F', totCnt: 36, counterCnt: 12, kioskCnt: 4, bagDropCnt: 0, operBgngHour: 7, operEndHour: 20, alnCdList: ['LJ'], peakStep: 22, peakWtng: 90 },
    { island: 'G', totCnt: 36, counterCnt: 0, kioskCnt: 0, bagDropCnt: 0, operBgngHour: 0, operEndHour: 0, alnCdList: [], peakStep: 0, peakWtng: 0 },
    { island: 'H', totCnt: 36, counterCnt: 14, kioskCnt: 4, bagDropCnt: 2, operBgngHour: 7, operEndHour: 21, alnCdList: ['TW'], peakStep: 24, peakWtng: 150 },
    { island: 'J', totCnt: 36, counterCnt: 18, kioskCnt: 6, bagDropCnt: 2, operBgngHour: 6, operEndHour: 22, alnCdList: ['TW', 'ZE'], peakStep: 26, peakWtng: 220 },
    { island: 'K', totCnt: 36, counterCnt: 22, kioskCnt: 6, bagDropCnt: 4, operBgngHour: 5, operEndHour: 22, alnCdList: ['ZE', 'BX'], peakStep: 28, peakWtng: 300 },
    { island: 'L', totCnt: 36, counterCnt: 16, kioskCnt: 4, bagDropCnt: 2, operBgngHour: 6, operEndHour: 21, alnCdList: ['BX'], peakStep: 30, peakWtng: 170 },
    { island: 'M', totCnt: 36, counterCnt: 20, kioskCnt: 6, bagDropCnt: 2, operBgngHour: 5, operEndHour: 23, alnCdList: ['RS', 'YP'], peakStep: 32, peakWtng: 240 },
    { island: 'N', totCnt: 36, counterCnt: 10, kioskCnt: 2, bagDropCnt: 0, operBgngHour: 8, operEndHour: 20, alnCdList: ['YP'], peakStep: 34, peakWtng: 80 },
];

/** T2 는 아일랜드가 더 적게 열린다 (운영 항공사가 적다) */
const T2_ISLANDS: IslandSeed[] = [
    { island: 'A', totCnt: 36, counterCnt: 26, kioskCnt: 10, bagDropCnt: 6, operBgngHour: 5, operEndHour: 22, alnCdList: ['KE'], peakStep: 15, peakWtng: 220 },
    { island: 'B', totCnt: 36, counterCnt: 22, kioskCnt: 8, bagDropCnt: 6, operBgngHour: 5, operEndHour: 22, alnCdList: ['KE', 'DL'], peakStep: 16, peakWtng: 260 },
    { island: 'C', totCnt: 36, counterCnt: 18, kioskCnt: 6, bagDropCnt: 4, operBgngHour: 6, operEndHour: 21, alnCdList: ['DL', 'AF'], peakStep: 18, peakWtng: 160 },
    { island: 'D', totCnt: 36, counterCnt: 14, kioskCnt: 6, bagDropCnt: 4, operBgngHour: 6, operEndHour: 21, alnCdList: ['AF', 'KL'], peakStep: 20, peakWtng: 120 },
    { island: 'E', totCnt: 36, counterCnt: 0, kioskCnt: 0, bagDropCnt: 0, operBgngHour: 0, operEndHour: 0, alnCdList: [], peakStep: 0, peakWtng: 0 },
    { island: 'F', totCnt: 36, counterCnt: 0, kioskCnt: 0, bagDropCnt: 0, operBgngHour: 0, operEndHour: 0, alnCdList: [], peakStep: 0, peakWtng: 0 },
    { island: 'G', totCnt: 36, counterCnt: 12, kioskCnt: 4, bagDropCnt: 2, operBgngHour: 7, operEndHour: 20, alnCdList: ['CI'], peakStep: 22, peakWtng: 100 },
    { island: 'H', totCnt: 36, counterCnt: 16, kioskCnt: 4, bagDropCnt: 4, operBgngHour: 6, operEndHour: 22, alnCdList: ['CI', 'GA'], peakStep: 24, peakWtng: 190 },
    { island: 'J', totCnt: 36, counterCnt: 20, kioskCnt: 6, bagDropCnt: 4, operBgngHour: 5, operEndHour: 23, alnCdList: ['GA', 'MU'], peakStep: 26, peakWtng: 240 },
    { island: 'K', totCnt: 36, counterCnt: 14, kioskCnt: 4, bagDropCnt: 2, operBgngHour: 7, operEndHour: 21, alnCdList: ['MU'], peakStep: 28, peakWtng: 130 },
    { island: 'L', totCnt: 36, counterCnt: 0, kioskCnt: 0, bagDropCnt: 0, operBgngHour: 0, operEndHour: 0, alnCdList: [], peakStep: 0, peakWtng: 0 },
    { island: 'M', totCnt: 36, counterCnt: 18, kioskCnt: 6, bagDropCnt: 4, operBgngHour: 6, operEndHour: 22, alnCdList: ['CZ'], peakStep: 30, peakWtng: 200 },
    { island: 'N', totCnt: 36, counterCnt: 0, kioskCnt: 0, bagDropCnt: 0, operBgngHour: 0, operEndHour: 0, alnCdList: [], peakStep: 0, peakWtng: 0 },
];

const ISLAND_SEEDS: Record<TmnlId, IslandSeed[]> = { T1: T1_ISLANDS, T2: T2_ISLANDS };

/** 그 아일랜드가 열려 있는 시각인가 (시 단위) */
function isOpen(seed: IslandSeed, hour: number): boolean {
    return seed.counterCnt > 0 && seed.operBgngHour <= hour && hour < seed.operEndHour;
}

function hourOf(step: number): number {
    return Math.floor((step * STEP_MIN) / 60);
}

/**
 * 시간대별 공용 Queue 인원.
 * 피크를 중심으로 완만하게 오르내리는 곡선을 만든다. 문 닫은 시각은 0 이다.
 */
function queueAt(seed: IslandSeed, step: number): number {
    if (!isOpen(seed, hourOf(step))) return 0;

    const gap = Math.abs(step - seed.peakStep);

    return Math.max(0, Math.round(seed.peakWtng * Math.exp(-((gap / 9) ** 2)) - gap * 0.4));
}

/* ================= 공용 Queue 추천 ================= */

/** NORMAL 등급 상한 (서버 혼잡등급 기준정보와 같은 값) */
const NORMAL_MAX_QUEUE = 220;
/** 부스 1대의 분당 처리량 */
const BOOTH_PRCS_PER_MIN = 2;
/** 추천 리드타임 (분) */
const RECOMMEND_LEAD_MIN = 30;
/** 추천 궤적 구간 (분) */
const RECOMMEND_SPAN_MIN = 60;

/** 그 시각 운영 부스 — 배정 대수를 Queue 흐름에 맞춰 오르내리게 한다 */
function boothCntAt(seed: IslandSeed, step: number): number {
    if (!isOpen(seed, hourOf(step))) return 0;

    const peakRatio = seed.peakWtng === 0 ? 0 : queueAt(seed, step) / seed.peakWtng;

    return Math.max(1, Math.round(seed.counterCnt * (0.5 + peakRatio / 2)));
}

function extraBoothCntAt(queuePsgCnt: number): number {
    const excess = queuePsgCnt - NORMAL_MAX_QUEUE;

    return excess <= 0 ? 0 : Math.ceil(excess / (BOOTH_PRCS_PER_MIN * RECOMMEND_LEAD_MIN));
}

function toCgnClearMin(
    queuePsgCnt: number,
    oprBoothCnt: number,
    extraBoothCnt: number,
): number | null {
    if (oprBoothCnt === 0) return null;
    if (extraBoothCnt === 0) return 0;

    return Math.min(
        RECOMMEND_SPAN_MIN,
        Math.ceil((queuePsgCnt - NORMAL_MAX_QUEUE) / (BOOTH_PRCS_PER_MIN * extraBoothCnt)),
    );
}

/* ================= 슬롯 ================= */

/** 문을 닫은 시각 */
const EMPTY_STAT: MapCgnStatDto = { wtngPsgCnt: 0, wtngHr: 0, prcsPsgCnt: 0, prcsHr: 0 };

/** 30분 처리용량 (명) */
function toCapacity(oprBoothCnt: number): number {
    return oprBoothCnt * BOOTH_PRCS_PER_MIN * STEP_MIN;
}

/** 혼잡 현황 지표 4종 — Queue 하나에서 나머지를 끌어낸다 (값끼리 어긋나지 않도록) */
function toStat(queuePsgCnt: number, oprBoothCnt: number): MapCgnStatDto {
    return {
        wtngPsgCnt: queuePsgCnt,
        wtngHr: Math.round(queuePsgCnt / 8) + 2,
        prcsPsgCnt: Math.min(toCapacity(oprBoothCnt), 20 + Math.round(queuePsgCnt * 0.8)),
        prcsHr: 40,
    };
}

/** Queue 인원 → 혼잡도 (뱃지와 알림이 같은 근거를 쓴다) */
function toStatus(queuePsgCnt: number): CongestionStatus {
    if (queuePsgCnt >= 420) return 'VERY_BUSY';
    if (queuePsgCnt > NORMAL_MAX_QUEUE) return 'BUSY';
    if (queuePsgCnt >= 80) return 'NORMAL';

    return 'FREE';
}

function toChknRslt(seed: IslandSeed, step: number): MapChknRsltDto {
    const oprBoothCnt = boothCntAt(seed, step);

    // 문을 닫은 시각은 결과 자체가 없다 — 처리인원까지 0 이어야 표가 운영 여부와 어긋나지 않는다
    if (oprBoothCnt === 0) {
        return {
            unitCd: seed.island,
            cgnStatus: 'FREE',
            stat: EMPTY_STAT,
            prcsRate: 0,
            avgQueuePsgCnt: 0,
            maxQueuePsgCnt: 0,
            oprBoothCnt: 0,
            reqCnt: null,
            cgnClearMin: null,
        };
    }

    const queuePsgCnt = queueAt(seed, step);
    const stat = toStat(queuePsgCnt, oprBoothCnt);
    const capacity = toCapacity(oprBoothCnt);
    const extraBoothCnt = extraBoothCntAt(queuePsgCnt);

    return {
        unitCd: seed.island,
        cgnStatus: toStatus(queuePsgCnt),
        stat,
        prcsRate: capacity === 0 ? 0 : Math.min(100, Math.round((stat.prcsPsgCnt * 100) / capacity)),
        avgQueuePsgCnt: Math.round(queuePsgCnt * 0.92),
        maxQueuePsgCnt: Math.round(queuePsgCnt * 1.08),
        oprBoothCnt,
        reqCnt: oprBoothCnt + extraBoothCnt,
        cgnClearMin: toCgnClearMin(queuePsgCnt, oprBoothCnt, extraBoothCnt),
    };
}

/** 알림은 혼잡(BUSY) 이상인 아일랜드만 Queue 내림차순으로 모은다 (뱃지와 같은 근거) */
function toNotice(rsltList: MapChknRsltDto[]): MapNoticeDto {
    const sorted = [...rsltList].sort((a, b) => b.stat.wtngPsgCnt - a.stat.wtngPsgCnt);
    const busy = sorted.filter(
        (rslt) => rslt.cgnStatus === 'BUSY' || rslt.cgnStatus === 'VERY_BUSY',
    );

    return {
        cgnStatus: sorted[0]?.cgnStatus ?? 'FREE',
        itemList: busy.map((rslt) => ({
            fcltNm: `아일랜드 ${rslt.unitCd}`,
            fcltCd: rslt.unitCd,
            boothCnt: rslt.oprBoothCnt,
            reqCnt: rslt.reqCnt,
            cgnClearMin: rslt.cgnClearMin,
        })),
    };
}

function toSlot(tmnlId: TmnlId, hhmm: string, step: number): ChknCounterSlotDto {
    const chknRsltList = ISLAND_SEEDS[tmnlId].map((seed) => toChknRslt(seed, step));

    return { hhmm, notice: toNotice(chknRsltList), chknRsltList };
}

/* ================= 아일랜드 · 시간대별 자원 ================= */

function toIsland(seed: IslandSeed): ChknCounterIslandDto {
    return {
        island: seed.island,
        fcltNm: `아일랜드 ${seed.island}`,
        totCnt: seed.totCnt,
        counterCnt: seed.counterCnt,
        kioskCnt: seed.kioskCnt,
        bagDropCnt: seed.bagDropCnt,
        alnCdList: seed.alnCdList,
        oprTimeList:
            seed.counterCnt > 0 ? [{ operBgngHour: seed.operBgngHour, operEndHour: seed.operEndHour }] : [],
        useYn: seed.counterCnt > 0 ? 'Y' : 'N',
    };
}

/**
 * 시간대별 자원 — 그 시각에 열려 있는 아일랜드의 자원을 더한다.
 * 대기인원은 순간 재고량이라 두 30분 슬롯을 더하지 않고 매시 마지막 Queue 를 싣는다.
 */
function toRsrc(seeds: IslandSeed[], totCnt: number, hour: number): ChknCounterRsrcDto {
    const open = seeds.filter((seed) => isOpen(seed, hour));
    const counterCnt = open.reduce((sum, seed) => sum + seed.counterCnt, 0);
    const lastStep = hour * 2 + 1;

    return {
        hour,
        counterCnt,
        kioskCnt: open.reduce((sum, seed) => sum + seed.kioskCnt, 0),
        bagDropCnt: open.reduce((sum, seed) => sum + seed.bagDropCnt, 0),
        wtngPsgCnt: seeds.reduce((sum, seed) => sum + queueAt(seed, lastStep), 0),
        prcsPsgCnt: seeds.reduce(
            (sum, seed) =>
                sum +
                toStat(queueAt(seed, hour * 2), boothCntAt(seed, hour * 2)).prcsPsgCnt +
                toStat(queueAt(seed, lastStep), boothCntAt(seed, lastStep)).prcsPsgCnt,
            0,
        ),
        utilRate: totCnt === 0 ? 0 : Math.round((counterCnt * 100) / totCnt),
    };
}

export const chknCounterMock = {
    /** 화면 하루치 — 차트와 표가 모두 타임라인이 가리키는 슬롯을 읽는다 */
    getChknCounter: (tmnlId: TmnlId): ChknCounterDto => {
        const seeds = ISLAND_SEEDS[tmnlId];
        const totCnt = seeds.reduce((sum, seed) => sum + seed.totCnt, 0);
        const rsrcList = Array.from({ length: HOUR_PER_DAY }, (_, hour) =>
            toRsrc(seeds, totCnt, hour),
        );
        const slotList = TIME_LIST.map((hhmm, step) => toSlot(tmnlId, hhmm, step));
        const oprSeeds = seeds.filter((seed) => seed.counterCnt > 0);
        const queueList = slotList.map((slot) =>
            slot.chknRsltList.reduce((sum, rslt) => sum + rslt.stat.wtngPsgCnt, 0),
        );
        const prcsPsgCnt = slotList.reduce(
            (sum, slot) => sum + slot.chknRsltList.reduce((cnt, rslt) => cnt + rslt.stat.prcsPsgCnt, 0),
            0,
        );
        const capacity = slotList.reduce(
            (sum, slot) =>
                sum + slot.chknRsltList.reduce((cnt, rslt) => cnt + toCapacity(rslt.oprBoothCnt), 0),
            0,
        );

        return {
            error: false,
            errorMessage: '',
            smltId: SMLT_ID,
            tmnlId,
            totCnt,
            oprIslandCnt: oprSeeds.length,
            peakCounterCnt: Math.max(...rsrcList.map((rsrc) => rsrc.counterCnt)),
            totKioskCnt: oprSeeds.reduce((sum, seed) => sum + seed.kioskCnt, 0),
            totBagDropCnt: oprSeeds.reduce((sum, seed) => sum + seed.bagDropCnt, 0),
            waitMaxCnt: Math.max(...queueList),
            islandList: seeds.map(toIsland),
            rsrcList,
            slotList,
            kpi: {
                avgWaitMin: 9,
                p95WaitMin: 21,
                maxQueuePsgCnt: Math.max(...queueList),
                utilRate: capacity === 0 ? 0 : Math.round((prcsPsgCnt * 100) / capacity),
            },
        };
    },
};
