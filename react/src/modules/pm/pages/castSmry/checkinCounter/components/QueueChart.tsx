import { useMemo } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import { AXIS_LABEL as SHARED_AXIS_LABEL, CHART_FONT_FAMILY, TOOLTIP_TEXT_STYLE } from '@/lib/chart';
import { toWaitMin } from '../view';
import type { ChknQueueSeries } from '../types';

interface QueueChartProps {
    queue: ChknQueueSeries;
    step: number;
    time: string;
}

const BOOTH_COLOR = '#4441cc';
const BOOTH_SERIES = '운영 부스';
const QUEUE_COLOR = '#f2762e';
const QUEUE_SERIES = 'Queue 인원';
const Y_TICKS = 5;
const GRID = { left: 38, right: 44, top: 16, bottom: 24 };
const NOW_LINE_COLOR = 'rgba(68, 65, 204, 0.45)';
/** x 축 눈금은 30분마다지만 라벨은 정시만 남긴다 (49칸이 다 붙으면 읽히지 않는다) */
const LABEL_STEP = 2;

const AXIS_LABEL = { ...SHARED_AXIS_LABEL, color: '#8b93a3', fontSize: 12 };

function toAxisMax(rawMax: number): number {
    if (rawMax <= 0) return Y_TICKS;

    const magnitude = 10 ** Math.floor(Math.log10(rawMax));

    return Math.ceil(rawMax / magnitude) * magnitude;
}

export function QueueChart({ queue, step, time }: QueueChartProps) {
    const option = useMemo<EChartsOption>(() => {
        const boothMax = toAxisMax(Math.max(...queue.booth, 0));
        const queueMax = toAxisMax(Math.max(queue.queueMax, ...queue.queue, 0));
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

                    const rows = [
                        `${BOOTH_SERIES} ${queue.booth[index] ?? 0}개`,
                        `${QUEUE_SERIES} ${queue.queue[index] ?? 0}명`,
                        `평균대기 ${toWaitMin(queue.waitSec[index] ?? 0)}분`,
                        `처리인원 ${queue.prcsPsgCnt[index] ?? 0}명`,
                        `처리용량 사용률 ${queue.prcsRate[index] ?? 0}%`,
                    ];

                    return [queue.timeLabels[index], ...rows].join('<br/>');
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
                {
                    name: BOOTH_SERIES,
                    type: 'bar' as const,
                    barMaxWidth: 12,
                    itemStyle: {
                        color: BOOTH_COLOR,
                        borderRadius: [4, 4, 0, 0] as [number, number, number, number],
                    },
                    emphasis: { disabled: true },
                    data: queue.booth,
                },
                {
                    name: QUEUE_SERIES,
                    type: 'line' as const,
                    yAxisIndex: 1,
                    z: 5,
                    symbol: 'circle',
                    symbolSize: (_: unknown, params: { dataIndex: number }) => (params.dataIndex === nowStep ? 9 : 0),
                    itemStyle: { color: '#fff', borderColor: QUEUE_COLOR, borderWidth: 2 },
                    lineStyle: { color: QUEUE_COLOR, width: 2, cap: 'round', join: 'round' },
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
            ],
        };
    }, [queue, step, time]);

    return (
        <div className="chkn-chart">
            <div className="chkn-chart__head">
                <p className="chkn-chart__title">
                    30분 단위 운영 부스와 공용 Queue 인원 <em>(단위: 개 / 명)</em>
                </p>
                <ul className="chkn-chart__legend">
                    <li>
                        <i style={{ background: BOOTH_COLOR }} aria-hidden="true" />
                        {BOOTH_SERIES}
                    </li>
                    <li>
                        <i className="is-line" aria-hidden="true" />
                        {QUEUE_SERIES}
                    </li>
                </ul>
            </div>

            <EChart className="chkn-chart__plot" option={option} />
        </div>
    );
}
