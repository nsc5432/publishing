import { Card } from '@/components/ui/card';
import { ViewModeToggle, type ViewMode } from '../view-mode-toggle';
import { formatTime } from '@/lib/date-utils';
import type { SmryChknAlnDtoWrapper } from '@/types/api.types';
import { useEffect, useState } from 'react';
import { calPrcsCnt } from '@/lib/utils';


interface TableViewProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    island: string;
    chknDatas: SmryChknAlnDtoWrapper;
}

export function TableView({ viewMode, onViewModeChange, island, chknDatas }: TableViewProps) {
    const [times, setTimes] = useState<string[]>([]);
    const [counters, setCounters] = useState<number[]>([]);

    useEffect(() => {
        const _times = Object.keys(chknDatas).sort((a, b) => a.localeCompare(b)).filter(x => chknDatas[x].length > 0);
        setTimes(_times);

        const _counters = new Set<number>();
        _times.forEach(time => {
            const chknData = chknDatas[time];
            chknData.forEach(x => {
                _counters.add(x.counterNum);
            })
        });

        setCounters([..._counters].sort((a, b) => a - b));
    }, [chknDatas]);

    return (
        <div className="p-6">
            <Card className="p-6 mb-4">
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
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <div style={{ minWidth: `${100 + times.length * 250}px` }}>
                        {/* Header */}
                        <div
                            className="border-b sticky top-0 z-10 bg-background"
                            style={{ display: 'grid', gridTemplateColumns: `100px repeat(${times.length}, 250px)` }}
                        >
                            <div className="p-3 font-medium border-r flex items-center justify-center">
                                번호
                            </div>
                            {times.map((time) => (
                                <div key={time} className="border-r last:border-r-0">
                                    <div className="text-center font-medium p-2 border-b">
                                        {formatTime(time)}
                                    </div>
                                    <div className="grid grid-cols-2">
                                        <div className="text-xs text-muted-foreground p-2 text-center border-r">
                                            좌측
                                        </div>
                                        <div className="text-xs text-muted-foreground p-2 text-center">
                                            우측
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="overflow-y-auto [scrollbar-gutter:stable] max-h-[calc(100vh-400px)]">
                            {/* Data rows */}
                            {chknDatas && counters.map(i => (
                                <div
                                    key={`table-row-${i}`}
                                    className="border-b hover:bg-muted/10"
                                    style={{ display: 'grid', gridTemplateColumns: `100px repeat(${times.length}, 250px)` }}
                                >
                                    <div className="p-3 font-medium border-r flex items-center justify-center bg-muted/20">
                                        {`${i} 번 구역`}
                                    </div>
                                    {times.map((time) => {
                                        const target1 = chknDatas[time].find(x => x.counterNum === i + 18);
                                        const target2 = chknDatas[time].find(x => x.counterNum === i);

                                        return (
                                            <div key={time} className="border-r last:border-r-0">
                                                <div className="grid grid-cols-2 h-full">
                                                    {/* 좌측 */}
                                                    <div className={`p-2 border-r text-xs`}>
                                                        <div className="space-y-0.5 text-[10px] leading-tight text-center">
                                                            <div>처리 여객 : {!target1 ? 0 : calPrcsCnt(target1.prcsHr)}명</div>
                                                            <div>처리 시간 : {!target1 ? 0 : target1.prcsHr}초</div>
                                                            <div>대기 여객 : {!target1 ? 0 : target1.wtngPsgCnt}명</div>
                                                            <div>대기 시간 : {!target1 ? 0 : target1.wtngHr}초</div>
                                                        </div>
                                                    </div>
                                                    {/* 우측 */}
                                                    <div className={`p-2 text-xs`}>
                                                        <div className="space-y-0.5 text-[10px] leading-tight text-center">
                                                            <div>처리 여객 : {!target2 ? 0 : calPrcsCnt(target2.prcsHr)}명</div>
                                                            <div>처리 시간 : {!target2 ? 0 : target2.prcsHr}초</div>
                                                            <div>대기 여객 : {!target2 ? 0 : target2.wtngPsgCnt}명</div>
                                                            <div>대기 시간 : {!target2 ? 0 : target2.wtngHr}초</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card >
        </div >
    );
}
