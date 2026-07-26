'use client';

import { TimePicker } from '@/components/ui/time-picker';
import { cn } from '@/lib/utils';

export interface TimeRange {
    start?: Date;
    end?: Date;
}

export interface TimeRangePickerProps {
    value?: TimeRange;
    onChange?: (range: TimeRange) => void;
    disabled?: boolean;
    className?: string;
    startPlaceholder?: string;
    endPlaceholder?: string;
}

function TimeRangePicker({
    value,
    onChange,
    disabled,
    className,
    startPlaceholder = '시작 시간',
    endPlaceholder = '종료 시간',
}: TimeRangePickerProps) {
    const handleStartChange = (date: Date | undefined) => {
        onChange?.({
            start: date,
            end: value?.end,
        });
    };

    const handleEndChange = (date: Date | undefined) => {
        onChange?.({
            start: value?.start,
            end: date,
        });
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <TimePicker
                value={value?.start}
                onChange={handleStartChange}
                disabled={disabled}
                placeholder={startPlaceholder}
            />
            <span className="text-muted-foreground">~</span>
            <TimePicker
                value={value?.end}
                onChange={handleEndChange}
                disabled={disabled}
                placeholder={endPlaceholder}
            />
        </div>
    );
}

export { TimeRangePicker };
