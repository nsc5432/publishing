import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { DAY_HALVES, MAX_RATIO, MIN_RATIO, RATIO_STEP } from '../constants';
import type { DayHalf, HalfDiff, HourRow } from '../types';

interface FlightEditorProps {
    ratio: number;
    onRatioChange: (ratio: number) => void;
    onHourRatioChange: (index: number, ratio: number) => void;
    rows: HourRow[];
    halfDiffs: Record<DayHalf, HalfDiff>;
    half: DayHalf;
    onHalfChange: (half: DayHalf) => void;
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

export function FlightEditor({ ratio, onRatioChange, onHourRatioChange, rows, halfDiffs, half, onHalfChange, disabled, readOnly }: FlightEditorProps) {
    const visibleRows = rows.map((row, index) => ({ row, index })).filter(({ row }) => row.half === half);

    return (
        <div className="editor">
            <div className="editor__opts">
                <div className="editor__head">
                    <p className="editor__label">시간대별 승객 수</p>

                    <div className="seg seg--sm" role="group" aria-label="표시 시간대">
                        {DAY_HALVES.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`seg__item${item.id === half ? ' is-on' : ''}`}
                                aria-pressed={item.id === half}
                                onClick={() => onHalfChange(item.id)}
                            >
                                {item.label}
                                {halfDiffs[item.id].dir !== 'none' && (
                                    <span className="seg__diff" data-dir={halfDiffs[item.id].dir}>
                                        {halfDiffs[item.id].text}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {!readOnly && (
                    <div className="editor__bulk">
                        <span className="editor__bulk-label">일괄 조정</span>
                        <RatioStepper value={ratio} onChange={onRatioChange} disabled={disabled} label="전체" />
                    </div>
                )}
            </div>

            <div className="table-wrap scroll-area">
                <table className="data-table data-table--fill">
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
                        {visibleRows.map(({ row, index }) => (
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
