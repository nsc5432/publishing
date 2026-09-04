import type {
    CongestionStatus,
    DsbdFcltCardDto,
    DsbdRsltDto,
    FcltUnitDto,
    SmltType,
    TmnlSmryDto,
} from '@/types/api.types';
import {
    dowLabel,
    formatCount,
    formatDiff,
    formatHhmm,
    formatMinutes,
    formatYmd,
    pad2,
} from '@/lib/format';
import type {
    GateChip,
    GateData,
    GateFcltType,
    GateVariant,
    SimulationType,
    TableRow,
    TerminalView,
} from './types';

/**
 * 터미널 패널 DTO → 화면 뷰 모델.
 *
 * 단위·부호·시각 형식을 여기서 한 번에 정한다. 컴포넌트가 저마다 toLocaleString 을
 * 부르기 시작하면 같은 값이 화면마다 다르게 보이기 시작한다.
 */

interface TerminalViewInput {
    ymd: string;
    hhmm: string;
    smry: TmnlSmryDto;
    rsltList: DsbdRsltDto[];
    chknCards: DsbdFcltCardDto[];
    dptgtCards: DsbdFcltCardDto[];
}

/**
 * 혼잡도 → 칩 색상(dashboard.css).
 * 칩 팔레트가 3색이라 여유/보통은 같은 초록을 쓴다.
 */
const CONGESTION_CHIP_CLASS: Record<CongestionStatus, string> = {
    FREE: 'g',
    NORMAL: 'g',
    BUSY: 'o',
    VERY_BUSY: 'r',
};

const BUSY_STATUS: CongestionStatus[] = ['BUSY', 'VERY_BUSY'];

/** 게이트 카드 제목 */
const GATE_TITLE: Record<GateFcltType, string> = {
    CHKN: '체크인카운터',
    DEP: '출국장',
};

/** 서버 시뮬레이션 구분 → 화면 뱃지 구분 */
export function toSimulationType(smltType: SmltType): SimulationType {
    return smltType === 'USER' ? 'user' : 'daily';
}

function toGateVariant(card: DsbdFcltCardDto): GateVariant {
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
            captionText: 'Pax/Min',
        },
        clearTime: {
            value: card.cgnClearRate / 100,
            centerText: formatHhmm(card.cgnClearTime),
            captionText: '이후',
        },
        recommend: {
            tag: '추천',
            name: card.recommend.targetNm,
            count: String(card.recommend.reqCnt),
            countNote: card.recommend.needAssignYn === 'Y' ? '배정 필요' : '소요',
            countNoteAccent: card.recommend.needAssignYn === 'N',
        },
    };
}

// 미운영 칩은 혼잡도와 무관하게 회색으로 눕힌다.
function toGateChip(unit: FcltUnitDto): GateChip {
    return {
        label: unit.unitCd,
        kind: unit.useYn === 'N' ? 'gray' : CONGESTION_CHIP_CLASS[unit.cgnStatus],
    };
}

function toGateData(fcltType: GateFcltType, cards: DsbdFcltCardDto[]): GateData {
    const busyCount = cards.filter((card) => BUSY_STATUS.includes(card.cgnStatus)).length;

    return {
        fcltType,
        title: GATE_TITLE[fcltType],
        warn: busyCount > 0 ? `혼잡 ${busyCount}개` : '원활',
        variants: cards.map(toGateVariant),
        chips: (cards[0]?.unitList ?? []).map(toGateChip),
    };
}

function toTableRow(rslt: DsbdRsltDto): TableRow {
    return {
        time: formatHhmm(rslt.time),
        pax: formatCount(rslt.psgCnt),
        wait: formatMinutes(rslt.wtngHr),
        process: formatMinutes(rslt.prcsHr),
        ratio: String(rslt.prcsRate),
    };
}

export function toTerminalView({
    ymd,
    hhmm,
    smry,
    rsltList,
    chknCards,
    dptgtCards,
}: TerminalViewInput): TerminalView {
    // 시간대별 결과는 정시(HH00) 단위라 조회 시각과 같은 '시'를 찾는다.
    const currentIndex = rsltList.findIndex((rslt) => rslt.time.slice(0, 2) === hhmm.slice(0, 2));

    return {
        barText: `${formatYmd(ymd, '-')} ${dowLabel(ymd)} ${formatHhmm(hhmm)} ${smry.peak.ampm}`,
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
                value: formatCount(smry.itvlFltCnt),
                unit: '편',
                deltaLabel: '전일 대비',
                delta: formatDiff(smry.itvlBefFltDiffCnt),
            },
            {
                icon: 'people',
                iconClass: 'i-teal i-32',
                value: formatCount(smry.itvlPsgCnt),
                unit: '명',
                deltaLabel: '전일 대비',
                delta: formatDiff(smry.itvlBefPsgDiffCnt),
            },
        ],
        summaryInfo: [
            { label: '대기\n인원수', value: formatCount(smry.peak.wtngPsgCnt), unit: '명' },
            { label: '최대\n대기시간', value: String(smry.peak.maxWtngHr), unit: '분' },
            { label: '시간당\n처리인원', value: formatCount(smry.peak.hrlyPrcsPsgCnt), unit: '명' },
        ],
        gates: [toGateData('CHKN', chknCards), toGateData('DEP', dptgtCards)],
        chart: { rsltList },
        tableRows: rsltList.map(toTableRow),
        defaultSelectedRow: Math.max(0, currentIndex),
    };
}

/** 아직 응답이 없을 때 그릴 빈 패널 (골격은 그대로 두고 값만 비운다) */
export const EMPTY_TERMINAL_VIEW: TerminalView = {
    barText: '-',
    cgnStatus: 'FREE',
    stats: {
        flights: { delta: '-', value: '-' },
        pax: { delta: '-', value: '-' },
        boardingRate: '-',
    },
    peak: { ampm: '', time: '-', totalWait: '-', maxWait: '-', hourlyProcess: '-' },
    summaryStats: [],
    summaryInfo: [],
    gates: [],
    chart: { rsltList: [] },
    tableRows: [],
    defaultSelectedRow: 0,
};
