import type { IconName } from '@/components/icons/InlineIcon';

export interface NavItem {
    id: string;
    icon: IconName;
    label: string;
    path?: string;
    match?: string;
    children?: NavItem[];
}

export const LNB_DAILY_SMLT: NavItem[] = [
    { id: 'summary', icon: 'grid', label: '요약보기', path: '/rui/pm/daily-smlt/dashboard' },
    { id: 'map', icon: 'map', label: '맵형태보기', path: '/rui/pm/daily-smlt/terminalMap' },
    {
        id: 'counter',
        icon: 'pass',
        label: '체크인카운터',
        path: '/rui/pm/daily-smlt/checkinCounter',
    },
    {
        id: 'departure',
        icon: 'planeDep',
        label: '출국장',
        path: '/rui/pm/daily-smlt/departureHall',
    },
];

export const LNB_TOP: NavItem[] = [
    {
        id: 'dailySmlt',
        icon: 'chart',
        label: '일일 시뮬레이션',
        path: '/rui/pm/daily-smlt/dashboard',
        match: '/rui/pm/daily-smlt',
        children: LNB_DAILY_SMLT,
    },
    { id: 'userSmlt', icon: 'user', label: '사용자 시뮬레이션', path: '/rui/pm/user-smlt/config' },
    {
        id: 'monitoring',
        icon: 'monitor',
        label: '시뮬레이션 모니터링',
        path: '/rui/pm/smlt-monitoring',
    },
    { id: 'facilityMap', icon: 'pin', label: '시설물 매핑', path: '/rui/pm/fclt-map' },
    {
        id: 'castConfig',
        icon: 'dataLink',
        label: 'Cast 설정',
        path: '/rui/pm/cast-config',
    },
];
export const LNB_USER = { dept: 'TEST팀', name: '홍길동' };

export const LNB_HOME_PATH = '/rui/pm';
