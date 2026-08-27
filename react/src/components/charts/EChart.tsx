import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import type { ECElementEvent } from 'echarts/core';
import { echarts, ReactEChartsCore, type EChartsOption } from '@/lib/echarts';

export interface EChartProps {
    option: EChartsOption;
    className?: string;
    style?: CSSProperties;
    onClick?: (params: ECElementEvent) => void;
}

const FILL: CSSProperties = { width: '100%', height: '100%' };

export function EChart({ option, className, style, onClick }: EChartProps) {
    const clickRef = useRef(onClick);

    useEffect(() => {
        clickRef.current = onClick;
    }, [onClick]);

    const events = useMemo(() => ({ click: (params: ECElementEvent) => clickRef.current?.(params) }), []);

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
