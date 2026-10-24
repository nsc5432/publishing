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
import { MOCK_NORMAL_UPPER_EXCLUSIVE_SEC, mockByWaitDesc, mockGradeOf, mockWorstOf } from './cgnGrade.mock';

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
type TmnlSmryBase = Omit<TmnlSmryDto, 'cgnStatus' | 'intrvlMin' | 'intrvlFltCnt' | 'intrvlPsgCnt' | 'intrvlYesterdayFltDiffCnt' | 'intrvlYesterdayPsgDiffCnt'>;

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

    // 대표 등급은 PRIME TIME(대기인원 피크)과 별개로 조회 시각 시설 카드 중 최고 등급이다 (서버와 같은 규칙)
    const cardList = [...buildFcltCardList(tmnlId, hhmm, 'CHKN'), ...buildFcltCardList(tmnlId, hhmm, 'DEP')];

    return {
        ...TMNL_SMRY[tmnlId],
        cgnStatus: mockWorstOf(cardList.map((card) => card.cgnStatus)),
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

/** 칩 목록 — 혼잡도는 코드 순서대로 돌려 쓴다 (목업이라 규칙만 보이면 된다). unknownLabels 는 산정 불가 칩 */
function buildUnits(labels: string[], busyLabels: string[], closedLabels: string[] = [], unknownLabels: string[] = []) {
    return labels.map<FcltUnitDto>((unitCd, i) => {
        const cgnStatus: CongestionStatus | null = unknownLabels.includes(unitCd)
            ? null
            : busyLabels.includes(unitCd)
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
    T1: buildUnits(CHKN_LABELS, ['N', 'H', 'C', 'B'], ['A'], ['G']),
    T2: buildUnits(CHKN_LABELS, ['M', 'C'], ['A'], ['L']),
};

const DPTGT_UNITS: Record<TmnlId, FcltUnitDto[]> = {
    T1: buildUnits(['6', '5', '4', '3', '2', '1'], ['4', '3'], ['6'], ['5']),
    T2: buildUnits(['2', '1'], ['1'], []),
};

/** 등급 / 평균 / 해소값은 buildFcltCard 가 프로필에서 채운다 */
type FcltCardSeed = Omit<DsbdFcltCardDto, 'cgnWtngSec'>;

const CHKN_CARDS: Record<TmnlId, FcltCardSeed[]> = {
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

const DPTGT_CARDS: Record<TmnlId, FcltCardSeed[]> = {
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

function toMinuteOfDay(hhmm: string): number {
    return Number(hhmm.slice(0, 2)) * MIN_PER_HOUR + Number(hhmm.slice(2, 4));
}

// 서버처럼 카드도 혼잡해소 팝업 첫 화면(TIME / 목표 30분)과 같은 프로필 / 같은 식으로 만든다
function buildFcltCard(card: FcltCardSeed, hhmm: string, fcltType: 'CHKN' | 'DEP'): DsbdFcltCardDto {
    const profile = QUEUE_SCENARIO_PROFILES[card.cardId] ?? QUEUE_SCENARIO_PROFILES['T1-CHKN-B'];
    const unitCd = fcltType === 'CHKN' ? card.island : card.dptgtNo;
    const targetMin = QUEUE_TARGET_MIN.dflt;
    // 평가시각은 조회 시각 그대로다 — 관측구간은 [hhmm-30, hhmm)
    const baseMinute = toMinuteOfDay(hhmm);
    const capacity = profile.prcsSec === null ? 0 : (profile.oprCnt * 3600) / profile.prcsSec;
    const { reqCnt } = toQueueRecommend(profile, targetMin);
    const clear = reqCnt === null ? null : toQueueClear(profile, reqCnt, BASE_INFO.ymd, baseMinute, targetMin);
    const clearMin = clear?.cgnClearMin == null ? null : Math.ceil(clear.cgnClearMin - 1e-9);
    const cgnStatus = mockGradeOf(profile.obsWtngSec);

    return {
        ...card,
        // 카드와 팝업이 같은 원천이어야 한다 — 운영 / 보유 수량도 프로필을 따른다
        oprCnt: profile.oprCnt,
        totCnt: profile.totCnt ?? card.totCnt,
        wtngPsgCnt: profile.wtngPsgCnt,
        hrlyPrcsRate: capacity === 0 ? 0 : Math.round((profile.arvlPerHour / capacity) * 100),
        cgnClearTime: clear === null || clearMin === null ? '' : clear.cgnClearDt.slice(8, 12),
        cgnClearRate: clearMin === null ? 0 : Math.round((Math.max(targetMin - clearMin, 0) / targetMin) * 100),
        cgnWtngSec: profile.obsWtngSec,
        cgnStatus,
        recommend: {
            targetNm: reqCnt === null ? '' : card.recommend.targetNm,
            reqCnt,
            needAssignYn: fcltType === 'CHKN' && reqCnt !== null && reqCnt > profile.oprCnt ? 'Y' : 'N',
        },
        // 칩도 카드와 같은 판정이어야 한다 — 카드가 있는 시설의 칩은 카드 등급으로 맞춘다
        unitList: card.unitList.map((unit) => (unit.unitCd === unitCd ? { ...unit, cgnStatus } : { ...unit })),
    };
}

// 서버처럼 평균 대기시간이 긴 시설부터 — 화면은 첫 카드를 먼저 보여준다
function buildFcltCardList(tmnlId: TmnlId, hhmm: string, fcltType: 'CHKN' | 'DEP'): DsbdFcltCardDto[] {
    const cards = fcltType === 'CHKN' ? CHKN_CARDS[tmnlId] : DPTGT_CARDS[tmnlId];

    return cards
        .map((card) => buildFcltCard(card, hhmm, fcltType))
        .sort(
            mockByWaitDesc(
                (card) => card.cgnWtngSec,
                (card) => card.wtngPsgCnt,
                (card) => card.cardId,
            ),
        );
}

/* ================= 혼잡해소 시나리오 팝업 =================
 *
 * 목업 응답을 입력에 반응시키려고 서버(WaitAvgForecast)와 같은 식을 작게 흉내 낸다.
 * 화면 검증용 fixture 생성기일 뿐 운영 계산은 Java queue 클래스가 맡는다.
 *
 * 해소 = 직전 30분 처리 여객 평균 대기시간이 NORMAL 상한 미만이 되는 시각.
 * 창의 평가시각 이전은 관측 이력(평균 obsWtngSec 로 고르게 처리), 이후는 1분 단위 유체 FIFO 예측이다.
 */

interface QueueScenarioProfile {
    wtngPsgCnt: number;
    /** 직전 30분 처리 여객 평균 대기 (초). null 이면 처리 여객이 없어 산정 불가 */
    obsWtngSec: number | null;
    /** 직전 30분 처리인원 (명/시간) */
    obsPrcsPerHour: number;
    /** 남은 대기열이 기다린 시간 — 1분 ~ 이 값(분)에 고르게 퍼져 있다고 본다 */
    queueAgeMaxMin: number;
    arvlPerHour: number;
    /** null 이면 처리율 미산출 경우 */
    prcsSec: number | null;
    oprCnt: number;
    /** null 이면 배정가능 최대수 미확인 경우 */
    totCnt: number | null;
}

/** 키는 `${tmnlId}-${fcltType}-${unitCd}` — 등급 / 해소 / 추천의 대표 경우를 하나씩 담았다 */
const QUEUE_SCENARIO_PROFILES: Record<string, QueueScenarioProfile> = {
    // NORMAL, 이미 목표 미만 → 해소 0분
    'T1-CHKN-B': { wtngPsgCnt: 40, obsWtngSec: 1500, obsPrcsPerHour: 200, queueAgeMaxMin: 20, arvlPerHour: 180, prcsSec: 120, oprCnt: 8, totCnt: 10 },
    // VERY_BUSY, 안정 조건 수량이 보유 수량을 넘는다 → 보유 전량 배정 결과
    'T1-CHKN-D': { wtngPsgCnt: 640, obsWtngSec: 3900, obsPrcsPerHour: 820, queueAgeMaxMin: 70, arvlPerHour: 900, prcsSec: 60, oprCnt: 14, totCnt: 14 },
    // BUSY, 보유 수량 안에서 추천
    'T2-CHKN-C': { wtngPsgCnt: 520, obsWtngSec: 2700, obsPrcsPerHour: 500, queueAgeMaxMin: 50, arvlPerHour: 480, prcsSec: 72, oprCnt: 11, totCnt: 12 },
    'T2-CHKN-E': { wtngPsgCnt: 300, obsWtngSec: 1900, obsPrcsPerHour: 400, queueAgeMaxMin: 40, arvlPerHour: 360, prcsSec: 60, oprCnt: 8, totCnt: 10 },
    'T1-DEP-3': { wtngPsgCnt: 380, obsWtngSec: 2500, obsPrcsPerHour: 650, queueAgeMaxMin: 40, arvlPerHour: 600, prcsSec: 24, oprCnt: 5, totCnt: 6 },
    // 39분 59초 — 정확히 40분 미만이라 NORMAL (경계 확인용)
    'T1-DEP-1': { wtngPsgCnt: 360, obsWtngSec: 2399.5, obsPrcsPerHour: 450, queueAgeMaxMin: 40, arvlPerHour: 420, prcsSec: 24, oprCnt: 4, totCnt: null },
    // 처리율 미산출 → 추천 / 해소 산정 불가
    'T2-DEP-1': { wtngPsgCnt: 410, obsWtngSec: 2600, obsPrcsPerHour: 500, queueAgeMaxMin: 45, arvlPerHour: 540, prcsSec: null, oprCnt: 2, totCnt: 2 },
    // 직전 30분 처리 여객 0명 → 등급 산정 불가 (중립색)
    'T2-DEP-2': { wtngPsgCnt: 0, obsWtngSec: null, obsPrcsPerHour: 0, queueAgeMaxMin: 0, arvlPerHour: 0, prcsSec: 24, oprCnt: 1, totCnt: 2 },
};

const QUEUE_OBS_MIN = 30;
const QUEUE_TARGET_MIN = { dflt: 30, min: 1, max: 120 };
const QUEUE_HORIZON_MIN = MIN_PER_DAY;
const QUEUE_EPS = 1e-9;

const QUEUE_ASMP_COMMON = [
    '혼잡등급 / 해소 목표는 기준시각 직전 30분 [t-30분, t) 에 처리된 여객의 처리인원 가중평균 대기시간이다. 해소는 이 평균이 NORMAL 상한 미만이 되는 시각',
    '미래 평균은 같은 정의의 이동평균이다. 창의 기준시각 이전은 실제 처리 이력, 이후는 1분 단위 유체 FIFO 예측이며 남은 대기자의 대기시간은 이어서 센다',
    '추천 수량은 목표 시간 안에 목표 미만이 되고 처리능력(수량 × 처리율)이 유입률보다 큰 최소 총수다',
    '예측 구간 동안 유입률 / 처리율이 일정하고 시설 수는 즉시 바뀐다고 본다',
    'M/M/s 적용 가정(정상상태 참고지표 전용): 포아송 도착 / 지수 처리시간 / 동일 처리율의 병렬 시설 / 공용 대기열 선착순 / 무한 대기공간 / 이탈 없음 (통계 검증 아님)',
];

const QUEUE_ASMP_LIST: Record<'CHKN' | 'DEP', string[]> = {
    CHKN: [...QUEUE_ASMP_COMMON, '아일랜드 유인 카운터(CC) 공용 Queue — 부스별 결과를 재구성한 값'],
    DEP: [
        ...QUEUE_ASMP_COMMON,
        'SC / SR 결과를 합산한 하나의 보안검색 Queue (직렬 / 병렬 관계 미검증)',
        '잔여 대기열의 도착 시각은 10분 보존식 유입을 분 단위로 균등 분배해 FIFO 로 되짚은 근사다',
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

/** 예측 1회 — 창 끝 j분(t+j)의 평균은 관측 이력 [t-30+j, t) 와 예측 [max(0, j-30), j) 를 합친다 */
interface QueueTrace {
    avgAt: (endMin: number) => number | null;
    remainAt: (endMin: number) => number;
}

/** 산정할 수 없으면 사유 문자열, 할 수 있으면 null */
function forecastGap(profile: QueueScenarioProfile, fcltCnt: number): string | null {
    if (profile.obsWtngSec === null) return '직전 30분에 처리된 여객이 없습니다.';
    if (fcltCnt > 0 && profile.prcsSec === null) return '시설 처리율을 구할 수 없습니다. 양수인 단일 시설 평균 처리시간이 필요합니다.';

    return null;
}

function simulateQueue(profile: QueueScenarioProfile, fcltCnt: number, minutes: number): QueueTrace {
    const capPerMin = fcltCnt === 0 || profile.prcsSec === null ? 0 : (fcltCnt * 60) / profile.prcsSec;
    const arrivalPerMin = profile.arvlPerHour / MIN_PER_HOUR;
    const histPrcsPerMin = profile.obsPrcsPerHour / MIN_PER_HOUR;
    const histWaitPerMin = histPrcsPerMin * (profile.obsWtngSec ?? 0);
    // 원소는 [도착 분(t 기준, 0 이하), 인원]
    const queue: [number, number][] = [];

    for (let age = profile.queueAgeMaxMin; age >= 1; age--) {
        queue.push([-age, profile.wtngPsgCnt / profile.queueAgeMaxMin]);
    }

    const prcs: number[] = [];
    const wait: number[] = [];
    const remain: number[] = [];
    let queueCnt = profile.queueAgeMaxMin === 0 ? 0 : profile.wtngPsgCnt;

    for (let minute = 0; minute < minutes; minute++) {
        if (arrivalPerMin > 0) {
            queue.push([minute, arrivalPerMin]);
            queueCnt += arrivalPerMin;
        }

        let capacity = capPerMin;
        let prcsSum = 0;
        let waitSum = 0;

        while (capacity > QUEUE_EPS && queue.length > 0) {
            const head = queue[0];
            const take = Math.min(capacity, head[1]);

            prcsSum += take;
            waitSum += take * (minute - head[0]) * 60;
            head[1] -= take;
            capacity -= take;
            queueCnt -= take;

            if (head[1] <= QUEUE_EPS) queue.shift();
        }

        prcs.push(prcsSum);
        wait.push(waitSum);
        remain.push(Math.max(queueCnt, 0));
    }

    return {
        avgAt: (endMin) => {
            const histMin = Math.max(QUEUE_OBS_MIN - endMin, 0);
            let prcsSum = histPrcsPerMin * histMin;
            let waitSum = histWaitPerMin * histMin;

            for (let minute = Math.max(0, endMin - QUEUE_OBS_MIN); minute < endMin; minute++) {
                prcsSum += prcs[minute];
                waitSum += wait[minute];
            }

            return prcsSum <= QUEUE_EPS ? null : waitSum / prcsSum;
        },
        remainAt: (endMin) => (endMin === 0 ? profile.wtngPsgCnt : remain[endMin - 1]),
    };
}

function reachMinOf(trace: QueueTrace, horizonMin: number): number {
    for (let endMin = 0; endMin <= horizonMin; endMin++) {
        const value = trace.avgAt(endMin);

        if (value !== null && value < MOCK_NORMAL_UPPER_EXCLUSIVE_SEC) return endMin;
    }

    return -1;
}

function meetsTarget(trace: QueueTrace, targetMin: number): boolean {
    if (reachMinOf(trace, targetMin) < 0) return false;

    const atTarget = trace.avgAt(targetMin);

    // 목표 시각 창에 처리 여객이 없으면 남은 대기자가 없을 때만 충족이다 (0초로 간주하지 않는다)
    return atTarget === null ? trace.remainAt(targetMin) <= QUEUE_EPS : atTarget < MOCK_NORMAL_UPPER_EXCLUSIVE_SEC;
}

function toQueueClear(profile: QueueScenarioProfile, fcltCnt: number, ymd: string, baseMinute: number, fcstMin: number): FcltQueueClearDto {
    const lambda = profile.arvlPerHour;
    const mu = profile.prcsSec === null ? null : 3600 / profile.prcsSec;
    const capacity = mu === null ? null : fcltCnt * mu;
    const gap = forecastGap(profile, fcltCnt);
    const trace = gap === null ? simulateQueue(profile, fcltCnt, Math.max(QUEUE_HORIZON_MIN, fcstMin)) : null;
    const reachMin = trace === null ? -1 : reachMinOf(trace, QUEUE_HORIZON_MIN);
    const fcstWtngSec = trace === null ? null : trace.avgAt(fcstMin);

    let clearSec: number | null = null;
    let clearMetric: QueueMetricDto;

    if (gap !== null) {
        clearMetric = queueMetric('UNAVAILABLE', 'WAIT_AVG_FORECAST', gap);
    } else if (reachMin === 0) {
        clearSec = 0;
        clearMetric = queueMetric('CALCULATED', 'WAIT_AVG_FORECAST', `직전 30분 처리 여객 평균이 이미 ${MOCK_NORMAL_UPPER_EXCLUSIVE_SEC}초 미만입니다.`);
    } else if (reachMin > 0) {
        clearSec = reachMin * 60;
        clearMetric = queueMetric(
            'ESTIMATED',
            'WAIT_AVG_FORECAST',
            `${reachMin}분 후 직전 30분 처리 여객 예측 평균이 ${MOCK_NORMAL_UPPER_EXCLUSIVE_SEC}초 미만이 됩니다.`,
        );
    } else if ((capacity ?? 0) <= lambda) {
        clearMetric = queueMetric(
            'UNREACHABLE',
            'WAIT_AVG_FORECAST',
            '처리능력이 유입 이하라 예측 범위 안에서 평균 대기시간이 목표 미만으로 내려가지 않습니다.',
        );
    } else {
        clearMetric = queueMetric('UNAVAILABLE', 'WAIT_AVG_FORECAST', `${QUEUE_HORIZON_MIN}분 예측 범위 안에 목표 미만에 도달하지 않습니다.`);
    }

    const clear: FcltQueueClearDto = {
        fcltCnt,
        cgnClearMin: clearSec === null ? null : clearSec / 60,
        cgnClearDt: clearSec === null ? '' : toDt(ymd, baseMinute, clearSec),
        clearMetric,
        fcstWtngSec,
        fcstDt: toDt(ymd, baseMinute + fcstMin),
        fcstWtngMetric:
            gap !== null
                ? queueMetric('UNAVAILABLE', 'WAIT_AVG_FORECAST', gap)
                : fcstWtngSec === null
                  ? queueMetric('UNAVAILABLE', 'WAIT_AVG_FORECAST', `${fcstMin}분 후 직전 30분에 처리될 여객이 없습니다.`)
                  : queueMetric('ESTIMATED', 'WAIT_AVG_FORECAST', `${fcstMin}분 후 시각의 직전 30분 처리 여객 예측 평균 대기시간`),
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
    const stableMinCnt = mu === null ? null : Math.floor(lambda / mu + 1e-9) + 1;
    const base: FcltQueueRecommendDto = {
        targetMin,
        reqCnt: null,
        extraCnt: null,
        reduceCnt: null,
        flowBasedReqCnt: null,
        stableMinCnt,
        stableAplyYn: null,
        capaAvlYn: null,
        goalMetYn: null,
        reqMetric: queueMetric('UNAVAILABLE', 'WAIT_AVG_FORECAST', forecastGap(profile, 1) ?? ''),
    };

    if (mu === null || stableMinCnt === null || forecastGap(profile, 1) !== null) return base;

    // 이 수량부터는 대기열과 매분 유입이 모두 그 분에 처리돼 결과가 같다
    const upperCnt = Math.max(stableMinCnt, Math.ceil(((profile.wtngPsgCnt + lambda / MIN_PER_HOUR) * MIN_PER_HOUR) / mu));
    let goalOnlyMinCnt: number | null = null;

    for (let fcltCnt = 0; fcltCnt <= upperCnt; fcltCnt++) {
        if (!meetsTarget(simulateQueue(profile, fcltCnt, targetMin), targetMin)) continue;

        if (goalOnlyMinCnt === null) goalOnlyMinCnt = fcltCnt;

        if (fcltCnt < stableMinCnt) continue;

        return {
            ...base,
            reqCnt: fcltCnt,
            extraCnt: Math.max(fcltCnt - profile.oprCnt, 0),
            reduceCnt: Math.max(profile.oprCnt - fcltCnt, 0),
            stableAplyYn: fcltCnt > goalOnlyMinCnt ? 'Y' : 'N',
            capaAvlYn: profile.totCnt === null ? null : fcltCnt <= profile.totCnt ? 'Y' : 'N',
            reqMetric: queueMetric(
                'ESTIMATED',
                'WAIT_AVG_FORECAST',
                `${targetMin}분 안에 직전 30분 처리 여객 평균이 ${MOCK_NORMAL_UPPER_EXCLUSIVE_SEC}초 미만이 되고 처리능력이 유입보다 큰 최소 총수`,
            ),
        };
    }

    return {
        ...base,
        reqMetric: queueMetric(
            'UNREACHABLE',
            'WAIT_AVG_FORECAST',
            `${upperCnt}개 이상은 결과가 같습니다. 이미 처리된 여객과 오래 기다린 대기자의 대기시간이 창에 남아 ${targetMin}분 안에 목표 미만이 되지 않습니다.`,
        ),
    };
}

function failQueueScenario(errorMessage: string): FcltQueueScenarioDto {
    return { error: true, errorMessage } as FcltQueueScenarioDto;
}

function buildFcltQueueScenario(req: FcltQueueScenarioReq): FcltQueueScenarioDto {
    const key = `${req.tmnlId}-${req.fcltType}-${req.unitCd}`;
    const profile = QUEUE_SCENARIO_PROFILES[key] ?? QUEUE_SCENARIO_PROFILES['T1-CHKN-B'];
    const ymd = BASE_INFO.ymd;
    // 평가시각 = 조회 시각. 관측구간은 그 직전 30분이다
    const baseMinute = toMinuteOfDay(req.hhmm);
    const mu = profile.prcsSec === null ? null : 3600 / profile.prcsSec;
    const targetMin = req.mode === 'TIME' ? (req.targetMinutes ?? QUEUE_TARGET_MIN.dflt) : QUEUE_TARGET_MIN.dflt;

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
        targetQueueCnt: null,
        normalUpperExclusiveSec: MOCK_NORMAL_UPPER_EXCLUSIVE_SEC,
        wtngAvgSec: profile.obsWtngSec,
        wtngAvgPrcsPsgCnt: Math.round((profile.obsPrcsPerHour * QUEUE_OBS_MIN) / MIN_PER_HOUR),
        wtngAvgMetric:
            profile.obsWtngSec === null
                ? queueMetric('UNAVAILABLE', 'PRCS_WAIT_AVG', '직전 30분에 처리된 여객이 없습니다.')
                : queueMetric('CALCULATED', 'PRCS_WAIT_AVG', '[t-30분, t) 처리 여객의 처리인원 가중평균 대기시간'),
        cgnStatus: mockGradeOf(profile.obsWtngSec),
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
        current: toQueueClear(profile, profile.oprCnt, ymd, baseMinute, targetMin),
        scenario: null,
        totScenario: null,
        recommend: null,
    };

    if (req.mode === 'COUNT') {
        return {
            ...result,
            scenario: toQueueClear(profile, req.oprFcltCnt ?? profile.oprCnt, ymd, baseMinute, targetMin),
        };
    }

    const recommend = toQueueRecommend(profile, targetMin);

    if (recommend.reqCnt === null) return { ...result, recommend };

    if (profile.totCnt !== null && recommend.reqCnt > profile.totCnt) {
        return { ...result, recommend, totScenario: toQueueClear(profile, profile.totCnt, ymd, baseMinute, targetMin) };
    }

    const scenario = toQueueClear(profile, recommend.reqCnt, ymd, baseMinute, targetMin);
    const stable = mu !== null && recommend.reqCnt * mu > profile.arvlPerHour;
    const goalMet = stable && meetsTarget(simulateQueue(profile, recommend.reqCnt, targetMin), targetMin);

    return {
        ...result,
        scenario,
        recommend: { ...recommend, goalMetYn: goalMet ? 'Y' : 'N' },
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
