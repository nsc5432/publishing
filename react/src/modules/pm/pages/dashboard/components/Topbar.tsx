import { useRef } from 'react';
import { PillSelect } from '@/components/ui/pill-select';
import { Icon } from '@/components/icons/InlineIcon';
import { HOUR_OPTIONS, MINUTE_OPTIONS, formatYmd, toDateInputValue, toYmd } from '@/lib/format';
import { SIMULATION_LABEL, SIMULATION_TITLE, type SimulationType } from '../types';

/** 사용자 시뮬레이션을 실행한 사람 — 일일 시뮬레이션에는 없다 */
export interface Executor {
    dept: string;
    name: string;
}

interface TopbarProps {
    simulationType: SimulationType;
    /** 기준일자 (yyyyMMdd) — 달력에서 고른 값 */
    baseYmd: string;
    hour: string;
    minute: string;
    lastCalc: string;
    nextCalc: string;
    /** 사용자 시뮬레이션일 때만 넘어온다 */
    executor?: Executor;
    /** 사용자 시뮬레이션일 때만 넘어온다 — 실행에 쓴 설정 조건을 조회용으로 연다 */
    onViewConfig?: () => void;
    onDateChange: (ymd: string) => void;
    onHourChange: (hour: string) => void;
    onMinuteChange: (minute: string) => void;
    onSearch: () => void;
}

/**
 * 대시보드 상단 바 — 화면 제목 / 조회 조건 / 계산 시각.
 *
 * 조회 조건은 화면(Dashboard)이 들고 있다. 기준 정보를 받아온 뒤 값이 바뀌므로
 * 여기서 상태로 복사해 두면 서버 응답보다 앞서 그린 초기값에 그대로 묶인다.
 */
export function Topbar({
    simulationType,
    baseYmd,
    hour,
    minute,
    lastCalc,
    nextCalc,
    executor,
    onViewConfig,
    onDateChange,
    onHourChange,
    onMinuteChange,
    onSearch,
}: TopbarProps) {
    const dateRef = useRef<HTMLInputElement>(null);

    const isUserSmlt = simulationType === 'user';

    // 날짜 입력은 디자인대로 보이도록 투명하게 겹쳐 두고, 달력은 여기서 직접 연다.
    // (showPicker 가 없는 브라우저는 입력에 포커스만 주고 브라우저 기본 동작에 맡긴다)
    const handleOpenCalendar = () => {
        if (isUserSmlt) return;

        const input = dateRef.current;
        if (!input) return;

        if (typeof input.showPicker === 'function') input.showPicker();
        else input.focus();
    };

    return (
        <header className="topbar">
            <h1>
                PM 예측관리 <span>/ {SIMULATION_TITLE[simulationType]}</span>
            </h1>
            <div className="spacer" />

            <div className="datebox">
                <span className="lbl">기준일자</span>

                {/* 사용자 시뮬레이션은 실행할 때 정한 일자의 결과라 기준일자를 바꿀 수 없다
                    (시/분은 그 결과 안에서 고르는 값이라 그대로 열어 둔다) */}
                <div className="datepick">
                    <button
                        type="button"
                        className="datepick__btn"
                        disabled={isUserSmlt}
                        onClick={handleOpenCalendar}
                    >
                        <Icon name="calendar" className="cal" />
                        <span className="val">{formatYmd(baseYmd)}</span>
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

                <PillSelect value={hour} options={HOUR_OPTIONS} unit="시" onChange={onHourChange} />
                <PillSelect
                    value={minute}
                    options={MINUTE_OPTIONS}
                    unit="분"
                    onChange={onMinuteChange}
                />
                <button type="button" className="search-btn" onClick={onSearch}>
                    <Icon name="search" />
                    <span className="blind">조회</span>
                </button>
            </div>

            <div className="spacer" />

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

                {onViewConfig && (
                    <button type="button" className="btn-config" onClick={onViewConfig}>
                        설정 조건 보기
                    </button>
                )}

                {/* 계산 시각은 일일 시뮬레이션에만 있다 — 사용자 시뮬레이션은 한 번 실행하고
                    끝이라 재계산 예정이 없고, 대신 그 자리에 실행자를 세운다 */}
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
