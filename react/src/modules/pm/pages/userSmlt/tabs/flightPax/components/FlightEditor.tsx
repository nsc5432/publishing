import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import type { TerminalKind } from '../../../types';
import { MAX_RATIO, MIN_RATIO, RATIO_STEP } from '../constants';
import type { EditMode, HourRow } from '../types';

interface FlightEditorProps {
    /** 라디오 name 을 터미널별로 분리하기 위해 받는다 */
    terminal: TerminalKind;
    /** 전체 비율 (%) */
    ratio: number;
    onRatioChange: (ratio: number) => void;
    mode: EditMode;
    onModeChange: (mode: EditMode) => void;
    rows: HourRow[];
    /** 비활성 터미널이면 모든 컨트롤을 잠근다 */
    disabled: boolean;
}

const clamp = (value: number) => Math.max(MIN_RATIO, Math.min(MAX_RATIO, value));

/**
 * 운항편 수정 영역 — 전체 비율 스테퍼 / 시간대별 표.
 *
 * 원본 script.js 의 sync() 가 하던 is-dim 토글을 mode 파생값으로 대체했다.
 * 스테퍼 값은 표시 전용이며 차트·표 데이터를 재계산하지 않는다(퍼블리싱과 동일).
 */
export function FlightEditor({
    terminal,
    ratio,
    onRatioChange,
    mode,
    onModeChange,
    rows,
    disabled,
}: FlightEditorProps) {
    const name = `mode-${terminal}`;

    return (
        <div className="editor">
            <div className="editor__opts">
                <label className="radio">
                    <input
                        type="radio"
                        name={name}
                        value="ratio"
                        checked={mode === 'ratio'}
                        disabled={disabled}
                        onChange={() => onModeChange('ratio')}
                    />
                    <span className="radio__mark" />
                    <span className="radio__text">운항편 전체 비율로 수정</span>
                </label>

                <div className={`stepper${mode === 'hourly' ? ' is-dim' : ''}`}>
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

            <label className="radio">
                <input
                    type="radio"
                    name={name}
                    value="hourly"
                    checked={mode === 'hourly'}
                    disabled={disabled}
                    onChange={() => onModeChange('hourly')}
                />
                <span className="radio__mark" />
                <span className="radio__text">시간대별 운항편 수정</span>
            </label>

            <div className={`table-wrap scroll-area${mode === 'ratio' ? ' is-dim' : ''}`}>
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
