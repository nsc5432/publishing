import { TimeRangeSelector, type TimeRange } from '@/components/ui/time-range-selector';
import { isHourInRanges } from '@/lib/time-range';

interface TimeBarProps {
    label: string;
    ranges: TimeRange[];
    onChange: (ranges: TimeRange[]) => void;
    values?: Record<number, number>;
    disabled?: boolean;
}

/**
 * 드로어의 24슬롯 운영시간 바 — 체크인 카운터 / 출국장 공용.
 */
export function TimeBar({ label, ranges, onChange, values, disabled = false }: TimeBarProps) {
    return (
        <TimeRangeSelector
            label={label}
            ranges={ranges}
            onChange={onChange}
            disabled={disabled}
            className={values ? 'timebar--valued' : undefined}
            renderSlot={
                values
                    ? (hour) =>
                          isHourInRanges(hour, ranges) && values[hour] != null ? (
                              <b>{values[hour]}</b>
                          ) : null
                    : undefined
            }
        />
    );
}
