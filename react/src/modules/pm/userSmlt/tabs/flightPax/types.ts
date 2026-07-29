/** 수정 방식 — 운항편 전체 비율(ratio) / 시간대별(hourly) */
export type EditMode = 'ratio' | 'hourly';

/** 막대 하나 (2시간 단위, 12개) */
export interface ChartBar {
    /** 하단 스케일 라벨 (예: 04) */
    label: string;
    /** 막대 높이 비율 0~100 (%) — flightPax.css 의 --h 로 전달 */
    ratio: number;
}

/** 막대 차트 1개 (운항편 수 / 여객 수) */
export interface ChartData {
    /** 차트 제목 (예: 운항편 수) */
    title: string;
    /** 누적 값 (예: 1,234) */
    total: string;
    /** 누적 단위 (예: 편 / 명) */
    unit: string;
    /** 좌측 Y축 라벨 (위 → 아래, 4개) */
    axis: string[];
    bars: ChartBar[];
}

/** 시간대별 표 1행 */
export interface HourRow {
    start: string;
    end: string;
    /** 수정 비율 (예: 10%) */
    adjust: string;
    /** 승객 수 (예: 12,340명) */
    pax: string;
}

/** 터미널 1개분 데이터 */
export interface TerminalFlightPax {
    /** 요약: 운항편 */
    flights: string;
    /** 요약: 여객 */
    pax: string;
    /** 요약: 피크 시간 */
    peak: string;
    flightChart: ChartData;
    paxChart: ChartData;
    /** 전체 비율 스테퍼 초기값 (%) */
    ratio: number;
    rows: HourRow[];
}
