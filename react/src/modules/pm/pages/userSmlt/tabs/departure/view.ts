import type {
    TmnlId,
    UserSmltDepDto,
    UserSmltDepSaveReq,
    UserSmltFltPsgDto,
} from '@/types/api.types';
import { formatCount } from '@/lib/format';
import { BLOCK_COLORS, type PanelKpi } from '../../types';
import { EMPTY_WAIT_LINE, toFlightDemand, toFlightDemandKpis, toWaitLine } from '../../view';
import type { DepartureGate, TerminalDeparture } from './types';

interface DepartureSource extends UserSmltDepDto {
    flightPax: UserSmltFltPsgDto;
}

function toGates(dto: UserSmltDepDto): DepartureGate[] {
    return dto.dptgtList.map((dep, i) => ({
        no: Number(dep.dptgtNo),
        color: BLOCK_COLORS[i % BLOCK_COLORS.length],
        ranges: dep.oprTimeList.map((time) => ({ start: time.operBgngHour, end: time.operEndHour })),
        off: dep.oprYn === 'N',
        scshCntom: dep.scshCntom,
        gnrlSrchCntom: dep.gnrlSrchCntom,
        smartPassSrchCntom: dep.smartPassSrchCntom,
    }));
}

export function toDeparture(dto: DepartureSource): TerminalDeparture {
    return {
        gates: toGates(dto),
        wait: toWaitLine(dto.waitList, dto.waitMaxCnt),
        ...toFlightDemand(dto.flightPax),
    };
}

export function toDepartureKpis(data: TerminalDeparture, gates: DepartureGate[]): PanelKpi[] {
    const securityCount = gates.reduce(
        (total, gate) =>
            !gate.off && gate.ranges.some((range) => range.end > range.start)
                ? total + gate.scshCntom
                : total,
        0,
    );

    return [
        ...toFlightDemandKpis(data),
        { label: '보안검색대 운영 대수', value: formatCount(securityCount), unit: '대' },
    ];
}

export function toSaveReq(ymd: string, tmnlId: TmnlId, gates: DepartureGate[]): UserSmltDepSaveReq {
    return {
        ymd,
        tmnlId,
        dptgtList: gates.map((gate) => ({
            dptgtNo: String(gate.no),
            oprYn: gate.off ? ('N' as const) : ('Y' as const),
            oprTimeList: gate.ranges.map((range) => ({ operBgngHour: range.start, operEndHour: range.end })),
            gnrlSrchCntom: gate.gnrlSrchCntom,
            smartPassSrchCntom: gate.smartPassSrchCntom,
            scshCntom: gate.scshCntom,
        })),
    };
}

export const EMPTY_DEPARTURE: TerminalDeparture = {
    gates: [],
    wait: EMPTY_WAIT_LINE,
    reservationPsgCount: 0,
    departureFlightCount: 0,
    peakDepartureLabel: '-',
};
