import { useMemo, type CSSProperties } from 'react';
import type { ECElementEvent } from 'echarts/core';
import { echarts, ReactEChartsCore, type EChartsOption } from '@/lib/echarts';

export interface EChartProps {
    option: EChartsOption;
    className?: string;
    style?: CSSProperties;
    /** 차트 요소 클릭 (블럭 차트의 블럭 선택 등) */
    onClick?: (params: ECElementEvent) => void;
}

/** 컨테이너를 꽉 채우는 것이 이 프로젝트 차트들의 기본값이다. */
const FILL: CSSProperties = { width: '100%', height: '100%' };

/**
 * ECharts 공통 래퍼.
 *
 * 옵션을 갈아끼울 때 `notMerge` 를 켠다. 시리즈 개수가 줄어드는 경우(예: 출국장 하나가
 * 운영 종료) 병합 모드에서는 이전 시리즈가 남아 유령 선이 그려진다.
 */
export function EChart({ option, className, style, onClick }: EChartProps) {
    const events = useMemo(() => (onClick ? { click: onClick } : undefined), [onClick]);

    return (
        <ReactEChartsCore
            echarts={echarts}
            option={option}
            notMerge
            lazyUpdate
            className={className}
            style={style ? { ...FILL, ...style } : FILL}
            onEvents={events}
        />
    );
}
