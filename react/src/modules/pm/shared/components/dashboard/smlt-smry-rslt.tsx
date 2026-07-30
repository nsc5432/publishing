import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { SimulationType } from './airport-dashboard';
import {
    Logo,
    AirplaneIcon,
    PeopleIcon,
    TerminalPassengerIcon,
    TerminalPassengerOnIcon,
    CounterConIcon,
    CounterConOnOrangeIcon,
    PoliceIcon,
    PoliceOnPurpleIcon,
    DepartureIcon,
    DepartureOnGreenIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    SearchIcon,
    Terminal1Icon,
    Terminal2Icon,
} from '@/components/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import type { CongestionStatus, CongestionType, SmltSmry, SmryChknDto, SmryDepDto, SummaryFlight } from '@/types/api.types';
import { summaryService } from '@/api/pm/services/summary.service';
import { formatDateWithDay, formatTimeFromDate, parseDate } from '@/lib/date-utils';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CustomTooltipProps } from '@/types/project.types';
import { colors, CustomDot } from '../../utils/chart.tsx';
import { cgnStatus } from '../../utils/convert.ts';

interface SummaryChartData {
    time: string;
    castWtngPsgCnt: number;
    xovisWtngPsgCnt: number;
}

interface ChartData {
    time: string;
    wtngPsgCnt: number;
    wtngHr: number;
}

interface SmltSmryRsltProps {
    simulationType: SimulationType;
    simulationKey: string;
    onChangeDateCallback?: (date: Date) => void;
}

// 탭 목록
const tabs = [
    '터미널에 여객수가 가장 많을때',
    '체크인카운터가 가장 혼잡할 때',
    '출국장이 가장 혼잡할 때',
    '보안검색대가 가장 혼잡할 때',
];

const t1Islands = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N'];
const t2Islands = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M'];
const t1Deps = ['1', '2', '3', '4', '5', '6'];
const t2Deps = ['1', '2'];

const SmltSmryRslt = ({ simulationType = 'daily', simulationKey, onChangeDateCallback }: SmltSmryRsltProps) => {
    // 운항정보
    const [flightInfo, setFlightInfo] = useState<SummaryFlight>({
        t1FltCnt: 0, // T1 운항수
        t1PsgCnt: 0, // T1 여객수
        t1BeforeFltCnt: 0, // t1 전일 운항수
        t1BeforePsgCnt: 0, // t1 전일 여객수
        t2FltCnt: 0, // T2 운항수
        t2PsgCnt: 0, // T2 여객수
        t2BeforeFltCnt: 0, // t2 전일 운항수
        t2BeforePsgCnt: 0, // t2 전일 여객수
    });

    // 선택된 탭 상태 (0: 요약보기, 1: 맵형태보기, 2: 체크인카운터, 3: 셀프체크인/백드롭, 4: 출국장)
    const [selectedTab, setSelectedTab] = useState(0);
    const [date, setDate] = useState<Date | undefined>(new Date());

    const [peakTimeLabelT1, setPeakTimeLabelT1] = useState<string>('0000-00-00');
    const [peakTimeLabelT2, setPeakTimeLabelT2] = useState<string>('0000-00-00');

    const [mainChartT1Data, setMainChartT1Data] = useState<SummaryChartData[]>([]);
    const [mainChartT2Data, setMainChartT2Data] = useState<SummaryChartData[]>([]);
    const [depT1ChartData, setDepT1ChartData] = useState<ChartData[]>([]);
    const [depT2ChartData, setDepT2ChartData] = useState<ChartData[]>([]);

    const [chknT1Data, setChknT1Data] = useState<SmryChknDto[]>([]);
    const [chknT2Data, setChknT2Data] = useState<SmryChknDto[]>([]);
    const [depT1Data, setDepT1Data] = useState<SmryDepDto[]>([]);
    const [depT2Data, setDepT2Data] = useState<SmryDepDto[]>([]);

    const [lastBatchDate, setLastBatchDate] = useState<Date>(new Date());
    const [nextBatchDate, setNextBatchDate] = useState<Date>(new Date());

    // 각 카드의 현재 인덱스를 추적하는 상태
    const [t1CheckinIndex, setT1CheckinIndex] = useState(0);
    const [t1DepartureIndex, setT1DepartureIndex] = useState(1);
    const [t2CheckinIndex, setT2CheckinIndex] = useState(0);
    const [t2DepartureIndex, setT2DepartureIndex] = useState(0);

    // 슬라이드 방향 추적
    const [slideDirectionT1Chkn, setSlideDirectionT1Chkn] = useState<'left' | 'right'>('right');
    const [slideDirectionT1Dep, setSlideDirectionT1Dep] = useState<'left' | 'right'>('right');
    const [slideDirectionT2Chkn, setSlideDirectionT2Chkn] = useState<'left' | 'right'>('right');
    const [slideDirectionT2Dep, setSlideDirectionT2Dep] = useState<'left' | 'right'>('right');

    const currentTheme = themeColors[selectedTab as keyof typeof themeColors];

    useEffect(() => {
        const today = new Date();
        today.setMinutes(0);
        setLastBatchDate(today);

        const nextBatch = new Date();
        nextBatch.setHours(nextBatch.getHours() + 1);
        nextBatch.setMinutes(0);
        setNextBatchDate(nextBatch);
    }, [])

    useEffect(() => {
        if (simulationKey == '-1') {
            initialize();
            return;
        }

        if (selectedTab === 0) {
            searchSmryApi(simulationKey, 'PEAK_PSG');
        } else if (selectedTab === 1) {
            searchSmryApi(simulationKey, 'PEAK_CHKN');
        } else if (selectedTab === 2) {
            searchSmryApi(simulationKey, 'PEAK_DEP');
        } else if (selectedTab === 3) {
            searchSmryApi(simulationKey, 'PEAK_SC');
        }
    }, [simulationKey, selectedTab]);

    useEffect(() => {
        searchSmryByDepFcltCdApi('P01', t1DepartureIndex);
    }, [t1DepartureIndex]);

    useEffect(() => {
        searchSmryByDepFcltCdApi('P03', t2DepartureIndex);
    }, [t2DepartureIndex]);

    const initialize = () => {
        setFlightInfo({ t1FltCnt: 0, t1PsgCnt: 0, t1BeforeFltCnt: 0, t1BeforePsgCnt: 0, t2FltCnt: 0, t2PsgCnt: 0, t2BeforeFltCnt: 0, t2BeforePsgCnt: 0 });
        setMainChartT1Data([]);
        setMainChartT2Data([]);
        setDepT1ChartData([]);
        setDepT2ChartData([]);
        setChknT1Data([]);
        setChknT2Data([]);
        setDepT1Data([]);
        setDepT2Data([]);
    }

    const searchSmryApi = async (simulationKey: string, congestionType: CongestionType) => {
        const smryDailyInfo = await summaryService.getSmryInfo(simulationKey, congestionType);

        setDate(parseDate(smryDailyInfo.ymd));
        setFlightInfo(smryDailyInfo.summaryFlight);

        setPeakTimeLabelT1(`${formatDateWithDay(parseDate(smryDailyInfo.ymd))}    ${smryDailyInfo.peakTimeT1.slice(0, 2)} : ${smryDailyInfo.peakTimeT1.slice(2, 4)}`);
        setPeakTimeLabelT2(`${formatDateWithDay(parseDate(smryDailyInfo.ymd))}    ${smryDailyInfo.peakTimeT2.slice(0, 2)} : ${smryDailyInfo.peakTimeT2.slice(2, 4)}`);

        // MainChart
        handleMainChart(smryDailyInfo);

        // 체크인카운터
        handleChknData(smryDailyInfo.chknT1Datas, t1Islands, setChknT1Data);
        handleChknData(smryDailyInfo.chknT2Datas, t2Islands, setChknT2Data);

        // 출국장
        handleDepData(smryDailyInfo.depT1Datas, t1Deps, setDepT1Data);
        handleDepData(smryDailyInfo.depT2Datas, t2Deps, setDepT2Data);
    }

    const searchSmryByDepFcltCdApi = async (tmnlId: string, departureIndex: number) => {
        const dep = tmnlId === 'P01' ? t1Deps[departureIndex] : t2Deps[departureIndex];
        const fcltCdPrefix = tmnlId === 'P01' ? `T1L${dep}` : `T2_${dep}`;
        const setDepChartData = tmnlId === 'P01' ? setDepT1ChartData : setDepT2ChartData;
        searchSmryDailyByFcltCdApi(simulationKey, tmnlId, fcltCdPrefix, setDepChartData);
    }

    const searchSmryDailyByFcltCdApi = async (simulationKey: string, tmnlId: string, fcltCdPrefix: string, callbackSetState: (value: React.SetStateAction<ChartData[]>) => void) => {
        const result = await summaryService.getSmryDepChart(simulationKey, tmnlId, fcltCdPrefix);

        const chartData = [];
        for (let h = 0; h <= 23; h += 4) {
            const time = String(h).padStart(2, '0') + '00';
            const target = result.find(x => x.time === time);
            chartData.push({ time: `${h}H`, wtngPsgCnt: target?.wtngPsgCnt ?? 0, wtngHr: target?.wtngHr ?? 0 });
        }

        callbackSetState(chartData);
    }

    const handleMainChart = (smryDailyInfo: SmltSmry) => {
        const mainChartT1 = [];
        const mainChartT2 = [];

        for (let h = 0; h <= 23; h++) {
            for (let m = 0; m <= 30; m += 30) {
                const time = String(h).padStart(2, '0') + String(m).padStart(2, '0');
                const castT1 = smryDailyInfo.castT1Datas.find(x => x.time === time);
                const castT2 = smryDailyInfo.castT2Datas.find(x => x.time === time);
                const xovisT1 = smryDailyInfo.xovisT1Datas.find(x => x.time === time);
                const xovisT2 = smryDailyInfo.xovisT2Datas.find(x => x.time === time);

                mainChartT1.push({ time: `${h}${m === 30 ? '.5' : ''}H`, castWtngPsgCnt: castT1?.wtngPsgCnt ?? 0, xovisWtngPsgCnt: xovisT1?.wtngPsgCnt ?? 0 });
                mainChartT2.push({ time: `${h}${m === 30 ? '.5' : ''}H`, castWtngPsgCnt: castT2?.wtngPsgCnt ?? 0, xovisWtngPsgCnt: xovisT2?.wtngPsgCnt ?? 0 });
            }
        }

        setMainChartT1Data(mainChartT1);
        setMainChartT2Data(mainChartT2);
    }

    const handleChknData = (chknDatas: SmryChknDto[], islands: string[], setChknData: Dispatch<SetStateAction<SmryChknDto[]>>) => {
        const chkn: SmryChknDto[] = [];

        for (let island of islands) {
            const target = chknDatas.find(x => x.island === island);
            if (!target) {
                chkn.push({ island: island, cgnStatus: 'FREE', wtngPsgCnt: 0, prcsHr: 0, wtngHr: 0 });
            } else {
                chkn.push(target);
            }
        }

        setChknData(chkn);
    }

    const handleDepData = (depDatas: SmryDepDto[], deps: string[], setDepData: Dispatch<SetStateAction<SmryDepDto[]>>) => {
        const dep: SmryDepDto[] = [];

        for (let depNum of deps) {
            const target = depDatas.find(x => x.depNum === depNum);

            if (!target) {
                dep.push({ depNum: depNum, cgnStatus: 'FREE', wtngPsgCnt: 0, prcsHr: 0, wtngHr: 0 });
            } else {
                dep.push(target);
            }
        }

        setDepData(dep);
    }

    const t1FltDiff = String(flightInfo.t1FltCnt - flightInfo.t1BeforeFltCnt > 0 ? '+' + (flightInfo.t1FltCnt - flightInfo.t1BeforeFltCnt) : flightInfo.t1FltCnt - flightInfo.t1BeforeFltCnt);
    const t2FltDiff = String(flightInfo.t2FltCnt - flightInfo.t2BeforeFltCnt > 0 ? '+' + (flightInfo.t2FltCnt - flightInfo.t2BeforeFltCnt) : flightInfo.t2FltCnt - flightInfo.t2BeforeFltCnt);
    const t1PsgDiff = String(flightInfo.t1PsgCnt - flightInfo.t1BeforePsgCnt > 0 ? '+' + (flightInfo.t1PsgCnt - flightInfo.t1BeforePsgCnt) : flightInfo.t1PsgCnt - flightInfo.t1BeforePsgCnt);
    const t2PsgDiff = String(flightInfo.t2PsgCnt - flightInfo.t2BeforePsgCnt > 0 ? '+' + (flightInfo.t2PsgCnt - flightInfo.t2BeforePsgCnt) : flightInfo.t2PsgCnt - flightInfo.t2BeforePsgCnt);

    const searchOnClick = () => {
        onChangeDateCallback && onChangeDateCallback(date as Date);
        searchSmryByDepFcltCdApi('P01', t1DepartureIndex);
        searchSmryByDepFcltCdApi('P03', t2DepartureIndex);
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

    const displayCgnStatus = (arr: Pick<SmryChknDto, 'cgnStatus'>[]) => {
        let freeCnt = 0;
        let normalCnt = 0;
        let busyCnt = 0;
        let veryBusyCnt = 0;

        for (const item of arr) {
            if (item.cgnStatus === 'FREE') {
                freeCnt++;
            } else if (item.cgnStatus === 'NORMAL') {
                normalCnt++;
            } else if (item.cgnStatus === 'BUSY') {
                busyCnt++;
            } else if (item.cgnStatus === 'VERY_BUSY') {
                veryBusyCnt++;
            }
        }

        let result = [];

        if (freeCnt > 0) {
            result.push(`${cgnStatus('FREE')} ${freeCnt}개`);
        }

        if (normalCnt > 0) {
            result.push(`${cgnStatus('NORMAL')} ${normalCnt}개`);
        }

        if (busyCnt > 0) {
            result.push(`${cgnStatus('BUSY')} ${busyCnt}개`);
        }

        if (veryBusyCnt > 0) {
            result.push(`${cgnStatus('VERY_BUSY')} ${veryBusyCnt}개`);
        }

        return result.join(' | ');
    }

    const cgnStatusColor = (cgnStatus: CongestionStatus) => {
        return cgnStatus === 'FREE' ? 'bg-cyan-400' : cgnStatus === 'NORMAL' ? 'bg-green-400' : cgnStatus === 'BUSY' ? 'bg-orange-400' : 'bg-red-400';
    }

    return (
        <>
            <style>{`
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="min-w-358 max-w-450 mx-auto p-2 min-h-screen">
                    {/* Header */}
                    <header className="bg-white p-5 rounded-2xl mb-6 shadow-lg border border-gray-200">
                        <div className="flex justify-between items-center whitespace-nowrap gap-4">
                            {/* 1. 운항계획 버튼 with Simulation Type Badge */}
                            <div className="flex flex-col gap-1 flex-0">
                                <div
                                    className={`${currentTheme.headerBg} text-white px-4 rounded-xl text-base font-bold shadow-md flex items-center gap-2 h-16 w-37.75`}
                                >
                                    <Logo className="w-12 h-12" />
                                    {
                                        simulationType === 'daily' ?
                                            <div>
                                                <span>일일</span>
                                                <br />
                                                <span>시뮬레이션</span>
                                            </div> :
                                            <div>
                                                <span>사용자</span>
                                                <br />
                                                <span>시뮬레이션</span>
                                            </div>
                                    }
                                </div>
                            </div>

                            {/* 2. 통계 박스: 총 운항편 + 총여객수 */}
                            <div className="flex bg-white border-2 border-blue-300 rounded-xl px-6 shadow-sm gap-6 h-16 flex-1">
                                {/* 총 운항편 */}
                                <div className="flex items-center gap-2.5 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                                        <AirplaneIcon className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex justify-center items-baseline gap-2">
                                        <span className="text-[11px] text-gray-500 font-medium leading-tight relative -top-0.5">
                                            운항편수
                                        </span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-blue-600 text-lg font-bold">
                                                {(flightInfo.t1FltCnt + flightInfo.t2FltCnt).toLocaleString()}
                                            </span>
                                            <span className="text-[11px] text-gray-600 font-medium">
                                                편
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {/* 총여객수 */}
                                <div className="flex items-center gap-2.5 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                        <PeopleIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex justify-center items-baseline gap-2">
                                        <span className="text-[11px] text-gray-500 font-medium leading-tight relative -top-0.5">
                                            예약 여객수
                                        </span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-green-600 text-lg font-bold">
                                                {(flightInfo.t1PsgCnt + flightInfo.t2PsgCnt).toLocaleString()}
                                            </span>
                                            <span className="text-[11px] text-gray-600 font-medium">
                                                명
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. 검색 영역 */}
                            <div className="flex items-center gap-1.5 bg-white border-2 border-blue-300 rounded-xl px-4 shadow-sm h-16 flex-2">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <label className="text-[11px] font-semibold">기준일자</label>
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="justify-start text-left font-NORMAL text-sm border-gray-200 hover:border-indigo-400 py-2 h-7"
                                            disabled={simulationType === 'user'}
                                        >
                                            <Calendar className="mr-2" />

                                            {format(date as Date, 'yyyy-MM-dd')}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <CalendarComponent
                                            mode="single"
                                            selected={date}
                                            onSelect={(x) => { x && setDate(x); }}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <div className="flex-1" />
                                <button
                                    className={`bg-gradient-to-r ${currentTheme.gradient} text-white px-4 lg:px-6 py-1.5 rounded-md font-bold text-xs shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-1.5 shrink-0`}
                                    onClick={searchOnClick}
                                >
                                    <SearchIcon className="w-3.5 h-3.5" />
                                    SEARCH
                                </button>
                            </div>

                            {/* 4. 시각 정보 */}
                            {
                                <div className="flex flex-col justify-center text-right text-[11px] leading-relaxed px-4 rounded-xl h-16 border-2 border-blue-300 flex-0">
                                    <div className="text-gray-600">
                                        <span className="font-semibold">마지막 계산 시각</span>
                                        <span className="ml-2 px-1 bg-gray-200">{formatDateWithDay(lastBatchDate)} {formatTimeFromDate(lastBatchDate)}</span>
                                    </div>
                                    <div className="text-red-600 my-0.5">
                                        <span className="font-semibold">재계산 예정 시각</span>
                                        <span className="ml-2 px-1 bg-gray-200">{formatDateWithDay(nextBatchDate)} {formatTimeFromDate(nextBatchDate)}</span>
                                    </div>
                                </div>
                            }

                        </div>
                    </header>

                    {/* Navigation Tabs */}
                    <nav className="grid grid-cols-4 gap-3 mb-6">
                        {tabs.map((tab, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedTab(index)}
                                className={`rounded-xl text-center py-4 font-semibold shadow-md transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 ${selectedTab === index
                                    ? `bg-gradient-to-r ${currentTheme.gradient} text-white shadow-lg`
                                    : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-lg'
                                    }`}
                            >
                                {index === 0 &&
                                    (selectedTab === 0 ? (
                                        <TerminalPassengerOnIcon className="w-10 h-10" />
                                    ) : (
                                        <TerminalPassengerIcon className="w-10 h-10" />
                                    ))}
                                {index === 1 &&
                                    (selectedTab === 1 ? (
                                        <CounterConOnOrangeIcon className="w-10 h-10" />
                                    ) : (
                                        <CounterConIcon className="w-10 h-10" />
                                    ))}
                                {index === 2 &&
                                    (selectedTab === 2 ? (
                                        <DepartureOnGreenIcon className="w-10 h-10" />
                                    ) : (
                                        <DepartureIcon className="w-10 h-10" />
                                    ))}
                                {index === 3 &&
                                    (selectedTab === 3 ? (
                                        <PoliceOnPurpleIcon className="w-10 h-10" />
                                    ) : (
                                        <PoliceIcon className="w-10 h-10" />
                                    ))}
                                {tab}
                            </button>
                        ))}
                    </nav>

                    {/* Main Content */}
                    <main className="grid grid-cols-2 gap-6">
                        {/* T1 영역 (왼쪽) */}
                        <div className="space-y-6">
                            <div
                                className={`bg-gradient-to-r ${currentTheme.gradient} text-white font-bold py-3 rounded-xl mb-6 shadow-md px-4 whitespace-pre`}
                            >
                                <span>{peakTimeLabelT1}</span>
                            </div>
                            <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100">
                                <div className="flex justify-between items-start mb-1 pt-5 pl-5">
                                    <h3 className="text-sm font-bold text-gray-700">
                                        CAST/Xovis 비교선 그래프 T1
                                    </h3>
                                </div>
                                {/* T1 Mini Chart */}
                                <ResponsiveContainer width="100%" height={230}>
                                    <ComposedChart
                                        data={mainChartT1Data}
                                        margin={{ top: -20, right: 5, left: 0, bottom: -10 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e5e7eb"
                                            vertical={false}
                                            opacity={0.5}
                                        />
                                        <XAxis
                                            dataKey="time"
                                            interval={1}
                                            tick={{ fontSize: 12, fill: '#6b7280' }}
                                            axisLine={{ stroke: '#d1d5db' }}
                                            tickLine={{ stroke: '#d1d5db' }}
                                        />
                                        <YAxis
                                            label={{
                                                value: '대기인원 수',
                                                position: 'insideLeft',
                                                offset: 10,
                                                angle: -90,
                                                style: { fill: '#6b7280', fontWeight: 400 },
                                            }}
                                            tick={{ fontSize: 12, fill: '#6b7280' }}
                                            axisLine={{ stroke: '#d1d5db' }}
                                            tickLine={{ stroke: '#d1d5db' }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            verticalAlign='top'
                                            align='right'
                                            formatter={(value) => (
                                                <span className="text-sm font-medium text-gray-700">
                                                    {value}
                                                </span>
                                            )}
                                        />
                                        <Line
                                            type="monotone"
                                            name="Cast"
                                            dataKey="castWtngPsgCnt"
                                            stroke={colors.softred}
                                            strokeWidth={3}
                                            dot={<CustomDot fill={colors.softred} />}
                                            activeDot={{
                                                r: 8,
                                                fill: colors.softred,
                                                stroke: '#fff',
                                                strokeWidth: 3,
                                            }}
                                            animationDuration={300}
                                            animationBegin={0}
                                            animationEasing='ease-in-out'
                                        />
                                        <Line
                                            name="Xovis"
                                            dataKey="xovisWtngPsgCnt"
                                            stroke={colors.primary}
                                            strokeWidth={2}
                                            animationDuration={300}
                                            animationBegin={0}
                                            animationEasing='ease-in-out'
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                            {/* T1 Terminal Card */}
                            {[
                                {
                                    id: 'T1',
                                    title: 'T1 출국장 예측',
                                    chartData: [30, 40, 50, 80, 70, 60, 55, 40, 30, 20],
                                },
                            ]
                                .map((terminal, tIdx) => (
                                    <article
                                        key={terminal.id}
                                        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                                    >
                                        <div
                                            className={`${currentTheme.simulationHeaderBg[tIdx]} flex justify-between items-center px-6 py-3 font-bold shadow-md`}
                                        >
                                            <div className="flex items-center gap-2 text-white">
                                                <Terminal1Icon className="w-5 h-5" />
                                                <span className="text-lg">시뮬레이션 요약</span>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="grid grid-cols-[1fr_3fr] gap-4 mb-6">
                                                <div className="space-y-6">
                                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 py-8 rounded-xl text-center border-2 border-blue-200 shadow-sm">
                                                        <div className="flex items-center justify-center gap-5 mb-3">
                                                            <div>
                                                                <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center">
                                                                    <AirplaneIcon className="w-7 h-7 text-white" />
                                                                </div>
                                                                <div className="text-xs text-gray-600 font-medium">
                                                                    운항편수
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div
                                                                    className={`${currentTheme.accentText} text-2xl font-bold mb-2`}
                                                                >
                                                                    {flightInfo.t1FltCnt}{' '}
                                                                    <span className="text-sm">편</span>
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    전일 대비{' '}
                                                                    <span className={`${t1FltDiff.includes('+') ? 'text-red-600' : 'text-blue-600'} font-semibold`}>
                                                                        {t1FltDiff} 편
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-gradient-to-br from-green-50 to-green-100 pl-4 py-8 rounded-xl text-center border-2 border-green-200 shadow-sm">
                                                        <div className="flex items-center justify-center gap-5 mb-3">
                                                            <div>
                                                                <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center">
                                                                    <PeopleIcon className="w-7 h-7 text-white" />
                                                                </div>
                                                                <div className="text-xs text-gray-600 font-medium">
                                                                    여객수
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-green-600 text-2xl font-bold mb-2">
                                                                    {flightInfo.t1PsgCnt.toLocaleString()}{' '}
                                                                    <span className="text-sm">명</span>
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    전일 대비{' '}
                                                                    <span className={`${t1PsgDiff.includes('+') ? 'text-red-600' : 'text-blue-600'} font-semibold`}>
                                                                        {t1PsgDiff} 명
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 오른쪽: 차트 */}
                                                <div className="relative bg-white border-2 border-gray-200 rounded-xl p-4 shadow-inner flex flex-col">
                                                    <div className="text-center text-base font-bold text-gray-700 mb-3">
                                                        T1 출국장 예측
                                                    </div>

                                                    {/* 차트 영역 */}
                                                    <ResponsiveContainer width="100%" height={230}>
                                                        <ComposedChart
                                                            data={depT1ChartData}
                                                            margin={{ top: 3, right: -5, left: -5, bottom: -10 }}
                                                        >
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
                                                                yAxisId="wtngPsgCntT1"
                                                                label={{
                                                                    value: '대기인원 수',
                                                                    position: 'insideLeft',
                                                                    offset: 20,
                                                                    angle: -90,
                                                                    style: { fill: '#6b7280', fontWeight: 200 },
                                                                    fontSize: 12
                                                                }}
                                                                tick={{ fontSize: 8, fill: '#6b7280' }}
                                                                axisLine={{ stroke: '#d1d5db' }}
                                                                tickLine={{ stroke: '#d1d5db' }}
                                                            />
                                                            <YAxis
                                                                yAxisId="wtngHrT1"
                                                                orientation='right'
                                                                label={{
                                                                    value: '대기시간',
                                                                    angle: 90,
                                                                    position: 'insideRight',
                                                                    offset: 25,
                                                                    style: { fill: '#6b7280', fontWeight: 200 },
                                                                    fontSize: 12
                                                                }}
                                                                tick={{ fontSize: 8, fill: '#6b7280' }}
                                                                axisLine={{ stroke: '#d1d5db' }}
                                                                tickLine={{ stroke: '#d1d5db' }}
                                                            />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Bar
                                                                yAxisId="wtngPsgCntT1"
                                                                name="대기인원"
                                                                dataKey="wtngPsgCnt"
                                                                fill={colors.primary}
                                                                radius={[4, 4, 0, 0]}
                                                            />
                                                            <Bar
                                                                yAxisId="wtngHrT1"
                                                                name="대기시간"
                                                                dataKey="wtngHr"
                                                                fill={colors.tertiary}
                                                                radius={[4, 4, 0, 0]}
                                                            />

                                                        </ComposedChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                            {/* Detail Rows - T1 */}
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* T1 체크인카운터 카드 */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => {
                                                            setSlideDirectionT1Chkn('left');
                                                            setT1CheckinIndex((prev) => (prev - 1 + t1Islands.length) % t1Islands.length);
                                                        }}
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 z-20 w-6 h-6 bg-white rounded-full shadow-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-all"
                                                    >
                                                        <ArrowLeftIcon className="w-3 h-3 text-blue-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSlideDirectionT1Chkn('right');
                                                            setT1CheckinIndex((prev) => (prev + 1) % t1Islands.length);
                                                        }}
                                                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 z-20 w-6 h-6 bg-white rounded-full shadow-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-all"
                                                    >
                                                        <ArrowRightIcon className="w-3 h-3 text-blue-500" />
                                                    </button>

                                                    <div className="overflow-hidden">
                                                        <div
                                                            key={`t1-checkin-${t1CheckinIndex}`}
                                                            className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                                                            style={{ animation: slideDirectionT1Chkn === 'right' ? 'slideInRight 0.7s ease-out' : 'slideInLeft 0.7s ease-out' }}
                                                        >
                                                            <div className="flex justify-between px-4 py-3 font-bold text-sm border-b-2 bg-blue-50 border-blue-200">
                                                                <span className="text-blue-600">
                                                                    체크인카운터
                                                                </span>
                                                                <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs">
                                                                    {displayCgnStatus(chknT1Data)}
                                                                </span>
                                                            </div>
                                                            <div className="px-1 py-5 text-center bg-white">
                                                                <div className="text-gray-600 font-semibold text-sm mb-1">
                                                                    아일랜드
                                                                </div>
                                                                <div className="text-3xl font-bold text-red-600 mb-2">
                                                                    {chknT1Data[t1CheckinIndex]?.island}
                                                                </div>
                                                                <div className="text-xs text-gray-600 mb-3">
                                                                    {`대기인원 ${chknT1Data[t1CheckinIndex]?.wtngPsgCnt} 명`}
                                                                </div>
                                                                <span className={`inline-block text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md ${cgnStatusColor(chknT1Data[t1CheckinIndex]?.cgnStatus)}`}>
                                                                    {cgnStatus(chknT1Data[t1CheckinIndex]?.cgnStatus)}
                                                                </span>

                                                                <div className="flex justify-around mt-4 mb-4">
                                                                    <div className="w-16 h-16 rounded-full border-3 border-gray-400 flex flex-col items-center justify-center text-xs bg-gradient-to-br from-gray-50 to-white shadow-sm">
                                                                        <span className="font-bold text-gray-700">
                                                                            처리시간
                                                                        </span>
                                                                        <span className="text-gray-500 text-[10px]">
                                                                            {chknT1Data[t1CheckinIndex]?.prcsHr} 초
                                                                        </span>
                                                                    </div>

                                                                    <div className="w-16 h-16 rounded-full border-3 border-gray-400 flex flex-col items-center justify-center text-xs bg-gradient-to-br from-gray-50 to-white shadow-sm">
                                                                        <span className="font-bold text-gray-700">
                                                                            대기시간
                                                                        </span>
                                                                        <span className="text-gray-500 text-[10px]">
                                                                            {chknT1Data[t1CheckinIndex]?.wtngHr} 초
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex justify-center gap-1 flex-wrap">
                                                                    {t1Islands.map((b, bIdx) => (
                                                                        <button
                                                                            key={bIdx}
                                                                            className={`w-5 h-5 text-white text-[10px] flex items-center justify-center rounded font-bold shadow-sm ${cgnStatusColor(chknT1Data[bIdx]?.cgnStatus)}`}
                                                                            onClick={() => { setT1CheckinIndex(bIdx) }}
                                                                        >
                                                                            {b}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* T1 출국장 카드 */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => {
                                                            setSlideDirectionT1Dep('left');
                                                            setT1DepartureIndex((prev) => (prev - 1 + t1Deps.length) % t1Deps.length);
                                                        }}
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 z-20 w-6 h-6 bg-white rounded-full shadow-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-all"
                                                    >
                                                        <ArrowLeftIcon className="w-3 h-3 text-blue-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSlideDirectionT1Dep('right');
                                                            setT1DepartureIndex((prev) => (prev + 1) % t1Deps.length);
                                                        }}
                                                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 z-20 w-6 h-6 bg-white rounded-full shadow-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-all"
                                                    >
                                                        <ArrowRightIcon className="w-3 h-3 text-blue-500" />
                                                    </button>

                                                    <div className="overflow-hidden">
                                                        <div
                                                            key={`t1-departure-${t1DepartureIndex}`}
                                                            className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                                                            style={{ animation: slideDirectionT1Dep === 'right' ? 'slideInRight 0.7s ease-out' : 'slideInLeft 0.7s ease-out' }}
                                                        >
                                                            <div className="flex justify-between px-4 py-3 font-bold text-sm border-b-2 bg-green-50 border-green-200">
                                                                <span className="text-green-600">
                                                                    출국장
                                                                </span>
                                                                <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs">
                                                                    {displayCgnStatus(depT1Data)}
                                                                </span>
                                                            </div>
                                                            <div className="p-5 text-center bg-white">
                                                                <div className="text-gray-600 font-semibold text-sm mb-1">
                                                                    출국장 번호
                                                                </div>
                                                                <div className="text-3xl font-bold text-red-600 mb-2">
                                                                    {depT1Data[t1DepartureIndex]?.depNum} 번
                                                                </div>
                                                                <div className="text-xs text-gray-600 mb-3">
                                                                    대기인원 {depT1Data[t1DepartureIndex]?.wtngPsgCnt} 명
                                                                </div>
                                                                <span className={`inline-block text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md ${cgnStatusColor(depT1Data[t1DepartureIndex]?.cgnStatus)}`}>
                                                                    {cgnStatus(depT1Data[t1DepartureIndex]?.cgnStatus)}
                                                                </span>

                                                                <div className="flex justify-around mt-4 mb-4">
                                                                    <div className="w-16 h-16 rounded-full border-3 border-gray-300 flex flex-col items-center justify-center text-xs bg-gradient-to-br from-gray-50 to-white shadow-sm">
                                                                        <span className="font-bold text-gray-700">
                                                                            처리시간
                                                                        </span>
                                                                        <span className="text-gray-500 text-[10px]">
                                                                            {depT1Data[t1DepartureIndex]?.prcsHr} 초
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-16 h-16 rounded-full border-3 border-gray-300 flex flex-col items-center justify-center text-xs bg-gradient-to-br from-gray-50 to-white shadow-sm">
                                                                        <span className="font-bold text-gray-700">
                                                                            대기시간
                                                                        </span>
                                                                        <span className="text-gray-500 text-[10px]">
                                                                            {depT1Data[t1DepartureIndex]?.wtngHr} 초
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-center gap-1 flex-wrap">
                                                                    {t1Deps.map((b, bIdx) => (
                                                                        <button
                                                                            key={bIdx}
                                                                            className={`w-5 h-5 text-white text-[10px] flex items-center justify-center rounded font-bold shadow-sm ${cgnStatusColor(depT1Data[bIdx]?.cgnStatus)}`}
                                                                            onClick={() => { setT1DepartureIndex(bIdx) }}
                                                                        >
                                                                            {b}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                        </div>

                        {/* T2 영역 (오른쪽) */}
                        <div className="space-y-6">
                            <div
                                className={`bg-gradient-to-r ${currentTheme.gradient} text-white font-bold py-3 rounded-xl mb-6 shadow-md px-4 whitespace-pre`}
                            >
                                <span>{peakTimeLabelT2}</span>
                            </div>

                            {/* T2 Mini Chart */}
                            <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100">
                                <div className="flex justify-between items-start mb-1 pt-5 pl-5">
                                    <h3 className="text-sm font-bold text-gray-700">
                                        CAST/Xovis 비교선 그래프 T2
                                    </h3>
                                </div>
                                {/* T1 Mini Chart */}
                                <ResponsiveContainer width="100%" height={230}>
                                    <ComposedChart
                                        data={mainChartT2Data}
                                        margin={{ top: -20, right: 5, left: 0, bottom: -10 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e5e7eb"
                                            vertical={false}
                                            opacity={0.5}
                                        />
                                        <XAxis
                                            dataKey="time"
                                            interval={1}
                                            tick={{ fontSize: 12, fill: '#6b7280' }}
                                            axisLine={{ stroke: '#d1d5db' }}
                                            tickLine={{ stroke: '#d1d5db' }}
                                        />
                                        <YAxis
                                            label={{
                                                value: '대기인원 수',
                                                position: 'insideLeft',
                                                offset: 10,
                                                angle: -90,
                                                style: { fill: '#6b7280', fontWeight: 400 },
                                            }}
                                            tick={{ fontSize: 12, fill: '#6b7280' }}
                                            axisLine={{ stroke: '#d1d5db' }}
                                            tickLine={{ stroke: '#d1d5db' }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            verticalAlign='top'
                                            align='right'
                                            formatter={(value) => (
                                                <span className="text-sm font-medium text-gray-700">
                                                    {value}
                                                </span>
                                            )}
                                        />
                                        <Line
                                            type="monotone"
                                            name="Cast"
                                            dataKey="castWtngPsgCnt"
                                            stroke={colors.softred}
                                            strokeWidth={3}
                                            dot={<CustomDot fill={colors.softred} />}
                                            activeDot={{
                                                r: 8,
                                                fill: colors.softred,
                                                stroke: '#fff',
                                                strokeWidth: 3,
                                            }}
                                            animationDuration={300}
                                            animationBegin={0}
                                            animationEasing='ease-in-out'
                                        />
                                        <Line
                                            name="Xovis"
                                            dataKey="xovisWtngPsgCnt"
                                            stroke={colors.primary}
                                            strokeWidth={2}
                                            animationDuration={300}
                                            animationBegin={0}
                                            animationEasing='ease-in-out'
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                            {/* T2 Terminal Card */}
                            {[
                                {
                                    id: 'T2',
                                    chartData: [20, 35, 45, 90, 85, 60, 50, 35, 25, 20],
                                },
                            ].map((terminal) => (
                                <article
                                    key={terminal.id}
                                    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                                >
                                    <div
                                        className={`${currentTheme.simulationHeaderBg[1]} flex justify-between items-center px-6 py-3 font-bold shadow-md`}
                                    >
                                        <div className="flex items-center gap-2 text-white">
                                            <Terminal2Icon className="w-5 h-5" />
                                            <span className="text-lg">시뮬레이션 요약</span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-[1fr_3fr] gap-4 mb-6">
                                            <div className="space-y-6">
                                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 py-8 rounded-xl text-center border-2 border-blue-200 shadow-sm">
                                                    <div className="flex items-center justify-center gap-5 mb-3">
                                                        <div>
                                                            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center">
                                                                <AirplaneIcon className="w-7 h-7 text-white" />
                                                            </div>
                                                            <div className="text-xs text-gray-600 font-medium">
                                                                운항편수
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div
                                                                className={`${currentTheme.accentText} text-2xl font-bold mb-2`}
                                                            >
                                                                {flightInfo.t2FltCnt}{' '}
                                                                <span className="text-sm">편</span>
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                전일 대비{' '}
                                                                <span className={`${t1FltDiff.includes('+') ? 'text-red-600' : 'text-blue-600'} font-semibold`}>
                                                                    {t2FltDiff} 편
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-gradient-to-br from-green-50 to-green-100 pl-4 py-8 rounded-xl text-center border-2 border-green-200 shadow-sm">
                                                    <div className="flex items-center justify-center gap-5 mb-3">
                                                        <div>
                                                            <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center">
                                                                <PeopleIcon className="w-7 h-7 text-white" />
                                                            </div>
                                                            <div className="text-xs text-gray-600 font-medium">
                                                                여객수
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-green-600 text-2xl font-bold mb-2">
                                                                {flightInfo.t2PsgCnt.toLocaleString()}{' '}
                                                                <span className="text-sm">명</span>
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                전일 대비{' '}
                                                                <span className={`${t1PsgDiff.includes('+') ? 'text-red-600' : 'text-blue-600'} font-semibold`}>
                                                                    {t2PsgDiff} 명
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 오른쪽: 차트 */}
                                            <div className="relative bg-white border-2 border-gray-200 rounded-xl p-4 shadow-inner flex flex-col">
                                                <div className="text-center text-base font-bold text-gray-700 mb-3">
                                                    T2 출국장 예측
                                                </div>

                                                {/* 차트 영역 */}
                                                <ResponsiveContainer width="100%" height={230}>
                                                    <ComposedChart
                                                        data={depT2ChartData}
                                                        margin={{ top: 3, right: -5, left: -5, bottom: -10 }}
                                                    >
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
                                                            yAxisId="wtngPsgCntT1"
                                                            label={{
                                                                value: '대기인원 수',
                                                                position: 'insideLeft',
                                                                offset: 20,
                                                                angle: -90,
                                                                style: { fill: '#6b7280', fontWeight: 200 },
                                                                fontSize: 12
                                                            }}
                                                            tick={{ fontSize: 8, fill: '#6b7280' }}
                                                            axisLine={{ stroke: '#d1d5db' }}
                                                            tickLine={{ stroke: '#d1d5db' }}
                                                        />
                                                        <YAxis
                                                            yAxisId="wtngHrT1"
                                                            orientation='right'
                                                            label={{
                                                                value: '대기시간',
                                                                angle: 90,
                                                                position: 'insideRight',
                                                                offset: 25,
                                                                style: { fill: '#6b7280', fontWeight: 200 },
                                                                fontSize: 12
                                                            }}
                                                            tick={{ fontSize: 8, fill: '#6b7280' }}
                                                            axisLine={{ stroke: '#d1d5db' }}
                                                            tickLine={{ stroke: '#d1d5db' }}
                                                        />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar
                                                            yAxisId="wtngPsgCntT1"
                                                            name="대기인원"
                                                            dataKey="wtngPsgCnt"
                                                            fill={colors.primary}
                                                            radius={[4, 4, 0, 0]}
                                                        />
                                                        <Bar
                                                            yAxisId="wtngHrT1"
                                                            name="대기시간"
                                                            dataKey="wtngHr"
                                                            fill={colors.tertiary}
                                                            radius={[4, 4, 0, 0]}
                                                        />

                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Detail Rows - T2 */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* T2 체크인카운터 카드 */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => {
                                                        setSlideDirectionT2Chkn('left');
                                                        setT2CheckinIndex((prev) => (prev - 1 + t2Islands.length) % t2Islands.length);
                                                    }}
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 z-20 w-6 h-6 bg-white rounded-full shadow-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-all"
                                                >
                                                    <ArrowLeftIcon className="w-3 h-3 text-blue-500" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSlideDirectionT2Chkn('right');
                                                        setT2CheckinIndex((prev) => (prev + 1) % t2Islands.length);
                                                    }}
                                                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 z-20 w-6 h-6 bg-white rounded-full shadow-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-all"
                                                >
                                                    <ArrowRightIcon className="w-3 h-3 text-blue-500" />
                                                </button>

                                                <div className="overflow-hidden">
                                                    <div
                                                        key={`t2-checkin-${t2CheckinIndex}`}
                                                        className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                                                        style={{ animation: slideDirectionT2Chkn === 'right' ? 'slideInRight 0.7s ease-out' : 'slideInLeft 0.7s ease-out' }}
                                                    >
                                                        <div className="flex justify-between px-4 py-3 font-bold text-sm border-b-2 bg-blue-50 border-blue-200">
                                                            <span className="text-blue-600">
                                                                체크인카운터
                                                            </span>
                                                            <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs">
                                                                {displayCgnStatus(chknT2Data)}
                                                            </span>
                                                        </div>
                                                        <div className="px-1 py-5 text-center bg-white">
                                                            <div className="text-gray-600 font-semibold text-sm mb-1">
                                                                아일랜드
                                                            </div>
                                                            <div className="text-3xl font-bold text-red-600 mb-2">
                                                                {chknT2Data[t2CheckinIndex]?.island}
                                                            </div>
                                                            <div className="text-xs text-gray-600 mb-3">
                                                                {`대기인원 ${chknT2Data[t2CheckinIndex]?.wtngPsgCnt} 명`}
                                                            </div>
                                                            <span className={`inline-block text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md ${cgnStatusColor(chknT2Data[t2CheckinIndex]?.cgnStatus)}`}>
                                                                {cgnStatus(chknT2Data[t2CheckinIndex]?.cgnStatus)}
                                                            </span>

                                                            <div className="flex justify-around mt-4 mb-4">
                                                                <div className="w-16 h-16 rounded-full border-3 border-gray-400 flex flex-col items-center justify-center text-xs bg-gradient-to-br from-gray-50 to-white shadow-sm">
                                                                    <span className="font-bold text-gray-700">
                                                                        처리시간
                                                                    </span>
                                                                    <span className="text-gray-500 text-[10px]">
                                                                        {chknT2Data[t2CheckinIndex]?.prcsHr} 초
                                                                    </span>
                                                                </div>

                                                                <div className="w-16 h-16 rounded-full border-3 border-gray-400 flex flex-col items-center justify-center text-xs bg-gradient-to-br from-gray-50 to-white shadow-sm">
                                                                    <span className="font-bold text-gray-700">
                                                                        대기시간
                                                                    </span>
                                                                    <span className="text-gray-500 text-[10px]">
                                                                        {chknT2Data[t2CheckinIndex]?.wtngHr} 초
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex justify-center gap-1 flex-wrap">
                                                                {t2Islands.map((b, bIdx) => (
                                                                    <button
                                                                        key={bIdx}
                                                                        className={`w-5 h-5 text-white text-[10px] flex items-center justify-center rounded font-bold shadow-sm ${cgnStatusColor(chknT2Data[bIdx]?.cgnStatus)}`}
                                                                        onClick={() => { setT2CheckinIndex(bIdx) }}
                                                                    >
                                                                        {b}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* T2 출국장 카드 */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => {
                                                        setSlideDirectionT2Dep('left');
                                                        setT2DepartureIndex((prev) => (prev - 1 + t2Deps.length) % t2Deps.length);
                                                    }}
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 z-20 w-6 h-6 bg-white rounded-full shadow-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-all"
                                                >
                                                    <ArrowLeftIcon className="w-3 h-3 text-blue-500" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSlideDirectionT2Dep('right');
                                                        setT2DepartureIndex((prev) => (prev + 1) % t2Deps.length);
                                                    }}
                                                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 z-20 w-6 h-6 bg-white rounded-full shadow-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-all"
                                                >
                                                    <ArrowRightIcon className="w-3 h-3 text-blue-500" />
                                                </button>

                                                <div className="overflow-hidden">
                                                    <div
                                                        key={`t2-departure-${t2DepartureIndex}`}
                                                        className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                                                        style={{ animation: slideDirectionT2Dep === 'right' ? 'slideInRight 0.7s ease-out' : 'slideInLeft 0.7s ease-out' }}
                                                    >
                                                        <div className="flex justify-between px-4 py-3 font-bold text-sm border-b-2 bg-green-50 border-green-200">
                                                            <span className="text-green-600">
                                                                출국장
                                                            </span>
                                                            <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs">
                                                                {displayCgnStatus(depT2Data)}
                                                            </span>
                                                        </div>
                                                        <div className="p-5 text-center bg-white">
                                                            <div className="text-gray-600 font-semibold text-sm mb-1">
                                                                출국장 번호
                                                            </div>
                                                            <div className="text-3xl font-bold text-red-600 mb-2">
                                                                {depT2Data[t2DepartureIndex]?.depNum} 번
                                                            </div>
                                                            <div className="text-xs text-gray-600 mb-3">
                                                                대기인원 {depT2Data[t2DepartureIndex]?.wtngPsgCnt} 명
                                                            </div>
                                                            <span className={`inline-block text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md ${cgnStatusColor(depT2Data[t2DepartureIndex]?.cgnStatus)}`}>
                                                                {cgnStatus(depT2Data[t2DepartureIndex]?.cgnStatus)}
                                                            </span>

                                                            <div className="flex justify-around mt-4 mb-4">
                                                                <div className="w-16 h-16 rounded-full border-3 border-gray-300 flex flex-col items-center justify-center text-xs bg-gradient-to-br from-gray-50 to-white shadow-sm">
                                                                    <span className="font-bold text-gray-700">
                                                                        처리시간
                                                                    </span>
                                                                    <span className="text-gray-500 text-[10px]">
                                                                        {depT2Data[t2DepartureIndex]?.prcsHr} 초
                                                                    </span>
                                                                </div>
                                                                <div className="w-16 h-16 rounded-full border-3 border-gray-300 flex flex-col items-center justify-center text-xs bg-gradient-to-br from-gray-50 to-white shadow-sm">
                                                                    <span className="font-bold text-gray-700">
                                                                        대기시간
                                                                    </span>
                                                                    <span className="text-gray-500 text-[10px]">
                                                                        {depT2Data[t2DepartureIndex]?.wtngHr} 초
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex justify-center gap-1 flex-wrap">
                                                                {t2Deps.map((b, bIdx) => (
                                                                    <button
                                                                        key={bIdx}
                                                                        className={`w-5 h-5 text-white text-[10px] flex items-center justify-center rounded font-bold shadow-sm ${cgnStatusColor(depT2Data[bIdx]?.cgnStatus)}`}
                                                                        onClick={() => { setT2DepartureIndex(bIdx) }}
                                                                    >
                                                                        {b}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

// 각 탭별 색상 테마 정의
const themeColors = {
    0: {
        // 터미널에 여객수가 가장 많을때 - 파란색
        primary: 'blue',
        gradient: 'from-blue-600 to-cyan-400',
        headerBg: 'bg-gradient-to-r from-[#003366] to-[#004d99]',
        chartGradient: 'from-blue-500 to-cyan-300',
        accentText: 'text-blue-600',
        terminalIcon: ['bg-blue-600', 'bg-teal-500'],
        simulationHeaderBg: [
            'bg-gradient-to-r from-cyan-500 to-teal-400',
            'bg-gradient-to-r from-teal-500 to-emerald-400',
        ],
    },
    1: {
        // 체크인카운터가 가장 혼잡할 때 - 주황색
        primary: 'orange',
        gradient: 'from-orange-600 to-amber-400',
        headerBg: 'bg-gradient-to-r from-orange-900 to-orange-700',
        chartGradient: 'from-orange-500 to-amber-300',
        accentText: 'text-orange-600',
        terminalIcon: ['bg-orange-500', 'bg-amber-500'],
        simulationHeaderBg: [
            'bg-gradient-to-r from-orange-500 to-amber-400',
            'bg-gradient-to-r from-amber-500 to-orange-400',
        ],
    },
    2: {
        // 셀프체크인/백드롭이 가장 혼잡할 때 - 초록색
        primary: 'green',
        gradient: 'from-green-600 to-emerald-400',
        headerBg: 'bg-gradient-to-r from-green-900 to-green-700',
        chartGradient: 'from-green-500 to-emerald-300',
        accentText: 'text-green-600',
        terminalIcon: ['bg-green-500', 'bg-emerald-500'],
        simulationHeaderBg: [
            'bg-gradient-to-r from-green-500 to-emerald-400',
            'bg-gradient-to-r from-emerald-500 to-green-400',
        ],
    },
    3: {
        // 출국장이 가장 혼잡할 때 - 보라색
        primary: 'purple',
        gradient: 'from-purple-600 to-violet-400',
        headerBg: 'bg-gradient-to-r from-purple-900 to-purple-700',
        chartGradient: 'from-purple-500 to-violet-300',
        accentText: 'text-purple-600',
        terminalIcon: ['bg-purple-500', 'bg-violet-500'],
        simulationHeaderBg: [
            'bg-gradient-to-r from-purple-500 to-violet-400',
            'bg-gradient-to-r from-violet-500 to-purple-400',
        ],
    },
};

export default SmltSmryRslt;
