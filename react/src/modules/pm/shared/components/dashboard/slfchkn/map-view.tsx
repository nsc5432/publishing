import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { TimelinePlayer } from '@/modules/pm/shared/components/timeline-player';
import { ViewModeToggle, type ViewMode } from '../view-mode-toggle';
import { CongestionDisplay } from '../congestion-display';
import { CONGESTION_LEVEL } from '../../../enums/congestion-level';
import { minToTime, timeToMin } from '@/lib/date-utils';
import type { CongestionStatus, SmrySlfchknDto, SmrySlfchknDtoWrapper } from '@/types/api.types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock, Users } from 'lucide-react';
import { calPrcsCnt, priorCgnStatus } from '@/lib/utils';

interface MapViewProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    onClickIsland: (island: string) => void;
    chknAllDatas: SmrySlfchknDtoWrapper
}

type RefineDataType = {
    [key: string]: { cgnStatus: CongestionWithEmptyStatus, wtngPsgCnt: number, prcsHr: number, wtngHr: number };
}

type CongestionWithEmptyStatus = CongestionStatus | 'EMPTY';

export function MapView({ viewMode, onViewModeChange, onClickIsland, chknAllDatas }: MapViewProps) {
    const [currentTime, setCurrentTime] = useState(0);
    const [chknData, setChknData] = useState<SmrySlfchknDto[]>([]);
    const [refineData, setRefineData] = useState<RefineDataType>({});

    useEffect(() => {
        const firstTime = timeToMin(Object.keys(chknAllDatas).sort((a, b) => a.localeCompare(b)).find(x => chknAllDatas[x].length > 0) || '0000');
        setCurrentTime(firstTime);
    }, [chknAllDatas]);


    useEffect(() => {
        setChknData(chknAllDatas[minToTime(currentTime)]);
    }, [currentTime]);

    useEffect(() => {
        if (!chknData || chknData.length === 0) {
            return;
        }

        const _refineData = {} as RefineDataType;

        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N'].forEach(island => {
            const filtered = chknData.filter(x => x.island === island);
            if (filtered.length === 0) {
                _refineData[island] = { cgnStatus: 'EMPTY', wtngPsgCnt: 0, prcsHr: 0, wtngHr: 0 };
            } else {
                const wtngPsgCntSum = filtered.reduce((a, c) => a + c.wtngPsgCnt, 0);
                const prcsHrMax = Math.max(...filtered.map(x => x.prcsHr));
                const wtngHrMax = Math.max(...filtered.map(x => x.wtngHr));
                _refineData[island] = { cgnStatus: priorCgnStatus(filtered.map(x => x.cgnStatus)), wtngPsgCnt: wtngPsgCntSum, prcsHr: prcsHrMax, wtngHr: wtngHrMax };
            }
        });

        setRefineData(_refineData);
    }, [chknData])

    // 하단 버튼(A~N) 색상 결정 함수
    const getIslandButtonColor = (cgnStatus: CongestionWithEmptyStatus) => {
        switch (cgnStatus) {
            case 'VERY_BUSY':
                return 'bg-red-500 hover:bg-red-600 text-white';
            case 'BUSY':
                return 'bg-orange-400 hover:bg-orange-500 text-white';
            case 'NORMAL':
                return 'bg-green-400 hover:bg-green-500 text-white';
            case 'FREE':
                return 'bg-cyan-400 hover:bg-cyan-500 text-white';
            default:
                return 'bg-gray-300 hover:bg-gray-500 text-white';
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-6">
                <Card className="p-8">
                    <div className="flex items-center justify-between mb-2">
                        <CongestionDisplay congestionLevel={CONGESTION_LEVEL.CONGESTED} info={''} />
                        <h2 className="text-2xl font-bold -ml-20">셀프체크인/백드롭</h2>
                        <ViewModeToggle
                            viewMode={viewMode}
                            onViewModeChange={onViewModeChange}
                            colorScheme="indigo"
                            inline
                        />
                    </div>

                    {/* Map Layout Grid */}
                    <div className="relative bg-gray-50 px-4 py-8 rounded-lg border-2 border-gray-200 min-h-125">
                        {/* Top Row Labels (E1-E4, M1-M4, W1-W4) */}
                        <div className="absolute top-4 left-0 right-0 grid grid-cols-12 gap-2 px-8">
                            {['E1', 'E2', 'E3', 'E4', 'M1', 'M2', 'M3', 'M4', 'W1', 'W2', 'W3', 'W4'].map((label) => (
                                <div
                                    key={label}
                                    className="text-center font-semibold text-sm text-gray-600"
                                >
                                    {label}
                                </div>
                            ))}
                        </div>

                        {/* Left Column Numbers (01-13) */}
                        <div className="absolute left-2 top-12 bottom-20 flex flex-col justify-between">
                            {Array.from({ length: 13 }, (_, i) => (
                                <div
                                    key={i}
                                    className="text-center font-semibold text-xs text-gray-600"
                                >
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                            ))}
                        </div>

                        {/* Grid Cells */}
                        <div className="mt-4 ml-8 grid grid-cols-12 gap-2 h-100">
                            {Array.from({ length: 156 }, (_, i) => (
                                <div key={i} className="border border-gray-200 bg-white"></div>
                            ))}
                        </div>

                        <div
                            className="absolute"
                            style={{ top: '180px', left: '8px', right: '8px' }}
                        >
                            <div className="flex justify-evenly">
                                {[6, 5, 4, 3, 2, 1].map((num) => (
                                    <div key={num} className={`w-14 h-14 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center bg-green-100 border border-green-300`}>
                                        {num}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-40 right-8 grid grid-cols-14 gap-1">
                            {['N', 'M', 'L', 'K', 'E', 'F', 'G', 'H', 'J', 'K', 'C', 'B', 'A'].map((island) => {
                                const [open, setOpen] = useState<boolean>(false);
                                return (
                                    <Popover key={island} open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger
                                            asChild
                                            onMouseEnter={() => { setOpen(true) }}
                                            onMouseLeave={() => { setOpen(false) }}
                                        >
                                            <button
                                                className={`h-10 flex items-center justify-center font-bold rounded transition-colors cursor-pointer ${getIslandButtonColor(refineData[island]?.cgnStatus)}`}
                                                disabled={refineData[island]?.cgnStatus === 'EMPTY'}
                                                onClick={() => onClickIsland(island)}
                                            >
                                                {island}
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-250"
                                            onMouseEnter={() => { setOpen(true) }}
                                            onMouseLeave={() => { setOpen(false) }}
                                        >
                                            <div className="space-y-3">
                                                <h3 className="font-bold text-center border-b pb-2">
                                                    {island} 시설 혼잡 현황
                                                </h3>

                                                <div className="grid grid-cols-4 gap-4 text-center">
                                                    <div className="space-y-2">
                                                        <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                                                            <Users className="h-6 w-6 text-destructive" />
                                                        </div>
                                                        <div className="text-2xl font-bold text-destructive">
                                                            {refineData[island]?.wtngPsgCnt}명
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">대기인원</div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                                                            <Clock className="h-6 w-6 text-muted-foreground" />
                                                        </div>
                                                        <div className="text-2xl font-bold">{refineData[island]?.wtngHr}초</div>
                                                        <div className="text-xs text-muted-foreground">대기시간</div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                                                            <Users className="h-6 w-6 text-muted-foreground" />
                                                        </div>
                                                        <div className="text-2xl font-bold">
                                                            {refineData[island]?.prcsHr === 0 ? 0 : calPrcsCnt(refineData[island]?.prcsHr)}명
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">처리인원</div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                                                            <Clock className="h-6 w-6 text-muted-foreground" />
                                                        </div>
                                                        <div className="text-2xl font-bold">{refineData[island]?.prcsHr}초</div>
                                                        <div className="text-xs text-muted-foreground">처리시간</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            </div>

            {/* TimelinePlayer */}
            <TimelinePlayer time={currentTime} onTimeChange={setCurrentTime} />
        </div>
    );
}
