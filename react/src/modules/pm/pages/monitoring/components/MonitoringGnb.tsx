import { PillSelect } from '@/components/ui/pill-select';
import { Icon } from '@/modules/pm/pages/dashboard/components/PmIcons';
import { HOUR_OPTIONS, MINUTE_OPTIONS } from '../mock';
import type { RangeCondition } from '../types';

interface MonitoringGnbProps {
    title: string;
    range: RangeCondition;
    onChange: (range: RangeCondition) => void;
    onSearch: () => void;
}

/** 시작일시 / 종료일시 한 벌 (날짜 + 시 + 분) */
function DateTimeField({
    label,
    date,
    hour,
    minute,
    onHourChange,
    onMinuteChange,
}: {
    label: string;
    date: string;
    hour: string;
    minute: string;
    onHourChange: (v: string) => void;
    onMinuteChange: (v: string) => void;
}) {
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

/**
 * 상단 GNB — 화면 제목 / 조회 기간(시작일시 ~ 종료일시).
 * 대시보드 상단 바(.datebox)와 같은 조합을 두 벌로 늘린 형태라
 * 시/분 드롭다운은 화면 공용 PillSelect 를 그대로 쓴다.
 */
export function MonitoringGnb({ title, range, onChange, onSearch }: MonitoringGnbProps) {
    const set = (patch: Partial<RangeCondition>) => onChange({ ...range, ...patch });

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
                        onHourChange={(startHour) => set({ startHour })}
                        onMinuteChange={(startMinute) => set({ startMinute })}
                    />

                    <span className="datebox__tilde" aria-hidden="true">
                        ~
                    </span>

                    <DateTimeField
                        label="종료일시"
                        date={range.endDate}
                        hour={range.endHour}
                        minute={range.endMinute}
                        onHourChange={(endHour) => set({ endHour })}
                        onMinuteChange={(endMinute) => set({ endMinute })}
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
