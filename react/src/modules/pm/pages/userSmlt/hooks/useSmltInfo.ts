import { useEffect, useRef, useState } from 'react';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { unwrap } from '@/api/pm/result';
import type { ApiError } from '@/types/api.types';
import { TERMINALS } from '../types';

export interface SmltInfoState {
    ymd: string;
    saveDt: string;
    error: string;
    token: number;
}

const FAIL_MESSAGE = '사용자 시뮬레이션 정보를 불러오지 못했습니다.';

const EMPTY: SmltInfoState = {
    ymd: '',
    saveDt: '',
    error: '',
    token: 0,
};

export function useSmltInfo(ymd: string, reloadKey = 0): SmltInfoState {
    const [state, setState] = useState<SmltInfoState>(EMPTY);
    const tokenRef = useRef(0);

    useEffect(() => {
        if (!ymd) {
            setState(EMPTY);
            return;
        }

        let isCurrent = true;

        Promise.all(TERMINALS.map((tmnlId) => userSmltService.getInfo(ymd, tmnlId).then((dto) => unwrap(dto, FAIL_MESSAGE))))
            .then((infoList) => {
                if (!isCurrent) return;

                setState({
                    ymd: infoList[0].ymd,
                    saveDt:
                        infoList
                            .map((info) => info.saveDt)
                            .sort()
                            .at(-1) ?? '',
                    error: '',
                    token: ++tokenRef.current,
                });
            })
            .catch((error: ApiError) => {
                if (isCurrent) {
                    setState({
                        ...EMPTY,
                        error: error?.message || FAIL_MESSAGE,
                        token: ++tokenRef.current,
                    });
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [ymd, reloadKey]);

    return state;
}
