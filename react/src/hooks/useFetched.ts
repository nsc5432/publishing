import { useEffect, useRef, useState } from 'react';
import type { ApiError } from '@/types/api.types';

/** 실패해도 화면 골격은 남기고 사유만 올려보낸다 */
export interface Fetched<T> {
    data: T | null;
    error: string;
    /** 조회가 새로 끝날 때마다 늘어난다 — 사유 문구가 같아도 알럿을 다시 띄우는 데 쓴다 */
    token: number;
}

/** 아직 못 받았거나 조회 대상이 없을 때 */
export const EMPTY_FETCHED = { data: null, error: '', token: 0 };

/** 통신 실패 사유 — 서버가 준 문구가 없으면 화면이 정한 문구로 */
export function toErrorMessage(err: ApiError, fallback: string): string {
    return err?.message || fallback;
}

/**
 * 조회 조건 1개짜리 단건 조회.
 *
 * 조건(query)이 **바뀔 때마다** 다시 부른다. 여기서 '바뀐다'는 값이 아니라 참조가 기준이다.
 * 조회 버튼이 내용이 같은 조건 객체를 새로 만들어 다시 조회를 거는 화면(출국장·맵형태보기)이
 * 있어서, 값으로 비교하면 그 버튼이 동작하지 않는다.
 *
 * query 가 null 이면 조회하지 않고 빈 상태로 둔다(팝업이 닫힌 상태 등).
 *
 * 타임라인을 빠르게 옮기면 응답 순서가 뒤집힐 수 있다. 늦게 온 이전 응답은 버린다.
 */
export function useFetched<Q, T>(
    query: Q | null,
    load: (query: Q) => Promise<T>,
    failMessage: string,
): Fetched<T> {
    const [state, setState] = useState<Fetched<T>>(EMPTY_FETCHED);

    // 조회 함수는 매 렌더 새로 만들어져도 상관없도록 참조로만 들고 간다.
    // (조회를 다시 걸지 말지는 오직 query 가 정한다)
    const loadRef = useRef(load);
    const tokenRef = useRef(0);

    // 아래 조회 이펙트보다 먼저 선언해야 같은 커밋에서 최신 함수가 먼저 꽂힌다.
    useEffect(() => {
        loadRef.current = load;
    });

    useEffect(() => {
        if (query === null) {
            setState(EMPTY_FETCHED);
            return;
        }

        let isCurrent = true;

        loadRef
            .current(query)
            .then((data) => {
                if (isCurrent) setState({ data, error: '', token: ++tokenRef.current });
            })
            .catch((err: ApiError) => {
                if (isCurrent) {
                    setState({
                        data: null,
                        error: toErrorMessage(err, failMessage),
                        token: ++tokenRef.current,
                    });
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [query, failMessage]);

    return state;
}
