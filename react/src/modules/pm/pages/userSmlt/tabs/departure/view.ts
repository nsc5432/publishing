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
function toPlanId(depNum: string, planSn: number): string {
    return `g${depNum}-r${planSn}`;
}

/** 화면 키 → 서버 일련번호 (화면에서 새로 만든 행은 0 으로 보낸다) */
function toPlanSn(id: string): number {
    const sn = Number(id.split('-r')[1]);

    return Number.isFinite(sn) ? sn : 0;
}

function toScRanges(
    depNum: string,
    planList: UserSmltDepDto['depList'][number]['planList'],
): ScRange[] {
    return planList.map((plan) => ({
        id: toPlanId(depNum, plan.planSn),
        startHour: plan.bgnHour,
        endHour: plan.endHour,
        count: plan.scCnt,
    }));
}

function toGates(dto: UserSmltDepDto): DepartureGate[] {
    return dto.depList.map((dep, i) => ({
        no: Number(dep.depNum),
        color: BLOCK_COLORS[i % BLOCK_COLORS.length],
        ranges: dep.oprTimeList.map((time) => ({ start: time.bgnHour, end: time.endHour })),
        off: dep.oprYn === 'N',
        scCnt: dep.scCnt,
        normalCnt: dep.normalCnt,
        smartPassCnt: dep.smartPassCnt,
        plans: toScRanges(dep.depNum, dep.planList),
    }));
}

export function toDeparture(dto: UserSmltDepDto): TerminalDeparture {
    return {
        gates: toGates(dto),
        wait: toWaitLine(dto.waitList, dto.waitMaxCnt),
        kpis: toKpis(dto.kpi),
    };
}

/** 운영계획을 24칸 배열로 편다 — 격자 셀 / 합계 / 피크가 모두 이 배열을 읽는다 */
export function toHourArray(gate: DepartureGate): number[] {
    const byHour = Array<number>(24).fill(0);
    gate.plans.forEach((plan) => {
        for (let h = plan.startHour; h < plan.endHour; h += 1) byHour[h] = plan.count;
    });

    return byHour;
}

/** 격자에서 새로 생긴 구간의 임시 키 일련번호 (저장 때 planSn = 0 으로 나간다) */
let seq = 0;

/** 격자 24칸 → ScRange[] · 같은 값이 이어지는 동안 한 구간으로 묶는다 */
export function toPlans(byHour: number[], prev: ScRange[]): ScRange[] {
    const out: ScRange[] = [];
    let h = 0;

    while (h < 24) {
        const count = byHour[h] ?? 0;
        // 0 은 구간을 만들지 않는다 — 운영시간(ranges)은 위 차트가 따로 관리한다
        if (count === 0) {
            h += 1;
            continue;
        }

        let end = h + 1;
        while (end < 24 && byHour[end] === count) end += 1;

        // 시작 시각이 같은 기존 행이 있으면 그 id 를 물려받아 planSn 을 지킨다
        const kept = prev.find((plan) => plan.startHour === h);
        out.push({ id: kept?.id ?? `new-${(seq += 1)}`, startHour: h, endHour: end, count });
        h = end;
    }

    return out;
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
        depList: gates.map((gate) => ({
            depNum: String(gate.no),
            oprYn: gate.off ? ('N' as const) : ('Y' as const),
            oprTimeList: gate.ranges.map((range) => ({ bgnHour: range.start, endHour: range.end })),
            normalCnt: gate.normalCnt,
            smartPassCnt: gate.smartPassCnt,
            scCnt: gate.scCnt,
            planList: gate.plans.map((plan) => ({
                planSn: toPlanSn(plan.id),
                bgnHour: plan.startHour,
                endHour: plan.endHour,
                scCnt: plan.count,
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
