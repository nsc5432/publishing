import './terminalMap.css';
import { useMemo, useState } from 'react';
import { Lnb } from '@/components/lnb';
import { usePageScope } from '@/hooks/usePageScope';
import { CongestionNotice } from './components/CongestionNotice';
import { FacilityMiniModal } from './components/FacilityMiniModal';
import { Header } from './components/Header';
import { IslandModal } from './components/IslandModal';
import { MapStage } from './components/MapStage';
import { OperCards } from './components/OperCards';
import { Timeline } from './components/Timeline';
import { useTimeline } from './hooks/useTimeline';
import {
    buildDepGateDetail,
    buildIslandDetail,
    DEFAULT_NAV_BOTTOM,
    HEADER,
    NOTICES,
    OPER_CARDS,
    SUMMARY,
    TERMINAL_MAP,
} from './mock';
import type { DepGateMarker, IslandMarker, TerminalKind } from './types';

/**
 * PM 예측관리 / 일일 시뮬레이션 결과 조회 — 맵 형태.
 * html/index.html + html/js/main.js 를 컴포넌트로 이식한 컨테이너.
 *
 * - 화면 공용 상태(터미널 선택, 선택 아일랜드, 타임라인)를 소유하고 Props 로 전달.
 * - 도면/마커 좌표는 mock.ts 의 비율 데이터를 그대로 사용한다.
 */
function TerminalMap() {
    // terminalMap.css 를 이 화면에서만 적용시킨다 (hooks/usePageScope 참고)
    usePageScope('terminalMap');

    // 조회 조건: 터미널 선택 (T1 / T2)
    const [terminal, setTerminal] = useState<TerminalKind>(HEADER.defaultTerminal);
    // 상세 팝업이 열린 아일랜드
    const [selectedIsland, setSelectedIsland] = useState<IslandMarker | null>(null);
    // 미니 팝업이 열린 출국장
    const [selectedDepGate, setSelectedDepGate] = useState<DepGateMarker | null>(null);
    // 하단 타임라인 (30분 단위 / 재생)
    const timeline = useTimeline();

    const mapData = TERMINAL_MAP[terminal];
    const islandDetail = useMemo(
        () => (selectedIsland ? buildIslandDetail(terminal, selectedIsland) : null),
        [terminal, selectedIsland],
    );
    const depGateDetail = useMemo(
        () => (selectedDepGate ? buildDepGateDetail(selectedDepGate) : null),
        [selectedDepGate],
    );

    // 팝업은 한 번에 하나만 열린다
    const handleIslandClick = (island: IslandMarker) => {
        setSelectedDepGate(null);
        setSelectedIsland(island);
    };

    const handleDepGateClick = (depGate: DepGateMarker) => {
        setSelectedIsland(null);
        setSelectedDepGate(depGate);
    };

    const handleTerminalChange = (kind: TerminalKind) => {
        setTerminal(kind);
        // 터미널이 바뀌면 열려 있던 팝업은 닫는다
        setSelectedIsland(null);
        setSelectedDepGate(null);
    };

    const handleSearch = () => {
        // 실제 조회 연동 전: 현재 조회 조건만 확인한다.
        console.log('[조회]', { baseDate: HEADER.baseDate, terminal, time: timeline.label });
    };

    return (
        <div className="wrap">
            <Header
                baseDate={HEADER.baseDate}
                terminal={terminal}
                onTerminalChange={handleTerminalChange}
                summary={SUMMARY[terminal]}
                onSearch={handleSearch}
            />

            <div className="body">
                <Lnb defaultBottom={DEFAULT_NAV_BOTTOM} />

                <main className="container">
                    <CongestionNotice
                        level={NOTICES[terminal].level}
                        items={NOTICES[terminal].items}
                    />

                    <section className="map-area">
                        <p className="map-area__guide">해당구역을 클릭하세요</p>

                        <OperCards cards={OPER_CARDS[terminal]} />

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
