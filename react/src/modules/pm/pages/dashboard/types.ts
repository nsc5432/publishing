import type { DsbdRsltDto } from '@/types/api.types';
import type { IconName } from './components/PmIcons';

/** 일일 시뮬레이션 / 사용자 시뮬레이션 두 가지 버전 */
export type SimulationType = 'daily' | 'user';

export const SIMULATION_LABEL: Record<SimulationType, string> = {
    daily: '일일 시뮬레이션',
    user: '사용자 시뮬레이션',
};

/** 터미널 구분 (제1터미널=왼쪽 / 제2터미널=오른쪽) */
export type TerminalKind = 'T1' | 'T2';

/* ================= 터미널 패널 뷰 모델 =================
 *
 * 서버 DTO 를 화면이 그대로 쓰기엔 표기 규칙(단위 · 부호 · 시각 형식)이 섞여 있다.
 * view.ts 에서 한 번 옮겨 두고, 컴포넌트는 아래 모양만 그린다.
 */

export interface GaugeData {
    /** 도넛 게이지 채움 비율 (0~1) */
    value: number;
    main: string;
    sub: string;
}

export interface GateChip {
    label: string;
    /** dashboard.css 의 .chip.r/.g/.o/.gray 등 */
    kind: string;
}

export interface GateMeta {
    k: string;
    v: string;
    acc?: boolean;
}

/** 게이트 캐러셀의 한 페이지(아일랜드/출국장 1개 상태) */
export interface GateVariant {
    isl?: string;
    num: string;
    numSmall?: string;
    meta: GateMeta[];
    processRate: GaugeData;
    clearTime: GaugeData;
    rec: { tag: string; name: string; cnt: string; cap: string; capAccent?: boolean };
    chips: GateChip[];
}

export interface GateData {
    title: string;
    warn: string;
    variants: GateVariant[];
}

export interface SummaryStat {
    icon: IconName;
    iconClass: string;
    value: string;
    unit: string;
    deltaLabel: string;
    delta: string;
}

export interface SummaryInfoCell {
    k: string;
    v: string;
    u: string;
}

export interface TableRow {
    time: string;
    pax: string;
    wait: string;
    process: string;
    ratio: string;
}

/** 터미널 패널 1개분 */
export interface TerminalView {
    /** 기준시각 바 문구 (예: 2026-07-10 FRI 10:00 AM) */
    barText: string;
    /** 헤더 통계(지난주 同요일 대비) */
    stats: {
        flights: { delta: string; value: string };
        pax: { delta: string; value: string };
        boardingRate: string;
    };
    peak: { ampm: string; time: string; totalWait: string; maxWait: string; hourlyProcess: string };
    /** 요약 뷰 상단 2셀 */
    summaryStats: SummaryStat[];
    summaryInfo: SummaryInfoCell[];
    gates: GateData[];
    /** 큰 차트 — 좌표 계산은 그리는 쪽(TerminalChart)이 한다 */
    chart: { rsltList: DsbdRsltDto[]; peakIndex: number };
    tableRows: TableRow[];
    /** 테이블 뷰에서 최초 선택 행 (조회 기준 시각) */
    defaultSelectedRow: number;
}
