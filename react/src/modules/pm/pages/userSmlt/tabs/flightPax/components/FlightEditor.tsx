import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { MAX_RATIO, MIN_RATIO, RATIO_STEP } from '../constants';
import type { HourRow } from '../types';

interface FlightEditorProps {
    /** 전체 비율 (%) */
    ratio: number;
    onRatioChange: (ratio: number) => void;
    rows: HourRow[];
    /** 시뮬레이션 대상에서 뺀(꺼 둔) 터미널이면 모든 컨트롤을 잠근다 */
    disabled: boolean;
}

const clamp = (value: number) => Math.max(MIN_RATIO, Math.min(MAX_RATIO, value));

/**
 * 운항편 수정 영역 — 전체 비율 스테퍼 / 시간대별 표.
 *
 * 수정 방식이 '운항편 전체 비율' 하나뿐이라 고를 것이 없어 라디오 대신 마크로 표시한다.
 * 스테퍼를 움직이면 위쪽 차트와 아래 표가 조회값 × 비율로 다시 계산된다.
 */
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
