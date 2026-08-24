import type { TimeRange } from '@/components/ui/time-range-selector';
import type { BlockColor, PanelKpi, WaitLineData } from '../../types';

/** 보안검색대 운영계획 1행 (구 보안 검색대 탭의 표) */
export interface ScRange {
    id: string;
    /** 시작 / 종료 시각 (0~24) */
    operBgngHour: number;
    operEndHour: number;
    /** 그 구간에 운영할 검색대 갯수 */
    count: number;
}

/** 출국장 1개 = 주 블럭 차트의 항목 1개 (블럭 1개 = 출국장 1개) */
export interface DepartureGate {
    /** 출국장 번호 */
    no: number;
    color: BlockColor;
    /** 운영 시간 구간 */
    ranges: TimeRange[];
    /** 미사용 여부 — 미사용이면 차트에서 빠지고 헤드의 미운영 칩으로 내려간다 */
    off: boolean;
    /** 검색대 대수 (피크 시간대 기준) — 보조 차트의 블럭 수 = ceil(scshCntom / 4) */
    scshCntom: number;
    /** 검색대 구성 — 일반 / 스마트패스 */
    gnrlSrchCntom: number;
    smartPassSrchCntom: number;
    /** 보안검색대 운영계획 */
    plans: ScRange[];
}

/** 터미널 1개분 출국장 데이터 */
export interface TerminalDeparture {
    gates: DepartureGate[];
    /** 시간대별 대기인원수 (꺾은선) */
    wait: WaitLineData;
    /** 시뮬레이션 결과 지표 */
    kpis: PanelKpi[];
}
