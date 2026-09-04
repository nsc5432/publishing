import { useMemo } from 'react';
import { depHallService } from '@/api/pm/services/depHall.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { DepDay, TerminalKind } from '../types';
import { toDepDay } from '../view';

export interface DepHallQuery {
    smltId: string;
    tmnlId: TerminalKind;
}

const DEP_HALL_FAIL = '출국장 정보를 불러오지 못했습니다.';

export function useDepHall(query: DepHallQuery | null): Fetched<DepDay> {
    const fetched = useFetched(
        query,
        (depHallQuery) => depHallService.getDepHall(depHallQuery.smltId, depHallQuery.tmnlId).then((dto) => unwrap(dto, DEP_HALL_FAIL)),
        DEP_HALL_FAIL,
    );

    return useMemo(
        () => ({
            data: fetched.data ? toDepDay(fetched.data) : null,
            error: fetched.error,
            token: fetched.token,
        }),
        [fetched],
    );
}
