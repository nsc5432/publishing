import type {
    FltPsgChartDto,
    TmnlId,
    UserSmltFltPsgDto,
    UserSmltFltPsgSaveReq,
} from '@/types/api.types';
import { formatCount, formatHhmm } from '@/lib/format';
import type { ChartData, EditMode, HourRow, TerminalFlightPax } from './types';

/**
 * 운항편/여객수 DTO → 화면 뷰 모델.
 * 단위·부호·시각 형식을 여기서 한 번에 정한다.
 */

function toChart(chartDto: FltPsgChartDto, title: string, unit: string): ChartData {
    return {
        title,
        total: formatCount(chartDto.totCnt),
        unit,
        max: chartDto.maxCnt,
        bars: chartDto.itemList.map((item) => ({ label: item.time, value: item.cnt })),
    };
}

function toRows(dto: UserSmltFltPsgDto): HourRow[] {
    return dto.hourList.map((hourRow) => ({
        start: formatHhmm(hourRow.bgnTime),
        end: formatHhmm(hourRow.endTime),
        adjust: `${hourRow.adjRate}%`,
        pax: `${formatCount(hourRow.psgCnt)}명`,
    }));
}

export function toFlightPax(dto: UserSmltFltPsgDto): TerminalFlightPax {
    return {
        flights: formatCount(dto.fltCnt),
        pax: formatCount(dto.psgCnt),
        peak: formatHhmm(dto.peakTime),
        ratio: dto.adjRate,
        flightChart: toChart(dto.fltChart, '운항편 수', '편'),
        paxChart: toChart(dto.psgChart, '여객 수', '명'),
        rows: toRows(dto),
    };
}

/** 화면 수정 방식 → 서버 코드 */
const ADJ_TYPE: Record<EditMode, UserSmltFltPsgSaveReq['adjType']> = {
    ratio: 'RATIO',
    hourly: 'HOURLY',
};

/**
 * 저장 요청.
 * 시간대별 구간은 화면에서 편집하지 않으므로 조회한 값을 그대로 되돌려 보낸다.
 */
export function toSaveReq(
    smltId: string,
    tmnlId: TmnlId,
    dto: UserSmltFltPsgDto,
    edit: { ratio: number; mode: EditMode },
): UserSmltFltPsgSaveReq {
    return {
        smltId,
        tmnlId,
        adjType: ADJ_TYPE[edit.mode],
        adjRate: edit.ratio,
        hourList: dto.hourList.map((hourRow) => ({
            bgnTime: hourRow.bgnTime,
            endTime: hourRow.endTime,
            adjRate: hourRow.adjRate,
        })),
    };
}

/** 아직 응답이 없을 때 그릴 빈 패널 (골격은 그대로 두고 값만 비운다) */
export const EMPTY_FLIGHT_PAX: TerminalFlightPax = {
    flights: '-',
    pax: '-',
    peak: '-',
    ratio: 0,
    flightChart: { title: '운항편 수', total: '-', unit: '편', max: 0, bars: [] },
    paxChart: { title: '여객 수', total: '-', unit: '명', max: 0, bars: [] },
    rows: [],
};
