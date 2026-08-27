import { useMemo } from 'react';
import { unwrap } from '@/api/pm/result';
import { useFetched } from '@/hooks/useFetched';
import type { JsonResponse } from '@/types/api.types';
import { TERMINALS, type TerminalKind } from '../types';

export interface TerminalData<D, V> {
    data: Record<TerminalKind, V | null>;
    raw: Record<TerminalKind, D | null>;
    error: string;
    token: number;
}

interface TerminalPairQuery {
    smltIds: Record<TerminalKind, string>;
    reloadKey: number;
}

const EMPTY_PAIR = { T1: null, T2: null };

export function useTerminalData<D extends JsonResponse, V>(
    smltIds: Record<TerminalKind, string>,
    reloadKey: number,
    fetcher: (smltId: string, tmnlId: TerminalKind) => Promise<D>,
    toView: (dto: D) => V,
    failMessage: string,
): TerminalData<D, V> {
    const t1SmltId = smltIds.T1;
    const t2SmltId = smltIds.T2;

    const query = useMemo<TerminalPairQuery | null>(
        () => (t1SmltId || t2SmltId ? { smltIds: { T1: t1SmltId, T2: t2SmltId }, reloadKey } : null),
        [t1SmltId, t2SmltId, reloadKey],
    );

    const fetched = useFetched(
        query,
        ({ smltIds: smltIdByTerminal }) =>
            Promise.all(
                TERMINALS.map((tmnlId) => {
                    const smltId = smltIdByTerminal[tmnlId];
                    if (!smltId) return Promise.resolve(null);

                    return fetcher(smltId, tmnlId).then((dto) => unwrap(dto, failMessage));
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
            token: fetched.token,
        };
    }, [fetched, toView]);
}
