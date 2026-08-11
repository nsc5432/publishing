import type {
    CongestionStatus,
    FcltType,
    MapCgnStatDto,
    MapChknDetailDto,
    MapDepDetailDto,
    MapMarkerDto,
    MapNoticeDto,
    MapOperCardDto,
    MapSmryDto,
    SmltMapDto,
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
    NoticeData,
    NoticeLevel,
    OperCard,
    TerminalMapData,
} from './types';

/**
 * 맵형태보기 DTO → 화면 뷰 모델.
 *
 * 서버는 혼잡도를 4단계(CongestionStatus)로 내려주고 화면 마커·뱃지는 3색이다.
 * 그 접점과 단위·형식 표기를 여기 한 곳에 모은다.
 */

/**
 * 도면 무대(.map__bg) 가로세로 비율.
 * 도면 SVG 의 viewBox 에서 온 값이라 데이터가 아니라 화면 자산에 속한다.
 */
const STAGE_ASPECT = '1798.6 / 1118.7';

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

export function toSummary(summary: MapSmryDto): HeaderSummary {
    return { flight: formatCount(summary.fltCnt), pax: formatCount(summary.psgCnt) };
}

export function toNotice(notice: MapNoticeDto): NoticeData {
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

/**
 * 운영시간 도넛 카드.
 *
 * 출국장이 여러 곳인 터미널은 도면 가운데로 연결동이 지나가므로 그 자리를 비운다.
 * 빈 칸은 격자 정렬용이라 서버가 내려주지 않는다.
 */
export function toOperCards(cardList: MapOperCardDto[]): OperCard[] {
    const cards: OperCard[] = cardList.map((card) => ({
        id: `o${card.depNum}`,
        rate: card.oprRate,
        time: `${formatHhmm(card.oprBgnTime)}-${formatHhmm(card.oprEndTime)}`,
        desc: `하루 ${card.oprHr}시간 운영`,
        dim: card.useYn === 'N',
    }));

    if (cards.length < 6) return cards;

    const middle = Math.floor(cards.length / 2);

    return [
        ...cards.slice(0, middle),
        { id: 'o-gap', rate: 0, time: '', desc: '', empty: true },
        ...cards.slice(middle),
    ];
}

/** 혼잡도를 함께 그리는 마커 (아일랜드 · 출국장이 같은 모양이다) */
function toCongestionMarker(marker: MapMarkerDto): IslandMarker & DepGateMarker {
    return {
        id: marker.markerId,
        label: marker.label,
        level: CONGESTION_TO_LEVEL[marker.cgnStatus ?? 'NORMAL'],
        x: marker.cdntX,
        y: marker.cdntY,
    };
}

function toGateMarker(marker: MapMarkerDto): GateMarker {
    return { id: marker.markerId, label: marker.label, x: marker.cdntX, y: marker.cdntY };
}

export function toTerminalMapData(dto: SmltMapDto): TerminalMapData {
    return {
        stageAspect: STAGE_ASPECT,
        depGates: dto.depMarkerList.map(toCongestionMarker),
        islands: dto.chknMarkerList.map(toCongestionMarker),
        gates: dto.gateMarkerList.map(toGateMarker),
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

export function toIslandDetail(dto: MapChknDetailDto): IslandDetail {
    return {
        id: dto.island,
        title: `${dto.island}아일랜드`,
        code: dto.fcltCd,
        level: CONGESTION_TO_LEVEL[dto.cgnStatus],
        facilities: dto.fcltList.map((fclt) => ({
            kind: FCLT_TYPE_TO_KIND[fclt.fcltType] ?? 'counter',
            name: fclt.fcltNm,
            // 상업시설은 처리율이 없다 (null 로 내려온다)
            rate: fclt.prcsRate === null ? undefined : `처리율 ${fclt.prcsRate}%`,
        })),
        stats: toStats(dto.stat),
        sales: {
            total: `${formatCount(dto.sales.totAmt)}원`,
            storeCount: `${dto.sales.storeCnt}개`,
            perPax: `${formatCount(dto.sales.amtPerPsg)}원`,
            paxDelta: `${formatCount(dto.sales.psgDiffCnt)}명`,
            rate: `${dto.sales.diffRate >= 0 ? '+' : '-'}${Math.abs(dto.sales.diffRate)}%`,
            rateUp: dto.sales.diffRate >= 0,
            rateBase: `vs ${dto.sales.cmprYear}`,
        },
    };
}

export function toFacilityDetail(dto: MapDepDetailDto): FacilityDetail {
    return {
        id: `dg${dto.depNum}`,
        title: dto.depNm,
        level: CONGESTION_TO_LEVEL[dto.cgnStatus],
        stats: toStats(dto.stat),
    };
}

/* ================= 빈 값 ================= */

/** 아직 응답이 없을 때 그릴 빈 도면 (골격은 그대로 두고 값만 비운다) */
export const EMPTY_MAP_DATA: TerminalMapData = {
    stageAspect: STAGE_ASPECT,
    depGates: [],
    islands: [],
    gates: [],
};

export const EMPTY_SUMMARY: HeaderSummary = { flight: '-', pax: '-' };

export const EMPTY_NOTICE: NoticeData = { level: 'normal', items: [] };
