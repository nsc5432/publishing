import type { TmnlId, UserSmltDepDto, UserSmltDepSaveReq } from '@/types/api.types';
import { BLOCK_COLORS } from '../../types';
import { EMPTY_WAIT_LINE, toKpis, toWaitLine } from '../../view';
import type { DepartureGate, TerminalDeparture } from './types';

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

export function toDeparture(dto: UserSmltDepDto): TerminalDeparture {
    return {
        gates: toGates(dto),
        wait: toWaitLine(dto.waitList, dto.waitMaxCnt),
        kpis: toKpis(dto.kpi),
    };
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
    kpis: [],
};
