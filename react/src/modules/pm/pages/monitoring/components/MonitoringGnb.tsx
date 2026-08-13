import { PillSelect } from '@/components/ui/pill-select';
import { Icon } from '@/components/icons/InlineIcon';
import { HOUR_OPTIONS, MINUTE_OPTIONS } from '@/lib/format';
import type { RangeCondition } from '../types';

interface MonitoringGnbProps {
    title: string;
    range: RangeCondition;
    onChange: (range: RangeCondition) => void;
    onSearch: () => void;
}

interface DateTimeFieldProps {
    label: string;
    date: string;
    hour: string;
    minute: string;
    onHourChange: (hour: string) => void;
    onMinuteChange: (minute: string) => void;
}

/** 시작일시 / 종료일시 한 벌 (날짜 + 시 + 분) */
function DateTimeField({
    label,
    date,
    hour,
    minute,
    onHourChange,
    onMinuteChange,
}: DateTimeFieldProps) {
    return (
        <>
            <span className="lbl">{label}</span>
            <Icon name="calendar" className="cal" />
            <span className="val">{date}</span>
            <PillSelect value={hour} options={HOUR_OPTIONS} unit="시" onChange={onHourChange} />
            <PillSelect
                value={minute}
                options={MINUTE_OPTIONS}
                unit="분"
                onChange={onMinuteChange}
            />
        </>
    );
}

export function MonitoringGnb({ title, range, onChange, onSearch }: MonitoringGnbProps) {
    const patchRange = (patch: Partial<RangeCondition>) => onChange({ ...range, ...patch });

    return (
        <header className="gnb">
            <h1 className="gnb__title">{title}</h1>

            <div className="gnb__center">
                <div className="datebox">
                    <DateTimeField
                        label="시작일시"
                        date={range.startDate}
                        hour={range.startHour}
                        minute={range.startMinute}
                        onHourChange={(startHour) => patchRange({ startHour })}
                        onMinuteChange={(startMinute) => patchRange({ startMinute })}
                    />

                    <span className="datebox__tilde" aria-hidden="true">
                        ~
                    </span>

                    <DateTimeField
                        label="종료일시"
                        date={range.endDate}
                        hour={range.endHour}
                        minute={range.endMinute}
                        onHourChange={(endHour) => patchRange({ endHour })}
                        onMinuteChange={(endMinute) => patchRange({ endMinute })}
                    />

                    <button type="button" className="search-btn" onClick={onSearch}>
                        <Icon name="search" />
                        <span className="blind">조회</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
