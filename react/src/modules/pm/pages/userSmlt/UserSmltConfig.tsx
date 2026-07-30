import './userSmlt.css';
import { useState } from 'react';
import { Lnb } from '@/components/lnb';
import { BgDeco } from './components/BgDeco';
import { SmltGnb } from './components/SmltGnb';
import { SmltTabs } from './components/SmltTabs';
import { DEFAULT_NAV_BOTTOM, DEFAULT_NAV_TOP, HEADER } from './mock';
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
 */
function UserSmltConfig() {
    const [activeTab, setActiveTab] = useState<SmltTabKey>(HEADER.defaultTab);
    const [activeTerminal, setActiveTerminal] = useState<TerminalKind>(HEADER.defaultTerminal);

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
                onRun={handleRun}
            />

            <div className="body">
                <Lnb defaultTop={DEFAULT_NAV_TOP} defaultBottom={DEFAULT_NAV_BOTTOM} />

                <main className="content">
                    <SmltTabs activeTab={activeTab} onTabChange={setActiveTab} />

                    <div className="panels">
                        <TabContent
                            tab={activeTab}
                            activeTerminal={activeTerminal}
                            onTerminalChange={setActiveTerminal}
                        />
                    </div>
                </main>
            </div>
        </>
    );
}

export default UserSmltConfig;
