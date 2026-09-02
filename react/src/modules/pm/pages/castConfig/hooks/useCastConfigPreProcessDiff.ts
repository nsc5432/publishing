import { useMemo } from 'react';
import { castConfigService } from '@/api/pm/services/castConfig.service';
import { unwrap } from '@/api/pm/result';
import { useFetched } from '@/hooks/useFetched';
import type { FacilityGroupId, PreProcessDiff, TerminalKind } from '../types';
import { EMPTY_PRE_PROCESS_DIFF, toPreProcessDiff } from '../view';

export interface FetchedPreProcessDiff {
    data: PreProcessDiff;
    error: string;
    token: number;
}

export interface PreProcessDiffQuery {
    terminal: TerminalKind;
    groupId: FacilityGroupId;
    sheetName: string;
    reloadToken: number;
}

const DIFF_FAIL = '전처리 결과를 불러오지 못했습니다.';

export function useCastConfigPreProcessDiff(query: PreProcessDiffQuery | null): FetchedPreProcessDiff {
    const diff = useFetched(
        query,
        ({ terminal, groupId, sheetName }) => castConfigService.getPreProcessDiff(terminal, groupId, sheetName).then((dto) => unwrap(dto, DIFF_FAIL)),
        DIFF_FAIL,
    );

    return useMemo(
        () => ({
            data: diff.data ? toPreProcessDiff(diff.data) : EMPTY_PRE_PROCESS_DIFF,
            error: diff.error,
            token: diff.token,
        }),
        [diff],
    );
}
