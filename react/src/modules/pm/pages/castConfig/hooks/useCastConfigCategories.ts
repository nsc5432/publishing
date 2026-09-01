import { useMemo } from 'react';
import { castConfigService } from '@/api/pm/services/castConfig.service';
import { unwrap } from '@/api/pm/result';
import { useFetched } from '@/hooks/useFetched';
import type { Category, TerminalKind } from '../types';
import { EMPTY_CAST_CONFIG_CATEGORIES, toCastConfigCategories } from '../view';

export interface FetchedCategories {
    data: Category[];
    error: string;
    token: number;
}

export interface CastConfigCategoryQuery {
    terminal: TerminalKind;
}

const CATEGORY_LIST_FAIL = '카테고리 목록을 불러오지 못했습니다.';

export function useCastConfigCategories(query: CastConfigCategoryQuery | null): FetchedCategories {
    const categories = useFetched(
        query,
        ({ terminal }) => castConfigService.getCategoryList(terminal).then((dto) => unwrap(dto, CATEGORY_LIST_FAIL)),
        CATEGORY_LIST_FAIL,
    );

    return useMemo(
        () => ({
            data: categories.data ? toCastConfigCategories(categories.data) : EMPTY_CAST_CONFIG_CATEGORIES,
            error: categories.error,
            token: categories.token,
        }),
        [categories],
    );
}
