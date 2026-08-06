import { TimeRangeSelector, type TimeRange } from '@/components/ui/time-range-selector';

interface TimeBarProps {
    /** 선택 범위 안내 라벨 (예: 운영시간 / 선택 범위) */
    label: string;
    ranges: TimeRange[];
    onChange: (ranges: TimeRange[]) => void;
    /**
     * 운영 슬롯 안에 찍을 값 — `{ 시각: 값 }`.
     * 출국장 드로어의 '시간대별 보안검색대 대수' 표현에 쓴다.
     */
    values?: Record<number, number>;
    disabled?: boolean;
}

/** 시각이 선택 구간 안에 드는지 */
function isOn(hour: number, ranges: TimeRange[]): boolean {
    return ranges.some((range) => hour >= range.start && hour < range.end);
}

/**
 * 드로어의 24슬롯 운영시간 바 — 체크인 카운터 / 출국장 공용.
 * (design-renewal/mock.js 의 timebar() 이식)
 *
 * 드래그 선택 로직은 이미 공용 TimeRangeSelector 가 갖고 있으므로 그대로 쓰고,
 * 시안이 추가한 '슬롯 안 숫자' 변형만 여기서 얹는다.
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
                          isOn(hour, ranges) && values[hour] != null ? <b>{values[hour]}</b> : null
                    : undefined
            }
        />
    );
}
