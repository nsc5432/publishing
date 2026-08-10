import { useEffect, useMemo, useState } from 'react';
import { mapService } from '@/api/pm/services/map.service';
import { unwrap } from '@/api/pm/result';
import type { ApiError, SmltMapDto } from '@/types/api.types';
import type {
    FacilityDetail,
    HeaderSummary,
    IslandDetail,
    NoticeData,
    OperCard,
    TerminalKind,
    TerminalMapData,
} from '../types';
import {
    EMPTY_MAP_DATA,
    EMPTY_NOTICE,
    EMPTY_SUMMARY,
    toFacilityDetail,
    toIslandDetail,
    toNotice,
    toOperCards,
    toSummary,
    toTerminalMapData,
} from '../view';

/**
 * 확정된 조회 조건.
 * 타임라인 시각(hhmm)이 조건에 들어 있어 눈금을 옮길 때마다 도면을 다시 조회한다.
 */
export interface MapQuery {
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

const MAP_FAIL = '맵 정보를 불러오지 못했습니다.';
const ISLAND_FAIL = '아일랜드 상세 정보를 불러오지 못했습니다.';
const DEP_FAIL = '출국장 상세 정보를 불러오지 못했습니다.';

export interface MapView {
    summary: HeaderSummary;
    notice: NoticeData;
    operCards: OperCard[];
    map: TerminalMapData;
}

/** 도면 본문 (혼잡 알림 / 운영시간 카드 / 마커) */
export function useSmltMap(query: MapQuery | null): Fetched<MapView> {
    const [state, setState] = useState<Fetched<SmltMapDto>>(EMPTY);

    useEffect(() => {
        if (!query) return;

        // 타임라인을 빠르게 옮기면 응답 순서가 뒤집힐 수 있다. 늦게 온 이전 응답은 버린다.
        let alive = true;

        mapService
            .getSmltMap(query.smltId, query.tmnlId, query.hhmm)
            .then((dto) => unwrap(dto, MAP_FAIL))
            .then((dto) => {
                if (alive) setState({ data: dto, error: '' });
            })
            .catch((err: ApiError) => {
                if (alive) setState({ data: null, error: message(err, MAP_FAIL) });
            });

        return () => {
            alive = false;
        };
    }, [query]);

    return useMemo(() => {
        if (!state.data) return { data: null, error: state.error };

        return {
            data: {
                summary: toSummary(state.data.summary),
                notice: toNotice(state.data.notice),
                operCards: toOperCards(state.data.operCardList),
                map: toTerminalMapData(state.data),
            },
            error: state.error,
        };
    }, [state]);
}

/**
 * 아일랜드 마커 클릭 — 상세 팝업.
 * 고른 아일랜드가 없으면 조회하지 않는다(팝업이 닫힌 상태).
 */
export function useIslandDetail(query: MapQuery | null, island: string | null): Fetched<IslandDetail> {
    const [state, setState] = useState<Fetched<IslandDetail>>(EMPTY);

    useEffect(() => {
        if (!query || !island) {
            setState(EMPTY);
            return;
        }

        let alive = true;

        mapService
            .getChknDetail(query.smltId, query.tmnlId, island, query.hhmm)
            .then((dto) => unwrap(dto, ISLAND_FAIL))
            .then((dto) => {
                if (alive) setState({ data: toIslandDetail(dto), error: '' });
            })
            .catch((err: ApiError) => {
                if (alive) setState({ data: null, error: message(err, ISLAND_FAIL) });
            });

        return () => {
            alive = false;
        };
    }, [query, island]);

    return state;
}

/** 출국장 마커 클릭 — 미니 팝업 */
export function useDepDetail(query: MapQuery | null, depNum: string | null): Fetched<FacilityDetail> {
    const [state, setState] = useState<Fetched<FacilityDetail>>(EMPTY);

    useEffect(() => {
        if (!query || !depNum) {
            setState(EMPTY);
            return;
        }

        let alive = true;

        mapService
            .getDepDetail(query.smltId, query.tmnlId, depNum, query.hhmm)
            .then((dto) => unwrap(dto, DEP_FAIL))
            .then((dto) => {
                if (alive) setState({ data: toFacilityDetail(dto), error: '' });
            })
            .catch((err: ApiError) => {
                if (alive) setState({ data: null, error: message(err, DEP_FAIL) });
            });

        return () => {
            alive = false;
        };
    }, [query, depNum]);

    return state;
}

export { EMPTY_MAP_DATA, EMPTY_NOTICE, EMPTY_SUMMARY };
