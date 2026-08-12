import type {
    CongestionLevel,
    DepGateMarker,
    GateMarker,
    IslandMarker,
    MarkerPoint,
    NoticeData,
    NoticeLevel,
    NoticeLevelPreset,
} from '@/modules/pm/types/map.types';

export type {
    CongestionLevel,
    DepGateMarker,
    GateMarker,
    IslandMarker,
    MarkerPoint,
    NoticeData,
    NoticeItem,
    NoticeLevel,
    NoticeLevelPreset,
    TerminalKind,
} from '@/modules/pm/types/map.types';
export { CONGESTION_LABEL, TERMINAL_LABEL, TERMINALS } from '@/modules/pm/types/map.types';

/**
 * 우상단 보기 전환.
 * 세 보기 모두 같은 조회 조건(기준일자 · 터미널 · 타임라인 시각)을 쓴다.
 */
export type ViewMode = 'map' | 'table' | 'chart';

/* ================= 혼잡 지표 ================= */

/** 지표 아이콘 종류 — departureHall.css 의 .dep-stat__ico 와 짝을 이룬다 */
export type StatIcon = 'wait-people' | 'wait-time' | 'done-people' | 'done-time';

export interface DepStat {
    icon: StatIcon;
    label: string;
    value: string;
    unit: string;
    /** 강조(빨강) 표기 — 대기 지표 */
    isHighlighted?: boolean;
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
    isClosed?: boolean;
}

/** 터미널 1개분 도면 데이터 */
export interface TerminalDepMap {
    cards: DepGateCard[];
    depGates: DepGateMarker[];
    islands: IslandMarker[];
    gates: GateMarker[];
}

/* ================= 상단 혼잡 알림 ================= */

export const NOTICE_LEVEL: Record<NoticeLevel, NoticeLevelPreset> = {
    easy: {
        label: '여유',
        message: '전 출국장이 여유롭습니다. 추가 부스 운영이 필요하지 않습니다.',
    },
    normal: { label: '보통', message: '대기 흐름이 안정적입니다. 현재 운영 상태를 유지하세요.' },
    busy: { label: '혼잡', message: '일부 출국장이 혼잡합니다. 부스 추가 운영을 검토하세요.' },
    severe: { label: '매우혼잡', message: '전 출국장이 매우 혼잡합니다. 즉시 부스를 증설하세요.' },
};

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

/* ================= 하루치 ================= */

/** 타임라인 한 칸(30분)이 가리키는 화면 값 — 맵·표 보기가 함께 읽는다 */
export interface DepSlot {
    notice: NoticeData;
    map: TerminalDepMap;
}

/**
 * 하루치 출국장 — 한 번 받아 두고 타임라인은 자리만 옮긴다.
 * 차트 보기의 추이도 같은 슬롯에서 뽑아낸다 (따로 조회하지 않는다).
 */
export interface DepDay {
    /** 시각(HHmm) → 그 시각 화면 값 */
    slots: Record<string, DepSlot>;
    trend: DepTrend;
}
