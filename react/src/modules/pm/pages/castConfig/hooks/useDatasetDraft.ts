import { useRef, useState } from 'react';
import type { CastConfigSetSaveItemDto } from '@/types/api.types';
import { toCellKey, toDatasetDraftKey, toDatasetScopeKey } from '../cell';
import type { Dataset, DatasetDraftChanges, DatasetScope, DraftChanges } from '../types';
import { validateDataset } from '../view';

export interface DatasetDraft {
    drafts: DatasetDraftChanges;
    totalCount: number;
    setValue: (scope: DatasetScope, dataset: Dataset, rowNo: number, column: string, value: string, original: string) => void;
    removeKeys: (scope: DatasetScope, keys: string[]) => void;
    clearSheet: (scope: DatasetScope) => void;
    clearAll: () => void;
    values: (scope: DatasetScope) => DraftChanges;
    saveItems: () => CastConfigSetSaveItemDto[];
    validationMessages: () => string[];
}

function matchesScope(change: DatasetDraftChanges[string], scope: DatasetScope): boolean {
    return change.terminal === scope.terminal && change.groupId === scope.groupId && change.sheetName === scope.sheetName;
}

export function useDatasetDraft(): DatasetDraft {
    const [drafts, setDrafts] = useState<DatasetDraftChanges>({});
    const datasetsRef = useRef<Record<string, Dataset>>({});

    const setValue = (scope: DatasetScope, dataset: Dataset, rowNo: number, column: string, value: string, original: string) => {
        const key = toDatasetDraftKey(scope.terminal, scope.groupId, scope.sheetName, rowNo, column);
        datasetsRef.current[toDatasetScopeKey(scope.terminal, scope.groupId, scope.sheetName)] = dataset;

        setDrafts((previous) => {
            if (value !== original) return { ...previous, [key]: { ...scope, rowNo, column, value } };
            if (previous[key] === undefined) return previous;

            const nextDrafts = { ...previous };
            delete nextDrafts[key];
            return nextDrafts;
        });
    };

    const removeKeys = (scope: DatasetScope, keys: string[]) => {
        const scopedKeys = keys.map((key) => {
            const [, rowNo, column] = key.split('::');
            return toDatasetDraftKey(scope.terminal, scope.groupId, scope.sheetName, Number(rowNo), column);
        });

        setDrafts((previous) => {
            if (!scopedKeys.some((key) => previous[key] !== undefined)) return previous;

            const nextDrafts = { ...previous };
            for (const key of scopedKeys) delete nextDrafts[key];
            return nextDrafts;
        });
    };

    const clearSheet = (scope: DatasetScope) => {
        setDrafts((previous) => Object.fromEntries(Object.entries(previous).filter(([, change]) => !matchesScope(change, scope))));
        delete datasetsRef.current[toDatasetScopeKey(scope.terminal, scope.groupId, scope.sheetName)];
    };

    const clearAll = () => {
        setDrafts({});
        datasetsRef.current = {};
    };

    const values = (scope: DatasetScope): DraftChanges =>
        Object.fromEntries(
            Object.values(drafts)
                .filter((change) => matchesScope(change, scope))
                .map((change) => [toCellKey(change.sheetName, change.rowNo, change.column), change.value]),
        );

    const saveItems = (): CastConfigSetSaveItemDto[] =>
        Object.values(drafts).map((change) => ({
            tmnlId: change.terminal,
            groupId: change.groupId,
            sheetNm: change.sheetName,
            rowNo: change.rowNo,
            column: change.column,
            value: change.value,
        }));

    const validationMessages = (): string[] => {
        const scopeMap = new Map<string, DatasetScope>();
        for (const change of Object.values(drafts)) {
            const scope = { terminal: change.terminal, groupId: change.groupId, sheetName: change.sheetName };
            scopeMap.set(toDatasetScopeKey(scope.terminal, scope.groupId, scope.sheetName), scope);
        }

        return [...scopeMap.entries()].flatMap(([key, scope]) => {
            const dataset = datasetsRef.current[key];
            return dataset ? validateDataset(dataset, values(scope)) : [];
        });
    };

    return { drafts, totalCount: Object.keys(drafts).length, setValue, removeKeys, clearSheet, clearAll, values, saveItems, validationMessages };
}
