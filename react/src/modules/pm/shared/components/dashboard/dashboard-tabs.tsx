import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TerminalPassengerIcon from '@/assets/svg/terminal-passenger-icon.svg';
import MapIcon from '@/assets/svg/map-icon.svg';
import CounterConIcon from '@/assets/svg/counter-con-icon.svg';
import SelfCheckinIcon from '@/assets/svg/self-checkin-icon.svg';
import DepartureIcon from '@/assets/svg/departure-icon.svg';


interface DashboardTabsProps {
    value: string;
    onValueChange: (value: string) => void;
}

interface TabIconProps {
    src: string;
    activeSrc: string;
    isActive: boolean;
    alt: string;
}

function TabIcon({ src, activeSrc, isActive, alt }: TabIconProps) {
    return (
        <img
            src={isActive ? activeSrc : src}
            alt={alt}
            className="w-5 h-5"
        />
    );
}

export function DashboardTabs({ value, onValueChange }: DashboardTabsProps) {
    return (
        <Tabs value={value} onValueChange={onValueChange} className="w-full">
            <TabsList className="w-full justify-start h-5 bg-background/80 backdrop-blur-md rounded-none border-border/50 px-4 gap-1 bg-gray-100">
                <TabsTrigger value="summary" className="px-5 py-2.5 data-[state=active]:bg-gray-400 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                    <TabIcon
                        src={TerminalPassengerIcon}
                        activeSrc={TerminalPassengerIcon}
                        isActive={value === 'summary'}
                        alt="요약보기"
                    />
                    요약보기
                </TabsTrigger>
                <TabsTrigger value="map" className="px-5 py-2.5 bg-gray-100 data-[state=active]:bg-gray-400 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                    <TabIcon
                        src={MapIcon}
                        activeSrc={MapIcon}
                        isActive={value === 'map'}
                        alt="맵형태보기"
                    />
                    맵형태보기
                </TabsTrigger>
                <TabsTrigger value="counter" className="px-5 py-2.5 bg-gray-100 data-[state=active]:bg-gray-400 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                    <TabIcon
                        src={CounterConIcon}
                        activeSrc={CounterConIcon}
                        isActive={value === 'counter'}
                        alt="체크인카운터"
                    />
                    체크인카운터
                </TabsTrigger>
                <TabsTrigger value="self-checkin" className="px-5 py-2.5 bg-gray-100 data-[state=active]:bg-gray-400 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                    <TabIcon
                        src={SelfCheckinIcon}
                        activeSrc={SelfCheckinIcon}
                        isActive={value === 'self-checkin'}
                        alt="셀프체크인/백드롭"
                    />
                    셀프체크인/백드롭
                </TabsTrigger>
                <TabsTrigger value="departure" className="px-5 py-2.5 bg-gray-100 data-[state=active]:bg-gray-400 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                    <TabIcon
                        src={DepartureIcon}
                        activeSrc={DepartureIcon}
                        isActive={value === 'departure'}
                        alt="출국장"
                    />
                    출국장
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
