import { useEffect, useState } from 'react';
import { commonService } from '@/api/pm/services/common.service';
import { unwrap } from '@/api/pm/result';
import type { UserInfo } from '@/types/api.types';

/**
 * 세션 사용자 정보 (LNB 부서 / 성명).
 *
 * LNB 는 화면을 옮길 때마다 다시 마운트되지만 사용자 정보는 세션당 한 번이면 된다.
 * 요청을 모듈 수준에 담아 두고 나눠 쓴다.
 */
let pending: Promise<UserInfo> | null = null;

function loadUserInfo(): Promise<UserInfo> {
    if (!pending) {
        pending = commonService
            .getUserInfoBySession()
            .then((dto) => unwrap(dto, '사용자 정보를 불러오지 못했습니다.'))
            .catch((err: unknown) => {
                // 실패까지 담아 두면 이후 어느 화면에서도 다시 시도하지 못한다.
                pending = null;
                throw err;
            });
    }

    return pending;
}

/** 아직 못 받았거나 실패했으면 null (호출부가 기본 표기로 버틴다) */
export function useUserInfo(): UserInfo | null {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    useEffect(() => {
        let alive = true;

        loadUserInfo()
            .then((dto) => {
                if (alive) setUserInfo(dto);
            })
            .catch((err: unknown) => {
                // 사용자 정보는 화면을 막을 만한 정보가 아니라 조용히 기본 표기로 둔다.
                console.error('[사용자 정보 조회 실패]', err);
            });

        return () => {
            alive = false;
        };
    }, []);

    return userInfo;
}
