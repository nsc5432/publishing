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
 * 하루치를 한 번에 내려준다 — 자원 활용 차트(24시간)와 표 보기(30분 슬롯)가
 * 이 한 건을 나눠 쓴다. 값의 근거는 아일랜드 하나에 모아 두고 나머지를 끌어내
 * 차트와 표가 서로 다른 이야기를 하지 않게 한다.
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
    /** 유인 카운터 운영 대수 */
    counterCnt: number;
    kioskCnt: number;
    bagDropCnt: number;
    /** 운영 시간 (시) */
    bgnHour: number;
    endHour: number;
    alnCdList: string[];
    /** 하루 추이의 피크 자리(슬롯 번호) / 최대 대기인원 */
    peakStep: number;
    peakWtng: number;
}

/** 아일랜드는 A~N (I 제외) 13곳이다. 배정이 없는 아일랜드는 counterCnt 가 0 이다 */
const T1_ISLANDS: IslandSeed[] = [
    { island: 'A', totCnt: 36, counterCnt: 28, kioskCnt: 8, bagDropCnt: 4, bgnHour: 5, endHour: 22, alnCdList: ['KE'], peakStep: 14, peakWtng: 260 },
    { island: 'B', totCnt: 36, counterCnt: 24, kioskCnt: 6, bagDropCnt: 4, bgnHour: 5, endHour: 21, alnCdList: ['KE', 'OZ'], peakStep: 15, peakWtng: 320 },
    { island: 'C', totCnt: 36, counterCnt: 18, kioskCnt: 6, bagDropCnt: 2, bgnHour: 6, endHour: 21, alnCdList: ['OZ'], peakStep: 16, peakWtng: 180 },
    { island: 'D', totCnt: 36, counterCnt: 20, kioskCnt: 4, bagDropCnt: 2, bgnHour: 6, endHour: 22, alnCdList: ['OZ', '7C'], peakStep: 18, peakWtng: 140 },
    { island: 'E', totCnt: 36, counterCnt: 16, kioskCnt: 4, bagDropCnt: 2, bgnHour: 6, endHour: 20, alnCdList: ['7C', 'LJ'], peakStep: 20, peakWtng: 120 },
    { island: 'F', totCnt: 36, counterCnt: 12, kioskCnt: 4, bagDropCnt: 0, bgnHour: 7, endHour: 20, alnCdList: ['LJ'], peakStep: 22, peakWtng: 90 },
    { island: 'G', totCnt: 36, counterCnt: 0, kioskCnt: 0, bagDropCnt: 0, bgnHour: 0, endHour: 0, alnCdList: [], peakStep: 0, peakWtng: 0 },
    { island: 'H', totCnt: 36, counterCnt: 14, kioskCnt: 4, bagDropCnt: 2, bgnHour: 7, endHour: 21, alnCdList: ['TW'], peakStep: 24, peakWtng: 150 },
    { island: 'J', totCnt: 36, counterCnt: 18, kioskCnt: 6, bagDropCnt: 2, bgnHour: 6, endHour: 22, alnCdList: ['TW', 'ZE'], peakStep: 26, peakWtng: 220 },
    { island: 'K', totCnt: 36, counterCnt: 22, kioskCnt: 6, bagDropCnt: 4, bgnHour: 5, endHour: 22, alnCdList: ['ZE', 'BX'], peakStep: 28, peakWtng: 300 },
    { island: 'L', totCnt: 36, counterCnt: 16, kioskCnt: 4, bagDropCnt: 2, bgnHour: 6, endHour: 21, alnCdList: ['BX'], peakStep: 30, peakWtng: 170 },
    { island: 'M', totCnt: 36, counterCnt: 20, kioskCnt: 6, bagDropCnt: 2, bgnHour: 5, endHour: 23, alnCdList: ['RS', 'YP'], peakStep: 32, peakWtng: 240 },
    { island: 'N', totCnt: 36, counterCnt: 10, kioskCnt: 2, bagDropCnt: 0, bgnHour: 8, endHour: 20, alnCdList: ['YP'], peakStep: 34, peakWtng: 80 },
];

/** T2 는 아일랜드가 더 적게 열린다 (운영 항공사가 적다) */
const T2_ISLANDS: IslandSeed[] = [
    { island: 'A', totCnt: 36, counterCnt: 26, kioskCnt: 10, bagDropCnt: 6, bgnHour: 5, endHour: 22, alnCdList: ['KE'], peakStep: 15, peakWtng: 220 },
    { island: 'B', totCnt: 36, counterCnt: 22, kioskCnt: 8, bagDropCnt: 6, bgnHour: 5, endHour: 22, alnCdList: ['KE', 'DL'], peakStep: 16, peakWtng: 260 },
    { island: 'C', totCnt: 36, counterCnt: 18, kioskCnt: 6, bagDropCnt: 4, bgnHour: 6, endHour: 21, alnCdList: ['DL', 'AF'], peakStep: 18, peakWtng: 160 },
    { island: 'D', totCnt: 36, counterCnt: 14, kioskCnt: 6, bagDropCnt: 4, bgnHour: 6, endHour: 21, alnCdList: ['AF', 'KL'], peakStep: 20, peakWtng: 120 },
    { island: 'E', totCnt: 36, counterCnt: 0, kioskCnt: 0, bagDropCnt: 0, bgnHour: 0, endHour: 0, alnCdList: [], peakStep: 0, peakWtng: 0 },
    { island: 'F', totCnt: 36, counterCnt: 0, kioskCnt: 0, bagDropCnt: 0, bgnHour: 0, endHour: 0, alnCdList: [], peakStep: 0, peakWtng: 0 },
    { island: 'G', totCnt: 36, counterCnt: 12, kioskCnt: 4, bagDropCnt: 2, bgnHour: 7, endHour: 20, alnCdList: ['CI'], peakStep: 22, peakWtng: 100 },
    { island: 'H', totCnt: 36, counterCnt: 16, kioskCnt: 4, bagDropCnt: 4, bgnHour: 6, endHour: 22, alnCdList: ['CI', 'GA'], peakStep: 24, peakWtng: 190 },
    { island: 'J', totCnt: 36, counterCnt: 20, kioskCnt: 6, bagDropCnt: 4, bgnHour: 5, endHour: 23, alnCdList: ['GA', 'MU'], peakStep: 26, peakWtng: 240 },
    { island: 'K', totCnt: 36, counterCnt: 14, kioskCnt: 4, bagDropCnt: 2, bgnHour: 7, endHour: 21, alnCdList: ['MU'], peakStep: 28, peakWtng: 130 },
    { island: 'L', totCnt: 36, counterCnt: 0, kioskCnt: 0, bagDropCnt: 0, bgnHour: 0, endHour: 0, alnCdList: [], peakStep: 0, peakWtng: 0 },
    { island: 'M', totCnt: 36, counterCnt: 18, kioskCnt: 6, bagDropCnt: 4, bgnHour: 6, endHour: 22, alnCdList: ['CZ'], peakStep: 30, peakWtng: 200 },
    { island: 'N', totCnt: 36, counterCnt: 0, kioskCnt: 0, bagDropCnt: 0, bgnHour: 0, endHour: 0, alnCdList: [], peakStep: 0, peakWtng: 0 },
];

const ISLAND_SEEDS: Record<TmnlId, IslandSeed[]> = { T1: T1_ISLANDS, T2: T2_ISLANDS };

/** 그 아일랜드가 열려 있는 시각인가 (시 단위) */
function isOpen(seed: IslandSeed, hour: number): boolean {
    return seed.counterCnt > 0 && seed.bgnHour <= hour && hour < seed.endHour;
}

/**
 * 시간대별 대기인원.
 * 피크를 중심으로 완만하게 오르내리는 곡선을 만든다. 문 닫은 시각은 0 이다.
 */
function wtngAt(seed: IslandSeed, step: number): number {
    if (!isOpen(seed, Math.floor((step * STEP_MIN) / 60))) return 0;

    const gap = Math.abs(step - seed.peakStep);

    return Math.max(0, Math.round(seed.peakWtng * Math.exp(-((gap / 9) ** 2)) - gap * 0.4));
}

/* ================= 슬롯 ================= */

/** 문을 닫은 시각 */
const EMPTY_STAT: MapCgnStatDto = { wtngPsgCnt: 0, wtngHr: 0, prcsPsgCnt: 0, prcsHr: 0 };

/** 혼잡 현황 지표 4종 — 대기인원 하나에서 나머지를 끌어낸다 (값끼리 어긋나지 않도록) */
function toStat(wtngPsgCnt: number): MapCgnStatDto {
    return {
        wtngPsgCnt,
        wtngHr: Math.round(wtngPsgCnt / 8) + 2,
        prcsPsgCnt: 20 + Math.round(wtngPsgCnt / 10),
        prcsHr: 40,
    };
}

/** 대기인원 → 혼잡도 (뱃지와 알림이 같은 근거를 쓴다) */
function toStatus(wtngPsgCnt: number): CongestionStatus {
    if (wtngPsgCnt >= 240) return 'VERY_BUSY';
    if (wtngPsgCnt >= 140) return 'BUSY';
    if (wtngPsgCnt >= 50) return 'NORMAL';

    return 'FREE';
}

function toChknRslt(seed: IslandSeed, step: number): MapChknRsltDto {
    // 문을 닫은 시각은 결과 자체가 없다 — 처리인원까지 0 이어야 표가 운영 여부와 어긋나지 않는다
    if (!isOpen(seed, Math.floor((step * STEP_MIN) / 60))) {
        return { unitCd: seed.island, cgnStatus: 'FREE', stat: EMPTY_STAT, prcsRate: 0 };
    }

    const wtngPsgCnt = wtngAt(seed, step);
    const stat = toStat(wtngPsgCnt);
    const total = stat.prcsPsgCnt + stat.wtngPsgCnt;

    return {
        unitCd: seed.island,
        cgnStatus: toStatus(wtngPsgCnt),
        stat,
        prcsRate: total === 0 ? 0 : Math.round((stat.prcsPsgCnt * 100) / total),
    };
}

/** 알림은 매우혼잡한 아일랜드만 모은다 (뱃지와 같은 근거) */
function toNotice(rsltList: MapChknRsltDto[], seeds: IslandSeed[]): MapNoticeDto {
    const counterCntMap = new Map(seeds.map((seed) => [seed.island, seed.counterCnt]));
    const busy = rsltList.filter((rslt) => rslt.cgnStatus === 'VERY_BUSY');

    return {
        cgnStatus: busy.length > 0 ? 'BUSY' : 'NORMAL',
        itemList: busy.map((rslt) => ({
            fcltNm: `아일랜드 ${rslt.unitCd}`,
            fcltCd: rslt.unitCd,
            boothCnt: counterCntMap.get(rslt.unitCd) ?? 0,
        })),
    };
}

function toSlot(tmnlId: TmnlId, hhmm: string, step: number): ChknCounterSlotDto {
    const seeds = ISLAND_SEEDS[tmnlId];
    const chknRsltList = seeds.map((seed) => toChknRslt(seed, step));

    return { hhmm, notice: toNotice(chknRsltList, seeds), chknRsltList };
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
            seed.counterCnt > 0 ? [{ bgnHour: seed.bgnHour, endHour: seed.endHour }] : [],
        useYn: seed.counterCnt > 0 ? 'Y' : 'N',
    };
}

/** 시간대별 자원 — 그 시각에 열려 있는 아일랜드의 자원을 더한다 */
function toRsrc(seeds: IslandSeed[], totCnt: number, hour: number): ChknCounterRsrcDto {
    const open = seeds.filter((seed) => isOpen(seed, hour));
    const counterCnt = open.reduce((sum, seed) => sum + seed.counterCnt, 0);
    // 자원 활용 차트의 두 축은 같은 시각을 봐야 한다 — 대기인원도 그 시(정각 슬롯)에서 읽는다
    const wtngPsgCnt = seeds.reduce((sum, seed) => sum + wtngAt(seed, hour * 2), 0);

    return {
        hour,
        counterCnt,
        kioskCnt: open.reduce((sum, seed) => sum + seed.kioskCnt, 0),
        bagDropCnt: open.reduce((sum, seed) => sum + seed.bagDropCnt, 0),
        wtngPsgCnt,
        prcsPsgCnt: counterCnt * 12,
        utilRate: totCnt === 0 ? 0 : Math.round((counterCnt * 100) / totCnt),
    };
}

export const chknCounterMock = {
    /** 화면 하루치 — 차트는 rsrcList 를, 표는 타임라인이 가리키는 슬롯을 읽는다 */
    getChknCounter: (tmnlId: TmnlId): ChknCounterDto => {
        const seeds = ISLAND_SEEDS[tmnlId];
        const totCnt = seeds.reduce((sum, seed) => sum + seed.totCnt, 0);
        const rsrcList = Array.from({ length: HOUR_PER_DAY }, (_, hour) =>
            toRsrc(seeds, totCnt, hour),
        );
        const oprSeeds = seeds.filter((seed) => seed.counterCnt > 0);

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
            waitMaxCnt: Math.max(...rsrcList.map((rsrc) => rsrc.wtngPsgCnt)),
            islandList: seeds.map(toIsland),
            rsrcList,
            slotList: TIME_LIST.map((hhmm, step) => toSlot(tmnlId, hhmm, step)),
            kpi: { avgWaitMin: 9, p95WaitMin: 21, maxQueuePsgCnt: 320, utilRate: 62 },
        };
    },
};
