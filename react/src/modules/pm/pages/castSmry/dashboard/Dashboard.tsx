import './dashboard.css';
import { useEffect, useMemo, useState } from 'react';
import { useMatch, useNavigate, useSearchParams } from 'react-router-dom';
import { Lnb } from '@/components/lnb';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import type { DsbdCategory, SmltType } from '@/types/api.types';
import { FcltQueueScenarioModal } from './components/FcltQueueScenarioModal';
import { HeaderSummary } from './components/HeaderSummary';
import { TerminalSummary } from './components/TerminalSummary';
import { Topbar } from './components/Topbar';
import { defaultTime, todayYmd } from '@/lib/format';
import { useBaseInfo } from '@/hooks/useBaseInfo';
import { loadingBar } from '@/lib/loading-bar';
import { toCalcDateTime, toPlanDate, toSimulationType } from './view';
import {
    useDayOverview,
    usePrimeTime,
    useTerminalPanel,
    type DashboardQuery,
    type PrimeTimeQuery,
} from './hooks/useDashboardData';
import { useExecDetail } from './hooks/useExecDetail';
import type { FcltCardType, FcltQueueTarget, TerminalKind } from './types';

type PrimeTimeRequest = Pick<PrimeTimeQuery, 'ymd' | 'category'>;

type TerminalQueries = Record<TerminalKind, DashboardQuery>;

interface ActivePrime {
    category: DsbdCategory;
    times: Record<TerminalKind, string>;
}

const USER_SMLT_CONFIG_PATH = '/rui/pm/user-smlt/config';

const TERMINAL_MAP_PATH = '/rui/pm/daily-smlt/terminalMap';

const FCLT_DETAIL_PATH: Record<FcltCardType, string> = {
    CHKN: '/rui/pm/daily-smlt/checkinCounter',
    DEP: '/rui/pm/daily-smlt/departureHall',
};

const DEFAULT_CATEGORY: DsbdCategory = 'PSG';

function Dashboard() {
    usePageScope('dashboard');
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();
    const targetSmltId = searchParams.get('smltId') ?? '';
    const userSmltRoute = useMatch('/rui/pm/user-smlt/dashboard');
    const targetSmltType: SmltType =
        userSmltRoute || searchParams.get('smltType') === 'USER' ? 'USER' : 'DAILY';

    const [ymd, setYmd] = useState(() => searchParams.get('ymd') || todayYmd());
    const [draftYmd, setDraftYmd] = useState(ymd);
    const {
        data: baseInfo,
        error: baseError,
        responseSeq: baseResponseSeq,
        isCurrent: isBaseInfoCurrent,
    } = useBaseInfo(ymd, targetSmltId, targetSmltType);

    const simulationType = toSimulationType(targetSmltType);
    const isUserSmlt = simulationType === 'user';

    const { data: execDetail } = useExecDetail(isUserSmlt ? targetSmltId : '');

    const [query, setQuery] = useState<DashboardQuery | null>(null);
    const [terminalQueries, setTerminalQueries] = useState<TerminalQueries | null>(null);
    const [category, setCategory] = useState<DsbdCategory>(DEFAULT_CATEGORY);
    const [activePrime, setActivePrime] = useState<ActivePrime | null>(null);
    const [primeRequest, setPrimeRequest] = useState<PrimeTimeRequest | null>(null);
    const [primeStartSeq, setPrimeStartSeq] = useState(0);
    const [fcltQueueTarget, setFcltQueueTarget] = useState<FcltQueueTarget | null>(null);

    useEffect(() => {
        setFcltQueueTarget(null);
    }, [query, terminalQueries]);

    useEffect(() => {
        if (!baseInfo || !isBaseInfoCurrent) return;

        const baseQuery = { smltId: baseInfo.smltId, ymd: baseInfo.ymd, hhmm: defaultTime(baseInfo.avlTimes) };
        setQuery(baseQuery);
        setTerminalQueries({ T1: baseQuery, T2: baseQuery });
    }, [baseInfo, isBaseInfoCurrent]);

    const primeQuery = useMemo<PrimeTimeQuery | null>(() => {
        if (
            !primeRequest ||
            !baseInfo ||
            !isBaseInfoCurrent ||
            (isUserSmlt ? baseInfo.ymd : ymd) !== primeRequest.ymd
        ) return null;

        return { ...primeRequest, smltId: baseInfo.smltId, ymd: baseInfo.ymd };
    }, [primeRequest, baseInfo, isBaseInfoCurrent, isUserSmlt, ymd]);
    const {
        data: primeTime,
        error: primeError,
        responseSeq: primeResponseSeq,
    } = usePrimeTime(primeQuery);
    // useFetched 는 새 조회 중에도 이전 실패를 들고 있어 응답 순번으로 이번 요청의 실패만 가린다
    const isPrimeFailed = !!primeError && primeResponseSeq !== primeStartSeq;
    const isPrimeLoading = primeRequest !== null && !isPrimeFailed;

    useEffect(() => {
        if (!isPrimeLoading) return;

        loadingBar.start();
        // 바로 이어지는 재조회가 로딩바를 이어받은 뒤에 끈다. 먼저 끄면 로딩바가 처음부터 다시 찬다
        return () => {
            setTimeout(() => loadingBar.done());
        };
    }, [isPrimeLoading]);

    useEffect(() => {
        if (!primeTime || primeTime.query !== primeQuery) return;

        const { smltId, ymd, category: primeCategory } = primeTime.query;
        const { times } = primeTime;
        // 피크를 못 구한 터미널은 보던 시각을 유지한다
        setTerminalQueries((prev) => ({
            T1: { smltId, ymd, hhmm: times.T1 || prev?.T1.hhmm || times.T2 },
            T2: { smltId, ymd, hhmm: times.T2 || prev?.T2.hhmm || times.T1 },
        }));
        setCategory(primeCategory);
        setActivePrime({ category: primeCategory, times });
        setPrimeRequest(null);
    }, [primeTime, primeQuery]);

    const { data: dayOverview, error: dayOverviewError, responseSeq: dayOverviewResponseSeq } = useDayOverview(query);
    const { data: terminal1View, error: t1Error, responseSeq: t1ResponseSeq } = useTerminalPanel(terminalQueries?.T1 ?? null, 'T1', category);
    const { data: terminal2View, error: t2Error, responseSeq: t2ResponseSeq } = useTerminalPanel(terminalQueries?.T2 ?? null, 'T2', category);

    const error = baseError || primeError || dayOverviewError || t1Error || t2Error;

    useErrorAlert(
        error,
        baseResponseSeq + primeResponseSeq + dayOverviewResponseSeq + t1ResponseSeq + t2ResponseSeq,
    );

    const primeCategoryOf = (tmnlId: TerminalKind) =>
        activePrime && terminalQueries?.[tmnlId].hhmm === activePrime.times[tmnlId] ? activePrime.category : null;

    const handleDateChange = (nextYmd: string) => {
        if (nextYmd.length !== 8) return;

        setDraftYmd(nextYmd);
        setPrimeRequest(null);
    };

    const handleSearch = () => {
        setPrimeRequest(null);

        if (draftYmd !== ymd) {
            setYmd(draftYmd);
            setSearchParams({}, { replace: true });
            setActivePrime(null);
            return;
        }

        if (!baseInfo || !isBaseInfoCurrent || !query || !terminalQueries) return;

        // 터미널별 시각은 그대로 두고 새 객체로 바꿔 다시 조회한다
        setQuery({ ...query });
        setTerminalQueries({ T1: { ...terminalQueries.T1 }, T2: { ...terminalQueries.T2 } });
        setActivePrime(null);
    };

    const handleCategoryChange = (nextCategory: DsbdCategory) => {
        if (isUserSmlt && !isBaseInfoCurrent) return;

        const primeYmd = isUserSmlt ? baseInfo?.ymd : draftYmd;
        if (!primeYmd) return;

        setPrimeRequest({ ymd: primeYmd, category: nextCategory });
        setPrimeStartSeq(primeResponseSeq);
        setActivePrime(null);

        if (!isUserSmlt && primeYmd !== ymd) {
            setYmd(primeYmd);
            setSearchParams({}, { replace: true });
        }
    };

    const handleViewConfig = () => {
        const configParams = new URLSearchParams({
            mode: 'view',
            smltId: targetSmltId,
            ymd: query?.ymd ?? ymd,
        });

        navigate(`${USER_SMLT_CONFIG_PATH}?${configParams.toString()}`);
    };

    const handleTerminalTimeChange = (tmnlId: TerminalKind) => (hhmm: string) => {
        setPrimeRequest(null);
        setTerminalQueries((prev) =>
            !prev || prev[tmnlId].hhmm === hhmm ? prev : { ...prev, [tmnlId]: { ...prev[tmnlId], hhmm } },
        );
    };

    const handleFcltDetail = (tmnlId: TerminalKind) => (fcltType: FcltCardType, unitCd: string) => {
        const terminalQuery = terminalQueries?.[tmnlId];
        if (!terminalQuery) return;

        setFcltQueueTarget({ ...terminalQuery, tmnlId, fcltType, unitCd });
    };

    const handleFcltMove = (tmnlId: TerminalKind) => (fcltType: FcltCardType) => {
        const detailParams = new URLSearchParams({ tmnlId });
        const terminalQuery = terminalQueries?.[tmnlId];

        if (terminalQuery) {
            detailParams.set('ymd', terminalQuery.ymd);
            detailParams.set('hhmm', terminalQuery.hhmm);
        }

        navigate(`${FCLT_DETAIL_PATH[fcltType]}?${detailParams.toString()}`);
    };

    const handleMapMove = () => navigate(TERMINAL_MAP_PATH);

    const executor = execDetail ? { dept: execDetail.deptNm, name: execDetail.userNm } : undefined;

    return (
        <>
            <Topbar
                simulationType={simulationType}
                baseYmd={isUserSmlt ? (baseInfo?.ymd ?? draftYmd) : draftYmd}
                lastCalc={toCalcDateTime(baseInfo?.lastCalcDt)}
                nextCalc={toCalcDateTime(baseInfo?.nextCalcDt)}
                executor={executor}
                onViewConfig={handleViewConfig}
                onDateChange={handleDateChange}
                onSearch={handleSearch}
            />
            <Lnb />

            <div className="app">
                <HeaderSummary
                    planDate={toPlanDate(query?.ymd)}
                    dayOverview={dayOverview}
                    activePrimeCategory={primeCategoryOf('T1') ?? primeCategoryOf('T2')}
                    onCategoryChange={handleCategoryChange}
                >
                    <section className="row row--panels">
                        <TerminalSummary terminal="T1" data={terminal1View} hhmm={terminalQueries?.T1.hhmm ?? ''} category={category} titleCategory={primeCategoryOf('T1')} onTimeChange={handleTerminalTimeChange('T1')} onFcltDetail={handleFcltDetail('T1')} onFcltMove={handleFcltMove('T1')} onMapMove={handleMapMove} />
                        <TerminalSummary terminal="T2" data={terminal2View} hhmm={terminalQueries?.T2.hhmm ?? ''} category={category} titleCategory={primeCategoryOf('T2')} onTimeChange={handleTerminalTimeChange('T2')} onFcltDetail={handleFcltDetail('T2')} onFcltMove={handleFcltMove('T2')} onMapMove={handleMapMove} />
                    </section>
                </HeaderSummary>
            </div>

            {fcltQueueTarget && <FcltQueueScenarioModal target={fcltQueueTarget} onClose={() => setFcltQueueTarget(null)} />}
        </>
    );
}

export default Dashboard;
