import type {
    CongestionLevel,
    NoticeData,
    NoticeLevel,
    NoticeLevelPreset,
} from '@/modules/pm/types/map.types';
import type { DepGateMarker, GateMarker, IslandMarker } from '@/modules/pm/types/map.types';

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

export const NOTICE_LEVEL: Record<NoticeLevel, NoticeLevelPreset> = {
    easy: { label: '여유', message: '전 구역이 여유롭습니다. 추가 부스 운영이 필요하지 않습니다.' },
    normal: { label: '보통', message: '대기 흐름이 안정적입니다. 현재 운영 상태를 유지하세요.' },
    busy: { label: '혼잡', message: '일부 구역이 혼잡합니다. 부스 추가 운영을 검토하세요.' },
    severe: { label: '매우혼잡', message: '전 구역이 매우 혼잡합니다. 즉시 부스를 증설하세요.' },
};

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

/* ================= 하루치 ================= */

/**
 * 타임라인 한 칸(30분)이 가리키는 화면 값.
 * 팝업까지 여기 들어 있어 마커를 눌러도 다시 조회하지 않는다.
 */
export interface MapSlot {
    notice: NoticeData;
    map: TerminalMapData;
    /** 아일랜드 문자(A~N) → 상세 팝업 */
    islandDetails: Record<string, IslandDetail>;
    /** 출국장 번호(1~6) → 미니 팝업 */
    depGateDetails: Record<string, FacilityDetail>;
}

/**
 * 하루치 도면 — 한 번 받아 두고 타임라인은 자리만 옮긴다.
 * 헤더 요약 · 운영시간 카드는 시각과 무관해 슬롯 밖에 한 벌만 둔다.
 */
export interface MapDay {
    summary: HeaderSummary;
    operCards: OperCard[];
    /** 시각(HHmm) → 그 시각 화면 값 */
    slots: Record<string, MapSlot>;
}
