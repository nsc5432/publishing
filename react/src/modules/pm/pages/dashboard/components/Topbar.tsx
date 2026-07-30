import { useEffect, useRef, useState } from 'react';
import { Icon } from './PmIcons';
import { HOUR_OPTIONS, MINUTE_OPTIONS } from '../mock';
import { SIMULATION_LABEL, type SimulationType } from '../types';

interface TopbarProps {
    /** 시뮬레이션 버전 뱃지 텍스트 (btn-primary) */
    simulationType: SimulationType;
    /** 기준일자 (예: 2026/07/10) */
    baseDate: string;
    /** 기준 시 초기값 (예: 10) */
    hour: string;
    /** 기준 분 초기값 (예: 00) */
    minute: string;
    /** 마지막 계산 시각 */
    lastCalc: string;
    /** 재계산 예정 시각 */
    nextCalc: string;
}

/** 기준 시/분 선택 드롭다운 pill */
function PillSelect({
    value,
    options,
    unit,
    onChange,
}: {
    value: string;
    options: string[];
    unit: string;
    onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    return (
        <button
            ref={ref}
            type="button"
            className={`pill-sm${open ? ' open' : ''}`}
            onClick={() => setOpen((v) => !v)}
        >
            {value}
            <span className="caret">▾</span>
            <span className="unit">{unit}</span>
            {open && (
                <span className="pill-menu">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            className={opt === value ? 'sel' : undefined}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(opt);
                                setOpen(false);
                            }}
                        >
                            {opt}
                        </button>
                    ))}
                </span>
            )}
        </button>
    );
}

/**
 * 대시보드 상단 바 — 화면 제목 / 조회 조건 / 계산 시각.
 *
 * 헤더는 LNB 와 함께 전 화면 공용 크롬이라 다른 화면과 같은 높이로 보여야 한다.
 * 그래서 fit-to-screen 으로 축소되는 .app 밖에 두고 실제 px 로 그린다
 * (높이는 common.css 의 --pm-header-h).
 */
export function Topbar({
    simulationType,
    baseDate,
    hour,
    minute,
    lastCalc,
    nextCalc,
}: TopbarProps) {
    const [selHour, setSelHour] = useState(hour);
    const [selMinute, setSelMinute] = useState(minute);

    const handleSearch = () => {
        // 실제 조회 연동 전: 현재 선택된 조회 조건을 확인만 한다.
        console.log('[조회]', { baseDate, hour: selHour, minute: selMinute, simulationType });
    };

    return (
        <header className="topbar">
            <h1>
                PM 예측관리 <span>/ 일일 시뮬레이션 결과 조회</span>
            </h1>
            <div className="spacer" />

            <div className="datebox">
                <span className="lbl">기준일자</span>
                <Icon name="calendar" className="cal" />
                <span className="val">{baseDate}</span>
                <PillSelect
                    value={selHour}
                    options={HOUR_OPTIONS}
                    unit="시"
                    onChange={setSelHour}
                />
                <PillSelect
                    value={selMinute}
                    options={MINUTE_OPTIONS}
                    unit="분"
                    onChange={setSelMinute}
                />
                <button type="button" className="search-btn" onClick={handleSearch}>
                    <Icon name="search" />
                </button>
            </div>

            <div className="spacer" />

            <div className="top-right">
                <span className="btn-primary">{SIMULATION_LABEL[simulationType]}</span>
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
            </div>
        </header>
    );
}
