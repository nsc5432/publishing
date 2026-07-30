import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { ViewModeToggle, type ViewMode } from '../view-mode-toggle';
import { terminal } from '../../../utils/convert';
import { type DepType } from './congestion-search';
import { useEffect, useState } from 'react';
import { formatTime, parseDateStr, times } from '@/lib/date-utils';
import type { SmryDepDto } from '@/types/api.types';
import { mergeTimeArr } from '../../../utils/chart-utils';
import { DepService } from '@/api/pm/services/dep.service';

interface ChartViewProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    tmnlId: string;
    selectedDepNum: string;
    selectedDep: DepType[];
}

type DepChartType = {
    time: string;
    wtngPsgCnt?: number;
    prevWtngPsgCnt?: number;
}

const timeArr = times();

export function ChartView({ viewMode, onViewModeChange, tmnlId, selectedDepNum, selectedDep }: ChartViewProps) {
    const [depChart, setDepChart] = useState<DepChartType[]>([]);
    const [prevDepChart, setPrevDepChart] = useState<DepChartType[]>([]);
    const [mergeDepChart, setMergeDepChart] = useState<DepChartType[]>([]);

    useEffect(() => {
        const prevDay = new Date();
        prevDay.setDate(prevDay.getDate() - 1)
        loadPrevData(parseDateStr(prevDay), tmnlId);
    }, [tmnlId])

    useEffect(() => {
        setDepChart(selectedDep.map(x => ({ time: formatTime(x.time), wtngPsgCnt: x.wtngPsgCnt })));
    }, [selectedDep]);

    useEffect(() => {
        if (depChart.length === 0) {
            console.error('depChart 값이 비었습니다.');
            return;
        } else if (prevDepChart.length === 0) {
            console.error('prevDepChart 값이 비었습니다.');
            return;
        }

        setMergeDepChart(mergeTimeArr(depChart, prevDepChart, { wtngPsgCnt: 0 }, { prevWtngPsgCnt: 0 }));
    }, [depChart, prevDepChart]);

    const loadPrevData = async (prevDay: string, tmnlId: string) => {
        const _prevDatas = await DepService.retrieveDepGroupByTimeUsingDate(prevDay, tmnlId);

        const _prevDep = timeArr.reduce((a: SmryDepDto[], time: string) => {
            const data = _prevDatas[time];

            if (data?.length > 0) {
                a.push(...data.filter(x => x.depNum === selectedDepNum).map(x => ({ ...x, time })));
            }

            return a as DepType[];
        }, []);

        setPrevDepChart(_prevDep.map(x => ({ time: formatTime(x.time), prevWtngPsgCnt: x.wtngPsgCnt })));
    }

    return (
        <div className="p-6 space-y-6">
            <Card className="p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{terminal(tmnlId)} {selectedDepNum}번 출국장</h2>
                    <ViewModeToggle
                        viewMode={viewMode}
                        onViewModeChange={onViewModeChange}
                        colorScheme="green"
                        inline
                    />
                </div>
            </Card>
            {/* Alert Section */}
            <div className="bg-orange-100 border-l-4 border-orange-500 p-4 rounded">
                <div className="flex items-center">
                    <span className="text-orange-800 font-semibold">⚠ 혼잡</span>
                    <span className="ml-4 text-orange-700"></span>
                </div>
            </div>

            {/* Chart */}
            <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                        대기인원 수
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {
                        mergeDepChart.length > 0 &&
                        <ResponsiveContainer width="100%" height={405}>
                            <ComposedChart
                                data={mergeDepChart}
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                                <GradientDefs />
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                    vertical={false}
                                    opacity={0.5}
                                />
                                <XAxis
                                    dataKey="time"
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    axisLine={{ stroke: '#d1d5db' }}
                                    tickLine={{ stroke: '#d1d5db' }}
                                    label={{
                                        value: '시간',
                                        position: 'insideBottomRight',
                                        offset: -10,
                                        style: { fill: '#6b7280', fontWeight: 600 },
                                    }}
                                    interval={3}
                                />
                                <YAxis
                                    label={{
                                        value: '대기인원 수',
                                        angle: -90,
                                        position: 'insideLeft',
                                        style: { fill: '#6b7280', fontWeight: 600 },
                                    }}
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    axisLine={{ stroke: '#d1d5db' }}
                                    tickLine={{ stroke: '#d1d5db' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{ paddingTop: '30px' }}
                                    iconType="line"
                                    formatter={(value) => (
                                        <span className="text-sm font-medium text-gray-700">
                                            {value}
                                        </span>
                                    )}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="prevWtngPsgCnt"
                                    stroke={colors.line1}
                                    strokeWidth={3}
                                    name="대기인원(전일)"
                                    dot={<CustomDot fill={colors.line1} />}
                                    activeDot={{
                                        r: 7,
                                        fill: colors.line1,
                                        stroke: '#fff',
                                        strokeWidth: 2,
                                    }}
                                    animationDuration={1200}
                                    strokeDasharray="5 5"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="wtngPsgCnt"
                                    stroke={colors.line2}
                                    strokeWidth={3}
                                    name="대기인원(현재)"
                                    dot={<CustomDot fill={colors.line2} />}
                                    activeDot={{
                                        r: 7,
                                        fill: colors.line2,
                                        stroke: '#fff',
                                        strokeWidth: 2,
                                    }}
                                    animationDuration={1200}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    }
                </CardContent>
            </Card>
        </div>
    );
}

const colors = {
    primary: '#6366f1', // Indigo
    secondary: '#ec4899', // Pink
    tertiary: '#f59e0b', // Amber
    quaternary: '#3b82f6', // Blue
    line1: 'darkgray', // Red for 대기인원(내일)
    line2: '#3b82f6', // Blue for 대기인원(현재)
};

// Gradient definitions
const GradientDefs = () => (
    <defs>
        <linearGradient id="colorBarDep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.quaternary} stopOpacity={0.9} />
            <stop offset="100%" stopColor={colors.primary} stopOpacity={0.7} />
        </linearGradient>
    </defs>
);

// Custom tooltip
interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        name?: string;
        value?: number | string;
        color?: string;
    }>;
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                <p className="font-bold text-gray-800 mb-2">{label}</p>
                {payload.map((entry, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        <span className="font-medium">{entry.name}:</span> {entry.value}명
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

interface CustomDotProps {
    cx?: number;
    cy?: number;
    fill?: string;
}

const CustomDot = (props: CustomDotProps) => {
    const { cx, cy, fill } = props;
    return (
        <circle
            cx={cx}
            cy={cy}
            r={4}
            fill={fill}
            stroke="#fff"
            strokeWidth={2}
            className="drop-shadow-md"
        />
    );
};