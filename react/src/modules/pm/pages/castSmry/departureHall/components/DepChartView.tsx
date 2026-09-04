import { useMemo } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import { AXIS_LABEL as SHARED_AXIS_LABEL, TOOLTIP_TEXT_STYLE } from '@/lib/chart';
import type { DepTrend } from '../types';

interface DepChartViewProps {
    trend: DepTrend;
    step: number;
    time: string;
}

const Y_TICKS = 5;
const X_LABEL_STEP = 4;
const GRID = { left: 52, right: 0, top: 0, bottom: 26 };
const NOW_LINE_COLOR = 'rgba(68, 65, 204, 0.45)';
const PRIMARY_COLOR = '#4441cc';

const AXIS_LABEL = { ...SHARED_AXIS_LABEL, color: '#8b93a3', fontSize: 12 };

function toAxisMax(rawMax: number) {
    if (rawMax <= 0) return Y_TICKS;

    const magnitude = 10 ** Math.floor(Math.log10(rawMax));

    return Math.ceil(rawMax / magnitude) * magnitude;
}

export function DepChartView({ trend, step, time }: DepChartViewProps) {
    const option = useMemo<EChartsOption>(() => {
        const axisMax = toAxisMax(Math.max(...trend.series.flatMap((series) => series.values), 0));

        return {
            animation: false,
            grid: { ...GRID, outerBoundsMode: 'none' },
            tooltip: {
                trigger: 'axis',
                confine: true,
                textStyle: TOOLTIP_TEXT_STYLE,
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: trend.timeLabels,
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: {
                    ...AXIS_LABEL,
                    margin: 7,
                    interval: (index: number) => index % X_LABEL_STEP === 0,
                },
            },
            yAxis: {
                type: 'value',
                min: 0,
                max: axisMax,
                interval: axisMax / Y_TICKS,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    ...AXIS_LABEL,
                    margin: 10,
                    formatter: (value: number, index: number) => {
                        if (index === Y_TICKS) return `{top|${value}}`;
                        if (index === 0) return `{bottom|${value}}`;

                        return String(value);
                    },
                    rich: {
                        top: { ...AXIS_LABEL, padding: [AXIS_LABEL.fontSize, 0, 0, 0] },
                        bottom: { ...AXIS_LABEL, padding: [0, 0, AXIS_LABEL.fontSize, 0] },
                    },
                },
                splitLine: { lineStyle: { color: '#eceff5', width: 1 } },
            },
            series: trend.series.map((series, seriesIndex) => ({
                name: series.title,
                type: 'line' as const,
                symbol: 'circle',
                symbolSize: (_: unknown, params: { dataIndex: number }) => (params.dataIndex === step ? 9 : 0),
                itemStyle: { color: '#fff', borderColor: series.color, borderWidth: 2 },
                lineStyle: { color: series.color, width: 2, cap: 'round', join: 'round' },
                emphasis: { disabled: true },
                z: 3,
                data: series.values,
                ...(seriesIndex === 0
                    ? {
                          markLine: {
                              silent: true,
                              symbol: 'none',
                              animation: false,
                              label: { show: false },
                              lineStyle: {
                                  color: NOW_LINE_COLOR,
                                  width: 1,
                                  type: 'solid' as const,
                              },
                              data: [{ xAxis: step }],
                          },
                          markPoint: {
                              silent: true,
                              animation: false,
                              symbol: 'roundRect',
                              symbolSize: [Math.max(44, time.length * 8), 20],
                              symbolOffset: [0, 16],
                              itemStyle: { color: PRIMARY_COLOR },
                              label: {
                                  formatter: time,
                                  color: '#fff',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  fontFamily: 'Pretendard, sans-serif',
                              },
                              data: [{ name: 'now', coord: [step, axisMax] }],
                          },
                      }
                    : {}),
            })),
        };
    }, [trend, step, time]);

    return (
        <div className="dep-chart">
            <div className="dep-chart__head">
                <p className="dep-chart__title">
                    출국장별 대기인원 추이 <em>(단위: 명)</em>
                </p>
                <ul className="dep-chart__legend">
                    {trend.series.map((series) => (
                        <li key={series.dptgtNo}>
                            <i style={{ background: series.color }} aria-hidden="true" />
                            {series.title}
                        </li>
                    ))}
                </ul>
            </div>

            <EChart className="dep-chart__plot" option={option} />
        </div>
    );
}
