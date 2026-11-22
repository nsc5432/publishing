import type {
    ChknBoothAltmntDto,
    ChknBoothDto,
    TmnlId,
    UserSmltChknDto,
    UserSmltChknSaveReq,
    UserSmltFltPsgDto,
} from '@/types/api.types';
import type { TimeRange } from '@/lib/time-range';
import { formatCount } from '@/lib/format';
import { BLOCK_COLORS, type PanelKpi } from '../../types';
import { EMPTY_WAIT_LINE, toFlightDemand, toFlightDemandKpis, toWaitLine } from '../../view';
import { DAY_HOURS, ISLAND_BOOTHS, SIDE_BOOTHS } from './constants';
import type { Booth, BoothSide, CellRange, CheckinIsland, TerminalCheckinCounter } from './types';

interface CheckinCounterSource extends UserSmltChknDto {
    flightPax: UserSmltFltPsgDto;
}

export function toSide(boothNo: number): BoothSide {
    return boothNo <= SIDE_BOOTHS ? 'L' : 'R';
}

function toHours(altmntList: ChknBoothAltmntDto[]): string[] {
    const hours = Array<string>(DAY_HOURS).fill('');

    altmntList.forEach(({ alnCd, operBgngHour, operEndHour }) => {
        for (let hour = Math.max(operBgngHour, 0); hour < Math.min(operEndHour, DAY_HOURS); hour += 1) hours[hour] = alnCd;
    });

    return hours;
}

/** 칸 배열을 같은 항공사가 이어지는 구간으로 묶는다 */
export function toAltmntList(hours: string[]): ChknBoothAltmntDto[] {
    const result: ChknBoothAltmntDto[] = [];

    hours.forEach((alnCd, hour) => {
        if (!alnCd) return;
        const last = result.at(-1);
        if (last && last.alnCd === alnCd && last.operEndHour === hour) last.operEndHour = hour + 1;
        else result.push({ alnCd, operBgngHour: hour, operEndHour: hour + 1 });
    });

    return result;
}

export function toBooths(boothList: ChknBoothDto[]): Booth[] {
    const altmntByNo = new Map(boothList.map((booth) => [booth.boothNo, booth.altmntList]));

    return Array.from({ length: ISLAND_BOOTHS }, (_, i) => {
        const no = i + 1;

        return { no, side: toSide(no), hours: toHours(altmntByNo.get(no) ?? []) };
    });
}

export function isBoothAssigned(booth: Booth): boolean {
    return booth.hours.some(Boolean);
}

export function assignedBoothCount(island: CheckinIsland): number {
    return island.booths.filter(isBoothAssigned).length;
}

export function operatingBoothCount(island: CheckinIsland, hour: number): number {
    return island.booths.filter((booth) => booth.hours[hour]).length;
}

/** 부스 배정의 합집합 — 블록차트 · 운영 여부 표시용 아일랜드 운영시간 */
export function toIslandRanges(island: CheckinIsland): TimeRange[] {
    const ranges: TimeRange[] = [];

    for (let hour = 0; hour < DAY_HOURS; hour += 1) {
        if (operatingBoothCount(island, hour) === 0) continue;
        const last = ranges.at(-1);
        if (last && last.end === hour) last.end = hour + 1;
        else ranges.push({ start: hour, end: hour + 1 });
    }

    return ranges;
}

export function cellCount(range: CellRange | null): number {
    if (!range) return 0;
    return (range.boothTo - range.boothFrom + 1) * (range.hourTo - range.hourFrom + 1);
}

export function isCellInRange(range: CellRange | null, boothNo: number, hour: number): boolean {
    return (
        range !== null &&
        boothNo >= range.boothFrom &&
        boothNo <= range.boothTo &&
        hour >= range.hourFrom &&
        hour <= range.hourTo
    );
}

export function paintBooths(booths: Booth[], range: CellRange, airline: string): Booth[] {
    return booths.map((booth) => {
        if (booth.no < range.boothFrom || booth.no > range.boothTo) return booth;

        return {
            ...booth,
            hours: booth.hours.map((current, hour) => (hour >= range.hourFrom && hour <= range.hourTo ? airline : current)),
        };
    });
}

function toIslands(dto: UserSmltChknDto): CheckinIsland[] {
    return dto.islandList.map((island, i) => ({
        label: island.island,
        color: BLOCK_COLORS[i % BLOCK_COLORS.length],
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
    const boothCount = islands.reduce((total, island) => total + assignedBoothCount(island), 0);

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
            boothList: island.booths
                .map((booth) => ({ boothNo: booth.no, altmntList: toAltmntList(booth.hours) }))
                .filter((booth) => booth.altmntList.length > 0),
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
