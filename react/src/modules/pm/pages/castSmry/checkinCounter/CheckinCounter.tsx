import './checkinCounter.css';
import { useEffect, useState } from 'react';
import { Lnb } from '@/components/lnb';
import { useBaseInfo } from '@/hooks/useBaseInfo';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import { formatYmd, todayYmd } from '@/lib/format';
import { useTimeline } from '@/modules/pm/hooks/useTimeline';
import { Header } from './components/Header';
import { IslandStrip } from './components/IslandStrip';
import { IslandTable } from './components/IslandTable';
import { QueueChart } from './components/QueueChart';
import { SummaryBar } from './components/SummaryBar';
import { Timeline } from './components/Timeline';
import { ViewSwitch } from './components/ViewSwitch';
import { useChknCounter, type ChknCounterQuery } from './hooks/useChknCounterData';
import { TIMELINE_RANGE } from './timeline';
import type { TerminalKind, ViewMode } from './types';
import { EMPTY_CHKN_SLOT, EMPTY_QUEUE } from './view';

function CheckinCounter() {
    usePageScope('checkinCounter');

    const [ymd] = useState(todayYmd);
    const { data: baseInfo, error: baseError, token: baseToken } = useBaseInfo(ymd);

    const [terminal, setTerminal] = useState<TerminalKind>('T1');
    const [view, setView] = useState<ViewMode>('chart');
    const timeline = useTimeline(TIMELINE_RANGE);

    const [query, setQuery] = useState<ChknCounterQuery | null>(null);

    useEffect(() => {
        if (baseInfo) setQuery({ smltId: baseInfo.smltId, tmnlId: terminal });
    }, [baseInfo, terminal]);

    const { data: chknDay, error: chknError, token: chknToken } = useChknCounter(query);

    const error = baseError || chknError;

    useErrorAlert(error, baseToken + chknToken);

    const slot = chknDay?.slots[timeline.hhmm] ?? EMPTY_CHKN_SLOT;

    const handleSearch = () => {
        if (baseInfo) setQuery({ smltId: baseInfo.smltId, tmnlId: terminal });
    };

    return (
        <div className="wrap">
            <Header baseDate={formatYmd(baseInfo?.ymd ?? '')} terminal={terminal} onTerminalChange={setTerminal} onSearch={handleSearch} />

            <div className="body">
                <Lnb />

                <main className="container">
                    <SummaryBar summary={chknDay?.summary ?? []} kpis={chknDay?.kpis ?? []} notice={slot.notice} />

                    <section className={`chkn-view chkn-view--${view}`}>
                        <ViewSwitch view={view} onChange={setView} />

                        <div className="chkn-view__body">
                            {view === 'chart' ? (
                                <>
                                    <QueueChart queue={chknDay?.queue ?? EMPTY_QUEUE} step={timeline.step} time={timeline.label} />
                                    <IslandStrip islands={slot.islands} time={timeline.label} />
                                </>
                            ) : (
                                <IslandTable islands={slot.islands} time={timeline.label} />
                            )}
                        </div>

                        <Timeline timeline={timeline} />
                    </section>
                </main>
            </div>
        </div>
    );
}

export default CheckinCounter;
