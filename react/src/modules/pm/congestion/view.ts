import type { MapCgnCmprDto, MapCgnStatDto } from '@/types/api.types';
import { formatCount } from '@/lib/format';
import type { CongestionStat, CongestionStatCmpr, StatTrend } from './types';

const TREND_MARK: Record<Exclude<StatTrend, 'same'>, string> = { up: '▲', down: '▼' };

function formatPercent(value: number): string {
    return (Math.round(value * 10) / 10).toLocaleString();
}

/** 대기인원은 평균이 아니라 전 시설 합 대비 비중으로 본다 */
function toShareCmpr(unitNm: string, value: number, total: number): CongestionStatCmpr {
    return {
        label: `전체 ${unitNm}`,
        value: `${formatCount(total)}명`,
        diff: total > 0 ? `비중 ${formatPercent((value / total) * 100)}%` : '비중 -',
        trend: null,
    };
}

/** 평균을 화면 표기와 같은 정수로 반올림한 뒤 비교해 표기끼리 어긋나지 않게 한다 */
function toAvgCmpr(unitNm: string, value: number, avg: number | null, unit: string): CongestionStatCmpr {
    const label = `${unitNm} 평균`;

    if (avg === null) return { label, value: '-', diff: '', trend: null };

    const avgValue = Math.round(avg);
    const diff = value - avgValue;
    const trend: StatTrend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'same';
    const rate = avgValue === 0 ? '' : ` (${diff >= 0 ? '+' : '-'}${formatPercent((Math.abs(diff) / avgValue) * 100)}%)`;

    return {
        label,
        value: `${formatCount(avgValue)}${unit}`,
        diff: trend === 'same' ? '평균과 같음' : `${TREND_MARK[trend]} ${formatCount(Math.abs(diff))}${unit}${rate}`,
        trend,
    };
}

/** 혼잡 현황 지표 4종 — 아일랜드 상세 / 출국장 미니 팝업이 함께 쓴다 */
export function toCongestionStats(unitNm: string, stat: MapCgnStatDto, cmpr: MapCgnCmprDto): CongestionStat[] {
    return [
        {
            ico: 'wait-people',
            label: '대기인원',
            value: String(stat.wtngPsgCnt),
            unit: '명',
            point: true,
            cmpr: toShareCmpr(unitNm, stat.wtngPsgCnt, cmpr.totWtngPsgCnt),
        },
        {
            ico: 'wait-time',
            label: '대기시간',
            value: String(stat.wtngHr),
            unit: '초',
            point: true,
            cmpr: toAvgCmpr(unitNm, stat.wtngHr, cmpr.avgWtngHr, '초'),
        },
        {
            ico: 'done-people',
            label: '처리인원',
            value: String(stat.prcsPsgCnt),
            unit: '명',
            cmpr: toAvgCmpr(unitNm, stat.prcsPsgCnt, cmpr.avgPrcsPsgCnt, '명'),
        },
        {
            ico: 'done-time',
            label: '처리시간',
            value: String(stat.prcsHr),
            unit: '초',
            cmpr: toAvgCmpr(unitNm, stat.prcsHr, cmpr.avgPrcsHr, '초'),
        },
    ];
}
