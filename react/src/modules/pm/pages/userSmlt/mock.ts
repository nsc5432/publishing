import type { SmltTabKey, TerminalKind } from './types';

/** GNB 조회 조건 (실제 조회 연동 전까지 고정값) */
export const HEADER = {
    title: 'PM 예측관리 / 사용자 시뮬레이션',
    baseDate: '2024/10/23',
    defaultTab: 'flightPax' as SmltTabKey,
    defaultTerminal: 'T1' as TerminalKind,
};

/** 하단 조회 메뉴(표/맵/출국장…) 중 해당하는 항목이 없어 아무것도 강조하지 않는다. */
export const DEFAULT_NAV_BOTTOM = '';
