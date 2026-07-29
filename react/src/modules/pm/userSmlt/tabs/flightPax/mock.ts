import type { TerminalKind } from '../../types';
import type { ChartBar, HourRow, TerminalFlightPax } from './types';

/** 차트 Y축 라벨 (위 → 아래) */
const AXIS = ['300', '200', '100', '0'];

/** 하단 시간 스케일 — 04시부터 2시간 단위 12구간 */
const SCALE = ['04', '06', '08', '10', '12', '14', '16', '18', '20', '22', '00', '02'];

/** 비율 배열(12개)을 SCALE 라벨과 묶어 막대 데이터로 만든다 */
function toBars(ratios: number[]): ChartBar[] {
    return ratios.map((ratio, i) => ({ label: SCALE[i], ratio }));
}

/** 시간대별 표 — [시작시각, 수정비율, 승객수] 튜플을 1시간 단위 행으로 편다 */
function toRows(seed: Array<[string, string, string]>): HourRow[] {
    return seed.map(([start, adjust, pax], i) => ({
        start,
        end: seed[i + 1] ? seed[i + 1][0] : '16:00',
        adjust,
        pax,
    }));
}

/** 스테퍼 증감 폭 (%) */
export const RATIO_STEP = 5;
/** 스테퍼 하한 (%) */
export const MIN_RATIO = -100;
/** 스테퍼 상한 (%) */
export const MAX_RATIO = 100;

export const FLIGHT_PAX: Record<TerminalKind, TerminalFlightPax> = {
    T1: {
        flights: '15',
        pax: '1,234,567',
        peak: '14:00',
        ratio: 10,
        flightChart: {
            title: '운항편 수',
            total: '1,234',
            unit: '편',
            axis: AXIS,
            bars: toBars([5, 8, 6, 33, 40, 67, 68, 67, 33, 33, 16, 6]),
        },
        paxChart: {
            title: '여객 수',
            total: '1,234,567',
            unit: '명',
            axis: AXIS,
            bars: toBars([6, 10, 7, 34, 39, 68, 68, 67, 34, 33, 15, 6]),
        },
        rows: toRows([
            ['04:00', '10%', '12,340명'],
            ['05:00', '0%', '18,220명'],
            ['06:00', '5%', '24,510명'],
            ['07:00', '0%', '31,080명'],
            ['08:00', '-5%', '44,760명'],
            ['09:00', '0%', '52,300명'],
            ['10:00', '15%', '61,940명'],
            ['11:00', '0%', '58,120명'],
            ['12:00', '0%', '49,870명'],
            ['13:00', '10%', '55,430명'],
            ['14:00', '0%', '67,210명'],
            ['15:00', '0%', '63,050명'],
        ]),
    },
    T2: {
        flights: '9',
        pax: '842,310',
        peak: '16:00',
        ratio: 0,
        flightChart: {
            title: '운항편 수',
            total: '842',
            unit: '편',
            axis: AXIS,
            bars: toBars([4, 6, 9, 22, 31, 44, 52, 48, 27, 21, 11, 5]),
        },
        paxChart: {
            title: '여객 수',
            total: '842,310',
            unit: '명',
            axis: AXIS,
            bars: toBars([5, 7, 10, 23, 30, 45, 53, 47, 26, 20, 12, 4]),
        },
        rows: toRows([
            ['04:00', '0%', '8,120명'],
            ['05:00', '0%', '11,460명'],
            ['06:00', '0%', '16,900명'],
            ['07:00', '0%', '21,340명'],
            ['08:00', '0%', '29,770명'],
            ['09:00', '0%', '35,010명'],
            ['10:00', '0%', '41,220명'],
            ['11:00', '0%', '39,880명'],
            ['12:00', '0%', '33,150명'],
            ['13:00', '0%', '37,600명'],
            ['14:00', '0%', '45,730명'],
            ['15:00', '0%', '42,090명'],
        ]),
    },
};
