import './userSmlt.css';
import { useState } from 'react';
import { BgDeco } from './components/BgDeco';
import { SmltGnb } from './components/SmltGnb';
import { SmltTabs } from './components/SmltTabs';
import { HEADER } from './mock';
import { FlightPaxTab } from './tabs/flightPax/FlightPaxTab';
import { SMLT_TAB_LABEL, type SmltTabKey, type TerminalKind } from './types';

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

            <main className="content">
                <SmltTabs activeTab={activeTab} onTabChange={setActiveTab} />

                <div className="panels">
                    {activeTab === 'flightPax' ? (
                        <FlightPaxTab
                            activeTerminal={activeTerminal}
                            onTerminalChange={setActiveTerminal}
                        />
                    ) : (
                        <div className="tab-placeholder">
                            {SMLT_TAB_LABEL[activeTab]} 화면은 준비 중입니다.
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}

export default UserSmltConfig;
