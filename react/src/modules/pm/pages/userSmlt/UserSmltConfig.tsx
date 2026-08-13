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
import { type SmltTabKey, type TerminalKind } from './types';

/** 화면 타이틀 (GNB) */
const TITLE = 'PM 예측관리 / 사용자 시뮬레이션';

const EXEC_FAIL = '시뮬레이션 실행에 실패했습니다.';

interface TabContentProps {
    tab: SmltTabKey;
    smltIds: Record<TerminalKind, string>;
    /** 조회 버튼을 누를 때마다 올라간다 — 같은 조건이라도 다시 부르기 위한 값 */
    reloadKey: number;
    activeTerminal: TerminalKind;
    onTerminalChange: (terminal: TerminalKind) => void;
}

/**
 * 사용자 시뮬레이션 — 조건 설정 화면.
 *
 * 진입 정보(getInfo)로 터미널별 편집 대상 시뮬레이션 ID 를 받고,
 * 탭마다 그 ID 로 조건을 조회·저장한다. 실행은 저장된 조건으로 수행을 건다.
 */
function UserSmltConfig() {
    usePageScope('userSmlt');

    // 기준일자 — 최초 진입은 오늘. (달력 UI 가 붙으면 여기서 바꾼다)
    const [ymd] = useState(todayYmd);
    const [reloadKey, setReloadKey] = useState(0);
    const { smltIds, ymd: baseYmd, error } = useSmltInfo(ymd, reloadKey);

    const [activeTab, setActiveTab] = useState<SmltTabKey>('flightPax');
    const [activeTerminal, setActiveTerminal] = useState<TerminalKind>('T1');
    const [terminalPicked, setTerminalPicked] = useState(false);

    useErrorAlert(error);

    const handleSearch = () => setReloadKey((key) => key + 1);

    const handleRun = () => {
        const smltId = smltIds[activeTerminal];
        if (!smltId) return;

        userSmltService
            .execute(smltId, activeTerminal)
            .then((dto) => unwrap(dto, EXEC_FAIL))
            .then((execResult) => {
                dialog
                    .alert({
                        title: '시뮬레이션 실행',
                        description: `${activeTerminal} 수행을 시작했습니다. (수행번호 ${execResult.execSn})`,
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
                onSearch={handleSearch}
                onRun={terminalPicked ? handleRun : undefined}
            />

            <div className="body">
                {/* 이 화면에는 하단 보기 선택(요약/맵…)에 해당하는 항목이 없다 */}
                <Lnb />

                <main className="content">
                    {terminalPicked ? (
                        <>
                            <SmltTabs activeTab={activeTab} onTabChange={setActiveTab} />

                            <div className="panels">
                                <TabContent
                                    tab={activeTab}
                                    smltIds={smltIds}
                                    reloadKey={reloadKey}
                                    activeTerminal={activeTerminal}
                                    onTerminalChange={setActiveTerminal}
                                />
                            </div>
                        </>
                    ) : (
                        <TerminalIntro
                            onSelect={(terminal) => {
                                setActiveTerminal(terminal);
                                setTerminalPicked(true);
                            }}
                        />
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
