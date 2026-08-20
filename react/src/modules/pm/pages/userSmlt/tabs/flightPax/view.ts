import type {
    FltPsgChartDto,
    TmnlId,
    UserSmltFltPsgDto,
    UserSmltFltPsgSaveReq,
} from '@/types/api.types';
import { formatCount, formatHhmm } from '@/lib/format';
import type { ChartData, HourRow, TerminalFlightPax } from './types';

/**
 * 운항편/여객수 DTO → 화면 뷰 모델.
 * 단위·부호·시각 형식을 여기서 한 번에 정한다.
 *
 * 전체 비율(adjRate) 은 화면에서 스테퍼로 바꾸는 값이라 매핑 인자로 받는다.
 * 조회한 수치를 기준으로 비율을 곱해 차트·표를 다시 계산한다.
 */

/** 전체 비율(%) → 곱셈 계수 (10% → 1.1) */
const toFactor = (adjRate: number) => 1 + adjRate / 100;

/** 조회값 × 비율 — 화면에 나가는 값은 모두 반올림한 정수다 */
const scale = (value: number, factor: number) => Math.round(value * factor);

/**
 * 비율을 늘리면 축도 데이터와 같은 배율로 커져서, 늘려도 막대 모양이
 * 그대로인 것처럼 보인다 (피크 막대가 항상 축 끝에 딱 맞기 때문).
 * 축은 데이터의 절반 속도로만 키워 늘어난 게 눈에 보이게 한다.
 * 대신 피크 막대는 축보다 먼저 끝에 닿을 수 있어 clamp 가 필요하다.
 */
const AXIS_GROWTH_RATE = 0.5;

function toAxisMax(baseMax: number, factor: number) {
    if (factor <= 1) return baseMax;
    return Math.round(baseMax * (1 + (factor - 1) * AXIS_GROWTH_RATE));
}

function toChart(chartDto: FltPsgChartDto, title: string, unit: string, factor: number): ChartData {
    const max = toAxisMax(chartDto.maxCnt, factor);

    return {
        title,
        total: formatCount(scale(chartDto.totCnt, factor)),
        unit,
        max,
        bars: chartDto.itemList.map((item) => {
            const actual = scale(item.cnt, factor);
            return { label: item.time, value: Math.min(actual, max), actual };
        }),
    };
}

/** 수정 방식이 전체 비율뿐이라 모든 구간에 같은 비율이 걸린다 */
function toRows(dto: UserSmltFltPsgDto, adjRate: number, factor: number): HourRow[] {
    return dto.hourList.map((hourRow) => ({
        start: formatHhmm(hourRow.bgnTime),
        end: formatHhmm(hourRow.endTime),
        adjust: `${adjRate}%`,
        pax: `${formatCount(scale(hourRow.psgCnt, factor))}명`,
    }));
}

export function toFlightPax(dto: UserSmltFltPsgDto, adjRate: number): TerminalFlightPax {
    const factor = toFactor(adjRate);

    return {
        flights: formatCount(dto.fltCnt),
        pax: formatCount(dto.psgCnt),
        peak: formatHhmm(dto.peakTime),
        flightChart: toChart(dto.fltChart, '운항편 수', '편', factor),
        paxChart: toChart(dto.psgChart, '여객 수', '명', factor),
        rows: toRows(dto, adjRate, factor),
    };
}

/**
 * 저장 요청.
 * 수정 방식은 전체 비율(RATIO) 하나뿐이고, 서버가 무시하는 시간대별 구간은
 * 조회한 값을 그대로 되돌려 보낸다.
 */
export function toSaveReq(
    smltId: string,
    tmnlId: TmnlId,
    dto: UserSmltFltPsgDto,
    adjRate: number,
): UserSmltFltPsgSaveReq {
    return {
        smltId,
        tmnlId,
        adjType: 'RATIO',
        adjRate,
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
    flightChart: { title: '운항편 수', total: '-', unit: '편', max: 0, bars: [] },
    paxChart: { title: '여객 수', total: '-', unit: '명', max: 0, bars: [] },
    rows: [],
};
