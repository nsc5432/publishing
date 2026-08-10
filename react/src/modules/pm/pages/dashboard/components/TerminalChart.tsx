import { useMemo } from 'react';
import { echarts, type EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import type { DsbdRsltDto } from '@/types/api.types';
import { formatCount } from '../format';

/* 원본 퍼블리싱은 430x190 viewBox 를 그대로 늘려 그렸다. 그 좌표를 화면 픽셀로
   환산한 값이 아래 여백이다 (디자인 기준 크기 393x191 의 차트 영역). */
const GRID = { left: 40, right: 16, top: 26, bottom: 14 };
/** Y축 눈금 칸 수 (라벨은 7개) */
const STEPS = 6;
/** 3시간 간격으로 x축 라벨을 찍는다 */
const AXIS_STEP = 3;
/** 피크 막대 폭 — 원본 19 (viewBox) */
const PEAK_BAR_WIDTH = 17;

const AXIS_LABEL = { color: '#9aa3b2', fontSize: 11, fontFamily: 'Pretendard, sans-serif' };

/** axis 트리거 툴팁이 시리즈마다 넘겨 주는 값 (ECharts 타입에는 axisValue 가 빠져 있다) */
interface AxisTooltipItem {
    seriesName?: string;
    marker?: string;
    axisValue?: string;
    value?: number;
}

/**
 * Y축 최댓값을 눈금이 딱 떨어지는 값으로 올린다.
 * (실제 최댓값을 그대로 쓰면 라벨이 137, 274 … 처럼 읽기 어려운 수가 된다)
 */
function niceMax(value: number): number {
    // 값이 없거나 아주 작을 때 0.2·0.4 같은 눈금이 뜨지 않도록 눈금 수만큼은 확보한다.
    if (value <= STEPS) return STEPS;

    const rough = value / STEPS;
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const step = [1, 2, 2.5, 5, 10].find((unit) => unit * magnitude >= rough) ?? 10;

    return step * magnitude * STEPS;
}

interface TerminalChartProps {
    rsltList: DsbdRsltDto[];
    /** 피크 시간대 — 세로 막대로 표시 */
    peakIndex: number;
}

/**
 * 터미널 패널의 큰 차트 — 시간대별 대기인원 예측/실적.
 *
 * 색과 선 모양은 범례(예측=빨강 실선 / 실적=파랑 점선)에 맞춘다.
 */
export function TerminalChart({ rsltList, peakIndex }: TerminalChartProps) {
    const option = useMemo<EChartsOption>(() => {
        const max = niceMax(
            Math.max(1, ...rsltList.map((r) => Math.max(r.fcstWtngPsgCnt, r.wtngPsgCnt))),
        );
        const hasData = rsltList.length > 0;

        /* 피크 막대는 0 에서 시작하지 않고 한 칸(눈금 1개) 띄운 곳부터 그린다.
           투명한 받침 막대를 아래에 쌓아 그 높이를 만든다. */
        const peakAt = (value: number) =>
            rsltList.map((_, i) => (hasData && i === peakIndex ? value : null));

        return {
            animation: false,
            grid: { ...GRID, outerBoundsMode: 'none' },
            tooltip: {
                trigger: 'axis',
                confine: true,
                textStyle: { fontSize: 12, fontFamily: 'Pretendard, sans-serif' },
                // 피크 막대(받침 포함)는 안내할 값이 아니다.
                formatter: (params) => {
                    const list = (Array.isArray(params) ? params : [params]) as AxisTooltipItem[];
                    const items = list.filter(
                        (p) => p.seriesName === '예측' || p.seriesName === '실적',
                    );
                    if (items.length === 0) return '';

                    const rows = items
                        .map(
                            (p) =>
                                `${p.marker}${p.seriesName} <b>${formatCount(Number(p.value ?? 0))}</b>명`,
                        )
                        .join('<br/>');

                    return `${items[0].axisValue}<br/>${rows}`;
                },
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: rsltList.map((rslt) => `${Number(rslt.time.slice(0, 2))}H`),
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { show: false },
                // 원본은 x축 라벨을 0선 바로 위에 겹쳐 그린다.
                axisLabel: {
                    ...AXIS_LABEL,
                    margin: -14,
                    interval: (index: number) =>
                        index % AXIS_STEP === 0 || index === rsltList.length - 1,
                },
            },
            yAxis: {
                type: 'value',
                min: 0,
                max,
                interval: max / STEPS,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    ...AXIS_LABEL,
                    margin: 14,
                    formatter: (value: number) => formatCount(Math.round(value)),
                },
                // 색 배열은 아래(0선)부터 돌아간다. 0선은 x축 라벨 자리라 긋지 않는다.
                splitLine: {
                    lineStyle: {
                        color: ['transparent', ...Array<string>(STEPS).fill('#eceff5')],
                        width: 1,
                    },
                },
            },
            series: [
                {
                    name: '피크받침',
                    type: 'bar',
                    stack: 'peak',
                    barWidth: PEAK_BAR_WIDTH,
                    silent: true,
                    itemStyle: { color: 'transparent' },
                    data: peakAt(max / STEPS),
                },
                {
                    name: '피크',
                    type: 'bar',
                    stack: 'peak',
                    barWidth: PEAK_BAR_WIDTH,
                    silent: true,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#ff8f8f' },
                            { offset: 0.45, color: '#ff1a1a' },
                            { offset: 1, color: '#ffa3a3' },
                        ]),
                    },
                    data: peakAt(max - max / STEPS),
                },
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
    }, [rsltList, peakIndex]);

    return <EChart className="chartbox__chart" option={option} />;
}
