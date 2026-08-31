import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Lnb } from '@/components/lnb';
import { useUserInfo } from '@/hooks/useUserInfo';
import { canAccessPath, hasAnyAccess } from './access';
import { NoAccess } from './NoAccess';

interface AccessGuardProps {
    children: ReactNode;
}

const DENIED_ALL = {
    title: 'PM 예측관리 접근 권한이 없습니다.',
    description: '권한이 필요하면 시스템 관리자에게 문의해 주세요.',
};

const DENIED_PAGE = {
    title: '이 화면에 접근할 권한이 없습니다.',
    description: '왼쪽 메뉴에서 접근 가능한 화면을 선택해 주세요.',
};

export function AccessGuard({ children }: AccessGuardProps) {
    const { pathname } = useLocation();
    const { userInfo, isLoaded } = useUserInfo();

    if (!isLoaded) return null;

    const roleIdList = userInfo?.roleIdList ?? [];

    if (!hasAnyAccess(roleIdList)) {
        return (
            <div className="no-access-shell">
                <NoAccess {...DENIED_ALL} />
            </div>
        );
    }

    if (!canAccessPath(roleIdList, pathname)) {
        return (
            <div className="no-access-shell">
                <Lnb />
                <NoAccess {...DENIED_PAGE} />
            </div>
        );
    }

    return <>{children}</>;
}
