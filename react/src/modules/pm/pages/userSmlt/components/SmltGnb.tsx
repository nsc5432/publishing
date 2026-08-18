import { useRef, type ReactNode } from 'react';
import { CalendarIcon, PlayIcon, SearchWhiteIcon } from '@/components/icons';
import { formatYmd, toDateInputValue, toYmd } from '@/lib/format';

interface SmltGnbProps {
    title: string;
    /** 기준일자 (yyyyMMdd) */
    ymd: string;
    /** 가운데 단계 스테퍼 (터미널을 고르기 전에는 넘기지 않는다) */
    steps?: ReactNode;
    /** 조회 전용으로 들어왔을 때 돌아갈 길 — 넘기면 타이틀 앞에 링크가 붙는다 */
    onBack?: () => void;
    /** 조회 전용이면 넘기지 않는다 (기준일자를 고를 일이 없다) */
    onDateChange?: (ymd: string) => void;
    /** 조회 전용이면 넘기지 않는다 (조건을 다시 부를 일이 없다) */
    onSearch?: () => void;
    onRun?: () => void;
    onHistory?: () => void;
}

/** 상단 GNB — 타이틀 / 단계 스테퍼 / 기준일자 · 시뮬레이션 실행·이력 */
export function SmltGnb({
    title,
    ymd,
    steps,
    onBack,
    onDateChange,
    onSearch,
    onRun,
    onHistory,
}: SmltGnbProps) {
    const dateRef = useRef<HTMLInputElement>(null);

    // 날짜 표기는 디자인대로 두고, 달력은 투명하게 겹친 input[type=date] 를 통해 연다.
    // (showPicker 가 없는 브라우저는 입력에 포커스만 주고 브라우저 기본 동작에 맡긴다)
    const handleOpenCalendar = () => {
        if (!onDateChange) return;

        const input = dateRef.current;
        if (!input) return;

        if (typeof input.showPicker === 'function') input.showPicker();
        else input.focus();
    };

    return (
        <header className="gnb">
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
                        <button
                            type="button"
                            className="date-picker__btn"
                            disabled={!onDateChange}
                            onClick={handleOpenCalendar}
                        >
                            <CalendarIcon className="date-picker__icon" aria-hidden="true" />
                            <span className="date-picker__value">{formatYmd(ymd)}</span>
                        </button>
                        {onDateChange && (
                            <input
                                ref={dateRef}
                                type="date"
                                className="date-picker__input"
                                value={toDateInputValue(ymd)}
                                aria-label="기준일자"
                                tabIndex={-1}
                                onChange={(event) => onDateChange(toYmd(event.target.value))}
                            />
                        )}
                    </div>
                    {onSearch && (
                        <button type="button" className="date-picker__search" onClick={onSearch}>
                            <SearchWhiteIcon aria-hidden="true" />
                            <span className="blind">검색</span>
                        </button>
                    )}
                </div>

                {onRun && (
                    <>
                        <button type="button" className="btn btn--run" onClick={onRun}>
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
