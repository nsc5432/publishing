import type { Booth, BoothSide } from '../types';

interface BoothGridProps {
    booths: Booth[];
    /** 선택된 부스 번호 — 항공사 칩을 누르면 이 부스에 배정된다 */
    selected: number | null;
    onSelect: (no: number) => void;
    /** 넘기면 그 면의 부스만 한 줄(스트립)로 편다. 없으면 전부 3열 그리드 */
    side?: BoothSide;
    disabled?: boolean;
}

/**
 * 부스 ↔ 항공사 배정 그리드.
 *
 * 드로어에서는 3열 그리드로, 도크에서는 면(L/R)마다 18칸짜리 가로 스트립으로 쓴다.
 */
export function BoothGrid({ booths, selected, onSelect, side, disabled = false }: BoothGridProps) {
    const visibleBooths = side ? booths.filter((booth) => booth.side === side) : booths;

    return (
        <div className={`boothgrid${side ? ' boothgrid--strip' : ''}`}>
            {visibleBooths.map((booth) => (
                <button
                    key={booth.no}
                    type="button"
                    className={`bcell${booth.airline ? '' : ' bcell--empty'}${
                        booth.no === selected ? ' is-sel' : ''
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
