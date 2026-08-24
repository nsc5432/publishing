import type {
    CongestionStatus,
    FcltType,
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
import type {
    CongestionLevel,
    DepGateMarker,
    FacilityDetail,
    FacilityKind,
    GateMarker,
    HeaderSummary,
    IslandDetail,
    IslandMarker,
    IslandStat,
    MapDay,
    MapSlot,
    NoticeData,
    NoticeLevel,
    OperCard,
    TerminalKind,
    TerminalMapData,
} from './types';
import { toPlanPoint } from './layout';

/**
 * 맵형태보기 DTO → 화면 뷰 모델.
 *
 * 서버는 혼잡도를 4단계(CongestionStatus)로 내려주고 화면 마커·뱃지는 3색이다.
 * 그 접점과 단위·형식 표기를 여기 한 곳에 모은다.
 *
 * 하루치를 한 번에 받으므로 여기서 30분 슬롯을 모두 펼쳐 둔다. 타임라인은 만들어 둔
 * 슬롯에서 자리만 바꿔 읽는다 — 눈금을 옮길 때 다시 계산하지 않는다.
 */

/**
 * 도면 무대(.map__bg) 가로세로 비율.
 * 도면 SVG 의 viewBox 에서 온 값이라 데이터가 아니라 화면 자산에 속한다.
 */
const STAGE_ASPECT = '1798.6 / 1118.7';

/** 출국장 팝업 제목 (예: 출국장 3) */
const DEP_TITLE_PREFIX = '출국장 ';

/** 혼잡도 4단계 → 마커·뱃지 3단계 (여유와 보통은 같은 색을 쓴다) */
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
        id: `o${card.depNum}`,
        depNum: card.depNum,
        rate: card.oprRate,
        time: `${formatHhmm(card.oprBgnTime)}-${formatHhmm(card.oprEndTime)}`,
        desc: `하루 ${card.oprHr}시간 운영`,
        dim: card.useYn === 'N',
    }));

    if (cards.length < 6) return cards;

    const middle = Math.floor(cards.length / 2);

    return [
        ...cards.slice(0, middle),
        { id: 'o-gap', depNum: '', rate: 0, time: '', desc: '', empty: true },
        ...cards.slice(middle),
    ];
}

function toNotice(notice: MapNoticeDto): NoticeData {
    return {
        level: CONGESTION_TO_NOTICE_LEVEL[notice.cgnStatus],
        items: notice.itemList.map((item) => ({
            id: item.fcltCd,
            facility: item.fcltNm,
            code: item.fcltCd,
            desc: `${item.boothCnt}개 부스 OPEN`,
        })),
    };
}

/** 묶음 단위 코드(아일랜드 문자 · 출국장 번호) → 그 시각 상태 */
function toRsltMap<T extends MapUnitRsltDto>(rsltList: T[]): Map<string, T> {
    return new Map(rsltList.map((rslt) => [rslt.unitCd, rslt]));
}

/**
 * 혼잡도를 함께 그리는 마커 (아일랜드 · 출국장이 같은 모양이다).
 * 마커는 자리만 알고 색은 그 시각 결과에서 온다 — 결과가 없는 시각은 원활로 둔다.
 */
function toCongestionMarker(
    terminal: TerminalKind,
    kind: 'depGate' | 'island',
    marker: MapMarkerDto,
    rslt: MapUnitRsltDto | undefined,
): IslandMarker & DepGateMarker {
    const cgnStatus = rslt?.cgnStatus ?? 'NORMAL';
    const point = toPlanPoint(terminal, kind, marker.label, {
        x: marker.cdntX,
        y: marker.cdntY,
    });

    return {
        id: marker.markerId,
        label: marker.label,
        level: CONGESTION_TO_LEVEL[cgnStatus],
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

/** 혼잡 현황 지표 4종 — 아일랜드 상세 / 출국장 미니 팝업이 함께 쓴다 */
function toStats(stat: MapCgnStatDto): IslandStat[] {
    return [
        {
            ico: 'wait-people',
            label: '대기인원',
            value: String(stat.wtngPsgCnt),
            unit: '명',
            point: true,
        },
        {
            ico: 'wait-time',
            label: '대기시간',
            value: String(stat.wtngHr),
            unit: '초',
            point: true,
        },
        { ico: 'done-people', label: '처리인원', value: String(stat.prcsPsgCnt), unit: '명' },
        { ico: 'done-time', label: '처리시간', value: String(stat.prcsHr), unit: '초' },
    ];
}

/** 시설 구성·매출은 하루 내내 같고, 혼잡도·처리율만 그 시각 결과에서 온다 */
function toIslandDetail(info: MapChknInfoDto, rslt: MapChknRsltDto | undefined): IslandDetail {
    return {
        id: info.island,
        title: `${info.island}아일랜드`,
        code: info.fcltCd,
        level: CONGESTION_TO_LEVEL[rslt?.cgnStatus ?? 'NORMAL'],
        facilities: info.fcltList.map((fclt) => ({
            kind: FCLT_TYPE_TO_KIND[fclt.fcltType] ?? 'counter',
            name: fclt.fcltNm,
            // 상업시설은 처리율이 없다
            rate: fclt.prcsRateYn === 'N' ? undefined : `처리율 ${rslt?.prcsRate ?? 0}%`,
        })),
        stats: toStats(rslt?.stat ?? EMPTY_STAT),
        sales: {
            total: `${formatCount(info.sales.totAmt)}원`,
            storeCount: `${info.sales.storeCnt}개`,
            perPax: `${formatCount(info.sales.amtPerPsg)}원`,
            paxDelta: `${formatCount(info.sales.psgDiffCnt)}명`,
            rate: `${info.sales.diffRate >= 0 ? '+' : '-'}${Math.abs(info.sales.diffRate)}%`,
            rateUp: info.sales.diffRate >= 0,
            rateBase: `vs ${info.sales.cmprYear}`,
        },
    };
}

function toFacilityDetail(rslt: MapUnitRsltDto): FacilityDetail {
    return {
        id: `dg${rslt.unitCd}`,
        title: DEP_TITLE_PREFIX + rslt.unitCd,
        level: CONGESTION_TO_LEVEL[rslt.cgnStatus],
        stats: toStats(rslt.stat),
    };
}

/* ================= 하루치 ================= */

/** 슬롯 1칸 — 마커 색과 팝업이 같은 결과에서 나온다 */
function toMapSlot(dto: SmltMapDto, slot: SmltMapSlotDto, gates: GateMarker[]): MapSlot {
    const chknMap = toRsltMap(slot.chknRsltList);
    const depMap = toRsltMap(slot.depRsltList);

    return {
        notice: toNotice(slot.notice),
        map: {
            stageAspect: STAGE_ASPECT,
            depGates: dto.depMarkerList.map((marker) =>
                toCongestionMarker(dto.tmnlId, 'depGate', marker, depMap.get(marker.label)),
            ),
            islands: dto.chknMarkerList.map((marker) =>
                toCongestionMarker(dto.tmnlId, 'island', marker, chknMap.get(marker.label)),
            ),
            gates,
        },
        islandDetails: Object.fromEntries(
            dto.chknInfoList.map((info) => [
                info.island,
                toIslandDetail(info, chknMap.get(info.island)),
            ]),
        ),
        depGateDetails: Object.fromEntries(
            slot.depRsltList.map((rslt) => [rslt.unitCd, toFacilityDetail(rslt)]),
        ),
    };
}

export function toMapDay(dto: SmltMapDto): MapDay {
    // 출입구 게이트는 혼잡도가 없어 슬롯마다 다시 만들지 않는다
    const gates = dto.gateMarkerList.map((marker) => toGateMarker(dto.tmnlId, marker));

    return {
        summary: toSummary(dto.summary),
        operCards: toOperCards(dto.operCardList),
        slots: Object.fromEntries(
            dto.slotList.map((slot) => [slot.hhmm, toMapSlot(dto, slot, gates)]),
        ),
    };
}

/* ================= 빈 값 ================= */

const EMPTY_STAT: MapCgnStatDto = { wtngPsgCnt: 0, wtngHr: 0, prcsPsgCnt: 0, prcsHr: 0 };

/** 아직 응답이 없을 때 그릴 빈 도면 (골격은 그대로 두고 값만 비운다) */
export const EMPTY_MAP_DATA: TerminalMapData = {
    stageAspect: STAGE_ASPECT,
    depGates: [],
    islands: [],
    gates: [],
};

export const EMPTY_SUMMARY: HeaderSummary = { flight: '-', pax: '-' };

export const EMPTY_NOTICE: NoticeData = { level: 'normal', items: [] };

/** 응답 전이거나 슬롯에 없는 시각 */
export const EMPTY_MAP_SLOT: MapSlot = {
    notice: EMPTY_NOTICE,
    map: EMPTY_MAP_DATA,
    islandDetails: {},
    depGateDetails: {},
};
