import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { MAX_RATIO, MIN_RATIO, RATIO_STEP } from '../constants';
import type { HourRow } from '../types';

interface FlightEditorProps {
    ratio: number;
    onRatioChange: (ratio: number) => void;
    rows: HourRow[];
    disabled: boolean;
}

const clamp = (value: number) => Math.max(MIN_RATIO, Math.min(MAX_RATIO, value));

export function FlightEditor({ ratio, onRatioChange, rows, disabled }: FlightEditorProps) {
    return (
        <div className="editor">
            <div className="editor__opts">
                <p className="editor__label">운항편 전체 비율로 수정</p>

                <div className="stepper">
                    <button
                        type="button"
                        className="stepper__btn"
                        disabled={disabled}
                        onClick={() => onRatioChange(clamp(ratio - RATIO_STEP))}
                    >
                        <ChevronLeftIcon aria-hidden="true" />
                        <span className="blind">감소</span>
                    </button>
                    <span className="stepper__value">{ratio}%</span>
                    <button
                        type="button"
                        className="stepper__btn"
                        disabled={disabled}
                        onClick={() => onRatioChange(clamp(ratio + RATIO_STEP))}
                    >
                        <ChevronRightIcon aria-hidden="true" />
                        <span className="blind">증가</span>
                    </button>
                </div>
            </div>

            <div className="table-wrap scroll-area">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th scope="col">시작시간</th>
                            <th scope="col">종료시간</th>
                            <th scope="col">수정</th>
                            <th scope="col">승객 수</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.start}>
                                <td>{row.start}</td>
                                <td>{row.end}</td>
                                <td className="is-num">{row.adjust}</td>
                                <td className="is-num">{row.pax}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
