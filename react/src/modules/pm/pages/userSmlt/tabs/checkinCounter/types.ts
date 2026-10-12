import type { TimeRange } from '@/components/ui/time-range-selector';
import type { BlockColor, FlightDemandSummary, WaitLineData } from '../../types';

export type BoothSide = 'L' | 'R';

export interface Booth {
    no: number;
    side: BoothSide;
    airline: string;
}

export interface CheckinIsland {
    label: string;
    color: BlockColor;
    ranges: TimeRange[];
    booths: Booth[];
    kiosk: number;
    bagdrop: number;
}

export interface TerminalCheckinCounter extends FlightDemandSummary {
    total: number;
    airlines: string[];
    islandCodes: string[];
    islands: CheckinIsland[];
    wait: WaitLineData;
}
