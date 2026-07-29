import type { TimeRange } from '@/components/ui/time-range-selector';

/** 카운터 셀 1개 — 상/하단 열에 18개씩 놓인다 */
export interface CounterCell {
    /** 셀 식별자 (상단 U1~U18 / 하단 L1~L18) */
    id: string;
    /** 카운터 번호 (1~18) — 상/하단이 같은 번호를 공유한다 */
    no: number;
    /** 배정 항공사 — 미배정이면 'N/A' */
    airline: string;
    /** Custom 카운터 (점선 테두리) */
    custom?: boolean;
}

/** 터미널 1개분 체크인 카운터 데이터 */
export interface TerminalCheckinCounter {
    /** 요약: 전체 카운터 수 (상단 + 하단) */
    total: number;
    /** 아일랜드 목록 */
    islands: string[];
    /** 초기 선택 아일랜드 */
    island: string;
    /** 상단 열 */
    upper: CounterCell[];
    /** 하단 열 */
    lower: CounterCell[];
    /** 초기 운영 카운터 (CounterCell.id 목록) */
    operating: string[];
    /** 초기 운영 시간 */
    ranges: TimeRange[];
}
