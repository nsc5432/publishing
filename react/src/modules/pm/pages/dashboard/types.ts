import type { CongestionStatus, DsbdRsltDto, FcltType } from '@/types/api.types';
import type { IconName } from '@/components/icons/InlineIcon';

/** 일일 시뮬레이션 / 사용자 시뮬레이션 두 가지 버전 */
export type SimulationType = 'daily' | 'user';

export const SIMULATION_LABEL: Record<SimulationType, string> = {
    daily: '일일 시뮬레이션',
    user: '사용자 시뮬레이션',
};

/** 상단 바 제목 — 뱃지와 같은 구분을 문장으로 한 번 더 알린다 */
export const SIMULATION_TITLE: Record<SimulationType, string> = {
    daily: '일일 시뮬레이션 결과 조회',
    user: '사용자 시뮬레이션 결과 조회',
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
    /** 도넛 가운데 큰 글씨 */
    centerText: string;
    /** 그 아래 작은 글씨 (단위 / 부연) */
    captionText: string;
}

export interface GateChip {
    label: string;
    /** dashboard.css 의 .chip.r/.g/.o/.gray 등 */
    kind: string;
}

/** 게이트 카드 가운데 줄의 '라벨 값' 한 쌍 */
export interface GateMeta {
    label: string;
    value: string;
    /** 값을 강조색으로 (dashboard.css 의 .acc) */
    accent?: boolean;
}

/** 게이트 카드의 추천 조치 블록 */
export interface GateRecommend {
    tag: string;
    name: string;
    count: string;
    /** 개수 뒤에 붙는 문구 (예: 소요 / 배정 필요) */
    countNote: string;
    countNoteAccent?: boolean;
}

/** 게이트 캐러셀의 한 페이지(아일랜드/출국장 1개 상태) */
export interface GateVariant {
    island?: string;
    num: string;
    numSmall?: string;
    meta: GateMeta[];
    processRate: GaugeData;
    clearTime: GaugeData;
    recommend: GateRecommend;
    chips: GateChip[];
}

/** 대시보드 게이트 카드로 올라오는 시설 (상세 화면이 따로 있는 둘) */
export type GateFcltType = Extract<FcltType, 'CHKN' | 'DEP'>;

export interface GateData {
    /** 상세(+) 버튼이 어느 화면을 여는지 가른다 */
    fcltType: GateFcltType;
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
    /** '\n' 이 들어갈 수 있다 (Multiline 이 <br/> 로 편다) */
    label: string;
    value: string;
    unit: string;
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
    /** 패널 전체 혼잡도 — p-iconbox/p-title/p-bar 색을 결정한다 */
    cgnStatus: CongestionStatus;
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
    chart: { rsltList: DsbdRsltDto[] };
    tableRows: TableRow[];
    /** 테이블 뷰에서 최초 선택 행 (조회 기준 시각) */
    defaultSelectedRow: number;
}
