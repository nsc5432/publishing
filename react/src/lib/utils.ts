import type { CongestionStatus } from '@/types/api.types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * 데이터를 특정 키 기준으로 그룹화하고 가공
 * @param source - 원본 데이터
 * @param keySelector - 그룹화 기준 콜백함수
 * @param transform - 변환 콜백함수
 */
export function group<T, K, R>(
    source: T[],
    keySelector: (item: T) => K,
    transform: (a: R, c: T) => R
): R[] {
    const map = new Map<K, R>();

    for (const item of source) {
        const key = keySelector(item);
        const existing = map.get(key);

        if (existing) {
            map.set(key, transform(existing, item));
        } else {
            map.set(key, transform({} as R, item));
        }
    }

    return [...map.values()];
}

export function calPrcsCnt(prcsHr: number) {
    if (prcsHr === 0 || prcsHr === undefined) {
        return 0;
    }

    return Math.floor(600 / prcsHr);
}

const congestionStatusOrder: CongestionStatus[] = ['VERY_BUSY', 'BUSY', 'NORMAL', 'FREE'];

export function priorCgnStatus(congestionStatusList: CongestionStatus[]): CongestionStatus {
    if (!congestionStatusList || congestionStatusList.length === 0) {
        return 'FREE';
    }

    congestionStatusList.sort((a, b) => congestionStatusOrder.indexOf(a) - congestionStatusOrder.indexOf(b))
    return congestionStatusList[0];
}