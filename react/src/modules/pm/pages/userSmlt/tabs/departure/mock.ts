import type { TerminalKind } from '../../types';
import type { DepartureGate, ScRange, TerminalDeparture } from './types';

/** 보조 차트의 블럭 1개가 담당하는 검색대 대수 */
export const SC_PER_BLOCK = 4;

/** [시작, 종료, 검색대 갯수] 튜플을 운영계획 행으로 만든다 */
function toPlans(gateNo: number, seed: Array<[number, number, number]>): ScRange[] {
    return seed.map(([startHour, endHour, count], i) => ({
        id: `g${gateNo}-r${i + 1}`,
        startHour,
        endHour,
        count,
    }));
}

/** [번호, 색, 시작, 종료, 미사용, 검색대, 일반, 스마트패스, 운영계획] 튜플을 출국장으로 만든다 */
function toGate(
    seed: [
        number,
        DepartureGate['color'],
        number,
        number,
        boolean,
        number,
        number,
        number,
        Array<[number, number, number]>,
    ],
): DepartureGate {
    const [no, color, start, end, off, scCnt, normalCnt, smartPassCnt, plans] = seed;

    return {
        no,
        color,
        ranges: [{ start, end }],
        off,
        scCnt,
        normalCnt,
        smartPassCnt,
        plans: toPlans(no, plans),
    };
}

export const DEPARTURE: Record<TerminalKind, TerminalDeparture> = {
    T1: {
        gates: [
            toGate([1, 'i1', 5, 22, false, 8, 3, 2, [[5, 12, 6], [12, 22, 8]]]),
            toGate([2, 'i5', 6, 21, true, 6, 2, 1, [[6, 21, 6]]]),
            toGate([3, 'i2', 6, 21, false, 6, 2, 2, [[6, 14, 4], [14, 21, 6]]]),
            toGate([
                4,
                'i3',
                6,
                20,
                false,
                10,
                3,
                2,
                [
                    [6, 8, 4],
                    [8, 12, 10],
                    [12, 16, 8],
                    [16, 20, 6],
                ],
            ]),
            toGate([5, 'i5', 7, 20, true, 4, 2, 1, [[7, 20, 4]]]),
            toGate([6, 'i4', 7, 19, false, 4, 2, 1, [[7, 19, 4]]]),
        ],
        wait: {
            data: [
                0, 0, 0, 0, 0, 25, 90, 180, 260, 230, 190, 210, 240, 270, 220, 180, 150, 120, 95,
                65, 35, 12, 0, 0,
            ],
            max: 300,
            label: '대기인원수',
            unit: '명',
        },
        kpis: [
            { label: '평균대기', value: '15', unit: '분' },
            { label: 'P95대기', value: '12', unit: '분' },
            { label: '최대 큐인원', value: '20', unit: '명' },
            { label: '가동률', value: '84', unit: '%' },
        ],
    },
    T2: {
        gates: [
            toGate([1, 'i1', 7, 21, false, 5, 3, 1, [[7, 13, 4], [13, 21, 5]]]),
            toGate([2, 'i5', 7, 20, true, 4, 2, 1, [[7, 20, 4]]]),
        ],
        wait: {
            data: [
                0, 0, 0, 0, 0, 0, 0, 30, 55, 48, 40, 44, 50, 58, 47, 38, 30, 24, 18, 12, 6, 0, 0, 0,
            ],
            max: 300,
            label: '대기인원수',
            unit: '명',
        },
        kpis: [
            { label: '평균대기', value: '6', unit: '분' },
            { label: 'P95대기', value: '5', unit: '분' },
            { label: '최대 큐인원', value: '8', unit: '명' },
            { label: '가동률', value: '47', unit: '%' },
        ],
    },
};
