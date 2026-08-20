import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type MouseEvent,
    type PointerEvent as ReactPointerEvent,
} from 'react';
import { useDragScroll } from '../../../hooks/useDragScroll';

/** 이만큼 넘게 끌었으면 칩을 고른 게 아니라 레일을 민 것이다 */
const DRAG_SLOP = 4;

interface AirlinePopoverProps {
    airlines: string[];
    /** 선택된 부스 수 */
    count: number;
    /** `.booths` 기준 좌표 — 선택 끝 칸의 가로 중앙·하단 */
    pos: { x: number; y: number };
    onPick: (airline: string) => void;
}

export function AirlinePopover({ airlines, count, pos, onPick }: AirlinePopoverProps) {
    const [railEl, setRailEl] = useState<HTMLDivElement | null>(null);
    const downX = useRef(0);
    const rail = useDragScroll(railEl);
    const { sync } = rail;

    useEffect(() => {
        sync();
    }, [sync, airlines]);

    const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        downX.current = e.clientX;
        rail.onPointerDown(e);
    };

    // 레일을 밀고 손을 뗀 자리에 칩이 있으면 클릭이 따라 들어온다 — 민 거리로 가려낸다
    const pick = (e: MouseEvent<HTMLButtonElement>, airline: string) => {
        if (Math.abs(e.clientX - downX.current) > DRAG_SLOP) return;

        onPick(airline);
    };

    return (
        <div className="airpop" style={{ '--x': `${pos.x}px`, '--y': `${pos.y}px` } as CSSProperties}>
            <p className="airpop__head">{count}석 선택 · 항공사 배정</p>

            <div
                className={`airpop__rail${rail.scrollable ? ' is-scrollable' : ''}${
                    rail.atStart ? '' : ' is-scrolled'
                }${rail.atEnd ? ' is-end' : ''}`}
            >
                <div
                    ref={setRailEl}
                    className={`airpop__list${rail.dragging ? ' is-dragging' : ''}`}
                    onScroll={rail.sync}
                    onPointerDown={handlePointerDown}
                >
                    {airlines.map((airline) => (
                        <button
                            key={airline}
                            type="button"
                            className="airchip"
                            onClick={(e) => pick(e, airline)}
                        >
                            {airline}
                        </button>
                    ))}
                    <button
                        type="button"
                        className="airchip airchip--ghost"
                        onClick={(e) => pick(e, '')}
                    >
                        미배정
                    </button>
                </div>
                <span className="airpop__grip" aria-hidden="true" />
            </div>
        </div>
    );
}
