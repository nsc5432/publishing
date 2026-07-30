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
 * index.html 을 컴포넌트로 이식한 컨테이너.
 *
 * - 화면 공용 상태(simulationType, 기준일자/시각 등)를 소유하고 Props 로 전달.
 * - fit-to-screen 로직으로 1920x1080 기준을 뷰포트에 맞춰 축소/확대.
 */
function Dashboard() {
    // dashboard.css 를 이 화면에서만 적용시킨다 (hooks/usePageScope 참고)
    usePageScope('dashboard');

    // 일일 시뮬레이션 / 사용자 시뮬레이션 버전 뱃지 표시값
    const [simulationType] = useState<SimulationType>(HEADER.defaultSimulation);

    // 1920x1080 기준을 뷰포트에 맞춰 축소/확대 (fit-to-screen)
    useFitToScreen();

    return (
        <>
            {/* 상단 바와 LNB 는 전 화면 공용 크롬이라 .app 의 축소(transform) 밖에 둔다.
                안에 두면 다른 화면보다 헤더·레일이 작게 보인다. 배치는 dashboard.css 참고. */}
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
