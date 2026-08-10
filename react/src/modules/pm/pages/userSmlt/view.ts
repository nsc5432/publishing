import type { SmltKpiDto, WaitPsgDto } from '@/types/api.types';
import type { PanelKpi, WaitLineData } from './types';

/**
 * 조회 결과 공용 매핑 (체크인 카운터 · 출국장 탭).
 * 두 탭이 같은 DTO 조각을 받으므로 표기 규칙도 한 곳에 둔다.
 */

/** 패널 헤드의 시뮬레이션 결과 지표 (직전 수행이 없으면 값이 0 으로 내려온다) */
export function toKpis(kpi: SmltKpiDto): PanelKpi[] {
    return [
        { label: '평균대기', value: String(kpi.avgWaitMin), unit: '분' },
        { label: 'P95대기', value: String(kpi.p95WaitMin), unit: '분' },
        { label: '최대 큐인원', value: String(kpi.maxQueuePsgCnt), unit: '명' },
        { label: '가동률', value: String(kpi.utilRate), unit: '%' },
    ];
}

/** 블럭 차트 위에 겹쳐 그리는 대기인원 꺾은선 (0~23시 24개) */
export function toWaitLine(waitList: WaitPsgDto[], waitMaxCnt: number): WaitLineData {
    return {
        data: waitList.map((item) => item.waitPsgCnt),
        max: waitMaxCnt,
        label: '대기인원수',
        unit: '명',
    };
}

/** 아직 응답이 없을 때 그릴 빈 꺾은선 */
export const EMPTY_WAIT_LINE: WaitLineData = {
    data: [],
    max: 0,
    label: '대기인원수',
    unit: '명',
};
