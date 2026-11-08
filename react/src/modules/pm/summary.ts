import { formatCount } from '@/lib/format';
import type { MapLandsideSmryDto, TmnlSmryDto } from '@/types/api.types';

export interface SummaryInfoCell {
    /** '\n' 이 들어갈 수 있다 (Multiline 이 <br/> 로 편다) */
    label: string;
    value: string;
    unit: string;
}

export interface SummaryTipRow extends SummaryInfoCell {
    range: string;
}

export interface SummaryTipRange {
    snapshot: string;
    intv: string;
    hourly: string;
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

export function toDsbdSummaryInfo(smry?: TmnlSmryDto | null): SummaryInfoCell[] {
    return [
        toCountCell('전체 대기인원', smry?.smryWtngPsgCnt),
        toMinuteCell('평균 대기시간', smry?.smryAvgWtngSec),
        toCountCell('유입인원', smry?.smryIntvArvlPsgCnt),
        toCountCell('처리인원', smry?.smryIntvPrcsPsgCnt),
    ];
}

export function toDsbdSummaryTip(smry: TmnlSmryDto, range: SummaryTipRange): SummaryTipRow[] {
    return [
        { ...toCountCell('전체 대기인원', smry.smryWtngPsgCnt), range: range.snapshot },
        { ...toMinuteCell('평균 대기시간', smry.smryAvgWtngSec), range: range.intv },
        { ...toCountCell('유입인원', smry.smryIntvArvlPsgCnt), range: range.intv },
        { ...toCountCell('처리인원', smry.smryIntvPrcsPsgCnt), range: range.intv },
        { ...toCountCell('시간당 유입인원', smry.smryArvlPsgCnt), range: range.hourly },
        { ...toCountCell('시간당 처리인원', smry.smryPrcsPsgCnt), range: range.hourly },
    ];
}
