/** 터미널 구분 */
export type TerminalKind = 'T1' | 'T2';

export const TERMINAL_LABEL: Record<TerminalKind, string> = {
    T1: 'T1터미널',
    T2: 'T2터미널',
};

/** 혼잡도 (마커 색상 / 상태 뱃지) */
export type CongestionLevel = 'normal' | 'busy' | 'crowded';

export const CONGESTION_LABEL: Record<CongestionLevel, string> = {
    normal: '원활',
    busy: '보통',
    crowded: '혼잡',
};

/** 도면 무대(viewBox) 기준 비율 좌표 (단위: %) */
export interface MarkerPoint {
    /** 가로 비율 (0~100) */
    x: number;
    /** 세로 비율 (0~100) */
    y: number;
}

/** 출국장 마커 (T1: 1~6 / T2: 1~2) — 클릭 시 미니 팝업 */
export interface DepGateMarker extends MarkerPoint {
    id: string;
    label: string;
    /** 미니 팝업의 상태 뱃지 / 지표 값을 정한다 */
    level: CongestionLevel;
}

/** 아일랜드 마커 (A~N) — 클릭 시 상세 팝업 */
export interface IslandMarker extends MarkerPoint {
    id: string;
    label: string;
    level: CongestionLevel;
}

/** 출입구 게이트 마커 (1~14) */
export interface GateMarker extends MarkerPoint {
    id: string;
    label: string;
}

/** 터미널별 도면 + 마커 세트 */
export interface TerminalMapData {
    /** .map__bg 무대 가로세로 비율 (CSS aspect-ratio 값) */
    stageAspect: string;
    /** 출국장 (T1: 6곳 / T2: 2곳) — 운영시간 도넛과 1:1 대응 */
    depGates: DepGateMarker[];
    islands: IslandMarker[];
    gates: GateMarker[];
}

/* ================= 상단 혼잡 알림 ================= */

/**
 * 혼잡 알림 단계 (여유 → 보통 → 혼잡 → 매우혼잡).
 * 아일랜드 마커의 CongestionLevel(3단계)과는 별개 척도다.
 */
export type NoticeLevel = 'easy' | 'normal' | 'busy' | 'severe';

/** 단계별 기본 표기 (뱃지 문구 / 대상 시설이 없을 때의 안내 문구) */
export interface NoticeLevelPreset {
    label: string;
    message: string;
}

export const NOTICE_LEVEL: Record<NoticeLevel, NoticeLevelPreset> = {
    easy: { label: '여유', message: '전 구역이 여유롭습니다. 추가 부스 운영이 필요하지 않습니다.' },
    normal: { label: '보통', message: '대기 흐름이 안정적입니다. 현재 운영 상태를 유지하세요.' },
    busy: { label: '혼잡', message: '일부 구역이 혼잡합니다. 부스 추가 운영을 검토하세요.' },
    severe: { label: '매우혼잡', message: '전 구역이 매우 혼잡합니다. 즉시 부스를 증설하세요.' },
};

/** 상단 혼잡 알림 항목 */
export interface NoticeItem {
    id: string;
    /** 시설명 (예: 체크인카운터) */
    facility: string;
    /** 시설 코드 (예: M11) */
    code: string;
    /** 부가 설명 (예: 3개 부스 OPEN) */
    desc: string;
}

/** 터미널별 혼잡 알림 (단계 + 조치 대상 시설) */
export interface NoticeData {
    level: NoticeLevel;
    items: NoticeItem[];
}

/** 운영시간 도넛 카드 */
export interface OperCard {
    id: string;
    /** 도넛 게이지 비율 (0~100) */
    rate: number;
    /** 운영 시간 (예: 05:30-23:30) */
    time: string;
    /** 설명 (예: 하루 18시간 운영) */
    desc: string;
    /** 배경만 비우는 자리 (그리드 정렬용) */
    empty?: boolean;
    /** 미운영/비활성 표기 */
    dim?: boolean;
}

/** 헤더 우측 요약 (운항/여객) */
export interface HeaderSummary {
    flight: string;
    pax: string;
}

/* ================= 아일랜드 상세 팝업 ================= */

/** 시설 유형 아이콘 종류 */
export type FacilityKind = 'counter' | 'selfcheck' | 'store';

export interface FacilityItem {
    kind: FacilityKind;
    name: string;
    /** 처리율 (예: 처리율 90%) — 상업시설처럼 없을 수 있다 */
    rate?: string;
}

export interface IslandStat {
    /** terminalMap.css 의 .ico-wait-people 등 */
    ico: 'wait-people' | 'wait-time' | 'done-people' | 'done-time';
    label: string;
    value: string;
    unit: string;
    /** 강조(빨강) 표기 */
    point?: boolean;
}

export interface IslandSales {
    total: string;
    storeCount: string;
    perPax: string;
    paxDelta: string;
    rate: string;
    rateUp: boolean;
    rateBase: string;
}

export interface IslandDetail {
    id: string;
    /** 예: M아일랜드 */
    title: string;
    /** 예: T1-3RD-M01-01 */
    code: string;
    level: CongestionLevel;
    facilities: FacilityItem[];
    stats: IslandStat[];
    sales: IslandSales;
}

/* ================= 시설 미니 팝업 ================= */

/**
 * 시설 하나의 혼잡 현황 (지표 4개 + 상세보기).
 * 아일랜드 상세 팝업에서 시설 유형 / 매출을 덜어낸 축약본이라
 * 지표는 IslandStat 을 그대로 쓴다.
 */
export interface FacilityDetail {
    id: string;
    /** 예: 출국장 3 */
    title: string;
    level: CongestionLevel;
    stats: IslandStat[];
}
