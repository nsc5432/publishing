import { useMemo } from 'react';
import { depHallService } from '@/api/pm/services/depHall.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { DepTrend, NoticeData, TerminalDepMap, TerminalKind } from '../types';
import { toNotice, toTerminalDepMap, toTrend } from '../view';

/**
 * 확정된 조회 조건.
 *
 * 타임라인 시각(hhmm)이 조건에 들어 있어 눈금을 옮길 때마다 다시 조회한다.
 * 맵·표 보기는 한 시각의 값이라 시각이 곧 조회 조건이다.
 */
export interface DepHallQuery {
    smltId: string;
    tmnlId: TerminalKind;
    hhmm: string;
}

export interface DepHallView {
    map: TerminalDepMap;
    notice: NoticeData;
}

/** 추이 조회 조건 — 조회 시각과 무관한 하루치라 터미널까지만 본다 */
interface TrendQuery {
    smltId: string;
    tmnlId: TerminalKind;
}

const DEP_HALL_FAIL = '출국장 정보를 불러오지 못했습니다.';
const TREND_FAIL = '출국장 추이를 불러오지 못했습니다.';

/** 화면 본문 (혼잡 알림 / 출국장 카드 / 마커) */
export function useDepHall(query: DepHallQuery | null): Fetched<DepHallView> {
    const state = useFetched(
        query,
        (depHallQuery) =>
            depHallService
                .getDepHall(depHallQuery.smltId, depHallQuery.tmnlId, depHallQuery.hhmm)
                .then((dto) => unwrap(dto, DEP_HALL_FAIL)),
        DEP_HALL_FAIL,
    );

    return useMemo(() => {
        if (!state.data) return { data: null, error: state.error };

        return {
            data: { map: toTerminalDepMap(state.data), notice: toNotice(state.data.notice) },
            error: state.error,
        };
    }, [state]);
}

/**
 * 차트 보기 — 출국장별 하루 추이.
 * 조회 시각과 무관한 하루치라 터미널이 바뀔 때만 다시 받는다.
 */
export function useDepHallTrend(smltId: string, tmnlId: TerminalKind): Fetched<DepTrend> {
    const query = useMemo<TrendQuery | null>(
        () => (smltId ? { smltId, tmnlId } : null),
        [smltId, tmnlId],
    );

    const state = useFetched(
        query,
        (trendQuery) =>
            depHallService
                .getDepHallTrend(trendQuery.smltId, trendQuery.tmnlId)
                .then((dto) => unwrap(dto, TREND_FAIL)),
        TREND_FAIL,
    );

    return useMemo(
        () => ({ data: state.data ? toTrend(state.data) : null, error: state.error }),
        [state],
    );
}
