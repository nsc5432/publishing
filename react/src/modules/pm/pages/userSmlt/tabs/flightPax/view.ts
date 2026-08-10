import type {
    FltPsgChartDto,
    TmnlId,
    UserSmltFltPsgDto,
    UserSmltFltPsgSaveReq,
} from '@/types/api.types';
import { formatCount, formatHhmm } from '@/modules/pm/pages/dashboard/format';
import type { ChartData, EditMode, HourRow, TerminalFlightPax } from './types';

/**
 * 운항편/여객수 DTO → 화면 뷰 모델.
 * 단위·부호·시각 형식을 여기서 한 번에 정한다.
 */

/**
 * Y축 라벨 (위 → 아래, 4개).
 * 축 칸이 좁아 1,000 이상은 K 로 줄인다 (90,000 → 90K).
 */
function toAxis(maxCnt: number): string[] {
    const tick = (value: number) =>
        value >= 1000 ? `${Math.round(value / 1000)}K` : String(Math.round(value));

    return [maxCnt, (maxCnt * 2) / 3, maxCnt / 3, 0].map(tick);
}

function toChart(chart: FltPsgChartDto, title: string, unit: string): ChartData {
    return {
        title,
        total: formatCount(chart.totCnt),
        unit,
        axis: toAxis(chart.maxCnt),
        bars: chart.itemList.map((item) => ({
            label: item.time,
            // 막대 높이는 비율(%)이다. Y축 최댓값이 0 이면 축이 없는 것과 같다.
            ratio: chart.maxCnt > 0 ? Math.round((item.cnt / chart.maxCnt) * 100) : 0,
        })),
    };
}

function toRows(dto: UserSmltFltPsgDto): HourRow[] {
    return dto.hourList.map((hour) => ({
        start: formatHhmm(hour.bgnTime),
        end: formatHhmm(hour.endTime),
        adjust: `${hour.adjRate}%`,
        pax: `${formatCount(hour.psgCnt)}명`,
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
        hourList: dto.hourList.map((hour) => ({
            bgnTime: hour.bgnTime,
            endTime: hour.endTime,
            adjRate: hour.adjRate,
        })),
    };
}

/** 아직 응답이 없을 때 그릴 빈 패널 (골격은 그대로 두고 값만 비운다) */
export const EMPTY_FLIGHT_PAX: TerminalFlightPax = {
    flights: '-',
    pax: '-',
    peak: '-',
    ratio: 0,
    flightChart: { title: '운항편 수', total: '-', unit: '편', axis: ['0', '0', '0', '0'], bars: [] },
    paxChart: { title: '여객 수', total: '-', unit: '명', axis: ['0', '0', '0', '0'], bars: [] },
    rows: [],
};
