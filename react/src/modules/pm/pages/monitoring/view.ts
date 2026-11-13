import type { SmltCastExecDto, SmltExecSmryDto, SmltExecStatus } from '@/types/api.types';
import { formatCount, pad2 } from '@/lib/format';
import type { HistoryRow, RunStatus, StatCard, UserExecAverage } from './types';

/**
 * 모니터링 DTO → 화면 뷰 모델.
 * 단위/시각 형식을 여기서 한 번에 정한다.
 */

/** 값이 비었을 때 표기 */
const EMPTY = '-';

const FALLBACK_USER_EXEC_SECONDS = 5 * 60;

/** 수행 상태 (서버 코드 → 화면 표기) */
const EXEC_STATUS_TO_RUN_STATUS: Record<SmltExecStatus, RunStatus> = {
    WAITING: 'waiting',
    DONE: 'done',
    RUNNING: 'running',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
};

/** yyyyMMddHHmmss → yyyy.MM.dd HH:mm (진행중이라 종료일시가 없으면 '-') */
function formatExecDt(execDt: string): string {
    if (!execDt || execDt.length < 12) return EMPTY;

    return `${execDt.slice(0, 4)}.${execDt.slice(4, 6)}.${execDt.slice(6, 8)} ${execDt.slice(8, 10)}:${execDt.slice(10, 12)}`;
}

function toExecTimestamp(execDt: string): number | null {
    if (!/^\d{14}$/.test(execDt)) return null;

    const year = Number(execDt.slice(0, 4));
    const month = Number(execDt.slice(4, 6)) - 1;
    const day = Number(execDt.slice(6, 8));
    const hour = Number(execDt.slice(8, 10));
    const minute = Number(execDt.slice(10, 12));
    const second = Number(execDt.slice(12, 14));
    const date = new Date(Date.UTC(year, month, day, hour, minute, second));
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month ||
        date.getUTCDate() !== day ||
        date.getUTCHours() !== hour ||
        date.getUTCMinutes() !== minute ||
        date.getUTCSeconds() !== second
    )
        return null;

    return date.getTime() - 9 * 60 * 60 * 1000;
}

export function toUserExecAverage(execList: SmltCastExecDto[]): UserExecAverage {
    const durations = execList.flatMap((exec) => {
        if (exec.smltType !== 'USER' || exec.smltFlfmtSttsCd !== 'DONE') return [];

        const start = toExecTimestamp(exec.smltFlfmtBgngDt);
        const end = toExecTimestamp(exec.smltFlfmtEndDt);
        return start !== null && end !== null && end > start ? [(end - start) / 1000] : [];
    });
    const seconds = durations.length ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length : null;
    const rounded = seconds === null ? null : Math.round(seconds);

    return {
        seconds,
        sampleCount: durations.length,
        label: rounded === null ? EMPTY : `${Math.floor(rounded / 60)}분 ${pad2(rounded % 60)}초`,
    };
}

function toProgressPercent(exec: SmltCastExecDto, averageSeconds: number | null, now: number): number | null {
    const expectedSeconds = averageSeconds ?? FALLBACK_USER_EXEC_SECONDS;
    if (exec.smltType !== 'USER' || exec.smltFlfmtSttsCd !== 'RUNNING' || expectedSeconds <= 0) return null;

    const start = toExecTimestamp(exec.smltFlfmtBgngDt);
    if (start === null || start > now) return null;

    return Math.min(99, Math.floor(((now - start) / (expectedSeconds * 1000)) * 100));
}

/** 상단 KPI 카드 4종 */
export function toStatCards(execSmry: SmltExecSmryDto): StatCard[] {
    return [
        {
            id: 'total',
            icon: 'layers',
            label: '전체 수행',
            values: [{ value: formatCount(execSmry.totCnt), unit: '건' }],
        },
        {
            id: 'done',
            icon: 'checkCircle',
            label: '완료',
            values: [{ value: formatCount(execSmry.doneCnt), unit: '건' }],
            tone: 'teal',
        },
        {
            id: 'running',
            icon: 'spinner',
            label: '대기·진행중',
            values: [{ value: formatCount(execSmry.runningCnt), unit: '건' }],
        },
        {
            id: 'avg',
            icon: 'clock',
            label: '평균 수행시간',
            values: [
                { value: String(execSmry.avgExecMin), unit: '분' },
                { value: pad2(execSmry.avgExecSec), unit: '초' },
            ],
        },
    ];
}

/** 시뮬레이션 이력 (표준 / 사용자 공용) */
export function toHistoryRows(execList: SmltCastExecDto[], averageSeconds: number | null = null, now: number = Date.now()): HistoryRow[] {
    return execList.map((exec) => ({
        rowNo: exec.rowNum,
        smltId: exec.smltId,
        rgtrId: exec.rgtrId,
        dept: exec.deptNm,
        name: exec.userNm,
        startAt: formatExecDt(exec.smltFlfmtBgngDt),
        endAt: formatExecDt(exec.smltFlfmtEndDt),
        duration: exec.execMin,
        status: EXEC_STATUS_TO_RUN_STATUS[exec.smltFlfmtSttsCd],
        progressPercent: toProgressPercent(exec, averageSeconds, now),
    }));
}

/** 아직 응답이 없을 때 그릴 빈 KPI (골격은 그대로 두고 값만 비운다) */
export const EMPTY_STAT_CARDS: StatCard[] = toStatCards({
    error: false,
    errorMessage: '',
    totCnt: 0,
    doneCnt: 0,
    runningCnt: 0,
    avgExecMin: 0,
    avgExecSec: 0,
});
