import './terminalMap.css';
import { useEffect, useState } from 'react';
import { Lnb } from '@/components/lnb';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import { formatYmd, todayYmd } from '@/lib/format';
import { useBaseInfo } from '@/hooks/useBaseInfo';
import { CongestionNotice } from './components/CongestionNotice';
import { FacilityMiniModal } from './components/FacilityMiniModal';
import { Header } from './components/Header';
import { IslandModal } from './components/IslandModal';
import { MapStage } from './components/MapStage';
import { OperCards } from './components/OperCards';
import { Timeline } from './components/Timeline';
import { useSmltMap, type MapQuery } from './hooks/useTerminalMapData';
import { EMPTY_MAP_SLOT, EMPTY_SUMMARY } from './view';
import { useTimeline } from '@/modules/pm/hooks/useTimeline';
import { TIMELINE_RANGE } from './timeline';
import type { DepGateMarker, IslandMarker, TerminalKind } from './types';

/**
 * PM 예측관리 / 일일 시뮬레이션 결과 조회 — 맵 형태.
 *
 * 화면에 들어오면 기준 정보(getBaseInfo)로 시뮬레이션 ID 를 받고,
 * 터미널을 조회 조건으로 도면 하루치(getSmltMap)를 한 번에 받는다.
 * 타임라인·마커 팝업은 받아 둔 슬롯에서 읽으므로 다시 조회하지 않는다.
 */
function TerminalMap() {
    usePageScope('terminalMap');

    // 기준일자 — 최초 진입은 오늘. (달력 UI 가 붙으면 여기서 바꾼다)
    const [ymd] = useState(todayYmd);
    const { data: baseInfo, error: baseError, token: baseToken } = useBaseInfo(ymd);

    const [terminal, setTerminal] = useState<TerminalKind>('T1');
    const [selectedIsland, setSelectedIsland] = useState<IslandMarker | null>(null);
    const [selectedDepGate, setSelectedDepGate] = useState<DepGateMarker | null>(null);
    const timeline = useTimeline(TIMELINE_RANGE);

    // 조회 조건 — 터미널이 바뀌면 그 터미널의 하루치를 다시 받는다.
    const [query, setQuery] = useState<MapQuery | null>(null);

    useEffect(() => {
        if (!baseInfo) return;

        setQuery({ smltId: baseInfo.smltId, tmnlId: terminal });
    }, [baseInfo, terminal]);

    const { data: mapDay, error: mapError, token: mapToken } = useSmltMap(query);

    // 조회가 두 갈래라 먼저 걸린 사유 하나만 알린다 (같은 실패로 알럿이 겹치지 않게).
    const error = baseError || mapError;

    useErrorAlert(error, baseToken + mapToken);

    // 타임라인이 가리키는 시각의 값 — 받아 둔 하루치에서 자리만 옮긴다.
    const slot = mapDay?.slots[timeline.hhmm] ?? EMPTY_MAP_SLOT;
    const islandDetail = selectedIsland ? slot.islandDetails[selectedIsland.label] : null;
    const depGateDetail = selectedDepGate ? slot.depGateDetails[selectedDepGate.label] : null;

    // 팝업은 한 번에 하나만 열린다
    const handleIslandClick = (island: IslandMarker) => {
        setSelectedDepGate(null);
        setSelectedIsland(island);
    };

    const handleDepGateClick = (depGate: DepGateMarker) => {
        setSelectedIsland(null);
        setSelectedDepGate(depGate);
    };

    const handleTerminalChange = (nextTerminal: TerminalKind) => {
        setTerminal(nextTerminal);
        // 터미널이 바뀌면 열려 있던 팝업은 닫는다
        setSelectedIsland(null);
        setSelectedDepGate(null);
    };

    // 조건이 그대로여도 다시 눌러 최신 결과를 받아올 수 있도록 조회를 한 번 더 건다.
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

            {islandDetail && (
                <IslandModal detail={islandDetail} onClose={() => setSelectedIsland(null)} />
            )}

            {depGateDetail && (
                <FacilityMiniModal
                    detail={depGateDetail}
                    onClose={() => setSelectedDepGate(null)}
                />
            )}
        </div>
    );
}

export default TerminalMap;
