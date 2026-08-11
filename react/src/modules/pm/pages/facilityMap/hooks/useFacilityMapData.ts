import { useMemo } from 'react';
import { fcltMapService } from '@/api/pm/services/fcltMap.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { TerminalKind } from '../types';
import { EMPTY_FACILITY_MAP, toFacilityMapData } from '../view';
import type { FacilityMapData } from '../types';

/**
 * 확정된 조회 조건.
 *
 * 조회 버튼은 조건이 그대로여도 다시 조회해야 하므로 객체를 새로 만들어 넘긴다
 * (useFetched 는 값이 아니라 참조로 비교한다).
 */
export interface FacilityMapQuery {
    terminal: TerminalKind;
}

const LIST_FAIL = '시설물 매핑 목록을 불러오지 못했습니다.';

/** 터미널 한 곳의 매핑 전량 + 도면 마커 */
export function useFacilityMap(query: FacilityMapQuery | null): Fetched<FacilityMapData> {
    const list = useFetched(
        query,
        ({ terminal }) =>
            fcltMapService.getFcltMapList(terminal).then((dto) => unwrap(dto, LIST_FAIL)),
        LIST_FAIL,
    );

    return useMemo(
        () => ({
            data: list.data ? toFacilityMapData(list.data) : EMPTY_FACILITY_MAP,
            error: list.error,
        }),
        [list],
    );
}
