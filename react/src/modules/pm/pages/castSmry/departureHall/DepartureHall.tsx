import './departureHall.css';
import { useEffect, useState } from 'react';
import { Terminal1Icon, Terminal2Plan } from '@/components/icons';
import { Lnb } from '@/components/lnb';
import { useBaseInfo } from '@/hooks/useBaseInfo';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import { dialog } from '@/lib/dialog';
import { todayYmd } from '@/lib/format';
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

    const [ymd, setYmd] = useState(todayYmd);
    const [draftYmd, setDraftYmd] = useState(ymd);
    const { data: baseInfo, error: baseError, responseSeq: baseResponseSeq } = useBaseInfo(ymd);

    const [terminal, setTerminal] = useState<TerminalKind>('T1');
    const [view, setView] = useState<ViewMode>('map');
    const [activeDepGate, setActiveDepGate] = useState<DepGateMarker | null>(null);
    const timeline = useTimeline(TIMELINE_RANGE);

    const [query, setQuery] = useState<DepHallQuery | null>(null);

    useEffect(() => {
        setQuery(baseInfo ? { smltId: baseInfo.smltId, tmnlId: terminal } : null);
    }, [baseInfo, terminal]);

    const { data: dptgtDay, error: depHallError, responseSeq: depHallResponseSeq } = useDepHall(query);

    const error = baseError || depHallError;

    useErrorAlert(error, baseResponseSeq + depHallResponseSeq);

    const slot = dptgtDay?.slots[timeline.hhmm] ?? EMPTY_DEP_SLOT;
    const FloorPlan = terminal === 'T1' ? Terminal1Icon : Terminal2Plan;

    const handleTerminalChange = (nextTerminal: TerminalKind) => {
        setTerminal(nextTerminal);
        setActiveDepGate(null);
    };

    const handleSearch = () => {
        if (draftYmd.length !== 8) {
            dialog.alert({ title: '조회 조건 확인', description: '기준일자를 선택하세요.' }).catch(() => {});
            return;
        }

        if (draftYmd !== ymd) {
            setYmd(draftYmd);
            setActiveDepGate(null);
            return;
        }

        if (baseInfo) setQuery({ smltId: baseInfo.smltId, tmnlId: terminal });
    };

    return (
        <div className="wrap">
            <Header baseYmd={draftYmd} terminal={terminal} onDateChange={setDraftYmd} onTerminalChange={handleTerminalChange} onSearch={handleSearch} />

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
