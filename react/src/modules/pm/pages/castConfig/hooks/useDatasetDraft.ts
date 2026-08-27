import { useState } from 'react';
import type { DraftChanges } from '../types';

export interface DatasetDraft {
    drafts: DraftChanges;
    setValue: (key: string, value: string, original: string) => void;
    removeKeys: (keys: string[]) => void;
    clearSheet: (sheetName: string) => void;
    clearAll: () => void;
    selected: Set<number>;
    toggleRow: (rowNo: number) => void;
    toggleAll: (rowNos: number[], checked: boolean) => void;
    clearSelection: () => void;
}

export function useDatasetDraft(): DatasetDraft {
    const [drafts, setDrafts] = useState<DraftChanges>({});
    const [selected, setSelected] = useState<Set<number>>(() => new Set());

    const setValue = (key: string, value: string, original: string) => {
        setDrafts((previous) => {
            if (value !== original) return { ...previous, [key]: value };
            if (previous[key] === undefined) return previous;

            const nextDrafts = { ...previous };
            delete nextDrafts[key];
            return nextDrafts;
        });
    };

    const removeKeys = (keys: string[]) => {
        setDrafts((previous) => {
            if (!keys.some((key) => previous[key] !== undefined)) return previous;

            const nextDrafts = { ...previous };
            for (const key of keys) delete nextDrafts[key];
            return nextDrafts;
        });
    };

    const clearSheet = (sheetName: string) => {
        setDrafts((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => !key.startsWith(`${sheetName}::`))));
    };

    const clearAll = () => setDrafts({});

    const toggleRow = (rowNo: number) => {
        setSelected((previous) => {
            const nextSelection = new Set(previous);
            if (nextSelection.has(rowNo)) nextSelection.delete(rowNo);
            else nextSelection.add(rowNo);
            return nextSelection;
        });
    };

    const toggleAll = (rowNos: number[], checked: boolean) => {
        setSelected((previous) => {
            const nextSelection = new Set(previous);
            for (const rowNo of rowNos) {
                if (checked) nextSelection.add(rowNo);
                else nextSelection.delete(rowNo);
            }
            return nextSelection;
        });
    };

    const clearSelection = () => setSelected(new Set());

    return { drafts, setValue, removeKeys, clearSheet, clearAll, selected, toggleRow, toggleAll, clearSelection };
}
