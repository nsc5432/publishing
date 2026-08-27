import { useMemo } from 'react';
import { fcltMapService } from '@/api/pm/services/fcltMap.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { TerminalKind } from '../types';
import { EMPTY_FACILITY_MAP, toFacilityMapData } from '../view';
import type { FacilityMapData } from '../types';

export interface FacilityMapQuery {
    terminal: TerminalKind;
}

const LIST_FAIL = '시설물 매핑 목록을 불러오지 못했습니다.';

export function useFacilityMap(query: FacilityMapQuery | null): Fetched<FacilityMapData> {
    const list = useFetched(query, ({ terminal }) => fcltMapService.getFcltMapList(terminal).then((dto) => unwrap(dto, LIST_FAIL)), LIST_FAIL);

    return useMemo(
        () => ({
            data: list.data ? toFacilityMapData(list.data) : EMPTY_FACILITY_MAP,
            error: list.error,
            token: list.token,
        }),
        [list],
    );
}
