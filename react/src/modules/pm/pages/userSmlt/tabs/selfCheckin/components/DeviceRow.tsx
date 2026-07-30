import { TimeRangeSelector, type TimeRange } from '@/components/ui/time-range-selector';
import type { SelfCheckinDevice } from '../types';

interface DeviceRowProps {
    device: SelfCheckinDevice;
    /** 미운영 여부 */
    off: boolean;
    onOffChange: (off: boolean) => void;
    ranges: TimeRange[];
    onRangesChange: (ranges: TimeRange[]) => void;
    /** 비활성 터미널이면 모든 컨트롤을 잠근다 */
    disabled: boolean;
}

/**
 * 기기 1종의 운영 계획 — 미운영 체크박스 + 운영 대수 + 운영 시간 막대.
 * 원본 script.js 처럼 미운영이면 시간 막대 편집을 막고 톤을 죽인다.
 */
export function DeviceRow({
    device,
    off,
    onOffChange,
    ranges,
    onRangesChange,
    disabled,
}: DeviceRowProps) {
    return (
        <div className={`device${off ? ' is-off' : ''}`}>
            <div className="device__head">
                <h3 className="device__name">{device.name}</h3>
                <label className="checkbox">
                    <input
                        type="checkbox"
                        checked={off}
                        disabled={disabled}
                        onChange={(e) => onOffChange(e.target.checked)}
                    />
                    <span className="checkbox__mark" />
                    <span className="checkbox__text">미운영</span>
                </label>
            </div>

            <div className="device__info">
                <p className="device__line">
                    <span>운영 대수</span>
                    <strong>{off ? 0 : device.count}</strong>
                </p>
            </div>

            <TimeRangeSelector
                ranges={ranges}
                onChange={onRangesChange}
                disabled={disabled || off}
                label="선택 범위"
            />
        </div>
    );
}
