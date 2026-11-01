import { formatCount } from '@/lib/format';
import type { MapLandsideSmryDto } from '@/types/api.types';

export interface SummaryInfoCell {
    /** '\n' 이 들어갈 수 있다 (Multiline 이 <br/> 로 편다) */
    label: string;
    value: string;
    unit: string;
}

export function toSummaryInfo(smry?: MapLandsideSmryDto | null): SummaryInfoCell[] {
    return [
        {
            label: '전체\n대기인원',
            value: smry?.smryWtngPsgCnt == null ? '-' : formatCount(smry.smryWtngPsgCnt),
            unit: '명',
        },
        {
            label: '평균\n대기시간',
            value: smry?.smryAvgWtngSec == null ? '-' : String(Math.round(smry.smryAvgWtngSec / 60)),
            unit: '분',
        },
        {
            label: '시간당\n유입인원',
            value: smry?.smryArvlPsgCnt == null ? '-' : formatCount(smry.smryArvlPsgCnt),
            unit: '명',
        },
        {
            label: '시간당\n처리인원',
            value: smry?.smryPrcsPsgCnt == null ? '-' : formatCount(smry.smryPrcsPsgCnt),
            unit: '명',
        },
    ];
}
