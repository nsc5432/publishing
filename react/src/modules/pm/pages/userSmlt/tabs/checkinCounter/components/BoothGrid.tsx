import type { Booth } from '../types';

interface BoothGridProps {
    booths: Booth[];
    /** 선택된 부스 번호 — 항공사 칩을 누르면 이 부스에 배정된다 */
    selected: number | null;
    onSelect: (no: number) => void;
    disabled?: boolean;
}

/**
 * 부스 ↔ 항공사 배정 그리드.
 */
export function BoothGrid({ booths, selected, onSelect, disabled = false }: BoothGridProps) {
    return (
        <div className="boothgrid">
            {booths.map((booth) => (
                <button
                    key={booth.no}
                    type="button"
                    className={`bcell${booth.airline ? '' : ' bcell--empty'}${booth.no === selected ? ' is-sel' : ''
                        }`}
                    aria-pressed={booth.no === selected}
                    disabled={disabled}
                    onClick={() => onSelect(booth.no)}
                >
                    <i className="bcell__no">{booth.no}</i>
                    {booth.airline || '미배정'}
                </button>
            ))}
        </div>
    );
}
