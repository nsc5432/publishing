import { useMemo } from 'react';
import { mapService } from '@/api/pm/services/map.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { MapDay, TerminalKind } from '../types';
import { toMapDay } from '../view';

/**
 * 확정된 조회 조건.
 *
 * 타임라인 시각은 조건이 아니다 — 하루치를 한 번에 받아 두고 눈금은 받아 둔 슬롯에서
 * 자리만 옮긴다. 그래서 다시 조회하는 때는 터미널을 바꾸거나 조회를 누를 때뿐이다.
 */
export interface MapQuery {
    smltId: string;
    tmnlId: TerminalKind;
}

const MAP_FAIL = '맵 정보를 불러오지 못했습니다.';

/** 도면 하루치 (혼잡 알림 / 운영시간 카드 / 마커 / 상세 팝업) */
export function useSmltMap(query: MapQuery | null): Fetched<MapDay> {
    const state = useFetched(
        query,
        (mapQuery) =>
            mapService
                .getSmltMap(mapQuery.smltId, mapQuery.tmnlId)
                .then((dto) => unwrap(dto, MAP_FAIL)),
        MAP_FAIL,
    );

    return useMemo(
        () => ({
            data: state.data ? toMapDay(state.data) : null,
            error: state.error,
            token: state.token,
        }),
        [state],
    );
}
