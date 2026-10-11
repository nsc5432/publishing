import type { ChknBoothDto, TmnlId, UserSmltChknDto, UserSmltChknSaveReq } from '@/types/api.types';
import { BLOCK_COLORS } from '../../types';
import { EMPTY_WAIT_LINE, toKpis, toWaitLine } from '../../view';
import { ISLAND_BOOTHS, SIDE_BOOTHS } from './constants';
import type { Booth, BoothSide, CheckinIsland, TerminalCheckinCounter } from './types';

export function toSide(boothNo: number): BoothSide {
    return boothNo <= SIDE_BOOTHS ? 'L' : 'R';
}

export function toBooths(boothList: ChknBoothDto[]): Booth[] {
    const airlineByNo = new Map(boothList.map((booth) => [booth.boothNo, booth.alnCd]));

    return Array.from({ length: ISLAND_BOOTHS }, (_, i) => {
        const no = i + 1;

        return { no, side: toSide(no), airline: airlineByNo.get(no) ?? '' };
    });
}

// 배정된 부스 수
export function assignedBoothCount(island: CheckinIsland): number {
    return island.booths.filter((booth) => booth.airline).length;
}

function toIslands(dto: UserSmltChknDto): CheckinIsland[] {
    return dto.islandList.map((island, i) => ({
        label: island.island,
        color: BLOCK_COLORS[i % BLOCK_COLORS.length],
        ranges: island.oprTimeList.map((time) => ({ start: time.operBgngHour, end: time.operEndHour })),
        booths: toBooths(island.boothList),
        kiosk: island.kioskCnt,
        bagdrop: island.bagDropCnt,
    }));
}

export function toCheckinCounter(dto: UserSmltChknDto): TerminalCheckinCounter {
    return {
        total: dto.totCnt,
        airlines: dto.alnCdList,
        islandCodes: dto.islandCdList,
        islands: toIslands(dto),
        wait: toWaitLine(dto.waitList, dto.waitMaxCnt),
        kpis: toKpis(dto.kpi),
    };
}

export function toSaveReq(ymd: string, tmnlId: TmnlId, islands: CheckinIsland[]): UserSmltChknSaveReq {
    return {
        ymd,
        tmnlId,
        islandList: islands.map((island) => ({
            island: island.label,
            oprTimeList: island.ranges.map((range) => ({
                operBgngHour: range.start,
                operEndHour: range.end,
            })),
            boothList: island.booths
                .filter((booth) => booth.airline)
                .map((booth) => ({
                    boothNo: booth.no,
                    alnCd: booth.airline,

                    cstmAltmntYn: 'N' as const,
                })),
            kioskCnt: island.kiosk,
            bagDropCnt: island.bagdrop,
        })),
    };
}

export const EMPTY_CHECKIN_COUNTER: TerminalCheckinCounter = {
    total: 0,
    airlines: [],
    islandCodes: [],
    islands: [],
    wait: EMPTY_WAIT_LINE,
    kpis: [],
};
