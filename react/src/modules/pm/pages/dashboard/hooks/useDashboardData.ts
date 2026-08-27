import { useMemo } from 'react';
import { dashboardService } from '@/api/pm/services/dashboard.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { DsbdCategory, DsbdFcltCardDto, DsbdHeaderDto, TmnlSmryDto } from '@/types/api.types';
import { SMRY_ITVL_MIN, type TerminalKind, type TerminalView } from '../types';
import { toTerminalView } from '../view';

export interface DashboardQuery {
    smltId: string;
    ymd: string;
    hhmm: string;
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

const HEADER_FAIL = '상단 요약 정보를 불러오지 못했습니다.';
const PANEL_FAIL = '터미널 요약 정보를 불러오지 못했습니다.';
const RSLT_FAIL = '시간대별 결과를 불러오지 못했습니다.';

export function useDashboardHeader(query: DashboardQuery | null): Fetched<DsbdHeaderDto> {
    return useFetched(query, ({ ymd, hhmm }) => dashboardService.getHeader(ymd, hhmm).then((dto) => unwrap(dto, HEADER_FAIL)), HEADER_FAIL);
}

export function useTerminalPanel(query: DashboardQuery | null, tmnlId: TerminalKind, category: DsbdCategory): Fetched<TerminalView> {
    const panelQuery = useMemo<PanelQuery | null>(() => (query ? { query, tmnlId } : null), [query, tmnlId]);
    const rsltQuery = useMemo<RsltQuery | null>(() => (query ? { query, tmnlId, category } : null), [query, tmnlId, category]);

    const panelBase = useFetched(
        panelQuery,
        ({ query: dashboardQuery, tmnlId: terminal }) => {
            const { smltId, hhmm } = dashboardQuery;

            return Promise.all([
                dashboardService.getTmnlSmry(smltId, terminal, hhmm, SMRY_ITVL_MIN).then((dto) => unwrap(dto, PANEL_FAIL)),
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
        const token = panelBase.token + hourlyResults.token;
        if (!panelBase.data || !hourlyResults.data) return { data: null, error, token };

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
            token,
        };
    }, [panelBase, hourlyResults]);
}
