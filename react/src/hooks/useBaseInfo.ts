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
): Fetched<DsbdBaseInfoDto> {
    const query = useMemo(() => (ymd ? { ymd, smltId, smltType } : null), [ymd, smltId, smltType]);

    return useFetched(
        query,
        ({ ymd: baseYmd, smltId: targetId, smltType: targetType }) =>
            dashboardService
                .getBaseInfo(baseYmd, targetId, targetType)
                .then((dto) => unwrap(dto, FAIL_MESSAGE)),
        FAIL_MESSAGE,
    );
}
