import { useMemo } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';

const SWEEP_ANGLE = 360 * 0.84;
const START_ANGLE = 360 - 119;
const END_ANGLE = START_ANGLE - SWEEP_ANGLE;
const RADIUS = `${((30 / 37) * 100).toFixed(1)}%`;
const RING_WIDTH = 3.4;
const GAUGE_SIZE_PX = 72;

interface GaugeDonutProps {
    value: number;
    centerText: string;
    captionText: string;
    accentColor: string;
}

export function GaugeDonut({ value, centerText, captionText, accentColor }: GaugeDonutProps) {
    const option = useMemo<EChartsOption>(
        () => ({
            animation: false,
            series: [
                {
                    type: 'gauge',
                    silent: true,
                    center: ['50%', '50%'],
                    radius: RADIUS,
                    startAngle: START_ANGLE,
                    endAngle: END_ANGLE,
                    min: 0,
                    max: 1,
                    axisLine: {
                        roundCap: true,
                        lineStyle: { width: RING_WIDTH, color: [[1, '#e7ebf2']] },
                    },
                    progress: {
                        show: true,
                        roundCap: true,
                        width: RING_WIDTH,
                        itemStyle: { color: accentColor },
                    },
                    pointer: { show: false },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    detail: {
                        offsetCenter: [0, -5],
                        formatter: () => centerText,
                        fontSize: 15.6,
                        fontWeight: 700,
                        color: '#23272f',
                        fontFamily: 'Pretendard, sans-serif',
                    },
                    title: {
                        offsetCenter: [0, 9],
                        fontSize: 9.7,
                        color: '#8a93a3',
                        fontFamily: 'Pretendard, sans-serif',
                    },
                    data: [{ value: Math.min(Math.max(value, 0), 1), name: captionText }],
                },
            ],
        }),
        [value, centerText, captionText, accentColor],
    );

    return (
        <div className="donut">
            <EChart className="donut__chart" style={{ width: GAUGE_SIZE_PX, height: GAUGE_SIZE_PX }} option={option} />
        </div>
    );
}
