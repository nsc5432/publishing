import type { ReactNode } from 'react';
import { CalendarIcon, PlayIcon, SearchWhiteIcon } from '@/components/icons';

interface SmltGnbProps {
    title: string;
    baseDate: string;
    /** 가운데 단계 스테퍼 (터미널을 고르기 전에는 넘기지 않는다) */
    steps?: ReactNode;
    /** 조회 전용으로 들어왔을 때 돌아갈 길 — 넘기면 타이틀 앞에 링크가 붙는다 */
    onBack?: () => void;
    /** 조회 전용이면 넘기지 않는다 (조건을 다시 부를 일이 없다) */
    onSearch?: () => void;
    onRun?: () => void;
}

/** 상단 GNB — 타이틀 / 단계 스테퍼 / 기준일자 · 시뮬레이션 실행·이력 */
export function SmltGnb({ title, baseDate, steps, onBack, onSearch, onRun }: SmltGnbProps) {
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
                    <CalendarIcon className="date-picker__icon" aria-hidden="true" />
                    <span className="date-picker__value">{baseDate}</span>
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
                        <a href="#" className="gnb__link">
                            시뮬레이션 이력
                        </a>
                    </>
                )}
            </div>
        </header>
    );
}
