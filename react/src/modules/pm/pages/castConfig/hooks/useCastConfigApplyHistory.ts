import { useMemo } from 'react';
import { castConfigService } from '@/api/pm/services/castConfig.service';
import { unwrap } from '@/api/pm/result';
import { useFetched } from '@/hooks/useFetched';
import type { ApplySetHistory } from '../types';
import { EMPTY_APPLY_SET_HISTORIES, toApplySetHistories } from '../view';

export interface FetchedApplyHistory {
    data: ApplySetHistory[];
    error: string;
    token: number;
}

export interface ApplyHistoryQuery {
    reloadToken: number;
}

const HISTORY_FAIL = '반영 이력을 불러오지 못했습니다.';

export function useCastConfigApplyHistory(query: ApplyHistoryQuery | null): FetchedApplyHistory {
    const history = useFetched(query, () => castConfigService.getApplySetHistory().then((dto) => unwrap(dto, HISTORY_FAIL)), HISTORY_FAIL);

    return useMemo(
        () => ({
            data: history.data ? toApplySetHistories(history.data) : EMPTY_APPLY_SET_HISTORIES,
            error: history.error,
            token: history.token,
        }),
        [history],
    );
}
