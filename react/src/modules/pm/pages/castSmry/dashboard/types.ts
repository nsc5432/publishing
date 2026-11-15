import type { CongestionStatus, DsbdCategory, DsbdRsltDto, FcltType } from '@/types/api.types';
import type { IconName } from '@/components/icons/InlineIcon';
import type { SummaryInfoCell, SummaryTipRow } from '@/modules/pm/summary';

export type { SummaryInfoCell, SummaryTipRow } from '@/modules/pm/summary';

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

/** 요약 블록이 세는 구간 길이(분) — 조회 시각부터 이만큼 안에 출발하는 편만 센다 */
export const SMRY_INTRVL_MIN = 60;

/** 요약정보 대상 — 랜드사이드는 아일랜드 + 출국장 */
export const SUMMARY_TARGET_LABEL: Record<DsbdCategory, string> = {
    PSG: '랜드사이드',
    FLT: '랜드사이드',
    CHKN: '아일랜드',
    DEP: '출국장',
};

export const SUMMARY_SCOPE: Record<DsbdCategory, FcltCardType[]> = {
    PSG: ['CHKN', 'DEP'],
    FLT: ['CHKN', 'DEP'],
    CHKN: ['CHKN'],
    DEP: ['DEP'],
};

/* ================= 터미널 패널 뷰 모델 ================= */

export interface FcltCardChip {
    label: string;
    /** dashboard.css 의 .chip.r/.g/.o/.gray 등 */
    kind: string;
}

export interface FcltCardRecommend {
    tag: string;
    name: string;
    count: string;
    /** 개수 뒤에 붙는 문구 (예: 소요 / 배정 필요) */
    countNote: string;
    countNoteAccent?: boolean;
}

export interface FcltCardDiff {
    text: string;
    dir: 'up' | 'down' | 'flat';
}

export interface FcltCardCapacity {
    kind: 'enough' | 'short' | 'unknown';
    text: string;
}

export interface GaugeAverage {
    /** 안쪽 링 채움 비율 (0~1) */
    value: number;
    text: string;
}

export interface GaugeData {
    /** 도넛 게이지 채움 비율 (0~1) */
    value: number;
    centerText: string;
    average?: GaugeAverage;
}

export interface FcltCardHourly {
    arrival: GaugeData;
    process: GaugeData;
    /** 추천 수량 적용 시 예측 처리인원 — 안쪽 평균 링 없음 */
    recommendProcess: GaugeData;
}

/** done: 이미 해소 · inTarget: 목표 시간 안 · overTarget: 목표 초과 · beyond: 축(60분) 밖 · unreachable: 해소 불가 · unknown: 산정 불가 */
export type FcltCardClearKind = 'done' | 'inTarget' | 'overTarget' | 'beyond' | 'unreachable' | 'unknown';

export interface FcltCardClearTrack {
    kind: FcltCardClearKind;
    /** 해소 지점 (0~1, 축 = 지금 → +60분) */
    pos: number;
}

export interface FcltCardClear {
    label: string;
    current: string;
    recommend: string;
    currentTrack: FcltCardClearTrack;
    recommendTrack: FcltCardClearTrack;
    /** 목표선 위치 (0~1) */
    targetPos: number;
    /** 추천 수량이 현재보다 빨리 해소할 때만 — 'N분 단축' / '해소 가능' */
    saving?: string;
}

export interface FcltCardSnapshot {
    hhmm: string;
    congestion: string;
    congestionKind: string;
    waitingCount: string;
    waitingTime: string;
    waitingCountDiff?: FcltCardDiff;
    waitingTimeDiff?: FcltCardDiff;
    operatingCount: string;
    /** 운영 수량이 추천 총 소요 수량(reqCnt)을 감당하는지 */
    capacity: FcltCardCapacity;
    hourly: FcltCardHourly;
    clear: FcltCardClear;
    recommend: FcltCardRecommend;
}

/** 시설 카드 캐러셀의 한 페이지(아일랜드/출국장 1개 상태) */
export interface FcltCardVariant {
    /** 하단 칩(FcltUnitDto.unitCd)과 카드를 잇는 키 — 아일랜드 문자 / 출국장 번호 */
    unitCd: string;
    num: string;
    totalCount: string;
    current: FcltCardSnapshot | null;
    next: FcltCardSnapshot | null;
}

export type FcltCardType = Extract<FcltType, 'CHKN' | 'DEP'>;

export interface FcltCardData {
    fcltType: FcltCardType;
    title: string;
    currentTime: string;
    totalWaitingCount: string;
    variants: FcltCardVariant[];
    /** 카드가 아니라 시설 전체의 유닛 목록 — 카드를 넘겨도 바뀌지 않는다 */
    chips: FcltCardChip[];
}

export interface SummaryStat {
    icon: IconName;
    iconClass: string;
    value: string;
    unit: string;
}

export interface SummaryScopeChip {
    label: string;
    active: boolean;
}

export interface SummarySlot {
    label: string;
    time: string;
    range: string;
    stats: SummaryStat[];
}

export interface TableRow {
    time: string;
    pax: string;
    arrivalPax: string;
    processedPax: string;
    wait: string;
    process: string;
    timeShare: string;
    waitingPax: string;
}

/* ================= 혼잡해소 시나리오 팝업 뷰 모델 ================= */

/** 카드에서 실제 선택한 단위 + 확정 조회조건 (조회 전 draft 조건은 섞지 않는다) */
export interface FcltQueueTarget {
    smltId: string;
    ymd: string;
    hhmm: string;
    tmnlId: TerminalKind;
    fcltType: FcltCardType;
    unitCd: string;
}

export interface FcltQueueLabel {
    title: string;
    resource: string;
}

export const FCLT_QUEUE_LABEL: Record<FcltCardType, FcltQueueLabel> = {
    CHKN: { title: '체크인카운터', resource: '부스' },
    DEP: { title: '보안검색대', resource: '보안검색대' },
};

/** value 는 해소 소요시간이 있는 경우, none 은 이미 목표 미만(0분) */
export type QueueClearKind = 'value' | 'none' | 'unreachable' | 'unavailable';

/** 운영 수량 하나의 해소 예상 막대 */
export interface QueueBarView {
    cnt: number;
    kind: QueueClearKind;
    /** 화면 표기용 올림 분. 소요시간이 없으면 null */
    minutes: number | null;
    /** 막대 위 값 (예: 25분 · 불가 · —) */
    valueText: string;
    clockText: string;
    /** 플롯 높이 대비 막대 높이 0~1 */
    height: number;
    goalMet: boolean;
    isCurrent: boolean;
    isRecommend: boolean;
    reason: string;
    /** 기준시각부터 판정 구간 끝까지 10분 간격 예측. 산정 불가면 빈 배열 */
    timeline: QueueTimePoint[];
}

/** 시간축 차트의 한 시각 */
export interface QueueTimePoint {
    /** 기준시각부터 분 */
    minute: number;
    clockText: string;
    /** 이 시각까지 10분 유입 (명). 기준시각 칸은 null */
    arvlPsgCnt: number | null;
    /** 이 시각 직전 10분 처리 여객 예측 평균 대기 (분). 처리 여객이 없으면 null */
    waitMin: number | null;
    queuePsgCnt: number;
}

/** 시간축 차트의 공통 축 정보 */
export interface QueueTimeAxis {
    judgeMin: number;
    /** 해소 기준 (분) — 점선 */
    thresholdMin: number;
    targetMin: number;
    targetClockText: string;
    /** 판정 구간 안내 (예: 09:10 ~ 10:10) */
    rangeText: string;
    /** false 면 10분 CAST 유입 대신 유입률 하나를 이어 쓴 예측 */
    arvlProfiled: boolean;
}

export interface QueueRecommendSummary {
    reqCnt: number | null;
    mainText: string;
    subText: string;
    short: boolean;
}

export interface QueueBarDetail {
    title: string;
    mainText: string;
    subText: string;
    goalMet: boolean;
}

export interface QueueBasisRow {
    term: string;
    value: string;
}

export interface FcltQueueScenarioView {
    label: FcltQueueLabel;
    tmnlId: TerminalKind;
    fcltNm: string;
    /** 헤더 한 줄 (예: 08:40 기준 · 대기 78명 · 평균 대기 58분 30초) */
    summaryText: string;
    /** 해소 정의 (예: 평균 대기 40분 미만) */
    targetShort: string;
    targetMin: number;
    targetRange: { min: number; max: number };
    currentCnt: number | null;
    current: QueueBarView;
    /** 현재 평균 대기가 이미 해소 기준 미만 */
    calm: boolean;
    bars: QueueBarView[];
    /** 목표선 높이 0~1 */
    targetHeight: number;
    axisText: string;
    /** TIME 응답에 판정 구간이 없으면 null */
    timeAxis: QueueTimeAxis | null;
    recommend: QueueRecommendSummary;
    basis: QueueBasisRow[];
}

export interface TerminalView {
    /** 기준시각 바 문구 (예: 2026-07-10 FRI 10:00 AM) */
    barText: string;
    /** 패널 전체 혼잡도 — p-iconbox/p-title/p-bar 색을 결정한다. 산정 불가면 null (중립색) */
    cgnStatus: CongestionStatus | null;
    /** 헤더 통계(지난주 同요일 대비) */
    stats: {
        flights: { delta: string; value: string };
        pax: { delta: string; value: string };
        boardingRate: string;
    };
    peak: { ampm: string; time: string; totalWait: string; avgWait: string; process: string };
    /** 요약 뷰 상단 2셀 × 3개 시간대 */
    summaryStats: SummarySlot[];
    /** 요약정보 대상 — '\n' 이 들어갈 수 있다 */
    summaryTarget: string;
    summaryScope: SummaryScopeChip[];
    summaryInfo: SummaryInfoCell[];
    summaryTip: SummaryTipRow[];
    fcltCards: FcltCardData[];
    /** 큰 차트 — 좌표 계산은 그리는 쪽(TerminalChart)이 한다 */
    chart: { rsltList: DsbdRsltDto[] };
    tableRows: TableRow[];
    /** 테이블 뷰에서 최초 선택 행 (조회 기준 시각) */
    defaultSelectedRow: number;
}
