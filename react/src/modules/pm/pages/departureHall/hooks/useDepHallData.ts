import { useMemo } from 'react';
import { depHallService } from '@/api/pm/services/depHall.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { DepDay, TerminalKind } from '../types';
import { toDepDay } from '../view';

/**
 * 확정된 조회 조건.
 *
 * 타임라인 시각은 조건이 아니다 — 하루치를 한 번에 받아 두고 눈금은 받아 둔 슬롯에서
 * 자리만 옮긴다. 맵·표·차트 세 보기도 같은 한 건을 나눠 쓴다.
 */
export interface DepHallQuery {
    smltId: string;
    tmnlId: TerminalKind;
}

const DEP_HALL_FAIL = '출국장 정보를 불러오지 못했습니다.';

/** 화면 하루치 (혼잡 알림 / 출국장 카드 / 마커 / 추이) */
export function useDepHall(query: DepHallQuery | null): Fetched<DepDay> {
    const state = useFetched(
        query,
        (depHallQuery) =>
            depHallService
                .getDepHall(depHallQuery.smltId, depHallQuery.tmnlId)
                .then((dto) => unwrap(dto, DEP_HALL_FAIL)),
        DEP_HALL_FAIL,
    );

    return useMemo(
        () => ({
            data: state.data ? toDepDay(state.data) : null,
            error: state.error,
            token: state.token,
        }),
        [state],
    );
}
