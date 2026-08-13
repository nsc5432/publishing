import { useMemo } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import { AXIS_LABEL as SHARED_AXIS_LABEL, CHART_FONT_FAMILY, TOOLTIP_TEXT_STYLE } from '@/lib/chart';
import type { ChknResourceSeries } from '../types';

interface ResourceChartProps {
    resource: ChknResourceSeries;
    /** 타임라인 현재 스텝(30분 단위) — 세로 표시선 자리 */
    step: number;
    /** 현재 시각 라벨 (예: 10:30) */
    time: string;
}

/** 자원 막대 3종 — 쌓아 올린 순서가 곧 범례 순서다 */
const RESOURCE_SERIES = [
    { key: 'counter', name: '유인 체크인카운터', color: '#4441cc', unit: '개' },
    { key: 'kiosk', name: '셀프체크인', color: '#7472e0', unit: '대' },
    { key: 'bagdrop', name: '셀프백드롭', color: '#12b09a', unit: '대' },
] as const;

/** 대기인원 꺾은선 색 (--line-wait) */
const WAIT_COLOR = '#f2762e';
const WAIT_SERIES = '대기인원';
/** 좌축 눈금 개수 (0 포함) */
const Y_TICKS = 5;
/** 좌측 눈금 자리(38px) + 우측 대기인원 눈금 자리(44px) */
const GRID = { left: 38, right: 44, top: 16, bottom: 24 };
/** 현재 시각 표시선 색 */
const NOW_LINE_COLOR = 'rgba(68, 65, 204, 0.45)';
/** 타임라인 한 칸은 30분, 차트 한 칸은 1시간 */
const STEP_PER_HOUR = 2;
const LAST_HOUR = 23;

const AXIS_LABEL = { ...SHARED_AXIS_LABEL, color: '#8b93a3', fontSize: 12 };

/** 눈금이 딱 떨어지도록 최댓값을 올림한다 (예: 317 → 400) */
function toAxisMax(rawMax: number): number {
    if (rawMax <= 0) return Y_TICKS;

    const magnitude = 10 ** Math.floor(Math.log10(rawMax));

    return Math.ceil(rawMax / magnitude) * magnitude;
}

/**
 * 자원 활용 차트 — 시간대별 자원 운영(막대)과 대기인원(꺾은선).
 *
 * 이 화면이 답하려는 질문이 "이만큼 열어서 이만큼 기다린다" 하나라서, 두 값을 다른 차트로
 * 나누지 않고 축만 갈라 한 판에 겹쳐 그린다. 표시선은 타임라인이 가리키는 시각이며
 * 표 보기의 아일랜드별 값이 그 시각의 내역이다.
 */
export function ResourceChart({ resource, step, time }: ResourceChartProps) {
    const option = useMemo<EChartsOption>(() => {
        const rsrcMax = toAxisMax(
            Math.max(
                ...resource.counter.map(
                    (counter, hour) =>
                        counter + resource.kiosk[hour] + resource.bagdrop[hour],
                ),
                0,
            ),
        );
        const waitMax = toAxisMax(Math.max(resource.waitMax, ...resource.wait, 0));
        // 차트 한 칸은 1시간이라 30분 눈금 둘이 같은 칸을 가리킨다
        const nowHour = Math.min(LAST_HOUR, Math.floor(step / STEP_PER_HOUR));

        return {
            animation: false,
            grid: { ...GRID, outerBoundsMode: 'none' },
            tooltip: {
                trigger: 'axis',
                confine: true,
                textStyle: TOOLTIP_TEXT_STYLE,
                axisPointer: { type: 'shadow' },
                formatter: (params) => {
                    // axis 트리거는 시리즈 수만큼 넘어온다 — 어느 칸인지만 알면 나머지는 원본에서 읽는다
                    const items = (Array.isArray(params) ? params : [params]) as Array<{
                        dataIndex?: number;
                    }>;
                    const index = items[0]?.dataIndex;

                    if (typeof index !== 'number') return '';

                    const rows = [
                        ...RESOURCE_SERIES.map(
                            (series) =>
                                `${series.name} ${resource[series.key][index] ?? 0}${series.unit}`,
                        ),
                        `${WAIT_SERIES} ${resource.wait[index] ?? 0}명`,
                        `자원 활용률 ${resource.utilRate[index] ?? 0}%`,
                    ];

                    return [`${resource.hourLabels[index]}:00`, ...rows].join('<br/>');
                },
            },
            xAxis: {
                type: 'category',
                data: resource.hourLabels,
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { ...AXIS_LABEL, margin: 8 },
            },
            yAxis: [
                {
                    type: 'value',
                    min: 0,
                    max: rsrcMax,
                    interval: rsrcMax / Y_TICKS,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { ...AXIS_LABEL, margin: 8 },
                    splitLine: { lineStyle: { color: '#eceff5', width: 1 } },
                },
                {
                    type: 'value',
                    min: 0,
                    max: waitMax,
                    interval: waitMax / Y_TICKS,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { ...AXIS_LABEL, color: WAIT_COLOR, fontWeight: 600, margin: 8 },
                    splitLine: { show: false },
                },
            ],
            series: [
                ...RESOURCE_SERIES.map((series, seriesIndex) => ({
                    name: series.name,
                    type: 'bar' as const,
                    stack: 'resource',
                    barMaxWidth: 18,
                    itemStyle: {
                        color: series.color,
                        // 맨 위 막대만 모서리를 굴린다 (쌓인 기둥이 하나로 보이도록)
                        borderRadius:
                            seriesIndex === RESOURCE_SERIES.length - 1
                                ? ([4, 4, 0, 0] as [number, number, number, number])
                                : 0,
                    },
                    emphasis: { disabled: true },
                    data: resource[series.key],
                })),
                {
                    name: WAIT_SERIES,
                    type: 'line' as const,
                    yAxisIndex: 1,
                    z: 5,
                    symbol: 'circle',
                    // 점은 타임라인이 가리키는 시각에만 찍는다
                    symbolSize: (_: unknown, params: { dataIndex: number }) =>
                        params.dataIndex === nowHour ? 9 : 0,
                    itemStyle: { color: '#fff', borderColor: WAIT_COLOR, borderWidth: 2 },
                    lineStyle: { color: WAIT_COLOR, width: 2, cap: 'round', join: 'round' },
                    emphasis: { disabled: true },
                    data: resource.wait,
                    markLine: {
                        silent: true,
                        symbol: 'none',
                        animation: false,
                        label: { show: false },
                        lineStyle: { color: NOW_LINE_COLOR, width: 1, type: 'solid' as const },
                        data: [{ xAxis: nowHour }],
                    },
                    markPoint: {
                        silent: true,
                        animation: false,
                        symbol: 'roundRect',
                        symbolSize: [46, 20],
                        symbolOffset: [0, -14],
                        itemStyle: { color: WAIT_COLOR },
                        label: {
                            formatter: time,
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily: CHART_FONT_FAMILY,
                        },
                        data:
                            resource.wait.length === 0
                                ? []
                                : [{ name: 'now', coord: [nowHour, resource.wait[nowHour] ?? 0] }],
                    },
                },
            ],
        };
    }, [resource, step, time]);

    return (
        <div className="chkn-chart">
            <div className="chkn-chart__head">
                <p className="chkn-chart__title">
                    시간대별 자원 운영 현황과 대기인원 <em>(단위: 개·대 / 명)</em>
                </p>
                <ul className="chkn-chart__legend">
                    {RESOURCE_SERIES.map((series) => (
                        <li key={series.key}>
                            <i style={{ background: series.color }} aria-hidden="true" />
                            {series.name}
                        </li>
                    ))}
                    <li>
                        <i className="is-line" aria-hidden="true" />
                        {WAIT_SERIES}
                    </li>
                </ul>
            </div>

            <EChart className="chkn-chart__plot" option={option} />
        </div>
    );
}
