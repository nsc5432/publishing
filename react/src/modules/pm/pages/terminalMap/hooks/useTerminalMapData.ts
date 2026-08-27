import { useMemo } from 'react';
import { mapService } from '@/api/pm/services/map.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { MapDay, TerminalKind } from '../types';
import { toMapDay } from '../view';

export interface MapQuery {
    smltId: string;
    tmnlId: TerminalKind;
}

const MAP_FAIL = '맵 정보를 불러오지 못했습니다.';

export function useSmltMap(query: MapQuery | null): Fetched<MapDay> {
    const fetched = useFetched(query, (mapQuery) => mapService.getSmltMap(mapQuery.smltId, mapQuery.tmnlId).then((dto) => unwrap(dto, MAP_FAIL)), MAP_FAIL);

    return useMemo(
        () => ({
            data: fetched.data ? toMapDay(fetched.data) : null,
            error: fetched.error,
            token: fetched.token,
        }),
        [fetched],
    );
}
