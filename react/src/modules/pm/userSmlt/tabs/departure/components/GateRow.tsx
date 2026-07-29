import { TimeRangeSelector, type TimeRange } from '@/components/ui/time-range-selector';
import type { DepartureGate } from '../types';

interface GateRowProps {
    gate: DepartureGate;
    /** 미사용 여부 */
    off: boolean;
    onOffChange: (off: boolean) => void;
    ranges: TimeRange[];
    onRangesChange: (ranges: TimeRange[]) => void;
    /** 비활성 터미널이면 모든 컨트롤을 잠근다 */
    disabled: boolean;
}

/**
 * 출국장 1개 행 — 사용/미사용 선택 + 운영 시간 막대.
 * 원본 script.js 처럼 미사용이면 시간 막대 편집을 막고 톤을 죽인다.
 */
export function GateRow({
    gate,
    off,
    onOffChange,
    ranges,
    onRangesChange,
    disabled,
}: GateRowProps) {
    return (
        <div className={`gate-row${off ? ' is-off' : ''}`}>
            <div className="gate-row__head">
                <h3 className="gate-row__name">{gate.name}</h3>
                <div className="select">
                    <select
                        aria-label={`${gate.name} 사용 여부`}
                        value={off ? 'off' : 'on'}
                        disabled={disabled}
                        onChange={(e) => onOffChange(e.target.value === 'off')}
                    >
                        <option value="on">사용</option>
                        <option value="off">미사용</option>
                    </select>
                </div>
            </div>

            <TimeRangeSelector
                ranges={ranges}
                onChange={onRangesChange}
                disabled={disabled || off}
                label="운영시간"
            />
        </div>
    );
}
