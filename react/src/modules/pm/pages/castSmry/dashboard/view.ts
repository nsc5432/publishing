import type {
    CongestionStatus,
    DsbdCategory,
    DsbdFcltCardDto,
    DsbdRsltDto,
    FcltQueueClearDto,
    FcltQueueRecommendDto,
    FcltQueueScenarioDto,
    FcltUnitDto,
    QueueCalcMethod,
    QueueDataSrc,
    SmltType,
    TmnlId,
    TmnlSmryDto,
} from '@/types/api.types';
import {
    dowLabel,
    formatCount,
    formatDateTime,
    formatDiff,
    formatHhmm,
    formatMinutes,
    formatYmd,
    pad2,
} from '@/lib/format';
import {
    FCLT_QUEUE_LABEL,
    type FcltCardChip,
    type FcltCardData,
    type FcltCardType,
    type FcltCardVariant,
    type FcltQueueContextView,
    type FcltQueueResultView,
    type QueueClearView,
    type QueueErlangView,
    type QueueFcstView,
    type QueueRecommendView,
    type SimulationType,
    type TableRow,
    type TerminalView,
} from './types';

interface TerminalViewInput {
    ymd: string;
    hhmm: string;
    smry: TmnlSmryDto;
    rsltList: DsbdRsltDto[];
    chknCards: DsbdFcltCardDto[];
    dptgtCards: DsbdFcltCardDto[];
}

// 칩 팔레트가 3색이라 여유/보통은 같은 초록을 쓴다
const CONGESTION_CHIP_CLASS: Record<CongestionStatus, string> = {
    FREE: 'g',
    NORMAL: 'g',
    BUSY: 'o',
    VERY_BUSY: 'r',
};

const BUSY_STATUS: CongestionStatus[] = ['BUSY', 'VERY_BUSY'];

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
    PRCS_WAIT_AVG: '직전 30분 처리 여객 평균',
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

function toFcltCardVariant(card: DsbdFcltCardDto): FcltCardVariant {
    const isCheckin = card.fcltType === 'CHKN';

    return {
        unitCd: isCheckin ? card.island : card.dptgtNo,
        island: isCheckin ? '아일랜드' : undefined,
        num: card.fcltNm,
        meta: isCheckin
            ? [
                  { label: '전체', value: formatCount(card.totCnt) },
                  { label: '운영', value: formatCount(card.oprCnt), accent: true },
                  { label: '대기열', value: formatCount(card.wtngPsgCnt) },
              ]
            : [{ label: '예상인원', value: formatCount(card.wtngPsgCnt) }],
        processRate: {
            value: card.hrlyPrcsRate / 100,
            centerText: pad2(card.hrlyPrcsPsgCnt),
            captionText: 'Pax/Hour',
        },
        clearTime: {
            value: card.cgnClearRate / 100,
            centerText: formatHhmm(card.cgnClearTime) || '-',
            captionText: '이후',
        },
        recommend: {
            tag: '추천',
            name: card.recommend.targetNm,
            count: card.recommend.reqCnt === null ? '-' : String(card.recommend.reqCnt),
            countNote: card.recommend.needAssignYn === 'Y' ? '배정 필요' : '소요',
            countNoteAccent: card.recommend.needAssignYn === 'N',
        },
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
function toFcltCardData(fcltType: FcltCardType, cards: DsbdFcltCardDto[], tmnlId: TmnlId): FcltCardData {
    const unitPattern = fcltType === 'CHKN' ? /^[A-N]$/ : tmnlId === 'T1' ? /^[1-6]$/ : /^[12]$/;
    const visibleCards = cards.filter((card) =>
        unitPattern.test(fcltType === 'CHKN' ? card.island : card.dptgtNo),
    );
    const busyCount = visibleCards.filter(
        (card) => card.cgnStatus !== null && BUSY_STATUS.includes(card.cgnStatus),
    ).length;

    return {
        fcltType,
        title: FCLT_CARD_TITLE[fcltType],
        warn: busyCount > 0 ? `혼잡 ${busyCount}개` : '원활',
        variants: visibleCards.map(toFcltCardVariant),
        chips: (cards[0]?.unitList ?? [])
            .filter((unit) => unitPattern.test(unit.unitCd))
            .map(toFcltCardChip),
    };
}

function toTableRow(rslt: DsbdRsltDto, totalCount: number): TableRow {
    return {
        time: formatHhmm(rslt.time),
        pax: formatCount(rslt.psgCnt),
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
            const count =
                category === 'PSG' || category === 'FLT' ? rslt.psgCnt : rslt.fcstWtngPsgCnt;

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

export function toTerminalView({ ymd, hhmm, smry, rsltList, chknCards, dptgtCards }: TerminalViewInput): TerminalView {
    // 시간대별 결과는 정시(HH00) 단위라 조회 시각과 같은 '시'를 찾는다.
    const currentIndex = rsltList.findIndex((rslt) => rslt.time.slice(0, 2) === hhmm.slice(0, 2));
    const totalCount = rsltList.reduce((total, rslt) => total + rslt.psgCnt, 0);
    const ampm = Number(hhmm.slice(0, 2)) < 12 ? 'AM' : 'PM';

    return {
        barText: `${formatYmd(ymd, '-')} ${dowLabel(ymd)} ${formatHhmm(hhmm)} ${ampm}`,
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
            maxWait: String(smry.peak.maxWtngHr),
            hourlyProcess: formatCount(smry.peak.hrlyPrcsPsgCnt),
        },
        summaryStats: [
            {
                icon: 'plane',
                iconClass: 'i-blue i-32',
                value: formatCount(smry.intrvlFltCnt),
                unit: '편',
                deltaLabel: '전일 대비',
                delta: formatDiff(smry.intrvlYesterdayFltDiffCnt),
            },
            {
                icon: 'people',
                iconClass: 'i-teal i-32',
                value: formatCount(smry.intrvlPsgCnt),
                unit: '명',
                deltaLabel: '전일 대비',
                delta: formatDiff(smry.intrvlYesterdayPsgDiffCnt),
            },
        ],
        summaryInfo: [
            {
                label: '최대\n대기인원',
                value: smry.intrvlMaxWtngPsgCnt == null ? '-' : formatCount(smry.intrvlMaxWtngPsgCnt),
                unit: '명',
            },
            {
                label: '평균\n대기시간',
                value: smry.intrvlAvgWtngSec == null ? '-' : String(Math.round(smry.intrvlAvgWtngSec / 60)),
                unit: '분',
            },
            {
                label: '시간당\n처리인원',
                value: smry.intrvlPrcsPsgCnt == null ? '-' : formatCount(smry.intrvlPrcsPsgCnt),
                unit: '명',
            },
        ],
        fcltCards: [
            toFcltCardData('CHKN', chknCards, smry.tmnlId),
            toFcltCardData('DEP', dptgtCards, smry.tmnlId),
        ],
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

function toNextWtngText(clear: FcltQueueClearDto): string {
    if (clear.nextWtngMetric.status === 'UNREACHABLE') return '새로 줄 서면 대기가 끝나지 않음';
    if (clear.nextWtngSec === null) return '';
    if (clear.nextWtngSec === 0) return '새로 줄 서면 대기 없음';

    return `새로 줄 서면 약 ${formatSeconds(clear.nextWtngSec)} 대기`;
}

// 신규 여객 예상과 다른 지표다 — 그 시각 직전 30분에 처리될 여객의 평균
function toFcstWtngText(clear: FcltQueueClearDto): string {
    if (clear.fcstWtngSec === null) return '';

    return `${formatDtClock(clear.fcstDt)} 예상 평균대기 ${formatSeconds(clear.fcstWtngSec)}`;
}

/** 해소 목표 문구 (예: 평균 대기 40분 미만) — 표시만 반올림하고 판정은 서버 원값으로 끝난다 */
function toTargetShort(normalUpperExclusiveSec: number): string {
    return `평균 대기 ${formatSeconds(normalUpperExclusiveSec)} 미만`;
}

function toQueueFcstView(clear: FcltQueueClearDto, normalUpperExclusiveSec: number): QueueFcstView {
    const sec = clear.fcstWtngSec;

    return {
        sec,
        over: sec === null ? null : sec >= normalUpperExclusiveSec,
        clockText: clear.fcstDt.length === 14 ? formatDtClock(clear.fcstDt) : '—',
        valueText: sec === null ? '—' : formatSeconds(sec),
    };
}

export function toQueueClearView(clear: FcltQueueClearDto, baseDt: string, normalUpperExclusiveSec: number): QueueClearView {
    const { status, reason } = clear.clearMetric;
    const targetShort = toTargetShort(normalUpperExclusiveSec);
    const nextWtngText = toNextWtngText(clear);
    const fcstWtngText = toFcstWtngText(clear);
    const fcst = toQueueFcstView(clear, normalUpperExclusiveSec);

    if (status === 'UNREACHABLE') {
        return {
            kind: 'unreachable',
            minutes: null,
            mainText: '해소 불가',
            unitText: '',
            clockText: '—',
            note: reason,
            nextWtngText,
            fcstWtngText,
            fcst,
        };
    }

    if (clear.cgnClearMin === null) {
        return {
            kind: 'unavailable',
            minutes: null,
            mainText: '—',
            unitText: '',
            clockText: '—',
            note: reason,
            nextWtngText,
            fcstWtngText,
            fcst,
        };
    }

    if (clear.cgnClearMin === 0) {
        return {
            kind: 'none',
            minutes: 0,
            mainText: fcst.valueText,
            unitText: '',
            clockText: formatDtClock(baseDt),
            note: '',
            nextWtngText,
            fcstWtngText,
            fcst,
        };
    }

    const minutes = ceilMinutes(clear.cgnClearMin);

    return {
        kind: 'value',
        minutes,
        mainText: formatCount(minutes),
        unitText: '분 후',
        clockText: toClockText(clear.cgnClearDt, baseDt),
        note: `계산 기준 대비 ${formatCount(minutes)}분 후 ${targetShort}`,
        nextWtngText,
        fcstWtngText,
        fcst,
    };
}

function toQueueErlangView(clear: FcltQueueClearDto): QueueErlangView {
    if (clear.wtngProb === null || clear.loadRatio === null || clear.thryWtngSec === null) {
        return { wtngProb: '—', thryWtng: '—', load: '—', note: clear.erlangMetric.reason };
    }

    return {
        wtngProb: formatPercent(clear.wtngProb),
        thryWtng: formatSeconds(clear.thryWtngSec),
        load: formatPercent(clear.loadRatio),
        note: '',
    };
}

function toFcstDiffNote(current: QueueFcstView, scenario: QueueFcstView): string {
    if (current.sec === null || scenario.sec === null) return '';

    const diff = Math.round(scenario.sec - current.sec);

    if (diff === 0) return '예상 평균대기 현재 조건과 같음';

    return `예상 평균대기 현재 조건보다 ${formatSeconds(Math.abs(diff))} ${diff < 0 ? '짧음' : '김'}`;
}

function toDiffNote(current: QueueClearView, scenario: QueueClearView): string {
    if (current.kind === 'none' && scenario.kind === 'none') return toFcstDiffNote(current.fcst, scenario.fcst);
    if (scenario.kind === 'unreachable') return '조정 후에도 해소 불가';
    if (current.minutes === null || scenario.minutes === null) {
        return current.kind === 'unreachable' && scenario.minutes !== null ? '현재 조건에서는 해소 불가 → 조정 시 해소' : '';
    }

    const diff = current.minutes - scenario.minutes;

    if (diff > 0) return `현재 조건보다 ${formatCount(diff)}분 단축`;
    if (diff < 0) return `현재 조건보다 ${formatCount(-diff)}분 늘어남`;

    return '현재 조건과 같음';
}

function toQueueRecommendView(dto: FcltQueueScenarioDto, recommend: FcltQueueRecommendDto): QueueRecommendView {
    const { reqCnt, extraCnt, reduceCnt } = recommend;

    if (reqCnt === null) {
        return {
            reqCnt: null,
            countNote: recommend.reqMetric.reason,
            capaNote: '',
            capaShort: false,
            clear: null,
            clearLabel: '',
        };
    }

    const current = dto.oprFcltCnt === null ? '' : `현재 ${formatCount(dto.oprFcltCnt)}개 / `;
    const countNote =
        extraCnt !== null && extraCnt > 0
            ? `${current}${formatCount(extraCnt)}개 추가 필요`
            : reduceCnt !== null && reduceCnt > 0
              ? `${current}${formatCount(reduceCnt)}개 감소 가능`
              : `${current}현재 수량으로 충분`;
    const capaNote =
        recommend.capaAvlYn === 'N'
            ? `보유 ${formatCount(dto.totCnt ?? 0)}개 초과 — 보유 수량으로 목표 달성 불가`
            : recommend.capaAvlYn === 'Y'
              ? `보유 ${formatCount(dto.totCnt ?? 0)}개 이내`
              : dto.totCntRsn || '배정 가능한 최대 수량 미확인';
    const clearSource = dto.scenario ?? dto.totScenario;

    return {
        reqCnt,
        countNote,
        capaNote,
        capaShort: recommend.capaAvlYn === 'N',
        clear: clearSource ? toQueueClearView(clearSource, dto.baseDt, dto.normalUpperExclusiveSec) : null,
        clearLabel: dto.scenario ? '조정 후' : dto.totScenario ? `보유 ${formatCount(dto.totCnt ?? 0)}개 모두 배정 시` : '',
    };
}

function toWtngAvgText(dto: FcltQueueScenarioDto): string {
    if (dto.wtngAvgSec === null) return `— (${dto.wtngAvgMetric.reason})`;

    const grade = dto.cgnStatus === null ? '등급 산정 불가' : CONGESTION_STATUS_LABEL[dto.cgnStatus];

    return `${formatSeconds(dto.wtngAvgSec)} / 처리 ${formatCount(dto.wtngAvgPrcsPsgCnt ?? 0)}명 가중평균 / ${grade}`;
}

export function toFcltQueueContextView(dto: FcltQueueScenarioDto): FcltQueueContextView {
    const label = FCLT_QUEUE_LABEL[dto.fcltType];
    const targetShort = toTargetShort(dto.normalUpperExclusiveSec);
    const countLockReason =
        dto.oprFcltCnt === null
            ? '현재 운영 수량이 확인되지 않아 수량을 조정할 수 없습니다.'
            : dto.totCnt === null
              ? `${dto.totCntRsn || '배정 가능한 최대 수량이 확인되지 않았습니다.'} 수량 조정을 할 수 없습니다.`
              : '';

    return {
        label,
        tmnlId: dto.tmnlId,
        fcltNm: dto.fcltNm,
        baseText: formatDtFull(dto.baseDt),
        obsText: `${formatDtClock(dto.obsBgnDt)} ~ ${toClockText(dto.obsEndDt, dto.obsBgnDt)}`,
        dataSrcText: QUEUE_DATA_SRC_LABEL[dto.dataSrc],
        queueText: dto.wtngPsgCnt === null ? '—' : formatCount(dto.wtngPsgCnt),
        targetText: `직전 30분 처리 여객 ${targetShort} (혼잡등급 NORMAL 상한)`,
        wtngAvgText: toWtngAvgText(dto),
        wtngAvgShort: dto.wtngAvgSec === null ? '' : `평균대기 ${formatSeconds(dto.wtngAvgSec)}`,
        arvlText: dto.arvlRate === null ? `— (${dto.arvlMetric.reason})` : `${dto.arvlRate.toFixed(1)}명/분 / ${QUEUE_METHOD_LABEL[dto.arvlMetric.method]}`,
        srvcText: dto.srvcRate === null ? `— (${dto.srvcMetric.reason})` : `${label.resource} 1개당 ${dto.srvcRate.toFixed(2)}명/분`,
        asmpList: dto.asmpList,
        currentCnt: dto.oprFcltCnt,
        totCnt: dto.totCnt,
        countLockReason,
        targetMin: { dflt: dto.dfltTargetMin, min: dto.minTargetMin, max: dto.maxTargetMin },
        current: toQueueClearView(dto.current, dto.baseDt, dto.normalUpperExclusiveSec),
        currentErlang: toQueueErlangView(dto.current),
    };
}

export function toFcltQueueResultView(dto: FcltQueueScenarioDto): FcltQueueResultView {
    const current = toQueueClearView(dto.current, dto.baseDt, dto.normalUpperExclusiveSec);
    const scenario = dto.scenario ? toQueueClearView(dto.scenario, dto.baseDt, dto.normalUpperExclusiveSec) : null;

    return {
        scenario,
        scenarioErlang: dto.scenario ? toQueueErlangView(dto.scenario) : null,
        diffNote: dto.mode === 'COUNT' && scenario ? toDiffNote(current, scenario) : '',
        recommend: dto.mode === 'TIME' && dto.recommend ? toQueueRecommendView(dto, dto.recommend) : null,
    };
}

export const EMPTY_TERMINAL_VIEW: TerminalView = {
    barText: '-',
    cgnStatus: null,
    stats: {
        flights: { delta: '-', value: '-' },
        pax: { delta: '-', value: '-' },
        boardingRate: '-',
    },
    peak: { ampm: '', time: '-', totalWait: '-', maxWait: '-', hourlyProcess: '-' },
    summaryStats: [],
    summaryInfo: [],
    fcltCards: [],
    chart: { rsltList: [] },
    tableRows: [],
    defaultSelectedRow: 0,
};
