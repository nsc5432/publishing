import type { CongestionStatus, DsbdRsltDto, FcltType } from '@/types/api.types';
import type { IconName } from '@/components/icons/InlineIcon';

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

/* ================= 터미널 패널 뷰 모델 ================= */

export interface GaugeData {
    /** 도넛 게이지 채움 비율 (0~1) */
    value: number;
    centerText: string;
    captionText: string;
}

export interface FcltCardChip {
    label: string;
    /** dashboard.css 의 .chip.r/.g/.o/.gray 등 */
    kind: string;
}

export interface FcltCardMeta {
    label: string;
    value: string;
    /** 값을 강조색으로 (dashboard.css 의 .acc) */
    accent?: boolean;
}

export interface FcltCardRecommend {
    tag: string;
    name: string;
    count: string;
    /** 개수 뒤에 붙는 문구 (예: 소요 / 배정 필요) */
    countNote: string;
    countNoteAccent?: boolean;
}

/** 시설 카드 캐러셀의 한 페이지(아일랜드/출국장 1개 상태) */
export interface FcltCardVariant {
    /** 하단 칩(FcltUnitDto.unitCd)과 카드를 잇는 키 — 아일랜드 문자 / 출국장 번호 */
    unitCd: string;
    island?: string;
    num: string;
    meta: FcltCardMeta[];
    processRate: GaugeData;
    clearTime: GaugeData;
    recommend: FcltCardRecommend;
}

export type FcltCardType = Extract<FcltType, 'CHKN' | 'DEP'>;

export interface FcltCardData {
    fcltType: FcltCardType;
    title: string;
    warn: string;
    variants: FcltCardVariant[];
    /** 카드가 아니라 시설 전체의 유닛 목록 — 카드를 넘겨도 바뀌지 않는다 */
    chips: FcltCardChip[];
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
    current: string;
    input: string;
    countTab: string;
    recommend: string;
}

export const FCLT_QUEUE_LABEL: Record<FcltCardType, FcltQueueLabel> = {
    CHKN: {
        title: '체크인카운터',
        resource: '부스',
        current: '현재 배정 부스',
        input: '배정 부스 수',
        countTab: '부스 수 조정',
        recommend: '추천 부스 수(총)',
    },
    DEP: {
        title: '출국장',
        resource: '보안검색대',
        current: '현재 운영 보안검색대',
        input: '운영 보안검색대 수',
        countTab: '보안검색대 수 조정',
        recommend: '추천 보안검색대 수(총)',
    },
};

/** value 는 해소 소요시간이 있는 경우, none 은 이미 목표 미만(0분) */
export type QueueClearKind = 'value' | 'none' | 'unreachable' | 'unavailable';

export interface QueueClearView {
    kind: QueueClearKind;
    /** 화면 표기용 올림 분. 소요시간이 없으면 null */
    minutes: number | null;
    mainText: string;
    unitText: string;
    clockText: string;
    note: string;
    /** 계산 기준 시각에 새로 줄 선 여객의 예상 대기. 산정할 수 없으면 '' */
    nextWtngText: string;
    /** 목표 시각의 직전 30분 처리 여객 예측 평균 대기. 산정할 수 없으면 '' */
    fcstWtngText: string;
    /** 이미 목표 미만(none)이면 해소시간이 수량과 무관하게 0 이라, 수량 차이는 이 예측값으로 비교한다 */
    fcst: QueueFcstView;
}

export interface QueueFcstView {
    sec: number | null;
    /** 예측 평균이 해소 목표 이상. 예측할 수 없으면 null */
    over: boolean | null;
    /** 예측 평균의 집계 구간 (예: 08:20~08:50) */
    rangeText: string;
    valueText: string;
}

export interface QueueErlangView {
    wtngProb: string;
    thryWtng: string;
    load: string;
    note: string;
}

export interface QueueRecommendView {
    reqCnt: number | null;
    countNote: string;
    capaNote: string;
    capaShort: boolean;
    /** 추천 수량(또는 보유 최대수) 배정 시 해소 예상 */
    clear: QueueClearView | null;
    clearLabel: string;
}

/** 응답 하나에서 정해지는 기준 정보 — 수량 / 목표시간 입력과 무관하다 */
export interface FcltQueueContextView {
    label: FcltQueueLabel;
    tmnlId: TerminalKind;
    fcltNm: string;
    baseText: string;
    obsText: string;
    dataSrcText: string;
    queueText: string;
    /** 해소 기준 — 처리 여객 평균 대기시간 NORMAL 상한 미만 */
    targetText: string;
    /** 관측구간 처리 여객 평균 대기 + 등급 (근거 목록용) */
    wtngAvgText: string;
    /** 기준선 요약 한 줄용. 산정할 수 없으면 '' */
    wtngAvgShort: string;
    arvlText: string;
    srvcText: string;
    asmpList: string[];
    currentCnt: number | null;
    totCnt: number | null;
    /** 수량 조정을 막는 사유 (빈 값이면 조정 가능) */
    countLockReason: string;
    targetMin: { dflt: number; min: number; max: number };
    current: QueueClearView;
    currentErlang: QueueErlangView;
}

export interface FcltQueueResultView {
    scenario: QueueClearView | null;
    scenarioErlang: QueueErlangView | null;
    diffNote: string;
    recommend: QueueRecommendView | null;
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
    peak: { ampm: string; time: string; totalWait: string; maxWait: string; hourlyProcess: string };
    /** 요약 뷰 상단 2셀 */
    summaryStats: SummaryStat[];
    summaryInfo: SummaryInfoCell[];
    fcltCards: FcltCardData[];
    /** 큰 차트 — 좌표 계산은 그리는 쪽(TerminalChart)이 한다 */
    chart: { rsltList: DsbdRsltDto[] };
    tableRows: TableRow[];
    /** 테이블 뷰에서 최초 선택 행 (조회 기준 시각) */
    defaultSelectedRow: number;
}
