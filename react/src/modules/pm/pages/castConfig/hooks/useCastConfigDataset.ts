import { useMemo } from 'react';
import { castConfigService } from '@/api/pm/services/castConfig.service';
import { unwrap } from '@/api/pm/result';
import { useFetched } from '@/hooks/useFetched';
import type { Dataset, FacilityGroupId, TerminalKind } from '../types';
import { EMPTY_CAST_CONFIG_DATASET, toCastConfigDataset } from '../view';

/** 조회 전·실패에도 빈 데이터셋으로 내려주므로 화면은 null 을 다루지 않는다 */
export interface FetchedDataset {
    data: Dataset;
    error: string;
    token: number;
}

export interface CastConfigDatasetQuery {
    terminal: TerminalKind;
    categoryCode: string;
    groupId: FacilityGroupId;
    sheetName: string;
    /** 조건이 같아도 다시 조회해야 할 때 올린다 (저장·초기화·업로드 직후) */
    reloadToken: number;
}

const DATASET_FAIL = '원본 데이터를 불러오지 못했습니다.';

export function useCastConfigDataset(query: CastConfigDatasetQuery | null): FetchedDataset {
    const dataset = useFetched(
        query,
        ({ terminal, categoryCode, groupId, sheetName }) =>
            castConfigService.getDataset(terminal, categoryCode, groupId, sheetName).then((dto) => unwrap(dto, DATASET_FAIL)),
        DATASET_FAIL,
    );

    return useMemo(
        () => ({
            data: dataset.data ? toCastConfigDataset(dataset.data) : EMPTY_CAST_CONFIG_DATASET,
            error: dataset.error,
            token: dataset.token,
        }),
        [dataset],
    );
}
