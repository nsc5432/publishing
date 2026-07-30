import { useState } from 'react';
import { DashboardTabs } from '@/modules/pm/shared/components/dashboard/dashboard-tabs';
import { MapView } from '@/modules/pm/shared/components/dashboard/map/map-view';
import SmltSmryRslt from './smlt-smry-rslt';
import ChknCongestionSearch from './chkn/congestion-search';
import SlfchknCongestionSearch from './slfchkn/congestion-search';
import DepCongestionSearch from './dep/congestion-search';

export type SimulationType = 'daily' | 'user';

interface AirportDashboardProps {
    simulationType: SimulationType;
    simulationKey: string;
    onChangeDateCallback?: (date: Date) => void
}

export default function AirportDashboard({ simulationType = 'daily', simulationKey, onChangeDateCallback }: AirportDashboardProps) {
    const [activeTab, setActiveTab] = useState('summary');

    return (
        <div className="h-screen flex flex-col">
            <div className="flex items-center justify-between px-6 pt-4 pb-2 bg-background border-b border-border/50 bg-gray-100">
                <DashboardTabs value={activeTab} onValueChange={setActiveTab} />
            </div>
            <main className="flex-1 overflow-y-auto">
                {activeTab === 'summary' && <SmltSmryRslt simulationType={simulationType} simulationKey={simulationKey} onChangeDateCallback={onChangeDateCallback} />}
                {activeTab === 'map' && <MapView simulationKey={simulationKey} />}
                {activeTab === 'counter' && <ChknCongestionSearch simulationType={simulationType} simulationKey={simulationKey} />}
                {activeTab === 'self-checkin' && <SlfchknCongestionSearch simulationType={simulationType} simulationKey={simulationKey} />}
                {activeTab === 'departure' && <DepCongestionSearch simulationType={simulationType} simulationKey={simulationKey} />}
            </main>
        </div>
    );
}
