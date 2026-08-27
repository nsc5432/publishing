import { useMemo } from 'react';
import { dashboardService } from '@/api/pm/services/dashboard.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { DsbdHeaderDto } from '@/types/api.types';

const FAIL_MESSAGE = '상단 요약 정보를 불러오지 못했습니다.';

const FIXED_HHMM = '0000';

export function useIntroHeader(ymd: string): Fetched<DsbdHeaderDto> {
    const query = useMemo(() => (ymd ? { ymd, hhmm: FIXED_HHMM } : null), [ymd]);

    return useFetched(query, ({ ymd: queryYmd, hhmm }) => dashboardService.getHeader(queryYmd, hhmm).then((dto) => unwrap(dto, FAIL_MESSAGE)), FAIL_MESSAGE);
}
