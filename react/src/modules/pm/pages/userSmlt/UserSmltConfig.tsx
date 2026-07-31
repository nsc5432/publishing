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
import { SecurityTab } from './tabs/security/SecurityTab';
import { SelfCheckinTab } from './tabs/selfCheckin/SelfCheckinTab';
import { type SmltTabKey, type TerminalKind } from './types';

interface TabContentProps {
    tab: SmltTabKey;
    activeTerminal: TerminalKind;
    onTerminalChange: (terminal: TerminalKind) => void;
}

/** 활성 탭의 T1/T2 패널을 그린다 — 탭 5개가 같은 props 를 받는다. */
function TabContent({ tab, ...props }: TabContentProps) {
    switch (tab) {
        case 'flightPax':
            return <FlightPaxTab {...props} />;
        case 'checkinCounter':
            return <CheckinCounterTab {...props} />;
        case 'selfCheckin':
            return <SelfCheckinTab {...props} />;
        case 'departure':
            return <DepartureTab {...props} />;
        case 'security':
            return <SecurityTab {...props} />;
    }
}

/**
 * PM 예측관리 / 사용자 시뮬레이션 — 조건 설정 화면.
 * html/<화면>/index.html + script.js 를 컴포넌트로 이식한 컨테이너.
 *
 * - 5개 탭이 GNB / 탭바 / T1·T2 2패널 셸을 공유하므로 셸은 여기서 한 번만 그린다.
 * - 활성 터미널(편집 대상)은 셸이 소유하며 탭이 바뀌어도 유지된다.
 * - 진입 시에는 어느 터미널로 시뮬레이션할지 고르는 도입 화면을 먼저 보여준다.
 */
function UserSmltConfig() {
    // userSmlt.css 를 이 화면에서만 적용시킨다 (hooks/usePageScope 참고)
    usePageScope('userSmlt');

    const [activeTab, setActiveTab] = useState<SmltTabKey>(HEADER.defaultTab);
    const [activeTerminal, setActiveTerminal] = useState<TerminalKind>(HEADER.defaultTerminal);
    // 도입 화면에서 터미널을 고르면 설정 화면(탭바 + 2패널)으로 넘어간다
    const [terminalPicked, setTerminalPicked] = useState(false);

    const handleSearch = () => {
        // 실제 조회 연동 전: 현재 조회 조건만 확인한다.
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
