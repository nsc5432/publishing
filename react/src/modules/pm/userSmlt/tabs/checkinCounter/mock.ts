import type { TerminalKind } from '../../types';
import type { CounterCell, TerminalCheckinCounter } from './types';

/** 한 아일랜드의 카운터 개수 (상/하단 각각) */
export const COUNTER_PER_ROW = 18;

/** 아일랜드 목록 — 원본 퍼블리싱과 동일하게 I 를 건너뛴다 */
const ISLANDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N'];

/**
 * 항공사 배열(18개)을 셀 목록으로 만든다.
 * prefix 는 상단 'U' / 하단 'L' 이며 셀 id 로 쓰인다.
 */
function toCells(prefix: 'U' | 'L', airlines: string[]): CounterCell[] {
    return airlines.map((airline, i) => ({
        id: `${prefix}${i + 1}`,
        no: i + 1,
        airline,
        custom: airline === 'Custom' || undefined,
    }));
}

/** 미배정 카운터 표기 */
const NA = 'N/A';

const T1_UPPER = [
    'KE',
    'KE',
    'KE',
    'KE',
    'OZ',
    'OZ',
    'OZ',
    NA,
    NA,
    NA,
    NA,
    'LJ',
    'LJ',
    NA,
    NA,
    NA,
    NA,
    NA,
];

const T1_LOWER = [
    'KE',
    'KE',
    'KE',
    'OZ',
    'OZ',
    NA,
    NA,
    NA,
    NA,
    NA,
    'Custom',
    NA,
    NA,
    NA,
    NA,
    NA,
    NA,
    NA,
];

const T2_UPPER = [
    'KE',
    'KE',
    'KE',
    'KE',
    'KE',
    'KE',
    NA,
    NA,
    NA,
    NA,
    NA,
    NA,
    NA,
    NA,
    NA,
    NA,
    NA,
    NA,
];

const T2_LOWER = ['KE', 'KE', 'KE', NA, NA, NA, NA, NA, NA, NA, NA, NA, NA, NA, NA, NA, NA, NA];

export const CHECKIN_COUNTER: Record<TerminalKind, TerminalCheckinCounter> = {
    T1: {
        total: COUNTER_PER_ROW * 2,
        islands: ISLANDS,
        island: 'A',
        upper: toCells('U', T1_UPPER),
        lower: toCells('L', T1_LOWER),
        operating: ['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7', 'L1', 'L2', 'L3', 'L4'],
        ranges: [{ start: 6, end: 15 }],
    },
    T2: {
        total: COUNTER_PER_ROW * 2,
        islands: ISLANDS,
        island: 'A',
        upper: toCells('U', T2_UPPER),
        lower: toCells('L', T2_LOWER),
        operating: ['U1', 'U2', 'U3', 'U4', 'U5', 'U6'],
        ranges: [{ start: 7, end: 21 }],
    },
};
