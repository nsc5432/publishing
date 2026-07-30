import { CalendarIcon, PlayIcon, SearchWhiteIcon } from '@/components/icons';

interface SmltGnbProps {
    /** 화면 타이틀 */
    title: string;
    /** 기준일자 (예: 2024/10/23) */
    baseDate: string;
    /** 기준일자 조회 */
    onSearch: () => void;
    /** 시뮬레이션 실행 */
    onRun: () => void;
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

            <div className="gnb__right">
                <button type="button" className="btn btn--run" onClick={onRun}>
                    <PlayIcon aria-hidden="true" />
                    <span>시뮬레이션 실행</span>
                </button>
                <a href="#" className="gnb__link">
                    시뮬레이션 이력
                </a>
            </div>
        </header>
    );
}
