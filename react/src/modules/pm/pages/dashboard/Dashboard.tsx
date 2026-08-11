import './dashboard.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Lnb } from '@/components/lnb';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import type { DsbdCategory } from '@/types/api.types';
import { HeaderSummary } from './components/HeaderSummary';
import { TerminalSummary } from './components/TerminalSummary';
import { Topbar } from './components/Topbar';
import {
    defaultTime,
    formatDateTime,
    formatYmd,
    resolveTime,
    toHourOptions,
    toMinuteOptions,
    todayYmd,
} from '@/lib/format';
import { useBaseInfo } from '@/hooks/useBaseInfo';
import { toSimulationType } from './view';
import {
    useDashboardHeader,
    useTerminalPanel,
    type DashboardQuery,
} from './hooks/useDashboardData';
import { useFitToScreen } from './hooks/useFitToScreen';

/** 최초 활성 네비 (하단 그룹) */
const DEFAULT_NAV_BOTTOM = 'summary';

/**
 * PM 예측관리 / 일일 시뮬레이션 결과 조회 — 메인 대시보드.
 *
 * 화면에 들어오면 기준 정보(getBaseInfo)를 먼저 부르고, 거기서 받은
 * 시뮬레이션 ID·기준 시각으로 상단 카드와 두 터미널 패널을 조회한다.
 */
function Dashboard() {
    usePageScope('dashboard');

    // 기준일자 — 최초 진입은 오늘. (달력 UI 가 붙으면 여기서 바꾼다)
    const [ymd] = useState(todayYmd);
    const { data: baseInfo, error: baseError } = useBaseInfo(ymd);

    // 상단 바에서 고르는 중인 시각 (아직 조회하지 않은 값)
    const [draftTime, setDraftTime] = useState('');
    // 조회 버튼으로 확정된 조건 — 실제 데이터 조회는 이 값만 따른다
    const [query, setQuery] = useState<DashboardQuery | null>(null);
    const [category, setCategory] = useState<DsbdCategory>('PSG');

    // 기준 정보를 받으면 가장 늦은 시각으로 첫 조회까지 끝낸다.
    useEffect(() => {
        if (!baseInfo) return;

        const hhmm = defaultTime(baseInfo.avlTimes);
        setDraftTime(hhmm);
        setQuery({ smltId: baseInfo.smltId, ymd: baseInfo.ymd, hhmm });
    }, [baseInfo]);

    const { data: header, error: headerError } = useDashboardHeader(query);
    const { data: terminal1View, error: t1Error } = useTerminalPanel(query, 'T1', category);
    const { data: terminal2View, error: t2Error } = useTerminalPanel(query, 'T2', category);

    // 조회가 여러 갈래라 먼저 걸린 사유 하나만 알린다 (같은 실패로 알럿이 겹치지 않게).
    const error = baseError || headerError || t1Error || t2Error;

    useErrorAlert(error);

    useFitToScreen();

    const avlTimes = useMemo(() => baseInfo?.avlTimes ?? [], [baseInfo]);
    const hour = draftTime.slice(0, 2);
    const minute = draftTime.slice(2, 4);

    const handleSearch = useCallback(() => {
        if (!baseInfo || !draftTime) return;

        setQuery({ smltId: baseInfo.smltId, ymd: baseInfo.ymd, hhmm: draftTime });
    }, [baseInfo, draftTime]);

    return (
        <>
            <Topbar
                simulationType={toSimulationType(baseInfo?.smltType ?? 'DAILY')}
                baseDate={formatYmd(baseInfo?.ymd ?? '')}
                hour={hour}
                minute={minute}
                hourOptions={toHourOptions(avlTimes)}
                minuteOptions={toMinuteOptions(avlTimes, hour)}
                lastCalc={formatDateTime(baseInfo?.lastCalcDt ?? '')}
                nextCalc={formatDateTime(baseInfo?.nextCalcDt ?? '')}
                onHourChange={(nextHour) => setDraftTime(resolveTime(avlTimes, nextHour, minute))}
                onMinuteChange={(nextMinute) =>
                    setDraftTime(resolveTime(avlTimes, hour, nextMinute))
                }
                onSearch={handleSearch}
            />
            <Lnb defaultBottom={DEFAULT_NAV_BOTTOM} />

            <div className="app">
                <HeaderSummary
                    planDate={formatYmd(header?.ymd ?? baseInfo?.ymd ?? '', '-')}
                    header={header}
                    category={category}
                    onCategoryChange={setCategory}
                >
                    <section className="row row--panels">
                        <TerminalSummary terminal="T1" data={terminal1View} category={category} />
                        <TerminalSummary terminal="T2" data={terminal2View} category={category} />
                    </section>
                </HeaderSummary>
            </div>
        </>
    );
}

export default Dashboard;
