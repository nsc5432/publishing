import type { IconName } from '@/modules/pm/pages/dashboard/components/PmIcons';

/**
 * 화면 공용 좌측 네비게이션(LNB) 메뉴 정의.
 * 대시보드 / 맵 형태 조회 등 PM 화면이 같은 레일을 공유한다.
 * 화면마다 다른 것은 "무엇이 활성인가" 뿐이라 활성 id 는 각 화면에서 Props 로 넘긴다.
 */
export interface NavItem {
    id: string;
    icon: IconName;
    /** 아이콘 마우스 오버 시 노출되는 메뉴명 */
    label: string;
}

/** 상단 그룹 : 활성 시 원형 배경으로 강조 */
export const LNB_TOP: NavItem[] = [
    { id: 'daily-smlt/dashboard', icon: 'chart', label: '대시보드' },
    { id: 'daily-smlt/terminalMap', icon: 'map', label: '맵 형태 조회' },
    { id: 'user-smlt/config', icon: 'user', label: '사용자 시뮬레이션' },

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
