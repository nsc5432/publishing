import type { MapCgnCmprDto, MapCgnStatDto } from '@/types/api.types';
import { formatCount } from '@/lib/format';
import type { CongestionStat, CongestionStatCmpr, CongestionStatTone } from './types';

/** 평균과의 차이가 평균의 이 비율 이내면 평균 수준으로 본다 */
const EVEN_RATIO = 0.1;

function toTone(diff: number, base: number, higherIsWorse: boolean): CongestionStatTone {
    if (Math.abs(diff) <= Math.abs(base) * EVEN_RATIO) return 'even';

    return diff > 0 === higherIsWorse ? 'worse' : 'better';
}

/** 대기인원은 평균이 아니라 전 시설 합 대비 비중으로 본다. 색은 활성 시설 평균(합 ÷ 활성 시설 수)과 비교한다 */
function toShareCmpr(unitNm: string, value: number, cmpr: MapCgnCmprDto): CongestionStatCmpr {
    const total = cmpr.totWtngPsgCnt;
    const totalTitle = `전체 ${unitNm} ${formatCount(total)}명`;

    if (total === 0) return { text: '전체 0명', arrow: null, tone: 'even', title: totalTitle };

    const text = `전체의 ${Math.round((value / total) * 100)}%`;

    if (cmpr.unitCnt === 0) return { text, arrow: null, tone: 'even', title: totalTitle };

    const avg = total / cmpr.unitCnt;

    return {
        text,
        arrow: null,
        tone: toTone(value - avg, avg, true),
        title: `${totalTitle} · ${unitNm} 평균 ${formatCount(Math.round(avg))}명`,
    };
}

/** 평균을 화면 표기와 같은 정수로 반올림한 뒤 비교해 표기끼리 어긋나지 않게 한다 */
function toAvgCmpr(unitNm: string, value: number, avg: number | null, unit: string, higherIsWorse: boolean): CongestionStatCmpr {
    if (avg === null) return { text: '평균 -', arrow: null, tone: 'even', title: `${unitNm} 평균 없음` };

    const base = Math.round(avg);
    const diff = value - base;
    const tone = toTone(diff, base, higherIsWorse);
    const baseTitle = `${unitNm} 평균 ${formatCount(base)}${unit}`;

    if (tone === 'even') return { text: '평균 수준', arrow: null, tone, title: baseTitle };

    const gap = `${formatCount(Math.abs(diff))}${unit}`;

    return {
        text: `평균보다 ${gap}`,
        arrow: diff > 0 ? 'up' : 'down',
        tone,
        title: `${baseTitle} · ${gap} ${diff > 0 ? '높음' : '낮음'}`,
    };
}

/** 혼잡 현황 지표 4종 — 아일랜드 상세 / 출국장 미니 팝업이 함께 쓴다 */
export function toCongestionStats(unitNm: string, stat: MapCgnStatDto, cmpr: MapCgnCmprDto): CongestionStat[] {
    const stats: Omit<CongestionStat, 'point'>[] = [
        {
            ico: 'wait-people',
            label: '대기인원',
            value: String(stat.wtngPsgCnt),
            unit: '명',
            cmpr: toShareCmpr(unitNm, stat.wtngPsgCnt, cmpr),
        },
        {
            ico: 'wait-time',
            label: '대기시간',
            value: String(stat.wtngHr),
            unit: '초',
            cmpr: toAvgCmpr(unitNm, stat.wtngHr, cmpr.avgWtngHr, '초', true),
        },
        {
            ico: 'done-people',
            label: '처리인원',
            value: String(stat.prcsPsgCnt),
            unit: '명',
            cmpr: toAvgCmpr(unitNm, stat.prcsPsgCnt, cmpr.avgPrcsPsgCnt, '명', false),
        },
        {
            ico: 'done-time',
            label: '처리시간',
            value: String(stat.prcsHr),
            unit: '초',
            cmpr: toAvgCmpr(unitNm, stat.prcsHr, cmpr.avgPrcsHr, '초', true),
        },
    ];

    return stats.map((item) => (item.cmpr.tone === 'worse' ? { ...item, point: true } : item));
}
