import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { SelectTmnl } from '../../select-tmnl';
import type { SimulationType } from '../airport-dashboard';

interface DashboardHeaderProps {
    simulationType: SimulationType
    onClickSearch: (tmnlId: string) => void;
}

export function DashboardHeader({ simulationType, onClickSearch }: DashboardHeaderProps) {
    const [searchTmnlId, setSearchTmnlId] = useState<string>('P01');

    useEffect(() => {
        onClickSearch(searchTmnlId);
    }, []);

    const _onClickSearch = () => {
        onClickSearch(searchTmnlId);
    }

    return (
        <div className="bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 shadow-lg mt-2">
            <div className="px-8 pt-3 pb-1">
                <div className="flex items-start justify-between gap-6">
                    {/* Title Section */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
                            출국장 혼잡도 조회
                        </h1>
                        <p className="text-white/80 text-sm mt-1 font-medium">
                            {simulationType === 'daily' ? '일일' : '사용자'} 시뮬레이션 결과
                        </p>
                    </div>

                    {/* Controls Section */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-white/20">
                            <span className="text-sm font-medium text-white/90">터미널</span>
                            <SelectTmnl tmnlId={searchTmnlId} onChange={setSearchTmnlId} />
                        </div>
                        <Button
                            size="default"
                            className="bg-white text-indigo-700 hover:bg-white/95 font-semibold shadow-md px-6 py-2.5 h-auto"
                            onClick={_onClickSearch}
                        >
                            <Search className="h-4 w-4 mr-2" />
                            검색
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
