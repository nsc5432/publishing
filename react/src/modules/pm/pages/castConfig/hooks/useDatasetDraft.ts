import { useState } from 'react';
import type { DraftChanges } from '../types';

export interface DatasetDraft {
    drafts: DraftChanges;
    setValue: (key: string, value: string, original: string) => void;
    removeKeys: (keys: string[]) => void;
    clearSheet: (sheetName: string) => void;
    clearAll: () => void;
}

export function useDatasetDraft(): DatasetDraft {
    const [drafts, setDrafts] = useState<DraftChanges>({});

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

    return { drafts, setValue, removeKeys, clearSheet, clearAll };
}
