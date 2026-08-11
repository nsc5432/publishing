import { useMemo } from 'react';
import { unwrap } from '@/api/pm/result';
import { useFetched } from '@/hooks/useFetched';
import type { JsonResponse } from '@/types/api.types';
import { TERMINALS, type TerminalKind } from '../types';

/**
 * 탭 1개분 조회 — T1/T2 를 한 번에 받는다.
 *
 * 화면이 두 패널을 나란히 그리므로 활성 터미널만 부르면 옆 패널이 비어 버린다.
 * 조회·매핑 규칙만 탭마다 다르고 흐름은 같아서 여기 한 곳에 둔다.
 *
 * toView 는 렌더마다 새로 만들면 매핑이 끝없이 반복되므로
 * 모듈 상수(컴포넌트 밖에 선언한 함수)를 넘겨야 한다.
 */
export interface TerminalData<D, V> {
    /** 화면이 그리는 뷰 모델 */
    data: Record<TerminalKind, V | null>;
    /** 저장 요청을 만들 때 필요한 원본 DTO */
    raw: Record<TerminalKind, D | null>;
    error: string;
}

/** 두 터미널을 함께 부르는 조회 조건 — 조회 버튼(reloadKey)으로도 다시 건다 */
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

    // 진입 정보(시뮬레이션 ID)가 아직 없으면 조회할 대상이 없다.
    const query = useMemo<TerminalPairQuery | null>(
        () =>
            t1SmltId && t2SmltId ? { smltIds: { T1: t1SmltId, T2: t2SmltId }, reloadKey } : null,
        [t1SmltId, t2SmltId, reloadKey],
    );

    const state = useFetched(
        query,
        ({ smltIds: smltIdByTerminal }) =>
            Promise.all(
                TERMINALS.map((tmnlId) =>
                    fetcher(smltIdByTerminal[tmnlId], tmnlId).then((dto) =>
                        unwrap(dto, failMessage),
                    ),
                ),
            ).then((dtoList) => {
                const raw = { ...EMPTY_PAIR } as Record<TerminalKind, D | null>;
                TERMINALS.forEach((tmnlId, index) => {
                    raw[tmnlId] = dtoList[index];
                });

                return raw;
            }),
        failMessage,
    );

    return useMemo(() => {
        const raw = state.data ?? (EMPTY_PAIR as Record<TerminalKind, D | null>);
        const data = { ...EMPTY_PAIR } as Record<TerminalKind, V | null>;
        TERMINALS.forEach((tmnlId) => {
            const dto = raw[tmnlId];
            data[tmnlId] = dto ? toView(dto) : null;
        });

        return { data, raw, error: state.error };
    }, [state, toView]);
}
