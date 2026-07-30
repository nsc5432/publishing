import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users, Clock } from 'lucide-react';
import { TimelinePlayer } from '@/modules/pm/shared/components/timeline-player';
import { useEffect, useState } from 'react';

import { ViewModeToggle, type ViewMode } from '../view-mode-toggle';
import { CongestionDisplay } from '../congestion-display';
import { CONGESTION_LEVEL } from '../../../enums/congestion-level';
import type { CongestionStatus, SmryChknAlnDto, SmryChknAlnDtoWrapper } from '@/types/api.types';
import { minToTime, timeToMin } from '@/lib/date-utils';
import { calPrcsCnt } from '@/lib/utils';

interface MapViewProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    island: string;
    chknDatas: SmryChknAlnDtoWrapper;
}

export function MapView({ viewMode, onViewModeChange, island, chknDatas }: MapViewProps) {
    const [currentTime, setCurrentTime] = useState(0);
    const [chknData, setChknData] = useState<SmryChknAlnDto[]>([]);

    useEffect(() => {
        const firstTime = timeToMin(Object.keys(chknDatas).sort((a, b) => a.localeCompare(b)).find(x => chknDatas[x].length > 0) || '0000');
        setCurrentTime(firstTime);
    }, [chknDatas]);

    useEffect(() => {
        setChknData(chknDatas[minToTime(currentTime)]);
    }, [currentTime]);

    const getStatusColor = (cgnStatus: (CongestionStatus | 'empty')) => {
        switch (cgnStatus) {
            case 'FREE':
                return 'bg-cyan-400';
            case 'NORMAL':
                return 'bg-green-400';
            case 'BUSY':
                return 'bg-orange-600';
            case 'VERY_BUSY':
                return 'bg-red-600';
            default:
                return 'bg-card text-card-foreground border bg-gray-300';
        }
    };

    const onClickCounter = () => {
        onViewModeChange('chart');
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-6">
                <Card className="p-8">
                    <div className="flex items-center justify-between mb-2">
                        <CongestionDisplay congestionLevel={CONGESTION_LEVEL.SMOOTH} info={''} />
                        <h2 className="text-2xl font-bold -ml-20">체크인카운터 {island}</h2>
                        <ViewModeToggle
                            viewMode={viewMode}
                            onViewModeChange={onViewModeChange}
                            colorScheme="orange"
                            inline
                        />
                    </div>

                    {/* Map Layout Grid */}
                    <div className="relative bg-gray-50 pl-8 py-8 rounded-lg border-2 border-gray-200 min-h-125 flex flex-col justify-center">
                        <div className="space-y-2">
                            <CounterRow
                                leftRight={'left'}
                                data={chknData?.filter(x => 18 < x.counterNum && x.counterNum <= 36)}
                                getStatusColor={getStatusColor}
                                onClickCounter={onClickCounter}
                            />
                            <div
                                className="grid gap-1 mb-2 w-full"
                                style={{ gridTemplateColumns: `auto repeat(19, 1fr)` }}
                            >
                                <div className="font-medium text-sm flex items-center justify-center">
                                    <span>진입</span><span className="text-2xl">🚶‍♂️‍➡️→</span>
                                </div>
                                {Array.from({ length: 18 }, (_, i) => (
                                    <div
                                        key={i + 1}
                                        className="h-12 flex items-center justify-center text-sm font-medium border rounded bg-white"
                                    >
                                        {i + 1}
                                    </div>
                                ))}
                                <div className="font-medium text-sm ml-2 relative bottom-2">
                                    <span>출국장</span><br /><span className="text-2xl">🚶‍♂️‍➡️→</span>
                                </div>
                            </div>
                            <CounterRow
                                leftRight={'right'}
                                data={chknData?.filter(x => 0 < x.counterNum && x.counterNum <= 18)}
                                getStatusColor={getStatusColor}
                                onClickCounter={onClickCounter}
                            />
                        </div>
                    </div>
                </Card>
            </div>

            <TimelinePlayer time={currentTime} onTimeChange={setCurrentTime} />
        </div>
    );
}

interface CounterRowProps {
    leftRight: 'left' | 'right';
    data: SmryChknAlnDto[];
    getStatusColor: (status: CongestionStatus | 'empty') => string;
    onClickCounter: () => void;
}

function CounterRow({ leftRight, data, getStatusColor, onClickCounter }: CounterRowProps) {
    return (
        <div
            className="grid gap-1 mb-2 w-full"
            style={{ gridTemplateColumns: `auto repeat(19, 1fr)` }}
        >
            <div className="font-medium text-sm flex items-center justify-center pr-14">{leftRight === 'left' ? '좌측' : '우측'}</div>
            {
                Array.from({ length: 18 }, (_, index) => {
                    const counterNum = (leftRight === 'right' ? index : index + 18) + 1;
                    const counter = data?.find(x => x.counterNum === counterNum);
                    const [open, setOpen] = useState<boolean>(false);

                    if (!counter) {
                        return (
                            <button className={`h-12 text-sm font-medium rounded transition-all hover:opacity-80 ${getStatusColor('empty')}`}>
                                N/A
                            </button>
                        )
                    } else {
                        return (
                            <Popover key={`${counter.island}_${counter.counterNum}_${index}`} open={open} onOpenChange={setOpen}>
                                <PopoverTrigger
                                    asChild
                                    onMouseEnter={() => { setOpen(true) }}
                                    onMouseLeave={() => { setOpen(false) }}
                                >
                                    <button
                                        className={`h-12 text-sm font-medium rounded transition-all hover:opacity-80 ${getStatusColor(counter.cgnStatus)}`}
                                        onClick={onClickCounter}
                                    >
                                        {counter.alnCd} ({counter.counterNum})
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-250"
                                    onMouseEnter={() => { setOpen(true) }}
                                    onMouseLeave={() => { setOpen(false) }}
                                >
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-center border-b pb-2">
                                            체크인카운터 {counter.island} 시설 혼잡 현황
                                        </h3>

                                        <div className="grid grid-cols-4 gap-4 text-center">
                                            <div className="space-y-2">
                                                <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                                                    <Users className="h-6 w-6 text-destructive" />
                                                </div>
                                                <div className="text-2xl font-bold text-destructive">
                                                    {counter.wtngPsgCnt}명
                                                </div>
                                                <div className="text-xs text-muted-foreground">대기인원</div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                                                    <Clock className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <div className="text-2xl font-bold">{counter.wtngHr}초</div>
                                                <div className="text-xs text-muted-foreground">대기시간</div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                                                    <Users className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <div className="text-2xl font-bold">
                                                    {counter.prcsHr === 0 ? 0 : calPrcsCnt(counter.prcsHr)}명
                                                </div>
                                                <div className="text-xs text-muted-foreground">처리인원</div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                                                    <Clock className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <div className="text-2xl font-bold">{counter.prcsHr}초</div>
                                                <div className="text-xs text-muted-foreground">처리시간</div>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        );
                    }
                })
            }
        </div>
    );
}