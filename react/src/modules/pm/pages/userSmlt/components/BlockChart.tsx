import { useCallback, useMemo, type ReactNode } from 'react';
import type { ECElementEvent } from 'echarts/core';
import type { TimeRange } from '@/components/ui/time-range-selector';
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
    /** 선택된 블럭 라벨. 하나라도 있으면 나머지가 흐려진다 */
    selected?: string[];
    /** meta.additive = Ctrl/Cmd 를 누른 채 클릭했는가 */
    onBlockSelect?: (label: string, meta: { additive: boolean }) => void;
    /** 'packed' 열린 것부터 아래에서 쌓음(기본) · 'fixed' items 순서로 층 고정 */
    stackMode?: 'packed' | 'fixed';
    /** 좌측 축 자리(px). 아래 격자와 좌표를 맞출 때 GUTTER 를 넘긴다 */
    gridLeft?: number;
    /**
     * 가로 드래그로 좁힌 시간 범위 — 자리만 열어 둔 값이다.
     * 브러시 조작은 아직 붙지 않았다 (STEP-1 스텝 4).
     */
    selectedRange?: TimeRange | null;
    onRangeSelect?: (label: string, range: TimeRange) => void;
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
export const Y_LEFT = 30;
/** 아래 격자(출국장 .scgrid)와 좌표를 맞출 때 쓰는 좌측 자리 — CSS 의 --gut 과 같은 값 */
export const GUTTER = 44;
/** 우측 대기인원수 눈금 자리(32px) + 간격(8px) — 꺾은선이 있을 때만 쓴다 */
export const Y_RIGHT = 40;
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
/** 미운영 면(반쪽 블럭)의 불투명도 */
const SIDE_OFF_OPACITY = 0.26;

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
    /** 한쪽 면만 운영하면 블럭을 위/아래로 가른다 (BlockItem.sides) */
    sides?: readonly ('L' | 'R')[];
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
    selected,
    onBlockSelect,
    stackMode = 'packed',
    gridLeft = Y_LEFT,
    formatTip,
    disabled = false,
}: BlockChartProps) {
    const cells = useMemo<Cell[]>(() => {
        // 시간별로 이미 쌓인 칸 수 — 다음 시설은 그 위에 올라간다
        const stack: number[] = [];
        const list: Cell[] = [];

        items.forEach((item, index) => {
            // fixed 는 항목 1개 = 층 1개다. 닫힌 시간의 자리는 비워 둔다.
            const count =
                stackMode === 'fixed' ? 1 : Math.max(1, Math.ceil((item.size || 1) / unitSize));

            toHours(item).forEach((hour) => {
                const base = stackMode === 'fixed' ? index : (stack[hour] ?? 0);
                const tip = formatTip?.(item, hour) ?? '';

                for (let k = 0; k < count; k += 1) {
                    const level = base + k;
                    if (level >= levels) continue; // 축을 넘치면 그리지 않는다

                    list.push({
                        label: item.label,
                        color: item.color,
                        hour,
                        level,
                        sides: item.sides,
                        tip,
                    });
                }

                stack[hour] = base + count;
            });
        });

        return list;
    }, [items, unitSize, levels, stackMode, formatTip]);

    const height = levels * rowH + PAD_TOP + PAD_BOTTOM;

    // 호출부가 배열을 매 렌더 새로 만들어도 차트 옵션까지 다시 만들지 않도록 문자열로 굳힌다
    const selectedKey = (selected ?? []).join('|');
    const picked = useMemo(() => new Set(selectedKey ? selectedKey.split('|') : []), [selectedKey]);

    const option = useMemo<EChartsOption>(() => {
        // 조회 전에는 꺾은선 값이 비어 있다. 축 최댓값이 0/-Infinity 가 되지 않게 받쳐 둔다.
        const waitData = line?.data ?? [];
        const dataMax = waitData.length > 0 ? Math.max(...waitData) : 0;
        const axisMax = (line?.max || dataMax) ?? 0;
        const blockH = rowH - (compact ? 4 : 6);
        const radius = compact ? 4 : 6;
        // 편집 표면이 열렸을 때 — 선택 블럭만 남기고 흐리게
        const picking = picked.size > 0;
        const peakIndex = waitData.length > 0 ? waitData.indexOf(dataMax) : -1;

        return {
            animation: false,
            grid: {
                left: gridLeft,
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

                        const isSel = picked.has(cell.label);
                        const [left] = api.coord([cell.hour, 0]);
                        const [right] = api.coord([cell.hour + 1, 0]);
                        const [, top] = api.coord([0, cell.level + 1]);
                        const opacity = picking && !isSel ? 0.26 : 1;

                        const x = left + BLOCK_GAP / 2;
                        const y = top + (rowH - blockH) / 2;
                        const width = right - left - BLOCK_GAP;
                        const fill = BLOCK_FILL[cell.color] ?? BLOCK_FILL.i1;

                        const style = {
                            fill,
                            opacity,
                            ...(compact
                                ? {}
                                : {
                                      shadowBlur: 3,
                                      shadowOffsetY: 1,
                                      shadowColor: 'rgba(46, 50, 94, 0.18)',
                                  }),
                            ...(isSel ? { stroke: 'rgba(68, 65, 204, 0.55)', lineWidth: 2 } : {}),
                        };
                        const emphasis = {
                            style: {
                                stroke: '#fff',
                                lineWidth: 2,
                                shadowBlur: 12,
                                shadowOffsetY: 4,
                                shadowColor: 'rgba(46, 50, 94, 0.35)',
                            },
                        };
                        const label = compact
                            ? undefined
                            : {
                                  type: 'text' as const,
                                  style: {
                                      text: cell.label,
                                      fill: '#fff',
                                      opacity,
                                      fontSize: blockFontSize,
                                      fontWeight: 'bold' as const,
                                      fontFamily: 'Pretendard, sans-serif',
                                  },
                              };

                        // 한쪽 면만 운영하는 시설 — 통 블럭 대신 위/아래로 가른다
                        const only = cell.sides?.length === 1 ? cell.sides[0] : null;
                        if (!only) {
                            return {
                                type: 'rect',
                                shape: { x, y, width, height: blockH, r: radius },
                                style,
                                textContent: label,
                                textConfig: { position: 'inside' },
                                emphasis,
                            };
                        }

                        const half = blockH / 2;
                        // 반쪽은 높이가 절반이라 모서리도 그만큼만 굴린다
                        const r = Math.min(radius, half);
                        // 운영 면이 진한 절반 — L 이면 위, R 이면 아래
                        const onY = only === 'L' ? y : y + half;
                        const offY = only === 'L' ? y + half : y;

                        return {
                            type: 'group',
                            children: [
                                {
                                    type: 'rect',
                                    // 테두리가 블럭 밖으로 삐져나오지 않게 0.5px 안으로 들인다
                                    shape: {
                                        x: x + 0.5,
                                        y: offY + 0.5,
                                        width: width - 1,
                                        height: half - 1,
                                        r: only === 'L' ? [0, 0, r, r] : [r, r, 0, 0],
                                    },
                                    // 미운영 면 — 안쪽 1px 테두리로 자리만 남긴다
                                    style: {
                                        fill,
                                        opacity: opacity * SIDE_OFF_OPACITY,
                                        stroke: fill,
                                        lineWidth: 1,
                                    },
                                },
                                {
                                    type: 'rect',
                                    shape: {
                                        x,
                                        y: onY,
                                        width,
                                        height: half,
                                        r: only === 'L' ? [r, r, 0, 0] : [0, 0, r, r],
                                    },
                                    style,
                                    emphasis,
                                },
                                ...(label
                                    ? [
                                          {
                                              ...label,
                                              // 글자는 반쪽이 아니라 블럭 한가운데에 둔다
                                              style: {
                                                  ...label.style,
                                                  x: x + width / 2,
                                                  y: y + blockH / 2,
                                                  align: 'center' as const,
                                                  verticalAlign: 'middle' as const,
                                              },
                                          },
                                      ]
                                    : []),
                            ],
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
    }, [cells, levels, rowH, compact, blockFontSize, picked, gridLeft, line, disabled]);

    const handleClick = useCallback(
        (params: ECElementEvent) => {
            if (disabled || !onBlockSelect) return;
            if (params.seriesName !== BLOCK_SERIES) return;

            const cell = cells[params.dataIndex];
            if (!cell) return;

            // Ctrl(Win) / Cmd(Mac) 누른 채 클릭 = 선택 누적
            const mouse = params.event?.event as MouseEvent | undefined;
            onBlockSelect(cell.label, { additive: Boolean(mouse?.ctrlKey || mouse?.metaKey) });
        },
        [cells, disabled, onBlockSelect],
    );

    return (
        <div
            className={`bchart${compact ? ' bchart--compact' : ''}${
                picked.size > 0 ? ' is-picking' : ''
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
                <div
                    className="bchart__scale"
                    // 눈금줄은 플롯과 같은 좌우 여백을 써야 시각이 블럭 위에 선다
                    style={{ marginLeft: gridLeft, ...(line ? { marginRight: Y_RIGHT } : {}) }}
                >
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
