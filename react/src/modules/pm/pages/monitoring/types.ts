import type { IconName } from '@/components/icons/InlineIcon';

export type HistoryKind = 'standard' | 'user';

export const HISTORY_LABEL: Record<HistoryKind, string> = {
    standard: '표준',
    user: '사용자',
};

export type RunStatus = 'done' | 'running' | 'failed';

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
    done: '완료',
    running: '진행중',
    failed: '실패',
};

/** 이력 그리드 상태 필터 — KPI 카드 클릭으로 바뀐다 */
export type StatusFilter = 'all' | RunStatus;

/** 시뮬레이션 이력 한 줄 */
export interface HistoryRow {
    rowNo: number;
    /** 결과 보기(상세 조회)에 쓰는 시뮬레이션 ID */
    smltId: string;
    dept: string;
    name: string;
    startAt: string;
    endAt: string;
    duration: number;
    status: RunStatus;
}

/** 상단 KPI 카드 */
export interface StatCard {
    id: string;
    icon: IconName;
    label: string;
    values: { value: string; unit: string }[];
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
