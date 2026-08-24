import type { TmnlId, UserSmltDepDto, UserSmltDepSaveReq } from '@/types/api.types';
import { BLOCK_COLORS } from '../../types';
import { EMPTY_WAIT_LINE, toKpis, toWaitLine } from '../../view';
import type { DepartureGate, ScRange, TerminalDeparture } from './types';

/**
 * 출국장 DTO → 화면 뷰 모델.
 *
 * 블럭 색은 서버가 모르는 화면 표기라 내려온 순서대로 돌려 쓴다.
 */

/**
 * 운영계획 행의 화면 키.
 * 저장할 때 서버 일련번호(planSn)를 되돌려야 하므로 키에 실어 둔다.
 */
function toPlanId(dptgtNo: string, planSn: number): string {
    return `g${dptgtNo}-r${planSn}`;
}

/** 화면 키 → 서버 일련번호 (화면에서 새로 만든 행은 0 으로 보낸다) */
function toPlanSn(id: string): number {
    const sn = Number(id.split('-r')[1]);

    return Number.isFinite(sn) ? sn : 0;
}

function toScRanges(
    dptgtNo: string,
    planList: UserSmltDepDto['dptgtList'][number]['planList'],
): ScRange[] {
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

/** 격자에서 새로 생긴 구간의 임시 키 (저장 때 planSn = 0 으로 나간다) */
const nextTempRangeId = (() => {
    let seq = 0;

    return () => `new-${(seq += 1)}`;
})();

/** 운영계획을 24칸 배열로 편다 — 격자 셀 / 합계 / 피크가 모두 이 배열을 읽는다 */
export function toHourArray(gate: DepartureGate): number[] {
    const byHour = Array<number>(24).fill(0);
    gate.plans.forEach((plan) => {
        for (let hour = plan.operBgngHour; hour < plan.operEndHour; hour += 1) byHour[hour] = plan.count;
    });

    return byHour;
}

/** 격자 24칸 → ScRange[] · 같은 값이 이어지는 동안 한 구간으로 묶는다 */
export function toPlans(byHour: number[], prev: ScRange[]): ScRange[] {
    const ranges: ScRange[] = [];
    let hour = 0;

    while (hour < 24) {
        const count = byHour[hour] ?? 0;
        // 0 은 구간을 만들지 않는다 — 운영시간(ranges)은 위 차트가 따로 관리한다
        if (count === 0) {
            hour += 1;
            continue;
        }

        let operEndHour = hour + 1;
        while (operEndHour < 24 && byHour[operEndHour] === count) operEndHour += 1;

        // 시작 시각이 같은 기존 행이 있으면 그 id 를 물려받아 planSn 을 지킨다
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

/** 저장 요청 — 구 saveScPlanInfo 를 흡수해 출국장 1개분에 운영계획까지 함께 보낸다 */
export function toSaveReq(
    smltId: string,
    tmnlId: TmnlId,
    gates: DepartureGate[],
): UserSmltDepSaveReq {
    return {
        smltId,
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

/** 아직 응답이 없을 때 그릴 빈 패널 (골격은 그대로 두고 값만 비운다) */
export const EMPTY_DEPARTURE: TerminalDeparture = {
    gates: [],
    wait: EMPTY_WAIT_LINE,
    kpis: [],
};
