import type { CSSProperties } from 'react';

/** 화면 전체가 쓰는 본문 폰트 — 차트는 CSS 를 타지 않아 매번 지정해야 한다 */
export const CHART_FONT_FAMILY = 'Pretendard, sans-serif';

/** 축 라벨 기본 모양 — 색·크기는 차트마다 덮어쓴다 */
export const AXIS_LABEL = {
    color: '#9aa3b2',
    fontSize: 11,
    fontFamily: CHART_FONT_FAMILY,
};

/** 툴팁 글자 기본 모양 */
export const TOOLTIP_TEXT_STYLE = { fontSize: 12, fontFamily: CHART_FONT_FAMILY };

/** axis 트리거 툴팁이 시리즈마다 넘겨 주는 값 (ECharts 타입에는 axisValue 가 빠져 있다) */
export interface AxisTooltipItem {
    seriesName?: string;
    marker?: string;
    axisValue?: string;
    value?: number;
}

/** 툴팁 formatter 가 받는 값을 항상 배열로 편다 */
export function toTooltipItems(params: unknown): AxisTooltipItem[] {
    return (Array.isArray(params) ? params : [params]) as AxisTooltipItem[];
}

/**
 * 도면 무대 기준 비율 좌표 → 마커·카드 자리를 잡는 CSS 커스텀 프로퍼티.
 * 무대(.dep-stage / .map-stage)는 배경 도면에 대한 고정 비율 박스라
 * 창 크기가 변해도 같은 자리에 얹힌다.
 */
export function toStagePosition(x: number, y: number): CSSProperties {
    return { '--x': `${x}%`, '--y': `${y}%` } as CSSProperties;
}
