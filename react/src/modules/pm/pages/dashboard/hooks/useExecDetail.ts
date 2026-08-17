import { useMemo } from 'react';
import { monitoringService } from '@/api/pm/services/monitoring.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { SmltExecDetailDto } from '@/types/api.types';

const FAIL_MESSAGE = '시뮬레이션 실행 정보를 불러오지 못했습니다.';

/**
 * 시뮬레이션 실행 이력 1건 (부서 · 성명 · 대상 터미널).
 *
 * 사용자 시뮬레이션은 `누가 돌렸는지`를 함께 보여야 하는데 기준 정보(DsbdBaseInfoDto)에는
 * 그 값이 없다. 모니터링이 쓰는 이력 상세를 그대로 빌려 쓴다.
 *
 * smltId 가 빈 값이면(= 일일 시뮬레이션이거나 지목된 시뮬레이션이 없으면) 조회하지 않는다.
 * 화면의 보조 정보라 실패해도 대시보드 본문은 그대로 그린다 — 알럿에 합치지 않는다.
 */
export function useExecDetail(smltId: string): Fetched<SmltExecDetailDto> {
    const query = useMemo(() => smltId || null, [smltId]);

    return useFetched(
        query,
        (targetId) =>
            monitoringService.getExecDetail(targetId).then((dto) => unwrap(dto, FAIL_MESSAGE)),
        FAIL_MESSAGE,
    );
}
