import { useMemo } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import type { DsbdRsltDto } from '@/types/api.types';
import { formatCount } from '@/lib/format';
import { AXIS_LABEL, toTooltipItems, TOOLTIP_TEXT_STYLE } from '@/lib/chart';

/* 원본 퍼블리싱은 430x190 viewBox 를 그대로 늘려 그렸다. 그 좌표를 화면 픽셀로
   환산한 값이 아래 여백이다 (디자인 기준 크기 393x191 의 차트 영역). */
const GRID = { left: 40, right: 16, top: 26, bottom: 14 };
/** Y축 눈금 칸 수 (라벨은 7개) */
const Y_TICK_COUNT = 6;
/** 3시간 간격으로 x축 라벨을 찍는다 */
const X_LABEL_INTERVAL = 3;

interface TerminalChartProps {
    rsltList: DsbdRsltDto[];
}

/**
 * Y축 최댓값을 눈금이 딱 떨어지는 값으로 올린다.
 * (실제 최댓값을 그대로 쓰면 라벨이 137, 274 … 처럼 읽기 어려운 수가 된다)
 */
function roundUpAxisMax(value: number): number {
    // 값이 없거나 아주 작을 때 0.2·0.4 같은 눈금이 뜨지 않도록 눈금 수만큼은 확보한다.
    if (value <= Y_TICK_COUNT) return Y_TICK_COUNT;

    const roughStep = value / Y_TICK_COUNT;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const niceStep =
        [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= roughStep) ?? 10;

    return niceStep * magnitude * Y_TICK_COUNT;
}

/**
 * 터미널 패널의 큰 차트 — 시간대별 대기인원 예측/실적.
 *
 * 색과 선 모양은 범례(예측=빨강 실선 / 실적=파랑 점선)에 맞춘다.
 */
export function TerminalChart({ rsltList }: TerminalChartProps) {
    const option = useMemo<EChartsOption>(() => {
        const axisMax = roundUpAxisMax(
            Math.max(1, ...rsltList.map((rslt) => Math.max(rslt.fcstWtngPsgCnt, rslt.wtngPsgCnt))),
        );

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
                // 안내할 값은 예측/실적 두 선뿐이다 (시리즈명으로 거른다).
                formatter: (params) => {
                    const tooltipItems = toTooltipItems(params);
                    const seriesItems = tooltipItems.filter(
                        (item) => item.seriesName === '예측' || item.seriesName === '실적',
                    );
                    if (seriesItems.length === 0) return '';

                    const lines = seriesItems
                        .map(
                            (item) =>
                                `${item.marker}${item.seriesName} <b>${formatCount(Number(item.value ?? 0))}</b>명`,
                        )
                        .join('<br/>');

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
                // 원본은 x축 라벨을 0선 바로 위에 겹쳐 그린다.
                axisLabel: {
                    ...AXIS_LABEL,
                    margin: -14,
                    interval: (index: number) =>
                        index % X_LABEL_INTERVAL === 0 || index === rsltList.length - 1,
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
                // 색 배열은 아래(0선)부터 돌아간다. 0선은 x축 라벨 자리라 긋지 않는다.
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
