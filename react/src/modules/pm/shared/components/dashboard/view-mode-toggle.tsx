import { MapPin, Table2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ViewMode = 'map' | 'table' | 'chart';
type ColorScheme = 'indigo' | 'orange' | 'green';

interface ViewModeToggleProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    colorScheme?: ColorScheme;
    inline?: boolean;
}

const colorClasses: Record<ColorScheme, { active: string; hover: string }> = {
    indigo: {
        active: 'bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow-md px-5 border-0',
        hover: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 font-medium px-5 shadow-sm',
    },
    orange: {
        active: 'bg-orange-600 text-white hover:bg-orange-700 font-semibold shadow-md px-5 border-0',
        hover: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 font-medium px-5 shadow-sm',
    },
    green: {
        active: 'bg-green-600 text-white hover:bg-green-700 font-semibold shadow-md px-5 border-0',
        hover: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 font-medium px-5 shadow-sm',
    },
};

export function ViewModeToggle({
    viewMode,
    onViewModeChange,
    colorScheme = 'indigo',
    inline = false,
}: ViewModeToggleProps) {
    const colors = colorClasses[colorScheme];

    const buttons = (
        <>
            <Button
                size="sm"
                variant={viewMode === 'map' ? 'default' : 'outline'}
                onClick={() => onViewModeChange('map')}
                className={viewMode === 'map' ? colors.active : colors.hover}
            >
                <MapPin className="h-4 w-4 mr-1" />
                맵보기
            </Button>
            <Button
                size="sm"
                variant={viewMode === 'table' ? 'default' : 'outline'}
                onClick={() => onViewModeChange('table')}
                className={viewMode === 'table' ? colors.active : colors.hover}
            >
                <Table2 className="h-4 w-4 mr-1.5" />
                표보기
            </Button>
            <Button
                size="sm"
                variant={viewMode === 'chart' ? 'default' : 'outline'}
                onClick={() => onViewModeChange('chart')}
                className={viewMode === 'chart' ? colors.active : colors.hover}
            >
                <BarChart3 className="h-4 w-4 mr-1.5" />
                차트보기
            </Button>
        </>
    );

    if (inline) {
        return <div className="flex gap-2">{buttons}</div>;
    }

    return (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 -mx-8 -mb-6 mt-5 px-8 py-4 rounded-b-lg">
            <div className="flex justify-end gap-3">{buttons}</div>
        </div>
    );
}
