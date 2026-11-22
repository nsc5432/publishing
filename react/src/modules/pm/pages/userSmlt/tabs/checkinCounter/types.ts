import type { BlockColor, FlightDemandSummary, WaitLineData } from '../../types';

export type BoothSide = 'L' | 'R';

export interface Booth {
    no: number;
    side: BoothSide;
    /** 0~23시 칸마다 배정 항공사. 빈 문자열은 미배정 */
    hours: string[];
}

export interface CheckinIsland {
    label: string;
    color: BlockColor;
    booths: Booth[];
    kiosk: number;
    bagdrop: number;
}

/** 편집 매트릭스에서 고른 직사각형 칸 범위 (양끝 포함) */
export interface CellRange {
    boothFrom: number;
    boothTo: number;
    hourFrom: number;
    hourTo: number;
}

export interface TerminalCheckinCounter extends FlightDemandSummary {
    total: number;
    airlines: string[];
    islandCodes: string[];
    islands: CheckinIsland[];
    wait: WaitLineData;
}
