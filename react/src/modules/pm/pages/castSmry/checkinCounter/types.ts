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
 * 화면이 보는 값은 아일랜드 공용 Queue 하나다 — 부스별 집계와 Queue 추정을 함께 보여주지 않는다.
 * 값은 두 갈래로 나뉜다: 하루 흐름(차트)과 한 시각의 아일랜드별 상태(표 · 칩).
 * 셀프체크인/백드롭은 Queue 에 들어가지 않고 상단 자원 요약에만 남는다.
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

/** 공용 Queue 결과 지표 1개 (평균대기 / 최대 Queue / 총 처리인원 / 처리용량 사용률) */
export interface ChknKpi {
    id: string;
    label: string;
    value: string;
    unit: string;
    /** 값 옆에 덧붙이는 설명 (예: 피크 시각) */
    note?: string;
}

/* ================= Queue 차트 ================= */

/**
 * 30분 단위 하루 흐름 — 막대(운영 부스)와 꺾은선(Queue 인원)이 한 벌의 값이다.
 * 배열은 모두 슬롯 수만큼 길이가 같아야 축이 맞는다.
 */
export interface ChknQueueSeries {
    /** x 축 눈금 (예: 00:00, 00:30 …) */
    timeLabels: string[];
    /** 운영 부스 (개) */
    booth: number[];
    /** 공용 Queue 인원 (명) — 오른쪽 축 */
    queue: number[];
    /** 오른쪽 축 최댓값 */
    queueMax: number;
    /** 평균대기 (초) — 툴팁에서 읽는다 */
    waitSec: number[];
    /** 처리인원 (명) — 툴팁에서 읽는다 */
    prcsPsgCnt: number[];
    /** 처리용량 사용률 (%) — 툴팁에서 읽는다 */
    prcsRate: number[];
}

/* ================= 아일랜드 ================= */

/** 아일랜드 1곳의 한 시각 Queue 상태 — 표 보기의 1행, 칩 줄의 칩 1개 */
export interface ChknIslandView {
    id: string;
    /** 아일랜드 문자 (A~N, I 제외) */
    island: string;
    /** 표시명 (예: 아일랜드 A) */
    title: string;
    level: CongestionLevel;
    /** 미운영 아일랜드 (그 시각 배정이 없다) */
    isClosed: boolean;
    /** 운영 부스 (개) */
    oprBoothCnt: number;
    /** 현재 Queue 인원 (명) */
    queuePsgCnt: number;
    /** 30분 평균 Queue 인원 (명) */
    avgQueuePsgCnt: number;
    /** 30분 최대 Queue 인원 (명) */
    maxQueuePsgCnt: number;
    /** 평균대기 (초) */
    waitSec: number;
    /** 30분 처리인원 (명) */
    prcsPsgCnt: number;
    /** 처리용량 사용률 (%) */
    prcsRate: number;
    /** NORMAL 도달 예상 — 산정 불가면 '-' */
    cgnClear: string;
    /** 총 소요 부스 — 산정 불가면 '-' */
    reqCnt: string;
    /** 배정 항공사 (예: KE, OZ) — 없으면 '-' */
    airlines: string;
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
 * 차트와 표가 같은 슬롯에서 나오므로 두 보기가 서로 다른 값을 말하지 않는다.
 */
export interface ChknDay {
    summary: ChknSummaryItem[];
    kpis: ChknKpi[];
    queue: ChknQueueSeries;
    /** 시각(HHmm) → 그 시각 화면 값 */
    slots: Record<string, ChknSlot>;
}
