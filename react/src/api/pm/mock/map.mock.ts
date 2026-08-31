import type {
    CongestionStatus,
    MapCgnStatDto,
    MapChknInfoDto,
    MapChknRsltDto,
    MapMarkerDto,
    MapNoticeDto,
    MapNoticeItemDto,
    MapOperCardDto,
    MapUnitRsltDto,
    SmltMapDto,
    SmltMapSlotDto,
    TmnlId,
} from '@/types/api.types';
import { MOCK_ROLE_ID_LIST } from './common.mock';

/**
 * 맵형태보기 목업 응답 (VITE_ENABLE_MOCK=true 일 때 사용).
 *
 * 서버 DTO 와 같은 모양으로 둔다. 도면 좌표(비율 %)까지 서버가 내려주는 값이라
 * 화면은 마커를 그리기만 하고 자리를 알지 못한다.
 *
 * 하루치를 한 번에 내려준다 — 타임라인을 옮겨도 다시 부르지 않는다.
 */

const SMLT_ID = 'SMLT-20260710-0001';

const SALES_ROLE_ID = 'PMR0004';

/* ================= 시각 ================= */

/** 맵형태보기 타임라인은 00:00 ~ 24:00, 30분 단위 */
const STEP_MIN = 30;
const MAX_STEP = 48;

function toHhmm(minutes: number): string {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');

    return hh + mm;
}

/** 슬롯 시각 49개 (00:00 ~ 24:00) */
const TIME_LIST: string[] = Array.from({ length: MAX_STEP + 1 }, (_, step) =>
    toHhmm(step * STEP_MIN),
);

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

const DPTGT_SEEDS: Record<TmnlId, DepSeed[]> = { T1: T1_DEPS, T2: T2_DEPS };

/** 마커는 자리와 라벨만 갖는다 (혼잡도는 슬롯이 채운다) */
function toMarkers(seeds: DepSeed[], prefix: string): MapMarkerDto[] {
    return seeds.map(([label, cdntX, cdntY]) => ({
        markerId: prefix + label,
        label,
        cdntX,
        cdntY,
    }));
}

/* ================= 슬롯 ================= */

/** 대기인원에서 처리율을 끌어낸다 (혼잡할수록 낮아진다) */
function toPrcsRate(wtngPsgCnt: number): number {
    const prcs = 20 + Math.round(wtngPsgCnt / 10);

    return Math.round((prcs * 100) / (prcs + wtngPsgCnt));
}

function toUnitRslt(seed: DepSeed, step: number): MapUnitRsltDto {
    const wtngPsgCnt = wtngAt(seed[3], seed[4], step);

    return { unitCd: seed[0], cgnStatus: toStatus(wtngPsgCnt), stat: toStat(wtngPsgCnt) };
}

function toChknRslt(seed: DepSeed, step: number): MapChknRsltDto {
    const rslt = toUnitRslt(seed, step);

    return { ...rslt, prcsRate: toPrcsRate(rslt.stat.wtngPsgCnt) };
}

/** 알림 후보 : [그 시각 상태, 시설명] */
type NoticeSeed = [MapUnitRsltDto, string];

/** 알림 목록이 도면을 덮지 않는 상한 (서버와 같은 값) */
const NOTICE_ITEM_LIMIT = 6;
/** 대기인원 50명당 부스 1개 증설로 환산한다 (서버와 같은 규칙) */
const BOOTH_PER_STEP = 50;

function toNoticeItem([rslt, fcltNm]: NoticeSeed): MapNoticeItemDto {
    return {
        fcltNm,
        fcltCd: rslt.unitCd,
        boothCnt: Math.max(1, Math.floor(rslt.stat.wtngPsgCnt / BOOTH_PER_STEP)),
    };
}

/** 알림은 혼잡(BUSY) 이상인 곳만, 혼잡한 순으로 모은다 */
function toNotice(chknList: MapChknRsltDto[], dptgtList: MapUnitRsltDto[]): MapNoticeDto {
    const seeds: NoticeSeed[] = [
        ...chknList.map((rslt): NoticeSeed => [rslt, '체크인카운터']),
        ...dptgtList.map((rslt): NoticeSeed => [rslt, '출국장']),
    ];
    const busy = seeds
        .filter(([rslt]) => rslt.cgnStatus === 'BUSY' || rslt.cgnStatus === 'VERY_BUSY')
        .sort(([a], [b]) => b.stat.wtngPsgCnt - a.stat.wtngPsgCnt);

    return {
        cgnStatus: toStatus(busy[0]?.[0].stat.wtngPsgCnt ?? 0),
        itemList: busy.slice(0, NOTICE_ITEM_LIMIT).map(toNoticeItem),
    };
}

function toSlot(tmnlId: TmnlId, hhmm: string, step: number): SmltMapSlotDto {
    const chknRsltList = ISLAND_SEEDS[tmnlId].map((seed) => toChknRslt(seed, step));
    const dptgtRsltList = DPTGT_SEEDS[tmnlId].map((seed) => toUnitRslt(seed, step));

    return {
        hhmm,
        notice: toNotice(chknRsltList, dptgtRsltList),
        chknRsltList,
        dptgtRsltList,
    };
}

/* ================= 운영시간 카드 ================= */

/**
 * 운영시간 도넛은 출국장 1곳당 1개다 (마커와 같은 개수·같은 순서).
 * 뒤쪽 두 곳은 미운영으로 두어 흐림 표기를 확인할 수 있게 한다.
 */
function toOperCards(seeds: DepSeed[]): MapOperCardDto[] {
    const offFrom = seeds.length - 2;

    return seeds.map(([dptgtNo], i) => ({
        dptgtNo,
        oprRate: 75,
        oprBgnTime: '0530',
        oprEndTime: '2330',
        oprHr: 18,
        useYn: i >= offFrom ? 'N' : 'Y',
    }));
}

/* ================= 헤더 요약 ================= */

const SUMMARY: Record<TmnlId, { fltCnt: number; psgCnt: number }> = {
    T1: { fltCnt: 1234567, psgCnt: 1234567 },
    T2: { fltCnt: 987654, psgCnt: 987654 },
};

/* ================= 아일랜드 상세 팝업 고정 정보 ================= */

/** 아일랜드 문자 → 값의 씨앗 (A=0) */
function islandSeed(island: string): number {
    return Math.max(0, island.charCodeAt(0) - 65);
}

function toChknInfo(tmnlId: TmnlId, island: string): MapChknInfoDto {
    const seed = islandSeed(island);

    return {
        island,
        fcltCd: `${tmnlId}-3RD-${island}01-01`,
        fcltList: [
            { fcltType: 'CHKN', fcltNm: '체크인카운터', prcsRateYn: 'Y' },
            { fcltType: 'SLFCHKN', fcltNm: '셀프체크인', prcsRateYn: 'Y' },
            // 상업시설은 처리율 개념이 없다
            { fcltType: 'CMRC', fcltNm: '상업시설', prcsRateYn: 'N' },
        ],
        // 실서버와 같게 매출조회 권한이 없으면 비운다
        sales: MOCK_ROLE_ID_LIST.includes(SALES_ROLE_ID)
            ? {
                  totAmt: 33063915 + seed * 121500,
                  storeCnt: 9 - (seed % 4),
                  amtPerPsg: 1742 + seed * 37,
                  psgDiffCnt: 8,
                  diffRate: 15,
                  cmprYear: '2023',
              }
            : null,
    };
}

export const mapMock = {
    /** 도면 하루치 — 타임라인은 slotList 에서 자리만 바꿔 읽는다 */
    getSmltMap: (tmnlId: TmnlId): SmltMapDto => ({
        error: false,
        errorMessage: '',
        smltId: SMLT_ID,
        tmnlId,
        summary: SUMMARY[tmnlId],
        operCardList: toOperCards(DPTGT_SEEDS[tmnlId]),
        dptgtMarkerList: toMarkers(DPTGT_SEEDS[tmnlId], 'dg'),
        chknMarkerList: toMarkers(ISLAND_SEEDS[tmnlId], ''),
        gateMarkerList: GATES.map(([label, cdntX, cdntY]) => ({
            markerId: `g${label}`,
            label,
            cdntX,
            cdntY,
        })),
        chknInfoList: ISLAND_SEEDS[tmnlId].map(([island]) => toChknInfo(tmnlId, island)),
        slotList: TIME_LIST.map((hhmm, step) => toSlot(tmnlId, hhmm, step)),
    }),
};
