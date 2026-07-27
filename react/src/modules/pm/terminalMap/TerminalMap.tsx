import './terminalMap.css';
import { useMemo, useState } from 'react';
import { CongestionNotice } from './components/CongestionNotice';
import { Header } from './components/Header';
import { IslandModal } from './components/IslandModal';
import { Lnb } from './components/Lnb';
import { MapStage } from './components/MapStage';
import { OperCards } from './components/OperCards';
import { Timeline } from './components/Timeline';
import { useTimeline } from './hooks/useTimeline';
import { buildIslandDetail, HEADER, NOTICES, OPER_CARDS, SUMMARY, TERMINAL_MAP } from './mock';
import type { IslandMarker, TerminalKind } from './types';

/**
 * PM 예측관리 / 일일 시뮬레이션 결과 조회 — 맵 형태.
 * html/index.html + html/js/main.js 를 컴포넌트로 이식한 컨테이너.
 *
 * - 화면 공용 상태(터미널 선택, 선택 아일랜드, 타임라인)를 소유하고 Props 로 전달.
 * - 도면/마커 좌표는 mock.ts 의 비율 데이터를 그대로 사용한다.
 */
function TerminalMap() {
    // 조회 조건: 터미널 선택 (T1 / T2)
    const [terminal, setTerminal] = useState<TerminalKind>(HEADER.defaultTerminal);
    // 상세 팝업이 열린 아일랜드
    const [selectedIsland, setSelectedIsland] = useState<IslandMarker | null>(null);
    // 하단 타임라인 (30분 단위 / 재생)
    const timeline = useTimeline();

    const mapData = TERMINAL_MAP[terminal];
    const islandDetail = useMemo(
        () => (selectedIsland ? buildIslandDetail(terminal, selectedIsland) : null),
        [terminal, selectedIsland],
    );

    const handleTerminalChange = (kind: TerminalKind) => {
        setTerminal(kind);
        setSelectedIsland(null); // 터미널이 바뀌면 열려 있던 팝업은 닫는다
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
                <Lnb />

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
                            activeIslandId={selectedIsland?.id}
                            onIslandClick={setSelectedIsland}
                        />

                        <Timeline timeline={timeline} />
                    </section>
                </main>
            </div>

            {islandDetail && (
                <IslandModal detail={islandDetail} onClose={() => setSelectedIsland(null)} />
            )}
        </div>
    );
}

export default TerminalMap;
