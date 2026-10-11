import { useRef, type ReactNode } from 'react';
import { CalendarIcon, PlayIcon, SearchWhiteIcon } from '@/components/icons';
import { formatYmd, toDateInputValue, toYmd } from '@/lib/format';

interface SmltGnbProps {
    title: string;

    ymd: string;

    steps?: ReactNode;

    onBack?: () => void;

    onDateChange?: (ymd: string) => void;

    onSearch?: () => void;
    onRun?: () => void;
    busy?: boolean;
    saveDt?: string;
    onHistory?: () => void;
}

export function SmltGnb({ title, ymd, steps, onBack, onDateChange, onSearch, onRun, busy, saveDt, onHistory }: SmltGnbProps) {
    const dateRef = useRef<HTMLInputElement>(null);

    const handleOpenCalendar = () => {
        if (!onDateChange) return;

        const input = dateRef.current;
        if (!input) return;

        if (typeof input.showPicker === 'function') input.showPicker();
        else input.focus();
    };

    return (
        <header
            className="gnb"
            title={
                saveDt
                    ? `최근 저장: ${saveDt.slice(0, 4)}-${saveDt.slice(4, 6)}-${saveDt.slice(6, 8)} ${saveDt.slice(8, 10)}:${saveDt.slice(10, 12)}`
                    : undefined
            }
        >
            {onBack && (
                <button type="button" className="gnb__back" onClick={onBack}>
                    ← 결과 화면으로
                </button>
            )}

            <h1 className="gnb__title">{title}</h1>

            <div className="gnb__center">{steps}</div>

            <div className="gnb__right">
                <div className="date-picker">
                    <span className="date-picker__label">기준일자</span>
                    <div className="date-picker__field">
                        <button type="button" className="date-picker__btn" disabled={!onDateChange || busy} onClick={handleOpenCalendar}>
                            <CalendarIcon className="date-picker__icon" aria-hidden="true" />
                            <span className="date-picker__value">{formatYmd(ymd)}</span>
                        </button>
                        {onDateChange && (
                            <input
                                ref={dateRef}
                                type="date"
                                disabled={busy}
                                className="date-picker__input"
                                value={toDateInputValue(ymd)}
                                aria-label="기준일자"
                                tabIndex={-1}
                                onChange={(event) => onDateChange(toYmd(event.target.value))}
                            />
                        )}
                    </div>
                    {onSearch && (
                        <button type="button" className="date-picker__search" onClick={onSearch} disabled={busy}>
                            <SearchWhiteIcon aria-hidden="true" />
                            <span className="blind">검색</span>
                        </button>
                    )}
                </div>

                {onRun && (
                    <>
                        <button type="button" className="btn btn--run" onClick={onRun} disabled={busy}>
                            <PlayIcon aria-hidden="true" />
                            <span>시뮬레이션 실행</span>
                        </button>
                        <button type="button" className="gnb__link" onClick={onHistory}>
                            시뮬레이션 이력
                        </button>
                    </>
                )}
            </div>
        </header>
    );
}
