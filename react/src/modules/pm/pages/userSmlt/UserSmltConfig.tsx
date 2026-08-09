import './userSmlt.css';
import { useState } from 'react';
import { Lnb } from '@/components/lnb';
import { usePageScope } from '@/hooks/usePageScope';
import { BgDeco } from './components/BgDeco';
import { SmltGnb } from './components/SmltGnb';
import { SmltTabs } from './components/SmltTabs';
import { TerminalIntro } from './components/TerminalIntro';
import { HEADER } from './mock';
import { CheckinCounterTab } from './tabs/checkinCounter/CheckinCounterTab';
import { DepartureTab } from './tabs/departure/DepartureTab';
import { FlightPaxTab } from './tabs/flightPax/FlightPaxTab';
import { type SmltTabKey, type TerminalKind } from './types';

interface TabContentProps {
    tab: SmltTabKey;
    activeTerminal: TerminalKind;
    onTerminalChange: (terminal: TerminalKind) => void;
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

/**
 * 사용자 시뮬레이션 — 조건 설정 화면.
 */
function UserSmltConfig() {
    usePageScope('userSmlt');

    const [activeTab, setActiveTab] = useState<SmltTabKey>(HEADER.defaultTab);
    const [activeTerminal, setActiveTerminal] = useState<TerminalKind>(HEADER.defaultTerminal);
    const [terminalPicked, setTerminalPicked] = useState(false);

    const handleSearch = () => {
        console.log('[조회]', { baseDate: HEADER.baseDate, tab: activeTab });
    };

    const handleRun = () => {
        console.log('[시뮬레이션 실행]', {
            baseDate: HEADER.baseDate,
            tab: activeTab,
            terminal: activeTerminal,
        });
    };

    return (
        <>
            <BgDeco />

            <SmltGnb
                title={HEADER.title}
                baseDate={HEADER.baseDate}
                onSearch={handleSearch}
                onRun={terminalPicked ? handleRun : undefined}
            />

            <div className="body">
                {/* 이 화면에는 하단 보기 선택(요약/맵…)에 해당하는 항목이 없다 */}
                <Lnb bottomItems={[]} />

                <main className="content">
                    {terminalPicked ? (
                        <>
                            <SmltTabs activeTab={activeTab} onTabChange={setActiveTab} />

                            <div className="panels">
                                <TabContent
                                    tab={activeTab}
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

export default UserSmltConfig;
