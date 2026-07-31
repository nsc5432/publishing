import type { IconName } from '@/modules/pm/pages/dashboard/components/PmIcons';

/**
 * 화면 공용 좌측 네비게이션(LNB) 메뉴 정의.
 * 대시보드 / 맵 형태 조회 등 PM 화면이 같은 레일을 공유한다.
 * 상단 그룹의 활성 표시는 현재 경로에서 끌어오므로(Lnb.tsx) 화면이 넘길 값은 없다.
 */
export interface NavItem {
    id: string;
    icon: IconName;
    /** 아이콘 마우스 오버 시 노출되는 메뉴명 */
    label: string;
    /** 이동할 경로. 없으면 아직 화면이 없는 메뉴라 이동하지 않는다. */
    path?: string;
}

/** 상단 그룹 : 활성 시 원형 배경으로 강조 (현재 경로 기준) */
export const LNB_TOP: NavItem[] = [
    { id: 'dashboard', icon: 'chart', label: '대시보드', path: '/rui/pm/daily-smlt/dashboard' },
    {
        id: 'terminalMap',
        icon: 'map',
        label: '맵 형태 조회',
        path: '/rui/pm/daily-smlt/terminalMap',
    },
    {
        id: 'userSmlt',
        icon: 'user',
        label: '사용자 시뮬레이션',
        path: '/rui/pm/user-smlt/config',
    },

    { id: 'monitor', icon: 'monitor', label: '실시간 모니터링' },
    { id: 'pin', icon: 'pin', label: '시설 현황' },
];

/** 하단 그룹 : 활성 시 아이콘 색상으로 강조 */
export const LNB_BOTTOM: NavItem[] = [
    { id: 'grid', icon: 'grid', label: '표 형태 조회' },
    { id: 'map', icon: 'map', label: '맵 형태 조회' },
    { id: 'pass', icon: 'pass', label: '출국장 현황' },
    { id: 'luggage', icon: 'luggage', label: '수하물 현황' },
    { id: 'planeline', icon: 'planeline', label: '운항 스케줄' },
];

/** 레일 맨 아래 고정 항목 */
export const LNB_LOGOUT: NavItem = { id: 'logout', icon: 'logout', label: '로그아웃' };

/** 화면이 없어 기본 진입하는 경로(= 대시보드) */
export const LNB_HOME_PATH = '/rui/pm';
