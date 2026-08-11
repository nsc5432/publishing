import type { IconName } from '@/components/icons/InlineIcon';

/**
 * 화면 공용 좌측 네비게이션(LNB) 메뉴 정의.
 */
export interface NavItem {
    id: string;
    icon: IconName;
    label: string;
    path?: string;
    match?: string;
}

export const LNB_TOP: NavItem[] = [
    {
        id: 'dailySmlt',
        icon: 'chart',
        label: '일일 시뮬레이션',
        path: '/rui/pm/daily-smlt/dashboard',
        match: '/rui/pm/daily-smlt',
    },
    { id: 'userSmlt', icon: 'user', label: '사용자 시뮬레이션', path: '/rui/pm/user-smlt/config' },
    {
        id: 'monitoring',
        icon: 'monitor',
        label: '시뮬레이션 모니터링',
        path: '/rui/pm/smlt-monitoring',
    },
    { id: 'facilityMap', icon: 'pin', label: '시설물 매핑', path: '/rui/pm/fclt-map' },
];
export const LNB_BOTTOM: NavItem[] = [
    { id: 'summary', icon: 'grid', label: '요약보기', path: '/rui/pm/daily-smlt/dashboard' },
    { id: 'map', icon: 'map', label: '맵형태보기', path: '/rui/pm/daily-smlt/terminalMap' },
    { id: 'counter', icon: 'pass', label: '체크인카운터' },
    { id: 'selfCheckin', icon: 'luggage', label: '셀프체크인/백드롭' },
    {
        id: 'departure',
        icon: 'planeDep',
        label: '출국장',
        path: '/rui/pm/daily-smlt/departureHall',
    },
];

export const LNB_USER = { dept: 'TEST팀', name: '홍길동' };

export const LNB_HOME_PATH = '/rui/pm';
