import { useRef } from 'react';
import { PillSelect } from '@/components/ui/pill-select';
import { Icon } from '@/components/icons/InlineIcon';
import { HOUR_OPTIONS, MINUTE_OPTIONS, formatYmd, toDateInputValue, toYmd } from '@/lib/format';
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
    onDateChange: (date: string) => void;
    onHourChange: (hour: string) => void;
    onMinuteChange: (minute: string) => void;
}

/** 시작일시 / 종료일시 한 벌 (날짜 + 시 + 분) */
function DateTimeField({
    label,
    date,
    hour,
    minute,
    onDateChange,
    onHourChange,
    onMinuteChange,
}: DateTimeFieldProps) {
    const dateRef = useRef<HTMLInputElement>(null);

    // 날짜 입력은 디자인대로 보이도록 투명하게 겹쳐 두고, 달력은 여기서 직접 연다.
    // (showPicker 가 없는 브라우저는 입력에 포커스만 주고 브라우저 기본 동작에 맡긴다)
    const handleOpenCalendar = () => {
        const input = dateRef.current;
        if (!input) return;

        if (typeof input.showPicker === 'function') input.showPicker();
        else input.focus();
    };

    return (
        <>
            <span className="lbl">{label}</span>
            <div className="datepick">
                <button type="button" className="datepick__btn" onClick={handleOpenCalendar}>
                    <Icon name="calendar" className="cal" />
                    <span className="val">{date}</span>
                </button>
                <input
                    ref={dateRef}
                    type="date"
                    className="datepick__input"
                    value={toDateInputValue(toYmd(date))}
                    aria-label={label}
                    tabIndex={-1}
                    onChange={(event) => onDateChange(formatYmd(toYmd(event.target.value)))}
                />
            </div>
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
                        onDateChange={(startDate) => patchRange({ startDate })}
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
                        onDateChange={(endDate) => patchRange({ endDate })}
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
