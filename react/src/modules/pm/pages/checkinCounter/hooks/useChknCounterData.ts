import { useMemo } from 'react';
import { chknCounterService } from '@/api/pm/services/chknCounter.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { ChknDay, TerminalKind } from '../types';
import { toChknDay } from '../view';

export interface ChknCounterQuery {
    smltId: string;
    tmnlId: TerminalKind;
}

const CHKN_COUNTER_FAIL = '체크인카운터 정보를 불러오지 못했습니다.';

export function useChknCounter(query: ChknCounterQuery | null): Fetched<ChknDay> {
    const fetched = useFetched(
        query,
        (chknQuery) => chknCounterService.getChknCounter(chknQuery.smltId, chknQuery.tmnlId).then((dto) => unwrap(dto, CHKN_COUNTER_FAIL)),
        CHKN_COUNTER_FAIL,
    );

    return useMemo(
        () => ({
            data: fetched.data ? toChknDay(fetched.data) : null,
            error: fetched.error,
            token: fetched.token,
        }),
        [fetched],
    );
}
