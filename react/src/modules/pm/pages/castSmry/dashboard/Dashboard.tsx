import './dashboard.css';
import { useEffect, useMemo, useRef, useState } from 'react';
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

const USER_SMLT_CONFIG_PATH = '/rui/pm/user-smlt/config';

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

    const [draftTime, setDraftTime] = useState('');
    const [query, setQuery] = useState<DashboardQuery | null>(null);
    const [category, setCategory] = useState<DsbdCategory>(DEFAULT_CATEGORY);
    const [activePrimeCategory, setActivePrimeCategory] = useState<DsbdCategory | null>(null);
    const [primeRequest, setPrimeRequest] = useState<PrimeTimeRequest | null>(null);
    const [fcltQueueTarget, setFcltQueueTarget] = useState<FcltQueueTarget | null>(null);
    const timeOverrideRef = useRef<string | null>(null);

    useEffect(() => {
        setFcltQueueTarget(null);
    }, [query]);

    useEffect(() => {
        if (!baseInfo || !isBaseInfoCurrent) return;

        const hhmm = timeOverrideRef.current ?? defaultTime(baseInfo.avlTimes);
        timeOverrideRef.current = null;
        setDraftTime(hhmm);
        setQuery({ smltId: baseInfo.smltId, ymd: baseInfo.ymd, hhmm });
    }, [baseInfo, isBaseInfoCurrent]);

    const primeQuery = useMemo<PrimeTimeQuery | null>(() => {
        if (
            !primeRequest ||
            !baseInfo ||
            !isBaseInfoCurrent ||
            baseInfo.ymd !== primeRequest.ymd
        ) return null;

        return { ...primeRequest, smltId: baseInfo.smltId };
    }, [primeRequest, baseInfo, isBaseInfoCurrent]);
    const {
        data: primeTime,
        error: primeError,
        responseSeq: primeResponseSeq,
    } = usePrimeTime(primeQuery);

    useEffect(() => {
        if (!primeTime || primeTime.query !== primeQuery) return;

        const { smltId, ymd, category: primeCategory } = primeTime.query;
        setDraftTime(primeTime.hhmm);
        setQuery({ smltId, ymd, hhmm: primeTime.hhmm });
        setCategory(primeCategory);
        setActivePrimeCategory(primeCategory);
        setPrimeRequest(null);
    }, [primeTime, primeQuery]);

    const { data: dayOverview, error: dayOverviewError, responseSeq: dayOverviewResponseSeq } = useDayOverview(query);
    const { data: terminal1View, error: t1Error, responseSeq: t1ResponseSeq } = useTerminalPanel(query, 'T1', category);
    const { data: terminal2View, error: t2Error, responseSeq: t2ResponseSeq } = useTerminalPanel(query, 'T2', category);

    const error = baseError || primeError || dayOverviewError || t1Error || t2Error;

    useErrorAlert(
        error,
        baseResponseSeq + primeResponseSeq + dayOverviewResponseSeq + t1ResponseSeq + t2ResponseSeq,
    );

    const hour = draftTime.slice(0, 2);
    const minute = draftTime.slice(2, 4);

    const handleDateChange = (nextYmd: string) => {
        if (nextYmd.length !== 8) return;

        setDraftYmd(nextYmd);
        setPrimeRequest(null);
    };

    const handleSearch = () => {
        setPrimeRequest(null);

        if (draftYmd !== ymd) {
            timeOverrideRef.current = null;
            setYmd(draftYmd);
            setSearchParams({}, { replace: true });
            setActivePrimeCategory(null);
            return;
        }

        if (!baseInfo || !isBaseInfoCurrent || !draftTime) return;

        setQuery({ smltId: baseInfo.smltId, ymd: baseInfo.ymd, hhmm: draftTime });
        setActivePrimeCategory(null);
    };

    const handleCategoryChange = (nextCategory: DsbdCategory) => {
        if (isUserSmlt && !isBaseInfoCurrent) return;

        const primeYmd = isUserSmlt ? baseInfo?.ymd : draftYmd;
        if (!primeYmd) return;

        timeOverrideRef.current = null;
        setPrimeRequest({ ymd: primeYmd, category: nextCategory });
        setActivePrimeCategory(null);

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

    const handleFcltDetail = (tmnlId: TerminalKind) => (fcltType: FcltCardType, unitCd: string) => {
        if (!query) return;

        setFcltQueueTarget({ ...query, tmnlId, fcltType, unitCd });
    };

    const executor = execDetail ? { dept: execDetail.deptNm, name: execDetail.userNm } : undefined;

    return (
        <>
            <Topbar
                simulationType={simulationType}
                baseYmd={isUserSmlt ? (baseInfo?.ymd ?? draftYmd) : draftYmd}
                hour={hour}
                minute={minute}
                lastCalc={toCalcDateTime(baseInfo?.lastCalcDt)}
                nextCalc={toCalcDateTime(baseInfo?.nextCalcDt)}
                executor={executor}
                onViewConfig={handleViewConfig}
                onDateChange={handleDateChange}
                onHourChange={(nextHour) => {
                    setPrimeRequest(null);
                    const hhmm = nextHour + (minute || '00');
                    timeOverrideRef.current = hhmm;
                    setDraftTime(hhmm);
                }}
                onMinuteChange={(nextMinute) => {
                    setPrimeRequest(null);
                    const hhmm = (hour || '00') + nextMinute;
                    timeOverrideRef.current = hhmm;
                    setDraftTime(hhmm);
                }}
                onSearch={handleSearch}
            />
            <Lnb />

            <div className="app">
                <HeaderSummary
                    planDate={toPlanDate(query?.ymd)}
                    dayOverview={dayOverview}
                    activePrimeCategory={activePrimeCategory}
                    onCategoryChange={handleCategoryChange}
                >
                    <section className="row row--panels">
                        <TerminalSummary terminal="T1" data={terminal1View} titleCategory={activePrimeCategory} onFcltDetail={handleFcltDetail('T1')} />
                        <TerminalSummary terminal="T2" data={terminal2View} titleCategory={activePrimeCategory} onFcltDetail={handleFcltDetail('T2')} />
                    </section>
                </HeaderSummary>
            </div>

            {fcltQueueTarget && <FcltQueueScenarioModal target={fcltQueueTarget} onClose={() => setFcltQueueTarget(null)} />}
        </>
    );
}

export default Dashboard;
