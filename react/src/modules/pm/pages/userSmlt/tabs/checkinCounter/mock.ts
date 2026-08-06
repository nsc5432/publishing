import type { TerminalKind } from '../../types';
import type { Booth, CheckinIsland, TerminalCheckinCounter } from './types';

/** 블럭 1개가 담당하는 부스 수 — 블럭 수 = ceil(부스 수 / 4) */
export const BOOTH_PER_BLOCK = 4;

/** 아일랜드 문자 — 원본 퍼블리싱과 동일하게 I 를 건너뛴다 */
const ISLAND_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N'];

/** 배정 가능 항공사 */
const AIRLINES = ['KE', 'OZ'];

/** 항공사 코드 배열을 부스 목록으로 만든다 ('' = 미배정) */
function toBooths(airlines: string[]): Booth[] {
    return airlines.map((airline, i) => ({ no: i + 1, airline }));
}

/** [문자, 색, 시작, 종료, 부스 항공사, 키오스크, 백드롭] 튜플을 아일랜드로 만든다 */
function toIsland(
    seed: [string, CheckinIsland['color'], number, number, string[], number, number],
): CheckinIsland {
    const [label, color, start, end, airlines, kiosk, bagdrop] = seed;

    return { label, color, ranges: [{ start, end }], booths: toBooths(airlines), kiosk, bagdrop };
}

const NA = '';

export const CHECKIN_COUNTER: Record<TerminalKind, TerminalCheckinCounter> = {
    T1: {
        total: 36,
        airlines: AIRLINES,
        islandCodes: ISLAND_CODES,
        islands: [
            toIsland(['A', 'i1', 5, 22, ['KE', 'KE', 'KE', 'KE', 'OZ', 'OZ', 'OZ', NA], 2, 2]),
            toIsland(['B', 'i2', 6, 20, ['KE', 'KE', 'KE', 'OZ', 'OZ', NA], 2, 1]),
            toIsland(['C', 'i3', 7, 19, ['OZ', 'OZ', 'KE', NA], 1, 1]),
            toIsland(['D', 'i4', 9, 17, ['OZ', 'OZ', 'OZ', 'KE', 'KE', NA], 2, 1]),
            toIsland(['E', 'i5', 11, 15, ['KE', 'KE', NA], 1, 1]),
            toIsland(['F', 'i6', 13, 15, ['OZ', NA, NA], 0, 0]),
        ],
        wait: {
            data: [
                0, 0, 0, 0, 0, 40, 120, 230, 340, 300, 250, 280, 320, 360, 300, 240, 200, 170, 140,
                100, 60, 20, 0, 0,
            ],
            max: 400,
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
        total: 36,
        airlines: AIRLINES,
        islandCodes: ISLAND_CODES,
        islands: [
            toIsland(['A', 'i1', 5, 21, ['KE', 'KE', 'KE', 'KE', 'OZ', NA], 2, 1]),
            toIsland(['B', 'i2', 7, 19, ['KE', 'KE', 'OZ', NA], 2, 1]),
            toIsland(['C', 'i3', 10, 16, ['KE', 'OZ', NA], 1, 1]),
        ],
        wait: {
            data: [
                0, 0, 0, 0, 0, 20, 60, 110, 150, 130, 110, 120, 140, 160, 130, 100, 80, 60, 45, 30,
                15, 5, 0, 0,
            ],
            max: 400,
            label: '대기인원수',
            unit: '명',
        },
        kpis: [
            { label: '평균대기', value: '9', unit: '분' },
            { label: 'P95대기', value: '7', unit: '분' },
            { label: '최대 큐인원', value: '11', unit: '명' },
            { label: '가동률', value: '61', unit: '%' },
        ],
    },
};
