import { useEffect, useMemo, useState } from 'react';
import { depHallService } from '@/api/pm/services/depHall.service';
import { unwrap } from '@/api/pm/result';
import type { ApiError, DepHallDto, DepHallTrendDto } from '@/types/api.types';
import type { DepTrend, NoticeData, TerminalDepMap, TerminalKind } from '../types';
import { EMPTY_DEP_MAP, EMPTY_NOTICE, EMPTY_TREND, toNotice, toTerminalDepMap, toTrend } from '../view';

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

/** 실패해도 화면 골격은 남기고 사유만 올려보낸다 */
interface Fetched<T> {
    data: T | null;
    error: string;
}

const EMPTY = { data: null, error: '' };

const message = (err: ApiError, fallback: string) => err?.message || fallback;

const DEP_HALL_FAIL = '출국장 정보를 불러오지 못했습니다.';
const TREND_FAIL = '출국장 추이를 불러오지 못했습니다.';

export interface DepHallView {
    map: TerminalDepMap;
    notice: NoticeData;
}

/** 화면 본문 (혼잡 알림 / 출국장 카드 / 마커) */
export function useDepHall(query: DepHallQuery | null): Fetched<DepHallView> {
    const [state, setState] = useState<Fetched<DepHallDto>>(EMPTY);

    useEffect(() => {
        if (!query) return;

        // 타임라인을 빠르게 옮기면 응답 순서가 뒤집힐 수 있다. 늦게 온 이전 응답은 버린다.
        let alive = true;

        depHallService
            .getDepHall(query.smltId, query.tmnlId, query.hhmm)
            .then((dto) => unwrap(dto, DEP_HALL_FAIL))
            .then((dto) => {
                if (alive) setState({ data: dto, error: '' });
            })
            .catch((err: ApiError) => {
                if (alive) setState({ data: null, error: message(err, DEP_HALL_FAIL) });
            });

        return () => {
            alive = false;
        };
    }, [query]);

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
    const [state, setState] = useState<Fetched<DepHallTrendDto>>(EMPTY);

    useEffect(() => {
        if (!smltId) return;

        let alive = true;

        depHallService
            .getDepHallTrend(smltId, tmnlId)
            .then((dto) => unwrap(dto, TREND_FAIL))
            .then((dto) => {
                if (alive) setState({ data: dto, error: '' });
            })
            .catch((err: ApiError) => {
                if (alive) setState({ data: null, error: message(err, TREND_FAIL) });
            });

        return () => {
            alive = false;
        };
    }, [smltId, tmnlId]);

    return useMemo(
        () => ({ data: state.data ? toTrend(state.data) : null, error: state.error }),
        [state],
    );
}

export { EMPTY_DEP_MAP, EMPTY_NOTICE, EMPTY_TREND };
