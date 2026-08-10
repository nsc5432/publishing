import type {
    SmltCastExecDto,
    SmltExecDetailDto,
    SmltExecListDto,
    SmltExecSmryDto,
    SmltType,
} from '@/types/api.types';

/**
 * 시뮬레이션 모니터링 목업 응답 (VITE_ENABLE_MOCK=true 일 때 사용).
 *
 * 이력은 조회 기간의 시작일에 맞춰 만든다. 값이 조회 조건과 무관하게 고정이면
 * 조회가 실제로 다시 걸렸는지 화면에서 구분할 수 없다.
 */

/** 이력 건수 (표준 / 사용자 각각) */
const ROW_COUNT = 30;

/** 진행중으로 둘 행 번호 */
const RUNNING_NOS: Record<SmltType, number[]> = {
    DAILY: [3, 4, 19, 20],
    USER: [3, 4, 22],
};

/** 소요시간 (분) */
const EXEC_MIN = 15;

/** yyyyMMddHHmm(조회 조건) → yyyyMMdd. 형식이 어긋나면 기준일로 되돌린다. */
function toYmd(bgnDt: string): string {
    return bgnDt.length >= 8 ? bgnDt.slice(0, 8) : '20260723';
}

/** 시작 시각을 13:00 부터 행마다 1분씩 밀어 준다 (같은 시각이 30줄 이어지지 않도록) */
function toDateTime(ymd: string, minutes: number): string {
    const total = 13 * 60 + minutes;
    const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');

    return `${ymd}${hh}${mm}00`;
}

function buildRows(smltType: SmltType, ymd: string): SmltCastExecDto[] {
    return Array.from({ length: ROW_COUNT }, (_, i) => {
        const rowNum = i + 1;
        const running = RUNNING_NOS[smltType].includes(rowNum);
        const bgnDt = toDateTime(ymd, i);

        return {
            rowNum,
            smltId: `${smltType === 'DAILY' ? 'STD' : 'USR'}-${ymd}-${String(rowNum).padStart(4, '0')}`,
            smltType,
            deptNm: '시설관리팀',
            userNm: '김민수',
            bgnDt,
            endDt: running ? '' : toDateTime(ymd, i + EXEC_MIN),
            execMin: running ? 0 : EXEC_MIN,
            execStatus: running ? 'RUNNING' : 'DONE',
        };
    });
}

export const monitoringMock = {
    getExecSmry: (): SmltExecSmryDto => ({
        error: false,
        errorMessage: '',
        totCnt: 50,
        doneCnt: 13,
        runningCnt: 37,
        avgExecMin: 15,
        avgExecSec: 0,
    }),

    getExecList: (bgnDt: string): SmltExecListDto => {
        const ymd = toYmd(bgnDt);

        return {
            error: false,
            errorMessage: '',
            stdList: buildRows('DAILY', ymd),
            userList: buildRows('USER', ymd),
        };
    },

    /** 이력 1건 결과 보기 — 목록에서 만든 ID 규칙(구분-기준일자-순번)을 되짚는다 */
    getExecDetail: (smltId: string): SmltExecDetailDto => {
        const [prefix, ymd = '20260723', no = '0001'] = smltId.split('-');
        const smltType: SmltType = prefix === 'USR' ? 'USER' : 'DAILY';
        const rowNum = Number(no) || 1;
        const running = RUNNING_NOS[smltType].includes(rowNum);

        return {
            error: false,
            errorMessage: '',
            smltId,
            smltType,
            ymd,
            tmnlId: rowNum % 2 === 0 ? 'T2' : 'T1',
            deptNm: '시설관리팀',
            userNm: '김민수',
            bgnDt: toDateTime(ymd, rowNum - 1),
            endDt: running ? '' : toDateTime(ymd, rowNum - 1 + EXEC_MIN),
            execMin: running ? 0 : EXEC_MIN,
            execStatus: running ? 'RUNNING' : 'DONE',
        };
    },
};
