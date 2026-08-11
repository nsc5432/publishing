import type { TmnlId } from '@/types/api.types';

/**
 * 도면 화면 공용 뷰 모델.
 *
 * 맵형태보기(terminalMap)와 출국장(departureHall)이 같은 도면 규칙(무대 기준 비율 좌표,
 * 마커, 혼잡 알림)을 쓴다. 두 화면에 같은 타입을 각각 두면 한쪽만 고쳐도 티가 나지 않는다.
 *
 * 단계별 안내 문구(NOTICE_LEVEL)는 화면마다 표현이 달라서 각 화면 types.ts 에 남긴다.
 */

/** 터미널 구분 — 서버 표기(TmnlId)와 같은 값이다 */
export type TerminalKind = TmnlId;

/** 화면에 그리는 터미널 순서 */
export const TERMINALS: TerminalKind[] = ['T1', 'T2'];

export const TERMINAL_LABEL: Record<TerminalKind, string> = {
    T1: 'T1터미널',
    T2: 'T2터미널',
};

/** 혼잡도 (마커 색상 / 상태 뱃지) — 서버 4단계를 화면 3색으로 줄인 값 */
export type CongestionLevel = 'normal' | 'busy' | 'crowded';

export const CONGESTION_LABEL: Record<CongestionLevel, string> = {
    normal: '원활',
    busy: '보통',
    crowded: '혼잡',
};

/** 도면 무대(viewBox) 기준 비율 좌표 (단위: %) */
export interface MarkerPoint {
    /** 가로 비율 (0~100) */
    x: number;
    /** 세로 비율 (0~100) */
    y: number;
}

/** 출국장 마커 (T1: 1~6 / T2: 1~2) */
export interface DepGateMarker extends MarkerPoint {
    id: string;
    label: string;
    level: CongestionLevel;
}

/** 아일랜드 마커 (A~N) */
export interface IslandMarker extends MarkerPoint {
    id: string;
    label: string;
    level: CongestionLevel;
}

/** 출입구 게이트 마커 */
export interface GateMarker extends MarkerPoint {
    id: string;
    label: string;
}

/* ================= 상단 혼잡 알림 ================= */

/**
 * 혼잡 알림 단계 (여유 → 보통 → 혼잡 → 매우혼잡).
 * 마커의 CongestionLevel(3단계)과는 별개 척도다.
 */
export type NoticeLevel = 'easy' | 'normal' | 'busy' | 'severe';

/** 단계별 기본 표기 (뱃지 문구 / 대상 시설이 없을 때의 안내 문구) */
export interface NoticeLevelPreset {
    label: string;
    message: string;
}

/** 상단 혼잡 알림 항목 */
export interface NoticeItem {
    id: string;
    /** 시설명 (예: 체크인카운터 / 출국장 1) */
    facility: string;
    /** 시설 코드 (예: M11) — 맵형태보기만 쓴다 */
    code?: string;
    /** 부가 설명 (예: 3개 부스 OPEN) */
    desc: string;
}

/** 터미널별 혼잡 알림 (단계 + 조치 대상 시설) */
export interface NoticeData {
    level: NoticeLevel;
    items: NoticeItem[];
}
