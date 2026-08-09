import type { CSSProperties } from 'react';
import { Terminal1Icon, Terminal2Plan } from '@/components/icons';
import type { DepGateMarker, IslandMarker, TerminalKind, TerminalMapData } from '../types';

interface MapStageProps {
    terminal: TerminalKind;
    data: TerminalMapData;
    activeMarkerId?: string;
    onIslandClick: (island: IslandMarker) => void;
    onDepGateClick: (depGate: DepGateMarker) => void;
}

function pos(x: number, y: number) {
    return { '--x': `${x}%`, '--y': `${y}%` } as CSSProperties;
}

/**
 * 터미널 도면 + 구역 마커 레이어.
 */
export function MapStage({
    terminal,
    data,
    activeMarkerId,
    onIslandClick,
    onDepGateClick,
}: MapStageProps) {
    const Plan = terminal === 'T1' ? Terminal1Icon : Terminal2Plan;
    const stage = { '--stage-ar': data.stageAspect } as CSSProperties;

    return (
        <div className="map" style={stage}>
            <Plan
                className="map__bg"
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
            />

            {/* 구역 마커 : 좌표는 도면 viewBox 기준 비율 */}
            <div className="markers">
                {/* 출국장 (T1: 1~6 / T2: 1~2) */}
                {data.depGates.map((depGate) => (
                    <button
                        type="button"
                        key={depGate.id}
                        className={`marker marker--dep-gate${depGate.id === activeMarkerId ? ' is-active' : ''
                            }`}
                        style={pos(depGate.x, depGate.y)}
                        aria-label={`출국장 ${depGate.label}`}
                        onClick={() => onDepGateClick(depGate)}
                    >
                        {depGate.label}
                    </button>
                ))}

                {/* 아일랜드 */}
                {data.islands.map((island) => (
                    <button
                        type="button"
                        key={island.id}
                        className={`marker marker--island is-${island.level}${island.id === activeMarkerId ? ' is-active' : ''
                            }`}
                        style={pos(island.x, island.y)}
                        onClick={() => onIslandClick(island)}
                    >
                        {island.label}
                    </button>
                ))}

                {/* 출입구 게이트 : 탑승동 아치 안쪽 라인 위에 배치 */}
                {data.gates.map((gate) => (
                    <button
                        type="button"
                        key={gate.id}
                        className="marker marker--gate"
                        style={pos(gate.x, gate.y)}
                        aria-label={`출입구 게이트 ${gate.label}`}
                    >
                        {gate.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
