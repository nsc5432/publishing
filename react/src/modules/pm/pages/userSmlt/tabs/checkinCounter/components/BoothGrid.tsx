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
 * (design-renewal/mock.js 의 boothGrid() 이식)
 *
 * 참고자료는 부스를 가로 18열로 늘어놓지만 드로어 폭이 380px 이라 3열 컴팩트 그리드로 접었다.
 * 초기값은 배정정보로 채워지고, 아직 안 채워진 부스는 미배정(점선) 셀로 남는다.
 */
export function BoothGrid({ booths, selected, onSelect, disabled = false }: BoothGridProps) {
    return (
        <div className="boothgrid">
            {booths.map((booth) => (
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
