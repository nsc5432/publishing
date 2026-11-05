import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { MAX_RATIO, MIN_RATIO, RATIO_STEP } from '../constants';
import type { HourRow } from '../types';

interface FlightEditorProps {
    ratio: number;
    onRatioChange: (ratio: number) => void;
    onHourRatioChange: (index: number, ratio: number) => void;
    rows: HourRow[];
    disabled: boolean;
    readOnly?: boolean;
}

interface RatioStepperProps {
    value: number;
    onChange: (ratio: number) => void;
    disabled: boolean;
    label: string;
    className?: string;
}

const clamp = (value: number) => Math.max(MIN_RATIO, Math.min(MAX_RATIO, value));

export function FlightEditor({ ratio, onRatioChange, onHourRatioChange, rows, disabled, readOnly }: FlightEditorProps) {
    return (
        <div className="editor">
            {!readOnly && (
                <div className="editor__opts">
                    <p className="editor__label">시간대별 승객 수</p>

                    <div className="editor__bulk">
                        <span className="editor__bulk-label">일괄 수정</span>
                        <RatioStepper value={ratio} onChange={onRatioChange} disabled={disabled} label="전체" />
                    </div>
                </div>
            )}

            <div className="table-wrap scroll-area">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th scope="col">시작시간</th>
                            <th scope="col">종료시간</th>
                            <th scope="col">승객 수</th>
                            <th scope="col">변경 승객 수</th>
                            {!readOnly && <th scope="col">수정</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={row.start}>
                                <td>{row.start}</td>
                                <td>{row.end}</td>
                                <td className="is-num">{row.pax}</td>
                                <td className="is-num">{row.adjPax}</td>
                                {!readOnly && (
                                    <td className="is-num">
                                        <RatioStepper
                                            className="stepper--row"
                                            value={row.ajmtRt}
                                            onChange={(hourRatio) => onHourRatioChange(index, hourRatio)}
                                            disabled={disabled}
                                            label={`${row.start}~${row.end}`}
                                        />
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function RatioStepper({ value, onChange, disabled, label, className }: RatioStepperProps) {
    return (
        <div className={className ? `stepper ${className}` : 'stepper'}>
            <button type="button" className="stepper__btn" disabled={disabled || value <= MIN_RATIO} onClick={() => onChange(clamp(value - RATIO_STEP))}>
                <ChevronLeftIcon aria-hidden="true" />
                <span className="blind">{label} 감소</span>
            </button>
            <span className="stepper__value">{value}%</span>
            <button type="button" className="stepper__btn" disabled={disabled || value >= MAX_RATIO} onClick={() => onChange(clamp(value + RATIO_STEP))}>
                <ChevronRightIcon aria-hidden="true" />
                <span className="blind">{label} 증가</span>
            </button>
        </div>
    );
}
