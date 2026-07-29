import { useState, useEffect, type CSSProperties } from 'react';

export interface TimeRange {
    start: number;
    end: number;
}

interface TimeRangeSelectorProps {
    ranges: TimeRange[];
    onChange: (ranges: TimeRange[]) => void;
    disabled?: boolean;
    totalSlots?: number;
    /** 선택 범위 안내 문구의 라벨 */
    label?: string;
}

/** 하단 스케일 라벨 (00:00 ~ 24:00 을 6등분한 7개) */
function buildScale(totalSlots: number): string[] {
    return Array.from({ length: 7 }, (_, i) => {
        const slot = Math.round((totalSlots / 6) * i);
        return `${String(slot).padStart(2, '0')}:00`;
    });
}

export function TimeRangeSelector({
    ranges,
    onChange,
    disabled = false,
    totalSlots = 24,
    label = '선택 범위',
}: TimeRangeSelectorProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const [dragEnd, setDragEnd] = useState<number | null>(null);
    const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');

    // 특정 슬롯이 선택되어 있는지 확인
    const isSlotSelected = (index: number): boolean => {
        return ranges.some((range) => index >= range.start && index < range.end);
    };

    // 범위 병합 및 정규화
    const mergeRanges = (newRange: TimeRange, existingRanges: TimeRange[]): TimeRange[] => {
        // 새 범위와 겹치지 않는 기존 범위만 유지
        const nonOverlapping = existingRanges.filter((range) => {
            return range.end <= newRange.start || range.start >= newRange.end;
        });

        // 새 범위 추가
        const allRanges = [...nonOverlapping, newRange];

        // 인접하거나 겹치는 범위 병합
        const sorted = allRanges.sort((a, b) => a.start - b.start);
        const merged: TimeRange[] = [];

        for (const range of sorted) {
            if (merged.length === 0) {
                merged.push(range);
            } else {
                const last = merged[merged.length - 1];
                if (range.start <= last.end) {
                    // 병합
                    last.end = Math.max(last.end, range.end);
                } else {
                    merged.push(range);
                }
            }
        }

        return merged;
    };

    // 선택 영역에서 범위 제거
    const removeRange = (toRemove: TimeRange, existingRanges: TimeRange[]): TimeRange[] => {
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
    };

    // 슬롯에서 드래그 시작
    const handleSlotMouseDown = (index: number) => {
        if (disabled) return;

        setIsDragging(true);
        setDragStart(index);
        setDragEnd(index);
        setDragMode(isSlotSelected(index) ? 'deselect' : 'select');
    };

    // 드래그 중 지나간 슬롯까지 범위 확장
    const handleSlotMouseEnter = (index: number) => {
        if (!isDragging || disabled) return;
        setDragEnd(index);
    };

    // 드래그 종료 — 범위 병합/제거 후 반영
    const handleMouseUp = () => {
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
    };

    // 전역 마우스 업 이벤트 처리 (드래그 중 마우스가 컴포넌트 밖으로 나갈 경우)
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDragging) {
                handleMouseUp();
            }
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [isDragging, dragStart, dragEnd]);

    // 드래그 중인 범위 계산
    const getDraggedRange = (): TimeRange | null => {
        if (!isDragging || dragStart === null || dragEnd === null) return null;
        return {
            start: Math.min(dragStart, dragEnd),
            end: Math.max(dragStart, dragEnd) + 1,
        };
    };

    const draggedRange = getDraggedRange();

    // 슬롯이 현재 드래그 중인 범위에 포함되는지 확인
    const isSlotInDragRange = (index: number): boolean => {
        if (!draggedRange) return false;
        return index >= draggedRange.start && index < draggedRange.end;
    };

    const formatRangesText = (): string => {
        if (ranges.length === 0) return '선택 없음';

        return [...ranges]
            .sort((a, b) => a.start - b.start)
            .map(
                (r) =>
                    `${String(r.start).padStart(2, '0')}:00 ~ ${String(r.end).padStart(2, '0')}:00`,
            )
            .join(', ');
    };

    const slotClass = (index: number): string => {
        if (isSlotInDragRange(index)) {
            return dragMode === 'deselect'
                ? 'timebar__slot is-preview-remove'
                : 'timebar__slot is-preview-add';
        }
        return isSlotSelected(index) ? 'timebar__slot is-on' : 'timebar__slot';
    };

    return (
        <div className={`timebar${disabled ? ' is-disabled' : ''}`}>
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
                    />
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
