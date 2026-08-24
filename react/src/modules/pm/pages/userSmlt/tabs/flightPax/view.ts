import type {
    FltPsgChartDto,
    TmnlId,
    UserSmltFltPsgDto,
    UserSmltFltPsgSaveReq,
} from '@/types/api.types';
import { formatCount, formatHhmm } from '@/lib/format';
import type { ChartData, HourRow, TerminalFlightPax } from './types';

const toFactor = (ajmtRt: number) => 1 + ajmtRt / 100;

const scale = (value: number, factor: number) => Math.round(value * factor);

/**
 * 비율을 늘리면 축도 데이터와 같은 배율로 커져서, 늘려도 막대 모양이
 * 그대로인 것처럼 보인다 (피크 막대가 항상 축 끝에 딱 맞기 때문).
 * 축은 데이터의 절반 속도로만 키워 늘어난 게 눈에 보이게 한다.
 * 대신 피크 막대는 축보다 먼저 끝에 닿을 수 있어 clamp 가 필요하다.
 */
const AXIS_GROWTH_RATE = 0.5;

function toAxisMax(baseMax: number, factor: number) {
    if (factor <= 1) return baseMax;
    return Math.round(baseMax * (1 + (factor - 1) * AXIS_GROWTH_RATE));
}

function toChart(chartDto: FltPsgChartDto, title: string, unit: string, factor: number): ChartData {
    const max = toAxisMax(chartDto.maxCnt, factor);

    return {
        title,
        total: formatCount(scale(chartDto.totCnt, factor)),
        unit,
        max,
        bars: chartDto.itemList.map((item) => {
            const actual = scale(item.cnt, factor);
            return { label: item.time, value: Math.min(actual, max), actual };
        }),
    };
}

function toRows(dto: UserSmltFltPsgDto, ajmtRt: number, factor: number): HourRow[] {
    return dto.hourList.map((hourRow) => ({
        start: formatHhmm(hourRow.bgnTime),
        end: formatHhmm(hourRow.endTime),
        adjust: `${ajmtRt}%`,
        pax: `${formatCount(scale(hourRow.psgCnt, factor))}명`,
    }));
}

export function toFlightPax(dto: UserSmltFltPsgDto, ajmtRt: number): TerminalFlightPax {
    const factor = toFactor(ajmtRt);

    return {
        flights: formatCount(dto.fltCnt),
        pax: formatCount(dto.psgCnt),
        peak: formatHhmm(dto.peakTime),
        flightChart: toChart(dto.fltChart, '운항편 수', '편', factor),
        paxChart: toChart(dto.psgChart, '여객 수', '명', factor),
        rows: toRows(dto, ajmtRt, factor),
    };
}

export function toSaveReq(
    smltId: string,
    tmnlId: TmnlId,
    dto: UserSmltFltPsgDto,
    ajmtRt: number,
): UserSmltFltPsgSaveReq {
    return {
        smltId,
        tmnlId,
        ajmtTypeCd: 'RATIO',
        ajmtRt,
        hourList: dto.hourList.map((hourRow) => ({
            bgnTime: hourRow.bgnTime,
            endTime: hourRow.endTime,
            ajmtRt: hourRow.ajmtRt,
        })),
    };
}

export const EMPTY_FLIGHT_PAX: TerminalFlightPax = {
    flights: '-',
    pax: '-',
    peak: '-',
    flightChart: { title: '운항편 수', total: '-', unit: '편', max: 0, bars: [] },
    paxChart: { title: '여객 수', total: '-', unit: '명', max: 0, bars: [] },
    rows: [],
};
