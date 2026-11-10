import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EChartsInstance, EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import type { DsbdRsltDto } from '@/types/api.types';
import { formatCount } from '@/lib/format';
import { AXIS_LABEL, toTooltipItems, TOOLTIP_TEXT_STYLE } from '@/lib/chart';

const GRID = { left: 40, right: 34, top: 40, bottom: 14 };
const Y_TICK_COUNT = 6;
const X_LABEL_INTERVAL = 3;
const POINT_ANIMATION_DELAY_MS = 40;
const REPLAY_INTERVAL_MS = 10 * 1000; // 10초
const SERIES_UNIT: Record<string, string> = { 예측: '명', 실적: '명', 운항편: '건' };
const AXIS_NAME = { nameLocation: 'end' as const, nameGap: 8, nameTextStyle: { ...AXIS_LABEL } };

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
    selectedHhmm: string;
    onHourSelect: (hhmm: string) => void;
}

function roundUpAxisMax(value: number): number {
    if (value <= Y_TICK_COUNT) return Y_TICK_COUNT;

    const roughStep = value / Y_TICK_COUNT;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const niceStep = [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= roughStep) ?? 10;

    return niceStep * magnitude * Y_TICK_COUNT;
}

export function TerminalChart({ rsltList, selectedHhmm, onHourSelect }: TerminalChartProps) {
    const [replayTick, setReplayTick] = useState(0);
    const rsltListRef = useRef(rsltList);
    const hourSelectRef = useRef(onHourSelect);

    const handleChartReady = useCallback((chart: EChartsInstance) => {
        chart.getZr().on('click', (event) => {
            const point = [event.offsetX, event.offsetY];
            if (!chart.containPixel({ gridIndex: 0 }, point)) return;

            const [index] = chart.convertFromPixel({ gridIndex: 0 }, point) as number[];
            const rslt = rsltListRef.current[Math.round(index)];
            if (rslt) hourSelectRef.current(`${rslt.time.slice(0, 2)}00`);
        });
    }, []);

    useEffect(() => {
        rsltListRef.current = rsltList;
        hourSelectRef.current = onHourSelect;
    }, [rsltList, onHourSelect]);

    useEffect(() => {
        const timer = window.setInterval(() => setReplayTick((tick) => tick + 1), REPLAY_INTERVAL_MS);
        return () => window.clearInterval(timer);
    }, []);

    const option = useMemo<EChartsOption>(() => {
        const axisMax = roundUpAxisMax(Math.max(1, ...rsltList.map((rslt) => Math.max(rslt.fcstWtngPsgCnt, rslt.wtngPsgCnt ?? 0))));
        const fltAxisMax = roundUpAxisMax(Math.max(1, ...rsltList.map((rslt) => rslt.fltCnt)));
        const selectedIndex = rsltList.findIndex((rslt) => rslt.time.slice(0, 2) === selectedHhmm.slice(0, 2));

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
                        (item) => item.seriesName !== undefined && item.seriesName in SERIES_UNIT && item.value !== null && item.value !== undefined,
                    );
                    if (seriesItems.length === 0) return '';

                    const lines = seriesItems
                        .map((item) => `${item.marker}${item.seriesName} <b>${formatCount(Number(item.value))}</b>${SERIES_UNIT[item.seriesName ?? '']}`)
                        .join('<br/>');

                    return `${seriesItems[0].axisValue}<br/>${lines}`;
                },
            },
            xAxis: {
                type: 'category',
                boundaryGap: true,
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
            yAxis: [
                {
                    type: 'value',
                    name: '대기인원(명)',
                    ...AXIS_NAME,
                    nameTextStyle: { ...AXIS_NAME.nameTextStyle, align: 'left', padding: [0, 0, 0, -GRID.left + 4] },
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
                {
                    type: 'value',
                    name: '운항편(건)',
                    ...AXIS_NAME,
                    nameTextStyle: { ...AXIS_NAME.nameTextStyle, align: 'right', padding: [0, -GRID.right + 4, 0, 0] },
                    min: 0,
                    max: fltAxisMax,
                    interval: fltAxisMax / Y_TICK_COUNT,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: {
                        ...AXIS_LABEL,
                        margin: 8,
                        formatter: (value: number) => formatCount(Math.round(value)),
                    },
                    splitLine: { show: false },
                },
            ],
            series: [
                {
                    name: '운항편',
                    type: 'bar',
                    yAxisIndex: 1,
                    z: 1,
                    barWidth: '56%',
                    itemStyle: { color: 'rgba(63, 128, 234, 0.55)', borderRadius: [3, 3, 0, 0] },
                    emphasis: { itemStyle: { color: 'rgba(63, 128, 234, 0.75)' } },
                    data: rsltList.map((rslt) => rslt.fltCnt),
                },
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
                    markLine:
                        selectedIndex < 0
                            ? undefined
                            : {
                                  silent: true,
                                  symbol: 'none',
                                  animation: false,
                                  label: { show: false },
                                  lineStyle: { color: '#5b6170', width: 1.4, type: 'dashed' },
                                  data: [{ xAxis: selectedIndex }],
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
    }, [rsltList, selectedHhmm]);

    return <EChart key={replayTick} className="chartbox__chart" option={option} onChartReady={handleChartReady} />;
}
