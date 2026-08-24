import type { CSSProperties } from 'react';
import { Terminal1SolidPlan, Terminal2SolidPlan } from '@/components/icons';
import { toStagePosition } from '@/lib/chart';
import type { DepGateMarker, IslandMarker, TerminalKind, TerminalMapData } from '../types';

interface MapStageProps {
    terminal: TerminalKind;
    data: TerminalMapData;
    activeMarkerId?: string;
    onIslandClick: (island: IslandMarker) => void;
    onDepGateClick: (dptgtGate: DepGateMarker) => void;
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
                {data.dptgtGates.map((dptgtGate) => (
                    <button
                        type="button"
                        key={dptgtGate.id}
                        className={`marker marker--dep-gate${
                            dptgtGate.id === activeMarkerId ? ' is-active' : ''
                        }`}
                        data-congestion={dptgtGate.cgnStatus}
                        style={toStagePosition(dptgtGate.x, dptgtGate.y)}
                        aria-label={`출국장 ${dptgtGate.label}`}
                        onClick={() => onDepGateClick(dptgtGate)}
                    >
                        {dptgtGate.label}
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
