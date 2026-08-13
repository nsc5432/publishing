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
    /** 아이콘에 마우스를 올리면 오른쪽으로 펼치는 하위 메뉴 */
    children?: NavItem[];
}

/**
 * 일일 시뮬레이션 하위 메뉴.
 *
 * 레일 하단에 따로 두면 상위 메뉴와의 관계가 드러나지 않아, 상위 아이콘의
 * 플라이아웃(아이콘 + 메뉴명)으로만 노출한다.
 */
export const LNB_DAILY_SMLT: NavItem[] = [
    { id: 'summary', icon: 'grid', label: '요약보기', path: '/rui/pm/daily-smlt/dashboard' },
    { id: 'map', icon: 'map', label: '맵형태보기', path: '/rui/pm/daily-smlt/terminalMap' },
    /* 체크인카운터 · 셀프체크인/백드롭은 한 메뉴다 — 서로 다른 시설이 아니라
       같은 아일랜드가 가진 자원의 종류라 결과도 한 화면에서 함께 본다. */
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
];
export const LNB_USER = { dept: 'TEST팀', name: '홍길동' };

export const LNB_HOME_PATH = '/rui/pm';
