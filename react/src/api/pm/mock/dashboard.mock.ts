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
 * 값은 전부 고정이다. 호출할 때마다 흔들리면 화면이 제대로 그려진 것인지
 * 목업이 튄 것인지 구분할 수 없다.
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
        wthrCd: 'CLOUDY',
        tmpr: 24,
        rainAmt: 0,
        snowAmt: 0,
        lowVisStep1Time: '1500',
        lowVisStep2Time: '1600',
    },
};

/* ================= 터미널 패널 요약 ================= */

const TMNL_SMRY: Record<TmnlId, TmnlSmryDto> = {
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
        peak: {
            ampm: 'AM',
            peakTime: '0900',
            wtngPsgCnt: 212,
            maxWtngHr: 35,
            hrlyPrcsPsgCnt: 230,
        },
    },
};

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

function buildRsltList(tmnlId: TmnlId, category: DsbdCategory): DsbdRsltDto[] {
    const scale = CATEGORY_SCALE[category];

    return HOURLY_PSG[tmnlId].map((base, hour) => {
        const psgCnt = Math.round(base * scale);
        const wtngPsgCnt = Math.round(psgCnt * 0.12);

        return {
            time: `${String(hour).padStart(2, '0')}00`,
            psgCnt,
            wtngPsgCnt,
            wtngHr: Math.min(40, Math.round(wtngPsgCnt / 8)),
            prcsPsgCnt: Math.round(psgCnt * 0.9),
            prcsHr: Math.min(30, Math.round(wtngPsgCnt / 12)),
            prcsRate: 70 + ((hour * 7) % 26),
            fcstWtngPsgCnt: Math.round(wtngPsgCnt * 1.12),
            lastWeekWtngPsgCnt: Math.round(wtngPsgCnt * 0.88),
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

const CHKN_CARDS: Record<TmnlId, DsbdFcltCardDto[]> = {
    T1: [
        {
            cardId: 'T1-CHKN-B',
            fcltType: 'CHKN',
            island: 'B',
            depNum: '',
            fcltNm: 'B',
            fcltDesc: '좌측 B4~B8',
            totCnt: 14,
            oprCnt: 14,
            wtngPsgCnt: 640,
            hrlyPrcsPsgCnt: 42,
            hrlyPrcsRate: 78,
            cgnClearTime: '1100',
            cgnClearRate: 62,
            cgnStatus: 'BUSY',
            recommend: { targetNm: '대한항공', addCnt: 5, needAssignYn: 'Y' },
            unitList: buildUnits(CHKN_LABELS, ['N', 'H', 'C', 'B'], []),
        },
        {
            cardId: 'T1-CHKN-D',
            fcltType: 'CHKN',
            island: 'D',
            depNum: '',
            fcltNm: 'D',
            fcltDesc: '중앙 D1~D6',
            totCnt: 12,
            oprCnt: 10,
            wtngPsgCnt: 410,
            hrlyPrcsPsgCnt: 36,
            hrlyPrcsRate: 66,
            cgnClearTime: '1120',
            cgnClearRate: 50,
            cgnStatus: 'NORMAL',
            recommend: { targetNm: '아시아나항공', addCnt: 3, needAssignYn: 'Y' },
            unitList: buildUnits(CHKN_LABELS, ['L', 'K', 'F'], ['A']),
        },
    ],
    T2: [
        {
            cardId: 'T2-CHKN-C',
            fcltType: 'CHKN',
            island: 'C',
            depNum: '',
            fcltNm: 'C',
            fcltDesc: '좌측 C1~C5',
            totCnt: 12,
            oprCnt: 11,
            wtngPsgCnt: 520,
            hrlyPrcsPsgCnt: 38,
            hrlyPrcsRate: 71,
            cgnClearTime: '1050',
            cgnClearRate: 58,
            cgnStatus: 'BUSY',
            recommend: { targetNm: '대한항공', addCnt: 4, needAssignYn: 'Y' },
            unitList: buildUnits(CHKN_LABELS, ['M', 'C'], []),
        },
        {
            cardId: 'T2-CHKN-E',
            fcltType: 'CHKN',
            island: 'E',
            depNum: '',
            fcltNm: 'E',
            fcltDesc: '우측 E1~E4',
            totCnt: 10,
            oprCnt: 8,
            wtngPsgCnt: 330,
            hrlyPrcsPsgCnt: 30,
            hrlyPrcsRate: 61,
            cgnClearTime: '1110',
            cgnClearRate: 47,
            cgnStatus: 'NORMAL',
            recommend: { targetNm: '진에어', addCnt: 2, needAssignYn: 'N' },
            unitList: buildUnits(CHKN_LABELS, ['J'], ['A']),
        },
    ],
};

const DEP_CARDS: Record<TmnlId, DsbdFcltCardDto[]> = {
    T1: [
        {
            cardId: 'T1-DEP-3',
            fcltType: 'DEP',
            island: '',
            depNum: '3',
            fcltNm: '3번',
            fcltDesc: '',
            totCnt: 6,
            oprCnt: 5,
            wtngPsgCnt: 640,
            hrlyPrcsPsgCnt: 44,
            hrlyPrcsRate: 78,
            cgnClearTime: '1100',
            cgnClearRate: 62,
            cgnStatus: 'BUSY',
            recommend: { targetNm: '보안검색대', addCnt: 6, needAssignYn: 'N' },
            unitList: buildUnits(['6', '5', '4', '3', '2', '1'], ['4'], ['6']),
        },
        {
            cardId: 'T1-DEP-1',
            fcltType: 'DEP',
            island: '',
            depNum: '1',
            fcltNm: '1번',
            fcltDesc: '',
            totCnt: 6,
            oprCnt: 4,
            wtngPsgCnt: 430,
            hrlyPrcsPsgCnt: 31,
            hrlyPrcsRate: 55,
            cgnClearTime: '1130',
            cgnClearRate: 40,
            cgnStatus: 'NORMAL',
            recommend: { targetNm: '보안검색대', addCnt: 4, needAssignYn: 'N' },
            unitList: buildUnits(['6', '5', '4', '3', '2', '1'], ['3'], []),
        },
    ],
    T2: [
        {
            cardId: 'T2-DEP-1',
            fcltType: 'DEP',
            island: '',
            depNum: '1',
            fcltNm: '1번',
            fcltDesc: '',
            totCnt: 2,
            oprCnt: 2,
            wtngPsgCnt: 640,
            hrlyPrcsPsgCnt: 44,
            hrlyPrcsRate: 78,
            cgnClearTime: '1100',
            cgnClearRate: 62,
            cgnStatus: 'BUSY',
            recommend: { targetNm: '보안검색대', addCnt: 6, needAssignYn: 'N' },
            unitList: buildUnits(['2', '1'], ['1'], []),
        },
        {
            cardId: 'T2-DEP-2',
            fcltType: 'DEP',
            island: '',
            depNum: '2',
            fcltNm: '2번',
            fcltDesc: '',
            totCnt: 2,
            oprCnt: 1,
            wtngPsgCnt: 430,
            hrlyPrcsPsgCnt: 31,
            hrlyPrcsRate: 55,
            cgnClearTime: '1130',
            cgnClearRate: 40,
            cgnStatus: 'NORMAL',
            recommend: { targetNm: '보안검색대', addCnt: 4, needAssignYn: 'N' },
            unitList: buildUnits(['2', '1'], [], ['2']),
        },
    ],
};

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

    getTmnlSmry: (tmnlId: TmnlId): TmnlSmryDto => TMNL_SMRY[tmnlId],

    getTmnlRsltByTime: (tmnlId: TmnlId, category: DsbdCategory): DsbdRsltDto[] =>
        buildRsltList(tmnlId, category),

    getFcltCardList: (tmnlId: TmnlId, fcltType: 'CHKN' | 'DEP'): DsbdFcltCardDto[] =>
        fcltType === 'CHKN' ? CHKN_CARDS[tmnlId] : DEP_CARDS[tmnlId],
};
