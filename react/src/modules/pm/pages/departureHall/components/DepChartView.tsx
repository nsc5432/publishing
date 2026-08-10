import { useMemo } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import type { DepTrend } from '../types';

interface DepChartViewProps {
    trend: DepTrend;
    /** 타임라인 현재 스텝 — 세로 표시선 자리 */
    step: number;
    /** 현재 시각 라벨 (예: 10:30) */
    time: string;
}

/** y 축 눈금 개수 (0 포함) */
const Y_TICKS = 5;
/** x 축 라벨 간격 — 30분 단위 스텝 기준 2시간마다 */
const X_LABEL_STEP = 4;
/** 좌측 눈금 자리(42px) + 눈금과 그래프 사이(10px) — departureHall.css 와 맞춘다 */
const GRID = { left: 52, right: 0, top: 0, bottom: 26 };
/** 현재 시각 표시선 색 */
const NOW_LINE = 'rgba(68, 65, 204, 0.45)';
const PRIMARY = '#4441cc';

const AXIS_LABEL = { color: '#8b93a3', fontSize: 12, fontFamily: 'Pretendard, sans-serif' };

/** 눈금이 딱 떨어지도록 최댓값을 올림한다 (예: 317 → 400) */
function toAxisMax(max: number) {
    if (max <= 0) return Y_TICKS;

    const unit = 10 ** Math.floor(Math.log10(max));

    return Math.ceil(max / unit) * unit;
}

/**
 * 차트 보기 — 출국장별 시간대별 대기인원 추이.
 * 맵·표 보기가 한 시각의 값이라면, 차트는 하루 흐름에서 그 시각이 어디쯤인지 보여준다.
 */
export function DepChartView({ trend, step, time }: DepChartViewProps) {
    const option = useMemo<EChartsOption>(() => {
        const axisMax = toAxisMax(Math.max(...trend.series.flatMap((s) => s.values), 0));

        return {
            animation: false,
            grid: { ...GRID, outerBoundsMode: 'none' },
            tooltip: {
                trigger: 'axis',
                confine: true,
                textStyle: { fontSize: 12, fontFamily: 'Pretendard, sans-serif' },
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
                /* 위·아래 끝 눈금 글자는 격자 밖으로 나가면 잘린다. 원본도 맨 위는
                   선 아래로, 맨 아래는 선 위로 붙여 그렸으므로 같은 만큼 밀어 준다. */
                axisLabel: {
                    ...AXIS_LABEL,
                    margin: 10,
                    formatter: (value: number, index: number) => {
                        if (index === Y_TICKS) return `{top|${value}}`;
                        if (index === 0) return `{bottom|${value}}`;

                        return String(value);
                    },
                    rich: {
                        // 위쪽 여백만큼 글자가 아래로 내려간다 (반대쪽도 같은 원리)
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
                // 점은 타임라인이 가리키는 시각에만 찍는다
                symbolSize: (_: unknown, params: { dataIndex: number }) =>
                    params.dataIndex === step ? 9 : 0,
                itemStyle: { color: '#fff', borderColor: series.color, borderWidth: 2 },
                lineStyle: { color: series.color, width: 2, cap: 'round', join: 'round' },
                emphasis: { disabled: true },
                z: 3,
                data: series.values,
                // 표시선과 시각 머리표는 첫 시리즈에만 한 번 얹는다
                ...(seriesIndex === 0
                    ? {
                          markLine: {
                              silent: true,
                              symbol: 'none',
                              animation: false,
                              label: { show: false },
                              lineStyle: { color: NOW_LINE, width: 1, type: 'solid' as const },
                              data: [{ xAxis: step }],
                          },
                          markPoint: {
                              silent: true,
                              animation: false,
                              symbol: 'roundRect',
                              symbolSize: [Math.max(44, time.length * 8), 20],
                              // 머리표는 격자 안쪽에 둔다 (위로 빼면 차트 제목과 겹친다)
                              symbolOffset: [0, 16],
                              itemStyle: { color: PRIMARY },
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
                        <li key={series.depNum}>
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
