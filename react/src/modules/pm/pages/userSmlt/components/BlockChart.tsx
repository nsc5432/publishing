import type { CSSProperties, ReactNode } from 'react';
import type { BlockItem, BlockLegend, WaitLineData } from '../types';
import { WaitLine } from './WaitLine';

interface BlockChartProps {
    items: BlockItem[];
    title: string;
    unit?: string;
    unitNote?: string;
    levels?: number;
    rowH?: number;
    unitSize?: number;
    blockFontSize?: number;
    compact?: boolean;
    legend?: BlockLegend[];
    line?: WaitLineData;
    showScale?: boolean;
    footText?: string;
    actions?: ReactNode;
    headExtra?: ReactNode;
    headActions?: ReactNode;
    selectedLabel?: string | null;
    onBlockSelect?: (label: string) => void;
    formatTip?: (item: BlockItem, hour: number) => string;
    disabled?: boolean;
}

/** 운영 구간을 시간 목록으로 편다 (0~23) */
function toHours(item: BlockItem): number[] {
    const hours = new Set<number>();
    item.ranges.forEach((range) => {
        for (let h = range.start; h < range.end; h += 1) hours.add(h);
    });

    return [...hours].sort((a, b) => a - b);
}

/** 렌더할 블럭 1개 */
interface Cell {
    key: string;
    item: BlockItem;
    hour: number;
    row: number;
    top: boolean;
}

/**
 * 시간대별 운영 블럭 차트 — 체크인 카운터(아일랜드) · 출국장 · 보안검색대 공용.
 */
export function BlockChart({
    items,
    title,
    unit,
    unitNote,
    levels = 8,
    rowH = 30,
    unitSize = 1,
    blockFontSize = 12,
    compact = false,
    legend,
    line,
    showScale = true,
    footText,
    actions,
    headExtra,
    headActions,
    selectedLabel,
    onBlockSelect,
    formatTip,
    disabled = false,
}: BlockChartProps) {
    // 시간별로 이미 쌓인 칸 수 — 다음 시설은 그 위에 올라간다
    const stack: number[] = [];
    const cells: Cell[] = [];

    items.forEach((item) => {
        const count = Math.max(1, Math.ceil((item.size || 1) / unitSize));

        toHours(item).forEach((hour) => {
            const base = stack[hour] ?? 0;

            for (let k = 0; k < count; k += 1) {
                const row = levels - (base + k);
                if (row < 1) continue; // 축을 넘치면 그리지 않는다

                cells.push({
                    key: `${item.label}-${hour}-${k}`,
                    item,
                    hour,
                    row,
                    top: k === count - 1,
                });
            }

            stack[hour] = base + count;
        });
    });

    // 가로 눈금선 간격(--row-h)도 행 높이에 맞춘다 (userSmlt.css .bchart__plot 참고)
    const plotStyle = {
        gridTemplateRows: `repeat(${levels}, ${rowH}px)`,
        '--row-h': `${rowH}px`,
        '--blk-h': `${rowH - (compact ? 4 : 6)}px`,
        '--blk-fs': `${blockFontSize}px`,
    } as CSSProperties;

    const axisMax = line ? line.max || Math.max(...line.data) : 0;

    return (
        <div
            className={`bchart${compact ? ' bchart--compact' : ''}${selectedLabel ? ' is-picking' : ''
                }`}
        >
            <div className="bchart__head">
                <p className="bchart__title">{title}</p>
                {unit && <span className="bchart__unit">{unit}</span>}
                {unitNote && <span className="bchart__unitnote">{unitNote}</span>}

                {(legend || line) && (
                    <div className="legend">
                        {legend?.map((chip) => (
                            <span key={chip.label} className="legend__chip">
                                <i
                                    className="legend__dot"
                                    style={{ background: `var(--${chip.color})` }}
                                />
                                <b>{chip.label}</b>
                                {chip.note ? ` ${chip.note}` : ''}
                            </span>
                        ))}
                        {line && (
                            <span className="legend__chip legend__chip--line">
                                <i className="legend__line" />
                                <b>{line.label ?? '대기인원수'}</b> {line.unit ?? '명'}
                            </span>
                        )}
                    </div>
                )}

                {headExtra}
                {headActions && <div className="bchart__acts">{headActions}</div>}
            </div>

            <div className="bchart__body">
                <div className="bchart__yaxis" style={{ height: levels * rowH }}>
                    {Array.from({ length: levels + 1 }, (_, i) => (
                        <span key={i}>{i}</span>
                    ))}
                </div>

                <div className="bchart__plot" style={plotStyle}>
                    {cells.map((cell) => {
                        const selected = selectedLabel === cell.item.label;
                        const tip = cell.top && formatTip ? formatTip(cell.item, cell.hour) : null;

                        return (
                            <button
                                key={cell.key}
                                type="button"
                                className={`blk blk--${cell.item.color}${selected ? ' is-sel' : ''}`}
                                style={{ gridColumn: cell.hour + 1, gridRow: cell.row }}
                                disabled={disabled || !onBlockSelect}
                                onClick={() => onBlockSelect?.(cell.item.label)}
                            >
                                {compact ? '' : cell.item.label}
                                {tip && <span className="blk__tip">{tip}</span>}
                            </button>
                        );
                    })}

                    {line && <WaitLine line={line} />}
                </div>

                {line && (
                    <div
                        className="bchart__yaxis bchart__yaxis--right"
                        style={{ height: levels * rowH }}
                    >
                        {Array.from({ length: 5 }, (_, i) => (
                            <span key={i}>{Math.round((axisMax * i) / 4)}</span>
                        ))}
                    </div>
                )}
            </div>

            {showScale && (
                <div className="bchart__scale" style={line ? { marginRight: 40 } : undefined}>
                    {Array.from({ length: 13 }, (_, i) => (
                        <span key={i}>{String(i * 2).padStart(2, '0')}</span>
                    ))}
                </div>
            )}

            {footText && (
                <div className="bchart__foot">
                    <strong>{footText}</strong>
                    {actions && <div className="bchart__acts">{actions}</div>}
                </div>
            )}
        </div>
    );
}
