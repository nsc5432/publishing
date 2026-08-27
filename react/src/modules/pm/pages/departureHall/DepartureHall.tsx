import './departureHall.css';
import { useEffect, useState } from 'react';
import { Terminal1Icon, Terminal2Plan } from '@/components/icons';
import { Lnb } from '@/components/lnb';
import { useBaseInfo } from '@/hooks/useBaseInfo';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import { formatYmd, todayYmd } from '@/lib/format';
import { useTimeline } from '@/modules/pm/hooks/useTimeline';
import { CongestionNotice } from './components/CongestionNotice';
import { DepChartView } from './components/DepChartView';
import { DepMapView } from './components/DepMapView';
import { DepTableView } from './components/DepTableView';
import { Header } from './components/Header';
import { Timeline } from './components/Timeline';
import { ViewSwitch } from './components/ViewSwitch';
import { useDepHall, type DepHallQuery } from './hooks/useDepHallData';
import { EMPTY_DEP_SLOT, EMPTY_TREND } from './view';
import { TIMELINE_RANGE } from './timeline';
import type { DepGateMarker, TerminalKind, ViewMode } from './types';

function DepartureHall() {
    usePageScope('departureHall');

    const [ymd] = useState(todayYmd);
    const { data: baseInfo, error: baseError, token: baseToken } = useBaseInfo(ymd);

    const [terminal, setTerminal] = useState<TerminalKind>('T1');
    const [view, setView] = useState<ViewMode>('map');
    const [activeDepGate, setActiveDepGate] = useState<DepGateMarker | null>(null);
    const timeline = useTimeline(TIMELINE_RANGE);

    const [query, setQuery] = useState<DepHallQuery | null>(null);

    useEffect(() => {
        if (baseInfo) setQuery({ smltId: baseInfo.smltId, tmnlId: terminal });
    }, [baseInfo, terminal]);

    const { data: dptgtDay, error: depHallError, token: depHallToken } = useDepHall(query);

    const error = baseError || depHallError;

    useErrorAlert(error, baseToken + depHallToken);

    const slot = dptgtDay?.slots[timeline.hhmm] ?? EMPTY_DEP_SLOT;
    const FloorPlan = terminal === 'T1' ? Terminal1Icon : Terminal2Plan;

    const handleTerminalChange = (nextTerminal: TerminalKind) => {
        setTerminal(nextTerminal);
        setActiveDepGate(null);
    };

    const handleSearch = () => {
        if (baseInfo) setQuery({ smltId: baseInfo.smltId, tmnlId: terminal });
    };

    return (
        <div className="wrap">
            <Header baseDate={formatYmd(baseInfo?.ymd ?? '')} terminal={terminal} onTerminalChange={handleTerminalChange} onSearch={handleSearch} />

            <div className="body">
                <Lnb />

                <main className="container">
                    <CongestionNotice level={slot.notice.level} items={slot.notice.items} />

                    <section className={`dep-view dep-view--${view}`}>
                        {view === 'map' && <FloorPlan className="dep-view__bg" preserveAspectRatio="none" aria-hidden="true" focusable="false" />}

                        <ViewSwitch view={view} onChange={setView} />

                        <div className="dep-view__body">
                            {view === 'map' && <DepMapView data={slot.map} activeId={activeDepGate?.id} onDepGateHover={setActiveDepGate} />}

                            {view === 'table' && <DepTableView cards={slot.map.cards} time={timeline.label} />}

                            {view === 'chart' && <DepChartView trend={dptgtDay?.trend ?? EMPTY_TREND} step={timeline.step} time={timeline.label} />}
                        </div>

                        <Timeline timeline={timeline} />
                    </section>
                </main>
            </div>
        </div>
    );
}

export default DepartureHall;
