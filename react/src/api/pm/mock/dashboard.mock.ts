import type {
    CongestionStatus,
    DsbdBaseInfoDto,
    DsbdCategory,
    DsbdFcltCardDto,
    DsbdHeaderDto,
    DsbdRsltDto,
    FcltQueueClearDto,
    FcltQueueRecommendDto,
    FcltQueueScenarioDto,
    FcltQueueScenarioReq,
    FcltUnitDto,
    HourlyPsgDto,
    QueueMetricDto,
    TmnlId,
    TmnlSmryDto,
} from '@/types/api.types';

/**
 * 대시보드 목업 응답 (VITE_ENABLE_MOCK=true 일 때 사용).
 *
 * 화면 목업과 달리 서버 DTO 와 같은 모양으로 둔다. 화면은 목업이든 실통신이든
 * 같은 DTO 를 받으므로 연동 시 화면 코드를 고칠 일이 없다.
 *
 * 값은 조회 조건에만 좌우된다. 같은 조건으로 다시 부르면 반드시 같은 값이 나온다 —
 * 호출할 때마다 흔들리면 화면이 제대로 그려진 것인지 목업이 튄 것인지 구분할 수 없다.
 */

/* ================= 기준 정보 ================= */

/** 선택 가능 시각 — 08:00 ~ 10:00, 10분 단위 (계산이 끝난 시각까지만 내려온다는 전제) */
const AVL_TIMES = (() => {
    const times: string[] = [];
    for (let minutes = 8 * 60; minutes <= 10 * 60; minutes += 10) {
        const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
        const mm = String(minutes % 60).padStart(2, '0');
        times.push(hh + mm);
    }
    return times;
})();

const BASE_INFO: DsbdBaseInfoDto = {
    error: false,
    errorMessage: '',
    smltId: 'SMLT-20260710-0001',
    ymd: '20260710',
    smltType: 'USER',
    lastCalcDt: '20260710104700',
    nextCalcDt: '20260710110000',
    avlTimes: AVL_TIMES,
};

/* ================= 시간대별 출발여객 (상단 카드) ================= */

/** 터미널별 시간대(00~23시) 출발여객 — 새벽에 낮고 오전/저녁에 두 번 솟는 모양 */
const HOURLY_PSG: Record<TmnlId, number[]> = {
    T1: [60, 20, 10, 0, 30, 420, 1580, 2240, 2680, 2510, 2080, 1760, 1640, 1520, 1730, 1980, 2210, 2380, 2090, 1620, 1080, 720, 400, 180],
    T2: [40, 10, 0, 0, 20, 360, 1320, 1980, 2320, 2180, 1820, 1560, 1420, 1330, 1510, 1720, 1930, 2060, 1810, 1400, 940, 610, 340, 150],
};

const sum = (values: number[]): number => values.reduce((acc, v) => acc + v, 0);

/** Y축 최댓값 — 1,000 단위로 올림 */
const axisMax = (values: number[]): number => Math.ceil(Math.max(...values) / 1000) * 1000;

function buildHourlyPsg(tmnlId: TmnlId): HourlyPsgDto {
    const counts = HOURLY_PSG[tmnlId];

    return {
        tmnlId,
        totPsgCnt: sum(counts),
        maxPsgCnt: axisMax(counts),
        itemList: counts.map((psgCnt, hour) => ({
            time: String(hour).padStart(2, '0'),
            psgCnt,
            // 예측선은 실적 위아래로 조금씩 어긋나게 둬서 두 선이 겹쳐 보이지 않게 한다.
            fcstPsgCnt: Math.max(0, Math.round(psgCnt * 1.04) - (hour % 3) * 60),
        })),
    };
}

const HOURLY_PSG_LIST: HourlyPsgDto[] = [buildHourlyPsg('T1'), buildHourlyPsg('T2')];

const DEP_PSG_TOT = sum(HOURLY_PSG_LIST.map((item) => item.totPsgCnt));

/**
 * 터미널별 운항편.
 * 상단 카드(운항계획)와 터미널 패널이 같은 값에서 나오도록 묶어 둔다.
 * 목업이라도 두 곳의 합이 어긋나면 화면을 보는 쪽이 계산 오류로 읽는다.
 */
const TMNL_FLT_CNT: Record<TmnlId, number> = { T1: 270, T2: 219 };
const DEP_FLT_TOT = TMNL_FLT_CNT.T1 + TMNL_FLT_CNT.T2;

const HEADER: DsbdHeaderDto = {
    error: false,
    errorMessage: '',
    ymd: BASE_INFO.ymd,
    fltPlan: {
        depFltCnt: DEP_FLT_TOT,
        arrFltCnt: DEP_FLT_TOT,
        totFltCnt: DEP_FLT_TOT * 2,
        depPsgCnt: DEP_PSG_TOT,
        // 도착까지 더한 하루 총 여객 (출발과 비슷한 규모로 둔다)
        totPsgCnt: DEP_PSG_TOT * 2 - 4200,
    },
    hourlyPsgList: HOURLY_PSG_LIST,
    dowAttr: {
        dowNm: '주말 전일(금)',
        dowType: 'PRE_WEEKEND',
        spclNote: '하계',
    },
    weather: {
        wthrCn: '구름조금',
        maxTp: 30,
        minTp: 23,
        hmdtVl: 71,
        wsVl: 2,
        rwyAtm: 1015.9,
    },
};

/* ================= 터미널 패널 요약 ================= */

/** 조회 시각과 무관한 부분 — 구간 4필드는 buildTmnlSmry 가 얹는다 */
type TmnlSmryBase = Omit<TmnlSmryDto, 'intrvlMin' | 'intrvlFltCnt' | 'intrvlPsgCnt' | 'intrvlYesterdayFltDiffCnt' | 'intrvlYesterdayPsgDiffCnt'>;

const TMNL_SMRY: Record<TmnlId, TmnlSmryBase> = {
    T1: {
        error: false,
        errorMessage: '',
        tmnlId: 'T1',
        fltCnt: TMNL_FLT_CNT.T1,
        fltDiffCnt: 12,
        yesterdayFltDiffCnt: 2,
        psgCnt: sum(HOURLY_PSG.T1),
        psgDiffCnt: 2688,
        yesterdayPsgDiffCnt: 1234,
        brdgRate: 79,
        cgnStatus: 'FREE',
        peak: {
            ampm: 'AM',
            peakTime: '1000',
            wtngPsgCnt: 268,
            maxWtngHr: 40,
            hrlyPrcsPsgCnt: 240,
        },
    },
    T2: {
        error: false,
        errorMessage: '',
        tmnlId: 'T2',
        fltCnt: TMNL_FLT_CNT.T2,
        fltDiffCnt: -8,
        yesterdayFltDiffCnt: 5,
        psgCnt: sum(HOURLY_PSG.T2),
        psgDiffCnt: 1942,
        yesterdayPsgDiffCnt: 842,
        brdgRate: 74,
        cgnStatus: 'NORMAL',
        peak: {
            ampm: 'AM',
            peakTime: '0900',
            wtngPsgCnt: 212,
            maxWtngHr: 35,
            hrlyPrcsPsgCnt: 230,
        },
    },
};

/** 전일 같은 구간을 만드는 터미널별 배율 — 증감 부호가 두 터미널에서 갈리도록 골랐다 */
const YESTERDAY_RATIO: Record<TmnlId, number> = { T1: 0.94, T2: 1.05 };

const MIN_PER_HOUR = 60;
const MIN_PER_DAY = 24 * MIN_PER_HOUR;

/** 시간대별 운항편 — 하루 합이 TMNL_FLT_CNT 와 맞도록 여객 곡선에 비례 배분한다 */
function toHourlyFlt(tmnlId: TmnlId): number[] {
    const counts = HOURLY_PSG[tmnlId];
    const total = sum(counts);

    return counts.map((psgCnt) => (TMNL_FLT_CNT[tmnlId] * psgCnt) / total);
}

/** 시간대(00~23시) 곡선에서 [bgnHhmm, +intrvlMin) 과 겹치는 분만큼만 비례해 더한다 */
function sumByIntrvl(hourly: number[], bgnHhmm: string, intrvlMin: number): number {
    const bgnMin = Number(bgnHhmm.slice(0, 2)) * MIN_PER_HOUR + Number(bgnHhmm.slice(2, 4));
    // 예측시분에 날짜가 없어 자정을 넘는 구간은 그날 끝까지로 자른다 (서버와 같은 규칙)
    const endMin = Math.min(bgnMin + intrvlMin, MIN_PER_DAY);

    const total = hourly.reduce((acc, count, hour) => {
        const overlap = Math.min(endMin, (hour + 1) * MIN_PER_HOUR) - Math.max(bgnMin, hour * MIN_PER_HOUR);

        return overlap > 0 ? acc + (count * overlap) / MIN_PER_HOUR : acc;
    }, 0);

    return Math.round(total);
}

function buildTmnlSmry(tmnlId: TmnlId, hhmm: string, intrvlMin: number): TmnlSmryDto {
    const intrvlFltCnt = sumByIntrvl(toHourlyFlt(tmnlId), hhmm, intrvlMin);
    const intrvlPsgCnt = sumByIntrvl(HOURLY_PSG[tmnlId], hhmm, intrvlMin);
    const ratio = YESTERDAY_RATIO[tmnlId];

    return {
        ...TMNL_SMRY[tmnlId],
        intrvlMin,
        intrvlFltCnt,
        intrvlPsgCnt,
        intrvlYesterdayFltDiffCnt: intrvlFltCnt - Math.round(intrvlFltCnt * ratio),
        intrvlYesterdayPsgDiffCnt: intrvlPsgCnt - Math.round(intrvlPsgCnt * ratio),
    };
}

/* ================= 시간대별 결과 (차트 / 테이블) ================= */

/**
 * 퀵 타일(조회 대상)에 따라 값의 규모가 달라진다.
 * 실제로는 서버가 지표별로 다른 값을 내려주지만, 목업은 출발여객 곡선에 배율만 준다.
 */
const CATEGORY_SCALE: Record<DsbdCategory, number> = {
    PSG: 1,
    FLT: 0.018,
    CHKN: 0.45,
    DEP: 0.32,
};

/** 실측(Xovis)은 흘러간 시간까지만 있다 — 이 시각 뒤로는 실적선이 끊긴다 */
const MEASURED_UNTIL_HOUR = 14;

function buildRsltList(tmnlId: TmnlId, category: DsbdCategory): DsbdRsltDto[] {
    const scale = CATEGORY_SCALE[category];

    return HOURLY_PSG[tmnlId].map((base, hour) => {
        const psgCnt = Math.round(base * scale);
        const fcstWtngPsgCnt = Math.round(psgCnt * 0.12);

        return {
            time: `${String(hour).padStart(2, '0')}00`,
            psgCnt,
            wtngPsgCnt: hour <= MEASURED_UNTIL_HOUR ? Math.round(fcstWtngPsgCnt * (0.85 + ((hour * 13) % 6) / 20)) : null,
            wtngHr: Math.min(40, Math.round(fcstWtngPsgCnt / 8)),
            prcsPsgCnt: Math.round(psgCnt * 0.9),
            prcsHr: Math.min(30, Math.round(fcstWtngPsgCnt / 12)),
            prcsRate: 70 + ((hour * 7) % 26),
            fcstWtngPsgCnt,
            lastWeekWtngPsgCnt: Math.round(fcstWtngPsgCnt * 0.88),
        };
    });
}

/* ================= 게이트 카드 ================= */

/** 칩 목록 — 혼잡도는 코드 순서대로 돌려 쓴다 (목업이라 규칙만 보이면 된다) */
function buildUnits(labels: string[], busyLabels: string[], closedLabels: string[] = []) {
    return labels.map<FcltUnitDto>((unitCd, i) => {
        const cgnStatus: CongestionStatus = busyLabels.includes(unitCd) ? (i % 2 === 0 ? 'VERY_BUSY' : 'BUSY') : i % 3 === 0 ? 'FREE' : 'NORMAL';

        return {
            unitCd,
            cgnStatus,
            useYn: closedLabels.includes(unitCd) ? 'N' : 'Y',
        };
    });
}

/** 체크인카운터 아일랜드 — 두 터미널이 같은 구성이다 (I 는 쓰지 않는다) */
const CHKN_LABELS = ['N', 'M', 'L', 'K', 'J', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];

/** 칩은 카드가 아니라 시설 전체 목록이다 — 서버도 같은 목록을 카드마다 실어 보낸다 */
const CHKN_UNITS: Record<TmnlId, FcltUnitDto[]> = {
    T1: buildUnits(CHKN_LABELS, ['N', 'H', 'C', 'B'], ['A']),
    T2: buildUnits(CHKN_LABELS, ['M', 'C'], ['A']),
};

const DPTGT_UNITS: Record<TmnlId, FcltUnitDto[]> = {
    T1: buildUnits(['6', '5', '4', '3', '2', '1'], ['4', '3'], ['6']),
    T2: buildUnits(['2', '1'], ['1'], []),
};

const CHKN_CARDS: Record<TmnlId, DsbdFcltCardDto[]> = {
    T1: [
        {
            cardId: 'T1-CHKN-B',
            fcltType: 'CHKN',
            island: 'B',
            dptgtNo: '',
            fcltNm: 'B',
            totCnt: 14,
            oprCnt: 14,
            wtngPsgCnt: 640,
            hrlyPrcsPsgCnt: 180,
            hrlyPrcsRate: 78,
            cgnClearTime: '1100',
            cgnClearRate: 62,
            cgnStatus: 'BUSY',
            recommend: { targetNm: '대한항공', reqCnt: 5, needAssignYn: 'Y' },
            unitList: CHKN_UNITS.T1,
        },
        {
            cardId: 'T1-CHKN-D',
            fcltType: 'CHKN',
            island: 'D',
            dptgtNo: '',
            fcltNm: 'D',
            totCnt: 12,
            oprCnt: 10,
            wtngPsgCnt: 410,
            hrlyPrcsPsgCnt: 840,
            hrlyPrcsRate: 66,
            cgnClearTime: '1120',
            cgnClearRate: 50,
            cgnStatus: 'NORMAL',
            recommend: { targetNm: '아시아나항공', reqCnt: 3, needAssignYn: 'Y' },
            unitList: CHKN_UNITS.T1,
        },
    ],
    T2: [
        {
            cardId: 'T2-CHKN-C',
            fcltType: 'CHKN',
            island: 'C',
            dptgtNo: '',
            fcltNm: 'C',
            totCnt: 12,
            oprCnt: 11,
            wtngPsgCnt: 520,
            hrlyPrcsPsgCnt: 480,
            hrlyPrcsRate: 71,
            cgnClearTime: '1050',
            cgnClearRate: 58,
            cgnStatus: 'BUSY',
            recommend: { targetNm: '대한항공', reqCnt: 4, needAssignYn: 'Y' },
            unitList: CHKN_UNITS.T2,
        },
        {
            cardId: 'T2-CHKN-E',
            fcltType: 'CHKN',
            island: 'E',
            dptgtNo: '',
            fcltNm: 'E',
            totCnt: 10,
            oprCnt: 8,
            wtngPsgCnt: 330,
            hrlyPrcsPsgCnt: 360,
            hrlyPrcsRate: 61,
            cgnClearTime: '1110',
            cgnClearRate: 47,
            cgnStatus: 'NORMAL',
            recommend: { targetNm: '진에어', reqCnt: 2, needAssignYn: 'N' },
            unitList: CHKN_UNITS.T2,
        },
    ],
};

const DPTGT_CARDS: Record<TmnlId, DsbdFcltCardDto[]> = {
    T1: [
        {
            cardId: 'T1-DEP-3',
            fcltType: 'DEP',
            island: '',
            dptgtNo: '3',
            fcltNm: '3번',
            totCnt: 6,
            oprCnt: 5,
            wtngPsgCnt: 640,
            hrlyPrcsPsgCnt: 600,
            hrlyPrcsRate: 78,
            cgnClearTime: '1100',
            cgnClearRate: 62,
            cgnStatus: 'BUSY',
            recommend: { targetNm: '보안검색대', reqCnt: 6, needAssignYn: 'N' },
            unitList: DPTGT_UNITS.T1,
        },
        {
            cardId: 'T1-DEP-1',
            fcltType: 'DEP',
            island: '',
            dptgtNo: '1',
            fcltNm: '1번',
            totCnt: 6,
            oprCnt: 4,
            wtngPsgCnt: 430,
            hrlyPrcsPsgCnt: 420,
            hrlyPrcsRate: 55,
            cgnClearTime: '1130',
            cgnClearRate: 40,
            cgnStatus: 'NORMAL',
            recommend: { targetNm: '보안검색대', reqCnt: 4, needAssignYn: 'N' },
            unitList: DPTGT_UNITS.T1,
        },
    ],
    T2: [
        {
            cardId: 'T2-DEP-1',
            fcltType: 'DEP',
            island: '',
            dptgtNo: '1',
            fcltNm: '1번',
            totCnt: 2,
            oprCnt: 2,
            wtngPsgCnt: 640,
            hrlyPrcsPsgCnt: 510,
            hrlyPrcsRate: 78,
            cgnClearTime: '1100',
            cgnClearRate: 62,
            cgnStatus: 'BUSY',
            recommend: { targetNm: '보안검색대', reqCnt: 6, needAssignYn: 'N' },
            unitList: DPTGT_UNITS.T2,
        },
        {
            cardId: 'T2-DEP-2',
            fcltType: 'DEP',
            island: '',
            dptgtNo: '2',
            fcltNm: '2번',
            totCnt: 2,
            oprCnt: 1,
            wtngPsgCnt: 430,
            hrlyPrcsPsgCnt: 0,
            hrlyPrcsRate: 55,
            cgnClearTime: '1130',
            cgnClearRate: 40,
            cgnStatus: 'NORMAL',
            recommend: { targetNm: '보안검색대', reqCnt: 4, needAssignYn: 'N' },
            unitList: DPTGT_UNITS.T2,
        },
    ],
};

const FCLT_GRADE_MAX: Record<'CHKN' | 'DEP', [number, number, number]> = {
    CHKN: [180, 420, 650],
    DEP: [140, 320, 520],
};

function toMinuteOfDay(hhmm: string): number {
    return Number(hhmm.slice(0, 2)) * MIN_PER_HOUR + Number(hhmm.slice(2, 4));
}

function toFcltStatus(fcltType: 'CHKN' | 'DEP', waitingCount: number): CongestionStatus {
    const [freeMax, normalMax, busyMax] = FCLT_GRADE_MAX[fcltType];
    if (waitingCount <= freeMax) return 'FREE';
    if (waitingCount <= normalMax) return 'NORMAL';
    return waitingCount <= busyMax ? 'BUSY' : 'VERY_BUSY';
}

// 서버처럼 카드도 혼잡해소 팝업 첫 화면(TIME / 목표 30분)과 같은 프로필 / 같은 식으로 만든다
function buildFcltCard(card: DsbdFcltCardDto, hhmm: string, fcltType: 'CHKN' | 'DEP'): DsbdFcltCardDto {
    const profile = QUEUE_SCENARIO_PROFILES[card.cardId] ?? QUEUE_SCENARIO_PROFILES['T1-CHKN-B'];
    const targetMin = QUEUE_TARGET_MIN.dflt;
    const baseMinute = Math.min(toMinuteOfDay(hhmm) + QUEUE_OBS_MIN, MIN_PER_DAY);
    const capacity = profile.prcsSec === null ? 0 : (profile.oprCnt * 3600) / profile.prcsSec;
    const { reqCnt } = toQueueRecommend(profile, targetMin);
    const clear = reqCnt === null ? null : toQueueClear(profile, reqCnt, BASE_INFO.ymd, baseMinute);
    const clearMin = clear?.cgnClearMin == null ? null : Math.ceil(clear.cgnClearMin - 1e-9);

    return {
        ...card,
        wtngPsgCnt: profile.wtngPsgCnt,
        hrlyPrcsRate: capacity === 0 ? 0 : Math.round((profile.arvlPerHour / capacity) * 100),
        cgnClearTime: clear === null || clearMin === null ? '' : clear.cgnClearDt.slice(8, 12),
        cgnClearRate: clearMin === null ? 0 : Math.round((Math.max(targetMin - clearMin, 0) / targetMin) * 100),
        cgnStatus: toFcltStatus(fcltType, profile.wtngPsgCnt),
        recommend: {
            targetNm: reqCnt === null ? '' : card.recommend.targetNm,
            reqCnt,
            needAssignYn: fcltType === 'CHKN' && reqCnt !== null && reqCnt > profile.oprCnt ? 'Y' : 'N',
        },
        unitList: card.unitList.map((unit) => ({ ...unit })),
    };
}

function buildFcltCardList(tmnlId: TmnlId, hhmm: string, fcltType: 'CHKN' | 'DEP'): DsbdFcltCardDto[] {
    const cards = fcltType === 'CHKN' ? CHKN_CARDS[tmnlId] : DPTGT_CARDS[tmnlId];
    return cards.map((card) => buildFcltCard(card, hhmm, fcltType));
}

/* ================= 혼잡해소 시나리오 팝업 =================
 *
 * 목업 응답을 입력에 반응시키려고 서버(FacilityQueueCalculator)와 같은 식을 작게 흉내 낸다.
 * 화면 검증용 fixture 생성기일 뿐 운영 계산은 Java queue 클래스가 맡는다.
 */

interface QueueScenarioProfile {
    wtngPsgCnt: number;
    targetQueueCnt: number;
    arvlPerHour: number;
    /** null 이면 처리율 미산출 경우 */
    prcsSec: number | null;
    oprCnt: number;
    /** null 이면 배정가능 최대수 미확인 경우 */
    totCnt: number | null;
}

/** 키는 `${tmnlId}-${fcltType}-${unitCd}` — T1-CHKN-B 가 계획서 §9.1 검증 벡터다 */
const QUEUE_SCENARIO_PROFILES: Record<string, QueueScenarioProfile> = {
    'T1-CHKN-B': { wtngPsgCnt: 40, targetQueueCnt: 10, arvlPerHour: 180, prcsSec: 120, oprCnt: 8, totCnt: 10 },
    'T1-CHKN-D': { wtngPsgCnt: 640, targetQueueCnt: 420, arvlPerHour: 900, prcsSec: 60, oprCnt: 14, totCnt: 14 },
    'T2-CHKN-C': { wtngPsgCnt: 520, targetQueueCnt: 420, arvlPerHour: 480, prcsSec: 72, oprCnt: 11, totCnt: 12 },
    'T2-CHKN-E': { wtngPsgCnt: 300, targetQueueCnt: 420, arvlPerHour: 360, prcsSec: 60, oprCnt: 8, totCnt: 10 },
    'T1-DEP-3': { wtngPsgCnt: 380, targetQueueCnt: 320, arvlPerHour: 600, prcsSec: 24, oprCnt: 5, totCnt: 6 },
    'T1-DEP-1': { wtngPsgCnt: 360, targetQueueCnt: 320, arvlPerHour: 420, prcsSec: 24, oprCnt: 4, totCnt: null },
    'T2-DEP-1': { wtngPsgCnt: 410, targetQueueCnt: 320, arvlPerHour: 540, prcsSec: null, oprCnt: 2, totCnt: 2 },
    'T2-DEP-2': { wtngPsgCnt: 0, targetQueueCnt: 320, arvlPerHour: 0, prcsSec: 24, oprCnt: 1, totCnt: 2 },
};

const QUEUE_OBS_MIN = 30;
const QUEUE_TARGET_MIN = { dflt: 30, min: 1, max: 120 };

const QUEUE_ASMP_LIST: Record<'CHKN' | 'DEP', string[]> = {
    CHKN: [
        'M/M/s 적용 가정: 포아송 도착 / 지수 처리시간 / 동일 처리율의 병렬 시설 / 공용 대기열 선착순 / 무한 대기공간 / 이탈 없음 (통계 검증 아님)',
        '예측 구간 동안 유입률 / 처리율이 일정하고 시설 수는 즉시 바뀐다고 본다',
        '아일랜드 유인 카운터(CC) 공용 Queue — 부스별 결과를 재구성한 값',
    ],
    DEP: [
        'M/M/s 적용 가정: 포아송 도착 / 지수 처리시간 / 동일 처리율의 병렬 시설 / 공용 대기열 선착순 / 무한 대기공간 / 이탈 없음 (통계 검증 아님)',
        '예측 구간 동안 유입률 / 처리율이 일정하고 시설 수는 즉시 바뀐다고 본다',
        'SC / SR 결과를 합산한 하나의 보안검색 Queue (직렬 / 병렬 관계 미검증)',
    ],
};

function queueMetric(status: QueueMetricDto['status'], method: QueueMetricDto['method'], reason: string): QueueMetricDto {
    return { status, method, reason };
}

function toDt(ymd: string, minuteOfDay: number, plusSec = 0): string {
    const date = new Date(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)), 0, minuteOfDay, Math.ceil(plusSec));
    const pad = (value: number) => String(value).padStart(2, '0');

    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function toQueueNextWtng(profile: QueueScenarioProfile, fcltCnt: number, capacity: number | null): Pick<FcltQueueClearDto, 'nextWtngSec' | 'nextWtngMetric'> {
    if (fcltCnt === 0) {
        return { nextWtngSec: null, nextWtngMetric: queueMetric('UNREACHABLE', 'NEXT_ARRIVAL_WAIT', '운영 처리시설이 0개라 대기가 끝나지 않습니다.') };
    }
    if (capacity === null) {
        return { nextWtngSec: null, nextWtngMetric: queueMetric('UNAVAILABLE', 'NEXT_ARRIVAL_WAIT', '양수인 단일 시설 평균 처리시간이 필요합니다.') };
    }
    if (profile.wtngPsgCnt === 0) {
        return { nextWtngSec: 0, nextWtngMetric: queueMetric('CALCULATED', 'NEXT_ARRIVAL_WAIT', '대기열이 비어 있어 바로 처리를 시작한다고 봅니다.') };
    }

    return {
        nextWtngSec: ((profile.wtngPsgCnt + 1) / capacity) * 3600,
        nextWtngMetric: queueMetric('ESTIMATED', 'NEXT_ARRIVAL_WAIT', '(종료 시점 대기인원 + 1) / 총 처리능력 × 3600. 이후 유입과 무관'),
    };
}

function toQueueClear(profile: QueueScenarioProfile, fcltCnt: number, ymd: string, baseMinute: number): FcltQueueClearDto {
    const lambda = profile.arvlPerHour;
    const mu = profile.prcsSec === null ? null : 3600 / profile.prcsSec;
    const excess = Math.max(0, profile.wtngPsgCnt - profile.targetQueueCnt);
    const capacity = mu === null ? null : fcltCnt * mu;

    let clearSec: number | null = null;
    let clearMetric: QueueMetricDto;

    if (excess === 0) {
        clearSec = 0;
        clearMetric = queueMetric('CALCULATED', 'DIRECT', '종료 시점 대기인원이 이미 목표 이하입니다.');
    } else if (capacity === null) {
        clearMetric = queueMetric('UNAVAILABLE', 'FLOW_BALANCE', '양수인 단일 시설 평균 처리시간이 필요합니다.');
    } else if (capacity - lambda <= 0) {
        clearMetric = queueMetric('UNREACHABLE', 'FLOW_BALANCE', '처리능력이 유입률 이하라 현재 조건으로 목표까지 감소하지 않습니다.');
    } else {
        clearSec = (excess / (capacity - lambda)) * 3600;
        clearMetric = queueMetric('ESTIMATED', 'FLOW_BALANCE', '유입률/처리능력이 일정한 유입/처리 차이 계산');
    }

    const clear: FcltQueueClearDto = {
        fcltCnt,
        cgnClearMin: clearSec === null ? null : clearSec / 60,
        cgnClearDt: clearSec === null ? '' : toDt(ymd, baseMinute, clearSec),
        clearMetric,
        ...toQueueNextWtng(profile, fcltCnt, capacity),
        wtngProb: null,
        loadRatio: null,
        thryWtngSec: null,
        thryWtngPsgCnt: null,
        erlangMetric: queueMetric('UNAVAILABLE', 'ERLANG_C', 'M/M/s 에는 양수인 운영 수와 처리율이 필요합니다.'),
    };

    if (mu === null || capacity === null || capacity === 0) return clear;

    if (lambda >= capacity) {
        clear.erlangMetric = queueMetric('UNAVAILABLE', 'ERLANG_C', '유입률이 총 처리능력 이상이라 유한한 정상상태 대기값이 없습니다.');
        return clear;
    }

    const load = lambda / capacity;
    const offered = lambda / mu;
    let erlangB = 1;

    for (let index = 0; index < fcltCnt; index++) {
        erlangB = (offered * erlangB) / (index + 1 + offered * erlangB);
    }

    const wtngProb = erlangB / (1 - load + load * erlangB);
    const thryWtngSec = (wtngProb / (capacity - lambda)) * 3600;

    return {
        ...clear,
        wtngProb,
        loadRatio: load,
        thryWtngSec,
        thryWtngPsgCnt: (lambda / 3600) * thryWtngSec,
        erlangMetric: queueMetric('ESTIMATED', 'ERLANG_C', 'M/M/s 정상상태 모형값'),
    };
}

function toQueueRecommend(profile: QueueScenarioProfile, targetMin: number): FcltQueueRecommendDto {
    const lambda = profile.arvlPerHour;
    const mu = profile.prcsSec === null ? null : 3600 / profile.prcsSec;
    const excess = Math.max(0, profile.wtngPsgCnt - profile.targetQueueCnt);
    const requiredRate = lambda + (excess * 3600) / (targetMin * 60);
    const base: FcltQueueRecommendDto = {
        targetMin,
        reqCnt: null,
        extraCnt: null,
        reduceCnt: null,
        flowBasedReqCnt: null,
        stableMinCnt: lambda === 0 ? 0 : mu === null ? null : Math.floor(lambda / mu + 1e-9) + 1,
        stableAplyYn: null,
        capaAvlYn: null,
        goalMetYn: null,
        reqMetric: queueMetric('UNAVAILABLE', 'FLOW_BALANCE', '양수인 단일 시설 평균 처리시간이 필요합니다.'),
    };

    if (requiredRate > 0 && mu === null) return base;

    const flowBasedReqCnt = requiredRate === 0 ? 0 : Math.max(1, Math.ceil(requiredRate / (mu ?? 1)));
    const reqCnt = Math.max(flowBasedReqCnt, base.stableMinCnt ?? 0);

    return {
        ...base,
        reqCnt,
        extraCnt: Math.max(reqCnt - profile.oprCnt, 0),
        reduceCnt: Math.max(profile.oprCnt - reqCnt, 0),
        flowBasedReqCnt,
        stableAplyYn: reqCnt > flowBasedReqCnt ? 'Y' : 'N',
        capaAvlYn: profile.totCnt === null ? null : reqCnt <= profile.totCnt ? 'Y' : 'N',
        reqMetric: queueMetric('ESTIMATED', 'FLOW_BALANCE', '현재 운영분을 포함한 총 소요 수'),
    };
}

function failQueueScenario(errorMessage: string): FcltQueueScenarioDto {
    return { error: true, errorMessage } as FcltQueueScenarioDto;
}

function buildFcltQueueScenario(req: FcltQueueScenarioReq): FcltQueueScenarioDto {
    const key = `${req.tmnlId}-${req.fcltType}-${req.unitCd}`;
    const profile = QUEUE_SCENARIO_PROFILES[key] ?? QUEUE_SCENARIO_PROFILES['T1-CHKN-B'];
    const ymd = BASE_INFO.ymd;
    const baseMinute = Math.min(toMinuteOfDay(req.hhmm) + QUEUE_OBS_MIN, MIN_PER_DAY);
    const mu = profile.prcsSec === null ? null : 3600 / profile.prcsSec;

    if (req.mode === 'COUNT' && req.oprFcltCnt !== undefined) {
        if (profile.totCnt === null && req.oprFcltCnt !== profile.oprCnt) {
            return failQueueScenario('배정 가능한 최대 수량이 확인되지 않아 시설 수를 조정할 수 없습니다.');
        }
        if (profile.totCnt !== null && req.oprFcltCnt > profile.totCnt) {
            return failQueueScenario(`배정 가능한 최대 수량(${profile.totCnt}개)을 넘었습니다.`);
        }
    }

    const result: FcltQueueScenarioDto = {
        error: false,
        errorMessage: '',
        tmnlId: req.tmnlId,
        fcltType: req.fcltType,
        unitCd: req.unitCd,
        fcltNm: req.fcltType === 'CHKN' ? `${req.unitCd} 아일랜드` : `${req.unitCd}번 출국장`,
        mode: req.mode,
        baseDt: toDt(ymd, baseMinute),
        obsBgnDt: toDt(ymd, baseMinute - QUEUE_OBS_MIN),
        obsEndDt: toDt(ymd, baseMinute),
        dataSrc: 'CAST',
        wtngPsgCnt: profile.wtngPsgCnt,
        targetQueueCnt: profile.targetQueueCnt,
        oprFcltCnt: profile.oprCnt,
        totCnt: profile.totCnt,
        totCntRsn: profile.totCnt === null ? '보안검색대(SC) 시설 마스터에서 배정 가능 수량을 찾지 못했습니다.' : '',
        arvlRate: profile.arvlPerHour / 60,
        srvcRate: mu === null ? null : mu / 60,
        arvlMetric: queueMetric('ESTIMATED', 'QUEUE_BALANCE', '관측구간 보존식 유입인원 / 구간초 × 3600 (명/시간)'),
        srvcMetric:
            mu === null
                ? queueMetric('UNAVAILABLE', 'SERVICE_TIME', '양수인 단일 시설 평균 처리시간이 필요합니다.')
                : queueMetric('ESTIMATED', 'SERVICE_TIME', '3600 / 평균 처리시간'),
        dfltTargetMin: QUEUE_TARGET_MIN.dflt,
        minTargetMin: QUEUE_TARGET_MIN.min,
        maxTargetMin: QUEUE_TARGET_MIN.max,
        asmpList: QUEUE_ASMP_LIST[req.fcltType],
        current: toQueueClear(profile, profile.oprCnt, ymd, baseMinute),
        scenario: null,
        totScenario: null,
        recommend: null,
    };

    if (req.mode === 'COUNT') {
        return {
            ...result,
            scenario: toQueueClear(profile, req.oprFcltCnt ?? profile.oprCnt, ymd, baseMinute),
        };
    }

    const recommend = toQueueRecommend(profile, req.targetMinutes ?? QUEUE_TARGET_MIN.dflt);

    if (recommend.reqCnt === null) return { ...result, recommend };

    if (profile.totCnt !== null && recommend.reqCnt > profile.totCnt) {
        return { ...result, recommend, totScenario: toQueueClear(profile, profile.totCnt, ymd, baseMinute) };
    }

    const scenario = toQueueClear(profile, recommend.reqCnt, ymd, baseMinute);
    const goalMet = scenario.cgnClearMin !== null && scenario.cgnClearMin <= recommend.targetMin + 1e-9;

    return {
        ...result,
        scenario,
        recommend: { ...recommend, goalMetYn: scenario.cgnClearMin === null ? null : goalMet ? 'Y' : 'N' },
    };
}

export const dashboardMock = {
    /**
     * 조회 조건 기준 정보.
     * 기준일자는 화면 목업과 어긋나지 않도록 요청 값과 무관하게 2026-07-10 로 고정한다.
     *
     * 지목된 smltId 가 있으면 그대로 되돌려주고, 모니터링 목업의 ID 규칙(`STD-` / `USR-`)으로
     * 시뮬레이션 구분을 정한다 — 그래야 일일/사용자 두 경로를 목업으로 다 볼 수 있다.
     */
    getBaseInfo: (smltId?: string): DsbdBaseInfoDto =>
        smltId ? { ...BASE_INFO, smltId, smltType: smltId.startsWith('USR') ? 'USER' : 'DAILY' } : { ...BASE_INFO, smltType: 'DAILY' },

    getHeader: (): DsbdHeaderDto => HEADER,

    getTmnlSmry: (tmnlId: TmnlId, hhmm: string, intrvlMin: number): TmnlSmryDto => buildTmnlSmry(tmnlId, hhmm, intrvlMin),

    getTmnlRsltByTime: (tmnlId: TmnlId, category: DsbdCategory): DsbdRsltDto[] => buildRsltList(tmnlId, category),

    getFcltCardList: (tmnlId: TmnlId, hhmm: string, fcltType: 'CHKN' | 'DEP'): DsbdFcltCardDto[] => buildFcltCardList(tmnlId, hhmm, fcltType),

    getFcltQueueScenario: (req: FcltQueueScenarioReq): FcltQueueScenarioDto => buildFcltQueueScenario(req),
};
