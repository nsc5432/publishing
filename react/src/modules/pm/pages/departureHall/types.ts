/** 터미널 구분 */
export type TerminalKind = 'T1' | 'T2';

export const TERMINAL_LABEL: Record<TerminalKind, string> = {
    T1: 'T1터미널',
    T2: 'T2터미널',
};

/** 혼잡도 (마커 색상 / 출국장 카드 상태 뱃지) */
export type CongestionLevel = 'normal' | 'busy' | 'crowded';

export const CONGESTION_LABEL: Record<CongestionLevel, string> = {
    normal: '원활',
    busy: '보통',
    crowded: '혼잡',
};

/**
 * 우상단 보기 전환.
 * 세 보기 모두 같은 조회 조건(기준일자 · 터미널 · 타임라인 시각)을 쓴다.
 */
export type ViewMode = 'map' | 'table' | 'chart';

/** 도면 무대 기준 비율 좌표 (단위: %) */
export interface MarkerPoint {
    /** 가로 비율 (0~100) */
    x: number;
    /** 세로 비율 (0~100) */
    y: number;
}

/** 출국장 마커 (T1: 1~6 / T2: 1~2) — 카드와 1:1 대응 */
export interface DepGateMarker extends MarkerPoint {
    id: string;
    label: string;
    level: CongestionLevel;
}

/** 아일랜드 마커 (A~N) */
export interface IslandMarker extends MarkerPoint {
    id: string;
    label: string;
    level: CongestionLevel;
}

/** 출입구 게이트 마커 (T1: 1~14 / T2: 1~12) */
export interface GateMarker extends MarkerPoint {
    id: string;
    label: string;
}

/* ================= 혼잡 지표 ================= */

/** 지표 아이콘 종류 — departureHall.css 의 .dep-stat__ico 와 짝을 이룬다 */
export type StatIcon = 'wait-people' | 'wait-time' | 'done-people' | 'done-time';

export interface DepStat {
    ico: StatIcon;
    label: string;
    value: string;
    unit: string;
    /** 강조(빨강) 표기 — 대기 지표 */
    point?: boolean;
}

/**
 * 출국장 카드 1장.
 * 도면 위에 떠 있으므로 마커와 같은 비율 좌표(무대 기준 %)를 갖는다.
 */
export interface DepGateCard extends MarkerPoint {
    id: string;
    /** 출국장 번호 (예: 3) */
    depNum: string;
    /** 표시명 (예: 출국장 3) */
    title: string;
    level: CongestionLevel;
    stats: DepStat[];
    /** 운영 중인 부스 수 */
    boothCnt: number;
    /** 운영 시간 (예: 05:30-23:30) — 표 보기에서 쓴다 */
    operTime: string;
    /** 미운영 출국장 */
    off?: boolean;
}

/** 터미널 1개분 도면 데이터 */
export interface TerminalDepMap {
    cards: DepGateCard[];
    depGates: DepGateMarker[];
    islands: IslandMarker[];
    gates: GateMarker[];
}

/* ================= 상단 혼잡 알림 ================= */

/** 혼잡 알림 단계 (여유 → 보통 → 혼잡 → 매우혼잡) */
export type NoticeLevel = 'easy' | 'normal' | 'busy' | 'severe';

export interface NoticeLevelPreset {
    label: string;
    message: string;
}

export const NOTICE_LEVEL: Record<NoticeLevel, NoticeLevelPreset> = {
    easy: { label: '여유', message: '전 출국장이 여유롭습니다. 추가 부스 운영이 필요하지 않습니다.' },
    normal: { label: '보통', message: '대기 흐름이 안정적입니다. 현재 운영 상태를 유지하세요.' },
    busy: { label: '혼잡', message: '일부 출국장이 혼잡합니다. 부스 추가 운영을 검토하세요.' },
    severe: { label: '매우혼잡', message: '전 출국장이 매우 혼잡합니다. 즉시 부스를 증설하세요.' },
};

/** 상단 혼잡 알림 항목 (예: 출국장 1 (2개 부스 OPEN)) */
export interface NoticeItem {
    id: string;
    /** 시설명 (예: 출국장 1) */
    facility: string;
    /** 부가 설명 (예: 2개 부스 OPEN) */
    desc: string;
}

export interface NoticeData {
    level: NoticeLevel;
    items: NoticeItem[];
}

/* ================= 차트 보기 ================= */

/** 출국장 1곳의 시간대별 추이 */
export interface DepTrendSeries {
    depNum: string;
    title: string;
    /** 꺾은선 색 */
    color: string;
    /** timeLabels 와 같은 길이의 대기인원 배열 */
    values: number[];
}

export interface DepTrend {
    /** x 축 눈금 (예: 04:00 …) — 타임라인과 같은 30분 단위 */
    timeLabels: string[];
    series: DepTrendSeries[];
}
