import './departureHall.css';
import { useState } from 'react';
// 도면 배경은 맵형태보기와 같은 파일이다 (T1: terminal1-icon / T2: terminal2-plan)
import { Terminal1Icon, Terminal2Plan } from '@/components/icons';
import { Lnb } from '@/components/lnb';
import { usePageScope } from '@/hooks/usePageScope';
import { CongestionNotice } from './components/CongestionNotice';
import { DepChartView } from './components/DepChartView';
import { DepMapView } from './components/DepMapView';
import { DepTableView } from './components/DepTableView';
import { Header } from './components/Header';
import { Timeline } from './components/Timeline';
import { ViewSwitch } from './components/ViewSwitch';
import { useTimeline } from './hooks/useTimeline';
import { DEFAULT_NAV_BOTTOM, HEADER, NOTICES, TERMINAL_MAP, TRENDS } from './mock';
import type { DepGateMarker, TerminalKind, ViewMode } from './types';

/**
 * PM 예측관리 / 일일 시뮬레이션 결과 조회 — 출국장.
 *
 * 맵 · 표 · 차트 세 보기가 같은 조회 조건(기준일자 · 터미널 · 타임라인 시각)을 공유한다.
 * 보기를 바꿔도 조건이 유지되므로 전환은 표시 방식만 바꾼다.
 */
function DepartureHall() {
    usePageScope('departureHall');

    const [terminal, setTerminal] = useState<TerminalKind>(HEADER.defaultTerminal);
    const [view, setView] = useState<ViewMode>('map');
    const [activeDepGate, setActiveDepGate] = useState<DepGateMarker | null>(null);
    const timeline = useTimeline();

    const mapData = TERMINAL_MAP[terminal];
    const MapPlan = terminal === 'T1' ? Terminal1Icon : Terminal2Plan;

    const handleTerminalChange = (kind: TerminalKind) => {
        setTerminal(kind);
        setActiveDepGate(null);
    };

    const handleSearch = () => {
        // 실제 조회 연동 전: 현재 조회 조건만 확인한다.
        console.log('[조회]', { baseDate: HEADER.baseDate, terminal, hhmm: timeline.hhmm });
    };

    return (
        <div className="wrap">
            <Header
                baseDate={HEADER.baseDate}
                terminal={terminal}
                onTerminalChange={handleTerminalChange}
                onSearch={handleSearch}
            />

            <div className="body">
                <Lnb defaultBottom={DEFAULT_NAV_BOTTOM} />

                <main className="container">
                    <CongestionNotice
                        level={NOTICES[terminal].level}
                        items={NOTICES[terminal].items}
                    />

                    <section className={`dep-view dep-view--${view}`}>
                        {/* 도면 배경은 맵 보기에서만 드러난다 */}
                        {view === 'map' && (
                            <MapPlan
                                className="dep-view__bg"
                                preserveAspectRatio="none"
                                aria-hidden="true"
                                focusable="false"
                            />
                        )}

                        <ViewSwitch view={view} onChange={setView} />

                        <div className="dep-view__body">
                            {view === 'map' && (
                                <DepMapView
                                    data={mapData}
                                    activeId={activeDepGate?.id}
                                    onDepGateHover={setActiveDepGate}
                                />
                            )}

                            {view === 'table' && (
                                <DepTableView cards={mapData.cards} time={timeline.label} />
                            )}

                            {view === 'chart' && (
                                <DepChartView
                                    trend={TRENDS[terminal]}
                                    step={timeline.step}
                                    time={timeline.label}
                                />
                            )}
                        </div>

                        <Timeline timeline={timeline} />
                    </section>
                </main>
            </div>
        </div>
    );
}

export default DepartureHall;
