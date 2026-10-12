import type { UserSmltFltPsgDto, WaitPsgDto } from '@/types/api.types';
import { formatCount } from '@/lib/format';
import type { FlightDemandSummary, PanelKpi, WaitLineData } from './types';

function toPeakDeparture(flightPax: UserSmltFltPsgDto): string {
    const peak = flightPax.hourList.reduce<(typeof flightPax.hourList)[number] | null>(
        (maximum, hour) => {
            if (
                !maximum ||
                hour.psgCnt > maximum.psgCnt ||
                (hour.psgCnt === maximum.psgCnt && hour.bgnTime < maximum.bgnTime)
            ) {
                return hour;
            }
            return maximum;
        },
        null,
    );

    if (!peak || peak.psgCnt <= 0) return '-';

    return `${peak.bgnTime.slice(0, 2)}~${peak.endTime.slice(0, 2)}시 · ${formatCount(peak.psgCnt)}명`;
}

export function toFlightDemand(flightPax: UserSmltFltPsgDto): FlightDemandSummary {
    return {
        reservationPsgCount: flightPax.psgCnt,
        departureFlightCount: flightPax.fltCnt,
        peakDepartureLabel: toPeakDeparture(flightPax),
    };
}

export function toFlightDemandKpis(data: FlightDemandSummary): PanelKpi[] {
    return [
        {
            label: '예약승객수(환승객제외)',
            value: formatCount(data.reservationPsgCount),
            unit: '명',
        },
        { label: '출국 운항편수', value: formatCount(data.departureFlightCount), unit: '편' },
        { label: '최다 출발 시간대', value: data.peakDepartureLabel, unit: '' },
    ];
}

export function toWaitLine(waitList: WaitPsgDto[], waitMaxCnt: number): WaitLineData {
    return {
        data: waitList.map((item) => item.waitPsgCnt),
        max: waitMaxCnt,
        label: '대기인원수',
        unit: '명',
    };
}

export const EMPTY_WAIT_LINE: WaitLineData = {
    data: [],
    max: 0,
    label: '대기인원수',
    unit: '명',
};
