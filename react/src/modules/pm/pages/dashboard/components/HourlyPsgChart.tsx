import { useMemo } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import type { HourlyPsgDto } from '@/types/api.types';
import { formatCount } from '../format';

/* 카드 안의 작은 차트라 여백을 픽셀로 고정한다 (원본 viewBox 256x50 환산). */
const GRID = { left: 0, right: 0, top: 6, bottom: 11 };
/** .hourly-row 가 정해 둔 차트 높이 — ECharts 는 컨테이너 높이가 확정돼야 그린다 */
const CHART_HEIGHT = 48;
/** 3시간 간격으로 축 라벨을 찍는다 */
const AXIS_STEP = 3;

/** axis 트리거 툴팁이 시리즈마다 넘겨 주는 값 (ECharts 타입에는 axisValue 가 빠져 있다) */
interface AxisTooltipItem {
    seriesName?: string;
    marker?: string;
    axisValue?: string;
    value?: number;
}

interface HourlyPsgChartProps {
    data: HourlyPsgDto | null;
    iconSrc: string;
    iconAlt: string;
    /** 예측선 색 (터미널별로 다르다) */
    lineColor: string;
}

/**
 * 시간대별 출발여객 — 막대(실적) + 꺾은선(예측).
 *
 * 축 라벨 행까지 같이 그린다. 차트와 라벨의 칸 수가 어긋나면 눈금이 막대와 안 맞는데,
 * 두 곳에서 따로 계산하면 그 어긋남이 잘 드러나지 않는다.
 */
export function HourlyPsgChart({ data, iconSrc, iconAlt, lineColor }: HourlyPsgChartProps) {
    const items = useMemo(() => data?.itemList ?? [], [data]);
    // 0 으로 나누지 않도록 최솟값을 둔다 (전 시간대 0 인 날은 빈 차트로 보인다).
    const max = Math.max(1, data?.maxPsgCnt ?? 1);

    const option = useMemo<EChartsOption>(
        () => ({
            animation: false,
            grid: { ...GRID, outerBoundsMode: 'none' },
            tooltip: {
                trigger: 'axis',
                confine: true,
                textStyle: { fontSize: 12, fontFamily: 'Pretendard, sans-serif' },
                formatter: (params) => {
                    const list = (Array.isArray(params) ? params : [params]) as AxisTooltipItem[];
                    if (list.length === 0) return '';

                    const rows = list
                        .map(
                            (p) =>
                                `${p.marker}${p.seriesName} <b>${formatCount(Number(p.value ?? 0))}</b>명`,
                        )
                        .join('<br/>');

                    return `${list[0].axisValue}시<br/>${rows}`;
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
                max,
                interval: max / 2,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { show: false },
                splitLine: { lineStyle: { color: '#e4e8f0', width: 0.9 } },
            },
            series: [
                {
                    name: '실적',
                    type: 'bar',
                    barWidth: '66%',
                    itemStyle: { color: '#3f8ee6' },
                    data: items.map((item) => item.psgCnt),
                },
                {
                    name: '예측',
                    type: 'line',
                    symbol: 'none',
                    lineStyle: { color: lineColor, width: 1.5, cap: 'round', join: 'round' },
                    data: items.map((item) => item.fcstPsgCnt),
                },
            ],
        }),
        [items, max, lineColor],
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
                    <span>{formatCount(max)}</span>
                    <span>{formatCount(Math.round(max / 2))}</span>
                    <span>0</span>
                </div>
            </div>
            <div className="axis-row">
                <span className="ic" />
                <div className="axis">
                    {items
                        .filter((_, i) => i % AXIS_STEP === 0)
                        .map((item) => (
                            <span key={item.time}>{Number(item.time)}</span>
                        ))}
                </div>
            </div>
        </>
    );
}
