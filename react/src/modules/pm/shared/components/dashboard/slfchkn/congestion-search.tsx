import { useEffect, useState } from "react";
import type { ViewMode } from "../view-mode-toggle";
import { DashboardHeader } from "./dashboard-header";
import { TableView } from "./table-view";
import { MapView } from "./map-view";
import { ChartView } from "./chart-view";
import type { SimulationType } from "../airport-dashboard";
import type { SmrySlfchknDto, SmrySlfchknDtoWrapper } from "@/types/api.types";
import { times } from "@/lib/date-utils";
import { SlfchknService } from "@/api/pm/services/slfchkn.service";

interface CongestionSearchProps {
    simulationType: SimulationType;
    simulationKey: string;
}


export type ChknType = SmrySlfchknDto & { time: string };

const timeArr = times();

export default function CongestionSearch({ simulationType, simulationKey }: CongestionSearchProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('map');
    const [tmnlId, setTmnlId] = useState<string>('P01');
    const [island, setChknSection] = useState<string>('A');
    const [chknAllDatas, setChknAllDatas] = useState<SmrySlfchknDtoWrapper>({});
    const [selectedChkn, setSelectedChkn] = useState<ChknType[]>([]);

    useEffect(() => {
        const _selectedChkn = timeArr.reduce((a: SmrySlfchknDto[], time: string) => {
            const data = chknAllDatas[time];

            if (data?.length > 0) {
                a.push(...data.filter(x => x.island === island).map(x => ({ ...x, time })));
            }

            return a as ChknType[];
        }, []);

        setSelectedChkn(_selectedChkn);
    }, [island, chknAllDatas]);

    const onSearch = async (tmnlId: string) => {
        setTmnlId(tmnlId);
        const _chknAllDatas = await SlfchknService.retrieveSlfchknGroupByTime(simulationKey, tmnlId);
        setChknAllDatas(_chknAllDatas);
    }

    const onClickIsland = (island: string) => {
        setChknSection(island);
        setViewMode('chart');
    }

    return (
        <div className="flex flex-col h-full">
            <DashboardHeader simulationType={simulationType} onClickSearch={onSearch} />
            {viewMode === 'map' && <MapView viewMode={viewMode} onViewModeChange={setViewMode} onClickIsland={onClickIsland} chknAllDatas={chknAllDatas} />}
            {viewMode === 'table' && <TableView viewMode={viewMode} onViewModeChange={setViewMode} chknAllDatas={chknAllDatas} />}
            {viewMode === 'chart' && <ChartView viewMode={viewMode} onViewModeChange={setViewMode} island={island} currentChkn={selectedChkn} tmnlId={tmnlId} />}
        </div>
    )
}