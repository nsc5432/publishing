import type { TerminalKind } from '../../types';
import type { SecurityDraft, SecurityGate, SecurityRow, TerminalSecurity } from './types';

/** 신규 행 초기값 */
export const EMPTY_DRAFT: SecurityDraft = {
    startHour: '00',
    startMin: '00',
    endHour: '00',
    endMin: '00',
    count: '',
};

/** [시작시, 종료시, 갯수] 튜플을 운영계획 행으로 만든다 (분은 모두 00) */
function toRows(gateNo: number, seed: Array<[number, number, number]>): SecurityRow[] {
    return seed.map(([startHour, endHour, count], i) => ({
        id: `g${gateNo}-r${i + 1}`,
        startHour: String(startHour).padStart(2, '0'),
        startMin: '00',
        endHour: String(endHour).padStart(2, '0'),
        endMin: '00',
        count,
    }));
}

function toGate(no: number, seed: Array<[number, number, number]>): SecurityGate {
    return { no, rows: toRows(no, seed) };
}

export const SECURITY: Record<TerminalKind, TerminalSecurity> = {
    T1: {
        selectedGate: 4,
        gates: [
            toGate(1, [
                [6, 10, 4],
                [8, 20, 8],
                [18, 23, 4],
            ]),
            toGate(2, [
                [6, 12, 3],
                [9, 21, 6],
            ]),
            toGate(3, [
                [5, 9, 4],
                [7, 21, 10],
                [16, 23, 6],
            ]),
            toGate(4, [
                [5, 8, 2],
                [6, 22, 6],
                [7, 20, 8],
                [8, 20, 10],
                [10, 14, 10],
                [16, 22, 6],
                [20, 24, 4],
            ]),
            toGate(5, [
                [7, 13, 3],
                [16, 20, 6],
            ]),
            toGate(6, [
                [6, 14, 5],
                [16, 22, 8],
            ]),
        ],
    },
    T2: {
        selectedGate: null,
        gates: [
            toGate(1, [
                [6, 9, 2],
                [7, 21, 4],
                [9, 20, 6],
            ]),
            toGate(2, [
                [12, 18, 6],
                [18, 23, 3],
            ]),
        ],
    },
};

/** 출국장 목록에서 초기 편집 상태(번호 → 운영계획 행)를 만든다 */
export function toRowState(terminal: TerminalKind): Record<number, SecurityRow[]> {
    return Object.fromEntries(SECURITY[terminal].gates.map((gate) => [gate.no, gate.rows]));
}
