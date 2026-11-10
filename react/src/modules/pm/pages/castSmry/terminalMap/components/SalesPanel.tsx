import { useMemo } from 'react';
import { EChart } from '@/components/charts/EChart';
import type { EChartsOption } from '@/lib/echarts';
import { AXIS_LABEL, TOOLTIP_TEXT_STYLE, toTooltipItems } from '@/lib/chart';
import type { IslandSales } from '../types';

interface SalesPanelProps {
    sales: IslandSales;
}

const CHART_HEIGHT = 96;
const GRID = { left: 0, right: 0, top: 8, bottom: 18 };
const BAR_COLOR = '#c9c6ef';
const ACTIVE_BAR_COLOR = '#4a44c9';
const SPLIT_LINE_COLOR = '#eceef4';
const X_LABEL_HOURS = [0, 6, 12, 18, 23];

export function SalesPanel({ sales }: SalesPanelProps) {
    const { bars, activeHour } = sales;

    const option = useMemo<EChartsOption>(
        () => ({
            animation: false,
            grid: { ...GRID, outerBoundsMode: 'none' },
            tooltip: {
                trigger: 'axis',
                confine: true,
                axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(74, 68, 201, 0.06)' } },
                textStyle: TOOLTIP_TEXT_STYLE,
                formatter: (params) => {
                    const bar = bars[Number(toTooltipItems(params)[0]?.axisValue)];

                    return bar ? `${bar.hour}시<br/><b>${bar.amtLabel}</b>` : '';
                },
            },
            xAxis: {
                type: 'category',
                data: bars.map((bar) => String(bar.hour)),
                axisLine: { lineStyle: { color: '#d6dbe6' } },
                axisTick: { show: false },
                axisLabel: {
                    ...AXIS_LABEL,
                    margin: 6,
                    interval: (index: number) => X_LABEL_HOURS.includes(index),
                },
            },
            yAxis: {
                type: 'value',
                min: 0,
                splitNumber: 2,
                axisLabel: { show: false },
                splitLine: { lineStyle: { color: SPLIT_LINE_COLOR } },
            },
            series: [
                {
                    name: '매출',
                    type: 'bar',
                    barWidth: '62%',
                    data: bars.map((bar) => ({
                        value: bar.amt,
                        itemStyle: {
                            color: bar.hour === activeHour ? ACTIVE_BAR_COLOR : BAR_COLOR,
                            borderRadius: [3, 3, 0, 0],
                        },
                    })),
                },
            ],
        }),
        [bars, activeHour],
    );

    return (
        <section className="sales">
            <div className="sec-head sec-head--sales">
                <h3 className="sec-head__title">상업시설 매출</h3>
                <span className="sales__base">{sales.baseLabel} · 실적</span>
            </div>

            <ul className="sales__kpi">
                {sales.kpis.map((kpi) => (
                    <li className="sales__kpi-item" key={kpi.label} title={kpi.hint}>
                        <span className="sales__kpi-label">{kpi.label}</span>
                        <strong className="sales__kpi-value">
                            {kpi.value}
                            {kpi.unit && <em>{kpi.unit}</em>}
                        </strong>
                    </li>
                ))}
            </ul>

            {sales.topStores.length > 0 && (
                <ol className="sales__rank" aria-label={`${sales.baseLabel} 매장 매출 순위`}>
                    {sales.topStores.map((store) => (
                        <li className="sales__rank-item" key={store.rank}>
                            <span className={`sales__rank-no sales__rank-no--${store.rank}`}>
                                {store.rank}
                            </span>
                            <span className="sales__rank-name" title={store.name}>
                                {store.name}
                            </span>
                            <span className="sales__rank-bar" aria-hidden="true">
                                <i style={{ width: `${store.share * 100}%` }} />
                            </span>
                            <strong className="sales__rank-amt">{store.amtLabel}</strong>
                            <span className="sales__rank-share">{store.shareLabel}</span>
                        </li>
                    ))}
                </ol>
            )}

            <div className="sales__chart" role="img" aria-label="시간대별 매출">
                <EChart style={{ height: CHART_HEIGHT }} option={option} />
            </div>

            <p className="sales__foot">
                <span>
                    영업 매장 <strong>{sales.openStore}</strong>
                </span>
                <span>
                    매출 피크 <strong>{sales.peakHour}</strong>
                </span>
            </p>
        </section>
    );
}
