import type {
    CongestionStatus,
    DsbdBaseInfoDto,
    DsbdCategory,
    DsbdFcltCardDto,
    DsbdHeaderDto,
    DsbdRsltDto,
    FcltUnitDto,
    HourlyPsgDto,
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

/** 터미널별 시간대(00~23시) 출발여객 — 새벽에 낮고 오전·저녁에 두 번 솟는 모양 */
const HOURLY_PSG: Record<TmnlId, number[]> = {
    T1: [
        60, 20, 10, 0, 30, 420, 1580, 2240, 2680, 2510, 2080, 1760, 1640, 1520, 1730, 1980, 2210,
        2380, 2090, 1620, 1080, 720, 400, 180,
    ],
    T2: [
        40, 10, 0, 0, 20, 360, 1320, 1980, 2320, 2180, 1820, 1560, 1420, 1330, 1510, 1720, 1930,
        2060, 1810, 1400, 940, 610, 340, 150,
    ],
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
type TmnlSmryBase = Omit<
    TmnlSmryDto,
    'itvlMin' | 'itvlFltCnt' | 'itvlPsgCnt' | 'itvlBefFltDiffCnt' | 'itvlBefPsgDiffCnt'
>;

const TMNL_SMRY: Record<TmnlId, TmnlSmryBase> = {
    T1: {
        error: false,
        errorMessage: '',
        tmnlId: 'T1',
        fltCnt: TMNL_FLT_CNT.T1,
        fltDiffCnt: 12,
        befFltDiffCnt: 2,
        psgCnt: sum(HOURLY_PSG.T1),
        psgDiffCnt: 2688,
        befPsgDiffCnt: 1234,
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
        befFltDiffCnt: 5,
        psgCnt: sum(HOURLY_PSG.T2),
        psgDiffCnt: 1942,
        befPsgDiffCnt: 842,
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
const BEF_DAY_RATIO: Record<TmnlId, number> = { T1: 0.94, T2: 1.05 };

const MIN_PER_HOUR = 60;
const MIN_PER_DAY = 24 * MIN_PER_HOUR;

/** 시간대별 운항편 — 하루 합이 TMNL_FLT_CNT 와 맞도록 여객 곡선에 비례 배분한다 */
function toHourlyFlt(tmnlId: TmnlId): number[] {
    const counts = HOURLY_PSG[tmnlId];
    const total = sum(counts);

    return counts.map((psgCnt) => (TMNL_FLT_CNT[tmnlId] * psgCnt) / total);
}

/** 시간대(00~23시) 곡선에서 [bgnHhmm, +itvlMin) 과 겹치는 분만큼만 비례해 더한다 */
function sumByItvl(hourly: number[], bgnHhmm: string, itvlMin: number): number {
    const bgnMin = Number(bgnHhmm.slice(0, 2)) * MIN_PER_HOUR + Number(bgnHhmm.slice(2, 4));
    // 예측시분에 날짜가 없어 자정을 넘는 구간은 그날 끝까지로 자른다 (서버와 같은 규칙)
    const endMin = Math.min(bgnMin + itvlMin, MIN_PER_DAY);

    const total = hourly.reduce((acc, count, hour) => {
        const overlap =
            Math.min(endMin, (hour + 1) * MIN_PER_HOUR) - Math.max(bgnMin, hour * MIN_PER_HOUR);

        return overlap > 0 ? acc + (count * overlap) / MIN_PER_HOUR : acc;
    }, 0);

    return Math.round(total);
}

function buildTmnlSmry(tmnlId: TmnlId, hhmm: string, itvlMin: number): TmnlSmryDto {
    const itvlFltCnt = sumByItvl(toHourlyFlt(tmnlId), hhmm, itvlMin);
    const itvlPsgCnt = sumByItvl(HOURLY_PSG[tmnlId], hhmm, itvlMin);
    const ratio = BEF_DAY_RATIO[tmnlId];

    return {
        ...TMNL_SMRY[tmnlId],
        itvlMin,
        itvlFltCnt,
        itvlPsgCnt,
        itvlBefFltDiffCnt: itvlFltCnt - Math.round(itvlFltCnt * ratio),
        itvlBefPsgDiffCnt: itvlPsgCnt - Math.round(itvlPsgCnt * ratio),
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
            wtngPsgCnt:
                hour <= MEASURED_UNTIL_HOUR
                    ? Math.round(fcstWtngPsgCnt * (0.85 + ((hour * 13) % 6) / 20))
                    : null,
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
        const cgnStatus: CongestionStatus = busyLabels.includes(unitCd)
            ? i % 2 === 0
                ? 'VERY_BUSY'
                : 'BUSY'
            : i % 3 === 0
              ? 'FREE'
              : 'NORMAL';

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
            hrlyPrcsPsgCnt: 42,
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
            hrlyPrcsPsgCnt: 36,
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
            hrlyPrcsPsgCnt: 38,
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
            hrlyPrcsPsgCnt: 30,
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
            hrlyPrcsPsgCnt: 44,
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
            hrlyPrcsPsgCnt: 31,
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
            hrlyPrcsPsgCnt: 44,
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
            hrlyPrcsPsgCnt: 31,
            hrlyPrcsRate: 55,
            cgnClearTime: '1130',
            cgnClearRate: 40,
            cgnStatus: 'NORMAL',
            recommend: { targetNm: '보안검색대', reqCnt: 4, needAssignYn: 'N' },
            unitList: DPTGT_UNITS.T2,
        },
    ],
};

const RECOMMEND_LEAD_MIN = 10;

const FCLT_NORMAL_MAX: Record<'CHKN' | 'DEP', number> = {
    CHKN: 420,
    DEP: 320,
};

const FCLT_GRADE_MAX: Record<'CHKN' | 'DEP', [number, number, number]> = {
    CHKN: [180, 420, 650],
    DEP: [140, 320, 520],
};

function toMinuteOfDay(hhmm: string): number {
    return Number(hhmm.slice(0, 2)) * MIN_PER_HOUR + Number(hhmm.slice(2, 4));
}

function toHhmm(minuteOfDay: number): string {
    const normalized = minuteOfDay % MIN_PER_DAY;
    return `${String(Math.floor(normalized / MIN_PER_HOUR)).padStart(2, '0')}${String(normalized % MIN_PER_HOUR).padStart(2, '0')}`;
}

function toFcltStatus(fcltType: 'CHKN' | 'DEP', waitingCount: number): CongestionStatus {
    const [freeMax, normalMax, busyMax] = FCLT_GRADE_MAX[fcltType];
    if (waitingCount <= freeMax) return 'FREE';
    if (waitingCount <= normalMax) return 'NORMAL';
    return waitingCount <= busyMax ? 'BUSY' : 'VERY_BUSY';
}

function buildRollingCard(
    card: DsbdFcltCardDto,
    hhmm: string,
    fcltType: 'CHKN' | 'DEP',
    index: number,
): DsbdFcltCardDto {
    const bgnMinute = toMinuteOfDay(hhmm);
    const endMinute = Math.min(bgnMinute + MIN_PER_HOUR, MIN_PER_DAY);
    const actualMinutes = endMinute - bgnMinute;
    const seed = index + (card.cardId.charCodeAt(card.cardId.length - 1) % 7);
    const queueAt = (minute: number) =>
        Math.max(
            0,
            Math.round(
                card.wtngPsgCnt * (0.78 + 0.2 * Math.sin((minute + seed * 31) / 95) + seed * 0.012),
            ),
        );
    const rateAt = (minute: number) =>
        Math.max(1, card.hrlyPrcsPsgCnt * (0.88 + 0.16 * Math.cos((minute + seed * 17) / 80)));
    const slotMinutes: number[] = [];

    for (let minute = bgnMinute; minute < endMinute; minute += 10) {
        slotMinutes.push(minute);
    }

    // 종료 시각 한 칸은 피크 탐색 상한이다. 자정에서는 그 칸이 없다 (서버와 같은 규칙)
    const hasEndSnapshot = endMinute < MIN_PER_DAY;
    const trajectory = (hasEndSnapshot ? [...slotMinutes, endMinute] : slotMinutes).map(
        (minute) => ({ minute, queue: queueAt(minute) }),
    );
    const processedPsgCnt = sum(
        slotMinutes.map((minute) => rateAt(minute) * Math.min(10, endMinute - minute)),
    );
    const paxPerMin = Math.round(processedPsgCnt / actualMinutes);
    const openCount = Math.max(1, card.oprCnt);
    const serviceRate = processedPsgCnt / openCount / actualMinutes;
    const targetQueue = FCLT_NORMAL_MAX[fcltType];

    const window = trajectory.filter((point) => point.minute >= bgnMinute + RECOMMEND_LEAD_MIN);
    const peak = window.reduce(
        (best, point) => (point.queue > best.queue ? point : best),
        window[0] ?? trajectory[trajectory.length - 1],
    );
    const leadMinutes = Math.max(RECOMMEND_LEAD_MIN, peak.minute - bgnMinute);
    const extraCnt = Math.max(
        0,
        Math.ceil((peak.queue - targetQueue) / (serviceRate * leadMinutes)),
    );
    const clearPoint = trajectory.find(
        (point) => point.queue - extraCnt * serviceRate * (point.minute - bgnMinute) <= targetQueue,
    );
    const clearMinutes = clearPoint ? clearPoint.minute - bgnMinute : leadMinutes;
    const displayPeak = Math.max(...slotMinutes.map(queueAt));

    return {
        ...card,
        wtngPsgCnt: displayPeak,
        hrlyPrcsPsgCnt: paxPerMin,
        hrlyPrcsRate: Math.round((processedPsgCnt * 100) / (processedPsgCnt + displayPeak)),
        cgnClearTime: toHhmm(bgnMinute + clearMinutes),
        cgnClearRate: 0,
        cgnStatus: toFcltStatus(fcltType, displayPeak),
        recommend: {
            ...card.recommend,
            reqCnt: openCount + extraCnt,
            needAssignYn: fcltType === 'CHKN' ? 'Y' : 'N',
        },
        unitList: card.unitList.map((unit) => ({ ...unit })),
    };
}

function buildFcltCardList(
    tmnlId: TmnlId,
    hhmm: string,
    fcltType: 'CHKN' | 'DEP',
): DsbdFcltCardDto[] {
    const cards = fcltType === 'CHKN' ? CHKN_CARDS[tmnlId] : DPTGT_CARDS[tmnlId];
    return cards.map((card, index) => buildRollingCard(card, hhmm, fcltType, index));
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
        smltId
            ? { ...BASE_INFO, smltId, smltType: smltId.startsWith('USR') ? 'USER' : 'DAILY' }
            : { ...BASE_INFO, smltType: 'DAILY' },

    getHeader: (): DsbdHeaderDto => HEADER,

    getTmnlSmry: (tmnlId: TmnlId, hhmm: string, itvlMin: number): TmnlSmryDto =>
        buildTmnlSmry(tmnlId, hhmm, itvlMin),

    getTmnlRsltByTime: (tmnlId: TmnlId, category: DsbdCategory): DsbdRsltDto[] =>
        buildRsltList(tmnlId, category),

    getFcltCardList: (tmnlId: TmnlId, hhmm: string, fcltType: 'CHKN' | 'DEP'): DsbdFcltCardDto[] =>
        buildFcltCardList(tmnlId, hhmm, fcltType),
};
