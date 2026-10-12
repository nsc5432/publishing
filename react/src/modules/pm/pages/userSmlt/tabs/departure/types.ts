import type { TimeRange } from '@/components/ui/time-range-selector';
import type { BlockColor, PanelKpi, WaitLineData } from '../../types';

export interface DepartureGate {
    no: number;
    color: BlockColor;
    ranges: TimeRange[];
    off: boolean;
    /** 출국장별 최종 보안검색대 수량. 시간 구분 없이 CAST SC 리소스로 그대로 나간다 */
    scshCntom: number;
    gnrlSrchCntom: number;
    smartPassSrchCntom: number;
}

export interface TerminalDeparture {
    gates: DepartureGate[];
    wait: WaitLineData;
    kpis: PanelKpi[];
}
