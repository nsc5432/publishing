import type { FltPsgChartDto, TmnlId, UserSmltFltPsgDto, UserSmltFltPsgSaveReq } from '@/types/api.types';
import { formatCount, formatHhmm, pad2 } from '@/lib/format';
import type { ChartData, FlightPaxChartData, FlightPaxDraft, HourRow, TerminalFlightPax } from './types';

const toFactor = (ajmtRt: number) => 1 + ajmtRt / 100;

const scale = (value: number, factor: number) => Math.round(value * factor);

const AXIS_GROWTH_RATE = 0.5;

const CHART_HOUR_STEP = 2;

function toAxisMax(baseMax: number, factor: number) {
    if (factor <= 1) return baseMax;
    return Math.round(baseMax * (1 + (factor - 1) * AXIS_GROWTH_RATE));
}

function toFlightChart(chartDto: FltPsgChartDto): ChartData {
    return {
        title: '운항편 수',
        total: formatCount(chartDto.totCnt),
        unit: '편',
        max: chartDto.maxCnt,
        bars: chartDto.itemList.map((item) => ({ label: item.time, value: item.cnt, actual: item.cnt })),
    };
}

function toPaxChart(dto: UserSmltFltPsgDto, hourRates: number[]): ChartData {
    const hourPax = dto.hourList.map((hour, index) => ({
        hour: Number(hour.bgnTime.slice(0, 2)),
        cnt: scale(hour.psgCnt, toFactor(hourRates[index] ?? 0)),
    }));
    const max = toAxisMax(dto.psgChart.maxCnt, Math.max(1, ...hourRates.map(toFactor)));

    return {
        title: '승객 수',
        total: formatCount(hourPax.reduce((sum, item) => sum + item.cnt, 0)),
        unit: '명',
        max,
        bars: dto.psgChart.itemList.map((item) => {
            const start = Number(item.time);
            const actual = hourPax
                .filter((hour) => hour.hour >= start && hour.hour < start + CHART_HOUR_STEP)
                .reduce((sum, hour) => sum + hour.cnt, 0);
            return { label: item.time, value: Math.min(actual, max), actual };
        }),
    };
}

function toCombinedChart(dto: UserSmltFltPsgDto, hourRates: number[]): FlightPaxChartData {
    const flights = toFlightChart(dto.fltChart);
    const pax = toPaxChart(dto, hourRates);
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

function toRows(dto: UserSmltFltPsgDto, hourRates: number[]): HourRow[] {
    return dto.hourList.map((hourRow, index) => {
        const ajmtRt = hourRates[index] ?? 0;
        return {
            start: formatHhmm(hourRow.bgnTime),
            end: formatHhmm(hourRow.endTime),
            ajmtRt,
            pax: `${formatCount(hourRow.psgCnt)}명`,
            adjPax: `${formatCount(scale(hourRow.psgCnt, toFactor(ajmtRt)))}명`,
        };
    });
}

export function toDraft(dto: UserSmltFltPsgDto): FlightPaxDraft {
    return { ajmtRt: dto.ajmtRt, hourRates: dto.hourList.map((hour) => hour.ajmtRt) };
}

export function toFlightPax(dto: UserSmltFltPsgDto, draft: FlightPaxDraft): TerminalFlightPax {
    return {
        flights: formatCount(dto.fltCnt),
        pax: formatCount(dto.psgCnt),
        peak: toPeakHour(dto.peakTime),
        chart: toCombinedChart(dto, draft.hourRates),
        rows: toRows(dto, draft.hourRates),
    };
}

export function toSaveReq(ymd: string, tmnlId: TmnlId, dto: UserSmltFltPsgDto, draft: FlightPaxDraft): UserSmltFltPsgSaveReq {
    return {
        ymd,
        tmnlId,
        ajmtRt: draft.ajmtRt,
        hourList: dto.hourList.map((hour, index) => ({ bgnTime: hour.bgnTime, ajmtRt: draft.hourRates[index] ?? draft.ajmtRt })),
    };
}

export const EMPTY_DRAFT: FlightPaxDraft = { ajmtRt: 0, hourRates: [] };

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
