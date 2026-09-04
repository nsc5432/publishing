import './terminalMap.css';
import { useEffect, useState } from 'react';
import { Lnb } from '@/components/lnb';
import { useBaseInfo } from '@/hooks/useBaseInfo';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import { formatYmd, todayYmd } from '@/lib/format';
import { useTimeline } from '@/modules/pm/hooks/useTimeline';
import { CongestionNotice } from './components/CongestionNotice';
import { FacilityMiniModal } from './components/FacilityMiniModal';
import { Header } from './components/Header';
import { IslandModal } from './components/IslandModal';
import { MapStage } from './components/MapStage';
import { OperCards } from './components/OperCards';
import { Timeline } from './components/Timeline';
import { useSmltMap, type MapQuery } from './hooks/useTerminalMapData';
import { EMPTY_MAP_SLOT, EMPTY_SUMMARY } from './view';
import { TIMELINE_RANGE } from './timeline';
import type { DepGateMarker, IslandMarker, TerminalKind } from './types';

function TerminalMap() {
    usePageScope('terminalMap');

    const [ymd] = useState(todayYmd);
    const { data: baseInfo, error: baseError, token: baseToken } = useBaseInfo(ymd);

    const [terminal, setTerminal] = useState<TerminalKind>('T1');
    const [selectedIsland, setSelectedIsland] = useState<IslandMarker | null>(null);
    const [selectedDepGate, setSelectedDepGate] = useState<DepGateMarker | null>(null);
    const timeline = useTimeline(TIMELINE_RANGE);

    const [query, setQuery] = useState<MapQuery | null>(null);

    useEffect(() => {
        if (!baseInfo) return;

        setQuery({ smltId: baseInfo.smltId, tmnlId: terminal });
    }, [baseInfo, terminal]);

    const { data: mapDay, error: mapError, token: mapToken } = useSmltMap(query);

    const error = baseError || mapError;

    useErrorAlert(error, baseToken + mapToken);

    const slot = mapDay?.slots[timeline.hhmm] ?? EMPTY_MAP_SLOT;
    const islandDetail = selectedIsland ? slot.islandDetails[selectedIsland.label] : null;
    const dptgtGateDetail = selectedDepGate ? slot.dptgtGateDetails[selectedDepGate.label] : null;

    const handleIslandClick = (island: IslandMarker) => {
        setSelectedDepGate(null);
        setSelectedIsland(island);
    };

    const handleDepGateClick = (dptgtGate: DepGateMarker) => {
        setSelectedIsland(null);
        setSelectedDepGate(dptgtGate);
    };

    const handleTerminalChange = (nextTerminal: TerminalKind) => {
        setTerminal(nextTerminal);
        setSelectedIsland(null);
        setSelectedDepGate(null);
    };

    const handleSearch = () => {
        if (!baseInfo) return;

        setQuery({ smltId: baseInfo.smltId, tmnlId: terminal });
    };

    return (
        <div className="wrap">
            <Header
                baseDate={formatYmd(baseInfo?.ymd ?? '')}
                terminal={terminal}
                onTerminalChange={handleTerminalChange}
                summary={mapDay?.summary ?? EMPTY_SUMMARY}
                onSearch={handleSearch}
            />

            <div className="body">
                <Lnb />

                <main className="container">
                    <CongestionNotice level={slot.notice.level} items={slot.notice.items} />

                    <section className="map-area">
                        <p className="map-area__guide">해당구역을 클릭하세요</p>

                        <OperCards cards={mapDay?.operCards ?? []} />

                        <MapStage
                            terminal={terminal}
                            data={slot.map}
                            activeMarkerId={selectedIsland?.id ?? selectedDepGate?.id}
                            onIslandClick={handleIslandClick}
                            onDepGateClick={handleDepGateClick}
                        />

                        <Timeline timeline={timeline} />
                    </section>
                </main>
            </div>

            {islandDetail && <IslandModal detail={islandDetail} onClose={() => setSelectedIsland(null)} />}

            {dptgtGateDetail && <FacilityMiniModal detail={dptgtGateDetail} onClose={() => setSelectedDepGate(null)} />}
        </div>
    );
}

export default TerminalMap;
