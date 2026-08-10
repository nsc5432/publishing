import { useEffect, useMemo, useState } from 'react';
import { dashboardService } from '@/api/pm/services/dashboard.service';
import { unwrap } from '@/api/pm/result';
import type {
    ApiError,
    DsbdCategory,
    DsbdFcltCardDto,
    DsbdHeaderDto,
    DsbdRsltDto,
    TmnlSmryDto,
} from '@/types/api.types';
import type { TerminalKind, TerminalView } from '../types';
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

/** 실패해도 화면 골격은 남기고 사유만 올려보낸다 */
interface Fetched<T> {
    data: T | null;
    error: string;
}

const EMPTY = { data: null, error: '' };

const message = (err: ApiError, fallback: string) => err?.message || fallback;

/* ================= 상단 카드 ================= */

const HEADER_FAIL = '상단 요약 정보를 불러오지 못했습니다.';

export function useDashboardHeader(query: DashboardQuery | null): Fetched<DsbdHeaderDto> {
    const [state, setState] = useState<Fetched<DsbdHeaderDto>>(EMPTY);

    useEffect(() => {
        if (!query) return;

        let alive = true;

        dashboardService
            .getHeader(query.ymd, query.hhmm)
            .then((dto) => unwrap(dto, HEADER_FAIL))
            .then((dto) => {
                if (alive) setState({ data: dto, error: '' });
            })
            .catch((err: ApiError) => {
                if (alive) setState({ data: null, error: message(err, HEADER_FAIL) });
            });

        return () => {
            alive = false;
        };
    }, [query]);

    return state;
}

/* ================= 터미널 패널 ================= */

const PANEL_FAIL = '터미널 요약 정보를 불러오지 못했습니다.';
const RSLT_FAIL = '시간대별 결과를 불러오지 못했습니다.';

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
    const [base, setBase] = useState<Fetched<PanelBase>>(EMPTY);
    const [rslt, setRslt] = useState<Fetched<DsbdRsltDto[]>>(EMPTY);

    useEffect(() => {
        if (!query) return;

        let alive = true;
        const { smltId, hhmm } = query;

        Promise.all([
            dashboardService.getTmnlSmry(smltId, tmnlId, hhmm).then((dto) => unwrap(dto, PANEL_FAIL)),
            dashboardService.getFcltCardList(smltId, tmnlId, hhmm, 'CHKN'),
            dashboardService.getFcltCardList(smltId, tmnlId, hhmm, 'DEP'),
        ])
            .then(([smry, chknCards, depCards]) => {
                if (alive) setBase({ data: { query, smry, chknCards, depCards }, error: '' });
            })
            .catch((err: ApiError) => {
                if (alive) setBase({ data: null, error: message(err, PANEL_FAIL) });
            });

        return () => {
            alive = false;
        };
    }, [query, tmnlId]);

    useEffect(() => {
        if (!query) return;

        let alive = true;

        dashboardService
            .getTmnlRsltByTime(query.smltId, tmnlId, category)
            .then((list) => {
                if (alive) setRslt({ data: list, error: '' });
            })
            .catch((err: ApiError) => {
                if (alive) setRslt({ data: null, error: message(err, RSLT_FAIL) });
            });

        return () => {
            alive = false;
        };
    }, [query, tmnlId, category]);

    return useMemo(() => {
        const error = base.error || rslt.error;
        if (!base.data || !rslt.data) return { data: null, error };

        return {
            data: toTerminalView({
                ymd: base.data.query.ymd,
                hhmm: base.data.query.hhmm,
                smry: base.data.smry,
                rsltList: rslt.data,
                chknCards: base.data.chknCards,
                depCards: base.data.depCards,
            }),
            error,
        };
    }, [base, rslt]);
}
