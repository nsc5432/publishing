import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CountStepper } from '../../../components/CountStepper';
import { formatHour, toHourList } from '../../../format';
import type { DepartureGate } from '../types';

interface ScGridProps {
    gates: DepartureGate[];
    value: Record<number, number[]>;
    onChange: (next: Record<number, number[]>) => void;

    selected: number | null;
    onSelect: (no: number | null) => void;
    onLabelClick: (no: number) => void;

    disabled?: boolean;
}

interface CellRect {
    gateNos: number[];
    operBgngHour: number;
    operEndHour: number;
}

interface Cursor {
    row: number;
    hour: number;
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const EMPTY_HOURS: readonly number[] = Array<number>(24).fill(0);

/** 셀 높이 20px + 줄 간격 1px. 팝오버 세로 위치가 이 값을 쓴다 (userSmlt.css 와 같아야 한다) */
const ROW_H = 21;
const RAMP = ['#e8e7f8', '#cbcaef', '#aaa8e5', '#8481db', '#5b58d6', '#403dbb'];
const RAMP_INVERT = 3;

function toRampStep(count: number, rampMax: number): number {
    if (count <= 0) return 0;

    return Math.min(RAMP.length - 1, Math.max(0, Math.ceil((count / rampMax) * RAMP.length) - 1));
}

export function ScGrid({ gates, value, onChange, selected, onSelect, onLabelClick, disabled = false }: ScGridProps) {
    const [dragAnchor, setDragAnchor] = useState<Cursor | null>(null);
    const [dragCursor, setDragCursor] = useState<Cursor | null>(null);
    const [selection, setSelection] = useState<CellRect | null>(null);
    const [draftCount, setDraftCount] = useState(0);
    const dragAnchorRef = useRef<Cursor | null>(null);
    const dragCursorRef = useRef<Cursor | null>(null);
    const popRef = useRef<HTMLDivElement>(null);

    const rows = useMemo(
        () =>
            gates.map((gate) => {
                const openHours = new Set(gate.off ? [] : toHourList(gate.ranges));
                const countsByHour = value[gate.no] ?? EMPTY_HOURS;
                const counts = HOURS.map((hour) => (openHours.has(hour) ? (countsByHour[hour] ?? 0) : null));

                return { gate, counts, peak: Math.max(0, ...counts.map((count) => count ?? 0)) };
            }),
        [gates, value],
    );

    const sums = useMemo(() => HOURS.map((hour) => rows.reduce((sum, row) => sum + (row.counts[hour] ?? 0), 0)), [rows]);
    const rampMax = Math.max(1, ...rows.map((row) => row.peak));
    const sumPeak = Math.max(0, ...sums);
    const rowsRef = useRef(rows);
    const onSelectRef = useRef(onSelect);

    const dragRect =
        dragAnchor && dragCursor
            ? {
                  firstRow: Math.min(dragAnchor.row, dragCursor.row),
                  lastRow: Math.max(dragAnchor.row, dragCursor.row),
                  firstHour: Math.min(dragAnchor.hour, dragCursor.hour),
                  lastHour: Math.max(dragAnchor.hour, dragCursor.hour),
              }
            : null;

    useEffect(() => {
        rowsRef.current = rows;
        onSelectRef.current = onSelect;
    }, [rows, onSelect]);

    const finishDrag = useCallback(() => {
        const anchor = dragAnchorRef.current;
        const cursor = dragCursorRef.current;
        dragAnchorRef.current = null;
        dragCursorRef.current = null;
        setDragAnchor(null);
        setDragCursor(null);
        if (!anchor || !cursor) return;

        const rect = {
            firstRow: Math.min(anchor.row, cursor.row),
            lastRow: Math.max(anchor.row, cursor.row),
            firstHour: Math.min(anchor.hour, cursor.hour),
            lastHour: Math.max(anchor.hour, cursor.hour),
        };

        const selectedRows = rowsRef.current
            .slice(rect.firstRow, rect.lastRow + 1)
            .filter((row) => row.counts.slice(rect.firstHour, rect.lastHour + 1).some((count) => count !== null));

        if (selectedRows.length === 0) {
            setSelection(null);
            onSelectRef.current(null);

            return;
        }

        setSelection({
            gateNos: selectedRows.map((row) => row.gate.no),
            operBgngHour: rect.firstHour,
            operEndHour: rect.lastHour + 1,
        });
        setDraftCount(selectedRows[0]?.counts.slice(rect.firstHour, rect.lastHour + 1).find((count) => count !== null) ?? 0);
        onSelectRef.current(selectedRows.length === 1 ? (selectedRows[0]?.gate.no ?? null) : null);
    }, []);

    useEffect(() => {
        window.addEventListener('pointerup', finishDrag);
        window.addEventListener('pointercancel', finishDrag);

        return () => {
            window.removeEventListener('pointerup', finishDrag);
            window.removeEventListener('pointercancel', finishDrag);
        };
    }, [finishDrag]);

    useEffect(() => {
        if (!selection) return undefined;

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setSelection(null);
        };
        window.addEventListener('keydown', handleKey);

        return () => window.removeEventListener('keydown', handleKey);
    }, [selection]);

    useEffect(() => {
        if (!selection) return undefined;

        const handleOutside = (event: PointerEvent) => {
            if (event.button !== 0) return;
            if (popRef.current?.contains(event.target as Node)) return;

            setSelection(null);
        };
        window.addEventListener('pointerdown', handleOutside);

        return () => window.removeEventListener('pointerdown', handleOutside);
    }, [selection]);

    useEffect(() => {
        setSelection(null);
    }, [gates]);

    const isPicked = (row: number, hour: number): boolean => {
        if (dragRect) {
            return row >= dragRect.firstRow && row <= dragRect.lastRow && hour >= dragRect.firstHour && hour <= dragRect.lastHour;
        }
        if (!selection) return false;

        const gateNo = rows[row]?.gate.no;

        return gateNo != null && selection.gateNos.includes(gateNo) && hour >= selection.operBgngHour && hour < selection.operEndHour;
    };

    const startDrag = (row: number, hour: number) => {
        if (disabled) return;

        const cursor = { row, hour };
        setSelection(null);
        dragAnchorRef.current = cursor;
        dragCursorRef.current = cursor;
        setDragAnchor(cursor);
        setDragCursor(cursor);
    };

    const moveDrag = (row: number, hour: number) => {
        if (!dragAnchorRef.current) return;

        const cursor = { row, hour };
        dragCursorRef.current = cursor;
        setDragCursor(cursor);
    };

    const apply = () => {
        if (!selection) return;

        const nextCountsByGate = { ...value };
        selection.gateNos.forEach((gateNo) => {
            const row = rows.find((candidate) => candidate.gate.no === gateNo);
            if (!row) return;

            const countsByHour = [...(value[gateNo] ?? EMPTY_HOURS)];
            for (let hour = selection.operBgngHour; hour < selection.operEndHour; hour += 1) {
                if (row.counts[hour] !== null) countsByHour[hour] = draftCount;
            }
            nextCountsByGate[gateNo] = countsByHour;
        });

        onChange(nextCountsByGate);
        setSelection(null);
    };

    const selectedRowIndexes = selection ? selection.gateNos.map((gateNo) => gates.findIndex((gate) => gate.no === gateNo)) : [];
    const openUpward = selectedRowIndexes.length > 0 && Math.min(...selectedRowIndexes) > 0 && Math.max(...selectedRowIndexes) >= rows.length - 2;
    const alignRight = (selection?.operBgngHour ?? 0) >= 13;
    const capacityLimit = selection ? Math.min(...selection.gateNos.map((gateNo) => gates.find((gate) => gate.no === gateNo)?.scshCntom ?? 0)) : 0;
    const isOverCapacity = capacityLimit > 0 && draftCount > capacityLimit;

    return (
        <div className="scgrid">
            <div className="scgrid__head">
                <p className="scgrid__title">
                    출국장별 검색대
                    <span className="scgrid__hint">칸을 끌어 여러 출국장 · 여러 시간을 한 번에 맞춥니다</span>
                </p>
            </div>

            <div className="scgrid__body">
                {rows.map((row, index) => (
                    <div key={row.gate.no} className={`scgrid__ln${selected === row.gate.no ? ' is-sel' : ''}`}>
                        <button
                            type="button"
                            className={`scgrid__lbl${row.gate.off ? ' is-off' : ''}`}
                            disabled={disabled}
                            onClick={() => onLabelClick(row.gate.no)}
                        >
                            <i className="scgrid__bar" style={row.gate.off ? undefined : { background: `var(--${row.gate.color})` }} />
                            {row.gate.no}번
                        </button>

                        <div className="scgrid__row">
                            {row.counts.map((count, hour) =>
                                count === null ? (
                                    <span key={hour} className="sccell is-off" aria-hidden="true" />
                                ) : (
                                    <button
                                        key={hour}
                                        type="button"
                                        className={`sccell${count === 0 ? ' is-zero' : ''}${
                                            toRampStep(count, rampMax) >= RAMP_INVERT ? ' is-hi' : ''
                                        }${isPicked(index, hour) ? ' is-pick' : ''}`}
                                        style={count > 0 ? { background: RAMP[toRampStep(count, rampMax)] } : undefined}
                                        disabled={disabled}
                                        title={`${row.gate.no}번 출국장 · ${formatHour(hour)} · 검색대 ${count}대`}
                                        onPointerDown={(event) => {
                                            event.preventDefault();
                                            startDrag(index, hour);
                                        }}
                                        onPointerEnter={() => moveDrag(index, hour)}
                                    >
                                        {count}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>
                ))}

                <div className="scgrid__ln scgrid__sum">
                    <span className="scgrid__lbl scgrid__lbl--sum">합계</span>

                    <div className="scgrid__row">
                        {sums.map((sum, hour) => (
                            <span
                                key={hour}
                                className={`sccell${sum > 0 && sum === sumPeak ? ' is-pk' : ''}${
                                    toRampStep(sum, Math.max(1, sumPeak)) >= RAMP_INVERT ? ' is-hi' : ''
                                }`}
                                style={
                                    sum > 0
                                        ? {
                                              background: RAMP[toRampStep(sum, Math.max(1, sumPeak))],
                                          }
                                        : undefined
                                }
                            >
                                {sum > 0 ? sum : ''}
                            </span>
                        ))}
                    </div>
                </div>

                {selection && !disabled && (
                    <div
                        ref={popRef}
                        className={`scgrid__pop${isOverCapacity ? ' is-over' : ''}`}
                        style={{
                            top: openUpward ? Math.min(...selectedRowIndexes) * ROW_H - 6 : (Math.max(...selectedRowIndexes) + 1) * ROW_H + 6,
                            transform: openUpward ? 'translateY(-100%)' : undefined,
                            ...(alignRight
                                ? {
                                      right: `calc(var(--rgt) + var(--col) * ${24 - selection.operEndHour})`,
                                  }
                                : {
                                      left: `calc(var(--gut) + var(--col) * ${selection.operBgngHour})`,
                                  }),
                        }}
                    >
                        <span className="scgrid__poplbl">
                            {selection.gateNos.length === 1 ? `${selection.gateNos[0]}번 출국장` : `출국장 ${selection.gateNos.length}개`}
                            <b>{`${formatHour(selection.operBgngHour)} ~ ${formatHour(selection.operEndHour)}`}</b>
                        </span>

                        <CountStepper label="검색대" variant="inline" value={draftCount} onChange={setDraftCount} />

                        <button type="button" className="scgrid__apply" disabled={isOverCapacity} onClick={apply}>
                            적용
                        </button>

                        {isOverCapacity && <span className="scgrid__warn">{`보유 ${capacityLimit}대 초과`}</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
