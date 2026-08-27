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

export function useUserInfo(): UserInfo | null {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    useEffect(() => {
        let isCurrent = true;

        loadUserInfo()
            .then((userInfoDto) => {
                if (isCurrent) setUserInfo(userInfoDto);
            })
            .catch((error: unknown) => {
                console.error('[사용자 정보 조회 실패]', error);
            });

        return () => {
            isCurrent = false;
        };
    }, []);

    return userInfo;
}
