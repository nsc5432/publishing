import { useMemo } from 'react';
import { castConfigService } from '@/api/pm/services/castConfig.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { FacilityGroup, TerminalKind } from '../types';
import { EMPTY_CAST_CONFIG_GROUPS, toCastConfigGroups } from '../view';

const GROUP_LIST_FAIL = 'Cast 설정 목록을 불러오지 못했습니다.';

export function useCastConfigGroups(terminal: TerminalKind): Fetched<FacilityGroup[]> {
    const query = useMemo(() => ({ terminal }), [terminal]);
    const groups = useFetched(query, ({ terminal }) => castConfigService.getGroupList(terminal).then((dto) => unwrap(dto, GROUP_LIST_FAIL)), GROUP_LIST_FAIL);

    return {
        data: groups.data ? toCastConfigGroups(groups.data) : EMPTY_CAST_CONFIG_GROUPS,
        error: groups.error,
        responseSeq: groups.responseSeq,
    };
}
