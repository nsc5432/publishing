import { useMemo } from 'react';
import { dashboardService } from '@/api/pm/services/dashboard.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { DsbdCategory, DsbdFcltCardDto, DsbdHeaderDto, TmnlSmryDto } from '@/types/api.types';
import { SMRY_INTRVL_MIN, type TerminalKind, type TerminalView } from '../types';
import { toPrimeTime, toTerminalView } from '../view';

export interface DashboardQuery {
    smltId: string;
    ymd: string;
    hhmm: string;
}

export interface PrimeTimeQuery {
    smltId: string;
    ymd: string;
    category: DsbdCategory;
}

interface PanelBase {
    query: DashboardQuery;
    smry: TmnlSmryDto;
    chknCards: DsbdFcltCardDto[];
    dptgtCards: DsbdFcltCardDto[];
}

interface PanelQuery {
    query: DashboardQuery;
    tmnlId: TerminalKind;
}

interface RsltQuery extends PanelQuery {
    category: DsbdCategory;
}

const DAY_OVERVIEW_FAIL = '상단 요약 정보를 불러오지 못했습니다.';
const PANEL_FAIL = '터미널 요약 정보를 불러오지 못했습니다.';
const RSLT_FAIL = '시간대별 결과를 불러오지 못했습니다.';
const PRIME_TIME_FAIL = '최대 시간대를 계산할 수 있는 결과가 없습니다.';

export function usePrimeTime(query: PrimeTimeQuery | null) {
    return useFetched(
        query,
        async (request) => {
            const results = await Promise.all([
                dashboardService.getTmnlRsltByTime(request.smltId, 'T1', request.category),
                dashboardService.getTmnlRsltByTime(request.smltId, 'T2', request.category),
            ]);
            const hhmm = toPrimeTime(results, request.category);

            if (!hhmm) throw new Error(PRIME_TIME_FAIL);

            return { query: request, hhmm };
        },
        RSLT_FAIL,
    );
}

export function useDayOverview(query: DashboardQuery | null): Fetched<DsbdHeaderDto> {
    return useFetched(
        query,
        ({ ymd, hhmm }) => dashboardService.getHeader(ymd, hhmm).then((dto) => unwrap(dto, DAY_OVERVIEW_FAIL)),
        DAY_OVERVIEW_FAIL,
    );
}

export function useTerminalPanel(query: DashboardQuery | null, tmnlId: TerminalKind, category: DsbdCategory): Fetched<TerminalView> {
    const panelQuery = useMemo<PanelQuery | null>(() => (query ? { query, tmnlId } : null), [query, tmnlId]);
    const rsltQuery = useMemo<RsltQuery | null>(() => (query ? { query, tmnlId, category } : null), [query, tmnlId, category]);

    const panelBase = useFetched(
        panelQuery,
        ({ query: dashboardQuery, tmnlId: terminal }) => {
            const { smltId, hhmm } = dashboardQuery;

            return Promise.all([
                dashboardService.getTmnlSmry(smltId, terminal, hhmm, SMRY_INTRVL_MIN).then((dto) => unwrap(dto, PANEL_FAIL)),
                dashboardService.getFcltCardList(smltId, terminal, hhmm, 'CHKN'),
                dashboardService.getFcltCardList(smltId, terminal, hhmm, 'DEP'),
            ]).then(([smry, chknCards, dptgtCards]): PanelBase => ({
                query: dashboardQuery,
                smry,
                chknCards,
                dptgtCards,
            }));
        },
        PANEL_FAIL,
    );

    const hourlyResults = useFetched(
        rsltQuery,
        ({ query: dashboardQuery, tmnlId: terminal, category: quickTile }) => dashboardService.getTmnlRsltByTime(dashboardQuery.smltId, terminal, quickTile),
        RSLT_FAIL,
    );

    return useMemo(() => {
        const error = panelBase.error || hourlyResults.error;
        const responseSeq = panelBase.responseSeq + hourlyResults.responseSeq;
        if (!panelBase.data || !hourlyResults.data) return { data: null, error, responseSeq };

        return {
            data: toTerminalView({
                ymd: panelBase.data.query.ymd,
                hhmm: panelBase.data.query.hhmm,
                smry: panelBase.data.smry,
                rsltList: hourlyResults.data,
                chknCards: panelBase.data.chknCards,
                dptgtCards: panelBase.data.dptgtCards,
            }),
            error,
            responseSeq,
        };
    }, [panelBase, hourlyResults]);
}
