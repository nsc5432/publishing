import type {
    ChknBoothDto,
    TmnlId,
    UserSmltChknDto,
    UserSmltChknSaveReq,
    UserSmltFltPsgDto,
} from '@/types/api.types';
import { formatCount } from '@/lib/format';
import { BLOCK_COLORS, type PanelKpi } from '../../types';
import { EMPTY_WAIT_LINE, toFlightDemand, toFlightDemandKpis, toWaitLine } from '../../view';
import { ISLAND_BOOTHS, SIDE_BOOTHS } from './constants';
import type { Booth, BoothSide, CheckinIsland, TerminalCheckinCounter } from './types';

interface CheckinCounterSource extends UserSmltChknDto {
    flightPax: UserSmltFltPsgDto;
}

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

export function toCheckinCounter(dto: CheckinCounterSource): TerminalCheckinCounter {
    return {
        total: dto.totCnt,
        airlines: dto.alnCdList,
        islandCodes: dto.islandCdList,
        islands: toIslands(dto),
        wait: toWaitLine(dto.waitList, dto.waitMaxCnt),
        ...toFlightDemand(dto.flightPax),
    };
}

export function toCheckinCounterKpis(
    data: TerminalCheckinCounter,
    islands: CheckinIsland[],
): PanelKpi[] {
    const boothCount = islands.reduce(
        (total, island) =>
            island.ranges.some((range) => range.end > range.start)
                ? total + assignedBoothCount(island)
                : total,
        0,
    );

    return [
        ...toFlightDemandKpis(data),
        { label: '체크인카운터 부스 운영 대수', value: formatCount(boothCount), unit: '대' },
    ];
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
    reservationPsgCount: 0,
    departureFlightCount: 0,
    peakDepartureLabel: '-',
};
