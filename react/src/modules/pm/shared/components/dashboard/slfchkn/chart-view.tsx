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
import { useEffect, useState } from 'react';
import { formatTime, parseDateStr, times } from '@/lib/date-utils';
import { type ChknType } from './congestion-search';
import { calPrcsCnt, group } from '@/lib/utils';
import type { SmrySlfchknDto } from '@/types/api.types';
import { mergeTimeArr } from '../../../utils/chart-utils';
import { SlfchknService } from '@/api/pm/services/slfchkn.service';
import { NoData } from '../../no-data';

interface ChartViewProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    island: string;
    currentChkn: ChknType[];
    tmnlId: string;
}

type SlfchknChartType = {
    time: string;
    wtngPsgCnt?: number;
    prevWtngPsgCnt?: number;
}

const timeArr = times();

export function ChartView({ viewMode, onViewModeChange, island, currentChkn, tmnlId }: ChartViewProps) {
    const [kioskData, setKioskData] = useState<SlfchknChartType[]>([]);
    const [sbdData, setSbdData] = useState<SlfchknChartType[]>([]);

    const [prevKioskData, setPrevKioskData] = useState<SlfchknChartType[]>([]);
    const [prevSbdData, setPrevSbdData] = useState<SlfchknChartType[]>([]);

    const [mergeKiosk, setMergeKiosk] = useState<SlfchknChartType[]>([]);
    const [mergeSbd, setMergeSbd] = useState<SlfchknChartType[]>([]);

    useEffect(() => {
        const prevDay = new Date();
        prevDay.setDate(prevDay.getDate() - 1)
        loadPrevData(parseDateStr(prevDay), tmnlId);
    }, [tmnlId]);

    useEffect(() => {
        setKioskData(refineWtngPsgCnt(currentChkn, 'KIOSK'));
        setSbdData(refineWtngPsgCnt(currentChkn, 'SBD'));
    }, [currentChkn]);

    useEffect(() => {
        setMergeKiosk(mergeTimeArr(kioskData, prevKioskData, { wtngPsgCnt: 0 }, { prevWtngPsgCnt: 0 }));
        setMergeSbd(mergeTimeArr(sbdData, prevSbdData, { wtngPsgCnt: 0 }, { prevWtngPsgCnt: 0 }));
    }, [kioskData, sbdData, prevKioskData, prevSbdData]);

    const refineWtngPsgCnt = (arr: ChknType[], type: string): SlfchknChartType[] => {
        const filtered = arr.filter(x => x.type === type).map(x => ({
            time: formatTime(x.time),
            wtngPsgCnt: x.wtngPsgCnt,
            prcsHr: x.prcsHr,
            prcsCnt: calPrcsCnt(x.prcsHr),
            wtngHr: x.wtngHr,
        }));

        return group(filtered, x => x.time, (a, c) => ({ time: c.time, wtngPsgCnt: (a.wtngPsgCnt || 0) + c.wtngPsgCnt }));
    }

    const loadPrevData = async (prevDay: string, tmnlId: string) => {
        const _prevDatas = await SlfchknService.retrieveSlfchknGroupByTimeUsingDate(prevDay, tmnlId);

        const _prevChkn = timeArr.reduce((a: SmrySlfchknDto[], time: string) => {
            const data = _prevDatas[time];

            if (data?.length > 0) {
                a.push(...data.filter(x => x.island === island).map(x => ({ ...x, time })));
            }

            return a as ChknType[];
        }, []);

        setPrevKioskData(refineWtngPsgCnt(_prevChkn, 'KIOSK').map(x => ({ time: x.time, prevWtngPsgCnt: x.wtngPsgCnt })));
        setPrevSbdData(refineWtngPsgCnt(_prevChkn, 'SBD').map(x => ({ time: x.time, prevWtngPsgCnt: x.wtngPsgCnt })));
    }

    return (
        <div className="p-6 space-y-6 h-full flex flex-col">
            <Card className="p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">셀프체크인/백드롭 {island}</h2>
                    <ViewModeToggle
                        viewMode={viewMode}
                        onViewModeChange={onViewModeChange}
                        colorScheme="indigo"
                        inline
                    />
                </div>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 flex flex-col">
                {
                    [{ title: '셀프체크인', data: mergeKiosk }, { title: '셀프백드롭', data: mergeSbd }].map(x => (
                        <Card className="shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
                                <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent pt-2">
                                    {x.title} 대기인원 비교
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 flex-1 flex justify-center items-center">
                                {x.data?.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={475}>
                                        <ComposedChart
                                            data={x.data}
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
                                                interval={1}
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
                                                animationDuration={700}
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
                                                animationDuration={700}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : <NoData />
                                }

                            </CardContent>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
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

// Custom dot component
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

// Color palette
const colors = {
    primary: '#6366f1', // Indigo
    secondary: '#ec4899', // Pink
    tertiary: '#f59e0b', // Amber
    quaternary: '#3b82f6', // Blue
    line1: 'darkgray', // Red for 대기인원(전일)
    line2: '#3b82f6', // Blue for 대기인원(현재)
};

// Gradient definitions
const GradientDefs = () => (
    <defs>
        <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
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