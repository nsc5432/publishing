import type { CongestionStatus } from '@/types/api.types';

/**
 * 혼잡등급 목업 공용 규칙 — 서버 CgnGradeScale / CgnOrder 와 같은 판정을 흉내 낸다.
 *
 * 기준표는 DB(TN_PM_PSG_PRCS_GRD)처럼 정수 분 MIN/MAX 이고, 판정은 초 단위
 * [MIN×60, (MAX+1)×60) 구간에 소수 원값을 그대로 비교한다. 19분 59.5초는 FREE, 20분은 NORMAL 이다.
 */

interface MockGradeRow {
    status: CongestionStatus;
    minVl: number;
    maxVl: number;
}

const SEC_PER_MIN = 60;

const MOCK_GRADE_ROWS: MockGradeRow[] = [
    { status: 'FREE', minVl: 0, maxVl: 19 },
    { status: 'NORMAL', minVl: 20, maxVl: 39 },
    { status: 'BUSY', minVl: 40, maxVl: 59 },
    { status: 'VERY_BUSY', minVl: 60, maxVl: 9999 },
];

const SEVERITY: CongestionStatus[] = ['FREE', 'NORMAL', 'BUSY', 'VERY_BUSY'];

/** 해소 목표 — 평균 대기시간이 이 값(초) 미만 */
export const MOCK_NORMAL_UPPER_EXCLUSIVE_SEC = (MOCK_GRADE_ROWS[1].maxVl + 1) * SEC_PER_MIN;

/** 직전 30분 처리 여객 평균 대기시간(초) → 등급. 산정 불가 / 기준 범위 밖은 null */
export function mockGradeOf(avgWtngSec: number | null): CongestionStatus | null {
    if (avgWtngSec === null || !Number.isFinite(avgWtngSec) || avgWtngSec < 0) return null;

    const row = MOCK_GRADE_ROWS.find((grade) => grade.minVl * SEC_PER_MIN <= avgWtngSec && avgWtngSec < (grade.maxVl + 1) * SEC_PER_MIN);

    return row?.status ?? null;
}

/** 산정 가능한 시설 중 최고 심각도. 전부 산정 불가면 null */
export function mockWorstOf(statusList: (CongestionStatus | null)[]): CongestionStatus | null {
    return statusList.reduce<CongestionStatus | null>(
        (worst, status) => (status !== null && (worst === null || SEVERITY.indexOf(status) > SEVERITY.indexOf(worst)) ? status : worst),
        null,
    );
}

/** 평균 대기시간 내림차순, 산정 불가는 뒤로, 같으면 대기인원 내림차순, 그다음 코드 오름차순 */
export function mockByWaitDesc<T>(
    avgWtngSec: (item: T) => number | null,
    wtngPsgCnt: (item: T) => number,
    unitCd: (item: T) => string,
): (a: T, b: T) => number {
    return (a, b) => {
        const aWait = avgWtngSec(a);
        const bWait = avgWtngSec(b);

        if (aWait !== bWait) {
            if (aWait === null) return 1;
            if (bWait === null) return -1;

            return bWait - aWait;
        }

        return wtngPsgCnt(b) - wtngPsgCnt(a) || unitCd(a).localeCompare(unitCd(b));
    };
}

/**
 * 목업 평균 대기시간 — 평가시각 직전 슬롯의 대기인원 × 1인당 대기 환산(초).
 * 하루 첫 슬롯은 전날 결과가 없어 산정 불가(null)로 둔다 (서버와 같은 규칙).
 */
export function mockAvgWtngSec(prevWtngPsgCnt: number | null, secPerPsg: number): number | null {
    return prevWtngPsgCnt === null ? null : prevWtngPsgCnt * secPerPsg;
}

/** 목표를 넘는 평균 대기 5분마다 부스 1대를 더한다 — 서버 예측 탐색의 목업 근사 */
const EXCESS_SEC_PER_BOOTH = 300;
/** 목표 해소시간 기본값 (분) */
const DFLT_TARGET_MIN = 30;

/**
 * 체크인 추천 — 30분 안에 평균 대기시간을 NORMAL 상한 미만으로 낮추는 총 부스 수와 해소 분.
 * 평균을 낼 수 없거나 운영 부스가 없으면 처리율을 알 수 없어 추천을 내지 못한다 (서버와 같은 규칙).
 */
export function mockChknRecommend(avgWtngSec: number | null, oprBoothCnt: number): { reqCnt: number | null; cgnClearMin: number | null } {
    if (avgWtngSec === null || oprBoothCnt === 0) return { reqCnt: null, cgnClearMin: null };

    const excessSec = avgWtngSec - MOCK_NORMAL_UPPER_EXCLUSIVE_SEC;

    if (excessSec < 0) return { reqCnt: oprBoothCnt, cgnClearMin: 0 };

    return {
        reqCnt: oprBoothCnt + Math.floor(excessSec / EXCESS_SEC_PER_BOOTH) + 1,
        cgnClearMin: Math.min(DFLT_TARGET_MIN, Math.ceil(excessSec / SEC_PER_MIN) + 10),
    };
}
