import type { TimeRange } from '@/components/ui/time-range-selector';
import type { BlockColor, PanelKpi, WaitLineData } from '../../types';

/** 부스 1석 — 드로어 자원 배정 그리드의 셀 1개 */
export interface Booth {
    /** 부스 번호 (아일랜드 안에서 1부터) */
    no: number;
    /** 배정 항공사 코드 — 미배정이면 '' */
    airline: string;
}

/**
 * 아일랜드 1개 = 블럭 차트의 항목 1개.
 */
export interface CheckinIsland {
    /** 아일랜드 문자 (A~N, I 제외) */
    label: string;
    color: BlockColor;
    /** 운영 시간 구간 */
    ranges: TimeRange[];
    /** 운영 부스 */
    booths: Booth[];
    /** 셀프체크인 키오스크 대수 (구 셀프체크인/백드롭 탭) */
    kiosk: number;
    /** 셀프백드롭 대수 */
    bagdrop: number;
}

/** 터미널 1개분 체크인 카운터 데이터 */
export interface TerminalCheckinCounter {
    /** 요약: 전체 카운터 수 */
    total: number;
    /** 드로어에서 부스에 배정할 수 있는 항공사 코드 */
    airlines: string[];
    /** 신규 아일랜드에 쓸 수 있는 아일랜드 문자 (I 제외) */
    islandCodes: string[];
    islands: CheckinIsland[];
    /** 시간대별 대기인원수 (꺾은선) */
    wait: WaitLineData;
    /** 시뮬레이션 결과 지표 */
    kpis: PanelKpi[];
}
