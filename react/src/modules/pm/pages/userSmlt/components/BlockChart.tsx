import { useCallback, useMemo, type ReactNode } from 'react';
import type { ECElementEvent } from 'echarts/core';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
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
    selectedLabel?: string | null;
    onBlockSelect?: (label: string) => void;
    formatTip?: (item: BlockItem, hour: number) => string;
    disabled?: boolean;
}

/** 블럭 색 — userSmlt.css 의 --i1 ~ --i6 과 같은 값 */
const BLOCK_FILL: Record<BlockColor, string> = {
    i1: '#4441cc',
    i2: '#5b58d6',
    i3: '#7472e0',
    i4: '#8f8de9',
    i5: '#a09eff',
    i6: '#12b09a',
};
/** 대기인원수 꺾은선 색 (--line-wait) */
const WAIT_COLOR = '#f2762e';
/** 좌측 눈금 자리(22px) + 눈금과 플롯 사이(8px) */
const Y_LEFT = 30;
/** 우측 대기인원수 눈금 자리(32px) + 간격(8px) — 꺾은선이 있을 때만 쓴다 */
const Y_RIGHT = 40;
/** 플롯 위 여백 — 최댓값 말풍선과 맨 위 눈금 글자 자리. userSmlt.css 에서 음수 마진으로 되돌린다 */
const PAD_TOP = 18;
/** 플롯 아래 여백 — 0 눈금 글자의 아래 절반 */
const PAD_BOTTOM = 7;
/** 블럭 사이 가로 간격 (원본 grid column-gap) */
const BLOCK_GAP = 3;
/** 우측 축 눈금 칸 수 (라벨 5개) */
const WAIT_TICKS = 4;
/** 최댓값 말풍선 크기 — 말풍선 아래가 점 위 14px 에 오도록 띄운다 */
const PEAK_TIP = { width: 58, height: 18, gap: 14 };

const AXIS_FONT = { fontSize: 11, fontFamily: 'Pretendard, sans-serif' };
const BLOCK_SERIES = '블럭';

/** 운영 구간을 시간 목록으로 편다 (0~23) */
function toHours(item: BlockItem): number[] {
    const hours = new Set<number>();
    item.ranges.forEach((range) => {
        for (let h = range.start; h < range.end; h += 1) hours.add(h);
    });

    return [...hours].sort((a, b) => a - b);
}

/** 렌더할 블럭 1개 — 자리는 [시각, 아래에서 센 층] */
interface Cell {
    label: string;
    color: BlockColor;
    hour: number;
    level: number;
    /** 호버 툴팁 문구 */
    tip: string;
}

/**
 * 시간대별 운영 블럭 차트 — 체크인 카운터(아일랜드) · 출국장 · 보안검색대 공용.
 *
 * 블럭은 ECharts custom 시리즈로 그린다. 시각(0~24)과 층(0~levels)을 좌표축으로 두고
 * 그 위에 둥근 사각형을 얹는 방식이라, 대기인원수 꺾은선(오른쪽 축)과 눈금이 저절로 맞는다.
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
    const cells = useMemo<Cell[]>(() => {
        // 시간별로 이미 쌓인 칸 수 — 다음 시설은 그 위에 올라간다
        const stack: number[] = [];
        const list: Cell[] = [];

        items.forEach((item) => {
            const count = Math.max(1, Math.ceil((item.size || 1) / unitSize));

            toHours(item).forEach((hour) => {
                const base = stack[hour] ?? 0;
                const tip = formatTip?.(item, hour) ?? '';

                for (let k = 0; k < count; k += 1) {
                    const level = base + k;
                    if (level >= levels) continue; // 축을 넘치면 그리지 않는다

                    list.push({ label: item.label, color: item.color, hour, level, tip });
                }

                stack[hour] = base + count;
            });
        });

        return list;
    }, [items, unitSize, levels, formatTip]);

    const height = levels * rowH + PAD_TOP + PAD_BOTTOM;

    const option = useMemo<EChartsOption>(() => {
        // 조회 전에는 꺾은선 값이 비어 있다. 축 최댓값이 0/-Infinity 가 되지 않게 받쳐 둔다.
        const waitData = line?.data ?? [];
        const dataMax = waitData.length > 0 ? Math.max(...waitData) : 0;
        const axisMax = (line?.max || dataMax) ?? 0;
        const blockH = rowH - (compact ? 4 : 6);
        const radius = compact ? 4 : 6;
        // 드로어가 열렸을 때 — 선택 블럭만 남기고 흐리게
        const picking = Boolean(selectedLabel);
        const peakIndex = waitData.length > 0 ? waitData.indexOf(dataMax) : -1;

        return {
            animation: false,
            grid: {
                left: Y_LEFT,
                right: line ? Y_RIGHT : 0,
                top: PAD_TOP,
                bottom: PAD_BOTTOM,
                outerBoundsMode: 'none',
            },
            tooltip: {
                trigger: 'item',
                confine: true,
                backgroundColor: '#2f3440',
                borderWidth: 0,
                padding: [7, 11],
                textStyle: { color: '#fff', fontSize: 11, fontFamily: 'Pretendard, sans-serif' },
                formatter: (params) =>
                    Array.isArray(params) ? '' : String((params.name as string) ?? ''),
            },
            xAxis: {
                type: 'value',
                min: 0,
                max: 24,
                interval: 2,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { show: false },
                // 2시간 단위 세로 보조선 — 오른쪽 끝(24시)에는 긋지 않는다
                splitLine: {
                    lineStyle: {
                        color: [
                            ...Array<string>(12).fill('rgba(210, 214, 226, 0.55)'),
                            'transparent',
                        ],
                        width: 1,
                    },
                },
            },
            yAxis: [
                {
                    type: 'value',
                    min: 0,
                    max: levels,
                    interval: 1,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { ...AXIS_FONT, color: '#9aa0ac', margin: 8 },
                    // 색은 아래(0선)부터 돈다. 0선은 진하게, 맨 위 선은 긋지 않는다.
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
                },
                {
                    type: 'value',
                    min: 0,
                    max: axisMax || WAIT_TICKS,
                    interval: (axisMax || WAIT_TICKS) / WAIT_TICKS,
                    show: Boolean(line),
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
                },
            ],
            series: [
                {
                    name: BLOCK_SERIES,
                    type: 'custom',
                    // 격자 위, 꺾은선 아래
                    z: 3,
                    clip: true,
                    silent: disabled,
                    renderItem: (params, api) => {
                        const cell = cells[params.dataIndex];
                        if (!cell) return { type: 'group', children: [] };

                        const selected = selectedLabel === cell.label;
                        const [left] = api.coord([cell.hour, 0]);
                        const [right] = api.coord([cell.hour + 1, 0]);
                        const [, top] = api.coord([0, cell.level + 1]);
                        const opacity = picking && !selected ? 0.26 : 1;

                        return {
                            type: 'rect',
                            shape: {
                                x: left + BLOCK_GAP / 2,
                                y: top + (rowH - blockH) / 2,
                                width: right - left - BLOCK_GAP,
                                height: blockH,
                                r: radius,
                            },
                            style: {
                                fill: BLOCK_FILL[cell.color] ?? BLOCK_FILL.i1,
                                opacity,
                                ...(compact
                                    ? {}
                                    : {
                                          shadowBlur: 3,
                                          shadowOffsetY: 1,
                                          shadowColor: 'rgba(46, 50, 94, 0.18)',
                                      }),
                                ...(selected
                                    ? { stroke: 'rgba(68, 65, 204, 0.55)', lineWidth: 2 }
                                    : {}),
                            },
                            textContent: compact
                                ? undefined
                                : {
                                      type: 'text',
                                      style: {
                                          text: cell.label,
                                          fill: '#fff',
                                          opacity,
                                          fontSize: blockFontSize,
                                          fontWeight: 'bold',
                                          fontFamily: 'Pretendard, sans-serif',
                                      },
                                  },
                            textConfig: { position: 'inside' },
                            emphasis: {
                                style: {
                                    stroke: '#fff',
                                    lineWidth: 2,
                                    shadowBlur: 12,
                                    shadowOffsetY: 4,
                                    shadowColor: 'rgba(46, 50, 94, 0.35)',
                                },
                            },
                        };
                    },
                    encode: { x: 0, y: 1 },
                    data: cells.map((cell) => ({
                        // 툴팁 문구는 name 으로 넘긴다 (빈 문자열이면 툴팁이 뜨지 않는다)
                        name: cell.tip,
                        value: [cell.hour, cell.level],
                    })),
                },
                ...(line
                    ? [
                          {
                              name: line.label ?? '대기인원수',
                              type: 'line' as const,
                              yAxisIndex: 1,
                              z: 5,
                              silent: true,
                              symbol: 'circle',
                              // 점은 2시간마다 + 최댓값에만 찍는다
                              symbolSize: (_: unknown, params: { dataIndex: number }) =>
                                  params.dataIndex % 2 === 0 || params.dataIndex === peakIndex
                                      ? 7
                                      : 0,
                              itemStyle: {
                                  color: '#fff',
                                  borderColor: WAIT_COLOR,
                                  borderWidth: 2,
                              },
                              lineStyle: {
                                  color: WAIT_COLOR,
                                  width: 2,
                                  cap: 'round' as const,
                                  join: 'round' as const,
                              },
                              // 블럭 칸의 가운데(시각 + 0.5)를 지나게 한다
                              data: waitData.map((value, hour) => [hour + 0.5, value]),
                              // 최댓값 말풍선 — 값이 아직 없으면 띄우지 않는다
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
                                      formatter: `최대 ${dataMax}${line.unit ?? '명'}`,
                                      color: '#fff',
                                      fontSize: 10,
                                      fontWeight: 'bold' as const,
                                      fontFamily: 'Pretendard, sans-serif',
                                  },
                                  data:
                                      peakIndex < 0
                                          ? []
                                          : [{ name: 'peak', coord: [peakIndex + 0.5, dataMax] }],
                              },
                          },
                      ]
                    : []),
            ],
        };
    }, [cells, levels, rowH, compact, blockFontSize, selectedLabel, line, disabled]);

    const handleClick = useCallback(
        (params: ECElementEvent) => {
            if (disabled || !onBlockSelect) return;
            if (params.seriesName !== BLOCK_SERIES) return;

            const cell = cells[params.dataIndex];
            if (cell) onBlockSelect(cell.label);
        },
        [cells, disabled, onBlockSelect],
    );

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
                <EChart
                    option={option}
                    style={{ height, cursor: onBlockSelect && !disabled ? 'pointer' : 'default' }}
                    onClick={disabled || !onBlockSelect ? undefined : handleClick}
                />
            </div>

            {showScale && (
                <div className="bchart__scale" style={line ? { marginRight: Y_RIGHT } : undefined}>
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
