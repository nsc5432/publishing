import { useId } from 'react';
import {
    Bar,
    CartesianGrid,
    BarChart as RcBarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { ChartBar, ChartData } from '../types';

interface BarChartProps {
    data: ChartData;
}

/** 눈금 색 — 원본 CSS(rgba(150,155,175,.22)) 를 그대로 옮겼다 */
const GRID_COLOR = 'rgba(150, 155, 175, 0.22)';
const AXIS_TICK = { fill: '#9aa0ac', fontSize: 10, fontFamily: 'Pretendard, sans-serif' };
const SCALE_TICK = { fill: '#6e747f', fontSize: 10, fontFamily: 'Pretendard, sans-serif' };
/** Y축 자리 — 원본 .chart__axis(26px) + 간격(8px) */
const Y_WIDTH = 34;
/** 하단 스케일 라벨 높이 — 원본 .chart__scale */
const X_HEIGHT = 18;

/** 축 칸이 좁아 1,000 이상은 K 로 줄인다 (90,000 → 90K). */
function formatAxisTick(value: number) {
    return value >= 1000 ? `${Math.round(value / 1000)}K` : String(Math.round(value));
}

/**
 * 막대 차트 — 시간대별 운항편 수 / 여객 수.
 * 눈금은 최댓값을 3등분한 4개(0 · 1/3 · 2/3 · 최대)로 원본 퍼블리싱과 맞춘다.
 */
export function BarChart({ data }: BarChartProps) {
    // 그라디언트 id 는 문서에서 유일해야 한다. 차트가 터미널 x 지표만큼 있다.
    const gradientId = `bar-${useId().replace(/:/g, '')}`;
    const max = data.max > 0 ? data.max : 1;
    const ticks = [0, max / 3, (max * 2) / 3, max];

    return (
        <div className="chart">
            <div className="chart__head">
                <h3 className="chart__title">{data.title}</h3>
                <p className="chart__total">
                    전체(누적) <strong>{data.total}</strong> {data.unit}
                </p>
            </div>

            <div className="chart__body">
                <ResponsiveContainer width="100%" height="100%">
                    <RcBarChart data={data.bars} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
                        <CartesianGrid
                            vertical={false}
                            stroke={GRID_COLOR}
                            strokeWidth={1}
                            syncWithTicks
                        />
                        <XAxis
                            dataKey="label"
                            height={X_HEIGHT}
                            tickLine={false}
                            axisLine={false}
                            tick={SCALE_TICK}
                            interval={0}
                        />
                        <YAxis
                            width={Y_WIDTH}
                            domain={[0, max]}
                            ticks={ticks}
                            tickFormatter={formatAxisTick}
                            tickLine={false}
                            axisLine={false}
                            tick={AXIS_TICK}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(68, 65, 204, 0.06)' }}
                            contentStyle={{
                                borderRadius: 8,
                                border: 'none',
                                boxShadow: '0 6px 16px rgba(30, 40, 70, 0.22)',
                                fontSize: 12,
                                padding: '6px 10px',
                            }}
                            labelFormatter={(label) => `${label}시`}
                            formatter={(value: number, _name: string, item: { payload?: ChartBar }) => [
                                `${(item.payload?.actual ?? value).toLocaleString('ko-KR')}${data.unit}`,
                                data.title,
                            ]}
                        />
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a09eff" />
                                <stop offset="100%" stopColor="#4441cc" />
                            </linearGradient>
                        </defs>
                        <Bar
                            dataKey="value"
                            fill={`url(#${gradientId})`}
                            barSize={9}
                            radius={[2, 2, 0, 0]}
                            isAnimationActive
                            animationDuration={300}
                            animationEasing="ease-out"
                        />
                    </RcBarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
