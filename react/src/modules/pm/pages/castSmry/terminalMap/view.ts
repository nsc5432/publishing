import { toCongestionStats } from '@/modules/pm/congestion/view';
import type {
    CmrcSalesDto,
    CongestionStatus,
    FcltType,
    IslandCmrcSalesDto,
    MapCgnCmprDto,
    MapCgnStatDto,
    MapChknInfoDto,
    MapChknRsltDto,
    MapMarkerDto,
    MapNoticeDto,
    MapOperCardDto,
    MapSmryDto,
    MapUnitRsltDto,
    SmltMapDto,
    SmltMapSlotDto,
} from '@/types/api.types';
import { formatCount, formatHhmm } from '@/lib/format';
import { toSummaryInfo } from '@/modules/pm/summary';
import type {
    CongestionLevel,
    DepGateMarker,
    FacilityDetail,
    FacilityKind,
    GateMarker,
    HeaderSummary,
    IslandDetail,
    IslandMarker,
    IslandSales,
    MapDay,
    MapSlot,
    NoticeData,
    NoticeLevel,
    OperCard,
    SalesBar,
    SalesKpi,
    SalesRankItem,
    TerminalKind,
    TerminalMapData,
} from './types';
import { toPlanPoint } from './layout';

/**
 * 맵형태보기 DTO → 화면 뷰 모델.
 *
 * 서버는 혼잡도를 4단계(CongestionStatus)로 내려주고 화면 마커/뱃지는 3색이다.
 * 그 접점과 단위/형식 표기를 여기 한 곳에 모은다.
 *
 * 하루치를 한 번에 받으므로 여기서 30분 슬롯을 모두 펼쳐 둔다. 타임라인은 만들어 둔
 * 슬롯에서 자리만 바꿔 읽는다 — 눈금을 옮길 때 다시 계산하지 않는다.
 */

/** 아일랜드 하루치 매출 — 슬롯은 시각만 바꿔 읽는다 */
interface IslandSalesDay {
    storeCnt: number;
    /** 시간대별 매장 매출 합. 실적이 없는 시간은 null */
    hrlyAmtList: Array<number | null>;
    hrlyOpenCntList: number[];
    /** 체크인 처리인원 (그 시의 30분 슬롯 2칸 합) */
    hrlyPrcsList: number[];
    hrlyTopStoreList: SalesRankItem[][];
    peakHour: number | null;
    bars: SalesBar[];
}

/**
 * 도면 무대(.map__bg) 가로세로 비율.
 * 도면 SVG 의 viewBox 에서 온 값이라 데이터가 아니라 화면 자산에 속한다.
 */
const STAGE_ASPECT = '1798.6 / 1118.7';

/** 출국장 팝업 제목 (예: 출국장 3) */
const DPTGT_TITLE_PREFIX = '출국장 ';

/** 팝업 지표 비교 문구의 시설 이름 (예: 전체 아일랜드 · 출국장 평균) */
const ISLAND_UNIT_NM = '아일랜드';
const DPTGT_UNIT_NM = '출국장';

const HOURS_PER_DAY = 24;
/** 매출 금액 표기 단위 (만원) */
const AMT_UNIT = 10_000;
const EMPTY_VALUE = '-';
const TOP_STORE_CNT = 3;

/** 혼잡도 4단계 → 마커/뱃지 3단계 (여유와 보통은 같은 색을 쓴다) */
const CONGESTION_TO_LEVEL: Record<CongestionStatus, CongestionLevel> = {
    FREE: 'normal',
    NORMAL: 'normal',
    BUSY: 'busy',
    VERY_BUSY: 'crowded',
};

/** 혼잡 알림 단계는 4단계를 그대로 쓴다 */
const CONGESTION_TO_NOTICE_LEVEL: Record<CongestionStatus, NoticeLevel> = {
    FREE: 'easy',
    NORMAL: 'normal',
    BUSY: 'busy',
    VERY_BUSY: 'severe',
};

/** 시설 구분 → 팝업 아이콘 (상업시설 외 나머지는 카운터 계열로 읽는다) */
const FCLT_TYPE_TO_KIND: Partial<Record<FcltType, FacilityKind>> = {
    CHKN: 'counter',
    SLFCHKN: 'selfcheck',
    CMRC: 'store',
};

/** 산정 불가(null)는 3색에 넣지 않는다 */
function toLevel(cgnStatus: CongestionStatus | null): CongestionLevel | null {
    return cgnStatus === null ? null : CONGESTION_TO_LEVEL[cgnStatus];
}

function toSummary(summary: MapSmryDto): HeaderSummary {
    return { flight: formatCount(summary.fltCnt), pax: formatCount(summary.psgCnt) };
}

/**
 * 운영시간 도넛 카드.
 *
 * 출국장이 여러 곳인 터미널은 도면 가운데로 연결동이 지나가므로 그 자리를 비운다.
 * 빈 칸은 격자 정렬용이라 서버가 내려주지 않는다.
 */
function toOperCards(cardList: MapOperCardDto[]): OperCard[] {
    const cards: OperCard[] = cardList.map((card) => ({
        id: `o${card.dptgtNo}`,
        dptgtNo: card.dptgtNo,
        rate: card.oprRate,
        time: `${formatHhmm(card.oprBgnTime)}-${formatHhmm(card.oprEndTime)}`,
        desc: `하루 ${card.oprHr}시간 운영`,
        dim: card.useYn === 'N',
    }));

    if (cards.length < 6) return cards;

    const middle = Math.floor(cards.length / 2);

    return [
        ...cards.slice(0, middle),
        { id: 'o-gap', dptgtNo: '', rate: 0, time: '', desc: '', empty: true },
        ...cards.slice(middle),
    ];
}

function toNotice(notice: MapNoticeDto): NoticeData {
    return {
        level: notice.cgnStatus === null ? null : CONGESTION_TO_NOTICE_LEVEL[notice.cgnStatus],
        items: notice.itemList.map((item) => ({
            id: item.fcltCd,
            facility: item.fcltNm,
            code: item.fcltCd,
            desc: `${item.boothCnt}개 부스 OPEN`,
        })),
    };
}

/** 묶음 단위 코드(아일랜드 문자 / 출국장 번호) → 그 시각 상태 */
function toRsltMap<T extends MapUnitRsltDto>(rsltList: T[]): Map<string, T> {
    return new Map(rsltList.map((rslt) => [rslt.unitCd, rslt]));
}

/**
 * 혼잡도를 함께 그리는 마커 (아일랜드 / 출국장이 같은 모양이다).
 * 마커는 자리만 알고 색은 그 시각 결과에서 온다 — 결과가 없거나 산정 불가인 시각은 중립색이다.
 */
function toCongestionMarker(
    terminal: TerminalKind,
    kind: 'dptgtGate' | 'island',
    marker: MapMarkerDto,
    rslt: MapUnitRsltDto | undefined,
): IslandMarker & DepGateMarker {
    const cgnStatus = rslt?.cgnStatus ?? null;
    const point = toPlanPoint(terminal, kind, marker.label, {
        x: marker.cdntX,
        y: marker.cdntY,
    });

    return {
        id: marker.markerId,
        label: marker.label,
        level: toLevel(cgnStatus),
        cgnStatus,
        ...point,
    };
}

function toGateMarker(terminal: TerminalKind, marker: MapMarkerDto): GateMarker {
    return {
        id: marker.markerId,
        label: marker.label,
        ...toPlanPoint(terminal, 'gate', marker.label, {
            x: marker.cdntX,
            y: marker.cdntY,
        }),
    };
}

/* ================= 상세 팝업 ================= */

/** 시설 구성은 하루 내내 같고, 혼잡도/처리율/매출은 그 시각 결과에서 온다 */
function toIslandDetail(
    info: MapChknInfoDto,
    rslt: MapChknRsltDto | undefined,
    cmpr: MapCgnCmprDto,
    salesDay: IslandSalesDay | undefined,
    hhmm: string,
): IslandDetail {
    return {
        id: info.island,
        title: `${info.island}아일랜드`,
        code: info.fcltCd,
        level: toLevel(rslt?.cgnStatus ?? null),
        facilities: info.fcltList.map((fclt) => ({
            kind: FCLT_TYPE_TO_KIND[fclt.fcltType] ?? 'counter',
            name: fclt.fcltNm,
            // 상업시설은 처리율이 없다
            rate: fclt.prcsRateYn === 'N' ? undefined : `처리율 ${rslt?.prcsRate ?? 0}%`,
        })),
        stats: toCongestionStats(ISLAND_UNIT_NM, rslt?.stat ?? EMPTY_STAT, cmpr),
        // 매출조회 권한은 서버가 info.sales 로 가른다
        sales: info.sales && salesDay ? toIslandSales(salesDay, hhmm) : undefined,
    };
}

/* ================= 상업시설 매출 ================= */

function toHrlyAmt(island: IslandCmrcSalesDto, hour: number): number | null {
    const amtList = island.storeList
        .map((store) => store.hrlyAmtList[hour] ?? null)
        .filter((amt): amt is number => amt !== null);

    return amtList.length === 0 ? null : amtList.reduce((sum, amt) => sum + amt, 0);
}

function toHrlyPrcsList(island: string, slotList: SmltMapSlotDto[]): number[] {
    const prcsList = new Array<number>(HOURS_PER_DAY).fill(0);

    slotList.forEach((slot) => {
        const hour = Number(slot.hhmm.slice(0, 2));
        const rslt = slot.chknRsltList.find((item) => item.unitCd === island);

        if (hour < HOURS_PER_DAY && rslt) prcsList[hour] += rslt.stat.prcsPsgCnt;
    });

    return prcsList;
}

function toTopStoreList(island: IslandCmrcSalesDto, hour: number, hrlyAmt: number | null): SalesRankItem[] {
    if (hrlyAmt === null || hrlyAmt <= 0) return [];

    return island.storeList
        .map((store) => ({ name: store.storeNm, amt: store.hrlyAmtList[hour] ?? 0 }))
        .filter((store) => store.amt > 0)
        .sort((a, b) => b.amt - a.amt)
        .slice(0, TOP_STORE_CNT)
        .map((store, idx) => ({
            rank: idx + 1,
            name: store.name,
            amtLabel: `${formatCount(Math.round(store.amt / AMT_UNIT))}만원`,
            shareLabel: `${Math.round((store.amt / hrlyAmt) * 100)}%`,
            share: store.amt / hrlyAmt,
        }));
}

function toPeakHour(hrlyAmtList: Array<number | null>): number | null {
    return hrlyAmtList.reduce<number | null>((peak, amt, hour) => {
        if (amt === null || amt <= 0) return peak;

        return peak === null || amt > (hrlyAmtList[peak] ?? 0) ? hour : peak;
    }, null);
}

function toIslandSalesDay(island: IslandCmrcSalesDto, slotList: SmltMapSlotDto[]): IslandSalesDay {
    const hours = Array.from({ length: HOURS_PER_DAY }, (_, hour) => hour);
    const hrlyAmtList = hours.map((hour) => toHrlyAmt(island, hour));

    return {
        storeCnt: island.storeList.length,
        hrlyAmtList,
        hrlyOpenCntList: hours.map(
            (hour) => island.storeList.filter((store) => (store.hrlyAmtList[hour] ?? 0) > 0).length,
        ),
        hrlyPrcsList: toHrlyPrcsList(island.island, slotList),
        hrlyTopStoreList: hours.map((hour) => toTopStoreList(island, hour, hrlyAmtList[hour])),
        peakHour: toPeakHour(hrlyAmtList),
        bars: hrlyAmtList.map((amt, hour) => ({
            hour,
            amt,
            amtLabel: amt === null ? '실적 없음' : `${formatCount(Math.round(amt / AMT_UNIT))}만원`,
        })),
    };
}

function toSalesDays(sales: CmrcSalesDto | null, slotList: SmltMapSlotDto[]): Map<string, IslandSalesDay> {
    return new Map(
        (sales?.islandList ?? []).map((island) => [island.island, toIslandSalesDay(island, slotList)]),
    );
}

function toAmtKpi(label: string, amt: number | null, unitAmt: number, unit: string): SalesKpi {
    return amt === null
        ? { label, value: EMPTY_VALUE, unit: '' }
        : { label, value: formatCount(Math.round(amt / unitAmt)), unit };
}

/** 매출은 1시간 단위라 30분 슬롯은 자기가 속한 시를 읽는다 (24:00 은 23시) */
function toIslandSales(day: IslandSalesDay, hhmm: string): IslandSales {
    const hour = Math.min(Number(hhmm.slice(0, 2)), HOURS_PER_DAY - 1);
    const amt = day.hrlyAmtList[hour];
    const cumAmt =
        amt === null
            ? null
            : day.hrlyAmtList.slice(0, hour + 1).reduce<number>((sum, value) => sum + (value ?? 0), 0);
    const prcsPsgCnt = day.hrlyPrcsList[hour];
    const amtPerPsg = amt === null || prcsPsgCnt === 0 ? null : amt / prcsPsgCnt;

    return {
        baseLabel: `${hour}시 기준`,
        kpis: [
            toAmtKpi('시간 매출', amt, AMT_UNIT, '만원'),
            toAmtKpi('당일 누적', cumAmt, AMT_UNIT, '만원'),
            {
                ...toAmtKpi('처리여객 1인당', amtPerPsg, 1, '원'),
                hint: '시간 매출 ÷ 같은 시간 체크인 처리인원(시뮬레이션)',
            },
        ],
        topStores: day.hrlyTopStoreList[hour],
        bars: day.bars,
        activeHour: hour,
        openStore: `${amt === null ? EMPTY_VALUE : day.hrlyOpenCntList[hour]} / ${day.storeCnt}개`,
        peakHour: day.peakHour === null ? EMPTY_VALUE : `${day.peakHour}시`,
    };
}

function toFacilityDetail(rslt: MapUnitRsltDto, cmpr: MapCgnCmprDto): FacilityDetail {
    return {
        id: `dg${rslt.unitCd}`,
        title: DPTGT_TITLE_PREFIX + rslt.unitCd,
        level: toLevel(rslt.cgnStatus),
        stats: toCongestionStats(DPTGT_UNIT_NM, rslt.stat, cmpr),
    };
}

/* ================= 하루치 ================= */

/** 슬롯 1칸 — 마커 색과 팝업이 같은 결과에서 나온다 */
function toMapSlot(
    dto: SmltMapDto,
    slot: SmltMapSlotDto,
    gates: GateMarker[],
    salesDays: Map<string, IslandSalesDay>,
): MapSlot {
    const chknMap = toRsltMap(slot.chknRsltList);
    const dptgtMap = toRsltMap(slot.dptgtRsltList);

    return {
        notice: toNotice(slot.notice),
        summaryInfo: toSummaryInfo(slot.landsideSmry),
        map: {
            stageAspect: STAGE_ASPECT,
            dptgtGates: dto.dptgtMarkerList.map((marker) =>
                toCongestionMarker(dto.tmnlId, 'dptgtGate', marker, dptgtMap.get(marker.label)),
            ),
            islands: dto.chknMarkerList.map((marker) =>
                toCongestionMarker(dto.tmnlId, 'island', marker, chknMap.get(marker.label)),
            ),
            gates,
        },
        islandDetails: Object.fromEntries(
            dto.chknInfoList.map((info) => [
                info.island,
                toIslandDetail(
                    info,
                    chknMap.get(info.island),
                    slot.chknCmpr,
                    salesDays.get(info.island),
                    slot.hhmm,
                ),
            ]),
        ),
        dptgtGateDetails: Object.fromEntries(
            slot.dptgtRsltList.map((rslt) => [rslt.unitCd, toFacilityDetail(rslt, slot.dptgtCmpr)]),
        ),
    };
}

export function toMapDay(dto: SmltMapDto, sales: CmrcSalesDto | null = null): MapDay {
    // 출입구 게이트는 혼잡도가 없어 슬롯마다 다시 만들지 않는다
    const gates = dto.gateMarkerList.map((marker) => toGateMarker(dto.tmnlId, marker));
    const salesDays = toSalesDays(sales, dto.slotList);

    return {
        summary: toSummary(dto.summary),
        operCards: toOperCards(dto.operCardList),
        slots: Object.fromEntries(
            dto.slotList.map((slot) => [slot.hhmm, toMapSlot(dto, slot, gates, salesDays)]),
        ),
    };
}

/* ================= 빈 값 ================= */

const EMPTY_STAT: MapCgnStatDto = { wtngPsgCnt: 0, wtngHr: 0, prcsPsgCnt: 0, prcsHr: 0 };

/** 아직 응답이 없을 때 그릴 빈 도면 (골격은 그대로 두고 값만 비운다) */
export const EMPTY_MAP_DATA: TerminalMapData = {
    stageAspect: STAGE_ASPECT,
    dptgtGates: [],
    islands: [],
    gates: [],
};

export const EMPTY_SUMMARY: HeaderSummary = { flight: '-', pax: '-' };

export const EMPTY_NOTICE: NoticeData = { level: null, items: [] };

/** 응답 전이거나 슬롯에 없는 시각 */
export const EMPTY_MAP_SLOT: MapSlot = {
    notice: EMPTY_NOTICE,
    summaryInfo: toSummaryInfo(null),
    map: EMPTY_MAP_DATA,
    islandDetails: {},
    dptgtGateDetails: {},
};
