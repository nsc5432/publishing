import { useRef } from 'react';
import { Icon } from '@/components/icons/InlineIcon';
import { formatYmd, toDateInputValue, toYmd } from '@/lib/format';
import { SmltViewTabs } from '@/modules/pm/components/SmltViewTabs';
import { SIMULATION_LABEL, SIMULATION_TITLE, type SimulationType } from '../types';

export interface Executor {
    dept: string;
    name: string;
}

interface TopbarProps {
    simulationType: SimulationType;
    baseYmd: string;
    lastCalc: string;
    nextCalc: string;
    executor?: Executor; // 사용자 시뮬레이션 일때만
    onViewConfig?: () => void; // 사용자 시뮬레이션 일때만
    onDateChange: (ymd: string) => void;
    onSearch: () => void;
}

/**
 * 대시보드 상단 바 — 화면 제목 / 조회 조건 / 계산 시각.
 */
export function Topbar({
    simulationType,
    baseYmd,
    lastCalc,
    nextCalc,
    executor,
    onViewConfig,
    onDateChange,
    onSearch,
}: TopbarProps) {
    const dateRef = useRef<HTMLInputElement>(null);

    const isUserSmlt = simulationType === 'user';

    const handleOpenCalendar = () => {
        if (isUserSmlt) return;

        const input = dateRef.current;
        if (!input) return;

        if (typeof input.showPicker === 'function') input.showPicker();
        else input.focus();
    };

    return (
        <header className={`topbar${isUserSmlt ? ' topbar--user' : ''}`}>
            <h1 className="pm-title">
                PM 예측관리 <span>/ {SIMULATION_TITLE[simulationType]}</span>
            </h1>
            {isUserSmlt && <SmltViewTabs active="dashboard" ymd={baseYmd} />}
            <div className="spacer" />

            <div className="datebox">
                <span className="lbl">기준일자</span>
                <div className="datepick">
                    <button type="button" className="datepick__btn" disabled={isUserSmlt} onClick={handleOpenCalendar}>
                        <Icon name="calendar" className="cal" />
                        <span className="val">{formatYmd(baseYmd, '-')}</span>
                    </button>
                    <input
                        ref={dateRef}
                        type="date"
                        className="datepick__input"
                        value={toDateInputValue(baseYmd)}
                        aria-label="기준일자"
                        tabIndex={-1}
                        disabled={isUserSmlt}
                        onChange={(event) => onDateChange(toYmd(event.target.value))}
                    />
                </div>

                <button type="button" className="search-btn" onClick={onSearch}>
                    <Icon name="search" />
                    <span className="blind">조회</span>
                </button>
            </div>

            <div className="top-right">
                <span className="btn-primary">{SIMULATION_LABEL[simulationType]}</span>

                {executor && (
                    <div className="exec">
                        <div className="exec__item">
                            <Icon name="building" className="exec__ic" />
                            <div className="txt">
                                <div className="muted">실행 부서</div>
                                <div className="strong">{executor.dept}</div>
                            </div>
                        </div>
                        <div className="exec__item">
                            <Icon name="user" className="exec__ic" />
                            <div className="txt">
                                <div className="muted">실행자</div>
                                <div className="strong">{executor.name}</div>
                            </div>
                        </div>
                    </div>
                )}

                {isUserSmlt && onViewConfig && (
                    <button type="button" className="btn-config" onClick={onViewConfig}>
                        설정 조건 보기
                    </button>
                )}

                {!isUserSmlt && (
                    <div className="calc">
                        <Icon name="clock" className="clk" />
                        <div className="txt">
                            <div className="muted">
                                마지막 계산 <span className="strong">{lastCalc}</span>
                            </div>
                            <div className="muted">
                                재계산 예정 <span className="danger">{nextCalc}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
