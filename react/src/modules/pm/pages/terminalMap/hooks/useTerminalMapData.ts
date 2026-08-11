import { useMemo } from 'react';
import { mapService } from '@/api/pm/services/map.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
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

export interface MapView {
    summary: HeaderSummary;
    notice: NoticeData;
    operCards: OperCard[];
    map: TerminalMapData;
}

/** 마커를 눌렀을 때의 상세 조회 조건 — 고른 대상이 없으면 조회하지 않는다 */
interface DetailQuery {
    query: MapQuery;
    target: string;
}

const MAP_FAIL = '맵 정보를 불러오지 못했습니다.';
const ISLAND_FAIL = '아일랜드 상세 정보를 불러오지 못했습니다.';
const DEP_FAIL = '출국장 상세 정보를 불러오지 못했습니다.';

/** 마커 상세 조회 조건 — 도면 조건과 고른 대상이 모두 있을 때만 만든다 */
function useDetailQuery(query: MapQuery | null, target: string | null): DetailQuery | null {
    return useMemo(() => (query && target ? { query, target } : null), [query, target]);
}

/** 도면 본문 (혼잡 알림 / 운영시간 카드 / 마커) */
export function useSmltMap(query: MapQuery | null): Fetched<MapView> {
    const state = useFetched(
        query,
        (mapQuery) =>
            mapService
                .getSmltMap(mapQuery.smltId, mapQuery.tmnlId, mapQuery.hhmm)
                .then((dto) => unwrap(dto, MAP_FAIL)),
        MAP_FAIL,
    );

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
export function useIslandDetail(
    query: MapQuery | null,
    island: string | null,
): Fetched<IslandDetail> {
    return useFetched(
        useDetailQuery(query, island),
        ({ query: mapQuery, target }) =>
            mapService
                .getChknDetail(mapQuery.smltId, mapQuery.tmnlId, target, mapQuery.hhmm)
                .then((dto) => toIslandDetail(unwrap(dto, ISLAND_FAIL))),
        ISLAND_FAIL,
    );
}

/** 출국장 마커 클릭 — 미니 팝업 */
export function useDepDetail(
    query: MapQuery | null,
    depNum: string | null,
): Fetched<FacilityDetail> {
    return useFetched(
        useDetailQuery(query, depNum),
        ({ query: mapQuery, target }) =>
            mapService
                .getDepDetail(mapQuery.smltId, mapQuery.tmnlId, target, mapQuery.hhmm)
                .then((dto) => toFacilityDetail(unwrap(dto, DEP_FAIL))),
        DEP_FAIL,
    );
}
