/** 터미널 구분 */
export type TerminalKind = 'T1' | 'T2';

/** 좌/우 패널 렌더 순서 */
export const TERMINALS: readonly TerminalKind[] = ['T1', 'T2'];

/** 사용자 시뮬레이션 탭 (퍼블리싱 html 폴더 5개와 1:1) */
export type SmltTabKey = 'flightPax' | 'checkinCounter' | 'selfCheckin' | 'departure' | 'security';

/** 탭 노출 순서 */
export const SMLT_TABS: readonly SmltTabKey[] = [
    'flightPax',
    'checkinCounter',
    'selfCheckin',
    'departure',
    'security',
];

export const SMLT_TAB_LABEL: Record<SmltTabKey, string> = {
    flightPax: '운항편/여객수',
    checkinCounter: '체크인 카운터',
    selfCheckin: '셀프체크인/백드롭',
    departure: '출국장',
    security: '보안 검색대',
};
