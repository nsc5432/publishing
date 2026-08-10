import { useMemo } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';

/* 원본 퍼블리싱(buildDonut): 74x74 viewBox 에 반지름 30, 굵기 3.4 의 84% 아크.
   119° 돌려 그려서 트인 곳이 아래로 온다. */
/** 게이지가 차지하는 각도 (360° 의 84%) */
const SWEEP = 360 * 0.84;
/** 시작 각 — ECharts 는 3시 방향이 0°, 반시계가 + 다 */
const START_ANGLE = 360 - 119;
const END_ANGLE = START_ANGLE - SWEEP;
/** 지름 72px 안에서의 반지름 30/37 */
const RADIUS = `${((30 / 37) * 100).toFixed(1)}%`;
const RING_WIDTH = 3.4;
/** 게이지 한 변 — dashboard.css 의 .gauge .donut__chart 와 같은 값 */
const SIZE = 72;

interface GaugeDonutProps {
    /** 0~1 */
    value: number;
    /** 가운데 큰 글자 */
    main: string;
    /** 큰 글자 아래 작은 글자 */
    sub: string;
    /** 게이지 색 (터미널별로 다르다) */
    acc: string;
}

/** 체크인카운터 / 출국장 카드의 도넛 게이지 (시간당 처리율 · 혼잡해소 예상). */
export function GaugeDonut({ value, main, sub, acc }: GaugeDonutProps) {
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
                        itemStyle: { color: acc },
                    },
                    pointer: { show: false },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    detail: {
                        offsetCenter: [0, -5],
                        formatter: () => main,
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
                    data: [{ value: Math.min(Math.max(value, 0), 1), name: sub }],
                },
            ],
        }),
        [value, main, sub, acc],
    );

    return (
        <div className="donut">
            <EChart
                className="donut__chart"
                style={{ width: SIZE, height: SIZE }}
                option={option}
            />
        </div>
    );
}
