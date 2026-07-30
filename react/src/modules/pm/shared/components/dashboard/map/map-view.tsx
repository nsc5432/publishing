import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users, Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { TimelinePlayer } from '@/modules/pm/shared/components/timeline-player';
import { CongestionDisplay } from '../congestion-display';
import { CONGESTION_LEVEL } from '../../../enums/congestion-level';
import { summaryService } from '@/api/pm/services/summary.service';
import type { CongestionStatus, SummaryMapDto, SummaryMapDtoWrapper } from '@/types/api.types';
import { minToTime } from '@/lib/date-utils';

interface MapViewProps {
    simulationKey: string;
}

export function MapView({ simulationKey }: MapViewProps) {
    const [currentTime, setCurrentTime] = useState(-1);
    const mapInfoRef = useRef<SummaryMapDtoWrapper>({});
    const [summaryMap, setSummaryMap] = useState<SummaryMapDto>({ scList: [], depList: [], chknList: [] });

    const islands = ['N', 'M', 'L', 'K', 'E', 'F', 'G', 'H', 'J', 'K', 'C', 'B', 'A'];
    const departureNumbers = ['6', '5', '4', '3', '2', '1']; // 출국장
    const securityNumbers = ['6', '5', '4', '3', '2', '1']; // 보안검색대

    useEffect(() => {
        searchSmryMapInfoApi(simulationKey, 'P01');
    }, [simulationKey]);

    useEffect(() => {
        const data = mapInfoRef.current[minToTime(currentTime)];

        if (!data) {
            setSummaryMap({ scList: [], depList: [], chknList: [] });
            return;
        }

        var cgn = ['FREE', 'NORMAL', 'BUSY', 'VERY_BUSY'];
        for (let i = 0; i < islands.length; i++) {
            const island = islands[i];
            data.chknList.push({
                island: island,
                cgnStatus: cgn[Math.floor(Math.random() * 4)] as CongestionStatus,
                wtngPsgCnt: Math.floor(((i + 1) * (currentTime + 1) * 33) % 29),
                prcsHr: Math.floor(((i + 1) * (currentTime + 1) * 33) % 39),
                wtngHr: Math.floor(((i + 1) * (currentTime + 1) * 33) % 31)
            })
        }

        setSummaryMap(data);
    }, [currentTime]);

    const searchSmryMapInfoApi = async (simulationKey: string, tmnlId: string) => {
        mapInfoRef.current = await summaryService.getSmryMapInfo(simulationKey, tmnlId);
        setCurrentTime(0);
    }

    const colorStatus = (status: (CongestionStatus | undefined)) => {
        if (status === 'FREE') {
            return 'bg-blue-300 text-blue-900';
        } else if (status === 'NORMAL') {
            return 'bg-emerald-300 text-emerald-900';
        } else if (status === 'BUSY') {
            return 'bg-orange-300 text-orange-900';
        } else if (status === 'VERY_BUSY') {
            return 'bg-red-300 text-red-900';
        }

        return 'bg-gray-300 text-gray-900';
    }

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="flex-1 p-6 space-y-2 overflow-auto">
                <Card className="p-4">
                    <CongestionDisplay congestionLevel={CONGESTION_LEVEL.VERY_SMOOTH} info={''} />
                </Card>

                <div className="relative bg-muted/20 rounded-lg p-4" style={{ minHeight: '600px' }}>
                    <div className="grid grid-cols-14 gap-2 mb-8">
                        {Array.from({ length: 10 }).map((_, rowIdx) => (
                            <div key={rowIdx} className="col-span-14 grid grid-cols-14 gap-2 h-12">
                                {Array.from({ length: 14 }).map((_, colIdx) => (
                                    <div key={colIdx} className="border border-muted bg-card" />
                                ))}
                            </div>
                        ))}
                    </div>
                    {/* 보안검색대 구역 - 상단 */}
                    <div className="absolute top-6 left-0 right-0 px-8">
                        <div className="flex justify-center items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-foreground">
                                보안검색대
                            </span>
                        </div>
                        <div className="flex justify-around items-center">
                            {securityNumbers.map((num) => {
                                const [open, setOpen] = useState<boolean>(false);
                                const scList = summaryMap.scList;
                                let sc = scList.find(x => x.scNum === num)

                                if (!sc) {
                                    sc = {
                                        scNum: num,
                                        cgnStatus: 'FREE',
                                        wtngPsgCnt: 0,
                                        prcsHr: 0,
                                        wtngHr: 0,
                                    }
                                }

                                return (
                                    <Popover key={`security-${num}`} open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger
                                            asChild
                                            onMouseEnter={() => { setOpen(true) }}
                                            onMouseLeave={() => { setOpen(false) }}
                                        >
                                            <button
                                                className={`w-14 h-14 rounded-lg font-bold text-xl transition-all hover:scale-110 ${colorStatus(sc.cgnStatus)}`}

                                            >
                                                {num}
                                            </button>
                                        </PopoverTrigger>
                                        {sc && (
                                            <PopoverContent
                                                className="w-80"
                                                onMouseEnter={() => { setOpen(true) }}
                                                onMouseLeave={() => { setOpen(false) }}
                                            >
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-semibold">
                                                            보안검색대 {num}번 혼잡 현황
                                                        </h3>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 text-center">
                                                        <div className="space-y-2">
                                                            <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                                                                <Users className="h-6 w-6 text-destructive" />
                                                            </div>
                                                            <div className="text-2xl font-bold text-destructive">
                                                                {sc.wtngPsgCnt}명
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                대기인원
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                                                                <Clock className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                            <div className="text-2xl font-bold">
                                                                {sc.wtngHr}초
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                대기시간
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        )}
                                    </Popover>
                                );
                            })}
                        </div>
                    </div>

                    {/* 출국장 구역 - 중간 */}
                    <div className="absolute top-60 -translate-y-1/2 left-0 right-0 px-8">
                        <div className="flex justify-center items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-foreground">출국장</span>
                        </div>
                        <div className="flex justify-around items-center">
                            {departureNumbers.map((num) => {
                                const [open, setOpen] = useState<boolean>(false);
                                const depList = summaryMap.depList;
                                let dep = depList.find(x => x.depNum === num)

                                if (!dep) {
                                    dep = {
                                        depNum: num,
                                        cgnStatus: 'FREE',
                                        wtngPsgCnt: 0,
                                        prcsHr: 0,
                                        wtngHr: 0,
                                    }
                                }

                                return (
                                    <Popover key={`departure-${num}`} open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger
                                            asChild
                                            onMouseEnter={() => { setOpen(true) }}
                                            onMouseLeave={() => { setOpen(false) }}
                                        >
                                            <button
                                                className={`w-16 h-16 rounded-lg font-bold text-2xl transition-all hover:scale-110 ${colorStatus(dep?.cgnStatus)}`}
                                            >
                                                {num}
                                            </button>
                                        </PopoverTrigger>
                                        {dep && (
                                            <PopoverContent
                                                className="w-80"
                                                onMouseEnter={() => { setOpen(true) }}
                                                onMouseLeave={() => { setOpen(false) }}
                                            >
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-semibold">
                                                            출국장 {num}번 혼잡 현황
                                                        </h3>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 text-center">
                                                        <div className="space-y-2">
                                                            <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                                                                <Users className="h-6 w-6 text-destructive" />
                                                            </div>
                                                            <div className="text-2xl font-bold text-destructive">
                                                                {dep.wtngPsgCnt}명
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                대기인원
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                                                                <Clock className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                            <div className="text-2xl font-bold">
                                                                {dep.wtngHr}초
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                대기시간
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        )}
                                    </Popover>
                                );
                            })}
                        </div>
                    </div>

                    {/* 체크인카운터 구역 - 하단 */}
                    <div className="absolute bottom-30 left-0 right-0 px-8">
                        <div className="flex justify-center items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-foreground">
                                체크인카운터
                            </span>
                        </div>
                        <div className="flex justify-around items-center">
                            {islands.map((island, idx) => {
                                const [open, setOpen] = useState<boolean>(false);
                                const counters = summaryMap.chknList;
                                let chkn = counters.find(x => x.island === island)

                                if (!chkn) {
                                    chkn = {
                                        island: island,
                                        cgnStatus: 'FREE',
                                        wtngPsgCnt: 0,
                                        prcsHr: 0,
                                        wtngHr: 0
                                    }
                                }

                                return (
                                    <Popover key={`counter-${island}-${idx}`} open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger
                                            asChild
                                            onMouseEnter={() => { setOpen(true) }}
                                            onMouseLeave={() => { setOpen(false) }}
                                        >
                                            <button
                                                className={`w-12 h-12 rounded-lg font-bold text-lg transition-all hover:scale-110 ${colorStatus(chkn.cgnStatus)}`}
                                            >
                                                {island}
                                            </button>
                                        </PopoverTrigger>
                                        {chkn && (
                                            <PopoverContent
                                                className="w-150 max-h-175 overflow-y-auto"
                                                onMouseEnter={() => { setOpen(true) }}
                                                onMouseLeave={() => { setOpen(false) }}
                                            >
                                                <div className="space-y-4">
                                                    {/* 헤더 */}
                                                    <div className="flex items-center justify-between border-b pb-3">
                                                        <h3 className="font-bold text-lg">
                                                            {island} 아일랜드
                                                        </h3>
                                                    </div>

                                                    {/* 상단 3개 시설 카드 */}
                                                    <div className="grid grid-cols-3 gap-4">
                                                        {/* 체크인카운터 */}
                                                        <div className="border rounded-lg p-3 text-center space-y-2">
                                                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded flex items-center justify-center">
                                                                <div className="text-3xl">✈️</div>
                                                            </div>
                                                            <div className="text-sm font-medium">
                                                                체크인카운터
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                (처리율 :{' '}{chkn.prcsHr}%)
                                                            </div>
                                                        </div>

                                                        {/* 셀프체크인 */}
                                                        <div className="border rounded-lg p-3 text-center space-y-2">
                                                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded flex items-center justify-center">
                                                                <div className="text-3xl">🖥️</div>
                                                            </div>
                                                            <div className="text-sm font-medium">
                                                                셀프체크인
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                (처리율 :{' '}{chkn.prcsHr}%)
                                                            </div>
                                                        </div>

                                                        {/* 상업시설 */}
                                                        <div className="border rounded-lg p-3 text-center space-y-2">
                                                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded flex items-center justify-center">
                                                                <div className="text-3xl">🏪</div>
                                                            </div>
                                                            <div className="text-sm font-medium">
                                                                상업시설
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                &nbsp;
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 시설 혼잡 현황 */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-base">
                                                                시설 혼잡 현황
                                                            </h4>
                                                            {(chkn.cgnStatus === 'BUSY' || chkn.cgnStatus === 'VERY_BUSY') && (
                                                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                                                                    혼잡
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-4 gap-3 text-center">
                                                            {/* 대기인원 */}
                                                            <div className="space-y-2">
                                                                <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                                                                    <Users className="h-6 w-6 text-purple-600" />
                                                                </div>
                                                                <div className="text-2xl font-bold text-red-600">
                                                                    {chkn.wtngPsgCnt}명
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    대기인원
                                                                </div>
                                                            </div>

                                                            {/* 대기시간 */}
                                                            <div className="space-y-2">
                                                                <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                                                                    <Clock className="h-6 w-6 text-gray-600" />
                                                                </div>
                                                                <div className="text-2xl font-bold text-red-600">
                                                                    {chkn.wtngHr}초
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    대기시간
                                                                </div>
                                                            </div>

                                                            {/* 처리인원 */}
                                                            <div className="space-y-2">
                                                                <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                                                                    <Users className="h-6 w-6 text-purple-600" />
                                                                </div>
                                                                <div className="text-2xl font-bold">
                                                                    {chkn.prcsHr === 0 ? 0 : Math.round(600 / chkn.prcsHr)}명
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    처리인원
                                                                </div>
                                                            </div>

                                                            {/* 처리시간 */}
                                                            <div className="space-y-2">
                                                                <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                                                                    <Clock className="h-6 w-6 text-gray-600" />
                                                                </div>
                                                                <div className="text-2xl font-bold">
                                                                    {chkn.prcsHr}초
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    처리시간
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 매출 정보 */}
                                                    <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                                            <div className="flex items-center justify-between border-r pr-3">
                                                                <span className="text-blue-600 border border-blue-600 rounded px-2 py-1 text-xs">
                                                                    총 매출
                                                                </span>
                                                                <span className="font-medium">
                                                                    {Math.round(Math.random() * 50000000).toLocaleString()}
                                                                    원
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between pl-3">
                                                                <span className="text-blue-600 border border-blue-600 rounded px-2 py-1 text-xs">
                                                                    상업시설 수
                                                                </span>
                                                                <span className="font-medium">
                                                                    {Math.round(Math.random() * 10)}개
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between text-sm border-t pt-3">
                                                            <span className="text-blue-600 border border-blue-600 rounded px-2 py-1 text-xs">
                                                                인원대비 매출
                                                            </span>
                                                            <span className="font-medium">
                                                                {Math.round(Math.random() * 50000).toLocaleString()}
                                                                원
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between text-sm border-t pt-3">
                                                            <span className="text-blue-600 border border-blue-600 rounded px-2 py-1 text-xs">
                                                                매출 인원 증감
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">
                                                                    {Math.round(Math.random() * 100)}명
                                                                </span>
                                                                <span className="text-blue-600 flex items-center">
                                                                    ▲ {Math.round(Math.random() * 20)}% vs
                                                                    2023
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* 상세보기 버튼 */}
                                                    {/* <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                                        <span>+</span>
                                                        <span>상세보기</span>
                                                    </button> */}
                                                </div>
                                            </PopoverContent>
                                        )}
                                    </Popover>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* TimelinePlayer */}
            <TimelinePlayer time={currentTime} onTimeChange={setCurrentTime} />
        </div>
    );
}
