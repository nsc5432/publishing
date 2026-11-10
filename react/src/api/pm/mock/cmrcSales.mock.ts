import type { CmrcSalesDto, CmrcStoreSalesDto, IslandCmrcSalesDto, TmnlId } from '@/types/api.types';
import { todayYmd } from '@/lib/format';

/**
 * 아일랜드 상업시설 시간대별 매출 목업.
 *
 * 매출 원천 API 가 아직 없어 VITE_ENABLE_MOCK 과 무관하게 이 값을 쓴다.
 * 매출은 실적이라 오늘은 지난 시간까지만, 미래 일자는 전부 null 이다.
 */

const HOURS_PER_DAY = 24;

/** 맵형태보기 아일랜드와 같은 문자 (I 는 없다) */
const ISLAND_LIST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N'];

/** 매장 종류 : [이름, 개점 시, 폐점 시(미포함), 매출 배수] */
const STORE_TYPES: Array<[string, number, number, number]> = [
    ['편의점', 0, 24, 0.8],
    ['카페', 5, 23, 1.0],
    ['식당', 6, 21, 1.4],
    ['베이커리', 6, 22, 0.7],
    ['여행용품', 6, 22, 0.6],
    ['약국', 7, 21, 0.4],
    ['서점', 7, 20, 0.5],
    ['기념품', 7, 21, 0.5],
    ['화장품', 7, 21, 0.9],
];

/** 매장 1곳의 시간당 기준 매출(원) */
const BASE_AMT = 250_000;

const TMNL_FACTOR: Record<TmnlId, number> = { T1: 1, T2: 0.85 };

function islandSeed(island: string): number {
    return Math.max(0, island.charCodeAt(0) - 65);
}

/** 출국 여객 흐름을 따라 아침(8시)과 저녁(18시)에 봉우리가 진다 */
function demandAt(hour: number): number {
    return 0.25 + Math.exp(-(((hour - 8) / 2.6) ** 2)) + 0.8 * Math.exp(-(((hour - 18) / 2.8) ** 2));
}

/** 실적이 있는 시간 수 — 진행 중인 시간은 아직 집계 전이다 */
function actualHourCnt(ymd: string): number {
    const today = todayYmd();

    if (ymd < today) return HOURS_PER_DAY;
    if (ymd > today) return 0;

    return new Date().getHours();
}

function toStore(
    tmnlId: TmnlId,
    ymd: string,
    island: string,
    storeIdx: number,
    hourCnt: number,
): CmrcStoreSalesDto {
    const [storeNm, openHour, closeHour, scale] = STORE_TYPES[storeIdx];
    const seed = islandSeed(island);
    const dayFactor = 1 + 0.06 * Math.sin(Number(ymd.slice(6)) + seed);

    return {
        storeCd: `${tmnlId}-${island}-S${String(storeIdx + 1).padStart(2, '0')}`,
        storeNm: `${island}아일랜드 ${storeNm}`,
        hrlyAmtList: Array.from({ length: HOURS_PER_DAY }, (_, hour) => {
            if (hour >= hourCnt) return null;
            if (hour < openHour || hour >= closeHour) return 0;

            const jitter = 1 + 0.12 * Math.sin(seed * 7.1 + hour * 1.7 + storeIdx * 3.3);
            const amt = BASE_AMT * scale * demandAt(hour) * TMNL_FACTOR[tmnlId] * dayFactor * jitter;

            return Math.round(amt / 100) * 100;
        }),
    };
}

function toIsland(tmnlId: TmnlId, ymd: string, island: string, hourCnt: number): IslandCmrcSalesDto {
    const storeCnt = 9 - (islandSeed(island) % 4);

    return {
        island,
        storeList: Array.from({ length: storeCnt }, (_, storeIdx) =>
            toStore(tmnlId, ymd, island, storeIdx, hourCnt),
        ),
    };
}

export const cmrcSalesMock = {
    getIslandSales: (ymd: string, tmnlId: TmnlId): CmrcSalesDto => {
        const hourCnt = actualHourCnt(ymd);

        return {
            error: false,
            errorMessage: '',
            ymd,
            tmnlId,
            islandList: ISLAND_LIST.map((island) => toIsland(tmnlId, ymd, island, hourCnt)),
        };
    },
};
