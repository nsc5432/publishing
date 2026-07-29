import type { SmltTabKey, TerminalKind } from './types';

/** GNB 조회 조건 (실제 조회 연동 전까지 고정값) */
export const HEADER = {
    title: 'PM 예측관리 / 사용자 시뮬레이션',
    baseDate: '2024/10/23',
    defaultTab: 'flightPax' as SmltTabKey,
    defaultTerminal: 'T1' as TerminalKind,
};
