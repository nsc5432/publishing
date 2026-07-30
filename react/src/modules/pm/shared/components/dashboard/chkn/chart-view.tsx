import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { ViewModeToggle, type ViewMode } from '../view-mode-toggle';
import type { CustomTooltipProps } from '@/types/project.types';
import { colors, CustomDot } from '../../../utils/chart.tsx';
import { useEffect, useState } from 'react';
import { formatTime, parseDateStr } from '@/lib/date-utils.ts';
import { groupByHourInterval, mergeTimeArr } from '../../../utils/chart-utils.ts';
import type { SmryChknAlnDtoWrapper } from '@/types/api.types.ts';
import { counterService } from '@/api/pm/services/counter.service.ts';


// 그라데이션 정의를 위한 컴포넌트
const GradientDefs = () => (
    <defs>
        <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.primary} stopOpacity={0.9} />
            <stop offset="100%" stopColor={colors.gradient1} stopOpacity={0.7} />
        </linearGradient>
        <linearGradient id="colorArea1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.secondary} stopOpacity={0.3} />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity={0.05} />
        </linearGradient>
        <linearGradient id="colorArea2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.tertiary} stopOpacity={0.3} />
            <stop offset="100%" stopColor={colors.tertiary} stopOpacity={0.05} />
        </linearGradient>
    </defs>
);

const CustomTooltip = ({ active, payload, label, unit }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                <p className="font-bold text-gray-800 mb-2">{label}</p>
                {payload.map((entry, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        <span className="font-medium">{entry.name}:</span> {entry.value}{unit}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

interface ChartViewProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    island: string;
    chknDatas: SmryChknAlnDtoWrapper;
    tmnlId: string;
}

type WtngPsgCntChartType = {
    time: string;
    wtngPsgCnt: number;
} & PrevChartType;

type PrevChartType = {
    time: string;
    prevWtngPsgCnt?: number;
    prevXovisWtngPsgCnt?: number;
}

type PrcsHrChartType = {
    time: string;
    prcsHr?: number;
}

type WtngHrChartType = {
    time: string;
    wtngHr?: number;
    prevWtngHr?: number;
}

type MergeChknType = {
    time: string;
    wtngPsgCnt: number;
    prcsHr: number;
    wtngHr: number;
}

export function ChartView({ viewMode, onViewModeChange, island, chknDatas, tmnlId }: ChartViewProps) {
    const [wtngPsgCntChart, setWtngPsgCntChart] = useState<WtngPsgCntChartType[]>([]); // 대기인원 데이터
    const [prcsHrChart, setPrcsHrChart] = useState<PrcsHrChartType[]>([]); // 처리시간 데이터
    const [wtngHrChart, setWtngHrChart] = useState<WtngHrChartType[]>([]); // 대기시간 데이터

    useEffect(() => {
        renderChart(chknDatas);
    }, [chknDatas]);

    const renderChart = async (chknDatas: SmryChknAlnDtoWrapper) => {
        // 현재 대기인원
        const _mergeChkns: MergeChknType[] = [];
        Object.keys(chknDatas).forEach(time => {
            const mergeChkn = chknDatas[time].reduce((a, c) => {
                a.wtngPsgCnt += c.wtngPsgCnt;
                a.prcsHr = Math.max(a.prcsHr, c.prcsHr);
                a.wtngHr = Math.max(a.wtngHr, c.wtngHr);
                return a;
            }, { time, wtngPsgCnt: 0, prcsHr: 0, wtngHr: 0 })

            _mergeChkns.push(mergeChkn);
        });

        const _groupWtngPsgCnt = groupByHourInterval(
            _mergeChkns, 1, // 1시간 단위
            (item) => item.wtngPsgCnt ?? 0,
            (time: string, maxItem: WtngPsgCntChartType | null) => ({ time: formatTime(time), wtngPsgCnt: maxItem?.wtngPsgCnt })
        );

        // 전주 동요일 대기인원
        const lastWeekDate = new Date();
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        const lastWeekYmd = parseDateStr(lastWeekDate);

        let prevChartData: SmryChknAlnDtoWrapper;
        try {
            prevChartData = await counterService.retrieveChknGroupByTimeUsingDate(lastWeekYmd, tmnlId, island);
        } catch {
            prevChartData = {};
        }

        const _mergePrevChkns: MergeChknType[] = [];
        Object.keys(prevChartData).forEach(time => {
            const mergeChkn = prevChartData[time].reduce((a, c) => {
                a.wtngPsgCnt += c.wtngPsgCnt;
                a.prcsHr = Math.max(a.prcsHr, c.prcsHr);
                a.wtngHr = Math.max(a.wtngHr, c.wtngHr);
                return a;
            }, { time, wtngPsgCnt: 0, prcsHr: 0, wtngHr: 0 })

            _mergePrevChkns.push(mergeChkn);
        });

        const _groupPrevWtngPsgCnt = groupByHourInterval(
            _mergePrevChkns, 1, // 1시간 단위
            (item) => item.wtngPsgCnt ?? 0,
            (time: string, maxItem: WtngPsgCntChartType | null) => ({ time: formatTime(time), wtngPsgCnt: maxItem?.wtngPsgCnt })
        ).map(x => ({ time: x.time, prevWtngPsgCnt: x.wtngPsgCnt }));

        const merge1 = mergeTimeArr(_groupWtngPsgCnt, _groupPrevWtngPsgCnt, { wtngPsgCnt: 0 }, { prevWtngPsgCnt: 0 });
        // 전주 동요일 Xovis
        let xovisChartData: PrevChartType[];
        try {
            const prevXoivsData = await counterService.retrieveChknXovisGroupByTime(lastWeekYmd, tmnlId, island);
            xovisChartData = prevXoivsData.map(x => ({ time: formatTime(x.time), prevXovisWtngPsgCnt: x.wtngPsgCnt }));
        } catch {
            xovisChartData = [];
        }

        const merge2 = mergeTimeArr(merge1, xovisChartData, { wtngPsgCnt: 0, prevWtngPsgCnt: 0 }, { prevXovisWtngPsgCnt: 0 });
        setWtngPsgCntChart(merge2 as WtngPsgCntChartType[]);

        // 처리시간 차트
        const _groupPrcsHr = groupByHourInterval(
            _mergeChkns, 1, // 1시간 단위
            (item) => item.prcsHr ?? 0,
            (time: string, maxItem: PrcsHrChartType | null) => ({ time: formatTime(time), prcsHr: maxItem?.prcsHr })
        );

        setPrcsHrChart(_groupPrcsHr);

        // 대기시간 차트
        const _groupWtngHr = groupByHourInterval(
            _mergeChkns,
            1, // 1시간 단위
            (item) => item.wtngHr ?? 0,
            (time: string, maxItem: WtngHrChartType | null) => ({ time: formatTime(time), wtngHr: maxItem?.wtngHr })
        );

        const _groupPrevWtngHr = groupByHourInterval(
            _mergePrevChkns, 1, // 1시간 단위
            (item) => item.wtngHr ?? 0,
            (time: string, maxItem: WtngHrChartType | null) => ({ time: formatTime(time), wtngHr: maxItem?.wtngHr })
        ).map(x => ({ time: x.time, prevWtngHr: x.wtngHr }));

        const mergeWtngHr = mergeTimeArr(_groupWtngHr, _groupPrevWtngHr, { wtngHr: 0 }, { prevWtngHr: 0 });
        setWtngHrChart(mergeWtngHr);
    }

    return (
        <div className="p-6 space-y-6">
            <Card className="p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">체크인카운터 {island}</h2>
                    <ViewModeToggle
                        viewMode={viewMode}
                        onViewModeChange={onViewModeChange}
                        colorScheme="orange"
                        inline
                    />
                </div>
            </Card>

            {/* 대기인원 차트 */}
            <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent pt-2">
                        대기인원 비교
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={425}>
                        <ComposedChart
                            data={wtngPsgCntChart}
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
                            />
                            <YAxis
                                label={{
                                    value: '인원수',
                                    angle: -90,
                                    position: 'insideLeft',
                                    style: { fill: '#6b7280', fontWeight: 600 },
                                }}
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                axisLine={{ stroke: '#d1d5db' }}
                                tickLine={{ stroke: '#d1d5db' }}
                            />
                            <Tooltip content={<CustomTooltip unit={'명'} />} />
                            <Legend
                                wrapperStyle={{ paddingTop: '30px' }}
                                iconType="circle"
                                formatter={(value) => (
                                    <span className="text-sm font-medium text-gray-700">
                                        {value}
                                    </span>
                                )}
                            />

                            {/* Line 차트 */}
                            <Line
                                type="monotone"
                                dataKey="wtngPsgCnt"
                                stroke={colors.secondary}
                                strokeWidth={3}
                                name="대기인원(현재)"
                                dot={<CustomDot fill={colors.secondary} />}
                                activeDot={{
                                    r: 8,
                                    fill: colors.secondary,
                                    stroke: '#fff',
                                    strokeWidth: 3,
                                }}
                                animationDuration={700}
                            />
                            <Line
                                type="monotone"
                                dataKey="prevWtngPsgCnt"
                                stroke={colors.tertiary}
                                strokeWidth={3}
                                name="대기인원(전주 동요일)"
                                dot={<CustomDot fill={colors.tertiary} />}
                                activeDot={{
                                    r: 8,
                                    fill: colors.tertiary,
                                    stroke: '#fff',
                                    strokeWidth: 3,
                                }}
                                animationDuration={700}
                            />
                            <Line
                                type="monotone"
                                dataKey="prevXovisWtngPsgCnt"
                                stroke={colors.quaternary}
                                strokeWidth={2.5}
                                name="Xovis 대기인원(전주 동요일)"
                                dot={{
                                    r: 4,
                                    fill: colors.quaternary,
                                    stroke: '#fff',
                                    strokeWidth: 2,
                                }}
                                strokeDasharray="8 4"
                                activeDot={{
                                    r: 7,
                                    fill: colors.quaternary,
                                    stroke: '#fff',
                                    strokeWidth: 2,
                                }}
                                animationDuration={700}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 처리시간 차트 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-cyan-50 border-b">
                        <CardTitle className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent pt-2">
                            처리시간 비교
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={245}>
                            <ComposedChart data={prcsHrChart}>
                                <defs>
                                    <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                                        <stop
                                            offset="0%"
                                            stopColor={colors.primary}
                                            stopOpacity={0.4}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor={colors.gradient2}
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                    opacity={0.5}
                                />
                                <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={1} />
                                <YAxis
                                    label={{
                                        value: '처리시간(초)',
                                        angle: -90,
                                        position: 'insideLeft',
                                        style: { fill: '#6b7280', fontWeight: 600 },
                                    }}
                                    tick={{ fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip unit={'초'} />} />
                                <Area
                                    type="monotone"
                                    dataKey="prcsHr"
                                    fill="url(#colorProcessed)"
                                    stroke={colors.primary}
                                    strokeWidth={3}
                                    name="처리시간(초)"
                                    dot={{
                                        r: 4,
                                        fill: colors.primary,
                                        stroke: '#fff',
                                        strokeWidth: 2,
                                    }}
                                    animationDuration={700}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 대기시간 */}
                <Card className="shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b">
                        <CardTitle className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent pt-2">
                            대기시간 비교
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={245}>
                            <ComposedChart data={wtngHrChart}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                    opacity={0.5}
                                />
                                <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={1} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip unit={'초'} />} />
                                <Legend iconType="circle" />
                                <Line
                                    type="monotone"
                                    dataKey="wtngHr"
                                    stroke={colors.secondary}
                                    strokeWidth={3}
                                    name="현재"
                                    dot={{ r: 4, fill: colors.secondary }}
                                    animationDuration={700}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="prevWtngHr"
                                    stroke={colors.tertiary}
                                    strokeWidth={3}
                                    name="전주"
                                    dot={{ r: 4, fill: colors.tertiary }}
                                    animationDuration={700}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
