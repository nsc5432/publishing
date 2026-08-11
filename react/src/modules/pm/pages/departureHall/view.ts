import type {
    CongestionStatus,
    DepHallDto,
    DepHallTrendDto,
    MapCgnStatDto,
    MapMarkerDto,
    MapNoticeDto,
} from '@/types/api.types';
import { formatHhmm } from '@/lib/format';
import type {
    CongestionLevel,
    DepGateCard,
    DepGateMarker,
    DepStat,
    DepTrend,
    GateMarker,
    IslandMarker,
    NoticeData,
    NoticeLevel,
    TerminalDepMap,
} from './types';

/**
 * 출국장 DTO → 화면 뷰 모델.
 *
 * 서버는 혼잡도를 4단계(CongestionStatus)로 내려주고 화면 마커·뱃지는 3색이다.
 * 그 접점을 여기 한 곳에 둔다. 컴포넌트가 저마다 매핑을 들고 있으면
 * 같은 상태가 화면마다 다른 색으로 보이기 시작한다.
 */

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

/** 출국장별 꺾은선 색 (내려온 순서대로 돌려 쓴다) */
const TREND_COLORS = ['#4441cc', '#e12b2b', '#1f9d3a', '#e8a318', '#2f7ff0', '#8b5cf6'];

/** 혼잡 현황 지표 4종 — 카드 · 표 보기가 같은 순서로 읽는다 */
function toDepStats(cgnStat: MapCgnStatDto): DepStat[] {
    return [
        {
            icon: 'wait-people',
            label: '대기인원',
            value: String(cgnStat.wtngPsgCnt),
            unit: '명',
            isHighlighted: true,
        },
        {
            icon: 'wait-time',
            label: '대기시간',
            value: String(cgnStat.wtngHr),
            unit: '초',
            isHighlighted: true,
        },
        { icon: 'done-people', label: '처리인원', value: String(cgnStat.prcsPsgCnt), unit: '명' },
        { icon: 'done-time', label: '처리시간', value: String(cgnStat.prcsHr), unit: '초' },
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

/** 도면 위 출국장 카드 — 마커와 같은 무대 기준 비율 좌표를 갖는다 */
function toCards(depHall: DepHallDto): DepGateCard[] {
    return depHall.gateList.map((gate) => ({
        id: `dg${gate.depNum}`,
        depNum: gate.depNum,
        title: gate.depNm,
        level: CONGESTION_TO_LEVEL[gate.cgnStatus],
        stats: toDepStats(gate.stat),
        boothCnt: gate.boothCnt,
        operTime: `${formatHhmm(gate.oprBgnTime)}-${formatHhmm(gate.oprEndTime)}`,
        x: gate.cdntX,
        y: gate.cdntY,
        isClosed: gate.useYn === 'N',
    }));
}

export function toTerminalDepMap(depHall: DepHallDto): TerminalDepMap {
    return {
        cards: toCards(depHall),
        depGates: depHall.depMarkerList.map(toCongestionMarker),
        islands: depHall.chknMarkerList.map(toCongestionMarker),
        gates: depHall.gateMarkerList.map(toGateMarker),
    };
}

export function toNotice(notice: MapNoticeDto): NoticeData {
    return {
        level: CONGESTION_TO_NOTICE_LEVEL[notice.cgnStatus],
        items: notice.itemList.map((item) => ({
            id: item.fcltCd,
            facility: item.fcltNm,
            desc: `${item.boothCnt}개 부스 OPEN`,
        })),
    };
}

/* ================= 차트 보기 ================= */

export function toTrend(trend: DepHallTrendDto): DepTrend {
    return {
        timeLabels: trend.timeList.map(formatHhmm),
        series: trend.seriesList.map((series, seriesIndex) => ({
            depNum: series.depNum,
            title: series.depNm,
            color: TREND_COLORS[seriesIndex % TREND_COLORS.length],
            values: series.itemList.map((item) => item.wtngPsgCnt),
        })),
    };
}

/** 아직 응답이 없을 때 그릴 빈 도면 (골격은 그대로 두고 값만 비운다) */
export const EMPTY_DEP_MAP: TerminalDepMap = {
    cards: [],
    depGates: [],
    islands: [],
    gates: [],
};

export const EMPTY_NOTICE: NoticeData = { level: 'normal', items: [] };

export const EMPTY_TREND: DepTrend = { timeLabels: [], series: [] };
