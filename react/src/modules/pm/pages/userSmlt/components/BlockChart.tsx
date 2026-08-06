import type { CSSProperties, ReactNode } from 'react';
import type { BlockItem, BlockLegend, WaitLineData } from '../types';
import { WaitLine } from './WaitLine';

interface BlockChartProps {
    items: BlockItem[];
    /** 차트 제목 (예: 시간대별 운영 아일랜드) */
    title: string;
    /** 제목 옆 단위 문구 (예: (단위: 아일랜드 수)) */
    unit?: string;
    /** 환산 안내 칩 (예: 1블럭 = 부스 4석) */
    unitNote?: string;
    /** Y축 칸 수 */
    levels?: number;
    /** 한 칸 높이(px) */
    rowH?: number;
    /** 블럭 1개가 담당하는 규모 — 블럭 수 = ceil(size / unitSize) */
    unitSize?: number;
    /** 블럭 라벨 글자 크기(px) */
    blockFontSize?: number;
    /** 라벨 없는 저프로필 변형 (보조 차트) */
    compact?: boolean;
    legend?: BlockLegend[];
    line?: WaitLineData;
    /** 바로 위 차트와 시간축이 같으면 false 로 X축을 생략한다 */
    showScale?: boolean;
    /** 하단 안내 문구 — 없으면 푸터를 그리지 않는다 */
    footText?: string;
    /** 푸터 우측 액션 */
    actions?: ReactNode;
    /** 헤드 우측 부가 요소 (미운영 칩 등) */
    headExtra?: ReactNode;
    /** 헤드 우측 액션 — 푸터가 없는 보조 차트에서 쓴다 */
    headActions?: ReactNode;
    /** 드로어가 열린 블럭 — 나머지는 흐려진다 */
    selectedLabel?: string | null;
    /** 블럭 클릭 (드로어 열기) */
    onBlockSelect?: (label: string) => void;
    /** 블럭 호버 툴팁 문구 */
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

/** 렌더할 블럭 1개 — 시간(열) × 쌓임 높이(행) */
interface Cell {
    key: string;
    item: BlockItem;
    hour: number;
    row: number;
    /** 그 시설이 그 시간에 차지한 맨 윗칸 — 툴팁을 여기에만 단다 */
    top: boolean;
}

/**
 * 시간대별 운영 블럭 차트 — 체크인 카운터(아일랜드) · 출국장 · 보안검색대 공용.
 * (design-renewal/mock.js 의 blockChart() 이식)
 *
 * 블럭은 시간대별로 아래에서부터 쌓인다. 블럭 개수 = ceil(size / unitSize) 라서
 * 규모가 큰 시설은 같은 시간대에 여러 칸을 차지하고, 세로 높이가 곧 그 시간의 운영 규모가 된다.
 * 단위(unitSize)·색·라벨을 전부 props 로 받으므로 탭마다 복제하지 않는다.
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
            className={`bchart${compact ? ' bchart--compact' : ''}${
                selectedLabel ? ' is-picking' : ''
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
                {/* 좌측 Y축 = 시설 수 */}
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

                {/* 우측 Y축 = 대기인원수 */}
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
