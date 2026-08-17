import { useMemo } from 'react';
import { dashboardService } from '@/api/pm/services/dashboard.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { DsbdBaseInfoDto } from '@/types/api.types';

const FAIL_MESSAGE = '조회 조건 기준 정보를 불러오지 못했습니다.';

/**
 * 조회 조건 기준 정보 (시뮬레이션 ID / 계산 시각 / 선택 가능 시각).
 *
 * 화면에 들어올 때 한 번 불러 상단 바를 채우고, 여기서 받은 smltId 로 나머지 조회가 이어진다.
 * 목업/실통신 구분은 서비스가 하므로 이 훅은 늘 같은 DTO 를 다룬다.
 * 요약보기 · 맵형태보기 · 출국장 세 화면이 함께 쓴다.
 *
 * `smltId` 는 볼 시뮬레이션을 지목할 때만 넘긴다 — 모니터링에서 이력 1건을 눌러 들어온 경우다.
 * 넘기지 않으면 지금까지처럼 기준일자에 해당하는 일일 시뮬레이션을 받는다.
 */
export function useBaseInfo(ymd: string, smltId = ''): Fetched<DsbdBaseInfoDto> {
    // 조건이 둘이라 객체로 묶는다 — 빈 기준일자면 조회하지 않는다.
    const query = useMemo(() => (ymd ? { ymd, smltId } : null), [ymd, smltId]);

    return useFetched(
        query,
        ({ ymd: baseYmd, smltId: targetId }) =>
            dashboardService
                .getBaseInfo(baseYmd, targetId)
                .then((dto) => unwrap(dto, FAIL_MESSAGE)),
        FAIL_MESSAGE,
    );
}
