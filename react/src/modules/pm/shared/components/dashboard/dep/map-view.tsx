import { Card } from '@/components/ui/card';
import { TimelinePlayer } from '@/modules/pm/shared/components/timeline-player';
import { useEffect, useState } from 'react';
import { Users, Clock } from 'lucide-react';
import { ViewModeToggle, type ViewMode } from '../view-mode-toggle';
import { CongestionDisplay } from '../congestion-display';
import { CONGESTION_LEVEL } from '../../../enums/congestion-level';
import { cgnStatus, terminal } from '../../../utils/convert';
import type { CongestionStatus, SmryDepDto, SmryDepDtoWrapper } from '@/types/api.types';
import { minToTime } from '@/lib/date-utils';
import { calPrcsCnt } from '@/lib/utils';

interface MapViewProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    tmnlId: string;
    depAllDatas: SmryDepDtoWrapper;
    onClickDep: (depNum: string) => void;
}

export function MapView({ viewMode, onViewModeChange, tmnlId, depAllDatas, onClickDep }: MapViewProps) {
    const [currentTime, setCurrentTime] = useState(0);
    const [depData, setDepData] = useState<SmryDepDto[]>([]);

    useEffect(() => {
        const _depData = depAllDatas[minToTime(currentTime)]
        _depData && setDepData(_depData);
    }, [depAllDatas, currentTime]);

    const depColor = (cgnStatus: CongestionStatus) => {
        switch (cgnStatus) {
            case 'FREE':
                return 'bg-cyan-400';
            case 'NORMAL':
                return 'bg-green-400';
            case 'BUSY':
                return 'bg-orange-400';
            case 'VERY_BUSY':
                return 'bg-red-600';
            default:
                return 'bg-card text-card-foreground border';
        }
    }

    const _onClickDep = (depNum: string) => {
        onClickDep(depNum);
        onViewModeChange('chart');
    }

    const renderGate = (gate: SmryDepDto | undefined, gateNum: number) => gate ? (
        <div key={gateNum} className="relative" onClick={() => _onClickDep(gate.depNum)}>
            <div
                className={`w-38 h-72 rounded-lg shadow-xl flex flex-col items-center cursor-pointer transition-all hover:scale-105 border-2 bg-white border-gray-300`}
            >
                {/* Header */}
                <div className="w-full bg-gray-100 py-2 px-3 rounded-t-lg border-b border-gray-300 ">
                    <div className="text-sm font-bold text-gray-800 text-center">
                        출국장 {gate.depNum}
                    </div>
                </div>

                {/* Status Badge */}
                <div className="mt-3 mb-2">
                    <div
                        className={`px-4 py-1 rounded text-xs font-bold text-white ${depColor(gate.cgnStatus)}`}
                    >
                        {cgnStatus(gate.cgnStatus)}
                    </div>
                </div>

                {/* Stats Grid - 2x2 layout */}
                <div className="grid grid-cols-2 gap-4 px-3 py-4 w-full">
                    {/* Wait People */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-1">
                            <Users className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="text-lg font-bold text-red-600">
                            {gate.wtngPsgCnt}명
                        </div>
                        <div className="text-[9px] text-gray-600">대기인원</div>
                    </div>

                    {/* Wait Time */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-1">
                            <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="text-lg font-bold text-red-600">
                            {gate.wtngHr}초
                        </div>
                        <div className="text-[9px] text-gray-600">대기시간</div>
                    </div>

                    {/* Processed People */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-1">
                            <Users className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="text-sm font-bold text-gray-700">
                            {gate.prcsHr === 0 ? 0 : calPrcsCnt(gate.prcsHr)}명
                        </div>
                        <div className="text-[9px] text-gray-600">처리인원</div>
                    </div>

                    {/* Process Time */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-1">
                            <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="text-sm font-bold text-gray-700">
                            {gate.prcsHr}초
                        </div>
                        <div className="text-[9px] text-gray-600">처리시간</div>
                    </div>
                </div>
            </div>
        </div>
    ) : (
        <div key={gateNum} className="relative">
            <div
                className={`w-36 h-72 rounded-lg shadow-xl flex flex-col items-center cursor-pointer transition-all hover:scale-105 border-2 bg-white border-gray-300`}
            >
                {/* Header */}
                <div className="w-full bg-gray-100 py-2 px-3 rounded-t-lg border-b border-gray-300 ">
                    <div className="text-sm font-bold text-gray-800 text-center">
                        출국장 {gateNum}
                    </div>
                </div>

                {/* Status Badge */}
                <div className="mt-3 mb-2">
                    <div
                        className={`px-4 py-1 rounded text-xs font-bold text-white bg-gray-600`}
                    >
                        미운영
                    </div>
                </div>

                {/* Stats Grid - 2x2 layout */}
                <div className="grid grid-cols-2 gap-4 px-3 py-4 w-full">
                    {/* Wait People */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-1">
                            <Users className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="text-lg font-bold text-red-600">
                            {0}명
                        </div>
                        <div className="text-[9px] text-gray-600">대기인원</div>
                    </div>

                    {/* Wait Time */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-1">
                            <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="text-lg font-bold text-red-600">
                            {0}초
                        </div>
                        <div className="text-[9px] text-gray-600">대기시간</div>
                    </div>

                    {/* Processed People */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-1">
                            <Users className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="text-sm font-bold text-gray-700">
                            {0}명
                        </div>
                        <div className="text-[9px] text-gray-600">처리인원</div>
                    </div>

                    {/* Process Time */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-1">
                            <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="text-sm font-bold text-gray-700">
                            {0}초
                        </div>
                        <div className="text-[9px] text-gray-600">처리시간</div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-6">
                <Card className="p-8">
                    <div className="flex items-center justify-between mb-2">
                        <CongestionDisplay congestionLevel={CONGESTION_LEVEL.VERY_CONGESTED} info={''} />
                        <h2 className="text-2xl font-bold -ml-20">{terminal(tmnlId)} 출국장</h2>
                        <ViewModeToggle
                            viewMode={viewMode}
                            onViewModeChange={onViewModeChange}
                            colorScheme="green"
                            inline
                        />
                    </div>

                    <div className="relative bg-gray-50 p-8 rounded-lg border-2 border-gray-200 min-h-150">
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
                        <div className="absolute left-2 top-20 bottom-20 flex flex-col justify-between">
                            {Array.from({ length: 13 }, (_, i) => (
                                <div
                                    key={i}
                                    className="text-center font-semibold text-xs text-gray-600"
                                >
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                            ))}
                        </div>
                        <div className="mt-12 ml-8 grid grid-cols-12 gap-2 h-112.5">
                            {Array.from({ length: 156 }, (_, i) => (
                                <div key={i} className="border border-gray-200 bg-white"></div>
                            ))}
                        </div>
                        <div className="absolute top-16 left-8 right-8" style={{ height: '420px' }}>
                            <div className="relative w-full h-full">
                                {
                                    tmnlId === 'P01' && (
                                        <>
                                            <div className="absolute" style={{ left: '8%', top: '150px' }}>
                                                {renderGate(depData.find(x => x.depNum === '6'), 6)}
                                            </div>
                                            <div className="absolute" style={{ left: '23%', top: '50px' }}>
                                                {renderGate(depData.find(x => x.depNum === '5'), 5)}
                                            </div>
                                            <div className="absolute" style={{ left: '38%', top: '0px' }}>
                                                {renderGate(depData.find(x => x.depNum === '4'), 4)}
                                            </div>
                                            <div className="absolute" style={{ left: '56%', top: '0px' }}>
                                                {renderGate(depData.find(x => x.depNum === '3'), 3)}
                                            </div>
                                            <div className="absolute" style={{ left: '70%', top: '50px' }}>
                                                {renderGate(depData.find(x => x.depNum === '2'), 2)}
                                            </div>
                                            <div className="absolute" style={{ left: '84%', top: '150px' }}>
                                                {renderGate(depData.find(x => x.depNum === '1'), 1)}
                                            </div>
                                        </>
                                    )
                                }
                                {
                                    tmnlId === 'P03' && (
                                        <>
                                            <div className="absolute" style={{ left: '35%', top: '0px' }}>
                                                {renderGate(depData.find(x => x.depNum === '2'), 2)}
                                            </div>
                                            <div className="absolute" style={{ left: '52%', top: '0px' }}>
                                                {renderGate(depData.find(x => x.depNum === '1'), 1)}
                                            </div>
                                        </>
                                    )
                                }

                            </div>
                        </div>

                        {/* Bottom Row Letters (N, M, L, K, E, F, G, H, J, K, C, B, A) */}
                        <div className="absolute bottom-2 left-8 right-8 grid grid-cols-14 gap-1">
                            {['N', 'M', 'L', 'K', 'E', 'F', 'G', 'H', 'J', 'K', 'C', 'B', 'A'].map((label) => {
                                return (
                                    <div
                                        key={label}
                                        className={`h-8 flex items-center justify-center font-bold text-white rounded`}
                                    >
                                        {label}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            </div>
            <TimelinePlayer time={currentTime} onTimeChange={setCurrentTime} />
        </div>
    );
}
