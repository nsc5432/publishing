import type { SmltCastExecDto, SmltExecSmryDto, SmltExecStatus } from '@/types/api.types';
import { formatCount } from '@/modules/pm/pages/dashboard/format';
import type { HistoryRow, RunStatus, StatCard } from './types';

/**
 * 모니터링 DTO → 화면 뷰 모델.
 * 단위·시각 형식을 여기서 한 번에 정한다.
 */

/** 값이 비었을 때 표기 */
const EMPTY = '-';

/** 수행 상태 (서버 코드 → 화면 표기) */
const RUN_STATUS: Record<SmltExecStatus, RunStatus> = {
    DONE: 'done',
    RUNNING: 'running',
};

/** yyyyMMddHHmmss → yyyy.MM.dd HH:mm (진행중이라 종료일시가 없으면 '-') */
function formatExecDt(dt: string): string {
    if (!dt || dt.length < 12) return EMPTY;

    return `${dt.slice(0, 4)}.${dt.slice(4, 6)}.${dt.slice(6, 8)} ${dt.slice(8, 10)}:${dt.slice(10, 12)}`;
}

/** 상단 KPI 카드 4종 */
export function toStatCards(smry: SmltExecSmryDto): StatCard[] {
    return [
        {
            id: 'total',
            icon: 'layers',
            label: '전체 수행',
            values: [{ value: formatCount(smry.totCnt), unit: '건' }],
        },
        {
            id: 'done',
            icon: 'checkCircle',
            label: '완료',
            values: [{ value: formatCount(smry.doneCnt), unit: '건' }],
            tone: 'teal',
        },
        {
            id: 'running',
            icon: 'spinner',
            label: '진행중',
            values: [{ value: formatCount(smry.runningCnt), unit: '건' }],
        },
        {
            id: 'avg',
            icon: 'clock',
            label: '평균 수행시간',
            values: [
                { value: String(smry.avgExecMin), unit: '분' },
                { value: String(smry.avgExecSec).padStart(2, '0'), unit: '초' },
            ],
        },
    ];
}

/** 시뮬레이션 이력 (표준 / 사용자 공용) */
export function toHistoryRows(list: SmltCastExecDto[]): HistoryRow[] {
    return list.map((exec) => ({
        no: exec.rowNum,
        smltId: exec.smltId,
        dept: exec.deptNm,
        name: exec.userNm,
        startAt: formatExecDt(exec.bgnDt),
        endAt: formatExecDt(exec.endDt),
        duration: exec.execMin,
        status: RUN_STATUS[exec.execStatus],
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
