import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useDragScroll } from '../../../hooks/useDragScroll';

interface AirlinePaletteProps {
    airlines: string[];
    count: number;
    onPick: (airline: string) => void;
}

const DRAG_SLOP = 4;

export function AirlinePalette({ airlines, count, onPick }: AirlinePaletteProps) {
    const [railEl, setRailEl] = useState<HTMLDivElement | null>(null);
    const pointerDownX = useRef(0);
    const rail = useDragScroll(railEl);
    const { sync } = rail;

    const ready = count > 0;

    useEffect(() => {
        sync();
    }, [sync, airlines]);

    const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        pointerDownX.current = event.clientX;
        rail.onPointerDown(event);
    };

    const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!ready || Math.abs(event.clientX - pointerDownX.current) > DRAG_SLOP) return;

        const airlineChip = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-airline]');
        if (!airlineChip) return;

        onPick(airlineChip.dataset.airline ?? '');
    };

    const handleClick = (event: MouseEvent<HTMLButtonElement>, airline: string) => {
        if (!ready || event.detail !== 0) return;

        onPick(airline);
    };

    return (
        <div className={`airpal${ready ? ' is-ready' : ''}`}>
            <p className="airpal__head">{ready ? `${count}대에 배정할 항공사` : '항공사'}</p>

            <div className={`airpop__rail${rail.scrollable ? ' is-scrollable' : ''}${rail.atStart ? '' : ' is-scrolled'}${rail.atEnd ? ' is-end' : ''}`}>
                <div
                    ref={setRailEl}
                    className={`airpop__list${rail.dragging ? ' is-dragging' : ''}`}
                    onScroll={rail.sync}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                >
                    {airlines.map((airline) => (
                        <button
                            key={airline}
                            type="button"
                            data-airline={airline}
                            className="airchip"
                            aria-disabled={!ready}
                            onClick={(event) => handleClick(event, airline)}
                        >
                            {airline}
                        </button>
                    ))}
                    <button
                        type="button"
                        data-airline=""
                        className="airchip airchip--ghost"
                        aria-disabled={!ready}
                        onClick={(event) => handleClick(event, '')}
                    >
                        미배정
                    </button>
                </div>
                <span className="airpop__grip" aria-hidden="true" />
            </div>
        </div>
    );
}
