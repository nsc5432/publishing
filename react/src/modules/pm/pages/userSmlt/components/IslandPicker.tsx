interface IslandPickerProps {
    /** 선택 가능한 아일랜드 목록 (A ~ N) */
    islands: readonly string[];
    /** 현재 선택된 아일랜드 */
    value: string;
    onChange: (island: string) => void;
    disabled: boolean;
}

/**
 * 아일랜드 단일 선택 — 체크인 카운터 / 셀프체크인·백드롭 탭 공용.
 * 원본 script.js 의 .islands 클릭 핸들러(단일 선택 + 요약 값 갱신)를 이식했다.
 * 요약 값 갱신은 상위에서 value 를 그대로 쓰면 되므로 여기서는 선택만 담당한다.
 */
export function IslandPicker({ islands, value, onChange, disabled }: IslandPickerProps) {
    return (
        <div className="islands">
            {islands.map((island) => (
                <button
                    key={island}
                    type="button"
                    className={`island${island === value ? ' is-active' : ''}`}
                    aria-pressed={island === value}
                    disabled={disabled}
                    onClick={() => onChange(island)}
                >
                    {island}
                </button>
            ))}
        </div>
    );
}
