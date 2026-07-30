import { COUNTER_PER_ROW } from '../mock';
import type { CounterCell } from '../types';

interface CounterGridProps {
    upper: CounterCell[];
    lower: CounterCell[];
    /** 운영 중인 셀 id 목록 */
    operating: string[];
    onToggle: (id: string) => void;
    disabled: boolean;
}

/** 상/하단 항공사 열 1개 */
function CellRow({
    cells,
    operating,
    onToggle,
    disabled,
}: Pick<CounterGridProps, 'operating' | 'onToggle' | 'disabled'> & { cells: CounterCell[] }) {
    return (
        <div className="counter-grid__row">
            <span className="chip">항공사</span>
            <div className="cells">
                {cells.map((cell) => {
                    const on = operating.includes(cell.id);

                    return (
                        <button
                            key={cell.id}
                            type="button"
                            className={`cell${cell.custom ? ' is-custom' : ''}${on ? ' is-on' : ''}`}
                            aria-pressed={on}
                            disabled={disabled}
                            onClick={() => onToggle(cell.id)}
                        >
                            {cell.airline}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * 카운터 배치도 — 상단 항공사 / 번호 / 하단 항공사 3열.
 *
 * 퍼블리싱 html 에는 script 가 없어 셀 동작이 정의돼 있지 않아,
 * 셀 클릭 = 해당 카운터 운영 여부 토글로 구현했다(요약의 "운영" 수와 연동).
 */
export function CounterGrid({ upper, lower, operating, onToggle, disabled }: CounterGridProps) {
    return (
        <div className="counter-grid">
            <CellRow cells={upper} operating={operating} onToggle={onToggle} disabled={disabled} />

            <div className="counter-grid__row counter-grid__row--num">
                <span className="chip">번호</span>
                <div className="cells">
                    {Array.from({ length: COUNTER_PER_ROW }, (_, i) => (
                        <span key={i} className="cell-num">
                            {i + 1}
                        </span>
                    ))}
                </div>
            </div>

            <CellRow cells={lower} operating={operating} onToggle={onToggle} disabled={disabled} />
        </div>
    );
}
