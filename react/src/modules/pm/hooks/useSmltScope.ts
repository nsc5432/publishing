import { useLocation, useSearchParams } from 'react-router-dom';
import type { SmltType } from '@/types/api.types';

export type SmltView = 'dashboard' | 'terminalMap' | 'checkinCounter' | 'departureHall';

export interface SmltScope {
    smltType: SmltType;
    smltId: string;
    isUserSmlt: boolean;
    pathOf: (view: SmltView, params?: Record<string, string | undefined>) => string;
}

const HOME_PATH = '/rui/pm';

const SMLT_BASE_PATH: Record<SmltType, string> = {
    DAILY: '/rui/pm/daily-smlt',
    USER: '/rui/pm/user-smlt',
};

const USER_SMLT_VIEWS: readonly SmltView[] = ['dashboard', 'terminalMap', 'checkinCounter', 'departureHall'];

export function isDailySmltPath(pathname: string): boolean {
    return pathname === HOME_PATH || pathname.startsWith(`${SMLT_BASE_PATH.DAILY}/`);
}

function isUserSmltResultPath(pathname: string): boolean {
    return USER_SMLT_VIEWS.some((view) => pathname === `${SMLT_BASE_PATH.USER}/${view}`);
}

function toViewPath(smltType: SmltType, view: SmltView, params: Record<string, string | undefined>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) query.set(key, value);
    });

    const search = query.toString();
    const path = `${SMLT_BASE_PATH[smltType]}/${view}`;
    return search ? `${path}?${search}` : path;
}

/** 일일 결과와 사용자 결과는 같은 화면을 경로 접두어(daily-smlt / user-smlt)로 가른다. */
export function useSmltScope(): SmltScope {
    const { pathname } = useLocation();
    const [searchParams] = useSearchParams();

    const smltId = searchParams.get('smltId') ?? '';
    const smltType: SmltType = isUserSmltResultPath(pathname) || searchParams.get('smltType') === 'USER' ? 'USER' : 'DAILY';
    const isUserSmlt = smltType === 'USER';

    const pathOf = (view: SmltView, params: Record<string, string | undefined> = {}) =>
        toViewPath(smltType, view, isUserSmlt ? { smltId, ...params } : params);

    return { smltType, smltId, isUserSmlt, pathOf };
}
