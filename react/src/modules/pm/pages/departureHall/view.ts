import type {
    CongestionStatus,
    DepHallDto,
    DepHallGateDto,
    DepHallSlotDto,
    MapCgnStatDto,
    MapMarkerDto,
    MapNoticeDto,
    MapUnitRsltDto,
} from '@/types/api.types';
import { formatHhmm } from '@/lib/format';
import type {
    CongestionLevel,
    DepDay,
    DepGateCard,
    DepGateMarker,
    DepSlot,
    DepStat,
    DepTrend,
    DepTrendSeries,
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
 *
 * 하루치를 한 번에 받으므로 여기서 30분 슬롯을 모두 펼쳐 두고, 차트 보기의 추이도
 * 같은 슬롯에서 뽑는다. 세 보기가 한 벌의 값을 나눠 쓴다.
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

/** 묶음 단위 코드(출국장 번호 · 아일랜드 문자) → 그 시각 상태 */
function toRsltMap(rsltList: MapUnitRsltDto[]): Map<string, MapUnitRsltDto> {
    return new Map(rsltList.map((rslt) => [rslt.unitCd, rslt]));
}

/**
 * 도면 위 출국장 카드 — 마커와 같은 무대 기준 비율 좌표를 갖는다.
 * 자리·운영시간은 하루 내내 같고 혼잡도·지표만 그 시각 결과에서 온다.
 */
function toCard(gate: DepHallGateDto, rslt: MapUnitRsltDto | undefined): DepGateCard {
    return {
        id: `dg${gate.depNum}`,
        depNum: gate.depNum,
        title: gate.depNm,
        level: CONGESTION_TO_LEVEL[rslt?.cgnStatus ?? 'NORMAL'],
        stats: toDepStats(rslt?.stat ?? EMPTY_STAT),
        boothCnt: gate.boothCnt,
        operTime: `${formatHhmm(gate.oprBgnTime)}-${formatHhmm(gate.oprEndTime)}`,
        x: gate.cdntX,
        y: gate.cdntY,
        isClosed: gate.useYn === 'N',
    };
}

/**
 * 혼잡도를 함께 그리는 마커 (아일랜드 · 출국장이 같은 모양이다).
 * 마커는 자리만 알고 색은 그 시각 결과에서 온다 — 결과가 없는 시각은 원활로 둔다.
 */
function toCongestionMarker(
    marker: MapMarkerDto,
    rslt: MapUnitRsltDto | undefined,
): IslandMarker & DepGateMarker {
    return {
        id: marker.markerId,
        label: marker.label,
        level: CONGESTION_TO_LEVEL[rslt?.cgnStatus ?? 'NORMAL'],
        x: marker.cdntX,
        y: marker.cdntY,
    };
}

function toGateMarker(marker: MapMarkerDto): GateMarker {
    return { id: marker.markerId, label: marker.label, x: marker.cdntX, y: marker.cdntY };
}

function toNotice(notice: MapNoticeDto): NoticeData {
    return {
        level: CONGESTION_TO_NOTICE_LEVEL[notice.cgnStatus],
        items: notice.itemList.map((item) => ({
            id: item.fcltCd,
            facility: item.fcltNm,
            desc: `${item.boothCnt}개 부스 OPEN`,
        })),
    };
}

/* ================= 하루치 ================= */

/** 슬롯 1칸 — 카드·마커 색이 같은 결과에서 나온다 */
function toDepSlot(dto: DepHallDto, slot: DepHallSlotDto, gates: GateMarker[]): DepSlot {
    const depMap = toRsltMap(slot.depRsltList);
    const chknMap = toRsltMap(slot.chknRsltList);

    const map: TerminalDepMap = {
        cards: dto.gateList.map((gate) => toCard(gate, depMap.get(gate.depNum))),
        depGates: dto.depMarkerList.map((marker) =>
            toCongestionMarker(marker, depMap.get(marker.label)),
        ),
        islands: dto.chknMarkerList.map((marker) =>
            toCongestionMarker(marker, chknMap.get(marker.label)),
        ),
        gates,
    };

    return { notice: toNotice(slot.notice), map };
}

/**
 * 차트 보기 — 출국장별 하루 추이.
 * 맵·표 보기가 한 시각을 읽는 그 값들을 시각 순서대로 이어 붙인 것이다.
 */
function toTrend(dto: DepHallDto): DepTrend {
    return {
        timeLabels: dto.slotList.map((slot) => formatHhmm(slot.hhmm)),
        series: dto.gateList.map((gate, gateIndex): DepTrendSeries => ({
            depNum: gate.depNum,
            title: gate.depNm,
            color: TREND_COLORS[gateIndex % TREND_COLORS.length],
            values: dto.slotList.map(
                (slot) =>
                    slot.depRsltList.find((rslt) => rslt.unitCd === gate.depNum)?.stat.wtngPsgCnt ??
                    0,
            ),
        })),
    };
}

export function toDepDay(dto: DepHallDto): DepDay {
    // 출입구 게이트는 혼잡도가 없어 슬롯마다 다시 만들지 않는다
    const gates = dto.gateMarkerList.map(toGateMarker);

    return {
        slots: Object.fromEntries(
            dto.slotList.map((slot) => [slot.hhmm, toDepSlot(dto, slot, gates)]),
        ),
        trend: toTrend(dto),
    };
}

/* ================= 빈 값 ================= */

const EMPTY_STAT: MapCgnStatDto = { wtngPsgCnt: 0, wtngHr: 0, prcsPsgCnt: 0, prcsHr: 0 };

/** 아직 응답이 없을 때 그릴 빈 도면 (골격은 그대로 두고 값만 비운다) */
export const EMPTY_DEP_MAP: TerminalDepMap = {
    cards: [],
    depGates: [],
    islands: [],
    gates: [],
};

export const EMPTY_NOTICE: NoticeData = { level: 'normal', items: [] };

export const EMPTY_TREND: DepTrend = { timeLabels: [], series: [] };

/** 응답 전이거나 슬롯에 없는 시각 */
export const EMPTY_DEP_SLOT: DepSlot = { notice: EMPTY_NOTICE, map: EMPTY_DEP_MAP };
