export function groupByHourInterval<T, R>(
    data: (T & { time: string })[],
    intervalHour: number,
    getValue: (item: T) => number,
    createResult: (time: string, maxItem: T | null) => R
): R[] {
    const map: Record<string, T | null> = {};

    // 초기화
    for (let h = 0; h < 24; h += intervalHour) {
        const key = h.toString().padStart(2, '0') + '00';
        map[key] = null;
    }

    data.forEach(item => {
        const timeStr = item.time;
        const hh = Number(timeStr.substring(0, 2));
        const baseHour = Math.floor(hh / intervalHour) * intervalHour;
        const key = String(baseHour).padStart(2, '0') + '00';

        if (map.hasOwnProperty(key)) {
            const currentMaxItem = map[key];

            if (!currentMaxItem || getValue(item) > getValue(currentMaxItem)) {
                map[key] = item;
            }
        }
    });

    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([time, maxItem]) => createResult(time, maxItem));
}

export function mergeTimeArr<T extends { time: string }, U extends { time: string }>(
    arr1: T[],
    arr2: U[],
    defaultA: Partial<T>,
    defaultB: Partial<U>,
) {
    const mergeMap = new Map<string, T & U>();

    arr1.forEach(item => mergeMap.set(item.time, { ...defaultB, ...item } as T & U));

    arr2.forEach(item => {
        const existing = mergeMap.get(item.time);

        if (existing) {
            // 이미 키가 있으면 병합
            mergeMap.set(item.time, { ...existing, ...item });
        } else {
            // 없으면 기본값과 함께 추가
            mergeMap.set(item.time, { ...defaultA, ...item } as T & U);
        }
    })

    return [...mergeMap.values()].sort((a, b) => a.time.localeCompare(b.time));
}