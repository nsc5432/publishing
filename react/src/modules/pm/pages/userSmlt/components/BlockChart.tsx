import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ECElementEvent } from 'echarts/core';
import type { TimeRange } from '@/components/ui/time-range-selector';
import type {
    CustomSeriesOption,
    CustomSeriesRenderItemReturn,
    EChartsOption,
    LineSeriesOption,
    TooltipComponentOption,
    XAXisComponentOption,
    YAXisComponentOption,
} from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import { CHART_FONT_FAMILY } from '@/lib/chart';
import { pad2 } from '@/lib/format';
import { toHourList } from '../format';
import { useDragScroll } from '../hooks/useDragScroll';
import type { BlockColor, BlockItem, BlockLegend, WaitLineData } from '../types';

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
    selected?: string[];
    onBlockSelect?: (label: string) => void;
    stackMode?: 'packed' | 'fixed';
    gridLeft?: number;
    selectedRange?: TimeRange | null;
    onRangeSelect?: (label: string, range: TimeRange) => void;
    formatTip?: (item: BlockItem, hour: number) => string;
    disabled?: boolean;
}

interface Cell {
    label: string;
    color: BlockColor;
    hour: number;
    level: number;
    sides?: readonly ('L' | 'R')[];
    tip: string;
}

export const Y_LEFT = 30;
export const GUTTER = 44;
export const Y_RIGHT = 40;

const BLOCK_FILL: Record<BlockColor, string> = {
    i1: '#7472e0',
    i2: '#7472e0',
    i3: '#7472e0',
    i4: '#7472e0',
    i5: '#7472e0',
    i6: '#7472e0',
};
const PLOT_BG = '#dde1f2';
const WAIT_COLOR = '#f2762e';
const PAD_TOP = 18;
const PAD_BOTTOM = 7;
const BLOCK_GAP = 3;
const WAIT_TICKS = 4;
const SCALE_TICK_COUNT = 13;
const SCALE_TICK_STEP_HOUR = 2;
const PEAK_TIP = { width: 58, height: 18, gap: 14 };
const SIDE_OFF_OPACITY = 0.26;
const DIM_OPACITY = 0.26;

const AXIS_FONT = { fontSize: 11, fontFamily: CHART_FONT_FAMILY };
const BLOCK_SERIES = '블럭';
const VALUE_LABEL = 2;
const WAIT_LABEL = '대기인원수';
const WAIT_UNIT = '명';

interface BlockBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface BlockView {
    rowH: number;
    blockH: number;
    radius: number;
    fontSize: number;
    compact: boolean;
    selectedLabels: Set<string>;
}

const BLOCK_EMPHASIS = {
    style: {
        stroke: '#fff',
        lineWidth: 2,
        shadowBlur: 12,
        shadowOffsetY: 4,
        shadowColor: 'rgba(46, 50, 94, 0.35)',
    },
};

function blockPaint(cell: Cell, view: BlockView) {
    const selected = view.selectedLabels.has(cell.label);
    const dimmed = view.selectedLabels.size > 0 && !selected;
    const fill = BLOCK_FILL[cell.color] ?? BLOCK_FILL.i1;
    const opacity = dimmed ? DIM_OPACITY : 1;

    return {
        fill,
        opacity,
        radius: view.radius,
        style: {
            fill,
            opacity,
            ...(view.compact
                ? {}
                : {
                      shadowBlur: 3,
                      shadowOffsetY: 1,
                      shadowColor: 'rgba(46, 50, 94, 0.18)',
                  }),
            ...(selected ? { stroke: 'rgba(68, 65, 204, 0.55)', lineWidth: 2 } : {}),
        },
        label: view.compact
            ? undefined
            : {
                  type: 'text' as const,
                  style: {
                      text: cell.label,
                      fill: '#fff',
                      opacity,
                      fontSize: view.fontSize,
                      fontWeight: 'bold' as const,
                      fontFamily: CHART_FONT_FAMILY,
                  },
              },
    };
}

type BlockPaint = ReturnType<typeof blockPaint>;
type BlockLabel = NonNullable<BlockPaint['label']>;

function wholeBlock(box: BlockBox, paint: BlockPaint): CustomSeriesRenderItemReturn {
    return {
        type: 'rect',
        shape: { ...box, r: paint.radius },
        style: paint.style,
        textContent: paint.label,
        textConfig: { position: 'inside' },
        emphasis: BLOCK_EMPHASIS,
    };
}

function splitBlock(
    box: BlockBox,
    operatingSide: 'L' | 'R',
    paint: BlockPaint,
): CustomSeriesRenderItemReturn {
    const half = box.height / 2;
    const r = Math.min(paint.radius, half);
    const topCorners = [r, r, 0, 0];
    const bottomCorners = [0, 0, r, r];
    const operatingOnTop = operatingSide === 'L';

    const operating = {
        type: 'rect' as const,
        shape: {
            x: box.x,
            y: operatingOnTop ? box.y : box.y + half,
            width: box.width,
            height: half,
            r: operatingOnTop ? topCorners : bottomCorners,
        },
        style: paint.style,
        emphasis: BLOCK_EMPHASIS,
    };
    const closed = {
        type: 'rect' as const,
        shape: {
            x: box.x + 0.5,
            y: (operatingOnTop ? box.y + half : box.y) + 0.5,
            width: box.width - 1,
            height: half - 1,
            r: operatingOnTop ? bottomCorners : topCorners,
        },
        style: {
            fill: paint.fill,
            opacity: paint.opacity * SIDE_OFF_OPACITY,
            stroke: paint.fill,
            lineWidth: 1,
        },
    };

    return {
        type: 'group',
        children: [closed, operating, ...(paint.label ? [centeredLabel(paint.label, box)] : [])],
    };
}

function centeredLabel(label: BlockLabel, box: BlockBox) {
    return {
        ...label,
        style: {
            ...label.style,
            x: box.x + box.width / 2,
            y: box.y + box.height / 2,
            align: 'center' as const,
            verticalAlign: 'middle' as const,
        },
    };
}

function renderBlock(cell: Cell, box: BlockBox, view: BlockView): CustomSeriesRenderItemReturn {
    const paint = blockPaint(cell, view);
    const soleOperatingSide = cell.sides?.length === 1 ? cell.sides[0] : null;

    return soleOperatingSide ? splitBlock(box, soleOperatingSide, paint) : wholeBlock(box, paint);
}

interface WaitLine {
    data: number[];
    peak: number;
    peakIndex: number;
    axisMax: number;
}

function toWaitLine(line?: WaitLineData): WaitLine {
    const data = line?.data ?? [];
    const peak = data.length > 0 ? Math.max(...data) : 0;

    return {
        data,
        peak,
        peakIndex: data.length > 0 ? data.indexOf(peak) : -1,
        axisMax: line?.max || peak,
    };
}

const TOOLTIP: TooltipComponentOption = {
    trigger: 'item',
    confine: true,
    backgroundColor: '#2f3440',
    borderWidth: 0,
    padding: [7, 11],
    textStyle: { color: '#fff', fontSize: 11, fontFamily: CHART_FONT_FAMILY },
    formatter: (params) => (Array.isArray(params) ? '' : String(params.name ?? '')),
};

const HOUR_AXIS: XAXisComponentOption = {
    type: 'value',
    min: 0,
    max: 24,
    interval: 2,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { show: false },
    splitLine: {
        lineStyle: {
            color: [...Array<string>(12).fill('rgba(210, 214, 226, 0.55)'), 'transparent'],
            width: 1,
        },
    },
};

function levelAxis(levels: number): YAXisComponentOption {
    return {
        type: 'value',
        min: 0,
        max: levels,
        interval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { ...AXIS_FONT, color: '#9aa0ac', margin: 8 },
        splitLine: {
            lineStyle: {
                color: [
                    '#ccd0dd',
                    ...Array<string>(Math.max(levels - 1, 0)).fill('#e9ebf2'),
                    'transparent',
                ],
                width: 1,
            },
        },
    };
}

function waitAxis(axisMax: number, show: boolean): YAXisComponentOption {
    const max = axisMax || WAIT_TICKS;

    return {
        type: 'value',
        min: 0,
        max,
        interval: max / WAIT_TICKS,
        show,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
            ...AXIS_FONT,
            color: WAIT_COLOR,
            fontWeight: 600,
            margin: 8,
            formatter: (value: number) => String(Math.round(value)),
        },
        splitLine: { show: false },
    };
}

function blockSeries(cells: Cell[], view: BlockView, disabled: boolean): CustomSeriesOption {
    return {
        name: BLOCK_SERIES,
        type: 'custom',
        z: 3,
        clip: true,
        silent: disabled,
        renderItem: (params, api) => {
            const cell = cells[params.dataIndex];
            if (!cell) return { type: 'group', children: [] };

            const [left] = api.coord([cell.hour, 0]);
            const [right] = api.coord([cell.hour + 1, 0]);
            const [, top] = api.coord([0, cell.level + 1]);
            const box: BlockBox = {
                x: left + BLOCK_GAP / 2,
                y: top + (view.rowH - view.blockH) / 2,
                width: right - left - BLOCK_GAP,
                height: view.blockH,
            };

            return renderBlock(cell, box, view);
        },
        encode: { x: 0, y: 1 },
        data: cells.map((cell) => ({
            name: cell.tip,
            value: [cell.hour, cell.level, cell.label],
        })),
    };
}

function waitLineSeries(line: WaitLineData, wait: WaitLine): LineSeriesOption {
    return {
        name: line.label ?? WAIT_LABEL,
        type: 'line',
        yAxisIndex: 1,
        z: 5,
        silent: true,
        symbol: 'circle',
        symbolSize: (_: unknown, params: { dataIndex: number }) =>
            params.dataIndex % 2 === 0 || params.dataIndex === wait.peakIndex ? 7 : 0,
        itemStyle: { color: '#fff', borderColor: WAIT_COLOR, borderWidth: 2 },
        lineStyle: { color: WAIT_COLOR, width: 2, cap: 'round', join: 'round' },
        data: wait.data.map((value, hour) => [hour + 0.5, value]),
        markPoint: {
            silent: true,
            animation: false,
            symbol: 'roundRect',
            symbolSize: [PEAK_TIP.width, PEAK_TIP.height],
            symbolOffset: [0, -(PEAK_TIP.gap + PEAK_TIP.height / 2)],
            itemStyle: {
                color: WAIT_COLOR,
                shadowBlur: 8,
                shadowOffsetY: 3,
                shadowColor: 'rgba(242, 118, 46, 0.35)',
            },
            label: {
                formatter: `최대 ${wait.peak}${line.unit ?? WAIT_UNIT}`,
                color: '#fff',
                fontSize: 10,
                fontWeight: 'bold',
                fontFamily: CHART_FONT_FAMILY,
            },
            data:
                wait.peakIndex < 0
                    ? []
                    : [{ name: 'peak', coord: [wait.peakIndex + 0.5, wait.peak] }],
        },
    };
}

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
    selected,
    onBlockSelect,
    stackMode = 'packed',
    gridLeft = Y_LEFT,
    formatTip,
    disabled = false,
}: BlockChartProps) {
    const cells = useMemo<Cell[]>(() => {
        const levelsByHour: number[] = [];
        const cellList: Cell[] = [];

        items.forEach((item, index) => {
            const blockCount =
                stackMode === 'fixed' ? 1 : Math.max(1, Math.ceil((item.size || 1) / unitSize));

            toHourList(item.ranges).forEach((hour) => {
                const baseLevel = stackMode === 'fixed' ? index : (levelsByHour[hour] ?? 0);
                const tip = formatTip?.(item, hour) ?? '';

                for (let blockIndex = 0; blockIndex < blockCount; blockIndex += 1) {
                    const level = baseLevel + blockIndex;
                    if (level >= levels) continue;

                    cellList.push({
                        label: item.label,
                        color: item.color,
                        hour,
                        level,
                        sides: item.sides,
                        tip,
                    });
                }

                levelsByHour[hour] = baseLevel + blockCount;
            });
        });

        return cellList;
    }, [items, unitSize, levels, stackMode, formatTip]);

    const height = levels * rowH + PAD_TOP + PAD_BOTTOM;

    const selectedLabelKey = (selected ?? []).join('|');
    const selectedLabels = useMemo(
        () => new Set(selectedLabelKey ? selectedLabelKey.split('|') : []),
        [selectedLabelKey],
    );

    const option = useMemo<EChartsOption>(() => {
        const wait = toWaitLine(line);
        const view: BlockView = {
            rowH,
            blockH: rowH - (compact ? 4 : 6),
            radius: compact ? 4 : 6,
            fontSize: blockFontSize,
            compact,
            selectedLabels,
        };

        return {
            animation: false,
            grid: {
                left: gridLeft,
                right: line ? Y_RIGHT : 0,
                top: PAD_TOP,
                bottom: PAD_BOTTOM,
                outerBoundsMode: 'none',
                show: true,
                backgroundColor: PLOT_BG,
                borderWidth: 0,
            },
            tooltip: TOOLTIP,
            xAxis: HOUR_AXIS,
            yAxis: [levelAxis(levels), waitAxis(wait.axisMax, Boolean(line))],
            series: [
                blockSeries(cells, view, disabled),
                ...(line ? [waitLineSeries(line, wait)] : []),
            ],
        };
    }, [cells, levels, rowH, compact, blockFontSize, selectedLabels, gridLeft, line, disabled]);

    const [legendEl, setLegendEl] = useState<HTMLDivElement | null>(null);
    const legendDrag = useDragScroll(legendEl);
    const { sync: syncLegend } = legendDrag;

    useEffect(() => {
        syncLegend();
    }, [syncLegend, legend, line]);

    const handleClick = useCallback(
        (params: ECElementEvent) => {
            if (disabled || !onBlockSelect) return;
            if (params.seriesName !== BLOCK_SERIES) return;

            const label = Array.isArray(params.value) ? params.value[VALUE_LABEL] : undefined;
            if (typeof label !== 'string' || !label) return;

            onBlockSelect(label);
        },
        [disabled, onBlockSelect],
    );

    return (
        <div
            className={`bchart${compact ? ' bchart--compact' : ''}${
                selectedLabels.size > 0 ? ' is-picking' : ''
            }`}
        >
            <div className="bchart__head">
                <p className="bchart__title">{title}</p>
                {unit && <span className="bchart__unit">{unit}</span>}
                {unitNote && <span className="bchart__unitnote">{unitNote}</span>}

                {(legend || line) && (
                    <div
                        className={`legend-wrap${legendDrag.scrollable ? ' is-scrollable' : ''}${
                            legendDrag.atStart ? '' : ' is-scrolled'
                        }${legendDrag.atEnd ? ' is-end' : ''}`}
                    >
                        <div
                            ref={setLegendEl}
                            className={`legend${legendDrag.dragging ? ' is-dragging' : ''}`}
                            onScroll={legendDrag.sync}
                            onPointerDown={legendDrag.onPointerDown}
                        >
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
                                    <b>{line.label ?? WAIT_LABEL}</b> {line.unit ?? WAIT_UNIT}
                                </span>
                            )}
                        </div>
                        <span className="legend__grip" aria-hidden="true" />
                    </div>
                )}

                {headExtra}
                {headActions && <div className="bchart__acts">{headActions}</div>}
            </div>

            <div className="bchart__body">
                <EChart
                    option={option}
                    style={{ height, cursor: onBlockSelect && !disabled ? 'pointer' : 'default' }}
                    onClick={disabled || !onBlockSelect ? undefined : handleClick}
                />
            </div>

            {showScale && (
                <div
                    className="bchart__scale"
                    style={{ marginLeft: gridLeft, ...(line ? { marginRight: Y_RIGHT } : {}) }}
                >
                    {Array.from({ length: SCALE_TICK_COUNT }, (_, tickIndex) => (
                        <span key={tickIndex}>{pad2(tickIndex * SCALE_TICK_STEP_HOUR)}</span>
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
