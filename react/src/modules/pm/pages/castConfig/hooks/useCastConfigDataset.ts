import { useMemo } from 'react';
import { castConfigService } from '@/api/pm/services/castConfig.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { Dataset, FacilityGroupId, TerminalKind } from '../types';
import { EMPTY_CAST_CONFIG_DATASET, toCastConfigDataset } from '../view';

export interface CastConfigDatasetQuery {
    terminal: TerminalKind;
    groupId: FacilityGroupId;
    sheetName: string;
}

const DATASET_FAIL = '원본 데이터를 불러오지 못했습니다.';

export function useCastConfigDataset(query: CastConfigDatasetQuery | null): Fetched<Dataset> {
    const dataset = useFetched(
        query,
        ({ terminal, groupId, sheetName }) => castConfigService.getDataset(terminal, groupId, sheetName).then((dto) => unwrap(dto, DATASET_FAIL)),
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
