import { useEffect, useState } from "react";
import type { ViewMode } from "../view-mode-toggle";
import { DashboardHeader } from "./dashboard-header";
import { MapView } from "./map-view";
import { TableView } from "./table-view";
import { ChartView } from "./chart-view";
import type { SimulationType } from "../airport-dashboard";
import type { SmryDepDto, SmryDepDtoWrapper } from "@/types/api.types";
import { times } from "@/lib/date-utils";
import { DepService } from "@/api/pm/services/dep.service";

interface CongestionSearchProps {
    simulationType: SimulationType;
    simulationKey: string;
}

export type DepType = SmryDepDto & { time: string };

const timeArr = times();

export default function CongestionSearch({ simulationType, simulationKey }: CongestionSearchProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('map');
    const [tmnlId, setTmnlId] = useState<string>('P01');
    const [depAllDatas, setDepAllDatas] = useState<SmryDepDtoWrapper>({});
    const [selectedDepNum, setSelectedDepNum] = useState<string>('1');
    const [selectedDep, setSelectedDep] = useState<DepType[]>([]);

    useEffect(() => {
        const _selectedDep = timeArr.reduce((a: SmryDepDto[], time: string) => {
            const data = depAllDatas[time];

            if (data?.length > 0) {
                a.push(...data.filter(x => x.depNum === selectedDepNum).map(x => ({ ...x, time })));
            }

            return a as DepType[];
        }, []);

        setSelectedDep(_selectedDep);
    }, [selectedDepNum, depAllDatas])

    const onClickSearch = async (tmnlId: string) => {
        setTmnlId(tmnlId);
        const _depAllDatas = await DepService.retrieveDepGroupByTime(simulationKey, tmnlId);
        setDepAllDatas(_depAllDatas);
    }

    const onClickDep = (depNum: string) => {
        setSelectedDepNum(depNum);
    }

    return (
        <div className="flex flex-col h-full">
            <DashboardHeader simulationType={simulationType} onClickSearch={onClickSearch} />
            {viewMode === 'map' && <MapView viewMode={viewMode} onViewModeChange={setViewMode} tmnlId={tmnlId} depAllDatas={depAllDatas} onClickDep={onClickDep} />}
            {viewMode === 'table' && <TableView viewMode={viewMode} onViewModeChange={setViewMode} tmnlId={tmnlId} depAllDatas={depAllDatas} />}
            {viewMode === 'chart' && <ChartView viewMode={viewMode} onViewModeChange={setViewMode} tmnlId={tmnlId} selectedDepNum={selectedDepNum} selectedDep={selectedDep} />}
        </div>
    )
}

export const gen = (v: number) => {
    const _depAllDatas: SmryDepDtoWrapper = {};

    for (let h = 0; h < 24; h++) {
        const hour = String(h).padStart(2, '0');
        _depAllDatas[hour + '00'] = mock((Number(hour) + 1) * 2 * v + 1);
        _depAllDatas[hour + '30'] = mock((Number(hour) + 1) * 3 * v + 2);
    }

    return _depAllDatas;
}

const mock = (num: number) => Array.from({ length: 6 }, (_, index) => {
    const wtngPsgCnt = Math.ceil((index + 1) * num * 33 % 43);

    return {
        depNum: String(index + 1),
        cgnStatus: wtngPsgCnt < 10 ? 'FREE' : wtngPsgCnt < 20 ? 'NORMAL' : wtngPsgCnt < 30 ? 'BUSY' : 'VERY_BUSY',
        isOpen: true,
        wtngPsgCnt: wtngPsgCnt,
        prcsHr: Math.ceil((index + 1) * 32 % 43),
        wtngHr: Math.ceil((index + 1) * 31 % 43),
    }
}) as SmryDepDto[];