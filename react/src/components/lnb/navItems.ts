import type { IconName } from '@/modules/pm/pages/dashboard/components/PmIcons';

/**
 * 화면 공용 좌측 네비게이션(LNB) 메뉴 정의.
 * 대시보드 / 맵 형태 조회 등 PM 화면이 같은 레일을 공유한다.
 * 상단 그룹의 활성 표시는 현재 경로에서 끌어오므로(Lnb.tsx) 화면이 넘길 값은 없다.
 */
export interface NavItem {
    id: string;
    icon: IconName;
    /** 레일에서는 마우스 오버 툴팁, 펼침 패널에서는 본문 텍스트로 쓰인다 */
    label: string;
    /** 이동할 경로. 없으면 아직 화면이 없는 메뉴라 이동하지 않는다. */
    path?: string;
    /**
     * 활성 판정에 쓸 경로 접두사. 이동 경로(path)와 다를 때만 지정한다.
     * 예) '일일 시뮬레이션'은 요약(dashboard)으로 이동하지만
     *     맵 형태(terminalMap)에 있을 때도 활성이어야 한다.
     */
    match?: string;
}

/** 상단 그룹 : 활성 시 원형(펼침 시 알약) 배경으로 강조 — 현재 경로 기준 */
export const LNB_TOP: NavItem[] = [
    {
        id: 'dailySmlt',
        icon: 'chart',
        label: '일일 시뮬레이션',
        path: '/rui/pm/daily-smlt/dashboard',
        match: '/rui/pm/daily-smlt',
    },
    {
        id: 'userSmlt',
        icon: 'user',
        label: '사용자 시뮬레이션',
        path: '/rui/pm/user-smlt/config',
    },
    {
        id: 'monitoring',
        icon: 'monitor',
        label: '시뮬레이션 모니터링',
        path: '/rui/pm/smlt-monitoring',
    },
    { id: 'facilityMap', icon: 'pin', label: '시설물 매핑' },
];

/**
 * 하단 그룹 : 일일 시뮬레이션 안에서의 보기 선택 (활성 시 아이콘 색상으로 강조).
 * 화면이 있는 항목만 이동하고 나머지는 아직 표시만 바뀐다.
 */
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

/** 레일 맨 아래 토글 버튼에 펼침 상태에서만 함께 노출되는 사용자 */
export const LNB_USER = { dept: 'TEST팀', name: '홍길동' };

/** 화면이 없어 기본 진입하는 경로(= 대시보드) */
export const LNB_HOME_PATH = '/rui/pm';
