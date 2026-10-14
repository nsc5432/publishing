import { useMemo } from 'react';
import { unwrap } from '@/api/pm/result';
import { useFetched } from '@/hooks/useFetched';
import type { JsonResponse, UserSmltQuery } from '@/types/api.types';
import { TERMINALS, type TerminalKind } from '../types';

export interface TerminalData<D, V> {
    data: Record<TerminalKind, V | null>;
    raw: Record<TerminalKind, D | null>;
    error: string;
    responseSeq: number;
}

interface TerminalPairQuery {
    source: UserSmltQuery;
    reloadKey: number;
}

const EMPTY_PAIR = { T1: null, T2: null };

export function useTerminalData<D extends JsonResponse, V>(
    source: UserSmltQuery,
    reloadKey: number,
    fetcher: (query: UserSmltQuery, tmnlId: TerminalKind) => Promise<D>,
    toView: (dto: D) => V,
    failMessage: string,
): TerminalData<D, V> {
    const { ymd, smltId } = source;
    const query = useMemo<TerminalPairQuery | null>(() => (ymd || smltId ? { source: { ymd, smltId }, reloadKey } : null), [ymd, smltId, reloadKey]);

    const fetched = useFetched(
        query,
        ({ source }) =>
            Promise.all(
                TERMINALS.map((tmnlId) => {
                    return fetcher(source, tmnlId).then((dto) => unwrap(dto, failMessage));
                }),
            ).then((dtoList) => {
                const dtoByTerminal = { ...EMPTY_PAIR } as Record<TerminalKind, D | null>;
                TERMINALS.forEach((tmnlId, index) => {
                    dtoByTerminal[tmnlId] = dtoList[index];
                });

                return dtoByTerminal;
            }),
        failMessage,
    );

    return useMemo(() => {
        const dtoByTerminal = fetched.data ?? (EMPTY_PAIR as Record<TerminalKind, D | null>);
        const viewByTerminal = { ...EMPTY_PAIR } as Record<TerminalKind, V | null>;
        TERMINALS.forEach((tmnlId) => {
            const dto = dtoByTerminal[tmnlId];
            viewByTerminal[tmnlId] = dto ? toView(dto) : null;
        });

        return {
            data: viewByTerminal,
            raw: dtoByTerminal,
            error: fetched.error,
            responseSeq: fetched.responseSeq,
        };
    }, [fetched, toView]);
}
