import { useMemo } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import type { HourlyPsgDto } from '@/types/api.types';
import { formatCount } from '@/lib/format';
import { toTooltipItems, TOOLTIP_TEXT_STYLE } from '@/lib/chart';

const GRID = { left: 0, right: 0, top: 6, bottom: 11 };
const CHART_HEIGHT = 48;
const X_LABEL_INTERVAL = 3;
const BAR_COLOR = '#c5cbd6';
const POINT_SIZE = 4;
const EMPTY_ITEMS: HourlyPsgDto['itemList'] = [];

interface HourlyPsgChartProps {
    data: HourlyPsgDto | null;
    iconSrc: string;
    iconAlt: string;
    lineColor: string;
}

export function HourlyPsgChart({ data, iconSrc, iconAlt, lineColor }: HourlyPsgChartProps) {
    const items = data?.itemList ?? EMPTY_ITEMS;
    const axisMax = Math.max(1, data?.maxPsgCnt ?? 1);

    const option = useMemo<EChartsOption>(
        () => ({
            animation: false,
            grid: { ...GRID, outerBoundsMode: 'none' },
            tooltip: {
                trigger: 'axis',
                confine: true,
                textStyle: TOOLTIP_TEXT_STYLE,
                formatter: (params) => {
                    const tooltipItems = toTooltipItems(params);
                    if (tooltipItems.length === 0) return '';

                    const lines = tooltipItems.map((item) => `${item.marker}${item.seriesName} <b>${formatCount(Number(item.value ?? 0))}</b>명`).join('<br/>');

                    return `${tooltipItems[0].axisValue}시<br/>${lines}`;
                },
            },
            xAxis: {
                type: 'category',
                data: items.map((item) => Number(item.time)),
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { show: false },
                splitLine: { show: false },
            },
            yAxis: {
                type: 'value',
                min: 0,
                max: axisMax,
                interval: axisMax / 2,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { show: false },
                splitLine: { lineStyle: { color: '#e4e8f0', width: 0.9 } },
            },
            series: [
                {
                    name: '예고',
                    type: 'bar',
                    barWidth: '66%',
                    itemStyle: { color: BAR_COLOR, borderRadius: [2, 2, 0, 0] },
                    data: items.map((item) => item.fcstPsgCnt),
                },
                {
                    name: '실적',
                    type: 'line',
                    symbol: 'circle',
                    symbolSize: POINT_SIZE,
                    showAllSymbol: true,
                    itemStyle: { color: lineColor, borderColor: '#fff', borderWidth: 1 },
                    lineStyle: { color: lineColor, width: 1.5, cap: 'round', join: 'round' },
                    data: items.map((item) => item.psgCnt),
                },
            ],
        }),
        [items, axisMax, lineColor],
    );

    return (
        <>
            <div className="hourly-row">
                <span className="ic">
                    <img className="tico" src={iconSrc} alt={iconAlt} />
                </span>
                <EChart className="hourly-row__chart" style={{ height: CHART_HEIGHT }} option={option} />
                <div className="ylab">
                    <span>{formatCount(axisMax)}</span>
                    <span>{formatCount(Math.round(axisMax / 2))}</span>
                    <span>0</span>
                </div>
            </div>
            <div className="axis-row">
                <span className="ic" />
                <div className="axis">
                    {items
                        .filter((_, index) => index % X_LABEL_INTERVAL === 0)
                        .map((item) => (
                            <span key={item.time}>{Number(item.time)}</span>
                        ))}
                </div>
            </div>
        </>
    );
}
