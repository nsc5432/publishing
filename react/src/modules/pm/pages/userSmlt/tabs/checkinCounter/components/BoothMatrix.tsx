import { useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { pad2 } from '@/lib/format';
import { DAY_HOURS, SIDE_BOOTHS } from '../constants';
import type { Booth, CellRange } from '../types';
import { isCellInRange } from '../view';

interface BoothMatrixProps {
    booths: Booth[];
    airlines: string[];
    selection: CellRange | null;
    onSelect: (range: CellRange | null) => void;
    disabled?: boolean;
}

interface Cell {
    boothNo: number;
    hour: number;
}

interface DragRange {
    anchor: Cell;
    head: Cell;
    wasSole: boolean;
}

const AIRLINE_COLORS = [
    '#dcdbff',
    '#cfe6ff',
    '#d4f1dd',
    '#ffe4c4',
    '#f8d5e2',
    '#e2dbf6',
    '#cfeeec',
    '#f3edc0',
    '#ffd8cf',
    '#dfe7c9',
];
const UNKNOWN_AIRLINE_COLOR = '#e5e7ef';
const HOURS = Array.from({ length: DAY_HOURS }, (_, hour) => hour);

function toRange({ anchor, head }: Pick<DragRange, 'anchor' | 'head'>): CellRange {
    return {
        boothFrom: Math.min(anchor.boothNo, head.boothNo),
        boothTo: Math.max(anchor.boothNo, head.boothNo),
        hourFrom: Math.min(anchor.hour, head.hour),
        hourTo: Math.max(anchor.hour, head.hour),
    };
}

function isSameRange(a: CellRange | null, b: CellRange): boolean {
    return a !== null && a.boothFrom === b.boothFrom && a.boothTo === b.boothTo && a.hourFrom === b.hourFrom && a.hourTo === b.hourTo;
}

function toCellFrom(element: Element | null): Cell | null {
    const cell = element?.closest<HTMLElement>('[data-cell-hour]');
    if (!cell) return null;

    return { boothNo: Number(cell.dataset.cellBooth), hour: Number(cell.dataset.cellHour) };
}

export function BoothMatrix({ booths, airlines, selection, onSelect, disabled = false }: BoothMatrixProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [drag, setDrag] = useState<DragRange | null>(null);

    const lastBoothNo = booths.at(-1)?.no ?? 0;

    const colorOf = (airline: string) => {
        const index = airlines.indexOf(airline);
        return index < 0 ? UNKNOWN_AIRLINE_COLOR : AIRLINE_COLORS[index % AIRLINE_COLORS.length];
    };

    const toggle = (range: CellRange) => onSelect(isSameRange(selection, range) ? null : range);

    const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, cell: Cell) => {
        if (disabled || event.button !== 0) return;

        const range = toRange({ anchor: cell, head: cell });
        rootRef.current?.setPointerCapture(event.pointerId);
        setDrag({ anchor: cell, head: cell, wasSole: isSameRange(selection, range) });
        onSelect(range);
    };

    const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!drag) return;

        const head = toCellFrom(document.elementFromPoint(event.clientX, event.clientY));
        if (!head || (head.boothNo === drag.head.boothNo && head.hour === drag.head.hour)) return;

        const nextDrag = { ...drag, head };
        setDrag(nextDrag);
        onSelect(toRange(nextDrag));
    };

    const handlePointerUp = () => {
        if (!drag) return;

        if (drag.anchor.boothNo === drag.head.boothNo && drag.anchor.hour === drag.head.hour && drag.wasSole) {
            onSelect(null);
        }

        setDrag(null);
    };

    const handleCellClick = (event: MouseEvent<HTMLButtonElement>, cell: Cell) => {
        if (event.detail !== 0) return;

        toggle(toRange({ anchor: cell, head: cell }));
    };

    return (
        <div
            ref={rootRef}
            className={`bmatrix${drag ? ' is-dragging' : ''}`}
            role="grid"
            aria-label="부스별 시간대 항공사 배정"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            <div className="bmatrix__row bmatrix__row--head" role="row">
                <span className="bmatrix__corner" role="columnheader">
                    부스
                </span>
                {HOURS.map((hour) => (
                    <button
                        key={hour}
                        type="button"
                        className="bmatrix__hour"
                        role="columnheader"
                        disabled={disabled}
                        aria-label={`${hour}시 전체 부스 선택`}
                        onClick={() => toggle({ boothFrom: 1, boothTo: lastBoothNo, hourFrom: hour, hourTo: hour })}
                    >
                        {pad2(hour)}
                    </button>
                ))}
            </div>

            {booths.map((booth) => (
                <div
                    key={booth.no}
                    className={`bmatrix__row${booth.no === SIDE_BOOTHS + 1 ? ' bmatrix__row--side' : ''}`}
                    role="row"
                >
                    <button
                        type="button"
                        className="bmatrix__booth"
                        role="rowheader"
                        disabled={disabled}
                        aria-label={`${booth.no}번 부스 하루 전체 선택`}
                        onClick={() => toggle({ boothFrom: booth.no, boothTo: booth.no, hourFrom: 0, hourTo: DAY_HOURS - 1 })}
                    >
                        <i className="bmatrix__side">{booth.side}</i>
                        {pad2(booth.no)}
                    </button>
                    {booth.hours.map((airline, hour) => {
                        const cell = { boothNo: booth.no, hour };
                        const runStart = airline !== '' && booth.hours[hour - 1] !== airline;
                        const selected = isCellInRange(selection, booth.no, hour);

                        return (
                            <button
                                key={hour}
                                type="button"
                                role="gridcell"
                                data-cell-booth={booth.no}
                                data-cell-hour={hour}
                                className={`bmatrix__cell${airline ? '' : ' is-empty'}${runStart ? ' is-start' : ''}${selected ? ' is-sel' : ''}`}
                                style={airline ? ({ '--cell-c': colorOf(airline) } as CSSProperties) : undefined}
                                aria-selected={selected}
                                aria-label={`${booth.no}번 부스 ${hour}시 ${airline || '미배정'}`}
                                disabled={disabled}
                                onPointerDown={(event) => handlePointerDown(event, cell)}
                                onClick={(event) => handleCellClick(event, cell)}
                            >
                                {runStart ? airline : ''}
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
