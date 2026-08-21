import './userSmlt.css';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { unwrap } from '@/api/pm/result';
import { Lnb } from '@/components/lnb';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import { dialog } from '@/lib/dialog';
import { todayYmd } from '@/lib/format';
import type { ApiError } from '@/types/api.types';
import { BgDeco } from './components/BgDeco';
import { SmltGnb } from './components/SmltGnb';
import { SmltTabs } from './components/SmltTabs';
import { TerminalIntro } from './components/TerminalIntro';
import { useSmltInfo } from './hooks/useSmltInfo';
import { CheckinCounterTab } from './tabs/checkinCounter/CheckinCounterTab';
import { DepartureTab } from './tabs/departure/DepartureTab';
import { FlightPaxTab } from './tabs/flightPax/FlightPaxTab';
import { NO_TERMINAL, enabledTerminals, otherTerminal, type SmltTabKey, type SmltTabProps, type TerminalEnabled, type TerminalKind } from './types';

const TITLE = 'PM 예측관리 / 사용자 시뮬레이션';
const VIEW_TITLE = 'PM 예측관리 / 사용자 시뮬레이션 설정 조건 조회';

const EXEC_FAIL = '시뮬레이션 실행에 실패했습니다.';
const EXEC_CONFIRM = '시뮬레이션을 실행하시겠습니까?';
const MONITORING_PATH = '/rui/pm/smlt-monitoring';

interface TabContentProps extends SmltTabProps {
    tab: SmltTabKey;
}

function viewEnabled(tmnlId: TerminalKind | null): TerminalEnabled {
    if (!tmnlId) return { T1: true, T2: true };

    return { T1: tmnlId === 'T1', T2: tmnlId === 'T2' };
}

function UserSmltConfig() {
    usePageScope('userSmlt');
    const navigate = useNavigate();

    const [params] = useSearchParams();
    const readOnly = params.get('mode') === 'view';
    const viewSmltId = params.get('smltId') ?? '';
    const viewTmnlId = params.get('tmnlId') as TerminalKind | null;

    const [ymd, setYmd] = useState(() => params.get('ymd') || todayYmd());
    const [reloadKey, setReloadKey] = useState(0);
    const {
        smltIds: editSmltIds,
        ymd: baseYmd,
        error,
        token,
    } = useSmltInfo(readOnly ? '' : ymd, reloadKey);

    /** 조회 전용이면 넘어온 smltId 로 대신 채운다 — 터미널이 지정돼 있으면 그쪽만 */
    const smltIds = useMemo(() => {
        if (!readOnly) return editSmltIds;

        return {
            T1: !viewTmnlId || viewTmnlId === 'T1' ? viewSmltId : '',
            T2: !viewTmnlId || viewTmnlId === 'T2' ? viewSmltId : '',
        };
    }, [readOnly, editSmltIds, viewTmnlId, viewSmltId]);

    const [activeTab, setActiveTab] = useState<SmltTabKey>('flightPax');
    /** 시뮬레이션 대상으로 켜 둔 터미널 — 둘 다 꺼져 있으면 도입 화면 */
    const [enabled, setEnabled] = useState<TerminalEnabled>(() => (readOnly ? viewEnabled(viewTmnlId) : NO_TERMINAL));
    /** 화면에 하나뿐인 편집 도크·드로어가 보는 터미널 */
    const [focusTerminal, setFocusTerminal] = useState<TerminalKind>(viewTmnlId ?? 'T1');

    useErrorAlert(error, token);

    const targets = enabledTerminals(enabled);
    const picked = targets.length > 0;

    const handleSearch = () => setReloadKey((key) => key + 1);

    /** 도입 화면에서 고른 터미널로 진입 — 왼쪽(T1 우선) 패널이 첫 편집 초점이 된다 */
    const handleStart = (next: TerminalEnabled) => {
        setEnabled(next);
        setFocusTerminal(enabledTerminals(next)[0]);
    };

    const handleToggleTerminal = (terminal: TerminalKind) => {
        const next = { ...enabled, [terminal]: !enabled[terminal] };
        if (!next.T1 && !next.T2) return;

        setEnabled(next);
        setFocusTerminal(next[terminal] ? terminal : otherTerminal(terminal));
    };

    /** 켜 둔 터미널을 모두 수행한다 (T1 만 켰으면 T1 만) — 확인 후 수행하고, 성공하면 모니터링 화면으로 이동한다 */
    const handleRun = () => {
        const runnable = targets.filter((terminal) => smltIds[terminal]);
        if (runnable.length === 0) return;

        dialog
            .confirm({ title: '시뮬레이션 실행', description: EXEC_CONFIRM })
            .then((confirmed) => {
                if (!confirmed) return;

                Promise.all(runnable.map((terminal) => userSmltService.execute(smltIds[terminal], terminal).then((dto) => unwrap(dto, EXEC_FAIL))))
                    .then(() => navigate(MONITORING_PATH))
                    .catch((err: ApiError) => {
                        dialog.alert({ title: '실행 실패', description: err?.message || EXEC_FAIL }).catch(() => {});
                    });
            })
            .catch(() => {});
    };

    return (
        <>
            {/* <BgDeco /> */}

            <SmltGnb
                title={readOnly ? VIEW_TITLE : TITLE}
                ymd={baseYmd || ymd}
                steps={picked ? <SmltTabs activeTab={activeTab} onTabChange={setActiveTab} /> : undefined}
                onBack={readOnly ? () => navigate(-1) : undefined}
                onDateChange={readOnly ? undefined : setYmd}
                onSearch={readOnly ? undefined : handleSearch}
                onRun={picked && !readOnly ? handleRun : undefined}
                onHistory={picked && !readOnly ? () => navigate(MONITORING_PATH) : undefined}
            />

            <div className="body">
                <Lnb />

                <main className="content">
                    {picked ? (
                        <div className="panels">
                            <TabContent
                                tab={activeTab}
                                smltIds={smltIds}
                                reloadKey={reloadKey}
                                enabled={enabled}
                                onToggleTerminal={handleToggleTerminal}
                                focusTerminal={focusTerminal}
                                onFocusChange={setFocusTerminal}
                                readOnly={readOnly}
                            />
                        </div>
                    ) : (
                        <TerminalIntro ymd={baseYmd || ymd} onStart={handleStart} />
                    )}
                </main>
            </div>
        </>
    );
}

/** 활성 탭의 T1/T2 패널(+ 상세 드로어)을 그린다 — 탭 3개가 같은 props 를 받는다. */
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
