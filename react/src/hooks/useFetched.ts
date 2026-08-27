import { useEffect, useRef, useState } from 'react';
import type { ApiError } from '@/types/api.types';

export interface Fetched<T> {
    data: T | null;
    error: string;
    token: number;
}

export const EMPTY_FETCHED = { data: null, error: '', token: 0 };

export function toErrorMessage(error: ApiError, fallback: string): string {
    return error?.message || fallback;
}

export function useFetched<Q, T>(query: Q | null, load: (query: Q) => Promise<T>, failMessage: string): Fetched<T> {
    const [state, setState] = useState<Fetched<T>>(EMPTY_FETCHED);

    const loadRef = useRef(load);
    const tokenRef = useRef(0);

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
            .catch((error: ApiError) => {
                if (isCurrent) {
                    setState({
                        data: null,
                        error: toErrorMessage(error, failMessage),
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
