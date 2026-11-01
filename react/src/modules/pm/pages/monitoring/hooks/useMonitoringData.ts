import { useEffect, useMemo, useRef, useState } from 'react';
import { monitoringService } from '@/api/pm/services/monitoring.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { HistoryKind, HistoryRow, StatCard, UserExecAverage } from '../types';
import { EMPTY_STAT_CARDS, toHistoryRows, toStatCards, toUserExecAverage } from '../view';

export interface MonitoringQuery {
    bgnDt: string;
    endDt: string;
}

export interface MonitoringView {
    stats: StatCard[];
    history: Record<HistoryKind, HistoryRow[]>;
    userAverage: UserExecAverage;
}

const SMRY_FAIL = '수행 현황을 불러오지 못했습니다.';
const LIST_FAIL = '시뮬레이션 이력을 불러오지 못했습니다.';

const EMPTY_HISTORY: Record<HistoryKind, HistoryRow[]> = { standard: [], user: [] };

export function useMonitoring(query: MonitoringQuery, refreshSeconds: number): Fetched<MonitoringView> {
    const [refreshSeq, setRefreshSeq] = useState(0);
    const [now, setNow] = useState(Date.now);
    const inFlight = useRef(0);
    const fetchQuery = useMemo(() => ({ ...query, refreshSeq }), [query, refreshSeq]);
    const fetched = useFetched(
        fetchQuery,
        async ({ bgnDt, endDt }) => {
            inFlight.current += 1;
            try {
                const [summary, list] = await Promise.allSettled([
                    monitoringService.getExecSmry(bgnDt, endDt).then((dto) => unwrap(dto, SMRY_FAIL)),
                    monitoringService.getExecList(bgnDt, endDt).then((dto) => unwrap(dto, LIST_FAIL)),
                ]);
                if (summary.status === 'rejected') throw summary.reason;
                if (list.status === 'rejected') throw list.reason;

                return { summary: summary.value, list: list.value, receivedAt: Date.now() };
            } finally {
                inFlight.current -= 1;
            }
        },
        LIST_FAIL,
    );
    const hasRunning = fetched.data?.list.userList.some((row) => row.smltFlfmtSttsCd === 'RUNNING');

    useEffect(() => {
        const timer = window.setInterval(() => {
            if (inFlight.current === 0) setRefreshSeq((current) => current + 1);
        }, refreshSeconds * 1000);
        return () => window.clearInterval(timer);
    }, [query, refreshSeconds]);

    useEffect(() => {
        if (!hasRunning) return;

        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [hasRunning]);

    return useMemo(() => {
        const userAverage = toUserExecAverage(fetched.data?.list.userList ?? []);

        return {
            data: {
                stats: fetched.data ? toStatCards(fetched.data.summary) : EMPTY_STAT_CARDS,
                history: fetched.data
                    ? {
                          standard: toHistoryRows(fetched.data.list.stdList),
                          user: toHistoryRows(fetched.data.list.userList, userAverage.seconds, Math.max(now, fetched.data.receivedAt)),
                      }
                    : EMPTY_HISTORY,
                userAverage,
            },
            error: fetched.error,
            responseSeq: fetched.responseSeq,
        };
    }, [fetched, now]);
}
