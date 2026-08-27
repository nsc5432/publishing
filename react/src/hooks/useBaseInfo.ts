import { useMemo } from 'react';
import { dashboardService } from '@/api/pm/services/dashboard.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { DsbdBaseInfoDto } from '@/types/api.types';

const FAIL_MESSAGE = '조회 조건 기준 정보를 불러오지 못했습니다.';

export function useBaseInfo(ymd: string, smltId = ''): Fetched<DsbdBaseInfoDto> {
    const query = useMemo(() => (ymd ? { ymd, smltId } : null), [ymd, smltId]);

    return useFetched(
        query,
        ({ ymd: baseYmd, smltId: targetId }) => dashboardService.getBaseInfo(baseYmd, targetId).then((dto) => unwrap(dto, FAIL_MESSAGE)),
        FAIL_MESSAGE,
    );
}
