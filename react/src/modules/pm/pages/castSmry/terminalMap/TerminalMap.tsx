import './terminalMap.css';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lnb } from '@/components/lnb';
import { useBaseInfo } from '@/hooks/useBaseInfo';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import { dialog } from '@/lib/dialog';
import { todayYmd } from '@/lib/format';
import { useSmltScope, type SmltView } from '@/modules/pm/hooks/useSmltScope';
import { useTimeline } from '@/modules/pm/hooks/useTimeline';
import { CongestionNotice } from './components/CongestionNotice';
import { DptgtModal } from './components/DptgtModal';
import { Header } from './components/Header';
import { IslandModal } from './components/IslandModal';
import { MapStage } from './components/MapStage';
import { OperCards } from './components/OperCards';
import { Timeline } from '@/modules/pm/components/Timeline';
import { useSmltMap, type MapQuery } from './hooks/useTerminalMapData';
import { EMPTY_MAP_SLOT } from './view';
import { TIMELINE_RANGE } from './timeline';
import type { DepGateMarker, IslandMarker, TerminalKind } from './types';

function TerminalMap() {
    usePageScope('terminalMap');
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { smltId, smltType, isUserSmlt, pathOf } = useSmltScope();

    const [ymd, setYmd] = useState(() => searchParams.get('ymd') || todayYmd());
    const [draftYmd, setDraftYmd] = useState(ymd);
    const { data: baseInfo, error: baseError, responseSeq: baseResponseSeq } = useBaseInfo(ymd, smltId, smltType);
    const viewYmd = isUserSmlt ? (baseInfo?.ymd ?? ymd) : ymd;

    const [terminal, setTerminal] = useState<TerminalKind>(() =>
        searchParams.get('tmnlId') === 'T2' ? 'T2' : 'T1',
    );
    const [selectedIsland, setSelectedIsland] = useState<IslandMarker | null>(null);
    const [selectedDepGate, setSelectedDepGate] = useState<DepGateMarker | null>(null);
    const timeline = useTimeline(TIMELINE_RANGE);

    const [query, setQuery] = useState<MapQuery | null>(null);

    useEffect(() => {
        setQuery(baseInfo ? { smltId: baseInfo.smltId, tmnlId: terminal } : null);
    }, [baseInfo, terminal]);

    const { data: mapDay, error: mapError, responseSeq: mapResponseSeq } = useSmltMap(query);

    const error = baseError || mapError;

    useErrorAlert(error, baseResponseSeq + mapResponseSeq);

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

    const handleDetailMove = (view: SmltView) => () => {
        navigate(pathOf(view, { ymd: viewYmd, tmnlId: terminal, hhmm: timeline.hhmm }));
    };

    const handleSearch = () => {
        if (draftYmd.length !== 8) {
            dialog.alert({ title: '조회 조건 확인', description: '기준일자를 선택하세요.' }).catch(() => {});
            return;
        }

        if (draftYmd !== ymd) {
            setYmd(draftYmd);
            setSearchParams({ ymd: draftYmd }, { replace: true });
            setSelectedIsland(null);
            setSelectedDepGate(null);
            return;
        }

        if (!baseInfo) return;

        setQuery({ smltId: baseInfo.smltId, tmnlId: terminal });
    };

    return (
        <div className="wrap">
            <Header
                baseYmd={isUserSmlt ? viewYmd : draftYmd}
                terminal={terminal}
                isUserSmlt={isUserSmlt}
                onDateChange={setDraftYmd}
                onTerminalChange={handleTerminalChange}
                onSearch={handleSearch}
            />

            <div className="body">
                <Lnb />

                <main className="container">
                    <CongestionNotice
                        level={slot.notice.level}
                        items={slot.notice.items}
                        summaryInfo={slot.summaryInfo}
                    />

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

            {islandDetail && (
                <IslandModal
                    detail={islandDetail}
                    onClose={() => setSelectedIsland(null)}
                    onDetailClick={handleDetailMove('checkinCounter')}
                />
            )}

            {dptgtGateDetail && (
                <DptgtModal
                    detail={dptgtGateDetail}
                    onClose={() => setSelectedDepGate(null)}
                    onDetailClick={handleDetailMove('departureHall')}
                />
            )}
        </div>
    );
}

export default TerminalMap;
