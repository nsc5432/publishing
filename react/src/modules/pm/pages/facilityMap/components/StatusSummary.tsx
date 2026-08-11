import type { StatusFilter, StatusTile } from '../types';

interface StatusSummaryProps {
    tiles: StatusTile[];
    active: StatusFilter;
    onSelect: (key: StatusFilter) => void;
}

/**
 * 상단 요약 타일 — 이 화면의 결론을 먼저 말하는 자리.
 *
 * 타일이 곧 필터다. "미매핑 3" 을 눈으로 보고 그대로 눌러 그 3건만 남기는 것이
 * 이 화면에서 가장 잦은 동작이라 따로 필터를 두지 않았다.
 */
export function StatusSummary({ tiles, active, onSelect }: StatusSummaryProps) {
    return (
        <div className="sum" role="group" aria-label="매핑 상태 요약">
            {tiles.map((tile) => (
                <button
                    key={tile.key}
                    type="button"
                    className={`sum__tile sum__tile--${tile.key}${
                        tile.key === active ? ' is-active' : ''
                    }`}
                    aria-pressed={tile.key === active}
                    onClick={() => onSelect(tile.key)}
                >
                    <span className="sum__label">{tile.label}</span>
                    <strong className="sum__count">{tile.count}</strong>
                    <span className="sum__unit">건</span>
                </button>
            ))}
        </div>
    );
}
