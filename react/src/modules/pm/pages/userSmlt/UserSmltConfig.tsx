import './userSmlt.css';
import { useState } from 'react';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { unwrap } from '@/api/pm/result';
import { Lnb } from '@/components/lnb';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import { dialog } from '@/lib/dialog';
import { formatYmd, todayYmd } from '@/lib/format';
import type { ApiError } from '@/types/api.types';
import { BgDeco } from './components/BgDeco';
import { SmltGnb } from './components/SmltGnb';
import { SmltTabs } from './components/SmltTabs';
import { TerminalIntro } from './components/TerminalIntro';
import { useSmltInfo } from './hooks/useSmltInfo';
import { CheckinCounterTab } from './tabs/checkinCounter/CheckinCounterTab';
import { DepartureTab } from './tabs/departure/DepartureTab';
import { FlightPaxTab } from './tabs/flightPax/FlightPaxTab';
import {
    NO_TERMINAL,
    enabledTerminals,
    otherTerminal,
    type SmltTabKey,
    type SmltTabProps,
    type TerminalEnabled,
    type TerminalKind,
} from './types';

/** 화면 타이틀 (GNB) */
const TITLE = 'PM 예측관리 / 사용자 시뮬레이션';

const EXEC_FAIL = '시뮬레이션 실행에 실패했습니다.';

interface TabContentProps extends SmltTabProps {
    tab: SmltTabKey;
}

/**
 * 사용자 시뮬레이션 — 조건 설정 화면.
 *
 * 진입 정보(getInfo)로 터미널별 편집 대상 시뮬레이션 ID 를 받고,
 * 탭마다 그 ID 로 조건을 조회·저장한다. 실행은 저장된 조건으로 수행을 건다.
 *
 * 시뮬레이션 대상 터미널은 1개일 수도 2개일 수도 있다. 도입 화면에서 고르지만
 * 설정 도중에도 패널 스위치로 켜고 끌 수 있어, 이 화면이 그 상태(enabled)를 쥐고 있다.
 */
function UserSmltConfig() {
    usePageScope('userSmlt');

    // 기준일자 — 최초 진입은 오늘. (달력 UI 가 붙으면 여기서 바꾼다)
    const [ymd] = useState(todayYmd);
    const [reloadKey, setReloadKey] = useState(0);
    const { smltIds, ymd: baseYmd, error } = useSmltInfo(ymd, reloadKey);

    const [activeTab, setActiveTab] = useState<SmltTabKey>('flightPax');
    /** 시뮬레이션 대상으로 켜 둔 터미널 — 둘 다 꺼져 있으면 도입 화면 */
    const [enabled, setEnabled] = useState<TerminalEnabled>(NO_TERMINAL);
    /** 화면에 하나뿐인 편집 도크·드로어가 보는 터미널 */
    const [focusTerminal, setFocusTerminal] = useState<TerminalKind>('T1');

    useErrorAlert(error);

    const targets = enabledTerminals(enabled);
    const picked = targets.length > 0;

    const handleSearch = () => setReloadKey((key) => key + 1);

    /** 도입 화면에서 고른 터미널로 진입 — 왼쪽(T1 우선) 패널이 첫 편집 초점이 된다 */
    const handleStart = (next: TerminalEnabled) => {
        setEnabled(next);
        setFocusTerminal(enabledTerminals(next)[0]);
    };

    /**
     * 패널 스위치 — 켜면 그 패널로 초점이 옮겨 가고, 끄면 초점을 반대편에 넘긴다.
     * 둘 다 끄면 설정할 대상이 없어지므로 마지막 1개는 끄지 않는다.
     */
    const handleToggleTerminal = (terminal: TerminalKind) => {
        const next = { ...enabled, [terminal]: !enabled[terminal] };
        if (!next.T1 && !next.T2) return;

        setEnabled(next);
        setFocusTerminal(next[terminal] ? terminal : otherTerminal(terminal));
    };

    /** 켜 둔 터미널을 모두 수행한다 (T1 만 켰으면 T1 만) */
    const handleRun = () => {
        const runnable = targets.filter((terminal) => smltIds[terminal]);
        if (runnable.length === 0) return;

        Promise.all(
            runnable.map((terminal) =>
                userSmltService
                    .execute(smltIds[terminal], terminal)
                    .then((dto) => unwrap(dto, EXEC_FAIL))
                    .then((execResult) => `${terminal} 수행번호 ${execResult.execSn}`),
            ),
        )
            .then((lines) => {
                dialog
                    .alert({
                        title: '시뮬레이션 실행',
                        description: `수행을 시작했습니다. (${lines.join(' · ')})`,
                    })
                    .catch(() => {});
            })
            .catch((err: ApiError) => {
                dialog
                    .alert({ title: '실행 실패', description: err?.message || EXEC_FAIL })
                    .catch(() => {});
            });
    };

    return (
        <>
            <BgDeco />

            <SmltGnb
                title={TITLE}
                baseDate={formatYmd(baseYmd || ymd)}
                steps={
                    picked ? (
                        <SmltTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    ) : undefined
                }
                onSearch={handleSearch}
                onRun={picked ? handleRun : undefined}
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
                            />
                        </div>
                    ) : (
                        <TerminalIntro onStart={handleStart} />
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
