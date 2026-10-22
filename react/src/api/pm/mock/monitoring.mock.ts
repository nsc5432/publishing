import { mockExecutions, seedExecution } from './userSmlt.mock';
import { commonMock } from './common.mock';
import { todayYmd } from '@/lib/format';
import type { JsonResponse, SmltCastExecDto, SmltExecDetailDto, SmltExecListDto, SmltExecSmryDto, SmltExecStatus, SmltType } from '@/types/api.types';

const ROW_COUNT = 30;

const RUNNING_NOS: Record<SmltType, number[]> = {
    DAILY: [],
    USER: [3, 4, 22],
};

const FAILED_NOS: Record<SmltType, number[]> = {
    DAILY: [],
    USER: [7, 25],
};

const EXEC_MIN = 15;
const WAITING_NOS = [1, 2];
const CANCELLED_NOS = [8, 26];
const seededDays = new Set<string>();

function toYmd(bgnDt: string): string {
    return bgnDt.length >= 8 ? bgnDt.slice(0, 8) : todayYmd();
}

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
        const failed = FAILED_NOS[smltType].includes(rowNum);
        const waiting = smltType === 'USER' && WAITING_NOS.includes(rowNum);
        const cancelled = smltType === 'USER' && CANCELLED_NOS.includes(rowNum);
        const smltFlfmtBgngDt = toDateTime(ymd, i);

        return {
            rowNum,
            smltId: `${smltType === 'DAILY' ? 'STD' : 'USR'}-${ymd}-${String(rowNum).padStart(4, '0')}`,
            smltType,
            rgtrId: rowNum === 1 ? commonMock.getUserInfoBySession().userId : `mock-user-${String(rowNum).padStart(2, '0')}`,
            deptNm: '시설관리팀',
            userNm: '김민수',
            smltFlfmtBgngDt,
            smltFlfmtEndDt: running || waiting ? '' : toDateTime(ymd, i + EXEC_MIN),
            execMin: running || waiting ? 0 : EXEC_MIN,
            smltFlfmtSttsCd: cancelled ? 'CANCELLED' : waiting ? 'WAITING' : toSttsCd(running, failed),
        };
    });
}

function toSttsCd(running: boolean, failed: boolean): SmltExecStatus {
    if (running) return 'RUNNING';

    return failed ? 'FAILED' : 'DONE';
}

function rows(bgnDt: string, endDt: string) {
    const ymd = toYmd(bgnDt);
    if (!seededDays.has(ymd)) {
        const demos = buildRows('USER', ymd);
        demos.forEach((row) => seedExecution(
            {
                ...row,
                error: false,
                errorMessage: '',
                ymd,
                tmnlId: 'T1',
                smltFlfmtBgngDt: row.smltFlfmtSttsCd === 'WAITING' ? '' : row.smltFlfmtBgngDt,
            },
            row.rgtrId,
            row.smltFlfmtBgngDt,
        ));
        seededDays.add(ymd);
    }
    const within = (stamp: string) => stamp.slice(0, 12) >= bgnDt && stamp.slice(0, 12) <= endDt;
    return {
        stdList: buildRows('DAILY', ymd).filter((row) => within(row.smltFlfmtBgngDt)),
        userList: [...mockExecutions.values()]
            .filter((item) => within(item.requestedDt))
            .map<SmltCastExecDto>(({ detail, rgtrId }, index) => ({ ...detail, rowNum: index + 1, rgtrId })),
    };
}
export const monitoringMock = {
    cancelUserSmlt: (smltId: string): JsonResponse => {
        const execution = mockExecutions.get(smltId);
        const userId = commonMock.getUserInfoBySession().userId;
        if (
            !userId ||
            !execution ||
            execution.detail.smltType !== 'USER' ||
            execution.rgtrId !== userId ||
            execution.detail.smltFlfmtSttsCd !== 'WAITING'
        ) {
            return { error: true, errorMessage: '대기 중인 본인 요청만 취소할 수 있습니다. 상태를 다시 확인해 주세요.' };
        }

        mockExecutions.delete(smltId);
        return { error: false, errorMessage: '' };
    },

    getExecSmry: (bgnDt: string, endDt: string): SmltExecSmryDto => {
        const list = rows(bgnDt, endDt);
        const all = [...list.stdList, ...list.userList];
        const done = all.filter((row) => row.smltFlfmtSttsCd === 'DONE');
        const average = done.length ? done.reduce((sum, row) => sum + row.execMin, 0) / done.length : 0;
        return {
            error: false,
            errorMessage: '',
            totCnt: all.length,
            doneCnt: done.length,
            runningCnt: all.filter((row) => row.smltFlfmtSttsCd === 'WAITING' || row.smltFlfmtSttsCd === 'RUNNING').length,
            avgExecMin: Math.floor(average),
            avgExecSec: Math.round((average % 1) * 60),
        };
    },
    getExecList: (bgnDt: string, endDt: string): SmltExecListDto => ({ error: false, errorMessage: '', ...rows(bgnDt, endDt) }),
    getExecDetail: (smltId: string): SmltExecDetailDto => {
        const execution = mockExecutions.get(smltId);
        if (execution) return structuredClone(execution.detail);
        const match = /^STD-(\d{8})-(\d{4})$/.exec(smltId);
        const standard = match ? buildRows('DAILY', match[1]).find((row) => row.smltId === smltId) : undefined;
        if (!standard || !match) throw new Error('수행 이력을 찾을 수 없습니다.');

        return {
            error: false,
            errorMessage: '',
            ...standard,
            ymd: match[1],
            tmnlId: standard.rowNum % 2 === 0 ? 'T2' : 'T1',
        };
    },
};
