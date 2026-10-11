import './userSmlt.css';
import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { unwrap } from '@/api/pm/result';
import { Lnb } from '@/components/lnb';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import { dialog } from '@/lib/dialog';
import { todayYmd } from '@/lib/format';
import type { ApiError, UserSmltExecReq } from '@/types/api.types';
import { SmltGnb } from './components/SmltGnb';
import { SmltTabs } from './components/SmltTabs';
import { TerminalIntro } from './components/TerminalIntro';
import { useSmltInfo } from './hooks/useSmltInfo';
import { CheckinCounterTab } from './tabs/checkinCounter/CheckinCounterTab';
import { DepartureTab } from './tabs/departure/DepartureTab';
import { FlightPaxTab } from './tabs/flightPax/FlightPaxTab';
import { NO_TERMINAL, enabledTerminals, otherTerminal, type SmltTabKey, type SmltTabProps, type TerminalEnabled, type TerminalKind } from './types';

const MONITORING_PATH = '/rui/pm/smlt-monitoring';

interface TabContentProps extends SmltTabProps {
    tab: SmltTabKey;
}

function UserSmltConfig() {
    usePageScope('userSmlt');
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const readOnly = searchParams.get('mode') === 'view';
    const viewSmltId = searchParams.get('smltId') ?? '';
    const viewTmnlId = searchParams.get('tmnlId') as TerminalKind | null;

    const [ymd, setYmd] = useState(() => searchParams.get('ymd') || todayYmd());
    const [reloadKey, setReloadKey] = useState(0);
    const [infoVersion, setInfoVersion] = useState(0);
    const { saveDt, error, token } = useSmltInfo(readOnly ? '' : ymd, reloadKey + infoVersion);

    const query = { ymd, smltId: readOnly ? viewSmltId : undefined };
    const collectors = useRef<Partial<Record<SmltTabKey, () => Partial<UserSmltExecReq>>>>({});
    const [busy, setBusy] = useState(false);
    const running = useRef(false);
    const [visited, setVisited] = useState<SmltTabKey[]>(['flightPax']);
    const registerDraft = (tab: SmltTabKey, collect: () => Partial<UserSmltExecReq>) => {
        collectors.current[tab] = collect;
    };
    const [activeTab, setActiveTab] = useState<SmltTabKey>('flightPax');
    const [enabled, setEnabled] = useState<TerminalEnabled>(() => (readOnly ? { T1: true, T2: true } : NO_TERMINAL));
    const [focusTerminal, setFocusTerminal] = useState<TerminalKind>(viewTmnlId ?? 'T1');

    useErrorAlert(error, token);

    const targets = enabledTerminals(enabled);
    const picked = targets.length > 0;

    const beginRequest = () => {
        if (running.current) return false;
        running.current = true;
        setBusy(true);
        return true;
    };
    const endRequest = (saved = false) => {
        if (saved) setInfoVersion((version) => version + 1);
        running.current = false;
        setBusy(false);
    };

    const handleSearch = () => {
        if (running.current) return;
        collectors.current = {};
        setReloadKey((key) => key + 1);
    };
    const handleDateChange = (value: string) => {
        if (running.current) return;
        collectors.current = {};
        setYmd(value);
    };
    const handleTabChange = (tab: SmltTabKey) => {
        setVisited((tabs) => (tabs.includes(tab) ? tabs : [...tabs, tab]));
        setActiveTab(tab);
    };

    const handleStart = (nextEnabled: TerminalEnabled) => {
        setEnabled(nextEnabled);
        setFocusTerminal(enabledTerminals(nextEnabled)[0]);
    };

    const handleToggleTerminal = (terminal: TerminalKind) => {
        const nextEnabled = { ...enabled, [terminal]: !enabled[terminal] };
        if (!nextEnabled.T1 && !nextEnabled.T2) return;

        setEnabled(nextEnabled);
        setFocusTerminal(nextEnabled[terminal] ? terminal : otherTerminal(terminal));
    };

    const handleRun = async () => {
        if (!beginRequest()) return;
        try {
            const confirmed = await dialog.confirm({
                title: '시뮬레이션 실행',
                description: '변경한 조건을 저장하고 T1·T2 전체 시뮬레이션을 실행하시겠습니까?',
            });
            if (!confirmed) return;
            const request: UserSmltExecReq = { ymd, fltPsgList: [], chknList: [], depList: [] };
            Object.values(collectors.current).forEach((collect) => Object.assign(request, collect()));
            const result = unwrap(await userSmltService.execute(request), '시뮬레이션 실행에 실패했습니다.');
            collectors.current = {};
            navigate(MONITORING_PATH, { state: { smltId: result.smltId } });
        } catch (error) {
            await dialog.alert({ title: '실행 실패', description: (error as ApiError)?.message || '시뮬레이션 실행에 실패했습니다.' });
        } finally {
            endRequest();
        }
    };

    return (
        <>
            <SmltGnb
                title={readOnly ? 'PM 예측관리 / 사용자 시뮬레이션 설정 조건 조회' : 'PM 예측관리 / 사용자 시뮬레이션'}
                ymd={ymd}
                steps={picked ? <SmltTabs activeTab={activeTab} onTabChange={handleTabChange} /> : undefined}
                onBack={readOnly ? () => navigate(-1) : undefined}
                onDateChange={readOnly ? undefined : handleDateChange}
                onSearch={readOnly ? undefined : handleSearch}
                onRun={picked && !readOnly ? handleRun : undefined}
                busy={busy}
                saveDt={saveDt}
                onHistory={picked && !readOnly ? () => navigate(MONITORING_PATH) : undefined}
            />

            <div className="body">
                <Lnb />

                <main className="content">
                    {picked ? (
                        <div className="panels">
                            {visited.map((tab) => (
                                <fieldset
                                    hidden={tab !== activeTab}
                                    disabled={busy}
                                    key={tab + ymd + reloadKey + viewSmltId}
                                    style={{ display: tab === activeTab ? 'contents' : 'none' }}
                                >
                                    <TabContent
                                        tab={tab}
                                        query={query}
                                        reloadKey={reloadKey}
                                        enabled={enabled}
                                        onToggleTerminal={handleToggleTerminal}
                                        focusTerminal={focusTerminal}
                                        onFocusChange={setFocusTerminal}
                                        readOnly={readOnly}
                                        busy={busy}
                                        beginRequest={beginRequest}
                                        endRequest={endRequest}
                                        onDraftChange={registerDraft}
                                    />
                                </fieldset>
                            ))}
                        </div>
                    ) : (
                        <TerminalIntro ymd={ymd} onStart={handleStart} />
                    )}
                </main>
            </div>
        </>
    );
}

function TabContent({ tab, ...props }: TabContentProps) {
    switch (tab) {
        case 'flightPax':
            return <FlightPaxTab {...props} />;
        case 'checkinCounter':
            return <CheckinCounterTab {...props} />;
        case 'departure':
            return <DepartureTab {...props} />;
    }
}

export default UserSmltConfig;
