import { useMemo } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import type { DsbdRsltDto } from '@/types/api.types';
import { formatCount } from '@/lib/format';
import { AXIS_LABEL, toTooltipItems, TOOLTIP_TEXT_STYLE } from '@/lib/chart';

const GRID = { left: 40, right: 16, top: 26, bottom: 14 };
const Y_TICK_COUNT = 6;
const X_LABEL_INTERVAL = 3;

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
    const option = useMemo<EChartsOption>(() => {
        const axisMax = roundUpAxisMax(Math.max(1, ...rsltList.map((rslt) => Math.max(rslt.fcstWtngPsgCnt, rslt.wtngPsgCnt ?? 0))));

        return {
            animation: true,
            animationDuration: 500,
            animationEasing: 'cubicOut',
            animationDurationUpdate: 500,
            animationEasingUpdate: 'cubicOut',
            grid: { ...GRID, outerBoundsMode: 'none' },
            tooltip: {
                trigger: 'axis',
                confine: true,
                textStyle: TOOLTIP_TEXT_STYLE,
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
                    interval: (index: number) => index % X_LABEL_INTERVAL === 0 || index === rsltList.length - 1,
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
                    itemStyle: { color: '#f43f3f' },
                    lineStyle: { color: '#f43f3f', width: 1.8, join: 'round' },
                    data: rsltList.map((rslt) => rslt.fcstWtngPsgCnt),
                },
                {
                    name: '실적',
                    type: 'line',
                    symbol: 'circle',
                    symbolSize: 5.4,
                    itemStyle: { color: '#3b82f6' },
                    lineStyle: { color: '#3b82f6', width: 1.5, type: [4, 3], join: 'round' },
                    data: rsltList.map((rslt) => rslt.wtngPsgCnt),
                },
            ],
        };
    }, [rsltList]);

    return <EChart className="chartbox__chart" option={option} />;
}
