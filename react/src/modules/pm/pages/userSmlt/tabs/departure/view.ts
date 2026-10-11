import type { TmnlId, UserSmltDepDto, UserSmltDepSaveReq } from '@/types/api.types';
import { BLOCK_COLORS } from '../../types';
import { EMPTY_WAIT_LINE, toKpis, toWaitLine } from '../../view';
import type { DepartureGate, ScRange, TerminalDeparture } from './types';

function toPlanId(dptgtNo: string, planSn: number): string {
    return `g${dptgtNo}-r${planSn}`;
}

function toPlanSn(id: string): number {
    const sn = Number(id.split('-r')[1]);

    return Number.isFinite(sn) ? sn : 0;
}

function toScRanges(dptgtNo: string, planList: UserSmltDepDto['dptgtList'][number]['planList']): ScRange[] {
    return planList.map((plan) => ({
        id: toPlanId(dptgtNo, plan.planSn),
        operBgngHour: plan.operBgngHour,
        operEndHour: plan.operEndHour,
        count: plan.scshCntom,
    }));
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
        plans: toScRanges(dep.dptgtNo, dep.planList),
    }));
}

export function toDeparture(dto: UserSmltDepDto): TerminalDeparture {
    return {
        gates: toGates(dto),
        wait: toWaitLine(dto.waitList, dto.waitMaxCnt),
        kpis: toKpis(dto.kpi),
    };
}

const nextTempRangeId = (() => {
    let seq = 0;

    return () => `new-${(seq += 1)}`;
})();

export function toHourArray(gate: DepartureGate): number[] {
    const byHour = Array<number>(24).fill(0);
    gate.plans.forEach((plan) => {
        for (let hour = plan.operBgngHour; hour < plan.operEndHour; hour += 1) byHour[hour] = plan.count;
    });

    return byHour;
}

export function toPlans(byHour: number[], prev: ScRange[]): ScRange[] {
    const ranges: ScRange[] = [];
    let hour = 0;

    while (hour < 24) {
        const count = byHour[hour] ?? 0;

        if (count === 0) {
            hour += 1;
            continue;
        }

        let operEndHour = hour + 1;
        while (operEndHour < 24 && byHour[operEndHour] === count) operEndHour += 1;

        const existing = prev.find((plan) => plan.operBgngHour === hour);
        ranges.push({
            id: existing?.id ?? nextTempRangeId(),
            operBgngHour: hour,
            operEndHour,
            count,
        });
        hour = operEndHour;
    }

    return ranges;
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
            planList: gate.plans.map((plan) => ({
                planSn: toPlanSn(plan.id),
                operBgngHour: plan.operBgngHour,
                operEndHour: plan.operEndHour,
                scshCntom: plan.count,
            })),
        })),
    };
}

export const EMPTY_DEPARTURE: TerminalDeparture = {
    gates: [],
    wait: EMPTY_WAIT_LINE,
    kpis: [],
};
