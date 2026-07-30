import { Card } from '@/components/ui/card';
import { ViewModeToggle, type ViewMode } from '../view-mode-toggle';
import { terminal } from '../../../utils/convert';
import { formatTime, times } from '@/lib/date-utils';
import { calPrcsCnt } from '@/lib/utils';
import type { SmryDepDtoWrapper } from '@/types/api.types';

interface TableViewProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    tmnlId: string;
    depAllDatas: SmryDepDtoWrapper;
}

const timeArr = times();

export function TableView({ viewMode, onViewModeChange, tmnlId, depAllDatas }: TableViewProps) {
    return (
        <div className="p-6">
            <Card className="p-6 mb-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{terminal(tmnlId)} 출국장</h2>
                    <ViewModeToggle
                        viewMode={viewMode}
                        onViewModeChange={onViewModeChange}
                        colorScheme="green"
                        inline
                    />
                </div>
            </Card>
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <div style={{ minWidth: `${100 + timeArr.length * 150}px` }}>
                        {/* Header */}
                        <div
                            className="border-b sticky top-0 z-10 bg-background"
                            style={{ display: 'grid', gridTemplateColumns: `100px repeat(${timeArr.length}, 150px)` }}
                        >
                            <div className="p-3 font-medium border-r flex items-center justify-center">
                                출국장 번호
                            </div>
                            {timeArr.map((time) => (
                                <div key={time} className="border-r last:border-r-0 p-3">
                                    <div className="text-center font-medium">
                                        {formatTime(time)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="overflow-y-auto [scrollbar-gutter:stable] max-h-[calc(100vh-400px)]">
                            {/* Data rows */}
                            {depAllDatas && Array.from({ length: tmnlId === 'P01' ? 6 : 2 }, (_, i) => (
                                <div
                                    key={`table-row-${i}`}
                                    className="border-b hover:bg-muted/10 h-30"
                                    style={{ display: 'grid', gridTemplateColumns: `100px repeat(${timeArr.length}, 150px)` }}
                                >
                                    <div className="p-3 font-medium border-r flex items-center justify-center bg-muted/20">
                                        {`${i + 1} 번 출국장`}
                                    </div>
                                    {timeArr.map((time) => {
                                        const target = depAllDatas[time].find(x => x.depNum === String(i + 1));

                                        return (
                                            <div key={time} className="border-r last:border-r-0 flex justify-center items-center">
                                                <div className={`p-2 text-xs`}>
                                                    <div className="space-y-0.5 text-[10px] leading-tight text-center">
                                                        <div>처리 여객 : {!target ? 0 : calPrcsCnt(target.prcsHr)}명</div>
                                                        <div>처리 시간 : {!target ? 0 : target.prcsHr}초</div>
                                                        <div>대기 여객 : {!target ? 0 : target.wtngPsgCnt}명</div>
                                                        <div>대기 시간 : {!target ? 0 : target.wtngHr}초</div>
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
            </Card>
        </div>
    );
}
