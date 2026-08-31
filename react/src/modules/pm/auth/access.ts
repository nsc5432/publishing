import type { NavItem } from '@/components/lnb';

/**
 * 화면 접근 권한. 롤은 합집합으로 평가한다 (한 사용자가 여러 롤을 갖는다).
 * 매출 정보는 여기서 다루지 않는다 — 서버가 응답에서 빼 준다.
 */

export const PM_ROLE = {
    BASIC: 'PMR0001',
    OPER_CENTER: 'PMR0002',
    OPER_PLAN: 'PMR0003',
    SALES: 'PMR0004',
    FORECAST: 'PMR0005',
    SYS_ADMIN: 'PMR0006',
} as const;

const SMLT_ROLES = [
    PM_ROLE.OPER_CENTER,
    PM_ROLE.OPER_PLAN,
    PM_ROLE.SALES,
    PM_ROLE.FORECAST,
    PM_ROLE.SYS_ADMIN,
];
const FCLT_MAP_ROLES = [PM_ROLE.OPER_CENTER, PM_ROLE.OPER_PLAN, PM_ROLE.SYS_ADMIN];
const CAST_CONFIG_ROLES = [PM_ROLE.SYS_ADMIN];

const PATH_ROLES: Record<string, readonly string[]> = {
    '/rui/pm': SMLT_ROLES,
    '/rui/pm/daily-smlt/dashboard': SMLT_ROLES,
    '/rui/pm/daily-smlt/terminalMap': SMLT_ROLES,
    '/rui/pm/daily-smlt/checkinCounter': SMLT_ROLES,
    '/rui/pm/daily-smlt/departureHall': SMLT_ROLES,
    '/rui/pm/user-smlt/config': SMLT_ROLES,
    '/rui/pm/smlt-monitoring': SMLT_ROLES,
    '/rui/pm/fclt-map': FCLT_MAP_ROLES,
    '/rui/pm/cast-config': CAST_CONFIG_ROLES,
};

export function canAccessPath(roleIdList: string[], pathname: string): boolean {
    const allowed = PATH_ROLES[pathname];

    return allowed ? allowed.some((role) => roleIdList.includes(role)) : false;
}

export function hasAnyAccess(roleIdList: string[]): boolean {
    return Object.keys(PATH_ROLES).some((path) => canAccessPath(roleIdList, path));
}

export function filterNavItems(roleIdList: string[], items: NavItem[]): NavItem[] {
    return items.reduce<NavItem[]>((result, item) => {
        const children = item.children ? filterNavItems(roleIdList, item.children) : undefined;

        if (item.children && !children?.length) return result;
        if (item.path && !canAccessPath(roleIdList, item.path)) return result;

        result.push(children ? { ...item, children } : item);
        return result;
    }, []);
}
