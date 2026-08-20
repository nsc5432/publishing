/** 막대 하나 (2시간 단위, 12개) */
export interface ChartBar {
    /** 하단 스케일 라벨 (예: 04) */
    label: string;
    /** 막대 높이 값 — 축을 넘지 않도록 max 로 clamp 될 수 있다 */
    value: number;
    /** 툴팁에 보여줄 실제 값 (clamp 되지 않는다) */
    actual: number;
}

/** 막대 차트 1개 (운항편 수 / 여객 수) */
export interface ChartData {
    /** 차트 제목 (예: 운항편 수) */
    title: string;
    /** 누적 값 (예: 1,234) */
    total: string;
    /** 누적 단위 (예: 편 / 명) */
    unit: string;
    /** Y축 최댓값 — 눈금은 이 값을 3등분해서 찍는다 */
    max: number;
    bars: ChartBar[];
}

/** 시간대별 표 1행 — 전체 비율이 걸린 뒤의 값 */
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
    rows: HourRow[];
}
