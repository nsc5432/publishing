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
import {
    useDepDetail,
    useIslandDetail,
    useSmltMap,
    type MapQuery,
} from './hooks/useTerminalMapData';
import { EMPTY_MAP_DATA, EMPTY_NOTICE, EMPTY_SUMMARY } from './view';
import { useTimeline } from '@/modules/pm/hooks/useTimeline';
import { TIMELINE_RANGE } from './timeline';
import type { DepGateMarker, IslandMarker, TerminalKind } from './types';

/* 메뉴 구성은 화면 공용(@/components/lnb)이라 여기서는 활성 항목만 지정한다. */
const DEFAULT_NAV_BOTTOM = 'map';

/**
 * PM 예측관리 / 일일 시뮬레이션 결과 조회 — 맵 형태.
 *
 * 화면에 들어오면 기준 정보(getBaseInfo)로 시뮬레이션 ID 를 받고,
 * 터미널·타임라인 시각을 조회 조건으로 도면(getSmltMap)을 부른다.
 * 마커를 누르면 그 시각의 상세를 따로 조회한다.
 */
function TerminalMap() {
    usePageScope('terminalMap');

    // 기준일자 — 최초 진입은 오늘. (달력 UI 가 붙으면 여기서 바꾼다)
    const [ymd] = useState(todayYmd);
    const { data: baseInfo, error: baseError } = useBaseInfo(ymd);

    const [terminal, setTerminal] = useState<TerminalKind>('T1');
    const [selectedIsland, setSelectedIsland] = useState<IslandMarker | null>(null);
    const [selectedDepGate, setSelectedDepGate] = useState<DepGateMarker | null>(null);
    const timeline = useTimeline(TIMELINE_RANGE);

    // 조회 조건 — 터미널·타임라인 시각이 바뀌면 그대로 다시 조회한다.
    const [query, setQuery] = useState<MapQuery | null>(null);

    useEffect(() => {
        if (!baseInfo) return;

        setQuery({ smltId: baseInfo.smltId, tmnlId: terminal, hhmm: timeline.hhmm });
    }, [baseInfo, terminal, timeline.hhmm]);

    const { data: mapView, error: mapError } = useSmltMap(query);
    const { data: islandDetail, error: islandError } = useIslandDetail(
        query,
        selectedIsland?.label ?? null,
    );
    const { data: depGateDetail, error: depError } = useDepDetail(
        query,
        selectedDepGate?.label ?? null,
    );

    // 조회가 여러 갈래라 먼저 걸린 사유 하나만 알린다 (같은 실패로 알럿이 겹치지 않게).
    const error = baseError || mapError || islandError || depError;

    useErrorAlert(error);

    const mapData = mapView?.map ?? EMPTY_MAP_DATA;
    const notice = mapView?.notice ?? EMPTY_NOTICE;

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

    const handleSearch = () => {
        if (!baseInfo) return;

        setQuery({ smltId: baseInfo.smltId, tmnlId: terminal, hhmm: timeline.hhmm });
    };

    return (
        <div className="wrap">
            <Header
                baseDate={formatYmd(baseInfo?.ymd ?? '')}
                terminal={terminal}
                onTerminalChange={handleTerminalChange}
                summary={mapView?.summary ?? EMPTY_SUMMARY}
                onSearch={handleSearch}
            />

            <div className="body">
                <Lnb defaultBottom={DEFAULT_NAV_BOTTOM} />

                <main className="container">
                    <CongestionNotice level={notice.level} items={notice.items} />

                    <section className="map-area">
                        <p className="map-area__guide">해당구역을 클릭하세요</p>

                        <OperCards cards={mapView?.operCards ?? []} />

                        <MapStage
                            terminal={terminal}
                            data={mapData}
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
