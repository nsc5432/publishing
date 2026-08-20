import { useMemo } from 'react';
import { monitoringService } from '@/api/pm/services/monitoring.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { HistoryKind, HistoryRow, StatCard } from '../types';
import { EMPTY_STAT_CARDS, toHistoryRows, toStatCards } from '../view';

/**
 * 확정된 조회 조건 (yyyyMMddHHmm).
 * 조회 버튼을 눌러야 바뀐다 — 시/분 선택만으로 목록이 흔들리면
 * 지금 보는 이력이 어느 기간의 것인지 알 수 없다.
 */
export interface MonitoringQuery {
    bgnDt: string;
    endDt: string;
}

export interface MonitoringView {
    stats: StatCard[];
    history: Record<HistoryKind, HistoryRow[]>;
}

const SMRY_FAIL = '수행 현황을 불러오지 못했습니다.';
const LIST_FAIL = '시뮬레이션 이력을 불러오지 못했습니다.';

const EMPTY_HISTORY: Record<HistoryKind, HistoryRow[]> = { standard: [], user: [] };

export function useMonitoring(query: MonitoringQuery | null): Fetched<MonitoringView> {
    const execSmry = useFetched(
        query,
        ({ bgnDt, endDt }) =>
            monitoringService.getExecSmry(bgnDt, endDt).then((dto) => unwrap(dto, SMRY_FAIL)),
        SMRY_FAIL,
    );
    const execList = useFetched(
        query,
        ({ bgnDt, endDt }) =>
            monitoringService.getExecList(bgnDt, endDt).then((dto) => unwrap(dto, LIST_FAIL)),
        LIST_FAIL,
    );

    return useMemo(() => {
        const error = execSmry.error || execList.error;

        return {
            data: {
                stats: execSmry.data ? toStatCards(execSmry.data) : EMPTY_STAT_CARDS,
                history: execList.data
                    ? {
                          standard: toHistoryRows(execList.data.stdList),
                          user: toHistoryRows(execList.data.userList),
                      }
                    : EMPTY_HISTORY,
            },
            error,
        };
    }, [execSmry, execList]);
}
