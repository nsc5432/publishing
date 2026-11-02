import type { MapCgnCmprDto, MapCgnStatDto } from '@/types/api.types';
import { formatCount } from '@/lib/format';
import type { CongestionStat, CongestionStatCmpr } from './types';

/** 대기인원은 평균이 아니라 전 시설 합 대비 비중으로 본다 */
function toShareCmpr(unitNm: string, total: number): CongestionStatCmpr {
    return { label: `전체 ${unitNm}`, value: `${formatCount(total)}명` };
}

/** 평균을 화면 표기와 같은 정수로 반올림한 뒤 비교해 표기끼리 어긋나지 않게 한다 */
function toAvgCmpr(unitNm: string, avg: number | null, unit: string): CongestionStatCmpr {
    const label = `${unitNm} 평균`;

    if (avg === null) return { label, value: '-' };

    return { label, value: `${formatCount(Math.round(avg))}${unit}` };
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
            cmpr: toShareCmpr(unitNm, cmpr.totWtngPsgCnt),
        },
        {
            ico: 'wait-time',
            label: '대기시간',
            value: String(stat.wtngHr),
            unit: '초',
            point: true,
            cmpr: toAvgCmpr(unitNm, cmpr.avgWtngHr, '초'),
        },
        {
            ico: 'done-people',
            label: '처리인원',
            value: String(stat.prcsPsgCnt),
            unit: '명',
            cmpr: toAvgCmpr(unitNm, cmpr.avgPrcsPsgCnt, '명'),
        },
        {
            ico: 'done-time',
            label: '처리시간',
            value: String(stat.prcsHr),
            unit: '초',
            cmpr: toAvgCmpr(unitNm, cmpr.avgPrcsHr, '초'),
        },
    ];
}
