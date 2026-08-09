import './dashboard.css';
import { useState } from 'react';
import { Lnb } from '@/components/lnb';
import { usePageScope } from '@/hooks/usePageScope';
import { HeaderSummary } from './components/HeaderSummary';
import { TerminalSummary } from './components/TerminalSummary';
import { Topbar } from './components/Topbar';
import { useFitToScreen } from './hooks/useFitToScreen';
import { DEFAULT_NAV_BOTTOM, HEADER } from './mock';
import type { SimulationType } from './types';

/**
 * PM 예측관리 / 일일 시뮬레이션 결과 조회 — 메인 대시보드.
 */
function Dashboard() {
    usePageScope('dashboard');

    const [simulationType] = useState<SimulationType>(HEADER.defaultSimulation);

    useFitToScreen();

    return (
        <>
            <Topbar
                simulationType={simulationType}
                baseDate={HEADER.baseDate}
                hour={HEADER.defaultHour}
                minute={HEADER.defaultMinute}
                lastCalc={HEADER.lastCalc}
                nextCalc={HEADER.nextCalc}
            />
            <Lnb defaultBottom={DEFAULT_NAV_BOTTOM} />

            <div className="app">
                <HeaderSummary planDate={HEADER.planDate}>
                    <section className="row row--panels">
                        {/* 제1터미널 = 왼쪽 / 제2터미널 = 오른쪽 */}
                        <TerminalSummary terminal="T1" />
                        <TerminalSummary terminal="T2" />
                    </section>
                </HeaderSummary>
            </div>
        </>
    );
}

export default Dashboard;
