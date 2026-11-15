import { pad2 } from '@/lib/format';
import type {
    CongestionStatus,
    DsbdBaseInfoDto,
    DsbdCategory,
    DsbdFcltCardDto,
    DsbdHeaderDto,
    DsbdRsltDto,
    FcltQueueArvlDto,
    FcltQueueClearDto,
    FcltQueueCntClearDto,
    FcltQueueFcstDto,
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

/** 선택 가능 시각 — 08:00 ~ 11:00, 10분 단위 (계산이 끝난 시각까지만 내려온다는 전제) */
const AVL_TIMES = (() => {
    const times: string[] = [];
    for (let minutes = 8 * 60; minutes <= 11 * 60; minutes += 10) {
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
    lastCalcDt: '20260710114700',
    nextCalcDt: '20260710120000',
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
type TmnlSmryInfo = Pick<
    TmnlSmryDto,
    'smryWtngPsgCnt' | 'smryAvgWtngSec' | 'smryIntvArvlPsgCnt' | 'smryIntvPrcsPsgCnt' | 'smryArvlPsgCnt' | 'smryPrcsPsgCnt'
>;
type TmnlSmryBase = Omit<TmnlSmryDto, 'cgnStatus' | 'intrvlMin' | 'intrvlFltCnt' | 'intrvlPsgCnt' | 'intrvlYesterdayFltDiffCnt' | 'intrvlYesterdayPsgDiffCnt' | 'intrvlList' | keyof TmnlSmryInfo>;

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
            wtngPsgCnt: 2680,
            avgWtngHr: 40,
            prcsPsgCnt: 1400,
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
            wtngPsgCnt: 2120,
            avgWtngHr: 35,
            prcsPsgCnt: 1380,
        },
    },
};

/** 전일 같은 구간을 만드는 터미널별 배율 — 증감 부호가 두 터미널에서 갈리도록 골랐다 */
const YESTERDAY_RATIO: Record<TmnlId, number> = { T1: 0.94, T2: 1.05 };

const MIN_PER_HOUR = 60;
const MIN_PER_DAY = 24 * MIN_PER_HOUR;
/** 서버 결과 한 칸(10분). 결과 시각은 구간 끝이다 */
const RSLT_MIN = 10;

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

/** 대기시간 합 · 그 처리인원을 들고 다녀야 랜드사이드를 한데 모은 가중평균으로 낼 수 있다 */
interface FcltIntrvl {
    wtngPsgCnt: number;
    intvArvlPsgCnt: number | null;
    intvPrcsPsgCnt: number | null;
    arvlPsgCnt: number | null;
    prcsPsgCnt: number | null;
    wtngSecSum: number;
    wtngPrcsPsgCnt: number;
}

/** 시간대(00~23시) 결과에서 [bgnMin, endMin) 과 겹치는 분만큼 처리인원 · 대기시간 합을 비례해 더한다 */
function sumPrcsByMinute(rsltList: DsbdRsltDto[], bgnMin: number, endMin: number) {
    let prcsPsgCnt = 0;
    let wtngSecSum = 0;

    for (const rslt of rsltList) {
        const hourBgn = Number(rslt.time.slice(0, 2)) * MIN_PER_HOUR;
        const overlap = Math.min(endMin, hourBgn + MIN_PER_HOUR) - Math.max(bgnMin, hourBgn);
        if (overlap <= 0) continue;

        const prcs = (rslt.prcsPsgCnt * overlap) / MIN_PER_HOUR;
        prcsPsgCnt += prcs;
        wtngSecSum += rslt.wtngHr * MIN_PER_HOUR * prcs;
    }

    return { prcsPsgCnt, wtngSecSum };
}

/**
 * 체크인(아일랜드 전체) / 출국장(전체) 하나의 구간 집계. 대기인원은 조회 시각이 속한 시의 값,
 * 대기시간은 조회 시각에 끝나는 10분(서버의 조회 시각 결과) 처리 여객 기준이다
 */
function buildFcltIntrvl(tmnlId: TmnlId, fcltCategory: 'CHKN' | 'DEP', hhmm: string, intrvlMin: number): FcltIntrvl {
    const bgnMin = Number(hhmm.slice(0, 2)) * MIN_PER_HOUR + Number(hhmm.slice(2, 4));
    const endMin = Math.min(bgnMin + intrvlMin, MIN_PER_DAY);
    const rsltList = buildRsltList(tmnlId, fcltCategory);
    const queueAt = (minute: number) => rsltList[Math.min(Math.floor(minute / MIN_PER_HOUR), 23)].fcstWtngPsgCnt;
    const intrvl = sumPrcsByMinute(rsltList, bgnMin, endMin);
    const snapshot = sumPrcsByMinute(rsltList, bgnMin - RSLT_MIN, bgnMin);
    const wtngPsgCnt = queueAt(bgnMin);
    const hasSnapshot = bgnMin >= RSLT_MIN;

    return {
        wtngPsgCnt,
        intvArvlPsgCnt: hasSnapshot
            ? Math.max(0, Math.round(wtngPsgCnt - queueAt(bgnMin - RSLT_MIN) + snapshot.prcsPsgCnt))
            : null,
        intvPrcsPsgCnt: hasSnapshot ? Math.round(snapshot.prcsPsgCnt) : null,
        // 서버의 10분 행 유입과 같은 보존식 — 끝 대기 − 시작 대기 + 처리
        arvlPsgCnt: endMin > bgnMin
            ? Math.max(0, Math.round(queueAt(endMin) - wtngPsgCnt + intrvl.prcsPsgCnt))
            : null,
        prcsPsgCnt: endMin > bgnMin ? Math.round(intrvl.prcsPsgCnt) : null,
        wtngSecSum: snapshot.wtngSecSum,
        wtngPrcsPsgCnt: snapshot.prcsPsgCnt,
    };
}

function toSmryInfo(intrvl: FcltIntrvl): TmnlSmryInfo {
    return {
        smryWtngPsgCnt: intrvl.wtngPsgCnt,
        smryAvgWtngSec: intrvl.wtngPrcsPsgCnt > 0 ? intrvl.wtngSecSum / intrvl.wtngPrcsPsgCnt : null,
        smryIntvArvlPsgCnt: intrvl.intvArvlPsgCnt,
        smryIntvPrcsPsgCnt: intrvl.intvPrcsPsgCnt,
        smryArvlPsgCnt: intrvl.arvlPsgCnt,
        smryPrcsPsgCnt: intrvl.prcsPsgCnt,
    };
}

/** 랜드사이드는 유입을 진입(아일랜드), 처리를 진출(출국장)로, 대기시간은 두 시설 처리 여객을 한데 모아 센다 (서버와 같은 규칙) */
export function buildSmryInfo(tmnlId: TmnlId, hhmm: string, intrvlMin: number, category: DsbdCategory): TmnlSmryInfo {
    const chkn = buildFcltIntrvl(tmnlId, 'CHKN', hhmm, intrvlMin);
    const dep = buildFcltIntrvl(tmnlId, 'DEP', hhmm, intrvlMin);

    if (category === 'CHKN') return toSmryInfo(chkn);
    if (category === 'DEP') return toSmryInfo(dep);

    return toSmryInfo({
        wtngPsgCnt: chkn.wtngPsgCnt + dep.wtngPsgCnt,
        intvArvlPsgCnt: chkn.intvArvlPsgCnt,
        intvPrcsPsgCnt: dep.intvPrcsPsgCnt,
        arvlPsgCnt: chkn.arvlPsgCnt,
        prcsPsgCnt: dep.prcsPsgCnt,
        wtngSecSum: chkn.wtngSecSum + dep.wtngSecSum,
        wtngPrcsPsgCnt: chkn.wtngPrcsPsgCnt + dep.wtngPrcsPsgCnt,
    });
}

function buildTmnlSmry(tmnlId: TmnlId, hhmm: string, intrvlMin: number, category: DsbdCategory): TmnlSmryDto {
    const intrvlFltCnt = sumByIntrvl(toHourlyFlt(tmnlId), hhmm, intrvlMin);
    const intrvlPsgCnt = sumByIntrvl(HOURLY_PSG[tmnlId], hhmm, intrvlMin);
    const ratio = YESTERDAY_RATIO[tmnlId];
    const bgnMin = Number(hhmm.slice(0, 2)) * MIN_PER_HOUR + Number(hhmm.slice(2, 4));
    const intrvlList = [0, 1, 2]
        .map((offset) => bgnMin + offset * MIN_PER_HOUR)
        .filter((start) => start < MIN_PER_DAY)
        .map((start) => {
            const end = Math.min(start + intrvlMin, MIN_PER_DAY);
            const bgnHhmm = `${pad2(Math.floor(start / MIN_PER_HOUR))}${pad2(start % MIN_PER_HOUR)}`;
            const fltCnt = sumByIntrvl(toHourlyFlt(tmnlId), bgnHhmm, intrvlMin);
            const psgCnt = sumByIntrvl(HOURLY_PSG[tmnlId], bgnHhmm, intrvlMin);

            return {
                bgnHhmm,
                endHhmm: `${pad2(Math.floor(end / MIN_PER_HOUR))}${pad2(end % MIN_PER_HOUR)}`,
                fltCnt,
                psgCnt,
                yesterdayFltDiffCnt: fltCnt - Math.round(fltCnt * ratio),
                yesterdayPsgDiffCnt: psgCnt - Math.round(psgCnt * ratio),
            };
        });

    // 대표 등급은 PRIME TIME(대기인원 피크)과 별개로 조회 시각 시설 카드 중 최고 등급이다 (서버와 같은 규칙)
    const cardList = [...buildFcltCardList(tmnlId, hhmm, 'CHKN'), ...buildFcltCardList(tmnlId, hhmm, 'DEP')];
    const cgnStatus = mockWorstOf(cardList.map((card) => card.cgnStatus));

    return {
        ...TMNL_SMRY[tmnlId],
        ...buildSmryInfo(tmnlId, hhmm, intrvlMin, category),
        cgnStatus,
        intrvlMin,
        intrvlFltCnt,
        intrvlPsgCnt,
        intrvlYesterdayFltDiffCnt: intrvlFltCnt - Math.round(intrvlFltCnt * ratio),
        intrvlYesterdayPsgDiffCnt: intrvlPsgCnt - Math.round(intrvlPsgCnt * ratio),
        intrvlList,
    };
}

/* ================= 시간대별 결과 (차트 / 테이블) ================= */

/** 운항편은 여객수와 같은 시설(CC + LGT)을 읽는다 — 서버 `DsbdCategory` 와 같은 규칙이라 두 차트가 같다 */
type WtngCategory = Exclude<DsbdCategory, 'FLT'>;

/**
 * 퀵 타일(조회 대상)에 따라 값의 규모가 달라진다.
 * 실제로는 서버가 지표별로 다른 값을 내려주지만, 목업은 출발여객 곡선의 배율과 피크 시각을 바꾼다.
 */
const CATEGORY_SCALE: Record<WtngCategory, number> = {
    PSG: 1,
    CHKN: 0.45,
    DEP: 0.32,
};

const CATEGORY_PEAK_HOUR: Record<WtngCategory, number> = {
    PSG: 8,
    CHKN: 10,
    DEP: 11,
};

/** 실측(Xovis)은 흘러간 시간까지만 있다 — 이 시각 뒤로는 실적선이 끊긴다 */
const MEASURED_UNTIL_HOUR = 14;

function buildRsltList(tmnlId: TmnlId, category: DsbdCategory): DsbdRsltDto[] {
    const wtngCategory: WtngCategory = category === 'FLT' ? 'PSG' : category;
    const scale = CATEGORY_SCALE[wtngCategory];
    // 운항편 · 여객수는 터미널 요약 구간과 같은 곡선이다 — 정각 1시간 구간 값이 차트 막대와 같아야 한다
    const hourlyFlt = toHourlyFlt(tmnlId);

    return HOURLY_PSG[tmnlId].map((psgCnt, hour) => {
        const sourceHour = (hour - CATEGORY_PEAK_HOUR[wtngCategory] + CATEGORY_PEAK_HOUR.PSG + 24) % 24;
        const load = Math.round(HOURLY_PSG[tmnlId][sourceHour] * scale);
        const fltCnt = Math.round(hourlyFlt[hour]);
        const fcstWtngPsgCnt = Math.round(load * 0.12);

        return {
            time: `${String(hour).padStart(2, '0')}00`,
            psgCnt: category === 'FLT' ? fltCnt : psgCnt,
            fltCnt,
            wtngPsgCnt: hour <= MEASURED_UNTIL_HOUR ? Math.round(fcstWtngPsgCnt * (0.85 + ((hour * 13) % 6) / 20)) : null,
            wtngHr: Math.min(40, Math.round(fcstWtngPsgCnt / 8)),
            arvlPsgCnt: load,
            prcsPsgCnt: Math.round(load * 0.9),
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
type FcltCardSeed = Omit<DsbdFcltCardDto, 'cgnWtngSec' | 'hrlyArvlPsgCnt' | 'reqHrlyPrcsPsgCnt' | 'oprCgnClearTime' | 'oprCgnClearMin'>;

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
    const profile = queueProfileAt(card.cardId, hhmm);
    const unitCd = fcltType === 'CHKN' ? card.island : card.dptgtNo;
    const targetMin = QUEUE_TARGET_MIN.dflt;
    // 평가시각은 조회 시각 그대로다 — 관측구간은 [hhmm-10, hhmm)
    const baseMinute = toMinuteOfDay(hhmm);
    const capacity = profile.prcsSec === null ? 0 : (profile.oprCnt * 3600) / profile.prcsSec;
    const { reqCnt } = toQueueRecommend(profile, targetMin);
    const clear = reqCnt === null ? null : toQueueClear(profile, reqCnt, BASE_INFO.ymd, baseMinute, targetMin);
    const clearMin = clear?.cgnClearMin == null ? null : Math.ceil(clear.cgnClearMin - 1e-9);
    const oprClear = toQueueClear(profile, profile.oprCnt, BASE_INFO.ymd, baseMinute, targetMin);
    const oprClearMin = oprClear.cgnClearMin == null ? null : Math.ceil(oprClear.cgnClearMin - 1e-9);
    const cgnStatus = mockGradeOf(profile.obsWtngSec);
    const prcsMin = Math.min(MIN_PER_HOUR, 24 * MIN_PER_HOUR - baseMinute);
    const reqHrlyPrcsPsgCnt =
        reqCnt === null || forecastGap(profile, reqCnt) !== null ? null : Math.round(simulateQueue(profile, reqCnt, prcsMin).prcsUntil(prcsMin));

    return {
        ...card,
        // 카드와 팝업이 같은 원천이어야 한다 — 운영 / 보유 수량도 프로필을 따른다
        oprCnt: profile.oprCnt,
        totCnt: profile.totCnt ?? card.totCnt,
        wtngPsgCnt: profile.wtngPsgCnt,
        hrlyArvlPsgCnt: Math.round(profile.arvlPerHour),
        reqHrlyPrcsPsgCnt,
        hrlyPrcsRate: capacity === 0 ? 0 : Math.round((profile.arvlPerHour / capacity) * 100),
        cgnClearTime: clear === null || clearMin === null ? '' : clear.cgnClearDt.slice(8, 12),
        cgnClearRate: clearMin === null ? 0 : Math.round((Math.max(targetMin - clearMin, 0) / targetMin) * 100),
        oprCgnClearTime: oprClearMin === null ? '' : oprClear.cgnClearDt.slice(8, 12),
        oprCgnClearMin: oprClearMin,
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
 * 해소 = 직전 10분 처리 여객 평균 대기시간이 NORMAL 상한 미만이 되는 시각.
 * 창의 평가시각 이전은 관측 이력(평균 obsWtngSec 로 고르게 처리), 이후는 1분 단위 유체 FIFO 예측이다.
 * 판정 구간(60분, 목표가 더 길면 목표 시간) 끝까지 다시 기준 이상이 되지 않고 구간 끝 대기인원이 시작보다 늘지 않아야 해소다.
 */

interface QueueScenarioProfile {
    wtngPsgCnt: number;
    /** 직전 10분 처리 여객 평균 대기 (초). null 이면 처리 여객이 없어 산정 불가 */
    obsWtngSec: number | null;
    /** 직전 10분 처리인원 (명/시간) */
    obsPrcsPerHour: number;
    /** 남은 대기열이 기다린 시간 — 1분 ~ 이 값(분)에 고르게 퍼져 있다고 본다 */
    queueAgeMaxMin: number;
    /** 기준시각부터 1시간 평균 유입 (명/시간) */
    arvlPerHour: number;
    /** 기준시각부터 24시까지 10분 유입. queueProfileAt 이 arvlPerHour 를 시간대별로 흔들어 채운다 */
    arvlSecList?: number[];
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
    // 직전 10분 처리 여객 0명 → 등급 산정 불가 (중립색)
    'T2-DEP-2': { wtngPsgCnt: 0, obsWtngSec: null, obsPrcsPerHour: 0, queueAgeMaxMin: 0, arvlPerHour: 0, prcsSec: 24, oprCnt: 1, totCnt: 2 },
};

// 카드의 +1시간 증감이 보이도록 대기열을 시간대에 따라 흔든다. 시설마다 위상이 달라 같은 시각에도 증가 · 감소가 섞인다.
// 위 프로필의 경계 사례(39분 59초 등)는 배율이 1.0 인 시각에만 그대로 나온다.
const QUEUE_LOAD_BY_HOUR = [0.6, 0.6, 0.6, 0.7, 0.8, 1.0, 1.2, 1.4, 1.3, 1.1, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.2, 1.0, 0.9, 0.8, 0.7, 0.6];
const QUEUE_LOAD_PHASE: Record<string, number> = {
    'T1-CHKN-B': 0,
    'T1-CHKN-D': 3,
    'T2-CHKN-C': 1,
    'T2-CHKN-E': 5,
    'T1-DEP-3': 2,
    'T1-DEP-1': 0,
    'T2-DEP-1': 4,
    'T2-DEP-2': 0,
};

function queueLoadAt(key: string, hhmm: string): number {
    return QUEUE_LOAD_BY_HOUR[(Number(hhmm.slice(0, 2)) + (QUEUE_LOAD_PHASE[key] ?? 0)) % 24];
}

// 서버는 카드와 요약정보(아일랜드 · 출국장)가 같은 10분 행을 읽어 카드 대기인원 합 = 전체 대기인원이다. 목업은 요약 곡선 값을 시설에 나눠 맞춘다
function queueShareAt(key: string, hhmm: string): number | null {
    const [tmnlId, fcltType] = key.split('-');
    const keys = Object.keys(QUEUE_SCENARIO_PROFILES).filter((other) => other.startsWith(`${tmnlId}-${fcltType}-`));
    const index = keys.indexOf(key);
    if (index < 0 || (fcltType !== 'CHKN' && fcltType !== 'DEP')) return null;

    const total = buildFcltIntrvl(tmnlId as TmnlId, fcltType, hhmm, MIN_PER_HOUR).wtngPsgCnt;
    const weights = keys.map((other) => QUEUE_SCENARIO_PROFILES[other].wtngPsgCnt * queueLoadAt(other, hhmm));
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    if (weightSum === 0) return index === 0 ? total : 0;

    const raw = weights.map((weight) => (total * weight) / weightSum);
    const floors = raw.map(Math.floor);
    const rest = total - floors.reduce((sum, value) => sum + value, 0);
    const bonusOrder = keys.map((_, i) => i).sort((a, b) => raw[b] - floors[b] - (raw[a] - floors[a]) || a - b);

    return floors[index] + (bonusOrder.indexOf(index) < rest ? 1 : 0);
}

// 서버는 CAST 10분 유입을 그대로 쓴다. 목업은 시설마다 위상이 다른 물결로 피크 · 감소를 만든다
function toArvlSecList(key: string, baseMinute: number, arvlPerHour: number): number[] {
    const phase = QUEUE_LOAD_PHASE[key] ?? 0;
    const list: number[] = [];

    for (let endMin = baseMinute + RSLT_MIN; endMin <= MIN_PER_DAY; endMin += RSLT_MIN) {
        const wave = 1 + 0.4 * Math.sin(((endMin / RSLT_MIN + phase * 3) * 2 * Math.PI) / 9);
        list.push(Math.round((arvlPerHour / (MIN_PER_HOUR / RSLT_MIN)) * wave));
    }

    return list;
}

function queueProfileAt(key: string, hhmm: string): QueueScenarioProfile {
    const profile = QUEUE_SCENARIO_PROFILES[key] ?? QUEUE_SCENARIO_PROFILES['T1-CHKN-B'];
    const load = queueLoadAt(key, hhmm);
    const arvlSecList = toArvlSecList(key, toMinuteOfDay(hhmm), profile.arvlPerHour);
    const hourSecList = arvlSecList.slice(0, MIN_PER_HOUR / RSLT_MIN);

    return {
        ...profile,
        wtngPsgCnt: queueShareAt(key, hhmm) ?? Math.round(profile.wtngPsgCnt * load),
        obsWtngSec: profile.obsWtngSec === null ? null : profile.obsWtngSec * load,
        queueAgeMaxMin: Math.round(profile.queueAgeMaxMin * load),
        arvlPerHour: hourSecList.length === 0 ? 0 : (sum(hourSecList) * MIN_PER_HOUR) / (hourSecList.length * RSLT_MIN),
        arvlSecList,
    };
}

const QUEUE_OBS_MIN = 10;
const QUEUE_TARGET_MIN = { dflt: 30, min: 1, max: 120 };
const QUEUE_JUDGE_MIN = 60;
const QUEUE_EPS = 1e-9;

const QUEUE_ASMP_COMMON = [
    `혼잡등급 / 해소 목표는 기준시각 직전 ${QUEUE_OBS_MIN}분 [t-${QUEUE_OBS_MIN}분, t) 에 처리된 여객의 처리인원 가중평균 대기시간이다. 해소는 이 평균이 NORMAL 상한 미만이 된 뒤 판정 구간 끝까지 유지되기 시작하는 시각`,
    `판정 구간은 기준시각부터 ${QUEUE_JUDGE_MIN}분이고 목표 시간이 더 길면 목표 시간까지다. 구간 안에서 다시 기준 이상이 되거나 구간 끝 대기인원이 기준시각보다 많으면 해소 불가로 본다`,
    '미래 평균은 같은 정의의 이동평균이다. 창의 기준시각 이전은 실제 처리 이력, 이후는 1분 단위 유체 FIFO 예측이며 남은 대기자의 대기시간은 이어서 센다',
    '추천 수량은 목표 시간 안에 해소되고 판정 구간 끝까지 유지되는 최소 총수다',
    '예측 구간 동안 처리율이 일정하고 시설 수는 즉시 바뀐다고 본다',
    '예측 유입은 기준시각 뒤 CAST 10분 결과의 인원 보존식 유입을 그 10분에 균등하게 나눈 값이다. 결과가 없는 구간(마지막 결과 뒤 · 24시 이후)은 유입 0 이다',
    'M/M/s 적용 가정(정상상태 참고지표 전용): 포아송 도착 / 지수 처리시간 / 동일 처리율의 병렬 시설 / 공용 대기열 선착순 / 무한 대기공간 / 이탈 없음 (통계 검증 아님)',
];

const QUEUE_ASMP_LIST: Record<'CHKN' | 'DEP', string[]> = {
    CHKN: [...QUEUE_ASMP_COMMON, '아일랜드 유인 카운터(CC) 공용 Queue — 부스별 결과를 재구성한 값'],
    DEP: [
        ...QUEUE_ASMP_COMMON,
        'SC / SR 결과를 합산한 하나의 보안검색 Queue (직렬 / 병렬 관계 미검증)',
        '혼잡등급 / 평균 대기시간 / 대기인원은 보안검색대 Queue 값이다. 요약보기 카드의 출국장 혼잡등급은 출국장(LGT) 대기로 정하므로 다를 수 있다',
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

/** 예측 1회 — 창 끝 j분(t+j)의 평균은 관측 이력 [t-10+j, t) 와 예측 [max(0, j-10), j) 를 합친다 */
interface QueueTrace {
    avgAt: (endMin: number) => number | null;
    remainAt: (endMin: number) => number;
    prcsUntil: (endMin: number) => number;
}

/** 산정할 수 없으면 사유 문자열, 할 수 있으면 null */
function forecastGap(profile: QueueScenarioProfile, fcltCnt: number): string | null {
    if (profile.obsWtngSec === null) return `직전 ${QUEUE_OBS_MIN}분에 처리된 여객이 없습니다.`;
    if (fcltCnt > 0 && profile.prcsSec === null) return '시설 처리율을 구할 수 없습니다. 양수인 단일 시설 평균 처리시간이 필요합니다.';

    return null;
}

function arrivalAt(profile: QueueScenarioProfile, minute: number): number {
    if (!profile.arvlSecList) return profile.arvlPerHour / MIN_PER_HOUR;

    return (profile.arvlSecList[Math.floor(minute / RSLT_MIN)] ?? 0) / RSLT_MIN;
}

function judgeMinOf(targetMin: number): number {
    return Math.max(targetMin, QUEUE_JUDGE_MIN);
}

function simulateQueue(profile: QueueScenarioProfile, fcltCnt: number, minutes: number): QueueTrace {
    const capPerMin = fcltCnt === 0 || profile.prcsSec === null ? 0 : (fcltCnt * 60) / profile.prcsSec;
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
        const arrivalPerMin = arrivalAt(profile, minute);

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
        prcsUntil: (endMin) => prcs.slice(0, endMin).reduce((sum, value) => sum + value, 0),
    };
}

function reachMinOf(trace: QueueTrace, horizonMin: number): number {
    for (let endMin = 0; endMin <= horizonMin; endMin++) {
        const value = trace.avgAt(endMin);

        if (value !== null && value < MOCK_NORMAL_UPPER_EXCLUSIVE_SEC) return endMin;
    }

    return -1;
}

/** 판정 구간 끝에서 거꾸로 이어지는 해소 상태의 시작 분. 구간 끝이 해소 상태가 아니거나 대기인원이 시작보다 늘었으면 -1 */
function sustainedMinOf(trace: QueueTrace, judgeMin: number): number {
    if (isQueueGrown(trace, judgeMin)) return -1;

    let result = -1;

    for (let endMin = judgeMin; endMin >= 0; endMin--) {
        const value = trace.avgAt(endMin);
        const clear = value === null ? trace.remainAt(endMin) <= QUEUE_EPS : value < MOCK_NORMAL_UPPER_EXCLUSIVE_SEC;

        if (!clear) break;
        result = endMin;
    }

    return result;
}

function isQueueGrown(trace: QueueTrace, judgeMin: number): boolean {
    return Math.round(trace.remainAt(judgeMin)) > Math.round(trace.remainAt(0));
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
    const judgeMin = judgeMinOf(fcstMin);
    const trace = gap === null ? simulateQueue(profile, fcltCnt, Math.max(judgeMin, fcstMin)) : null;
    const reachMin = trace === null ? -1 : sustainedMinOf(trace, judgeMin);
    const fcstWtngSec = trace === null ? null : trace.avgAt(fcstMin);

    let clearSec: number | null = null;
    let clearMetric: QueueMetricDto;

    if (gap !== null) {
        clearMetric = queueMetric('UNAVAILABLE', 'WAIT_AVG_FORECAST', gap);
    } else if (reachMin === 0) {
        clearSec = 0;
        clearMetric = queueMetric(
            'CALCULATED',
            'WAIT_AVG_FORECAST',
            `직전 ${QUEUE_OBS_MIN}분 처리 여객 평균이 이미 ${MOCK_NORMAL_UPPER_EXCLUSIVE_SEC}초 미만이고 ${judgeMin}분 판정 구간 끝까지 유지됩니다.`,
        );
    } else if (reachMin > 0) {
        clearSec = reachMin * 60;
        clearMetric = queueMetric(
            'ESTIMATED',
            'WAIT_AVG_FORECAST',
            `${reachMin}분 후 직전 ${QUEUE_OBS_MIN}분 처리 여객 예측 평균이 ${MOCK_NORMAL_UPPER_EXCLUSIVE_SEC}초 미만이 되고 ${judgeMin}분 판정 구간 끝까지 유지됩니다.`,
        );
    } else if (trace !== null && isQueueGrown(trace, judgeMin)) {
        clearMetric = queueMetric(
            'UNREACHABLE',
            'WAIT_AVG_FORECAST',
            `${judgeMin}분 판정 구간 끝 예측 대기인원 ${Math.round(trace.remainAt(judgeMin))}명이 기준시각 ${Math.round(trace.remainAt(0))}명보다 많아 구간 뒤에 다시 혼잡해집니다.`,
        );
    } else {
        clearMetric = queueMetric(
            'UNREACHABLE',
            'WAIT_AVG_FORECAST',
            `${judgeMin}분 판정 구간 안에서 평균 대기시간이 목표 미만으로 내려간 뒤 끝까지 유지되지 않습니다.`,
        );
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
                  ? queueMetric('UNAVAILABLE', 'WAIT_AVG_FORECAST', `${fcstMin}분 후 직전 ${QUEUE_OBS_MIN}분에 처리될 여객이 없습니다.`)
                  : queueMetric('ESTIMATED', 'WAIT_AVG_FORECAST', `${fcstMin}분 후 시각의 직전 ${QUEUE_OBS_MIN}분 처리 여객 예측 평균 대기시간`),
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

    const judgeMin = judgeMinOf(targetMin);
    let peakArrivalPerMin = 0;

    for (let minute = 0; minute < judgeMin; minute++) peakArrivalPerMin = Math.max(peakArrivalPerMin, arrivalAt(profile, minute));

    // 이 수량부터는 대기열과 매분 유입이 모두 그 분에 처리돼 결과가 같다
    const upperCnt = Math.max(1, Math.ceil(((profile.wtngPsgCnt + peakArrivalPerMin) * MIN_PER_HOUR) / mu));
    let goalOnlyMinCnt: number | null = null;

    for (let fcltCnt = 0; fcltCnt <= upperCnt; fcltCnt++) {
        const trace = simulateQueue(profile, fcltCnt, judgeMin);

        if (goalOnlyMinCnt === null && meetsTarget(trace, targetMin)) goalOnlyMinCnt = fcltCnt;

        const clearMin = sustainedMinOf(trace, judgeMin);

        if (clearMin < 0 || clearMin > targetMin) continue;

        return {
            ...base,
            reqCnt: fcltCnt,
            extraCnt: Math.max(fcltCnt - profile.oprCnt, 0),
            reduceCnt: Math.max(profile.oprCnt - fcltCnt, 0),
            stableAplyYn: goalOnlyMinCnt !== null && fcltCnt > goalOnlyMinCnt ? 'Y' : 'N',
            capaAvlYn: profile.totCnt === null ? null : fcltCnt <= profile.totCnt ? 'Y' : 'N',
            reqMetric: queueMetric(
                'ESTIMATED',
                'WAIT_AVG_FORECAST',
                `${targetMin}분 안에 직전 ${QUEUE_OBS_MIN}분 처리 여객 평균이 ${MOCK_NORMAL_UPPER_EXCLUSIVE_SEC}초 미만이 되고 ${judgeMin}분 판정 구간 끝까지 유지되며 구간 끝 대기인원이 기준시각보다 늘지 않는 최소 총수`,
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

function isQueueGoalMet(profile: QueueScenarioProfile, fcltCnt: number, targetMin: number): boolean {
    if (fcltCnt <= 0 || profile.prcsSec === null || forecastGap(profile, fcltCnt) !== null) return false;

    const judgeMin = judgeMinOf(targetMin);
    const clearMin = sustainedMinOf(simulateQueue(profile, fcltCnt, judgeMin), judgeMin);

    return clearMin >= 0 && clearMin <= targetMin;
}

function toQueueFcstList(profile: QueueScenarioProfile, fcltCnt: number, ymd: string, baseMinute: number, judgeMin: number): FcltQueueFcstDto[] {
    if (forecastGap(profile, fcltCnt) !== null) return [];

    const trace = simulateQueue(profile, fcltCnt, judgeMin);
    const list: FcltQueueFcstDto[] = [];

    for (let minute = 0; minute <= judgeMin; minute += RSLT_MIN) {
        list.push({ fcstDt: toDt(ymd, baseMinute + minute), fcstWtngSec: trace.avgAt(minute), wtngPsgCnt: trace.remainAt(minute) });
    }

    return list;
}

function toQueueArvlList(profile: QueueScenarioProfile, ymd: string, baseMinute: number, judgeMin: number): FcltQueueArvlDto[] {
    const list: FcltQueueArvlDto[] = [];

    for (let endMin = RSLT_MIN; endMin <= judgeMin; endMin += RSLT_MIN) {
        let arvlPsgCnt = 0;

        for (let minute = endMin - RSLT_MIN; minute < endMin; minute++) arvlPsgCnt += arrivalAt(profile, minute);
        list.push({ secEndDt: toDt(ymd, baseMinute + endMin), arvlPsgCnt });
    }

    return list;
}

function toQueueCntClearList(profile: QueueScenarioProfile, reqCnt: number | null, ymd: string, baseMinute: number, targetMin: number): FcltQueueCntClearDto[] {
    const upperCnt = profile.totCnt ?? Math.max(profile.oprCnt, reqCnt ?? 0);
    const judgeMin = judgeMinOf(targetMin);
    const list: FcltQueueCntClearDto[] = [];

    for (let fcltCnt = 1; fcltCnt <= upperCnt; fcltCnt++) {
        const { cgnClearMin, cgnClearDt, clearMetric } = toQueueClear(profile, fcltCnt, ymd, baseMinute, targetMin);

        list.push({
            fcltCnt,
            cgnClearMin,
            cgnClearDt,
            clearMetric,
            goalMetYn: isQueueGoalMet(profile, fcltCnt, targetMin) ? 'Y' : 'N',
            fcstList: toQueueFcstList(profile, fcltCnt, ymd, baseMinute, judgeMin),
        });
    }

    return list;
}

function failQueueScenario(errorMessage: string): FcltQueueScenarioDto {
    return { error: true, errorMessage } as FcltQueueScenarioDto;
}

function buildFcltQueueScenario(req: FcltQueueScenarioReq): FcltQueueScenarioDto {
    const key = `${req.tmnlId}-${req.fcltType}-${req.unitCd}`;
    const profile = queueProfileAt(key, req.hhmm);
    const ymd = BASE_INFO.ymd;
    // 평가시각 = 조회 시각. 관측구간은 그 직전 10분이다
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
                ? queueMetric('UNAVAILABLE', 'PRCS_WAIT_AVG', `직전 ${QUEUE_OBS_MIN}분에 처리된 여객이 없습니다.`)
                : queueMetric('CALCULATED', 'PRCS_WAIT_AVG', `[t-${QUEUE_OBS_MIN}분, t) 처리 여객의 처리인원 가중평균 대기시간`),
        cgnStatus: mockGradeOf(profile.obsWtngSec),
        oprFcltCnt: profile.oprCnt,
        totCnt: profile.totCnt,
        totCntRsn: profile.totCnt === null ? '보안검색대(SC) 시설 마스터에서 배정 가능 수량을 찾지 못했습니다.' : '',
        arvlRate: profile.arvlPerHour / 60,
        srvcRate: mu === null ? null : mu / 60,
        arvlMetric: queueMetric('ESTIMATED', 'EXTERNAL_INPUT', '기준시각부터 60분 CAST 유입 합 / 60분 × 60 (명/시간)'),
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
        cntClearList: [],
        clearJudgeMin: null,
        arvlProfileYn: null,
        arvlList: [],
    };

    if (req.mode === 'COUNT') {
        return {
            ...result,
            scenario: toQueueClear(profile, req.oprFcltCnt ?? profile.oprCnt, ymd, baseMinute, targetMin),
        };
    }

    const recommend = toQueueRecommend(profile, targetMin);
    const judgeMin = judgeMinOf(targetMin);
    const timeResult: FcltQueueScenarioDto = {
        ...result,
        recommend,
        cntClearList: toQueueCntClearList(profile, recommend.reqCnt, ymd, baseMinute, targetMin),
        clearJudgeMin: judgeMin,
        arvlProfileYn: 'Y',
        arvlList: toQueueArvlList(profile, ymd, baseMinute, judgeMin),
    };

    if (recommend.reqCnt === null) return timeResult;

    if (profile.totCnt !== null && recommend.reqCnt > profile.totCnt) {
        return { ...timeResult, totScenario: toQueueClear(profile, profile.totCnt, ymd, baseMinute, targetMin) };
    }

    const scenario = toQueueClear(profile, recommend.reqCnt, ymd, baseMinute, targetMin);
    const goalMet = isQueueGoalMet(profile, recommend.reqCnt, targetMin);

    return {
        ...timeResult,
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

    getUserBaseInfo: (smltId: string, ymd: string): DsbdBaseInfoDto => ({
        ...BASE_INFO,
        smltId,
        ymd,
        smltType: 'USER',
        nextCalcDt: '',
        error: !smltId,
        errorMessage: smltId ? '' : '사용자 시뮬레이션 실행 ID가 필요합니다.',
    }),

    getHeader: (): DsbdHeaderDto => HEADER,

    getTmnlSmry: (tmnlId: TmnlId, hhmm: string, intrvlMin: number, category: DsbdCategory): TmnlSmryDto =>
        buildTmnlSmry(tmnlId, hhmm, intrvlMin, category),

    getTmnlRsltByTime: (tmnlId: TmnlId, category: DsbdCategory): DsbdRsltDto[] => buildRsltList(tmnlId, category),

    getFcltCardList: (tmnlId: TmnlId, hhmm: string, fcltType: 'CHKN' | 'DEP'): DsbdFcltCardDto[] => buildFcltCardList(tmnlId, hhmm, fcltType),

    getFcltQueueScenario: (req: FcltQueueScenarioReq): FcltQueueScenarioDto => buildFcltQueueScenario(req),
};
