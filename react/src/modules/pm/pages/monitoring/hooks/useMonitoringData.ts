import { useEffect, useMemo, useState } from 'react';
import { monitoringService } from '@/api/pm/services/monitoring.service';
import { unwrap } from '@/api/pm/result';
import type { ApiError, SmltExecListDto, SmltExecSmryDto } from '@/types/api.types';
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

/** 실패해도 화면 골격은 남기고 사유만 올려보낸다 */
interface Fetched<T> {
    data: T | null;
    error: string;
}

const EMPTY = { data: null, error: '' };

const message = (err: ApiError, fallback: string) => err?.message || fallback;

const SMRY_FAIL = '수행 현황을 불러오지 못했습니다.';
const LIST_FAIL = '시뮬레이션 이력을 불러오지 못했습니다.';

export interface MonitoringView {
    stats: StatCard[];
    history: Record<HistoryKind, HistoryRow[]>;
}

const EMPTY_HISTORY: Record<HistoryKind, HistoryRow[]> = { standard: [], user: [] };

/** 상단 KPI + 시뮬레이션 이력 (같은 조회 조건을 쓰므로 함께 부른다) */
export function useMonitoring(query: MonitoringQuery | null): Fetched<MonitoringView> {
    const [smry, setSmry] = useState<Fetched<SmltExecSmryDto>>(EMPTY);
    const [list, setList] = useState<Fetched<SmltExecListDto>>(EMPTY);

    useEffect(() => {
        if (!query) return;

        let alive = true;

        monitoringService
            .getExecSmry(query.bgnDt, query.endDt)
            .then((dto) => unwrap(dto, SMRY_FAIL))
            .then((dto) => {
                if (alive) setSmry({ data: dto, error: '' });
            })
            .catch((err: ApiError) => {
                if (alive) setSmry({ data: null, error: message(err, SMRY_FAIL) });
            });

        monitoringService
            .getExecList(query.bgnDt, query.endDt)
            .then((dto) => unwrap(dto, LIST_FAIL))
            .then((dto) => {
                if (alive) setList({ data: dto, error: '' });
            })
            .catch((err: ApiError) => {
                if (alive) setList({ data: null, error: message(err, LIST_FAIL) });
            });

        return () => {
            alive = false;
        };
    }, [query]);

    return useMemo(() => {
        const error = smry.error || list.error;

        return {
            data: {
                stats: smry.data ? toStatCards(smry.data) : EMPTY_STAT_CARDS,
                history: list.data
                    ? {
                          standard: toHistoryRows(list.data.stdList),
                          user: toHistoryRows(list.data.userList),
                      }
                    : EMPTY_HISTORY,
            },
            error,
        };
    }, [smry, list]);
}
