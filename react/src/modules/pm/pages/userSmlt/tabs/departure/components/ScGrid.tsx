import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CountStepper } from '../../../components/CountStepper';
import { formatHour, toHourList } from '../../../format';
import type { DepartureGate } from '../types';

interface ScGridProps {
    /** 출국장 전체 — 미운영 포함. 이 배열 순서가 줄 순서이자 위 차트의 층 순서다 */
    gates: DepartureGate[];
    /** 출국장 번호 → 24칸 검색대 대수 */
    value: Record<number, number[]>;
    onChange: (next: Record<number, number[]>) => void;

    /** 강조할 줄 — 위 차트 blockSelect 와 양방향 */
    selected: number | null;
    onSelect: (no: number | null) => void;
    /** 줄 라벨 클릭 → 출국장 속성 드로어 */
    onLabelClick: (no: number) => void;

    disabled?: boolean;
}

/** 사각형 드래그 선택 — 미운영(빗금) 칸은 자동으로 빠진다 */
interface CellRect {
    gateNos: number[];
    operBgngHour: number;
    operEndHour: number; // 미포함
}

/** 드래그 중인 칸 자리 */
interface Cursor {
    row: number;
    hour: number;
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
/** 값이 아직 없는 출국장 — 새 배열을 매번 만들지 않도록 하나를 돌려 쓴다(읽기 전용) */
const EMPTY_HOURS: readonly number[] = Array<number>(24).fill(0);

/** 셀 높이 20px + 줄 간격 1px. 팝오버 세로 위치가 이 값을 쓴다 (userSmlt.css 와 같아야 한다) */
const ROW_H = 21;
/**
 * 값 농도 — 출국장 색이 아니라 하나의 순차 램프다.
 * 서로 다른 색의 4와 5는 눈으로 비교되지 않는다. 격자 전체가 히트맵으로 읽히게 한다.
 */
const RAMP = ['#e8e7f8', '#cbcaef', '#aaa8e5', '#8481db', '#5b58d6', '#403dbb'];
/** 이 단계부터는 바탕이 진해 글자를 흰색으로 뒤집는다 */
const RAMP_INVERT = 3;

/** 값 → 램프 단계 (rampMax 는 그 격자에서 가장 큰 값) */
function toRampStep(count: number, rampMax: number): number {
    if (count <= 0) return 0;

    return Math.min(RAMP.length - 1, Math.max(0, Math.ceil((count / rampMax) * RAMP.length) - 1));
}

/**
 * 출국장 × 24시간 검색대 격자 — 조회면서 동시에 입력기다.
 *
 * 위 블럭 차트와 같은 시간 좌표(--gut / --col / --rgt)를 쓰는 DOM 격자라
 * 08시 블럭 바로 아래에 08시 칸이 선다. 줄은 출국장 전체로 고정이고,
 * 그 시간에 닫힌 출국장은 빗금 칸으로 자리를 지킨다.
 */
export function ScGrid({
    gates,
    value,
    onChange,
    selected,
    onSelect,
    onLabelClick,
    disabled = false,
}: ScGridProps) {
    /** 드래그 시작 칸 · 현재 칸 — 둘 다 있으면 그 사각형이 선택 중이다 */
    const [dragAnchor, setDragAnchor] = useState<Cursor | null>(null);
    const [dragCursor, setDragCursor] = useState<Cursor | null>(null);
    /** 드래그가 끝나 확정된 선택 — 팝오버가 이 위에 붙는다 */
    const [selection, setSelection] = useState<CellRect | null>(null);
    /** 팝오버 스테퍼 값 (`적용` 을 눌러야 격자에 반영된다) */
    const [draftCount, setDraftCount] = useState(0);
    /** 팝오버 바깥을 눌렀는지 가리는 기준 */
    const popRef = useRef<HTMLDivElement>(null);

    /** 줄마다 24칸 — null 은 미운영(빗금)이라 값을 넣을 수 없다 */
    const rows = useMemo(
        () =>
            gates.map((gate) => {
                const openHours = new Set(gate.off ? [] : toHourList(gate.ranges));
                const countsByHour = value[gate.no] ?? EMPTY_HOURS;
                const counts = HOURS.map((hour) =>
                    openHours.has(hour) ? (countsByHour[hour] ?? 0) : null,
                );

                return { gate, counts, peak: Math.max(0, ...counts.map((count) => count ?? 0)) };
            }),
        [gates, value],
    );

    const sums = useMemo(
        () => HOURS.map((hour) => rows.reduce((sum, row) => sum + (row.counts[hour] ?? 0), 0)),
        [rows],
    );
    /** 램프 기준값 — 칸 농도는 그 격자 안에서 가장 큰 값에 맞춘다 (0 나눗셈을 막아 1로 받친다) */
    const rampMax = Math.max(1, ...rows.map((row) => row.peak));
    const sumPeak = Math.max(0, ...sums);

    /** 드래그 중인 사각형 (행/시각 인덱스) */
    const dragRect = useMemo(
        () =>
            dragAnchor && dragCursor
                ? {
                      firstRow: Math.min(dragAnchor.row, dragCursor.row),
                      lastRow: Math.max(dragAnchor.row, dragCursor.row),
                      firstHour: Math.min(dragAnchor.hour, dragCursor.hour),
                      lastHour: Math.max(dragAnchor.hour, dragCursor.hour),
                  }
                : null,
        [dragAnchor, dragCursor],
    );

    /** 드래그를 놓는다 — 사각형 안에서 운영 중인 줄만 선택으로 남긴다 */
    const finishDrag = useCallback(() => {
        setDragAnchor(null);
        setDragCursor(null);
        if (!dragRect) return;

        const selectedRows = rows
            .slice(dragRect.firstRow, dragRect.lastRow + 1)
            .filter((row) =>
                row.counts
                    .slice(dragRect.firstHour, dragRect.lastHour + 1)
                    .some((count) => count !== null),
            );

        if (selectedRows.length === 0) {
            setSelection(null);
            onSelect(null);

            return;
        }

        setSelection({
            gateNos: selectedRows.map((row) => row.gate.no),
            operBgngHour: dragRect.firstHour,
            operEndHour: dragRect.lastHour + 1,
        });
        // 스테퍼는 선택 안에서 처음 만나는 값으로 연다
        setDraftCount(
            selectedRows[0]?.counts
                .slice(dragRect.firstHour, dragRect.lastHour + 1)
                .find((count) => count !== null) ?? 0,
        );
        // 한 줄만 잡았으면 그 출국장을 위 차트에도 켠다
        onSelect(selectedRows.length === 1 ? (selectedRows[0]?.gate.no ?? null) : null);
    }, [dragRect, rows, onSelect]);

    // 격자 밖에서 손을 떼도 드래그가 끝나야 한다
    useEffect(() => {
        if (!dragAnchor) return undefined;

        window.addEventListener('pointerup', finishDrag);

        return () => window.removeEventListener('pointerup', finishDrag);
    }, [dragAnchor, finishDrag]);

    // Esc 로 선택 해제
    useEffect(() => {
        if (!selection) return undefined;

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setSelection(null);
        };
        window.addEventListener('keydown', handleKey);

        return () => window.removeEventListener('keydown', handleKey);
    }, [selection]);

    // 팝오버 밖을 왼쪽 버튼으로 누르면 닫는다
    // (격자 칸을 다시 잡은 경우라면 startDrag 가 곧바로 새 선택을 연다)
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

    // 조회/터미널이 바뀌어 줄이 갈리면 남은 선택은 버린다
    useEffect(() => {
        setSelection(null);
    }, [gates]);

    const isPicked = (row: number, hour: number): boolean => {
        if (dragRect) {
            return (
                row >= dragRect.firstRow &&
                row <= dragRect.lastRow &&
                hour >= dragRect.firstHour &&
                hour <= dragRect.lastHour
            );
        }
        if (!selection) return false;

        const gateNo = rows[row]?.gate.no;

        return (
            gateNo != null &&
            selection.gateNos.includes(gateNo) &&
            hour >= selection.operBgngHour &&
            hour < selection.operEndHour
        );
    };

    const startDrag = (row: number, hour: number) => {
        if (disabled) return;

        setSelection(null);
        setDragAnchor({ row, hour });
        setDragCursor({ row, hour });
    };

    /** 선택한 칸을 전부 같은 대수로 맞춘다 */
    const apply = () => {
        if (!selection) return;

        const nextCountsByGate = { ...value };
        selection.gateNos.forEach((gateNo) => {
            const row = rows.find((candidate) => candidate.gate.no === gateNo);
            if (!row) return;

            const countsByHour = [...(value[gateNo] ?? EMPTY_HOURS)];
            for (let hour = selection.operBgngHour; hour < selection.operEndHour; hour += 1) {
                // 미운영 칸은 건드리지 않는다
                if (row.counts[hour] !== null) countsByHour[hour] = draftCount;
            }
            nextCountsByGate[gateNo] = countsByHour;
        });

        onChange(nextCountsByGate);
        setSelection(null);
    };

    /** 선택한 사각형이 걸친 줄 번호 — 팝오버가 이 위·아래에 붙는다 */
    const selectedRowIndexes = selection
        ? selection.gateNos.map((gateNo) => gates.findIndex((gate) => gate.no === gateNo))
        : [];
    /** 아래 두 줄이면 격자 밖으로 밀려나므로 선택 위로 띄운다 */
    const openUpward =
        selectedRowIndexes.length > 0 && Math.max(...selectedRowIndexes) >= rows.length - 2;
    /** 오른쪽 끝 시간대는 왼쪽으로 넘치므로 오른쪽 끝에 맞춰 붙인다 */
    const alignRight = (selection?.operBgngHour ?? 0) >= 13;
    /** 보유 합계 — 여러 줄을 잡았으면 가장 적게 가진 출국장이 상한이다 (0 은 미입력이라 상한으로 보지 않는다) */
    const capacityLimit = selection
        ? Math.min(
              ...selection.gateNos.map(
                  (gateNo) => gates.find((gate) => gate.no === gateNo)?.scshCntom ?? 0,
              ),
          )
        : 0;
    const isOverCapacity = capacityLimit > 0 && draftCount > capacityLimit;

    return (
        <div className="scgrid">
            <div className="scgrid__head">
                <p className="scgrid__title">
                    출국장별 검색대
                    <span className="scgrid__hint">
                        칸을 끌어 여러 출국장 · 여러 시간을 한 번에 맞춥니다
                    </span>
                </p>
            </div>

            <div className="scgrid__body">
                {rows.map((row, index) => (
                    <div
                        key={row.gate.no}
                        className={`scgrid__ln${selected === row.gate.no ? ' is-sel' : ''}`}
                    >
                        <button
                            type="button"
                            className={`scgrid__lbl${row.gate.off ? ' is-off' : ''}`}
                            disabled={disabled}
                            onClick={() => onLabelClick(row.gate.no)}
                        >
                            <i
                                className="scgrid__bar"
                                style={
                                    row.gate.off
                                        ? undefined
                                        : { background: `var(--${row.gate.color})` }
                                }
                            />
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
                                            toRampStep(count, rampMax) >= RAMP_INVERT
                                                ? ' is-hi'
                                                : ''
                                        }${isPicked(index, hour) ? ' is-pick' : ''}`}
                                        style={
                                            count > 0
                                                ? { background: RAMP[toRampStep(count, rampMax)] }
                                                : undefined
                                        }
                                        disabled={disabled}
                                        title={`${row.gate.no}번 출국장 · ${formatHour(hour)} · 검색대 ${count}대`}
                                        onPointerDown={(event) => {
                                            event.preventDefault();
                                            startDrag(index, hour);
                                        }}
                                        onPointerEnter={() => {
                                            if (dragAnchor) setDragCursor({ row: index, hour });
                                        }}
                                    >
                                        {count}
                                    </button>
                                ),
                            )}
                        </div>

                        <span className="scgrid__pk">{row.gate.off ? '—' : row.peak}</span>
                    </div>
                ))}

                {/* 합계 줄 — 농도까지 입혀 그 줄 자체가 24칸짜리 막대그래프로 읽힌다 */}
                <div className="scgrid__ln scgrid__sum">
                    <span className="scgrid__lbl scgrid__lbl--sum">합계</span>

                    <div className="scgrid__row">
                        {sums.map((sum, hour) => (
                            <span
                                key={hour}
                                className={`sccell${sum > 0 && sum === sumPeak ? ' is-pk' : ''}${
                                    toRampStep(sum, Math.max(1, sumPeak)) >= RAMP_INVERT
                                        ? ' is-hi'
                                        : ''
                                }`}
                                style={
                                    sum > 0
                                        ? {
                                              background:
                                                  RAMP[toRampStep(sum, Math.max(1, sumPeak))],
                                          }
                                        : undefined
                                }
                            >
                                {sum > 0 ? sum : ''}
                            </span>
                        ))}
                    </div>

                    <span className="scgrid__pk scgrid__pk--sum">{sumPeak}</span>
                </div>

                {selection && !disabled && (
                    <div
                        ref={popRef}
                        className={`scgrid__pop${isOverCapacity ? ' is-over' : ''}`}
                        style={{
                            top: openUpward
                                ? Math.min(...selectedRowIndexes) * ROW_H - 6
                                : (Math.max(...selectedRowIndexes) + 1) * ROW_H + 6,
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
                            {selection.gateNos.length === 1
                                ? `${selection.gateNos[0]}번 출국장`
                                : `출국장 ${selection.gateNos.length}개`}
                            <b>{`${formatHour(selection.operBgngHour)} ~ ${formatHour(selection.operEndHour)}`}</b>
                        </span>

                        <CountStepper
                            label="검색대"
                            variant="inline"
                            value={draftCount}
                            onChange={setDraftCount}
                        />

                        <button
                            type="button"
                            className="scgrid__apply"
                            disabled={isOverCapacity}
                            onClick={apply}
                        >
                            적용
                        </button>

                        {isOverCapacity && (
                            <span className="scgrid__warn">{`보유 ${capacityLimit}대 초과`}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
