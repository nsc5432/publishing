import type { CSSProperties } from 'react';
import { Terminal1SolidPlan, Terminal2SolidPlan } from '@/components/icons';
import { toStagePosition } from '@/lib/chart';
import type { DepGateMarker, IslandMarker, TerminalKind, TerminalMapData } from '../types';

interface MapStageProps {
    terminal: TerminalKind;
    data: TerminalMapData;
    activeMarkerId?: string;
    onIslandClick: (island: IslandMarker) => void;
    onDepGateClick: (depGate: DepGateMarker) => void;
}

export function MapStage({
    terminal,
    data,
    activeMarkerId,
    onIslandClick,
    onDepGateClick,
}: MapStageProps) {
    const Plan = terminal === 'T1' ? Terminal1SolidPlan : Terminal2SolidPlan;
    const stageStyle = { '--stage-ar': data.stageAspect } as CSSProperties;

    return (
        <div className="map" style={stageStyle}>
            <Plan
                className="map__bg"
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
            />
            <div className="markers">
                {data.depGates.map((depGate) => (
                    <button
                        type="button"
                        key={depGate.id}
                        className={`marker marker--dep-gate${
                            depGate.id === activeMarkerId ? ' is-active' : ''
                        }`}
                        data-congestion={depGate.cgnStatus}
                        style={toStagePosition(depGate.x, depGate.y)}
                        aria-label={`출국장 ${depGate.label}`}
                        onClick={() => onDepGateClick(depGate)}
                    >
                        {depGate.label}
                    </button>
                ))}
                {data.islands.map((island) => (
                    <button
                        type="button"
                        key={island.id}
                        className={`marker marker--island is-${island.level}${
                            island.id === activeMarkerId ? ' is-active' : ''
                        }`}
                        style={toStagePosition(island.x, island.y)}
                        onClick={() => onIslandClick(island)}
                    >
                        {island.label}
                    </button>
                ))}
                {data.gates.map((gate) => (
                    <button
                        type="button"
                        key={gate.id}
                        className="marker marker--gate"
                        style={toStagePosition(gate.x, gate.y)}
                        aria-label={`출입구 게이트 ${gate.label}`}
                    >
                        {gate.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
