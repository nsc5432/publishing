import { useMemo } from 'react';
import { cmrcSalesService } from '@/api/pm/services/cmrcSales.service';
import { mapService } from '@/api/pm/services/map.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { CmrcSalesDto, SmltMapDto } from '@/types/api.types';
import type { MapDay, TerminalKind } from '../types';
import { toMapDay } from '../view';

export interface MapQuery {
    smltId: string;
    tmnlId: TerminalKind;
    /** 매출 실적 기준일자 */
    ymd: string;
}

interface MapResponse {
    map: SmltMapDto;
    sales: CmrcSalesDto | null;
}

const MAP_FAIL = '맵 정보를 불러오지 못했습니다.';
const SALES_FAIL = '매출 정보를 불러오지 못했습니다.';

async function fetchMap(query: MapQuery): Promise<MapResponse> {
    const [map, sales] = await Promise.all([
        mapService.getSmltMap(query.smltId, query.tmnlId).then((dto) => unwrap(dto, MAP_FAIL)),
        // 매출은 부가 정보라 실패해도 도면은 그린다
        cmrcSalesService
            .getIslandSales(query.ymd, query.tmnlId)
            .then((dto) => unwrap(dto, SALES_FAIL))
            .catch(() => null),
    ]);

    return { map, sales };
}

export function useSmltMap(query: MapQuery | null): Fetched<MapDay> {
    const fetched = useFetched(query, fetchMap, MAP_FAIL);

    return useMemo(
        () => ({
            data: fetched.data ? toMapDay(fetched.data.map, fetched.data.sales) : null,
            error: fetched.error,
            responseSeq: fetched.responseSeq,
        }),
        [fetched],
    );
}
