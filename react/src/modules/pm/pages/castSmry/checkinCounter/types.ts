import type { CongestionLevel, NoticeData, NoticeLevel, NoticeLevelPreset } from '@/modules/pm/types/map.types';

export type {
    CongestionLevel,
    NoticeData,
    NoticeItem,
    NoticeLevel,
    NoticeLevelPreset,
    TerminalKind,
} from '@/modules/pm/types/map.types';
export { CONGESTION_LABEL, TERMINAL_LABEL, TERMINALS } from '@/modules/pm/types/map.types';

/**
 * 체크인카운터 결과 조회 뷰 모델.
 *
 * 화면은 "시뮬레이션이 배치한 자원을 얼마나 쓰고 있고, 그래서 얼마나 기다리는가" 하나를 본다.
 * 그래서 값은 두 갈래뿐이다 — 하루 흐름(차트)과 한 시각의 아일랜드별 상태(표).
 * 셀프체크인/백드롭은 별도 시설이 아니라 아일랜드가 가진 자원의 종류로 다룬다.
 */

/** 우상단 보기 전환. 두 보기 모두 같은 조회 결과를 나눠 쓴다 */
export type ViewMode = 'chart' | 'table';

export const VIEW_LABEL: Record<ViewMode, string> = {
    chart: '차트 보기',
    table: '표 보기',
};

/* ================= 요약 바 ================= */

/** 요약 바 지표 1개 (전체 카운터 · 운영 아일랜드 · 피크 카운터 …) */
export interface ChknSummaryItem {
    /** CSS 결합 값이 아니라 목록 키다 */
    id: string;
    label: string;
    value: string;
    unit: string;
    /** 강조(보라) 표기 — 시뮬레이션이 정한 값 */
    isAccent?: boolean;
}

/** 시뮬레이션 결과 지표 1개 (평균대기 / P95대기 / 최대 큐인원 / 가동률) */
export interface ChknKpi {
    id: string;
    label: string;
    value: string;
    unit: string;
}

/* ================= 자원 활용 차트 ================= */

/**
 * 시간대별 자원 활용 — 막대(자원 3종)와 꺾은선(대기인원)이 한 벌의 값이다.
 * 배열은 모두 24개(0~23시)로 길이가 같아야 축이 맞는다.
 */
export interface ChknResourceSeries {
    /** x 축 눈금 (예: 00, 01 …) */
    hourLabels: string[];
    /** 유인 체크인카운터 (개) */
    counter: number[];
    /** 셀프체크인 키오스크 (대) */
    kiosk: number[];
    /** 셀프백드롭 (대) */
    bagdrop: number[];
    /** 대기인원 (명) — 오른쪽 축 */
    wait: number[];
    /** 오른쪽 축 최댓값 */
    waitMax: number;
    /** 자원 활용률 (%) — 툴팁에서 읽는다 */
    utilRate: number[];
}

/* ================= 아일랜드 ================= */

/** 아일랜드 1곳의 한 시각 상태 — 표 보기의 1행, 칩 줄의 칩 1개 */
export interface ChknIslandView {
    id: string;
    /** 아일랜드 문자 (A~N, I 제외) */
    island: string;
    /** 표시명 (예: 아일랜드 A) */
    title: string;
    level: CongestionLevel;
    /** 미운영 아일랜드 (그날 배정이 없다) */
    isClosed: boolean;
    /** 유인 체크인카운터 (개) */
    counterCnt: number;
    kioskCnt: number;
    bagDropCnt: number;
    /** 운영 시간 (예: 05:00-22:00) — 미운영이면 '-' */
    operTime: string;
    /** 배정 항공사 (예: KE, OZ) — 없으면 '-' */
    airlines: string;
    /** 대기인원 (명) */
    wtngPsgCnt: number;
    /** 대기시간 (초) */
    wtngHr: number;
    /** 처리인원 (명) */
    prcsPsgCnt: number;
    /** 처리율 (%) */
    prcsRate: number;
}

/* ================= 상단 혼잡 알림 ================= */

export const NOTICE_LEVEL: Record<NoticeLevel, NoticeLevelPreset> = {
    easy: {
        label: '여유',
        message: '전 아일랜드가 여유롭습니다. 추가 카운터 운영이 필요하지 않습니다.',
    },
    normal: { label: '보통', message: '대기 흐름이 안정적입니다. 현재 배치를 유지하세요.' },
    busy: { label: '혼잡', message: '일부 아일랜드가 혼잡합니다. 카운터 추가 운영을 검토하세요.' },
    severe: {
        label: '매우혼잡',
        message: '전 아일랜드가 매우 혼잡합니다. 즉시 카운터를 증설하세요.',
    },
};

/* ================= 하루치 ================= */

/** 타임라인 한 칸(30분)이 가리키는 화면 값 */
export interface ChknSlot {
    notice: NoticeData;
    islands: ChknIslandView[];
}

/**
 * 하루치 체크인카운터 — 한 번 받아 두고 타임라인은 자리만 옮긴다.
 * 차트 보기의 자원 활용도 같은 한 건에서 나온다 (따로 조회하지 않는다).
 */
export interface ChknDay {
    summary: ChknSummaryItem[];
    kpis: ChknKpi[];
    resource: ChknResourceSeries;
    /** 시각(HHmm) → 그 시각 화면 값 */
    slots: Record<string, ChknSlot>;
}
