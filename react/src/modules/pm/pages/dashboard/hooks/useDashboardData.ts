import { useMemo } from 'react';
import { dashboardService } from '@/api/pm/services/dashboard.service';
import { unwrap } from '@/api/pm/result';
import { useFetched, type Fetched } from '@/hooks/useFetched';
import type { DsbdCategory, DsbdFcltCardDto, DsbdHeaderDto, TmnlSmryDto } from '@/types/api.types';
import { SMRY_ITVL_MIN, type TerminalKind, type TerminalView } from '../types';
import { toTerminalView } from '../view';

/**
 * 조회 버튼으로 확정된 조회 조건.
 *
 * 상단 바의 시/분 선택은 아직 조회하지 않은 값이라 이 조건과 분리한다.
 * 조회를 누르기 전에 화면이 먼저 바뀌면 지금 보는 숫자가 어느 시각의 것인지 알 수 없다.
 */
export interface DashboardQuery {
    smltId: string;
    ymd: string;
    hhmm: string;
}

/** 조회 시각에 매인 부분 (요약 · 게이트 카드) */
interface PanelBase {
    /**
     * 이 데이터를 받아온 조건.
     * 기준시각 문구는 화면이 들고 있는 최신 조건이 아니라 이 값으로 그려야,
     * 다음 조회 응답을 기다리는 사이에 시각만 먼저 바뀌는 일이 없다.
     */
    query: DashboardQuery;
    smry: TmnlSmryDto;
    chknCards: DsbdFcltCardDto[];
    depCards: DsbdFcltCardDto[];
}

/** 터미널 패널의 조회 조건 — 조건과 터미널이 함께 바뀌어야 다시 부른다 */
interface PanelQuery {
    query: DashboardQuery;
    tmnlId: TerminalKind;
}

/** 시간대별 결과는 퀵 타일(category)까지 조건에 들어간다 */
interface RsltQuery extends PanelQuery {
    category: DsbdCategory;
}

const HEADER_FAIL = '상단 요약 정보를 불러오지 못했습니다.';
const PANEL_FAIL = '터미널 요약 정보를 불러오지 못했습니다.';
const RSLT_FAIL = '시간대별 결과를 불러오지 못했습니다.';

/* ================= 상단 카드 ================= */

export function useDashboardHeader(query: DashboardQuery | null): Fetched<DsbdHeaderDto> {
    return useFetched(
        query,
        ({ ymd, hhmm }) =>
            dashboardService.getHeader(ymd, hhmm).then((dto) => unwrap(dto, HEADER_FAIL)),
        HEADER_FAIL,
    );
}

/* ================= 터미널 패널 ================= */

/**
 * 터미널 패널 1개분.
 *
 * 퀵 타일(category)은 시간대별 결과만 바꾼다. 요약·게이트 카드까지 같이 다시 부르면
 * 타일을 누를 때마다 화면 전체가 깜빡이므로 조회를 두 갈래로 나눠 둔다.
 */
export function useTerminalPanel(
    query: DashboardQuery | null,
    tmnlId: TerminalKind,
    category: DsbdCategory,
): Fetched<TerminalView> {
    const panelQuery = useMemo<PanelQuery | null>(
        () => (query ? { query, tmnlId } : null),
        [query, tmnlId],
    );
    const rsltQuery = useMemo<RsltQuery | null>(
        () => (query ? { query, tmnlId, category } : null),
        [query, tmnlId, category],
    );

    const panelBase = useFetched(
        panelQuery,
        ({ query: dashboardQuery, tmnlId: terminal }) => {
            const { smltId, hhmm } = dashboardQuery;

            return Promise.all([
                dashboardService
                    .getTmnlSmry(smltId, terminal, hhmm, SMRY_ITVL_MIN)
                    .then((dto) => unwrap(dto, PANEL_FAIL)),
                dashboardService.getFcltCardList(smltId, terminal, hhmm, 'CHKN'),
                dashboardService.getFcltCardList(smltId, terminal, hhmm, 'DEP'),
            ]).then(([smry, chknCards, depCards]): PanelBase => ({
                query: dashboardQuery,
                smry,
                chknCards,
                depCards,
            }));
        },
        PANEL_FAIL,
    );

    const hourlyResults = useFetched(
        rsltQuery,
        ({ query: dashboardQuery, tmnlId: terminal, category: quickTile }) =>
            dashboardService.getTmnlRsltByTime(dashboardQuery.smltId, terminal, quickTile),
        RSLT_FAIL,
    );

    return useMemo(() => {
        const error = panelBase.error || hourlyResults.error;
        if (!panelBase.data || !hourlyResults.data) return { data: null, error };

        return {
            data: toTerminalView({
                ymd: panelBase.data.query.ymd,
                hhmm: panelBase.data.query.hhmm,
                smry: panelBase.data.smry,
                rsltList: hourlyResults.data,
                chknCards: panelBase.data.chknCards,
                depCards: panelBase.data.depCards,
            }),
            error,
        };
    }, [panelBase, hourlyResults]);
}
