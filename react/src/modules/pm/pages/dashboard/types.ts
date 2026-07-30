/** 일일 시뮬레이션 / 사용자 시뮬레이션 두 가지 버전 */
export type SimulationType = 'daily' | 'user';

export const SIMULATION_LABEL: Record<SimulationType, string> = {
    daily: '일일 시뮬레이션',
    user: '사용자 시뮬레이션',
};

/** 터미널 구분 (제1터미널=왼쪽 / 제2터미널=오른쪽) */
export type TerminalKind = 'T1' | 'T2';
