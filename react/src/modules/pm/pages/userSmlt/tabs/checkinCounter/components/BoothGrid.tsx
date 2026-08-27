import { useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { Booth, BoothSide } from '../types';

interface BoothGridProps {
    booths: Booth[];
    selected: number[];
    onSelect: (nos: number[]) => void;
    side?: BoothSide;
    disabled?: boolean;
}

interface DragRange {
    anchor: number;
    head: number;
    wasSole: boolean;
}

function toRange({ anchor, head }: DragRange, booths: Booth[]): number[] {
    const from = Math.min(anchor, head);
    const to = Math.max(anchor, head);

    return booths.filter((booth) => booth.no >= from && booth.no <= to).map((booth) => booth.no);
}

export function BoothGrid({ booths, selected, onSelect, side, disabled = false }: BoothGridProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [drag, setDrag] = useState<DragRange | null>(null);

    const visibleBooths = side ? booths.filter((booth) => booth.side === side) : booths;
    const isSole = (no: number) => selected.length === 1 && selected[0] === no;

    const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, no: number) => {
        if (disabled || event.button !== 0) return;

        rootRef.current?.setPointerCapture(event.pointerId);
        setDrag({ anchor: no, head: no, wasSole: isSole(no) });
        onSelect([no]);
    };

    const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!drag) return;

        const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-booth-no]');
        if (!cell || !rootRef.current?.contains(cell)) return;

        const head = Number(cell.dataset.boothNo);
        if (head === drag.head) return;

        const nextDrag = { ...drag, head };
        setDrag(nextDrag);
        onSelect(toRange(nextDrag, visibleBooths));
    };

    const handlePointerUp = () => {
        if (!drag) return;

        if (drag.anchor === drag.head && drag.wasSole) {
            onSelect([]);
        }

        setDrag(null);
    };

    const handleClick = (event: MouseEvent<HTMLButtonElement>, no: number) => {
        if (event.detail !== 0) return;

        onSelect(isSole(no) ? [] : [no]);
    };

    return (
        <div
            ref={rootRef}
            className={`boothgrid${side ? ' boothgrid--strip' : ''}${drag ? ' is-dragging' : ''}`}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {visibleBooths.map((booth) => (
                <button
                    key={booth.no}
                    type="button"
                    data-booth-no={booth.no}
                    className={`bcell${booth.airline ? '' : ' bcell--empty'}${selected.includes(booth.no) ? ' is-sel' : ''}`}
                    aria-pressed={selected.includes(booth.no)}
                    disabled={disabled}
                    onPointerDown={(event) => handlePointerDown(event, booth.no)}
                    onClick={(event) => handleClick(event, booth.no)}
                >
                    <i className="bcell__no">{booth.no}</i>
                    {booth.airline || '미배정'}
                </button>
            ))}
        </div>
    );
}
