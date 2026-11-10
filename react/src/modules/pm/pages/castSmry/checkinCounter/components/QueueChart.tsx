import { useMemo } from 'react';
import type { BarSeriesOption, EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import { AXIS_LABEL as SHARED_AXIS_LABEL, CHART_FONT_FAMILY, TOOLTIP_TEXT_STYLE } from '@/lib/chart';
import { toWaitMin } from '../view';
import type { ChknIslandBooth, ChknQueueSeries } from '../types';

interface QueueChartProps {
    queue: ChknQueueSeries;
    step: number;
    time: string;
}

const BOOTH_SERIES = '운영 부스';
const BOOTH_STACK = 'booth';
const ISLAND_COLORS = [
    '#e5484d',
    '#f76b15',
    '#f5b800',
    '#a3c428',
    '#30a46c',
    '#12a594',
    '#05a2c2',
    '#0090ff',
    '#3e63dd',
    '#6e56cf',
    '#8e4ec6',
    '#d6409f',
    '#ad7f58',
];
const QUEUE_COLOR = '#f2762e';
const QUEUE_SERIES = 'Cast Queue';
const XOVIS_COLOR = '#b4bccb';
const XOVIS_SERIES = 'Xovis Queue';
const Y_TICKS = 5;
const GRID = { left: 38, right: 44, top: 16, bottom: 24 };
const NOW_LINE_COLOR = 'rgba(68, 65, 204, 0.45)';
/** x 축 눈금은 30분마다지만 라벨은 정시만 남긴다 (49칸이 다 붙으면 읽히지 않는다) */
const LABEL_STEP = 2;
const TIP_ISLANDS_PER_ROW = 4;

const AXIS_LABEL = { ...SHARED_AXIS_LABEL, color: '#8b93a3', fontSize: 12 };

function toAxisMax(rawMax: number): number {
    if (rawMax <= 0) return Y_TICKS;

    const magnitude = 10 ** Math.floor(Math.log10(rawMax));

    return Math.ceil(rawMax / magnitude) * magnitude;
}

function islandColor(index: number): string {
    return ISLAND_COLORS[index % ISLAND_COLORS.length];
}

function islandSeries(islands: ChknIslandBooth[]): BarSeriesOption[] {
    return islands.map((island, index) => ({
        name: island.island,
        type: 'bar',
        stack: BOOTH_STACK,
        barWidth: '62%',
        barMaxWidth: 24,
        itemStyle: { color: islandColor(index) },
        emphasis: { focus: 'series' },
        blur: { itemStyle: { opacity: 0.25 } },
        data: island.booth,
    }));
}

function formatPsgCnt(value: number | null | undefined): string {
    return value == null ? '-' : `${value}명`;
}

function toIslandTipRows(islands: ChknIslandBooth[], index: number): string[] {
    const cells = islands.flatMap((island, islandIndex) => {
        const boothCnt = island.booth[index] ?? 0;

        return boothCnt > 0
            ? [
                  `<span style="display:inline-block;width:8px;height:8px;margin-right:4px;border-radius:2px;background:${islandColor(islandIndex)}"></span>${island.island} ${boothCnt}개`,
              ]
            : [];
    });
    const rows: string[] = [];

    for (let start = 0; start < cells.length; start += TIP_ISLANDS_PER_ROW) {
        rows.push(cells.slice(start, start + TIP_ISLANDS_PER_ROW).join('&nbsp;&nbsp;'));
    }

    return rows;
}

function toTipRow(label: string, value: string): string {
    return `<div class="chkn-tip__row"><span>${label}</span><b>${value}</b></div>`;
}

export function QueueChart({ queue, step, time }: QueueChartProps) {
    const option = useMemo<EChartsOption>(() => {
        const boothMax = toAxisMax(Math.max(...queue.booth, 0));
        const xovisValues = queue.xovisQueue.filter((value): value is number => value !== null);
        const queueMax = toAxisMax(Math.max(queue.queueMax, ...queue.queue, ...xovisValues, 0));
        const nowStep = Math.min(Math.max(queue.timeLabels.length - 1, 0), step);

        return {
            animation: false,
            grid: { ...GRID, outerBoundsMode: 'none' },
            tooltip: {
                trigger: 'axis',
                confine: true,
                textStyle: TOOLTIP_TEXT_STYLE,
                axisPointer: { type: 'shadow' },
                formatter: (params) => {
                    const items = (Array.isArray(params) ? params : [params]) as Array<{
                        dataIndex?: number;
                    }>;
                    const index = items[0]?.dataIndex;

                    if (typeof index !== 'number') return '';

                    const boothRows = [
                        `${BOOTH_SERIES} ${queue.booth[index] ?? 0}개`,
                        ...toIslandTipRows(queue.islands, index),
                    ];
                    const metricRows = [
                        toTipRow(QUEUE_SERIES, `${queue.queue[index] ?? 0}명`),
                        toTipRow(XOVIS_SERIES, formatPsgCnt(queue.xovisQueue[index])),
                        toTipRow('평균대기', `${toWaitMin(queue.waitSec[index] ?? 0)}분`),
                        toTipRow('처리인원', `${queue.prcsPsgCnt[index] ?? 0}명`),
                    ];

                    return [
                        `<div class="chkn-tip__title">${queue.timeLabels[index]}</div>`,
                        ...boothRows.map((row) => `<div>${row}</div>`),
                        `<div class="chkn-tip__metrics">${metricRows.join('')}</div>`,
                    ].join('');
                },
            },
            xAxis: {
                type: 'category',
                data: queue.timeLabels,
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: {
                    ...AXIS_LABEL,
                    margin: 8,
                    interval: (index: number) => index % LABEL_STEP === 0,
                },
            },
            yAxis: [
                {
                    type: 'value',
                    min: 0,
                    max: boothMax,
                    interval: boothMax / Y_TICKS,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { ...AXIS_LABEL, margin: 8 },
                    splitLine: { lineStyle: { color: '#eceff5', width: 1 } },
                },
                {
                    type: 'value',
                    min: 0,
                    max: queueMax,
                    interval: queueMax / Y_TICKS,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { ...AXIS_LABEL, color: QUEUE_COLOR, fontWeight: 600, margin: 8 },
                    splitLine: { show: false },
                },
            ],
            series: [
                ...islandSeries(queue.islands),
                {
                    name: QUEUE_SERIES,
                    type: 'line' as const,
                    yAxisIndex: 1,
                    z: 5,
                    symbol: 'circle',
                    symbolSize: (_: unknown, params: { dataIndex: number }) => (params.dataIndex === nowStep ? 9 : 0),
                    itemStyle: { color: '#fff', borderColor: QUEUE_COLOR, borderWidth: 2 },
                    // 주황 계열 아일랜드 막대 위에서도 선이 묻히지 않게 흰 테를 두른다
                    lineStyle: {
                        color: QUEUE_COLOR,
                        width: 2,
                        cap: 'round',
                        join: 'round',
                        shadowColor: 'rgba(255, 255, 255, 0.95)',
                        shadowBlur: 4,
                    },
                    emphasis: { disabled: true },
                    data: queue.queue,
                    markLine: {
                        silent: true,
                        symbol: 'none',
                        animation: false,
                        label: { show: false },
                        lineStyle: { color: NOW_LINE_COLOR, width: 1, type: 'solid' as const },
                        data: [{ xAxis: nowStep }],
                    },
                    markPoint: {
                        silent: true,
                        animation: false,
                        symbol: 'roundRect',
                        symbolSize: [46, 20],
                        symbolOffset: [0, -14],
                        itemStyle: { color: QUEUE_COLOR },
                        label: {
                            formatter: time,
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily: CHART_FONT_FAMILY,
                        },
                        data: queue.queue.length === 0 ? [] : [{ name: 'now', coord: [nowStep, queue.queue[nowStep] ?? 0] }],
                    },
                },
                {
                    name: XOVIS_SERIES,
                    type: 'line' as const,
                    yAxisIndex: 1,
                    z: 4,
                    connectNulls: false,
                    symbol: 'circle',
                    symbolSize: (_: unknown, params: { dataIndex: number }) => (params.dataIndex === nowStep ? 7 : 0),
                    itemStyle: { color: '#fff', borderColor: XOVIS_COLOR, borderWidth: 2 },
                    lineStyle: {
                        color: XOVIS_COLOR,
                        width: 2,
                        type: [4, 3],
                        cap: 'round',
                        join: 'round',
                        shadowColor: 'rgba(255, 255, 255, 0.95)',
                        shadowBlur: 4,
                    },
                    emphasis: { disabled: true },
                    data: queue.xovisQueue,
                },
            ],
        };
    }, [queue, step, time]);

    return (
        <div className="chkn-chart">
            <div className="chkn-chart__head">
                <p className="chkn-chart__title">아일랜드 운영 대비 대기인원</p>
                <ul className="chkn-chart__legend">
                    {queue.islands.map((island, index) => (
                        <li key={island.island} title={island.title}>
                            <i style={{ background: islandColor(index) }} aria-hidden="true" />
                            {island.island}
                        </li>
                    ))}
                    <li>
                        <i className="is-line" aria-hidden="true" />
                        {QUEUE_SERIES}
                    </li>
                    <li>
                        <i className="is-line is-xovis" aria-hidden="true" />
                        {XOVIS_SERIES}
                    </li>
                </ul>
            </div>

            <EChart className="chkn-chart__plot" option={option} />
        </div>
    );
}
