import { useState } from "react";
import type { ViewMode } from "../view-mode-toggle";
import { DashboardHeader } from "./dashboard-header";
import { MapView } from "./map-view";
import { TableView } from "./table-view";
import { ChartView } from "./chart-view";
import type { SimulationType } from "../airport-dashboard";
import type { SmryChknAlnDtoWrapper } from "@/types/api.types";
import { counterService } from "@/api/pm/services/counter.service";

interface CongestionSearchProps {
    simulationType: SimulationType;
    simulationKey: string;
}

export default function CongestionSearch({ simulationType, simulationKey }: CongestionSearchProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('map');
    const [island, setChknSection] = useState<string>('A');
    const [chknDatas, setChknDatas] = useState<SmryChknAlnDtoWrapper>({});
    const [searchTmnlId, setSearchTmnlId] = useState<string>('P01');

    const onClickSearch = async (tmnlId: string, island: string) => {
        setChknSection(island);
        setSearchTmnlId(tmnlId);
        const _chknDatas = await counterService.retrieveChknGroupByTime(simulationKey, tmnlId, island);
        setChknDatas(_chknDatas);
    }

    return (
        <div className="flex flex-col h-full">
            <DashboardHeader simulationType={simulationType} onClickSearch={onClickSearch} />
            {viewMode === 'map' && <MapView viewMode={viewMode} onViewModeChange={setViewMode} island={island} chknDatas={chknDatas} />}
            {viewMode === 'table' && <TableView viewMode={viewMode} onViewModeChange={setViewMode} island={island} chknDatas={chknDatas} />}
            {viewMode === 'chart' && <ChartView viewMode={viewMode} onViewModeChange={setViewMode} island={island} chknDatas={chknDatas} tmnlId={searchTmnlId} />}
        </div>
    )
}