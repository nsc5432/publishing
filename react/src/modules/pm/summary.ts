import { formatCount } from '@/lib/format';
import type { MapLandsideSmryDto, TmnlSmryDto } from '@/types/api.types';

export interface SummaryInfoCell {
    /** '\n' 이 들어갈 수 있다 (Multiline 이 <br/> 로 편다) */
    label: string;
    value: string;
    unit: string;
}

function toCountCell(label: string, count: number | null | undefined): SummaryInfoCell {
    return { label, value: count == null ? '-' : formatCount(count), unit: '명' };
}

function toMinuteCell(label: string, sec: number | null | undefined): SummaryInfoCell {
    return { label, value: sec == null ? '-' : String(Math.round(sec / 60)), unit: '분' };
}

export function toSummaryInfo(smry?: MapLandsideSmryDto | null): SummaryInfoCell[] {
    return [
        toCountCell('전체\n대기인원', smry?.smryWtngPsgCnt),
        toMinuteCell('평균\n대기시간', smry?.smryAvgWtngSec),
        toCountCell('시간당\n유입인원', smry?.smryArvlPsgCnt),
        toCountCell('시간당\n처리인원', smry?.smryPrcsPsgCnt),
    ];
}

/** 요약보기는 조회 시각 10분 결과의 유입 · 처리를 시간당 값 앞에 더 보여 준다 */
export function toDsbdSummaryInfo(smry?: TmnlSmryDto | null): SummaryInfoCell[] {
    return [
        toCountCell('전체 대기인원', smry?.smryWtngPsgCnt),
        toMinuteCell('평균 대기시간', smry?.smryAvgWtngSec),
        toCountCell('유입인원', smry?.smryIntvArvlPsgCnt),
        toCountCell('처리인원', smry?.smryIntvPrcsPsgCnt),
        toCountCell('시간당 유입인원', smry?.smryArvlPsgCnt),
        toCountCell('시간당 처리인원', smry?.smryPrcsPsgCnt),
    ];
}
