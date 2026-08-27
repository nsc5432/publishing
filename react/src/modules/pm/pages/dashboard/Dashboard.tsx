import './dashboard.css';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lnb } from '@/components/lnb';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import type { DsbdCategory, SmltType, TmnlId } from '@/types/api.types';
import { HeaderSummary } from './components/HeaderSummary';
import { TerminalSummary } from './components/TerminalSummary';
import { Topbar } from './components/Topbar';
import { defaultTime, formatDateTime, formatYmd, todayYmd } from '@/lib/format';
import { useBaseInfo } from '@/hooks/useBaseInfo';
import { toSimulationType } from './view';
import { useDashboardHeader, useTerminalPanel, type DashboardQuery } from './hooks/useDashboardData';
import { useExecDetail } from './hooks/useExecDetail';
import { useFitToScreen } from './hooks/useFitToScreen';

const USER_SMLT_CONFIG_PATH = '/rui/pm/user-smlt/config';

const DEFAULT_CATEGORY: DsbdCategory = 'PSG';

function Dashboard() {
    usePageScope('dashboard');
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();
    const targetSmltId = searchParams.get('smltId') ?? '';
    const targetSmltType = (searchParams.get('smltType') as SmltType | null) ?? null;
    const targetTmnlId = (searchParams.get('tmnlId') as TmnlId | null) ?? null;

    const [ymd, setYmd] = useState(() => searchParams.get('ymd') || todayYmd());
    const [draftYmd, setDraftYmd] = useState(ymd);
    const { data: baseInfo, error: baseError, token: baseToken } = useBaseInfo(ymd, targetSmltId);

    const simulationType = toSimulationType(targetSmltType ?? baseInfo?.smltType ?? 'DAILY');
    const isUserSmlt = simulationType === 'user';

    const { data: execDetail } = useExecDetail(isUserSmlt ? targetSmltId : '');

    const [draftTime, setDraftTime] = useState('');
    const [query, setQuery] = useState<DashboardQuery | null>(null);
    const [category, setCategory] = useState<DsbdCategory>(DEFAULT_CATEGORY);
    const [primeCategory, setPrimeCategory] = useState<DsbdCategory | null>(DEFAULT_CATEGORY);

    useEffect(() => {
        if (!baseInfo) return;

        const hhmm = defaultTime(baseInfo.avlTimes);
        setDraftTime(hhmm);
        setQuery({ smltId: baseInfo.smltId, ymd: baseInfo.ymd, hhmm });
    }, [baseInfo]);

    const { data: header, error: headerError, token: headerToken } = useDashboardHeader(query);
    const { data: terminal1View, error: t1Error, token: t1Token } = useTerminalPanel(query, 'T1', category);
    const { data: terminal2View, error: t2Error, token: t2Token } = useTerminalPanel(query, 'T2', category);

    const error = baseError || headerError || t1Error || t2Error;

    useErrorAlert(error, baseToken + headerToken + t1Token + t2Token);

    useFitToScreen();

    const hour = draftTime.slice(0, 2);
    const minute = draftTime.slice(2, 4);

    const handleDateChange = (nextYmd: string) => {
        if (nextYmd.length !== 8) return;

        setDraftYmd(nextYmd);
    };

    const handleSearch = () => {
        if (draftYmd !== ymd) {
            setYmd(draftYmd);
            setSearchParams({}, { replace: true });
            setPrimeCategory(null);
            return;
        }

        if (!baseInfo || !draftTime) return;

        setQuery({ smltId: baseInfo.smltId, ymd: baseInfo.ymd, hhmm: draftTime });
        setPrimeCategory(null);
    };

    const handleCategoryChange = (nextCategory: DsbdCategory) => {
        setCategory(nextCategory);
        setPrimeCategory(nextCategory);
    };

    const handleViewConfig = () => {
        const configParams = new URLSearchParams({
            mode: 'view',
            smltId: targetSmltId,
            ymd: baseInfo?.ymd || ymd,
        });

        const tmnlId = targetTmnlId ?? execDetail?.tmnlId;
        if (tmnlId) configParams.set('tmnlId', tmnlId);

        navigate(`${USER_SMLT_CONFIG_PATH}?${configParams.toString()}`);
    };

    const executor = execDetail ? { dept: execDetail.deptNm, name: execDetail.userNm } : undefined;

    return (
        <>
            <Topbar
                simulationType={simulationType}
                baseYmd={draftYmd}
                hour={hour}
                minute={minute}
                lastCalc={formatDateTime(baseInfo?.lastCalcDt ?? '')}
                nextCalc={formatDateTime(baseInfo?.nextCalcDt ?? '')}
                executor={executor}
                onViewConfig={isUserSmlt && targetSmltId ? handleViewConfig : undefined}
                onDateChange={handleDateChange}
                onHourChange={(nextHour) => setDraftTime(nextHour + (minute || '00'))}
                onMinuteChange={(nextMinute) => setDraftTime((hour || '00') + nextMinute)}
                onSearch={handleSearch}
            />
            <Lnb />

            <div className="app">
                <HeaderSummary
                    planDate={formatYmd(header?.ymd ?? baseInfo?.ymd ?? '', '-')}
                    header={header}
                    category={category}
                    onCategoryChange={handleCategoryChange}
                >
                    <section className="row row--panels">
                        <TerminalSummary terminal="T1" data={terminal1View} titleCategory={primeCategory} />
                        <TerminalSummary terminal="T2" data={terminal2View} titleCategory={primeCategory} />
                    </section>
                </HeaderSummary>
            </div>
        </>
    );
}

export default Dashboard;
