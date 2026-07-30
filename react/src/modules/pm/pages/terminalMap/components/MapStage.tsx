import type { CSSProperties } from 'react';
import { Terminal1Icon, Terminal2Plan } from '@/components/icons';
import type { IslandMarker, TerminalKind, TerminalMapData } from '../types';

interface MapStageProps {
    terminal: TerminalKind;
    data: TerminalMapData;
    /** 팝업이 열려 있는 아일랜드 id */
    activeIslandId?: string;
    onIslandClick: (island: IslandMarker) => void;
}

/** 도면 무대 기준 비율 좌표를 CSS 변수로 변환 */
function pos(x: number, y: number) {
    return { '--x': `${x}%`, '--y': `${y}%` } as CSSProperties;
}

/**
 * 터미널 도면 + 구역 마커 레이어.
 *
 * 도면 SVG(assets/svg/terminal1-icon.svg · terminal2-icon.svg)는
 * preserveAspectRatio="none" 이므로 viewBox 좌표가 무대 박스에 비율 그대로
 * 대응한다. 마커도 같은 박스를 공유해 화면 크기가 변해도 어긋나지 않는다.
 */
export function MapStage({ terminal, data, activeIslandId, onIslandClick }: MapStageProps) {
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
                        className="marker marker--dep-gate"
                        style={pos(depGate.x, depGate.y)}
                        aria-label={`출국장 ${depGate.label}`}
                    >
                        {depGate.label}
                    </button>
                ))}

                {/* 아일랜드 */}
                {data.islands.map((island) => (
                    <button
                        type="button"
                        key={island.id}
                        className={`marker marker--island is-${island.level}${
                            island.id === activeIslandId ? ' is-active' : ''
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
