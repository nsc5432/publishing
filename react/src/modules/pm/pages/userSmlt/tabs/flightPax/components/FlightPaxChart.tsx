import { useId } from 'react';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { FlightPaxChartData, FlightPaxChartItem } from '../types';

interface FlightPaxChartProps {
    data: FlightPaxChartData;
}

const GRID_COLOR = 'rgba(150, 155, 175, 0.22)';
const BASELINE_COLOR = 'rgba(150, 155, 175, 0.5)';
const AXIS_TICK = { fill: '#9aa0ac', fontSize: 10, fontFamily: 'Pretendard, sans-serif' };
const SCALE_TICK = { fill: '#6e747f', fontSize: 10, fontFamily: 'Pretendard, sans-serif' };
const Y_WIDTH = 34;
const X_HEIGHT = 18;

function formatAxisTick(value: number) {
    return value >= 1000 ? `${Math.round(value / 1000)}K` : String(Math.round(value));
}

/**
 * 막대 차트 — 시간대별 운항편 수 / 여객 수.
 */
export function FlightPaxChart({ data }: FlightPaxChartProps) {
    // 그라디언트 id 는 문서에서 유일해야 한다. 차트가 터미널 x 지표만큼 있다.
    const gradientId = `bar-${useId().replace(/:/g, '')}`;
    const paxMax = data.pax.max > 0 ? data.pax.max : 1;
    const flightMax = data.flights.max > 0 ? data.flights.max : 1;

    return (
        <div className="chart">
            <div className="chart__head">
                <h3 className="chart__title">운항편 / 승객 수</h3>
                <p className="chart__total">
                    전체(누적) 운항 <strong>{data.flights.total}</strong> 편{' / '}승객 <strong>{data.pax.total}</strong> 명
                </p>
            </div>

            <div className="chart__body">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.items} margin={{ top: 20, right: 10, bottom: 0, left: 10 }}>
                        <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeWidth={1} syncWithTicks />
                        <XAxis dataKey="label" height={X_HEIGHT} tickLine={false} axisLine={false} tick={SCALE_TICK} interval={0} />
                        <YAxis
                            yAxisId="pax"
                            width={Y_WIDTH}
                            domain={[0, paxMax]}
                            ticks={[0, paxMax / 3, (paxMax * 2) / 3, paxMax]}
                            label={{ value: '승객(명)', position: 'top', offset: 10, ...AXIS_TICK }}
                            tickFormatter={formatAxisTick}
                            tickLine={false}
                            axisLine={false}
                            tick={AXIS_TICK}
                        />
                        <YAxis
                            yAxisId="flights"
                            orientation="right"
                            width={Y_WIDTH}
                            domain={[0, flightMax]}
                            ticks={[0, flightMax / 3, (flightMax * 2) / 3, flightMax]}
                            label={{ value: '운항(편)', position: 'top', offset: 10, ...AXIS_TICK }}
                            tickFormatter={formatAxisTick}
                            tickLine={false}
                            axisLine={false}
                            tick={AXIS_TICK}
                        />
                        <ReferenceLine yAxisId="pax" y={0} stroke={BASELINE_COLOR} strokeWidth={1} />
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
                            formatter={(_value: number, name: string, item: { payload?: FlightPaxChartItem }) => [
                                name === data.flights.title ? item.payload?.flightText : item.payload?.paxText,
                                name,
                            ]}
                        />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a09eff" />
                                <stop offset="100%" stopColor="#4441cc" />
                            </linearGradient>
                        </defs>
                        <Bar
                            yAxisId="pax"
                            dataKey="pax"
                            name={data.pax.title}
                            legendType="rect"
                            fill={`url(#${gradientId})`}
                            barSize={9}
                            radius={[2, 2, 0, 0]}
                            isAnimationActive
                            animationDuration={300}
                            animationEasing="ease-out"
                        />
                        <Line
                            yAxisId="flights"
                            dataKey="flights"
                            name={data.flights.title}
                            legendType="plainline"
                            type="linear"
                            stroke="#d87827"
                            strokeWidth={2}
                            dot={{ r: 2, fill: '#d87827', strokeWidth: 0 }}
                            activeDot={{ r: 4 }}
                            animationDuration={300}
                            animationEasing="ease-out"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
