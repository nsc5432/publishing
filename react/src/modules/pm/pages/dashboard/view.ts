import type {
    CongestionStatus,
    DsbdFcltCardDto,
    DsbdRsltDto,
    TmnlSmryDto,
} from '@/types/api.types';
import {
    dowLabel,
    formatCount,
    formatDiff,
    formatHhmm,
    formatMinutes,
    formatYmd,
} from './format';
import type { GateData, GateVariant, TableRow, TerminalView } from './types';

/** 아직 응답이 없을 때 그릴 빈 패널 (골격은 그대로 두고 값만 비운다) */
export const EMPTY_TERMINAL_VIEW: TerminalView = {
    barText: '-',
    stats: {
        flights: { delta: '-', value: '-' },
        pax: { delta: '-', value: '-' },
        boardingRate: '-',
    },
    peak: { ampm: '', time: '-', totalWait: '-', maxWait: '-', hourlyProcess: '-' },
    summaryStats: [],
    summaryInfo: [],
    gates: [],
    chart: { rsltList: [], peakIndex: 0 },
    tableRows: [],
    defaultSelectedRow: 0,
};

/**
 * 터미널 패널 DTO → 화면 뷰 모델.
 *
 * 단위·부호·시각 형식을 여기서 한 번에 정한다. 컴포넌트가 저마다 toLocaleString 을
 * 부르기 시작하면 같은 값이 화면마다 다르게 보이기 시작한다.
 */

/**
 * 혼잡도 → 칩 색상(dashboard.css).
 * 칩 팔레트가 3색이라 여유/보통은 같은 초록을 쓴다.
 */
const CGN_CHIP: Record<CongestionStatus, string> = {
    FREE: 'g',
    NORMAL: 'g',
    BUSY: 'o',
    VERY_BUSY: 'r',
};

const BUSY_STATUS: CongestionStatus[] = ['BUSY', 'VERY_BUSY'];

function toGateVariant(card: DsbdFcltCardDto): GateVariant {
    const isCheckin = card.fcltType === 'CHKN';

    return {
        isl: isCheckin ? '아일랜드' : undefined,
        num: card.fcltNm,
        numSmall: card.fcltDesc ? `(${card.fcltDesc})` : undefined,
        meta: isCheckin
            ? [
                  { k: '전체', v: formatCount(card.totCnt) },
                  { k: '운영', v: formatCount(card.oprCnt), acc: true },
                  { k: '대기열', v: formatCount(card.wtngPsgCnt) },
              ]
            : [{ k: '예상인원', v: formatCount(card.wtngPsgCnt) }],
        processRate: {
            value: card.hrlyPrcsRate / 100,
            main: String(card.hrlyPrcsPsgCnt).padStart(2, '0'),
            sub: 'Pax/Min',
        },
        clearTime: {
            value: card.cgnClearRate / 100,
            main: formatHhmm(card.cgnClearTime),
            sub: '이후',
        },
        rec: {
            tag: '추천',
            name: card.recommend.targetNm,
            cnt: String(card.recommend.addCnt),
            cap: card.recommend.needAssignYn === 'Y' ? '배정 필요' : '소요',
            capAccent: card.recommend.needAssignYn === 'N',
        },
        // 미운영 칩은 혼잡도와 무관하게 회색으로 눕힌다.
        chips: card.unitList.map((unit) => ({
            label: unit.unitCd,
            kind: unit.useYn === 'N' ? 'gray' : CGN_CHIP[unit.cgnStatus],
        })),
    };
}

function toGateData(title: string, cards: DsbdFcltCardDto[]): GateData {
    const busyCount = cards.filter((card) => BUSY_STATUS.includes(card.cgnStatus)).length;

    return {
        title,
        warn: busyCount > 0 ? `혼잡 ${busyCount}개` : '원활',
        variants: cards.map(toGateVariant),
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

interface TerminalViewInput {
    ymd: string;
    hhmm: string;
    smry: TmnlSmryDto;
    rsltList: DsbdRsltDto[];
    chknCards: DsbdFcltCardDto[];
    depCards: DsbdFcltCardDto[];
}

export function toTerminalView({
    ymd,
    hhmm,
    smry,
    rsltList,
    chknCards,
    depCards,
}: TerminalViewInput): TerminalView {
    // 시간대별 결과는 정시(HH00) 단위라 조회 시각과 같은 '시'를 찾는다.
    const currentIndex = rsltList.findIndex((rslt) => rslt.time.slice(0, 2) === hhmm.slice(0, 2));
    const peakIndex = rsltList.findIndex(
        (rslt) => rslt.time.slice(0, 2) === smry.peak.peakTime.slice(0, 2),
    );

    return {
        barText: `${formatYmd(ymd, '-')} ${dowLabel(ymd)} ${formatHhmm(hhmm)} ${smry.peak.ampm}`,
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
                value: formatCount(smry.fltCnt),
                unit: '편',
                deltaLabel: '전일 대비',
                delta: formatDiff(smry.befFltDiffCnt),
            },
            {
                icon: 'people',
                iconClass: 'i-teal i-32',
                value: formatCount(smry.psgCnt),
                unit: '명',
                deltaLabel: '전일 대비',
                delta: formatDiff(smry.befPsgDiffCnt),
            },
        ],
        summaryInfo: [
            { k: '대기\n인원수', v: formatCount(smry.peak.wtngPsgCnt), u: '명' },
            { k: '최대\n대기시간', v: String(smry.peak.maxWtngHr), u: '분' },
            { k: '시간당\n처리인원', v: formatCount(smry.peak.hrlyPrcsPsgCnt), u: '명' },
        ],
        gates: [toGateData('체크인카운터', chknCards), toGateData('출국장', depCards)],
        chart: { rsltList, peakIndex: Math.max(0, peakIndex) },
        tableRows: rsltList.map(toTableRow),
        defaultSelectedRow: Math.max(0, currentIndex),
    };
}
