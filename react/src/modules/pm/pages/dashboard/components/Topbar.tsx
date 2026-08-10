import { PillSelect } from '@/components/ui/pill-select';
import { Icon } from './PmIcons';
import { SIMULATION_LABEL, type SimulationType } from '../types';

interface TopbarProps {
    simulationType: SimulationType;
    baseDate: string;
    hour: string;
    minute: string;
    /** 선택 가능한 시 / 분 — 서버가 내려준 avlTimes 에서 뽑아 넘긴다 */
    hourOptions: string[];
    minuteOptions: string[];
    lastCalc: string;
    nextCalc: string;
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
    baseDate,
    hour,
    minute,
    hourOptions,
    minuteOptions,
    lastCalc,
    nextCalc,
    onHourChange,
    onMinuteChange,
    onSearch,
}: TopbarProps) {
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
                <PillSelect value={hour} options={hourOptions} unit="시" onChange={onHourChange} />
                <PillSelect
                    value={minute}
                    options={minuteOptions}
                    unit="분"
                    onChange={onMinuteChange}
                />
                <button type="button" className="search-btn" onClick={onSearch}>
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
