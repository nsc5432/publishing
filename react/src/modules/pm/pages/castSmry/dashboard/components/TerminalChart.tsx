import { useEffect, useMemo, useState } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import type { DsbdRsltDto } from '@/types/api.types';
import { formatCount } from '@/lib/format';
import { AXIS_LABEL, toTooltipItems, TOOLTIP_TEXT_STYLE } from '@/lib/chart';

const GRID = { left: 40, right: 16, top: 26, bottom: 14 };
const Y_TICK_COUNT = 6;
const X_LABEL_INTERVAL = 3;
const POINT_ANIMATION_DELAY_MS = 40;
const REPLAY_INTERVAL_MS = 10 * 1000; // 10초

function toAreaGradient(rgb: string) {
    return {
        type: 'linear' as const,
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
            { offset: 0, color: `rgba(${rgb}, 0.28)` },
            { offset: 1, color: `rgba(${rgb}, 0)` },
        ],
    };
}

interface TerminalChartProps {
    rsltList: DsbdRsltDto[];
}

function roundUpAxisMax(value: number): number {
    if (value <= Y_TICK_COUNT) return Y_TICK_COUNT;

    const roughStep = value / Y_TICK_COUNT;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const niceStep = [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= roughStep) ?? 10;

    return niceStep * magnitude * Y_TICK_COUNT;
}

export function TerminalChart({ rsltList }: TerminalChartProps) {
    const [replayTick, setReplayTick] = useState(0);

    useEffect(() => {
        const timer = window.setInterval(() => setReplayTick((tick) => tick + 1), REPLAY_INTERVAL_MS);
        return () => window.clearInterval(timer);
    }, []);

    const option = useMemo<EChartsOption>(() => {
        const axisMax = roundUpAxisMax(Math.max(1, ...rsltList.map((rslt) => Math.max(rslt.fcstWtngPsgCnt, rslt.wtngPsgCnt ?? 0))));

        return {
            animation: true,
            animationDuration: 1200,
            animationEasing: 'cubicOut',
            animationDelay: (index: number) => index * POINT_ANIMATION_DELAY_MS,
            animationDurationUpdate: 600,
            animationEasingUpdate: 'cubicInOut',
            grid: { ...GRID, outerBoundsMode: 'none' },
            tooltip: {
                trigger: 'axis',
                confine: true,
                textStyle: TOOLTIP_TEXT_STYLE,
                axisPointer: {
                    type: 'line',
                    lineStyle: { color: '#c7cdda', width: 1, type: 'dashed' },
                },
                formatter: (params) => {
                    const tooltipItems = toTooltipItems(params);
                    const seriesItems = tooltipItems.filter(
                        (item) => (item.seriesName === '예측' || item.seriesName === '실적') && item.value !== null && item.value !== undefined,
                    );
                    if (seriesItems.length === 0) return '';

                    const lines = seriesItems.map((item) => `${item.marker}${item.seriesName} <b>${formatCount(Number(item.value))}</b>명`).join('<br/>');

                    return `${seriesItems[0].axisValue}<br/>${lines}`;
                },
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: rsltList.map((rslt) => `${Number(rslt.time.slice(0, 2))}H`),
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: {
                    ...AXIS_LABEL,
                    margin: -14,
                    interval: (index: number) => {
                        const last = rsltList.length - 1;
                        if (index === last) return true;
                        return index % X_LABEL_INTERVAL === 0 && last - index >= X_LABEL_INTERVAL;
                    },
                },
            },
            yAxis: {
                type: 'value',
                min: 0,
                max: axisMax,
                interval: axisMax / Y_TICK_COUNT,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    ...AXIS_LABEL,
                    margin: 14,
                    formatter: (value: number) => formatCount(Math.round(value)),
                },
                splitLine: {
                    lineStyle: {
                        color: ['transparent', ...Array<string>(Y_TICK_COUNT).fill('#eceff5')],
                        width: 1,
                    },
                },
            },
            series: [
                {
                    name: '예측',
                    type: 'line',
                    symbol: 'circle',
                    symbolSize: 5.4,
                    itemStyle: { color: '#f43f3f', borderColor: '#fff', borderWidth: 1.5 },
                    lineStyle: {
                        color: '#f43f3f',
                        width: 2.2,
                        join: 'round',
                        shadowColor: 'rgba(244, 63, 63, 0.45)',
                        shadowBlur: 8,
                        shadowOffsetY: 3,
                    },
                    areaStyle: { color: toAreaGradient('244, 63, 63') },
                    emphasis: {
                        focus: 'series',
                        scale: 1.9,
                        itemStyle: { shadowColor: 'rgba(244, 63, 63, 0.6)', shadowBlur: 10 },
                    },
                    data: rsltList.map((rslt) => rslt.fcstWtngPsgCnt),
                },
                {
                    name: '실적',
                    type: 'line',
                    symbol: 'circle',
                    symbolSize: 5.4,
                    animationDelay: (index: number) => index * POINT_ANIMATION_DELAY_MS + 250,
                    itemStyle: { color: '#3b82f6', borderColor: '#fff', borderWidth: 1.5 },
                    lineStyle: {
                        color: '#3b82f6',
                        width: 1.8,
                        type: [4, 3],
                        join: 'round',
                        shadowColor: 'rgba(59, 130, 246, 0.4)',
                        shadowBlur: 6,
                        shadowOffsetY: 2,
                    },
                    areaStyle: { color: toAreaGradient('59, 130, 246') },
                    emphasis: {
                        focus: 'series',
                        scale: 1.9,
                        itemStyle: { shadowColor: 'rgba(59, 130, 246, 0.6)', shadowBlur: 10 },
                    },
                    data: rsltList.map((rslt) => rslt.wtngPsgCnt),
                },
            ],
        };
    }, [rsltList]);

    return <EChart key={replayTick} className="chartbox__chart" option={option} />;
}
