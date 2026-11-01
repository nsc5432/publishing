import type { FltPsgChartDto, TmnlId, UserSmltFltPsgDto, UserSmltFltPsgSaveReq } from '@/types/api.types';
import { formatCount, formatHhmm, pad2 } from '@/lib/format';
import type { ChartData, FlightPaxChartData, HourRow, TerminalFlightPax } from './types';

const toFactor = (ajmtRt: number) => 1 + ajmtRt / 100;

const scale = (value: number, factor: number) => Math.round(value * factor);

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

function toCombinedChart(dto: UserSmltFltPsgDto, factor: number): FlightPaxChartData {
    const flights = toChart(dto.fltChart, '운항편 수', '편', factor);
    const pax = toChart(dto.psgChart, '승객 수', '명', factor);
    const flightsByTime = new Map(flights.bars.map((item) => [item.label, item]));
    const paxByTime = new Map(pax.bars.map((item) => [item.label, item]));
    const labels = [...new Set([...flightsByTime.keys(), ...paxByTime.keys()])].sort();

    return {
        flights,
        pax,
        items: labels.map((label) => {
            const flight = flightsByTime.get(label);
            const passenger = paxByTime.get(label);
            return {
                label,
                flights: flight?.value ?? null,
                pax: passenger?.value ?? null,
                flightText: flight ? `${formatCount(flight.actual)}편` : '-',
                paxText: passenger ? `${formatCount(passenger.actual)}명` : '-',
            };
        }),
    };
}

function toPeakHour(peakTime: string): string {
    if (peakTime.length !== 4) return '-';
    const hour = Number(peakTime.slice(0, 2));
    return `${pad2(hour)}~${pad2(hour + 1)}시`;
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
        peak: toPeakHour(dto.peakTime),
        chart: toCombinedChart(dto, factor),
        rows: toRows(dto, ajmtRt, factor),
    };
}

export function toSaveReq(ymd: string, tmnlId: TmnlId, ajmtRt: number): UserSmltFltPsgSaveReq {
    return {
        ymd,
        tmnlId,
        ajmtRt,
    };
}

export const EMPTY_FLIGHT_PAX: TerminalFlightPax = {
    flights: '-',
    pax: '-',
    peak: '-',
    chart: {
        flights: { title: '운항편 수', total: '-', unit: '편', max: 0, bars: [] },
        pax: { title: '승객 수', total: '-', unit: '명', max: 0, bars: [] },
        items: [],
    },
    rows: [],
};
