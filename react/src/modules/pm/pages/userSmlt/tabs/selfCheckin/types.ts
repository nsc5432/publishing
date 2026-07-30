import type { TimeRange } from '@/components/ui/time-range-selector';

/** 기기 1종 (셀프체크인 키오스크 / 셀프백드롭) */
export interface SelfCheckinDevice {
    id: string;
    /** 기기명 */
    name: string;
    /** 운영 대수 */
    count: number;
    /** 초기 운영 시간 */
    ranges: TimeRange[];
    /** 초기 미운영 여부 */
    off: boolean;
}

/** 터미널 1개분 셀프체크인/백드롭 데이터 */
export interface TerminalSelfCheckin {
    /** 요약: 전체 보유 대수 */
    total: number;
    /** 아일랜드 목록 */
    islands: string[];
    /** 초기 선택 아일랜드 */
    island: string;
    devices: SelfCheckinDevice[];
}

/** 기기별 편집 상태 — SelfCheckinDevice.id 를 키로 쓴다 */
export type DeviceState = Record<string, { off: boolean; ranges: TimeRange[] }>;
