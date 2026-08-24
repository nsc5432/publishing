import { useCallback, useState } from 'react';
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

    /** 원래 값으로 되돌아오면 편집분을 지운다 — 변경 개수가 스스로 0 으로 돌아온다 */
    const setValue = useCallback((key: string, value: string, original: string) => {
        setDrafts((previous) => {
            if (value !== original) return { ...previous, [key]: value };
            if (previous[key] === undefined) return previous;

            const next = { ...previous };
            delete next[key];
            return next;
        });
    }, []);

    const removeKeys = useCallback((keys: string[]) => {
        setDrafts((previous) => {
            if (!keys.some((key) => previous[key] !== undefined)) return previous;

            const next = { ...previous };
            for (const key of keys) delete next[key];
            return next;
        });
    }, []);

    const clearSheet = useCallback((sheetName: string) => {
        setDrafts((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => !key.startsWith(`${sheetName}::`))));
    }, []);

    const clearAll = useCallback(() => setDrafts({}), []);

    const toggleRow = useCallback((rowNo: number) => {
        setSelected((previous) => {
            const next = new Set(previous);
            if (next.has(rowNo)) next.delete(rowNo);
            else next.add(rowNo);
            return next;
        });
    }, []);

    const toggleAll = useCallback((rowNos: number[], checked: boolean) => {
        setSelected((previous) => {
            const next = new Set(previous);
            for (const rowNo of rowNos) {
                if (checked) next.add(rowNo);
                else next.delete(rowNo);
            }
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => setSelected(new Set()), []);

    return { drafts, setValue, removeKeys, clearSheet, clearAll, selected, toggleRow, toggleAll, clearSelection };
}
