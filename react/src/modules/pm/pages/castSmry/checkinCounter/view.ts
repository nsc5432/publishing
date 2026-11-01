import type {
    ChknCounterDto,
    ChknCounterIslandDto,
    ChknCounterSlotDto,
    CongestionStatus,
    MapChknRsltDto,
    MapNoticeDto,
    MapNoticeItemDto,
    SmltKpiDto,
} from '@/types/api.types';
import { formatCount, formatHhmm } from '@/lib/format';
import type {
    ChknDay,
    ChknIslandBooth,
    ChknIslandView,
    ChknKpi,
    ChknQueueSeries,
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
 * 차트와 표가 모두 30분 슬롯 하나를 근거로 삼는다. 값을 두 벌 만들지 않으므로
 * 타임라인을 옮겨도 두 보기가 서로 다른 이야기를 하지 않는다.
 */

interface MaxQueue {
    psgCnt: number;
    island: string;
    hhmm: string;
}

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

const SEC_PER_MIN = 60;

export function toWaitMin(waitSec: number): number {
    return Math.round(waitSec / SEC_PER_MIN);
}

/** 산정 불가(null)는 3색에 넣지 않는다 */
function toLevel(cgnStatus: CongestionStatus | null): CongestionLevel | null {
    return cgnStatus === null ? null : CONGESTION_TO_LEVEL[cgnStatus];
}

/* ================= 요약 / 결과 지표 ================= */

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

/**
 * 공용 Queue 결과 지표 4종.
 * P95 는 응답에 남지만 화면에 내보내지 않는다 — 근사값이라 운영 판단 기준이 되지 못한다.
 */
function toKpis(
    kpi: SmltKpiDto,
    maxWaitMin: number,
    maxQueue: MaxQueue | null,
    prcsPsgCnt: number,
): ChknKpi[] {
    return [
        { id: 'avgWait', label: '평균 대기', value: formatCount(kpi.avgWaitMin), unit: '분' },
        { id: 'maxWait', label: '최대 대기', value: formatCount(maxWaitMin), unit: '분' },
        {
            id: 'maxQueue',
            label: '최대 Queue',
            value: formatCount(maxQueue?.psgCnt ?? 0),
            unit: '명',
            note: maxQueue === null ? undefined : `${maxQueue.island} · ${formatHhmm(maxQueue.hhmm)}`,
        },
        { id: 'prcs', label: '총 처리인원', value: formatCount(prcsPsgCnt), unit: '명' },
    ];
}

/* ================= Queue 차트 ================= */

function slotQueue(slot: ChknCounterSlotDto): number {
    return slot.chknRsltList.reduce((sum, rslt) => sum + rslt.stat.wtngPsgCnt, 0);
}

function slotPrcsPsgCnt(slot: ChknCounterSlotDto): number {
    return slot.chknRsltList.reduce((sum, rslt) => sum + rslt.stat.prcsPsgCnt, 0);
}

/** 처리 여객 가중 평균대기 — 아일랜드를 합칠 때 처리인원이 적은 곳이 값을 끌고 가지 않게 한다 */
function slotWaitSec(slot: ChknCounterSlotDto): number {
    const prcsPsgCnt = slotPrcsPsgCnt(slot);

    if (prcsPsgCnt === 0) return 0;

    const weightedSum = slot.chknRsltList.reduce(
        (sum, rslt) => sum + rslt.stat.wtngHr * rslt.stat.prcsPsgCnt,
        0,
    );

    return Math.round(weightedSum / prcsPsgCnt);
}

function toIslandBooths(
    islandList: ChknCounterIslandDto[],
    slotList: ChknCounterSlotDto[],
): ChknIslandBooth[] {
    const rsltMaps = slotList.map(
        (slot) => new Map(slot.chknRsltList.map((rslt) => [rslt.unitCd, rslt.oprBoothCnt])),
    );

    return islandList.map((island) => ({
        island: island.island,
        title: island.fcltNm,
        booth: rsltMaps.map((rsltMap) => rsltMap.get(island.island) ?? 0),
    }));
}

/**
 * 30분 단위 하루 흐름 — 블럭(아일랜드별 운영 부스)과 꺾은선(Queue 인원)이 같은 슬롯을 본다.
 * 표 보기와 근거가 같으므로 타임라인을 옮기면 두 보기가 함께 바뀐다.
 */
function toQueueSeries(
    islandList: ChknCounterIslandDto[],
    slotList: ChknCounterSlotDto[],
    queueMax: number,
): ChknQueueSeries {
    return {
        timeLabels: slotList.map((slot) => formatHhmm(slot.hhmm)),
        booth: slotList.map((slot) =>
            slot.chknRsltList.reduce((sum, rslt) => sum + rslt.oprBoothCnt, 0),
        ),
        islands: toIslandBooths(islandList, slotList),
        queue: slotList.map(slotQueue),
        xovisQueue: slotList.map((slot) => slot.xovisWtngPsgCnt),
        queueMax,
        waitSec: slotList.map(slotWaitSec),
        prcsPsgCnt: slotList.map(slotPrcsPsgCnt),
    };
}

/** 터미널 합계 Queue 로는 아일랜드를 짚을 수 없어 아일랜드 단위 최댓값을 쓴다 */
function toMaxQueue(islandList: ChknCounterIslandDto[], slotList: ChknCounterSlotDto[]): MaxQueue | null {
    const nameMap = new Map(islandList.map((island) => [island.island, island.fcltNm]));
    let result: MaxQueue | null = null;

    for (const slot of slotList) {
        for (const rslt of slot.chknRsltList) {
            if (rslt.maxQueuePsgCnt > (result?.psgCnt ?? 0)) {
                result = {
                    psgCnt: rslt.maxQueuePsgCnt,
                    island: nameMap.get(rslt.unitCd) ?? rslt.unitCd,
                    hhmm: slot.hhmm,
                };
            }
        }
    }

    return result;
}

/* ================= 아일랜드 ================= */

/**
 * 표 보기의 1행 — 자원 구성은 하루 내내 같고 Queue 값은 그 시각 슬롯에서 온다.
 * 그 시각에 문을 연 부스가 없으면 미운영으로 그린다.
 */
function toIslandView(island: ChknCounterIslandDto, rslt: MapChknRsltDto | undefined): ChknIslandView {
    const stat = rslt?.stat;

    return {
        id: island.island,
        island: island.island,
        title: island.fcltNm,
        level: toLevel(rslt?.cgnStatus ?? null),
        isClosed: (rslt?.oprBoothCnt ?? 0) === 0,
        oprBoothCnt: rslt?.oprBoothCnt ?? 0,
        queuePsgCnt: stat?.wtngPsgCnt ?? 0,
        avgQueuePsgCnt: rslt?.avgQueuePsgCnt ?? 0,
        maxQueuePsgCnt: rslt?.maxQueuePsgCnt ?? 0,
        waitSec: stat?.wtngHr ?? 0,
        prcsPsgCnt: stat?.prcsPsgCnt ?? 0,
        prcsRate: rslt?.prcsRate ?? 0,
        cgnClear: rslt?.cgnClearMin == null ? EMPTY : `${formatCount(rslt.cgnClearMin)}분`,
        reqCnt: rslt?.reqCnt == null ? EMPTY : `${formatCount(rslt.reqCnt)}개`,
        airlines: island.alnCdList.length > 0 ? island.alnCdList.join(', ') : EMPTY,
    };
}

/* ================= 하루치 ================= */

/** 알림 한 줄 — 지금 몇 부스로 버티는지, 몇 부스가 필요한지, 언제 풀리는지 */
function toNoticeDesc(item: MapNoticeItemDto): string {
    const parts = [`운영 ${formatCount(item.boothCnt)}개`];

    if (item.cgnWtngSec != null) parts.push(`평균대기 ${formatCount(toWaitMin(item.cgnWtngSec))}분`);
    if (item.reqCnt != null) parts.push(`필요 ${formatCount(item.reqCnt)}개`);
    if (item.cgnClearMin != null) parts.push(`해소 ${formatCount(item.cgnClearMin)}분`);

    return parts.join(' / ');
}

function toNotice(notice: MapNoticeDto): NoticeData {
    return {
        level: notice.cgnStatus === null ? null : CONGESTION_TO_NOTICE_LEVEL[notice.cgnStatus],
        items: notice.itemList.map((item) => ({
            id: item.fcltCd,
            facility: item.fcltNm,
            desc: toNoticeDesc(item),
        })),
    };
}

/** 슬롯 1칸 — 알림과 표가 같은 결과에서 나온다 */
function toSlot(islandList: ChknCounterIslandDto[], slot: ChknCounterSlotDto): ChknSlot {
    const rsltMap = new Map(slot.chknRsltList.map((rslt) => [rslt.unitCd, rslt]));

    return {
        notice: toNotice(slot.notice),
        islands: islandList.map((island) => toIslandView(island, rsltMap.get(island.island))),
    };
}

export function toChknDay(dto: ChknCounterDto): ChknDay {
    const prcsPsgCnt = dto.slotList.reduce((sum, slot) => sum + slotPrcsPsgCnt(slot), 0);

    return {
        summary: toSummary(dto),
        kpis: toKpis(dto.kpi, dto.maxWaitMin, toMaxQueue(dto.islandList, dto.slotList), prcsPsgCnt),
        queue: toQueueSeries(dto.islandList, dto.slotList, dto.waitMaxCnt),
        slots: Object.fromEntries(
            dto.slotList.map((slot) => [slot.hhmm, toSlot(dto.islandList, slot)]),
        ),
    };
}

/* ================= 빈 값 ================= */

export const EMPTY_NOTICE: NoticeData = { level: null, items: [] };

export const EMPTY_QUEUE: ChknQueueSeries = {
    timeLabels: [],
    booth: [],
    islands: [],
    queue: [],
    xovisQueue: [],
    queueMax: 0,
    waitSec: [],
    prcsPsgCnt: [],
};

/** 응답 전이거나 슬롯에 없는 시각 */
export const EMPTY_CHKN_SLOT: ChknSlot = { notice: EMPTY_NOTICE, islands: [] };
