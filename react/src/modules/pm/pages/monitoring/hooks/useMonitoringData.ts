import { useMemo } from 'react';
import { monitoringService } from '@/api/pm/services/monitoring.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { HistoryKind, HistoryRow, StatCard } from '../types';
import { EMPTY_STAT_CARDS, toHistoryRows, toStatCards } from '../view';

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
    const execSmry = useFetched(query, ({ bgnDt, endDt }) => monitoringService.getExecSmry(bgnDt, endDt).then((dto) => unwrap(dto, SMRY_FAIL)), SMRY_FAIL);
    const execList = useFetched(query, ({ bgnDt, endDt }) => monitoringService.getExecList(bgnDt, endDt).then((dto) => unwrap(dto, LIST_FAIL)), LIST_FAIL);

    return useMemo(() => {
        const error = execSmry.error || execList.error;
        const token = execSmry.token + execList.token;

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
            token,
        };
    }, [execSmry, execList]);
}
