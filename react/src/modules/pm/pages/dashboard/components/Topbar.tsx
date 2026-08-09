import { useState } from 'react';
import { PillSelect } from '@/components/ui/pill-select';
import { Icon } from './PmIcons';
import { HOUR_OPTIONS, MINUTE_OPTIONS } from '../mock';
import { SIMULATION_LABEL, type SimulationType } from '../types';

interface TopbarProps {
    simulationType: SimulationType;
    baseDate: string;
    hour: string;
    minute: string;
    lastCalc: string;
    nextCalc: string;
}

/**
 * 대시보드 상단 바 — 화면 제목 / 조회 조건 / 계산 시각.
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
