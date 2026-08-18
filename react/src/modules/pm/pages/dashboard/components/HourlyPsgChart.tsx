import { useMemo } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import type { HourlyPsgDto } from '@/types/api.types';
import { formatCount } from '@/lib/format';
import { toTooltipItems, TOOLTIP_TEXT_STYLE } from '@/lib/chart';

/* 카드 안의 작은 차트라 여백을 픽셀로 고정한다 (원본 viewBox 256x50 환산). */
const GRID = { left: 0, right: 0, top: 6, bottom: 11 };
/** .hourly-row 가 정해 둔 차트 높이 — ECharts 는 컨테이너 높이가 확정돼야 그린다 */
const CHART_HEIGHT = 48;
/** 3시간 간격으로 축 라벨을 찍는다 */
const X_LABEL_INTERVAL = 3;
/** 예고 막대 — 실적선이 위에서 읽히도록 무채색으로 눌러 둔다 */
const BAR_COLOR = '#c5cbd6';
/** 실적선 포인트 — 24칸이 한 줄에 들어가므로 점이 서로 붙지 않을 만큼만 키운다 */
const POINT_SIZE = 4;

interface HourlyPsgChartProps {
    data: HourlyPsgDto | null;
    iconSrc: string;
    iconAlt: string;
    /** 실적선 색 (터미널별로 다르다) */
    lineColor: string;
}

/**
 * 시간대별 출발여객 — 막대(예고) + 꺾은선(실적).
 *
 * 축 라벨 행까지 같이 그린다. 차트와 라벨의 칸 수가 어긋나면 눈금이 막대와 안 맞는데,
 * 두 곳에서 따로 계산하면 그 어긋남이 잘 드러나지 않는다.
 */
export function HourlyPsgChart({ data, iconSrc, iconAlt, lineColor }: HourlyPsgChartProps) {
    const items = useMemo(() => data?.itemList ?? [], [data]);
    // 0 으로 나누지 않도록 최솟값을 둔다 (전 시간대 0 인 날은 빈 차트로 보인다).
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

                    const lines = tooltipItems
                        .map(
                            (item) =>
                                `${item.marker}${item.seriesName} <b>${formatCount(Number(item.value ?? 0))}</b>명`,
                        )
                        .join('<br/>');

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
                <EChart
                    className="hourly-row__chart"
                    style={{ height: CHART_HEIGHT }}
                    option={option}
                />
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
