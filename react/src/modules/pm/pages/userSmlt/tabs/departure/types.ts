import type { TimeRange } from '@/components/ui/time-range-selector';

/** 출국장 1개 */
export interface DepartureGate {
    id: string;
    /** 표시명 (예: 출국장 1) */
    name: string;
    /** 초기 운영 시간 */
    ranges: TimeRange[];
    /** 초기 미사용 여부 */
    off: boolean;
}

/** 터미널 1개분 출국장 데이터 */
export interface TerminalDeparture {
    gates: DepartureGate[];
}

/** 출국장별 편집 상태 — DepartureGate.id 를 키로 쓴다 */
export type GateState = Record<string, { off: boolean; ranges: TimeRange[] }>;
