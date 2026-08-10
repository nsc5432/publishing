import { useEffect, useState } from 'react';
import { dashboardService } from '@/api/pm/services/dashboard.service';
import { unwrap } from '@/api/pm/result';
import type { ApiError, DsbdBaseInfoDto } from '@/types/api.types';

export interface BaseInfoState {
    /** 아직 못 받았거나 실패했으면 null */
    data: DsbdBaseInfoDto | null;
    loading: boolean;
    /** 실패 사유 (성공이면 '') */
    error: string;
}

const FAIL_MESSAGE = '조회 조건 기준 정보를 불러오지 못했습니다.';

/**
 * 대시보드 조회 조건 기준 정보 (시뮬레이션 ID / 계산 시각 / 선택 가능 시각).
 *
 * 화면에 들어올 때 한 번 불러 상단 바를 채우고, 여기서 받은 smltId 로 나머지 조회가 이어진다.
 * 목업/실통신 구분은 서비스가 하므로 이 훅은 늘 같은 DTO 를 다룬다.
 */
export function useBaseInfo(ymd: string): BaseInfoState {
    const [state, setState] = useState<BaseInfoState>({ data: null, loading: true, error: '' });

    useEffect(() => {
        // 기준일자를 바꿔 다시 부르는 동안 이전 응답이 뒤늦게 덮어쓰지 않도록 막는다.
        let alive = true;

        setState({ data: null, loading: true, error: '' });

        dashboardService
            .getBaseInfo(ymd)
            .then((dto) => unwrap(dto, FAIL_MESSAGE))
            .then((dto) => {
                if (alive) setState({ data: dto, loading: false, error: '' });
            })
            .catch((err: ApiError) => {
                if (alive) setState({ data: null, loading: false, error: err?.message || FAIL_MESSAGE });
            });

        return () => {
            alive = false;
        };
    }, [ymd]);

    return state;
}
