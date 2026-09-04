import { monitoringService } from '@/api/pm/services/monitoring.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { SmltExecDetailDto } from '@/types/api.types';

const FAIL_MESSAGE = '시뮬레이션 실행 정보를 불러오지 못했습니다.';

export function useExecDetail(smltId: string): Fetched<SmltExecDetailDto> {
    return useFetched(smltId || null, (targetId) => monitoringService.getExecDetail(targetId).then((dto) => unwrap(dto, FAIL_MESSAGE)), FAIL_MESSAGE);
}
