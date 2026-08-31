import { useEffect, useState } from 'react';
import { commonService } from '@/api/pm/services/common.service';
import { unwrap } from '@/api/pm/result';
import type { UserInfo } from '@/types/api.types';

let pendingRequest: Promise<UserInfo> | null = null;

function loadUserInfo(): Promise<UserInfo> {
    if (!pendingRequest) {
        pendingRequest = commonService
            .getUserInfoBySession()
            .then((dto) => unwrap(dto, '사용자 정보를 불러오지 못했습니다.'))
            .catch((error: unknown) => {
                pendingRequest = null;
                throw error;
            });
    }

    return pendingRequest;
}

export interface UserInfoState {
    userInfo: UserInfo | null;
    isLoaded: boolean; // 조회 실패도 완료로 본다 — 권한 판정이 로딩 중과 실패를 갈라야 한다
}

export function useUserInfo(): UserInfoState {
    const [state, setState] = useState<UserInfoState>({ userInfo: null, isLoaded: false });

    useEffect(() => {
        let isCurrent = true;

        loadUserInfo()
            .then((userInfoDto) => {
                if (isCurrent) setState({ userInfo: userInfoDto, isLoaded: true });
            })
            .catch((error: unknown) => {
                console.error('[사용자 정보 조회 실패]', error);
                if (isCurrent) setState({ userInfo: null, isLoaded: true });
            });

        return () => {
            isCurrent = false;
        };
    }, []);

    return state;
}
