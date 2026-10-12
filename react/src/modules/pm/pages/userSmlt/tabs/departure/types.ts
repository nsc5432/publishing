import type { TimeRange } from '@/components/ui/time-range-selector';
import type { BlockColor, FlightDemandSummary, WaitLineData } from '../../types';

export interface DepartureGate {
    no: number;
    color: BlockColor;
    ranges: TimeRange[];
    off: boolean;
    scshCntom: number;
    gnrlSrchCntom: number;
    smartPassSrchCntom: number;
}

export interface TerminalDeparture extends FlightDemandSummary {
    gates: DepartureGate[];
    wait: WaitLineData;
}
