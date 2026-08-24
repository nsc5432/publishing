import type { SmltCastExecDto, SmltExecSmryDto, SmltExecStatus } from '@/types/api.types';
import { formatCount, pad2 } from '@/lib/format';
import type { HistoryRow, RunStatus, StatCard } from './types';

/**
 * 모니터링 DTO → 화면 뷰 모델.
 * 단위·시각 형식을 여기서 한 번에 정한다.
 */

/** 값이 비었을 때 표기 */
const EMPTY = '-';

/** 수행 상태 (서버 코드 → 화면 표기) */
const EXEC_STATUS_TO_RUN_STATUS: Record<SmltExecStatus, RunStatus> = {
    DONE: 'done',
    RUNNING: 'running',
};

/** yyyyMMddHHmmss → yyyy.MM.dd HH:mm (진행중이라 종료일시가 없으면 '-') */
function formatExecDt(execDt: string): string {
    if (!execDt || execDt.length < 12) return EMPTY;

    return `${execDt.slice(0, 4)}.${execDt.slice(4, 6)}.${execDt.slice(6, 8)} ${execDt.slice(8, 10)}:${execDt.slice(10, 12)}`;
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
            label: '진행중',
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
export function toHistoryRows(execList: SmltCastExecDto[]): HistoryRow[] {
    return execList.map((exec) => ({
        rowNo: exec.rowNum,
        smltId: exec.smltId,
        dept: exec.deptNm,
        name: exec.userNm,
        startAt: formatExecDt(exec.smltFlfmtBgngDt),
        endAt: formatExecDt(exec.smltFlfmtEndDt),
        duration: exec.execMin,
        status: EXEC_STATUS_TO_RUN_STATUS[exec.smltFlfmtSttsCd],
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
