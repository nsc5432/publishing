import { toStagePosition } from '@/lib/chart';
import { toLevelKey, type DepGateMarker, type TerminalDepMap } from '../types';
import { DepGateCardBox } from './DepGateCardBox';

interface DepMapViewProps {
    data: TerminalDepMap;
    /** 마우스를 올린 출국장 (마커 ↔ 카드 연결 표시) */
    activeId?: string;
    onDepGateHover: (dptgtGate: DepGateMarker | null) => void;
}

/**
 * 맵 보기 — 도면 무대 위의 마커와 출국장 카드
 */
export function DepMapView({ data, activeId, onDepGateHover }: DepMapViewProps) {
    return (
        <div className="dep-stage">
            {/* 출국장 카드 */}
            {data.cards.map((card) => (
                <DepGateCardBox key={card.id} card={card} active={card.id === activeId} />
            ))}

            {/* 출국장 번호 */}
            {data.dptgtGates.map((dptgtGate) => (
                <button
                    type="button"
                    key={dptgtGate.id}
                    className={`marker marker--dep-gate is-${toLevelKey(dptgtGate.level)}${dptgtGate.id === activeId ? ' is-active' : ''}`}
                    style={toStagePosition(dptgtGate.x, dptgtGate.y)}
                    aria-label={`출국장 ${dptgtGate.label}`}
                    onMouseEnter={() => onDepGateHover(dptgtGate)}
                    onMouseLeave={() => onDepGateHover(null)}
                    onFocus={() => onDepGateHover(dptgtGate)}
                    onBlur={() => onDepGateHover(null)}
                >
                    {dptgtGate.label}
                </button>
            ))}

            {/* 아일랜드 */}
            {data.islands.map((island) => (
                <span key={island.id} className={`marker marker--island is-${toLevelKey(island.level)}`} style={toStagePosition(island.x, island.y)}>
                    {island.label}
                </span>
            ))}

            {/* 출입구 게이트 */}
            {data.gates.map((gate) => (
                <span key={gate.id} className="marker marker--gate" style={toStagePosition(gate.x, gate.y)}>
                    {gate.label}
                </span>
            ))}
        </div>
    );
}
