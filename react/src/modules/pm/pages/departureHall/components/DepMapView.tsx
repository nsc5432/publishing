import type { CSSProperties } from 'react';
import type { DepGateMarker, TerminalDepMap } from '../types';
import { DepGateCardBox } from './DepGateCardBox';

interface DepMapViewProps {
    data: TerminalDepMap;
    /** 마우스를 올린 출국장 (마커 ↔ 카드 연결 표시) */
    activeId?: string;
    onDepGateHover: (depGate: DepGateMarker | null) => void;
}

function pos(x: number, y: number) {
    return { '--x': `${x}%`, '--y': `${y}%` } as CSSProperties;
}

/**
 * 맵 보기 — 도면 무대 위의 마커와 출국장 카드.
 *
 * 무대(.dep-stage)는 도면 배경(.dep-view__bg)에 대한 고정 비율 박스라
 * 창 크기가 변해도 마커·카드가 배경 위 같은 자리에 얹힌다.
 */
export function DepMapView({ data, activeId, onDepGateHover }: DepMapViewProps) {
    return (
        <div className="dep-stage">
            {/* 출국장 카드 : 도면 위에 떠 있다 */}
            {data.cards.map((card) => (
                <DepGateCardBox key={card.id} card={card} active={card.id === activeId} />
            ))}

            {/* 출국장 (T1: 1~6 / T2: 1~2) */}
            {data.depGates.map((depGate) => (
                <button
                    type="button"
                    key={depGate.id}
                    className={`marker marker--dep-gate${depGate.id === activeId ? ' is-active' : ''}`}
                    style={pos(depGate.x, depGate.y)}
                    aria-label={`출국장 ${depGate.label}`}
                    onMouseEnter={() => onDepGateHover(depGate)}
                    onMouseLeave={() => onDepGateHover(null)}
                    onFocus={() => onDepGateHover(depGate)}
                    onBlur={() => onDepGateHover(null)}
                >
                    {depGate.label}
                </button>
            ))}

            {/* 아일랜드 A~N : 출국장 화면에서는 위치 참고용이라 누를 수 없다 */}
            {data.islands.map((island) => (
                <span
                    key={island.id}
                    className={`marker marker--island is-${island.level}`}
                    style={pos(island.x, island.y)}
                >
                    {island.label}
                </span>
            ))}

            {/* 출입구 게이트 */}
            {data.gates.map((gate) => (
                <span key={gate.id} className="marker marker--gate" style={pos(gate.x, gate.y)}>
                    {gate.label}
                </span>
            ))}
        </div>
    );
}
