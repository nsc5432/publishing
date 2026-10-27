import { useMemo } from 'react';
import { dashboardService } from '@/api/pm/services/dashboard.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { DsbdBaseInfoDto, SmltType } from '@/types/api.types';

const FAIL_MESSAGE = '조회 조건 기준 정보를 불러오지 못했습니다.';

export function useBaseInfo(
    ymd: string,
    smltId = '',
    smltType: SmltType = 'DAILY',
): Fetched<DsbdBaseInfoDto> & { isCurrent: boolean } {
    const query = useMemo(() => (ymd ? { ymd, smltId, smltType } : null), [ymd, smltId, smltType]);

    const result = useFetched(
        query,
        async (request) => ({
            query: request,
            dto: unwrap(
                await dashboardService.getBaseInfo(request.ymd, request.smltId, request.smltType),
                FAIL_MESSAGE,
            ),
        }),
        FAIL_MESSAGE,
    );

    return {
        data: result.data?.dto ?? null,
        error: result.error,
        responseSeq: result.responseSeq,
        isCurrent: result.data?.query === query,
    };
}
