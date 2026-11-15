import type {
    CongestionStatus,
    DsbdCategory,
    DsbdFcltCardDto,
    DsbdRsltDto,
    FcltQueueArvlDto,
    FcltQueueClearDto,
    FcltQueueCntClearDto,
    FcltQueueRecommendDto,
    FcltQueueScenarioDto,
    FcltUnitDto,
    QueueCalcMethod,
    QueueDataSrc,
    SmltType,
    TmnlId,
    TmnlSmryDto,
} from '@/types/api.types';
import { toDsbdSummaryInfo, toDsbdSummaryTip } from '@/modules/pm/summary';
import { formatCount, formatDateTime, formatDiff, formatHhmm, formatMinutes, formatYmd, pad2, stepHhmm } from '@/lib/format';
import {
    FCLT_QUEUE_LABEL,
    SMRY_INTRVL_MIN,
    SUMMARY_SCOPE,
    SUMMARY_TARGET_LABEL,
    type FcltCardCapacity,
    type FcltCardChip,
    type FcltCardClear,
    type FcltCardClearTrack,
    type FcltCardData,
    type FcltCardDiff,
    type FcltCardHourly,
    type FcltCardSnapshot,
    type FcltCardType,
    type FcltCardVariant,
    type GaugeData,
    type FcltQueueLabel,
    type FcltQueueScenarioView,
    type QueueBarDetail,
    type QueueBarView,
    type QueueBasisRow,
    type QueueClearKind,
    type QueueRecommendSummary,
    type QueueTimeAxis,
    type QueueTimePoint,
    type SimulationType,
    type SummaryScopeChip,
    type SummarySlot,
    type SummaryTipRow,
    type TableRow,
    type TerminalView,
} from './types';

interface TerminalViewInput {
    hhmm: string;
    category: DsbdCategory;
    smry: TmnlSmryDto;
    rsltList: DsbdRsltDto[];
    chknCards: DsbdFcltCardDto[];
    dptgtCards: DsbdFcltCardDto[];
    nextChknCards?: DsbdFcltCardDto[];
    nextDptgtCards?: DsbdFcltCardDto[];
}

interface HourlyScale {
    max: number;
    arrivalAvg: number | null;
    processAvg: number | null;
}

// 칩 팔레트가 3색이라 여유/보통은 같은 초록을 쓴다
const CONGESTION_CHIP_CLASS: Record<CongestionStatus, string> = {
    FREE: 'b',
    NORMAL: 'g',
    BUSY: 'o',
    VERY_BUSY: 'r',
};

const CONGESTION_STATUS_LABEL: Record<CongestionStatus, string> = {
    FREE: '여유',
    NORMAL: '보통',
    BUSY: '혼잡',
    VERY_BUSY: '매우혼잡',
};

const FCLT_CARD_TITLE: Record<FcltCardType, string> = {
    CHKN: '체크인카운터',
    DEP: '출국장',
};

const SUMMARY_SCOPE_LABEL: Record<FcltCardType, string> = {
    CHKN: '체크인',
    DEP: '출국장',
};

const FCLT_CARD_UNIT_NOUN: Record<FcltCardType, string> = {
    CHKN: '부스',
    DEP: '검색대',
};

// 출국장 카드의 처리 · 해소 · 추천은 보안검색대 큐 값이며, 상단 대기는 출국장 값이다
const FCLT_CARD_GAUGE_LABEL = {
    clear: '혼잡해소 예상',
    noCongestion: '혼잡요소 없음',
};

const WTNG_WINDOW_MIN = 10;
const MIN_PER_DAY = 24 * 60;
const CLEAR_TARGET_MIN = 30;
const CLEAR_AXIS_MIN = 60;

const QUEUE_BAR_MAX = 15;
const QUEUE_BAR_PAD = 3;
const QUEUE_BAR_MIN_HEIGHT = 0.02;
const QUEUE_AXIS_MIN = 120;
const QUEUE_AXIS_TARGET_RATIO = 1.25;
const QUEUE_VALUE_MAX_MIN = 999;

const QUEUE_DATA_SRC_LABEL: Record<QueueDataSrc, string> = {
    CAST: 'CAST 예측',
    XOVIS: 'Xovis 실적',
};

const QUEUE_METHOD_LABEL: Record<QueueCalcMethod, string> = {
    DIRECT: '직접 계산',
    EXTERNAL_INPUT: '외부 입력',
    SERVICE_TIME: '처리시간 역수',
    LITTLE_LAW: "Little's Law 추정",
    SERVICE_CAPACITY: '처리능력 모형',
    FLOW_BALANCE: '유입/처리 차이 계산',
    OBSERVED_FLOW: '관측 통과율',
    QUEUE_BALANCE: '인원 보존식 추정',
    ERLANG_C: 'Erlang C',
    NEXT_ARRIVAL_WAIT: '대기 순번 계산',
    PRCS_WAIT_AVG: `직전 ${WTNG_WINDOW_MIN}분 처리 여객 평균`,
    WAIT_AVG_FORECAST: '처리 여객 평균 예측',
    CGN_GRADE: '혼잡등급 기준표',
};

export function toSimulationType(smltType: SmltType): SimulationType {
    return smltType === 'USER' ? 'user' : 'daily';
}

export function toPlanDate(ymd?: string): string {
    return formatYmd(ymd ?? '', '-');
}

export function toCalcDateTime(calcDt?: string): string {
    return formatDateTime(calcDt ?? '');
}

function toWtngMin(card: DsbdFcltCardDto): number | null {
    return card.cgnWtngSec === null ? null : Math.round(card.cgnWtngSec / 60);
}

function toFcltCardDiff(next: number | null, current: number | null): FcltCardDiff | undefined {
    if (next === null || current === null) return undefined;

    const diff = next - current;
    if (diff === 0) return { text: '0', dir: 'flat' };
    return { text: formatDiff(diff), dir: diff > 0 ? 'up' : 'down' };
}

function toFcltCardCapacity(card: DsbdFcltCardDto): FcltCardCapacity {
    const noun = FCLT_CARD_UNIT_NOUN[card.fcltType];
    const { reqCnt } = card.recommend;

    if (reqCnt === null) return { kind: 'unknown', text: `${noun} 산정 불가` };
    if (reqCnt <= card.oprCnt) return { kind: 'enough', text: `${noun} 충분` };
    return { kind: 'short', text: `${noun} ${formatCount(reqCnt - card.oprCnt)}개 부족` };
}

function toActiveAvg(cards: DsbdFcltCardDto[], valueOf: (card: DsbdFcltCardDto) => number | null): number | null {
    const values = cards
        .filter((card) => card.oprCnt > 0)
        .map(valueOf)
        .filter((value): value is number => value !== null && value > 0);

    return values.length < 2 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}

// 유입 · 처리 링이 같은 눈금이어야 한 시설의 두 링 길이를 견줄 수 있다. 서버가 산정 불가 처리인원을 0 으로 내려 0 인 시설은 평균에서 뺀다
function toHourlyScale(cards: DsbdFcltCardDto[]): HourlyScale {
    return {
        max: Math.max(0, ...cards.map((card) => Math.max(card.hrlyArvlPsgCnt ?? 0, card.hrlyPrcsPsgCnt, card.reqHrlyPrcsPsgCnt ?? 0))),
        arrivalAvg: toActiveAvg(cards, (card) => card.hrlyArvlPsgCnt ?? null),
        processAvg: toActiveAvg(cards, (card) => card.hrlyPrcsPsgCnt),
    };
}

function toGaugeData(value: number | null, avg: number | null, max: number): GaugeData {
    return {
        value: value === null || max <= 0 ? 0 : value / max,
        centerText: value === null ? '-' : formatCount(value),
        average: avg === null || max <= 0 ? undefined : { value: avg / max, text: `평균 ${formatCount(Math.round(avg))}` },
    };
}

function toFcltCardHourly(card: DsbdFcltCardDto, scale: HourlyScale): FcltCardHourly {
    const arvlPsgCnt = card.hrlyArvlPsgCnt ?? null;

    return {
        arrival: toGaugeData(arvlPsgCnt, scale.arrivalAvg, scale.max),
        process: toGaugeData(card.hrlyPrcsPsgCnt, scale.processAvg, scale.max),
        recommendProcess: toGaugeData(card.reqHrlyPrcsPsgCnt ?? null, null, scale.max),
    };
}

function toMinuteOfDay(hhmm: string): number {
    return Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(2, 4));
}

// 해소 시각은 HHmm 이라 자정을 넘기면 평가시각보다 작다
function toClearMin(clearTime: string, hhmm: string): number | null {
    if (!clearTime) return null;

    return (toMinuteOfDay(clearTime) - toMinuteOfDay(hhmm) + MIN_PER_DAY) % MIN_PER_DAY;
}

function toClearTrack(clearMin: number | null, unreachable: boolean): FcltCardClearTrack {
    if (clearMin === null) return { kind: unreachable ? 'unreachable' : 'unknown', pos: unreachable ? 1 : 0 };
    if (clearMin === 0) return { kind: 'done', pos: 0 };
    if (clearMin > CLEAR_AXIS_MIN) return { kind: 'beyond', pos: 1 };

    return { kind: clearMin <= CLEAR_TARGET_MIN ? 'inTarget' : 'overTarget', pos: clearMin / CLEAR_AXIS_MIN };
}

function toClearSaving(currentMin: number | null, recommendMin: number | null, currentUnreachable: boolean): string | undefined {
    if (recommendMin === null) return undefined;
    if (currentUnreachable) return '해소 가능';
    if (currentMin === null || recommendMin >= currentMin) return undefined;

    return `${formatCount(currentMin - recommendMin)}분 단축`;
}

// 운영 수량 해소값이 없는데 추천은 나왔다면 원천은 있다는 뜻이라 하루 안에 해소되지 않는 경우다
function toFcltCardClear(card: DsbdFcltCardDto, hhmm: string): FcltCardClear {
    const targetPos = CLEAR_TARGET_MIN / CLEAR_AXIS_MIN;

    if (card.cgnClearRate === 100) {
        const done = toClearTrack(0, false);
        return { label: FCLT_CARD_GAUGE_LABEL.noCongestion, current: '없음', recommend: '없음', currentTrack: done, recommendTrack: done, targetPos };
    }

    const oprClearMin = card.oprCgnClearMin ?? null;
    const currentUnreachable = oprClearMin === null && card.recommend.reqCnt !== null;
    const current = oprClearMin === 0 ? '없음' : oprClearMin !== null ? formatHhmm(card.oprCgnClearTime) : currentUnreachable ? '해소 불가' : '-';
    // 단축 분이 표시 시각의 차와 같도록 두 값 모두 HHmm 에서 구한다
    const currentMin = oprClearMin === 0 ? 0 : oprClearMin === null ? null : toClearMin(card.oprCgnClearTime, hhmm);
    const recommendMin = toClearMin(card.cgnClearTime, hhmm);

    return {
        label: FCLT_CARD_GAUGE_LABEL.clear,
        current,
        recommend: formatHhmm(card.cgnClearTime) || '-',
        currentTrack: toClearTrack(currentMin, currentUnreachable),
        recommendTrack: toClearTrack(recommendMin, false),
        targetPos,
        saving: toClearSaving(currentMin, recommendMin, currentUnreachable),
    };
}

function toFcltCardSnapshot(card: DsbdFcltCardDto, hhmm: string, scale: HourlyScale): FcltCardSnapshot {
    const wtngMin = toWtngMin(card);

    return {
        hhmm,
        congestion: card.cgnStatus === null ? '-' : CONGESTION_STATUS_LABEL[card.cgnStatus],
        congestionKind: card.cgnStatus === null ? 'gray' : CONGESTION_CHIP_CLASS[card.cgnStatus],
        waitingCount: formatCount(card.wtngPsgCnt),
        waitingTime: wtngMin === null ? '-' : formatCount(wtngMin),
        operatingCount: formatCount(card.oprCnt),
        capacity: toFcltCardCapacity(card),
        hourly: toFcltCardHourly(card, scale),
        clear: toFcltCardClear(card, hhmm),
        recommend: {
            tag: '추천',
            name: card.recommend.targetNm,
            count: card.recommend.reqCnt === null ? '-' : String(card.recommend.reqCnt),
            countNote: card.recommend.needAssignYn === 'Y' ? '배정 필요' : '운영',
            countNoteAccent: card.recommend.needAssignYn === 'N',
        },
    };
}

function toFcltCardVariant(
    card: DsbdFcltCardDto,
    current: DsbdFcltCardDto | undefined,
    next: DsbdFcltCardDto | undefined,
    hhmm: string,
    scale: HourlyScale,
    nextScale: HourlyScale,
): FcltCardVariant {
    const isCheckin = card.fcltType === 'CHKN';

    return {
        unitCd: isCheckin ? card.island : card.dptgtNo,
        num: card.fcltNm,
        totalCount: formatCount(card.totCnt),
        current: current ? toFcltCardSnapshot(current, hhmm, scale) : null,
        next: next ? toFcltCardNextSnapshot(next, current, hhmm, nextScale) : null,
    };
}

// 표시값과 증감이 어긋나지 않도록 대기시간은 반올림한 분끼리 뺀다
function toFcltCardNextSnapshot(next: DsbdFcltCardDto, current: DsbdFcltCardDto | undefined, hhmm: string, scale: HourlyScale): FcltCardSnapshot {
    const snapshot = toFcltCardSnapshot(next, stepHhmm(hhmm, 6), scale);
    if (!current) return snapshot;

    return {
        ...snapshot,
        waitingCountDiff: toFcltCardDiff(next.wtngPsgCnt, current.wtngPsgCnt),
        waitingTimeDiff: toFcltCardDiff(toWtngMin(next), toWtngMin(current)),
    };
}

// 미운영 칩은 혼잡도와 무관하게 회색으로 눕힌다. 혼잡도를 산정할 수 없는 칩도 등급 색 대신 회색이다.
function toFcltCardChip(unit: FcltUnitDto): FcltCardChip {
    return {
        label: unit.unitCd,
        kind: unit.useYn === 'N' || unit.cgnStatus === null ? 'gray' : CONGESTION_CHIP_CLASS[unit.cgnStatus],
    };
}

// 카드 순서는 서버가 평균 대기시간이 긴 시설부터 정한다 — 첫 카드가 처음 보이는 시설이다
function toFcltCardData(fcltType: FcltCardType, cards: DsbdFcltCardDto[], nextCards: DsbdFcltCardDto[], tmnlId: TmnlId, hhmm: string): FcltCardData {
    const unitPattern = fcltType === 'CHKN' ? /^[A-N]$/ : tmnlId === 'T1' ? /^[1-6]$/ : /^[12]$/;
    const unitOf = (card: DsbdFcltCardDto) => (fcltType === 'CHKN' ? card.island : card.dptgtNo);
    const currentByUnit = new Map(cards.map((card) => [unitOf(card), card]));
    const nextByUnit = new Map((stepHhmm(hhmm, 6) ? nextCards : []).map((card) => [unitOf(card), card]));
    const visibleCards = [...cards, ...[...nextByUnit.values()].filter((card) => !currentByUnit.has(unitOf(card)))].filter((card) =>
        unitPattern.test(unitOf(card)),
    );
    const scale = toHourlyScale(cards.filter((card) => unitPattern.test(unitOf(card))));
    const nextScale = toHourlyScale([...nextByUnit.values()].filter((card) => unitPattern.test(unitOf(card))));
    // 요약정보 전체 대기인원(아일랜드 · 출국장)과 같은 시설 범위여야 해서 칩 패턴으로 거르지 않는다
    const totalWaitingCount = cards.length ? formatCount(cards.reduce((sum, card) => sum + card.wtngPsgCnt, 0)) : '-';

    return {
        fcltType,
        title: FCLT_CARD_TITLE[fcltType],
        currentTime: formatHhmm(hhmm),
        totalWaitingCount,
        variants: visibleCards.map((card) => toFcltCardVariant(card, currentByUnit.get(unitOf(card)), nextByUnit.get(unitOf(card)), hhmm, scale, nextScale)),
        chips: (cards[0]?.unitList ?? nextCards[0]?.unitList ?? [])
            .filter((unit) => unitPattern.test(unit.unitCd))
            .sort((a, b) => b.unitCd.localeCompare(a.unitCd, undefined, { numeric: true }))
            .map((unit) => toFcltCardChip(cards.length ? unit : { ...unit, cgnStatus: null })),
    };
}

function toTableRow(rslt: DsbdRsltDto, totalCount: number): TableRow {
    return {
        time: formatHhmm(rslt.time),
        pax: formatCount(rslt.psgCnt),
        arrivalPax: rslt.arvlPsgCnt == null ? '-' : formatCount(rslt.arvlPsgCnt),
        processedPax: formatCount(rslt.prcsPsgCnt),
        wait: formatMinutes(rslt.wtngHr),
        process: formatMinutes(rslt.prcsHr),
        timeShare: (totalCount > 0 ? (rslt.psgCnt / totalCount) * 100 : 0).toFixed(1),
        waitingPax: formatCount(rslt.fcstWtngPsgCnt),
    };
}

export function toPrimeTime(rsltLists: DsbdRsltDto[][], category: DsbdCategory): string {
    const totals = new Map<string, number>();

    for (const rsltList of rsltLists) {
        for (const rslt of rsltList) {
            const count = category === 'FLT' ? rslt.fltCnt : rslt.fcstWtngPsgCnt;

            if (!/^([01]\d|2[0-3])[0-5]\d$/.test(rslt.time) || !Number.isFinite(count)) continue;

            totals.set(rslt.time, (totals.get(rslt.time) ?? 0) + count);
        }
    }

    let peakTime = '';
    let peakCount = -Infinity;

    for (const [time, count] of totals) {
        if (count > peakCount || (count === peakCount && time < peakTime)) {
            peakTime = time;
            peakCount = count;
        }
    }

    return peakTime;
}

function toSummarySlots(hhmm: string, smry: TmnlSmryDto): SummarySlot[] {
    const baseMin = Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(2, 4));

    return [0, 1, 2].map((offset) => {
        const bgnMin = baseMin + offset * 60;
        const bgnHhmm = `${pad2(Math.floor(bgnMin / 60))}${pad2(bgnMin % 60)}`;
        const endMin = Math.min(bgnMin + smry.intrvlMin, MIN_PER_DAY);
        const slot =
            smry.intrvlList?.find((item) => item.bgnHhmm === bgnHhmm) ??
            (offset === 0
                ? {
                      bgnHhmm,
                      endHhmm: `${pad2(Math.floor(endMin / 60))}${pad2(endMin % 60)}`,
                      fltCnt: smry.intrvlFltCnt,
                      psgCnt: smry.intrvlPsgCnt,
                      yesterdayFltDiffCnt: smry.intrvlYesterdayFltDiffCnt,
                      yesterdayPsgDiffCnt: smry.intrvlYesterdayPsgDiffCnt,
                  }
                : undefined);
        const clock = `${pad2(Math.floor(bgnMin / 60) % 24)}:${pad2(bgnMin % 60)}`;

        return {
            label: offset === 0 ? '현재' : `+${offset}시간`,
            time: offset === 0 ? '' : bgnMin >= MIN_PER_DAY ? `다음 날 ${clock}` : clock,
            range: slot ? `${formatHhmm(slot.bgnHhmm)}~${formatHhmm(slot.endHhmm)}` : '조회일 범위 밖',
            stats: [
                {
                    icon: 'plane',
                    iconClass: 'i-blue i-32',
                    value: slot ? formatCount(slot.fltCnt) : '-',
                    unit: '편',
                },
                {
                    icon: 'people',
                    iconClass: 'i-teal i-32',
                    value: slot ? formatCount(slot.psgCnt) : '-',
                    unit: '명',
                },
            ],
        };
    });
}

function toSummaryScope(category: DsbdCategory): SummaryScopeChip[] {
    return (['CHKN', 'DEP'] as const).map((fcltType) => ({
        label: SUMMARY_SCOPE_LABEL[fcltType],
        active: SUMMARY_SCOPE[category].includes(fcltType),
    }));
}

function toSummaryTip(hhmm: string, smry: TmnlSmryDto): SummaryTipRow[] {
    const baseMin = Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(2, 4));
    const toClock = (min: number) => `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;
    const intvBgnMin = (baseMin - WTNG_WINDOW_MIN + MIN_PER_DAY) % MIN_PER_DAY;
    const hourlyEndMin = Math.min(baseMin + SMRY_INTRVL_MIN, MIN_PER_DAY);

    return toDsbdSummaryTip(smry, {
        snapshot: `${toClock(baseMin)} 기준`,
        intv: `${toClock(intvBgnMin)}~${toClock(baseMin)}`,
        hourly: `${toClock(baseMin)}~${toClock(hourlyEndMin)}`,
    });
}

export function toTerminalView({
    hhmm,
    category,
    smry,
    rsltList,
    chknCards,
    dptgtCards,
    nextChknCards = [],
    nextDptgtCards = [],
}: TerminalViewInput): TerminalView {
    // 시간대별 결과는 정시(HH00) 단위라 조회 시각과 같은 '시'를 찾는다.
    const currentIndex = rsltList.findIndex((rslt) => rslt.time.slice(0, 2) === hhmm.slice(0, 2));
    const totalCount = rsltList.reduce((total, rslt) => total + rslt.psgCnt, 0);
    const ampm = Number(hhmm.slice(0, 2)) < 12 ? 'AM' : 'PM';

    return {
        barText: `${formatHhmm(hhmm)} ${ampm}`,
        cgnStatus: smry.cgnStatus,
        stats: {
            flights: { delta: formatDiff(smry.fltDiffCnt), value: formatCount(smry.fltCnt) },
            pax: { delta: formatDiff(smry.psgDiffCnt), value: formatCount(smry.psgCnt) },
            boardingRate: String(smry.brdgRate),
        },
        peak: {
            ampm: smry.peak.ampm,
            time: formatHhmm(smry.peak.peakTime),
            totalWait: formatCount(smry.peak.wtngPsgCnt),
            avgWait: String(smry.peak.avgWtngHr),
            process: formatCount(smry.peak.prcsPsgCnt),
        },
        summaryStats: toSummarySlots(hhmm, smry),
        summaryTarget: SUMMARY_TARGET_LABEL[category],
        summaryScope: toSummaryScope(category),
        summaryInfo: toDsbdSummaryInfo(smry),
        summaryTip: toSummaryTip(hhmm, smry),
        fcltCards: [toFcltCardData('CHKN', chknCards, nextChknCards, smry.tmnlId, hhmm), toFcltCardData('DEP', dptgtCards, nextDptgtCards, smry.tmnlId, hhmm)],
        chart: { rsltList },
        tableRows: rsltList.map((rslt) => toTableRow(rslt, totalCount)),
        defaultSelectedRow: Math.max(0, currentIndex),
    };
}

/* ================= 혼잡해소 시나리오 팝업 ================= */

function formatDtClock(dt: string): string {
    return formatHhmm(dt.slice(8, 12));
}

function formatDtFull(dt: string): string {
    return dt.length === 14 ? `${formatYmd(dt.slice(0, 8), '-')} ${formatDtClock(dt)}` : '-';
}

// 자정을 넘긴 해소 시각이 같은 날 이른 시각처럼 읽히지 않게 날짜 차이를 붙인다
function toClockText(dt: string, baseDt: string): string {
    if (dt.length !== 14) return '—';

    const dayDiff = Math.round(
        (Date.UTC(+dt.slice(0, 4), +dt.slice(4, 6) - 1, +dt.slice(6, 8)) - Date.UTC(+baseDt.slice(0, 4), +baseDt.slice(4, 6) - 1, +baseDt.slice(6, 8))) /
            86_400_000,
    );

    if (dayDiff === 0) return formatDtClock(dt);
    if (dayDiff === 1) return `다음 날 ${formatDtClock(dt)}`;

    return `${dt.slice(4, 6)}-${dt.slice(6, 8)} ${formatDtClock(dt)}`;
}

// 15분이 부동소수 오차로 15.0000001분이 되어 16분으로 올라가지 않게 한다
function ceilMinutes(minutes: number): number {
    return Math.ceil(minutes - 1e-9);
}

function formatSeconds(seconds: number): string {
    const rounded = Math.round(seconds);

    if (rounded < 60) return `${rounded}초`;

    const rest = rounded % 60;

    return rest === 0 ? `${rounded / 60}분` : `${Math.floor(rounded / 60)}분 ${rest}초`;
}

function formatPercent(ratio: number): string {
    return `${(ratio * 100).toFixed(1)}%`;
}

export function toSeoulClock(date: Date): string {
    return new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
}

type QueueClearSource = Pick<FcltQueueClearDto, 'cgnClearMin' | 'cgnClearDt' | 'clearMetric'>;

function toNextWtngText(clear: FcltQueueClearDto): string {
    if (clear.nextWtngMetric.status === 'UNREACHABLE') return '대기가 끝나지 않음';
    if (clear.nextWtngSec === null) return '—';
    if (clear.nextWtngSec === 0) return '대기 없음';

    return `약 ${formatSeconds(clear.nextWtngSec)} 대기`;
}

/** 해소 목표 문구 (예: 평균 대기 40분 미만) — 표시만 반올림하고 판정은 서버 원값으로 끝난다 */
function toTargetShort(normalUpperExclusiveSec: number): string {
    return `평균 대기 ${formatSeconds(normalUpperExclusiveSec)} 미만`;
}

function toErlangText(clear: FcltQueueClearDto): string {
    if (clear.wtngProb === null || clear.loadRatio === null || clear.thryWtngSec === null) return `— (${clear.erlangMetric.reason})`;

    return `대기확률 ${formatPercent(clear.wtngProb)} / 이론 평균 대기 ${formatSeconds(clear.thryWtngSec)} / 부하율 ρ ${formatPercent(clear.loadRatio)}`;
}

function toQueueClearKind(clear: QueueClearSource): QueueClearKind {
    if (clear.clearMetric.status === 'UNREACHABLE') return 'unreachable';
    if (clear.cgnClearMin === null) return 'unavailable';

    return clear.cgnClearMin === 0 ? 'none' : 'value';
}

function toClearValueText(kind: QueueClearKind, minutes: number | null): string {
    if (kind === 'unreachable') return '불가';
    if (minutes === null) return '—';

    return minutes > QUEUE_VALUE_MAX_MIN ? `${QUEUE_VALUE_MAX_MIN}분+` : `${formatCount(minutes)}분`;
}

function toQueueBar(cnt: number, clear: QueueClearSource, baseDt: string, goalMet: boolean, timeline: QueueTimePoint[]): QueueBarView {
    const kind = toQueueClearKind(clear);
    const minutes = kind === 'value' ? ceilMinutes(clear.cgnClearMin ?? 0) : kind === 'none' ? 0 : null;

    return {
        cnt,
        kind,
        minutes,
        valueText: toClearValueText(kind, minutes),
        clockText: kind === 'value' ? toClockText(clear.cgnClearDt, baseDt) : '',
        height: 0,
        goalMet,
        isCurrent: false,
        isRecommend: false,
        reason: clear.clearMetric.reason,
        timeline,
    };
}

function toMinutesFrom(dt: string, baseDt: string): number {
    const toUtc = (value: string) => Date.UTC(+value.slice(0, 4), +value.slice(4, 6) - 1, +value.slice(6, 8), +value.slice(8, 10), +value.slice(10, 12));

    return Math.round((toUtc(dt) - toUtc(baseDt)) / 60_000);
}

// 유입은 [시각−10분, 시각) 구간이라 그 구간 끝 시각에 붙인다
function toQueueTimeline(item: FcltQueueCntClearDto, arvlList: FcltQueueArvlDto[], baseDt: string): QueueTimePoint[] {
    const arvlByDt = new Map(arvlList.map((arvl) => [arvl.secEndDt, arvl.arvlPsgCnt]));

    return item.fcstList.map((point) => ({
        minute: toMinutesFrom(point.fcstDt, baseDt),
        clockText: toClockText(point.fcstDt, baseDt),
        arvlPsgCnt: arvlByDt.get(point.fcstDt) ?? null,
        waitMin: point.fcstWtngSec === null ? null : point.fcstWtngSec / 60,
        queuePsgCnt: point.wtngPsgCnt,
    }));
}

function toQueueTimeAxis(dto: FcltQueueScenarioDto, targetMin: number): QueueTimeAxis | null {
    if (dto.clearJudgeMin === null) return null;

    const baseMinute = toMinuteOfDay(dto.baseDt.slice(8, 12));
    const clockAt = (minute: number) => {
        const minuteOfDay = (baseMinute + minute) % MIN_PER_DAY;

        return formatHhmm(`${pad2(Math.floor(minuteOfDay / 60))}${pad2(minuteOfDay % 60)}`);
    };

    return {
        judgeMin: dto.clearJudgeMin,
        thresholdMin: dto.normalUpperExclusiveSec / 60,
        targetMin,
        targetClockText: clockAt(targetMin),
        rangeText: `${clockAt(0)} ~ ${clockAt(dto.clearJudgeMin)}`,
        arvlProfiled: dto.arvlProfileYn === 'Y',
    };
}

// 막대가 너무 많으면 현재 · 추천 수량 주변만 보여준다
function toVisibleBars(bars: QueueBarView[], anchors: number[]): QueueBarView[] {
    if (bars.length <= QUEUE_BAR_MAX) return bars;

    const first = bars[0].cnt;
    const last = bars[bars.length - 1].cnt;
    const inRange = anchors.filter((cnt) => cnt >= first && cnt <= last);
    const low = inRange.length > 0 ? Math.min(...inRange) : last;
    const high = inRange.length > 0 ? Math.max(...inRange) : last;
    const hi = Math.min(last, Math.max(high + QUEUE_BAR_PAD, low - QUEUE_BAR_PAD + QUEUE_BAR_MAX - 1));
    const lo = Math.max(first, Math.min(low - QUEUE_BAR_PAD, hi - QUEUE_BAR_MAX + 1));

    return bars.filter((bar) => bar.cnt >= lo && bar.cnt <= hi);
}

// 아주 긴 해소시간 하나가 축을 늘려 목표선 근처 막대가 납작해지지 않게 축 상한을 묶는다
function toScaledBars(bars: QueueBarView[], targetMin: number): { bars: QueueBarView[]; targetHeight: number } {
    const floor = targetMin * QUEUE_AXIS_TARGET_RATIO;
    const finite = bars.flatMap((bar) => (bar.minutes === null ? [] : [bar.minutes]));
    const axisMax = Math.min(Math.max(floor, ...finite), Math.max(QUEUE_AXIS_MIN, floor));

    return {
        bars: bars.map((bar) => ({
            ...bar,
            height: bar.kind === 'unreachable' ? 1 : bar.minutes === null ? 0 : Math.max(QUEUE_BAR_MIN_HEIGHT, Math.min(1, bar.minutes / axisMax)),
        })),
        targetHeight: Math.min(1, targetMin / axisMax),
    };
}

function toQueueRecommendSummary(dto: FcltQueueScenarioDto, recommend: FcltQueueRecommendDto | null): QueueRecommendSummary {
    if (!recommend || recommend.reqCnt === null) {
        return {
            reqCnt: null,
            mainText: recommend?.reqMetric.status === 'UNREACHABLE' ? '목표 달성 불가' : '산정 불가',
            subText: recommend?.reqMetric.reason ?? '',
            short: true,
        };
    }

    const { reqCnt, extraCnt, reduceCnt } = recommend;
    const mainText = `${formatCount(reqCnt)}개`;

    if (recommend.capaAvlYn === 'N') {
        return { reqCnt, mainText, subText: `보유 ${formatCount(dto.totCnt ?? 0)}개 초과 — 보유 수량으로 목표 달성 불가`, short: true };
    }

    const subList: string[] = [];

    if (extraCnt !== null && extraCnt > 0) subList.push(`지금보다 +${formatCount(extraCnt)}개`);
    else if (reduceCnt !== null && reduceCnt > 0) subList.push(`지금보다 ${formatCount(reduceCnt)}개 적어도 충분`);
    else if (extraCnt !== null) subList.push('지금 수량으로 충분');

    if (recommend.capaAvlYn === null) subList.push('보유 수량 미확인');

    return { reqCnt, mainText, subText: subList.join(' · '), short: false };
}

function toWtngAvgText(dto: FcltQueueScenarioDto): string {
    if (dto.wtngAvgSec === null) return `— (${dto.wtngAvgMetric.reason})`;

    const grade = dto.cgnStatus === null ? '등급 산정 불가' : CONGESTION_STATUS_LABEL[dto.cgnStatus];

    return `${formatSeconds(dto.wtngAvgSec)} / 처리 ${formatCount(dto.wtngAvgPrcsPsgCnt ?? 0)}명 가중평균 / ${grade}`;
}

function toQueueBasis(dto: FcltQueueScenarioDto, label: FcltQueueLabel): QueueBasisRow[] {
    const rows: QueueBasisRow[] = [
        { term: '계산 기준 시각', value: formatDtFull(dto.baseDt) },
        { term: '해소 기준', value: `직전 ${WTNG_WINDOW_MIN}분 처리 여객 ${toTargetShort(dto.normalUpperExclusiveSec)} (혼잡등급 NORMAL 상한)` },
        { term: '관측구간', value: `${formatDtClock(dto.obsBgnDt)} ~ ${toClockText(dto.obsEndDt, dto.obsBgnDt)} / ${QUEUE_DATA_SRC_LABEL[dto.dataSrc]}` },
        { term: '현재 평균대기', value: toWtngAvgText(dto) },
        {
            term: '유입률 λ',
            value: dto.arvlRate === null ? `— (${dto.arvlMetric.reason})` : `${dto.arvlRate.toFixed(1)}명/분 / ${QUEUE_METHOD_LABEL[dto.arvlMetric.method]}`,
        },
        { term: '처리율 μ', value: dto.srvcRate === null ? `— (${dto.srvcMetric.reason})` : `${label.resource} 1개당 ${dto.srvcRate.toFixed(2)}명/분` },
        { term: '새로 줄 서면', value: toNextWtngText(dto.current) },
        { term: `정상상태 / 현재 ${dto.oprFcltCnt ?? '-'}개`, value: toErlangText(dto.current) },
    ];

    if (dto.scenario) rows.push({ term: `정상상태 / 추천 ${dto.scenario.fcltCnt ?? '-'}개`, value: toErlangText(dto.scenario) });
    if (dto.totCnt === null) rows.push({ term: '보유 수량', value: dto.totCntRsn || '배정 가능한 최대 수량 미확인' });

    return rows;
}

export function toFcltQueueScenarioView(dto: FcltQueueScenarioDto): FcltQueueScenarioView {
    const label = FCLT_QUEUE_LABEL[dto.fcltType];
    const targetMin = dto.recommend?.targetMin ?? dto.dfltTargetMin;
    const reqCnt = dto.recommend?.reqCnt ?? null;
    const currentCnt = dto.oprFcltCnt;
    const allBars = dto.cntClearList.map((item) => ({
        ...toQueueBar(item.fcltCnt, item, dto.baseDt, item.goalMetYn === 'Y', toQueueTimeline(item, dto.arvlList, dto.baseDt)),
        isCurrent: item.fcltCnt === currentCnt,
        isRecommend: item.fcltCnt === reqCnt,
    }));
    const anchors = [currentCnt, reqCnt].filter((cnt): cnt is number => cnt !== null);
    const { bars, targetHeight } = toScaledBars(toVisibleBars(allBars, anchors), targetMin);

    return {
        label,
        tmnlId: dto.tmnlId,
        fcltNm: dto.fcltNm,
        targetShort: toTargetShort(dto.normalUpperExclusiveSec),
        targetMin,
        targetRange: { min: dto.minTargetMin, max: dto.maxTargetMin },
        currentCnt,
        current: toQueueBar(currentCnt ?? 0, dto.current, dto.baseDt, false, allBars.find((bar) => bar.isCurrent)?.timeline ?? []),
        calm: dto.current.cgnClearMin === 0,
        bars,
        targetHeight,
        axisText: `${label.resource} 수 (개) · ${dto.totCnt === null ? '보유 수량 미확인' : `보유 ${formatCount(dto.totCnt)}개`}`,
        timeAxis: toQueueTimeAxis(dto, targetMin),
        recommend: toQueueRecommendSummary(dto, dto.recommend),
        basis: toQueueBasis(dto, label),
    };
}

function toUnreachableText(view: FcltQueueScenarioView, bar: QueueBarView): string {
    const first = bar.timeline[0];
    const last = bar.timeline[bar.timeline.length - 1];

    if (!view.timeAxis || !first || !last) return bar.reason;

    const firstCnt = Math.round(first.queuePsgCnt);
    const lastCnt = Math.round(last.queuePsgCnt);

    if (lastCnt > firstCnt) return `${last.clockText}까지 대기 ${formatCount(firstCnt)}명 → ${formatCount(lastCnt)}명으로 줄이 늘어요`;

    return `${view.timeAxis.rangeText} 동안 기준 아래로 내려가 유지되지 않아요`;
}

function toQueueBarDetailSub(view: FcltQueueScenarioView, bar: QueueBarView): string {
    if (bar.kind === 'unavailable') return bar.reason;
    if (bar.kind === 'unreachable') return toUnreachableText(view, bar);
    if (bar.cnt === view.currentCnt) return '현재 운영 수량';

    const { current } = view;

    if (current.kind === 'unreachable') return '지금은 해소 불가 → 해소 가능';
    if (current.minutes === null || bar.minutes === null) return '';

    const diff = current.minutes - bar.minutes;

    if (diff > 0) return `지금보다 ${formatCount(diff)}분 빨라요`;
    if (diff < 0) return `지금보다 ${formatCount(-diff)}분 늦어요`;

    return '지금과 같아요';
}

export function toQueueBarDetail(view: FcltQueueScenarioView, bar: QueueBarView): QueueBarDetail {
    let mainText = '산정 불가';

    if (bar.kind === 'value') mainText = `${bar.valueText} 후 해소 · ${bar.clockText}`;
    else if (bar.kind === 'none') mainText = '이미 해소 상태';
    else if (bar.kind === 'unreachable') mainText = '해소 불가';

    return {
        title: `${formatCount(bar.cnt)}개 운영 시`,
        mainText,
        subText: toQueueBarDetailSub(view, bar),
        goalMet: bar.goalMet,
    };
}

export const EMPTY_FCLT_CARD_VARIANT: FcltCardVariant = {
    unitCd: '',
    num: '-',
    totalCount: '-',
    current: null,
    next: null,
};

export const EMPTY_TERMINAL_VIEW: TerminalView = {
    barText: '-',
    cgnStatus: null,
    stats: {
        flights: { delta: '-', value: '-' },
        pax: { delta: '-', value: '-' },
        boardingRate: '-',
    },
    peak: { ampm: '', time: '-', totalWait: '-', avgWait: '-', process: '-' },
    summaryStats: [],
    summaryTarget: '',
    summaryScope: [],
    summaryInfo: [],
    summaryTip: [],
    fcltCards: [toFcltCardData('CHKN', [], [], 'T1', ''), toFcltCardData('DEP', [], [], 'T1', '')],
    chart: { rsltList: [] },
    tableRows: [],
    defaultSelectedRow: 0,
};
