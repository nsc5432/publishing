import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useDragScroll } from '../../../hooks/useDragScroll';

const DRAG_SLOP = 4;

interface AirlinePopoverProps {
    airlines: string[];
    count: number;
    pos: { x: number; y: number };
    onPick: (airline: string) => void;
}

export function AirlinePopover({ airlines, count, pos, onPick }: AirlinePopoverProps) {
    const [railEl, setRailEl] = useState<HTMLDivElement | null>(null);
    const pointerDownX = useRef(0);
    const rail = useDragScroll(railEl);
    const { sync } = rail;

    useEffect(() => {
        sync();
    }, [sync, airlines]);

    const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        pointerDownX.current = event.clientX;
        rail.onPointerDown(event);
    };

    const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (Math.abs(event.clientX - pointerDownX.current) > DRAG_SLOP) return;

        const airlineChip = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-airline]');
        if (!airlineChip) return;

        onPick(airlineChip.dataset.airline ?? '');
    };

    const handleClick = (event: MouseEvent<HTMLButtonElement>, airline: string) => {
        if (event.detail !== 0) return;

        onPick(airline);
    };

    return (
        <div className="airpop" style={{ '--x': `${pos.x}px`, '--y': `${pos.y}px` } as CSSProperties}>
            <p className="airpop__head">{count}석 선택 · 항공사 배정</p>

            <div className={`airpop__rail${rail.scrollable ? ' is-scrollable' : ''}${rail.atStart ? '' : ' is-scrolled'}${rail.atEnd ? ' is-end' : ''}`}>
                <div
                    ref={setRailEl}
                    className={`airpop__list${rail.dragging ? ' is-dragging' : ''}`}
                    onScroll={rail.sync}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                >
                    {airlines.map((airline) => (
                        <button key={airline} type="button" data-airline={airline} className="airchip" onClick={(event) => handleClick(event, airline)}>
                            {airline}
                        </button>
                    ))}
                    <button type="button" data-airline="" className="airchip airchip--ghost" onClick={(event) => handleClick(event, '')}>
                        미배정
                    </button>
                </div>
                <span className="airpop__grip" aria-hidden="true" />
            </div>
        </div>
    );
}
