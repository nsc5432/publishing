import { Card } from '@/components/ui/card';
import { ViewModeToggle, type ViewMode } from '../view-mode-toggle';;
import { formatTime } from '@/lib/date-utils';
import { calPrcsCnt } from '@/lib/utils';
import type { SmrySlfchknDtoWrapper } from '@/types/api.types';
import { useEffect, useState } from 'react';

interface TableViewProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    chknAllDatas: SmrySlfchknDtoWrapper;
}

export function TableView({ viewMode, onViewModeChange, chknAllDatas }: TableViewProps) {
    const [times, setTimes] = useState<string[]>([]);
    const [islands, setIslands] = useState<string[]>([]);

    useEffect(() => {
        const _times = Object.keys(chknAllDatas).sort((a, b) => a.localeCompare(b)).filter(x => chknAllDatas[x].some(y => y.wtngPsgCnt > 0));
        setTimes(_times);

        const _islands = new Set<string>();
        _times.forEach(time => {
            const chknData = chknAllDatas[time];
            chknData.forEach(x => {
                _islands.add(x.island);
            })
        });

        setIslands([..._islands].sort((a, b) => a.localeCompare(b)));
    }, [chknAllDatas]);

    return (
        <div className="p-6">
            <Card className="p-6 mb-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">셀프체크인/백드롭</h2>
                    <ViewModeToggle
                        viewMode={viewMode}
                        onViewModeChange={onViewModeChange}
                        colorScheme="indigo"
                        inline
                    />
                </div>
            </Card>
            <Card className="p-0 overflow-hidden">
                <div className="overflow-auto max-h-[calc(100vh-300px)]">
                    <div style={{ minWidth: `${100 + times.length * 250}px` }} className="pb-10">
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
                                            키오스크
                                        </div>
                                        <div className="text-xs text-muted-foreground p-2 text-center">
                                            셀프백드롭
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Data rows */}
                        {islands.map(island =>
                            <div
                                key={`table-row-${island}`}
                                className="border-b hover:bg-muted/10"
                                style={{ display: 'grid', gridTemplateColumns: `100px repeat(${times.length}, 250px)` }}
                            >
                                <div className="p-3 font-medium border-r flex items-center justify-center bg-muted/20">
                                    {`${island} 아일랜드`}
                                </div>
                                {
                                    times.map((time) => {
                                        const target1 = chknAllDatas[time].find(x => x.island === island && x.type === 'KIOSK');
                                        const target2 = chknAllDatas[time].find(x => x.island === island && x.type === 'SBD');

                                        return (
                                            <div key={time} className="border-r last:border-r-0">
                                                <div className="grid grid-cols-2 h-full">
                                                    {/* 키오스크 */}
                                                    <div className={`p-2 border-r text-xs`}>
                                                        <div className="space-y-0.5 text-[10px] leading-tight text-center">
                                                            <div>처리 여객 : {!target1 ? 0 : calPrcsCnt(target1.prcsHr)}명</div>
                                                            <div>처리 시간 : {!target1 ? 0 : target1.prcsHr}초</div>
                                                            <div>대기 여객 : {!target1 ? 0 : target1.wtngPsgCnt}명</div>
                                                            <div>대기 시간 : {!target1 ? 0 : target1.wtngHr}초</div>
                                                        </div>
                                                    </div>
                                                    {/* 셀프백드롭 */}
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
                                    })
                                }
                            </div>
                        )}
                    </div>
                </div>
            </Card >
        </div >
    );
}
