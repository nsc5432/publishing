import { CalendarIcon, PlayIcon, SearchWhiteIcon } from '@/components/icons';

interface SmltGnbProps {
    /** 화면 타이틀 */
    title: string;
    /** 기준일자 (예: 2024/10/23) */
    baseDate: string;
    /** 기준일자 조회 */
    onSearch: () => void;
    /**
     * 시뮬레이션 실행.
     * 터미널을 아직 고르지 않은 도입 화면에서는 실행할 대상이 없어
     * 넘기지 않으며, 이때 실행 버튼·이력 링크를 그리지 않는다.
     */
    onRun?: () => void;
}

/** 상단 GNB — 타이틀 / 기준일자 / 시뮬레이션 실행·이력 */
export function SmltGnb({ title, baseDate, onSearch, onRun }: SmltGnbProps) {
    return (
        <header className="gnb">
            <h1 className="gnb__title">{title}</h1>

            <div className="gnb__center">
                <div className="date-picker">
                    <span className="date-picker__label">기준일자</span>
                    <CalendarIcon className="date-picker__icon" aria-hidden="true" />
                    <span className="date-picker__value">{baseDate}</span>
                    <button type="button" className="date-picker__search" onClick={onSearch}>
                        <SearchWhiteIcon aria-hidden="true" />
                        <span className="blind">검색</span>
                    </button>
                </div>
            </div>

            {onRun && (
                <div className="gnb__right">
                    <button type="button" className="btn btn--run" onClick={onRun}>
                        <PlayIcon aria-hidden="true" />
                        <span>시뮬레이션 실행</span>
                    </button>
                    <a href="#" className="gnb__link">
                        시뮬레이션 이력
                    </a>
                </div>
            )}
        </header>
    );
}
