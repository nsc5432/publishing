import { useState, useCallback, useEffect, type CSSProperties, type ReactNode } from 'react';
import { formatHour, formatRanges, isHourInRanges, type TimeRange } from '@/lib/time-range';

export type { TimeRange };

interface TimeRangeSelectorProps {
    ranges: TimeRange[];
    onChange: (ranges: TimeRange[]) => void;
    disabled?: boolean;
    totalSlots?: number;
    /** 선택 범위 안내 문구의 라벨 */
    label?: string;
    /** 변형 스타일용 추가 클래스 (예: timebar--valued) */
    className?: string;
    /** 슬롯 안에 넣을 내용 — 표시할 것이 없으면 null 을 돌려준다 */
    renderSlot?: (index: number) => ReactNode;
}

/** 하단 스케일 라벨 (00:00 ~ 24:00 을 6등분한 7개) */
function buildScale(totalSlots: number): string[] {
    return Array.from({ length: 7 }, (_, tickIndex) =>
        formatHour(Math.round((totalSlots / 6) * tickIndex)),
    );
}

// 범위 계산은 인자에만 의존하므로 컴포넌트 밖에 둔다.
// (안에 두면 렌더마다 새로 만들어져 아래 useCallback 의 의존성이 매번 바뀐다)

function mergeRanges(newRange: TimeRange, existingRanges: TimeRange[]): TimeRange[] {
    const nonOverlapping = existingRanges.filter((range) => {
        return range.end <= newRange.start || range.start >= newRange.end;
    });

    const allRanges = [...nonOverlapping, newRange];
    const sorted = allRanges.sort((a, b) => a.start - b.start);
    const merged: TimeRange[] = [];

    for (const range of sorted) {
        const last = merged[merged.length - 1];

        // 넘겨받은 객체를 그대로 담으면 아래 병합에서 호출자의 상태를 고쳐버린다. 복제해서 담는다.
        if (!last || range.start > last.end) {
            merged.push({ ...range });
            continue;
        }

        last.end = Math.max(last.end, range.end);
    }

    return merged;
}

function removeRange(toRemove: TimeRange, existingRanges: TimeRange[]): TimeRange[] {
    const result: TimeRange[] = [];

    for (const range of existingRanges) {
        if (range.end <= toRemove.start || range.start >= toRemove.end) {
            result.push(range);
            continue;
        }

        if (range.start < toRemove.start) {
            result.push({ start: range.start, end: toRemove.start });
        }

        if (range.end > toRemove.end) {
            result.push({ start: toRemove.end, end: range.end });
        }
    }

    return result;
}

export function TimeRangeSelector({
    ranges,
    onChange,
    disabled = false,
    totalSlots = 24,
    label = '선택 범위',
    className,
    renderSlot,
}: TimeRangeSelectorProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const [dragEnd, setDragEnd] = useState<number | null>(null);
    const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');

    const isSlotSelected = (index: number): boolean => isHourInRanges(index, ranges);

    const handleSlotMouseDown = (index: number) => {
        if (disabled) return;

        setIsDragging(true);
        setDragStart(index);
        setDragEnd(index);
        setDragMode(isSlotSelected(index) ? 'deselect' : 'select');
    };

    const handleSlotMouseEnter = (index: number) => {
        if (!isDragging || disabled) return;
        setDragEnd(index);
    };

    const handleMouseUp = useCallback(() => {
        if (!isDragging || dragStart === null || dragEnd === null || disabled) return;

        const start = Math.min(dragStart, dragEnd);
        const end = Math.max(dragStart, dragEnd) + 1; // end는 exclusive

        const targetRange: TimeRange = { start, end };
        const mergedRanges =
            dragMode === 'deselect'
                ? removeRange(targetRange, ranges)
                : mergeRanges(targetRange, ranges);

        onChange(mergedRanges);

        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
    }, [isDragging, dragStart, dragEnd, disabled, dragMode, ranges, onChange]);

    // 전역 마우스 업 이벤트 처리 (드래그 중 마우스가 컴포넌트 밖으로 나갈 경우)
    useEffect(() => {
        if (!isDragging) return;

        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, [isDragging, handleMouseUp]);

    const getDraggedRange = (): TimeRange | null => {
        if (!isDragging || dragStart === null || dragEnd === null) return null;
        return {
            start: Math.min(dragStart, dragEnd),
            end: Math.max(dragStart, dragEnd) + 1,
        };
    };

    const draggedRange = getDraggedRange();

    const isSlotInDragRange = (index: number): boolean => {
        if (!draggedRange) return false;
        return index >= draggedRange.start && index < draggedRange.end;
    };

    const formatRangesText = (): string => formatRanges(ranges, '선택 없음');

    const slotClass = (index: number): string => {
        if (isSlotInDragRange(index)) {
            return dragMode === 'deselect'
                ? 'timebar__slot is-preview-remove'
                : 'timebar__slot is-preview-add';
        }
        return isSlotSelected(index) ? 'timebar__slot is-on' : 'timebar__slot';
    };

    return (
        <div
            className={`timebar${disabled ? ' is-disabled' : ''}${className ? ` ${className}` : ''}`}
        >
            <p className="timebar__head">
                <span className="timebar__label">{label}</span>
                <strong className="timebar__value">{formatRangesText()}</strong>
            </p>

            <div
                className="timebar__track"
                style={{ '--slots': totalSlots } as CSSProperties}
                onMouseUp={handleMouseUp}
                role="group"
                aria-label={`${label} 선택`}
            >
                {Array.from({ length: totalSlots }, (_, i) => (
                    <span
                        key={i}
                        className={slotClass(i)}
                        onMouseDown={() => handleSlotMouseDown(i)}
                        onMouseEnter={() => handleSlotMouseEnter(i)}
                    >
                        {renderSlot?.(i)}
                    </span>
                ))}
            </div>

            <div className="timebar__scale">
                {buildScale(totalSlots).map((tick) => (
                    <span key={tick}>{tick}</span>
                ))}
            </div>
        </div>
    );
}
