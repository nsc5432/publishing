import type {
    ChknCounterDto,
    ChknCounterIslandDto,
    ChknCounterRsrcDto,
    ChknCounterSlotDto,
    CongestionStatus,
    MapChknRsltDto,
    MapNoticeDto,
    OprTimeDto,
    SmltKpiDto,
} from '@/types/api.types';
import { formatCount, pad2 } from '@/lib/format';
import type {
    ChknDay,
    ChknIslandView,
    ChknKpi,
    ChknResourceSeries,
    ChknSlot,
    ChknSummaryItem,
    CongestionLevel,
    NoticeData,
    NoticeLevel,
} from './types';

/**
 * 체크인카운터 DTO → 화면 뷰 모델.
 *
 * 서버는 혼잡도를 4단계(CongestionStatus)로 내려주고 화면 뱃지는 3색이다.
 * 그 접점을 여기 한 곳에 둔다 — 출국장 화면과 같은 규칙이라 두 화면에서 같은 상태가
 * 같은 색으로 보인다.
 *
 * 하루치를 한 번에 받으므로 여기서 30분 슬롯을 모두 펼쳐 두고, 차트 보기의 자원 활용도
 * 같은 응답(rsrcList)에서 뽑는다. 두 보기가 한 벌의 값을 나눠 쓴다.
 */

/** 혼잡도 4단계 → 뱃지 3단계 (여유와 보통은 같은 색을 쓴다) */
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

/** 값이 없을 때 표기 */
const EMPTY = '-';

/* ================= 요약 · 결과 지표 ================= */

/** 요약 바 — 시뮬레이션이 배치한 자원의 규모를 한 줄로 읽는다 */
function toSummary(dto: ChknCounterDto): ChknSummaryItem[] {
    return [
        { id: 'total', label: '전체 카운터', value: formatCount(dto.totCnt), unit: '개' },
        {
            id: 'island',
            label: '운영 아일랜드',
            value: formatCount(dto.oprIslandCnt),
            unit: '개',
            isAccent: true,
        },
        {
            id: 'peak',
            label: '피크 카운터',
            value: formatCount(dto.peakCounterCnt),
            unit: '개',
            isAccent: true,
        },
        { id: 'kiosk', label: '셀프체크인', value: formatCount(dto.totKioskCnt), unit: '대' },
        { id: 'bagdrop', label: '셀프백드롭', value: formatCount(dto.totBagDropCnt), unit: '대' },
    ];
}

/** 시뮬레이션 결과 지표 4종 — 사용자 시뮬레이션 패널 헤드와 같은 순서로 읽는다 */
function toKpis(kpi: SmltKpiDto): ChknKpi[] {
    return [
        { id: 'avgWait', label: '평균대기', value: formatCount(kpi.avgWaitMin), unit: '분' },
        { id: 'p95Wait', label: 'P95대기', value: formatCount(kpi.p95WaitMin), unit: '분' },
        {
            id: 'maxQueue',
            label: '최대 큐인원',
            value: formatCount(kpi.maxQueuePsgCnt),
            unit: '명',
        },
        { id: 'util', label: '가동률', value: formatCount(kpi.utilRate), unit: '%' },
    ];
}

/* ================= 자원 활용 차트 ================= */

/**
 * 시간대별 자원 활용 — 막대 3종과 대기인원 꺾은선이 같은 시각을 본다.
 * 서버가 시간 순으로 24개를 채워 내려주므로 여기서는 축별로 갈라 담기만 한다.
 */
function toResource(rsrcList: ChknCounterRsrcDto[], waitMaxCnt: number): ChknResourceSeries {
    return {
        hourLabels: rsrcList.map((rsrc) => pad2(rsrc.hour)),
        counter: rsrcList.map((rsrc) => rsrc.counterCnt),
        kiosk: rsrcList.map((rsrc) => rsrc.kioskCnt),
        bagdrop: rsrcList.map((rsrc) => rsrc.bagDropCnt),
        wait: rsrcList.map((rsrc) => rsrc.wtngPsgCnt),
        waitMax: waitMaxCnt,
        utilRate: rsrcList.map((rsrc) => rsrc.utilRate),
    };
}

/* ================= 아일랜드 ================= */

/** 운영 시간 구간 → 표기 (구간이 여럿이면 이어 붙인다) */
function toOperTime(oprTimeList: OprTimeDto[]): string {
    if (oprTimeList.length === 0) return EMPTY;

    return oprTimeList
        .map((time) => `${pad2(time.bgnHour)}:00-${pad2(time.endHour)}:00`)
        .join(', ');
}

/**
 * 그 시각에 문을 연 아일랜드인가.
 *
 * 자원 구성(카운터 · 키오스크 대수)은 하루치 한 벌뿐이라, 운영시간 밖의 시각에도 그대로
 * 내려온다. 그 값을 그대로 그리면 새벽 3시에도 카운터가 열려 있는 것처럼 보이므로
 * 타임라인이 가리키는 시각을 운영시간 구간과 맞춰 본다.
 */
function isOperating(island: ChknCounterIslandDto, hour: number): boolean {
    if (island.useYn === 'N') return false;

    return island.oprTimeList.some((time) => time.bgnHour <= hour && hour < time.endHour);
}

/**
 * 표 보기의 1행 — 자원 구성은 하루 내내 같고 혼잡도·지표만 그 시각 결과에서 온다.
 * 결과가 없는 시각(문 닫은 아일랜드)은 원활·0 으로 둔다.
 */
function toIslandView(
    island: ChknCounterIslandDto,
    rslt: MapChknRsltDto | undefined,
    hour: number,
): ChknIslandView {
    const stat = rslt?.stat;

    return {
        id: island.island,
        island: island.island,
        title: island.fcltNm,
        level: CONGESTION_TO_LEVEL[rslt?.cgnStatus ?? 'NORMAL'],
        isClosed: !isOperating(island, hour),
        counterCnt: island.counterCnt,
        kioskCnt: island.kioskCnt,
        bagDropCnt: island.bagDropCnt,
        operTime: toOperTime(island.oprTimeList),
        airlines: island.alnCdList.length > 0 ? island.alnCdList.join(', ') : EMPTY,
        wtngPsgCnt: stat?.wtngPsgCnt ?? 0,
        wtngHr: stat?.wtngHr ?? 0,
        prcsPsgCnt: stat?.prcsPsgCnt ?? 0,
        prcsRate: rslt?.prcsRate ?? 0,
    };
}

/* ================= 하루치 ================= */

function toNotice(notice: MapNoticeDto): NoticeData {
    return {
        level: CONGESTION_TO_NOTICE_LEVEL[notice.cgnStatus],
        items: notice.itemList.map((item) => ({
            id: item.fcltCd,
            facility: item.fcltNm,
            desc: `${item.boothCnt}개 카운터 운영`,
        })),
    };
}

/** 슬롯 1칸 — 알림과 표가 같은 결과에서 나온다 */
function toSlot(islandList: ChknCounterIslandDto[], slot: ChknCounterSlotDto): ChknSlot {
    const rsltMap = new Map(slot.chknRsltList.map((rslt) => [rslt.unitCd, rslt]));
    // 슬롯 시각의 시(HH) — 운영시간 구간이 시 단위라 분은 보지 않는다 (2400 은 어디에도 안 든다)
    const hour = Number(slot.hhmm.slice(0, 2));

    return {
        notice: toNotice(slot.notice),
        islands: islandList.map((island) =>
            toIslandView(island, rsltMap.get(island.island), hour),
        ),
    };
}

export function toChknDay(dto: ChknCounterDto): ChknDay {
    return {
        summary: toSummary(dto),
        kpis: toKpis(dto.kpi),
        resource: toResource(dto.rsrcList, dto.waitMaxCnt),
        slots: Object.fromEntries(
            dto.slotList.map((slot) => [slot.hhmm, toSlot(dto.islandList, slot)]),
        ),
    };
}

/* ================= 빈 값 ================= */

export const EMPTY_NOTICE: NoticeData = { level: 'normal', items: [] };

export const EMPTY_RESOURCE: ChknResourceSeries = {
    hourLabels: [],
    counter: [],
    kiosk: [],
    bagdrop: [],
    wait: [],
    waitMax: 0,
    utilRate: [],
};

/** 응답 전이거나 슬롯에 없는 시각 */
export const EMPTY_CHKN_SLOT: ChknSlot = { notice: EMPTY_NOTICE, islands: [] };
