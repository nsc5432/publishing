import type { DayHalf } from './types';

/** 스테퍼 증감 폭 (%) */
export const RATIO_STEP = 5;
/** 스테퍼 하한 (%) */
export const MIN_RATIO = -100;
/** 스테퍼 상한 (%) */
export const MAX_RATIO = 100;

export const DAY_HALVES: { id: DayHalf; label: string }[] = [
    { id: 'AM', label: '오전' },
    { id: 'PM', label: '오후' },
];
