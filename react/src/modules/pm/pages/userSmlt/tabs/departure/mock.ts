import type { TimeRange } from '@/components/ui/time-range-selector';
import type { TerminalKind } from '../../types';
import type { DepartureGate, GateState, TerminalDeparture } from './types';

/** [표시번호, 미사용 여부, 운영 구간] 튜플을 출국장 목록으로 만든다 */
function toGates(seed: Array<[number, boolean, TimeRange[]]>): DepartureGate[] {
    return seed.map(([no, off, ranges]) => ({
        id: `gate-${no}`,
        name: `출국장 ${no}`,
        off,
        ranges,
    }));
}

const DAY = (start: number, end: number): TimeRange => ({ start, end });

export const DEPARTURE: Record<TerminalKind, TerminalDeparture> = {
    T1: {
        gates: toGates([
            [1, false, [DAY(6, 14), DAY(16, 22)]],
            [2, true, [DAY(6, 14), DAY(16, 21)]],
            [3, false, [DAY(5, 14), DAY(16, 22)]],
            [4, false, [DAY(6, 20)]],
            [5, true, [DAY(7, 13), DAY(16, 20)]],
            [6, false, [DAY(6, 14), DAY(16, 22)]],
        ]),
    },
    T2: {
        gates: toGates([
            [1, true, [DAY(7, 21)]],
            [2, true, [DAY(7, 20)]],
        ]),
    },
};

/** 출국장 목록에서 초기 편집 상태를 만든다 */
export function toGateState(terminal: TerminalKind): GateState {
    return Object.fromEntries(
        DEPARTURE[terminal].gates.map((gate) => [gate.id, { off: gate.off, ranges: gate.ranges }]),
    );
}
