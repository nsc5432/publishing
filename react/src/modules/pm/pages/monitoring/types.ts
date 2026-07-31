import type { IconName } from '@/modules/pm/pages/dashboard/components/PmIcons';

/** 이력 구분 — 표준 시뮬레이션 / 사용자 시뮬레이션 */
export type HistoryKind = 'standard' | 'user';

export const HISTORY_LABEL: Record<HistoryKind, string> = {
    standard: '표준',
    user: '사용자',
};

/** 수행 상태 */
export type RunStatus = 'done' | 'running';

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
    done: '완료',
    running: '진행중',
};

/** 시뮬레이션 이력 한 줄 */
export interface HistoryRow {
    no: number;
    /** 부서 (예: 시설관리팀) */
    dept: string;
    /** 성명 (예: 김민수) */
    name: string;
    /** 시작일시 (예: 2026.07.23 13:00) */
    startAt: string;
    endAt: string;
    /** 소요시간(분) */
    duration: number;
    status: RunStatus;
}

/** 상단 KPI 카드 */
export interface StatCard {
    id: string;
    icon: IconName;
    /** 예: 전체 수행 */
    label: string;
    /**
     * 값 + 단위 쌍. 대부분 1개지만
     * 평균 수행시간은 `15분 00초` 처럼 2개다.
     */
    values: { value: string; unit: string }[];
    /** 값 색상 구분 (기본: 파랑) */
    tone?: 'blue' | 'teal';
}

/** 조회 조건 — 시작일시 ~ 종료일시 */
export interface RangeCondition {
    startDate: string;
    startHour: string;
    startMinute: string;
    endDate: string;
    endHour: string;
    endMinute: string;
}
