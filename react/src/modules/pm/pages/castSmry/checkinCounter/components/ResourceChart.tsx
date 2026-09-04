import { useMemo } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import { AXIS_LABEL as SHARED_AXIS_LABEL, CHART_FONT_FAMILY, TOOLTIP_TEXT_STYLE } from '@/lib/chart';
import type { ChknResourceSeries } from '../types';

interface ResourceChartProps {
    resource: ChknResourceSeries;
    step: number;
    time: string;
}

const RESOURCE_SERIES = [
    { key: 'counter', name: '유인 체크인카운터', color: '#4441cc', unit: '개' },
    { key: 'kiosk', name: '셀프체크인', color: '#7472e0', unit: '대' },
    { key: 'bagdrop', name: '셀프백드롭', color: '#12b09a', unit: '대' },
] as const;

const WAIT_COLOR = '#f2762e';
const WAIT_SERIES = '대기인원';
const Y_TICKS = 5;
const GRID = { left: 38, right: 44, top: 16, bottom: 24 };
const NOW_LINE_COLOR = 'rgba(68, 65, 204, 0.45)';
const STEP_PER_HOUR = 2;
const LAST_HOUR = 23;

const AXIS_LABEL = { ...SHARED_AXIS_LABEL, color: '#8b93a3', fontSize: 12 };

function toAxisMax(rawMax: number): number {
    if (rawMax <= 0) return Y_TICKS;

    const magnitude = 10 ** Math.floor(Math.log10(rawMax));

    return Math.ceil(rawMax / magnitude) * magnitude;
}

export function ResourceChart({ resource, step, time }: ResourceChartProps) {
    const option = useMemo<EChartsOption>(() => {
        const rsrcMax = toAxisMax(Math.max(...resource.counter.map((counter, hour) => counter + resource.kiosk[hour] + resource.bagdrop[hour]), 0));
        const waitMax = toAxisMax(Math.max(resource.waitMax, ...resource.wait, 0));
        const nowHour = Math.min(LAST_HOUR, Math.floor(step / STEP_PER_HOUR));

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

                    const rows = [
                        ...RESOURCE_SERIES.map((series) => `${series.name} ${resource[series.key][index] ?? 0}${series.unit}`),
                        `${WAIT_SERIES} ${resource.wait[index] ?? 0}명`,
                        `자원 활용률 ${resource.utilRate[index] ?? 0}%`,
                    ];

                    return [`${resource.hourLabels[index]}:00`, ...rows].join('<br/>');
                },
            },
            xAxis: {
                type: 'category',
                data: resource.hourLabels,
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { ...AXIS_LABEL, margin: 8 },
            },
            yAxis: [
                {
                    type: 'value',
                    min: 0,
                    max: rsrcMax,
                    interval: rsrcMax / Y_TICKS,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { ...AXIS_LABEL, margin: 8 },
                    splitLine: { lineStyle: { color: '#eceff5', width: 1 } },
                },
                {
                    type: 'value',
                    min: 0,
                    max: waitMax,
                    interval: waitMax / Y_TICKS,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { ...AXIS_LABEL, color: WAIT_COLOR, fontWeight: 600, margin: 8 },
                    splitLine: { show: false },
                },
            ],
            series: [
                ...RESOURCE_SERIES.map((series, seriesIndex) => ({
                    name: series.name,
                    type: 'bar' as const,
                    stack: 'resource',
                    barMaxWidth: 18,
                    itemStyle: {
                        color: series.color,
                        borderRadius: seriesIndex === RESOURCE_SERIES.length - 1 ? ([4, 4, 0, 0] as [number, number, number, number]) : 0,
                    },
                    emphasis: { disabled: true },
                    data: resource[series.key],
                })),
                {
                    name: WAIT_SERIES,
                    type: 'line' as const,
                    yAxisIndex: 1,
                    z: 5,
                    symbol: 'circle',
                    symbolSize: (_: unknown, params: { dataIndex: number }) => (params.dataIndex === nowHour ? 9 : 0),
                    itemStyle: { color: '#fff', borderColor: WAIT_COLOR, borderWidth: 2 },
                    lineStyle: { color: WAIT_COLOR, width: 2, cap: 'round', join: 'round' },
                    emphasis: { disabled: true },
                    data: resource.wait,
                    markLine: {
                        silent: true,
                        symbol: 'none',
                        animation: false,
                        label: { show: false },
                        lineStyle: { color: NOW_LINE_COLOR, width: 1, type: 'solid' as const },
                        data: [{ xAxis: nowHour }],
                    },
                    markPoint: {
                        silent: true,
                        animation: false,
                        symbol: 'roundRect',
                        symbolSize: [46, 20],
                        symbolOffset: [0, -14],
                        itemStyle: { color: WAIT_COLOR },
                        label: {
                            formatter: time,
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily: CHART_FONT_FAMILY,
                        },
                        data: resource.wait.length === 0 ? [] : [{ name: 'now', coord: [nowHour, resource.wait[nowHour] ?? 0] }],
                    },
                },
            ],
        };
    }, [resource, step, time]);

    return (
        <div className="chkn-chart">
            <div className="chkn-chart__head">
                <p className="chkn-chart__title">
                    시간대별 자원 운영 현황과 대기인원 <em>(단위: 개·대 / 명)</em>
                </p>
                <ul className="chkn-chart__legend">
                    {RESOURCE_SERIES.map((series) => (
                        <li key={series.key}>
                            <i style={{ background: series.color }} aria-hidden="true" />
                            {series.name}
                        </li>
                    ))}
                    <li>
                        <i className="is-line" aria-hidden="true" />
                        {WAIT_SERIES}
                    </li>
                </ul>
            </div>

            <EChart className="chkn-chart__plot" option={option} />
        </div>
    );
}
