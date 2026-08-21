import { useMemo } from 'react';
import { chknCounterService } from '@/api/pm/services/chknCounter.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { ChknDay, TerminalKind } from '../types';
import { toChknDay } from '../view';

/**
 * 확정된 조회 조건.
 *
 * 타임라인 시각은 조건이 아니다 — 하루치를 한 번에 받아 두고 눈금은 받아 둔 슬롯에서
 * 자리만 옮긴다. 차트·표 두 보기도 같은 한 건을 나눠 쓴다.
 */
export interface ChknCounterQuery {
    smltId: string;
    tmnlId: TerminalKind;
}

const CHKN_COUNTER_FAIL = '체크인카운터 정보를 불러오지 못했습니다.';

/** 화면 하루치 (요약 · 결과 지표 · 시간대별 자원 · 30분 슬롯) */
export function useChknCounter(query: ChknCounterQuery | null): Fetched<ChknDay> {
    const state = useFetched(
        query,
        (chknQuery) =>
            chknCounterService
                .getChknCounter(chknQuery.smltId, chknQuery.tmnlId)
                .then((dto) => unwrap(dto, CHKN_COUNTER_FAIL)),
        CHKN_COUNTER_FAIL,
    );

    return useMemo(
        () => ({
            data: state.data ? toChknDay(state.data) : null,
            error: state.error,
            token: state.token,
        }),
        [state],
    );
}
